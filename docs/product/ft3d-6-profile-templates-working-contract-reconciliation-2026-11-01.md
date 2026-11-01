# FT3D-6 — Reconciliación del working contract tras FT3D-5 + Global Donor Reconciliation

**Fecha:** 01-11-2026.

**Repositorio:** `Juanmaes83/floorplan-3d`.

**Rama de reconciliación:** `docs/ft3d-6-reconciliation-2026-11-01`.

**Base de rama:** `master@d7f59f7e02bde8f8bbef94e353f0361dc40ac2c4`.

**Working contract fuente:** `docs/ft3d-6-working-contract-after-ft3d4@5db3c1b48972128f2769598141cbe2268b792bfa`, archivo `docs/product/ft3d-6-profile-templates-working-contract-2026-11-01.md`.

**FT3D-5 integrado:** código probado en `bf3e5ca5c8df1f6bc2bd61925a0a1456b2d1353d`; integración en `master` mediante `18848fbf3308ef8c2c8841edf626221f74922d23`.

**Global Donor Reconciliation aprobada e integrada:** `d7f59f7e02bde8f8bbef94e353f0361dc40ac2c4`, `docs/product/ft3d-donor-global-reconciliation-2026-11-01.md`.

**Estado:** **RECONCILIATION RECORD — P1–P11 RESUELTOS DOCUMENTALMENTE — READY FOR HUMAN REVIEW.**

Este documento es un **registro normativo de reconciliación** del working contract de FT3D-6. No es implementación, no modifica producto y no autoriza FT3D-6. Su función es cerrar exactamente las dependencias que la §50 del working contract dejó abiertas hasta conocer FT3D-5 real y la reconciliación donor global.

Hasta la aprobación humana de esta reconciliación:

- el working contract `5db3c1b…` sigue siendo la base documental;
- este registro **sustituye únicamente** todas las marcas `PENDIENTE DE RECONCILIACIÓN TRAS FT3D-5`, `pending-implementation` y `ft3d5-pending` relativas a `axon` / `exploded-levels` por las decisiones de este documento;
- no se implementa FT3D-6;
- no se modifica el Atlas;
- no se realiza Sculpture;
- no se seleccionan nuevas capabilities desde el donor;
- tras auditoría humana, estas decisiones deberán plegarse en una revisión del **mismo** working contract antes de promoverlo a contrato canónico. Este archivo no pretende convertirse en un tercer contrato paralelo.

---

## 1. Autoridad y precedencia

Para los puntos P1–P11, la precedencia es:

1. `master@d7f59f7e…` — producto real actual.
2. Contrato FT3D-5 V2 integrado: `docs/product/ft3d-5-axon-exploded-building-contract-2026-11-01.md`.
3. Código integrado FT3D-5:
   - `js/presentation-axon-core.js`;
   - `js/presentation-story-core.js`;
   - `js/presentation-ui.js`;
   - binding View3D en `index.html`.
4. Global Donor Reconciliation `d7f59f7e…`, especialmente carry-forward `GR-FT3D6-P1…P11` y los límites D09/D20.
5. Working contract FT3D-6 `5db3c1b…` para todas las decisiones no afectadas por P1–P11.

Reglas permanentes:

> **Rubik commands. Donor informs.**

> **Semantic support ≠ technical executability ≠ visual acceptance.**

> **Route authority ≠ camera choreography.**

> **Available ≠ active ≠ effectively used.**

> **Automated green ≠ visual acceptance.**

La reconciliación donor no añade automáticamente Board, Unfolded Room, temporal construction, D20 tooling ni D21/REA como capabilities FT3D-6 V1.

---

## 2. Qué cambia y qué no cambia

Se mantienen sin reabrir las decisiones ya cerradas en `5db3c1b…`:

- cinco perfiles V1: `real-estate`, `developer`, `architecture`, `renovation`, `interior-design`;
- default neutral «Sin plantilla»;
- seis familias de capabilities;
- resolver puro y serializable;
- separación verdad semántica / gate ejecutivo;
- `minimumStory` con `allOf` / `oneOf` / `atLeast` y coverages;
- `room-tour` composite híbrido;
- sidecar histórico de rooms intacto;
- sin schema, persistencia, localStorage, URL ni red nuevos;
- `site-data` resource y `site-context` enhancement;
- `solar` enhancement de `elevation`;
- Story/player/renderers existentes como únicas autoridades;
- FT3D-7 como frontera de salidas;
- FT3D-8 como familia temporal futura separada.

Esta reconciliación cambia exclusivamente la situación FT3D-5 de:

```text
pending-implementation / ft3d5-pending
```

a:

```text
capabilities integradas, derivables, ejecutables sólo cuando existe anchor válido del PresentationPlan,
con disponibilidad, variants, scope, adapters, anchors, repetición, reduced motion y timing ya conocidos.
```

---

## 3. Resultado ejecutivo P1–P11

