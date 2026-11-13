'use strict';
/* Convivencia R03 (armarios, x-r03-cabinet, activado en master por #222) y R02-A (techos, x-r02a-ceiling, #223) en el MISMO
   editor real de RUBIK. Datos SINTÉTICOS: piso de ejemplo; el armario de referencia está en el dormitorio principal.
   Cada línea escribe solo su extensión, cada operación es un paso del deshacer de RUBIK y nada de una toca la otra:
   guardar un interior y un elemento de techo en la misma estancia, deshacer/rehacer, duplicar y borrar el armario,
   quitar la estancia, reabrir y ver los dos en 3D. Sin errores ni peticiones fuera del servidor local. */
const test = require('node:test'), assert = require('node:assert/strict');
const K = require('./r02a/editor-kit.cjs');
let env; test.before(async () => { env = await K.start(); }); test.after(async () => { await env?.stop(); });
const ROOM = 'rom_master', WARDROBE = 'obj_template-004';
const sec = page => page.locator('section.r02a-ceiling');
const both = page => page.evaluate(() => ({ r03: structuredClone(window.FloorPlanApp.project.extensions?.['x-r03-cabinet'] ?? null), r02a: structuredClone(window.FloorPlanApp.project.extensions?.['x-r02a-ceiling'] ?? null),
  objects: window.FloorPlanApp.project.objects.map(o => o.id), rooms: window.FloorPlanApp.project.rooms.map(r => r.id) }));
const freeSpot = page => page.evaluate(room => {
  const p = window.FloorPlanApp.project, S = window.RubikCeilingSession, X = window.RubikCeilingContract, r = p.rooms.find(x => x.id === room), c = S.CATALOG.ceilinglight;
  const xs = r.polygon.map(q => q.x), ys = r.polygon.map(q => q.y);
  for (let i = 1; i < 12; i++) for (let j = 1; j < 12; j++) {
    const pos = { x: Math.round(Math.min(...xs) + (Math.max(...xs) - Math.min(...xs)) * i / 12), y: Math.round(Math.min(...ys) + (Math.max(...ys) - Math.min(...ys)) * j / 12) };
    const ev = S.evaluate({ project: p, ceiling: X.verticalFor(p, room), request: { id: 'cei_probe-1', type: 'ceilinglight', position: pos, size: { widthMm: c.widthMm, depthMm: c.depthMm, heightMm: c.heightMm }, dropMm: 0 }, accepted: X.asRequests(p) });
    if (ev.ok && ev.proposal.roomId === room && ev.state === 'candidate-reviewable' && !ev.diff.relocated) return pos;
  } return null; }, ROOM);

