# RUBIK SOTA — Reparto corregido: Claude Code 2 = FT3D-8V; ChatGPT = Asistente IA
**Fecha:** 2026-11-05 · **Estado:** CÓDIGO AISLADO + ENCARGO NUEVO · **SIN MERGE, SIN PRODUCCIÓN**.

## CORRECCIÓN EXPRESA DEL REPARTO (05/11/2026)

**El reparto anterior Claude Code 2→AG-1 y ChatGPT→FT3D-8V fue erróneo y queda anulado.** El propietario ha decidido que **Claude Code 2, cuenta nueva sin contexto, DESARROLLE FT3D-8V** sobre el núcleo ya creado; **ChatGPT + propietario DESARROLLEN ASISTENTE IA AG-1**. Los responsables anteriores Claude original (Entregas) y Kimi (fidelidad visual) no cambian. **No merge, no producción ni APIs pagadas**.

El documento de incorporación completo para Claude Code 2 está en [la rama FT3D-8V](https://github.com/Juanmaes83/floorplan-3d/blob/feat/ft3d-8v-schedule-core-2026-11-05/docs/product/claude-code-2-ft3d8v-onboarding-y-encargo-2026-11-05.md); contiene enlaces al repo MIT [Flat-to-3D Schedule Build](https://github.com/Sam1983Aing/flat-to-3d/tree/main/05-schedule-build), su [demo](https://sam1983aing.github.io/flat-to-3d/05-schedule-build/?dir=a), Frappe Gantt, 4DBIM, documentos del proyecto y estado de los 73 tests aprobados.

## Decisión del propietario
El propietario ya dispone de una segunda cuenta de Claude Code. Se acuerda **desarrollar y validar módulos en paralelo**, con **integración posterior exclusivamente por aprobación expresa** cuando Claude Code original y Kimi Code terminen sus cortes en curso. Esta decisión modifica el bloqueo anterior de *no empezar a programar en ningún frente*: **sí está autorizado desarrollar en ramas aisladas sin solapamientos**, pero siguen prohibidos merges, cambios en `master`, despliegue de producción y uso de API de pago sin aprobación.

## Tabla de propietarios y ramas

| Frente | Propietario propuesto | Rama y archivos de propiedad | Estado (05/11) |
| --- | --- | --- | --- |
| Entregas, cliente 3D y cortes pendientes | Claude Code original | PR #166 y su propio ámbito | trabajando; no tocar |
| Fidelidad visual / Visual Families | Kimi Code | su rama y PR asociadas cuando las confirme | trabajando; no tocar |
| FT3D-8V cronograma + presupuesto | **Claude Code 2 (segunda cuenta)** | [`feat/ft3d-8v-schedule-core-2026-11-05`](https://github.com/Juanmaes83/floorplan-3d/tree/feat/ft3d-8v-schedule-core-2026-11-05) | **núcleo implementado (por ChatGPT), CI verde; Claude Code 2 asume auditoría y evolución** |
| Asistente de lectura AG-1 | **ChatGPT + propietario** | [`feat/agent-ai-ag1-readonly-2026-11-05`](https://github.com/Juanmaes83/floorplan-3d/tree/feat/agent-ai-ag1-readonly-2026-11-05) | **núcleo de herramientas y tests escritos en rama propia; ChatGPT desarrolla y valida, no Claude 2** |
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

**Próximo corte FT3D-8V, ASIGNADO A CLAUDE CODE 2 (sin solapar Claude original):** adaptador de Gantt de solo lectura, fixtures de planificación de reforma y vivienda, estado visual por elemento en estructura independiente; desarrollar interfaz únicamente cuando Claude termine Entregas y exista integración sin conflictos. La capa de datos real precede a cualquier promesa de calendario final.

## Asistente AG-1: desarrollo por ChatGPT + propietario

La rama [`feat/agent-ai-ag1-readonly-2026-11-05`](https://github.com/Juanmaes83/floorplan-3d/tree/feat/agent-ai-ag1-readonly-2026-11-05) es **de ChatGPT**. El antiguo brief `assistant-ai-ag1-brief-claude-code-2-2026-11-05.md` se ha sustituido por un aviso de corrección. Primer alcance: herramientas puras de consulta del proyecto y cantidades/presupuestos, sin LLM ni API facturable, con pruebas y CI propias. **Claude Code 2 no debe editar esta rama.**

## Condiciones de integración futura

1. Claude original confirma sus dos cortes, proporciona SHA, CI y evidencias.
2. Kimi entrega su trabajo, SHA y evidencias con aceptación humana pendiente donde proceda.
3. **Claude 2 entrega FT3D-8V**, mientras **ChatGPT entrega AG-1** con CI y QA independientes, sin rebase destructivo.
4. Integrador construye **una matriz de conflictos de archivos/contratos** y valida la combinación real en rama de integración separada creada sólo con OK del propietario.
5. Se ejecutan navegador, móvil, seguridad, costes y regresión B2/B8, Story y C1–C4.
6. Sólo entonces el propietario autoriza merges individualmente. **Ninguna integración automática**.

**Última precisión:** los dos módulos se han desarrollado/planteado desde ramas derivadas del master del 05/11. A medida que evolucione master, deben comprobarse cambios recientes antes de mezclar. La rama AG-1 todavía **no** equivale a un asistente conversacional funcional.
