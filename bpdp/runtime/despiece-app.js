/* BP-DP PREMIUM · DESPIECE 3D · Architectural Exploded View Assembly (módulo ES).
 * Abrir → vivienda montada → seleccionar sistemas → separar → inspeccionar → ensamblar → pausar/retroceder/reagrupar →
 * vídeo cinematográfico → revisar y descargar. Exploración y película son el MISMO sistema (BpdpAssembly: estado A).
 */
import { exportMp4, videoModal, sheetModal, titleBlock, pngConDensidad } from './outputs.js';
import * as HERO from './hero-firma.js';
import * as REV from './revision.js';
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const E = () => window.RubikBpdpEvidence;
const SW = { foundation: '#a7a29a', floors: '#d8ccb9', slab: '#bdb8b0', structure: '#8f8a82', walls: '#ebe5da', envelope: '#e2d8c8', partitions: '#f4f2ee', openings: '#2f3338', ceilings: '#f3f0ea', fixtures: '#e5d4a8', 'roof-structure': '#c59b6b', roof: '#d9d4cb', 'roof-finish': '#9c4f3b', finishes: '#c8a57c', furniture: '#bfae95' };
const INTENTS = [['explore', 'Explorar'], ['film', 'Montaje cinematográfico']];

export function mountDespiece(shell, S, { onBack }) {
  const { pkg } = S, M = S.model, AS = S.assembly, synthetic = pkg.scenario === 'synthetic', P = pkg.project;
  // Nombre VISIBLE por el embudo de RUBIK (nunca en chino en ES/EN): RubikFinalCore.textoVisible vía HERO.nombreProyecto.
  const NOMBRE = HERO.nombreProyecto(pkg);
  const DUR = AS.DURATION;
  const st = { autoFrame: true, frameDirty: false, intent: 'explore', A: 1, target: 1, from: 1, start: 0, playing: false, rate: 1, dir: 1, selected: null, sys: null, panel: null, film: null, freeCam: false, style: 'archviz' };
  shell.app.dataset.theme = 'studio'; S.applyStyle('archviz');
  // Guion de 15 s (anexo 8) + fase de firma del HERO FINAL común (misma duración y mismo pintado que el resto de vídeos de RUBIK).
  const TOTAL = DUR + (HERO.available() ? HERO.FIRMA_S() : 0), reduced = () => !exporting && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  // El MP4 es un entregable para el cliente: siempre lleva la versión cinematográfica completa (órbita y aparición escalonada).
  let exporting = false;
  let FIRMA = HERO.firma(pkg, 'despiece', { synthetic }), heroAspect = 16 / 9; const titles = HERO.capa(shell.stage, () => shell.stage.getBoundingClientRect().bottom - shell.dock.getBoundingClientRect().top + 12, { app: shell.app, arriba: () => shell.top.getBoundingClientRect().bottom - shell.stage.getBoundingClientRect().top + 8 });
  const firmaAt = t => t <= DUR || !FIRMA ? 0 : HERO.epilogo(t - DUR, { reduced: reduced() }).firma;
  shell.top.innerHTML = `<div class="mark">DESPIECE 3D <small>${esc(NOMBRE)}</small></div><span class="badge ${synthetic ? 'syn' : 'real'}">${synthetic ? 'ESCENA SINTÉTICA' : 'PROYECTO RUBIK · DATOS REALES'}</span>
   <span class="spacer"></span><button type="button" class="btn" data-a="style" aria-pressed="false">Dibujo técnico</button><button type="button" class="btn" data-a="layers" aria-pressed="false">Capas</button><button type="button" class="btn" data-a="firma">Firma</button><button type="button" class="btn" data-a="video">Vídeo</button><button type="button" class="btn" data-a="sheet">Lámina</button><button type="button" class="btn" data-a="back" aria-label="Volver al paso anterior">Volver</button>`;
  shell.dock.innerHTML = `<div class="ctx" data-ctx></div><div class="seg" role="tablist" aria-label="Modo">${INTENTS.map(([k, l]) => `<button type="button" class="btn" role="tab" data-intent="${k}" aria-pressed="${k === st.intent}">${l}</button>`).join('')}</div>`;
  const ctx = shell.dock.querySelector('[data-ctx]');
  // Leyenda de sistemas (selección / foco) + ausencias declaradas.
  const legend = document.createElement('nav'); legend.className = 'legend'; legend.setAttribute('aria-label', 'Sistemas constructivos'); shell.stage.appendChild(legend);
  function renderLegend() {
    const moving = new Set(AS.movingAt(st.A).map(k => M.byKey.get(k)?.system));
    legend.innerHTML = M.systems.map(s => `<button type="button" class="it ${st.sys && st.sys !== s.id ? 'dim' : ''} ${moving.has(s.id) ? 'moving' : ''}" data-sys="${s.id}" aria-pressed="${st.sys === s.id}"><span class="sw" style="background:${SW[s.id]}"></span>${esc(s.label)} <small style="color:var(--muted)">${s.count || ''}${s.auxiliary ? `${s.count ? ' + ' : ''}${s.auxiliary} aux.` : ''}</small></button>`).join('')
      + `<p class="note">${synthetic ? 'Escena sintética: no describe ninguna vivienda real.' : `Este proyecto no modela: ${M.notModelled.map(x => x.label.toLowerCase()).join(', ')}.`}</p>`;
  }
  // ── estado A: separación interactiva (tiempo de pared, invertible en cualquier instante) ──
  const sm = x => { const u = Math.min(1, Math.max(0, x)); return u * u * u * (u * (u * 6 - 15) + 10); };
  function animateTo(target, ms = 2600) { st.from = st.A; st.target = target; st.start = performance.now(); st.ms = ms * Math.abs(target - st.A); st.playing = st.ms > 0; renderCtx(); }
  S.onFrame(now => {
    if (st.intent === 'explore' && st.autoFrame && (st.playing || st.frameDirty)) { st.frameDirty = false; frameExplore(); }
    if (st.intent === 'explore' && st.playing) { const k = st.ms ? Math.min(1, (now - st.start) / st.ms) : 1; S.setAssembly(st.from + (st.target - st.from) * k); st.A = S.state.A; if (k >= 1) { st.playing = false; renderCtx(); } syncSlider(); }
    if (st.film) tickFilm(now);
  });
  const syncSlider = () => { const r = ctx.querySelector('[data-sep]'); if (r) r.value = String(Math.round((1 - st.A) * 1000)); renderLegendThrottled(); };
  let lt = 0; const renderLegendThrottled = () => { const n = performance.now(); if (n - lt > 120) { lt = n; renderLegend(); } };
  // Encuadre de exploración: interpola entre la casa montada y la separada según A (se desactiva si el usuario orbita).
  let EXP = null;
  function frameExplore() { if (!EXP) { const box0 = new (S.bbox.constructor)(); for (const c of M.components) { const o = AS.offset(c.key, 0); box0.expandByPoint({ x: c.bounds.min[0] + o[0], y: c.bounds.min[1] + o[1], z: c.bounds.min[2] + o[2] }); box0.expandByPoint({ x: c.bounds.max[0] + o[0], y: c.bounds.max[1] + o[1], z: c.bounds.max[2] + o[2] }); }
      EXP = { a: S.poseFor('hero', { margin: 1.25 }), b: S.poseFor('hero', { box: box0, margin: 1.12 }) }; }
    S.applyPose(S.blendPose(EXP.a, EXP.b, 1 - st.A)); }
  S.controls.addEventListener('start', () => { st.autoFrame = false; });
  // ── película: guion de 15 s sobre el mismo sistema (A(t) + cámara RubikShotTimeline) ──
  function filmCamera() {
    // Cada clave del guion encuadra la caja REAL de las piezas en ese instante (A(t) del mismo sistema): nada sale de cuadro.
    const boxAt = A => { const bx = new (S.bbox.constructor)(); for (const c of M.components) { const o = AS.offset(c.key, A); bx.expandByPoint({ x: c.bounds.min[0] + o[0], y: c.bounds.min[1] + o[1], z: c.bounds.min[2] + o[2] }); bx.expandByPoint({ x: c.bounds.max[0] + o[0], y: c.bounds.max[1] + o[1], z: c.bounds.max[2] + o[2] }); } return bx; };
    const toKey = (p, t) => ({ t, position: p.target.clone().addScaledVector(p.dir, p.dist).toArray(), target: p.target.toArray(), fov: p.fov });
    const orbit = (p, ang) => ({ ...p, dir: p.dir.clone().applyAxisAngle({ x: 0, y: 1, z: 0 }, ang) });
    const at = (t, ang, margin) => toKey(orbit(S.poseFor('hero', { box: boxAt(AS.filmA(t)), margin, ui: false }), ang), t);
    return window.RubikShotTimeline.create([at(0, 0, 1.14), at(3, .04, 1.14), at(7, .09, 1.14), at(11, .13, 1.16), at(13, .15, 1.22), at(14, .16, 1.3), toKey(orbit(S.poseFor('hero', { margin: 1.3, ui: false }), .34), 15)], { arc: 0 });
  }
  let CAM = null;
  function filmApply(t, { camera = true } = {}) {
    CAM = CAM || filmCamera(); const A = AS.filmA(Math.min(t, DUR)); S.setAssembly(A); st.A = A;
    if (camera && !st.freeCam) { const p = CAM.poseAt(Math.min(t, CAM.duration)); const target = { x: p.target[0], y: p.target[1], z: p.target[2] };
      const pos = p.position, d = [pos[0] - target.x, pos[1] - target.y, pos[2] - target.z], dist = Math.hypot(...d);
      const pose = S.currentPose(); pose.kind = 'persp'; pose.dir = pose.dir.clone().set(d[0] / dist, d[1] / dist, d[2] / dist); pose.target = pose.target.clone().set(target.x, target.y, target.z); pose.dist = dist; pose.fov = p.fov; pose.up = pose.up.clone().set(0, 1, 0);
      // HERO FINAL: tras el guion, la vivienda montada se aparta a la derecha con una órbita lenta y aparece la firma.
      if (t > DUR && FIRMA) { const ep = HERO.epilogo(t - DUR, { reduced: reduced() }); S.applyPose(S.blendPose(pose, HERO.heroPose(pose, { orbita: ep.orbita, aspect: heroAspect }), ep.acercar)); }
      else S.applyPose(pose); }
    // Foco por intención: la fase resalta las piezas que se están montando (en la firma, ninguna).
    S.setHighlight(t > DUR ? [] : AS.movingAt(A));
  }
  function startFilm() { FIRMA = HERO.firma(pkg, 'despiece', { synthetic }); HERO.preparar(FIRMA); heroAspect = (S.canvas.clientWidth || 16) / (S.canvas.clientHeight || 9); st.film = { t: 0, playing: true, last: performance.now() }; st.freeCam = false; CAM = null; filmApply(0); renderCtx(); }
  function tickFilm(now) { const f = st.film; if (f.playing) { f.t += st.dir * st.rate * (now - f.last) / 1000; if (f.t >= TOTAL) { f.t = TOTAL; f.playing = false; } if (f.t <= 0) { f.t = 0; f.playing = false; } } f.last = now;
    // En pausa y sin cambios no se vuelve a componer nada (la escena queda quieta y no gasta GPU).
    const key = `${f.t}|${st.freeCam}|${st.rate}|${st.dir}`; if (f.playing || f.applied !== key) { f.applied = key; filmApply(f.t); const fp = firmaAt(f.t); titles.draw(FIRMA, fp); }
    shell.caption.textContent = firmaAt(f.t) > 0 ? '' : AS.phaseAt(Math.min(f.t, DUR - 1e-6)).label; const r = ctx.querySelector('[data-filmt]'); if (r) r.value = String(Math.round(f.t * 100));
    const pb = ctx.querySelector('[data-film="play"]'); if (pb) pb.textContent = f.playing ? 'Pausa' : 'Reproducir'; renderLegendThrottled(); }
  function stopFilm() { if (!st.film) return; st.film = null; shell.caption.textContent = ''; titles.draw(null, 0); S.setHighlight([]); }
  // El usuario puede orbitar durante la película: pasa a cámara libre sin perder el estado de montaje.
  S.controls.addEventListener('start', () => { if (st.film) { st.freeCam = true; renderCtx(); } });
  // ── barra contextual ──
  function renderCtx() {
    if (st.intent === 'film') { ctx.innerHTML = `<button type="button" class="btn" data-film="back5" aria-label="Retroceder un segundo">−1 s</button><button type="button" class="btn primary" data-film="play">${st.film?.playing ? 'Pausa' : 'Reproducir'}</button><button type="button" class="btn" data-film="fwd5" aria-label="Avanzar un segundo">+1 s</button>
      <button type="button" class="btn" data-film="reverse" aria-pressed="${st.dir < 0}">Invertir</button><button type="button" class="btn" data-film="rate" aria-label="Velocidad">${st.rate}×</button>
      <label>Tiempo<input type="range" data-filmt min="0" max="${Math.round(TOTAL * 100)}" value="${Math.round((st.film?.t || 0) * 100)}" aria-label="Posición del montaje"></label>
      ${st.freeCam ? '<button type="button" class="btn" data-film="cam">Cámara del guion</button>' : ''}<button type="button" class="btn" data-film="restart">Reiniciar</button>`; return; }
    ctx.innerHTML = `<button type="button" class="btn primary" data-sepgo="${st.target > .5 ? 0 : 1}">${st.playing ? 'Pausa' : st.A > .5 ? 'Separar' : 'Ensamblar'}</button>
     <label>Separación<input type="range" data-sep min="0" max="1000" value="${Math.round((1 - st.A) * 1000)}" aria-label="Grado de separación"></label>
     <button type="button" class="btn" data-sepgo="reverse">Invertir</button><button type="button" class="btn" data-sepgo="reset">Restablecer</button>${st.sys ? `<button type="button" class="btn" data-a="isolate" aria-pressed="${S.state.isolate?.id === st.sys}">Aislar ${esc(M.systems.find(s => s.id === st.sys).label.toLowerCase())}</button>` : ''}`;
  }
  // ── cajón: capas e inspector ──
  function openPanel(kind) { st.panel = kind; shell.drawer.hidden = false; shell.top.querySelector('[data-a="layers"]').setAttribute('aria-pressed', String(kind === 'layers')); renderPanel(); }
  function closePanel() { st.panel = null; shell.drawer.hidden = true; shell.top.querySelector('[data-a="layers"]').setAttribute('aria-pressed', 'false'); }
  function renderPanel() {
    const D = shell.drawer;
    if (st.panel === 'layers') { D.innerHTML = `<header><h2>Capas</h2><span class="spacer"></span><button type="button" class="btn ghost" data-a="close-panel" aria-label="Cerrar capas">✕</button></header><div class="body">
      ${M.systems.map(s => `<div class="layer"><input type="checkbox" id="dl-${s.id}" data-layer="${s.id}" ${S.state.visible[s.id] !== false ? 'checked' : ''}><label for="dl-${s.id}"><span class="sw" style="display:inline-block;background:${SW[s.id]};width:10px;height:10px;border-radius:2px;margin-right:6px"></span>${esc(s.label)}</label><span class="n">${s.count}${s.auxiliary ? ` + ${s.auxiliary} aux.` : ''} · ${s.meshes} mallas</span><button type="button" class="btn ghost" data-solo="${s.id}" aria-pressed="${S.state.isolate?.id === s.id}">Aislar</button></div>`).join('')}
      <h3>Recuento honesto</h3><dl class="rows"><dt>Elementos del proyecto</dt><dd>${M.summary.canonicalEntities}</dd><dt>Piezas del despiece</dt><dd>${M.summary.components}</dd><dt>Piezas auxiliares (sin entidad)</dt><dd>${M.summary.auxiliary}</dd><dt>Mallas visuales</dt><dd>${M.summary.visualMeshes}</dd></dl>
      <h3>No modelado</h3><ul class="missing">${M.notModelled.map(x => `<li><b>${esc(x.label)}</b>: ${esc(x.reason)}</li>`).join('')}</ul></div>`; return; }
    const c = st.selected && M.byKey.get(st.selected); if (!c) { closePanel(); return; }
    const it = AS.items.find(i => i.key === c.key), sys = M.systems.find(s => s.id === c.system), meta = c.meta;
    const host = meta?.host && M.components.find(x => x.entityId === meta.host);
    const claims = synthetic ? [E().assess({ key: `syn:${c.entityId}:dims`, label: 'Dimensiones', value: meta?.dims || null, kind: 'declaration', declaredBy: 'synthetic-fixture' }), E().assess({ key: `syn:${c.entityId}:mat`, label: 'Material', value: meta?.material?.name || null, kind: 'declaration', declaredBy: 'synthetic-fixture' })]
      : [E().assess({ key: `dp:${c.key}:exists`, label: 'Existencia física', value: c.entity ? 'Existe' : null, kind: 'declaration', declaredBy: c.entity?.source?.review === 'confirmed' ? 'reviewer' : c.entity?.source?.method === 'manual' ? 'user' : null }),
         E().assess({ key: `dp:${c.key}:structure`, label: 'Función estructural', value: null, kind: 'declaration' })];
    D.innerHTML = `<header><h2>${esc(c.name)}</h2><span class="spacer"></span><button type="button" class="btn ghost" data-a="close-panel" aria-label="Cerrar ficha">✕</button></header><div class="body">
      <dl class="rows"><dt>Sistema</dt><dd>${esc(sys.label)}</dd><dt>Identificador</dt><dd style="font:12px var(--mono)">${esc(c.entityId || '— (generado por el visor)')}</dd>${c.level ? `<dt>Nivel</dt><dd>${esc(c.level === 'roof' ? 'Cubierta' : (P.levels || []).find(l => l.id === c.level)?.name || c.level)}</dd>` : ''}
      ${meta?.material ? `<dt>Material</dt><dd>${esc(meta.material.name)}</dd>` : ''}${host ? `<dt>Alojado en</dt><dd>${esc(host.name)}</dd>` : ''}<dt>Llega en</dt><dd>${esc(AS.PHASES.find(p => p.id === it?.phase)?.label || 'Referencia fija')}</dd><dt>Mallas visuales</dt><dd>${c.meshIdx.length}</dd></dl>
      <h3>Afirmaciones</h3>${claims.map(cl => `<div class="claim"><div class="h"><span>${esc(cl.claim)}</span><span class="v">${esc(cl.value)} <span class="chip" data-c="${cl.certainty}">${E().label(cl.certainty)}</span></span></div><p>${esc(cl.justification.join(' '))}</p></div>`).join('')}
      <p><button type="button" class="btn" data-a="isolate-sel">Aislar esta pieza</button></p></div>`;
  }
  // ── selección por pulsación (sin arrastre) ──
  let down = null; S.canvas.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; });
  S.canvas.addEventListener('pointerup', e => { if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return; down = null; const k = S.pickAt(e.clientX, e.clientY); st.selected = k; S.setSelected(k); if (k) { st.sys = M.byKey.get(k).system; openPanel('inspect'); } else closePanel(); renderLegend(); renderCtx(); });
  // ── vídeo y lámina ──
  // Vigencia: salida asociada a la revisión del paquete; se comprueba al terminar, al reabrir y al descargar.
  const validez = rev => REV.vigencia(pkg, rev);
  const staleGuard = async () => { const v = await validez(pkg.revision); if (!v.vigente) throw Object.assign(Error('El proyecto ha cambiado desde que se abrió esta experiencia. Ciérrala y vuelve a abrirla para preparar la revisión vigente.'), { code: 'STALE', vigencia: v }); };
  /** Generador del vídeo (sin diálogo): lo usan el visor y el catálogo de Entregar. Cancelable con `signal`. */
  async function buildVideo({ signal, onProgress } = {}) { await staleGuard();
      heroAspect = 16 / 9; FIRMA = await HERO.preparar(HERO.firma(pkg, 'despiece', { synthetic }));
      exporting = true; let r; try { r = await exportMp4({ duration: TOTAL, fps: 30, width: 1920, height: 1080, signal, onProgress, apply: () => {},
        draw: (c2, t, w, h) => { filmApply(t); S.setHighlight([]); const { canvas } = S.renderAt(w, h); c2.drawImage(canvas, 0, 0, w, h); overlay(c2, t, w, h); } }); } finally { exporting = false; }
      r.revision = pkg.revision; r.firma = FIRMA ? { estudio: FIRMA.estudio, perfil: FIRMA.perfil, estilo: FIRMA.estilo, desde: DUR, duracion: TOTAL - DUR } : null; heroAspect = (S.canvas.clientWidth || 16) / (S.canvas.clientHeight || 9); return r; 
  }
  async function makeVideo({ fresh = false, opener = document.activeElement } = {}) {
    if (st.film) st.film.playing = false; const save = { A: st.A, pose: S.currentPose(), free: st.freeCam }; st.freeCam = false; CAM = null;
    const restore = () => { S.renderAt(1, 1).restore(); S.setAssembly(save.A); S.applyPose(save.pose); st.freeCam = save.free; S.setHighlight([]); };
    const vm = videoModal(shell.app, { cached: fresh ? null : REV.ultima(pkg, 'despiece', 'video'), validez, opener, onResult: r => REV.recordar(pkg, 'despiece', 'video', r), title: 'Vídeo Despiece · Exploded View Assembly', filename: `despiece-${pkg.projectId}-${pkg.revision.slice(0, 8)}.mp4`, run: buildVideo });
    vm.done.finally(restore).catch(() => {}); return vm;
  }
  function overlay(c2, t, w, h) { const k = w / 1920, fp = firmaAt(t); c2.save(); c2.globalAlpha = Math.max(0, 1 - fp * 8); c2.fillStyle = '#1f2328'; c2.font = `600 ${Math.round(22 * k)}px ui-monospace,Consolas,monospace`; c2.fillText(AS.phaseAt(Math.min(t, DUR - 1e-6)).label.toUpperCase(), 64 * k, h - 64 * k);
    c2.font = `500 ${Math.round(16 * k)}px ui-monospace,Consolas,monospace`; c2.fillStyle = '#5d6480'; c2.fillText(`${(NOMBRE).toUpperCase()} · REV ${pkg.revision.slice(0, 10)} · ${synthetic ? 'ESCENA SINTÉTICA · NO ES UNA VIVIENDA REAL' : 'DATOS REALES DE RUBIK · ESTRUCTURA NO MODELADA'}`, 64 * k, h - 34 * k);
    c2.textAlign = 'right'; c2.fillText('Explicación visual del montaje · no certifica el procedimiento constructivo', w - 64 * k, h - 34 * k); c2.restore(); if (fp > 0) HERO.pintar(c2, w, h, FIRMA, fp); }
  /** Lámina A3 de despiece (420 × 297 mm · 200 ppp, densidad declarada). Todas sus vistas son ilustrativas (perspectiva). */
  async function buildSheet() {
    const Wp = 3307, Hp = 2339, cv = document.createElement('canvas'); cv.width = Wp; cv.height = Hp; const g = cv.getContext('2d'); g.fillStyle = '#f6f4f0'; g.fillRect(0, 0, Wp, Hp);
    g.strokeStyle = '#1f2328'; g.lineWidth = 4; g.strokeRect(50, 50, Wp - 100, Hp - 100);
    const save = { A: st.A, pose: S.currentPose() }; CAM = null;
    const shot = (A, x, y, w, h, title) => { S.setHighlight([]); S.setAssembly(A); const cam = filmCamera(); const p = cam.poseAt(A === 0 ? 0 : A >= 1 ? 14 : 7);
      const d = [p.position[0] - p.target[0], p.position[1] - p.target[1], p.position[2] - p.target[2]], L = Math.hypot(...d), pose = S.currentPose();
      pose.kind = 'persp'; pose.dir.set(d[0] / L, d[1] / L, d[2] / L); pose.target.set(...p.target); pose.dist = L; pose.fov = p.fov; pose.up.set(0, 1, 0); S.applyPose(pose);
      const { canvas } = S.renderAt(w, h); g.drawImage(canvas, x, y, w, h); g.strokeStyle = '#1f2328'; g.lineWidth = 1.5; g.strokeRect(x, y, w, h); g.fillStyle = '#1f2328'; let fs = 30; g.font = `600 ${fs}px ui-monospace,Consolas,monospace`; while (fs > 24 && g.measureText(title).width > w - 36) { fs -= 1; g.font = `600 ${fs}px ui-monospace,Consolas,monospace`; }
      const words = title.split(' '), lines = [''];
      for (const wd of words) { const tryL = (lines[lines.length - 1] + ' ' + wd).trim(); if (g.measureText(tryL).width <= w - 36 || !lines[lines.length - 1]) lines[lines.length - 1] = tryL; else lines.push(wd); }
      g.fillStyle = 'rgba(246,244,240,.88)'; g.fillRect(x + 1, y + 1, w - 2, 18 + lines.length * (fs + 8)); g.fillStyle = '#1f2328'; lines.forEach((l, i) => g.fillText(l, x + 18, y + 14 + fs + i * (fs + 8))); };
    shot(0, 90, 90, 2180, 1500, 'VIVIENDA SEPARADA · SISTEMAS CONSTRUCTIVOS');
    // Los mismos rótulos que el visor y el vídeo (BpdpAssembly, por sistemas presentes); recortados al ancho de la viñeta.
    const ph = id => AS.PHASES.find(p => p.id === id).label.toUpperCase();
    [[.21, ph('structure')], [.6, ph('fusion')], [.88, ph('final')], [1, ph('hero')]].forEach(([A, t], i) => shot(A, 90 + i * 545, 1620, 525, 420, t));
    S.renderAt(1, 1).restore(); S.setAssembly(save.A); S.applyPose(save.pose);
    // leyenda de sistemas con recuentos honestos
    g.font = '600 34px Bahnschrift,system-ui'; g.fillStyle = '#1f2328'; g.fillText('Sistemas', 2320, 140); g.font = '500 28px Bahnschrift,system-ui';
    M.systems.forEach((s, i) => { const y = 200 + i * 62; g.fillStyle = SW[s.id]; g.fillRect(2320, y - 26, 34, 34); g.strokeStyle = '#1f2328'; g.lineWidth = 1; g.strokeRect(2320, y - 26, 34, 34); g.fillStyle = '#1f2328'; g.fillText(`${s.label} · ${s.count}${s.auxiliary ? ` + ${s.auxiliary} aux.` : ''}`, 2372, y); });
    let y0 = 220 + M.systems.length * 62; g.font = '600 26px ui-monospace,Consolas,monospace'; g.fillText('NO MODELADO', 2320, y0); g.font = '500 24px Bahnschrift,system-ui'; M.notModelled.forEach((x, i) => g.fillText(`· ${x.label}`, 2320, y0 + 40 + i * 34));
    titleBlock(g, 2320, 1620, 897, 620, [['Proyecto', NOMBRE, true], ['Escenario', synthetic ? 'Escena SINTÉTICA de demostración' : 'Proyecto real de RUBIK'], ['Revisión', pkg.revision.slice(0, 20)], ['Piezas', `${M.summary.components} piezas · ${M.summary.canonicalEntities} elementos · ${M.summary.visualMeshes} mallas`], ['Formato', 'A3 apaisado · 420 × 297 mm · 200 ppp'], ['Vistas', 'Ilustrativas en perspectiva · sin escala'], ['Aviso', 'Explicación visual; no certifica el procedimiento'], ['Fecha', new Date().toISOString().slice(0, 10)], ...(HERO.firma(pkg, 'despiece', { synthetic })?.estudio ? [['Profesional', HERO.firma(pkg, 'despiece', { synthetic }).estudio, true]] : [])], { ink: '#1f2328' });
    const blob = await pngConDensidad(await new Promise(r => cv.toBlob(r, 'image/png')), 200);
    const meta = { formato: 'A3 apaisado', mm: [420, 297], px: [Wp, Hp], dpi: 200, vistas: 'ilustrativas (perspectiva, sin escala)', fases: AS.PHASES.map(p => p.label), revision: pkg.revision };
    window.__bpdpLastSheetMeta = meta; return { blob, meta, revision: pkg.revision, sha256: [...new Uint8Array(await crypto.subtle.digest('SHA-256', await blob.arrayBuffer()))].map(b => b.toString(16).padStart(2, '0')).join('') };
  }
  async function makeSheet(opts = {}) {
    const r = await buildSheet(); REV.recordar(pkg, 'despiece', 'sheet', r);
    sheetModal(shell.app, { revision: pkg.revision, validez, opener: opts.opener ?? shell.top.querySelector('[data-a="sheet"]'), title: 'Lámina de despiece (A3)', filename: `lamina-despiece-${pkg.projectId}-${pkg.revision.slice(0, 8)}.png`, blob: r.blob,
      meta: `PNG · A3 apaisado 420 × 297 mm · 200 ppp · vistas ilustrativas, sin escala · revisión ${pkg.revision.slice(0, 12)} · firma: ${HERO.firma(pkg, 'despiece', { synthetic })?.estudio || 'sin firma'}` });
    return r;
  }
  // ── eventos ──
  function setIntent(k) { st.intent = k; shell.dock.querySelectorAll('[data-intent]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.intent === k)));
    if (k === 'film') { closePanel(); startFilm(); } else { stopFilm(); st.autoFrame = true; st.frameDirty = true; } renderCtx(); renderLegend(); }
  shell.app.addEventListener('click', onClick); shell.app.addEventListener('input', onInput); window.addEventListener('keydown', onKey, true);
  function onClick(e) {
    const b = e.target.closest('button'); if (!b || shell.app.querySelector('.modal')?.contains(b)) return; const a = b.dataset.a;
    if (a === 'back') return back(); if (a === 'layers') return st.panel === 'layers' ? closePanel() : openPanel('layers'); if (a === 'close-panel') { closePanel(); st.selected = null; S.setSelected(null); return; }
    if (a === 'video') return makeVideo(); if (a === 'sheet') return makeSheet();
    if (a === 'firma') return HERO.abrirPanel(shell.app, pkg, { modulo: 'despiece', synthetic, opener: b, fondo: (w, h) => { const save = { A: st.A, pose: S.currentPose(), free: st.freeCam }; st.freeCam = false; CAM = null; heroAspect = w / h; filmApply(TOTAL); S.setHighlight([]);
        const { canvas, restore } = S.renderAt(w, h); const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(canvas, 0, 0, w, h); restore(); S.setAssembly(save.A); st.A = save.A; S.applyPose(save.pose); st.freeCam = save.free; return c; },
      onChange: () => { FIRMA = HERO.firma(pkg, 'despiece', { synthetic }); } });
    if (a === 'style') { st.style = st.style === 'archviz' ? 'blueprint' : 'archviz'; S.applyStyle(st.style); shell.app.dataset.theme = st.style === 'archviz' ? 'studio' : 'paper'; b.setAttribute('aria-pressed', String(st.style === 'blueprint')); return; }
    if (a === 'isolate') { const cur = S.state.isolate; S.setIsolate(cur?.id === st.sys ? null : { type: 'system', id: st.sys }); return renderCtx(); }
    if (a === 'isolate-sel') { const cur = S.state.isolate; S.setIsolate(cur?.id === st.selected ? null : { type: 'component', id: st.selected }); return; }
    if (b.dataset.intent) return setIntent(b.dataset.intent);
    if (b.dataset.sys) { st.sys = st.sys === b.dataset.sys ? null : b.dataset.sys; S.setHighlight(st.sys ? M.systems.find(s => s.id === st.sys).components : []); renderLegend(); return renderCtx(); }
    if (b.dataset.solo) { const cur = S.state.isolate; S.setIsolate(cur?.id === b.dataset.solo ? null : { type: 'system', id: b.dataset.solo }); return renderPanel(); }
    if (b.dataset.sepgo) { const g = b.dataset.sepgo;
      // «Invertir» a mitad cambia el sentido desde el estado actual (sin salto); el botón principal en marcha pausa.
      if (g === 'reverse') return animateTo(st.target > .5 ? 0 : 1); if (g !== 'reset' && st.playing) { st.playing = false; return renderCtx(); } if (g === 'reset') { st.autoFrame = true; st.frameDirty = true; st.playing = false; S.setIsolate(null); S.setHighlight([]); st.sys = null; S.setAssembly(1); st.A = 1; st.target = 1; renderLegend(); syncSlider(); return renderCtx(); }
      return animateTo(+g); }
    const f = b.dataset.film; if (!f) return; if (!st.film) startFilm();
    if (f === 'play') { if (st.film.t >= TOTAL && st.dir > 0) st.film.t = 0; if (st.film.t <= 0 && st.dir < 0) st.film.t = TOTAL; st.film.playing = !st.film.playing; st.film.last = performance.now(); }
    if (f === 'back5') { st.film.t = Math.max(0, st.film.t - 1); st.film.playing = false; } if (f === 'fwd5') { st.film.t = Math.min(TOTAL, st.film.t + 1); st.film.playing = false; }
    if (f === 'reverse') { st.dir = -st.dir; st.film.playing = true; st.film.last = performance.now(); } if (f === 'rate') { st.rate = st.rate === 1 ? .5 : st.rate === .5 ? 2 : 1; }
    if (f === 'restart') { st.film.t = 0; st.dir = 1; st.film.playing = true; st.film.last = performance.now(); } if (f === 'cam') st.freeCam = false;
    renderCtx();
  }
  function onInput(e) { const t = e.target;
    if (t.dataset.sep !== undefined) { st.playing = false; S.setAssembly(1 - +t.value / 1000); st.A = S.state.A; st.target = st.A; st.frameDirty = true; renderLegendThrottled(); }
    if (t.dataset.layer) S.setSystemVisible(t.dataset.layer, t.checked);
    if (t.dataset.filmt !== undefined && st.film) { st.film.t = +t.value / 100; st.film.playing = false; } }
  function onKey(e) { if (shell.app.querySelector('.modal')) return;
    if (e.key === 'Escape') { e.preventDefault(); back(); }
    if ((e.key === ' ' || e.key === 'Enter') && !/INPUT|BUTTON/.test(e.target.tagName)) { e.preventDefault(); if (st.film) { st.film.playing = !st.film.playing; st.film.last = performance.now(); } else animateTo(st.target > .5 ? 0 : 1); } }
  function back() { if (st.panel) { closePanel(); st.selected = null; S.setSelected(null); return; } if (st.intent !== 'explore') return setIntent('explore'); if (st.sys) { st.sys = null; S.setHighlight([]); S.setIsolate(null); renderLegend(); return renderCtx(); } onBack(); }
  S.goTo(S.poseFor('hero', { margin: 1.25 }), 0); renderLegend(); renderCtx();
  return { get state() { return { intent: st.intent, A: st.A, playing: st.playing, film: st.film ? { t: st.film.t, playing: st.film.playing } : null, rate: st.rate, dir: st.dir, selected: st.selected, sys: st.sys, freeCam: st.freeCam, style: st.style }; },
    setIntent, makeVideo, makeSheet, buildSheet, buildVideo, filmApply, animateTo, DUR, TOTAL, get firma() { return FIRMA; }, get heroBoxes() { return titles.last; },
    unmount() { stopFilm(); titles.remove(); window.removeEventListener('keydown', onKey, true); shell.app.removeEventListener('click', onClick); shell.app.removeEventListener('input', onInput); legend.remove(); } };
}
