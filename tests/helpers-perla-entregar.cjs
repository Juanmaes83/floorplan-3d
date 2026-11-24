// UX-312 PERLA · Entregar según la maqueta c96888ac: cada ficha del índice muestra UNA acción; el resto de sus acciones
// están en su panel de detalle (cada botón del panel pulsa el control real, que sigue en el DOM con su id y su ruta).
// Las pruebas que usaban una acción secundaria abren antes el panel de su ficha con estos ayudantes.
'use strict';

// Abre el panel de la ficha con ese código (D1…T2, P8/P9). Si ya está abierto, no hace nada.
async function abrirFicha(page, code) {
  const open = await page.evaluate(c => {
    const p = document.querySelector('#professionalWorkspace .mesa .panel.perla-panel-open');
    return !!p && p.querySelector('.perla-panel-code')?.textContent === c;
  }, code);
  if (open) return;
  const sel = page.locator(`#professionalWorkspace [data-entrega-code="${code}"] .perla-card-selector`);
  await sel.waitFor({ state: 'attached' });
  await sel.scrollIntoViewIfNeeded();
  await sel.click({ position: { x: 12, y: 12 } });
  await page.locator('#professionalWorkspace .mesa .panel.perla-panel-open .panel-f').waitFor();
}

// Devuelve un localizador pulsable para un control de una ficha: el propio control si está a la vista; si no, el botón
// equivalente del panel de su ficha (mismo texto). Fuera de las fichas devuelve el control tal cual.
async function accion(page, selector) {
  const target = typeof selector === 'string' ? page.locator(selector).first() : selector.first();
  await target.waitFor({ state: 'attached' });
  if (await target.isVisible()) return target;
  const info = await target.evaluate(el => {
    const c = el.closest('.perla-ref');
    return c ? { code: c.dataset.entregaCode, text: el.textContent.trim() } : null;
  });
  if (!info) return target;
  await abrirFicha(page, info.code);
  return page.locator('#professionalWorkspace .mesa .panel.perla-panel-open .panel-f')
    .getByRole('button', { name: info.text, exact: true });
}

module.exports = { abrirFicha, accion };
