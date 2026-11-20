# OP-05 · P3/P4 — HANDOFF de laboratorio (20/11/2026)

> **Estado:** candidata de laboratorio con el **cierre diferencial P4** (residuales A/B/C de ChatGPT y los de su dictamen posterior), detenida antes de P5.
> - **C1 NO-GO:** no hay persistencia de GLB, descriptores ni referencias de OP-05.
> - No está integrada, disponible ni activada.
> - Pendiente de auditoría de ChatGPT y validación de Codex.

## 1. Identidad

| Qué | Valor |
|---|---|
| Rama | `claude/op05-lab-p3p4`. HEAD y árbol: los verificados en remoto al publicar (§4.3) |
| Origen | P1/P2 `56c9f203` → diagnóstico `70ff5106` → este corte. La rama `claude/op05-lab-p1p2` no se ha tocado |
| Base de producto | master `8e917e1a` (la de P1/P2). El diagnóstico se leyó sobre `130ba24d` |
| Autorización | GO del propietario tras el cierre P0 de OP-07 v5 y la revisión de P1/P2 de Codex (`rubik-sculpt-simulator-lab@7fbbad55`, `CIERRE-P0-V5-Y-RELEVO-OP05`) |

**Commits:**

| Commit | Corte |
|---|---|
| `4ec0dac4` | Hallazgos de Codex sobre P1/P2 |
| `8df345fe` | P3/P4 |
| `4a47f3e8` | Este HANDOFF y las evidencias |
| `1755e6db` | Residuales A/B/C (en curso) |
| siguiente | Cierre P4: grabador, mirror pilot, documento de escena y exportación Blender, prueba de grabación endurecida, contrato V1 reconciliado |

## 2. Hallazgos de Codex sobre P1/P2 (resueltos antes de conectar el visor)

1. **P1:** tipo, límite F3 (8 MiB) y longitud declarada se validan **antes de copiar** (`loadPrivateModel`, y `loadVerifiedBytes` con `expectedBytes`). La copia que llega a decodificación se vuelve a hashear e inspeccionar.
2. **P2:** el texto se acota en **bruto** y se conserva el valor recortado. El título también queda acotado.

`labs/sculpt/op-05/p12-findings.test.mjs` es la sonda de Codex con el resultado invertido. Sobre `56c9f203` da **0/2**; aquí da **2/2**.

## 3. P3 · Resolución privada en el visor

- **`index.html`**, en `loadFurnitureAsset`: una rama privada **antes** de `assetRef`.
  - Reutiliza la cola `assetQueue` (máximo 2 cargas a la vez), `assetGeneration`, `cancelFurnitureAssets` y `buildFurn` (que también libera la escena privada).
  - Reutiliza `parseVerified`/`loadPrivateModel` de P1, sin un segundo GLTFLoader.
  - El modelo se coloca con las **cotas canónicas** del objeto. Escala física: **no certificada**.
  - Una carga tardía (otra generación, otro grupo u **otro proyecto**) se libera y nunca entra en la escena.
- **Proveedor de laboratorio** `labs/sculpt/op-05/private-view-lab.mjs`, solo en memoria; el producto nunca lo carga:
  - Una concesión está ligada a `(project.id, modelId)` y exige que ese proyecto tenga la referencia y la ficha con derechos del núcleo P2. **El SHA-256 no concede acceso.**
  - La extensión P2 vive en una **capa en memoria por `project.id`** y nunca entra en el documento del editor. Así, `save()`, la biblioteca, F0 y las exportaciones no pueden persistirla ni llevarla consigo (C1 por construcción).

## 4. P4 · Privacidad efectiva: guarda genérica en tres capas, que falla cerrado

1. **API de salida del visor** (`shot`, `deliveryShot`, `presentationCapture`, `captureScene`): mientras corren, el modelo privado se **retira** de la escena. Cubre las llamadas asíncronas, concurrentes, con error o canceladas (contador y `finally`).
2. **Cada `renderer.render`:** el privado solo se dibuja si no hay salida en curso ni una pista grabada viva.
3. **Lectores de píxeles del canvas:**
   - `captureStream` repinta en genérico antes de entregar la pista y bloquea el privado mientras siga viva;
   - `toDataURL`, `toBlob` y `readPixels` **lanzan un error** si el privado está presente, de modo que un consumidor desconocido nunca recibe sus píxeles.
