# Biblioteca visual de superficies — 50 acabados, integrada y aprobada

Entrega autorizada y acotada: superficies; no añade puertas, ventanas, muebles ni conectores. No completa F2: cinco sesiones y veinte planos siguen pendientes.

## Base y auditoría previa

- Checkout `/workspace/floorplan-3d`, inicialmente limpio en `docs/roadmap-2-evolution` @ `4fd0654`. Se conserva esa rama. Nueva rama única `feat/surface-material-library`, sin worktree.
- Base remota `5e5e0dc42b8669e7afcb121851f2901d2930a260`. Historia Git y HTML público de GitHub: PR #3 MERGED en ese SHA, PR #15 MERGED en `4ab39025379cbbb8873dd344183967aafa0a1bdc`. PR abiertas al comenzar: #1/#2; no hay entrega duplicada.
- Se leyeron README, roadmap, workflow, contrato/schema, selección/render de materiales y los informes F3. Antes: ocho presets de suelo, `floorMaterialId` persistente, pared uniforme; categoría `wall` sin asignación ni UI. 2D/3D usaban la misma geometría. F3 conserva sus presupuestos propios; no se convierten en presupuesto global de superficies.
- Las menciones obsoletas de #3/#15 se corrigen en documentos vigentes; sus registros de consultas previas permanecen fechados y explícitamente históricos. Integración documental no significa aprobación global de F0 o Roadmap 2.

## Fuentes, selección y derechos

Consulta: **01-10-2026**. Método de investigación: GET HTTPS mediante Python urllib en GitHub/raw.githubusercontent.com; inspección visual de mapas descargados con Pillow y visor de imágenes. No se atribuye acceso a páginas bloqueadas ni a apps externas.

Las páginas y API de Poly Haven, ambientCG y sus descargas originales devolvieron `Tunnel connection failed: 403 Forbidden`. También se probaron cgbookcase.com, 3dtextures.me, sharetextures.com, cc0-textures.com, textures.pixel-furnace.com y polyscann.com, bloqueados por el mismo mecanismo. No se cambió la red ni se eludió acceso. Se siguió investigando bibliotecas/autorías accesibles.

La cadena incorporada es **Poly Haven → biblioteca Modelibr CC0 Public Domain Textures → mapa PNG de albedo plano → WebP local**. La biblioteca es un distribuidor adicional, no el sitio original de Poly Haven. Sus ficheros `*_albedo_preview.png` son derivados planos del canal Albedo, identificados como `Texture:Albedo`; el script publicado genera esos PNG desde el mapa original. No se utilizan `_preview.png` de esfera, covers, capturas de sitios ni fotografías editoriales. La resolución de 256 px limita el detalle al acercarse.

