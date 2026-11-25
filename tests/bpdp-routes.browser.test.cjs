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

test('Home y Entregar · dos demos, dos visores y cuatro salidas del catálogo real', { timeout: 1200000 }, async t => {
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
  const index = page.locator('.professional-index');
  await index.getByRole('button', { name: 'Documentación', exact: true }).click();
  assert.equal(await index.locator('[data-group="experience"]').isVisible(), false);
  await index.getByRole('button', { name: 'Todo', exact: true }).click();
  await index.locator('.professional-card-details').first().click();
  assert.ok(await page.locator('.professional-delivery-detail .panel-b p').count());
  await page.getByRole('button', { name: 'Volver al índice', exact: true }).click();
  assert.equal(await index.locator('.professional-card-details').first().evaluate(button => button === document.activeElement), true);
  assert.equal(await index.locator('[data-entrega-code="D2"] .thumb img').evaluate(image => getComputedStyle(image).objectFit), 'contain');
  const columns = await index.locator('[data-group="documentation"] .cards').evaluate(grid => getComputedStyle(grid).gridTemplateColumns.split(' ').length);
  assert.equal(columns, 4);
  await index.locator('.professional-full-catalog summary').click();
  const direct = index.getByRole('button', { name: 'Abrir · Lámina Blueprint 3D', exact: true });
  await direct.click();
  await page.locator('#e3Entregas [data-route="e3-preparar-blueprint-lamina"]').waitFor();
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.getElementById('e3Entregas').open);
  assert.equal(await direct.evaluate(button => button === document.activeElement), true);
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
  if (process.env.BPDP_REQUIRE_H264 === '1') assert.ok(videoSupported, 'The catalog artifact job requires an H.264 encoder');
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
    console.log('Preparar:', id);
    await prepare.click();
    if (id.endsWith('video') && !videoSupported) {
      await page.waitForFunction(() => /H\.264|MP4|codific/i.test(document.getElementById('e3Estado').textContent));
      assert.equal(await download.isVisible(), false);
      console.log('Entregar: ' + id + ' sin codificador; aviso comprobado');
      continue;
    }
    // Render por CPU (SwiftShader), medido en local: láminas ~3 s; vídeo Blueprint 571 fotogramas ~104 s; vídeo Despiece
    // 646 fotogramas ~326 s (ver docs/integration/perla-ci-322/bpdp-salidas/verificacion.txt).
    const tPrep = Date.now(); await download.waitFor({ timeout: 600000 }); console.log(`PREP ${id} ${((Date.now() - tPrep) / 1000).toFixed(1)} s`);
    const [file] = await Promise.all([page.waitForEvent('download'), download.click()]);
    const ext = id.endsWith('lamina') ? 'png' : 'mp4';
    assert.ok(file.suggestedFilename().endsWith('.' + ext));
    const path = await file.path();
    const bytes = await fs.readFile(path);
    if (process.env.BPDP_SAVE_DIR) await fs.copyFile(path, require('node:path').join(process.env.BPDP_SAVE_DIR, file.suggestedFilename()));
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
      console.log('MP4 descargado y decodificado:', id);
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
    await page.waitForFunction(id => !BpdpEntregar.abierta && window.BPDP === null && document.activeElement?.id === id, 'bpdpOpen-' + module, { timeout: 5000 });
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
  if (process.env.BPDP_STRESS === '1') {
    const level = fixture.building.levels[0].project;
    for (let i = 0; i < 91; i++) level.objects.push({
      ...level.objects[0], id: 'obj_bpdp-load-' + i, type: 'chair', name: 'Silla de prueba ' + (i + 1),
      roomId: level.rooms[0].id, size: { widthMm: 250, depthMm: 250 },
      position: { x: 550 + (i % 13) * 285, y: 550 + Math.floor(i / 13) * 305 }
    });
  }
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
    if (process.env.BPDP_STRESS === '1') assert.ok(measured.meshes > 300, 'la carga incluye el mobiliario añadido');
    console.log('Edificio:', module, measured);
  }
});
