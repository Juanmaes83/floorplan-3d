# Punto 7C-C — Budget provider provenance y CostQuote bridge

**Fecha:** 27-10-2026
**Estado:** CERRADO por PR #116, squash `59ca05e1c47aa2a7d020bbb3e44fa49fa2bbf94e`
**Base exacta:** `master@f1b49f667d5aa6f5c74158cb8a339a81812eabc0`
**Siguiente corte:** 7C-D — parser FIEBDC-3/BC3.

## Objetivo y versiones

Conectar un CostQuote seleccionado explícitamente con un presupuesto sin confundir referencia de precio, precio activo y revisión profesional. `FloorPlanBudgetV1` mantiene nombre, schema y EUR. 1.0.0 sigue válido y manual-only, sin `priceReference` ni `provider-reference`. 1.1.0 es la versión creada por `createBudget()` y añade `priceReference: null` a cada partida nueva. Parse/serialize conservan la versión original; no hay migración silenciosa.

`upgradeBudget()` transforma explícitamente 1.0.0 en 1.1.0, sin mutar entrada: conserva identidad, sujeto, título, capítulos, cantidades, merma, precios manuales, IVA y review. `calculateBudget()` produce los mismos importes y estados anteriores. Un 1.1.0 se clona de forma idempotente.

## Modelo 1.1

- `unitPrice` es el único precio **activo** que usa el cálculo monetario. `null` es desconocido y `0` es conocido.
- `priceSource` identifica el origen del precio activo: forma manual histórica o `{type:'provider-reference', providerId, itemId}`.
- `priceReference` guarda `null` o un único snapshot completo de un CostQuote normalizado con `priceKind:'reference'`. Puede coexistir con un precio manual activo o con `unitPrice:null`. No es historial.
- `review` mantiene `unreviewed | reviewed` y pertenece al precio activo. Una referencia de provider no equivale a aprobación.

Si el precio activo procede de la referencia, providerId, itemId y unitPrice deben coincidir exactamente. El core comprueba también que la unidad de referencia sea exactamente la de `quantity` y la moneda sea EUR. El bridge rechaza otras unidades, por ejemplo `kg` frente a `m2`; no convierte ni estima ratios. No hay FX. La descripción del CostQuote se guarda en la referencia y no sustituye la descripción presupuestaria.

El snapshot conserva sin inventar valores `label`, `asOf`, `retrievedAt`, `edition`, `region`, `sourceUrl`, `attribution`, `licenseStatus`, `licenseName` y `licenseUrl`. Los estados de licencia `unknown` y `restricted` se preservan. Este corte no determina permisos de comercialización; el gate BCCA corresponde a 7C-E.

## Bridge explícito

`js/budget-cost-bridge.js` expone `FloorPlanBudgetCostBridge`:

1. `setPriceReferenceFromQuote(budget, itemId, quote)` exige 1.1.0 y quote `reference` validado por `FloorPlanCostProvider.validateQuote()`. Adjunta la referencia sin alterar precio activo, `priceSource` ni `review`.
2. `setPriceFromQuote(budget, itemId, quote)` aplica quote Manual como precio manual, incluso en 1.0.0 sin upgrade; nunca almacena el quote manual como `priceReference`. En 1.1.0 puede aplicar quote `reference`: guarda snapshot, precio activo y fuente `provider-reference`, y reinicia review a `unreviewed`.
3. `clearPriceReference(budget, itemId)` borra una referencia solo cuando el precio activo es manual o no existe. Rechaza borrar la referencia de la que depende un precio activo `provider-reference`.

Las tres operaciones validan presupuesto y quote cuando corresponde, localizan un ID existente, clonan, modifican una sola partida y revalidan. No consultan providers, registries ni red por cuenta propia. La entrada Budget y el quote permanecen intactos.

`Budget.setManualPrice()` y `Budget.clearPrice()` conservan `priceReference` en 1.1.0. Cambiar precio activo reinicia review; retirar solo el precio activo deja la partida `unpriced` aunque la referencia siga presente.

Caso comprobado: quote sintético de 28,43 €/m² → precio activo `provider-reference` → revisión profesional → override manual de 31 €/m². El resultado conserva la referencia original de 28,43, usa 31 en el presupuesto y marca `unreviewed` hasta una nueva llamada explícita a `markReviewed()`.

El `ManualCostProvider` real se integra por `Cost.getPrice(Manual, ...)` y genera quote `manual`. El bridge lo transforma en precio activo manual con etiqueta/fecha, sin aprobación automática. El provider `synthetic-reference` existe solo dentro de tests; no se publica catálogo en runtime.

## Verificación y límites

Pruebas dirigidas: Budget core 41 PASS, bridge 16 PASS, y cuatro suites combinadas 126 PASS, 0 FAIL, 0 SKIP. Regresión unitaria amplia: 452 PASS, 0 FAIL, 2 SKIP por integraciones Blender sin `BPY_PYTHON`. El contrato JSON Schema se comprobó con Draft 2020-12: 1.0.0 válido, rechazo de `priceReference` en 1.0.0, 1.1.0 manual válido, provider-reference válido y rechazo de provider-reference sin snapshot. Las restricciones cruzadas restantes se validan en runtime. Se comprueban roundtrip, upgrade, no mutación, IVA/merma/cálculos equivalentes, precio cero, procedencia/licencia completa, review independiente, unit exact match y ciclo de override.

Fuera de 7C-C: BCCA, BC3, FIEBDC-3, datos oficiales, HTTP, selección/ranking de providers, conversión de unidades/moneda, historial de precios, UI, exportaciones y cambios geométricos o solares.
