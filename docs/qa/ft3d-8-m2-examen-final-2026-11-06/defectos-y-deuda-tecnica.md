# Defectos y deuda técnica — Examen final M2/S4

## Datos comunes a todas las fichas
- **SHA examinado:** `49e8feba2e3aad03a25fb602248758e39dbe3b3c`.
- **Navegador:** Chrome for Testing 153.0.8010.12, Playwright 1.63.0, Linux, SwiftShader.
- **Fecha:** 06/11/2026.
- **Fixture:** `tests/qa-m2/obra-sintetica.cjs`, siempre con datos sintéticos.
- **Sin corregir:** el examen no corrige. Las propuestas **no están implementadas** y la prueba de cierre es la comprobación del examen que hoy falla.
- **Responsable de la corrección:** agente de desarrollo M2 (Claude Code 1). La prioridad la decide el propietario.

## Criterios de severidad
| Nivel | Significado |
|---|---|
| **P0** | Bloquea, corrompe o pierde datos, o presenta como cierto algo falso sin aviso. Impide cualquier uso. |
| **P1** | Rompe un flujo principal sin alternativa razonable, o daña la confianza en los datos. |
| **P2** | Error funcional con alternativa, pérdida evitable de trabajo o incumplimiento de una regla de producto. |
| **P3** | UX, accesibilidad o pulido; el flujo funciona. |

**Resultado: 0 P0 · 1 P1 · 5 P2 · 8 P3** (14 defectos) **+ riesgos de integración** (ver `integracion-y-riesgos.md`).

| ID | Comprobación | Área | Sev. | Título | Causa |
|---|---|---|---|---|---|
| D-02 | EX-04.C4 / V4.C4 | Plan de obra | **P1** | No se pueden cambiar los elementos de una tarea guardada; error técnico en inglés | **Demostrada** (código y 3 reproducciones) |
| D-01 | EX-02.A7 / V4.A7 | Presupuesto | P2 | Un presupuesto parcial se rotula «Total» | Demostrada (código) |
| D-03 | EX-03.11 / V4.11 | Plan de obra | P2 | No existe «Eliminar plan» en la interfaz | Demostrada (código) |
| D-04 | EX-04.B7 / V4.B7 | Economía | P2 | Los cambios manuales de precio no entran en el historial | Demostrada (código) |
| D-05 | EX-03.12 / V4.12 | Plan de obra | P2 | Recargar pierde el plan sin guardar y no avisa | Demostrada (grep) |
| D-06 | EX-11-m.3 / V4.MOB02 | Móvil | P2 | M2-UX-MOB-02: «Entregar» fuera de la barra a 390 px | Demostrada (medición) |
| D-07 | EX-11-m.2, m.4 / V4.m4 | Móvil | P3 | Áreas táctiles de 36–38 px (< 44) | Demostrada (medición) |
| D-08 | EX-11-k.3 / V4.k3 | Accesibilidad | P3 | El foco no vuelve al botón «Plan de obra» tras Escape | Probable |
| D-09 | EX-11-k.4 / V4.k4 | Accesibilidad | P3 | Escape no cierra la Evolución con el foco dentro del iframe | Demostrada (código) |
| D-10 | EX-03.6b | Plan de obra | P3 | La copia de tarea no queda señalada (intermitente) | Demostrada (código); se manifiesta de forma intermitente |
| D-11 | EX-11-z1.25.4 / z1.5.4 | UX zoom | P3 | Zoom 125–150 %: la barra de RUBIK parte el nombre y corta «Presentación» | Demostrada (medición y captura) |
| D-12 | EX-10.7 (texto) | Entrega cliente | P3 | Texto sin tildes en la entrega HTML del cliente | Demostrada (código) |
| D-13 | EX-05.K | Accesibilidad | P3 | La selección de elementos 3D no tiene alternativa de teclado | Demostrada (prueba corregida) |
| D-14 | EX-05.R | Evolución | P3 | Sin control de cubierta en RUBIK: tabiques y suelos tapados al final de la obra | Demostrada (UI) |

---

### D-02 · P1 · No se pueden cambiar los elementos de una tarea ya guardada
- **Área:** Plan de obra, revisión C. **Evidencias:**
  - `evidencias/v4-hallazgos-escritorio.webm` (rótulo «EX-04.C4»);
  - `evidencias/v4-C4-error-editar-elementos.jpg`;
  - `resultados.json` → EX-04.C4 y `resultados-v4-hallazgos.json` → V4.C4 y V4.C4b.
