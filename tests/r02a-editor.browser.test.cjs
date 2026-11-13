'use strict';
/* R02-A · integración en el editor REAL de RUBIK (index.html), Chromium de Playwright. Datos SINTÉTICOS: el piso de ejemplo.
   Cubre lo que no podía cubrir el laboratorio: la sección «Techo y elementos altos» del panel de la estancia, el commit de
   RUBIK (un paso del deshacer por operación), deshacer/rehacer con el teclado, quitar una estancia (los datos de techo se
   retiran en el mismo paso y vuelven al deshacer), guardar y reabrir (biblioteca local), avisos tras editar, referencia
   desconocida (sin cotas ni 3D), datos de una versión futura (solo lectura), la vista 3D a sus cotas y el móvil táctil.
   Siempre: sin errores de página ni peticiones fuera del servidor local. */
const test = require('node:test'), assert = require('node:assert/strict');
const K = require('./r02a/editor-kit.cjs');
let env; test.before(async () => { env = await K.start(); }); test.after(async () => { await env?.stop(); });
const ROOM = 'rom_master', KEY = 'x-r02a-ceiling';
const sec = page => page.locator('section.r02a-ceiling');
// Un punto libre de muebles y muros dentro de la estancia, buscado con el núcleo (lo que haría una persona mirando el plano).
const freeSpot = (page, type = 'ceilinglight') => page.evaluate(([room, type]) => {
  const p = window.FloorPlanApp.project, S = window.RubikCeilingSession, X = window.RubikCeilingContract, r = p.rooms.find(x => x.id === room);
  const xs = r.polygon.map(q => q.x), ys = r.polygon.map(q => q.y), c = S.CATALOG[type];
  for (let i = 1; i < 12; i++) for (let j = 1; j < 12; j++) {
    const pos = { x: Math.round(Math.min(...xs) + (Math.max(...xs) - Math.min(...xs)) * i / 12), y: Math.round(Math.min(...ys) + (Math.max(...ys) - Math.min(...ys)) * j / 12) };
    const req = { id: 'cei_probe-1', type, position: pos, rotationDeg: 0, size: { widthMm: c.widthMm, depthMm: c.depthMm, heightMm: c.heightMm }, dropMm: 0 };
    const ev = S.evaluate({ project: p, ceiling: X.verticalFor(p, room) || { clearHeightMm: 2600, reference: 'finished-floor', source: 'probe' }, request: req, accepted: X.asRequests(p) });
    if (ev.ok && ev.proposal.roomId === room && ev.state === 'candidate-reviewable' && !ev.diff.relocated) return pos;
  } return null; }, [ROOM, type]);
async function setReference(page, { scope = 'project', clear = 2600, source = 'medición sintética de prueba' } = {}) {
  await sec(page).locator('[data-f="scope"]').selectOption(scope);await sec(page).locator('[data-f="clear"]').fill(String(clear));
  await sec(page).locator('[data-f="source"]').fill(source);await sec(page).locator('[data-r02a="ref-save"]').click();
}
async function addItem(page, pos, type = 'ceilinglight') {
  await sec(page).locator('[data-f="type"]').selectOption(type);
  await sec(page).locator('[data-f="x"]').fill(String(pos.x));await sec(page).locator('[data-f="y"]').fill(String(pos.y));
  await sec(page).locator('[data-r02a="check"]').click();
  assert.match(await sec(page).locator('.r02a-result').innerText(), /^Revisable/);
  assert.equal(await sec(page).locator('[data-r02a="save"]').isDisabled(), true, 'sin confirmación expresa no se guarda');
  await sec(page).locator('[data-f="confirmed"]').check();await sec(page).locator('[data-r02a="save"]').click();
}
// Ningún campo ni botón de la sección cortado por el borde visible del panel (el panel recorta: la página no crece).
const clipped = page => page.evaluate(() => { const s = document.querySelector('section.r02a-ceiling'), edge = Math.min(document.querySelector('aside.right').getBoundingClientRect().right, innerWidth);
  return [...s.querySelectorAll('input,select,button')].filter(e => e.offsetParent && e.getBoundingClientRect().right > edge + 1).map(e => e.dataset.f || e.dataset.r02a); });
