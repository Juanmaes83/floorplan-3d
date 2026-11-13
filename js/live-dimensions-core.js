/* UX-08 · Cotas en vivo al mover muebles: núcleo puro (sin DOM, red ni almacenamiento; no escribe en el proyecto).
 *
 * Qué mide cada cota: para cada uno de los cuatro lados de la huella orientada del mueble (rectángulo girado, la misma
 * huella que FloorPlanTracing.footprint y layout-review), el ESPACIO LIBRE delante de ese lado: la distancia, en mm y en
 * la dirección perpendicular al lado, que ese lado podría avanzar antes de tocar el primer límite. Los límites son el
 * contorno de la estancia que contiene al mueble y las caras de los muros no demolidos. Se toma el mínimo a lo largo de
 * todo el lado (no solo desde su punto medio), así que en estancias irregulares (en L, con esquinas entrantes o con un
 * tabique) la cifra es el hueco real más estrecho delante de ese lado. La cota se dibuja exactamente donde se da ese
 * mínimo, de un punto del lado a un punto del límite.
 *
 * Cuándo NO hay cifra (no se inventa): el mueble no está dentro de ninguna estancia, su centro cae en dos estancias a la
 * vez, su huella sale de la estancia o invade un muro, o sus medidas no son válidas. Un lado sin ningún límite delante
 * dentro de su franja tampoco tiene cota.
 *
 * No es una anchura de paso certificada ni una comprobación de accesibilidad o normativa: es geometría en planta. */
