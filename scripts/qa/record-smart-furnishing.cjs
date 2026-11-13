#!/usr/bin/env node
'use strict';
/* UX-12 + UX-13 · grabación reproducible del amueblamiento inteligente en el editor REAL (Playwright + Chromium).
 *
 *   CHROME=/ruta/chrome node scripts/qa/record-smart-furnishing.cjs [carpeta]   (por defecto qa-results/smart-furnishing)
 *
 * Vídeo 1 (escritorio 1440×900, ratón) y vídeo 2 (móvil 390×844, toques táctiles de Chromium). Cada paso es una
 * interacción real de la interfaz (menú Archivo, clics o toques en el panel de la estancia); las lecturas de estado
 * pasan por un lector que FALLA si la lectura cambiara el proyecto, y el registro de eventos del propio panel
 * (FloorPlanSmartFurnishingUI.trace) prueba que la propuesta y la aplicación salieron de esos clics. Los vídeos no
 * sustituyen a las comprobaciones: si una falla, el script termina con error. Datos sintéticos; sin servicios externos. */
const fs = require('node:fs'), path = require('node:path'), { execFileSync } = require('node:child_process');
const assert = require('node:assert/strict');
const ROOT = path.resolve(__dirname, '..', '..');
const K = require(path.join(ROOT, 'tests/r02a/editor-kit.cjs')), Q = require(path.join(ROOT, 'tests/smart-furnishing/kit.cjs'));
const { verify } = require(path.join(ROOT, 'tests/smart-furnishing/verify.cjs')), Core = require(path.join(ROOT, 'js/project-core.js'));
const OUT = path.resolve(process.argv[2] || path.join(ROOT, 'qa-results/smart-furnishing'));
const PAUSE = Number(process.env.SF_PAUSE_MS || 900);
fs.mkdirSync(OUT, { recursive: true });
const doors = json => Core.geometry(JSON.parse(json)).doors.map(d => ({ h: d.h, c: d.c, o: d.o, len: d.len }));
const sh = (cmd, args) => { try { return execFileSync(cmd, args, { cwd: ROOT, encoding: 'utf8' }).trim(); } catch { return null; } };

async function run(env, spec) {
  const vidDir = fs.mkdtempSync(path.join(OUT, '.video-'));
  const context = await env.browser.newContext({ viewport: { width: spec.width, height: spec.height }, isMobile: !!spec.touch, hasTouch: !!spec.touch, recordVideo: { dir: vidDir, size: { width: spec.width, height: spec.height } } });
  const page = await context.newPage(), t0 = Date.now(), steps = [], shots = [], consoleErrors = [], network = [];
  page.on('pageerror', e => consoleErrors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) consoleErrors.push(m.text()); });
  page.on('requestfailed', r => { const u = r.url(); if (u.startsWith(env.base)) network.push({ url: u, error: r.failure()?.errorText }); });
  page.on('request', r => { const u = r.url(); if (!u.startsWith(env.base) && !/^(data|blob):/.test(u) && !u.startsWith('https://cdn.jsdelivr.net/')) network.push({ url: u, error: 'petición externa' }); });
  // Eventos que emite el propio panel al generar, aplicar, descartar… (sobreviven a la recarga de «reabrir»).
  const panelTrace = [];
  await page.exposeFunction('__sfRecord', detail => panelTrace.push({ ...detail, atMs: Date.now() - t0 }));
  await page.addInitScript(() => document.addEventListener('smart-furnishing', e => window.__sfRecord?.(e.detail)));
  await page.route('https://cdn.jsdelivr.net/**', r => r.abort());
  await page.goto(env.base); await require(path.join(ROOT, 'tests/editor-fixture.cjs'))(page);
  await page.waitForFunction(() => !!window.FloorPlanSmartFurnishingUI && !!window.FloorPlanApp);
  const pause = (k = 1) => page.waitForTimeout(PAUSE * k);
  async function step(name, fn) {
    const at = Date.now() - t0; let result = 'ok', detail;
    try { detail = await fn(); } catch (e) { result = 'fallo'; detail = e.message; steps.push({ step: name, atMs: at, result, detail }); throw e; }
    steps.push({ step: name, atMs: at, durationMs: Date.now() - t0 - at, result, ...(detail !== undefined ? { detail } : {}) });
  }
  async function shot(name) { const file = `${spec.name}-${String(shots.length + 1).padStart(2, '0')}-${name}.png`; await page.screenshot({ path: path.join(OUT, file) }); shots.push(file); }
  const touch = !!spec.touch, tap = loc => Q.tap(page, loc, touch);
  let result = 'ok', error = null;
  try { await spec.flow({ page, step, shot, pause, tap, touch }); }
  catch (e) { result = 'fallo'; error = e.stack || e.message; await shot('fallo').catch(() => {}); }
  const trace = panelTrace;
  const video = page.video(); await context.close();
  const raw = await video.path(), file = `${spec.name}.webm`; fs.renameSync(raw, path.join(OUT, file)); fs.rmSync(vidDir, { recursive: true, force: true });
  return { name: spec.name, viewport: { width: spec.width, height: spec.height, touch }, result, error, steps, screenshots: shots, video: file, consoleErrors, networkFailures: network, panelTrace: trace };
}

