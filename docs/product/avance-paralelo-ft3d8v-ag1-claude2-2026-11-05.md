# RUBIK SOTA — Avance paralelo autorizado: FT3D-8V y Asistente AG-1
**Fecha:** 2026-11-05 · **Estado:** CÓDIGO AISLADO + ENCARGO NUEVO · **SIN MERGE, SIN PRODUCCIÓN**.

## Decisión del propietario
El propietario ya dispone de una segunda cuenta de Claude Code. Se acuerda **desarrollar y validar módulos en paralelo**, con **integración posterior exclusivamente por aprobación expresa** cuando Claude Code original y Kimi Code terminen sus cortes en curso. Esta decisión modifica el bloqueo anterior de *no empezar a programar en ningún frente*: **sí está autorizado desarrollar en ramas aisladas sin solapamientos**, pero siguen prohibidos merges, cambios en `master`, despliegue de producción y uso de API de pago sin aprobación.

## Tabla de propietarios y ramas

| Frente | Propietario propuesto | Rama y archivos de propiedad | Estado (05/11) |
| --- | --- | --- | --- |
| Entregas, cliente 3D y cortes pendientes | Claude Code original | PR #166 y su propio ámbito | trabajando; no tocar |
| Fidelidad visual / Visual Families | Kimi Code | su rama y PR asociadas cuando las confirme | trabajando; no tocar |
| FT3D-8V cronograma + presupuesto | ChatGPT + GitHub | [`feat/ft3d-8v-schedule-core-2026-11-05`](https://github.com/Juanmaes83/floorplan-3d/tree/feat/ft3d-8v-schedule-core-2026-11-05) | **corte puro implementado, CI verde** |
| Asistente de lectura AG-1 | Claude Code 2 (segunda cuenta) | [`feat/agent-ai-ag1-readonly-2026-11-05`](https://github.com/Juanmaes83/floorplan-3d/tree/feat/agent-ai-ag1-readonly-2026-11-05) | rama y brief listos; ejecución de Claude 2 no iniciada desde esta conversación |
| Aceptación e integración | propietario + agentes tras revisiones | a decidir en coordinación | **NO AUTORIZADO** |

## FT3D-8V: hechos comprobados

**Base:** `master@0f9c6ead9732901681498efec326d1ca92e42ffe`.
**Archivos añadidos, sin modificar código existente:**
- [`js/construction-schedule-core.js`](https://github.com/Juanmaes83/floorplan-3d/blob/feat/ft3d-8v-schedule-core-2026-11-05/js/construction-schedule-core.js) (núcleo puro).
- [`tests/construction-schedule-core.test.cjs`](https://github.com/Juanmaes83/floorplan-3d/blob/feat/ft3d-8v-schedule-core-2026-11-05/tests/construction-schedule-core.test.cjs) (11 tests).
- [`.github/workflows/ft3d-8v-schedule-core.yml`](https://github.com/Juanmaes83/floorplan-3d/blob/feat/ft3d-8v-schedule-core-2026-11-05/.github/workflows/ft3d-8v-schedule-core.yml).

**CI ejecutada:** [Actions #41996551881](https://github.com/Juanmaes83/floorplan-3d/actions/runs/41996551881) — completada `success`, **73 tests passed, 0 failed** en nuevos tests + tests existentes de presupuesto y Story. HEAD validado de la rama: `c07a932b7097c0a8a91bf31a0757805b9bb490cf`.

**Contrato implementado:**
- `ConstructionSchedule` versión 0.1.0 con IDs, revisión del proyecto, tareas, fechas reales, WBS, dependencias, fuente y revisión profesional.
- Rechaza fechas imposibles, ciclos, tareas duplicadas, apropiación doble de elementos visuales o partidas presupuestarias.
- `stateAt(date)` es **puro, determinista y reversible**: devuelve inicio/en curso/terminado y datos para el visor; **no toca el visor**.
- `ganttRows()` devuelve fechas y dependencias del plan declarado sin inventar duraciones.
- `budgetReport(schedule,budget,FloorPlanBudget)` usa **exclusivamente C1–C4**; no transforma desconocido a 0, mantiene precio no revisado como no verificado y lista partidas sin asignar.
- No usa OpenAI, no incurre en gasto variable, no escribe geometría/proyecto ni presupuesto.

**No implementado todavía:** importación de Frappe Gantt, reproducción visual Three.js, unión de elementos concretos del visor, UI profesional para calendario, vídeo de obra, permisos/roles y revisión móvil. Estado: **núcleo validado; integración visual pendiente.**

**Próximo corte FT3D-8V (para revisión, sin solapar Claude):** adaptador de Gantt de solo lectura, fixtures de planificación de reforma y vivienda, estado visual por elemento en estructura independiente; desarrollar interfaz únicamente cuando Claude termine Entregas y exista integración sin conflictos. La capa de datos real precede a cualquier promesa de calendario final.

## Asistente AG-1: instrucción para Claude Code 2

Leer el [brief listo en su propia rama](https://github.com/Juanmaes83/floorplan-3d/blob/feat/agent-ai-ag1-readonly-2026-11-05/docs/product/assistant-ai-ag1-brief-claude-code-2-2026-11-05.md). Define herramientas autorizadas, archivos propios, aceptación, privacidad, no mutación y CI. Claude 2 debe trabajar **exclusivamente** en su rama, sin generar llamadas API, sin tocar `index.html`, Entregas, presupuesto original, Render IA o visor. Entregar SHA, pruebas y resultados; la integración del modelo LLM remoto y propuestas de escritura quedan para otro corte autorizado.

## Condiciones de integración futura

1. Claude original confirma sus dos cortes, proporciona SHA, CI y evidencias.
2. Kimi entrega su trabajo, SHA y evidencias con aceptación humana pendiente donde proceda.
3. Claude 2 entrega AG-1 y QA; FT3D-8V conserva CI y QA sin rebase destructivo.
4. Integrador construye **una matriz de conflictos de archivos/contratos** y valida la combinación real en rama de integración separada creada sólo con OK del propietario.
5. Se ejecutan navegador, móvil, seguridad, costes y regresión B2/B8, Story y C1–C4.
6. Sólo entonces el propietario autoriza merges individualmente. **Ninguna integración automática**.

**Última precisión:** los dos módulos se han desarrollado/planteado desde ramas derivadas del master del 05/11. A medida que evolucione master, deben comprobarse cambios recientes antes de mezclar. La rama AG-1 todavía **no** equivale a un asistente conversacional funcional.