| Punto | Estado | Resolución |
|---|---|---|
| P1 | **RESUELTO** | `axon` y `exploded-levels` se derivan de `FloorPlanPresentationAxon.derive({levels})`; ya no son `pending-implementation`. Se normalizan `supported` / `partial` / `unsupported` desde el descriptor real y sus reasons. |
| P2 | **RESUELTO** | `axon.adapterId = 'axon-open'`; `exploded-levels.adapterId = 'exploded-levels-open'`. Son Story kinds reales en `NARRATIVES`. |
| P3 | **RESUELTO** | Ambas capabilities tienen `scope:'building'` y coverages `['any','building']`. Una ocurrencia representa el building estructural derivado, no un nivel aislado. |
| P4 | **RESUELTO** | Variantes reales: `axon → compact-building`; `exploded-levels → vertical-levels`. En FT3D-6 V1 son dos capabilities semánticas pero comparten un único slot narrativo `building-reading`: se materializa como máximo una de las dos por Story. |
| P5 | **RESUELTO** | Ambas empiezan y terminan en el mismo `overview(level)` real del PresentationPlan usado como anchor de inserción. No existe `overview(building)`. El anchor es el primer overview cuyo `levelId` esté incluido en el descriptor. |
| P6 | **RESUELTO** | Ambas son `repeatable:false`, `maxOccurrences:1`, `repeatScope:'building'`. El slot `building-reading` impide dos escenas FT3D-5 en la misma Story. |
| P7 | **RESUELTO** | Ambas declaran `reducedMotionSupport:'holds'`. `axon-open`: hold compacto `AXON_OPEN.reducedHold=.5`. `exploded-levels-open`: holds `reducedCompact=.22` y `reducedExploded=.645`. |
| P8 | **RESUELTO** | Fuente estructural: todos los niveles de `BuildingUI.presentationSources()`. Runtime puede hacer `levelView active→all`, usar handles frescos y restaurar. `site-context` **no añade** `axon`/`exploded-levels` como hosts FT3D-6 V1: FT3D-5 sólo preserva/oculta el contexto existente; no acredita activación del enhancement. |
| P9 | **RESUELTO** | Reasons FT3D-5: globales `no-levels`, `invalid-level-geometry`, `degenerate-building-envelope`; exploded `single-level`, `insufficient-valid-levels`; partial mediante `descriptor.partial` + `excluded[{levelId,reason}]`. |
| P10 | **RESUELTO** | `SCENE_MS['axon-open']=7000`; `SCENE_MS['exploded-levels-open']=10000`. Son pesos/duración narrativa nominal, no número de frames, duración de captura ni benchmark de ejecución. |
| P11 | **RESUELTO NEGATIVAMENTE** | FT3D-5 **no** crea `overview(building)`, no crea anchor ejecutable sin PresentationPlan y no levanta `presentation-plan-unavailable`. La verdad semántica de `axon` puede satisfacer minimumStory; la ejecución sigue necesitando un PresentationPlan con overview elegible. |

No queda ningún `PENDIENTE DE RECONCILIACIÓN TRAS FT3D-5` legítimo.

---

## 4. P1 — Disponibilidad y reasons exactos

### 4.1 Fuente real

`FloorPlanPresentationAxon.derive({levels})` devuelve el descriptor V2 integrado:

```js
{
  version: 2,
  supported,
  reason,
  partial,
  variants: {
    axon:      { supported, reason, variant: 'compact-building' },
    exploded:  { supported, reason, variant: 'vertical-levels' }
  },
  levels,
  envelope,
  explodedEnvelope,
  excluded
}
```

### 4.2 Normalización FT3D-6

`structural.axon`:

```js
{
  availability,                  // supported | partial | unsupported
  reason,                        // null si supported/partial; reason estable si unsupported
  scope: 'building',
  coverages: ['any', 'building'],
  variant: 'compact-building',
  details: {
    levelIds,
    excluded                     // [{levelId, reason}]
  }
}
```

Regla:

```text
si descriptor.supported === false
    availability = unsupported
    reason = descriptor.reason
si descriptor.supported === true y descriptor.partial === true
    availability = partial
    reason = null
si descriptor.supported === true y descriptor.partial === false
    availability = supported
    reason = null
```

`structural.explodedLevels`:

```js
{
  availability,
  reason,
  scope: 'building',
  coverages: ['any', 'building'],
  variant: 'vertical-levels',
  details: {
    levelIds,
    excluded
  }
}
```

Regla:

```text
si descriptor.supported === false
    availability = unsupported
    reason = descriptor.reason
si descriptor.supported === true y descriptor.variants.exploded.supported === false
    availability = unsupported
    reason = descriptor.variants.exploded.reason
si exploded está soportado y descriptor.partial === true
    availability = partial
    reason = null
si exploded está soportado y descriptor.partial === false
    availability = supported
    reason = null
```

### 4.3 Reasons permitidos

Globales:

- `no-levels`;
- `invalid-level-geometry`;
- `degenerate-building-envelope`.

Específicos de exploded:

- `single-level`;
- `insufficient-valid-levels`.

