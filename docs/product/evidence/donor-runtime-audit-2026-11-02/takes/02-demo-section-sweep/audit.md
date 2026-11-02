# 02 · Section Sweep — runtime audit

## ¿Qué problema profesional o de cliente resuelve?

Permite explicar a un cliente cómo la sección A-A de una casa en pendiente se corresponde con estancias habitables, recorridos entre niveles y relación con el jardín. El dibujo se abre, se materializa, se recorre y vuelve a ser la misma lámina. La casa, las cotas, fechas solares y el CTA son contenido authored del donor, no datos de Rubik.

## Identidad y evidencia

- Rubik baseline `0f9c6ead9732901681498efec326d1ca92e42ffe`; branch `audit/donor-runtime-7x14-2026-11-02`.
- Donor `Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6`; selector `https://sam1983aing.github.io/flat-to-3d/#02`; standalone/final `https://sam1983aing.github.io/flat-to-3d/02-section-sweep/index.html`.
- RAW `C:\Users\temp123\donor-runtime-audit-RAW-2026-11-02\02-demo-section-sweep`; cada viewport tiene vídeo forward/reverse/semantic, telemetry forward/reverse, 5%-samples y A0/B/A1. Las muestras no son milestones.
- Herramientas: agent-browser 0.41.1, Chrome 153.0.8010.53, ffmpeg 8.1.2; DPR real en manifest.
- Tras detectar `window.__st` en el source, Discovery se repitió para registrar pasivamente capítulo, cámara, FOV, scanX y front. Los intentos iniciales permanecen en run-state.

## Evolución observada A→B

| Milestone | Cambio observado | Inicio / centro / fin nativo aproximado | Source causal |
|---|---|---|---|
| M01 | The orthographic section gains perspective while the same floor plates, stair and glazing remain aligned. | 0.01 / 0.05 / 0.07 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:02-section-sweep/main.js:62-100,210-239; draw.js:75-123 |
| M02 | The same opened three-level section acquires material, landscape and an orange CAD cut-plane annotation. | 0.07 / 0.1 / 0.13 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:02-section-sweep/main.js:219-260,529-550; draw.js:75-123 |
| M03 | The eye-level camera approaches the open face and reads upper, entrance and lower rooms through the same cut. | 0.13 / 0.16 / 0.19 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:02-section-sweep/main.js:101-145,235-253; house.js:1-80 |
| M04 | The camera enters the entrance-level living space and turns toward its continuous stair. | 0.18 / 0.21 / 0.24 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:02-section-sweep/main.js:101-145,147-206,235-253 |
| M05 | The route reaches the upper study with its desk, book wall and section drawing. | 0.25 / 0.29 / 0.32 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:02-section-sweep/main.js:101-145,147-206,470-478 |
| M06 | The camera crosses the upper lounge beside the long glazed wall. | 0.32 / 0.35 / 0.38 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:02-section-sweep/main.js:101-145,147-206,470-478 |
| M07 | The mezzanine edge reveals the entrance-level living room and exterior below. | 0.38 / 0.4 / 0.43 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:02-section-sweep/main.js:101-145,147-206,470-478 |
| M08 | The camera descends the same stair toward the lower garden level. | 0.45 / 0.49 / 0.52 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:02-section-sweep/main.js:101-145,147-206 |
| M09 | The route crosses the lower lounge with its sofa, sideboard and garden-side light. | 0.52 / 0.56 / 0.59 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:02-section-sweep/main.js:101-145,147-206,470-478 |
| M10 | The camera enters the lower bedroom and reveals the garden through the glazed facade. | 0.61 / 0.65 / 0.69 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:02-section-sweep/main.js:101-145,147-206,470-478 |
| M11 | The route passes outside the lower glazed facade and reads the house from the garden. | 0.7 / 0.75 / 0.79 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:02-section-sweep/main.js:101-145,147-206,251-253 |
| M12 | The camera returns toward the entrance-level living room while the same art, stair and furniture remain recognizable. | 0.78 / 0.81 / 0.86 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:02-section-sweep/main.js:101-145,147-206,251-253 |
| M13 | The camera withdraws to a materialized section and the orange cut-plane annotation reappears. | 0.88 / 0.9 / 0.94 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:02-section-sweep/main.js:235-260,529-550; draw.js:75-123 |
| M14 | The materialized section flattens into the original technical sheet and the ending editorial copy begins. | 0.94 / 0.96 / 0.99 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:02-section-sweep/main.js:235-260,442-511; draw.js:75-123 |

