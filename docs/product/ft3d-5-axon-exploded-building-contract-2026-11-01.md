# FT3D-5 — Axonometría y despiece espacial del edificio — contrato de implementación

**Fecha:** 01-11-2026.

**Repositorio:** `Juanmaes83/floorplan-3d`.

**Base auditada:** `master@f74c4ee6bca58077a1135d4db2466e4332d0d5e7`.

**Rama documental:** `docs/ft3d-5-axon-exploded-contract`.

**Estado:** **CONTRATO TÉCNICO DE IMPLEMENTACIÓN — listo para revisión final antes de delegar la implementación pesada.**

FT3D-5 amplía la Presentation Story existente con dos lecturas espaciales del mismo modelo: una vista axonométrica compacta y un despiece vertical por plantas. No crea otro renderer, no crea otro modelo, no modifica geometría ni proyecto y no representa una secuencia constructiva.

Principios permanentes:

> **FT3D amplía Rubik. No sustituye Rubik.**

> **Todo lo nuevo se suma. Nada de lo existente se elimina sin una decisión expresa.**

> **Más contexto, no más falsa certeza.**

---

## 1. Objetivo

FT3D-5 debe permitir que una Presentation explique la organización volumétrica de una vivienda o edificio mediante:

1. **`axon`** — lectura axonométrica compacta del edificio manteniendo las cotas y offsets reales;
2. **`exploded-levels`** — despiece espacial vertical de las plantas, añadiendo una separación **puramente visual** sobre las cotas reales.

Ambas son escenas narrativas temporales. Al terminar, cancelar, hacer scrub hacia atrás o salir de Presentation, el modelo y la vista deben volver exactamente al estado de entrada.

FT3D-5 responde:

> **¿Cómo puedo explicar la relación espacial entre plantas sin alterar ni reinterpretar el edificio?**

No responde:

> **¿Cómo se construye el edificio?**

El exploded es una **descomposición espacial explicativa**, no una cronología, fase de obra, orden de montaje ni simulación constructiva.

---

## 2. Base técnica auditada

### 2.1 Presentation Story

La autoridad narrativa vigente es `js/presentation-story-core.js`:

- Story pura y determinista;
- `stateAt(p)` para `p ∈ [0,1]`;
- scrub, reverse y replay;
- `NARRATIVES` único;
- `SCENE_MS` único;
- escenas actuales: `plan-reveal`, `room-descent`, `section-open`, `elevation-open`.

FT3D-5 debe integrarse en ese mismo registro con:

- `axon-open`;
- `exploded-levels-open`.

No se crea un segundo Story engine.

### 2.2 Player y lifecycle

La autoridad de reproducción vigente es `js/presentation-ui.js` + `View3D.presentationStoryBegin/Apply/End`:

```text
openStory
  → enterScene
    → View3D.presentationStoryBegin(...)
    → View3D.presentationStoryApply(p)
    → View3D.presentationStoryEnd(...)
  → siguiente escena / finishStory / closeStory
```

FT3D-5 debe usar exactamente este pipeline.

### 2.3 Building

La autoridad de edificio es `FloorPlanBuilding` / `FloorPlanBuildingUI`:

- niveles ordenados;
- `offsetMm.x/y` reales;
- `elevationMm` real;
- contexto `current/all`;
- `presentationSources()` como entrada canónica de Presentation;
- `MAX_LEVELS=2` hoy, pero el contrato se diseña sobre colecciones, no sobre `level1/level2`.

FT3D-5 **lee** estas transformaciones. Nunca las escribe.

### 2.4 Jerarquía 3D actual

El renderer ya construye los niveles secundarios como `THREE.Group` completos con:

- arquitectura;
- lámparas;
- mobiliario;
- losa real cuando corresponde.

Su posición vertical se deriva de la diferencia real de `elevationMm` respecto al nivel activo.

El nivel activo, en cambio, no está encapsulado como un único grupo equivalente. Sus elementos viven en grupos actuales como `archFloor`, `archUp`, `furnG`, `lampG` y otros elementos de nivel.

Esta asimetría es una restricción central de FT3D-5: **no se autoriza reparentar permanentemente la escena sólo para facilitar el exploded**.

### 2.5 Cámara actual

Rubik usa una sola `PerspectiveCamera`.

La vista `isoWhole()` existente ya utiliza una lectura oblicua estable:

- edificio apilado: dirección basada en `(9, 8.5, 12.5)`;
- proyecto simple: dirección basada en `(5.5, 15.5, 10)`.

FT3D-5 debe conservar una cámara perspectiva y una lectura axonométrica visual coherente con esta autoridad.

**No se introduce `OrthographicCamera`.**

Por ello, el producto puede llamarlo “Vista axonométrica”, pero no debe presentarlo como una proyección ortográfica técnica, certificada o acotada.

---

## 3. Alcance V1

Incluido:

