/* R02-A · Paso libre ORIENTATIVO (prototipo autorizado el 20/11/2026). Solo INDICA posibles interferencias de elementos de
 * techo con un criterio inicial de diseño de 2100 mm sobre los recorridos que ya calcula RUBIK. NO es una autoridad:
 *  - no bloquea el guardado, no cambia ningún estado de R02-A («revisable», «pendiente»…) y no aplica nada;
 *  - no es una comprobación normativa ni de circulación de personas certificada;
 *  - los recorridos son los de FloorPlanPresentationRoute.plan (planificador de recorridos de PRESENTACIÓN, margen
 *    `clearanceMm` 220 mm por defecto, origen ajustable hasta 1200 mm de la puerta): se usan como indicación geométrica
 *    experimental, nunca como zona de circulación exigible;
 *  - la cota es `mount.lowestPointMm` del núcleo R02-A (r02a-ceiling-core): no se recalcula nada.
 * Sin recorrido verificable (`kind !== 'interior'`) en la estancia del elemento → «no evaluado». Puro: sin DOM ni escritura. */
(function (root) {
  'use strict';
  const CRITERION = Object.freeze({ minClearMm: 2100, source: 'owner-design-criterion-2026-11-20', normative: false, blocking: false,
    route: 'FloorPlanPresentationRoute.plan · kind interior', note: 'Criterio inicial de diseño, pendiente de validación profesional. No es una comprobación normativa.' });
  // «no-interference-detected» (antes «route-clear»): no sugiere seguridad garantizada, solo que no se detectó interferencia.
  const STATUS = Object.freeze(['not-evaluated', 'outside-route', 'no-interference-detected', 'possible-interference']);
  const inside = (poly, x, y) => { let hit = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) hit = !hit; } return hit; };
  // Huella en planta del elemento (rectángulo girado), en mm.
  function footprint(p) {
    const a = (p.rotationDeg || 0) * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), w = p.size.widthMm / 2, d = p.size.depthMm / 2;
    return [[-w, -d], [w, -d], [w, d], [-w, d]].map(([x, y]) => ({ x: p.position.x + x * c - y * s, y: p.position.y + x * s + y * c }));
  }
  const segPoint = (p, a, b) => { const dx = b.x - a.x, dy = b.y - a.y, L = dx * dx + dy * dy, t = L ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / L)) : 0; return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy); };
  const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const intersects = (a, b, c, d) => { const d1 = cross(c, d, a), d2 = cross(c, d, b), d3 = cross(a, b, c), d4 = cross(a, b, d); return ((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0)); };
  const inPoly = (P, q) => inside(P.map(v => [v.x, v.y]), q.x, q.y);
  // Distancia mínima entre la huella (polígono) y la polilínea del recorrido; 0 si se cortan o el recorrido entra en la huella.
  function distance(P, line) {
    let best = Infinity;
    for (let i = 0; i + 1 < line.length; i++) {
      const a = line[i], b = line[i + 1];
      if (inPoly(P, a) || inPoly(P, b)) return 0;
      for (let k = 0; k < P.length; k++) { const c = P[k], d = P[(k + 1) % P.length]; if (intersects(a, b, c, d)) return 0; best = Math.min(best, segPoint(c, a, b), segPoint(a, c, d), segPoint(b, c, d)); }
    }
    if (line.length === 1) for (const c of P) best = Math.min(best, Math.hypot(c.x - line[0].x, c.y - line[0].y));
    return best;
  }
  /* routes: [{ roomId, result }] con el resultado de FloorPlanPresentationRoute.plan por estancia.
     proposals: las propuestas de RubikCeilingLayoutEvidence.propose (position, rotationDeg, size, mount.lowestPointMm).
     rooms: polígonos de la planta ({id, poly:[[x,y]…]}) para saber en qué estancia está cada elemento. */
  function indicate({ proposals = [], routes = [], rooms = [] } = {}) {
    const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const bands = routes.filter(r => r.result && r.result.kind === 'interior' && Array.isArray(r.result.points) && r.result.points.length >= 2)
      .map(r => ({ roomId: r.roomId, line: r.result.points, halfWidth: r.result.clearanceMm, doorIds: r.result.doorIds || [] }));
    const verifiable = new Set(bands.map(b => b.roomId));
    const items = proposals.map(p => {
      const base = { id: p.id, lowestPointMm: p.mount?.lowestPointMm ?? null, minClearMm: CRITERION.minClearMm };
      if (!p.position || !p.size) return { ...base, status: 'not-evaluated', reason: 'no-geometry' };
      const room = rooms.find(r => inside(r.poly, p.position.x, p.position.y));
      if (!room) return { ...base, status: 'not-evaluated', reason: 'outside-rooms' };
      if (!verifiable.has(room.id)) return { ...base, roomId: room.id, status: 'not-evaluated', reason: 'no-verifiable-route' };
      if (p.mount?.status !== 'computed' || !Number.isFinite(p.mount.lowestPointMm)) return { ...base, roomId: room.id, status: 'not-evaluated', reason: 'no-vertical-reference' };
      const P = footprint(p), touched = [];
      let nearest = Infinity;
      for (const b of bands) { const d = distance(P, b.line); nearest = Math.min(nearest, d); if (d <= b.halfWidth) touched.push(b.roomId); }
      if (!touched.length) return { ...base, roomId: room.id, status: 'outside-route', distanceToRouteMm: Math.round(nearest) };
      const gap = CRITERION.minClearMm - p.mount.lowestPointMm;
      return { ...base, roomId: room.id, routes: [...new Set(touched)].sort(), status: gap > 0 ? 'possible-interference' : 'no-interference-detected', shortfallMm: gap > 0 ? gap : 0 };
    });
    const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
    return { criterion: CRITERION, applied: false, blocking: false, normative: false, items,
      routes: { interior: bands.length, notVerifiable: routes.length - bands.length }, costMs: Math.round((t1 - t0) * 100) / 100 };
  }
  /* Caché de rutas, invalidable: la clave es la FIRMA de todo lo que cambia un recorrido (proyecto, planta y geometría:
     estancias, muros, huecos, puertas y muebles). Los elementos de techo no forman parte (no cambian las rutas). Se calcula
     solo cuando alguien consulta y la firma no está en caché; `stats.plans` cuenta los cálculos de ruta reales. */
  const stats = { plans: 0, hits: 0, misses: 0 };
  const cache = new Map(), CACHE_MAX = 8;
  function signature(project, geometry, levelKey) {
    // El planificador usa también la envolvente, el objetivo de la estancia y la geometría
    // COMPLETA de los huecos. Sin estas dependencias se reutilizaba una ruta obsoleta si,
    // por ejemplo, se ensanchaba una puerta sin desplazar su centro.
    const rect = r => r ? [r.center, r.angle, r.spanMm, r.thickness] : null;
    const pick = o => ({ id: o.id, t: o.type, p: o.position, s: o.size, r: o.rotationDeg || 0 });
    return JSON.stringify([project?.id, levelKey ?? null, geometry?.envelope ?? null,
      (geometry?.rooms || []).map(r => [r.id, r.poly, r.counted, r.at]),
      (geometry?.walls || []).map(w => [w.id, w.status, rect(w)]),
      (geometry?.doors || []).map(d => [d.id, d.entry, d.height, rect(d.rect)]),
      (geometry?.windows || []).map(rect),
      (geometry?.slides || []).map(d => rect(d.rect)),
      (project?.objects || []).map(pick)]);
  }
  function routesFor(project, geometry, plan, levelKey) {
    const key = signature(project, geometry, levelKey);
    if (cache.has(key)) { stats.hits++; return { key, routes: cache.get(key), cached: true }; }
    stats.misses++;
    const routes = (geometry?.rooms || []).filter(r => Array.isArray(r.poly) && r.poly.length >= 3).map(r => { stats.plans++; return { roomId: r.id, result: plan(project, geometry, r.id) }; });
    cache.set(key, routes); if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value);
    return { key, routes, cached: false };
  }
  const resetCache = () => { cache.clear(); stats.plans = stats.hits = stats.misses = 0; };
  // Textos visibles (ES/EN/ZH). Nunca afirman seguridad ni cumplimiento.
  const TEXT = {
    es: { title: 'Paso libre orientativo · experimental', note: 'Criterio inicial de 2100 mm, pendiente de validación profesional. No es normativo, no bloquea nada y el recorrido es orientativo (el de presentación de RUBIK).',
      consult: 'Consultar paso libre orientativo', stale: 'La estancia cambió: vuelve a consultar.',
      'possible-interference': x => `Posible interferencia: el punto más bajo queda a ${x.lowestPointMm} mm, ${x.shortfallMm} mm por debajo del criterio inicial.`,
      'no-interference-detected': () => 'Sin interferencia detectada en el recorrido orientativo.', 'outside-route': () => 'Fuera del recorrido orientativo.',
      'not-evaluated': x => `No evaluado: ${({ 'no-verifiable-route': 'no hay un recorrido orientativo verificable hasta esta estancia', 'no-vertical-reference': 'falta la referencia vertical', 'outside-rooms': 'el elemento no está dentro de una estancia', 'no-geometry': 'faltan la posición o el tamaño' })[x.reason] || x.reason}.` },
    en: { title: 'Indicative clear passage · experimental', note: 'Initial 2100 mm criterion, pending professional validation. Not regulatory, blocks nothing, and the route is indicative (RUBIK’s presentation route).',
      consult: 'Check indicative clear passage', stale: 'The room changed: check again.',
      'possible-interference': x => `Possible interference: the lowest point is at ${x.lowestPointMm} mm, ${x.shortfallMm} mm below the initial criterion.`,
      'no-interference-detected': () => 'No interference detected on the indicative route.', 'outside-route': () => 'Outside the indicative route.',
      'not-evaluated': x => `Not evaluated: ${({ 'no-verifiable-route': 'there is no verifiable indicative route to this room', 'no-vertical-reference': 'the vertical reference is missing', 'outside-rooms': 'the item is not inside a room', 'no-geometry': 'position or size is missing' })[x.reason] || x.reason}.` },
    zh: { title: '参考净空通行 · 实验性', note: '初始标准 2100 mm，待专业验证。非规范要求，不阻止任何操作，路线仅供参考（RUBIK 演示路线）。',
      consult: '查看参考净空通行', stale: '房间已更改：请重新查看。',
      'possible-interference': x => `可能冲突：最低点位于 ${x.lowestPointMm} mm，低于初始标准 ${x.shortfallMm} mm。`,
      'no-interference-detected': () => '参考路线上未检测到冲突。', 'outside-route': () => '不在参考路线上。',
      'not-evaluated': x => `未评估：${({ 'no-verifiable-route': '没有通往该房间的可验证参考路线', 'no-vertical-reference': '缺少竖向基准', 'outside-rooms': '该元素不在房间内', 'no-geometry': '缺少位置或尺寸' })[x.reason] || x.reason}。` }
  };
  const text = (lang) => TEXT[lang] || TEXT.es;
  const describe = (item, lang) => text(lang)[item.status](item);
  const api = Object.freeze({ CRITERION, STATUS, footprint, distance, indicate, signature, routesFor, resetCache, stats, text, describe });
  if (typeof module === 'object' && module.exports) module.exports = api; else root.RubikPassageIndicative = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