A es una sección técnica casi ortográfica con cotas, rayos solares dibujados y título. El lente se abre sin perder alineación de forjados, escalera y huecos; un frente espacial sustituye tinta por material. La ruta recorre salón, estudio, mezzanine, descenso, planta de jardín y exterior. Retorna por la misma casa hacia el corte y la lámina con copy final. B se comprobó tras wheel adicional y estabilización, sin nueva transformación importante. La telemetría desktop sitúa capítulos aproximados en swing 0–.07, sweep .07–.125, walk .126–.879, rev .879–.97 y end .97–1; no se equipara ese porcentaje físico con semántica por sí solo.

## Reverse, restore y viewports

El reverse B→A se ejecutó con wheel natural, sin reload, reset ni función interna. Se retira el copy final, reaparece el corte material, la cámara recorre de vuelta las estancias y regresa al dibujo inicial. A0/A1 son `VISUALLY_EQUIVALENT` en los tres viewports; el runtime pasivo vuelve a swing, scanX 40 y front false, pero no expone la identidad de recursos internos de material/luz.

| Viewport | Soporte | Observación |
|---|---|---|
| 1440×900 desktop | SUPPORTED | Lámina, barrido, estancias y retorno legibles. |
| 390×844 portrait | SUPPORTED | Ruta y reverse completos con encuadre vertical adaptado. |
| 844×390 landscape | DONOR_LIMITATION | El título y la lámina se solapan; la página mantiene layout desktop por su media query de aspecto. El recorrido sigue funcionando. |

## Reconciliación por mecanismo

M01–M02: `main.js:62-100,209-260` transforma una cámara de 0.12°/distancia extrema en sección con perspectiva; `draw.js:21-220` compone normal, profundidad, ID y render lit por `scanX`. Cut 1 D05/D08 había acreditado los mecanismos y Global conserva D05-C1 REIMPLEMENT, D08-C1 ADAPT, rechazo de IDs/curvas/escena authored. El runtime confirma la continuidad de los mismos elementos.

M03–M12: `walkKeys/buildWalk/walkPose` controla la ruta authored y los room labels; `story(y)` decide front visibility y capítulos. Cut 2 D13 distingue la autoridad de ruta Rubik de la coreografía donor. Rubik tiene sección dinámica, Story y plan/choreography de ruta, pero no se acredita que el spline fijo del donor sea una ruta válida para un proyecto arbitrario. El posible handoff es `ORCHESTRATION_GAP`, condicionado a selección y entrada reales.

M13–M14: `story(y)` invierte el frente material y el swing; `hud` recompone lámina y copy. El retorno observado es compatible con source y Cuts; el comentario source de continuidad C1 de la curva no sustituye el límite matemático ya documentado en Global D08. No se registra conflicto nuevo ni se reescribe ningún Cut.

El crosswalk de las 12 dimensiones, gaps, bridge candidates con `implementationAuthorized:false`, dependencias técnicas y QA derivada están en `manifest.json`. Los bridges son hipótesis técnicas para revisión, sin selección de producto ni orden de implementación.

## Known unknowns

La identidad interna de render targets/shaders/sombras tras reverse y el timing óptico exacto de sunbeams son `NON_BLOCKING` explícitos. Ninguno se presenta como evidencia observada ni impide reconstruir la experiencia esencial.
