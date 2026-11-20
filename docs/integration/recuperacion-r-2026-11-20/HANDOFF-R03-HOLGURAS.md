# R03 · Recuperación del análisis de holguras (20/11/2026)

> **Estado:** candidata recuperada y **conectada en solo lectura** al diálogo de interiores existente (autorización del propietario del 20/11/2026), para auditoría e integración por Codex.
> - No escribe el proyecto, no bloquea el guardado y no aplica propuestas.
> - Sin fusionar ni activar fuera de esta rama.

## Identidad

| Qué | Valor |
|---|---|
| Rama | `claude/r03-holguras`. HEAD y árbol: los verificados en remoto al publicar (§4.3) |
| Base | master `4ea7cb3bb72e6c3bdd9a176cb08bd9e41b8866f2` |
| Origen | Laboratorio `lab/sculpt-r03-cabinets@fc5a4224`, `labs/sculpt/r03-cabinets/cabinet-evidence-core.js`. Las funciones `clearanceGeometry`, `pseudo`, `clearanceBlock` e `independentIssues` se copian **sin cambios de lógica**. Escenas sintéticas: copia exacta en `tests/fixtures/r03-cabinet-scenarios.js` |

## Por qué es valor no integrado

**Lo que master ya tiene** (R03 integrado: `js/r03-cabinet-*`):
- armario paramétrico, editor y 3D;
- en el núcleo, `swing`, `drawerReach` y `verticalCheck`.

**Lo que no tiene:** la **comprobación de holguras** del laboratorio:
- si el barrido de cada puerta y el alcance de cada cajón chocan con muros, puertas de estancia o muebles;
- los conflictos bisagra/cajón como incidencias, cada una **con su autoridad**.

## Reutilización (sin motores nuevos)

| Pieza | Autoridad que se reutiliza |
|---|---|
| Barrido, alcance, giro a planta y conflictos bisagra/cajón | `RubikCabinetCore` (`js/r03-cabinet-core.js`). `swing`, `drawerReach`, `toPlan` y `drawerDoorConflicts` son **idénticas byte a byte** a las del laboratorio |
| Colocación | `FloorPlanPlacement.problems`, aplicado al **cuadrado** que barre cada hoja (la convención de RUBIK para las puertas de estancia) y al cuerpo extendido del cajón |
| Sector exacto de 90° | `FloorPlanLayoutReview.penetration`: evidencia **experimental** que nunca bloquea nada |
| Armario de cada objeto | Contrato R03 (`RubikCabinetContract.read`): el guardado o el de su tipo por defecto |

**API:** `RubikCabinetClearance.analyze(project, objectId)` devuelve:
- `status`: `evaluated`, o el estado del contrato;
- `clearance`: hallazgos separados en `doorSquare`, `doorSector` y `drawers`;
- `issues`: cada incidencia con su autoridad;
- `summary`: `clear`, `experimental-only` o `issues`;
- `applied: false`.

## Pruebas (Node 22.23, Linux)

| Prueba | Resultado |
|---|---|
| `tests/r03-cabinet-clearance.test.cjs` (nueva) | **7/7**, con los mismos escenarios y valores esperados que el laboratorio |
| Suite pura completa | 1518/1520, 0 fallos, 2 omitidas (master + 7) |

Lo que cubren:
- **mesilla en el barrido:** `furniture:obj_nightstand` en el cuadrado y en el sector;
- **zapatero en un pasillo de 800 mm:** la salida de la estancia solo en el cuadrado; el muro en los dos;
- **armario bien colocado:** sin hallazgos;
- **cajones atravesados por una bisagra:** incidencia con la regla del donante como autoridad;
- **hallazgo solo del sector:** `experimental R03`;
- **todas las escenas:** el proyecto queda intacto; un objeto que no es armario sale `not-cabinet` y un id inexistente `unknown-object`;
- **guardas:** usa los motores de producto, no define `swing`, `penetration` ni `problems` propios, no escribe y no lo carga `index.html`.

## Límites

- Apertura supuesta de 90° (`K.ASSUMED`). No evalúa herrajes reales, recorrido de personas ni normativa.
- El cuadrado es conservador: un hallazgo solo en el cuadrado no es una colisión del sector.

