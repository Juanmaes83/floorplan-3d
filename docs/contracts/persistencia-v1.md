# Contrato · Autoridad de persistencia (F0.2)

**Estado:** F0.2a entregado en borrador. La estrategia (contrato del expediente, §8) la aprobó el propietario el 18/11/2026 con condiciones. El editor **todavía no** usa esta autoridad: conectarlo es F0.2b y requiere coordinarlo antes con Codex.
**Código:** `js/persistence-store.js` (`FloorPlanPersistence`), `js/local-images.js` (recogida segura de imágenes), `js/expediente-core.js` (`recover()`), `js/tracing-ui.js` (`cleanup()`).
**Pruebas:** `tests/persistence.browser.test.cjs` (8) y `tests/expediente.browser.test.cjs` (4), ambas en Chromium real.
**Relacionado:** [Contrato del expediente](expediente-v1.md).

## 1. Decisión

IndexedDB (`rubik-sota-persistence-v1`) es la **única autoridad** de:
- la biblioteca de proyectos;
- el proyecto suelto anterior a la biblioteca;
- los presupuestos;
- las observaciones;
- el registro de obra.

No es otro motor. Guarda, byte a byte, las mismas cadenas JSON que ya escriben `project-library`, `budget-core` y los demás módulos bajo sus claves de `localStorage`, y las devuelve con la misma interfaz `Storage` (`getItem`, `setItem`, `removeItem`). `index.html` ya entrega un objeto `storage` a `FloorPlanLibrary.load`, así que conectar el editor consiste en sustituir ese objeto. No hay que reconstruir el editor.

**Quedan en `localStorage`:**
- el registro del Asistente (datos personales, excluido a propósito);
- las preferencias de interfaz;
- el diario del expediente;
- las marcas de recogida de imágenes.

## 2. Garantías y cómo se cumplen

| Garantía | Mecanismo | Prueba (Chromium real) |
|---|---|---|
| «Guardado» solo con la transacción terminada | El estado pasa a «guardado» en `oncomplete`, con `durability: 'strict'`. Antes es «pendiente» o «guardando» | Secuencia observada «pendiente → guardando → guardado»; recargar sin confirmar no da nada por guardado |
| Coherencia entre biblioteca y documentos | Todo lo pendiente se confirma en **una** transacción | Por construcción: solo hay una transacción por guardado |
| Sin depender de eventos de cierre | Guardado automático tras una pausa corta. `visibilitychange` (oculta) y `pagehide` solo son oportunidades adicionales | Autoguardado confirmado sin cerrar nada |
| Recuperación del último estado confirmado | Al abrir se carga lo que hay en IndexedDB | Recarga tras guardar y recarga sin confirmar |
| Fallo de escritura o cuota agotada | Estado «error al guardar» visible. Los cambios siguen en memoria y se reintentan al recuperar espacio | Cuota real en un perfil en disco (`Storage.overrideQuotaForOrigin`): error visible, nada confirmado perdido, guardado correcto al liberar espacio |
| Exportación de emergencia | `emergencyExport()`: un JSON con todo lo que la pestaña tiene, guardado o no. No necesita IndexedDB | Contiene el cambio que no se pudo guardar |
| Escrituras concurrentes | Cada guardado lleva su revisión base y se compara dentro de la transacción, bajo un Web Lock. `BroadcastChannel` avisa a las demás pestañas | La segunda pestaña no sobrescribe a la primera |
| Trabajo pendiente ante conflictos | El trabajo de la pestaña que pierde se guarda como **registro de conflicto** (almacén propio, persiste entre recargas, se puede listar y exportar) y además sigue en memoria. Nunca va como variante, así que `MAX_VARIANTS` no puede descartar trabajo | Registro de conflicto con los datos de la segunda pestaña |
| Comunicación honesta | Estados «guardado», «pendiente», «guardando», «error», «conflicto», «desactualizada»; aviso de copia de compatibilidad no actualizada; resultado de `persist()` | — |

## 3. Migración

| Requisito | Cómo |
|---|---|
| Ningún borrado de originales | La migración **no modifica `localStorage`**. Además, los valores originales se guardan en el almacén `legacy` con su huella SHA-256 |
| Verificada | Fase A: copia. Después se relee y se comparan huellas. Fase B: marca `done` |
| Idempotente | Con la marca `done` no se repite. Sin ella, la fase A se repite completa; es segura porque antes de `done` nadie escribe en la autoridad |
| Resistente a interrupciones | Interrumpida entre fases, la siguiente apertura la completa |
| Reversible | Ver §4 |

Probado: copia byte a byte, `localStorage` byte a byte idéntico tras migrar, segunda migración `already` e interrupción real (recarga) entre fases.

## 4. Volver a una versión anterior de RUBIK

