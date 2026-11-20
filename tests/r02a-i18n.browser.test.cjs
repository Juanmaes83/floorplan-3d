'use strict';
/* R02-A · panel «Techo y elementos altos» en ES / EN / ZH (autorizado el 20/11/2026). Solo idioma: las operaciones,
   validaciones, guardado, deshacer/rehacer y el contrato x-r02a-ceiling no cambian (las pruebas puras y de editor existentes
   siguen intactas). Escritorio y móvil; teclado, foco, cambio de idioma con el panel abierto y cambio de proyecto.
   EN: ningún texto en español dentro del panel ni en su aviso. ES/EN: ningún nombre chino. ZH: el panel, sin ampliar. */
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs/promises'), path = require('node:path'), os = require('node:os');
const K = require('./r02a/editor-kit.cjs');
let env; test.before(async () => { env = await K.start(); }); test.after(async () => { await env?.stop(); });
const shots = process.env.R02A_SHOTS || null;
const sec = page => page.locator('section.r02a-ceiling');
const CJK = /[㐀-鿿豈-﫿]/;
const SPANISH = /[áéíóúñ¿¡]|\b(Techo|elementos|Elementos|Referencia|estancia|Guardar|Comprobar|Quitar|Editar|Altura|Fuente|Tipo|Ancho|Fondo|Alto|Descuelgue|Revisable|Bloqueado|Pendiente|Ninguno|alternativa|alternativas|planta|proyecto|Cotas|Holgura|suelo|forjado|Medida|Colocar|Centro|Nuevo|Lámpara|Plafón|Elemento|Desconocida|aviso|Cerrar|Tras|cambio)\b/;
// Todo lo que el panel (y su aviso flotante) enseña o anuncia: texto, aria-label, title, placeholder y opciones.
const panelTexts = page => page.evaluate(() => {
  const out = [], roots = [document.querySelector('section.r02a-ceiling'), document.getElementById('r02aNotice')].filter(Boolean);
  for (const r of roots) {
    if (r.hidden) continue;
    const w = document.createTreeWalker(r, NodeFilter.SHOW_TEXT);
    for (let n; (n = w.nextNode());) { const t = n.nodeValue.trim(); if (t) out.push(t); }
    for (const el of r.querySelectorAll('[aria-label],[title],[placeholder]')) for (const v of [el.getAttribute('aria-label'), el.getAttribute('title'), el.getAttribute('placeholder')]) if (v) out.push(v);
    if (r.getAttribute('aria-label')) out.push(r.getAttribute('aria-label'));
  }
  return out;
});
// Seleccionar la estancia y abrir la sección (en móvil, como r02a-editor: cerrar el panel, tocar la estancia, reabrirlo).
async function openRoom(page) {
  // Selección por la función de la app (como las pruebas de R03): no depende de qué parte del plano cabe en pantalla.
  await page.evaluate(() => { select({ kind: 'room', id: 'rom_master' }); drawer('panel', true); });
  await page.waitForSelector('section.r02a-ceiling[data-room-id="rom_master"]', { state: 'attached' });
  await K.openSection(page);
}
// Un punto libre de la estancia, buscado con el núcleo (lo mismo que hace r02a-editor.browser).
const freeSpot = page => page.evaluate(() => {
  const p = window.FloorPlanApp.project, S = window.RubikCeilingSession, X = window.RubikCeilingContract, r = p.rooms.find(x => x.id === 'rom_master');
  const xs = r.polygon.map(q => q.x), ys = r.polygon.map(q => q.y), c = S.CATALOG.pendant;
  for (let i = 1; i < 12; i++) for (let j = 1; j < 12; j++) {
    const pos = { x: Math.round(Math.min(...xs) + (Math.max(...xs) - Math.min(...xs)) * i / 12), y: Math.round(Math.min(...ys) + (Math.max(...ys) - Math.min(...ys)) * j / 12) };
    const req = { id: 'cei_probe-1', type: 'pendant', position: pos, rotationDeg: 0, size: { widthMm: c.widthMm, depthMm: c.depthMm, heightMm: c.heightMm }, dropMm: 0 };
    const ev = S.evaluate({ project: p, ceiling: X.verticalFor(p, 'rom_master'), request: req, accepted: X.asRequests(p) });
    if (ev.ok && ev.proposal.roomId === 'rom_master' && ev.state === 'candidate-reviewable' && !ev.diff.relocated) return pos;
  } return null; });
