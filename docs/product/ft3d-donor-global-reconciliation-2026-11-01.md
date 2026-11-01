# FT3D — Global Donor-Code Reconciliation · Cuts 1–5 / D01–D21

**Fecha:** 2026-11-01. **Estado:** DOCUMENTARY AUTHORITY CANDIDATE — READY FOR HUMAN REVIEW, pendiente de aprobación humana.
**Repositorio:** Juanmaes83/floorplan-3d. **Base autorizada y verificada:** `18848fbf3308ef8c2c8841edf626221f74922d23`.

## 0. Alcance y decisión de control

Esta es la única reconciliación documental global de cinco paquetes / seis artefactos, no un sexto Cut. Contrasta Atlas original, Cuts acreditados, contratos y producto integrado. No selecciona ni ordena trabajo futuro y no aplica el Atlas Delta Log. Las disposiciones por componente son conocimiento documental, no autorización de implementación.

Principios: Rubik commands; donor informs. Semantic correctness > visual polish. Restore correctness > cinematic effect. Route authority ≠ camera choreography. Available in code ≠ active in runtime ≠ effectively used. Evidence generation ≠ evidence review. Source existence ≠ execution. Reconciled ≠ implemented. READY FOR HUMAN REVIEW ≠ human approval.

### 0.1 Control inicial

| Control | Resultado |
|---|---|
| origin/master comprobado antes de empezar | `18848fbf3308ef8c2c8841edf626221f74922d23` |
| Mensaje | Reconcile FT3D-5 with master@5f4e3d20 |
| Rama nueva, sin historia local/remota previa | `docs/ft3d-donor-global-reconciliation-2026-11-01` |
| Worktree dedicado | `C:/Users/temp123/work/floorplan-3d-donor-global-reconciliation` |
| HEAD/base inicial | `18848fbf3308ef8c2c8841edf626221f74922d23` |
| git status inicial | Vacío; worktree limpio |
| Inputs | Cuts 1–2 exactos legibles; cuatro adjuntos con hashes/títulos/cobertura coincidentes |
| Atlas y referencias | Objetos/revisiones fijados accesibles; ningún HEAD móvil sustituido |
| Trabajo ajeno | No cambios a otros worktrees ni acceso a Claude WIP |

Solo se permiten los seis archivos nuevos enumerados en el manifiesto. No producto, schemas, persistencia, contratos, FT3D-6, current-status, Roadmap, Atlas original, PR o merge.

### 0.2 Autoridad de fuentes y precedencia

[Manifiesto de fuentes](evidence/donor-cuts-2026-11-01/manifest.md): identificación completa, hashes, baselines y control humano.

