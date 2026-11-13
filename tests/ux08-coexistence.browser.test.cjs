'use strict';
/* UX-08 (cotas en vivo) en el MISMO editor real que R03 (armarios, x-r03-cabinet) y R02-A (techos, x-r02a-ceiling).
   Datos SINTÉTICOS: piso de ejemplo; armario de referencia y plafón en el dormitorio principal.
   Se comprueba que mover un mueble en una estancia con referencia vertical y elemento de techo muestra cotas iguales a las
   del núcleo, sin tocar la capa de techo (#gCeiling) ni ninguna de las dos extensiones, con un paso de deshacer;
   que las cotas no llegan a la lámina, al PNG, al JSON, al historial ni al almacén; y que al reabrir todo sigue igual. */
const test = require('node:test'), assert = require('node:assert/strict');
const K = require('./r02a/editor-kit.cjs');
let env; test.before(async () => { env = await K.start(); }); test.after(async () => { await env?.stop(); });
const ROOM = 'rom_master', WARDROBE = 'obj_template-004', DIMS = /live-dims|data-mm=|Sin cotas/;
const sec = page => page.locator('section.r02a-ceiling');
const both = page => page.evaluate(() => ({ r03: structuredClone(window.FloorPlanApp.project.extensions?.['x-r03-cabinet'] ?? null), r02a: structuredClone(window.FloorPlanApp.project.extensions?.['x-r02a-ceiling'] ?? null),
  keys: Object.keys(window.FloorPlanApp.project.extensions || {}).sort() }));
const freeSpot = page => page.evaluate(room => {
  const p = window.FloorPlanApp.project, S = window.RubikCeilingSession, X = window.RubikCeilingContract, r = p.rooms.find(x => x.id === room), c = S.CATALOG.ceilinglight;
  const xs = r.polygon.map(q => q.x), ys = r.polygon.map(q => q.y);
  for (let i = 1; i < 12; i++) for (let j = 1; j < 12; j++) {
    const pos = { x: Math.round(Math.min(...xs) + (Math.max(...xs) - Math.min(...xs)) * i / 12), y: Math.round(Math.min(...ys) + (Math.max(...ys) - Math.min(...ys)) * j / 12) };
    const ev = S.evaluate({ project: p, ceiling: X.verticalFor(p, room), request: { id: 'cei_probe-1', type: 'ceilinglight', position: pos, size: { widthMm: c.widthMm, depthMm: c.depthMm, heightMm: c.heightMm }, dropMm: 0 }, accepted: X.asRequests(p) });
    if (ev.ok && ev.proposal.roomId === room && ev.state === 'candidate-reviewable' && !ev.diff.relocated) return pos;
  } return null; }, ROOM);
const center = (page, fid, s) => page.evaluate(([fid, s]) => { const f = getF(fid), r = document.querySelector('#plan').getBoundingClientRect(); view.s = s; view.x0 = f.cx - r.width / 2 / s; view.y0 = f.cy - r.height / 2 / s; applyView(); }, [fid, s]);
const screenOf = (page, fid) => page.evaluate(fid => { const f = getF(fid), m = new DOMPoint(f.cx, f.cy).matrixTransform(document.querySelector('#plan').getScreenCTM()); return { x: m.x, y: m.y }; }, fid);
const shown = page => page.$$eval('#gSel [data-live-dims="ok"] text[data-mm]', ts => Object.fromEntries(ts.map(t => [t.dataset.side, +t.dataset.mm])));
const expected = (page, fid) => page.evaluate(fid => Object.fromEntries(FloorPlanLiveDimensions.measure(geometry, getF(fid), { prefer: { top: .25 } }).sides.map(s => [s.side, s.mm])), fid);
const pos = (page, fid) => page.evaluate(fid => [getF(fid).cx, getF(fid).cy], fid);
// Elementos de techo GUARDADOS en su capa 2D (el borrador de la sección de R02-A solo se dibuja con su sección abierta).
const ceilingLayer = page => page.evaluate(() => [...document.querySelectorAll('#gCeiling [data-item]')].map(g => g.outerHTML).join('') || null);

