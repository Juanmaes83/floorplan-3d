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

RESULTADOS

## 6. Bloqueos y pendientes

- **GO visual del propietario** sobre este corte integrado: ver la Preview de revisión (§7).
- **#208 (GOV-07):** integración y CI propias de Claude A. Aquí solo se ha ensayado la combinación.
- **Dispositivos físicos:** todo se ha probado en Chromium sin GPU.
- **#210 sigue abierta** con su HEAD `5cb4a32`, como referencia. Esta rama la sustituye para la integración, si ChatGPT lo decide.

## 7. Preview de revisión

PREVIEW
