# FT3D-6 — Plantillas de Presentation por perfil profesional — contrato canónico de implementación V1

**Fecha:** 01-11-2026.

**Repositorio:** `Juanmaes83/floorplan-3d`.

**Rama de reconciliación/promoción:** `docs/ft3d-6-reconciliation-2026-11-01`.

**Base reconciliada previa a la promoción:** `master@d7f59f7e02bde8f8bbef94e353f0361dc40ac2c4`.

**Fuente histórica de este contrato:** `docs/ft3d-6-working-contract-after-ft3d4@5db3c1b48972128f2769598141cbe2268b792bfa`.

**Draft histórico:** `docs/ft3d-6-profile-templates-contract@388c03b67b98fccef85e310dd2e7665514111b3d`.

**FT3D-5:** código probado en `bf3e5ca5c8df1f6bc2bd61925a0a1456b2d1353d`; integrado mediante `18848fbf3308ef8c2c8841edf626221f74922d23`.

**Global Donor Reconciliation:** aprobada e integrada en `master@d7f59f7e02bde8f8bbef94e353f0361dc40ac2c4`.

**Estado:** **CANONICAL IMPLEMENTATION CONTRACT V1 — AUDITED + USER-APPROVED FOR PROMOTION — IMPLEMENTATION NOT AUTHORIZED**.

> El nombre histórico del archivo conserva `working-contract` para mantener continuidad y trazabilidad. El estado normativo lo determina este encabezado y la §1: este archivo ya no es un working draft.

## 1. Estado y jerarquía documental

| Documento | Estado | Autoridad |
|---|---|---|
| Draft 31-10-2026 | **DRAFT HISTÓRICO APROBADO** | Intención de producto histórica. No se borra |
| Working contract `5db3c1b…` | **HISTÓRICO RECONCILIADO** | Fuente de trazabilidad para las decisiones previas a FT3D-5 |
| Este documento | **CANONICAL IMPLEMENTATION CONTRACT V1 — P1–P11 CLOSED 11/11 — APPROVED** | Autoridad canónica de implementación de FT3D-6. Si discrepa con el draft o `5db3c1b…`, prevalece este documento |

La auditoría contractual de esta revisión consolidada está **APROBADA** y la promoción a contrato canónico está **explícitamente autorizada por el usuario**.

Este documento **no autoriza implementar FT3D-6**. La implementación requiere una autorización explícita y separada posterior a esta promoción.

Las decisiones cerradas del working contract `5db3c1b…` que no se modifican explícitamente aquí se conservan. Esta revisión incorpora y sustituye todas sus marcas `PENDIENTE DE RECONCILIACIÓN TRAS FT3D-5`, `ft3d5-pending` y los placeholders de `axon` / `exploded-levels`.

### 1.1 Principios permanentes

> **FT3D amplía Rubik. No sustituye Rubik.**

> **Rubik commands. Donor informs.**

> **Más contexto, no más falsa certeza.**

> **Semantic support ≠ technical executability ≠ visual acceptance.**

> **Route authority ≠ camera choreography.**

> **Available ≠ active ≠ effectively used.**

> **Automated green ≠ visual acceptance.**

### 1.2 Verificación de bases

| Autoridad | Revisión reconciliada | Uso |
|---|---|---|
| `master` | `d7f59f7e02bde8f8bbef94e353f0361dc40ac2c4` | baseline documental/producto usado para esta reconciliación |
| FT3D-5 contract V2 | `docs/product/ft3d-5-axon-exploded-building-contract-2026-11-01.md` en master | autoridad técnica de axon/exploded |
| FT3D-5 core | `js/presentation-axon-core.js` en master | descriptor y reasons |
| Story | `js/presentation-story-core.js` en master | narratives, holds y `SCENE_MS` |
| Presentation UI | `js/presentation-ui.js` en master | composición real y slot FT3D-5 |
| View3D binding | `index.html` en master | Begin/Apply/End, `levelView`, restore |
| Global Donor Reconciliation | `docs/product/ft3d-donor-global-reconciliation-2026-11-01.md` | taxonomía, límites, carry-forward y QA |
| Working contract histórico | `5db3c1b48972128f2769598141cbe2268b792bfa` | trazabilidad de decisiones no reabiertas |

Los **710 PASS / 0 FAIL / 2 SKIP** pertenecen exclusivamente a `bf3e5ca5c8df1f6bc2bd61925a0a1456b2d1353d`. No se atribuye ese run a `18848fbf…`, a `d7f59f7e…` ni a la promoción documental de este contrato.

### 1.3 Resultado de auditoría de promoción

La auditoría previa a la promoción verificó:

- P1–P11 contra FT3D-5 integrado;
- descriptor, variants y reasons de `FloorPlanPresentationAxon`;
- adapters, holds y `SCENE_MS` reales;
- slot único de lectura de edificio;
- anchors `overview(level)` y P11 negativo;
- separación semántica / ejecución / aceptación visual;
- fronteras FT3D-7 y FT3D-8;
- no canonización automática de mecanismos donor;
- QA, restore, reduced motion, mobile, offline y no persistencia nueva.

Se detectó y corrigió antes de canonizar una ambigüedad de sesión: `buildingReading` queda como **único selector de materialización** para `axon`/`exploded-levels`; no puede coexistir una segunda fuente de verdad independiente en `toggles`. También se hace explícito que Arquitectura puede satisfacer su alternativa volumétrica con `exploded-levels` cuando esa opción se selecciona y está soportada.

> **FT3D-6 CANONICAL CONTRACT AUDIT: APPROVED.**

---

## 2. Objetivo

FT3D-6 responde a una pregunta:

> **¿Qué historia profesional debemos contar con las capabilities que este proyecto realmente tiene?**

