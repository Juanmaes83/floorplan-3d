/* BP-DP PREMIUM · SISTEMA DE ENSAMBLAJE (UMD, puro, determinista). Común a la exploración y al vídeo de Despiece.
 *
 * Un único parámetro A ∈ [0,1] describe el estado: A = 0 vivienda separada (exploded view), A = 1 montada.
 * Cada componente tiene una posición SEPARADA (offset rígido en metros) y una ventana de llegada [a0,a1] ⊂ [0,1]
 * según su sistema constructivo y su orden; su desplazamiento es offset·(1 − s((A−a0)/(a1−a0))) con smootherstep
 * SIN sobrepaso (G1 heredaba un 2 % de sobrepaso de Heritage: aquí se sustituye para no atravesar la pieza inferior).
 * En A = 1 todos los offsets son EXACTAMENTE 0 (geometría idéntica a la montada). Nada deforma, escala ni duplica.
 * La película (15 s, guion del anexo 8) es solo un mapa t → A + cámara sobre ESTE mismo sistema.
 */
(function (root, factory) { const api = factory(); if (typeof module === 'object' && module.exports) module.exports = api; else root.BpdpAssembly = api; })(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const smooth = x => { const u = clamp(x); return u * u * u * (u * (u * 6 - 15) + 10); };
  // Fases del guion (anexo 8): reparto de sistemas en el eje A.
  const PHASES = [
    { id: 'exploded', label: 'La casa separada', t: [0, 3] },
    { id: 'structure', label: 'Montaje estructural', t: [3, 7], a: [0, 0.42] },
    { id: 'fusion', label: 'Fusión arquitectónica', t: [7, 11], a: [0.42, 0.76] },
    { id: 'final', label: 'Montaje final', t: [11, 14], a: [0.76, 1] },
    { id: 'hero', label: 'Vivienda completa', t: [14, 15] }];
  const DURATION = 15;
  // Sistema → fase y posición separada (separación vertical por estratos + empuje exterior de las fachadas).
  const PLAN = {
    foundation: { phase: 'structure', lift: 0, out: 0, fixed: true },
    floors: { phase: 'structure', lift: 0, out: 0, fixed: true },
    slab: { phase: 'structure', lift: 1.6 },
    structure: { phase: 'structure', lift: 3.2 },
    walls: { phase: 'structure', lift: 0.9, out: 1.8 },
    envelope: { phase: 'fusion', lift: 1.1, out: 3.2 },
    partitions: { phase: 'fusion', lift: 2.2 },
    openings: { phase: 'fusion', lift: 1.3, out: 4.6 },
    ceilings: { phase: 'final', lift: 3.8 },
    fixtures: { phase: 'final', lift: 3.8 },
    'roof-structure': { phase: 'final', lift: 2.0 },
    roof: { phase: 'final', lift: 3.1 },
    'roof-finish': { phase: 'final', lift: 4.1 },
    finishes: { phase: 'final', lift: 2.6 },
    furniture: { phase: 'final', lift: 1.8 }};
  // Separación entre niveles en la escena sintética (estratos por planta).
  const LEVEL_LIFT = { L0: 0, L1: 4.6, roof: 8.6, null: 0 };

  /**
   * @param model  BpdpModel.build(pkg)
   * @param o.center [x,z] centro horizontal (m) para las direcciones «hacia fuera»
   */
  function build(model, { center = [0, 0] } = {}) {
    const items = [];
    const phase = id => PHASES.find(p => p.id === id);
    // Orden dentro de cada fase: por sistema, nivel y posición → llegadas escalonadas («secuencias sincronizadas»).
    const groups = {};
    for (const c of model.components) { const pl = PLAN[c.system]; if (!pl) continue; (groups[pl.phase] = groups[pl.phase] || []).push(c); }
    for (const [ph, list] of Object.entries(groups)) {
      const P = phase(ph), [A0, A1] = P.a;
      // Sub-bloques por (nivel, sistema) en orden constructivo; cada bloque ocupa un tramo y sus piezas se escalonan.
      const blocks = []; const key = c => `${model.synthetic ? (c.level || 'base') : 'base'}|${c.system}`;
      const lvOrder = l => ({ base: 0, null: 0, L0: 1, L1: 2, roof: 3 })[l] ?? 0, sysOrder = s => model.systems.find(x => x.id === s)?.order ?? 99;
      for (const c of list) { const k = key(c); let b = blocks.find(x => x.k === k); if (!b) { b = { k, level: k.split('|')[0], system: c.system, cs: [] }; blocks.push(b); } b.cs.push(c); }
      blocks.sort((x, y) => lvOrder(x.level) - lvOrder(y.level) || sysOrder(x.system) - sysOrder(y.system));
      const span = (A1 - A0) / Math.max(1, blocks.length);
      blocks.forEach((b, bi) => {
        const w0 = A0 + bi * span, w1 = w0 + span * 1.6 > A1 ? A1 : w0 + span * 1.6; // solape suave entre bloques
        b.cs.sort((x, y) => Math.atan2(x.center[2] - center[1], x.center[0] - center[0]) - Math.atan2(y.center[2] - center[1], y.center[0] - center[0]) || x.key.localeCompare(y.key));
        b.cs.forEach((c, i) => {
          const pl = PLAN[c.system], n = b.cs.length, st = n > 1 ? (i / (n - 1)) * 0.35 : 0;
          const a0 = w0 + (w1 - w0) * st, a1 = Math.min(w1, a0 + (w1 - w0) * 0.65);
          let off = [0, 0, 0];
          if (!pl.fixed) {
            const dx = c.center[0] - center[0], dz = c.center[2] - center[1], L = Math.hypot(dx, dz) || 1;
            const lvl = model.synthetic ? (LEVEL_LIFT[c.level] ?? 0) : 0;
            // Fachada: empuje según la cara dominante (normal del cerramiento), no radial difuso.
            let ox = 0, oz = 0; if (pl.out) { if (Math.abs(dx) / (Math.abs(dz) + 1e-6) > (model.synthetic ? 1.33 : 1)) ox = Math.sign(dx); else oz = Math.sign(dz); if (!ox && !oz) { ox = dx / L; oz = dz / L; } }
            off = [ox * (pl.out || 0), pl.lift + lvl, oz * (pl.out || 0)];
          }
          items.push({ key: c.key, system: c.system, level: c.level, phase: ph, window: [round(a0), round(a1)], exploded: off.map(round), fixed: !!pl.fixed });
        });
      });
    }
    // RÓTULOS FIELES AL PROYECTO: cada fase se nombra por los sistemas que REALMENTE llegan en ella. «Montaje estructural»
    // solo existe si hay estructura modelada; una fase sin piezas lo dice. Mismo rótulo en visor, lámina y vídeo.
    const NOMBRES = { foundation: 'cimentación', floors: 'suelos', slab: 'soleras y forjados', structure: 'pilares y vigas', walls: 'muros', envelope: 'cerramientos', partitions: 'particiones',
      openings: 'puertas y ventanas', ceilings: 'techos', fixtures: 'luminarias', 'roof-structure': 'estructura de cubierta', roof: 'faldones', 'roof-finish': 'cobertura', finishes: 'pavimentos', furniture: 'mobiliario' };
    const lista = xs => xs.length <= 1 ? (xs[0] || '') : xs.slice(0, -1).join(', ') + ' y ' + xs[xs.length - 1];
    const sysIn = ph => [...new Set(items.filter(it => it.phase === ph && !it.fixed).map(it => it.system))].sort((x, y) => (model.systems.find(s => s.id === x)?.order ?? 99) - (model.systems.find(s => s.id === y)?.order ?? 99));
    const moving = ph => items.some(it => it.phase === ph && !it.fixed);
    const labelOf = p => {
      if (!p.a) return p.label; const sys = sysIn(p.id), techo = ['roof-structure', 'roof', 'roof-finish'];
      const nombres = [...new Set(sys.map(x => techo.includes(x) ? 'cubierta' : NOMBRES[x] || x))];
      if (!moving(p.id)) return `${p.label} · sin piezas en este proyecto`;
      if (p.id === 'structure') return sys.includes('structure') ? 'Montaje estructural' : 'Montaje de ' + lista(nombres);
      if (p.id === 'fusion') return sys.includes('envelope') ? 'Fusión arquitectónica' : 'Montaje de ' + lista(nombres);
      return 'Montaje final · ' + lista(nombres);
    };
    const phases = PHASES.map(p => Object.freeze({ ...p, label: labelOf(p), sistemas: p.a ? sysIn(p.id) : [] }));
    const byKey = new Map(items.map(it => [it.key, it]));
    /** Desplazamiento rígido de una pieza en el estado A (0 separada … 1 montada). Exactamente 0 en A = 1. */
    function offset(key, A) {
      const it = byKey.get(key); if (!it || it.fixed) return [0, 0, 0];
      if (A >= 1) return [0, 0, 0];
      const k = 1 - smooth((A - it.window[0]) / Math.max(1e-6, it.window[1] - it.window[0]));
      return [it.exploded[0] * k, it.exploded[1] * k, it.exploded[2] * k];
    }
    /** Progreso de llegada de una pieza (0 separada, 1 en su sitio). */
    const arrival = (key, A) => { const it = byKey.get(key); if (!it || it.fixed) return 1; return smooth((A - it.window[0]) / Math.max(1e-6, it.window[1] - it.window[0])); };
    /** Guion de 15 s: A(t). Separada 0–3 s, tres fases de montaje, vivienda completa 14–15 s. */
    function filmA(t) {
      if (t <= 3) return 0; if (t >= 14) return 1;
      for (const p of PHASES) if (p.a && t >= p.t[0] && t <= p.t[1]) return p.a[0] + (p.a[1] - p.a[0]) * ((t - p.t[0]) / (p.t[1] - p.t[0]));
      return 1;
    }
    const phaseAt = t => phases.find(p => t >= p.t[0] && t < p.t[1]) || phases[phases.length - 1];
    /** Piezas que se mueven en un tramo de A (para resaltar «la pieza y sus acciones»). */
    const movingAt = A => items.filter(it => !it.fixed && A > it.window[0] && A < it.window[1]).map(it => it.key);
    return Object.freeze({ items, offset, arrival, filmA, phaseAt, movingAt, PHASES: phases, DURATION });
  }
  const round = v => Math.round(v * 1e6) / 1e6;
  return Object.freeze({ build, PHASES, DURATION, PLAN, smooth });
});
