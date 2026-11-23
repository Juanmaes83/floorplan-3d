/* SCULPT Simulator · B · Plan de rodaje: la pose de cámara como FUNCIÓN PURA DEL TIEMPO (consultable en cualquier t).
 *
 * Origen: simulator@57d562c (MIT). KEEP de `sims/site-shared/film.js`: fotogramas clave con interpolación smootherstep
 * (6u⁵−15u⁴+10u³), pausas por claves repetidas, elevación en arco en los desplazamientos largos (0,3·sin(πk)), recorrido
 * de segmentos de `keyCam` y tabla de intervalos con el progreso de cada fase (`T`, `ss(a,b,t)`). De
 * `sims/kit/runtime.js`: «render(t) es función pura de t», búsqueda (seek), pausa y salto entre marcas.
 * GENERALISE: claves 3D con posición + objetivo + fov (el donante: cámara cenital); orientación por lookAt sin alabeo; el
 * arco del donante multiplica la distancia cenital (d·(1+arc)) y aquí eleva la cámara (y + arc·L·sin): mismo perfil
 * temporal, adaptado a una cámara libre. REMOVE: cortes al ritmo de la música, golpes de zoom, sacudida, destellos,
 * glitch y rótulos de vídeo musical de `kit/director.js`; controles de teclado propios (RUBIK ya tiene los de la
 * presentación): aquí solo hay una API de transporte.
 * La pose se APLICA en RUBIK con su autoridad (View3D.presentationRestorePose); este módulo no toca ninguna escena.
 * UMD como los núcleos de RUBIK: window.RubikShotTimeline / module.exports.
 */
