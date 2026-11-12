# OBR-02 + OBR-03 — Siguiente tarea en fantasma, «% del plan» y coste planificado a la fecha (ola 2e)

**Fecha:** 12-11-2026 · **Rama:** `lab/obr02-obr03-planned-4d` · **Origen:** `master@eae8cf6` · **Coordinación:** issue #206.

**Catálogo:**
- `OBR-02 | Vista previa en fantasma de la siguiente tarea real`;
- `OBR-03 | Anillo «% del plan» y coste planificado a la fecha, rotulado como planificado` (dependencia: C1–C4 vinculado).

**Condiciones de la auditoría** (`auditoria-4-pdf-referencias-ui-ux-2026-11-09.md` E2/E3; `auditoria-oportunidades-ux-servicios-2026-11-09.md` UX-19/UX-20):
- fantasma solo sobre estados reales del plan;
- anillo y coste solo con plan y C1–C4 vinculados;
- siempre «planificado», nunca «ejecutado».

No se crean IDs ni se cambian olas. **Se construye sobre FT3D-8: no hay un segundo plan.**

## Qué hace (en la Evolución, panel «Plan a la fecha»)

| Requisito | Cómo |
|---|---|
| Fantasma de la siguiente tarea planificada | Las tareas que empiezan en la **primera fecha posterior** al día mostrado (varias si coinciden, por WBS). Sus elementos se ven con **las aristas del propio elemento** (las mismas del estado «sin tarea»), en azul y a través de lo construido. Sin geometría nueva. Se puede apagar. |
| Identificación y dependencias | WBS, título, fechas, duración, «en N días» y dependencias **declaradas** (FS/SS/FF/SF y desfase), con el estado **planificado** de cada predecesora. «Ver en el plan» selecciona la tarea en el Gantt existente. |
| Anillo «% del plan» | `Σ(avance planificado × duración) / Σ duración`. El avance de cada tarea es el de `FloorPlanConstructionSchedule.stateAt`, la autoridad que ya usa la Evolución. Rótulo: **planificado**. |
| Coste planificado a la fecha | Solo con el reparto C1–C4 que ya calcula la Evolución (`budgetReport`: presupuesto del mismo sujeto y asignaciones a partidas existentes). Es `Σ importe asignado × avance planificado`, con un **reparto lineal por días rotulado como supuesto**. Sin enlace: **«No disponible»** con el motivo del adaptador existente, **nunca 0**. Con partidas sin importe en tareas empezadas: **parcial**, con el importe conocido. |
| Planificado / ejecutado / desconocido | Ejecutado: siempre **«sin registrar»** (el contrato reserva `executionRecords`). Desconocido = `null` y «No disponible» o «parcial», nunca una cifra. |
| Tareas canceladas y sin fechas | El contrato 0.2.0 **exige fechas** y **no tiene estado «cancelada»**. Se ha visto un **defecto real** (ver abajo); ahora un plan con esos estados no calcula nada y no se puede importar. Las tareas sin fechas ya las rechaza el validador y el panel dice «No disponible». |
| Actualización reproducible | Mismo plan, presupuesto y fecha dan el mismo resultado. Cada resultado lleva la **huella del plan** (`planKey`): si cambia el plan, se recalcula y la siguiente tarea se mueve, como comprueban las pruebas. |
| Lo que ve el cliente | **Sin panel y sin fantasma** en modo captura y **durante la grabación del vídeo**: se quita antes del primer cuadro y vuelve al terminar o cancelar. |

## Defecto encontrado y corregido

**Tareas «canceladas» contadas como planificadas.**
- `S.parse`/`S.validate` (contrato 0.2.0) **descartan en silencio** cualquier campo que no conocen. Un plan importado con `"status":"cancelled"` en una tarea se mostraba en la Evolución (Gantt, 4D y reparto de costes) **como trabajo planificado**, sin aviso.
- Ahora la importación de la Evolución **rechaza** ese plan con un mensaje claro, usando la misma detección del núcleo (`unsupportedStates`).
- El contrato canónico no se toca: añadir un estado «cancelada» al contrato es decisión de ChatGPT, que tendría que propagarlo a `construction-plan-ui`, al Gantt y al reparto.

## Cambios

