# CAT-04 · Gate 0 — Inventario y diseño (Mis catálogos → Presupuestar → Asistente, con referencias del Estudio de imágenes)

Base auditada: `master@b9f761326a554e0a7a58d0b88e823771e36b5a7c` (merge de #234; árbol idéntico a `a378df6`).
Rama: `feat/cat-04-catalog-budget-assistant`. Issue: #235. Estado: NO MERGE · NO PRODUCTION · STOP_GASTO.

## 1. Autoridades actuales (leídas en el código, no supuestas)

| Dato | Autoridad | Dónde |
|---|---|---|
| Geometría, medidas, objetos | `FloorPlanProjectV1` (editor) | `index.html`, `js/project-core.js` |
| Vínculo objeto → SKU | `project.extensions['x-cat03-catalog-link']` | `js/catalog-placement-core.js` (`linkOf/attach/links/duplicate`) |
| Fichas de producto y precio de ficha | `CatalogProductV1` por estudio, `localStorage rubik-cat-ia-catalogs-v1:<studio>` | `js/catalog-product-core.js` |
| Documento de presupuesto | `FloorPlanBudgetV1` 1.0.0/1.1.0, `localStorage rubik-budget-v1[projectId]` | `js/budget-core.js`, `js/budget-ui.js` |
| Importes | `FloorPlanBudget.calculateBudget()` | `js/budget-core.js:368` |
| Reconstrucción del presupuesto | `FloorPlanBudgetDraft.draft()` llamado SOLO desde `FloorPlanBudgetUI.load()` | `js/budget-draft-core.js:31`, `js/budget-ui.js:31` |
| Precio de referencia → partida | `FloorPlanCostCatalog.previewApply/apply` (vista previa, confirmación, consentimiento, `revisionTag`) sobre `FloorPlanBudgetCostBridge` | `js/cost-catalog-core.js:209-240`, `js/budget-cost-bridge.js` |
| Diálogo de precios de referencia | `FloorPlanReferencePricesUI` (S2 en Presupuestar, historial en el expediente) | `js/reference-prices-ui.js` |
| Lectores del presupuesto | Asistente (`assistant-ui.js:35`), dossier (`economic-dossier-ui.js:31`), expediente/plan (`construction-context.js:41,58`), presentación (`presentation-ui.js:141`) — **todos por `FloorPlanBudgetUI.current()`** | — |
| Ficha visual | `rubik-visual-result-sheet/1` (con `hash`), solo en memoria de `RubikVisualStudio.sheet` | `js/visual-reform-core.js:108`, `js/visual-reform-ui.js:185` |
| Asistente | herramientas de solo lectura en lista blanca; `catalog` responde «en preparación» | `assistant-session-core.js:58`, `assistant-ui.js:38` (`catalog:false`), `assistant-runtime-core.js:74` |

## 2. Diferencias con el encargo (el código manda)

1. `FloorPlanBudgetV1` **reconstruye cada partida con `createItem`** (`budget-core.js:265`): cualquier campo extra (SKU, objetos, revisión) se pierde. La procedencia de catálogo NO puede vivir dentro de la partida; vive en el vínculo del proyecto y en `priceReference` (código = SKU, `itemId` = identidad comercial, `source.edition` = revisión de catálogo y versión de ficha).
2. La cantidad solo admite fuente `quantity-engine` (FloorPlanQuantities) o `manual` (`budget-core.js:174-180`). `FloorPlanQuantities` no cuenta objetos por SKU: el recuento de objetos vinculados se registra como fuente `manual` con etiqueta explícita «Recuento automático de objetos vinculados (CAT-03); no es una medición del motor de cantidades». No se atribuye al motor geométrico.
3. El puente exige unidad idéntica (`budget-cost-bridge.js:16`); `ud→unit`, `ml→m` solo por notación mediante `FloorPlanCostCatalog.unitCheck` (`cost-catalog-core.js:53`). El proveedor CAT-03 emitía `'u'`: S2 lo normaliza (`bc3-budget-core.js:12`), sin conversión.
4. `RubikCatalogPlacement.costProvider().find()` buscaba el SKU en **todos** los catálogos y tomaba el primero: ambigüedad silenciosa. Se corrige: identidad comercial completa o SKU único; varios → `ambiguous`.
5. El panel CAT-03 «Partidas del proyecto» calculaba **su propio total aplicando el precio de ficha sin confirmación** (`budgetLines`, prueba `catalog-placement.browser.test.cjs:58-62`, 1435 €). Es un motor paralelo que CAT-04 prohíbe: el panel pasa a mostrar las cifras de Presupuestar (`calculateBudget`). La expectativa de esa prueba cambia por diseño (documentado en el commit), no para tapar un defecto.
6. `FloorPlanBudgetUI.draft()` descarta toda partida que no salga de `lines()`: es la causa de que una partida CAT-03 «desaparezca al reabrir».

## 3. Matriz Existe / Falta / Cambio mínimo / Prueba de aceptación

| # | Requisito | Existe | Falta | Cambio mínimo | Prueba |
|---|---|---|---|---|---|
| A1 | Partidas de productos colocados en Presupuestar | vínculo, `links()` activo/huérfano | partidas en el documento real | `js/catalog-budget-core.js` (puro) + `draft({extraLines})` + `budget-ui load()` | core + E2E pasos 4-5 |
| A2 | Identidad sin depender solo del SKU | campos en el vínculo | agrupación por estudio+catálogo+producto+variante | id de partida `cat:<studio>:<catalog>:<product>:<variant>` | negativos SKU ambiguo / otro estudio |
| A3 | Unidades sin conversiones | `unitCheck` S2 | regla para m²/ml | `ud`→`unit` por notación; `m2`/`ml` → cantidad `unavailable` «pendiente de medición» | negativo precio por m² |
| A4 | Precio: referencia ≠ activo, confirmación | S2 `previewApply/apply`, diálogo de precios | fuente «Mi catálogo» | fuente S2 por catálogo en `catalog-budget-core` + alta en `reference-prices-ui` | E2E 6-9, cancelar, consentimiento |
| A5 | Ficha cambiada / desaparecida | `productVersion`, `revisionHash` | aviso sin sobrescribir | estados `sheet-changed`, `sheet-unavailable`, `version-changed` | E2E 13, negativo catálogo borrado |
| B1 | Persistencia y una sola autoridad | `rubik-budget-v1`, `commit()` | partidas CAT al reabrir | conciliación dentro de `draft()`; sin calculadora en CAT-IA | E2E 11-12, reabrir |
| B2 | Deshacer/rehacer/borrar | `undo` del editor, vínculo | conservar precio si se deshace un borrado | partida retenida con 0 ud si tenía precio o referencia; se retira a mano | E2E 10-11, 14 |
| B3 | Dossier económico con las mismas cifras | `economic-dossier-ui` lee `current()` | — (automático) | capítulo «Productos de mi estudio» | E2E 16 |
| C1 | Referencias visuales en Presupuestar | ficha con `hash` | vínculo persistente y verificable | `project.extensions['x-cat04-visual-refs']` (metadatos + huellas, sin píxeles) + `js/visual-reference-core.js` + sección en Presupuestar + botón en el Estudio | E2E visual, negativos |
| D1 | Asistente reconoce catálogo, partidas y referencias | `assistantCapabilities`, `get_budget_summary` | herramientas e intenciones | 3 herramientas de solo lectura + intenciones ES/EN/ZH; cifras del mismo `calculateBudget` | pruebas puras y navegador |
| E1 | UX 5 áreas, ES/EN/ZH, 3 tamaños | — | — | reutiliza diálogos existentes | navegador 1440/390/844 |

## 4. Ciclos de vida

**Vínculo SKU.** Colocar → `attach` (un paso de deshacer) → duplicar copia el vínculo → borrar deja huérfano (ignorado, nunca revive) → exportar/importar viaja con el proyecto.

**Precio.** `desconocido` (ficha sin precio) · `ficha` (precio de ficha disponible, sin aplicar) · `referencia` (guardada en `priceReference`, sin aplicar) · `aplicado` (`provider-reference`, sin revisar) · `revisado` (`review.status=reviewed`) · `desactualizado` (la ficha actual difiere de la referencia aplicada: `unitPrice` o `edition`). Nada pasa a activo sin `apply({confirmed:true})`; un precio revisado exige `replaceReviewed`; si el presupuesto cambia entre vista previa y confirmación, `apply` lo rechaza (`revisionTag`).

**Referencia visual.** Ficha en memoria → «Vincular al proyecto» (paso de deshacer) → guardada como metadatos + `hash` verificable → en Presupuestar: verificada / no verificable (hash) / de otro proyecto / rechazada / simulación → quitar vínculo. Nunca crea importe ni certifica SKU.

## 5. Archivos que cambian

Nuevos: `js/catalog-budget-core.js`, `js/visual-reference-core.js`, `js/cat04-ui.js`, pruebas `tests/catalog-budget-core.test.cjs`, `tests/visual-reference-core.test.cjs`, `tests/cat04.browser.test.cjs`, este documento y el acta.
Modificados (mínimo): `js/budget-draft-core.js` (parámetro opcional `extraLines`), `js/budget-ui.js` (pasar las líneas, tarifa solo geométrica), `js/catalog-placement-core.js` (identidad y ambigüedad del proveedor), `js/catalog-placement-ui.js` (panel con cifras de Presupuestar), `js/reference-prices-ui.js` (fuente «Mi catálogo»), `js/visual-reform-ui.js` (vincular), asistente (`assistant-domain-tools-core.js`, `assistant-intents-core.js`, `assistant-session-core.js`, `assistant-runtime-core.js`, `assistant-ui.js`), `index.html` (carga y gancho `applyExtension`).
Sin cambios de contrato en `FloorPlanBudgetV1`, `FloorPlanCostProvider` ni S2.
