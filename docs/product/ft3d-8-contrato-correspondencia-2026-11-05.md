# FT3D-8 · Fase B — Contrato de correspondencia proyecto ↔ plan ↔ presupuesto ↔ visual

**Implementado en:** `js/construction-project-adapter.js` (`FloorPlanConstructionProject`). **Pruebas:** `tests/construction-project-adapter.test.cjs` (18). **No modifica** `FloorPlanProjectV1`, `FloorPlanBuildingV1` ni `FloorPlanBudget`.

## 1. Principio

Hay tres autoridades separadas y un vínculo que las une. El vínculo **no es una cuarta fuente de verdad**:

```
Proyecto/edificio RUBIK ──(geometría, materiales, ciclo de vida, evidencia)──┐
Plan FT3D-8 0.2.0 ───────(tareas, fechas, dependencias, task.elements)────────┼─► evaluate() ─► modelo de presentación
Presupuesto C1–C4 ───────(partidas, cantidades 7A, precios, revisión)─────────┘        (cobertura, avisos, nivel de entrega)
Vínculo `rubik-sota.construction-binding` (huellas aprobadas + revisión del profesional)
```

- **Relación tarea ↔ elemento:** vive **solo** en el plan (`task.elements[{elementId, role}]` de 0.2.0, o los `elementIds` heredados). No se duplica en el vínculo.
- **Relación tarea ↔ partida:** vive solo en el plan (`budgetAllocations` / `budgetItemIds`).
- **El vínculo** guarda contra qué revisiones de proyecto, plan y presupuesto se aprobó esa relación, y quién y cuándo la revisó.

## 2. Identidad y claves

| Campo | Autoridad | Regla |
|---|---|---|
| `elementKey` | FT3D-8 | `<levelId \| "project">/<id RUBIK>`, por ejemplo `project/wal_a-n` o `lvl_fx-b1/opn_b1-1`. El mismo ID en otra planta es otra clave. |
| ID de elemento | proyecto (`wal_*`, `opn_*`, `rom_*`) | Se copia tal cual; nunca se renombra. |
| Derivados | FT3D-8 sobre una autoridad | `<lvl>/roof` (FloorPlanRoof), `<lvl>/slab` (`slabThicknessMm` del edificio). |
| Revisión de proyecto/edificio | `FloorPlanBuilding.sha256(FloorPlanBuilding.canonical(doc))` | SHA-256 hexadecimal; el orden de las claves JSON no cuenta, cualquier cambio real sí. |
| Revisión del plan | la misma huella sobre `Schedule.validate(plan)` | Además, `plan.projectRef.revision` debe ser igual a la huella del proyecto. |
| Revisión del presupuesto | la misma huella sobre el presupuesto | El sujeto del presupuesto debe ser el mismo proyecto. |

## 3. Documento de vínculo `rubik-sota.construction-binding` 0.1.0 (persistencia propuesta)

Es un documento **complementario**: no se añade ningún campo a documentos con validación estricta. La propuesta es guardarlo junto al plan (biblioteca local o paquete de entrega), con la clave `bnd_<id>`.

```json
{
  "schema": "rubik-sota.construction-binding",
  "schemaVersion": "0.1.0",
  "id": "bnd_fx-reform-c",
  "subject": {"type": "project", "id": "prj_fx-reform-c"},
  "fingerprints": {
    "project": "45832a68a573b889c7915c897676a584e01d0bccf683ffd2f6bdcb1258f18d72",
    "schedule": "d367f3b91f2a15adabeb2ee994e6abb3093c663273c2601a502d234436e76a07",
    "budget": "3acd9d58206930b4761b3f0467270a2005e16e545a07e915b346db60ba6d39b5"
  },
  "scheduleId": "sch_fx-reform-c",
  "budgetId": "bud_prj_fx-reform-c",
  "review": {"status": "reviewed", "by": "FIXTURE arquitecto", "at": "2026-11-04T12:30:00+01:00"}
}
```

Validación (`validateBinding`):
- Claves exactas; un campo desconocido es un error.
- `id` con el formato `bnd_*`.
- Huella del proyecto obligatoria; las de plan y presupuesto pueden ser `null` (sin plan o sin presupuesto).
- `reviewed` exige `by` y `at`; un `draft` no puede declarar revisor ni fecha.

**Historial:** cada aprobación es un vínculo nuevo, con un `id` nuevo o la misma `id` y `createdAt`. Los anteriores se conservan como historial y nunca se reescriben. **Obsolescencia:** si la huella actual de una autoridad no coincide con la aprobada, esa autoridad pasa a `obsolete`, se emite el aviso `<autoridad>-revision-obsolete` y el nivel de entrega queda bloqueado por encima de «orientativa».

## 4. Elemento del inventario (salida de `inventory()`)

