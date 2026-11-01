# FT3D-5 — Axonometría y despiece espacial del edificio — contrato de implementación V2

**Fecha:** 01-11-2026.

**Repositorio:** `Juanmaes83/floorplan-3d`.

**Base auditada:** `master@f74c4ee6bca58077a1135d4db2466e4332d0d5e7`.

**Rama documental:** `docs/ft3d-5-axon-exploded-contract`.

**Estado:** **CONTRATO TÉCNICO CONSOLIDADO V2 — listo para implementación pesada únicamente cuando exista un prompt explícito de autorización.**

Este documento consolida el contrato inicial y la auditoría posterior del renderer. Es la **autoridad técnica principal** de FT3D-5. La adenda `ft3d-5-axon-exploded-building-contract-audit-addendum-2026-11-01.md` queda como registro de auditoría y trazabilidad; no debe contradecir este texto. Si aparece una discrepancia, **prevalece este contrato V2**.

El prompt de implementación puede autorizar la ejecución, fijar la rama y el workflow, pero **no puede redefinir arquitectura**. Ante discrepancia: **contrato V2 → adenda de auditoría → prompt de workflow**.

Principios permanentes:

> **FT3D amplía Rubik. No sustituye Rubik.**

> **Todo lo nuevo se suma. Nada de lo existente se elimina sin una decisión expresa.**

> **Más contexto, no más falsa certeza.**

---

## 1. Objetivo

FT3D-5 añade dos lecturas espaciales temporales a la Presentation Story existente:

1. **`axon`** — vista axonométrica compacta del proyecto/edificio, manteniendo offsets y elevaciones reales;
2. **`exploded-levels`** — despiece vertical de plantas, conservando las cotas reales y añadiendo separación **visual** reversible.

Ambas escenas explican **relaciones espaciales**. No representan:

- secuencia constructiva;
- orden de obra;
- estructura inferida;
- forjados inventados;
- fases temporales;
- before/after.

FT3D-8 sigue siendo la familia temporal futura separada.

---

## 2. No objetivos

FT3D-5 V1 no crea:

- Story engine nuevo;
- renderer 3D nuevo;
- cámara ortográfica;
- timeline editor;
- schema nuevo;
- persistencia nueva;
- red nueva;
- IA;
- 360;
- multi-edificio;
- soporte de más de dos niveles como feature de producto;
- exploded horizontal/radial;
- fan-out X/Z;
- cubierta inclinada nueva;
- estructura, pilares, vigas o forjados no existentes;
- capítulos FT3D-6;
- packaging FT3D-7;
- timeline FT3D-8.

No reabre C4 ni deuda baseline previa.

---

## 3. Autoridades existentes

### 3.1 Story

Autoridad: `js/presentation-story-core.js`.

FT3D-5 debe reutilizar:

- `NARRATIVES`;
- `SCENE_MS`;
- `sequence`;
- `stateAt(p)`;
- scrub/reverse/replay;
- reduced holds.

Nuevas kinds:

- `axon-open`;
- `exploded-levels-open`.

No hay segundo player.

### 3.2 Presentation UI

Autoridad: `js/presentation-ui.js`.

Pipeline vigente:

```text
openStory
→ enterScene
→ View3D.presentationStoryBegin(...)
→ View3D.presentationStoryApply(p)
→ View3D.presentationStoryEnd(...)
→ finishStory / closeStory / siguiente escena
```

`presentationStoryBegin/Apply/End` **mantienen el contrato síncrono actual**. FT3D-5 no convierte Begin/End en APIs async.

### 3.3 Building

Autoridades: `FloorPlanBuilding` / `FloorPlanBuildingUI`.

FT3D-5 consume:

- `presentationSources()`;
- `order`;
- `offsetMm.x/y`;
- `elevationMm`;
- `activeLevelId`;
- `levelView` runtime real: **`'active' | 'all'`**.

No usar `current` como valor técnico de `levelView`; puede aparecer sólo como copy humano.

`MAX_LEVELS=2` sigue igual. El core puede usar colecciones future-safe, pero no amplía el producto a N niveles.

### 3.4 Renderer

El renderer vigente contiene:

- nivel activo distribuido entre grupos como `archFloor`, `archUp`, `furnG`, `lampG`;
- niveles secundarios agrupados dentro de `levelsG`;
- grupos globales `roofG`, `exteriorG`, `ground`, `territoryRenderer.group`, `labelG`, `contactG`, `revealG`;
- escaleras/conectores separados;
- assets autorizados como hijos de grupos de mobiliario.

Esta asimetría se respeta; FT3D-5 no reparenta el nivel activo, ni de forma permanente ni temporal.

### 3.5 Cámara

Se mantiene la `PerspectiveCamera` actual.

No se introduce `OrthographicCamera`.

