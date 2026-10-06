# Fase C (propuesta Pascal→Rubik): variantes seguras

**Estado: implementación en rama aislada `claude/phase-c-safe-variants`, pendiente de revisión humana.**

- No es una fase canónica.
- Autorizada expresamente por Juanma solo para esta Fase C. No aprueba las fases D–G ni convierte la [propuesta](../proposals/PASCAL-RUBIK-INTEGRATION-ROADMAP.md) en roadmap canónico.
- **Base:** `master` `217ed068b90232907a40b8dff7748a11e6259e7f`, tras el merge de la PR #29.
- **Independiente de la PR documental #28.**

## Qué permite

1. **Crear variante.** En «Proyectos» → «Crear variante del proyecto abierto» se crea una copia independiente del proyecto **tal como se ve en pantalla** y se abre.
2. **Editar la copia.** El original no cambia.
3. **Comparar distribuciones.** «Comparar distribuciones» muestra hasta **3 distribuciones** (el original y 2 variantes), una tarjeta por proyecto:
   - superficie útil;
   - número de muebles;
   - estado global de la revisión de distribución de la Fase A;
   - para solapes, holgura y barrido de puertas, el estado (`checked` → «comprobado», `partial` → «parcial», `insufficient_evidence` → «evidencia insuficiente») y el número de avisos;
   - elementos sin evaluar;
   - escala no confirmada.
4. **Abrir** cualquier distribución desde su tarjeta.
5. **Borrar una variante** con una confirmación que nombra la copia y el original.

**Holgura.** No hay umbral predeterminado. Sin umbral, la tarjeta dice «evidencia insuficiente · sin umbral indicado». La persona puede indicar uno en el diálogo; vive solo en memoria y no se guarda.

**Avisos.** Se presentan como geométricos y orientativos. La interfaz no habla de errores normativos, incumplimientos ni accesibilidad conforme.

## D-C1: dónde vive el vínculo

- La relación variante → original es el campo opcional **`variantOf` de la entrada** de la colección local (`rubik-sota-project-library-v1`).
- Contiene el **`id` de la entrada** de la biblioteca, nunca IDs de entidades del proyecto.
- **No** forma parte de `FloorPlanProjectV1`:
  - no hay `extensions`, campos nuevos ni cambios de versión o schema;
  - el JSON exportado es un proyecto normal (comprobado con `Core.validate` y sin la cadena `variantOf`).
- Si se exporta una variante y se importa en otra instalación, es un proyecto válido, pero sin vínculo con su origen. El diálogo «Proyectos» lo explica.

## Decisiones y reglas

| Tema | Decisión |
| --- | --- |
| Origen de la copia | `library.variant(visible)` recibe el **proyecto en memoria**, que es el que se ve. Normalmente coincide con el guardado, porque cada `commit` guarda; pero si un guardado anterior falló (por ejemplo, por cuota), la memoria va por delante. En **una sola escritura** se guarda ese estado en la entrada activa y se añade la variante. |
| Atomicidad | Se reutiliza `change()` de la biblioteca: clona, aplica, hace `setItem` y solo después asigna. Ante `QuotaExceededError` (u otro fallo) no se escribe nada y no cambian la lista, el proyecto activo ni los metadatos. La interfaz muestra: «No hay espacio local suficiente para crear la variante. No se ha cambiado nada…». |
| IDs | Entrada nueva con `Core.id('prj')` y `project.id` nuevo, igual que `duplicate`. Los IDs de entidades se conservan, como ya hacía `duplicate`; el contrato solo exige unicidad dentro del proyecto. |
| Nombre | «‹nombre del original› · Variante N»: el menor N libre en la colección, truncando el nombre original para no pasar de 120 caracteres (el límite de la biblioteca; el contrato admite 200). El nombre se copia también en `project.name`, como hace «Renombrar». |
| Variantes de variantes | Se vinculan al **original raíz**, para que la comparación sea plana. |
| Límite | 2 variantes por original. Al intentar una tercera se muestra un error claro y no se escribe nada. |
| Renombrar | No afecta a la relación, porque esta usa IDs de entrada. |
| Borrar una variante | Solo se borra la copia. Si estaba abierta, se abre su original. Las imágenes compartidas se conservan, porque las sigue referenciando el original (`cleanup()` existente). |
| Borrar el original | Sus variantes **se conservan como proyectos independientes**: se elimina su `variantOf` en la misma escritura y no queda ningún vínculo que parezca funcionar sin destino. El aviso de confirmación lo explica. Las variantes conservan su nombre («… · Variante N»). |
| Datos antiguos | Las colecciones sin `variantOf` cargan sin cambios y sin escritura. Un `variantOf` que apunta a una entrada inexistente se **ignora al leer** y no se reescribe ni se presenta como vínculo. Un `variantOf` que no es texto se rechaza como entrada corrupta, sin sobrescribir nada, igual que el resto de validaciones de `load`. |
| Métricas | `js/project-variants.js`: superficie útil con la misma fórmula que la cabecera (`Core.geometry` y estancias contadas), número de objetos y `FloorPlanLayoutReview.review`. No duplica validación ni geometría en `index.html`. En la distribución abierta se usa el estado en pantalla; en las demás, el guardado. |