Ejemplo real, extraído de `labs/ft3d-8/fidelity-fixtures.js` (caso C):

```json
{
  "key": "project/wal_c-new1", "levelId": null, "id": "wal_c-new1", "type": "wall",
  "lifecycle": "new", "structure": "partition", "exterior": "interior",
  "thicknessMm": 100, "heightMm": 2650, "lengthMm": 3500,
  "material": {"id": null, "name": null, "color": "#f4f1eb", "source": "viewer-default"},
  "evidence": {"status": "estimated", "scale": "estimated", "source": "verified",
               "reasons": ["escala estimada (template)", "confirmada por una persona (manual)"]},
  "representable": true,
  "pieces": [{"kind": "solid", "center": [6000, 1750], "angle": 1.5708, "spanMm": 3500, "thicknessMm": 100, "ybMm": 0, "ytMm": 2650, "openingId": null}]
}
```

**Autoridad de cada campo:**
- `pieces`, `center`, `angle`, `spanMm`, `thickness`, antepecho y dintel: `FloorPlanCore.geometry`.
- `lifecycle`: `wall.status`; los huecos heredan el del muro anfitrión, y los recintos van como `undeclared`.
- `exterior`: `FloorPlanExterior.derive`.
- `material`: `materials[]` del proyecto o, si falta, el color por defecto del visor del editor, marcado como `viewer-default`.
- `evidence`: escala y origen. Se aplica siempre el peor de los dos.
- `surfaces` (cubierta): `FloorPlanRoof`.
- `polygons` y `thicknessMm` (forjado): recintos de la planta y `slabThicknessMm`.

## 5. Identidad geométrica frente a rol visual

| Concepto | Dónde | Ejemplo |
|---|---|---|
| Identidad geométrica | inventario (`key`, `pieces`) | `project/wal_a-n`: 1 muro, 6 piezas |
| Rol visual | `task.elements[].role` | `structure` (tarea «muros») y luego `finish` (tarea «pintura») sobre **el mismo muro** |
| Tarea y fechas | plan | `muros` 2027-09-20 → 2027-10-08 |
| Material | proyecto | `mat_fx-lime` `#e9e1d1` (color final) |
| Estado temporal | `FloorPlanConstructionVisualState.frameAt(plan, fecha)` | `building` / `standing` / `removing` / `removed` |

**Roles admitidos según el ciclo de vida** (`ROLE_RULES`):

| Elemento | Ciclo de vida | Roles admitidos |
|---|---|---|
| Muro | nuevo | `structure`, `build`, `finish`, `cladding` |
| Muro | existente | `finish`, `cladding` |
| Muro | demolido | `demolition` |
| Hueco | nuevo | `build`, `finish` |
| Hueco | existente | `finish`, `build` |
| Hueco | demolido | ninguno |
| Suelo | no declarado | `build`, `finish` |
| Cubierta | nueva | `envelope`, `build`, `finish` |
| Cubierta | existente | `finish` |
| Forjado | nuevo | `structure`, `build` |
| Forjado | existente | `finish` |

Cualquier otra combinación produce el error `role-status-mismatch`. La animación de aparición **no** describe el método constructivo real.

**Clase temporal** (`visualElements[].timeline`):
- `pre-existing`: existe desde el inicio; es lo existente sin tarea de aparición.
- `scheduled`: aparece o desaparece según el plan.
- `unscheduled`: es nuevo o demolido pero ninguna tarea lo construye o lo demuele. Se muestra como contorno gris «sin tarea» y **nunca con una fecha inventada**.

## 6. Elementos no disponibles (B3)

| Caso | Comportamiento |
|---|---|
| Documentado y representable | Se dibuja desde el proyecto (muros, huecos, suelos, cubierta derivada, forjado). |
| Documentado sin representación | `representable:false` con `unavailableReason`: escaleras, forjado con huecos de escalera, cubierta no derivable (`open-or-branched-facade`), hueco en muro demolido. Si una tarea lo enlaza: aviso `link-not-representable`. |
| Ilustración ambiental | Solo en `labs/ft3d-8/demo.html` (casa ficticia, marcada como DEMO). El laboratorio de fidelidad no añade decorado. |
| Desconocido | No se inventa geometría: cimentación, excavación, estructura, capas de muro, cubierta inclinada y medios auxiliares aparecen en `NOT_IN_AUTHORITY`. Una **tarea** de cimentación puede existir sin elementos (`coverage.tasks.withoutElements`). |

## 7. Concordancia con el presupuesto (B4)

