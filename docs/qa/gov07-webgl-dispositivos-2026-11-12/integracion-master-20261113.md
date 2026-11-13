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

**Pruebas** (`tests/gov07-early-loss.browser.test.cjs`): **4/4** aquí y **0/3** de las tres primeras en `d451c23`. La cuarta cubre el caso de #211.

| Prueba | Qué comprueba |
|---|---|
| Contrato | Paridad automática de nombres y tipos; `dispose` idempotente; preferencia de movimiento en vivo |
| Perdido al crear y recuperado | Aviso correcto; el plan sigue; la casa aparece **encuadrada** y en el mismo momento del plan; una pérdida posterior se avisa y se recupera; un clic = una selección; **0 errores** |
| Perdido al crear sin vuelta | «Recargar la vista» tras el plazo; recuperación tardía correcta |
| Asignaciones de otros módulos | Un envoltorio de `renderNow` puesto mientras espera se llama una vez tras recuperar, sin recursión |

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

**Árbol combinado con #211** (`fb61291` + `e2d5de8`):

| Suite | Resultado |
|---|---|
| `obr02-obr03-plan-preview-core` | 14/14 |
| `obr02-obr03-plan-preview` | 10/10 |
| `obr02-obr03-integration` | 6/6 |
| `gov07-early-loss` | 4/4 |
| `gov07-bench` | 2/2 |
| OBR-01 `ex05` | 4/4 |
| `gov07-evolution-resilience` | **22/23 · EN INVESTIGACIÓN** |

En `gov07-evolution-resilience` falló la prueba 14, «contexto perdido durante la reproducción». Corría con tres suites de navegador en paralelo; se repite aislada para separar la carga de una interacción real con la vista previa de #211. El resultado queda en este documento.

## 6. Riesgos y límites

- **Escena diferida:** solo actúa cuando el contexto llega **ya perdido** al crear la escena; el camino normal no cambia.
  - Si el navegador no dispara la recuperación (por ejemplo, un contexto creado perdido sin evento), la persona ve «Recargar la vista». Es lo honesto.
- **Estado reaplicado:** el **último** valor de cada operación de estado. La cámara no se copia, porque mientras se espera no hay una pose real: se vuelve a encuadrar.
- **Sin hardware real.** Nada de esto sustituye la matriz física, que sigue pendiente.
