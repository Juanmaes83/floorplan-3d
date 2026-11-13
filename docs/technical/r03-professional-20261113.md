# R03 Professional — el editor de armarios dentro de RUBIK (cortes R1 y R2)

**Fecha:** 13/11/2026 · **Rama:** `feat/r03-professional-20261113`, desde `master@8d9cb7b`.

**Qué incluye la rama:**
- #202 (`7052db7`) traído con un *merge*, porque no cambia ningún archivo de `master`;
- **R1:** un puente puro;
- **R2:** el adaptador de interfaz y los estilos.

**Estado:** BORRADOR para auditoría. **No integrado. `index.html` de esta rama NO cambia.**

La **demostración dentro del editor real** está en la rama de revisión `review/r03-editor-in-rubik-20261113`. Esa rama **no se fusiona nunca**, y en ella `index.html` lleva el parche de §3.

No es fabricación, presupuesto ni CAT-03. Los valores del armario son supuestos, del donante, y no medidos.

## 1. Qué se reutiliza (no hay segundo núcleo ni segundo editor)

| Pieza | Origen | Papel |
|---|---|---|
| `js/r03-cabinet-core.js` | `master` (I0, #198) | Única autoridad geométrica |
| `js/r03-cabinet-contract.js` | #202 | Persistencia `extensions['x-r03-cabinet']`, opción aprobada por el propietario como experimental |
| `js/r03-cabinet-editor-core.js` | #202 | Sesión: deshacer, rehacer, restablecer y explicaciones |
| `js/r03-cabinet-editor-ui.js` | #202 | El editor, la misma interfaz del laboratorio |
| `js/r03-cabinet-geometry.js`, `js/r03-cabinet-three.js` | #202 | El 3D exacto del armario |

## 2. Nuevo en esta rama

### R1 · Puente con el editor de RUBIK (`js/r03-cabinet-bridge.js`, puro)

Reúne los cinco puntos de conexión de la propuesta de #202 (§5) y los prueba con el núcleo real de RUBIK:

| Función | Para qué | Garantía |
|---|---|---|
| `open(project, id)` | Abrir el editor del armario | Sesión editable. Si los datos están dañados o son de una versión posterior, solo lectura, sin reparar nada en silencio. Si no es un armario, `ok:false`. |
| `save(project, session)` | Guardar **dentro de `mutate()`** de RUBIK | Un paso del deshacer de RUBIK. Si se rechaza, nada cambia y se explica por qué. |
| `model3D(THREE, project, objeto)` | El armario exacto en `buildFurniture` | `exact:true` indica que no hay que aplicar el reescalado genérico. Si devuelve `null`, RUBIK dibuja su armario de siempre. |
| `afterDelete(project)` | Borrar el mueble | No deja interiores huérfanos. Si la extensión es futura o está dañada, no la toca: es de otro lector. |
| `afterDuplicate(project, de, a)` | Duplicar el mueble | La copia recibe el interior guardado del original. |
| `afterLoad(project)` | Al abrir un proyecto | Solo informa: huérfanos, ilegibles y estado de cada armario. |

**Pruebas** (`tests/r03-cabinet-bridge.test.cjs`): **8/8**.
- Reproducen exactamente `mutate`/deshacer de RUBIK: foto JSON, `Core.validate` y vuelta atrás si falla.
- Deshacer y rehacer devuelven el proyecto byte a byte.
- En el 3D se comprueban la altura y la anchura con el three r160 de `vendor/`.
- **1500 secuencias aleatorias** con cobertura mínima exigida: al menos 150 guardados, 40 guardados rechazados, 100 borrados, 30 duplicados con interior y 80 deshacer. En todas, el proyecto valida, no quedan huérfanos y ningún rechazo cambia nada.

### R2 · El editor dentro de RUBIK (`js/r03-cabinet-rubik-ui.js` y `css/r03-cabinet-editor.css`)

- **Diálogo modal** con el editor de #202. La app le da dos cosas: cómo leer el proyecto y cómo guardar dentro de su `mutate()`.
- **Modal de verdad:** escucha el teclado en el documento, en captura, mientras está abierto, y devuelve el foco al diálogo si se escapa.
  - Sin esto, Ctrl+Z desharía **a la vez** la edición del armario y el proyecto entero.
  - Al redibujarse tras guardar, el foco caía al `body` y Escape dejaba de cerrar. Lo encontró la prueba de extremo a extremo y está corregido.
- **Cerrar:** Escape o el botón «Cerrar» cierran; con cambios sin guardar, piden una segunda pulsación. «Cancelar» descarta a propósito y cierra sin preguntar. El foco vuelve al botón que lo abrió.

#### Auditoría de #215 (13/11): «Dividir módulo» y cierre con cambios pendientes

La auditoría pedía comprobar dividir, cambiar de verdad, primer Escape y confirmación. Escape ya funcionaba. Al probarlo en escritorio y en el móvil salieron **tres defectos del adaptador** (`js/r03-cabinet-rubik-ui.js`), corregidos aquí. Cada uno tiene una prueba que falla con `ac7df16` y pasa ahora:

| # | Defecto | Impacto | Corrección |
|---|---|---|---|
| 1 | El botón **«Cerrar»** cerraba y **tiraba los cambios sin avisar**. Solo Escape pedía confirmación. | En el móvil no hay Escape: era la única forma de cerrar y se perdía el trabajo. | «Cerrar» pide la misma confirmación que Escape. Un cambio nuevo vuelve a exigirla. |
| 2 | **Ctrl+Z dentro del diálogo no hacía nada.** La escucha modal del documento, en captura, paraba todas las teclas antes de que llegaran al editor. La prueba anterior solo contaba módulos, por eso no lo veía. Lo introdujo la corrección de foco de la noche anterior. | El editor anunciaba un deshacer que no funcionaba. | Dentro del diálogo, la tecla llega al editor y se para en el propio diálogo, antes de RUBIK. Fuera, se sigue parando en la captura. La prueba compara ahora el estado completo. |
| 3 | Tras **«Guardar interior»**, al cerrar el foco caía al `body`. | Teclado y lector de pantalla perdían el sitio. | RUBIK redibuja su panel al guardar. Si el botón que abrió el diálogo ya no existe, se enfoca el nuevo, buscado por su `id`. |

Comprobado en 1440×900 y 390×844:
- **División válida:** un módulo más, aviso verde «Módulo dividido» y `dirty === true`. El proyecto no cambia. El primer Escape (o «Cerrar») no cierra y avisa de «cambios sin guardar»; el segundo cierra sin tocar el proyecto ni el deshacer de RUBIK.
- **Ctrl+Z en el diálogo** deshace la división: `dirty === false` y un solo Escape cierra.
- **División rechazada:** módulos idénticos y aviso rojo «Módulo 1: cada módulo necesita al menos 150 mm de anchura libre.».
  - Si ya había cambios válidos, siguen pendientes y Escape sigue pidiendo confirmación.
  - Sobre un interior recién guardado, el rechazo deja `dirty === false`, no toca el proyecto ni el deshacer, y un Escape cierra.
- **RUBIK:** guardar es un paso del deshacer; Ctrl+Z quita el interior y Ctrl+Shift+Z lo devuelve. El 3D dibuja el armario dividido. Sin desplazamiento horizontal y sin errores.
- **Aviso fijo:** «Interior paramétrico experimental: medidas supuestas, no de fabricante. No es un presupuesto ni sirve para fabricar.»
- **Estilos:** las reglas `.r03-*` del laboratorio, copiadas literalmente, con sus variables dentro de `.r03-scope` para no chocar con las de RUBIK. En el móvil, el diálogo es una hoja a pantalla completa.

## 3. Conexión con `index.html` (cirugía de ChatGPT; aplicada solo en la rama de demostración)

Son **14 líneas** en seis puntos (`git diff` de `review/r03-editor-in-rubik-20261113`):

1. Cargar `css/r03-cabinet-editor.css` y los módulos `r03-cabinet-*`, después de los scripts existentes.
2. Panel del mueble: botón **«Interior del armario…»** solo si `RubikCabinetBridge.isCabinet(objeto)`.
3. `bindFurnPanel`: abrir el diálogo con
   `commit: next => mutate(() => { r = next(); if (!r.ok) throw …; project = r.project; })`.
4. `deleteSel`: `afterDelete(project)` dentro del mismo `mutate`.
5. `duplicateSel`: `afterDuplicate(project, f.id, n.id)` dentro del mismo `mutate`.
6. `buildFurniture`: `model3D(THREE, project, f)`. Si hay modelo, se añade y **no** se aplica el reescalado por `size.heightMm`.

**Persistencia:** no hace falta tocar nada. `snap()`, `mutate()`, deshacer, guardado local, JSON y ZIP ya conservan `extensions`, y ENT-01 las excluye de la entrega al cliente (probado en #202).

## 4. Pruebas en el editor real (rama de demostración)

`tests/r03-editor-in-rubik.browser.test.cjs`, en 1440×900, 390×844 y 844×390. Datos: el proyecto de ejemplo de RUBIK (sintético). Comprueba:

- el botón aparece solo en armarios;
- abrir el diálogo, dividir un módulo y añadir una balda;
- un rechazo explicado (6 cajones de 400 mm);
- **Ctrl+Z dentro del diálogo no toca el proyecto**;
- guardar = **un** paso del deshacer de RUBIK;
- **3D:** la altura del armario es la del mueble y se dibujan más de 10 piezas;
- deshacer y rehacer de RUBIK;
- **recargar la página conserva el interior**;
- duplicar con interior y borrar sin huérfanos;
- Escape con cambios sin guardar pide confirmación;
- **«Dividir módulo»** (auditoría de #215): división válida y rechazada, Escape y «Cerrar» con y sin cambios, Ctrl+Z del diálogo, guardar/deshacer/rehacer de RUBIK y 3D, en 1440×900 y 390×844;
- el foco vuelve al botón;
- sin desplazamiento horizontal;
- 0 errores.

## 5. Límites y lo que falta para el producto

- **Decisión del propietario** sobre el GO de R03 en el producto, ligada a GOV-05, el derecho del donante, ya registrado como riesgo residual.
- **Cirugía de `index.html`** por ChatGPT: §3, o integrar la rama de demostración una vez auditada.
- **Prueba humana C** restante, en escritorio y móvil.
- **Sin evaluar:** bisagras reales, herrajes, tolerancias, fabricación, precios, pedidos y CAT-03.
- **Exportación al cliente:** ENT-01 excluye los interiores. Mostrarlos al cliente sería otra decisión.
