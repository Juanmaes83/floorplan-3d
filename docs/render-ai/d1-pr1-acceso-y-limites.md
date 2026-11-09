# RENDER AI D1 · PR-1 — Acceso y límites de gasto en el servidor

**Estado:** candidata en PR borrador. No está fusionada ni promocionada. No se ha hecho ninguna llamada facturable: todas las pruebas usan un proveedor simulado.

## Por qué va primero

- El propietario confirma que **el render funciona hoy en Production** y que la cuenta del proveedor tiene saldo.
- El gasto solo lo controla un código compartido, sin ningún límite en el servidor.
- Por eso, primero se cierran puertas, sin apagar lo que funciona (ver «Efecto al promocionar»).

## Qué cambia (solo `api/render.js` y los mensajes de `js/ai-render-ui.js`)

| Guarda | Comportamiento | Respuesta |
|---|---|---|
| Interruptor | Sin `RUBIK_RENDER_ENABLED=1` exacto, el endpoint no hace nada, aunque haya clave y código configurados. | 503 `disabled` |
| Origen | Una petición del navegador con `Origin` de otro sitio se rechaza antes de mirar el código. Sin `Origin`, decide el código como antes. | 403 `origin` |
| Freno a códigos erróneos | Tras `RUBIK_RENDER_MAX_TOKEN_FAILS` fallos por hora (20 por defecto) deja de comparar durante esa hora. | 429 `limit` |
| Límite por hora | `RUBIK_RENDER_MAX_PER_HOUR`, 10 por defecto. | 429 `limit` y `Retry-After` |
| Límite por día | `RUBIK_RENDER_MAX_PER_DAY`, 30 por defecto. Con 0 se cortan las llamadas al proveedor. | 429 `limit` y `Retry-After` |

Detalles de funcionamiento:
- Las peticiones no válidas (estilo, imagen o acabado) **no** consumen cupo.
- Solo se cuenta una llamada cuando de verdad va a salir hacia el proveedor.
- Los valores ausentes o no válidos de las variables vuelven a los valores por defecto, que son conservadores.

## Límites honestos (lo que esta PR **no** garantiza)

1. **Los contadores viven en la memoria de cada instancia de la función** de Vercel.
   - Con varias instancias en paralelo o tras un arranque en frío, el gasto real puede superar las cifras.
   - Son un freno, no un tope contable.
   - **El tope vinculante debe ser el presupuesto mensual del proyecto en la cuenta del proveedor.** Lo configura el propietario.
   - Un contador global exigiría almacenamiento persistente (KV o base de datos). Es una decisión del propietario, porque supone un servicio adicional.
2. **No hay límites por usuario**, porque RUBIK no tiene cuentas: el código de acceso es compartido. Los límites por usuario requieren identidad y son una decisión de producto.
3. **`api/share.js` usa el mismo `RUBIK_RENDER_TOKEN`** y no tiene estas guardas. No genera gasto en el proveedor de imágenes, así que queda fuera de esta PR y se anota como pendiente.
4. **El paso 0** (leer sin modificar las variables de Production en Vercel) fue denegado por la política de permisos de esta sesión. No se ha verificado si el render está configurado hoy en Production.

## Protección de datos

Sin cambios respecto a B2/B8:
- solo viajan la imagen de una vista, el estilo y las claves de acabado, de listas cerradas;
- el servidor no guarda nada;
- la clave del proveedor no llega nunca al navegador;
- las respuestas de error no contienen detalles del proveedor.

Los mensajes nuevos de rechazo **no borran** un código de acceso válido guardado en el navegador. Solo lo borra el error de código incorrecto, igual que antes.

## Efecto al fusionar y promocionar

**Sin ese paso previo, tras el Promote el Render IA quedaría apagado en Production** (503 `disabled`) hasta que se añada la variable.

**Decisión del propietario (opción A):** antes del Promote, añadir `RUBIK_RENDER_ENABLED=1` en las variables de Production de Vercel. Así el render sigue funcionando sin interrupción, ya con límites.

## Activación (solo el propietario, cuando lo decida)

1. En la cuenta del proveedor, fijar el **presupuesto mensual del proyecto** que se considere aceptable.
2. En Vercel, en el entorno deseado, empezando por Preview:
   - `RUBIK_RENDER_ENABLED=1`;
   - si se quieren, `RUBIK_RENDER_MAX_PER_HOUR`, `RUBIK_RENDER_MAX_PER_DAY` y `RUBIK_RENDER_MAX_TOKEN_FAILS`.
3. Con PR-2 fusionada (el modelo vigente), hacer **una** prueba manual en Preview y revisar el consumo en el proveedor.
4. Solo después, y si se desea, repetir en Production.

Para apagarlo: borrar `RUBIK_RENDER_ENABLED` o poner `RUBIK_RENDER_MAX_PER_DAY=0`. Surte efecto en el siguiente despliegue o arranque de la función.

## Pruebas

| Suite | Resultado |
|---|---|
| `tests/ai-render-api.test.cjs` | 10/10, con 5 pruebas nuevas D1: interruptor, origen, freno, límites hora y día, lectura de variables |
| `tests/ai-render.browser.test.cjs` | Mensajes nuevos en la interfaz; el código válido no se borra |
| Todas las pruebas puras del repositorio | 931 PASS · 0 FAIL · 2 omitidas por las propias suites |
| `share-link`, `ft3d-8-delivery` y `project-first` en el navegador | 12/12 |

En CI corren en el workflow **Project-First regressions**, que ya incluye ambas suites.