La vista puede llamarse “Vista axonométrica”, pero no “proyección ortográfica exacta”, “axonometría técnica” ni equivalente.

---

## 4. Capabilities

### 4.1 `axon`

- family: `atomic-scene`;
- adapter/story kind: `axon-open`;
- scope: `building`;
- coverages: `any`, `building`;
- repeatable: `false`;
- `maxOccurrences: 1` por Story/building;
- válido con 1 o 2 niveles estructurales válidos.

### 4.2 `exploded-levels`

- family: `atomic-scene`;
- adapter/story kind: `exploded-levels-open`;
- scope: `building`;
- coverages: `any`, `building`;
- repeatable: `false`;
- `maxOccurrences: 1`;
- requiere al menos 2 niveles estructurales válidos.

### 4.3 P11

FT3D-5 V1:

- **NO** crea `overview(building)`;
- **NO** crea anchor ejecutable sin PresentationPlan;
- **NO** levanta `presentation-plan-unavailable`.

Ambas escenas empiezan y terminan en un `overview(level)` real del PresentationPlan.

---

## 5. Fuente de niveles y relación con PresentationPlan

El descriptor FT3D-5 se deriva de **todos los niveles estructurales que entregue `BuildingUI.presentationSources()`**, no sólo de los niveles que hayan sobrevivido a la selección de rooms del PresentationPlan.

Motivo: FT3D-5 explica el edificio, no la selección de habitaciones.

El PresentationPlan aporta:

- el anchor `overview(level)`;
- la posición de inserción narrativa;
- el player existente.

No determina qué niveles existen estructuralmente para axon/exploded.

### 5.1 Anchor de inserción

La escena global se inserta en el **primer overview del PresentationPlan cuyo `levelId` corresponda a un nivel incluido en el descriptor FT3D-5**.

Si no existe ningún overview elegible:

- no materializar FT3D-5;
- reportar razón ejecutiva/omisión;
- no inventar anchor.

---

## 6. Nuevo core puro

Crear:

`js/presentation-axon-core.js`

Browser global:

`FloorPlanPresentationAxon`

CommonJS:

`require('./presentation-axon-core.js')`

API:

```js
FloorPlanPresentationAxon.derive({ levels })
```

Sin:

- DOM;
- Three;
- storage;
- red;
- Date/random;
- side effects;
- mutación del input.

---

## 7. Sistema de coordenadas contractual

No usar `baseMm:{x,y,z}` ni `boundsMm.minY/maxY` con doble significado.

### 7.1 Building/model space — mm

Plano:

```text
offsetMm.x = eje X del edificio
offsetMm.y = eje Y del plano del edificio
```

Vertical:

```text
elevationMm = cota vertical del nivel
```

Bounds por nivel:

```js
{
  minXmm,
  maxXmm,
  minPlanYmm,
  maxPlanYmm,
  bottomMm,
  topMm
}
```

`bottomMm` y `topMm` están en **building vertical space**, incluyendo `elevationMm`.

### 7.2 View3D world space — metros

Three usa:

```text
world X  ← building X
world Z  ← building plan Y
world Y  ← building elevation
```

El core FT3D-5 **no convierte a Three**.

`presentationStoryBegin` convierte una sola vez el descriptor en world-space metros respecto al nivel activo/origen renderer actual. `presentation-story-core.js` recibe corners world-space ya preparados.

No duplicar esta conversión en dos módulos.

---

## 8. Descriptor V2

Semántica normativa:

```js
{
  version: 2,

  supported,      // true si la derivación global/axon es utilizable
  reason,         // null si supported
  partial,        // axon cubre sólo parte de los niveles estructurales

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

  levels: [{
    levelId,
    order,
    sourceIndex,
    offsetMm: { x, y },
    elevationMm,
    boundsMm: {
      minXmm, maxXmm,
      minPlanYmm, maxPlanYmm,
      bottomMm, topMm
    },
    explodedExtraYmm
  }],

  nominalStoreyMm,
  baseVisualGapMm,
  visualClearanceMm,
  envelope,
  explodedEnvelope,
  excluded: [{ levelId, reason }]
}
```

### 8.1 Top-level semantics

- `supported=true` significa que `axon` puede derivarse para al menos un nivel válido;
- `partial=true` significa que existen niveles estructurales presentados que han sido excluidos;
- `variants.exploded.supported=false` en un solo nivel **no** vuelve `supported=false` al descriptor completo.

### 8.2 Valores cuando exploded no está soportado

Si exploded no está disponible:

- `variants.exploded.supported=false`;
- `variants.exploded.reason` estable;
- `explodedEnvelope=null`;
- `baseVisualGapMm=null` si no puede calcularse de forma significativa;
- `visualClearanceMm=null`;
- `explodedExtraYmm=0` en los niveles válidos.

---

## 9. Orden estable y reasons

Niveles válidos se ordenan por:

