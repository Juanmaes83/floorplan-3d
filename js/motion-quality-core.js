/* SCULPT Simulator · B · Contrato de SUAVIDAD y ENCUADRE de un movimiento de cámara (núcleo puro, UMD, sin three).
 *
 * Mide una trayectoria muestreada [{t, position, target, fov}] (poses que la cámara REAL de RUBIK tuvo en cada
 * fotograma):
 *  - velocidad lineal (m/s) y su aceleración (m/s²);
 *  - velocidad angular de la mirada (°/s);
 *  - variación del campo de visión (°/s);
 *  - saltos entre fotogramas que no son un corte declarado.
 * Los compara con unos LÍMITES. Los límites por defecto no se inventan: son los máximos medidos en los propios
 * movimientos de RUBIK (vuelo flyToRoom y narrativas de la presentación, ver evidence/baseline-rubik.json), de modo que
 * «suave» significa «no más brusco que lo que RUBIK ya hace».
 * Encuadre: proyecta los puntos del sujeto (p. ej. el contorno de la estancia a ras de suelo y a 1,2 m) con la pose y
 * dice qué parte queda dentro del área segura del fotograma, dónde está su centro y cuánto ocupa.
 */
(function (root, factory) { const api = factory(); if (typeof module === 'object' && module.exports) module.exports = api; else root.RubikMotionQuality = api; })(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const err = (code, msg) => Object.assign(new Error(msg), { code });
  const r4 = v => Math.round(v * 1e4) / 1e4;
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const len = a => Math.hypot(a[0], a[1], a[2]), norm = a => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const DEG = 180 / Math.PI;
  const valid = s => s && Number.isFinite(s.t) && [s.position, s.target].every(v => Array.isArray(v) && v.length === 3 && v.every(Number.isFinite)) && Number.isFinite(s.fov);
  /** Muestra con `quaternion` [x,y,z,w] en lugar de `target` (View3D.cameraState): objetivo a 1 m sobre −Z de la cámara. */
  const withTarget = s => { if (!s || s.target || !Array.isArray(s.quaternion)) return s; const [x, y, z, w] = s.quaternion;
    const f = [-2 * (x * z + w * y), -2 * (y * z - w * x), -(1 - 2 * (x * x + y * y))]; return { ...s, target: [s.position[0] + f[0], s.position[1] + f[1], s.position[2] + f[2]], syntheticTarget: true }; };
  // Distancia al sujeto: `distance` explícita, o la del objetivo real (no la del objetivo sintético a 1 m del cuaternión).
  const subjectDistance = s => (Number.isFinite(s.distance) ? s.distance : s.syntheticTarget ? null : len(sub(s.target, s.position)));

  /**
   * Medidas por intervalo entre fotogramas consecutivos.
   * `cuts`: instantes de corte declarados; el intervalo que llega a un corte no cuenta para las medidas.
   * `relSpeed` (1/s) = velocidad / distancia al sujeto: medida PERCEPTIVA e invariante a la escala. Medido en RUBIK: el
   * «dolly zoom» de plan-reveal llega a 104 m/s y es el movimiento más tranquilo del producto (el tamaño encuadrado no
   * cambia); los m/s no dicen lo que ve quien mira. Necesita `distance` o un objetivo real en cada muestra.
   * `windowS`: suavizado de la aceleración (diferencia de velocidades medias en ventanas de ese ancho), para que el
   * redondeo de las poses a 1e-6 no se lea como un tirón.
   */
  function analyze(samples, { cuts = [], cutToleranceS = 1e-6, windowS = 0.1 } = {}) {
    if (!Array.isArray(samples) || samples.length < 2) throw err('PARAM', 'analyze: at least 2 samples');
    samples = samples.map(withTarget);
    samples.forEach((s, i) => { if (!valid(s)) throw err('PARAM', `analyze: invalid sample ${i}`); if (i && !(s.t > samples[i - 1].t)) throw err('PARAM', 'analyze: t must increase'); });
    // Un corte en c pertenece SOLO al intervalo (a, b] que lo contiene: el fotograma en c ya muestra el plano nuevo.
    const isCut = (a, b) => cuts.some(c => c > a + cutToleranceS && c <= b + cutToleranceS);
    const steps = [];
    for (let i = 1; i < samples.length; i++) {
      const a = samples[i - 1], b = samples[i], dt = b.t - a.t, da = norm(sub(a.target, a.position)), db = norm(sub(b.target, b.position));
      const ang = Math.acos(Math.min(1, Math.max(-1, dot(da, db)))) * DEG;
      steps.push({ t: b.t, dt, cut: isCut(a.t, b.t), speed: len(sub(b.position, a.position)) / dt, targetSpeed: len(sub(b.target, a.target)) / dt, relSpeed: (() => { const da2 = subjectDistance(a), db2 = subjectDistance(b); return da2 == null || db2 == null ? null : len(sub(b.position, a.position)) / dt / Math.max(0.25, (da2 + db2) / 2); })(), angular: ang / dt, fovRate: Math.abs(b.fov - a.fov) / dt, jump: len(sub(b.position, a.position)), turn: ang });
    }
    const live = steps.filter(s => !s.cut);
    const w = Math.max(1, Math.round(windowS / (live[0] ? live[0].dt : 1)));
    let maxAccel = 0;
    for (let i = w; i + w <= live.length; i++) { const v0 = live.slice(i - w, i).reduce((n, s) => n + s.speed, 0) / w, v1 = live.slice(i, i + w).reduce((n, s) => n + s.speed, 0) / w; maxAccel = Math.max(maxAccel, Math.abs(v1 - v0) / (w * live[i].dt)); }
    const max = k => live.reduce((m, s) => Math.max(m, s[k]), 0), hasRel = live.length > 0 && live.every(s => s.relSpeed != null);
    return Object.freeze({
      frames: samples.length, seconds: r4(samples[samples.length - 1].t - samples[0].t), declaredCuts: steps.filter(s => s.cut).length,
      maxSpeed: r4(max('speed')), maxTargetSpeed: r4(max('targetSpeed')), maxAngular: r4(max('angular')), maxRelSpeed: hasRel ? r4(max('relSpeed')) : null, maxFovRate: r4(max('fovRate')), maxAccel: r4(maxAccel),
      // el peor intervalo por cada medida, para localizar el problema en el vídeo
      worst: Object.freeze(Object.fromEntries(['speed', 'angular', 'fovRate'].map(k => { const s = live.reduce((m, x) => (x[k] > (m ? m[k] : -1) ? x : m), null); return [k, s ? r4(s.t) : null]; }))),
      steps,
    });
  }

  /**
   * Límites por defecto, PERCEPTIVOS: el máximo de las narrativas de la presentación de RUBIK (plan-reveal y room-descent,
   * 02712b5, ejemplo, 1440×900, 30 fps, pose observada) + 10 % (evidence/baseline-rubik.json, demo/baseline-rubik.cjs).
   * - maxAngular 11,33 °/s: coincide con la regla clásica de cámara contra el temblor en panorámicas (cruzar el encuadre
   *   en 5-7 s);
   * - maxRelSpeed 0,81 1/s: velocidad / distancia al sujeto;
   * - maxFovRate 19,22 °/s: el «dolly zoom» de plan-reveal.
   * Los m/s se informan pero no se limitan. Los vuelos del editor (flyToRoom, salto de parada de 650 ms) llegan a 93 °/s
   * y no son referencia cinematográfica.
   */
  const RUBIK_LIMITS = Object.freeze({ maxAngular: 11.33, maxRelSpeed: 0.81, maxFovRate: 19.22 });

  /** Veredicto frente a unos límites: {pass, violations:[{measure, value, limit}]}. */
  function check(report, limits = RUBIK_LIMITS) {
    const violations = [];
    for (const [k, lim] of Object.entries(limits)) { if (!Number.isFinite(lim)) throw err('PARAM', 'limit ' + k); if (report[k] == null) throw err('PARAM', 'report has no ' + k + ' (missing distance or target)'); if (report[k] > lim + 1e-9) violations.push({ measure: k, value: report[k], limit: lim }); }
    return Object.freeze({ pass: violations.length === 0, violations: Object.freeze(violations) });
  }

  /**
   * Encuadre: proyección en perspectiva (cámara lookAt con Y arriba, campo de visión VERTICAL en grados, como Three).
   * Devuelve: inside (fracción de puntos visibles dentro del área segura), centre [x,y] en NDC del centro de la caja
   * proyectada, coverage (área de esa caja / área del fotograma) y behind (puntos detrás de la cámara).
   * `safe`: 0,9 = área segura de rótulos del 90 % (convención de vídeo).
   */
  function framing(pose, points, { aspect, safe = 0.9 } = {}) {
    pose = withTarget(pose); if (!valid({ t: 0, ...pose })) throw err('PARAM', 'framing: invalid pose');
    if (!Number.isFinite(aspect) || aspect <= 0) throw err('PARAM', 'framing: aspect required');
    if (!Array.isArray(points) || !points.length) throw err('PARAM', 'framing: points required');
    const f = norm(sub(pose.target, pose.position)); let r = cross(f, [0, 1, 0]); if (len(r) < 1e-9) r = [1, 0, 0]; r = norm(r); const u = cross(r, f);
    const ty = Math.tan(pose.fov / 2 / DEG), tx = ty * aspect, ndc = [];
    let behind = 0;
    for (const p of points) { const v = sub(p, pose.position), z = dot(v, f); if (z <= 1e-6) { behind++; continue; } ndc.push([dot(v, r) / (z * tx), dot(v, u) / (z * ty)]); }
    const inside = ndc.filter(([x, y]) => Math.abs(x) <= safe && Math.abs(y) <= safe).length / points.length;
    if (!ndc.length) return Object.freeze({ inside: 0, centre: null, coverage: 0, behind });
    const xs = ndc.map(p => Math.min(1, Math.max(-1, p[0]))), ys = ndc.map(p => Math.min(1, Math.max(-1, p[1])));
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    return Object.freeze({ inside: r4(inside), centre: [r4((x0 + x1) / 2), r4((y0 + y1) / 2)], coverage: r4(((x1 - x0) * (y1 - y0)) / 4), behind });
  }

  /**
   * Encuadre cinematográfico con mayor margen, SIN inventar ángulos. Se conservan el objetivo, la dirección de la mirada y
   * el fov de RUBIK; la cámara solo se ALEJA a lo largo de su propia línea de mirada (dolly hacia atrás) lo justo para que
   * todo el contorno del sujeto quede dentro del área segura `safe`. Búsqueda binaria del factor de distancia k ∈ [1, maxScale].
   * Si ya cabe, k = 1 (la pose de RUBIK, intacta). Devuelve {pose:{position,target,fov}, scale, before, after}.
   */
  function reframe(pose, points, { aspect, safe = 0.9, maxScale = 3 } = {}) {
    pose = withTarget(pose); if (!valid({ t: 0, ...pose })) throw err('PARAM', 'reframe: invalid pose');
    const at = k => ({ position: pose.target.map((v, i) => v + (pose.position[i] - v) * k), target: [...pose.target], fov: pose.fov });
    const ok = k => framing(at(k), points, { aspect, safe }).inside >= 1 - 1e-9;
    const before = framing(pose, points, { aspect, safe });
    let k = 1;
    if (!ok(1)) { let lo = 1, hi = maxScale; if (!ok(hi)) throw err('FRAMING', `reframe: subject does not fit within ×${maxScale}`); for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (ok(m)) hi = m; else lo = m; }
      // La búsqueda acaba EN el borde del área segura y el redondeo de la pose podía dejar puntos justo fuera (medido en la
      // demo: 2 de 8 puntos fuera). Se aleja un 1 % más del borde y se comprueba ya redondeado.
      k = Math.min(maxScale, hi * 1.01); }
    const out = at(k); out.position = out.position.map(r4);
    if (k > 1 && framing(out, points, { aspect, safe }).inside < 1 - 1e-9) throw err('FRAMING', 'reframe: rounding left the subject outside the safe area');
    return Object.freeze({ pose: Object.freeze(out), scale: r4(k), before, after: framing(out, points, { aspect, safe }) });
  }

  return Object.freeze({ analyze, check, framing, reframe, RUBIK_LIMITS });
});
