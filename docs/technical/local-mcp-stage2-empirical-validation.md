# MCP local — Etapa 2: validación empírica, QA visual y auditoría independiente

**Fecha:** 11-11-2026.

**Rama de validación:** `lab/mcp-stage2-empirical-validation`, apilada sobre #196. **No modifica la implementación auditada.**

**Evidencias:** [`docs/qa/artifacts/mcp-stage2-validation/`](../qa/artifacts/mcp-stage2-validation/README.md).

> **Dictamen: HOLD.**
>
> - La validación sintética y visual se ha ejecutado completa y la mayor parte del comportamiento es correcto y reproducible.
> - Aparecen **dos defectos funcionales reproducidos (F1, F2)** y **una afirmación documental inexacta en #196 (F3)**. Requieren una decisión humana antes de aceptar la Etapa 2.
> - **Validación con un proyecto real: PENDIENTE**, porque no hay ningún proyecto real autorizado en el entorno.
> - No se declara «validado empíricamente en proyectos reales».

## A. Alcance y documentación

- **Autoridades leídas:**
  - [`local-mcp-roadmap.md`](local-mcp-roadmap.md): Etapa 1 no cerrada; Etapa 2 propone; Etapas 3 y 4 no autorizadas.
  - [`local-mcp-stage2-proposals.md`](local-mcp-stage2-proposals.md), el acta de #196.
  - [`FloorPlanProjectV1`](../contracts/FloorPlanProjectV1.md).
  - `project-core`, `project-schema`, `furniture-placement`, `layout-review`, `tracing-core` y `room-layout`.
  - El código del MCP y `DEVELOPMENT-WORKFLOW.md`.
- **Qué se valida:** solo la Etapa 2, que propone sin aplicar.
  - La copia efímera que usa el laboratorio visual para dibujar una candidata **no es una simulación de Etapa 3**: no encadena operaciones, no emite JSON y no guarda nada.

## B. Código auditado

