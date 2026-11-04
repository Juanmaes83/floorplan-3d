# F03 — Auditoría PBR y pipeline de conversión para Three.js

**Estado documental:** archivos confirmados en GitHub; **ninguna conversión ni rendimiento F03 certificados**. Prohibido tratar `*_diff_4k.jpg` como “material PBR completo”. Fuente: `pbr-preview-source-map.csv`, `pbr-source-manifest.csv` y árbol remoto de esta rama @ `2623d12`.

## 1. Inventario con rutas verificadas
| Material | Color (4K, JPG) | Canales fuente suplementarios (GitHub) | Completitud en esta rama |
|---|---|---|---|
| `white_stucco` | [Albedo](references/02-facade-materials/albedo-previews/white_stucco_diff_4k.jpg) | [white_stucco_disp_4k.png](references/02-facade-materials/pbr-source-maps/white_stucco_disp_4k.png)<br>[white_stucco_nor_gl_4k.exr](references/02-facade-materials/pbr-source-maps/white_stucco_nor_gl_4k.exr)<br>[white_stucco_rough_4k.exr](references/02-facade-materials/pbr-source-maps/white_stucco_rough_4k.exr) | **COMPLETO FUENTE (4/4)** |
| `white_rough_plaster` | [Albedo](references/02-facade-materials/albedo-previews/white_rough_plaster_diff_4k.jpg) | [white_rough_plaster_disp_4k.png](references/02-facade-materials/pbr-source-maps/white_rough_plaster_disp_4k.png)<br>[white_rough_plaster_nor_gl_4k.exr](references/02-facade-materials/pbr-source-maps/white_rough_plaster_nor_gl_4k.exr)<br>[white_rough_plaster_rough_4k.jpg](references/02-facade-materials/pbr-source-maps/white_rough_plaster_rough_4k.jpg) | **COMPLETO FUENTE (4/4)** |
| `rough_plaster_03` | [Albedo](references/02-facade-materials/albedo-previews/rough_plaster_03_diff_4k.jpg) | [rough_plaster_03_disp_4k.png](references/02-facade-materials/pbr-source-maps/rough_plaster_03_disp_4k.png)<br>[rough_plaster_03_nor_gl_4k.exr](references/02-facade-materials/pbr-source-maps/rough_plaster_03_nor_gl_4k.exr)<br>[rough_plaster_03_rough_4k.jpg](references/02-facade-materials/pbr-source-maps/rough_plaster_03_rough_4k.jpg) | **COMPLETO FUENTE (4/4)** |
| `rough_plasterbrick_05` | [Albedo](references/02-facade-materials/albedo-previews/rough_plasterbrick_05_diff_4k.jpg) | — | **INCOMPLETO EN GITHUB (1/4)** |
| `stacked_brick_wall` | [Albedo](references/02-facade-materials/albedo-previews/stacked_brick_wall_diff_4k.jpg) | — | **INCOMPLETO EN GITHUB (1/4)** |
| `patterned_terracotta_tiling` | [Albedo](references/02-facade-materials/albedo-previews/patterned_terracotta_tiling_diff_4k.jpg) | — | **INCOMPLETO EN GITHUB (1/4)** |
| `coated_pine` | [Albedo](references/02-facade-materials/albedo-previews/coated_pine_diff_4k.jpg) | — | **INCOMPLETO EN GITHUB (1/4)** |
| `dark_paneled_wood` | [Albedo](references/02-facade-materials/albedo-previews/dark_paneled_wood_diff_4k.jpg) | — | **INCOMPLETO EN GITHUB (1/4)** |
| `white_oak_veneer` | [Albedo](references/02-facade-materials/albedo-previews/white_oak_veneer_diff_4k.jpg) | — | **INCOMPLETO EN GITHUB (1/4)** |
| `rounded_square_tiled_wall` | [Albedo](references/02-facade-materials/albedo-previews/rounded_square_tiled_wall_diff_4k.jpg) | — | **INCOMPLETO EN GITHUB (1/4)** |
| `brown_floor_tiles` | [Albedo](references/02-facade-materials/albedo-previews/brown_floor_tiles_diff_4k.jpg) | — | **INCOMPLETO EN GITHUB (1/4)** |
| `cobblestone_floor_08` | [Albedo](references/02-facade-materials/albedo-previews/cobblestone_floor_08_diff_4k.jpg) | — | **INCOMPLETO EN GITHUB (1/4)** |
| `ganges_river_pebbles` | [Albedo](references/02-facade-materials/albedo-previews/ganges_river_pebbles_diff_4k.jpg) | — | **INCOMPLETO EN GITHUB (1/4)** |

