# A0 · Firefox y WebKit sobre la candidata #310 (`2c7e7739`)

**Código probado:** árbol de producto idéntico a `2c7e77392a6137be2d1efb5674fd774385942e85`. La rama
`claude/a0-cruzado-2c7e7739` solo añade el flujo `.github/workflows/a0-cross-browser.yml` y una copia **sin cambios** del arnés de
Codex (`docs/integration/op07-a0-2026-11-20/a0-run.cjs` en master), en `tools/a0-cross/`. Sin traza (`A0_TRACED=0`), todas las
pruebas (`A0_PATTERN='.'`), Playwright 1.63.0, perfiles persistentes nuevos, `ubuntu-latest`. Suites: `a0-browser-residuals` y
`a0-writer-fence` (27 pruebas; dos pestañas, cambio de época, `onversionchange`, F0.2b activo, 1440×900 y 390×844).

**Por qué se repite:** la acreditación previa de Firefox 19/19 y WebKit 19/19 (master, `docs/integration/op07-a0-2026-11-20/README.md`)
se hizo en Windows sobre `112eaf52` (#273, base antigua), no sobre esta composición.

## Resultado (ejecución 2, SHA `171dc2b6`, [run 45683473977](https://github.com/Juanmaes83/floorplan-3d/actions/runs/45683473977))

| Motor · tamaño | Intento 1 | Intento 2 | Intento 3 |
|---|---|---|---|
| Firefox · escritorio | 27/27 | 27/27 | 27/27 |
| Firefox · móvil 390×844 | 27/27 | 27/27 | 27/27 |
| WebKit · escritorio | 22/27 | 24/27 | 25/27 |
| WebKit · móvil 390×844 | 26/27 | 24/27 | 25/27 |

**Firefox: 162/162.** **WebKit: 146/162; los 16 fallos son el mismo** `ResizeObserver loop completed with undelivered
notifications` que llega a la ventana. Ninguna aserción de datos, época, bloqueo o persistencia falla. El error cae en pruebas
distintas en cada intento (R1-T02, R1-T02b, R1-T04, escritura de bytes, confirmación tras lock), así que es intermitente y
de entorno o de temporización en WebKit Linux.

La ejecución 1 (`45dac02f`, [run 45681166106](https://github.com/Juanmaes83/floorplan-3d/actions/runs/45681166106)) salió en
verde por error: `tee` ocultaba el código de salida. Sus registros ya mostraban 4 fallos de WebKit en escritorio y 3 en móvil, del
mismo tipo. El flujo usa ahora `pipefail`.

## Dictamen

Según la regla de #310 («si reaparece un fallo, se devuelve con NO-GO y la reproducción»):

- **A0 `2c7e7739`: NO-GO del gate de WebKit.**
- **Firefox: acreditado.**

La reproducción es este flujo: un `push` a la rama o `workflow_dispatch`. La causa (qué callback de ResizeObserver produce
el bucle en WebKit) sigue sin identificar. La traza de Codex (`A0_TRACED=1` con `ro-trace.init.js`) es el siguiente paso. No se
ha relajado ninguna aserción ni se ha filtrado ningún error.
