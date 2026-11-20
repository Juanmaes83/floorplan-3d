# RUBIK SOTA — Matriz SCULPT de transferencia OP-05 / OP-11

**Corte:** 2026-11-20. **Estado:** propuesta de subcortes para Codex, NO autorización de integración. **Referencia:** [investigación de fuentes](01-INVESTIGACION-OPENPLAN3D-OP05-OP11-2026-11-20.md) y [SCULPT canónico](../../product/sculpt-metodologia-y-cartera-2026-11-10.md).

## 1. Correspondencia con producto (sin crear nuevos IDs)

| Alias de ejecución | ID maestro/consumidor | Capacidad | Estado documentado | Clase preliminar | Gate siguiente |
|---|---|---|---|---|---|
| **OP-05 residual** | OP-05, F0.2c/F0.3, F3, CAT-02/CAT-03, BIB-01 | GLB propios privados con derechos, SHA, deduplicación, guardado y restauración | LAB `a722f9dd`, NO integrado | KEEP admisión, GENERALISE contrato, REPLACE base64/almacén ajeno, OPTIONALISE preview, REMOVE endpoints/fugas | Contrato y gates F0; NO activar en `master` |
| **OP-11/C1** | OP-11, F3, CAT-02, IMG-13, BIB-01 | 64 GLB de naturaleza/exterior | SOURCE identificado; sin baseline de RUBIK | KEEP assets acreditados, GENERALISE catálogo; REPLACE sólo adaptadores incompatibles | 12-modelos piloto en LAB, hashes/licencias/QA |
| **OP-11/C2** | OP-11, F3, CAT-02, IMG-13 | 4 plantas de interior | SOURCE identificado; sin baseline de RUBIK | KEEP GLB; GENERALISE metadatos | Piloto mismo catálogo sin duplicación |
| **OP-11/C3** | OP-11, CAT-02/CAT-03, F3, exterior | Mobiliario de terraza, complementos y fallback procedural | Donante tiene 13 fichas outdoor, no 13 GLB | CLASSIFY recurso a recurso, GENERALISE/OPTIONALISE, REPLACE duplicados | Comparativa visual/funcional frente a cinco GLB de exterior existentes |
| **OP-11/C4** | OP-11, representación 2D/entrega, DXF | 12 símbolos 2D de personas, vehículos, plantación y exterior | Código real `entourageCatalog.ts` y exportadores | GENERALISE vectores, KEEP pruebas, REMOVE UI Svelte | Demo/documentación 2D, sin afirmar 3D |
| **OP-11/C5** | OP-11, exterior, F3, OP-02 | Paisajismo, superficies, agrupación determinista, estaciones | Fuente **separada** OpenLandscape3D; investigación inicial | SOURCE aislado, CLASSIFY pendiente | Snapshot/contratos propios; ni datos USA ni editor de terreno nuevo |
| **OP-11/C6** | OP-11, PER-01/02/03 si procede tras reconciliación | Figuras humanas 3D y vehículos GLB | No acreditados en OpenPlan3D | HOLD / SOURCE DISCOVERY | Nueva fuente legal, desempeño y aprobación del alcance |

**Estos alias C1–C6 no son nuevas piedras del plan ni suponen una nueva ola.** Para elementos sin correspondencia demostrada en el catálogo maestro escribir `PENDIENTE DE DECISIÓN`. La investigación OP-11 no reabre ni reemplaza la prioridad de F0.

## 2. Archivo/familia → clasificación preliminar

| Fuente inmutable OpenPlan3D `771c9e1` | Decisión provisional | Adaptación/Riesgo |
|---|---|---|
| `docs/furniture-provenance.json`, `docs/furniture-manifest.json` | **KEEP** | hashes/licencias/origen; recalcular SHA-256 local y contrastar con fichero |
| `static/models/outdoor_*.glb` (64 Nature Kit) | **KEEP selectivo** | modelo, escala/centro/pivote, orientación, límites F3, test de admisión |
| `static/models/plantSmall{1,2,3}.glb`, `pottedPlant.glb` | **KEEP selectivo** | 4 GLB; categoría RUBIK existente, no catálogo paralelo |
| `src/lib/utils/furnitureModelFiles.ts`, `furnitureCatalog.ts` | **GENERALISE** | extraer mapeo/ficha, no importar esquema/UI Svelte |
| `src/lib/utils/furnitureModelLoader.ts`, `furnitureModelResources.ts` | **GENERALISE / OPTIONALISE** | estudiar carga lazy, caché y fallback; REUTILIZAR `js/asset-loader.mjs`/renderer de RUBIK |
| `src/lib/utils/furnitureModels3d.ts` | **OPTIONALISE / REPLACE** | probar sólo constructores útiles; no sustituir GLB actuales ni crear segundo motor |
| `src/lib/utils/entourageCatalog.ts`, `entouragePlanBounds.ts` | **GENERALISE** | 12 símbolos 2D, medidas/rotación/escala; adaptar a proyecto y DXF existentes |
| `src/lib/utils/entourageDxf.ts`, `entourageImages.ts` y pruebas | **GENERALISE / KEEP** | preservar curvas y transparencia con tests de exportación; no copiar dependencia si hay equivalente |
| `src/lib/utils/localGLB*.ts`, `src/lib/services/customModel*.ts` | **KEEP desde lab OP-05 existente** | NO reclonar; clasificación y contrato `labs/sculpt/op-05` gobiernan |
| `ThreeViewer.svelte`, app Svelte, rutas Firebase y stores | **REMOVE** como dependencia de producto | biblioteca RUBIK no debe depender del editor/runtime del donante |
| `OUTDOOR_FEATURES.md`, `MODEL_SOURCES.md` | **KEEP como documentación de investigación** | no equivalen a implementación ni permiso de todos los modelos externos |
| OpenLandscape3D `groups.ts`, `plantModels.ts`, `scene/build.ts`, `io/openplan.ts` | **SOURCE / CLASSIFY futuro** | donante distinto, códigos/escala/metadatos independientes, posible solape de autoridad |

