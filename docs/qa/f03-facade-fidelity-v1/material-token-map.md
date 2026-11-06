# F03 — Contrato de etiquetas MATERIAL.WALL (propuesta, NO API implementada)

**Autoridad existente verificada:** `FloorPlanProjectV1`, `wall.surfaceMaterialId`, `FloorPlanExterior.derive(project)`, `js/surface-catalog.js` y `assets/materials/catalog.json` (50 entradas), renderizados mediante `js/surface-renderer.mjs`. La familia visual `F02/window-assembly@2` continúa `VISUAL_ONLY`, desactivada por defecto. El repositorio **no contiene una API F03 `MATERIAL.WALL`** auditada. Este documento es **un vocabulario de diseño propuesto** para clasificación y futura decisión, nunca una orden de sustituir IDs existentes.

## Matriz de propuestas y compatibilidad
| Fuente Poly Haven | Etiqueta semántica propuesta | Posible preset existente (solo analogía visual) | Regla |
|---|---|---|---|
| `white_stucco` | `MATERIAL.WALL.MINERAL_WHITE_STUCCO` | `surface-white-plaster-02` | EVALUAR; NO AUTOMAP |
| `white_rough_plaster` | `MATERIAL.WALL.MINERAL_WHITE_ROUGH_PLASTER` | `surface-white-plaster-02` | EVALUAR; NO AUTOMAP |
| `rough_plaster_03` | `MATERIAL.WALL.MINERAL_ROUGH_PLASTER_03` | `surface-plastered-wall-03` | EVALUAR; NO AUTOMAP |
| `rough_plasterbrick_05` | `MATERIAL.WALL.MINERAL_PLASTERBRICK_05` | — | SIN EQUIVALENCIA CERTIFICADA |
| `stacked_brick_wall` | `MATERIAL.WALL.BRICK_STACKED` | — | SIN EQUIVALENCIA CERTIFICADA |
| `patterned_terracotta_tiling` | `MATERIAL.WALL.CERAMIC_TERRACOTTA_PATTERN` | — | SIN EQUIVALENCIA CERTIFICADA |
| `coated_pine` | `MATERIAL.WALL.WOOD_COATED_PINE` | — | SIN EQUIVALENCIA CERTIFICADA |
| `dark_paneled_wood` | `MATERIAL.WALL.WOOD_DARK_PANELED` | — | SIN EQUIVALENCIA CERTIFICADA |
| `white_oak_veneer` | `MATERIAL.WALL.WOOD_WHITE_OAK_VENEER` | `surface-oak-wood-planks` | ANALOGÍA; NO EQUIVALENCIA |
| `rounded_square_tiled_wall` | `MATERIAL.WALL.CERAMIC_ROUNDED_SQUARE` | — | SIN EQUIVALENCIA CERTIFICADA |
| `brown_floor_tiles` | `EXCLUDED_FROM_MATERIAL.WALL` | `surface-brown-floor-tiles` | NO USAR COMO FACHADA SIN DECISIÓN |
| `cobblestone_floor_08` | `EXCLUDED_FROM_MATERIAL.WALL` | — | CONTEXTO DE SUELO |
| `ganges_river_pebbles` | `EXCLUDED_FROM_MATERIAL.WALL` | — | CONTEXTO DE SUELO |

**Reglas de interpretación:**
- `MATERIAL.WALL.*` expresa **intención visual documental**; **no** es `surfaceMaterialId`, una clave de `assets/materials/catalog.json`, ni un selector persistido.
- Ningún preset se reemplaza por similitud aproximada: revoco vs. estuco, roble en tablón vs. chapa, y cerámica vs. ladrillo tienen identidad distinta.
- `wall.surfaceMaterialId` y, cuando exista, `material.appearance.preset` siguen prevaleciendo. Los materiales derivados no pueden sobreescribir una asignación existente ni cambiar medidas, polígonos o clasificaciones de exterior.
- `brown_floor_tiles`, `cobblestone_floor_08` y `ganges_river_pebbles` son pavimento/terreno y **quedan excluidos** de `MATERIAL.WALL` por defecto. No forzar uso de suelo en fachada.
- Un acabado puede ser una segunda capa visual **solo con opt-in explícito**, compatibilidad de material y evidencia en el proyecto real. Si no coincide con la identidad del material, fallback neutro sin alteración de datos.
- No modificar los 50 registros existentes como atajo. `js/surface-catalog.js` valida número de entradas, rutas `assets/materials/*.webp`, dimensión máxima 512 px, tamaño máximo 512 KiB y SHA-256, además de canales permitidos y procedencia; meter EXR 4K o nuevas claves en ese contrato **rompería validaciones**.
- Documentar procedencia por material: ZIP de origen, nombre del archivo real, roles baseColor/normal/roughness/displacement, licencia CC0 informada por el usuario, hash SHA-256 del derivado, dimensiones, repetición física y perfil de color.

## Prioridad de implementación
| Orden | Material | Justificación y límite |
|---|---|---|
| 1 | `white_stucco` | Fachada mineral clara; paquete de cuatro canales disponible; probar variación sutil sin cambiar color/identidad del revestimiento asignado |
| 2 | `white_rough_plaster` | Alternativa de grano; mismo control que el anterior |
| 3 | `rough_plaster_03` | Segunda escala de grano; evitar relieve exagerado |
| Pendiente | otros 7 candidatos `MATERIAL.WALL` | Solo albedo en GitHub, falta validar canales de la fuente y compatibilidad material |
| Fuera de alcance | 3 fuentes de suelo/terreno | Contexto paisajístico, no sistema de fachada |

## Regla F02 protegida
No modificar `F02/window-assembly@2`, `recessed-sash`, `flush-sash`, vidrio, juntas, alféizares, IDs reales, recursos o ciclo de vida. F03 se mide sobre la fachada completa **con F02 como baseline**, jamás sustituyéndola. PR #167 permanece sin merge ni despliegue.
