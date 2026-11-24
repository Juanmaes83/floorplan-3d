# Asesor RUBIK en vivo — encargo para Claude Code

## Orden de ejecución

Toma este encargo cuando termines y documentes las tareas que ya estás ejecutando. Trabaja en un worktree y una rama de implementación propios. Lee AGENTS.md, consulta la continuidad vigente en GitHub y registra el SHA base. La rama que contiene este documento sirve de referencia para el encargo.

Completa el Paso 0 y, a continuación, implementa y verifica el laboratorio simulado en la misma sesión. La simulación puede avanzar con el proveedor de voz pendiente. Entrega la evidencia y deja identificados los requisitos para una prueba real.

## Objetivo y alcance

Validar una modalidad opcional de voz y avatar para el Asistente RUBIK, adaptada al oficio y al proyecto activo. La primera demostración usa la vivienda de ejemplo o datos sintéticos y reutiliza las consultas y la navegación que el producto ya ofrece. En un futuro, el modo técnico podrá presentar propuestas para que el usuario las confirme en RUBIK. El modo cliente consulta datos autorizados y controla la vista.

El encargo de esta noche cubre una auditoría de código y un laboratorio aislado con servicio simulado. La activación de Nuance, el gasto, la integración de producto, la publicación en producción y la fusión a master requieren las autorizaciones correspondientes. La documentación de Nuance describe una API en vista previa con voz y reconocimiento en inglés. El lanzamiento en español exige comprobar ambos en una conversación real. [Límites e idioma](https://docs.nuancelabs.ai/limits-and-errors)

## Paso 0. Auditoría del producto

- Identifica las entradas del Asistente guiado y de texto, el contrato de herramientas, las confirmaciones y los consumidores de cada acción. Empieza por js/assistant-ui.js, js/assistant-gen-ui.js, js/assistant-domain-tools-core.js, js/assistant-proposals-core.js y api/assistant.js. Coteja esas rutas con el SHA efectivo.
- Comprueba cómo distingue RUBIK al operador del destinatario de una entrega y cómo autentica a quien inicia una sesión. Un identificador de proyecto y la profesión elegida en Home carecen de autoridad para conceder permisos. Si la identidad verificable queda pendiente, limita el trabajo al laboratorio local con datos sintéticos.
- Mapea cada capacidad relevante a archivo, función, datos, permiso y salida visible. Prioriza tres casos demostrables con el producto: consultar superficies, enfocar una estancia y continuar con el Asistente de texto. Si falta una API reutilizable, documenta si requiere un adaptador o queda fuera del piloto.
- Conserva como inventario candidato la configuración de vistas, sol, cortes, capas, despiece y recorrido, los informes de superficies y holguras, el emplazamiento, el presupuesto y los entregables. Valida individualmente su disponibilidad y destino. GIS, LiDAR, normativa local, Street View y servicios de pago dependen de sus capacidades y autorizaciones reales.

## Perfiles, modos y permisos

Usa como punto de partida los seis perfiles actuales del selector de Home, definidos en js/guide-ui.js. Esta es la correspondencia propuesta.

- architecture — Estudio de arquitectura.
- real-estate — Inmobiliaria.
- developer — Promotora.
- renovation — Reformas.
- interior — Decoración e interiorismo.
- construction — Constructora / jefe de obra.

Aparejadores queda como perfil futuro sujeto a una decisión de catálogo. Los nombres del avatar, su tono y la elección de persona_id son configurables. El piloto puede usar una sola identidad de ejemplo. Para las variantes futuras usa los IDs documentados sam, sonia y mira, sujetos a disponibilidad de la cuenta y revisión del proveedor. [Claves, tokens y personas](https://docs.nuancelabs.ai/keys-and-tokens)

En presentación, aplica una lista explícita de herramientas y una proyección de datos apta para el cliente. Las acciones de vista son temporales. Excluye costes internos, edición, publicación, capturas para el proveedor y registro de contactos. Una descarga o aviso comercial tendría su propio permiso y acción explícita fuera del conjunto de consulta del piloto.

Para una futura sesión técnica, solo el flujo de propuestas existente de RUBIK podrá ejecutar cambios. Valida identidad, rol, revisión del proyecto, argumentos y objetivo al proponer y al confirmar. Requiere confirmación explícita en RUBIK, incluso cuando el proveedor tenga policy.confirm. Los metadatos de herramientas describen el comportamiento. Las autorizaciones deben aplicarse en el punto de ejecución.

## SCULPT. Laboratorio de esta noche

1. **Sandbox.** Usa un punto de entrada bajo labs/ y el estilo vigente de RUBIK. Identifica el avatar como IA y la sesión como simulada. Conserva un botón para pasar al Asistente de texto o al guiado según la disponibilidad real. Mantén apagada cualquier salida a Nuance y usa datos sintéticos.
2. **Contrato.** Define una sola lista canónica de herramientas reutilizables, con perfiles y modos que seleccionan subconjuntos explícitos. Usa las tres acciones de la auditoría en el primer recorrido. Un adaptador simulado basta para probar el ciclo.
3. **Adaptador.** Simula inicio por clic, conexión, conversación, llamada de herramienta, error, cambio a texto y cierre. Desvincula la conversación si cambia el proyecto activo. La simulación evita publicar audio, vídeo, capturas y datos del cliente.
4. **Límites y alternativa.** Simula permiso denegado, credencial inválida, concurrencia, saldo, límite de inicio, capacidad, indisponibilidad y pérdida de conexión. Ofrece continuar por texto y evita reintentos automáticos sin límite. El traspaso de texto o contexto se limita a lo autorizado por el usuario.
5. **Pruebas.** Usa Playwright y Chromium en escritorio y móvil. Comprueba que el inicio requiere una acción del usuario, que el visor muestra resultados acordes al proyecto de ejemplo, que el modo cliente rechaza herramientas y datos privados, y que cancelación, error y cierre limpian los recursos. Verifica navegación, foco, mensajes y ausencia de llamadas al proveedor. Si simulas una propuesta técnica, comprueba que rechazarla deja intacto el proyecto y que la acción aprobada usa el flujo existente. Distingue resultados simulados de comprobaciones con servicios reales.
6. **Entrega.** Publica en tu rama el informe del Paso 0, el laboratorio, la evidencia y un recorrido reproducible. Indica base, commit, árbol, comandos ejecutados, resultado, entradas de interfaz y dependencias. Adjunta incidencias y el punto exacto para reanudar un Preview autorizado.

## Contrato para una futura prueba real

- La clave del proveedor queda en servidor. Emite un token de sesión de un solo uso al iniciar, con identidad verificada y una configuración permitida por el servidor. Consulta GET /usage y gestiona créditos e inicios como límites separados. La bandera de activación de servidor parte apagada y, para una prueba autorizada, su ámbito es el Preview previsto. [Emisión del token](https://docs.nuancelabs.ai/reference/api/server/create-a-session-token) · [Uso y límites](https://docs.nuancelabs.ai/reference/api/server/get-your-usage)
- El límite max_session_seconds se fija al crear la conversación. Si entregas al navegador el token aún sin usar, puede crearla sin el límite de RUBIK. Verifica un flujo compatible donde el servidor cree la conversación con el tope aplicado antes de ceder acceso a esa única sesión. Si el SDK elegido no permite ese flujo, verifica el transporte directo o una garantía equivalente del proveedor. El Preview con gasto queda supeditado a demostrar el tope, la reserva de cuota y un cierre o reconciliación fiable ante interrupciones. [Creación de conversación](https://docs.nuancelabs.ai/reference/api/browser/create-a-conversation) · [Fin desde servidor](https://docs.nuancelabs.ai/reference/api/server/end-a-conversation)
- Para delegación responses, las funciones tienen formato plano dentro de interface_setup.delegation.responses.tools. Incluye readOnlyHint y destructiveHint dentro de annotations y required dentro de parameters. Valida argumentos y autorización al ejecutar, revisa warnings al emitir el token y registra de forma minimizada qué herramientas quedaron activas. El máximo efectivo es 16. En session.update reutiliza las definiciones originales emitidas. Devuelve solo los campos necesarios y excluye números de teléfono de los resultados. [Delegación y herramientas](https://docs.nuancelabs.ai/delegation)
- Inicia desde un clic o toque. Desactiva la cámara del usuario tanto en la captura del SDK como en la configuración del proveedor. Verifica cancelación de eco del micrófono. Con transporte directo, mantén activa la espera HTTP de eventos con su cursor hasta ended. Usa session.output_audio.done para terminar el estado de habla y session.output_transcript.delta para subtítulos. [SDK de JavaScript](https://docs.nuancelabs.ai/js-sdk) · [Eventos de sesión](https://docs.nuancelabs.ai/server-events)
- Antes de que arranque, usa el abandono documentado con cuerpo vacío. El navegador gestiona Content-Length. En sesión activa, solicita el cierre y libera pistas y suscripciones incluso si falla la confirmación remota. Si la conversación llega a arrancar durante la cancelación, reconcilia su estado y ejecuta el cierre de servidor autorizado. Distingue 401, 403, 409 concurrency_limit, 429 credits_spent, start_limit y capacity_unavailable, y 503. Respeta el plazo de reintento de los errores transitorios. [Conectar y cancelar](https://docs.nuancelabs.ai/connect) · [Errores](https://docs.nuancelabs.ai/errors)

## Validación comercial y criterio de avance

Pedir al proveedor confirmación de español hablado y reconocido, condiciones de uso comercial, tratamiento y retención de audio y transcripciones, opciones de privacidad, precio por crédito, redondeo, duración cubierta y límites de cuenta. Usar datos de contrato o consumo medido para decidir precio y presupuesto. [Créditos y capacidad](https://docs.nuancelabs.ai/how-it-works)

El escenario anterior de 32 clientes y 1.768 EUR de ingresos mensuales da 1.297 EUR de diferencia en el caso base y 613 EUR en estrés según sus supuestos. Son diferencias hipotéticas entre ingresos y costes directos del ejemplo. Para estimar contribución real hay que aplicar redondeo por conversación, adquisición, pasarela, soporte y demás costes imputables.

El laboratorio se considera entregado con evidencia reproducible. Para avanzar a voz real, confirma la cuenta y el ámbito autorizados, privacidad, cuota y tope efectivo. Para ofrecer voz en español, verifica reconocimiento y respuesta hablada en español con casos de RUBIK.
