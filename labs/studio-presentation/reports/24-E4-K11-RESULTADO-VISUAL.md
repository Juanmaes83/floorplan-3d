# 24 · Studio E4 / K11 / IMG-12 / ENT-05: primer corte, resultado visual trazable (laboratorio)

**Fecha:** 20/11/2026. **Mandato:** «RUBIK SOTA — CC1 · STUDIO E4 / K11 / K12 / ENT-05».

**Rama propia:** `lab/studio-e4-k11`.

**Referencias (HEAD comprobados antes de empezar):**

| Referencia | SHA | Nota |
|---|---|---|
| Base | `78a43dc3ece1d4460b7caebfa0278563f5977649` | Cierre E3 acreditado. **E3 no se modifica** |
| Candidata E3 de Codex | `64f8837f93a4bfe70238461cf9b9df09d8f78bab` | `codex/studio-e3-integracion`. Aporta `takeId` y el `FloorPlanImages.get` sin creación |
| Master | `4ea7cb3bb72e6c3bdd9a176cb08bd9e41b8866f2` | #275 fusionada |

**Ámbito:**
- Solo `labs/studio-presentation/`.
- No toca master, la candidata de Codex, F0, C6, servicios IA, datos reales ni emisión.
- **Ninguna llamada a un proveedor IA real.** Ningún escritor productivo nuevo.

**Orden del mandato:** este es el paso 4 (publicar K11 para auditoría). K12, Architecture Book y FF&E (pasos 5–6) **no se empiezan** hasta conocer el dictamen sobre K11, porque dependen de su contrato.

## 1. Contraste con el código efectivo (candidata 64f8837)

| Pieza | Hecho comprobado |
|---|---|
| `js/ai-render-ui.js:25` | Clave de resultados: `entryId\|projectId\|revisión\|viewId\|estilo\|suelo\|paredes`, **sin toma**. Resultados solo en memoria (`Map`) |
| `js/ai-render-ui.js:29–37` | Guarda `original: view.dataUrl` (PNG) pero **envía** `jpeg(view.dataUrl)` (canvas, fondo blanco, JPEG 0,9). Los bytes enviados no se conservan. `model`, `usage`, `cost` y `generatedAt` vienen del proveedor; el coste solo existe con la tarifa configurada |
| `js/project-views-ui.js:48,61` | La toma tiene `takeId: crypto.randomUUID()` y `takenAt: new Date()` |
| `js/local-images.js` | `get()` ya no crea la base (aborta en `onupgradeneeded`). El recolector trata como vivas las referencias de la autoridad |
| `js/persistence-store.js` | `refsIn()` y `imageRefs()` recorren cualquier `storage.ref` de los documentos de la autoridad y de los conflictos. F0 gobierna 5 claves |
| `js/visual-reference-core.js` (CAT-04) | Precedente: metadatos verificados por huella en `project.extensions`, sin píxeles. Viajan con el proyecto y con deshacer |
| `js/studio-e3-core.js` (integrado por Codex) | `leerConfirmado`, `analizar`, `identidad` (`contentId` con bytes efectivos) y `adaptadorImagenes({Images})` |

## 2. Contrato `rubik-lab-visual-result/1` (`k11/k11-core.js`)

