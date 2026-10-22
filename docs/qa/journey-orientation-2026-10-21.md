# QA — Orientación del recorrido, corte A (21-10-2026)

| | |
| --- | --- |
| Rama | `feat/journey-orientation` sobre `master` `e796e3d` (#65–#69 ya integradas) |
| Diseño | [`docs/product/journey-orientation-2026-10-21.md`](../product/journey-orientation-2026-10-21.md) |
| Entorno | Chromium 141.0.7390.37 con Playwright 1.56.1 y Node 22. Renderer SwiftShader, **sin GPU**. Teléfono **emulado** en Chromium (390×844 y 844×390); **no hay teléfono físico** |
| CI | **No ejecutada** |
| Prueba con público D-01 | **Pendiente**: protocolo en el diseño, §8 |

## 1. Método

- **Arnés:** `scripts/qa/journey/audit.cjs` recorre 16 caminos (A–P), de la entrada al resultado, solo con gestos visibles:
  - clic, o toque en el teléfono;
  - archivos elegidos en el selector que abre el botón visible;
  - cajones cerrados con sus propios botones.
- **Bloqueos:** un gesto que no se puede hacer se registra como bloqueo, y los pasos siguientes como «no ejecutado».
- **Sonda:** cada paso guarda una captura y lo que ofrece la pantalla. Además señala:
  - las ofertas de la guía que contradicen el estado;
  - nombres con forma de archivo;
  - solapes en el teléfono.
- **Antes:** auditoría sobre una copia limpia de `master` `e796e3d`. Los 16 recorridos se completaron en los tres tamaños sin bloqueos, y por eso son comparables.
- **Matriz por recorrido y tamaño:**
  - [antes](artifacts/journey/before/matrix.md), con hojas de contactos por recorrido y tamaño en [`before/`](artifacts/journey/before/);
  - [después](artifacts/journey/after/matrix.md).
- **75 % + «Empezar»:** `scripts/qa/journey/progress-75.cjs` (§2, O4).

## 2. Hallazgos reproducidos en `master` (antes)

| # | Hallazgo | Recorridos y tamaños |
| --- | --- | --- |
| O1 | «✓ Objetivo completado / Ver resultado y exportar» tras una estancia, o tras abrir el 3D del ejemplo | B, E, F, G, H, N y O en «Crear desde cero»; C y K en el ejemplo. Los tres tamaños |
| O2 | La guía ofrece «Abrir 3D» con 2 conflictos que bloquean la presentación, y también tras presentar y descargar el lote | G, I, P (conflictos); L, P (tras presentar). Los tres tamaños |
| O3 | Tras subir una imagen, «Resolver requisito» abre «Tu recorrido» en vez de calibrar | D, en los tres tamaños |
| O4 | El 75 % es legítimo (3 de 4 tareas). Tras «← Paso anterior», la guía muestra «Prepara tu proyecto» con «Volver al inicio», y así sigue tras F5, una nueva visita y «Continuar» | N; `progress-75.json` |
| O5 | «← Paso anterior» desde la primera tarea abre la bienvenida | N |
| O6 | El ejemplo abre la paleta en «Amueblar» | C |
| O7 | En modo guiado faltan «Rehacer», el cambio de planta, «Recorrer» y la entrada «Presentar» de la cabecera | E, I, K, L/P |
| M1 | A 390×844 la barra de selección deja «Eliminar» fuera de la pantalla | G, K, C |
| M2 | El aviso «Añadido…» tapa la barra de selección | G, C a 390×844 |
| M3 | Con un hueco a medio colocar, abrir la paleta deja el aviso del modo encima y el modo activo detrás | O en 390×844 y 844×390 |
| M4 | La guía ocupa unos 220 px de los 844 de alto | Capturas a 390×844 |
| — | Tras importar un dúplex, la tarea guardada de la guía es una ya completada | Comprobado en el navegador |

**Observaciones de captura, no tratadas como defecto:**

- «manual-plan» en la cabecera: es el nombre del archivo subido, no un identificador interno.
- Restos crema en el cromo: corte B, no ejecutado en esta entrega.

## 3. Pruebas nuevas, que fallan en la base

`tests/journey-orientation.browser.test.cjs` tiene 14 casos en los tamaños indicados. **En `master` fallan los 14**, cada uno por el defecto que nombra:

| Caso | En `master` | En la rama |
| --- | --- | --- |
| T1/T9/T10 (×3 tamaños): tras la primera estancia, «Añadir puertas y ventanas» abre «Construir» con el foco en los huecos; la sugerencia no cambia datos; «Ahora no» y su recuperación | «Objetivo completado» | PASS |
| T3 (×3): «Empezar a ajustar» inicia la calibración | «Crea o revisa las estancias» / «Resolver requisito» | PASS |
| T4: una tarea ya hecha lo dice tras F5; el 75 % se conserva; la primera tarea no sale del editor | «Prepara tu proyecto» | PASS |
| T5/T8 (×2): con conflictos, «Ver conflictos» abre la lista; selector de planta en la cabecera guiada | «Revisa la distribución en 3D» | PASS |
| T7 (×2): el aviso queda por encima de la barra de selección; abrir la paleta cancela el hueco a medio colocar y lo dice | El aviso tapa la barra (734 > 690 px); el modo sigue activo | Ver §4 |
| T8: «Rehacer» visible; «Presentar» presente pero secundaria; una sola acción dominante | «Rehacer» oculto | PASS |
| T2/T6 (×2, con 3D): el ejemplo en «Construir»; en 3D, ni «Ver en 3D» ni «Objetivo completado»; presentar cuenta como revisión | La paleta en «Amueblar» | PASS |

Además, `tests/journey-core.test.cjs` tiene 8 pruebas unitarias del motor, incluida la que comprueba que la entrada no cambia.

## 4. Regresión

Base: `master` `e796e3d` en una copia limpia, en el mismo entorno y con ejecución secuencial.

| Ronda | SHA | Fallos que no aparecían en la base | Corrección |
| --- | --- | --- | --- |
| 1 | `4e2c0fd` | `build-palette`: su aserción fijaba «Amueblar» en el ejemplo, que es el defecto O6 | Aserción actualizada a la nueva especificación (`7952a13`) |
| 1 | `4e2c0fd` | `opening-contextual` y `stair-conflicts` a 390×844: la barra de selección en dos filas empujaba el aviso de conflictos | Dos intentos (`27613a5`, `0faf47b`). El cambio M1 se retira (`75ac08c`): la barra queda como en `master` |
| 2 | `27613a5` | `presentation-batch` y `presentation-contact`: presentar escribía en la guía, y la presentación debe restaurarla exactamente | La constancia se guarda aparte, en `rubik-sota-journey-v1` (`23b522f`) |

**Resultado final:** ver §6. Las suites que también fallan o se cortan por tiempo en la base no se cuentan como PASS.

## 5. Límites

- **Sin GPU real ni teléfono físico.** En 3D, con SwiftShader, cada clic tarda unos 14 s en resolverse; no se mide como defecto.
- **M1 y M4 siguen pendientes** (diseño, §4.4).
- **Corte B y prototipos sin ejecutar:** el corte B (restos cromáticos) y los prototipos visuales de las alternativas tienen sus scripts (`colours.cjs`, `prototypes.cjs`), pero no se han ejecutado en esta entrega.
- **Sin validación humana:** la prueba con el público D-01 está preparada y pendiente. Las pruebas automáticas no acreditan que la experiencia sea intuitiva.

## 6. Resultado final

**Suites del navegador sobre la cabeza final:**

| Suite | Rama | Base `e796e3d` | Lectura |
| --- | --- | --- | --- |
| Unitarias | 262/262 | — | PASS (incluye las 8 de `journey-core`) |
| `journey-orientation` | 14/14 (`d1bb57b`) | 0/14 | PASS; los 14 casos fallan en la base |
| `guide`, `guide-navigation`, `welcome-generar`, `panel-pattern`, `ui-language`, `room-layout`, `upload`, `multiformat-guide`, `layout-review`, `surfaces`, `building`, `variants`, `stair-overlap`, `stair-relocation`, `sheet`, `brand` | todas PASS (`4e2c0fd`; los cambios posteriores no tocan esas áreas) | — | PASS |
| `build-palette` | 3/3 (`27613a5`) | 3/3 con la aserción antigua | PASS con la nueva especificación (O6) |
| `opening-contextual`, `stair-conflicts`, `premium-shell` | 9/9, 4/4 y 4/4 (`5f86c43`) | 9/9, 4/4 y 4/4 | PASS |
| `presentation-framing`, `environment-3d`, `variants-visual` | 6/6, 3/3 y 4/4 (`27613a5`) | — | PASS |
| `presentation-batch` | 7 pasan, 2 fallan (`23b522f`) | Los mismos 7 y 2 | Fallo previo, idéntico (descarga del lote en este entorno) |
| `presentation-contact` | 2 pasan, 3 cortadas por tiempo (`23b522f`) | 3 pasan, cortes por tiempo | **SIN RESULTADO**: los cortes de tiempo sin GPU no permiten comparar; no se cuenta como PASS |

**CI:** no ejecutada.

**Auditoría «después»** de los recorridos afectados: [matriz](artifacts/journey/after/matrix.md) y [hojas de contactos](artifacts/journey/after/). Primer estado relevante en 1440×900; el mismo resultado en los tres tamaños:

| Recorrido | Momento | Antes (`e796e3d`) | Después | Completo en los 3 tamaños |
| --- | --- | --- | --- | --- |
| B | Tras la primera estancia | «✓ Objetivo completado» → «Ver resultado y exportar» | «Añade puertas y ventanas» → «Añadir puertas y ventanas» | sí |
| C | Ejemplo en 3D | «✓ Objetivo completado» → «Ver resultado y exportar» | «Estás viendo un ejemplo» → «Crear mi vivienda desde el ejemplo» | sí |
| D | Tras subir la imagen | «Crea o revisa las estancias» → «Resolver requisito» | «Ajusta y comprueba la escala» → «Empezar a ajustar» | sí |
| I | Dúplex con conflictos | «Revisa la distribución en 3D» → «Abrir 3D» | «Resuelve los conflictos del edificio» → «Ver conflictos» | sí |
| L | Al volver de presentar el ejemplo | «Revisa la distribución en 3D» → «Abrir 3D» | «Estás viendo un ejemplo» → «Crear mi vivienda desde el ejemplo» | sí |
| N | «← Paso anterior» hasta la primera tarea | «Prepara tu proyecto» → «Volver al inicio» (y la bienvenida al pulsar otra vez) | «Ya hecho: Prepara tu proyecto» → «Seguir con: Añade puertas y ventanas»; el botón queda desactivado en la primera tarea | El arnés registra como bloqueo el botón desactivado, que es el comportamiento nuevo (O5) |
| P | Tras entregar el dúplex (lote ZIP con las 4 vistas, `editable-building.zip` y `presentation.json`) | «Revisa la distribución en 3D» → «Abrir 3D» | «Guarda tu proyecto» → «Confirmar guardado» | sí |

**Pendiente:** M1 (barra de selección más ancha que 390 px), M4 (altura de la guía en el teléfono), el corte B (cromático), las capturas de los prototipos, la GPU real, el teléfono físico y la prueba D-01.

## 7. Cierre del 22-10-2026: M1, M4, cabecera guiada y colores

**SHA probado:** `1830830`. La cabeza publicada es `c475cba`. Entre ambos **no cambia código de la aplicación** (`git diff 1830830 c475cba -- js css index.html` vacío); solo pruebas y documentación. La suite `build-palette`, cuyo archivo cambió, se repitió sobre `c475cba`.

Base: `master` `e796e3d`, mismo entorno: Chromium 141 con SwiftShader, sin GPU, teléfono emulado. CI: **no ejecutada**.

| Suite | Rama | `master` | Resultado |
| --- | --- | --- | --- |
| Unitarias | 262/262 | — | PASS |
| `journey-orientation` | 15/15 (incluye T11 nuevo y T7 con la barra completa) | 0/14 de los casos previos | PASS |
| `opening-contextual` | 9/9 | — | PASS |
| `panel-pattern` | 5/5 | — | PASS |
| `premium-shell` | 4/4 | — | PASS |
| `stair-conflicts` | 4/4 | — | PASS |
| `guide` | 5/5 | — | PASS |
| `guide-navigation` | 4/4 | — | PASS |
| `welcome-generar` | 3/3 | — | PASS |
| `ui-language` | 3/3 | — | PASS |
| `room-layout` | 5/5 | — | PASS |
| `surfaces` | 7/7 | — | PASS |
| `building` | 3/3 | — | PASS |
| `brand` | 3/3 | — | PASS |
| `sheet` | 7/7 | — | PASS |
| `upload` | 8/8 | — | PASS |
| `multiformat-guide` | 9/9 | — | PASS |
| `layout-review` | 2/2 | — | PASS |
| `variants` | 4/4 | — | PASS |
| `stair-overlap` | 3/3 | — | PASS |
| `stair-relocation` | 4/4 | — | PASS |
| `build-palette` | 0/3 en `1830830` → **3/3 en `c475cba`** | 3/3 | PASS tras corregir la preparación (ver abajo) |
| `browser` (suite antigua del editor) | 26 pasan, 10 fallan | 26 pasan y **los mismos 10** fallan | Fallo previo idéntico; no es regresión |
| `presentation` | Corte por tiempo a 1700 s | Corte por tiempo a 1700 s | **SIN RESULTADO** en ambas; no se cuenta como PASS |

**Defectos encontrados y corregidos en este cierre:**

- **Regresión de este corte en `browser` (14 fallos en `4dd4e5d`).** La suite antigua pulsaba muebles dando por hecho que la paleta abría en «Amueblar», pero desde O6 abre en «Construir».
  - La preparación `editor-fixture` arranca ahora como una persona cuya última elección fue «Amueblar», el mismo estado que en `master` (`1830830`).
  - `build-palette`, que comprueba justamente la pestaña inicial, prescinde de esa preparación (`keepPalette`, `c475cba`).
  - No se ha relajado ninguna aserción.
- **Cabecera guiada de escritorio a 116 px y dos «Presentar mi vivienda» visibles.** Las introdujo este corte; se corrigieron en `4dd4e5d` (ver diseño, §4.4).

**Sigue pendiente:**

- A 360 px la barra de selección necesita 18 px más; conserva el desplazamiento horizontal. Aceptable.
- Prueba D-01 con personas.
- Validación con GPU real y en un teléfono físico.
