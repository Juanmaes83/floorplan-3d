# FloorPlanBudgetV1

**Estado:** 1.0.0 cerrado en Punto 7B; 1.1.0 candidato de Punto 7C-C
**Schema:** `rubik-sota.floorplan-budget`  
**schemaVersion:** `1.0.0` legacy y `1.1.0` actual
**Moneda V1:** `EUR`

## Propósito

`FloorPlanBudgetV1` es un documento separado de `FloorPlanProjectV1` y `FloorPlanBuildingV1`.

Contiene decisiones comerciales/editables —partidas, merma, precios, IVA, revisión y procedencia— sin contaminar el contrato geométrico. La geometría y las cantidades siguen perteneciendo a los contratos de proyecto/edificio y al Punto 7A (`FloorPlanQuantities`).

El presupuesto puede serializarse como JSON independiente. Punto 7B no decide todavía la UI, almacenamiento automático, exportación PDF/Excel ni proveedor externo de precios.

## Principios

1. 7B **no mide geometría**. Consume cantidades de 7A o una cantidad manual explícitamente declarada.
2. Un dato desconocido usa `null`; nunca se convierte silenciosamente en `0`.
3. La cantidad geométrica y la cantidad presupuestada son conceptos distintos.
4. La merma es explícita y auditable.
5. Un precio conocido exige procedencia.
6. La versión 1.0.0 solo acepta procedencia de precio `manual`; 1.1.0 admite además `provider-reference`.
7. Cambiar un precio manual invalida la revisión anterior y vuelve a `unreviewed`.
8. IVA desconocido es `null`; no equivale a 0 %.
9. Cero explícito (`0`) sigue siendo un valor conocido, distinto de `null`.
10. No se redondean cantidades para presentación dentro del core; los importes monetarios de línea sí se redondean a céntimos.

## Documento raíz

```json
{
  "schema": "rubik-sota.floorplan-budget",
  "schemaVersion": "1.1.0",
  "id": "bud_example",
  "subject": {"type": "project", "id": "prj_example"},
  "title": "Presupuesto reforma",
  "currency": "EUR",
  "taxRatePercent": 21,
  "chapters": [],
  "items": []
}
```

### `subject`

Vincula el presupuesto a la entidad que describe:

- `project` → un `FloorPlanProjectV1`;
- `building` → un `FloorPlanBuildingV1`.

No embebe ni copia el proyecto.

### `taxRatePercent`

- número entre 0 y 100 → IVA global conocido;
- `null` → IVA global todavía no definido.

Una partida puede incluir `taxRatePercent` propio y, en ese caso, prevalece sobre el global.

## Capítulos

```json
{
  "id": "ch_finishes",
  "title": "Acabados",
  "order": 10
}
```

Los capítulos sirven para agrupar partidas y preparar 7D. No alteran el cálculo de una partida.

## Cantidad de partida

```json
{
  "value": 12.84,
  "unit": "m2",
  "status": "measured",
  "complete": true,
  "source": {
    "type": "quantity-engine",
    "engine": "FloorPlanQuantities",
    "ref": {
      "scope": "room",
      "id": "rom_bedroom",
      "metric": "floor.areaM2"
    }
  }
}
```

Unidades admitidas en V1:

- `m2`;
- `m`;
- `unit`.

Estados reutilizados de 7A:

- `measured`;
- `estimated`;
- `unavailable`.

Si el estado es `unavailable`, `value` debe ser `null` y `complete` debe ser `false`.

### Cantidad manual

También se permite una cantidad manual cuando no procede de 7A:

```json
{
  "value": 3,
  "unit": "unit",
  "status": "estimated",
  "complete": true,
  "source": {
    "type": "manual",
    "label": "Medición profesional"
  }
}
```

La fuente manual no debe presentarse como cálculo automático de Rubik.

## Partida

```json
{
  "id": "itm_floor_bedroom",
  "chapterId": "ch_finishes",
  "description": "Pavimento dormitorio",
  "quantity": {
    "value": 12.84,
    "unit": "m2",
    "status": "measured",
    "complete": true,
    "source": {
      "type": "quantity-engine",
      "engine": "FloorPlanQuantities",
      "ref": {"scope": "room", "id": "rom_bedroom", "metric": "floor.areaM2"}
    }
  },
  "wastePercent": 7,
  "unitPrice": 31,
  "priceSource": {
    "type": "manual",
    "label": "Precio profesional",
    "asOf": "2026-10-27"
  },
  "priceReference": null,
  "review": {
    "status": "unreviewed",
    "reviewedAt": null
  }
}
```

