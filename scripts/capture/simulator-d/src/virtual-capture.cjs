'use strict';
/* SCULPT Simulator · D · Captura reproducible por TIEMPO VIRTUAL sobre la app real de RUBIK (laboratorio).
 *
 * Valor diferencial recuperado de simulator@57d562c (MIT):
 *  - `sims/capture.mjs`: avanzar el tiempo fotograma a fotograma (no grabar en tiempo real), stills en instantes
 *    exactos con rótulo t=, hoja de revisión, informe de la GPU usada.
 *  - `sims/kit/runtime.js`: el contrato «render(t) es función pura de t» y el modo captura sin bucle propio.
 * Generalización para RUBIK (que NO es puro en t): en lugar de exigir `SIM.render(t)`, se instala el reloj virtual de
 * Playwright (Date, performance.now, setTimeout y requestAnimationFrame) antes de cargar la app, y se avanza en pasos de
 * 1/fps. Las autoridades de RUBIK no cambian: la cámara y las animaciones siguen siendo las de View3D / presentación;
 * esto solo controla el tiempo y observa. Ni un archivo del producto se modifica.
 * REPLACE: ffmpeg → hoja compuesta con Chromium; `file://` → servidor local con red externa bloqueada.
 * REMOVE: música, análisis de ritmo, mezcla de audio (piedra F en HOLD), DPR 4/3 fijo, rutas del kit.
 */
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), crypto = require('node:crypto'), os = require('node:os');
const { execFileSync } = require('node:child_process');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.glb': 'model/gltf-binary', '.svg': 'image/svg+xml', '.wasm': 'application/wasm', '.hdr': 'application/octet-stream', '.txt': 'text/plain' };
const EPOCH = Date.parse('2026-01-01T00:00:00Z'); // origen fijo del reloj: Date.now() y performance.now() reproducibles
// Recorte por rectángulo, no `locator.screenshot()`: esta espera a que el elemento esté «estable» con requestAnimationFrame,
// que está congelado con el reloj en pausa (se colgaba en la presentación). null = ventana completa.
async function shot(page, selector) {
  if (!selector) return page.screenshot({ animations: 'allow', caret: 'initial' });
  const r = await page.evaluate(sel => { const e = document.querySelector(sel); if (!e) return null; const b = e.getBoundingClientRect(); return { x: Math.max(0, b.left), y: Math.max(0, b.top), width: Math.min(innerWidth, b.right) - Math.max(0, b.left), height: Math.min(innerHeight, b.bottom) - Math.max(0, b.top) }; }, selector);
  if (!r || r.width < 1 || r.height < 1) throw err('NO_TARGET', 'Capture target is not visible: ' + selector);
  if (selector !== CANVAS3D) return page.screenshot({ clip: r, animations: 'allow', caret: 'initial' });
  // Alcance canvas3d = SOLO el render WebGL. El recorte del rectángulo incluía las capas del interfaz superpuestas (pista
  // #hint3d semitransparente, etiquetas CSS2D, paneles). Medido: el antialiasing de la esquina de #hint3d variaba entre
  // sesiones (≤22 px, Δ≤27) según la composición de capas del compositor, no el 3D. Durante la foto una hoja temporal deja
  // visible solo el lienzo (visibility: no cambia la maquetación ni el estado) y se retira en el acto.
  await page.evaluate(sel => { const st = document.createElement('style'); st.id = '__vcCanvasOnly';
    st.textContent = `body *{visibility:hidden!important}${sel}{visibility:visible!important}`; document.head.append(st); }, selector);
  try { return await page.screenshot({ clip: r, animations: 'allow', caret: 'initial' }); }
  finally { await page.evaluate(() => document.getElementById('__vcCanvasOnly')?.remove()); }
}
const CANVAS3D = '#view3d canvas';
const err = (code, msg) => Object.assign(Error(msg), { code });
/** Espera máxima en TIEMPO REAL: con el reloj virtual en pausa, una promesa de la app que dependa del tiempo nunca se
 *  resuelve (causa medida del bloqueo `FloorPlanPresentation.stop()` + settle). Ninguna llamada a la página puede
 *  esperar indefinidamente: pasado `ms`, error REALTIME_TIMEOUT. */