- **Pasos:**
  1. En Presupuestar, abrir Plan de obra, crear un plan y añadir una tarea con 3 ventanas (papel «construir»).
  2. Guardar el plan.
  3. Pulsar «Editar» en esa tarea, desmarcar una ventana y marcar otra.
  4. Pulsar «Guardar tarea».
- **Esperado:** la tarea se actualiza con los elementos nuevos.
- **Real:** el formulario sigue abierto con el texto «FloorPlanConstructionSchedule: elementIds of tsk_0db1ea8e32360fbe contradict elements». El cambio no se aplica: el borrador conserva las ventanas 0, 1 y 2. El mensaje es técnico, en inglés y expone el identificador interno.
- **Contraste:** cambiar **solo el título** de una tarea con elementos y partidas sí funciona (EX-03.14 PASS).
- **Causa demostrada:**
  - `js/construction-plan-ui.js:239` fusiona `d.tasks[i]={...d.tasks[i],...t}`;
  - la tarea guardada conserva el campo heredado `elementIds` (forma 0.1.0), que la fusión no elimina;
  - `js/construction-schedule-core.js:101` exige que `elementIds` coincida con `elements` y lanza el error.
  - La misma estructura existe para `budgetItemIds` frente a `budgetAllocations` (`construction-schedule-core.js:127`). Es probable que cambiar las partidas de una tarea guardada falle igual (no se ha aislado).
- **Por qué P1:** es un flujo principal, la revisión del plan, y no tiene alternativa en la interfaz salvo borrar y recrear la tarea. Recrearla pierde las dependencias, y la tarea no se puede borrar si otras dependen de ella (EX-03.8).
- **Propuesta (no implementada):**
  - al actualizar una tarea, reconstruirla desde el formulario o eliminar las claves heredadas (`elementIds` y `budgetItemIds`) cuando el formulario aporta `elements` y `budgetAllocations`;
  - traducir los errores del motor a mensajes en castellano antes de mostrarlos en `#taskError`.
- **Prueba de cierre:** EX-04.C4 y V4.C4/V4.C4b en verde, y una prueba equivalente para cambiar partidas de una tarea guardada.

### D-01 · P2 · Un presupuesto parcial se rotula «Total»
- **Área:** Presupuesto C1–C4 (`js/budget-ui.js:74`, módulo compartido anterior a M2; M2 solo cambió 8 líneas).
- **Evidencias:** `evidencias/v4-A7-total-parcial.jpg`, `ex02-presupuesto-revision-A.jpg`, V1 y V4.
- **Pasos:**
  1. Abrir Presupuestar y elegir un IVA del 10 %.
  2. Valorar 10 de las 12 partidas.
  3. Leer el bloque de totales.
- **Esperado:** con partidas sin precio, el importe final aparece como «parcial» o «—», o al menos calificado junto al número.
- **Real:** «Base imponible 21.601,18 € · IVA 2160,12 € · **Total 23.761,30 €**». El aviso «2 partidas sin precio: el total no está completo» aparece aparte, en la lista de avisos.
- **Causa demostrada:** `budget-ui.js:74` pinta la etiqueta «Total» sin tener en cuenta `incomplete`.
- **Por qué P2:** existe aviso, pero el número rotulado «Total» se puede copiar a un cliente sin el aviso. Si el propietario aplica la regla del Maestro «parcial ≠ total» como bloqueante, podría elevarse a P1.
- **Propuesta:** con `unpriced > 0`, rotular «Total parcial (faltan N partidas)» o mostrar «—».
- **Prueba de cierre:** EX-02.A7 y V4.A7.

### D-03 · P2 · No existe «Eliminar plan» en la interfaz
- **Evidencias:** V4 (rótulo «EX-03.11») y `evidencias/ex03-plan-duplicado.jpg`.
- **Pasos:** abrir Plan de obra, pulsar «Duplicar plan» y buscar cómo eliminar uno de los planes.
- **Esperado:** una acción para eliminar un plan guardado, con confirmación.
- **Real:** no hay ningún botón. El núcleo dispone de `removeSchedule` (`js/construction-record-core.js:102` y `:201`), pero la interfaz no lo usa.
- **Consecuencia probable, no demostrada:**
  - `LIMITS.plans` es 6 (`construction-record-core.js:17`);
  - después de 6 duplicados no se podrían crear más planes, y el usuario no tendría forma de liberar espacio.