Partial no inventa un reason global: usa `availability:'partial'`, `reason:null` y conserva `details.excluded[]` con reasons por nivel. El resolver puede emitir un warning FT3D-6 `axon-partial` / `exploded-levels-partial` con `params.excluded`; esos códigos describen la resolución FT3D-6 y no reemplazan los reasons del core.

`ft3d5-pending` deja de ser un estado/código válido para estas dos capabilities.

---

## 5. P2 — Adapter registry real

Tabla reconciliada:

| Capability | family | adapterId | Story kind | Fuente |
|---|---|---|---|---|
| `axon` | `atomic-scene` | `axon-open` | `axon-open` | `FloorPlanPresentationStory.NARRATIVES` |
| `exploded-levels` | `atomic-scene` | `exploded-levels-open` | `exploded-levels-open` | `FloorPlanPresentationStory.NARRATIVES` |

Contrato del adapter FT3D-6:

```text
build(resolvedEntry, plan)
→ exactamente una escena {kind, stop:i}
```

donde `i` es el primer stop `overview` elegible cuyo `levelId` pertenece al descriptor FT3D-5.

Si no existe ese overview:

- la capability puede seguir siendo semánticamente `supported`;
- la materialización falla en el gate ejecutivo;
- se omite con `adapter-anchor-unavailable` + `params.capability`;
- no se inventa cámara ni anchor.

Si no existe PresentationPlan, prevalece `presentation-plan-unavailable`.

---

## 6. P3 — Scope, target y coverages

Ambas capabilities son de building:

```text
scope = building
coverages = any, building
repeatScope = building
```

No se convierten en capabilities `level` porque la escena explica la relación del conjunto estructural derivado, aunque su anchor ejecutable sea un `overview(level)`.

El target normalizado FT3D-6 es una única ocurrencia de building con los `levelIds` incluidos como `details`, no una lista de capítulos por nivel.

Consecuencias:

- en `developer`, `axon` y `exploded-levels` satisfacen directamente `coverage:'building'` cuando están semánticamente resueltos;
- no dependen de la equivalencia de un solo nivel usada por `overview(level)` / `plan(level)`;
- en `real-estate`, `architecture` e `interior-design`, `axon` puede satisfacer un átomo `coverage:'any'` si policy/override lo mantiene incluido;
- una capability soportada semánticamente no implica que exista PresentationPlan para ejecutarla.

La tabla §9.1 del working contract se reconcilia así:

| Capability | Coverages |
|---|---|
| `axon` | `any`, `building` |
| `exploded-levels` | `any`, `building` |

---

## 7. P4 — Variantes y exclusividad narrativa

FT3D-5 define dos capabilities, cada una con una variante única:

| Capability | Variant |
|---|---|
| `axon` | `compact-building` |
| `exploded-levels` | `vertical-levels` |

No se canonizan como FT3D-6 V1 las etiquetas donor Board, Unfolded Room, Floor by Floor u otras variantes de los Cuts. Esos hallazgos permanecen conocimiento documental para decisiones futuras.

### 7.1 Un único slot `building-reading`

El runtime FT3D-5 actual usa un modo exclusivo:

```text
off | compact | exploded
```

`exploded-levels-open` ya contiene una fase compacta antes de la separación y el contrato FT3D-5 prohíbe ejecutar además un `axon-open` separado.

Por tanto FT3D-6 V1 aplica:

```text
max 1 materialización entre axon y exploded-levels por Story
```

No es una nueva family ni capability. Es una regla de composición/deduplicación.

### 7.2 Default por perfil

Se conserva la intención del working contract:

- `developer`: lectura de edificio preferida. Default `automatic`:
  1. `exploded-levels` si está `supported|partial`;
  2. si no, `axon` si está `supported|partial`;
  3. si ninguna, no se materializa building-reading y actúan las demás alternativas del minimumStory.
- `architecture`: `axon` preferred; `exploded-levels` optional. Default `automatic` elige `axon`; el profesional puede elegir despiece si está disponible.
- `real-estate`, `renovation`, `interior-design`: FT3D-5 building-reading permanece excluido por defecto conforme a la policy existente.

La UI FT3D-6 debe presentar **una única elección de lectura del edificio** cuando aplique:

```text
automatic | compact | exploded | off
```

No dos toggles capaces de producir dos escenas contradictorias.

Esta opción es de sesión y no añade persistencia.

---

## 8. P5 — Anchors e inserción

Las dos narratives cumplen:

```text
p=0 → overview exacto
p=1 → overview exacto
```

Contrato FT3D-6:

| Capability | startAnchor | endAnchor |
|---|---|---|
| `axon` | `overview(level de inserción)` | `overview(mismo level)` |
| `exploded-levels` | `overview(level de inserción)` | `overview(mismo level)` |

No existe `overview(building)`.

El nivel de inserción no convierte el scope de la capability en `level`.

### 8.1 Anchor elegible

Se usa el primer `overview` del PresentationPlan cuyo `levelId` esté en `descriptor.levels[].levelId`.