```text
proyecto
+ capability snapshot estructural
+ disponibilidad runtime de enhancements
+ template inmutable
+ session overrides controlados
        ↓
resolver puro
        ↓
resolved semantic story
        ↓
gate ejecutivo
        ↓
adapter registry
        ↓
Story existente: NARRATIVES + sequence + player único
```

FT3D-6 decide:

- selección y prioridad semántica;
- orden;
- composición;
- degradación y warnings;
- qué adapter existente consume cada capability.

FT3D-6 **no** decide:

- geometría;
- cámara concreta de section/elevation/axon;
- offsets o separación de FT3D-5;
- cálculo Solar;
- clasificación exterior;
- rutas válidas;
- implementación de export/share/vídeo;
- timeline constructivo.

---

## 3. No objetivos V1

FT3D-6 V1 no crea:

- Story engine, player, renderer ni canvas nuevos;
- cámaras por profesión;
- geometría paralela;
- editor de timeline;
- schema nuevo;
- persistencia de proyecto;
- localStorage nuevo;
- query/URL nueva;
- red obligatoria;
- IA automática;
- clasificación profesional inferida;
- multi-edificio;
- soporte de más de dos niveles como feature de producto;
- capítulos de materials/moodboard/budget sin adapter aprobado;
- 360;
- before/after;
- timeline constructivo (FT3D-8);
- packaging/salidas nuevas (FT3D-7).

La plantilla «Personalizada» queda fuera de V1.

---

## 4. Autoridades consumidas

| Autoridad | Módulo real | FT3D-6 consume |
|---|---|---|
| PresentationPlan | `FloorPlanPresentation` | stops `overview`/`room`, niveles presentados, rooms válidas, revision |
| Story | `FloorPlanPresentationStory` | `NARRATIVES`, `SCENE_MS`, `sequence`, `create` |
| Player/UI | `presentation-ui.js` | `fullStory`, `openStory`, `enterScene`, `finishStory`, restore, holds |
| Section | `FloorPlanPresentationSection` | descriptor soportado/reason por nivel |
| Elevation | `FloorPlanPresentationElevation` | descriptor, candidates, partial, envelope |
| Axon/Exploded | `FloorPlanPresentationAxon` | descriptor V2, variants, levels, excluded, envelope |
| Building | `FloorPlanBuildingUI.presentationSources()` | todos los niveles estructurales del building |
| Solar | `FloorPlanSolarUI.result` | availability runtime del enhancement |
| Norte | `site.northOffsetDeg` | labels cardinales sólo a través de FT3D-4 |
| Rooms | `project.rooms[].family` y `name` | semántica y copy separados |
| Moodboard | `FloorPlanMoodboard.derive` | resource |
| Presupuesto | `FloorPlanBudgetPresentation.buildReport` | resource |
| Brand | `FloorPlanBrand` | identidad transversal |
| Audiencia | `rubik-professional-audience-v1` | indicio pasivo; nunca preselección |

FT3D-6 **consume** estas autoridades; no las recalcula ni las sustituye.

---

## 5. Perfiles V1

| Perfil | `id` | Objetivo |
|---|---|---|
| Inmobiliaria | `real-estate` | recorrido claro de vivienda, estancias y exterior |
| Promotora | `developer` | lectura del edificio y sus niveles antes que espacios concretos |
| Arquitectura | `architecture` | organización espacial, sección, fachada y volumetría |
| Reformas | `renovation` | distribución propuesta y espacios relevantes |
| Interiorismo | `interior-design` | estancias, ambiente y acabados asignados |

Todos usan `version:1`.

Default: **Sin plantilla**. Ninguna plantilla se preselecciona.

La audiencia `interior` mapea explícitamente a `interior-design`; audiencia y template son namespaces distintos.

---

## 6. Taxonomía de capabilities

Se mantienen seis familias:

| Familia | Capabilities V1 | Naturaleza |
|---|---|---|
| `atomic-scene` | `section`, `elevation`, `axon`, `exploded-levels` | escena Story con lifecycle propio |
| `composite` | `room-tour` | produce escena(s) + paradas |
| `anchor` | `plan`, `overview` | verdad de entrada/salida; no capítulo independiente |
| `enhancement` | `solar`, `site-context` | enriquece anfitriona compatible |
| `resource` | `materials`, `moodboard`, `budget-summary`, `dossier`, `site-data` | dato/documento sin adapter Story V1 |
| `story-structure` | `closing` | estructura terminal |

La Global Donor Reconciliation **no** añade automáticamente a V1:

- Board;
- Unfolded Room;
- donor Floor by Floor;
- Card Model;
- spherical sweep;
- construction timeline;
- D20 como capítulo;
- REA como runtime.

Se conserva como marco analítico futuro:

```text
presentation family
→ capability
→ variant
→ narrative state/phase
→ adapter
→ Story
```

---

## 7. Capability contract

Cada capability expone:

```js
{
  id,
  family,
  version,
  availability,      // supported | partial | unsupported | temporarily-unavailable | user-disabled | pending-implementation
  reason,
  scope,
  coverages,
  targets,
  repeatable,
  maxOccurrences,
  repeatScope,
  startAnchor,
  endAnchor,
  requires,
  compatibleHosts,
  reducedMotionSupport,
  adapterId,
  details
}
```

`pending-implementation` sigue disponible como estado genérico para futuras capabilities, pero **no describe ya `axon` ni `exploded-levels`**.

`partial` se normaliza como `availability:'partial'`; no coexiste un booleano paralelo de autoridad.

---

## 8. Scopes y coverages

Scopes V1:

- `project`;
- `building`;
- `level`;
- `facade`;
- `room`;
- `room-collection`.

Los niveles son siempre una colección `levels[]`; hoy `MAX_LEVELS=2` permanece sin cambios.

Coverages:

- `any`;
- `level`;
- `all-presented-levels`;
- `building`.

