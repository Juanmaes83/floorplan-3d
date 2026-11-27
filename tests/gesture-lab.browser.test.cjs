'use strict';
// Gesture Labs §6 · ensayo aislado en la app real (?gesture-lab=1) con dos revisiones GUARDADAS del proyecto de ejemplo.
// Gestos SINTÉTICOS (RubikGestureCore.syntheticHand) inyectados por el gancho del laboratorio: reproducen el recorrido sin
// webcam física. La cámara se sustituye por una pista de canvas (permiso concedido) o por un rechazo NotAllowedError.
const test = require('node:test'), assert = require('node:assert/strict'), path = require('node:path'), fs = require('node:fs');
const K = require('./ux07/kit.cjs');
let env; test.before(async () => { env = await K.start({ authority: true }); }); test.after(async () => { await env?.stop(); });
const REC = process.env.GL_REC, SHOTS = process.env.GL_SHOTS;
async function boot(vp, camera) {
  const ctx = await env.browser.newContext({ viewport: { width: vp.width, height: vp.height }, ...(REC ? { recordVideo: { dir: REC, size: { width: vp.width, height: vp.height } } } : {}) });
  await ctx.addInitScript(cam => { window.__glNoModel = true; const md = navigator.mediaDevices || (navigator.mediaDevices = {});
    md.getUserMedia = async () => { if (cam === 'denied') { const e = new Error('Permission denied'); e.name = 'NotAllowedError'; throw e; } const c = document.createElement('canvas'); c.width = 64; c.height = 48; c.getContext('2d').fillRect(0, 0, 64, 48); const s = c.captureStream(5); window.__glTracks = s.getTracks(); return s; }; }, camera);
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(env.base + '?gesture-lab=1'); await page.waitForFunction(() => document.documentElement.dataset.editorReady === 'true');
  if (await page.locator('#welcomeDialog').evaluate(d => d.open).catch(() => false)) await page.keyboard.press('Escape');
  // Segunda revisión guardada: variante del ejemplo sin una pieza de mobiliario (como la historia aprobada de P10).
  await page.evaluate(async () => { await FloorPlanApp.createVariant(); });
  const n0 = await page.evaluate(() => FloorPlanApp.project.furniture.length);
  await page.evaluate(() => { const f = FloorPlanApp.project.furniture[0]; select({ kind: 'furn', id: f.id }); }); await page.locator('#plan').focus().catch(() => {}); await page.keyboard.press('Delete');
  await page.waitForFunction(n => FloorPlanApp.project.furniture.length === n - 1, n0); await page.evaluate(() => FloorPlanApp.persistence.requireSaved());
  await page.waitForFunction(() => window.RubikGestureLab && (FloorPlanApp.storyTargets().pairs || []).length > 0);
  return { ctx, page, errors };
}
const pause = (p, ms = 900) => REC ? p.waitForTimeout(ms) : null;
const hold = async (page, kind, ms, x = 0.5, dx = 0) => page.evaluate(async ([k, ms, x, dx]) => { const t0 = performance.now(); let i = 0; while (performance.now() - t0 < ms) { RubikGestureLab.feed(RubikGestureLab.synthetic(k, x + dx * i, 0.5), performance.now()); i++; await new Promise(r => setTimeout(r, 33)); } }, [kind, ms, x, dx]);
const save = async (ctx, page, name) => { const v = REC && page.video(); await ctx.close(); if (v) fs.renameSync(await v.path(), path.join(REC, name)); };

