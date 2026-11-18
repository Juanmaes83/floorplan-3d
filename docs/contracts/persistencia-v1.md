# Contrato · Autoridad de persistencia (F0.2)

**Estado:** F0.2a cerrado en borrador (#263). La estrategia (contrato del expediente, §8) la aprobó el propietario el 18/11/2026 con condiciones. El editor **todavía no** usa esta autoridad: F0.2b (§8) se hará solo después de integrar #259 y #262 y de acordar el orden con Codex.
**Código:** `js/persistence-store.js` (`FloorPlanPersistence`), `js/local-images.js` (recogida segura), `js/expediente-core.js` (`recover()`), `js/tracing-ui.js` (`cleanup()`).
**Pruebas:** `tests/persistence.browser.test.cjs` (13) y `tests/expediente.browser.test.cjs` (4), en Chromium real. Los fallos de escritura de clave concreta se **simulan** con un envoltorio sobre el `localStorage` real; la cuota es real, en un perfil en disco.
**CI:** `.github/workflows/f0-persistencia.yml`, workflow propio (§9).
**Relacionado:** [Contrato del expediente](expediente-v1.md).

## 1. Decisión

IndexedDB (`rubik-sota-persistence-v1`) es la **única autoridad** de:
- la biblioteca de proyectos;
- el proyecto suelto anterior a la biblioteca;
- los presupuestos;
- las observaciones;
- el registro de obra.

Guarda, byte a byte, las mismas cadenas JSON que ya escriben `project-library`, `budget-core` y los demás módulos, y las devuelve con la misma interfaz `Storage`. No es otro motor. `index.html` ya entrega un objeto `storage` a `FloorPlanLibrary.load`.

**Quedan en `localStorage`:**
- el registro del Asistente (excluido a propósito);
- las preferencias de interfaz;
- el diario del expediente;
- las marcas de recogida de imágenes.

## 2. Garantías y cómo se cumplen

| Garantía | Mecanismo | Prueba (Chromium real) |
|---|---|---|
| «Guardado» solo con la transacción terminada | Estado «guardado» en `oncomplete`, con `durability: 'strict'` | Secuencia «pendiente → guardando → guardado»; recargar sin confirmar no da nada por guardado |
| Instantánea coherente con su revisión | Documentos y revisión se leen en **una** transacción de lectura | 300 lecturas mientras otra pestaña confirma 40 revisiones: ninguna mezcla |
| Coherencia entre biblioteca y documentos | Todo lo pendiente se confirma en una transacción | Por construcción |
| Sin depender de eventos de cierre | Autoguardado tras una pausa corta; `visibilitychange` y `pagehide` son solo oportunidades adicionales | Autoguardado confirmado |
| Recuperación del último estado confirmado | Al abrir se carga IndexedDB | Recargas |
| Fallo de escritura o cuota agotada | Error visible; los cambios siguen en memoria y se reintentan | Cuota real: error visible, nada confirmado perdido, guardado correcto al liberar espacio |
| Exportación de emergencia | JSON con todo lo que tiene la pestaña, más los **bytes de cada imagen** referenciada | Contiene el cambio no guardado |
| Escrituras concurrentes | Revisión base comparada dentro de la transacción, bajo un Web Lock | La segunda pestaña no sobrescribe |
| Conflictos recuperables | §3 | Reconstrucción completa tras perder la memoria de la pestaña |

## 3. Conflictos

**Hallazgo confirmado.** El registro de conflicto guardaba solo el lote. Los cambios que llegaban durante la transacción o después del conflicto quedaban **solo en memoria**.

**Ahora:**
- El registro guarda el **estado completo** de la pestaña (todas las claves gestionadas tal como las ve: biblioteca y documentos coherentes entre sí), no solo el lote.
- Mientras la pestaña sigue en conflicto, cada cambio posterior **reescribe ese mismo registro** en IndexedDB. Nada queda solo en memoria; si esa escritura falla, se avisa y se indica la exportación de emergencia.
- `conflictExport(id)` genera el mismo formato que la exportación de emergencia, con las imágenes.
- `adoptConflict(id)` recupera ese trabajo. Primero guarda el estado confirmado vigente como conflicto `superseded`; después confirma el del conflicto en una transacción. No se descarta nada en ninguno de los dos sentidos.
- Los conflictos nunca entran como variantes, así que `MAX_VARIANTS` no puede descartar trabajo.

**Prueba.** La pestaña B cambia la biblioteca y un presupuesto, recibe otro cambio con la transacción en curso y otro después del conflicto, y se cierra. En una pestaña nueva, solo con el registro, se reconstruyen:
- el proyecto renombrado;
- el presupuesto;
- ambos cambios posteriores;
- la imagen, en IndexedDB y en la exportación.

La versión de la pestaña A queda como `superseded`.

## 4. Migración

| Requisito | Cómo |
|---|---|
| Ningún borrado de originales | La migración no modifica `localStorage`; los originales se guardan además en `legacy` con su huella SHA-256 |
| Verificada | Fase A: copia. Se relee y se comparan huellas. Fase B: marca `done` |
| Idempotente y resistente a interrupciones | Sin `done`, la fase A se repite completa; antes de `done` nadie escribe en la autoridad |

Probado: copia byte a byte; `localStorage` idéntico tras migrar; una segunda migración no hace nada; interrupción real entre fases.

## 5. Volver a una versión anterior de RUBIK

**Hallazgo confirmado.** La copia de compatibilidad escribía las claves una a una. Una interrupción entre dos claves dejaba en `localStorage` datos de revisiones distintas, y una versión anterior los habría abierto en silencio.

**Protocolo actual** (con el bloqueo de persistencia tomado):
0. Si `localStorage` cambió desde la última copia (escribió una versión anterior), su contenido completo se guarda como conflicto `legacy-diverged` **antes** de sobrescribirlo.
1. **Barrera:** la clave de la biblioteca pasa a ser una marca que la versión anterior rechaza de forma visible («No se pudo abrir la colección local…»).
2. Se escriben las demás claves desde una sola instantánea de la autoridad.
3. La biblioteca se escribe **la última**. Solo entonces `localStorage` es una copia completa de una sola revisión.

| Caso | Resultado | Prueba |
|---|---|---|
| Interrupción entre claves | La barrera queda; la versión anterior rechaza la biblioteca; el siguiente arranque repite la copia completa | Recarga real tras la barrera |
| Fallo parcial | Queda bloqueada (`ok: false`, `blocked: true`) y se repara en el siguiente arranque | Fallo simulado de una clave |
| Fallo al escribir la barrera | No se escribe ninguna otra clave: `localStorage` sigue siendo una única revisión anterior. El estado lo dice: «no abras una versión anterior» | Fallo simulado; `localStorage` idéntico. Es una barrera más pequeña que el valor que sustituye, así que en la práctica solo falla con un `localStorage` inutilizable, que tampoco podría leer una versión anterior |
| Una versión anterior escribe con la nueva abierta | Se guarda como conflicto antes de la siguiente copia | Probado |

**Estrategia operativa de vuelta atrás:**
1. Antes de desplegar una versión anterior, abrir la actual y comprobar que el estado de la copia de compatibilidad es `ok`.
2. Si no lo es, usar la exportación de emergencia o el expediente.
3. Al volver a la versión actual, lo que hizo la anterior aparece como conflicto `legacy-diverged`, recuperable.

**Límite:** ante la barrera, la versión anterior abre su proyecto suelto tras el aviso. Es el comportamiento ya publicado y no se puede cambiar.

## 6. Imágenes

La recogida (`FloorPlanImages.collect`) no borra nunca una imagen referenciada por:
- el estado guardado, leído dentro del bloqueo;
- la autoridad de persistencia y **cualquier registro de conflicto**;
- una entrada del diario de recuperación, es decir, un expediente pendiente o una operación sin confirmar.

Además:
- Se ejecuta bajo el mismo Web Lock que la restauración.
- **Cuando Web Locks confirma que solo está registrada la pestaña actual**, una imagen huérfana se libera en el acto. Borrar el último proyecto que la usa libera su espacio, como antes de F0.2.
- **Con otra pestaña abierta** solo se marca, porque esa pestaña puede tener trabajo sin guardar. La primera pasada que se haga a solas la libera. Cada pestaña mantiene un Web Lock `rubik-sota-tab:` (lo toma `tracing-ui` al cargar).
- **Sin Web Locks o sin registro verificable de la pestaña actual**, solo se marca. El paso del tiempo no autoriza el borrado.

**Hallazgo de CI, confirmado (#263 en `8cf0664`, job `contract`).** `building.browser`, en sus 3 tamaños de pantalla, exige que borrar el último proyecto que usa una imagen la libere. Un periodo de gracia aplicado siempre lo impedía. Con la regla anterior, las dos garantías se cumplen a la vez:
- ninguna imagen legítima desaparece (pruebas de esta suite);
- los huérfanos reales recuperan su espacio (`building.browser`).

**Probado:**
- restauración en curso en otra pestaña;
- restauración ya confirmada;
- imagen de un conflicto;
- con otra pestaña abierta no se barre, y sí a solas (conservando la del conflicto);
- sin Web Locks, una segunda pasada transcurrido un día tampoco borra.

**Hallazgo anterior mantenido:** `recover()` no deshace con una copia desactualizada de la biblioteca ni toca registros recientes.

**F0.2c** llevará las imágenes y el diario a la misma base que la biblioteca. Imagen, documento y biblioteca se confirmarán en una transacción, y la recogida será una consulta sobre una sola autoridad.

## 6 bis. SCULPT · bloques adoptados de openPlan3D

Donante: `Juanmaes83/openPlan3D` (fork MIT de `laanlabs/openPlan3D`), `771c9e1`. Solo se adoptan bloques que mejoran lo que ya existe; cada uno lleva la atribución en el código.

| Bloque | Origen | Dónde | Por qué |
|---|---|---|---|
| Llamada de bloqueo que nunca rechaza | `datastore.ts`, `mutateLibrary` | `persistence-store`, `expediente-core`, `local-images` | Firefox informa como error no capturado una llamada de bloqueo que rechaza enseguida |
| Apertura bloqueada sin conexión colgada | `localDatabase.ts`, `openDatabase` | `persistence-store`, `open()` | Una apertura rechazada ya no deja una conexión que bloquee otras pestañas |
| Códigos de cuota 22 y 1014 (Firefox) y `SecurityError` | `datastore.ts`, `storageErrorMessage` | `persistence-store` | Mensaje correcto fuera de Chromium |
| `persist()` tras un guardado confirmado iniciado por la persona | `storagePersistence.ts` | `storage-persistence.js` | La petición no retrasa el guardado |

**Candidatos, no adoptados en F0.2a:**
- **Copias recuperadas visibles** (`localDatabase.ts`, `migrateLegacy`). Lo que escribe una pestaña antigua aparece en la biblioteca como «copia recuperada», y se reutiliza mientras no se edite. Mejora la visibilidad de nuestros conflictos `legacy-diverged` sin esperar a una interfaz. Corresponde a F0.3, porque toca la biblioteca y `MAX_VARIANTS`.
- **Comparación por proyecto** (`datastore.ts`, `save`/`delete`). Compara el registro concreto en lugar de una revisión global, así que hay menos conflictos falsos entre proyectos distintos. Encaja cuando la biblioteca deje de ser una sola cadena; se evaluará en F0.2c.
- **Historial de versiones** (`versionHistory.ts`, `snapshotStorage.ts`). Diez instantáneas por proyecto con recursos compartidos entre versiones. RUBIK no tiene historial; candidato para F0.3 o posterior, sin crear una autoridad paralela.

## 7. Orden recomendado

1. **Cerrar F0.2a** (#263) con su CI en verde.
2. **Integrar #259 (Codex) y luego #262**, después de que el propietario lo autorice. Después, #263 se rebasa sobre master.
3. **F0.2b** parte del SHA de master resultante: el que incluya #259, #262 y #263. Hoy no existe; se fijará al integrarlos.
4. **F0.2c antes de habilitar la persistencia para usuarios reales.** Sin F0.2c, una restauración o una imagen nueva sigue escribiendo en dos bases y depende del diario y de la recogida protegida. Es seguro, pero no es una autoridad única.
5. **F0.3:** interfaz de estado, conflictos, exportación de emergencia, `recover()` al arrancar y `persist()`. Incluye la validación de navegadores (§10) antes de cualquier entorno público.

## 8. Mapa de F0.2b

**No se ha modificado ninguno de estos archivos.**

| Consumidor | Claves | Acceso hoy | Cambio previsto | Lo toca otra PR |
|---|---|---|---|---|
| `index.html` | proyecto suelto y, a través del objeto `storage`, biblioteca | `localStorage` directo (6 puntos) y objeto `storage` | Crear la sesión antes de `FloorPlanLibrary.load` y pasar `session.storage` | #255, #257, #259 |
| `js/budget-ui.js` | presupuestos, biblioteca | `localStorage` directo (4) | Recibir el `storage` de la sesión | — |
| `js/construction-context.js` | presupuestos, obra, biblioteca | `localStorage` directo (7) | Ídem | — |
| `js/review-notes-ui.js`, `js/project-dossier-ui.js`, `js/professional-workspace-ui.js` | observaciones | `localStorage` directo (2, 1 y 1) | Ídem | — |
| `js/cat04-ui.js`, `js/catalog-budget-core.js`, `js/construction-project-adapter.js`, `js/construction-record-core.js`, `js/project-library.js`, `js/expediente-core.js` | presupuestos, obra | Ya reciben `storage` como parámetro | Ninguno: basta con pasarles la sesión | — |

**Pruebas de F0.2b:**
- las suites de navegador existentes de presupuestos, obra, observaciones, variantes y edificio, ejecutadas contra la sesión;
- una prueba de editor completo (`index.html`) que guarde, recargue y recupere un conflicto;
- la migración de un perfil con datos reales de la versión actual.

## 9. CI

La guardia `ci-impact` compara los workflows de la rama base. #263 parte de #262, donde ya existe `f0-expediente.yml`, así que modificarlo violaba la guardia. Por eso la suite de persistencia va en `f0-persistencia.yml`:
- `f0-expediente.yml` queda exactamente como en #262;
- la guardia no se toca;
- ninguna prueba se ejecuta dos veces.

**Tras integrarse en master**, ambas suites deberían pasar a `tests/regression-partitions.json`, coordinado con Codex (#259 modifica ese archivo).

`f0-almacenamiento-persistente.yml` ejecuta una sola vez la suite unitaria del permiso. La prueba de la conexión con IndexedDB vive en la suite Chromium ya existente de F0.2.

El permiso se solicita desde `storage-persistence.js` cuando `session.flush({userEvent})` recibe un clic o una tecla de confianza y la transacción confirma una escritura. Migración, autoguardado, guardado vacío y conflicto quedan fuera. El guardado termina sin esperar al permiso. `session.storageStatus()` consulta estado y cuota sin abrir avisos. Tanto el permiso como la recomendación de copia se pueden consumir sin conectar aún el editor.


## 10. Validación de navegadores (planificada para F0.3)

Antes de cualquier entorno público hay que acreditar, en Chromium, Firefox y Safari de escritorio, y en Safari de iOS y Chrome de Android:
- guardar y recargar;
- cuota;
- dos pestañas;
- migración;
- conflicto;
- exportación de emergencia;
- borrado de datos del sitio por el navegador (desalojo).

Puntos a vigilar:
- `durability: 'strict'`;
- `navigator.locks` (Safari 15.4 o posterior);
- `indexedDB.databases()`;
- `BroadcastChannel`;
- el desalojo de datos en iOS.

Ahora no se ejecuta porque el módulo no está conectado al editor.

## 11. Límites

- Hasta F0.2b, las garantías son del módulo, no del producto.
- Lo que no se ha confirmado se pierde si el navegador se cierra de golpe. Siempre se muestra como «pendiente», y la exportación de emergencia lo cubre mientras la pestaña está abierta.
- `durability: 'strict'` y `persist()` son peticiones al navegador, no garantías.
- Solo se ha probado en Chromium (§10).
- La copia de compatibilidad duplica las escrituras en `localStorage` y calcula huellas de las claves gestionadas en cada guardado, mientras se mantenga el soporte a versiones anteriores.
