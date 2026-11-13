// UX-08 · cotas en vivo al mover muebles, en el editor REAL (index.html): escritorio con ratón, teléfono y tableta con
// táctil real (eventos táctiles de Chromium, no ratón simulado).
// Durante el arrastre: cotas en mm que cambian y coinciden con el núcleo, sin capturar el puntero. Al soltar: nada queda
// dibujado, un solo paso de deshacer, deshacer/rehacer intactos y el proyecto guardado sin datos nuevos. Teclado (flechas),
// armario R03 con interior guardado, zoom, sin errores de consola ni desplazamiento horizontal.
const { test, before, after } = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs/promises'), path = require('node:path'), { createServer } = require('node:http'), { chromium } = require('playwright');
const root = path.resolve(__dirname, '..'), shots = process.env.UX08_SHOTS || null;
let server, browser, url;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.wasm': 'application/wasm' };
before(async () => {
  server = createServer(async (req, res) => {
    try { const p = new URL(req.url, 'http://local').pathname, file = path.resolve(root, '.' + (p === '/' ? '/index.html' : decodeURIComponent(p))); if (!file.startsWith(root + path.sep)) throw Error('path');
      res.setHeader('Content-Type', TYPES[path.extname(file)] || 'application/octet-stream'); res.end(await fs.readFile(file)); } catch { res.statusCode = 404; res.end(); }
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r)); url = `http://127.0.0.1:${server.address().port}/`;
  browser = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/chromium', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  if (shots) await fs.mkdir(shots, { recursive: true });
});
after(async () => { await browser?.close(); await new Promise(r => server?.close(r)); });

