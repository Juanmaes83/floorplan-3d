# F0 · Preparación de consolidación

**18/11/2026.** Base efectiva `master@163df68e83a80ddf11a008d573ee257d51c1821f`. CI acreditada para los tres HEADs. La integración y la promoción requieren autorizaciones separadas.

| Orden | PR y HEAD auditado | CI | Árbol acumulado simulado | Diff incremental |
|---|---|---|---|---|
| 1 | [#262 · Expediente](https://github.com/Juanmaes83/floorplan-3d/pull/262/checks) `69ae552b1a065737b097599d001c2c5a3546ebbd` | 26 correctos, 1 omitido | `aa17e76941d05d340332b9072e48007d3a8e089b` | 7 archivos de núcleo, biblioteca, paquete, contrato, pruebas y CI |
| 2 | [#263 · IndexedDB](https://github.com/Juanmaes83/floorplan-3d/pull/263/checks) `6be42e52258ca4ca8340607918854348c9302ed6` | 25 correctos, 1 omitido | `47284ea0abd5b3b1580b96fb8213073623f45d64` | 10 archivos de almacenamiento, expediente, trazado, contrato, pruebas y CI |
| 3 | [#264 · Permiso y recogida segura](https://github.com/Juanmaes83/floorplan-3d/pull/264/checks) `748e43d03829398b94b225879b12263aa26f2f1a` | 24 correctos, 1 omitido | `c588c503401055698abfb229bcdbeeebf006d2c8` | 7 archivos de permiso, persistencia, contrato, pruebas y CI |

La simulación secuencial con `git merge-tree --write-tree` reproduce los tres árboles acreditados. Las comparaciones incrementales pasan `git diff --check`. El árbol final coincide con la simulación directa de #264 sobre `master`. Los HEADs conservan su ascendencia #262 → #263 → #264. Las PR siguen como borradores.

1. Tras autorización expresa, confirmar los cuatro SHA antes de integrar #262. Verificar el árbol efectivo de `master` contra la primera fila y conservar la ascendencia de la cadena. Si el método autorizado cambia la ascendencia, recalcular el diff incremental de la dependiente antes de aplicarla.
2. Repetir la comprobación del árbol y los checks aplicables tras #263 y #264. Conservar la protección de #264, que evita liberar archivos sin Web Locks. Mantener pendientes las comprobaciones reales de Firefox, Safari y móvil antes de conectar el editor a la nueva autoridad de almacenamiento. [Contrato de persistencia](../contracts/persistencia-v1.md) · [Handoff F0 y G-02](https://github.com/Juanmaes83/floorplan-3d/blob/341624b79ed2cb8bb6c4df38073deeeccbb35f33/docs/integration/HANDOFF-F0-G02-SCULPT-2026-11-18.md#f0--cadena-de-integración).
3. Si se autoriza un rollback, revertir en orden #264 → #263 → #262 y comprobar lectura de datos existentes y copia de compatibilidad antes de activar el resultado.
