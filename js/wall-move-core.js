/* M08 · Geometría avanzada — «Desplazar muro con su contexto».
 * Operación pura y atómica: desplaza en perpendicular un muro recto (con todo su tramo colineal: muro + paños de puerta/ventana
 * unidos en línea) N mm, manteniendo la interpretación coherente de lo que depende de él:
 *  - muros conectados en sus extremos o que acometen a él: se alargan o acortan a lo largo de SU propia dirección;
 *  - contornos de estancia apoyados en sus caras: se desplazan y sus esquinas deslizan por los lados contiguos;
 *  - huecos: siguen a su muro y conservan su coordenada longitudinal en el plano (y se validan con el guardián de huecos existente);
 *  - muebles apoyados en una cara: acompañan al muro; los que quedarían atravesados se informan (no se mueven).
 * Si algo no puede interpretarse con seguridad, la operación se RECHAZA con un código y un motivo y el proyecto no cambia.
 * Reutiliza las autoridades del producto: FloorPlanCore.validate, FloorPlanOpenings.guard/spanSides y
 * FloorPlanQuantities.room (comprobación de asociación estancia↔caras de muro antes y después). No crea modelo, esquema,
 * guardado ni historial propios: el resultado se aplica con la mutación única del editor (un paso de deshacer).
 * Sólo muros rectos del esquema 1.x: los muros curvos o inclinados (OP-07, campos `curve`/`heightEndMm`) se rechazan. */
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api; else root.RubikWallMove = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';
  const JOINT_MM = 1, MIN_SIN = 0.17, MIN_WALL_MM = 100, MIN_ROOM_M2 = 0.5, MAX_OFFSET_MM = 5000, LEAN_MM = 30, PAR_SIN = 1e-3;
  const deps = d => {
    const req = n => { try { return typeof require === 'function' ? require(n) : null; } catch { return null; } };
    return {
      Core: d?.Core || root.FloorPlanCore || req('./project-core.js'),
      Openings: d?.Openings || root.FloorPlanOpenings || req('./opening-edit.js'),
      Quantities: d?.Quantities || root.FloorPlanQuantities || req('./quantity-core.js'),
    };
  };
  const clone = v => JSON.parse(JSON.stringify(v));
  const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y }), add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y }), mul = (a, k) => ({ x: a.x * k, y: a.y * k });
  const dot = (a, b) => a.x * b.x + a.y * b.y, crs = (a, b) => a.x * b.y - a.y * b.x, len = a => Math.hypot(a.x, a.y), unit = a => mul(a, 1 / len(a));
  const dist = (a, b) => len(sub(a, b)), rnd = p => ({ x: Math.round(p.x), y: Math.round(p.y) });
  const active = p => p.walls.filter(w => w.status !== 'demolished');
  const wlen = w => dist(w.start, w.end);
  const structural = w => w.structure === 'load-bearing' || w.structure === 'exterior';
  const curved = w => w.curve !== undefined || w.heightEndMm !== undefined || w.path !== undefined;
  const area = poly => Math.abs(poly.reduce((s, p, i) => s + p.x * poly[(i + 1) % poly.length].y - poly[(i + 1) % poly.length].x * p.y, 0)) / 2;
  const insidePoly = (q, poly) => { let yes = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a.y > q.y) !== (b.y > q.y) && q.x < (b.x - a.x) * (q.y - a.y) / (b.y - a.y) + a.x) yes = !yes; } return yes; };
  const centroid = poly => { let a = 0, x = 0, y = 0; poly.forEach((p, i) => { const q = poly[(i + 1) % poly.length], c = p.x * q.y - q.x * p.y; a += c; x += (p.x + q.x) * c; y += (p.y + q.y) * c; }); return a ? { x: x / (3 * a), y: y / (3 * a) } : poly[0]; };
  // Proyección de q sobre el muro: t en [0,1] dentro del tramo; distancia a su eje.
  const onWall = (q, w) => { const d = sub(w.end, w.start), l2 = dot(d, d), t = dot(sub(q, w.start), d) / l2; return { t, dist: dist(q, add(w.start, mul(d, t))) }; };
  const segCross = (a, b, c, d) => { const o = (p, q, r) => crs(sub(q, p), sub(r, p)); const d1 = o(a, b, c), d2 = o(a, b, d), d3 = o(c, d, a), d4 = o(c, d, b); return d1 * d2 < 0 && d3 * d4 < 0; };

  const TEXT = {
    'not-found': ['No se encuentra el muro.', 'Wall not found.', '找不到该墙体。'],
    'demolished': ['El muro está marcado para retirar: no se desplaza.', 'The wall is marked for removal: it is not moved.', '该墙已标记拆除，不移动。'],
    'structural': ['El desplazamiento cambiaría un muro de carga o de fachada. Elige un tabique que no lo modifique. El plano sigue intacto.', 'The move would change a load-bearing or exterior wall. Choose a partition that leaves it intact. The plan is unchanged.', '移动将改变承重墙或外墙。请选择不影响该墙的隔墙。平面图未改变。'],
    'overlapping-element': ['Hay un pilar u otro muro superpuesto al tramo: moverlo lo separaría o lo atravesaría.', 'A pillar or another wall overlaps the stretch: moving it would detach or cut through it.', '有柱或其他墙与该段重叠，移动会使其分离或被穿过。'],
    'curved': ['Muro curvo o inclinado: esta operación sólo admite muros rectos (no se ha cambiado nada).', 'Curved or sloped wall: this operation only supports straight walls (nothing changed).', '曲墙或斜墙：此操作仅支持直墙（未做更改）。'],
    'bad-offset': [`Indica un desplazamiento entero entre 1 y ${MAX_OFFSET_MM} mm.`, `Enter a whole offset between 1 and ${MAX_OFFSET_MM} mm.`, `请输入 1 到 ${MAX_OFFSET_MM} 毫米之间的整数位移。`],
    'branching-run': ['El muro continúa en línea con dos tramos en el mismo punto: no se puede saber cuál acompaña.', 'The wall continues in line with two stretches at the same point: it is unclear which one follows.', '墙在同一点与两段共线墙相连，无法确定随动对象。'],
    'oblique-junction': ['Un muro que acomete casi en paralelo no puede alargarse con seguridad.', 'A wall meeting it almost in parallel cannot be extended safely.', '近乎平行相接的墙无法安全延长。'],
    'over-constrained': ['Un extremo une muros en direcciones distintas: desplazarlo deformaría el encuentro.', 'One end joins walls in different directions: moving it would distort the junction.', '端点连接不同方向的墙，移动会使节点变形。'],
    'leaves-host-wall': ['El extremo saldría del muro al que acomete.', 'The end would leave the wall it meets.', '端点将移出其相接的墙。'],
    'wall-too-short': [`Un muro quedaría con menos de ${MIN_WALL_MM} mm o invertido.`, `A wall would become shorter than ${MIN_WALL_MM} mm or inverted.`, `某墙将短于 ${MIN_WALL_MM} 毫米或方向反转。`],
    'wall-collision': ['El muro chocaría con otro muro.', 'The wall would run into another wall.', '该墙会与其他墙碰撞。'],
    'room-edge-beyond-wall': ['El contorno de una estancia sigue en línea más allá del muro: habría que deformarlo de forma ambigua.', 'A room outline continues in line beyond the wall: reshaping it would be ambiguous.', '房间轮廓沿墙线延伸超出墙体，变形会有歧义。'],
    'room-corner-oblique': ['Una esquina de estancia junto al muro es demasiado oblicua para deslizarla con seguridad.', 'A room corner next to the wall is too oblique to slide safely.', '靠墙的房间角过于倾斜，无法安全滑动。'],
    'room-too-small': [`Una estancia quedaría por debajo de ${MIN_ROOM_M2} m² o con un contorno no válido.`, `A room would fall below ${MIN_ROOM_M2} m² or get an invalid outline.`, `某房间将小于 ${MIN_ROOM_M2} 平方米或轮廓无效。`],
    'room-association-lost': ['Una estancia dejaría de estar asociada a sus muros (medición de paredes): no se aplica.', 'A room would lose its association with its walls (wall measurement): not applied.', '房间将失去与墙面的关联（墙面计量），不予应用。'],
    'room-overlap': ['Dos estancias quedarían superpuestas.', 'Two rooms would overlap.', '两个房间将重叠。'],
    'wall-into-room': ['El muro entraría en una estancia que no lo tiene como límite.', 'The wall would enter a room it does not bound.', '墙将进入一个不以其为边界的房间。'],
    'opening-out-of-wall': ['Un hueco quedaría fuera de su muro o solapado.', 'An opening would fall outside its wall or overlap another.', '某门窗洞口将超出墙体或重叠。'],
    'invalid-result': ['El resultado no superaría la validación del proyecto.', 'The result would not pass project validation.', '结果无法通过项目校验。'],
  };
  const lang = l => l === 'en' ? 1 : l === 'zh' ? 2 : 0;
  const explain = (code, l = 'es') => (TEXT[code] || TEXT['invalid-result'])[lang(l)];
  const fail = (code, detail) => ({ ok: false, code, message: explain(code), detail: detail || null });

  /** Tramo colineal del muro: el muro y los muros activos unidos a él extremo con extremo y en línea (paños de hueco). */
  function run(project, wallId) {
    const all = active(project), w0 = all.find(w => w.id === wallId); if (!w0) return null;
    const u = unit(sub(w0.end, w0.start)), n = { x: -u.y, y: u.x };
    const collinear = w => { const d = unit(sub(w.end, w.start)); return Math.abs(crs(d, u)) <= PAR_SIN && Math.abs(dot(sub(w.start, w0.start), n)) <= JOINT_MM && Math.abs(dot(sub(w.end, w0.start), n)) <= JOINT_MM; };
    const ids = new Set([w0.id]); let A = w0.start, B = w0.end, branching = false;
    for (const side of ['A', 'B']) {
      for (;;) {
        const E = side === 'A' ? A : B;
        const next = all.filter(w => !ids.has(w.id) && collinear(w) && (dist(w.start, E) <= JOINT_MM || dist(w.end, E) <= JOINT_MM));
        if (next.length > 1) branching = true;
        if (next.length !== 1) break;
        const w = next[0]; ids.add(w.id); const far = dist(w.start, E) <= JOINT_MM ? w.end : w.start;
        if (side === 'A') A = far; else B = far;
      }
    }
    return { ids: [...ids], walls: all.filter(w => ids.has(w.id)), A, B, u, n, branching };
  }

  /** Estancia a cada lado del tramo (+normal / −normal) con la misma regla que «Abre hacia» de los huecos. */
  function sides(project, wallId, d) {
    const { Openings } = deps(d), r = run(project, wallId); if (!r || !Openings?.spanSides) return null;
    const w = project.walls.find(x => x.id === wallId), s = Openings.spanSides(project, w, 0, wlen(w)), left = Openings.normal(w, 'left');
    const plusIsLeft = dot(left, r.n) > 0;
    return { plus: plusIsLeft ? s.left : s.right, minus: plusIsLeft ? s.right : s.left, normal: r.n };
  }

  // Regla de quantity-core (mismas tolerancias exportadas) para saber si un lado de estancia está sobre una cara del muro.
  function edgeOnFace(a, b, w, Q) {
    const tolF = Q?.FACE_TOLERANCE_MM ?? 3, tolP = Q?.PARALLEL_SIN_TOLERANCE ?? 1e-4;
    const wd = sub(w.end, w.start), wl = len(wd), ed = sub(b, a), el = len(ed); if (!(wl > 0 && el > 0)) return null;
    if (Math.abs(crs(wd, ed)) / (wl * el) > tolP) return null;
    const u = mul(wd, 1 / wl), n = { x: -u.y, y: u.x }, d1 = dot(sub(a, w.start), n), d2 = dot(sub(b, w.start), n), avg = (d1 + d2) / 2;
    if (Math.sign(d1 || avg) !== Math.sign(d2 || avg) || Math.abs(d1 - d2) > tolF * 2 || Math.abs(Math.abs(avg) - w.thicknessMm / 2) > tolF) return null;
    const s1 = dot(sub(a, w.start), u), s2 = dot(sub(b, w.start), u), lo = Math.max(0, Math.min(s1, s2)), hi = Math.min(wl, Math.max(s1, s2));
    return hi - lo > 1e-7 ? { lo, hi, u } : null;
  }

  function plan(project, wallId, offsetMm, d) {
    const { Core, Openings, Quantities: Q } = deps(d);
    const w0 = project.walls.find(w => w.id === wallId);
    if (!w0) return fail('not-found');
    if (w0.status === 'demolished') return fail('demolished');
    if (!Number.isInteger(offsetMm) || offsetMm === 0 || Math.abs(offsetMm) > MAX_OFFSET_MM) return fail('bad-offset');
    const r = run(project, wallId);
    if (r.branching) return fail('branching-run');
    if (r.walls.some(curved)) return fail('curved');
    const protectedRun = r.walls.filter(structural);
    if (protectedRun.length) return fail('structural', { walls: protectedRun.map(w => w.id) });
    const all = active(project), inRun = new Set(r.ids), dv = mul(r.n, offsetMm), next = clone(project);
    const W = id => next.walls.find(w => w.id === id);
    const moved = new Map(); // wallId -> {start?, end?} puntos nuevos (sin redondear se calculan una sola vez y se redondean una sola vez)
    const setPoint = (wall, key, P) => { const m = moved.get(wall.id) || {}; m[key] = P; moved.set(wall.id, m); };
    const slide = (E, s) => { const k = dot(s, r.n); if (Math.abs(k) < MIN_SIN) return null; return add(E, mul(s, offsetMm / k)); };
    const connected = new Set();
    // 1 · Extremos del tramo: deslizan por el muro con el que se encuentran (o en perpendicular si quedan libres).
    const ends = {};
    for (const key of ['A', 'B']) {
      const E = r[key];
      const joints = all.filter(c => !inRun.has(c.id) && (dist(c.start, E) <= JOINT_MM || dist(c.end, E) <= JOINT_MM));
      const hosts = all.filter(c => !inRun.has(c.id) && !joints.includes(c)).filter(c => { const o = onWall(E, c); return o.t > 1e-6 && o.t < 1 - 1e-6 && o.dist <= c.thicknessMm / 2 + JOINT_MM; });
      if ([...joints, ...hosts].some(curved)) return fail('curved');
      const dirs = [...joints, ...hosts].map(c => unit(sub(c.end, c.start)));
      if (dirs.some(s => Math.abs(dot(s, r.n)) < MIN_SIN)) return fail('oblique-junction', { at: key });
      if (dirs.some(s => Math.abs(crs(s, dirs[0])) > PAR_SIN)) return fail('over-constrained', { at: key });
      const E2 = dirs.length ? slide(E, dirs[0]) : add(E, dv);
      // El muro anfitrión real es su tramo colineal (p. ej. muro + paño de puerta): el extremo debe seguir dentro de él.
      for (const h of hosts) { const hr = run(project, h.id), o = onWall(E2, { start: hr.A, end: hr.B }); if (o.t <= 0 || o.t >= 1) return fail('leaves-host-wall', { host: h.id }); for (const id of hr.ids) connected.add(id); }
      for (const c of joints) { setPoint(c, dist(c.start, E) <= JOINT_MM ? 'start' : 'end', E2); connected.add(c.id); }
      ends[key] = { E, E2 };
    }
    // Tangencial: los extremos pueden deslizar también a lo largo del tramo (encuentros no perpendiculares).
    const tA = dot(sub(ends.A.E2, ends.A.E), r.u), tB = dot(sub(ends.B.E2, ends.B.E), r.u);
    for (const w of r.walls) {
      for (const key of ['start', 'end']) {
        const P = w[key];
        const Q2 = dist(P, r.A) <= JOINT_MM ? ends.A.E2 : dist(P, r.B) <= JOINT_MM ? ends.B.E2 : add(P, dv);
        setPoint(w, key, Q2);
      }
    }
    // 2 · Muros que acometen al cuerpo del tramo (ramas): su extremo sigue al muro por su propia dirección.
    for (const c of all) {
      if (inRun.has(c.id) || connected.has(c.id)) continue;
      for (const key of ['start', 'end']) {
        const P = c[key], s0 = dot(sub(P, r.A), r.u), L = dist(r.A, r.B), off = Math.abs(dot(sub(P, r.A), r.n));
        const tRun = Math.max(...r.walls.map(w => w.thicknessMm)) / 2 + JOINT_MM;
        if (s0 < -JOINT_MM || s0 > L + JOINT_MM || off > tRun) continue;
        if (curved(c)) return fail('curved');
        const s = unit(sub(c.end, c.start));
        if (Math.abs(dot(s, r.n)) < MIN_SIN) return fail(Math.abs(crs(s, r.u)) <= PAR_SIN * 50 ? 'overlapping-element' : 'oblique-junction', { wallId: c.id });
        const P2 = slide(P, s);
        setPoint(c, key, P2); connected.add(c.id);
      }
    }
    // Un muro que sólo sirve de apoyo no cambia. Todo muro cuyos extremos se ajustan pasa por la misma guarda.
    const protectedAdjustments = all.filter(w => moved.has(w.id) && structural(w));
    if (protectedAdjustments.length) return fail('structural', { walls: protectedAdjustments.map(w => w.id) });
    // Redondeo único por punto compartido y escritura.
    const cache = new Map(), R = P => { const k = `${P.x.toFixed(6)},${P.y.toFixed(6)}`; if (!cache.has(k)) cache.set(k, rnd(P)); return cache.get(k); };
    const before = new Map(project.walls.map(w => [w.id, w]));
    for (const [id, m] of moved) { const w = W(id); if (m.start) w.start = R(m.start); if (m.end) w.end = R(m.end); w.source = { method: w.source?.method || 'manual', review: 'unreviewed' }; }
    // Longitud mínima y sin inversión.
    for (const id of moved.keys()) { const a = before.get(id), b = W(id); if (wlen(b) < MIN_WALL_MM && wlen(b) < wlen(a) || dot(sub(b.end, b.start), sub(a.end, a.start)) <= 0) return fail('wall-too-short', { wallId: id }); }
    // 3 · Choques: el tramo nuevo no cruza ni se superpone a muros no conectados.
    for (const w of r.walls.map(x => W(x.id))) {
      for (const x of active(next)) {
        if (inRun.has(x.id) || connected.has(x.id)) continue;
        if (segCross(w.start, w.end, x.start, x.end)) return fail('wall-collision', { wallId: x.id });
        const dx = unit(sub(x.end, x.start)), du = unit(sub(w.end, w.start));
        if (Math.abs(crs(dx, du)) <= PAR_SIN) {
          const gap = Math.abs(dot(sub(x.start, w.start), { x: -du.y, y: du.x })), lo = Math.max(0, Math.min(dot(sub(x.start, w.start), du), dot(sub(x.end, w.start), du))), hi = Math.min(wlen(w), Math.max(dot(sub(x.start, w.start), du), dot(sub(x.end, w.start), du)));
          if (hi - lo > JOINT_MM && gap < (w.thicknessMm + x.thicknessMm) / 2 - JOINT_MM) return fail('wall-collision', { wallId: x.id });
        }
      }
    }
    // 3b · Barrido: ningún muro no conectado puede quedar dentro de la franja que recorre el tramo (no se «salta» un muro).
    { const half = Math.max(...r.walls.map(w => w.thicknessMm)) / 2, A0 = r.A, A1 = add(r.A, dv), B0 = r.B, B1 = add(r.B, dv);
      const lo = Math.min(0, offsetMm) - half, hi = Math.max(0, offsetMm) + half, L = dist(r.A, r.B);
      for (const x of active(next)) {
        if (inRun.has(x.id) || connected.has(x.id)) continue;
        const pts = [x.start, x.end, add(x.start, mul(sub(x.end, x.start), 0.5))], ss = pts.map(q => dot(sub(q, r.A), r.u)), ns = pts.map(q => dot(sub(q, r.A), r.n)), hx = x.thicknessMm / 2;
        const inBand = pts.some((q, i) => ss[i] > 1 && ss[i] < L - 1 && ns[i] > lo + 1 - hx && ns[i] < hi - 1 + hx);
        const crossesQuad = [[A0, A1], [A1, B1], [B1, B0], [B0, A0]].some(([a, b]) => segCross(a, b, x.start, x.end));
        if (inBand || crossesQuad) return fail('wall-collision', { wallId: x.id, swept: true });
      } }
    // 4 · Huecos: siguen a su muro y conservan su posición a lo largo de su eje. Validar los huecos tras el ajuste.
    const openings = [];
    for (const o of next.openings) {
      const a = before.get(o.wallId), b = W(o.wallId); if (!moved.has(o.wallId)) continue;
      const ua = unit(sub(a.end, a.start)), shift = dot(sub(a.start, b.start), ua), off = Math.round(o.offsetMm + shift);
      if (off !== o.offsetMm) { openings.push({ id: o.id, wallId: o.wallId, offsetBefore: o.offsetMm, offsetAfter: off }); o.offsetMm = off; }
      else openings.push({ id: o.id, wallId: o.wallId, offsetBefore: o.offsetMm, offsetAfter: off });
    }
    if (Openings?.guard) for (const o of openings) { const problems = Openings.guard(project, next, o.id); if (problems.length) return fail('opening-out-of-wall', { openingId: o.id, problems: problems.map(p => p.code) }); }
    // 5 · Estancias: la parte del contorno que está sobre una cara del tramo se desplaza con él; sus esquinas deslizan por los
    //     lados contiguos. Si el contorno sigue en línea más allá del extremo del muro (planta abierta, remate de otro muro),
    //     se inserta un escalón en ese extremo: el tramo apoyado se mueve y el resto se queda donde estaba.
    const perpEnd = Math.abs(tA) <= 0.5 && Math.abs(tB) <= 0.5;
    const rooms = [];
    for (const room of next.rooms) {
      const poly = room.polygon, n = poly.length, cov = new Array(n).fill(null);
      for (let i = 0; i < n; i++) {
        const a = poly[i], b = poly[(i + 1) % n], el = dist(a, b);
        if (!r.walls.some(w => edgeOnFace(a, b, w, Q))) continue;
        const eu = unit(sub(b, a));
        const spans = r.walls.filter(w => edgeOnFace(a, b, w, Q)).map(w => { const s1 = dot(sub(w.start, a), eu), s2 = dot(sub(w.end, a), eu); return [Math.max(0, Math.min(s1, s2)), Math.min(el, Math.max(s1, s2))]; }).filter(([lo, hi]) => hi > lo).sort((x, y) => x[0] - y[0]);
        const merged = []; for (const sp of spans) { const last = merged.at(-1); if (last && sp[0] <= last[1] + 3) last[1] = Math.max(last[1], sp[1]); else merged.push(sp.slice()); }
        if (merged.length !== 1) return fail('room-edge-beyond-wall', { roomId: room.id });
        const [lo, hi] = merged[0], full = lo <= 3 && hi >= el - 3;
        if (!full && !perpEnd) return fail('room-edge-beyond-wall', { roomId: room.id });
        cov[i] = { lo, hi, el, eu, atStart: lo <= 3, atEnd: hi >= el - 3 };
      }
      if (!cov.some(Boolean)) continue;
      const areaBefore = area(poly), out = [];
      for (let i = 0; i < n; i++) {
        const prev = cov[(i + n - 1) % n], cur = cov[i], byPrev = !!prev?.atEnd, byCur = !!cur?.atStart;
        let P2 = poly[i];
        if (byPrev && byCur) P2 = add(poly[i], dv);
        else if (byPrev || byCur) { const other = byPrev ? poly[(i + 1) % n] : poly[(i + n - 1) % n], a = unit(sub(other, poly[i])); P2 = slide(poly[i], a); if (!P2) return fail('room-corner-oblique', { roomId: room.id }); }
        out.push(R(P2));
        if (cur && !cur.atStart) { const P = add(poly[i], mul(cur.eu, cur.lo)); out.push(R(P), R(add(P, dv))); }
        if (cur && !cur.atEnd) { const P = add(poly[i], mul(cur.eu, cur.hi)); out.push(R(add(P, dv)), R(P)); }
      }
      // Limpieza (sólo estancias cambiadas): sin vértices repetidos ni intermedios alineados (p. ej. al deshacer un escalón con −d).
      let clean = out.filter((v, i) => !(v.x === out[(i + out.length - 1) % out.length].x && v.y === out[(i + out.length - 1) % out.length].y));
      for (let changed = true; changed && clean.length > 3;) { changed = false; for (let i = 0; i < clean.length; i++) { const a = clean[(i + clean.length - 1) % clean.length], b = clean[i], c = clean[(i + 1) % clean.length]; if (crs(sub(b, a), sub(c, b)) === 0) { clean.splice(i, 1); changed = true; break; } } }
      room.polygon = clean;
      if (room.labelAt && !insidePoly(room.labelAt, clean)) room.labelAt = rnd(centroid(clean));
      room.source = { method: room.source?.method || 'manual', review: 'unreviewed' };
      const areaAfter = area(clean);
      if (areaAfter / 1e6 < MIN_ROOM_M2) return fail('room-too-small', { roomId: room.id });
      rooms.push({ id: room.id, areaBeforeM2: +(areaBefore / 1e6).toFixed(3), areaAfterM2: +(areaAfter / 1e6).toFixed(3), verticesBefore: n, verticesAfter: clean.length });
    }
    // 5b · Ninguna estancia nueva superpuesta y el muro no invade estancias que no delimita.
    const strictIn = (q, poly) => insidePoly(q, poly) && !poly.some((v, i) => onWall(q, { start: v, end: poly[(i + 1) % poly.length] }).dist <= 1 && onWall(q, { start: v, end: poly[(i + 1) % poly.length] }).t >= 0 && onWall(q, { start: v, end: poly[(i + 1) % poly.length] }).t <= 1);
    const overlap = (P1, P2) => P1.some(q => strictIn(q, P2)) || P2.some(q => strictIn(q, P1)) || P1.some((a, i) => P2.some((c, j) => segCross(a, P1[(i + 1) % P1.length], c, P2[(j + 1) % P2.length])));
    const changedRooms = new Set(rooms.map(x => x.id));
    for (const a of next.rooms) if (changedRooms.has(a.id)) for (const b of next.rooms) { if (a.id === b.id) continue; const was = overlap(project.rooms.find(x => x.id === a.id).polygon, project.rooms.find(x => x.id === b.id).polygon); if (!was && overlap(a.polygon, b.polygon)) return fail('room-overlap', { roomId: a.id, other: b.id }); }
    const samples = (A0, B0) => [0.02, 0.25, 0.5, 0.75, 0.98].map(t => add(A0, mul(sub(B0, A0), t)));
    const sA = samples(r.A, r.B), sB = samples(add(r.A, dv), add(r.B, dv));
    for (const room of project.rooms) { const poly0 = room.polygon, poly1 = next.rooms.find(x => x.id === room.id).polygon; const was = sA.filter(q => strictIn(q, poly0)).length, now = sB.filter(q => strictIn(q, poly1)).length; if (now > was) return fail('wall-into-room', { roomId: room.id }); }
    // 6 · Muebles: los apoyados en una cara del tramo acompañan; los que quedarían atravesados se informan.
    const footprint = o => { const a = (o.rotationDeg || 0) * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), hw = o.size.widthMm / 2, hd = o.size.depthMm / 2; return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, y]) => ({ x: o.position.x + x * hw * c - y * hd * s, y: o.position.y + x * hw * s + y * hd * c })); };
    const tRun = Math.max(...r.walls.map(w => w.thicknessMm)) / 2, Lr = dist(r.A, r.B);
    const crossesRun = (fp, A0, u, nn) => { const ds = fp.map(p => dot(sub(p, A0), nn)), ss = fp.map(p => dot(sub(p, A0), u)); return Math.min(...ds) < tRun - 1 && Math.max(...ds) > -tRun + 1 && Math.max(...ss) > 1 && Math.min(...ss) < Lr - 1; };
    const objects = { moved: [], crossed: [] };
    for (const o of next.objects) {
      if (!o?.position || !o?.size) continue;
      const fp = footprint(o), ds = fp.map(p => dot(sub(p, r.A), r.n)), ss = fp.map(p => dot(sub(p, r.A), r.u));
      const overlap = Math.min(Lr, Math.max(...ss)) - Math.max(0, Math.min(...ss)) > 1;
      const near = Math.min(...ds.map(x => Math.abs(x))), parallelEdge = Math.abs(Math.sin(((o.rotationDeg || 0) * Math.PI / 180) - Math.atan2(r.u.y, r.u.x))) < 0.02 || Math.abs(Math.cos(((o.rotationDeg || 0) * Math.PI / 180) - Math.atan2(r.u.y, r.u.x))) < 0.02;
      const leaning = overlap && parallelEdge && near >= tRun - 3 && near <= tRun + LEAN_MM && (Math.min(...ds) >= tRun - 3 || Math.max(...ds) <= -tRun + 3);
      if (leaning) { o.position = rnd(add(o.position, dv)); objects.moved.push(o.id); continue; }
      const was = crossesRun(fp, r.A, r.u, r.n), now = crossesRun(fp, add(r.A, dv), r.u, r.n);
      if (now && !was) objects.crossed.push(o.id);
    }
    // 7 · Validación del proyecto y asociación estancia↔muros con la autoridad de mediciones.
    try { Core?.validate?.(next); } catch (e) { return fail(/area|polygon|self-intersection|vertex|edges/.test(e.message) ? 'room-too-small' : 'invalid-result', { error: e.message }); }
    if (Q?.room) for (const room of project.rooms) {
      const a = Q.room(project, room.id), b = Q.room(next, room.id);
      const before = a?.wallFaces, after = b?.wallFaces;
      if (before?.associationComplete && !after?.associationComplete) return fail('room-association-lost', { roomId: room.id, reason: after?.reason || null });
      // La estancia sigue delimitada por las caras del muro movido (otras caras pueden dejar de tocarla si encoge: es correcto).
      if (before?.associationComplete) { const kb = new Set((after.segments || []).map(s => s.wallId + ':' + s.face)); for (const s of before.segments || []) if (inRun.has(s.wallId) && !kb.has(s.wallId + ':' + s.face)) return fail('room-association-lost', { roomId: room.id, reason: 'moved-wall-face' }); }
    }
    const walls = [...moved.keys()].map(id => { const a = before.get(id), b = W(id); return { id, role: inRun.has(id) ? 'moved' : 'adjusted', lengthBeforeMm: Math.round(wlen(a)), lengthAfterMm: Math.round(wlen(b)) }; });
    return { ok: true, next, report: { format: 'rubik-sota.wall-move', version: '1.0.0', wallId, run: r.ids, offsetMm, normal: { x: +r.n.x.toFixed(6), y: +r.n.y.toFixed(6) }, tangentialMm: { A: Math.round(tA), B: Math.round(tB) }, walls, openings, rooms, objects } };
  }

  return Object.freeze({ VERSION: '1.0.0', LIMITS: Object.freeze({ JOINT_MM, MIN_SIN, MIN_WALL_MM, MIN_ROOM_M2, MAX_OFFSET_MM, LEAN_MM }), run, sides, plan, explain, CODES: Object.freeze(Object.keys(TEXT)) });
});
