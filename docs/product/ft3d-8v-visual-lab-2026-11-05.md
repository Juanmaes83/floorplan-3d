# FT3D-8 Visual Lab — demostración interactiva (rama aislada)

**Ruta:** `/labs/ft3d-8/` (página independiente; el editor, `index.html`, el visor 3D, `budget-core.js` y Entregas no se tocan).
**Estado:** laboratorio de revisión. Sin merge, sin producción y sin APIs de pago.

## Qué es real y qué es ficticio

| Pieza | Origen |
|---|---|
| Fechas, tareas, dependencias FS/SS/FF/SF, desfases | Fixture `labs/ft3d-8/lab-fixture.js` (**FIXTURE**), validado por `FloorPlanConstructionSchedule` 0.2.0 |
| Importes, origen y revisión de los precios, cantidades estimadas, partida sin precio | Fixture (**FIXTURE**) calculado por el motor real `FloorPlanBudget` (C1–C4) + `budgetReport` |
| Estado de cada elemento por día (aparece, capas, temporal, retirada) | Núcleo real `FloorPlanConstructionVisualState.frameAt` |
| Filas del Gantt, cursor y separación FS / no-FS | Núcleo real `FloorPlanConstructionGantt` + `FloorPlanConstructionLabPresenter.ganttLinks` |
| Textos de la tarjeta (estado del coste, revisión, semana) | `FloorPlanConstructionLabPresenter` (puro, con tests) |
| Geometría 3D (vivienda, valla, caseta, grúa, andamio, excavadora, árboles) | **Ficticia de demostración** (`labs/ft3d-8/scene.js`). Los árboles son decorado y no forman parte del plan |
| Animación entre dos días | **Ilustrativa**: interpola entre dos frames del núcleo; en días enteros coincide exactamente con el núcleo |

## Sincronización

Un único cursor `pos`, medido en días desde `preStartDate`, controla la escena, el cursor del Gantt, el resaltado de filas, la tarjeta y el selector de semana. `window.__ft3dLab.last` expone en cada paso la fecha, las tareas activas, la fecha del cursor del Gantt y los elementos presentes, y la prueba de navegador comprueba que coinciden con `frameAt` calculado en Node.

## Controles

Reproducir/pausa (Espacio), día ± (←/→), semana ± (Shift+←/→), inicio y final (Inicio/Fin), barra de tiempo, selector de semana, velocidad ×1/×2/×4 y clic o arrastre sobre el Gantt. Cámara: AUTO (órbita lenta), ISO, ALZADO, PLANTA y LIBRE (se activa al arrastrar). Enlace profundo: `?date=AAAA-MM-DD` y `?play=1`.

## Correcciones incluidas en este corte

1. **Final inequívoco.** La última posición es `completionDate`, el día siguiente a la última tarea: todas las tareas están completadas según el plan, no queda ningún temporal y aparece el sello «FINAL · PLAN COMPLETADO». No se modifica ninguna fecha. El último día del plan sigue mostrando la retirada en curso.
2. **Temporales.** Grúa (SS con la estructura, FF con la cubierta), andamio (SS con los cerramientos, FF con el revestimiento), excavadora y acopio (solo durante la excavación), y valla y caseta (retiradas en la tarea 13). El hueco de la excavación desaparece con la urbanización.
3. **Dependencias.** `toGanttTasks().dependencies` solo contiene enlaces FS; las dependencias SS/FF/SF se muestran como etiquetas (`SS+0d ← 04`) sin flecha, y los desfases FS como texto sobre la flecha.
4. **Revisión.** Que las partidas estén revisadas (`verified`) no implica que el presupuesto corresponda a la misma revisión del proyecto: `projectRevisionCheck:'unverifiable'`, `revisionMatchVerified:false` y el texto «no verificable» siempre visible.

## Pruebas

- `tests/ft3d-8-lab.test.cjs`: 10 pruebas puras (fixture, las cuatro correcciones, estados de coste, semanas y formatos).
- `tests/ft3d-8-lab.browser.test.cjs`: Chromium real a 1440×900 y 390×844; comprueba sincronización, controles, reproducción, final, reversibilidad, flechas y etiquetas, ausencia de peticiones externas, ausencia de errores y que no haya desplazamiento horizontal.

## Licencias

Inspiración visual: Flat-to-3D · 05 Schedule Build © Sam1983Aing (MIT). La implementación es propia y no copia código, modelos ni datos del donante; la atribución aparece en el pie de la página. Three.js 0.160.0 (MIT) se sirve desde `vendor/three` y no se añade una segunda copia.