| Campo | Contenido | Si no consta |
|---|---|---|
| `id` | Opaco (`vr_` + aleatorio). No se deriva de nada | — |
| `clase` | `vista-real` · `render-ia` · `simulado-laboratorio` | Rechazo |
| `sujeto` | `projectId`, `entryId`, `levelId`, `contentId` (portable, E3) y `revision` (confirmada) | Rechazo: sin sujeto no hay ficha |
| `toma` | `takeId`, `takenAt` (ISO), `viewId`, `viewLabel`, `source` | Rechazo: «sin-toma» |
| `camara`, `iluminacion` | Solo si están acreditadas (K12) | `null` y se lista en `noAcreditado` |
| `recursos.original` | Vista real: `sha256`, tipo, bytes, `storage.ref = k11:<sha256>` | Rechazo |
| `recursos.enviada` | **Bytes exactos enviados**, `derivadaDe` = huella del original, y `transformacion` declarada | Rechazo en `render-ia` y en `simulado` |
| `recursos.resultado` | Imagen resultante, con su huella | Rechazo |
| `estilo` | `style`, `floor`, `walls` | `null` |
| `procedencia` | `proveedor`, `modelo`, `generatedAt`, `consumo` (solo enteros informados) y `coste` (solo si existe) | `null` y se lista en `noAcreditado` |
| `derechos` | Titular (propietario del proyecto), `destinos` de una lista cerrada por clase y `rotulo` | Destinos por defecto de la clase |
| `claveContenido` | Huella de clase, trabajo, toma, vista, estilo y resultado (detección de duplicados) | — |
| `huella` | SHA-256 de la forma canónica completa (**local**: no es firma, autoría ni aceptación) | — |

La integridad y la vigencia se calculan al verificar; **nunca se guardan dentro de la ficha**.

**Vocabulario de estados:**

| Eje | Estados |
|---|---|
| Integridad | `integro` · `incompleto` (faltan bytes) · `invalido` (ficha o bytes alterados) · `no-comprobable` |
| Vigencia | `vigente` · `vigente-restaurado` · `toma-anterior` · `desactualizado` · `otro-proyecto` · `sin-comprobar` |

Un resultado histórico puede estar **íntegro y desactualizado**. Reabrirlo **no lo reasigna**.

**Destinos permitidos por clase:**

| Clase | Destinos |
|---|---|
| Vista real | estudio, comparación, presentación orientativa, entrega orientativa |
| Render IA | estudio, comparación, presentación orientativa |
| Simulado | estudio, comparación |

Cualquier otro destino → «destino-desconocido»; uno no concedido → «permiso-insuficiente».

**Lo que se separa:**
- la vista real observada (`vista-real`);
- la revisión confirmada (`sujeto`);
- el resultado simulado (`simulado-laboratorio`, rotulado «SIMULADO» en la propia imagen);
- la imagen generada por IA (`render-ia`);
- la selección profesional (**favorito**, que se guarda aparte y no cambia la huella; rotulado «no es una aceptación del cliente»).

## 3. Hallazgos de ChatGPT

**K11-A · imagen de origen frente a bytes enviados: RESUELTO en el contrato.**
- La ficha conserva el original y la imagen **enviada** como recursos distintos y verificables.
- El envío declara `derivadaDe` y su transformación.
- Si se alteran los bytes enviados → «invalido» (`enviada:alterado`). Si se rompe la derivación → `envio-no-derivado`.
- **Antes** (K-00b, sobre el código real): `ai-render-ui` guarda `original: view.dataUrl`, envía `jpeg(...)` y su ficha en memoria no contiene el envío.
- **Navegador** (K11-UI-01): original `image/png` y envío `image/jpeg` con huellas distintas.
- **Petición a Codex:** exportar `jpeg()` de `ai-render-ui`; el laboratorio la replica en una línea.

**K11-B · recaptura y caché: RESUELTO.**
- `claveCache()` es la clave de `ai-render-ui` **más el `takeId`**. Sin `takeId` no hay caché.
- **Antes** (K-00): la función de clave real, extraída del pin, da la misma clave para dos tomas.
- **Ahora** (K-03, K11-UI-02 y K11-UI-04):
  - misma toma y mismo estilo → se reutiliza el mismo resultado;
  - una toma nueva → resultado nuevo, nunca el anterior;
  - la ficha antigua queda como «de una toma anterior».

**K11-C · autoridad de persistencia: CONTRATO + adaptador AISLADO.**

