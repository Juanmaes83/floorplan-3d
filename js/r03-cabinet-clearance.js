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
    return { ...analyzeDraft(project, objectId, r.outer, r.cabinet), cabinetSource: r.status };
  }
  /* El mismo análisis sobre un BORRADOR (lo que el editor de interiores tiene sin guardar): no lee ni escribe el contrato. */
  function analyzeDraft(project, objectId, outer, cabinet) {
    const object = (project.objects || []).find(o => o.id === objectId);
    if (!object) return { status: 'unknown-object', objectId, applied: false };
    if (!K.isCabinetType(object.type)) return { status: 'not-cabinet', objectId, applied: false };
    if (K.validate(outer, cabinet).length) return { status: 'invalid-cabinet', objectId, applied: false };
    const clearance = clearanceBlock(project, object, outer, cabinet), conflicts = K.drawerDoorConflicts(outer, cabinet);
    const issues = independentIssues(PL.problems(project, object).map(tag), { hingeDrawerConflicts: conflicts }, clearance);
    return { status: 'evaluated', objectId, applied: false, clearance, issues,
      summary: issues.some(i => i.authority !== 'experimental R03') ? 'issues' : issues.length ? 'experimental-only' : 'clear' };
  }

  /* Texto para la persona, agrupado por AUTORIDAD (nunca se mezclan): RUBIK (colocación), regla del donante y experimental.
     Solo informa: ningún grupo bloquea el guardado ni propone un cambio. Idiomas: es, en, zh (los de RUBIK).
     El resumen CUENTA CONFLICTOS (obstáculos o módulos), no grupos: «puertas 2» son dos obstáculos distintos en el barrido. */
  const GROUPS = Object.freeze({
    'box-placement': { level: 'rubik', category: 'placement' }, 'door-swing-square': { level: 'rubik', category: 'doors' },
    'drawer-reach': { level: 'rubik', category: 'drawers' }, 'hinge-drawer': { level: 'donor', category: 'hingeDrawer' },
    'door-swing-sector': { level: 'experimental', category: 'sector' }
  });
  const T = {
    es: { title: { 'box-placement': 'Colocación del mueble', 'door-swing-square': 'Apertura de puertas (barrido completo)', 'drawer-reach': 'Apertura de cajones', 'hinge-drawer': 'Bisagra frente a cajones', 'door-swing-sector': 'Giro exacto de 90°' },
      authority: { rubik: 'Comprobación de colocación de RUBIK', 'door-swing-square': 'Comprobación de colocación de RUBIK, conservadora', donor: 'Regla del diseño de origen', experimental: 'Experimental: orientativo, no decide nada' },
      furniture: n => `choca con el mueble «${n}»`, walls: k => k === 1 ? 'choca con un muro' : `choca con ${k} muros`, doors: k => k === 1 ? 'choca con una puerta de la estancia' : `choca con ${k} puertas de la estancia`,
      room: 'sale de la estancia', bay: i => `módulo ${i}`, none: 'Sin comprobación de holguras para este mueble.', clear: 'Sin choques al abrir.',
      cat: { doors: 'puertas', drawers: 'cajones', placement: 'colocación' }, conflicts: 'Conflictos', donorLine: k => `regla de origen: ${k} ${k === 1 ? 'módulo' : 'módulos'} con bisagra sobre cajones`,
      sectorLine: k => `orientativo: ${k}`, tail: 'No impiden guardar.', limits: 'Apertura supuesta de 90°. No evalúa herrajes reales, paso de personas ni normativa.' },
    en: { title: { 'box-placement': 'Furniture placement', 'door-swing-square': 'Door opening (full sweep)', 'drawer-reach': 'Drawer opening', 'hinge-drawer': 'Hinge over drawers', 'door-swing-sector': 'Exact 90° swing' },
      authority: { rubik: 'RUBIK placement check', 'door-swing-square': 'RUBIK placement check, conservative', donor: 'Original design rule', experimental: 'Experimental: indicative only, decides nothing' },
      furniture: n => `hits the furniture “${n}”`, walls: k => k === 1 ? 'hits a wall' : `hits ${k} walls`, doors: k => k === 1 ? 'hits a room door' : `hits ${k} room doors`,
      room: 'goes outside the room', bay: i => `bay ${i}`, none: 'No clearance check for this item.', clear: 'Opens without hitting anything.',
      cat: { doors: 'doors', drawers: 'drawers', placement: 'placement' }, conflicts: 'Conflicts', donorLine: k => `original rule: ${k} ${k === 1 ? 'bay' : 'bays'} with a hinge over drawers`,
      sectorLine: k => `indicative: ${k}`, tail: 'They do not prevent saving.', limits: 'Assumed 90° opening. Real hardware, people passage and regulations are not checked.' },
    zh: { title: { 'box-placement': '家具摆放', 'door-swing-square': '柜门开启（完整扫掠）', 'drawer-reach': '抽屉拉出', 'hinge-drawer': '铰链与抽屉', 'door-swing-sector': '精确 90° 开启' },
      authority: { rubik: 'RUBIK 摆放检查', 'door-swing-square': 'RUBIK 摆放检查（保守）', donor: '原设计规则', experimental: '实验性：仅供参考，不作判定' },
      furniture: n => `碰到家具「${n}」`, walls: k => `碰到 ${k} 面墙`, doors: k => `碰到 ${k} 扇房门`, room: '超出房间', bay: i => `第 ${i} 格`, none: '此家具无开启空间检查。', clear: '开启时无碰撞。',
      cat: { doors: '柜门', drawers: '抽屉', placement: '摆放' }, conflicts: '冲突', donorLine: k => `原设计规则：${k} 格铰链位于抽屉处`, sectorLine: k => `参考：${k}`, tail: '不影响保存。', limits: '假定开启 90°。不评估实际五金、人员通行或规范。' }
  };
  const langOf = o => { const l = o && o.lang || (typeof LANG !== 'undefined' ? LANG : 'es'); return T[l] ? l : 'es'; };
  function groupItems(project, items, t) {
    const out = [], walls = items.filter(x => x.startsWith('wall:')).length, doors = items.filter(x => x.startsWith('door:')).length, show = root.FloorPlanDisplayName;
    for (const x of items) {
      const [kind, id] = x.split(/:(.+)/);
      if (kind === 'furniture') { const o = (project.objects || []).find(y => y.id === id); out.push(t.furniture(o ? (show ? show(o.name, o.type) : o.name) : id)); }
      else if (kind === 'room') out.push(t.room);
      else if (kind === 'bay') out.push(t.bay(Number(id) + 1));
      else if (kind !== 'wall' && kind !== 'door') out.push(x);
    }
    if (walls) out.push(t.walls(walls)); if (doors) out.push(t.doors(doors));
    return out;
  }
  function describe(project, result, options) {
    const lang = langOf(options), t = T[lang];
    if (!result || result.status !== 'evaluated') return { status: result?.status || 'unknown', lang, groups: [], counts: {}, text: t.none };
    const groups = result.issues.map(i => ({ kind: i.kind, ...GROUPS[i.kind], title: t.title[i.kind], authority: t.authority[i.kind === 'door-swing-square' ? i.kind : GROUPS[i.kind].level],
      count: i.items.length, items: groupItems(project, i.items, t) }));
    const counts = { doors: 0, drawers: 0, placement: 0, hingeDrawer: 0, sector: 0 };
    for (const g of groups) counts[g.category] += g.count;
    const real = ['doors', 'drawers', 'placement'].filter(c => counts[c]).map(c => `${t.cat[c]} ${counts[c]}`);
    const parts = [real.length && `${t.conflicts}: ${real.join(' · ')}`, counts.hingeDrawer && t.donorLine(counts.hingeDrawer), counts.sector && t.sectorLine(counts.sector)].filter(Boolean);
    const cap = x => x.charAt(0).toLocaleUpperCase() + x.slice(1);
    const text = parts.length ? `${parts.map(cap).join('. ')}. ${t.tail}` : t.clear;
    return { status: 'evaluated', lang, summary: result.summary, groups, counts, text, limits: t.limits };
  }
  const api = Object.freeze({ TOL, GROUPS, clearanceGeometry, clearanceBlock, independentIssues, analyze, analyzeDraft, describe });
  if (node) module.exports = api; else root.RubikCabinetClearance = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