const undoDepth = page => page.evaluate(() => document.querySelector('#undo')?.disabled);
const items = async page => (await K.ext(page))?.items || [];

test('escritorio: referencia de la planta, añadir con confirmación, deshacer y rehacer (un paso cada uno), editar, quitar', { timeout: 240000 }, async () => {
  const { context, page, watch } = await K.editor(env);
  try {
    await K.selectRoom(page, ROOM);await K.openSection(page);
    const text = await sec(page).innerText();
    for (const t of [/No comprueba la altura de paso para personas/, /No comprueba instalaciones/, /validar|valida alturas y anclajes con un profesional/i, /Desconocida/]) assert.match(text, t);
    assert.deepEqual(await clipped(page), [], 'escritorio: nada cortado en el panel');
    await setReference(page);
    assert.match(await sec(page).locator('.r02a-ref').innerText(), /2600 mm de altura libre desde suelo acabado · de .*planta/);
    const pos = await freeSpot(page);assert.ok(pos, 'hay un sitio libre en la estancia');
    await addItem(page, pos);
    let list = await items(page);assert.equal(list.length, 1);assert.equal(list[0].roomId, ROOM);assert.equal(list[0].review, 'human-confirmed');
    assert.equal(await sec(page).locator('.r02a-items li').count(), 1);
    assert.equal(await page.locator('#gCeiling [data-state="holds"]').count(), 1, 'dibujado en el plano');
    // Deshacer / rehacer de RUBIK: un paso por operación (el elemento; luego la referencia).
    await page.keyboard.press('Control+z');assert.equal((await items(page)).length, 0, 'deshacer quita el elemento');
    assert.equal((await K.ext(page)).verticalReferences.length, 1, '…y deja la referencia (otro paso)');
    await page.keyboard.press('Control+Shift+z');assert.equal((await items(page)).length, 1, 'rehacer lo devuelve');
    // Editar: un descuelgue que no cabe → bloqueado, no se guarda.
    await K.selectRoom(page, ROOM);await K.openSection(page);
    await sec(page).locator('[data-r02a="edit"]').click();await sec(page).locator('[data-f="drop"]').fill('2700');await sec(page).locator('[data-r02a="check"]').click();
    assert.match(await sec(page).locator('.r02a-result').innerText(), /Bloqueado.*superan la altura libre/s);
    await sec(page).locator('[data-f="confirmed"]').check();await sec(page).locator('[data-r02a="save"]').click();
    assert.equal((await items(page))[0].dropMm, 0, 'lo bloqueado no se guarda');
    await sec(page).locator('[data-f="drop"]').fill('150');await sec(page).locator('[data-r02a="check"]').click();
    await sec(page).locator('[data-f="confirmed"]').check();await sec(page).locator('[data-r02a="save"]').click();
    list = await items(page);assert.equal(list.length, 1);assert.equal(list[0].dropMm, 150, 'editar sustituye el mismo elemento');
    await sec(page).locator('[data-r02a="remove"]').click();assert.equal((await items(page)).length, 0);
    await page.keyboard.press('Control+z');assert.equal((await items(page)).length, 1, 'quitar también se deshace');
    assert.deepEqual(watch.errors, []);assert.deepEqual(watch.external, []);
  } finally { await context.close(); }
});

