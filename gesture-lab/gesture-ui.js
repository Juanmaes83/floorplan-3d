/* RUBIK SOTA · Gesture Labs §6 · ensayo AISLADO: presentar una vivienda real de RUBIK con dos gestos como máximo.
   Solo se carga con ?gesture-lab=1 (index.html); el producto no cambia sin ese parámetro.
   Recorrido: 1 · desplegar el plano (revisión guardada «antes») → 2 · el 3D de esa MISMA revisión, encuadrado en una
   estancia identificada en ambas vistas → 3 · comparar dos revisiones guardadas (original y variante) con encuadre común y
   llamadas con valor, unidad, fuente, revisión y estado.
   Controles equivalentes: botones visibles (ratón y táctil), teclado (→/Espacio = siguiente, ← = anterior, A/D = antes/después,
   Esc = salir) y, solo si la persona lo activa, la webcam (mano abierta sostenida = siguiente; deslizar con la mano cerrada =
   antes/después). Perder la mano pausa los gestos sin disparar nada; la vista se conserva y los botones siguen.
   Piedras (autorizadas por el propietario 27/11): Director de Orquesta @ dcf4b7ac (before-after-reforma v2.1.2: gesto y
   ciclo de webcam; bola-imagen v1.3: despliegue de la imagen) y map-gesture-controls @ 6939d43a (La Batuta v0.2: tutorial
   corto, indicador de cámara y modo sin cámara). Adaptadas a acciones de presentación de RUBIK; sin copiar su interfaz.
   Nada se escribe en el proyecto; no se graba ni guarda imagen de la cámara. MediaPipe Hands (CDN) solo se descarga al
   activar la cámara. */