Se reutiliza `Schedule.budgetReport` (C1–C4) sin cambios:
- Asignación por ID.
- Repartos explícitos que no superan el 100 %, con lo que falte marcado como **pendiente**.
- Partidas sin asignar listadas.
- Tareas sin coste conocido con `totalNet:null`.
- Cantidad estimada como aviso que no bloquea.
- Precio sin revisar como bloqueo, y la fuente y fecha de cada precio visibles.
- No hay doble contabilidad: el reparto se hace por restos mayores al céntimo.
- `null` nunca se convierte en 0.

Para un edificio, el estado es `building-budget-not-supported`: RUBIK guarda un presupuesto **por planta**.

## 8. Tabla de estados y errores (`evaluate().issues`)

| Código | Gravedad | Cuándo |
|---|---|---|
| `schedule-invalid` | error | El plan no supera `Schedule.validate`. |
| `schedule-other-project` | error | `projectRef` apunta a otro documento. |
| `schedule-project-revision-obsolete` | aviso | `projectRef.revision` ≠ huella actual del proyecto. |
| `planning-unavailable` | aviso | No hay plan: «PLANIFICACIÓN NO DISPONIBLE O PENDIENTE». |
| `link-unknown-element` | error | La tarea apunta a una clave que no existe en el proyecto. |
| `link-not-representable` | aviso | El elemento existe pero no tiene representación. |
| `role-status-mismatch` | error | El rol no es compatible con el ciclo de vida del elemento. |
| `element-unscheduled` / `demolition-unscheduled` | aviso | Elemento nuevo o demolido sin tarea. |
| `budget-unavailable` | aviso | Sin presupuesto. |
| `budget-other-project` | error | El sujeto del presupuesto es otro. |
| `budget-report-failed` | error | `budgetReport` rechaza el presupuesto (p. ej. partida desconocida). |
| `building-budget-not-supported` | aviso | Edificio sin presupuesto común. |
| `binding-missing` | info | No hay vínculo, así que las revisiones no están fijadas. |
| `binding-invalid` / `binding-other-project` / `binding-other-schedule` / `binding-other-budget` | error | El vínculo no es válido o es de otra autoridad. |
| `project-revision-obsolete` / `schedule-revision-obsolete` / `budget-revision-obsolete` | aviso | La huella aprobada no es la actual. |

## 9. Cobertura (B6) — `evaluate().coverage`

- **`elements`:**
  - `total` y `representable`;
  - `notRepresentable[]`, `linked`, `unlinked[]`;
  - `scheduled`, `preExisting` y `unscheduled[]`;
  - `byEvidence` (verificado, estimado, pendiente o no disponible).
- **`tasks`:** `total`, `withoutElements[]`, `withoutBudget[]`, `datesApproved`.
- **`budget`:**
  - `items`, `unassignedItemIds[]`, `pendingAllocations[]`, `unknownItemIds[]`;
  - `allocatedKnownNet` y `budgetKnownNet`, con `allocatedPercentOfKnown`;
  - `tasksWithoutCost[]`, `unverifiedTasks[]`;
  - `projectRevisionCheck`.
- **`revisions`:** el estado `current`, `obsolete`, `unbound`, `unknown` o `not-applicable` de proyecto, plan y presupuesto.

Todas las carencias aparecen como listas de IDs, no solo como totales.

## 10. Reglas de presentación y entrega (B7) — `evaluate().delivery`

| Nivel | Condiciones (todas) |
|---|---|
| `internal` · vista interna exploratoria | El documento supera la validación estricta de RUBIK. |
| `orientative` · presentación orientativa | + hay plan válido; + no hay ningún aviso de nivel error. |
| `approved-plan` · plan aprobado | + plan revisado; + vínculo revisado; + huellas vigentes (proyecto `current`); + ningún elemento sin tarea. |
| `professional` · entrega con evidencias registradas | + todos los elementos enlazados con evidencia `verified`; + costes disponibles; + ninguna partida sin asignar, sin precio ni con reparto pendiente; + todas las tareas con coste `verified`. |

- No existe una etiqueta de «proyecto completamente verificado». El nivel más alto dice expresamente «no certifica ejecución ni obra».
- `delivery.assurances` separa lo que comprueba el sistema (geometría derivada, huella SHA) de lo que solo declara el profesional (que presupuesto y proyecto se corresponden). La ejecución y la certificación figuran siempre como «no registrada» y «no aplica».

## 11. Compatibilidad

- **Planes 0.1.0** (`elementIds` y `budgetItemIds` como cadenas) se evalúan sin cambios: las cadenas pasan a rol `build` y al 100 %. Lo cubre la prueba «compatibility: legacy 0.1.0».
- **FT3D-8 0.2.0:** el adaptador consume `Schedule.canonical`, `budgetReport` y `frameAt` tal como están.
- **Documentos RUBIK:** se aceptan proyectos 1.0–1.12 y edificios 1.0–1.5, siempre con sus propios validadores. No se escribe en ellos.