- **Coste cero sin el módulo de laboratorio:** el producto se comporta como la base.
- **Capturas:** una salida nunca se prepara con el privado visible, así que no hay imágenes ni vídeos privados que reutilizar.
- **Documentos:** la referencia nunca está en el proyecto (§3). Para un proyecto compuesto, `minimize()` de P2 sigue fallando cerrado por destino y rechazando `private-expediente`.

## 5. Pruebas (Chromium 1243 y Node 22.23, Linux, este contenedor)

| Prueba | Resultado | Qué acredita |
|---|---|---|
| `tests/op05-p3p4.browser.test.cjs` · P3 visor | PASS | Modelo sintético (pirámide magenta, **textura JPEG decodificada**) visible en el visor de laboratorio; proyecto intacto; nada persistido; OP-02 en reposo (0 fotogramas) |
| · P3 negativos | PASS | Longitud incorrecta rechazada; sin concesión → `not-granted-for-this-project`; otro proyecto → genérico; bytes alterados → genérico «huella» |
| · P3 cancelación y generación | PASS | Dos reconstrucciones seguidas sin duplicados; mover y rotar conserva la representación; desactivar → genérico |
| · P4 salidas reales | PASS | **Imagen descargada** de `shot`, `deliveryShot`, **GLB de `captureScene`** (mallas del objeto idénticas al genérico), salidas concurrentes y canceladas, **fotogramas de la pista grabada** (`MediaStreamTrackProcessor` sobre la misma pista que el `MediaRecorder`), **JSON exportado** y almacenamiento sin nada de OP-05; lector desconocido → error. Marcadores: píxeles magenta (resistentes a JPEG) y geometría |
| P4 con la guarda **desactivada** | **FAIL esperado** | La prueba discrimina |
| `p1`, `p2`, `p12-findings` y `admission` (laboratorio) | 22/22 | P1/P2 conservados con los dos hallazgos |
| Suite pura completa | 1534 pruebas, 0 fallos (tras retirar de `index.html` la mención a `labs/`; los guardas de gobierno R02-A/R03 la detectaron) | Sin regresiones |
| Consumidores: assets, catalog-placement, scene-export, project-views, presentation, presentation-batch, tour-recorder, tour-video, client-share, delivery-image, op02-render-demand | Equivalente a la base | El único FAIL estable (R3 M11 a 1440×900) **también falla en la base** `56c9f203` con la misma carga. Por separado pasa |

**Límites:**
- Solo Chromium en Linux; faltan Firefox, WebKit y dispositivos.
- Este Chromium sin interfaz no decodifica WebM, así que los fotogramas grabados se leen de la pista del grabador y no del archivo.
- Presentación por lotes: cubierta desde el cierre P4 con el ZIP real (§5bis).

## 5bis. Cierre diferencial P4 (sobre `4a47f3e8`)

### Qué se corrige

| Residual | Antes (reproducido en `4a47f3e8`) | Corrección |
|---|---|---|
| **OP05-A · grabador real** (`FloorPlanTourRecorder.record`, compositor 2D propio con `drawImage`) | Fotogramas grabados con el privado; la presentación en vivo lo mostraba | `privateAllowed()` exige además `!FloorPlanPresentation.active` y `!FloorPlanTourRecorder.busy`. Presentación y grabación son salidas durante **toda** su vida: preparación, composición, grabación, error, cancelación y restauración |
| **OP05-B · fotograma antiguo** (`preserveDrawingBuffer:true`) | Tras cambiar la representación sin un render nuevo, el canvas seguía teniendo el fotograma privado | El wrapper de render anota si el último fotograma del canvas era privado, y los render targets pintados con el privado (`WeakSet`). Antes de cualquier lector conocido: si ya no está autorizado, **se repinta en genérico de forma síncrona**; si sigue autorizado, la lectura **lanza un error** |
| **OP05-C · revocación** | `revokeAll` solo vaciaba los mapas; el modelo cargado seguía en la escena | `revokeAll` reconstruye el mobiliario (cancela cargas y libera las escenas privadas). Cada fotograma y cada carga resuelta exigen la **concesión vigente** de su `(proyecto, modelo)` |
| **`measureMirrorPilot`** (QA, devuelve `reflection` y `preview`) | Salida no cubierta | Pasa por la misma `genericOutput`. La envoltura va **después** de su definición: en el bucle de las otras cuatro el `typeof` la habría saltado en silencio |
| **`captureScene` en la prueba concurrente** | Salía con `-1`, sin inspeccionar | Se inspeccionan el documento, su GLB y el **ZIP real de Blender** (`RubikSceneExport.prepare`, el camino de la interfaz). Ver abajo |

