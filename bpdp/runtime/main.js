/* BP-DP PREMIUM · entrada de la experiencia: elección → runtime → aplicación; «Volver» regresa a la elección.
 * Enlaces directos: #blueprint-synthetic, #blueprint-rubik-real, #despiece-synthetic, #despiece-rubik-real. */
import { loadPackage, createStudio } from './studio.js';
import { mountBlueprint } from './blueprint-app.js';
import { mountDespiece } from './despiece-app.js';
const $ = id => document.getElementById(id);
import { shellFor } from './shell.js';
const shell = shellFor($('app'));
const cache = new Map();
let current = null;
async function open(module, scenario) {
  close(); const launch = $('launch'); launch.hidden = true;
  shell.top.innerHTML = `<div class="mark">Cargando…</div>`;
  const t0 = performance.now();
  try {
    if (!cache.has(scenario)) cache.set(scenario, await loadPackage(`data/${scenario}`));
    const data = cache.get(scenario), S = createStudio(shell.stage, data, { style: module === 'blueprint' ? 'blueprint' : 'archviz' });
    const app = (module === 'blueprint' ? mountBlueprint : mountDespiece)(shell, S, { onBack: () => { if (window.__bpdpDemo) { location.href = new URL('../', location.href).href; return; } close(); launch.hidden = false; history.replaceState(null, '', location.pathname); launch.querySelector(`[data-open="${module}:${scenario}"]`)?.focus(); } });
    current = { module, scenario, S, app, openedMs: performance.now() - t0 };
    window.BPDP = { module, scenario, studio: S, app, openedMs: current.openedMs };
    history.replaceState(null, '', `#${module}-${scenario}`);
  } catch (e) { shell.top.innerHTML = `<div class="mark">No se pudo abrir</div><span class="badge">${String(e.message || e)}</span>`; launch.hidden = false; throw e; }
}
function close() { if (!current) return; current.app.unmount(); current.S.dispose(); shell.clear(); current = null; window.BPDP = null; }
document.addEventListener('click', e => { const b = e.target.closest('[data-open]'); if (!b) return; const [m, s] = b.dataset.open.split(':'); open(m, s); });
// ── DEMOS DE LA HOME («Descubre RUBIK en acción»): ?demo=blueprint | ?demo=despiece[&escena=rubik-real] ──
// Vista representativa al abrir + una acción comprobada; la escena sintética se identifica; «Volver al inicio» vuelve a RUBIK.
const DEMOS = {
  blueprint: { scenario: 'rubik-real', tag: 'Demostración · Blueprint 3D con la vivienda de ejemplo de RUBIK', action: 'Ver la presentación técnica',
    ready: app => { app.setView('plan'); app.setIntent('measure'); }, run: app => app.setIntent('present') },
  despiece: { scenario: 'synthetic', tag: 'Demostración · Despiece 3D con una ESCENA SINTÉTICA (no es una vivienda real)', action: 'Separar y volver a montar',
    ready: () => { }, run: async app => { app.animateTo(0); await new Promise(r => { const f = () => app.state.playing ? requestAnimationFrame(f) : r(); requestAnimationFrame(f); }); await new Promise(r => setTimeout(r, 600)); app.animateTo(1); } } };
async function demo(id, escena) {
  const D = DEMOS[id]; if (!D) return false; const scenario = escena === 'rubik-real' || escena === 'synthetic' ? escena : D.scenario;
  const home = new URL('../', location.href).href; document.body.dataset.demo = id;
  await open(id, scenario); const bar = document.createElement('div'); bar.className = 'demo-bar'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Demostración');
  const tag = scenario === 'synthetic' ? 'Demostración · Despiece 3D con una ESCENA SINTÉTICA (no es una vivienda real)' : id === 'despiece' ? 'Demostración · Despiece 3D con la vivienda de ejemplo de RUBIK' : D.tag;
  bar.innerHTML = `<span class="demo-tag">${tag}</span><button type="button" class="btn primary" id="bpdpDemoAction">${D.action}</button>${id === 'despiece' ? `<a class="btn" id="bpdpDemoScene" href="?demo=despiece&escena=${scenario === 'synthetic' ? 'rubik-real' : 'synthetic'}">${scenario === 'synthetic' ? 'Ver con la vivienda de ejemplo' : 'Ver la escena constructiva sintética'}</a>` : ''}<a class="btn" id="bpdpDemoHome" href="${home}">Volver al inicio</a>`;
  shell.top.appendChild(bar); D.ready(window.BPDP.app);
  bar.querySelector('#bpdpDemoAction').addEventListener('click', () => D.run(window.BPDP.app));
  return true;
}
const q = new URLSearchParams(location.search);
// En una demo, «Volver» desde el primer paso vuelve a la Home de RUBIK (nunca a una pantalla intermedia del laboratorio).
if (q.get('demo') && DEMOS[q.get('demo')]) { window.__bpdpDemo = q.get('demo'); demo(q.get('demo'), q.get('escena')); }
else { const h = location.hash.slice(1), m = h.match(/^(blueprint|despiece)-(synthetic|rubik-real)$/); if (m) open(m[1], m[2]); }
window.BPDP_open = open; window.BPDP_close = () => { close(); $('launch').hidden = false; };
