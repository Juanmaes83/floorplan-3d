# AG-1 — Asistente IA RUBIK: estado de ejecución y próximos cortes
**5 noviembre 2026 · responsable: ChatGPT + propietario · rama aislada `feat/agent-ai-ag1-readonly-2026-11-05`**.

## 1. Resultado comprobado AG-1: SÍ implementado (núcleo de solo lectura)

- `js/assistant-domain-tools-core.js` — despachador determinista de **solo lectura**, sin DOM, sin red y sin credenciales.
- `tests/assistant-domain-tools-core.test.cjs` — **12 pruebas nuevas**.
- `.github/workflows/agent-ag1-readonly.yml` — nuevo CI.
- **Evidencia:** [GitHub Actions #42000333863](https://github.com/Juanmaes83/floorplan-3d/actions/runs/42000333863), **79 tests passed, 0 failed**, incluyendo tests actuales de presupuestos y cantidades de RUBIK.
- Ningún archivo funcional previo de RUBIK fue modificado; no hay cambios de `master`, PR merge ni despliegue.

### Herramientas implementadas

| Herramienta | Origen autoritativo | Resultado |
| --- | --- | --- |
| `list_capabilities` | registro cerrado de herramientas | solo lectura, sin proveedor conectado |
| `get_project_summary` | proyecto FloorPlanProjectV1 | identificadores/revisión/conteos básicos |
| `list_rooms` | proyecto FloorPlanProjectV1 | IDs, nombres, familias |
| `get_room` | `FloorPlanQuantities.room` | área y perímetro con estatus medido/estimado |
| `get_quantities` | `FloorPlanQuantities.home` | cantidades agregadas con evidencia, no precios |
| `get_budget_summary` | `FloorPlanBudget.calculateBudget` | totales, estado de revisión, faltantes, importes desconocidos como null |
| `get_layout_review` | `FloorPlanLayoutReview.review` | hallazgos reales de huella 2D, límites explicados |

**Gates ya probados:** lista blanca de herramientas/argumentos, rechazo de ID inexistente, rechazo de presupuesto de otro proyecto, error de revisión obsoleta, entrada malformada, texto de habitación que intenta dar instrucciones, ausencia de mutaciones, costes desconocidos `null` y precios sin revisar. Los tests son de núcleo de dominio, no auditoría de penetración ni autorización de producción.

## 2. Qué NO está implementado todavía

- Conversación con LLM o interfaz en el editor.
- Clave de API de texto, proveedor, endpoint, usuario autenticado y permisos empresariales.
- Control de facturación, cuotas, telemetría de tokens, selección de modelo.
- Propuestas de cambio, simulación, confirmación y Undo.
- Integración con Render IA/B2/B8 o CAT-IA.
- Acceso controlado a proyectos de un usuario desde servidor.

**Importante:** `expectedProjectId` y `expectedRevision` son verificaciones defensivas de un contexto **proporcionado por la aplicación**; **no son autenticación**. Nadie debe exponer estas funciones como API pública ni aceptar el contexto de proyecto sin control del servidor y permisos.

## 3. Proceso de desarrollo con metodología similar a Render IA (pendiente de autorización por corte)

**AG-2A — Diseño de flujo de conversación y costes, sin llamadas pagadas**
- Elegir endpoint/modelo de texto según documentación vigente del proveedor y pruebas de acceso; **no asumir que la clave restringida para imágenes tiene permiso de texto**.
- Autenticación de servidor y segregación por proyecto/organización.
- Lista blanca de acciones AG-1 y validación servidor de argumentos.
- Definir límites de tokens, gasto por llamada, gasto diario/proyecto y respuesta de error controlada.
- Registrar ID de solicitud, modelo, tokens/uso retornado, duración, error, importe estimado/conciliado, sin contenido privado ni API key.
- Diseñar selector de proyecto/contexto, consentimiento para enviar datos de proyecto y estados de revisión de presupuesto.
- Una **prueba mock** de extremo a extremo y tests de prompt injection sin API externa.

**AG-2B — Primer ensayo real con presupuesto explícito**
- Requiere OK del propietario para las llamadas facturables y su límite máximo, credencial separada de imágenes y autorización en entorno Preview.
- Probar consultas simples: «¿Cuántas habitaciones hay?», «¿Qué superficie tiene esta estancia?», «¿Cuál es el presupuesto revisado?» con datos de fixture.
- Comparar información devuelta con motores canónicos y diferenciar fuente `measured/estimated/unavailable`.
- Medir el coste real por solicitud, tiempo, tokens y calidad; detener ante cuota o errores.

**AG-3 — Propuestas de cambios reversibles**
- Solo operaciones tipadas ya autorizadas (p.ej. acabados), descripción de `diff`, previsualización, rechazo, confirmación explícita y Undo de herramienta existente.
- No editar geometría ni presupuestos desde un texto no validado.

**AG-4/5 — Orquestación de servicios de imagen y entrega**
- Reutilizar B2/B8, FOT-01, CAT-IA y FT3D-8 cuando estén implementados y validados.
- Cada generación o lote debe mostrar coste antes de confirmar; no invocar por decisión autónoma del modelo.

## 4. Separación de agentes y condiciones de integración

**Claude Code 2** trabaja exclusivamente FT3D-8 en `feat/ft3d-8v-schedule-core-2026-11-05`, con [onboarding autocontenido](https://github.com/Juanmaes83/floorplan-3d/blob/feat/ft3d-8v-schedule-core-2026-11-05/docs/product/claude-code-2-ft3d8v-onboarding-y-encargo-2026-11-05.md). La asignación anterior Claude2→AG-1 queda anulada.

Claude original sigue Entregas, y Kimi fidelidad visual. Se puede validar en ramas aisladas, pero **no fusionar, desplegar ni gastar API sin OK expreso**. Cuando terminen los trabajos en curso, revisar diffs, compatibilidad y regresión conjunta.

## 5. Próxima decisión del propietario

Aceptar o modificar el alcance **AG-2A**, que permitiría crear un backend seguro y un simulador de conversaciones **sin consumir todavía crédito OpenAI**. La prueba real AG-2B requerirá autorización específica y límite económico.

**No anunciar en la Home V2 «Asistente conversacional disponible».** Hasta aquí AG-1 ofrece **herramientas de lectura validadas**, no conversación LLM.
