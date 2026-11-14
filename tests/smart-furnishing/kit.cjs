'use strict';
/* UX-12/13 · utilidades de navegador compartidas por la prueba Playwright y el script de grabación.
   Todo el recorrido usa la interfaz real (menú Archivo, clics o toques, panel de la estancia). Las lecturas de estado
   pasan por `read`, que comprueba que la página NO cambió el proyecto al leerlo (una lectura no puede preparar nada). */
const path = require('node:path');
const FIXTURE = path.join(__dirname, '..', 'fixtures', 'smart-furnishing-demo.json');

// Lectura sin efectos: el proyecto guardado y el de memoria deben ser idénticos antes y después.
async function read(page, fn, arg) {
  return page.evaluate(async ([src, a]) => {
    const before = JSON.stringify(window.FloorPlanApp.project), f = new Function('return ' + src)();
    const out = await f(a);
    if (JSON.stringify(window.FloorPlanApp.project) !== before) throw Error('read() cambió el proyecto: la prueba no puede preparar estado');
    return out;
  }, [fn.toString(), arg]);
}
const state = page => read(page, () => ({ undo: undoStack.length, redo: redoStack.length, json: JSON.stringify(window.FloorPlanApp.project), stored: Object.keys(localStorage).sort().map(k => k + '=' + localStorage.getItem(k)).join('\n'),
  objects: window.FloorPlanApp.project.objects.length, sf: window.FloorPlanApp.project.objects.filter(o => o.id.startsWith('obj_sf')).map(o => o.id) }));

// «Archivo ▸ Importar proyecto JSON» con el selector de archivos real.
async function importFixture(page) {
  await page.locator('details.menu > summary').click();
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.locator('#importJson').click()]);
  await chooser.setFiles(FIXTURE);
  await page.waitForFunction(() => window.FloorPlanApp.project.id === 'prj_qa-ux12-demo');
  await page.waitForTimeout(400);
}
// Panel lateral abierto/cerrado en pantallas estrechas (el botón «Propiedades» real).
async function panel(page, open) {
  const isOpen = await page.evaluate(() => document.querySelector('aside.right')?.classList.contains('open'));
  if (isOpen !== open && await page.evaluate(() => matchMedia('(max-width:1100px)').matches)) { await page.locator('#tgPanel').click(); await page.waitForTimeout(250); }
}
async function tap(page, locator, touch) { await locator.scrollIntoViewIfNeeded(); if (touch) await locator.tap(); else await locator.click(); }
module.exports = { FIXTURE, read, state, importFixture, panel, tap };
