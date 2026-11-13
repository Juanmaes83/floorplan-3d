/* UX-08 · Cotas en vivo al mover muebles: capa visual (marcado SVG en milímetros del plano, sin estado del proyecto).
 *
 * Se dibuja dentro de #gSel, la capa de selección del editor, mientras se arrastra un mueble o durante un momento
 * después de moverlo con las flechas. Así:
 *   · no recibe el puntero (pointer-events="none") y las asas de giro y tamaño se dibujan encima;
 *   · las exportaciones del plano ya vacían #gSel (lámina y PNG), de modo que nunca acaba en un entregable;
 *   · nada se guarda: no toca el proyecto, el historial ni la herramienta de medir.
 * Las cifras salen de FloorPlanLiveDimensions.measure (milímetros reales; el zoom solo cambia el tamaño del texto). */
(function (root) {
  'use strict';
  const Core = typeof module === 'object' && module.exports ? require('./live-dimensions-core.js') : root.FloorPlanLiveDimensions;
  const COLOR = '#2f5d62', NOTE = '#6b6257', KEY_MS = 1400;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = mm => `${mm} mm`; // como la herramienta de medir del editor
  let nudgeId = null, nudgeUntil = 0, timer = null;

  // Las flechas mueven el mueble paso a paso: las cotas se muestran un momento y se ocultan solas.
  function nudge(id, rerender) {
    nudgeId = id; nudgeUntil = Date.now() + KEY_MS;
    clearTimeout(timer); timer = setTimeout(() => { nudgeUntil = 0; rerender?.(); }, KEY_MS + 20);
  }
  const active = (id, dragging) => !!dragging || (id === nudgeId && Date.now() < nudgeUntil);

  // Asas del editor (mismas medidas que renderSel en index.html) para no poner cifras encima.
  function handles(piece, k, coarse) {
    const a = piece.rot * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), p = 5 * k, ro = (coarse ? 40 : 26) * k, r = (coarse ? 24 : 11) * k;
    const at = (x, y) => ({ x: piece.cx + x * c - y * s, y: piece.cy + x * s + y * c, r });
    return [at(0, -piece.d / 2 - ro), at(piece.w / 2 + p, piece.d / 2 + p)];
  }

  /* geometry: la del editor (FloorPlanCore.geometry). piece: { cx, cy, w, d, rot }.
     opts: { k: mm por píxel, coarse: táctil, bounds: {x0,y0,x1,y1} zona visible del plano en mm (opcional) }. */
  function markup(geometry, piece, { k = 1, coarse = false, bounds = null } = {}) {
    const m = Core.measure(geometry, piece, { prefer: { top: 0.25 } });
    const fs = (coarse ? 13 : 12) * k, halo = `stroke="#fff" stroke-width="${3.5 * k}" paint-order="stroke"`;
    if (m.status !== 'ok') {
      const ys = Core.footprint(piece).map(v => v.y);
      return `<g class="live-dims" data-live-dims="${esc(m.status)}" pointer-events="none" aria-hidden="true">` +
        `<text x="${piece.cx}" y="${Math.max(...ys) + 44 * k}" font-size="${11 * k}" text-anchor="middle" fill="${NOTE}" ${halo}>Sin cotas: ${esc(m.reason)}</text></g>`;
    }
    const hs = handles(piece, k, coarse), S = `stroke="${COLOR}" stroke-width="1.25" vector-effect="non-scaling-stroke"`;
    let out = '';
    for (const side of m.sides) {
      const { from: a, to: b, mm } = side, L = Math.hypot(b.x - a.x, b.y - a.y);
      const n = L > 1e-6 ? { x: (b.x - a.x) / L, y: (b.y - a.y) / L } : null, label = fmt(mm);
      const w = label.length * fs * 0.56, h = fs * 1.2;
      const clash = q => hs.some(H => Math.abs(q.x - H.x) < w / 2 + H.r && Math.abs(q.y - H.y) < h / 2 + H.r);
      let q;
      if (!n) { // pegado al límite: sin línea, solo «0 mm» junto al lado
        const cx = piece.cx, cy = piece.cy, d = Math.hypot(a.x - cx, a.y - cy) || 1;
        q = { x: a.x + (a.x - cx) / d * 12 * k, y: a.y + (a.y - cy) / d * 12 * k };
      } else {
        out += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" ${S} stroke-dasharray="4 3"/>` +
          `<line x1="${b.x - n.y * 5 * k}" y1="${b.y + n.x * 5 * k}" x2="${b.x + n.y * 5 * k}" y2="${b.y - n.x * 5 * k}" ${S}/>`;
        q = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        // Hueco corto en pantalla, o cifra encima de un asa: la cifra va al otro lado del límite.
        if (L < w + 8 * k || clash(q)) q = { x: b.x + n.x * (h + 6 * k), y: b.y + n.y * (h + 6 * k) };
        // Si la cifra quedaría fuera de la zona visible (el muro está fuera de la pantalla), se desliza por su propia línea
        // hacia el mueble hasta verse entera; si no cabe en ningún punto de la línea, se queda donde estaba.
        else if (bounds) {
          const m = 4 * k, lim = (a0, nd, lo, hi) => Math.abs(nd) < 1e-9 ? (a0 >= lo && a0 <= hi ? [-Infinity, Infinity] : [1, 0]) : [(lo - a0) / nd, (hi - a0) / nd].sort((p1, p2) => p1 - p2);
          const [x0, x1] = lim(a.x, n.x, bounds.x0 + w / 2 + m, bounds.x1 - w / 2 - m), [y0, y1] = lim(a.y, n.y, bounds.y0 + h / 2 + m, bounds.y1 - h / 2 - m);
          const t0 = Math.max(0, x0, y0), t1 = Math.min(L, x1, y1), tm = L / 2;
          if (t0 <= t1 && (tm < t0 || tm > t1)) { const t = Math.min(t1, Math.max(t0, tm)); q = { x: a.x + n.x * t, y: a.y + n.y * t }; }
        }
      }
      if (clash(q)) continue; // antes sin cifra que tapando un control
      out += `<text x="${q.x}" y="${q.y + fs * 0.35}" font-size="${fs}" text-anchor="middle" fill="${COLOR}" font-weight="600" ${halo} data-side="${side.side}" data-mm="${mm}">${esc(label)}</text>`;
    }
    return `<g class="live-dims" data-live-dims="ok" data-room="${esc(m.roomId)}" pointer-events="none" aria-hidden="true">${out}</g>`;
  }

  const api = Object.freeze({ markup, nudge, active, KEY_MS });
  if (typeof module === 'object' && module.exports) module.exports = api; else root.FloorPlanLiveDimensionsUI = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
