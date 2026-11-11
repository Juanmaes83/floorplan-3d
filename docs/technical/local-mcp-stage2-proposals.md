# MCP local — Etapa 2: propuestas de distribución explicables

**Estado:** prototipo de laboratorio en PR Draft, pendiente de revisión humana. **No integrado. No es la Etapa 3 ni la 4.**

**Corregido el 11-11-2026 (F1, F2 y F3, §12).** La versión previa, `369c5b7d516afb55ded16054851504696dca3440`, se conserva como baseline histórica: sus defectos están reproducidos en la auditoría de la PR #197 ([`local-mcp-stage2-empirical-validation.md`](local-mcp-stage2-empirical-validation.md)).

**Rama:** `lab/rubik-mcp-stage2-proposals`, independiente, creada desde `master` `75615fdc6c96e7c43e52b13a24950b9652706f7d`.

**Fecha:** 11-11-2026.

El SHA final y la CI de cada commit se registran en la descripción de la PR. Cada commit de este documento cambia el SHA, así que el resultado no puede escribirse dentro de él sin quedar desfasado.

## 1. Autoridad documental

| Orden | Documento | Qué fija aquí |
|---|---|---|
| 1 | [`local-mcp-roadmap.md`](local-mcp-roadmap.md), «Etapa 2 — Propuestas de distribución explicables» | Alcance: candidatos de cambio, no modificaciones. Cada propuesta lleva IDs, ubicación actual y candidata, objetivo, evidencia, efectos esperados, conflictos posibles, incertidumbre y datos que faltan. Objetivos del usuario sin normas ni umbrales inventados. |
| 2 | [`PASCAL-RUBIK-INTEGRATION-ROADMAP.md`](../proposals/PASCAL-RUBIK-INTEGRATION-ROADMAP.md), P6/P7 y fases D1/D2 | La D2 histórica (`propose_patch`, que escribe un JSON Patch y un JSON resultante) es más amplia. La división posterior es **proponer → simular → generar variante** (Etapas 2, 3 y 4 del roadmap del MCP). **Esta entrega implementa solo «proponer».** |
| 3 | `docs/ROADMAP.md`, `docs/DEVELOPMENT-WORKFLOW.md`, la reconciliación del 13-10-2026, el catálogo maestro y la metodología SCULPT | Gobierno. No se cambian el catálogo, las olas ni las prioridades. Esto no es una «piedra» SCULPT. |
| 4 | Código en `master`: `tools/rubik-mcp` v0.1.4, `js/furniture-placement.js`, `js/layout-review.js`, `js/project-core.js`, `js/tracing-core.js` y [`FloorPlanProjectV1`](../contracts/FloorPlanProjectV1.md) | Las autoridades que se reutilizan. Ninguna se modifica. |

## 2. Estado de la Etapa 1, sin cambios

Las ocho herramientas siguen igual: `diagnose_project`, `measure_elements`, `inspect_pair_clearance`, `check_route_2d`, `get_project_summary`, `list_project_elements`, `get_project_element` y `review_layout`.

**La Etapa 1 no se declara cerrada.** Sigue pendiente la validación empírica con proyectos reales de escala `real`, como indica el roadmap. Esta entrega no la realiza.

**Baseline sobre `master` `75615fd`** (Node 22.23.4, Linux):

| Comprobación | Resultado |
|---|---|
| MCP `npm test` | 46/46 |
| `npm run check` | PASS |
| Regresiones geométricas de la raíz (`project`, `tracing`, `layout-review`, `room-layout`, `furniture-placement`) | 103/103 |
| `npm audit` | Avisos en dependencias transitivas del SDK: `body-parser` (alta) y `fast-uri` (moderada). Pertenecen a la pila HTTP/express y a la validación de esquemas. El transporte stdio no usa la pila HTTP. Es preexistente y queda fuera de esta entrega. |

## 3. Qué añade: `propose_layout`

La herramienta es de solo lectura, determinista, idempotente, local y sin red. No usa IA generativa.

