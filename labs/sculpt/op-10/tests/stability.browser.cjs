'use strict';
// SCULPT OP-10 · Estado de escena: la regla de estabilidad detecta las transiciones reales del visor de RUBIK.
// Mide, fotograma a fotograma, cuándo cambia la firma de la escena: entrada en 3D (crecimiento), cambio de vista de
// plantas (reconstrucción) y alternancia de una puerta. Nunca modifica el producto.
// Uso: CHROME=... node labs/sculpt/op-10/tests/stability.browser.cjs FIXTURE-DIR OUT.json
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), { chromium } = require('playwright');
const root = path.resolve(process.env.OP10_APP_ROOT || path.resolve(__dirname, '../../../..'));
(async () => {
  const [fx, outPath] = process.argv.slice(2); if (fs.existsSync(outPath)) throw Error('Refusing overwrite');
  const srv = http.createServer((q, r) => { let p = new URL(q.url, 'http://x').pathname; if (p === '/') p = '/index.html'; fs.readFile(path.join(root, decodeURIComponent(p)), (e, d) => { if (e) { r.statusCode = 404; return r.end(); } r.setHeader('Content-Type', /\.m?js$/.test(p) ? 'text/javascript' : p.endsWith('.html') ? 'text/html' : p.endsWith('.css') ? 'text/css' : p.endsWith('.json') ? 'application/json' : 'application/octet-stream'); r.end(d); }); }).listen(0);
  await new Promise(r => srv.on('listening', r));
  const b = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await b.newPage({ viewport: { width: 1280, height: 800 } }), errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => { window.__THREE_DEVTOOLS__ = new EventTarget(); window.__op10Scenes = []; __THREE_DEVTOOLS__.addEventListener('observe', e => { if (e.detail && e.detail.isScene) window.__op10Scenes.push(e.detail); });
    window.__sig = () => { let s = ''; for (const sc of window.__op10Scenes) sc.traverse(o => { if (!o.isMesh || !o.visible) return; s += o.uuid + (o.geometry && o.geometry.uuid) + o.matrixWorld.elements.map(v => v.toFixed(6)).join(','); }); return s.length + ':' + s; };
    window.__trace = async n => { let last = window.__sig(), lastChange = 0, changed = 0; for (let i = 0; i < n; i++) { await new Promise(r => requestAnimationFrame(r)); const s = window.__sig(); if (s !== last) { lastChange = i + 1; changed++; last = s; } } return { frames: n, changedFrames: changed, lastChangeAtFrame: lastChange }; }; });
  await page.goto(`http://127.0.0.1:${srv.address().port}/`); await page.waitForFunction(() => window.FloorPlanApp && window.View3D); await page.evaluate(() => document.querySelector('#welcomeDialog')?.close?.());
  const result = { fixture: path.basename(fx), appRoot: process.env.OP10_APP_ROOT ? 'override' : 'lab-worktree', phases: {} };
  await page.locator('#fileIn').setInputFiles(path.join(fx, 'f4-building.json')); await page.waitForTimeout(1500);
  // 1 · Entrada en 3D: la firma cambia mientras crece la escena; después se estabiliza.
  result.phases.enter3d = await page.evaluate(() => { const p = window.__trace(360); setView('3d'); return p; });
  // 2 · Cambio a «todas las plantas»: reconstrucción.
  result.phases.levelViewAll = await page.evaluate(() => { const p = window.__trace(240); document.querySelector('#levelViewAll').click(); return p; });
  // 3 · Escena en reposo: ningún cambio durante 120 fotogramas (lo que exige la captura son 30).
  result.phases.idle = await page.evaluate(() => window.__trace(120));
  result.doors = await page.evaluate(() => (window.View3D.walkDoors || []).map(d => ({ id: d.id, settled: Math.abs(d.angle - (d.open ? d.openAngle : d.closedAngle)) < 1e-3 })));
  result.errors = errors; await b.close(); srv.close();
  result.verdict = { transitionsDetected: result.phases.enter3d.lastChangeAtFrame > 0 && result.phases.levelViewAll.lastChangeAtFrame > 0, idleStable: result.phases.idle.lastChangeAtFrame === 0, pageErrors: errors.length };
  fs.writeFileSync(outPath, JSON.stringify(result, null, 1) + '\n', { flag: 'wx' }); console.log(JSON.stringify(result.verdict), JSON.stringify(result.phases));
})().catch(e => { console.error(e); process.exitCode = 1; });
