# Contrato · F0.2c · Autoridad única de recursos — Revisión R1 (nueva)

**Identidad de este documento.** Es una **revisión nueva**, R1, redactada el 19/11/2026 a partir del código real, las evidencias disponibles y las decisiones registradas. **No reconstruye** el diseño F0.2c anterior (commit `4e4f131975c6ff100b34f78a989bd25b075c48ac`, árbol `596c2fd78c0af561b56e8e062d3918aa73e421c3`). Ese commit, sus tres expedientes, la matriz T01–T53 y las decisiones D1–D8 no están en GitHub ni en el entorno de trabajo. Si se recuperan, se compararán con R1 y prevalecerá lo que el propietario decida. Para no confundirlas con las originales, las pruebas de R1 se numeran **R1-T** y las decisiones **R1-D**.

**Completa, no sustituye:**
- [persistencia-v1.md](persistencia-v1.md): la autoridad F0.2, sus conflictos, la migración de documentos, la vuelta a una versión anterior y la recogida de imágenes. En especial §6, «F0.2c llevará las imágenes y el diario a la misma base».
- [ADR de persistencia](../product/ADR-PERSISTENCIA-CONTINUIDAD-PROYECTO.md), §16 y §17. El diseño de §17 se mantiene; R1 lo concreta.

**Estado:** solo diseño. Decisiones del propietario del 19/11/2026 incorporadas (§2). **NO-GO** para implementar A0, F0.2c o cualquier migración de IndexedDB sin autorización específica.

**Marcas de evidencia:** **[E]** ejecutada · **[I]** inspeccionada en el código · **[H]** histórica, declarada en otra PR o documento · **[P]** pendiente.

## 0. Fuentes