**Anotaciones MCP:** `readOnlyHint:true`, `destructiveHint:false`, `idempotentHint:true` y `openWorldHint:false`.

**Parámetros** (validados con Zod en el servidor y otra vez, de forma defensiva, en el módulo):

| Campo | Tipo | Notas |
|---|---|---|
| `objectId` | texto, 1–160 caracteres | Obligatorio. Debe ser un mueble del JSON. |
| `goal` | `resolve-placement-conflict` o `clear-door-swing` | Obligatorio. |
| `expectedSha256` | 64 dígitos hexadecimales | Obligatorio. Es el hash devuelto por `get_project_summary`. |
| `openingId` | texto, 1–160 caracteres | Obligatorio con `clear-door-swing`. |
| `stepMm` | entero, 10–1000 | Por defecto 50 (`FloorPlanPlacement.STEP_MM`). |
| `maxCandidates` | entero, 1–4000 | Por defecto 4000 (`FloorPlanPlacement.MAX_CANDIDATES`). |

- **Ningún argumento es una ruta.** El archivo se fija al arrancar con `--project`.
- Los argumentos desconocidos se descartan en el servidor y el módulo los rechaza. Los valores fuera de rango se rechazan; nunca se recortan.

## 4. Contrato `RubikLayoutProposalV1`

Es un contrato **del MCP**. No forma parte de `FloorPlanProjectV1`.

| Campo | Contenido |
|---|---|
| `proposalVersion` | `"RubikLayoutProposalV1"` |
| `status` | `candidate-reviewable`, `pending`, `blocked` o `no-change-needed` |
| `goal` | El objetivo pedido. |
| `source` | `sha256`, `schemaVersion` y `scaleConfidence` del archivo analizado. |
| `objectId`, `openingId` | Los IDs pedidos. |
| `object` | `id`, `type` y `name` del mueble. |
| `problem` | Qué se intenta resolver, con su evidencia: conflictos de colocación, o ángulo de contacto de la hoja. Cada conflicto con el cuadrado de una puerta **sin `swing`** lleva `assumedSwing:true`, y `assumedSwingOpeningIds` lista esas puertas. |
| `currentPose`, `suggestedPose` | Posición, giro, tamaño y estancia. `suggestedPose` solo existe en `candidate-reviewable`. |
| `distanceMm` | Distancia entre ambas posiciones. |
| `rationale` | Por qué se sugiere: la primera posición del barrido que supera **todas** las comprobaciones, sin afirmar que sea la óptima. |
| `evidence` | Estancia (centro y huella), modelos antes y después, puerta (`reviewLeafContactDeg`, `placementSquareHit` y la discrepancia, si la hay), `assumedSwing` (puertas sin `swing` implicadas), candidata rechazada y hallazgos introducidos (en `pending`) o `rejectedBefore` (primera rechazada antes de la aceptada). |
| `blockingReasons` | `[{code, message}]` |
| `expectedEffects` | Cambio de posición solamente y conflictos que se resuelven en cada modelo. **Nunca** incluye el cuadrado de una puerta sin `swing`: apartarse de un barrido supuesto no es un efecto confirmado. |
| `remainingIssues` | Hallazgos de `layout-review` de **otros** elementos, que siguen ahí (máximo 20 más el recuento). |
| `uncertainty` | Escala, búsqueda en cuadrícula, puertas sin `swing` supuestas por `FloorPlanPlacement` (`placement-assumes-door-swing`), conflicto parcialmente basado en un barrido supuesto (`assumed-swing-conflict`) y puertas no revisables. |
| `notEvaluated` | Altura, holguras, recorridos y normativa, escaleras y plantas, detalles de la hoja, otros movimientos y preferencias. |
| `search` | Generador, orden, `stepMm`, `maxCandidates`, tolerancia, posiciones examinadas (`tried`), `budgetExhausted`, `verificationLimit` y `verificationLimitReached`, posiciones aceptadas por `FloorPlanPlacement` y rechazadas por las demás comprobaciones (`placementValidRejected`, `rejectedByCode`), registro acotado `rejected` (máximo 10: índice, posición, distancia, código y hallazgos; `rejectedTruncated` con el resto) y `acceptedIndex`. |
| `usedData` | Qué campos del proyecto se han leído. |
| `applied` | **Siempre `false`.** |

