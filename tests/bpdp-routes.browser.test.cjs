'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { execFileSync, spawnSync } = require('node:child_process');
const { test } = require('node:test');
const playwright = require('playwright');
const buildingCore = require('../js/building-core.js');
const packages = require('../js/project-package.js');
const tracing = require('../js/tracing-core.js');
const buildingFixture = require('./fixtures/building-fixture.cjs');

const engine = process.env.BPDP_BROWSER || 'chromium';
const url = process.env.BPDP_URL || 'http://127.0.0.1:43987/';
const out = process.env.BPDP_EVIDENCE;

test('Home y Entregar · dos demos, dos visores y cuatro salidas del catálogo real', { timeout: 240000 }, async t => {
  const browser = await playwright[engine].launch({
    headless: process.env.BPDP_HEADED !== '1',
    ...(engine === 'chromium' && process.env.CHROME ? { executablePath: process.env.CHROME } : {})
  });
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  page.setDefaultTimeout(20000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  console.log(engine, browser.version());
  for (const [module, id] of [['blueprint', 'blueprint-3d'], ['despiece', 'despiece-3d']]) {
    await page.goto(url + '#inicio');
    await page.locator('#welcomeDemo-' + id).click();
    await page.waitForFunction(() => !!window.BPDP?.studio);
    assert.equal(await page.evaluate(() => BPDP.scenario), 'rubik-real');
    await page.locator('#bpdpDemoAction').click();
    await page.locator('#bpdpDemoHome').click();
    await page.locator('#welcomeExample').waitFor();
    console.log('Home:', module);
  }
  await page.locator('#welcomeExample').click();
  await page.locator('#workArea-deliver').click();
  const before = await page.evaluate(() => JSON.stringify(FloorPlanApp.project));
  const trigger = page.locator('[data-route="e3-entregas"]');
  await trigger.click();
  const dialog = page.locator('#e3Entregas');
  const ids = ['blueprint-lamina', 'despiece-lamina', 'blueprint-video', 'despiece-video'];
  for (const id of ids) await dialog.locator(`[data-entregable="${id}"] input`).check();
  await dialog.locator('[data-route="e3-siguiente"]').click();
  await dialog.locator('[data-route="e3-siguiente"]').click();
  const videoSupported = await page.evaluate(async () => {
    const outputs = await import('/bpdp/runtime/outputs.js');
    return !!(await outputs.h264Config(1920, 1080, 30));
  });
  if (videoSupported) {
    const row = dialog.locator('[data-entregable="blueprint-video"]');
    const prepare = row.locator('[data-route="e3-preparar-blueprint-video"]');
    await prepare.click();
    await row.getByRole('button', { name: 'Cancelar preparación' }).click();
    await page.waitForFunction(() => document.getElementById('e3Estado').textContent === 'Preparación cancelada.');
    assert.equal(await prepare.evaluate(el => el === document.activeElement), true);
    assert.equal(await page.evaluate(() => BpdpEntregar.estado('blueprint', 'video')), null);
  }
  for (const id of ids) {
    const prepare = dialog.locator(`[data-route="e3-preparar-${id}"]`);
    const download = dialog.locator(`[data-route="e3-descargar-${id}"]`);
    await prepare.click();
    if (id.endsWith('video') && !videoSupported) {
      await page.waitForFunction(() => /H\.264|MP4|codific/i.test(document.getElementById('e3Estado').textContent));
      assert.equal(await download.isVisible(), false);
      console.log('Entregar: ' + id + ' sin codificador; aviso comprobado');
      continue;
    }
    await download.waitFor({ timeout: 90000 });
    const [file] = await Promise.all([page.waitForEvent('download'), download.click()]);
    const ext = id.endsWith('lamina') ? 'png' : 'mp4';
    assert.ok(file.suggestedFilename().endsWith('.' + ext));
    const path = await file.path();
    const bytes = await fs.readFile(path);
    if (ext === 'png') {
      assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
      assert.equal(bytes.readUInt32BE(16), 3307);
      assert.equal(bytes.readUInt32BE(20), 2339);
      const density = bytes.indexOf('pHYs');
      assert.ok(density > 0);
      assert.equal(bytes.readUInt32BE(density + 4), 7874);
    } else {
      const stream = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=codec_name,width,height', '-of', 'csv=p=0', path], { encoding: 'utf8' }).trim();
      assert.equal(stream, 'h264,1920,1080');
      const decoded = spawnSync('ffmpeg', ['-v', 'error', '-xerror', '-i', path, '-f', 'null', '-'], { encoding: 'utf8' });
      assert.equal(decoded.status, 0, decoded.stderr);
      assert.equal(decoded.stderr.trim(), '');
    }
    if (out) await file.saveAs(`${out}/${engine}-${id}.${ext}`);
    console.log('Entregar:', id, bytes.length);
  }
  await dialog.locator('.e3-cerrar').click();
  assert.equal(await trigger.evaluate(el => el === document.activeElement), true);
  for (const module of ['blueprint', 'despiece']) {
    const opener = page.locator('#bpdpOpen-' + module);
    await opener.click();
    await page.locator('dialog.bpdp-host[open]').waitFor();
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !BpdpEntregar.abierta);
    assert.equal(await opener.evaluate(el => el === document.activeElement), true);
  }
  assert.equal(await page.evaluate(() => JSON.stringify(FloorPlanApp.project)), before);
  assert.deepEqual(errors, []);
});

