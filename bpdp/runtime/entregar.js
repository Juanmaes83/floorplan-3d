/* BP-DP · CONEXIÓN CON ENTREGAR (módulo ES). Contrato para el área «Entregar» de RUBIK (UX-312 V3).
 *
 *   window.BpdpEntregar.card(contenedor, 'blueprint' | 'despiece')   → tarjeta en el grupo de Entregar (mismo patrón que
 *                                                                       RubikE3Entregables.card / FloorPlanDeliveryPreview.card)
 *   window.BpdpEntregar.abrir(modulo, { origen, accion })             → abre la experiencia sobre RUBIK; accion: 'lamina' | 'video'
 *
 * - La escena es el proyecto ABIERTO (View3D.captureScene + FloorPlanApp.project, solo lectura) con su revisión SHA-256.
 * - La firma sale de «Mi estudio» (FloorPlanBrandUI.store) y de la entrega del proyecto (FloorPlanApp.entryId).
 * - Vigencia: cada salida lleva su revisión; si el proyecto cambia, se identifica como obsoleta y no se descarga.
 * - Navegación continua: al entrar se registra el origen (área, tarjeta, desplazamiento, opciones y foco); al cerrar,
 *   cancelar o pulsar Escape se vuelve EXACTAMENTE a ese origen dentro de Entregar. Salir de Entregar es otra acción.
 * - Las experiencias se montan en Entregar. El parámetro bpdp permite probar cada módulo por separado.
 */
import { createStudio } from './studio.js';
import { mountBlueprint } from './blueprint-app.js';
import { mountDespiece } from './despiece-app.js';
import { livePackage } from './rubik-bridge.js';
import { MARKUP, shellFor } from './shell.js';
import * as REV from './revision.js';
import * as HERO from './hero-firma.js';

const RUNTIME = new URL('./', import.meta.url).href;
const MOD = {
  blueprint: { titulo: 'Blueprint 3D', h3: 'Blueprint 3D · planta, cotas, alzados y secciones', que: 'Explica el proyecto en dibujo técnico: planta ortográfica con cotas, secciones y alzados, lámina A3 con la escala indicada en el archivo y vídeo técnico con tu firma.', abrir: 'Abrir Blueprint' },
  despiece: { titulo: 'Despiece 3D', h3: 'Despiece 3D · cómo se separa y se monta', que: 'Explica cómo se separan y vuelven a montar los componentes del proyecto, con lámina de despiece y vídeo de montaje con tu firma.', abrir: 'Abrir Despiece' } };
let abierta = null;

// Núcleos clásicos del runtime (UMD): se cargan al abrir por primera vez, nunca con la Home.
const DEPS = [['RubikBpdpEvidence', 'g1/evidence-core.js'], ['RubikBlueprintCore', 'g1/blueprint-core.js'], ['BpdpModel', 'model.js'], ['BpdpAssembly', 'assembly.js']];
async function deps() {
  for (const [g, f] of DEPS) if (!window[g]) await new Promise((ok, ko) => { const s = document.createElement('script'); s.src = RUNTIME + f; s.onload = ok; s.onerror = () => ko(Error('No se pudo cargar ' + f)); document.head.appendChild(s); });
  for (const g of ['RubikShotTimeline', 'FloorPlanConstructionMp4', 'RubikFinalCore', 'RubikFinalTitulos', 'FloorPlanBrand']) if (!window[g]) throw Error('Falta ' + g + ' en RUBIK');
}
function css() { if (document.getElementById('bpdpScopedCss')) return; const l = document.createElement('link'); l.id = 'bpdpScopedCss'; l.rel = 'stylesheet'; l.href = RUNTIME + 'ui.scoped.css'; document.head.appendChild(l); }
// Con Entregar abierto View3D está suspendido: basta con que el editor esté en 3D (la captura reactiva el visor, como scene-export).
// RUBIK pone la clase is3d en el escenario antes de actualizar FloorPlanApp.viewMode (fin de la transición): vale cualquiera de las dos.
const es3d = () => !!window.View3D && (window.FloorPlanApp?.viewMode === '3d' || !!document.getElementById('stage')?.classList.contains('is3d'));
async function conVisor(run) { const v = window.View3D; if (!v?.suspended) return run(); v.setSuspended(false); try { return await run(); } finally { v.setSuspended(true); } }
async function activar3D() {
  if (!es3d()) await conVisor(() => window.setView?.('3d'));
  if (!es3d()) throw Object.assign(Error('La vista 3D no está disponible en este navegador.'), { code: 'NO3D' });
}

