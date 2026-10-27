# Punto 7B — Budget Core

**Fecha:** 27-10-2026
**Estado:** implementación candidata en `feat/point-7b-budget-core`; no cierra todavía el Punto 7 completo.
**Base exacta:** `master@dd60f7adf3df146a4679661479dd0a3f17f5ba87`.
**Dependencia obligatoria:** Punto 7A / `FloorPlanQuantities`.
**Siguiente corte:** 7C — `FloorPlanCostProvider`.

## 0. Objetivo

Crear el núcleo monetario/profesional de presupuestos de FLOOR PLAN 3D sin introducir todavía proveedores externos de precios ni UI.

7B transforma cantidades justificables en partidas presupuestarias auditables y calculables:

- cantidad;
- unidad;
- merma explícita;
- precio unitario;
- subtotal neto;
- IVA configurable;
- subtotal bruto;
- revisión;
- procedencia;
- moneda EUR.

Principio:

> Un desconocido nunca se convierte en cero y una cifra parcial nunca se presenta como completa.

## 1. Decisión de arquitectura

El presupuesto NO se añade dentro de `FloorPlanProjectV1` ni `FloorPlanBuildingV1`.

Se introduce un documento separado:

`FloorPlanBudgetV1`

Razones:

1. proyecto/edificio describen geometría y datos espaciales;
2. presupuesto contiene decisiones comerciales editables;
3. precios, IVA y revisión tienen ciclos de vida distintos de la geometría;
4. evita elevar los schemas geométricos por una función comercial;
5. permite que 7C/7D evolucionen sin romper proyectos legacy.

Contrato:

- `docs/contracts/FloorPlanBudgetV1.md`
- `docs/contracts/FloorPlanBudgetV1.schema.json`

## 2. Relación con 7A

7B no contiene ninguna fórmula geométrica.

`FloorPlanBudget.quantityFrom7A()` recibe una cantidad ya producida por `FloorPlanQuantities` y registra:

- valor;
- unidad;
- `measured | estimated | unavailable`;
- completitud;
- referencia de origen.

Ejemplo conceptual:

```text
FloorPlanQuantities.room(...).floor.areaM2
                  ↓
FloorPlanBudget.quantityFrom7A(...)
                  ↓
partida de pavimento
```

La partida conserva la procedencia `engine: FloorPlanQuantities`.

Una cantidad manual también es posible, pero queda marcada explícitamente como `source.type = manual`.

## 3. Modelo monetario

Moneda V1:

`EUR`

No se aceptan otras monedas en este corte.

Un precio desconocido:

`unitPrice: null`

Un precio gratuito/explícitamente cero:

`unitPrice: 0`

Son estados diferentes.

## 4. Merma

La cantidad geométrica no se modifica.

Se deriva:

```text
budgetQuantity = geometricQuantity × (1 + wastePercent / 100)
```

La merma:

- es visible en el contrato;
- puede ser 0;
- no se aplica de forma implícita;
- no introduce rendimientos, cajas, litros ni reglas de fabricante.

El core conserva precisión de cantidad y no introduce una regla oculta de redondeo a 2/3 decimales.

## 5. Precio manual — flujo inicial

7B admite únicamente:

`priceSource.type = manual`

Ejemplos:

- tarifa introducida por el profesional;
- tarifa propia del estudio;
- precio revisado manualmente desde una fuente externa fuera del sistema.

La procedencia conserva:

- tipo;
- etiqueta;
- fecha `asOf` opcional.

No existe todavía `FloorPlanCostProvider`.

BCCA, DDC, catálogos remotos y proveedores de red quedan para 7C.

## 6. Revisión

Cada precio mantiene:

- `unreviewed`;
- `reviewed`.

`reviewed` exige `reviewedAt` ISO con offset.

Cuando se cambia el precio con `setManualPrice()`, la revisión anterior se invalida automáticamente y vuelve a `unreviewed`.

Esto evita conservar una aprobación profesional de un precio que ya no es el mismo.

No se guarda identidad personal del revisor en este corte.

## 7. IVA

El IVA es configurable.

Nivel presupuesto:

`taxRatePercent: number | null`

Nivel partida:

`taxRatePercent` opcional como override.

Semántica:

- `null` → tasa no definida;
- `0` → tasa explícita del 0 %;
- `>0` → tasa declarada.

Si el neto es conocido pero el IVA no, el core devuelve:

- neto conocido;
- IVA `null`;
- bruto `null`.

No inventa IVA 0 %.

## 8. Cálculo y redondeo

Por partida:

```text
budgetQuantity = quantity × (1 + waste / 100)
subtotalNet    = roundCent(budgetQuantity × unitPrice)
taxAmount      = roundCent(subtotalNet × taxRate / 100)
subtotalGross  = roundCent(subtotalNet + taxAmount)
```