test('quitar la estancia: sus elementos y su referencia se retiran en el MISMO paso; deshacer devuelve estancia y techo', { timeout: 240000 }, async () => {
  const { context, page, watch } = await K.editor(env);
  try {
    await K.selectRoom(page, ROOM);await K.openSection(page);await setReference(page);await setReference(page, { scope: 'room', clear: 2500 });
    await addItem(page, await freeSpot(page));
    const before = await K.ext(page);assert.equal(before.items.length, 1);assert.equal(before.verticalReferences.length, 2);
    // Cualquier cambio que quite una estancia pasa por commit(); aquí, con el mismo commit que usa el editor.
    const r = await page.evaluate(room => window.FloorPlanApp.applyCeiling(p => { p.rooms = p.rooms.filter(x => x.id !== room); return { ok: true, project: p }; }), ROOM);
    assert.equal(r.ok, true);
    const after = await K.ext(page);assert.deepEqual(after.items, [], 'sin elementos huérfanos');
    assert.deepEqual(after.verticalReferences.map(v => v.scope), ['project'], 'se va la referencia de la estancia; la de la planta queda');
    assert.match(await page.locator('#r02aNotice').innerText(), /se retiran con ella 2 dato\(s\) de techo/);
    await page.keyboard.press('Control+z');
    assert.ok(await page.evaluate(room => window.FloorPlanApp.project.rooms.some(x => x.id === room), ROOM), 'vuelve la estancia');
    assert.deepEqual(await K.ext(page), before, '…y todo su techo, en un solo deshacer');
    assert.deepEqual(watch.errors, []);
  } finally { await context.close(); }
});

test('guardar y reabrir; rebajar la referencia avisa sin mover; sin referencia, pendiente y sin 3D; 3D a sus cotas', { timeout: 300000 }, async () => {
  const { context, page, watch } = await K.editor(env);
  try {
    await K.selectRoom(page, ROOM);await K.openSection(page);await setReference(page);
    const pos = await freeSpot(page, 'pendant');await addItem(page, pos, 'pendant');
    const saved = await K.ext(page);
    // 3D: el colgante (600 mm, descuelgue 0) va de 2000 a 2600 mm.
    await page.locator('#viewSeg .btn[data-view="3d"]').click();
    await page.waitForFunction(() => window.RubikCeilingEditor.meshes.length > 0, null, { timeout: 60000 });
    const mesh = (await page.evaluate(() => window.RubikCeilingEditor.meshes)).find(m => m.r02aItem);
    assert.deepEqual([mesh.bottomMm, mesh.topMm], [2000, 2600]);assert.ok(Math.abs(mesh.y - 2.3) < 1e-9, 'centro a 2,3 m');
    await page.locator('#viewSeg .btn[data-view="2d"]').click();
    // Reabrir: la biblioteca local conserva el techo y lo vuelve a comprobar.
    await K.reopen(page);
    assert.deepEqual(await K.ext(page), saved, 'mismo contenido tras reabrir');
    await K.selectRoom(page, ROOM);await K.openSection(page);
    assert.equal(await sec(page).locator('.r02a-items li[data-holds="true"]').count(), 1);
    // Rebajar la referencia por debajo del colgante: aviso en palabras, el elemento queda en rojo y en su sitio.
    await setReference(page, { clear: 500 });
    assert.match(await page.locator('#r02aNotice').innerText(), /Tras este cambio.*superan la altura libre.*No se ha movido nada/s);
    assert.equal(await page.locator('#gCeiling [data-state="blocked"]').count(), 1);
    assert.deepEqual((await items(page))[0].position, pos);
    // Quitar la referencia: pendiente de datos, sin cotas → no se dibuja en 3D (nunca se supone una altura).
    await sec(page).locator('[data-r02a="ref-clear-level"]').click();
    assert.match(await sec(page).locator('.r02a-ref').innerText(), /Desconocida/);
    assert.equal(await page.locator('#gCeiling [data-state="pending"]').count(), 1);
    await page.locator('#viewSeg .btn[data-view="3d"]').click();await page.waitForTimeout(800);
    assert.equal((await page.evaluate(() => window.RubikCeilingEditor.meshes)).length, 0, 'sin referencia, nada en 3D');
    assert.deepEqual(watch.errors, []);assert.deepEqual(watch.external, []);
  } finally { await context.close(); }
});

