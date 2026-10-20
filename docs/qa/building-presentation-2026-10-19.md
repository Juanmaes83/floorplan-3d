# QA — presentación de un edificio de dos plantas en una sola presentación y un solo lote (19-10-2026)

- **Diseño:** [`docs/product/building-presentation-2026-10-19.md`](../product/building-presentation-2026-10-19.md).
- **Base:** `master` `bd153c76e493eb5dea1b2908c768f66935f5a192`.
- **Código probado:** `d1bdf774ab86626977efb957c8ff0aa5e12b7117`. Los commits posteriores sólo añaden este informe y las capturas.

## 1. Entorno

| Elemento | Valor |
| --- | --- |
| Contenedor | Linux, sin GPU |
| Navegador | Chromium 141.0.7390.37 (`CHROME=/opt/pw-browsers/chromium`), Playwright 1.56.1 |
| WebGL | `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)))`: **render por software** |
| Node / Python | v22.22.0 / 3.13 |
| three@0.160.0 | Copia local del paquete npm oficial vía `THREE_LOCAL_DIR`, porque el proxy deniega `cdn.jsdelivr.net` |
| Base de comparación | Worktree con `master` `bd153c7`, pasado como `PRESENTATION_BASE` |

## 2. Pruebas nuevas

**`tests/presentation-building.test.cjs` (Node): 5 PASS.**

- **Plan de edificio:**
  - plantas de abajo arriba, con una vista general por planta;
  - se conserva el orden elegido;
  - las paradas se identifican por planta;
  - una planta sin estancias elegidas se omite;
  - no se crea plan sin selección ni con más de dos plantas;
  - estancias con el mismo ID en las dos plantas dan paradas distintas;
  - `currentBuilding` detecta un cambio en la otra planta.
- **Lector `readCaptures`:**
  - acepta un lote de edificio válido;
  - rechaza un par (planta, estancia) repetido, una planta desconocida, un archivo repetido, una ruta no permitida, un archivo ausente, archivos no declarados, un orden incorrecto, una vista sin estancia coherente, tres plantas, una planta repetida, la versión 3 y la falta del edificio editable;
  - lee el lote incluido en el repositorio `docs/qa/artifacts/casa-serra/r4-m09/1440x900-warm-views.zip` (versión 1, sin proyecto editable) y el formato 1.x actual.

**`tests/building-presentation.browser.test.cjs` (Chromium): 6 PASS.** Comando:

```text
THREE_LOCAL_DIR=… CHROME=/opt/pw-browsers/chromium PRESENTATION_BASE=<worktree en bd153c7> \
  node --test --test-concurrency=1 tests/building-presentation.browser.test.cjs
```

**Edificio de dos plantas, a 1440×900, 390×844 y 844×390** (casos 1–8 del encargo):

- **Configuración:** grupos «Planta baja» y «Planta primera», con su preselección.
- **Paradas:** las 5 en orden (vista general de la planta baja, Cocina, Estar, vista general de la primera, Dormitorio). En cada una se comprueba:
  - el título y «Vista i de 5»;
  - el rótulo de planta, con «Cambio de planta» en la 4.ª;
  - que la planta activa, en el editor y en el 3D, es la de la parada;
  - el botón actual, con su planta y su nombre accesible, y los encabezados de planta.
- **Disposición:**
  - «Volver a editar», el título y el rótulo de planta están dentro de la pantalla y **sin tapar** (`elementFromPoint`);
  - la tarjeta no se corta en horizontal y no hay desplazamiento horizontal;
  - la vista actual es visible en su fila.
- **Lote:** un solo `presentacion-edificio.zip` con exactamente 7 entradas.
  - El manifiesto se valida con `readCaptures`.
  - Las plantas (ID, nombre, orden, proyecto, elevación y revisión), las vistas (planta, tipo, estancia y rótulo) y los recursos de cada planta coinciden.
  - Cada PNG se comprueba por firma, IHDR y SHA-256; son 5 imágenes distintas.
