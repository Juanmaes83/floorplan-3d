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
- **Cerrar:** Escape cierra; con cambios sin guardar, pide un segundo Escape. El foco vuelve al botón que lo abrió.
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
- el foco vuelve al botón;
- sin desplazamiento horizontal;
- 0 errores.

## 5. Límites y lo que falta para el producto

- **Decisión del propietario** sobre el GO de R03 en el producto, ligada a GOV-05, el derecho del donante, ya registrado como riesgo residual.
- **Cirugía de `index.html`** por ChatGPT: §3, o integrar la rama de demostración una vez auditada.
- **Prueba humana C** restante, en escritorio y móvil.
- **Sin evaluar:** bisagras reales, herrajes, tolerancias, fabricación, precios, pedidos y CAT-03.
- **Exportación al cliente:** ENT-01 excluye los interiores. Mostrarlos al cliente sería otra decisión.
