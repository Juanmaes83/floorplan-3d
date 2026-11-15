# Consentimiento y evaluación de privacidad — Asistente generativo (para revisión)

**Estado:** borrador **para revisión del propietario y, en su caso, de asesoría legal**. No es un dictamen jurídico. NO MERGE · NO PRODUCTION · STOP_GASTO.

## 1. Tratamiento descrito

| Elemento | Detalle |
|---|---|
| Finalidad | Responder preguntas del profesional sobre **su proyecto en RUBIK** y preparar propuestas reversibles |
| Quién inicia | El profesional, eligiendo «Conversación con IA» y marcando los dos consentimientos |
| Datos que salen del navegador | (a) La **pregunta** escrita. (b) Los **resultados de las herramientas** que el modelo pide: estancias, superficies, materiales, partidas y estado del presupuesto, productos de Mis catálogos, referencias visuales (solo metadatos), revisión de distribución. (c) El historial acotado de la conversación (8 turnos) |
| Datos que NUNCA salen | Fotos e imágenes, el documento del proyecto completo, datos de contacto, nombres de clientes del CRM, códigos, claves |
| Minimización técnica | `scrub` elimina URL, correos, teléfonos y `data:`, y corta textos a 300 caracteres; listas ≤ 60 elementos; resultado ≤ 6000 caracteres; sin `walls` ni geometría completa |
| Destinatarios | La pasarela RUBIK (función de Vercel del mismo origen) → **un único proveedor de texto de lista cerrada** (propuesta: OpenAI Chat Completions) |
| Conservación en RUBIK | **Ninguna del contenido**: la pasarela no guarda preguntas ni respuestas. El libro de gasto guarda solo importes, modelo, tarifa y hora. Los registros de función son una línea sin cuerpo |
| Conservación en el proveedor | Se envía `store:false` (no guardar la conversación para su producto). **No sustituye** a revisar la política de retención y uso del proveedor y su acuerdo de tratamiento de datos (DPA). Pendiente |
| Transferencia internacional | Probable (proveedor fuera del EEE). Requiere verificar las garantías del proveedor (DPA y cláusulas). Pendiente |
| Base | Consentimiento explícito del profesional por sesión. Los datos del proyecto pueden ser datos de **su cliente** final: el profesional debe tener base para compartirlos |

## 2. Texto de consentimiento propuesto (versión para revisión)

**ES**
> **Conversación con IA (prueba).** Para responderte, RUBIK enviará a un proveedor externo de IA de texto **tu pregunta** y **solo los datos del proyecto que el asistente consulte**: estancias, medidas, materiales, partidas del presupuesto y productos de tus catálogos. **Nunca** envía fotos, el proyecto completo ni datos de contacto. El proveedor no debe guardar la conversación (`store:false`), pero se aplican sus condiciones. RUBIK no guarda tus preguntas ni las respuestas. Las respuestas pueden contener errores: revisa las cifras, que se comprueban solo de forma parcial. Cada consulta tiene un coste y un tope aprobado.
> ☐ Acepto enviar mi pregunta. ☐ Acepto enviar los datos del proyecto que se consulten y confirmo que puedo compartirlos.

**EN**
> **AI conversation (trial).** To answer you, RUBIK will send an external text AI provider **your question** and **only the project data the assistant looks up**: rooms, measures, materials, budget items and products from your catalogues. It **never** sends photos, the whole project or contact data. The provider is asked not to store the conversation (`store:false`), but its terms apply. RUBIK does not store your questions or answers. Answers may contain mistakes: check the figures, which are only partially checked. Each query has a cost and an approved cap.
> ☐ I agree to send my question. ☐ I agree to send the project data looked up and confirm I may share it.

**ZH**
> **AI 对话（试用）。** 为了回答您，RUBIK 会把**您的问题**和**助手查询到的项目数据**（房间、尺寸、材料、预算条目、目录产品）发送给外部文本 AI 服务商。**绝不**发送照片、完整项目或联系方式。已要求服务商不保存对话（`store:false`），但其条款仍然适用。RUBIK 不保存您的问题和回答。回答可能有误，数字仅部分核对，请自行检查。每次查询都有费用和已批准的上限。
> ☐ 我同意发送问题。☐ 我同意发送所查询的项目数据，并确认有权分享。

**Diferencias con el texto actual de la interfaz:**

- añade «prueba», la retención del proveedor, la ausencia de almacenamiento en RUBIK, la comprobación parcial de cifras, el coste y tope, y la confirmación de que puede compartir los datos;
- **no se cambia la interfaz** hasta que el propietario apruebe el texto.

## 3. Riesgos y medidas

| Riesgo | Medida actual | Pendiente |
|---|---|---|
| Datos del cliente final llegan al proveedor | Minimización por herramientas + `scrub` + consentimiento con confirmación | DPA del proveedor; aviso en las condiciones de RUBIK |
| Instrucciones incrustadas en nombres de estancias o productos | Política del servidor, lista blanca, URL eliminadas, `not_authorized` | Medición con modelo real (prueba C, escenario `injection`) |
| Cifras erróneas presentadas como ciertas | Comprobación parcial con oráculo monetario; la interfaz dice «parcial» | Medición en la prueba C |
| Gasto no autorizado | Puertas cerradas, código propio, tope, cota por bytes, disyuntor, libro común | GO separado; almacén; integración de Render IA |
| Reidentificación por historial | Historial ≤ 8 turnos, solo en la sesión del navegador | — |
| Acceso indebido | Código de acceso provisional | **GOV-06a** (sesiones, tenants, roles, cuotas) antes de Production |

## 4. Decisiones del propietario

1. Aprobar o ajustar el texto del §2.
2. Revisar la política de retención y uso del proveedor y su DPA, y decidir si basta para una **prueba con datos sintéticos**. Para datos reales de clientes hará falta más.
3. Confirmar que la prueba C usa **solo** el proyecto sintético (`reference-home`), sin datos de clientes.