(function (root) {
  'use strict';
  const EPS = 0.5; // mm: tolerancia para «pegado al muro» y para puntos sobre el contorno
  const dot = (a, b) => a.x * b.x + a.y * b.y, sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
  const pt = p => Array.isArray(p) ? { x: p[0], y: p[1] } : { x: p.x, y: p.y };
  const SIDES = Object.freeze(['top', 'right', 'bottom', 'left']); // en el marco local del mueble: −y, +x, +y, −x

  // Huella orientada: misma convención que FloorPlanTracing.footprint (rotación horaria con y hacia abajo).
  function footprint(piece) {
    const a = piece.rot * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), hw = piece.w / 2, hd = piece.d / 2;
    return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, y]) => ({ x: piece.cx + x * hw * c - y * hd * s, y: piece.cy + x * hw * s + y * hd * c }));
  }
  function area(P) { let s = 0; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; s += a.x * b.y - b.x * a.y; } return s / 2; }
  function distToSeg(p, a, b) { const e = sub(b, a), l = dot(e, e), t = l ? Math.max(0, Math.min(1, dot(sub(p, a), e) / l)) : 0; return Math.hypot(p.x - a.x - e.x * t, p.y - a.y - e.y * t); }
  function onBoundary(p, P) { for (let i = 0; i < P.length; i++) if (distToSeg(p, P[i], P[(i + 1) % P.length]) <= EPS) return true; return false; }
  function inside(p, P) {
    let r = false;
    for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
      const a = P[i], b = P[j];
      if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) r = !r;
    }
    return r;
  }
  // Cruce propio de dos segmentos (no cuenta tocarse en un extremo ni ir pegados).
  function crosses(a, b, c, d) {
    const o = (p, q, r) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
    const d1 = o(a, b, c), d2 = o(a, b, d), d3 = o(c, d, a), d4 = o(c, d, b), tol = EPS * Math.hypot(b.x - a.x, b.y - a.y);
    const tol2 = EPS * Math.hypot(d.x - c.x, d.y - c.y);
    return ((d1 > tol && d2 < -tol) || (d1 < -tol && d2 > tol)) && ((d3 > tol2 && d4 < -tol2) || (d3 < -tol2 && d4 > tol2));
  }
  // Penetración por ejes separadores entre dos polígonos convexos (como layout-review); ≤ 0 = sin solape con área.
  function penetration(A, B) {
    let best = Infinity;
    for (const P of [A, B]) for (let i = 0; i < P.length; i++) {
      const e = sub(P[(i + 1) % P.length], P[i]), l = Math.hypot(e.x, e.y); if (!l) continue;
      const n = { x: -e.y / l, y: e.x / l }, a = A.map(v => dot(v, n)), b = B.map(v => dot(v, n));
      best = Math.min(best, Math.min(Math.max(...a), Math.max(...b)) - Math.max(Math.min(...a), Math.min(...b)));
    }
    return best;
  }
  function validPiece(p) { return p && [p.cx, p.cy, p.w, p.d, p.rot].every(Number.isFinite) && p.w > 0 && p.d > 0; }

  // El hueco libre delante de un lado [P0,P1] con normal exterior n: mínimo de la distancia según n de los puntos de los
  // límites que caen en la franja del lado (proyección sobre el lado dentro de [0, L]) y delante de él (d ≥ 0).
  function clearance(P0, P1, n, segments, prefer = 0.5) {
    const e = sub(P1, P0), L = Math.hypot(e.x, e.y), u = { x: e.x / L, y: e.y / L };
    let best = null;
    for (const [A, B] of segments) {
      const sA = dot(sub(A, P0), u), sB = dot(sub(B, P0), u), dA = dot(sub(A, P0), n), dB = dot(sub(B, P0), n);
      // Recorta el segmento A→B a la franja del lado (0 ≤ s ≤ L) y a lo que queda delante (d ≥ −EPS).
      let t0 = 0, t1 = 1;
      for (const [v0, v1, lo, hi] of [[sA, sB, 0, L], [dA, dB, -EPS, Infinity]]) {
        const dv = v1 - v0;
        if (Math.abs(dv) < 1e-9) { if (v0 < lo - 1e-9 || v0 > hi + 1e-9) { t0 = 1; t1 = 0; } continue; }
        let ta = (lo - v0) / dv, tb = (hi - v0) / dv; if (ta > tb) [ta, tb] = [tb, ta];
        t0 = Math.max(t0, ta); t1 = Math.min(t1, tb);
      }
      if (t0 > t1) continue;
      // d es lineal en t: el mínimo está en un extremo, o en todo el tramo si el límite es paralelo al lado.
      const ends = [t0, t1].map(t => ({ s: sA + (sB - sA) * t, d: Math.max(0, dA + (dB - dA) * t) }));
      // Un límite que solo toca la franja en su borde (un punto, o un muro alineado con el lado contiguo) no frena a este
      // lado: al avanzar, la esquina del mueble resbala a lo largo de él.
      const sLo = Math.min(ends[0].s, ends[1].s), sHi = Math.max(ends[0].s, ends[1].s);
      if (sHi - sLo <= EPS && (sHi <= EPS || sLo >= L - EPS)) continue;
      const lo = Math.min(ends[0].d, ends[1].d), flat = Math.abs(ends[0].d - ends[1].d) <= EPS;
      // Entre puntos igual de cerca, se dibuja el más próximo a la posición preferida del lado (centro, por defecto).
      const want = prefer * L, s = flat ? Math.max(Math.min(ends[0].s, ends[1].s), Math.min(Math.max(ends[0].s, ends[1].s), want)) : (ends[0].d <= ends[1].d ? ends[0].s : ends[1].s);
      if (!best || lo < best.mm - EPS || (Math.abs(lo - best.mm) <= EPS && Math.abs(s - want) < Math.abs(best.s - want)))
        best = { mm: lo, s, from: { x: P0.x + u.x * s, y: P0.y + u.y * s }, to: { x: P0.x + u.x * s + n.x * lo, y: P0.y + u.y * s + n.y * lo } };
    }
    if (best) delete best.s;
    return best;
  }

  /* geometry: { rooms:[{id, poly:[[x,y]…]}], walls:[{poly:[[x,y]…], status?}] } (como FloorPlanCore.geometry).
     piece: { cx, cy, w, d, rot } en mm y grados (la forma de los muebles en el editor).
     options.prefer: { top|right|bottom|left: 0…1 }, dónde dibujar la cota cuando el hueco es igual a lo largo del lado.
     Devuelve { status, roomId, sides:[{side, mm, from, to}], reason }. status 'ok' es el único con cotas. */
  function measure(geometry, piece, options = {}) {
    if (!validPiece(piece)) return { status: 'invalid', roomId: null, sides: [], reason: 'Las medidas o la posición del mueble no son válidas.' };
    const F = footprint(piece), c = { x: piece.cx, y: piece.cy };
    const rooms = (geometry?.rooms || []).map(r => ({ id: r.id, poly: (r.poly || []).map(pt) })).filter(r => r.poly.length >= 3);
    const hits = rooms.filter(r => inside(c, r.poly));
    if (!hits.length) return { status: 'no-room', roomId: null, sides: [], reason: 'El mueble no está dentro de ninguna estancia.' };
    if (hits.length > 1) return { status: 'ambiguous', roomId: null, sides: [], reason: 'El mueble está en dos estancias que se solapan; no hay una referencia única.' };
    const room = hits[0], R = room.poly;
    const outside = F.some(v => !inside(v, R) && !onBoundary(v, R)) ||
      F.some((a, i) => R.some((b, j) => crosses(a, F[(i + 1) % 4], b, R[(j + 1) % R.length])));
    if (outside) return { status: 'outside', roomId: room.id, sides: [], reason: 'El mueble sale de su estancia.' };
    const walls = (geometry?.walls || []).filter(w => w.status !== 'demolished').map(w => (w.poly || []).map(pt)).filter(P => P.length >= 3);
    if (walls.some(W => penetration(F, W) > EPS)) return { status: 'wall', roomId: room.id, sides: [], reason: 'El mueble invade un muro.' };
    const segments = [];
    for (const P of [R, ...walls]) for (let i = 0; i < P.length; i++) segments.push([P[i], P[(i + 1) % P.length]]);
    const ccw = area(F) > 0, sides = [];
    for (let i = 0; i < 4; i++) {
      const P0 = F[i], P1 = F[(i + 1) % 4], e = sub(P1, P0), l = Math.hypot(e.x, e.y);
      const n = ccw ? { x: e.y / l, y: -e.x / l } : { x: -e.y / l, y: e.x / l };
      const best = clearance(P0, P1, n, segments, options.prefer?.[SIDES[i]] ?? 0.5);
      if (best) sides.push({ side: SIDES[i], mm: Math.round(best.mm), from: best.from, to: best.to });
    }
    return { status: 'ok', roomId: room.id, sides, reason: null };
  }

  const api = Object.freeze({ EPS, SIDES, footprint, measure });
  if (typeof module === 'object' && module.exports) module.exports = api; else root.FloorPlanLiveDimensions = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
