'use strict';
/* R02-A · paso libre ORIENTATIVO en la sección de techo del editor REAL (autorizado el 20/11/2026, solo información).
   Activación y desactivación, sin recorrido verificable, cambio de geometría y de proyecto, rendimiento (caché, sin
   recálculo por render) y convivencia con el editor: guardar, deshacer y estados del núcleo intactos; nada bloquea. */
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs/promises'), path = require('node:path');
const K = require('./r02a/editor-kit.cjs');
let env; test.before(async () => { env = await K.start(); }); test.after(async () => { await env?.stop(); });
const shots = process.env.R02A_SHOTS || null;
const sec = page => page.locator('section.r02a-ceiling'), block = page => sec(page).locator('.r02a-passage');
const REF = { scope: 'project', clearHeightMm: 2600, reference: 'finished-floor', source: 'medición sintética de prueba' };
// Escribe por el MISMO camino que «Guardar» del panel (FloorPlanApp.applyCeiling → RubikCeilingBridge), un paso del deshacer.
const setRef = page => page.evaluate(ref => window.FloorPlanApp.applyCeiling(p => window.RubikCeilingBridge.setReference(p, ref)), REF);
const routePoint = (page, room, i) => page.evaluate(([room, i]) => { const a = window.FloorPlanApp, r = window.FloorPlanPresentationRoute.plan(a.project, a.geometry, room);
  return r.kind === 'interior' ? { x: Math.round(r.points[i].x), y: Math.round(r.points[i].y) } : null; }, [room, i]);
const centre = (page, room) => page.evaluate(room => { const r = window.FloorPlanApp.project.rooms.find(x => x.id === room), P = r.polygon;
  return { x: Math.round(P.reduce((a, p) => a + p.x, 0) / P.length), y: Math.round(P.reduce((a, p) => a + p.y, 0) / P.length) }; }, room);
const add = (page, id, type, pos, dropMm = 0) => page.evaluate(([id, type, pos, dropMm]) => { const c = window.RubikCeilingSession.CATALOG[type];
  return window.FloorPlanApp.applyCeiling(p => window.RubikCeilingBridge.confirm(p, { id, type, position: pos, rotationDeg: 0, size: { widthMm: c.widthMm, depthMm: c.depthMm, heightMm: c.heightMm }, dropMm })); }, [id, type, pos, dropMm]);
const coreStates = page => page.evaluate(() => window.RubikCeilingContract.recheck(window.FloorPlanApp.project, {}).items.map(i => [i.id, i.state, i.holds]));
const stats = page => page.evaluate(() => ({ ...window.RubikPassageIndicative.stats }));
const consult = async page => { await block(page).locator('[data-r02a="passage"]').click(); await page.waitForFunction(() => document.querySelector('.r02a-passage')?.dataset.passage === 'done'); };
// Estancia en la que el NÚCLEO coloca el elemento del recorrido (no se supone).
const itemRoom = page => page.evaluate(() => window.FloorPlanApp.project.extensions['x-r02a-ceiling'].items.find(i => i.id === 'cei_hall-1').roomId);
const rows = page => page.evaluate(() => [...document.querySelectorAll('.r02a-passage [data-passage-item]')].map(li => ({ id: li.dataset.passageItem, status: li.dataset.status, text: li.innerText })));

test('activación: posible interferencia sobre el recorrido del pasillo; nada se escribe, ningún estado cambia, nada bloquea', { timeout: 240000 }, async () => {
  const { context, page, watch } = await K.editor(env);
  try {
    assert.equal((await setRef(page)).ok, true);
    const on = await routePoint(page, 'rom_hall', 3);assert.ok(on, 'el pasillo tiene recorrido interior');
    assert.equal((await add(page, 'cei_hall-1', 'pendant', on, 0)).ok, true, 'guardado por el camino normal');
    await K.selectRoom(page, await itemRoom(page));await K.openSection(page);
    assert.equal(await block(page).getAttribute('data-passage'), 'idle', 'no se calcula nada hasta que alguien consulta');
    const text = await block(page).innerText();
    assert.match(text, /Paso libre orientativo · experimental/);assert.match(text, /Criterio inicial de 2100 mm, pendiente de validación profesional\. No es normativo, no bloquea nada/);
    const before = { project: await page.evaluate(() => JSON.stringify(window.FloorPlanApp.project)), states: await coreStates(page), undo: await page.evaluate(() => document.querySelector('#undo')?.disabled) };
    await consult(page);
    const r = await rows(page);
    assert.equal(r.length, 1);assert.equal(r[0].status, 'possible-interference');
    assert.match(r[0].text, /Posible interferencia: el punto más bajo queda a 2000 mm, 100 mm por debajo del criterio inicial\./);
    assert.equal(await page.evaluate(() => JSON.stringify(window.FloorPlanApp.project)), before.project, 'consultar no escribe nada');
    assert.deepEqual(await coreStates(page), before.states, 'los estados del núcleo R02-A no cambian');
    assert.equal(await page.evaluate(() => document.querySelector('#undo')?.disabled), before.undo, 'ningún paso del deshacer');
    assert.doesNotMatch(await sec(page).innerText(), /ruta libre|bloqueado · paso libre/i);
    if (shots) { await fs.mkdir(shots, { recursive: true });await block(page).scrollIntoViewIfNeeded();await page.screenshot({ path: path.join(shots, 'r02a-paso-orientativo-1440x900.png') }); }
    assert.deepEqual(watch.errors, []);assert.deepEqual(watch.external, []);
  } finally { await context.close(); }
});

