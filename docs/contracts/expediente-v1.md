# Contrato · Expediente RUBIK v1 (`rubik-sota.expediente`)

**Corte:** F0.1 del [ADR de continuidad](https://github.com/Juanmaes83/floorplan-3d/blob/docs/reconciliacion-maestra-v1.12/docs/product/ADR-PERSISTENCIA-CONTINUIDAD-PROYECTO.md) (en la PR #261 hasta que se fusione). **Núcleo:** `js/expediente-core.js`. **Pruebas:** `tests/expediente.test.cjs`. Sin interfaz todavía: `index.html` no carga el módulo hasta F0.3.

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

## 4. Restauración

`restore(parsed, ctx)` añade una entrada nueva y no sobrescribe nada:

| Situación | Resultado |
|---|---|
| Mismo id, misma geometría y mismos documentos ya presentes | `already-present`; no escribe nada |
| Id libre en la biblioteca | Se conserva; presupuestos y observaciones quedan con el mismo id |
| Id ocupado en la biblioteca (por ejemplo, el proyecto cambió después de exportarlo) | La biblioteca asigna un id nuevo y conserva el original en `origin`. El presupuesto se copia como `bud_<nuevo>`; el del proyecto local no se toca |
| Id libre, pero con documentos de un proyecto borrado | Se asigna un id nuevo antes de importar, para que no se pierdan ni esos documentos ni los del expediente |
| Almacén de presupuestos u observaciones corrupto | Se rechaza sin escribir |
| Falla cualquier escritura | Se deshace todo: documentos, entrada de la biblioteca e imágenes |

## 5. Estrategia de F0.2 · biblioteca en IndexedDB

`project-library.js` es síncrono (`getItem`/`setItem`) y lo usan el editor, el historial, la guía y los presupuestos. F0.2 **no** cambia esa API:

1. **Fachada síncrona.** Un adaptador con la forma de `Storage` (`getItem`, `setItem`, `removeItem`) sirve las claves `rubik-*` desde una copia en memoria cargada al arrancar, antes de crear la biblioteca. Cada `setItem` actualiza la memoria al instante y encola la escritura en IndexedDB. La interfaz muestra «pendiente de guardar» mientras la cola no esté vacía. `Library.load(adapter, seed)` funciona sin cambios.
2. **Migración en dos fases, repetible.** Fase A: copiar las claves de `localStorage` a IndexedDB en una transacción y verificar la copia releyéndola y comparando huellas. Fase B: solo después, escribir en IndexedDB la marca `migrated` con las huellas. `localStorage` no se borra en F0.2. Si el navegador se cierra o falta espacio, la siguiente carga repite la fase A. Mientras no exista la marca, la fuente sigue siendo `localStorage`.
3. **Persistencia del navegador.** Se solicita `navigator.storage.persist()` y se informa del resultado y de `navigator.storage.estimate()`. Es una solicitud, no una garantía: el expediente exportable sigue siendo el respaldo real.
4. **Pruebas.** Las mismas de la biblioteca contra el adaptador; interrupción entre fases; cuota agotada en la fase A; segunda carga idempotente; recuperación del expediente desde la copia en IndexedDB.

## 6. Límites conocidos de F0.1

- Las variantes viajan como proyectos independientes: el enlace `variantOf` es metadato local y no se exporta. Un conflicto futuro que supere `MAX_VARIANTS` (2) se conservará como expediente de conflicto (ADR, §16).
- El registro de obra (`rubik-construction-v1`) se indexa por entrada de biblioteca. Queda para el siguiente corte, con su propio validador.
- El registro del Asistente queda fuera deliberadamente: puede contener datos personales y no es necesario para continuar el proyecto.
- Sin interfaz: exportar y recuperar desde la app es F0.3, sobre el control de #257.