- proyecto de un nivel → axonometría compacta;
- edificio de dos niveles → axonometría compacta;
- edificio de dos niveles → despiece vertical por plantas;
- offsets X/Z reales;
- elevaciones reales;
- cámara y framing específicos de la Story;
- transformaciones temporales de nivel;
- mobiliario y luminarias acompañando a su nivel;
- restauración exacta;
- scrub/reverse/replay;
- reduced motion;
- móvil;
- capture compatible;
- QA visual y comparativa contra baseline.

Fuera de alcance:

- más de dos niveles como feature nueva;
- multi-edificio;
- fases de construcción;
- orden de obra;
- despiece de muros, puertas, ventanas, muebles o materiales por separado;
- exploded horizontal o radial;
- fan-out X/Z;
- secciones estructurales inventadas;
- nuevas losas;
- nuevos forjados;
- pilares/vigas inferidos;
- cubiertas inclinadas nuevas;
- ortografía/proyección técnica calibrada;
- persistencia de la elección;
- schema nuevo;
- IA;
- 360;
- FT3D-8;
- cambios de B1/B2/B3/B4/B8/C4.

---

## 4. Semántica y capacidades

### 4.1 IDs

IDs semánticos ya reservados por FT3D-6:

- `axon`;
- `exploded-levels`.

Adapters Story:

- `axon-open`;
- `exploded-levels-open`.

### 4.2 Familia

Ambas son `atomic-scene`.

### 4.3 Scope

Ambas tienen scope:

`building`

Un proyecto simple de una planta se trata como edificio de un nivel para `axon`.

### 4.4 Coverage

`axon` V1 admite:

- `any`;
- `building`.

`exploded-levels` V1 admite:

- `any`;
- `building`.

No satisfacen `level` ni `all-presented-levels` como capabilities separadas por planta: son una lectura global del conjunto presentado.

### 4.5 Repetición

- `repeatable: false`;
- `maxOccurrences: 1` por Story;
- `repeatScope: building`.

### 4.6 P11 — decisión cerrada

FT3D-5 **NO crea `overview(building)`**.

FT3D-5 **NO crea un nuevo anchor ejecutable sin PresentationPlan**.

El gate actual `presentation-plan-unavailable` permanece intacto.

Por tanto, P11 de FT3D-6 se resuelve como:

> **No en V1.** FT3D-5 añade escenas globales de edificio, pero siguen comenzando y terminando en un `overview(level)` existente del PresentationPlan.

---

## 5. Disponibilidad y reasons

Nuevo core puro:

`js/presentation-axon-core.js`

global/browser:

`FloorPlanPresentationAxon`

CommonJS:

`require('./presentation-axon-core.js')`

API principal:

```js
FloorPlanPresentationAxon.derive({ levels })
```

Input canónico:

```js
{
  levels: [{
    levelId,
    name,
    order,
    project,
    geometry,
    offsetMm: { x, y },
    elevationMm
  }]
}
```

Debe aceptar el resultado conceptual de `BuildingUI.presentationSources()`; un proyecto simple entra como un único nivel con offset y elevación cero.

### 5.1 Descriptor

Forma contractual:

```js
{
  version: 1,
  supported: true | false,
  reason: null | reasonCode,
  partial: boolean,

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
    baseMm: { x, y, z },
    boundsMm: {
      minX, maxX,
      minY, maxY,
      bottom, top
    },
    explodedExtraYmm
  }],

  gapMm,
  envelope,
  explodedEnvelope,
  excluded: [{ levelId, reason }]
}
```

Nombres menores pueden variar durante implementación si conservan exactamente la semántica.

### 5.2 Reasons mínimos

- `no-levels`;
- `invalid-level-geometry`;
- `degenerate-building-envelope`;
- `single-level` — sólo para `exploded-levels`;
- `insufficient-valid-levels` — exploded sin al menos dos niveles válidos;
- `partial-levels` como warning/estado descriptivo, no necesariamente reason bloqueante.

No usar reasons de FT3D-3/4 para fingir equivalencia.

### 5.3 Partial

`axon`:

- `supported` si existe al menos un nivel geométricamente válido;
- `partial:true` si había niveles presentados que no pueden entrar en la lectura;
- el copy debe decir que la lectura es parcial.

`exploded-levels`:

- necesita al menos dos niveles válidos;
- con los dos niveles actuales, si uno no es válido → `unsupported / insufficient-valid-levels`;
- el contrato queda future-safe para N niveles: podría ser partial si hay ≥2 válidos y algunos excluidos, pero no se implementa soporte >2 ahora.

### 5.4 Geometría válida

Un nivel entra en FT3D-5 si puede demostrar un envelope espacial real a partir del modelo:

- geometry/envelope finito y no degenerado;
- al menos un muro no demolido válido;
- altura real derivada de los muros/defaults existentes.

No usar furniture para decidir el envelope de edificio.

---

## 6. Autoridad de transforms

### 6.1 Base transform

La base real de cada planta es propiedad de Building:

```text
X = offsetMm.x
Z = offsetMm.y
Y = elevationMm
```

En el frame del nivel activo:

```text
baseRelativeY(level) = level.elevationMm - activeLevel.elevationMm
```

FT3D-5 no modifica:

- `offsetMm`;
- `elevationMm`;
- orden del nivel;
- `BuildingV1`;
- `FloorPlanProjectV1`.

### 6.2 Delta Presentation

El despiece sólo añade un delta temporal:

```text
displayTransform = baseTransform + presentationDelta
```

En V1:

```text
presentationDelta.x = 0
presentationDelta.z = 0
presentationDelta.y = explodedExtraY
```

No existe fan-out horizontal.

### 6.3 Regla absoluta, no acumulativa

`presentationStoryApply(p)` debe aplicar un transform **absoluto derivado de `stateAt(p)`**.

Prohibido:

```text
position.y += deltaPerFrame
```

Obligatorio conceptualmente:

```text
position.y = savedBaseY + state.levelDeltaY
```

Esto evita drift en:

- scrub;
- reverse;
- resize;
- replay;
- ciclos repetidos.

---

## 7. Separación visual de plantas

### 7.1 Regla

El exploded conserva las elevaciones reales y añade una separación visual uniforme por rango vertical.

Niveles válidos ordenados por `order` ascendente:

```text
extraY(level[i]) = i * gapMm
```

El nivel inferior tiene `extraY = 0`.

El siguiente conserva su elevación real y añade `gapMm`.

Para N niveles futuros, el patrón sigue siendo lineal sin hardcodear dos plantas.

### 7.2 `gapMm`

Derivación determinista:

1. tomar diferencias positivas de `elevationMm` entre niveles consecutivos válidos;
2. `nominalStoreyMm` = mediana de esas diferencias;
3. si no existe diferencia válida, usar la mayor altura de muro demostrable de los niveles;
4. fallback final: `2800 mm`;
5. calcular:

```text
gapMm = clamp(round(nominalStoreyMm * 0.45), 800, 1600)
```

La separación es una decisión de **legibilidad visual**, no una medida de proyecto.

No mostrar `gapMm` al usuario como cota técnica.

Copy recomendado:

> `Despiece espacial · separación visual`

No:

> `Separación entre forjados: 1,35 m`

### 7.3 Envelope exploded

`explodedEnvelope` conserva X/Z del envelope real y amplía Y sólo con los deltas visuales calculados.

Debe ser derivado una vez, no recalculado por frame.

---

## 8. Ownership de objetos 3D

### 8.1 Abstracción obligatoria

Crear internamente una abstracción de runtime equivalente a:

```js
PresentationLevelHandle = {
  levelId,
  order,
  baseY,
  applyDeltaY(deltaM),
  restore()
}
```

No es API de proyecto ni se persiste.

### 8.2 Niveles secundarios

Para niveles ya encapsulados en `levelsG`:

- envolver el `THREE.Group` existente;
- guardar su `position.y` exacto;
- aplicar el delta a ese grupo;
- restaurar exactamente el valor guardado.

### 8.3 Nivel activo

No reparentar permanentemente el nivel activo.

El handle del nivel activo debe aplicar el mismo delta temporal a todos los grupos/elementos que pertenecen visualmente a esa planta.

Como mínimo auditar e incluir:

- `archFloor`;
- `archUp`;
- `furnG`;
- `lampG`;
- losa activa real si existe fuera de esos grupos;
- cualquier otro grupo de nivel que el renderer actual coloque en el frame activo.

La implementación puede encapsular estos objetos detrás de un helper, pero el contrato exige:

- mismo delta para todos;
- estado base guardado una sola vez;
- restauración exacta;
- cero reparenting persistente;
- cero escritura en el modelo.

### 8.4 Losas

Sólo se mueven las losas que ya existen en el renderer.

FT3D-5 no crea losas nuevas para “hacer bonito” el exploded.

Si una losa pertenece a un nivel, debe acompañar a ese nivel.

### 8.5 Furniture y lamps

Mobiliario y luminarias visibles acompañan al nivel al que pertenecen.

No se quedan flotando en su posición original.

No se reconstruyen por frame.

### 8.6 Escaleras y conectores

Las escaleras conectan niveles y no pertenecen limpiamente a una sola planta.

V1:

- en `axon-open` compacto: se conservan como hoy;
- en `exploded-levels-open`: se ocultan durante la fase separada;
- al recomponer/restaurar vuelven exactamente a su visibilidad previa.

No estirar escaleras.

No moverlas con una sola planta.

No inventar tramos intermedios.

Un exploded específico de conectores queda fuera de V1.

---

## 9. Contexto, terreno y elementos no pertenecientes a plantas

El contexto territorial, terreno, ortofoto y elementos de parcela **no se separan con las plantas**.

### 9.1 Axon compacto

Puede conservar el contexto actual si no perjudica la lectura y coincide con el estado existente, pero FT3D-5 no lo usa como enhancement contractual.

### 9.2 Exploded

Durante la fase separada:

- ocultar contexto/terrain/orthophoto que pueda hacer parecer que las plantas flotan a cotas reales del terreno;
- guardar la visibilidad exacta;
- restaurarla al recomponer y al salir.

FT3D-5 V1 **no declara compatibilidad de `site-context` con `axon` ni con `exploded-levels`**.

Por tanto, P8 de FT3D-6 se resuelve:

> `site-context` mantiene como única anfitriona V1 a `elevation`; FT3D-5 no añade nuevas anfitrionas.

Solar tampoco es enhancement de estas escenas.

---

## 10. Cámara y framing

### 10.1 Cámara única

Usar la misma `PerspectiveCamera` y el mismo orbit/player actuales.

No crear cámara ortográfica ni cámara secundaria.

### 10.2 Dirección axonométrica

La dirección debe ser determinista y coherente con `isoWhole()`:

- un nivel: convención proporcional a `(5.5, 15.5, 10)`;
- edificio apilado: convención proporcional a `(9, 8.5, 12.5)`.

No depender de:

- `northOffsetDeg`;
- nombres de rooms;
- idioma;
- fachada elegida;
- posición previa arbitraria del usuario.

### 10.3 Framing

La pose axonométrica se calcula contra:

- `envelope` para compact;
- `explodedEnvelope` para exploded.

Debe respetar `view.region`, igual que FT3D-3/4, para no quedar detrás de UI.

Usar un fit geométrico puro equivalente al patrón de `elevationOpen`:

- construir las ocho esquinas del box 3D;
- proyectarlas contra ejes right/up de la cámara;
- buscar distancia mínima que mantenga todas dentro de la región útil;
- margen estable;
- sin `Box3.setFromObject` por frame.

### 10.4 Lens

Mantener la FOV de overview salvo que el Story core documente una transición determinista necesaria.

No usar lens extremadamente larga para fingir ortografía.

La lectura es axonométrica visual en perspectiva.

### 10.5 Endpoints

`p=0`:

- cámara = overview exacto;
- transforms de nivel = base exacta;
- visibilidades = estado de entrada.

`p=1`:

- cámara = mismo overview exacto;
- transforms = base exacta;
- visibilidades = estado de entrada.

Esto es obligatorio para continuidad con otras scenes.

---

## 11. Story — `axon-open`

Nuevo builder puro en `presentation-story-core.js`:

```js
axonOpen(input)
```

Input conceptual:

```js
{
  start: overviewPose,
  descriptor,
  region,
  aspect
}
```

Salida:

```js
{
  kind: 'axon-open',
  stateAt(p),
  checkpoints,
  info
}
```

### 11.1 Fases

Contrato V1:

```text
p = 0.00       overview exacto
0.00 → 0.28    transición a axonometría compacta
0.28 → 0.72    lectura/hold axonométrico
0.72 → 1.00    retorno al overview exacto
p = 1.00       overview exacto
```

Durante toda la escena:

- `levelDeltaY = 0`;
- cotas reales intactas;
- todos los niveles válidos del edificio pueden mostrarse temporalmente.

### 11.2 Timing

Añadir:

```js
SCENE_MS['axon-open'] = 7000
```

### 11.3 Reduced motion

Definir un hold discreto en la lectura compacta.

En reduced motion:

- no animar órbita/dolly;
- saltar al estado axonométrico estable;
- permitir continuar desde el hold existente del player;
- conservar exactamente los mismos datos y targets.

---

## 12. Story — `exploded-levels-open`

Nuevo builder puro:

```js
explodedLevelsOpen(input)
```

### 12.1 Una sola escena

Cuando el usuario elige exploded, **no se ejecuta además `axon-open` como una escena separada**.

`exploded-levels-open` contiene internamente una fase axonométrica compacta antes de separar niveles.

Así se evita:

```text
axon → exploded
```

como repetición artificial del mismo mensaje.

### 12.2 Fases

Contrato V1:

```text
p = 0.00       overview exacto; deltas 0
0.00 → 0.22    transición a axonometría compacta; deltas 0
0.22 → 0.55    separación vertical progresiva
0.55 → 0.74    hold del exploded completo
0.74 → 0.90    recomposición progresiva
0.90 → 1.00    retorno de cámara al overview
p = 1.00       overview exacto; deltas 0
```

Separación:

```text
separationFactor = smooth(...)
levelDeltaY[i] = extraY[i] * separationFactor
```

La función debe ser absoluta y reversible.

### 12.3 Timing

Añadir:

```js
SCENE_MS['exploded-levels-open'] = 10000
```

### 12.4 Reduced motion

Holds contractuales:

- compact axon;
- exploded completo.

En reduced motion:

- no interpolar físicamente las plantas;
- aplicar directamente el estado del hold;
- siguiente acción avanza al siguiente hold/estado;
- recomposición/salida restaura sin animación.

No eliminar la capability por reduced motion.

---

## 13. Anchors y posición en Story

### 13.1 Anchors

`axon`:

```text
startAnchor = overview(level de inserción)
endAnchor   = overview(mismo level)
```