// ── Vídeo 1 · escritorio ──
async function desktop({ page, step, shot, pause, tap }) {
  let s0, n, sUrb;
  await step('1 · Abrir el proyecto (Archivo ▸ Importar proyecto JSON, sintético)', async () => {
    await Q.importFixture(page); await pause(); await shot('proyecto-abierto');
    const s = await Q.state(page); assert.equal(s.sf.length, 0, 'el proyecto abierto no tiene muebles de una propuesta'); return { objetos: s.objects };
  });
  await step('2 · Seleccionar el salón en el plano', async () => { await K.selectRoom(page, 'rom_living'); await pause(); });
  await step('3 · Abrir «Amueblar esta estancia»', async () => { await page.locator('#sfSummary').click(); await page.locator('#sfPanel').evaluate(e => e.scrollIntoView({ block: 'start' })); await pause(); await shot('panel'); });
  await step('4 · Uso real «Salón», densidad alta, receta «Nórdico claro», semilla 1', async () => {
    await page.locator('#sfUse').selectOption('living'); await pause(0.5); await page.locator('#sfDensity label', { hasText: 'Alta' }).click(); await pause(0.5);
    await page.locator('#sfRecipe').selectOption('nordico'); await pause(0.5); s0 = await Q.state(page);
  });
  await step('5 · Generar propuesta (el proyecto no cambia)', async () => {
    await page.locator('#sfGenerate').click(); await page.locator('#sfProposal').waitFor(); await pause();
    n = Number(await page.locator('#sfProposal').getAttribute('data-sf-count')); const s = await Q.state(page);
    assert.equal(s.json, s0.json); assert.equal(s.undo, s0.undo); assert.equal(await page.locator('#gSel .sf-preview [data-sf-item]').count(), n);
    await shot('propuesta-nordico'); return { piezas: n };
  });
  await step('6 · Inspeccionar cifras y distribución (plano centrado en el salón)', async () => {
    await page.locator('#sfItems').evaluate(e => e.scrollIntoView({ block: 'center' })); await pause();
    await page.locator('#sfView2D').click(); await pause(); await shot('distribucion-2d');
    return { lineas: await page.locator('#sfItems li').allInnerTexts() };
  });
  await step('7 · Cambiar a «Urbano compacto» y comprobar diferencias', async () => {
    await page.locator('#sfRecipe').selectOption('urbano'); await page.locator('#sfDiff').waitFor(); await page.locator('#sfDiff').evaluate(e => e.scrollIntoView({ block: 'center' })); await pause(1.5);
    const diff = await page.locator('#sfDiff li').allInnerTexts(); assert.ok(diff.length >= 2, 'la receta cambia piezas o colores');
    sUrb = await Q.state(page); assert.equal(sUrb.json, s0.json); await shot('urbano-diferencias'); return { diferencias: diff };
  });
  await step('7b · Ver la propuesta en 3D antes de aplicar', async () => {
    await page.locator('#sfView3D').click(); await page.waitForFunction(n => window.FloorPlanSmartFurnishingUI.meshes.length === n, n, { timeout: 60000 }); await pause(2); await shot('propuesta-3d');
    await page.locator('#viewSeg .btn[data-view="2d"]').click(); await page.waitForFunction(() => !is3D(), null, { timeout: 30000 }); await pause();
  });
  let s1;
  await step('8 · Aplicar (confirmando que la escala es estimada)', async () => {
    await page.locator('#sfAck').scrollIntoViewIfNeeded(); await page.locator('#sfAck').check(); await pause(0.5);
    await page.locator('#sfApply').click(); await page.locator('#sfApplied').waitFor(); await pause();
    s1 = await Q.state(page); assert.equal(s1.undo, s0.undo + 1, 'un paso de deshacer'); assert.equal(s1.sf.length, n);
    const v = verify(JSON.parse(s1.json), s1.sf, doors(s1.json)); assert.deepEqual(v, [], 'verificador independiente');
    return { añadidos: s1.sf.length, verificador: 'sin violaciones' };
  });
  await step('9 · Ver en 2D', async () => { await page.evaluate(() => fitView()); await pause(); await K.selectRoom(page, 'rom_living'); await pause(); await shot('aplicado-2d'); });
  await step('10 · Ver en 3D', async () => {
    await page.locator('#sfView3DApplied').click(); await page.waitForFunction(() => is3D() && document.body.classList.contains('m3d'), null, { timeout: 60000 }); await pause(2.5); await shot('aplicado-3d');
    await page.locator('#viewSeg .btn[data-view="2d"]').click(); await page.waitForFunction(() => !is3D(), null, { timeout: 30000 }); await pause();
  });
  await step('11 · Deshacer y rehacer (un paso, todo el conjunto)', async () => {
    await page.locator('#undo').click(); await pause(); let s = await Q.state(page); assert.equal(s.json, s0.json, 'deshacer deja el proyecto como antes'); await shot('deshecho');
    await page.locator('#redo').click(); await pause(); s = await Q.state(page); assert.equal(s.sf.length, n, 'rehacer devuelve todas las piezas'); await shot('rehecho');
  });
  await step('12 · Guardar y reabrir (recargar el editor)', async () => {
    await K.reopen(page); await pause(); const s = await Q.state(page); assert.equal(s.sf.length, n, 'al reabrir siguen todas');
    assert.deepEqual(JSON.parse(s.json).objects.filter(o => o.id.startsWith('obj_sf')), JSON.parse(s1.json).objects.filter(o => o.id.startsWith('obj_sf')));
    await K.selectRoom(page, 'rom_living'); await pause(); await shot('reabierto');
  });
  await step('13 · Rechazo legítimo: baño de invitados como dormitorio, no cabe', async () => {
    await K.selectRoom(page, 'rom_gbath'); await page.locator('#sfSummary').click(); await page.locator('#sfUse').selectOption('bedroom');
    const before = await Q.state(page); await page.locator('#sfGenerate').click(); await page.locator('#sfError').waitFor(); await page.locator('#sfError').evaluate(e => e.scrollIntoView({ block: 'center' })); await pause(1.5);
    assert.equal(await page.locator('#sfError').getAttribute('data-sf-status'), 'no-space'); assert.equal((await Q.state(page)).json, before.json); await shot('rechazo-sin-espacio');
    return { mensaje: await page.locator('#sfError').innerText() };
  });
}

