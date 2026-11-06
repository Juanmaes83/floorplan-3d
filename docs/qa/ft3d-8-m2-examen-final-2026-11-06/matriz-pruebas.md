# Matriz de pruebas — Examen final M2/S4

**SHA examinado:** `49e8feba2e3aad03a25fb602248758e39dbe3b3c` · **Navegador:** Chromium 153.0.8010.12 · **Generada:** 2026-11-06T16:25:08.429Z

| Conjunto | Escenarios | Comprobaciones |
|---|---|---|
| Examen (EX-01…EX-13) | PASS 10 · FAIL 8 · PARTIAL 2 | PASS 170 · FAIL 15 · PARTIAL 3 · NOT_RUN 1 |
| Vídeo 4 (reproducción de hallazgos) | FAIL 2 | FAIL 10 · PASS 1 |

Estados: PASS (cumple), FAIL (defecto), PARTIAL (cubierto en parte; motivo indicado), BLOCKED (no ejecutable por causa externa), NOT_RUN (fuera de este examen; motivo indicado).

## EX-01 · Línea base y biblioteca sintética — **PASS**

Área: Biblioteca. Notas: Inventario real vivienda principal: {"wall:new":70,"window:new":12,"door:new":6,"sliding-door:new":2,"opening:new":2,"floor:undeclared":13,"roof:new":1,"object:furniture":46}

| ID | Comprobación | Estado | Observado (si no PASS) |
|---|---|---|---|
| EX-01.1 | La biblioteca contiene las 4 entradas sintéticas | PASS |  |
| EX-01.2 | El sujeto activo es la vivienda principal por id (no por nombre) | PASS |  |
| EX-01.3 | Dos entradas con el mismo nombre visible y distinta identidad | PASS |  |
| EX-01.4 | Sin errores JavaScript al cargar y recorrer las áreas | PASS |  |

## EX-02 · Recorrido completo escritorio (vídeo 1) — **FAIL**

Área: E2E. Notas: Revisión A: neto conocido 21601.18 €, IVA por línea 2160.12 €, IVA sobre total 2160.12 € (diferencia de redondeo 0 €) / Tras recargar, la evolución abre en 2027-02-28 con selección null: la fecha/tarea de la sesión anterior no se conservan entre recargas (se registran, no se exigen).

| ID | Comprobación | Estado | Observado (si no PASS) |
|---|---|---|---|
| EX-02.A1 | C1–C4 genera 12 partidas desde las cantidades | PASS |  |
| EX-02.A2-floor:mat_marble | Partida sin precio: importe desconocido, nunca 0 | PASS |  |
| EX-02.A2-opening:door | Partida sin precio: importe desconocido, nunca 0 | PASS |  |
| EX-02.A3 | Importe por línea = referencia independiente (céntimos) | PASS |  |
| EX-02.A4 | Base imponible mostrada = neto conocido de la referencia | PASS |  |
| EX-02.A5 | El total se declara incompleto (hay partidas sin precio) | PASS |  |
| EX-02.A6 | El IVA mostrado sigue la regla por línea del contrato | PASS |  |
| EX-02.A7 | Un presupuesto parcial no se rotula como «Total» sin calificarlo | FAIL | Base imponible \| 21.601,18 € \| IVA \| 2160,12 € \| Total \| 23.761,30 € |
| EX-02.T-T01 | Tarea T01 «Cimentación» creada por la UI | PASS |  |
| EX-02.T-T02 | Tarea T02 «Estructura» creada por la UI | PASS |  |
| EX-02.T-T03 | Tarea T03 «Cerramientos exteriores» creada por la UI | PASS |  |
| EX-02.T-T04 | Tarea T04 «Tabiquería interior» creada por la UI | PASS |  |
| EX-02.T-T05 | Tarea T05 «Impermeabilización» creada por la UI | PASS |  |
| EX-02.T-T06 | Tarea T06 «Aislamiento» creada por la UI | PASS |  |
| EX-02.T-T07 | Tarea T07 «Carpintería exterior» creada por la UI | PASS |  |
| EX-02.T-T08 | Tarea T08 «Fontanería» creada por la UI | PASS |  |
| EX-02.T-T09 | Tarea T09 «Pavimentos» creada por la UI | PASS |  |
| EX-02.T-T10 | Tarea T10 «Pintura y acabados» creada por la UI | PASS |  |
| EX-02.H01 | Hito «Fin de obra» (un día) creado | PASS |  |
| EX-02.P1 | Plan guardado con 11 tareas (10 + hito) | PASS |  |
| EX-02.P2 | Fechas guardadas exactamente como se introdujeron (no se mueven) | PASS |  |
| EX-02.P3 | Dependencias FS/SS/FF/SF con desfases ±, guardadas | PASS |  |
| EX-02.P4 | La puerta queda «Sin tarea» (partida sin tarea) | PASS |  |
| EX-02.E1 | Reproducir y pausar avanzan la fecha | PASS |  |
| EX-02.E2 | Clic en la fila del Gantt selecciona la tarea | PASS |  |
| EX-02.R0 | La tarjeta ofrece la partida vinculada de T04 | PASS |  |
| EX-02.R1 | Presupuestar se abre sobre la evolución en la partida | PASS |  |
| EX-02.R2 | Al volver: misma fecha | PASS |  |
| EX-02.R3 | Al volver: misma tarea seleccionada | PASS |  |
| EX-02.R4 | Al volver: el coste de T04 refleja el nuevo precio (50 % de la partida) | PASS |  |
| EX-02.R5 | La identidad (revisión del proyecto) no cambia por un cambio de precio | PASS |  |
| EX-02.R6 | La revisión declarada del plan se marca desactualizada tras cambiar el presupuesto | PASS |  |
| EX-02.R7 | Tras recargar: el coste persistido es el nuevo | PASS |  |
| EX-02.D1 | Entrega HTML local generada para el mismo proyecto | PASS |  |
| EX-02.D2 | Entregar muestra la última entrega como «corresponde al estado actual» | PASS |  |
| EX-02.Z | Sin errores JavaScript en el recorrido | PASS |  |

