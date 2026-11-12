# SCULPT-R03 completo — armarios paramétricos: contrato candidato, editor, 3D y QA

**Fecha:** 12/11/2026 · **Rama:** `feat/sculpt-r03-complete` · **Base:** `master@eae8cf6709a4523b1e6009e6b9bee393044977fc`
**Estado:** COMPLETA PARA AUDITORÍA, en laboratorio aislado. **No integrada en RUBIK.**

Para integrarla hacen falta tres cosas, en este orden:

1. la decisión del propietario sobre la persistencia (§A1.4);
2. la cirugía de integración de ChatGPT sobre archivos reservados (§5);
3. la aprobación visual humana.

No es CAT-03, ni sirve para fabricación, pedidos o presupuesto.

## 0. Qué hay y qué no

| Pieza | Archivo | Carga `index.html` |
|---|---|---|
| Motor puro, la autoridad geométrica única (ya en master, I0) | `js/r03-cabinet-core.js` | No |
| **A1** · contrato candidato y adaptador puro | `js/r03-cabinet-contract.js` | No |
| **A2** · sesión de edición pura (deshacer/rehacer/restaurar, explicaciones) | `js/r03-cabinet-editor-core.js` | No |
| **A2** · componente de interfaz montable | `js/r03-cabinet-editor-ui.js` | No |
| **A3** · geometría 3D pura (mm) | `js/r03-cabinet-geometry.js` | No |
| **A3** · adaptador three.js (usa el three r160 de `vendor/`) | `js/r03-cabinet-three.js` | No |
| Laboratorio demostrable, proyecto sintético | `labs/sculpt/r03-editor/index.html` (excluido de Vercel por `.vercelignore`) | — |
| Pruebas | `tests/r03-cabinet-contract.test.cjs` (15), `tests/r03-cabinet-editor.test.cjs` (13), `tests/r03-cabinet-audit.test.cjs` (5), `tests/r03-editor.browser.test.cjs` (15) | — |
| CI | `.github/workflows/r03-sculpt-complete.yml` | — |

**Archivos reservados que esta rama NO toca:**

- `index.html`;
- `js/professional-workspace-ui.js`;
- `js/delivery-*`;
- `css/delivery-client.css`;
- `api/*`;
- los workflows ajenos;
- el esquema canónico (`docs/contracts/FloorPlanProjectV1.schema.json`, `js/project-schema.js`) y `js/building-core.js`.

## A1 · Contrato de interiores

### A1.1 Datos que guarda

Se guarda una entrada por armario, con estos campos:

- **`objectId`** y **`objectType`** (`wardrobe`, `tallcab`, `cabinet`, `shoecab`), para detectar si el objeto cambia de tipo.
- **`outer`:** `{w, d}` en mm enteros, que son las medidas del objeto al guardar.
- **`cabinet`**, con los campos exactos del motor:
  - `height`, `thickness`, `back`, `frontGap`, `plinth`, `locked`;
  - `front`, que es el estado de las puertas: `closed`, `open` o `hidden`;
  - `doorCount`;
  - `columns[]`, los módulos, cada uno con `width`, `kind`, `shelves[]` (cotas en mm), `rod` (null o mm), `drawers` y `drawerHeight`.
- **`provenance`**, la procedencia de los valores, que nunca se presenta como medición:
  - `height`: `object-height`, `assumed-type-default` o `edited`;
  - `boards`: `assumed` o `edited`;
  - `layout`: `default` o `edited`.
- **`updatedAt`.**

Las dimensiones interiores y las restricciones no se guardan. Se derivan siempre del motor (`cavity`, `openings`, `drawerSize`, `validate`), así que no puede haber dos verdades.

### A1.2 Las tres opciones, medidas con pruebas

| Criterio | 1 · Campo en `objects[]` | **2 · `extensions["x-r03-cabinet"]` (candidata)** | 3 · No persistir |
|---|---|---|---|
| Válido hoy sin cambiar el esquema | **No.** 1.0.0 lo rechaza («unknown field»). Otras 1.x lo toleran, pero sin significado. | **Sí**, en todas las 1.x | Sí |
| Niveles de edificio (validación `strict`) | **Rechazado.** Además exige ampliar la lista cerrada `PROJECT_VERSIONS` de `building-core`. | **Aceptado** (prueba con IDs como `obj_floor-cabinet`) | — |
| Lectores que no conocen el dato | Lo conservan solo en versiones «futuras» | Lo conservan (contrato §7, «los lectores deben conservarlos») | — |
| Borrar el objeto | El interior desaparece con él | Puede quedar huérfano si borra un lector ajeno: se detecta con `orphans()` y se limpia con `prune()`; `removeObject()` borra ambos | — |
| Duplicar el objeto | Se copia solo | Hace falta `copyInterior()` (propuesta de conexión) | — |
| Entrega al cliente (ENT-01) | Habría que excluirlo a mano | `minimizeProject` ya elimina `extensions` | — |
| Política del contrato | Necesita una versión menor 1.13.0, el esquema, `CHANGELOG`, `building-core` y la migración de lectores | Cumple C-5: lo experimental va en `x-*` y se consolida en una versión menor | Pierde el trabajo del usuario |