- **Propuesta:** añadir «Eliminar plan» para los planes no seleccionados, con confirmación y entrada en el historial.
- **Prueba de cierre:** EX-03.11, más una prueba que duplique hasta el límite y elimine uno.

### D-04 · P2 · Los cambios manuales de precio no entran en el historial
- **Evidencias:** `resultados.json` → EX-04.B7 (el historial contiene solo `paint`) y V4.B7 (0 entradas tras cambiar la ventana a 455 €).
- **Pasos:**
  1. Cambiar en Presupuestar el precio de una partida a mano.
  2. Abrir Precios de referencia y consultar el historial.
- **Esperado:** el cambio aparece con el precio anterior y el nuevo, y la revisión de antes y después, igual que los cambios por tarifa (B6 PASS).
- **Real:** solo se anotan los cambios aplicados desde «Precios de referencia». Los tres cambios manuales de la revisión B (gres, tabique y ventana) no dejan rastro.
- **Causa demostrada:** el historial solo se alimenta desde la ruta de referencias (`reference-prices-ui.js` hacia `construction-record-core.js:121`). La edición en `budget-ui.js` no lo invoca.
- **Propuesta:** registrar en `priceHistory` también las ediciones manuales confirmadas (con origen `manual`).
- **Prueba de cierre:** EX-04.B7 y V4.B7.

### D-05 · P2 · Recargar pierde el plan sin guardar y no avisa
- **Evidencias:** V4 (rótulo «EX-03.12»).
- **Pasos:** en Plan de obra, duplicar una tarea (cambio sin guardar) y recargar la página.
- **Esperado:** el navegador avisa antes de perder los cambios, o el borrador se recupera.
- **Real:** no hay aviso y la copia desaparece. El plan guardado sí queda intacto (EX-03.13 PASS), y cerrar el diálogo sí pregunta (EX-03.9 PASS).
- **Causa demostrada:** no hay ningún `beforeunload` en `js/` ni en `index.html`.
- **Propuesta:** registrar `beforeunload` mientras `dirty` sea verdadero, o guardar el borrador en `sessionStorage`.
- **Prueba de cierre:** EX-03.12 y V4.12.

### D-06 · P2 · M2-UX-MOB-02: «Entregar» fuera de la barra a 390 px
- **Evidencias:**
  - `evidencias/v3-movil.webm`, `evidencias/v4-hallazgos-movil.webm`;
  - `ex11-movil-evolucion-nav.jpg`, `ex11-movil-evolucion-nav-desplazada.jpg`, `v4-MOB02-entregar-oculto.jpg`.
- **Pasos:** a 390×844 (táctil), abrir la Evolución y mirar la barra de pasos.
- **Esperado:** «Entregar» visible, o revelado al recibir el foco.
- **Real:** la barra mide 410 px de contenido en 370 px visibles (`overflow-x: auto`). «Entregar» queda fuera, sin indicador de desplazamiento, y al recibir el foco no se desplaza a la vista. Con desplazamiento manual sí se alcanza y se puede tocar (EX-11-m.5 PASS).
- **Estado del gate:** la captura anterior tenía M2-UX-MOB-02 «detectada, no confirmada». **Queda confirmada.** M2-UX-MOB-01 **no se reproduce** (EX-11-m.1 PASS).
- **Propuesta:** compactar las etiquetas a 390 px o añadir un indicador de desplazamiento, y `scrollIntoView({inline:'nearest'})` al recibir el foco.
- **Prueba de cierre:** EX-11-m.3 y V4.MOB02.

### D-07 · P3 · Áreas táctiles por debajo de 44 px
- **Real:**
  - los botones del pie del Plan de obra miden 38 px de alto ([109×38], [184×38], [114×38], [165×38]);
  - los pasos de la barra de la Evolución miden 36 px.
- **Propuesta:** `min-height: 44px` en contexto táctil (`pointer: coarse`).
- **Prueba de cierre:** EX-11-m.2, EX-11-m.4 y V4.m4.

### D-08 · P3 · El foco no vuelve al botón «Plan de obra» tras Escape
- **Pasos:** con teclado, enfocar «Plan de obra», pulsar Enter y luego Escape.
- **Esperado:** el foco vuelve al botón que abrió el diálogo.
- **Real:** el foco va a `#professionalTitle`.
- **Causa probable, no demostrada:** el espacio de trabajo restaura el foco después de que las tarjetas asíncronas del área se redibujen; el botón original ya no existe y se sustituye.
- **Prueba de cierre:** EX-11-k.3 y V4.k3.

