# GOV-07 — Integración con el `master` vigente (13/11/2026)

**Rama:** `integration/gov07-webgl-20261113`, creada desde `master@8d9cb7b`, que ya incluye #207 (OBR-01) y #201 (ENT-01).
**Qué contiene:**
1. Un *merge* de #208 (`e2d0e84`) sin cambios, de modo que se puede deshacer con `git revert -m 1`.
2. Dos correcciones nuevas, en archivos de GOV-07.
3. Este documento.

La rama de #208 no se toca. GOV-07 sigue **PARCIAL** hasta la matriz física.

## 1. Fusión

- `git merge --no-ff e2d0e84` sobre `8d9cb7b` es **limpio**: ningún conflicto de texto.
- #207 y #208 comparten la Evolución, pero por zonas distintas:
  - #207 cambia `project-scene.js` (ciclo de vida, preferencia de movimiento, selección);
  - #208 cambia `gl-guard.js`, `gantt-view.js` y unas líneas de `fidelity-app.js`.
- Las correcciones de #207 se conservan íntegras: `project-scene.js` queda idéntico al de `master`.

## 2. Hallazgos de la revisión (Claude B, sin publicar) y lo que se hizo

### H1 · Contrato de la escena «sin WebGL»

- **Comprobado.** #207 añadió a la escena real `reducedMotion`, `autoRotating`, `disposed` y un `dispose()` idempotente. La escena nula de #208 no los tenía.
- **Impacto hoy:** ninguno visible, porque ningún módulo de la app los lee. Sí los usan las pruebas de OBR-01 y quien llame a la escena en el futuro.
- **Corrección** (`evolucion/gl-guard.js`). La escena nula ofrece:
  - la preferencia de movimiento en vivo;
  - `autoRotating:false`;
  - `disposed` con `dispose()` idempotente.
- **Prueba:** compara **automáticamente** los nombres y tipos de las dos escenas. Si la escena real gana una propiedad, avisa.

### H2 · Contexto perdido antes del primer fotograma

**Reproducido.** Se probó con una escena aislada y con la Evolución real; el contexto del visor se pierde en cuanto Three lo pide.