(function boot(tries) {
  'use strict';
  tries = tries || 0;
  // La app publica FloorPlanApp al terminar de arrancar: el laboratorio espera a que exista (como mucho ~20 s).
  const app = window.FloorPlanApp, G = window.RubikGestureCore, R = window.FloorPlanRevisionCompare;
  if (!app?.storyTargets || !G || !R) { if (tries < 200) setTimeout(() => boot(tries + 1), 100); return; }
  const nm2 = n => typeof nm === 'function' ? nm(n) : n;
  const el = (tag, attrs, parent, text) => { const n = document.createElement(tag); for (const [k, v] of Object.entries(attrs || {})) n.setAttribute(k, v); if (text !== undefined) n.textContent = text; parent?.append(n); return n; };
  const fmt = v => typeof v === 'number' ? v.toLocaleString('es-ES', { maximumFractionDigits: 2 }) : String(v);
  const log = []; const note = (type, data = {}) => { log.push({ t: Math.round(performance.now()), type, ...data }); if (log.length > 200) log.shift(); };

  // ── Datos de la presentación: dos revisiones GUARDADAS (StoryLayers: original y su variante) ──
  let pair = null, cmp = null, room = null;
  function load() {
    const t = app.storyTargets?.() || { pairs: [] }; pair = t.pairs.find(p => { try { return !R.compare(p.before.project, p.after.project, { relation: 'library-variant' }).identical; } catch { return false; } }) || null;
    if (!pair) return false;
    cmp = R.compare(pair.before.project, pair.after.project, { relation: 'library-variant', beforeLabel: 'Antes', afterLabel: 'Después' });
    const rooms = pair.before.project.rooms || []; room = rooms.find(r => /Salón|Living|客厅/i.test(nm2(r.name))) || rooms[0] || null;
    return true;
  }
  const revLabel = side => { const s = pair[side === 'before' ? 'before' : 'after']; const at = cmp[side].updatedAt; return `«${nm2(s.name)}»${at ? ' · guardada ' + new Date(at).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }) : ''}`; };

  // ── Interfaz ──
  const P = G.presentation(), det = G.create();
  const dlg = el('dialog', { id: 'gestureLab', class: 'gl', 'aria-labelledby': 'glTitle' }, document.body);
  const head = el('header', { class: 'gl-head' }, dlg);
  el('p', { class: 'gl-badge' }, head, 'Laboratorio · Presentar con gestos (ensayo aislado; no es una función publicada)');
  const title = el('h2', { id: 'glTitle' }, head);
  const steps = el('ol', { class: 'gl-steps', 'aria-label': 'Pasos' }, head);
  const STEP_TXT = { plan: 'Plano', '3d': 'Vista 3D', compare: 'Antes y después' };
  for (const k of G.STEPS) el('li', { 'data-step': k }, steps, STEP_TXT[k]);
  // Inicio guiado: identifica proyecto y revisiones y deja elegir cómo empezar (botones o cámara).
  const intro = el('section', { class: 'gl-intro', id: 'glIntro' }, dlg);
  const stage = el('div', { class: 'gl-stage', id: 'glStage' }, dlg);
  const kind = el('p', { class: 'gl-kind', id: 'glKind' }, dlg);
  const calls = el('ul', { class: 'gl-calls', id: 'glCalls' }, dlg);
  const bar = el('div', { class: 'gl-bar' }, dlg);
  const prevB = el('button', { type: 'button', class: 'btn', id: 'glPrev' }, bar, '← Anterior');
  const nextB = el('button', { type: 'button', class: 'btn primary', id: 'glNext' }, bar, 'Siguiente →');
  const sideB = el('button', { type: 'button', class: 'btn', id: 'glSide', 'aria-pressed': 'false' }, bar, 'Ver después');
  const camB = el('button', { type: 'button', class: 'btn', id: 'glCam' }, bar, 'Activar cámara (opcional)');
  const exitB = el('button', { type: 'button', class: 'btn', id: 'glExit' }, bar, 'Salir');
  const hud = el('div', { class: 'gl-hud', role: 'status', 'aria-live': 'polite' }, dlg);
  const dot = el('span', { class: 'gl-dot', 'data-cam': 'off' }, hud), camText = el('span', { id: 'glCamText' }, hud, 'Cámara apagada · usa los botones o el teclado');
  const teach = el('p', { class: 'gl-teach', id: 'glTeach', 'aria-live': 'polite' }, dlg);
  const help = el('p', { class: 'gl-help', id: 'glHelp' }, dlg, 'Teclado: → siguiente · ← anterior · A/D antes/después · Esc salir.');
  const ack = el('p', { class: 'gl-ack', id: 'glAck', role: 'status', 'aria-live': 'assertive', hidden: '' }, dlg);
  const STATE_TXT = { OPEN: 'mano abierta detectada', FIST: 'puño detectado', HOLDING: 'mano detectada, sin gesto' };
  let ackT = 0; const confirmGesture = t => { ack.textContent = '✓ Gesto detectado: ' + t; ack.hidden = false; clearTimeout(ackT); ackT = setTimeout(() => { ack.hidden = true; }, 1800); note('ack', { t }); };
  // Cada gesto se enseña en el paso en que sirve.
  const TEACH = { plan: 'Gesto para seguir: mano abierta, palma a la cámara, quieta 1 segundo → Siguiente (vista 3D).', '3d': 'Gesto para seguir: mano abierta quieta 1 segundo → Siguiente (antes y después).', compare: 'Gesto para comparar: puño cerrado y deslizar rápido a un lado → antes / después. Retirar la mano no cambia nada.' };;
  const video = el('video', { playsinline: '', muted: '', hidden: '' }, dlg);

  function setSide(side) { if (P.step !== 'compare') return; const s = side || (P.side === 'before' ? 'after' : 'before'); if (s === 'after' ? P.toggle('right') : P.toggle('left')) render(); }
  let showIntro = false, origin = null, entry0 = null;
  function render() {
    title.textContent = pair ? `Presentar: ${nm2(pair.before.name)}` : 'Presentar con gestos';
    for (const li of steps.children) li.toggleAttribute('data-on', li.dataset.step === P.step);
    prevB.disabled = P.step === 'plan'; nextB.hidden = P.step === 'compare'; sideB.hidden = P.step !== 'compare'; sideB.classList.toggle('primary', P.step === 'compare');
    exitB.textContent = origin === 'P1' ? 'Volver a P1' : 'Salir';
    sideB.textContent = P.side === 'before' ? 'Ver después' : 'Ver antes'; sideB.setAttribute('aria-pressed', String(P.side === 'after'));
    stage.replaceChildren(); calls.replaceChildren(); dlg.dataset.step = P.step; dlg.dataset.side = P.side;
    dlg.toggleAttribute('data-intro', showIntro); renderIntro();
    teach.textContent = stream ? TEACH[P.step] : 'Cámara apagada: avanza con los botones. Si activas la cámara, aquí verás el gesto de este paso.';
    if (showIntro) { kind.textContent = ''; return; }
    if (!pair) { kind.textContent = 'Hace falta una variante guardada con algún cambio (Entregar → P10 «Explicar el cambio» → Crear variante).'; return; }
    const rn = room ? nm2(room.name) : null;
    if (P.step === 'plan') {
      const w = el('div', { class: 'gl-plan gl-unfold' }, stage); w.innerHTML = R.planSvg(cmp, 'before', pair.before.project, { title: '' });
      if (room) mark(w, room.id);
      kind.textContent = `Imagen del plano guardado · revisión ${revLabel('before')}${rn ? ' · estancia resaltada: ' + rn : ''}`;
    } else if (P.step === '3d') {
      kind.textContent = `Visor 3D interactivo de la misma revisión ${revLabel('before')}${rn ? ' · encuadre: ' + rn : ''}. Puedes girar con el ratón o el dedo.`;
    } else {
      const w = el('div', { class: 'gl-compare' }, stage);
      for (const side of ['before', 'after']) { const f = el('figure', { class: 'gl-rev', 'data-side': side }, w); const h = el('div', {}, f); h.innerHTML = R.planSvg(cmp, side, pair[side].project, { title: '' }); el('figcaption', {}, f, (side === 'before' ? 'Antes · ' : 'Después · ') + revLabel(side)); }
      kind.textContent = `Imagen del plano de dos revisiones guardadas · mismo encuadre y misma escala · mostrando: ${P.side === 'before' ? 'ANTES' : 'DESPUÉS'}`;
      const m = cmp.metrics, src = 'RUBIK · comparación de revisiones guardadas', st = 'guardado en este navegador';
      const call = (label, b, a, unit) => { const li = el('li', {}, calls); el('strong', {}, li, label + ': '); el('span', { 'data-value': '' }, li, `${fmt(b)} → ${fmt(a)}${unit ? ' ' + unit : ''}`); el('small', {}, li, ` · fuente: ${src} · revisiones ${revLabel('before')} → ${revLabel('after')} · estado: ${st}`); };
      call('Superficie útil', m.before.netAreaM2, m.after.netAreaM2, 'm²');
      call('Piezas de mobiliario', m.before.objects, m.after.objects, 'ud.');
      if (m.delta.walls) call('Muros', m.before.walls, m.after.walls, 'ud.');
      const ch = el('li', {}, calls); el('strong', {}, ch, 'Cambios detectados: '); el('span', {}, ch, `${cmp.counts.total} (${changeList()})`);
    }
  }
  // Resumen de cambios con nombres VISIBLES (nm): nunca el nombre guardado en bruto (puede estar en chino).
  const KIND = { object: 'pieza de mobiliario', room: 'estancia', wall: 'muro', opening: 'hueco', material: 'material' };
  const CHG = { added: 'añadida', removed: 'quitada', modified: 'modificada' };
  function changeList() {
    const proj = side => pair[side].project, find = (c) => { for (const side of ['after', 'before']) { const p = proj(side), arr = c.entity === 'object' ? p.objects : c.entity === 'room' ? p.rooms : c.entity === 'wall' ? p.walls : c.entity === 'opening' ? p.openings : []; const e = (arr || []).find(x => x.id === c.entityId); if (e) return e; } return null; };
    const name = c => { const e = find(c); const n = e && e.name ? nm2(e.name) : ''; return n && !/[\u3400-\u9fff]/.test(n) ? `«${n}»` : ''; };
    return cmp.changes.slice(0, 3).map(c => `${KIND[c.entity] || c.entity} ${name(c)} ${CHG[c.change] || c.change}`.replace(/\s+/g, ' ').trim()).join(' · ') + (cmp.changes.length > 3 ? ' …' : '');
  }
  function renderIntro() {
    intro.replaceChildren(); if (!showIntro) return;
    if (!pair) {
      el('p', {}, intro, `Proyecto: «${nm2(app.project?.name || 'sin nombre')}». Para comparar hace falta una variante guardada con algún cambio.`);
      const go = el('button', { type: 'button', class: 'btn primary', id: 'glToP10' }, intro, 'Ir a P10 · crear la variante');
      el('p', { class: 'gl-help' }, intro, 'Crea la variante, cambia algo y espera «✓ Guardado». Después vuelve a Entregar → P1 Presentación 3D → «Presentar con gestos».');
      go.onclick = () => { dlg.close(); const r = document.querySelector('#professionalWorkspace [data-route="story-layers"]'); if (r) r.click(); else window.FloorPlanProfessionalUI?.open?.('deliver'); note('to-p10'); };
      return;
    }
    el('p', { class: 'gl-intro-proj' }, intro, `Proyecto: «${nm2(pair.before.name)}»`);
    const ul = el('ul', { class: 'gl-intro-revs' }, intro);
    el('li', {}, ul, `Antes · ${revLabel('before')}`); el('li', {}, ul, `Después · ${revLabel('after')} · ${cmp.counts.total} cambio${cmp.counts.total === 1 ? '' : 's'} guardado${cmp.counts.total === 1 ? '' : 's'}`);
    el('p', {}, intro, 'Recorrido: 1 · plano → 2 · vista 3D de esa revisión → 3 · antes y después. Puedes cambiar de botones a cámara en cualquier momento sin perder el punto.');
    const row = el('div', { class: 'gl-bar' }, intro);
    const b1 = el('button', { type: 'button', class: 'btn primary', id: 'glStartButtons' }, row, 'Empezar con botones');
    const b2 = el('button', { type: 'button', class: 'btn', id: 'glStartCam' }, row, 'Activar cámara');
    el('p', { class: 'gl-help' }, intro, 'La cámara es opcional: la imagen se procesa en este equipo y no se graba ni se guarda.');
    b1.onclick = () => begin('buttons'); b2.onclick = () => { begin('camera'); startCam(); };
  }
  function begin(how) { showIntro = false; P.go('plan'); note('begin', { how }); render(); nextB.focus(); }
  function mark(w, id) { const n = w.querySelector(`[data-room-id="${id}"], [data-id="${id}"]`); if (n) n.classList.add('gl-mark'); }
  async function show3d(on) {
    try { if (on) { if (app.entryId !== pair.before.id) app.openEntry(pair.before.id); await setView('3d'); dlg.classList.add('gl-see-through');
      const p = window.FloorPlanProjectViews?.plan?.(); const stop = p?.stops?.find(s => s.roomId === room?.id) || p?.stops?.[0]; if (stop) await View3D.presentationGo(stop, true); }
      else { dlg.classList.remove('gl-see-through'); if (app.viewMode === '3d') await setView('2d'); } }
    catch (e) { note('3d-error', { message: e.message }); kind.textContent = 'La vista 3D no está disponible en este equipo: el plano sigue disponible.'; }
  }
  async function go(fn, source) { const before = P.step; fn(); note('step', { from: before, to: P.step, source }); render(); if (before !== P.step) { if (P.step === '3d') await show3d(true); else if (before === '3d') await show3d(false); render(); } }
  const next = s => go(() => P.next(), s), prev = s => go(() => P.prev(), s);
  prevB.onclick = () => prev('button'); nextB.onclick = () => next('button'); sideB.onclick = () => { setSide(); note('side', { side: P.side, source: 'button' }); };
  document.addEventListener('keydown', e => { if (!dlg.open || e.target.closest?.('input,textarea')) return; if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next('keyboard'); } else if (e.key === 'ArrowLeft') { e.preventDefault(); prev('keyboard'); } else if (/^[ad]$/i.test(e.key)) { setSide(e.key.toLowerCase() === 'a' ? 'before' : 'after'); note('side', { side: P.side, source: 'keyboard' }); } });

  // ── Webcam (opcional, explícita) ──
  let stream = null, hands = null, token = 0, running = false;
  const camState = (s, t) => { dot.dataset.cam = s; camText.textContent = t; camB.textContent = s === 'on' || s === 'lost' ? 'Apagar cámara' : 'Activar cámara (opcional)'; note('camera', { state: s }); if (!showIntro) teach.textContent = (s === 'on' || s === 'lost') ? TEACH[P.step] : s === 'denied' ? 'Sin cámara: sigue con los botones o el teclado, desde este mismo punto.' : 'Cámara apagada: avanza con los botones. Si activas la cámara, aquí verás el gesto de este paso.'; };
  function onGesture(lm, t) {
    const r = det.frame(lm, t);
    for (const e of r.events) { if (e.type === 'next') { if (showIntro) begin('gesture'); else next('gesture'); confirmGesture('mano abierta → siguiente'); } else if (e.type === 'swipe') { setSide(e.dir === 'right' ? 'after' : 'before'); confirmGesture('deslizar → ' + (P.side === 'after' ? 'después' : 'antes')); note('side', { side: P.side, source: 'gesture' }); }
      else if (e.type === 'lost') camState('lost', 'Mano perdida · gestos en pausa, no se ha cambiado nada; vuelve a mostrar la mano o sigue con los botones'); else if (e.type === 'found') camState('on', 'Cámara activa · ' + (STATE_TXT[r.state] || 'buscando la mano')); }
    if (stream && !r.events.length && dot.dataset.cam === 'on') camText.textContent = 'Cámara activa · ' + (STATE_TXT[r.state] || 'buscando la mano');
  }
  async function startCam() {
    const my = ++token; camB.disabled = true; camState('starting', 'Pidiendo permiso de cámara…');
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } });
      if (my !== token) { s.getTracks().forEach(t => t.stop()); return; }
      stream = s; video.srcObject = s; await video.play().catch(() => {});
      if (!window.Hands && !window.__glNoModel) await new Promise((ok, ko) => { const sc = el('script', { src: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/hands.js', crossorigin: 'anonymous' }, document.head); sc.onload = ok; sc.onerror = () => ko(Error('No se pudo cargar el modelo de manos.')); });
      if (window.Hands) { hands = new window.Hands({ locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${f}` }); hands.setOptions({ maxNumHands: 1, modelComplexity: 0, minDetectionConfidence: 0.6, minTrackingConfidence: 0.5 }); hands.onResults(res => onGesture(res.multiHandLandmarks?.[0] || null, performance.now())); }
      camState('on', 'Cámara activa · procesamiento en este equipo; no se graba ni se guarda imagen'); running = true; loop(my);
    } catch (e) { stopCam(); const denied = /NotAllowed|Permission|denied/i.test(e.name + e.message); camState('denied', denied ? 'Permiso de cámara denegado · sigue con los botones o el teclado' : 'No se pudo activar la cámara (' + e.message + ') · sigue con los botones'); note('camera-error', { name: e.name }); }
    finally { camB.disabled = false; }
  }
  async function loop(my) { if (!running || my !== token) return; if (hands && video.readyState >= 2) { try { await hands.send({ image: video }); } catch { } } requestAnimationFrame(() => loop(my)); }
  function stopCam() { token++; running = false; if (stream) { stream.getTracks().forEach(t => { try { t.stop(); } catch { } }); stream = null; } video.srcObject = null; det.reset(); if (dot.dataset.cam !== 'denied') camState('off', 'Cámara apagada · usa los botones o el teclado'); }
  camB.onclick = () => stream || dot.dataset.cam === 'starting' ? stopCam() : startCam();
  exitB.onclick = () => dlg.close();
  dlg.addEventListener('close', async () => { stopCam(); if (P.step === '3d') await show3d(false); document.body.classList.remove('gl-active');
    try { if (entry0 && app.entryId !== entry0) app.openEntry(entry0); } catch { }
    note('exit', { origin }); if (origin === 'P1') window.dispatchEvent(new CustomEvent('rubik:gesture-lab-exit', { detail: { origin } })); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && stream) stopCam(); });

  function open(opts) { origin = opts?.origin || 'launcher'; entry0 = app.entryId; load(); P.go('plan'); showIntro = true; document.body.classList.add('gl-active');
    camState('off', 'Cámara apagada · usa los botones o el teclado'); render(); dlg.showModal(); (intro.querySelector('button') || nextB).focus(); note('open', { origin, pair: pair ? [pair.before.id, pair.after.id] : null }); }
  // Acceso guiado (solo con ?gesture-lab=1): Entregar → P1 Presentación 3D → «Presentar con gestos». La ficha muestra las
  // acciones de su tarjeta, así que basta con añadir el botón a la tarjeta P1 cuando Entregar se pinta.
  function injectP1() { const card = document.querySelector('#professionalWorkspace [data-entrega-code="P1"]'); if (!card || card.querySelector('#glFromP1')) return;
    const host = card.querySelector('button:not(.perla-card-selector)')?.parentElement || card.querySelector('.body') || card;
    const b = el('button', { type: 'button', class: 'btn', id: 'glFromP1', 'data-route': 'gesture-lab' }, null, 'Presentar con gestos · laboratorio'); host.append(b); b.onclick = () => open({ origin: 'P1' }); }
  new MutationObserver(() => injectP1()).observe(document.body, { childList: true, subtree: true }); injectP1();
  // Lanzador del laboratorio (solo con ?gesture-lab=1). Integración prevista: Entregar → Presentación (ver README del laboratorio).
  const launch = el('button', { type: 'button', class: 'btn gl-launch', id: 'gestureLabOpen' }, document.body, 'Presentar con gestos · laboratorio'); launch.onclick = () => open({ origin: 'launcher' });
  // Gancho de ensayo: alimenta fotogramas SINTÉTICOS (rotulado; no simula una cámara real).
  window.RubikGestureLab = { open, begin, get intro() { return showIntro; }, get origin() { return origin; }, feed: (lm, t) => onGesture(lm, t), get step() { return P.step; }, get side() { return P.side; }, get camera() { return { state: dot.dataset.cam, tracks: stream ? stream.getTracks().map(t => t.readyState) : [] }; }, get log() { return log.slice(); }, synthetic: G.syntheticHand };
})();
