# ECO-01 — Medición del consumo y del coste del Render IA

**Fecha:** 10/11/2026.
**Base histórica de investigación:** `master@75615fd`. **Base vigente de integración (12/11/2026):** `master@7aced448f001d288de12a3bd1f150f32c8e022ed`, con catálogo v1.10 y #192 ya fusionados; reconciliación por merges normales, sin reescribir el historial de #190.
**Estado actual:** PR #190 Draft, **NO INTEGRADA**; corte propuesto de **cuatro archivos**: motor, pruebas, documentación y workflow específico `ECO-01 - render cost core gate`. El motor no está cargado en `index.html`. El merge no autoriza tarifas, facturación, recopilación de datos ni gasto de proveedores. **Exigir CI del HEAD final, incluido el test específico, antes de decidir integración.**
**Alcance:** un modelo de medición puro (`js/render-cost-core.js`) con pruebas, sin interfaz ni cambios en `api/render.js`.
**Garantías:** no se ha llamado a ningún proveedor, no se han leído credenciales y ninguna tarifa es real. Las de las pruebas son ficticias.

## 1. Qué existe hoy (inventario)

| Fuente | Qué hay | Dónde | Limitación |
|---|---|---|---|
| **A. Consumo medido** | Tokens que informa el proveedor: entrada, salida y total; texto e imagen de entrada si los detalla | `api/render.js` (`usageOf`). Se devuelve con la imagen y se registra en el evento `rubik-render` del log de la función. | **No hay almacenamiento persistente**: solo los logs de Vercel, con la retención del plan. No hay histórico. |
| **B. Coste estimado** | Consumo por tarifa, solo si existen `RUBIK_RENDER_PRICE_INPUT_TEXT`, `_INPUT_IMAGE` y `_OUTPUT` (USD por millón de tokens) | `api/render.js` (`costOf`, #182) | La tarifa **no está ligada a un modelo ni a unas fechas**. No indica si incluye impuestos. Hay redondeo en coma flotante. Si la entrada no viene desglosada, se tarifica como imagen. **Hoy no hay tarifas configuradas: `cost: null`.** |
| **C. Facturación real** | Ninguna | Factura del proveedor, fuera de Rubik | Rubik no la conoce |
| **D. Aceptación de una imagen** | **No existe** | — | Rubik no registra ninguna decisión. Descargar o terminar la generación **no** es aceptar. |
| **E. Ausente** | **Fecha e identificador dentro del JSON del evento.** Comprobado con el registro real de Production del 09/11: la fecha (`2026-11-09T13:55:31.050Z`) y el identificador de petición (`request=…`) los pone el registro de Vercel, **fuera** del JSON. Faltan también: intentos rechazados antes de llamar al proveedor (código o límites, que no cuestan); fecha de vigencia de la tarifa; base de impuestos | — | Ver §4 |

**Dato conocido de D1:** una generación con estado `ok` y **1.996 tokens** (95 de texto de entrada, 1.300 de imagen de entrada y 601 de salida), con el modelo `gpt-image-2.5-sunburst`. **Coste: desconocido** (`cost: null`, sin tarifas). No se inventa.

## 2. Contrato temporal (propuesta verificable, sin cambiar `api/render.js`)
- **Hoy:**
  - `parseLog()` toma la fecha (`loggedAt`) y el identificador de petición (`requestId`) **del registro de la plataforma**: la cabecera `### <ISO> POST /api/render` y la línea `request=…` de la exportación de Vercel, o la fecha al principio de una línea;
  - el origen queda marcado: `dateSource: 'platform-log'`;
  - si la exportación no los trae, la fecha es **desconocida** y no se elige tarifa.
- **Más adelante (necesita autorización):** que `api/render.js` escriba `at` (ISO) e `id` (aleatorio) **dentro** del evento y devuelva el `id` al navegador. Si el evento trae `at`, tiene prioridad (`dateSource: 'event'`). El `id` permitiría emparejar las aceptaciones. **No se ha modificado `api/render.js`.**

## 3. Qué añade `js/render-cost-core.js`
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
- **Números exactos:**
  - los importes y las sumas de tokens se calculan en BigInt y solo se convierten a `Number` si caben con exactitud;
  - si no caben, el resultado es `amount-out-of-range` o `out-of-range`, nunca un valor redondeado en silencio.
- **`summarize` (lote):**
  - cuenta llamadas registradas, correctas y fallidas por estado, y suma tokens solo si todos los intentos los informan;
  - solo da el total estimado si **todos** los intentos tienen estimación en la misma moneda y con la misma base de impuestos; si no, `null` y la lista de motivos (**nunca 0**);
  - calcula coste por imagen generada y por imagen aceptada, sin dividir entre cero;
  - **aceptación:** solo cuenta decisiones explícitas (`accepted` o `rejected`) emparejadas por `id`. Distingue cuatro estados:
    - **`unknown`**: no hay registro de decisiones, que es lo que pasa hoy;
    - **`partial`**: hay un registro, pero no se ha declarado completo. Solo da un mínimo (`acceptedAtLeast`). **Una lista vacía no equivale a 0 aceptadas;**
    - **`complete`**: registro declarado completo, con recuentos exactos, incluido un 0 real, y las generaciones sin decisión;
    - **`unmatchable`**: los eventos no tienen `id`, como los reales de hoy.
  - **período:** solo existe si quien llama declara la ventana exportada (`coverage: {from, to, complete}`) y todos los eventos tienen fecha y caen dentro de ella.
- **`reconcile`:** compara la estimación con la factura solo si ambas son conocidas, en la misma moneda, con la misma base de impuestos, la factura es real, el período es **exactamente el mismo** y la exportación de llamadas está declarada **completa** para ese período. En cualquier otro caso devuelve el motivo y no calcula diferencia: `period-differs`, `billing-period-unknown`, `estimate-period-unknown` o `coverage-incomplete`.
- **`formatMicros`:** solo para mostrar, con redondeo explícito.
- **`parseLog`:** entiende el formato real (registro de varias líneas de Vercel) y el de una línea con la fecha al principio. Ignora el resto y nunca arrastra la fecha de un registro al siguiente.

## 4. Pruebas (`tests/render-cost-core.test.cjs`, datos ficticios)

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
| **Formato real de master** (registro de Vercel anonimizado): sin fecha ni `id` en el JSON; fecha y petición tomadas de la plataforma; sin registro, la fecha es desconocida | ✅ |
| Período: otro mes facturado, período desconocido, exportación parcial, evento fuera de la ventana o sin fecha | ✅ |
| Aceptación desconocida, parcial (lista vacía ≠ 0), completa con 0 real, sin poder emparejar | ✅ |
| Importes y sumas fuera de rango seguro | ✅ |

## 4 bis. Gate de integración controlada (12/11/2026)

- **CI específica añadida:** `.github/workflows/eco01-core.yml` ejecuta explícitamente `node --test tests/render-cost-core.test.cjs` con Node 22.13.0, tanto en la PR como después de integrarse en `master`, cuando cambian sus archivos. **Los workflows generales anteriores no incluían este test en su lista Project-First.**
- **Alcance auditable:** `js/render-cost-core.js` y `tests/render-cost-core.test.cjs` mantienen su SHA de blob del corte original (`cf452893` y `2bb523b2`). Ninguna llamada nueva al proveedor, dependencia externa, configuración de Vercel, tarifa real, persistencia, UI o activación comercial.
- **Semántica:** no convertir consumos incompletos ni facturación/aceptaciones desconocidas en importes cero; no declarar costes reales sin tarifa validada y datos comparables.
- **Estado:** propuesta Draft. Para un merge de #190 hacen falta CI específica y general en verde **sobre el HEAD final**, revisión del diff y autorización humana independiente del despliegue automático de `master`. La PR #192 ya está integrada como base documental. No se activa ningún servicio de las olas 3–5.

## 5. Para que ECO-01 dé cifras reales (decisiones y trabajo posterior)
1. **Tarifa verificada:** el propietario la registra a partir de la página de precios o de una factura del proveedor, para `gpt-image-2.5-sunburst`, con su vigencia y su base de impuestos. Claude no la inventa.
2. **Identificador de generación:**
   - añadir un `id` aleatorio al evento `rubik-render` y a la respuesta de `/api/render`. Es un cambio pequeño en Render IA, **pendiente de autorización**;
   - sin él, no hay forma de emparejar aceptaciones.
3. **Evento de aceptación explícito:** «Usar esta imagen» o «Descartar» en el diálogo del Render IA, registrado sin datos del cliente. Hoy no existe y **no se deduce de la descarga**.
4. **Persistencia:** sin un almacén, no hay histórico. Los logs de Vercel son temporales. Requiere decisión (almacén y retención); queda fuera de ECO-01 mínimo.
5. **Cuotas globales:** **no** forman parte de ECO-01. Los límites por instancia de #180 son un freno, no un presupuesto garantizado (GOV-06a y S4).
