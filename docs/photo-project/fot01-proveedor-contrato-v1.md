# FOT-01 · Reformar desde fotografía: contrato de proveedor v1 y bloqueo registrado

**Estado: PARCIAL / BLOQUEADA en la generación real.** El recorrido completo funciona con un adaptador **simulado y
rotulado**. La generación con IA real **no está activada** y no puede activarse sin las decisiones humanas de la
sección 4. Este documento no autoriza ningún proveedor, gasto ni despliegue.

## 1. Qué está terminado (sin proveedor)

| Paso | Dónde | Prueba |
|---|---|---|
| Importar foto, validar formato real, tamaño, daño, dimensiones; copia sin EXIF ni ubicación | `js/photo-reform-ui.js`, `RubikPhotoReformCore.checkFile/checkDimensions` | núcleo + navegador |
| Intención cerrada (suelo, paredes, luz, calidez) y acabados de lista; 1–3 alternativas | `RubikPhotoReformCore.request` | núcleo + navegador |
| «Qué se enviaría» y «Nunca se envía» (proyecto, nombre del archivo, EXIF, texto libre) | idem | núcleo + navegador |
| Consentimiento obligatorio; puerta del proveedor real cerrada con sus motivos | `RubikPhotoReformCore.gate` | núcleo + navegador |
| Alternativas con estado (en espera, preparando, lista, error, cancelada, no generada), cancelación y errores | `run/start/itemDone/itemError/cancel` | núcleo + navegador |
| Comparación antes/después con deslizador; descartar; proyecto intacto; ninguna llamada a `/api/` | UI | navegador + vídeo |
| **Trazabilidad**: registro de la sesión con campos cerrados, descargable en JSON, sin imagen ni nombre de archivo | `RubikPhotoReformCore.trace` | núcleo + navegador |
| Rótulo «SIMULACIÓN · no generada por IA» en interfaz e imagen; «Coste: no aplica»; descarga desactivada | `label` | núcleo + navegador |

## 2. Integración preparada y probada, SIN ACTIVAR

> **Actualización CAT-IA C2 (2026-11-14).** El adaptador de navegador `httpAdapter` de #227/#228 enviaba
> `authorization: Bearer <token>` desde JavaScript: V2 lo señaló como **defecto de seguridad** y se ha **retirado**. Ahora
> el navegador solo habla con el servidor propio `/api/photo-reform` (`photo-reform/1`, `api/photo-reform.js`) de su
> mismo sitio, y las claves del proveedor viven solo en el servidor. Detalle: `docs/cat-ia/02-photo-reform-servidor-v1.md`.

`js/photo-reform-provider.js` (`RubikPhotoReformProvider`):

- **Interfaz única de adaptador**: `{id, kind, run(request, image, {signal, onItem})}`. La pantalla usa la misma
  ruta (`runWith`) para el adaptador simulado (`simulated-local`) y para el de servidor (`server-v1`): activar un
  proveedor no cambia el consentimiento, la puerta, los rótulos, el descarte ni la garantía de proyecto intacto.
- **`config()`** de este despliegue: `configured:false, authorized:false, endpoint:null, governance {gov05:false,
  img04:false}`. La pantalla nunca crea el adaptador de servidor.
- **`serverAdapter({accessCode, confirm})`**: dos pasos JSON hacia `/api/photo-reform` del mismo origen, con
  `x-rubik-contract: photo-reform/1` y el código de acceso del servicio en `x-rubik-photo-reform-token` (nunca
  `Authorization`, nunca el código de `/api/render`). 1) `quote` con la solicitud cerrada `{version:1, intent,
  finish, alternatives}` y la huella SHA-256 de la imagen → estimación de gasto con precio fechado; 2) la persona
  confirma (`confirm(quote)`); 3) `generate` con el id de confirmación de un solo uso, una clave de idempotencia y la
  copia recomprimida sin metadatos. Nunca el proyecto, el nombre del archivo, EXIF ni texto libre.
- **Respuesta v1** estricta (sin cambios): `{version:1, provider:{id,name}, alternatives:[{index, mediaType,
  data(base64)}], cost: null | {amount ≥ 0, currency: USD|EUR}}`. Se rechaza (y no se muestra nada) si sobran claves,
  el tipo de imagen no coincide con sus bytes, hay más alternativas de las pedidas, el coste no es válido, etc.
- **Errores** mapeados: 402 tope de gasto o de imágenes, 409 confirmación no válida/caducada/usada, 429 límite, 503
  desactivado (con el motivo del servidor), 401/403 autorización, 5xx error, red, cancelación, gasto no confirmado.
- **Coste**: el que calcula el servidor con el precio fechado configurado por el propietario; nunca 0 ficticio.
- **Pruebas**: `tests/photo-reform-provider.test.cjs` (cliente contra un servidor local simulado) y
  `tests/photo-reform-api.test.cjs` (servidor real con un **proveedor falso** en 127.0.0.1 y la cadena completa).

**No se reutiliza `/api/render`**: su contrato es para vistas 3D de RUBIK, no para fotografías de clientes; su código,
su cabecera y `OPENAI_API_KEY` no activan `photo-reform/1` (hay prueba).

## 3. Por qué está bloqueada la generación real

| Bloqueo | Fuente | Estado |
|---|---|---|
| Sin proveedor configurado ni autorizado por el propietario para fotografías de clientes | `config()` | pendiente |
| **GOV-05**: revisión legal y de privacidad (condiciones, retención, licencias, consentimiento de imágenes y personas) | catálogo maestro | R (borrador) |
| **IMG-04**: confirmación de gasto previa y lotes con cancelación; hoy los límites del servidor son por instancia, no un tope global | catálogo maestro | P |
| **GOV-06a**: autenticación y cuotas por profesional para servicios IA de pago | catálogo maestro | N |
| Endpoint de servidor específico para fotografías | `api/photo-reform.js` | preparado y **cerrado** (503): falta tope aprobado, almacén persistente y activación |

## 4. Decisiones humanas necesarias para activarla

1. Elegir y **autorizar expresamente** un proveedor (y su tratamiento de datos, retención y región).
2. Cerrar **GOV-05** para fotografías de clientes (consentimiento, personas visibles, retención, borrado).
3. Cerrar **IMG-04/GOV-06a**: confirmación de gasto por solicitud, tope global y cuotas por profesional.
4. Activar `photo-reform/1` en **Preview** con sus variables (código propio, clave propia del proveedor, tope
   aprobado, precio fechado, máximo de imágenes) y un **almacén persistente y atómico** aprobado.
5. Solo entonces cambiar `config()` y conectar `serverAdapter` en `runWith` tras la puerta `gate({mode:'real'})`.