Regla de `coverage:'building'`:

```text
si presentedLevels.length === 1
    un target de scope level sobre ese nivel puede acreditar building por equivalencia
si presentedLevels.length > 1
    hace falta target real building o alternativa explícita del minimumStory
```

La equivalencia de un nivel **no crea** `overview(building)`.

### 8.1 Coverages por capability

| Capability | Coverages |
|---|---|
| `plan` | `any`, `level`, `all-presented-levels`, `building` sólo por equivalencia de un nivel |
| `overview` | `any`, `level`, `all-presented-levels`, `building` sólo por equivalencia de un nivel |
| `section` | `any`, `level`, `all-presented-levels` |
| `elevation` | `any`, `building` |
| `room-tour` | `any`, `level`, `all-presented-levels` |
| `axon` | `any`, `building` |
| `exploded-levels` | `any`, `building` |

---

## 9. Anchors

| Capability | Adapter | startAnchor | endAnchor |
|---|---|---|---|
| `plan` | `plan-reveal` | `plan(level)` | `overview(level)` |
| `overview` | — | — | — |
| `section` | `section-open` | `overview(level)` | mismo overview |
| `elevation` | `elevation-open` | `overview(level de inserción)` | mismo overview |
| `axon` | `axon-open` | `overview(level de inserción)` | mismo overview |
| `exploded-levels` | `exploded-levels-open` | `overview(level de inserción)` | mismo overview |
| `room-tour` | `room-descent` + stops | `overview(level)` | última `room(level, roomId)` |
| `closing` | — | cualquier anchor | terminal |

Para `axon`/`exploded-levels`, el anchor es el **primer overview real del PresentationPlan cuyo `levelId` esté incluido en el descriptor FT3D-5**.

Si no existe overview elegible, no se inventa uno.

---

## 10. `overview` semántico y P11

`overview` sigue siendo una capability-anchor derivada del PresentationPlan efectivo.

```js
structural.overview = {
  byLevel: [...],
  building: {
    availability: 'unsupported',
    reason: 'overview-building-unavailable'
  }
}
```

FT3D-5 V1:

- **NO** crea `overview(building)`;
- **NO** crea un anchor ejecutable sin PresentationPlan;
- **NO** levanta `presentation-plan-unavailable`.

Esto cierra P11 negativamente.

---

## 11. FT3D-5 descriptor y disponibilidad — P1/P9

Fuente única: `FloorPlanPresentationAxon.derive({levels})`.

Descriptor relevante:

```js
{
  version: 2,
  supported,
  reason,
  partial,
  variants: {
    axon: {
      supported,
      reason,
      variant: 'compact-building'
    },
    exploded: {
      supported,
      reason,
      variant: 'vertical-levels'
    }
  },
  levels,
  envelope,
  explodedEnvelope,
  excluded
}
```

### 11.1 Axon

```text
descriptor unsupported → unsupported / descriptor.reason
descriptor supported + partial → partial / reason null
descriptor supported + !partial → supported / reason null
```

### 11.2 Exploded

```text
descriptor unsupported → unsupported / descriptor.reason
exploded variant unsupported → unsupported / variant.reason
exploded supported + descriptor partial → partial / reason null
exploded supported + !partial → supported / reason null
```

### 11.3 Reasons reales

Globales:

- `no-levels`;
- `invalid-level-geometry`;
- `degenerate-building-envelope`.

Exploded:

- `single-level`;
- `insufficient-valid-levels`.

Partial conserva `details.excluded: [{levelId, reason}]`.

`ft3d5-pending` deja de ser válido para estas capabilities.

---

## 12. Scope, variants y target — P3/P4

Ambas capabilities:

```text
scope = building
repeatScope = building
```

Variants:

- `axon` → `compact-building`;
- `exploded-levels` → `vertical-levels`.

Target semántico: **una lectura del building estructural**, con `levelIds` incluidos en `details`; no una capability repetida por planta.

No se canonizan como variants V1 los nombres donor Board, Unfolded Room o Floor by Floor.

---

## 13. Un único slot `building-reading`

El runtime FT3D-5 real usa:

```text
axonMode = off | compact | exploded
```

`exploded-levels-open` contiene ya una fase compacta antes del despiece.

Por contrato FT3D-6:

> **máximo una materialización entre `axon` y `exploded-levels` por Story.**

`building-reading` es una regla de composición/dedup, **no una nueva capability**.

### 13.1 Default por perfil

- `developer`, `automatic`:
  1. `exploded-levels` si `supported|partial`;
  2. si no, `axon` si `supported|partial`;
  3. si ninguna, no hay building-reading.
- `architecture`, `automatic`: `axon` si `supported|partial`; `exploded-levels` es opción explícita.
- `real-estate`, `renovation`, `interior-design`: building-reading sigue excluido por policy V1.

---

## 14. Repetibilidad — P6

| Capability | repeatable | maxOccurrences | repeatScope |
|---|---:|---:|---|
| `axon` | false | 1 | building |
| `exploded-levels` | false | 1 | building |

Además:

```text
maxOccurrences(building-reading) = 1
```

No se ejecuta `axon-open` adicional cuando se elige `exploded-levels-open`.

---

## 15. Reduced motion — P7

La Story semántica no cambia.

| Capability | reducedMotionSupport | Holds reales |
|---|---|---|
| `axon` | `holds` | `AXON_OPEN.reducedHold = 0.5` |
| `exploded-levels` | `holds` | `reducedCompact = 0.22`, `reducedExploded = 0.645` |

El player integrado ya reconoce esos holds mediante `holdsOf(kind)`.

---

## 16. Building, niveles y `levelView` — P8

La fuente estructural FT3D-5 son **todos** los niveles de `BuildingUI.presentationSources()` — no sólo los niveles que tengan rooms elegidas.

