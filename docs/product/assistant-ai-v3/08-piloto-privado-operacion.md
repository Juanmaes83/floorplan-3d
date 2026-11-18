# Piloto privado de Asistente V3, FOT-01 y CAT-01

## Alcance y activación

La pasarela de Asistente V3 conserva su motor, herramientas, contexto y evaluación C. FOT-01 y CAT-01 usan `photo-reform/1`, el mismo libro Redis y el adaptador de navegador existente. Las fotografías y referencias viajan al proveedor solo tras confirmar el presupuesto. Se conservan en memoria durante el recorrido. Las descargas aceptadas llevan el rótulo de propuesta visual ilustrativa. Redis conserva reservas, liquidaciones y estado de idempotencia sin imágenes, prompts ni datos de proyecto.

El piloto requiere una rama Preview con acceso restringido a testers. Crear una credencial de servicio en el proyecto independiente de OpenAI «RUBIK Beta». Introducirla únicamente en **Vercel → Settings → Environment Variables**, con alcance **Preview** y limitada a la **rama privada del piloto**, como `RUBIK_ASSISTANT_PROVIDER_KEY` y `RUBIK_PHOTO_REFORM_PROVIDER_KEY`. El mismo proyecto de OpenAI puede cubrir ambos servicios. Ninguna credencial se coloca en el cliente, en Git, en Production ni en las variables de Beta 01. Los testers usan un código RUBIK individual.

| Configuración | Parámetros |
| --- | --- |
| Interruptor central | `RUBIK_BETA_AI_ENABLED=1` tras aprobar gasto y configuración. Desactivar para cortar nuevas operaciones. |
| Almacén | `RUBIK_SPEND_STORE_URL` y `RUBIK_SPEND_STORE_TOKEN` de un Redis dedicado a beta. Configurar `RUBIK_BETA_LEDGER_NAMESPACE` con la misma identidad para texto e imagen. |
| Autorización | `RUBIK_BETA_TESTERS` es un objeto JSON con alias de tester y SHA-256 de su código aleatorio individual. Distribuir los códigos por un canal privado. |
| Topes | `RUBIK_BETA_SPEND_CAP_USD` común, `RUBIK_BETA_TURNS_PER_TESTER_PER_MINUTE`, `RUBIK_BETA_IMAGES_PER_TESTER`, además de topes de familia y globales de los servicios existentes. |
| Texto | `RUBIK_ASSISTANT_ENABLED`, `RUBIK_ASSISTANT_PROVIDER=openai-chat`, modelo, tarifas fechadas y topes del [protocolo C](04-protocolo-prueba-c.md). |
| Imágenes | `RUBIK_PHOTO_REFORM_ENABLED`, `RUBIK_PHOTO_REFORM_PROVIDER=openai-images`, `RUBIK_PHOTO_REFORM_PROVIDER_URL=https://api.openai.com/v1/images/edits`, modelo, fecha, límite por imagen y precios de tokens descritos abajo. |

El interruptor se evalúa en el servidor. Desde un entorno de operación con los secretos del almacén dedicado, ejecutar `node scripts/qa/beta-ai-switch.cjs off` para bloquear nuevas operaciones de texto e imagen sin redesplegar. `status` consulta el estado. `on` retira el bloqueo tras aprobación. Para revocación inmediata del proveedor, revocar la credencial desde el proyecto de OpenAI y desactivar el acceso al Preview. Los cambios de variables de Vercel se aplican a un nuevo despliegue. Las solicitudes ya aceptadas por el proveedor pueden consumir presupuesto aunque se cierre la pantalla. El almacén conserva el peor caso ante un resultado desconocido. Un consumo informado por encima de la reserva abre el disyuntor de imágenes para nuevas solicitudes.

## Tarifas de referencia verificadas el 18/11/2026

| Modelo candidato | USD por millón de tokens en tarifa estándar |
| --- | --- |
| `gpt-4.1-mini` para Prueba C | 0,40 entrada de texto sin caché, 1,60 salida. [Ficha oficial](https://developers.openai.com/api/docs/models/gpt-4.1-mini) |
| `gpt-image-2.6-flare` para FOT-01 y CAT-01 | 5,00 entrada de texto, 8,00 entrada de imagen, 30,00 salida de imagen. [Tarifa oficial](https://developers.openai.com/api/docs/pricing#images) |

Calibrar el piloto de imágenes con tamaño y calidad controlados. `RUBIK_PHOTO_REFORM_PRICE_PER_IMAGE_USD` es el máximo de reserva aprobado por alternativa, que debe incluir la entrada de la foto, referencias, texto y salida. No es una tarifa plana oficial. Configurar por separado `RUBIK_PHOTO_REFORM_TEXT_INPUT_PER_MTOK`, `RUBIK_PHOTO_REFORM_IMAGE_INPUT_PER_MTOK`, `RUBIK_PHOTO_REFORM_IMAGE_OUTPUT_PER_MTOK` y `RUBIK_PHOTO_REFORM_PRICE_DATE`. La disponibilidad de los modelos en el proyecto del propietario se acredita en el piloto. No se han consumido servicios de pago.

## Criterios pendientes antes de apertura

1. Aprobar un presupuesto concreto. Para C, la propuesta previa documenta hasta 1 USD, 30 preguntas y 33 turnos. Aprobar aparte el lote acotado FOT-01/CAT-01 y su máximo por solicitud.
2. Configurar y verificar Preview aislado, almacén dedicado, identidad y variables requeridas. Confirmar que Beta 01 y los dominios de Production mantienen sus despliegues.
3. Ejecutar Prueba C y una edición autorizada por FOT-01 y CAT-01. Revisar la salida, el rechazo ante falta de consentimiento, el tope, la ficha y los registros. Conciliar contra costes exportados del proyecto de OpenAI con `scripts/qa/assistant-ledger-reconcile.cjs`. El coste por uso mostrado es una estimación hasta la conciliación.
4. Si se requiere rollback, cortar el acceso al Preview, revocar la clave y volver a la revisión anterior de la rama. Conservar las reservas y el registro para conciliación.

**NO-GO para abrir la beta real** hasta superar esos pasos. El ZIP o despliegue de Beta 01 no forma parte del piloto.
