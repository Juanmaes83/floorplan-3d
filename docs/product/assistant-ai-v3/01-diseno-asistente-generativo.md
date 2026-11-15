# Asistente generativo RUBIK (rubik-agent/1 · rubik-assistant/2) — diseño, estado y dictamen

**Estado:** Draft · **NO MERGE · NO PRODUCTION · NO ACTIVACIÓN DE PROVEEDORES · STOP_GASTO**.
**Rama:** `feat/assistant-generative-v3`, apilada sobre CAT-04 (#237, `feat/cat-04-catalog-budget-assistant`). Se apila para reutilizar las herramientas de catálogo, partidas y referencias visuales de CAT-04 sin duplicarlas. Si CAT-04 cambia, esta rama se actualiza por merge.

## 1. Qué cambia para el profesional

El panel «Asistente» tiene dos modos: **Consulta guiada** (AG-0…AG-5, sin modelo, como hasta ahora) y **Conversación con IA**.

En «Conversación con IA»:

- Se escribe en lenguaje natural, sin comandos: «Estoy diseñando un salón para un cliente: revisa la distribución y dime qué mejorarías», «¿qué sofá de Mis catálogos encaja en el salón y cuánto supondría?» o «explícame por qué el presupuesto está incompleto antes de entregarlo».
- Un **modelo de lenguaje real** interpreta la pregunta y **consulta RUBIK** con sus herramientas reales. Cada respuesta muestra qué se consultó: «Consultado en RUBIK: presupuesto · estancias».
- Las cifras salen de RUBIK. Si el modelo escribe una cifra que no está en lo consultado, se avisa: «⚠ Cifras no verificadas por RUBIK».
- Cuando procede un cambio, el asistente **prepara una propuesta** con su diff. El profesional la aplica o la descarta; aplicarla es un paso que se puede deshacer, el mismo mecanismo de AG-3.
- Puede **ofrecer botones** a los flujos reales: Presupuestar, Precios de referencia, Dossier económico, Estudio de imágenes, Render IA, Mis catálogos y Analizar. No abre nada por su cuenta y nada gasta: Render IA sigue confirmando cada imagen con su código.
- Mantiene el hilo de la conversación («¿y cuál es la más grande?»), con memoria acotada.
- Cada respuesta indica tokens y coste estimado, y el estado muestra lo gastado frente al tope.
- Antes de enviar nada pide **consentimiento**: la pregunta, y los datos del proyecto que el asistente consulte. Nunca fotos ni datos de contacto.
- Si el servicio no está autorizado, lo dice («preparada, pero desactivada en este despliegue…») y la consulta guiada sigue igual.

## 2. Arquitectura (plan maestro IA, §4.3, sin sobredimensionar)

```
Panel (assistant-ui + assistant-gen-ui) ── consentimiento, código de sesión, propuestas, rutas
   │  RubikAssistantAgent.runTurn: bucle de herramientas (máx. 6 pasos y 4 llamadas por paso)
   │     ejecuta EN EL NAVEGADOR solo herramientas de la lista, con los motores de RUBIK (el proyecto vive aquí)
   ▼  POST /api/assistant  (mismo origen, rubik-assistant/2; el navegador NO tiene la clave)
api/assistant.js ── puertas cerradas por defecto, política y definiciones de herramientas del SERVIDOR,
   │                reserva del peor caso → llamada única → liquidación con usage real; registro sin contenido
   ▼  proveedor de lista cerrada (openai-chat: Chat Completions con function tools, store:false)
```

| Herramienta (lista blanca) | Tipo | Motor |
|---|---|---|
| `get_project_summary`, `list_rooms`, `get_room`, `get_quantities`, `list_materials`, `list_objects` | lectura | FloorPlanProjectV1 / FloorPlanQuantities |
| `get_layout_review` | lectura | FloorPlanLayoutReview |
| `get_budget_summary` | lectura | FloorPlanBudget.calculateBudget (el mismo documento que Presupuestar) |
| `list_catalog_products`, `get_placed_products`, `get_visual_references` | lectura (CAT-04) | RubikCatalogProduct / RubikCatalogBudget + calculateBudget / RubikVisualReferences |
| `list_capabilities` | lectura | CapabilitiesForAssistantV1 |
| `propose_floor_material`, `propose_move_object` | propuesta (AG-2) | RubikAssistantProposals sobre COPIA; se aplica con AG-3 |
| `offer_route` | navegación | ofrece un botón; no abre ni gasta |

**Decisiones de diseño:**

- **El proyecto nunca sale entero.** Solo viajan los resultados de herramientas que el modelo pide, minimizados: sin URL, correos, teléfonos ni `data:`; textos cortados y tamaño acotado.
- **El servidor manda.** La política del sistema y las definiciones de herramientas las pone el servidor. Un mensaje `system` del navegador se rechaza y una herramienta fuera de la lista se descarta.
- **Defensa ante instrucciones incrustadas.** Los nombres de estancias o productos son datos. Se eliminan URL y correos de los resultados y la política lo indica al modelo. Las llamadas no autorizadas devuelven `not_authorized` sin ejecutarse.
- **El modelo no puede aplicar cambios ni gastar.** Los cambios son propuestas; los flujos de pago son botones con su propio control.

## 3. Seguridad y gasto

| Control | Dónde | Estado |
|---|---|---|
| Interruptor `RUBIK_ASSISTANT_ENABLED` | servidor | probado (503 si falta) |
| Código de acceso propio `RUBIK_ASSISTANT_TOKEN`, distinto de los de Render, compartición y foto; comparación en tiempo constante; contador de fallos | servidor | probado (501 / 401) |
| Production solo con `RUBIK_ASSISTANT_ALLOW_PRODUCTION=1` | servidor | probado |
| Proveedor de lista cerrada con endpoint fijo; clave propia `RUBIK_ASSISTANT_PROVIDER_KEY` ≠ `OPENAI_API_KEY` (Render IA) | servidor | probado |
| Modelo, tarifa fechada por millón de tokens y tope `RUBIK_ASSISTANT_BUDGET_CAP_USD` aprobados por el propietario (ningún precio en el código) | servidor | probado |
| Reserva atómica del peor caso antes de llamar; liquidación con `usage`; peor caso si el uso es desconocido o el proveedor no responde; 4xx sin cargo | servidor | probado con almacén de pruebas |
| Idempotencia (no hay segunda llamada con la misma clave) y límite por minuto | servidor | probado |
| Contabilidad por familia `text` / `image` con un tope común | interfaz del almacén | probado en memoria; Render IA aún no anota en ella |
| Consentimiento explícito (pregunta + datos del proyecto) en el navegador y en el servidor | ambos | probado |
| `store:false` al proveedor | servidor | probado |
| Registro: una línea sin cuerpo, pregunta, proyecto, código, clave, IP ni agente | servidor | probado |
| Sin elegir la IA, 0 peticiones a `/api/` | navegador | probado |

## 4. Clasificación A / B / C

**A — Implementado y verificado sin gasto:**

- Orquestador de agente: bucle, lista blanca, validación de argumentos, minimización, memoria, límites, cancelación, consentimiento y fundamento de cifras. 6 pruebas puras.
- Pasarela con todas sus puertas, reserva y liquidación, idempotencia, límite, estado sin secretos y registros sin contenido. 4 pruebas puras con proveedor falso en el **formato real** de Chat Completions.
- **Cadena completa** agente → pasarela (todas las puertas) → proveedor falso → herramientas reales de RUBIK → respuesta fundamentada, con el mismo coste en el libro del servidor (prueba 6 de `assistant-agent-core`).
- Interfaz en el editor real con un doble rotulado del servidor (4 pruebas de navegador):
  - estado del servicio, consentimiento, respuesta y coste;
  - propuesta → aplicar → deshacer, y ruta real a Presupuestar;
  - errores (tope, herramienta prohibida);
  - móvil 390×844 EN;
  - 0 peticiones sin elegir la IA.
- La consulta guiada sigue intacta: `assistant-ai-v2` 21 pruebas puras y 5 de navegador; CAT-04 4 de navegador.

**B — Preparado para el proveedor, pendiente de validación real autorizada:**

- Llamada real a OpenAI Chat Completions con herramientas: el mapeo de petición y respuesta está implementado y probado contra el formato, pero **no se ha llamado al proveedor**.
- **La comprensión generativa real NO está demostrada.** Los dobles de prueba repiten guiones y no entienden nada. La calidad de las respuestas, la elección de herramientas por un modelo real, el seguimiento de la política y la resistencia a instrucciones incrustadas con un modelo real están **sin verificar**.
- Almacén persistente: la interfaz está definida (`get/set/setIfAbsent/rate/fail/reserve/settle/snapshot`) y probada en memoria. **No hay adaptador a un almacén real** porque el proveedor de almacén es una decisión del propietario. Sin él, la función desplegada responde 503 `store-not-configured`.

**C — Verificado con modelo real:** **nada**. No hay autorización para esa prueba.

## 5. Qué falta autorizar o decidir (propietario) para la prueba real (C)

1. **Proveedor y modelo de texto.** Propuesta: OpenAI Chat Completions con un modelo pequeño con *function calling*.
2. **Clave propia.** Una clave de un **proyecto OpenAI separado** solo para el asistente, con **límite de gasto mensual duro en el panel del proveedor**, guardada como `RUBIK_ASSISTANT_PROVIDER_KEY` **solo en Preview**. Debe ser distinta de la de Render IA.
3. **Saldo real.** Verificar el saldo de la cuenta. Los 10 USD históricos con recarga automática desactivada **no se pueden dar por disponibles**.
4. **Tarifa y tope.** La tarifa vigente verificada con su fecha (`RUBIK_ASSISTANT_PRICE_*`) y el tope de validación, por ejemplo 1 USD (`RUBIK_ASSISTANT_BUDGET_CAP_USD`).
5. **Almacén persistente atómico** (por ejemplo Upstash Redis o Vercel KV desde Marketplace) y el adaptador de la interfaz definida: es un trabajo corto. Sin él no hay tope global garantizado entre instancias.
6. **Código de acceso** `RUBIK_ASSISTANT_TOKEN` en Preview. Es un control provisional; **GOV-06a** (sesiones, tenants, roles, cuotas por profesional y proyecto) sigue pendiente y es requisito antes de Production.
7. **Texto de consentimiento y política de datos.** Revisión del texto del consentimiento y de la retención del proveedor (`store:false` ya se envía).
8. **Presupuesto común de imágenes y texto.** Conectar Render IA (`api/render.js`) al mismo libro de gasto, familia `image`. No se ha tocado `api/render.js`.
9. **Protocolo de la prueba C.** Una batería fija de 20–30 preguntas reales en ES/EN/ZH sobre un proyecto sintético, sin datos de clientes. Medir herramientas usadas, fundamento de cifras, resistencia a instrucciones incrustadas, propuestas correctas y coste por turno, con el tope de validación.

## 6. Relación con CAT-04

- Esta rama se **apila** sobre #237 y usa sus herramientas de solo lectura (`list_catalog_products`, `get_placed_products`, `get_visual_references`) sin duplicarlas.
- No modifica los núcleos de CAT-04. En `js/assistant-ui.js` (compartido con CAT-04) añade solo el enganche del modo IA y el borrado del historial.
- Orden de integración propuesto: #237 primero, después esta PR.

## 7. Dictamen

**NO hemos alcanzado todavía la meta generativa.** RUBIK tiene la capacidad **implementada y verificada sin gasto (A)** y **preparada para el proveedor (B)**:

- un agente con modelo real;
- una pasarela segura cerrada por defecto;
- herramientas reales de RUBIK en lista blanca;
- propuestas reversibles;
- control de gasto, consentimiento e interfaz integrada.

La comprensión generativa con un modelo real **no está demostrada (C)**. Depende de las autorizaciones del §5 y de la prueba controlada. La Home (HOM-03) **no debe anunciar** un asistente de IA generativa hasta superar la prueba C.
