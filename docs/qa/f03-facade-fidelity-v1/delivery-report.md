# F03 — Informe de entrega Facade Fidelity V1

## 1. Resultado ejecutivo

Se ha implementado `F03/facade-material@1`, una receta `VISUAL_ONLY`, reversible y desactivada por defecto. Los tres paquetes PBR prioritarios tienen derivados web reproducibles. `white_stucco` está integrado en `wal_ref-w18` (5,38 × 2,80 m), el único paño del fixture cuya asignación `surface-white-plaster-02` es compatible.

La inspección de las capturas B/C muestra grano, rugosidad y microsombras perceptibles en D1 y continuidad en el paño completo F1, sin el aclarado de la primera iteración. Se conservan cámara, exposición, luz, geometría y tonalidad media. No se observaron costuras, inversión del relieve ni degradación de las carpinterías en las vistas generadas.

Esto es una mejora visual candidata, no aprobación humana. La cobertura real es una malla compatible; no se ha sustituido el acabado de muros sin asignar ni del hormigón para simular una cobertura mayor.

## 2. Base y publicación

- Repositorio: `Juanmaes83/floorplan-3d`.
- Rama: `feat/f03-facade-material-fidelity-v1`.
- Base documental: `6b8d9f33cbf5ada5f4e210777f195a73e4ddfa1c`; incluye F02 `fe876c1c2016beafba48f1993b5c23ecb82f6814`.
- Runtime y evidencias de este informe: `1cb022df26b35e6f373a71a5baf3ff49f07691a0`.
- Publicación de evidencias verificada: `94d18e90f2ac928b507665d03e59ee9ca6725153`; el HEAD final se registra en `progress.md`.
- PR draft: [#169 — F03: fidelidad material reversible de fachadas](https://github.com/Juanmaes83/floorplan-3d/pull/169), base `master`.
- Sin merge, deploy ni cambios en ramas ajenas. PR #167 permanece intacta.

## 3. Materiales y procedencia

| Material | Derivados | Integración | Decisión |
|---|---|---|---|
| `white_stucco` | HERO 1024 + balanced 512; albedo, normal y rugosidad | `wal_ref-w18` | Selección automática compatible al activar F03 |
| `white_rough_plaster` | HERO 1024 + balanced 512; albedo, normal y rugosidad | Ninguna automática | Variante experimental por desconchones; exige `allowExperimentalVariant:true` |
| `rough_plaster_03` | HERO 1024 + balanced 512; albedo, normal y rugosidad | Ninguna automática | Variante experimental por variación parda; preset alternativo `surface-plastered-wall-03` |

Hay 18 WebP, con digest agregado reproducible `7ef8b46f3efad7c0642fec87451a082ffc59a7f27d5c0eb1d44ec559e4628fb3`. Albedo es sRGB; normal OpenGL Y+ y rugosidad son datos lineales. Rugosidad se replica en RGB para su lectura en G por Three.js. Displacement permanece OFF y sin derivado runtime.

Los otros diez materiales no tienen sus tres canales complementarios publicados; no se integraron. Los cuatro JPG históricos tampoco están disponibles. No se añadieron EXR al catálogo ni se relajaron sus validaciones. KTX2/BasisU quedó fuera al no existir una cadena local verificada.

Fuentes, hashes, formatos, tamaños y controles: [manifiesto de derivados](../../../assets/materials/f03/derivatives-manifest.json), [auditoría fuente](../../../assets/materials/f03/source-audit.json) e [informe PBR](pbr-conversion-report.md).

## 4. Evidencia visual

Comparadores: A = F02 OFF/F03 OFF; B = F02 ON/F03 OFF; C = F02 ON/F03 ON. La evaluación principal es B/C. Se publicaron 21 capturas desktop y 6 móvil emulado, con hashes de los PNG originales y de los WebP entregados.

- [Hoja general A/B/C](evidence/facade-abc/1cb022df26b35e6f373a71a5baf3ff49f07691a0/desktop-contact.webp): D1, M1, M2, M3, F1, G1 y control F02-M1.
- [Detalle de material B/C](evidence/facade-abc/1cb022df26b35e6f373a71a5baf3ff49f07691a0/D1-material-detail.webp).
- [Control de ventana F02 B/C](evidence/facade-abc/1cb022df26b35e6f373a71a5baf3ff49f07691a0/F02-window-control.webp).
- [Móvil emulado A/B/C](evidence/facade-abc/1cb022df26b35e6f373a71a5baf3ff49f07691a0/mobile-contact.webp).
- [Manifiesto visual](evidence/facade-abc/1cb022df26b35e6f373a71a5baf3ff49f07691a0/evidence-manifest.json).

D1 acredita el microrelieve; M1/M2/M3 y F1 permiten revisar escala, continuidad y ambas oblicuas; G1 conserva la vivienda. El control F02 permite inspeccionar jambas, marcos, vidrio y alféizar. El fixture no aporta una cubierta modelada que permita certificar un encuentro F03/cubierta; no se inventó ninguno.

La primera iteración fue rechazada por aclarado excesivo. La corrección aplica un tinte lineal derivado del acabado original y su `mapTint`, sin tocar exposición ni cámara. El gate visual continúa `VISUAL_PENDING_HUMAN`.

## 5. Matriz técnica e integridad F02

Todas las pruebas ejecutadas sobre el runtime `1cb022df…` terminaron en PASS. No se modificaron expectativas existentes ni se eliminaron tests.

| Prueba | Resultado | Evidencia/cobertura |
|---|---|---|
| `facade-fidelity.test.cjs` + `visual-families.test.cjs` | PASS 7/7 | Selección, manifiesto, calibración y regresión unitaria |
| `facade-fidelity-smoke.browser.test.cjs` | PASS | 1 malla F03, 12 ventanas F02, proyecto/geometría intactos |
| `facade-fidelity-visual.browser.test.cjs` | PASS | 21 desktop + 6 móvil; controles A/B/C |
| `visual-families-smoke.browser.test.cjs` | PASS | Coexistencia F02 |
| `hero-fidelity-v2.browser.test.cjs` | PASS | Regresión Hero/F02 |
| `hero-fidelity-v2-coverage.browser.test.cjs` | PASS | 12/12 ventanas compatibles conservadas |
| `hero-fidelity-v2-systems.browser.test.cjs` | PASS | Sistemas de carpintería sin regresión |
| `hero-fidelity-v2-lifecycle.browser.test.cjs` | PASS | Lifecycle F02 sin regresión |
| `facade-fidelity-lifecycle.browser.test.cjs` | PASS | 3 ON/OFF, perfiles, rebuild, fallback, reingreso y contexto perdido |
| `facade-fidelity-performance.browser.test.cjs` | PASS | Desktop y móvil emulado, B/C equivalentes |

FAIL: 0. SKIP dentro de las suites ejecutadas: 0. Móvil físico y tiempo real de GPU: NOT_TESTED. El 404 del fallback es deliberado y es el único error de consola admitido en esa prueba.

Hashes conservados en smoke, visual y lifecycle:

- Proyecto serializado: `aa66a50a6543cf551f77a32c06e4ffc4920f00d63349d252c05673a70173a54c`.
- Geometría constructiva `renderedGeometry`: `43a9322ac095262cb968d151106124639b0d7e9552a8d9725928fa933fb8c696`.

No se editaron `js/visual-families-core.mjs`, `js/visual-families-adapter.mjs` ni los mecanismos `F02/window-assembly@2`. F03 excluye por identidad las mallas poseídas por F02 y no dispone sus recursos.

Manifiestos completos: [lifecycle](evidence/technical/1cb022df26b35e6f373a71a5baf3ff49f07691a0/lifecycle-manifest.json) y [rendimiento](evidence/technical/1cb022df26b35e6f373a71a5baf3ff49f07691a0/performance-manifest.json).

## 6. Rendimiento y lifecycle

Entorno: Chromium 153.0.8010.53, Windows, ANGLE/NVIDIA GeForce RTX 5070 Ti. B y C mantienen la misma iluminación y exposición. Las cifras son de una ejecución, no un estudio estadístico entre equipos.

| Medida | Desktop HERO B | Desktop HERO C | Móvil emulado balanced B | Móvil emulado balanced C |
|---|---:|---:|---:|---:|
| RAF p50 / p95 | 16,7 / 16,8 ms | 16,7 / 16,8 ms | 16,7 / 16,8 ms | 16,7 / 16,8 ms |
| Draw calls | 2816 | 2816 | 1313 | 1313 |
| Triángulos | 416504 | 416504 | 184512 | 184512 |
| Geometrías | 1190 | 1191 | 1184 | 1185 |
| Texturas renderer | 26 | 29 | 26 | 29 |
| Bytes de texturas F03 | 0 | 2077204 | 0 | 413160 |
| Transferencia F03 observada, manifiesto incluido | 0 | 2105133 | 0 | 441089 |
| GPU estimada F03 con mipmaps | 0 | 16777218 B | 0 | 4194306 B |
| Carga F03 | 0 ms | 201 ms | 0 ms | 54,7 ms |

Cambio HERO → balanced: 60,9 ms. Cada ON crea una geometría UV, un material y tres texturas compartidas; cada OFF deja los contadores propios en cero. Tras tres ciclos se registraron 15 disposals acumulados (5 por ciclo) y los contadores de render volvieron al baseline. Rebuild, salida/reingreso y pérdida de contexto conservaron proyecto y geometría.

`requestAnimationFrame` mide intervalos de presentación, no ejecución GPU. La memoria GPU es una estimación del manifiesto, no lectura del driver. Móvil significa viewport/emulación Chromium 390 × 844, no dispositivo físico.

Presupuesto inicial medido para esta receta: como máximo los recursos observados de una variante activa —3 texturas, 1 material, 1 geometría por malla compatible, 2.078 MB de texturas HERO y 16.778 MB estimados con mipmaps— sin aumento de draw calls/triángulos. Ampliar materiales simultáneos o cobertura exige repetir medición; no se extrapola este resultado a otras viviendas.

## 7. Riesgos y pendientes

- **P0:** ninguno observado en el alcance probado.
- **P1:** Juanma debe revisar la mejora B/C y la calibración `repeatMm=2000` / `normalStrength=0.65`; son valores visuales experimentales, no dimensiones certificadas por la fuente.
- **P1:** sólo `wal_ref-w18` es compatible en el fixture. Ampliar cobertura requiere asignaciones reales compatibles o una decisión humana, nunca sustitución silenciosa.
- **P1:** falta validación en móvil físico y medición GPU real; también falta una escena con cubierta para revisar ese encuentro.
- **Deuda no crítica:** 27 escenas independientes por debajo del objetivo histórico de 36; los otros diez paquetes siguen sin canales complementarios publicados; KTX2 podría reducir coste si se valida una cadena compatible.

## 8. Estado

`READY_FOR_HUMAN_REVIEW`: rama, evidencias y PR draft #169 publicadas. Esta etiqueta no implica aceptación visual, merge ni deploy.