**Cifras:** 13 albedos; 3 normales OpenGL (`nor_gl`); 3 rugosidades (`rough`); 3 desplazamientos (`disp`). Total **22 imágenes fuente de materiales** = 13 albedos + 9 complementarias. Los otros **10** materiales tienen únicamente albedo en GitHub; esto **no demuestra** que sus ZIP locales carezcan de los canales restantes.

**EXR fuente:** `white_stucco` normal + rugosidad; `white_rough_plaster` normal; `rough_plaster_03` normal. No servir EXR de 4K directamente como asset web sin pipeline y comprobación de compatibilidad. El displacement PNG no autoriza por sí solo alterar la geometría.

## 2. Preparación offline reproducible — instrucciones para Kimi
1. Auditar versión real de Three.js (el checkpoint F02 usa 0.160.0), cargadores, empaquetador y herramientas locales disponibles. No asumir `npm test` raíz: reutilizar el harness del repo.
2. Seleccionar **solo** los 3 materiales fuente completos. Leer cada mapa y registrar dimensiones, número/nombre de canales, tipo, bits, valores mínimos/máximos, perfil/función de transferencia, hash y escala. Con OpenImageIO disponible, inspección orientativa: `oiiotool --info -v INPUT.exr`. Si no está instalado, usar conversor equivalente auditado; no instalar silenciosamente dependencias globales.
3. Convertir los EXR de **normales y rugosidad como datos lineales**, no como fotografía: aplicar clamp en el rango válido cuando proceda, cuantización controlada y verificación de canales. Patrón orientativo con OpenImageIO, tras comprobar sintaxis de la versión instalada: `oiiotool INPUT.exr -d uint8 -o OUTPUT.png`. Esta línea **no garantiza** por sí sola el mapeo de canales correcto; validarlo visual y numéricamente. No cambiar de normal OpenGL a DirectX sin justificación; comprobar signo Y sobre una esfera y plano bajo luz oblicua.
4. Para `roughnessMap` de Three.js asegurar que el valor de rugosidad esté en el **canal verde** de la textura empaquetada. Si el EXR tiene un único canal, replicarlo a RGB o empaquetarlo conscientemente en G; no asumir que el canal rojo será leído. No aplicar corrección sRGB a roughness.
5. Convertir/aligerar albedo JPG 4K hacia variantes LDR web optimizadas (por ejemplo WebP 512/1024 y, si el hero lo necesita, 2048). Conservar color y neutralidad; no confundir `_diff` con iluminación horneada o fotografía arquitectónica. No superar el coste del render por capricho.
6. Normales: conservar componentes XY y el eje Y de OpenGL, normalizar correctamente, reducir artefactos de compresión y evitar inversión de relieve. Rugosidad: proteger el grano fino de banding. Desplazamiento: mantener una salida fuente aislada; introducir `displacementMap` **solo** tras probar subdivisión suficiente, sombras, aristas y conservación de cotas constructivas. Si hay riesgo, dejarlo OFF y usar `normalMap`.
7. **Color spaces en Three.js:** `map.colorSpace = THREE.SRGBColorSpace` para albedo. `normalMap`, `roughnessMap` y `displacementMap` con `THREE.NoColorSpace`. `MeshStandardMaterial` o `MeshPhysicalMaterial` solo cuando corresponda; no convertir yeso en metal ni añadir clearcoat por defecto.
8. Configurar `RepeatWrapping` y `repeat` desde escala real declarada (`repeatMm` y UV por superficie) con continuidad entre paños y juntas. Validar orientación, esquinas, relación con huecos, alféizares y luces rasantes en D1/M1/M2/M3/G1. Evitar deformar una sola textura sobre todas las caras sin UV correctas.
9. Optimización opcional `KTX2/BasisU`: comprobar primero que existe `KTX2Loader` compatible y su transcoder local. Usar `setTranscoderPath(...)` y `detectSupport(renderer)`, sin descargas remotas en tiempo de render. Comprimir mapas de color con transferencia sRGB y mapas de datos con transferencia lineal. Medir artefactos y rendimiento frente a WebP. **WebP es fallback obligatorio** si no se valida KTX2.
10. Construir manifiesto **de derivados** versionado con entrada, salida, SHA-256, dimensiones, canales, formato, tamaño comprimido, estimación GPU, colorSpace, escala real, fuente/licencia, herramienta+versión y estado. No sobrescribir fuentes 4K.
11. Para integración futura: opt-in de una receta `F03` derivada y `VISUAL_ONLY` con fallback sin textura; jamás conectar directamente fuentes 4K al catálogo actual de 50 materiales, que valida paths, hashes, dimensiones ≤512 px y bytes ≤512 KiB por recurso. No editar datos de proyecto ni `surfaceMaterialId`. Guardar derivados solo tras aceptación técnica y visual.