function withDeadline(promise, ms, what) {
  let timer; const guard = new Promise((_, reject) => { timer = setTimeout(() => reject(err('REALTIME_TIMEOUT', `${what} did not finish within ${ms} ms of real time (a page promise waiting on the paused virtual clock?)`)), ms); });
  return Promise.race([promise, guard]).finally(() => clearTimeout(timer));
}
/** Lanza una acción de la app SIN esperar la promesa que devuelva (regla del reloj en pausa). Devuelve el valor si no es
 *  una promesa; si lo es, 'detached' (avanza el reloj con advanceUntil para que progrese). */
function act(page, fn, arg) {
  return page.evaluate(([src, a]) => { const r = (0, eval)('(' + src + ')')(a); if (r && typeof r.then === 'function') { r.catch(() => {}); return 'detached'; } return r === undefined ? null : r; }, [fn.toString(), arg === undefined ? null : arg]);
}
// Las transiciones y animaciones CSS corren en el reloj del COMPOSITOR, que page.clock no gobierna (fotogramas distintos
// entre ejecuciones en el fundido 2D→3D). Se virtualizan con la Web Animations API: cada animación se pausa al aparecer y
// su currentTime = tiempo virtual transcurrido desde su nacimiento. Fieles (no se desactivan) y deterministas.
async function syncCss(page) {
  return page.evaluate(() => {
    const now = Date.now(), born = window.__vcCss || (window.__vcCss = new WeakMap()); let n = 0;
    for (const a of document.getAnimations()) {
      if (!born.has(a)) { born.set(a, now); a.pause(); }
      const d = a.effect && a.effect.getComputedTiming ? a.effect.getComputedTiming().endTime : Infinity, el = now - born.get(a);
      if (Number.isFinite(d) && el >= d) a.finish(); // termina de verdad: dispara finish/transitionend (la app puede esperarlos)
      else a.currentTime = el; n++;
    }
    return n;
  });
}
// Instante 0 de cada secuencia: la siguiente hora en punto del reloj virtual (mismo valor en cada ejecución equivalente).
async function zero(page) { const now = await page.evaluate(() => Date.now()); const t = (Math.floor((now - EPOCH) / 3600e3) + 1) * 3600e3 + EPOCH; await page.clock.pauseAt(t); return t; }

