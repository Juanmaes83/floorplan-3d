# RUBIK SOTA — Delta de auditoría tras #303

> **Corte histórico tras #303.** Para el estado posterior a #308 y #304 y la corrección de los diagnósticos de HERO, consultar [Continuidad operativa vigente](CONTINUIDAD-OPERATIVA-VIGENTE.md). Las cifras inferiores solo describen su base original.


**Corte:** 21/11/2026 (Europa/Madrid). **Base consultada:** `master@4cd3884f6f6e3be062e8f4c6acc255e8888ae4d0`, árbol `b9b77c5360ab985090c93c3bb67c799cb0d82e16`. Esta nota actualiza la fotografía del informe de 21/11 adjunto al encargo y del [V5 propuesto en #302](https://github.com/Juanmaes83/floorplan-3d/pull/302). Es un delta fechado para incorporar en la autoridad documental vigente; no sustituye el catálogo, la matriz ni las decisiones por SHA.

## Evidencia del producto

| Frente | Estado comprobado | Evidencia y límite |
| --- | --- | --- |
| R02-A | [#298](https://github.com/Juanmaes83/floorplan-3d/pull/298) fusionada en `1bc501d64ab091a8fac25669bf8843f8f5076a3d`; [Production READY](https://vercel.com/juanma-espinosas-projects/floorplan-3d/DjpeVoiqnqiqsXPuzaLxnNA7C3cr) para ese SHA. | `js/r02a-passage-indicative.js` usa 2100 mm como criterio experimental, recorrido de presentación y margen 220 mm; indica sin bloquear. La firma de caché se invalida con geometría. GOV-05 no queda cerrado. #296 es antecedente en la fuente, no una segunda integración productiva. |
| Studio E3 | [#299](https://github.com/Juanmaes83/floorplan-3d/pull/299) fusionada en `e777a6ed7f856aa7a251aa9392b3670ade877f81`; [Production READY](https://vercel.com/juanma-espinosas-projects/floorplan-3d/2nxZvCET5KzQcyvcN5gyUmqxnJfi). | `js/presentation-templates-core.js` define fichas y capacidades que se resuelven mediante adaptadores existentes; disponibilidad de cada capacidad se decide en la sesión. READY no prueba aceptación visual en hardware. |
| M05 Copiloto y MCP | [#303](https://github.com/Juanmaes83/floorplan-3d/pull/303) fusionada en el master de este corte; [Production READY](https://vercel.com/juanma-espinosas-projects/floorplan-3d/2mUGA9NR5KwXyhztsULVFmKnTY59) para SHA exacto. | `js/assistant-agent-core.js` delimita herramientas, argumentos, propuestas y rutas. [Handoff M05](M05-COPILOTO-PROFESIONAL.md): proveedor generativo desactivado; Prueba C real, Redis dedicado, controles del piloto, consentimiento y autorización de activación pendientes. No inferir que READY habilita conversación de pago. |
| CI de master | 8 check-runs para `4cd3884`: 7 success y 1 skipped. | Consulta GitHub `/commits/4cd3884.../check-runs`; la omisión no se ha clasificado aquí como gate productivo. No equivale a una prueba física de todos los módulos. |

## Candidatas abiertas, HEAD exacto

| PR | Lectura al corte | Siguiente gate |
| --- | --- | --- |
| [#304 Guía de cinco fases](https://github.com/Juanmaes83/floorplan-3d/pull/304), `03a2fc0524c4656b36a05cc9b91ff17120ddf1c8` | Borrador sobre master actual. GitHub devuelve 137 check-runs en dos páginas: 135 success, 2 skipped, ningún fallo. | Revisar las omisiones, Preview y aceptación del recorrido; autorización de integración separada. La guía no activa la Prueba C. |
| [#300 Idioma transversal](https://github.com/Juanmaes83/floorplan-3d/pull/300), `56c48411a2b8e75c65de5366bb7c8de52dc4fc47` | Borrador con base original `cf0b5012`; 93 check-runs: 92 success y 1 skipped. | Reconciliar con #298/#299/#303 y probar ES/EN sin chino visible en el árbol combinado antes de integrar. |
| [#301 Cámara al salir de Presentación](https://github.com/Juanmaes83/floorplan-3d/pull/301), `0d80abe638fff4cbaf2a7830ecb6a4be2f0f68f8` | Borrador sobre base `cf0b5012`; 91 success, 1 skipped y 1 failure. El [job CAT-IA browser](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44852929212/job/136688285130) espera `#welcomeContinue` después de `page.reload()` en `tests/professional-workspace.browser.test.cjs`. | Reproducir y diagnosticar la transición del diálogo; no atribuir causa raíz ni relajar la aserción. |
| [#302 Continuidad V5](https://github.com/Juanmaes83/floorplan-3d/pull/302), `470c3efb9237e3d21108fc2f402ee6f85e909833` | Borrador documental, 14 success y 1 skipped. Su corte todavía declara #298 y #299 pendientes y master `cf0b5012`. | Incorporar este delta al documento canónico al actualizar la PR propia, preservando sus hechos históricos. |

Hay **13 PR abiertas** en el listado GitHub consultado. #271 y #273–#279, #267 y #296 siguen abiertos con sus destinos y límites propios; el número de PR no mide progreso funcional. El handoff HERO FINAL A/B/C y sus cifras de laboratorio proceden de la auditoría anterior; esta revisión no ejecutó su integración ni acredita una PR o Production nueva para HERO. OP-05, OP-07, R01, A0/F0.2c/F0.3 y las autorizaciones de datos y activos mantienen sus gates independientes.

## Revisión de código y comprobación local

Se inspeccionaron en el checkout del SHA indicado `js/r02a-passage-indicative.js`, `js/presentation-templates-core.js`, `js/assistant-agent-core.js`, `docs/integration/M05-COPILOTO-PROFESIONAL.md` y la prueba de #301. `node --test tests/r02a-passage-indicative.test.cjs tests/r02a-passage-cache-signature.test.cjs tests/presentation-templates.test.cjs tests/assistant-agent-core.test.cjs` terminó **63/63 pass, 0 fail** en Linux local. Es una comprobación dirigida de contratos puros, no una validación de navegador ni de Production. GitHub y Vercel se consultaron por separado; los estados de check-runs corresponden a sus HEAD y no a la etiqueta READY.

**Orden de continuación:** reconciliar la continuidad #302 con master actual; revisar #304 y su Preview; integrar #300 solo tras compatibilidad y gate de idioma; diagnosticar #301; preparar HERO FINAL sobre una base vigente. Cada integración, activación, despliegue o gasto conserva decisión y evidencia propias.
