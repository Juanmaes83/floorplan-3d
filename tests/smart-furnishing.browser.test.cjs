'use strict';
/* UX-12 + UX-13 en el editor REAL (Playwright + Chromium): abrir un proyecto sintético por «Archivo», seleccionar el
   salón, «Amueblar esta estancia», generar (sin tocar el proyecto), cambiar de receta (diferencias reales en datos, 2D
   y 3D), descartar (idéntico), aplicar (un paso de deshacer), editar una pieza suelta, deshacer/rehacer el conjunto,
   reabrir, exportaciones sin la vista previa, rechazo legítimo por falta de sitio, convivencia con R03 + R02-A + UX-08
   y móvil 390×844 con toques reales. Las posiciones finales se comprueban con el verificador independiente. */
const test = require('node:test'), assert = require('node:assert/strict');
const K = require('./r02a/editor-kit.cjs'), Q = require('./smart-furnishing/kit.cjs'), { verify } = require('./smart-furnishing/verify.cjs');
const Core = require('../js/project-core.js');
let env; test.before(async () => { env = await K.start(); }); test.after(async () => { await env?.stop(); });
const doors = json => Core.geometry(JSON.parse(json)).doors.map(d => ({ h: d.h, c: d.c, o: d.o, len: d.len }));

test('escritorio 1440×900: flujo completo sobre el proyecto abierto', { timeout: 300000 }, async () => {
  const { context, page, watch } = await K.editor(env);
  try {
    await Q.importFixture(page);
    await K.selectRoom(page, 'rom_living');
    await page.locator('#sfSummary').click();
    assert.equal(await page.locator('#sfUse').inputValue(), '', 'sin tipo declarado: hay que elegir el uso');
    await page.locator('#sfGenerate').click();
    assert.equal(await page.locator('#sfError').getAttribute('data-sf-status'), 'use-required');
    await page.locator('#sfUse').selectOption('living');
    await page.locator('#sfDensity label', { hasText: 'Alta' }).click();
    const s0 = await Q.state(page);
    await page.locator('#sfGenerate').click();
    const n = Number(await page.locator('#sfProposal').getAttribute('data-sf-count'));
    assert.ok(n >= 6, `propuesta con varias piezas (${n})`);
    // Generar NO cambia nada: ni el proyecto, ni lo guardado, ni el historial.
    const s1 = await Q.state(page); assert.equal(s1.json, s0.json); assert.equal(s1.stored, s0.stored); assert.equal(s1.undo, s0.undo);
    assert.equal(await page.locator('#gSel .sf-preview [data-sf-item]').count(), n, 'vista previa 2D de todas las piezas');
    const colours = () => page.$$eval('#gSel .sf-preview [data-sf-item]', gs => gs.map(g => g.dataset.sfType + ':' + g.dataset.sfColor).sort().join());
    const c1 = await colours(), items1 = await page.locator('#sfItems li').allInnerTexts();
    // UX-13: otra receta → piezas, medidas y colores distintos, en datos y en el dibujo.
    await page.locator('#sfRecipe').selectOption('urbano');
    assert.ok((await page.locator('#sfDiff li').count()) >= 2, 'el panel enumera las diferencias');
    assert.notEqual(await colours(), c1); assert.notDeepEqual(await page.locator('#sfItems li').allInnerTexts(), items1);
    assert.equal((await Q.state(page)).json, s0.json, 'cambiar de receta tampoco toca el proyecto');
    // 3D: cajas translúcidas de la propuesta, con sus colores.
    await page.locator('#sfView3D').click();
    await page.waitForFunction(n => window.FloorPlanSmartFurnishingUI.meshes.length === n, n, { timeout: 60000 });
    const m3d = await page.evaluate(() => FloorPlanSmartFurnishingUI.meshes.map(m => m.userData.color).sort().join());
    const want = await page.evaluate(() => FloorPlanSmartFurnishingUI.state.proposal.items.map(i => i.color).sort().join()); assert.equal(m3d, want);
    await page.locator('#viewSeg .btn[data-view="2d"]').click(); await page.waitForFunction(() => !is3D(), null, { timeout: 30000 });
    // Exportaciones con la propuesta visible: ni la lámina ni el PNG la llevan.
    const out = await page.evaluate(() => { const sheet = window.FloorPlanSheet.preview(); let png = ''; const orig = XMLSerializer.prototype.serializeToString;
      XMLSerializer.prototype.serializeToString = function (x) { const r = orig.call(this, x); if (x?.querySelector?.('#gSel')) png = r; return r; }; const dl = window.download; window.download = () => {};
      try { exportPNG(); } finally { XMLSerializer.prototype.serializeToString = orig; } setTimeout(() => { window.download = dl; }, 3000);
      return { sheet: sheet.outerHTML, png, live: !!document.querySelector('#gSel .sf-preview') }; });
    assert.ok(out.live); assert.ok(out.png.length > 0); assert.doesNotMatch(out.sheet, /sf-preview|data-sf-item/); assert.doesNotMatch(out.png, /sf-preview|data-sf-item/);
    // Descartar: idéntico y sin vista previa.
    await page.locator('#sfDiscard').click();
    assert.equal((await Q.state(page)).json, s0.json); assert.equal(await page.locator('#gSel .sf-preview').count(), 0); assert.equal(await page.evaluate(() => FloorPlanSmartFurnishingUI.meshes.length), 0);
    // Generar de nuevo y aplicar (escala estimada: hay que confirmarlo; sin confirmar, el botón no actúa).
    await page.locator('#sfGenerate').click();
    assert.equal(await page.locator('#sfApply').isDisabled(), true, 'escala estimada: Aplicar exige confirmación');
    await page.locator('#sfAck').check(); await page.locator('#sfApply').click();
    await page.locator('#sfApplied').waitFor();
    const s2 = await Q.state(page);
    assert.equal(s2.undo, s0.undo + 1, 'un solo paso de deshacer'); assert.equal(s2.objects, s0.objects + n); assert.equal(s2.sf.length, n);
    assert.notEqual(s2.stored, s0.stored, 'guardado');
    assert.deepEqual(verify(JSON.parse(s2.json), s2.sf, doors(s2.json)), [], 'posiciones finales válidas (verificador independiente)');
    assert.equal(await page.locator('#gSel .sf-preview').count(), 0, 'ya no es una propuesta');
    // Edición individual: una pieza aplicada es un mueble normal.
    const id = s2.sf.find(x => x.endsWith('-2')) || s2.sf[1];
    await page.evaluate(id => select({ kind: 'furn', id }), id); await page.locator('#fW').fill('1200'); await page.locator('#fW').press('Enter'); await page.waitForTimeout(200);
    const edited = await Q.state(page); assert.equal(JSON.parse(edited.json).objects.find(o => o.id === id).size.widthMm, 1200); assert.equal(edited.undo, s2.undo + 1);
    // UX-08: arrastrar una pieza nueva muestra cotas.
    await page.evaluate(id => { const f = getF(id), r = document.querySelector('#plan').getBoundingClientRect(); view.s = .12; view.x0 = f.cx - r.width / 2 / .12; view.y0 = f.cy - r.height / 2 / .12; applyView(); }, s2.sf[0]);
    await page.evaluate(id => select({ kind: 'furn', id }), s2.sf[0]);
    const at = await page.evaluate(id => { const f = getF(id), m = new DOMPoint(f.cx, f.cy).matrixTransform(document.querySelector('#plan').getScreenCTM()); return { x: m.x, y: m.y }; }, s2.sf[0]);
    await page.mouse.move(at.x, at.y); await page.mouse.down(); await page.mouse.move(at.x + 12, at.y - 10, { steps: 3 }); await page.waitForTimeout(80);
    assert.ok(await page.locator('#gSel .live-dims').count() > 0, 'cotas UX-08 sobre un mueble propuesto');
    await page.mouse.move(at.x, at.y, { steps: 3 }); await page.mouse.up(); await page.waitForTimeout(200);
    // Deshacer revierte el conjunto entero (tras deshacer el arrastre y la edición); rehacer lo devuelve.
    const before = await Q.state(page);
    for (let i = before.undo; i > s0.undo; i--) await page.keyboard.press('Control+z');
    const back = await Q.state(page); assert.equal(back.json, s0.json, 'deshacer deja el proyecto como antes de aplicar'); assert.equal(back.sf.length, 0);
    await page.keyboard.press('Control+Shift+z'); const again = await Q.state(page); assert.equal(again.sf.length, n, 'rehacer devuelve todas las piezas');
    // Reabrir: siguen todas, con sus datos.
    await K.reopen(page); const re = await Q.state(page); assert.equal(re.sf.length, n);
    assert.deepEqual(JSON.parse(re.json).objects.filter(o => o.id.startsWith('obj_sf')), JSON.parse(again.json).objects.filter(o => o.id.startsWith('obj_sf')));
    assert.deepEqual(watch.errors, []); assert.deepEqual(watch.external, []);
  } finally { await context.close(); }
});

