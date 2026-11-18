# Secuencia para autorización conjunta · seis PR

Base verificada `master@163df68e83a80ddf11a008d573ee257d51c1821f`. La secuencia se simuló con `git merge-tree --write-tree`, sin conflictos. Los árboles de la tabla corresponden al contenido acumulado tras cada paso con las PR fijadas en esos HEADs.

## Acta de ejecución

El propietario autorizó esta secuencia de seis PR mediante commits de merge. Se verificaron el HEAD y el árbol simulado antes de cada paso. Tras cada merge se leyó de nuevo `master`, se cotejó el primer padre con el paso anterior y el segundo padre con el HEAD autorizado. #263 y #264 cambiaron su base a `master` después de comprobar la ascendencia de su dependencia. El árbol final real coincide con el aprobado, `f62e9492de0ee616c8edd1966703238d57702a63`, en [`master@dd528119bdfd80733c4faf5bb56a594190fea5ac`](https://github.com/Juanmaes83/floorplan-3d/commit/dd528119bdfd80733c4faf5bb56a594190fea5ac).

| PR | Commit de merge verificado |
|---|---|
| #261 | `67367c6b4abf2d429a5979da3f0cbf1c58721b68` |
| #262 | `af6577aad2e7af56bd34c1b3901025553a2819f4` |
| #263 | `455309069ea52ac8c6c4b887209277cc1169900d` |
| #264 | `7bd414f697796360520f8b6294208d32a9d706b3` |
| #265 | `4c62c1fcbee4dcb7871508b2d2361778fc6e277a` |
| #260 | `dd528119bdfd80733c4faf5bb56a594190fea5ac` |

#266 y #267 conservan sus ramas y siguen fuera de `master`. La simulación de #266 `edfbf66` sobre la nueva base da `0ff75783bd0bbe16a200ead239989938644d6c50`, sin conflictos. Las verificaciones automáticas del HEAD de #266 tienen su propio ciclo. [Checks de #266](https://github.com/Juanmaes83/floorplan-3d/pull/266/checks).