test('rendimiento y caché: renders sucesivos no recalculan rutas; cambiar la geometría invalida y avisa; consultar de nuevo recalcula una vez', { timeout: 240000 }, async () => {
  const { context, page } = await K.editor(env);
  try {
    await setRef(page);await add(page, 'cei_hall-1', 'pendant', await routePoint(page, 'rom_hall', 3), 0);
    await K.selectRoom(page, await itemRoom(page));await K.openSection(page);
    const s0 = await stats(page), t0 = Date.now();await consult(page);const first = Date.now() - t0, s1 = await stats(page);
    const n = await page.evaluate(() => window.FloorPlanApp.geometry.rooms.filter(r => r.poly.length >= 3).length);
    assert.equal(s1.plans - s0.plans, n, 'primera consulta: una ruta por estancia');
    for (let i = 0; i < 5; i++) await page.evaluate(() => window.renderAll ? window.renderAll() : null);
    await K.selectRoom(page, 'rom_master');await K.selectRoom(page, await itemRoom(page));await K.openSection(page);
    assert.equal((await stats(page)).plans, s1.plans, 'renders y cambios de selección: ningún recálculo');
    assert.equal(await block(page).getAttribute('data-passage'), 'done', 'el resultado sigue vigente mientras la firma no cambie');
    const t1 = Date.now();await consult(page);const cached = Date.now() - t1;
    assert.equal((await stats(page)).plans, s1.plans, 'consultar de nuevo sin cambios: caché');
    // Cambio de geometría (mover un mueble, un paso del deshacer): el resultado caduca y se avisa; nada se recalcula solo.
    await page.evaluate(() => { const o = window.FloorPlanApp.project.objects.find(x => x.type === 'sofa') || window.FloorPlanApp.project.objects[0];
      window.FloorPlanApp.applyCeiling(p => { p.objects.find(x => x.id === o.id).position.x += 300; return { ok: true, project: p }; }); });
    await K.selectRoom(page, await itemRoom(page));await K.openSection(page);
    assert.equal(await block(page).getAttribute('data-passage'), 'stale');assert.match(await block(page).innerText(), /La estancia cambió: vuelve a consultar\./);
    assert.equal((await stats(page)).plans, s1.plans, 'caducar no recalcula');
    await consult(page);assert.equal((await stats(page)).plans - s1.plans, n, 'nueva consulta: recalcula una vez');
    console.log(`# rendimiento · ${n} estancias · primera consulta ${first} ms · consulta en caché ${cached} ms`);
    assert.ok(first < 3000 && cached < 1500, `primera ${first} ms, caché ${cached} ms`);
  } finally { await context.close(); }
});

test('sin recorrido verificable: un elemento en la cocina (recorrido aéreo) → «No evaluado»', { timeout: 240000 }, async () => {
  const { context, page } = await K.editor(env);
  try {
    await setRef(page);
    const kind = await page.evaluate(() => window.FloorPlanPresentationRoute.plan(window.FloorPlanApp.project, window.FloorPlanApp.geometry, 'rom_kitchen').kind);
    assert.notEqual(kind, 'interior', 'banco: la cocina no tiene recorrido interior');
    assert.equal((await add(page, 'cei_kit-1', 'ceilinglight', await centre(page, 'rom_kitchen'), 0)).ok, true);
    await K.selectRoom(page, 'rom_kitchen');await K.openSection(page);await consult(page);
    const r = await rows(page);assert.equal(r[0].status, 'not-evaluated');
    assert.match(r[0].text, /No evaluado: no hay un recorrido orientativo verificable hasta esta estancia\./);
  } finally { await context.close(); }
});