## Conexión en solo lectura (corte 2, autorizado)

| Pieza | Cambio |
|---|---|
| `js/r03-cabinet-clearance.js` | `analyzeDraft(project, id, outer, cabinet)`: el mismo análisis sobre el **borrador** del editor. `describe(project, result)`: grupos por autoridad con textos legibles |
| `js/r03-cabinet-rubik-ui.js` | Sección «Holguras de apertura · solo lectura» en el diálogo existente. Se recalcula en cada cambio del borrador, **sin controles**, sin tocar `onSave` y oculta si el módulo no está |
| `index.html` | Una línea: carga `js/r03-cabinet-clearance.js` justo antes de `r03-cabinet-rubik-ui.js`. **Ningún punto de conexión nuevo** |
| `tests/r03-activation-manifest.cjs` | Lista autorizada actualizada a sabiendas (nueve módulos), sin relajar las guardas I1/A4 |
| `css/r03-cabinet-editor.css` | Estilos de la sección con los tokens del ámbito `.r03-scope` |

**Avisos diferenciados por autoridad** (nunca mezclados):
- **RUBIK** (comprobación de colocación): colocación del mueble, barrido completo de puertas (conservador) y apertura de cajones;
- **regla del diseño de origen:** bisagra frente a cajones;
- **experimental:** giro exacto de 90°, orientativo, que no decide nada.

### Pruebas

| Prueba | Resultado |
|---|---|
| `tests/r03-cabinet-clearance.test.cjs` | **11/11** |
| `tests/r03-clearance-in-rubik.browser.test.cjs` (nueva, bloqueante) | **2/2**, en 1440×900 y 390×844 |
| `tests/no-chinese-display.browser.test.cjs` (nueva, bloqueante) | **3/3** |
| Guardas I1/A4 (`r03-integration-core`, `r03-cabinet-audit`) | Verdes con la lista actualizada |
| `r03-editor-in-rubik`, `r03-editor`, `r02a-editor`, `r02a-lab`, `r02a-r03-coexistence` | 8/8, 16/16, 5/5, 13/13 y 1/1 |
| Suite pura | 1522/1524, 0 fallos, 2 omitidas |
| Cobertura de navegador | 0 archivos sin cubrir |

Qué cubren las pruebas puras de `r03-cabinet-clearance`:
- **positivas:** el borrador ve un conflicto que lo guardado no tiene; grupos por autoridad;
- **negativas:** un objeto que no es armario, un armario inválido o un id inexistente no producen grupos ni inventan holguras; el proyecto y el borrador quedan intactos.

Qué cubre la prueba de navegador de holguras:
- **positivas:** el armario del ejemplo; un mueble colocado a propósito dentro del barrido aparece como aviso de RUBIK con su nombre visible;
- **negativas:** la sección no tiene controles; abrir y mirar no cambia el proyecto ni el deshacer; se **guarda aunque haya avisos** y el mueble no se mueve; sin el módulo el diálogo funciona y la sección no aparece; sin errores de página.

### Evidencia visual

`docs/qa/artifacts/r03-holguras/`, en 1440×900 y 390×844:
- `1-ejemplo`;
- `2-mueble-en-el-barrido`;
- `3-guardado-con-avisos`.

**Revisadas a mano: sin texto en chino.**

### Corrección: texto en chino visible (regla permanente del propietario)

- **Defecto.** Las primeras capturas mostraban «衣柜» y «床头柜». El proyecto de ejemplo guarda 68 nombres en chino. RUBIK los traduce con `nm()`, una constante interna de `index.html`, pero los módulos R03 (título y etiqueta del diálogo), las holguras y R02-A (avisos de muebles y estancias) mostraban `object.name` y `room.name` en bruto.
- **Fuente única.** `window.FloorPlanDisplayName(name, type)` traduce con los diccionarios existentes. En español o inglés **nunca** devuelve chino: si falta la traducción, usa el nombre del tipo del catálogo y, en último caso, «Elemento» o «Item». En chino se respeta el original.
- **Corregidos los 5 puntos:** `r03-cabinet-clearance.js`, `r03-cabinet-rubik-ui.js` (dos) y `r02a-ceiling-editor.js` (muebles y estancias).
- **`#zoomIn`:** «＋» de ancho completo cambiado por «+».
- **Guarda permanente.** Recorre la interfaz real en ES y EN: plano, panel de **cada** mueble y **cada** estancia, y el diálogo de **cada** armario. Falla con el sitio exacto ante cualquier carácter CJK visible. **Discrimina:** al deshacer la corrección del título falla con «Armario ropero «衣柜»».
- **Regla anotada** en `AGENTS.md`, que leen todos los agentes.
- **Única excepción explícita:** el selector de idioma muestra «中文», el nombre del idioma en su propio idioma. **Pendiente de tu confirmación.**

