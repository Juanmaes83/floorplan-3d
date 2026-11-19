# Contrato · F0.2c · Autoridad única de recursos — Revisión R1 (nueva)

**Identidad de este documento.** Es una **revisión nueva**, R1, redactada el 19/11/2026 a partir del código real, las evidencias disponibles y las decisiones registradas. **No reconstruye** el diseño F0.2c anterior (commit `4e4f131975c6ff100b34f78a989bd25b075c48ac`, árbol `596c2fd78c0af561b56e8e062d3918aa73e421c3`). Ese commit, sus tres expedientes, la matriz T01–T53 y las decisiones D1–D8 no están en GitHub ni en el entorno de trabajo. Si se recuperan, se compararán con R1 y prevalecerá lo que el propietario decida. Para no confundirlas con las originales, las pruebas de R1 se numeran **R1-T** y las decisiones **R1-D**.

**Completa, no sustituye:**
- [persistencia-v1.md](persistencia-v1.md): la autoridad F0.2, sus conflictos, la migración de documentos, la vuelta a una versión anterior y la recogida de imágenes. En especial §6, «F0.2c llevará las imágenes y el diario a la misma base».
- [ADR de persistencia](../product/ADR-PERSISTENCIA-CONTINUIDAD-PROYECTO.md), §16 y §17. El diseño de §17 se mantiene; R1 lo concreta.

**Estado:** solo diseño. **NO-GO** para implementar A0, F0.2c o cualquier migración de IndexedDB sin autorización específica.

**Marcas de evidencia:** **[E]** ejecutada · **[I]** inspeccionada en el código · **[H]** histórica, declarada en otra PR o documento · **[P]** pendiente.

## 0. Fuentes