test('rechazo legítimo por falta de sitio: mensaje claro y el proyecto no cambia', { timeout: 180000 }, async () => {
  const { context, page, watch } = await K.editor(env);
  try {
    await K.selectRoom(page, 'rom_gbath'); await page.locator('#sfSummary').click();
    await page.locator('#sfUse').selectOption('bedroom'); const s0 = await Q.state(page);
    await page.locator('#sfGenerate').click();
    assert.equal(await page.locator('#sfError').getAttribute('data-sf-status'), 'no-space');
    const msg = await page.locator('#sfError').innerText();
    assert.match(msg, /No hay sitio[\s\S]*no cambia/); assert.match(msg, /«Baño de invitados»/, 'el nombre que ve la persona, no el interno');
    assert.equal(await page.locator('#sfApply').count(), 0); assert.equal((await Q.state(page)).json, s0.json);
    assert.deepEqual(watch.errors, []);
  } finally { await context.close(); }
});

test('convivencia: armario R03 con interior y elemento de techo R02-A en el dormitorio; ninguna extensión cambia', { timeout: 300000 }, async () => {
  const { context, page, watch } = await K.editor(env);
  try {
    // Preparación de la prueba (no es el flujo filmado): interior R03, referencia + plafón R02-A y dormitorio vacío salvo el armario.
    await page.evaluate(() => { const W = 'obj_template-004'; const o = RubikCabinetBridge.open(project, W); mutate(() => { const r = RubikCabinetBridge.save(project, o.session); if (!r.ok) throw Error('R03'); project = r.project; }); });
    await page.evaluate(() => FloorPlanApp.applyCeiling(p => { const a = RubikCeilingBridge.setReference(p, { scope: 'project', clearHeightMm: 2600, reference: 'finished-floor', source: 'medición sintética de prueba' }); return RubikCeilingBridge.confirm(a.project, { id: 'cei_test-1', type: 'pendant', position: { x: 8300, y: 2300 }, size: { widthMm: 400, depthMm: 400, heightMm: 600 }, dropMm: 0 }, { confirmedAt: '2026-11-13T09:00:00.000Z' }); }));
    await page.evaluate(() => mutate(() => { const sc = FloorPlanPlacement.scene(project); project.objects = project.objects.filter(o => o.id === 'obj_template-004' || !FloorPlanPlacement.roomsAt(sc, o.position).some(r => r.id === 'rom_master')); }));
    const ext = () => page.evaluate(() => JSON.stringify([project.extensions['x-r03-cabinet'], project.extensions['x-r02a-ceiling']]));
    const e0 = await ext(); assert.ok(e0.includes('cei_test-1'));
    await K.selectRoom(page, 'rom_master'); await page.locator('#sfSummary').click();
    await page.locator('#sfUse').selectOption('bedroom'); await page.locator('#sfDensity label', { hasText: 'Alta' }).click();
    await page.locator('#sfGenerate').click();
    const items = await page.evaluate(() => FloorPlanSmartFurnishingUI.state.proposal.items.map(i => i.type));
    assert.ok(items.includes('bed') && !items.includes('wardrobe'), `cama sí, armario no (ya hay uno R03): ${items}`);
    await page.locator('#sfAck').check(); await page.locator('#sfApply').click(); await page.locator('#sfApplied').waitFor();
    assert.equal(await ext(), e0, 'R03 y R02-A intactos tras aplicar');
    const s = await Q.state(page); assert.deepEqual(verify(JSON.parse(s.json), s.sf, doors(s.json)), []);
    await page.keyboard.press('Control+z'); assert.equal(await ext(), e0); await page.keyboard.press('Control+Shift+z'); assert.equal(await ext(), e0);
    await K.reopen(page); assert.equal(await ext(), e0); assert.equal((await Q.state(page)).sf.length, s.sf.length);
    assert.equal(await page.evaluate(() => RubikCabinetContract.read(project, 'obj_template-004').status), 'ok');
    assert.deepEqual(watch.errors, []); assert.deepEqual(watch.external, []);
  } finally { await context.close(); }
});

