# R03-I1 · Activación de los armarios paramétricos en el editor (13/11/2026)

**Base:** `master@1902b827d62f9fd2ad3cb059d458964596b15331`. Ya contiene:
- el motor puro R03-I0 (#198);
- la preintegración sin activar (#214);
- #219 (OBR-02/03);
- #221 (UX-07/ENT-04).

**Origen:** la conexión de `index.html` revisada en #215 (`adce8f9`). Se ha incorporado aquí **solo la activación**, sin las capturas ni la guía de revisión. La rama de #215 no se toca.

**Estado:** EXPERIMENTAL.
- Medidas supuestas, no de fabricante.
- No es fabricación, certificación técnica ni presupuesto de armarios.
- El interior no viaja en la entrega al cliente, porque `minimizeProject` descarta `extensions`.

## 1. Qué cambia en el producto

`index.html` gana 16 líneas y pierde 4. No hay ningún módulo R03 nuevo: los ocho módulos y la hoja de estilos ya estaban en `master`.

| Punto de conexión | Qué hace |
|---|---|
| Panel de un mueble | Muestra **«Interior del armario…»** solo si `RubikCabinetBridge.isCabinet(objeto)`, es decir, en los tipos de armario |
| Botón | Abre el diálogo. **Guardar** va dentro de `mutate()`: un solo paso de deshacer; si se rechaza, `mutate()` restaura el proyecto |
| `deleteSel` | Dentro del mismo `mutate()`, `afterDelete` quita el interior del mueble borrado: no quedan huérfanos |
| `duplicateSel` | Dentro del mismo `mutate()`, `afterDuplicate` copia el interior guardado a la copia |
| `buildFurniture` (3D) | Si hay un interior guardado y legible (`ok` o `adapted`), dibuja el armario exacto sin reescalarlo; si no, el armario de siempre |
| Final de la página | Una hoja de estilos y ocho scripts R03, todos de mismo origen |

**Persistencia:** el interior se guarda solo en `extensions['x-r03-cabinet']` y el mueble toma su `size.heightMm`. **El esquema canónico no cambia.**

## 2. Los dos guardas

Antes de la activación, dos pruebas exigían que `index.html` **no** cargase R03. Ninguna se ha borrado ni desactivado: cada una se ha dividido en lo que la activación autoriza y lo que sigue prohibido. Los límites autorizados están enumerados en un único manifiesto, `tests/r03-activation-manifest.cjs`.

| Guarda | Antes | Ahora |
|---|---|---|
| **I0** (`tests/r03-integration-core.test.cjs`) | «I0: no schema expansion or editor binding is implicitly authorized»: esquema sin `cabinetInterior` **y** `index.html` sin `r03-cabinet-core.js` | **I0** (sin cambios en lo esencial y más estricto): el esquema no tiene ninguna propiedad de armario o interior en los objetos, `additionalProperties` sigue en `false` y `extensions` conserva solo el espacio genérico `x-…`.<br>**I1** (nuevo): `index.html` carga **exactamente** los ocho módulos y la hoja del manifiesto, una vez cada uno, en orden, desde `js/` y `css/`, después de RUBIK y como último bloque. Hay exactamente **5** referencias a los globales R03, una por punto de conexión, y nada de `labs/` |
| **A4** (`tests/r03-cabinet-audit.test.cjs`) | «nothing in RUBIK loads or changes»: seis módulos R03 no cargados + muebles ordinarios y proyectos antiguos intactos | **A4 loading** (nuevo): solo se carga la activación autorizada. Nada de `labs/` ni de otras piedras (R01, R02/R02-A), MCP o `sculpt/`, y nada de otro origen.<br>**A4 ordinary furniture…** (sin cambios): cargar un proyecto no lo cambia, los muebles que no son armarios nunca se tocan, y guardar un interior solo cambia `size.heightMm` de ese mueble y la extensión |

**Contraprueba:** los guardas se ejecutaron sobre copias manipuladas y **fallan** en cada uno de estos casos:
1. el `index.html` de `master` sin activar;
2. un script de `labs/`;
3. un módulo R02-A;
4. una sexta llamada a un global R03;
5. los módulos R03 fuera de orden;
6. una propiedad `cabinetInterior` en el esquema.

## 3. Contrato de persistencia `extensions['x-r03-cabinet']`

| Comprobación | Resultado | Dónde se prueba |
|---|---|---|
| Proyectos sin R03 | Se abren igual. Leer no escribe, y el 3D es el de siempre | `r03-cabinet-contract` (A1 legacy), A4 |
| Guardar → recargar | Se conserva (almacén local) | `r03-editor-in-rubik` §7 |
| **Exportar JSON → importar** en el editor real | Interior **idéntico byte a byte** | `r03-editor-in-rubik` (archivo) |
| ZIP del proyecto y edificios de varias plantas | Se conserva. Ninguna clave del interior coincide con el filtro multinivel de `building-core` | `r03-cabinet-contract` (A1 ZIP, buildings) |
| Deshacer y rehacer | Guardar es **un** paso; deshacer lo quita y rehacer lo devuelve | `r03-editor-in-rubik` §6, `r03-cabinet-bridge` |
| Duplicar y borrar | La copia recibe el interior; borrar no deja huérfanos | `r03-editor-in-rubik` §8 |
| **Datos dañados** | El proyecto se abre completo; el interior se muestra **en solo lectura** con el motivo («datos dañados»); no se puede guardar ni se repara en silencio; el 3D usa el armario genérico | `r03-editor-in-rubik` (archivo), `r03-cabinet-contract` (A1 damaged) |
| Versión futura u otras extensiones `x-*` | Solo lectura; se conservan sin tocar | `r03-cabinet-contract` |
| Entrega al cliente (ENT-01) | No lleva el interior | `r03-cabinet-contract` (A1 client delivery) |
| UX-07 «Comparar con el original» | Compara proyectos con interior sin errores. Solo muestra el cambio de altura del mueble: **las diferencias de interior no se describen** | Comprobación pura `revision-compare-core.compare` |

**No hace falta cambiar el esquema canónico**: `extensions` ya admite `x-r03-cabinet`.

## 4. Límites y decisiones abiertas

- Interior experimental con medidas supuestas: no es fabricación, presupuesto ni CAT-03. **GOV-05** (derechos del donante, MIT documentado) sigue registrado como riesgo residual.
- UX-07 no describe los cambios de interior: es una mejora posible, fuera de este corte.
- Las pruebas son de Chromium de Playwright con SwiftShader: no sustituyen la comodidad táctil en un teléfono real ni el juicio visual del 3D en una GPU real.