Sobre ese árbol combinado pasaron 3/3 pruebas dirigidas en Docker Linux sin red, Node 22.13 y Chromium 1234. Cubren reposo orbital, restauración M09 y 11 ciclos de P15 con 1.189 geometrías y nueve texturas estables. La [suite propia de #266](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44402050156/job/135147414976) y [Studio Presentation → Recorrer](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44402050256/job/135147416681) pasaron en GitHub sobre `edfbf66`. El cierre general pendiente se sigue en la PR.

[OP-04 #268](https://github.com/Juanmaes83/floorplan-3d/pull/268) parte de `master@dd528119`, con HEAD `d8a8b9a4a757b6b260255659db74de0d4b23e829`. Pasaron 4 casos propios, 2 regresiones RoomPlan y 2 casos de Chromium. La convivencia simulada de #266 y #268 sobre el `master` consolidado da el árbol `3ad1e8596182b0a30df6c096e2c689254ff22b3a`, sin conflictos. La revisión humana y la CI del candidato de OP-04 quedan en su borrador. [Alcance y pruebas de OP-04](https://github.com/Juanmaes83/floorplan-3d/blob/d8a8b9a4a757b6b260255659db74de0d4b23e829/docs/technical/op04-roomplan-join.md).

## Secuencia aprobada

| Orden | PR | HEAD a autorizar | Árbol acumulado esperado |
|---|---|---|---|
| 1 | [#261 · Reconciliación documental](https://github.com/Juanmaes83/floorplan-3d/pull/261) | `f4fe60bf655df854da792581cf7cc82b2ebf39e3` | `56a7c407ce83f30c7b99c20ce9efd9daea5f32e6` |
| 2 | [#262 · F0.1 Expediente](https://github.com/Juanmaes83/floorplan-3d/pull/262) | `69ae552b1a065737b097599d001c2c5a3546ebbd` | `eb06de6998a53acafef3912f880174aae5f3c53d` |
| 3 | [#263 · F0.2a IndexedDB](https://github.com/Juanmaes83/floorplan-3d/pull/263) | `6be42e52258ca4ca8340607918854348c9302ed6` | `20977e3b987de84541d4750f757a12f0994b6875` |
| 4 | [#264 · F0.3 Permiso y recogida segura](https://github.com/Juanmaes83/floorplan-3d/pull/264) | `748e43d03829398b94b225879b12263aa26f2f1a` | `864820a389bf767d523086e434e75a3d7881e6ea` |
| 5 | [#265 · OP-03 / DXF](https://github.com/Juanmaes83/floorplan-3d/pull/265) | `b9f4b3c1489a45f4a1dbdde5f27ecd26ac8f8c43` | `0ebd9938f1b92542c8cc97443b6cb23857f46807` |
| 6 | [#260 · CI inteligente](https://github.com/Juanmaes83/floorplan-3d/pull/260) | `5b003bd67b7d08f03d8029ce8ad87f53ed54a466` | `f62e9492de0ee616c8edd1966703238d57702a63` |

El [delta de #261](https://github.com/Juanmaes83/floorplan-3d/commit/f4fe60bf655df854da792581cf7cc82b2ebf39e3) tiene como padre directo `341624b79ed2cb8bb6c4df38073deeeccbb35f33`, añade una línea a `docs/product/sculpt-openplan3d-roomgpt-2026-11-18.md` y pasa `git diff --check`. La línea registra OP-07/#267 como laboratorio aislado. Cada árbol recalculado difiere de su árbol anterior solo en esa línea. Los otros cinco HEADs y los árboles de [F0 por separado](F0-CONSOLIDACION-2026-11-18.md) conservan su evidencia. Las 14 piedras y R01–R03 se verificaron en el árbol final. El cierre de los checks aplicables del nuevo HEAD documental se comprueba en [#261](https://github.com/Juanmaes83/floorplan-3d/pull/261/checks).

#265 cerró su último check de [regresión general de Presentation](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44376274358/job/135056360557) en verde. El total es 88 checks de Actions correctos, un check omitido y estado de Vercel correcto. #260 conserva su validación independiente. Va al final y cambia cuatro archivos de la deduplicación ya acreditada. [CI de #260](https://github.com/Juanmaes83/floorplan-3d/pull/260/checks).

Tras recibir autorización, integrar con commits de merge que conserven cada HEAD como segundo padre. Mantener las referencias de #262 y #263 hasta terminar la cadena. Después de incorporar #262, comprobar que su HEAD es ancestro de `master` antes de retargetear #263 a `master`. Aplicar la misma comprobación después de #263 y antes de retargetear #264. Antes de cada integración, verificar HEAD, base efectiva, diff incremental y checks aplicables. Después, contrastar `master^{tree}` con el árbol esperado y registrar el commit real de integración. Cualquier desviación requiere revisar los árboles antes de continuar.

El rollback de la secuencia completa revierte los commits de integración reales, con primer padre como línea principal, en orden **#260 → #265 → #264 → #263 → #262 → #261**. Si la ejecución se detiene antes, empezar por el último corte integrado. En F0, comprobar lectura de datos existentes y copia de compatibilidad. En OP-03, comprobar exportación e importación DXF. #260 también se puede revertir por separado y devuelve la invocación duplicada de CAT-IA. La activación y promoción se deciden por separado.

[#266 · OP-02](https://github.com/Juanmaes83/floorplan-3d/pull/266/checks) queda fuera de la autorización conjunta. `edfbf66beb93d2943d3421a2ab35a13299a5c9dc` traslada los cuatro archivos acreditados de `e52df68`, comprobados con igualdad de contenido. Los workflows de diagnóstico permanecen en su rama aislada. [Diagnóstico y validación dirigida](OP02-CI-DIAGNOSTICO-2026-11-18.md) · [Delta de benchmark OP-02](OP02-DELTA-BENCHMARK-2026-11-18.md).

[OP-04](https://github.com/Juanmaes83/floorplan-3d/blob/f027be8f0ddb8fca5acfe510a568ea8850b5742b/labs/sculpt/op-04/README.md) conserva la preparación aprobada y será el siguiente corte funcional SCULPT tras la consolidación, seguido de OP-05. #267 continúa como laboratorio aislado, fuera del lote.

Las [12 duplicidades de CI confirmadas](OP02-CI-DIAGNOSTICO-2026-11-18.md#tiempo-de-ejecución-y-duplicidades-observadas) quedan para un corte independiente de #260. Su criterio de entrada es acreditar, por archivo, la equivalencia de SHA, perfil, aserciones, cobertura y evidencia de fallo antes de retirar una invocación. Debe conservar los controles contra `master`, la cobertura única de los shards y los checks de bloqueo.
