/* SCULPT-R02-A · comparator: donor behaviour vs RUBIK interpretation vs RUBIK today, on the same scenario.
 *  - donor: the verbatim rule D (clear-height assertion, extract text executed as written) and the donor 3D vertical
 *    formula F (top = H − drop, bottom = top − h, curtain hanging below the track), on the donor's own data model;
 *  - adapter: CeilingLayoutEvidenceV1;
 *  - RUBIK today: FloorPlanPlacement.problems() (js/furniture-placement.js, master@75615fd), which treats every object
 *    as floor furniture and declares «altura libre» NOT checked. RUBIK 3D draws `acwall` at a fixed 2.2 m (index.html).
 * It measures and reports differences; it does not judge quality. Pure.
 */
(function (root) {
  'use strict';
  const node = typeof module === 'object' && typeof require === 'function';
  const E = node ? require('./ceiling-layout-evidence-core.js') : root.RubikCeilingLayoutEvidence;
  const PL = node ? require('../../../js/furniture-placement.js') : root.FloorPlanPlacement;
  const RUBIK_ACWALL_FIXED_MM = 2200; // index.html, case 'acwall': geo.translate(..., 2.2, ...) in metres

  // Rule D, executed verbatim. `ruleText` is the line from workshop/donor-rules-reference.txt (extract D).
  function donorRule(ruleText) {
    const fn = new Function('s', 'p', 'assert', ruleText);
    return (furniture, height, floorFinish = 0) => {
      try { fn({ furniture }, { height, floorFinish }, (ok, msg) => { if (!ok) throw new Error(msg); }); return { ok: true }; }
      catch (e) { return { ok: false, message: String(e.message) }; }
    };
  }
  // Donor 3D (extract F), in mm: H = height − floorFinish; top = H − drop; base = top − h; cloth from base down `length`.
  function donor3d(f, height, floorFinish = 0) {
    const H = height - floorFinish, h = f.h || 100, top = H - (f.ceilingDrop || 0), base = top - h;
    const curtain = ['curtaintrack', 'curtainbox'].includes(f.type) ? (f.curtainLength || 2000) : 0;
    return { topMm: top, bottomMm: base, lowestPointMm: base - curtain };
  }
  const toDonor = p => ({ id: p.id, type: p.type, layer: 'ceiling', cx: p.position.x, cy: p.position.y, w: p.size.widthMm, d: p.size.depthMm, h: p.size.heightMm, rot: p.rotationDeg,
    ceilingDrop: p.mount.dropMm, ...(p.mount.curtainLengthMm != null ? { curtainLength: p.mount.curtainLengthMm } : {}) });

  function compare(scenario, { ruleText, levelId = null } = {}) {
    const input = scenario.building ? { building: scenario.building, levelId: levelId || scenario.building.levels[0].id } : { project: scenario.project, ceiling: scenario.ceiling };
    const r = E.propose({ ...input, requests: scenario.requests });
    if (!r.ok) return { error: r.error };
    const ev = r.evidence, project = scenario.building ? scenario.building.levels.find(l => l.id === input.levelId).project : scenario.project;
    const rule = ruleText ? donorRule(ruleText) : null, clear = ev.vertical.clearHeightMm;
    const rows = ev.proposals.map(p => {
      const row = { id: p.id, type: p.type, adapter: { mount: p.mount.status, topMm: p.mount.topMm, bottomMm: p.mount.bottomMm, lowestPointMm: p.mount.lowestPointMm, fits: p.mount.fitsClearHeight, plan: p.plan.suggestion.status, warnings: p.warnings } };
      if (p.mount.status === 'computed') {
        const f = toDonor(p), d3 = donor3d(f, clear);
        row.donor = { ...d3, rule: rule ? rule([f], clear).ok : null };
        row.parity = { vertical: d3.topMm === p.mount.topMm && d3.bottomMm === p.mount.bottomMm && d3.lowestPointMm === p.mount.lowestPointMm, rule: rule ? row.donor.rule === p.mount.fitsClearHeight : null };
      } else row.donor = { note: 'the donor would assume drop 0, h 100 and curtain 2000 where data is missing; the adapter reports unknown instead' };
      // RUBIK today: the same item as a FloorPlanProjectV1 object, checked by the floor placement.
      const obj = { id: 'cmp_' + p.id, type: p.type, name: p.type, position: { x: Math.round(p.position.x), y: Math.round(p.position.y) }, size: { widthMm: p.size.widthMm, depthMm: p.size.depthMm, heightMm: p.size.heightMm }, rotationDeg: Math.round(p.rotationDeg) % 360 };
      let problems; try { problems = PL.problems(project, obj).map(x => x.kind + (x.id ? ':' + x.id : '')); } catch (e) { problems = ['error:' + String(e.message).slice(0, 80)]; }
      row.rubikToday = { problems, heightChecked: !PL.NOT_CHECKED.includes('altura libre'), drawnAtMm: p.type === 'acwall' ? RUBIK_ACWALL_FIXED_MM : (p.type in E.CATALOG ? 'on the floor (no ceiling layer)' : null) };
      return row;
    });
    return { vertical: ev.vertical.status, clearHeightMm: clear, rows, evidence: ev };
  }

  const api = { RUBIK_ACWALL_FIXED_MM, donorRule, donor3d, toDonor, compare };
  if (node && module.exports) module.exports = api; else root.RubikR02Compare = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
