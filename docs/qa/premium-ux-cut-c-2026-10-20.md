# QA — Corte C: «Tu marca profesional» en las entregas al cliente (20-10-2026)

| | |
| --- | --- |
| Rama | `feat/premium-brand`, apilada sobre `feat/premium-ux-system` (corte A) |
| Diseño | [§5 del diseño](../product/premium-ux-design-2026-10-20.md#5-tu-marca-profesional-corte-c), con la decisión de Juanma del 20-10-2026 |
| Entorno | Chromium 141 con SwiftShader (sin GPU), three.js local y teléfono emulado |
| CI | **No ejecutada** |

## 1. Pregunta de diseño y resultado

«Si una inmobiliaria, una promotora o un estudio entrega esta presentación, ¿parece un trabajo preparado y firmado por ese profesional? ¿Sabe el cliente de quién procede y cuál es el siguiente paso?»

**Dónde se gestiona.** En «Archivo → Tu marca profesional…» se crean, editan y borran perfiles. Cada perfil tiene:
- nombre comercial (obligatorio);
- persona responsable, teléfono, correo y web;
- un lema;
- un logo.

Caben varios perfiles por navegador, para quien trabaja con más de una empresa.

**Elección por proyecto.** Cada proyecto elige «Firmar con» un perfil o «Sin marca». La elección se puede hacer desde la barra de la lámina o desde la configuración de la presentación, y es la misma en los dos sitios. La configuración de la presentación añade también un título y una introducción para el cliente.

**Qué recibe el cliente.** Una instantánea del perfil tomada al generar la entrega:

| Entrega | Con marca |
| --- | --- |
| **Lámina SVG** | En la banda de título: logo, nombre, contacto en dos líneas y lema. Pie: «Preparado por … con Rubik Sota». Se conservan «Cotas y superficies orientativas; verifica medidas in situ» y «Medidas orientativas» |
| **Presentación en pantalla** | Marca y título en la tarjeta. Introducción en la vista general. En la última vista: «Siguiente paso: contacta con … · contacto» |
| **Vistas PNG del lote y PNG individual** | Franja inferior clara con logo, nombre, título y nombre de la vista. La imagen conserva su tamaño |

**Sin marca**, todo queda como antes. La prueba lo comprueba sobre la lámina de un proyecto antiguo.

## 2. Datos y contrato

**Dónde se guarda:**
- Perfiles: `localStorage` `rubik-sota-brand-profiles-v1` (`{version:1,profiles}`).
- Elección por proyecto: `rubik-sota-brand-delivery-v1` (`{version:1,entries:{[entryId]:{profileId,title,intro}}}`).
- Ambos son datos locales del navegador, como el vínculo de variantes de D-C1.

**Sin cambios de contrato.** No cambian `FloorPlanProjectV1`, `FloorPlanBuildingV1`, el paquete editable, la lista de rutas de los ZIP ni las claves de `presentation.json`. La prueba lo verifica sobre el ZIP real: el manifiesto conserva sus claves y ni el manifiesto ni el proyecto editable contienen datos de marca.

**Instantánea.** Al editar un perfil, las entregas ya descargadas no cambian; la siguiente usa el nombre nuevo (probado).

**Borrado.**
- Al borrar un perfil, sus proyectos vuelven a «Sin marca».
- El título y la introducción se conservan.
- Lo ya descargado no cambia.

**Datos dañados o futuros.** No rompen el editor:
- con JSON inválido se leen como vacíos;
- los perfiles inválidos se ignoran;
- una versión futura no se malinterpreta (prueba unitaria).

**Atribución y avisos.**
- La autoría de la plataforma, la cláusula de no reventa y las atribuciones de terceros siguen donde estaban (`#legal-y-uso`, activos).
- El pie dice «Preparado por [profesional] con Rubik Sota». No afirma certificación ni precisión técnica (D-01).

## 3. Validación

| Entrada | Regla | Prueba |
| --- | --- | --- |
| Nombre comercial | Obligatorio, máximo 80 caracteres, sin caracteres de control | «Escribe el nombre comercial» |
| Teléfono | Cifras, espacios, `+ - . ( )` | «llámame» rechazado |
| Correo | Formato `usuario@dominio.tld` | `ana@` rechazado |
| Web | Sólo `http(s)`, con dominio y sin credenciales; se añade `https://` si falta | `javascript:` rechazado (unitaria y navegador), `user:pw@` y `localhost` rechazados |
| Logo | PNG, JPG o WebP de hasta 4 MB. Se descodifica y **se vuelve a codificar como PNG**, a un máximo de 600×240 px, con un límite final de 300 KB. SVG rechazado | SVG con `onload` rechazado. La lámina no contiene `javascript:`, `<script` ni `onload` |
| Textos | Todo pasa por `textContent` o nodos de texto SVG | — |

## 4. Pruebas

- **`tests/brand-core.test.cjs`** (3): validación, varios perfiles, elección por proyecto, instantánea congelada, borrado, datos dañados y límite de 12 perfiles.
- **`tests/brand.browser.test.cjs`** (1440×900, 390×844 y 844×390). Inspecciona los archivos reales:
  - **Proyecto antiguo:** su lámina no lleva marca.
  - **Diálogo:** errores por campo; logo SVG rechazado; logo PNG, que se muestra con su nombre; dos perfiles; el diálogo cabe en pantalla sin desplazamiento horizontal.
  - **Lámina SVG descargada:** contiene el bloque de marca, nombre, contacto, crédito y avisos, y el logo como PNG embebido. No contiene contenido activo.
  - **Edición posterior del perfil:** el SVG ya descargado no cambia.
  - **Ni el proyecto ni sus copias llevan datos de marca:** sin cambios en el proyecto, el JSON exportado sin marca y la entrada de la biblioteca también.
  - **Presentación:** la elección es la misma que en la lámina; título e introducción; marca en la tarjeta; introducción en la vista general; contacto en la última vista.
  - **Lote ZIP real** (1440×900): las claves del manifiesto no cambian, no hay datos de marca y el PNG lleva la franja con el mismo tamaño declarado en el manifiesto.
  - **Borrado:** el proyecto vuelve a «Sin marca».
  - Sin errores de consola.
- **Con el código anterior falla:** no existen `#brandManage` ni `FloorPlanBrand`.

**Capturas** en [`artifacts/premium-ux/brand/`](artifacts/premium-ux/brand/), en las tres medidas: diálogo vacío, diálogo con marca guardada, lámina firmada, configuración, vista general y última vista.

## 5. Defectos encontrados y corregidos

| # | Defecto | Corrección |
| --- | --- | --- |
| C1 | En la lámina, la línea de contacto (72 caracteres) se cortaba con logo y perdía el correo y la web | El contacto va en dos líneas: persona y teléfono; correo y web |
| C2 | Con marca, el título se cortaba demasiado pronto («3 dormitor…») | Se cortan 46 caracteres en vez de 34 |
| C3 | El selector de archivo nativo mostraba «Choose File / No file chosen» en inglés | Botón «Elegir logo…» y línea con el nombre del archivo |
| C4 | En el teléfono, cada campo dejaba un hueco para un error vacío | El error sólo ocupa sitio cuando hay mensaje |

## 6. Coordinación con #65 y límites

**#65** (dos plantas en una presentación) sigue abierta y **no** se presupone fusionada. Este corte aplica la marca al recorrido y al lote de una planta, y a la lámina, mediante funciones aisladas (`FloorPlanBrandUI.decorate` y `stamp`). Al integrar #65, sus vistas por planta deben usar el mismo `stamp`; es una dependencia documentada y no se crea un segundo sistema de presentación.

**Pendiente de decisión de Juanma:**
- una portada y un cierre como vistas propias del lote (hoy son la tarjeta en pantalla y la franja de cada vista);
- incluir la lámina dentro del ZIP de la presentación, lo que exige una ruta nueva en la lista de rutas permitidas y por tanto un cambio de contrato.

**Fuera de alcance:** cuentas, nube y CRM (D-08 y D-09). Las entregas firmadas no se han validado con personas D-01.

## 7. Regresión

**Base de comparación:** #66 `5967fa2`. Mismo entorno: Chromium 141, SwiftShader, three.js local, ejecución secuencial. Cabeza final `4407af2`, que contiene el corte A completo (A12 y A13).

| Suite | C | Base | Lectura |
| --- | --- | --- | --- |
| Unitarias | 249/249 | — | PASS (incluye 3 de marca) |
| `brand` | 3/3 | — (no existe) | PASS tras corregir la espera de la prueba (abajo) |
| `premium-shell` | 4/4 | — | PASS, incluida 844×390 con ratón |
| `build-palette`, `guide`, `guide-navigation`, `welcome-generar`, `panel-pattern`, `stair-conflicts`, `stair-relocation`, `variants`, `variants-visual`, `sheet` | todas PASS | — | PASS |
| `presentation-framing` | 6/6 | — | PASS |
| `presentation-batch` | 7 pasan, 2 fallan | 7 pasan, 2 fallan (las mismas: ZIP del lote 1440×900 y ZIP portable; agotan la espera de la descarga) | Fallo previo, idéntico |
| `presentation-contact` | 4 pasan, 1 cancelada por tiempo | idéntico | Timeout previo, **no** es PASS |
| `presentation-route` | 7 pasan, 1 cancelada por tiempo | idéntico | Timeout previo, **no** es PASS |
| `browser.test.cjs` | 26 pasan, 10 fallan | los mismos 10 | Fallo previo (`page.goto` espera `load`) |

**Defecto de la prueba corregido:** a 844×390, `brand` abría el diálogo de marca justo cuando `FloorPlanPresentation.active` pasaba a `false`. Eso ocurre al **empezar** la salida de la presentación; la salida termina con `history.back()` a `#editor`, cuya ruta cierra los diálogos abiertos. Se reproducía siempre. La prueba ahora espera a que la salida termine. No se relaja ninguna comprobación. Una persona no puede provocarlo: durante la salida la cabecera no admite clics.

**No ejecutado completo en este entorno:** la suite `presentation` agota el límite de 1700 s, tanto en B como en la base, y queda **sin resultado**.