## Corte 3 · pulido móvil, rendimiento e idioma (autorizado el 20/11/2026)

**Pulido UX:**
- **Resumen compacto** de una línea. Ejemplo: «Avisos: 1 de RUBIK · 1 orientativo. No impiden guardar.» o «Sin choques al abrir.».
- **Detalle desplegable**, cerrado por defecto: el dibujo del armario tiene prioridad. En móvil empieza hacia los 230 px; la prueba exige que lo haga en la mitad superior.
- **Avisos diferenciados por autoridad** dentro del detalle, como antes.
- **Sin nombres redundantes:** si el nombre visible es solo el del tipo, no se repite. Ahora se lee «Interior · Armario ropero · 2400 × 600 mm».
- No bloquea el guardado ni aplica nada; la prueba lo comprueba.

**Rendimiento durante la edición** (20 cambios seguidos del borrador, medido en la propia sección, Chromium sin GPU):

| Pantalla | Mediana | p95 | Máximo |
|---|---|---|---|
| 1440×900 | 14,2 ms | 19,4 ms | 23,1 ms |
| 390×844 | 11,5 ms | 17,4 ms | 20,6 ms |

- **Umbral de la prueba:** p95 < 50 ms.
- **Límite:** la mediana ronda un fotograma de 16 ms en este entorno sin GPU. Falta medir en móvil físico.

**Idioma** (decisión del propietario):
- Selector `ES · EN · ZH`, sin caracteres chinos en ES/EN; el chino sigue disponible.
- Excepción de la guarda **eliminada**.
- `nm()` es ahora el embudo seguro, usado por unos 35 módulos.
- Corregidos los nombres en bruto de `smart-furnishing-ui.js`. En `quantity-schedule-ui.js` se envuelven por coherencia: su núcleo ya traducía y allí no había fuga.
- La guarda recorre además las áreas de trabajo y el cuadro de cantidades.
- Coordinación con CC1: `IDIOMA-COORDINACION-CC1.md`.

**Pruebas de este corte:**

| Prueba | Resultado |
|---|---|
| `r03-clearance-in-rubik.browser` | 2/2 |
| `no-chinese-display.browser` | 4/4 |
| `upload`, `professional-workspace`, `guide`, `sheet`, `solar`, `surface-sheet` (todas pulsan `#langBtn`) | 9, 17, 5, 9, 14 y 6: todas pasan |
| `r03-editor-in-rubik`, `r02a-editor` | 8/8, 5/5 |
| Suite pura | 1522/1524, 0 fallos, 2 omitidas |
| Cobertura de navegador | 0 archivos sin cubrir |

**Aceptación visual:** las 6 capturas de `docs/qa/artifacts/r03-holguras/` están revisadas a mano: sin chino, sin redundancias, dibujo visible.

## Límites de esta conexión

- Solo Chromium Linux.
- En móvil la sección ocupa altura antes del alzado; se acepta para revisión UX.
- Nombres redundantes del ejemplo, como «Armario ropero «Armario»»: es la traducción literal del nombre guardado.

## Lo que no se recupera, y por qué

| Pieza del laboratorio | Motivo |
|---|---|
| `propose`/`previewDiff`/candidatura de `size.heightMm` | Exige el contrato de propuesta revisable, no autorizado; no se aplican propuestas automáticamente |
| `verticalCheck` de altura libre | Ya está en `js/r03-cabinet-geometry.js` |
| `donor*`, comparador y taller | Herramientas de paridad con el donante, solo de laboratorio |
