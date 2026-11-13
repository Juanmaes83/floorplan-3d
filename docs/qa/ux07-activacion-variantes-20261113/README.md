# UX-07 / ENT-04 · Activación PROPUESTA en «Variantes»: «Comparar con el original» (13/11/2026)

**Rama:** `feat/ux07-variants-activation-20261113`, desde `master@f5c08c7`, que ya contiene #218 (núcleos y laboratorio UX-07/ENT-04, inactivos), #213 GOV-07 y #214 R03 preintegrado.

**Estado:** PROPUESTA para revisión humana.
- **No autoriza** merge, Production, publicación a clientes ni activación comercial.
- #215 (R03) sigue abierta, sin fusionar y sin activar: esta rama no carga nada de R03.
- Datos de prueba **sintéticos** (proyecto de ejemplo de RUBIK; presupuestos de prueba con precios ficticios).

## 1. Decisión de arquitectura: una ruta publicada en el mismo origen (`comparar/`)

| Opción | Ventajas | Inconvenientes | Decisión |
|---|---|---|---|
| **A · `comparar/`, página del producto en el mismo origen** | Lee la **misma** biblioteca (`localStorage`) que el editor, sin copiarla ni moverla. Carga los núcleos **solo** cuando se compara. El editor apenas cambia (un botón y dos scripts). Es una página de solo lectura, con su propio ciclo de vida, que no se mezcla con el deshacer del editor. Se puede revisar abriendo una URL. | Abre una pestaña nueva. Compara lo **guardado**, no un cambio que aún no se haya escrito (el editor guarda en cada cambio, ver §2). | **Elegida** |
| B · Diálogo dentro del editor | Sin pestaña nueva. | Mete el comparador, el presupuesto y el dossier en `index.html` y en su memoria. Mezcla su estado con el del editor (deshacer, selección, guardado). Es un segundo punto de entrada a la misma lógica: lo más parecido a un «segundo motor». | Descartada |
| C · Otro almacenamiento o servicio | — | Duplicaría la persistencia y obligaría a enviar proyectos privados por red. | Descartada (reglas 1 y 10) |

**Mismo origen:** `comparar/` se despliega con el editor, en el mismo *hostname*. `.vercelignore` solo excluye `labs/`. Por eso ve la biblioteca y los presupuestos guardados **en ese navegador** y nada más: no hay red.

## 2. Reglas obligatorias y cómo se cumplen

| # | Regla | Cumplimiento | Prueba |
|---|---|---|---|
| 1 | Solo lectura | La biblioteca y los presupuestos se leen con un almacenamiento cuyo `setItem`/`removeItem` **lanza un error**. `FloorPlanLibrary.load` no escribe al cargar. | Todo el `localStorage` queda **idéntico byte a byte** en cada prueba (flujo real ×3, presupuestos ×5, negativos, edificio). |
| 2 | «Comparar» nunca llama a `library.save()` | El botón solo hace `window.open('comparar/?…','_blank','noopener')`. Aviso visible: «**Se compara lo guardado en este navegador.**» El editor ya guarda cada cambio (`mutate → commit → save()` = `library.save`), así que lo guardado es lo que se ve. | Ídem; el aviso se comprueba en la prueba. |
| 3 | Mismo origen | La pestaña nueva se abre en `/comparar/` del mismo servidor. | Se comprueba `new URL(cmp.url()).origin === origen del editor` en el flujo real. |
| 4 | Dirección sin proyectos, presupuestos ni secretos | Solo `src`, `before`, `after` y `anchor`, que son identificadores de la biblioteca validados con `^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$`. Nada de la dirección se inserta como HTML. | Claves exactas, formato y longitud de la URL. Una dirección con `<img onerror>` se rechaza y no inserta nada. |
| 5 | Alcance claro | «Dos distribuciones del mismo grupo de Variantes: el original y una variante». En edificios: «planta X frente a planta Y. **No es una comparación del edificio completo.**» | Prueba con un edificio de dos plantas. |
| 6 | Presupuestos ausentes o parciales | **Ausentes:** «Sin presupuestos guardados: no se muestran importes». **Parciales:** importes conocidos y diferencia **solo** de las partidas comparables, con «**No es la diferencia de coste total.**» | Casos `absent` y `partial`. |
| 7 | **Incoherente** | En pantalla, ningún importe ni total: solo el motivo y «Importes no mostrados». **Contrato interno auditado y corregido:** `compareBudgets` devolvía en `before`/`after` los totales de cada presupuesto (`net`, `tax`, `gross`…) aunque el estado fuera incoherente. Ahora **no viajan** (`amountsWithheld: true`) y tampoco las notas de precios. | Caso `incoherent`: ningún `€` en pantalla, sin tabla de partidas y contrato interno sin `net`, `tax`, `gross`, `complete`, `unpriced` ni `unreviewed`. |
| 8 | Borrador interno | «BORRADOR INTERNO · no se envía al cliente». Solo se descarga en el equipo, con manifiesto SHA-256. Sin envío, Blob ni enlaces. | El borrador contiene «Borrador interno · no enviado al cliente», sin scripts ni recursos externos, y se verifica con su manifiesto. |
| 9 | HTML/SVG y escape | Los núcleos existentes no cambian salvo la regla 7. Todo lo que viene de datos se escapa. Los colores de material los valida el esquema (`Core.validate`). | Todas las suites UX-07. |
| 10 | Sin red nueva | Ni el comparador ni los núcleos hacen peticiones. | `watch.external = []` en todas las pruebas del comparador. |