function montar(host, data, modulo, onBack) {
  let shell, S, app;
  const liberar = () => {
    app?.unmount();
    S?.dispose();
    shell?.release();
    if (host instanceof HTMLDialogElement && host.open) host.close();
    host.remove();
  };
  try {
    shell = shellFor(host);
    S = createStudio(shell.stage, data, { style: modulo === 'blueprint' ? 'blueprint' : 'archviz' });
    app = (modulo === 'blueprint' ? mountBlueprint : mountDespiece)(shell, S, { onBack });
    return { S, app, liberar };
  } catch (error) {
    liberar();
    throw error;
  }
}

// ── origen: dónde estaba el profesional al entrar ──
function capturarOrigen(el) {
  const scrolls = []; for (let n = el?.parentElement; n; n = n.parentElement) if (n.scrollHeight > n.clientHeight + 1 || n.scrollWidth > n.clientWidth + 1) scrolls.push([n, n.scrollTop, n.scrollLeft]);
  const se = document.scrollingElement; scrolls.push([se, se.scrollTop, se.scrollLeft]);
  const scope = el?.closest('#professionalWorkspace,dialog,section') || document;
  const controles = [...scope.querySelectorAll('input,select,textarea')].map(c => [c, c.type === 'checkbox' || c.type === 'radio' ? c.checked : c.value]);
  return { el, id: el?.id || null, y: el?.getBoundingClientRect?.().top ?? null, tarjeta: el?.closest('[data-module]')?.dataset.module || null, area: window.FloorPlanProfessionalUI?.area || null, scrolls, controles };
}
function restaurarOrigen(o) {
  if (o.area && window.FloorPlanProfessionalUI && window.FloorPlanProfessionalUI.area !== o.area) window.FloorPlanProfessionalUI.open(o.area);
  for (const [c, v] of o.controles) if (c.isConnected) { if (c.type === 'checkbox' || c.type === 'radio') c.checked = v; else if (c.value !== v) c.value = v; }
  for (const [n, t, l] of o.scrolls) if (n.isConnected) { n.scrollTop = t; n.scrollLeft = l; }
  const back = o.el?.isConnected ? o.el : (o.id && document.getElementById(o.id)) || document.querySelector(`[data-module="${o.tarjeta}"] button`);
  // Si el contenido por encima cambió de altura (p. ej. la firma o el estado de la tarjeta), se corrige el desplazamiento para que
  // el botón de origen quede EXACTAMENTE a la misma altura en pantalla: se vuelve a la tarjeta, no a un número de scroll.
  if (back && o.y != null) { const dy = back.getBoundingClientRect().top - o.y; if (Math.abs(dy) > 1) { let n = back.parentElement; while (n && !(n.scrollHeight > n.clientHeight + 1 && /(auto|scroll)/.test(getComputedStyle(n).overflowY))) n = n.parentElement; (n || document.scrollingElement).scrollTop += dy; } }
  back?.focus({ preventScroll: true });
  return { foco: back?.id || null, tarjeta: o.tarjeta, area: window.FloorPlanProfessionalUI?.area || null, y: back ? Math.round(back.getBoundingClientRect().top) : null };
}

