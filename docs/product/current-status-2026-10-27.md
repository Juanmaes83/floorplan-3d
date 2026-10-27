# Estado canónico de producto — 27-10-2026

**Esta es la fuente de verdad de estado para agentes y revisiones.**

Base de producto al registrar el cierre 1–6: `master@422d6a893325e343e6e045805c2ec034a27ae631`.

Punto 7A cerrado mediante PR #108, squash `57adfde7e10cdd7a6b7defcbe197d5e3d067e462`.

Punto 7B cerrado mediante PR #110, squash `5de3af3f322e38f868e0214bea196b06fc3ae21a`.

No deducir el estado actual a partir de documentos fechados anteriores. Los documentos históricos explican decisiones y contexto, pero cuando exista contradicción sobre qué está implementado/cerrado, prevalece este archivo y el estado real de `master`.

## Resumen

| Punto | Capacidad | Estado | Evidencia principal |
|---:|---|---|---|
| 1 | Construir y medir — acceso/contexto | **CERRADO** | PR #99 + estado integrado posterior |
| 2 | Tipo declarado de muro | **CERRADO** | PR #101 |
| 3 | Superficies estancia → planta → vivienda | **CERRADO** | PR #102 |
| 4 | Familia funcional + nombre libre de estancia | **CERRADO** | PR #103 |
| 5 | Ficha profesional de superficies | **CERRADO** | PR #104, squash `2f6a7583a0f3d65238e1de2903f40fdd20cbe4a2` |
| 6 | Orientación + ubicación + solar orientativo + GeoProvider | **CERRADO** | PR #106, squash `422d6a893325e343e6e045805c2ec034a27ae631` |
| 7A | Quantity Engine | **CERRADO** | PR #108, squash `57adfde7e10cdd7a6b7defcbe197d5e3d067e462` |
| 7B | Budget Core | **CERRADO** | PR #110, squash `5de3af3f322e38f868e0214bea196b06fc3ae21a` |
| 7C | `FloorPlanCostProvider` | **SIGUIENTE** | 7C-A contrato/provider core; Manual primero; BCCA_ES condicionado a licencia oficial |
| 7D | Presentación/exportación | **PENDIENTE** | Después de estabilizar 7C |
| 8 | Exterior V1 → V3 | **APROBADO, POSTERIOR** | Mantiene alcance original |
| 9 | Instalaciones ligeras | **APROBADO, POSTERIOR** | Símbolos/elementos, no MEP |

## Puntos 1–6 — estado cerrado

### 1 — Construir y medir

No existe un segundo sistema de dibujo/medición. Se mejoró el acceso y contexto de las herramientas existentes. Esta línea se considera cerrada dentro del programa 1–6.

### 2 — Tipo declarado de muro

Persisten tipo y procedencia declarados por el profesional/importación/revisión. No se infiere capacidad estructural por geometría, grosor ni IA. No constituye verificación estructural.

### 3 — Superficies

Existe núcleo derivado de superficies con jerarquía estancia → planta → vivienda, estados medido/estimado/no disponible, exclusiones y compatibilidad multiplanta. No se inventa superficie cuando falta evidencia.

### 4 — Familias de estancias

`room.family` y `room.name` son conceptos separados. La familia sirve a automatismos/estadística; el nombre sigue siendo libre. Compatibilidad legacy preservada.

### 5 — Ficha profesional de superficies

La ficha reutiliza el núcleo del Punto 3 y presenta estancia/planta/vivienda, estado de medición, exclusiones y pavimentos con salida profesional/printable. No convierte estimaciones en mediciones certificadas.

### 6 — Orientación, ubicación, solar y GeoProvider

Cerrado mediante PR #106.

#### 6A — Orientación básica
- norte lógico declarado/configurable;
- visible en 2D;
- persistente;
- borrable;
- compartido coherentemente en edificio multiplanta;
- no rota destructivamente la geometría;
- no se infiere automáticamente.

#### 6B — Ubicación
- latitud;
- longitud;
- timezone IANA;
- entrada manual/offline;
- procedencia mínima;
- privacidad: guardar ubicación interna y publicarla son decisiones separadas;
- `site` opcional en contrato; proyectos antiguos siguen abriendo sin inferencias.

#### 6C — Solar orientativo
- SunCalc 2.1.1 vendorizado, licencia BSD preservada;
- núcleo solar separado del renderer;
- adaptación explícita de azimut/elevación al sistema de escena;
- reutiliza la `DirectionalLight` existente;
- Presentación y Solar orientativo son modos diferenciados y reversibles;
- Three.js 0.160.0 vendorizado localmente;
- no se promete estudio de soleamiento, energía, normativa ni precisión pericial.

#### 6D — `FloorPlanGeoProvider`
- frontera estable de proveedor geográfico;
- proveedor manual/offline funcional y permanente;
- solar no conoce Catastro/IGN/PNOA/Google Maps directamente;
- España continúa como primer objetivo de proveedor territorial real;
- Catastro/IGN/CNIG/PNOA quedan para cortes territoriales posteriores, especialmente Exterior V3;
- no se implementó GIS general ni datos personales/protegidos.

### QA final del Punto 6

El HEAD candidato `6838636835fe3d1ea681c8f2ed756dc31c4564f4` terminó con los workflows relevantes en SUCCESS. El ajuste final de Multiformat fue exclusivamente del harness de test para bloquear también `/vendor/three/**` en el escenario `webgl=false`.