**Presupuesto de otro proyecto** (por ejemplo, el del original guardado con la clave de la variante): se dice «no corresponde a su distribución», la comparación de planos sigue y no se muestra ningún importe.

## 3. Archivos

| Archivo | Cambio |
|---|---|
| `index.html` | +8 líneas: dos scripts (`revision-compare-core.js` y `variants-compare-adapter.js`, que el adaptador necesita) y el botón «Comparar con el original» en cada tarjeta de **variante** de «Variantes». **No** llama a `library.save`. |
| `comparar/index.html`, `comparar/comparar.js` | **Nuevos:** la página del comparador del producto. Reutiliza `FloorPlanLibrary`, `FloorPlanVariantsCompare.prepare`, `FloorPlanRevisionCompare`, `FloorPlanRevisionBudget` y `FloorPlanBeforeAfterDossier`; no hay motor nuevo. |
| `css/comparar.css` | **Nuevo:** el sistema visual del laboratorio y los avisos del comparador. |
| `js/revision-budget-core.js` | Regla 7: en estado incoherente, `before`/`after` sin importes y sin notas de precios. |
| `js/app-shell.js`, `css/design-system.css` | Corrección del fallo preexistente de §5. |
| `tests/ux07-activation.browser.test.cjs` | **Nueva:** 6 pruebas. |

## 4. Pruebas

Ver §7 para los resultados.

## 5. El fallo preexistente `variants-visual.browser` a 844×390 (`#tgPanel`): causa y corrección

**Medido, no supuesto.**
- En una ventana de **844×390 con ratón**, la cabecera ocupa tres filas y la barra de áreas de trabajo baja un poco más.
- La columna de accesos de la derecha empieza debajo (y termina a 30 px del borde inferior). Le quedaban unos 130 px para **cuatro** botones de al menos 40 px.
- Con `grid-auto-rows:1fr`, «**Propiedades**» (`#tgPanel`, y 738–834, 316–356) quedaba dibujado **debajo de «Escena 3D»** (y 319–359). Playwright no podía pulsarlo y una persona tampoco.

**Corrección**, en `css/design-system.css` y `js/app-shell.js`:
1. Las filas nunca bajan de 40 px y, si no caben, la columna se desplaza en lugar de solaparse.
2. Si la columna no tiene sitio para sus cuatro botones (medido desde su `top` real, que puede estar bajo la barra de áreas de trabajo), pasa a un **bloque 2×2** (`body.dock-2col`): los cuatro visibles, de 40 px.
3. El plano y los paneles dejan sitio a ese bloque.

**Resultado:**
- `variants-visual.browser`: **4/4**; en `master@f5c08c7`, 3/4.
- En `premium-shell.browser`, la variante «844×390 mouse» falla en `master` precisamente al pulsar ese botón (*timeout*). Con la corrección pasa las comprobaciones de la columna: los cuatro accesos visibles sin desplazar, de 40 px o más.

**Fallo preexistente distinto, NO tocado:** `premium-shell.browser` falla **4/4 también en `master`** en «one dominant action in the editor with rooms». Espera que «Presentar mi vivienda» (`presentationBtn`) tenga el color de acción dominante, pero en `master` ningún botón lo tiene: es un cambio de diseño posterior que esa suite no recogió. **Ningún workflow de CI la ejecuta.** No se toca en esta PR.

## 6. Protocolo de revisión humana (Preview de esta rama; datos sintéticos)

