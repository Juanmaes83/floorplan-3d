/* SCULPT Simulator · C · Adaptador a RUBIK: reparte las etiquetas de estancia de la vista 3D (div.rlabel de CSS2DObject)
 * con RubikLabelLayout. Se llama JUSTO DESPUÉS de `labelRenderer.render(scene, camera)` (punto de cirugía en el HANDOFF).
 * Solo pinta: la propiedad CSS independiente `translate` (se suma al `transform` que CSS2DRenderer reescribe en cada render),
 * una clase de forma compacta (oculta el área) y `visibility` para las que no caben, más líneas guía en un SVG propio.
 * No toca el proyecto, la cámara, CSS2DRenderer ni el orden de capas. Idempotente: restablece antes de medir.
 * Prioridad: superficie de la estancia (la principal conserva su sitio); empate por id. */
(function (root) {
  'use strict';
  // '#presentationBtn': con C-bis flota sobre la escena en pantallas ≤ 1100 px (U5); en la cabecera queda fuera del lienzo y no influye.
  const OBSTACLES = ['#nav3d', '#territoryLayers', '#hint3d', '#walkOverlay', '#joy', '#walkExit', '#presentationBtn'];
  const STYLE = '.rlabel.rlabel--compact small{display:none}#rubikLabelLeaders{position:absolute;inset:0;pointer-events:none;overflow:visible;z-index:1}#rubikLabelLeaders line{stroke:rgba(43,40,36,.55);stroke-width:1}';
  let last = null, memory = {}; // memoria por etiqueta (histéresis entre fotogramas), indexada por el texto del nombre
  const visible = el => { if (!el || el.hidden) return false; const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  function ensureChrome(host) {
    if (!document.getElementById('rubikLabelLayoutStyle')) { const st = document.createElement('style'); st.id = 'rubikLabelLayoutStyle'; st.textContent = STYLE; document.head.append(st); }
    let svg = document.getElementById('rubikLabelLeaders');
    if (!svg) { svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.id = 'rubikLabelLeaders'; svg.setAttribute('aria-hidden', 'true'); host.append(svg); }
    return svg;
  }
  // Rendimiento (perfil medido, 390×844, RUBIK 8e917e1): el núcleo costaba 0,1 ms y el adaptador 8 ms, casi todo en
  // 12 recálculos de estilo FORZADOS por aplicación (escritura → lectura alternadas: restablecer y medir, y por cada
  // etiqueta añadir la clase compacta y volver a medir). Ahora: 1) todas las lecturas primero, sin restablecer: la posición
  // natural es el rectángulo menos el `translate` que puso la aplicación anterior; 2) el centro de una etiqueta no cambia
  // en su forma compacta (CSS2DRenderer la centra con un translate porcentual), así que no se relee; el tamaño completo se
  // guarda por elemento; 3) solo se escribe lo que cambia (y el SVG solo si cambian las líneas).
  const full = new WeakMap(); let leadersKey = null;
  const parseTranslate = v => { const m = String(v || '').trim().split(/\s+/).filter(Boolean).map(x => parseFloat(x) || 0); return [m[0] || 0, m[1] || 0]; };
  const fullSize = (el, r, small, text) => { const f = { text, w: r.width, h: r.height, sw: small ? small.getBoundingClientRect().width + 4 : 0 }; full.set(el, f); return f; };
  function setIf(el, mode, vis, compact, translate) {
    if (el.dataset.layout !== mode) { if (mode == null) delete el.dataset.layout; else el.dataset.layout = mode; }
    if (el.style.visibility !== vis) el.style.visibility = vis;
    if (el.classList.contains('rlabel--compact') !== compact) el.classList.toggle('rlabel--compact', compact);
    // Se compara con el estilo EN LÍNEA actual (leerlo no fuerza recálculo), en números: robusto si otro código lo limpia.
    const [a0, b0] = parseTranslate(el.style.translate), [a1, b1] = parseTranslate(translate);
    if (Math.abs(a0 - a1) > 0.005 || Math.abs(b0 - b1) > 0.005) el.style.translate = translate;
  }
  // Render bajo demanda: abrir «Navegación» (u otro obstáculo) no repinta el 3D, así que el reparto se quedaba desfasado
  // (medido: 9 etiquetas bajo el panel en 390×844). Se observan los obstáculos (clase, hidden, estilo y tamaño) y, si
  // cambian, se reparte de nuevo en el siguiente fotograma, sin repintar la escena (≈0,2 ms). Solo tras un apply real.
  let watched = new WeakSet(), mo = null, ro = null, pending = 0, lastArgs = null;
  function watch(selectors) {
    if (typeof MutationObserver !== 'function') return;
    const kick = () => { if (pending || !lastArgs) return; pending = requestAnimationFrame(() => { pending = 0; apply(lastArgs); }); };
    if (!mo) { mo = new MutationObserver(kick); ro = typeof ResizeObserver === 'function' ? new ResizeObserver(kick) : null; }
    for (const s of selectors) { const el = document.querySelector(s); if (!el || watched.has(el)) continue; watched.add(el);
      mo.observe(el, { attributes: true, attributeFilter: ['class', 'hidden', 'style', 'open'] }); if (ro) ro.observe(el); }
  }
  function apply(args = {}) {
    const { Layout = root.RubikLabelLayout, host = document.querySelector('#view3d'), obstacles = OBSTACLES, options } = args;
    if (!Layout || !host) return null;
    lastArgs = args; watch(obstacles);
    const canvas = host.querySelector('canvas'); if (!canvas || !visible(canvas)) return null;
    const svg = ensureChrome(host), els = [...host.querySelectorAll('.rlabel')];
    // —— Lecturas (sin escrituras intercaladas) ——
    const c = canvas.getBoundingClientRect(), h = host.getBoundingClientRect(), labels = [], skipped = [];
    for (const [i, el] of els.entries()) {
      if (!el.parentElement || getComputedStyle(el).display === 'none' || el.offsetParent === null) { skipped.push(el); continue; }
      const r = el.getBoundingClientRect(); if (!(r.width > 0)) { skipped.push(el); continue; }
      const [tx, ty] = parseTranslate(el.style.translate), small = el.querySelector('small'), text = el.textContent;
      let f = full.get(el);
      if (!el.classList.contains('rlabel--compact')) { if (!f || f.text !== text || f.w !== r.width || f.h !== r.height) f = fullSize(el, r, small, text); }
      else if (!f || f.text !== text) { el.classList.remove('rlabel--compact'); f = fullSize(el, el.getBoundingClientRect(), small, text); } // raro: sin medida completa
      const area = parseFloat((small && small.textContent || '').replace(',', '.')) || 0;
      labels.push({ id: (el.firstChild && el.firstChild.textContent || String(i)).trim() + '#' + i, el, x: r.left + r.width / 2 - tx, y: r.top + r.height / 2 - ty, w: f.w, h: f.h, priority: area, compact: small ? { w: Math.max(24, f.w - f.sw), h: f.h } : null });
    }
    const obs = obstacles.map(s => document.querySelector(s)).filter(visible).map(e => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
    const res = Layout.layout({ labels: labels.map(({ el, ...l }) => l), safe: { x: c.left, y: c.top, w: c.width, h: c.height }, obstacles: obs, options, previous: memory });
    memory = Object.fromEntries(res.labels.map(p => [p.id, { dx: p.dx, dy: p.dy, mode: p.mode }]));
    // —— Escrituras (solo lo que cambia) ——
    for (const el of skipped) setIf(el, null, '', false, '');
    const lines = [];
    res.labels.forEach((p, k) => {
      const L = labels[k];
      if (p.mode === 'hidden') { setIf(L.el, 'hidden', 'hidden', false, ''); return; }
      const tx = p.x + p.w / 2 - L.x, ty = p.y + p.h / 2 - L.y, round = v => Math.round(v * 100) / 100;
      setIf(L.el, p.mode, '', p.mode === 'compact', tx || ty ? `${round(tx)}px ${round(ty)}px` : ''); L.el.__rubikTarget = [p.x + p.w / 2, p.y + p.h / 2];
      if (p.leader) { const ax = p.leader.from[0] - h.left, ay = p.leader.from[1] - h.top;
        lines.push([ax, ay, Math.min(Math.max(ax, p.x - h.left), p.x - h.left + p.w), Math.min(Math.max(ay, p.y - h.top), p.y - h.top + p.h)]); }
    });
    const key = JSON.stringify(lines);
    if (key !== leadersKey || svg.childElementCount !== lines.length) { leadersKey = key; while (svg.firstChild) svg.firstChild.remove();
      for (const [x1, y1, x2, y2] of lines) { const ln = document.createElementNS(svg.namespaceURI, 'line'); ln.setAttribute('x1', x1); ln.setAttribute('y1', y1); ln.setAttribute('x2', x2); ln.setAttribute('y2', y2); svg.append(ln); } }
    last = { ...res.summary, obstacles: obs.length };
    return last;
  }
  /** QA: distancia máxima (px) entre la caja que decidió el reparto y la caja real de cada etiqueta visible. */
  function placementError({ host = document.querySelector('#view3d') } = {}) {
    let worst = 0; const els = [...host.querySelectorAll('.rlabel')];
    for (const el of els) { const want = el.__rubikTarget; if (!want || el.dataset.layout === 'hidden' || el.offsetParent === null || getComputedStyle(el).display === 'none') continue; const r = el.getBoundingClientRect();
      worst = Math.max(worst, Math.abs(r.left + r.width / 2 - want[0]), Math.abs(r.top + r.height / 2 - want[1])); }
    return Math.round(worst * 100) / 100;
  }
  /** Medida antes/después (para QA): pares solapados entre etiquetas visibles y etiquetas bajo obstáculos. */
  function audit({ host = document.querySelector('#view3d'), obstacles = OBSTACLES } = {}) {
    const rs = [...host.querySelectorAll('.rlabel')].filter(e => e.offsetParent !== null && getComputedStyle(e).visibility !== 'hidden').map(e => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; }).filter(r => r.w > 0);
    const c = host.querySelector('canvas').getBoundingClientRect(), obs = obstacles.map(s => document.querySelector(s)).filter(visible).map(e => e.getBoundingClientRect());
    const hit = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
    let pairs = 0; for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) if (hit(rs[i], rs[j])) pairs++;
    return { visibleLabels: rs.length, overlappingPairs: pairs, underObstacles: rs.filter(r => obs.some(o => hit(r, { x: o.left, y: o.top, w: o.width, h: o.height }))).length,
      outsideCanvas: rs.filter(r => r.x < c.left || r.y < c.top || r.x + r.w > c.right || r.y + r.h > c.bottom).length, hiddenByLayout: host.querySelectorAll('.rlabel[data-layout="hidden"]').length };
  }
  const reset = () => { memory = {}; leadersKey = null; };
  const unwatch = () => { if (mo) mo.disconnect(); if (ro) ro.disconnect(); if (pending) cancelAnimationFrame(pending); mo = ro = null; pending = 0; watched = new WeakSet(); lastArgs = null; };
  root.RubikLabels = Object.freeze({ apply, audit, reset, unwatch, placementError, get last() { return last; }, OBSTACLES });
})(typeof globalThis !== 'undefined' ? globalThis : this);
