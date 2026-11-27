/* RUBIK SOTA · Gesture Labs §6 · núcleo PURO de gestos (UMD: window.RubikGestureCore / module.exports). Sin DOM ni cámara.
   Procedencia (autorizada por el propietario, 27/11/2026; donantes públicos y suyos):
   - Director de Orquesta @ dcf4b7ac · gesture-lab/before-after-reforma v2.1.2: clasificación por dedos extendidos + EMA de
     apertura (0,52/0,48), estabilización por fotogramas (OPEN 2 · FIST 4 · HOLDING 5), deslizamiento (|dx|≥0,18, |dy|≤0,11,
     velocidad ≥0,55/s, ventana 520 ms, 850 ms entre disparos) y mano perdida a 700 ms sin disparo. Adaptado, no copiado.
   Dos gestos como máximo (encargo §3):
   - MANO ABIERTA sostenida (OPEN estable ≥ 600 ms) → «siguiente paso» (plano → 3D → comparar). Se rearma al cerrar la mano o
     al perderla: un gesto sostenido nunca dispara dos veces.
   - DESLIZAR en horizontal con la mano cerrada → «cambiar de revisión» (solo en el paso comparar).
   Perder la mano no dispara nada y anula lo que estuviera en curso. */
(function (root, factory) { const api = factory(); if (typeof module === 'object' && module.exports) module.exports = api; else root.RubikGestureCore = api; })(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const P = Object.freeze({ emaKeep: 0.52, required: { OPEN: 2, FIST: 4, HOLDING: 5 }, holdOpenMs: 600, lostMs: 700,
    swipe: { windowMs: 520, dx: 0.18, dy: 0.11, velocity: 0.55, cooldownMs: 850 },
    // Ensayo «palma que se desplaza despacio» (guía c532877a): con la mano ABIERTA, un desplazamiento horizontal lento orienta
    // la maqueta. Zona muerta acumulada antes de empezar (no se confunde con la mano quieta de «siguiente»), y por encima de
    // maxVelocity es un barrido rápido: no gira nada.
    orbit: { startDx: 0.035, maxVelocity: 0.45, maxDy: 0.08 } });
  const d2 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const palmOf = lm => { const ids = [0, 5, 9, 13, 17]; const s = ids.reduce((a, i) => ({ x: a.x + lm[i].x, y: a.y + lm[i].y }), { x: 0, y: 0 }); return { x: s.x / ids.length, y: s.y / ids.length }; };

  function create(params = {}) {
    const p = { ...P, ...params };
    const s = { ema: null, candidate: 'HOLDING', frames: 0, stable: 'HOLDING', openSince: null, openFired: false, history: [], lastSwipe: -Infinity, lastHand: null, lost: true, orb: null };
    function reset() { s.ema = null; s.candidate = 'HOLDING'; s.frames = 0; s.stable = 'HOLDING'; s.openSince = null; s.openFired = false; s.history.length = 0; s.orb = null; }
    function classify(lm) {
      const palm = palmOf(lm), scale = Math.max(0.04, d2(lm[0], lm[9]));
      let extended = 0, open = 0;
      for (const [tip, pip] of [[8, 6], [12, 10], [16, 14], [20, 18]]) { const t = d2(lm[tip], palm), q = d2(lm[pip], palm); open += t / scale; if (t > q * 1.08 && t > scale * 1.16) extended++; }
      open /= 4; s.ema = s.ema === null ? open : s.ema * p.emaKeep + open * (1 - p.emaKeep);
      const g = extended >= 3 || s.ema > 1.65 || (extended >= 2 && s.ema > 1.55) ? 'OPEN' : extended <= 1 && s.ema < 1.78 ? 'FIST' : 'HOLDING';
      return { gesture: g, palm, extended, openness: s.ema };
    }
    function stabilize(g) { if (s.candidate === g) s.frames++; else { s.candidate = g; s.frames = 1; } if (s.frames >= p.required[g]) s.stable = g; return s.stable; }
    /** Un fotograma. lm: 21 puntos normalizados (o null si no hay mano). t: ms. Devuelve { state, events[] }. */
    function frame(lm, t) {
      const events = [];
      if (!lm) {
        if (!s.lost && s.lastHand !== null && t - s.lastHand > p.lostMs) { s.lost = true; reset(); events.push({ type: 'lost' }); }
        return { state: s.lost ? 'LOST' : s.stable, events };
      }
      if (s.lost) { s.lost = false; events.push({ type: 'found' }); }
      s.lastHand = t;
      const info = classify(lm), g = stabilize(info.gesture);
      // Gesto 1 · mano abierta sostenida.
      // Gesto 3 (ensayo) · palma abierta que se desplaza despacio → 'orbit' con el desplazamiento horizontal de pantalla.
      // Va ANTES de «siguiente»: si la palma se mueve, la espera de mano quieta se reinicia y «siguiente» no se dispara.
      if (g === 'OPEN') {
        const x = 1 - info.palm.x, y = info.palm.y;
        if (!s.orb) s.orb = { x0: x, y0: y, x, y, t, moving: false };
        else { const dx = x - s.orb.x, dt = Math.max(1, t - s.orb.t), v = Math.abs(dx) / (dt / 1000);
          if (!s.orb.moving && Math.abs(x - s.orb.x0) >= p.orbit.startDx && Math.abs(y - s.orb.y0) <= p.orbit.maxDy) s.orb.moving = true;
          if (s.orb.moving) { s.openSince = t; if (v <= p.orbit.maxVelocity && dx !== 0) events.push({ type: 'orbit', dx }); }
          s.orb.x = x; s.orb.y = y; s.orb.t = t; }
      } else s.orb = null;
      if (g === 'OPEN') { if (s.openSince === null) s.openSince = t; if (!s.openFired && !s.orb?.moving && t - s.openSince >= p.holdOpenMs) { s.openFired = true; events.push({ type: 'next' }); } s.history.length = 0; }
      else { s.openSince = null; if (g === 'FIST') s.openFired = false; }
      // Gesto 2 · deslizar con la mano cerrada (en espejo: x de pantalla = 1 - x de cámara).
      if (g === 'FIST' && t - s.lastSwipe >= p.swipe.cooldownMs) {
        const h = s.history; h.push({ x: 1 - info.palm.x, y: info.palm.y, t }); while (h.length && t - h[0].t > p.swipe.windowMs) h.shift();
        if (h.length >= 2) { const a = h[0], b = h[h.length - 1], dx = b.x - a.x, dy = b.y - a.y, el = b.t - a.t;
          if (el > 0 && Math.abs(dx) >= p.swipe.dx && Math.abs(dy) <= p.swipe.dy && Math.abs(dx) / (el / 1000) >= p.swipe.velocity) { events.push({ type: 'swipe', dir: dx > 0 ? 'right' : 'left' }); s.lastSwipe = t; h.length = 0; } }
      } else if (g !== 'FIST') s.history.length = 0;
      return { state: g, events, info };
    }
    return { frame, reset, get state() { return s.lost ? 'LOST' : s.stable; } };
  }

  /** Mano sintética (21 puntos) para ensayos reproducibles sin cámara: abierta o cerrada, centrada en (x, y). */
  function syntheticHand(kind, x = 0.5, y = 0.5) {
    const lm = Array.from({ length: 21 }, () => ({ x, y }));
    lm[0] = { x, y: y + 0.12 }; const base = [[5, -0.05], [9, -0.015], [13, 0.015], [17, 0.045]];
    for (const [i, dx] of base) lm[i] = { x: x + dx, y: y + 0.02 };
    const len = kind === 'open' ? 0.2 : 0.03;
    [[6, 8, -0.05], [10, 12, -0.015], [14, 16, 0.015], [18, 20, 0.045]].forEach(([pip, tip, dx]) => { lm[pip] = { x: x + dx, y: y - len * 0.45 }; lm[tip] = { x: x + dx, y: y - len }; lm[pip + 1] = { x: x + dx, y: y - len * 0.7 }; });
    lm[4] = { x: x - 0.08, y: y + 0.02 };
    return lm;
  }

  /** Máquina de la presentación (decisión del propietario 27/11): plano ENROLLADO → plano desplegado y legible → 3D de la misma
   *  revisión. Funciona con UNA revisión guardada. «Antes y después» es un paso OPCIONAL: solo existe cuando se pide
   *  (compare: true o enableCompare()), y entonces necesita una variante. Botones, teclado y gestos llaman a estas acciones. */
  const STEPS = Object.freeze(['rolled', 'plan', '3d', 'compare']);
  function presentation(opts) {
    let i = 0, side = 'before', compare = !!(opts && opts.compare);
    const last = () => compare ? 3 : 2;
    return { get step() { return STEPS[i]; }, get side() { return side; }, get compare() { return compare; },
      enableCompare(on = true) { compare = !!on; if (!compare && i > 2) i = 2; return compare; },
      next() { if (i < last()) i++; return STEPS[i]; }, prev() { if (i > 0) i--; return STEPS[i]; },
      go(k) { const j = STEPS.indexOf(k); if (j >= 0 && j <= last()) i = j; return STEPS[i]; },
      toggle(dir) { if (STEPS[i] !== 'compare') return null; side = dir === 'right' ? 'after' : dir === 'left' ? 'before' : side === 'before' ? 'after' : 'before'; return side; } };
  }
  return Object.freeze({ PARAMS: P, create, syntheticHand, presentation, STEPS });
});
