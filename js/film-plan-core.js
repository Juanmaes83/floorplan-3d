/* SCULPT Simulator · B · Guion de rodaje POR TIEMPO sobre las autoridades de RUBIK (núcleo puro, UMD).
 *
 * RUBIK ya tiene:
 *  - las narrativas (FloorPlanPresentationStory: stateAt(p) puro);
 *  - su reproductor en tiempo real (presentation-ui: P lineal en tiempo, rAF);
 *  - los vuelos entre paradas (View3D.presentationGo).
 * Lo que NO tiene, y aporta este módulo:
 *  1. un guion en SEGUNDOS que encadena escenas de RUBIK, pausas, traslados y cortes, con at(t) determinista
 *     (exportar fotograma a fotograma, buscar por segundo);
 *  2. CONTINUIDAD comprobada: la cámara no salta salvo en un corte declarado (cada escena dice de qué parada sale
 *     y en cuál acaba);
 *  3. el traslado entre paradas que ninguna narrativa cubre, con la misma regla que el donante (smootherstep + arco).
 * No calcula las poses de las escenas: las da RUBIK (presentationStoryApply). Aquí solo hay tiempo y anclas.
 *
 * Origen: simulator@57d562c (MIT).
 *  - KEEP de `sims/kit/runtime.js`: «render(t) es función pura de t», búsqueda y marcas.
 *  - KEEP de `film.js`: tramos encadenados con pausas y traslados suavizados.
 *  - REMOVE: edición al ritmo de la música, golpes de zoom, sacudidas y rótulos de `kit/director.js`.
 */
