# OP-02 · CI dirigida sobre `f34ad8e`

El HEAD de producto es `f34ad8ef79ea5f3232b90ffafb55319e4e140590`. [OP-02 6/6](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44393395796/job/135116770578), [Studio Presentation 3/3](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44393395327/job/135116769356) y [NAV3D 4/4](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44393395751) están acreditados. La comparación de controles con `master` conserva cuatro fallos históricos y registra cero nuevos.

| Caso | Control y causa observada | Comprobación acotada |
|---|---|---|
| M09, restauración de cámara, luces y texturas | En [master `163df68`](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44376274358/job/135056360237) pasa la suite. En `f34ad8e`, la traza capturó 11 texturas antes de Presentation y 12 al restaurar. Cámara, 1.189 geometrías, superficies listas y luz de editor restauradas. La referencia se tomó antes de que un frame cargara la última textura en WebGL. | Se espera el frame invalidado antes de tomar la referencia. Se conserva la igualdad estricta de memoria, cámara y luces. [Traza](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44397035100/job/135129591425) · [Prueba dirigida verde](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44397741667/job/135132084631). |
| Fachada animada, pausa y reanudación | El caso original pasa 1/1 en master `163df68` en Docker Linux con Node 22.13 y Chromium 1234. También pasa la suite de [#265](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44376274358/job/135056360184). En `f34ad8e`, la primera pausa quedó en `p=0.4961375` y el observador pausó de nuevo en ese mismo valor porque el umbral fijo `0.3` ya se había superado. | Se espera avance real por encima del punto de pausa. Se conserva la comprobación de progreso y restauración mediante Back. [Traza](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44397035100/job/135129589890) · [Prueba dirigida verde](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44397741667/job/135132084838). |
| P15, diez ciclos de Presentation | [Master](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44376274358/job/135056359965) pasa 58/58, incluido P15. En el [TAP de `f34ad8e`](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44393396166/job/135121158387), los cuatro campos de liberación son correctos y la comparación falla por el campo añadido `renderedFrames`. | La candidata restaura la forma del contrato y expone el contador aparte. La prueba histórica intacta pasó en Windows sobre `e52df68`, en 65,21 s, con memoria estable en 1.189 geometrías y nueve texturas. GitHub acreditó P15 y la prueba de órbita que lee el contador. [Validación dirigida verde](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44398138362/job/135133511609). |

Los ajustes están en la rama aislada `codex/verify-op02-ci-delta`, [candidata `e52df68`](https://github.com/Juanmaes83/floorplan-3d/commit/e52df68d85c9a53042615dfed2ce58f0893803de). El SHA de #266 conserva sus checks originales, con tres fallos y tres jobs en curso al cierre de esta revisión. Cada ejecución nueva se limitó a los casos fallidos o a la aserción cuyo acceso a telemetría cambió.

## Tiempo de ejecución y duplicidades observadas

La espera es `job.started_at − run.created_at`. Para un job dependiente, se mide desde la conclusión de su prerrequisito y se indica. La ejecución del job cuenta desde `started_at` hasta `completed_at`, incluida preparación. El tiempo de prueba corresponde al paso de test o grabación. Son duraciones de reloj en jobs paralelos, por lo que no se suman como tiempo de entrega ni como minutos facturados.

| Ejecución | Espera | Job | Prueba o grabación |
|---|---:|---:|---:|
| #265, último check de Presentation | 78 min 02 s | 39 min 33 s | 34 min 21 s |
| #266, suite M09 original | 9 min 09 s | 6 min 11 s | 5 min 31 s |
| #266, suite de fachada original | 10 min 11 s | 6 min 02 s | 5 min 24 s |
| #266, histórico P15 y su archivo | 2 min 28 s tras `guard` | 15 min 18 s | 14 min 34 s |
| #266, vídeo NAV3D | 4 min 47 s | 23 min 11 s | 1 min 13 s. Instalación, 21 min 29 s |
| Ajuste dirigido M09 | 3 min 46 s | 1 min 14 s | 32 s |
| Ajuste dirigido de fachada | 3 min 14 s | 1 min 13 s | 36 s |

Se identificaron **13 archivos** programados tanto en la matriz de Presentation como en los shards históricos de #266. Al revisar los TAP históricos y los jobs de matriz concluidos, se confirmaron **12 ejecuciones duplicadas** sobre el mismo HEAD, con el mismo archivo, Node 22.13, Playwright 1.62.1, Chromium y `RENDER_TIME_SCALE=3`. El histórico añade un límite por archivo. Los doce son edificio, axonometría, lote, contacto, encuadre, luz, minimapa, vista general, revelado, ruta, sección y visita. Al corte, el job de matriz del decimotercer archivo, `presentation.browser.test.cjs`, aún se ejecutaba. Los controles de `master` tienen un SHA distinto y quedan fuera del recuento. [Matriz](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44393396075) · [Históricos](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44393396166).

[#260](https://github.com/Juanmaes83/floorplan-3d/pull/260) acredita por separado una invocación duplicada de siete casos dentro del mismo job de CAT-IA, con una mediana de 1,671 s ahorrados en siete comparaciones pareadas. Su corte tiene alcance sobre esa invocación.