El runtime FT3D-5 es responsable de:

```text
capture semantic pre-state
→ active → all si procede
→ sync/rebuild
→ fresh handles
→ base visibility mask
→ absolute narrative deltas
→ restore transforms/visibility
→ restore previous levelView
```

FT3D-6 no toca grupos Three, transforms ni `levelView`.

### 16.1 `site-context`

En FT3D-6 V1:

```js
compatibleHosts(site-context) = ['elevation']
```

No se añaden `axon` ni `exploded-levels` como hosts.

FT3D-5 puede preservar u ocultar contexto ya existente mediante `showContext`, pero `axonGlobals` aplica el estado sobre `pre.context`; **no activa contexto que no existiera**.

> preservar contexto ≠ materializar `site-context`.

Compatibilidad futura con axon/exploded requeriría decisión posterior explícita.

---

## 17. Capability snapshot reconciliado

```js
{
  version: 1,
  key: { entryId, revisions: [{levelId, projectId, revision}] },
  levels: [{levelId, name, order, hasPlan, roomCount}],
  structural: {
    plan: {availability, reason, targets},
    overview: {
      byLevel: [{levelId, availability, reason}],
      building: {availability:'unsupported', reason:'overview-building-unavailable'}
    },
    section: {byLevel: [...]},
    elevation: {...},
    roomTour: {rooms:[...]},
    axon: {
      availability,
      reason,
      scope:'building',
      coverages:['any','building'],
      variant:'compact-building',
      details:{levelIds, excluded}
    },
    explodedLevels: {
      availability,
      reason,
      scope:'building',
      coverages:['any','building'],
      variant:'vertical-levels',
      details:{levelIds, excluded}
    }
  },
  execution: {
    presentationPlan:{available, reason}
  },
  resources:{...}
}
```

`axon` y `explodedLevels` se derivan del **mismo descriptor FT3D-5**, evitando duplicar lógica.

El snapshot es puro; no lee DOM, CSS ni estado gráfico mutable.

---

## 18. Lifetime e invalidación

Se mantiene la decisión histórica:

- snapshot una vez al abrir Preparar presentación;
- reutilizado durante esa sesión mientras no cambie la key;
- key = `entryId + [(levelId, projectId, revision)]`;
- invalidación al cambiar revisión/entry/level;
- no caché persistente;
- plantilla/opciones no recalculan snapshot;
- abrir Presentation no incrementa revision.

---

## 19. Template registry y policies

Registry único, inmutable, validable y sin lógica gráfica.

Policies:

| Capability | real-estate | developer | architecture | renovation | interior-design |
|---|---|---|---|---|---|
| plan | P | P | R | R | P |
| overview | implícito | implícito | implícito | implícito | implícito |
| section | O | O | P | P | O |
| elevation | P | P | P | O | X |
| room-tour | R | P | P | P | R |
| axon | X | P | P | X | X |
| exploded-levels | X | P | O | X | X |
| solar | X | O | O | X | X |
| closing | R | R | R | R | R |
| resources | recomendación | recomendación | recomendación | recomendación | recomendación |

R=required, P=preferred, O=optional, X=excluded.

La policy semántica de axon/exploded se materializa a través del slot único `building-reading`.

---

## 20. minimumStory

Gramática:

```text
Expr := allOf | oneOf | atLeast | Atom
Atom := capability + optional coverage
```

Se evalúa **antes** del gate ejecutivo.

Un Atom se cumple si:

1. capability está `supported|partial`;
2. policy/override la mantiene incluida;
3. targets cumplen la coverage.

### 20.1 Por perfil

```text
real-estate:
  allOf[ oneOf[plan, overview, axon], room-tour ]

developer:
  oneOf[
    {overview, building},
    {plan, all-presented-levels},
    {elevation, building},
    {axon, building},
    {exploded-levels, building}
  ]

architecture:
  allOf[ plan, oneOf[section, elevation, axon, exploded-levels] ]

renovation:
  allOf[ plan, oneOf[room-tour, section] ]

interior-design:
  allOf[ oneOf[overview, plan, axon], room-tour ]
```

Axon/exploded ya son capabilities semánticas reales. Su inclusión efectiva sigue dependiendo de policy/override y de la normalización del slot `building-reading`.

### 20.2 Semántica vs ejecución

Ejemplo obligatorio:

```text
developer, dos niveles, axon supported, sin PresentationPlan
→ minimumStory = true
→ execution.presentationPlan unavailable
→ template unavailable / presentation-plan-unavailable
```

Nunca se convierte retroactivamente en `minimum-unmet`.

---

## 21. Validator

`validateCatalog(...)` sigue siendo puro.

Además de las reglas históricas, debe verificar para FT3D-5:

- `axon` y `exploded-levels` tienen adapters reales;
- scope `building`;
- coverages `any|building`;
- `repeatable:false`;
- `maxOccurrences:1`;
- reducedMotion `holds`;
- variants válidas;
- una sola materialización `building-reading`;
- ningún `ft3d5-pending` para esos IDs;
- `buildingReading` es la única fuente de override de materialización de axon/exploded.

`pending-implementation` puede existir para capabilities futuras, no para estas dos.

---

## 22. Session options

```js
{
  templateId,
  toggles:{[capabilityId]:boolean},
  facade:'automatic'|candidateId,
  rooms:[{levelId,roomId}]|null,
  solar:boolean,
  buildingReading:'automatic'|'compact'|'exploded'|'off'
}
```

Todo vive en memoria de sesión.

### 22.1 Una sola fuente de verdad para FT3D-5

`buildingReading` es el **único override de sesión que decide la materialización** entre `axon` y `exploded-levels`.