test('móvil 390×844 con toques reales: configurar, generar, ver el plano sin el panel encima, aplicar y ver 3D', { timeout: 300000 }, async () => {
  const { context, page, watch } = await K.editor(env, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    await Q.panel(page, false); await Q.importFixture(page); await Q.panel(page, false);
    await K.selectRoom(page, 'rom_living', { touch: true }); await Q.panel(page, true);
    await Q.tap(page, page.locator('#sfSummary'), true);
    await page.locator('#sfUse').selectOption('living');
    await Q.tap(page, page.locator('#sfDensity label', { hasText: 'Media' }), true);
    await page.locator('#sfRecipe').selectOption('calido');
    const s0 = await Q.state(page);
    await Q.tap(page, page.locator('#sfGenerate'), true);
    const n = Number(await page.locator('#sfProposal').getAttribute('data-sf-count')); assert.ok(n >= 4);
    for (const id of ['#sfView2D', '#sfView3D', '#sfAnother', '#sfApply', '#sfDiscard']) { const b = await page.locator(id).boundingBox(); assert.ok(b && b.width >= 40 && b.height >= 36, `${id} visible y tocable`); }
    await Q.tap(page, page.locator('#sfView2D'), true);
    await page.waitForFunction(() => !document.querySelector('aside.right').classList.contains('open')); await page.waitForTimeout(500);
    // El panel se retira: la propuesta se ve en el plano y no la tapa ningún control.
    assert.equal(await page.evaluate(() => document.querySelector('aside.right').classList.contains('open')), false);
    const free = await page.$$eval('#gSel .sf-preview [data-sf-item] rect', rs => rs.map(r => { const b = r.getBoundingClientRect(), x = b.x + b.width / 2, y = b.y + b.height / 2, e = document.elementFromPoint(x, y); return x > 0 && x < innerWidth && y > 0 && y < innerHeight && !!e?.closest('#plan'); }));
    assert.ok(free.filter(Boolean).length >= Math.min(3, n), `piezas visibles sobre el plano: ${free}`);
    assert.equal((await Q.state(page)).json, s0.json);
    await Q.panel(page, true); await page.locator('#sfAck').check(); await Q.tap(page, page.locator('#sfApply'), true); await page.locator('#sfApplied').waitFor();
    const s1 = await Q.state(page); assert.equal(s1.undo, s0.undo + 1); assert.equal(s1.sf.length, n);
    assert.deepEqual(verify(JSON.parse(s1.json), s1.sf, doors(s1.json)), []);
    await Q.tap(page, page.locator('#sfView3DApplied'), true);
    await page.waitForFunction(() => document.body.classList.contains('m3d'), null, { timeout: 60000 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'sin desplazamiento horizontal');
    assert.deepEqual(watch.errors, []); assert.deepEqual(watch.external, []);
  } finally { await context.close(); }
});