// Prepara la estancia: referencia vertical + plafón (R02-A, por su sección) y armario con interior (R03, por su puente).
async function prepare(page, touch = false) {
  assert.ok(await page.evaluate(() => !!window.RubikCabinetBridge && !!window.RubikCeilingEditor && !!window.FloorPlanLiveDimensionsUI), 'R03, R02-A y UX-08 cargados');
  // En el teléfono el panel es un cajón: cerrado para tocar la estancia, abierto para su sección (como la prueba móvil de R02-A).
  const panel = open => page.evaluate(open => { if (document.querySelector('aside.right')?.classList.contains('open') !== open) document.querySelector('#tgPanel')?.click(); }, open);
  if (touch) await panel(false);
  await K.selectRoom(page, ROOM, { touch }); if (touch) await panel(true); await K.openSection(page);
  await sec(page).locator('[data-f="clear"]').fill('2600'); await sec(page).locator('[data-f="source"]').fill('medición sintética de prueba'); await sec(page).locator('[data-r02a="ref-save"]').click();
  const p = await freeSpot(page); assert.ok(p, 'hay sitio para el plafón');
  await sec(page).locator('[data-f="type"]').selectOption('ceilinglight'); await sec(page).locator('[data-f="x"]').fill(String(p.x)); await sec(page).locator('[data-f="y"]').fill(String(p.y));
  await sec(page).locator('[data-r02a="check"]').click(); await sec(page).locator('[data-f="confirmed"]').check(); await sec(page).locator('[data-r02a="save"]').click();
  await page.evaluate(W => { const o = RubikCabinetBridge.open(project, W); mutate(() => { const r = RubikCabinetBridge.save(project, o.session); if (!r.ok) throw Error('R03'); project = r.project; }); }, WARDROBE);
  const s = await both(page);
  assert.equal(s.r02a.items.length, 1, 'un elemento de techo'); assert.ok(JSON.stringify(s.r02a.verticalReferences ?? null).includes('2600'), 'referencia vertical guardada');
  assert.equal(s.r03.entries.length, 1, 'un interior de armario');
  assert.equal(await page.evaluate(W => RubikCabinetContract.read(project, W).status, WARDROBE), 'ok');
  if (touch) await panel(false);
  return s;
}