## EX-03 · Validaciones del Plan de obra — **FAIL**

Área: Plan.

| ID | Comprobación | Estado | Observado (si no PASS) |
|---|---|---|---|
| EX-03.1 | Una dependencia cíclica se rechaza con explicación | PASS |  |
| EX-03.2 | Fecha que incumple FS se rechaza; RUBIK no mueve fechas | PASS |  |
| EX-03.3 | Las fechas guardadas no han cambiado | PASS |  |
| EX-03.4 | La partida ya repartida al 100 % aparece deshabilitada en el selector | PASS |  |
| EX-03.5 | El motor rechaza un reparto > 100 % (no se corrompe nada) | PASS |  |
| EX-03.6 | Duplicar crea una tarea (sin elementos ni partidas) | PASS |  |
| EX-03.6b | La copia recién creada queda señalada en la tabla | FAIL | sin señalar: hay que buscarla («Fontanería (copia)») |
| EX-03.7 | La copia se elimina sin afectar al resto | PASS |  |
| EX-03.8 | No se elimina una tarea de la que dependen otras | PASS |  |
| EX-03.14 | Editar el título de una tarea con elementos y partidas existentes se guarda | PASS |  |
| EX-03.9 | Cerrar con cambios sin guardar pregunta (guardar/descartar/seguir) | PASS |  |
| EX-03.10 | Duplicar plan guarda una copia en borrador sin cambiar el plan en uso | PASS |  |
| EX-03.11 | Existe en la UI una acción para eliminar un plan guardado | FAIL | no existe en la UI (solo en el núcleo removeSchedule) |
| EX-03.12 | Recargar con cambios sin guardar en el plan avisa antes de perderlos | FAIL | se pierden sin aviso |
| EX-03.13 | Tras recargar, el plan guardado sigue intacto (11 tareas) | PASS |  |

## EX-04 · Economía: revisiones B y C (vídeo 2) — **FAIL**

Área: Economía. Notas: Los cambios de precio hechos A MANO en el diálogo de presupuesto no se anotan en el historial M2 (solo los de «Precios de referencia»); ver hallazgo si procede.

