# OP-07 v5 + A0 real · candidata conjunta para Codex (20/11/2026)

> **Estado:** candidata de laboratorio para integración por Codex.
> - Sin activación: `OP07_RELEASE='integrated'`.
> - Sin fusión, migración ni despliegue.
> - **#273–#279 siguen congeladas:** esta rama contiene el delta A0 de Codex para acreditar la convivencia, no sustituye su autorización.

## Identidad

| Qué | Valor |
|---|---|
| Rama | `claude/op07-a0-s8-v5`. HEAD y árbol: los verificados en remoto al publicar (§4.3) |
| Base | master `8e917e1a70f499a6b8dc68850c8413b7d06c5682` (la de la v5) |
| Master efectivo | `4ea7cb3bb72e6c3bdd9a176cb08bd9e41b8866f2` (#289 y #275). Su delta respecto a `8e917e1a` solo toca `docs/`, `AGENTS.md` y `CLAUDE.md`. Intersección con los archivos de esta candidata: **ninguna** (comprobado) |
| Origen | v5 `420ac75f` (P0 de S7/S8) + delta A0 de Codex |
| Delta A0 | `#275 @ 44a77042`, `docs/integration/op07-a0-2026-11-20/seguimiento-cc1-d-linux/op07-a0-composition.patch.gz`. Sobre la v4 `3afb9e18` reproduce **byte a byte** el árbol `b16a0067` publicado por Codex. Sobre la v5 aplica sin conflictos |

**Commits sobre la v5:**

| Commit | Contenido |
|---|---|
| 1 | Delta A0 de Codex sin cambios: `schema-epoch.js`, A0 envolviendo S8 en el origen normal, barrera de época en F0.2b y Evolución como escritor protegido |
| 2 | Control de prueba de A0 ausente + este HANDOFF |

## Por qué la composición conserva las dos barreras

- **Origen normal.** `runtime.storage = a0.guardStorage(s8)`:
  - Una escritura de una época anterior, o sin verificar, la retiene A0 en memoria y nunca llega a S8.
  - Por eso los pasos de intención de la v5 **no se consumen** con un guardado bloqueado. Solo un `setItem` que alcanza el almacenamiento duradero confirma por documento.
- **F0.2b.** La época de la autoridad se lee en la misma transacción que la escritura, junto al gate geométrico S8 (R1-T03).
- **Activación.** Integrar A0 no activa OP-07. `wallFeaturesActive()` exige `OP07_RELEASE='active'` **y** que no haya bloqueadores (A0 cargado y escritor protegido). En producción el estado es `integrated`.

## Corrección en las pruebas (no en el producto)

El control «sin A0» de `op07-s8b-intent` y `op07-s8-activation` daba A0 por ausente solo con no declarar el sustituto. Con A0 en `index.html` ese control ya no retiraba nada y **fallaba** (`activation-pending` esperado, operación aceptada). Era un control obsoleto, no una regresión: el estado `active` con A0 y escritor protegido sí debe habilitar.

- `tests/op07/browser-state.cjs`: `a0:'none'` sirve `schema-epoch.js` vacío, así que A0 se retira **de verdad**. Las pruebas comprueban que `FloorPlanSchemaEpoch` no existe.
- `op07-s8b-intent`, prueba 4: nuevo control con **A0 real y el estado de producción `integrated`**. Resultado: `activation-pending` y documentos persistidos idénticos.
- Los positivos corren con el **A0 real**: el script real reemplaza al sustituto etiquetado.

## Resultados (Chromium 1243 y Node 22.23, Linux, este contenedor)

| Prueba | Candidata | Contraste |
|---|---|---|
| Suite pura (`tests/*.test.{cjs,mjs}` sin navegador) | 1590/1592, 0 fallos, 2 omitidas | v5 `420ac75f` con el mismo comando: 1590/1592 |
| `a0-writer-fence.browser` | **14/14** | |
| `a0-browser-residuals.browser` (R1-T02/T02b/T03/T04 y residuales) | **13/13** | |
| `op07-s8b-intent.browser` (sonda de Codex como regresión) | **4/4** | Sobre v4 + A0 real (`b16a0067`): **1/4**, solo pasan los positivos. La corrección v5 sigue discriminando con A0 real |
| `op07-s8-activation.browser` | **4/4** | Sin la corrección del control: 3/4 |
| `op07-s7-persistence`, `persistence`, `op07-s5-edit`, `op07-s5b-edit-ui`, `op07-s4-3d`, `op07-s4b-render`, `building`, `k4-room-type` | 1, 21, 1, 3, 3, 1, 3 y 3: todas pasan | |

En cada negativo de intención (curva, inclinación, lote de variante, con o sin clave histórica, confirmación concurrente):
- `guard-refused`;
- la revisión confirmada queda intacta;
- los documentos persistidos son iguales **byte a byte**.

Así se acredita que no se pierde geometría ni se sobrescriben variantes, bibliotecas o revisiones confirmadas.

## Límites

- Solo Chromium en Linux. Faltan Windows, Firefox y WebKit de Codex. Firefox y WebKit de A0 están acreditados por Codex sobre `112eaf52`, no sobre esta composición.
- Residual de Windows `op07-s5b-edit-ui` («enderezado» al volver al punto inicial): aquí pasa 3/3. Sigue pendiente de reproducirse en Windows.
- La auditoría física de A0 y el gate de convivencia de escritores previo a cualquier migración (R1) siguen abiertos. Esta candidata no migra nada.

## Rollback

- Rama de laboratorio: no usarla.
- Si se integrase, revertir el commit 1 deja la v5 sobre `8e917e1a`.

## Siguiente actuación

| Quién | Qué |
|---|---|
| Codex | Validar la candidata en Windows, Firefox y WebKit, y decidir la integración conjunta con #273 |
| Propietario | Autorizar o no tras esa validación |
| Claude Code 2 | Detenido en OP-07. Siguiente: recuperar R01, R02-A y R03 (inventario preliminar en el informe de entrega) |