### D-09 · P3 · Escape no cierra la Evolución con el foco dentro del iframe
- **Causa demostrada:** `js/construction-context.js:88` escucha `keydown` en el overlay padre. Las teclas pulsadas dentro del `iframe` (`evolucion/`) no se propagan al documento padre. El botón «← Volver a RUBIK» sí funciona.
- **Propuesta:** escuchar Escape dentro del iframe y enviarlo con `postMessage`, que ya se usa para `rubik-construction`.
- **Prueba de cierre:** EX-11-k.4 y V4.k4.

### D-10 · P3 · La copia de una tarea no queda señalada (intermitente)
- **Real:** en EX-03 la copia («Fontanería (copia)») quedó sin señalar. En V4 sí quedó señalada (V4.6b PASS).
- **Causa demostrada:** en `construction-plan-ui.js:180`, `focus={taskId:id}` se asigna **después** de que `change()` redibuje. La copia solo se señala si algo vuelve a redibujar después, como el mensaje de estado o las tarjetas asíncronas. Por eso el resultado depende del orden de los redibujados.
- **Propuesta:** asignar `focus` antes de llamar a `change()`.
- **Prueba de cierre:** EX-03.6b en verde de forma repetida (10 ejecuciones).

### D-11 · P3 · Zoom 125–150 %: la barra de RUBIK sobre la Evolución se desborda
- **Evidencia:** `evidencias/ex11-zoom-150.jpg`, `ex11-zoom-125.jpg`; `resultados.json` EX-11-z1.25.4 y z1.5.4.
- **Real:** al 125 % (1093 px CSS) el nombre del proyecto ocupa 2 líneas (48 px); al 150 % (911 px CSS) ocupa 3 líneas (72 px), la barra desborda y el botón «Presentación» queda cortado («Preser…»).
- **Revisión del criterio (transparencia):** en la primera pasada se exigía que visor, tarjeta y Gantt cupieran sin desplazar al 150 %. Gate D (aprobado, b12b925, `ft3d-8-fit` «browser zoom») define que por debajo de 560 px de alto la Evolución pasa a **disposición apilada con desplazamiento vertical**, sin nada cortado. Esa comprobación se reescribió para verificar la promesa aprobada (PASS) y se añadió una comprobación nueva (z.4) que captura el defecto real de la barra de RUBIK. No se ocultó ningún fallo: el fallo de la barra sigue en rojo.
- **Causa demostrada:** `css/construction.css` solo recorta el título y quita las flechas por debajo de 900/600 px; entre 900 y 1180 px el `h2` envuelve y los pasos con flechas no caben.
- **Propuesta:** a ≤ 1180 px, título en una línea con elipsis y pasos sin flechas.
- **Prueba de cierre:** EX-11-z1.25.4 y EX-11-z1.5.4.

### D-12 · P3 · Texto sin tildes en la entrega HTML del cliente
- **Real:** la entrega muestra «Simulacion planificada e ilustrativa de la evolucion de obra…».
- **Causa demostrada:** `js/construction-delivery-core.js:28` y `js/construction-project-adapter.js:364` tienen el texto sin tildes.
- **Propuesta:** corregir la ortografía. Si las pruebas comparan ese texto, actualizarlas de forma explícita.
- **Prueba de cierre:** comprobar que el HTML contiene «Simulación … evolución».

### D-13 · P3 · Selección de elementos 3D sin alternativa de teclado
- **Evidencia:** `resultados.json` EX-05.K `{panelAbiertoAntes:false, panelTrasTeclado:false}`.
- **Nota de arnés:** en la 1.ª pasada EX-05.K dio un PASS falso (el panel seguía abierto del clic anterior). Se corrigió el arnés (cerrar panel antes; Enter/Tab/→/Espacio sobre el visor) y el resultado real es FAIL.
- **Real:** con el visor enfocado, ninguna tecla abre el panel de un elemento. Alternativa existente: pestaña «Elementos» del Plan de obra.
- **Causa demostrada:** `evolucion/ux-shell.js` solo escucha `pointerup` sobre `#stage` para seleccionar.
- **Propuesta:** con el visor enfocado, una tecla (p. ej. Intro) recorre los elementos y abre el mismo panel, con anuncio `aria-live`.
- **Prueba de cierre:** EX-05.K.