Los totales suman importes de línea en céntimos.

No se redondea prematuramente `budgetQuantity`.

## 9. Partidas y capítulos

Una partida contiene:

- ID;
- descripción;
- capítulo opcional;
- quantity + unit + provenance;
- merma;
- precio unitario;
- fuente del precio;
- IVA override opcional;
- revisión.

Los capítulos contienen:

- ID;
- título;
- orden.

El core calcula totales por capítulo y un grupo `unassigned` para partidas sin capítulo. 7D decidirá su presentación visual.

## 10. Completitud

Los agregados exponen por separado:

- partidas sin precio;
- partidas con cantidad `unavailable`;
- partidas con cantidad parcial/incompleta;
- precios pendientes de revisión;
- importes netos desconocidos;
- IVA desconocido;
- bruto desconocido.

Si hay dos partidas conocidas y una desconocida, se puede devolver el subtotal conocido, pero:

`complete: false`

Nunca se suma la desconocida como 0.

## 11. API

Nuevo módulo:

`js/budget-core.js`

Namespace:

`FloorPlanBudget`

Funciones:

- `createBudget()`;
- `createChapter()`;
- `quantityFrom7A()`;
- `manualQuantity()`;
- `manualPrice()`;
- `createItem()`;
- `setManualPrice()`;
- `clearPrice()`;
- `markReviewed()`;
- `validateBudget()`;
- `validateItem()`;
- `calculateItem()`;
- `calculateBudget()`;
- `serializeBudget()`;
- `parseBudget()`.

No DOM, red ni almacenamiento implícito.

## 12. Persistencia

El contrato se puede serializar/restaurar como JSON independiente.

7B deliberadamente NO modifica:

- `FloorPlanProjectV1`;
- `FloorPlanBuildingV1`;
- schemas de proyecto/edificio;
- JSON/ZIP existente de Rubik.

La UI y la decisión de dónde almacenar/exportar presupuestos pertenecen a 7D.

## 13. QA dirigido

Nueva suite:

`tests/budget-core.test.cjs`

Cobertura local antes de publicar:

- documento separado y EUR;
- procedencia 7A;
- cantidad unavailable/null;
- cantidad manual;
- merma;
- neto/IVA/bruto;
- redondeo monetario;
- precio desconocido vs cero;
- procedencia manual obligatoria;
- rechazo de proveedores externos;
- revisión;
- cambio de precio invalida revisión;
- borrado de precio;
- IVA desconocido;
- IVA override;
- IVA 0 %;
- capítulos;
- totales parciales;
- cantidades parciales/unavailable;
- partidas sin capítulo;
- IDs duplicados;
- validaciones negativas;
- no mutación;
- JSON roundtrip;
- global de navegador;
- serialización/parseo;
- fechas de procedencia;
- integración real con 7A cuando la suite corre dentro del repositorio.

Resultado local previo a publicación:

`33 PASS · 0 FAIL · 1 SKIP`

El único SKIP local es la prueba que requiere el `quantity-core.js` real del repositorio; en CI debe ejecutarse y quedar verde.

## 14. No objetivos

7B NO implementa:

- `FloorPlanCostProvider`;
- BCCA;
- dataset DDC;
- precios históricos en ¥;
- red de proveedores;
- búsqueda de precios;
- Asset Lab comercial;
- CRM;
- UI de presupuesto;
- PDF;
- CSV/Excel;
- facturación;
- contabilidad;
- ERP;
- certificación profesional de mediciones.

## 15. Compatibilidad

No debe romper:

- Puntos 1–6;
- 7A;
- schemas de proyecto/edificio;
- importadores;
- JSON/ZIP;
- multiplanta;
- 2D/3D;
- Solar;
- PNG/vídeo;
- proyectos legacy.

Como el módulo no se carga aún en UI, el riesgo de runtime está deliberadamente limitado.

## 16. Handoff

### 7C

Debe formalizar `FloorPlanCostProvider` sin cambiar las reglas de cálculo de 7B.

Un proveedor futuro podrá proponer un precio y su provenance, pero el precio seguirá necesitando la semántica de revisión aprobada en 7B.

Primer candidato externo: `BCCA_ES`, solo después de verificar condiciones oficiales de reutilización.

### 7D

Debe consumir `FloorPlanBudget.calculateBudget()`.

No debe recrear fórmulas de merma, subtotal o IVA en la UI.

## 17. Criterio de cierre

7B podrá declararse cerrado cuando:

- `FloorPlanBudgetV1` esté documentado;
- `budget-core.js` esté integrado;
- la suite dirigida esté verde;
- la integración 7A real esté verde en CI;
- regresiones del repositorio estén verdes;
- no exista BCCA/CostProvider/UI adelantados;
- PR sea revisada y autorizada para merge.
