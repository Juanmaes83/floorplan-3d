'use strict';
/* SCULPT Simulator · E · Preflight de colisiones a lo largo del TIEMPO (puro, sin navegador ni three).
 *
 * Origen: simulator@57d562c `sims/{site,plant,airport,warehouse}-collide/main.js` (MIT).
 *  KEEP: muestrear a paso fijo, intersecar cajas orientadas por parejas, lista de contactos esperados, informe por pareja.
 *  REPLACE: `three/addons/math/OBB` → separación de ejes propia (15 ejes); `W.pose(t)` → poses del llamante;
 *           encogimiento relativo del 3 % → tolerancia ABSOLUTA en metros, declarada y justificada (ver TOLERANCES).
 *  GENERALISE: esferas móviles (cámara) con comprobación CONTINUA entre muestras; cajas móviles con subdivisión adaptativa.
 *  Corregido respecto al donante (auditoría): el donante resumía cada pareja en un único «desde–hasta (n)», que funde
 *  contactos discontinuos y oculta huecos; aquí cada racha contigua es un intervalo propio. El donante concedía «sin
 *  contactos» aunque faltasen poses; aquí falta de muestra ⇒ resultado INCOMPLETO, nunca favorable.
 *
 * Es una COMPROBACIÓN GEOMÉTRICA de una visualización, no una certificación estructural, normativa ni de seguridad,
 * ni un motor de navegación.
 */
const EPS = 1e-9;
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const lerp = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const finite3 = v => Array.isArray(v) && v.length === 3 && v.every(Number.isFinite);
const err = (code, msg) => Object.assign(Error(msg), { code });

/** Tolerancias por defecto y su justificación (se copian al informe). Unidades: metros. */
const TOLERANCES = Object.freeze({
  // RUBIK guarda medidas en mm enteros y el visor redondea a mm: 1 mm de holgura evita contar como contacto dos caras
  // coplanarias (mueble pegado a muro) sin ocultar ninguna interpenetración visible (≥ 2 mm).
  contactToleranceM: 0.001,
  // Radio de la cámara: la esfera que contiene el rectángulo del plano cercano del visor de RUBIK
  // (PerspectiveCamera(FOV=45°, aspecto, near=0,05)): r = near·√(1 + tan²(fov/2)·(1 + aspecto²)). Si un sólido entra
  // en esa esfera, el plano cercano lo corta y la imagen muestra su interior. Se calcula con cameraRadius().
  nearPlaneM: 0.05,
});
/** Radio mínimo de la cámara para no recortar sólidos con el plano cercano (ver TOLERANCES). */
function cameraRadius({ fovDeg = 45, aspect = 16 / 10, near = TOLERANCES.nearPlaneM, margin = 0 } = {}) {
  if (![fovDeg, aspect, near, margin].every(Number.isFinite) || fovDeg <= 0 || fovDeg >= 180 || aspect <= 0 || near <= 0 || margin < 0) throw err('RADIUS', 'Invalid camera parameters');
  const t = Math.tan(fovDeg * Math.PI / 360);
  return near * Math.sqrt(1 + t * t * (1 + aspect * aspect)) + margin;
}

/** Caja orientada: centro, semiejes y tres ejes unitarios. `yaw` gira alrededor de Y (Y arriba, como Three/RUBIK).
 *  `inset` (m) reduce cada semieje en valor absoluto (tolerancia de contacto), nunca un porcentaje. */
function obb({ center, half, yaw = 0, inset = 0 }) {
  if (!finite3(center) || !finite3(half) || !Number.isFinite(yaw) || !(inset >= 0)) throw err('OBB', 'Invalid box');
  const c = Math.cos(yaw), s = Math.sin(yaw);
  return { center: [...center], half: half.map(h => Math.max(0, h - inset)), axes: [[c, 0, -s], [0, 1, 0], [s, 0, c]] };
}
/** ¿Se solapan dos cajas orientadas? Teorema del eje separador (3 + 3 + 9 ejes). Tocarse no cuenta. */
function obbIntersects(A, B) {
  const T = sub(B.center, A.center), axes = [...A.axes, ...B.axes];
  for (const a of A.axes) for (const b of B.axes) { const c = cross(a, b); const l = Math.hypot(...c); if (l > 1e-6) axes.push(c.map(v => v / l)); }
  for (const L of axes) {
    const ra = A.half.reduce((s, h, i) => s + h * Math.abs(dot(A.axes[i], L)), 0), rb = B.half.reduce((s, h, i) => s + h * Math.abs(dot(B.axes[i], L)), 0);
    if (Math.abs(dot(T, L)) >= ra + rb - EPS) return false;
  }
  return true;
}
/** Distancia de un punto a una caja orientada (0 si está dentro). */
function pointObbDistance(p, B) {
  const d = sub(p, B.center); let s = 0;
  for (let i = 0; i < 3; i++) { const x = Math.abs(dot(d, B.axes[i])) - B.half[i]; if (x > 0) s += x * x; }
  return Math.sqrt(s);
}
/** Distancia mínima de un SEGMENTO a una caja (función convexa a lo largo del segmento: búsqueda ternaria exacta a 1e-7). */
function segmentObbDistance(p, q, B) {
  let lo = 0, hi = 1;
  for (let k = 0; k < 80 && hi - lo > 1e-7; k++) {
    const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3;
    if (pointObbDistance(lerp(p, q, m1), B) <= pointObbDistance(lerp(p, q, m2), B)) hi = m2; else lo = m1;
  }
  const k = (lo + hi) / 2;
  return { distance: Math.min(pointObbDistance(p, B), pointObbDistance(q, B), pointObbDistance(lerp(p, q, k), B)), at: k };
}