## Almacenamiento: medido

- **Proyecto de referencia:** 31 100 caracteres de JSON. La colección pasa de 31 258 a 62 444 caracteres al añadir una copia (Node).
- **Proyecto con imagen raster local** (fixture `tests/fixtures/manual-plan.png`, Chromium):
  - la colección pasa de 33 098 a 35 015 caracteres (+1917);
  - las imágenes en IndexedDB siguen siendo **1**: los bytes de imagen **no se duplican**, porque la variante referencia el mismo `storage.ref`;
  - al borrar la variante, la imagen se conserva.
- **Cuota real:** Chromium headless aceptó unos 5,21 M caracteres en `localStorage` antes de rechazar escrituras. Con la cuota llena, crear la variante falla con el mensaje anterior, la colección queda idéntica byte a byte y el proyecto abierto no cambia.

**Límite.** Cada variante cuesta lo que pesa el JSON de su proyecto (unos 30 KB para la vivienda de referencia), sin imágenes. La cuota de otros navegadores y de móviles reales no se ha medido.

## Pruebas

| Archivo | Qué cubre |
| --- | --- |
| `tests/variants.test.cjs` (8) | Copia del estado visible; IDs únicos; vínculo local persistente tras recargar; edición de la variante sin mutar el original; renombrado sin romper la relación; nombres sin colisión y ≤120; raíz común y tope de 2; borrar variante (original intacto, se reabre el original); borrar original (variantes conservadas, sin vínculo colgante); cuota llena (mismos bytes, lista y activo); colecciones antiguas y vínculos huérfanos; JSON exportado válido y sin `variantOf`; métricas reutilizadas sin umbral inventado. |
| `tests/variants.browser.test.cjs` (4) | En 1440×900 y 390×844: edición visible, crear variante desde la UI, editarla, exportar su JSON, comparar (con y sin umbral, área igual a la de la cabecera), recargar, reabrir el original exacto y borrar la variante con confirmación. Además, cuota real llena en Chromium y proyecto con imagen en IndexedDB. |

Los resultados de la batería completa, comparados con `master`, constan en la PR.

**Capturas** en [`docs/qa/artifacts/variants/`](../qa/artifacts/variants/), con el proyecto de referencia (sin datos personales), en escritorio y móvil:

1. original;
2. diálogo con la variante recién creada;
3. variante editada;
4. comparación;
5. tras borrar la variante.

La confirmación de borrado es el `confirm()` nativo del navegador, que no aparece en las capturas de página; su texto exacto se comprueba en la prueba.

## Archivos

- `js/project-library.js`: `variant`, `variantName`, `group` y `remove` ampliado; `list` con `variantOf` válido; validación de tipo en `load`.
- `js/project-variants.js` (nuevo): métricas de comparación.
- `index.html`: sección «Variantes» y diálogo «Comparar distribuciones»; `switchProject`, `confirmRemoveProject` y `storageMessage` (las acciones existentes del diálogo usan el mismo camino que antes); estilos.
- `tests/variants.test.cjs` y `tests/variants.browser.test.cjs` (nuevos).
- `docs/technical/variants-phase-c.md` y `docs/qa/artifacts/variants/`.

## Límites

- Sin sincronización, fusión, mutaciones automáticas ni reparto de muebles.
- Comparación de 3 distribuciones como máximo.
- El vínculo existe solo en este navegador.
- La interfaz del diálogo «Proyectos» sigue solo en español, como antes.
- SwiftShader y la emulación no acreditan GPU ni teléfono físico.
- Preview de Vercel: el estado `READY` no sustituye la revisión visual humana.