| Fuente | SHA |
|---|---|
| master | `dd528119bdfd80733c4faf5bb56a594190fea5ac` |
| P0 H-1 · [#270](https://github.com/Juanmaes83/floorplan-3d/pull/270) | `de1e419e585d6af982921ae422e77b21b6dff577` (árbol `bb11ae38…`). Incluye la exclusión frente al cruce reutilización/recogida (`6d45d4cd`) |
| F0.2b · [#269](https://github.com/Juanmaes83/floorplan-3d/pull/269) | `956bce96b1d50edb60a8b8aaa3b742f3678261bb` |
| OP-02 [#266](https://github.com/Juanmaes83/floorplan-3d/pull/266) · OP-04 [#268](https://github.com/Juanmaes83/floorplan-3d/pull/268) | `edfbf66b` · `497c37fb` (no tocan persistencia [I]) |

Simulación P0 `de1e419e` → #266 → #268 → #269: árbol `ebdc2fdce0157a82aaa09973c12f3f278f6b59d7`. H-1 5/5 en el origen normal y con **F0.2b activo**; persistencia 21/21; Chromium [E]. Detalle en #270.

## 1. Estado real del almacenamiento

| Almacén | Contenido | Versión IndexedDB | Quién escribe |
|---|---|---|---|
| `localStorage` | Biblioteca, proyecto suelto, presupuestos, observaciones y obra. Con F0.2b activo es una copia de compatibilidad con barrera. También: diario del expediente (`rubik-expediente-journal-v1:*`), marcas de recogida, preferencias y Asistente | — | Todas las versiones publicadas |
| `rubik-sota-persistence-v1` | Autoridad de documentos (`docs`, `meta`, `legacy`, `conflicts`). Activa solo en el origen aislado de F0.2b [H] | 1 | F0.2a/b |
| `rubik-sota-images-v1` | Bytes de **todos** los recursos: imágenes de plano (`img_*`) y fotos de MUE-01 (`mue01/<sha256>`). FOT-01 no guarda bytes aquí [I] | 1 | Todas las versiones con trazado o MUE-01 |

**Hechos que condicionan F0.2c:**

| # | Hecho | Origen |
|---|---|---|
| F1 | Imagen y documento se guardan en dos bases distintas. Una imagen se escribe **antes** del proyecto que la cita | [I] `local-images.js` |
| F2 | Antes de P0, la recogida solo veía `sourceImages` y borraba fotos de MUE-01 citadas (H-1) | Roja/verde [E], #270 |
| F3 | Con P0, una clave está viva si su texto aparece en cualquier estado legible, o está fijada (`pin`) o registrada (`holder`). Si un estado no se puede leer, no se borra nada. Guardar los bytes y confirmar el proyecto se ejecutan bajo el lock de la recogida (`guard`), así que una pasada no puede borrar una clave reutilizada entre su lectura y su borrado | [E] #270, roja en `924982dc`/`25a4e7c3`, verde en `de1e419e` |
| F4 | `refsIn` solo reconoce `storage.ref`. La **exportación de emergencia** y la de conflictos **no incluyen las fotos de MUE-01** | [I] `persistence-store.js`, `exportDocs` (master y #269) |
| F5 | `local-images.js` abre su base **sin** `onversionchange`. Una pestaña con una versión actual o anterior **bloquearía** una subida de versión de `rubik-sota-images-v1`, y ninguna versión ya publicada se puede corregir con efecto retroactivo | [I] master y #269 |
| F6 | Ningún escritor comprueba una época de esquema antes de escribir. La única barrera ante versiones anteriores es el TOMBSTONE de la biblioteca en `localStorage` (persistencia-v1 §5) | [I] |
| F7 | Las claves `mue01/*` ya son la SHA-256 de sus bytes. Las `img_*` no tienen huella | [I] `own-furniture-ui.js`, `tracing-ui.js` |

## 2. Decisiones de R1

**Estados:**
- **Acreditada:** ya implementada y probada.
- **Registrada:** consta como decisión aprobada en otro documento.
- **Propuesta:** pendiente del propietario.

| ID | Tema | Decisión | Estado |
|---|---|---|---|
| R1-D1 | A0 antes de migrar | Ninguna migración de esquema se autoriza hasta que A0 (§3) esté integrado, activado y en uso durante una convivencia de **7 días como mínimo**. Los 7 días son **necesarios pero no suficientes**: además deben cumplirse las condiciones de evidencia de §3 | **Aprobada (19/11)** |
| R1-D2 | Autoridad única de recursos | Bytes, referencias, diario y documentos en **una** base, con confirmación en **una** transacción (§4). Concreta el ADR §17 | **Aprobada (19/11):** autoridad única transaccional de documentos, recursos, referencias y diario |
| R1-D3 | Una única autoridad | Copiar, verificar y conmutar. Después, la base nueva es la única escrita, **sin doble escritura**. Los almacenes legados se conservan solo para lectura (§6) | **Aprobada (19/11)** |
| R1-D4 | Protección conservadora | La regla de P0 (mención textual, fallo cerrado) se mantiene como **red de seguridad** aunque existan referencias explícitas. Nunca se borra un recurso cuyo estado no pueda determinarse | **Aprobada (19/11):** protección conservadora de recursos indeterminados |
| R1-D5 | Almacén legado | `rubik-sota-images-v1` y las claves de `localStorage` no se borran en F0.2c. Su limpieza exige una decisión aparte, cuando no queden escritores antiguos (§6) | Registrada (ADR §17) |
| R1-D6 | Exportación de emergencia privada | Copia **completa** y separada de la exportación ordinaria, con aviso y confirmación explícita. Incluye **todos** los recursos, también las fotos de MUE-01 (corrige F4). La exportación ordinaria sigue sin fotos privadas | **Aprobada (19/11)** |
| R1-D7 | Rollback | Se distingue el rollback de código del rollback de datos (§9). Ninguna vuelta atrás de código borra datos | **Aprobada (19/11):** rollback de código y de datos separados, sin pérdida de modificaciones |
| R1-D8 | Integridad | Cada recurso registra `sha256`, bytes y tipo; **SHA-256 obligatorio**. La migración verifica la huella y no conmuta si alguna no coincide. «Huella», no «firma» (ADR §16) | **Aprobada (19/11)** |
| R1-D9 | Historial | Se protegen los recursos citados en el historial (deshacer/rehacer) de **todas las sesiones activas**, no solo la propia (§4, regla 4) | **Aprobada (19/11)** |
| R1-D10 | Compatibilidad | **No** se mantiene una copia de compatibilidad escribible. El legado queda en solo lectura, con barrera, y la escritura de una versión antigua se detecta (§5, §6 bis) | **Aprobada (19/11)** |
| R1-D11 | Rollback de datos | Solo se permite si **conserva todos los cambios posteriores** a la conmutación (§9) | **Aprobada (19/11)** |

## 3. A0 · Puerta de escritores (requisito previo)

**Problema.** Una migración solo es segura si ninguna pestaña puede seguir escribiendo en el formato anterior sin que se note.
- Por F5, una pestaña actual bloquea la subida de versión de la base de imágenes.
- Por F6, ningún escritor sabe si su formato sigue vigente.

**A0 es un corte pequeño, sin migración, que solo añade:**
1. `onversionchange` en `local-images.js`: cerrar la conexión y marcar la pestaña como «desactualizada».
2. **Época de esquema.**
   - Una clave `meta.schemaEpoch` en la autoridad y un marcador equivalente en `localStorage`.
   - Cada escritor de documentos y recursos la lee **dentro** de su transacción o de su Web Lock.
   - Si la época es mayor que la suya, rechaza escribir y muestra un aviso: «Esta pestaña usa una versión anterior. Recarga para continuar; tus cambios siguen en esta pestaña» (§11).
3. **Aviso entre pestañas.** Mensaje en el `BroadcastChannel` existente al cambiar la época. Es solo una pista: la garantía es la comprobación transaccional del punto 2.
4. **Señal de convivencia.** Registrar en `meta` qué épocas de escritor se han visto, para saber cuándo dejan de aparecer versiones sin A0.

**Lo que A0 no resuelve:** las versiones ya publicadas no comprueban la época. Esas pestañas y las apps cacheadas se cubren con:
- la base nueva con otro nombre, de modo que las versiones anteriores siguen escribiendo en la legada sin tocar la nueva;
- la detección de divergencia del almacén legado (§6, paso 5);
- R1-D5: no borrar nada legado.

**Aceptación de A0:**
- R1-T01–T04 en verde.
- Integrado en master y activado.

**Salida de la convivencia (R1-D1).** Los 7 días son necesarios pero no suficientes. Para autorizar la migración deben cumplirse **todas** estas condiciones:
1. Al menos 7 días naturales desde la activación de A0.
2. En los **últimos 7 días**, ningún escritor de época anterior registrado en `meta.writersSeen` (§3, punto 4), y ninguna divergencia nueva del legado en los perfiles observados.
3. Validación de navegadores de persistencia-v1 §10 sobre la versión con A0 (R1-T50).
4. Copia de emergencia completa garantizada antes de migrar (§6, paso 0).
5. Autorización expresa del propietario.

Si un escritor antiguo aparece, el plazo vuelve a empezar.

## 4. Contrato de recursos (F0.2c)

Base nueva: `rubik-sota-store-v2`, con otro nombre para no subir de versión las existentes (F5).

| Almacén | Clave | Valor |
|---|---|---|
| `docs` | Clave gestionada | Cadena JSON byte a byte, igual que en v1 |
| `resources` | `resourceKey` | `{bytes: Blob, sha256, size, mediaType, kind: 'plan'\|'mue01'\|…, createdAt}` |
| `refs` | `[resourceKey, holder]` | `holder` = `doc:<clave>` \| `conflict:<id>` \| `journal:<id>` \| `pending:<operación>` |
| `journal` | id | El diario del expediente, que deja `localStorage` |
| `conflicts`, `legacy`, `meta` | Como en v1 | Más `schemaEpoch` y `migration` |

**Reglas:**
1. **Confirmación atómica.** Documento, recursos nuevos y filas `refs` van en la misma transacción `readwrite`. No existe un recurso sin titular ni un titular sin recurso.
2. **Operaciones en vuelo.** Al subir una foto o importar un ZIP se crea una fila `pending:<op>` en la misma transacción que los bytes. La confirmación la sustituye por `doc:`. Una cancelación comprobada la elimina. Sustituye a `pin()` y a `guard()` de P0: como la recogida es una transacción `readwrite` sobre `resources` y `refs`, IndexedDB serializa la escritura y el borrado sin necesitar Web Locks.
3. **Recogida.**
   - Es una transacción `readwrite` única: recursos sin ninguna fila `refs`, menos la red de seguridad de R1-D4 (mención textual en `docs`, `conflicts`, `journal` y en el almacén legado mientras exista).
   - No depende de Web Locks ni de contar pestañas.
   - Un registro ilegible aborta la pasada.
4. **Historial de todas las sesiones activas (R1-D9).**
   - Cada pestaña mantiene filas `session:<tabId>` en `refs` para los recursos de su historial: al deshacer o rehacer y al quitar una foto, en la misma transacción que el cambio.
   - Solo las borra otra pestaña cuando `locks.query()` confirma que el lock `rubik-sota-tab:<tabId>` ya no existe, dentro de la transacción de recogida.
   - Sin Web Locks, ninguna pestaña borra filas de otra.
   - Es la versión persistente del `holder()` de P0, que solo veía su propia pestaña.
5. **Privacidad.**
   - Sin cambios en `kind: 'mue01'`.
   - Las fotos se quedan en el navegador.
   - La exportación ordinaria y el expediente las excluyen. Solo la exportación de emergencia (R1-D6) las incluye, tras confirmación.

## 5. Compatibilidad entre versiones

| Versión | Lee | Escribe | Con la base v2 activa |
|---|---|---|---|
| Anterior a F0.2 (publicada) | `localStorage`, `images-v1` | Ídem | Lee la barrera y rechaza la biblioteca. Puede seguir guardando imágenes en `images-v1`; se detecta como divergencia (§6) |
| F0.2b (#269) | `persistence-v1`, `images-v1`, copia en `localStorage` | Ídem | Sin A0, no sabe de v2: se trata igual que la fila anterior |
| F0.2b + A0 | Ídem | Ídem, **solo si la época lo permite** | Rechaza escribir y avisa de recargar |
| F0.2c | `store-v2`; lectura del legado para migrar y comparar | **Solo** `store-v2`, más la barrera de compatibilidad | — |

**Volver temporalmente a una versión anterior** (persistencia-v1 §5, estrategia operativa):
- La versión anterior encuentra el legado intacto, con el estado previo a la migración y la barrera, que rechaza la biblioteca de forma visible.
- Lo que consiga escribir ahí aparece como conflicto `legacy-diverged` al volver a F0.2c (§6 bis).
- **R1-D10 (aprobada):** F0.2c no escribe una copia de compatibilidad. Para volver, se usa la exportación de emergencia o el rollback de datos (§9).

## 6. Migración transaccional

Bajo el Web Lock `rubik-sota-persistence` cuando está disponible. La garantía, sin embargo, es la exclusión transaccional de §6 bis, que no depende de ese lock.

0. **Copia de emergencia previa, obligatoria (R1-D6).**
   - Antes de copiar nada se genera la exportación de emergencia **completa** del estado vigente: documentos, conflictos, diario y **todos** los recursos, incluidas las fotos de MUE-01, con un manifiesto SHA-256 por archivo.
   - La persona la descarga tras el aviso de contenido privado y su confirmación explícita.
   - Su huella se registra en `meta.preMigrationExport`.
   - Sin ese registro, la migración **no empieza**.
   - Límite honesto: el navegador no puede comprobar dónde se guardó el archivo. Por eso el legado se conserva además intacto (R1-D5).
1. **Copiar.** Documentos de `persistence-v1` (o de `localStorage` si F0.2b no está activo), recursos de `images-v1` con su SHA-256, el diario y los conflictos. Se escriben en `store-v2` con `migration.phase='copied'` y las huellas de origen.
2. **Referencias.** Se derivan de los documentos copiados: `sourceImages`, extensión MUE-01 y mención textual. Un recurso que nadie cita se copia igualmente, con el titular `legacy:unclaimed`, y **no se recoge en F0.2c** (R1-D4 y R1-D5).
3. **Verificar.** Se releen todas las huellas. Si alguna no coincide (R1-D8), se aborta: no hay `done` y el origen queda intacto.
4. **Conmutar.** En una transacción: `migration.phase='done'`, `schemaEpoch` sube y se escribe la barrera. Hasta ese momento, nadie escribe en `store-v2` salvo la migración.
5. **Divergencia del legado.** En cada arranque se comparan las huellas del legado con las registradas en el paso 1. Lo nuevo (una pestaña sin A0 que siguió escribiendo) entra como conflicto `legacy-diverged`, con sus recursos. Nunca se sobrescribe.

**Cuota insuficiente o interrupción (H):**
- Antes de copiar, se estima con `navigator.storage.estimate()` y se compara con el tamaño de origen multiplicado por un margen. Si no cabe, no se empieza; se informa y se ofrece la exportación de emergencia.
- `QuotaExceededError` o un cierre en mitad del paso 1 o 3: sin `done`, el siguiente arranque borra lo **parcial de `store-v2`** (nunca el origen) y repite.
- Tres fallos seguidos detienen los reintentos, con un aviso persistente.

**Pruebas de admisión de la migración:**
- Las de ADR §17.
- R1-T10–T22.
- Chromium, Firefox y Safari, y los recorridos de almacenamiento de iOS y Android antes de usuarios reales (persistencia-v1 §10).

## 6 bis. Conmutación, exclusión y escritores antiguos

**Exclusión transaccional de migraciones simultáneas, sin depender de Web Locks.**
- IndexedDB serializa las transacciones `readwrite` cuyo ámbito se solapa. Toda decisión de la migración se toma leyendo y escribiendo `meta.migration` **dentro de la misma transacción**, como una comparación y asignación atómica.
- **Reserva.** Si `meta.migration` no existe o su arrendamiento ha caducado, se escribe `{phase:'copying', owner:<tabId>, token:n+1, heartbeatAt}`, con un token creciente que nunca se reutiliza. Si existe, está vigente y es de otro dueño, se aborta sin escribir.
- **Vallado por token.** Cada transacción de la migración (copia, verificación, conmutación) incluye `meta` en su ámbito y comprueba `token === suToken`. Si no coincide, aborta. Un dueño antiguo que despierte tarde no puede escribir nada.
- **Arrendamiento.** El dueño renueva `heartbeatAt` en cada lote; el plazo es de 2 minutos. Con Web Locks, además, solo se considera muerto si su `rubik-sota-tab:<tabId>` ya no existe. El lock es una señal adicional, no la garantía.
- **Recuperar un dueño muerto.** Otra pestaña reclama con `token+1` en una transacción. Lo copiado por el dueño anterior se descarta en `store-v2` y se repite desde el paso 1; el origen nunca se toca. Si el dueño anterior ya había conmutado (`phase:'done'`), no hay nada que reclamar.
- **Conmutación.** En la misma transacción se comprueba `token`, `phase==='verified'` y que las huellas del origen no han cambiado desde la verificación (§6, paso 3). Dos pestañas no pueden producir dos `done` (R1-T18, R1-T19).

**Conmutación recuperable entre almacenes.**
- `meta.authority` vale `'legacy'` o `'v2'` y vive en `store-v2`. La conmutación es una sola transacción: `authority='v2'`, `phase='done'`, `schemaEpoch` sube y se guardan las huellas del legado en ese instante (`legacyHashes`).
- Inmediatamente después se escribe un **testigo de conmutación fuera de v2**: `meta.switchedTo='store-v2'` en `persistence-v1` y la barrera en `localStorage`. Así, un fallo de v2 no se confunde con «nunca se migró».
- Una interrupción antes de que termine la transacción de conmutación deja `authority='legacy'` y ningún testigo. El siguiente arranque repite la verificación (§6, pasos 3–4).
- **v2 ilegible después de conmutar.** Si hay testigo y `store-v2` no se puede abrir, falta o falla su lectura:
  - se **bloquean todas las escrituras**, sin volver nunca al legado de forma automática, porque el legado es anterior a la conmutación y perdería lo hecho después;
  - se ofrece recuperación (§11): reintentar, exportación de emergencia de lo que la pestaña tenga en memoria, copia de emergencia previa (paso 0) y, solo con confirmación humana, el rollback de datos de §9.
- La vuelta atrás (`authority='legacy'`) sigue el procedimiento de §9. Nunca la decide el código por sí solo.

**Escritores antiguos que aún pueden modificar o borrar recursos.** Las versiones sin A0, incluidas las anteriores a P0 con H-1, pueden escribir y recoger en `images-v1` y en `localStorage` en cualquier momento:
- **Antes de migrar,** un escritor anterior a P0 puede borrar fotos de MUE-01 del legado. La copia de emergencia del paso 0 y la convivencia de §3 reducen ese riesgo, pero lo que se borró antes no se puede recuperar.
- **Durante la copia,** se toma una lista de claves y huellas de `images-v1` al principio y otra al verificar. Si una clave citada falta o cambió, se repite la copia hasta 3 veces. Si sigue cambiando, se detiene la migración con aviso de que hay un escritor antiguo activo (§11).
- **Después de conmutar,** el legado nunca es fuente de verdad. Que un escritor antiguo borre en `images-v1` no afecta a v2, y que modifique entra como divergencia (abajo).
- **Nada en F0.2c borra el legado** (R1-D5). Por eso un escritor antiguo no puede depender de que un recurso migrado siga existiendo en el legado.

**Detección de escritores antiguos.**
- Con A0, cada escritor registra su época en `meta.writersSeen` (§3, punto 4). La convivencia de R1-D1 cuenta desde el último escritor de época anterior visto.
- Sin A0 (versiones ya publicadas): en cada arranque, F0.2c compara `legacyHashes` con las huellas actuales de las claves de `localStorage`, de `persistence-v1` y de `images-v1`. Cualquier diferencia indica que escribió una versión antigua. Ese contenido entra como conflicto `legacy-diverged`, con sus recursos y su SHA-256, sin sobrescribir nada (§6, paso 5).
- La interfaz avisa de que hay una pestaña o una app antigua escribiendo (§11).

**Protección de recursos durante el rollback.**
- Durante la vuelta atrás y hasta que se confirme, no se recoge nada en ningún almacén. La recogida comprueba `meta.rollback` y, si existe, aborta.
- Los recursos creados en `store-v2` tras la conmutación se copian al legado **antes** de que el legado vuelva a ser autoridad. Se verifican por SHA-256 y se conservan también en `store-v2`.

## 7. Concurrencia

| Caso | Garantía |
|---|---|
| Dos pestañas F0.2c | Revisión base comparada dentro de la transacción, como en v1. La recogida es transaccional y no necesita contar pestañas |
| Pestaña F0.2c y pestaña con A0 sin migrar | Tras la conmutación, la de A0 rechaza escribir (§3) |
| Pestaña F0.2c y pestaña sin A0 | Escribe en el legado; se detecta en el paso 5 |
| Web Locks ausente | Migración con verificación de huellas; la recogida nunca barre el legado |
| Restauración de expediente en curso | `journal` y `pending:` en la misma base; la recogida los respeta |

## 8. Privacidad

- Las fotos de MUE-01 y los recursos privados **no salen del navegador**.
- Exportación ordinaria y expediente: sin cambios, excluyen las fotos (prueba de `photo-project.browser` [E]).
- **Exportación de emergencia (R1-D6):**
  - Botón aparte.
  - Aviso: «incluye fotos privadas de tus muebles y planos; guárdala en un lugar seguro».
  - Confirmación explícita y nombre de archivo propio.
  - Prueba: incluye todo recurso citado y la exportación ordinaria del mismo proyecto no contiene ningún byte de `mue01/*`.
- La migración no envía nada a la red. Una prueba lo comprueba bloqueando cualquier petición externa.

## 9. Rollback

| Tipo | Qué es | Procedimiento |
|---|---|---|
| **De código** | Desplegar una versión anterior | El legado está intacto (R1-D5) y la versión anterior lo abre con la barrera (§5). No hace falta tocar datos |
| **De datos** | Deshacer la conmutación | **R1-D11 (aprobada):** solo si se conservan **todos** los cambios posteriores. Pasos: (1) se toma `meta.rollback` y se detiene la recogida (§6 bis); (2) los documentos y recursos escritos en v2 tras la conmutación se llevan al legado, verificados por SHA-256; si algo no cabe o no verifica, se aborta y se ofrece la exportación de emergencia completa (R1-D6); (3) `authority='legacy'`, con confirmación humana. `store-v2` nunca se borra de forma automática. **Si v2 es ilegible**, no se pueden trasladar los cambios posteriores, así que el rollback de datos no está permitido. Se mantienen las escrituras bloqueadas y se ofrecen la exportación de lo que tenga la pestaña y la copia previa (§6, paso 0) |
| **P0 (#270)** | Revertir el merge | **No es automáticamente seguro:** reintroduce H-1, la pérdida de fotos MUE-01 citadas en la recogida. Solo se revierte si a la vez se bloquea la recogida o se aplica una corrección equivalente. P0 no tiene datos que revertir |

## 10. Matriz de pruebas R1

| ID | Corte | Prueba |
|---|---|---|
| R1-T01 | A0 | Otra pestaña sube la versión de `images-v1` en una prueba: la pestaña con A0 cierra su conexión y avisa |
| R1-T02 | A0 | Con la época mayor, ningún escritor confirma documento ni recurso; los cambios siguen en memoria y se puede exportar |
| R1-T03 | A0 | La época se lee dentro de la transacción: una carrera entre la conmutación y un guardado no deja escrituras mixtas |
| R1-T04 | A0 | Sin cambios de comportamiento con la época igual: suite de persistencia y P0 completas |
| R1-T10 | Migración | Copia byte a byte de documentos y recursos, con huellas iguales |
| R1-T11 | Migración | Interrupción real entre copia y verificación, y entre verificación y conmutación: el siguiente arranque repite y el origen queda intacto |
| R1-T12 | Migración | Cuota insuficiente antes de empezar: no se inicia y se avisa |
| R1-T13 | Migración | `QuotaExceededError` a mitad: sin `done`, se limpia lo parcial y el origen queda intacto |
| R1-T14 | Migración | Huella alterada: se aborta |
| R1-T15 | Migración | Recurso sin titular: se copia como `legacy:unclaimed` y no se recoge |
| R1-T16 | Migración | Foto de MUE-01 citada por otro proyecto, un conflicto, el diario o una extensión de versión futura: titular correcto o red de seguridad |
| R1-T17 | Migración | Pestaña sin A0 escribe en el legado después de conmutar: aparece `legacy-diverged` con sus recursos |
| R1-T18 | Migración | Dos pestañas inician la migración a la vez: una sola copia y un solo `done` |
| R1-T19 | Migración | Sin Web Locks: la verificación evita el doble `done` |
| R1-T20 | Migración | Volver a una versión anterior: lee el legado y la barrera, y no ve nada de v2 |
| R1-T21 | Migración | Rollback de datos (R1-D11): lo escrito en v2 se exporta y queda como conflicto |
| R1-T22 | Migración | Sin peticiones de red durante la migración |
| R1-T23 | Migración | Conmutación interrumpida antes de completar su transacción: la autoridad sigue siendo el legado y se repite |
| R1-T24 | Migración | Escritor antiguo sin A0 detectado por huellas, con sus recursos en `legacy-diverged` |
| R1-T25 | Migración | Rollback: lo escrito en v2 llega al legado verificado; sin espacio, se aborta y se ofrece la exportación completa; durante el rollback no se recoge nada |
| R1-T26 | Recursos | El historial de otra pestaña viva protege su recurso; al cerrarla, la recogida lo libera |
| R1-T27 | Migración | v2 ilegible tras conmutar (con testigo): escrituras bloqueadas, sin volver al legado automáticamente, con recuperación ofrecida |
| R1-T28 | Migración | Sin la copia de emergencia previa registrada, la migración no empieza. La copia contiene todos los recursos y su manifiesto SHA-256 |
| R1-T29 | Migración | Sin Web Locks: dos reservas simultáneas dan un solo dueño. Un dueño con token antiguo no consigue escribir. Un dueño muerto se reclama y se repite desde el paso 1 |
| R1-T30b | Migración | Un escritor antiguo borra o cambia un recurso citado durante la copia: se repite; si persiste, la migración se detiene con aviso |
| R1-T30 | Recursos | Confirmación atómica: un fallo a mitad no deja recurso sin titular ni titular sin recurso |
| R1-T31 | Recursos | `pending:` cubre la subida de foto o ZIP; una cancelación comprobada lo libera |
| R1-T32 | Recursos | La recogida transaccional borra el huérfano real y nada más; un registro ilegible aborta |
| R1-T33 | Recursos | Regresión H-1: los cinco casos de `tests/p0-mue01-gc.browser.test.cjs` sobre v2, incluido el cruce entre reutilizar una foto y una recogida en curso |
| R1-T40 | Privacidad | La exportación ordinaria no contiene bytes `mue01/*` |
| R1-T41 | Privacidad | La exportación de emergencia contiene todos los recursos citados, tras confirmar |
| R1-T42 | Privacidad | El aviso y la confirmación de la exportación de emergencia son visibles y accesibles |
| R1-T50 | Navegadores | Chromium, Firefox y Safari de escritorio; Safari de iOS y Chrome de Android (persistencia-v1 §10) |

## 11. Estados de persistencia en la interfaz (UX-FIRST · Perla)

Se aplican las tres reglas de oro del [protocolo UX-FIRST](https://github.com/Juanmaes83/floorplan-3d/blob/65e3ececf6ae37fec8bc21a338d0145c0c21fb77/docs/agents/PROTOCOLO-UX-FIRST-RUBIK-SOTA.md) (Codex, `65e3ecec`):
1. el diseño explica qué va a pasar, qué ocurrió y cómo corregirlo;
2. la persona puede usarlo sin ayuda;
3. ningún bloqueo sin explicación ni solución.

R1 solo fija **qué** comunica cada estado. La composición visual corresponde al corte UX de Codex.

**Perla** (`css/design-system.css`):
- `--info` en curso, `--success` confirmado, `--warn` riesgo con salida y `--danger` bloqueo, cada uno con su variante `-soft` de fondo;
- `--action` para la acción dominante, que es una sola por estado;
- componentes `.btn` y `.chip`, y foco `--focus`.

El color nunca va solo: siempre hay texto y un icono. Los estados de riesgo usan un aviso persistente, nunca uno efímero.

| Estado | Qué ocurrió, por qué y dónde | Siguiente paso (acción dominante) | Alternativa segura | Estado de los datos | Perla |
|---|---|---|---|---|---|
| Pendiente / guardando | Hay cambios aún sin confirmar en este navegador | — (automático) | Guardar ahora | «Tus cambios están en esta pestaña» | `--info` |
| Guardado | Confirmado en este navegador, revisión n | — | — | «Guardado en este navegador» | `--success` |
| No guardado | El guardado falló, con el motivo (cuota, permiso, error) | Reintentar | Exportación de emergencia | «Siguen en esta pestaña; no cierres» | `--danger` |
| Pestaña desactualizada (A0) | Otra pestaña usa una versión más nueva | Recargar | Exportación de emergencia | «Tus cambios siguen en esta pestaña» | `--warn` |
| Espacio insuficiente | Estimación de espacio libre frente al necesario | Liberar espacio (enlace a qué ocupa más) | Exportación de emergencia | «No se ha perdido nada guardado» | `--warn` |
| Copia previa a la migración | Antes de migrar hay que guardar una copia completa con fotos privadas | Descargar la copia (con confirmación) | Posponer la migración | «Nada ha cambiado todavía» | `--info` |
| Migración en curso | Paso k de n | — (no cerrar) | Posponer, si aún no se ha conmutado | «El almacén anterior sigue intacto» | `--info` |
| Migración detenida | Cuota, interrupción o escritor antiguo activo, indicando qué pestaña o app | Cerrar las otras pestañas y reintentar | Seguir con el almacén anterior | «El almacén anterior sigue intacto» | `--warn` |
| Almacén nuevo ilegible tras conmutar | No se puede leer la base nueva | Reintentar | Exportación de emergencia; copia previa; restaurar con confirmación (§9) | «No se escribe nada hasta resolverlo; tus cambios siguen en esta pestaña» | `--danger` |
| Conflicto recuperable | Otra pestaña o versión guardó a la vez | Revisar y elegir | Exportar las dos versiones | «Las dos versiones se conservan» | `--warn` |
| Exportación de emergencia | Incluye fotos privadas de tus muebles y planos | Descargar (tras confirmar) | Cancelar | «Solo se guarda donde tú elijas» | `--warn` |

**Aceptación:** prueba de autonomía de la regla 2 en los estados `--danger` y `--warn`, con una persona sin guía, dentro del gate humano del protocolo UX-FIRST.

## 12. Cortes y dependencias

| Orden | Corte | Depende de | Aceptación | Recuperación |
|---|---|---|---|---|
| 0 | P0 #270 | — | CI verde; auditoría; integración autorizada | Solo con una protección H-1 equivalente activa, o con la recogida bloqueada (§9). Nunca un revert simple |
| 1 | Consolidación P0 → #266 → #268 → #269 (Codex) | 0 | Batería completa sobre el candidato consolidado | Revertir #266, #268 o #269 por separado, conservando P0. Si hay que revertir P0, aplica la fila 0 |
| 2 | **A0** | 1 | R1-T01–T04 | Revertir el código mientras la época no haya subido, es decir, antes del corte 4. Después de conmutar, no se revierte A0 sin el rollback de datos de §9 |
| 3 | Convivencia de A0 | 2 activado | R1-D1: ≥7 días sin escritores de época anterior vistos | — |
| 4 | **F0.2c** (base v2, migración, recursos, recogida, emergencia) | 3 | R1-T10–T42 | Rollback de código: el legado está intacto (§9). Rollback de datos: solo con R1-D11 y conservando todos los cambios posteriores. Nunca de forma automática |
| 5 | F0.3 (interfaz completa, navegadores) | 4 | R1-T50, persistencia-v1 §10 | — |

**Antes de autorizar una migración deben estar integrados y activados:** P0, F0.2b y A0 (cortes 0 a 2), y cumplido el periodo de convivencia (corte 3).

## 13. Pendiente del propietario

- R1-D1 a R1-D11 están cerradas: R1-D5 registrada en el ADR §17; las demás, aprobadas el 19/11.
- Autorización específica para A0 e implementación (NO-GO vigente).
- Si se recupera el documento `4e4f1319`: conciliarlo con R1.