| Fuente | SHA |
|---|---|
| master | `dd528119bdfd80733c4faf5bb56a594190fea5ac` |
| P0 H-1 · [#270](https://github.com/Juanmaes83/floorplan-3d/pull/270) | `924982dcda0fce313adde6042eb6830f6684bf0b` |
| F0.2b · [#269](https://github.com/Juanmaes83/floorplan-3d/pull/269) | `956bce96b1d50edb60a8b8aaa3b742f3678261bb` |
| OP-02 [#266](https://github.com/Juanmaes83/floorplan-3d/pull/266) · OP-04 [#268](https://github.com/Juanmaes83/floorplan-3d/pull/268) | `edfbf66b` · `497c37fb` (no tocan persistencia [I]) |

Simulación P0 → #266 → #268 → #269: árbol `25a4e7c3a3344ceee916f233971018bb5db84877`. Persistencia 21/21 y H-1 4/4 en Chromium [E] (detalle en #270).

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
| F3 | Con P0, una clave está viva si su texto aparece en cualquier estado legible, o está fijada (`pin`) o registrada (`holder`). Si un estado no se puede leer, no se borra nada | [E] #270 |
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
| R1-D1 | A0 antes de migrar | Ninguna migración de esquema se autoriza hasta que A0 (§3) esté integrado, activado y en uso durante un periodo de convivencia | Propuesta |
| R1-D2 | Autoridad única de recursos | Bytes, referencias, diario y documentos en **una** base, con confirmación en **una** transacción (§4). Concreta el ADR §17 | Registrada (ADR §17); concreción propuesta |
| R1-D3 | Migración sin doble escritura | Copiar, verificar y conmutar. Después, la base nueva es la única escrita. Los almacenes legados se conservan solo para lectura (§6) | Propuesta (fases registradas en persistencia-v1 §4) |
| R1-D4 | Protección conservadora | La regla de P0 (mención textual, fallo cerrado) se mantiene como **red de seguridad** aunque existan referencias explícitas. Nunca se borra un recurso cuyo estado no pueda determinarse | Acreditada (P0) como invariante; mantenerla, propuesta |
| R1-D5 | Almacén legado | `rubik-sota-images-v1` y las claves de `localStorage` no se borran en F0.2c. Su limpieza exige una decisión aparte, cuando no queden escritores antiguos (§6) | Registrada (ADR §17) |
| R1-D6 | Exportación de emergencia privada | Un producto **separado** de la exportación ordinaria, con aviso y confirmación explícita. Incluye **todos** los recursos, también las fotos de MUE-01 (corrige F4). La exportación ordinaria sigue sin fotos privadas | Propuesta |
| R1-D7 | Rollback | Se distingue el rollback de código del rollback de datos (§9). Ninguna vuelta atrás de código borra datos | Propuesta (base en persistencia-v1 §5) |
| R1-D8 | Integridad | Cada recurso registra `sha256`, bytes y tipo. La migración verifica la huella y no conmuta si alguna no coincide. «Huella», no «firma» (ADR §16) | Propuesta |

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
- Periodo de convivencia acordado por el propietario. La duración no se fija aquí: **R1-D1**.

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
2. **Operaciones en vuelo.** Al subir una foto o importar un ZIP se crea una fila `pending:<op>` en la misma transacción que los bytes. La confirmación la sustituye por `doc:`. Una cancelación comprobada la elimina. Sustituye a `pin()` en memoria.
3. **Recogida.**
   - Es una transacción `readwrite` única: recursos sin ninguna fila `refs`, menos la red de seguridad de R1-D4 (mención textual en `docs`, `conflicts`, `journal` y en el almacén legado mientras exista).
   - No depende de Web Locks ni de contar pestañas.
   - Un registro ilegible aborta la pasada.
4. **Historial en memoria.** Deshacer y rehacer no se persisten. El titular `pending:` cubre la ventana entre quitar una foto y la recogida. **R1-D9** (propuesta): no recoger recursos de la sesión actual mientras haya historial que los cite. Equivale al `holder()` de P0.
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
- La versión anterior encuentra el legado intacto, con el estado previo a la migración o a la última copia, y la barrera.
- Lo que escriba ahí aparece como conflicto `legacy-diverged` al volver a F0.2c.
- **R1-D10** (propuesta): ¿mantener la copia de compatibilidad (escribir también la biblioteca en `localStorage`) durante F0.2c? Hacerlo contradice «sin doble escritura» (R1-D3). Recomendación: no mantener la copia, conservar la barrera y apoyarse en la exportación de emergencia.

## 6. Migración transaccional

Bajo el Web Lock `rubik-sota-persistence`, cuando está disponible; sin él, la verificación del paso 4 decide.

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
| **De datos** | Deshacer la conmutación | **R1-D11** (propuesta): un interruptor `meta.authority='legacy'`, solo con confirmación humana. F0.2c vuelve a leer el legado y conserva `store-v2` para comparar. Lo escrito en v2 después de conmutar se ofrece como exportación y conflicto antes de volver. Nunca se borra `store-v2` automáticamente |
| **P0 (#270)** | Revertir el merge | Sin datos que revertir: solo impide borrar |

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
| R1-T30 | Recursos | Confirmación atómica: un fallo a mitad no deja recurso sin titular ni titular sin recurso |
| R1-T31 | Recursos | `pending:` cubre la subida de foto o ZIP; una cancelación comprobada lo libera |
| R1-T32 | Recursos | La recogida transaccional borra el huérfano real y nada más; un registro ilegible aborta |
| R1-T33 | Recursos | Regresión H-1: los cuatro casos de `tests/p0-mue01-gc.browser.test.cjs` sobre v2 |
| R1-T40 | Privacidad | La exportación ordinaria no contiene bytes `mue01/*` |
| R1-T41 | Privacidad | La exportación de emergencia contiene todos los recursos citados, tras confirmar |
| R1-T42 | Privacidad | El aviso y la confirmación de la exportación de emergencia son visibles y accesibles |
| R1-T50 | Navegadores | Chromium, Firefox y Safari de escritorio; Safari de iOS y Chrome de Android (persistencia-v1 §10) |

## 11. Estados de persistencia en la interfaz

Las pautas UX-FIRST son de Codex. R1 solo fija **qué** comunica la persistencia:
- pendiente, guardando, guardado y no guardado (con el motivo);
- pestaña desactualizada (A0);
- migración en curso, completada o detenida (cuota, interrupción o reintentos agotados);
- conflicto recuperable (incluido `legacy-diverged`);
- espacio insuficiente, con la estimación;
- exportación de emergencia con aviso de contenido privado.

Ningún estado de riesgo se comunica solo con color o con un aviso efímero.

## 12. Cortes y dependencias

| Orden | Corte | Depende de | Aceptación | Recuperación |
|---|---|---|---|---|
| 0 | P0 #270 | — | CI verde; auditoría; integración autorizada | Revertir el merge |
| 1 | Consolidación P0 → #266 → #268 → #269 (Codex) | 0 | Batería completa sobre el candidato consolidado | Revertir los merges |
| 2 | **A0** | 1 | R1-T01–T04 | Revertir. La época no sube sin el corte 4 |
| 3 | Convivencia de A0 | 2 activado | R1-D1: periodo decidido por el propietario | — |
| 4 | **F0.2c** (base v2, migración, recursos, recogida, emergencia) | 3; R1-D3, D6, D8, D10, D11 decididas | R1-T10–T42 | §9 |
| 5 | F0.3 (interfaz completa, navegadores) | 4 | R1-T50, persistencia-v1 §10 | — |

**Antes de autorizar una migración deben estar integrados y activados:** P0, F0.2b y A0 (cortes 0 a 2), y cumplido el periodo de convivencia (corte 3).

## 13. Pendiente del propietario

- **R1-D1:** duración de la convivencia de A0.
- **R1-D3:** migración sin doble escritura.
- **R1-D6:** exportación de emergencia privada que incluye las fotos de MUE-01.
- **R1-D8:** huellas obligatorias de los recursos.
- **R1-D9:** historial en memoria como titular.
- **R1-D10:** copia de compatibilidad durante F0.2c.
- **R1-D11:** interruptor de rollback de datos.
- Si se recupera el documento `4e4f1319`: conciliarlo con R1.
