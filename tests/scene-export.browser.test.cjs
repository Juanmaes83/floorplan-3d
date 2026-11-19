// OP-10 · «Entregar → Escena para Blender» en la app real (Chromium; Firefox/WebKit con SCENE_BROWSERS=chromium,firefox,webkit).
// C5 de principio a fin por la interfaz, robustez (GLB retrasado, recurso ausente, cancelación, escena vacía), determinismo de
// exportaciones sucesivas, C2 (0 mallas sin ID), C3 (0 caras coincidentes visibles), invariantes de no mutación y OP-02.
const { test, before, after } = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), os = require('node:os'), path = require('node:path'), http = require('node:http');
const Capture = require('../scripts/interop/scene-capture.cjs'), Fixtures = require('./fixtures/scene-blender/build.cjs'), Scene = require('../js/scene-capture-core.js');
const browsers = (process.env.SCENE_BROWSERS || 'chromium').split(',');
let tmp, fx;
before(() => { tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'scene-export-')); fx = path.join(tmp, 'fx'); Fixtures.build(fx); });
after(() => fs.rmSync(tmp, { recursive: true, force: true }));
const J = f => JSON.parse(fs.readFileSync(f, 'utf8'));

for (const browser of browsers) {
  test(`C5 · interfaz real de principio a fin (${browser}): ZIP con GLB + manifiesto + LEEME, sin mutación ni red`, { timeout: 240000 }, async () => {
    const out = path.join(tmp, 'ui-' + browser), r = await Capture.capture(path.join(fx, 'f3-openings.json'), out, { via: 'ui', browser });
    assert.deepEqual(r.invariants, { projectUnchanged: true, storageUnchanged: true, externalRequests: 0, pageErrors: 0, blockedAssetRequests: 0 });
    for (const f of ['scene.glb', 'manifest.json', 'LEEME.txt', 'package.zip', 'ui-ready.png']) assert.ok(fs.existsSync(path.join(out, f)), f);
    assert.match(fs.readFileSync(path.join(out, 'package-name.txt'), 'utf8'), /^rubik-escena-blender-prj_op10-f3-openings\.zip$/);
    const m = J(path.join(out, 'manifest.json')), scene = J(path.join(out, 'scene.json'));
    assert.equal(m.format, 'rubik-sota.scene-delivery'); assert.equal(m.scene.stats.unlinked, 0, 'C2: every mesh identified');
    assert.ok(m.scene.view.camera && m.scene.view.light, 'C7: camera and light declared');
    assert.equal(Scene.coincidentFaces(scene).defects.length, 0, 'C3: no visible coincident faces');
    assert.equal(J(path.join(out, 'record.json')).identity.status, 'observed-only', 'C6: no confirmed F0 revision claimed');
  });
}

test('Robustez · GLB retrasado 6 s: espera y produce los MISMOS bytes; exportaciones sucesivas deterministas', { timeout: 240000 }, async () => {
  const a = await Capture.capture(path.join(fx, 'f3-openings.json'), path.join(tmp, 'det-a'), { via: 'api' });
  const b = await Capture.capture(path.join(fx, 'f3-openings.json'), path.join(tmp, 'det-b'), { via: 'api' });
  const d = await Capture.capture(path.join(fx, 'f3-openings.json'), path.join(tmp, 'delayed'), { via: 'api', delayAssetsMs: 6000 });
  assert.equal(a.outputs['scene.glb'].sha256, b.outputs['scene.glb'].sha256, 'successive exports');
  assert.equal(a.outputs['manifest.json'].sha256, b.outputs['manifest.json'].sha256, 'manifest is deterministic too');
  assert.equal(a.outputs['scene.glb'].sha256, d.outputs['scene.glb'].sha256, 'late GLB awaited, not captured half-loaded');
  assert.ok(d.metrics.prepareMs >= 1000 || d.metrics.loadMs >= 6000, 'the delay was actually exercised');
});

test('Robustez · modelo ausente: la escena se entrega con su representación genérica y lo declara', { timeout: 240000 }, async () => {
  const r = await Capture.capture(path.join(fx, 'f3-openings.json'), path.join(tmp, 'blocked'), { via: 'api', blockAssets: true });
  assert.ok(r.invariants.blockedAssetRequests >= 1);
  const m = J(path.join(tmp, 'blocked', 'manifest.json'));
  assert.ok(m.fallbacks.assetErrors.length >= 1 && !m.fallbacks.assets.loading, JSON.stringify(m.fallbacks));
});

test('Robustez · cancelación: nada se genera y nada cambia', { timeout: 240000 }, async () => {
  const r = await Capture.capture(path.join(fx, 'f1-rect.json'), path.join(tmp, 'cancel'), { cancel: true });
  assert.deepEqual(r, { cancelled: 'CANCELLED', projectUnchanged: true, storageUnchanged: true, externalRequests: 0, pageErrors: [] });
});

