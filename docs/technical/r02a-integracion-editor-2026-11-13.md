# R02-A · Techos y elementos altos — integración en el editor de RUBIK

**Fecha:** 13/11/2026.

| Rama | Base | PR |
|---|---|---|
| `integration/r02a-ceiling-on-master-20261113` | `master@1902b827d62f9fd2ad3cb059d458964596b15331`, actualizada a `master@f119f1bbec4e3b3ee66a64c5e3aa2c7a6e4d72af` (R03 #222) | Draft, **NO MERGE** |

**Estado:** conectado al editor principal, **EXPERIMENTAL**. Pendiente de:
- ratificar el contrato `x-r02a-ceiling` y la referencia vertical;
- el GO específico del propietario.

No es MEP, ni iluminación, ni climatización, ni normativa. **No comprueba la altura de paso para personas.**

## 1. Qué se reutiliza (no hay un segundo motor)

| Pieza | Origen | Cambios en esta rama |
|---|---|---|
| `js/r02a-ceiling-core.js` (núcleo #193) y `js/r02a-donor-extracts.js` | #203 | **Ninguno** (las guardas de SHA-256 siguen) |
| `js/r02a-ceiling-session.js` (evaluación, contención, alternativas) | #203 | Ninguno |
| `js/r02a-ceiling-contract.js` (`x-r02a-ceiling`) | #203 | `+removeVerticalReference`: retirar una referencia mal introducida |
| `js/r02a-ceiling-bridge.js` (escribir dentro de `mutate`, avisar, recomprobar) | #217 | `+clearReference` |
| Laboratorio, escenarios y pruebas de #203/#217 | #203/#217 | Las dos guardas «index.html no carga R02-A» pasan a exigir el conjunto exacto y el orden |

`#217` entra por merge commit (`09274da`). Contiene `#203`. Sus ramas originales no se tocan.

**Lo nuevo es solo interfaz:** `js/r02a-ceiling-editor.js`.

## 2. Contrato `extensions['x-r02a-ceiling']` — estado

**Candidato preferente, implementado, reversible. No es contrato definitivo.**

```
project.extensions["x-r02a-ceiling"] = { version: 1,
  verticalReferences: [ { scope: 'project' | 'room', roomId?, clearHeightMm, reference: 'finished-floor' | 'level-floor', source } ],
  items: [ { id: 'cei_…', type, roomId, position{x,y}, rotationDeg, size{widthMm,depthMm,heightMm}, sizeSource,
             dropMm, curtainLengthMm|null, review: 'human-confirmed', confirmedAt } ] }
```

**Por qué basta sin tocar el esquema canónico:**
- todos los lectores 1.x aceptan las claves `x-…` (incluidas las plantas estrictas de edificio);
- los lectores que no conocen R02-A conservan y no interpretan la extensión;
- retirar la extensión entera vuelve al proyecto de antes.

Comprobado con los módulos reales (`tests/r02a-integration-contract.test.cjs`, 7/7):

| Punto del encargo | Resultado |
|---|---|
| 1. Guardar y recuperar sin tocar el canon | Solo cambia `extensions['x-r02a-ceiling']`; el resto del proyecto queda **byte a byte** |
| 2. Proyectos antiguos o sin R02-A | Sin efectos. `Core.geometry` (muros, estancias, muebles) no ve los elementos de techo |
| 3. Guardar, cerrar y reabrir | `Core.prepare` (archivo JSON) y la biblioteca local lo conservan; al abrir se **recomprueba** todo |
| 4. Incompletos, dañados o fuera de contrato | Ocho formas: versión no entera o futura, campo desconocido, sin confirmación humana, id repetido, sin descuelgue, referencia sin fuente y tipo desconocido. En todas: el proyecto abre; no se escribe encima; la limpieza no lo toca; el panel lo dice y queda de **solo lectura** |
| 5. Deshacer, rehacer, duplicar, eliminar, cambiar estancias | Cada operación es **un** paso del deshacer de RUBIK (prueba de navegador). Una variante duplicada conserva la extensión. Las 1500 secuencias adversariales de #217 siguen verdes |
| 6. Huérfanos | Al desaparecer una estancia, sus elementos y su referencia propia se retiran **en el mismo paso** (`commit()` y `tracing-ui` `apply()`). Deshacer devuelve estancia y techo. La referencia de la planta se conserva |
| 7. Sin contaminar | Sin cambios en: la entrega al cliente (ENT-01 descarta `extensions`), el borrador de presupuesto, las plantas de edificio, `x-r03-cabinet` y los muebles (los elementos de techo **no** son `objects[]`) |

**Alternativas, si no se ratifica:**

| Opción | Qué supone |
|---|---|
| A · `objects[]` con tipo de techo | Rechazada en #203: RUBIK los trataría como muebles de suelo |
| C · colección `ceilingItems[]` | Exige una versión menor del esquema, `CHANGELOG` y `building-core`. **No se toca sin autorización** |

## 3. Referencia vertical — recomendación concreta (pendiente de ratificación, ya implementada)

**Por planta, con excepción por estancia.**

- La referencia de `scope:'project'` es la de la planta activa: en un edificio, cada planta es su propio `project`.
- Una estancia **solo** lleva la suya si es distinta, por ejemplo con un falso techo en el baño.
- Regla de búsqueda (`verticalFor`): la de la estancia; si no hay, la de la planta; si no hay, **desconocida**.

**Por qué no solo por estancia:**
- RUBIK no tiene techo por estancia. La altura es de la planta: `defaults.wallHeightMm`, y en edificio se deriva de la planta superior.
- Calcar, generar o importar rehace estancias con ids nuevos. Una referencia solo por estancia se pierde cada vez y deja el techo «pendiente».

**Por qué no solo por planta:** un falso techo local no tendría dónde anotarse.

| Pregunta | Respuesta |
|---|---|
| Qué representa cada cota | `clearHeightMm`: altura libre desde el plano de referencia hasta la cara inferior del techo acabado o falso techo, en ese ámbito. Por elemento: `dropMm` es el descuelgue desde el techo hasta la cara superior. Arriba = altura libre − descuelgue; abajo = arriba − alto; punto más bajo = abajo − caída de cortina |
| Desde qué plano | El declarado: **suelo acabado** (por defecto en el panel) o **forjado**. El 3D de RUBIK no modela el espesor del pavimento y dibuja los dos desde y = 0 (limitación anotada) |
| Si es desconocida | Estado **«Pendiente de datos»**: sin cotas, sin techo en 3D, no se puede guardar. **Nunca se supone**: la altura de los muros no se usa como techo |
| Si cambia la altura de la estancia o la planta | Nada se mueve ni se borra. Tras el cambio (`afterEdit`), un aviso dice qué deja de cumplir y por qué («descuelgue + altura superan la altura libre… No se ha movido nada»); queda en rojo en el plano y en 3D. Decide una persona |
| Fuera de contrato | `validateExtension` revisa forma, campos, huérfanos, ids, confirmación humana y fuente. Lo de una versión futura o dañado se conserva **sin escribir**; lo huérfano se retira solo cuando su estancia desaparece en ese mismo paso |
| Guardar y reabrir | Va dentro del proyecto (biblioteca local y archivo JSON). Al abrir, `afterLoad` recomprueba cada elemento con las referencias y los demás elementos del archivo, y avisa si alguno ya no cumple |

**No implementado, decisión pendiente:** derivar la altura libre de la planta superior en un edificio. El núcleo ya sabe hacerlo y detecta contradicciones, pero el contrato aún no le pasa el edificio.

## 4. Qué está conectado al editor y qué no

| Conectado (activo en esta rama) | Inactivo o fuera de alcance |
|---|---|
| Sección «Techo y elementos altos · experimental» en el panel de **la estancia seleccionada**, con los límites siempre visibles | Una herramienta en la barra principal: el acceso es contextual, desde la estancia |
| Referencia de la planta o de la estancia: con fuente obligatoria y posibilidad de quitarla | Altura derivada de la planta superior (§3) |
| Añadir, modificar y quitar elementos (6 tipos del catálogo del donante) | Seleccionar un elemento de techo tocándolo en el plano: se selecciona desde la lista de la estancia |
| «Comprobar», «Ver alternativas» y «Colocar tocando el plano» (ratón y dedo) | Formas 3D detalladas (R02-B), luminarias reales, cálculo lumínico, MEP, normativa |
| Guardar solo con la casilla de confirmación expresa; todo por `commit()`, en un paso del deshacer | Regla de altura de paso para personas (decisión de producto, §6) |
| Plano 2D: capa `#gCeiling`, con color por estado | Exportaciones y entrega al cliente: no incluyen los elementos de techo (ENT-01 descarta `extensions`) |
| 3D: grupo propio a sus cotas; nada si no hay referencia | Lectura cruzada con R03 (armario frente a altura libre): no se empieza sin aprobar los dos contratos |
| Avisos: tras cada cambio, al abrir y con datos futuros o dañados | |

## 5. Puntos de conexión en `index.html` (+15 / −2) y coordinación con R03

Hay cinco puntos, todos aislados y lejos de las zonas que toca R03 (#215: `furnPanel`, `bindFurnPanel`, `showProperties`, `buildFurniture` y el final del archivo):

1. Seis `<script>` tras `variants-compare-adapter.js`.
2. `commit()`: `RubikCeilingEditor.reconcile(project)` antes de validar (huérfanos en el mismo paso).
3. `renderPanel()`, rama de estancia: `RubikCeilingEditor.roomPanel(p, ui.sel.id)`.
4. `renderAll()`: `RubikCeilingEditor.render()`. En el 3D, el grupo se añade en `init` y se le pasa el origen en `sync()`.
5. `FloorPlanApp.applyCeiling(fn)`: `snap`, cambio, `commit`, `validateSel` y `renderAll`.

Además, `js/tracing-ui.js` `apply()` hace la misma reconciliación, porque borra estancias sin pasar por `commit()`.

**Retirada:** quitar los seis `<script>` desactiva todo. Los demás puntos usan `?.` y no hacen nada sin el módulo.

**Convivencia con R03 (actualizado, 13/11/2026):** R03 llegó a `master@f119f1b` (#222) y se integró en esta rama con un merge (`d115160`), sin conflictos de texto.

Las guardas de R03 se adaptaron **sin relajarse**:
- `tests/r02a-activation-manifest.cjs` enumera la activación R02-A exacta: 6 módulos, 6 puntos en `index.html` y 1 en `tracing-ui`, y 5 referencias al global.
- La A4 de R03 sigue vetando R01, cualquier otro R02, `sculpt`, MCP, `labs/` y orígenes externos. Solo admite esos 6 módulos exactos.
- `tests/r02a-activation.test.cjs` es el equivalente de I0/I1 para R02-A. Exige:
  - el bloque R02-A contiguo, después de RUBIK y **antes** del bloque R03, que sigue siendo el último (I1 de R03);
  - los puntos exactos;
  - que ningún módulo de una línea use el global de la otra;
  - que el esquema canónico no se amplíe.
- Control: un séptimo script R02-A, un script R01, una referencia extra al global o quitar el punto de `tracing-ui` hacen fallar las guardas.

`tests/r02a-r03-coexistence.browser.test.cjs` comprueba los dos en el mismo editor:
- un interior de armario y un plafón en la misma estancia;
- deshacer y rehacer;
- duplicar y borrar el armario;
- quitar la estancia, que retira solo el techo;
- reabrir y ver los dos en 3D.

**No** se incorporó nada de la rama de R03 fuera de lo que ya está en `master`.

## 6. Riesgos y decisiones pendientes

1. **Altura de paso:** un elemento «revisable» puede colgar a una altura incompatible con la circulación. Ejemplo de #217: con la referencia rebajada a 1000 mm, un colgante de 600 mm queda a 40 cm del suelo.
   - El aviso es fijo en el panel.
   - Una regla de paso libre es una decisión de producto: qué altura, dónde y para quién.
2. **Muebles sin altura:** los muebles de RUBIK no guardan `heightMm`. Un elemento sobre un mueble queda «pendiente de datos» y no se puede guardar; solo se guarda en zonas libres.
   - Lo correcto es no suponer.
   - Decisión: permitir indicar la altura del mueble, o aceptar esta limitación en el piloto.
3. **Contrato:** `x-r02a-ceiling` (B) frente a `ceilingItems[]` (C, versión menor del esquema). Necesita autorización.
4. **Referencia vertical:** ratificar «planta con excepción por estancia» y si se deriva de la planta superior en edificios.
5. **Recolocación automática:** solo con muros alineados a los ejes, como en #193.
6. **Tamaños:** los del catálogo del donante son genéricos y están rotulados.
7. **GOV-05:** aportación con coautoría de IA y aviso MIT del donante (`docs/licenses/r02a-donor-MIT.txt`). Sigue abierto.
8. **Nombres de muebles:** en los avisos se muestran como están guardados (en el ejemplo, en chino). El editor los traduce con un diccionario interno de `index.html`.
