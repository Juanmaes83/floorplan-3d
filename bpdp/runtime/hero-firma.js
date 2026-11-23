/* BP-DP PREMIUM · HERO FINAL universal con la firma del profesional (módulo ES).
 *
 * No es un motor nuevo: Blueprint y Despiece cierran su vídeo y su película con el MISMO contrato que la Evolución, el
 * Dibujo vivo y la previsualización de STUDIO, transferido con SCULPT (bytes exactos de RUBIK 6ca70a5):
 *   RubikFinalCore.firma()      → qué se muestra (estudio, logotipo, lema, título, cliente autorizado, cierre, CTA, web);
 *   RubikFinalTitulos.pintar()  → cómo se compone y se pinta (estilos «cine» y «editorial», aparición escalonada);
 *   FloorPlanBrand              → de dónde salen los datos (perfiles de «Mi estudio» y datos HERO por proyecto).
 * Reglas heredadas: sin perfil no se inventa ningún estudio (solo título + atribución); el cliente solo con autorización
 * expresa; la web solo con consentimiento para esa entrega; nunca datos de contacto personales; nada en chino.
 * La fase de firma dura lo que dicta el núcleo (DURACIONES.firma) y es función pura del tiempo: la misma t da la misma
 * imagen en la herramienta y en el MP4.
 */
import * as THREE from 'three';
const C = () => window.RubikFinalCore, T = () => window.RubikFinalTitulos, B = () => window.FloorPlanBrand;
export const available = () => !!(C() && T() && B());
/** Duración de la fase de firma (s), la del núcleo común. */
export const FIRMA_S = () => (C()?.DURACIONES?.firma ?? 6500) / 1000;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), suave = x => { x = clamp(x); return x * x * x * (x * (x * 6 - 15) + 10); };

// Avisos honestos propios de cada experiencia (sustituyen al aviso de obra de la Evolución, que aquí no aplica).
const AVISOS = {
  blueprint: { completada: 'Representación técnica del proyecto', aviso: 'Cotas calculadas del modelo · estimado · no sustituye al proyecto de ejecución' },
  despiece: { completada: 'Despiece explicativo del montaje', aviso: 'Explicación visual · no certifica el procedimiento constructivo' } };
const LAB_PREFIX = 'bpdp-lab:';

function storage() { try { return window.FloorPlanBrandUI?.store || window.localStorage; } catch { return null; } }
/** Entrada de entrega: en RUBIK (puente) la del proyecto abierto; en el laboratorio, una propia por proyecto. */
export function entryOf(pkg) { return pkg?.source?.live && window.FloorPlanApp?.entryId ? window.FloorPlanApp.entryId : LAB_PREFIX + (pkg?.projectId || 'sin-id'); }
export function nombreProyecto(pkg) { const n = pkg?.project?.name || pkg?.label || ''; return C() ? C().textoVisible(n, 'es') : n; }

/** Estado desde la autoridad (FloorPlanBrand): mismo cálculo que studio-hero-ui.leer(). */
export function leer(pkg) {
  const s = storage(), id = entryOf(pkg); if (!B() || !s) return null;
  const d = B().delivery(s, id), perfil = d.profileId ? B().readProfiles(s).profiles.find(p => p.id === d.profileId) : null;
  return { entryId: id, perfil, perfiles: B().readProfiles(s).profiles, titulo: d.title || nombreProyecto(pkg),
    hero: d.hero || { cliente: '', clienteAutorizado: false, cierre: '', estilo: 'cine', incluirWeb: false } };
}
/** Marca para la firma: misma forma que studio-hero-ui.marca() (OP-05: la web solo con hero.incluirWeb). */
function marca(st) { const p = st?.perfil; if (!p) return null; return { present: true, name: p.name, tagline: p.tagline, logo: p.logo, web: st.hero?.incluirWeb === true ? p.web : '', cta: p.cta, hero: st.hero }; }