(function (root, factory) { const api = factory(); if (typeof module === 'object' && module.exports) module.exports = api; else root.RubikShotTimeline = api; })(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const VERSION = 1;
  const err = (code, msg) => Object.assign(new Error(msg), { code });
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const smoother = x => { const u = clamp(x); return u * u * u * (u * (u * 6 - 15) + 10); }; // KEEP (film.js `sm`)
  // KEEP (film.js `ss`) + guarda: un intervalo de duración 0 es un CORTE (el donante dividía entre 0).
  const ss = (a, b, t) => (b <= a ? (t >= b ? 1 : 0) : smoother((t - a) / (b - a)));
  const lerp = (a, b, k) => a + (b - a) * k;
  const lerp3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  const r6 = v => Math.round(v * 1e6) / 1e6;
  const vec3 = v => Array.isArray(v) && v.length === 3 && v.every(Number.isFinite);
  const deepFreeze = o => { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); for (const v of Object.values(o)) deepFreeze(v); } return o; };
  const num = (name, v, { min = -Infinity, max = Infinity, gt = false } = {}) => {
    if (!Number.isFinite(v) || (gt ? v <= min : v < min) || v > max) throw err('PARAM', `${name} must be a finite number ${gt ? '>' : '≥'} ${min}${max < Infinity ? ' and ≤ ' + max : ''}`);
    return v;
  };

  /** Cuaternión [x,y,z,w] de una cámara (mira hacia −Z) en `eye` que mira a `target`, con Y arriba y sin alabeo (= Three.lookAt). */
  function lookAtQuaternion(eye, target) {
    if (!vec3(eye) || !vec3(target)) throw err('PARAM', 'lookAt: eye and target must be [x,y,z]');
    let z = [eye[0] - target[0], eye[1] - target[1], eye[2] - target[2]]; const zl = Math.hypot(...z); if (zl < 1e-9) throw err('PARAM', 'lookAt: eye equals target');
    z = z.map(v => v / zl); let x = [z[2], 0, -z[0]]; let xl = Math.hypot(...x);
    if (xl < 1e-9) { x = [1, 0, 0]; xl = 1; } // mirada vertical: eje X del mundo, como Three.lookAt
    x = x.map(v => v / xl); const y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
    const m00 = x[0], m11 = y[1], m22 = z[2], tr = m00 + m11 + m22; let q;
    if (tr > 0) { const s = 0.5 / Math.sqrt(tr + 1); q = [(y[2] - z[1]) * s, (z[0] - x[2]) * s, (x[1] - y[0]) * s, 0.25 / s]; }
    else if (m00 > m11 && m00 > m22) { const s = 2 * Math.sqrt(1 + m00 - m11 - m22); q = [0.25 * s, (y[0] + x[1]) / s, (z[0] + x[2]) / s, (y[2] - z[1]) / s]; }
    else if (m11 > m22) { const s = 2 * Math.sqrt(1 + m11 - m00 - m22); q = [(y[0] + x[1]) / s, 0.25 * s, (z[1] + y[2]) / s, (z[0] - x[2]) / s]; }
    else { const s = 2 * Math.sqrt(1 + m22 - m00 - m11); q = [(z[0] + x[2]) / s, (z[1] + y[2]) / s, 0.25 * s, (x[1] - y[0]) / s]; }
    return q.map(r6);
  }

  const STOP_OPTS = ['hold', 'speed', 'minMove', 'maxMove', 'arc', 'arcFrom', 'reducedMotion'];
  /**
   * Plan a partir de paradas [{position, target, fov, label?, hold?, ...}] (p. ej. View3D.presentationPose: se admiten y
   * se ignoran `quaternion` y `aspect`; la orientación se deriva de position→target).
   * Cada parada se mantiene `hold` s; el traslado dura según su longitud (`speed` m/s) acotado a [minMove, maxMove].
   * `reducedMotion`: sin traslados (corte seco de una parada a la siguiente), como la presentación de RUBIK con
   * prefers-reduced-motion. Traslados más largos que `arcFrom` m se elevan en arco (`arc` · longitud · sin(πk)).
   */
  function fromStops(stops, opts = {}) {
    if (!opts || typeof opts !== 'object') throw err('PARAM', 'fromStops: options must be an object');
    for (const k of Object.keys(opts)) if (!STOP_OPTS.includes(k)) throw err('PARAM', 'fromStops: unknown option ' + k);
    const { hold = 1.5, speed = 2.5, minMove = 1.2, maxMove = 4, arc = 0.3, arcFrom = 6, reducedMotion = false } = opts;
    num('hold', hold, { min: 0 }); num('speed', speed, { min: 0, gt: true }); num('minMove', minMove, { min: 0 }); num('maxMove', maxMove, { min: minMove }); num('arc', arc, { min: 0, max: 1 }); num('arcFrom', arcFrom, { min: 0 });
    if (typeof reducedMotion !== 'boolean') throw err('PARAM', 'reducedMotion must be boolean');
    if (!Array.isArray(stops) || stops.length < 1) throw err('STOPS', 'fromStops: at least one stop is required');
    stops.forEach((s, i) => {
      if (!s || !vec3(s.position) || !vec3(s.target) || !Number.isFinite(s.fov) || s.fov <= 1 || s.fov >= 179 || dist(s.position, s.target) < 1e-6) throw err('STOPS', 'fromStops: invalid stop ' + i);
      if (s.hold != null) num(`stops[${i}].hold`, s.hold, { min: 0 });
      if (s.label != null && typeof s.label !== 'string') throw err('STOPS', `fromStops: stops[${i}].label must be a string`);
    });
    const keys = []; let t = 0;
    stops.forEach((s, i) => {
      if (i && !reducedMotion) { const d = dist(stops[i - 1].position, s.position); t += clamp(d / speed, minMove, maxMove); }
      const base = { position: [...s.position], target: [...s.target], fov: s.fov, label: s.label ?? null, stop: i };
      keys.push({ t: r6(t), ...base, kind: 'arrive' });
      t += s.hold != null ? s.hold : hold;
      keys.push({ t: r6(t), ...base, kind: 'hold-end' }); // clave repetida = pausa (KEEP)
    });
    return create(keys, { arc: reducedMotion ? 0 : arc, arcFrom, reducedMotion });
  }

  /** Plan a partir de claves cronometradas [{t, position, target, fov, label?, kind?, stop?}]: t empieza en 0 y no decrece. */
  function create(keys, { arc = 0.3, arcFrom = 6, reducedMotion = false } = {}) {
    num('arc', arc, { min: 0, max: 1 }); num('arcFrom', arcFrom, { min: 0 });
    if (!Array.isArray(keys) || !keys.length) throw err('KEYS', 'create: keys required');
    keys.forEach((k, i) => {
      if (!k || !Number.isFinite(k.t) || k.t < 0) throw err('KEYS', `create: keys[${i}].t must be a finite number ≥ 0`);
      if (!vec3(k.position) || !vec3(k.target) || !Number.isFinite(k.fov) || k.fov <= 1 || k.fov >= 179 || dist(k.position, k.target) < 1e-6) throw err('KEYS', `create: keys[${i}] has an invalid pose`);
      if (i && !(k.t >= keys[i - 1].t)) throw err('KEYS', 'create: keys must be sorted by t');
    });
    if (keys[0].t !== 0) throw err('KEYS', 'create: the first key must be at t = 0');
    const K = deepFreeze(keys.map(k => ({ t: k.t, position: [...k.position], target: [...k.target], fov: k.fov, label: k.label ?? null, kind: k.kind || 'key', stop: Number.isInteger(k.stop) ? k.stop : null })));
    const duration = K[K.length - 1].t;
    const stops = deepFreeze(K.filter(k => k.kind === 'arrive').map(k => ({ t: k.t, label: k.label, stop: k.stop })));
    /** Pose en t ∈ [0, duration]. Fuera de rango es un error (no se recorta en silencio). */
    function poseAt(t) {
      if (!Number.isFinite(t)) throw err('RANGE', 'poseAt: t must be a finite number');
      if (t < 0 || t > duration + 1e-9) throw err('RANGE', `poseAt: t = ${t} is outside [0, ${duration}]`);
      const tt = Math.min(t, duration); let i = 0;
      while (i < K.length - 2 && K[i + 1].t <= tt) i++; // mismo recorrido que film.js keyCam
      const a = K[i], b = K[Math.min(i + 1, K.length - 1)], k = ss(a.t, b.t, tt), far = dist(a.position, b.position);
      const position = lerp3(a.position, b.position, k), target = lerp3(a.target, b.target, k);
      if (far > arcFrom && arc > 0) position[1] += arc * far * Math.sin(Math.PI * k); // arco (KEEP, en 3D: sube)
      const p = position.map(r6), tg = target.map(r6);
      return deepFreeze({ t: r6(tt), position: p, target: tg, quaternion: lookAtQuaternion(p, tg), fov: r6(lerp(a.fov, b.fov, k)), segment: i,
        label: k < 0.5 ? a.label : b.label, moving: a.t !== b.t && dist(a.position, b.position) + dist(a.target, b.target) > 1e-9 });
    }
    /** Instantes de fotograma a `fps`: i/fps mientras ≤ duration, y SIEMPRE el último instante exacto `duration`. */
    function frameTimes(fps = 30) {
      if (!Number.isInteger(fps) || fps < 1 || fps > 240) throw err('PARAM', 'fps must be an integer in [1, 240]');
      const out = []; for (let i = 0; i / fps <= duration + 1e-9; i++) out.push(r6(Math.min(i / fps, duration)));
      if (out[out.length - 1] !== duration) out.push(duration);
      return out;
    }
    const sample = (fps = 30) => frameTimes(fps).map(poseAt);
    return deepFreeze({ version: VERSION, keys: K, duration, reducedMotion, poseAt, frameTimes, sample, stopsAt: () => stops });
  }

  /**
   * Transporte puro (sin reloj propio): el llamante pasa el tiempo de reloj `now` (ms) en cada llamada, de modo que con
   * reloj virtual es determinista. Estados: idle → playing ⇄ paused → ended | cancelled. `seek` y `seekStop` fijan t
   * (la búsqueda es exacta: poseAt(t)). Al llegar a `duration` se queda exactamente en el último instante.
   */
  function transport(plan) {
    if (!plan || typeof plan.poseAt !== 'function' || !Number.isFinite(plan.duration)) throw err('PARAM', 'transport: plan required');
    let state = 'idle', t = 0, anchor = null; // anchor: {now, t} mientras reproduce
    const live = () => { if (state === 'cancelled') throw err('CANCELLED', 'transport cancelled'); };
    const clock = now => { if (!Number.isFinite(now)) throw err('PARAM', 'now (ms) must be a finite number'); return now; };
    const advance = now => { if (state === 'playing') { t = Math.min(plan.duration, anchor.t + (clock(now) - anchor.now) / 1000); if (t >= plan.duration) { t = plan.duration; state = 'ended'; anchor = null; } } };
    const view = () => ({ state, t: r6(t), pose: plan.poseAt(t) });
    return {
      play(now) { live(); clock(now); advance(now); if (state === 'ended') t = 0; state = 'playing'; anchor = { now, t }; advance(now); return view(); },
      pause(now) { live(); advance(now); if (state === 'playing') { state = 'paused'; anchor = null; } return view(); },
      seek(target, now) { live(); num('t', target, { min: 0, max: plan.duration }); advance(now ?? (anchor ? anchor.now : 0)); t = target; if (state === 'playing') anchor = { now: clock(now), t }; else if (state === 'ended') state = 'paused'; return view(); },
      seekStop(index, now) { const s = plan.stopsAt(); if (!Number.isInteger(index) || index < 0 || index >= s.length) throw err('RANGE', 'stop index out of range'); return this.seek(s[index].t, now); },
      tick(now) { live(); advance(now); return view(); },
      cancel() { state = 'cancelled'; anchor = null; return { state, t: r6(t) }; },
      get state() { return state; }, get t() { return r6(t); },
    };
  }

  /** Progreso de fases (tabla de intervalos del donante, `T` + `ss`): {fase: [inicio, fin]} → {fase: 0..1} en t. */
  function phaseProgress(table, t) {
    if (!table || typeof table !== 'object') throw err('PARAM', 'phaseProgress: table required'); num('t', t);
    const out = {}; for (const [k, iv] of Object.entries(table)) { if (!Array.isArray(iv) || iv.length !== 2 || !iv.every(Number.isFinite) || iv[1] < iv[0]) throw err('PARAM', 'phaseProgress: invalid interval ' + k); out[k] = r6(ss(iv[0], iv[1], t)); }
    return out;
  }

  /** Pose intermedia entre dos poses en el progreso lineal u ∈ [0,1]: smootherstep + arco (la misma regla que poseAt). */
  function blend(a, b, u, { arc = 0.3, arcFrom = 6 } = {}) {
    for (const [n, q] of [['from', a], ['to', b]]) if (!q || !vec3(q.position) || !vec3(q.target) || !Number.isFinite(q.fov)) throw err('PARAM', 'blend: invalid ' + n + ' pose');
    num('u', u, { min: 0, max: 1 }); const k = smoother(u), far = dist(a.position, b.position);
    const position = lerp3(a.position, b.position, k), target = lerp3(a.target, b.target, k);
    if (far > arcFrom && arc > 0) position[1] += arc * far * Math.sin(Math.PI * k);
    const p = position.map(r6), tg = target.map(r6);
    return deepFreeze({ position: p, target: tg, quaternion: lookAtQuaternion(p, tg), fov: r6(lerp(a.fov, b.fov, k)) });
  }

  return { VERSION, smoother, ss, lookAtQuaternion, fromStops, create, transport, phaseProgress, blend };
});
