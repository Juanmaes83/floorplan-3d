# CAT-04 — ACTA DE VALIDACIÓN

**NO MERGE · NO PRODUCTION · STOP_GASTO.** El GO de fusión lo decide el propietario por separado.

| Campo | Valor |
|---|---|
| PR | [Juanmaes83/floorplan-3d#237](https://github.com/Juanmaes83/floorplan-3d/pull/237) (Draft) · coordinación #235 |
| Rama / base | `feat/cat-04-catalog-budget-assistant` ← `master@b9f7613` |
| SHA validado | `2a7a266e1feaa57fa678f593b59897f76026c47b` |
| Preview del SHA | `floorplan-3d-f0086dsjv-juanma-espinosas-projects.vercel.app` (`dpl_4viyHBfN663vMLFJmuuqc6PFZtJo`, READY; sirve `js/cat04-ui.js` de este SHA) |
| Gasto | 0 · ninguna llamada a proveedor, LLM, `api/assistant` ni `api/photo-reform` |
| Datos | Catálogo QA sintético (`synthetic-fixture`) y foto sintética; sin datos de clientes |

## 1. Alcance cumplido (gates 0–5)

| Gate | Resultado |
|---|---|
| 0 · Auditoría y diseño | `docs/cat-ia/06-cat04-diseno.md`: autoridades, diferencias y matriz «Existe / Falta / Cambio / Prueba» |
| 1 · Núcleo puro | `js/catalog-budget-core.js`: conciliación CAT-03 → Presupuestar, identidad comercial, cantidades honestas y 11 estados |
| 2 · Presupuestar | Una sola autoridad (`FloorPlanBudgetUI` → `draft({extraLines})` → `calculateBudget`); precio solo con S2 «Precios de referencia» (vista previa → confirmación → revisión) |
| 3 · Estudio de imágenes | `x-cat04-visual-refs`: metadatos y huella, sin píxeles; visibles en Presupuestar **sin importe** |
| 4 · Asistente | 3 herramientas de solo lectura; cifras del mismo `calculateBudget`; ya **no** dice «en preparación» |
| 5 · Integración | CI, Preview, vídeo y negativos (este acta) |

## 2. Pruebas

**CI del SHA `2a7a266`:** 75 checks.

- **73 en verde** en el primer intento. Incluye:
  - `evidence` (CAT-IA y foto);
  - `assistant-ai-v2`, que contiene los dos grabadores corregidos;
  - presupuesto, S2 y M2;
  - regresiones de presentación y UX.
- **2 en rojo** en el primer intento, analizados contra master en el §6:
  - `browser` de foto: **verde al reintentar**;
  - `browser` de CAT-IA (`assets.browser`): falló también en el 2.º intento (el mismo `"Loading aborted"`) y **pasó en el 3.º**. Estado final: **75/75 en verde** en el SHA validado.

**Local:**
- todas las suites puras: 1301/1301, más 2 omisiones preexistentes de Blender;
- `catalog-budget-core` 9/9, `visual-reference-core` 3/3 y `cat04-assistant` 3/3;
- `cat04.browser` 4/4;
- grabadores `record-cat-ia-v1` y `record-assistant`: `exit 0`.

**Cambios en pruebas y grabadores existentes** (todos documentados en #237, ninguno relaja una garantía):
- el panel CAT-03 deja de mostrar un total paralelo;
- «Busca en el catálogo» ya no admite «en preparación»;
- el negativo «precio desconocido» pasa a un oráculo de negocio (§4).

## 3. Evidencias (artefacto de CI `cat04-2a7a266…`, id 14163478494)

Manifiesto `rubik-cat04-evidence/1`:

- `head = 2a7a266`;
- `tests/cat04.browser.test.cjs` **4/4**, `exit 0`;
- red: solo el servidor local; peticiones externas abortadas; 0 llamadas a `/api/` comprobadas por las pruebas.

| Vídeo | Viewport | Duración | Decodificación | SHA-256 (inicio) |
|---|---|---|---|---|
| Flujo principal escritorio ES | 1440×900 | 15,1 s | completa ffmpeg ok | `5428cc12206223db` |
| Estudio de imágenes → Presupuestar | escritorio | 9,8 s | ok | `54b68a7b6e45a67f` |
| Móvil EN | 390×844 | 5,0 s | ok | `f38b7a88d6be2abe` |
| Apaisado ZH | 844×390 | 4,8 s | ok | `b5bfeb4e483d13a3` |

**Capturas (10):**
- presupuesto sin precio;
- vista previa S2;
- precio aplicado;
- ficha cambiada (no sustituye);
- asistente;
- dossier;
- vincular la referencia visual;
- referencias en Presupuestar;
- EN y ZH.

## 4. Casos negativos verificados

| Caso | Resultado | Dónde |
|---|---|---|
| **Precio desconocido ≠ precio aplicado ≠ 0** | Horno `QA-H60-INOX`: `unknown-price`, `unitPrice=null`, subtotal `null` en `calculateBudget`, en `unpricedItemIds` y `missingItemIds`, capítulo y presupuesto `complete:false`, no revisado, sin precio de ficha; fila «sin importe», total «incompleto» | `record-cat-ia-v1` (CI `evidence` ✅), `catalog-budget-core` |
| El precio de ficha nunca se aplica solo | Solo con S2: vista previa → confirmar; si el presupuesto cambia entre medias, se rechaza; sustituir un precio revisado exige consentimiento | `cat04.browser`, `catalog-budget-core` |
| Ficha actualizada | Estado `stale`: **no** sustituye tu precio | `cat04.browser` |
| SKU ambiguo / otro estudio | `ambiguous` / `other-studio`: nunca se usa el primero ni la ficha ajena | `catalog-budget-core` |
| Unidad m² o ml con N objetos | Cantidad «pendiente de medición»; nunca objetos × €/m² | `catalog-budget-core` |
| Material no colocable, USD, fecha inválida, sin fuente | Rechazados | `catalog-budget-core`, `record-cat-ia-v1` |
| Referencia visual alterada o de otro proyecto | `unverifiable` / `other-project`; nunca monetaria | `visual-reference-core` |
| Asistente sin catálogo | Respuesta honesta; prohíbe «en preparación» | `assistant-ai-v2.browser`, `record-assistant` (CI ✅) |
| Huérfanos y borrado | No reviven; la partida con precio se conserva con 0 ud para que deshacer funcione | `catalog-budget-core` |

## 5. Límites conocidos

- `localStorage` es un piloto local por estudio, no control de acceso multiempresa (**GOV-06a**).
- Precios sintéticos rotulados `synthetic-fixture`.
- La partida retenida con 0 ud muestra 0 €; se retira a mano.
- El presupuesto es un documento separado del proyecto: el proyecto exporta los vínculos y el presupuesto se descarga en JSON/CSV/BC3.
- `net.amount` de `calculateBudget` es la suma **parcial**. Los consumidores deben leer `complete`/`missingItemIds`, como ya hacen Presupuestar, el panel, el Asistente y el dossier.

## 6. Fallos de CI analizados contra master (no se cambia ningún límite ni ninguna prueba)

| Job | Fallo | Evidencia | Conclusión |
|---|---|---|---|
| Foto `browser` | `photo-project` FOT-01, línea 233 (`isVisible` inmediato de `#photoReformCard`) | Ningún cambio de producto entre `e290894` (verde) y `2a7a266`; local 4/4; **verde al reintentar** | Intermitencia de la prueba |
| CAT-IA `browser` | `assets.browser`, «Asset Lab mixed scene» y «next cohort» 1440×900: `"Loading aborted"` (corte del cargador a 8 s) | `assets/`, `view3d*`, `asset*` y la prueba son idénticos a master. **Master `b9f7613` falla el mismo caso en local** (1 de 2 ejecuciones). El mismo job pasa en `264b667` (que contiene este código), `6b5bf10`, `e290894`, `443334f` y `a378df6`, y ya falló antes de CAT-04 (`61d8c5c`) | Riesgo preexistente del límite de 8 s (registrado en #233/#234). **No se cambia el límite**. Pendiente de una decisión del propietario de assets |
| `project-first` (en #238 y en `6b5bf10`) | GOV-08 S2: «focus left the dialog after a refused withdrawal» | La prueba espera la respuesta de `api/unshare` y comprueba el foco al instante, pero la app mueve el foco tras `await r.json()` (carrera). Ninguna PR toca la compartición ni esa prueba. Local 3/3; **verde al reintentar** | Carrera en la prueba GOV-08, preexistente; se informa a su responsable |

## 7. Dictamen

**GO TÉCNICO de CAT-04**, a falta de la revisión cruzada del responsable del Asistente. **No es GO de fusión.**

Motivos:
- gates 0–5 completos;
- una sola autoridad del presupuesto;
- ningún precio automático;
- **un precio desconocido nunca se trata como aplicado ni como 0**;
- referencias visuales sin importe;
- el Asistente lee los datos reales;
- CI 75/75 en verde en el SHA exacto (con dos intermitencias preexistentes analizadas contra master);
- Preview del SHA en estado READY;
- evidencias en vídeo decodificadas;
- casos negativos verificados.

Este acta se añade en un commit **solo de documentación** sobre `2a7a266`; el código validado no cambia.

**Riesgo que queda abierto, fuera del alcance de CAT-04:** la intermitencia de `assets.browser` (corte a 8 s), también presente en master.

Revisión cruzada pedida al responsable del Asistente RUBIK V2. **NO MERGE · NO PRODUCTION · STOP_GASTO.**

## 8. Addendum — auditoría independiente de #237 (comentario 6898203440): dos casos límite

**Verificación:** ambos casos se **confirmaron como defectos reales** con pruebas que fallaban sobre `dbeb4b0`, se corrigieron sin cambiar el comportamiento profesional ya validado y quedan cubiertos por pruebas de regresión.

### Caso 1 — Fallo de conciliación: sin sobrescritura silenciosa

**Defecto.** `budget-ui.js` hacía tres cosas que juntas perdían datos:

- `load()` capturaba la excepción de `RubikCat04.extraLines()` y seguía con `catalog=null`. Lo mismo ocurría si el módulo no estaba cargado;
- `draft()` solo reconstruye las partidas que recibe;
- `open()` guardaba de inmediato.

Resultado: la partida de catálogo, con su precio confirmado, su referencia y su revisión, **desaparecía del presupuesto guardado sin aviso**.

**Prueba antes de corregir.** `tests/cat04-failsafe.browser.test.cjs` falló en `dbeb4b0` con «excepción en extraLines: the saved document is NOT overwritten».

**Corrección (fail-closed, `js/budget-ui.js`).** Aplica si la conciliación lanza una excepción, o si el módulo falta y el presupuesto guardado tiene partidas de catálogo:

- esas partidas se conservan **exactamente como estaban guardadas** (precio, `priceSource`, `priceReference`, revisión, merma), reconstruidas desde el propio documento;
- `open()` y `refresh()` **no guardan automáticamente**;
- Presupuestar muestra el aviso `#cat04ReconcileError` (`role=alert`, ES/EN/ZH);
- `current()` y `summary()` devuelven las mismas cifras guardadas, así que el Asistente, el dossier y el plan no ven un presupuesto parcial;
- una edición explícita del profesional guarda **con** esas partidas: no se pierde nada.

Sin fallo, el comportamiento es idéntico al validado.

**Prueba después.** Dos inyecciones: excepción en `extraLines`, y `RubikCat04` ausente. En las dos:

- el documento guardado queda **byte a byte igual** al abrir y al cerrar Presupuestar;
- aparece el aviso visible;
- `current()` conserva `690 € · provider-reference · QA-LUMEN-160-RB · reviewed`;
- la fila sigue mostrando el precio.

Al restaurar el módulo se concilia con normalidad y no se ha perdido nada. Resultado: **pasa**.

### Caso 2 — Referencias visuales entre estudios con identificadores coincidentes

**Defecto.** En `js/visual-reference-core.js`:

- «colocado» se calculaba con `catalogId|productId|variantId`, **sin estudio**;
- la ficha se buscaba solo por `catalogId` entre los catálogos del estudio abierto.

Con dos estudios con los mismos IDs, una referencia hecha con el catálogo de B aparecía **«colocado» y «ficha vigente»** por el producto colocado de A.

**Prueba antes de corregir.** `tests/visual-reference-core.test.cjs` («studio identity») falló en `dbeb4b0`: la referencia de B daba `placed: true`.

**Corrección compatible.** La ficha `rubik-visual-result-sheet/1` y su hash **no cambian**. Lo que cambia:

- RUBIK guarda el **estudio en la entrada del vínculo** (`studioId`, validado), fuera del hash;
- `list(project,{catalogs,studioId})` comprueba colocación y ficha **solo dentro de ese estudio**;
- nuevo campo `placedStatus`: `placed` / `not-placed` / `ambiguous`;
- nuevos `catalogStatus`: `other-studio` (ficha de otro estudio, no se comprueba aquí) y `studio-unknown`;
- un **vínculo antiguo sin estudio** da colocación `ambiguous` y `studio-unknown`: nunca afirma «colocado» ni «ficha vigente»;
- Presupuestar y el Asistente lo rotulan en ES/EN/ZH;
- las referencias siguen siendo `monetary:false` y no crean partidas.

**Prueba después:**

| Prueba | Qué comprueba | Resultado |
|---|---|---|
| Pura (A y B con los mismos IDs) | B frente a A colocado: `not-placed` y `other-studio`. En B: `current` pero no colocado. Mismo estudio: `placed` y `current`, como antes. Vínculo sin estudio: `ambiguous` y `studio-unknown`. Estudio inválido: rechazado | **pasa** |
| Navegador (`cat04-failsafe`, 2.º caso) | En Presupuestar: «NO colocado · ficha de otro estudio» y «colocación no verificable · estudio desconocido», sin «ficha vigente» ni «colocado en el proyecto», en ES y EN. Solo el horno colocado es partida | **pasa** |

**Ajuste de fixtures existentes.** Tres pruebas puras y una del Asistente creaban vínculos **sin estudio** y esperaban `placed/current`. Ahora los crean como lo hace la interfaz (`studioId:'local'`). El caso sin estudio queda cubierto por la nueva prueba con su resultado seguro. **No se ha eliminado ninguna aserción.**

### Otros cambios de esta entrega

`tests/cat04.browser.test.cjs` espera al redibujado del plano después de borrar antes de calcular el siguiente clic. Corrige la intermitencia de CI observada en #238; no reintenta ni quita comprobaciones. `record-cat04.cjs` guarda en el manifiesto los nombres de las pruebas que fallen.

### Regresión local de esta entrega

| Grupo | Resultado |
|---|---|
| Navegador: `cat04`, `cat04-failsafe`, `catalog-placement`, `budget-ui`, `economic-dossier`, `m2-s4`, `assistant-ai-v2`, `visual-studio`, `catalog-ia` | **38/38** |
| Suites puras | **1302/0** (+2 omitidas de Blender) |
| `record-cat04` y `record-cat-ia-v1` | exit 0 |

**Riesgo que sigue abierto (preexistente, no de CAT-04):** `assets.browser` con «Loading aborted» por el corte a 8 s. También falla en master en local y no se modifica.