1. `order` ascendente;
2. `sourceIndex` ascendente;
3. `levelId` lexical como desempate final.

No depender sólo del stable-sort del motor.

Precedencia de reasons:

1. `no-levels`;
2. `invalid-level-geometry` / ningún nivel válido;
3. `degenerate-building-envelope`;
4. variant-specific:
   - `single-level`;
   - `insufficient-valid-levels`;
5. `partial-levels` como warning/descripción cuando proceda.

Reasons mínimos:

- `no-levels`;
- `invalid-level-geometry`;
- `degenerate-building-envelope`;
- `single-level`;
- `insufficient-valid-levels`.

---

## 10. Validez geométrica

Un nivel es válido si puede demostrar un envelope espacial real desde el modelo:

- envelope finito y no degenerado;
- ≥1 muro no demolido válido;
- altura demostrable desde muros/defaults existentes.

Furniture no determina el envelope arquitectónico.

No inferir estructura.

---

## 11. Base transform y Presentation delta

Building es autoridad de transform real:

```text
base X = offsetMm.x
base plan Y = offsetMm.y
base vertical = elevationMm
```

En View3D:

```text
baseRelativeWorldY(level) = (level.elevationMm - activeLevel.elevationMm) / 1000
```

FT3D-5 sólo añade un delta temporal vertical.

```text
presentationDeltaX = 0
presentationDeltaZ = 0
presentationDeltaY = explodedExtraYmm
```

Aplicación obligatoriamente absoluta:

```text
currentY = savedBaseY + stateDeltaY
```

Prohibido acumular:

```text
currentY += deltaPerFrame
```

---

## 12. Gap visual y prevención de solapes

La fórmula nominal se conserva, pero ya no se permite que niveles altos/atípicos queden solapados.

### 12.1 Gap nominal

1. diferencias positivas de `elevationMm` entre niveles válidos consecutivos;
2. `nominalStoreyMm` = mediana;
3. si no existe diferencia válida: mayor altura de muro demostrable;
4. fallback: `2800`;
5. `baseVisualGapMm = clamp(round(nominalStoreyMm * 0.45), 800, 1600)`.

### 12.2 Clearance visual

```text
visualClearanceMm = clamp(round(baseVisualGapMm * 0.25), 200, 400)
```

Es una regla de legibilidad, no una cota real.

### 12.3 Extra Y por nivel

Niveles válidos ya ordenados.

```text
extra[0] = 0

for i > 0:
  nominalExtra = i * baseVisualGapMm
  overlapSafeExtra =
    (prev.topMm + extra[i-1] + visualClearanceMm) - current.bottomMm

  extra[i] = max(nominalExtra, overlapSafeExtra, 0)
```

Así:

- se conservan elevaciones reales;
- el gap nominal sigue siendo estable;
- si los bounds verticales se solapan, se añade sólo el extra necesario para que exista separación visible;
- no se presenta ese extra como medida de proyecto.

La cámara se adapta al `explodedEnvelope`; no se reduce dinámicamente la separación para hacerla caber.

---

## 13. Ownership matrix obligatoria

La implementación debe documentar y probar la tabla real de ownership antes de escribir deltas.

| Objeto/grupo | Clase | Axon | Exploded | Regla |
|---|---|---|---|---|
| grupo de nivel secundario en `levelsG` | level-owned | se mantiene | se desplaza con su nivel | handle por grupo existente |
| `archFloor` | active-level-owned | base | desplaza | handle activo |
| `archUp` | active-level-owned | base | desplaza | handle activo |
| `furnG` | active-level-owned | base | desplaza | assets hijos heredan transform |
| `lampG` | active-level-owned | base | desplaza | misma delta |
| losa real del nivel activo aunque viva en `levelsG` | active-level-owned | base | desplaza | debe identificarse por ownership/tag real |
| `contactG` | presentation-temporal | ocultar durante FT3D-5 | ocultar | guardar/restaurar visibilidad |
| `revealG` / room outline / route aids | presentation-temporal | limpiar por lifecycle existente o guardar/restaurar | igual | nunca desplazar ciegamente |
| escaleras/conectores | connector-global | conservar en compact | ocultar en fase separada | no deformar |
| `ground` | global/context | conservar política actual | ocultar en fase separada si visible | restauración exacta |
| `territoryRenderer.group` | global/context | política actual | ocultar en fase separada | no explotar |
| `roofG` | global-derived | política actual | ocultar durante separación si estaba visible | nunca mover con nivel |
| `exteriorG` | global-derived | política actual | ocultar durante separación si estaba visible | nunca mover con nivel |
| `labelG` | UI/label | lifecycle actual | lifecycle actual | no labels nuevos |
| minimapa | UI 2D | sin marcas nuevas | sin gap/flechas | geometría real solamente |