**Evidencia:** `tests/r03-cabinet-contract.test.cjs`, en «option 1 measured, not adopted» y el resto de casos.

### A1.3 Comportamiento del adaptador (todo puro y atómico)

- **`read`.** Distingue estos estados:
  - `none`: sin interior guardado; se propone uno por defecto con su procedencia supuesta;
  - `ok`;
  - `adapted`: el objeto cambió de medidas y el interior se reescala con el motor, pendiente de revisar;
  - `stale`: ya no cabe; se devuelve el guardado sin tocarlo;
  - `invalid` y `future`: solo lectura;
  - `not-cabinet` y `unknown-object`.
- **`write`:**
  - valida con el motor y con `FloorPlanCore.validate`;
  - ajusta `size.heightMm`, `widthMm` y `depthMm` del objeto al armario, para que planta, alzado y 3D compartan un único estado;
  - se rechaza sin cambiar nada si la extensión es futura o está dañada, si el objeto no es un armario, o si los datos no son válidos.
- **Funciones auxiliares:** `remove`, `removeObject`, `orphans`, `prune` y `copyInterior`.

### A1.4 Decisión que tiene que tomar el propietario

| | |
|---|---|
| **Qué se decide** | Dónde se guardan los interiores de armario en los proyectos de RUBIK |
| **Recomendación** | **Opción 2 ahora (`x-r03-cabinet` versión 1, experimental) y consolidación en la opción 1 en una versión menor futura**, cuando el uso real confirme el modelo |
| **Por qué** | Funciona ya en proyectos y edificios sin tocar el esquema canónico; no rompe a lectores existentes; ENT-01 no lo expone al cliente; sigue la regla C-5 del contrato |
| **Riesgo de la opción 2** | Interiores huérfanos si otro lector borra el objeto (mitigado con `orphans`/`prune` y con `removeObject` en la cirugía); la etiqueta «experimental» exige revisión en PR |
| **Riesgo de la opción 1 hoy** | Cambio de esquema, versión menor, `building-core` y migración: más superficie de cambio antes de validar el producto |
| **Riesgo de la opción 3** | El usuario pierde su trabajo al cerrar; no sirve para el producto |
| **Ya hecho de forma segura** | Adaptador, pruebas y laboratorio sobre la opción 2 aislada, sin declararla oficial |

## A2 · Editor de interiores

- **Una sola autoridad.** Cada operación es una función de `RubikCabinetCore`. El editor solo propone, por ejemplo la posición de una nueva balda (el centro del hueco más alto), y el motor decide.
- **Operaciones:**
  - seleccionar módulo, dividir y unir;
  - anchura del módulo;
  - añadir, editar y quitar baldas;
  - barra sí/no y su altura;
  - número y altura de cajones;
  - puertas cerradas, abiertas u ocultas, y número de puertas;
  - ancho, fondo y alto;
  - deshacer, rehacer, restablecer (también deshacible), cancelar y guardar.
- **Rechazo atómico.** El estado no cambia, el rechazo no entra en el historial, el campo vuelve a su valor y se explica en lenguaje claro, con los números del cambio rechazado. Por ejemplo: «Módulo 1: cada balda necesita al menos 60 mm libres…» o «6 cajones de 400 mm (2400 mm) no caben: la altura libre es 2084 mm…».
- **Procedencia.** Solo pasa a `edited` lo que el usuario cambió de verdad. Abrir las puertas no cuenta como cambiar la distribución.
- **Teclado:**
  - los módulos forman una lista de pestañas (←/→/Inicio/Fin);
  - Ctrl+Z, Ctrl+Y y Ctrl+Mayús+Z;
  - Escape restaura el campo;
  - Enter confirma una sola vez.
- **Móvil:** alzado, 3D y planta en pestañas fijas arriba mientras se editan los controles; botones de al menos 44 px; en horizontal, las vistas a la izquierda y los controles a la derecha.

