# MCP local — Etapa 2: propuestas de distribución explicables

**Estado:** prototipo de laboratorio en PR Draft, pendiente de revisión humana. **No integrado. No es la Etapa 3 ni la 4.**

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
| `problem` | Qué se intenta resolver, con su evidencia: conflictos de colocación, o ángulo de contacto de la hoja. |
| `currentPose`, `suggestedPose` | Posición, giro, tamaño y estancia. `suggestedPose` solo existe en `candidate-reviewable`. |
| `distanceMm` | Distancia entre ambas posiciones. |
| `rationale` | Por qué se sugiere: la primera válida del barrido, sin afirmar que sea la óptima. |
| `evidence` | Estancia (centro y huella), modelos antes y después, puerta (`reviewLeafContactDeg`, `placementSquareHit` y la discrepancia, si la hay), candidata rechazada y hallazgos introducidos. |
| `blockingReasons` | `[{code, message}]` |
| `expectedEffects` | Cambio de posición solamente y conflictos que se resuelven en cada modelo. |
| `remainingIssues` | Hallazgos de `layout-review` de **otros** elementos, que siguen ahí (máximo 20 más el recuento). |
| `uncertainty` | Escala, búsqueda en cuadrícula, puertas sin `swing` supuestas por `FloorPlanPlacement` y puertas no revisables. |
| `notEvaluated` | Altura, holguras, recorridos y normativa, escaleras y plantas, detalles de la hoja, otros movimientos y preferencias. |
| `search` | Generador, orden, `stepMm`, `maxCandidates`, tolerancia, posiciones probadas y `budgetExhausted`. |
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
| `candidate-reviewable` | Hay una posición que cumple el objetivo según **las dos** autoridades y no introduce hallazgos nuevos del mueble. **No equivale a aprobación humana.** | `overlap`, `rotated`, `against-wall`, `two-close`, `concave`, `scale-pending`, `door-blocked`, `door-without-swing` (objetivo de solape) |
| `pending` | Falta evidencia, hay ambigüedad, la búsqueda es incompleta o los modelos discrepan. | `ambiguous-room`, `stored-room-conflict`, `too-big` (cuadrícula agotada), `maxCandidates:1` (presupuesto agotado), `models-disagree-before`, `models-disagree-after`, `introduces-issue` y puerta sin `swing` con `clear-door-swing` |
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
  "search": { "generator": "FloorPlanPlacement.find", "stepMm": 50, "maxCandidates": 4000, "toleranceMm": 1, "tried": 323, "budgetExhausted": false },
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
   - `clear-door-swing` usa `layout-review.leafContact`: la hoja precisa. Si la hoja no alcanza el mueble, el resultado es `no-change-needed`, aunque el mueble esté dentro del cuadrado conservador. Esa discrepancia se conserva.
6. **Búsqueda** con `FloorPlanPlacement.find`. Es determinista y acotada, y mantiene el ID, el tamaño, el giro y la estancia.
7. **Verificación** sobre una copia efímera (`FloorPlanCore.clone`) en la que solo cambia la posición del mueble:
   - `FloorPlanCore.validate`;
   - `FloorPlanPlacement.problems`;
   - `FloorPlanLayoutReview.review`;
   - y, si hay puerta, `leafContact`.

   Que `find` devuelva `ok` **no basta**. La copia se descarta.
8. **Registro.**
   - Se anotan los hallazgos independientes de otros elementos y lo no comprobado.
   - Los hallazgos nuevos del mueble hacen que el resultado sea `pending/candidate-introduces-issues`; no se ocultan.

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
2. **Tolerancia de 1 mm frente a 10⁻⁶ mm.**
   - Una candidata aceptada por `FloorPlanPlacement` puede solapar 0,5 mm según `layout-review` (`models-disagree-after`) o rozar 0,5 mm el lado del barrido donde llega la hoja (`introduces-issue`).
   - En ambos casos la candidata se rechaza y queda en `evidence.rejectedCandidate`.
3. **Cuadrado frente a hoja.** Un mueble dentro del cuadrado pero fuera del alcance de la hoja (`door-square-only`) da `no-change-needed`, con la discrepancia como evidencia.

## 8. Limitaciones

- La candidata es la **primera válida de una cuadrícula**: no es la óptima ni se exploran posiciones intermedias.
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

**Comprobado en las pruebas:**

- los argumentos `path` y `project` se rechazan o descartan;
- un `objectId` con forma de ruta solo da `object-not-found`;
- durante cada llamada se bloquean y vigilan las escrituras del sistema de archivos, la red (`net`, `http`, `https`, `fetch`) y la creación de procesos;
- stdout solo transporta mensajes JSON-RPC.

## 10. Pruebas

**`test/proposal.test.cjs` (38):**

- **`candidate-reviewable`**, en 7 escenarios, cada uno contrastado de forma independiente por la prueba: la candidata se aplica en una copia y se comprueba con `FloorPlanPlacement`, `layout-review` y `leafContact`.
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
| MCP `npm test` | **86/86** (46 previas + 38 + 2) |
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