## Punto 7 — estado por cortes

El Punto 7 completo **NO está cerrado**.

### 7A — Quantity Engine — CERRADO

Cerrado mediante PR #108, squash `57adfde7e10cdd7a6b7defcbe197d5e3d067e462`.

`FloorPlanQuantities` convierte datos persistidos y superficies existentes en cantidades defendibles sin introducir dinero:

- superficie de suelo reutilizando `FloorPlanSurfaceMetrics`;
- perímetro interior geométrico;
- longitud/altura de muros cuando son válidas;
- superficie bruta, huecos y neta de muros cuando puede justificarse;
- caras de muro por estancia solo con asociación geométrica demostrable;
- conteo de huecos;
- agregados por estado de muro;
- áreas por material de suelo;
- proyecto individual y edificio multiplanta.

Reglas de certeza:

- `measured | estimated | unavailable`;
- desconocido nunca se convierte en cero;
- subtotal parcial nunca se presenta como completo;
- 7A es derivado, no persiste totales y no muta el proyecto;
- no introduce precios, IVA, BCCA, CostProvider ni UI de presupuesto.

Documento técnico/producto:

`docs/product/point-7a-quantity-engine-2026-10-27.md`

### 7B — Budget Core — CERRADO

Cerrado mediante PR #110, squash `5de3af3f322e38f868e0214bea196b06fc3ae21a`.

7B introduce el contrato separado `FloorPlanBudgetV1` y el núcleo `FloorPlanBudget` sin modificar `FloorPlanProjectV1` ni `FloorPlanBuildingV1`.

Capacidades cerradas:

- partidas y capítulos;
- cantidades procedentes de 7A con trazabilidad `FloorPlanQuantities`;
- cantidades manuales explícitamente diferenciadas;
- unidad `m2 | m | unit`;
- merma explícita sin sobrescribir la cantidad geométrica;
- precio unitario manual;
- moneda V1 `EUR`;
- subtotal neto;
- IVA configurable global y override por partida;
- IVA desconocido distinto de 0 %;
- subtotal bruto;
- procedencia manual y fecha opcional;
- revisión `unreviewed | reviewed` con timestamp;
- cambio de precio invalida la revisión previa;
- precio desconocido `null` distinto de precio 0;
- totales parciales marcados como incompletos;
- serialización/parseo JSON independiente;
- cálculo no mutante y sin DOM/red.

Reglas:

- 7B no vuelve a medir geometría;
- no redondea prematuramente cantidades;
- importes monetarios de línea se redondean a céntimos;
- un desconocido nunca se suma como cero;
- `FloorPlanBudgetV1` 1.0.0 admite `priceSource.type = manual`;
- `FloorPlanCostProvider`, BCCA/DDC y UI/exportación permanecen fuera de 7B.

QA de cierre: los workflows `Guided experience`, `Point 6 solar and compatibility` y `Multiformat guided import` terminaron en SUCCESS sobre el HEAD candidato `215f857075ddba49420a3f8dd1df781992b13adc` antes del merge.

Documentación:

- `docs/product/point-7b-budget-core-2026-10-27.md`;
- `docs/contracts/FloorPlanBudgetV1.md`;
- `docs/contracts/FloorPlanBudgetV1.schema.json`.

### 7C — `FloorPlanCostProvider` — SIGUIENTE

El siguiente corte es **7C-A: contrato y núcleo de proveedor de costes**.

Orden previsto:

1. 7C-A — `FloorPlanCostProvider` + contrato normalizado;
2. 7C-B — `ManualCostProvider` como fallback/offline permanente;
3. 7C-C — evolución compatible de `FloorPlanBudgetV1` para provenance de proveedor externo;
4. 7C-D — parser FIEBDC-3/BC3;
5. 7C-E — adapter `BCCA_ES` con fixtures y gate legal;
6. activar datos BCCA reales solo cuando las condiciones oficiales de reutilización/redistribución comercial estén verificadas.

No incorporar en producción la compilación DDC CC BY-NC.

### 7D — Presentación/exportación — PENDIENTE

Resúmenes por estancia/planta/vivienda/capítulos y exportación cuando corresponda. Debe consumir `FloorPlanBudget.calculateBudget()` y no duplicar fórmulas monetarias.

### Etapa 2 posterior

Asset Lab para mobiliario/equipamiento/catálogo comercial cuando exista demanda.

## Regla para agentes

1. Leer primero este archivo.
2. Verificar `master` y SHA antes de trabajar.
3. Los documentos con fecha anterior pueden ser historia o diseño previo, no estado actual.
4. No reabrir Puntos 1–6, 7A ni 7B salvo regresión reproducible o decisión expresa.
5. El siguiente corte es 7C-A — contrato/núcleo `FloorPlanCostProvider`.
6. 7C debe respetar las fórmulas y semántica monetaria cerradas en 7B; no duplicarlas.
7. `FloorPlanBudgetV1` 1.0.0 sigue siendo válido y manual-only; cualquier soporte de proveedor externo debe ser una evolución compatible explícita.
8. No activar BCCA real sin gate legal/técnico verificado.
9. No adelantar UI/exportación de 7D dentro de 7C-A.
10. No adelantar Punto 8/9 dentro de Punto 7.
11. No asumir que una fuente externa equivale a certificación o aprobación profesional de Rubik.
