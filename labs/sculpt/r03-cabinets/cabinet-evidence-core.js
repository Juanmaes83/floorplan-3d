/* SCULPT-R03 · CabinetEvidenceV1 — laboratory evidence contract for a parametric cabinet attached to ONE object of a
 * FloorPlanProjectV1. Pure: it never writes the project, never adds a field to it and is not an authority.
 *  - geometry: RubikCabinetCore (sculpted from the donor, see cabinet-core.js);
 *  - placement: RUBIK's own FloorPlanPlacement.problems (js/furniture-placement.js) stays the authority. R03 applies it to
 *    the square swept by each leaf (the convention RUBIK already uses for room doors) and adds the exact 90° sector,
 *    measured with FloorPlanLayoutReview.penetration, as EXPERIMENTAL evidence that never blocks anything by itself;
 *  - vertical: only a reference given by the caller (`vertical`, same shape as R02-A's CeilingLayoutEvidenceV1.vertical).
 *    This module derives no ceiling height (H4) and has no default.
 * Closure cut (11/11/2026): every derived value comes from ONE pure function shared by propose() and validate(), so a
 * validated evidence is re-derived from its own inputs, never only checked for apparent self-consistency (A, B);
 * previewDiff uses the R02-A states candidate-reviewable / pending / blocked with separated blockers (C). */
