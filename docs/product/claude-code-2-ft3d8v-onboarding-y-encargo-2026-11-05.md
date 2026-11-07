# CLAUDE CODE 2 — ONBOARDING COMPLETO Y ENCARGO FT3D-8V (RUBIK SOTA)
**Fecha:** 5 noviembre 2026 · **Responsable:** NUEVA cuenta Claude Code (sin contexto previo) · **Estado:** desarrollo exclusivamente en rama aislada, NO MERGE / NO PROD.

> **LEE ESTE DOCUMENTO ENTERO ANTES DE EDITAR.** Trabajas en una aplicación arquitectónica existente y **ya hay trabajo completado de FT3D-8 en esta misma rama**. No comiences otra implementación redundante ni reproduzcas la casa del donante como si fuera RUBIK.

## 0. Identidad, objetivo y autorizaciones

- **Producto:** RUBIK SOTA / FLOOR PLAN 3D CARACOLA, editor web 2D/3D de viviendas con análisis, mediciones, presupuestos y Entregas.
- **Repositorio principal:** https://github.com/Juanmaes83/floorplan-3d
- **Rama EXCLUSIVA DE TU TRABAJO:** `feat/ft3d-8v-schedule-core-2026-11-05`, URL https://github.com/Juanmaes83/floorplan-3d/tree/feat/ft3d-8v-schedule-core-2026-11-05
- **Base original:** `master@0f9c6ead9732901681498efec326d1ca92e42ffe`, verificar HEAD actual antes de escribir.
- **Este encargo**: analizar, **validar y completar** un núcleo real de tareas + calendario + costes C1–C4, que proporcione estados de animación reutilizables por un futuro visor de construcción. Después, preparar **interfaces/contratos** de Gantt y visual sin tocar la interfaz activa.
- **Lo que quiere el propietario:** construir visualmente una vivienda de **inicio → obra en curso → final**, con movimientos ilustrativos (no precisión física del montaje) sincronizados con un Gantt. **Fechas/tareas/presupuestos sí deben provenir de datos introducidos/verificados por el profesional.** Una demostración de 14 semanas no representa la realidad del proyecto.
- **No desarrollar el Asistente IA**: lo desarrolla ChatGPT en la rama `feat/agent-ai-ag1-readonly-2026-11-05`. Un encargo anterior que asignaba AG-1 a Claude Code 2 fue un ERROR de reparto y queda explícitamente anulado.
- **Agentes paralelos:** Claude Code original trabaja Entregas y sus últimos cortes (PR #166); Kimi Code trabaja fidelidad visual (p. ej. PR #167). **No tocar sus ramas ni archivos**.
- **Prohibido:** merge, tocar `master`, abrir PR de integración, activar auto-merge, Production/Preview, llamadas API de pago, credenciales, modificar otras ramas. Al finalizar, reportar SHA+tests y esperar OK del propietario.

## 1. LA REFERENCIA VISUAL QUE EL PROPIETARIO HA ELEGIDO

**Donante seleccionado — Schedule Build (MIT, Three.js):**
- Repositorio: https://github.com/Sam1983Aing/flat-to-3d
- Módulo concreto: https://github.com/Sam1983Aing/flat-to-3d/tree/main/05-schedule-build
- **Demo interactiva que debes abrir/estudiar:** https://sam1983aing.github.io/flat-to-3d/05-schedule-build/?dir=a
- README: https://github.com/Sam1983Aing/flat-to-3d/blob/main/05-schedule-build/README.md
- PROMPT/contrato visual: https://github.com/Sam1983Aing/flat-to-3d/blob/main/05-schedule-build/PROMPT.md
- Animación de casa y asociación a fases: https://github.com/Sam1983Aing/flat-to-3d/blob/main/05-schedule-build/house.js
- Cámara, vista y control: https://github.com/Sam1983Aing/flat-to-3d/blob/main/05-schedule-build/view.js
- CSS: https://github.com/Sam1983Aing/flat-to-3d/blob/main/05-schedule-build/sketch.css
- Otro ejemplo de time-lapse: https://github.com/Sam1983Aing/flat-to-3d/tree/main/04-build-time-lapse
- Licencia MIT: https://github.com/Sam1983Aing/flat-to-3d/blob/main/LICENSE

**Qué hace la demo:** una única semana controla simultáneamente el 3D y el Gantt, con partes de la construcción que aparecen y desaparecen, animación reversible, grúa/estructura/cubierta/acabados y controles de cámara. En `house.js` aparecen `PHASES`, `add(obj,phase,order,how)`, `update(week)`: 10 fases preconfiguradas en una demo de 14 semanas (inicio 2027-03-01). **No utilizar sus semanas, presupuesto ni modelo geométrico para un usuario RUBIK.**

**Qué se puede reutilizar legal/técnicamente:** patrones de estado temporal, asignación de elementos a tareas, coreografías, scrub, composición visual. Si reutilizas código concreto, debes conservar aviso MIT/atribución correspondiente; audita licencias y versiones de dependencias. **NO introducir un segundo Three.js ni sustituir el renderer de RUBIK.** Three.js usado por RUBIK (según auditoría previa): versión 0.160.0, donante 0.169.0.

**Para cronograma real:**
- Frappe Gantt, MIT, librería JS: https://github.com/frappe/gantt ; https://docs.frappe.io/gantt/introduction
- Patrones de estados y mapeo tarea↔elemento: 4DBIM, MIT: https://github.com/iman48HK/4DBIM ; https://github.com/iman48HK/4DBIM/blob/master/src/lib/schedule/simulation.ts ; https://github.com/iman48HK/4DBIM/blob/master/src/lib/schedule/mapping.ts
- Alternativa más rica: https://github.com/jsGanttImproved/jsgantt-improved (licencia a revisar antes de copiar).
- Otro ejemplo: https://github.com/ZeaInc/4d-schedule-viewer (motor diferente, inspiración, no dependencia directa).

**Selección propuesta, NO instalada:** técnicas visuales de Flat-to-3D + Frappe Gantt + patrón puro de 4DBIM + Three.js/Story/presupuestos RUBIK existentes. En el corte actual no es necesario instalar Frappe ni crear UI.

## 2. Documentación interna de RUBIK que debes estudiar

Repositorio principal, `master`, investigación original:
1. https://github.com/Juanmaes83/floorplan-3d/blob/master/docs/product/flat-to-3d-presentation-knowledge-programme-2026-10-30.md — FT3D-8 original, D16/D17/D18, diferido.
2. https://github.com/Juanmaes83/floorplan-3d/blob/master/docs/product/evidence/donor-cuts-2026-11-01/cut4-d16-d17-d18.md — análisis de demos.
3. https://github.com/Juanmaes83/floorplan-3d/blob/master/docs/product/ft3d-donor-global-reconciliation-2026-11-01.md — autoridad temporal y económica, MODEL D.
4. https://github.com/Juanmaes83/floorplan-3d/blob/docs/rubik-evolution-preparation-2026-11-04/docs/product/ft3d-8-planificacion-visual-obra-presupuesto-cronograma-2026-11-05.md — adenda de producto.
5. https://github.com/Juanmaes83/floorplan-3d/blob/docs/rubik-evolution-preparation-2026-11-04/docs/product/ft3d-8-repositorios-plan-visual-gantt-presupuesto-2026-11-05.md — auditoría de 7 repos y propuesta de integración.
6. https://github.com/Juanmaes83/floorplan-3d/blob/docs/rubik-evolution-preparation-2026-11-04/docs/product/rubik-traspaso-maestro-v2-2026-11-05.md — estado global, límites multiactor.

**Autoridades de código RUBIK a LEER, no editar en este corte:**
- `js/budget-core.js` y `tests/budget-core.test.cjs` — `FloorPlanBudget.calculateBudget()`, monedas, fuentes, revisiones y `null` cuando datos desconocidos.
- `js/quantity-core.js`, `js/quantity-schedule-core.js` — cantidades y mediciones reales C1; no se deduce dinero de píxeles.
- `js/presentation-story-core.js` y `tests/presentation-story.test.cjs` — estados visuales `stateAt(progress)` y reversibilidad.
- `js/presentation-ui.js` / Three.js — futura unión al visor, no editar hasta coordinación.
- `js/project-core.js`, `js/building-core.js` si existen en HEAD — autoridad geométrica (inspecciona rutas reales, no adivines).
- `js/brand-core.js`, `js/tour-video-ui.js` — futura identidad y exportación en Entregas.
- PR #166 https://github.com/Juanmaes83/floorplan-3d/pull/166 — Entregas en curso; **NO MODIFICAR**.

## 3. ¡NO REHAGAS EL NÚCLEO! Ya está escrito y con CI verde

**En TU rama ya existen:**
- `js/construction-schedule-core.js` — núcleo sin DOM, sin Three.js, sin API. Expone `create`, `validate`, `serialize`, `parse`, `bounds`, `stateAt(date)`, `ganttRows()`, `budgetReport(schedule,budget,FloorPlanBudget)`.
- `tests/construction-schedule-core.test.cjs` — 11 pruebas de fechas, ciclos, doble asignación, reversibilidad y C1–C4.
- `.github/workflows/ft3d-8v-schedule-core.yml`.
- **CI VERIFICADA:** https://github.com/Juanmaes83/floorplan-3d/actions/runs/41996551881 — 73 tests aprobados, 0 fallos (11 nuevos + regresiones de presupuesto y Story), commit `c07a932b7097c0a8a91bf31a0757805b9bb490cf`.

**Primero ejecuta estas pruebas por tu cuenta y AUDITA el código existente.** No borres ni rehagas estas piezas sin encontrar defectos concretos. Puedes corregirlas y ampliar tests dentro de esta rama, únicamente si mejora el contrato y mantiene pruebas.

**Límites actuales:**
- `stateAt` define progreso **planificado e ilustrativo**, no avance real certificado.
- `budgetReport` obtiene importes del presupuesto y distingue `null` de cero, pero requiere auditoría de `source/review/status`; la revisión humana del precio no equivale a certificación ejecutada.
- El plan no calcula CPM, capacidad de recursos ni fechas automáticamente.
- El contrato actual rechaza que dos tareas compartan la misma partida o elemento; examina si conviene mantener esta restricción de V1 o admitir asignación proporcional explícita sin doble contabilidad.
- El vínculo de revisión de proyecto con el presupuesto debe verificarse: C1–C4 puede no exponer revisión de proyecto en su contrato y, entonces, no afirmar revisión coincidente.
- La librería Gantt, la UI y las animaciones 3D **NO están integradas**.

## 4. TU TRABAJO CONCRETO — FT3D-8V primer corte real

### Corte FT3D8-01: auditoría y fortalecimiento del núcleo
1. Verifica que los contratos se ajustan a C1–C4; usa fixtures reales de los tests del repo.
2. Revisa datos falsos/indeterminados: fecha imposible, zona horaria, tareas con dependencias cíclicas, presupuesto de otro proyecto, partidas duplicadas/no asignadas, revisión incompleta, precios sin fuente, `null` y costes parcialmente conocidos.
3. Distingue formalmente **plan aprobado/estimado** de «obra ejecutada» y de «presupuesto certificado». No certifiques datos de una demo.
4. Añade pruebas para presupuesto incompleto, fechas solapadas según el tipo de dependencia (si se formaliza ese concepto), cambios de revisión y fuentes.
5. Mantén núcleo puro, sin tocar editor, geometría o render.

### Corte FT3D8-02: adaptadores puros y especificación visual para el siguiente paso
1. Preparar `ganttRows` exportable para un Gantt, con fechas **del usuario** y costes vinculados **del presupuesto**; sin montar Frappe aún.
2. Diseñar/implementar **solo adaptador de estado visual en archivo independiente**, salida serializable por elemento y tareas, para consumir en el futuro por Story/Three.js, sin añadir objetos de demo al modelo.
3. Probar navegación temporal adelante/atrás y estabilidad en inicio/desarrollo/final.
4. Crear ejemplos de fixtures: vivienda sencilla, reforma de cocina y plan incompleto; etiquetas explícitas «fixtures».
5. Documentar el contrato de integración futuro Gantt↔VisualState; no alterar archivos compartidos.

### Corte FT3D8-03 — DISEÑO, NO EJECUCIÓN INMEDIATA
- Boceto de integración posterior `Entregar → Presentación → Evolución de obra` y `Presupuestar → Plan de obra`, a coordinar con Claude original y Kimi.
- Propuesta visual inspirada en la demo: controles Play/Pause/velocidad, cámara, scrub, Gantt y efectos de montaje.
- Plan de licencias/atribución, rendimiento WebGL, exportación de vídeo y QA en navegador.
- **No montar interfaz ni editar `index.html` antes de coordinar.**

## 5. Archivos bajo TU responsabilidad ahora

**Puedes editar:** `js/construction-schedule-core.js`, `tests/construction-schedule-core.test.cjs`, `.github/workflows/ft3d-8v-schedule-core.yml`, y crear **archivos nuevos de FT3D-8V** en `js/`, `tests/`, `docs/product/` y workflows específicos.

**NO EDITAR:** `index.html`, `js/presentation-ui.js`, `js/professional-workspace-ui.js`, `js/ai-render-ui.js`, `api/render.js`, `js/budget-core.js`, `js/quantity-core.js`, proyectos de Claude original/Kimi, `js/assistant-*`, ramas de Asistente IA. Tu código usa adaptadores de solo lectura, no cambia autoridades.

## 6. Contrato de calidad y entregables

**CI:** `node --check` + `node --test` para nuevos tests, `tests/budget-core.test.cjs` y `tests/presentation-story.test.cjs`; mantener workflow verde.
**QA especial:** reversibilidad exacta, 0 mutaciones a `FloorPlanProjectV1` o presupuesto, fuentes de precios y fechas visibles, partidas sin coste como *desconocidas*, cero importes inventados y sin doble conteo; gastos API 0.
**Entregables finales:** HEAD SHA exacto, diff por archivo, pruebas ejecutadas y número de passes/fails, riesgos, enlaces, contrato próximo de Gantt+Three.js, propuesta de próximas mejoras, **sin merge**.

## 7. Condición final

**Esta nueva cuenta Claude Code no tiene contexto previo**: usa exclusivamente las referencias y el código suministrados, y pregunta solo cuando realmente no puedas avanzar. **No saltar directamente a la integración visual** sin validar el núcleo. No trabajar en el asistente IA ni tocar otras ramas.

**El propietario ha autorizado avanzar en FT3D-8V en tu rama; la integración y los despliegues siguen sujetos a aprobación expresa.**