const VIEWPORTS = [{ width: 1440, height: 900, touch: false }, { width: 390, height: 844, touch: true }, { width: 820, height: 1180, touch: true }];
for (const vp of VIEWPORTS) test(`UX-08 cotas en vivo ${vp.width}x${vp.height} (${vp.touch ? 'táctil' : 'ratón'})`, { timeout: 300000 }, async t => {
  const name = `${vp.width}x${vp.height}`;
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.touch, hasTouch: vp.touch }); t.after(() => context.close());
  const page = await context.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await page.route('https://cdn.jsdelivr.net/**', r => r.abort()); // 2D: no hace falta three
  await page.goto(url); await require('./editor-fixture.cjs')(page);
  const cdp = vp.touch ? await context.newCDPSession(page) : null;

  // Una cama dentro de su estancia, con cotas: el ejemplo de RUBIK (datos sintéticos).
  const id = await page.evaluate(() => project.objects.find(o => o.type === 'bed' && FloorPlanLiveDimensions.measure(geometry, getF(o.id)).status === 'ok').id);
  // Centrar el mueble en el plano con un zoom de trabajo (el mismo para todos los tamaños de pantalla).
  const center = async (fid, s) => page.evaluate(([fid, s]) => { const f = getF(fid), r = document.querySelector('#plan').getBoundingClientRect(); view.s = s; view.x0 = f.cx - r.width / 2 / s; view.y0 = f.cy - r.height / 2 / s; applyView(); }, [fid, s]);
  const screen = fid => page.evaluate(fid => { const f = getF(fid), m = new DOMPoint(f.cx, f.cy).matrixTransform(document.querySelector('#plan').getScreenCTM()); return { x: m.x, y: m.y }; }, fid);
  const shown = () => page.$$eval('#gSel [data-live-dims="ok"] text[data-mm]', ts => Object.fromEntries(ts.map(t => [t.dataset.side, +t.dataset.mm])));
  // Cifras dibujadas y cifras del núcleo leídas en el MISMO turno de la página: entre dos lecturas separadas puede
  // llegar un toque o movimiento pendiente y mover el mueble (carrera de la prueba, no del producto).
  const pair = fid => page.evaluate(fid => ({ got: Object.fromEntries([...document.querySelectorAll('#gSel [data-live-dims="ok"] text[data-mm]')].map(t => [t.dataset.side, +t.dataset.mm])),
    want: Object.fromEntries(FloorPlanLiveDimensions.measure(geometry, getF(fid), { prefer: { top: .25 } }).sides.map(s => [s.side, s.mm])) }), fid);
  const state = () => page.evaluate(() => ({ undo: undoStack.length, json: JSON.stringify(project), stored: localStorage.getItem(STORE) || '' }));
  const down = async p => { if (cdp) await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x, y: p.y, id: 1 }] }); else { await page.mouse.move(p.x, p.y); await page.mouse.down(); } };
  const move = async p => { if (cdp) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: p.x, y: p.y, id: 1 }] }); else await page.mouse.move(p.x, p.y, { steps: 3 }); await page.waitForTimeout(60); };
  const up = async () => { if (cdp) await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); else await page.mouse.up(); await page.waitForTimeout(200); };

  await center(id, 0.12); await page.evaluate(fid => select({ kind: 'furn', id: fid }), id); await page.waitForTimeout(200);
  assert.equal(await page.locator('#gSel .live-dims').count(), 0, 'sin mover, no hay cotas');
  const s0 = await state(), p0 = await page.evaluate(fid => { const f = getF(fid); return { cx: f.cx, cy: f.cy }; }, id), at = await screen(id);

  // 1 · Arrastre: aparecen las cotas, en mm, iguales a las del núcleo, y cambian a cada paso.
  await down(at); const seen = [];
  for (let i = 1; i <= 4; i++) {
    await move({ x: at.x + i * 14, y: at.y + i * 6 });
    const { got, want } = await pair(id);
    assert.ok(Object.keys(got).length >= 2, `paso ${i}: hay cotas (${JSON.stringify(got)})`);
    for (const [side, mm] of Object.entries(got)) assert.equal(mm, want[side], `paso ${i}, lado ${side}: la cifra es la del núcleo`);
    seen.push(JSON.stringify(got));
    if (i === 2 && shots) await page.screenshot({ path: path.join(shots, `${name}-arrastre.png`) });
  }
  assert.ok(new Set(seen).size >= 3, `las cifras cambian durante el arrastre: ${seen.join(' | ')}`);
  // La capa no recibe el puntero: el elemento bajo una cifra no es la cifra.
  assert.equal(await page.$eval('#gSel .live-dims', g => g.getAttribute('pointer-events')), 'none');
  const hitLabel = await page.evaluate(() => { const t = document.querySelector('#gSel .live-dims text'); if (!t) return null; const r = t.getBoundingClientRect(); return !!document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.closest('.live-dims'); });
  assert.equal(hitLabel, false, 'las cifras no capturan el puntero');
  // El arrastre sigue siendo el de siempre: la posición la decide snapMove (rejilla de 10 mm / ajuste a muros).
  const mid = await page.evaluate(fid => { const f = getF(fid); return { cx: f.cx, cy: f.cy }; }, id);
  assert.notDeepEqual([mid.cx, mid.cy], [p0.cx, p0.cy], 'el mueble se mueve');
  assert.deepEqual(await page.evaluate(fid => { const f = getF(fid); return snapMove(f, f.cx, f.cy); }, id), [mid.cx, mid.cy], 'la posición es la de snapMove, sin cambios');
  await up();

  // 2 · Al soltar: nada queda dibujado, un solo paso de deshacer, el proyecto guardado no lleva datos visuales.
  assert.equal(await page.locator('#gSel .live-dims').count(), 0, 'al soltar desaparecen');
  const s1 = await state();
  assert.equal(s1.undo, s0.undo + 1, 'un paso de deshacer, como antes');
  for (const txt of [s1.json, s1.stored]) assert.doesNotMatch(txt, /live-dims|liveDim|data-mm|cotas/i, 'nada visual se guarda');
  const keys = j => JSON.stringify(Object.keys(JSON.parse(j)).sort()) + JSON.stringify(JSON.parse(j).extensions || null);
  assert.equal(keys(s1.json), keys(s0.json), 'ni campos ni extensiones nuevas');
  await page.evaluate(() => undo()); assert.deepEqual(await page.evaluate(fid => [getF(fid).cx, getF(fid).cy], id), [p0.cx, p0.cy], 'deshacer devuelve la posición');
  await page.evaluate(() => redo()); assert.notDeepEqual(await page.evaluate(fid => [getF(fid).cx, getF(fid).cy], id), [p0.cx, p0.cy], 'rehacer la vuelve a aplicar');
  assert.equal(await page.locator('#gSel .live-dims').count(), 0);

  // 3 · Zoom distinto: las cifras siguen siendo las del núcleo (mm reales, no píxeles).
  await center(id, 0.3); const at2 = await screen(id); await down(at2); await move({ x: at2.x - 20, y: at2.y }); await move({ x: at2.x - 30, y: at2.y + 4 });
  const { got: z, want: zw } = await pair(id); for (const [side, mm] of Object.entries(z)) assert.equal(mm, zw[side]); assert.ok(Object.keys(z).length >= 2);
  await up();

  // 4 · Armario R03 con su interior guardado: también tiene cotas y moverlo no toca el interior.
  const W = 'obj_template-004';
  await page.evaluate(W => { const o = RubikCabinetBridge.open(project, W); mutate(() => { const r = RubikCabinetBridge.save(project, o.session); if (!r.ok) throw Error('R03'); project = r.project; }); }, W);
  const ext0 = await page.evaluate(() => JSON.stringify(project.extensions['x-r03-cabinet']));
  await center(W, 0.12); await page.evaluate(W => select({ kind: 'furn', id: W }), W); await page.waitForTimeout(150);
  const aw = await screen(W); await down(aw); await move({ x: aw.x - 10, y: aw.y - 12 }); await move({ x: aw.x - 18, y: aw.y - 20 });
  assert.ok(Object.keys(await shown()).length >= 1, 'el armario R03 tiene cotas');
  if (shots && !vp.touch) await page.screenshot({ path: path.join(shots, `${name}-armario-r03.png`) });
  await up();
  assert.equal(await page.evaluate(W => RubikCabinetContract.read(project, W).status, W), 'ok', 'el interior R03 sigue guardado');
  assert.equal(await page.evaluate(() => JSON.stringify(project.extensions['x-r03-cabinet'])), ext0, 'mover no cambia el interior');

  // 5 · Teclado (escritorio): una flecha mueve 10 mm, muestra las cotas un momento y se ocultan solas.
  if (!vp.touch) {
    await page.evaluate(fid => select({ kind: 'furn', id: fid }), id); await page.locator('#plan').focus().catch(() => {});
    const u0 = (await state()).undo; await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(100);
    assert.ok(Object.keys(await shown()).length >= 2, 'con las flechas también hay cotas');
    assert.equal((await state()).undo, u0 + 1, 'una flecha = un paso de deshacer, como antes');
    await page.waitForTimeout(1700); assert.equal(await page.locator('#gSel .live-dims').count(), 0, 'y se ocultan solas');
  }
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'sin desplazamiento horizontal');
  assert.deepEqual(errors, []);
});
