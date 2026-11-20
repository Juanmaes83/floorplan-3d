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
  const STATUS = Object.freeze(['not-evaluated', 'outside-route', 'route-clear', 'possible-interference']);
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
      return { ...base, roomId: room.id, routes: [...new Set(touched)].sort(), status: gap > 0 ? 'possible-interference' : 'route-clear', shortfallMm: gap > 0 ? gap : 0 };
    });
    const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
    return { criterion: CRITERION, applied: false, blocking: false, normative: false, items,
      routes: { interior: bands.length, notVerifiable: routes.length - bands.length }, costMs: Math.round((t1 - t0) * 100) / 100 };
  }
  const api = Object.freeze({ CRITERION, STATUS, footprint, distance, indicate });
  if (typeof module === 'object' && module.exports) module.exports = api; else root.RubikPassageIndicative = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