test('UX-08 + R03 + R02-A, escritorio con ratón: cotas en la estancia con techo, sin tocar techo ni interior; nada llega a exportaciones; reabrir', { timeout: 300000 }, async () => {
  const { context, page, watch } = await K.editor(env);
  try {
    const s0 = await prepare(page);
    await page.keyboard.press('Escape'); await center(page, WARDROBE, 0.12); await page.evaluate(W => select({ kind: 'furn', id: W }), WARDROBE); await page.waitForTimeout(200);
    const layer0 = await ceilingLayer(page), u0 = await page.evaluate(() => undoStack.length), p0 = await pos(page, WARDROBE);
    assert.ok(layer0 && layer0.length > 0, 'el plafón se dibuja en su capa 2D');

    // C · Arrastrar el armario en la estancia con techo: cotas del núcleo, de esa estancia; la capa de techo no cambia.
    const at = await screenOf(page, WARDROBE); await page.mouse.move(at.x, at.y); await page.mouse.down();
    const seen = [];
    for (let i = 1; i <= 3; i++) {
      await page.mouse.move(at.x - i * 8, at.y - i * 10, { steps: 3 }); await page.waitForTimeout(60);
      const got = await shown(page), want = await expected(page, WARDROBE);
      assert.ok(Object.keys(got).length >= 1, `paso ${i}: hay cotas (${JSON.stringify(got)})`);
      for (const [side, mm] of Object.entries(got)) assert.equal(mm, want[side], `paso ${i}, ${side}: cifra del núcleo`);
      seen.push(JSON.stringify(got));
    }
    assert.ok(new Set(seen).size >= 2, `las cifras cambian: ${seen.join(' | ')}`);
    assert.equal(await page.$eval('#gSel .live-dims', g => g.dataset.room), ROOM, 'medidas contra la estancia del techo');
    assert.equal(await page.locator('#gCeiling .live-dims').count(), 0, 'las cotas no se dibujan en la capa de techo');
    assert.equal(await ceilingLayer(page), layer0, 'la capa de techo no cambia durante el arrastre');
    await page.mouse.up(); await page.waitForTimeout(200);
    assert.equal(await page.locator('#gSel .live-dims').count(), 0, 'al soltar desaparecen');
    assert.equal(await page.evaluate(() => undoStack.length), u0 + 1, 'un paso de deshacer');
    const p1 = await pos(page, WARDROBE); assert.notDeepEqual(p1, p0, 'el armario se mueve');
    let s = await both(page);
    assert.deepEqual(s.r02a, s0.r02a, 'x-r02a-ceiling intacto tras mover'); assert.deepEqual(s.r03, s0.r03, 'x-r03-cabinet intacto tras mover'); assert.deepEqual(s.keys, s0.keys, 'sin extensiones nuevas');
    assert.equal(await ceilingLayer(page), layer0, 'el plafón sigue igual en 2D');

    // Deshacer / rehacer: posición atrás y adelante; las dos extensiones, iguales.
    await page.keyboard.press('Control+z'); assert.deepEqual(await pos(page, WARDROBE), p0); s = await both(page); assert.deepEqual(s.r02a, s0.r02a); assert.deepEqual(s.r03, s0.r03);
    await page.keyboard.press('Control+Shift+z'); assert.deepEqual(await pos(page, WARDROBE), p1); s = await both(page); assert.deepEqual(s.r02a, s0.r02a); assert.deepEqual(s.r03, s0.r03);
    assert.equal(await page.evaluate(W => RubikCabinetContract.read(project, W).status, WARDROBE), 'ok', 'interior R03 legible');

    // D · Con las cotas VISIBLES (flecha del teclado), exportar: ni la lámina ni el PNG ni el JSON llevan cotas.
    await page.evaluate(W => select({ kind: 'furn', id: W }), WARDROBE); await page.locator('#plan').focus().catch(() => {});
    await page.keyboard.press('ArrowRight'); await page.evaluate(() => { window.__ux08KeyAt = performance.now(); }); await page.waitForTimeout(80);
    assert.ok(await page.locator('#gSel .live-dims').count() > 0, 'cotas visibles antes de exportar');
    const out = await page.evaluate(() => {
      const sheet = window.FloorPlanSheet.preview(), sheetHtml = sheet ? (sheet.outerHTML || String(sheet)) : '';
      let pngSvg = ''; const orig = XMLSerializer.prototype.serializeToString;
      XMLSerializer.prototype.serializeToString = function (n) { const r = orig.call(this, n); if (n?.id === 'plan' || n?.querySelector?.('#gSel')) pngSvg = r; return r; };
      // El PNG se rasteriza después (img.onload → canvas → toBlob) y avisa con «floorplan-export-ready»; sin descarga real.
      const dl = window.download; window.download = () => {};
      window.__ux08PngDone = new Promise(r => addEventListener('floorplan-export-ready', () => { window.download = dl; r(true); }, { once: true }));
      try { exportPNG(); } finally { XMLSerializer.prototype.serializeToString = orig; }
      return { sheetHtml, pngSvg, live: !!document.querySelector('#gSel .live-dims'), json: JSON.stringify(project), stored: Object.keys(localStorage).map(k => localStorage.getItem(k)).join('\n'), history: undoStack.join('\n') };
    });
    assert.ok(out.live, 'las cotas seguían en pantalla al exportar');
    assert.ok(out.sheetHtml.length > 0, 'la lámina se genera'); assert.doesNotMatch(out.sheetHtml, DIMS, 'la lámina no lleva cotas');
    assert.ok(out.pngSvg.length > 0, 'se capturó el SVG del PNG'); assert.doesNotMatch(out.pngSvg, DIMS, 'el PNG no lleva cotas');
    assert.match(out.pngSvg, /gCeiling/, 'el PNG conserva la capa de techo');
    for (const [name, txt] of [['JSON', out.json], ['almacén', out.stored], ['historial', out.history]]) assert.doesNotMatch(txt, DIMS, `${name} sin cotas`);
    assert.equal(await page.evaluate(() => window.__ux08PngDone), true, 'el PNG termina de generarse');
    // Sin tocar nada, las cotas del teclado se ocultan solas (la rasterización del PNG ocupa el hilo de la página y puede
    // retrasar el temporizador de 1,4 s en una máquina lenta; por eso se espera la condición, no un tiempo fijo).
    await page.waitForFunction(() => !document.querySelector('#gSel .live-dims'), null, { timeout: 5000 }).catch(() => {});
    const left = await page.evaluate(() => ({ n: document.querySelectorAll('#gSel .live-dims').length, ms: Math.round(performance.now() - window.__ux08KeyAt) }));
    assert.equal(left.n, 0, `las cotas del teclado se ocultan solas (siguen ${left.ms} ms después de la flecha)`);
    s = await both(page); assert.deepEqual(s.r02a, s0.r02a); assert.deepEqual(s.r03, s0.r03); assert.deepEqual(s.keys, s0.keys);

    // B · Guardar y reabrir: interior R03 y techo R02-A intactos; ni rastro de cotas; se ven en 3D.
    await K.reopen(page); s = await both(page);
    assert.deepEqual(s.r02a, s0.r02a, 'techo intacto al reabrir'); assert.deepEqual(s.r03, s0.r03, 'interior intacto al reabrir'); assert.deepEqual(s.keys, s0.keys);
    assert.equal(await page.evaluate(W => RubikCabinetContract.read(project, W).status, WARDROBE), 'ok');
    assert.equal(await page.locator('#gSel .live-dims').count(), 0);
    await page.locator('#viewSeg .btn[data-view="3d"]').click();
    await page.waitForFunction(() => window.RubikCeilingEditor.meshes.length > 0, null, { timeout: 60000 });
    assert.equal((await page.evaluate(() => window.RubikCeilingEditor.meshes)).filter(m => m.r02aItem).length, 1, 'el plafón en 3D');
    assert.deepEqual(watch.errors, []); assert.deepEqual(watch.external, []);
  } finally { await context.close(); }
});

