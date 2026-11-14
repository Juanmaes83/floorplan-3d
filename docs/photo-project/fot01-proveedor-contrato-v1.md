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

`js/photo-reform-provider.js` (`RubikPhotoReformProvider`):

- **Interfaz única de adaptador**: `{id, kind, run(request, image, {signal, onItem})}`. La pantalla usa la misma
  ruta (`runWith`) para el adaptador simulado (`simulated-local`) y para el HTTP (`http-v1`): activar un proveedor no
  cambia el consentimiento, la puerta, los rótulos, el descarte ni la garantía de proyecto intacto.
- **`config()`** de este despliegue: `configured:false, authorized:false, endpoint:null, governance {gov05:false,
  img04:false}`. La pantalla nunca crea el adaptador HTTP.
- **Solicitud** (multipart): `request` = JSON con claves cerradas `{version:1, intent, finish, alternatives}` e
  `image` = la copia recomprimida sin metadatos con nombre fijo `photo.jpg`. Cabeceras `authorization: Bearer …` y
  `x-rubik-contract: photo-reform/1`; `credentials:'omit'`, `referrerPolicy:'no-referrer'`. Solo `https://`.
- **Respuesta v1** estricta: `{version:1, provider:{id,name}, alternatives:[{index, mediaType, data(base64)}],
  cost: null | {amount ≥ 0, currency: USD|EUR}}`. Se rechaza (y no se muestra nada) si sobran claves, el tipo de
  imagen no coincide con sus bytes, hay más alternativas de las pedidas, el coste no es válido, etc.
- **Errores** mapeados: 402 saldo, 429 límite, 503 desactivado, 401/403 autorización, 5xx error, red, cancelación.
- **Coste**: solo el que informa el proveedor; sin cifra → «Coste: desconocido». Nunca se estima ni se inventa.
- **Pruebas**: `tests/photo-reform-provider.test.cjs` ejercita el adaptador contra un **servidor local simulado
  (127.0.0.1)**. El «Proveedor de prueba» es un doble de prueba; el producto no lo registra.

No se ha creado ningún endpoint de servidor y **no se reutiliza `/api/render`**: su contrato es para vistas 3D de
RUBIK (estilos y acabados sobre una vista propia), no para fotografías de clientes con personas o datos.

## 3. Por qué está bloqueada la generación real

| Bloqueo | Fuente | Estado |
|---|---|---|
| Sin proveedor configurado ni autorizado por el propietario para fotografías de clientes | `config()` | pendiente |
| **GOV-05**: revisión legal y de privacidad (condiciones, retención, licencias, consentimiento de imágenes y personas) | catálogo maestro | R (borrador) |
| **IMG-04**: confirmación de gasto previa y lotes con cancelación; hoy los límites del servidor son por instancia, no un tope global | catálogo maestro | P |
| **GOV-06a**: autenticación y cuotas por profesional para servicios IA de pago | catálogo maestro | N |
| Endpoint de servidor específico para fotografías (no existe) | — | no iniciado |

## 4. Decisiones humanas necesarias para activarla

1. Elegir y **autorizar expresamente** un proveedor (y su tratamiento de datos, retención y región).
2. Cerrar **GOV-05** para fotografías de clientes (consentimiento, personas visibles, retención, borrado).
3. Cerrar **IMG-04/GOV-06a**: confirmación de gasto por solicitud, tope global y cuotas por profesional.
4. Aprobar un endpoint de servidor `photo-reform/1` (análogo en guardas a `/api/render`: activación explícita,
   origen, token, límites, registro sin imagen) y sus secretos.
5. Solo entonces cambiar `config()` y conectar `httpAdapter` en `runWith` tras la puerta `gate({mode:'real'})`.
