# FT3D-6 — Plantillas de Presentation por perfil profesional — working contract

**Fecha:** 01-11-2026.

**Repositorio:** `Juanmaes83/floorplan-3d`.

**Rama:** `docs/ft3d-6-working-contract-after-ft3d4`, creada desde `master@f74c4ee6bca58077a1135d4db2466e4332d0d5e7`.

**Draft fuente:** `docs/ft3d-6-profile-templates-contract@388c03b67b98fccef85e310dd2e7665514111b3d`.

## 1. Estado y jerarquía documental

| Documento | Estado | Autoridad |
|---|---|---|
| [Draft 31-10-2026](ft3d-6-profile-templates-contract-draft-2026-10-31.md) | **DRAFT HISTÓRICO APROBADO** | Intención de producto aprobada. Se conserva sin cambios de cuerpo; sólo lleva un encabezado de estado que remite aquí. No se borra |
| Este documento | **WORKING CONTRACT — reconciliado con FT3D-1/2/3/4; pendiente sólo de reconciliación FT3D-5 donde se indique** | Única fuente de trabajo de FT3D-6. Si discrepa del draft, prevalece este documento |

Este documento **no** es todavía el contrato canónico de implementación. Para promoverlo hacen falta tres pasos, en este orden:

1. Integrar y cerrar FT3D-5.
2. Resolver todas las marcas **PENDIENTE DE RECONCILIACIÓN TRAS FT3D-5** de la §50.
3. Aprobar la promoción a contrato canónico. Será una revisión de este mismo documento, no un tercer documento paralelo.

Esta misión es sólo documental. No implementa FT3D-6 ni autoriza su implementación.

### 1.1 Verificación de bases

| Referencia | SHA esperado | SHA observado en `origin` | Resultado |
|---|---|---|---|
| `master` | `f74c4ee6bca58077a1135d4db2466e4332d0d5e7` | `f74c4ee6bca58077a1135d4db2466e4332d0d5e7` | coincide |
| `docs/ft3d-6-profile-templates-contract` | `388c03b67b98fccef85e310dd2e7665514111b3d` | `388c03b67b98fccef85e310dd2e7665514111b3d` | coincide |

No hay divergencia.

En `master` ya están integrados FT3D-1a, 1b, 2a, 3 y 4. El HEAD funcional de FT3D-4 es `e716ba9`; los dos commits documentales posteriores son `41f44c7` y `f74c4ee`.

### 1.2 Qué cambia respecto al draft

El draft se escribió sobre `806e855`, donde FT3D-4 todavía era sólo un contrato. Este working contract:

- reconcilia los mapeos con el código real integrado (§30–§32);
- sustituye la taxonomía de cuatro familias por la de seis (§7);
- cierra, para que no dependan de FT3D-5, decisiones que el draft difería:
  - ejecución sin rooms (§29.7);
  - room-tour compuesto (§29);
  - anchors (§10);
  - plantilla por defecto (§6.3);
  - persistencia (§22);
  - presupuesto narrativo (§28);
  - transiciones (§27);
- deja pendiente únicamente lo que depende del contrato real de `axon` y `exploded-levels` (§33, §50).

## 2. Objetivo

FT3D-6 responde a una pregunta: **¿qué historia profesional debemos contar con las capacidades que este proyecto realmente tiene?**

```text
proyecto
+ capability snapshot estructural          (derivado del modelo)
+ disponibilidad runtime de enhancements   (p. ej. Solar)
+ template                                 (dato inmutable del registry)
+ session overrides controlados            (elecciones del profesional)
        ↓
resolver puro
        ↓
resolved semantic story                    (datos serializables)
        ↓
Presentation Story adapter                 (registry de adapters)
        ↓
Story existente: NARRATIVES + sequence + player único de presentation-ui
```

**FT3D-6 decide:**
- selección y prioridad;
- orden semántico;
- degradación y warnings;
- composición.

**FT3D-6 no decide:**
- geometría;
- cámara concreta de section, elevation o axon;
- cálculo Solar;
- clasificación exterior;
- implementación de salidas.

Principio rector: **más contexto, no más falsa certeza**. FT3D amplía Rubik, no lo sustituye. Todo lo nuevo se suma y nada existente se elimina sin decisión expresa de Juanma.

## 3. No objetivos

FT3D-6 V1 **no crea**:
- Story engine, player, renderer ni canvas nuevos;
- cámaras por profesión;
- geometría;
- editor de timeline;
- schema;
- persistencia de proyecto.

**No dispersa** lógica profesional por renderer, UI, Story, capture o vídeo. Están prohibidas las ramas del tipo `if (template === …)` fuera del registry y el resolver.

**No usa:**
- red obligatoria;
- IA automática: B2/B8 no entran en V1;
- clasificación profesional inferida.

**Fuera de V1:**
- la plantilla «Personalizada»: no se crea ahora; puede estudiarse en el futuro y no queda prohibida para siempre;
- la duración o velocidad global personalizable;
- 360;
- timeline constructivo (FT3D-8);
- before/after;
- capítulos de moodboard, materiales o presupuesto sin adapter aprobado;
- soporte de más de dos niveles;
- multi-edificio;
- exportación, share o empaquetado nuevos (FT3D-7).

## 4. Autoridades (consumidas, nunca recalculadas)

| Autoridad | Módulo real | FT3D-6 consume |
|---|---|---|
| Plan de presentación | `FloorPlanPresentation` (`js/presentation-core.js`): `create` (v1, un nivel), `createBuilding` (v2, `MAX_LEVELS=2`), `reconcile`, `sidecar`, `currentBuilding` | Paradas `overview`/`room`, rooms válidas, revisión, niveles presentados |
| Motor Story | `FloorPlanPresentationStory` (`js/presentation-story-core.js`): `NARRATIVES`, `SCENE_MS`, `sequence`, `create` | Kinds `plan-reveal`, `room-descent`, `section-open`, `elevation-open`, pesos y holds |
| Player y composición | `js/presentation-ui.js`: `fullStory`, `openStory`, `enterScene`, `finishStory`, `closeStory`, `nextHold` | Un único player, restauración y movimiento reducido |
| Sección (FT3D-3) | `FloorPlanPresentationSection.derive` / `buildingAxis` | `supported`, `reason` (`no-bounds`, `no-crossing`), por `levelId` |
| Fachada (FT3D-4) | `FloorPlanPresentationElevation.derive` | `supported`, `reason`, `partial`, `candidates`, `defaultId`, `envelope`, cardinal opcional |
| Exterior | `FloorPlanExterior.derive` (vía FT3D-4) | Nunca directamente desde FT3D-6 |
| Solar | `FloorPlanSolarUI.result` (`status:'available-orientative'`), `localDate`, `localTime` | Disponibilidad runtime del enhancement |
| Norte | `site.northOffsetDeg` | Única fuente de nombres cardinales, a través de FT3D-4 |
| Rooms | `project.rooms[].family` (enum opcional desde schema 1.6.0) y `name` | Tipo semántico frente a etiqueta |
| Moodboard | `FloorPlanMoodboard.derive` | Recurso |
| Presupuesto (C4) | `FloorPlanBudgetPresentation.buildReport` | Recurso; no se reabre C4 |
| Identidad | `FloorPlanBrand` (Mi estudio) | Branding transversal |
| Audiencia del profesional | `rubik-professional-audience-v1` en `guide-ui.js` | Sólo lectura, como indicio pasivo (§6.4) |

## 5. Perfiles V1

Cinco perfiles exactos: Inmobiliaria, Promotora, Arquitectura, Reformas e Interiorismo. La plantilla «Personalizada» queda fuera de V1 (§3).

| Perfil | Objetivo de una línea (copy refinable) |
|---|---|
| Inmobiliaria | Prioriza un recorrido claro de la vivienda, sus estancias y su exterior |
| Promotora | Prioriza la lectura del edificio y sus niveles antes que los espacios concretos |
| Arquitectura | Prioriza organización espacial, sección, fachada y lectura volumétrica |
| Reformas | Prioriza la distribución propuesta y los espacios relevantes, con sección cuando el modelo la permite |
| Interiorismo | Prioriza las estancias, su ambiente y los acabados asignados |

## 6. IDs, versionado e internacionalización

### 6.1 IDs canónicos (cerrado)

| Perfil | `id` | `version` |
|---|---|---|
| Inmobiliaria | `real-estate` | 1 |
| Promotora | `developer` | 1 |
| Arquitectura | `architecture` | 1 |
| Reformas | `renovation` | 1 |
| Interiorismo | `interior-design` | 1 |

