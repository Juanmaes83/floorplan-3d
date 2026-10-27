# Estado canónico de producto — 27-10-2026

**Fuente de verdad de estado para agentes y revisiones.**

No deducir el estado actual desde documentos fechados anteriores. Si existe contradicción sobre qué está implementado o cerrado, prevalecen este archivo y el estado real de `master`.

## Evidencia de cierres

- Puntos 1–6: cerrados; Punto 6 por PR #106, squash `422d6a893325e343e6e045805c2ec034a27ae631`.
- Punto 7A — Quantity Engine: cerrado por PR #108, squash `57adfde7e10cdd7a6b7defcbe197d5e3d067e462`.
- Punto 7B — Budget Core: cerrado por PR #110, squash `5de3af3f322e38f868e0214bea196b06fc3ae21a`.
- Punto 7C-A — `FloorPlanCostProvider` contrato/core: cerrado por PR #112, squash `1f1b651c997bb7596ef3ed5b8d3e859ce6f196e3`.

## Resumen

| Punto | Capacidad | Estado |
|---:|---|---|
| 1 | Construir y medir — acceso/contexto | **CERRADO** |
| 2 | Tipo declarado de muro | **CERRADO** |
| 3 | Superficies estancia → planta → vivienda | **CERRADO** |
| 4 | Familia funcional + nombre libre de estancia | **CERRADO** |
| 5 | Ficha profesional de superficies | **CERRADO** |
| 6 | Orientación + ubicación + solar orientativo + GeoProvider | **CERRADO** |
| 7A | Quantity Engine | **CERRADO** |
| 7B | Budget Core | **CERRADO** |
| 7C-A | `FloorPlanCostProvider` contrato/core | **CERRADO** |
| 7C-B | `ManualCostProvider` | **SIGUIENTE** |
| 7C-C | Budget provenance de providers | **PENDIENTE** |
| 7C-D | Parser FIEBDC-3/BC3 | **PENDIENTE** |
| 7C-E | `BCCA_ES` + gate legal/técnico | **PENDIENTE** |
| 7D | Presentación/exportación | **PENDIENTE** |
| 8 | Exterior V1 → V3 | **APROBADO, POSTERIOR** |
| 9 | Instalaciones ligeras | **APROBADO, POSTERIOR** |

## Capacidades cerradas 1–6

Los Puntos 1–6 no deben reabrirse salvo regresión reproducible o decisión expresa.

- Punto 1 reutiliza el sistema real de construcción/medición; no existe un segundo editor paralelo.
- Punto 2 persiste el tipo declarado de muro y su procedencia sin inferir capacidad estructural.
- Punto 3 dispone de `FloorPlanSurfaceMetrics` con estancia → planta → vivienda y estados `measured | estimated | unavailable`.
- Punto 4 separa `room.family` de `room.name` libre.
- Punto 5 reutiliza Punto 3 para la ficha profesional de superficies.
- Punto 6 aporta norte declarado, ubicación privada, solar orientativo y frontera `FloorPlanGeoProvider`; no constituye estudio solar/regulatorio.

## Punto 7

El Punto 7 completo **NO está cerrado**.

### 7A — Quantity Engine — CERRADO

`FloorPlanQuantities` es la autoridad de cantidades derivadas para presupuesto:

- suelo m²;
- perímetro interior geométrico;
- longitudes/alturas de muros válidas;
- superficies brutas/huecos/netas cuando son justificables;
- caras por estancia solo con asociación geométrica demostrable;
- conteos de huecos;
- multiplanta.

Reglas: desconocido no es cero; parcial no es completo; no persiste totales; no muta proyecto.

Documento: `docs/product/point-7a-quantity-engine-2026-10-27.md`.

### 7B — Budget Core — CERRADO

`FloorPlanBudgetV1` 1.0.0 y `FloorPlanBudget` están cerrados.

Incluyen:

- partidas/capítulos;
- cantidades 7A o manuales explícitas;
- unidad `m2 | m | unit`;
- merma explícita;
- precio unitario manual;
- EUR;
- subtotal neto;
- IVA configurable;
- subtotal bruto;
- revisión y procedencia;
- totales parciales honestos;
- JSON independiente.

Reglas:

- 7B no mide geometría;
- `null` no equivale a 0;
- precio desconocido no produce subtotal;
- IVA desconocido no equivale a 0 %;
- cantidades no se redondean prematuramente;
- importes monetarios de línea se redondean a céntimos;
- `FloorPlanBudgetV1` 1.0.0 solo admite `priceSource.type = manual`.

Documentos:

- `docs/product/point-7b-budget-core-2026-10-27.md`;
- `docs/contracts/FloorPlanBudgetV1.md`;
- `docs/contracts/FloorPlanBudgetV1.schema.json`.

### 7C-A — FloorPlanCostProvider core — CERRADO

Cerrado por PR #112, squash `1f1b651c997bb7596ef3ed5b8d3e859ce6f196e3`.

Fija una frontera agnóstica de proveedor antes de implementar Manual o BCCA.

Incluye:

- `js/cost-provider.js` / `FloorPlanCostProvider`;
- capabilities `search/getItem/getPrice` + modo de red;
- `getSourceMetadata()` con provenance/licencia explícita;
- resultados `available | not-found | unavailable | invalid | cancelled | unsupported`;
- item y quote normalizados;
- EUR en quote V1;
- `priceKind: manual | reference` sin implicar revisión profesional;
- registry en memoria;
- wrappers compatibles con providers sync/async;
- aislamiento de errores operacionales del adapter;
- rechazo de payloads que incumplen el contrato.

No cambia `FloorPlanBudgetV1` 1.0.0 y todavía no persiste quotes de providers en partidas.

Documentos:

- `docs/contracts/FloorPlanCostProvider.md`;
- `docs/product/point-7c-a-cost-provider-core-2026-10-27.md`;
- `docs/qa/pr-112-solar-ci-timeout-2026-10-27.md`.

La estabilización de CI solar asociada a #112 divide el recorrido desktop en fases secuenciales conservando acciones y assertions, sin cambios de producto, Three.js, matemáticas solares, PNG ni CostProvider. CI final del HEAD `5fc2f78269bed82f829e32f7b17577b620c1f08a`: Solar, Guided, Multiformat y Vercel en verde.

### Orden restante de 7C

1. **7C-B** — `ManualCostProvider`, fallback/offline permanente.
2. **7C-C** — evolución compatible de `FloorPlanBudgetV1` para provenance/reference prices.
3. **7C-D** — parser FIEBDC-3/BC3.
4. **7C-E** — adapter `BCCA_ES` con fixtures sintéticos y gate legal/técnico.
5. Activar datos BCCA reales solo cuando las condiciones oficiales de reutilización/redistribución comercial estén verificadas.

La compilación DDC CC BY-NC no se incorpora a producción.

### 7D — PENDIENTE

Presentación y exportación deben consumir `FloorPlanBudget.calculateBudget()`; no deben recrear fórmulas de merma, subtotal o IVA.

### Etapa 2 posterior

Asset Lab para mobiliario/equipamiento/catálogo comercial cuando exista demanda.

## Regla para agentes

1. Leer primero este archivo y verificar `master`/SHA antes de trabajar.
2. No reabrir 1–6, 7A, 7B o 7C-A salvo regresión reproducible o decisión expresa.
3. 7C-A no implementa ningún provider real.
4. 7C-B es el siguiente corte: Manual y offline permanente.
5. `FloorPlanBudgetV1` 1.0.0 permanece válido/manual-only; providers externos requieren evolución compatible explícita en 7C-C.
6. No activar BCCA real sin gate legal/técnico verificado.
7. No introducir DDC CC BY-NC en producción.
8. No adelantar UI/exportación de 7D dentro de 7C.
9. No adelantar Punto 8/9 dentro de Punto 7.
10. Una fuente externa o quote de provider nunca equivale por sí sola a revisión/aprobación profesional.