/** Normaliza la lista de contactos permitidos. Cada entrada exige `reason`; `mover`/`obstacle` son id exactos o
 *  funciones (id, obstáculo) → bool. Devuelve un buscador que devuelve la entrada aplicable (para registrarla). */
function allowList(allow) {
  if (allow == null) return () => null;
  if (!Array.isArray(allow)) throw err('ALLOW', 'allow must be an array of {mover, obstacle, reason}');
  const rules = allow.map((r, i) => {
    if (!r || typeof r.reason !== 'string' || !r.reason.trim()) throw err('ALLOW', `allow[${i}] needs a non-empty reason`);
    if (r.mover == null || r.obstacle == null) throw err('ALLOW', `allow[${i}] needs mover and obstacle`);
    const m = v => (typeof v === 'function' ? v : x => x === v);
    return { id: r.id || `allow-${i}`, reason: r.reason.trim(), mover: m(r.mover), obstacle: typeof r.obstacle === 'function' ? r.obstacle : (id) => id === r.obstacle };
  });
  return (moverId, st) => rules.find(r => r.mover(moverId) && r.obstacle(st.id, st)) || null;
}

/**
 * Barre el tiempo y devuelve los contactos como INTERVALOS CONTIGUOS por pareja.
 *  movers: [{id, at(t) → {kind:'sphere', center, radius} | {kind:'obb', center, half, yaw}, continuous?: bool}]
 *  statics: [{id, box (obb), kind?, ...}]
 *  times: instantes a comprobar (estrictamente crecientes); alternativa: from/to/step.
 *  allow: [{mover, obstacle, reason}] → los contactos que encajan se registran en `allowed`, no se ocultan.
 *  maxStepM: desplazamiento máximo entre muestras para cajas móviles; si se supera y `at` admite cualquier t,
 *            se subdivide (hasta `maxDepth`); si no puede, se declara en `coverage.gaps`.
 * Resultado `status`: 'clear' (sin contactos, cobertura completa) | 'contact' | 'incomplete' (faltan poses o
 * cobertura): ok solo es true con 'clear'.
 */