Reglas de los IDs:
- en kebab-case ASCII, sin depender del idioma ni de las labels;
- estables y aptos para serializar, compartir o depurar en el futuro;
- `version` es un entero ≥ 1 por plantilla: sirve para evolucionar y depurar, no implica persistencia.

Las labels se resuelven con el sistema de traducción actual (`tx` ES/EN/ZH) mediante claves de copy separadas, del tipo `presentation.template.<id>.name|purpose`. La lógica nunca compara labels.

### 6.2 Validación contra el código actual

`guide-ui.js` ya define audiencias profesionales con los IDs `architecture`, `real-estate`, `developer`, `renovation` e `interior`.

Los cuatro primeros coinciden, a propósito, con los IDs de plantilla. Para Interiorismo se **mantiene** `interior-design`:
- es el ID del draft aprobado y es más preciso;
- audiencia y plantilla son espacios de nombres distintos: la audiencia es quién trabaja, la plantilla es qué historia se cuenta.

La correspondencia se declara en una tabla explícita del registry: `audienceToTemplate = {architecture, real-estate, developer, renovation, interior → interior-design}`. Nunca se deriva por coincidencia de texto.

Ningún otro ID del código entra en conflicto. Los estilos del dossier A4 (`client`, `studio`…) son otro espacio de nombres.

### 6.3 Plantilla por defecto neutral (cerrado)

El valor por defecto es **«Sin plantilla»**: el diálogo actual se comporta exactamente como hoy.
- Las opciones FT3D-1a, 3 y 4 empiezan desactivadas, con sus controles actuales.
- Elegir una plantilla es un acto explícito.
- Ninguna plantilla se preselecciona.

Esto garantiza la paridad con la configuración histórica (§47, browser 30).

### 6.4 Sin recomendación automática de profesión (cerrado)

V1 no infiere profesión, tipo de cliente ni plantilla a partir del proyecto, el nombre, la marca, Phase D ni IA.

Única ayuda permitida: si existe una audiencia **elegida explícitamente** por el profesional en `rubik-professional-audience-v1`, el selector puede mostrar junto a la plantilla correspondiente una marca pasiva («Coincide con tu perfil»).
- No la preselecciona, no reordena ni oculta las demás y no escribe en esa clave.
- Si la clave no existe, falla o tiene un valor desconocido, no aparece ninguna marca.

Cualquier sugerencia más fuerte requiere una decisión futura aparte.

## 7. Taxonomía de capabilities (seis familias, cerrado)

| Familia | Definición | Capabilities V1 | Puede ser capítulo | Satisface minimumStory |
|---|---|---|---|---|
| **A. atomic-scene** | Unidad Story ejecutable con lifecycle propio (begin/apply/end, restauración) | `section`, `elevation`; futuras `axon`, `exploded-levels` | Sí, mediante adapter | Sí, si está resuelta |
| **B. composite** | Produce N escenas o paradas | `room-tour` | Sí (N) | Sí, si resuelve ≥ 1 room |
| **C. anchor** | Estado narrativo de entrada o salida; no es un capítulo independiente | `plan`, `overview` | Sólo se materializa (§30) | Sí, si se materializa |
| **D. enhancement** | Enriquece una escena anfitriona compatible | `solar` | Nunca | Nunca |
| **E. resource** | Dato o documento disponible, sin obligación de ser escena | `materials`, `moodboard`, `budget-summary`, `dossier` | Sólo con adapter aprobado (ninguno en V1) | Nunca en V1 |
| **F. story-structure** | Estructura común del relato | `closing` | Estructura terminal, no capítulo geométrico | Nunca |

`exterior` y `site` del draft quedan reconciliados así:
- **Exterior del modelo:** no hay escena propia en Story. La lectura exterior real es la fase `perspective`/`exterior` de `elevation-open`, con el contexto visible.
- **`site`:** pasa a ser **resource** (territorio o contexto ya cargado, `View3D.territoryInfo`). Puede ser visible dentro de la anfitriona `elevation`, pero no es capítulo.

Ninguna de las dos crea escena en V1. Un capítulo exterior o de contexto independiente requeriría un adapter futuro aprobado.

## 8. Capability contract

Toda capability se describe con metadatos estables. Esta es la semántica cerrada; los nombres son orientativos hasta implementar:

| Campo | Semántica |
|---|---|
| `id` | ID semántico estable (§7) |
| `family` | Una de las seis familias |
| `version` | Entero ≥ 1 del contrato de la capability |
| `availability` | Estado de capability (§19.1) |
| `reason` | Código estable o `null` si `supported`; nunca texto en español |
| `scope` | Ámbito de la capability (§9) |
| `targets` | Colección de destinos concretos dentro del scope: `levelId[]`, `candidateId[]`, `(levelId, roomId)[]` |
| `repeatable` / `maxOccurrences` / `repeatScope` | Repetición (§12) |
| `startAnchor` / `endAnchor` | Anchors (§10); `null` para enhancements, resources y structure |
| `requires` | Capabilities o hechos sin los cuales no puede insertarse |
| `compatibleHosts` | Sólo enhancements: anfitrionas válidas |
| `reducedMotionSupport` | `holds` \| `start-held` \| `none` (§41) |
| `adapterId` | Adapter Story, o `null` (anchor implícito, resource o enhancement) |

«Disponible» no basta. El resolver también comprueba **si puede insertarse aquí y con este scope**: `requires`, `compatibleHosts`, anchors y `repeatScope`.

## 9. Scopes

| Scope | Significado | Capabilities V1 |
|---|---|---|
| `project` | El proyecto abierto (un nivel) o la entrada | `plan` en un nivel; resources |
| `building` | El edificio presentado (colección de niveles) | `elevation`, `solar` vía anfitriona, `closing` |
| `level` | Un nivel concreto (`levelId`; `null` en proyecto simple) | `plan`, `overview`, `section` |
| `facade` | Una candidata de FT3D-4 dentro de `building` | Target de `elevation` |
| `room` | `(levelId, roomId)` | Miembro de `room-tour` |
| `room-collection` | Lista ordenada de rooms | `room-tour` |

Reglas:
- Los niveles son siempre **colecciones** (`levels[]`), nunca `level1`/`level2`. Hoy `MAX_LEVELS=2`, pero el contrato es válido conceptualmente para N.
- Un proyecto de un nivel es un `building` de un solo nivel con `levelId=null`.
- FT3D-6 no decide la repetición sin conocer el scope.

## 10. Anchors de entrada y salida (verificados en el código)

| Capability | Adapter real | `startAnchor` | `endAnchor` | Evidencia |
|---|---|---|---|---|
| `plan` | `plan-reveal` | `plan(level)`: vista de planta 2D del editor | `overview(level)` | `planReveal`: fase `plan`, después `walls`/`lens`, y en p=1 la pose `end` = parada overview |
| `overview` | (anchor) | — | — | Parada `kind:'overview'` de PresentationPlan, por nivel |
| `section` | `section-open` | `overview(level)` | `overview(level)` | FT3D-3: parte de la pose de overview y vuelve a ella |
| `elevation` | `elevation-open` | `overview(level de inserción)` | `overview(mismo level)` | FT3D-4: p=0 y p=1 son la pose exacta de overview (`samePose` en los tests) |
| `room-tour` | `room-descent` + paradas | `overview(level)` | `room(level, última room)` | `roomDescent`: p=0 fase `overview`, p=1 fase `room` |
| `closing` | (estructura) | cualquier anchor | terminal | Fin del player (`finishStory`) |
| `axon`, `exploded-levels` | — | **PENDIENTE DE RECONCILIACIÓN TRAS FT3D-5** | **PENDIENTE DE RECONCILIACIÓN TRAS FT3D-5** | — |

Hay un overview **por nivel**. En `master@f74c4ee` no existe un overview de edificio: `createBuilding` emite una parada overview por cada nivel presentado. Ver §30 y §37.

## 11. Dependencias y compatibilidad

| Capability | `requires` | `compatibleHosts` / regla |
|---|---|---|
| `plan` | Un PresentationPlan válido que contenga el nivel | — |
| `section` | `overview(level)` en la secuencia; `section.derive(level).supported` | — |
| `elevation` | `overview` de algún nivel; `elevation.derive(building).supported` y una candidata | — |
| `room-tour` | `overview(level)` de cada nivel con rooms; ≥ 1 room válida elegida | — |
| `solar` | Una anfitriona resuelta y `FloorPlanSolarUI.result.status==='available-orientative'` | `['elevation']`. No existe aislada; si la anfitriona se omite, Solar se omite con `solar-no-host` |
| `materials`, `moodboard`, `budget-summary`, `dossier` | El recurso existe | Sin adapter: no hay inserción posible, sólo recomendación (§35) |
| `closing` | — | Siempre al final, una vez |
| `exploded-levels` | Previsiblemente ≥ 2 niveles | **PENDIENTE DE RECONCILIACIÓN TRAS FT3D-5** |