// ── Vídeo 2 · móvil táctil ──
async function mobile({ page, step, shot, pause, tap }) {
  let s0, n;
  await step('1 · Abrir el proyecto (Archivo ▸ Importar proyecto JSON)', async () => { await Q.panel(page, false); await Q.importFixture(page); await Q.panel(page, false); await pause(); await shot('proyecto-abierto'); });
  await step('2 · Tocar el salón y abrir el panel', async () => { await K.selectRoom(page, 'rom_living', { touch: true }); await pause(0.5); await Q.panel(page, true); await pause(); });
  await step('3 · Abrir «Amueblar esta estancia» y configurar (Salón, media, Mediterráneo cálido)', async () => {
    await tap(page.locator('#sfSummary')); await pause(0.5); await page.locator('#sfUse').selectOption('living'); await pause(0.5);
    await tap(page.locator('#sfDensity label', { hasText: 'Media' })); await page.locator('#sfRecipe').selectOption('calido'); await pause(0.5); s0 = await Q.state(page); await shot('configurar');
  });
  await step('4 · Generar propuesta', async () => {
    await tap(page.locator('#sfGenerate')); await page.locator('#sfProposal').waitFor(); n = Number(await page.locator('#sfProposal').getAttribute('data-sf-count'));
    assert.equal((await Q.state(page)).json, s0.json); await page.locator('#sfItems').evaluate(e => e.scrollIntoView({ block: 'start' })); await pause(); await shot('propuesta');
    for (const id of ['#sfView2D', '#sfView3D', '#sfAnother', '#sfApply', '#sfDiscard']) { const b = await page.locator(id).boundingBox(); assert.ok(b && b.width >= 40 && b.height >= 36, `${id} tocable`); }
    return { piezas: n };
  });
  await step('5 · Ver en 2D: el panel se retira y la propuesta queda a la vista', async () => {
    await tap(page.locator('#sfView2D')); await page.waitForFunction(() => !document.querySelector('aside.right').classList.contains('open')); await pause(1.5);
    const visible = await page.$$eval('#gSel .sf-preview [data-sf-item] rect', rs => rs.filter(r => { const b = r.getBoundingClientRect(), x = b.x + b.width / 2, y = b.y + b.height / 2; return x > 0 && x < innerWidth && y > 0 && y < innerHeight && !!document.elementFromPoint(x, y)?.closest('#plan'); }).length);
    assert.ok(visible >= Math.min(3, n), `piezas visibles sobre el plano (${visible})`); await shot('propuesta-2d'); return { visibles: visible };
  });
  await step('6 · Volver al panel y aplicar', async () => {
    await Q.panel(page, true); await pause(0.5); await page.locator('#sfAck').scrollIntoViewIfNeeded(); await tap(page.locator('#sfAck')); await tap(page.locator('#sfApply')); await page.locator('#sfApplied').waitFor(); await pause();
    const s = await Q.state(page); assert.equal(s.undo, s0.undo + 1); assert.equal(s.sf.length, n); assert.deepEqual(verify(JSON.parse(s.json), s.sf, doors(s.json)), []); await shot('aplicado');
  });
  await step('7 · Ver en 3D', async () => {
    await tap(page.locator('#sfView3DApplied')); await page.waitForFunction(() => is3D() && document.body.classList.contains('m3d'), null, { timeout: 60000 }); await pause(2.5); await shot('aplicado-3d');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'sin desplazamiento horizontal');
  });
  await step('8 · Revisar en 2D', async () => { await tap(page.locator('#viewSeg .btn[data-view="2d"]')); await page.waitForFunction(() => !is3D(), null, { timeout: 30000 }); await Q.panel(page, false); await pause(1.5); await shot('revision-2d'); });
}

