# Asistente IA RUBIK V2 · Inventario de reutilización (antes de escribir código)

**Fecha:** 14-11-2026 · **Responsable:** Claude Code 1 · **Rama:** `feat/assistant-ai-v2-20261114`.

Este inventario es el paso 0.5 del encargo V2 y se publicó antes de escribir código.

## 0. Gate de arranque (comprobado en vivo el 14-11-2026 a las 13:42 UTC)

| Condición | Evidencia |
|---|---|
| #228 MERGED | `merged_at` 2026-11-14T12:53:26Z; ya no está en Draft |
| HEAD fusionado = HEAD aprobado | `136f98c985a441a55bc6258d0888a101e6fc1ec1` |
| `master` contiene la integración | `c91d12d1d76c71541c3accb3779f9d95519c2725` = merge con padres `c8021fc` y `136f98c`; **árbol idéntico** a `136f98c` (`git diff` vacío) |
| Production del nuevo `master` | `dpl_9t4hGSxDyJQPKyFeHFzBHcU9Bc1h`, `target=production`, READY sobre `c91d12d` |
| Sin errores críticos | CI de `master`: 4/4 en verde y estado de Vercel correcto. CI de `136f98c`: 71/71 en verde |

**PR incorporadas a `master` con #228:** #225 (NAV3D) en `9118152`, #226 (UX-12/13) en `0ac6b4a` y #227 (MUE-01/FOT-01) en `fbf1730`. Las tres pasaron a #228 como fuentes consumidas.

**Catálogo maestro.** Declara 97 IDs. Este trabajo usa:

| ID | Estado en el catálogo |
|---|---|
| AG-0 | N |
| AG-1 | R: herramientas en rama + MCP local E |
| AG-2 … AG-5 | N |
| AG-1 depende de | AG-0 y **GOV-06a** (N): autenticación y cuotas por profesional |
| AG-4 depende de | IMG-04 (P) |
| AG-5 depende de | MUE-02 y GEN-01 (N) |

**Árbol de dependencias.** AG-0 → AG-1 → AG-2 → AG-3. AG-4 necesita AG-1 + IMG-04 + B2/B8 + FOT-01 + CAT-IA, y CAT-IA lo lleva Claude Code 2. AG-5 necesita MUE-02 y GEN-01.

## 1. Inventario

