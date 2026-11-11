/* SCULPT-R03 · CabinetEvidenceV1 — laboratory evidence contract for a parametric cabinet attached to ONE object of a
 * FloorPlanProjectV1. Pure: it never writes the project, never adds a field to it and is not an authority.
 *  - geometry: RubikCabinetCore (sculpted from the donor, see cabinet-core.js);
 *  - placement of the clearance envelopes: RUBIK's own FloorPlanPlacement.problems (js/furniture-placement.js), applied to
 *    the square swept by each leaf, which is the convention RUBIK already uses for room doors. The exact 90° sector is
 *    checked with RUBIK's FloorPlanLayoutReview.penetration as a lab refinement, reported but never blocking;
 *  - vertical: only a reference given by the caller (`vertical`, same shape as R02-A's CeilingLayoutEvidenceV1.vertical,
 *    or a declared value). This module derives no ceiling height (H4) and has no default.
 * Every value is tagged: computed / declared / assumed (donor default) / unknown; NOT_EVALUATED lists what is not checked;
 * previewDiff lists what a future surgery could write and why most of it is blocked today. */
(function (root) {
  'use strict';
  const node = typeof module === 'object' && typeof require === 'function';
  const K = node ? require('./cabinet-core.js') : root.RubikCabinetCore;
  const PL = node ? require('../../../js/furniture-placement.js') : root.FloorPlanPlacement;
  const LR = node ? require('../../../js/layout-review.js') : root.FloorPlanLayoutReview;
  const SCHEMA = 'rubik-sota.cabinet-evidence', VERSION = '0.1.0-lab';
  const TOL = 1; // mm, the same tolerance as FloorPlanPlacement
  // What RUBIK master@75615fd draws today for these types (index.html buildFurniture; 3D in metres).
  const RUBIK_3D_FIXED_HEIGHT_MM = Object.freeze({ wardrobe: 2200, shoecab: 1000, cabinet: 850 });
  const NOT_EVALUATED = Object.freeze(['apertura de puertas por encima de 90° (bisagra real desconocida)', 'herrajes reales: bisagras, correderas, tiradores',
    'tolerancias de fabricación y de obra', 'carga y flecha de baldas y barras', 'paso o recorrido de personas', 'normativa',
    'muebles en otras plantas', 'colocación del armario en la estancia (la decide RUBIK, no este laboratorio)']);
  const fin = Number.isFinite, r1 = v => Math.round(v * 10) / 10;
  const roundPoly = P => P.map(p => ({ x: r1(p.x), y: r1(p.y) }));

  function readVertical(v) {
    if (v == null) return { status: 'unknown', clearHeightMm: null, reference: null, source: null };
    const ok = typeof v === 'object' && ['declared', 'derived'].includes(v.status ?? 'declared') && Number.isInteger(v.clearHeightMm) && v.clearHeightMm > 0 && v.clearHeightMm <= 20000
      && ['finished-floor', 'level-floor'].includes(v.reference);
    if (!ok) return { status: 'invalid', clearHeightMm: null, reference: null, source: v && typeof v.source === 'string' ? v.source : null, input: v };
    return { status: v.status ?? 'declared', clearHeightMm: v.clearHeightMm, reference: v.reference, source: typeof v.source === 'string' ? v.source : 'not stated' };
  }
  function assumptionsUsed(status) {
    if (status !== 'proposed-default') return ['drawerAllowancesMm', 'drawerTravel', 'doorLeafRevealMm', 'doorOpeningDeg'].map(k => ({ key: k, ...K.ASSUMED[k] }));
    return Object.keys(K.ASSUMED).map(k => ({ key: k, ...K.ASSUMED[k] }));
  }
  // A clearance rectangle in the cabinet frame becomes a pseudo-object for FloorPlanPlacement (same rotation as the cabinet).
  function pseudo(object, id, P) {
    const xs = P.map(p => p.x), ys = P.map(p => p.y), cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const [c] = K.toPlan(object, [{ x: cx, y: cy }]);
    return { id, type: 'clearance', name: id, position: { x: c.x, y: c.y }, size: { widthMm: Math.max(...xs) - Math.min(...xs), depthMm: Math.max(...ys) - Math.min(...ys) }, rotationDeg: object.rotationDeg };
  }
  function sectorHits(scene, plan) {
    const out = [];
    for (const [kind, list] of [['wall', scene.walls], ['door', scene.doors], ['furniture', scene.furniture]])
      for (const item of list) { const depth = LR.penetration(plan, item.poly); if (depth > TOL) out.push({ kind, id: item.id, penetrationMm: r1(depth) }); }
    return out;
  }

  function propose({ project, objectId, cabinet = null, vertical = null, useDefaults = true } = {}) {
    if (!project || !Array.isArray(project.objects)) return { ok: false, error: { code: 'project', message: 'Se necesita un FloorPlanProjectV1 con objects[].' } };
    const index = project.objects.findIndex(o => o && o.id === objectId), object = project.objects[index];
    if (!object) return { ok: false, error: { code: 'object', message: `No existe el objeto ${objectId}.` } };
    if (!K.isCabinetType(object.type)) return { ok: false, error: { code: 'not-a-cabinet', message: `El tipo «${object.type}» no es un armario (${K.TYPES.join(', ')}).` } };
    if (![object.position?.x, object.position?.y, object.size?.widthMm, object.size?.depthMm, object.rotationDeg].every(fin)) return { ok: false, error: { code: 'geometry', message: 'Posición, tamaño o giro no válidos.' } };
    const outer = { w: object.size.widthMm, d: object.size.depthMm };
    let status, spec;
    if (cabinet != null) { status = 'declared'; spec = structuredClone(cabinet); }
    else if (useDefaults) { status = 'proposed-default'; spec = K.defaultCabinet(object.type, outer); }
    else { status = 'unknown'; spec = null; }
    const issues = spec ? K.validate(outer, spec) : [], valid = !!spec && issues.length === 0;
    if (spec && !valid) status = 'invalid';

    const v = readVertical(vertical), elevationMm = object.elevationMm ?? 0;
    const height = { cabinetHeightMm: spec && fin(spec.height) ? spec.height : null, objectHeightMm: object.size.heightMm ?? null, elevationMm,
      objectHeightConsistency: !spec || !fin(spec.height) ? 'unknown' : object.size.heightMm == null ? 'object-height-missing' : object.size.heightMm === spec.height ? 'match' : 'differs',
      vertical: v, topMm: null, fits: null, marginMm: null,
      donorWouldUse: { ceilingHeightMm: 2400, source: 'donor view calibration default (design.js defaults), clamped to 2100–4000 and unrelated to the project (H4)' } };
    if (valid) height.topMm = elevationMm + spec.height;
    if (valid && v.clearHeightMm != null) { height.fits = height.topMm <= v.clearHeightMm; height.marginMm = v.clearHeightMm - height.topMm; }

    let computed = null, clearance = null;
    if (valid) {
      const inner = K.cavity(outer, spec);
      computed = { cavity: inner, bays: K.bays(outer, spec).map(b => ({ index: b.index, kind: b.kind, xMm: r1(b.x), widthMm: r1(b.width), shelves: b.shelves.slice(), rodMm: b.rod, drawers: b.drawers, drawerHeightMm: b.drawerHeight,
        openings: K.openings(outer, spec, b), drawer: b.drawers ? K.drawerSize(outer, spec, b) : null })),
        fronts: K.fronts(outer, spec).map(f => ({ index: f.index, xMm: r1(f.x), widthMm: r1(f.width), hinge: f.right ? 'right' : 'left' })),
        hingeDrawerConflicts: K.drawerDoorConflicts(outer, spec), frontState: spec.front };
      const scene = PL.scene(project, { ignoreIds: [object.id] });
      const doors = K.swing(outer, spec).map(s => {
        const p = pseudo(object, `swing-${object.id}-${s.index}`, s.square), sector = K.toPlan(object, s.sector);
        return { index: s.index, hinge: s.hinge, leafMm: r1(s.leafMm), radiusMm: r1(s.radiusMm), openingDeg: K.ASSUMED.doorOpeningDeg.value,
          plan: { sector: roundPoly(sector), square: roundPoly(K.toPlan(object, s.square)), donorSlab: roundPoly(K.toPlan(object, s.donorSlab)) },
          areaMm2: { sector: Math.round(s.areaMm2.sector), square: Math.round(s.areaMm2.square), donorSlab: Math.round(s.areaMm2.donorSlab) },
          rubikSquareProblems: PL.problems(project, p, { ignoreIds: [object.id] }).map(x => ({ kind: x.kind, id: x.id ?? null, detail: x.detail })),
          sectorHits: sectorHits(scene, sector) };
      });
      const drawers = K.drawerReach(outer, spec).map(d => ({ bay: d.bay, extensionMm: r1(d.extensionMm),
        plan: { body: d.body ? roundPoly(K.toPlan(object, d.body)) : null, front: roundPoly(K.toPlan(object, d.front)) },
        rubikProblems: d.body ? PL.problems(project, pseudo(object, `drawer-${object.id}-${d.bay}`, d.body), { ignoreIds: [object.id] }).map(x => ({ kind: x.kind, id: x.id ?? null, detail: x.detail })) : [] }));
      clearance = { method: 'FloorPlanPlacement.problems on the square swept by each leaf (RUBIK convention) + LayoutReview.penetration on the exact sector (lab refinement)',
        applies: 'always: a door needs its swing whether the 3D shows it open or closed (H2)', doors, drawers,
        blockedBy: [...new Set([...doors.flatMap(d => d.rubikSquareProblems.map(x => x.kind + (x.id ? ':' + x.id : ''))), ...drawers.flatMap(d => d.rubikProblems.map(x => x.kind + (x.id ? ':' + x.id : '')))])].sort() };
    }
    const notEvaluated = [...NOT_EVALUATED];
    if (height.fits === null) notEvaluated.unshift('altura libre (sin referencia vertical verificada)');
    const candidates = [];
    if (valid && height.objectHeightConsistency !== 'match') candidates.push({ path: `/objects/${index}/size/heightMm`, op: 'would-set', from: object.size.heightMm ?? null, to: spec.height,
      status: height.objectHeightConsistency === 'object-height-missing' || height.objectHeightConsistency === 'differs' ? 'candidate-reviewable' : 'pending', reason: 'size.heightMm existe en el contrato; el valor del armario es ' + (status === 'declared' ? 'declarado' : 'un valor por defecto del donante') });
    candidates.push({ path: null, op: 'none', status: 'blocked', reason: 'FloorPlanProjectV1 define objects con additionalProperties:false: no hay campo canónico para el interior del armario; guardarlo exigiría cambiar el esquema (no autorizado).' });
    const rubikToday = { placementProblems: PL.problems(project, object).map(x => x.kind + (x.id ? ':' + x.id : '')), placementChecksHeight: !PL.NOT_CHECKED.includes('altura libre'),
      drawn3dHeightMm: RUBIK_3D_FIXED_HEIGHT_MM[object.type] ?? null, drawn3dNote: object.type in RUBIK_3D_FIXED_HEIGHT_MM ? 'altura fija en index.html, ignora size.heightMm' : 'tipo sin rama propia: caja genérica',
      interior: 'none', doorSwing: 'none' };
    const evidence = { schema: SCHEMA, version: VERSION, canonical: false, units: 'mm',
      source: { donor: 'caikaidev/floorplan-3d@2495d8e0bf7d3846d2da827121c15e3e83d752bd (PR wy51ai/floorplan-3d#11)', sculpt: 'labs/sculpt/r03-cabinets/cabinet-core.js', rights: 'MIT (wuyi) + contribution under GitHub ToS D.6; see PROVENANCE.md' },
      object: { id: object.id, type: object.type, name: object.name ?? null, position: { ...object.position }, rotationDeg: object.rotationDeg, size: { ...object.size }, elevationMm },
      cabinet: { status, spec, issues, assumptions: spec ? assumptionsUsed(status) : [] }, computed, height, clearance, notEvaluated,
      previewDiff: { applied: false, candidates }, rubikToday };
    return { ok: true, evidence };
  }

  // Invariants of an evidence object; [] means coherent.
  function validate(e) {
    const bad = [], add = m => bad.push(m);
    if (!e || e.schema !== SCHEMA) return ['schema'];
    if (e.canonical !== false) add('canonical');
    if (e.previewDiff?.applied !== false) add('applied');
    for (const c of e.previewDiff?.candidates || []) { if (!['would-set', 'none'].includes(c.op)) add('op'); if (c.status === 'blocked' && c.op !== 'none') add('blocked-op'); if (c.op === 'none' && c.status !== 'blocked') add('none-status'); }
    const st = e.cabinet?.status;
    if (!['declared', 'proposed-default', 'invalid', 'unknown'].includes(st)) add('cabinet-status');
    if ((st === 'declared' || st === 'proposed-default') !== !!e.computed) add('computed-presence');
    if (st === 'invalid' && !(e.cabinet.issues || []).length) add('invalid-without-issues');
    if (e.computed) {
      const c = e.cabinet.spec, w = e.object.size.widthMm, sum = e.computed.bays.reduce((s, b) => s + b.widthMm, 0) + (e.computed.bays.length + 1) * c.thickness;
      if (Math.abs(sum - w) > 0.5) add('width-balance');
      for (const b of e.computed.bays) { const used = b.openings.reduce((s, o) => s + o.height, 0) + b.shelves.length * c.thickness + b.drawers * b.drawerHeightMm; if (Math.abs(used - e.computed.cavity.height) > 0.5) add('height-balance:' + b.index); }
      for (const d of e.clearance.doors) for (const P of Object.values(d.plan)) if (!P.every(p => fin(p.x) && fin(p.y))) add('plan-finite:' + d.index);
    }
    const known = e.height?.vertical?.clearHeightMm != null && !!e.computed;
    if (known !== (e.height?.fits !== null)) add('fits-vs-vertical');
    if (!known && !e.notEvaluated.some(x => x.startsWith('altura libre'))) add('not-evaluated-height');
    return bad;
  }
  const api = { SCHEMA, VERSION, NOT_EVALUATED, RUBIK_3D_FIXED_HEIGHT_MM, readVertical, propose, validate };
  if (node && module.exports) module.exports = api; else root.RubikCabinetEvidence = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