- `toggles` no contiene overrides independientes para `axon` ni `exploded-levels`; una implementación puede omitir esas keys o exponerlas sólo como estado derivado/read-only de `buildingReading`.
- El resolver normaliza primero policies + `buildingReading` y obtiene una única selección efectiva del slot.
- Esa selección efectiva es la que entra en minimumStory, dedup y adapter materialization.
- Nunca puede existir una combinación contradictoria como `axon=false`, `exploded=true`, `buildingReading:'compact'`.

`buildingReading`:

- `automatic`: aplica §13.1;
- `compact`: selecciona `axon` y exige `supported|partial`;
- `exploded`: selecciona `exploded-levels` y exige `supported|partial`;
- `off`: excluye ambas materializaciones y sólo se permite si minimumStory sigue cumpliéndose.

Para Arquitectura, `exploded-levels` es una alternativa explícita válida del grupo volumétrico del §20.1; no se finge que sea `axon`, pero satisface el mismo grupo profesional cuando se selecciona y está soportada.

No crea persistencia, localStorage, URL ni schema.

El sidecar histórico de rooms se preserva exactamente.

---

## 23. Overrides y reset

Precedencia:

```text
1. capability truth
2. accesibilidad/seguridad
3. minimumStory
4. session overrides
5. template defaults
```

No puede activarse una capability `unsupported` o `temporarily-unavailable`.

Una required puede apagarse sólo si minimumStory sigue cumpliéndose; en ese caso `degraded`. Si rompe el mínimo, se rechaza.

`closing` no es desactivable.

Reset:

- elimina overrides de sesión;
- restaura defaults;
- `buildingReading` vuelve a `automatic`;
- facade vuelve a `automatic`;
- Solar vuelve al default;
- no borra/rewrite el sidecar de rooms;
- no toca proyecto, brand ni audiencia.

---

## 24. Resolver

```js
resolveTemplate({template, capabilitySnapshot, runtime, sessionOptions})
→ ResolvedStory
```

Orden obligatorio:

```text
1. capability truth
2. policies + overrides
3. normalize buildingReading / effective semantic inclusion
4. semantic resolution
5. evaluate minimumStory
6. if false → unavailable / minimum-unmet
7. execution gate
8. if no PresentationPlan → unavailable / presentation-plan-unavailable
9. adapters + transitions
10. sequence
```

Garantías:

- puro;
- determinista;
- serializable;
- no muta input;
- sin DOM, Three, storage, network, Date o random;
- idioma, viewport y reduced motion no cambian resolución semántica.

La Story se congela al iniciar.

---

## 25. Adapter registry — P2/P5/P7

| Capability | adapterId | Scope | Escenas | Reduced |
|---|---|---|---|---|
| plan | `plan-reveal` | level | por overview de nivel | start-held |
| section | `section-open` | level | por nivel soportado | holds |
| elevation | `elevation-open` | building | una vez | holds |
| room-tour | `room-descent` + stops | room-collection | un descent por nivel + stops | start-held |
| axon | `axon-open` | building | una escena en primer overview elegible | holds `.5` |
| exploded-levels | `exploded-levels-open` | building | una escena en primer overview elegible | holds `.22,.645` |
| overview | — | level | anchor, no escena | — |

Si no existe overview elegible:

- la capability mantiene su verdad semántica;
- materialización se omite con `adapter-anchor-unavailable`;
- si no existe PresentationPlan, prevalece `presentation-plan-unavailable`.

---

## 26. Deduplicación

Se mantienen:

- un plan por nivel;
- un section por nivel;
- una elevation por Story;
- un closing;
- máximo un room-descent por nivel;
- un `(levelId,roomId)` una sola vez;
- enhancements fusionados con host.

FT3D-5 añade:

```text
max 1 axon por Story
max 1 exploded-levels por Story
max 1 building-reading total por Story
```

---

## 27. Transiciones y orden canónico

`endAnchor(A)` debe ser compatible con `startAnchor(B)` o usar sólo el relevo que el player ya soporta.

No se inventan cámaras ni rutas.

Bloque canónico por nivel:

```text
[plan(L)]
→ [section(L)]
→ [elevation, una vez]
→ [building-reading, una vez]
→ [room-tour(L)]
```

`elevation` y `building-reading` se insertan en el primer bloque que tenga anchor elegible.

Después del último bloque: `closing`.

Como axon/exploded vuelven al mismo `overview(level)`, pueden preceder directamente al `room-descent` del mismo nivel.

---

## 28. Story budget — P10

`SCENE_MS` real:

| Scene | ms |
|---|---:|
| `plan-reveal` | 6000 |
| `room-descent` | 3500 |
| `section-open` | 7000 |
| `elevation-open` | 8000 |
| `axon-open` | 7000 |
| `exploded-levels-open` | 10000 |

FT3D-6 no modifica esos valores.

Son **duración/peso narrativo nominal**, no:

- frames;
- duración de captura;
- wall-clock de tests;
- coste GPU/CPU;
- benchmark.

Con dos niveles, el máximo nominal histórico ~41 s puede llegar aproximadamente a:

- ~48 s con compact axon;
- ~51 s con exploded.

Nunca se suman 7 s + 10 s porque el slot building-reading es único.

Room budget sigue controlando selección de rooms, no número de escenas; selección explícita >6 se conserva con `room-budget-exceeded`.

---

## 29. Room-tour

Se conserva como composite híbrido:

- primer room-descent animado por nivel;
- resto de rooms elegidas = stops;
- como máximo un descent por nivel;
- sin ruta continua inventada;
- sin room→overview nuevo;
- sin escena por cada room.

Selección automática:

1. sidecar explícito válido tiene precedencia;
2. candidatos válidos;
3. prioridad por `family` según perfil;
4. diversidad antes de repetir;
5. desempate estable;
6. unclassified: área desc → orden fuente → roomId;
7. recorte a budget con `rooms-trimmed`.

