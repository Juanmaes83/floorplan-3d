# Informe — Correcciones del examen M2/S4 y experiencia guiada para un usuario novato (misión 2)

## A. Identidad

| Concepto | Valor |
|---|---|
| Rama de correcciones | `feat/ft3d-8-m2-s4-correcciones-2026-11-06`, creada desde `49e8feb`. |
| **Código corregido y probado** | `1620ba6af25d5ec793759225b183265f47f30d0b`. Es el SHA de la ronda 3. |
| Código examinado (antes) | `49e8feba2e3aad03a25fb602248758e39dbe3b3c`. La rama M2 original **no se ha modificado**. |
| Examen de referencia | Rama `qa/ft3d-8-m2-examen-final-2026-11-06`, commit `5e0fc42`. **No se ha modificado**: conserva el registro del examen tal cual se hizo. |
| Entorno | Chrome for Testing 153 con Playwright 1.63.0, SwiftShader, Linux con 4 vCPU y Node 22. |
| No hecho | No hay merge a master ni PR. No se ha desplegado en Production. Ninguna rama de otros agentes se ha tocado. No se han activado ni BCCA gestionada ni servicios de pago. Los datos son sintéticos. |

## B. Bucle seguido: corregir → probar → grabar → revisar como novato → repetir

| Ronda | Código | Examen (189 comprobaciones) | V4 hallazgos | V5 novato | Qué se aprendió y se corrigió después |
|---|---|---|---|---|---|
| Examen | `49e8feb` | 170 PASS · **15 FAIL** | 1 PASS · **10 FAIL** | — | Los 14 defectos D-01…D-14. |
| 1 | borrador | 183 PASS · 2 FAIL | 9 · 1 FAIL | 14 PASS | El borrado del plan en uso; el aviso de recarga en la prueba; Escape cuando el foco no está en el iframe; el control de cubierta. Revisión de novato: N-01…N-14. |
| 2 | borrador | 184 PASS · 1 FAIL | 10 PASS | 19 PASS | El foco no entraba en la Evolución y Escape cerraba el espacio de trabajo oculto (N-15). El recorrido no terminaba nunca (N-09). Jerga «C1-C4» visible para el cliente (N-11). |
| **3** | **`1620ba6`** | **185 PASS · 0 FAIL** · 3 PARTIAL · 1 NOT_RUN | **10 PASS** | **19 PASS** | — (ver sección E) |

Las rondas 1 y 2 conservan solo sus resultados JSON (`ronda-1/`, `ronda-2/`). Las evidencias completas (capturas, vídeos V1–V5 y entregas) son las de la **ronda 3**, en `ronda-3/evidencias/`.

## C. Defectos del examen: estado tras la corrección

| ID | Sev. | Defecto | Corrección | Prueba de cierre (ronda 3) |
|---|---|---|---|---|
| D-02 | P1 | No se podían cambiar los elementos de una tarea guardada; aparecía un error en inglés. | Al actualizar una tarea se descartan los campos heredados de la 0.1.0 (`elementIds`/`budgetItemIds`). Ningún error del motor llega sin traducir al usuario. | EX-04.C4, V4.C4 y V4.C4b: **PASS** |
| D-01 | P2 | Un total parcial se rotulaba «Total». | «Total parcial (faltan N partidas)». | EX-02.A7 y V4.A7: **PASS** |
| D-03 | P2 | No había forma de eliminar un plan. | «Eliminar plan» con confirmación que explica qué cambia (también para el plan en uso). Cuando hay cambios sin guardar, aparece deshabilitado y dice por qué. | EX-03.11 y V4.11: **PASS** |
| D-04 | P2 | Los precios manuales no quedaban en el historial. | Se anotan con su origen «manual», el precio anterior y el nuevo, y la revisión antes y después. | EX-04.B7 y V4.B7: **PASS** |
| D-05 | P2 | Recargar perdía el plan sin aviso. | Aviso del navegador mientras el plan tiene cambios sin guardar. | EX-03.12 y V4.12: **PASS** |
| D-06 | P2 | «Entregar» quedaba oculto a 390 px (M2-UX-MOB-02). | Los pasos caben (sin flechas) y el paso enfocado se desplaza a la vista. | EX-11-m.3 y V4.MOB02: **PASS** |
| D-07 | P3 | Áreas táctiles por debajo de 44 px. | 44 px con puntero táctil. | EX-11-m.2, EX-11-m.4 y V4.m4: **PASS** |
| D-08 | P3 | Foco tras Escape en el plan. | El foco vuelve al botón aunque este se haya pintado de forma asíncrona. | EX-11-k.3 y V4.k3: **PASS** |
| D-09 | P3 | Escape dentro de la Evolución. | Escape funciona dentro del iframe y en toda la página. Además, al abrir la Evolución el foco entra en ella. | EX-11-k.4 y V4.k4: **PASS** |
| D-10 | P3 | La copia de una tarea no quedaba señalada. | Se señala antes de redibujar. | EX-03.6b y V4.6b: **PASS** |
| D-11 | P3 | La barra de RUBIK se desbordaba con zoom al 125–150 %. | El título va en una línea con elipsis y los pasos sin flechas por debajo de 1180 px. | EX-11-z1.25.4 y z1.5.4: **PASS** |
| D-12 | P3 | Textos sin tildes para el cliente. | Ortografía corregida; la prueba de Gate D que leía el texto se actualizó de forma explícita. | ft3d-8-delivery |
| D-13 | P3 | Sin selección 3D por teclado. | Intro y Mayús+Intro recorren los elementos y abren el mismo panel, con un anuncio `aria-live`. Las flechas siguen moviendo el día. | EX-05.K: **PASS** |
| D-14 | P3 | Sin control de cubierta dentro de RUBIK. | Conmutador **INTERIOR** junto a las vistas. | EX-05.R: **PASS** |