Propuesta a Codex (**no se activa**):
1. **Metadatos** en `project.extensions["x-k11-visual-results"] = {version:1, results:{[id]:ficha}, favoritos:{[id]:{at,nota}}}`. Es el patrón de CAT-04: viaja con el proyecto bajo F0 (biblioteca confirmada), con deshacer y con exportar/importar. **No hace falta una clave F0 nueva.**
2. **Bytes** en `FloorPlanImages` con la clave `k11:<sha256>`, direccionados por contenido: un original compartido por varias variantes se guarda una vez (K-15).
3. **Protección frente al recolector:** cada recurso lleva `{storage:{kind,ref}}`. El `refsIn()` **real** de `persistence-store.js` ya los cuenta como vivos (K-22), **sin cambiar sus reglas**.
4. **Escritura:** bytes primero y metadatos en un único commit del editor. Si el commit falla, se retiran solo los bytes nuevos de la operación (K-13). La cuota y los permisos devuelven motivos explicados (K-12, K-17).
5. **Expediente v1:** no incluye estos bytes. Una restauración recupera las fichas con «incompleto» hasta que el expediente los incluya (petición a Codex).

El **adaptador de laboratorio** recibe un almacén de bytes y un «proyecto» con commit inyectados:
- **En Node:** mapas en memoria.
- **En el navegador:** una base **propia** (`rubik-lab-k11-v1`) que imita el commit sin tocar el proyecto.

K11-UI-07 comprueba que no queda nada en localStorage, ni claves `k11:` en `FloorPlanImages`, ni la extensión dentro de la autoridad F0.

## 4. Capacidad demostrable (navegador, copia aislada de la candidata)

`tools/k11-copia.cjs` carga `k11/k11-core.js` y `k11/k11-lab-ui.js` solo en la copia.

**Recorrido (`tools/k11-ui-qa.cjs`, Chromium 157):**
1. Vistas reales (`FloorPlanProjectViews.prepare`, `takeId`) → resultado **simulado** (filtro de canvas y rótulo «SIMULADO · LABORATORIO»; ni IA ni coste).
2. **Ficha trazable** con las tres imágenes y sus huellas, toma, sujeto (`contentId` y revisión de E3), procedencia, «no acreditado» y destinos.
3. Conservar dos variantes, marcar un favorito y **comparar**.
4. **Recargar la página** → recuperar con verificación.
5. Recapturar → resultado nuevo sin caché.
6. Cambio **real** de revisión (norte confirmado) → las fichas siguen íntegras y pasan a desactualizadas.
7. Bytes alterados o ausentes en la base aislada → «inválido» / «incompleto».
8. Móvil 390 en ZH.

**Capturas:** `evidence/k11/visual/`: `k11-ficha`, `k11-variantes-comparacion`, `k11-recuperacion-tras-recargar`, `k11-desactualizado`, `k11-alterado-ausente` y `k11-movil-zh`.

**Conexión prevista en producto (propuesta, no aplicada):**
- desde **Imágenes** (vistas preparadas) y el diálogo de Render IA existente;
- sin menú nuevo;
- la ficha conservada como pieza de **Entregar → Documentación → Preparar entrega** (fuente `imagenesIA` y vistas para RP03, RP06 y RP07), cuando el contrato y la autoridad estén aprobados.

## 5. Pruebas

| Suite | Entorno | Resultado |
|---|---|---|
| `tools/k11-qa.cjs` | Node 22.23.5, pin candidata `64f8837` | **26/26 PASS** (3 ejecuciones estables) |
| `tools/k11-qa.cjs` | Node 22.23.5, pin master `4ea7cb3` | **26/26 PASS** |
| `tools/k11-ui-qa.cjs` | Chromium 157.0.8103.78, copia aislada de `64f8837` + K11 | **9/9 PASS** (3 ejecuciones) |
| Firefox / WebKit | — | **NOT_RUN** (no instalados; ver HANDOFF de E3 para la ejecución reproducible) |
| Safari real, dispositivos físicos | — | No ejecutados |

**Correspondencia con los casos obligatorios (§3.4):**