| Caso | Antes (`d451c23` = master + #208) |
|---|---|
| Contexto perdido **al crear** la escena | Three falla al crearla (`Cannot read properties of null (reading 'precision')`). La app lo toma por «sin WebGL» y muestra **un aviso falso**: «Este navegador no puede mostrar la vista 3D». |
| … y el contexto vuelve | El renderer a medio crear sigue escuchando en el lienzo y lanza **una excepción no capturada** (`reading 'autoReset'`) en esa y en **cada** recuperación posterior. La vista queda muerta hasta recargar. |
| Pérdida justo después de crear, o con el lienzo oculto | Ya funcionaba: se recupera. |

**Impacto:** real en móviles y en equipos con muchas pestañas. Si la GPU está reclamada justo al abrir la Evolución, la persona ve un mensaje equivocado y pierde el 3D aunque el navegador lo recupere.

**Corrección**, solo en `evolucion/gl-guard.js` (`project-scene.js`, compartido con #211, **no se toca**):

1. `createSceneSafely` anota lo que el intento de creación registra en el lienzo y, si falla, **lo retira**. Así no queda nada a medio crear.
2. Si WebGL existe pero el contexto está perdido, la app recibe una **escena diferida** con la misma identidad (`fidelity-app` guarda `scene` una sola vez):
   - mientras espera, se comporta como la escena nula;
   - al volver el contexto, crea la escena real en el **mismo** lienzo;
   - le aplica el estado de la app (cubierta, planta, inventario, momento del plan, resaltado, vista previa, giro automático y suspensión);
   - pide a la app que encuadre de nuevo.
3. La guarda dice **«Vista 3D interrumpida»** (no «sin WebGL»). Si el contexto no vuelve en el plazo, ofrece **«Recargar la vista»**. Si vuelve tarde, la vista se completa igualmente y el aviso se retira. Desde ese momento delega en la guarda normal: avisa de las pérdidas siguientes, degrada y adapta el DPR.
4. Lo que otros módulos asignan a la escena mientras espera vive en la fachada de la escena diferida, y vale igual antes y después de que llegue la real. Por ejemplo, #211 envuelve `renderNow` para quitar el fantasma del vídeo. Reaplicarlo a la escena real habría hecho que el envoltorio se llamara a sí mismo; perderlo habría dejado el fantasma en el vídeo para el cliente.

**Pruebas** (`tests/gov07-early-loss.browser.test.cjs`): **7/7** aquí. Las tres primeras dan **0/3** en `d451c23`; la cuarta cubre el caso de #211, la quinta H3 y las dos últimas H4.

| Prueba | Qué comprueba |
|---|---|
| Contrato | Paridad automática de nombres y tipos; `dispose` idempotente; preferencia de movimiento en vivo |
| Perdido al crear y recuperado | Aviso correcto; el plan sigue; la casa aparece **encuadrada** y en el mismo momento del plan; una pérdida posterior se avisa y se recupera; un clic = una selección; **0 errores** |
| Perdido al crear sin vuelta | «Recargar la vista» tras el plazo; recuperación tardía correcta |
| Asignaciones de otros módulos | Un envoltorio de `renderNow` puesto mientras espera se llama una vez tras recuperar, sin recursión |

### H3 · Dibujar con el contexto ya perdido (encontrado en el ensayo con #211)

**Síntoma.** De forma intermitente, `Cannot read properties of null (reading 'trim')` durante una pérdida de contexto mientras se reproduce. Pila: `WebGLProgram.getUniforms → onFirstUse → getProgramInfoLog(...).trim()`.

**Causa.**
- El contexto se pierde al instante, pero el evento `webglcontextlost` llega en otra tarea.
- Si en ese hueco un cuadro necesita compilar un material nuevo, Three r160 lo compila sobre el contexto perdido y, al usarlo, `getProgramInfoLog()` devuelve `null`.
- La vista previa de #211 compila materiales al reproducir. Medido, con 30 pérdidas en cada caso:
  - **con #211: 2 de 15;**
  - **sin #211: 0 de 30.**
- Un reinicio real de la GPU produce el mismo hueco, con o sin #211.

**Corrección** (en `gl-guard.js`, que ya envuelve `renderer.render`): no se dibuja mientras `gl.isContextLost()`. **Con #211: 0 de 30.**

**Prueba determinista:** se pierde el contexto y, en la misma tarea, se obliga a recompilar todos los materiales y se dibuja. **Falla sin la corrección**, con ese mismo `TypeError`, y **pasa con ella**.

### H4 · Vista destruida antes de recuperar el contexto (auditoría de ChatGPT sobre #213, 13/11)

**Comprobado, tal como describía la auditoría.** Si la escena diferida y su guarda se destruyen mientras el contexto sigue perdido, al volver el contexto:

| Medido en `09dd9ff` (5 ciclos, banco aislado) | Valor por ciclo |
|---|---|
| Escenas reales creadas sobre una vista destruida | **1** |
| Avisos «cuando esté lista» que llegan tarde | **1** |
| Guarda re-enganchada (aviso, velo y chip en el visor) | **3 nodos** |
| Escuchadores vivos en el lienzo | **9** |
| Llamadas a `requestAnimationFrame` en 400 ms | **48** (bucle de la escena y bucle de la guarda) |
| `scene.disposed` | `false` |

**Causa** (`evolucion/gl-guard.js`):
- los dos escuchadores de la escena diferida (`webglcontextlost`, `webglcontextrestored`) solo se retiraban al recuperar;
- `dispose()` de la fachada llegaba a la escena nula, que solo marcaba `disposed`: no limpiaba los avisos pendientes, el estado por reaplicar ni las asignaciones;
- `onRestored` no miraba si la vista ya estaba destruida;
- `dispose()` de la guarda diferida retiraba el aviso y el temporizador, pero su aviso «cuando esté lista» seguía apuntado y volvía a llamar a `attachGlGuard`.

**Corrección**, solo en `gl-guard.js` (`project-scene.js` no se toca):
1. La escena diferida tiene su propio `dispose()` idempotente: retira los dos escuchadores; olvida los avisos pendientes, el estado por reaplicar, las asignaciones y `onResize`; y destruye la escena que tenga dentro (la real, si ya existe). `disposed` refleja ese estado.
2. `onRestored` no hace nada si la vista ya está destruida.
3. `whenReady(fn)` devuelve una función para darse de baja. Tras `dispose()` no apunta nada.
4. Tras `dispose()` se ignoran las asignaciones nuevas.
5. La guarda diferida, al destruirse, se da de baja de `whenReady` y queda cerrada: un aviso tardío no vuelve a enganchar la guarda. Además retira `aria-describedby` si apuntaba a su aviso, y su temporizador se detiene si la escena ya está destruida.
6. Robustez: el estado que se reaplica a la escena real se llama solo si la escena real tiene esa operación (`s[k]?.(…)`).

**Pruebas** (`tests/gov07-early-loss.browser.test.cjs`, en un banco aislado sin la app, para que cualquier `requestAnimationFrame` sea de la escena o de la guarda):

| Prueba | En `09dd9ff` | Con la corrección |
|---|---|---|
| Destruir escena y guarda **antes** de recuperar, 5 ciclos: 0 creaciones, 0 avisos tardíos, 0 nodos en el visor, 0 escuchadores, 0 `requestAnimationFrame`, sin `aria-describedby`, `disposed` | **Falla** en el ciclo 1 (valores de la tabla de arriba) | **Pasa** los 5 ciclos |
| Control: sin destruir, recuperar crea la escena real **una** vez, avisa una vez, la guarda pasa a `ok` y la escena dibuja; destruir después lo para todo (0 `requestAnimationFrame`, 0 nodos) | Pasa | Pasa |

En las dos pruebas, el contexto vuelve de verdad (se comprueba el evento `webglcontextrestored`): el caso no pasa por no haberse producido.

## 3. Ensayo con #211 (OBR-02/03, Claude B), local y sin publicar

- **Árbol:** `fb61291` + #211 (`e2d5de8`). Fusión **limpia**: `fidelity-app.js` se combina solo.
- **Hallazgo:** #211 añade a la escena real `setPreview()` y `preview`. La prueba de contrato los detectó en el árbol combinado.
  - #211 los llama de forma defensiva (`scene?.setPreview?`), así que no había `TypeError`, pero el contrato se separaba.
  - La escena nula ya ofrece `setPreview()→0` y `preview` (inocuo antes de #211), y la escena diferida reaplica la vista previa.
- **Resultados en el árbol combinado:** §5.
- **Rama de #211:** no se modifica.

## 4. Regresión en esta rama

Local, Chromium con SwiftShader y cada suite aislada. Ver §5.

## 5. Resultados

**Esta rama** (local, cada suite aislada):

| Suite | Resultado |
|---|---|
| `gov07-quality-core` | 10/10 |
| `gov07-early-loss` (nueva) | 4/4 |
| `gov07-evolution-resilience` | 23/23 |
| `gov07-bench` | 2/2 |
| `gov07-cross-browser` | 1/1 |
| OBR-01 `ex05` | 4/4 |
| OBR-01 `ex09` | 3/3 |
| OBR-01 `ex11` | 4/4 |
| OBR-01 `qa22` | 2/2 |
| OBR-01 `scene-lifecycle` | 1/1 |
| `ent01-delivery-api` | 7/7 |
| `ent01-preview-unit` | 3/3 |
| `ent01-preview` (navegador) | 3/3 |
| `brand-core` | 3/3 |
| `brand.browser` | 3/3 |
| `ft3d-8-lab` (Node) | 10/10 |
| `ft3d-8-fidelity` | 6/6 |
| `ft3d-8-fit` | 9/9 |
| `ft3d-8-lab` (navegador) | 2/2 |
| INT-R1 | 1/1 |
| `ft3d-8-ux4d` | 19/20 |
| `ft3d-8-delivery` | 4/6 |
| `ft3d-8-dossier` | 5/6 |

Los fallos de `ux4d` 14, `delivery` 1 y 4 y `dossier` 5 son los de vídeo MP4: este Chromium no tiene codificador H.264. **Se reproducen idénticos en `master@8d9cb7b`**, comprobado con las mismas suites en un árbol de `master`; en CI usan su propio Chromium.

**Árbol combinado con #211**: rama + `e2d5de8`, local y sin publicar. Fusión limpia.

| Suite | Resultado |
|---|---|
| `obr02-obr03-plan-preview-core` | 14/14 |
| `obr02-obr03-plan-preview` | 10/10 |
| `obr02-obr03-integration` | 6/6 |
| `gov07-early-loss` | 5/5 |
| `gov07-evolution-resilience` | **23/23 en tres ejecuciones seguidas** |
| `gov07-bench` | 2/2 |
| OBR-01 `ex05` | 4/4 |
| OBR-01 `ex11` | 4/4 |
| OBR-01 `scene-lifecycle` | 1/1 |
| `ft3d-8-fidelity` | 6/6 |
| INT-R1 | 1/1 |

Antes de H3, `gov07-evolution-resilience` fallaba de forma intermitente (22/23) por el error descrito en §2 · H3.

**Tras H3, en la rama** (cabeza `e5cb394`):

| Suite | Resultado |
|---|---|
| `gov07-quality-core` | 10/10 |
| `gov07-early-loss` | 5/5 |
| `gov07-evolution-resilience` | 23/23 |
| `gov07-bench` | 2/2 |
| `gov07-cross-browser` | 1/1 |
| OBR-01 `ex11` | 4/4 |
| OBR-01 `scene-lifecycle` | 1/1 |
| OBR-01 `ex05` | 4/4 |
| INT-R1 | 1/1 |

**Tras H4, en la rama** (local, Chromium con SwiftShader, cada suite aislada):

| Suite | Resultado |
|---|---|
| `gov07-quality-core` | 10/10 |
| `gov07-early-loss` | **7/7** (las 2 nuevas de H4 incluidas) |
| `gov07-evolution-resilience` | 23/23 |
| `gov07-bench` | 2/2 |
| `gov07-cross-browser` | 1/1 |
| OBR-01 `ex05` · `ex09` · `ex11` · `qa22` · `scene-lifecycle` | 4/4 · 3/3 · 4/4 · 2/2 · 1/1 |
| `ent01-preview` (navegador) | 3/3 |
| `ft3d-8-fidelity` · `ft3d-8-fit` | 6/6 · 9/9 |
| INT-R1 | 1/1 |

**Tras H4, árbol combinado con #211** (rama + `e2d5de8`, fusión limpia, local y **sin publicar**; la rama de #211 no se toca):

| Suite | Resultado |
|---|---|
| `obr02-obr03-plan-preview-core` | 14/14 |
| `obr02-obr03-plan-preview` | 10/10 |
| `obr02-obr03-integration` | 6/6 |
| `gov07-early-loss` | 7/7: incluye el envoltorio de `renderNow` de #211 y `setPreview` tras recuperar |
| `gov07-evolution-resilience` | **23/23 en tres ejecuciones seguidas** |
| `gov07-bench` | 2/2 |
| OBR-01 `ex05` · `ex11` · `scene-lifecycle` | 4/4 · 4/4 · 1/1 |
| `ft3d-8-fidelity` | 6/6 |
| INT-R1 | 1/1 |

## 6. Riesgos y límites

- **Escena diferida:** solo actúa cuando el contexto llega **ya perdido** al crear la escena; el camino normal no cambia.
  - Si el navegador no dispara la recuperación (por ejemplo, un contexto creado perdido sin evento), la persona ve «Recargar la vista». Es lo honesto.
- **Estado reaplicado:** el **último** valor de cada operación de estado. La cámara no se copia, porque mientras se espera no hay una pose real: se vuelve a encuadrar.
- **Ciclo de vida (H4):** destruir la vista mientras el contexto está perdido ya no deja nada vivo. Si se destruye solo la guarda, la escena puede seguir y crearse al volver el contexto: eso lo decide su dueño, que debe destruirla también.
- **Sin hardware real.** Nada de esto sustituye la matriz física, que sigue pendiente.
