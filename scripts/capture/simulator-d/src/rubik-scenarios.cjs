'use strict';
/* SCULPT Simulator · D · Acciones de RUBIK que se capturan. Solo API y controles EXISTENTES del producto (la autoridad de
 * cámara y animación sigue en View3D y en la presentación): el componente controla el tiempo, no la escena. */
const { advanceUntil } = require('./virtual-capture.cjs');
const SCENARIOS = {
  // Paso del plano 2D a la vista 3D (transición del producto).
  enter3d: { selector: null, prepare: async page => { await page.evaluate(() => { setView('2d'); }); await advanceUntil(page, () => window.FloorPlanApp.viewMode === '2d'); }, started: () => window.FloorPlanApp.viewMode === '3d', action: async page => { await page.evaluate(() => { setView('3d'); }); } },
  // Vuelo de cámara a una estancia (View3D.flyToRoom, autoridad de cámara de RUBIK).
  flyToRoom: { started: () => !!window.View3D.lifecycleMetrics?.flying, action: async (page, { roomId }) => { await page.evaluate(id => { if (!window.FloorPlanApp.project.rooms.some(r => r.id === id)) throw Error('Unknown room: ' + id); window.View3D.flyToRoom(id); }, roomId); } },
  // Siguiente parada de la presentación, con el control de teclado de la propia presentación.
  presentationNext: {
    // Camino de la persona usuaria: «Presentar mi vivienda» abre su configuración y «Iniciar presentación» la arranca.
    prepare: async page => {
      if (await page.evaluate(() => !!(window.FloorPlanPresentation.active && window.FloorPlanPresentation.current))) return; // ya iniciada: siguiente parada
      await page.evaluate(() => { window.FloorPlanPresentation.open(); });
      await advanceUntil(page, () => !!document.querySelector('dialog.presentation-config[open]'));
      await page.locator('dialog.presentation-config[open]').getByRole('button', { name: /Iniciar presentación|Start presentation/ }).click();
      await advanceUntil(page, () => !!(window.FloorPlanPresentation.active && window.FloorPlanPresentation.plan && window.FloorPlanPresentation.current));
    },
    started: () => window.FloorPlanPresentation.current?.id !== window.__vcPrevStop,
    action: async page => { await page.evaluate(() => { window.__vcPrevStop = window.FloorPlanPresentation.current?.id; }); await page.keyboard.press('ArrowRight'); },
  },
};
async function run(session, name, params, capture, settle, opts = {}) {
  const sc = SCENARIOS[name]; if (!sc) throw Object.assign(Error('Unknown scenario: ' + name), { code: 'SCENARIO' });
  if (sc.prepare) await sc.prepare(session.page, params);
  const o = 'selector' in sc ? { ...opts, selector: sc.selector } : opts;
  await settle(session.page, o);
  return capture(session, { ...o, label: name, started: sc.started || null, action: page => sc.action(page, params || {}) });
}
module.exports = { SCENARIOS, run };