| Archivo | Tipo | Nota |
|---|---|---|
| `js/construction-plan-preview-core.js` | Nuevo, puro (UMD) | Siguiente tarea, % del plan, coste planificado, motivos y huella. Reutiliza el plan 0.2.0 y su `budgetReport`. |
| `evolucion/plan-preview-ui.js` | Nuevo, FT3D-8 | Panel y fantasma. Se engancha al evento existente `ft3d8-moment`; no vuelve a evaluar ni el plan ni el presupuesto. |
| `evolucion/project-scene.js` | FT3D-8 | `setPreview(keys)` y `preview` (aristas existentes con otro material). No toca las líneas que cambia #207, aunque sí la misma región (ver «Integración»). |
| `evolucion/fidelity-app.js` | FT3D-8 | El analizador de planes importados rechaza estados ajenos al contrato. |
| `evolucion/index.html` | FT3D-8 (no es el `index.html` reservado de la raíz) | 2 líneas: el núcleo y el módulo del panel. |
| `tests/obr02*`, `.github/workflows/obr02-obr03-plan-4d.yml` | Pruebas y CI | Gate propio. |

**No se toca:**
- el `index.html` raíz, `professional-workspace-ui.js`, `delivery-*` y las API;
- el contrato del plan (`construction-schedule-core.js`), el adaptador ni el presupuesto;
- Vercel ni las PR #201–#209.

## Pruebas ejecutadas (local)

| Suite | Resultado |
|---|---|
| `obr02-obr03-plan-preview-core` (núcleo) | 14/14 |
| `obr02-obr03-plan-preview.browser` (escritorio, móvil vertical y horizontal, grabación real cancelada, cambio de plan, tarea cancelada, captura) | 9/9 |
| Regresión FT3D-8 | REGRESION |

**Casos adversariales:**
- antes del plan y después del final;
- monotonía día a día contra `stateAt`;
- reparto de otro plan;
- sin asignaciones;
- partidas sin importe en tareas empezadas (parcial);
- edificio sin reparto;
- proyecto sin plan;
- tarea sin `endDate`;
- fecha no válida;
- tarea «cancelada» en el núcleo y en la importación;
- tareas gemelas el mismo día;
- tarea en curso que no es «siguiente»;
- plan retrasado 7 días;
- grabación de vídeo cancelada con el fantasma activo;
- modo captura.

## Evidencias

En `evidencias/`, con `manifest.json` y SHA-256. En escritorio 1440×900 y en móvil 390×844:

1. A, con la cubierta (siguiente tarea) en fantasma;
2. A avanzado, con el coste planificado;
3. B, con el coste «No disponible» (edificio).

## Derechos y procedencia

Solo las fixtures sintéticas FT3D-8 de laboratorio (`labs/ft3d-8/fidelity-fixtures.js`, con precios de tarifa marcados FIXTURE). Ni datos reales, ni secretos, ni servicios externos, ni dependencias nuevas.

## Recorrido humano (5 min)

1. Abre la Preview en `/evolucion/index.html?lab=1&case=A` y pulsa «Ver evolución».
2. Arriba a la derecha está **Plan a la fecha**. Mueve la barra de tiempo: el anillo y el coste crecen, y siempre pone **planificado** y **Ejecutado: sin registrar**.
3. La **siguiente tarea** aparece en azul en la escena (con la cubierta, el contorno del tejado). Pulsa «Ver en el plan»: se selecciona en el Gantt.
4. Cambia a `case=B`: el coste dice **No disponible** y explica por qué. Nunca pone 0 €.
5. En el móvil, el anillo está plegado abajo a la izquierda. Tócalo para abrirlo.

## Pendiente y decisiones para ChatGPT

- **Integración con #207 (OBR-01):** las dos tocan `evolucion/project-scene.js`. #207 cambia el `pick` y las líneas del objeto devuelto (`load,…,hitsAt` y `setAuto`); esta PR añade `setPreview` dentro de `setState` y en la **última** línea del objeto devuelto. Son zonas distintas, pero conviene integrar #207 primero y rebasar esta encima.
- **Contrato del plan:** decidir si se añade un estado «cancelada» al contrato. Hoy se rechaza al importar.
- **Editor de planes del producto** (`construction-plan-ui`, que no se toca): ya guarda planes validados sin estados ajenos.
- **Catálogo:** marcar OBR-02 y OBR-03 es decisión de integración. Este estado es «hecho en la Evolución, sin validación humana».