`exploded-levels`:

```text
startAnchor = overview(level de inserción)
endAnchor   = overview(mismo level)
```

No se crea `overview(building)`.

### 13.2 Inserción

En la Story actual, la escena global se inserta una sola vez, en el primer overview válido del edificio, antes del primer `room-descent`.

Orden canónico del primer bloque:

```text
plan-reveal
→ section-open        (si procede)
→ elevation-open      (si procede; una vez)
→ axon-open OR exploded-levels-open
→ room-descent        (si procede)
```

Los siguientes niveles siguen su bloque actual sin repetir axon/exploded.

No cambiar el orden histórico cuando FT3D-5 está OFF.

### 13.3 Compatibilidad con section/elevation

Cada scene termina exactamente en overview.

Por tanto:

```text
section → elevation → axon/exploded → room
```

no necesita transición inventada.

---

## 14. UI V1

FT3D-5 se añade al flujo existente:

**ENTREGAR → Presentación**

No crea módulo, ruta o entrypoint nuevo.

### 14.1 Opción runtime

Modelo conceptual único:

```js
axonMode: 'off' | 'compact' | 'exploded'
```

UI recomendada:

**Lectura del edificio**

- `Sin axonometría`
- `Vista axonométrica`
- `Despiece por plantas`

### 14.2 Defaults

Default:

`off`

Paridad histórica obligatoria.

### 14.3 Una planta

- `compact` disponible;
- `exploded` deshabilitado;
- explicación: `El despiece por plantas necesita al menos dos niveles.`

### 14.4 Dos plantas

- compact disponible si descriptor axon soportado;
- exploded disponible si hay ≥2 niveles válidos.

### 14.5 Persistencia

No guardar `axonMode` en:

- proyecto;
- building;
- localStorage nuevo;
- URL/query;
- sidecar.

Sólo sesión actual del diálogo.

FT3D-6 decidirá posteriormente defaults por template.

---

## 15. Lifecycle renderer

### 15.1 Begin

`View3D.presentationStoryBegin(..., kind)` debe reconocer:

- `axon-open`;
- `exploded-levels-open`.

Al comenzar:

1. validar `stop.kind === 'overview'`;
2. validar descriptor y variant;
3. guardar cámara/orbit/FOV/near/far como hoy;
4. guardar `levelView` previo;
5. hacer visibles temporalmente los niveles requeridos, sin persistir;
6. resolver handles de transform de nivel;
7. guardar transforms base exactos;
8. guardar visibilidad exacta de stairs/context/terrain que pueda tocar la scene;
9. desactivar orbit durante Story;
10. no modificar proyecto/building.

### 15.2 Apply

Por frame:

- leer sólo `stateAt(p)`;
- aplicar cámara;
- aplicar deltas Y absolutos a handles;
- aplicar visibilidades por fase;
- no reconstruir geometría;
- no recalcular descriptors;
- no recalcular Box3 completo;
- no tocar storage;
- no disparar red.

### 15.3 End

En cualquier salida:

- restaurar transforms exactos;
- restaurar stairs exactas;
- restaurar context/terrain exactos;
- restaurar `levelView` exacto;
- restaurar cámara/orbit según lifecycle actual;
- limpiar runtime handles;
- cero residuo.

Debe funcionar en:

- final normal;
- reverse hasta 0;
- scrub;
- Escape;
- Close;
- browser Back;
- cambio de scene;
- error runtime;
- resize/reseek.

---

## 16. `levelView` temporal

Axon/exploded necesitan leer el edificio completo, incluso si el usuario estaba en `current`.

V1:

1. guardar modo visible actual;
2. activar temporalmente `all` sin persistir;
3. ejecutar la scene;
4. restaurar el modo previo exactamente.

La preferencia del usuario en Building UI no cambia.

En proyecto simple no hay cambio de `levelView`.

---

## 17. Restauración y no mutación

### 17.1 Invariante de proyecto

Antes y después de cualquier scene:

```text
JSON.stringify(projectBefore) === JSON.stringify(projectAfter)
```

Y, cuando aplique:

```text
JSON.stringify(buildingBefore) === JSON.stringify(buildingAfter)
```

FT3D-5 no incrementa revision.

### 17.2 Invariante visual

Después de `End`:

- cada grupo vuelve al transform exacto guardado;
- cada visibilidad vuelve al valor exacto guardado;
- no queda level extra desplazado;
- no queda escalera oculta;
- no queda context oculto;
- no cambia cut;
- no cambia furniture toggle;
- no cambia roof toggle;
- no cambia levelView persistido.

### 17.3 Debug read-only

Añadir un getter de diagnóstico equivalente a:

```js
View3D.presentationAxonResidue
```

Debe devolver datos clonados/read-only suficientes para QA, por ejemplo:

```js
{
  active: false,
  levelDeltas: [{ levelId, deltaY }],
  stairsChanged: false,
  contextChanged: false,
  levelViewRestored: true
}
```

