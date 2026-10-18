# Primer corte multipiso — QA (18-10-2026)

**Estado vigente, 18-10-2026:** el contrato #50, el primer corte #51 y las correcciones #52 → #53 → #54 están fusionados en `master` (HEAD tras #54: `0766dc5`). La revisión visual conjunta y las pruebas dirigidas de las correcciones están registradas en §5; la regresión completa en el entorno de Claude no fue limpia y no se presenta como aprobada. La GPU representativa de Juanma se probó para el primer corte #51, pero no se ha repetido para #52–#54; faltan CI ejecutada y teléfonos físicos (§6). El sofá del edificio conflictivo en «Paso» sigue sin sitio válido y requiere corrección manual.

- **Decisión:** opción D de [#50](../technical/multilevel-contract-gate0-2026-10-17.md), aprobada por Juanma.
- **Contrato:** [FloorPlanBuildingV1](../contracts/FloorPlanBuildingV1.md).

| | SHA |
| --- | --- |
| Base histórica de #51: #50, rama `docs/multilevel-contract-gate0` | `dc84066`; código igual a `master` `5c822cf` en aquella prueba |
| Código probado del primer corte #51 | `fe2a1a1` |
| Commits posteriores de #51 | Sólo `docs/` y `scripts/qa/` hasta su HEAD de entonces; esta comparación no describe el `master` actual |
| Correcciones ya integradas | #52 `5e945f3`, #53 `7dfaa64`, #54 `0766dc5` (commits de fusión) |

## 1. Qué hay

### Implementado y validado en el contenedor

- **Contrato `FloorPlanBuildingV1` 1.0.0:**
  - un `FloorPlanProjectV1` 1.x completo por planta, validado en modo estricto;
  - 1–2 plantas con orden, elevación, forjado visual y desplazamiento en mm;
  - escaleras rectas entre plantas contiguas;
  - reglas de error con ruta y avisos BW1–BW4 orientativos;
  - versión desconocida rechazada.
- **Lectores 1.x:** `FloorPlanCore.validate` rechaza un edificio con un mensaje explícito, y por tanto también lo rechazan la app, el MCP y el exportador Blender. `FloorPlanCore.validate(project, {strict: true})` se añade como opción; por defecto su comportamiento no cambia.
- **Intercambio:**
  - JSON del edificio;
  - ZIP con `building.json`, `manifest.json` y rutas de imagen por planta, verificado (rutas, manifiesto, tamaños, SHA-256, dimensiones) antes de aplicar nada;
  - «Exportar esta planta» en JSON o ZIP 1.x, con aviso de lo que omite.
- **Biblioteca local:** el edificio es una unidad al guardar, reabrir, duplicar, crear variantes y borrar. La limpieza de imágenes recorre todas las plantas de todos los edificios.
- **Crear el edificio** desde un proyecto de una planta, como entrada nueva; el 1.x no se toca. La segunda planta puede ser vacía o venir de imagen o PDF por el flujo de subida existente.
- **Editor 2D:**
  - selector de planta accesible, con `aria-pressed`, teclado y tacto;
  - sólo se edita la planta activa, con un deshacer/rehacer por planta;
  - la planta inferior aparece atenuada para alinear;
  - la escalera se ve en ambas plantas: peldaños y «Sube» abajo, «Hueco de escalera» arriba.
- **3D:**
  - plantas apiladas por elevación y desplazamiento, con «Ver todas» o hasta la activa;
  - forjado visual con hueco y huecos del suelo superior y del techo inferior iguales a la huella;
  - escalera de N peldaños;
  - encuadre del edificio visible;
  - materiales y objetos de cada planta. Las plantas no activas usan mobiliario genérico, porque los GLB autorizados sólo se cargan en la activa.
- **Superficies** por planta y total.
- **Consumidores de una planta** (presentación, lámina, variantes) nombran la planta activa. Una planta exportada funciona en Blender (#24/#42) y en el MCP. La revisión de distribución opera por planta.

### Implementado, pendiente de gate externo

- Rendimiento con GPU representativa en el PC de Juanma (§6.1).
- Rendimiento y uso táctil en móvil físico (§6.2).
- **CI:** GitHub Actions; se registra en la PR. Mientras termine sin pasos, **CI no ejecutada**.

### No implementado: cortes futuros

- Recorrido libre o guiado que sube la escalera.
- Exterior, fachada, cubierta y terreno.
- Más de dos plantas.
- Escaleras en L, U o de caracol.
- Rotación entre plantas.
- IFC multiplanta completo; hoy se sigue importando la planta con más muros.
- GLB o vídeo del edificio completo.
- Herramientas MCP de edificio.
- Variantes por planta.
- GLB autorizados en plantas no activas.

## 2. Entorno de las pruebas locales

| Elemento | Valor |
| --- | --- |
| Contenedor | 4 vCPU, sin GPU |
| Navegador | Chromium 141.0.7390.37 (`CHROME=/opt/pw-browsers/chromium`) con SwiftShader (ANGLE Vulkan, software) |
| Node y herramientas | Node v22.22.0, Playwright 1.56.1, Python 3.13.16 |
| three@0.160.0 | Copia del paquete npm oficial vía `THREE_LOCAL_DIR`, porque el proxy deniega `cdn.jsdelivr.net` |
| MCP | `@modelcontextprotocol/sdk@1.30.0` y `zod@4.5.4` instalados con `npm install --no-save` en `tools/rubik-mcp`; sin ellos `protocol.test.mjs` no puede ejecutarse |

## 3. Resultados

| Suite | Comando | Resultado en `fe2a1a1` |
| --- | --- | --- |
| Unitarias Node | `ls tests/*.test.cjs \| grep -v browser \| xargs node --test` | 213 tests: 211 pass, 0 fail, 2 skip (preexistentes) |
| Contrato del edificio | `node --test tests/building.test.cjs` | 11 pass, 0 fail (incluidas en la fila anterior) |
| Schema (Python) | `python3 tests/building_schema.test.py` y los demás `tests/*.test.py` | 5 archivos OK |
| MCP | `cd tools/rubik-mcp && node --test` | 6 pass, 0 fail |
| Navegador, flujo multipiso | `node --test --test-concurrency=1 tests/building.browser.test.cjs` | 3/3 viewports pass (139 s en la suite completa) |
| Navegador, suite completa | 26 archivos, en serie y archivo a archivo | 236 tests: 201 pass, 27 fail, 7 sin resultado, 1 skip. Desglose abajo. **No es una regresión limpia.** |

**Suite de navegador completa, archivo a archivo.** Mismo entorno; la base es `5c822cf`, cuyo código es el de #50. Se ejecutaron en la base todos los archivos con algún fallo o caso sin resultado.

| Archivo | `fe2a1a1` | `5c822cf` | Atribución |
| --- | --- | --- | --- |
| `browser.test.cjs` | 26 pass, 10 fail, 1 skip | Mismos 10 fallos | Entorno: `page.goto` agota 30 s. Este archivo trae three.js con `curl` desde el CDN, y el proxy lo bloquea. No es de este corte. |
| `assets` | 24/25 (fallo en «furniture search … 1440x900», timeout) | 25/25 | Caso intermitente. En `fe2a1a1`: otras 2 ejecuciones completas 25/25 y 3/3 en solitario. En la base: 3/3 en solitario. Sin reproducción; queda registrado, no se cuenta como aprobado. |
| `presentation` | 48 pass, 8 fail, 2 sin resultado | Mismos 10 casos | P13 ×4, P07 ×4 (estado durante un vuelo de 650 ms), P15 y P08 (sin resultado). Igual que en R10. |
| `presentation-reveal` | 2 pass, 6 fail | Mismos 6 | M10, estado durante una animación. Igual que en R10. |
| `presentation-batch` | 7 pass, 2 fail | Mismos 2 | M11 ZIP 1440×900 y M20: la descarga no llega en 30 s con SwiftShader. |
| `material-detail` (M08), `presentation-light` (M09), `presentation-minimap` (M13), `procedural-details` (M17), `render-budget` (M16) | 1 caso sin resultado en cada uno | Los mismos sin resultado | Límite de tiempo con SwiftShader. Igual que en R10. |
| Otros 16 archivos | Todo pass | — | `building` 3/3, `capture-3d` 3/3, `guide` 5/5, `guide-navigation` 4/4, `layout-review` 2/2, `mirror-pilot` 1/1, `multiformat-guide` 9/9, `presentation-contact` 5/5, `presentation-framing` 6/6, `presentation-route` 8/8, `room-layout` 5/5, `sheet` 7/7, `surfaces` 7/7, `upload` 8/8, `variants` 4/4, `variants-visual` 4/4. |

**Fallo propio corregido durante el ciclo:** en `1a9cb8e`, `assets` daba 6 fallos (`net::ERR_ABORTED`). Al entrar en 3D se reenviaba un contexto de plantas sin cambios, se forzaba una reconstrucción y se abortaban las cargas GLB en curso. La corrección está en `fe2a1a1`: un contexto idéntico no reconstruye nada. Después, `assets` dio 25/25 en dos ejecuciones completas de las tres.

Los fallos y casos sin resultado que coinciden con la base no son regresiones nuevas, pero **tampoco cuentan como aprobados**. La regresión limpia necesita el PC con GPU (§6.1). **CI:** se registra aparte en la PR.

## 4. Qué cubre el flujo de navegador (`tests/building.browser.test.cjs`)

En cada viewport (1440×900, 390×844 con tacto y 844×390 con tacto) y desde la UI:

1. Crear un proyecto vacío y dos estancias con «+ Estancia».
2. «Plantas…» → crear el edificio con planta vacía. El proyecto 1.x original queda idéntico byte a byte.
3. En la planta alta:
   - crear el dormitorio;
   - desplazamiento X 2600 mm, con la alineación «2 de 4 muros» comprobada;
   - escalera recta de 14 peldaños, con sus valores derivados y la etiqueta sin verificación normativa;
   - superficies «16,80 + 10,56 = 27,36 m²»;
   - avisos BW3 y BW4.
4. Cambiar de planta con Enter y Espacia. Comprobar:
   - `aria-pressed` correcto;
   - historiales independientes: deshacer y rehacer en una planta nunca cambian el hash canónico de la otra;
   - peldaños abajo y hueco arriba;
   - planta inferior atenuada.
5. En 3D:
   - 14 peldaños desde −3,1 m hasta 0;
   - hueco en el suelo superior y en el techo inferior;
   - suelo del entorno a −3,115 m;
   - «hasta la activa» oculta la planta alta y «Ver todas» la muestra a +3,1 m.
6. F5: el edificio vuelve idéntico, con su planta activa.
7. Exportar el edificio en JSON (menú) y en ZIP, y exportar la planta alta como 1.x válido estricto, con el aviso de lo que omite.
8. Reimportar el JSON como entrada nueva. Un ZIP manipulado (escalera a una planta inexistente) se rechaza y la colección queda byte a byte igual. El ZIP auténtico se importa.
9. Comprobar:
   - la nota de presentación de una planta;
   - el título de la lámina con la planta;
   - una variante del edificio que copia el edificio entero;
   - la comparación de variantes que nombra la planta.
10. El proyecto de una planta: sin barra de plantas y sin geometría de edificio en 3D.
11. Crear una planta desde PNG y otra desde PDF de una página con el flujo de subida: el mensaje dice «nueva planta del edificio».
12. Duplicar y borrar un edificio. La imagen compartida se conserva hasta que ninguna entrada la referencia, y entonces se borra.
13. Sin `pageerror` ni errores de consola.

Capturas en `docs/qa/artifacts/multilevel/<viewport>-NN-*.png`, generadas por esta prueba durante la regresión completa de `fe2a1a1`.

## 5. Revisión visual

Se abrieron y revisaron las capturas de los tres viewports.

**Defectos de este corte, corregidos durante el ciclo:**

| Defecto | Corrección |
| --- | --- |
| El 3D no recibía el contexto de plantas si el módulo 3D cargaba después del primer render. | Reenvío al entrar en 3D. |
| El encuadre isométrico ignoraba las otras plantas y la altura, y con dos plantas casi cenital no se leía el apilado. | Encuadre del edificio visible, con un ángulo más oblicuo y algo más de distancia en vertical. |
| Casilla de la planta atenuada desalineada en el diálogo. | Ajuste de estilo. |
| El aviso de escala decía «difiere» con ambas plantas pendientes. | Texto según el caso. |
| La subida de una planta desde imagen anunciaba «nuevo proyecto». | Ahora dice «nueva planta del edificio». |
| Guardar al recargar cambiaba `updatedAt` del edificio sin cambios reales. | Guardar una planta sin cambios no escribe nada nuevo. |

**Límites y seguimiento tras la revisión humana del 18-10-2026:**

- **Solape de «Hueco de escalera» (revisión humana del 18-10-2026).** Juanma **no aprobó** el resultado visual de #51: en la planta primera del fixture, «Hueco de escalera» se solapaba con la cama y con la etiqueta y las cotas del dormitorio. Se integraron #50 y #51 con esta deuda explícita. GitHub Issues está desactivado (API 410), así que este informe y las PR son el registro. **Resuelto en la PR de corrección** (ver §5.1). La prevención para proyectos nuevos es BW5 (§5.2). Nada de esto implica que la escalera sea transitable ni que cumpla normativa.
- En «Ver todas», la planta alta tapa el interior de la baja desde este ángulo; para ver la baja se usa «hasta la activa» o los muros seccionados.
- En móvil, el panel de propiedades se abre al crear una estancia, como antes de este corte. La prueba lo cierra antes de capturar.

### 5.1 Solape del hueco de escalera: causa y corrección

Medido sobre el fixture (`tests/fixtures/building-fixture.cjs`) en el marco local de cada planta, en mm, y en pantalla con `tests/stair-overlap.browser.test.cjs`, que importa el ZIP del fixture desde la UI.

**Causa 1 — datos: el fixture colocaba muebles sobre la escalera.** No era un efecto de dibujo.

| Planta | Escalera / hueco | Mueble anterior | Solape |
| --- | --- | --- | --- |
| Primera | hueco x 2300–4700, y 1650–2550 | Cama, centro (2400, 1500), 1600×2000, 90° → x 1400–3400, y 700–2300 | 1100 × 650 mm (0,72 m²) |
| Baja | escalera x 4900–7300, y 1650–2550 | Sofá, centro (6000, 1300), 2000×900 → x 5000–7000, y 850–1750 | 2000 × 100 mm |

Corrección:

- cama en (1300, 1600) a 0° → x 500–2100, y 600–2600;
- sofá de dos plazas de 1400×800 en (6900, 900) → x 6200–7600, y 500–1300.

En un «Estar» de 3000×2400 mm, un sofá de 2000×900 junto a la escalera no dejaba sitio libre para la etiqueta de la estancia. El ejemplo `docs/contracts/examples/floorplan-building-v1.example.json` lleva los mismos cambios. `tests/building.test.cjs` comprueba que ningún mueble del fixture pisa la escalera ni el hueco de su planta, y que el detector marca las dos posiciones anteriores.

**Causa 2 — colocación de textos: no había ninguna regla respecto a la escalera.**

- La etiqueta de estancia se dibujaba en `room.labelAt`, (2600, 1600) en el dormitorio. Su bloque (nombre, superficie y `4400 × 2400 mm`) ocupa y ≈ 1370–2100, así que entraba en el hueco desde y 1650. En la baja pasaba lo mismo con «Estar».
- «Hueco de escalera» y «Sube» se dibujaban fuera de la huella, a `ancho/2 + 180 mm` del eje: y 2730 en la primera, encima del borde del hueco y pegado al muro.
- El orden de capas no era la causa: la escalera ya se dibujaba encima de los muebles, y por eso el solape se veía.

Corrección (sólo presentación; el documento y `labelAt` no cambian, comprobado tras importar):

- `FloorPlanBuilding.stairLabel`: el texto de la escalera va dentro de su huella, centrado entre la flecha y el borde, derecho, y con letra reducida sólo si no cabe. En el fixture queda en (3500, 2325), con letra de 170 mm.
- `FloorPlanBuilding.labelAnchor`: si el bloque de la etiqueta de estancia toca una huella o un hueco de su planta (con 100 mm de margen), se busca el punto más cercano de la estancia, en una rejilla de 100 mm, que esté libre de escaleras y, si es posible, también de muebles.
  - El dormitorio queda en (3000, 1000), a 150 mm del hueco y a 125 mm de la cama.
  - Si no hay ningún sitio libre de escalera, se mantiene `labelAt` y el conflicto sigue visible.
  - Si una etiqueta no toca ninguna escalera, no se mueve: los proyectos de una planta no cambian.
- La escalera sigue dibujándose encima de los muebles, así que una colisión real de datos no se oculta.

**Evidencia** (`docs/qa/artifacts/multilevel/stair-overlap/`): `before/` es `master` `54b9206` y `after/` es esta corrección, con el mismo test, el mismo fixture de cada rama y el mismo encuadre «Ajustar».

| Viewport | Planta primera | Planta baja |
| --- | --- | --- |
| 1440×900 | [antes](artifacts/multilevel/stair-overlap/before/1440x900-upper.png) · [después](artifacts/multilevel/stair-overlap/after/1440x900-upper.png) | [antes](artifacts/multilevel/stair-overlap/before/1440x900-lower.png) · [después](artifacts/multilevel/stair-overlap/after/1440x900-lower.png) |
| 390×844 | [antes](artifacts/multilevel/stair-overlap/before/390x844-upper.png) · [después](artifacts/multilevel/stair-overlap/after/390x844-upper.png) | [antes](artifacts/multilevel/stair-overlap/before/390x844-lower.png) · [después](artifacts/multilevel/stair-overlap/after/390x844-lower.png) |
| 844×390 | [antes](artifacts/multilevel/stair-overlap/before/844x390-upper.png) · [después](artifacts/multilevel/stair-overlap/after/844x390-upper.png) | [antes](artifacts/multilevel/stair-overlap/before/844x390-lower.png) · [después](artifacts/multilevel/stair-overlap/after/844x390-lower.png) |

Cada captura tiene al lado su `.json`, con los rectángulos en pantalla de la escalera, su texto, las etiquetas, las cotas, el mueble y el selector de planta.

- **En `master` (`54b9206`):** en los tres viewports y en ambas plantas, el mueble y las tres líneas de la etiqueta de estancia se solapan con la escalera, y el texto de la escalera queda fuera de su huella. El test da 0/3.
- **Con la corrección:** el test da 3/3. Revisé las seis capturas una a una:
  - en la primera, «Hueco de escalera» se lee dentro del hueco;
  - el dormitorio y sus cotas quedan por encima, sin tocar la cama;
  - en la baja, «Sube» va dentro de la escalera, y «Estar», su superficie y sus cotas quedan libres del sofá y de la escalera;
  - el rótulo «Sofá» se lee;
  - la escalera aparece en ambas plantas;
  - el selector de planta se ve.
- **Geometría medida en pantalla** (los `.json` de `after/`): en las seis capturas no se solapan el mueble con la escalera, las etiquetas con la escalera o con el mueble, ni las cotas con la escalera.

**Límites residuales:**

- **Alcance de esta corrección:** sólo el dibujo y el fixture. **No previene** que una persona coloque un mueble sobre una escalera en un proyecto nuevo. Eso es la PR de prevención (BW5), apilada sobre esta.
- En la baja, la línea de la hoja de la puerta entre «Cocina» y «Estar» pasa detrás de «7.20 m²». Se lee gracias al halo. La regla no tiene en cuenta los barridos de puertas.
- El texto de la escalera cruza las diagonales del hueco y la flecha. Se lee gracias al halo blanco.
- A 390×844 el plano encuadrado completo hace pequeños todos los textos, como antes de esta corrección. Se leen ampliando con dos dedos.
- No es de este defecto: en móvil, el botón flotante «Inicio» tapa parcialmente el botón «Planta baja» del selector. Pasa igual en `master` (`before/390x844-*.png`).

### 5.2 Prevención: aviso BW5, mueble sobre una escalera

La corrección de §5.1 sólo arregla el dibujo y el fixture. BW5 detecta, evita y ayuda a corregir el mismo tipo de conflicto en **cualquier** edificio. La regla está en [FloorPlanBuildingV1 §4.1](../contracts/FloorPlanBuildingV1.md#41-bw5-mueble-sobre-una-escalera-o-su-hueco).

**Revisión humana de #53 (18-10-2026), reproducida en un contexto limpio** con un edificio distinto del fixture (`tests/fixtures/stair-conflict-building.cjs`):

- **Al pasar a 3D, el aviso desaparecía.** La causa era una regla CSS mía (`main.is3d .level-conflicts{display:none}`): el aviso seguía en el DOM pero oculto. No era caché ni almacenamiento anterior.
- **El sofá seguía sobre la escalera en 3D.** Es correcto: el dato está ahí. Se comprobó que el 3D construye la misma huella que evalúa BW5 (ver «Pruebas»).
- **Duplicar en un proyecto de una planta pasaba por `placeNew()`,** y por tanto por `pushOut`. Se ha restaurado el comportamiento anterior: copia a +200 mm, comprobado.
- **`placeNew()` devolvía el mueble a la posición pedida,** sobre la escalera, cuando la búsqueda acababa en un muro, y lo colocaba con un aviso. Se ha eliminado: si no hay un sitio demostrado, el mueble no se añade.

**Detectar:**

- Un único cálculo derivado para **todas** las plantas (`buildingStatus`): sin conflicto, pendiente o evidencia insuficiente.
- Se recalcula en cada render: importar, abrir, cambiar de planta, añadir, duplicar, mover, girar, dimensionar, editar la escalera, deshacer, rehacer y recargar.
- No se guarda en el JSON.

**Diagnosticar:**

- **Aviso fijo en 2D y en 3D**, abajo a la derecha: «⚠ N conflictos en N plantas: distribución pendiente», con el botón «Revisar».
  - Con un mueble seleccionado se eleva por encima de la barra flotante.
  - En pantallas bajas se compacta a «⚠ N».
  - La prueba comprueba que no tapa cotas, escala, selector de planta, selector 2D/3D, la barra flotante ni el mueble seleccionado.
- **«Revisar»** abre un diálogo modal accesible: foco en la primera acción, navegable por teclado y tacto. Lista los conflictos por planta, con mueble, escalera, penetración nominal, confianza de escala y qué puede hacer la persona. Cada conflicto ofrece:
  - **«Localizar en el plano 2D»:** pasa a 2D, activa la planta, selecciona el mueble y lo encuadra;
  - **«Ver esta planta en 3D»** (en 3D): muestra esa planta sin las superiores, como forma fiable de aislarla con «Ver todas» activo;
  - **«Editar la escalera»**.
- **En 2D**, el mueble se marca con contorno discontinuo, trama y una marca «!», con nombre accesible.

**Evitar:**

- **Añadir o duplicar en un edificio con escalera** usa `FloorPlanPlacement.find` (`js/furniture-placement.js`):
  - la búsqueda es determinista, en anillos de 50 mm alrededor del punto pedido, con un máximo de 4000 posiciones;
  - la huella girada completa tiene que quedar dentro de **una sola estancia** y no penetrar en más de 1 mm la escalera o el hueco, los muros, el barrido documentado de las puertas ni otros muebles;
  - si el punto no está en una estancia, o está en más de una, no se adivina;
  - **si no hay sitio demostrado, el mueble no se añade**, y un diálogo explica el obstáculo y cómo elegir otra ubicación.
- **Proyectos sin escalera:** se mantiene `pushOut` como antes.
- **Política de confirmación:** `commit()` es el único punto de confirmación de cambios (arrastre 2D y 3D, giro, tamaño, teclado, panel, añadir y duplicar). Rechaza cualquier cambio que cree un BW5 nuevo en la planta activa:
  - el mueble vuelve a su última posición válida, la del inicio de la operación;
  - el historial de deshacer no cambia;
  - se explica el motivo.

  Durante el arrastre, el resaltado y el aviso se actualizan en vivo. Mover un mueble que ya estaba en conflicto se permite, porque no crea un conflicto nuevo.
- **Datos antiguos:** un mueble antiguo o importado nunca se mueve solo, ni al abrir, ni al guardar, ni al cambiar de planta.

**Escalera:**

- El formulario lista, antes de guardar, los muebles de **ambas** plantas que quedarían sobre la huella, y explica que, si se guarda, la distribución queda pendiente con una ruta de corrección para cada mueble.
- Cerrar sin guardar no cambia nada (comprobado byte a byte).

**Borrador, importación y respaldo:**

- **Importar un JSON o ZIP válido** conserva el contenido canónico, los IDs y las posiciones. El edificio conserva su propio nombre: el ZIP lo sustituía por el nombre del archivo, y se ha corregido.
- **Guardar el borrador** sigue permitido.
- **Exportar el JSON o ZIP de respaldo** sigue permitido y avisa «Atención: N conflictos…».
- **Variantes:** la tarjeta de cada variante muestra «Muebles sobre escaleras (BW5)».

**Política de salidas de presentación:**

- Mientras el estado no es `clear`, no se genera **ninguna** salida que pueda verse como propuesta terminada. Se abre la lista de conflictos para corregirlos.
- El bloqueo está en las primitivas, no en los botones, para que no se pueda eludir:
  - `FloorPlanPresentation.open` (cubre el botón principal «Presentar mi vivienda» y la guía);
  - `FloorPlanSheet.open` y su descarga (lámina);
  - `exportPNG` (exportar imagen 2D/3D, también desde la guía);
  - `View3D.shot` (toda captura 3D, incluidas las de la presentación y su ZIP de imágenes).
- Siguen disponibles la inspección 3D, el guardado y los respaldos JSON/ZIP.

**Corrección manual:**

- Desde la lista se localiza el mueble; se arrastra fuera de la escalera o a otra estancia, o se edita la escalera.
- Tras cada cambio se reevalúa todo el edificio. En la prueba, al recolocar el sofá y la cama, el estado pasa a `clear` en 2D y en 3D, el aviso desaparece, las salidas se permiten de nuevo, y tras F5 el estado sigue `clear`.

**Pruebas:**

- `tests/stair-conflicts.test.cjs` y `tests/furniture-placement.test.cjs`:
  - casos deterministas, entre ellos estado global, evidencia insuficiente, estancia ambigua o ausente, Paso sin sitio, contacto con la cara del muro frente a 10 mm dentro, barrido de puerta, otro mueble y mueble girado;
  - biblioteca con duplicado y variante;
  - rendimiento: búsqueda con 40 muebles y diagnóstico con 300 objetos;
  - correspondencia de la huella 3D.
- `tests/stair-conflicts.browser.test.cjs` recorre el flujo completo en 3 viewports y la regresión de duplicar en una planta.

**Capturas:** `docs/qa/artifacts/multilevel/stair-conflicts/` (11 por viewport), revisadas:

- pendiente en 2D, en la planta baja y en la primera;
- 3D de la planta baja y «Ver todas»;
- lista de conflictos y planta aislada en 3D;
- mueble localizado en 2D;
- «sin sitio»;
- estado `clear` en 2D y en 3D con «Ver todas»;
- vista previa del formulario de escalera.

**Límites:**

- Es en planta: no evalúa altura libre, paso, recorrido ni normativa.
- El barrido de las puertas se aproxima por el cuadrado de la hoja (conservador).
- Las alfombras y los elementos colgados no bloquean la colocación, como en la revisión de distribución.
- Al importar un ZIP con imágenes, las referencias de imagen pasan al almacén local, que es necesario para mostrarlas.
- En una estancia ocupada por la escalera, como «Paso», la etiqueta de la estancia no encuentra sitio libre.
- **Cámara, como seguimiento aparte:** en «Ver todas», desde un ángulo alto, la planta alta tapa la baja y el encuadre deja el edificio pequeño. Aquí sólo se ofrece «Ver esta planta en 3D»; no se ha rediseñado la cámara.
- No se ha validado en teléfonos físicos, GPU real ni con CI.

### 5.3 Recolocación asistida: «Buscar sitio libre»

Apilada sobre BW5 (§5.2). Propone posiciones para muebles **existentes** que pisan una escalera. Nunca las aplica sin «Aplicar».

**Dónde está:**

- En «Revisar», cada conflicto tiene «Buscar sitio libre».
- Con dos o más conflictos en una misma planta aparece también «Buscar sitio para los N de «planta»».

**Cómo propone (`FloorPlanPlacement.proposeSet`, `js/furniture-placement.js`):**

- Usa la misma búsqueda que al añadir: determinista, anillos de 50 mm alrededor de la posición actual y un máximo de 4000 posiciones por mueble.
- Se queda **en la estancia que contiene el mueble**; si son varias o ninguna, no propone.
- Conserva tamaño, giro e ID.
- **Varios muebles:** se proponen en orden, cada uno contra la distribución que ya incluye las propuestas anteriores, y el conjunto se valida entero. No se aplican propuestas calculadas por separado: la prueba demuestra que dos propuestas aisladas chocarían entre sí y que la propuesta conjunta no choca.
- **Comprobado:** la huella girada completa dentro de la estancia, la escalera y su hueco, los muros, el barrido de las puertas y otros muebles, con 1 mm de tolerancia.
- **No comprobado** (y así se indica en el panel): altura libre, paso o recorrido, normativa y muebles en otras plantas.

**Vista previa:**

- Silueta verde discontinua en el destino y una flecha desde el origen.
- Un panel indica, para cada mueble:
  - origen y destino en mm;
  - distancia nominal y estancia;
  - el conflicto que resuelve;
  - lo que no se comprueba.
- Botones «Aplicar» y «Cancelar».
- **No se guarda nada hasta «Aplicar».** Cancelar, recargar con F5 o cualquier cambio del plano descartan la propuesta.

**Aplicar:**

- Antes de aplicar, se recalcula y se exige que coincida con lo mostrado.
- Se aplica como **un solo cambio**, por `commit()` (un paso de deshacer; «Rehacer» lo vuelve a aplicar).
- Después se reevalúa el edificio.
- Si queda algún conflicto, aparece otro problema evaluable o falla el guardado, se revierte entero y se explica.

**Panel en móvil horizontal (corregido tras la revisión de Juanma):**

- **Defecto:** a 844×390, el título «Propuesta… · vista previa, sin aplicar» quedaba cortado por arriba y sólo se veía «Aplicar las 2».
- **Causa medida:** el panel estaba bien situado dentro del escenario (y 64–360, entre la barra superior, que termina en 58, y la inferior, que empieza en 366). Su contenido medía 327 px y el área visible 292 px. Al abrirse, el foco iba a «Aplicar», el último elemento, y eso desplazaba el panel 29 px: el título quedaba en y 43, fuera de la vista. Con una lista larga, el título llegaba a y −359. No intervenían el encuadre del plano ni el posicionamiento.
- **Corrección:** el título y los botones son fijos y sólo se desplaza la lista (`#relocationBody`). El foco inicial va al título, de modo que se lee qué se moverá antes de llegar a «Aplicar». El panel nunca se desplaza entero.
- **Prueba:** `panelReachable` mide el título, la lista y los botones dentro del panel, y el panel dentro del escenario, antes y después de desplazar la lista hasta el final. También comprueba el foco en el título y que el aviso de conflictos no queda tapado.
  - Se ejecuta a 1440×900, 390×844 y 844×390.
  - Hay un caso aparte a 844×390 con una lista de 7 muebles.
  - Con el código anterior falla con las coordenadas citadas.

**Sin sitio:**

- «No se ha encontrado sitio libre para «Sofá» en «Paso» dentro del límite de búsqueda (N posiciones). Corrígelo a mano…», con «Aplicar» desactivado.
- Rubik no coloca el mueble en un sitio inseguro ni lo mueve en segundo plano.

**Pruebas:**

- `tests/furniture-relocation.test.cjs`:
  - propuesta válida, con la entrada intacta y determinista;
  - sin sitio;
  - dos muebles que chocarían por separado;
  - estancia ambigua.
- `tests/stair-relocation.browser.test.cjs`, a 1440×900, 390×844 y 844×390:
  - vista previa, cancelar y F5 durante la vista previa;
  - guardado fallido sin cambios;
  - aplicar en un paso, deshacer y rehacer;
  - comprobación en 3D;
  - «Paso» sin sitio;
  - F5 después de aplicar.
- Capturas en `docs/qa/artifacts/multilevel/stair-relocation/`.

**Revisión visual conjunta de #52 → #53 → #54 (versión apilada final):**

- **Límite preexistente, también en `master` `54b9206`:** a 1440×900 el documento mide 914 px en una ventana de 900, porque la biblioteca de muebles sobresale. Un desplazamiento para mostrar un elemento, como el que hace Playwright al pulsar, puede mover la ventana 14 px y cortar la barra superior en una captura.
  - No bloquea ningún flujo y es ajeno a #52, #53 y #54.
  - La prueba exige que la página no se desplace con el panel de propuesta abierto. En las demás capturas restablece el desplazamiento para poder compararlas.
- El diálogo «Revisar» a 844×390 se desplaza (592 px de contenido en 333 visibles). El título está visible al abrir y «Cerrar» y las acciones quedan alcanzables al final del desplazamiento.

**Límites:**

- Sólo mueve dentro de la misma estancia y la misma planta; no cambia muebles de estancia.
- La propuesta para varios depende del orden: es determinista, pero no es la mejor posible.
- No reorganiza la estancia: si nada cabe sin mover otros muebles, informa y no propone.

## 6. Gates que debe ejecutar Juanma

### 6.1 PC con GPU (Windows, PowerShell)

```powershell
git -C C:\Users\temp123\work\floorplan-3d-casa-serra fetch origin feat/multilevel-first-cut
git -C C:\Users\temp123\work\floorplan-3d-casa-serra worktree add C:\Users\temp123\work\fp-multilevel fe2a1a1282f3980a45b7148fd8a55c476d777fa1
cd C:\Users\temp123\work\fp-multilevel
npm init -y > $null; npm install --no-save playwright@1.62.1
$env:CHROME = "C:\Program Files\Google\Chrome\Application\chrome.exe"
node scripts/qa/presentation/gpu-check.cjs                 # debe decir representative: true (sin SwiftShader)
node scripts/qa/multilevel/perf.cjs 1440x900               # criterio: ratio ≤ 1.5 y representative: true
node scripts/qa/multilevel/perf.cjs 390x844
node --test --test-concurrency=1 tests/building.browser.test.cjs
New-Item -ItemType Directory -Force gpu-regression > $null
Get-ChildItem tests/*browser.test.cjs | % { $n=$_.BaseName; node --test --test-concurrency=1 --test-reporter=tap $_.FullName *> "gpu-regression/$n.log"; "$n exit=$LASTEXITCODE " + ((Select-String -Path "gpu-regression/$n.log" -Pattern '^# (tests|pass|fail|cancelled|skipped) ').Line -join ' ') | Add-Content gpu-regression/summary.txt }
Get-Content gpu-regression/summary.txt
```

**A comunicar:** la salida de `gpu-check.cjs` y de los dos `perf.cjs`, y `gpu-regression/summary.txt`. `cancelled` significa sin resultado, no aprobado.

`--test-reporter=tap` es obligatorio en el bucle: desde Node 23 el reporter por defecto es `spec` también al redirigir a un archivo, y `spec` no escribe las líneas `# tests`, `# pass`, `# fail`, `# cancelled` y `# skipped` de las que `summary.txt` toma los recuentos. Si una línea de `summary.txt` sólo tiene `exit=…` sin recuentos, ese archivo no cuenta como ejecutado.

### 6.2 Móvil físico (al menos un Android de gama media y un iPhone)

1. En el PC, generar el ZIP del fixture: `node scripts/qa/multilevel/fixture-zip.cjs edificio-fixture.zip`. Pasarlo al teléfono.
2. Abrir en el teléfono la preview de Vercel, con la sesión de Vercel iniciada (la protección de previews exige login). «Subir plano» → `edificio-fixture.zip`.
   - **URL fija de `883ec8b`:** <https://floorplan-3d-9vscih4cj-juanma-espinosas-projects.vercel.app>. Es inmutable: no cambia con nuevos pushes. Los commits posteriores a `883ec8b` sólo tocan `docs/`.
   - El alias de rama `floorplan-3d-git-feat-multilev-cb698f-juanma-espinosas-projects.vercel.app` apunta siempre al último push de la rama; si se usa, comprobar su SHA en el panel de Vercel.
3. **Comprobar:**
   - el selector de planta funciona con el dedo;
   - «Plantas…» se puede leer y desplazar;
   - en 3D, «Ver todas» muestra las dos plantas y la escalera;
   - salir y volver restaura el estado;
   - no se pierde el contexto WebGL.
4. **Medir los FPS** con el teléfono en reposo 10 s, en órbita, primero con el proyecto de ejemplo de una planta y después con el edificio y «Ver todas»:
   - Android: `chrome://inspect` en el PC, luego Rendering → Frame rendering stats;
   - iPhone: Safari → Desarrollo → Línea de tiempo.
5. **Criterio:** la mediana de fotograma con el edificio no supera 1,5 veces la de una planta, y no hay pérdida de contexto WebGL. Como no hay presupuesto móvil aprobado (decisión 3 de Roadmap 2), este primer registro es la línea base.

## 7. Rendimiento medido aquí (no representativo)

| Viewport | Una planta (mediana / p90) | Dos plantas, «Ver todas» (mediana / p90) | Ratio | Renderer |
| --- | --- | --- | --- | --- |
| 1440×900 | 162,3 / 186,9 ms | 192,7 / 220,4 ms | 1,19 | ANGLE SwiftShader (no representativo) |
| 390×844 | 76,2 / 84,0 ms | 107,9 / 121,5 ms | 1,42 | ANGLE SwiftShader (no representativo) |

Una medición anterior a 1440×900 dio 147,4 frente a 180,3 ms (ratio 1,22).

Son SwiftShader en 4 vCPU: no sirven para GPU ni para móviles. El criterio sólo se dará por cumplido con §6.

## 8. Riesgos

- **Fidelidad:** un desplazamiento mal puesto o escalas distintas entre plantas. Mitigación: la planta inferior atenuada, la alineación medida, BW3 y BW4, y el texto «medidas orientativas».
- **Rendimiento:** dos plantas duplican la geometría. Las plantas no activas usan mobiliario genérico, sin GLB.
- **Compatibilidad hacia atrás:** si se vuelve a una versión anterior de la app después de crear un edificio, esa versión no podrá abrir la colección local. Fallará con un error explícito y conservando los datos, sin aplanar el edificio. Conviene exportar antes de un retroceso de versión.
- **Producto:** que alguien lea «edificio» como modelo constructivo. Los textos dicen siempre propuesta orientativa y sin verificación normativa ni estructural.