/** Firma congelada para una salida (vídeo, película o lámina). */
export function firma(pkg, modulo, { synthetic = false } = {}) { return firmaDesde(leer(pkg), pkg, modulo, { synthetic }); }
/** Misma composición desde cualquier estado: el almacén (salidas) o el borrador del diálogo (solo vista previa). */
export function firmaDesde(st, pkg, modulo, { synthetic = false } = {}) {
  if (!available()) return null;
  const f = C().firma({ marca: marca(st), proyecto: st?.titulo || nombreProyecto(pkg), lang: 'es' }), a = AVISOS[modulo];
  return Object.freeze({ ...f, estado: modulo, completada: a.completada, aviso: synthetic ? a.aviso + ' · escena sintética, no es una vivienda real' : a.aviso,
    perfil: st?.perfil ? { id: st.perfil.id, name: st.perfil.name } : null, entryId: st?.entryId || null });
}

/** Estado de la fase de firma en e (s desde su inicio): acercamiento, órbita lenta y aparición de los títulos. */
export function epilogo(e, { reduced = false } = {}) {
  const d = FIRMA_S(), t = clamp(e, 0, d);
  return { e: t, total: d, acercar: reduced ? 1 : suave(t / 1.6), orbita: reduced ? 0 : 0.2 * suave(t / d), firma: reduced ? (t > 0 ? 1 : 0) : clamp(t / (d * 0.75)) };
}
/** Pose HERO: la de la base girada, con la vivienda desplazada a la derecha para dejar aire a los títulos (abajo a la izquierda). */
export function heroPose(base, { orbita = 0, aspect = 16 / 9 } = {}) {
  const dir = base.dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), orbita), up = base.up.clone();
  const right = new THREE.Vector3().crossVectors(up, dir).normalize(), upS = new THREE.Vector3().crossVectors(dir, right).normalize();
  const halfH = base.kind === 'ortho' ? base.half : base.dist * Math.tan(THREE.MathUtils.degToRad(base.fov / 2)), halfW = halfH * aspect;
  const target = base.target.clone().addScaledVector(right, -0.3 * halfW).addScaledVector(upS, -0.1 * halfH);
  const out = { ...base, dir, up, target }; if (base.kind === 'ortho') out.half = base.half * 1.1; else out.dist = base.dist * 1.1; return out;
}

const imgs = new Map();
const img = src => { if (!src) return null; if (!imgs.has(src)) { const i = new Image(); i.src = src; imgs.set(src, i); } return imgs.get(src); };
/** Espera a que el logotipo esté decodificado (el vídeo se compone fotograma a fotograma y no debe perderlo). */
export async function preparar(f) { const i = img(f?.logo); if (i) { try { await i.decode(); } catch { } } return f; }
/** Pinta la firma sobre un fotograma ya compuesto: el contrato común y la atribución discreta de RUBIK, como la Evolución. */
export function pintar(x, W, H, f, progreso) {
  if (!f || progreso <= 0 || !T()) return null;
  const s = Math.min(H / 900, W / 1440);
  x.save(); x.globalAlpha = Math.min(1, progreso * 2); x.textAlign = 'right'; x.textBaseline = 'alphabetic'; x.fillStyle = f.estilo === 'editorial' ? 'rgba(36,33,29,.72)' : 'rgba(255,255,255,.88)';
  x.shadowColor = f.estilo === 'editorial' ? 'transparent' : 'rgba(0,0,0,.45)'; x.shadowBlur = 6; x.font = `700 ${Math.round(13 * s)}px Inter, "Helvetica Neue", Arial, sans-serif`; x.fillText(f.atribucion, W - 36 * s, H - 20 * s); x.restore();
  return T().pintar(x, W, H, f, { progreso, estilo: f.estilo, logo: img(f.logo) });
}

