/* RUBIK SOTA · Gesture Labs §6 · «Presentación con gestos» (EN ENSAYO; candidata para revisión, no publicada).
   Solo se carga con ?gesture-lab=1 (index.html); sin ese parámetro RUBIK no cambia.
   Recorrido (decisión del propietario 27/11): el cliente ve el plano ENROLLADO de la vivienda → lo DESPLIEGA con un gesto o un
   botón y lo lee (estancia resaltada) → con otro gesto intencional pasa al 3D de ESA MISMA revisión, encuadrado en la estancia
   que acaba de ver en planta (con la planta en miniatura marcándola). Funciona con UNA revisión guardada. «Antes y después» es
   opcional: se pide al elegirlo y entonces necesita una variante guardada con cambios.
   Controles equivalentes: botones visibles (ratón y táctil), teclado (→/Espacio = siguiente, ← = anterior, A/D = antes/después,
   Esc = salir) y, solo si la persona lo activa, la cámara (mano abierta quieta 1 s = siguiente; puño y deslizar = antes/después).
   Perder la mano pausa los gestos sin disparar nada; el punto se conserva y los botones siguen. Al salir se apaga la cámara.
   Accesos: Home («Módulos para tu trabajo»), Entregar (ficha propia P11 y acceso contextual en P1) y el lanzador del laboratorio.
   Piezas adaptadas (autorizadas 27/11): Director de Orquesta @ dcf4b7ac (gesto y ciclo de cámara; despliegue de imagen) y
   map-gesture-controls @ 6939d43a (La Batuta: tutorial corto, indicador de cámara, modo sin cámara). Sin copiar su interfaz.
   Nada se escribe en el proyecto; no se graba ni guarda imagen. MediaPipe Hands (CDN) solo se descarga al activar la cámara. */
