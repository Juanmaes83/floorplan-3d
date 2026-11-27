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

## Avance 27/11 (instrucción del propietario: «Exportar diseño», acciones junto a su tarea, «Escena 3D» vs «Revisar en 3D»)
- Archivo pasa a **«Exportar diseño ▾»** solo con salidas: imagen/captura 3D, lámina, ficha de superficies, DXF y JSON.
- Lo demás junto a su tarea (mismos ids y manejadores): **Reformar desde fotografía** → menú de proyecto (crea un proyecto);
  **«Más» (…)** con grupos titulados: *Contexto del proyecto* (contexto territorial, orientación y solar), *Entrega*
  (observaciones del cliente, tu marca), *Diseño* (vaciar distribución, restablecer). Propuesta: el propietario puede reubicar.
- El paso del recorrido se llama **«Revisar en 3D»** en su origen (guía) y **«Revisar en 3D (paso)»** en la fila 2: marca hecho
  el paso; **«Escena 3D»** solo cambia la vista. Contrato `journey-orientation` actualizado por este cambio de nombre.
- Prueba `cabecera-proyectos` ampliada: importar de verdad el JSON descargado; «Exportar diseño» solo con salidas; grupos de «Más».
  Local 2/2. Regresión completa: pendiente (tras la del §5.3).

## Regresión de §9 y contraste con la base (27/11, noche)
- **Regresión de 44 archivos sobre `c921c60f`:** 401 pruebas · 331 superadas · **66 fallos** · 4 omitidas.
- **Contraste en la base `cd694e88`, mismos 21 archivos con fallos y mismas condiciones:** 269 · 262 superadas · **3 fallos**
  preexistentes: G-02 (nombre del DXF por planta), persistencia F0.2b (`TypeError` del observador de `story-layers-ui.js`,
  introducido por StoryLayersV1) y P16 (ya conocido).
- **Causas de §9 y corrección (`79ca6670`):**
  | Causa | Tipo | Corrección |
  |---|---|---|
  | rótulos de los grupos de «Más» sin traducir al cambiar de idioma | defecto del producto | se repintan con `lang` |
  | botón rápido «Guardar JSON» retirado de la fila 2 (UX-BETA-001, U11 aprobados) | defecto del producto | restaurado; el menú conserva su entrada |
  | aviso de variante acortado («Variante «X»») | pérdida de mensaje aprobado | frase completa en escritorio ≥ 1280 px; corta en móvil |
  | clic fantasma táctil al abrir «Distancia conocida» | defecto expuesto por el cambio de cabecera | `js/tracing-ui.js` ignora ese clic (mismo punto, < 700 ms) |
  | `TypeError` del observador de `<body>` (preexistente) | defecto preexistente | el observador espera al DOM |
  | pruebas que pulsaban controles que ahora viven en el menú de proyecto | adaptación de pruebas | `mostrar()` llega por el menú; `premium-shell` exige la entrada visible fusionada; `upload` describe el diseño de §9 |
- Verificación de la corrección: nueva ejecución de los 21 archivos sobre `79ca6670` (en curso; resultado abajo).