**No incluye:**

- imágenes;
- rutas locales;
- credenciales;
- el JSON completo;
- objetos editados listos para guardar;
- parches aplicables.

Las pruebas lo verifican, y la respuesta no supera 750 KiB.

## 5. Estados

| Estado | Cuándo | Ejemplos sintéticos |
|---|---|---|
| `candidate-reviewable` | Hay una posición que cumple el objetivo según **las dos** autoridades y no introduce hallazgos nuevos del mueble. **No equivale a aprobación humana.** | `overlap`, `rotated`, `against-wall`, `two-close`, `concave`, `scale-pending`, `door-blocked` (puerta y solape), `door-without-swing` (objetivo de solape), `swingless-plus-real` (conflicto acreditado más barrido supuesto), `models-disagree-after` e `introduces-issue` (la búsqueda sigue tras el rechazo) |
| `pending` | Falta evidencia, hay ambigüedad, la búsqueda es incompleta, los modelos discrepan o el único conflicto es un barrido supuesto. | `ambiguous-room`, `stored-room-conflict`, `too-big` (cuadrícula agotada), `maxCandidates:1` (presupuesto agotado), `models-disagree-before`, `models-disagree-after` e `introduces-issue` con presupuesto insuficiente, `review-rejects-all` (todas las posiciones aceptadas por `FloorPlanPlacement` las rechaza `layout-review`), `swingless-inward` (`conflict-based-on-assumed-swing`) y puerta sin `swing` con `clear-door-swing` |
| `blocked` | Incompatibilidad conocida y demostrada en la petición. | Hash obsoleto, ID inexistente, ID que no es un mueble, hueco inexistente, ventana como puerta, puerta en muro demolido, `openingId` ausente, mueble fuera de toda estancia |
| `no-change-needed` | El objetivo ya se cumple. | `correct`, `door-clear`, `door-square-only` y alfombra en el barrido |

**Agotar 4000 candidatas, o la cuadrícula, nunca es `blocked`.** Es `pending` con el mensaje «No demuestra que no exista sitio».

**Ejemplo real** (fixture `door-blocked`, resumido):

```json
{
  "status": "candidate-reviewable", "goal": "clear-door-swing", "objectId": "obj_chair", "openingId": "opn_door",
  "problem": { "code": "door-leaf-contact", "contactDeg": 9.5,
    "description": "La hoja de la puerta (800 mm) alcanza «chair» al abrir unos 9° de 90° (layout-review)." },
  "currentPose":   { "position": { "x": 1300, "y": 300 }, "rotationDeg": 0, "size": { "widthMm": 400, "depthMm": 400 }, "roomId": "rom_living" },
  "suggestedPose": { "position": { "x": 1900, "y": 300 }, "rotationDeg": 0, "size": { "widthMm": 400, "depthMm": 400 }, "roomId": "rom_living" },
  "distanceMm": 600,
  "expectedEffects": ["moves-position-only", "door-leaf-clear", "resolves-door", "review-clears-puerta"],
  "uncertainty": ["scale-estimated", "grid-search"],
  "search": { "generator": "FloorPlanPlacement.candidates + FloorPlanPlacement.problemsIn (…)", "stepMm": 50, "maxCandidates": 4000, "toleranceMm": 1,
              "tried": 323, "budgetExhausted": false, "verificationLimit": 250, "verificationLimitReached": false, "placementValidRejected": 0, "acceptedIndex": 323 },
  "applied": false
}
```

## 6. Algoritmo: composición, sin motor nuevo