(function boot(tries) {
  'use strict';
  tries = tries || 0;
  const app = window.FloorPlanApp, G = window.RubikGestureCore, R = window.FloorPlanRevisionCompare;
  if (!app?.storyTargets || !G || !R) { if (tries < 200) setTimeout(() => boot(tries + 1), 100); return; }
  const nm2 = n => typeof nm === 'function' ? nm(n) : n;
  const CJK = /[㐀-鿿]/;
  const el = (tag, attrs, parent, text) => { const n = document.createElement(tag); for (const [k, v] of Object.entries(attrs || {})) n.setAttribute(k, v); if (text !== undefined) n.textContent = text; parent?.append(n); return n; };
  const fmt = v => typeof v === 'number' ? v.toLocaleString('es-ES', { maximumFractionDigits: 2 }) : String(v);
  const when = at => at ? new Date(at).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }) : null;
  const log = []; const note = (type, data = {}) => { log.push({ t: Math.round(performance.now()), type, ...data }); if (log.length > 300) log.shift(); };

  // ── Datos: la revisión ACTIVA guardada (una basta) y, solo si se pide comparar, su pareja original ↔ variante ──
  let rev = null, single = null, pair = null, cmp = null, room = null;
  function load() {
    const info = app.entryInfo?.() || {}; const p = app.project;
    rev = { id: app.entryId, name: nm2(info.name || p?.name || 'Proyecto'), at: info.updatedAt || p?.updatedAt || null, project: structuredClone(p) };
    single = R.compare(rev.project, rev.project, { relation: 'library-variant', beforeLabel: 'Revisión', afterLabel: 'Revisión' });
    const rooms = (rev.project.rooms || []).filter(r => r.counted !== false);
    room = rooms.find(r => /Salón|Living|客厅/i.test(nm2(r.name))) || rooms.sort((a, b) => (b.areaMm2 || 0) - (a.areaMm2 || 0))[0] || null;
    pair = null; cmp = null;
    const t = app.storyTargets?.() || { pairs: [] };
    pair = t.pairs.find(x => { try { return !R.compare(x.before.project, x.after.project, { relation: 'library-variant' }).identical; } catch { return false; } }) || null;
    if (pair) cmp = R.compare(pair.before.project, pair.after.project, { relation: 'library-variant', beforeLabel: 'Antes', afterLabel: 'Después' });
  }
  const roomName = () => room ? nm2(room.name) : null;
  const revLabel = () => `«${rev.name}»${rev.at ? ' · guardada ' + when(rev.at) : ''}`;
  const pairLabel = side => { const s = pair[side]; const at = cmp[side].updatedAt; return `«${nm2(s.name)}»${at ? ' · guardada ' + when(at) : ''}`; };

  // ── Interfaz ──
  const P = G.presentation(), det = G.create();
  const dlg = el('dialog', { id: 'gestureLab', class: 'gl', 'aria-labelledby': 'glTitle' }, document.body);
  const head = el('header', { class: 'gl-head' }, dlg);
  el('p', { class: 'gl-badge' }, head, 'Presentación con gestos · en ensayo (candidata para revisión; no publicada)');
  const title = el('h2', { id: 'glTitle' }, head);
  const steps = el('ol', { class: 'gl-steps', 'aria-label': 'Pasos' }, head);
  const STEP_TXT = { rolled: 'Plano enrollado', plan: 'Plano', '3d': 'Vista 3D', compare: 'Antes y después' };
  const intro = el('section', { class: 'gl-intro', id: 'glIntro' }, dlg);
  const stage = el('div', { class: 'gl-stage', id: 'glStage' }, dlg);
  const kind = el('p', { class: 'gl-kind', id: 'glKind' }, dlg);
  const calls = el('ul', { class: 'gl-calls', id: 'glCalls' }, dlg);
  const bar = el('div', { class: 'gl-bar' }, dlg);
  const prevB = el('button', { type: 'button', class: 'btn', id: 'glPrev' }, bar, '← Anterior');
  const nextB = el('button', { type: 'button', class: 'btn primary', id: 'glNext' }, bar, 'Siguiente →');
  const sideB = el('button', { type: 'button', class: 'btn', id: 'glSide', 'aria-pressed': 'false' }, bar, 'Ver después');
  const cmpB = el('button', { type: 'button', class: 'btn', id: 'glCompare' }, bar, 'Antes y después');
  const camB = el('button', { type: 'button', class: 'btn', id: 'glCam' }, bar, 'Activar cámara');
  const exitB = el('button', { type: 'button', class: 'btn', id: 'glExit' }, bar, 'Salir');
  const need = el('p', { class: 'gl-need', id: 'glNeed', hidden: '' }, dlg);
  const hud = el('div', { class: 'gl-hud', role: 'status', 'aria-live': 'polite' }, dlg);
  const dot = el('span', { class: 'gl-dot', 'data-cam': 'off' }, hud), camText = el('span', { id: 'glCamText' }, hud, 'Cámara apagada · usa los botones o el teclado');
  const teach = el('p', { class: 'gl-teach', id: 'glTeach', 'aria-live': 'polite' }, dlg);
  const ack = el('p', { class: 'gl-ack', id: 'glAck', role: 'status', 'aria-live': 'assertive', hidden: '' }, dlg);
  el('p', { class: 'gl-help', id: 'glHelp' }, dlg, 'Teclado: → siguiente · ← anterior · A/D antes/después · Esc salir.');
  const video = el('video', { playsinline: '', muted: '', hidden: '' }, dlg);
  const STATE_TXT = { OPEN: 'mano abierta detectada', FIST: 'puño detectado', HOLDING: 'mano detectada, sin gesto' };
  let ackT = 0; const confirmGesture = t => { ack.textContent = '✓ Gesto detectado: ' + t; ack.hidden = false; clearTimeout(ackT); ackT = setTimeout(() => { ack.hidden = true; }, 1800); note('ack', { t }); };
  // Cada gesto se enseña en el paso en que sirve.
  const TEACH = { rolled: 'Gesto para desplegar: mano abierta, palma a la cámara, quieta 1 segundo.', plan: 'Gesto para ver la vivienda en 3D: mano abierta quieta 1 segundo.', '3d': 'Puedes girar el 3D con el ratón o el dedo. Gesto: mano abierta quieta 1 segundo para pasar a antes y después (si lo has elegido).', compare: 'Gesto para comparar: puño cerrado y deslizar rápido a un lado → antes / después. Retirar la mano no cambia nada.' };
  const NEXT_TXT = { rolled: 'Desplegar el plano', plan: 'Ver en 3D →', '3d': 'Siguiente →' };

  let showIntro = false, origin = null, entry0 = null;
  function planSvg(target, mini) { const w = el('div', { class: mini ? 'gl-mini' : 'gl-plan' }, target); w.innerHTML = R.planSvg(single, 'before', rev.project, { title: '' }); if (room) mark(w, room.id); return w; }
  function render() {
    title.textContent = rev ? `Presentar: ${rev.name}` : 'Presentación con gestos';
    steps.replaceChildren(); for (const k of G.STEPS) { if (k === 'compare' && !P.compare) continue; const li = el('li', { 'data-step': k }, steps, STEP_TXT[k]); li.toggleAttribute('data-on', k === P.step); }
    const last = P.step === (P.compare ? 'compare' : '3d');
    prevB.disabled = P.step === 'rolled'; nextB.hidden = last; nextB.textContent = NEXT_TXT[P.step] || 'Siguiente →';
    sideB.hidden = P.step !== 'compare'; sideB.classList.toggle('primary', P.step === 'compare');
    sideB.textContent = P.side === 'before' ? 'Ver después' : 'Ver antes'; sideB.setAttribute('aria-pressed', String(P.side === 'after'));
    cmpB.hidden = P.step !== '3d' || P.compare; need.hidden = true;
    exitB.textContent = origin === 'P1' ? 'Volver a P1' : origin === 'P11' ? 'Volver a Entregar' : origin === 'home' ? 'Volver al inicio' : 'Salir';
    stage.replaceChildren(); calls.replaceChildren(); dlg.dataset.step = P.step; dlg.dataset.side = P.side;
    dlg.toggleAttribute('data-intro', showIntro); renderIntro();
    teach.textContent = stream ? TEACH[P.step] : 'Cámara apagada: avanza con los botones. Si activas la cámara, aquí verás el gesto de este paso.';
    if (showIntro || !rev) { kind.textContent = ''; return; }
    const rn = roomName();
    if (P.step === 'rolled') {
      const roll = el('div', { class: 'gl-roll', id: 'glRoll', 'data-state': 'rolled' }, stage); planSvg(roll); el('span', { class: 'gl-roll-edge', 'aria-hidden': 'true' }, roll);
      kind.textContent = `Plano enrollado de la vivienda · revisión ${revLabel()}. Despliégalo para leerlo.`;
    } else if (P.step === 'plan') {
      const roll = el('div', { class: 'gl-roll', id: 'glRoll', 'data-state': 'unrolling' }, stage); planSvg(roll);
      requestAnimationFrame(() => requestAnimationFrame(() => { roll.dataset.state = 'open'; }));
      kind.textContent = `Plano desplegado · revisión ${revLabel()}${rn ? ' · estancia resaltada: ' + rn : ''}. En el 3D la verás desde dentro.`;
    } else if (P.step === '3d') {
      const inset = el('figure', { class: 'gl-inset', id: 'glInset' }, stage); planSvg(inset, true); el('figcaption', {}, inset, rn ? `${rn} · la estancia que viste en planta` : 'Planta de la vivienda');
      kind.textContent = `Visor 3D interactivo de la misma revisión ${revLabel()}${rn ? ' · encuadre: ' + rn : ''}. Puedes girar con el ratón o el dedo.`;
    } else if (pair) {
      const w = el('div', { class: 'gl-compare' }, stage);
      for (const side of ['before', 'after']) { const f = el('figure', { class: 'gl-rev', 'data-side': side }, w); const h = el('div', {}, f); h.innerHTML = R.planSvg(cmp, side, pair[side].project, { title: '' }); el('figcaption', {}, f, (side === 'before' ? 'Antes · ' : 'Después · ') + pairLabel(side)); }
      kind.textContent = `Imagen del plano de dos revisiones guardadas · mismo encuadre y misma escala · mostrando: ${P.side === 'before' ? 'ANTES' : 'DESPUÉS'}`;
      const m = cmp.metrics, src = 'RUBIK · comparación de revisiones guardadas', st = 'guardado en este navegador';
      const call = (label, b, a, unit) => { const li = el('li', {}, calls); el('strong', {}, li, label + ': '); el('span', { 'data-value': '' }, li, `${fmt(b)} → ${fmt(a)}${unit ? ' ' + unit : ''}`); el('small', {}, li, ` · fuente: ${src} · revisiones ${pairLabel('before')} → ${pairLabel('after')} · estado: ${st}`); };
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
    const find = c => { for (const side of ['after', 'before']) { const p = pair[side].project, arr = c.entity === 'object' ? p.objects : c.entity === 'room' ? p.rooms : c.entity === 'wall' ? p.walls : c.entity === 'opening' ? p.openings : []; const e = (arr || []).find(x => x.id === c.entityId); if (e) return e; } return null; };
    const name = c => { const e = find(c); const n = e && e.name ? nm2(e.name) : ''; return n && !CJK.test(n) ? `«${n}»` : ''; };
    return cmp.changes.slice(0, 3).map(c => `${KIND[c.entity] || c.entity} ${name(c)} ${CHG[c.change] || c.change}`.replace(/\s+/g, ' ').trim()).join(' · ') + (cmp.changes.length > 3 ? ' …' : '');
  }
  function renderIntro() {
    intro.replaceChildren(); if (!showIntro || !rev) return;
    el('p', { class: 'gl-intro-proj' }, intro, `Proyecto: «${rev.name}»`);
    const ul = el('ul', { class: 'gl-intro-revs' }, intro);
    el('li', {}, ul, `Revisión que verá tu cliente: ${revLabel()}`);
    el('li', {}, ul, pair ? `«Antes y después» disponible: ${pairLabel('before')} → ${pairLabel('after')} (${cmp.counts.total} cambio${cmp.counts.total === 1 ? '' : 's'})` : '«Antes y después»: opcional; necesita una variante guardada con cambios (se pide al elegirlo).');
    el('p', {}, intro, 'Tu cliente verá: 1 · el plano enrollado que se despliega → 2 · el plano legible con la estancia resaltada → 3 · el 3D de esa misma vivienda, en esa estancia.');
    const modes = el('ul', { class: 'gl-intro-modes' }, intro);
    el('li', {}, modes, 'Con botones: sin requisitos.');
    el('li', {}, modes, 'Con cámara (opcional): permiso de cámara, HTTPS, buena luz y la mano a 40–80 cm. La imagen se procesa en este equipo y no se graba ni se guarda.');
    const row = el('div', { class: 'gl-bar' }, intro);
    const b1 = el('button', { type: 'button', class: 'btn primary', id: 'glStartButtons' }, row, 'Empezar con botones');
    const b2 = el('button', { type: 'button', class: 'btn', id: 'glStartCam' }, row, 'Activar cámara');
    b1.onclick = () => begin('buttons'); b2.onclick = () => { begin('camera'); startCam(); };
  }
  function begin(how) { showIntro = false; P.go('rolled'); note('begin', { how }); render(); (nextB.hidden ? exitB : nextB).focus(); }
  function mark(w, id) { const n = w.querySelector(`[data-room-id="${id}"], [data-id="${id}"]`); if (n) n.classList.add('gl-mark'); }
  async function show3d(on) {
    try { if (on) { if (app.entryId !== rev.id) app.openEntry(rev.id); await setView('3d'); dlg.classList.add('gl-see-through');
      window.RubikNav3D?.setOpen?.(false); // el panel de navegación no tapa la vivienda durante la presentación
      // La cámara vuela a la MISMA estancia resaltada en planta (encuadre del visor; reintenta si estaba animando).
      for (let k = 0; k < 20 && room; k++) { const r = window.View3D?.focusRoom?.(room.id); if (r?.ok) { note('focus-room', { room: room.id, how: r.how }); break; } if (r?.reason !== 'busy') break; await new Promise(t => setTimeout(t, 150)); } }
      else { dlg.classList.remove('gl-see-through'); if (app.viewMode === '3d') await setView('2d'); } }
    catch (e) { note('3d-error', { message: e.message }); kind.textContent = 'La vista 3D no está disponible en este equipo: el plano sigue disponible.'; }
  }
  async function go(fn, source) { const before = P.step; fn(); note('step', { from: before, to: P.step, source }); render(); if (before !== P.step) { if (P.step === '3d') await show3d(true); else if (before === '3d') await show3d(false); render(); } }
  const next = s => go(() => P.next(), s), prev = s => go(() => P.prev(), s);
  // «Antes y después» solo cuando se elige; sin variante se explica qué falta y cómo crearla (P10), con vuelta clara.
  function chooseCompare(source) {
    if (!pair) { need.hidden = false; need.replaceChildren(); el('span', {}, need, 'Para comparar hace falta una variante guardada con algún cambio. ');
      const b = el('button', { type: 'button', class: 'btn', id: 'glToP10' }, need, 'Ir a P10 · crear la variante');
      el('span', {}, need, ' Después vuelve a Entregar → «Presentación con gestos».'); b.onclick = () => { dlg.close(); const r = document.querySelector('#professionalWorkspace [data-route="story-layers"]'); if (r) r.click(); else window.FloorPlanProfessionalUI?.open?.('deliver'); note('to-p10'); };
      note('compare-needs-variant', { source }); return; }
    P.enableCompare(true); go(() => P.next(), source);
  }
  prevB.onclick = () => prev('button'); nextB.onclick = () => next('button'); cmpB.onclick = () => chooseCompare('button');
  const setSide = side => { if (P.step !== 'compare') return; const s = side || (P.side === 'before' ? 'after' : 'before'); if (s === 'after' ? P.toggle('right') : P.toggle('left')) render(); };
  sideB.onclick = () => { setSide(); note('side', { side: P.side, source: 'button' }); };
  document.addEventListener('keydown', e => { if (!dlg.open || showIntro || e.target.closest?.('input,textarea')) return; if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next('keyboard'); } else if (e.key === 'ArrowLeft') { e.preventDefault(); prev('keyboard'); } else if (/^[ad]$/i.test(e.key)) { setSide(e.key.toLowerCase() === 'a' ? 'before' : 'after'); note('side', { side: P.side, source: 'keyboard' }); } });

  // ── Cámara (opcional, explícita) ──
  let stream = null, hands = null, token = 0, running = false;
  const camState = (s, t) => { dot.dataset.cam = s; camText.textContent = t; camB.textContent = s === 'on' || s === 'lost' ? 'Apagar cámara' : 'Activar cámara'; note('camera', { state: s }); if (!showIntro) teach.textContent = (s === 'on' || s === 'lost') ? TEACH[P.step] : s === 'denied' ? 'Sin cámara: sigue con los botones o el teclado, desde este mismo punto.' : 'Cámara apagada: avanza con los botones. Si activas la cámara, aquí verás el gesto de este paso.'; };
  function onGesture(lm, t) {
    const r = det.frame(lm, t);
    for (const e of r.events) {
      if (e.type === 'next') { if (showIntro) begin('gesture'); else if (P.step === '3d' && !P.compare) { confirmGesture('mano abierta → (fin del recorrido; elige «Antes y después» para seguir)'); continue; } else next('gesture'); confirmGesture(P.step === 'plan' ? 'mano abierta → plano desplegado' : P.step === '3d' ? 'mano abierta → vista 3D' : 'mano abierta → siguiente'); }
      else if (e.type === 'swipe') { if (P.step !== 'compare') continue; setSide(e.dir === 'right' ? 'after' : 'before'); confirmGesture('deslizar → ' + (P.side === 'after' ? 'después' : 'antes')); note('side', { side: P.side, source: 'gesture' }); }
      else if (e.type === 'lost') camState('lost', 'Mano perdida · gestos en pausa, no se ha cambiado nada; vuelve a mostrar la mano o sigue con los botones');
      else if (e.type === 'found') camState('on', 'Cámara activa · ' + (STATE_TXT[r.state] || 'buscando la mano'));
    }
    if (stream && !r.events.length && dot.dataset.cam === 'on') camText.textContent = 'Cámara activa · ' + (STATE_TXT[r.state] || 'buscando la mano');
  }
  async function startCam() {
    const my = ++token; camB.disabled = true; camState('starting', 'Pidiendo permiso de cámara…');
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } });
      if (my !== token) { s.getTracks().forEach(t => t.stop()); return; }
      stream = s; video.srcObject = s; await video.play().catch(() => { });
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
  dlg.addEventListener('close', async () => {
    stopCam(); if (P.step === '3d') await show3d(false); document.body.classList.remove('gl-active');
    try { if (entry0 && app.entryId !== entry0) app.openEntry(entry0); } catch { }
    note('exit', { origin });
    if (origin === 'home') window.FloorPlanGuideUI?.openWelcome?.();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && stream) stopCam(); });

  function open(opts) {
    origin = opts?.origin || 'launcher'; entry0 = app.entryId; load(); P.enableCompare(false); P.go('rolled'); showIntro = true; document.body.classList.add('gl-active');
    camState('off', 'Cámara apagada · usa los botones o el teclado'); render(); dlg.showModal(); (intro.querySelector('button') || nextB).focus();
    note('open', { origin, revision: rev?.id, pair: pair ? [pair.before.id, pair.after.id] : null });
  }
  // Demo desde Home: abre la vivienda de ejemplo y la presentación sobre ella.
  async function demo() { const ex = document.getElementById('welcomeExample'); if (ex) { ex.click(); await new Promise(r => setTimeout(r, 900)); } open({ origin: 'home' }); }

  // ── Presencia en RUBIK (solo con ?gesture-lab=1) ──
  // Entregar · P1: acceso contextual a la misma experiencia.
  function injectP1() { const card = document.querySelector('#professionalWorkspace [data-entrega-code="P1"]'); if (!card || card.querySelector('#glFromP1')) return;
    const host = card.querySelector('button:not(.perla-card-selector)')?.parentElement || card.querySelector('.body') || card;
    const b = el('button', { type: 'button', class: 'btn', id: 'glFromP1', 'data-route': 'gesture-lab-p1' }, null, 'Presentar con gestos (en ensayo)'); host.append(b); b.onclick = () => open({ origin: 'P1' }); }
  // Home · «Módulos para tu trabajo»: ficha propia, con su estado, condiciones y una demo de la vivienda de ejemplo.
  function injectHome() { const ul = document.querySelector('#welcomeModules .welcome-modules-grid'); if (!ul || ul.querySelector('[data-service="gesture-presentation"]')) return;
    const li = el('li', { class: 'ai-service is-featured gl-home', 'data-service': 'gesture-presentation', 'data-state': 'pilot' }); ul.prepend(li);
    const meta = el('p', { class: 'ai-service-meta' }, li); el('span', { class: 'capability-state', 'data-state': 'pilot' }, meta, 'En ensayo · para revisión');
    el('h4', {}, li, 'Presentación con gestos');
    el('p', { class: 'ai-service-what' }, li, 'Tu cliente ve el plano enrollado, lo despliega con un gesto y pasa al 3D de la misma vivienda. Con botones o, si quiere, con la cámara.');
    const more = el('details', { class: 'ai-service-more' }, li); el('summary', {}, more, 'Qué no es y condiciones');
    el('p', { class: 'ai-service-not' }, more, 'No graba ni guarda imagen; la cámara es opcional y se apaga al salir.');
    el('p', { class: 'ai-service-limits' }, more, 'En ensayo: gestos validados con entrada sintética; falta la prueba con cámara física. Necesita HTTPS para la cámara.');
    const b = el('button', { type: 'button', class: 'btn ai-service-go', id: 'welcomeAI-gesture-presentation' }, li, 'Ver la demo con la vivienda de ejemplo'); b.onclick = () => demo(); }
  let q = false; new MutationObserver(() => { if (q) return; q = true; requestAnimationFrame(() => { q = false; injectP1(); injectHome(); }); }).observe(document.body, { childList: true, subtree: true });
  injectP1(); injectHome();
  // Lanzador del laboratorio (atajo de ensayo).
  const launch = el('button', { type: 'button', class: 'btn gl-launch', id: 'gestureLabOpen' }, document.body, 'Presentar con gestos · laboratorio'); launch.onclick = () => open({ origin: 'launcher' });
  // Gancho de ensayo: alimenta fotogramas SINTÉTICOS (rotulado; no simula una cámara real).
  window.RubikGestureLab = { open, begin, demo, chooseCompare, get intro() { return showIntro; }, get origin() { return origin; }, feed: (lm, t) => onGesture(lm, t), get step() { return P.step; }, get side() { return P.side; }, get compare() { return P.compare; }, get room() { return roomName(); }, get camera() { return { state: dot.dataset.cam, tracks: stream ? stream.getTracks().map(t => t.readyState) : [] }; }, get log() { return log.slice(); }, synthetic: G.syntheticHand };
  document.dispatchEvent(new CustomEvent('rubik:gesture-lab-ready'));
})();