No devolver referencias mutables de Three.

Precedente: `presentationElevationResidue`.

---

## 18. Performance

FT3D-5 debe ser barato por frame.

Prohibido por frame:

- `Core.geometry(...)`;
- `FloorPlanExterior.derive(...)`;
- `new THREE.Box3().setFromObject(...)` sobre edificio completo;
- rebuild de niveles;
- rebuild de muebles;
- rebuild de escaleras;
- búsquedas DOM repetidas;
- red.

Permitido por frame:

- asignación de camera pose/lens;
- asignación de `position.y` en handles;
- cambios puntuales de `visible`;
- updates de matrix necesarios por Three.

Descriptors, envelopes y handles se preparan en preflight/Begin.

---

## 19. Copy y falsa precisión

Copy permitido:

- `Vista axonométrica`;
- `Despiece por plantas`;
- `Despiece espacial · separación visual`;
- `Lectura parcial` si se excluye un nivel no demostrable.

No afirmar:

- `proyección ortográfica`;
- `axonometría técnica exacta`;
- `distancia real entre las plantas separadas`;
- `forjado` si el modelo no lo contiene;
- `estructura`;
- `secuencia constructiva`;
- `orden de montaje`.

---

## 20. API pública y cambios esperados

### 20.1 Archivo nuevo

`js/presentation-axon-core.js`

Responsabilidades:

- derive puro;
- reasons;
- envelopes;
- gap;
- deltas por nivel;
- cero DOM/Three/storage/network.

### 20.2 Story core

Modificar `js/presentation-story-core.js`:

- `axonOpen`;
- `explodedLevelsOpen`;
- `NARRATIVES`;
- `SCENE_MS`;
- constantes de fases/reduced;
- fit puro de box/región;
- tests unitarios.

### 20.3 Presentation UI

Modificar `js/presentation-ui.js`:

- descriptor FT3D-5 en configuración;
- `axonMode` runtime;
- inserción de una única escena;
- captions/hints;
- reduced holds;
- no persistencia.

### 20.4 Renderer

Modificar el bloque View3D de `index.html` sólo en lo necesario para:

- Begin/Apply/End de las nuevas kinds;
- handles de nivel;
- context/stairs visibility;
- residue getter.

No aprovechar FT3D-5 para refactors generales del renderer.

### 20.5 HTML/UI

Cambios aditivos mínimos para la opción de Presentation.

No eliminar ni renombrar controles existentes.

---

## 21. No cambios de schema/persistencia

No modificar:

- `FloorPlanProjectV1`;
- `BuildingV1`;
- schema version;
- migration;
- sidecar de Presentation;
- keys de localStorage;
- project revision.

FT3D-5 es runtime puro.

---

## 22. Determinismo

Mismo:

- proyecto/building;
- niveles;
- offsets/elevaciones;
- viewport/region;
- mode;

produce el mismo:

- descriptor;
- gap;
- deltas;
- envelopes;
- camera target;
- Story states;
- checkpoints;
- reasons.

No usar:

- `Date.now()`;
- `Math.random()`;
- orden de DOM;
- labels traducidas;
- heurística basada en nombre de estancia.

---

## 23. QA unitario — `tests/presentation-axon.test.cjs`

Como mínimo:

1. proyecto de un nivel → axon supported;
2. un nivel → exploded `single-level`;
3. dos niveles válidos → axon supported;
4. dos niveles válidos → exploded supported;
5. offsets X/Z reales conservados;
6. elevaciones reales conservadas;
7. extra Y añadido, nunca sustituye elevación real;
8. nivel inferior extra 0;
9. nivel superior extra `gapMm`;
10. gap determinista;
11. gap clamp mínimo 800;
12. gap clamp máximo 1600;
13. fallback de nominal storey;
14. envelope compacto correcto;
15. explodedEnvelope correcto;
16. descriptor serializable;
17. input no mutado;
18. mismo input deepEqual;
19. niveles desordenados se normalizan por `order` estable;
20. IDs iguales no alteran determinismo;
21. nivel inválido excluido;
22. partial axon con exclusión;
23. exploded con <2 válidos → unsupported;
24. no-levels;
25. degenerate-building-envelope;
26. reasons estables;
27. axon `stateAt(0)` = overview;
28. axon `stateAt(1)` = overview;
29. exploded `stateAt(0)` deltas 0;
30. exploded hold usa deltas completos;
31. exploded `stateAt(1)` deltas 0;
32. reverse: `stateAt(p)` independiente de historia;
33. sequence reconoce las dos nuevas scenes;
34. SCENE_MS 7000/10000;
35. reduced holds declarados;
36. fit mantiene esquinas en región útil;
37. no depende de north/cardinal;
38. no depende de labels.

---

## 24. QA navegador — `tests/presentation-axon.browser.test.cjs`

Como mínimo:

1. control FT3D-5 visible en Presentación;
2. default OFF;
3. OFF parity con master;
4. un nivel: compact disponible;
5. un nivel: exploded deshabilitado con reason;
6. dos niveles: compact;
7. dos niveles: exploded;
8. activeLevel inferior;
9. activeLevel superior;
10. offsets X/Z no cero;
11. elevaciones no estándar;
12. alturas de muro distintas;
13. furniture acompaña nivel;
14. lamps acompañan nivel;
15. losas existentes acompañan nivel;
16. stairs visibles en compact;
17. stairs ocultas en exploded hold;
18. stairs restauradas;
19. contexto/terrain restaurado;
20. `current` → temporal `all` → `current` exacto;
21. `all` → sigue `all` tras finalizar;
22. section + axon coexistencia;
23. elevation + axon coexistencia;
24. section + elevation + exploded coexistencia;
25. no residue tras forward;
26. no residue tras reverse;
27. no residue tras scrub;
28. cancelación a mitad de separación;
29. Escape a mitad;
30. Close a mitad;
31. browser Back a mitad;
32. cinco ciclos consecutivos sin drift;
33. resize durante axon y reseek estable;
34. resize durante exploded y reseek estable;
35. capture durante compact;
36. capture durante exploded;
37. JSON project before/after idéntico;
38. JSON building before/after idéntico;
39. revision sin cambios;
40. sin key localStorage nueva;
41. 390×844;
42. 844×390;
43. reduced motion compact;
44. reduced motion exploded;
45. no horizontal overflow;
46. controles Exit/Pause operables;
47. `presentationAxonResidue` limpio al terminar.

---

## 25. QA visual obligatoria

La implementación no se considera validada sólo porque pasen asserts.

Generar evidencia sobre HEAD final:

### 25.1 Screenshots

Mínimo:

- un nivel, overview `p=0`;
- un nivel, axon hold;
- un nivel, retorno;
- dos niveles compactos;
- dos niveles exploded hold;
- dos niveles con offsets X/Z;
- active upper level;
- reduced motion;
- 390×844;
- 844×390.

### 25.2 Vídeos

Mínimo:

- `axon-open` forward;
- `axon-open` reverse;
- `exploded-levels-open` forward;
- `exploded-levels-open` reverse;

Representativo desktop 1440×900.

Añadir al menos una evidencia móvil corta para exploded.

### 25.3 Inspección humana

Revisar explícitamente:

- que plantas no se deforman;
- que no aparece estructura inventada;
- que no hay mobiliario flotante;
- que las escaleras no se estiran;
- que la separación se entiende como visual;
- que la cámara no corta el edificio;
- que el retorno no salta;
- que reverse no deja residuos.

---

## 26. Regresiones obligatorias

Ejecutar y comparar con la base exacta `f74c4ee6bca58077a1135d4db2466e4332d0d5e7`:

- unitarias canónicas;
- `presentation-story`;
- `presentation-section`;
- `presentation-elevation`;
- `presentation-overview`;
- `presentation-focus`;
- `presentation-framing`;
- `presentation-minimap`;
- `presentation`;
- `building-presentation`;
- `solar`;
- `capture-3d`;
- `tour-video`;
- `professional-workspace`;
- `project-first`;
- `territory-integration`.

No llamar “green” a una suite con cancelaciones.

Si branch falla y base pasa:

**regresión FT3D-5 → bloquea integración.**

Si branch y base reproducen exactamente el mismo fallo/cancelación:

**deuda previa documentada → no atribuir a FT3D-5.**

---

## 27. Baseline conocido que NO pertenece a FT3D-5

No arreglar dentro de este corte salvo que FT3D-5 lo empeore:

- R10 framing instability;
- M13 minimap 1440 timeout;
- P13/P15/P05 presentation 1440/cycles timeout;
- case31 Escape/Back timeout;
- professional-workspace human-review timeout histórico bajo carga;
- render-budget timeout/cancellation histórico;
- 8B-C cubiertas inclinadas diferidas;
- 360 diferido.

Toda desviación nueva debe compararse con base antes de clasificarla.

---

## 28. Integración con FT3D-6 — resolución P1–P11

Tras implementar y validar FT3D-5, FT3D-6 debe reconciliar:

| P | FT3D-5 entrega contractual |
|---|---|
| P1 | `axon`: supported/partial/unsupported; `exploded-levels`: supported/unsupported con reasons de §5 |
| P2 | `axon-open` y `exploded-levels-open` |
| P3 | scope `building`; coverages `any`, `building` |
| P4 | `compact-building` y `vertical-levels` |
| P5 | `overview(level de inserción)` → mismo `overview(level)` |
| P6 | no repetibles; máximo 1 por Story/building |
| P7 | holds reduced de §§11–12 |
| P8 | all levels temporal; `site-context` NO host V1; stairs policy de §8.6 |
| P9 | reasons/partial de §5 |
| P10 | 7000 ms axon; 10000 ms exploded |
| P11 | NO `overview(building)` y NO nuevo anchor sin rooms |

Esta tabla es vinculante para la reconciliación posterior de FT3D-6 salvo que la implementación demuestre una imposibilidad técnica real y se documente antes de integrar.