No se autoriza **ningún reparenting del nivel activo**, ni temporal ni persistente.

Si aparece otro grupo relevante durante implementación, debe clasificarse explícitamente antes de tocarlo.

---

## 14. Assets autorizados

Assets GLB/autorizados ya cargados son hijos del mobiliario y acompañan al grupo padre.

FT3D-5:

- no espera descargas;
- no inicia `refreshAssets`;
- no llama `buildFurn` por la escena;
- no dispara red;
- no aplica delta individual al asset;
- no muta `assetRef`, dimensiones, local position ni rotación.

Una carga que termine durante la escena hereda el transform del padre actual.

---

## 15. `levelView active → all` sin romper p0/p1

Este lifecycle es normativo.

### 15.1 Captura de pre-state

Antes de tocar `levelView`:

capturar semánticamente:

- `baseLevelView` (`active` o `all`);
- `baseVisibleLevelIds` reales del renderer;
- visibilidad de stairs;
- context/territory/ground;
- roof/exterior;
- contact/reveal temporales relevantes;
- camera/orbit/FOV/near/far/maxDistance.

No guardar referencias Three de niveles que puedan ser destruidas por el rebuild.

### 15.2 Preparación

Orden obligatorio:

```text
1. capture semantic pre-state
2. si baseLevelView !== 'all', set levelView = 'all'
3. sync/rebuild existente
4. resolver handles Three FRESCOS después del rebuild
5. guardar base transforms de esos handles
6. reaplicar una máscara de visibilidad equivalente a baseVisibleLevelIds
7. aplicar stateAt(0)
```

No existe un momento visible donde Begin deje al usuario en un estado distinto del overview original antes de aplicar la narrativa.

### 15.3 Visibilidad dentro de la escena

El state puro incluye control explícito de niveles adicionales.

- `p=0`: visibilidad exactamente equivalente al overview original;
- durante entrada a axon: los niveles estructurales requeridos pasan a ser visibles como parte de la narrativa;
- hold compact/exploded: niveles incluidos visibles;
- retorno: niveles extra vuelven a ocultarse según `baseVisibleLevelIds`;
- `p=1`: visibilidad exactamente equivalente al overview original, **antes de End**.

No hace falta crear opacity/fade de materiales; la política mínima es determinista y reversible. Si se usa una transición visual adicional, no puede mutar materiales compartidos ni romper p0/p1.

### 15.4 End

Orden:

```text
1. restaurar transforms/visibilidades sobre la jerarquía vigente
2. limpiar handles
3. restaurar levelView previo
4. permitir sync/rebuild de restauración si procede
5. NO reutilizar handles antiguos después del rebuild
6. restaurar camera/orbit/globales restantes mediante lifecycle existente
```

`presentationStoryEnd()` debe ser idempotente.

---

## 16. Begin transaccional

Si `presentationStoryBegin()` falla después de haber tocado cualquier estado:

- debe ejecutar rollback completo;
- `levelView` vuelve al original;
- visibilidades y camera vuelven al original;
- no queda handle activo;
- el error se propaga después del cleanup.

QA debe simular un fallo después del `active → all` y antes de completar la preparación.

---

## 17. Contrato de `stateAt(p)`

Las nuevas narrativas devuelven estado serializable equivalente a:

```js
{
  phase,
  position: [x,y,z],
  target: [x,y,z],
  fov,
  near,
  far,
  maxDistance,
  levelDeltas: [{ levelId, dyM }],
  visibleLevelIds: [levelId],
  showStairs,
  showGround,
  showContext,
  showRoofExterior
}
```

No objetos Three.

No closures mutables.

No referencias DOM.

La implementación puede separar campos si preserva esta semántica.

---

## 18. Cámara y framing

### 18.1 Dirección

Coherente con `isoWhole()` actual:

- proyecto simple: dirección proporcional a `(5.5, 15.5, 10)`;
- edificio: dirección proporcional a `(9, 8.5, 12.5)`.

No depende de:

- northOffset;
- room names;
- idioma;
- fachada elegida;
- pose arbitraria anterior.

### 18.2 Framing

Input world-space:

- compact → 8 corners de `envelope`;
- exploded → 8 corners de `explodedEnvelope`.

Debe respetar `view.region`.

Fit puro, equivalente al patrón FT3D-4:

- ejes right/up;
- corners;
- distancia mínima;
- margen estable.

No `Box3.setFromObject` por frame.

### 18.3 Near/far/maxDistance

El fit debe derivar también valores temporales suficientes para no clippear el box completo.

Reglas:

- `near > 0` estable y seguro;
- `far` debe contener todos los corners con margen;
- `orbit.maxDistance` debe permitir la pose calculada;
- valores originales se guardan/restauran exactamente;
- `p=0` y `p=1` recuperan los valores de overview.

### 18.4 Resize