`chapterId` puede ser `null`. 7D decidirá cómo presentar las partidas no asignadas.

## Merma

La cantidad presupuestada derivada es:

```text
budgetQuantity = quantity.value × (1 + wastePercent / 100)
```

La cantidad geométrica original nunca se sobrescribe.

Ejemplo:

```text
12.84 m² con 7 % → 13.7388 m² presupuestados
```

El core conserva esa precisión. No redondea a `13.74` antes de calcular el importe porque todavía no existe una regla profesional aprobada de redondeo de mediciones.

## Precio unitario y procedencia

### Precio conocido

`unitPrice` es un número no negativo expresado en la moneda del presupuesto.

La procedencia manual conserva exactamente la forma de 7B:

```json
{
  "type": "manual",
  "label": "Tarifa del estudio",
  "asOf": "2026-10-27"
}
```

`asOf` puede ser `null` cuando la fecha no está registrada.

### Precio desconocido

```json
{
  "unitPrice": null,
  "priceSource": null,
  "review": {"status": "unreviewed", "reviewedAt": null}
}
```

Un precio desconocido no produce subtotal y no se interpreta como 0 €.

### Precio 0 €

`unitPrice: 0` es válido cuando es una decisión explícita. Como cualquier precio conocido, requiere `priceSource`.

## Revisión

Estados:

- `unreviewed`;
- `reviewed`.

Un precio revisado exige `reviewedAt` con fecha/hora ISO y offset.

```json
{
  "status": "reviewed",
  "reviewedAt": "2026-10-27T17:00:00+01:00",
  "note": "Revisado por profesional"
}
```

Cambiar el precio mediante el flujo manual reinicia la revisión a `unreviewed`.

`review` describe exclusivamente la revisión profesional del precio **activo**. Un CostQuote, aunque tenga procedencia completa, nunca establece `reviewed`. Añadir una mera referencia sin modificar el precio activo conserva la revisión existente.

El contrato no guarda identidad personal del revisor en 7B.

## IVA

La tasa efectiva de una partida es:

1. `item.taxRatePercent`, si existe;
2. en caso contrario `budget.taxRatePercent`.

Si ninguna existe, el neto puede calcularse pero IVA y bruto permanecen `null`.

`0` significa IVA 0 % explícito. `null` significa desconocido/no configurado.

## Cálculos monetarios

Para cada partida:

```text
budgetQuantity = quantity × (1 + merma / 100)
subtotalNet    = roundCent(budgetQuantity × unitPrice)
taxAmount      = roundCent(subtotalNet × IVA / 100)
subtotalGross  = roundCent(subtotalNet + taxAmount)
```

Los totales suman importes de línea ya redondeados a céntimos.

Si una partida no tiene cantidad o precio, no se suma como cero. El agregado devuelve el subtotal de partidas conocidas junto con `complete: false` y `missingItemIds`.

## Totales y completitud

`FloorPlanBudget.calculateBudget()` deriva:

- neto;
- IVA;
- bruto;
- partidas sin precio;
- partidas con cantidad no disponible;
- partidas con cantidad parcial;
- precios pendientes de revisión;
- totales por capítulo;
- partidas sin capítulo.

Un subtotal parcial puede existir, pero siempre queda marcado como incompleto.

## API de referencia

Módulo:

`js/budget-core.js`

Namespace:

`FloorPlanBudget`

Operaciones principales:

```js
FloorPlanBudget.createBudget(...)
FloorPlanBudget.createChapter(...)
FloorPlanBudget.quantityFrom7A(...)
FloorPlanBudget.manualQuantity(...)
FloorPlanBudget.manualPrice(...)
FloorPlanBudget.createItem(...)
FloorPlanBudget.setManualPrice(...)
FloorPlanBudget.clearPrice(...)
FloorPlanBudget.markReviewed(...)
FloorPlanBudget.validateBudget(...)
FloorPlanBudget.calculateItem(...)
FloorPlanBudget.calculateBudget(...)
FloorPlanBudget.serializeBudget(...)
FloorPlanBudget.parseBudget(...)
FloorPlanBudget.upgradeBudget(...)
FloorPlanBudgetCostBridge.setPriceReferenceFromQuote(...)
FloorPlanBudgetCostBridge.setPriceFromQuote(...)
FloorPlanBudgetCostBridge.clearPriceReference(...)
```

Las operaciones de cálculo/revisión son no mutantes.

## Versiones y evolución explícita de 7C-C

