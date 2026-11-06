# FT3D-8V — Auditoría del núcleo, contrato 0.2.0 y contrato futuro Gantt ↔ Timelapse

**Fecha:** 5 noviembre 2026 · **Rama:** `feat/ft3d-8v-schedule-core-2026-11-05` · **Estado:** núcleo puro y adaptadores; **sin UI, sin visor 3D, sin merge, sin despliegue, sin API de pago.**

Decisiones aprobadas por el propietario para este corte:

1. Trabajar solo en esta rama, conservando el núcleo y los tests existentes (los 11 originales siguen sin modificar y en verde).
2. Dependencias FS/SS/FF/SF con desfase explícito positivo o negativo, validadas contra las fechas; compatibilidad con el formato anterior; **las fechas del profesional nunca se mueven**.
3. Partidas repartidas entre tareas por porcentajes explícitos (máximo 100 %, sin doble conteo; lo no repartido queda **pendiente**). Un elemento 3D participa en varias tareas con **roles visuales** distintos.
4. Escala de evidencia: plan estimado, plan aprobado, ejecutado, certificado. Este corte solo produce las dos primeras; el registro de ejecución queda reservado.

---

## 1. Auditoría del núcleo 0.1.0 (FT3D8-01)

| # | Hallazgo en 0.1.0 | Gravedad | Resolución en 0.2.0 |
|---|---|---|---|
| A1 | `dependsOn` solo detectaba ciclos y predecesoras inexistentes: una tarea podía empezar **antes** de que acabara su predecesora sin error. | Alta | Cada dependencia se valida (FS/SS/FF/SF + desfase). El error indica cuántos días incumple. No se reprograma nada. |
| A2 | Exclusividad de elemento: un muro no podía pasar por estructura → revestimiento → acabado. | Alta (para el timelapse) | `elements:[{elementId, role}]`; la regla de unicidad pasa a ser el par (elemento, rol). |
| A3 | Exclusividad de partida: no se podía repartir, por ejemplo, el hormigón entre cimentación y forjado. | Media | `budgetAllocations:[{itemId, sharePercent}]` con un máximo de 2 decimales y una suma por partida ≤ 100 %. El reparto en céntimos usa restos mayores, así que las partes suman exactamente la línea. |
| A4 | `budgetReport` no informaba del origen del precio, ni de su fecha, ni de la diferencia entre cantidad estimada y medida. | Media | Cada línea lleva `priceSource` (tipo, etiqueta, fecha `asOf`, proveedor), `quantityStatus`, `reviewStatus` e `issues[]`. |
| A5 | `knownNet` devolvía `0` cuando ningún importe de la tarea era conocido. | Media | Ahora es `null`: lo desconocido nunca aparece como cero. |
| A6 | Revisión de proyecto: el presupuesto C1–C4 solo expone `subject {type,id}`, sin revisión. | Media | `projectRevision.check = 'unverifiable'`. Si en el futuro el motor expone una revisión: `match` o `mismatch`, y `mismatch` bloquea la verificación. |
| A7 | No había distinción formal entre plan, ejecución y certificación. | Media | `EVIDENCE_LEVELS`, `evidence()`, `executionStatus/certificationStatus:'not-recorded'` y `executionRecords` reservado: si no está vacío, error. |
| A8 | Calendario implícito. | Baja | `calendar` explícito, `calendar-days/UTC`; cualquier otro se rechaza en lugar de leerse mal. Se comprueba que el cambio de hora (DST) no altera el cálculo. |

Comprobado sin hallazgos: fechas imposibles, años < 100, fechas invertidas, ID duplicados, autodependencias, presupuesto de otro proyecto, partidas desconocidas y la ausencia de mutaciones (los tests originales cubren casi todo; los nuevos lo amplían).

### Qué bloquea `verified` y qué es solo un aviso

- **Bloquea:** `price-missing`, `price-unreviewed`, `quantity-unavailable`, `quantity-incomplete`, `allocation-pending`, `project-revision-mismatch`, y además un plan en borrador.
- **Aviso visible que no bloquea:** `quantity-estimated` (una estimación revisada sigue siendo una estimación) y `price-source-undated`.
- `verified` significa «coste presupuestado y revisado». **Nunca** significa gasto ejecutado ni certificado (`costEvidence:'budgeted'`).

## 2. Contrato `rubik-sota.construction-schedule` 0.2.0