Resize **no** recalcula geometría ni descriptor.

Puede recrear únicamente la narrativa pura usando:

- mismo descriptor;
- mismo start/end overview;
- nuevo `aspect`;
- nuevo `view.region`;
- mismo progreso local `p`.

Después aplica el nuevo `stateAt(p)`.

No rebuild de edificio por resize salvo el que ya corresponda al viewport general existente.

---

## 19. `axon-open`

Duración:

```text
SCENE_MS['axon-open'] = 7000
```

Fases:

```text
p=0.00       overview exacto
0.00–0.28    entrada a lectura axonométrica + revelado de niveles necesarios
0.28–0.72    hold axon compacto
0.72–1.00    retorno + restauración de visibilidad base
p=1.00       overview exacto
```

Deltas de nivel = 0.

La escena sólo cambia lectura/cámara/visibilidad temporal de niveles necesarios.

---

## 20. `exploded-levels-open`

Duración:

```text
SCENE_MS['exploded-levels-open'] = 10000
```

No se ejecuta además un `axon-open` separado.

Fases:

```text
p=0.00       overview exacto; deltas 0; visibilidad base
0.00–0.22    entrada a axon compacto; niveles necesarios visibles
0.22–0.55    separación vertical absoluta
0.55–0.74    hold exploded
0.74–0.90    recomposición
0.90–1.00    retorno y restauración de visibilidad base
p=1.00       overview exacto; deltas 0; visibilidad base
```

Durante fase separada:

- stairs ocultas;
- contact shadows ocultos;
- ground/context ocultos cuando puedan falsear la lectura;
- roof/exterior globales ocultos si estaban visibles;
- todo restaurado al recomponer.

---

## 21. Reduced motion

FT3D-5 no elimina capabilities.

### Axon

Hold discreto de axon compacto.

### Exploded

Holds discretos:

1. compact axon;
2. exploded completo.

No animar cientos de frames si `prefers-reduced-motion: reduce`.

El player actual debe generalizar `holdsOf(kind)` para reconocer las dos nuevas scenes.

No mantener helpers con nombres semánticamente falsos tipo `hasSection` si ya representan múltiples familias; renombrar mínimamente a algo equivalente a `hasHeldScene` si procede.

---

## 22. Auditoría obligatoria de dispatches existentes

Antes de escribir implementación, buscar y clasificar **todas** las referencias relevantes a:

```text
plan-reveal
room-descent
section-open
elevation-open
SCENE_MS
NARRATIVES
holdsOf
hasSection
finishStory
openStory
enterScene
sceneEnd
sceneHome
fullStory
storyControls
drawStory
disposeStory
presentationStoryBegin
presentationStoryApply
presentationStoryEnd
```

Para cada dispatch/lista/switch:

- añadir `axon-open` / `exploded-levels-open` si corresponde;
- dejarlo igual si no corresponde;
- documentarlo en handoff.

Puntos contractuales mínimos:

1. Story controls deben existir si FT3D-5 es la única feature narrativa elegida;
2. `openStory()` debe validar disponibilidad FT3D-5;
3. `enterScene()` debe pasar payload FT3D-5, no recalcular `derive()` en renderer;
4. `finishStory(0)` debe entregar correctamente el overview en scenes standalone FT3D-5;
5. `holdsOf()` debe reconocer reduced holds FT3D-5;
6. `drawStory()` debe tener captions/ARIA de axon/exploded;
7. `disposeStory()` debe limpiar todo runtime FT3D-5;
8. `fullStory()` inserta una sola escena FT3D-5 global;
9. no duplicar axon + exploded cuando el modo sea exploded.

---

## 23. Payload renderer

`enterScene()` pasa información derivada equivalente a:

```js
{
  axon: {
    descriptor,
    variant: 'compact-building' | 'vertical-levels',
    activeLevelId
  }
}
```

El renderer no vuelve a ejecutar `FloorPlanPresentationAxon.derive()`.

---

## 24. Orden Story y anchors

Ambas scenes:

```text
startAnchor = overview(level de inserción)
endAnchor   = same overview(level)
```

Orden del primer bloque elegible:

```text
plan-reveal
→ section-open          si procede
→ elevation-open        si procede
→ axon-open OR exploded-levels-open
→ room-descent          si procede
```

No repetir FT3D-5 por nivel.

OFF mantiene el orden histórico exacto.

---

## 25. UI V1

Dentro de **ENTREGAR → Presentación**.

Estado runtime:

```js
axonMode = 'off' | 'compact' | 'exploded'
```

Default: `off`.

Copy ES recomendado:

- `Lectura del edificio`;
- `Sin axonometría`;
- `Vista axonométrica`;
- `Despiece por plantas`;
- `Despiece espacial · separación visual`.

Todas las strings visibles y ARIA nuevas deben existir en **ES/EN/ZH** mediante el sistema actual `tx`.

