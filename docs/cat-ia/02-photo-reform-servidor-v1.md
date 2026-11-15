# FOT-01 / CAT-01 · `photo-reform/1` en el servidor (corte C2)

**Estado: preparado, probado y CERRADO.**
- **No hay ningún despliegue activado.**
- Gasto: 0. Ninguna llamada real al proveedor. **STOP_GASTO** mientras falte el tope monetario aprobado por el propietario.

## 1. Por qué

En #227/#228, el adaptador de navegador `httpAdapter` enviaba `Authorization: Bearer <token del proveedor>` desde JavaScript. V2 lo marca como defecto de seguridad: cualquier secreto en el navegador es público.

En este corte:
- **Se retira** `httpAdapter`.
- El navegador solo habla con `/api/photo-reform` de su mismo sitio (`serverAdapter`).
- Las claves del proveedor viven únicamente en el entorno del servidor.

## 2. Cerrado por defecto: puertas, en orden

Si falta cualquiera de ellas, responde 503 con el motivo.

| Puerta | Variable | Error |
|---|---|---|
| Activación explícita | `RUBIK_PHOTO_REFORM_ENABLED=1` (exactamente) | `disabled` |
| Nunca en Production | `VERCEL_ENV=production` | `production-blocked` |
| Código propio | `RUBIK_PHOTO_REFORM_TOKEN`: de 32 a 200 caracteres, **distinto** de `RUBIK_RENDER_TOKEN` y de `RUBIK_SHARE_TOKEN` | `not-configured` / `misconfigured` |
| Proveedor propio | `RUBIK_PHOTO_REFORM_PROVIDER` (lista cerrada: `openai-images`), `RUBIK_PHOTO_REFORM_PROVIDER_KEY` (**distinta** de `OPENAI_API_KEY`), `RUBIK_PHOTO_REFORM_PROVIDER_URL` (https y host de la lista) | `provider-not-configured` / `misconfigured` |
| Tope aprobado | `RUBIK_PHOTO_REFORM_BUDGET_CAP_USD` > 0 | `budget-not-approved` |
| Precio fechado | `RUBIK_PHOTO_REFORM_PRICE_PER_IMAGE_USD` + `RUBIK_PHOTO_REFORM_PRICE_DATE` | `price-unknown` |
| Límite de imágenes | `RUBIK_PHOTO_REFORM_MAX_OUTPUTS`, de 1 a 4 | `limit-not-configured` |
| Almacén persistente | Interfaz `get`, `setIfAbsent`, `set`, `reserve` y `settle`, atómica | `store-not-configured` |

- **La configuración de `/api/render` no activa nada:** ni su código, ni su cabecera, ni `OPENAI_API_KEY` (hay prueba).
- La exportación desplegada **no tiene almacén**, así que responde 503 aunque todas las variables estén puestas.
- Solo en pruebas locales, fuera de Vercel, se permite `http://127.0.0.1` como proveedor (`RUBIK_PHOTO_REFORM_ALLOW_LOCAL_PROVIDER=1`).

## 3. Petición

Dos pasos, JSON, con `x-rubik-contract: photo-reform/1` y `x-rubik-photo-reform-token`.

**Origen y CSRF.**
- Se exige el mismo sitio: `Origin` igual al host y `Sec-Fetch-Site: same-origin` cuando el navegador lo envía.
- Se exige la cabecera de contrato y `Content-Type: application/json`. Esto obliga a un *preflight*, y el servidor no responde con CORS.

**SSRF.** El servidor nunca descarga una URL aportada por el cliente. El destino es el del entorno, en una lista cerrada.

**Lista cerrada.**
- `{version:1, intent, finish, alternatives 1..3}`, con los mismos identificadores que `js/photo-reform-core.js`.
- Cualquier otra clave se rechaza: texto libre, proyecto, nombre de archivo o EXIF.
- Las palabras de la instrucción las escribe el servidor y siempre conservan cámara, muros, ventanas, puertas, huecos e instalaciones.

**1 · `quote`.**
- Entrada: `{request, imageSha256, imageBytes}`.
- Devuelve una estimación = precio fechado × número de imágenes, el tope, el gasto y las imágenes usadas, y un `confirmationId`.
- El `confirmationId` está firmado con HMAC, ligado a la solicitud y a la huella de la imagen, y caduca a los 10 minutos.
- Ni llama al proveedor ni gasta.

**2 · `generate`.**
- Entrada: `{confirmationId, idempotencyKey, request, image}`.
- Comprobaciones, en este orden:
  - la imagen: tipo real por *magic bytes*, como máximo 4 MB, la misma huella que la presupuestada;
  - la firma y la caducidad;
  - la **idempotencia**: la misma clave nunca vuelve a llamar ni a cobrar (`already-processed`);
  - el **nonce de un solo uso** (`confirmation-used`);
  - la **reserva atómica** del peor caso contra el tope de gasto y el total de imágenes (`budget-exceeded` / `outputs-exceeded`, 402, sin llamada).
- Después llama **una vez**, sin reintentos automáticos.

**Coste.** Precio × imágenes devueltas.
- Error del proveedor sin imágenes: 0.
- Resultado incierto (red): **se retiene el peor caso**, nunca un 0 ficticio.

**Respuesta.** Es el cuerpo v1 estricto `{version, provider, alternatives, cost}`, que valida `validateResponse` del navegador. Además, cabeceras `x-rubik-request-id` y `x-rubik-outputs-billed`.

**Registros.** Una línea JSON por petición: `requestId`, acción, proveedor, modelo, intención, imágenes, estado, duración, coste y saldo. Nunca la imagen, el código, la clave, la IP, el agente de usuario ni el host.

**Retención.** No se guarda ninguna imagen. El almacén solo guarda nonces (20 minutos) y el estado de idempotencia sin contenido (24 horas).

## 4. Pruebas

| Fichero | Qué cubre |
|---|---|
| `tests/photo-reform-api.test.cjs` | 10 pruebas contra un proveedor **falso** local: puertas, origen y CSRF, lista cerrada e inyección, presupuesto previo, generación, imagen y confirmación, un solo uso e idempotencia, topes también en paralelo, errores y cadena completa navegador → servidor → proveedor falso. |
| `tests/photo-reform-provider.test.cjs` | 7 pruebas: el cliente `serverAdapter` (mismo origen, sin `Authorization`, confirmación de gasto, errores, respuestas fuera de contrato, cancelación, red). |
| Mutación | Al desactivar una guarda (Production, nonce, límite de imágenes, firma, código igual al de render), alguna prueba falla. |

## 5. Qué falta para activarlo (decisiones humanas)

1. **Tope monetario** aprobado por el propietario y un **límite duro** en la cuenta del proveedor, menor o igual que ese tope.
2. **Almacén persistente y atómico** aprobado, por ejemplo Redis o KV con operaciones atómicas. Hoy no existe y el servicio sigue en 503.
3. Precio vigente verificado en la fuente del proveedor el día de la prueba, en `PRICE_*`.
4. Las variables en **Preview**, nunca en Production, y solo con fixtures sintéticos (V2 §4: máximo 4 imágenes facturables en total).
5. Para clientes reales: **GOV-05** (privacidad), **GOV-06a** (cuentas y cuotas por profesional; el código de acceso compartido **no** es una sesión por usuario) e **IMG-04** global.
