// UX-312 PERLA · editor en dos filas (V4). Algunos controles cambian de sitio sin cambiar de id ni de efecto:
// - en teléfono y tableta horizontal, las herramientas avanzadas van en el menú «⋯» de la cabecera (#perlaMore);
// - la guía es el panel «Tareas del proyecto» a demanda (#guideBar se muestra al abrirlo).
// mostrar(page, selector) deja el control a la vista por el mismo camino que una persona y devuelve su localizador.
'use strict';

async function mostrar(page, selector) {
  const target = page.locator(selector).first();
  await target.waitFor({ state: 'attached' });
  if (await target.isVisible()) return target;
  const where = await target.evaluate(el => ({
    more: !!el.closest('#perlaMore'),
    guide: !!el.closest('#guideBar'),
  }));
  if (where.guide) await page.evaluate(() => window.FloorPlanPerla?.setGuide?.(true, { focus: false }));
  if (where.more) await page.evaluate(() => { const m = document.getElementById('perlaMore'); if (m) m.open = true; });
  await target.waitFor({ state: 'visible' });
  return target;
}

module.exports = { mostrar };
