# Informe final — Examen integral M2/S4 (FT3D-8) · 06/11/2026

> Auditoría QA independiente. **En esta auditoría no se ha corregido, fusionado ni publicado nada.**
> El objetivo era encontrar los defectos reales, no conseguir una entrega en verde.

---

## A. Identidad, SHA y entorno

| Concepto | Valor |
|---|---|
| **Código examinado** | `49e8feba2e3aad03a25fb602248758e39dbe3b3c`, rama `feat/ft3d-8-m2-s4-integracion-2026-11-06`. La rama no se ha modificado. |
| master contrastado | `0cfe6a5f09ffddf35221dc0175e24b75b246bde0`. El encargo citaba `8401894`, que ya no es la cabeza de master: es ancestro de `0cfe6a5` (PR #174). |
| Referencias verificadas | M1 `970ca54`, Gate D `b12b925` y rama documental `7ee4243`: coinciden con lo declarado. |
| Rama de la auditoría | `qa/ft3d-8-m2-examen-final-2026-11-06`, creada desde `49e8feb`. Solo contiene tests, fixtures, documentos y evidencias. **El SHA del commit de evidencias es distinto del SHA examinado.** |
| Navegador | Chrome for Testing 153.0.8010.12 (Chromium) con Playwright 1.63.0. Render por SwiftShader, sin GPU. |
| Sistema | Linux 6.18 x86_64, 4 vCPU, 15 GB de RAM, Node v22.23.4. |
| Servidor | HTTP local propio sobre el árbol `49e8feb`. Todo host externo queda abortado. El Catastro se intercepta con un GML sintético y nunca se consulta. |
| **Preview de Vercel** | READY en `49e8feb` según la API. **No se ha probado de forma interactiva**: el entorno no la alcanza (protección y red). No se eludió la autenticación y no se crearon enlaces de compartición. |
| Datos | Todos sintéticos (`obra-sintetica.md`). No hay clientes, precios ni parcelas reales. |
| Vídeos | V1 escritorio, V2 economía, V3 móvil y V4 hallazgos (escritorio y móvil), en `evidencias/*.webm`. |

## B. Resumen de conteos

| Conjunto | PASS | FAIL | PARTIAL | BLOCKED | NOT_RUN | Total |
|---|---|---|---|---|---|---|
| **Escenarios del examen** (20) | 10 | 8 | 2 | 0 | 0 | 20 |
| **Comprobaciones del examen** | 170 | 15 | 3 | 0 | 1 | 189 |
| Comprobaciones del vídeo 4 (reproducción de hallazgos) | 1 | 10 | — | — | — | 11 |
| **Regresión de suites existentes** (18 suites en secuencia) | 1037 tests | **0** | — | — | 4 omitidos por la propia suite | — |

**Defectos:** 0 P0 · **1 P1** · 5 P2 · 8 P3, es decir, 14 defectos (`defectos-y-deuda-tecnica.md`). A eso se suman 6 riesgos de integración (`integracion-y-riesgos.md`) y 11 elementos de deuda técnica.

## C. Proyecto (identidad, aislamiento, plan y edificio)

| Bloque | Resultado |
|---|---|
| Biblioteca sintética: 4 entradas, el sujeto activo se identifica por id y dos proyectos comparten nombre visible | PASS (EX-01) |
| **Aislamiento** entre A y B con el mismo nombre, antes y después de recargar: planes, entregas, historial y precios separados | **PASS** (EX-06, 6/6) |
| 10 tareas y el hito creados **por la UI**; fechas guardadas sin mover; dependencias FS/SS/FF/SF con desfases de −2 a +5 | PASS (EX-02.T, P1–P3) |
| Validaciones: ciclo, FS incumplida, reparto por encima del 100 %, borrar una tarea con sucesores, cerrar con cambios sin guardar | PASS (EX-03.1–3.9) |
| Duplicar el plan | PASS (EX-03.10) |
| Duplicar una tarea | PASS; **la copia no queda señalada** (D-10, intermitente) |
| **Eliminar un plan desde la UI** | **FAIL** (D-03): no existe |
| **Recargar con cambios sin guardar** | **FAIL** (D-05): se pierden sin aviso |
| **Editar los elementos de una tarea ya guardada** | **FAIL P1** (D-02): error técnico en inglés y el cambio no se aplica |
| Edificio de dos plantas: DEC-06 (sin reparto ni total de edificio) y DEC-07 (presupuesto frente a revisión «no comprobable») | **PASS** (EX-08, 11/11) |
| Catastro/GML: asociación, CRS no admitido, caída simulada (503), cambio de proyecto y geometría restringida fuera del HTML | PASS (EX-09, 10/11) |
| PNOA/MDT05 | **NOT_RUN** (sin capas en este examen) |
| Robustez: versión desconocida, registro corrupto, presupuesto sin precios | PASS (EX-12, 6/6) |

## D. Economía

Detalle completo en `presupuestos-revisiones.md`.

- **Aritmética exacta, al céntimo, en A, B y C** frente a una referencia independiente: líneas, IVA por línea, repartos por restos mayores y ausencia de doble contabilización. Revisión A: 21 601,18 € de neto conocido con IVA de 2 160,12 €. Revisión B: 22 287,44 €.
- Funciona bien:
  - las partidas sin precio son desconocidas, nunca 0;
  - la unidad incompatible se bloquea;
  - la BCCA gestionada sigue bloqueada;
  - la tarifa BC3 se aplica con vista previa y confirmación, y queda en el historial;
  - la invalidación de entregas nombra la causa (presupuesto, plan o firma).
- Fallos:
  - **D-01 (P2):** un presupuesto parcial se rotula «Total 23.761,30 €»;
  - **D-04 (P2):** los cambios manuales de precio no entran en el historial;
  - **D-02 (P1):** en la revisión C no se puede cambiar el elemento de T07.

## E. Recorridos de extremo a extremo

| Prueba | Resultado |
|---|---|
| **5.1** Cambiar el precio desde la Evolución, volver y recargar | **PASS completa** (R0–R7): misma fecha y tarea, coste de T04 recalculado a 4 486,28 €, revisión desactualizada y valor persistido tras recargar. |
| **5.2** Seleccionar con clic real en 3D y usar los botones del panel | Parcial, con defectos: tabique T04 (abrir partida, volver, «Ver en el plan», «Ver trabajo»), suelo T09 y muro sin tarea en **PASS** con clics reales. Muro de carga T02 inalcanzable con el ratón (PARTIAL). **D-14:** no hay control de cubierta en RUBIK. **D-13:** no hay alternativa de teclado. |
| Evolución 4D día a día | **PASS** (EX-07): tareas activas igual al motor cada día, retroceso exacto, cimentación sin geometría en la tarjeta, andamio rotulado como ilustración. |
| Entrega MP4 y HTML con marca | **PASS** (EX-10, 12/12): MP4 H.264 indexado válido de 1280×720 y 463 muestras; HTML abierto sin controles editables; «obra prevista»; histórico conservado; invalidación por plan, presupuesto y firma. Además, el texto de cliente va sin tildes (D-12). |

## F. QA técnica

**Regresión.** Las 18 suites en secuencia sobre `49e8feb` dan **1037 tests en PASS y 0 en FAIL**:
- 895 pruebas puras;
- m2-s4 14/14 y Gate D 49/49;
- M1 11 y budget-ui;
- professional-workspace 17, professional-entry, project-first, site-analyze, parcel, territory-integration, brand y quantity-schedule;
- presentation-section 7 y presentation-story 8.

El detalle está en `regresion/`.

**Rendimiento (QA-22, PARTIAL).**

| Medida | Resultado |
|---|---|
| Carga de la app | 841 ms |
| Abrir la Evolución | 687 ms con 152 elementos; 765 ms con unos 421; 1004 ms con unos 841 |
| Desplazamiento por día | ≤ 3,7 ms |
| Heap | 25, 59 y 100 MiB en los tres tamaños |
| Guardar el plan | 89 ms con la vivienda; 395 ms con x8 |

Esto se ha medido en 4 vCPU con SwiftShader. **No representa el hardware del cliente** y no hay prueba de resistencia larga.

**Otros resultados:**
- ningún error JavaScript en ningún escenario;
- la única red del producto es la local; Chromium intentó conectar por su cuenta con `www.google.com` y el proxy lo rechazó, sin relación con la app.

**Deuda técnica** (11 puntos, con detalle en `defectos-y-deuda-tecnica.md`):
- 31 `catch{}` vacíos;
- errores del motor en inglés visibles para el usuario;
- solo `localStorage`, con 24 claves;
- sin `beforeunload`;
- campos heredados de la versión 0.1.0;
- `index.html` de 5022 líneas;
- la Evolución en un iframe;
- esperas fijas en los tests;
- Playwright 1.62.1 en CI frente a 1.63.0 aquí;
- CI sin árbol combinado con master;
- textos sin tildes.

## G. UI/UX

| Bloque | Resultado |
|---|---|
| Escritorio 1280×720, 1366×768, 1440×900 y 1920×1080: visor, transporte, tarjeta y Gantt dentro de la ventana, sin scroll | **PASS** (4/4) |
| Zoom al 125 % y al 150 %: composición según Gate D (al 150 %, disposición apilada con scroll vertical) | PASS |
| La barra de RUBIK con zoom al 125 % y al 150 % | **FAIL** (D-11) |
| Móvil 390×844 y 844×390: sin scroll horizontal; tocar «Entregar» funciona | PASS |
| **M2-UX-MOB-01** (mensaje del pie comprimido) | **No se reproduce, PASS** |
| **M2-UX-MOB-02** («Entregar» oculto a 390 px) | **Confirmada, FAIL** (D-06) |
| Áreas táctiles de 36–38 px | FAIL (D-07) |
| **M2-UX-DEMO-03** | Se revisó la composición del recorrido demo en V1/V3 (recorrido completo, sin bloqueos). No hay un criterio medible propio en el Anexo D: **queda para la revisión visual del propietario**. |
| Teclado | Diálogo y pestañas con teclado en PASS. **Foco tras Escape** FAIL (D-08). **Escape dentro de la Evolución** FAIL (D-09). Movimiento reducido detectado (PASS); su aplicación cuadro a cuadro, PARTIAL. |
| **M2-GATE-09** | **RESERVADO AL PROPIETARIO.** Este examen no lo cierra ni lo propone como cerrado. |

## H. Defectos

| ID | Sev. | Resumen |
|---|---|---|
| D-02 | **P1** | No se pueden cambiar los elementos de una tarea guardada; aparece un error técnico en inglés. |
| D-01 | P2 | Un presupuesto parcial se rotula «Total». |
| D-03 | P2 | No hay «Eliminar plan» en la UI (y el límite es de 6 planes). |
| D-04 | P2 | Los precios manuales no entran en el historial. |
| D-05 | P2 | Recargar pierde el plan sin aviso. |
| D-06 | P2 | M2-UX-MOB-02: «Entregar» queda oculto a 390 px. |
| D-07 | P3 | Áreas táctiles por debajo de 44 px. |
| D-08 | P3 | El foco no vuelve al botón «Plan de obra». |
| D-09 | P3 | Escape dentro del iframe de la Evolución no funciona. |
| D-10 | P3 | La copia de una tarea no queda señalada (intermitente). |
| D-11 | P3 | La barra de RUBIK se desborda con zoom al 125–150 %. |
| D-12 | P3 | Textos de cliente sin tildes. |
| D-13 | P3 | La selección 3D no tiene alternativa de teclado. |
| D-14 | P3 | No hay control de cubierta en RUBIK; el interior queda tapado. |

Cada ficha incluye pasos, resultado esperado y real, evidencia, causa (demostrada o probable), módulo, propuesta **no implementada** y prueba de cierre.

**Correcciones del arnés durante el examen**, declaradas por transparencia; ninguna rebaja una aserción:
- EX-10 empezaba con otro proyecto activo;
- EX-11 pulsaba la UI con la Evolución abierta;
- EX-05 usaba el centro de la caja del elemento, luego una rejilla y después una búsqueda densa con raycast real en tres vistas;
- EX-05.K daba un PASS falso porque el panel seguía abierto;
- la comprobación de zoom se reescribió según la especificación aprobada de Gate D y se añadió la comprobación de la barra, que sigue fallando.

## I. Gates y decisiones pendientes (abiertos y explícitos)

| Gate o decisión | Estado |
|---|---|
| **M2-GATE-09** (revisión visual del propietario) | **PENDIENTE**, del propietario. |
| DEC-05, DEC-06 y DEC-07 | El comportamiento implementado se ha verificado (EX-08), pero **la decisión sigue abierta** y es del propietario. |
| FT8-S4-10 (Kimi) | No examinado: no se pueden tocar ramas de otros agentes. |
| PR #166 (acceso remoto de clientes) | **No integrada**; fuera del examen. |
| BCCA gestionada (rubik-managed) | **Bloqueada**, y así se comprobó (EX-04.B0). No se activó. |
| QA-21 | **NOT_RUN**. |
| QA-22 | **PARTIAL** (hasta unos 1200 elementos, sin GPU). |
| Integración con master `0cfe6a5` | **Pendiente.** Sin conflictos textuales, pero el comportamiento combinado no se ha probado (INT-R1, ciclo de vida de `View3D`). |
| Preview de Vercel | READY, pero **no probada de forma interactiva**. |
| Seguridad comercial y uso con clientes reales | **No evaluada ni autorizada.** |

## J. Conclusiones

**1. ¿El código `49e8feb` hace lo que promete M2/S4?**
En lo esencial, sí:
- identidad y aislamiento por proyecto;
- economía exacta al céntimo;
- vuelta a la Evolución tras cambiar un precio, también después de recargar;
- 4D día a día coherente con el motor;
- DEC-06/07 aplicadas;
- Catastro resiliente;
- entrega MP4 y HTML verificable con invalidación.

La regresión completa está en verde. Pero hay **un P1** (no se pueden revisar los elementos de una tarea guardada) y **cinco P2** que afectan a la confianza en los datos y al trabajo del usuario:
- total parcial rotulado como «Total»;
- historial de precios incompleto;
- sin forma de eliminar planes;
- pérdida al recargar;
- «Entregar» oculto en móvil.

**2. ¿Está listo para que lo use un cliente real sin acompañamiento?**
**No.** Primero hay que cerrar el P1 y los P2, que el propietario revise M2-GATE-09 y que se prueben integrados con master (INT-R1). La Preview no se ha probado de forma interactiva desde este entorno.

**3. ¿Qué falta exactamente para poder decidir?**
- Corregir D-02 y D-01, D-03, D-04, D-05 y D-06, cada uno con la prueba de cierre de su ficha.
- Que el propietario decida M2-GATE-09 y DEC-05/06/07.
- Ejecutar las suites de M2 y de Hybrid V2/Section sobre un árbol combinado con master, en una rama de integración autorizada.
- Hacer QA-21 y QA-22 en hardware real.
- Revisar la Preview con acceso autorizado.

Este informe no declara FT3D-8 terminado ni aprobado comercialmente.