Codex completará una **fila por fichero real incluido y dependencia**, con clasificación definitiva y razón, antes de extraer o cambiar código.

## 3. Lote piloto de 12 GLB (NO son 12 modelos ya admitidos)

Todos son rutas dentro de `static/models/` del commit original:

1. `outdoor_tree_oak.glb`
2. `outdoor_tree_palm.glb`
3. `outdoor_tree_pineTallA_detailed.glb`
4. `outdoor_plant_bushDetailed.glb`
5. `outdoor_plant_bush.glb`
6. `outdoor_flower_redA.glb`
7. `outdoor_grass.glb`
8. `outdoor_rock_largeA.glb`
9. `outdoor_fence_simple.glb`
10. `outdoor_pot_large.glb`
11. `plantSmall1.glb`
12. `pottedPlant.glb`

**Condición de admisión previa:** existencia exacta en Git tree, licencia/pack, SHA-256 verificado, recurso autocontenido, ausencia de referencias externas, geometría válida, límites de F3 y dimensiones normalizadas. Si uno falla, registrarlo `HOLD`, no sustituir silenciosamente ni contar como PASS.

## 4. Gates medibles y paquetes de evidencia

| Gate | Evidencia que Codex debe aportar | Decisión al fallo |
|---|---|---|
| **SOURCE** | URL + commit completo + licencia por activo + hash Git + SHA-256 original, dependencia y comparación catálogo existente; snapshots históricos comprobados | Sin licencia/SHA → HOLD |
| **ISOLATE** | Carpeta lab aislada, manifiesto, pruebas del donor realmente ejecutadas o NOT_RUN motivado, payloads sintéticos, sin escribir en `master` | Baseline rota → BLOCKED |
| **CLASSIFY** | KEEP/GENERALISE/OPTIONALISE/REPLACE/REMOVE por fichero y capacidad; resolver equivalencias F3/OP-05 | Autoridad paralela → NO-GO |
| **SCULPT** | Adaptador reversible y piloto de 12, sin UI/Svelte/Three duplicados; diffs mínimos | Duplicación/privacidad → BLOCKED |
| **NORMALIZE** | Metros ↔ mm, ejes, centro, pivote, rotación, escala física declarada vs estimada, ID estable, material/fallback, nombres de categoría | Escala no verificable → no vender medidas |
| **TEST** | SHA, licencia, parser GLB, recursos embebidos, triángulos, texturas, GPU, memoria, carga/descarga/dispose, 2D/3D, duplicar, undo/redo, guardar/reabrir, exportación, cancelación, input adversario, 3 navegadores cuando aplique | Tests críticos FALLAN → BLOCKED |
| **PREVIEW** | Demo navegable aislada o evidencia local reproducible, vistas escritorio/móvil, calidad, escenas pequeñas y stress, métricas p50/p95/dispositivos; sin datos privados | Sin preview reproducible → HOLD |
| **HUMAN REVIEW** | Visto bueno expreso del propietario al lote y a la calidad (no implícito por green CI) | Falta aprobación → NO MERGE |
| **MERGE / PRODUCTION** | Autorizaciones separadas, SHA fijo, CI de HEAD, alcance aprobado, revert propio, postmerge y pase a Production independiente | Sin doble gate → no modificar master/Production |

**Criterios específicos:** no publicar fuente GLB de un cliente en catálogos/repos públicos; comprobar deduplicación/expediente/backup/compartición antes de OP-05 productivo. No presentar simbología 2D como modelos 3D; no usar datos botánicos de EE. UU. como recomendaciones para España; no afirmar topografía avanzada por `Site.terrain` en schema; no prometer fotorrealismo de modelos low-poly.

## 5. Resultado de cada subcorte (estado tipado)

Codex registrará **SOURCE_IDENTIFIED / SOURCE_VERIFIED / ISOLATED / BASELINE_PASS / ADAPTED / TEST_PASS / PREVIEW_READY / HUMAN_APPROVED / INTEGRATED**, o bien **HOLD / BLOCKED / REJECTED / NOT_RUN** con evidencia, fecha y SHA. Un repo o archivo existente no salta fases; pruebas históricas del donante se anotan **HISTORICAL**, no como tests corridos por Codex.

## 6. Riesgos y reversión

1. **Seguridad/privacidad (P0):** nada de adjuntos privados de usuario en catálogo público, previews, ZIP de código o enlaces anónimos.
2. **Provenance (P0):** licencia MIT del runtime y CC0 del asset son piezas distintas. Mantener avisos de copyright y hashes.
3. **Arquitectura (P0):** no segundo `project-core`, persistencia, catálogo, editor, `View3D` ni loader compartido.
4. **Rendimiento (P1):** fallback para WebGL ausente, GPU pequeña y batería/móvil; tests con decenas y centenares de instancias.
5. **Fidelidad (P1):** materiales, orientación de ejes, medidas, centro, luces y sombras con QA visual.
6. **Gobierno (P0):** PR draft/lab, reversión del cambio específico; no fusionar, promover ni activar IA de pago sin mandato separado.

**Siguiente lectura obligatoria:** [mandato Codex](03-MANDATO-CODEX-SCULPT-2026-11-20.md).