const REF = { scope: 'project', clearHeightMm: 2600, reference: 'finished-floor', source: 'synthetic' };
// Prepara el mismo estado en cada idioma: referencia, un elemento revisable guardado y otro bloqueado en comprobación.
async function exercise(page, lang) {
  await page.evaluate(l => setLang(l), lang);
  await page.evaluate(ref => window.FloorPlanApp.applyCeiling(p => window.RubikCeilingBridge.setReference(p, ref)), REF);
  await openRoom(page);
  // Comprobación por la interfaz, con el TECLADO: foco en «Comprobar» y Enter.
  const pos = await freeSpot(page);if (!pos) throw Error('sin punto libre');
  await sec(page).locator('[data-f="x"]').fill(String(pos.x));await sec(page).locator('[data-f="y"]').fill(String(pos.y));
  await sec(page).locator('[data-r02a="check"]').focus();await page.keyboard.press('Enter');
  await sec(page).locator('.r02a-result').waitFor();
  // Guardar con la confirmación expresa (aviso flotante «guardado»).
  await sec(page).locator('[data-f="confirmed"]').check();await sec(page).locator('[data-r02a="save"]').click();
  // Un borrador que no cabe en altura → bloqueado y «Ver alternativas» (explicación de alternativas).
  await openRoom(page);
  await sec(page).locator('[data-f="drop"]').fill('3000');await sec(page).locator('[data-r02a="check"]').click();
  if (await sec(page).locator('[data-r02a="alts"]').count()) await sec(page).locator('[data-r02a="alts"]').click();
  // Bloque orientativo consultado.
  if (await sec(page).locator('[data-r02a="passage"]').count()) await sec(page).locator('[data-r02a="passage"]').click();
}