## A3 · Representación 3D

- **Geometría pura en mm** (`RubikCabinetGeometry.parts`). Usa el marco de los muebles de RUBIK: frente en +z, `rotation.y = −rotationDeg` y `elevationMm` como base. Incluye zócalo, costados, base, techo, trasera, divisores, baldas, barras (cilindros), cajones (caja, frente y tirador), y puertas con pivote en la bisagra (0° cerradas, ±90° abiertas, ninguna si están ocultas). Con las puertas abiertas, los cajones salen su recorrido.
- **Coherencia probada:**
  - En navegador, en coordenadas de mundo: baldas, divisores, barras y cajones del 3D están a la misma altura y en la misma posición que en el alzado.
  - El ancho del casco es igual al ancho del objeto.
  - Las hojas abiertas quedan delante del frente y coinciden con el barrido en planta.
  - La huella en los cuatro cuadrantes y a 33° coincide con `toPlan` de RUBIK.
  - La colocación de los cinco armarios del proyecto replica `buildFurniture`.
- **Altura al techo.** No se infiere. Sin una referencia confirmada el estado es «sin comprobar». Con referencia: si no indica fuente, queda pendiente; si está medida desde el forjado, también pendiente; si es válida, cabe o no cabe, con el margen.

## A4 · Auditoría

| Criterio | Resultado |
|---|---|
| Estado único | La sesión es la única fuente durante la edición. El proyecto guarda una entrada por objeto y el objeto adopta las medidas del armario. |
| Mutaciones | Ninguna función muta sus entradas (comprobado con objetos congelados) |
| Pruebas adversariales | 4 000 ediciones aleatorias en 4 tipos, incluidos NaN, ±∞, valores fuera de rango, fracciones y operaciones desconocidas: 0 estados inválidos aceptados y 0 cambios tras un rechazo. Además, 600 daños aleatorios al documento guardado: todos se notifican, ninguno lanza una excepción ni se repara solo. |
| Muebles ordinarios y proyectos heredados | `index.html` no carga ningún archivo R03. Los objetos que no son armarios no se escriben nunca. Guardar un armario solo cambia su `size.heightMm` y la extensión. |
| Deshacer | Devuelve los estados exactos. Restablecer también se puede deshacer. Una edición nueva descarta la rama de rehacer. |
| Rendimiento | El caso máximo (8 módulos, cajones, baldas, puertas abiertas) tiene 135 piezas y tarda unos 0,08 ms de geometría por edición. Un rechazo no reconstruye el 3D. |
| Accesibilidad | Nombres accesibles, mensajes en región viva (`alert` y `status`), foco nunca tapado por las vistas fijas (WCAG 2.4.11), objetivos de al menos 44 px |
| GOV-05 | El motor y la geometría derivada citan al donante y la licencia MIT (`docs/licenses/r03-donor-MIT.txt`). El resto es código original. Se mantiene la incertidumbre ya registrada sobre la aportación PR #11: esto no es un dictamen jurídico. |
| Regresión del repositorio | 1050 pruebas unitarias: 1048 pasan y 0 fallan |

### Ciclos de pulido (observar → cambiar → capturar → criticar → corregir)

| Observado en captura | Cambio | Verificado |
|---|---|---|
| Fondo del 3D negro, luz apagada | Fondo de escena, *tone mapping* ACES, luz hemisférica y ambiental | Captura 3D a 1440 |
| Nombres en chino del proyecto de referencia | Tipo en español; nombre original como dato secundario | Lista y cabecera |
| Campos numéricos que cortaban el valor; «Cajones» duplicado | Anchura mínima de 9 caracteres; una sola etiqueta | 1440 y 390 |
| En el móvil la planta empujaba el alzado; cotas de unos 5 px | Pestañas Alzado/3D/Planta; tipografía de cotas para móvil; etiqueta de módulo en dos líneas | 390×844 |
| En el móvil se editaba lejos de las vistas | Vistas fijas. Hubo dos causas raíz: rejilla de una columna y `overflow-x:hidden` en `body`, sustituido por `clip` | Prueba: la parte superior de las vistas queda a 0 px o menos al desplazarse |
| Controles enfocados tapados por las vistas fijas | `scroll-padding` dinámico | Toques en 390×844 |
| En horizontal, las vistas y la barra tapaban los controles | Maquetación a dos columnas; acciones no fijas en pantallas bajas | Toques en 844×390 |
| Enter confirmaba dos veces (`keydown` + `change`) y el «Sin cambios» tapaba el resultado | Guardia del último valor confirmado | Prueba de baldas cercanas válidas |
| La explicación de cajones citaba los valores vigentes y no los propuestos | La explicación usa el cambio rechazado | Prueba unitaria «6 cajones de 400 mm» |
| Muros seccionados a 1 m que tapaban el zócalo | Corte a 35 cm | Captura con las puertas ocultas |