## 12. Repetibilidad

| Capability | `repeatable` | `maxOccurrences` | `repeatScope` |
|---|---|---|---|
| `plan` | sí | 1 por nivel | `level` |
| `overview` | anchor reutilizable | No es un capítulo; se materializa con `plan` o con la parada | `level` |
| `section` | sí | 1 por nivel soportado | `level` |
| `elevation` | no | 1 por Story (por edificio) | `building` |
| `room-tour` | composite | 1 composite por Story; N rooms, cada `(levelId, roomId)` como máximo una vez | `room-collection` |
| `solar` | no | 1, con su anfitriona | `building` |
| `closing` | no | 1 | Story |
| `axon`, `exploded-levels` | **PENDIENTE DE RECONCILIACIÓN TRAS FT3D-5** | **PENDIENTE DE RECONCILIACIÓN TRAS FT3D-5** | **PENDIENTE DE RECONCILIACIÓN TRAS FT3D-5** |

Esto coincide con el código: `fullStory` inserta `elevation-open` una sola vez (`facade=true`) y `section-open` por cada nivel soportado.

## 13. Capability snapshot

Es un snapshot **estructural y puro**:
- no lee el DOM, ni botones, ni visibilidad CSS;
- se construye desde los cores y descriptors existentes, a partir de los mismos `levels` que hoy reciben `sectionOption` y `elevationOption` (`project`, `geometry`, `offsetMm`, `elevationMm`, `levelId`).

```js
{
  version: 1,
  key: { entryId, revisions: [{ levelId, projectId, revision }] },  // invalidation key (§14)
  levels: [{ levelId, name, order, hasPlan, roomCount }],          // colección, nunca level1/level2
  structural: {
    plan:      { availability, reason, targets: [levelId] },
    section:   { byLevel: [{ levelId, availability, reason }] },  // de section.derive
    elevation: { availability, reason, partial, candidates: [{ id, label, cardinal }], defaultId },
    roomTour:  { rooms: [{ levelId, roomId, family, label, areaM2, order }] },
    axon:            { availability: 'pending-implementation', reason: 'ft3d5-pending' },
    explodedLevels:  { availability: 'pending-implementation', reason: 'ft3d5-pending' }
  },
  resources: {
    site:          { available, reason },
    materials:     { available, adapter: null },
    moodboard:     { available, adapter: null },
    budgetSummary: { available, adapter: null },
    dossier:       { available, adapter: null }
  }
}
```

Se separan tres categorías que no se mezclan:

1. **Structural snapshot** (arriba): derivado del modelo.
2. **Runtime enhancement availability**, una entrada separada: `{ solar: { availability, reason, localDate, localTime } }`, desde `FloorPlanSolarUI.result`.
3. **Session options**: elecciones del profesional (§22).

### 13.1 Ownership (cerrado)

Responsable: un **core puro de Presentation Templates** (futuro `js/presentation-templates-core.js`, que no se crea ahora). Expone `snapshot(sources, deps)`, `resolve(...)` y `validateCatalog(...)`.

Sus entradas las obtiene un controlador fino en `presentation-ui.js`, el mismo punto donde hoy se construyen `levels` para FT3D-3/4. Los descriptors se reciben ya derivados, sin recalcularlos.

No son dueños del snapshot:
- el renderer;
- View3D;
- componentes DOM;
- el minimapa;
- los handlers de botones.

Motivo: es el único lugar donde ya convergen las fuentes por nivel y el lifecycle del diálogo.

## 14. Lifetime e invalidación

- **Cuándo se calcula:** una vez al abrir «Preparar presentación», junto con los descriptors FT3D-3/4 que ya se derivan allí.
- **Reutilización:** durante esa misma sesión del diálogo, mientras la clave no cambie. Cambiar plantilla u opciones **no** recalcula el snapshot, sólo el resolver.
- **Clave de invalidación:** `entryId` + `[(levelId, projectId, revision)]`. Es la misma revisión que ya usa PresentationPlan (`plan.revision`, `levels[].revision`) y `currentBuilding()`. Es segura porque cambia con cada edición del proyecto y ya gobierna la validez del plan.
- **Invalidación:** si la clave cambia (edición, cambio de nivel o de entrada), se reconstruyen el snapshot y los descriptors, se re-resuelve y se avisa de las diferencias. Nunca se reutilizan descriptors obsoletos.
- Abrir Presentation **no** incrementa la revisión ni escribe en el proyecto.
- No hay caché persistente. Memoización opcional sólo en memoria, durante la sesión del diálogo.

## 15. Template registry

`PRESENTATION_TEMPLATE_REGISTRY` es un registro único:
- datos inmutables (`Object.freeze` profundo);
- validable y extensible;
- sin lógica gráfica.

Forma cerrada de una entrada:

```js
{
  id: 'architecture', version: 1,
  copy: { name: 'presentation.template.architecture.name', purpose: 'presentation.template.architecture.purpose' },
  minimumStory: { allOf: [ { capability: 'plan' }, { oneOf: ['section', 'elevation', 'axon'] } ] },
  entries: [                       // orden semántico base; el resolver lo materializa por nivel (§37)
    { capability: 'plan',      policy: 'required' },
    { capability: 'section',   policy: 'preferred' },
    { capability: 'elevation', policy: 'preferred', options: { facade: 'automatic' } },
    { capability: 'axon',      policy: 'preferred' },   // pending-implementation hasta FT3D-5
    { capability: 'room-tour', policy: 'preferred', options: { roomBudget: 4 } },
    { capability: 'solar',     policy: 'optional' },
    { capability: 'closing',   policy: 'required' }
  ],
  recommendations: { outputs: ['dossier', 'share'] }
}
```

Añadir una sexta plantilla consiste en registrar datos, añadir copy y añadir tests. No hay que editar bloques condicionales.

## 16. Validator del catálogo

`validateCatalog(templates, capabilities, adapters)` es puro y devuelve `{ ok, errors: [{ code, path }] }`. Comprueba:

1. IDs de plantilla únicos y en kebab-case.
2. `version` entero ≥ 1.
3. Cada `capability` referenciada existe en el catálogo de capabilities.
4. `policy` ∈ {`required`, `preferred`, `optional`, `excluded`}.
5. La `policy` es compatible con la familia: `enhancement` y `resource` no pueden ser `required`; `closing` es siempre `required`.
6. `minimumStory` cumple la gramática de la §17 y sólo referencia familias A, B y C.
7. Toda atomic o composite tiene un adapter conocido o `pending-implementation` declarado.
8. Scopes válidos.
9. Ninguna referencia huérfana (`requires`, `compatibleHosts`).
10. Ninguna dependencia circular en `requires`.
11. Ninguna entrada duplicada de la misma capability en `entries`.
12. Las claves de copy existen en ES, EN y ZH.

## 17. minimumStory: modelo formal (cerrado)

Gramática deliberadamente pequeña:

```text
Expr   := { allOf: Expr[] } | { oneOf: Atom[] } | { atLeast: n, of: Atom[] } | Atom
Atom   := { capability: CapId } | CapId
CapId  := id de familia A, B o C
```

Semántica:
- Un `Atom` se cumple si la capability está **resuelta e incluida** en la secuencia efectiva, tras aplicar policies, overrides y la verdad de capabilities, con ≥ 1 target.
- `allOf` exige que se cumplan todos; `oneOf`, al menos uno; `atLeast` exige n ≤ |of|.
- Profundidad máxima: 2. No hay negación, condiciones ni variables.
- Se evalúa sobre el resultado, nunca sobre el catálogo ideal. No reactiva elementos desactivados.

## 18. Policies y política por perfil

| Policy | Default | Control del profesional |
|---|---|---|
| `required` | Incluida si está soportada | Puede desactivarse sólo si minimumStory sigue cumpliéndose; la plantilla pasa a `degraded` (§21.2) |
| `preferred` | Incluida si está soportada | ON/OFF |
| `optional` | Excluida | ON/OFF si está soportada |
| `excluded` | Excluida, fuera del selector básico | No disponible en V1 |