| ID | Fuente (rama y SHA) | Estado en `master` | Código probadamente útil | GAP | Prueba | Acción |
|---|---|---|---|---|---|---|
| AG-1 núcleo | `feat/agent-ai-ag1-readonly-2026-11-05` @ `e458028`: `js/assistant-domain-tools-core.js`, 114 líneas | **No integrado** | 7 herramientas deterministas de lectura (`list_capabilities`, `get_project_summary`, `list_rooms`, `get_room`, `get_quantities`, `get_budget_summary`, `get_layout_review`), con lista blanca de argumentos, fallos cerrados y procedencia | Sin contrato de mensajes ni esquema de resultados; procedencia sin versión de motor; revisión = `updatedAt`, que cambia en cada commit sin cambiar el contenido; sin niveles ni NAV3D | **Ejecutadas sus 12 pruebas contra los motores de `c91d12d`: 12/12** en una copia temporal, sin cherry-pick | **Adaptar**: transplantar auditado bajo AG-0, añadiendo esquemas, revisión por contenido y procedencia completa |
| AG-1 pruebas | Misma rama: `tests/assistant-domain-tools-core.test.cjs` | No integrado | 12 casos: lista blanca, IDs desconocidos, presupuesto de otro proyecto, revisión obsoleta, inyección en nombre de estancia, sin mutación | No cubren esquemas, i18n, procedencia completa ni niveles | 12/12 sobre `c91d12d` | **Reutilizar** como base y ampliar |
| AG-1 workflow | Misma rama: `.github/workflows/agent-ag1-readonly.yml` | No integrado | Patrón de CI | Solo node; sin navegador ni vídeos | — | **Ignorar**: se sustituye por el workflow nuevo con QA completa |
| AG-1 actas | Misma rama: `docs/product/assistant-ai-ag1-*.md` | No integrado | Gates y límites; deja claro que `expectedProjectId` **no es autenticación** | El brief asignaba AG-1 a Claude Code 2, y el acta lo corrige a ChatGPT | — | **Histórico, solo trazabilidad**: la orden vigente del propietario asigna esta misión a Claude Code 1 |
| Plan maestro §4/§6/§7 | `docs/rubik-evolution-preparation-2026-11-04` @ `7ee4243` | No está en `master` | Arquitectura AG-0…5, matriz QA y coordinación | Documento, no código | — | **Seguir como especificación** y citarlo |
| Proyecto canónico | `master`: `docs/contracts/FloorPlanProjectV1.schema.json`, `js/project-core.js` | En master | `Core.validate`; `room.floorMaterialId`; `object.position/rotationDeg`; `project.materials` | — | Pruebas propias del repositorio | **Reutilizar**: autoridad única |
| Cantidades | `js/quantity-core.js` (`FloorPlanQuantities.room/home`) | En master | Áreas y perímetros con estado `measured/estimated/unavailable` y fuente | — | Pruebas propias + AG-1 | **Reutilizar**, sin un segundo motor |
| Presupuesto C1–C4 / BC3 | `js/budget-core.js` (`calculateBudget`), `js/budget-draft-core.js`, `js/budget-ui.js` (`FloorPlanBudgetUI.current()`) | En master | Totales; `null` si falta un precio; `reviewComplete`; IDs sin precio o sin revisar | El presupuesto vive en `localStorage` del navegador, por proyecto, no en el proyecto | Pruebas propias + AG-1 | **Reutilizar** leyendo `FloorPlanBudgetUI.current()`; nunca recalcular por otra vía |
| Revisión de distribución | `js/layout-review.js` (`review`) | En master | Hallazgos de huella 2D | No es normativa | Pruebas propias | **Reutilizar**, explicando sus límites |
| Colocación | `js/furniture-placement.js` (`scene`, `problemsIn`, `roomsAt`) | En master | Validación de pose: muros, puertas, escalera, muebles | — | Pruebas propias + UX-12 | **Reutilizar** en la propuesta «mover mueble» (AG-2) |
| Commit del editor | `index.html`: `commit()` (validación, guarda BW5, `reconcile` R02-A, deshacer, guardado) y `FloorPlanApp.applyFurnishing/applyCeiling/applyOwnFurniture` | En master | Patrón `fn(copia) → {ok, project}` en un solo paso de deshacer | No existe un gancho del asistente; deshacer y rehacer solo por botón | Pruebas de UX-12, R02-A y MUE-01 | **Adaptar**: un gancho mínimo `FloorPlanApp.applyAssistant(fn)` con el mismo patrón; deshacer y rehacer con los **mismos** botones `#undo`/`#redo` del editor |
| Revisión por contenido | `js/smart-furnishing-core.js` (`revision` sin `updatedAt`), `js/guide-core.js` (`revision`) | En master | Hash estable del contenido | — | UX-12 | **Adaptar** el mismo criterio para `baseRevision` |
| Registro de capacidades | `js/capability-registry.js` (`FloorPlanCapabilities`), GOV-03 mínimo | En master | Estados `available/validation/preparation`, módulos y pruebas por capacidad, ES/EN/ZH | Sin un contrato para el asistente | `tests/capability-registry.test.cjs` | **Reutilizar como fuente**: `CapabilitiesForAssistantV1` lo lee y no lo duplica. Añadir la entrada del asistente queda para el integrador (archivo compartido) |
| Render IA B2/B8 | `api/render.js`, `js/ai-render-ui.js` (`FloorPlanAIRender.open/render`) | En master; Production con `RUBIK_RENDER_ENABLED` | Código de acceso, límites en memoria, `usage`/coste solo con tarifa | GOV-06a: código compartido, no cuentas; límites por instancia | Pruebas `ai-render-*` | **Reutilizar mediante adaptador** (AG-4): el asistente prepara y **abre** el flujo existente; nunca llama a `/api/render` por su cuenta |
| Coste ECO-01 | `js/render-cost-core.js` (#190) | En master (núcleo puro) | `estimateAttempt`, tarifas con vigencia y BigInt | Sin telemetría persistente ni facturación | `tests/render-cost-core.test.cjs` | **Reutilizar**, sin rehacer: un coste desconocido = `null` |
| FOT-01 | `js/photo-reform-core.js`, `js/photo-reform-provider.js` (#227) | En master, **sin activar** | Contrato de adaptador `{id, kind, run}` y simulador rotulado | Sin proveedor ni endpoint de servidor | Pruebas de #227 | **Adaptador stub** (AG-4); lo lleva Claude Code 2 y aquí no se modifica |
| MUE-01 | `js/own-furniture-*.js` (#227) | En master | `addOwnFurniture` | — | Pruebas de #227 | **Convivencia** en la QA; no se toca |
| UX-12/13 | `js/smart-furnishing-*.js` (#226) | En master | Propuesta → aplicar → deshacer | — | 18 + 4 pruebas, incluida la propiedad de las 1512 rotaciones | **Convivencia** + regresión en la QA; no se toca |
| NAV3D, R03, R02-A, UX-08 | `js/nav3d-*`, `js/r03-*`, `js/r02a-*`, `js/live-dimensions-*` | En master | — | — | Sus suites | **Convivencia**: R03 y R02-A intactos en toda mutación; cotas UX-08 |
| MCP local | `tools/rubik-mcp/` | En master (local, stdio, JSON exportado) | Medición, holguras y rutas | **No es acceso autenticado al proyecto en vivo**; #196/#197/#204 son etapa 2 HOLD | Sus pruebas | **Ignorar** como canal del asistente; reutilizables como referencia, no como autoridad |
| Autenticación y tenant | `api/_share-auth.js` (enlaces de cliente GOV-08) | Solo enlaces compartidos | — | **No hay sesiones de usuario, roles ni tenants** (GOV-06a N) | — | **Bloqueado**: sin backend LLM público. Se diseña el contrato y el pipeline desactivado |
| i18n | `LANG` (`es/en/zh`) y el patrón `tx(es,en,zh)` | En master | — | — | — | **Reutilizar** |
| Espacios de trabajo | `js/professional-workspace-ui.js` (Diseñar, Analizar, Presupuestar, Entregar) | En master | Navegación por áreas | Archivo compartido (integrador) | Pruebas de workspace | **Punto de extensión por módulo**: el asistente se acopla sin editar este archivo |

## 2. Decisiones de alcance que se derivan del inventario

1. **Proveedor LLM: BLOQUEADO PARA LLM REAL.**
   - No hay autorización de modelo de texto, ni credencial, ni tarifa verificada, ni GOV-06a.
   - Se construye el pipeline **desactivado por defecto**, con adaptador simulado y pruebas.
   - Ninguna llamada externa ni gasto.
2. **AG-1 en el navegador, sin LLM.**
   - Respuestas deterministas con intenciones cerradas (ES/EN/ZH).
   - Cada cifra sale del motor canónico, con procedencia (`motor`, `revisión`, `estado`).
   - Rotulado: «consulta guiada, sin modelo de lenguaje».
3. **AG-2/AG-3 locales.**
   - Dos operaciones tipadas: **cambiar el material de suelo** de una estancia a uno ya existente en `project.materials`, y **mover o girar un mueble** con `FloorPlanPlacement`.
   - Se simulan en una copia; se confirman con `applyAssistant` (un paso del commit); deshacer y rehacer con los botones del editor.
   - No hay aplicación remota, porque no hay sesiones seguras.
4. **AG-4: adaptadores versionados.**
   - Render IA: abre el flujo B2/B8 existente con la vista y el estilo preparados; el gasto lo confirma su propio diálogo.
   - FOT-01 y CAT-IA: stubs con pruebas de contrato; sus módulos son de Claude Code 2.
   - Coste 0 sin proveedor.
5. **AG-5: «En preparación».**
   - Tipos, permisos, pruebas de rechazo y lista de decisiones.
   - No se declara operativo.
6. **Archivos compartidos.** Cambios mínimos en `index.html`: etiquetas de script y `FloorPlanApp.applyAssistant`. Quedan documentados para el integrador. No se tocan `professional-workspace-ui.js`, `capability-registry.js` ni `api/render.js`.

## 3. Contradicciones registradas

- **Asignación de AG-1:**
  - el brief histórico la daba a Claude Code 2;
  - el acta de AG-1 la corrigió a ChatGPT;
  - **vigente**: orden del propietario del 14-11, que la asigna a Claude Code 1.
- **Nombres de herramientas.** El plan maestro §4.2 cita `get_project_element`, `review_layout` y `measure_elements`; la rama AG-1 implementa `get_room`, `get_layout_review` y `get_quantities`. Se mantienen los nombres **implementados y probados** y se registra la equivalencia.
- **Revisión.** AG-1 usaba `updatedAt` como revisión. `commit()` lo reescribe en cada paso, incluso sin cambio de contenido. Se usa la revisión por contenido, como en UX-12, y `updatedAt` queda solo como dato informativo.