**Documentación de referencia técnica:** [Three.js Color Management](https://threejs.org/manual/en/color-management.html), [Texture API](https://threejs.org/docs/#api/en/textures/Texture), [MeshStandardMaterial](https://threejs.org/docs/#api/en/materials/MeshStandardMaterial), [KTX2Loader](https://threejs.org/docs/#examples/en/loaders/KTX2Loader), [KTX-Software](https://github.com/KhronosGroup/KTX-Software). La sintaxis concreta de CLI y compatibilidad con Three.js 0.160.0 deben comprobarse localmente antes de automatizar.

## 3. Matriz de QA / gates de aceptación
| Gate | Prueba obligatoria | Evidencia |
|---|---|---|
| P0 Seguridad del proyecto | Hash de `FloorPlanProjectV1` y geometría inalterado; no cambios en medidas, huecos, ventanas, collider, renderer F02 o persistencia | Diff, hashes antes/después y test de regresión |
| P0 Fidelidad visual | Misma cámara/exposición/escena para OFF F02 y F03; vistas D1, M1, M2, M3, G1 y **fachada completa** | Contact sheet, PNG antes/después y juicio humano |
| P0 Lifecycle | F03 ON/OFF 3 ciclos, entrada/salida/reingreso, rebuild, cambio de perfil, context loss; recursos liberados | Contadores de geometrías, materiales, texturas; cero recursos propios tras OFF |
| P0 Semántica | Material real conservado; solo muros exteriores clasificados por `FloorPlanExterior.derive(project)` y compatibles; exclusiones registradas | `wallId`, razón, fuente, receta y coverage |
| P1 Render/rendimiento | Render desktop + viewport móvil emulado 390×844 y móvil físico si existe; p50/p95 intervalos, draw calls, triángulos, carga, RAM/GPU estimada; shader recompiles | Mismo hardware, misma calidad, repeticiones y logs. `requestAnimationFrame` no mide tiempo GPU |
| P1 Materialidad | Albedo fiel; normales sin inversión; roughness en G; sin seams, repetición exagerada ni displacement falso | Crops con luz rasante y examen humano |
| P1 Entrega | Manifiesto de derivados, fuente y licencia; sin empaquetar ZIP gigantes ni generar duplicados; Preview/PR draft solo cuando corresponda | Archivos versionados, tamaños y trazabilidad |

No existe presupuesto de rendimiento F03 verificado todavía. Registrar baseline primero y proponer límites de coste tras medir. **No declarar PASS por ejecutar un comando de push; el gate visual es humano y el gate GPU requiere medición propia.**
