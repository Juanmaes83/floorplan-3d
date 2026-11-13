// SCULPT-R03 A2/A3 · the isolated editor lab (labs/sculpt/r03-editor) in a real browser, desktop and phone.
// Observable results, not only DOM: the 3D meshes are read back in world coordinates and compared with the elevation;
// the canvas pixels change when the doors hide or open; refused edits leave the state, the elevation and the 3D unchanged.
// Synthetic project only (RUBIK's reference flat); nothing is written to RUBIK. Screenshots: R03_ARTIFACTS=<dir>.
'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { createServer } = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
let server, base;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css' };
before(async () => {
  const root = path.resolve(__dirname, '..');
  server = createServer(async (req, res) => {
    try { const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://l').pathname)); if (!file.startsWith(root)) throw 0; const body = await fs.readFile(file); res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' }); res.end(body); }
    catch { res.writeHead(404); res.end(); }
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}/labs/sculpt/r03-editor/index.html`;
});
after(() => new Promise(r => server.close(r)));

async function setup(t, viewport = { width: 1440, height: 900 }, opts = {}) {
  const browser = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/chromium', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  t.after(() => browser.close());
  const context = await browser.newContext({ viewport, hasTouch: !!opts.touch, isMobile: !!opts.touch });
  const page = await context.newPage(); page.setDefaultTimeout(30000);
  const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(base); await page.waitForFunction(() => window.R03Lab?.ready);
  return { page, errors };
}
const state = page => page.evaluate(() => JSON.stringify(R03Lab.session.state));
const msg = page => page.locator('.r03-msg').innerText();
async function shot(page, name, locator) {
  if (!process.env.R03_ARTIFACTS) return;
  await fs.mkdir(process.env.R03_ARTIFACTS, { recursive: true });
  await page.waitForTimeout(250);
  if (locator) await page.locator(locator).screenshot({ path: path.join(process.env.R03_ARTIFACTS, name + '.png') });
  else await page.screenshot({ path: path.join(process.env.R03_ARTIFACTS, name + '.png') });
}
const is3dVisible = page => page.evaluate(() => { const r = document.querySelector('#view3d').getBoundingClientRect(); return r.width > 0 && r.height > 0; });
async function show3d(page) { if (!(await is3dVisible(page)) || (await page.locator('#tab-3d').isVisible())) { if (await page.locator('#tab-3d').isVisible()) await page.click('#tab-3d'); } await page.evaluate(() => R03Lab.frame()); await page.waitForTimeout(300); }
// Mean absolute RGB difference over the cabinet's screen box between two canvas snapshots.
async function canvasPixels(page) { return page.evaluate(() => { const c = document.querySelector('#view3d'), g = document.createElement('canvas'); g.width = 160; g.height = 120; const x = g.getContext('2d'); x.drawImage(c, 0, 0, 160, 120); return Array.from(x.getImageData(0, 0, 160, 120).data); }); }
const diff = (a, b) => { let s = 0, n = 0; for (let i = 0; i < a.length; i += 4) { s += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]); n++; } return s / n / 3; };
const btn = (page, name) => page.getByRole('button', { name, exact: true });
const field = (page, id) => page.locator('#' + id);
async function setField(page, id, value) { const f = field(page, id); await f.scrollIntoViewIfNeeded(); await f.fill(String(value)); await f.press('Enter'); }

for (const [name, viewport, opts] of [['1440x900', { width: 1440, height: 900 }, {}], ['1280x800', { width: 1280, height: 800 }, {}], ['390x844', { width: 390, height: 844 }, { touch: true }], ['844x390', { width: 844, height: 390 }, { touch: true }]])
  test(`A2 lab opens clean ${name}: every cabinet listed, no horizontal scroll, touch targets ≥ 44 px, the views stay in sight on phones`, async t => {
    const { page, errors } = await setup(t, viewport, opts);
    assert.equal(await page.locator('#list .pick').count(), 5, 'the five cabinet objects of the reference flat');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal scroll');
    const small = await page.evaluate(() => [...document.querySelectorAll('#editor button, #editor input:not([type=checkbox]), .views-tabs button')].filter(b => b.offsetParent && b.getBoundingClientRect().height < 43.5).map(b => b.textContent || b.id));
    assert.deepEqual(small, [], 'touch targets');
    if (viewport.width < 1100) {
      await btn(page, 'Añadir balda').scrollIntoViewIfNeeded();
      const top = await page.evaluate(() => document.querySelector('.stage').getBoundingClientRect().top);
      assert.ok(top <= 1, `the views stick to the top while editing (top=${top})`);
    }
    await shot(page, `r03-editor-home-${name}`);
    assert.deepEqual(errors, []);
  });

test('A2 split and merge from the UI: elevation, 3D dividers and the list agree', async t => {
  const { page } = await setup(t);
  await page.click('#r03-tab-1'); await btn(page, 'Dividir módulo').click();
  assert.equal(await page.locator('.r03-tab').count(), 5);
  assert.equal(await page.locator('#elevHost .r03-bay').count(), 5);
  assert.equal((await page.evaluate(() => R03Lab.parts3d())).filter(p => p.role === 'divider').length, 4, 'four dividers in 3D');
  await shot(page, 'r03-split-5-modules-1440', '#elevHost');
  await btn(page, 'Unir con el siguiente').click();
  assert.equal(await page.locator('.r03-tab').count(), 4);
  assert.equal((await page.evaluate(() => R03Lab.parts3d())).filter(p => p.role === 'divider').length, 3);
});

test('A2 two shelves too close: refused with the reason, the input goes back, nothing changes (state, elevation, 3D)', async t => {
  const { page } = await setup(t);
  await page.click('#r03-tab-0'); await btn(page, 'Añadir balda').click();
  const s0 = await state(page), elev0 = await page.locator('#elevHost').innerHTML(), parts0 = JSON.stringify(await page.evaluate(() => R03Lab.parts3d()));
  const shelves = await page.evaluate(() => R03Lab.session.state.cabinet.columns[0].shelves);
  await setField(page, 'r03-shelf-0', shelves[1] - 20);
  assert.match(await msg(page), /Módulo 1: cada balda necesita al menos 60 mm/);
  assert.equal(await page.locator('.r03-msg').getAttribute('role'), 'alert');
  assert.equal(await field(page, 'r03-shelf-0').inputValue(), String(shelves[0]), 'the input shows the kept value');
  assert.equal(await state(page), s0); assert.equal(await page.locator('#elevHost').innerHTML(), elev0); assert.equal(JSON.stringify(await page.evaluate(() => R03Lab.parts3d())), parts0);
  await shot(page, 'r03-shelves-conflict-refused-1440');
  // Close but valid: exactly 60 mm clear above the lower board (and clear of the rail) is accepted.
  await setField(page, 'r03-shelf-1', shelves[0] + 18 + 60);
  assert.match(await msg(page), /Baldas actualizadas/);
  await shot(page, 'r03-shelves-close-valid-1440', '#elevHost');
});

test('A2 rod and drawers: two drawers visible in elevation and 3D; a rod over the drawers and a seventh drawer are refused', async t => {
  const { page } = await setup(t);
  await page.click('#r03-tab-1');
  await page.click('[aria-label="Un cajón más"]'); await page.click('[aria-label="Un cajón más"]');
  assert.equal(await page.locator('#r03-drawers').innerText(), '2');
  assert.equal(await page.locator('#elevHost .r03-drawer').count(), 2 + 2, 'the two new ones and the two of the default M3');
  const fronts = (await page.evaluate(() => R03Lab.parts3d())).filter(p => p.role === 'drawer-front' && p.bay === 1);
  assert.equal(fronts.length, 2, 'two drawer fronts in 3D for M2');
  const s0 = await state(page);
  await setField(page, 'r03-rod', 2 * 180 + 40);
  assert.match(await msg(page), /la barra choca/); assert.equal(await state(page), s0);
  for (let i = 0; i < 4; i++) await page.click('[aria-label="Un cajón más"]');
  const six = await state(page);
  await page.click('[aria-label="Un cajón más"]');
  assert.match(await msg(page), /entre 0 y 6 cajones|no caben/); assert.equal(await state(page), six);
  await shot(page, 'r03-rod-drawers-1440');
});

test('A3 doors closed / hidden / open: 3D leaves, canvas pixels and plan swing follow the state', async t => {
  const { page } = await setup(t);
  await show3d(page);
  const doors = async () => (await page.evaluate(() => R03Lab.parts3d())).filter(p => p.role === 'door');
  const closedPx = await canvasPixels(page); assert.ok((await doors()).length >= 4);
  await shot(page, 'r03-3d-doors-closed-1440', '#view3d');
  await btn(page, 'Ocultas (ver interior)').click(); await page.waitForTimeout(250);
  assert.equal((await doors()).length, 0, 'hidden: no leaves');
  const hiddenPx = await canvasPixels(page);
  assert.ok(diff(closedPx, hiddenPx) > 4, `the interior becomes visible (pixel diff ${diff(closedPx, hiddenPx).toFixed(1)})`);
  await shot(page, 'r03-3d-doors-hidden-1440', '#view3d');
  await btn(page, 'Abiertas').click(); await page.waitForTimeout(250);
  const g = await page.evaluate(() => R03Lab.group()), open = await doors();
  // World → cabinet frame: undo the group's rotation; an open leaf stands out of the front by roughly its width.
  const frontZ = await page.evaluate(() => R03Lab.session.state.outer.d / 2000);
  const local = open.map(d => { const cx = (d.min[0] + d.max[0]) / 2 - g.position[0], cz = (d.min[2] + d.max[2]) / 2 - g.position[2], a = g.rotationY; return { z: cx * Math.sin(a) + cz * Math.cos(a) }; });
  assert.ok(local.every(d => d.z > frontZ + 0.15), `open leaves in front of the cabinet ${JSON.stringify(local)}`);
  assert.ok(await page.locator('#plan [data-role=swing]').count() >= 4, 'the plan shows the swing of every leaf');
  await shot(page, 'r03-3d-doors-open-1440', '#view3d');
  await shot(page, 'r03-plan-doors-open-1440', '#plan');
});

test('A3 sizes and boards: 3D carcass, shelves and rails sit where the elevation draws them (world coordinates)', async t => {
  const { page } = await setup(t);
  await btn(page, 'Ocultas (ver interior)').click();
  await setField(page, 'r03-w', 2000);
  assert.match(await page.locator('#elevHost').innerHTML(), /2000 mm/);
  const r = await page.evaluate(() => {
    const s = R03Lab.session.state, parts = R03Lab.parts3d(), g = R03Lab.group(), o = R03Lab.project.objects.find(x => x.id === R03Lab.selected);
    const elev = RubikCabinetCore.elevation(s.outer, s.cabinet);
    const carcass = parts.filter(p => ['side', 'top', 'base'].includes(p.role)), minY = Math.min(...carcass.map(p => p.min[1])), maxY = Math.max(...carcass.map(p => p.max[1]));
    const shelves3d = parts.filter(p => p.role === 'shelf').map(p => Math.round(p.min[1] * 1000 - (o.elevationMm || 0))).sort((a, b) => a - b);
    const shelves2d = elev.filter(p => p.role === 'shelf').map(p => Math.round(p.y)).sort((a, b) => a - b);
    const sides = parts.filter(p => p.role === 'side').map(p => [(p.min[0] + p.max[0]) / 2, (p.min[2] + p.max[2]) / 2]);
    const span = Math.hypot(sides[0][0] - sides[1][0], sides[0][1] - sides[1][1]) * 1000 + s.cabinet.thickness;
    return { minY, maxY, height: s.cabinet.height, shelves3d, shelves2d, span, w: s.outer.w, objectW: o.size.widthMm };
  });
  assert.ok(Math.abs(r.span - r.w) < 1, `carcass width in 3D ${r.span} = ${r.w}`);
  assert.ok(Math.abs((r.maxY - r.minY) * 1000 - (r.height - 0)) < 81 + 1, 'carcass height (plinth to top)');
  assert.ok(Math.abs(r.maxY * 1000 - r.height) < 1, 'top of the carcass at the cabinet height');
  assert.deepEqual(r.shelves3d, r.shelves2d, 'every shelf at the same height in 3D and elevation');
  await shot(page, 'r03-3d-resized-2000-1440', '#view3d');
});

test('A3 rotation and orientation: every cabinet is placed like RUBIK places furniture (rotation.y = −rotationDeg, front towards the room)', async t => {
  const { page } = await setup(t);
  const ids = await page.evaluate(() => R03Lab.project.objects.filter(o => RubikCabinetCore.isCabinetType(o.type)).map(o => o.id));
  for (const id of ids) {
    await page.evaluate(i => R03Lab.select(i), id);
    const r = await page.evaluate(() => { const o = R03Lab.project.objects.find(x => x.id === R03Lab.selected), g = R03Lab.group(); return { rot: o.rotationDeg, ry: g.rotationY, p: g.position, x: o.position.x, y: o.position.y }; });
    assert.ok(Math.abs(r.ry + r.rot * Math.PI / 180) < 1e-9, `${id} rotation`);
    assert.ok(Math.abs(r.p[0] * 1000 - r.x) < 1e-6 && Math.abs(r.p[2] * 1000 - r.y) < 1e-6, `${id} position`);
  }
});

test('A2 keyboard: modules are a tablist (arrows, Home, End), Ctrl+Z / Ctrl+Y undo and redo, Escape restores an input', async t => {
  const { page } = await setup(t);
  await page.locator('#r03-tab-0').focus(); await page.keyboard.press('ArrowRight');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'r03-tab-1'); assert.equal(await page.evaluate(() => R03Lab.session.bay), 1);
  await page.keyboard.press('End'); assert.equal(await page.evaluate(() => R03Lab.session.bay), 3);
  await page.keyboard.press('Home'); assert.equal(await page.evaluate(() => R03Lab.session.bay), 0);
  const s0 = await state(page);
  await btn(page, 'Dividir módulo').focus(); await page.keyboard.press('Enter');
  assert.notEqual(await state(page), s0);
  await page.locator('.r03-tab').first().focus(); await page.keyboard.press('Control+z'); assert.equal(await state(page), s0, 'Ctrl+Z');
  await page.keyboard.press('Control+y'); assert.notEqual(await state(page), s0, 'Ctrl+Y');
  const w = field(page, 'r03-w'); await w.fill('1234'); await w.press('Escape'); assert.equal(await w.inputValue(), '2400');
});

test('A1+A2 save, reopen from JSON, restore and cancel: the saved interior is what the project carries', async t => {
  const { page } = await setup(t);
  await page.click('#r03-tab-2'); await btn(page, 'Añadir balda').click(); await btn(page, 'Abiertas').click();
  const edited = await page.evaluate(() => R03Lab.session.state.cabinet);
  await btn(page, 'Guardar interior').click();
  assert.match(await msg(page), /Interior guardado/);
  assert.match(await page.locator('#list .pick[aria-pressed=true] .st').innerText(), /interior guardado/);
  const project = await page.evaluate(() => R03Lab.project);
  assert.deepEqual(project.extensions['x-r03-cabinet'].entries[0].cabinet, edited);
  assert.equal(await btn(page, 'Guardar interior').isDisabled(), true, 'nothing to save after saving');
  // Reopen the project file (JSON) in a fresh page: same interior, status ok.
  const { page: p2 } = await setup(t);
  await p2.evaluate(p => R03Lab.load(p), project);
  assert.deepEqual(await p2.evaluate(() => R03Lab.session.state.cabinet), edited);
  // Restablecer goes back to the opened state; Cancelar reopens the saved one.
  await btn(page, 'Dividir módulo').click(); assert.equal(await page.locator('.r03-tab').count(), 5);
  await btn(page, 'Restablecer').click(); assert.equal(await page.locator('.r03-tab').count(), 4);
  await btn(page, 'Dividir módulo').click(); await btn(page, 'Cancelar').click();
  assert.deepEqual(await page.evaluate(() => R03Lab.session.state.cabinet), edited);
  await page.locator('details.data summary', { hasText: 'Datos guardados' }).click();
  await shot(page, 'r03-saved-json-1440');
});

test('A1 the real file round trip: «Descargar proyecto JSON», then «Reabrir JSON» in a fresh page gives the same interior, elevation and 3D', async t => {
  const os = require('node:os');
  const { page, errors } = await setup(t);
  // Edit the SECOND cabinet of the list, so reopening has to find where the saved work is.
  await page.locator('#list .pick').nth(1).click();
  await page.click('#r03-tab-1'); await btn(page, 'Añadir balda').click(); await btn(page, 'Añadir balda').click(); await btn(page, 'Abiertas').click();
  await btn(page, 'Guardar interior').click(); assert.match(await msg(page), /Interior guardado/);
  const saved = await page.evaluate(() => ({ cabinet: R03Lab.session.state.cabinet, id: R03Lab.selected, parts: R03Lab.parts3d(), elevation: document.querySelector('#elevHost svg').outerHTML }));
  await shot(page, 'r03-roundtrip-1-saved-1440');
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('#export')]);
  const file = path.join(await fs.mkdtemp(path.join(os.tmpdir(), 'r03-')), download.suggestedFilename());
  await download.saveAs(file);
  const onDisk = JSON.parse(await fs.readFile(file, 'utf8'));
  assert.deepEqual(onDisk.extensions['x-r03-cabinet'].entries.find(e => e.objectId === saved.id).cabinet, saved.cabinet, 'the downloaded file carries the saved interior');
  // A fresh page knows nothing about the edit until the file is opened through the real file input.
  const { page: p2, errors: e2 } = await setup(t);
  assert.notDeepEqual(await p2.evaluate(() => R03Lab.session.state.cabinet), saved.cabinet);
  await p2.setInputFiles('#import', file);
  await p2.waitForFunction(() => /Proyecto reabierto/.test(document.querySelector('#fileNote').textContent));
  assert.match(await p2.locator('#fileNote').innerText(), /Proyecto reabierto: 1 interior guardado\./);
  assert.equal(await p2.evaluate(() => R03Lab.selected), saved.id);
  assert.deepEqual(await p2.evaluate(() => R03Lab.session.state.cabinet), saved.cabinet, 'same interior');
  assert.match(await p2.locator('#list .pick[aria-pressed=true] .st').innerText(), /interior guardado/);
  assert.equal(await p2.evaluate(() => document.querySelector('#elevHost svg').outerHTML), saved.elevation, 'same elevation drawing');
  assert.deepEqual(await p2.evaluate(() => R03Lab.parts3d()), saved.parts, 'same 3D parts in world coordinates');
  assert.equal(await btn(p2, 'Guardar interior').isDisabled(), true, 'reopened = saved: nothing pending');
  await shot(p2, 'r03-roundtrip-2-reopened-1440');
  await p2.locator('#fileNote').scrollIntoViewIfNeeded(); await shot(p2, 'r03-roundtrip-3-file-note-1440', 'section:has(#fileNote)');
  assert.deepEqual(errors, []); assert.deepEqual(e2, []);
});

test('A3 vertical reference: none → unchecked; a stated one is compared with the top of the cabinet', async t => {
  const { page } = await setup(t);
  assert.match(await page.locator('#vcheck').innerText(), /Sin referencia vertical confirmada.*2200 mm/);
  await page.locator('summary', { hasText: 'Referencia vertical' }).click();
  await page.fill('#vClear', '2150'); await page.fill('#vSource', 'medición sintética de prueba'); await page.click('#vApply');
  assert.match(await page.locator('#vcheck').innerText(), /No cabe: sobrepasa la referencia en 50 mm/);
  await page.fill('#vSource', ''); await page.click('#vApply');
  assert.match(await page.locator('#vcheck').innerText(), /no indica de dónde procede/);
});

for (const [name, viewport] of [['390x844', { width: 390, height: 844 }], ['844x390', { width: 844, height: 390 }]])
  test(`A2/A3 phone ${name}: edit with touch, see it in the elevation and the 3D without leaving the controls`, async t => {
    const { page, errors } = await setup(t, viewport, { touch: true });
    await page.locator('#r03-tab-0').tap(); await btn(page, 'Añadir balda').tap();
    assert.match(await msg(page), /Balda añadida/);
    assert.ok(await page.locator('.r03-msg').isVisible(), 'the result is visible next to the controls');
    await shot(page, `r03-phone-edit-${name}`);
    await page.locator('#tab-3d').tap(); await btn(page, 'Ocultas (ver interior)').tap(); await page.evaluate(() => R03Lab.frame()); await page.waitForTimeout(300);
    assert.ok(await is3dVisible(page));
    assert.equal((await page.evaluate(() => R03Lab.parts3d())).filter(p => p.role === 'shelf' && p.bay === 0).length, 2);
    await shot(page, `r03-phone-3d-interior-${name}`);
    await page.locator('#tab-plan').tap(); await btn(page, 'Abiertas').tap();
    assert.ok(await page.locator('#planM [data-role=swing]').count() >= 4);
    await shot(page, `r03-phone-plan-${name}`);
    assert.deepEqual(errors, []);
  });