for (const vp of [{ name: '1440x900', viewport: { width: 1440, height: 900 } }, { name: '390x844', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }])
test(`idioma del panel R02-A · ${vp.name}: EN sin español, ES/EN sin chino, ZH en chino; guardar y deshacer intactos`, { timeout: 300000 }, async () => {
  const { context, page, watch } = await K.editor(env, { viewport: vp.viewport, isMobile: !!vp.isMobile, hasTouch: !!vp.hasTouch });
  const touch = !!vp.hasTouch;
  try {
    // ── EN ──
    await exercise(page, 'en');
    const en = await panelTexts(page);
    const spanish = en.filter(t => SPANISH.test(t)), chinese = en.filter(t => CJK.test(t));
    assert.deepEqual(spanish, [], 'EN: textos en español en el panel: ' + JSON.stringify(spanish.slice(0, 8)));
    assert.deepEqual(chinese, [], 'EN: nombres o textos chinos: ' + JSON.stringify(chinese.slice(0, 8)));
    for (const t of [/^Ceiling and high items$/, /^Vertical reference$/, /^Items in this room \(\d+\)$/, /Reviewable|Blocked|Missing data/, /^Check$/])
      assert.ok(en.some(x => t.test(x)), 'EN: falta ' + t);
    const ext = await K.ext(page);assert.equal(ext.items.length, 1, 'el elemento se guardó por el camino normal');assert.equal(ext.items[0].review, 'human-confirmed');
    if (shots) { await fs.mkdir(shots, { recursive: true });await sec(page).scrollIntoViewIfNeeded();await page.screenshot({ path: path.join(shots, `r02a-idioma-${vp.name}-en.png`) }); }
    // Deshacer: un paso, igual que siempre (el idioma no toca el deshacer).
    await page.evaluate(() => document.querySelector('#undo')?.click());assert.equal((await K.ext(page)).items.length, 0, 'deshacer retira el elemento');
    await page.evaluate(() => document.querySelector('#redo')?.click());assert.equal((await K.ext(page)).items.length, 1, 'rehacer lo devuelve');
    // ── Cambio de idioma con el panel abierto: EN → ES ──
    await page.evaluate(() => setLang('es'));await openRoom(page);
    const es = await panelTexts(page);
    assert.ok(es.some(x => /^Techo y elementos altos$/.test(x)), 'ES: título en español');
    assert.deepEqual(es.filter(t => CJK.test(t)), [], 'ES: ningún nombre chino');
    // ── ZH: el panel, sin ampliar a toda la aplicación ──
    await page.evaluate(() => setLang('zh'));await openRoom(page);
    const zh = await panelTexts(page);
    assert.ok(zh.some(x => /^吊顶与高位元素$/.test(x)), 'ZH: título del panel en chino');
    // Ninguna palabra latina (≥ 4 letras) en el panel ni en su aviso, salvo la marca; incluye los textos guardados en el estado
    // (última comprobación, aviso) que se generaron en otro idioma antes del cambio.
    // «synthetic» es la FUENTE que escribió la persona (dato del usuario: se conserva tal cual, por política); nada más se exime.
    const latin = zh.filter(t => /[A-Za-zÁÉÍÓÚáéíóúñ]{4,}/.test(t.replace(/RUBIK/g, '').replace(new RegExp(REF.source, 'g'), '')));
    assert.deepEqual(latin, [], 'ZH: textos en ES/EN dentro del panel: ' + JSON.stringify(latin.slice(0, 8)));
    if (shots) await page.screenshot({ path: path.join(shots, `r02a-idioma-${vp.name}-zh.png`) });
    assert.deepEqual(watch.errors, []);assert.deepEqual(watch.external, []);
  } finally { await context.close(); }
});

test('teclado, foco y cambio de proyecto en EN: el resumen se abre con el teclado; otro proyecto conserva el idioma y traduce sus nombres', { timeout: 240000 }, async () => {
  const { context, page } = await K.editor(env);
  try {
    await page.evaluate(() => setLang('en'));await K.selectRoom(page, 'rom_master');
    const summary = sec(page).locator('summary');
    if (await page.evaluate(() => document.querySelector('section.r02a-ceiling details').open)) await summary.click();
    await summary.focus();await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => document.querySelector('section.r02a-ceiling details').open), true, 'Enter sobre el resumen abre el panel');
    assert.equal(await page.evaluate(() => document.activeElement?.tagName), 'SUMMARY', 'el foco sigue en el resumen');
    // Tab llega a los controles del panel, que tienen nombre accesible en inglés.
    await sec(page).locator('[data-f="scope"]').focus();
    assert.match(await page.evaluate(() => document.activeElement.closest('label')?.textContent.trim()), /^Applies to/);
    // Cambio de proyecto: el mismo piso con otro id, abierto por el selector de archivos.
    const json = await page.evaluate(() => { const p = structuredClone(window.FloorPlanApp.project);p.id = 'prj_idioma-r02a';return JSON.stringify(p); });
    const file = path.join(os.tmpdir(), 'r02a-idioma.json');await fs.writeFile(file, json);
    await page.locator('#fileIn').setInputFiles(file);await page.waitForFunction(() => window.FloorPlanApp.project?.id === 'prj_idioma-r02a');
    await K.selectRoom(page, 'rom_master');await K.openSection(page);
    const t = await panelTexts(page);
    assert.deepEqual(t.filter(x => SPANISH.test(x) || CJK.test(x)), [], 'otro proyecto en EN: ni español ni chino');
  } finally { await context.close(); }
});
