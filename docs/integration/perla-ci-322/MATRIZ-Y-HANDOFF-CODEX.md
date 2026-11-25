# PERLA #322 · cierre de CI · matriz por causa y entrega a Codex

| Dato | Valor |
|---|---|
| Repositorio | `Juanmaes83/floorplan-3d` |
| Rama de trabajo | `claude/perla-ci-322` (propia; no toca la rama de integración de #322) |
| Base (candidata aprobada) | `09eebc9c6709628e61d9a9d6552414bec1776d40` |
| **SHA final del delta** | `d6d32120a0296b6436772f9dfc487990750fb081` (árbol `d747106fe1bfc17e52578fe65babbbf35f397b0a`) |
| Delta de código y pruebas | `delta-codigo-09eebc9c..d6d32120.patch` (solo `css/`, `js/`, `tests/`; el resto son evidencias de esta carpeta) |
| Encargo | `89bae1ff` (§0 orden: PERLA → Visualización/Home + §2.1 → Presupuestos/Geometría → §8 examen MVP) |

## Matriz

Clasificación: **R** regresión del producto · **S** selector obsoleto · **E** entorno (CPU/SwiftShader) · **C** cobertura de CI.
CI = resultado de GitHub Actions sobre el SHA final: **PENDIENTE** en todas las filas (ver «Siguiente paso»).

| # | Causa (checks rojos en `09eebc9c`) | Clase | Corrección | Commit | Local (Chromium) | CI | Evidencia |
|---|---|---|---|---|---|---|---|
| 1 | Suites `perla-*` sin CI (guard, observe, contract, integration-gate) | C | 4 suites en la partición bloqueante | `e608d901` | `check-browser-test-coverage`: 0 sin cubrir; cada suite 2/2 | PENDIENTE | `tests/regression-partitions.json` |
| 2a | Móvil 390×844: «← Volver a…» añade fila y encoge el lienzo 531→487 px | R | Botón flotante sobre el lienzo; lienzo 531 px antes y después | `db4eb10f` | professional-workspace 16/16 | PENDIENTE | medida en `ESTADO.md` |
| 2b | Point9 busca «← Volver a Diseñar» | S | Sigue la vuelta real Mi estudio → Entregar → Diseñar | `88f42093` | Point9 1/1 | PENDIENTE | — |
| 2c | «Volver» oscilaba Entregar ↔ Mi estudio | R | `goBack` no crea un retorno nuevo | `88f42093` | perla-return 2/2 | PENDIENTE | — |
| 3 | Tableta 820×1180: panel lateral tapa Propiedades (ux08 ×2, upload OP-04 ×2) | R | Botonera por encima del panel abierto | `8929c3b4` | ux08 2/2 · upload 22/22 · `tab.cjs`: Propiedades y Biblioteca reciben el clic; diálogo modal encima y fondo bloqueado | PENDIENTE | `tab.cjs`, `tableta-820x1180-*.png` |
| 4 | capture-3d: cámara con ruido 1e-15 | E | Tolerancia absoluta 1e-9 por componente, indicando cuál se desvía; resto exacto | `b0ce653c` | 3/3 | PENDIENTE | — |
| 5 | assistant-ai-v2 t9: acción de cliente oculta | S | Espera la acción visible; destino y proyecto sin cambios se mantienen | `639782ba` | 1/1 | PENDIENTE | — |
| 6a | anchored-comments B6: no llega la descarga | S | Abre P7 y pulsa la acción dentro de su ficha o panel; descarga y HTML sin conexión se mantienen | `b0ce653c` | 1/1 | PENDIENTE | — |
| 6b | tour-video SCULPT agota 240 s | E | Límite 600 s, justificado por fases: preparación 0,9 s · render 197 s (456 ms/fotograma) · codificación 0,06 s · descarga 1,3 s | `8a57e122` | pasa (387 s con carga) | PENDIENTE | `film.cjs`, `sculpt-dron-fases.txt`, `sculpt-dron-640x360.mp4` (H.264 640×360 8 fps, 433 fotogramas, 54,1 s; FFmpeg decodifica entero) |
| 7 | presentation R2 P05 360×800: `.perla-utils` tapa «Crear una copia local del ejemplo» | R | ≤400 px: huecos e iconos compactos y el nombre del proyecto cede sitio; se conservan todos los controles y `ES · EN · ZH` | `d1c9ca36` | P05 4/4 (incl. 360×800); `r1.cjs`: el clic llega al botón a 360 px y en escritorio | PENDIENTE | `r1.cjs`, `r1-360x800.png`, `r1-1440x900.png` |
| 8a | bpdp-candidate: +24,7 MB tras 6 aperturas | R | `perla-return.js` dejaba de retener diálogos retirados del documento (el visor se cierra y se elimina en el mismo paso) | `9277e2cc` | Recursos 1/1 (< 8 MB) · perla-return 2/2 | PENDIENTE | — |
| 8b | bpdp-routes: no aparece la descarga del vídeo | E | Límites según tiempos medidos: espera por salida 600 s; prueba 1200 s | `d6d32120` | 2/2 | PENDIENTE | `bpdp-salidas/` (2 PNG y 2 MP4 H.264 1920×1080 30 fps: Blueprint 571 fotogramas 19,0 s; Despiece 646 fotogramas 21,5 s; FFmpeg decodifica entero) · `verificacion.txt` |

## Límites y observaciones

- A 360 px el nombre del proyecto queda reducido a su inicial con el desplegable.
- Despiece cuesta ≈0,5 s/fotograma frente a ≈0,18 s de Blueprint con render por CPU: conviene revisar el coste de su escena (no bloquea).
- La exportación normal de master no se cronometró: exige iniciar antes una presentación. El modo dron y estas pruebas son nuevos en #322.
- Solo Chromium; Firefox/WebKit y dispositivo físico: NOT_RUN.

## Siguiente paso (requiere coordinación)

La batería se dispara con `pull_request`; una subida a `claude/perla-ci-322` no la lanza. Para ejecutarla sobre el mismo SHA final hay que llevar este delta a la rama de #322. **Codex:** aplica `delta-codigo-09eebc9c..d6d32120.patch` (o fusiona `d6d32120`) en la rama de #322 y lanza la batería; con los resultados se rellena la columna CI. Sin fusión a master, Production ni activaciones.
