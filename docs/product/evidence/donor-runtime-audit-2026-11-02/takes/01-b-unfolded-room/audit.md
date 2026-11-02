# 01-b · Unfolded Room — runtime audit

## ¿Qué problema profesional o de cliente resuelve?

Permite explicar a un cliente cómo las seis superficies de una cocina concreta, sus huecos y su mobiliario se relacionan con el recinto construido y con la experiencia de entrar en él. La hoja, las cotas, el norte y los códigos de acabado son datos authored del donor; no prueban una hoja técnica calculada para cualquier proyecto. La evidencia de servicio es el recorrido continuo desktop, portrait y landscape, además de la descripción del source pinneado.

## Identidad y control

- Rubik baseline: `0f9c6ead9732901681498efec326d1ca92e42ffe`; branch `audit/donor-runtime-7x14-2026-11-02`.
- Donor: `Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6`; selector `https://sam1983aing.github.io/flat-to-3d/#01:1`; standalone/final `https://sam1983aing.github.io/flat-to-3d/01-exploded-house/index.html?dir=b`.
- Source: `01-exploded-house/dir-b.js`, `main.js`, `core.js`; Cut 2 §24 D11, §28 C2-CC2 y Global D11.
- RAW: `C:\Users\temp123\donor-runtime-audit-RAW-2026-11-02\01-b-unfolded-room`; manifest, hashes y keyframes seleccionados acompañan este informe. Las muestras cada ~5 % son DISCOVERY_SAMPLE, no milestones.
- Herramientas: agent-browser 0.41.1, Chrome 153.0.8010.53, ffmpeg 8.1.2, DPR 1 en cada viewport.

## Evolución observada A→B

| Milestone | Cambio observado | Inicio / centro / fin nativo aproximado | Source causal |
|---|---|---|---|
| M01 | The developed sheet fades behind the floor and the room contents gain depth while the footprint remains fixed. | 0.06 / 0.1 / 0.18 | 01-exploded-house/dir-b.js:199-202,262-283 |
| M02 | The west sideboard wall rotates upward around its floor edge with attached joinery. | 0.12 / 0.18 / 0.24 | 01-exploded-house/dir-b.js:106-115,198-229 |
| M03 | The kitchen wall rises around the same floor edge; the cabinets and tile remain associated with it. | 0.19 / 0.25 / 0.31 | 01-exploded-house/dir-b.js:106-115,198-229 |
| M04 | The window wall and its seat rotate into the room boundary without losing the opening. | 0.26 / 0.32 / 0.38 | 01-exploded-house/dir-b.js:106-115,138-149,198-229 |
| M05 | The door wall rises, preserving the same opening and floor geometry. | 0.33 / 0.39 / 0.45 | 01-exploded-house/dir-b.js:106-115,150-166,198-229 |
| M06 | The ceiling pivots down over the four erected walls, enclosing the kitchen. | 0.42 / 0.49 / 0.56 | 01-exploded-house/dir-b.js:110-115,198-229 |
| M07 | All six authored surfaces read as one closed room; sheet and introductory copy have faded. | 0.52 / 0.56 / 0.62 | 01-exploded-house/dir-b.js:198-237,263-283 |
| M08 | The camera changes from near-parallel axonometric to eye-level view at the same door wall. | 0.62 / 0.7 / 0.75 | 204-215; core.js:312-348 |
| M09 | The same door opens and the camera crosses its opening into the room. | 0.75 / 0.79 / 0.84 | 204-230; core.js:312-348 |
| M10 | The camera faces the sage kitchen, dining table, tile and pendant inside the assembled room. | 0.83 / 0.88 / 0.94 | 204-248; core.js:312-348 |
| M11 | The final view reaches the window bench while the kitchen and room surfaces remain continuous. | 0.94 / 0.99 / 1 | 204-248; core.js:312-348 |

El estado A es la cocina desarrollada sobre una hoja. La transición primero da profundidad al suelo/contenido, luego levanta cuatro paredes por aristas; el techo, hijo de la pared norte, cierra el recinto. La cámara pasa de casi paralela a perspectiva, se acerca a la misma puerta y entra a ver la cocina y el banco de ventana. El estado B muestra el banco bajo la ventana; wheel adicional después de estabilización no reveló otro cambio importante. Cada milestone tiene screenshot de una segunda sesión limpia y tiempos aproximados en el manifest; los vídeos Discovery preservan los intervalos completos.

## Reverse, restore y viewports

Se grabó B→A con wheel natural y sin reload/reset. Los tres viewports volvieron a scrollY 0, route/hash iniciales y composición de hoja inicial. A0/A1 son visualmente equivalentes; el estado interno exacto de objetos/recursos es `NOT_OBSERVED`, así que el veredicto es `VISUALLY_EQUIVALENT`. No se identificó milestone exclusivo del reverse; se observa salida de cámara, apertura de techo/paredes y regreso de hoja.

| Viewport | A→B→A | Soporte | Observación |
|---|---|---|---|
| Desktop 1440×900 | 0→8100→0 | SUPPORTED | Hoja, plegado, puerta, cocina y ventana legibles. |
| Portrait 390×844 | 0→7596→0 | SUPPORTED | Plegado y visita completos; varias anotaciones pequeñas o fuera del encuadre. |
| Landscape 844×390 | 0→3510→0 | DONOR_LIMITATION | Usa layout desktop: nav, texto, radar y modelo se solapan/cortan. Evolución y reverse siguen operando. |

## Reconciliación milestone → source → Cuts/Atlas → Rubik

M01–M07: `dir-b.js:106-115,198-283` define pivotes cardinales, FOLD/GROW absolutos, door y overlays hijos/decals. La misma puerta, ventana, suelo, cocina y mesa continúan entre las caras de la hoja y la caja. Cut 2 §24 D11 documentó este mecanismo y sus límites; el vídeo continuo lo confirma y amplía con timing y móvil. C2-CC2 ya precisó el attach inicial, lid hijo y ocho decals frente al resumen Atlas. No emerge conflicto nuevo.

M08–M11: `dir-b.js:204-248` fija poses de cámara y UI para puerta, cocina y ventana; `core.js:312-348` interpola la cámara, mientras `main.js:120-184` suaviza el progreso de scroll. El paso por la puerta es de la misma habitación. Rubik tiene geometría Project/Building, cámara, Story, room descent, UI, outputs y lifecycle existentes; la ruta y coordenadas authored no son autoridad de otro proyecto.

El crosswalk de 12 dimensiones y las evidencias por source/viewport están en `manifest.json`. El gap técnico es asociación comprobada room→face/opening/shared owner y una representación temporal con bisagras/annotations que consuma Story sin crear otro modelo editable. Global D11-C1 indica REIMPLEMENT, C2 ADAPT y C3 REJECT; el bridge queda sólo como candidato documental `REIMPLEMENT_MECHANISM`, `implementationAuthorized:false`. No hay decisión de producto, fusión ni orden de implementación.

## Unresolved y QA derivada

Permanece abierto, como `NON_BLOCKING`, el estado interno exacto tras reverse. Se registraron A0/A1, vídeos, telemetry y source; una verificación de identidad exigiría snapshot read-only acotado. El manifest deriva invariantes futuros de semántica, opening/face ownership, continuidad, cámara, restore, móvil, accesibilidad y regresión; esta auditoría no los implementa.
