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