1. **Lectura.** Lector seguro común: un archivo explícito, sin symlinks, hasta 15 MiB, validación canónica y SHA-256 por lectura.
2. **Hash.** Si `expectedSha256` no coincide, la respuesta es `blocked/stale-source` y no se analiza nada.
3. **Mueble.** Se localiza `objectId` y se comprueba que sea un mueble. El proyecto puede tener como máximo 100 muebles, como `review_layout`; por encima, el resultado es `pending`.
4. **Estancia.** Se toman las estancias que contienen el centro (`FloorPlanPlacement.roomsAt`) y se contrastan con la relación de la huella (`spatial.cjs`).
   - Ninguna estancia: `blocked`.
   - Varias estancias, o un `roomId` guardado contradictorio: `pending`.
   - **No se cambia de estancia.**
5. **¿Existe el problema?** Sin problema no se propone ningún movimiento.
   - `resolve-placement-conflict` usa `FloorPlanPlacement.problemsIn`. Si este no ve conflicto pero `layout-review` registra un solape, el resultado es `pending/models-disagree`.
   - **Origen de cada conflicto (F1).** Un conflicto con el cuadrado de una puerta sin `swing` procede de un barrido **supuesto**; los demás están acreditados por datos del JSON.
     - Si **todos** los conflictos son supuestos: `pending/conflict-based-on-assumed-swing`, sin búsqueda, sin `suggestedPose`, con las puertas en `evidence.assumedSwing` y la evidencia geométrica conservada. No se inventa el lado ni la bisagra.
     - Si hay conflictos acreditados además del supuesto: se busca una solución al acreditado. El supuesto queda en `uncertainty` (`assumed-swing-conflict`) y **nunca** como efecto resuelto.
     - Una puerta sin `swing` cuyo cuadrado no toca el mueble no crea ningún conflicto.
   - `clear-door-swing` usa `layout-review.leafContact`: la hoja precisa. Si la hoja no alcanza el mueble, el resultado es `no-change-needed`, aunque el mueble esté dentro del cuadrado conservador. Esa discrepancia se conserva.
6. **Búsqueda (F2).** Se recorre el generador de `FloorPlanPlacement.find`, `FloorPlanPlacement.candidates`, con **exactamente** su escena (`scene`, sin el propio mueble), estancia (`roomsAt`), prefiltro por caja envolvente (las posiciones que no caben no cuentan), redondeo a mm enteros, tolerancia de 1 mm, `stepMm` y presupuesto `maxCandidates`. Mantiene el ID, el tamaño, el giro y la estancia. Para cada posición, en este orden:
   1. validez de colocación (`FloorPlanPlacement.problemsIn`); si falla, siguiente posición;
   2. verificación sobre una copia efímera (`FloorPlanCore.clone`) en la que solo cambia la posición del mueble: `FloorPlanCore.validate`, `FloorPlanPlacement.problems`, `FloorPlanLayoutReview.review` y, si hay puerta, `leafContact`;
   3. objetivo cumplido según las dos autoridades;
   4. ningún hallazgo nuevo del mueble en `layout-review`.

   Si la posición falla en 2–4, se registra el motivo y la búsqueda **continúa con el mismo presupuesto** (no se reinicia). Gana la primera que supera todo. La primera posición válida para colocación es la misma que devolvería `FloorPlanPlacement.find` (las pruebas lo comparan). La copia se descarta.

   **Límite de verificaciones.** `layout-review` revisa el proyecto entero en cada verificación (unos 21 ms con 100 muebles). Para acotar una llamada, se hacen como máximo **250 verificaciones completas** (unos 5 s en el peor caso). Este límite solo puede detener la búsqueda antes que `maxCandidates`; se declara en `search.verificationLimitReached`.
7. **Sin candidata.** Si se agotan la cuadrícula, el presupuesto o el límite de verificaciones, el resultado es `pending`, nunca una imposibilidad:
   - sin ninguna posición válida para colocación: `search-grid-exhausted` o `search-budget-exhausted`;
   - con posiciones válidas para colocación pero rechazadas después: el código del primer rechazo (`goal-not-confirmed` o `candidate-introduces-issues`), con esa candidata en `evidence.rejectedCandidate`.
