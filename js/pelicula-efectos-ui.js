/* «Tu proyecto cobra vida» · Home y Entregar → Vídeo (rama claude/pelicula-efectos, fuera de #324).
 *
 * Home («Descubre RUBIK en acción», junto a «Dibujo vivo»): una ficha con los tres efectos. Cada selección cambia portada,
 *   explicación y vídeo; el vídeo solo aparece cuando existe un MP4 real renderizado en Blender (EJEMPLOS). Mientras no exista,
 *   la ficha lo dice («Ejemplo en preparación») y no muestra nada inventado. «Preparar con mi proyecto» lleva a Entregar.
 * Entregar (junto a P1, donde vive «Dibujo vivo»): selector de efectos con la revisión activa, plantas, requisitos del efecto,
 *   vista previa ligera del guion completo (esquemática, sobre la planta real; no es el render), estimación por perfil y
 *   confirmación. El render se ejecuta en Blender en el equipo del profesional (kit incluido en «Escena para Blender»): la
 *   confirmación prepara ese trabajo y explica cómo se recuperan el MP4 y su informe. Cancelar no inicia nada.
 * API: window.RubikPeliculaEfectos.{openDeliver(id), state()} · no escribe en el proyecto. */
(function () {
  'use strict';
  const E = window.FloorPlanPeliculaEfectos; if (!E) return;
  const L = () => { try { return typeof LANG === 'string' ? LANG : 'es'; } catch { return 'es'; } };
  const T = o => (o && (L() === 'en' ? o.en : o.es)) || '';
  const tx = (es, en) => (L() === 'en' ? en : es);
  const el = (tag, cls, parent, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; parent?.append(n); return n; };
  const btn = (id, text, parent, fn, primary) => { const b = el('button', 'btn' + (primary ? ' primary' : ''), parent, text); b.type = 'button'; if (id) b.id = id; b.onclick = fn; return b; };
  // MP4 reales publicados (se rellenan al aprobar cada render). Sin entrada → «Ejemplo en preparación».
  const EJEMPLOS = Object.freeze({ /* 'maqueta-abierta': { video:'assets/pelicula/maqueta-abierta.mp4', cover:'…', report:'…', seconds: 30 } */ });
  // Medición real (segundos por fotograma) del piloto 720p v1.0 en la máquina de pruebas: 720 fotogramas, 8 muestras.
  // Solo sirve como medida de aquella prueba; los perfiles sin medida dicen «Estimación no disponible».
  const MEDIDAS = Object.freeze({});
  let selected = 'maqueta-abierta';

  // ── Home ──────────────────────────────────────────────────────────────────────────────────────────────────────────
  function homeCard() {
    const cards = document.querySelector('#welcomeInAction .demo-cards'); if (!cards || document.getElementById('peliculaEfectosHome')) return;
    const after = cards.querySelector('[data-demo="dibujo-vivo"]');
    const card = el('article', 'demo-card pelicula-efectos-home'); card.id = 'peliculaEfectosHome'; card.dataset.demo = 'pelicula-efectos';
    after ? after.after(card) : cards.append(card);
    const fig = el('figure', 'pelicula-fig', card), body = el('div', 'demo-card-body', card);
    el('p', 'demo-card-kicker', body, tx('Película del proyecto', 'Project film'));
    el('h3', '', body, tx('Tu proyecto cobra vida', 'Your project comes to life'));
    const tabs = el('div', 'pelicula-tabs', body); tabs.setAttribute('role', 'radiogroup'); tabs.setAttribute('aria-label', tx('Efecto', 'Effect'));
    const text = el('p', 'pelicula-text', body), note = el('p', 'demo-card-note', body), acts = el('div', 'pelicula-acts', body);
    const paint = () => {
      const e = E.byId(selected), ex = EJEMPLOS[selected];
      for (const b of tabs.children) { const on = b.dataset.effect === selected; b.setAttribute('aria-checked', String(on)); b.classList.toggle('primary', on); }
      fig.replaceChildren(); if (ex && ex.video) { const v = el('video', 'welcome-demo-shot', fig); v.src = ex.video; v.poster = ex.cover || ''; v.controls = true; v.playsInline = true; v.preload = 'metadata'; v.setAttribute('aria-label', T(e.name)); }
      else { const ph = el('div', 'pelicula-ph', fig); el('span', '', ph, T(e.name)); el('small', '', ph, tx('Ejemplo en preparación', 'Example in preparation')); }
      text.textContent = T(e.explains) + ' ' + T(e.chooseWhen);
      note.textContent = ex ? tx('Render de Blender con datos reales de RUBIK · ', 'Blender render with real RUBIK data · ') + (ex.seconds ? ex.seconds + ' s' : '') : tx('Se publicará el MP4 real renderizado en Blender cuando esté aprobado.', 'The real MP4 rendered in Blender will be published once approved.');
      acts.replaceChildren(); btn('peliculaEfectosPrepare', tx('Preparar con mi proyecto', 'Prepare with my project'), acts, () => { window.RubikPeliculaEfectos.openDeliver(selected); }, true);
    };
    for (const e of E.EFFECTS) { const b = btn('peliculaTab-' + e.id, T(e.name), tabs, () => { selected = e.id; paint(); b.focus(); }); b.dataset.effect = e.id; b.setAttribute('role', 'radio'); }
    tabs.addEventListener('keydown', ev => { if (!/Arrow(Left|Right)/.test(ev.key)) return; const ids = E.EFFECTS.map(e => e.id), i = ids.indexOf(selected); selected = ids[(i + (ev.key === 'ArrowRight' ? 1 : ids.length - 1)) % ids.length]; paint(); document.getElementById('peliculaTab-' + selected)?.focus(); ev.preventDefault(); });
    paint();
  }

  // ── Entregar → Vídeo ──────────────────────────────────────────────────────────────────────────────────────────────
  function siteMissing() { const S = window.FloorPlanSceneSite, R = window.FloorPlanTerritorySession, site = window.FloorPlanApp?.project?.site;
    if (!S) return ['site']; const t = R?.get?.('terrain'), o = R?.get?.('orthophoto'); return S.missing(site, { terrain: t?.grid ? { grid: t.grid } : null, orthophoto: o?.blob ? { bytes: true } : null }); }
  // Nombre visible del proyecto: el mismo criterio que la cabecera (ejemplo → «Proyecto de ejemplo»); nunca texto chino en ES/EN.
  function projectName(p) { const ex = document.getElementById('guideBar')?.getAttribute('data-project-kind') === 'example';
    if (ex) return tx('Proyecto de ejemplo', 'Example project'); const n = String(p.name || '');
    return L() !== 'zh' && /[\u3400-\u9fff\uf900-\ufaff]/.test(n) ? tx('Proyecto sin nombre traducible', 'Project without a translatable name') : n; }
  function revision() { const p = window.FloorPlanApp?.project; if (!p) return null; const lc = window.FloorPlanApp.levelContext;
    return { projectId: p.id, name: projectName(p), updatedAt: p.updatedAt || null, levels: lc?.levels || 1, activeLevel: lc?.activeLevelId ?? null }; }
  function deliverCard() {
    const items = document.querySelector('#professionalWorkspace [data-group="experience"] .professional-group-items'); if (!items || document.getElementById('peliculaEfectosCard')) return;
    const card = el('article', 'professional-card pelicula-efectos-card', items); card.id = 'peliculaEfectosCard'; card.dataset.module = 'pelicula-efectos';
    el('h3', '', card, tx('Tu proyecto cobra vida', 'Your project comes to life'));
    el('p', '', card, tx('Película de tu proyecto en Blender: elige qué quieres explicar al cliente.', 'A film of your project in Blender: choose what to explain to your client.'));
    const st = el('p', 'professional-state', card); st.id = 'peliculaEfectosState'; st.setAttribute('role', 'status');
    const row = el('div', 'professional-card-actions', card); btn('peliculaEfectosOpen', tx('Elegir efecto', 'Choose effect'), row, () => open(), true);
    const r = revision(); st.textContent = r ? tx('Revisión activa: ', 'Active revision: ') + (r.name || r.projectId) + ' · ' + r.levels + tx(' planta(s)', ' level(s)') : '';
  }
  let dlg = null;
  function open(id) {
    if (id) selected = id;
    if (!dlg) { dlg = el('dialog', 'pelicula-efectos-dialog', document.body); dlg.id = 'peliculaEfectosDialog'; dlg.setAttribute('aria-labelledby', 'peliculaEfectosTitle'); dlg.addEventListener('close', () => stopPreview()); }
    render(); if (!dlg.open) dlg.showModal();
  }
  let previewTimer = 0;
  function stopPreview() { cancelAnimationFrame(previewTimer); previewTimer = 0; }
  function render(state = 'choose') {
    stopPreview(); dlg.replaceChildren(); dlg.dataset.state = state;
    const head = el('header', 'pelicula-head', dlg); const h = el('h2', '', head, tx('Tu proyecto cobra vida', 'Your project comes to life')); h.id = 'peliculaEfectosTitle';
    btn('peliculaEfectosClose', tx('Cerrar', 'Close'), head, () => dlg.close());
    const r = revision(); el('p', 'pelicula-rev', dlg, r ? tx('Revisión: ', 'Revision: ') + (r.name || r.projectId) + ' · ' + (r.updatedAt ? new Date(r.updatedAt).toLocaleString(L()) : tx('sin fecha', 'no date')) + ' · ' + r.levels + tx(' planta(s) incluidas', ' level(s) included') : tx('Abre un proyecto.', 'Open a project.'));
    const tabs = el('div', 'pelicula-tabs', dlg); tabs.setAttribute('role', 'radiogroup');
    for (const e of E.EFFECTS) { const b = btn('peliculaDlgTab-' + e.id, T(e.name), tabs, () => { selected = e.id; render(); document.getElementById('peliculaDlgTab-' + e.id)?.focus(); }); b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', String(e.id === selected)); b.classList.toggle('primary', e.id === selected); }
    const e = E.byId(selected), project = window.FloorPlanApp?.project || {};
    const req = E.requirements(selected, project, { siteMissing: siteMissing() });
    const sec = el('section', 'pelicula-detail', dlg);
    el('p', '', sec, T(e.explains)); const dl = el('dl', 'pelicula-beats', sec);
    for (const [k, v] of [[tx('Inicio', 'Start'), e.start], [tx('Transición', 'Transition'), e.transition], [tx('Final', 'End'), e.end]]) { el('dt', '', dl, k); el('dd', '', dl, T(v)); }
    const ul = el('ul', 'pelicula-req', sec); ul.id = 'peliculaReq';
    for (const row of req.rows) { const li = el('li', row.ok ? 'ok' : 'missing', ul, (row.ok ? '✓ ' : '✗ ') + T(row.label)); li.dataset.req = row.key; if (!row.ok && row.missing?.length && row.key === 'site') el('small', '', li, ' · ' + tx('Falta: ', 'Missing: ') + row.missing.join(', ') + tx(' (Analizar › Contexto territorial)', ' (Analyze › Territorial context)')); }
    const s = E.script(selected, { revision: r });
    const canvas = el('canvas', 'pelicula-preview', sec); canvas.id = 'peliculaPreview'; canvas.width = 640; canvas.height = 360; canvas.setAttribute('aria-label', tx('Vista previa esquemática del guion sobre tu planta', 'Schematic preview of the script on your plan'));
    const cap = el('p', 'pelicula-cap', sec); cap.id = 'peliculaPreviewCaption'; cap.textContent = tx('Vista previa ligera: el guion completo (', 'Light preview: the whole script (') + s.seconds + ' s) ' + tx('sobre tu planta real. No es el render.', 'on your real plan. Not the render.');
    const prof = el('label', 'pelicula-prof', sec, tx('Perfil ', 'Profile ')); const sel = el('select', '', prof); sel.id = 'peliculaProfile';
    for (const p of E.PROFILES) { const o = el('option', '', sel, p.res + ' · ' + p.samples + tx(' muestras', ' samples')); o.value = p.id; }
    const est = el('p', 'pelicula-est', sec); est.id = 'peliculaEstimate'; est.setAttribute('role', 'status');
    const paintEst = () => { const p = E.PROFILES.find(x => x.id === sel.value), x = E.estimate(s, p, MEDIDAS);
      est.textContent = x.available ? tx('Estimación: ', 'Estimate: ') + Math.round(x.low / 60) + '–' + Math.round(x.high / 60) + ' min · ' + s.frames + tx(' fotogramas', ' frames')
        : tx('Estimación no disponible: falta una medición real de este perfil en tu equipo. Factores: ', 'Estimate not available: no real measurement of this profile on your computer. Factors: ') + s.frames + tx(' fotogramas · ', ' frames · ') + p.res + ' · ' + p.samples + tx(' muestras.', ' samples.'); };
    sel.onchange = paintEst; paintEst();
    const acts = el('div', 'pelicula-acts', dlg);
    btn('peliculaPreviewPlay', tx('Ver vista previa', 'Watch preview'), acts, () => play(canvas, s, project), false);
    const go = btn('peliculaConfirm', tx('Preparar el render en Blender…', 'Prepare the Blender render…'), acts, () => confirm(s, sel.value), true); go.disabled = !req.ready;
    if (!req.ready) el('p', 'pelicula-why', dlg, tx('Completa lo que falta para preparar este efecto.', 'Complete what is missing to prepare this effect.')).id = 'peliculaWhy';
    drawPlan(canvas.getContext('2d'), project, 0, s.shots[0].id);
  }
  function confirm(s, profileId) {
    dlg.replaceChildren(); dlg.dataset.state = 'confirm';
    el('h2', '', dlg, tx('Preparar el render', 'Prepare the render')).id = 'peliculaEfectosTitle';
    el('p', '', dlg, tx('El render se ejecuta en Blender en tu equipo, no en el navegador. RUBIK prepara el paquete con la escena, el guion y el kit; ', 'The render runs in Blender on your computer, not in the browser. RUBIK prepares the package with the scene, the script and the kit; ')
      + tx('al terminar, el MP4 y su informe quedan en la carpeta «resultados/pelicula» (macOS/Linux: sh rodar.sh pelicula) del paquete.', 'when finished, the MP4 and its report are in the package folder «resultados/pelicula» (macOS/Linux: sh rodar.sh pelicula).'));
    el('p', '', dlg, tx('Efecto: ', 'Effect: ') + T(E.byId(s.effect).name) + ' · ' + s.seconds + ' s · ' + tx('perfil ', 'profile ') + profileId);
    const acts = el('div', 'pelicula-acts', dlg);
    btn('peliculaCancel', tx('Cancelar', 'Cancel'), acts, () => render());
    btn('peliculaGo', tx('Descargar el paquete para Blender', 'Download the package for Blender'), acts, () => { window.RubikPeliculaEfectos._last = { effect: s.effect, profile: profileId, script: s, entryId: window.FloorPlanApp?.entryId || null, projectId: window.FloorPlanApp?.project?.id || null }; dlg.close(); document.getElementById('sceneExportOpen')?.click(); }, true);
  }
  // Vista previa ligera: el guion sobre la planta real (estancias, muros, huecos, muebles por sistemas); la cámara del render
  // se resume como encuadre (zoom hacia la estancia de destino). Sirve para juzgar ritmo y montaje antes del render.
  function play(canvas, s, project) {
    stopPreview(); const ctx = canvas.getContext('2d'), t0 = performance.now();
    const tick = () => { const t = (performance.now() - t0) / 1000; const sh = s.shots.find(x => t >= x.seconds[0] && t < x.seconds[1]) || s.shots.at(-1);
      drawPlan(ctx, project, (t - sh.seconds[0]) / (sh.seconds[1] - sh.seconds[0]), sh.id, t, s); if (t < s.seconds) previewTimer = requestAnimationFrame(tick); else canvas.dataset.played = 'true'; };
    canvas.dataset.played = 'false'; tick();
  }
  function drawPlan(ctx, p, k, shot, t = 0, s = null) {
    const W = ctx.canvas.width, H = ctx.canvas.height; ctx.fillStyle = '#f4f1ea'; ctx.fillRect(0, 0, W, H);
    const pts = (p.walls || []).flatMap(w => [w.start, w.end]); if (!pts.length) return;
    const xs = pts.map(q => q.x), ys = pts.map(q => q.y), x0 = Math.min(...xs), y0 = Math.min(...ys), x1 = Math.max(...xs), y1 = Math.max(...ys);
    const order = s ? s.shots.map(x => x.id) : [shot], at = id => order.indexOf(id) < order.indexOf(shot) ? 1 : id === shot ? k : 0;
    let sc = Math.min((W - 40) / (x1 - x0), (H - 40) / (y1 - y0)), ox = (W - (x1 - x0) * sc) / 2 - x0 * sc, oy = (H - (y1 - y0) * sc) / 2 - y0 * sc;
    if (['enter', 'living', 'inside', 'door'].includes(shot)) { const rm = (p.rooms || []).filter(r => r.counted !== false).sort((a, b) => b.polygon.length - a.polygon.length)[0]; if (rm) { const cx = rm.polygon.reduce((a, q) => a + q.x, 0) / rm.polygon.length, cy = rm.polygon.reduce((a, q) => a + q.y, 0) / rm.polygon.length, z = 1 + (shot === 'enter' || shot === 'door' ? k : 1) * 1.6; sc *= z; ox = W / 2 - cx * sc; oy = H / 2 - cy * sc; } }
    const X = v => ox + v.x * sc, Y = v => oy + v.y * sc;
    ctx.globalAlpha = 1; for (const r of p.rooms || []) { if (!r.polygon) continue; ctx.beginPath(); r.polygon.forEach((q, i) => i ? ctx.lineTo(X(q), Y(q)) : ctx.moveTo(X(q), Y(q))); ctx.closePath(); ctx.fillStyle = `rgba(214,196,160,${0.25 + 0.6 * Math.max(at('floors'), at('plan') * 0.3)})`; ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.stroke(); }
    const wk = Math.max(at('walls'), at('assembled')); ctx.strokeStyle = '#2b2b2b'; for (const w of p.walls || []) { ctx.lineWidth = Math.max(1, (w.thicknessMm || 120) * sc * (0.15 + 0.85 * wk)); ctx.beginPath(); ctx.moveTo(X(w.start), Y(w.start)); ctx.lineTo(X(w.end), Y(w.end)); ctx.stroke(); }
    const ok = at('openings'); if (ok > 0) { ctx.fillStyle = `rgba(60,120,200,${ok})`; for (const o of p.openings || []) { const w = (p.walls || []).find(x => x.id === o.wallId); if (!w) continue; const L = Math.hypot(w.end.x - w.start.x, w.end.y - w.start.y) || 1, u = (o.offsetMm || 0) / L; ctx.fillRect(X({ x: w.start.x + (w.end.x - w.start.x) * u, y: 0 }) - 3, Y({ x: 0, y: w.start.y + (w.end.y - w.start.y) * u }) - 3, 6, 6); } }
    const fk = at('furniture'); if (fk > 0) { ctx.fillStyle = `rgba(150,90,60,${fk})`; for (const o of p.objects || []) { const q = o.position || o; if (Number.isFinite(q.x)) ctx.fillRect(X(q) - 2, Y(q) - 2, 4, 4); } }
    ctx.fillStyle = '#111'; ctx.font = '13px system-ui'; ctx.fillText((s ? t.toFixed(1) + ' s · ' : '') + shotName(shot), 10, H - 10);
  }

  const SHOTS = { plan: ['Planta', 'Plan'], floors: ['Suelos', 'Floors'], walls: ['Muros', 'Walls'], openings: ['Huecos y carpinterías', 'Openings'], furniture: ['Mobiliario', 'Furniture'],
    assembled: ['Vivienda montada', 'Assembled home'], enter: ['Entrada en la estancia', 'Into the room'], living: ['Interior', 'Interior'], site: ['Emplazamiento', 'Site'], approach: ['Acercamiento', 'Approach'],
    access: ['Acceso', 'Access'], door: ['Puerta', 'Door'], inside: ['Interior', 'Interior'] };
  const shotName = id => { const v = SHOTS[id]; return v ? tx(v[0], v[1]) : ''; };
  function boot() { homeCard(); deliverCard(); }
  new MutationObserver(() => { if (!document.getElementById('peliculaEfectosHome') || !document.getElementById('peliculaEfectosCard')) boot(); }).observe(document.body, { childList: true, subtree: true });
  window.RubikPeliculaEfectos = { openDeliver(id) { if (id) selected = id; document.getElementById('welcomeDialog')?.close?.(); document.getElementById('workArea-deliver')?.click(); setTimeout(() => open(id), 0); }, open, state: () => ({ selected, dialog: dlg?.dataset.state || null }) };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