test('UX-08 + R02-A en móvil 390×844 con táctil real: cotas al arrastrar en la estancia con techo, techo intacto', { timeout: 300000 }, async () => {
  const { context, page, watch } = await K.editor(env, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    const s0 = await prepare(page, true);
    await center(page, WARDROBE, 0.12); await page.evaluate(W => select({ kind: 'furn', id: W }), WARDROBE); await page.waitForTimeout(200);
    const layer0 = await ceilingLayer(page), u0 = await page.evaluate(() => undoStack.length), cdp = await context.newCDPSession(page);
    const at = await screenOf(page, WARDROBE), touch = (type, p) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: p ? [{ x: p.x, y: p.y, id: 1 }] : [] });
    await touch('touchStart', at);
    for (let i = 1; i <= 3; i++) {
      await touch('touchMove', { x: at.x - i * 8, y: at.y - i * 10 }); await page.waitForTimeout(60);
      const got = await shown(page), want = await expected(page, WARDROBE);
      assert.ok(Object.keys(got).length >= 1, `paso ${i}: hay cotas`); for (const [side, mm] of Object.entries(got)) assert.equal(mm, want[side]);
      assert.equal(await ceilingLayer(page), layer0, 'la capa de techo no cambia');
    }
    await touch('touchEnd'); await page.waitForTimeout(200);
    assert.equal(await page.locator('#gSel .live-dims').count(), 0); assert.equal(await page.evaluate(() => undoStack.length), u0 + 1);
    const s = await both(page); assert.deepEqual(s.r02a, s0.r02a); assert.deepEqual(s.r03, s0.r03); assert.deepEqual(s.keys, s0.keys);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'sin desplazamiento horizontal');
    assert.deepEqual(watch.errors, []); assert.deepEqual(watch.external, []);
  } finally { await context.close(); }
});