Para proyecto simple, `levelId=null` sigue la semántica actual.

### 8.2 Posición canónica en la Story

El orden real integrado de `fullStory()` es:

```text
plan(L)
→ section(L)
→ elevation (una vez, si corresponde)
→ building-reading (axon O exploded-levels, una vez)
→ room-descent(L)
```

El slot building-reading aparece en el primer bloque con overview elegible.

Esto sustituye la versión anterior de §37 que todavía no podía colocar FT3D-5.

### 8.3 Transiciones

Como ambas empiezan y terminan en `overview(level)`, son compatibles directamente con:

- `section-open`;
- `elevation-open`;
- inicio de `room-descent` del mismo nivel.

No se añade ninguna transición camera/route nueva.

---

## 9. P6 — Repetibilidad y dedup

| Capability | repeatable | maxOccurrences | repeatScope |
|---|---:|---:|---|
| `axon` | false | 1 | `building` |
| `exploded-levels` | false | 1 | `building` |

Regla adicional:

```text
maxOccurrences(building-reading) = 1
```

Si la resolución contiene ambos IDs, la regla de P4 selecciona cuál materializar; el otro no genera una segunda escena.

El resumen puede indicar que la lectura compacta está contenida dentro de `exploded-levels-open`, pero esto no convierte los dos IDs en una sola capability semántica.

---

## 10. P7 — Movimiento reducido

Las dos capabilities siguen presentes con movimiento reducido; no se eliminan.

### Axon

```text
reducedMotionSupport = holds
hold = AXON_OPEN.reducedHold = 0.5
```

### Exploded

```text
reducedMotionSupport = holds
holds = [
  EXPLODED_LEVELS_OPEN.reducedCompact,   // 0.22
  EXPLODED_LEVELS_OPEN.reducedExploded   // 0.645
]
```

El player integrado ya generaliza `holdsOf(kind)` y reconoce `axon-open` / `exploded-levels-open`.

El resolver no cambia la Story semántica por reduced motion. La materialización utiliza los holds discretos existentes.

---

## 11. P8 — Building/levels, `levelView` y `site-context`

### 11.1 Fuente estructural

El descriptor FT3D-5 se deriva de:

```text
BuildingUI.presentationSources().levels
```

para edificio, o de una entrada equivalente para proyecto simple.

No depende de las rooms seleccionadas para decidir qué niveles existen estructuralmente.

`MAX_LEVELS=2` sigue siendo límite de producto actual; el contrato usa colecciones future-safe sin prometer N niveles.

### 11.2 Lifecycle `levelView`

El binding FT3D-5 puede:

```text
capturar pre-state
→ active → all si es necesario
→ sync/rebuild
→ obtener handles frescos
→ reaplicar máscara de visibilidad de base
→ aplicar estado narrativo absoluto
→ restaurar transforms/visibilidad
→ restaurar levelView previo
```

Esto es responsabilidad del adapter/runtime FT3D-5, no del resolver FT3D-6.

FT3D-6 no manipula grupos, transforms ni `levelView`.

### 11.3 `site-context`

P8 se cierra de forma conservadora:

```text
compatibleHosts(site-context) en FT3D-6 V1 = ['elevation']
```

No se añaden `axon` ni `exploded-levels` como hosts FT3D-6 V1.

Motivo:

- FT3D-5 tiene `showContext` dentro de su lifecycle para **preservar u ocultar** contexto que ya estaba visible;
- el binding aplica `pre.context && showContext`, por lo que no activa contexto que no existiera/estuviera visible;
- `exploded-levels` lo oculta durante la separación para no falsear la lectura;
- esto acredita ownership/restauración, no una nueva materialización del enhancement `site-context`.

Por tanto:

> preservar contexto existente ≠ capability `site-context` activada.

La compatibilidad futura necesitaría una decisión explícita posterior, no esta reconciliación.

---

## 12. P9 — Partial, unsupported y warnings

### 12.1 Axon

Unsupported:

- `no-levels`;
- `invalid-level-geometry`;
- `degenerate-building-envelope`.

Partial:

```text
descriptor.supported = true
descriptor.partial = true
```

con `details.excluded[]`.

### 12.2 Exploded

Además de los globales:

- `single-level`;
- `insufficient-valid-levels`.

Si quedan ≥2 niveles válidos pero otros se excluyen, puede ser `partial`.

### 12.3 Warnings FT3D-6

Añadir al catálogo de warnings:

- `axon-unsupported`;
- `axon-partial`;
- `exploded-levels-unsupported`;
- `exploded-levels-partial`;
- `adapter-anchor-unavailable`.

Los reasons del core se propagan siempre en `params.reason`; partial adjunta `params.excluded`.

Eliminar del flujo actual:

- `ft3d5-pending` para axon/exploded;
- warning `pending-implementation` para esas dos capabilities.

`pending-implementation` puede seguir existiendo como estado genérico del framework para futuras capabilities no implementadas, pero no describe FT3D-5.

---

## 13. P10 — Timing y presupuesto narrativo

