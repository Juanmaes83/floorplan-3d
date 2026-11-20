# RUBIK SOTA · SCULPT OP-11 Furniture Kit (136 GLB) · SOURCE + ISOLATE

**Estado:** SOURCE VERIFIED + ISOLATED (objetos fuente), **sin integración ni tests de render/admisión**.  
**Repositorio fuente:** [laanlabs/openPlan3D @ `771c9e1ad30bd1c3cc7584d6eca74deb2e14943d`](https://github.com/laanlabs/openPlan3D/tree/771c9e1ad30bd1c3cc7584d6eca74deb2e14943d).  
**Rama destino:** `sculpt/furniture-source-assets-20261120`. **Base original:** `master@130ba24d420a2f4b26ab261313202e6070904fd8`.  
**Protocolo:** [SCULPT-GIT-TRANSFER v1.0, PR #292](https://github.com/Juanmaes83/floorplan-3d/pull/292) (aprobado para uso en este corte, PR documental sin fusionar).

## Inventario de archivos

- **136 archivos GLB físicos**, pack `Furniture Kit (Kenney)`, total **1.923.612 bytes**.
- **27 GLB** con al menos un vínculo explícito `catalogIds` en el catálogo del donante (**30 fichas** en conjunto).
- **109 GLB** presentes como recursos originales pero **sin vínculo `catalogIds`** en las fichas del donante. No atribuir fichas ficticias.
- Conjunto complementario al [snapshot previo de **68 GLB** de naturaleza/interior](https://github.com/Juanmaes83/floorplan-3d/tree/sculpt/op11-source-assets-20261120/labs/sculpt/op-11), commit `3d0c58bb086fc9628aa3c954ff01ec60aa826b4a`. **Los 68 no se incluyen ni se duplican en esta rama**.
- En conjunto, los dos snapshots independientes preservan los **204 GLB del catálogo físico** del donante, sin implicar que estén integrados en RUBIK o que hayan superado admisión.

## Conservación literal y derechos

Los 136 ficheros están en `upstream/static/models/` y mantienen **los mismos hashes Git blob** que los archivos del donante (136/136 comparados al transferir). Manifiesto y procedencia originales íntegros en `upstream/docs/`, junto a `upstream/src/lib/utils/furnitureModelFiles.ts`, `furnitureCatalog.ts` como evidencia de asociación con catálogo y `upstream/static/models/furniture-kit-License.txt` (CC0). `upstream/LICENSE` preserva la MIT del código del donante. No trasladar la MIT del código a materiales de procedencia distinta.

`SOURCE-MANIFEST.json` registra por fichero los SHA Git exactos y los SHA-256 **declarados** en el donante. **No se ha recalculado SHA-256 independientemente**: `sha256Status=NOT_RECALCULATED`. Git SHA idéntico no acredita por sí solo seguridad, validez del GLB, rendimiento o licencia.

**NO inventar dimensiones comerciales:** `dimensionsCm` del catálogo del donante son valores por defecto, señalados como `catalog-defaults-not-product-measurements`. No se transfieren como cotas de producto.

## Límites y siguientes gates

- `SOURCE + ISOLATE` exclusivamente: **CLASSIFY, SCULPT, NORMALIZE, TEST, PREVIEW, HUMAN REVIEW y MERGE no completados**.
- Sin cambios en `assets/f3/`, `js/`, `FloorPlanProjectV1`, editor, persistencia, CI, `master` o Production.
- No habilitar archivos de clientes, catálogo comercial ni enlaces públicos adicionales.
- Codex deberá verificar SHA-256 independiente, GLB, licencia individual, límites F3, mapeos útiles, dependencias/fallback, escala, memory/GPU, tests, y preview en rama propia.
- **No merge** sin aprobación expresa posterior; Production requiere autorización independiente.

**Handoff para Codex:** empezar por `SOURCE-MANIFEST.json`, contrastar los **27 mapeados/109 no mapeados**, crear shortlist de utilización real y no duplicar el snapshot previo.