```js
{
  schema:'rubik-sota.construction-schedule', schemaVersion:'0.2.0',   // también se acepta 0.1.0
  id, source, projectRef:{type:'project'|'building', id, revision},
  review:{status:'draft'|'reviewed', by, at},                         // draft → plan-estimated, reviewed → plan-approved
  calendar:{type:'calendar-days', timeZone:'UTC'},
  executionRecords:[],                                                // RESERVADO, debe estar vacío
  tasks:[{
    id, title, wbs, startDate:'YYYY-MM-DD', endDate:'YYYY-MM-DD',     // ambos inclusivos
    source,
    dependsOn:['taskId' | {taskId, type:'FS'|'SS'|'FF'|'SF', lagDays:int}],
    elementIds:['id'] | elements:[{elementId, role}],
    budgetItemIds:['itemId'] | budgetAllocations:[{itemId, sharePercent}]
  }]
}
```

- **Semántica de las dependencias.** Una tarea ocupa los días `[inicio, fin+1)`. FS: `succ.inicio ≥ pred.fin+1+lag`; SS: `succ.inicio ≥ pred.inicio+lag`; FF: `succ.fin ≥ pred.fin+lag`; SF: `succ.fin+1 ≥ pred.inicio+lag`. El desfase es un entero explícito en el rango ±3650; los negativos (adelantos) están permitidos.
- **Forma guardada compatible.** Cuando todo cabe en el formato antiguo (rol `build`, 100 %, FS+0), se guarda con `elementIds`, `budgetItemIds` y `dependsOn` como cadenas, igual que en 0.1.0. La forma enriquecida solo aparece cuando el profesional la usa. Si una tarea trae las dos formas y se contradicen, error. `canonical()` devuelve siempre la vista enriquecida.
- **Roles:** `site, build, structure, envelope, services` (aparecen); `cladding, finish` (capa sobre un elemento existente); `temporary` (solo mientras dura la tarea); `demolition` (desaparece).

API pública: `create, validate, canonical, upgrade, serialize, parse, bounds, evidence, dependencyReport, stateAt, ganttRows, budgetReport` + constantes `SUPPORTED_VERSIONS, DEPENDENCY_TYPES, ELEMENT_ROLES, EVIDENCE_LEVELS, CALENDAR`.

## 3. Adaptadores puros (FT3D8-02)

### `js/construction-visual-state.js` → `FloorPlanConstructionVisualState`
- `timeline(s)`: `preStartDate` (solar vacío, «inicio»), `endDate` («final»), `positions` (días) y `checkpoints` (inicios, fines y día siguiente a cada fin).
- `progressToDate(s, p)` / `dateToProgress(s, date)`: cursor cuantizado por día. Con `p∈[0,1]` es compatible con el patrón `stateAt(p)` de Story.
- `frameAt(s, date)` → `rubik-sota.construction-visual-frame` 0.1.0: por cada elemento da `present`, `state` (`absent|building|standing|temporary|removing|removed`), `builtFraction`, `appliedLayers[]` y `layers[]`, más `activeTaskIds`, `completedTaskIds`, `evidence`, `illustrative:true` y `disclaimer`. Es JSON puro, sin geometría ni objetos de demo.
- `diff(a, b)`: transiciones `enter/exit` con dirección `forward/backward`, simétricas, para animar el scrub en ambos sentidos.
- Un elemento sin rol «appear» se considera **preexistente**, como los muros de una reforma.

### `js/construction-gantt-adapter.js` → `FloorPlanConstructionGantt`
- `toGanttTasks(s, {budgetReport})`: produce filas con forma de Frappe Gantt (`id, name, start, end, dependencies:'a, b', progress:0, custom_class:'ft3d-plan-*'`) más `_ft3d` (WBS, fuente, evidencia, detalle de dependencias, elementos, reparto y coste C1–C4). Rechaza un informe de otro plan.
- `progress` es avance **de ejecución** en Frappe, así que se queda en `0`: el avance planificado nunca rellena una barra.
- `nonFsDependencies(s)`: Frappe solo dibuja flechas FS; las SS/FF/SF y los desfases se exponen para que la UI los etiquete.
- `cursor(s, date)`: el marcador del Gantt comparte fecha y tareas activas con `frameAt`.

