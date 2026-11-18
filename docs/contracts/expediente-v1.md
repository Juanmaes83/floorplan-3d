# Contrato · Expediente RUBIK v1 (`rubik-sota.expediente`)

**Corte:** F0.1 del [ADR de continuidad](https://github.com/Juanmaes83/floorplan-3d/blob/docs/reconciliacion-maestra-v1.12/docs/product/ADR-PERSISTENCIA-CONTINUIDAD-PROYECTO.md) (en la PR #261 hasta que se fusione). **Núcleo:** `js/expediente-core.js`. **Pruebas:** `tests/expediente.test.cjs` (núcleo, perfil simulado en memoria) y `tests/expediente.browser.test.cjs` (Chromium real). Sin interfaz todavía: `index.html` no carga el módulo hasta F0.3.

## 1. Qué es

Un único ZIP que contiene una entrada de la biblioteca: un proyecto 1.x o un edificio con sus plantas. Incluye los documentos que dependen de sus `project.id`. Sirve para respaldar, trasladar a otro navegador o dominio y, en F1, como unidad de sincronización.

No es un segundo motor de proyectos:

| Parte | Autoridad que se reutiliza |
|---|---|
| Geometría e imágenes de un proyecto | Disposición y validación de `js/project-package.js` (`project.json`, `images/…`) |
| Geometría e imágenes de un edificio | Disposición y validación de `js/building-core.js` (`building.json`, `manifest.json`, `levels/…`) |
| Presupuestos | `FloorPlanBudgetV1`, validado con `FloorPlanBudget.validateBudget` |
| Identidad al restaurar | `importProject` e `importBuilding` de `js/project-library.js` |
| Claves de imagen al restaurar | Las mismas que usan hoy las importaciones ZIP: claves nuevas en IndexedDB `rubik-sota-images-v1` |

## 2. Estructura

```
expediente.json            manifiesto (esta especificación)
project.json | building.json + manifest.json
images/… | levels/<lvl>/images/…
documents/budget-001.json  un FloorPlanBudgetV1 por proyecto con presupuesto
documents/review-002.json  observaciones guardadas de un proyecto
```

`expediente.json`:

| Campo | Contenido |
|---|---|
| `format`, `version` | `rubik-sota.expediente`, `1`. Otra versión se rechaza sin escribir nada |
| `createdAt` | Fecha ISO de exportación |
| `subject` | `kind` (`project` o `building`), `id` y `name` |
| `files[]` | Cada archivo salvo el propio manifiesto: `path`, `bytes`, `sha256` |
| `documents.budgets[]`, `documents.reviews[]` | `projectId` y `path` de cada documento |
| `notIncluded[]` | `assistant-log`, `construction-record`, `studio-tariff`, `brand-profiles`, `published-links`, `variant-links` |

**Integridad:** la huella SHA-256 de cada archivo detecta contenido dañado o modificado. **No es una firma**: no prueba quién generó el expediente.

## 3. Lectura

`read(buffer)` valida todo antes de devolver nada:
- formato, versión y coincidencia entre el manifiesto y el contenido;
- cada archivo listado existe y coincide en tamaño y huella; no hay archivos sin listar;
- rutas permitidas solo las de las dos disposiciones, más `expediente.json` y `documents/…`; no se admiten duplicados, cifrado, enlaces ni ZIP64, por las reglas de `project-package`;
- geometría e imágenes, con los validadores existentes;
- cada presupuesto es un `FloorPlanBudgetV1` válido y apunta a un proyecto del expediente.

También acepta los formatos históricos sin documentos: ZIP de proyecto, ZIP de edificio y JSON de proyecto o edificio.

## 4. Identidad de contenido

Dos expedientes son el mismo trabajo cuando coinciden tres cosas, sea cual sea el id local que tenga cada uno:

| Componente | Cómo se compara |
|---|---|
| Geometría y metadatos | El proyecto o edificio completo, quitando el id del proyecto o de cada planta y el del edificio |
| Recursos | Cada imagen por la huella SHA-256 de sus **bytes reales**: las huellas que ya escriben `project-package` y `building-core`, o los bytes que hay en IndexedDB en el navegador. No se crea otra autoridad de integridad |
| Documentos | Presupuestos y observaciones de cada planta, con sus referencias al proyecto neutralizadas por posición |

`contentId` es la huella SHA-256 de esa forma normalizada. Consecuencias:
- Una imagen distinta con la misma geometría es otro trabajo.
- Reimportar un expediente que ya dio lugar a una copia reidentificada encuentra esa copia: no se acumulan copias. Vale también para edificios.
- Una copia intencionada se pide con `copy: true`.
- Un JSON histórico no lleva bytes: sus imágenes se comparan por referencia local.

## 5. Restauración: qué se garantiza y qué no

**Orden.** Los ids se deciden antes de escribir. Después se escriben, por este orden:
1. una entrada del diario de recuperación;
2. las imágenes en IndexedDB;
3. los presupuestos y las observaciones;
4. la biblioteca.

Esta última es una única escritura atómica de `localStorage` y es el **punto de confirmación**: el proyecto nunca aparece sin sus documentos.

| Situación | Garantía real |
|---|---|
| Atomicidad | **No hay atomicidad entre almacenes**: IndexedDB y `localStorage` son independientes. Solo es atómica la escritura de la biblioteca, y por eso es la última |
| Reversión ordinaria | Si algo falla antes de confirmar, se borran las imágenes y los documentos escritos, solo los propios y solo si siguen siendo los que se escribieron. El error dice «No se ha añadido ni cambiado nada» |
| Fallo de la reversión | Nunca se oculta. El error enumera los almacenes sin limpiar (`cleanupPending`) y la entrada del diario se conserva |
| Interrupción (cierre, recarga, caída) | Lo escrito antes de confirmar es invisible: ningún proyecto lo referencia. `recover()` lo elimina al arrancar. Una interrupción después de confirmar deja el proyecto completo y `recover()` solo retira la entrada del diario |
| Falta de espacio | Probado con la cuota real de Chromium: error visible y estado intacto |
| Otra pestaña escribe a la vez | Se usa un Web Lock (`rubik-sota-expediente`). Justo antes de escribir se vuelven a leer los documentos y nunca se sobrescribe uno ajeno (`document-conflict`). Si esta pestaña tiene una copia de la biblioteca anterior a la guardada, se rechaza (`library-stale`) en lugar de borrar el trabajo de la otra |
| **Límite conocido** | `localStorage` llega a otras pestañas con retraso y los Web Locks no garantizan esa visibilidad. Dos restauraciones exactamente simultáneas en dos pestañas pueden no detectarse. Es el mismo límite que ya tiene cualquier guardado de la biblioteca actual; lo resuelve F0.2 con transacciones de IndexedDB |

El diario usa una clave por operación (`rubik-expediente-journal-v1:<op>`). Un mapa compartido podía resucitar entradas ya retiradas por otra pestaña; la prueba real de navegador lo detectó. **`recover()` aún no se llama al arrancar:** se conectará en F0.3. Hasta entonces, los restos de una interrupción son invisibles pero ocupan espacio.

## 6. Compatibilidad y completitud verificadas

| Caso | Resultado |
|---|---|
| JSON histórico con referencias a imágenes | Se importa como hace la importación JSON actual: conserva las referencias e informa en `missingImages` de las que no existen en este navegador. No promete recuperar imágenes que el archivo no contiene |
| ZIP históricos de proyecto y de edificio | Se leen y restauran; no traen documentos |
| Presupuestos por planta | Cada planta conserva el suyo, también al reidentificar (`bud_<id>` y `subject.id` siguen al id final) |
| Edificios | Se restauran todas las plantas, imágenes y presupuestos, y son idempotentes |
| Proyecto visible con cambios sin guardar | Se guarda en su entrada antes de añadir la nueva, como en la importación actual. Si el resultado es `already-present` no se escribe nada: F0.3 debe guardar el proyecto visible antes de abrir la entrada existente |
| Recurso ausente o documento corrupto al exportar | No se genera el expediente; el error dice cuál falta o no es válido |
| Reimportación de una copia recuperada | Se reconoce como el mismo trabajo |

## 7. Evolución para variantes y continuidad

Se recomienda **un único formato con tres usos**, no tres formatos. La versión 2 del manifiesto pasaría de `subject` a `subjects[]`:

| Uso | Contenido | Restauración |
|---|---|---|
| Expediente individual | Un sujeto (la v1 actual) | Igual que ahora |
| Conjunto de proyectos relacionados | Original y variantes, con `relation: {variantOf: <índice>}` | La biblioteca necesita una importación de grupo que recree `variantOf`. Si el grupo supera `MAX_VARIANTS` (2), las variantes que no caben se importan como proyectos independientes y la relación queda en `origin` y en el informe, sin perder nada. Así `group()`, Studio Presentation y la comparación económica siguen funcionando |
| Expediente de conflicto | Uno o varios sujetos con `conflict: {baseRevision, detectedAt, reason}` | Se guarda en un área de recuperación, no como variante, para que el límite de variantes nunca obligue a descartar trabajo |

La identidad de contenido de §4 se aplica a cada sujeto. Un lector v1 rechaza la v2 por versión, sin escribir nada.

## 8. F0.2 · Estrategia definitiva (revisión crítica)

**Se descarta** la fachada síncrona que da por guardado lo que solo está en memoria. Actualizar la memoria no es un guardado duradero.

**Se adopta: IndexedDB como única fuente de verdad, con confirmación explícita.**

1. **Lecturas síncronas, escrituras confirmadas.** Al arrancar se carga en memoria la última instantánea confirmada, para que el editor siga leyendo de forma síncrona y sin cambios. Cada cambio entra en una cola de un solo escritor, que no reordena y fusiona los cambios consecutivos. «Guardado» solo se muestra cuando la transacción de IndexedDB completa (`oncomplete`, con `durability: 'strict'` donde exista). Estados visibles: «Guardando…», «Guardado», «Error al guardar». Un error bloquea la exportación y el cambio de proyecto hasta resolverlo; nunca es silencioso.
2. **Una transacción para biblioteca y documentos.** Biblioteca, presupuestos, observaciones y registro de obra van en almacenes del mismo IndexedDB y se confirman en **una sola transacción**. Desaparece la falta de atomicidad entre almacenes que F0.1 tiene que gestionar con el diario. Los lectores actuales de `rubik-budget-v1` (unos siete puntos en `budget-ui`, `construction-context`, `catalog-budget-core`, `cat04-ui` y `project-library`) pasan a un adaptador síncrono sobre la misma instantánea. Es el mayor radio de cambio de F0.2 y se coordina con Codex.
3. **Concurrencia entre pestañas.** Cada confirmación lleva una `revision` monótona. Dentro de la transacción, protegida por un Web Lock, se compara con la revisión base. Si otra pestaña confirmó antes, no se escribe: el estado local se guarda como expediente de conflicto (§7) y se avisa por `BroadcastChannel` para recargar. IndexedDB es coherente entre pestañas; `localStorage` no lo es, como mostró la prueba real.
4. **Cierre del navegador.** Se vacía la cola en `visibilitychange` (oculta) y en `pagehide`, sin depender de `beforeunload`. La pérdida máxima es la cola sin confirmar, que siempre se muestra como pendiente. Al reabrir se recupera la última instantánea confirmada.
5. **Migración en dos fases, por origen y repetible.**
   - Fase A: copiar las claves `rubik-*` de `localStorage` a IndexedDB en una transacción y verificar la copia releyéndola y comparando huellas.
   - Fase B: escribir la marca `migratedFrom` con claves, huellas y fecha.
   - `localStorage` no se borra ni se modifica. Si algo se interrumpe, al no haber marca se repite la fase A.
   - Riesgo documentado: si se vuelve a desplegar una versión anterior a F0.2, esa versión verá la copia de `localStorage` del momento de la migración. No se pierde nada, pero puede divergir; la mitigación es exportar el expediente.
6. **Persistencia.** Se solicita `navigator.storage.persist()` y se informa del resultado y de `estimate()`. Es una solicitud, no una garantía.
7. **No incluido:** app offline (service worker) y sincronización (F1).

**Pruebas de F0.2, todas en Chromium real:**
- guardar y recargar;
- cerrar la página durante una transacción y recuperar la última instantánea confirmada;
- cuota agotada con `Storage.overrideQuotaForOrigin` (CDP);
- transacción abortada a propósito;
- migración repetida e interrumpida entre fases;
- dos pestañas con conflicto de revisión;
- `localStorage` intacto después de migrar.

## 9. Pruebas de F0.1

| Clase | Archivo | Qué acredita |
|---|---|---|
| Núcleo, perfil simulado en memoria | `tests/expediente.test.cjs` (19) | Contrato, identidad, idempotencia, rechazo de expedientes dañados, reversión, diario, pestaña desactualizada y bloqueo. No acredita IndexedDB real |
| Navegador real (Chromium, IndexedDB, `localStorage` y Web Locks reales) | `tests/expediente.browser.test.cjs` (4) | Restauración en un perfil limpio con recarga y bytes idénticos; interrupción por recarga a mitad de operación y `recover()`; cuota real agotada; segunda pestaña desactualizada |

En CI: `consolidation-regression.yml`, paso de contratos puros y paso de navegador propio.

## 10. Límites de F0.1

- No es todavía el expediente profesional completo. Faltan:
  - el registro de obra (`rubik-construction-v1`, indexado por entrada; siguiente corte);
  - las variantes (§7);
  - los renders y dossieres (F2 del ADR).
- El registro del Asistente queda fuera deliberadamente.
- Dos restauraciones exactamente simultáneas en dos pestañas: §5, límite conocido.
- `recover()` y la interfaz se conectan en F0.3.
- La limpieza de imágenes existente (`tracing-ui`, `cleanup()`) podría borrar imágenes de una restauración en curso en otra pestaña antes de confirmar. El resultado sería un error visible, no una corrupción silenciosa. F0.2 la hará respetar el diario.