Fuente real:

```js
SCENE_MS = {
  'plan-reveal': 6000,
  'room-descent': 3500,
  'section-open': 7000,
  'elevation-open': 8000,
  'axon-open': 7000,
  'exploded-levels-open': 10000
}
```

FT3D-6 no modifica esos valores.

### 13.1 Significado

`SCENE_MS` es:

- peso/duración narrativa nominal de full motion;
- entrada para la secuencia del Story.

No es:

- número de frames generados;
- duración de una captura QA;
- tiempo de CPU/GPU;
- benchmark;
- duración de reduced motion.

### 13.2 Story budget reconciliado

Con dos niveles, el techo nominal anterior de ~41 s puede incorporar **una** lectura FT3D-5:

- con compact axon: hasta ~48 s nominales;
- con exploded: hasta ~51 s nominales.

Nunca se suman 7 s + 10 s porque P4/P6 permiten un único slot `building-reading`.

Las rooms adicionales siguen siendo paradas; no añaden `room-descent` más allá de uno por nivel.

Reduced motion usa holds discretos y no redefine `SCENE_MS`.

---

## 14. P11 — `overview(building)` y ejecución sin rooms

Resultado definitivo:

> **FT3D-5 V1 NO aporta `overview(building)`.**

> **FT3D-5 V1 NO aporta un anchor ejecutable sin PresentationPlan.**

> **FT3D-5 V1 NO levanta `presentation-plan-unavailable`.**

Ambas narratives requieren un `overview(level)` real.

### 14.1 Snapshot

Se mantiene:

```js
structural.overview.building = {
  availability: 'unsupported',
  reason: 'overview-building-unavailable'
}
```

### 14.2 MinimumStory vs ejecución

Ejemplo Promotora, dos niveles, sin rooms pero con axon semánticamente soportado:

```text
axon = supported, coverage building
minimumStory developer = satisfied
execution.presentationPlan = unavailable
resultado = unavailable / presentation-plan-unavailable
```

Nunca:

```text
minimum-unmet
```

si el único problema es la falta de PresentationPlan.

La misma separación aplica a Arquitectura si `plan + axon` satisface semánticamente el mínimo pero el player no tiene plan ejecutable.

P11 queda cerrado; no se crea una excepción FT3D-6.

---

## 15. Snapshot reconciliado

La parte FT3D-5 del snapshot sustituye los placeholders históricos:

```js
structural: {
  ...,
  axon: {
    availability,
    reason,
    scope: 'building',
    coverages: ['any', 'building'],
    variant: 'compact-building',
    details: { levelIds, excluded }
  },
  explodedLevels: {
    availability,
    reason,
    scope: 'building',
    coverages: ['any', 'building'],
    variant: 'vertical-levels',
    details: { levelIds, excluded }
  }
}
```

Ambos se derivan del mismo descriptor puro FT3D-5 para evitar duplicar lógica.

No se introducen booleans paralelos `partial`; la normalización del working contract sigue vigente.

`execution.presentationPlan` permanece capa separada.

---

## 16. Registry y session options reconciliados

### 16.1 Policies

Se mantiene la policy histórica por perfil, con una precisión: axon/exploded se materializan mediante el único slot `building-reading`.

| Capability | real-estate | developer | architecture | renovation | interior-design |
|---|---|---|---|---|---|
| `axon` | X | P | P | X | X |
| `exploded-levels` | X | P | O | X | X |

### 16.2 Session options

Añadir al contrato de sesión:

```js
buildingReading: 'automatic' | 'compact' | 'exploded' | 'off'
```

Reglas:

- no persiste;
- no toca el selector FT3D-5 histórico fuera de la sesión FT3D-6;
- `automatic` usa la policy de P4;
- `compact` exige `axon` supported|partial;
- `exploded` exige `exploded-levels` supported|partial;
- `off` desactiva building-reading si minimumStory sigue cumpliéndose; si rompe un minimum requerido, se rechaza según §21.2 del working contract.

No se añaden dos toggles independientes.

---

## 17. Adapter registry reconciliado

Añadir:

| Capability | adapterId | Scope | Anchors | Reduced | Repetición |
|---|---|---|---|---|---|
| `axon` | `axon-open` | building | `overview(level)` → mismo overview | holds `.5` | una vez |
| `exploded-levels` | `exploded-levels-open` | building | `overview(level)` → mismo overview | holds `.22`, `.645` | una vez |

Validator:

- ya no acepta `pending-implementation` como justificación de ausencia de adapter para estos IDs;
- exige que ambos adapters existan;
- valida coverages `any/building`;
- valida `repeatable:false` y `maxOccurrences:1`;
- valida que sólo uno ocupe `building-reading`.

---

## 18. minimumStory reconciliado

Las expresiones existentes se mantienen, pero axon ya puede satisfacerlas.

### Real-estate

```text
allOf[
  oneOf[plan, overview, axon],
  room-tour
]
```