/** Capa 2D sobre el lienzo de la herramienta para la película en vivo (la misma función que el vídeo). */
export function capa(stage, reserva = () => 0, { app = stage.closest('.app'), arriba = () => 0 } = {}) {
  const cv = document.createElement('canvas'); cv.className = 'hero-titles'; cv.setAttribute('aria-hidden', 'true'); stage.appendChild(cv); let pintada = false;
  const api = {
    last: null,
    draw(f, progreso) {
      // Zona libre REAL: entre la barra superior y el dock (medidos en cada fotograma); los títulos nunca invaden controles.
      const r = stage.getBoundingClientRect(), top = Math.max(0, arriba()), hCss = Math.max(1, r.height - reserva() - top), dpr = Math.min(2, window.devicePixelRatio || 1),
        W = Math.max(1, Math.round(r.width * dpr)), H = Math.max(1, Math.round(hCss * dpr));
      cv.style.top = top + 'px'; cv.style.height = hCss + 'px'; if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
      if (app) { if (progreso > 0) app.dataset.hero = 'on'; else delete app.dataset.hero; }
      const x = cv.getContext('2d'); if (progreso <= 0) { if (pintada) { x.clearRect(0, 0, W, H); pintada = false; } api.last = null; return; }
      x.clearRect(0, 0, W, H); const comp = pintar(x, W, H, f, progreso); pintada = true;
      // Cajas de texto en píxeles CSS de la página (para la comprobación automática de solapes).
      const ox = r.left, oy = r.top + top; api.last = comp ? comp.lineas.map(l => ({ text: l.texto || '[logo]', x: ox + l.x / dpr, y: oy + l.y / dpr, w: l.w / dpr, h: l.h / dpr })) : null;
    },
    remove() { cv.remove(); if (app) delete app.dataset.hero; } };
  return api;
}

// ── «Firma profesional»: elegir perfil de «Mi estudio» y datos HERO de esta entrega (contrato FloorPlanBrand) ──
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
/** Logotipo de ejemplo generado aquí (monograma PNG); no usa ninguna marca, foto ni fuente reservada. */
function logoEjemplo() {
  const c = document.createElement('canvas'); c.width = 480; c.height = 120; const g = c.getContext('2d');
  g.fillStyle = '#1f3a5f'; g.beginPath(); g.roundRect ? g.roundRect(0, 6, 108, 108, 18) : g.rect(0, 6, 108, 108); g.fill();
  g.fillStyle = '#f3d9a8'; g.font = '700 64px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('EA', 54, 62);
  g.fillStyle = '#1f3a5f'; g.textAlign = 'left'; g.font = '700 40px Inter, Arial, sans-serif'; g.fillText('ESTUDIO', 130, 44); g.font = '400 34px Inter, Arial, sans-serif'; g.fillText('de ejemplo', 130, 88);
  return c.toDataURL('image/png');
}
const EJEMPLO = () => ({ name: 'Estudio de ejemplo', tagline: 'Arquitectura que se entiende antes de construirse', cta: 'Pide tu propuesta', web: 'https://estudio-ejemplo.es', logo: logoEjemplo() });
const HERO_EJEMPLO = { cliente: 'Familia García', clienteAutorizado: true, cierre: 'Gracias por confiar en nosotros. Seguimos contigo en cada fase.', estilo: 'cine', incluirWeb: true };
export function crearEjemplo(pkg) {
  const s = storage(), id = entryOf(pkg); if (!B() || !s) throw Error('No hay almacenamiento local disponible.');
  const lib = B().readProfiles(s), prev = lib.profiles.find(p => p.name === 'Estudio de ejemplo');
  const p = prev || B().saveProfile(s, EJEMPLO());
  return B().setDelivery(s, id, { profileId: p.id, title: B().delivery(s, id).title || nombreProyecto(pkg), hero: { ...HERO_EJEMPLO } });
}

/**
 * Diálogo «Firma profesional».
 * - BORRADOR: lo que se edita vive solo en el diálogo; la vista previa pinta el borrador con el mismo motor que el vídeo.
 * - «Aplicar» guarda únicamente las opciones elegidas (FloorPlanBrand.setDelivery; el perfil de ejemplo se crea solo aquí).
 * - «Cancelar», «✕» y Escape descartan el borrador: el almacén de marca no cambia.
 * - Teclado: Tab y Mayús+Tab recorren solo el diálogo; al cerrar, el foco vuelve a quien lo abrió («Firma»).
 */