8. **Registro.**
   - Se anotan los hallazgos independientes de otros elementos y lo no comprobado.
   - Las posiciones rechazadas se registran de forma acotada en `search.rejected` (10 como máximo, más el recuento); la primera, también en `evidence.rejectedBefore` cuando al final hay candidata.

**Frontera con la Etapa 3.** La copia en memoria solo verifica **una** candidata. No hay:

- una API de simulación general;
- encadenamiento de operaciones;
- un JSON de salida;
- parches;
- variantes;
- aplicación.

## 7. Los dos modelos de puerta y otras discrepancias encontradas

| Autoridad | Modelo | Efecto en la propuesta |
|---|---|---|
| `furniture-placement.js` | Cuadrado conservador que envuelve el barrido. Tolerancia de penetración de 1 mm. | Genera la candidata. |
| `layout-review.js` | Hoja de grosor nulo que gira 90°. Solape desde 10⁻⁶ mm. | Decide el conflicto de puerta y confirma la candidata. |

**Discrepancias documentadas con prueba** (las autoridades no se modifican en esta misión):

1. **Puertas sin `swing`.**
   - `FloorPlanCore.geometry` deriva una geometría con bisagra supuesta (`start`, lado izquierdo), y `FloorPlanPlacement` evita ese cuadrado supuesto.
   - `layout-review` no evalúa esas puertas.
   - `propose_layout` lo declara en `uncertainty` como `placement-assumes-door-swing`. Con `clear-door-swing` sobre una puerta así responde `pending/door-swing-missing` y **no inventa bisagra ni sentido**.
   - Desde la corrección F1, un conflicto que solo existe por ese cuadrado supuesto da `pending/conflict-based-on-assumed-swing` (§6, paso 5). Antes daba `candidate-reviewable` (fixture `swingless-inward`, auditoría #197).
2. **Tolerancia de 1 mm frente a 10⁻⁶ mm.**
   - Una candidata aceptada por `FloorPlanPlacement` puede solapar 0,5 mm según `layout-review` (`models-disagree-after`) o rozar 0,5 mm el lado del barrido donde llega la hoja (`introduces-issue`).
   - En ambos casos esa posición se rechaza y la búsqueda sigue (F2): con el paso por defecto, la nº 443 a 550 mm y la nº 15 a 112 mm superan las dos autoridades. Si el presupuesto no alcanza, el resultado es `pending` y la posición rechazada queda en `evidence.rejectedCandidate`.
3. **Cuadrado frente a hoja.** Un mueble dentro del cuadrado pero fuera del alcance de la hoja (`door-square-only`) da `no-change-needed`, con la discrepancia como evidencia.

## 8. Limitaciones

- La candidata es la **primera posición de una cuadrícula que supera todas las comprobaciones**: no es la óptima ni se exploran posiciones intermedias.
- Como máximo 250 verificaciones completas por llamada (§6). Un caso que lo alcance queda `pending`, no imposible.
- Con un conflicto acreditado más un barrido supuesto, la búsqueda también evita el cuadrado supuesto: es conservador y puede descartar posiciones que con el `swing` real serían válidas.
- No se evalúan:
  - holguras, ya que no hay umbral y no se inventa;
  - recorridos;
  - altura;
  - normativa;
  - escaleras y otras plantas;
  - ergonomía y preferencias.
- Con escala `estimated` o `pending`, las distancias son aproximadas o relativas. Se declara en `uncertainty`.
- Un solo mueble y una sola posición: no gira, no redimensiona y no mueve otros elementos.
- La versión declarada del servidor y del paquete sigue siendo `0.1.4`: la numeración es una decisión de integración.

## 9. Seguridad y privacidad

Se conservan todas las protecciones del servidor:

- un único archivo, fijado en `--project`;
- transporte stdio, sin servidor HTTP;
- un máximo de 15 MiB, sin symlinks;
- validación canónica y SHA-256 por lectura;
- respuestas de 750 KiB como máximo;
- ningún acceso al navegador ni al almacenamiento local de RUBIK;
- sin IA externa ni credenciales nuevas;
- ninguna escritura.

**Comprobado en las pruebas** (corregido en F3; la versión `369c5b7` afirmaba más de lo que sus pruebas comprobaban):

| Cobertura | Qué intercepta o comprueba | Origen |
|---|---|---|
| **Anterior (`369c5b7`)** | Mutadores de archivos de `fs` y `fs/promises` (`writeFile`, `appendFile`, `rm`, `unlink`, `rename`, `mkdir`, `copyFile`, `truncate`, `createWriteStream` y sus variantes síncronas); red con `net.connect`/`createConnection`, `http.request`, `https.request` y `fetch`. **No interceptaba la creación de procesos**, aunque esta sección lo afirmaba. | #196 |
| **Adicional** | `child_process` (`spawn`, `spawnSync`, `exec`, `execSync`, `execFile`, `execFileSync`, `fork`); `open`/`openSync`/`fsp.open` con cualquier indicador de escritura (se permite la lectura); `write`, `writev`, `ftruncate`, `symlink`, `link`, `chmod`, `utimes`, `mkdtemp`; `dgram.createSocket`, `tls.connect`, `dns.lookup`. Las llamadas se registran aunque el error se capture, y un control positivo demuestra que cada trampa salta. | Auditoría #197, adoptada en `test/proposal.test.cjs` |
| **Estática** | Los fuentes del MCP y las autoridades que carga no contienen `child_process`, `worker_threads` ni módulos de red. | #197 (`validation-stage2.test.cjs`) |
| **Integridad del archivo** | Mismos bytes, `mtime`, listado del directorio y SHA-256 antes y después, por la API y por el servidor real por stdio. | #196 y #197 |

- los argumentos `path` y `project` se rechazan o descartan;
- un `objectId` con forma de ruta solo da `object-not-found`;
- stdout solo transporta mensajes JSON-RPC.

**Límites de estas pruebas.** Interceptan una lista concreta de APIs de Node dentro del proceso de prueba. **No demuestran** la ausencia de cualquier efecto secundario posible: no cubren, por ejemplo, módulos nativos, `process.binding`, `worker_threads` en tiempo de ejecución, `inspector` o efectos de dependencias cargadas antes de instalar las trampas. No hay ninguna vulnerabilidad demostrada; la afirmación anterior era imprecisa, no falsa respecto al código.

## 10. Pruebas

**`test/proposal.test.cjs` (60; 38 en `369c5b7`):**

- **`candidate-reviewable`**, en 13 casos, cada uno contrastado de forma independiente por la prueba: la candidata se aplica en una copia y se comprueba con `FloorPlanPlacement`, `layout-review` y `leafContact`.
- **F2:** los cuatro casos de la auditoría (índices 363→443, 10→15, 3→10 y 2→7) con su posición, distancia y aceptación por las dos autoridades; la primera posición válida para colocación coincide con `FloorPlanPlacement.find` en 10 escenarios; presupuesto sin reinicio; cuadrícula agotada; límite de verificaciones; determinismo.
- **F1:** solo barrido supuesto → `pending/conflict-based-on-assumed-swing`; conflicto acreditado más barrido supuesto; `swing` explícito con contacto real; `clear-door-swing` sin `swing`; puerta sin `swing` que no toca el mueble.
- **F3:** trampas completas de efectos secundarios en cada llamada y control positivo.
- **`no-change-needed`**, 4 casos.
- **`pending`**, 8 casos, más los casos de búsqueda incompleta y de candidata rechazada.
- **`blocked`**, 9 casos, incluido el hash obsoleto.
- **Argumentos inválidos**, 16 variantes:
  - objetivo desconocido, hash y IDs fuera de formato;
  - `stepMm` y `maxCandidates` fuera de rango o no enteros;
  - claves `path` y `project`;
  - argumentos `null` y array.
- **Archivos inválidos:**
  - JSON roto;
  - contrato inválido;
  - coordenadas no finitas (`1e999`);
  - datos anidados incompletos;
  - un número escrito como texto;
  - un symlink.
- **Invariantes:**
  - mismos bytes, `mtime` y listado del directorio;
  - mismo hash;
  - cuatro llamadas idénticas con la misma respuesta;
  - entrada pura sin mutar;
  - solo el mueble pedido;
  - forma exacta del contrato.

**`test/proposal-protocol.test.mjs` (2):**

- cliente MCP real por stdio;
- las 9 herramientas y sus anotaciones;
- los cuatro estados y el hash obsoleto;
- repetición idéntica y errores de esquema controlados;
- el argumento `path` no surte efecto;
- las ocho herramientas anteriores responden sobre el mismo archivo;
- el archivo queda intacto, sin depuración en stderr y con stdout solo JSON-RPC.

`test/protocol.test.mjs`, la prueba existente, solo actualiza la lista esperada de herramientas para incluir `propose_layout`.

**Resultados locales** (Node 22.23.4, Linux, SHA de código de esta rama):

| Comprobación | Resultado |
|---|---|
| MCP `npm test` | **108/108** (46 previas + 60 + 2); 86/86 en `369c5b7` |
| `npm run check` | PASS, incluido `src/proposal.cjs` |
| Regresiones geométricas de la raíz | 103/103 |

**CI:** el workflow `rubik-mcp.yml` ya ejecuta `npm test`. Este corte solo añade `js/furniture-placement.js` a sus rutas de disparo, porque `propose_layout` depende de ese archivo. La CI de cada SHA está en la PR.

## 11. Próxima decisión humana

1. Revisar el contrato y los estados. Decidir si `candidate-reviewable` debe exigir además algún otro criterio.
2. Decidir sobre las tres discrepancias del §7:
   - la bisagra supuesta para puertas sin `swing`;
   - la tolerancia de 1 mm frente a 10⁻⁶ mm;
   - el cuadrado frente a la hoja.

   Corregir alguna implica cambiar autoridades del producto y queda fuera de esta misión.
3. Validar con el JSON real de prueba y con escala `real`. Esto sigue pendiente también para la Etapa 1.
4. Decidir la numeración de la versión y si se integra.
5. **La Etapa 3 (simulación aislada antes/después) no está autorizada por esta entrega.**

## 12. Corrección F1, F2 y F3 (sobre `369c5b7`)

La auditoría independiente de la PR #197 reprodujo tres defectos en `369c5b7d516afb55ded16054851504696dca3440`. Esta corrección cambia solo `tools/rubik-mcp/src/proposal.cjs`, sus fixtures, sus pruebas y esta documentación. **No cambian** `FloorPlanProjectV1`, `js/furniture-placement.js`, `js/layout-review.js`, `js/project-core.js`, el editor ni la API web.

| Defecto | Antes (`369c5b7`) | Después | Prueba |
|---|---|---|---|
| **F1** — conflicto solo con el barrido supuesto de una puerta sin `swing` | `candidate-reviewable`, con una incertidumbre genérica | `pending/conflict-based-on-assumed-swing`, sin `suggestedPose`, con la puerta y la evidencia; un conflicto mixto resuelve el acreditado y deja el supuesto como incertidumbre | `F1: …` en `test/proposal.test.cjs` |
| **F2** — la búsqueda paraba en la primera posición de `find()` | `pending/goal-not-confirmed` o `candidate-introduces-issues` aunque existiera otra válida | La búsqueda sigue con el mismo orden y presupuesto: (2650, 1500) a 550 mm, nº 443; (550, 900) a 112 mm, nº 15; nº 10 y nº 7 con pasos 500 y 600 | `F2 regression: …` y siguientes |
| **F3** — §9 afirmaba que se bloqueaba la creación de procesos | Las pruebas no interceptaban `child_process` ni otras APIs | Trampas completas con control positivo; §9 distingue cobertura anterior, adicional, estática e integridad, y sus límites | `control: …` y §9 |

**Nueva decisión para revisión humana:** el límite de 250 verificaciones completas por llamada (§6). Sin él, un proyecto de 100 muebles en el que `layout-review` rechazara todas las posiciones podría tardar unos 100 s.