Selección explícita no se recorta; si supera budget → `room-budget-exceeded`.

---

## 30. Ejecución sin rooms

Toda Story ejecutada sigue necesitando PresentationPlan válido.

Tres capas:

| Capa | Verdad | PresentationPlan |
|---|---|---|
| capability semántica | modelo/descriptor | no necesariamente |
| adapter | materialización | sí |
| gate ejecutivo | Story ejecutable | sí |

FT3D-5 **no cambia** esta frontera.

Un axon supported puede satisfacer minimumStory y aun así resultar:

```text
unavailable / presentation-plan-unavailable
```

si falta PresentationPlan.

---

## 31. Section

Se mantiene el contrato histórico FT3D-3:

- scope level;
- adapter `section-open`;
- overview→overview;
- una por nivel;
- reasons `no-bounds` / `no-crossing`;
- agregado partial;
- reduced hold;
- 7000 ms.

FT3D-6 no recalcula corte ni simula section rebajando muros.

---

## 32. Elevation

Se mantiene FT3D-4:

- scope building;
- adapter `elevation-open`;
- una por Story;
- candidate real, nunca «fachada principal» inventada;
- partial normalizado;
- Solar como enhancement opcional;
- `site-context` como enhancement de elevation;
- overview→overview;
- reduced holds;
- 8000 ms.

---

## 33. Axon y exploded-levels — contrato reconciliado

### 33.1 Axon

```text
id: axon
family: atomic-scene
scope: building
coverages: any, building
variant: compact-building
adapterId: axon-open
repeatable: false
maxOccurrences: 1
repeatScope: building
startAnchor: overview(level de inserción)
endAnchor: mismo overview
reducedMotionSupport: holds
SCENE_MS: 7000
```

Disponible con ≥1 nivel estructural válido.

### 33.2 Exploded-levels

```text
id: exploded-levels
family: atomic-scene
scope: building
coverages: any, building
variant: vertical-levels
adapterId: exploded-levels-open
repeatable: false
maxOccurrences: 1
repeatScope: building
startAnchor: overview(level de inserción)
endAnchor: mismo overview
reducedMotionSupport: holds
SCENE_MS: 10000
```

Requiere ≥2 niveles estructurales válidos.

### 33.3 Semántica

Ambas explican relaciones espaciales.

Exploded **no** expresa:

- orden de obra;
- fase temporal;
- secuencia constructiva;
- dependencia profesional.

### 33.4 Runtime

FT3D-6 no inventa cámara, separación, transform ni visibility policy. Consume FT3D-5.

---

## 34. Solar y site-context

Solar:

- optional;
- host único `elevation`;
- runtime availability;
- no capítulo propio;
- si falla, elevation continúa.

Site:

- `site-data` = resource;
- `site-context` = enhancement;
- host V1 único = `elevation`.

P8 queda cerrado: axon/exploded **no** se añaden como hosts V1. Su lifecycle puede preservar/ocultar context pero no materializa el enhancement.

---

## 35. Resources

`materials`, `moodboard`, `budget-summary`, `dossier`, `site-data` no tienen adapter Story V1.

Pueden aparecer en:

- `ResolvedStory.resources`;
- recomendaciones de salida FT3D-7.

No se duplican cálculo económico, assets ni datos.

---

## 36. Branding y closing

Branding es transversal y usa `FloorPlanBrand` existente.

`closing`:

- una vez;
- terminal;
- neutral sin brand;
- sin CTA inventado;
- no añade capítulo visual nuevo V1.

---

## 37. Una y dos plantas

El contrato usa colecciones, aunque producto actual limita `MAX_LEVELS=2`.

### Developer

En multinivel, la lectura global puede satisfacerse por:

- plan en todos los niveles;
- elevation;
- axon;
- exploded-levels.

Default building-reading:

```text
exploded si supported|partial
else compact axon si supported|partial
else none
```

### Architecture

Default building-reading:

```text
compact axon si supported|partial
```

Exploded es optional explícito y puede satisfacer la alternativa volumétrica del minimumStory cuando se selecciona y está soportado.

Los demás perfiles mantienen su policy histórica sin building-reading por defecto.

---

## 38. Ámbito objetivo

FT3D-6 resuelve:

- proyecto simple = building de un nivel;
- building actual hasta dos niveles.

No inventa unidad inmobiliaria, vivienda tipo ni multi-building.

---

## 39. Mobile

En 390×844 y 844×390:

- misma Story semántica;
- mismos targets/warnings;
- controls accesibles;
- sin overflow horizontal;
- configuración mediante select/details;
- QA específica de holds FT3D-5 para que la tarjeta no tape lectura crítica.

---

## 40. Accesibilidad y copy

- labels y aria-describedby para razones;
- estado y omisiones en texto;
- nada depende sólo del color/movimiento;
- room-tour no promete ruta animada continua;
- exploded usa «despiece por plantas», nunca «fases de obra»;
- partial FT3D-5 explica niveles excluidos;
- ES/EN/ZH mediante sistema actual;
- user data como texto, no HTML.

---

## 41. Movimiento reducido

Story semántica idéntica.

- plan/room-tour: `start-held`;
- section/elevation: holds existentes;
- axon: hold `.5`;
- exploded: holds `.22`, `.645`.

Un adapter `reducedMotionSupport:'none'` se rechaza.

---

## 42. Offline

Snapshot, resolver, selección de template y Story no usan red.

FT3D-6 no hace:

- OpenAI calls;
- descargas territoriales nuevas;
- downloads de assets;
- network para resolver capability.

---

## 43. Recomendaciones de salida

Se mantienen separadas de `sequence`:

| Template | Outputs recomendados |
|---|---|
| real-estate | video, share |
| developer | dossier, share, video |
| architecture | dossier, share |
| renovation | dossier, budget-summary |
| interior-design | moodboard, share |