- **Edificio editable:** `editable-building.zip` se comprueba por bytes y SHA-256 y se reabre con `B.readEntries`. `buildingSha256` coincide, y las estancias, muros, huecos y objetos de cada planta son los guardados.
- **Después del lote** vuelve la planta de la parada actual.
- **Al salir**, el edificio guardado, la entrada, la planta activa, el historial y la vista son idénticos a los de antes.
- **Reimportación:** el edificio editable se reimporta como entrada nueva con las mismas estancias.
- Sin `pageerror`, errores de consola, peticiones fallidas ni respuestas HTTP ≥ 400.

**Mismo ID y nombre de estancia en las dos plantas:**

- los dos «Cocina» aparecen en grupos distintos;
- sus nombres accesibles son distintos: «Cocina · Planta baja» y «Cocina · Planta primera»;
- `view-002` y `view-004` tienen cada una su planta, y las imágenes son distintas.

**Distribución pendiente** (edificio con conflicto BW5):

- La presentación no se abre: aparece el aviso «Presentar mi vivienda: la distribución está pendiente (…)» y se abre la lista de conflictos.
- Rutas internas: se abre la presentación de un edificio sin conflictos y después se simula que pasa a estado pendiente (sustituyendo `status`). «Vistas + proyecto ZIP» se niega y da el motivo, el PNG individual también, y **no se descarga nada**.

**Proyecto de una planta, comparado con `master`:** se ejecuta en la rama y en `bd153c7`. Ambas dan resultados **iguales**:

- ni aviso de edificio ni grupos;
- el mismo nombre de ZIP y las mismas 5 entradas;
- un plan de versión 1, sin plantas;
- las mismas claves del manifiesto y la misma estructura de las vistas y de `portableProject`.

**Prueba adaptada: `tests/building.browser.test.cjs`.**

- El paso 9 comprobaba el aviso «Presentación de una planta… Las demás plantas y la escalera no se incluyen», que esta entrega sustituye por diseño. Ahora comprueba el aviso del edificio y los dos grupos de planta.
- La lámina sigue comprobándose como de la planta activa.
- **3 PASS** en los tres tamaños.

## 3. Regresión en `d1bdf77`

| Suite | Resultado |
| --- | --- |
| Unitarias Node (`ls tests/*.test.cjs \| grep -v browser \| xargs node --test`) | 252 tests: **250 PASS**, 0 FAIL, 2 SKIP (preexistentes). En `master` `bd153c7`: 247 tests, 245 PASS, 2 SKIP. La diferencia son las 5 nuevas. |
| Python (`tests/*.py`, 5) | PASS |
| `building`, `building-presentation` | 3 PASS, 6 PASS |
| `stair-conflicts`, `stair-overlap`, `stair-relocation`, `sheet`, `variants` | 4, 3, 4, 7 y 4 PASS; 0 FAIL, 0 SKIP |
| `panel-pattern`, `ui-language`, `guide`, `guide-navigation` | 5, 3, 5 y 4 PASS; 0 FAIL, 0 SKIP |
| Suites de presentación 3D | Tabla siguiente, comparadas prueba a prueba con `master` `bd153c7` |

**Suites de presentación 3D.** Se ejecutaron en la rama y después en `master`, una a una, con un corte de 850 s por suite (`timeout 850`).

| Suite | Rama `d1bdf77` | `master` `bd153c7` | Clasificación |
| --- | --- | --- | --- |
| `presentation-framing` | 6 PASS | 6 PASS | Sin cambios |
| `presentation-batch` | 7 PASS, 2 FAIL | 7 PASS, 2 FAIL (los mismos) | Preexistente: los casos de 1440×900 pulsan `#guidePresent`, que tras #62 no es visible |
| `presentation-minimap` | 4 PASS, 1 FAIL | 4 PASS, 1 FAIL (el mismo) | Preexistente |
| `presentation-reveal` | 1 PASS, 7 FAIL | 1 PASS, 7 FAIL (los mismos) | Preexistente |
| `presentation-light` | 0 PASS, 5 FAIL; corte a 850 s | 0 PASS, 5 FAIL; corte | Preexistente |
| `presentation-contact` | 3 PASS, 2 FAIL | 3 PASS, 2 FAIL (los mismos) | Preexistente |
| `presentation` | 9 PASS, 5 FAIL, 14 con resultado; corte | 8 PASS, 5 FAIL, 13 con resultado; corte | Mismos fallos; el corte deja casos sin resultado. **No concluyente**, no aprobado |
| `presentation-route` | 5 PASS, 2 FAIL; corte | 6 PASS, 1 FAIL; corte | El fallo extra («M18 reduced motion, missing entrance and context loss stay recoverable») tarda 115–121 s con un límite de 120 s. Repetido aislado dos veces en cada lado: en la rama pasa a 120,8 s y falla a 120,8 s; en `master`, pasa a 119,3 s y falla a 120,8 s. **No concluyente** por tiempo, igual en los dos lados |