for (const vp of [{ width: 1440, height: 900, tag: 'escritorio' }, { width: 390, height: 844, tag: 'movil' }]) {
  test('recorrido con gestos sintéticos y controles equivalentes · ' + vp.tag, { timeout: 240000 }, async () => {
    const { ctx, page, errors } = await boot(vp, 'granted');
    await page.locator('#gestureLabOpen').click(); await page.waitForSelector('#gestureLab[open]'); await pause(page, 1600);
    assert.equal(await page.evaluate(() => RubikGestureLab.step), 'plan'); assert.ok(await page.locator('#glStage svg').count() > 0, 'el plano guardado');
    assert.match(await page.locator('#glKind').innerText(), /Imagen del plano guardado · revisión/);
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `gl-1-plano-${vp.tag}.png`) });
    // Cámara: solo por decisión explícita; pistas vivas mientras está activa.
    await page.locator('#glCam').click(); await page.waitForFunction(() => RubikGestureLab.camera.state === 'on'); assert.deepEqual(await page.evaluate(() => RubikGestureLab.camera.tracks), ['live']);
    // Gesto 1: mano abierta sostenida → 3D de la misma revisión.
    await hold(page, 'open', 1200); await page.waitForFunction(() => RubikGestureLab.step === '3d'); await page.waitForFunction(() => FloorPlanApp.viewMode === '3d', null, { timeout: 30000 }); await pause(page, 2500);
    assert.match(await page.locator('#glKind').innerText(), /Visor 3D interactivo de la misma revisión/);
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `gl-2-3d-${vp.tag}.png`) });
    // Perder la mano: pausa sin acción; la vista se conserva.
    await page.evaluate(() => { RubikGestureLab.feed(null, performance.now() + 800); }); assert.equal(await page.evaluate(() => RubikGestureLab.camera.state), 'lost'); assert.equal(await page.evaluate(() => RubikGestureLab.step), '3d');
    // Continuidad con controles normales desde el mismo punto: botón «Siguiente».
    await page.locator('#glNext').click(); await page.waitForFunction(() => RubikGestureLab.step === 'compare'); await pause(page, 1400);
    const calls = await page.locator('#glCalls').innerText(); assert.match(calls, /Superficie útil: [\d,.]+ → [\d,.]+ m²/); assert.match(calls, /Piezas de mobiliario: \d+ → \d+ ud\./); assert.match(calls, /fuente: RUBIK/); assert.match(calls, /estado: guardado/);
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `gl-3-antes-${vp.tag}.png`) });
    // Gesto 2: deslizar con la mano cerrada → después; teclado A → antes.
    await hold(page, 'fist', 300, 0.7); await hold(page, 'fist', 320, 0.7, -0.05); assert.equal(await page.evaluate(() => RubikGestureLab.side), 'after'); await pause(page, 1600);
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `gl-4-despues-${vp.tag}.png`) });
    await page.keyboard.press('a'); assert.equal(await page.evaluate(() => RubikGestureLab.side), 'before'); await pause(page);
    await page.locator('#glSide').click(); assert.equal(await page.evaluate(() => RubikGestureLab.side), 'after'); await pause(page);
    // Salir: la cámara se apaga (pistas terminadas) y el proyecto guardado no cambia.
    await page.locator('#glExit').click(); await page.waitForFunction(() => !document.querySelector('#gestureLab').open);
    assert.deepEqual(await page.evaluate(() => window.__glTracks.map(t => t.readyState)), ['ended']);
    const srcs = await page.evaluate(() => RubikGestureLab.log.filter(e => e.type === 'step' || e.type === 'side').map(e => e.source)); for (const s of ['gesture', 'button', 'keyboard']) assert.ok(srcs.includes(s), 'acción por ' + s);
    assert.ok(!/[㐀-鿿]/.test(await page.locator('body').innerText()), 'sin chino visible'); assert.deepEqual(errors, []);
    await save(ctx, page, `gl-recorrido-${vp.tag}.webm`);
  });
}
test('permiso de cámara denegado: aviso y la presentación sigue con botones y teclado', { timeout: 120000 }, async () => {
  const { ctx, page, errors } = await boot({ width: 1440, height: 900 }, 'denied');
  await page.locator('#gestureLabOpen').click(); await page.locator('#glCam').click();
  await page.waitForFunction(() => RubikGestureLab.camera.state === 'denied'); assert.match(await page.locator('#glCamText').innerText(), /denegado · sigue con los botones/);
  await page.keyboard.press('ArrowRight'); await page.waitForFunction(() => RubikGestureLab.step === '3d'); assert.deepEqual(errors, []); await ctx.close();
});