| ID | Comprobación | Estado | Observado (si no PASS) |
|---|---|---|---|
| EX-04.B0 | BCCA gestionada sigue bloqueada | PASS |  |
| EX-04.B1 | La vista previa no cambia el presupuesto | PASS |  |
| EX-04.B2 | Unidad incompatible: se bloquea y el presupuesto no cambia | PASS |  |
| EX-04.B3 | Pintura con precio de referencia 7,90 € y procedencia PINT-LISA | PASS |  |
| EX-04.B4 | El nogal queda sin precio (desconocido, no 0) | PASS |  |
| EX-04.B5 | Neto conocido = referencia independiente | PASS |  |
| EX-04.B6 | El historial registra el cambio por tarifa (antes/después y revisiones) | PASS |  |
| EX-04.B7 | Los cambios manuales de precio también quedan en un historial de revisiones | FAIL | ["paint"] |
| EX-04.B8 | Evolución: importe conocido por tarea = referencia (reparto en céntimos) y partidas sin precio señaladas | PASS |  |
| EX-04.B9 | Sin doble contabilización: suma por tareas = suma de lo asignado | PASS |  |
| EX-04.B10 | La entrega de la revisión A queda desactualizada por el presupuesto | PASS |  |
| EX-04.C1 | Reparto 60/40 aceptado (bajar primero, subir después) | PASS |  |
| EX-04.C2 | Tras reabrir: reparto 60/40 guardado | PASS |  |
| EX-04.C3 | Tras reabrir: duraciones cambiadas | PASS |  |
| EX-04.C4 | Tras reabrir: elemento de T07 cambiado | FAIL | ["project/opn_window-0","project/opn_window-1","project/opn_window-2"] |
| EX-04.C5 | Historial del plan conserva cada guardado | PASS |  |
| EX-04.C6 | La revisión declarada queda desactualizada tras B y C | PASS |  |
| EX-04.C7 | Historial de entregas: la de A se conserva y se añade la de C | PASS |  |
| EX-04.C8 | La nueva entrega corresponde al estado actual | PASS |  |
| EX-04.Z | Sin errores JavaScript | PASS |  |

## EX-05 · Selección de elementos 3D (5.2) — **FAIL**

Área: Evolución. Notas: Rejilla 39×27 en 3 vistas (ISO antes de la cubierta, PLANTA y ISO al final): 65 elementos distintos alcanzables con el ratón

| ID | Comprobación | Estado | Observado (si no PASS) |
|---|---|---|---|
| EX-05.R | Dentro de RUBIK hay un control visible para ocultar la cubierta y ver el interior | FAIL | control oculto en la vista integrada |
| EX-05.1a | Clic real sobre «T04 tabique (partida tabiquería)»: el panel muestra ESE elemento | PASS |  |
| EX-05.1b | Panel: botón de la partida vinculada | PASS |  |
| EX-05.1c | La partida se abre en Presupuestar | PASS |  |
| EX-05.1d | Al volver de Presupuestar sin cambios, el panel del elemento sigue abierto | PASS |  |
| EX-05.1e | «Ver en el plan de obra» abre la pestaña Elementos en ese elemento | PASS |  |
| EX-05.1f | «Ver trabajo» selecciona la tarea en el Gantt | PASS |  |
| EX-05.2a | Clic real sobre «T09 suelo (partidas pavimento)»: el panel muestra ESE elemento | PASS |  |
| EX-05.3 | Selección real de «T02 muro de carga (tarea sin partida)» | PARTIAL | Ningún elemento de ese grupo es visible bajo el ratón en la vista ISO final |
| EX-05.4a | Clic real sobre «muro sin tarea»: el panel muestra ESE elemento | PASS |  |
| EX-05.4b | Elemento sin tarea: el panel lo dice con naturalidad | PASS |  |
| EX-05.K | La selección de elementos 3D tiene alternativa por teclado | FAIL | {"panelAbiertoAntes":false,"panelTrasTeclado":false} |
| EX-05.Z | Sin errores JavaScript | PASS |  |

## EX-06 · Aislamiento entre proyectos — **PASS**

Área: Identidad.

| ID | Comprobación | Estado | Observado (si no PASS) |
|---|---|---|---|
| EX-06.1 | B: otro sujeto, sin plan, sin entregas, sin historial de A | PASS |  |
| EX-06.2 | B: ningún precio de A | PASS |  |
| EX-06.3 | Vuelta a A: mismo plan, mismas tareas, mismas entregas | PASS |  |
| EX-06.4 | Vuelta a A: precio de pintura de A (no el 99 de B) | PASS |  |
| EX-06.5 | Tras recargar: A y B conservan sus planes separados | PASS |  |
| EX-06.6 | Claves de registro distintas aunque los ids se parezcan (prefijo común) | PASS |  |