Axon sólo cuenta si la policy efectiva lo incluye. En V1 continúa excluido por default, de modo que no cambia la experiencia histórica salvo decisión futura explícita de policy.

### Developer

```text
oneOf[
  {overview, coverage:'building'},
  {plan, coverage:'all-presented-levels'},
  {elevation, coverage:'building'},
  {axon, coverage:'building'},
  {exploded-levels, coverage:'building'}
]
```

Con 2 niveles, axon/exploded ya son alternativas semánticas reales de building.

### Architecture

```text
allOf[
  plan,
  oneOf[section, elevation, axon]
]
```

Axon ya es alternativa real. Exploded sigue optional y no sustituye el átomo `axon`; cuando exploded está disponible, axon también lo está porque ambos proceden del mismo descriptor y exploded necesita ≥2 niveles válidos.

### Renovation

Sin cambios.

### Interior-design

Sin cambio de policy V1; axon sigue excluido por default.

---

## 19. Orden canónico por nivel

La §37 queda reconciliada a:

```text
[plan(L)]
→ [section(L)]
→ [elevation, una vez]
→ [building-reading, una vez]
→ [room-tour(L)]
```

`elevation` y `building-reading` se insertan en el primer bloque que disponga de su anchor elegible.

Después del último bloque: `closing`.

Ejemplos V1:

### Developer multinivel

Default profesional:

```text
plan por niveles si está incluido
→ elevation si está disponible
→ exploded-levels si ≥2 niveles válidos; si no, axon
→ rooms sólo si policy/selección las incluye
→ closing
```

No se promete que todas estas escenas sean required; el minimum sigue siendo `oneOf`.

### Architecture

```text
plan
→ section
→ elevation
→ axon compact si available/preferred
→ room-tour si available/preferred
→ closing
```

Exploded sólo si el profesional lo elige y sustituye el slot compact.

---

## 20. Donor reconciliation — límites para FT3D-6

La Global Donor Reconciliation aporta vocabulario y evidencia, no nuevas capabilities V1 automáticas.

No se incorporan en esta reconciliación:

- Board como capability V1;
- Unfolded Room como capability V1;
- Floor by Floor donor como sustituto de FT3D-5;
- D14 Card Model como nueva scene FT3D-6;
- D15 sweep como capability de perfil;
- D16–D18 construction timeline — pertenecen a FT3D-8/futuro dominio;
- D20 QA como capítulo — es metodología;
- D21 REA como runtime — es tooling externo.

Se conserva la taxonomía emergente para análisis futuro:

```text
presentation family
→ capability
→ variant
→ narrative state/phase
→ adapter
→ Story
```

Sin alterar las seis familias ya cerradas en FT3D-6 V1.

---

## 21. Tres gates: semántica, ejecución y aceptación visual

La reconciliación global exige no colapsar:

```text
semantically supported
≠ technically executable
≠ visually accepted
```

FT3D-6 V1 mantiene sólo los dos primeros como estado del resolver:

1. `availability` / `minimumStory` — verdad semántica.
2. gate ejecutivo / adapters — puede materializarse con PresentationPlan y Story actuales.

**Visual acceptance no se añade al JSON ni al resolver.** Es un gate QA/humano externo para DONE.

Por tanto una capability puede estar `supported` y ejecutarse, pero su variante no queda aceptada visualmente hasta pasar evidencia y revisión humana.

---

## 22. QA contractual añadida por la reconciliación

Además de la §47 del working contract, FT3D-6 debe probar explícitamente:

### Snapshot / P1–P3

1. Axon supported con un nivel válido.
2. Axon partial con niveles excluidos.
3. Axon unsupported `no-levels`.
4. Axon unsupported `invalid-level-geometry`.
5. Axon unsupported `degenerate-building-envelope`.
6. Exploded unsupported `single-level`.
7. Exploded unsupported `insufficient-valid-levels`.
8. Exploded partial con ≥2 válidos y algún excluido.
9. Ambos exponen scope building y coverages any/building.
10. Ninguno aparece `pending-implementation`.

### Adapter / P2/P5/P6

11. `axon → axon-open`.
12. `exploded-levels → exploded-levels-open`.
13. Primer overview elegible usado como anchor.
14. Sin overview elegible → `adapter-anchor-unavailable`, sin cámara inventada.
15. p0/p1 coinciden con overview.
16. Una única ocurrencia building-reading.
17. Exploded seleccionado no añade axon-open separado.
18. Reverse/seek/replay no acumulan delta.
19. Close/Escape/Back restauran `levelView`, visibilidades, transforms y camera.

### Variantes / P4

20. Developer automatic, 2 niveles válidos → exploded.
21. Developer automatic, 1 nivel → compact.
22. Architecture automatic → compact.
23. Architecture explicit exploded → exploded si supported.
24. Explicit exploded cuando unsupported → override rechazado/disabled con reason.
25. `off` no rompe minimumStory; si lo rompe, se rechaza según regla existing required/minimum.

### Reduced / P7

26. Axon reduced llega al hold `.5`.
27. Exploded reduced recorre holds `.22` y `.645`.
28. Misma Story semántica con y sin reduced motion.