| Caso del mandato | Pruebas |
|---|---|
| Dos resultados sobre la misma toma | K-04, UI-02 |
| Dos tomas, misma geometría | K-05, UI-03/04 |
| Cambio de proyecto en curso | K-06 |
| Respuestas tardías | K-07 |
| Cambio de revisión | K-08, UI-05 |
| Original o resultado alterado | K-09, UI-06 |
| Ausente o corrupto | K-10, UI-06 |
| Restauración con otros ids | K-11 |
| Cuota | K-12 |
| Fallo parcial | K-13 |
| Cancelación | K-14 |
| Duplicados | K-15 |
| Otro proyecto | K-16 |
| Permisos | K-17 |
| Destinos desconocidos | K-18 |

Además:
- K-19: favoritos;
- K-20: recorrido con recarga;
- K-21: clases separadas;
- K-22: protección frente al recolector real;
- K-23: textos ES/EN/ZH;
- K-24: sin red ni almacenamiento propio en el núcleo; 0 rechazos sin capturar.

**Correcciones de la prueba, no del núcleo:**
- un `sort()` de la propia prueba mutaba la ficha, y la verificación lo detectó correctamente como alterada;
- una fixture daba bytes de resultado idénticos al original.

**Correcciones de la interfaz de laboratorio:**
- la secuencia de recuperación (lecturas tardías, mismo patrón que E3-C);
- el ancho de la cabecera en móvil.

**Reutilización de E3/F0:** el sujeto se calcula con `studio-e3-core` (equivalencia con el expediente acreditada en E3 A-00). No se repiten las suites de E3 ni de F0.

## 6. Límites

- **Ningún proveedor real:** el contrato admite `render-ia`, pero su demostración usa el simulador. Las tres generaciones autorizadas históricas no se repiten.
- **La transformación del envío se replica en el laboratorio:** la de producto es privada.
- La base `rubik-lab-k11-v1` es **solo de laboratorio**.
- **Pendiente:** la cámara y la iluminación (K12) y el destino de los bytes en el expediente (Codex).
- **Pulido menor de la demo:**
  - en ZH, la transformación declarada del envío es un dato técnico en español;
  - la lista muestra la clave interna del estilo.
- Siguen pendientes H08, GOV-05, los derechos del núcleo económico y la escala física.

## 7. Contratos pendientes y destinos de integración (Codex)

1. Aceptar o ajustar `rubik-lab-visual-result/1`, y su destino `js/visual-result-core.js` (núcleo puro).
2. Metadatos en la extensión del proyecto (patrón CAT-04) y bytes `k11:<sha256>` en `FloorPlanImages`. Un único escritor: el commit del editor.
3. Exportar `jpeg()` de `ai-render-ui` y `takeId` en la clave de caché de `ai-render-ui`. Conservar el envío y el resultado al generar.
4. Expediente: incluir los bytes referenciados por la extensión K11 (o declararlo en `NOT_INCLUDED`).
5. Cuota: límite y política de limpieza de resultados (el plan pide «cuota controlada»).

**Reversión:** borrar `k11/`, `tools/k11-*` y `evidence/k11/`. La base de laboratorio se elimina con el sitio. No hay cambios en el producto.

## 8. GO / NO-GO

| Ámbito | Dictamen |
|---|---|
| Contrato K11 + núcleo + adaptador aislado + demostración | **GO de laboratorio (VALIDADO en Chromium)**, pendiente de la auditoría de ChatGPT |
| Persistencia productiva de resultados | **NO-GO** hasta que Codex apruebe la autoridad K11-C |
| K12 (CAM-01/IMG-07), Architecture Book, FF&E | **No empezados**; después del dictamen sobre K11 |
| IA real, consumo, F0/C6, emisión, firma, E5–E7 | **NO-GO** |

**Siguiente actor:** ChatGPT (auditoría de K11) → Codex (contrato K11-C) → CC1 (K12 y adaptadores E4, si K11 no se rechaza).