| Capability | real-estate | developer | architecture | renovation | interior-design |
|---|---|---|---|---|---|
| plan (anchor) | P | P | **R** | **R** | P |
| overview (anchor) | implícito | implícito | implícito | implícito | implícito |
| section | O | O | P | P | O |
| elevation | P | **P** | P | O | X |
| room-tour | **R** | P | P | P | **R** |
| axon | X | P | P | X | X |
| exploded-levels | X | P | O | X | X |
| solar (enh.) | X | O | O | X | X |
| closing (struct.) | R | R | R | R | R |
| resources | recomendación | recomendación | recomendación | recomendación | recomendación |

R = required, P = preferred, O = optional, X = excluded.

`overview` no tiene policy propia: es el anchor implícito que materializa `plan` o la parada overview. `axon`/`exploded-levels` permanecen `pending-implementation` hasta FT3D-5; su policy es intención y su binding está pendiente.

| Perfil | minimumStory (cerrado) | Room budget por defecto |
|---|---|---|
| real-estate | `allOf[ oneOf[plan, overview, axon], room-tour ]` | 3 |
| developer | `oneOf[ overview, plan, elevation, axon, exploded-levels ]` (lectura global del edificio; sin rooms obligatorias) | 3 en el nivel representativo + 1 en otro nivel |
| architecture | `allOf[ plan, oneOf[section, elevation, axon] ]` | 4 |
| renovation | `allOf[ plan, oneOf[room-tour, section] ]` | 4 |
| interior-design | `allOf[ oneOf[overview, plan, axon], room-tour ]` | 4 |

Una lectura global de Promotora con un único overview de nivel en un edificio de dos niveles **no** cumple la lectura de edificio. El `overview` de un nivel sólo cubre su nivel. Promotora en dos niveles cumple con:
- `plan` sobre todos los niveles presentados; o
- `elevation` (scope `building`); o
- `axon`/`exploded-levels` cuando existan.

En un nivel, el overview de ese nivel es la lectura global real.

Énfasis por perfil:
- **Inmobiliaria:** room-tour central; elevation preferred.
- **Promotora:** edificio, después niveles, después espacios y contexto. Recomienda los resources `site` y `dossier`.
- **Arquitectura:** organización, sección, envolvente y volumetría. Sin documentación certificada.
- **Reformas:** sin before/after ni comparación demolido/final.
- **Interiorismo:** materials y moodboard como resources recomendados. No se inventan capítulos.

## 19. Estados

### 19.1 Capability

| Estado | Significado | Ejemplo |
|---|---|---|
| `supported` | El proyecto la permite y existe adapter | `section` con un plano que atraviesa |
| `partial` | Se permite con cobertura reducida y declarada | FT3D-4 `partial:true`; section soportada sólo en algún nivel |
| `unsupported` | El proyecto no la permite | `no-crossing`, `no-facade-walls` |
| `pending-implementation` | Rubik todavía no la implementa | `axon`, `exploded-levels` antes de FT3D-5 |
| `temporarily-unavailable` | Hecho runtime ausente ahora | Solar sin norte, ubicación u hora |
| `user-disabled` | Soportada, pero el profesional la desactivó | Section OFF |

No se confunde «el proyecto no lo permite» (`unsupported`) con «aún no está implementado» (`pending-implementation`).

### 19.2 Plantilla

| Estado | Condición |
|---|---|
| `ready` | minimumStory cumplido, required cubiertas y Story ejecutable |
| `degraded` | minimumStory cumplido y ejecutable, pero falta alguna required, hay cobertura `partial` o hay una omisión preferred relevante. Se muestra el aviso «qué se omite y por qué» |
| `unavailable` | minimumStory incumplido, **o** Story no ejecutable (§29.7). Se dice qué falta; no se inicia |

## 20. Warnings normalizados

`{ type, code, severity, capability?, target?, params? }`. El copy se resuelve aparte con `presentation.warning.<code>`. La lógica nunca lee texto.

| `type` | Uso | Severidad típica |
|---|---|---|
| `degradation` | Falta una required o preferred | `warning` |
| `missing-data` | Dato del proyecto ausente (sin norte, sin rooms clasificadas) | `info` |
| `partial` | Cobertura parcial | `info` |
| `pending-implementation` | `axon`/`exploded-levels` antes de FT3D-5 | `info` |
| `runtime-unavailable` | Solar no disponible; fallo runtime de un adapter | `warning` |
| `user-choice` | El profesional desactivó algo | `info` |
| `blocking` | minimumStory incumplido o plan no ejecutable | `error` |

Códigos mínimos:
- `section-unsupported`, `elevation-unsupported`, `elevation-partial`, `facade-stale`;
- `solar-unavailable`, `solar-no-host`;
- `rooms-none`, `rooms-unclassified`, `room-missing`, `rooms-trimmed`;
- `ft3d5-pending`, `required-disabled`, `minimum-unmet`;
- `presentation-plan-unavailable`, `adapter-runtime-failure`, `resource-no-adapter`.

Los códigos de razón de FT3D-3/4 (`no-crossing`, `no-facade-walls`…) se propagan en `params.reason`.

## 21. Overrides

### 21.1 Precedencia (cerrado)

```text
1. verdad del proyecto / capability (snapshot)
2. restricciones de accesibilidad y seguridad (reduced motion, gates existentes)
3. minimumStory de la plantilla
4. overrides del usuario (sesión)
5. defaults de la plantilla
```

- El usuario **no** puede activar nada `unsupported`, `pending-implementation` o `temporarily-unavailable`: el control aparece deshabilitado, con su razón asociada mediante `aria-describedby`.
- El usuario **sí** puede desactivar preferred u optional.
- Movimiento reducido nunca elimina capabilities (§41).

### 21.2 Desactivar una required (decisión V1)

- Si minimumStory **sigue cumpliéndose**: se permite. La plantilla pasa a `degraded`, con el warning `required-disabled`.
- Si lo **rompe**: el cambio se rechaza y el control vuelve a ON, con un aviso que nombra el grupo mínimo afectado. Nunca se inicia una Story inconsistente.
- `closing` no es desactivable.

### 21.3 Capas separadas

```text
template defaults + user overrides + capability truth = resolved options
```

La definición de la plantilla nunca se modifica.

## 22. Session options

```js
{
  templateId,                            // o null = «Sin plantilla»
  toggles: { [capabilityId]: boolean },
  facade: 'automatic' | candidateId,
  rooms: [{ levelId, roomId }] | null,   // null = default de la plantilla
  solar: boolean
}
```

Todo vive en memoria durante la sesión del diálogo y se descarta al cerrarlo.

- **Persistencia:** V1 **no** persiste nada nuevo.
  - No escribe en `FloorPlanProjectV1` ni `BuildingV1`, no hay schema nuevo y no cambia la revisión.
  - Plantilla, fachada, Solar, toggles y orden de rooms no se guardan.
  - FT3D-6 no añade claves de localStorage ni de URL o query.
- **Sidecar de rooms existente** (`rubik-sota-presentation-v1:*`): es el mecanismo **actual** de selección de rooms de Presentation y se conserva exactamente.
  - FT3D-6 no lo amplía.
  - Una selección **por defecto de la plantilla** no se escribe en el sidecar.
  - Sólo la selección explícita que hoy ya se guarda al iniciar sigue guardándose como hoy.
  - El JSON del proyecto queda idéntico antes y después.

## 23. Cambio de plantilla y reset

**Cambio de plantilla** (por ejemplo, Arquitectura → Inmobiliaria). Se recalcula siempre con el resolver y nunca se muta el proyecto.

| Override | Política |
|---|---|
| `facade` | Se conserva si ambas plantillas incluyen `elevation` y la candidata sigue existiendo |
| `rooms` (selección y orden) | Se conserva si ambas incluyen `room-tour` y las rooms siguen siendo válidas |
| `solar` | Se conserva sólo si la nueva plantilla admite `solar`, Solar sigue disponible y la anfitriona sigue incluida |
| Toggle de una capability | Se conserva si la nueva plantilla la incluye con policy ≠ `excluded`; si no, se descarta |
| Overrides descartados | Se enumeran en un aviso `user-choice` |

**Reset.** «Restaurar valores de la plantilla» vacía sólo los overrides de sesión de la plantilla activa. No toca el proyecto, el sidecar, la marca ni la audiencia.

## 24. Resolver

```js
resolveTemplate({ template, capabilitySnapshot, runtime, sessionOptions }) → ResolvedStory
```

