# Asistente generativo RUBIK (rubik-agent/1 · rubik-assistant/2) — diseño, estado y dictamen

**Estado:** Draft · **NO MERGE · NO PRODUCTION · NO ACTIVACIÓN DE PROVEEDORES · STOP_GASTO**.
**Rama:** `feat/assistant-generative-v3`, apilada sobre CAT-04 (#237, `feat/cat-04-catalog-budget-assistant`). Se apila para reutilizar las herramientas de catálogo, partidas y referencias visuales de CAT-04 sin duplicarlas. Si CAT-04 cambia, esta rama se actualiza por merge.

## 1. Qué cambia para el profesional

El panel «Asistente» tiene dos modos: **Consulta guiada** (AG-0…AG-5, sin modelo, como hasta ahora) y **Conversación con IA**.

En «Conversación con IA»:

- Se escribe en lenguaje natural, sin comandos: «Estoy diseñando un salón para un cliente: revisa la distribución y dime qué mejorarías», «¿qué sofá de Mis catálogos encaja en el salón y cuánto supondría?» o «explícame por qué el presupuesto está incompleto antes de entregarlo».
- Un **modelo de lenguaje real** interpreta la pregunta y **consulta RUBIK** con sus herramientas reales. Cada respuesta muestra qué se consultó: «Consultado en RUBIK: presupuesto · estancias».
- Las cifras salen de RUBIK. Una **comprobación parcial** avisa si el modelo escribe una cifra que no aparece en lo consultado: «⚠ Cifras que no aparecen en los datos consultados en RUBIK». Los importes deben coincidir con campos monetarios. **No certifica** a qué partida se atribuye cada cifra, y la interfaz lo dice.
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
| Reserva del peor caso con **cota por bytes UTF-8** (H-TOK; sustituye a la heurística `length/3`, que fallaba en 4 de 8 casos adversarios medidos con o200k/cl100k) antes de llamar; liquidación con `usage`; peor caso si el uso es desconocido o el proveedor no responde; 4xx sin cargo | servidor | probado (doc 04 §4) |
| **Disyuntor**: un uso por encima de lo reservado o de `max_completion_tokens` detiene todas las llamadas siguientes hasta revisión | servidor | probado |
| Idempotencia (no hay segunda llamada con la misma clave) y límite por minuto | servidor | probado |
| Almacén persistente atómico (Redis, scripts Lua) con **tope común** `text` + `image`, registro sin contenido y conciliación con la factura (`api/_spend-ledger.js`) | servidor | probado sobre **Redis real local** con concurrencia; **no contratado**; Render IA aún no anota (doc 02 §4) |
| Consentimiento explícito (pregunta + datos del proyecto) en el navegador y en el servidor | ambos | probado |
| `store:false` al proveedor | servidor | probado |
| Registro: una línea sin cuerpo, pregunta, proyecto, código, clave, IP ni agente | servidor | probado |
| Sin elegir la IA, 0 peticiones a `/api/` | navegador | probado |

## 4. Clasificación A / B / C

**A — Implementado y verificado sin gasto:**

- **Orquestador de agente:** bucle, lista blanca, validación de argumentos, minimización, memoria, límites, cancelación y consentimiento. Incluye la comprobación parcial de cifras con oráculos de presupuesto y su límite declarado.
- **Pasarela:**
  - todas sus puertas;
  - la cota de tokens por bytes, con evidencia de tokenizadores reales;
  - el disyuntor;
  - reserva y liquidación, idempotencia, límite, estado sin secretos y registros sin contenido.
  - Se prueba con un proveedor falso en el **formato real** de Chat Completions.
- **Cadena completa** agente → pasarela → proveedor falso → herramientas reales de RUBIK.
- **Almacén persistente y libro común** sobre un **Redis real local**: atomicidad con 20 conexiones simultáneas y conciliación.
- **Interfaz en el editor real** con un doble rotulado (4 pruebas de navegador).
- **Protocolo de la prueba C** (30 preguntas ES/EN/ZH): el arnés está validado. La referencia pasa 30/30 y el simulador defectuoso se detecta en 30/30.
- **La consulta guiada sigue intacta.**

**B — Preparado, pendiente de validación real autorizada:**

- La llamada real al proveedor de texto: el mapeo está implementado, pero **no se ha llamado**.
- **La comprensión generativa real NO está demostrada.** Los simuladores no entienden nada.
- El almacén en la nube (Upstash Redis): el adaptador REST está implementado, pero **no hay base creada**.
- El presupuesto común efectivo: Render IA aún no anota en el libro (PR aparte, doc 02 §4).
- El texto de consentimiento y la evaluación de privacidad: **para revisión** (doc 03).

**C — Verificado con modelo real:** **nada**. Requiere un GO separado.

## 5. Estado de las decisiones (propietario, coordinación del 2026-11-15)

1. **Proveedor de texto:** OpenAI *se puede estudiar*; **no hay ningún modelo ni clave autorizados** para llamadas reales.
2. **Saldo:** los 10 USD históricos **no se dan por disponibles**.
3. **1 USD:** es solo una **propuesta** de presupuesto de prueba, **no una autorización de gasto**.
4. **Almacén:** investigado y documentado (doc 02). Recomendación: Upstash Redis del Marketplace, solo en Preview. **No se ha contratado ni activado.**
5. **Presupuesto común Render IA + Asistente:** libro y conciliación implementados (doc 02). Falta integrar `api/render.js` (PR aparte).
6. **Consentimiento y privacidad:** preparados para revisión (doc 03).
7. **Prueba C:** 30 preguntas sintéticas y un protocolo validado con simuladores (doc 04). **No se ejecuta** contra proveedores reales sin GO.
8. **Production:** bloqueado por **GOV-06a** y las demás condiciones de seguridad.

## 6. Relación con CAT-04

- Esta rama se **apila** sobre #237 y usa sus herramientas de solo lectura (`list_catalog_products`, `get_placed_products`, `get_visual_references`) sin duplicarlas.
- No modifica los núcleos de CAT-04. En `js/assistant-ui.js` (compartido con CAT-04) añade solo el enganche del modo IA y el borrado del historial.
- Orden de integración propuesto: #237 primero, después esta PR.

## 7. Dictamen

**NO hemos alcanzado todavía la meta generativa.** La infraestructura está **implementada y verificada sin gasto (A)**:

- agente;
- pasarela cerrada por defecto;
- cota verificable con disyuntor;
- almacén atómico y libro común;
- comprobación parcial de cifras con sus límites;
- interfaz;
- protocolo C validado.

La comprensión generativa con un modelo real **no está demostrada (C)**. Las pruebas con simuladores **no deben confundirse** con comprensión. La Home (HOM-03) **no debe anunciar** un asistente de IA generativa hasta superar la prueba C con los umbrales del doc 04.