No implican implementación.

---

## 44. Frontera FT3D-7

FT3D-6 decide qué contar.

FT3D-7 decide cómo entregarlo.

FT3D-6 no implementa nuevos export/share/upload/video/package.

---

## 45. Vídeo y captura

B3 actual graba stops, no Story completa. FT3D-6 no lo rompe.

Futuro vídeo Story pertenece a FT3D-7.

Capture determinista: mismo proyecto + template + snapshot + session options → misma resolución/orden/reasons.

---

## 46. Fallos

| Momento | Caso | Política |
|---|---|---|
| Preflight | capability unavailable | omitir con reason antes de iniciar |
| Materialización | overview/adapter no ejecutable | `adapter-anchor-unavailable` o `presentation-plan-unavailable` |
| Runtime preferred/optional | falla | skip seguro + `adapter-runtime-failure` + restore |
| Runtime required pero minimum sigue | falla | continuar degraded |
| Runtime rompe minimum | falla | close limpio + restore |

Nunca crash.

No se reconstruye Story completa en mitad de playback.

Escape/Close/Back restauran exactamente.

---

## 47. Warnings

Modelo:

```js
{type, code, severity, capability?, target?, params?}
```

Además de los warnings históricos, se añaden:

- `axon-unsupported`;
- `axon-partial`;
- `exploded-levels-unsupported`;
- `exploded-levels-partial`;
- `adapter-anchor-unavailable`.

Reasons FT3D-5 se propagan en `params.reason`.

Partial adjunta `params.excluded`.

Se elimina `ft3d5-pending` para axon/exploded.

`pending-implementation` sigue reservado para futuras capabilities no implementadas.

---

## 48. QA contractual

La implementación futura debe conservar todas las suites y gates históricos del working contract `5db3c1b…` y añadir cobertura específica FT3D-5/FT3D-6.

### 48.1 Snapshot

1. axon supported con 1 nivel válido;
2. axon partial;
3. `no-levels`;
4. `invalid-level-geometry`;
5. `degenerate-building-envelope`;
6. exploded `single-level`;
7. exploded `insufficient-valid-levels`;
8. exploded partial;
9. scope building/coverages any+building;
10. sin `ft3d5-pending`.

### 48.2 Adapter/anchors

11. axon→axon-open;
12. exploded→exploded-levels-open;
13. primer overview elegible;
14. sin overview → no anchor inventado;
15. p0/p1 = overview;
16. una sola building-reading;
17. exploded no añade axon separado;
18. reverse/seek/replay sin drift;
19. Close/Escape/Back restaura.

### 48.3 Variants

20. developer automatic 2 niveles válidos → exploded;
21. developer automatic 1 nivel → compact;
22. architecture automatic → compact;
23. architecture explicit exploded → exploded si supported y puede satisfacer la alternativa volumétrica del minimumStory;
24. exploded unsupported → override disabled/rejected;
25. `off` sólo si minimumStory sigue válido;
26. `toggles` no introduce una segunda fuente de verdad para axon/exploded.

### 48.4 Reduced

27. axon hold .5;
28. exploded holds .22/.645;
29. misma semántica con reduced.

### 48.5 Building/context

30. source usa niveles estructurales, no sólo rooms;
31. active→all no altera snapshot;
32. levelView restore exacto;
33. site-context no adquiere host FT3D-5;
34. preservar contexto runtime no equivale a enhancement activo.

### 48.6 Timing

35. 7000/10000 desde SCENE_MS;
36. exploded no suma axon;
37. no confundir SCENE_MS con frames/wall-clock/performance.

### 48.7 P11

38. developer sin rooms + axon supported → minimum true, execution unavailable;
39. overview(building) sigue unsupported;
40. FT3D-5 no se ejecuta sin overview real;
41. equivalencia de un nivel no crea overview(building).

### 48.8 Evidencia visual

42. developer multinivel;
43. architecture compact;
44. architecture explicit exploded;
45. exploded reverse/recompose/restore;
46. 390×844 y 844×390 en holds críticos;
47. reduced compact/exploded.

Además siguen siendo obligatorios:

- unitarias de resolver/validator;
- browser tests de cinco perfiles;
- offline;
- JSON sin cambios;
- sin nueva storage/network;
- regression vs base;
- screenshots/video revisados;
- evidencia sobre HEAD final.

Automated green ≠ visual acceptance.

---

## 49. Edge cases reconciliados

| Caso | Resultado |
|---|---|
| Sin rooms + minimum exige room-tour | `minimum-unmet` |
| Sin rooms + minimum semántico válido | `presentation-plan-unavailable` |
| 1 nivel válido | axon supported; exploded `single-level` |
| 2 niveles válidos | axon/exploded supported |
| 2 fuente, 1 válido | axon partial; exploded `insufficient-valid-levels` |
| ≥2 válidos + alguno inválido | ambas partial + excluded |
| sin niveles | `no-levels` |
| geometría inválida total | `invalid-level-geometry` |
| envelope degenerado | `degenerate-building-envelope` |
| developer automatic, exploded available | sólo exploded-levels-open |
| developer automatic, exploded no/axon sí | sólo axon-open |
| architecture automatic | axon-open |
| architecture explicit exploded supported | exploded-levels-open; alternativa volumétrica válida |
| architecture explicit exploded unsupported | override rechazado |
| axon+exploded disponibles | una sola building-reading según selector efectivo |
| no PresentationPlan | semantic puede ser true; execution bloqueada |
| PresentationPlan sin overview elegible | `adapter-anchor-unavailable` |
| 2 niveles + sólo overview L0 | no overview(building); otras alternativas pueden cumplir |
| contexto existente | FT3D-5 puede preservarlo/ocultarlo; no host nuevo |
| contexto ausente | FT3D-5 no lo crea |
| reduced | mismas capabilities, holds |
| exploded | nunca construcción temporal |
| selection explícita > room budget | se conserva + `room-budget-exceeded` |
| auto selection recortada | `rooms-trimmed` |
| section/elevation partial | availability partial + reasons |
| sin norte | labels neutrales |
| Solar unavailable | elevation continúa |
| resource sin adapter | recommendation/resource only |
| offline | resolver sin red |
| capture | determinista |
| project JSON | idéntico antes/después |