## EX-07 · Evolución 4D completa — **PASS**

Área: Evolución.

| ID | Comprobación | Estado | Observado (si no PASS) |
|---|---|---|---|
| EX-07.1 | Cada día: tareas activas (escena/tarjeta) = motor y cursor del Gantt = fecha | PASS |  |
| EX-07.2 | Hay días con varias tareas simultáneas | PASS |  |
| EX-07.3 | Retroceder a una fecha restituye exactamente su estado | PASS |  |
| EX-07.4 | Cimentación (sin geometría) aparece en la tarjeta | PASS |  |
| EX-07.5 | El andamio es una ilustración y no un elemento del proyecto | PASS |  |
| EX-07.6 | La tarjeta lo rotula como ilustración | PASS |  |
| EX-07.7 | Cada suelo vinculado a «Pavimentos» tiene su partida de material en la misma tarea | PASS |  |
| EX-07.8 | Composición Gate D: visor, 5 cámaras, transporte, tarjeta y Gantt | PASS |  |
| EX-07.Z | Sin errores JavaScript | PASS |  |

## EX-08 · Edificio dos plantas · DEC-06/DEC-07 — **PASS**

Área: Edificio. Notas: Partidas con el mismo id en ambas plantas (comunes conceptuales): floor:mat_wood, skirting, paint, partition-new / Entregar (edificio): Presupuesto: 5 partidas · total no definitivo · 3 aviso(s)

| ID | Comprobación | Estado | Observado (si no PASS) |
|---|---|---|---|
| EX-08.1 | Sujeto edificio con 2 plantas y planta activa | PASS |  |
| EX-08.2 | La barra de plantas permite cambiar de planta | PASS |  |
| EX-08.3 | Planta activa cambiada, mismo sujeto edificio | PASS |  |
| EX-08.4 | Cada planta tiene su propio presupuesto (sujetos distintos) | PASS |  |
| EX-08.5 | El editor explica que un plan de edificio no reparte partidas (DEC-06) | PASS |  |
| EX-08.6 | El plan de edificio ofrece elementos de ambas plantas | PASS |  |
| EX-08.7 | Partidas: presupuestos por planta listados, sin «Total del edificio» | PASS |  |
| EX-08.8 | DEC-07: presupuesto ↔ revisión del proyecto «no comprobable», nunca coincidencia | PASS |  |
| EX-08.9 | Evolución del edificio: sin reparto de importes (no inventa total) | PASS |  |
| EX-08.10 | Evolución del edificio no muestra un importe global | PASS |  |
| EX-08.Z | Sin errores JavaScript | PASS |  |

## EX-09 · Catastro, emplazamiento y resiliencia — **PARTIAL**

Área: Territorio. Notas: PNOA y MDT05: NOT_RUN en este examen (no se cargan capas ráster; requieren red/licencia y su integración no está en el alcance M2).

| ID | Comprobación | Estado | Observado (si no PASS) |
|---|---|---|---|
| EX-09.1 | GML sigue siendo la fuente por defecto | PASS |  |
| EX-09.2 | Parcela GML guardada con su referencia y CRS; la vivienda no se mueve sola | PASS |  |
| EX-09.3 | GML con CRS no admitido: rechazo con mensaje claro | PASS |  |
| EX-09.4 | Tras el rechazo, la parcela y la colocación guardadas no cambian | PASS |  |
| EX-09.5 | Servicio caído: mensaje en castellano, sin códigos | PASS |  |
| EX-09.6 | Servicio caído: la parcela guardada se conserva | PASS |  |
| EX-09.7 | Cambio de proyecto: la vivienda A no hereda la parcela | PASS |  |
| EX-09.8 | Vuelta al proyecto P: la parcela sigue igual | PASS |  |
| EX-09.9 | La entrega HTML no contiene la geometría restringida de la parcela | PASS |  |
| EX-09.10 | PNOA/MDT05 integrales | NOT_RUN | No ejecutado: sin carga de capas en este examen |
| EX-09.Z | Sin errores JavaScript | PASS |  |

## EX-10 · Entrega local y revisión histórica — **PASS**

Área: Entregar. Notas: La marca se crea con FloorPlanBrand (núcleo de Mi estudio, misma clave de almacenamiento que su UI); el formulario de Mi estudio no se ha recorrido en este escenario.