### Level/context / P8

29. Building source usa todos los niveles estructurales, no sólo rooms seleccionadas.
30. `active→all` no cambia el snapshot FT3D-6.
31. Restauración de `levelView` exacta.
32. `site-context` no adquiere axon/exploded como host en FT3D-6 V1.
33. Contexto existente puede preservarse/ocultarse por el lifecycle FT3D-5 sin que el resolver lo marque como enhancement materializado.

### Timing / P10

34. Resolver usa SCENE_MS 7000/10000 sin redefinirlos.
35. Story con exploded no suma además 7000 de axon.
36. QA no presenta frame count o wall-clock como SCENE_MS.

### P11 / separación semántica-ejecución

37. Developer sin rooms + axon supported: minimum true, execution unavailable → `presentation-plan-unavailable`.
38. `overview(building)` sigue unsupported.
39. Ninguna scene FT3D-5 se ejecuta sin overview(level) real.
40. Un nivel conserva equivalencia de coverage para overview/plan sin crear overview(building).

### Evidencia visual

41. Developer multinivel compact/exploded según resolución.
42. Architecture compact.
43. Exploded reverse/recompose/restore.
44. Mobile vertical y landscape short con hold FT3D-5 sin tapar lectura crítica.
45. Reduced motion: compact y exploded discretos.

La evidencia debe registrar capability, variante, phase/hold y viewport. Automated green no sustituye revisión visual.

---

## 23. Edge cases reconciliados

| Caso | Resultado |
|---|---|
| Un nivel válido | `axon=supported`; `exploded-levels=unsupported/single-level` |
| Dos niveles válidos | ambas supported |
| Dos niveles fuente, sólo uno válido | axon `partial`; exploded `unsupported/insufficient-valid-levels` |
| ≥2 válidos + alguno inválido | axon/exploded `partial`, details.excluded |
| Sin niveles | ambos unsupported `no-levels` |
| Geometría inválida en todos | ambos unsupported `invalid-level-geometry` |
| Building envelope degenerado | ambos unsupported `degenerate-building-envelope` |
| Developer automatic con exploded soportado | una scene `exploded-levels-open` |
| Developer automatic con exploded no soportado y axon sí | una scene `axon-open` |
| Architecture automatic | una scene `axon-open` si available |
| Exploded explícito + unsupported | control disabled/rechazado con reason |
| Axon + exploded semánticamente incluidos | una sola materialización building-reading |
| No PresentationPlan | minimum puede cumplirse; ejecución bloqueada `presentation-plan-unavailable` |
| PresentationPlan sin overview elegible | capability semántica conserva estado; materialización omitida `adapter-anchor-unavailable` |
| Dos niveles + sólo overview(L0) | no crea overview(building); developer puede cumplir mínimo mediante axon/exploded/elevation/plan all-levels |
| Contexto exterior visible antes de FT3D-5 | runtime puede preservarlo en axon y ocultarlo al separar; no añade host `site-context` |
| Contexto exterior ausente | FT3D-5 no lo crea |
| Reduced motion | mismas capabilities, holds discretos |
| Exploded | no expresa secuencia constructiva |

---

## 24. Tabla de cierre P1–P11 para sustituir la §50

| # | Resolución final | Evidencia principal | Estado |
|---|---|---|---|
| P1 | Normalización desde descriptor FT3D-5 V2; axon/exploded ya implementados | `presentation-axon-core.js` | CLOSED |
| P2 | `axon-open` / `exploded-levels-open` | `presentation-story-core.js` NARRATIVES | CLOSED |
| P3 | scope building; coverages any/building | contrato FT3D-5 §4 | CLOSED |
| P4 | `compact-building` / `vertical-levels`; un único slot building-reading | descriptor + `axonMode` + fullStory actual | CLOSED |
| P5 | `overview(level)` → mismo overview; primer overview elegible | contrato FT3D-5 §4.3/§5.1 + source p0/p1 | CLOSED |
| P6 | no repetibles; max 1; repeatScope building; max 1 building-reading | contrato FT3D-5 §4 + runtime global insertion | CLOSED |
| P7 | holds `.5`; `.22/.645` | `AXON_OPEN`, `EXPLODED_LEVELS_OPEN`, `holdsOf` | CLOSED |
| P8 | structural levels; runtime active→all/restore; site-context no nuevo host V1 | FT3D-5 lifecycle + `axonGlobals` | CLOSED |
| P9 | reasons globales + single-level/insufficient-valid-levels + partial/excluded | `presentation-axon-core.js` | CLOSED |
| P10 | 7000 / 10000 ms nominales; no confundir con frames/runtime | `SCENE_MS` | CLOSED |
| P11 | no overview(building), no anchor sin plan, no levantar presentation-plan-unavailable | contrato FT3D-5 §4.3 | CLOSED |

**P1–P11 CLOSED: 11/11.**

---

## 25. Qué debe cambiar al plegar esto en el working contract

