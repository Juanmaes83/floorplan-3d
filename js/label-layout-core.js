'use strict';
/* SCULPT Simulator · C · Reparto de etiquetas en pantalla SIN SOLAPES y dentro de una ZONA SEGURA (núcleo puro, UMD).
 *
 * Origen: simulator@57d562c `sims/kit/hud.js` (MIT), anotaciones: «keep labels inside the viewport (between header and
 * bottom panel)», un recorte de cada etiqueta a la zona libre. KEEP: la zona segura. GENERALISE (motivo medido en
 * COMPONENTES/AUDITORIA-UX-VISTA3D: 4–33 pares de etiquetas de estancia solapados en la vista aérea de RUBIK y etiquetas
 * bajo los paneles): además de la zona segura, obstáculos (paneles sobre el lienzo) y reparto voraz determinista por
 * prioridad; desplazamiento acotado con línea guía; forma compacta; y, solo si no cabe en ningún sitio, ocultación
 * declarada (nunca silenciosa). REMOVE del donante C: caja de selección, halo, ruta, minimapa, registro y el interfaz de
 * juguete (RUBIK ya tiene selHelper, presentationRoute y el minimapa de nav3d).
 *
 * No mueve nada del modelo: calcula desplazamientos de pantalla; quien lo aplica (adaptador) solo pinta.
 */
(function (root, factory) { const api = factory(); if (typeof module === 'object' && module.exports) module.exports = api; else root.RubikLabelLayout = api; })(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const DEFAULTS = Object.freeze({ margin: 6, gap: 3, maxShift: 72, leaderFrom: 14, step: 6 });
  const inter = (a, b, g = 0) => a.x < b.x + b.w + g && b.x < a.x + a.w + g && a.y < b.y + b.h + g && b.y < a.y + a.h + g;
  const inside = (r, s) => r.x >= s.x && r.y >= s.y && r.x + r.w <= s.x + s.w && r.y + r.h <= s.y + s.h;
  const r2 = v => Math.round(v * 100) / 100;

  // Candidatos alrededor del ancla, del más cercano al más lejano (orden fijo → determinista): centro, arriba, abajo,
  // derecha, izquierda, diagonales, en anillos de `step` px hasta `maxShift`.
  function candidates(maxShift, step) {
    const out = [[0, 0]];
    for (let d = step; d <= maxShift; d += step) for (const [ux, uy] of [[0, -1], [0, 1], [1, 0], [-1, 0], [1, -1], [-1, -1], [1, 1], [-1, 1]]) out.push([ux * d, uy * d]);
    return out;
  }

  /**
   * labels: [{id, x, y, w, h, priority, compact?:{w,h}}] (x,y = ancla en pantalla, centro de la etiqueta; w,h = tamaño).
   * safe: {x,y,w,h} zona donde pueden ir (p. ej. el lienzo 3D menos márgenes); obstacles: [{x,y,w,h,id?}].
   * Devuelve por etiqueta {id, dx, dy, x, y, w, h, mode:'full'|'compact'|'hidden', leader, reason} y un resumen.
   */
  function layout({ labels, safe, obstacles = [], options = {}, previous = null }) {
    if (!Array.isArray(labels)) throw Error('layout: labels required');
    if (!safe || !(safe.w > 0) || !(safe.h > 0)) throw Error('layout: safe area required');
    const o = { ...DEFAULTS, ...options }, zone = { x: safe.x + o.margin, y: safe.y + o.margin, w: safe.w - 2 * o.margin, h: safe.h - 2 * o.margin };
    const obs = obstacles.filter(b => b && b.w > 0 && b.h > 0), placed = [], cands = candidates(o.maxShift, o.step), out = new Map();
    const order = labels.map((l, i) => ({ ...l, i })).sort((a, b) => (b.priority || 0) - (a.priority || 0) || String(a.id).localeCompare(String(b.id)));
    for (const l of order) {
      if (![l.x, l.y, l.w, l.h].every(Number.isFinite)) { out.set(l.id, { id: l.id, mode: 'hidden', reason: 'invalid-geometry' }); continue; }
      // Ancla fuera de la zona (estancia fuera de cuadro): no se arrastra hacia dentro, señalaría algo que no se ve.
      if (!(l.x >= safe.x && l.x <= safe.x + safe.w && l.y >= safe.y && l.y <= safe.y + safe.h)) { out.set(l.id, { id: l.id, mode: 'hidden', reason: 'anchor-outside-safe-area' }); continue; }
      let best = null;
      // Histéresis: en una animación, la colocación del fotograma anterior se conserva mientras siga siendo válida (sin saltos).
      const prev = previous && previous[l.id], forms = [{ mode: 'full', w: l.w, h: l.h }, ...(l.compact ? [{ mode: 'compact', w: l.compact.w, h: l.compact.h }] : [])];
      if (prev && prev.mode !== 'hidden') forms.sort((a, b) => (a.mode === prev.mode ? -1 : 0) - (b.mode === prev.mode ? -1 : 0));
      for (const form of forms) {
        const list = prev && prev.mode === form.mode ? [[prev.dx, prev.dy], ...cands] : cands;
        for (const [dx, dy] of list) {
          const r = { x: l.x + dx - form.w / 2, y: l.y + dy - form.h / 2, w: form.w, h: form.h };
          if (!inside(r, zone) || obs.some(b => inter(r, b)) || placed.some(p => inter(r, p, o.gap))) continue;
          best = { r, dx, dy, mode: form.mode }; break;
        }
        if (best) break;
      }
      if (!best) { out.set(l.id, { id: l.id, mode: 'hidden', reason: 'no-free-slot' }); continue; }
      placed.push(best.r);
      const shift = Math.hypot(best.dx, best.dy);
      out.set(l.id, { id: l.id, dx: best.dx, dy: best.dy, x: r2(best.r.x), y: r2(best.r.y), w: best.r.w, h: best.r.h, mode: best.mode, leader: shift >= o.leaderFrom ? { from: [r2(l.x), r2(l.y)] } : null, reason: shift ? 'shifted' : 'at-anchor' });
    }
    const rows = labels.map(l => out.get(l.id));
    return { labels: rows, summary: { total: rows.length, atAnchor: rows.filter(r => r.reason === 'at-anchor').length, shifted: rows.filter(r => r.reason === 'shifted').length, compact: rows.filter(r => r.mode === 'compact').length, hidden: rows.filter(r => r.mode === 'hidden').length } };
  }

  /** Pares de rectángulos que se solapan (para medir antes/después). */
  function overlaps(rects, gap = 0) { let n = 0; for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) if (inter(rects[i], rects[j], gap)) n++; return n; }

  return Object.freeze({ DEFAULTS, layout, overlaps, candidates });
});
