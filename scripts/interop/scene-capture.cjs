'use strict';
/* OP-10 · Arnés reproducible «Escena para Blender» sobre la app REAL (index.html), sin tocar el producto.
 * Carga un proyecto o edificio por el camino del usuario (#fileIn), abre la vista 3D y prepara la escena por:
 *   --via api : View3D.captureScene() + RubikSceneCapture.toGLB + RubikSceneDelivery (los mismos módulos que la interfaz)
 *   --via ui  : «Entregar → Escena para Blender» pulsando los botones reales del diálogo (C5 de principio a fin)
 * Comprueba invariantes: proyecto y almacenamiento idénticos, 0 peticiones externas, 0 errores de página.
 * Uso: node scripts/interop/scene-capture.cjs PROYECTO.json DESTINO-NUEVO [--via api|ui] [--scope active|all]
 *        [--browser chromium|firefox|webkit] [--viewport 1280x800] [--delay-assets-ms N] [--block-assets] [--cancel]
 * Sustituye a scripts/offline-pilot/capture-visual.cjs (C1) y a labs/sculpt/op-10/src/capture-browser.cjs.
 */
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), crypto = require('node:crypto'), os = require('node:os'), { execFileSync } = require('node:child_process');
const root = path.resolve(process.env.SCENE_APP_ROOT || path.resolve(__dirname, '../..'));
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const Delivery = require('../../js/scene-delivery-core.js');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.glb': 'model/gltf-binary', '.svg': 'image/svg+xml', '.wasm': 'application/wasm', '.txt': 'text/plain', '.hdr': 'application/octet-stream' };

function unzipStored(buf) { // ZIP sin compresión de js/project-package.js#zip
  const out = new Map(); let at = 0;
  while (buf.readUInt32LE(at) === 0x04034b50) { const n = buf.readUInt32LE(at + 18), fl = buf.readUInt16LE(at + 26), xl = buf.readUInt16LE(at + 28), name = buf.toString('utf8', at + 30, at + 30 + fl); const s = at + 30 + fl + xl; out.set(name, buf.subarray(s, s + n)); at = s + n; }
  return out;
}

