# SCULPT OP-11 — SOURCE EXACT / ISOLATE (68 GLB)

**Estado:** SOURCE + ISOLATE de archivos; **sin integración ni baseline de ejecución**.  
**Donante:** [laanlabs/openPlan3D](https://github.com/laanlabs/openPlan3D/tree/771c9e1ad30bd1c3cc7584d6eca74deb2e14943d) a commit fijo `771c9e1ad30bd1c3cc7584d6eca74deb2e14943d`.  
**Destino:** `Juanmaes83/floorplan-3d`, rama `sculpt/op11-source-assets-20261120`.  
**Clase:** OP-11/C1 (64 GLB Nature Kit) + OP-11/C2 (4 plantas de interior Furniture Kit).

## Procedencia y derechos

Los archivos `upstream/static/models/*.glb` se han preservado con los **mismos identificadores Git blob** que en el donante. Los manifiestos originales `upstream/docs/furniture-manifest.json` y `upstream/docs/furniture-provenance.json` relacionan archivos, tamaños, hashes SHA-256 y origen exacto en los kits de Kenney. Licencias originales de los dos kits en `upstream/static/models/*-License.txt`, que declaran CC0. `upstream/LICENSE` conserva la licencia MIT del código del donante; no extiende automáticamente esa licencia a todos sus materiales.

Ver `SOURCE-MANIFEST.json`: 68 entradas con `donorBlobSha`, SHA-256 declarado por el donante, pack, tamaño y marcador de piloto. **La igualdad del Git blob SHA fue comprobada durante la transferencia; el SHA-256 no se ha recalculado independientemente en esta operación**. Codex debe revalidarlo antes de admisión técnica y ejecución de pruebas.

## Alcance y prohibiciones

- 68 GLB **originales, no modificados, no normalizados, no admitidos en catálogo**.
- Piloto de **12 modelos**, señalados con `pilot:true` en el manifiesto.
- No son 68 recursos integrados en `assets/f3/`, ni certificados para render. No hay capturas ni validación humana.
- No hay cambios en `js/`, `assets/f3/`, `project-core`, persistencia F0, ni producto.
- No fusionar la rama, no activar Production, no almacenar GLB privados de clientes aquí.

## Siguiente gate

Consultar [investigación y mandato Codex](https://github.com/Juanmaes83/floorplan-3d/tree/sculpt/op05-op11-research-handoff-20261120/docs/sculpt/op05-op11). Corresponde a Codex ejecutar `CLASSIFY → SCULPT → NORMALIZE → TEST → PREVIEW` en laboratorio aislado, y detenerse ante `HUMAN REVIEW`. OP-05 sigue su propio laboratorio y gates F0.