| ID | Comprobación | Estado | Observado (si no PASS) |
|---|---|---|---|
| EX-10.1 | La entrega usa la firma de Mi estudio del proyecto | PASS |  |
| EX-10.2 | Publicación remota bloqueada | PASS |  |
| EX-10.3 | MP4 generado (H.264 indexado) | PASS |  |
| EX-10.4 | El MP4 descargado es un MP4 indexado válido | PASS |  |
| EX-10.5 | El HTML abierto muestra proyecto, marca y tareas | PASS |  |
| EX-10.6 | El HTML no contiene controles editables ni la biblioteca | PASS |  |
| EX-10.7 | El HTML dice que es obra prevista (simulación), no ejecutada | PASS |  |
| EX-10.8 | Entrega anterior desactualizada: presupuesto, plan y firma nombrados | PASS |  |
| EX-10.9 | El archivo HTML descargado antes no cambia | PASS |  |
| EX-10.10 | La nueva entrega lleva la marca renombrada | PASS |  |
| EX-10.11 | Histórico: se añade una entrega y las anteriores se conservan | PASS |  |
| EX-10.Z | Sin errores JavaScript | PASS |  |

## EX-11-1280 · Escritorio 1280×720 — **PASS**

Área: UX.

| ID | Comprobación | Estado | Observado (si no PASS) |
|---|---|---|---|
| EX-11-1280.stage | stage dentro de la ventana | PASS |  |
| EX-11-1280.transport | transport dentro de la ventana | PASS |  |
| EX-11-1280.card | card dentro de la ventana | PASS |  |
| EX-11-1280.gantt | gantt dentro de la ventana | PASS |  |
| EX-11-1280.scroll | Sin scroll de página en Evolución | PASS |  |

## EX-11-1366 · Escritorio 1366×768 — **PASS**

Área: UX.

| ID | Comprobación | Estado | Observado (si no PASS) |
|---|---|---|---|
| EX-11-1366.stage | stage dentro de la ventana | PASS |  |
| EX-11-1366.transport | transport dentro de la ventana | PASS |  |
| EX-11-1366.card | card dentro de la ventana | PASS |  |
| EX-11-1366.gantt | gantt dentro de la ventana | PASS |  |
| EX-11-1366.scroll | Sin scroll de página en Evolución | PASS |  |

## EX-11-1440 · Escritorio 1440×900 — **PASS**

Área: UX.

| ID | Comprobación | Estado | Observado (si no PASS) |
|---|---|---|---|
| EX-11-1440.stage | stage dentro de la ventana | PASS |  |
| EX-11-1440.transport | transport dentro de la ventana | PASS |  |
| EX-11-1440.card | card dentro de la ventana | PASS |  |
| EX-11-1440.gantt | gantt dentro de la ventana | PASS |  |
| EX-11-1440.scroll | Sin scroll de página en Evolución | PASS |  |

## EX-11-1920 · Escritorio 1920×1080 — **PASS**

Área: UX.

| ID | Comprobación | Estado | Observado (si no PASS) |
|---|---|---|---|
| EX-11-1920.stage | stage dentro de la ventana | PASS |  |
| EX-11-1920.transport | transport dentro de la ventana | PASS |  |
| EX-11-1920.card | card dentro de la ventana | PASS |  |
| EX-11-1920.gantt | gantt dentro de la ventana | PASS |  |
| EX-11-1920.scroll | Sin scroll de página en Evolución | PASS |  |

## EX-11-zoom125 · Zoom 125 % sobre 1366×768 — **FAIL**

Área: UX.

| ID | Comprobación | Estado | Observado (si no PASS) |
|---|---|---|---|
| EX-11-z1.25.1 | Visor, tarjeta y Gantt visibles | PASS |  |
| EX-11-z1.25.4 | Barra de RUBIK sin desbordar: nombre en una línea y ningún botón cortado | FAIL | {"overflow":false,"h2Lines":2,"h2H":48,"cut":[]} |
| EX-11-z1.25.2 | Sin scroll horizontal | PASS |  |
| EX-11-z1.25.3 | Plan de obra sin desbordamiento horizontal | PASS |  |

## EX-11-zoom150 · Zoom 150 % sobre 1366×768 — **FAIL**

Área: UX.