/** Abre RUBIK (árbol `root`) con reloj virtual instalado y red externa bloqueada. */
async function openRubik({ root, viewport = { width: 960, height: 600 }, dpr = 1, browser: name = 'chromium', input = null, example = true, realtimeMs = 60000 } = {}) {
  if (!root || !fs.existsSync(path.join(root, 'index.html'))) throw err('ROOT', 'RUBIK root with index.html is required');
  const external = [], server = http.createServer((req, res) => {
    try { const p = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://l').pathname.replace(/^\/$/, '/index.html')));
      if (!p.startsWith(root + path.sep)) throw 0; res.setHeader('Content-Type', TYPES[path.extname(p)] || 'application/octet-stream'); res.end(fs.readFileSync(p)); }
    catch { res.writeHead(404); res.end(); }
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}/`, pw = require('playwright');
  // Composición síncrona (Chromium). Se mantiene porque no perjudica, pero NO elimina la variación de las capas DOM sobre el
  // WebGL en el alcance `window` (medido con y sin ella: hasta 1.131 px, Δ52, solo sobre el lienzo). Esa variación la cubre el
  // contrato medido de EQUIVALENCIA.md; `canvas3d` aísla el lienzo y es exacto.
  const DETERMINISTIC = ['--run-all-compositor-stages-before-draw', '--disable-threaded-animation', '--disable-threaded-scrolling', '--disable-checker-imaging', '--disable-image-animation-resync'];
  const args = name === 'chromium' ? ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', ...(process.env.VCAP_NO_DET_FLAGS ? [] : DETERMINISTIC)] : [];
  const browser = await pw[name].launch({ ...(name === 'chromium' && process.env.CHROME ? { executablePath: process.env.CHROME } : {}), args });
  const context = await browser.newContext({ viewport, deviceScaleFactor: dpr, reducedMotion: 'no-preference' });
  await context.route('**/*', r => (r.request().url().startsWith(base) ? r.continue() : (external.push(r.request().url()), r.abort())));
  const page = await context.newPage(), errors = [], inflight = new Set();
  // Toda interacción con la página queda acotada en tiempo real (realtimeMs, por defecto 60 s).
  const ev = page.evaluate.bind(page), shotRaw = page.screenshot.bind(page), runRaw = page.clock.runFor.bind(page.clock);
  page.evaluate = (fn, arg) => withDeadline(ev(fn, arg), realtimeMs, 'page.evaluate');
  page.screenshot = o => withDeadline(shotRaw(o), realtimeMs, 'page.screenshot');
  page.clock.runFor = ms => withDeadline(runRaw(ms), realtimeMs, 'page.clock.runFor');
  // La red va en tiempo REAL: una textura que llega a mitad de secuencia la haría irrepetible. El reposo exige 0 en curso.
  page.on('request', r => inflight.add(r)); page.on('requestfinished', r => inflight.delete(r)); page.on('requestfailed', r => inflight.delete(r));
  page.__vcInflight = inflight;
  page.on('pageerror', e => errors.push(e.message));
  await page.clock.install({ time: EPOCH }); // ANTES de cualquier script de la app
  // Las animaciones y transiciones CSS avanzan en el reloj REAL del compositor: una transición corta (p. ej. la pista
  // de ayuda del 3D, 0,4 s) podía empezar y terminar en tiempo real entre dos pasos virtuales y no verse nunca, según la
  // carga de la máquina (causa medida de las diferencias de ventana entre sesiones). Se congela la línea de tiempo de
  // animaciones del navegador; syncCss las conduce después con el tiempo virtual. Chromium (CDP); en otros motores se
  // declara en el informe que la ventana completa no tiene esta garantía.
  page.__vcFrozenAnimations = false;
  if (name === 'chromium') { const cdp = await context.newCDPSession(page); await cdp.send('Animation.enable'); await cdp.send('Animation.setPlaybackRate', { playbackRate: 1e-6 }); /* 0 detiene la producción de fotogramas (las capturas se cuelgan); 1e-6: 0,4 s tardarían 4,6 días reales */ page.__vcCdp = cdp; page.__vcFrozenAnimations = true; }
  await page.goto(base);
  await page.waitForFunction(() => window.FloorPlanApp && window.View3D, null, { timeout: 120000 });
  if (input) {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vcap-')), f = path.join(tmp, 'project.json'); fs.writeFileSync(f, typeof input === 'string' ? input : JSON.stringify(input));
    await page.evaluate(() => document.querySelector('#welcomeDialog')?.close?.());
    await page.locator('#fileIn').setInputFiles(f);
    const id = (typeof input === 'string' ? JSON.parse(input) : input).id;
    await page.waitForFunction(i => window.FloorPlanApp.project?.id === i, id, { timeout: 120000 });
  } else if (example) await page.locator('#welcomeExample').click().catch(() => {});
  // Limpieza garantizada: si el navegador no cierra en 10 s reales, se mata su proceso; el servidor siempre se cierra.
  const close = async () => { try { await withDeadline(browser.close(), 10000, 'browser.close'); } catch { try { browser.process?.()?.kill('SIGKILL'); } catch {} } finally { server.close(); server.closeAllConnections?.(); } };
  return { page, browser, context, close, external, errors, base, root, viewport, dpr, browserName: name };
}

/** Avanza el reloj hasta que la vista 3D esté en reposo: sin animación, vuelo ni recursos pendientes, y el lienzo
 *  idéntico `stable` pasos seguidos (regla de estabilidad de OP-10 aplicada a píxeles). Devuelve los pasos usados. */
async function settle(page, { fps = 30, stable = 3, maxSeconds = 60, selector = '#view3d canvas', signal } = {}) {
  let same = 0, last = null; const netStart = Date.now();
  for (let i = 0; i < maxSeconds * fps; i++) {
    if (signal?.aborted) throw err('CANCELLED', 'Capture cancelled');
    // Recursos asíncronos que corren en tiempo REAL fuera de lifecycleMetrics: la luz HDR de la presentación
    // (descarga + SHA-256 + decodificación + PMREM; `presentationLight.status === 'loading'`). Medido: sin esta espera,
    // dos ejecuciones de presentationNext diferían en TODOS los fotogramas (3.768 px, Δ 7) por empezar con otra luz.
    const asyncBusy = await page.evaluate(() => window.View3D.presentationLight?.status === 'loading').catch(() => false);
    if ((page.__vcInflight && page.__vcInflight.size) || asyncBusy) { // espera REAL a la red y a esos recursos, acotada
      if (Date.now() - netStart > 120000) throw err('NETWORK', 'Resources still loading after 120 s: ' + ([...page.__vcInflight].slice(0, 3).map(r => r.url()).join(', ') || 'presentation HDR light'));
      await new Promise(r => setTimeout(r, 50)); same = 0; last = null; i--; continue;
    }
    await page.clock.runFor(1000 / fps); await syncCss(page);
    const busy = await page.evaluate(() => { const m = window.View3D.lifecycleMetrics || {}; return !!(m.animating || m.flying || m.pendingAssets); });
    if (busy) { same = 0; last = null; continue; }
    const h = sha(await shot(page, selector));
    same = h === last ? same + 1 : 0; last = h;
    if (same >= stable) return i + 1;
  }
  throw err('UNSTABLE', 'The 3D view did not settle within ' + maxSeconds + ' s of virtual time');
}

/** Con el reloj en pausa, una espera de la app solo progresa si el tiempo avanza: avanza en pasos hasta que `fn` sea cierto. */
async function advanceUntil(page, fn, arg, { fps = 30, maxSeconds = 60, signal } = {}) {
  for (let i = 0; i < maxSeconds * fps; i++) { if (signal?.aborted) throw err('CANCELLED', 'Cancelled'); if (await page.evaluate(fn, arg)) return i; await page.clock.runFor(1000 / fps); }
  throw err('TIMEOUT', 'Condition not reached within ' + maxSeconds + ' s of virtual time');
}

/** Ejecuta `action(page)` en el instante virtual 0 y captura a `fps` hasta el reposo (o `seconds`). Determinista. */
async function captureSequence(session, { action, started = null, beforeFrame = null, fps = 30, seconds = null, maxSeconds = 20, idleFrames = 3, out = null, selector = '#view3d canvas', label = 'sequence', signal } = {}) {
  const { page } = session;
  if (typeof action !== 'function') throw err('ACTION', 'action(page) is required');
  if (out && fs.existsSync(out)) throw err('OVERWRITE', 'Refusing overwrite: ' + out);
  const snap = () => page.evaluate(() => { const dump = s => { const o = {}; try { for (let i = 0; i < s.length; i++) { const k = s.key(i); o[k] = s.getItem(k); } } catch {} return o; };
    return { project: JSON.stringify(window.FloorPlanApp.project), local: JSON.stringify(dump(localStorage)), session: JSON.stringify(dump(sessionStorage)) }; });
  const before = await snap(), cdp = await page.context().newCDPSession(page).catch(() => null);
  if (cdp) await cdp.send('Performance.enable').catch(() => {});
  const heap = async () => { if (!cdp) return null; try { const m = (await cdp.send('Performance.getMetrics')).metrics; const g = n => (m.find(x => x.name === n) || {}).value; return { jsHeapUsedBytes: g('JSHeapUsedSize'), domNodes: g('Nodes') }; } catch { return null; } };
  const memStart = await heap(), wall = [];
  await zero(page);
  await withDeadline(Promise.resolve(action(page)), 60000, 'action');
  const frames = [], limit = Math.round((seconds ?? maxSeconds) * fps);
  if (out) fs.mkdirSync(path.join(out, 'frames'), { recursive: true });
  // `started`: predicado en la página; el reposo solo cuenta cuando la acción ya está en marcha (setView y otras son asíncronas).
  let idle = 0, begun = !started;
  for (let i = 0; i <= limit; i++) {
    if (signal?.aborted) throw err('CANCELLED', 'Capture cancelled');
    const w0 = performance.now();
    if (i) await page.clock.runFor(1000 / fps);
    if (beforeFrame) await beforeFrame(page, i / fps, i); // p. ej. B: aplicar la pose del plan de rodaje en t
    const css = await syncCss(page);
    if (!begun) begun = await page.evaluate(started);
    const png = await shot(page, selector), h = sha(png);
    const m = await page.evaluate(() => { const x = window.View3D.lifecycleMetrics || {}, c = window.View3D.cameraState; return { animating: !!x.animating, flying: !!x.flying, pendingAssets: x.pendingAssets || 0, camera: c ? c.position.map(v => Math.round(v * 1e6) / 1e6) : null }; }); // camera: pose observada (solo lectura) para E
    const f = { i, t: Math.round(i / fps * 1e6) / 1e6, sha256: h, cssAnimations: css, ...m };
    if (out) { f.file = `frames/${String(i).padStart(5, '0')}.png`; fs.writeFileSync(path.join(out, f.file), png); }
    frames.push(f); wall.push(performance.now() - w0);
    if (seconds == null && begun) { idle = (!m.animating && !m.flying && !m.pendingAssets && frames.length > 1 && frames[frames.length - 2].sha256 === h) ? idle + 1 : 0; if (idle >= idleFrames) break; }
  }
  if (seconds == null && !begun) throw err('NOT_STARTED', 'The action never started within ' + maxSeconds + ' s of virtual time');
  if (seconds == null && idle < idleFrames) throw err('UNSTABLE', `Sequence did not come to rest within ${maxSeconds} s of virtual time`);
  const after = await snap();
  if (before.project !== after.project) throw err('MUTATION', 'The captured action changed the project');
  if (before.local !== after.local || before.session !== after.session) throw err('MUTATION_STORAGE', 'The captured action changed localStorage or sessionStorage');
  // Reposo de OP-02 al terminar: sin bucle de render pendiente, sin animación ni vuelo (el reloj virtual no deja trabajo vivo).
  const rest = await page.evaluate(() => { const m = window.View3D.lifecycleMetrics || {}; return { loopActive: !!m.loopActive, animating: !!m.animating, flying: !!m.flying, pendingAssets: m.pendingAssets || 0 }; });
  const memEnd = await heap(); if (cdp) await cdp.detach().catch(() => {});
  const sorted = [...wall].sort((a, b) => a - b), pct = q => sorted.length ? Math.round(sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] * 10) / 10 : null;
  const scope = selector == null ? 'window' : selector === '#view3d canvas' ? 'canvas3d' : 'element';
  return { label, fps, scope, selector, frames, rest, perf: { msPerFrame: { p50: pct(0.5), p95: pct(0.95), max: pct(1) }, memoryStart: memStart, memoryEnd: memEnd, nodeRssBytes: process.memoryUsage().rss }, durationS: frames.length ? frames[frames.length - 1].t : 0, sequenceSha256: sha(frames.map(f => f.sha256).join('\n')), distinctFrames: new Set(frames.map(f => f.sha256)).size };
}

/** Stills en instantes exactos (segundos desde la acción), cada uno con su rótulo t= solo en la imagen guardada. */
async function captureStills(session, { action, times, out, selector = '#view3d canvas', signal }) {
  const { page } = session;
  if (fs.existsSync(out)) throw err('OVERWRITE', 'Refusing overwrite: ' + out);
  fs.mkdirSync(out, { recursive: true });
  await zero(page);
  await withDeadline(Promise.resolve(action(page)), 60000, 'action');
  const rows = []; let now = 0;
  for (const [i, t] of times.entries()) {
    if (signal?.aborted) throw err('CANCELLED', 'Capture cancelled');
    if (t > now) { await page.clock.runFor(Math.round((t - now) * 1000)); now = t; }
    await syncCss(page);
    const png = await shot(page, selector), file = `${String(i).padStart(3, '0')}.png`;
    fs.writeFileSync(path.join(out, file), png); rows.push({ i, t, file, sha256: sha(png) });
  }
  return rows;
}

/** Hoja de revisión (sustituye el `ffmpeg tile` del donante): rejilla con rótulo t= por imagen, compuesta en Chromium. */
async function contactSheet(session, { dir, rows, out, title = '', cols = 4, width = 1600 }) {
  if (fs.existsSync(out)) throw err('OVERWRITE', 'Refusing overwrite: ' + out);
  const img = f => 'data:image/png;base64,' + fs.readFileSync(path.join(dir, f)).toString('base64');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const html = `<!doctype html><meta charset="utf-8"><style>body{margin:0;padding:14px;background:#eceeee;font:13px/1.3 system-ui;color:#1f2326;width:${width - 28}px}
   h1{font-size:14px;margin:0 0 10px}.g{display:grid;grid-template-columns:repeat(${cols},1fr);gap:8px}figure{margin:0;position:relative}
   img{width:100%;display:block;border:1px solid #d5d9db}figcaption{position:absolute;right:6px;top:6px;font:600 12px ui-monospace,monospace;color:#fff;background:rgba(0,0,0,.65);padding:2px 6px;border-radius:4px}</style>
   <h1>${esc(title)}</h1><div class="g">${rows.map(r => `<figure><img src="${img(r.file)}"><figcaption>t=${r.t.toFixed(2)}</figcaption></figure>`).join('')}</div>`;
  const p = await session.browser.newPage({ viewport: { width, height: 60 } });
  await p.setContent(html); await p.waitForLoadState('load');
  await p.screenshot({ path: out, fullPage: true }); await p.close();
  return { file: out, sha256: sha(fs.readFileSync(out)) };
}

/** Procedencia: qué código, navegador y GPU produjeron la secuencia (el donante imprimía la GPU en cada ejecución). */
async function provenance(session) {
  const gpu = await session.page.evaluate(() => { const gl = document.createElement('canvas').getContext('webgl2'), e = gl && gl.getExtension('WEBGL_debug_renderer_info'); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'unknown'; });
  let head = null; try { head = execFileSync('git', ['-C', session.root, 'rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch {}
  // Sin git (p. ej. `git archive`): huella del contenido servido (index.html + js/ + css/), reproducible y comparable.
  const files = ['index.html', ...['js', 'css'].flatMap(d => { try { return fs.readdirSync(path.join(session.root, d)).sort().map(f => d + '/' + f); } catch { return []; } })].filter(f => fs.statSync(path.join(session.root, f)).isFile());
  const contentSha256 = sha(files.map(f => f + ' ' + sha(fs.readFileSync(path.join(session.root, f)))).join('\n'));
  return { rubikHead: head, rubikContentSha256: contentSha256, rubikContentFiles: files.length, indexHtmlSha256: sha(fs.readFileSync(path.join(session.root, 'index.html'))), browser: session.browserName, browserVersion: session.browser.version(), gpu,
    viewport: session.viewport, dpr: session.dpr, clock: { epoch: new Date(EPOCH).toISOString(), mode: 'playwright page.clock: Date, performance.now, timers and requestAnimationFrame virtualised', cssTimeline: session.page.__vcFrozenAnimations ? 'frozen (CDP Animation.setPlaybackRate 1e-6) and driven by virtual time' : 'NOT frozen: window-scope captures are not guaranteed' } };
}

/** Manifiesto de captura con el formato de procedencia de OP-10 y Studio (`format`, proyecto OBSERVADO, huellas exactas).
 *  El proyecto observado NO es una revisión F0 confirmada; la huella exacta de cada fotograma se conserva siempre. */
function manifest({ provenance: prov, sequences = [], stills = null, observedProject = null, equivalence = null, notes = [] }) {
  return { format: 'rubik-sota.d-capture', version: 1, createdBy: 'COMPONENTES/D-captura-reproducible', provenance: prov,
    observedProject: observedProject && { ...observedProject, meaning: 'the project as observed in the viewer at capture time; NOT a confirmed F0 transactional revision' },
    guarantee: { canvas3d: 'byte-exact per frame (sequenceSha256)', window: 'exact hashes recorded; equivalence only under the measured contract in EQUIVALENCIA.md', element: 'exact hashes recorded' },
    sequences: sequences.map(s => ({ label: s.label, scope: s.scope, fps: s.fps, frames: s.frames.length, durationS: s.durationS, distinctFrames: s.distinctFrames, sequenceSha256: s.sequenceSha256, rest: s.rest, perf: s.perf,
      frameHashes: s.frames.map(f => ({ i: f.i, t: f.t, sha256: f.sha256, ...(f.file ? { file: f.file } : {}) })) })),
    stills, equivalence, notes };
}
async function observedProject(page) {
  const p = await page.evaluate(() => window.FloorPlanApp.project);
  return { projectId: p.id, updatedAt: p.updatedAt || null, canonicalSha256: sha(JSON.stringify(p)) };
}
module.exports = { withDeadline, act, manifest, observedProject, syncCss, zero, advanceUntil, openRubik, settle, captureSequence, captureStills, contactSheet, provenance, EPOCH, sha };