async function capture(input, dest, o = {}) {
  const via = o.via || 'api', scope = o.scope || 'active', viewport = o.viewport || { width: 1280, height: 800 }, browserName = o.browser || 'chromium';
  if (fs.existsSync(dest)) throw Error('Refusing overwrite: ' + dest);
  const inputBytes = fs.readFileSync(input), parsed = JSON.parse(inputBytes), isBuilding = Array.isArray(parsed.levels);
  const external = [], server = http.createServer((req, res) => {
    try { const p = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://l').pathname.replace(/^\/$/, '/index.html')));
      if (!p.startsWith(root + path.sep)) throw Error(); res.setHeader('Content-Type', types[path.extname(p)] || 'application/octet-stream'); res.end(fs.readFileSync(p)); }
    catch { res.writeHead(404); res.end(); }
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}/`;
  const pw = require('playwright'), engine = pw[browserName];
  const args = browserName === 'chromium' ? ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : [];
  const browser = await engine.launch({ ...(browserName === 'chromium' && process.env.CHROME ? { executablePath: process.env.CHROME } : {}), args });
  const t = {};
  try {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, acceptDownloads: true }), page = await context.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR_|NS_ERROR|WebGL warning/.test(m.text())) errors.push(m.text()); });
    let blocked = 0;
    await context.route('**/*', async r => { const u = r.request().url();
      if (u.startsWith(base)) {
        if (/\.glb(\?|$)/.test(u)) { if (o.blockAssets) { blocked++; return r.abort(); } if (o.delayAssetsMs) await new Promise(res => setTimeout(res, o.delayAssetsMs)); }
        return r.continue(); }
      external.push(u); return r.abort(); });
    t.load0 = Date.now();
    await page.goto(base);
    await page.waitForFunction(() => window.FloorPlanApp && window.View3D && window.FloorPlanCore && window.RubikSceneExport, null, { timeout: 120000 });
    await page.evaluate(() => { document.querySelector('#welcomeDialog')?.close?.(); });
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'scene-input-')), file = path.join(tmp, path.basename(input));
    fs.writeFileSync(file, inputBytes);
    await page.locator('#fileIn').setInputFiles(file);
    const expectId = isBuilding ? parsed.levels[0].project.id : parsed.id;
    await page.waitForFunction(id => window.FloorPlanApp.project && (window.FloorPlanApp.project.id === id || (window.FloorPlanApp.levelContext && JSON.stringify(window.FloorPlanApp.levelContext).includes(id))), expectId, { timeout: 120000 });
    await page.evaluate(() => setView('3d'));
    await page.waitForFunction(() => window.FloorPlanApp.viewMode === '3d' && window.View3D.contextAvailable, null, { timeout: 120000 });
    if (isBuilding && scope === 'all') { await page.evaluate(() => document.querySelector('#levelViewAll').click()); await page.waitForFunction(n => window.View3D.levelView === 'all' && window.View3D.levelInspect().levels.length === n, parsed.levels.length, { timeout: 120000 }); }
    t.loaded = Date.now();
    const snapshot = () => page.evaluate(() => ({ project: JSON.stringify(window.FloorPlanApp.project), storage: JSON.stringify(Object.keys(localStorage).sort().filter(k => !/^rubik-telemetry/.test(k)).map(k => [k, localStorage.getItem(k)])) }));
    const frameStats = () => page.evaluate(async () => { const d = []; let p = performance.now(); for (let i = 0; i < 40; i++) { await new Promise(r => requestAnimationFrame(r)); const n = performance.now(); d.push(n - p); p = n; } d.sort((a, b) => a - b); return { medianMs: Math.round(d[20] * 10) / 10, p95Ms: Math.round(d[38] * 10) / 10 }; });
    const navBefore = await frameStats(), before = await snapshot();

    if (o.cancel) { // Cancelación real: se aborta mientras espera la estabilidad; nada debe generarse ni cambiar.
      const r = await page.evaluate(async () => { const ac = new AbortController(); const p = window.View3D.captureScene({ signal: ac.signal, stableFrames: 600 }); setTimeout(() => ac.abort(), 200); try { await p; return 'completed'; } catch (e) { return e.code; } });
      const after = await snapshot();
      return { cancelled: r, projectUnchanged: before.project === after.project, storageUnchanged: before.storage === after.storage, externalRequests: external.length, pageErrors: errors };
    }

    let files, record, uiShot = null, t1, t2;
    t1 = Date.now();
    if (via === 'ui') {
      await page.evaluate(() => window.RubikSceneExport.open());
      await page.locator('#sceneExportDialog #sePrimary').click(); // «Preparar escena»
      await page.waitForFunction(() => ['ready', 'error'].includes(window.RubikSceneExport.state), null, { timeout: 180000 });
      t2 = Date.now();
      const st = await page.evaluate(() => ({ state: window.RubikSceneExport.state, status: document.querySelector('#seStatus').textContent }));
      if (st.state !== 'ready') throw Error('UI did not reach «ready»: ' + st.status);
      uiShot = path.join(os.tmpdir(), 'scene-ui-' + process.pid + '.png'); await page.locator('#sceneExportDialog').screenshot({ path: uiShot });
      const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#sceneExportDialog #sePrimary').click()]); // «Descargar ZIP»
      const zipPath = path.join(tmp, await download.suggestedFilename()); await download.saveAs(zipPath);
      const zip = fs.readFileSync(zipPath); files = unzipStored(zip); files.set('package.zip', zip); files.set('package-name.txt', Buffer.from(await download.suggestedFilename()));
      record = await page.evaluate(() => window.RubikSceneExport.result.record);
      const doc = await page.evaluate(async () => { const c = await window.View3D.captureScene(); return JSON.stringify(c.doc); }); // misma escena, para A↔B
      files.set('scene.json', Buffer.from(doc));
    } else {
      const r = await page.evaluate(async () => {
        const hex = b => [...new Uint8Array(b)].map(n => n.toString(16).padStart(2, '0')).join(''), digest = async bytes => hex(await crypto.subtle.digest('SHA-256', bytes));
        const c = await window.View3D.captureScene(), t0 = performance.now(), glb = window.RubikSceneCapture.toGLB(c.doc), glbMs = performance.now() - t0;
        const manifest = await window.RubikSceneDelivery.manifest({ capture: c, glb, project: window.FloorPlanApp.project, digest });
        const record = await window.RubikSceneDelivery.record({ manifest, digest });
        return { doc: JSON.stringify(c.doc), glb: btoaBytes(glb), manifest: JSON.stringify(manifest, null, 1) + '\n', record, glbMs, captureMs: c.info.captureMs, stability: c.info.stability };
        function btoaBytes(u8) { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); }
      });
      t2 = Date.now();
      files = new Map([['scene.glb', Buffer.from(r.glb, 'base64')], ['manifest.json', Buffer.from(r.manifest)], ['scene.json', Buffer.from(r.doc)]]);
      record = r.record; t.glbMs = r.glbMs; t.captureMs = r.captureMs; t.stability = r.stability;
    }
    // Imagen limpia del lienzo con la MISMA cámara (sin paneles): referencia RUBIK para la comparativa con Blender.
    const canvasShot = await page.evaluate(w => { const a = window.View3D.cameraState.aspect, s = window.View3D.deliveryShot({ width: w, height: Math.round(w / a), frame: false }); return s.dataUrl; }, o.shotWidth || 960);
    const after = await snapshot(), nav = await frameStats();
    if (before.project !== after.project) throw Error('Scene preparation changed the project (forbidden).');
    if (before.storage !== after.storage) throw Error('Scene preparation changed browser storage (forbidden).');
    if (errors.length) throw Error('Page errors: ' + errors.join(' | '));
    if (external.length) throw Error('External requests attempted: ' + external.join(', '));
    const manifest = JSON.parse(files.get('manifest.json'));
    if (sha(files.get('scene.glb')) !== manifest.files['scene.glb'].sha256) throw Error('scene.glb does not match its manifest');
    const projectCanonical = Buffer.from(Delivery.canonical(JSON.parse(before.project)));
    if (manifest.source.observedProjectSha256 !== sha(projectCanonical)) throw Error('Manifest project fingerprint mismatch');
    let revision = null; try { revision = execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); } catch {}
    fs.mkdirSync(dest, { recursive: true });
    for (const [n, b] of files) fs.writeFileSync(path.join(dest, n), b, { flag: 'wx' });
    fs.writeFileSync(path.join(dest, 'project.json'), projectCanonical, { flag: 'wx' });
    fs.writeFileSync(path.join(dest, 'record.json'), JSON.stringify(record, null, 1) + '\n', { flag: 'wx' });
    if (uiShot) fs.renameSync(uiShot, path.join(dest, 'ui-ready.png'));
    await page.screenshot({ path: path.join(dest, 'viewer.png') });
    fs.writeFileSync(path.join(dest, 'viewer-canvas.png'), Buffer.from(canvasShot.split(',')[1], 'base64'), { flag: 'wx' });
    const doc = JSON.parse(files.get('scene.json'));
    const report = { format: 'rubik-sota.scene-capture-run', version: '1.0.0', via, browser: browserName, browserVersion: browser.version(), scope, viewport,
      input: { file: path.basename(input), sha256: sha(inputBytes), kind: isBuilding ? 'building' : 'project' },
      code: { gitHead: revision, indexHtmlSha256: sha(fs.readFileSync(path.join(root, 'index.html'))), captureCoreSha256: sha(fs.readFileSync(path.join(root, 'js/scene-capture-core.js'))), deliveryCoreSha256: sha(fs.readFileSync(path.join(root, 'js/scene-delivery-core.js'))), harnessSha256: sha(fs.readFileSync(__filename)) },
      stats: doc.stats, excluded: doc.excluded, view: doc.view, stability: manifest.stability, fallbacks: manifest.fallbacks,
      metrics: { loadMs: t.loaded - t.load0, prepareMs: t2 - t1, captureMainThreadMs: t.captureMs ?? null, stability: t.stability ?? null, glbMs: t.glbMs != null ? Math.round(t.glbMs) : null, glbBytes: files.get('scene.glb').length, sceneJsonBytes: files.get('scene.json').length, navigationBefore: navBefore, navigationAfter: nav },
      invariants: { projectUnchanged: true, storageUnchanged: true, externalRequests: 0, pageErrors: 0, blockedAssetRequests: blocked },
      outputs: Object.fromEntries([...fs.readdirSync(dest)].sort().map(n => [n, { bytes: fs.statSync(path.join(dest, n)).size, sha256: sha(fs.readFileSync(path.join(dest, n))) }])) };
    fs.writeFileSync(path.join(dest, 'capture-report.json'), JSON.stringify(report, null, 1) + '\n', { flag: 'wx' });
    return report;
  } finally { await browser.close(); server.close(); }
}
module.exports = { capture, unzipStored };
if (require.main === module) {
  const a = process.argv.slice(2), [input, dest] = a, opt = {}, val = k => { const i = a.indexOf(k); return i > 0 ? a[i + 1] : undefined; };
  if (!input || !dest) { console.error('Usage: node scripts/interop/scene-capture.cjs PROJECT.json NEW-DEST [--via api|ui] [--scope active|all] [--browser chromium|firefox|webkit]'); process.exit(1); }
  opt.via = val('--via'); opt.scope = val('--scope'); opt.browser = val('--browser');
  if (val('--viewport')) { const [w, h] = val('--viewport').split('x').map(Number); opt.viewport = { width: w, height: h }; }
  if (val('--delay-assets-ms')) opt.delayAssetsMs = Number(val('--delay-assets-ms'));
  opt.blockAssets = a.includes('--block-assets'); opt.cancel = a.includes('--cancel');
  capture(path.resolve(input), path.resolve(dest), opt).then(r => console.log(JSON.stringify(r.cancelled !== undefined ? r : { via: r.via, browser: r.browser, stats: r.stats, metrics: r.metrics, assets: r.fallbacks.assets })))
    .catch(e => { console.error(e.stack || e.message); process.exitCode = 1; });
}