---

## 50. P1–P11 — cierre definitivo

| # | Resolución | Evidencia integrada | Estado |
|---|---|---|---|
| P1 | axon/exploded normalizados desde descriptor V2; ya implementados | `presentation-axon-core.js` | **CLOSED** |
| P2 | `axon-open` / `exploded-levels-open` | Story NARRATIVES | **CLOSED** |
| P3 | scope building; coverages any/building | FT3D-5 contract + source | **CLOSED** |
| P4 | compact-building / vertical-levels; slot único building-reading | descriptor + `axonMode` + `fullStory()` | **CLOSED** |
| P5 | overview(level) → mismo overview; primer overview elegible | FT3D-5 contract + p0/p1 | **CLOSED** |
| P6 | repeatable false; max1; repeatScope building; slot max1 | contract/runtime | **CLOSED** |
| P7 | holds .5 y .22/.645 | Story constants + player | **CLOSED** |
| P8 | all structural levels; active→all/restore; site-context sigue elevation-only | FT3D-5 lifecycle + `axonGlobals` | **CLOSED** |
| P9 | global reasons + single-level/insufficient-valid-levels + partial/excluded | axon core | **CLOSED** |
| P10 | SCENE_MS 7000/10000; nominal narrative only | Story core | **CLOSED** |
| P11 | no overview(building), no anchor sin plan, no lift del execution gate | FT3D-5 contract §4.3/§5.1 | **CLOSED** |

> **P1–P11 CLOSED: 11/11.**

No queda ninguna dependencia documental FT3D-5 abierta para implementar FT3D-6 cuando exista autorización separada.

---

## 51. Decisiones cerradas

Se mantienen todas las decisiones cerradas históricas y se añaden:

1. axon/exploded son capabilities V1 reales, no pending;
2. scope building y coverages any/building;
3. adapters reales;
4. variants compact-building/vertical-levels;
5. slot único building-reading;
6. anchors overview(level) reales;
7. max una lectura building por Story;
8. reduced holds reales;
9. site-context sigue elevation-only;
10. reasons/partial FT3D-5 normalizados;
11. timings 7000/10000 nominales;
12. no overview(building);
13. FT3D-5 no levanta `presentation-plan-unavailable`;
14. visual acceptance sigue gate QA/humano externo;
15. donor reconciliation no canoniza nuevas capabilities V1;
16. `buildingReading` es la única fuente de override de materialización axon/exploded;
17. Arquitectura admite `exploded-levels` como alternativa volumétrica explícita del minimumStory.

---

## 52. Riesgos

| Riesgo | Nivel | Mitigación |
|---|---|---|
| building alternatives producen narrativa redundante | Medio | slot único building-reading |
| dos fuentes de verdad axon/exploded | Alto si ocurre | `buildingReading` único; toggles derivados/no independientes |
| exploded se interpreta como fases de obra | Alto semántico | copy despiece espacial; FT3D-8 separado |
| semantic supported sin plan ejecutable | Medio | minimumStory separado de execution gate |
| contexto existente confundido con site-context | Medio | host V1 sólo elevation |
| partial ocultado | Medio | availability partial + excluded + warning |
| hold móvil tapa lectura | Medio | QA visual por variant/hold |
| timing usado como benchmark | Bajo | SCENE_MS definido como narrativa nominal |
| donor variants entran sin contrato | Alto | Rubik commands; donor informs |
| lógica profesional filtra a renderer/UI | Alto | registry/resolver únicos |

---

## 53. DONE futuro de implementación

Antes de implementar FT3D-6:

1. FT3D-5 integrado ✅
2. Global Donor Reconciliation aprobada e integrada ✅
3. P1–P11 reconciliados ✅ 11/11
4. Auditoría contractual de esta revisión ✅ **APPROVED**
5. Promoción explícita a contrato canónico ✅ **AUTHORIZED / PERFORMED**
6. **Autorización separada de implementación** ⛔ **NO**

DONE futuro exige:

- `presentation-templates-core.js` puro;
- registry + validator + snapshot + resolver;
- adapter registry;
- UI dentro de Entregar → Presentación;
- paridad «Sin plantilla»;
- QA contractual completa;
- comparación de base;
- evidencia visual sobre HEAD final;
- JSON intacto;
- sin persistencia/localStorage/red nuevos;
- mobile/reduced equivalentes;
- salidas existentes intactas;
- revisión humana del resultado de implementación;
- integración sólo con autorización explícita.

---

## 54. Control result

```text
Master baseline used for reconciliation: d7f59f7e02bde8f8bbef94e353f0361dc40ac2c4
Historical working contract: 5db3c1b48972128f2769598141cbe2268b792bfa
FT3D-5 integrated: YES
Global donor reconciliation integrated: YES
P1–P11 resolved: YES — 11/11
Contract audit: APPROVED
Canonical promotion authorized by user: YES
Canonical promotion performed: YES
Product modified: NO
Runtime modified: NO
Schemas modified: NO
Original Atlas modified: NO
Sculpture performed: NO
Donor capabilities auto-added to V1: NO
FT3D-6 implemented: NO
Implementation authorized: NO
```

> **FT3D-6 CANONICAL IMPLEMENTATION CONTRACT V1: APPROVED AND PROMOTED — IMPLEMENTATION NOT AUTHORIZED**

La promoción del contrato no equivale a autorizar implementación.