test('cambio de proyecto: el resultado anterior no se muestra para otro proyecto', { timeout: 240000 }, async () => {
  const { context, page } = await K.editor(env);
  try {
    await setRef(page);await add(page, 'cei_hall-1', 'pendant', await routePoint(page, 'rom_hall', 3), 0);
    await K.selectRoom(page, await itemRoom(page));await K.openSection(page);await consult(page);
    // Otro proyecto con la misma geometría y el mismo techo (otro id), abierto por el selector de archivos normal.
    const json = await page.evaluate(() => { const p = structuredClone(window.FloorPlanApp.project);p.id = 'prj_otro-paso-orientativo';p.name = 'Otro proyecto';return JSON.stringify(p); });
    const file = path.join(require('node:os').tmpdir(), 'r02a-otro-proyecto.json');await fs.writeFile(file, json);
    await page.locator('#fileIn').setInputFiles(file);await page.waitForFunction(() => window.FloorPlanApp.project?.id === 'prj_otro-paso-orientativo');
    await K.selectRoom(page, await itemRoom(page));await K.openSection(page);
    assert.notEqual(await block(page).getAttribute('data-passage'), 'done', 'el resultado del proyecto anterior no se reutiliza');
    assert.equal((await rows(page)).length, 0);
  } finally { await context.close(); }
});

test('convivencia con el editor: tras consultar, editar y guardar funcionan igual; el resultado caduca; deshacer intacto', { timeout: 240000 }, async () => {
  const { context, page } = await K.editor(env);
  try {
    await setRef(page);await add(page, 'cei_hall-1', 'pendant', await routePoint(page, 'rom_hall', 3), 0);
    await K.selectRoom(page, await itemRoom(page));await K.openSection(page);await consult(page);
    // Editar el elemento por la interfaz (descuelgue 0 → 0, mover 50 mm) y guardar con la confirmación expresa.
    await sec(page).locator('[data-r02a="edit"]').first().click();
    const x = sec(page).locator('[data-f="x"]');await x.fill(String(Number(await x.inputValue()) + 50));
    await sec(page).locator('[data-r02a="check"]').click();await sec(page).locator('[data-f="confirmed"]').check();
    assert.equal(await sec(page).locator('[data-r02a="save"]').isDisabled(), false, 'el aviso orientativo no bloquea el guardado');
    await sec(page).locator('[data-r02a="save"]').click();
    const ext = await K.ext(page);assert.equal(ext.items.length, 1);assert.equal(ext.items[0].review, 'human-confirmed');
    await K.selectRoom(page, await itemRoom(page));await K.openSection(page);
    assert.equal(await block(page).getAttribute('data-passage'), 'stale', 'cambiar el elemento caduca el resultado');
    await page.keyboard.press('Control+z');assert.equal((await K.ext(page)).items[0].position.x + 50, ext.items[0].position.x, 'deshacer: un paso, como siempre');
  } finally { await context.close(); }
});

test('desactivación: sin el módulo orientativo, la sección de techo funciona igual y no aparece el bloque', { timeout: 240000 }, async () => {
  const env2 = env, context = await env2.browser.newContext({ viewport: { width: 1440, height: 900 } }), page = await context.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));await page.route('https://cdn.jsdelivr.net/**', r => r.abort());
  await page.route(/\/js\/r02a-passage-indicative\.js(\?|$)/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: '/* prueba: módulo orientativo retirado */' }));
  try {
    await page.goto(env2.base);await require('./editor-fixture.cjs')(page);await page.waitForFunction(() => !!window.RubikCeilingEditor && !!window.FloorPlanApp?.applyCeiling);
    assert.equal(await page.evaluate(() => !!window.RubikPassageIndicative), false);
    await setRef(page);assert.equal((await add(page, 'cei_hall-1', 'pendant', await routePoint(page, 'rom_hall', 3), 0)).ok, true, 'guardar funciona');
    await K.selectRoom(page, await itemRoom(page));await K.openSection(page);
    assert.equal(await sec(page).locator('.r02a-items li').count(), 1);assert.equal(await block(page).count(), 0, 'sin bloque');
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});
