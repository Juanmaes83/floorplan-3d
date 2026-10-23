# Lámina: reabrir antes del evento «close» la dejaba vacía (2026-10-23)

**Rama:** `fix/master-regressions` (#79). **Defecto presente en `master` `e796e3d` y en #78 `494f14d`.** Corrección en
`acabb54`. Chromium 141 con SwiftShader, Three.js 0.160.0 local, en serie.

## Defecto (determinista)
`dialog.close()` no ejecuta el evento `close` en el momento: lo pone en cola como tarea posterior (especificación HTML).
`js/sheet-ui.js` limpiaba la lámina en ese evento (`clear()`: revoca la URL de la vista previa y pone `current=null`).
Si la lámina se abre otra vez antes de que llegue el evento, `clear()` se ejecuta **después** de `open()`:
- la lámina reabierta se ve **vacía**: la imagen pierde su `src`;
- «Descargar SVG» no descarga: cierra la lámina y avisa «El proyecto cambió», aunque el proyecto no ha cambiado.

`race.cjs` cierra y reabre en la misma tarea y después descarga. Resultado en `master` y en #78: `src` vacío, sin
descarga y con ese aviso. Cerrando y reabriendo en tareas separadas, todo funciona.

## Corrección (mínima)
- `clear()` no hace nada si la lámina vuelve a estar abierta.
- `open()` libera la URL de la vista previa anterior antes de crear la nueva, para que no quede ninguna sin liberar.

## Prueba que falla antes
Caso nuevo en `tests/sheet.browser.test.cjs`, a 1440 y 390:
`sheet reopened before the previous close event keeps its preview and downloads`.

| Código | Resultado del archivo `sheet.browser` |
|---|---|
| `b875157` (código `72bac33`), sin la corrección | 7 PASS existentes y **2 FAIL nuevos** («reopened sheet has no preview»), en `sheet-before-fix-b875157.log` |
| `acabb54`, con la corrección | **9 PASS / 0 FAIL**, en `sheet-after-fix-acabb54-worktree.log` |

Unitarias en `acabb54`: 254 PASS, 0 FAIL, 2 SKIP (necesitan Blender).

## Relación con la descarga intermitente de `brand` a 390: plausible, no demostrada
- El fallo intermitente ocurre **en este mismo paso**: tercera descarga, `brand.browser.test.cjs:64-65`, tras cerrar y
  reabrir. Allí la descarga **no llega**: de las 4 descargas de una ejecución instrumentada de las 02:24 con 120 s de
  margen, solo llegaron 2.
- `order.cjs` (salida en `order-results.jsonl`; fp-share = #78 `494f14d`, fp-fix = #79 `acabb54`) repite ese paso tal cual lo hace la prueba: clic de Playwright en «Cerrar» y reapertura con `evaluate`.
  En 120 repeticiones de hoy (#78 y #79, a 390 y 1440), el evento `close` llegó **siempre antes** de reabrir y las
  120 descargas llegaron. Hoy el orden invertido no se da, y tampoco el fallo (0 de 68 descargas en la revisión 6).
- Por eso **no** se declara arreglado el fallo intermitente. Se ha corregido un defecto real que produce exactamente ese
  síntoma; si el orden se invierte, ya no puede impedir la descarga.