Ningún fallo aparece sólo en la rama de forma reproducible. Los fallos y cortes de estas suites **no cuentan como aprobados**.

Comando de cada suite: `node --test --test-concurrency=1 tests/<suite>.browser.test.cjs`, con las mismas variables de entorno.

**Carga del hilo principal.** Con una sonda propia (el ejemplo de una planta, a 1440×900), un `evaluate` trivial tarda 2,3–2,6 s en `master` y 2,4 s en la rama, y el lote de 3 vistas tarda unos 42 s en ambos. Con esa carga, un clic de Playwright puede superar los 30 s. Por eso la prueba de una planta espera el clic hasta 120 s, sin rebajar ninguna aserción. La sonda fue un script de trabajo y no está en el repositorio.

## 4. Rendimiento medido (render por software, sin GPU)

Tiempo desde la acción del usuario hasta que la vista queda quieta, medido en `tests/building-presentation.browser.test.cjs` (`*-metrics.json`):

| Tamaño | Iniciar | Paradas 2, 3 y 5 (misma planta) | Parada 4 (cambio de planta) | Lote de 5 vistas | Tamaño del ZIP |
| --- | --- | --- | --- | --- | --- |
| 1440×900 | 9,0 s | 12,9 / 12,5 / 20,4 s | 17,4 s | 52,2 s | 1,40 MB |
| 390×844 | 7,4 s | 5,0 / 9,4 / 7,7 s | 10,9 s | 24,6 s | 0,82 MB |
| 844×390 | 7,5 s | 6,3 / 8,9 / 8,5 s | 11,3 s | 23,2 s | 0,70 MB |

El cambio de planta cuesta del mismo orden que una parada normal, porque reconstruye el 3D de la planta. Son cifras de SwiftShader en este contenedor: **no** valen para una GPU real ni para teléfonos.

## 5. Capturas

En `docs/qa/artifacts/building-presentation/`, para cada tamaño:

- `01-config`;
- una captura por parada (`02`–`06`);
- `07-after-batch`;
- dos vistas del lote: `batch-view-3`, la primera de la planta alta, y `batch-view-4`;
- `metrics.json`.

Además, `single-level-branch.png` y `single-level-base.png`.

Las capturas `docs/qa/artifacts/multilevel/*-08-presentation-note.png` se regeneran porque cambia el aviso. Las demás capturas de `multilevel` no se tocan.

**Revisión visual de Claude:**

- La configuración se lee bien en los tres tamaños.
- En 844×390 el rótulo «Cambio de planta» queda en la cabecera fija. En una primera versión quedaba tapado; se corrigió y la prueba lo exige.
- En las vistas de la planta alta se ve la planta baja debajo y la escalera llegando al hueco.
- **Falta** la revisión humana de Juanma.

## 6. Pendiente y no ejecutado

- GPU real y teléfonos físicos.
- **CI no ejecutada:** los jobs de Actions terminan sin runner.
- La medición con personas del público D-01. El beneficio sigue siendo una hipótesis.
- Las suites de presentación 3D que fallan o se cortan también lo hacen en `master` (§3). `presentation-batch`, a 1440×900, pulsa `#guidePresent`, que tras #62 no es visible en la guía compacta. No se corrige aquí porque queda fuera del alcance.
