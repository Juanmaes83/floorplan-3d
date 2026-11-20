'use strict';
/* SCULPT Simulator · A · Fábrica de bloques HILADA A HILADA para la Evolución 4D de RUBIK (núcleo puro, UMD, sin three).
 *
 * Origen: simulator@57d562c `sims/site-shared/site.js#buildToyWalls` (MIT). KEEP: hiladas de altura h/round(h/curso);
 * aparejo a matajuntas (las hiladas impares empiezan media pieza dentro); huecos recortados de la hilada; dintel con entrega
 * de 0,3 m a cada lado colocado al empezar la hilada de su cabeza; colocación pieza a pieza en orden de recorrido, con
 * caída suave de la pieza en curso. GENERALISE: muros CANÓNICOS de RUBIK de cualquier orientación y huecos del proyecto
 * (offset, ancho, alféizar, altura), en lugar de una caja de 4 lados con huecos inventados; encuentros alternados por
 * hilada (traba en esquina). REMOVE: máquinas, acopios, vaciado, planta, valla, caseta, grúa y andamio (atrezo excluido o ya
 * en RUBIK: evolucion/illustrative-props.js), colores y texturas del donante.
 * Representación ILUSTRATIVA del plan: no es despiece de obra ni medición; el progreso `k` lo da la autoridad 4D de RUBIK
 * (FloorPlanConstructionVisualState), nunca este módulo. Unidades: mm, marco local del muro (x a lo largo, y vertical).
 */