/** Abre Blueprint o Despiece sobre RUBIK con el proyecto abierto. Devuelve una promesa que se resuelve al volver al origen. */
export async function abrir(modulo, { origen = document.activeElement, accion = null } = {}) {
  if (!MOD[modulo]) throw Error('Módulo desconocido: ' + modulo);
  if (abierta) return abierta.promesa;
  if (!es3d()) throw Object.assign(Error('Necesitas la vista 3D abierta: la escena se toma de lo que se ve allí.'), { code: 'NO3D' });
  css(); await deps(); const o = capturarOrigen(origen), t0 = performance.now();
  const data = await conVisor(() => livePackage());
  const host = document.createElement('dialog'); host.className = 'bpdp-host'; host.setAttribute('aria-label', MOD[modulo].titulo); host.innerHTML = MARKUP;
  document.body.appendChild(host); host.showModal();
  // Escape lo gestiona la experiencia (un paso atrás cada vez); el diálogo nunca se cierra por su cuenta.
  host.addEventListener('cancel', e => e.preventDefault());
  let resolver; const promesa = new Promise(r => { resolver = r; });
  let mo = null;
  const cerrar = async () => {
    if (!abierta) return; abierta = null; mo?.disconnect(); experiencia.liberar();
    // Primero se repinta la tarjeta (su estado) y DESPUÉS se restaura el origen: así el anclaje de desplazamiento del navegador
    // no mueve la vista al cambiar la altura de la tarjeta.
    const now = await (REV.probeFor(data.pkg))(); await refrescarTarjetas(); const vuelta = restaurarOrigen(o);
    window.BPDP = null; const r = { projectUnchanged: now === data.projectHash, revision: data.projectHash, ...vuelta }; resolver(r); return r;
  };
  let experiencia;
  try { experiencia = montar(host, data, modulo, cerrar); }
  catch (error) { restaurarOrigen(o); throw error; }
  const { app, S } = experiencia;
  abierta = { modulo, S, app, host, cerrar, promesa, revision: data.pkg.revision, openedMs: performance.now() - t0 };
  window.BPDP = { module: modulo, scenario: 'rubik-live', studio: S, app, close: cerrar, openedMs: abierta.openedMs };
  // Acción directa desde la tarjeta (previsualizar lámina / preparar vídeo): al cerrar o cancelar ese resultado se vuelve a la tarjeta.
  if (accion) {
    let visto = false;
    mo = new MutationObserver(() => { const m = host.querySelector('.modal'); if (m) visto = true; else if (visto) cerrar(); }); mo.observe(host, { childList: true, subtree: true });
    if (accion === 'lamina') app.makeSheet(); else if (accion === 'video') app.makeVideo({ opener: null });
  }
  return promesa;
}

// ── GENERADORES PARA EL CATÁLOGO (sin abrir el visor) ──
/**
 * preparar(modulo, tipo, { signal, onProgress }) → { tipo, formato, blob, sha256, revision, firma, meta, vigente }
 *   tipo: 'lamina' (PNG A3 420 × 297 mm, 200 ppp) | 'video' (MP4 H.264 1920 × 1080 30 fps con firma HERO FINAL).
 * Mismo generador que el visor, sobre la REVISIÓN ACTIVA del proyecto abierto, en un anfitrión oculto que siempre se libera
 * (también al cancelar). No toca el foco, el desplazamiento ni el estado de Entregar. Cancelar (signal) no deja salida.
 */