### Fixtures (`tests/fixtures/construction-schedule-fixtures.cjs`)
`simpleHouse` (vivienda: estructura → cubierta → revestimiento sobre los mismos muros, instalaciones SS+15, suelos FF+3, hormigón 60/40), `kitchenReform` (demolición, protección temporal, muros preexistentes, tabique con rol `build` y `finish`) e `incompletePlan` (borrador, partida sin precio, reparto pendiente del 40 %, partida sin asignar, cantidad incompleta). Todos llevan **FIXTURE** en el id, la fuente y los títulos, y no copian datos del donante.

## 4. Contrato futuro Gantt ↔ VisualState (pendiente de integración)

```
          ┌──────────── fuente única de tiempo: date 'YYYY-MM-DD' ────────────┐
Gantt (Frappe) ──click/scrub→ date ──► Visual.frameAt(s,date) ──► renderer RUBIK (Three 0.160)
      ▲                                     │ diff(prev,next) → animaciones enter/exit
      └── Gantt.cursor(s,date) ◄────────────┘
Play/Pause: p += dt·speed → Visual.progressToDate(s,p) → date (días enteros, estable)
Costes: Schedule.budgetReport(s, budget, FloorPlanBudget) → toGanttTasks({budgetReport})
```

1. **Mapeo de elementos.** Falta un adaptador `elementId → objetos Three` a partir de `FloorPlanProjectV1` (muros, huecos, forjados, cubierta). Debe ser de solo lectura y vivir en un archivo nuevo, propiedad de quien coordine el visor. Los elementos auxiliares de obra (grúa, valla, caseta) serán **decorado ilustrativo** que se añade en una capa separada, nunca dentro del proyecto.
2. **Coreografía.** Para cada rol: `appear` → escala o recorte vertical según `builtFraction`; `layer` → material o opacidad; `temporary` → entra y sale; `demolition` → se desvanece. Las curvas de suavizado son libres, porque la animación es ilustrativa. El **estado de reposo** debe salir siempre de `frameAt`, para que el scrub sea exacto.
3. **Etiquetado obligatorio en la UI:** «Plan aprobado/estimado — animación ilustrativa». Nunca «terminado» ni «pagado». Los costes aparecen como «presupuestado», con avisos de estimado, pendiente o sin precio.

## 5. FT3D8-03 — Diseño (no ejecutado)

- **Rutas:** `Entregar → Presentación → Evolución de obra` (timelapse + Gantt, exportable) y `Presupuestar → Plan de obra` (edición de tareas, dependencias y repartos). Hay que coordinarlo con Claude (Entregas, PR #166) y con Kimi (fidelidad visual, PR #167).
- **UI inspirada en Flat-to-3D Schedule Build:** cabecera con título y fechas del **proyecto real**; Play/Pause, velocidad (×1, ×2, ×4), scrub por semanas y días; cámaras (auto, iso, cenital); tarjeta «SEM n / N» con la tarea activa, el % del plan y el coste presupuestado; Gantt inferior con la línea «HOY (plan)».
- **Licencias:** Flat-to-3D (MIT) solo como inspiración. Si se copia código, hay que conservar el aviso MIT y la atribución en el archivo y en NOTICE. Frappe Gantt (MIT) se vendoriza con una versión fija y su licencia; la de jsGantt-improved queda por revisar. **No se añade un segundo Three.js** (RUBIK usa 0.160.0 y el donante 0.169.0).
- **Rendimiento:** reutilizar los mesh del proyecto y alternar visibilidad, escala o material, sin regenerar geometría por fotograma; `frameAt` es O(tareas + elementos) y debería guardarse en caché por fecha; el decorado debe ser *low-poly* e instanciado.
- **Vídeo:** reutilizar `tour-video-ui.js` (Entregas) con el cursor `progressToDate` a paso fijo, en modo determinista.
- **QA en navegador:** capturas en el inicio, a mitad y al final en 1440×900 y 390×844; comprobar que ir y volver por el scrub produce la misma captura; comprobar los avisos en pantalla.

## 6. Pendiente (fuera de este corte)

- Registro real de ejecución y certificación (`executionRecords`): esquema, firmas y comparación plan/real.
- Calendario laborable (fines de semana y festivos) y, si se pide, cálculo CPM **solo como sugerencia**, nunca para reescribir fechas.
- Que C1–C4 exponga la revisión del proyecto, para pasar de `unverifiable` a `match`. Requiere cambiar `budget-core.js`, que no se toca en este corte.
- El adaptador `elementId ↔ FloorPlanProjectV1`, la UI, Frappe Gantt y la integración con el visor y con Entregas.
