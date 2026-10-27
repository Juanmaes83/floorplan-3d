# FloorPlanBuildingV1 — edificio de varias plantas (primer corte)

## Ampliación 1.1.0 — orientación y ubicación compartidas

Se aceptan 1.0.0 y 1.1.0; otras versiones de edificio se rechazan. La edición explícita de `site` eleva a 1.1.0. `site` es opcional y reutiliza exactamente la definición del proyecto 1.7.0: norte lógico, ubicación IANA y procedencia. La raíz es autoridad para todas las plantas, incluso cuando el campo está ausente. Se conservan sin reescribir los proyectos incrustados, que ahora admiten versiones conocidas 1.0.0–1.7.0. Crear un edificio desde una planta configurada copia `site` a la raíz. Exportar una planta escribe en la copia standalone el `site` compartido (1.7.0 si procede); al no existir configuración compartida, no reaparece una configuración divergente de la planta. JSON/ZIP, copias y variantes conservan estos datos internos. Abrir un edificio antiguo no lo migra ni inventa datos.

**Estado:** contrato del primer corte multipiso, implementado en esta PR (apilada sobre #50) y **pendiente de aceptación**. Juanma eligió la opción D de [#50](../technical/multilevel-contract-gate0-2026-10-17.md) el 18-10-2026. No modifica [FloorPlanProjectV1](FloorPlanProjectV1.md) ni su schema: cada planta sigue siendo un proyecto 1.x válido. Rubik es una herramienta de **propuesta y comunicación**; nada de este documento acredita precisión profesional, documentación técnica, BIM ni cumplimiento normativo o estructural.

**Artefactos:**

- [`FloorPlanBuildingV1.schema.json`](FloorPlanBuildingV1.schema.json);
- [ejemplo sintético asimétrico](examples/floorplan-building-v1.example.json), generado con `tests/fixtures/building-fixture.cjs`;
- validador de referencia: `js/building-core.js`;
- pruebas: `tests/building.test.cjs` y `tests/building_schema.test.py`.

## 1. Documento

| Campo | Regla |
| --- | --- |
| `schema` | `"rubik-sota.floorplan-building"`. |
| `schemaVersion` | `"1.0.0"` o `"1.1.0"` (esta última permite `site`). Otras versiones se rechazan, incluidos minors futuros. |
| `id` | `bld_` más el sufijo del contrato 1.x. Estable: no se regenera al editar, guardar, exportar ni importar. Duplicar o crear una variante genera otro. |
| `name`, `createdAt`, `updatedAt`, `units` | Nombre de 1–200 caracteres; fechas UTC; `updatedAt ≥ createdAt`; `units: "mm"`. |
| `levels` | De 1 a **2** plantas en este corte. |
| `stairs` | De 0 a 4 escaleras rectas. |

No se admite ningún campo adicional, ni en el documento ni en las plantas ni en las escaleras.

## 2. Plantas y marco del edificio

Cada planta tiene `id` (`lvl_`), `name` (1–80), `order`, `elevationMm`, `slabThicknessMm`, `offsetMm` y `project`.

- **Orden:** `order` es igual a su posición en `levels` (0, 1).
- **Marco del edificio:** el de la planta 0. Por eso la planta 0 tiene `elevationMm` 0, `slabThicknessMm` 0 y `offsetMm` {0,0}.
- **Alineación:** un punto `(x, y)` del proyecto de la planta n está en `(x + offsetMm.x, y + offsetMm.y)` del edificio. Son mm enteros dentro de ±1 000 000, y no hay rotación en este corte.
- **Elevación:** `elevationMm` es el nivel de suelo terminado, entero de 0 a 100 000 y estrictamente creciente. El forjado visual de la planta n ocupa de `elevation − slabThicknessMm` a `elevation`, y su cara inferior tiene que quedar por encima del suelo de la planta inferior.
- **`project`:** un `FloorPlanProjectV1` completo e **independiente**, con su propia imagen, escala, calibración, materiales, objetos, cotas y huecos. La pertenencia de muros, estancias, objetos y cotas es la del proyecto que los contiene; los huecos siguen ligados a su `wallId`. Ningún campo de nivel se añade a `FloorPlanProjectV1`.

### 2.1 Perfil estricto de los proyectos incrustados

Los proyectos incrustados se validan con más rigor que un archivo 1.x suelto:

- `schemaVersion` debe ser **1.0.0–1.7.0**, las versiones que este lector conoce.
- Se valida con `FloorPlanCore.validate(project, {strict: true})`: cualquier campo no definido en el schema 1.x es un error. Por compatibilidad, un 1.x suelto de versión posterior a 1.0.0 conserva campos desconocidos; aquí no, para impedir que `levels[]`, `levelId` u otro dato multipiso viaje oculto dentro de una planta.
- En `extensions` (`x-*`) se rechaza cualquier clave, a cualquier profundidad, que nombre plantas, niveles, escaleras o edificio.
- Un edificio no puede incrustarse dentro de otro.
- `project.id` es único entre plantas, y también los IDs de `sourceImages`, porque el almacén local de imágenes se indexa por referencia.

## 3. Escaleras rectas

`{id: "str_…", kind: "straight", fromLevelId, toLevelId, startMm, rotationDeg, widthMm, runLengthMm, risers}`

- `fromLevelId` y `toLevelId` deben existir. `to.order = from.order + 1`: plantas contiguas y siempre hacia arriba. Una referencia rota es un error explícito.
- `startMm` es el centro del borde del primer peldaño, en el marco del edificio. `rotationDeg` (0–359) es el sentido de subida, horario en planta, como en el contrato 1.x.
- Dimensiones: `widthMm` 300–5000, `runLengthMm` 500–20 000 y `risers` 2–40.
- La **huella** es el rectángulo de ancho `widthMm` y longitud `runLengthMm` desde `startMm` en el sentido de subida.
- **Valores derivados que sólo se muestran:**
  - desnivel: `elevation[to] − elevation[from]`;
  - contrahuella: desnivel / `risers`;
  - huella de peldaño: `runLengthMm` / `risers`.

  **No se validan contra ninguna normativa.**
- **Hueco del forjado:** la huella de cada escalera que llega a una planta, trasladada a su marco local (`FloorPlanBuilding.slabVoids`). El 3D descuenta ese hueco del suelo de la planta superior y del techo de la inferior.

## 4. Reglas

**Errores:** todo lo indicado en las §1–§3. El error indica la ruta, el documento no se modifica, y un error en el proyecto incrustado se informa con la ruta de su planta.

**Avisos.** Son orientativos y nunca bloquean:

| Código | Aviso |
| --- | --- |
| BW1 | La huella de la escalera no queda dentro de las estancias de la planta de salida o de llegada. |
| BW2 | Un muro de la planta n supera la altura libre bajo el forjado de la planta n+1. |
| BW3 | Las plantas tienen distinta confianza de escala, o alguna no está confirmada. Las distancias en mm son nominales y su confianza física difiere. |
| BW4 | Un muro de la planta superior no tiene un muro de la planta inferior debajo (a ≤ grosor/2 + 20 mm en sus extremos y su punto medio). Es una comprobación de **coherencia visual de la alineación**, no un dictamen estructural. |
| BW5 | Un mueble pisa la huella de una escalera que sale de su planta o el hueco de una que llega a ella. Ver §4.1. Es **coherencia del dibujo**, no una comprobación normativa ni de paso. |

### 4.1 BW5: mueble sobre una escalera o su hueco

- **Qué se compara:** cada mueble de una planta con las escaleras que **salen** de ella (su huella) o **llegan** a ella (el hueco del forjado), en el marco local de esa planta. Un mueble nunca se compara con escaleras de otra planta, aunque coincidan sus coordenadas locales.
- **Huellas:** el rectángulo girado del mueble (`position`, `size.widthMm` × `size.depthMm`, `rotationDeg` horario), nunca su rectángulo envolvente, y la huella de §3.
- **Regla:** hay conflicto cuando la penetración por ejes separadores entre las dos huellas supera **`CONTACT_TOLERANCE_MM` = 1 mm**.
  - Compartir un borde o tocar una esquina (penetración 0) es contacto, no conflicto.
  - También lo es un solape de 1 mm o menos, debido al redondeo.
  - Un mueble sin geometría finita no se evalúa; el estado del edificio pasa a «evidencia insuficiente» (ver más abajo).
- **Aviso:** `{code: "BW5", path: "/levels/<levelId>/objects/<objectId>", level, objectId, stairId, message, evidence}`.
  - `evidence` contiene `rule`, `zone` (`escalera` o `hueco`), `penetrationMm`, `overlapAreaMm2`, el polígono compartido `overlap`, `footprint` del mueble y `stairPolygon`.
  - Es un dato **derivado**: no se guarda en el documento, no cambia la versión ni la estructura y nunca impide validar, guardar, importar ni exportar.
- **Implementación de referencia:** `FloorPlanBuilding.stairConflicts`. La usan el aviso, el resaltado 2D, el formulario de escalera y la revisión de distribución; esta última recibe los conflictos ya calculados y no repite la geometría.
- **Correspondencia con el 3D:** la huella de §3 es la que el 3D construye. Los peldaños parten de `startMm` en el sentido de subida, con `widthMm` de ancho, y el hueco del forjado se recorta con el mismo polígono. Los muebles se colocan en `position` con el mismo giro. `tests/stair-conflicts.browser.test.cjs` compara las esquinas de la escalera construida y la pose 3D del mueble con la evidencia de BW5, con un margen de 1 mm.
- **Estado del edificio (`FloorPlanBuilding.buildingStatus`):** dato derivado y global, calculado para todas las plantas:
  - `clear`: se han evaluado todos los muebles y ninguno pisa una escalera;
  - `pending`: hay al menos un BW5 («N conflictos en N plantas: distribución pendiente»);
  - `insufficient`: no hay conflictos, pero algún mueble no se pudo evaluar, así que no se afirma que la distribución esté libre.

  Cada conflicto incluye un resumen legible del tipo «Planta baja: «Sofá» sobre los peldaños 1 · 800 mm (escala pendiente: medida nominal)». Con escala estimada o pendiente, los milímetros son nominales.

## 5. Migración y exportación de una planta

- **1.x → edificio:** `create(project)` copia el proyecto sin cambios como planta 0. En la app se crea **una entrada nueva**, así que el proyecto 1.x original no se modifica.
- **Edificio → 1.x («Exportar esta planta»):** devuelve el proyecto de esa planta con la configuración `site` compartida, si existe; su geometría no cambia. Es estrictamente válido y lo aceptan el exportador Blender, el MCP y la app. Siempre se acompaña de un aviso de lo que omite: las otras plantas, la elevación, el desplazamiento y las escaleras. Sin `site`, la ida y vuelta de una sola planta conserva el proyecto original sin modificaciones.
- **Lector 1.x:** `FloorPlanCore.validate` rechaza un edificio con un mensaje explícito. Por tanto lo rechazan también el MCP, el exportador Blender, la importación de proyectos 1.x y el ZIP 1.x. Ninguno lo aplana.

## 6. JSON y ZIP

**JSON:** el documento canónico, con los proyectos incrustados.

**ZIP del edificio:**

| Entrada | Contenido |
| --- | --- |
| `building.json` | El edificio. Cada imagen usa la referencia 1.x `sidecar-file` `images/<imageId>.<ext>`. |
| `manifest.json` | `{format: "rubik-sota.floorplan-building-package", version: 1, buildingId, images: [{levelId, sourceImageId, entry, sha256, bytes, mediaType}]}` |
| `levels/<levelId>/images/<imageId>.<ext>` | Bytes originales. La ruta es la referencia de la planta con el prefijo de su nivel, así que dos plantas nunca colisionan y la resolución es exacta. No hay deduplicación entre plantas. |

Antes de aplicar nada se comprueba:

- rutas permitidas, sin `..` ni nombres ajenos;
- un máximo de 42 entradas, con los límites de tamaño del ZIP 1.x;
- validez de `building.json`;
- que el manifiesto pertenece a este edificio y coincide imagen por imagen;
- longitud, SHA-256, tipo y dimensiones de cada imagen;
- que no haya entradas sobrantes ni faltantes.

Un archivo incompleto o manipulado se rechaza sin tocar el proyecto abierto. El ZIP de proyecto 1.x no cambia.

## 7. Fuera de este corte

Recorrido que sube escaleras, exterior, fachada y cubierta, más de dos plantas, escaleras en L, U o de caracol, rotación entre plantas, IFC multiplanta completo, GLB del edificio completo y herramientas MCP de edificio. Cada uno requiere su propio corte.
