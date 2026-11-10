# ECO-01 — Medición del consumo y del coste del Render IA

**Fecha:** 10/11/2026.
**Base:** `master@75615fd`.
**Alcance:** un modelo de medición puro (`js/render-cost-core.js`) con pruebas, sin interfaz ni cambios en `api/render.js`.
**Garantías:** no se ha llamado a ningún proveedor, no se han leído credenciales y ninguna tarifa es real. Las de las pruebas son ficticias.

## 1. Qué existe hoy (inventario)

| Fuente | Qué hay | Dónde | Limitación |
|---|---|---|---|
| **A. Consumo medido** | Tokens que informa el proveedor: entrada, salida y total; texto e imagen de entrada si los detalla | `api/render.js` (`usageOf`). Se devuelve con la imagen y se registra en el evento `rubik-render` del log de la función. | **No hay almacenamiento persistente**: solo los logs de Vercel, con la retención del plan. No hay histórico. |
| **B. Coste estimado** | Consumo por tarifa, solo si existen `RUBIK_RENDER_PRICE_INPUT_TEXT`, `_INPUT_IMAGE` y `_OUTPUT` (USD por millón de tokens) | `api/render.js` (`costOf`, #182) | La tarifa **no está ligada a un modelo ni a unas fechas**. No indica si incluye impuestos. Hay redondeo en coma flotante. Si la entrada no viene desglosada, se tarifica como imagen. **Hoy no hay tarifas configuradas: `cost: null`.** |
| **C. Facturación real** | Ninguna | Factura del proveedor, fuera de Rubik | Rubik no la conoce |
| **D. Aceptación de una imagen** | **No existe** | — | Rubik no registra ninguna decisión. Descargar o terminar la generación **no** es aceptar. |
| **E. Ausente** | Identificador de cada generación en el evento; intentos rechazados antes de llamar al proveedor (código o límites, que no cuestan); fecha de vigencia de la tarifa; base de impuestos | — | Ver §4 |

**Dato conocido de D1:** una generación con estado `ok` y **1.996 tokens** (95 de texto de entrada, 1.300 de imagen de entrada y 601 de salida), con el modelo `gpt-image-2.5-sunburst`. **Coste: desconocido** (`cost: null`, sin tarifas). No se inventa.

## 2. Qué añade `js/render-cost-core.js`
Lee los mismos eventos `rubik-render`. No sustituye la estimación en vivo de #182.

- **Tarifa verificable** (`validateTariff`):
  - campos: modelo exacto, moneda (USD o EUR), vigencia (`validFrom` y `validTo`), `taxIncluded` y fuente (`provider-pricing-page`, `invoice` o `contract`, con referencia y fecha de comprobación);
  - los precios van por millón de tokens, como **cadenas decimales**: nunca floats ni exponentes;
  - **no hay precios en el código ni se deducen del nombre de un modelo.**
- **`tariffFor`:**
  - busca la tarifa del modelo exacto que esté vigente en la fecha del evento;
  - si no la encuentra, devuelve el motivo: `no-tariff-for-model`, `tariff-invalid`, `no-tariff-for-date`, `date-unknown` o `ambiguous-tariff`.
- **`estimateAttempt`:**
  - el dinero se calcula en **micro-unidades enteras** (BigInt) y se redondea hacia arriba en la mitad (*half-up*) a la micro-unidad;
  - si faltan categorías, **no se reparte la entrada por suposición**: el coste queda desconocido;
  - si hay uso informado, una llamada fallida también se estima.
- **`summarize` (lote):**
  - cuenta llamadas registradas, correctas y fallidas por estado, y suma tokens solo si todos los intentos los informan;
  - solo da el total estimado si **todos** los intentos tienen estimación en la misma moneda y con la misma base de impuestos; si no, `null` y la lista de motivos (**nunca 0**);
  - calcula coste por imagen generada y por imagen aceptada, sin dividir entre cero;
  - **aceptación:** solo cuenta decisiones explícitas (`accepted` o `rejected`) emparejadas por `id` de generación. Si no hay eventos o las generaciones no tienen `id`, la aceptación es **desconocida** y se dice por qué.
- **`reconcile`:** compara la estimación con la factura solo si ambas son conocidas, en la misma moneda, con la misma base de impuestos y si la factura procede de una factura real.
- **`formatMicros`:** solo para mostrar, con redondeo explícito.
- **`parseLog`:** extrae las líneas `{"event":"rubik-render"…}` de un log exportado e ignora el resto.

## 3. Pruebas (`tests/render-cost-core.test.cjs`, datos ficticios)

| Caso | Cubierto |
|---|---|
| Consumo conocido con tarifa válida; redondeo; formato | ✅ |
| D1: 1.996 tokens sin tarifa → coste desconocido, no 0; generada ≠ aceptada | ✅ |
| Tarifa ausente, inválida, de otro modelo con nombre parecido, fuera de fecha, fecha desconocida o ambigua | ✅ |
| Categorías de tokens incompletas, intento fallido, uso ausente, valores negativos | ✅ |
| Lote con varias generaciones; total parcial no informado; monedas mezcladas; división entre cero | ✅ |
| Aceptación explícita, rechazo, «descargada» no cuenta, generaciones sin `id` | ✅ |
| Estimación frente a factura: comparable, otra moneda, otra base de impuestos, estimación presentada como factura | ✅ |
| Log con líneas ajenas o rotas | ✅ |

## 4. Para que ECO-01 dé cifras reales (decisiones y trabajo posterior)
1. **Tarifa verificada:** el propietario la registra a partir de la página de precios o de una factura del proveedor, para `gpt-image-2.5-sunburst`, con su vigencia y su base de impuestos. Claude no la inventa.
2. **Identificador de generación:**
   - añadir un `id` aleatorio al evento `rubik-render` y a la respuesta de `/api/render`. Es un cambio pequeño en Render IA, **pendiente de autorización**;
   - sin él, no hay forma de emparejar aceptaciones.
3. **Evento de aceptación explícito:** «Usar esta imagen» o «Descartar» en el diálogo del Render IA, registrado sin datos del cliente. Hoy no existe y **no se deduce de la descarga**.
4. **Persistencia:** sin un almacén, no hay histórico. Los logs de Vercel son temporales. Requiere decisión (almacén y retención); queda fuera de ECO-01 mínimo.
5. **Cuotas globales:** **no** forman parte de ECO-01. Los límites por instancia de #180 son un freno, no un presupuesto garantizado (GOV-06a y S4).
