# Integración OBR-02/OBR-03 (#210) sobre `master` con OBR-01 (#207)

**Fecha:** 12-11-2026 · **Rama aislada:** `integration/obr02-obr03-on-master-20261112` · **Base:** `master@8d9cb7b8eb7453d2da1ecda7a729398072c286ac` (incluye #207 fusionada) · **Origen de OBR-02/03:** `lab/obr02-obr03-planned-4d@5cb4a32` (#210, **no modificada**).

**Qué es este documento:** una propuesta de cirugía **reversible** y revisable. No fusiona nada, no toca `master`, ni #208 ni #209, ni Production.

**Autoridad:** ChatGPT mantiene la auditoría, la reconciliación final y el merge.

## 1. Método

1. Rama nueva desde `master@8d9cb7b`.
2. `git merge --no-ff` de la rama de #210 (sin rebase ni force-push; #210 queda intacta).
3. Resolución del único conflicto y ciclo de vida de la vista previa.
4. Pruebas combinadas con OBR-01 y regresión completa.
5. **Ensayo local, no publicado**, de la combinación con #208 (GOV-07, de Claude A), para anticipar conflictos sin tocar su rama.

**Reversibilidad:**
- la rama solo contiene el merge, un commit de pruebas y este informe;
- revertir el merge (`git revert -m 1 <merge>`) devuelve `master` exactamente a `8d9cb7b`.

## 2. Conflictos encontrados y solución

| Archivo | Tipo | Conflicto | Solución |
|---|---|---|---|
| `evolucion/project-scene.js` | **Conflicto de contenido** (1 bloque) | Última línea del objeto que devuelve `createProjectScene`. `master` (#207) trae `dispose` real y `get disposed`; #210 trae `dispose:()=>cancelAnimationFrame(raf)` (el antiguo) y añade `setPreview` y `get preview`. | Se conservan **las dos APIs**: el `dispose` de #207 y `setPreview`/`preview` de #210. El `dispose` antiguo de #210 se descarta, porque reintroduciría el defecto que cerró #207. |
| `evolucion/project-scene.js` | Ajuste semántico (sin marca de conflicto) | El ciclo de vida de #207 no conocía los recursos de la vista previa de #210 (auditoría de #210, puntos 3 y 6). | `dispose()` también vacía las claves y libera `previewMat`. `load()` vacía las claves del proyecto anterior (con IDs repetidos no se reaplica el fantasma). **Probado:** la resolución ingenua, sin estas dos líneas, falla la prueba 6. |
| `evolucion/project-scene.js` | Convivencia | #207 sustituyó `pick` por `hitsAt`, que ya ignora las líneas y da prioridad al sólido más cercano. El `NO_RAYCAST` de #210 sobre las aristas del fantasma queda **redundante pero inofensivo**. | Se mantiene como defensa. **Probado:** con el fantasma encendido, el clic real va al muro sólido (prueba 1 y EX-05 del examen). |
| `evolucion/fidelity-app.js` | Sin conflicto | #210 solo cambia el analizador de planes importados (rechazo de `status=cancelled`). | Fusión automática. |
| `evolucion/index.html` (de la Evolución, **no** el reservado) | Sin conflicto | 2 líneas de #210: el núcleo y el panel. | Fusión automática. |
| Nuevos: `js/construction-plan-preview-core.js`, `evolucion/plan-preview-ui.js`, pruebas, workflow y acta | — | — | Tal cual. Además `plan-preview-ui` expone `watching` (intervalo de grabación pendiente) para la prueba 5. |

## 3. Dependencia con #208 (GOV-07, Claude A): ensayo local, sin publicar

- **Ensayo:** `merge --no-ff` de `lab/gov07-webgl-resilience@e2d0e84` sobre esta rama, en un worktree temporal que **no se ha subido**. **Sin conflictos:**
  - `evolucion/fidelity-app.js` se fusiona solo; conviven `createSceneSafely`/`attachGlGuard` de GOV-07 y el rechazo de tareas canceladas de #210;
  - `evolucion/gantt-view.js` lo toca solo GOV-07.
- **Interacción a vigilar:** el `dispose()` de #207 llama a `renderer.dispose()`, y `gl-guard` de GOV-07 envuelve `renderer.render`. En el ensayo, las suites de GOV-07 pasan (resultados abajo). Si GOV-07 cambia su ciclo de vida, conviene volver a ejecutar las pruebas cruzadas.
- **Orden de integración recomendado:** este corte (OBR-02/03) antes o después de #208, indistintamente, porque no hay solape textual. Si se integra #208 después, hay que volver a ejecutar las suites cruzadas en el árbol combinado.

## 4. Pruebas combinadas (auditoría de #210)

| Punto de la auditoría | Prueba |
|---|---|
| 1 · fantasma encendido + clic real en muro sólido: gana el muro | `obr02-obr03-integration` #1 y examen EX-05 |
| 2 · tarea sin elementos: ningún fantasma | `obr02-obr03-integration` #2 |
| 3 · proyecto B sin plan tras A, con IDs repetidos: sin fantasma anterior | `obr02-obr03-integration` #3 y #6 (`load()`) |
| 4 · `setPreview([])` restaura exactamente imagen, inspección, piezas visibles y selección | `obr02-obr03-integration` #4 (huella de píxeles y 266 puntos de selección) |
| 5 · grabación y cancelación: se retira y se repone una sola vez, sin intervalos pendientes | `obr02-obr03-integration` #5 |
| 6 · `previewMat` y listeners liberados en el ciclo de vida real | `obr02-obr03-integration` #6 |
| 7 · coste sin enlace C1–C4: «No disponible», nunca 0 | `obr02-obr03-plan-preview` #3 y núcleo |
| 8 · `status=cancelled` rechazado sin tocar el plan canónico | `obr02-obr03-plan-preview` #5 y núcleo |
| 9 · OBR-01 (movimiento reducido y selección) y GOV-07 (recuperación WebGL) siguen funcionando | Suites OBR-01 en el árbol integrado y en el ensayo; suites GOV-07 en el ensayo |

## 5. Resultados

**Rama de integración**, todo local en Chromium con SwiftShader:

| Suite | Resultado |
|---|---|
| Núcleo OBR-02/03 | 14/14 |
| OBR-02/03 navegador + 6 combinadas | 16/16 |
| OBR-01 (5 archivos, incluida la de ciclo de vida de #207) | 14/14 |
| `ft3d-8-fidelity` | 6/6 |
| `ft3d-8-ux4d` | 20/20 |
| `ft3d-8-delivery` (grabación real) | 6/6 |
| `ft3d-8-dossier` | 6/6 |
| `ft3d-8-fit` | 9/9 |
| `ft3d-8-lab` | 2/2 |
| INT-R1 | 1/1 |
| Examen FT3D-8 | 20/20 |
| `hallazgos-v4` | 2/2 |
| `novato` | 2/2 |

**Ensayo local con #208** (`e2d0e84`, sin publicar):

| Suite | Resultado |
|---|---|
| GOV-07 núcleo | 10/10 |
| GOV-07 navegador (resiliencia y banco) | 25/25 |
| OBR-02/03 navegador + combinadas | 16/16 |
| OBR-01 | 14/14 |
| `ft3d-8-delivery` | 6/6 |
| Examen FT3D-8 | 20/20 |

**Detección:**
- la resolución ingenua del conflicto (sin el ciclo de vida de la vista previa) **falla** la prueba combinada 6;
- no se ha eliminado ni suavizado ninguna aserción.

CI de la PR: ver la propia PR.

## 6. Bloqueos y pendientes

- **GO visual del propietario** sobre este corte integrado: ver la Preview de revisión (§7).
- **#208 (GOV-07):** integración y CI propias de Claude A. Aquí solo se ha ensayado la combinación.
- **Dispositivos físicos:** todo se ha probado en Chromium sin GPU.
- **#210 sigue abierta** con su HEAD `5cb4a32`, como referencia. Esta rama la sustituye para la integración, si ChatGPT lo decide.

## 7. Preview de revisión

**Rama de revisión:** `review/obr02-obr03-integration-20261112` (`181e34b`). Desciende de esta rama y **no forma parte de la PR**.
- Solo añade `review-obr02/` y su generador `tests/obr02/build-review-fixture.cjs`.
- No cambia `.vercelignore`, no publica `labs/` y no toca Production.

**Datos:** la obra sintética del examen en la biblioteca local del navegador, en dos casos:
- **con** un presupuesto de **precios ficticios** (borrador real C1–C4) asignado a tareas del plan;
- **sin** presupuesto.

**URL:** `https://floorplan-3d-98fnb7d77-juanma-espinosas-projects.vercel.app/review-obr02/index.html` (protegida por Vercel: abrir con sesión o con enlace de acceso).

**Recorrido real sobre la Preview** (`tests/obr02/preview-walkthrough.cjs`; capturas y `manifest.json` en `docs/integration/evidencias-obr02-obr03-2026-11-12/`):

| Paso | Escritorio 1440×900 | Móvil 390×844 (toque) |
|---|---|---|
| Con presupuesto: 48,1 % planificado; coste planificado 5.499,32 € de 21.708,90 €; «Ejecutado: sin registrar»; siguiente tarea (05 y 07) y 3 elementos en fantasma | ✓ | ✓ |
| OBR-01 con el fantasma encendido: clic o toque real en el muro de carga → `project/wal_ref-w0` | ✓ | ✓ |
| Sin presupuesto: coste «No disponible», nunca 0 € | ✓ | ✓ |
| Errores de página / hosts externos | 0 / 0 | 0 / 0 |

**Observación de UX para el GO visual (no bloquea):** en el móvil, con «Siguiente tarea» desplegada, el panel ocupa buena parte del escenario. Por defecto está plegado y deja pasar los clics a la escena.

## 8. Procedencia verificable — auditoría del propietario del 13/11/2026

**Objeción del propietario:** la vista 4D es útil, pero no debe presentarse como fiel a la obra sin trazabilidad desde proyecto/plano → tareas WBS → elementos 3D → partidas C1–C4.

**Respuesta, sin autoridad nueva:** `FloorPlanPlanPreview.provenance()` ordena lo que el adaptador FT3D-8 **ya comprueba** (`FloorPlanConstructionProject.evaluate`: `links`, `coverage`, `fingerprints`, `planning`, `costs`, `delivery`). El panel «Plan a la fecha» lo muestra en la sección plegada **Fuentes y vínculos**.

| Criterio del propietario | Cómo queda |
|---|---|
| 1 · Procedencia de los datos | Por cada fuente, se muestra lo siguiente.<br>**Proyecto:** nombre, huella SHA-256 y origen **declarado** por quien abre la vista («FIXTURE de prueba…», «Proyecto guardado en tu biblioteca», «importado»).<br>**Plan:** identificador, nº de tareas, borrador o revisado, si se hizo **sobre esta revisión** del proyecto y origen declarado de las tareas.<br>**Presupuesto C1–C4:** identificador, comprobación de revisión («no verificable: C1–C4 no guarda la revisión»), origen de los precios, % del importe conocido asignado a tareas y partidas sin tarea.<br>**Vínculo profesional y nivel de la presentación.** |
| 2 · No inventar; planificado ≠ ejecutado | **Anillo:** «% del **calendario** del plan · planificado». Al final, «Fin del plan: no es obra terminada ni certificada».<br>**Coste:** «(supuesto: reparto lineal por días; no es gasto)».<br>**Ejecutado:** «sin registrar».<br>Sin presupuesto verificable, «No disponible», nunca 0. |
| 3 · Sin vínculo fiable, sin fantasma | El fantasma usa **solo** los vínculos que el adaptador marca `ok`. Antes de este cambio, usaba cualquier `elementId` del plan.<br>`broken` (no existe), `not-representable` e `illustrative` se listan con su motivo y **no se dibujan**.<br>Las tareas sin elementos y sin partidas se nombran. |
| 4 · Pruebas | Tarea → elementos 3D reales (selección y fantasma = vínculos `ok`).<br>Proyecto A → C sin fantasmas ni procedencia del anterior.<br>**Adversarial:** plan válido hecho sobre otra revisión y con un vínculo a un muro inexistente → avisos, sin fantasma y nivel «Vista interna exploratoria». |
| 5 · Demostración rotulada SINTÉTICA | En la Evolución: «DATOS SINTÉTICOS de prueba» cuando el origen declarado es una fixture.<br>En la Preview de revisión: aviso «DEMOSTRACIÓN SINTÉTICA», tabla de fuentes y vínculos y caso 3 adversarial.<br>Protocolo para un expediente real autorizado: §9. |

**Lo que esto no demuestra:** con datos sintéticos no se puede concluir ni la fidelidad a una obra real ni su falta. El dibujo técnico estilizado del 3D no equivale a una falta de correspondencia geométrica, y tampoco la prueba.

**Pruebas nuevas:**
- `tests/obr02-obr03-provenance.test.cjs` (6, núcleo):
  - coherente;
  - adversarial;
  - sin representación (la cubierta real del caso D) e ilustrativo;
  - sin plan, y plan o presupuesto de otro proyecto;
  - reparto incompleto;
  - no muta.
- `tests/obr02-obr03-provenance.browser.test.cjs` (6):
  - fuentes;
  - fin del plan;
  - adversarial en la Evolución;
  - A → C;
  - selección de tareas;
  - móvil 390×844.

**Pruebas existentes:** solo se precisaron selectores (ahora hay dos secciones plegables) y el texto del anillo al nuevo rótulo. No se suavizó ninguna aserción.

## 9. Protocolo de prueba con un expediente real autorizado (pendiente de que exista)

No se ha usado ningún dato real. Cuando el propietario autorice un expediente:

1. **Autorización y custodia:**
   - autorización escrita del titular;
   - los datos se cargan **solo en la biblioteca local** de un navegador de prueba;
   - no se suben al repositorio, ni a una Preview, ni a una captura sin anonimizar.
2. **Entradas:**
   - proyecto RUBIK dibujado desde los planos del expediente, con su escala verificada (dos cotas);
   - plan WBS del profesional, con `task.source` apuntando al documento (p. ej. «Planning v3, 2026-10-02»);
   - presupuesto C1–C4 con el origen real de los precios;
   - vínculo profesional (`binding`) que fije las huellas de proyecto, plan y presupuesto.
3. **Comprobaciones en «Fuentes y vínculos»:**
   - huella del proyecto = la del vínculo;
   - plan «hecho sobre esta revisión»;
   - ningún vínculo `broken`;
   - lista de tareas sin elementos o sin partidas revisada con el profesional (¿falta modelar o no aplica?);
   - % del importe asignado a tareas;
   - nivel de presentación declarado.
4. **Contraste humano:** para 3 tareas, comparar con el documento original:
   - elementos resaltados en 3D;
   - fechas;
   - partidas e importe asignado.
5. **Adversarial con el expediente:**
   - modificar una cota del proyecto: el plan pasa a «otra revisión»;
   - citar un elemento borrado: aparece `broken`.
6. **Resultado:** acta con la huella del proyecto (no los datos) y la firma del profesional. Solo entonces cabría hablar de fidelidad documental de ese expediente.