## 4. Pruebas y resultados reales (local, Chromium de Playwright)

```
node --test tests/r03-integration-core.test.cjs tests/r03-cabinet-contract.test.cjs tests/r03-cabinet-editor.test.cjs tests/r03-cabinet-audit.test.cjs   → 40/40
CHROME=… node --test --test-concurrency=1 tests/r03-editor.browser.test.cjs                                                                            → 15/15
node --test $(ls tests/*.test.cjs | grep -v browser)                                                                                                     → 1050 tests, 1048 pass, 0 fail
```

Capturas seleccionadas en `docs/qa/sculpt-r03-complete/`. El conjunto completo es el artefacto `r03-editor-<sha>` del workflow.

## 5. Propuesta de conexión para la cirugía (ChatGPT; sin aplicar)

1. **Cargar** en `index.html` los módulos puros `r03-cabinet-core`, `-contract`, `-editor-core`, `-geometry` y `-three`, y el componente `-editor-ui`.
2. **Abrir el editor desde el panel del mueble** (`index.html:1785`, pie con Rotar/Duplicar/Eliminar). Si el tipo es un armario, añadir el botón «Interior», que monta `RubikCabinetEditorUI.mount(panel, {session, onSave})`. Al guardar se usa `RubikCabinetContract.write` dentro de `mutate()`, para que quede en el deshacer de RUBIK.
3. **3D:** en `buildFurniture` (`index.html:2912`), cuando `read()` devuelva `ok` o `adapted`, usar `RubikCabinetThree.build(THREE, outer, cabinet)` en lugar de la caja genérica. Para ese caso hay que **omitir el reescalado general por `size.heightMm`** (`index.html:3351`), porque la geometría ya es exacta.
4. **Borrar:** en `deleteSel` (`index.html:1817`), aplicar `removeObject`, o `prune` tras el filtro, para que no queden huérfanos.
5. **Duplicar:** en `duplicateSel` (`index.html:1818`), aplicar `copyInterior(origen, copia)`.
6. **Persistencia:** no hace falta nada. `snap()`, `mutate()`, deshacer, guardar, JSON y ZIP ya conservan `extensions` (probado en A1). La entrega al cliente ya lo excluye.

## 6. Recorrido de demostración para el propietario (persona no técnica)

1. Abrir la Preview de revisión. ChatGPT verificará el SHA exacto y facilitará el enlace.
2. En **«1 · Elige un armario»**, tocar «Armario ropero · 2400 × 600».
3. Tocar **M2** y luego **«Dividir módulo»**: aparece un módulo más en el alzado y en el 3D.
4. En **Baldas**, tocar **«Añadir balda»**: la nueva balda se ve al momento.
5. Cambiar la cota de una balda para que quede casi encima de otra, por ejemplo a 20 mm: **aparece un aviso rojo que explica el motivo y no cambia nada.**
6. En **Cajones**, tocar **+** dos veces: se ven dos cajones. Intentar poner la barra justo encima: **aviso y sin cambios.**
7. En **Puertas**, elegir **«Ocultas (ver interior)»** y mirar el **3D**: se ve el interior. Después **«Abiertas»**: las hojas giran y los cajones salen; en **Planta** aparecen los barridos.
8. **«Deshacer»**, **«Rehacer»** y **«Restablecer»** devuelven exactamente el estado anterior.
9. **«Guardar interior»**: el armario de la lista pasa a «interior guardado».
10. Repetir los pasos 2 a 7 en el móvil, en vertical y en horizontal.

## 7. Riesgos, límites y bloqueos

- **Sin evaluar:** bisagras reales y aperturas de más de 90°, herrajes, tolerancias, cargas y flechas, normativa, otras plantas, fabricación, presupuesto y pedidos.
- **El sector de 90° es experimental.** El cuadrado de RUBIK sigue siendo la convención conservadora.
- **Valores supuestos.** Tablero de 18 mm, trasera de 9 mm, holgura frontal de 20 mm, zócalo de 80 mm y alturas por tipo son del donante y no están medidos. La interfaz los marca como «supuestos».
- **HOLD.** Elección de la persistencia (A1.4), cirugía en archivos reservados, aprobación visual humana C restante, y la ratificación de GOV-05 para el producto en I1–I3.
