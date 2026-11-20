# D · Captura reproducible · HANDOFF para Codex

**Estado: CERRADA TÉCNICAMENTE** (20/11/2026). Fue reabierta y corregida tras una re-ejecución independiente: ver «Re-ejecución independiente y correcciones». No está integrada en RUBIK. La aceptación humana y la integración son posteriores.
**Base:**
- RUBIK `floorplan-3d@02712b5147c15defa12a810b2f346e4b3e0ecb60`, solo lectura;
- donante `simulator@57d562c` (MIT).

## Qué hace

Captura secuencias y stills de la app **real** de RUBIK avanzando un **reloj virtual**. No graba en tiempo real.
- El mismo código y la misma acción producen los mismos bytes fotograma a fotograma.
- No modifica ningún archivo del producto ni el proyecto ni el almacenamiento.

## Archivos y destino propuesto (no toca producto)

| Laboratorio | Destino en `floorplan-3d` |
|---|---|
| `src/virtual-capture.cjs`, `src/still-times.cjs`, `src/pixel-diff.cjs`, `src/rubik-scenarios.cjs` | `scripts/capture/` |
| `test/still-times.test.cjs`, `test/pixel-diff.test.cjs` (puras) | `tests/` |
| `test/virtual-capture.browser.test.cjs` (Chromium) | `tests/` + workflow propio bajo demanda |
| `diag/determinism-diag.cjs`, `diag/window-equivalence.cjs` | `scripts/capture/diag/` (diagnóstico, opcional) |

**Dependencias:**
- Node 22;
- `playwright` (Apache-2.0), probado con 1.63;
- Chromium 1243 (`CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`).

**Sin uso:** FFmpeg, esbuild, three, las fuentes del donante, música.

## Contrato y garantía de reproducibilidad

- `openRubik` hace tres cosas:
  - instala `page.clock` antes de cargar;
  - bloquea la red externa;
  - **congela la línea de tiempo de animaciones CSS** (CDP `Animation.setPlaybackRate 1e-6`).

  Después, `syncCss` conduce cada animación con el tiempo virtual.
- `settle` espera a que no queden peticiones de red en curso y a que la **luz HDR de la presentación** salga de `loading`, porque esa carga corre en tiempo real fuera de `lifecycleMetrics`. Exige además el lienzo idéntico tres pasos seguidos.
- `captureSequence` devuelve:
  - `scope`: `canvas3d`, `window` o `element`;
  - las huellas exactas por fotograma y la huella de la secuencia;
  - la cámara observada por fotograma;
  - `rest`, el estado de reposo de OP-02 al terminar;
  - `perf`: ms por fotograma p50/p95/max, memoria JS y nodos DOM al inicio y al final, RSS del proceso Node.
- Rechaza con:
  - `MUTATION` si cambia el proyecto;
  - `MUTATION_STORAGE` si cambian `localStorage` o `sessionStorage`;
  - `CANCELLED`, `NOT_STARTED` y `OVERWRITE` en los casos correspondientes.
- `manifest()` usa el formato `rubik-sota.d-capture` v1. Es compatible con la procedencia de OP-10 y Studio:
  - `format`;
  - `observedProject`, que **no** es una revisión F0 confirmada;
  - huellas exactas;
  - `rubikContentSha256` cuando la raíz no es un checkout de git.
- **Garantías por alcance (ver `EQUIVALENCIA.md`):**
  - `canvas3d` = **solo el render WebGL**, aislado durante la foto: **byte a byte**;
  - `window` = **exacto fuera del lienzo** y, sobre el lienzo, dentro de `WINDOW_CONTRACT` (≤ 1,2 % y Δ ≤ 64, medido 0,85 % y Δ 52). Las capas DOM superpuestas al WebGL (etiquetas CSS2D y `#hint3d`) varían en bordes y apilado entre sesiones;
  - las huellas exactas se guardan siempre.

## Diagnóstico (evidencia en `evidence/determinismo/`)