La licencia se contrasta en dos fuentes independientes y fijadas por commit:
- [Poly Haven — Asset License, fuente oficial del texto](https://github.com/Poly-Haven/polyhaven.com/blob/b1a6aa13afc03ae00860f6ac5fe6d5daf8e95356/public/locales/en/license.json): `p1` autoría del equipo/artistas cedentes, `p2` todos los assets CC0, `p5l3` redistribución/comercial. [Fuente que muestra ese texto en /license](https://github.com/Poly-Haven/polyhaven.com/blob/b1a6aa13afc03ae00860f6ac5fe6d5daf8e95356/pages/license.tsx). Es licencia de assets, **no** la licencia del código del sitio.
- [Biblioteca — LICENSE CC0](https://github.com/Papyszoo/CC0-Public-Domain-Textures/blob/fcc4ff97a5a843dc2e242ec9e195389bc46ed7d2/LICENSE), [pack Poly Haven](https://github.com/Papyszoo/CC0-Public-Domain-Textures/blob/fcc4ff97a5a843dc2e242ec9e195389bc46ed7d2/packs/polyhaven-textures/pack.json) y [transformación del albedo](https://github.com/Papyszoo/CC0-Public-Domain-Textures/blob/fcc4ff97a5a843dc2e242ec9e195389bc46ed7d2/scripts/convert-to-ktx2.mjs). Cada entrada conserva asset original, distribución, licencia, consulta, hash y peso.

Copias de evidencia bajo `assets/materials/licenses/`. Atribución voluntaria a Poly Haven y al distribuidor, visible en selector; artista individual no consta en el manifest y no se inventa. CC0 permite redistribuir optimizaciones y servirlas desde la app. No se asigna esta licencia al código del proyecto ni a IKEA/Asset Lab. No se verificaron los masters 1K/4K ni medidas físicas porque el origen original sigue bloqueado.

Warfork **no es la fuente final**. Se evaluaron por fichero licencias CC0/CC BY-SA, formato y apariencia; se excluyeron atlas, colores planos y KTX ETC1 no soportados por el procesado disponible. La selección provisional se retiró íntegramente en favor de superficies más apropiadas; no se contabiliza ni se afirma que pasara QA Rubik. [Registro de los 12 candidatos provisionales](surface-warfork-candidates.json). WRAD tenía CC0 y archivos accesibles, pero predominaban acabados retro/grunge; BabylonJS tenía CC BY con excepciones por carpeta, NVIDIA licencia de imágenes separada, PolyScann descargas bloqueadas y otros repos solo enlaces/torrents. Ninguno se incorporó por aparecer en una lista.

## Inventario incorporado

**50 gráficos diferentes: diez por cada familia.** Se decodificaron todos; sus hashes son únicos. La tabla resume el recurso de runtime. El [manifest](../../assets/materials/catalog.json) registra por entrada el fichero PNG descargado, formato/resolución/bytes/hash de origen y de cada WebP, URL original y distribuidor, autor y licencia. El [resultado por material en Rubik](../qa/artifacts/surface-library/per-material-render-results.json) añade estado, tiempo, memoria y prueba real; no basta una ficha de catálogo.

| Familia | Nombre / asset | Aplicación | Mapa local | Resolución | Mapa + muestra, bytes | GPU estimada, bytes | Fuente original |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Madera | Tablón de madera natural · `wood_floor` | suelo/pared | `assets/materials/wood-floor.webp` | 256×256 WebP | 6826 | 349526 | [Poly Haven](https://polyhaven.com/a/wood_floor) |
| Madera | Parqué en espiga · `herringbone_parquet` | suelo/pared | `assets/materials/herringbone-parquet.webp` | 256×256 WebP | 12996 | 349526 | [Poly Haven](https://polyhaven.com/a/herringbone_parquet) |
| Madera | Parqué diagonal · `diagonal_parquet` | suelo/pared | `assets/materials/diagonal-parquet.webp` | 256×256 WebP | 13320 | 349526 | [Poly Haven](https://polyhaven.com/a/diagonal_parquet) |
| Madera | Parqué rectangular · `rectangular_parquet` | suelo/pared | `assets/materials/rectangular-parquet.webp` | 256×256 WebP | 8018 | 349526 | [Poly Haven](https://polyhaven.com/a/rectangular_parquet) |
| Madera | Tablones de roble · `oak_wood_planks` | suelo/pared | `assets/materials/oak-wood-planks.webp` | 256×256 WebP | 8670 | 349526 | [Poly Haven](https://polyhaven.com/a/oak_wood_planks) |
| Madera | Suelo de madera envejecida · `old_wood_floor` | suelo/pared | `assets/materials/old-wood-floor.webp` | 256×256 WebP | 11094 | 349526 | [Poly Haven](https://polyhaven.com/a/old_wood_floor) |
| Madera | Madera con desgaste · `wood_floor_worn` | suelo/pared | `assets/materials/wood-floor-worn.webp` | 256×256 WebP | 9058 | 349526 | [Poly Haven](https://polyhaven.com/a/wood_floor_worn) |
| Madera | Tarima de madera · `wood_floor_deck` | suelo/pared | `assets/materials/wood-floor-deck.webp` | 256×256 WebP | 18116 | 349526 | [Poly Haven](https://polyhaven.com/a/wood_floor_deck) |
| Madera | Madera de veta abierta · `wood_planks` | suelo/pared | `assets/materials/wood-planks.webp` | 256×256 WebP | 7660 | 349526 | [Poly Haven](https://polyhaven.com/a/wood_planks) |
| Madera | Tablón gris rústico · `wood_planks_grey` | suelo/pared | `assets/materials/wood-planks-grey.webp` | 256×256 WebP | 11404 | 349526 | [Poly Haven](https://polyhaven.com/a/wood_planks_grey) |
| Cerámica | Mosaico cerámico ajedrezado · `square_tiles` | suelo/pared | `assets/materials/square-tiles.webp` | 256×256 WebP | 12218 | 349526 | [Poly Haven](https://polyhaven.com/a/square_tiles) |
| Cerámica | Baldosas marrones · `brown_floor_tiles` | suelo/pared | `assets/materials/brown-floor-tiles.webp` | 256×256 WebP | 9838 | 349526 | [Poly Haven](https://polyhaven.com/a/brown_floor_tiles) |
| Cerámica | Cerámica de trama fina · `floor_tiles_02` | suelo/pared | `assets/materials/floor-tiles-02.webp` | 256×256 WebP | 7806 | 349526 | [Poly Haven](https://polyhaven.com/a/floor_tiles_02) |
| Cerámica | Baldosas geométricas · `floor_tiles_04` | suelo/pared | `assets/materials/floor-tiles-04.webp` | 256×256 WebP | 4514 | 349526 | [Poly Haven](https://polyhaven.com/a/floor_tiles_04) |
| Cerámica | Cerámica de junta marcada · `floor_tiles_06` | suelo/pared | `assets/materials/floor-tiles-06.webp` | 256×256 WebP | 10864 | 349526 | [Poly Haven](https://polyhaven.com/a/floor_tiles_06) |
| Cerámica | Baldosas de patrón alterno · `floor_tiles_08` | suelo/pared | `assets/materials/floor-tiles-08.webp` | 256×256 WebP | 7862 | 349526 | [Poly Haven](https://polyhaven.com/a/floor_tiles_08) |
| Cerámica | Cerámica de trama modular · `floor_tiles_09` | suelo/pared | `assets/materials/floor-tiles-09.webp` | 256×256 WebP | 17756 | 349526 | [Poly Haven](https://polyhaven.com/a/floor_tiles_09) |
| Cerámica | Baldosas de interior · `interior_tiles` | suelo/pared | `assets/materials/interior-tiles.webp` | 256×256 WebP | 10042 | 349526 | [Poly Haven](https://polyhaven.com/a/interior_tiles) |
| Cerámica | Baldosas de gran formato · `large_floor_tiles_02` | suelo/pared | `assets/materials/large-floor-tiles-02.webp` | 256×256 WebP | 16382 | 349526 | [Poly Haven](https://polyhaven.com/a/large_floor_tiles_02) |
| Cerámica | Azulejos blancos alargados · `long_white_tiles` | suelo/pared | `assets/materials/long-white-tiles.webp` | 256×256 WebP | 12146 | 349526 | [Poly Haven](https://polyhaven.com/a/long_white_tiles) |
| Piedra/mármol | Mármol de veta natural · `marble_01` | suelo/pared | `assets/materials/marble-01.webp` | 256×256 WebP | 4442 | 349526 | [Poly Haven](https://polyhaven.com/a/marble_01) |
| Piedra/mármol | Losas de mármol · `marble_tiles` | suelo/pared | `assets/materials/marble-tiles.webp` | 256×256 WebP | 33906 | 349526 | [Poly Haven](https://polyhaven.com/a/marble_tiles) |
| Piedra/mármol | Mosaico de mármol · `marble_mosaic_tiles` | suelo/pared | `assets/materials/marble-mosaic-tiles.webp` | 256×256 WebP | 27574 | 349526 | [Poly Haven](https://polyhaven.com/a/marble_mosaic_tiles) |
| Piedra/mármol | Suelo de pizarra · `slate_floor` | suelo/pared | `assets/materials/slate-floor.webp` | 256×256 WebP | 6262 | 349526 | [Poly Haven](https://polyhaven.com/a/slate_floor) |
| Piedra/mármol | Pizarra de bloques irregulares · `slate_floor_02` | suelo/pared | `assets/materials/slate-floor-02.webp` | 256×256 WebP | 7952 | 349526 | [Poly Haven](https://polyhaven.com/a/slate_floor_02) |
| Piedra/mármol | Pizarra de textura estratificada · `slate_floor_03` | suelo/pared | `assets/materials/slate-floor-03.webp` | 256×256 WebP | 10914 | 349526 | [Poly Haven](https://polyhaven.com/a/slate_floor_03) |
| Piedra/mármol | Losas de piedra · `stone_floor` | suelo/pared | `assets/materials/stone-floor.webp` | 256×256 WebP | 17048 | 349526 | [Poly Haven](https://polyhaven.com/a/stone_floor) |
| Piedra/mármol | Piedra de monasterio · `monastery_stone_floor` | suelo/pared | `assets/materials/monastery-stone-floor.webp` | 256×256 WebP | 14518 | 349526 | [Poly Haven](https://polyhaven.com/a/monastery_stone_floor) |
| Piedra/mármol | Baldosas de granito · `granite_tile_02` | suelo/pared | `assets/materials/granite-tile-02.webp` | 256×256 WebP | 5792 | 349526 | [Poly Haven](https://polyhaven.com/a/granite_tile_02) |
| Piedra/mármol | Mosaico de piedra mixta · `mixed_stone_tiles` | suelo/pared | `assets/materials/mixed-stone-tiles.webp` | 256×256 WebP | 26412 | 349526 | [Poly Haven](https://polyhaven.com/a/mixed_stone_tiles) |
| Cemento/terrazo | Hormigón cepillado · `brushed_concrete` | suelo/pared | `assets/materials/brushed-concrete.webp` | 256×256 WebP | 11514 | 349526 | [Poly Haven](https://polyhaven.com/a/brushed_concrete) |
| Cemento/terrazo | Cemento estriado · `brushed_concrete_03` | suelo/pared | `assets/materials/brushed-concrete-03.webp` | 256×256 WebP | 12928 | 349526 | [Poly Haven](https://polyhaven.com/a/brushed_concrete_03) |
| Cemento/terrazo | Hormigón de suelo · `concrete_floor_01` | suelo/pared | `assets/materials/concrete-floor-01.webp` | 256×256 WebP | 27342 | 349526 | [Poly Haven](https://polyhaven.com/a/concrete_floor_01) |
| Cemento/terrazo | Hormigón de grano fino · `concrete_floor_02` | suelo/pared | `assets/materials/concrete-floor-02.webp` | 256×256 WebP | 24690 | 349526 | [Poly Haven](https://polyhaven.com/a/concrete_floor_02) |
| Cemento/terrazo | Hormigón mineral · `concrete_floor_03` | suelo/pared | `assets/materials/concrete-floor-03.webp` | 256×256 WebP | 20786 | 349526 | [Poly Haven](https://polyhaven.com/a/concrete_floor_03) |
| Cemento/terrazo | Hormigón de acabado industrial · `hangar_concrete_floor` | suelo/pared | `assets/materials/hangar-concrete-floor.webp` | 256×256 WebP | 5586 | 349526 | [Poly Haven](https://polyhaven.com/a/hangar_concrete_floor) |
| Cemento/terrazo | Cemento liso · `smooth_concrete_floor` | suelo/pared | `assets/materials/smooth-concrete-floor.webp` | 256×256 WebP | 11546 | 349526 | [Poly Haven](https://polyhaven.com/a/smooth_concrete_floor) |
| Cemento/terrazo | Cemento desgastado · `scuffed_cement` | suelo/pared | `assets/materials/scuffed-cement.webp` | 256×256 WebP | 5600 | 349526 | [Poly Haven](https://polyhaven.com/a/scuffed_cement) |
| Cemento/terrazo | Terrazo de agregados · `terrazzo_tiles` | suelo/pared | `assets/materials/terrazzo-tiles.webp` | 256×256 WebP | 19594 | 349526 | [Poly Haven](https://polyhaven.com/a/terrazzo_tiles) |
| Cemento/terrazo | Hormigón granular · `granular_concrete` | suelo/pared | `assets/materials/granular-concrete.webp` | 256×256 WebP | 11980 | 349526 | [Poly Haven](https://polyhaven.com/a/granular_concrete) |
| Yeso/mural | Yeso blanco fino · `white_plaster_02` | pared | `assets/materials/white-plaster-02.webp` | 256×256 WebP | 8376 | 349526 | [Poly Haven](https://polyhaven.com/a/white_plaster_02) |
| Yeso/mural | Yeso gris mineral · `grey_plaster_03` | pared | `assets/materials/grey-plaster-03.webp` | 256×256 WebP | 8572 | 349526 | [Poly Haven](https://polyhaven.com/a/grey_plaster_03) |
| Yeso/mural | Yeso gris de grano visible · `grey_plaster_02` | pared | `assets/materials/grey-plaster-02.webp` | 256×256 WebP | 18530 | 349526 | [Poly Haven](https://polyhaven.com/a/grey_plaster_02) |
| Yeso/mural | Yeso pintado · `painted_plaster_wall` | pared | `assets/materials/painted-plaster-wall.webp` | 256×256 WebP | 3494 | 349526 | [Poly Haven](https://polyhaven.com/a/painted_plaster_wall) |
| Yeso/mural | Yeso de trama decorativa · `patterned_plaster_wall` | pared | `assets/materials/patterned-plaster-wall.webp` | 256×256 WebP | 21542 | 349526 | [Poly Haven](https://polyhaven.com/a/patterned_plaster_wall) |
| Yeso/mural | Revoco mate artesanal · `plastered_wall_03` | pared | `assets/materials/plastered-wall-03.webp` | 256×256 WebP | 5534 | 349526 | [Poly Haven](https://polyhaven.com/a/plastered_wall_03) |
| Yeso/mural | Revoco gris liso · `plastered_wall_04` | pared | `assets/materials/plastered-wall-04.webp` | 256×256 WebP | 1236 | 349526 | [Poly Haven](https://polyhaven.com/a/plastered_wall_04) |
| Yeso/mural | Revoco azul · `blue_plaster_wall` | pared | `assets/materials/blue-plaster-wall.webp` | 256×256 WebP | 3388 | 349526 | [Poly Haven](https://polyhaven.com/a/blue_plaster_wall) |
| Yeso/mural | Revoco amarillo · `yellow_plaster` | pared | `assets/materials/yellow-plaster.webp` | 256×256 WebP | 7822 | 349526 | [Poly Haven](https://polyhaven.com/a/yellow_plaster) |
| Yeso/mural | Arcilla de trama decorativa · `patterned_clay_plaster` | pared | `assets/materials/patterned-clay-plaster.webp` | 256×256 WebP | 8690 | 349526 | [Poly Haven](https://polyhaven.com/a/patterned_clay_plaster) |

Total integrado **610,160 bytes** (mapas y muestras); **50 mapas baseColor** + 50 muestras de 112 px. Todos CC0-1.0. Sin normal/roughness/height/displacement descargados, sin cambios de geometría. Roughness es un valor escalar de diseño, no medición del producto.

La evaluación visual rechazó `clay_plaster`, `white_stucco`, `plastered_wall_02` por contraste casi plano en el albedo reducido; rechazó `blue_floor_tiles_01` y `white_plaster_rough_01` por musgo/deterioro, y `rough_plaster_03` por desconchado. Se sustituyeron por mapas de trama o revocos más apropiados sin bajar la comprobación. [Candidatos, incluidos rechazados y bloqueos](surface-candidate-evaluation.json). La inspección de Codex no sustituye la aprobación estética de Juanma.

## Uso y compatibilidad

1. Seleccionar estancia → **Biblioteca de acabados · suelo**. Buscar por nombre/término y filtrar familia; las cinco aparecen. La familia mural no ofrece resultados para suelo, deliberadamente.
2. Elegir dos tarjetas para comparar anterior/candidata. Ajustar repetición y Aplicar; Cancelar/Escape no altera el proyecto. No se presenta un cambio sin confirmar.
3. **Acabado de una pared** → muro por ID y extremos; cambia toda la pared, ambas caras y fragmentos junto a huecos. Advertencia explícita de impacto en estancia vecina. No hay asignación independiente por cara. Se puede restaurar la pared original.
4. Abrir 3D; 2D conserva patrones de muestra, color de contorno de pared, cotas, nombres y símbolos. Los indicadores estructurales originales se conservan.
5. Guardado local y JSON/ZIP conservan ID, escala y fallback; los mapas no se empaquetan con el proyecto. Proyectos anteriores mantienen su formato hasta edición explícita. Importar ID desconocido conserva datos y avisa de color de respaldo.

Contrato **1.4.0 compatible**, ampliación opcional: `walls[].surfaceMaterialId` y `materials[].appearance.repeatMm`. Canónico y copia JS iguales; validación de referencia mural, sin restringir retroactivamente materiales de suelo antiguos. [Contrato](../contracts/FloorPlanProjectV1.md) y [ejemplo](../contracts/examples/floorplan-project-v1.surfaces.example.json). No base64, binarios, URL ni precios en el proyecto. Escala inicial 1000×1000 mm **de diseño**, no medida oficial; ajustable. UV en metros mantiene repetición al cambiar tamaño de estancia, sin normalizar por su bounding box.

Los acabados nuevos no reciben el precio cero de los presets anteriores: la estimación monetaria se omite cuando no hay precio confirmado, en todos los idiomas. Confirmar valida y guarda antes de publicar estado/historial; error de storage deja proyecto intacto. Cambio de escala en una asignación no modifica otra estancia que usaba el mismo material. Deshacer/rehacer conserva referencia y escala.

## Carga, fallback y mediciones

Metadata única local; sin API externa durante uso. Abrir app no descarga los 50 mapas ni muestras. Las tarjetas usan imágenes lazy y el 2D solo muestras de materiales asignados. 3D carga mapas de asignaciones activas; comprueba HTTP, bytes, SHA-256, decodificación y dimensiones. BaseColor usa sRGB; no hay mapas lineales a los que se aplique sRGB.

Cada reconstrucción conserva recursos todavía usados y cancela/libera los retirados (texture.dispose, material.dispose, ImageBitmap.close). Respuestas tardías no vuelven a publicar recursos. Material de fallback mantiene color y roughness y muestra motivo concreto en el área de trabajo/QA: HTTP, integridad, decodificación o preset desconocido. Un catálogo 503 conserva plano y materiales previos.

Presupuesto usado: 256 px/albedo y 112 px/muestra, elegido a partir de archivos realmente descargados, no del límite del cargador F3. Estimación GPU: RGBA8 × cadena de mipmaps ≈ width×height×4×4/3; no es memoria total del proceso. No se fija aún un presupuesto universal de teléfono físico. [Escena mixta y medidas](../qa/artifacts/surface-library/mixed-scene-metrics.json) registra cinco acabados simultáneos, bytes de mapas, GPU estimada, renderer.info.memory y 30 intervalos rAF. Medición de esta ejecución: cinco mapas, **39.508 bytes**, GPU estimada **1.747.630 bytes**, 50 retiradas observadas. Mediana rAF mixta **991,3 ms** frente a **952,3 ms** en la misma vivienda con presets originales; máximos 1169,4 / 1162,5 ms. SwiftShader es muy lento en este entorno; los intervalos no predicen FPS de móvil físico y no establecen un presupuesto global.

## Verificación de esta ejecución

Resultado completo inicial: **173 casos; 168 pasaron, cuatro fallaron por la lista antigua de rutas de privacidad y uno agotó el tiempo del recorrido software**. Repetición afectada: **4/4 y 1/1 aprobados**; se añadió una segunda medición 1/1 con baseline. La suite completa no se repitió después de corregir esos fixtures. La suite final específica pasó **7/7**, incluida comparación real y ausencia de precios inventados en inglés/chino; se detectó y corrigió contraste insuficiente del botón Aplicar en una pasada intermedia (registro conservado). Compatibilidad final **56/56**, unidades de superficies **7/7** y Python **42/42** (schema 11/11 repetido). Los tres flujos de biblioteca y los dos casos adversos/storage pasaron en la ejecución completa. [Comandos y resultados](../qa/artifacts/surface-library/validation-results.txt). Escritorio 1440×900; emulación táctil 390×844 y 844×390. Chromium/SwiftShader: renderizado por software, no GPU ni teléfono físico. Modules Three.js 0.160.0 obtenidos por curl con TLS verificado y servidos a Playwright mediante route; el TLS directo de Chromium rechaza la CA del entorno. No se instala nada ni se cambia red/permisos.

QA exige búsqueda, comparación/cancelación, suelo/pared, repetición, undo/redo, recarga, export/import, canvas ≥60% del stage y ausencia de errores inesperados. La prueba individual recorre los 50 mapas en la aplicación; la escena mixta verifica liberación. Casos adversos: HTTP 404, hash falso, contenido indecodificable con hash correcto, ID desconocido, catálogo 503, repetición inválida y storage fallido. La suite completa conserva regresiones F1a/F1b/F2/F3 y edición dimensional.

Capturas:
- [Contact sheet de 50 mapas](../qa/artifacts/surface-library/contact-sheet.jpg).
- Escritorio: [biblioteca](../qa/artifacts/surface-library/1440x900-library.png), [2D](../qa/artifacts/surface-library/1440x900-2d.png), [3D](../qa/artifacts/surface-library/1440x900-3d.png).
- Móvil vertical: [biblioteca](../qa/artifacts/surface-library/390x844-library.png), [2D](../qa/artifacts/surface-library/390x844-2d.png), [3D](../qa/artifacts/surface-library/390x844-3d.png).
- Móvil horizontal: [biblioteca](../qa/artifacts/surface-library/844x390-library.png), [2D](../qa/artifacts/surface-library/844x390-2d.png), [3D](../qa/artifacts/surface-library/844x390-3d.png).
- [Escena mixta](../qa/artifacts/surface-library/desktop-mixed-3d.png) y [fallback HTTP 404](../qa/artifacts/surface-library/fallback-404.png).

## Publicación y revisión humana

[Rama integrada](https://github.com/Juanmaes83/floorplan-3d/tree/feat/surface-material-library) · [PR #19](https://github.com/Juanmaes83/floorplan-3d/pull/19). La rama se fusionó sin force push; no hubo despliegue manual a producción. El bloque siguiente registra el SHA de revisión, el merge, el estado Vercel y la URL de preview. La nota de bloqueo REST corresponde a la preparación inicial de la entrega. El commit probado se vincula a [la huella de aplicación ejecutada](../qa/artifacts/surface-library/application-source-fingerprint.json). No existe workflow de CI de producto en `.github`; Vercel es un deployment/check diferente de ejecutar esta suite.

Cierre: Juanma revisó y aprobó la biblioteca visual; la PR #19 se fusionó mediante squash el 01-10-2026. SHA de la rama revisada `104830bf97cab262df7a26dae725203d661e097d`; merge en `master` `fa79d07243672076df506aae0f50ec84fca82b5d`. Vercel informó `READY` y vinculó el deployment al SHA revisado; preview: https://floorplan-3d-git-feat-surface-ddcf54-juanma-espinosas-projects.vercel.app/. No hubo despliegue manual a producción. Sin workflow de CI de producto; las verificaciones locales y el check Vercel no equivalen a una suite remota completa.

Aspectos incluidos en la revisión humana aprobada: interfaz española, filtros y cinco familias; comparación y aplicación de materiales; repetición y cancelación; paredes compartidas; persistencia/exportación; recorrido móvil vertical/horizontal y 3D. El nivel de detalle de 256 px quedó revisado dentro del alcance de esta entrega.

Pendiente: medir rendimiento y legibilidad en teléfono físico; decidir más adelante si se necesitan medidas oficiales de repetición o perfiles PBR adicionales. No se infiere segmento cliente/negocio ni aprobación de conectores. F2 conserva sus cinco sesiones y veinte planos de validación pendientes.