---

## 29. Criterios de aceptación funcional

FT3D-5 está funcionalmente correcto cuando:

1. axon funciona con un proyecto de un nivel;
2. axon funciona con edificio de dos niveles;
3. exploded sólo se habilita con ≥2 niveles válidos;
4. exploded conserva offsets/elevaciones reales y sólo añade Y visual;
5. plantas completas se desplazan como unidades visuales;
6. furniture/lights acompañan a su planta;
7. stairs no se deforman;
8. no se inventa estructura;
9. cámara encuadra compact y exploded en la región libre;
10. p0 y p1 son overview exacto;
11. reverse y scrub son deterministas;
12. cancelación restaura exactamente;
13. current/all se restaura;
14. no hay persistencia;
15. no hay schema;
16. reduced motion conserva la misma información;
17. móvil conserva el mismo relato;
18. OFF es idéntico al comportamiento histórico.

---

## 30. Criterios DONE

FT3D-5 **NO está DONE** por tener una rama READY.

DONE exige:

### Código

- `presentation-axon-core.js` puro;
- Story builders integrados;
- runtime transform handles correctos;
- UI aditiva;
- no schema/persistence.

### Tests

- unitarias FT3D-5 PASS;
- navegador FT3D-5 PASS;
- regresiones clasificadas contra base exacta;
- ninguna regresión nueva atribuible a FT3D-5.

### Restauración

- zero transform residue;
- project/building JSON unchanged;
- current/all restored;
- stairs/context restored;
- repeated cycles without drift.

### Visual

- screenshots finales revisadas;
- vídeos forward/reverse revisados;
- desktop y móvil representativos;
- no clipping grave del edificio;
- no floating content;
- no false construction reading.

### Git/CI

- branch limpia;
- commits claros;
- push normal;
- PR con alcance FT3D-5 únicamente;
- required CI revisado una vez al terminar, sin polling repetitivo;
- sólo integrar después de auditoría del asistente.

### Documentación

Después de integrar:

- actualizar current-status;
- actualizar roadmap completion matrix;
- reconciliar P1–P11 de FT3D-6;
- promover FT3D-6 sólo después de esa reconciliación.

---

## 31. Límites para Claude Code

Cuando se delegue la implementación pesada, Claude debe respetar:

- rama nueva desde el `master` exacto autorizado;
- no tocar FT3D-6 salvo que el prompt lo autorice expresamente después de FT3D-5;
- no arreglar baseline debt;
- no reabrir C4;
- no 360;
- no FT3D-8;
- no refactor general del renderer;
- no schema/persistence;
- no commit/merge fuera del alcance;
- no force push;
- evidencia visual sobre HEAD final;
- handoff con tests exactos, fallos, baseline y archivos modificados.

---

## 32. Decisiones cerradas por este contrato

1. FT3D-5 usa el Story engine existente.
2. Usa la PerspectiveCamera existente.
3. `axon` y `exploded-levels` son atomic-scene de scope building.
4. Adapters: `axon-open`, `exploded-levels-open`.
5. Una sola scene global por Story.
6. Exploded incluye su fase compacta; no ejecuta axon como scene adicional.
7. Despiece exclusivamente vertical en V1.
8. Offsets X/Z reales nunca cambian.
9. Elevaciones reales nunca se sustituyen.
10. Gap visual determinista 45 % del storey nominal, clamp 800–1600 mm.
11. Base transform pertenece a Building; FT3D-5 sólo añade delta runtime.
12. Active level usa transform handle, no reparenting persistente.
13. Furniture/lights/losas reales acompañan a la planta.
14. Stairs se ocultan durante exploded, no se deforman.
15. Site-context no es host de FT3D-5 V1.
16. No se crea `overview(building)`.
17. No se levanta el gate PresentationPlan sin rooms.
18. Start/end = overview del nivel de inserción.
19. Orden: section → elevation → axon/exploded → room dentro del primer bloque aplicable.
20. Runtime option: `off | compact | exploded`.
21. Default OFF.
22. Axon 7000 ms; exploded 10000 ms.
23. Reduced motion usa holds, no elimina capability.
24. No geometry rebuild por frame.
25. No schema, storage, URL ni network.
26. P1–P11 quedan contractualmente resueltos por la tabla §28 una vez FT3D-5 esté implementado y validado.

---

## 33. Estado de autorización

Este documento define el corte técnico.

**Todavía no constituye autorización automática de merge.**

La implementación pesada puede delegarse después de la revisión final de este contrato. La integración seguirá el flujo:

```text
CONTRATO
→ CLAUDE CODE implementación pesada
→ auditoría del asistente
→ QA/baseline
→ CI
→ integración segura
→ documentación
→ reconciliación FT3D-6
```

**ESTADO: FT3D-5 CONTRATO TÉCNICO COMPLETO — PENDIENTE DE REVISIÓN FINAL Y AUTORIZACIÓN DE IMPLEMENTACIÓN**