Reason codes permanecen language-independent.

### 25.1 Un nivel

- compact disponible;
- exploded disabled con copy honesto: necesita al menos dos niveles.

### 25.2 Partial

Si axon es partial:

- mostrar warning visible;
- decir qué niveles se omiten;
- no afirmar “edificio completo”.

### 25.3 Acción standalone

Cuando `axonMode !== 'off'`, añadir una única acción contextual en Story tools:

- `Ver axonometría` para compact;
- `Ver despiece` para exploded.

Debe ejecutar la misma scene/adapter del full Story, no otra implementación.

### 25.4 Lifecycle del diálogo

Abrir/cerrar el diálogo repetidamente no puede duplicar controles, listeners ni estado.

`disposeStory()`/reset de configuración limpian:

- mode runtime;
- descriptor de sesión;
- botón standalone;
- handles/snapshots temporales.

No se persiste nada.

---

## 26. Preservación de toggles

FT3D-5 no puede encender elementos que el usuario tenía apagados.

QA explícita para:

- furniture OFF;
- roof/exterior OFF;
- context/territory OFF;
- labels según lifecycle actual;
- contact shadows previos.

Al acabar, todos recuperan su estado anterior exacto.

---

## 27. Restauración y reuse del lifecycle existente

Preferir extender:

- `presentationViewState()`;
- `presentationRestoreView()`;
- `presentationRestore()`;
- `endPresentationStory()`;

cuando encajen.

No crear una segunda infraestructura paralela de restauración.

`endPresentationStory()` sigue siendo la autoridad de cleanup de scene.

---

## 28. Residue inspector

Añadir getter read-only equivalente a:

```js
View3D.presentationAxonResidue
```

Debe exponer al menos:

```js
{
  active,
  levelDeltas: [{ levelId, deltaY }],
  levelViewRestored,
  visibleLevelsRestored,
  stairsRestored,
  groundRestored,
  contextRestored,
  roofExteriorRestored,
  contactRestored,
  handles: 0
}
```

Sin referencias Three mutables.

Después de End/cancel/error: estado limpio.

---

## 29. Performance y rebuild accounting

Permitido:

- un rebuild de entrada si `active → all`;
- un rebuild de salida si `all → active` al restaurar.

Prohibido por frame:

- `sync()`;
- `buildLevels()`;
- `Core.geometry()`;
- `FloorPlanExterior.derive()`;
- `Box3.setFromObject()` sobre edificio completo;
- build furniture/assets;
- búsquedas DOM repetidas;
- red.

Añadir/instrumentar QA para demostrar que múltiples `presentationStoryApply(p)` no incrementan el contador de rebuilds.

Puede ser un contador debug interno/read-only si ayuda; no API de producto.

---

## 30. Memory/leak QA

Después de ≥5 ciclos:

- no crecimiento lineal de children/grupos temporales;
- no handles acumulados;
- no listeners duplicados;
- `renderer.info.memory` no muestra crecimiento atribuible continuo a FT3D-5.

No exigir igualdad byte-perfect si Three mantiene caches, pero cualquier crecimiento lineal por scene bloquea DONE.

---

## 31. Offline, scripts y dependencias

FT3D-5 no añade red.

No modificar:

- `package.json`;
- lockfiles;
- versiones Playwright;
- dependencias;

salvo imposibilidad técnica demostrada y documentada antes de hacerlo.

No ejecutar `playwright install` ni descargar otro navegador si el repo/entorno ya dispone de Chromium.

El nuevo `presentation-axon-core.js` debe cargarse en el orden correcto **antes** de `presentation-ui.js`.

Ejecutar también la validación offline/B1 pertinente para asegurar que el nuevo script entra en cualquier archivo/manifest estático que lo necesite.

---

## 32. Story captions y accesibilidad

`drawStory()` debe tener ramas específicas para:

### axon-open

Fases orientativas:

- Vista general 3D;
- Abrimos una lectura axonométrica del edificio;
- Vista axonométrica;
- Volvemos a la vista general.

### exploded-levels-open

- Vista general 3D;
- Vista axonométrica;
- Separamos las plantas para leer su relación espacial;
- Despiece espacial · separación visual;
- Recomponemos el edificio;
- Volvemos a la vista general.

No copy de construcción.

Controles:

- label accesible;
- disabled reason;
- teclado;
- focus correcto;
- slider aria-valuetext;
- reduced motion compatible.

---

## 33. Minimap y labels

No añadir:

- gap al minimapa;
- flechas exploded;
- niveles separados en 2D;
- etiquetas 3D con distancias visuales.

El minimapa sigue mostrando geometría real.

Labels actuales siguen lifecycle existente.

---

## 34. Project/building invariants

Antes/después:

```text
project JSON deepEqual
building JSON deepEqual
revision unchanged
```

