# 01-c · Floor by Floor — runtime audit

## ¿Qué problema profesional o de cliente resuelve?

Ayuda a un cliente o revisor a comprender la organización vertical de un edificio de madera authored y cómo se ocupa el estudio del nivel 3 mientras el nivel 4 queda separado y después desciende. La frase “one week each”, el núcleo estirado y el número fijo de niveles pertenecen a esta demo; no son datos de otro proyecto ni prueba de una secuencia de obra real.

## Identidad y evidencia

- Rubik baseline `0f9c6ead9732901681498efec326d1ca92e42ffe`; branch `audit/donor-runtime-7x14-2026-11-02`.
- Donor `Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6`; selector `https://sam1983aing.github.io/flat-to-3d/#01:2`; standalone/final `https://sam1983aing.github.io/flat-to-3d/01-exploded-house/index.html?dir=c`.
- Source `01-exploded-house/dir-c.js`, `main.js`, `core.js`; Cut 2 §22 D09 y Global D09.
- RAW `C:\Users\temp123\donor-runtime-audit-RAW-2026-11-02\01-c-floor-by-floor`; vídeos forward/reverse/semantic y telemetry por viewport. Las muestras del 5 % son DISCOVERY_SAMPLE, no milestones.
- Tooling agent-browser 0.41.1, Chrome 153.0.8010.53, ffmpeg 8.1.2, DPR real 1.

## Evolución observada A→B

| Milestone | Cambio observado | Inicio / centro / fin nativo aproximado | Source causal |
|---|---|---|---|
| M01 | The concrete ground group lands and the first timber level is highlighted while the upper stack remains apart. | 0.05 / 0.09 / 0.13 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:01-exploded-house/dir-c.js:74-115,209-233 |
| M02 | The second authored timber level closes its vertical gap with the lower stack. | 0.11 / 0.15 / 0.18 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:01-exploded-house/dir-c.js:74-115,209-233 |
| M03 | The furnished third level settles toward its base while its desks and columns stay attached. | 0.16 / 0.22 / 0.3 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:01-exploded-house/dir-c.js:114-188,209-233 |
| M04 | The lower levels now read as one stack, with the fourth level and roof visibly held above the furnished studio. | 0.3 / 0.35 / 0.4 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:01-exploded-house/dir-c.js:210-238 |
| M05 | The camera leaves the axon and dives toward the exposed studio gap below the suspended upper level. | 0.4 / 0.48 / 0.56 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:01-exploded-house/dir-c.js:213-222; core.js:312-348 |
| M06 | The camera reaches eye level among the third-level desks and columns while the upper soffit still hangs above. | 0.54 / 0.61 / 0.68 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:01-exploded-house/dir-c.js:213-222,239-265 |
| M07 | The highlighted level-four soffit descends toward the same columns over the occupied studio. | 0.7 / 0.76 / 0.82 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:01-exploded-house/dir-c.js:210-233 |
| M08 | The overhead gap closes into a ceiling over the same third-level workspace. | 0.8 / 0.85 / 0.9 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:01-exploded-house/dir-c.js:210-251 |
| M09 | The camera traverses the now enclosed timber studio, preserving the column grid, desks and facade relation. | 0.87 / 0.95 / 1 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:01-exploded-house/dir-c.js:213-265 |

A muestra ground, cuatro niveles y cubierta separados. El apilado de los niveles inferiores termina con el estudio del tercero legible y un gran hueco superior. La cámara se introduce bajo la planta suspendida; el techo/sofito del cuarto nivel baja sobre la misma retícula de columnas y mesas. B es el estudio cerrado visto desde dentro. Wheel adicional tras la estabilización no mostró otra transformación importante. La bajada de cubierta figura en LAND del source, pero queda oculta desde la cámara interior: no se presenta como milestone runtime independiente.

## Reverse / restore / viewports

El reverse B→A fue continuo con wheel natural, sin reload ni reset. Reabrió el hueco, devolvió la cámara al axon y separó los niveles. A0/A1 son visualmente equivalentes en los tres viewports; no se observó identidad interna de objetos/recursos, así que `VISUALLY_EQUIVALENT` es el veredicto.

| Viewport | A→B→A | Soporte | Observación |
|---|---|---|---|
| Desktop 1440×900 | 0→8100→0 | SUPPORTED | Niveles, gap, entrada, descenso superior y estudio legibles. |
| Portrait 390×844 | 0→7596→0 | SUPPORTED | Mismo recorrido y reverse, con encuadre más estrecho. |
| Landscape 844×390 | 0→3510→0 | DONOR_LIMITATION | Layout desktop solapa/corta nav, etiquetas, modelo y radar; la evolución funciona. |

## Reconciliación

M01–M04: `dir-c.js:210-245` calcula offsets Y absolutos de seis grupos con GAP/LAND; ground y tres niveles descienden mientras nivel 4/roof esperan. Labels/dashes siguen posiciones actuales. La continuidad la dan la misma planta del estudio, columnas, núcleo y envolvente. Cut 2 §22 D09 lo había acreditado con source/probes y muestras; el vídeo completo amplía timing y móvil.

M05–M09: `dir-c.js:213-222` fija cámara axon→ojo y recorrido por el nivel 3; `main.js:120-184` suaviza scroll. LAND baja nivel 4 sobre la cámara; el núcleo global se escala como solución visual authored, no conexión estructural. Global D09-C1/C2 declara que Rubik ya tiene lectura compacta/despiece por niveles y lifecycle; C3 rechaza core/ciudad/seis grupos como verdad y C4 conserva unresolved el handoff general a una ruta. El crosswalk de 12 dimensiones está en el manifest.

El gap concreto es `INTEGRATION_GAP` si algún servicio futuro necesitara continuar desde un nivel elegido a una estancia/ruta válida. Story, Building, room descent y player ya existen. El bridge documental de lectura de niveles es `REUSE_EXISTING`; el handoff permanece `UNRESOLVED`, `implementationAuthorized:false`. No se decide servicio, prioridad ni fusión. No se encontró conflicto nuevo runtime/source/Cut.

## Known unknowns y QA derivada

El estado interno exacto tras reverse y la bajada de la cubierta oculta desde la cámara interior son `NON_BLOCKING` explícitos. El manifest deriva invariantes futuros sobre IDs reales, recomposición, ruta validada, restore, mobile y regresión. No se implementó nada.
