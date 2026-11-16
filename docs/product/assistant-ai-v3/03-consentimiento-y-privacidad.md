# Consentimiento y evaluación de privacidad — Asistente generativo (para revisión)

**Estado:** borrador **para revisión del propietario y, en su caso, de asesoría legal**. No es un dictamen jurídico. NO MERGE · NO PRODUCTION · STOP_GASTO.

## 1. Tratamiento descrito

| Elemento | Detalle |
|---|---|
| Finalidad | Responder preguntas del profesional sobre **su proyecto en RUBIK** y preparar propuestas reversibles |
| Quién inicia | El profesional, eligiendo «Conversación con IA» y marcando los dos consentimientos |
| Datos que salen del navegador | (a) La **pregunta** escrita. (b) Los **resultados de las herramientas** que el modelo pide: estancias, superficies, materiales, partidas y estado del presupuesto, productos de Mis catálogos, referencias visuales (solo metadatos), revisión de distribución. (c) El historial acotado de la conversación (8 turnos) |
| Lo que RUBIK nunca adjunta | Fotos e imágenes, el documento del proyecto completo, datos de contacto del CRM, códigos y claves |
| **Lo que NO se puede garantizar** | La **pregunta libre** se envía como la escribe el profesional. RUBIK oculta los correos, teléfonos (≥ 9 dígitos), enlaces y `data:` que **reconoce** (`redactQuestion`, probado), pero **no detecta nombres, direcciones ni otros datos personales**. Por eso la interfaz pide no pegarlos y usar solo proyectos sintéticos en las pruebas. **No se promete que nunca salgan datos personales** |
| Aislamiento por ámbito | Historial, resultados de herramientas, propuestas, rutas y consentimiento pertenecen a **un estudio + proyecto**. Al cambiar de ámbito se corta la petición en curso, se borra el historial, se invalidan las propuestas y rutas y se pide el consentimiento de nuevo. Una respuesta que llega de otro ámbito se descarta. Prueba de navegador A → B → C y estudio → estudio, más la demostración de la fuga antes de la corrección (acta 05) |
| Minimización técnica | `scrub` elimina URL, correos, teléfonos y `data:`, y corta textos a 300 caracteres; listas ≤ 60 elementos; resultado ≤ 6000 caracteres; sin `walls` ni geometría completa |
| Destinatarios | La pasarela RUBIK (función de Vercel del mismo origen) → **un único proveedor de texto de lista cerrada** (propuesta: OpenAI Chat Completions) |
| Conservación en RUBIK | **Ninguna del contenido**: la pasarela no guarda preguntas ni respuestas. El libro de gasto guarda solo importes, modelo, tarifa y hora. Los registros de función son una línea sin cuerpo |
| Conservación en el proveedor | Se envía `store:false` (no guardar la conversación para su producto). **No sustituye** a revisar la política de retención y uso del proveedor y su acuerdo de tratamiento de datos (DPA). Pendiente |
| Transferencia internacional | Probable (proveedor fuera del EEE). Requiere verificar las garantías del proveedor (DPA y cláusulas). Pendiente |
| Base | Consentimiento explícito del profesional por sesión. Los datos del proyecto pueden ser datos de **su cliente** final: el profesional debe tener base para compartirlos |

## 2. Texto de consentimiento (implementado en esta entrega, ES/EN/ZH; pendiente de aprobación del propietario)

**Casillas:**

| Idioma | Casilla 1 | Casilla 2 |
|---|---|---|
| ES | «Envío mi pregunta al proveedor de IA de texto.» | «Permito enviar los datos de ESTE proyecto que el asistente consulte (estancias, medidas, presupuesto, productos). RUBIK no adjunta fotos ni contactos.» |
| EN | «I send my question to the text AI provider.» | «I allow sending the data of THIS project that the assistant looks up (rooms, measures, budget, products). RUBIK attaches no photos or contacts.» |
| ZH | «我同意将问题发送给文本 AI 服务商。» | «我允许发送助手查询的“此项目”数据（房间、尺寸、预算、产品）。RUBIK 不附加照片或联系方式。» |

**Aviso visible** (`#assistantGenPrivacy`):
> ES: «Tu pregunta se envía como la escribas: RUBIK oculta correos, teléfonos y enlaces que reconoce, pero no puede detectar nombres, direcciones u otros datos personales. No los pegues. En las pruebas, usa solo proyectos sintéticos. El proveedor recibe store:false, pero se aplican sus condiciones de retención.»
>
> EN / ZH: traducciones equivalentes, probadas en el navegador al cambiar de idioma.

Si se ocultó algo de la pregunta, la respuesta lo indica: «ℹ Se ocultaron en tu pregunta antes de enviarla: email, phone…».

El consentimiento **queda ligado al estudio y al proyecto**: al cambiar de ámbito, las casillas se desmarcan y no se envía nada hasta marcarlas de nuevo.

## 3. Riesgos y medidas

| Riesgo | Medida actual | Pendiente |
|---|---|---|
| Datos del cliente final llegan al proveedor | Minimización por herramientas + `scrub` + ocultación en la pregunta + consentimiento por ámbito + aviso honesto | DPA del proveedor; aviso en las condiciones de RUBIK |
| Instrucciones incrustadas en nombres de estancias o productos | Política del servidor, lista blanca, URL eliminadas, `not_authorized` | Medición con modelo real (prueba C, escenario `injection`) |
| Cifras erróneas presentadas como ciertas | Comprobación parcial con oráculo monetario; la interfaz dice «parcial» | Medición en la prueba C |
| Gasto no autorizado | Puertas cerradas, código propio, tope, cota por bytes, disyuntor, libro común | GO separado; almacén; integración de Render IA |
| Reidentificación por historial / mezcla de expedientes | Historial ≤ 8 turnos, en la sesión del navegador y **aislado por estudio y proyecto** (corregido y probado) | — |
| Acceso indebido | Código de acceso provisional | **GOV-06a** (sesiones, tenants, roles, cuotas) antes de Production |

## 4. Decisiones del propietario

1. Aprobar o ajustar el texto del §2.
2. Revisar la política de retención y uso del proveedor y su DPA, y decidir si basta para una **prueba con datos sintéticos**. Para datos reales de clientes hará falta más.
3. Confirmar que la prueba C usa **solo** el proyecto sintético (`reference-home`), sin datos de clientes.
