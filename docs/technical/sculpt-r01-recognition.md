# SCULPT-R01 — Reconocimiento raster + OCR como evidencia (laboratorio)

**Fecha:** 10/11/2026 · **Rama:** `lab/sculpt-r01-recognition` (desde `master@75615fd`) · **Estado:** prototipo funcional **NO VALIDADO sobre planos reales**. Laboratorio fuera de Vercel; nada se integra en el producto.

Metodología: SCULPT (`SOURCE → ISOLATE → CLASSIFY → SCULPT → NORMALIZE → TEST → PREVIEW → HUMAN REVIEW → MERGE`), según `SUBVENCIONES-PYMES/docs/20-SCULPT-METHODOLOGY.md`, `VECINIA-WORLDS/docs/28-CROSS-REPO-CLONING…` y `…/ROADMAP_SCULPTURE_TO_SURGERY…`, y la metodología FT3D de escultura (rama `docs/ft3d-reference-sculpture-rea-methodology`). Esta misión cubre los gates 0–3; el 4 (revisión humana) corresponde a Juanma.

## A. Arqueología y procedencia
Detalle completo en `labs/sculpt/r01-recognition/PROVENANCE.md`. En resumen:

- **Fuente:** `zhuzhuyumeng/floorplan-3d`, commit `1d235fc0a3c45783e1e1fa129944f8f34d97d297` (PR #18, autor olifod).
  - Es una bifurcación de `wy51ai/floorplan-3d`, el mismo origen MIT del que deriva RUBIK.
  - Los dos módulos que usamos son idénticos byte a byte en el `master` del donante (`88323f3`).
- **Licencia:** MIT, © 2026 wuyi (`LICENSE` en el mismo árbol). El aviso se conserva en `workshop/LICENSE-donor-MIT.txt`.
- **Riesgo residual:** el autor no añadió un aviso propio (ver PROVENANCE §3).
- **Huellas:**
  - `git archive` = `86135d18…`;
  - 23 archivos en `SOURCE-EXACT.sha256`.
- **Dependencias declaradas, no instaladas:**
  - `tesseract.js@6.0.1`, Apache-2.0, con script de instalación no examinado;
  - `@tesseract.js-data/chi_sim`.

## B. Snapshot fiel
- **SOURCE EXACT solo en local.** `tests/fixtures/user-floorplan.png` es una captura de una vivienda real hecha en una app comercial: sin derechos acreditados y en un repositorio público, no se sube.
- `fetch-source-exact.sh` reconstruye el snapshot **fuera del repositorio** y comprueba los 23 hashes. Verificado: `SOURCE EXACT verified … (1d235fc…)`.
- **Taller:**
  - `workshop/recognition-core.js` y `workshop/ocr-postprocess-rules.js`, importados idénticos (commit `e4cc69a`);
  - cada cambio posterior va en su propio commit (ciclos C1–C3);
  - `workshop/donor-recognition.test.cjs` es la prueba original; solo cambian las rutas de `require`.

## C. Baseline original ejecutada
| Prueba | Resultado |
|---|---|
| Unitarias del donante en el snapshot exacto (`node --test tests/model.test.cjs tests/recognition.test.cjs`, sin instalar nada) | **24/24** |
| Las mismas pruebas de reconocimiento en el taller, tras C1–C3 | **17/17** |
| E2E del donante (`north`, `recognition`, `room-boundary` `.spec.cjs`) | **No ejecutadas**: requieren `tesseract.js` (script de instalación no examinado), datos de idioma descargados de una CDN y la imagen de terceros |
| `detect()` del donante sobre su propia imagen (solo en local, solo recuentos) | 36 muros, 16 huecos (10 puertas, 6 ventanas), 7 estancias, brújula y marco de cotas detectados; 850 ms |
| `rasterWallBands` de RUBIK sobre la misma imagen (solo en local; la escala es una hipótesis porque la imagen no está calibrada) | **0 bandas** con los parámetros por defecto y con 10 mm/px; 4 bandas y 0 estancias con 15 mm/px |

## D. Matriz CLASSIFY (archivo/módulo/función)
| Elemento del donante | Decisión | Justificación | Capacidad conservada o perdida |
|---|---|---|---|
| `recognition-core.js` · `span`, `morph`, `opening`, `components`, `contour`, `simplify`, `contains`, `largestWallCluster` | **KEEP** | Núcleo raster probado y puro | Se conserva íntegra |
| `detect()` · muros (morfología + barrido de rectángulos sólidos), huecos, estancias por relleno | **KEEP** | Es la neurona: reconoce muros grises, huecos y estancias donde RUBIK no los ve (§F) | Se conserva |
| `detect()` · máscara fija del 28 %×16 % superior derecho | **OPTIONALISE** (C1) | Ocultaba el botón de la app que aparece en la captura del donante | Opción `ignoreRects` más `LEGACY_UI_MASK`; paridad exacta comprobada |
| `detect()` · `detectCompass`, `detectDimensionFrame`, `suppressOutsidePlan` | **KEEP** (como anotación) | Útiles como evidencia de norte y marco de cotas | El adaptador los expone como `annotations` con `basis: 'raster-heuristic'` |
| `detect()` · tipo de hueco (puerta o ventana) | **GENERALISE** | Es una inferencia, no un hecho | `kind` con `kindBasis: 'raster-heuristic'` y `review: 'unreviewed'` |
| `detect()` · mensajes y avisos en chino | **REPLACE** (en el adaptador) | RUBIK es ES/EN/ZH | Códigos estables (`no-walls`, `no-dimension-frame`…); el mensaje del donante solo queda como `detail` de diagnóstico |
| `detect()` · `median([]) = 8` y constantes en píxeles (18, 48, 55, 70 px) | **GENERALISE** (pendiente) | Suponen imágenes de unos 1000 px | Sin cambio; registrado como límite |
| `enrich()` · asociación de textos OCR a estancias | **KEEP** | Capacidad útil | Etiqueta con `placement` (`inside` o `nearby`) |
| `enrich()` · estancias sintéticas creadas desde una etiqueta huérfana (con 10 mm/px por defecto) | **OPTIONALISE** (C2), desactivado en RUBIK | Inventa geometría | La etiqueta va a `unplacedLabels`; no se pierde el texto |
| `enrich()` · nombres heurísticos (baño por superficie, recibidor por estar junto a la cocina) | **OPTIONALISE** (C2), desactivado | Inventan semántica | Si el donante los aplica, quedan marcados con `nameBasis: 'heuristic-*'` |
| `parseRoomArea` · decimales inventados (418m → 4,18) | **OPTIONALISE** (C2), desactivado | Inventan un dato numérico | Solo se aceptan decimales explícitos |
| `enrich()` · confianza 40 asignada a los tokens fusionados | **REMOVE** (en el adaptador) | Confianza inventada | El adaptador solo pasa la puntuación del motor OCR (`engineScore`), o `null` |
| `parseRoomName` + `ocr-postprocess-rules.js` (alias en chino) | **OPTIONALISE** | Solo sirven para planos en chino | `label.matched` (zh). **C5:** todas las palabras OCR que caen en una estancia se listan tal cual en `wordsInside`, para ES y EN |
| `estimateScale` (se queda con la candidata más cercana a 10 mm/px) | **REPLACE** (C3) | Usa una expectativa sacada de su propia imagen | `scaleCandidates` devuelve todas las candidatas sin elegir; `scale.status` sigue en `unknown` y `applied: false` |
| `toArchitecture`, `fillMissingPartitionWalls`, `doorFromOpening` (píxeles → mm, modelo del donante) | **REPLACE** | Escribiría geometría con una escala no fiable y en un formato ajeno | No se usa: la autoridad es `FloorPlanProjectV1`, con la calibración de RUBIK |
| `overlaySVG`, `cleanUnderlayImage`, `scrubRoomLabelInk`, `cropCanvasTo` | **OPTIONALISE** | Capacidades de presentación | No se usan en el taller; siguen disponibles en la copia |
| `recognition-service.js`, `recognition-worker.js` | **OPTIONALISE** (posterior) | El worker permite cancelar de verdad en el navegador | No se copian; plan para el corte 2 |
| `recognition-ui.js`, `project-ui.js`, `project-model.js`, `index.html`, `project.css`, `furniture-model.js` | **REMOVE** | Segundo editor, persistencia y marca ajenas | Excluidos; se conservan en SOURCE EXACT |
| `tests/fixtures/user-floorplan.png` | **REMOVE** | Vivienda real sin derechos acreditados | Solo en local; se publica su hash |
| `package.json`, `package-lock.json`, `tesseract.js` | **REMOVE** del taller | Script de instalación no examinado y descarga de datos de idioma desde una CDN | El adaptador recibe palabras de cualquier motor OCR que ejecute quien lo llame |

## E. Adaptación funcional
`labs/sculpt/r01-recognition/recognition-evidence-core.js` (`RubikRecognitionEvidence`):
- `analyse(imageData, {words, ocrEngine, imageRef})` devuelve `{ok, evidence}` o `{ok: false, error: {code}}`. Ejecuta el **núcleo original del taller** (no hay reimplementación aproximada) con las opciones de C1/C2 explícitas.
- **RecognitionEvidenceV1** contiene:
  - `canonical: false` y marco `image-px`;
  - procedencia: donante, commit, licencia, opciones y `imageRef.sha256` opcional;
  - `scale: {status: 'unknown', mmPerPx: null, hints: [...]}`;
  - `walls` (con `touchesOtherWall`), `openings` (`kind` y `kindBasis`), `rooms` (`label`, `areaLabel`, `wordsInside`);
  - `annotations` (norte y marco de cotas), `ocr.words` (`engineScore` del motor o `null`), `unplacedLabels`;
  - `warnings` y `limits` permanentes (`not-validated-on-real-plans`, `pixels-only-no-scale`, `human-review-required`…).

  Todo elemento lleva `review: 'unreviewed'`.
- `validate(ev)` rechaza evidencias que afirman más de lo permitido: `canonical: true`, cualquier campo `confidence` o `score`, escala aplicada, revisión distinta de `unreviewed`, nombres o estancias sintéticas, coordenadas fuera de la imagen.
- **No escribe nada.** No recibe ningún proyecto, no toca `project.walls` ni `project.rooms` y no convierte píxeles a mm.
- Correspondencia con lo que pide la orden:

  | La orden pide | Dónde está |
  |---|---|
  | Muro, hueco, estancia, texto | `walls`, `openings`, `rooms`, `ocr.words` |
  | Cota | `scale.hints[].valuesRead` |
  | Norte | `annotations.compass` |
  | Recurso | `imageRef` |
  | Algoritmo | `source` |
  | Escala | `status`, siempre `unknown` en el laboratorio porque la conoce la calibración de RUBIK |

  Confianza: **ninguna**, porque no existe una estimación justificable.
- `recognition-compare-core.js` (`RubikRecognitionCompare`) ejecuta las dos piezas sobre la **misma** imagen:
  - el donante, a través del adaptador;
  - `rasterWallBands`, con los parámetros que `detectPlan()` calcula para una escala calibrada, seguido de `assemble` y `buildProject`, igual que `js/tracing-ui.js`.

  Mide longitudes en píxeles y recuentos, e informa de la tolerancia junto a cada número. No emite veredictos.
- **Cancelación:** el núcleo es síncrono y puro; no queda ningún estado colgado. Si el donante rechaza la imagen (más de 600 trazos), no hay evidencia parcial, la imagen no cambia y la siguiente ejecución es idéntica (prueba).
- La cancelación interrumpible en el navegador, con `worker` y `terminate()`, queda para el corte 2.

## F. Benchmark reproducible (solo planos sintéticos)
Planos generados por código (`fixtures/synthetic-plans.js`): el mismo piso de tres estancias, con dos puertas y una ventana, en seis estilos. La verdad es la geometría con que se dibujan, y la escala está **declarada** por construcción.

**Reglas fijadas antes de comparar:**
- muestreo cada píxel de la línea central;
- un tramo de muro real está «cubierto» si una detección del mismo eje está a ≤ 3 px;
- «fuera de muros» es la longitud detectada que no cae dentro de ningún muro real (±3 px).

Para los parámetros del donante no hay datos separados de ajuste y de validación: **no se ha ajustado ningún parámetro del donante**.

| Plano | mm/px | Donante: muros (aislados) | Huecos | Estancias | Cubierto / real (px) | Fuera de muros | RUBIK: bandas | Huecos | Estancias | Cubierto / real | Fuera de muros | ms donante* | ms RUBIK* |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| black-walls | 10 | 9 (0) | 3 | 3 | 2055/2055 | 0 | 9 | 3 | 3 | 2055/2055 | 0 | 148 | 12 |
| grey-walls | 10 | 9 (0) | 3 | 3 | 2055/2055 | 0 | 9 | 3 | 3 | 2055/2055 | 0 | 74 | 8 |
| grey-walls-fills | 10 | 9 (0) | 3 | 3 | 2055/2055 | 0 | 9 | 3 | 3 | 2055/2055 | 0 | 66 | 8 |
| dimension-lines | 10 | 17 (8) | 3 | 3 | 2055/2055 | **88** | 9 | 3 | 3 | 2055/2055 | 0 | 111 | 8 |
| grey-walls-black-text | 10 | 9 (0) | 3 | 3 | 2055/2055 | 0 | **0** | — | — | **0/2055** | 0 | 62 | 8 |
| low-resolution | 30 | 9 (1) | 3 | 3 | 2103/2103 | 0 | 8 | **2** | **2** | 2103/2103 | **64** | 77 | 9 |

\* Mediana de 7 ejecuciones en Node 22.23.4, contenedor de 4 vCPU Intel Xeon a 2,1 GHz, imagen de 640×480. Solo es orientativo.

Memoria de `analyse()` sobre `grey-walls-fills`, medida con `process.memoryUsage()` tras `gc()`:
- RSS: +13,2 MB;
- `arrayBuffers`: +9,1 MB, frente a 1,17 MB de imagen.

**Lectura honesta:**
- **El caso favorable al donante** es el de muros grises junto a texto casi negro, típico de capturas comerciales. El umbral de RUBIK (el punto medio entre el mínimo y el máximo de gris) deja los muros fuera y no detecta nada. Es el mismo fallo que se observó en local con la imagen del donante (0 bandas).
- En `low-resolution`, RUBIK toma la doble línea de la ventana por muro (64 px) y pierde un hueco y una estancia.
- **El caso desfavorable al donante** es el de las líneas de cota: interpreta como muros los trazos de texto que hay dentro de las estancias (88 px fuera de muros). RUBIK no.
- En tres de los seis estilos, los dos motores obtienen el mismo resultado.
- **Esto no demuestra precisión profesional ni una mejora de RUBIK en planos reales.** Para afirmarlo hacen falta las cinco sesiones y los veinte planos autorizados de `docs/qa/F2-entry-protocol.md`. No se han inventado ni sustituido.

## G. Pulido: ciclos OBSERVE → CHANGE → BUILD → CAPTURE → CRITIQUE → CORRECT
| Ciclo | Observado | Cambio mínimo | Antes → después (mismos datos) | Decisión |
|---|---|---|---|---|
| **C1** | Máscara fija de una esquina, ligada a la captura del donante | `ignoreRects` y `LEGACY_UI_MASK` | Imagen del donante (local): con `LEGACY_UI_MASK`, salida idéntica al donante exacto (comparación profunda); sin máscara, mismos recuentos (36/16/7). Donante 17/17 | KEEP |
| **C2** | `enrich` inventa estancias, nombres y decimales | Opciones `synthesizeRooms`, `heuristicNames` e `inferDroppedDecimal`, activadas por defecto (paridad) y desactivadas en RUBIK | Con las palabras de prueba, el donante crea una estancia sintética y lee 418m como 4,18 m²; el adaptador no crea ninguna estancia, deja `areaLabel: null` y lleva la etiqueta a `unplacedLabels`. Donante 17/17 | KEEP |
| **C3** | `estimateScale` elige la candidata más cercana a 10 mm/px | `scaleCandidates` sin selección | Las pistas salen todas, `unverified` y `applied: false`; `mmPerPx` sigue en `null` | KEEP |
| **C4** | En `dimension-lines`, 8 trazos de texto se toman por muros | Dato geométrico `touchesOtherWall` (holgura de 1 px) y aviso `isolated-wall-pieces`; **sin filtrar** | Fuera de muros: 88 px con todo y 0 px solo con los que tocan otro muro. **Crítica:** en `low-resolution` marca también un muro real (la cobertura bajaría de 2103 a 2007) | **ADJUST**: se informa, nunca se filtra |
| **C5** | «Salón» desaparece porque el donante solo conoce alias en chino | `wordsInside` por estancia, con el texto literal | Antes: ninguna estancia guarda el texto. Después: la estancia lista «Salón» y «12,50 m²». «12,50» no se convierte en 1250 ni en 1,25 | KEEP (pendiente: decimales con coma) |
| **C6** | En el navegador, RUBIK salía sin huecos ni estancias (en Node, 3/3) | La página carga las dependencias de `project-core` en el orden de la app y no carga `surface-catalog` (su `catalog.json` daba 404) | Antes: «—, —»; después: «3 huecos, 3 estancias», igual que Node. Sin errores de página ni peticiones externas | KEEP |

Capturas: `docs/qa/artifacts/sculpt-r01/lab-{1440x900,1280x800,390x844,844x390}.png`. Son solo sintéticos, sin desplazamiento horizontal y sin errores.

## Pruebas y CI
- `tests/sculpt-r01-recognition.test.cjs`: **11/11**. Cubre:
  - procedencia, y que la imagen ajena no está en el repositorio;
  - `labs/` en `.vercelignore`;
  - contrato en los seis estilos;
  - determinismo y ausencia de mutación;
  - entradas inválidas;
  - OCR sin inventar;
  - coma decimal española;
  - pistas de escala no aplicadas;
  - `validate` frente a evidencias manipuladas;
  - comparador;
  - cancelar y reiniciar;
  - imagen vacía.
- Workflow `.github/workflows/sculpt-r01-lab.yml`: Node 22.13.0, sin instalar nada, con la prueba del donante en el taller y la del laboratorio.
- **No se ha modificado ningún archivo del producto** (`js/`, `api/`, `css/`, `index.html`); por eso no se repiten las suites de regresión del producto.

## I. R02, R03 y otros repositorios (solo inventario)
| Fuente | Contenido | Derechos | Riesgo | Orden recomendado |
|---|---|---|---|---|
| **R02** · zhuzhuyumeng `324eb64` (`feat/ceiling-layout`) | Modo de distribución de luminarias de techo: 190 líneas en `index.html`, `ai-layout.js`, `project-model.js` y pruebas | MIT (mismo árbol) | Está **encima de `88323f3`**, que trae `ai-client.js`, `ai-config.js` y `ai-layout.js` (883 líneas, proveedores de IA) y `ai-settings-ui.js`. Hay que separar el modo techo de la capa de IA de pago | 2.º. G4/G5: techo e instalaciones. SOURCE: solo la familia del techo; la IA se excluye (**REMOVE**: gasto de API) |
| **R03** · caikaidev `2495d8e` | Escala del recorrido y editor de interiores de armario (`cabinet-editor.js`, `cabinet-model.js`; 769 líneas añadidas) | **Sin LICENSE**: la bifurcación es anterior al MIT de wuyi y tiene contribuciones de kai cai, Ian y Claude | **Bloqueo legal** | **HOLD**: solo referencia de comportamiento hasta tener permiso escrito (G10: armarios) |
| Juanmaes83/floorplan-3d-ai | «Floor Plan Studio» con reconocimiento por visión mediante OpenAI, Gemini, DeepSeek o Qwen (con clave propia del usuario) | MIT (wy51ai) | Gasto de API y envío del plano a terceros | **NO GO** por ahora: alternativa de pago a R01; solo como referencia para AG-1 / G11, sin escritura |
| Juanmaes83/floorplan-3d-go | Reescritura en Go + SQLite: estilos, presupuesto y lista de materiales, versión 1.5.0 | MIT (wy51ai) | Sustituiría frameworks: **prohibido** | Solo referencia funcional para G8/G9, comparada con Presentation, C1–C4 y FT3D-8 |

### Alias G0–G12 frente al catálogo maestro (el catálogo sigue siendo la autoridad)
| Alias | Tema | Relación real |
|---|---|---|
| G0 | Licencias y atribuciones | **Hecho para R01.** Pendiente transversal: aviso MIT de wuyi en RUBIK (GOV-05) |
| G1 | Banco de pruebas | **Hecho en sintético** (este laboratorio). Faltan los planos reales del protocolo F2 |
| G2 | OCR auxiliar | El contrato acepta palabras de cualquier motor; el motor queda pendiente de decisión (tesseract.js necesita examinar su script de instalación y alojar los datos de idioma en local) |
| G3 | Comprobación de cotas | `scale.hints` como entrada para un futuro contrato de calidad de plano; nunca se aplica |
| G4 / G5 | Techo e instalaciones | R02 |
| G6 | Estancias irregulares | Editor: investigación propia (las estancias del donante son polígonos por relleno) |
| G7 | Pilares, conductos y elementos constructivos | Referencia #15, posterior |
| G8 | Showroom y estilos | Comparar con Presentation y Render IA; floorplan-3d-go como referencia |
| G9 | Presupuesto y entregables | Comparar con C1–C4 y FT3D-8, sin sustituirlos |
| G10 | Armarios paramétricos | R03 (HOLD legal) |
| G11 | Agentes proponentes | AG-1 / MCP sin escritura automática; floorplan-3d-ai como referencia |
| G12 | Escenas grandes y rendimiento | Posterior |

## J. Dictamen
| Capacidad | Reproducida | Mejora medida | Compatibilidad | Preparada para integrar | Veredicto |
|---|---|---|---|---|---|
| Detección raster de muros, huecos y estancias del donante, como **evidencia** | Sí (24/24, 17/17 en el taller) | Solo en sintético: muros grises junto a texto negro (RUBIK 0/2055 px, donante 2055/2055). Peor con texto en las estancias (88 px fuera de muros). **Sin medir en planos reales** | Sí, como evidencia en píxeles, con `canonical: false` | No: falta el protocolo F2 y el contrato de propuesta (diff por id, confirmación, operación atómica, deshacer) | **GO al laboratorio y a HUMAN REVIEW · HOLD a la integración** |
| Asociación OCR → estancia (`label`, `wordsInside`) | Parcial: el motor OCR no se ha ejecutado; se probó con palabras dadas a mano | No medida | Sí (texto literal) | No | **HOLD** hasta elegir motor OCR local |
| Pistas de escala por cotas OCR o superficies | Sí (sin elegir ni aplicar) | No medida | Sí, solo como pista | No: la calibración de RUBIK es la autoridad | **HOLD** |
| Norte (brújula) y marco de cotas | Sí (local) | No medida | Sí, como anotación | No | **HOLD** |
| Estancias sintéticas, nombres heurísticos, decimales inferidos, `toArchitecture` | Sí (donante) | — | **No**: inventan datos | — | **NO GO** en RUBIK (siguen en la copia del taller por paridad) |
| R02 techo | No (inventario) | — | Pendiente de separar de la IA | — | **HOLD** |
| R03 armarios | No | — | — | — | **NO GO** mientras no haya licencia |
| floorplan-3d-ai (visión de pago) | No | — | — | — | **NO GO** (gasto de API) |
| floorplan-3d-go | No | — | Incompatible (Go) | — | **NO GO** como código; solo como referencia |

## Qué necesita aprobación humana (gate 4)
1. **Revisión visual del laboratorio.** Se abre en local (`python3 -m http.server` y luego `labs/sculpt/r01-recognition/index.html`), o con las capturas. Vercel lo excluye a propósito.
2. **Riesgo de licencia residual de R01.** Opciones: aceptarlo, o pedir confirmación al autor (olifod). También: decidir si RUBIK incorpora el aviso MIT de wuyi (GOV-05).
3. **Planos reales autorizados.** El protocolo F2 pide cinco sesiones y veinte planos, en privado y en local, para medir de verdad.
4. **Motor OCR local.** Elegir uno y examinar su instalación, o descartar OCR.
5. **Autorizar, o no, el diseño del contrato de propuesta.** Sería OBSERVACIÓN → PROPUESTA → PREFLIGHT → DIFF POR ID → CONFIRMACIÓN → OPERACIÓN ATÓMICA → DESHACER. Es el siguiente corte; no se ha implementado.