test('UX · sin 3D explica y ofrece abrirla; escena vacía explica la causa y la salida; Escape cancela; móvil sin desbordes; OP-02 vuelve a reposo', { timeout: 240000 }, async () => {
  const { chromium } = require('playwright'), root = path.resolve(__dirname, '..');
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.glb': 'model/gltf-binary', '.svg': 'image/svg+xml', '.wasm': 'application/wasm', '.hdr': 'application/octet-stream' };
  const server = http.createServer((req, res) => { try { const p = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://l').pathname.replace(/^\/$/, '/index.html'))); if (!p.startsWith(root + path.sep)) throw 0; res.setHeader('Content-Type', types[path.extname(p)] || 'application/octet-stream'); res.end(fs.readFileSync(p)); } catch { res.writeHead(404); res.end(); } });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const browser = await chromium.launch({ ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}), args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await page.waitForFunction(() => window.FloorPlanApp && window.RubikSceneExport && window.View3D);
    await page.evaluate(() => document.querySelector('#welcomeDialog')?.close?.());
    // 1 · En 2D: el diálogo explica y su acción principal abre la vista 3D (no bloquea sin salida)
    await page.evaluate(() => window.RubikSceneExport.open());
    assert.equal(await page.locator('#sceneExportDialog').getAttribute('data-state'), 'no3d');
    assert.match(await page.locator('#seStatus').textContent(), /vista 3D abierta/);
    assert.equal(await page.locator('#sePrimary').textContent(), 'Abrir la vista 3D');
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'sePrimary', 'focus on the main action');
    const overflow = await page.evaluate(() => { const d = document.querySelector('#sceneExportDialog').getBoundingClientRect(); return d.left < 0 || d.right > innerWidth + 1; });
    assert.equal(overflow, false, 'no horizontal overflow at 390 px');
    await page.locator('#sePrimary').click();
    await page.waitForFunction(() => window.FloorPlanApp.viewMode === '3d' && document.querySelector('#sceneExportDialog').dataset.state === 'idle');
    // 2 · Proyecto vacío (sin geometría): error con causa y salida, sin generar nada
    await page.evaluate(() => document.querySelector('#sceneExportDialog').close());
    const blank = require('../js/room-layout.js').blank('Vacío (prueba OP-10)'), file = path.join(tmp, 'blank.json'); fs.writeFileSync(file, JSON.stringify(blank));
    await page.locator('#fileIn').setInputFiles(file); await page.waitForFunction(id => window.FloorPlanApp.project?.id === id, blank.id);
    await page.evaluate(() => setView('3d')); await page.waitForFunction(() => window.FloorPlanApp.viewMode === '3d');
    assert.equal(await page.evaluate(async () => { try { await window.View3D.captureScene({ stableFrames: 3 }); return 'captured'; } catch (e) { return e.code; } }), 'EMPTY');
    await page.evaluate(() => window.RubikSceneExport.open()); await page.locator('#sePrimary').click(); await page.waitForFunction(() => window.RubikSceneExport.state === 'error');
    assert.match(await page.locator('#seStatus').textContent(), /No hay nada visible/); assert.match(await page.locator('.se-note').textContent(), /capas/);
    assert.equal(await page.locator('#sePrimary').textContent(), 'Reintentar');
    await page.evaluate(() => document.querySelector('#sceneExportDialog').close());
    await page.locator('#fileIn').setInputFiles(path.join(fx, 'f3-openings.json')); // de vuelta a una vivienda con geometría
    await page.waitForFunction(() => window.FloorPlanApp.project?.id === 'prj_op10-f3-openings');
    await page.evaluate(() => setView('3d')); await page.waitForFunction(() => window.FloorPlanApp.viewMode === '3d');
    await page.evaluate(() => window.RubikSceneExport.open());
    // 3 · Escape durante la preparación cancela (no cierra a ciegas)
    await page.evaluate(() => { window.__p = window.RubikSceneExport.prepare(); });
    await page.keyboard.press('Escape'); await page.evaluate(() => window.__p);
    assert.equal(await page.evaluate(() => window.RubikSceneExport.state), 'cancelled', 'Escape while preparing cancels');
    assert.match(await page.locator('#seStatus').textContent(), /cancelada\. No se ha generado nada/);
    assert.equal(await page.locator('#sceneExportDialog').evaluate(d => d.open), true, 'the dialog stays open to retry');
    // 4 · OP-02: tras preparar, el visor vuelve a reposo (sin bucle de render persistente)
    const frames = async () => page.evaluate(async () => { const a = window.View3D.renderedFrames; await new Promise(r => setTimeout(r, 1500)); return window.View3D.renderedFrames - a; });
    assert.ok(await frames() <= 2, 'render on demand: idle after capture');
    assert.deepEqual(errors, []);
  } finally { await browser.close(); server.close(); }
});

test('Residuales · ZIP con los dos caminos y script idéntico; diálogo en ZH/EN; el asistente no tapa ni roba las acciones', { timeout: 300000 }, async () => {
  const out = path.join(tmp, 'residual-ui'), r = await Capture.capture(path.join(fx, 'f3-openings.json'), out, { via: 'ui' });
  assert.deepEqual(r.invariants, { projectUnchanged: true, storageUnchanged: true, externalRequests: 0, pageErrors: 0, blockedAssetRequests: 0 });
  const shipped = fs.readFileSync(path.join(out, 'rubik_blender_prepare.py')), repo = fs.readFileSync(path.resolve(__dirname, '../scripts/interop/blender-scene-import.py'));
  assert.equal(Buffer.compare(shipped, repo), 0, 'the ZIP carries the exact preparation script');
  const m = J(path.join(out, 'manifest.json')), leeme = fs.readFileSync(path.join(out, 'LEEME.txt'), 'utf8');
  assert.equal(m.files['rubik_blender_prepare.py'].sha256, require('node:crypto').createHash('sha256').update(repo).digest('hex'));
  assert.match(leeme, /NO producen el mismo render/); assert.match(leeme, /A · Importación directa/); assert.match(leeme, /B · Preparación completa/);

  const { chromium } = require('playwright'), root = path.resolve(__dirname, '..');
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.glb': 'model/gltf-binary', '.svg': 'image/svg+xml', '.py': 'text/plain', '.hdr': 'application/octet-stream' };
  const server = http.createServer((req, res) => { try { const p = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://l').pathname.replace(/^\/$/, '/index.html'))); if (!p.startsWith(root + path.sep)) throw 0; res.setHeader('Content-Type', types[path.extname(p)] || 'application/octet-stream'); res.end(fs.readFileSync(p)); } catch { res.writeHead(404); res.end(); } });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const browser = await chromium.launch({ ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}), args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
      const page = await (await browser.newContext({ viewport, isMobile: viewport.width < 1000, hasTouch: viewport.width < 1000 })).newPage(), errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(`http://127.0.0.1:${server.address().port}/`);
      await page.waitForFunction(() => window.FloorPlanApp && window.RubikSceneExport && window.View3D);
      await page.evaluate(() => document.querySelector('#welcomeDialog')?.close?.());
      await page.locator('#fileIn').setInputFiles(path.join(fx, 'f3-openings.json'));
      await page.waitForFunction(() => window.FloorPlanApp.project?.id === 'prj_op10-f3-openings');
      await page.evaluate(() => setView('3d')); await page.waitForFunction(() => window.FloorPlanApp.viewMode === '3d');
      await page.evaluate(() => window.RubikSceneExport.open()); await page.locator('#sePrimary').click();
      await page.waitForFunction(() => window.RubikSceneExport.state === 'ready');
      assert.match(await page.locator('#sePaths').innerText(), /no dan el mismo render/);
      // El asistente (convención de assistant-ui: botón dentro del modal abierto) no tapa ninguna acción del diálogo.
      for (const id of ['#sePrimary', '#seSecondary']) {
        const free = await page.locator(id).evaluate(b => { b.scrollIntoView({ block: 'nearest' }); const r = b.getBoundingClientRect(), pts = [[.5, .5], [.1, .5], [.9, .5]];
          return pts.every(([fx, fy]) => { const e = document.elementFromPoint(r.left + r.width * fx, r.top + r.height * fy); return e === b || b.contains(e); }); });
        assert.equal(free, true, `${id} not covered at ${viewport.width}x${viewport.height}`);
      }
      const access = await page.evaluate(() => { const d = document.querySelector('#sceneExportDialog'), host = d.lastElementChild; return host && host.shadowRoot === null && !host.closest('.scene-export') ? { tag: host.tagName, inside: d.contains(host) } : null; });
      assert.ok(access && access.inside, 'assistant entry is the dialog-level convention, outside our content');
      // Escape cierra NUESTRO diálogo (no lo captura el asistente) y el foco no queda atrapado.
      await page.locator('#sePrimary').focus(); await page.keyboard.press('Escape');
      assert.equal(await page.locator('#sceneExportDialog').evaluate(d => d.open), false);
      // ZH y EN: todos los textos visibles del diálogo en el idioma, sin restos en español.
      for (const [lang, re, notEs] of [['zh', /Blender 场景[\s\S]*在此浏览器中准备/, true], ['en', /Scene for Blender[\s\S]*Prepared in this browser/, true]]) {
        await page.evaluate(l => { LANG = l; window.RubikSceneExport.open(); }, lang);
        const txt = await page.locator('#sceneExportDialog .scene-export').innerText();
        assert.match(txt, re, lang); if (notEs) assert.doesNotMatch(txt, /Escena para Blender|Descarga la vivienda|Dos formas/, lang + ' without Spanish leftovers');
        await page.evaluate(() => document.querySelector('#sceneExportDialog').close());
      }
      assert.deepEqual(errors, []);
      await page.context().close();
    }
  } finally { await browser.close(); server.close(); }
});