No schema.

No migration.

No storage.

No URL/query.

No sidecar nuevo.

---

## 35. Unit QA obligatoria

Crear `tests/presentation-axon.test.cjs`.

Cubrir comportamientos, no inflar el número de asserts.

Matriz mínima:

1. 1 nivel axon supported;
2. 1 nivel exploded → `single-level`;
3. 2 niveles axon/exploded;
4. descriptor top-level semantics;
5. `explodedEnvelope=null` cuando no soportado;
6. coordenadas model-space sin ambigüedad;
7. offsets X/planY;
8. elevation real;
9. bounds bottom/top;
10. sort order/sourceIndex/levelId;
11. reasons precedence;
12. partial axon;
13. all structural levels from sources;
14. invalid level excluded;
15. gap nominal;
16. visual clearance;
17. no-overlap extraY;
18. niveles muy altos/atípicos quedan separados;
19. envelope compact;
20. envelope exploded;
21. serializable;
22. no mutation;
23. deterministic deepEqual;
24. `axon-open` p0/p1 overview;
25. `exploded` p0/p1 overview + deltas 0;
26. exploded hold full deltas;
27. stateAt reverse/history-independent;
28. world-space fit corners;
29. far/maxDistance suficiente;
30. 7000/10000;
31. reduced holds;
32. independent of north/labels;
33. N-level conceptual accumulation sin habilitar producto >2.

---

## 36. Browser QA obligatoria — Playwright + Chromium

Crear `tests/presentation-axon.browser.test.cjs`.

La corrida final crítica usa:

- Chromium existente del entorno;
- `retries=0`;
- sin subir timeouts globales;
- sin descargar browsers;
- reportar versión/executable si está disponible.

Casos mínimos:

1. control visible, default OFF;
2. OFF parity;
3. script/core cargado antes de UI;
4. 1 nivel compact;
5. 1 nivel exploded disabled;
6. partial warning visible;
7. 2 niveles compact/exploded;
8. active lower;
9. active upper;
10. offset X/Z;
11. elevación no estándar;
12. footprints distintos;
13. alturas atípicas sin overlap exploded;
14. furniture visible acompaña nivel;
15. furniture OFF permanece OFF;
16. lamps acompañan;
17. losa activa acompaña;
18. asset parent acompaña si fixture disponible;
19. stairs compact;
20. stairs hidden exploded;
21. ground/context/roof/exterior restaurados;
22. contact shadows restaurados;
23. `active → all → active`;
24. `all → all`;
25. p0 pre-End visual parity;
26. p1 pre-End visual parity;
27. section + FT3D-5;
28. elevation + FT3D-5;
29. section + elevation + exploded;
30. no duplicate scene;
31. standalone button compact/exploded;
32. full Story order;
33. reduced axon;
34. reduced exploded two holds;
35. finishStory(0) standalone;
36. reverse;
37. scrub;
38. cancel p25/p40/p60/p80;
39. Escape/Close/Back;
40. Begin failure after `active→all` rolls back;
41. five cycles no drift;
42. no linear memory/group growth;
43. no rebuild per apply;
44. resize recreates pure narrative and preserves p;
45. capture axon/exploded;
46. project/building/revision unchanged;
47. no storage key;
48. repeated config open/close no duplicates;
49. ES/EN/ZH strings present;
50. 390×844;
51. 844×390;
52. no horizontal overflow;
53. Exit/Pause operable;
54. residue inspector clean;
55. offline/B1 smoke.

Cantidad de asserts no es criterio de calidad; la matriz de comportamientos sí.

---

## 37. Pre-baseline y regresiones

Antes de modificar producto, registrar una corrida baseline mínima del commit exacto `f74c4ee6...` para suites sensibles:

- presentation-story;
- building-presentation;
- presentation-framing;
- presentation-minimap;
- presentation.

Después ejecutar regresiones completas pertinentes:

- unitarias canónicas;
- presentation-story;
- presentation-section;
- presentation-elevation;
- presentation-overview;
- presentation-focus;
- presentation-framing;
- presentation-minimap;
- presentation;
- building-presentation;
- solar;
- capture-3d;
- tour-video;
- professional-workspace;
- project-first;
- territory-integration;
- offline/B1 correspondiente.

No aumentar timeouts/retries globales para obtener green.

Clasificación:

```text
branch FAIL + base PASS = regresión FT3D-5
branch FAIL + base mismo FAIL = deuda baseline
cancelled != pass
```

Deuda conocida no se arregla dentro del corte salvo empeoramiento demostrado.

---

## 38. Visual QA reproducible

Toda evidencia se genera por CLI con Playwright + Chromium real.

No screenshots manuales.

### 38.1 Screenshots

Mínimo:

- one-level p0, axon hold, p1;
- two-level compact;
- exploded separation midpoint;
- exploded hold;
- recomposition;
- active upper;
- offsets X/Z;
- footprints distintos;
- alturas atípicas;
- reduced compact/exploded;
- 390×844;
- 844×390.

Generar contact sheet si la metodología existente lo permite.

### 38.2 Vídeos

Chromium real:

- axon forward;
- axon reverse real;
- exploded forward;
- exploded reverse real;
- exploded móvil.

Reverse debe ejecutar la Story en sentido inverso, no invertir el archivo con ffmpeg.

### 38.3 Evidence manifest

Generar localmente un manifest TXT/JSON no necesariamente tracked con:

```text
headSha
Chromium version/executable
scenario
viewport
progress/state
output path
```

Si HEAD cambia después de generar evidencia crítica, regenerarla.

### 38.4 Inspección humana

Abrir y revisar capturas/vídeos:

- clipping;
- floating furniture/lights/slabs;
- stairs;
- context;
- roof;
- p0/p1;
- jumps;
- reverse;
- mobile;
- copy.

---

## 39. Artefactos y ffmpeg

No trackear PNG/WEBM/MP4 salvo política existente.

Puede usarse ffmpeg CLI si ya está disponible para conversión/frames/contact sheet, sin añadir dependencia.

Conservar fuente de vídeo Playwright.

---

## 40. Dependencies y branch discipline

No modificar:

- `package.json`;
- lockfiles;
- workflows CI no relacionados;
- timeouts/retries globales;
- C4;
- FT3D-6;
- FT3D-7;
- FT3D-8;
- 360;
- 8B-C.

No force push.

No merge automático.

No PR hasta auditoría posterior si el prompt de implementación así lo indica.

---

## 41. P1–P11 que FT3D-5 debe entregar

| P | Decisión FT3D-5 V2 |
|---|---|
| P1 | axon supported/partial/unsupported; exploded variant supported/unsupported + reasons |
| P2 | `axon-open`, `exploded-levels-open` |
| P3 | scope `building`; coverages `any`, `building` |
| P4 | `compact-building`, `vertical-levels` |
| P5 | `overview(level elegible)` → mismo overview |
| P6 | no repeat; max 1 |
| P7 | axon hold; exploded compact + exploded holds |
| P8 | temporal `all`; site-context no host; ownership matrix de §13 |
| P9 | reasons/partial de §§8–10 |
| P10 | 7000 / 10000 ms |
| P11 | no `overview(building)`; no anchor sin rooms |

FT3D-6 se reconcilia **después** de implementar/validar FT3D-5.

---

## 42. Criterios blocking

Bloquea READY:

- schema/persistencia/red nueva;
- project/building mutado;
- drift;
- p0/p1 no equivalentes al overview original;
- active→all no restaurado;
- Begin failure sin rollback;
- references Three obsoletas;
- active slab flotante;
- furniture/lights flotantes;
- roof/context/stairs/contact sin restaurar;
- overlap de plantas en exploded representativo;
- clipping grave;
- reduced motion roto;
- Story controls ausentes cuando FT3D-5 es única feature;
- dispatch hard-codeado sin adaptar;
- offline roto;
- regression branch-only;
- cancelled presentado como green;
- timeouts/retries inflados para ocultar fallo;
- evidencia visual de HEAD distinto al final.

---

## 43. DONE

FT3D-5 está DONE sólo después de:

### Implementación

- pure core;
- descriptor V2;
- Story builders;
- UI aditiva;
- standalone action;
- ownership handles sin reparenting;
- transactional lifecycle;
- residue inspector;
- no persistence/schema/network.

### QA

- unit;
- browser Chromium retries=0;
- offline;
- baseline comparison;
- no new regression;
- memory/rebuild checks;
- p0/p1 pre-End;
- active-upper;
- overlap-safe exploded;
- repeated config/cycles.

### Visual

- screenshots finales;
- contact sheet si aplica;
- videos forward/reverse reales;
- mobile;
- human inspection;
- evidence manifest ligado a final HEAD.

### Git

- clean tree;
- diff scope correcto;
- no package/lockfile unexpected;
- push normal;
- sin merge.

### Después de integración

- current-status;
- completion matrix;
- reconciliar FT3D-6 P1–P11;
- luego autorizar FT3D-6.

---

## 44. Estado de autorización

Este documento **no ejecuta código por sí solo**. Está técnicamente cerrado y listo para una única implementación pesada.

La implementación queda autorizada únicamente cuando el usuario/assistant emita un prompt explícito que:

- verifique SHAs;
- cree la rama de implementación;
- declare este contrato V2 como autoridad;
- prohíba cambiar arquitectura fuera de él.

**ESTADO: FT3D-5 CONTRATO V2 CONSOLIDADO — TÉCNICAMENTE CERRADO Y LISTO PARA PROMPT DE IMPLEMENTACIÓN**