```js
ResolvedStory = {
  templateId, templateVersion, status,          // ready | degraded | unavailable
  sequence: [                                   // lineal, ordenada
    { capability, family, adapterId, scope, target, startAnchor, endAnchor, enhancements: ['solar'] }
  ],
  rooms: [{ levelId, roomId }],                 // selección efectiva del composite
  resources: [{ id, available, adapter: null }],
  recommendations: { outputs: [...] },
  minimum: { satisfied, groups: [{ expr, satisfied }] },
  omitted: [{ capability, target, reason }],
  warnings: [...]
}
```

Garantías del resolver:
- puro, determinista y serializable (JSON, sin funciones, DOM, Three ni ciclos);
- no muta ninguna entrada;
- sin DOM, sin Three, sin red, sin storage, sin `Date` ni `random`;
- mismas entradas producen un resultado deepEqual;
- idioma, viewport y movimiento reducido no cambian el resultado.

Pasos:
1. Validar los IDs y las opciones; un ID desconocido produce un rechazo explicable.
2. Calcular las opciones efectivas según §21.
3. Expandir por nivel (§37) y por room (§29).
4. Adjuntar los enhancements a su anfitriona.
5. Deduplicar (§26).
6. Validar las transiciones (§27).
7. Aplicar el presupuesto (§28).
8. Evaluar minimumStory y la ejecutabilidad.
9. Calcular el estado.

La Story se congela al iniciar. No se recalcula durante la reproducción (§46).

## 25. Adapter registry

Está separado del template registry. Cada adapter declara:
- `capabilityId`, `family`, `scope`;
- `startAnchor`, `endAnchor`, `repeatScope`;
- `reducedMotion`;
- `build(resolvedEntry, plan) → scenes[]`: escenas del formato actual `{kind, stop, from?}`;
- `restore`: garantía de restauración heredada del lifecycle begin/end existente.

| Capability | `adapterId` | Escenas generadas (formato actual de `fullStory`) | Reduced |
|---|---|---|---|
| `plan` | `plan-reveal` | `{kind:'plan-reveal', stop:i}` por cada overview de nivel | `start-held` |
| `section` | `section-open` | `{kind:'section-open', stop:i}` en niveles soportados | `holds` (`reducedHold`) |
| `elevation` | `elevation-open` | `{kind:'elevation-open', stop:i}` una vez, en el primer overview que la admite | `holds` (`reducedFront`, `reducedPersp`) |
| `room-tour` | `room-descent` + `stops` | `{kind:'room-descent', stop:j, from:i}` hacia la primera room elegida de cada nivel; el resto de rooms elegidas como paradas del plan | `start-held` |
| `overview` | — (anchor) | — | — |
| `axon`, `exploded-levels` | **PENDIENTE DE RECONCILIACIÓN TRAS FT3D-5** | — | **PENDIENTE DE RECONCILIACIÓN TRAS FT3D-5** |

El adapter genera **exactamente** las escenas que hoy compone `fullStory`. Con la plantilla «Sin plantilla» y las mismas opciones, el resultado es idéntico al de `fullStory` (paridad).

## 26. Deduplicación

- Un `plan` por nivel. Un `overview` es un anchor, nunca un capítulo: no se produce `overview → overview`.
- Un `section` por nivel. Un `elevation` por Story. Un `closing`.
- Clave de deduplicación: `(capability, scope, target)`.
- Un mismo `(levelId, roomId)` aparece una sola vez.
- **No** se eliminan las repeticiones válidas de `room-tour`: rooms distintas son targets distintos.
- `solar` se fusiona en su anfitriona y no se duplica.

## 27. Transiciones

El resolver comprueba `endAnchor(A) === startAnchor(B)`:
- Si coinciden, la continuación es directa. Ejemplo: `plan-reveal → section-open → elevation-open → room-descent`, todos en el `overview(level)`.
- Si no coinciden, sólo se admite la transición que el player **ya** soporta: el **relevo de frontera de escena** de `enterScene`, que termina la narrativa anterior y empieza la siguiente desde su `startAnchor`. Hoy se usa entre niveles, por ejemplo `room(L0) → plan-reveal(L1)`.
- No se inventan cámaras ni movimientos.
- Después de `room-descent` (end = `room`) dentro del mismo nivel no se encadena ninguna escena atómica con `startAnchor = overview`. Por eso `room-tour` cierra el bloque de su nivel.
- Si una plantilla pidiera un orden que lo violara, el resolver reordena dentro del bloque según el orden canónico (§37) y emite `degradation`. Si no fuera posible, omite y avisa.

La Story V1 es **lineal**: sin ramas, bucles ni navegación en grafo.

## 28. Presupuesto narrativo (Story budget)

Duraciones reales de `SCENE_MS`:

| Escena | ms |
|---|---|
| `plan-reveal` | 6000 |
| `room-descent` | 3500 |
| `section-open` | 7000 |
| `elevation-open` | 8000 |

- **Escenas por Story:** como máximo `plan`, `section` y `room-descent` por nivel, más una `elevation`. Con 2 niveles son 7 escenas, unos 41 s animados. Este es el techo V1 actual; FT3D-5 lo amplía (**PENDIENTE DE RECONCILIACIÓN TRAS FT3D-5**: timing de axon y exploded).
- **Rooms:** budget por plantilla (§18), con un máximo absoluto por defecto de 6 rooms en total. Las rooms adicionales al primer descenso de cada nivel son paradas manuales y no alargan la animación.
- **Orden de recorte de contenido repetitivo:**
  1. rooms del mismo `family` por encima de la primera;
  2. rooms `unspecified` por encima del budget;
  3. preferred del mismo scope repetidas por nivel en el segundo nivel, por ejemplo section L1 en Inmobiliaria.
- **Nunca** se recortan required, el minimumStory ni una selección **explícita** del profesional. Si una selección explícita supera el budget, se respeta y se emite `rooms-trimmed` sólo como información.
- La duración total se deriva de la Story resuelta. FT3D-6 no introduce ninguna capa temporal nueva y no modifica `SCENE_MS`.

## 29. Rooms

### 29.1 Mapeo real del composite

`room-tour` resuelve a:
- una lista ordenada `(levelId, roomId)`;
- su materialización: `room-descent` hacia la **primera** room elegida de cada nivel, más el resto de rooms elegidas como **paradas** del PresentationPlan, navegables con los controles actuales («Siguiente →»).

La Story animada no encadena descensos room → room, porque esa transición no existe (§27). Un descenso por room requeriría un anchor `room → overview` que hoy no existe. Queda como gap documentado de composición, **no** dependiente de FT3D-5 y **fuera de V1**.

### 29.2 Selección por defecto determinista

1. Si existe una selección explícita válida (sidecar actual reconciliado mediante `reconcile`), se usa y no se sobrescribe.
2. Si no, se construyen candidatos con `rooms` válidas (polígono ≥ 3 puntos, área > 0) de cada nivel presentado, de abajo arriba.
3. Prioridad por `family` estructurada, según el perfil:

| Perfil | Orden de prioridad de familias |
|---|---|
| real-estate | living, kitchen, bedroom, bathroom |
| developer | living, kitchen, bedroom |
| architecture | living, kitchen, bedroom, office |
| renovation | kitchen, bathroom, living, bedroom |
| interior-design | living, bedroom, dining, office |

4. Diversidad: una room por `family` antes de repetir. `bedroom` y `bathroom` equivalentes no se repiten salvo elección explícita.
5. Desempate: orden canónico de la fuente (`geometry.rooms`), después `roomId`.
6. Se recorta al budget (§28).

### 29.3 Tipo frente a etiqueta

- El tipo es `family`, el enum del schema.
- `name` es sólo la etiqueta visible.
- «Dormitorio principal» no es `principal` ni `bedroom` si `family` no lo dice. Nunca se infiere tipo desde texto libre ni traducciones.

### 29.4 Rooms sin clasificación

Si las rooms tienen `family` ausente, `unspecified` u `other` (por ejemplo «Estancia 1/2/3»):
- se usa el orden canónico y después el área descendente como desempate;
- se selecciona hasta el budget;
- se emite `rooms-unclassified`;
- no se inventan salón, cocina ni dormitorio.

### 29.5 Casos

| Caso | Resultado |
|---|---|
| Una room | Una visita |
| Muchas rooms | Selección por budget y diversidad |
| Room seleccionada eliminada | `reconcile` ya la descarta (`missing`). Se emite `room-missing` y se propone la primera válida restante |
| Multinivel | Identidad compuesta `(levelId, roomId)`; IDs iguales en niveles distintos no colisionan |
| Ninguna room | `room-tour` `unsupported` (`rooms-none`) |

### 29.6 Personalización de rooms

El profesional elige rooms y su orden **dentro de cada nivel**, como hoy. Los niveles mantienen el orden de abajo arriba.