export async function preparar(modulo, tipo, { signal, onProgress } = {}) {
  if (!MOD[modulo] || !['lamina', 'video'].includes(tipo)) throw Error('Salida desconocida: ' + modulo + '/' + tipo);
  if (!es3d()) throw Object.assign(Error('Necesitas la vista 3D abierta: la escena se toma de lo que se ve allí.'), { code: 'NO3D' });
  const comprobarCancelacion = () => {
    if (signal?.aborted) throw Object.assign(Error('Preparación cancelada: no se ha generado nada.'), { code: 'CANCELLED' });
  };
  comprobarCancelacion();
  css();
  await deps();
  comprobarCancelacion();
  const data = await conVisor(() => livePackage({ signal }));
  comprobarCancelacion();
  const host = document.createElement('div'); host.className = 'bpdp-host'; host.setAttribute('aria-hidden', 'true'); host.inert = true;
  host.style.cssText = 'position:fixed;left:-20000px;top:0;width:1440px;height:900px;visibility:hidden;pointer-events:none'; host.innerHTML = MARKUP; document.body.appendChild(host);
  const BPDP0 = window.BPDP;
  const { app, liberar } = montar(host, data, modulo, () => {});
  try {
    const r = tipo === 'lamina' ? await app.buildSheet() : await app.buildVideo({ signal, onProgress });
    const v = await REV.vigencia(data.pkg, r.revision);
    comprobarCancelacion();
    REV.recordar(data.pkg, modulo, tipo === 'video' ? 'video' : 'sheet', r);
    return Object.freeze({ modulo, tipo, formato: tipo === 'lamina' ? 'PNG · A3 apaisado 420 × 297 mm · 200 ppp' : 'MP4 · H.264 · 1920 × 1080 · 30 fps', mime: tipo === 'lamina' ? 'image/png' : 'video/mp4',
      blob: r.blob, sha256: r.sha256, revision: r.revision, firma: r.firma?.estudio ?? HERO.firma(data.pkg, modulo)?.estudio ?? null, meta: r.meta || null, vigente: v.vigente,
      nombre: `${modulo === 'blueprint' ? (tipo === 'lamina' ? 'lamina-blueprint' : 'blueprint') : (tipo === 'lamina' ? 'lamina-despiece' : 'despiece')}-${data.pkg.projectId}-${r.revision.slice(0, 8)}.${tipo === 'lamina' ? 'png' : 'mp4'}` });
  } finally { liberar(); window.BPDP = BPDP0 || null; }
}
/** Estado de la última salida preparada para la revisión activa: null | { revision, vigente, actual, sha256 }. */
export async function estado(modulo, tipo) {
  const pkg = { projectId: window.FloorPlanApp?.project?.id, source: { live: true } }, r = REV.ultima(pkg, modulo, tipo === 'video' ? 'video' : 'sheet'); if (!r) return null;
  const v = await REV.vigencia(pkg, r.revision); return { revision: r.revision, sha256: r.sha256, vigente: v.vigente, actual: v.actual };
}
/** Descarga una salida SOLO si sigue vigente (si el proyecto cambió, se rechaza y hay que prepararla de nuevo). */
export async function descargar(salida) {
  const v = await REV.vigencia({ source: { live: true } }, salida.revision); if (!v.vigente) throw Object.assign(Error('La salida es obsoleta: el proyecto ha cambiado. Prepárala de nuevo.'), { code: 'STALE', vigencia: v });
  const { download } = await import('./outputs.js'); download(salida.blob, salida.nombre); return true;
}

