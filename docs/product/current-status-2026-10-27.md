# Estado canónico de producto — 27-10-2026

**Fuente de verdad de estado para agentes y revisiones.**

No deducir el estado actual desde documentos fechados anteriores. Si existe contradicción sobre qué está implementado o cerrado, prevalecen este archivo y el estado real de `master`.

## Evidencia de cierres

- Puntos 1–6: cerrados; Punto 6 por PR #106, squash `422d6a893325e343e6e045805c2ec034a27ae631`.
- Punto 7A — Quantity Engine: cerrado por PR #108, squash `57adfde7e10cdd7a6b7defcbe197d5e3d067e462`.
- Punto 7B — Budget Core: cerrado por PR #110, squash `5de3af3f322e38f868e0214bea196b06fc3ae21a`.
- Punto 7C-A — `FloorPlanCostProvider` contrato/core: cerrado por PR #112, squash `1f1b651c997bb7596ef3ed5b8d3e859ce6f196e3`.
- Punto 7C-B — `ManualCostProvider`: cerrado por PR #114, squash `24584a3ff8ef1d8021d8518738650d18e353863f`.

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
| 7C-B | `ManualCostProvider` | **CERRADO** |
| 7C-C | Budget provenance de providers | **CANDIDATO EN REVISIÓN** |
| 7C-D | Parser FIEBDC-3/BC3 | **SIGUIENTE** |
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

### 7C-B — ManualCostProvider — CERRADO

Cerrado por PR #114, squash `24584a3ff8ef1d8021d8518738650d18e353863f`.

Primer provider concreto y opción offline permanente. `FloorPlanManualCostProvider` aporta un quote EUR normalizado con procedencia humana explícita, licencia `not-applicable` y precio cero válido. Usa el registry y los validadores de 7C-A; no tiene catálogo, red, storage, UI ni selección automática entre providers. Un quote manual no marca una partida como revisada. El corte termina en CostQuote: Budget V1.0.0 permanece intacto y el bridge CostQuote → Budget corresponde a 7C-C.

CI del HEAD `a79291e68569c142faeca9504fd0895b0e9e1128`: Guided, Solar, Multiformat y Vercel en verde.

Documento: `docs/product/point-7c-b-manual-cost-provider-2026-10-27.md`.

### 7C-C — Budget provenance y CostQuote bridge — CANDIDATO EN REVISIÓN

`FloorPlanBudgetV1` evoluciona de forma compatible a 1.1.0. `createBudget()` crea 1.1.0; parse/serialize siguen aceptando y preservando 1.0.0 manual-only. `upgradeBudget()` migra explícitamente, sin alterar cálculos, review ni documentos de origen.

En 1.1 cada partida distingue precio activo `unitPrice`, su `priceSource`, un `priceReference` externo opcional y la revisión profesional independiente. El bridge valida CostQuote, unidad exacta y EUR; permite adjuntar una referencia sin cambiar el precio activo, o aplicarla como precio activo aún no revisado. Un override manual conserva la referencia original y reinicia review. No hay conversión, selección automática ni gate legal BCCA en este corte.

Documento: `docs/product/point-7c-c-budget-provider-provenance-2026-10-27.md`.

### Orden restante de 7C

1. **7C-C — CANDIDATO EN REVISIÓN** — evolución compatible de `FloorPlanBudgetV1` para provenance/reference prices.
2. **7C-D — SIGUIENTE** — parser FIEBDC-3/BC3.
3. **7C-E — PENDIENTE** — adapter `BCCA_ES` con fixtures sintéticos y gate legal/técnico.
4. Activar datos BCCA reales solo cuando las condiciones oficiales de reutilización/redistribución comercial estén verificadas.

La compilación DDC CC BY-NC no se incorpora a producción.

### 7D — PENDIENTE

Presentación y exportación deben consumir `FloorPlanBudget.calculateBudget()`; no deben recrear fórmulas de merma, subtotal o IVA.

### Etapa 2 posterior

Asset Lab para mobiliario/equipamiento/catálogo comercial cuando exista demanda.

## Regla para agentes

1. Leer primero este archivo y verificar `master`/SHA antes de trabajar.
2. No reabrir 1–6, 7A, 7B, 7C-A o 7C-B salvo regresión reproducible o decisión expresa.
3. 7C-A fija el contrato/provider core; 7C-B aporta Manual offline permanente.
4. 7C-C es candidato en revisión; no marcarlo cerrado antes de review y merge.
5. `FloorPlanBudgetV1` 1.0.0 permanece válido/manual-only; la versión 1.1.0 se crea nueva o mediante upgrade explícito.
6. No activar BCCA real sin gate legal/técnico verificado.
7. No introducir DDC CC BY-NC en producción.
8. No adelantar UI/exportación de 7D dentro de 7C.
9. No adelantar Punto 8/9 dentro de Punto 7.
10. Una fuente externa o quote de provider nunca equivale por sí sola a revisión/aprobación profesional.