### 29.7 Ejecución sin rooms (decisión cerrada, no FT3D-5)

`FloorPlanPresentation.create` devuelve `null` si no hay rooms válidas o muros no demolidos, y `createBuilding` omite los niveles sin rooms elegidas. Sin PresentationPlan no hay player.

Decisión V1:
- Toda Story requiere un PresentationPlan válido.
- Una plantilla cuyo minimumStory se cumpliría sin rooms, pero sin plan, queda `unavailable`, con el código `presentation-plan-unavailable` (de tipo `blocking`, ejecución). Se distingue explícitamente de `minimum-unmet`, que es invalidez semántica.
- Levantar ese gate es un cambio separado del builder/plan, fuera de FT3D-6 V1, que requiere una decisión propia.
- FT3D-5 sólo podría cambiar esto si su contrato aporta otro anchor ejecutable sin rooms. En ese caso se reconcilia en §50.

## 30. Plan y overview semánticos

- **`plan`:** intención «leer la distribución». Se materializa con `plan-reveal` por nivel: el estado 2D del editor sube hasta el overview de ese nivel. Su `startAnchor` es el plano y su `endAnchor` es `overview(level)`. Con «Sin plantilla» coincide con «Empezar desde el plano» (FT3D-1a). En la Story completa, `fullStory` ya lo incluye en cada nivel.
- **`overview`:** **anchor**, no escena. Es la parada `kind:'overview'` de cada nivel. Se alcanza como `endAnchor` de `plan-reveal` o como parada inicial del plan, y es el anchor compartido de `section`, `elevation` y `room-descent`.
- No hay overview de edificio en esta base. Si una plantilla prefiere `plan` OFF, la Story empieza en `overview(level)`, la parada inicial actual, sin capítulo vacío.
- El resolver comprende los anchors implícitos y no emite `overview → overview`.

## 31. Section (consume FT3D-3)

| Aspecto | Valor real |
|---|---|
| ID semántico / adapter | `section` / `section-open` |
| Disponibilidad | `FloorPlanPresentationSection.derive({project, geometry}, {overviewDirection, axis, levelId})` → `supported`, `reason` (`no-bounds`, `no-crossing`) |
| Scope | `level`, con eje compartido de edificio (`buildingAxis`) en multinivel |
| Anchors | `overview(level)` → `overview(level)` |
| Repetición | 1 por nivel soportado |
| Partial | Soportada en algunos niveles: los demás se omiten con su `reason`, como ya enumera el hint actual («Se omite en …») |
| Opción actual | Checkbox `#presentationSectionOption`, desactivado por defecto y deshabilitado si ningún nivel la soporta |
| Reduced | Hold `SECTION_OPEN.reducedHold` |
| Duración | `SCENE_MS['section-open']=7000` |

FT3D-6 no recalcula el corte, ni el eje, ni los candidatos 50/40/60. No hay sustitutos: nunca se rebajan los muros para simular una sección.

## 32. Elevation (consume FT3D-4)

| Aspecto | Valor real |
|---|---|
| ID semántico / adapter | `elevation` / `elevation-open` |
| Descriptor | `FloorPlanPresentationElevation.derive({levels, northOffsetDeg})` → `{supported, reason, partial, candidates, defaultId, envelope, unoriented, excluded}` |
| Candidatas | `facade-A…`, por sector de 45°, con `label` y `cardinal` sólo si hay norte |
| Default | Automática FT3D-4: mayor longitud, después más huecos, después sector más bajo |
| Petición de la plantilla | `automatic` \| `user-selected` (candidateId) \| `omit`. Nunca «fachada principal» |
| Partial | `partial:true` → warning `elevation-partial` (§40) |
| Unsupported | `invalid-geometry`, `no-facade-walls`, `no-oriented-facade-walls`, `degenerate-facade` |
| Scope | `building` (todos los niveles; `levelView='all'` sólo en runtime) |
| Anchors | `overview(level de inserción)` → `overview(mismo level)` |
| Repetición | 1 por Story, en el primer overview que la admite |
| Solar | Anfitriona única de `solar` |
| Contexto | Oculto en la fase frontal y visible en la perspectiva |
| Reduced | Holds `reducedFront` y `reducedPersp` |
| Duración | `SCENE_MS['elevation-open']=8000` |

Una candidata elegida que desaparece tras una edición produce `facade-stale`, vuelta a `automatic` con aviso y reconfirmación. Nunca se cambia de candidata en silencio.

## 33. Axon y exploded-levels (pendiente FT3D-5)

IDs semánticos cerrados: `axon` y `exploded-levels`. Familia: atomic-scene. Estado hasta FT3D-5: `pending-implementation` (`ft3d5-pending`).

FT3D-6 necesitará recibir de FT3D-5, como mínimo:
- `availability` y `reason`;
- `scope`;
- `variant`;
- repetibilidad;
- `startAnchor` y `endAnchor`;
- soporte reducido;
- soporte multinivel;
- `adapterId`.

Todos esos valores: **PENDIENTE DE RECONCILIACIÓN TRAS FT3D-5** (§50). FT3D-6 no inventa cámara, offsets, separación, transformaciones ni timing.

Fallback honesto: si no está disponible, se omite con su razón. Nunca se usa una órbita arbitraria. Exploded nunca expresa orden constructivo.

## 34. Enhancements: Solar

- Solar es opt-in y está desactivado por defecto incluso donde la plantilla lo admite (`optional`).
- Su única anfitriona es `elevation`.
- La disponibilidad es runtime (`available-orientative`). Si no lo está: `temporarily-unavailable`, `solar-unavailable`.
- Snapshot único al iniciar (comportamiento FT3D-4). No hay recálculo por frame ni capítulo solar.
- Si se pierde Solar, la fachada no se bloquea: sigue con la iluminación normal.

## 35. Resources

| Resource | Autoridad | Adapter Story V1 |
|---|---|---|
| `materials` | Asignaciones reales del proyecto | Ninguno |
| `moodboard` | `FloorPlanMoodboard.derive` (B7) | Ninguno |
| `budget-summary` | `FloorPlanBudgetPresentation.buildReport` (C4, que no se reabre) | Ninguno |
| `dossier` | A4 / dossier económico existentes | Ninguno |
| `site` | Territorio ya cargado (`territoryInfo`) | Ninguno (visible dentro de `elevation`) |

«Resource disponible» y «adapter Story disponible» son estados distintos. En V1 ningún resource se convierte en capítulo. Pueden aparecer:
- en `resources` del resultado;
- en `recommendations.outputs`, gestionado por FT3D-7.

No se duplica `FloorPlanBudgetPresentation`. No se recalculan precios ni IVA.

## 36. Branding y closing

- **Branding** (Mi estudio, `FloorPlanBrand`) es transversal: apertura, captions, closing, vídeo y salidas. Se lee como snapshot existente; no se duplican datos.
- **`closing`** es de familia story-structure:
  - aparece una vez, al final;
  - es el estado final actual del player (`finishStory`) más la identidad existente;
  - sin marca, es un cierre neutral con el nombre del proyecto;
  - no lleva CTA comercial inventado.
- En V1 no se añade un capítulo visual de cierre nuevo. Si en el futuro se quiere, requiere un adapter aprobado.

## 37. Una y dos plantas (niveles como colección)

Bloque por nivel, de abajo arriba:

```text
[plan(L) ] → [section(L)] → [elevation, sólo en el primer bloque que la admite] → [room-tour(L)]
```

Después del último bloque viene `closing`. Esto coincide exactamente con el orden real de `fullStory`.

No se repite automáticamente `plan → section → elevation` por planta: `elevation` aparece una vez.

| Perfil | Una planta | Dos plantas |
|---|---|---|
| real-estate | plan, elevation, rooms | Bloque L0 con elevation y rooms; L1 con plan y rooms. Section preferred OFF por defecto |
| developer | overview/plan del nivel, elevation | plan en todos los niveles (lectura de edificio), elevation y rooms opcionales; axon/exploded pendientes |
| architecture | plan, section, elevation, rooms | Bloque completo en L0; L1 con plan, section y rooms |
| renovation | plan, section, rooms | Igual por nivel, con los espacios elegidos |
| interior-design | overview/plan, rooms | Rooms por nivel |

El soporte de más de dos niveles no se implementa (`MAX_LEVELS=2`), pero nada del contrato fija dos.

## 38. Ámbito objetivo

FT3D-6 resuelve sobre el **plan de presentación actual**:
- un proyecto, que es un edificio de un nivel; o
- un edificio de hasta dos niveles en contexto de edificio.