| ID | Comprobación | Estado | Observado (si no PASS) |
|---|---|---|---|
| EX-11-z1.5.1 | Disposición apilada (Gate D): visor, tarjeta y Gantt renderizados y alcanzables con desplazamiento vertical | PASS |  |
| EX-11-z1.5.4 | Barra de RUBIK sin desbordar: nombre en una línea y ningún botón cortado | FAIL | {"overflow":true,"h2Lines":3,"h2H":72,"cut":["Presentación"]} |
| EX-11-z1.5.2 | Sin scroll horizontal | PASS |  |
| EX-11-z1.5.3 | Plan de obra sin desbordamiento horizontal | PASS |  |

## EX-11-movil · Móvil 390×844 y 844×390 (vídeo 3) — **FAIL**

Área: UX. Notas: Navegación de Evolución en móvil: {"sw":410,"cw":370,"ox":"auto","entVisible":false,"stepH":36}

| ID | Comprobación | Estado | Observado (si no PASS) |
|---|---|---|---|
| EX-11-m.1 | M2-UX-MOB-01: el mensaje del pie no queda comprimido (≥ 200 px de ancho o ≤ 3 líneas) | PASS |  |
| EX-11-m.2 | Botones del pie con altura táctil ≥ 44 px | FAIL | [[109,38],[184,38],[114,38],[165,38]] |
| EX-11-m.3 | M2-UX-MOB-02: «Entregar» alcanzable (desplazamiento horizontal o visible) con foco de teclado | FAIL | {"sw":410,"cw":370,"ox":"auto","entVisible":false,"stepH":36,"afterFocus":false} |
| EX-11-m.4 | Pasos de la barra con altura táctil ≥ 44 px | FAIL | 36 |
| EX-11-m.5 | Tocar «Entregar» cambia la evolución a la entrega | PASS |  |
| EX-11-m.6 | Evolución móvil sin scroll horizontal | PASS |  |
| EX-11-m.7 | Apaisado: sin scroll horizontal | PASS |  |

## EX-11-teclado · Teclado, foco y movimiento reducido — **FAIL**

Área: UX.

| ID | Comprobación | Estado | Observado (si no PASS) |
|---|---|---|---|
| EX-11-k.1 | El diálogo se abre con teclado | PASS |  |
| EX-11-k.2 | Pestañas con flechas | PASS |  |
| EX-11-k.3 | Al cerrar con Escape el foco vuelve al botón que abrió el diálogo | FAIL | professionalTitle |
| EX-11-k.4 | Escape cierra la Evolución y vuelve a RUBIK | FAIL | null |
| EX-11-k.5 | Preferencia de movimiento reducido detectada por la página | PASS |  |
| EX-11-k.6 | Movimiento reducido aplicado en la animación 3D | PARTIAL | Solo se verifica la detección; la cámara automática de Gate D no se ha medido frame a frame |

## EX-12 · Persistencia y recuperación — **PASS**

Área: Persistencia.

| ID | Comprobación | Estado | Observado (si no PASS) |
|---|---|---|---|
| EX-12.1 | Versión desconocida: se explica y no se usa | PASS |  |
| EX-12.2 | El editor muestra el error y no ofrece un plan vacío como si no existiera | PASS |  |
| EX-12.3 | Los datos de versión desconocida no se sobrescriben | PASS |  |
| EX-12.4 | Registro corrupto: mensaje y sin bloqueo | PASS |  |
| EX-12.5 | Entregar con presupuesto sin precios no bloquea la página | PASS |  |
| EX-12.Z | Sin errores JavaScript no controlados | PASS |  |

## EX-13 · Rendimiento y carga (QA-22) — **PARTIAL**

Área: Rendimiento.

| ID | Comprobación | Estado | Observado (si no PASS) |
|---|---|---|---|
| EX-13.x1 | Evolución abre con 152 elementos en < 30 s | PASS |  |
| EX-13.x4 | Evolución abre con 421 elementos en < 30 s | PASS |  |
| EX-13.x8 | Evolución abre con 841 elementos en < 30 s | PASS |  |
| EX-13.lim | QA-22 a gran escala | PARTIAL | Medido hasta ~1200 elementos en un equipo de 4 vCPU con SwiftShader (sin GPU); no representa hardware de cliente |
| EX-13.Z | Sin errores JavaScript | PASS |  |

## V4-escritorio · Vídeo 4: hallazgos de escritorio — **FAIL**