- **Implementación:** `369c5b7d516afb55ded16054851504696dca3440`, rama `lab/rubik-mcp-stage2-proposals` (PR #196, Draft). No se ha modificado: ni `src/`, ni los fixtures, ni las pruebas de #196.
- **Lo que añade esta rama, todo fuera del runtime:**
  - `tools/rubik-mcp/validation/`: cliente stdio, enumerador de auditoría, laboratorio visual y grabación;
  - `tools/rubik-mcp/test/validation-stage2.test.cjs`;
  - este informe y las evidencias.
- **Estado de partida:** `master` en `75615fd`. CI de #196 en `369c5b7`: `test` 86/86, `project-first` y Vercel en verde.

## C. Entorno

- Node 22.23.4 en Linux (contenedor).
- Playwright 1.63.0 con Chromium 1243 (`/opt/pw-browsers`), sin instalar navegadores nuevos.
- ffmpeg/ffprobe del sistema, solo para medir la duración de los vídeos.
- Sin servicios externos, sin red de la aplicación y sin credenciales.

## D. Proyectos utilizados

| Categoría | Proyectos | Estado |
|---|---|---|
| **Sintéticos reproducibles** | 11 de #196 (`fixtures/proposal-projects.cjs`) y 1 nuevo, `swingless-inward` (`validation/validation-projects.cjs`). Copias en `artifacts/fixtures/`. | Publicables: geometría ficticia. |
| **Ejemplo contractual ficticio con escala `real` declarada** | `docs/contracts/examples/floorplan-project-v1.example.json` («Estudio de ejemplo (ficticio)», con hash de imagen ilustrativo según el propio contrato). | Se usa como caso adicional. **No es un proyecto real ni una calibración real.** |
| **Proyecto real autorizado** | Ninguno en el repositorio ni en el entorno de trabajo. No se buscó en carpetas privadas. | **VALIDACIÓN EMPÍRICA CON PROYECTO REAL: PENDIENTE POR AUSENCIA DE FIXTURE AUTORIZADA.** |

## E. Baseline (sobre `369c5b7`, en local)

| Comprobación | Resultado |
|---|---|
| MCP `npm test` | 86/86 |
| `npm run check` | PASS |
| Regresiones geométricas: `project`, `tracing`, `layout-review`, `room-layout`, `furniture-placement` | 103/103 |
| `npm audit` | Avisos preexistentes en dependencias transitivas del SDK (`body-parser`, `fast-uri`), sin cambios |

## F. MCP real por stdio

**Cómo se ejecutó.** `validation/run-stdio.mjs` arranca `node tools/rubik-mcp/src/server.mjs --project <tmp>/<fixture>/project.json` y habla JSON-RPC por stdio. Usa un **cliente propio línea a línea**, independiente del SDK cliente, para capturar stdout y stderr por separado.

**Secuencia por proyecto:**

1. `initialize`, `notifications/initialized` y `tools/list`.
2. `get_project_summary`, de donde sale el SHA-256 real.
3. `list_project_elements` de estancias, muebles y huecos.
4. `review_layout`.
5. `propose_layout`, cada petición **dos veces**.
6. Cierre de stdin y espera del final del proceso.

**Resultados en 13 grupos (12 sintéticos y el ejemplo contractual) y 30 propuestas:**

| Comprobación | Resultado |
|---|---|
| Herramientas descubiertas | Las 9 esperadas (8 anteriores y `propose_layout`) en los 13 grupos. Todas con `readOnlyHint` true, `destructiveHint` false, `idempotentHint` true y `openWorldHint` false. |
| stdout | **0 líneas que no sean JSON-RPC** en 151 líneas. |
| stderr | Una única línea: `Rubik MCP local de solo lectura iniciado.` |
| Salida del proceso | Código 0 en los 13 grupos tras cerrar stdin. |
| Repetición | Las 30 propuestas, enviadas dos veces, dan respuestas **idénticas**. |
| `applied` | `false` en las 30. |
| Estado esperado | 30 de 30 coinciden con el estado previsto, o con el registrado en el ejemplo contractual. |

## G. Los cuatro estados (respuestas reales del servidor)

Todas las respuestas completas están en `results/<fixture>.json`.

| Estado | Casos | Evidencia clave |
|---|---|---|
| `candidate-reviewable` | `overlap` (beta: (2300, 1500) → (2600, 1500), 300 mm), `rotated` (30° conservados, 400 mm), silla en el barrido (1300, 300) → (1900, 300), y overlap con puerta sin `swing` | Conflicto inicial, posición distinta, mismos tamaño, giro y estancia. Tras el cambio, `placementModel` y `reviewModel` vacíos. Incertidumbre presente. |
| `no-change-needed` | `correct`, `overlap` frente a la puerta, D3 (lámpara) y las 9 peticiones del ejemplo contractual | `search:null`: no hay búsqueda innecesaria. Motivo legible. D3 conserva la discrepancia. |
| `pending` | Estancia ambigua; D1 (puerta sin `swing`); presupuesto agotado (`maxCandidates:1`); D2 (`models-disagree`); candidata rechazada (`goal-not-confirmed`, ×2); `candidate-introduces-issues` (×2) | Ningún caso se convierte en `blocked`. Ninguno sugiere posición: las rechazadas quedan en `evidence.rejectedCandidate`. |
| `blocked` | ID inexistente; ID de un muro; `openingId` inexistente; hash obsoleto; mueble fuera de estancias | Código y mensaje exactos (`object-not-found`, `not-furniture`, `opening-not-found`, `stale-source`, `object-outside-rooms`). En el hash obsoleto no se analiza nada. |

**Ejemplo real** (`door-blocked`, stdio, resumido):

```json
{
  "status": "candidate-reviewable",
  "objectId": "obj_chair",
  "openingId": "opn_door",
  "problem": { "code": "door-leaf-contact", "contactDeg": 9.5 },
  "currentPose": { "position": { "x": 1300, "y": 300 }, "rotationDeg": 0, "roomId": "rom_living" },
  "suggestedPose": { "position": { "x": 1900, "y": 300 }, "rotationDeg": 0, "roomId": "rom_living" },
  "distanceMm": 600,
  "search": { "tried": 323, "stepMm": 50, "maxCandidates": 4000 },
  "applied": false
}
```

## H. Las tres discrepancias de #196

**D1. Puerta sin `swing`.**
- Qué asume cada autoridad:
  - `FloorPlanCore.geometry` deriva la puerta con bisagra `start` y lado izquierdo;
  - `FloorPlanPlacement` evita ese cuadrado;
  - `layout-review` la omite (`skipped`).
- Qué responde el MCP:
  - `clear-door-swing` sobre esa puerta da `pending/door-swing-missing` y no inventa la apertura;
  - en el resto de propuestas declara `placement-assumes-door-swing` en `uncertainty`.
- Qué geometría produce depende del sentido del muro:
  - en `door-without-swing`, el cuadrado supuesto queda **fuera** de la estancia y no afecta;
  - en `swingless-inward` queda **dentro**, y eso origina F1.

**D2. Tolerancia de 1 mm frente a 10⁻⁶ mm.**
- **Solape de 0,5 mm ya en el inicio:** `FloorPlanPlacement` no ve conflicto, `layout-review` registra un solape de 0,5 mm y el resultado es `pending/models-disagree`. Correcto.
- **Candidata con solape de 0,5 mm:** se rechaza con `goal-not-confirmed` y no se presenta como válida. Correcto, salvo la terminación prematura que describe F2.

**D3. Cuadrado conservador frente a hoja precisa.**
- La lámpara está dentro del cuadrado (`placementSquareHit:true`), pero `leafContact` devuelve `null`. El resultado es `no-change-needed`, con la discrepancia conservada.
- **Comprobación independiente**, sin `leafContact`: se muestreó la hoja cada 0,05° y su esquina más cercana queda a 975,8 mm, más que los 800 mm de radio. No hay colisión inventada.

## I. Auditoría de la búsqueda (Corte 5)

**Herramienta.** `validation/enumerate-candidates.cjs` recorre **la misma secuencia** que `FloorPlanPlacement.find`: mismo generador `candidates` y mismo prefiltro.
- Para cada posición consulta a las autoridades existentes: `problemsIn` y `layout-review`. No es un motor nuevo.
- Reproduce exactamente el contador `tried` del MCP (por ejemplo, 323 y 123), lo que confirma que la secuencia es la misma.

| Escenario | 1.ª candidata de `find` (rechazada) | Motivo | 1.ª aceptada por ambas | Coste |
|---|---|---|---|---|
| `models-disagree-after`, paso 50 por defecto | nº 363, (2600, 1500), 500 mm | solape de 0,5 mm | **nº 443, (2650, 1500), 550 mm** | 12,8 ms |
| `models-disagree-after`, paso 500 | nº 3, (2600, 1500) | solape de 0,5 mm | nº 10, (2100, 500), 1000 mm | 2,2 ms |
| `introduces-issue`, paso 50 por defecto | nº 10, (600, 900), 100 mm | la hoja la alcanza (≈90°) | **nº 15, (550, 900), 112 mm** | 1 ms |
| `introduces-issue`, paso 600 | nº 2, (600, 400) | la hoja la alcanza | nº 7, (1800, 1000), 1200 mm | 1 ms |

> **DEFECTO O LIMITACIÓN FUNCIONAL REPRODUCIDA: LA BÚSQUEDA SE DETIENE PREMATURAMENTE (F2).**
>
> En los cuatro casos existe, dentro del presupuesto por defecto (4000), una posición posterior de la misma cuadrícula aceptada por las dos autoridades. El MCP responde `pending` en su lugar. El resultado es conservador, nunca un falso positivo, pero pierde propuestas válidas incluso con los parámetros por defecto.

**Propuesta de corrección, para revisión y no aplicada:**
- En `tools/rubik-mcp/src/proposal.cjs`, sustituir la llamada única a `Placement.find` por un recorrido del mismo `Placement.candidates`, con el mismo prefiltro y `problemsIn` como validez.
- Verificar cada posición válida con `layout-review` (y `leafContact` en el caso de la puerta) y **continuar** hasta encontrar una aceptada por ambas o agotar `maxCandidates`, que contaría todas las posiciones probadas.
- Registrar en la evidencia las candidatas rechazadas por el camino.
- **Alcance:** solo `proposal.cjs` y sus pruebas. Sin cambios en `furniture-placement.js` ni en `layout-review.js`.
- **Coste medido:** milisegundos en los fixtures.

## J. Auditoría visual (Playwright + Chromium)

**Editor RUBIK.**
- `index.html` en un contexto temporal que se destruye al terminar. Se importaron `overlap`, `door-blocked` y `swingless-inward` por su propio `#fileIn`.
- En los tres casos, la posición, el tamaño y el giro que lee el editor coinciden **exactamente** con el `currentPose` del MCP.
- El editor muestra su propio aviso «“alpha” y “beta” se solapan», que concuerda con el conflicto del escenario A.
- Capturas: `screenshots/app-*.png`.

**Laboratorio** (`validation/lab/`, identificado como **«LABORATORIO DE VALIDACIÓN MCP ETAPA 2 — PROPUESTA NO APLICADA»**).
- Carga los **módulos reales del producto** en el orden de `index.html` y dibuja en mm, en el sistema canónico: x a la derecha, y hacia abajo, giro horario, igual que el espacio de usuario de SVG.
- Dibuja:
  - estancias, muros y puertas (con hoja cuando hay `swing`; con el cuadrado SUPUESTO cuando no);
  - el mueble en su posición actual y la candidata (verde) o rechazada (naranja), con flecha;
  - las zonas de solape y la hoja en contacto que da `layout-review`;
  - la segunda candidata hallada por la auditoría (azul);
  - una nueva comprobación de la candidata en una copia efímera de la página;
  - el SHA-256 del JSON antes y después.

**84/84 comprobaciones** (`results/playwright-checks.json`):

| Comprobación | Resultado |
|---|---|
| Lectura del editor igual al MCP (×3) | Coincide |
| **Fidelidad** (×15): polígonos dibujados del mueble actual y de la candidata frente a `FloorPlanTracing.footprint` calculado en Node | Diferencia < 10⁻⁶ mm |
| Matriz de pantalla | `a, d > 0` y `b = c = 0`: sin volteo ni giro de ejes |
| Comprobación del laboratorio igual a `evidence.after` del MCP | Coincide |
| Desplazamiento horizontal en 15 escenarios × 4 tamaños | Ninguno |
| Errores de consola o de página, y peticiones externas | 0 |

**Material grabado:**
- 66 capturas;
- **3 vídeos reales** de 16,9 s, 27,0 s y 29,4 s a 1440×900;
- 3 trazas de Playwright, no publicadas por tamaño pero con su hash en el README de evidencias.

Ninguna captura sustituye a una ejecución: los vídeos son grabaciones de la sesión de Chromium que ejecuta los pasos.

**Observaciones:**
- En los fixtures, el muro llamado `south` aparece arriba, porque y crece hacia abajo. Es un nombre del fixture, no un error de transformación.
- En 390×844 los rótulos del plano son pequeños, pero el panel recoge todos los datos.

## K. Integridad

**En el protocolo** (13 grupos):
- SHA-256 antes y después **idéntico**;
- bytes **idénticos** (`Buffer.compare`);
- tamaño y `mtime` idénticos;
- el listado del directorio no cambia;
- el SHA-256 de `get_project_summary` coincide con el del archivo.

**Por proyecto**, los primeros 16 caracteres del SHA-256, iguales antes y después:

| Proyecto | SHA-256 |
|---|---|
| `overlap` | `f6d66a6c18a29077` |
| `door-blocked` | `07f49a4339ba7d2a` |
| `rotated` | `1a49936faf516eef` |
| `correct` | `0e2c1174f9d05c61` |
| `door-square-only` | `0e4ef78db1c2fe62` |
| `ambiguous-room` | `a8682bceba13f3e0` |
| `door-without-swing` | `31063cbe5f7b54e6` |
| `swingless-inward` | `40d388980aaa7ceb` |
| `models-disagree-before` | `de37b0ae2e3b92f4` |
| `models-disagree-after` | `6328835facab70bc` |
| `introduces-issue` | `9860ade1c67c48a8` |
| `outside` | `2bff9e693491af55` |
| `contract-example` | `0228276ab764922e` |

**En el navegador:** la importación al editor se hace en un contexto temporal que se destruye al terminar. Ninguna variante exportada ni archivo nuevo.

## L. Seguridad: lo que realmente se ha probado

**F3. Afirmación inexacta en #196.**
- El acta de #196 (§9) dice que durante cada llamada se bloquean «la creación de procesos». La PR dice lo mismo.
- **No es exacto.** Las trampas de `test/proposal.test.cjs` cubren escrituras de alto nivel de `fs` y `fs/promises`, más `net`, `http`, `https` y `fetch`. **No** cubren `child_process`, `open` con un modo de escritura, `fs.write` y `writeSync`, `FileHandle`, `dgram`, `tls` ni `dns`.
- No hay vulnerabilidad demostrada: es una cobertura de pruebas sobredeclarada.

**Pruebas añadidas en `test/validation-stage2.test.cjs`, sin tocar `src/`:**
1. Se bloquean esas APIs durante 7 llamadas reales por el lector común. No se produce **ninguna** llamada y los bytes y el listado quedan intactos.
2. Un **control positivo** demuestra que las trampas sí disparan: `spawn`, `execSync`, `fork`, `openSync('w')`, `writeSync`, `fetch`, `dgram`, `fsp.open('w')` y `writeFile`.
3. Una comprobación **estática**: `proposal.cjs`, `core.cjs`, `spatial.cjs`, `server.mjs` y las autoridades que cargan no referencian `child_process`, `worker_threads` ni módulos de red.

**El protocolo por stdio** confirma, en un proceso real:
- solo JSON-RPC en stdout;
- ningún argumento acepta rutas (el esquema de `propose_layout` no tiene `path` ni `project`);
- un único archivo, el fijado con `--project`.

## M. Auditoría crítica

1. **¿Resuelve la candidata el objetivo declarado?**
   - Sí, en el modelo comprobado, en los 5 `candidate-reviewable` del protocolo: `overlap`, `rotated`, la silla en el barrido, el solape con la puerta sin `swing` y F1. F1 resuelve un conflicto que solo existe por una bisagra supuesta (pregunta 3).
   - En 6 candidatas (`overlap`, `rotated`, `against-wall`, `two-close`, `concave` y la puerta), además de las dos autoridades, se comprobó con un **algoritmo distinto**: triangulación y recorte de `spatial.cjs`, con franjas de muro de `FloorPlanCore.wallRect`. La huella queda completa dentro de la estancia, con área compartida menor de 1 mm² con muebles y muros.
2. **¿Faltan propuestas correctas por los límites de la búsqueda?** **Sí (F2)**, reproducido incluso con los parámetros por defecto.
3. **¿Hay falsos positivos?**
   - **F1:** un mueble que solo choca con el **cuadrado supuesto** de una puerta sin `swing` recibe `candidate-reviewable`.
   - La única señal es una incertidumbre genérica; `problem` no marca que el conflicto sea supuesto.
   - El estado sobrevalora la evidencia: la propuesta resuelve un conflicto que no consta en los datos.
4. **¿Hay falsos negativos?** Sí, los de F2: `pending` cuando existe una candidata válida.
5. **¿Se informa bien la incertidumbre?**
   - Sí en escala, cuadrícula, puertas parcialmente revisadas y búsqueda incompleta («No demuestra que no exista sitio»).
   - Insuficiente en F1.
6. **¿Coinciden las dos autoridades?** No siempre: D1, D2 y D3. El MCP conserva la discrepancia en D2 y D3, pero no en el caso concreto de F1.
7. **¿Se exagera `candidate-reviewable`?** Solo en F1. En el resto el estado se acompaña de «no equivale a aprobación», la incertidumbre y lo no evaluado.
8. **¿Afecta la escala?** Todos los sintéticos son `estimated` y el ejemplo contractual es `real` *declarado*. Las distancias se informan en mm del dibujo, con aviso. Una escala real no se ha podido probar.
9. **¿El visualizador es fiel?** Sí: diferencia de polígonos < 10⁻⁶ mm, matriz sin volteo, y la nueva comprobación de la página coincide con el MCP.
10. **¿Coinciden las respuestas del MCP con lo comprobado?** Sí, en las 30 propuestas, salvo los dos defectos descritos.
11. **¿Se conserva el proyecto?** Sí, byte a byte, en los 13 grupos.
12. **¿Aportan algo las pruebas independientes?**
    - Las de #196 repetían `FloorPlanPlacement` y `layout-review` (útil, pero circular).
    - Las nuevas usan otro algoritmo (`spatial.cjs`), muestreo de la hoja y el editor real.
    - La auditoría de búsqueda sí comparte autoridades, a propósito.
13. **¿Hay estados no cubiertos?**
    - `project-too-large`, `door-on-demolished-wall` e `invalid-object-geometry` solo están cubiertos de forma indirecta o no lo están.
    - No se han probado proyectos con muchos muebles ni varios niveles.
14. **¿Qué corregir antes de integrar?** F1, F2 y F3. Ver la sección N.

**Clasificación:**

| Tipo | Elementos |
|---|---|
| Fallo reproducido | F1 (estado sobrevalorado) y F2 (terminación prematura) |
| Defecto documental | F3 |
| Limitación conocida | D1, D2 y D3 (autoridades); cuadrícula no óptima; holguras y recorridos no evaluados |
| Comportamiento correcto | Protocolo, estados, integridad, `applied:false`, hash, entradas inválidas y fidelidad visual |
| Validación imposible por falta de datos | Proyecto real con escala `real` confirmada |

## N. Riesgos y decisiones humanas

**Riesgos, por importancia:**

1. **F1:** una propuesta «revisable» por un conflicto que no está en los datos. Puede llevar a mover muebles sin motivo.
2. **F2:** se pierden propuestas válidas cercanas, por ejemplo a 112 mm, y se devuelve `pending`.
3. **Sin validación real:** el comportamiento con planos reales (más muebles, estancias irregulares, escala `real`) no está probado.
4. **F3:** la documentación de seguridad sobredeclara la cobertura.
5. **Discrepancias de las autoridades (D1–D3):** dependen del producto y necesitan otra decisión.
6. **`npm audit`:** dependencias transitivas preexistentes.

**Decisiones recomendadas, sin aplicar:**

- **F1.** En `proposal.cjs`, marcar como `assumed` los conflictos de tipo `door` cuya puerta no tiene `swing`.
  - Si **todos** los conflictos son supuestos, devolver `pending/conflict-based-on-assumed-swing`.
  - Si hay otros conflictos reales, mantener la propuesta, pero indicarlo en `problem`.
  - Alcance: `proposal.cjs` y sus pruebas.
- **F2.** Aplicar la corrección descrita en I. Alcance: `proposal.cjs` y sus pruebas.
- **F3.** Corregir el §9 del acta de #196 y la descripción de la PR, y adoptar las trampas de `validation-stage2.test.cjs`.
- **Real.** Aportar un JSON exportado de RUBIK con autorización y escala `real` confirmada. Validarlo en local, sin publicarlo.
- **Etapa 3:** sigue sin autorizar.

## Dictamen

**HOLD.** Antes de aceptar la Etapa 2 hay que decidir sobre F1, F2 y F3.

- La validación sintética y visual está completa y es reproducible.
- No hay mutaciones, fugas de datos ni errores de protocolo.
- La validación con un proyecto real sigue pendiente.
- **Sin merge, sin Etapa 3 y sin cambios de producto.**