1. **Copia de compatibilidad.** Tras cada guardado confirmado, las claves cambiadas se copian a `localStorage`. Una versión anterior abre así el último estado confirmado, no una copia antigua. Probado: el `FloorPlanLibrary.load(localStorage)` de la versión anterior ve el cambio.
2. **Si la copia falla** (por ejemplo, `localStorage` lleno), la clave de la biblioteca se sustituye por una marca que la versión anterior rechaza de forma visible («No se pudo abrir la colección local…»), en lugar de dejarla trabajar en silencio con datos antiguos. Los datos siguen en IndexedDB y el resultado del guardado lo indica. Probado.
3. **Lo que escriba una versión anterior** después de la última copia se detecta al volver a abrir la versión actual. Se guarda como conflicto `legacy-diverged`, no se aplica ni se pierde y se registra una sola vez. Probado.
4. **Límite.** Una versión anterior que vea la marca del punto 2 abre su proyecto suelto (`rubik-sota-floorplan-project-v1`) tras el aviso. Es el comportamiento que ya tiene ante una biblioteca ilegible y no se puede cambiar sin modificar versiones ya publicadas. La recuperación pasa por volver a la versión actual o usar la exportación de emergencia.

## 5. Imágenes y recuperación concurrentes

**Hallazgo de ChatGPT, confirmado.** `cleanup()` borraba toda imagen que la biblioteca de **su** pestaña no referenciaba. Eso incluía:
- las de una restauración en curso, porque las imágenes se escriben antes de confirmar;
- las de proyectos que otra pestaña acababa de confirmar.

La recogida (`FloorPlanImages.collect`) tiene ahora tres protecciones independientes:
1. Se ejecuta bajo el **mismo Web Lock que la restauración** (`rubik-sota-expediente`), así que nunca se intercala con una restauración en curso.
2. Las referencias vivas se calculan **dentro del bloqueo**, leyendo el estado guardado (no la copia de la pestaña), y suman las imágenes de cada entrada del diario de recuperación.
3. **Marcar y barrer:** una imagen sin referencia solo se marca. Se borra en una pasada posterior si sigue sin referencia tras un periodo de gracia (10 minutos). Una confirmación intermedia la salva.

**Hallazgo adicional, confirmado:** `recover()` decidía con la copia de la biblioteca de la pestaña. Una copia desactualizada habría deshecho una restauración ya confirmada por otra pestaña, borrando sus presupuestos e imágenes. Ahora:
- un proyecto cuenta como vivo si lo tiene la biblioteca guardada **o** la copia de la pestaña;
- una biblioteca guardada ilegible detiene la recuperación sin deshacer nada;
- los registros con menos de 2 minutos se dejan pendientes, porque `localStorage` llega con retraso a otras pestañas.

| Prueba (Chromium real) | Resultado |
|---|---|
| Restauración detenida a mitad en la pestaña A; la pestaña B, con su biblioteca desactualizada, pide borrar sin periodo de gracia | B espera al bloqueo; al confirmar A, no se borra nada |
| Sin Web Locks, con una restauración a medias en el diario | Su imagen no se borra y la ya confirmada tampoco |
| `recover()` con una copia desactualizada y una entrada de diario de una restauración confirmada | `committed: 1`; imagen y presupuesto intactos |

## 6. Cortes

| Corte | Contenido | Estado |
|---|---|---|
| F0.2a | Autoridad, migración, concurrencia, conflictos, compatibilidad hacia atrás, exportación de emergencia, recogida segura de imágenes y `recover()` seguro | Esta PR |
| F0.2b | Conectar el editor: sustituir el `storage` de `index.html` por la sesión y mostrar el estado del guardado. Los consumidores de presupuestos que leen `localStorage` directamente pasan a la sesión. **Requiere coordinarlo antes con Codex:** `index.html` lo tocan #255, #257 y #259 | Pendiente |
| F0.2c | Imágenes en la misma base de datos y en la misma transacción que la biblioteca; el diario del expediente pasa a la autoridad (desaparece la ventana entre almacenes de F0.1) | Pendiente |
| F0.3 | Interfaz: conflictos, exportación de emergencia, `recover()` al arrancar, `persist()` | Pendiente |

## 7. Límites

- Hasta F0.2b nada del editor usa esta autoridad: las garantías de §2 son del módulo, probado en Chromium real, no del producto.
- La cola en memoria que aún no se ha confirmado se pierde si el navegador se cierra de golpe. Siempre se muestra como «pendiente» y la exportación de emergencia la cubre mientras la pestaña está abierta.
- `durability: 'strict'` y `persist()` son peticiones al navegador, no garantías.
- Las pruebas se ejecutan en Chromium. Firefox y Safari no se han probado.
- La copia de compatibilidad duplica las escrituras en `localStorage` mientras se mantenga el soporte a versiones anteriores.
