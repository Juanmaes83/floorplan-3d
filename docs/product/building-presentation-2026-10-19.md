# Presentar las dos plantas de un edificio en una sola presentación y un solo lote (19-10-2026)

**Candidato aprobado por Juanma el 19-10-2026**, salido del [estudio LoRA LAB de #48](https://github.com/Juanmaes83/floorplan-3d/pull/48), §8.

- **Público:** inmobiliarias, promotoras y estudios de arquitectura, con reformas e interiorismo como segundo público (D-01).
- **Base:** `master` `bd153c76e493eb5dea1b2908c768f66935f5a192`.
- **Sin cambios en:** `FloorPlanProjectV1` y `FloorPlanBuildingV1`. Ninguna acción de presentar, capturar o exportar escribe en el edificio.
- **QA:** [`docs/qa/building-presentation-2026-10-19.md`](../qa/building-presentation-2026-10-19.md).

## 1. Qué cambia para el usuario

**Antes.** En un edificio, «Presentar mi vivienda» presentaba sólo la planta activa, con el aviso «Las demás plantas y la escalera no se incluyen». Para la otra planta había que salir, cambiar de planta y repetir; el resultado eran dos lotes ZIP sueltos.

**Ahora, con un edificio de dos plantas:**

- **Configuración:** las estancias aparecen agrupadas por planta, cada grupo con su nombre de planta. La selección y el orden se eligen dentro de cada planta.
- **Recorrido:** las plantas se presentan de abajo arriba, y cada una empieza con su propia vista general.
  - La primera vista de la planta siguiente se rotula «Cambio de planta: «Planta primera» · planta 2 de 2».
  - Las demás vistas llevan ««Planta baja» · planta 1 de 2».
- **Fila de vistas:** las vistas se agrupan bajo el nombre de cada planta. Cada botón tiene como nombre accesible «Estancia · Planta», así que dos estancias con el mismo nombre en plantas distintas no se confunden.
- **Lote:** un solo ZIP, `presentacion-edificio.zip`, con las vistas PNG de las dos plantas, `presentation.json` y el edificio editable (`editable-building.zip`).
- **Al salir:** el editor vuelve a la planta en la que estaba, con su cámara, su selección y su historial.

Un proyecto de una planta mantiene el mismo plan, el mismo lote y el mismo formato de antes.

## 2. Puntos de integración comprobados en el código vigente

| Pregunta | Respuesta en `bd153c7` | Uso en esta entrega |
| --- | --- | --- |
| ¿Cómo se eligen y enumeran las paradas? | `FloorPlanPresentationCore.create` crea el plan de **un** proyecto: vista general y estancias elegidas (`js/presentation-core.js`). La selección se guarda en un archivo local por entrada y proyecto (`Core.key`, `Core.sidecar`). | Nuevo `createBuilding`, con plantas de abajo arriba y una vista general por planta. Cada parada lleva su planta y se identifica como `level:<planta>:room:<estancia>`. La selección se guarda en el mismo archivo local por planta. `create` no cambia. |
| ¿Cómo recibe `View3D` el contexto y `levelView`? | `FloorPlanBuildingUI.render` → `push3D` → `View3D.setLevelContext(ctx,view)`. `buildLevels` dibuja la planta activa a cota 0 y las demás desplazadas por su elevación. Con `levelView='active'` se ven las plantas hasta la activa. Durante una presentación, el cambio de contexto no mueve la cámara (`index.html`, `setLevelContext`). | Cada vista se toma con **su** planta activa: sus modelos GLB autorizados y sus materiales, y la planta inferior debajo. El encuadre de estancia (`roomFrame`) y la cota de los ojos no cambian, porque la planta activa está siempre a cota 0. |
| ¿Cómo se representa la planta actual en el minimapa? | `Core.minimap(app.geometry, …)` usa la geometría del proyecto activo. | Al cambiar la planta activa, el minimapa muestra la planta de la parada sin más código. |
| ¿Cómo se generan y validan `presentation.json` y el ZIP? | `captureBatch`, en `js/presentation-ui.js`: PNG con firma y tamaño comprobados, `views/view-NNN.png`, `editable-project.zip` y manifiesto de versión 1. Los nombres se filtran con la lista de `FloorPlanPackage.path`. En la aplicación **no había lector** del lote; sólo las pruebas lo leían. | Nuevo `captureBuildingBatch` con manifiesto de versión 2 (§3) y nuevo lector puro `readCaptures`, válido para las versiones 1 y 2. El lote de una planta sigue en `captureBatch`, cuyo único cambio es la extracción del PNG a `pngShot()`, que hace exactamente lo mismo. |
| ¿Cómo se aplica `FloorPlanBuildingUI.gate`? | `open()` llama a `gate('Presentar mi vivienda')`. Con una distribución pendiente (BW5 o muebles sin evaluar) no abre y explica qué falta. | Se mantiene igual. |
| ¿Bloquean esas salidas también las capturas internas? | **No.** `capture()` (PNG) y `captureBatch()` no volvían a comprobar el estado; dependían de que `open()` lo hubiera hecho. | Ahora el lote y el PNG individual vuelven a comprobar `status()` antes de exportar. Si está pendiente, no empiezan, explican el motivo y no descargan nada. |
| ¿Cómo se cambia de planta sin perder la presentación? | `selectLevel` guarda, mueve el historial por planta, cambia la entrada activa y **anula** la presentación (`FloorPlanPresentation.invalidate`). | `selectLevel(levelId, {presentation: true})` no anula la presentación ni muestra el aviso «Planta activa». Se expone como `FloorPlanBuildingUI.presentLevel`. |

## 3. Formato del lote del edificio

Mismo `format`, versión **2** y `scope: "building"`. Los lotes de una planta siguen siendo de versión 1, con las mismas claves.

```text
presentacion-edificio.zip
├── presentation.json
├── views/view-001.png … view-NNN.png   (numeración global por orden: no se sobrescriben)
└── editable-building.zip               (el mismo ZIP que «Exportar edificio (ZIP)»)
```

```json
{
  "format": "rubik-sota.presentation-captures", "version": 2, "scope": "building", "viewRepresentation": "static-png",
  "buildingId": "bld_…", "buildingName": "…", "entryId": "prj_…",
  "levels": [{"levelId": "lvl_…", "name": "Planta baja", "order": 0, "elevationMm": 0, "projectId": "prj_…", "revision": "…", "center": {}, "resources": {"sourceImages": [], "models": [], "surfaces": []}}],
  "views": [{"order": 1, "levelId": "lvl_…", "levelName": "Planta baja", "levelOrder": 0, "kind": "overview", "roomId": null, "label": "Vista general",
             "filename": "views/view-001.png", "width": 1280, "height": 800, "bytes": 0, "sha256": "…", "camera": {}}],
  "portableBuilding": {"filename": "editable-building.zip", "format": "rubik-sota.editable-building", "buildingId": "bld_…", "buildingSha256": "…", "bytes": 0, "sha256": "…"}
}
```

**Garantías:**

- Cada vista nombra su planta. Una estancia se identifica por el par (planta, estancia), así que dos estancias con el mismo ID en plantas distintas no comparten vista ni archivo.
- `buildingSha256` es el hash canónico del `building.json` empaquetado, de modo que un lector puede comprobarlo.
- Antes de escribir el ZIP, el lote comprueba que **todas** las plantas presentadas conservan su revisión (`currentBuilding`) y valida el manifiesto con `readCaptures`.

**Compatibilidad:**

- `readCaptures` lee la versión 1, también los lotes antiguos sin proyecto editable (se prueba con el lote de `docs/qa/artifacts/casa-serra/r4-m09`), y la versión 2.
- Rechaza una versión desconocida, más de dos plantas, vistas sin archivo, archivos no declarados, rutas no permitidas y pares (planta, estancia) repetidos.
- Un lector antiguo que sólo conozca la versión 1 ve `version: 2` y no puede tomarlo por un lote de una planta.

## 4. Alcance y límites

**Incluido:**

- dos plantas como máximo (`MAX_LEVELS = 2`, el mismo límite que `FloorPlanBuildingV1` en este corte);
- selección agrupada por planta;
- orden de presentación y un único lote;
- rótulos de planta y de cambio de planta;
- contexto 3D y minimapa por parada;
- lectura y validación del ZIP;
- el bloqueo del edificio con distribución pendiente, también para las capturas internas.

**Fuera de alcance, sin cambios:**

- recorrido libre o guiado por la escalera y animación de subida;
- tres o más plantas;
- exterior, cubierta y terreno;
- cambios de contrato;
- MCP, LoRA LAB y Blender.

«Recorrer desde entrada» sigue trabajando dentro de la planta de la parada.

**Límites conocidos:**

- **Cambio de planta:** durante la presentación se usa el cambio de planta del editor. Se guarda la planta activa de la entrada (`activeLevelId`), un estado de interfaz que ya cambiaba al elegir planta, y al salir vuelve a la de partida. El edificio (`building`) no se reescribe: `setProject` no cambia nada si el proyecto es idéntico, y la prueba compara el edificio guardado antes y después.
- **Modelos 3D durante el lote:** el lote espera, con un límite de 20 s, a que carguen los modelos 3D de cada planta. Si no terminan, se detiene con un mensaje y no descarga nada.
- **Rendimiento:** medido sólo con render por software (SwiftShader). Faltan una GPU real y teléfonos físicos.