| Hallazgo | Medida | Causa | Corrección |
|---|---|---|---|
| Vuelo `flyToRoom rom_kid`, lienzo 3D | 3 sesiones idénticas, también con la CPU saturada (6 hilos ocupados) | — (la prueba roja anterior no se reproduce) | — |
| Ventana completa `enter3d`, ANTES | 4 sesiones, 3 huellas distintas: hasta 25.102 px, Δ 211 | Transiciones CSS en el reloj **real** del compositor. La pista de ayuda del 3D (0,4 s) a veces empezaba y terminaba entre dos pasos virtuales y no llegaba a verse | Línea de tiempo CSS congelada + `syncCss` |
| Ventana completa `enter3d`, DESPUÉS | 4 sesiones idénticas, 0 px | — | — |
| `presentationNext`, demo A/B | Los 24 fotogramas diferían de forma constante (3.768 px, Δ 7) con la cámara idéntica | La luz HDR de la presentación (descarga + SHA-256 + PMREM) en tiempo real, fuera de `pendingAssets` | `settle` espera a `presentationLight.status !== 'loading'` |

## Pruebas y resultados (ejecutados)

- Puras: `still-times` 3/3 y `pixel-diff` 3/3.
- Navegador, Chromium: `virtual-capture.browser.test.cjs` (resultado vigente en «Re-ejecución independiente y correcciones»):
  - determinismo del lienzo;
  - determinismo de la ventana completa;
  - robustez, almacenamiento y manifiesto;
  - CSS virtualizado;
  - bloqueo `stop()` + `settle` acotado, `act()` y cierre limpio.

- Demo A/B (`demo/run-demo.cjs --repeat`, antes de la corrección del HDR):
  - `enter3d` y `flyToRoom` idénticos;
  - stills idénticos;
  - `presentationNext` distinto, lo que llevó a la corrección del HDR.
- Reposo de OP-02 al terminar cada secuencia: `loopActive=false`, sin animación ni vuelo.
- Rendimiento con dos navegadores en paralelo y SwiftShader: entre 0,7 y 3,2 s por fotograma (p50). Heap JS entre 21 y 31 MB.

## Garantía: dónde se ha comprobado (y dónde no)

| Comprobado | Valor |
|---|---|
| Navegador | Chromium **153.0.8010.12** (Chrome for Testing, `chromium-1243`), sin interfaz, `--use-angle=swiftshader` |
| GPU | ANGLE Vulkan **SwiftShader** (renderizado por software). Sin GPU física |
| Sistema | Linux 6.18, 4 vCPU (contenedor de Claude Code). Probado también con la CPU saturada (6 hilos ocupados) |
| Herramientas | Node 22.23.4, Playwright 1.63.0 |
| RUBIK | `git archive` de `02712b5`, ejemplo de bienvenida |
| Alcances | `canvas3d` byte a byte; `window` exacto fuera del lienzo y dentro de `WINDOW_CONTRACT` sobre él |

**No comprobado. La garantía NO se extiende a:**
- Firefox ni WebKit: su descarga está bloqueada en este entorno. Sin CDP no hay congelación CSS, así que solo aplicaría `canvas3d`, y además está por verificar;
- Safari real ni GPU física;
- Windows ni macOS;
- otros DPR o tamaños de ventana distintos de 960×600 a DPR 1;
- proyectos con GLB de catálogo.

Las huellas se reproducen **en el mismo entorno**. Otro navegador, otra GPU u otra versión producen huellas distintas: la procedencia del manifiesto lo identifica.

Comandos preparados para Codex (gate externo):

```bash
npx playwright install firefox webkit
```

Después, `openRubik({browser:'firefox'})` y comprobar `cssTimeline: 'NOT frozen'` en la procedencia.

## Re-ejecución independiente y correcciones (20/11, otra sesión, misma base `02712b5`)

