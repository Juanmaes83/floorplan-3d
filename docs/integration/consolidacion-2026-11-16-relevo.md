# Consolidación 2026-11-16 — relevo (rama `claude/vibrant-clarke-woev1u`, PR #241 Draft)

Base: `master@46174d6`. Sin merge, sin Production, sin gasto. `vercel.json` desactiva los despliegues de la rama (0 deployments comprobados).

## Hecho y probado
| SHA | Corte | Pruebas |
|---|---|---|
| `2349297` | CON-01: unidad de catálogo sin ficha no se inventa al reabrir | `tests/con-01-unit-history.test.cjs` 2/2 |
| `a913919` | CON-03: «Importar presupuesto (JSON)» + recorrido transversal | `tests/con-03-budget-import.test.cjs` 4/4 · `tests/consolidacion-transversal.browser.test.cjs` 3/3 |
| `766f6db` | Identidad P1: un `project.id` por proyecto; bifurcación de presupuesto en duplicar/variante/edificio; importación sin herencia; migración idempotente; Asistente por proyecto | `tests/project-identity.test.cjs` 6/6 · `tests/project-identity.browser.test.cjs` 3/3 · pura completa 1334/0 |
| `babe3bc` | CI: `consolidation-regression.yml`, manifiesto `tests/regression-partitions.json`, detector de cobertura | 146 archivos, 0 sin cobertura |
| `99761f0` | Hilo de revisión ligado a la identidad del archivo; dos aserciones obsoletas actualizadas | client-review 5/5 · building 3/3 · variants 4/4 |

## Subido SIN verificar
- `css/nav3d.css` (último commit): NAV3D bajo el cajón abierto en ≤1100 px. `build-palette` pasó en 1440×900; **390×844 y 844×390 no llegaron a ejecutarse**. Ejecutar:
  `CHROME=<chromium> THREE_LOCAL_DIR=$PWD/vendor/three node --test --test-concurrency=1 tests/build-palette.browser.test.cjs tests/nav3d*.browser.test.cjs`
  Si queda verde, mover `tests/build-palette.browser.test.cjs` a `blocking` en el manifiesto.

## Pendiente (en orden)
1. Ver el resultado de CI de #241 (primera ejecución de `consolidation-regression.yml`) y clasificar los rojos de las tandas históricas; los 6 de `journey-orientation` uno a uno.
2. HOM-03: `git cherry-pick` de los 3 commits de `feat/hom-03-home-value-20261115` (merge-tree limpio). En `js/capability-registry.js`: quitar `gate:'CAT-04'` de `catalog-budget` y `assistant-catalogs`, estado `pilot`, texto sin «Pendiente de CAT-04», módulos `js/catalog-budget-core.js`/`js/cat04-ui.js`, pruebas `tests/cat04*.cjs`; `AI_VERIFIED_AT` → SHA de integración. No tocar `render-ai` `available` (anclado a Production).
3. #166: solo `js/delivery-client.js` (2 líneas: `fetch('api/delivery?f='+…)`), publicación del snapshot y `?entrega=` en `js/share-link-ui.js` **conservando** las cabeceras GOV-08 de master (`x-rubik-share-token`), y portar `tests/delivery-3d.browser.test.cjs`. No traer `api/*` de #166.
4. #238 (`6568d8c`): integrar tras auditoría; `js/assistant-ui.js` ya lleva las mismas líneas de `floorplan-project-switched`/`invalidate` (aquí `invalidate` restaura el log siempre, no solo con el panel abierto). Proveedor cerrado.

## Límites conocidos
- La bifurcación copia el presupuesto guardado; no copia `priceHistory` de obra ni re-dirige referencias visuales (`projectId` dentro de la extensión).
- Proyecto y presupuesto siguen siendo dos archivos al cambiar de navegador.