## D. Experiencia de usuario novato

Ver `matriz-experiencia-novato.md`, con los hallazgos N-01…N-17 y el recorrido V5.

Lo principal es el **Recorrido de obra**, en Presupuestar y en Entregar. Ofrece:
- 5 pasos en el orden del trabajo: precios → plan → vínculos → evolución → entrega;
- el **estado real** de cada paso, por ejemplo «11 de 11 partidas con precio» o «2 de 2 trabajos con elementos · 2 con partidas»;
- **una única acción principal** en el siguiente paso;
- al cerrar cada diálogo, el recorrido se actualiza y el foco pasa al nuevo siguiente paso.

Complementos:
- muros y huecos rotulados con su estancia;
- buscador de elementos;
- casillas legibles;
- textos llanos, sin créditos técnicos ni jerga interna.

Un usuario sin ningún dato completa el proceso de principio a fin (portada → copia → precios → plan con 2 trabajos y un hito → Evolución → vídeo y presentación descargada) y termina con **5 de 5 pasos hechos**. Comprobaciones N.1–N.14 y N.M1–N.M2: **19/19 PASS**. El recorrido está grabado en `ronda-3/evidencias/v5-novato.webm`.

## E. Lo que no está en verde (se dice tal cual)

| ID | Estado | Motivo |
|---|---|---|
| EX-05.3 | PARTIAL | El arnés no alcanza con el ratón los muros de carga del fixture (T02) en las 5 vistas probadas, ni siquiera sin cubierta. Con el teclado sí se seleccionan todos los elementos (D-13). La causa no está demostrada. |
| EX-09.10 | NOT_RUN | PNOA/MDT05 no se cargan en este examen. |
| EX-11-k.6 | PARTIAL | Se detecta el movimiento reducido, pero no se ha medido cuadro a cuadro. |
| EX-13 / QA-22 | PARTIAL | Medido hasta unos 1200 elementos sin GPU; no es hardware de cliente. |

## F. Regresión de las suites existentes sobre `1620ba6`

Las 18 suites se ejecutaron en secuencia y sin concurrencia sobre `1620ba6`: **1037 PASS · 0 FAIL** (4 omitidos por las propias suites). Es el mismo resultado que sobre `49e8feb` en el examen: no hay regresiones.
- 895 pruebas puras; m2-s4 14/14; Gate D 49/49; M1 11.
- budget-ui, economic-dossier, professional-workspace 17, professional-entry, project-first, site-analyze, parcel y territory-integration.
- brand, quantity-schedule, presentation-section 7 y presentation-story 8.
- Detalle en `regresion/`.

Ningún workflow de GitHub se dispara con esta rama, así que la CI remota no ha corrido. Todo lo anterior se ejecutó en local con Chromium.

## G. Decisiones que siguen siendo del propietario

- **M2-GATE-09** (revisión visual del propietario), sobre todo del nuevo Recorrido de obra y del conmutador INTERIOR.
- **DEC-05, DEC-06 y DEC-07.**
- **Unir el recorrido guiado general con el de obra.** Toca `guide-core`.
- **Integración con master `0cfe6a5`.** Riesgo INT-R1 sin probar.
- **QA-21 y QA-22.**
- **La Preview de esta rama.** Se generará en Vercel al subirla, pero no se ha probado de forma interactiva desde este entorno.

Este informe no declara FT3D-8 terminado ni aprobado comercialmente.