| Hallazgo | Medida | Causa | Corrección |
|---|---|---|---|
| Prueba 1 (`canvas3d`, `flyToRoom rom_kid`) roja: 3 huellas distintas en ejecuciones distintas (`069f9adb…`, `d6ca3e97…`, `e43c19df…`) | Diagnóstico de 3 sesiones: 15/31 fotogramas distintos, ≤ 22 px, Δ 27, en una franja de 7 px; cámara y estado idénticos | El recorte del rectángulo del lienzo incluía la píldora semitransparente `#hint3d`, cuya esquina antialiasada varía según la composición de capas | `canvas3d` aísla el lienzo (hoja temporal con `visibility`). Diagnóstico repetido: **0/31 distintos** en 3 sesiones, dos veces |
| Alcance `window`: no es byte a byte | 6–8 fotogramas por pareja; peor caso 0,85 % del lienzo, Δ 52; **0 px fuera del lienzo** | Bordes y apilado de las etiquetas CSS2D y de `#hint3d` sobre el WebGL. Las banderas de composición síncrona no lo corrigen (se mantienen) | Contrato medido `WINDOW_CONTRACT` + `windowEquivalent()`; la prueba 2 lo aplica fotograma a fotograma |
| Prueba 5 roja: `REALTIME_TIMEOUT` en un `runFor` legítimo | Plazo de 5 s superado con SwiftShader | Plazo de la prueba demasiado justo | `realtimeMs` de la prueba a 20 s; la cota de la llamada bloqueada pasa a < 40 s |
| `EQUIVALENCIA.md` citado y ausente | — | — | Escrito |
| Las evidencias usaban 960×600, donde el lienzo mide 960×139 | `AUDITORIA-UX-VISTA3D/` | La guía del recorrido ocupa unos 230 px | Las evidencias visuales nuevas se hacen a 1440×900; 960×600 queda solo en las pruebas de huella |

## Bloqueo `FloorPlanPresentation.stop()` + `settle` (resuelto)

- **Causa reproducida** (`evidence/determinismo/bloqueo-stop-ANTES.log`): después de una captura, el reloj virtual queda en pausa. `page.evaluate(() => FloorPlanPresentation.stop())` **devuelve** la promesa asíncrona de `stop()`, y Playwright la espera. Esa promesa depende de temporizadores del reloj virtual en pausa, así que nunca se resuelve. Aislado no ocurría, porque el reloj todavía no estaba en pausa. La causa estaba en el llamante, la demo de E, no en RUBIK.
- **Corrección:**
  - **toda** interacción con la página (`evaluate`, `screenshot`, `clock.runFor` y la acción de captura) tiene un plazo máximo en **tiempo real**: `realtimeMs`, 60 s por defecto, con error `REALTIME_TIMEOUT`;
  - `act()` lanza acciones de la app sin esperar sus promesas;
  - `advanceUntil` admite `signal` para cancelar;
  - `close()` mata el proceso del navegador si no cierra en 10 s y siempre cierra el servidor.
- **Prueba de regresión:** el mismo patrón falla en menos de 15 s con `REALTIME_TIMEOUT`; con `act()` + `advanceUntil`, la presentación se detiene y llega al reposo; el cierre queda acotado.

## Demo A/B final (después de las correcciones de CSS y HDR)

`evidence/demo-ab-final/` contiene `determinism.json`, `manifest.json` (A), `manifest-run-b.json`, `demo.json`, `fly-sequence-sheet.png` y `stills-fly-sheet.png`.

| Secuencia | Alcance | A = B |
|---|---|---|
| `enter3d` | window | **idéntica** (`54a86dbcfad2…`) |
| `flyToRoom` | canvas3d | **idéntica** (`6f7136385b25…`) |
| `presentationNext` | canvas3d | **idéntica** (`3e9a9aa80e44…`) |
| stills `every:0.2` | canvas3d | **idénticos** |

Todas terminan en reposo de OP-02 (`loopActive=false`). Rendimiento en SwiftShader: p50 de 0,6 a 1,7 s por fotograma.

## Orden de aplicación, riesgos y reversión

- **Orden:** después de E (núcleo puro) y antes de los adaptadores de B.
- **Riesgos:**
  - la API de RUBIK usada (`View3D.flyToRoom`, `lifecycleMetrics`, `cameraState`, `presentationLight`, `presentationPose/RestorePose`, `FloorPlanPresentation`) es pública pero no está contratada;
  - si aparecen otros recursos asíncronos en tiempo real, deben añadirse a `settle`;
  - CDP solo existe en Chromium.
- **Reversión:** borrar los archivos nuevos. Ningún archivo existente de RUBIK cambia.