No existe en el modelo una «unidad inmobiliaria», una vivienda tipo ni una vivienda dentro de un edificio. Promotora **no** las inventa: habla de «edificio» y «niveles», y de «vivienda» sólo en un proyecto de un nivel.

Multi-edificio: no se resuelve ahora. El contrato usa `building` como scope y no presupone «exactamente un edificio para siempre» (frontera future-safe).

## 39. Mobile

- En 390×844 y 844×390, la misma Story, orden, targets, captions y warnings.
- Configuración con `select` para la plantilla y grupos plegables (`details`) para opciones y rooms. Sin timeline horizontal.
- Sin overflow horizontal. Los controles de salida y pausa siempre están accesibles.
- Riesgo conocido heredado: en 844×390 el rótulo puede quedar fuera de la vista de la tarjeta (FT3D-3/4).

## 40. Accesibilidad y copy de estado

- Selector con `label`, nombre y objetivo de una línea; foco predecible.
- Controles deshabilitados con su razón vía `aria-describedby`.
- El resumen «Qué se mostrará» y las omisiones aparecen en texto. Nada depende sólo del color, el minimapa o la animación.
- Por estado de la plantilla:

| Estado | Copy orientativo |
|---|---|
| Ready | Resumen sin alarmas |
| Degraded | «La presentación no incluirá sección porque no puede derivarse de este modelo.» |
| Unavailable | Nombra el grupo mínimo que falta |
| Partial | «La fachada se mostrará sólo con los elementos que pueden derivarse de forma fiable.» |

- `aria-live` por escena y mensaje, no por frame. Mismos controles y atajos que hoy; sin autoplay propio.
- Traducción mediante el sistema actual, ES/EN/ZH. Los datos del usuario se tratan como texto, no como HTML.

## 41. Movimiento reducido

- La Story semántica es idéntica.
- Cada adapter declara su versión reducida:
  - `holds`: section y elevation;
  - `start-held`: plan-reveal y room-descent, cuyo `openStory` espera en el inicio.
- El resolver no define cámaras reducidas y no elimina capabilities por movimiento reducido.
- Un adapter con `reducedMotionSupport:'none'` no puede registrarse: el validator lo rechaza.

## 42. Offline

Invariante: el resolver, la detección de capabilities, la selección de plantilla y la construcción de la Story **no usan red**. Sólo usan datos ya disponibles:
- sin OpenAI;
- sin descargas de contexto;
- sin peticiones territoriales nuevas.

FT3D-6 no puede romper el archivo offline de B1.

## 43. Recomendaciones de salida

El resolver devuelve `recommendations.outputs` separado de `sequence`:

| Plantilla | Recomendaciones |
|---|---|
| real-estate | `video`, `share` |
| developer | `dossier`, `share`, `video` |
| architecture | `dossier`, `share` |
| renovation | `dossier`, `budget-summary` |
| interior-design | `moodboard`, `share` |

Es sólo información para la UI. No implica implementarlas.

## 44. Frontera con FT3D-7

FT3D-6 decide **qué contar**; FT3D-7 decide **cómo entregarlo**.

FT3D-6 no implementa export, upload, share, empaquetado offline ni vídeos nuevos, y no cambia la composición de A4, C4, B1, B3 ni B4.

## 45. Compatibilidad con vídeo y captura

- **B3 (vídeo):** hoy graba las **paradas** del plan (`plan.stops`), no la Story. FT3D-6 no lo rompe.
  - En el futuro, el vídeo consumirá la Story resuelta (`ResolvedStory`) y nunca las reglas de la plantilla. B3 no reinterpreta profesiones.
  - Representar la Story completa en vídeo corresponde a FT3D-7.
- **B4 (share):** puede consumir `ResolvedStory` sin conocer reglas internas.
- **Captura determinista:** los mismos proyecto, plantilla, snapshot y session options producen el mismo orden, las mismas razones y las mismas escenas generadas por los adapters.
- **Autoplay:** FT3D-6 no modifica la política global ni añade autoplay por profesión.

## 46. Fallos: preflight frente a runtime

| Momento | Caso | Política |
|---|---|---|
| Preflight | Capability no disponible | El resolver la omite con su razón; el estado se calcula antes de iniciar |
| Runtime | Optional o preferred falla al empezar (por ejemplo, el descriptor deja de ser válido) | Se salta la escena de forma segura mediante el lifecycle del player, con `adapter-runtime-failure` y restauración de su estado |
| Runtime | Una required falla, pero minimumStory se mantiene con lo que queda | Se continúa y se marca la Story como degradada en el resumen final |
| Runtime | El fallo rompe minimumStory | Se detiene Presentation de forma limpia (`closeStory`) con la razón y restauración completa |

Reglas generales:
- Nunca un crash.
- No se reconstruye la Story completa en mitad de la reproducción; sólo se aplica el fallback controlado.
- No se introducen adapters que dependan de acumulación irreversible. Las garantías de reverse y scrub de cada escena se conservan.
- **Cancelación y restauración:** Escape, Close o Atrás del navegador en cualquier capítulo restauran exactamente como hoy. La plantilla no añade estado persistente. El JSON queda idéntico antes y después.

## 47. QA futura (contractual; no se implementa en esta misión)

### 47.1 `tests/presentation-templates.test.cjs` (unitarias)

1. Cinco IDs de plantilla únicos.
2. Versions.
3. Validator.
4. IDs de capabilities válidos.
5. Sintaxis de minimumStory.
6. `allOf`.
7. `oneOf`.
8. Required frente a minimum.
9. `ready`.
10. `degraded`.
11. `unavailable`.
12. `pending-implementation`.
13. `partial`.
14. `user-disabled`.
15. Precedencia de overrides.
16. Override sobre algo unsupported, rechazado.
17. Cambio de plantilla.
18. Reset.
19. Orden estable.
20. Dedup.
21. Anchors.
22. Transición incompatible.
23. Room sampling.
24. Tipos de room repetidos.
25. Rooms sin clasificar.
26. Una room.
27. Ninguna room (`presentation-plan-unavailable` frente a `minimum-unmet`).
28. Dos niveles.
29. Sin mutación (entradas congeladas).
30. Determinismo deepEqual.
31. Resultado serializable (round-trip JSON).
32. Resources sin adapter.
33. Compatibilidad de Solar con su anfitriona.
34. Sin red (`fetch` y `XMLHttpRequest` anulados lanzan).
35. Registry inmutable.

Adicional: paridad de «Sin plantilla» con `fullStory` para las mismas opciones.

### 47.2 Tests de contrato de adapters

- Mapeo capability ↔ adapter.
- Adapter duplicado.
- Adapter ausente.
- `startAnchor`/`endAnchor` coherentes con `stateAt(0)` y `stateAt(1)` reales.
- Scope.
- Repetibilidad.
- Soporte de movimiento reducido (holds existentes en `*_OPEN`).
- Metadatos de restauración.

### 47.3 `tests/presentation-templates.browser.test.cjs`

1. Selector con 5 plantillas.
2. Descripciones.
3. Inmobiliaria.
4. Promotora.
5. Arquitectura.
6. Reformas.
7. Interiorismo.
8. Ready.
9. Degraded.
10. Unavailable.
11. Partial.
12. Toggle de una optional.
13. Desactivar una required con el mínimo válido.
14. Impedir un minimumStory inválido.
15. Selección de fachada.
16. Selección de rooms.
17. Orden de rooms.
18. Cambio de plantilla repetido.
19. Overrides compatibles conservados.
20. Overrides incompatibles descartados.
21. Restaurar defaults.
22. Movimiento reducido.
23. 390×844.
24. 844×390.
25. Escape.
26. Close.
27. Atrás del navegador.
28. JSON sin cambios.
29. Sin localStorage nuevo (diff de claves antes y después; el sidecar existente se comporta como hoy).
30. Paridad OFF / configuración histórica.
31. Un nivel.
32. Dos niveles.
33. Plantilla sin rooms.
34. Resource sin adapter.
35. Fallback ante fallo runtime de una capability.

Más: un test offline donde el resolver, la selección de plantilla y la construcción de la Story funcionan con la red bloqueada.

### 47.4 Regresiones y comparación con la base

Suites:
- presentation-story, presentation-section, presentation-elevation, futura axon de FT3D-5;
- presentation-overview, presentation-focus, presentation-framing, presentation-minimap, presentation;
- building-presentation, solar, capture-3d, tour-video;
- professional-workspace, project-first, territory-integration;
- unitarias canónicas.

