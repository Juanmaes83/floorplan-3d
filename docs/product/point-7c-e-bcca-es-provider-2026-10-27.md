# Punto 7C-E — BCCA_ES CostProvider y gates — candidato en revisión

**BASE_SHA:** `cc929338b642a65b1f286c91e4b1c2bac72f6260` (`origin/master`, PR #117 integrada). **Rama:** `feat/point-7c-e-bcca-es-provider`. La familia 7C y Punto 7 completo siguen abiertos mientras este candidato no haya sido revisado y fusionado; 7D permanece pendiente.

## Arquitectura y API

`BC3 → FloorPlanFIEBDC3 → modelo canónico → BCCA_ES adapter → FloorPlanCostProvider → CostQuote reference → bridge 7C-C → FloorPlanBudget 1.1`. El adapter no analiza BC3 ni lee registros crudos. `js/cost-provider-bcca-es.js` exporta `FloorPlanBccaEsCostProvider.create(options)` con ID estable `bcca-es`, CommonJS/global explícito, sin singleton, autorregistro ni cambios en `index.html`. Capabilities: `{search:true,getItem:true,getPrice:true,network:'none'}`. La API de opciones, motivos y resultados figura en `docs/contracts/FloorPlanBccaEsCostProvider.md`.

## Modelo, índice y operaciones

La factory siempre ejecuta `FloorPlanFIEBDC3.validate(inputModel)` y usa exclusivamente su resultado. Un modelo que solo parece BC3 no pasa el gate técnico. Se construye un índice in-memory una vez, sin mutar el modelo. Las claves permitidas son `concept.code`, `concept.identity` y alias exactos proyectados; el adapter no recrea la equivalencia FIEBDC `#`/`##`. Como 7C-D no expone identidad de cada alias, un alias con sufijo no se busca por una variante sin sufijo a menos que esa variante también esté proyectada como clave exacta. El itemId siempre es `concept.code`.

Un concepto raíz/capítulo puede ser válido sin unidad y no se trata como partida. Solo se indexa como priceable si tiene descripción defensible y unidad no vacía. Se usa `concept.summary`, y después un `~T` asociable mediante claves ya proyectadas. No se inventa una descripción desde el código ni una categoría; `category:null`.

`search` es local, determinista y sin fuzzy: coincidencia exacta código/alias, prefijo y descripción, luego código canónico. Texto sin distinguir mayúsculas, filtros exactos de unidad y región `Andalucía, España`, límite 1–100. Un filtro de categoría no comprobable devuelve vacío con motivo estable. `getItem`/`getPrice` resuelven ID canónico, identidad proyectada y alias exacto sin case-fold. Un concepto existente no priceable se distingue de uno inexistente.

## Precio, moneda, unidad y fecha

No se elige la primera variante por defecto cuando hay varias. Una sola variante puede seleccionarse automáticamente; varias exigen `{index}` o `{label}` exacto. Labels duplicados son ambiguos. Se usa el objeto seleccionado de `concept.prices` con `inheritedPrice`/`inheritedDate` ya proyectados, sin otra herencia ni fallback. Precio `0` es válido; ausencia, negativo o no finito no produce quote. Moneda `EUR` es configuración obligatoria explícita; no se infiere del BC3, región ni rótulo. La unidad del concepto se preserva exactamente: el bridge solo acepta coincidencia exacta con Budget; no transforma `kg`, `u` ni `m3`.

El `CostQuote` usa siempre `priceKind:'reference'`; no representa aprobación profesional. La fecha de la variante se convierte de DDMMYYYY completo y válido a `YYYY-MM-DD` según [FIEBDC-3/2024](https://www.fiebdc.es/web2/datos/uploads/Formato-FIEBDC-3-2024.pdf); parcial o imposible queda `null`. `retrievedAt:null`, pues el adapter no recupera datos remotamente.

## Gates y procedencia

El gate técnico comprueba validación canónica, versión/conceptos, al menos un item priceable, IDs/metadata compatibles, estructura de variantes y EUR explícito. El gate legal tiene solo `VERIFIED | UNKNOWN | RESTRICTED`. `synthetic` opera con datos inventados. `user-supplied` permite procesar un BC3 aportado por el profesional con estado `UNKNOWN` conservado en metadata y quote; una restricción explícita bloquea. `rubik-managed` exige `VERIFIED` y gate técnico PASS; con `UNKNOWN` o `RESTRICTED` bloquea. Una URL de descarga sola no eleva el gate. La revisión oficial actual está en `docs/legal/bcca-es-reuse-gate-2026-10-27.md` y concluye `UNKNOWN` para gestión por Rubik. No se incorporó ni descargó BCCA real.

La metadata oficial tiene `kind:'official-dataset'` solo cuando el modo representa esa fuente. Tests de simulación oficial usan exclusivamente datos inventados con etiqueta visible `SYNTHETIC TEST ONLY`. No se inventan edición, atribución, licencia ni fecha de recuperación. Una `license.status='unknown'` permanece unknown.

## Fixtures, tests y límites

`tests/fixtures/bcca-es/synthetic.cjs` contiene raíz, capítulo, partidas ficticias `m2`, `m`, `kg`, alias, precio cero/ausente, variantes múltiples y heredadas, labels duplicados, fechas completas/parciales, texto y conceptos no priceable. `tests/cost-provider-bcca-es.test.cjs` cubre gates, registry, búsqueda, selección, procedencia, no-mutación, aislamiento de red/DOM/storage, integración con CostQuote y bridge Budget sin revisión automática.

Verificación local: suite dirigida 7C-E más regresiones 7C-A/B/C/D, **151 PASS / 0 FAIL / 0 SKIP**; suite amplia no-browser, **477 PASS / 0 FAIL / 2 SKIP**. Los SKIP son integraciones Blender opcionales sin `BPY_PYTHON` y `BLENDER_EXE`. Sintaxis de los tres JS nuevos y `git diff --check`: PASS. CI/Vercel se informan separadamente al abrir la PR. Los warnings no relacionados de 7C-D se toleran; un dato ambiguo o inválido usado para item/precio produce gate FAIL o resultado unavailable/invalid. No hay datos BCCA/DDC reales, descarga, UI, cache, storage, conversión de unidades/moneda, presupuesto visual ni 7D.

**Siguiente tras revisión y futuro merge:** 7D. No se inicia en esta PR.
