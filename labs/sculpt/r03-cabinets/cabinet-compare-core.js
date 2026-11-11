/* SCULPT-R03 · comparator on the same scenario:
 *  - donor: the VERBATIM workshop/design.js (global HomeDesign) on the donor's own data model {type,w,d,cx,cy,rot,cabinet};
 *  - sculpt: RubikCabinetCore, the same arithmetic made pure;
 *  - evidence: CabinetEvidenceV1;
 *  - RUBIK today (master@75615fd): FloorPlanPlacement for the box, fixed 3D height, no interior, no front swing.
 * It measures; it does not judge. Pure. */
(function (root) {
  'use strict';
  const node = typeof module === 'object' && typeof require === 'function';
  const D = node ? require('./workshop/design.js') : root.HomeDesign;
  const K = node ? require('./cabinet-core.js') : root.RubikCabinetCore;
  const E = node ? require('./cabinet-evidence-core.js') : root.RubikCabinetEvidence;
  const LR = node ? require('../../../js/layout-review.js') : root.FloorPlanLayoutReview;
  const T = node ? require('../../../js/tracing-core.js') : root.FloorPlanTracing;
  const near = (a, b) => Math.abs(a - b) < 1e-6;
  const sameDeep = (a, b) => JSON.stringify(a, (k, v) => typeof v === 'number' ? Math.round(v * 1e6) / 1e6 : v) === JSON.stringify(b, (k, v) => typeof v === 'number' ? Math.round(v * 1e6) / 1e6 : v);
  const toDonor = (o, cabinet) => ({ id: o.id, type: o.type, name: o.name, cx: o.position.x, cy: o.position.y, w: o.size.widthMm, d: o.size.depthMm, rot: o.rotationDeg, cabinet: structuredClone(cabinet) });
  const rectPoly = r => T.footprint({ position: { x: r.cx, y: r.cy }, size: { widthMm: r.w, depthMm: r.d }, rotationDeg: r.rot });
  function donorValidate(f) { try { D.validateCabinet(f, f.cabinet); return null; } catch (e) { return String(e.message); } }

  function compare(scenario) {
    const r = E.propose({ project: scenario.project, objectId: scenario.objectId, cabinet: scenario.cabinet ?? null, vertical: scenario.vertical ?? null });
    if (!r.ok) return { error: r.error };
    const ev = r.evidence, o = scenario.project.objects.find(x => x.id === scenario.objectId), outer = { w: o.size.widthMm, d: o.size.depthMm };
    const spec = ev.cabinet.spec, f = toDonor(o, spec), donorError = donorValidate(f);
    const parity = { validation: (donorError === null) === (ev.cabinet.issues.length === 0) && (donorError === null || donorError === ev.cabinet.issues[0].message) };
    if (!donorError) {
      parity.cavity = sameDeep(D.cavity(f, f.cabinet), K.cavity(outer, spec));
      parity.bays = sameDeep(D.bays(f).map(b => ({ x: b.x, width: b.width, bottom: b.bottom })), K.bays(outer, spec).map(b => ({ x: b.x, width: b.width, bottom: b.bottom })));
      parity.openings = D.bays(f).every((b, i) => sameDeep(D.openings(f, b), K.openings(outer, spec, K.bays(outer, spec)[i])));
      parity.drawerSize = D.bays(f).every((b, i) => sameDeep(D.drawerSize(f, b), K.drawerSize(outer, spec, K.bays(outer, spec)[i])));
      parity.fronts = sameDeep(D.fronts(f).map(x => ({ x: x.x, width: x.width, right: x.right })), K.fronts(outer, spec).map(x => ({ x: x.x, width: x.width, right: x.right })));
      parity.hingeConflicts = sameDeep(D.drawerDoorConflicts(f), K.drawerDoorConflicts(outer, spec));
    }
    // Donor clearance: obstacles exist only while the 3D front state is 'open', and doors are 18 mm slabs (H2).
    const others = scenario.project.objects.filter(x => x.id !== o.id);
    const donorSees = state => {
      if (donorError) return null;
      const obs = D.furnitureObstacles({ ...f, cabinet: { ...f.cabinet, front: state } }).slice(1).map(rectPoly);
      return others.filter(x => obs.some(P => LR.penetration(P, T.footprint(x)) > 1)).map(x => x.id);
    };
    const evidenceSees = ev.clearance ? [...new Set(ev.clearance.doors.flatMap(d => d.sectorHits.filter(h => h.kind === 'furniture').map(h => h.id)))] : null;
    return {
      title: scenario.title, cabinetStatus: ev.cabinet.status, issues: ev.cabinet.issues.map(i => i.code),
      donor: { validation: donorError ?? 'ok', furnitureInClearance: { closed: donorSees('closed'), open: donorSees('open') }, ceilingUsedMm: 2400, warnsHeight: spec && Number.isFinite(spec.height) ? spec.height > 2400 : null },
      sculpt: { parity },
      evidence: { furnitureInClearance: evidenceSees, blockedBy: ev.clearance ? ev.clearance.blockedBy : null, fits: ev.height.fits, marginMm: ev.height.marginMm, vertical: ev.height.vertical.status, previewDiff: ev.previewDiff.candidates.map(c => c.status + ':' + c.op) },
      rubikToday: ev.rubikToday, evidenceObject: ev
    };
  }
  const api = { toDonor, compare, near };
  if (node && module.exports) module.exports = api; else root.RubikR03Compare = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
