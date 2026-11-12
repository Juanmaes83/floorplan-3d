// SCULPT-R02-A normalized · B2/B3 in a real browser (labs/sculpt/r02a-normalized), desktop and phone. Observable
// results: the 3D ceiling plane and item heights in world coordinates, the plan markers, the section, and the synthetic
// project proven unchanged until a human confirms. Synthetic data only. Screenshots: R02A_ARTIFACTS=<dir>.
'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { createServer } = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
let server, base;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
before(async () => {
  const root = path.resolve(__dirname, '..');
  server = createServer(async (req, res) => { try { const f = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://l').pathname)); if (!f.startsWith(root)) throw 0; const b = await fs.readFile(f); res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); res.end(b); } catch { res.writeHead(404); res.end(); } });
  await new Promise(r => server.listen(0, '127.0.0.1', r)); base = `http://127.0.0.1:${server.address().port}/labs/sculpt/r02a-normalized/index.html`;
});
after(() => new Promise(r => server.close(r)));
async function setup(t, viewport = { width: 1440, height: 900 }, touch = false) {
  const browser = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/chromium', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  t.after(() => browser.close());
  const page = await (await browser.newContext({ viewport, hasTouch: touch, isMobile: touch })).newPage(); page.setDefaultTimeout(30000);
  const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const external = []; page.on('request', r => { if (!r.url().startsWith('http://127.0.0.1')) external.push(r.url()); });
  await page.goto(base); await page.waitForFunction(() => window.R02Lab?.ready);
  return { page, errors, external };
}
async function shot(page, name) { if (!process.env.R02A_ARTIFACTS) return; await fs.mkdir(process.env.R02A_ARTIFACTS, { recursive: true }); await page.waitForTimeout(250); await page.screenshot({ path: path.join(process.env.R02A_ARTIFACTS, name + '.png') }); }
const btn = (page, name) => page.getByRole('button', { name, exact: true });
async function confirmReference(page, clear = 2600) { await btn(page, 'Confirmada').click(); await page.fill('#clear', String(clear)); await page.fill('#source', 'medición sintética de prueba'); await btn(page, 'Usar en esta estancia').click(); }
async function item(page, type, { h, drop } = {}) { await page.selectOption('#type', type); if (h !== undefined) { await page.fill('#h', String(h)); await page.locator('#h').dispatchEvent('change'); } if (drop !== undefined) { await page.fill('#drop', String(drop)); await page.locator('#drop').dispatchEvent('change'); } }
const chip = page => page.locator('#stateChip').innerText();
const unchanged = page => page.evaluate(() => { const p = R02Lab.project, o = R02Lab.original; return JSON.stringify(p.objects) === JSON.stringify(o.objects) && JSON.stringify(p.walls) === JSON.stringify(o.walls) && JSON.stringify(p.rooms) === JSON.stringify(o.rooms); });

for (const [name, vp, touch] of [['1440x900', { width: 1440, height: 900 }, false], ['1280x800', { width: 1280, height: 800 }, false], ['390x844', { width: 390, height: 844 }, true], ['844x390', { width: 844, height: 390 }, true]])
  test(`B lab opens clean ${name}: no horizontal scroll, ≥ 44 px targets, no external requests`, async t => {
    const { page, errors, external } = await setup(t, vp, touch);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const small = await page.evaluate(() => [...document.querySelectorAll('.steps button, .steps select, .steps input:not([type=checkbox]), .views-tabs button')].filter(b => b.offsetParent && b.getBoundingClientRect().height < 43.5).map(b => b.id || b.textContent));
    assert.deepEqual(small, []);
    await shot(page, `r02a-home-${name}`);
    assert.deepEqual(errors, []); assert.deepEqual(external, []);
  });

test('B3 missing reference: pending, no ceiling drawn in 3D or section, nothing assumed', async t => {
  const { page } = await setup(t);
  await item(page, 'ceilinglight', { drop: 0 });
  await page.evaluate(() => R02Lab.place({ x: 8300, y: 2700 }));
  assert.equal(await chip(page), 'Pendiente de datos');
  assert.match(await page.locator('#explain').innerText(), /falta un dato vertical/);
  assert.equal((await page.evaluate(() => R02Lab.meshes())).some(m => m.role === 'ceiling'), false, 'no ceiling plane');
  assert.match(await page.locator('#section').innerHTML(), /techo desconocido: no se supone/);
  assert.equal(await btn(page, 'Añadir a la propuesta revisable').isDisabled(), true);
  await shot(page, 'r02a-pending-no-reference-1440');
});

test('B2 confirmed reference: candidate, 3D ceiling at the stated height and the item hanging from it (world coordinates)', async t => {
  const { page } = await setup(t);
  await confirmReference(page, 2600); await item(page, 'pendant', { drop: 100 });
  // (7000, 2300) in the master bedroom: clear of the bed (x ≥ 7400) and of the wardrobe (y ≥ 2770).
  await page.evaluate(() => R02Lab.place({ x: 7000, y: 2300 }));
  assert.equal(await chip(page), 'Revisable');
  const m = await page.evaluate(() => R02Lab.meshes());
  const ceiling = m.find(x => x.role === 'ceiling'), prop = m.find(x => x.role === 'proposal');
  assert.ok(Math.abs(ceiling.min[1] - 2.6) < 1e-6, 'ceiling plane at 2.6 m');
  const mount = await page.evaluate(() => R02Lab.current.proposal.mount);
  assert.ok(Math.abs(prop.max[1] - mount.topMm / 1000) < 1e-3 && Math.abs(mount.topMm - 2500) < 1e-9, `top = 2600 − 100 (${prop.max[1]})`);
  assert.ok(Math.abs(prop.min[1] - mount.bottomMm / 1000) < 1e-3);
  assert.match(await page.locator('#section').innerHTML(), /techo 2600 mm/);
  await shot(page, 'r02a-candidate-1440');
});

test('B2 interference with a floor object: blocked with the reason in words, alternatives in the same room, use one, add, project unchanged', async t => {
  const { page } = await setup(t);
  await confirmReference(page); await item(page, 'pendant', { h: 2300, drop: 0 });
  await page.evaluate(() => R02Lab.place({ x: 8300, y: 1000 }));
  assert.equal(await chip(page), 'Bloqueado'); assert.match(await page.locator('#explain').innerText(), /parte alta de la cama/);
  assert.match(await page.locator('#stageState').innerText(), /Bloqueado[\s\S]*cama/, 'the state is shown next to the views');
  await btn(page, 'Ver alternativas').click();
  const alts = await page.evaluate(() => R02Lab.alternatives.map(a => ({ p: a.position, room: a.evaluation.proposal.roomId, s: a.evaluation.state })));
  assert.equal(alts.length, 3); for (const a of alts) { assert.equal(a.room, 'rom_master'); assert.equal(a.s, 'candidate-reviewable'); }
  assert.equal(await page.locator('#plan [data-role=alternative]').count(), 3);
  await shot(page, 'r02a-alternatives-1440');
  await btn(page, 'Usar alternativa 1').click();
  assert.equal(await chip(page), 'Revisable');
  await btn(page, 'Añadir a la propuesta revisable').click();
  assert.equal(await page.locator('#cmpReview').innerText(), '1'); assert.equal(await page.locator('#cmpProject').innerText(), 'sin cambios');
  assert.equal(await unchanged(page), true); assert.equal((await page.evaluate(() => R02Lab.project)).extensions['x-r02a-ceiling'].items.length, 0, 'only the vertical reference the user saved, no item yet');
  // Confirmation needs the explicit checkbox; then the item is re-checked and saved in the synthetic project only.
  assert.equal(await btn(page, 'Confirmar y guardar').isDisabled(), true);
  await page.check('#confirmChk'); await btn(page, 'Confirmar y guardar').click();
  assert.match(await page.locator('#msg').innerText(), /Guardados 1 elementos/);
  const ext = await page.evaluate(() => R02Lab.project.extensions['x-r02a-ceiling']);
  assert.equal(ext.items.length, 1); assert.equal(ext.items[0].review, 'human-confirmed'); assert.equal(ext.verticalReferences[0].roomId, 'rom_master');
  assert.equal(await unchanged(page), true, 'walls, rooms and furniture untouched');
  assert.equal(await page.locator('#plan [data-role=confirmed]').count(), 1);
  await shot(page, 'r02a-confirmed-1440');
});

test('B3 insufficient height: blocked, and alternatives say moving cannot help', async t => {
  const { page } = await setup(t);
  await confirmReference(page, 2400); await item(page, 'pendant', { h: 2500, drop: 0 });
  await page.evaluate(() => R02Lab.place({ x: 8300, y: 2700 }));
  assert.equal(await chip(page), 'Bloqueado'); assert.match(await page.locator('#explain').innerText(), /superan la altura libre/);
  await btn(page, 'Ver alternativas').click();
  assert.match(await page.locator('#msg').innerText(), /Moverlo no ayuda/);
  assert.equal(await page.locator('#plan [data-role=alternative]').count(), 0);
});

test('B2 keyboard: exact placement from X/Y and the Colocar button gives the same evaluation as a tap', async t => {
  const { page } = await setup(t);
  await confirmReference(page); await item(page, 'ceilinglight', { drop: 0 });
  await page.fill('#px', '7000'); await page.fill('#py', '2300'); await page.locator('#placeBtn').focus(); await page.keyboard.press('Enter');
  assert.equal(await chip(page), 'Revisable');
  assert.deepEqual(await page.evaluate(() => R02Lab.current.proposal.position), { x: 7000, y: 2300 });
});

test('B3 invalid data and invalid positions: refused with a reason, never placed', async t => {
  const { page } = await setup(t);
  await confirmReference(page); await item(page, 'ceilinglight', { drop: -5 });
  await page.evaluate(() => R02Lab.place({ x: 8300, y: 2700 }));
  assert.equal(await chip(page), 'Datos no válidos'); assert.match(await page.locator('#explain').innerText(), /invalid-drop/);
  await item(page, 'ceilinglight', { drop: 0 });
  await page.evaluate(() => R02Lab.place({ x: 20000, y: 20000 }));
  assert.equal(await chip(page), 'Bloqueado'); assert.match(await page.locator('#explain').innerText(), /no está dentro de ninguna estancia/);
});

for (const [name, vp] of [['390x844', { width: 390, height: 844 }], ['844x390', { width: 844, height: 390 }]])
  test(`B2 phone ${name}: place by touch on the plan; the state stays visible next to the views; section and 3D tabs`, async t => {
    const { page, errors } = await setup(t, vp, true);
    await confirmReference(page); await item(page, 'ceilinglight', { drop: 0 });
    await page.locator('#plan').scrollIntoViewIfNeeded();
    const box = await page.locator('#plan').boundingBox();
    await page.touchscreen.tap(box.x + box.width * 0.5, box.y + box.height * 0.5);
    const c = await chip(page); assert.ok(['Revisable', 'Bloqueado', 'Pendiente de datos'].includes(c), `placed by touch: ${c} / ${await page.locator('#explain').innerText()}`);
    assert.ok(await page.locator('#stageState').isVisible());
    await shot(page, `r02a-phone-plan-${name}`);
    await page.locator('#t-sec').tap(); assert.ok(await page.locator('#section').isVisible()); await shot(page, `r02a-phone-section-${name}`);
    await page.locator('#t-3d').tap(); await page.evaluate(() => R02Lab.frame3d()); assert.ok(await page.locator('#view3d').isVisible()); await shot(page, `r02a-phone-3d-${name}`);
    assert.deepEqual(errors, []);
  });
