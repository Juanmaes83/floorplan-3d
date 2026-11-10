# SCULPT-R01 — Reconocimiento raster + OCR como evidencia (laboratorio)

**Fecha:** 10/11/2026 (corregido tras la auditoría de la PR #191 sobre `59226c5`) · **Rama:** `lab/sculpt-r01-recognition` (desde `master@75615fd`)
**Estado:** **laboratorio funcional NO VALIDADO** sobre planos reales. **Integración en el producto: BLOQUEADA** hasta completar F2: cinco sesiones y veinte planos reales autorizados ([protocolo](../qa/F2-entry-protocol.md)). Laboratorio fuera de Vercel.
**Registro:** la cartera SCULPT y los alias G0–G12 viven en el catálogo SCULPT de la PR #192 (`docs/product/sculpt-metodologia-y-cartera-2026-11-10.md`), subordinado al catálogo maestro. Este documento no crea otra cartera ni toca las olas.

Metodología: SCULPT (`SOURCE → ISOLATE → CLASSIFY → SCULPT → NORMALIZE → TEST → PREVIEW → HUMAN REVIEW → MERGE`), según `SUBVENCIONES-PYMES/docs/20-SCULPT-METHODOLOGY.md`, `VECINIA-WORLDS/docs/28-CROSS-REPO-CLONING…` y `…/ROADMAP_SCULPTURE_TO_SURGERY…`, y la metodología FT3D de escultura (rama `docs/ft3d-reference-sculpture-rea-methodology`). Esta misión cubre los gates 0–3; el 4 (revisión humana) corresponde a Juanma.

## A. Arqueología y procedencia
Detalle completo en `labs/sculpt/r01-recognition/PROVENANCE.md`. En resumen:

- **Fuente:** PR **wy51ai/floorplan-3d#18**, desde la rama `zhuzhuyumeng/floorplan-3d:feat/floorplan-recognition`, commit `1d235fc0a3c45783e1e1fa129944f8f34d97d297` (autor olifod).
  - Es una bifurcación de `wy51ai/floorplan-3d`, el mismo origen MIT del que deriva RUBIK.
  - Los dos módulos que usamos son idénticos byte a byte en el `master` del donante (`88323f3`).
- **Licencia:** MIT, © 2026 wuyi (`LICENSE` en el mismo árbol). El aviso se conserva en `workshop/LICENSE-donor-MIT.txt`.
- **Derechos: documentados para GOV-05, no resueltos jurídicamente.** Faltan:
  - la confirmación de las contribuciones del autor;
  - el aviso de wuyi en RUBIK;
  - la licencia de las dependencias OCR.

  Ver PROVENANCE §3.
- **Huellas:**
  - `git archive` = `86135d18…`;
  - 23 archivos en `SOURCE-EXACT.sha256`.
- **Dependencias declaradas, no instaladas:**
  - `tesseract.js@6.0.1`, Apache-2.0, con script de instalación no examinado;
  - `@tesseract.js-data/chi_sim`.

## B. Snapshot fiel
- **SOURCE EXACT solo en local.** `tests/fixtures/user-floorplan.png` es una captura de una vivienda real hecha en una app comercial: sin derechos acreditados y en un repositorio público, no se sube.
- `fetch-source-exact.sh` reconstruye el snapshot **fuera del repositorio** y comprueba los 23 hashes y el conjunto exacto de archivos. Verificado: `SOURCE EXACT verified … (1d235fc…)`.
- **Corregido tras la auditoría:** la versión de `59226c5` hacía `rm -rf` sobre el destino indicado. Ahora:
  - **nunca borra ni sobrescribe**: si el destino existe y no está vacío, se niega (salida 3);
  - rechaza enlaces simbólicos y rutas dentro del repositorio (salida 2);
  - construye y verifica en un directorio temporal propio y solo después hace el `mv`;
  - `--verify DIR` solo lee.
- Pruebas:
  - guardas sin red en `tests/…` (prueba 15);
  - reconstrucción real en la CI (job `source-exact`): reconstruye, verifica, rechaza la sobrescritura y comprueba que el checkout queda limpio;
  - en local: directorio no vacío, archivo, enlace y ruta interna rechazados, con el contenido intacto; directorio vacío y ruta nueva, correctos; una segunda ejecución sobre el mismo destino se rechaza; `--verify` detecta un archivo alterado.
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
- **Recuperación tras rechazo, NO cancelación.** Lo único demostrado es esto: si el donante rechaza la imagen (más de 600 trazos), no hay evidencia parcial, la imagen no cambia y la siguiente ejecución es idéntica (prueba 13).
- **No existe cancelación interrumpible:** `analyse()` es síncrono y, una vez iniciado, no se puede detener. La API no expone `cancel` ni `abort`, y una prueba lo comprueba.
- La cancelación real exige el `recognition-worker.js` del donante más `terminate()` y sus propias pruebas (corte 2). **No se afirmará hasta implementarla y probarla.**
- **Observaciones OCR acotadas** (auditoría, punto 3). Cada palabra se rechaza con un código y su índice si:
  - su caja sale del marco de la imagen;
  - la caja está invertida o no es finita;
  - el texto supera 200 caracteres (ya no se trunca en silencio);
  - la puntuación existe pero no es un número finito;
  - o hay más de 5000 palabras.
- **`validate()` comprueba además:**
  - cajas OCR dentro del marco;
  - que cada palabra esté como mucho en una estancia;
  - índices válidos;
  - `ocr.status = 'not-run'` sin palabras;
  - norte, marco de cotas, etiquetas y pistas de escala con números finitos.
- **Hash declarado, verificado y calculado** (`source.image`):

  | Caso | Resultado |
  |---|---|
  | Solo `imageRef.fileSha256` | `file.status: 'declared'` (no comprobado) |
  | Con `fileBytes` | El adaptador calcula SHA-256: `'verified'` más `bytes`; si no coincide con lo declarado, rechaza con `image-file-hash-mismatch` |
  | `pixels.sha256` | Se calcula siempre sobre `uint32be(ancho)+uint32be(alto)+RGBA`; `validate(ev, {image})` lo recalcula (`pixels-hash-mismatch`) |
  | Clave ambigua `sha256` | Rechazada |

  SHA-256 en JS puro y síncrono, contrastado con `node:crypto`. Coste: unos 190 ms con 2,9 MP en este contenedor.

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
| **C7** (auditoría 1) | `fetch-source-exact.sh` hacía `rm -rf` sobre el destino indicado | Destino no vacío → salida 3; enlace o ruta interna → salida 2; construcción y verificación en un temporal, luego `mv`; `--verify` de solo lectura | Antes: con el script de `59226c5`, un directorio ajeno se borraba (prueba 15 en rojo). Después: contenido intacto y reproducibilidad conservada (verificación local y job `source-exact`) | KEEP |
| **C8** (auditoría 3) | Cajas OCR fuera de la imagen aceptadas, texto truncado sin aviso, «hash» del llamante sin distinguir | Límites de marco con código e índice; ningún truncado; `file.status` `declared`/`verified`; `pixels.sha256` calculado; `validate` estructural de OCR, anotaciones y procedencia | Antes: las pruebas 5, 6, 7 y 14 fallan con `59226c5`. Después: pasan | KEEP |
| **C9** (auditoría 2) | La prueba se llamaba «cancel/restart» | Renombrada a «recuperación tras rechazo (no cancelación)»; comprueba que no existe una API `cancel`/`abort` | Ninguna afirmación de cancelación real | KEEP |

Capturas: `docs/qa/artifacts/sculpt-r01/lab-{1440x900,1280x800,390x844,844x390}.png`. Son solo sintéticos, sin desplazamiento horizontal y sin errores.

## Pruebas y CI
- `tests/sculpt-r01-recognition.test.cjs`: **16/16**. Cubre:
  - procedencia, y que la imagen ajena no está en el repositorio;
  - `labs/` en `.vercelignore`;
  - contrato en los seis estilos;
  - determinismo y ausencia de mutación;
  - entradas inválidas;
  - **límites OCR**;
  - **hash declarado, verificado y calculado**;
  - OCR sin inventar;
  - coma decimal española;
  - pistas de escala no aplicadas;
  - `validate` frente a evidencias manipuladas;
  - **`validate` estructural de OCR y anotaciones**;
  - comparador;
  - **recuperación tras rechazo (no cancelación)** e imagen vacía;
  - **guardas de `fetch-source-exact.sh`**;
  - **ningún archivo del producto carga el laboratorio**.
- **Las mismas 16 pruebas contra `59226c5`:** 11 pasan y fallan 5 (5, 6, 7, 14 y 15). Son las correcciones de esta auditoría.
- Workflow `.github/workflows/sculpt-r01-lab.yml`:
  - `lab-unit`: Node 22.13.0, sin instalar nada; ejecuta la prueba del donante en el taller y la del laboratorio;
  - `source-exact`: reconstruye y verifica el snapshot fuera del checkout, y rechaza la sobrescritura.
- **No se ha modificado ningún archivo del producto** (`js/`, `api/`, `css/`, `index.html`); por eso no se repiten las suites de regresión del producto.

## I. Registro y CLASSIFY por capacidad de otras fuentes (solo inventario)
El **inventario ampliado** es la §8 de la PR #192:
- 8 PR del upstream;
- 12 repositorios externos;
- 2 forks propios, con el mismo HEAD que sus padres.

No se duplica aquí. Esta sección solo añade lo que **este laboratorio leyó en el código** de cuatro fuentes. La decisión se toma **por capacidad**, no por donante completo: usar Go o una API de pago no descarta lo demás.

| Fuente | Capacidad concreta (vista en el código) | CLASSIFY | Motivo / condición |
|---|---|---|---|
| **R02** · PR #17 `324eb64` | Capa de techo: `layer: 'ceiling'`, `ceilingDrop` y `furniturePlacement`/`resolveFurniturePlacement` en `project-model.js` | **KEEP** (candidata) | Lógica local sin API; comparar con OBR-04/LUZ-01 y decidir su ID (#192 §4, G4) |
| R02 · base `88323f3` | Colocación determinista de `ai-layout.js` (`tryPlace`, `placeNearWall`, `firstFit`, `furnOverlap`, `wallHit`) | **GENERALISE** (candidata) | Algoritmo sin red; separarlo de la conversación de IA (AG-2/UX-12) |
| R02 · base `88323f3` | `ai-client.js`/`ai-config.js`: llamada directa desde el navegador con `Authorization: Bearer` y clave del usuario | **OPTIONALISE**; **REPLACE** el transporte | Sin gasto ahora (GOV-06a); nunca claves en el cliente: proxy de servidor con límites, como Render IA |
| R02 | `recognition-*` | **Duplicado de R01**, mismos blobs git | No hay un segundo motor |
| **R03** · PR #11 `2495d8e` | `cabinet-model.js` (`buildCabinet`) y `cabinet-editor.js`: armario paramétrico | **HOLD legal** → KEEP candidata | Sin LICENSE; no se copia hasta tener permiso escrito (G10 / CAT-03 parcial) |
| R03 | `view-settings.js`: altura de ojos, ancho de paso, FOV, altura libre y rumbo inicial del recorrido | **GENERALISE** (referencia de comportamiento) | Comparar con Spatial Visit / Presentation; sin copiar código mientras dure el HOLD |
| R03 | `vendor/three/` | **REMOVE** | RUBIK ya tiene Three.js; no se duplica |
| **floorplan-3d-ai** (padre faye25tom, mismo HEAD `a575a3c`) | `runAiRecognition`: visión LLM multimodal (OpenAI, DashScope, DeepSeek, Gemini) con clave en `localStorage` | **OPTIONALISE** (alternativa a R01 detrás de AG-1/GOV-06a); **REPLACE** la clave en el cliente; **REMOVE** el gasto ahora | Comparable en el banco con el mismo contrato de evidencia, sin escritura; coste, privacidad y tasa de error por medir |
| floorplan-3d-ai | `autoFurnishRooms`, `PRESET_LAYOUTS`/presets y el constructor manual (`addRoomToBuilder`…) | **GENERALISE** (candidatas UX-12/UX-13, editor) | Lógica local; comparar con el editor y el catálogo de RUBIK |
| floorplan-3d-ai | `serve.js`: `path.join(__dirname, req.url)` sin normalizar | **REMOVE** | Riesgo de recorrido de rutas (`..`); RUBIK no lo necesita |
| **floorplan-3d-go** (padre wholeai, mismo HEAD `a9a226a`) | Backend Go + SQLite y API `/api/plans` | **REPLACE** (no se adopta) | Prohibido sustituir frameworks; RUBIK conserva su persistencia |
| floorplan-3d-go | Paquetes de estilo (10), cámaras «sala de muestra», mediciones de 16 familias, presupuesto con reserva y tramos de precio, CSV, informe Markdown, hoja PDF, variantes | **GENERALISE** (referencia funcional y delta) | Comparar con Presentation, C1–C4/BC3, FT3D-8, ENT-04 y OBR-05; portar solo el delta demostrado, en JS, sin duplicar presupuesto |
| floorplan-3d-go | Lista de 50 marcas chinas y precios en ¥ | **REMOVE** | Específico del mercado chino; BC3/BCCA es la referencia en España |
| Resto de #192 §8 (PR #8, #9, #15, otros derivados) | — | **No inspeccionado aquí** | Lo registra #192; este laboratorio no los clasifica |

Los alias G0–G12 y su correspondencia con el catálogo maestro se mantienen **solo** en #192 §4.

### Ficha R01 para el registro de #192 (campos de su §7)
| Campo | Valor |
|---|---|
| Alias / ID maestro | R01 · **F2 experimental / G-01 (ola 4)**; investigación G-06 (ola 2). Sin cambio de ola |
| Fuente | wy51ai/floorplan-3d#18 ← `zhuzhuyumeng:feat/floorplan-recognition` `1d235fc…` |
| Hashes | `git archive` `86135d18…`; 23 SHA-256 en `SOURCE-EXACT.sha256`; blobs git `d635e751…` (core) y `c716eeef…` (reglas OCR) |
| Licencia | MIT © wuyi en el árbol; **GOV-05 pendiente** |
| Capacidad | Raster: muros, huecos y estancias; asociación de OCR; pistas de escala; norte y marco de cotas |
| Autoridad del dato | Ninguna: solo evidencia con `canonical: false`. La geometría sigue siendo de `FloorPlanProjectV1` |
| **Estado** | **Laboratorio funcional NO VALIDADO**: clonada → baseline → adaptada → probada en sintético. Sin revisión humana, sin integrar |
| Pruebas reales | Donante 24/24 (snapshot) y 17/17 (taller); laboratorio 16/16; CI en la PR #191 |
| Preview | Vercel excluye `labs/` (404 comprobado); revisión local o con capturas |
| Riesgos | Sin F2; OCR no ejecutado; coma decimal; sin cancelación interrumpible; GOV-05 |
| Decisión humana / PR | PR #191 en borrador; **integración bloqueada** |

**Texto propuesto** para la fila R01 de #192 §3, columna «Estado real». No se aplica desde esta rama, porque #192 no es mía:

> «Laboratorio funcional NO VALIDADO (PR #191): snapshot verificable, baseline 24/24, adaptador de evidencia y comparador sobre sintéticos; integración bloqueada hasta F2 (5 sesiones + 20 planos) y GOV-05.»

## J. Dictamen
**Integración en el producto: BLOQUEADA para todas las capacidades** hasta completar F2 (5 sesiones y 20 planos reales autorizados) y GOV-05. Los veredictos siguientes se refieren al laboratorio.

| Capacidad | Reproducida | Mejora medida | Compatibilidad | Preparada para integrar | Veredicto |
|---|---|---|---|---|---|
| Detección raster de muros, huecos y estancias del donante, como **evidencia** | Sí (24/24, 17/17 en el taller) | Solo en sintético: muros grises junto a texto negro (RUBIK 0/2055 px, donante 2055/2055). Peor con texto en las estancias (88 px fuera de muros). **Sin medir en planos reales** | Sí, como evidencia en píxeles, con `canonical: false` | No: falta el protocolo F2 y el contrato de propuesta (diff por id, confirmación, operación atómica, deshacer) | **GO al laboratorio y a HUMAN REVIEW · HOLD a la integración** |
| Asociación OCR → estancia (`label`, `wordsInside`) | Parcial: el motor OCR no se ha ejecutado; se probó con palabras dadas a mano, ahora acotadas al marco | No medida | Sí (texto literal) | No | **HOLD** hasta elegir motor OCR local |
| Pistas de escala por cotas OCR o superficies | Sí (sin elegir ni aplicar) | No medida | Sí, solo como pista | No: la calibración de RUBIK es la autoridad | **HOLD** |
| Norte (brújula) y marco de cotas | Sí (local) | No medida | Sí, como anotación | No | **HOLD** |
| Estancias sintéticas, nombres heurísticos, decimales inferidos (capacidades concretas de R01) | Sí (donante) | — | **No**: inventan datos | — | **NO GO** como comportamiento por defecto en RUBIK (OPTIONALISE: siguen en la copia del taller por paridad) |
| `toArchitecture` (píxeles → mm del donante) | Sí (donante) | — | No: escala no fiable y formato ajeno | — | **REPLACE** por la calibración de RUBIK |
| Cancelación interrumpible | **No** (solo recuperación tras rechazo) | — | — | No | **HOLD** hasta el worker más sus pruebas |
| Otras fuentes (R02, R03, -ai, -go) | No (inventario) | — | Por capacidad, §I | — | **Sin veredicto de donante completo**; cada capacidad sigue su CLASSIFY de §I. R03: HOLD legal |

## Qué necesita aprobación humana (gate 4)
0. **Nueva auditoría técnica** del SHA final de la PR #191, después de las correcciones del 10/11.
1. **Revisión visual del laboratorio.** Se abre en local (`python3 -m http.server` y luego `labs/sculpt/r01-recognition/index.html`), o con las capturas. Vercel lo excluye a propósito.
2. **GOV-05, licencias y atribuciones.** Siguen abiertos, sin resolución jurídica:
   - las contribuciones de olifod;
   - el aviso MIT de wuyi en RUBIK;
   - las dependencias OCR.
3. **Planos reales autorizados.** El protocolo F2 pide cinco sesiones y veinte planos, en privado y en local, para medir de verdad.
4. **Motor OCR local.** Elegir uno y examinar su instalación, o descartar OCR.
5. **Autorizar, o no, el diseño del contrato de propuesta.** Sería OBSERVACIÓN → PROPUESTA → PREFLIGHT → DIFF POR ID → CONFIRMACIÓN → OPERACIÓN ATÓMICA → DESHACER. Es el siguiente corte; no se ha implementado.
