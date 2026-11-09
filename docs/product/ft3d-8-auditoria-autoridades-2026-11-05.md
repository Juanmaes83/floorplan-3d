# FT3D-8 · Fase A — Auditoría de autoridades reales de RUBIK

**Fecha:** 5 nov 2026 · **Rama:** `feat/ft3d-8v-schedule-core-2026-11-05` · **Base auditada:** `master@0f9c6ea` (sin commits posteriores en `master` ni en la rama al empezar; HEAD de partida `9887d90`).
**Alcance:** lectura de código. En esta fase no se ha modificado código funcional de RUBIK.

## 1. Matriz de autoridades

| Dato | Autoridad (archivo · función) | Forma | Verificable | Cómo lo usa FT3D-8 |
|---|---|---|---|---|
| Proyecto de una planta | `js/project-core.js` · `validate(p,{strict})` (l. 83), esquema `js/project-schema.js` (`FloorPlanProjectV1` 1.0–1.12) | JSON en mm, `additionalProperties:false` | Estructura sí; dimensiones según la escala | Se valida en modo estricto antes de usarlo; nunca se modifica |
| Edificio multiplanta | `js/building-core.js` · `validate` (l. 125), `LIMITS.levels=2` (l. 13) | Una `FloorPlanProjectV1` por planta + `elevationMm`, `slabThicknessMm`, `offsetMm`, escaleras | Sí (cotas enteras) | `levelsOf()` copia los datos de cada planta |
| Geometría para el render | `js/project-core.js` · `geometry(p)` (l. 268), `wallRect` (l. 260) | Tramos de muro con su `id`, `center`, `angle`, `spanMm`, `thickness`, `height`; huecos con `sill/head`; recintos con material | Derivada de forma determinista | **Única fuente de las piezas**: `inventory().pieces` copia sus tramos |
| Cubierta | `js/roof-core.js` · `deriveProject` (l. 152), `deriveBuilding` (l. 156), `footprint` (l. 80) | Envolvente superior **plana y conservadora**; exige fachada cerrada | Derivada; `status/reason` | Superficies copiadas; si no está disponible, no se dibuja |
| Fachada / interior | `js/exterior-core.js` · `derive` | `facade` / `interior` / `unavailable` por muro | Derivada de recintos | Color por defecto del visor y elegibilidad de la cubierta |
| Escala y medición | `scale.confidence` (`real`/`estimated`/`pending`), `calibration`, `verification` (`project-core.js` l. 152-180); `FloorPlanSurfaceMetrics.statusOfScale` (`js/surface-core.js` l. 15) | `real` exige verificación coherente y confirmación de la persona | Sí, con estados reales | `scaleEvidence()` no eleva nada: `real` y coherente → `verified`; `estimated` → `estimated`; resto → `pending` |
| Procedencia del elemento | `source.method` (`template`/`manual`/`imported`/`suggested`) + `source.review` (`unreviewed`/`confirmed`) | Opcional por elemento | Sí | Sin `source` o sin confirmar → `pending`; plantilla confirmada → `estimated` |
| Ciclo de vida (reforma) | `wall.status` `existing`/`new`/`demolished` | Por muro; los huecos heredan el estado del muro anfitrión; **los recintos no tienen estado** | Sí (declarado) | Preexistente / nuevo / demolido en el timelapse |
| Materiales | `materials[]` (categorías `floor` y `wall`, color); `wall.surfaceMaterialId`, `room.floorMaterialId` | Un único acabado por muro; no hay capas | Declarado | Color final del elemento; si falta, color por defecto **del visor**, con la etiqueta `viewer-default` |
| Mediciones 7A | `js/quantity-core.js` · `wall/room/level/home` (l. 148) | Cantidades con `status` measured/estimated/unavailable | Hereda la escala | A través del presupuesto (`quantityFrom7A`) |
| Presupuesto C1–C4 | `js/budget-core.js` (`calculateBudget`, `markReviewed`); `js/budget-draft-core.js` · `draft(project)` | Partidas **agregadas por tipo** (`floor:<mat>`, `skirting`, `paint`, `partition-new`, `demolition`, `opening:<kind>`) con cantidad 7A y precio de tarifa del profesional | Precio con fuente, fecha y revisión; cantidad con su estado | `Schedule.budgetReport` reparte partidas entre tareas |
| Selección del presupuesto | `js/budget-ui.js` l. 5-31: `localStorage['rubik-budget-v1'][projectId]`; id `bud_<projectId>`; sujeto `{type:'project',id}` | Uno por **proyecto de planta** | El sujeto sí; **la revisión del proyecto no** | Se exige que el sujeto sea el mismo proyecto; la coincidencia de revisión es «no verificable» |
| Biblioteca y proyecto activo | `js/project-library.js` (`rubik-sota-project-library-v1`); `index.html` `commit()` l. 1088 (valida, actualiza `updatedAt` y guarda en cada cambio válido) | Entrada = proyecto o edificio + planta activa | — | FT3D-8 recibe un documento explícito; no lee la biblioteca |
| Revisión del documento | No hay campo de revisión. Huella = `FloorPlanBuilding.sha256(FloorPlanBuilding.canonical(doc))` (l. 211-212) | SHA-256 de la forma canónica | Sí, reproducible | `fingerprint()`; cualquier cambio, incluido `updatedAt`, invalida |
| Snapshots de entrega | `js/brand-core.js` · `snapshot` (l. 64) congela la marca; las plantillas de presentación y `client-share-ui.js` usan esa instantánea. Entregas (PR #166) no está en `master` | — | — | FT3D-8 propone su propio paquete con huellas (fase E) |
| Visor 3D del editor | `index.html` (módulo inline): `wallBox` l. 3296, montaje l. 3496-3560, cubierta l. 3446, forjados `levelSlab` l. 3592; API `window.View3D` l. 4880 | Mallas internas; `userData.wallId` en cada tramo | No hay API de mallas | Referencia visual y estructural de solo lectura (fase D) |

## 2. Flujo real del proyecto activo

```
Biblioteca (localStorage, rubik-sota-project-library-v1)
  └─ entrada activa: FloorPlanProjectV1  |  {kind:'building', building, activeLevelId}
       └─ editor: `project` = proyecto de la planta activa (FloorPlanApp.project, entryId)
            └─ cada cambio válido → commit(): Core.validate + updatedAt + save()   (no hay cambios pendientes de guardar en el modelo)
                 └─ Core.geometry(project) → 2D y 3D (View3D)
                      └─ presentaciones/plantillas → marca congelada con FloorPlanBrand.snapshot
                           └─ Entregas (PR #166, fuera de master): pendiente de coordinar
```

- **Proyecto visible en el editor y proyecto guardado coinciden** tras cada `commit()`. Solo un fallo de `save()` (cuota de `localStorage`) los separa, y el editor lo comunica con un aviso.
- **Edificio:** el editor trabaja sobre la planta activa (`FloorPlanApp.levelContext`). El presupuesto se guarda por **proyecto de planta**, no por edificio.
- **Autoridad propuesta para FT3D-8:** un documento explícito (proyecto o edificio exportado, o leído de la biblioteca en una integración futura) más su huella SHA-256. **Detección de obsolescencia:** se compara la huella aprobada en el vínculo con la huella actual.

## 3. Geometría y evidencia por categoría

| Categoría | ID de origen | Planta | Geometría disponible | Unidades | Material | Procedencia / medición | 3D en el editor | FT3D-8 |
|---|---|---|---|---|---|---|---|---|
| Muro | `wal_*` | proyecto de la planta | eje, grosor, altura; tramos por hueco (`geometry().walls`) | mm | `surfaceMaterialId` (una sola cara/acabado) o ninguno | `source`, escala | cajas por tramo; las demolidas no se dibujan | sí, con las mismas reglas |
| Hueco / ventana | `opn_*` (`kind` window) | ídem | desplazamiento, ancho, alto, antepecho; dintel = antepecho + alto | mm | ninguno (color del visor) | `source` | vidrio + montantes | sí |
| Puerta | `opn_*` (door) | ídem | hoja, bisagra, giro, `isEntrance` | mm | ninguno (color del visor) | `source` | hoja abierta | sí, con bisagra comprobada |
| Corredera | `opn_*` (sliding-door) | ídem | ancho y alto | mm | ninguno | `source` | 2 hojas de vidrio | sí |
| Suelo (recinto) | `rom_*` | ídem | polígono | mm | `floorMaterialId` | `source`; **sin ciclo de vida** | ShapeGeometry | sí; ciclo `undeclared` |
| Forjado entre plantas | derivado (`slabThicknessMm` de la planta) | planta superior | recintos de la planta × grosor | mm | ninguno | escala de la planta | ExtrudeGeometry (`levelSlab`) | sí (`<lvl>/slab`); con escaleras que llegan → no representable |
| Cubierta | derivada (`FloorPlanRoof`) | planta | polígonos planos a la altura máxima | mm | ninguno (`#c9c1b3` del visor) | derivada de las fachadas | oculta por defecto (`opt.roof=false`) | sí (`<lvl>/roof`) |
| Escalera | `str_*` (edificio) | entre plantas | huella recta | mm | ninguno | — | sí | **no** (pendiente; se lista) |
| Mobiliario | `obj_*` | planta | caja orientada | mm | color | — | sí | excluido (no es obra) |
| Cimentación, excavación, estructura, capas, cubierta inclinada, medios auxiliares | **no existen** | — | — | — | — | — | — | listados en `NOT_IN_AUTHORITY`; nunca se dibujan |

**Estados de evidencia** (`FloorPlanConstructionProject.scaleEvidence/sourceEvidence`; siempre se aplica el peor de escala y origen):
1. **Verificado**: escala `real`, verificación `consistent`, `confirmedByUser`, y elemento confirmado por una persona (`manual` o `imported`).
2. **Estimado**: escala `estimated`, o elemento de plantilla confirmado.
3. **Pendiente**: escala `pending`, origen ausente, sin confirmar o `suggested`.
4. **No disponible**: no hay geometría (cubierta no derivable, categorías no modeladas).

Un elemento almacenado **no** se considera verificado por el mero hecho de existir.

## 4. Renderer

- El editor **no expone las mallas** de forma pública. `View3D` ofrece en solo lectura `doorLeaves`, `roofInfo`, `levelInspect`, `exteriorVolumeInfo`, `presentationPose` y `presentationRevealInfo` (este último solo con `{wallId, face}`).
- Un muro genera **varias mallas**: tramos macizos, antepecho y dintel por hueco y, en modo recorrido, aristas y rodapié. La cubierta puede tener **varias superficies** (en el edificio B salen 15 polígonos expuestos). No hay correspondencia uno a uno entre elemento y malla.
- **Bloqueador**: no existe un contrato estable `elemento → mallas` reutilizable desde una página aislada. FT3D-8 **no calcula geometría**: toma `Core.geometry`, `FloorPlanRoof` y `FloorPlanBuilding` y replica únicamente el **montaje** de mallas del editor (cajas, vidrio, hojas, ShapeGeometry y extrusión de forjado) para poder compararlo desde la misma cámara. Contrato mínimo propuesto (coordinar con Kimi y con quien sea propietario del visor): exportar desde el visor un `buildArchitecture(project, levelContext) → Map<elementKey, Object3D[]>` puro, o un `View3D.archInspect()` de solo lectura con las cajas por `wallId/openingId/roomId`.

## 5. Obra nueva y reforma

- RUBIK distingue **muros existentes, nuevos y demolidos** (`wall.status`). Los huecos heredan el estado del muro que los aloja.
- **No distingue «conservado» de «existente»**, no tiene fases de obra y **los recintos no tienen estado**.
- **Regla de FT3D-8:** una reforma arranca con el edificio existente en pie. Lo existente sin tarea es preexistente; lo demolido se ve hasta que termina su tarea de demolición; lo nuevo sin tarea aparece como contorno pendiente, nunca con una fecha inventada.

## 6. Varias plantas

- `FloorPlanBuildingV1` admite **como máximo 2 plantas** y 4 escaleras rectas. La planta 0 define el marco de coordenadas; las superiores declaran elevación, forjado y desplazamiento.
- Cada planta es un proyecto 1.x completo y no hay revisión por planta: la huella es la del edificio entero.
- **Límites:** las escaleras no se representan aún en FT3D-8, y los huecos de escalera en el forjado dejan ese forjado como no representable. No se promete soporte de edificios arbitrarios.

## 7. Economía

- **Selección:** `rubik-budget-v1[projectId]` en el navegador. El ID es `bud_<projectId>`, el sujeto `{type:'project', id}`, y los capítulos son `floors`, `walls`, `partitions` y `carpentry`.
- **Partidas:** cantidad 7A (`quantity.source.engine='FloorPlanQuantities'` con `ref`) y precio de la tarifa del estudio o de una referencia BC3, con fuente y fecha. Una revisión solo vale para la cantidad sobre la que se hizo.
- **Partidas sin precio:** `unitPrice:null`, que el informe trata como desconocido, nunca como 0.
- **Limitaciones:**
  - Las partidas están **agregadas por tipo**: no se puede atribuir un importe a un muro concreto.
  - **No existe presupuesto de edificio**: hay uno por planta.
  - **El presupuesto no declara la revisión del proyecto.** FT3D-8 lo muestra como «no verificable por C1–C4». Solo un vínculo revisado por el profesional, con huellas vigentes, cuenta como **emparejamiento declarado**, y se presenta como tal, nunca como verificado.

## 8. Planificación

- FT3D-8 0.2.0 valida tareas, fechas y dependencias FS/SS/FF/SF con desfase y revisión. Los vínculos con elementos viven en `task.elements` mediante la clave `<planta|project>/<id>`.
- **Sin plan aportado por un profesional → «PLANIFICACIÓN NO DISPONIBLE O PENDIENTE».** No se infiere nada de la superficie, la tipología, el precio, las habitaciones ni el número de plantas (caso D).

## 9. Diferencias entre proyecto, visor y presupuesto

| Aspecto | Proyecto | Visor del editor | Presupuesto |
|---|---|---|---|
| Muros demolidos | sí, con `status` | no se dibujan | partida `demolition` (superficie) |
| Cubierta | no existe | derivada, oculta por defecto | no hay partida |
| Forjado | grosor declarado | extruido | no hay partida |
| Material ausente | ninguno | `#f4f1eb` / `#d9cbbb` (fachada), con remate superior oscuro | — |
| Unidad de coste | — | — | agregada por tipo y material |
| Revisión | `updatedAt` (sin revisión) | — | sin referencia a la revisión del proyecto |

## 10. Riesgos para una entrega al cliente

1. Confundir el color por defecto del visor con un material del proyecto. *Mitigación:* `material.source='viewer-default'` y leyenda en pantalla.
2. Tomar la cubierta plana derivada por la cubierta real. *Mitigación:* se etiqueta como «envolvente superior derivada» y se lista `pitched-roof-covering` como no modelada.
3. Leer los importes agregados como coste por elemento. *Mitigación:* los costes son siempre por tarea y por partida, nunca por pieza.
4. Pensar que en un edificio hay un presupuesto común a todas las plantas. *Mitigación:* el estado es `building-budget-not-supported` y no se toma prestado el de una planta.
5. Usar un plan con la revisión del proyecto obsoleta. *Mitigación:* el plan pasa a obsoleto y la entrega se bloquea.
6. Que el visor del editor cambie (Kimi) y FT3D-8 deje de coincidir con él. *Mitigación:* la prueba `tests/ft3d-8-fidelity.browser.test.cjs` lo compara con el editor real en cada ejecución de la CI.

## 11. Dependencias con otros agentes

- **Kimi (fidelidad visual / visor):** contrato de mallas por elemento y reglas de materiales del visor. Cualquier cambio en `wallBox`, cubierta o forjado debe reflejarse en `labs/ft3d-8/project-scene.js`, o mejor, sustituirse por el contrato exportado.
- **Claude original (Entregas, PR #166):** snapshot de entrega (proyecto, plan, presupuesto y marca) y enlace compartible.
- **ChatGPT (auditoría y aceptación):** revisión de este informe y de la matriz de 27 puntos.
- **Propietario:** revisión visual en la Preview y aprobación de la integración.