| # | Clic | Debe verse |
|---|---|---|
| 1 | Abrir la Preview. Si sale la bienvenida, cerrarla. | El editor con el piso de ejemplo. |
| 2 | **«Proyectos»** → **«Crear variante del proyecto abierto»** → **«Cerrar»** | Aviso «Variante creada y abierta». |
| 3 | Seleccionar un mueble del plano y pulsar **«Eliminar»** (o cambiar el suelo de una estancia en su panel) | El cambio en la variante. |
| 4 | **«Proyectos»** → **«Comparar variantes»** | Dos tarjetas: «Original» y «Variante». **Solo** la variante tiene **«Comparar con el original»**. |
| 5 | Pulsar **«Comparar con el original»** | Se abre una **pestaña nueva** en `/comparar/` del mismo sitio, con el aviso «Se compara lo guardado en este navegador» y el alcance «el original y una variante». |
| 6 | Mirar la cortina, pulsar **«Lado a lado»** y leer «Cambios reales» | El mueble quitado (y el suelo, si se cambió), con la misma escala y encuadre. Con el proyecto de ejemplo, los nombres salen como están guardados, en chino (§7 bis). |
| 7 | Bloque «Presupuestos guardados» | Sin presupuestos: «Sin presupuestos guardados… no se muestran importes». Si se han hecho en «Presupuestar», aparece su estado: completa, parcial (con «No es la diferencia de coste total») o no válida, sin importes. |
| 8 | **«Preparar borrador interno»** → **«Verificar ahora»** | «BORRADOR INTERNO · no se envía al cliente», vista previa y «Borrador verificado». Solo se puede descargar; no hay enviar ni compartir. |
| 9 | Volver a la pestaña del editor | Nada ha cambiado: la variante y el original siguen igual. |
| 10 | Repetir 4–8 en el móvil (vertical y horizontal) | Mismo resultado, sin desplazamiento horizontal. |

## 7. Resultados (local, Chromium de Playwright, cada suite por separado)

**Nuevas y UX-07:**

| Suite | Resultado |
|---|---|
| `ux07-activation.browser` | **6/6**: flujo real ×3, presupuestos, negativos y edificio |
| `ux07-ent04-lab` · `budget` · `origin` · `variants-handoff` (navegador) | 7/7 · 3/3 · 4/4 · 3/3 |
| UX-07 puras: `core`, `budget-coherence`, `variants-adapter` | 34/34 |

**Variantes:**

| Suite | Resultado |
|---|---|
| `variants.browser` | 4/4 |
| `variants-visual.browser` | **4/4** (era 3/4 en `master`; ver §5) |

**Regresiones del editor, la importación y Project-First:**

| Suite | Resultado |
|---|---|
| `browser` | 39/39 |
| `guide.browser` | 5/5 |
| `upload.browser` | 8/8 |
| `multiformat-guide.browser` | 9/9 |
| `project-first.browser` | 5/5 |
| `professional-workspace.browser` | 17/17 |

**GOV-07 y R03:**

| Suite | Resultado |
|---|---|
| `gov07-early-loss` | 7/7 |
| `r03-editor.browser` | 16/16 |

**Unitaria completa del repositorio:** 1105 pruebas; 1103 pasan, **0 fallan**, 2 omitidas.

**Fallo y omisión declarados:** `premium-shell.browser` da 0/4 **igual que en `master`**, en «one dominant action» (§5), y no la ejecuta ningún workflow. **No se cuenta como PASS.**

**Capturas** en `capturas/`, en 1440×900, 390×844 y 844×390:
- `*-0-variantes.png`: el botón en la tarjeta de la variante;
- `*-1-comparador.png`;
- `*-2-borrador.png`.

## 7 bis. Limitación conocida: nombres del proyecto de ejemplo

El proyecto de ejemplo de RUBIK guarda los nombres de estancias, muebles y materiales en chino. El editor los **traduce solo al mostrarlos** (`nm()`, con el diccionario `NAMES_ES` **dentro de `index.html`**).
- El comparador muestra los nombres **tal como están guardados**, por ejemplo «主卧室». En un proyecto real son los que escribió el profesional.
- Traducirlos antes de comparar cambiaría los datos que el borrador firma con SHA-256: su verificación contra lo guardado fallaría.
- **Propuesta** (corte aparte): sacar el diccionario a un módulo compartido y dar a `FloorPlanRevisionCompare` un `labelOf` **solo de presentación**, que no toque los datos ni las huellas.

## 8. Riesgos y efecto exacto de fusionar esta PR

**Efecto de fusionar** (solo con GO específico; no autorizado aquí):
1. Aparece **«Comparar con el original»** en las tarjetas de variante de «Variantes».
2. Se publica la ruta **`/comparar/`** en Production. Sin parámetros válidos no muestra nada; con ellos, solo lee la biblioteca de ese navegador.
3. El editor carga dos scripts más, unos 19 KB sin comprimir.
4. `compareBudgets` deja de devolver importes en estado incoherente: contrato interno más estricto, y ningún consumidor en `master` los usa.
5. La columna de accesos en ventanas cortas con ratón pasa a 2×2 cuando no cabe.

**Riesgos pendientes:**
- Edificio completo no cubierto: se compara la planta del mismo orden.
- La comparación es de lo **guardado**. Si un guardado falla (el editor ya muestra un aviso de error al guardar), el comparador muestra la última versión guardada.
- La pestaña nueva depende de que el navegador no la bloquee: `window.open` se llama desde el clic, así que normalmente no se bloquea.
- Sin dispositivos físicos: solo Chromium de Playwright.
- `css/comparar.css` repite el estilo del laboratorio. Una consolidación posterior podría compartirlo.
- El dossier sigue siendo **interno**. Enviarlo al cliente depende de ENT-01/GOV-08 y de una autorización aparte.