function probe(file) {
  const out = sh('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_name,width,height:format=duration,size,format_name', '-of', 'json', file]);
  if (!out) return { tool: 'ffprobe no disponible', sizeBytes: fs.statSync(file).size };
  const j = JSON.parse(out), v = (j.streams || []).find(s => s.width) || {};
  return { tool: 'ffprobe', format: j.format?.format_name, codec: v.codec_name, width: v.width, height: v.height, durationS: Number(Number(j.format?.duration).toFixed(2)), sizeBytes: Number(j.format?.size) };
}

(async () => {
  const env = await K.start(), started = new Date().toISOString(), runs = [];
  try {
    for (const spec of [{ name: 'escritorio-1440x900', width: 1440, height: 900, flow: desktop }, { name: 'movil-390x844', width: 390, height: 844, touch: true, flow: mobile }]) runs.push(await run(env, spec));
    var chromium = env.browser.version();
  } finally { await env.stop(); }
  for (const r of runs) {
    r.videoProbe = probe(path.join(OUT, r.video));
    // Veracidad: lo que el panel registró sale de los clics (generar por botón o al cambiar receta) y lo aplicado coincide.
    const gen = r.panelTrace.filter(e => e.type === 'generate'), app = r.panelTrace.find(e => e.type === 'apply');
    r.authenticity = { generateEvents: gen.map(e => e.reason), applyEvent: !!app, appliedIds: app?.ids?.length || 0, readOnlyReads: 'cada lectura de estado verificó que no cambiaba el proyecto' };
    if (r.result === 'ok' && (!gen.length || !app)) { r.result = 'fallo'; r.error = 'El panel no registró generar/aplicar: la grabación no muestra el flujo real.'; }
    if (r.consoleErrors.length || r.networkFailures.length) { r.result = 'fallo'; r.error = (r.error || '') + ' Errores de consola o de red.'; }
  }
  const head = sh('git', ['rev-parse', 'HEAD']), dirty = sh('git', ['status', '--porcelain', '--', 'js', 'index.html', 'tests', 'scripts']);
  const manifest = { schema: 'rubik-qa-smart-furnishing/1', mission: 'UX-12 + UX-13 · Amueblamiento inteligente V1', head, workingTreeClean: dirty === '', startedAt: started, finishedAt: new Date().toISOString(),
    chromium, playwright: require('playwright/package.json').version, node: process.version, pauseMs: PAUSE,
    data: 'Sintéticos: proyecto de ejemplo de RUBIK con el salón vacío (tests/fixtures/smart-furnishing-demo.json). Sin datos personales; sin servicios externos (CDN de three.js bloqueado; 3D con la copia local).',
    result: runs.every(r => r.result === 'ok') ? 'ok' : 'fallo', runs };
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(JSON.stringify({ result: manifest.result, head, runs: runs.map(r => ({ name: r.name, result: r.result, video: r.videoProbe, steps: r.steps.length, shots: r.screenshots.length, error: r.error })) }, null, 2));
  process.exit(manifest.result === 'ok' ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