function sweep({ movers, statics, from = 0, to, step = 0.1, times = null, allow = null, maxStepM = 0.05, maxDepth = 8 }) {
  if (!Array.isArray(movers) || !movers.length || !Array.isArray(statics)) throw err('INPUT', 'sweep: movers and statics are required');
  let ts = times;
  if (!ts) { if (!(step > 0) || !Number.isFinite(to) || !Number.isFinite(from) || to < from) throw err('INPUT', 'sweep: from ≤ to and step > 0 are required'); ts = []; for (let i = 0; from + i * step <= to + 1e-9; i++) ts.push(+(from + i * step).toFixed(6)); }
  if (!Array.isArray(ts) || ts.length < 1 || !ts.every(Number.isFinite)) throw err('INPUT', 'sweep: times must be finite numbers');
  for (let i = 1; i < ts.length; i++) if (!(ts[i] > ts[i - 1])) throw err('INPUT', 'sweep: times must be strictly increasing');
  for (const s of statics) if (!s || typeof s.id !== 'string' || !s.box) throw err('INPUT', 'sweep: every static needs id and box');
  const allowed = allowList(allow);
  const runs = new Map(), allowedHits = new Map(), missing = [], gaps = [];
  // Una racha se cierra cuando la siguiente muestra comprobada de ese móvil no toca: contactos separados = intervalos separados.
  const open = new Map(); // key → índice de muestra del último contacto
  const record = (map, key, base, t, idx, depth, between) => {
    const list = map.get(key) || []; const last = list[list.length - 1];
    if (last && last.lastIndex === idx - 1) { last.to = t; last.samples++; last.lastIndex = idx; last.maxDepth = Math.max(last.maxDepth, depth); last.betweenSamples = last.betweenSamples || between; }
    else if (last && last.lastIndex === idx) { last.maxDepth = Math.max(last.maxDepth, depth); last.betweenSamples = last.betweenSamples || between; }
    else list.push({ ...base, from: t, to: t, samples: 1, lastIndex: idx, maxDepth: depth, betweenSamples: between });
    map.set(key, list);
  };
  const test = (mv, b, prev, st) => {
    if (b.kind === 'sphere') {
      const d = pointObbDistance(b.center, st.box);
      if (d < b.radius) return { depth: b.radius - d, between: false };
      // Solo tramos cuyos dos extremos están libres: un contacto que ya empezó en una muestra no se cuenta dos veces.
      if (prev && mv.continuous !== false && pointObbDistance(prev.center, st.box) >= prev.radius) { const s = segmentObbDistance(prev.center, b.center, st.box); if (s.distance < Math.min(prev.radius, b.radius)) return { depth: Math.min(prev.radius, b.radius) - s.distance, between: true }; }
      return null;
    }
    return obbIntersects(b, st.box) ? { depth: 0, between: false } : null;
  };
  const valid = b => b && ((b.kind === 'sphere' && finite3(b.center) && b.radius > 0) || (b.kind === 'obb' && finite3(b.center) && finite3(b.half) && Number.isFinite(b.yaw || 0)));
  for (const mv of movers) {
    if (!mv || typeof mv.id !== 'string' || typeof mv.at !== 'function') throw err('INPUT', 'sweep: every mover needs id and at(t)');
    let prev = null;
    ts.forEach((t, idx) => {
      const raw = mv.at(t);
      if (!valid(raw)) { missing.push({ mover: mv.id, t }); prev = null; return; }
      const b = raw.kind === 'obb' ? obb(raw) : raw;
      // Cajas móviles: subdivisión adaptativa del tramo previo si se desplazó más de maxStepM.
      const probes = [b];
      if (b.kind !== 'sphere' && prev && idx > 0) {
        const dist = Math.hypot(...sub(b.center, prev.center));
        if (dist > maxStepM) {
          const n = Math.min(2 ** maxDepth, Math.ceil(dist / maxStepM)), t0 = ts[idx - 1];
          let ok = true;
          for (let k = 1; k < n; k++) { const r = mv.at(t0 + (t - t0) * k / n); if (!valid(r)) { ok = false; break; } probes.unshift(obb(r)); }
          if (!ok || dist / n > maxStepM) gaps.push({ mover: mv.id, from: t0, to: t, displacementM: +dist.toFixed(4), reason: ok ? 'subdivision limit' : 'pose not available between samples' });
        }
      }
      for (const st of statics) {
        let hit = null;
        for (const p of probes) { const h = test(mv, p, p === b ? prev : null, st); if (h && (!hit || h.depth > hit.depth)) hit = h; }
        if (!hit) continue;
        const rule = allowed(mv.id, st), key = mv.id + '|' + st.id, base = { mover: mv.id, obstacle: st.id, obstacleKind: st.kind || null };
        if (rule) record(allowedHits, key, { ...base, allowId: rule.id, reason: rule.reason }, t, idx, hit.depth, hit.between);
        else record(runs, key, base, t, idx, hit.depth, hit.between);
      }
      prev = b;
    });
  }
  const flat = m => [...m.values()].flat().map(({ lastIndex, ...r }) => ({ ...r, maxDepth: Math.round(r.maxDepth * 1e4) / 1e4 })).sort((x, y) => x.from - y.from || x.obstacle.localeCompare(y.obstacle) || x.mover.localeCompare(y.mover));
  const contacts = flat(runs), allowedContacts = flat(allowedHits);
  const status = missing.length || gaps.length ? 'incomplete' : contacts.length ? 'contact' : 'clear';
  return { status, ok: status === 'clear', samples: ts.length, from: ts[0], to: ts[ts.length - 1], contacts, allowedContacts,
    coverage: { complete: !missing.length && !gaps.length, missing, gaps, continuousSpheres: true, maxStepM } };
}

module.exports = { TOLERANCES, cameraRadius, obb, obbIntersects, pointObbDistance, segmentObbDistance, sweep };
