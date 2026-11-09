# RENDER AI D1 · PR-4 — IMG-02: consumo y coste por render

**Estado:** candidata en PR borrador. Está **apilada sobre la PR-1** (acceso y límites), porque ambas tocan `api/render.js`. No está fusionada ni promocionada. No se ha hecho ninguna llamada facturable.

## Qué hace

| Pieza | Comportamiento |
|---|---|
| Consumo | El servidor lee el bloque `usage` que devuelve el proveedor, solo de una lista cerrada de campos enteros. Lo devuelve con la imagen: tokens de entrada, de salida, totales, de texto y de imagen. Los campos desconocidos o mal formados se ignoran. |
| Coste | **Solo se estima si el propietario configura la tarifa** en Vercel, en USD por millón de tokens: `RUBIK_RENDER_PRICE_INPUT_TEXT`, `RUBIK_RENDER_PRICE_INPUT_IMAGE` y `RUBIK_RENDER_PRICE_OUTPUT`. **No hay ningún precio escrito en el código**: los precios cambian y la cifra que vale es la factura del proveedor. Si la entrada llega sin desglose, se valora a precio de imagen, que es el más caro, para no infraestimar nunca. |
| Registro | Una línea JSON por cada llamada al proveedor en los logs de la función de Vercel. Incluye modelo, estilo, acabados, estado, duración, consumo y coste estimado. **Nunca** incluye la imagen, el código de acceso, la clave ni la IP del cliente. También se registran los fallos del proveedor, con su código de estado pero sin su mensaje. Los rechazos previos (código erróneo, estilo o imagen no válidos) no son llamadas y no se registran. |
| Interfaz | Debajo del render aparece «Consumo de esta imagen: N tokens», y «· coste estimado X US$ (según la tarifa configurada)» solo si hay tarifa. Si el proveedor no informa del consumo, lo dice; no se inventa. |

## Cómo verlo (propietario)

- **Coste de cada imagen:** en el diálogo del Render IA, tras generar.
- **Histórico:** Vercel → proyecto → Logs, filtrando por `rubik-render`.
- **Tope real:** el presupuesto mensual de la cuenta del proveedor. La tarifa de Vercel solo sirve para estimar.

## Pruebas (proveedor simulado)

| Suite | Resultado |
|---|---|
| `ai-render-api` | 13/13: 5 base, 5 de PR-1 y 3 nuevas de IMG-02 (consumo, coste y registro sin secretos) |
| `ai-render.browser` | Línea de consumo con coste y sin consumo informado |
| Todas las pruebas puras | 934 PASS · 0 FAIL · 2 omitidas |
| `share-link` y `ft3d-8-delivery` en el navegador | Sin cambios, en verde |
