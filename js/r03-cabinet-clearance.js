/* R03 · Holguras de puertas y cajones de un armario (recuperado del laboratorio SCULPT-R03, lab/sculpt-r03-cabinets@fc5a4224,
 * labs/sculpt/r03-cabinets/cabinet-evidence-core.js: clearanceGeometry, pseudo, clearanceBlock, independentIssues, sin cambios de lógica).
 * PURO y de SOLO LECTURA: no escribe el proyecto, no añade campos, no propone ni aplica cambios. No es una autoridad nueva:
 *  - geometría del barrido y del alcance: RubikCabinetCore (swing, drawerReach, toPlan, drawerDoorConflicts), el mismo núcleo
 *    que dibuja el armario (idéntico byte a byte al del laboratorio);
 *  - autoridad de colocación: FloorPlanPlacement.problems de RUBIK, aplicada al CUADRADO que barre cada hoja (la convención que
 *    RUBIK ya usa para las puertas de estancia) y al cuerpo extendido de cada cajón;
 *  - el SECTOR exacto de 90° se mide con FloorPlanLayoutReview.penetration como evidencia EXPERIMENTAL que nunca bloquea nada;
 *  - el armario de cada objeto lo da el contrato R03 (FloorPlanR03Contract.read): guardado o el de por defecto de su tipo. */
(function (root) {
  'use strict';
  const node = typeof module === 'object' && typeof require === 'function';
  const K = node ? require('./r03-cabinet-core.js') : root.RubikCabinetCore;
  const PL = node ? require('./furniture-placement.js') : root.FloorPlanPlacement;
  const LR = node ? require('./layout-review.js') : root.FloorPlanLayoutReview;
  const X = node ? require('./r03-cabinet-contract.js') : root.RubikCabinetContract;
  const TOL = 1; // mm, la misma tolerancia que FloorPlanPlacement
  const r1 = v => Math.round(v * 10) / 10, roundPoly = P => P.map(p => ({ x: r1(p.x), y: r1(p.y) }));
  function clearanceGeometry(object, outer, spec) {
    return {
      doors: K.swing(outer, spec).map(s => ({ index: s.index, hinge: s.hinge, leafMm: r1(s.leafMm), radiusMm: r1(s.radiusMm), openingDeg: K.ASSUMED.doorOpeningDeg.value,
        plan: { sector: roundPoly(K.toPlan(object, s.sector)), square: roundPoly(K.toPlan(object, s.square)), donorSlab: roundPoly(K.toPlan(object, s.donorSlab)) },
        areaMm2: { sector: Math.round(s.areaMm2.sector), square: Math.round(s.areaMm2.square), donorSlab: Math.round(s.areaMm2.donorSlab) }, local: s })),
      drawers: K.drawerReach(outer, spec).map(d => ({ bay: d.bay, extensionMm: r1(d.extensionMm),
        plan: { body: d.body ? roundPoly(K.toPlan(object, d.body)) : null, front: roundPoly(K.toPlan(object, d.front)) }, local: d }))
    };
  }
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
  function independentIssues(rubikPlacement, computed, clearance) {
    const out = [];
    if (rubikPlacement.length) out.push({ kind: 'box-placement', authority: 'FloorPlanPlacement', items: rubikPlacement.slice() });
    if (clearance && clearance.findings.doorSquare.length) out.push({ kind: 'door-swing-square', authority: 'FloorPlanPlacement (convención de RUBIK aplicada al barrido)', items: clearance.findings.doorSquare.slice() });
    if (clearance && clearance.findings.doorSector.length) out.push({ kind: 'door-swing-sector', authority: 'experimental R03', items: clearance.findings.doorSector.slice() });
    if (clearance && clearance.findings.drawers.length) out.push({ kind: 'drawer-reach', authority: 'FloorPlanPlacement', items: clearance.findings.drawers.slice() });
    if (computed && computed.hingeDrawerConflicts.length) out.push({ kind: 'hinge-drawer', authority: 'regla del donante', items: computed.hingeDrawerConflicts.map(b => 'bay:' + b) });
    return out;
  }
  /* Análisis de un objeto del proyecto. Estados: 'evaluated' (con hallazgos o sin ellos), o el estado del contrato cuando no
     hay un armario evaluable ('not-cabinet', 'unknown-object', 'invalid', 'future', o 'invalid-cabinet' si su forma no valida). */
  function analyze(project, objectId) {
    const r = X.read(project, objectId);
    if (!r.cabinet || !r.outer) return { status: r.status, objectId, applied: false };
    const object = (project.objects || []).find(o => o.id === objectId);
    if (K.validate(r.outer, r.cabinet).length) return { status: 'invalid-cabinet', objectId, applied: false };
    const clearance = clearanceBlock(project, object, r.outer, r.cabinet), conflicts = K.drawerDoorConflicts(r.outer, r.cabinet);
    const issues = independentIssues(PL.problems(project, object).map(tag), { hingeDrawerConflicts: conflicts }, clearance);
    return { status: 'evaluated', objectId, cabinetSource: r.status, applied: false, clearance, issues,
      summary: issues.some(i => i.authority !== 'experimental R03') ? 'issues' : issues.length ? 'experimental-only' : 'clear' };
  }
  const api = Object.freeze({ TOL, clearanceGeometry, clearanceBlock, independentIssues, analyze });
  if (node) module.exports = api; else root.RubikCabinetClearance = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
