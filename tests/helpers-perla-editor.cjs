// UX-312 PERLA · editor en dos filas (V4). Algunos controles cambian de sitio sin cambiar de id ni de efecto:
// - en teléfono y tableta horizontal, las herramientas avanzadas van en el menú «⋯» de la cabecera (#perlaMore);
// - la guía es el panel «Tareas del proyecto» a demanda (#guideBar se muestra al abrirlo).
// mostrar(page, selector) deja el control a la vista por el mismo camino que una persona y devuelve su localizador.
'use strict';

// §9 · menú de proyecto (#perlaProjectMenu): las acciones de proyecto viven en él. Tres botones de siempre conservan id y
// manejador pero quedan ocultos porque el menú tiene UNA entrada visible que acciona el mismo flujo; mostrar() devuelve esa
// entrada (lo que pulsaría una persona): «Crear copia» (pmCopy → #guideCopyExample) y «Subir plano o proyecto…»
// (pmUpload → el mismo pick() de #uploadPlanBtn / #importImage).
const MENU_EQUIVALENT = { '#guideCopyExample': '#pmCopy', '#uploadPlanBtn': '#pmUpload', '#importImage': '#pmUpload', '#joinRoomPlan': '#roomPlanJoinQuick' };

async function mostrar(page, selector) {
  const target = page.locator(selector).first();
  await target.waitFor({ state: 'attached' });
  if (await target.isVisible()) return target;
  const where = await target.evaluate(el => ({
    more: !!el.closest('#perlaMore'),
    guide: !!el.closest('#guideBar'),
    project: !!el.closest('#perlaProjectMenu'),
    projectMore: !!el.closest('#perlaProjectMenu .perla-pm-more details'),
  }));
  if (where.project || MENU_EQUIVALENT[selector]) {
    await page.evaluate(more => { const m = document.getElementById('perlaProjectMenu'); if (m) m.open = true; if (more) document.querySelectorAll('#perlaProjectMenu .perla-pm-more details').forEach(d => { d.open = true; }); }, where.projectMore);
    if (MENU_EQUIVALENT[selector] && !(await target.isVisible())) { const eq = page.locator(MENU_EQUIVALENT[selector]); await eq.waitFor({ state: 'visible' }); return eq; }
  }
  if (where.guide) await page.evaluate(() => window.FloorPlanPerla?.setGuide?.(true, { focus: false }));
  if (where.more) await page.evaluate(() => { const m = document.getElementById('perlaMore'); if (m) m.open = true; });
  await target.waitFor({ state: 'visible' });
  return target;
}

module.exports = { mostrar };