test('R03 y R02-A a la vez en el editor: cada una solo su extensión, un paso de deshacer cada operación, sin interferencias', { timeout: 300000 }, async () => {
  const { context, page, watch } = await K.editor(env);
  try {
    assert.ok(await page.evaluate(() => !!window.RubikCabinetBridge && !!window.RubikCabinetRubikUI && !!window.RubikCeilingEditor), 'las dos activaciones cargadas');
    assert.ok(await page.evaluate(([w, r]) => { const o = FloorPlanApp.project.objects.find(x => x.id === w), room = FloorPlanApp.project.rooms.find(x => x.id === r);
      let c = false; for (let i = 0, j = room.polygon.length - 1; i < room.polygon.length; j = i++) { const a = room.polygon[i], b = room.polygon[j]; if ((a.y > o.position.y) !== (b.y > o.position.y) && o.position.x < (b.x - a.x) * (o.position.y - a.y) / (b.y - a.y) + a.x) c = !c; } return c; }, [WARDROBE, ROOM]), 'el armario está en la estancia del techo');
    // R02-A: referencia de la planta y un plafón en la misma estancia que el armario.
    await K.selectRoom(page, ROOM);await K.openSection(page);
    await sec(page).locator('[data-f="clear"]').fill('2600');await sec(page).locator('[data-f="source"]').fill('medición sintética de prueba');await sec(page).locator('[data-r02a="ref-save"]').click();
    const pos = await freeSpot(page);assert.ok(pos);
    await sec(page).locator('[data-f="type"]').selectOption('ceilinglight');await sec(page).locator('[data-f="x"]').fill(String(pos.x));await sec(page).locator('[data-f="y"]').fill(String(pos.y));
    await sec(page).locator('[data-r02a="check"]').click();await sec(page).locator('[data-f="confirmed"]').check();await sec(page).locator('[data-r02a="save"]').click();
    const s1 = await both(page);assert.equal(s1.r02a.items.length, 1);assert.equal(s1.r03, null, 'R02-A no escribe nada de R03');
    // R03: interior del armario por su diálogo, dentro de mutate().
    const undo0 = await page.evaluate(() => undoStack.length);
    await page.evaluate(id => { select({ kind: 'furn', id }); drawer('panel', true); }, WARDROBE);await page.waitForTimeout(300);
    assert.equal(await sec(page).count(), 0, 'el panel de un mueble no muestra la sección de techo');
    await page.locator('#aInterior').click();await page.locator('.r03-rubik-dialog').waitFor();
    await page.locator('.r03-rubik-dialog button', { hasText: 'Dividir módulo' }).first().click();
    await page.locator('.r03-rubik-dialog button', { hasText: 'Guardar interior' }).first().click();await page.waitForTimeout(200);
    await page.keyboard.press('Escape');await page.waitForTimeout(200);
    const s2 = await both(page);
    assert.equal(s2.r03.entries.length, 1);assert.deepEqual(s2.r02a, s1.r02a, 'R03 no toca el techo');
    assert.equal(await page.evaluate(() => undoStack.length), undo0 + 1, 'guardar el interior: un paso');
    // Deshacer / rehacer de RUBIK: el interior sale y vuelve; el techo no se mueve.
    await page.keyboard.press('Control+z');let s = await both(page);assert.equal(s.r03, null);assert.deepEqual(s.r02a, s1.r02a);
    await page.keyboard.press('Control+Shift+z');s = await both(page);assert.deepEqual(s.r03, s2.r03);assert.deepEqual(s.r02a, s1.r02a);
    // Duplicar y borrar el armario (puente R03): el techo sigue igual y se vuelve a comprobar sin avisos nuevos.
    await page.evaluate(id => { select({ kind: 'furn', id }); }, WARDROBE);await page.evaluate(() => duplicateSel());
    s = await both(page);assert.equal(s.r03.entries.length, 2, 'el duplicado lleva su interior');assert.deepEqual(s.r02a, s1.r02a);
    await page.evaluate(() => deleteSel());s = await both(page);assert.equal(s.r03.entries.length, 1, 'borrar el duplicado retira solo su interior');assert.deepEqual(s.r02a, s1.r02a);
    // Quitar la estancia: se retira SOLO el techo de esa estancia; el interior del armario (objeto que sigue existiendo) queda.
    await page.evaluate(room => window.FloorPlanApp.applyCeiling(p => { p.rooms = p.rooms.filter(x => x.id !== room); return { ok: true, project: p }; }), ROOM);
    s = await both(page);assert.deepEqual(s.r02a.items, [], 'sin elementos de techo huérfanos');assert.deepEqual(s.r03, s2.r03, 'R03 intacto');
    await page.keyboard.press('Control+z');s = await both(page);assert.deepEqual(s.r02a, s1.r02a);assert.deepEqual(s.r03, s2.r03);
    // Reabrir: las dos extensiones vuelven intactas; los dos se ven en 3D.
    await K.reopen(page);s = await both(page);assert.deepEqual(s.r02a, s1.r02a);assert.deepEqual(s.r03, s2.r03);
    await page.locator('#viewSeg .btn[data-view="3d"]').click();
    await page.waitForFunction(() => window.RubikCeilingEditor.meshes.length > 0, null, { timeout: 60000 });
    assert.equal((await page.evaluate(() => window.RubikCeilingEditor.meshes)).filter(m => m.r02aItem).length, 1, 'el plafón en 3D');
    assert.deepEqual(watch.errors, []);assert.deepEqual(watch.external, []);
  } finally { await context.close(); }
});