(function (root, factory) { const api = factory(); if (typeof module === 'object' && module.exports) module.exports = api; else root.RubikMasonry = api; })(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const DEFAULTS = Object.freeze({ courseMm: 200, blockMm: 400, joint: 10, bearingMm: 300, minPieceMm: 60 });
  // Caída de la pieza en curso. El donante usa 500 mm con una sola obra; con todos los muros colocando a la vez (hiladas
  // sincronizadas) eso llenaba el aire de piezas sueltas en la QA visual. 160 mm (< 1 hilada): se lee «asentar», no flotar.
  const DROP_MM = 160;
  const clamp01 = v => Math.min(1, Math.max(0, v));
  const ease = u => 1 - Math.pow(1 - u, 3); // caída suave (el donante usa una curva equivalente)

  /**
   * wall: {id, lengthMm, thicknessMm, heightMm, openings:[{id, offsetMm, widthMm, sillMm, headMm}], joints?:{start, end}}
   * joints: 'extend' | 'none' en cada extremo (encuentro con otro muro): se alterna por hilada para trabar la esquina.
   * Devuelve {courses, courseMm, items:[{kind:'full'|'cut'|'lintel', course, x0, x1, y0, y1, openingId?}]} en orden de colocación.
   */
  function wallBlocks(wall, options = {}) {
    const o = { ...DEFAULTS, ...options }, L = wall.lengthMm, H = wall.heightMm, T = wall.thicknessMm;
    if (!(L > 0 && H > 0 && T > 0)) throw Error('wallBlocks: length, height and thickness must be positive');
    const n = Math.max(1, Math.round(H / o.courseMm)), ch = H / n, items = [];
    const ops = (wall.openings || []).filter(p => p.widthMm > 0 && p.headMm > p.sillMm).map(p => ({ ...p, x0: p.offsetMm, x1: p.offsetMm + p.widthMm }));
    for (let c = 0; c < n; c++) {
      const y0 = c * ch, y1 = y0 + ch, piers = []; // pilar de esquina cuando ninguno de los dos muros tiene cuerpo (ventana en esquina)
      // Encuentros (medido en la auditoría visual: con la misma paridad en ambos muros, solapes en pares y huecos en impares):
      //  - {type:'corner', rank, other}: traba; el muro de rango par entra en hiladas pares y se retira en impares, y al revés.
      //  - {type:'abut', other}: acomete a mitad de otro muro (T): se retira siempre la mitad del grueso del pasante.
      // `limit`: extensión máxima antes de entrar en la huella de un tercer muro (nudos de 3 muros que el emparejamiento no ve).
      const lim = (j, e) => (e > 0 && Number.isFinite(j.limit) ? Math.min(e, j.limit) : e);
      const ext = side => { const j = wall.joints && wall.joints[side]; if (!j || j === 'none') return 0;
        if (j.type === 'abut') return -j.other / 2;
        if (j.type === 'continuous') return 0;
        if (j.type === 'corner') return lim(j, (c + j.rank) % 2 === 0 ? j.other / 2 : -T / 2);
        // Esquina de RUBIK: los extremos no coinciden y su posición respecto al otro muro VARÍA (medido en el ejemplo: en la
        // cara interior, en la exterior o entre medias). En hiladas alternas el muro llega a la cara LEJANA del otro (cubre el
        // cuadrado de esquina) o a la CERCANA (lo deja para el otro): caras exteriores enrasadas, sin dientes ni huecos.
        // Quién cubre el cuadrado de esquina en esta hilada: el muro con CUERPO en ese extremo (sin hueco que llegue a la
        // esquina en la hilada). Ambos: alternan por rango; uno: siempre ese; ninguno (ventana en esquina): pilar del rango 0.
        if (j.type === 'face-corner') { const self = !ops.some(p => (side === 'start' ? p.x0 <= o.minPieceMm : p.x1 >= L - o.minPieceMm) && y1 > p.sillMm + 1e-6 && y0 < p.headMm - 1e-6);
          const mate = !(j.mateGaps || []).some(([s0, s1]) => y1 > s0 + 1e-6 && y0 < s1 - 1e-6);
          const take = self && mate ? (c + j.rank) % 2 === 0 : self ? true : mate ? false : j.rank === 0;
          if (take && !self) piers.push(side === 'start' ? [Math.max(0, -j.far), Math.min(L, -j.near)] : [Math.max(0, L + j.near), Math.min(L, L + j.far)]);
          return lim(j, take ? j.far : j.near); }
        return 0; };
      const a = -ext('start'), b = L + ext('end');
      const pieces = []; let x = a;
      const first = c % 2 ? o.blockMm / 2 : 0; // matajuntas (KEEP)
      if (first > 0) { pieces.push([x, Math.min(b, x + first)]); x += first; }
      while (x < b - 1e-6) { pieces.push([x, Math.min(b, x + o.blockMm)]); x += o.blockMm; }
      const cuts = [];
      for (const p of ops) {
        if (y1 > p.sillMm + 1e-6 && y0 < p.headMm - 1e-6) cuts.push([p.x0, p.x1]); // la hilada atraviesa el hueco
        if (y0 <= p.headMm + 1e-6 && y1 > p.headMm + 1e-6 && p.headMm < H - 1e-6) { // hilada de la cabeza: dintel con entregas
          const la = Math.max(a, p.x0 - o.bearingMm), lb = Math.min(b, p.x1 + o.bearingMm);
          cuts.push([la, lb]); items.push({ kind: 'lintel', course: c, x0: la, x1: lb, y0: Math.max(y0, p.headMm), y1, openingId: p.id || null });
          // Si la cabeza cae a mitad de hilada, bajo las entregas del dintel se completa con piezas cortadas (sin huecos).
          if (p.headMm > y0 + 1e-6) for (const [s0, s1] of [[la, p.x0], [p.x1, lb]]) if (s1 - s0 >= o.minPieceMm) items.push({ kind: 'cut', course: c, x0: s0, x1: s1, y0, y1: p.headMm });
        }
      }
      const row = [];
      for (const [p0, p1] of pieces) {
        let segs = [[p0, p1]];
        for (const [c0, c1] of cuts) { const next = []; for (const [q0, q1] of segs) { if (c1 <= q0 || c0 >= q1) next.push([q0, q1]); else { if (c0 > q0) next.push([q0, c0]); if (c1 < q1) next.push([c1, q1]); } } segs = next; }
        row.push(...segs);
      }
      // Astillas (< minPieceMm): el donante las descartaba, pero en el extremo de un muro o junto a una jamba dejan una muesca
      // (medido en la QA visual). Se unen a la pieza contigua de la hilada; solo se descarta una astilla aislada.
      const merged = [];
      for (const [q0, q1] of row) {
        if (q1 - q0 >= o.minPieceMm) { merged.push([q0, q1]); continue; }
        const prev = merged[merged.length - 1];
        if (prev && Math.abs(prev[1] - q0) < 1e-6) { prev[1] = q1; continue; }
        merged.push([q0, q1, 'sliver']);
      }
      for (let k = 0; k < merged.length; k++) if (merged[k][2] === 'sliver') { const nx = merged[k + 1]; if (nx && Math.abs(nx[0] - merged[k][1]) < 1e-6) { nx[0] = merged[k][0]; merged[k] = null; } }
      for (const m of merged) {
        if (!m || m[2] === 'sliver') continue;
        const [q0, q1] = m; items.push({ kind: Math.abs(q1 - q0 - o.blockMm) < 1e-6 ? 'full' : 'cut', course: c, x0: q0, x1: q1, y0, y1 });
      }
      for (const [q0, q1] of piers) if (q1 - q0 >= 1) items.push({ kind: 'cut', course: c, x0: q0, x1: q1, y0, y1, pier: true });
    }
    // Cada dintel entra al empezar su hilada (KEEP): dentro de la hilada, primero el dintel, después las piezas por x.
    items.sort((p, q) => p.course - q.course || (p.kind === 'lintel' ? -1 : 0) - (q.kind === 'lintel' ? -1 : 0) || p.x0 - q.x0);
    return { wallId: wall.id || null, courses: n, courseMm: ch, lengthMm: L, heightMm: H, thicknessMm: T, joint: o.joint, items };
  }

  /** Estado en el progreso k ∈ [0,1]: piezas colocadas, la pieza en curso con su caída (mm) y las aún no puestas.
   * Hiladas SINCRONIZADAS por altura: la hilada c ocupa k ∈ [c/n, (c+1)/n] en TODOS los muros, y dentro de ella las piezas
   * entran en orden. Medido en la QA visual: con el reparto «pieza a pieza por muro», los tramos sobre ventanas (que solo
   * tienen piezas por encima del hueco) aparecían flotando antes de que subieran los muros vecinos. */
  function builtAt(plan, k, { heightMm } = {}) {
    // Altura de referencia común (opcional): con la del muro más alto, un antepecho de 1 m termina en k = 1/2,8 en lugar de
    // estirar sus 5 hiladas hasta k = 1. Por omisión, la del propio muro.
    const n = (heightMm > 0 ? heightMm : plan.heightMm) / plan.courseMm, v = clamp01(Number(k) || 0) * n, out = [], per = new Map();
    for (const it of plan.items) per.set(it.course, (per.get(it.course) || 0) + 1);
    const seen = new Map();
    plan.items.forEach((it, i) => { const j = seen.get(it.course) || 0; seen.set(it.course, j + 1);
      const u = clamp01((v - it.course) * per.get(it.course) - j); if (u <= 0) return;
      out.push({ ...it, i, drop: u >= 1 ? 0 : Math.round(DROP_MM * (1 - ease(u)) * 1e3) / 1e3, settled: u >= 1 }); });
    return out;
  }

  /**
   * ¿Se puede pintar este muro como fábrica hilada? Muros «con forma» de OP-07 (curvos `wall.curve` o con altura final
   * `wall.heightEndMm`): la autoridad es `Core.shapedWall` (floorplan-3d@3833838e, js/project-core.js L17); si el Core no
   * la exporta todavía (master sin OP-07), se usa EXACTAMENTE la misma expresión del contrato. Un muro con forma NO se pinta
   * como fábrica: conserva su representación canónica de RUBIK (sus piezas sólidas en la Evolución). Sigue en el
   * inventario, el presupuesto, el plan y la Evolución: solo se excluye de la generación de bloques. Sus vecinos no se traban
   * con él (extremo libre): no se inventa un encuentro que la fábrica no sabe representar. Sin geometría curva propia.
   */
  const SHAPED = w => !!(w && (w.curve || w.heightEndMm !== undefined)); // copia literal del contrato OP-07
  function support(w, Core) {
    const shaped = Core && typeof Core.shapedWall === 'function' ? Core.shapedWall(w) : SHAPED(w);
    return shaped ? { supported: false, reason: 'shaped-wall', authority: Core && typeof Core.shapedWall === 'function' ? 'Core.shapedWall' : 'contract-expression' } : { supported: true, reason: null };
  }

  /** Muros de RUBIK → muros de fábrica, con huecos y encuentros (esquina con rango de traba, o acometida en T). */
  function fromProject(project, { Core, defaultHeightMm } = {}) {
    if (!Core || typeof Core.geometry !== 'function') throw Error('fromProject: pass RUBIK FloorPlanCore as Core');
    const H0 = defaultHeightMm || (project.defaults && project.defaults.wallHeightMm) || 2800, walls = (project.walls || []).filter(w => w.status !== 'demolished' && support(w, Core).supported);
    const key = p => `${Math.round(p.x)},${Math.round(p.y)}`, nodes = new Map();
    for (const w of walls) for (const side of ['start', 'end']) { const k = key(w[side]); if (!nodes.has(k)) nodes.set(k, []); nodes.get(k).push({ w, side }); }
    // Punto en el interior del eje de otro muro (acometida en T), con tolerancia de 2 mm.
    const abutOn = (p, self) => walls.find(o => { if (o === self) return false; const dx = o.end.x - o.start.x, dy = o.end.y - o.start.y, L2 = dx * dx + dy * dy; if (!L2) return false;
      const t = ((p.x - o.start.x) * dx + (p.y - o.start.y) * dy) / L2; if (t <= 0.001 || t >= 0.999) return false; return Math.hypot(o.start.x + t * dx - p.x, o.start.y + t * dy - p.y) <= 2; });
    // Emparejamiento global de extremos sueltos: candidatos (≤ grueso·1,5, no colineales) ordenados por distancia e ids; cada
    // extremo se usa una sola vez. Determinista y mutuo por construcción.
    const dirOf = ({ w: o, side }) => { const a = side === 'start' ? o.start : o.end, b = side === 'start' ? o.end : o.start, L = Math.hypot(b.x - a.x, b.y - a.y) || 1; return [(b.x - a.x) / L, (b.y - a.y) / L]; };
    // Relleno: muro corto contenido entero en la banda de otro (RUBIK cierra así jambas y encuentros, p. ej. 240 mm × 90 mm
    // entre una puerta corredera y un muro). No forma esquina: sus extremos quedan rectos y no se emparejan.
    const inBand = (p, r) => { const L = Math.hypot(r.end.x - r.start.x, r.end.y - r.start.y); if (!L) return false; const ux = (r.end.x - r.start.x) / L, uy = (r.end.y - r.start.y) / L, dx = p.x - r.start.x, dy = p.y - r.start.y, s = dx * ux + dy * uy, t = -dx * uy + dy * ux;
      return Math.abs(t) <= r.thicknessMm / 2 + 1 && s >= -r.thicknessMm - 1 && s <= L + r.thicknessMm + 1; };
    const filler = new Set(walls.filter(w => Math.hypot(w.end.x - w.start.x, w.end.y - w.start.y) <= Math.max(...walls.map(r => r.thicknessMm)) + 1 && walls.some(r => r !== w && inBand(w.start, r) && inBand(w.end, r))).map(w => w.id));
    const loose = walls.flatMap(o => ['start', 'end'].map(side => ({ w: o, side }))).filter(x => !filler.has(x.w.id) && (nodes.get(key(x.w[x.side])) || []).length === 1 && !abutOn(x.w[x.side], x.w));
    const cand = [];
    for (let i = 0; i < loose.length; i++) for (let j = i + 1; j < loose.length; j++) { const A = loose[i], B = loose[j]; if (A.w === B.w) continue;
      const d = Math.hypot(A.w[A.side].x - B.w[B.side].x, A.w[A.side].y - B.w[B.side].y), da = dirOf(A), db = dirOf(B);
      if (d > 0 && d <= Math.max(A.w.thicknessMm, B.w.thicknessMm) * 1.5 && Math.abs(da[0] * db[0] + da[1] * db[1]) < 0.5) cand.push({ A, B, d, k: [A.w.id, A.side, B.w.id, B.side].join('|') }); }
    cand.sort((x, y) => x.d - y.d || x.k.localeCompare(y.k));
    const pairs = new Map();
    for (const { A, B } of cand) { const ka = A.w.id + '|' + A.side, kb = B.w.id + '|' + B.side; if (pairs.has(ka) || pairs.has(kb)) continue; pairs.set(ka, B); pairs.set(kb, A); }
    // Rayo (origen o, dirección d unitaria) contra la huella de un muro (rectángulo del eje ± grueso/2, reducido 1 mm):
    // distancia de entrada ≥ 0, o Infinity.
    const rayIn = (o, d, r) => { const L = Math.hypot(r.end.x - r.start.x, r.end.y - r.start.y), ux = (r.end.x - r.start.x) / L, uy = (r.end.y - r.start.y) / L;
      const ox = o.x - r.start.x, oy = o.y - r.start.y, s0 = ox * ux + oy * uy, t0 = -ox * uy + oy * ux, ds = d[0] * ux + d[1] * uy, dt = -d[0] * uy + d[1] * ux;
      let lo = 0, hi = Infinity;
      for (const [p, q, a, b] of [[s0, ds, 1, L - 1], [t0, dt, -r.thicknessMm / 2 + 1, r.thicknessMm / 2 - 1]]) {
        if (Math.abs(q) < 1e-12) { if (p <= a || p >= b) return Infinity; continue; }
        let e0 = (a - p) / q, e1 = (b - p) / q; if (e0 > e1) [e0, e1] = [e1, e0]; lo = Math.max(lo, e0); hi = Math.min(hi, e1); }
      return lo < hi ? lo : Infinity; };
    const limitOf = (w, side, j) => { if (!j || (j.type !== 'corner' && j.type !== 'face-corner')) return j;
      const at = side === 'start' ? w.start : w.end, other = side === 'start' ? w.end : w.start, L = Math.hypot(other.x - at.x, other.y - at.y), d = [(at.x - other.x) / L, (at.y - other.y) / L];
      const skip = new Set([w.id, j.with, ...(nodes.get(key(at)) || []).map(x => x.w.id)]); let m = Infinity;
      for (const t of [-w.thicknessMm / 2 + 1, 0, w.thicknessMm / 2 - 1]) { const o = { x: at.x - d[1] * t, y: at.y + d[0] * t };
        for (const r of walls) if (!skip.has(r.id)) m = Math.min(m, rayIn(o, d, r)); }
      return Number.isFinite(m) ? { ...j, limit: Math.round(m * 1000) / 1000 } : j; };
    return walls.map(w => {
      const L = Math.hypot(w.end.x - w.start.x, w.end.y - w.start.y), H = w.heightMm || H0;
      const openings = (project.openings || []).filter(p => p.wallId === w.id).map(p => ({ id: p.id, offsetMm: p.offsetMm, widthMm: p.widthMm, sillMm: p.sillHeightMm || 0, headMm: Math.min(H, (p.sillHeightMm || 0) + p.heightMm) }));
      // Dirección saliente de un muro desde el nudo (para saber qué muros son colineales en un encuentro).
      const out = ({ w: o, side }) => { const a = side === 'start' ? o.start : o.end, b = side === 'start' ? o.end : o.start, L = Math.hypot(b.x - a.x, b.y - a.y) || 1; return [(b.x - a.x) / L, (b.y - a.y) / L]; };
      const joint = side => { const at = nodes.get(key(w[side])) || [], me = at.find(x => x.w === w && x.side === side);
        if (at.length > 1) {
          const others = at.filter(x => x !== me), dir = out(me), straight = others.find(x => { const d = out(x); return d[0] * dir[0] + d[1] * dir[1] < -0.999; });
          // Colineal con otro muro del nudo: el muro continúa (enrasado en el nudo). Con ≥3 muros, los no colineales acometen.
          if (straight) return { type: 'continuous', with: straight.w.id };
          const line = others.find(x => others.some(y => y !== x && out(x)[0] * out(y)[0] + out(x)[1] * out(y)[1] < -0.999));
          if (line) return { type: 'abut', other: line.w.thicknessMm, on: line.w.id };
          const ids = at.map(x => x.w.id).sort(); return { type: 'corner', rank: ids.indexOf(w.id), other: Math.max(...others.map(x => x.w.thicknessMm)) };
        }
        const host = abutOn(w[side], w); if (host) return { type: 'abut', other: host.thicknessMm, on: host.id };
        // Esquina «a caras» de RUBIK: pareja MUTUA del emparejamiento global (medido: la elección «el más cercano» por extremo
        // dejaba 5 parejas no mutuas en el ejemplo, con dientes en las esquinas exteriores).
        const p = w[side], dir = out(me || { w, side }), pm = pairs.get(w.id + '|' + side), mate = pm && { x: pm };
        if (mate) { const m = mate.x.w, mx = m.end.x - m.start.x, my = m.end.y - m.start.y, ml = Math.hypot(mx, my), n = [-my / ml, mx / ml];
          const dAxis = (m.start.x - p.x) * n[0] + (m.start.y - p.y) * n[1], toAxis = dAxis * (dir[0] * n[0] + dir[1] * n[1]) >= 0 ? -Math.abs(dAxis) : Math.abs(dAxis); // dir apunta HACIA DENTRO del muro: eje del otro hacia dentro ⇒ extensión negativa
          const mL = Math.hypot(mx, my), mateGaps = (project.openings || []).filter(q => q.wallId === m.id && (mate.x.side === 'start' ? q.offsetMm <= DEFAULTS.minPieceMm : q.offsetMm + q.widthMm >= mL - DEFAULTS.minPieceMm))
            .map(q => [q.sillHeightMm || 0, (q.sillHeightMm || 0) + q.heightMm]);
          return { type: 'face-corner', rank: w.id < m.id ? 0 : 1, with: m.id, mateGaps, far: Math.round((toAxis + m.thicknessMm / 2) * 1000) / 1000, near: Math.round((toAxis - m.thicknessMm / 2) * 1000) / 1000 }; }
        return 'none'; };
      return { id: w.id, start: { ...w.start }, end: { ...w.end }, angle: Math.atan2(w.end.y - w.start.y, w.end.x - w.start.x), lengthMm: L, thicknessMm: w.thicknessMm, heightMm: H, openings, joints: { start: limitOf(w, 'start', joint('start')), end: limitOf(w, 'end', joint('end')) } };
    });
  }

  /** Fuente de la Evolución (proyecto o edificio) → Map(clave de elemento de RUBIK → muro de fábrica), por planta.
   * Project = FloorPlanConstructionProject (levelsOf y elementKey: las MISMAS claves que el inventario). */
  function indexBySource(source, { Core, Project } = {}) {
    if (!Project || typeof Project.levelsOf !== 'function' || typeof Project.elementKey !== 'function') throw Error('indexBySource: pass FloorPlanConstructionProject as Project');
    const out = new Map();
    for (const lv of Project.levelsOf(source)) for (const w of fromProject(lv.project, { Core })) out.set(Project.elementKey(lv.levelId, w.id), w);
    return out;
  }

  return Object.freeze({ DEFAULTS, wallBlocks, builtAt, fromProject, indexBySource, support });
});