| Ref | Artefacto exacto | Alcance |
|---|---|---|
| A | [Atlas@7696fb2](https://github.com/Juanmaes83/floorplan-3d/blob/7696fb2c6c30f158001d38ecc53feb2674acaa25/docs/product/ft3d-reference-atlas-2026-11-01.md) | Índice de identidad y formulaciones históricas |
| S1 | [Cut 1@6a573f1](https://github.com/Juanmaes83/floorplan-3d/blob/6a573f1955fd70dd52bb10450c9b9df9b4833aa0/docs/product/ft3d-donor-code-gap-analysis-2026-11-01.md) | D01–D08; baseline 5f4e3d20 |
| S2 | [Cut 2@cc04f67](https://github.com/Juanmaes83/floorplan-3d/blob/cc04f67fc0b46c87bc696bf566adb362f43041fd/docs/product/ft3d-donor-code-gap-analysis-2026-11-01.md) | D09–D13; D01–D08 repetidos no se cuentan otra vez |
| S3 | [Cut 3 original](evidence/donor-cuts-2026-11-01/cut3-d14-d15-d19.md) | D14/D15/D19; baseline 5f4e3d20 |
| S4 | [Cut 4 original](evidence/donor-cuts-2026-11-01/cut4-d16-d17-d18.md) | D16–D18; baseline 5f4e3d20 |
| S5 | [Cut 5 base](evidence/donor-cuts-2026-11-01/cut5-d20-d21-base.md) | D20–D21; producto 18848fb vía objetos Git |
| S6 | [Cut 5 completion](evidence/donor-cuts-2026-11-01/cut5-d20-d21-completion.md) | Complementa S5; reemplazos explícitos de clasificaciones/ledgers prevalecen |
| B5 | Código probado `bf3e5ca5c8df1f6bc2bd61925a0a1456b2d1353d` | 710 PASS / 0 FAIL / 2 SKIP según control explícito del usuario; no ejecución nueva |
| R | [Producto@18848fb](https://github.com/Juanmaes83/floorplan-3d/tree/18848fbf3308ef8c2c8841edf626221f74922d23) | Autoridad actual integrada |
| P5 | [FT3D-5 V2](ft3d-5-axon-exploded-building-contract-2026-11-01.md) y [adenda](ft3d-5-axon-exploded-building-contract-audit-addendum-2026-11-01.md) | Alcance integrado y obligaciones; sin reapertura |
| P6 | [Working FT3D-6@5db3c1b](https://github.com/Juanmaes83/floorplan-3d/blob/5db3c1b48972128f2769598141cbe2268b792bfa/docs/product/ft3d-6-profile-templates-working-contract-2026-11-01.md) | §50 P1–P11: carry-forward, sin cierre |

F = flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6; L = lintel-flat-2d@c6029d9bb0647483709a502daedc24c1dd7bc029; LL = lintel-live@791612f6f07fdd79bafeedc74ec6c9eee0f9a86a; REA = aa48d494e9726d469a1b9ed917f021d8a1a4c7ea. En los locators heredados 01/02/03/04/05/06/07 son respectivamente exploded-house, section-sweep, open-section, build-time-lapse, schedule-build, card-model y sunlit-elevation, con prefijo numérico completo.

La autorización acredita disponibilidad, no aprobación automática de cada hallazgo. COMPLETE/READY no permiten inferir aprobación humana: **NOT INFERRED** salvo evidencia expresa. Recomendaciones/backlogs históricos de los paquetes permanecen solo en sus fuentes; no se incorporan como selección, cola u orden de trabajo en esta reconciliación.

### 0.3 Método y límites

Lectura/comparación de los seis artefactos acreditados y Atlas exacto; Git para baselines/ancestros/delta; inspección del producto integrado y contratos pertinentes. No campañas nuevas de donor/browser/visual, no REA ejecutado y no nuevas suites de producto. Las conclusiones de los Cuts se mantienen con su fuerza original.

**SUPPLEMENTAL RECONCILIATION EVIDENCE: NONE** respecto de nueva investigación donante: ninguna contradicción necesitó reabrir fuente donante. La inspección del producto actual y su delta es comprobación de baseline, no nuevo Cut.

## 1. Evidencia, seis niveles de uso y ejes independientes

CONTRACT-CONFIRMED responde qué debe pasar; SOURCE-CONFIRMED qué mecanismo existe; RUNTIME-CONFIRMED qué ocurrió bajo condiciones concretas; TEST-CONFIRMED qué invariante se ejercitó; VISUALLY-OBSERVED qué se vio; HUMAN-ACCEPTED qué fue aprobado explícitamente. INFERRED y UNVERIFIED se conservan. No se promociona una categoría al sintetizarla.

Para búsquedas negativas: FOUND / NOT FOUND IN AUDITED SCOPE / PROVEN ABSENT / UNVERIFIED. La ausencia de imports/postFX en una ruta auditada no prueba ausencia global. KTX2/Basis no encontrado en rutas inspeccionadas sigue limitado a ese alcance.

### 1.1 Seis niveles y perfiles de evidencia usados en todas las filas

| Perfil | L1 API | L2 fuente | L3 configuración | L4 conexión | L5 ejercicio pertinente | L6 eficacia/aceptación |
|---|---|---|---|---|---|---|
| U1 | FOUND | FOUND, responsabilidad Rubik concreta | SOURCE-CONFIRMED donde indica locator | SOURCE-CONFIRMED | Evidencia histórica acotada en S1/S2/A o pruebas referidas por estos; no rerun en R | UNVERIFIED para nuevas combinaciones/acabado; no aprobación global |
| U2 | FOUND | FOUND en R | SOURCE-CONFIRMED | SOURCE-CONFIRMED | B5 en bf3e5ca… según control; fuentes de tests/script inspeccionadas, mismo código en R | Evidencia del caso documentado; aceptación de variantes futuras y paridad premium UNVERIFIED |
| U3 | Puede existir API/dependencia | Mecanismo donor FOUND; adapter/efecto Rubik exacto NOT FOUND IN AUDITED SCOPE o UNVERIFIED según fila | UNVERIFIED para nueva composición | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| U4 | No basta para la afirmación | Concepto demo/documental identificado | No configuración profesional legítima derivada | No conexión productiva acreditada para esa afirmación | UNVERIFIED / no aplicable a dato ficticio | No aceptación derivable |

ALREADY SOLVED se restringe a la **responsabilidad funcional identificada**, por equivalencia concreta/código/pruebas/contrato citados, no por encontrar una API. KEEP EXISTING significa no reconstruir esa autoridad; nunca afirma que todas sus representaciones estén visualmente aceptadas. AVAILABLE BUT UNUSED exige prueba de ausencia de uso en una ruta; ACTIVE BUT UNDERUSED exige comparación controlada. No se adjudican esos estados por intuición. EFFECTIVELY USED exige evidencia L5/L6 específica; no se extrapola. MISSING queda limitado a una capacidad exacta auditada, no al renderer entero.

### 1.2 Clasificaciones

Cada componente separa estado Rubik, tipo de mecanismo, técnica, legalidad, disposición y factores. Técnica: DIRECT / PRINCIPLE ONLY / ALREADY SOLVED / DONOR-SPECIFIC / DECISION REQUIRED / UNVERIFIED. Estado: MISSING / AVAILABLE BUT UNUSED / ACTIVE BUT UNDERUSED / EFFECTIVELY USED / ALREADY SOLVED / DECISION REQUIRED / UNVERIFIED.

Disposiciones documentales: **KEEP EXISTING** (responsabilidad local), **REUSE** (material exacto apto bajo todas las condiciones), **ADAPT** (mecanismo ajustado al host), **REIMPLEMENT** (comportamiento con implementación propia), **REFERENCE ONLY** (entendimiento/método), **DEFER** (pregunta conocida fuera de fase o sin readiness), **REJECT** (supuesto inadecuado), **UNRESOLVED** (insuficiencia/conflicto). No son autorizaciones.

No se asigna REUSE literal por “buena idea”: requiere fragmento/revisión/licencia/avisos/fronteras terceros y encaje concreto. La existencia de MIT no completa ese gate; aquí no se compromete extracción literal alguna.

### 1.3 Fronteras legales independientes

| Perfil | Código donante | Assets | Dependencias | Aprendizaje |
|---|---|---|---|---|
| LF (D01–D19) | REUSABLE WITH ATTRIBUTION, MIT F ©2026 Samnang Aing; porción exacta/notice antes de reutilización literal | ASSET LICENSE REVIEW REQUIRED; repo no relicencia imágenes, modelos, HDRIs, fuentes o vídeo | DEPENDENCY LICENSE REVIEW REQUIRED por versión/addon; compatibilidad independiente | Principios contrastados, sin importar casa |
| LL (D20) | REFERENCE ONLY — DO NOT COPY, sin licencia reutilizable establecida en estado auditado L/LL | ASSET LICENSE REVIEW REQUIRED; no permiso inferido para fotos/capturas/vídeos | DEPENDENCY LICENSE REVIEW REQUIRED | Método descrito con palabras propias; no copiar herramientas/shaders |
| LR (D21) | REUSABLE WITH ATTRIBUTION, MIT REA ©2026 morluto | ASSET LICENSE REVIEW REQUIRED para cualquier recurso externo | DEPENDENCY LICENSE REVIEW REQUIRED; herramienta queda fuera de producto | Capturar no cambia licencia del target |

R es código propio existente: KEEP EXISTING no supone copiar donor ni relicenciar Rubik. LF/LL/LR se aplican al **material donante** de cada fila, no impiden conservar implementación Rubik. Licencias verificadas en los Cuts; snippets sin procedencia individual y terceros mantienen límites declarados. No aviso central nuevo ni assets distribuidos en esta tarea.

### 1.4 Factores, no orden de implementación

En las tablas: **V** valor profesional; **I** impacto visual; **D** readiness de datos; **T** riesgo técnico; **L** riesgo legal dentro de la disposición; **ΔP** revisión de prioridad histórica. V/I = HIGH/MEDIUM/LOW; D = READY/PARTIAL/BLOCKED/UNVERIFIED; T/L = HIGH/MEDIUM/LOW/UNVERIFIED. ΔP = KEEP/UPGRADE/DOWNGRADE/DEFER/UNRESOLVED. Son valoraciones INFERRED de alcance y riesgo, no mediciones ni ranking.

Priority ≠ implementation order. No se heredan P0/P1 mecánicamente: D09 baja la necesidad histórica de construir tras evolución del producto; D16–D18 retienen relevancia pero DEFER por dominio; microdetalle no hereda prioridad de composición.

## 2. Registro D01–D21 por componente

68 componentes materiales. Los IDs Dxx-Cn son estables para esta reconciliación. Cada fila hereda el locator exacto y fuente de su dossier, el perfil legal LF/LL/LR y las restricciones globales. No son 68 features independientes.

### D01 — Encuadre, lente y distancia

**Provenance:** S1 §5; §2 probes; A D01. **Fuente fijada:** F: `01-exploded-house/core.js: camAt/applyCam`. **Autoridad Rubik actual:** `js/presentation-story-core.js: planReveal/sectionOpen/elevationOpen; index.html: overviewPose` en R. **Legal:** LF.

Altura completa y semialtura no son intercambiables. La invariancia de landmarks demostrada es planar, no de todo un volumen. El donor devuelve roll sin aplicarlo; la rama posición explícita + ancho puede divergir. No se adopta un segundo evaluador de cámara.

| ID | Componente / tipo | Estado Rubik | Técnica | Disposición | Uso | Rationale / límite de evidencia |
|---|---|---|---|---|---|---|
| D01-C1 | Relación frame/FOV/distancia y giro corto — ADAPTER PATTERN | ALREADY SOLVED | ALREADY SOLVED | KEEP EXISTING | U1 | Responsabilidad matemática ya presente, comparada en S1; no solo API disponible. No acredita aceptación visual universal. |
| D01-C2 | Desplazamiento óptico y composición regional — ADAPTER PATTERN | UNVERIFIED | PRINCIPLE ONLY | ADAPT | U3 | Un shift nuevo necesita estado de proyección/inverse y restauración; viewRegion existente no prueba esta extensión. |
| D01-C3 | Claves, clipping fijo y constantes de casa — DONOR-DEMO-ONLY CONCEPT | DECISION REQUIRED | DONOR-SPECIFIC | REJECT | U4 | No son bounds, anchors ni política de ruta Rubik. |

| Componente | V | I | D | T | L | ΔP |
|---|---|---|---|---|---|---|
| D01-C1 | HIGH | HIGH | READY | LOW | LOW | DOWNGRADE |
| D01-C2 | HIGH | HIGH | PARTIAL | MEDIUM | MEDIUM | KEEP |
| D01-C3 | LOW | LOW | BLOCKED | MEDIUM | MEDIUM | DOWNGRADE |

### D02 — Apertura frontal de sección

**Provenance:** S1 §6; specialization probes; A D02. **Fuente fijada:** F: `03-open-section/engine.js: resolve/place; page.js: mix/stateAt`. **Autoridad Rubik actual:** `js/presentation-section-core.js: derive; js/presentation-story-core.js: sectionOpen` en R. **Legal:** LF.

resolve usa frameH como semialtura y mezcla tangente linealmente; D01/D03 no tienen idéntica interpolación. La sección/aberturas y eje proceden de Rubik. Visitar visualmente una sección no demuestra ruta transitable.

| ID | Componente / tipo | Estado Rubik | Técnica | Disposición | Uso | Rationale / límite de evidencia |
|---|---|---|---|---|---|---|
| D02-C1 | Corte, descriptor y narrativa de sección actuales — PRESENTATION CAPABILITY | ALREADY SOLVED | ALREADY SOLVED | KEEP EXISTING | U1 | Conservar la autoridad integrada; no reconstruir sección para imitar PLAN. |
| D02-C2 | Rectángulo legible separado del punto de fuga — ADAPTER PATTERN | UNVERIFIED | PRINCIPLE ONLY | ADAPT | U3 | Especialización posible sobre región/eje actuales, no sustitución automática de tan log. |
| D02-C3 | PLAN, bandas y tres plantas authored — DONOR-DEMO-ONLY CONCEPT | DECISION REQUIRED | DONOR-SPECIFIC | REJECT | U4 | La casa, calendario scroll y límites mundiales no gobiernan el proyecto. |

| Componente | V | I | D | T | L | ΔP |
|---|---|---|---|---|---|---|
| D02-C1 | HIGH | HIGH | READY | LOW | LOW | DOWNGRADE |
| D02-C2 | HIGH | HIGH | PARTIAL | MEDIUM | MEDIUM | KEEP |
| D02-C3 | LOW | LOW | BLOCKED | HIGH | MEDIUM | DOWNGRADE |

### D03 — Encuadre de fachada

**Provenance:** S1 §7; ACC-02; A D03. **Fuente fijada:** F: `07-sunlit-elevation/engine/elevation.js: camAt/setCam`. **Autoridad Rubik actual:** `js/presentation-elevation-core.js: derive; js/presentation-story-core.js: elevationOpen` en R. **Legal:** LF.

D03 interpola yaw lineal, no shortest-path; no implementa shift en setCam. La comparación 350→10 pasando por 180 es un resultado del donor, no un defecto de Rubik. Exterior y fachada elegible prevalecen.

| ID | Componente / tipo | Estado Rubik | Técnica | Disposición | Uso | Rationale / límite de evidencia |
|---|---|---|---|---|---|---|
| D03-C1 | Frame/lente y fit de fachada Rubik — PRESENTATION CAPABILITY | ALREADY SOLVED | ALREADY SOLVED | KEEP EXISTING | U1 | El host ya deriva esquinas, región, normal y endpoints. |
| D03-C2 | Especialización visual del alzado donor — PRESENTATION VARIANT | UNVERIFIED | PRINCIPLE ONLY | REFERENCE ONLY | U3 | Sirve para contraste; no tercer sistema de cámara. |
| D03-C3 | Runner, claves y yaw largo — DONOR-DEMO-ONLY CONCEPT | DECISION REQUIRED | DONOR-SPECIFIC | REJECT | U4 | No introducir Lenis ni cambiar política de orientación. |

| Componente | V | I | D | T | L | ΔP |
|---|---|---|---|---|---|---|
| D03-C1 | HIGH | HIGH | READY | LOW | LOW | DOWNGRADE |
| D03-C2 | MEDIUM | MEDIUM | PARTIAL | LOW | MEDIUM | KEEP |
| D03-C3 | LOW | LOW | BLOCKED | MEDIUM | MEDIUM | DOWNGRADE |

### D04 — Tinta geométrica y wash

**Provenance:** S1 §8; ACC-03; A D04. **Fuente fijada:** F: `01-exploded-house/core.js: patchFill/patchLine/toneMat/Part`. **Autoridad Rubik actual:** `js/surface-renderer.mjs; index.html: geometría/materiales existentes; Story lifecycle` en R. **Legal:** LF.

toneMat no pasa por patchFill. Edges/hull son representación geométrica, no detector universal de borde en pantalla. Part fusiona atributos y no puede heredarse como tratamiento genérico de GLB/skin/morph.

| ID | Componente / tipo | Estado Rubik | Técnica | Disposición | Uso | Rationale / límite de evidencia |
|---|---|---|---|---|---|---|
| D04-C1 | Aristas y pesos temporales sobre geometría real — ADAPTER PATTERN | UNVERIFIED | PRINCIPLE ONLY | ADAPT | U3 | Gap de adaptación/lectura técnica; D05 es alternativa, no obligación acumulativa. |
| D04-C2 | Wash y aparición coordinados con fill — NARRATIVE STATE/PHASE | UNVERIFIED | PRINCIPLE ONLY | ADAPT | U3 | Materiales autorizados, callbacks y cargas tardías siguen siendo del host. |
| D04-C3 | Batching Part y paleta/casa — DONOR-DEMO-ONLY CONCEPT | DECISION REQUIRED | DONOR-SPECIFIC | REJECT | U4 | No destruir atributos o identidades para conseguir tinta. |

| Componente | V | I | D | T | L | ΔP |
|---|---|---|---|---|---|---|
| D04-C1 | HIGH | HIGH | PARTIAL | HIGH | MEDIUM | KEEP |
| D04-C2 | MEDIUM | HIGH | PARTIAL | HIGH | MEDIUM | KEEP |
| D04-C3 | LOW | LOW | BLOCKED | HIGH | MEDIUM | DOWNGRADE |

### D05 — Buffer técnico y bordes raster

**Provenance:** S1 §9; ACC-04; A D05. **Fuente fijada:** F: `02-section-sweep/draw.js: createDrawing/renderND/compose/INK`. **Autoridad Rubik actual:** `View3D y geometría autorizada; js/presentation-section-core.js` en R. **Legal:** LF.

Un pase empaqueta normal/depth/ID; luego composición y FXAA. No son tres pases de geometría independientes. El signo Z normal se pierde en el layout donor, vidrio se omite y poché consume caras precortadas.

| ID | Componente / tipo | Estado Rubik | Técnica | Disposición | Uso | Rationale / límite de evidencia |
|---|---|---|---|---|---|---|
| D05-C1 | Representación técnica por discontinuidades — ADAPTER PATTERN | UNVERIFIED | PRINCIPLE ONLY | REIMPLEMENT | U3 | Formato, transparencias, clipping y GPU requieren solución compatible con Rubik; sin ganador frente a D04. |
| D05-C2 | Poché como lectura de caras existentes — NARRATIVE STATE/PHASE | UNVERIFIED | PRINCIPLE ONLY | ADAPT | U3 | No convierte IDs en generador de caps. |
| D05-C3 | IDs, profundidad worldZ y casa duplicada authored — DONOR-DEMO-ONLY CONCEPT | DECISION REQUIRED | DONOR-SPECIFIC | REJECT | U4 | No nueva geometría autoritativa ni catálogo semántico por números de demo. |

| Componente | V | I | D | T | L | ΔP |
|---|---|---|---|---|---|---|
| D05-C1 | HIGH | HIGH | PARTIAL | HIGH | MEDIUM | KEEP |
| D05-C2 | HIGH | HIGH | PARTIAL | MEDIUM | MEDIUM | KEEP |
| D05-C3 | LOW | LOW | BLOCKED | HIGH | MEDIUM | DOWNGRADE |

### D06 — Caps, color y notas de sección

**Provenance:** S1 §10; ACC-05/06; A D06. **Fuente fijada:** F: `03-open-section/engine.js: updateCaps/withColour/notes`. **Autoridad Rubik actual:** `js/presentation-section-core.js; index.html: begin/apply/endSection` en R. **Legal:** LF.

Los caps donor se basan en extrusiones de sección constante y rangos de profundidad, no CSG universal. withColour es una función flecha; su peso por vértice no equivale a máscara por fragmento.

| ID | Componente / tipo | Estado Rubik | Técnica | Disposición | Uso | Rationale / límite de evidencia |
|---|---|---|---|---|---|---|
| D06-C1 | Descriptor/caps reales del subconjunto soportado — PRESENTATION CAPABILITY | ALREADY SOLVED | ALREADY SOLVED | KEEP EXISTING | U1 | Conservar huecos/topología derivada; no prometer cobertura universal o de todos los niveles. |
| D06-C2 | Cache topológica, estilo y notas con fuente — ADAPTER PATTERN | UNVERIFIED | PRINCIPLE ONLY | ADAPT | U3 | Notas/cotas proceden de datos reales y se omiten si no hay autoridad. |
| D06-C3 | Solver universal y cotas de la casa — DONOR-DEMO-ONLY CONCEPT | DECISION REQUIRED | DONOR-SPECIFIC | REJECT | U4 | La técnica del donor no demuestra caps de mallas arbitrarias. |

| Componente | V | I | D | T | L | ΔP |
|---|---|---|---|---|---|---|
| D06-C1 | HIGH | HIGH | READY | LOW | LOW | KEEP |
| D06-C2 | HIGH | HIGH | PARTIAL | MEDIUM | MEDIUM | KEEP |
| D06-C3 | LOW | LOW | BLOCKED | HIGH | MEDIUM | DOWNGRADE |

### D07 — Sombra técnica y material

**Provenance:** S1 §11; A D07. **Fuente fijada:** F: `07-sunlit-elevation/engine/elevation.js: mat/GLSL_COMMON/setSun`. **Autoridad Rubik actual:** `js/presentation-elevation-core.js; View3D luz/sombras; Solar opcional` en R. **Legal:** LF.

Hatch filtrado consume la máscara de sombra; la mezcla técnica/material y el posterior cambio de sol son responsabilidades distintas. Normales e instancias del donor no garantizan transformación correcta para cualquier mesh Rubik.

| ID | Componente / tipo | Estado Rubik | Técnica | Disposición | Uso | Rationale / límite de evidencia |
|---|---|---|---|---|---|---|
| D07-C1 | Hatch filtrado ligado a sombra coherente — NARRATIVE STATE/PHASE | UNVERIFIED | PRINCIPLE ONLY | ADAPT | U3 | No convertir vector gráfico en fecha Solar. |
| D07-C2 | Propiedad de luz, material y snapshot Solar — PRESENTATION CAPABILITY | ALREADY SOLVED | ALREADY SOLVED | KEEP EXISTING | U1 | Preservar controles existentes; uso visual específico sigue condicionado. |
| D07-C3 | AO por posiciones, normales y setSun de casa — DONOR-DEMO-ONLY CONCEPT | DECISION REQUIRED | DONOR-SPECIFIC | REJECT | U4 | No copiar biblioteca de materiales ni asumir máscara de una sola luz. |

| Componente | V | I | D | T | L | ΔP |
|---|---|---|---|---|---|---|
| D07-C1 | HIGH | HIGH | PARTIAL | HIGH | MEDIUM | KEEP |
| D07-C2 | HIGH | HIGH | READY | LOW | LOW | KEEP |
| D07-C3 | LOW | LOW | BLOCKED | HIGH | MEDIUM | DOWNGRADE |

### D08 — Frente espacial de materialización

**Provenance:** S1 §12; ACC-01/06/07; A D08. **Fuente fijada:** F: `02-section-sweep/main.js: forwardScanX/story/update; draw.js: compose`. **Autoridad Rubik actual:** `Story absoluto; View3D representación; materiales autorizados` en R. **Legal:** LF.

scanX es campo de estado, no función. El compositor mantiene dibujo a la izquierda y material a la derecha; la curva contiene discontinuidades/derivadas de cierre específicas, pese al comentario C1. No sustituir una primitiva general por esa curva.

| ID | Componente / tipo | Estado Rubik | Técnica | Disposición | Uso | Rationale / límite de evidencia |
|---|---|---|---|---|---|---|
| D08-C1 | Máscara, polaridad y suavidad espacial — NARRATIVE STATE/PHASE | UNVERIFIED | PRINCIPLE ONLY | ADAPT | U3 | Progreso absoluto y marco coherente; concepto compartido, no cuatro sistemas de sweep. |
| D08-C2 | Consumo de cámara/visibilidad existentes — ADAPTER PATTERN | ALREADY SOLVED | ALREADY SOLVED | KEEP EXISTING | U1 | Una sola Story y verdad geométrica; no máscara que replantee rutas. |
| D08-C3 | Curva, sentinelas y fondo ficticio — DONOR-DEMO-ONLY CONCEPT | DECISION REQUIRED | DONOR-SPECIFIC | REJECT | U4 | Fondo por rayo a plano inventado no es territorio. |

| Componente | V | I | D | T | L | ΔP |
|---|---|---|---|---|---|---|
| D08-C1 | HIGH | HIGH | PARTIAL | HIGH | MEDIUM | KEEP |
| D08-C2 | HIGH | HIGH | READY | MEDIUM | LOW | KEEP |
| D08-C3 | LOW | LOW | BLOCKED | HIGH | MEDIUM | DOWNGRADE |

### D09 — Floor by Floor

**Provenance:** S2 §22/27/31; P5; B5; A D09. **Fuente fijada:** F: `01-exploded-house/dir-c.js: update/LAND/GAP`. **Autoridad Rubik actual:** `js/presentation-axon-core.js: derive/separation; js/presentation-story-core.js: axonOpen/explodedLevelsOpen; index.html: begin/apply/endAxon` en R. **Legal:** LF.

S2 describía FT3D-5 pendiente sin leer WIP. Hoy hay descriptor, deltas absolutos, handles frescos, losa activa, globals y recomposición integrados. El resultado histórico no era erróneo. El donor tiene cinco plantas más cubierta; Rubik admite dos niveles.

| ID | Componente / tipo | Estado Rubik | Técnica | Disposición | Uso | Rationale / límite de evidencia |
|---|---|---|---|---|---|---|
| D09-C1 | Axon compacto y separación vertical absoluta — PRESENTATION CAPABILITY | ALREADY SOLVED | ALREADY SOLVED | KEEP EXISTING | U2 | SUPERSEDED_BY_PRODUCT_EVOLUTION: no reconstruir FT3D-5 ni heredar GAP donor. |
| D09-C2 | Entrada, holds, recomposición y restauración — NARRATIVE STATE/PHASE | ALREADY SOLVED | ALREADY SOLVED | KEEP EXISTING | U2 | B5 prueba el código a bf3e5ca; paridad visual de variantes futuras no se infiere. |
| D09-C3 | Core estirado, ciudad, seis grupos y visita interior — DONOR-DEMO-ONLY CONCEPT | DECISION REQUIRED | DONOR-SPECIFIC | REJECT | U4 | No conectores deformados ni anchor/ruta invented tras separación. |
| D09-C4 | Handoff automático general hacia room/route — ADAPTER PATTERN | UNVERIFIED | DECISION REQUIRED | UNRESOLVED | U3 | Integración F5 no demuestra este flujo nuevo; no se añade por parecido. |

| Componente | V | I | D | T | L | ΔP |
|---|---|---|---|---|---|---|
| D09-C1 | HIGH | HIGH | READY | MEDIUM | LOW | DOWNGRADE |
| D09-C2 | HIGH | HIGH | READY | MEDIUM | LOW | KEEP |
| D09-C3 | LOW | LOW | BLOCKED | HIGH | MEDIUM | DOWNGRADE |
| D09-C4 | HIGH | MEDIUM | UNVERIFIED | HIGH | LOW | UNRESOLVED |

### D10 — The Board

**Provenance:** S2 §23/27; C2-CC1; A D10. **Fuente fijada:** F: `01-exploded-house/dir-a.js: layer/LIFT/PULL/ORDER/update`. **Autoridad Rubik actual:** `Building/Project/geometría; FT3D-5 como caso especializado, no clasificador de grupos` en R. **Legal:** LF.

Seis capas authored con pertenencia conocida por el autor; no nueve capas descubiertas. Lift y pull no constituyen secuencia de obra. No asumir lease general por existir binding especializado de FT3D-5.

| ID | Componente / tipo | Estado Rubik | Técnica | Disposición | Uso | Rationale / límite de evidencia |
|---|---|---|---|---|---|---|
| D10-C1 | Lift/pull absoluto de grupos demostrables — PRESENTATION CAPABILITY | DECISION REQUIRED | PRINCIPLE ONLY | ADAPT | U3 | Requiere pertenencia/normal/owners reales; Board no equivale al despiece por plantas. |
| D10-C2 | Callouts que siguen matrices reales — ADAPTER PATTERN | UNVERIFIED | PRINCIPLE ONLY | ADAPT | U3 | Anchors no crean medidas ni estructura. |
| D10-C3 | Rafters, capas estructurales y montaje authored — DONOR-DEMO-ONLY CONCEPT | DECISION REQUIRED | DONOR-SPECIFIC | REJECT | U4 | No inferir build-up desde material, nombre o geometría. |

| Componente | V | I | D | T | L | ΔP |
|---|---|---|---|---|---|---|
| D10-C1 | HIGH | HIGH | PARTIAL | HIGH | MEDIUM | KEEP |
| D10-C2 | MEDIUM | HIGH | PARTIAL | MEDIUM | MEDIUM | KEEP |
| D10-C3 | LOW | MEDIUM | BLOCKED | HIGH | MEDIUM | DEFER |

### D11 — Unfolded Room

**Provenance:** S2 §24/27; C2-CC2; A D11. **Fuente fijada:** F: `01-exploded-house/dir-b.js: wall/FOLD/GROW/update/decal/drawSheet`. **Autoridad Rubik actual:** `Room/wall/opening IDs; geometría y superficies; lifecycle existente` en R. **Legal:** LF.

Cocina rectangular authored, bisagras por arista y lid hijo del panel norte. attach/decal pertenece a la representación de demo. Ninguna prueba demuestra auto-unfold de habitaciones arbitrarias ni cotas derivadas.

| ID | Componente / tipo | Estado Rubik | Técnica | Disposición | Uso | Rationale / límite de evidencia |
|---|---|---|---|---|---|---|
| D11-C1 | Caras, aristas y bisagras con topología probada — PRESENTATION CAPABILITY | DECISION REQUIRED | PRINCIPLE ONLY | REIMPLEMENT | U3 | Asociación cara/muro/hueco y ownership necesitan decisión/subconjunto demostrado. |
| D11-C2 | Anchor y overlay ligados a superficie temporal — ADAPTER PATTERN | UNVERIFIED | PRINCIPLE ONLY | ADAPT | U3 | Sin reparenting arbitrario de originales o doble transformación. |
| D11-C3 | Net rectangular, cotas, norte y schedule manual — DONOR-DEMO-ONLY CONCEPT | DECISION REQUIRED | DONOR-SPECIFIC | REJECT | U4 | No convertir hoja authored en plano técnico de otra estancia. |

| Componente | V | I | D | T | L | ΔP |
|---|---|---|---|---|---|---|
| D11-C1 | HIGH | HIGH | BLOCKED | HIGH | MEDIUM | DEFER |
| D11-C2 | MEDIUM | HIGH | PARTIAL | HIGH | MEDIUM | KEEP |
| D11-C3 | LOW | MEDIUM | BLOCKED | HIGH | MEDIUM | DOWNGRADE |

### D12 — Orientación, radar y seek

**Provenance:** S2 §25; C2-CC4/06; A D12. **Fuente fijada:** F: `01/main.js: jumpToP; 02/main.js: jumpToStop; 03/page.js: getRadarKey; 07/engine/elevation.js: run; 05/view.js: setTargetWeek`. **Autoridad Rubik actual:** `js/presentation-core.js: minimap; js/presentation-ui.js: go/seekStory; PresentationPlan` en R. **Legal:** LF.

01/07 SVG, 02 sección XY, 03 inset 3D, 05 tabs/scrub: no un subsistema homogéneo. En 03 un nodo DOM oculto no acredita acceso móvil; defaults07 y overrides activos difieren. Seek no es planificación de ruta.

| ID | Componente / tipo | Estado Rubik | Técnica | Disposición | Uso | Rationale / límite de evidencia |
|---|---|---|---|---|---|---|
| D12-C1 | Minimap, IDs y transporte del host — PRESENTATION CAPABILITY | ALREADY SOLVED | ALREADY SOLVED | KEEP EXISTING | U1 | Preservar controles, semántica y foco; no segunda navegación. |
| D12-C2 | Cue gráfico o comparación inset — PRESENTATION VARIANT | UNVERIFIED | PRINCIPLE ONLY | REFERENCE ONLY | U3 | Utilidad no probada; counting DOM no demuestra accesibilidad. |
| D12-C3 | Saltos por etiqueta/scroll y coordenadas de demo — DONOR-DEMO-ONLY CONCEPT | DECISION REQUIRED | DONOR-SPECIFIC | REJECT | U4 | No convierten texto en roomId/entry/route. |

| Componente | V | I | D | T | L | ΔP |
|---|---|---|---|---|---|---|
| D12-C1 | HIGH | HIGH | READY | LOW | LOW | DOWNGRADE |
| D12-C2 | MEDIUM | MEDIUM | PARTIAL | MEDIUM | MEDIUM | KEEP |
| D12-C3 | LOW | LOW | BLOCKED | HIGH | MEDIUM | DOWNGRADE |

### D13 — Coreografía y relevo con ruta

**Provenance:** S2 §26/27; C2-CC3/05; A D13. **Fuente fijada:** F: `02/main.js: walkKeys/buildWalk/walkPose/__checkPath; 05/view.js: sampleTourSpline/applyCamera`. **Autoridad Rubik actual:** `js/presentation-route.js: plan/choreography; View3D.presentationRoute` en R. **Legal:** LF.

02 sí tiene diagnóstico de colisión opt-in, con 0 hits reportados en su escena; no es planner ni gate del recorrido normal. Splines muestran overshoot en probes. Endpoints válidos no garantizan camino válido.

| ID | Componente / tipo | Estado Rubik | Técnica | Disposición | Uso | Rationale / límite de evidencia |
|---|---|---|---|---|---|---|
| D13-C1 | Autoridad de room/entry y ruta validada — PRESENTATION CAPABILITY | ALREADY SOLVED | ALREADY SOLVED | KEEP EXISTING | U1 | Route authority ≠ camera choreography; preservar fallback explícito. |
| D13-C2 | Pacing y mirada sobre ruta ya válida — ADAPTER PATTERN | UNVERIFIED | PRINCIPLE ONLY | ADAPT | U3 | El host ya tiene pacing; una mejora perceptiva no está demostrada. |
| D13-C3 | Spline authored, smoothing histórico y checker como planner — DONOR-DEMO-ONLY CONCEPT | DECISION REQUIRED | DONOR-SPECIFIC | REJECT | U4 | Si cambia trayectoria, su validez debe volver a demostrarse, no confiar en control points. |

| Componente | V | I | D | T | L | ΔP |
|---|---|---|---|---|---|---|
| D13-C1 | HIGH | HIGH | READY | LOW | LOW | KEEP |
| D13-C2 | HIGH | HIGH | PARTIAL | MEDIUM | MEDIUM | KEEP |
| D13-C3 | LOW | HIGH | BLOCKED | HIGH | MEDIUM | DOWNGRADE |

### D14 — Card Model: escala perceptiva y composición

**Provenance:** S3 D14 y dependencias; A D14. **Fuente fijada:** F: `06-card-model/js/page.js: makeShot/measurePath/pathU; desk.js: cardHouse/contourLayers/deskProps; real.js: tiny`. **Autoridad Rubik actual:** `Story planReveal/roomDescent; overviewPose/viewRegion; Project unidades` en R. **Legal:** LF.

La maqueta principal no se obtiene mediante escala global .01. Un objeto secundario tiny sí usa .01. Soporte, tamaños relativos, lente y enfoque construyen la lectura de miniatura. Conservar la distinción por objeto.

| ID | Componente / tipo | Estado Rubik | Técnica | Disposición | Uso | Rationale / límite de evidencia |
|---|---|---|---|---|---|---|
| D14-C1 | Framing, perspectiva y descenso existentes — PRESENTATION CAPABILITY | ALREADY SOLVED | ALREADY SOLVED | KEEP EXISTING | U1 | El gap no es un sistema general de escala. |
| D14-C2 | Soporte temporal y composición de maqueta — PRESENTATION VARIANT | DECISION REQUIRED | PRINCIPLE ONLY | ADAPT | U3 | Representación derivada de bounds; no terreno/losa real. |
| D14-C3 | Distribución del descenso por cambio de escala — ADAPTER PATTERN | UNVERIFIED | PRINCIPLE ONLY | REFERENCE ONLY | U3 | Conservar solo como comparación; beneficio frente a Story no probado. |
| D14-C4 | Escritorio, global .01 o traslación Y arbitraria — DONOR-DEMO-ONLY CONCEPT | DECISION REQUIRED | DONOR-SPECIFIC | REJECT | U4 | La hipótesis de escala global está refutada por S3; no es corrección del proyecto. |

| Componente | V | I | D | T | L | ΔP |
|---|---|---|---|---|---|---|
| D14-C1 | HIGH | HIGH | READY | LOW | LOW | DOWNGRADE |
| D14-C2 | MEDIUM | HIGH | PARTIAL | MEDIUM | MEDIUM | KEEP |
| D14-C3 | MEDIUM | MEDIUM | PARTIAL | MEDIUM | MEDIUM | UNRESOLVED |
| D14-C4 | LOW | MEDIUM | BLOCKED | HIGH | MEDIUM | DOWNGRADE |

### D15 — Frente esférico y separación de luz

**Provenance:** S3 D15; A D15. **Fuente fijada:** F: `06-card-model/js/sweep.js: sweepMaterial/sweepSide/DEPTH; page.js: SWEEP.C/R`. **Autoridad Rubik actual:** `View3D luces/PMREM/HDR; presentationReveal; Story y materiales autorizados` en R. **Legal:** LF.

Centro fijo, radio/banda animados: no lámpara móvil u orbital. Color añadido y separación de contribución lumínica son distintos. Compresión lejana/índices de luz son ajustes de demo.

| ID | Componente / tipo | Estado Rubik | Técnica | Disposición | Uso | Rationale / límite de evidencia |
|---|---|---|---|---|---|---|
| D15-C1 | Campo de distancia y banda espacial — NARRATIVE STATE/PHASE | UNVERIFIED | PRINCIPLE ONLY | ADAPT | U3 | Mask/shadow/material coherentes; no nueva cámara o player. |
| D15-C2 | Separación de contribuciones y sombras — ADAPTER PATTERN | UNVERIFIED | PRINCIPLE ONLY | REIMPLEMENT | U3 | Solo si coexistencia de representaciones lo requiere; compilación GPU no probada. |
| D15-C3 | Índices fijos, dos mundos y compresión de distancia — DONOR-DEMO-ONLY CONCEPT | DECISION REQUIRED | DONOR-SPECIFIC | REJECT | U4 | No requisito de Solar ni evidencia de luz orbitante. |

| Componente | V | I | D | T | L | ΔP |
|---|---|---|---|---|---|---|
| D15-C1 | MEDIUM | HIGH | PARTIAL | HIGH | MEDIUM | KEEP |
| D15-C2 | MEDIUM | HIGH | PARTIAL | HIGH | MEDIUM | UNRESOLVED |
| D15-C3 | LOW | LOW | BLOCKED | HIGH | MEDIUM | DOWNGRADE |

### D16 — Tiempo por elemento

**Provenance:** S4 D16/authority map; A D16. **Fuente fijada:** F: `04-build-time-lapse/js/world.js: stamp/weekly/partWeeks/bucketsOf; programme.js: PROG/TILES`. **Autoridad Rubik actual:** `Story; Project/Building; C1–C4 separados` en R. **Legal:** LF.

aWeek/aOut y uniform semana gobiernan visibilidad. Las 38 semanas y fórmulas espaciales son authored; el loader no representa avance de obra. Sin autoridad profesional de secuencia/dependencias demostrada.

| ID | Componente / tipo | Estado Rubik | Técnica | Disposición | Uso | Rationale / límite de evidencia |
|---|---|---|---|---|---|---|
| D16-C1 | Evaluación de aparición/retirada desde tiempo — NARRATIVE STATE/PHASE | DECISION REQUIRED | PRINCIPLE ONLY | ADAPT | U3 | Presentación derivada posible; no añade fechas al proyecto. |
| D16-C2 | Plan, pertenencia, fechas y ejecución durables — FUTURE DOMAIN CONCEPT | DECISION REQUIRED | DECISION REQUIRED | DEFER | U4 | FT3D-8, decisión contractual separada; Story no es planificador. |
| D16-C3 | 38 semanas y orden por coordenadas — DONOR-DEMO-ONLY CONCEPT | DECISION REQUIRED | DONOR-SPECIFIC | REJECT | U4 | No duración profesional ni dato de la obra real. |

| Componente | V | I | D | T | L | ΔP |
|---|---|---|---|---|---|---|
| D16-C1 | HIGH | HIGH | PARTIAL | HIGH | MEDIUM | DEFER |
| D16-C2 | HIGH | MEDIUM | BLOCKED | HIGH | LOW | DEFER |
| D16-C3 | LOW | MEDIUM | BLOCKED | HIGH | MEDIUM | DOWNGRADE |

### D17 — Varias vistas, mismo modelo y tiempos

**Provenance:** S4 D17; A D17. **Fuente fijada:** F: `04-build-time-lapse/js/pipe.js: aim/useSet/makePipe/P.draw`. **Autoridad Rubik actual:** `Building fuentes/IDs; View3D; estado temporal derivado` en R. **Legal:** LF.

Una escena compartida y hasta seis rectángulos con tiempos/cámaras propios. D17 consume D16; no crea modelo constructivo ni seis proyectos.

| ID | Componente / tipo | Estado Rubik | Técnica | Disposición | Uso | Rationale / límite de evidencia |
|---|---|---|---|---|---|---|
| D17-C1 | Comparación multivista de estados reales — PRESENTATION VARIANT | DECISION REQUIRED | PRINCIPLE ONLY | ADAPT | U3 | Aislamiento de uniform/material/pass y revisión consistente. |
| D17-C2 | Dominio constructivo propio de D17 — FUTURE DOMAIN CONCEPT | DECISION REQUIRED | DONOR-SPECIFIC | REJECT | U4 | La atribución de dominio propio no está respaldada; la vista es derivada. |
| D17-C3 | Seis tiles y pipeline fijo — DONOR-DEMO-ONLY CONCEPT | DECISION REQUIRED | DONOR-SPECIFIC | REFERENCE ONLY | U4 | No importar presupuesto GPU ni composición fija. |

| Componente | V | I | D | T | L | ΔP |
|---|---|---|---|---|---|---|
| D17-C1 | MEDIUM | HIGH | PARTIAL | HIGH | MEDIUM | DEFER |
| D17-C2 | LOW | LOW | BLOCKED | HIGH | LOW | DOWNGRADE |
| D17-C3 | LOW | MEDIUM | PARTIAL | HIGH | MEDIUM | DEFER |

### D18 — Programa y 3D sincronizados

**Provenance:** S4 D18/Story matrix; A D18. **Fuente fijada:** F: `05-schedule-build/house.js: PHASES/add/update/dateAt; view.js: programmeSVG/setTargetWeek`. **Autoridad Rubik actual:** `Story transporte; C1 cantidades; C2 Budget; C3 BC3/precios; C4 dossier` en R. **Legal:** LF.

Tabla estática de diez fases/14 semanas, pertenencia manual y cursor compartido. Flechas entre filas no demuestran grafo; CRITICAL PATH no prueba CPM. Calendario simplificado no acredita recursos, ejecución, caja ni certificación.

| ID | Componente / tipo | Estado Rubik | Técnica | Disposición | Uso | Rationale / límite de evidencia |
|---|---|---|---|---|---|---|
| D18-C1 | Gantt y 3D consumen mismo cursor — PRESENTATION VARIANT | DECISION REQUIRED | PRINCIPLE ONLY | ADAPT | U3 | Representación de autoridad suministrada; no otra timeline autónoma. |
| D18-C2 | Calendario/dependencias/avance profesional — FUTURE DOMAIN CONCEPT | DECISION REQUIRED | DECISION REQUIRED | DEFER | U4 | MODEL D HYBRID; dominio durable requiere decisión, no schema aquí. |
| D18-C3 | Cantidades y cálculo económico existentes — ADAPTER PATTERN | ALREADY SOLVED | ALREADY SOLVED | KEEP EXISTING | U1 | C1–C4 son autoridades; vínculo a paquetes no se presupone. |
| D18-C4 | WBS/fechas demo, CPM implícito y porcentaje × coste — DONOR-DEMO-ONLY CONCEPT | DECISION REQUIRED | DONOR-SPECIFIC | REJECT | U4 | No convertir tiempo transcurrido en ejecución o certificación. |

| Componente | V | I | D | T | L | ΔP |
|---|---|---|---|---|---|---|
| D18-C1 | HIGH | HIGH | PARTIAL | HIGH | MEDIUM | DEFER |
| D18-C2 | HIGH | MEDIUM | BLOCKED | HIGH | LOW | DEFER |
| D18-C3 | HIGH | MEDIUM | READY | LOW | LOW | KEEP |
| D18-C4 | LOW | MEDIUM | BLOCKED | HIGH | MEDIUM | DOWNGRADE |

### D19 — Detalle y profundidad de presentación

**Provenance:** S3 D19; S6 §4–5; A D19. **Fuente fijada:** F: `07-sunlit-elevation/c-the-face/page.js: relief/RAKE; engine/elevation.js: house/mat; 06/desk.js: withCore`. **Autoridad Rubik actual:** `View3D buildArch/wallBox/furniture; surface-renderer.mjs; PMREM/HDR/sombras` en R. **Legal:** LF.

07/C relieve geométrico y luz rasante; withCore es shading de canto, no tres capas geométricas. Rubik ya contiene volumen/mapas/sombras; calidad base/enhanced y carga efectiva condicionan el resultado. No evidencia de necesidad de reescribir renderer.

| ID | Componente / tipo | Estado Rubik | Técnica | Disposición | Uso | Rationale / límite de evidencia |
|---|---|---|---|---|---|---|
| D19-C1 | Geometría primaria, superficies y entorno existentes — PRESENTATION CAPABILITY | ALREADY SOLVED | ALREADY SOLVED | KEEP EXISTING | U1 | Infraestructura funcional presente; eficacia visual por fixture UNVERIFIED. |
| D19-C2 | Coordinación cámara/luz/material y detalle con fuente — ADAPTER PATTERN | UNVERIFIED | PRINCIPLE ONLY | ADAPT | U3 | Requiere evidencia comparable, no inferir relieve desde apariencia. |
| D19-C3 | Ladrillo 60 mm, clearcoat/postFX universal o renderer nuevo — DONOR-DEMO-ONLY CONCEPT | DECISION REQUIRED | DONOR-SPECIFIC | REJECT | U4 | Complejidad decorativa no es verdad constructiva ni receta universal. |

| Componente | V | I | D | T | L | ΔP |
|---|---|---|---|---|---|---|
| D19-C1 | HIGH | HIGH | READY | LOW | LOW | KEEP |
| D19-C2 | HIGH | HIGH | PARTIAL | MEDIUM | MEDIUM | KEEP |
| D19-C3 | LOW | MEDIUM | BLOCKED | HIGH | MEDIUM | DOWNGRADE |

### D20 — QA y pulido visual

**Provenance:** S5 D20/E01–E12; S6 §§3–5/7–11. **Fuente fijada:** L/LL: `Lintel brief-code-house/brief-iteration-9; tools/review_stills.py/flicker.mjs/look_numbers.py`. **Autoridad Rubik actual:** `scripts/qa/render-presentation-axon.cjs; tests/presentation-axon*.cjs; contrato P5 §38` en R. **Legal:** LL.

Método de comparación, defectos acotados, re-render y aprobación; scripts y shaders Lintel reference-only. Ratio flicker no es métrica universal. Hay bloom/HDR; una sola pasada en bucle maxPass frente a comentario de rebotes. E05 contiene loader y no es still final válido.

| ID | Componente / tipo | Estado Rubik | Técnica | Disposición | Uso | Rationale / límite de evidencia |
|---|---|---|---|---|---|---|
| D20-C1 | Comparación controlada y pulido con revisión — QA METHODOLOGY | UNVERIFIED | PRINCIPLE ONLY | REFERENCE ONLY | U3 | El método se describe independientemente; no copia de herramientas Lintel. |
| D20-C2 | Generación Rubik de artefactos/manifiestos — QA METHODOLOGY | UNVERIFIED | ALREADY SOLVED | KEEP EXISTING | U1 | Scripts integrados; generar no prueba revisión ni aprobación. |
| D20-C3 | Aceptación visual y seis niveles de uso — QA METHODOLOGY | UNVERIFIED | DECISION REQUIRED | ADAPT | U3 | Aplica gates distintos; no resolver por presencia de API o CI verde. |
| D20-C4 | Código, activos, shaders y receta Lintel — DONOR-DEMO-ONLY CONCEPT | DECISION REQUIRED | DONOR-SPECIFIC | REJECT | U4 | Sin licencia reutilizable acreditada; no copiar. |

| Componente | V | I | D | T | L | ΔP |
|---|---|---|---|---|---|---|
| D20-C1 | HIGH | HIGH | PARTIAL | MEDIUM | LOW | KEEP |
| D20-C2 | HIGH | HIGH | READY | LOW | LOW | KEEP |
| D20-C3 | HIGH | HIGH | PARTIAL | MEDIUM | LOW | KEEP |
| D20-C4 | LOW | MEDIUM | BLOCKED | HIGH | HIGH | DOWNGRADE |

### D21 — REA: evidencia e ingeniería inversa

**Provenance:** S5 D21; S6 §6/11. **Fuente fijada:** REA: `REA src/browser/CdpBrowserProvider.ts; assets/PublishWebScripts.ts; execution/CdpExecutionCapture.ts`. **Autoridad Rubik actual:** `Workspace externo de investigación; no dependencia de runtime Rubik` en R. **Legal:** LR.

Captura pasiva no prueba ejecución; cobertura explícita V8 es distinta, reinicia contadores y altera optimización. Export retiene bytes/hash/limitaciones; no reconstruye imports faltantes ni concede derechos. Local no implica cero exposición al agente/proveedor.

| ID | Componente / tipo | Estado Rubik | Técnica | Disposición | Uso | Rationale / límite de evidencia |
|---|---|---|---|---|---|---|
| D21-C1 | Captura y exportación con procedencia — RESEARCH TOOLING | DECISION REQUIRED | DIRECT | REFERENCE ONLY | U3 | Herramienta opcional según pregunta; no operación ejecutada en este informe. |
| D21-C2 | Cobertura de ejecución y límites de observación — RESEARCH TOOLING | UNVERIFIED | DIRECT | REFERENCE ONLY | U3 | Capacidad SOURCE-CONFIRMED; disponibilidad/proveedor runtime no acreditados. |
| D21-C3 | Flujo independiente y tratamiento privado — QA METHODOLOGY | DECISION REQUIRED | PRINCIPLE ONLY | ADAPT | U3 | Red/retención/salida dependen de operación y agente; no garantía universal clean-room. |
| D21-C4 | REA dentro de producto o como permiso de copia — DONOR-DEMO-ONLY CONCEPT | DECISION REQUIRED | DONOR-SPECIFIC | REJECT | U4 | No introducir dependencia runtime ni blanquear licencias de código capturado. |

| Componente | V | I | D | T | L | ΔP |
|---|---|---|---|---|---|---|
| D21-C1 | MEDIUM | LOW | PARTIAL | LOW | MEDIUM | KEEP |
| D21-C2 | MEDIUM | LOW | UNVERIFIED | MEDIUM | MEDIUM | KEEP |
| D21-C3 | HIGH | LOW | PARTIAL | MEDIUM | MEDIUM | KEEP |
| D21-C4 | LOW | LOW | BLOCKED | HIGH | HIGH | DOWNGRADE |

## 3. Evolución de producto: 5f4e3d20 → 18848fbf

| Área / conclusión histórica | Estado actual comprobado | Acción / alcance |
|---|---|---|
| S1/S2: axon/exploded WIP, final HEAD pendiente | P5 y runtime integrados en R | SUPERSEDED_BY_PRODUCT_EVOLUTION; no error histórico |
| Descriptor y agrupación por niveles | `js/presentation-axon-core.js: derive/separation`, IDs/offsets/elevaciones/bounds/excluded; compacto y vertical-levels | GR-D09-01; no Board/unfolding automático |
| Evaluación y cámara | Story `axonOpen/explodedLevelsOpen`, deltas absolutos y fit regional | GR-D09-02; no segundo Story |
| Binding y restore | `index.html: axonCapture/axonHandles/beginAxon/applyAxon/endAxon` | Handles frescos tras sync, losa activa, globals, rollback y bases, sin reparenting; no lease general demostrado |
| Holds móvil | `bf3e5ca…` diferencia región parada y región tarjeta | GR-QA-02; extremos p0/p1 y hold no comparten necesariamente región |
| QA | Nuevos tests puros/browser y script axon con manifiesto | Generación/ejercicio/aceptación no se fusionan |
| Board/unfolded/temporal | No aparecen como nuevas capacidades en el delta auditado | No se declaran cerradas por FT3D-5 |
| Geometría, rutas, cantidades, Budget y fuentes | Delta productivo no cambia sus módulos | Autoridades preservadas; no auditoría nueva de todos sus casos |
| Dependencias premium I2/I3 | No se demuestran integradas por el mero despiece | PRESENT BUT UNDER-EVIDENCED / MISSING ADAPTATION según componente |

Comparación Git exacta 5f4e3d20… → R: **10 archivos**, +2650/−26: dos documentos P5, `index.html`, axon-core nuevo, story-core, presentation-ui, script QA axon, tests axon puro/browser y ajuste de test Story. No afirmar actualización general del renderer, providers o dominio.

### 3.1 Atribución obligatoria de las pruebas

**FT3D-5 code was tested at bf3e5ca5c8df1f6bc2bd61925a0a1456b2d1353d; that code was subsequently reconciled into and integrated through 18848fbf3308ef8c2c8841edf626221f74922d23.**

El control explícito del usuario atribuye **710 PASS / 0 FAIL / 2 SKIP a bf3e5ca…**. Este informe no ejecuta esa suite ni dispone de un nuevo resultado a R. Git confirma padres R = bf3e5ca… + 5f4e3d20… y delta bf3e5ca… → R únicamente `videos/proyecto-floor-plan-3d.mp4` (91.650.280 bytes); no delta de código. La verificación estructural y Vercel success tras integración están reportados por la autorización, no comprobados de nuevo aquí. **No se atribuye un run de 710 tests a master@R.**

La equivalencia de código explica la continuidad del hallazgo funcional; no cambia el SHA del run ni produce un resultado nuevo. Tampoco transforma CI verde en aceptación visual. No se reabre FT3D-5 ni se añaden gates retroactivos a V2.

## 4. Autoridades que se conservan y uso que sigue sin acreditarse

| Responsabilidad | Ya resuelta / autoridad a conservar | Disponible o conectada sin demostrar eficacia completa | No reconstruir |
|---|---|---|---|
| Verdad y unidades | Project/Building/Core.geometry, mm y marco activo | Detalle secundario no expresado por datos | Casa/scene graph autoritativo donante |
| Encuadre y descenso | roomFrame, overviewPose, Story planReveal/roomDescent | Nuevas especializaciones ópticas/escenografía | Cámara/player paralelos |
| Sección/fachada | Descriptores, Exterior, planos/huecos/anchors existentes | Nueva tinta, hatch, poché o representación coordinada | Solver donor como autoridad |
| Despiece por plantas | P5 integrado, no persistente, dos niveles, recomposición | Utilidad de sus handles para otros efectos UNVERIFIED | Otro exploder genérico por semejanza |
| Ruta | Room/entry válidos, plan(), choreography/fallback | Mejora perceptiva de pacing donor UNVERIFIED | Splines/labels como planner |
| Material/luz | SurfaceRenderer, mapas condicionados, PMREM/HDR, sombras, presets/Solar | Un preset/mapa presente no acredita activación/carga/efecto en una captura | Catálogo o motor de luz duplicados |
| Cantidades/economía | C1/C2/C3/C4, cero ≠ ausente | Asociación a paquetes/tiempo no proporcionada automáticamente | Segundo cálculo de cantidades/precio/presupuesto |
| Evidencia | Scripts, tests, manifiestos y salidas existentes | Paquete visual final revisado y aceptación estética de cada variante | Otra infraestructura por ignorar la actual |

**AVAILABLE BUT UNUSED** y **ACTIVE BUT UNDERUSED** no quedan globalmente probados: S3/S6 formulan oportunidad/hipótesis, no un benchmark controlado. El uso efectivo de mapas enhanced y HDR es por fixture/ruta/preset. “Ya existe” describe una responsabilidad concreta; no significa “todo acabado está aprobado”.

## 5. Gaps legítimos, sin cola de trabajo

| ID de hallazgo | Componentes | Clase del gap | Alcance / lo que no se afirma |
|---|---|---|---|
| GR-D01-01 | D01-C2, D02-C2 | MISSING ADAPTATION | Especialización regional/punto de fuga; cámara general ya existe |
| GR-D04-01 | D04-C1/C2, D05-C1 | MISSING ADAPTATION | Representación técnica compatible; backend final UNRESOLVED, sin selección |
| GR-D06-01 | D06-C2, D07-C1, D08-C1 | VISUAL COORDINATION GAP | Coherencia gráfica/material, no nueva semántica |
| GR-D09-03 | D09-C4 | UNRESOLVED | Handoff general despiece→ruta no demostrado por integración |
| GR-D10-01 | D10-C1 | CONTRACT/PRODUCT DECISION | Pertenencia real a componentes y scope separado de P5 |
| GR-D11-01 | D11-C1 | CONTRACT/PRODUCT DECISION | Topología/asociación de caras antes de prometer generalidad |
| GR-D14-01 | D14-C2 | VISUAL COORDINATION GAP | Soporte/composición de maqueta, sin cambiar escala del proyecto |
| GR-D15-01 | D15-C1/C2 | MISSING CAPABILITY | Frente esférico/separación exactos NOT FOUND IN AUDITED SCOPE; no ausencia de luces en Rubik |
| GR-D16-01 | D16-C2, D18-C2 | FUTURE DOMAIN | Fechas, pertenencias, dependencias y ejecución no inferibles |
| GR-D17-01 | D17-C1 | CONTRACT/PRODUCT DECISION | Comparación multivista, representación derivada |
| GR-D19-01 | D19-C1/C2 | PRESENT BUT UNDER-EVIDENCED | Activación/efecto de infraestructura actual por escena |
| GR-QA-01 | D20-C1/C3 | QA/EVIDENCE GAP | Generación, revisión y aprobación separadas |
| GR-REA-01 | D21-C1/C2/C3 | UNRESOLVED | Disponibilidad operativa, egress y utilidad para una pregunta concreta |

DEFER es una pregunta conocida que pertenece a otra fase/producto o carece de readiness; UNRESOLVED es evidencia insuficiente o conflicto vigente. No se convierte el segundo en el primero para simular cierre.

## 6. Dependency graph tipado

Las relaciones son de conocimiento y responsabilidad, no cronograma ni autorización. Cada arista identifica componentes, motivo y evidencia.

| Origen | Relación | Destino | Motivo | Evidencia |
|---|---|---|---|---|
| D02-C2 | DEPENDS_ON | D01-C1 | Convenciones de altura/lente/marco consistentes | S1 §§5–7/13 |
| D03-C2 | ALTERNATIVE_TO | D02-C2 | Diferentes especializaciones, no un tercer owner | S1 §13.1 |
| D05-C1 | ALTERNATIVE_TO | D04-C1 | Bordes raster frente a geométricos; no ambos por defecto | S1 §§8–9 |
| D05-C2 | CONSUMES | D06-C1 | Poché necesita cara real, no la genera | S1 §§9–10 |
| D07-C1 | COMPLEMENTS | D04-C2 | Sombra técnica y lectura de superficies | S1 §11/13 |
| D08-C1 | REFINES | D04-C2 | Estado espacial común, implementación no idéntica | S1 ACC-06/§12 |
| D09-C1 | CONSUMES | D01-C1 | Fit de envolvente temporal con cámara existente | S2 §27; R story-core |
| D10-C1 | COMPLEMENTS | D09-C1 | Despiece de componentes distinto de plantas | S2 §27.1 |
| D11-C1 | COMPLEMENTS | D10-C1 | Bisagra de caras exige otra topología/ownership | S2 §27.1 |
| D12-C1 | CONSUMES | D09-C2 | Orientación después de recomposición/estado válido | S2 §27.3 |
| D13-C2 | DEPENDS_ON | D13-C1 | Coreografía consume ruta válida | S2 §26/27 |
| D13-C1 | CONFLICTS_WITH | D13-C3 | Spline no validada no puede ser planner | S2 overshoot/checker |
| D14-C2 | CONSUMES | D14-C1 | Soporte compositivo respeta escala/framing | S3 D14 |
| D15-C1 | REFINES | D08-C1 | Frente espacial con centro/radio; no lámpara orbital | S3 D15 |
| D15-C2 | DEPENDS_ON | D19-C2 | Lectura de iluminación depende de respuesta material | S3 dependencias |
| D19-C2 | CONSUMES | D01-C1 | Distancia/lente determinan lectura del detalle | S3 D19 |
| D17-C1 | CONSUMES | D16-C1 | Varias vistas consumen estados del mismo modelo | S4 D17 |
| D18-C1 | COMPLEMENTS | D16-C1 | Chart y representación 3D pueden compartir cursor | S4 D18 |
| D18-C1 | DEPENDS_ON | D18-C2 | Si afirma planificación profesional necesita autoridad real | S4 modelo híbrido |
| D20-C3 | QA_VALIDATES | D09-C2 | Hold móvil revisado además de extremos | S6 §8; B5 |
| D20-C3 | QA_VALIDATES | D14-C2 | Evaluación de composición, sin reescalar | S3; S6 §5 |
| D20-C3 | QA_VALIDATES | D15-C1 | Movimiento/sombras/restore aparte de still | S3 condiciones; S6 |
| D20-C3 | QA_VALIDATES | D19-C2 | Aislar material, luz y detalle | S3/S5/S6 |
| D21-C1 | COMPLEMENTS | D20-C1 | Procedencia adicional cuando hay ambigüedad | S5/S6 |
| D21-C2 | REFINES | D21-C1 | Ejecución requiere operación distinta de capturar fuente | S5 D21 |
| D21-C4 | CONFLICTS_WITH | D21-C3 | Runtime productivo/permiso de copia violaría frontera | S5/S6 |

## 7. Pipeline arquitectónico reconciliado

| Capa | Componentes / autoridad | Frontera |
|---|---|---|
| Verdad semántica / geometría Rubik | Project/Building, D06-C1, D13-C1, D19-C1, C1–C4 | Datos, unidades, IDs y rutas no se derivan de efectos |
| Proyección / descomposición técnica | D01–D03-C1/C2, D09-C1, D10-C1, D11-C1 | Descriptores reales; no membresía o estructura inventada |
| Representación gráfica | D04-C1/C2, D05-C1/C2, D06-C2, D07-C1 | Backend no equivale a nuevo modelo |
| Material / luz / profundidad | D07-C2, D08-C1, D15-C1/C2, D19-C1/C2 | Preservar autoridad material/Solar; no falsa física |
| Cámara / composición | D01-C1/C2, D02-C2, D03-C1, D14-C1/C2 | Región libre efectiva, no solo canvas |
| Ruta válida / estado narrativo | D12-C1, D13-C1/C2; D09-C2 | Ruta decidida por Rubik antes de cualquier coreografía que la use |
| Story / View3D lifecycle | Transporte, Begin/Apply/End existentes | Mismo player/cámara; handles, epochs y rollback |
| Reverse / restore | D09-C2 y obligaciones transversales | Recomposición, materiales, niveles, foco y globals sin residuos |
| Generación de evidencia | D20-C2; D21-C1 si pertinente | SHA/configuración/artefactos, sin presumir revisión |
| Revisión de evidencia | D20-C1/C3 | Técnica y visual separadas |
| Aceptación humana | Juanma y versión exacta | No inferida de fuente, métricas o CI |

La tabla expresa capas, no una secuencia que permita planificar ruta después de mover cámara arbitrariamente. La autoridad de ruta/entrada es condición previa a la coreografía; lectura estática de sección/axon no promete tránsito. No hay justificación para segundo renderer, segundo Story o nueva autoridad semántica.

### 7.1 Frontera temporal y económica

**MODEL D — HYBRID** se mantiene para D16–D18. Dominio real → derivación pura → descriptor de presentación → Story/runtime existente. Presentación derivada puede no necesitar persistencia; plan editable o ejecución real requiere datos durables y decisión separada. No se diseña schema aquí.

Story no posee calendario profesional, precedencias, avance real, certificación, precios o pertenencia a trabajos. Existing/new/demolished describe ciclo de vida de muros, no fecha de instalación; clear/pending/insufficient de Building trata distribución/conflictos. BC3 y fechas de precio/revisión no son programa de obra. C1 schedules son tablas de cantidades; C2 calcula presupuesto; C3 aporta referencias; C4 presenta/exporta. Ninguno justifica porcentaje temporal × coste como certificación o caja.

D17 sigue multivista derivada, no dominio propio. D18 usa flechas adyacentes y un rótulo CRITICAL PATH sin grafo/CPM demostrado. FT3D-8 permanece **FUTURE / SEPARATE TEMPORAL FAMILY**. Ausencia de demostración profesional es NOT FOUND IN AUDITED SCOPE; no afirmación sobre toda herramienta imaginable.

## 8. Por qué la referencia parece más resuelta: síntesis causal

Comparaciones no controladas entre casas/assets/configuraciones distintos: **NOT DIRECTLY COMPARABLE**; no superioridad cuantitativa global. Fuente prueba mecanismo; apariencia prueba observación, no efecto aislado. Confianza sobre causa relativa en general MEDIUM/UNVERIFIED.

| Categoría | Evidencia relevante | Rubik / conclusión acotada | Confianza causal |
|---|---|---|---|
| Contenido/assets | Casa, mobiliario, paisaje authored S3/S6 | Mejor contenido seleccionado no prueba mejor renderer | MEDIUM |
| Geometría | Relieve real 07/C, marcos/jambas; withCore shader | Rubik ya tiene volumen; nuevos detalles necesitan fuente | HIGH mecanismo, MEDIUM beneficio |
| Gráfica arquitectónica | D04–D07 tinta/poché/hatch | Legibilidad también gráfica, no solo fotorealismo | MEDIUM |
| Materiales | Variación de color/roughness/normal y cantos | Infraestructura existente; activación por captura no inferida | MEDIUM |
| Texturas | Ruta de scans y sustitución procedural | Procedural no implica mejor calidad o coste | MEDIUM |
| Filtrado | Derivadas/footprint y mip/filtering | Detail estable debe revisarse en movimiento | HIGH mecanismo, MEDIUM efecto |
| Luz/entorno | Cubemaps/PMREM e intensidades coordinadas | HDR Rubik existe; no falta universal de entorno | MEDIUM |
| Sombras/contacto | Shadows y AO aproximado | No juzgar precisión/softness solo por screenshot | MEDIUM |
| Cámara | FOV/target/descenso | Ya hay fitting; no global .01 ni Y arbitraria | HIGH mecanismo |
| Composición | Soporte, encuadre y espacio UI | Región libre y pausa importan tanto como extremos | HIGH caso F5, MEDIUM general |
| Renderer/color | HDR interno/ACES/sRGB/exposición | Versiones/config no equivalen automáticamente | MEDIUM |
| PostFX | Bloom presente L; 06 composer; 07 otra ruta | No requisitos universales ni reescritura renderer | MEDIUM |
| UI/diseño | Tokens/jerarquía/dossier y tipografía | La imagen final incluye 3D + interfaz | MEDIUM |
| Movimiento | Reveals/interpolación/animaciones | Still no demuestra continuidad/restore | MEDIUM |
| QA/pulido | Versiones comparables/defectos/revisión | Proceso sistemático, no score universal | HIGH proceso; beneficio cuantitativo U |

**Premium ≠ bloom** y **premium ≠ procedural**. No se ha acreditado que Rubik esté universalmente plano, sobreiluminado o sin profundidad. El gap principal respaldado combina jerarquía de presentación, coordinación visual y evidencia del uso real de capacidades.

## 9. Conflict Registry

Cada entrada separa afirmaciones reales de lecturas hipotéticas. No se acusa al Atlas de frases que nunca formuló.

| Finding ID | Tipo | Claim / origen | Evidencia pertinente | Resolución / acción |
|---|---|---|---|---|
| GR-D09-01 | PRODUCT EVOLUTION | S1/S2 F5 pendiente/WIP | R/P5/B5 integrados | SUPERSEDED_BY_PRODUCT_EVOLUTION; histórico correcto |
| GR-QA-03 | LEGAL/PROVENANCE | S5/S6 paquetes 3/4 no acreditados | Autorización nueva + hashes | REFINE: disponibilidad ahora verificada; aprobación no inferida |
| GR-D14-02 | ATLAS VS SOURCE | Lectura miniatura = global .01 | S3 D14 distingue modelo principal/tiny | CONTRADICT hipótesis; no imputar afirmación literal al Atlas |
| GR-D15-02 | ATLAS VS SOURCE | Lectura sweep = luz orbital | S3 D15 centro fijo/radio | REFINE shorthand; CONTRADICT esa interpretación |
| GR-D19-02 | VISUAL VS SOURCE | Apariencia rica implica renderer nuevo | S3/S6 infraestructura actual | CONTRADICT inferencia; no evidencia de necesidad |
| GR-D05-01 | ATLAS VS SOURCE | Plural normal/depth/ID interpretado como tres pases | S1 ACC-04 | REFINE: un pase empaquetado + composición/FXAA |
| GR-D03-01 | ATLAS VS SOURCE | Cluster lens/shift interpretado idéntico | S1 ACC-02 | REFINE: D03 sin shift ni shortest yaw |
| GR-D04-02 | ATLAS VS SOURCE | Todos fills pasan por patchFill | S1 ACC-03 toneMat | REFINE locator, no error de toda familia |
| GR-D06-02 | ATLAS VS SOURCE | Caps donor universales | S1 §10/ACC-05 | REFINE a extrusiones constantes; no CSG general |
| GR-D08-01 | SOURCE VS COMMENT | Curva declarada C1 universal | S1 §12/ACC-07 | CONTRADICT generalización estricta; no nuevo probe |
| GR-D13-01 | CUT VS CUT | “Authored/no planner” leído “no chequeo” | S2 __checkPath opt-in | REFINE: existe diagnóstico, no enforcement |
| GR-D12-01 | ATLAS VS SOURCE | Radar homogéneo / defaults como configuración activa | S2 C2-CC4/06 | REFINE SVG/sección/inset/tabs y overrides |
| GR-D16-02 | VISUAL VS SOURCE | Construcción visible acredita ingeniería de planificación | S4 | CONTRADICT inferencia, mantener MODEL D |
| GR-D17-02 | ATLAS VS SOURCE | D17 como dominio constructivo independiente | S4 identidad | REFINE: multivista consumidora |
| GR-D18-01 | SOURCE VS COMMENT | Arrows/CRITICAL PATH acreditan CPM | S4 programmeSVG/PHASES | CONTRADICT inferencia; datos authored |
| GR-QA-04 | SOURCE VS COMMENT | Comentario dos rebotes frente a bucle actual | S5/S6 maxPass=1 | REFINE implementación acotada; no simular dos pasadas |
| GR-QA-05 | VISUAL VS SOURCE | Screenshot con loader como still final | S5 E05/E07 | CONTRADICT idoneidad final; conservar original |
| GR-REA-02 | ATLAS VS SOURCE | “REA solo pasivo”, si se generaliza | S5/S6 capture frente a coverage | REFINE alcance; Atlas limitado no afirmó inexistencia universal |
| GR-LEGAL-01 | LEGAL/PROVENANCE | Repositorio público o export REA = permiso | S5/S6 licencias | CONTRADICT inferencia; L reference-only |
| GR-QA-06 | CUT VS CUT | ALREADY SOLVED de S5 como aceptación visual | S6 reemplazo explícito | REFINE, S6 prevalece y exige seis niveles |
| GR-D04-03 | UNRESOLVED | Backend final edges vs raster | S1/S6 sin comparación Rubik controlada | UNRESOLVED; no ganador ni prioridad de construcción |
| GR-D09-04 | UNRESOLVED | Lease genérico y handoff por existir P5 | S2 F5 preguntas + R especializado | UNRESOLVED; no extender scope para cerrarlo |
| GR-REA-03 | UNRESOLVED | Cero egress / tool disponible en privado | S6 privacidad y no ejecución | UNRESOLVED por operación/proveedor |

Ninguna contradicción material se ocultó como “resuelta” sin evidencia. UNRESOLVED aquí es resultado documental honesto, no requisito de cambiar producto para completar este informe.

## 10. Atlas Delta Log — wording propuesto, no aplicado

| ID | Locator original | Acción | Wording candidato / límite | Evidencia y finding |
|---|---|---|---|---|
| AD-01 | A §15/cola D09 | SUPERSEDE | FT3D-5 ya integrado en R; analizar mejoras sin reconstruir ni reabrir V2 | R/P5/B5; GR-D09-01 |
| AD-02 | A D01–D03 | REFINE | Compartir convenciones no iguala algoritmos; invariancia limitada al plano | S1 §2/ACC-02; GR-D03-01 |
| AD-03 | A D04 locators | REFINE | Incluir toneMat como fill de 01A; no todo usa patchFill | S1 ACC-03; GR-D04-02 |
| AD-04 | A D05 | REFINE | Pase normal/depth/ID empaquetado, seguido de composición y FXAA | S1 ACC-04; GR-D05-01 |
| AD-05 | A D06 | REFINE | Caps de extrusiones conocidas; withColour es flecha, notas con datos authored | S1 ACC-05; GR-D06-02 |
| AD-06 | A D08 | REFINE | story produce S.scanX mediante forwardScanX; no función scanX | S1 ACC-01; GR-D08-02 |
| AD-07 | A contexto versión Three | CORRECT | 01 usa .169; 02 .160.0; 03/07 .160.1; chunks/API ≠ integración GPU | S1 §3.1/ACC-08; GR-ATLAS-01 |
| AD-08 | A D10 | REFINE | Seis capas authored; no clasificación automática ni equivalencia con F5 | S2 C2-CC1; GR-D10-01 |
| AD-09 | A D11 | REFINE | Cocina rectangular con pivotes manuales; no auto-unfold universal | S2 C2-CC2; GR-D11-01 |
| AD-10 | A D12/D13 | REFINE | Radar heterogéneo; checker opt-in existe en 02 pero no es planner | S2 §25/26; GR-D12-01/GR-D13-01 |
| AD-11 | A D14 | REFINE | Principal sin escala global .01; miniatura secundaria sí; composición/soporte | S3; GR-D14-02 |
| AD-12 | A D15 | REFINE | Centro fijo con radio/banda; separar frente material de contribución luminosa | S3; GR-D15-02 |
| AD-13 | A D19 | REFINE | Profundidad coordinada; infraestructura Rubik existente, no renderer rewrite | S3/S6; GR-D19-02 |
| AD-14 | A D16–D18/§18 | KEEP | Familia FT3D-8 futura, MODEL D; authored no prueba planificación profesional | S4; GR-D16-02/GR-D18-01 |
| AD-15 | A D17 | REFINE | Multivista de un mismo modelo a tiempos distintos; no dominio propio | S4; GR-D17-02 |
| AD-16 | A D20/G22 | REFINE | Coordinación y proceso; artefacto/revisión/aceptación separados | S5/S6; GR-QA-01/06 |
| AD-17 | A D21 | REFINE | Captura pasiva ≠ cobertura explícita; esta perturba medición | S5/S6; GR-REA-02 |
| AD-18 | A unknowns/provenance | UNRESOLVED | Mantener egress, rendimiento físico y soporte completo de hooks sin promesas | S1/S6; GR-REA-03 |
| AD-19 | A FT3D-6 §16 | DEFER | Carry-forward exacto P1–P11, sin promoción ni cambio de resolver | P6; GR-FT3D6-01 |
| AD-20 | A legal | KEEP | MIT con avisos/terceros separados; Lintel REFERENCE ONLY | S1/S5/S6; GR-LEGAL-01 |

Estos textos existen solo en este documento nuevo. Original Atlas, Cuts y contratos no se editaron.

## 11. Global Evidence Ledger — conclusiones materiales

La clasificación pertenece a la pregunta y al SHA, no a una jerarquía universal. “Reportado” mantiene origen del reporte; no es ejecución nueva.

| Finding ID | Claim reconciliado | Fuente / locator | Tipo y fuerza preservados | Acción | Límite |
|---|---|---|---|---|---|
| GR-D01-02 | Invariancia planar, no volumétrica | S1 §2/§5 probes | TEST-CONFIRMED matemático heredado, SOURCE-CONFIRMED | REFINE | No GPU/producto nuevo |
| GR-D03-01 | D03 sin shift/giro corto | S1 §7/ACC-02 | SOURCE + prueba matemática heredada | REFINE | Sin defecto Rubik atribuido |
| GR-D04-02 | toneMat es ruta propia | S1 §8/ACC-03 | SOURCE-CONFIRMED | REFINE | No port GPU acreditado |
| GR-D05-01 | Un pase empaquetado | S1 §9 | SOURCE-CONFIRMED | REFINE | Layout no universal |
| GR-D06-02 | Caps extruidos limitados | S1 §10 | SOURCE-CONFIRMED | REFINE | No solver genérico |
| GR-D08-02 | scanX campo producido por story | S1 §12/ACC-01 | SOURCE-CONFIRMED | REFINE | No función inventada |
| GR-ATLAS-01 | Versiones/chunks no equivalen a compatibilidad final | S1 §3.1 | SOURCE y comparaciones heredadas | REFINE | Sin compilación GPU nueva |
| GR-D09-01 | Despiece integrado supera estado WIP histórico | R/P5; §3 delta | SOURCE/CONTRACT/Git; B5 atribuido a bf3e5ca | SUPERSEDE | Sin rerun 710 en R |
| GR-D09-02 | Base+delta, ownership y restauración específicos | R index begin/apply/endAxon; P5 | SOURCE/CONTRACT; tests B5 reportados | KEEP | No lease general |
| GR-D10-01 | Board no equivale a F5 | S2 §23/27 | SOURCE-CONFIRMED + semántica P5 | KEEP | Membership pendiente |
| GR-D11-01 | Unfolded authored, no topología arbitraria | S2 §24 | SOURCE/probes heredados | KEEP | Subset no universal |
| GR-D12-01 | Inset/SVG/seek no son planner | S2 §25 | SOURCE; observaciones runtime heredadas | REFINE | Accesibilidad móvil no inferida de DOM |
| GR-D13-01 | Checker opt-in existe, no planifica | S2 §26 | SOURCE; 0 hits runtime reportado en escena exacta | REFINE | No seguridad universal |
| GR-D13-02 | Spline puede salir de corredor | S2 probes/contraejemplo | TEST-CONFIRMED matemático heredado | KEEP | No colisión donor afirmada por overshoot |
| GR-D14-02 | Global .01 no explica principal | S3 D14 | SOURCE/proyección matemática heredada | CONTRADICT | tiny separado sí usa .01 |
| GR-D15-02 | Frente no luz orbitante | S3 D15 | SOURCE-CONFIRMED | REFINE | Lectura visual final U |
| GR-D19-02 | No justificación para renderer rewrite | S3/S6 | SOURCE + INFERRED alcance | KEEP | No superioridad cuantificada |
| GR-D16-02 | Timing authored no planificación profesional | S4 | SOURCE/CONTRACT + INFERRED frontera | DEFER | No domain schema |
| GR-D17-02 | Multivista derivada | S4 D17 | SOURCE-CONFIRMED | REFINE | Coste GPU U |
| GR-D18-01 | Flechas/rótulo no acreditan grafo/CPM | S4 D18 | SOURCE-CONFIRMED en scope | KEEP | No negación universal fuera de scope |
| GR-QA-01 | Generación ≠ revisión ≠ aceptación | S5/S6; P5 §38 | CONTRACT/SOURCE + INFERRED método | REFINE | No nuevos gates runtime implementados |
| GR-QA-02 | Región libre hold ≠ región extremos | S6 §8; bf3e5ca diff | SOURCE-CONFIRMED; defecto humano referido por control | KEEP | No campaña visual nueva |
| GR-QA-04 | Una pasada vs comentario histórico | S5/S6 | SOURCE-CONFIRMED heredado | REFINE | No extrapolar simulación física |
| GR-QA-05 | E05 contiene loader | S5 E05/E07 | VISUALLY-OBSERVED heredado | CONTRADICT | No golden final válido |
| GR-QA-06 | Capacidad disponible no eficacia aceptada | S6 reemplazo S5 | SOURCE/CONTRACT + INFERRED | REFINE | Estados L1–L6 separados |
| GR-REA-02 | Captura pasiva y coverage distintos | S5/S6 | SOURCE-CONFIRMED | REFINE | REA no ejecutado |
| GR-REA-03 | Local ≠ cero egress al agente | S6 §6 | Documentación + INFERRED riesgo; egress global U | UNRESOLVED | No recomendación privada universal |
| GR-LEGAL-01 | Export/captura no cambia permisos | S1/S5/S6 | LICENSE/SOURCE-CONFIRMED | KEEP | Assets/deps aparte |
| GR-D04-03 | Elección de backend no resuelta | S1/S6 | UNVERIFIED conveniencia final | UNRESOLVED | No selección en esta tarea |
| GR-QA-03 | Seis artefactos ahora disponibles | Autorización y SHA-256 locales | HASH/Git comprobados | SUPERSEDE | Inventario, no aprobación |

## 12. FT3D-6 carry-forward — sin reconciliar P1–P11

FT3D-6 es director narrativo profesional: una revisión posterior decidirá cómo usa capacidades disponibles, con scope/fallback. No almacén de features donor. Separar conocimiento de mecanismos de la política de perfiles.

Se conservan, sin canonizar su combinación:

- Familia → capability → variante → estado/fase → adapter → Story.
- Snapshot de capabilities → resolver semántico → minimumStory → gate ejecutivo → adapters → Story.
- Semánticamente soportado ≠ técnicamente ejecutable ≠ visualmente aceptado.

Plan semántico válido no inventa PresentationPlan ejecutable. El mínimo no debe fabricarse por ausencia de rooms/anchor. La separación `minimum-unmet` / `presentation-plan-unavailable` sigue en P6; no se rediseña aquí.

| ID estable | Gate pendiente | Findings/componentes a llevar | Evidencia necesaria / pregunta posterior | Estado aquí |
|---|---|---|---|---|
| GR-FT3D6-P1 | availability/reasons | GR-D09-01, GR-QA-06; D09-C1/C4 | Mapear descriptor real a snapshot sin confundir integración con disponibilidad universal | OPEN, NO CERRADO |
| GR-FT3D6-P2 | adapters | D09-C1/C2, D10-C1, D11-C1 | Identidad real de adapter y límites; narrative kind no prueba registry futuro | OPEN |
| GR-FT3D6-P3 | scope/coverage | D09-C1, D17-C1; GR-D10-01 | Building/level/colección, incluidos/excluidos y cobertura semántica | OPEN |
| GR-FT3D6-P4 | variants | D09-C1, D10-C1, D11-C1 | Compacto/despiece no equivalen a Board/Unfolded; QA por variante | OPEN |
| GR-FT3D6-P5 | anchors | D09-C2/C4, D13-C1 | Extremos/hold/region, recomposición y anchor ejecutable real | OPEN |
| GR-FT3D6-P6 | repeatability | D09-C2, D20-C3 | Ocurrencias/ciclos/ownership sin drift; no copiar repeats donor | OPEN |
| GR-FT3D6-P7 | reduced motion | D09-C2, D20-C3 | Holds discretos reales y targets equivalentes | OPEN |
| GR-FT3D6-P8 | Building/level/site | D09-C1/C2, D17-C1 | levelView/context/globals restaurados; no niveles extra por demo | OPEN |
| GR-FT3D6-P9 | partial/unsupported | D09-C1, D11-C1 | Razones/exclusiones con datos reales y UI honesta | OPEN |
| GR-FT3D6-P10 | timing | D09-C2, D13-C2, D18-C1 | Fuente SCENE_MS 7s/10s F5 vs duración obra/export; no import de tiempos | OPEN |
| GR-FT3D6-P11 | overview/new anchors | D09-C4, D13-C1 | Un encuadre Building no crea overview(building) ni ejecución sin rooms | OPEN |

**GR-FT3D6-01:** todas son implicaciones de evidencia, no resolución de §50 ni modificación de contrato. La futura reconciliación requiere aprobación humana separada del presente documento.

## 13. Metodología QA y REA consolidada

### 13.1 D20 compatible con Rubik, sin herramientas copiadas

Verdad semántica → corrección runtime → framing/composición → material/luz → desktop/móvil → forward/reverse/seek/cancel/restore → reduced motion → generación → revisión técnica → revisión visual → aprobación humana.

Gate de generación: artefactos, logs, manifiesto, SHA/configuración y checksums. Gate de revisión: contenido contrastado, defectos clasificados y alcance explícito. Gate estético: jerarquía, volumen, planos, aristas, diferenciación, coherencia lumínica, aliasing, UI/3D y estabilidad. Ningún score pseudocientífico universal. Automated green ≠ visual acceptance.

Caso F5: hold móvil escapó de automatización previa según control del usuario; source integrado confirma región tarjeta específica. Un viewport probado no cubre todos los estados de paneles; extremos correctos no prueban intermedios. No reabrir su implementación para formalizar la lección.

| Medio | Strong para | Partial/weak para | Unsuitable como |
|---|---|---|---|
| Unitarias | Derivación/estado/invariantes | Integración raster/UI | Aprobación estética |
| Browser | Interacción/visibilidad/restore/resize definidos | Composición no expresada por aserto | Calidad premium universal |
| Screenshots revisados | Framing/clipping/lectura de planos | Movimiento | Prueba de FPS |
| Vídeos revisados | Continuidad/reverse/shimmer | Causa técnica y coste físico | Certificación semántica |
| Manifiestos | Provenance/reproducción | Corrección del contenido | Revisión visual |
| Source/REA | Mecanismo/conexión | Causalidad perceptiva | Aceptación humana |
| Humano | Jerarquía/legibilidad/coordinación | Exhaustividad/determinismo | Garantía de invariantes internos |

Paquete robusto: SHA final, revisiones de inputs/assets, ruta/capability/variante/fase, progreso/sentido, viewport/DPR/resolución interna, browser/dispositivo/GPU, estado UI/región libre, reduced motion, luz/materiales, readiness sin loader, timestamp, artefactos/checksums, expected/observed, baseline FAIL/SKIP, riesgos no automatizados, revisor/decisión. Frame-stepping/SwiftShader acredita estados, no rendimiento físico. Cambiar SHA/configuración invalida equivalencia sin comprobar delta.

### 13.2 D21 acotado

Fuente/docs primero → runtime si resuelve pregunta → REA solo ante ambigüedad material → entendimiento independiente → especificación independiente si se autoriza después. Si fuente demuestra mecanismo, lookup no necesita REA. Si no hay prueba suficiente, UNVERIFIED; no investigación indefinida.

Captura/download/Debugger source ≠ ejecución. Coverage explícita sí observa conteos en ventana, no traza causal completa; resetea contadores e impide optimización. Ausencia de sample no es cero ejecución. Response.body puede obtener bytes por carga posterior; manifest retiene esa limitación. Export no reconstruye dependencias faltantes ni concede licencia.

No REA en runtime Rubik. Operación local puede producir outputs con código privado que el agente/proveedor recibe; red, credenciales, retención y egress dependen de operación/entorno. Su garantía global sigue UNRESOLVED. No bypass de acceso/protección. Lectura de source no certifica un clean-room formal.

## 14. Exclusiones consolidadas y hallazgos negativos

No incorporar como autoridad: casas/terreno/geometry donor, coordenadas, cámaras, splines/visitas como rutas, timings, paletas/branding, índices fijos de luz, núcleo deformado, global .01 de Rubik, Y arbitraria, fechas falsas, WBS demo, CPM implícito, coste temporal sin asignación, tests que solo reconocen habitaciones donor, assets de terceros sin revisión, screenshots/vídeos como activos de producto, código/shaders/postFX Lintel o REA runtime.

| Negativo preservado | Alcance / evidencia |
|---|---|
| D14 no exige global .01 | Principal vs tiny, S3 |
| D15 no es luz móvil/orbital | Centro fijo y radio/banda, S3 |
| D19 no exige renderer rewrite | Infraestructura actual + comparación limitada, S3/S6 |
| D16 no demuestra planner profesional | Semanas/fórmulas authored, S4 |
| D17 no crea dominio constructivo | Consumidor multivista, S4 |
| D18 arrows no prueban precedencias | Filas adyacentes, S4 |
| D18 CRITICAL PATH no prueba CPM | Sin cálculo demostrado, S4 |
| Premium no es bloom monocausal | Material/luz/escena/UI/postFX, S5/S6 |
| Captura de script no prueba ejecución | Pasivo vs coverage, S5/S6 |
| API/preset disponible no prueba uso efectivo | L1–L6, S6 |
| Menos descarga no prueba menor frame cost | Medidas distintas, S5 |
| Nodos presentes no prueban accesibilidad | Controles ocultos en scope, S2 |
| Not found no es proven absent | KTX2/route/composer según scope, S3/S6 |

Estos negativos deben seguir visibles para evitar que reaparezcan como supuestos de producto.

## 15. Síntesis compacta Dxx

Grupos de lectura documental: proyección (D01–D03), representación técnica (D04–D08), descomposición/orientación/coreografía (D09–D13), composición/material (D14/D15/D19), temporal (D16–D18), metodología/herramientas (D20–D21). No son lista de trabajo ni selección futura.

| Dxx | Identidad reconciliada | Síntesis | Cambio histórico material |
|---|---|---|---|
| D01 | Encuadre, lente y distancia | MIXED — SEE COMPONENT TABLE | KEEP/REFINE según componente y evidencia |
| D02 | Apertura frontal de sección | MIXED — SEE COMPONENT TABLE | KEEP/REFINE según componente y evidencia |
| D03 | Encuadre de fachada | MIXED — SEE COMPONENT TABLE | KEEP/REFINE según componente y evidencia |
| D04 | Tinta geométrica y wash | MIXED — SEE COMPONENT TABLE | KEEP/REFINE según componente y evidencia |
| D05 | Buffer técnico y bordes raster | MIXED — SEE COMPONENT TABLE | KEEP/REFINE según componente y evidencia |
| D06 | Caps, color y notas de sección | MIXED — SEE COMPONENT TABLE | KEEP/REFINE según componente y evidencia |
| D07 | Sombra técnica y material | MIXED — SEE COMPONENT TABLE | KEEP/REFINE según componente y evidencia |
| D08 | Frente espacial de materialización | MIXED — SEE COMPONENT TABLE | KEEP/REFINE según componente y evidencia |
| D09 | Floor by Floor | MIXED — SEE COMPONENT TABLE | SUPERSEDED_BY_PRODUCT_EVOLUTION en implementación F5 |
| D10 | The Board | MIXED — SEE COMPONENT TABLE | KEEP/REFINE según componente y evidencia |
| D11 | Unfolded Room | MIXED — SEE COMPONENT TABLE | KEEP/REFINE según componente y evidencia |
| D12 | Orientación, radar y seek | MIXED — SEE COMPONENT TABLE | KEEP/REFINE según componente y evidencia |
| D13 | Coreografía y relevo con ruta | MIXED — SEE COMPONENT TABLE | KEEP/REFINE según componente y evidencia |
| D14 | Card Model: escala perceptiva y composición | MIXED — SEE COMPONENT TABLE | REFINE maqueta principal vs tiny |
| D15 | Frente esférico y separación de luz | MIXED — SEE COMPONENT TABLE | REFINE centro/radio, no órbita |
| D16 | Tiempo por elemento | MIXED — SEE COMPONENT TABLE | KEEP/REFINE según componente y evidencia |
| D17 | Varias vistas, mismo modelo y tiempos | MIXED — SEE COMPONENT TABLE | REFINE multivista derivada |
| D18 | Programa y 3D sincronizados | MIXED — SEE COMPONENT TABLE | KEEP límite CPM/calendario/autoridad |
| D19 | Detalle y profundidad de presentación | MIXED — SEE COMPONENT TABLE | KEEP infraestructura; no renderer rewrite |
| D20 | QA y pulido visual | MIXED — SEE COMPONENT TABLE | S6 reemplaza clasificación/ledgers S5; no aceptación por generar |
| D21 | REA: evidencia e ingeniería inversa | MIXED — SEE COMPONENT TABLE | REFINE captura/coverage/privacidad |

## 16. Límites, control humano y aceptación documental

Este documento no convierte evidencia SOURCE en ejecución, propuestas en datos, observaciones en TEST ni prioridad en orden. Render físico/benchmarks y paridad estética general permanecen UNVERIFIED. D04/D05 selección backend, D09 handoff genérico y privacidad operativa REA quedan UNRESOLVED; dominio temporal conocido queda DEFER. Ninguno exige alterar producto para cerrar la reconciliación documental.

Los cinco paquetes están ahora disponibles y sus seis fuentes acreditadas/verificadas; el antiguo bloqueo de disponibilidad queda superado por los cuatro originales suministrados, no por reconstrucción editorial. Las fuentes persisten byte-for-byte incluso sus enlaces escapados/fences. La aprobación de findings no se infiere de esa acreditación.

### Acceptance gates

| Gate | Resultado / evidencia |
|---|---|
| Master exacto autorizado al inicio | PASS — ls-remote 18848fbf… |
| Rama local/remota nueva, base e inicial clean | PASS — control §0.1 |
| Cuts 1/2 exactos y A accesibles | PASS — objetos Git y títulos |
| Cuatro hashes/títulos/scopes | PASS — manifiesto y copia raw |
| Cinco paquetes / seis fuentes, sin doble conteo | PASS — S1–S6 |
| D01–D21 por componente / seis niveles / ejes | PASS — 68 filas con factores y perfiles |
| Conflictos y deltas tipados con provenance | PASS — §§9–11 |
| Arquitectura/rutas/temporal/C1–C4 preservados | PASS — §§6–7 |
| Test SHA correcto, sin atribuir run nuevo a R | PASS — §3.1 |
| FT3D-6 carry-forward sin cerrar gates | PASS — §12 |
| No investigación nueva donante/campañas | PASS — §0.3 |
| Sin implementación/selección/Sculpture/cambios de autoridad original | PASS — alcance y diff limitado |
| Validación documental final, hashes Git y seis paths | PASS — 4 originales = copias = blobs index; 68 IDs/factores, 21 dossiers/resúmenes, 11 gates abiertos, tablas/enlaces locales y seis paths comprobados |
| Master sin movimiento antes de publicar | PASS — nueva comprobación ls-remote mantiene exactamente 18848fbf… |
| Commit/push normal, sin PR/merge; final clean | CONTROL DE ENTREGA — SHA local/remoto y status final registrados en el informe de publicación; no se infieren de este texto |

El commit documental se identifica por el HEAD que contiene estos seis archivos, descendiente directo de la base fijada; su SHA y el remoto se registran en la entrega. No se añade un segundo commit para escribir un SHA autorreferente.

**Finalidad de entrega:** HUMAN AUDIT OF THE GLOBAL DONOR RECONCILIATION. Solo una autorización humana posterior permitiría otra tarea de reconciliación del working contract FT3D-6 contra FT3D-5 integrado y esta autoridad documental aprobada.

**GLOBAL DONOR RECONCILIATION STATUS: READY FOR HUMAN REVIEW** — estado del documento como propuesta de autoridad, no aprobación humana ni permiso de implementación.
