# §9 · Cabecera y gestión de proyectos

**Rama:** `claude/cabecera-proyectos` · **base:** `claude/storylayers-v1` `cd694e88` (StoryLayers aprobado; ya traía el nombre
de la variante en la cabecera y «Volver a la historia»). Estado: **candidata pendiente de regresión completa y de revisión
humana**. Fusión, activación y producción: decisión aparte.

## Qué cambia
**Fila 1** · identidad RUBIK, **un control de proyecto** (nombre real del proyecto activo, que abre la biblioteca como
siempre, + menú ▾), estado de guardado, áreas **Diseñar · Analizar · Presupuestar · Entregar** y accesos globales
(buscar, Mi estudio, ayuda, idioma, más).

**Menú de proyecto ▾** (cada entrada acciona el flujo existente; teclado: Intro abre, flechas, Esc cierra y devuelve el foco):
| Entrada | Destino real |
|---|---|
| Abrir otro proyecto… | biblioteca local (`#projectsBtn` → `#projectsDialog`); cambia el proyecto activo |
| Subir plano o proyecto… | flujo de importación existente (`pick()` de `plan-intake-ui`, el mismo de «Subir plano»); crea un proyecto nuevo, el abierto no cambia |
| Crear copia | ejemplo: la copia de la guía (`#guideCopyExample`); proyecto propio: `library.duplicate` (id nuevo, «· copia»); el original no cambia |
| Crear variante | la MISMA función que P10 (`FloorPlanStoryLayersUI.createVariant`): variante vinculada y vuelta al capítulo de StoryLayers |
| Descargar proyecto JSON | `#exportJsonQuick` (descarga del archivo editable) |
| Importar proyecto JSON · Nuevo proyecto · Unir escaneo RoomPlan… | los mismos botones de siempre (ids y manejadores) |
Nota fija en el menú: «Guardado local» = solo en este navegador; para llevarlo a otro equipo, descarga el JSON.

**Fila 2** · solo la tarea actual: vuelta contextual (cuando procede), Archivo (salidas del diseño), vista 2D/3D,
deshacer/rehacer (iconos con su nombre accesible), progreso, tareas, Presentar vivienda y la acción del paso.

**Una sola vuelta contextual desde P10:** «Volver a la historia» pasa del aviso flotante sobre el plano al principio de la
fila 2 («Variante «…»» + botón; el texto completo en el título). Mientras está, la vuelta genérica «← Volver a Entregar»
no se muestra.

**«Escena 3D» y «Abrir 3D» (comprobado en el código):** ambos abren la misma escena 3D; «Abrir 3D» es la acción del paso
del recorrido (`guide-ui.js:560`: `setView('3d')` **y** `record('view3d')`, marca hecho «Revisa la distribución en 3D»);
«Escena 3D» solo cambia la vista. Por eso no se fusionan: el botón del paso se rotula **«Revisar en 3D (paso)»** y su
descripción lo explica.

**Duplicados retirados de la vista (conservan id y manejador):** dentro del menú, «Subir plano» / «Más formas de importar» /
«Subir plano o proyecto» (los cubre «Subir plano o proyecto…»), «Unir escaneo» rápido y «Guardar proyecto JSON» (lo cubre
«Descargar proyecto JSON»). En Archivo, «Exportar plano JSON» (mismo manejador) se rotula **«Descargar proyecto JSON»**.

## Inventario antes / después
`inventario-antes-cd694e88.txt` y `inventario-despues.txt` (1440×900 y 390×844, filas R1/R2, visibilidad, posición e id).
Antes: 43 controles visibles a 1440; «Crear copia» y el selector en la fila 1; «Subir plano», su menú, Archivo y «Guardar
proyecto JSON» en la fila 2; deshacer/rehacer en la fila 1. Después: lo indicado arriba; ninguna acción se pierde.

## Pruebas
- Nueva y bloqueante: `tests/cabecera-proyectos.browser.test.cjs` — escritorio 1440×900 (control único, fila 2 de tarea,
  menú con teclado, cada acción con su efecto real, copia con id propio, variante vinculada con UNA vuelta, ningún control
  cortado en la fila 2, «Revisar en 3D (paso)») y móvil 390×844 (menú dentro de la pantalla). Local: 2/2.
- Pendiente: regresión completa (pruebas que pulsaban «Subir plano» en la fila 2 deberán abrir el menú de proyecto: es el
  cambio de recorrido pedido en §9, no una relajación).
- CI: no ejecutada. Preview: la que genera Vercel para el SHA publicado.

## Decisiones del propietario
- Archivo se mantiene en la fila 2 como «salidas del diseño» (imagen, lámina, DXF, superficies, marca, reformar desde foto,
  restablecer): ¿mantener ese nombre o renombrarlo?

**Checkpoint de reanudación:** [CHECKPOINT-REANUDACION.md](CHECKPOINT-REANUDACION.md)