Reglas:
- La comparación con la base es obligatoria.
- Una suite con cancelaciones no se llama «green».
- Un fallo o cancelación que se reproduce igual en la base es deuda previa documentada.
- Si la base pasa y la rama falla, es una regresión de FT3D-6 y bloquea DONE.

### 47.5 Evidencia visual futura

Patrón FT3D-3/4 (Playwright + Chromium + CLI; inspeccionar, corregir y repetir; evidencia sobre el HEAD final):
- vídeo de Inmobiliaria;
- vídeo de Arquitectura;
- vídeo de Promotora multinivel;
- capturas de Reformas e Interiorismo;
- plantilla degraded y plantilla unavailable;
- móvil en vertical y en apaisado.

Debe demostrarse que las plantillas cambian realmente la narrativa.

## 48. Edge cases

| Caso | Resultado esperado |
|---|---|
| Sin rooms | `room-tour` unsupported. Sin plan → `presentation-plan-unavailable` (blocking). Las plantillas que exigen room-tour → `minimum-unmet` |
| Una room | Una visita |
| Muchas rooms | Budget y diversidad; la selección explícita se respeta |
| Tipos de room repetidos | Una por `family` salvo elección explícita |
| Rooms sin clasificar | Orden canónico y área; `rooms-unclassified`; sin inventar tipos |
| Room eliminada | `room-missing`; primera válida restante y reconfirmación |
| Section unsupported | Omitida con `no-bounds`/`no-crossing`; nunca muros rebajados |
| Elevation unsupported | Omitida con su `reason`; las rooms siguen |
| Elevation partial | Warning `elevation-partial`; sin afirmar edificio completo |
| Sin norte | Labels neutrales; sin cardinal inventado |
| Solar no disponible | Enhancement desactivado con razón; la fachada sigue |
| Sin contexto o sin site | Resource `site` no disponible; la fachada sigue sin contexto |
| Sin moodboard | Resource no disponible; nada que omitir en la Story |
| Materials o budget sin adapter | Sólo recurso o recomendación; `resource-no-adapter` |
| Axon o exploded pendientes | `pending-implementation`, warning `info`; las alternativas del minimumStory siguen |
| Un nivel | Un bloque |
| Dos niveles | Bloques de abajo arriba; elevation una vez |
| Más de 2 niveles (futuro) | Frontera: colecciones preparadas; `MAX_LEVELS` actual sin cambios |
| Falta una required con el mínimo cumplido | `degraded` con aviso |
| Mínimo incumplido | `unavailable`, sin iniciar |
| Todas las optional OFF | Required y preferred soportadas; nunca vacío |
| Cambios repetidos de plantilla | Mismo resultado para el mismo estado; overrides según §23 |
| Overrides obsoletos | Descartados con aviso al invalidar el snapshot |
| Override sobre algo unsupported | Rechazado; control deshabilitado |
| Fallo runtime de una capability | §46 |
| Movimiento reducido | Mismos targets; holds |
| Vertical y apaisado corto | §39 |
| Escape, Atrás, Close | Restauración exacta |
| Offline | Sin red |
| Captura | Determinista |
| Vídeo | B3 intacto; Story completa en FT3D-7 |
| Frontera de share | Sin upload por plantilla |
| JSON sin cambios | Proyecto y edificio idénticos |
| Sin localStorage nuevo | Sólo el sidecar existente, con su comportamiento actual |
| Sin red | Invariante del §42 |

## 49. Decisiones cerradas

- **Plantillas e identidad:**
  - cinco IDs (`real-estate`, `developer`, `architecture`, `renovation`, `interior-design`), con version 1;
  - default neutral «Sin plantilla»;
  - correspondencia explícita de audiencia, sólo como indicio pasivo.
- **Modelo de capabilities:**
  - seis familias;
  - capability contract;
  - scopes;
  - anchors de plan, overview, section, elevation, room-tour y closing;
  - repetibilidad (salvo axon y exploded).
- **Reglas de composición:**
  - required frente a minimumStory, con gramática `allOf`/`oneOf`/`atLeast`;
  - minimumStory de los cinco perfiles;
  - estados de capability y de plantilla;
  - modelo de warnings con códigos.
- **Overrides y sesión:**
  - precedencia;
  - desactivar una required;
  - defaults frente a overrides;
  - cambio de plantilla;
  - reset.
- **Arquitectura técnica:**
  - registry, validator, resolver y contrato de adapters con su mapeo real;
  - dedup y transiciones mediante el relevo de escena existente;
  - Story lineal;
  - ownership y lifetime del snapshot, con clave de revisión.
- **Invariantes:**
  - sin persistencia, sin localStorage nuevo, sin red, sin URL;
  - sidecar de rooms preservado.
- **Rooms y presupuesto:**
  - mapeo de room-tour (primer descenso por nivel más paradas);
  - ejecución sin rooms → `presentation-plan-unavailable`;
  - presupuesto narrativo derivado de `SCENE_MS`;
  - selección, diversidad y fallback de rooms.
- **Fronteras de producto:**
  - Solar como enhancement de `elevation`;
  - `site` como resource;
  - resources sin adapter;
  - branding transversal y closing estructural;
  - recomendaciones de salida y frontera con FT3D-7;
  - compatibilidad con vídeo, captura, share y offline.
- **Experiencia:** accesibilidad, móvil, movimiento reducido y política de fallos.
- **Calidad:** arquitectura de QA y evidencia.

## 50. Tabla de pendientes FT3D-5

| # | Punto | Afecta a |
|---|---|---|
| P1 | Contrato exacto de disponibilidad (`availability`, `reason`) de `axon` y `exploded-levels` | Snapshot, minimumStory de developer, architecture, real-estate e interior-design |
| P2 | `adapterId` real | Adapter registry |
| P3 | Scope exacto (`building`, `level`, colección) | Repetición y dedup |
| P4 | Variantes reales (compacta o explotada) | Policy de developer y architecture |
| P5 | `startAnchor`/`endAnchor` reales y transición con `overview(level)` | §27 y posición en el bloque (§37) |
| P6 | Repetibilidad y `maxOccurrences` reales | §12 |
| P7 | Estados de movimiento reducido (holds) | §41 |
| P8 | Aplicabilidad edificio/nivel e interacción con niveles (`levelView`) | §37, §38 |
| P9 | Razones de `partial` y `unsupported` | §20 |
| P10 | Timing real (`SCENE_MS`) | §28 |
| P11 | Si FT3D-5 aporta un overview de edificio o un anchor ejecutable sin rooms | §29.7, §30 |

Todos: **PENDIENTE DE RECONCILIACIÓN TRAS FT3D-5**. Ninguna otra decisión queda pendiente.

## 51. Riesgos

| Riesgo | Nivel | Mitigación |
|---|---|---|
| Room-tour animado limitado al primer descenso por nivel | Medio | Declarado (§29.1). El resto de rooms son paradas; un anchor room → overview sería un cambio separado |
| Plan ligado a rooms: sin rooms no hay Story | Medio | `presentation-plan-unavailable` explícito (§29.7), sin fingir |
| No hay overview de edificio | Medio para Promotora | Mínimo por plan en todos los niveles o elevation; P11 |
| La fachada automática puede leerse casi ciega (regla FT3D-4) | Bajo | Override `user-selected`; no se cambia la regla |
| Audiencia `interior` frente a la plantilla `interior-design` | Bajo | Tabla de correspondencia explícita (§6.2) |
| Diálogo móvil denso | Medio | `select` y grupos plegables; QA 844×390 |
| Divergencia de anchors y timing en FT3D-5 | Medio | Pendientes aislados en §50 |
| Lógica de profesión filtrada al renderer o la UI | Alto si ocurre | Registry y resolver únicos; test de que la lógica no lee labels |

## 52. DONE futuro de FT3D-6 (implementación)

Antes de implementar:
1. FT3D-5 integrado.
2. §50 resuelta.
3. Promoción de este documento a contrato canónico aprobada.

DONE de implementación exige:
- `presentation-templates-core.js` puro, con registry, validator, snapshot y resolver;
- adapter registry;
- UI dentro de «Entregar → Presentación» (Point 9, sin un entry point nuevo);
- paridad con «Sin plantilla»;
- QA del §47 completa: unitarias, contrato de adapters, navegador, offline, regresiones con comparación de base y evidencia visual sobre el HEAD final;
- JSON sin cambios; sin persistencia, localStorage nuevo ni red;
- móvil y movimiento reducido equivalentes;
- salidas existentes intactas;
- revisión humana e integración según `docs/DEVELOPMENT-WORKFLOW.md`.

Un READY de rama no equivale a cerrado.