Tras aprobación humana de este registro, la revisión del mismo archivo `ft3d-6-profile-templates-working-contract-2026-11-01.md` deberá aplicar de forma mecánica:

1. §1 — estado: FT3D-5 integrado; P1–P11 reconciliados; pendiente sólo promoción canónica.
2. §4 — añadir `FloorPlanPresentationAxon` y las nuevas Story kinds a autoridades consumidas.
3. §7 — quitar «futuras» de axon/exploded; conservar family atomic-scene.
4. §9.1 — axon/exploded coverages `any, building`.
5. §10 — anchors overview(level) → mismo overview.
6. §11 — requirements: descriptor soportado + overview ejecutable para materialización; site-context sigue sólo elevation.
7. §12 — no repetibles, max 1, building.
8. §13 — reemplazar placeholders pending por snapshot reconciliado.
9. §15/§16 — registry/validator ya no aceptan pending para FT3D-5.
10. §17 — axon/exploded satisfacen minimumStory semánticamente cuando están resueltos.
11. §18 — mantener policies; añadir regla building-reading y defaults por perfil.
12. §19/§20 — eliminar `ft3d5-pending` de axon/exploded; añadir reasons/warnings reales.
13. §22 — añadir `buildingReading` a session options.
14. §25 — adapters reales.
15. §26 — dedup building-reading.
16. §27 — anchors/transiciones FT3D-5.
17. §28 — timings 7000/10000 y techo nominal ~48/~51 s.
18. §30 — cerrar negativamente overview(building).
19. §33 — sustituir completamente «pendiente FT3D-5» por contrato real.
20. §34 — cerrar P8: site-context no añade hosts FT3D-5 en V1.
21. §37 — insertar building-reading entre elevation y room-tour.
22. §41 — holds axon/exploded.
23. §47/§48 — incorporar tests y edge cases de este registro.
24. §49 — añadir P1–P11 como decisiones cerradas.
25. §50 — sustituir pendientes por la tabla CLOSED 11/11.
26. §51 — eliminar riesgo «divergencia anchors/timing FT3D-5»; sustituir por riesgo de composición building-reading y QA visual.
27. §52 — precondición pasa de «resolver §50» a «working contract reconciliado y promovido canónicamente tras auditoría».

No debe modificarse ninguna decisión cerrada no listada aquí.

---

## 26. Riesgos después de la reconciliación

| Riesgo | Nivel | Mitigación contractual |
|---|---|---|
| Developer puede tener múltiples alternativas building y producir una Story redundante | Medio | slot único `building-reading`; una scene FT3D-5 máximo |
| Exploded puede interpretarse como fases de obra | Alto semántico | copy «despiece por plantas»; nunca construcción/orden temporal |
| Axon/exploded supported pero no ejecutables sin rooms/plan | Medio | separar minimumStory de `presentation-plan-unavailable` |
| Contexto existente confundido con `site-context` | Medio | mantener compatibleHosts V1 sólo `elevation` |
| Partial FT3D-5 ocultado en UI | Medio | availability partial + excluded + warning explícito |
| Mobile hold visualmente tapado | Medio | QA visual por variante/hold; lección FT3D-5 automatización ≠ aceptación |
| Timings usados como benchmark | Bajo | contrato P10: SCENE_MS es narrativa nominal, no rendimiento |
| Nuevas variantes donor canonizadas accidentalmente | Alto arquitectónico | no incorporar Board/Unfolded/etc. sin contrato posterior |

---

## 27. Gate de promoción e implementación

Después de esta reconciliación, las precondiciones documentales quedan:

```text
FT3D-5 integrated                           ✅
Global Donor Reconciliation approved/master ✅
P1–P11 reconciled                          ✅ 11/11
Working contract source preserved          ✅
Human audit of this reconciliation          ⏳
Fold reconciliation into same working doc   ⏳
Promote working contract to canonical        ⏳
Implementation authorization                 ⛔ not granted
```

No implementar FT3D-6 a partir de este registro aislado.

Secuencia obligatoria:

1. auditoría humana de este reconciliation record;
2. plegar las decisiones en el **mismo** working contract;
3. auditar la revisión consolidada;
4. aprobar promoción a contrato canónico;
5. sólo entonces emitir autorización separada de implementación FT3D-6.

---

## 28. Control result

```text
Master baseline: d7f59f7e02bde8f8bbef94e353f0361dc40ac2c4
Working contract source: 5db3c1b48972128f2769598141cbe2268b792bfa
FT3D-5 integrated: YES
Global donor reconciliation integrated: YES
P1–P11 resolved: YES — 11/11
Product modified: NO
Runtime modified: NO
Schemas modified: NO
FT3D-6 implemented: NO
Original Atlas modified: NO
Sculpture performed: NO
Donor capabilities auto-added to V1: NO
Working contract historical body preserved: YES
Canonical promotion performed: NO
Implementation authorized: NO
```

> **FT3D-6 WORKING CONTRACT RECONCILIATION STATUS: READY FOR HUMAN REVIEW**
