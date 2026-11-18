# SCULPT OP-02 · SOURCE EXACT y baseline

**Piedra canónica OP-02** · Renderizado eficiente y rendimiento · OpenPlan3D · Muy alta. [Cartera y plan maestro v1.12](https://github.com/Juanmaes83/floorplan-3d/blob/341624b79ed2cb8bb6c4df38073deeeccbb35f33/docs/product/sculpt-openplan3d-roomgpt-2026-11-18.md#cartera-de-openplan3d-y-roomgpt) · [Handoff F0/G-02](https://github.com/Juanmaes83/floorplan-3d/blob/341624b79ed2cb8bb6c4df38073deeeccbb35f33/docs/integration/HANDOFF-F0-G02-SCULPT-2026-11-18.md).

## Fuente y pruebas originales

- [`Juanmaes83/openPlan3D@771c9e1ad30bd1c3cc7584d6eca74deb2e14943d`](https://github.com/Juanmaes83/openPlan3D/tree/771c9e1ad30bd1c3cc7584d6eca74deb2e14943d), [MIT](../openplan3d-771c9e1/LICENSE). La rama remota `main` del donante y el checkout aislado coinciden en ese SHA.
- [Manifiesto SHA-256](SOURCE-EXACT.sha256) relativo a `labs/sculpt/openplan3d-771c9e1) e [índice de blobs Git y dependencias](SOURCE-EXACT.json). Hay 43 entradas, 36 nuevas y siete reutilizadas, entre ellas la licencia y el lockfile. El snapshot G-02 de `6dadcbb75c2fa28930007658e3521e91c8d261a5` se conserva como padre. El índice cubre el cierre de nueve archivos de los módulos aislables y las importaciones directas de sus consumidores. Para ejecutar las pruebas se usa el checkout completo del donante.
- Pasaron **76/76 pruebas Vitest** en nueve suites y **5/5 en Chromium**. Se reutilizó la compilación del checkout fijado. El navegador usa Playwright 1.63.0 y cubrió reposo y despertar 2D/3D, arrastre táctil, imágenes tardías, cambios visuales, metadatos, historial y walkthrough.
- [Informe de render en reposo](../openplan3d-771c9e1/docs/reviews/2026-09-07-idle-rendering.md) · [Protocolo de rendimiento](../openplan3d-771c9e1/docs/reviews/2026-09-07-rendering-benchmarks.md). Sus métricas describen el donante y sus condiciones.

```text
node node_modules/vitest/vitest.mjs run tests/draw-scheduler.test.ts tests/scene-signature.test.ts tests/stair-levels.test.ts tests/stairwell.test.ts tests/custom-model-placement.test.ts tests/furniture-elevation.test.ts tests/orbit-damping.test.ts tests/walkthrough-motion.test.ts tests/render-benchmark.test.ts
node node_modules/@playwright/test/cli.js test --project=chromium tests/browser/viewer-idle.spec.ts tests/browser/viewer-invalidation.spec.ts tests/browser/canvas-idle.spec.ts
```

## Clasificación para el corte

| Bloque | Decisión | Aplicación |
|---|---|---|
| `drawScheduler.ts` y consumidor `FloorPlanCanvas.svelte` | KEEP como evidencia de coalescencia y cancelación | Las pruebas acreditan el uso en 2D. El comportamiento del visor 3D se toma del consumidor correspondiente. |
| `ThreeViewer.svelte`, `requestRender`, `markSceneDirty` y `animate` | GENERALISE | Un frame pendiente, despertar explícito y continuidad mientras cambie la cámara, una animación o un recurso. Mantener las autoridades de cámara y WebGL de RUBIK. |
| `orbitDamping.ts` y `walkthroughMotion.ts` | Probar KEEP del comportamiento temporal | Comparar la amortiguación y el reloj tras reposo con la navegación, colisiones y entrada vigentes. |
| `sceneSignature.ts`, plantas, escaleras y encuadre | REPLACE del contrato, KEEP del criterio de equivalencia | RUBIK separa arquitectura, mobiliario y rótulos. Probar el delta sobre esas firmas y conservar los cambios en plantas visibles, alturas, aperturas y cámara. |
| Carga asíncrona, texturas y restauración de contexto | KEEP de las invalidaciones | Despertar al aplicar malla o textura, actualizar luz, tamaño o contexto. Cancelar callbacks de vistas o cargas obsoletas. |
| Catálogo, geometría Svelte y montaje del donante | REMOVE de la adaptación | Scene, Three.js, estados de edificio y capturas de RUBIK siguen siendo la fuente de verdad. |

## Baseline de RUBIK

[Medidor reproducible](measure-rubik.cjs) y [mediciones sin agregar](rubik-baseline-163df68.json) sobre `master@163df68e83a80ddf11a008d573ee257d51c1821f`. Las sondas se añaden solo a la respuesta HTTP local del medidor.

```text
node labs/sculpt/op-02/measure-rubik.cjs <worktree-RUBIK> <salida.json>
```

Usar Node 22 y Playwright 1.62.1 con `NODE_PATH` apuntando a Playwright y `CHROME` a su Chromium. El escritorio usa 1440×900 a DPR 1 y el perfil táctil 390×844 a DPR 2 con entrada táctil emulada por Chromium. Las escenas son un plano vacío, el ejemplo amueblado con un GLB autorizado y el edificio de dos plantas en vista apilada. Hay dos muestras por combinación y 1.500 ms en reposo. Se registran callbacks del bucle, renders de escena, intervalos, tiempos de envío y de tarea del hilo del navegador, primer frame con cámara distinta tras pulsar, reconstrucción y carga del GLB. Los conteos de texturas describen recursos vivos. El ensayo usa SwiftShader y no mide GPU física, batería ni un móvil real.

Media de dos muestras por fila, Windows 11 Pro y Chromium 151, con un Ryzen 9 9900X.

| Escena | Renders/s en reposo, escritorio / táctil | Tarea en reposo, % de tiempo del hilo, escritorio / táctil | Pulsación a cámara distinta, ms, escritorio / táctil | Reconstrucción de arquitectura en entrada, ms, escritorio / táctil |
|---|---|---|---|---|
| Vacía | 56,4 / 45,2 | 4,9 / 4,2 | 16,4 / 17,1 | 9,0 / 9,5 |
| Amueblada | 3,4 / 3,9 | 4,2 / 4,5 | 205,0 / 648,8 | 22,9 / 28,3 |
| Multiplanta | 28,2 / 25,6 | 6,0 / 5,0 | 33,4 / 117,3 | 353,1 / 272,5 |

En las 12 ventanas de reposo se observó un render por callback y cero reconstrucciones. La carga del GLB tardó 310,3 ms en escritorio y 314,5 ms en táctil. Los intervalos p95 durante el arrastre están en el JSON, junto con los tiempos y conteos de texturas. Los valores de SwiftShader y las duraciones de entrada emulada describen esta ejecución. La columna de pulsación mide la primera respuesta con cámara distinta del bucle continuo, que sirve de referencia para medir el despertar de OP-02.

`View3D` mantiene el bucle mientras la vista 3D está activa. `sync()` ya gobierna las reconstrucciones por firmas separadas. La comparación funcional deberá fijar resolución, DPR, calidad y trayectorias y repetir los mismos recorridos de apariencia. Al mover las sondas al nuevo bucle, conservar los límites de cada contador y acreditar por separado las cargas de texturas y la fidelidad visual.

## Gate y continuidad

La adaptación funcional, su PR y su Preview quedan condicionados al cierre de G-02. El workflow específico de [#265 en `b9f4b3c1489a45f4a1dbdde5f27ecd26ac8f8c43`](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44376274089) pasó 6/6, 3/3 de Chromium y auditoría CAD. Verificar los checks generales y la revisión humana antes de esculpir sobre el master efectivo autorizado.

Probar cero callbacks en reposo estable y un primer fotograma correcto tras despertar. Cubrir animaciones y puertas, Dibujo vivo, cámaras, Studio Presentation, Asset Lab, capturas y tours, edificios, evolución de obra, texturas e interacción táctil. Capturar con la misma escena y cámara. Acreditar GPU y móvil físicos por separado si están disponibles. El rollback será el revert de un único corte funcional. OP-04 conserva su propio alcance.

### Cadena F0

Se simularon con `git merge-tree` [#262](https://github.com/Juanmaes83/floorplan-3d/pull/262) `69ae552` → [#263](https://github.com/Juanmaes83/floorplan-3d/pull/263) `6be42e52` → [#264](https://github.com/Juanmaes83/floorplan-3d/pull/264) `748e43d0` sobre master. Árboles sucesivos sin conflicto: `aa17e76941d05d340332b9072e48007d3a8e089b`, `47284ea0abd5b3b1580b96fb8213073623f45d64` y `c588c503401055698abfb229bcdbeeebf006d2c8`. La simulación de #265 sobre esa cadena también es compatible, árbol `587355924b156cc87e1fc5c2508f54f6632aa38b`. Revalidar al cambiar los SHA. #260 conserva su corte independiente.