(function (root, factory) {
  const api = factory(typeof module === 'object' && module.exports ? require('./shot-timeline.cjs') : root.RubikShotTimeline);
  if (typeof module === 'object' && module.exports) module.exports = api; else root.RubikFilmPlan = api;
})(typeof self !== 'undefined' ? self : this, function (ST) {
  'use strict';
  if (!ST || typeof ST.blend !== 'function') throw Error('RubikFilmPlan requires RubikShotTimeline');
  const VERSION = 1;
  const err = (code, msg) => Object.assign(new Error(msg), { code });
  const r6 = v => Math.round(v * 1e6) / 1e6;
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  const deepFreeze = o => { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); for (const v of Object.values(o)) deepFreeze(v); } return o; };
  const posOK = q => q && [q.position, q.target].every(v => Array.isArray(v) && v.length === 3 && v.every(Number.isFinite)) && Number.isFinite(q.fov);
  // De qué ancla sale cada narrativa de RUBIK (presentationStoryBegin, 02712b5): plan-reveal sale del plano 2D;
  // room-descent y room-visit, de la parada `from` (view.fromStop). Todas acaban en la pose de su parada.
  const SCENE_START = Object.freeze({ 'plan-reveal': 'plan', 'room-descent': 'from', 'room-visit': 'from' });
  const KINDS = ['scene', 'hold', 'move', 'cut'];
  /**
   * Duración mínima de un traslado para cumplir el contrato de suavidad (motion-quality): con smootherstep, la velocidad
   * de pico es 1,875 veces la media (30/16); se añade un 20 % de margen por la interpolación separada de posición y
   * objetivo. limits: {maxAngular (°/s), maxRelSpeed (1/s)}.
   */
  function contractSeconds(a, b, limits) {
    const dir = q => { const v = [q.target[0] - q.position[0], q.target[1] - q.position[1], q.target[2] - q.position[2]], l = Math.hypot(...v) || 1; return v.map(x => x / l); };
    const da = dir(a), db = dir(b), ang = Math.acos(Math.min(1, Math.max(-1, da[0] * db[0] + da[1] * db[1] + da[2] * db[2]))) * 180 / Math.PI;
    const near = Math.max(0.25, Math.min(dist(a.position, a.target), dist(b.position, b.target))), k = 1.875 * 1.2;
    return Math.max(limits.maxAngular ? k * ang / limits.maxAngular : 0, limits.maxRelSpeed ? k * dist(a.position, b.position) / near / limits.maxRelSpeed : 0);
  }

  /**
   * shots: [
   *   {kind:'scene', narrative, stop, from?, seconds?, label?}  // escena de RUBIK; p lineal en t, como su reproductor
   *   {kind:'hold', seconds, label?}                             // la cámara quieta en el ancla actual
   *   {kind:'move', to, seconds?, label?}                        // traslado suavizado del ancla actual a la parada `to`
   *   {kind:'cut', to, label?}                                   // salto declarado (0 s)
   * ]
   * options:
   *  - poses: {stopId: {position, target, fov}}, la pose de cada parada según la presentación de RUBIK;
   *  - sceneSeconds: {narrativa: s}, normalmente FloorPlanPresentationStory.SCENE_MS / 1000;
   *  - reducedMotion: las escenas quedan en su estado final (p = 1) y los traslados se vuelven cortes, como hace RUBIK
   *    con prefers-reduced-motion;
   *  - move: {speed, minMove, maxMove, arc, arcFrom}.
   */
  function create(shots, { poses = {}, sceneSeconds = {}, reducedMotion = false, move = {} } = {}) {
    const M = { speed: 2.5, minMove: 1.2, maxMove: 4, arc: 0.3, arcFrom: 6, limits: null, maxContractMove: 10, ...move };
    if (!Array.isArray(shots) || !shots.length) throw err('SHOTS', 'create: shots required');
    if (typeof reducedMotion !== 'boolean') throw err('PARAM', 'reducedMotion must be boolean');
    const pose = id => { const q = poses[id]; if (!posOK(q)) throw err('POSE', `no pose for stop "${id}"`); return { position: [...q.position], target: [...q.target], fov: q.fov }; };
    const out = []; let t = 0, anchor = null; // anchor: {stop, pose} o {plan:true}
    shots.forEach((s, i) => {
      if (!s || !KINDS.includes(s.kind)) throw err('SHOTS', `shots[${i}]: kind must be one of ${KINDS.join(', ')}`);
      const sec = v => { if (v == null) return null; if (!Number.isFinite(v) || v < 0) throw err('SHOTS', `shots[${i}].seconds must be ≥ 0`); return v; };
      let d, entry = { i, kind: s.kind, label: s.label ?? null };
      if (s.kind === 'scene') {
        const start = SCENE_START[s.narrative]; if (!start) throw err('SCENE', `shots[${i}]: narrative "${s.narrative}" is not supported (${Object.keys(SCENE_START).join(', ')})`);
        if (typeof s.stop !== 'string') throw err('SHOTS', `shots[${i}].stop required`);
        let from = null;
        if (start === 'from') { from = s.from ?? (anchor && anchor.stop); if (!from) throw err('CONTINUITY', `shots[${i}]: ${s.narrative} needs the stop it starts from`); pose(from);
          if (anchor && anchor.stop !== from) throw err('CONTINUITY', `shots[${i}]: starts at "${from}" but the camera is at "${anchor.stop || 'plan'}" (add a move or a cut)`); }
        else if (anchor && !anchor.plan) throw err('CONTINUITY', `shots[${i}]: plan-reveal starts from the plan; the camera is at "${anchor.stop}" (add a cut)`);
        d = sec(s.seconds) ?? sec(sceneSeconds[s.narrative]); if (d == null) throw err('SHOTS', `shots[${i}]: seconds or sceneSeconds["${s.narrative}"] required`);
        Object.assign(entry, { narrative: s.narrative, stop: s.stop, from, endPose: pose(s.stop) });
        anchor = { stop: s.stop, pose: pose(s.stop) };
      } else if (s.kind === 'hold') {
        d = sec(s.seconds); if (d == null) throw err('SHOTS', `shots[${i}].seconds required`);
        if (!anchor) anchor = { plan: true };
        Object.assign(entry, { stop: anchor.stop || null, pose: anchor.pose || null });
      } else {
        if (typeof s.to !== 'string') throw err('SHOTS', `shots[${i}].to required`);
        const to = pose(s.to);
        if (s.kind === 'move') {
          if (!anchor || !anchor.pose) throw err('CONTINUITY', `shots[${i}]: a move needs a known start pose (a stop)`);
          let auto = Math.min(M.maxMove, Math.max(M.minMove, dist(anchor.pose.position, to.position) / M.speed));
          if (M.limits && !reducedMotion && s.seconds == null) { const need = contractSeconds(anchor.pose, to, M.limits);
            if (need > M.maxContractMove) throw err('CONTRACT', `shots[${i}]: a smooth move from "${anchor.stop}" to "${s.to}" needs ${need.toFixed(1)} s (> ${M.maxContractMove} s): use a cut`);
            auto = Math.max(auto, need); }
          d = reducedMotion ? 0 : (sec(s.seconds) ?? auto);
          Object.assign(entry, { from: anchor.stop, to: s.to, fromPose: anchor.pose, toPose: to });
        } else { d = 0; Object.assign(entry, { from: anchor ? anchor.stop || 'plan' : null, to: s.to, toPose: to }); }
        anchor = { stop: s.to, pose: to };
      }
      entry.t0 = r6(t); t += d; entry.t1 = r6(t); entry.seconds = r6(d);
      // Con movimiento reducido, un traslado y el inicio de una escena (que aparece ya en su estado final) también son cortes.
      entry.cut = s.kind === 'cut' || (reducedMotion && (s.kind === 'move' || s.kind === 'scene'));
      out.push(entry);
    });
    const duration = r6(t), S = deepFreeze(out);
    const cuts = deepFreeze(S.filter(x => x.cut).map(x => x.t0));

    /** Plano en t: índice, tipo y progreso LINEAL local p ∈ [0,1]. Un corte (0 s) nunca es el plano activo. */
    function at(t) {
      if (!Number.isFinite(t) || t < 0 || t > duration + 1e-9) throw err('RANGE', `at: t = ${t} is outside [0, ${duration}]`);
      const tt = Math.min(t, duration); let k = -1;
      for (let j = 0; j < S.length; j++) if (S[j].seconds > 0 && S[j].t0 <= tt + 1e-12) k = j; // el último que ya ha empezado
      if (k < 0) k = S.findIndex(x => x.seconds > 0);
      if (k < 0) throw err('SHOTS', 'the plan has no shot with duration');
      const s = S[k], p = s.seconds > 0 ? Math.min(1, Math.max(0, (tt - s.t0) / s.seconds)) : 1;
      return deepFreeze({ t: r6(tt), index: k, kind: s.kind, p: r6(reducedMotion && s.kind === 'scene' ? 1 : p), shot: s });
    }
    /** Pose de los planos que son de B (pausa y traslado). Las escenas devuelven null: su pose la da RUBIK. */
    function poseAt(t) {
      const a = at(t), s = a.shot;
      if (s.kind === 'scene') return null;
      if (s.kind === 'hold') return s.pose ? ST.blend(s.pose, s.pose, 0) : null;
      return ST.blend(s.fromPose, s.toPose, a.p, { arc: M.arc, arcFrom: M.arcFrom });
    }
    /** Instantes de fotograma: i/fps mientras ≤ duration y SIEMPRE el último instante exacto (como shot-timeline). */
    function frameTimes(fps = 30) {
      if (!Number.isInteger(fps) || fps < 1 || fps > 240) throw err('PARAM', 'fps must be an integer in [1, 240]');
      const o = []; for (let i = 0; i / fps <= duration + 1e-9; i++) o.push(r6(Math.min(i / fps, duration)));
      if (o[o.length - 1] !== duration) o.push(duration); return o;
    }
    return deepFreeze({ version: VERSION, duration, shots: S, cuts, reducedMotion, at, poseAt, frameTimes,
      toJSON: () => ({ version: VERSION, duration, reducedMotion, cuts: [...cuts], shots: S.map(({ fromPose, toPose, endPose, pose: p, ...x }) => x) }) });
  }
  return Object.freeze({ VERSION, SCENE_START, create, contractSeconds });
});