export function abrirPanel(root, pkg, { modulo, synthetic, fondo, onChange, opener = document.activeElement }) {
  const m = document.createElement('div'); m.className = 'modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-labelledby', 'firmaTitulo');
  root.appendChild(m); let prevBg = null, cerrado = false;
  const st0 = leer(pkg), h0 = st0?.hero || {};
  // Borrador inicial = lo guardado. Nada de lo que se toque aquí llega al almacén hasta «Aplicar».
  const draft = { profileId: st0?.perfil?.id || '', titulo: st0?.titulo || nombreProyecto(pkg), hero: { cliente: h0.cliente || '', clienteAutorizado: !!h0.clienteAutorizado, cierre: h0.cierre || '', estilo: h0.estilo === 'editorial' ? 'editorial' : 'cine', incluirWeb: !!h0.incluirWeb }, pendiente: null };
  const perfiles = () => [...(st0?.perfiles || []), ...(draft.pendiente ? [draft.pendiente] : [])];
  const estadoBorrador = () => ({ perfil: perfiles().find(p => p.id === draft.profileId) || null, titulo: draft.titulo, hero: { ...draft.hero, clienteAutorizado: !!draft.hero.cliente && draft.hero.clienteAutorizado } });
  const close = (aplicar) => {
    if (cerrado) return; cerrado = true;
    if (aplicar) {
      const s = storage(), id = entryOf(pkg); let profileId = draft.profileId || null;
      if (profileId && draft.pendiente && profileId === draft.pendiente.id) { const prev = B().readProfiles(s).profiles.find(p => p.name === draft.pendiente.name); profileId = (prev || B().saveProfile(s, { ...draft.pendiente, id: undefined })).id; }
      B().setDelivery(s, id, { profileId, title: draft.titulo, hero: { ...draft.hero } });
    }
    m.remove(); onChange?.({ aplicado: !!aplicar });
    const back = opener?.isConnected ? opener : root.querySelector('[data-a="firma"]'); back?.focus({ preventScroll: true });
  };
  const render = () => {
    const h = draft.hero, ps = perfiles();
    m.innerHTML = `<div class="sheet firma"><h2 id="firmaTitulo">Firma profesional del cierre</h2>
      <p class="sub">El vídeo y la película terminan con el HERO FINAL de RUBIK. Los cambios son un borrador hasta que pulses «Aplicar»; «Cancelar» o Escape los descartan.</p>
      <canvas class="firma-prev" width="960" height="540" role="img" aria-label="Vista previa del cierre con el borrador de la firma"></canvas>
      ${!available() ? '<p class="status">No se ha cargado el motor común del HERO FINAL.</p>' : `
      <div class="firma-form">
       <label>Firmar con<select data-f="perfil"><option value="">Sin firma (solo título y atribución)</option>${ps.map(p => `<option value="${esc(p.id)}" ${draft.profileId === p.id ? 'selected' : ''}>${esc(p.name)}${p.id === draft.pendiente?.id ? ' (ejemplo, se crea al aplicar)' : ''}</option>`).join('')}</select></label>
       <label>Título del proyecto<input data-f="titulo" maxlength="120" value="${esc(draft.titulo)}"></label>
       <label>Cliente<input data-f="cliente" maxlength="80" value="${esc(h.cliente)}" placeholder="Solo se muestra con autorización"></label>
       <label class="chk"><input type="checkbox" data-f="autorizado" ${h.clienteAutorizado ? 'checked' : ''}> El cliente ha autorizado aparecer en el vídeo</label>
       <label>Mensaje de cierre<input data-f="cierre" maxlength="160" value="${esc(h.cierre)}"></label>
       <label>Estilo<select data-f="estilo"><option value="cine" ${h.estilo !== 'editorial' ? 'selected' : ''}>Cinematográfico</option><option value="editorial" ${h.estilo === 'editorial' ? 'selected' : ''}>Editorial</option></select></label>
       <label class="chk"><input type="checkbox" data-f="web" ${h.incluirWeb ? 'checked' : ''}> Mostrar la web en esta entrega</label>
      </div>
      <p class="fine">${ps.length ? '' : 'No hay perfiles de «Mi estudio» en este navegador. '}${pkg?.source?.live ? 'Se usan los perfiles de RUBIK.' : 'En el laboratorio puedes probar un perfil de ejemplo (claramente identificado).'}</p>`}
      <div class="actions">${available() && !pkg?.source?.live ? '<button type="button" class="btn" data-a="ejemplo">Usar firma de ejemplo</button>' : ''}<span class="spacer"></span><button type="button" class="btn" data-a="cancel">Cancelar</button><button type="button" class="btn primary" data-a="apply">Aplicar</button></div></div>`;
    preview();
  };
  const preview = async () => {
    const cv = m.querySelector('.firma-prev'); if (!cv) return; const x = cv.getContext('2d');
    if (!prevBg && fondo) prevBg = fondo(cv.width, cv.height);
    const f = await preparar(firmaDesde(estadoBorrador(), pkg, modulo, { synthetic }));
    if (prevBg) x.drawImage(prevBg, 0, 0, cv.width, cv.height); else { x.fillStyle = '#dfe3ea'; x.fillRect(0, 0, cv.width, cv.height); } pintar(x, cv.width, cv.height, f, 1);
    m.dataset.preview = JSON.stringify({ estudio: f?.estudio || null, para: f?.para || null, web: f?.web || null, titulo: f?.titulo || null });
  };
  const leerFormulario = () => { const v = k => m.querySelector(`[data-f="${k}"]`); if (!v('perfil')) return;
    Object.assign(draft, { profileId: v('perfil').value, titulo: v('titulo').value.slice(0, 120) });
    Object.assign(draft.hero, { cliente: v('cliente').value.slice(0, 80), clienteAutorizado: v('autorizado').checked, cierre: v('cierre').value.slice(0, 160), estilo: v('estilo').value, incluirWeb: v('web').checked }); };
  const focusables = () => [...m.querySelectorAll('button,select,input,[tabindex]:not([tabindex="-1"])')].filter(n => !n.disabled && n.getClientRects().length);
  m.addEventListener('input', e => { if (e.target.closest('[data-f]')) { leerFormulario(); preview(); } });
  m.addEventListener('change', e => { if (e.target.closest('[data-f]')) { leerFormulario(); preview(); } });
  m.addEventListener('click', e => { const a = e.target.closest('[data-a]')?.dataset.a;
    if (a === 'cancel') close(false); if (a === 'apply') close(true);
    if (a === 'ejemplo') { leerFormulario(); draft.pendiente = draft.pendiente || { id: 'pendiente-ejemplo', ...EJEMPLO() }; draft.profileId = draft.pendiente.id; Object.assign(draft.hero, HERO_EJEMPLO); render(); m.querySelector('[data-a="ejemplo"]')?.focus({ preventScroll: true }); } });
  m.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(false); return; }
    if (e.key !== 'Tab') return; const f = focusables(); if (!f.length) return; const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === first || !m.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (document.activeElement === last || !m.contains(document.activeElement))) { e.preventDefault(); first.focus(); } });
  // Un toque fuera de la hoja no cierra (evita perder el borrador por accidente); el foco nunca escapa al documento.
  m.addEventListener('focusout', e => { if (!cerrado && e.relatedTarget && !m.contains(e.relatedTarget)) focusables()[0]?.focus({ preventScroll: true }); });
  render(); (m.querySelector('[data-f="perfil"]') || m.querySelector('[data-a="apply"]')).focus({ preventScroll: true }); m.querySelector('.sheet').scrollTop = 0;
  return { modal: m, close, draft };
}