test('Entregar · edificio de dos plantas con escalera y cierre reversible', { timeout: 120000, skip: engine !== 'chromium' }, async t => {
  const browser = await playwright.chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const fixture = buildingFixture.build();
  const { entries } = await buildingCore.packageEntries(fixture.building, image => fixture.bytesFor(image.id), tracing.imageInfo);
  const zip = Buffer.from(await packages.zip(entries, { check: buildingCore.packagePath }).arrayBuffer());
  await page.goto(url + '#inicio');
  await page.locator('#welcomeExample').click();
  await page.locator('#uploadIn').setInputFiles({ name: 'edificio.zip', mimeType: 'application/zip', buffer: zip });
  await page.waitForFunction(() => FloorPlanBuildingUI.context?.levels === 2);
  await page.locator('#viewSeg [data-view="3d"]').click();
  await page.waitForFunction(() => FloorPlanApp.viewMode === '3d');
  await page.locator('#levelViewAll').click();
  await page.waitForFunction(() => {
    const state = View3D.lifecycleMetrics;
    return View3D.levelView === 'all' && !state.animating && !state.flying && !state.pendingAssets;
  });
  await page.locator('#workArea-deliver').click();
  const snapshot = () => page.evaluate(() => ({
    project: JSON.stringify(FloorPlanApp.project),
    level: FloorPlanBuildingUI.context.levelId,
    view: View3D.levelView,
    camera: View3D.cameraState,
    geometries: View3D.sceneGeometries
  }));
  const before = await snapshot();
  for (const module of ['blueprint', 'despiece']) {
    const opener = page.locator('#bpdpOpen-' + module);
    await opener.click();
    await page.locator('dialog.bpdp-host[open]').waitFor();
    const measured = await page.evaluate(async () => {
      const { studio, app, module } = BPDP;
      if (studio.pkg.frame.levelView !== 'all') throw Error('Se perdió el conjunto del edificio');
      const gl = studio.canvas.getContext('webgl2');
      const info = gl.getExtension('WEBGL_debug_renderer_info');
      const start = performance.now(), frames = studio.stats().frames;
      if (module === 'despiece') app.animateTo(0);
      else app.setIntent('present');
      await new Promise(resolve => setTimeout(resolve, 3000));
      return {
        meshes: studio.pkg.meshes.length,
        renderer: info && gl.getParameter(info.UNMASKED_RENDERER_WEBGL),
        fps: +((studio.stats().frames - frames) * 1000 / (performance.now() - start)).toFixed(1)
      };
    });
    await page.evaluate(() => BPDP.close());
    await page.locator('dialog.bpdp-host').waitFor({ state: 'detached' });
    assert.deepEqual(await snapshot(), before);
    console.log('Edificio:', module, measured);
  }
});