### D-14 · P3 · Sin control de cubierta dentro de RUBIK: lo interior no se puede señalar al final de la obra
- **Evidencia:** `resultados.json` EX-05.R; EX-05 nota «65 elementos alcanzables en 3 vistas».
- **Real:** el control «Cubierta derivada» (`#roofToggle`) existe en la Evolución, pero está oculto en la vista integrada en RUBIK. Desde que la cubierta (T05) se construye, tabiques y suelos quedan tapados en ISO; solo se alcanzan retrocediendo a una fecha anterior o en vista PLANTA. Los muros de carga del fixture (T02) no se alcanzaron en ninguna de las 3 vistas probadas (EX-05.3 PARTIAL).
- **Propuesta:** mostrar en RUBIK un conmutador «Ver interior (ocultar cubierta)» junto a las vistas, o aplicar corte de cubierta automático al seleccionar.
- **Prueba de cierre:** EX-05.R y EX-05.3 con clic real.

---

## Observaciones que no son defectos
- La Evolución abre tras recargar en la fecha previa al inicio y sin selección; no conserva la fecha ni la tarea de la sesión anterior. Es aceptable y se registra.
- «2160,12 €» sin separador de miles sigue la regla de `es-ES` para 4 cifras.
- Los mensajes del motor en inglés en EX-03.5 solo aparecen si se intenta un reparto por encima del 100 % por la API. La interfaz lo impide antes, porque la opción está deshabilitada (EX-03.4).
- Los materiales de las tareas (acero, aluminio, PEX) son texto descriptivo, no materiales del modelo; es una limitación del alcance.

## Deuda técnica

| ID | Deuda | Evidencia | Riesgo |
|---|---|---|---|
| DT-01 | **Errores silenciados** | 31 `catch{}` vacíos en `js/` e `index.html`. En M2, `construction-context.js:42-49` convierte un presupuesto corrupto en `null` sin dejar rastro. EX-12 comprobó que la interfaz se recupera, pero no queda registro. | Diagnóstico imposible en campo. |
| DT-02 | **Mensajes internos expuestos** | El motor (`construction-schedule-core.js`) lanza errores en inglés con identificadores, y la interfaz los pinta tal cual (D-02). No hay una capa de traducción de errores. | Más casos como D-02. |
| DT-03 | **Persistencia solo en `localStorage`** | 24 claves con prefijos mezclados (`rubik-*` y `rubik-sota-*`). El expediente M2 tiene un tope de 4 MB (`LIMITS.storeBytes`) y no hay copia de seguridad. | Pérdida de trabajo al borrar los datos del navegador; límite de almacenamiento compartido con otras claves. |
| DT-04 | **Sin protección de cambios sin guardar** a nivel de página | No hay `beforeunload` (D-05). | Pérdida de trabajo. |
| DT-05 | **Fusión de objetos con campos heredados** | Forma 0.1.0 (`elementIds`/`budgetItemIds`) frente a 0.2.0 (`elements`/`budgetAllocations`) en el mismo objeto (D-02). | Errores de validación tras migraciones. |
| DT-06 | **Monolito `index.html`** (5022 líneas) | Es el único archivo que tocan a la vez master y M2. | Conflictos y regresiones en la integración. |
| DT-07 | **Evolución en un iframe** | Teclado (D-09), foco (D-08) y gestión de errores separados, con comunicación por `postMessage`. | Accesibilidad e integración. |
| DT-08 | **Pruebas con esperas fijas** | `waitForTimeout` en las suites de navegador (27 en walk-controls, 23 en presentation-story, 15 en presentation-section…). Hay una prueba compartida de budget-ui intermitente desde M1. | Fallos intermitentes en CI. |
| DT-09 | **Versión de Playwright** | El workflow de M2 fija 1.62.1; este examen usó 1.63.0. | Diferencias menores de comportamiento. |
| DT-10 | **CI no cubre `qa/*`** ni combinaciones con master | Ningún workflow ejecuta las suites M2 y Hybrid V2 sobre un árbol combinado. | Riesgo INT-R1 sin vigilancia. |
| DT-11 | **Textos de cliente en el núcleo sin revisión ortográfica** | D-12. | Imagen ante el cliente. |
