'use strict';
/* SCULPT OP-10 · Captura de la escena 3D REAL de RUBIK en un navegador sin interfaz (laboratorio).
 *
 * No modifica index.html ni ningún archivo del producto. Obtiene la escena con el hook estándar de las herramientas de
 * desarrollo de Three.js (`__THREE_DEVTOOLS__`, el mismo que usó scripts/offline-pilot/capture-visual.cjs), carga el
 * fixture por el camino real del usuario (#fileIn) y solo captura cuando la escena es estable:
 *   1. ninguna petición de recurso (GLB/imagen) en curso;
 *   2. puertas en su ángulo objetivo (View3D.walkDoors);
 *   3. firma de la escena (mallas visibles, geometrías, matrices e instancias) idéntica durante N fotogramas seguidos.
 * El sondeo usa requestAnimationFrame temporal, sin renderizar: no es un segundo bucle de render y termina con la captura.
 *
 * Uso: node capture-browser.cjs FIXTURE.json DESTINO-NUEVO [--scope active|all] [--viewport 1280x800]
 *      (env CHROME = Chromium; el resultado no sobrescribe nada)
 */
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), crypto = require('node:crypto'), { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
// OP10_APP_ROOT permite servir OTRO árbol de la app (p. ej. el ensayo de compatibilidad con OP-02) sin tocarlo.
const root = path.resolve(process.env.OP10_APP_ROOT || path.resolve(__dirname, '../../../..')), lab = path.resolve(__dirname, '..');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const canonical = x => JSON.stringify(sortKeys(x));
function sortKeys(x) { if (Array.isArray(x)) return x.map(sortKeys); if (x && typeof x === 'object') return Object.fromEntries(Object.keys(x).sort().map(k => [k, sortKeys(x[k])])); return x; }
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.glb': 'model/gltf-binary', '.svg': 'image/svg+xml', '.wasm': 'application/wasm', '.txt': 'text/plain' };
const STABLE_FRAMES = 30;
// Perfil de límites del laboratorio para escenas RUBIK (el del donante, 300 k, es insuficiente para el ejemplo con 46
// muebles procedimentales). Valores fijados tras medir los fixtures; ver docs/04-metricas.md.
const RUBIK_LIMITS = { meshes: 20000, vertices: 1500000, faces: 1500000, instances: 50000, bytes: 128 * 1024 * 1024 };

async function capture(fixturePath, dest, { scope = 'active', viewport = { width: 1280, height: 800 }, chrome = process.env.CHROME, limits = RUBIK_LIMITS } = {}) {
  if (fs.existsSync(dest)) throw Error('Refusing overwrite: ' + dest);
  const fixtureBytes = fs.readFileSync(fixturePath), fixture = JSON.parse(fixtureBytes), isBuilding = Array.isArray(fixture.levels);
  const coreSource = fs.readFileSync(path.join(lab, 'src/scene-capture-core.js'), 'utf8');
  const external = [], server = http.createServer((req, res) => {
    try { const p = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://l').pathname.replace(/^\/$/, '/index.html')));
      if (!p.startsWith(root + path.sep)) throw Error(); res.setHeader('Content-Type', types[path.extname(p)] || 'application/octet-stream'); res.end(fs.readFileSync(p)); }
    catch { res.writeHead(404); res.end(); }
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch({ ...(chrome ? { executablePath: chrome } : {}), args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const t = {};
  try {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1 }), page = await context.newPage(), errors = [], inflight = new Set();
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
    // Red: solo el servidor local. Cualquier otra petición se bloquea y se registra (privacidad y reproducibilidad).
    const delayMs = Number(process.env.OP10_DELAY_ASSETS_MS || 0); // ensayo: retrasa los GLB para probar la espera de carga asíncrona
    await context.route('**/*', async r => { const u = r.request().url(); if (u.startsWith(base)) { if (delayMs && /\.glb(\?|$)/.test(u)) await new Promise(res => setTimeout(res, delayMs)); return r.continue(); } external.push(u); return r.abort(); });
    page.on('request', r => { if (/\.(glb|gltf|webp|png|jpe?g|ktx2)(\?|$)/.test(r.url())) inflight.add(r); });
    page.on('requestfinished', r => inflight.delete(r)); page.on('requestfailed', r => inflight.delete(r));
    await page.addInitScript(source => {
      window.__THREE_DEVTOOLS__ = new EventTarget(); window.__op10Scenes = [];
      window.__THREE_DEVTOOLS__.addEventListener('observe', e => { if (e.detail && e.detail.isScene) window.__op10Scenes.push(e.detail); });
      // eslint-disable-next-line no-new-func
      (0, eval)(source); // RubikSceneCapture: núcleo puro del laboratorio, sin efectos sobre la app
    }, coreSource);
    t.load0 = Date.now();
    await page.goto(base);
    await page.waitForFunction(() => window.FloorPlanApp && window.View3D && window.FloorPlanCore, null, { timeout: 120000 });
    await page.evaluate(() => { document.querySelector('#welcomeDialog')?.close?.(); });
    const tmp = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'op10-fixture-')), file = path.join(tmp, path.basename(fixturePath));
    fs.writeFileSync(file, fixtureBytes);
    await page.locator('#fileIn').setInputFiles(file);
    const expectId = isBuilding ? fixture.levels[0].project.id : fixture.id;
    await page.waitForFunction(id => window.FloorPlanApp.project && (window.FloorPlanApp.project.id === id || (window.FloorPlanApp.levelContext && JSON.stringify(window.FloorPlanApp.levelContext).includes(id))), expectId, { timeout: 120000 });
    await page.evaluate(() => setView('3d'));
    await page.waitForFunction(() => window.FloorPlanApp.viewMode === '3d' && window.__op10Scenes.length > 0, null, { timeout: 120000 });
    if (isBuilding) {
      // Vista «activa»: plantas hasta la activa (la baja: 1). Vista «todas»: el edificio apilado completo.
      await page.waitForFunction(() => window.View3D.levelInspect().levels.length >= 1, null, { timeout: 120000 });
      if (scope === 'all') { await page.evaluate(() => document.querySelector('#levelViewAll').click()); await page.waitForFunction(n => window.View3D.levelView === 'all' && window.View3D.levelInspect().levels.length === n, fixture.levels.length, { timeout: 120000 }); }
    }
    t.loaded = Date.now();

    // Estabilidad: red quieta + puertas en reposo + firma idéntica durante STABLE_FRAMES fotogramas.
    const stability = { frames: 0, waitedMs: 0, inflightAtCapture: 0 };
    const deadline = Date.now() + 120000;
    for (;;) {
      if (Date.now() > deadline) throw Error('Scene did not stabilise within 120 s (no capture of a transitional scene).');
      if (inflight.size) { await page.waitForTimeout(100); continue; }
      const r = await page.evaluate(async n => {
        const doorsSettled = () => (window.View3D.walkDoors || []).every(d => Math.abs(d.angle - (d.open ? d.openAngle : d.closedAngle)) < 1e-3);
        const signature = () => { let s = ''; for (const sc of window.__op10Scenes) sc.traverse(o => { if (!o.isMesh || !o.visible) return; s += o.uuid + (o.geometry && o.geometry.uuid) + o.matrixWorld.elements.map(v => v.toFixed(6)).join(','); if (o.isInstancedMesh) s += o.count + ':' + o.instanceMatrix.version; }); return s.length + ':' + s; };
        const first = signature(); let same = 0;
        for (let i = 0; i < n; i++) { await new Promise(r => requestAnimationFrame(r)); if (signature() === first && doorsSettled()) same++; else return { stable: false }; }
        const loading = (window.View3D.assetMetrics || []).some(a => a.state === 'loading');
        return { stable: same === n && !window.View3D.suspended && !loading };
      }, STABLE_FRAMES);
      if (r.stable && !inflight.size) { stability.frames = STABLE_FRAMES; break; }
    }
    stability.waitedMs = Date.now() - t.loaded; t.stable = Date.now();

    // Estado antes de capturar: proyecto canónico y almacenamiento (la captura no debe cambiar nada).
    const snapshot = () => page.evaluate(() => ({ project: JSON.stringify(window.FloorPlanApp.project), storage: JSON.stringify(Object.keys(localStorage).sort().map(k => [k, localStorage.getItem(k)])) }));
    const frameStats = () => page.evaluate(async () => { const d = []; let p = performance.now(); for (let i = 0; i < 60; i++) { await new Promise(r => requestAnimationFrame(r)); const n = performance.now(); d.push(n - p); p = n; } d.sort((a, b) => a - b); return { medianMs: Math.round(d[30] * 10) / 10, p95Ms: Math.round(d[57] * 10) / 10 }; });
    const navBefore = await frameStats();
    const before = await snapshot();
    const result = await page.evaluate(([scopeArg, limitsArg]) => {
      const sc = window.__op10Scenes.find(s => s.children.length) || window.__op10Scenes[0];
      const project = window.FloorPlanApp.project, center = window.FloorPlanCore.geometry(project).center, level = window.FloorPlanApp.levelContext;
      const objects = new Map();
      const states = new Map((window.View3D.assetMetrics || []).map(a => [a.id, a]));
      sc.traverse(o => { if (o.userData && typeof o.userData.fid === 'string' && !objects.has(o.userData.fid)) { const a = states.get(o.userData.fid) || {};
        objects.set(o.userData.fid, { id: o.userData.fid, assetState: a.state || 'unknown', reason: a.reason || null, authorizedAssetLoaded: !!o.userData.authorizedAsset, visible: o.visible }); } });
      const frames = []; let last = performance.now();
      const t0 = performance.now();
      // Suelo decorativo del visor: plano de 160 × 160 m hijo directo de la escena (index.html, `ground`). No es la vivienda.
      const excludeNodes = new Map(sc.children.filter(o => o.isMesh && o.geometry && o.geometry.type === 'PlaneGeometry' && o.geometry.parameters.width >= 100).map(o => [o, 'decorative-ground']));
      const doc = window.RubikSceneCapture.capture(sc, { unitsToMetres: 1, excludeNodes, limits: limitsArg, scope: scopeArg === 'all' ? 'stacked-levels' : 'active-level',
        frame: { source: 'RUBIK View3D', originPlanMm: center, mapping: 'x=(planX-originX)/1000, y=elevation/1000 (active level at y=0), z=(planY-originY)/1000', activeLevelId: level ? level.activeLevelId || null : null, levelView: window.View3D.levelView } });
      const t1 = performance.now(), json = window.RubikSceneCapture.toJSON(doc, limitsArg), t2 = performance.now();
      return { json, captureMs: t1 - t0, serializeMs: t2 - t1, objects: [...objects.values()].sort((a, b) => a.id.localeCompare(b.id)),
        projectId: project.id, projectUpdatedAt: project.updatedAt, threeRevision: window.__op10Scenes[0] && window.__op10Scenes[0].constructor ? null : null };
    }, [scope, limits]);
    const after = await snapshot();
    if (before.project !== after.project) throw Error('Capture changed the project (forbidden).');
    if (before.storage !== after.storage) throw Error('Capture changed browser storage (forbidden).');
    // Impacto en la navegación: intervalo de fotogramas medido en una ventana posterior (la captura es síncrona).
    const nav = await frameStats();
    if (errors.length) throw Error('Page errors: ' + errors.join(' | '));
    if (external.length) throw Error('External requests attempted: ' + external.join(', '));

    const sceneBytes = Buffer.from(result.json), doc = JSON.parse(result.json);
    const projectCanonical = Buffer.from(canonical(JSON.parse(before.project)));
    let revision = null; try { revision = execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); } catch {}
    const materials = {}; for (const m of doc.meshes) { const key = `${m.material.kind}|${m.material.color}|${m.material.hasMap ? 'map' : 'flat'}`; materials[key] = (materials[key] || 0) + 1; }
    const manifest = {
      format: 'rubik-sota.op10-scene-manifest', version: '0.1.0-lab', status: 'experimental · observed visual snapshot, not canonical geometry',
      source: { fixture: path.basename(fixturePath), fixtureSha256: sha(fixtureBytes), kind: isBuilding ? 'building' : 'project',
        projectId: result.projectId, projectUpdatedAt: result.projectUpdatedAt, projectCanonicalSha256: sha(projectCanonical) },
      code: { gitHead: revision, indexHtmlSha256: sha(fs.readFileSync(path.join(root, 'index.html'))), coreSha256: sha(Buffer.from(coreSource)), harnessSha256: sha(fs.readFileSync(__filename)), three: 'r160 (vendor/three)' },
      scope: doc.scope, frame: doc.frame, units: doc.units, axes: doc.axes, unitsToMetresApplied: doc.unitsToMetresApplied,
      blenderTransform: 'Blender Z-up: (XB, YB, ZB) = (x, -z, y), applied ONCE by the importer; no other conversion',
      stats: doc.stats, entities: doc.entities.length, excluded: doc.excluded, skipped: doc.skipped, policy: doc.policy,
      materials: Object.entries(materials).map(([k, n]) => { const [kind, color, map] = k.split('|'); return { kind, color, map, meshes: n }; }),
      fallbacks: { texturesNotCopied: doc.meshes.filter(m => m.material.hasMap).length, assetStates: result.objects.reduce((acc, o) => { acc[o.assetState] = (acc[o.assetState] || 0) + 1; return acc; }, {}), assetErrors: result.objects.filter(o => o.assetState === 'error').map(o => ({ id: o.id, reason: o.reason, fallback: 'procedural/generic representation kept by the viewer' })) },
      objects: result.objects,
      stability: { ...stability, rule: `no asset request in flight, no asset in state «loading», doors settled, scene signature identical for ${STABLE_FRAMES} frames` },
      limits, metrics: { loadMs: t.loaded - t.load0, captureMs: Math.round(result.captureMs * 10) / 10, serializeMs: Math.round(result.serializeMs * 10) / 10, sceneBytes: sceneBytes.length, navigationBefore: navBefore, navigationAfter: nav, captureBlocksMainThreadMs: Math.round((result.captureMs + result.serializeMs) * 10) / 10, viewport },
      invariants: { projectUnchanged: true, storageUnchanged: true, externalRequests: 0, pageErrors: 0 },
      outputs: { 'scene.json': { bytes: sceneBytes.length, sha256: sha(sceneBytes) } },
    };
    fs.mkdirSync(dest, { recursive: true });
    fs.writeFileSync(path.join(dest, 'scene.json'), sceneBytes, { flag: 'wx' });
    fs.writeFileSync(path.join(dest, 'manifest.json'), JSON.stringify(manifest, null, 1) + '\n', { flag: 'wx' });
    fs.writeFileSync(path.join(dest, 'project.json'), projectCanonical, { flag: 'wx' }); // estado canónico observado (fuente A)
    await page.screenshot({ path: path.join(dest, 'viewer.png') });
    return manifest;
  } finally { await browser.close(); server.close(); }
}
module.exports = { capture, canonical, sha };
if (require.main === module) {
  const args = process.argv.slice(2), [fixture, dest] = args, opt = {};
  const i = args.indexOf('--scope'); if (i > 0) opt.scope = args[i + 1];
  const v = args.indexOf('--viewport'); if (v > 0) { const [w, h] = args[v + 1].split('x').map(Number); opt.viewport = { width: w, height: h }; }
  if (!fixture || !dest) { console.error('Uso: node capture-browser.cjs FIXTURE.json DESTINO-NUEVO [--scope active|all]'); process.exit(1); }
  capture(path.resolve(fixture), path.resolve(dest), opt).then(m => console.log(JSON.stringify({ scope: m.scope, stats: m.stats, excluded: m.excluded, metrics: m.metrics, objects: m.objects.length, assets: m.fallbacks.assetStates })))
    .catch(e => { console.error(e.stack || e.message); process.exitCode = 1; });
}