`FloorPlanBudgetV1` conserva nombre, `schema: rubik-sota.floorplan-budget` y EUR. `VERSION` actual es `1.1.0`; `SUPPORTED_VERSIONS` incluye `1.0.0` y `1.1.0`. `createBudget()` y `createItem()` crean 1.1.0, con `priceReference: null` en cada partida. `parseBudget()` y `validateBudget()` aceptan 1.0.0 válido y conservan exactamente su versión. `serializeBudget()` tampoco migra por sí solo.

Un documento 1.0.0 sigue siendo **manual-only**. No admite `priceReference`, ni siquiera `null`, ni `provider-reference`. `upgradeBudget(budget)` es la única migración explícita: clona el documento, conserva ID, sujeto, título, capítulos, cantidades, merma, precios manuales, IVA y review, y añade `priceReference: null` por partida. Para una entrada 1.1.0 devuelve un clon equivalente. Las fórmulas y resultados monetarios permanecen iguales.

En 1.1.0, cada partida separa cuatro conceptos:

| Campo | Significado |
|---|---|
| `unitPrice` | Precio activo; único valor usado por el cálculo monetario. `null` es desconocido; `0` es conocido. |
| `priceSource` | Procedencia pequeña del precio activo: `manual` o `{type:'provider-reference', providerId, itemId}`. |
| `priceReference` | `null` o snapshot completo y normalizado de un CostQuote externo con `priceKind:'reference'`. Puede existir con precio manual activo o sin precio activo. |
| `review` | Revisión profesional independiente del precio activo: `unreviewed` o `reviewed`. |

Un `priceReference` conserva `providerId`, `itemId`, `code`, descripción propia, unidad, precio, moneda y toda la procedencia normalizada: `label`, `asOf`, `retrievedAt`, `edition`, `region`, `sourceUrl`, `attribution`, `licenseStatus`, `licenseName`, `licenseUrl`. Los campos desconocidos siguen `null`; `unknown` y `restricted` se conservan sin inferir permiso comercial. El gate legal/técnico de BCCA pertenece a 7C-E.

Si `priceSource.type` es `provider-reference`, `priceReference` debe existir y coincidir exactamente en `providerId`, `itemId` y `unitPrice`. Su `unit` debe coincidir exactamente con `quantity.unit` y su `currency` con el EUR del presupuesto. El core verifica estas relaciones además del JSON Schema; no convierte unidades ni moneda. La descripción del CostQuote no sustituye la descripción de la partida.

El bridge recibe un CostQuote elegido explícitamente, validado por `FloorPlanCostProvider.validateQuote()`. No consulta providers. `setPriceReferenceFromQuote()` exige 1.1.0 y `priceKind:'reference'`; adjunta el snapshot sin cambiar precio activo, fuente ni review. `setPriceFromQuote()` aplica un quote manual como precio manual incluso en 1.0.0, sin migración silenciosa; aplica un quote reference solo en 1.1.0, establece el precio activo y `provider-reference`, guarda el snapshot y reinicia review. `clearPriceReference()` rechaza el borrado mientras una fuente `provider-reference` activa dependa de ella.

`setManualPrice()` puede sustituir un precio externo por 31 € conservando, por ejemplo, la referencia original de 28,43 €, e invalida la revisión previa. `clearPrice()` borra el precio activo y review, pero conserva esa referencia en 1.1.0. La referencia sola no convierte una partida en priced ni reviewed. Todas estas operaciones devuelven clones; `priceReference` representa una sola referencia vigente/conservada y no un historial.

## Persistencia

El contrato puede guardarse/restaurarse como JSON independiente mediante `serializeBudget` / `parseBudget`.

7B no modifica:

- `FloorPlanProjectV1`;
- `FloorPlanBuildingV1`;
- sus schemas;
- JSON/ZIP geométrico existente.

La integración de almacenamiento, UI y exportación pertenece a cortes posteriores.

## No objetivos de 7B

No incluye:

- `FloorPlanCostProvider`;
- BCCA;
- dataset DDC;
- precios chinos históricos;
- consulta de precios por red;
- catálogo de proveedores;
- Asset Lab comercial;
- CRM;
- PDF/CSV/Excel;
- UI de presupuesto;
- certificación de mediciones;
- facturación/contabilidad/ERP.

## Handoff

### 7C

Puede introducir una frontera `FloorPlanCostProvider` y transformar una respuesta externa en un `priceSource` futuro sin cambiar la semántica de cantidad, merma, subtotal ni revisión.

### 7D

Debe presentar este contrato y sus cálculos, sin volver a calcular geometría ni dinero con reglas paralelas.