// ── tarjetas de Entregar ──
async function revisionActual() { const p = window.FloorPlanApp?.project; if (!p) return null; return (REV.probeFor({ source: { live: true } }))(); }
function estadoSalidas(modulo, rev) {
  const pkg = { projectId: window.FloorPlanApp?.project?.id };
  return ['lamina', 'video'].map(t => { const r = REV.ultima(pkg, modulo, t === 'video' ? 'video' : 'sheet'); if (!r) return null;
    return `${t === 'video' ? 'Último vídeo' : 'Última lámina'}: ${r.revision === rev ? 'vigente' : 'OBSOLETA (el proyecto cambió)'} · revisión ${r.revision.slice(0, 8)}`; }).filter(Boolean);
}
const tarjetas = new Map();
function pintarTarjeta(c, modulo) {
  const M = MOD[modulo], ok3d = es3d(); c.replaceChildren();
  const fig = document.createElement('figure'); fig.className = 'is-scheme bpdp-card-figure'; c.append(fig);
  if (!window.FloorPlanProjectPreview?.axonometric?.(fig)) { const s = document.createElement('span'); s.textContent = 'Proyecto 3D'; fig.append(s); }
  const body = document.createElement('div'); body.className = 'bpdp-card-body'; c.append(body);
  const h = document.createElement('h3'); h.textContent = M.h3; body.append(h);
  const p = document.createElement('p'); p.textContent = M.que; body.append(p);
  const st = document.createElement('p'); st.className = 'professional-state'; st.id = `bpdpState-${modulo}`; st.setAttribute('role', 'status'); body.append(st);
  const firma = HERO.firma({ source: { live: true }, project: window.FloorPlanApp?.project, projectId: window.FloorPlanApp?.project?.id, label: '' }, modulo);
  st.textContent = ok3d ? `Se prepara al pulsar · Lámina PNG A3 · Vídeo MP4 1920 × 1080 · Firma: ${firma?.estudio || 'sin firma (solo título)'}` : 'Requiere la vista 3D: la escena se toma de lo que se ve allí.';
  const listo = revisionActual().then(rev => { if (!rev || !st.isConnected) return; const extra = estadoSalidas(modulo, rev); if (extra.length) st.textContent += ' · ' + extra.join(' · '); st.dataset.revision = rev; });
  const row = document.createElement('div'); row.className = 'bpdp-card-actions'; body.append(row);
  const btn = (id, label, fn, primary) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn' + (primary ? ' primary' : ''); b.id = id; b.textContent = label; b.onclick = fn; row.append(b); return b; };
  const fallo = e => { st.textContent = e.message; };
  c.listo = listo;
  if (!ok3d) { btn(`bpdpOpen3d-${modulo}`, 'Abrir la vista 3D', async e => {
    const button = e.currentTarget; button.disabled = true;
    try { await activar3D(); await refrescarTarjetas(); document.getElementById(`bpdpOpen-${modulo}`)?.focus(); }
    catch (error) { fallo(error); button.disabled = false; button.focus(); }
  }, true); return; }
  btn(`bpdpOpen-${modulo}`, M.abrir, e => abrir(modulo, { origen: e.currentTarget }).catch(fallo), true);
  btn(`bpdpSheet-${modulo}`, 'Previsualizar lámina', e => abrir(modulo, { origen: e.currentTarget, accion: 'lamina' }).catch(fallo));
  btn(`bpdpVideo-${modulo}`, 'Preparar vídeo', e => abrir(modulo, { origen: e.currentTarget, accion: 'video' }).catch(fallo));
}
// Repintar una tarjeta (estado de sus salidas) conserva el foco del profesional en el mismo botón.
function refrescarTarjetas() { const foco = document.activeElement?.id || null, esperas = [];
  for (const [c, m] of [...tarjetas]) if (c.isConnected) { pintarTarjeta(c, m); esperas.push(c.listo); } else tarjetas.delete(c);
  if (foco && document.activeElement?.id !== foco) document.getElementById(foco)?.focus({ preventScroll: true });
  return Promise.all(esperas); }
export function card(container, modulo) {
  if (!container || !MOD[modulo]) return null; css(); container.querySelector(`#bpdpCard-${modulo}`)?.remove();
  const c = document.createElement('article'); c.className = 'professional-card bpdp-card'; c.id = `bpdpCard-${modulo}`; c.dataset.module = `bpdp-${modulo}`;
  container.append(c); tarjetas.set(c, modulo); pintarTarjeta(c, modulo); return c;
}

// ── activación independiente por módulo hasta que Entregar llame a card() ──
function activos() {
  const q = new URLSearchParams(location.search).get('bpdp'); let ls = null; try { ls = localStorage.getItem('rubik-sota-bpdp-v1'); } catch { }
  return new Set(String(q ?? ls ?? Object.keys(MOD).join(',')).split(',').map(s => s.trim()).filter(s => MOD[s]));
}
function automontar() {
  const on = activos(); if (!on.size) return;
  const mount = () => { const g = document.querySelector('#professionalWorkspace [data-group="experience"] .professional-group-items'); if (!g) return;
    for (const m of on) if (!g.querySelector(`#bpdpCard-${m}`)) card(g, m); };
  new MutationObserver(mount).observe(document.body, { childList: true, subtree: true }); mount();
}
window.BpdpEntregar = Object.freeze({ version: 'bpdp-entregar/2', modulos: Object.keys(MOD), salidas: ['lamina', 'video'], card, abrir, preparar, estado, descargar, activar3D, get abierta() { return abierta ? { modulo: abierta.modulo, revision: abierta.revision } : null } });
window.addEventListener('floorplan-view-ready', () => { if (tarjetas.size) void refrescarTarjetas(); });
automontar();
