# Auditoría independiente de #296 (R02-A · invalidación de la caché del paso libre orientativo) · 20/11/2026

| Qué | Valor |
|---|---|
| Auditado | PR borrador #296, HEAD `fd87c8a539b9dc2bb6c332ba22b3f7273c7edf82`, árbol `a7a9ceb313f911130cdf233e3270c1fc1815e2fc` (verificados) |
| Cadena | `0c6f0e70` (base) → `79fae45e` (corrección) → `fd87c8a5` (pruebas) |
| Corrección mínima | Rama propia `claude/r02a-cache-planner-key`, **encima** de `fd87c8a5`. La rama de ChatGPT no se toca y #296 no se fusiona |

## 1. ¿La firma cubre lo que consume `FloorPlanPresentationRoute.plan`?

Inventario leído del código del planificador (`js/presentation-route.js`) y contrastado con la geometría real del ejemplo (`C.geometry`): los nombres de campo coinciden.

| Entrada de `plan()` | Para qué la usa | Firma de #296 |
|---|---|---|
| `geometry.envelope` (x, y, w, h) | Rejilla de búsqueda | ✔ |
| `rooms`: `id`, `poly`, `counted`, `at` | Objetivo (`center` prefiere `at`) y zona transitable (`counted !== false`) | ✔ |
| `doors`: `entry`, `height`, `rect` (`center`, `angle`, `spanMm`, `thickness`), `id` | Origen en la entrada; puertas < 1,85 m como obstáculo; paso por puertas; `doorIds` | ✔ |
| `walls`: `status`, `spanMm`, `angle`, rect | Orientación de la rejilla y obstáculos (no derribados) | ✔ |
| `windows` (rect completo) | Obstáculos | ✔ |
| `slides[].rect` (rect completo) | Obstáculos | ✔ |
| `project.objects`: `type` (`rug` no bloquea), `position`, `size`, `rotationDeg` | Obstáculos | ✔ |
| Proyecto (`id`) y planta (`levelKey`) | Contexto | ✔ |
| **La función `plan` y sus `options`** (`clearanceMm`, `cellMm`, `maxCells`, `comfortMm`) | Parámetros del cálculo | **✘ · hallazgo** |

Los campos que no usa el planificador (el giro de las hojas `c`, `o`, `h`, `len`; `sill`, `head`) no forman parte de la firma, como corresponde.

## 2. Resultados

| Comprobación | Resultado |
|---|---|
| Pruebas nuevas de #296 sobre `fd87c8a5` | 2/2 |
| Las mismas pruebas contra el módulo de la **base** `0c6f0e70` | **Fallan** («room target must alter signature»): el defecto existía y la prueba discrimina |
| Geometría real del ejemplo: estrechar una puerta de una ruta interior (`opn_door-0`) sin mover su centro | Base: **reutiliza la caché**. #296: **recalcula** |
| Cambios solo de techo (`extensions['x-r02a-ceiling']`) | No recalculan (prueba de #296 y `r02a-passage-indicative`) |
| Regresión R02-A sobre `fd87c8a5` | `passage-indicative` 13/13, `ceiling-core` 22/22, `integration-contract` 7/7, `activation` 3/3, `bridge` 6/6, `session` 12/12, `passage-in-editor.browser` 6/6, `r02a-editor.browser` 5/5 |

**Dictamen:** la corrección de #296 es **correcta y necesaria**, con un residual (§3).

## 3. Hallazgo y corrección mínima

- **Defecto.** `routesFor(project, geometry, plan, levelKey)` no incluía en la clave **quién** planifica ni **con qué opciones**. Con otra función u otras opciones, la caché servía rutas de parámetros distintos. Reproducido: se pidió un margen de 600 mm y se sirvió una ruta calculada con 220 mm.
- **Alcance real hoy.** El editor siempre llama con `FloorPlanPresentationRoute.plan` sin opciones, así que **no afecta a la interfaz**. Es un defecto del API del módulo.
- **Corrección** (`claude/r02a-cache-planner-key`):
  - la clave antepone la identidad de la función `plan` (por un `WeakMap`, sin serializar código) y las `options`;
  - `routesFor` acepta `options` opcionales y solo las pasa al planificador si se dan, así que el comportamiento por defecto no cambia.
- **Prueba nueva** en `tests/r02a-passage-cache-signature.test.cjs`:
  - misma función y mismas opciones → caché;
  - otra función → recalcula;
  - otras opciones → recalcula y sirve rutas con el margen pedido.
  - Contra `fd87c8a5` **falla** (2/3); con la corrección, 3/3.
- **Regresión con la corrección:** `passage-in-editor.browser` 6/6; suite pura 1527/1529, 0 fallos, 2 omitidas.

**Sin cambios de comportamiento visible ni de datos.** R02-A sigue experimental, sin bloqueo de paso libre.
