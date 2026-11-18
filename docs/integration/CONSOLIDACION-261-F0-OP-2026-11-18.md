# Secuencia para autorización conjunta · seis PR con CI completa

Base verificada `master@163df68e83a80ddf11a008d573ee257d51c1821f`. La secuencia se simuló con `git merge-tree --write-tree`, sin conflictos. Los árboles de la tabla corresponden al contenido acumulado tras cada paso con las PR fijadas en esos HEADs.

| Orden | PR | HEAD a autorizar | Árbol acumulado esperado |
|---|---|---|---|
| 1 | [#261 · Reconciliación documental](https://github.com/Juanmaes83/floorplan-3d/pull/261) | `341624b79ed2cb8bb6c4df38073deeeccbb35f33` | `c6cded96910438e890071acbaa8813aab3a3caf1` |
| 2 | [#262 · F0.1 Expediente](https://github.com/Juanmaes83/floorplan-3d/pull/262) | `69ae552b1a065737b097599d001c2c5a3546ebbd` | `9486fb81bea4fcb1902098d2e47bc258a2b09894` |
| 3 | [#263 · F0.2a IndexedDB](https://github.com/Juanmaes83/floorplan-3d/pull/263) | `6be42e52258ca4ca8340607918854348c9302ed6` | `b669ed415c6e1fedb812198595e7069f359d52d4` |
| 4 | [#264 · F0.3 Permiso y recogida segura](https://github.com/Juanmaes83/floorplan-3d/pull/264) | `748e43d03829398b94b225879b12263aa26f2f1a` | `2b13206314edc317a7707690b260e0de1bbd3e87` |
| 5 | [#265 · OP-03 / DXF](https://github.com/Juanmaes83/floorplan-3d/pull/265) | `b9f4b3c1489a45f4a1dbdde5f27ecd26ac8f8c43` | `4e30277a4499538bca7236b3e278d6093f8d069a` |
| 6 | [#260 · CI inteligente](https://github.com/Juanmaes83/floorplan-3d/pull/260) | `5b003bd67b7d08f03d8029ce8ad87f53ed54a466` | `8b2b8330e408cce0cb70770750daafe6dbe193ad` |

Los árboles acreditados de [F0 por separado](F0-CONSOLIDACION-2026-11-18.md) siguen siendo la referencia de su delta. El árbol conjunto al cerrar #264 difiere del árbol aislado acreditado `c588c503401055698abfb229bcdbeeebf006d2c8` exactamente en los 11 documentos de #261. La cartera de las 14 piedras y R01–R03 conserva los blobs de #261 al completar toda la secuencia. La revisión de whitespace de #261 señala una línea en blanco final en el documento de metodología. Se conserva el HEAD acreditado.

#265 cerró su último check de [regresión general de Presentation](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44376274358/job/135056360557) en verde. El total es 88 checks de Actions correctos, un check omitido y estado de Vercel correcto. #260 conserva su validación independiente. Va al final y cambia cuatro archivos de la deduplicación ya acreditada. [CI de #260](https://github.com/Juanmaes83/floorplan-3d/pull/260/checks).

Tras recibir autorización, integrar con commits de merge que conserven cada HEAD como segundo padre. Mantener las referencias de #262 y #263 hasta terminar la cadena. Después de incorporar #262, comprobar que su HEAD es ancestro de `master` antes de retargetear #263 a `master`. Aplicar la misma comprobación después de #263 y antes de retargetear #264. Antes de cada integración, verificar HEAD, base efectiva, diff incremental y checks aplicables. Después, contrastar `master^{tree}` con el árbol esperado y registrar el commit real de integración. Cualquier desviación requiere revisar los árboles antes de continuar.

El rollback de la secuencia completa revierte los commits de integración reales, con primer padre como línea principal, en orden **#260 → #265 → #264 → #263 → #262 → #261**. Si la ejecución se detiene antes, empezar por el último corte integrado. En F0, comprobar lectura de datos existentes y copia de compatibilidad. En OP-03, comprobar exportación e importación DXF. #260 también se puede revertir por separado y devuelve la invocación duplicada de CAT-IA. La activación y promoción se deciden por separado.

[#266 · OP-02](https://github.com/Juanmaes83/floorplan-3d/pull/266/checks) `f34ad8ef79ea5f3232b90ffafb55319e4e140590` queda fuera de la autorización conjunta por sus checks generales pendientes de resolución. [NAV3D](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44393395751) terminó en verde, incluida la comparación con `master` sin fallos nuevos y el vídeo. [Manifiesto local de vídeo](nav3d-f34ad8e-video-manifest.json) · [Delta de benchmark OP-02](OP02-DELTA-BENCHMARK-2026-11-18.md).

[OP-04](https://github.com/Juanmaes83/floorplan-3d/blob/f027be8f0ddb8fca5acfe510a568ea8850b5742b/labs/sculpt/op-04/README.md) conserva la preparación aprobada y será el siguiente corte funcional SCULPT tras la consolidación.
