# RUBIK SOTA — Investigación SCULPT OP-05 / OP-11: GLB propios, exterior y entourage

**Fecha de corte:** 2026-11-20. **Estado:** INVESTIGACIÓN DOCUMENTAL; no equivale a SOURCE EXACT nuevo, baseline ejecutado, integración ni autorización de merge. **Responsable de la siguiente misión:** Codex. **Base RUBIK revisada:** `floorplan-3d/master@8e917e1a70f499a6b8dc68850c8413b7d06c5682`.

## 0. Autoridad y alcance

La prioridad, los IDs y las olas pertenecen al [plan maestro v1.12](../../product/PLAN-MAESTRO-RUBIK-SOTA-v1.12.md) y [matriz](../../product/MATRIZ-TRAZABILIDAD-v1.12.md). **SCULPT NO crea una nueva ola ni un segundo roadmap.** Se respetan, en este orden, decisiones expresas del propietario, código comprobado, documentación reciente y antecedentes. Las decisiones de integración de F0, F3, CAT-02/CAT-03, IMG-13, BIB-01, OP-05 y OP-11 permanecen separadas.

Metodología canónica: [SCULPT aprobada](https://github.com/Juanmaes83/SUBVENCIONES-PYMES/blob/main/docs/20-SCULPT-METHODOLOGY.md), adoptada en [RUBIK](../../product/sculpt-metodologia-y-cartera-2026-11-10.md), con fases **SOURCE → ISOLATE → CLASSIFY → SCULPT → NORMALIZE → TEST → PREVIEW → HUMAN REVIEW → MERGE**. Documentación precedente: [inventario OpenPlan3D/RoomGPT 18/11](../../product/sculpt-openplan3d-roomgpt-2026-11-18.md).

**Ámbito exclusivo de esta investigación:**
1. OP-05: admisión de GLB propios y biblioteca privada.
2. OP-11: mobiliario de exterior.
3. OP-11: árboles, arbustos y vegetación exterior.
4. OP-11: plantas de interior.
5. OP-11: personas y figuras 3D, con distinción expresa de símbolos 2D.
6. OP-11: vehículos y elementos urbanos, con distinción expresa de símbolos 2D.
7. OP-11: terreno, fachadas y volúmenes exteriores, distinguiendo lo realmente ejecutable de los documentos de producto.

## 1. Donantes congelados e inspeccionados

| Fuente | SHA fijado | Alcance comprobado | Derechos |
|---|---|---|---|
| [laanlabs/openPlan3D](https://github.com/laanlabs/openPlan3D/tree/771c9e1ad30bd1c3cc7584d6eca74deb2e14943d) | `771c9e1ad30bd1c3cc7584d6eca74deb2e14943d` | 1.161 blobs, 205 GLB físicos, código/catálogos/documentación | `LICENSE` MIT para código; recursos con procedencia separada |
| [Juanmaes83/openPlan3D](https://github.com/Juanmaes83/openPlan3D/tree/771c9e1ad30bd1c3cc7584d6eca74deb2e14943d) | mismo SHA | Fork idéntico en el corte; útil como fuente de trabajo bajo control propio | hereda obligaciones de origen |
| [laanlabs/openlandscape3d-cloud](https://github.com/laanlabs/openlandscape3d-cloud/tree/f70ff716d1bf30208046d43d319d2972b2254334) | `f70ff716d1bf30208046d43d319d2972b2254334` | Producto hermano, **donante separado** de paisajismo | MIT del código; fichas botánicas y datos se auditan por separado |
| [RUBIK fuente archivada](https://github.com/Juanmaes83/floorplan-3d/tree/sculpt/openplan3d-fuente/labs/sculpt/openplan3d-771c9e1) | `771c9e1` según expediente previo | rama histórica `sculpt/openplan3d-fuente`, `MANIFEST.sha256` de **84 ficheros**; procede del corte G-02/DXF y F0, **NO contiene acreditado el snapshot OP-11 Nature Kit** | verificar reutilización, y extraer OP-11 nuevo con su propio SOURCE EXACT |
| [RUBIK laboratorio OP-05](https://github.com/Juanmaes83/floorplan-3d/blob/a722f9ddaf735d1ef45ffc17c6fbb87c2e8f43a6/labs/sculpt/op-05/README.md) | `a722f9ddaf735d1ef45ffc17c6fbb87c2e8f43a6` | escultura de admisión existente, **NO repetir SOURCE ni rehacer el lab** | ver su fuente, licencias y contrato |

**Límite de verificación:** investigación remota de árbol Git, código y manifiestos. Los tests anotados en laboratorios anteriores son evidencia histórica que **no se ha reejecutado en esta investigación**. No se han leído ni procesado todos los blobs binarios mediante un validador GLB; Codex deberá verificar bytes/hashes del lote seleccionado y completar su baseline.

## 2. Inventario verificable OpenPlan3D

- Git tree: **205 archivos `.glb`**, de los que **204** son los modelos de catálogo en `static/models/` y **1** es un fixture de pruebas.
- [`docs/furniture-manifest.json`](https://github.com/laanlabs/openPlan3D/blob/771c9e1ad30bd1c3cc7584d6eca74deb2e14943d/docs/furniture-manifest.json): **189 entradas de catálogo**, **204 modelos**, **20 referencias de textura**; la declaración de modelo no garantiza que todas las entradas tengan un GLB asignado.
- [`src/lib/utils/furnitureModelFiles.ts`](https://github.com/laanlabs/openPlan3D/blob/771c9e1ad30bd1c3cc7584d6eca74deb2e14943d/src/lib/utils/furnitureModelFiles.ts): **96 asignaciones** ID de catálogo → modelo GLB. Los restantes casos pueden usar representación procedural o 2D.
- [`docs/furniture-provenance.json`](https://github.com/laanlabs/openPlan3D/blob/771c9e1ad30bd1c3cc7584d6eca74deb2e14943d/docs/furniture-provenance.json): evidencia histórica declarada de coincidencia SHA-256 con archivos oficiales de Kenney para **140 modelos Furniture Kit** y **64 Nature Kit**; nombres de miembros de ZIP, hashes, pack y licencia. Verificar de nuevo la coincidencia en SOURCE EXACT.
- Archivos originales de derechos: [Furniture Kit License](https://github.com/laanlabs/openPlan3D/blob/771c9e1ad30bd1c3cc7584d6eca74deb2e14943d/static/models/furniture-kit-License.txt) y [Nature Kit License](https://github.com/laanlabs/openPlan3D/blob/771c9e1ad30bd1c3cc7584d6eca74deb2e14943d/static/models/nature-kit-License.txt): ambos declaran **CC0**. La licencia MIT del código no sustituye la procedencia de cada GLB ni de otras texturas.

**Inventario del Nature Kit: 64 GLB** (`static/models/`):

| Grupo | GLB | Patrón |
|---|---:|---|
| Árboles y palmeras | 15 | `outdoor_tree_*.glb` |
| Arbustos | 6 | `outdoor_plant_bush*.glb` |
| Flores | 6 | `outdoor_flower_*.glb` |
| Césped/vegetación baja | 4 | `outdoor_grass*.glb` |
| Cactus | 2 | `outdoor_cactus_*.glb` |
| Vallas | 4 | `outdoor_fence_*.glb` |
| Rocas/piedras | 7 | `outdoor_rock_*.glb` + `outdoor_stone_*.glb` |
| Macetas exteriores | 2 | `outdoor_pot_*.glb` |
| Otros (fogata, troncos, hongos, señal, estatuas, cultivos, musgo, nenúfar y tienda) | 18 | `outdoor_*.glb` restante |
| **TOTAL** | **64** | **~629 KiB de archivos** |

**Plantas interiores** dentro del Furniture Kit: `plantSmall1.glb`, `plantSmall2.glb`, `plantSmall3.glb`, `pottedPlant.glb`. Son **4 GLB físicos**, aunque el mapa de catálogo usa al menos `pottedPlant` y `plantSmall1`; no inferir cuatro fichas visibles.

## 3. Diferencia de capacidades por familia

| Familia | Evidencia donante exacta | Limitación / estado RUBIK |
|---|---|---|
| OP-05 GLB privados | `src/lib/utils/localGLB*.ts`, `src/lib/services/customModel*.ts`; UI y pruebas originales | [OP-05 LAB](https://github.com/Juanmaes83/floorplan-3d/blob/a722f9ddaf735d1ef45ffc17c6fbb87c2e8f43a6/labs/sculpt/op-05/README.md) ya desarrolló admisión. Sin conexión segura a F0.2c/F0.3 ni producto |
| Mobiliario exterior | `furnitureCatalog.ts`, `furnitureModels3d.ts`, `furnitureModelFiles.ts`; **13 entradas de Outdoor Furniture** | F3 de RUBIK tiene cinco GLB de producto exterior conocidos; varios objetos del donante **no** tienen GLB y usan fallback procedural |
| Árboles/vegetación exterior | 64 GLB Nature Kit + `furnitureModelFiles.ts` + `furnitureModelLoader.ts` | En `floorplan-3d/master@8e917e1` no hay GLB de árboles y arbustos admitidos en `assets/f3/`; reutilizar el loader existente |
| Plantas interiores | 4 GLB del Furniture Kit + mapeo de catálogo | RUBIK tiene referencias genéricas, no familia ampliada de plantas interiores GLB |
| Personas 3D | `src/lib/utils/entourageCatalog.ts`: **2 símbolos de personas EN 2D** (persona, pareja) | **No existen GLB 3D de personas acreditados** en el donante |
| Vehículos 3D | `entourageCatalog.ts`: **3 símbolos EN 2D** (sedán, SUV, pickup) | **No existen GLB 3D de coches acreditados** en el donante |
| Entourage 2D | `entourageCatalog.ts`: **12 símbolos vectoriales**: 2 personas, 3 vehículos, 6 plantación, 1 exterior; `entourageDxf.ts`, `entourageImages.ts`, `entouragePlanBounds.ts`, pruebas | Potencial de documentación profesional, no biblioteca 3D ni motor nuevo |
| Terrenos/exteriores | `furnitureModels3d.ts` contiene constructores; `ThreeViewer.svelte` tiene plano base; `OUTDOOR_FEATURES.md` enumera escenarios deseados | **No** se acredita editor topográfico completo (curvas, taludes, rasantes). RUBIK conserva `exterior-core.js`/`exterior-volumes.js` y geometría canónica |

Documentos del donante para contrastar límites: [`OUTDOOR_BUGS.md`](https://github.com/laanlabs/openPlan3D/blob/771c9e1ad30bd1c3cc7584d6eca74deb2e14943d/OUTDOOR_BUGS.md) señala muebles exteriores sin GLB (patio table/chair, umbrella, BBQ, bench, lounger, picnic); [`OUTDOOR_FEATURES.md`](https://github.com/laanlabs/openPlan3D/blob/771c9e1ad30bd1c3cc7584d6eca74deb2e14943d/OUTDOOR_FEATURES.md) es especificación/aspiración mezclada con funcionalidades, **no prueba de implementación**.

### 3.1. Donante separado de paisajismo (no confundir con OpenPlan3D)

[OpenLandscape3D](https://github.com/laanlabs/openlandscape3d-cloud/tree/f70ff716d1bf30208046d43d319d2972b2254334) contiene `src/lib/catalog/plants.json` (**250 fichas botánicas**), `src/lib/catalog/materials.json` (**36 materiales**) y `src/lib/analysis/groups.ts` (distribución determinista línea/masa/cuadrícula). `src/lib/render/plantModels.ts`, `src/lib/render/renderView.ts` y `src/lib/scene/build.ts` implementan modelos vegetales procedurales instanciados y superficies. `src/lib/io/openplan.ts` demuestra intercambio con OpenPlan3D. Su `Site.terrain` permite `flat|points` en contrato, **pero `buildGround` usa suelo plano**: no afirmar topografía real implementada. Datos botánicos iniciales orientados a EE. UU. y etiquetados como borrador/no revisados; NO usar como dato agronómico fiable para España sin validación.

## 4. RUBIK actual: componentes/autoridades que NO deben duplicarse

- `assets/f3/`: 24 GLB físicos en master (no todos equivalen a 24 productos comerciales); ~20 referencias externas en el manifiesto, modelos CAT-IA y bancos separados. Fuente de producto: `js/asset-catalog.js`, `js/asset-ui.js`, `js/asset-loader.mjs`, `js/generic-catalog.js`, `js/catalog-placement-core.js`.
- F3 restringe el GLB técnico a **8 MiB** de bytes, hasta **4 imágenes, 4 texturas, 8 materiales**, máximo **2048 px** por lado de imagen y presupuestos piloto de **16 MiB decodificados / 24 MiB GPU**; verificar valores reales del HEAD y equipo antes de establecer límites de producto.
- `assets/materials/catalog.json`: **50 superficies** catalogadas. No duplicar materiales con el catálogo de 36 materiales del donante paisajístico.
- `js/project-core.js`, `FloorPlanProjectV1`/schema, historial, `View3D`, `FloorPlanPersistence`, F3/Asset Lab, `exterior-core.js`, `exterior-volumes.js`, entrega y presupuesto mantienen autoridad única.
- OP-05 escultura histórica: **73/73** baseline Vitest y **1/1** Chromium donante, **5/5** pruebas de admisión RUBIK acreditadas en su README. Son **resultados históricos, NO reejecutados aquí**. Propuesta `labs/sculpt/op-05/private-glb-references.md` pendiente de F0.2c/F0.3.
- `master@8e917e1`: OP-02/03/04 integradas con límites; OP-10 exportación Blender y Simulator E QA integradas; PRs F0.2c `#274/#276/#277` y F0.3 `#278/#279` siguen separadas/no fusionadas en este corte. No eludir esos contratos.

## 5. Hallazgos, riesgos, omisiones que NO deben convertirse en suposiciones

1. **Árbol Git ≠ modelo válido en RUBIK:** exigir SHA-256 de bytes, GLB parse válido, procedencia, términos de licencia y pruebas visuales.
2. **Catálogo ≠ GLB:** 189 fichas, 96 mapeos explícitos y 204 modelos físicos son métricas distintas.
3. **CC0 de Kenney ≠ todos los recursos de OpenPlan3D:** auditar texturas, otros packs y archivos añadidos.
4. **Bajo peso ≠ bajo coste de GPU:** contar mallas, triángulos, texturas, instancias, tiempo de render, liberación, móvil real.
5. **Persistencia de privados ≠ exposición pública:** no publicar GLB de usuario, nombres/rutas privadas, URLs de origen ni contenido de expedientes en catálogo, enlace compartido o preview.
6. **La vegetación Kenney es estilizada/low-poly:** no declararla fotorrealista ni validada para comercialización arquitectónica premium sin HUMAN REVIEW.
7. **Personas/cars 3D y topografía avanzada:** sin donante acreditado en esta investigación → **HOLD / SOURCE DISCOVERY**.
8. **No modificar el roadmap por descubrir un repositorio:** subcortes derivados solo operativos; no nuevos IDs canónicos.
9. No hay nuevas pruebas funcionales ni aprobación de merge en esta investigación. La siguiente fase debe preservar evidencia y resultados PASS/FAIL/BLOCKED/NOT_RUN de manera explícita.

Continúa en [matriz de subcortes y gates](02-MATRIZ-CORTES-Y-GATES-2026-11-20.md) y [mandato ejecutable para Codex](03-MANDATO-CODEX-SCULPT-2026-11-20.md).
