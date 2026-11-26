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

---

## Corrección de la causa (rama `claude/a0-resizeobserver-causa`, 26/11/2026)

**Base:** `eb264d76e2404608a32f3202ba52daa41a81cdc3` (reproducción de la candidata `2c7e7739`).

**Causa localizada.** Dos observadores de `ResizeObserver` del producto escribían en el DOM **dentro de su propia entrega**:

1. **Plano** (`index.html`, observador del `<svg>`): `fitView()`/`applyView()` reescribían el `viewBox`, la escala del pie
   (`#ratio`), `#sbText` y la barra de escala. Si el texto del pie cambiaba de ancho, el pie podía cambiar de alto tras el
   reflujo y el plano observado cambiaba de tamaño en la misma entrega. WebKit lo notifica como «ResizeObserver loop
   completed with undelivered notifications». Es intermitente porque depende del texto y del contenido del pie (más
   probable con F0.2b activo, que añade un botón al pie).
2. **Vista 3D**: `renderer.setSize()`/`labelRenderer.setSize()` reescribían el tamaño del lienzo y de la capa de
   etiquetas dentro del escenario observado. Mismo patrón.

La comprobación existente (`__roSync`) medía los tamaños inmediatamente después del callback, así que no veía el reflujo
posterior; por eso el error parecía «de entorno».

**Corrección.** Los dos callbacks solo **programan** su trabajo para el siguiente fotograma, una vez por fotograma (el
mismo patrón que Codex ya aplicó en `app-shell` y en el espacio de trabajo). Ninguna aserción se relaja y ningún error se filtra.

**Regresión determinista nueva** (`a0-browser-residuals`, «ningún callback del producto escribe en el DOM dentro de su
entrega»): registra con un `MutationObserver` toda mutación hecha dentro de cada entrega, en 2D y 3D, al cargar y al cambiar
el tamaño de la ventana, a 1440×900 y 390×844. **Falla en la base** (`viewBox`, `#ratio`, `#sbText`, opacidad) y **pasa
con la corrección**. La fase 3D se exige donde hay WebGL. Firefox sin interfaz en Linux no tiene WebGL (comprobado:
`webgl=false`), así que allí lo declara y comprueba que el editor sigue en 2D.

| Ejecución | SHA | Firefox | WebKit |
|---|---|---|---|
| Base, CI ([45683473977](https://github.com/Juanmaes83/floorplan-3d/actions/runs/45683473977)) | `171dc2b6` | 162/162 | **146/162** (16 × RO loop) |
| Base, local WebKit 26.6 escritorio | `eb264d76` | — | 26/27 (R1-T02b F0.2b: RO loop) |
| Corrección, CI ([45796693102](https://github.com/Juanmaes83/floorplan-3d/actions/runs/45796693102)) | `7d0810aa` | 4/6 trabajos (fallo solo de la prueba nueva por falta de WebGL) | **6/6 trabajos verdes** |
| Corrección, CI ([45797436291](https://github.com/Juanmaes83/floorplan-3d/actions/runs/45797436291)) | `a99c2c0a` | **6/6** (29 pruebas c/u) | **6/6** (29 pruebas c/u, 0 errores de RO) |
| Corrección, local WebKit 26.6 escritorio | `7d0810aa` | — | 29/29 |

Entorno: Playwright 1.63.0 (la CI general del repositorio fija 1.62.1), `ubuntu-latest`, perfiles persistentes nuevos,
sin traza, `A0_PATTERN='.'`. **Dictamen:** el gate de WebKit de A0 pasa con la corrección; la composición con `master` y
Muros se acredita aparte (`claude/geometria-composicion`).
