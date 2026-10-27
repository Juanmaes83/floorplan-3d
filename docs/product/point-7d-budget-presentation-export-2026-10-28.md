# Punto 7D — Presentación y exportación de presupuesto

**Fecha:** 28-10-2026  
**Estado:** **CERRADO** por PR #120.  
**Base de implementación:** `master@561ca43145977a7003fd23b79f4af123db6ba445` (7C-E fusionado por PR #118).  
**Merge:** squash `69a9b20a0ceab6f379150e2c7fb0b64f7136b4f5`.

## Objetivo

Cerrar el Punto 7 con una capa de presentación/exportación que consuma el presupuesto ya calculado por `FloorPlanBudget` sin volver a medir geometría ni reimplementar fórmulas de merma, subtotal o IVA.

La autoridad monetaria sigue siendo:

```text
FloorPlanBudgetV1
      ↓
FloorPlanBudget.calculateBudget()
      ↓
FloorPlanBudgetPresentation
      ↓
reporte estructurado / CSV
```

`FloorPlanBudgetPresentation` no modifica presupuestos, no consulta proveedores, no selecciona precios y no convierte unidades o moneda.

## API

Runtime: `js/budget-presentation.js`.

UMD puro, utilizable en Node y navegador, sin DOM, storage ni red.

API V1:

- `FloorPlanBudgetPresentation.buildReport(budget)`;
- `FloorPlanBudgetPresentation.toCsv(budget, options)`;
- `FloorPlanBudgetPresentation.serializeReport(budget)`.

`buildReport()` llama a `FloorPlanBudget.calculateBudget()` y presenta sus resultados. No calcula una partida desde cantidad × precio ni vuelve a calcular IVA.

## Presentación estructurada

El reporte conserva:

- identidad y `subject` del presupuesto;
- moneda EUR;
- IVA global declarado o `null`;
- líneas calculadas completas;
- capítulos en orden;
- partidas sin capítulo;
- totales canónicos de `calculateBudget()`;
- procedencia del precio;
- `priceReference` cuando existe;
- estado de revisión;
- estados de cantidad y completitud;
- advertencias explícitas para datos pendientes.

### Agrupación por contexto

Cuando una cantidad de `FloorPlanQuantities` conserva un `ref` demostrable con `scope` e `id`, 7D puede presentar las líneas agrupadas por:

- `room` — estancia;
- `level` — planta;
- `home` — vivienda.

Esta agrupación es únicamente de presentación. No reasigna geometría y no inventa contexto para cantidades manuales o referencias incompletas.

Los subtotales de estas agrupaciones se agregan exclusivamente desde importes de línea que ya devolvió `calculateBudget()`; nunca se reconstruye la fórmula monetaria desde los inputs originales.

## Datos parciales y certeza

7D conserva las reglas de 7A–7C:

- desconocido no es cero;
- precio ausente queda vacío/`null`, nunca `0`;
- precio explícito `0` sigue siendo un cero conocido;
- cantidad `unavailable` no se convierte en cero;
- cantidad conocida pero incompleta conserva su subtotal conocido y su marca de incompletitud;
- IVA desconocido no se presenta como 0 %;
- precio de proveedor no equivale a revisión profesional;
- una referencia externa puede coexistir con un precio manual activo.

El reporte incluye advertencias normalizadas para:

- `unpriced-items`;
- `unavailable-quantities`;
- `incomplete-quantities`;
- `unreviewed-prices`;
- `tax-incomplete`.

## CSV

`toCsv()` exporta una fila por partida con:

- presupuesto y `subject`;
- capítulo e item;
- descripción;
- contexto estancia/planta/vivienda cuando está demostrado;
- cantidad, unidad, estado y completitud;
- merma y cantidad presupuestada calculada;
- precio unitario EUR;
- procedencia activa del precio;
- referencia de provider y estado de licencia cuando existe;
- revisión;
- IVA efectivo calculado;
- neto, impuesto y bruto calculados;
- flags de completitud.

Características:

- CSV determinista;
- escaping compatible con campos con coma, comillas o saltos de línea;
- delimitador `,`, `;` o tabulador;
- LF o CRLF;
- BOM UTF-8 opcional;
- `null` se exporta vacío;
- cero explícito se exporta como `0`.

## Excel y PDF

El programa aprobado decía `CSV/Excel/PDF cuando proceda`.

Este corte incorpora CSV como formato tabular interoperable y un reporte JSON estructurado como contrato de presentación. No introduce una dependencia XLSX/PDF ni un motor documental nuevo únicamente para marcar formatos como completados.

Excel puede consumir el CSV directamente y un futuro exportador XLSX/PDF debe consumir `buildReport()`; no debe volver a calcular el presupuesto.

Por tanto, en 7D V1:

- CSV: soportado;
- JSON de presentación: soportado;
- XLSX nativo: no incorporado;
- PDF nativo: no incorporado.

La ausencia de XLSX/PDF nativos no bloquea el cierre de V1 porque no existe infraestructura aprobada que justifique añadir bibliotecas pesadas o duplicar la capa de presentación.

## CRM

No hay acoplamiento directo a CRM. Un futuro adapter CRM debe consumir el reporte estructurado o un contrato dedicado.

## Fuera de alcance

- UI completa de edición del presupuesto;
- facturación/contabilidad;
- ERP;
- conversión de moneda o unidades;
- selección automática de provider;
- activación de BCCA real;
- XLSX/PDF nativo sin decisión específica;
- cambios en geometría;
- Punto 8 Exterior;
- Punto 9 Instalaciones.

## QA

Suite dedicada: `tests/budget-presentation.test.cjs`.

Cubre:

- equivalencia con totales canónicos de `calculateBudget()`;
- capítulos y partidas sin capítulo;
- agrupación room/level/home;
- cantidades manuales sin falsa asignación;
- estados parciales/desconocidos;
- cero explícito;
- procedencia manual y provider reference;
- CSV determinista y escaping;
- delimitadores/BOM/newlines;
- `null` frente a `0`;
- serialización de reporte;
- no mutación;
- rechazo de presupuestos inválidos por la autoridad Budget;
- export global en navegador sin DOM.

## Evidencia de cierre

HEAD exacto validado antes del merge: `91fd89e8fbd26bd7f4ab79bdfd0b78e7742ad4d7`.

Resultados:

- suite específica 7D incluida en la regresión general no-browser: **SUCCESS**;
- Guided experience: **SUCCESS**;
- Point 6 solar and compatibility: **SUCCESS**;
- Multiformat guided import: **SUCCESS**;
- Vercel: **SUCCESS**;
- sin hilos de revisión pendientes;
- PR mergeable antes del merge.

PR #120 se fusionó con squash `69a9b20a0ceab6f379150e2c7fb0b64f7136b4f5`.

El squash incluye `[skip ci]` exclusivamente para evitar duplicar en el `push` a `master` las mismas GitHub Actions que ya habían finalizado con éxito sobre el HEAD exacto del candidato.

## Cierre

Con 7D fusionado, **Punto 7 queda CERRADO**. El trabajo funcional activo pasa a **Punto 8A / Exterior V1**.