(function (root) {
  'use strict';
  const node = typeof module === 'object' && typeof require === 'function';
  const K = node ? require('./cabinet-core.js') : root.RubikCabinetCore;
  const PL = node ? require('../../../js/furniture-placement.js') : root.FloorPlanPlacement;
  const LR = node ? require('../../../js/layout-review.js') : root.FloorPlanLayoutReview;
  const SCHEMA = 'rubik-sota.cabinet-evidence', VERSION = '0.2.0-lab';
  const TOL = 1; // mm, the same tolerance as FloorPlanPlacement
  // What RUBIK master@75615fd draws today for these types (index.html buildFurniture; 3D in metres).
  const RUBIK_3D_FIXED_HEIGHT_MM = Object.freeze({ wardrobe: 2200, shoecab: 1000, cabinet: 850 });
  const NOT_EVALUATED = Object.freeze(['apertura de puertas por encima de 90° (bisagra real desconocida)', 'herrajes reales: bisagras, correderas, tiradores',
    'tolerancias de fabricación y de obra', 'carga y flecha de baldas y barras', 'paso o recorrido de personas', 'normativa',
    'muebles en otras plantas', 'colocación del armario en la estancia (la decide RUBIK, no este laboratorio)']);
  const HEIGHT_NOT_EVALUATED = 'altura libre (sin referencia vertical comparable y acreditada)';
  const CABINET_STATUS = ['declared', 'proposed-default', 'invalid', 'unknown'];
  const VERTICAL_STATUS = ['unknown', 'invalid', 'unsourced', 'declared', 'derived'];
  const CHECK_STATUS = ['evaluated', 'pending', 'not-applicable', 'invalid'];
  const CANDIDATE_STATUS = ['candidate-reviewable', 'pending', 'blocked'];
  const LIMITS = Object.freeze({ clearMaxMm: 20000, elevationMaxMm: 10000, objectHeightMaxMm: 10000 });
  const fin = Number.isFinite, isInt = Number.isInteger, r1 = v => Math.round(v * 10) / 10;
  const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  const isArr = Array.isArray;
  const roundPoly = P => P.map(p => ({ x: r1(p.x), y: r1(p.y) }));
  // Structural equality that keeps NaN, ±Infinity, −0 and undefined distinct (JSON would turn them into null).
  function same(a, b) {
    if (typeof a === 'number' || typeof b === 'number') return typeof a === typeof b && (Object.is(a, b) || (a === b));
    if (a === b) return true;
    if (isArr(a) !== isArr(b) || typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
    if (isArr(a)) return a.length === b.length && a.every((x, i) => same(x, b[i]));
    const ka = Object.keys(a).sort(), kb = Object.keys(b).sort();
    return ka.length === kb.length && ka.every((k, i) => k === kb[i] && same(a[k], b[k]));
  }

  // ---- vertical (A) ----
  // Normalises the caller's reference. Distinguishes: unknown (no reference), invalid (bad data, with a stable problem
  // code), unsourced (numbers given but no provenance: never verifiable), declared / derived (with a stated source).
  function readVertical(v) {
    const invalid = problem => ({ status: 'invalid', clearHeightMm: null, reference: null, source: null, problem });
    if (v === null || v === undefined) return { status: 'unknown', clearHeightMm: null, reference: null, source: null };
    if (!isObj(v)) return invalid('not-an-object');
    const status = v.status === undefined ? 'declared' : v.status;
    if (status !== 'declared' && status !== 'derived') return invalid('status');
    if (!isInt(v.clearHeightMm) || v.clearHeightMm <= 0 || v.clearHeightMm > LIMITS.clearMaxMm) return invalid('clear-height');
    if (v.reference !== 'finished-floor' && v.reference !== 'level-floor') return invalid('reference');
    const sourced = typeof v.source === 'string' && v.source.trim() !== '' && v.source.trim().toLowerCase() !== 'not stated';
    return sourced ? { status, clearHeightMm: v.clearHeightMm, reference: v.reference, source: v.source }
      : { status: 'unsourced', clearHeightMm: v.clearHeightMm, reference: v.reference, source: null, claimed: status };
  }
  // The object's base. elevationMm is optional in FloorPlanProjectV1 (integer 0–10000, default 0).
  function readElevation(object) {
    const v = object.elevationMm;
    if (v === undefined) return { elevationMm: 0, source: 'schema-default' };
    return isInt(v) && v >= 0 && v <= LIMITS.elevationMaxMm ? { elevationMm: v, source: 'declared' } : { elevationMm: null, source: 'invalid' };
  }
  function objectHeightConsistency(objectHeight, cabinetHeight) {
    if (cabinetHeight === null) return 'unknown';
    if (objectHeight === undefined || objectHeight === null) return 'object-height-missing';
    if (!(isInt(objectHeight) && objectHeight >= 1 && objectHeight <= LIMITS.objectHeightMaxMm)) return 'object-height-invalid';
    return objectHeight === cabinetHeight ? 'match' : 'differs';
  }
  /* THE vertical rule, used by propose() and validate(). The object stands on the finished floor of its level: a
     'finished-floor' clear height is directly comparable; a 'level-floor' one (structural floor, e.g. derived from the
     building) needs the floor finish, which nobody gives us → pending, never an invented fit. */
  function verticalCheck(cabinetHeightMm, elevation, vertical) {
    const out = (status, reason, extra = {}) => ({ status, reason, topMm: null, fits: null, marginMm: null, ...extra });
    if (cabinetHeightMm === null) return out('not-applicable', 'cabinet-invalid');
    if (elevation.source === 'invalid') return out('invalid', 'elevation-invalid');
    const topMm = elevation.elevationMm + cabinetHeightMm;
    if (vertical.status === 'unknown') return out('pending', 'vertical-unknown', { topMm });
    if (vertical.status === 'invalid') return out('invalid', 'vertical-invalid:' + vertical.problem, { topMm });
    if (vertical.status === 'unsourced') return out('pending', 'vertical-unsourced', { topMm });
    if (vertical.reference !== 'finished-floor') return out('pending', 'reference-not-comparable', { topMm });
    const marginMm = vertical.clearHeightMm - topMm;
    return out('evaluated', marginMm >= 0 ? 'fits' : 'does-not-fit', { topMm, fits: marginMm >= 0, marginMm });
  }
  function heightBlock(object, spec, valid, vertical) {
    const cabinetHeightMm = valid ? spec.height : null, elevation = readElevation(object), check = verticalCheck(cabinetHeightMm, elevation, vertical);
    return { cabinetHeightMm, objectHeightMm: object.size.heightMm === undefined ? null : object.size.heightMm, elevationMm: elevation.elevationMm, elevationSource: elevation.source,
      objectHeightConsistency: objectHeightConsistency(object.size.heightMm, cabinetHeightMm), vertical, check: { status: check.status, reason: check.reason },
      topMm: check.topMm, fits: check.fits, marginMm: check.marginMm,
      donorWouldUse: { ceilingHeightMm: 2400, source: 'donor view calibration default (design.js defaults), clamped to 2100–4000 and unrelated to the project (H4)' } };
  }

  // ---- pure derived blocks shared with validate() (B) ----
  function interior(outer, spec) {
    return { cavity: K.cavity(outer, spec), bays: K.bays(outer, spec).map(b => ({ index: b.index, kind: b.kind, xMm: r1(b.x), widthMm: r1(b.width), shelves: b.shelves.slice(), rodMm: b.rod, drawers: b.drawers, drawerHeightMm: b.drawerHeight,
      openings: K.openings(outer, spec, b), drawer: b.drawers ? K.drawerSize(outer, spec, b) : null })),
      fronts: K.fronts(outer, spec).map(f => ({ index: f.index, xMm: r1(f.x), widthMm: r1(f.width), hinge: f.right ? 'right' : 'left' })),
      hingeDrawerConflicts: K.drawerDoorConflicts(outer, spec), frontState: spec.front };
  }
  // Geometry of the swing and drawer envelopes in plan (no project needed).
  function clearanceGeometry(object, outer, spec) {
    return {
      doors: K.swing(outer, spec).map(s => ({ index: s.index, hinge: s.hinge, leafMm: r1(s.leafMm), radiusMm: r1(s.radiusMm), openingDeg: K.ASSUMED.doorOpeningDeg.value,
        plan: { sector: roundPoly(K.toPlan(object, s.sector)), square: roundPoly(K.toPlan(object, s.square)), donorSlab: roundPoly(K.toPlan(object, s.donorSlab)) },
        areaMm2: { sector: Math.round(s.areaMm2.sector), square: Math.round(s.areaMm2.square), donorSlab: Math.round(s.areaMm2.donorSlab) }, local: s })),
      drawers: K.drawerReach(outer, spec).map(d => ({ bay: d.bay, extensionMm: r1(d.extensionMm),
        plan: { body: d.body ? roundPoly(K.toPlan(object, d.body)) : null, front: roundPoly(K.toPlan(object, d.front)) }, local: d }))
    };
  }
  // A clearance rectangle in the cabinet frame becomes a pseudo-object for FloorPlanPlacement (same rotation as the cabinet).
  function pseudo(object, id, P) {
    const xs = P.map(p => p.x), ys = P.map(p => p.y), cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const [c] = K.toPlan(object, [{ x: cx, y: cy }]);
    return { id, type: 'clearance', name: id, position: { x: c.x, y: c.y }, size: { widthMm: Math.max(...xs) - Math.min(...xs), depthMm: Math.max(...ys) - Math.min(...ys) }, rotationDeg: object.rotationDeg };
  }
  const tag = x => x.kind + (x.id ? ':' + x.id : '');
  function clearanceBlock(project, object, outer, spec) {
    const g = clearanceGeometry(object, outer, spec), scene = PL.scene(project, { ignoreIds: [object.id] });
    const sectorHits = P => { const out = []; for (const [kind, list] of [['wall', scene.walls], ['door', scene.doors], ['furniture', scene.furniture]]) for (const it of list) { const depth = LR.penetration(P, it.poly); if (depth > TOL) out.push({ kind, id: it.id, penetrationMm: r1(depth) }); } return out; };
    const problems = p => PL.problems(project, p, { ignoreIds: [object.id] }).map(x => ({ kind: x.kind, id: x.id ?? null, detail: x.detail }));
    const doors = g.doors.map(({ local, ...d }) => ({ ...d, rubikSquareProblems: problems(pseudo(object, `swing-${object.id}-${d.index}`, local.square)), sectorHits: sectorHits(d.plan.sector) }));
    const drawers = g.drawers.map(({ local, ...d }) => ({ ...d, rubikProblems: local.body ? problems(pseudo(object, `drawer-${object.id}-${d.bay}`, local.body)) : [] }));
    const uniq = a => [...new Set(a)].sort();
    return { method: 'FloorPlanPlacement.problems on the square swept by each leaf (RUBIK convention, conservative) + LayoutReview.penetration on the exact 90° sector (experimental)',
      applies: 'always: a door needs its swing whether the 3D shows it open or closed (H2)', doors, drawers,
      findings: { doorSquare: uniq(doors.flatMap(d => d.rubikSquareProblems.map(tag))), doorSector: uniq(doors.flatMap(d => d.sectorHits.map(tag))), drawers: uniq(drawers.flatMap(d => d.rubikProblems.map(tag))) },
      interpretation: 'El cuadrado contiene al sector. Un hallazgo solo en el cuadrado puede ser conservador; uno en el sector es una intersección geométrica con apertura de 90°. Ninguno es una autoridad del producto ni afecta a la altura.' };
  }

  // ---- previewDiff (C) and summary ----
  function independentIssues(rubikPlacement, computed, clearance) {
    const out = [];
    if (rubikPlacement.length) out.push({ kind: 'box-placement', authority: 'FloorPlanPlacement', items: rubikPlacement.slice() });
    if (clearance && clearance.findings.doorSquare.length) out.push({ kind: 'door-swing-square', authority: 'FloorPlanPlacement (convención de RUBIK aplicada al barrido)', items: clearance.findings.doorSquare.slice() });
    if (clearance && clearance.findings.doorSector.length) out.push({ kind: 'door-swing-sector', authority: 'experimental R03', items: clearance.findings.doorSector.slice() });
    if (clearance && clearance.findings.drawers.length) out.push({ kind: 'drawer-reach', authority: 'FloorPlanPlacement', items: clearance.findings.drawers.slice() });
    if (computed && computed.hingeDrawerConflicts.length) out.push({ kind: 'hinge-drawer', authority: 'regla del donante', items: computed.hingeDrawerConflicts.map(b => 'bay:' + b) });
    return out;
  }
  function candidates(index, cabinetStatus, spec, height, independent) {
    const out = [];
    const target = spec && fin(spec.height) ? spec.height : null;
    if (spec && cabinetStatus !== 'unknown' && ['differs', 'object-height-missing', 'object-height-invalid'].includes(objectHeightConsistency(height.objectHeightMm ?? undefined, target))) {
      const blockers = [], pendingOn = [];
      if (cabinetStatus === 'invalid') blockers.push({ kind: 'cabinet', code: 'cabinet-invalid' });
      if (!(isInt(target) && target >= 1 && target <= LIMITS.objectHeightMaxMm)) blockers.push({ kind: 'target', code: 'target-invalid' });
      if (height.check.status === 'evaluated' && height.fits === false) blockers.push({ kind: 'vertical', code: 'does-not-fit', marginMm: height.marginMm });
      else if (height.check.status === 'invalid') blockers.push({ kind: 'vertical', code: height.check.reason });
      else if (height.check.status === 'pending') pendingOn.push({ kind: 'vertical', code: height.check.reason });
      const status = blockers.length ? 'blocked' : pendingOn.length ? 'pending' : 'candidate-reviewable';
      out.push({ id: 'object-height', path: `/objects/${index}/size/heightMm`, op: status === 'candidate-reviewable' ? 'would-set' : 'none', status,
        from: height.objectHeightMm, to: target, blockers, pendingOn,
        independentIssues: independent.map(i => ({ ...i, items: i.items.slice() })),
        reason: 'size.heightMm existe en el contrato; el valor del armario es ' + (cabinetStatus === 'declared' ? 'declarado' : cabinetStatus === 'proposed-default' ? 'un valor por defecto del donante' : 'de una distribución no válida') +
          '. La huella en planta no cambia: los problemas de colocación y barrido se listan aparte y no deciden esta operación.' });
    }
    out.push({ id: 'interior', path: null, op: 'none', status: 'blocked', from: null, to: null, blockers: [{ kind: 'schema', code: 'no-canonical-field' }], pendingOn: [], independentIssues: [],
      reason: 'FloorPlanProjectV1 define objects con additionalProperties:false: no hay campo canónico para el interior del armario; guardarlo exigiría cambiar el esquema (no autorizado).' });
    return out;
  }
  function summary(cabinetStatus, height, independent) {
    const blocking = [], notEvaluated = [], experimental = [];
    if (cabinetStatus === 'invalid') blocking.push({ kind: 'cabinet', code: 'cabinet-invalid' });
    if (height.check.status === 'evaluated' && height.fits === false) blocking.push({ kind: 'vertical', code: 'does-not-fit' });
    if (height.check.status === 'invalid') blocking.push({ kind: 'vertical', code: height.check.reason });
    if (height.check.status === 'pending') notEvaluated.push({ kind: 'vertical', code: height.check.reason });
    for (const i of independent) (i.kind === 'door-swing-sector' ? experimental : blocking).push({ kind: i.kind, code: i.items.join(',') });
    const state = cabinetStatus === 'unknown' ? 'incomplete' : cabinetStatus === 'invalid' ? 'invalid' : blocking.length ? 'issues' : (notEvaluated.length || experimental.length) ? 'clear-with-pending' : 'clear';
    return { state, blocking, notEvaluated, experimental };
  }
  function assumptionsUsed(status) {
    if (status !== 'proposed-default') return ['drawerAllowancesMm', 'drawerTravel', 'doorLeafRevealMm', 'doorOpeningDeg'].map(k => ({ key: k, ...K.ASSUMED[k] }));
    return Object.keys(K.ASSUMED).map(k => ({ key: k, ...K.ASSUMED[k] }));
  }

  function propose({ project, objectId, cabinet = null, vertical = null, useDefaults = true } = {}) {
    if (!isObj(project) || !isArr(project.objects)) return { ok: false, error: { code: 'project', message: 'Se necesita un FloorPlanProjectV1 con objects[].' } };
    const index = project.objects.findIndex(o => isObj(o) && o.id === objectId), object = project.objects[index];
    if (!object) return { ok: false, error: { code: 'object', message: `No existe el objeto ${objectId}.` } };
    if (!K.isCabinetType(object.type)) return { ok: false, error: { code: 'not-a-cabinet', message: `El tipo «${object.type}» no es un armario (${K.TYPES.join(', ')}).` } };
    if (!isObj(object.position) || !isObj(object.size) || ![object.position.x, object.position.y, object.size.widthMm, object.size.depthMm, object.rotationDeg].every(fin) || object.size.widthMm <= 0 || object.size.depthMm <= 0)
      return { ok: false, error: { code: 'geometry', message: 'Posición, tamaño o giro no válidos.' } };
    const outer = { w: object.size.widthMm, d: object.size.depthMm };
    let status, spec;
    if (cabinet != null) { status = 'declared'; spec = structuredClone(cabinet); }
    else if (useDefaults) { status = 'proposed-default'; spec = K.defaultCabinet(object.type, outer); }
    else { status = 'unknown'; spec = null; }
    const issues = spec ? K.validate(outer, spec) : [], valid = !!spec && issues.length === 0;
    if (spec && !valid) status = 'invalid';
    const height = heightBlock(object, spec, valid, readVertical(vertical));
    const computed = valid ? interior(outer, spec) : null, clearance = valid ? clearanceBlock(project, object, outer, spec) : null;
    const notEvaluated = height.check.status === 'evaluated' ? [...NOT_EVALUATED] : [HEIGHT_NOT_EVALUATED, ...NOT_EVALUATED];
    const placement = PL.problems(project, object).map(tag), independent = independentIssues(placement, computed, clearance);
    const rubikToday = { placementProblems: placement, placementChecksHeight: !PL.NOT_CHECKED.includes('altura libre'),
      drawn3dHeightMm: RUBIK_3D_FIXED_HEIGHT_MM[object.type] ?? null, drawn3dNote: object.type in RUBIK_3D_FIXED_HEIGHT_MM ? 'altura fija en index.html, ignora size.heightMm' : 'tipo sin rama propia: caja genérica',
      interior: 'none', doorSwing: 'none' };
    const evidence = { schema: SCHEMA, version: VERSION, canonical: false, units: 'mm',
      source: { donor: 'caikaidev/floorplan-3d@2495d8e0bf7d3846d2da827121c15e3e83d752bd (PR wy51ai/floorplan-3d#11)', sculpt: 'labs/sculpt/r03-cabinets/cabinet-core.js', rights: 'MIT (wuyi) + contribution under GitHub ToS D.6; see PROVENANCE.md' },
      object: { id: object.id, type: object.type, name: object.name ?? null, position: { x: object.position.x, y: object.position.y }, rotationDeg: object.rotationDeg, size: { ...object.size }, ...(object.elevationMm !== undefined ? { elevationMm: object.elevationMm } : {}) },
      cabinet: { status, spec, issues, assumptions: spec ? assumptionsUsed(status) : [] }, computed, height, clearance, notEvaluated,
      previewDiff: { applied: false, candidates: candidates(index, status, spec, height, independent) }, summary: summary(status, height, independent), rubikToday };
    return { ok: true, evidence };
  }

  /* Invariants of an evidence object; [] means coherent. Never throws on malformed data: every access is guarded and
     every derived value is recomputed from the evidence's own inputs (object, spec, vertical) with the SAME functions
     propose() uses. With `context` (the propose() arguments, including the project) the whole evidence is re-derived and
     compared, which also covers placement results that need the project. Codes are stable strings. */
  function validate(e, context) {
    const bad = [], add = code => { if (!bad.includes(code)) bad.push(code); };
    try {
      if (!isObj(e)) return ['evidence-shape'];
      if (e.schema !== SCHEMA) add('schema');
      if (e.version !== VERSION) add('version');
      if (e.canonical !== false) add('canonical');
      // object
      const o = e.object; let outer = null, objectOk = false;
      if (!isObj(o)) add('object-shape');
      else {
        if (!isObj(o.size)) add('object-size-shape');
        else if (![o.size.widthMm, o.size.depthMm].every(v => fin(v) && v > 0)) add('object-size-values');
        else outer = { w: o.size.widthMm, d: o.size.depthMm };
        if (!isObj(o.position) || ![o.position.x, o.position.y].every(fin)) add('object-position');
        if (!fin(o.rotationDeg)) add('object-rotation');
        if (!K.isCabinetType(o.type)) add('object-type');
        objectOk = !!outer && isObj(o.position) && [o.position.x, o.position.y, o.rotationDeg].every(fin);
      }
      // cabinet: status and issues re-derived with the engine
      const c = e.cabinet; let spec = null, valid = false, cabStatus = null;
      if (!isObj(c)) add('cabinet-shape');
      else {
        cabStatus = CABINET_STATUS.includes(c.status) ? c.status : null;
        if (!cabStatus) add('cabinet-status');
        if (!isArr(c.issues) || !c.issues.every(i => isObj(i) && typeof i.code === 'string')) add('cabinet-issues-shape');
        if (!isArr(c.assumptions)) add('cabinet-assumptions-shape');
        if (c.status === 'unknown') { if (c.spec !== null) add('cabinet-spec-unexpected'); }
        else if (!isObj(c.spec)) add('cabinet-spec-shape');
        else if (outer) {
          spec = c.spec;
          const issues = K.validate(outer, spec), engineValid = issues.length === 0;
          if (isArr(c.issues) && !same(issues.map(i => i.code), c.issues.map(i => isObj(i) ? i.code : null))) add('cabinet-issues-mismatch');
          if (cabStatus && engineValid === (cabStatus === 'invalid')) add('cabinet-status-mismatch');
          valid = engineValid && (cabStatus === 'declared' || cabStatus === 'proposed-default');
          if (cabStatus && isArr(c.assumptions) && !same(c.assumptions, assumptionsUsed(cabStatus))) add('cabinet-assumptions-mismatch');
        }
      }
      // computed: recomputed with the pure engine (B)
      if (valid) { if (!isObj(e.computed)) add('computed-shape'); else if (!same(e.computed, interior(outer, spec))) add('computed-mismatch'); }
      else if (e.computed !== null) add('computed-unexpected');
      // clearance: shape, geometry recomputed, findings coherent with the per-door / per-drawer results
      const cl = e.clearance;
      if (valid && objectOk) {
        if (!isObj(cl)) add('clearance-shape');
        else if (!isArr(cl.doors) || !isArr(cl.drawers) || !cl.doors.every(isObj) || !cl.drawers.every(isObj)) add('clearance-lists-shape');
        else {
          const polyOk = P => isArr(P) && P.length >= 3 && P.every(p => isObj(p) && fin(p.x) && fin(p.y));
          if (!cl.doors.every(d => isObj(d.plan) && ['sector', 'square', 'donorSlab'].every(k => polyOk(d.plan[k])))) add('clearance-polygon');
          if (!cl.drawers.every(d => isObj(d.plan) && polyOk(d.plan.front) && (d.plan.body === null || polyOk(d.plan.body)))) add('clearance-polygon');
          const g = clearanceGeometry(o, outer, spec), strip = ({ local, ...x }) => x, pick = (x, keys) => Object.fromEntries(keys.map(k => [k, x[k]]));
          const dk = ['index', 'hinge', 'leafMm', 'radiusMm', 'openingDeg', 'plan', 'areaMm2'], wk = ['bay', 'extensionMm', 'plan'];
          if (!same(cl.doors.map(d => pick(d, dk)), g.doors.map(strip)) || !same(cl.drawers.map(d => pick(d, wk)), g.drawers.map(strip))) add('clearance-geometry-mismatch');
          const lists = cl.doors.every(d => isArr(d.rubikSquareProblems) && isArr(d.sectorHits) && d.rubikSquareProblems.concat(d.sectorHits).every(x => isObj(x) && typeof x.kind === 'string')) && cl.drawers.every(d => isArr(d.rubikProblems) && d.rubikProblems.every(x => isObj(x) && typeof x.kind === 'string'));
          if (!lists) add('clearance-results-shape');
          else if (!isObj(cl.findings) || !same(cl.findings, { doorSquare: [...new Set(cl.doors.flatMap(d => d.rubikSquareProblems.map(tag)))].sort(), doorSector: [...new Set(cl.doors.flatMap(d => d.sectorHits.map(tag)))].sort(), drawers: [...new Set(cl.drawers.flatMap(d => d.rubikProblems.map(tag)))].sort() })) add('clearance-findings-mismatch');
        }
      } else if (cl !== null) add('clearance-unexpected');
      // height: re-derived with the single vertical rule (A)
      const h = e.height; let expectedHeight = null;
      if (!isObj(h)) add('height-shape');
      else if (!isObj(h.vertical)) add('vertical-shape');
      else if (objectOk) {
        const v = h.vertical, vs = VERTICAL_STATUS.includes(v.status) ? v.status : null;
        if (!vs) add('vertical-status');
        else {
          // the stored vertical must be a fixed point of readVertical (re-reading it gives itself back)
          const reread = vs === 'unknown' ? readVertical(null) : vs === 'invalid' ? { status: 'invalid', clearHeightMm: null, reference: null, source: null, problem: v.problem }
            : readVertical({ status: vs === 'unsourced' ? v.claimed : vs, clearHeightMm: v.clearHeightMm, reference: v.reference, ...(vs === 'unsourced' ? {} : { source: v.source }) });
          if (!same(reread, v) || (vs === 'invalid' && typeof v.problem !== 'string')) add('vertical-values');
          else {
            expectedHeight = heightBlock(o, spec, valid, v);
            const fields = [['cabinetHeightMm', 'vertical-cabinet-height'], ['elevationMm', 'vertical-elevation'], ['elevationSource', 'vertical-elevation'], ['objectHeightMm', 'object-height-consistency'],
              ['objectHeightConsistency', 'object-height-consistency'], ['check', 'vertical-check'], ['topMm', 'vertical-top'], ['fits', 'vertical-fits'], ['marginMm', 'vertical-margin'], ['donorWouldUse', 'height-donor-note']];
            for (const [k, code] of fields) if (!same(h[k], expectedHeight[k])) add(code);
          }
        }
      }
      // notEvaluated
      if (!isArr(e.notEvaluated) || !e.notEvaluated.every(x => typeof x === 'string')) add('not-evaluated-shape');
      else {
        if (!NOT_EVALUATED.every(x => e.notEvaluated.includes(x))) add('not-evaluated-list');
        if (expectedHeight && (expectedHeight.check.status !== 'evaluated') !== e.notEvaluated.includes(HEIGHT_NOT_EVALUATED)) add('not-evaluated-height');
      }
      // previewDiff (C): shape and state rules, then re-derivation
      const pd = e.previewDiff;
      if (!isObj(pd)) add('preview-shape');
      else {
        if (pd.applied !== false) add('applied');
        if (!isArr(pd.candidates) || !pd.candidates.every(isObj)) add('candidates-shape');
        else {
          for (const k of pd.candidates) {
            if (!CANDIDATE_STATUS.includes(k.status)) add('candidate-status');
            if (k.op !== 'would-set' && k.op !== 'none') add('candidate-op');
            if ((k.op === 'would-set') !== (k.status === 'candidate-reviewable')) add('candidate-op-status');
            if (!isArr(k.blockers) || !isArr(k.pendingOn) || !isArr(k.independentIssues)) { add('candidate-lists-shape'); continue; }
            if (k.status === 'blocked' && !k.blockers.length) add('blocked-without-blocker');
            if (k.status === 'pending' && (!k.pendingOn.length || k.blockers.length)) add('pending-incoherent');
            if (k.status === 'candidate-reviewable' && (k.blockers.length || k.pendingOn.length)) add('reviewable-with-blockers');
          }
          const interiorCandidate = pd.candidates.find(k => k.id === 'interior');
          if (!interiorCandidate || interiorCandidate.status !== 'blocked' || interiorCandidate.op !== 'none') add('interior-not-blocked');
          if (expectedHeight && cabStatus && objectOk && isObj(e.rubikToday) && isArr(e.rubikToday.placementProblems)) {
            const hc = pd.candidates.find(k => k.id === 'object-height'), m = hc && typeof hc.path === 'string' ? hc.path.match(/^\/objects\/(\d+)\/size\/heightMm$/) : null;
            if (hc && !m) add('candidate-path');
            const comp = valid && isObj(e.computed) ? e.computed : null, clr = valid && isObj(e.clearance) && isObj(e.clearance.findings) ? e.clearance : null;
            const independent = (comp && !isArr(comp.hingeDrawerConflicts)) || (clr && !['doorSquare', 'doorSector', 'drawers'].every(k => isArr(clr.findings[k]))) ? null : independentIssues(e.rubikToday.placementProblems, comp, clr);
            if (!independent) add('independent-issues-shape');
            else {
              const expected = candidates(m ? +m[1] : 0, cabStatus, spec, expectedHeight, independent);
              if (!same(pd.candidates, expected)) add('candidates-mismatch');
              if (!same(e.summary, summary(cabStatus, expectedHeight, independent))) add('summary-mismatch');
            }
          }
        }
      }
      if (context !== undefined) {
        const r = isObj(context) ? propose(context) : { ok: false };
        if (!r.ok) add('context-refused'); else if (!same(r.evidence, e)) add('recomputed-mismatch');
      }
    } catch (err) { add('validator-exception'); }
    return bad;
  }
  const api = { SCHEMA, VERSION, NOT_EVALUATED, HEIGHT_NOT_EVALUATED, RUBIK_3D_FIXED_HEIGHT_MM, readVertical, readElevation, verticalCheck, objectHeightConsistency, propose, validate, same };
  if (node && module.exports) module.exports = api; else root.RubikCabinetEvidence = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