**Lectores cubiertos:**
- `toDataURL`, `toBlob`, `captureStream`, `readPixels`;
- `drawImage` 2D y Offscreen, `createImageBitmap`, `texImage2D`/`texSubImage2D` con el canvas del visor como origen;
- `readRenderTargetPixels(Async)`.

**No es una protección universal de los píxeles.** Las capturas de pantalla del sistema operativo, compartir pantalla y cualquier API no enumerada quedan fuera del alcance de una página.

### Pruebas (Chromium 1243 y Node 22.23, Linux, este contenedor)

| Prueba | Resultado |
|---|---|
| `tests/op05-p4-residuals.browser.test.cjs` (nueva, 5) | **5/5** |
| `tests/op05-p3p4.browser.test.cjs` (4) | **4/4** |
| Las dos juntas | **9/9** tres veces: dos en serie y una con carga paralela |
| Antes, sobre `4a47f3e8` | A, B y C **FAIL** (reproducidos) |
| Con `genericOutput` desactivada (sonda) | Prueba concurrente y `measureMirrorPilot` **FAIL**: discriminan |
| Laboratorio `p1`, `p2`, `p12-findings` y `admission` | 22/22 |
| Suite pura | 1511/1513, 0 fallos, 2 omitidas |

Qué cubre cada prueba de `op05-p4-residuals`:
- **OP05-A:** presentación en vivo sin el privado. `FloorPlanTourRecorder.record` real, leyendo **los fotogramas del compositor** (`MediaStreamTrackProcessor` sobre la pista que recibe el `MediaRecorder`): ≥3 fotogramas y ningún píxel privado. Cancelación a mitad: sigue genérico. Al salir de la presentación vuelve el privado (control positivo, sondeado hasta 10 s con el mismo umbral).
- **OP05-B:** con el privado autorizado, `toDataURL`, `drawImage`, Offscreen y `createImageBitmap` se rechazan. Tras `disable()` **sin render intermedio**, `toDataURL` y `drawImage` salen genéricos. `deliveryShot` justo tras un fotograma privado sale genérico.
- **OP05-C:**
  - revocar con el modelo visible: el siguiente lector ya es genérico y `privateState().scenes === 0`;
  - revocar durante una carga: nunca entra;
  - desactivar, revocar y reactivar sin concesión: nada;
  - concesión de otro proyecto: nada.
- **Complementaria:**
  - tres `deliveryShot` concurrentes con `captureScene` y la **exportación real de Blender**: cada imagen genérica;
  - documento, GLB y GLB del ZIP con la **geometría del objeto idéntica** a la referencia genérica tomada antes de la concesión;
  - en documento, GLB y **cada entrada del ZIP**, ninguno de: `modelId`, SHA-256, título, atribución, huella de evidencia, `x-op05`, `pmd_`, `project-private`, `privateScene` ni `op05-generic`;
  - ZIP real de presentación por lotes: PNG genéricos, manifiesto con vistas y sin secretos.
- **`measureMirrorPilot`:** el privado, delante del espejo y visible en la cámara de la medición (control positivo), no aparece ni en el reflejo (render target) ni en la vista previa.