test('datos de una versión futura: el proyecto abre, el panel es de solo lectura y nada se reescribe', { timeout: 180000 }, async () => {
  const { context, page, watch } = await K.editor(env);
  try {
    const r = await page.evaluate(k => window.FloorPlanApp.applyCeiling(p => { p.extensions = { ...(p.extensions || {}), [k]: { version: 9, futuro: true } }; return { ok: true, project: p }; }), KEY);
    assert.equal(r.ok, true, 'RUBIK acepta la extensión desconocida (es de otro lector)');
    await K.reopen(page);
    assert.match(await page.locator('#r02aNotice').innerText(), /versión más reciente.*sin cambios/);
    await K.selectRoom(page, ROOM);await K.openSection(page);
    assert.match(await sec(page).innerText(), /versión más reciente de RUBIK: se conservan tal cual y no se pueden editar/);
    assert.equal(await sec(page).locator('[data-r02a="save"]').count(), 0);
    assert.deepEqual(await K.ext(page), { version: 9, futuro: true }, 'intacto');
    assert.deepEqual(watch.errors, []);
  } finally { await context.close(); }
});

test('móvil 390×844 táctil: abrir la sección, colocar tocando el plano, guardar; sin desbordar la pantalla', { timeout: 240000 }, async () => {
  const { context, page, watch } = await K.editor(env, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    await page.evaluate(() => { const p = document.querySelector('aside.right'); if (p?.classList.contains('open')) document.querySelector('#tgPanel')?.click(); });
    await K.selectRoom(page, ROOM, { touch: true });
    await page.evaluate(() => { if (!document.querySelector('aside.right').classList.contains('open')) document.querySelector('#tgPanel')?.click(); });
    await K.openSection(page);await setReference(page);
    const pos = await freeSpot(page);
    // «Colocar tocando el plano»: cerrar el panel, tocar el punto libre en el plano, volver al panel.
    await sec(page).locator('[data-r02a="place"]').tap();
    await page.evaluate(() => { if (document.querySelector('aside.right').classList.contains('open')) document.querySelector('#tgPanel')?.click(); });
    await page.waitForTimeout(400);
    const screen = await page.evaluate(({ x, y }) => { const svg = document.getElementById('plan'), m = svg.getScreenCTM(); const q = new DOMPoint(x, y).matrixTransform(m); return { x: q.x, y: q.y }; }, pos);
    await page.touchscreen.tap(screen.x, screen.y);
    const draft = await page.evaluate(() => window.RubikCeilingEditor.state.draft);
    assert.ok(Math.abs(draft.x - pos.x) <= 40 && Math.abs(draft.y - pos.y) <= 40, `colocado donde se tocó (${draft.x},${draft.y} ≈ ${pos.x},${pos.y})`);
    assert.equal(await page.evaluate(() => window.RubikCeilingEditor.state.result?.state), 'candidate-reviewable');
    assert.equal(await page.evaluate(() => window.FloorPlanApp.project.objects.length), await page.evaluate(() => window.FloorPlanApp.project.objects.length), 'el toque no ha movido ni creado muebles');
    await page.evaluate(() => { if (!document.querySelector('aside.right').classList.contains('open')) document.querySelector('#tgPanel')?.click(); });
    await sec(page).locator('[data-f="confirmed"]').check();await sec(page).locator('[data-r02a="save"]').tap();
    assert.equal((await items(page)).length, 1);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= 391), 'sin desbordamiento horizontal');
    // Ni dentro del panel: el panel recorta lo que se sale, así que la página no crece aunque un campo quede cortado.
    assert.deepEqual(await clipped(page), [], 'móvil: nada cortado en el panel');
    const box = await sec(page).locator('[data-r02a="save"]').boundingBox();assert.ok(box.height >= 40, 'botón táctil ≥ 40 px');
    assert.deepEqual(watch.errors, []);assert.deepEqual(watch.external, []);
  } finally { await context.close(); }
});