Área: Hallazgos (vídeo 4).

| ID | Comprobación | Estado | Observado (si no PASS) |
|---|---|---|---|
| V4.A7 | Un presupuesto parcial no se rotula «Total» sin calificar | FAIL | Base imponible \| 21.601,18 € \| IVA \| 2160,12 € \| Total \| 23.761,30 € |
| V4.B7 | El cambio manual de precio queda en el historial | FAIL | 0 |
| V4.C4 | Editar los elementos de una tarea guardada se guarda | FAIL | FloorPlanConstructionSchedule: elementIds of tsk_bbc895a97f3af924 contradict elements |
| V4.C4b | El mensaje de error está en castellano y sin códigos técnicos | FAIL | FloorPlanConstructionSchedule: elementIds of tsk_bbc895a97f3af924 contradict elements |
| V4.6b | La copia queda señalada | PASS |  |
| V4.11 | Existe «Eliminar plan» en la UI | FAIL | 0 |
| V4.12 | Recargar con cambios sin guardar avisa | FAIL | {"aviso":false,"tareasDraftTrasRecarga":null} |
| V4.k3 | El foco vuelve al botón que abrió el diálogo | FAIL | professionalTitle |
| V4.k4 | Escape con el foco dentro de la Evolución la cierra | FAIL | null |

## V4-movil · Vídeo 4: hallazgos móviles — **FAIL**

Área: Hallazgos (vídeo 4).

| ID | Comprobación | Estado | Observado (si no PASS) |
|---|---|---|---|
| V4.MOB02 | «Entregar» visible o revelado al recibir el foco | FAIL | {"v0":{"visible":false,"sw":410,"cw":370,"h":36},"v1":{"visible":false,"sw":410,"cw":370,"h":36}} |
| V4.m4 | Pasos de la barra con altura ≥ 44 px | FAIL | 36 |

## Métricas

| Métrica | Valor |
|---|---|
| carga-app | 841 ms |
| elementos-vivienda | 152 elementos |
| crear-10-tareas-ui | 7172 ms |
| guardar-plan | 89 ms |
| abrir-evolucion-150 | 720 ms |
| scrub-por-dia | 2.2 ms/día |
| rubik-sota-evolucion-vivienda-qa-obra-nueva-bc36c587.mp4 | 41000 ms |
| abrir-proyecto-x1 | 234 ms |
| abrir-evolucion-x1 | 687 ms |
| scrub-dia-x1 | 1.4 ms |
| heap-evolucion-x1 | 25 MiB |
| guardar-plan-x4 | 319 ms |
| abrir-proyecto-x4 | 209 ms |
| abrir-evolucion-x4 | 765 ms |
| scrub-dia-x4 | 3.7 ms |
| heap-evolucion-x4 | 59 MiB |
| guardar-plan-x8 | 395 ms |
| abrir-proyecto-x8 | 347 ms |
| abrir-evolucion-x8 | 1004 ms |
| scrub-dia-x8 | 3.6 ms |
| heap-evolucion-x8 | 100 MiB |

## Regresión de suites existentes (secuencial, sin concurrencia, mismo SHA)

| Suite | rc | PASS | FAIL | omitidas | duración |
|---|---|---|---|---|---|
| puras | 0 | 895 | 0 | 2 | 63s |
| m2-s4 | 0 | 14 | 0 | 0 | 128s |
| gate-d | 0 | 49 | 0 | 0 | 476s |
| m1 | 0 | 11 | 0 | 1 | 9s |
| budget-ui | 0 | 4 | 0 | 0 | 8s |
| economic-dossier | 0 | 2 | 0 | 0 | 9s |
| professional-workspace | 0 | 17 | 0 | 0 | 629s |
| professional-entry | 0 | 10 | 0 | 1 | 19s |
| project-first | 0 | 5 | 0 | 0 | 10s |
| site-analyze | 0 | 2 | 0 | 0 | 6s |
| parcel | 0 | 5 | 0 | 0 | 15s |
| territory-integration | 0 | 3 | 0 | 0 | 63s |
| brand | 0 | 3 | 0 | 0 | 11s |
| quantity-schedule | 0 | 2 | 0 | 0 | 4s |
| presentation-section | 0 | 7 | 0 | 0 | 856s |
| presentation-story | 0 | 8 | 0 | 0 | 1201s |