**Prueba de grabación (P4 de `op05-p3p4`) endurecida, no relajada.** Fallaba 2 de 4 veces con `frames:1`.
- **Causa medida:** con carga, 15 invalidaciones producían 2 o 3 renders reales (OP-02 las agrupa) y `captureStream` solo emite al pintarse el canvas.
- **Ahora:** fuerza renders hasta leer **al menos 4 fotogramas reales** de la pista, con un plazo de 8 s. Si no los obtiene, **falla**. La ausencia de fotogramas nunca se da por ausencia de fuga.

### Consumidores (en serie, sin la carga del laboratorio)

| Suite | Resultado | Base `4a47f3e8` |
|---|---|---|
| mirror-pilot | 1/1 | |
| tour-recorder | 4/4 tras reconciliar el contrato (antes 3/4) | **3/4, el mismo fallo** |
| tour-recorder-ci, tour-video | 1/1, 2/2 | |
| presentation, presentation-batch | 58/58, 9/9 | |
| op02-render-demand, delivery-image, project-views | 3/3, 4/4, 2/2 | |
| assets, catalog-placement, client-share | 25/25, 2/2, 2/2 | |
| scene-export | 6/7 | **6/7, el mismo fallo** (n.º 3: dos exportaciones sucesivas con bytes distintos). Residual de determinismo **preexistente**, fuera de OP-05; se reporta a Codex sin tocarlo |

**Contrato V1 reconciliado en `tour-recorder`.** La prueba histórica exigía cero textos de grabación porque esa interfaz no existía. El elemento concreto es `BUTTON#presentationVideo` «Grabar vídeo» en `#presentationTools`, la entrada V2 de `js/tour-video-ui.js`, idéntica en la base. La garantía se conserva más precisa: tras una grabación por API solo queda visible **esa** entrada, inactiva y habilitada, sin otro texto, estado ni diálogo de grabación.

### Plan de integración (no ejecutado)

1. Codex: Firefox, WebKit y Windows sobre esta rama, con las dos suites OP-05 y los consumidores.
2. La guarda es inerte sin `window.RubikPrivateView`: el producto se comporta como la base. Los parches de prototipo (`drawImage`, `createImageBitmap`, `texImage2D`) cuestan una comparación de referencia por llamada.
3. P5 (interfaz Amueblar → importar), P6/P7 (F0.2c/F0.3, persistencia) y P8 (activación con A0) siguen sin autorizar. **C1 NO-GO.**

## 6. Evidencias visuales

En `labs/sculpt/op-05/evidence-p3p4/`:
- `00-generico-visor.webp`: el visor sin modelo privado;
- `01-privado-visor-laboratorio.webp`: la pirámide magenta en el visor de laboratorio;
- `02-salida-deliveryShot-generica.webp`: la salida real del mismo instante, solo con el genérico.

## 7. Superficies (protocolo §4.1)

- **HOME:** sin anuncio.
- **PLATAFORMA:** sin acceso. P5 (Amueblar → importar) no está autorizado.
- **ENTREGABLES:** todas las salidas comprobadas llevan la representación genérica.
- **Consumidores:**
  - Blender, imágenes, presentación, vídeo, cliente (`client-delivery` ya elimina las extensiones) y JSON: **genéricos y probados**.
  - DXF, presupuesto y láminas: usan el objeto canónico, sin la extensión.
  - Studio y FF&E: consumidores futuros.
- **Contrato mínimo para Codex y CC1:** un consumidor que no esté en el modo privado del visor nunca recibe geometría ni píxeles privados.

## 8. Rollback

- Rama de laboratorio: basta con no usarla.
- Revertir `8df345fe` deja P1/P2 con los dos hallazgos corregidos; revertir también `4ec0dac4` vuelve a `56c9f203`.

## 9. Dictamen de seguridad

En el alcance probado (Chromium Linux) no se observa ninguna fuga visual, geométrica, binaria ni documental. Los negativos discriminan y lo desconocido falla cerrado.

**NO-GO** para P5, P6/P7 (F0.2c/F0.3), P8 (A0) y producto.

Siguiente actuación: auditoría independiente de ChatGPT y validación de Codex sobre el cierre P4 (§5bis).
