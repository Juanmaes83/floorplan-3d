# FT3D-8 · S1 (cronograma + BC3/BCCA + Catastro) — especificación verificada contra el repositorio

**Estado:** documento de preparación. **No autoriza S1.** No modifica código. Convierte la auditoría de 38 puntos del
prompt S1 en una especificación ejecutable cuyos supuestos se han comprobado contra el repositorio real el
2026-11-05. Lo que no se ha podido comprobar se marca **[sin verificar]**.

## 0. Por qué este documento

La auditoría del propietario detectó 38 problemas en el prompt S1. Al contrastarlos con el código aparecen tres
hechos que cambian la forma de S1 más que cualquier punto aislado:

1. **BC3, BCCA y Catastro ya existen en master.** S1 no debe construir importadores: debe *encadenar* los existentes
   con el plan de obra de FT3D-8. Escribir otro lector BC3 o GML crearía una segunda autoridad (prohibido).
2. **La parcela de Catastro no puede salir en una entrega al cliente.** El proveedor la marca con licencia
   `restricted` y la política de territorio sólo permite exportar `not-applicable` o `verified` con atribución.
   Cualquier vídeo/HTML de cliente que dibuje la parcela catastral violaría una regla ya codificada.
3. **El presupuesto es por planta, no por edificio.** Un edificio de varias plantas no tiene hoy un presupuesto único
   al que vincular el plan; S1 necesita una decisión del propietario (§5, P1) antes de tocar costes de edificio.

## 1. Base verificada

| Hecho | Valor comprobado |
|---|---|
| Rama FT3D-8 | `feat/ft3d-8v-schedule-core-2026-11-05` |
| SHA base propuesto para S1 | `f78b5e3a94ffe0d3fd2cc44c0e08c7fd28b64cbb` (HEAD = remoto, árbol limpio) |
| master | `0f9c6ea` = merge-base; la rama va 10 por delante, 0 por detrás |
| CI de FT3D-8 | `.github/workflows/ft3d-8v-schedule-core.yml`: `push` **sólo** a la rama exacta (con filtro de rutas) + `workflow_dispatch` |

Consecuencia (punto 35): si S1 trabaja en una rama nueva, la CI de FT3D-8 **no se ejecuta**. Opciones: (a) S1 sigue en
esta misma rama; (b) S1 añade su rama a `on.push.branches` como primer commit. Recomendado: (a), un único hilo
revisable; la decisión es del propietario (P5).

**Hueco ya existente en el filtro de rutas (encontrado al verificar):** `paths` es una lista *explícita* de archivos,
no un comodín. Hoy `js/construction-mp4-muxer.js` **no está en la lista**: un cambio que sólo toque el muxer no
dispararía la CI. Y cualquier archivo nuevo de S1 (`js/construction-<nuevo>.js`, `tests/<nuevo>.test.cjs`) tampoco la
dispararía. Corrección propuesta (no aplicada en este documento): usar `js/construction-*.js`,
`tests/construction-*.test.cjs` y `tests/ft3d-8-*.cjs`.

## 2. Autoridades existentes que S1 debe reutilizar

| Necesidad S1 | Módulo existente (master) | API verificada | Regla que S1 hereda |
|---|---|---|---|
| Leer/escribir FIEBDC-3 | `js/fiebdc3-codec.js` (`FloorPlanFIEBDC3`) | `parse`, `decode` → `{text,encoding}` | Códigos de concepto ≤ 22 caracteres; **no hay límite de bytes** (ver §7) |
| Precios desde un BC3 del profesional | `js/bc3-budget-core.js` (`FloorPlanBc3Budget`) | `PROVIDER='user-bc3'`, `normUnit`, `load(bytes,fileName)`, `search(base,{text,unit,limit})`, `quote(base,code,priceIndex)`, `exportBudget(budget,{title,program,date})` | Lectura local, nunca sube ni redistribuye; licencia `unknown`; **nunca convierte unidades distintas**; columnas de precio separadas |
| BCCA (Andalucía) | `js/cost-provider-bcca-es.js` (`FloorPlanBccaEsCostProvider`) | sobre `FloorPlanCostProvider` + códec; `network:'none'` | Gate legal `docs/legal/bcca-es-reuse-gate-2026-10-27.md`: `user-supplied` permitido con `license.status='unknown'`; `rubik-managed` **desactivado** (LEGAL GATE = UNKNOWN) |
| Aplicar un precio a una partida | `js/budget-cost-bridge.js` (`FloorPlanBudgetCostBridge`) | aplicación explícita de un `CostQuote` a una partida | Sólo por acción explícita; nunca en lote silencioso |
| Mediciones | `js/quantity-core.js`, `js/quantity-schedule-core.js` | estados `measured/estimated/unavailable`; un dato no disponible es `null`, nunca 0 | FT3D-8 no mide geometría |
| Parcela catastral | `js/catastro-parcel-provider.js` (`FloorPlanCatastroParcel`) | sólo GML aportado por el usuario (INSPIRE CP 3.0/4.0), sin WFS | `license.status='restricted'`, atribución «Dirección General del Catastro» |
| Geometría de parcela | `js/parcel-core.js` (`FloorPlanParcelCore`) | CRS `EPSG:25829/25830/25831/32628`; `LIMITS={documentBytes:2_000_000, parcels:32, points:4000, polygons:64, rings:128}` | — |
| Marco y colocación | `js/territory-integration-core.js` (`FloorPlanTerritoryIntegration`) | `validate`, `modelToParcel`, `parcelToModel`, `sourceToLocal`, `localToSource`, `elevationToModel`, `rebaseForLevel` | S1 no implementa transformaciones propias |
| ¿Se puede exportar una capa? | `js/territory-export-policy.js` | `layer(source,available)` → `canExport` sólo si `not-applicable`, o `verified` **con** atribución | Catastro (`restricted`) → `canExport=false` |
| Presupuesto C1–C4 | `js/budget-core.js`, `js/budget-draft-core.js` | un presupuesto por planta (`bud_<projectId>`) | No existe presupuesto de edificio |
| Plan de obra | `js/construction-schedule-core.js` (FT3D-8 0.2.0) | dependencias, `elements`, `budgetAllocations` | Única autoridad de planificación |

**Regla de S1:** ningún archivo nuevo de S1 puede parsear BC3/GML, convertir coordenadas ni calcular precios por su
cuenta. Si una API existente no basta, S1 se detiene y lo informa (§4, condición de interrupción I2).

## 3. Lo que S1 sí aporta (el hueco real)

El hueco no es importar, es **trazar**: hoy el plan FT3D-8 reparte partidas (`budgetAllocations`) de un presupuesto
cuyas partidas pueden venir de un BC3, pero nada registra *qué BC3, qué columna de precio y en qué fecha*, ni lo
invalida si cambia. S1 aporta:

- **Procedencia económica por partida asignada:** `{provider:'user-bc3'|'bcca-es'|'manual', fileName, sha256,
  priceIndex, licenseStatus, quotedAt}` leída de lo que ya guardan el puente de costes y el presupuesto, nunca
  reconstruida. Si el dato no existe en origen → `unknown`, no se infiere.
- **Contexto territorial en la entrega** sólo como texto (referencia catastral, municipio si consta, atribución) cuando
  la capa no es exportable; la geometría sólo se dibuja si `canExport=true`.
- **Un expediente versionado** que agrupe todo y se invalide entero cuando cambia cualquiera de sus partes (§6).

## 4. Subfases

Cada subfase: un commit (o pocos) subido a la rama, CI verde, evidencia en el documento de la subfase. No se empieza
la siguiente sin que la anterior cumpla su criterio de salida.

### S1-A · Inventario y contrato (sólo documentación + pruebas de lectura)
- Leer, sin modificar, las estructuras reales que guardan `bc3-budget-core`, `budget-cost-bridge` y el presupuesto
  (qué campos de procedencia existen de verdad).
- Escribir el contrato `rubik-sota.construction-dossier` 0.1.0 (§6) y la matriz de invalidación (§8).
- **Salida:** pruebas puras que cargan un BC3 sintético con el códec existente y comprueban qué procedencia sobrevive
  hasta la partida del presupuesto. Si un campo necesario no sobrevive → anotarlo; **no** parchear el motor.

### S1-B · Procedencia económica en el plan (código puro en `js/construction-*.js`)
- Adaptador puro que lee la procedencia del presupuesto y la adjunta al `budgetReport`/`costView` de FT3D-8.
- Niveles: una partida con precio de BC3 `unknown` nunca eleva el nivel de entrega por encima de `declared-plan`.
- **Salida:** pruebas negativas de §9 en verde; ningún cambio en `budget-core`, `bc3-budget-core`, códec ni puente.

### S1-C · Territorio en la entrega (código puro + laboratorio FT3D-8)
- Consultar `FloorPlanTerritoryExportPolicy.layer` antes de cualquier dibujo de parcela en vídeo/HTML de cliente.
- Si `canExport=false`: el vídeo y el documento muestran sólo el texto permitido y la atribución; el manifiesto lo
  registra (`territory.exported=false`, `reason`).
- **Salida:** prueba de navegador con una parcela `restricted` sintética que demuestra que el MP4 y el HTML no
  contienen su geometría (comparación de píxeles en la zona de parcela + búsqueda de coordenadas en el HTML).

### S1-D · Expediente versionado y aceptación
- `createDossier` congelado con huellas de cada parte; invalidación por la matriz de §8.
- **Salida:** invariantes de §10 en verde, tres suites Chromium en verde, CI verde tras el push, SHA entregado.

### Condiciones de interrupción (cualquiera detiene S1 y se informa)
- **I1** — S1 necesitaría modificar un archivo protegido (§11).
- **I2** — una API existente no expone un dato imprescindible (p. ej. la columna de precio aplicada).
- **I3** — un dato real de cliente aparecería en un test, artefacto o Blob.
- **I4** — una PR abierta (§12) cambia una API de la que depende S1 antes de que S1 termine.
- **I5** — la decisión P1 (economía de edificio) no está tomada y la subfase la necesita.

## 5. Decisiones del propietario (bloquean la subfase indicada)

| # | Pregunta | Recomendación | Bloquea |
|---|---|---|---|
| P1 | Edificio multiplanta: ¿un plan por planta, o un plan de edificio que reparta partidas de varios `bud_<projectId>`? | Plan de edificio con `budgetAllocations` que incluyan `budgetId`; total = suma por planta, sin presupuesto sintético | S1-B en edificios |
| P2 | Precio BC3 con licencia `unknown`: ¿puede aparecer en la entrega al cliente? | Sí, con la leyenda «precio de referencia aportado por el profesional; licencia no verificada» | S1-B entrega |
| P3 | Parcela catastral `restricted`: ¿sólo texto, o pedir al profesional una geometría propia (`user-entered`) para dibujar? | Sólo texto en S1; geometría propia en una fase posterior | S1-C |
| P4 | ¿BCCA entra en S1 o sólo `user-bc3`? | Ambos, porque comparten el mismo modo `user-supplied` y el mismo códec | S1-B |
| P5 | ¿S1 en esta rama o en una nueva (requiere tocar el disparador de la CI)? | Esta rama | inicio |

Estas cinco preguntas pueden coincidir con parte de las decisiones D1–D8 de la auditoría; si alguna ya está decidida
allí, prevalece la decisión del propietario.

## 6. Expediente versionado (`rubik-sota.construction-dossier` 0.1.0)

| Parte | Origen (autoridad) | Huella |
|---|---|---|
| Proyecto o edificio (incluye `site`/`building.site`, parcela y colocación) | editor / `FloorPlanBuilding` | `fingerprint` del adaptador FT3D-8 |
| Presupuesto(s) | `bud_<projectId>` por planta | SHA-256 del canónico |
| BC3/BCCA usados | archivo aportado (no se guarda) | `sha256` + `fileName` + `priceIndex` |
| Plan de obra | `FloorPlanConstructionSchedule.canonical` | SHA-256 |
| Vínculo plan↔proyecto | `createBinding` | SHA-256 |
| Marca | `FloorPlanBrand.snapshot` | SHA-256 |
| Política territorial | `FloorPlanTerritoryExportPolicy.layer` | resultado incluido literal |

La parcela **no** necesita un vínculo propio: ya viaja dentro de la huella del proyecto/edificio (puntos 23–24).
El BC3 nunca se incluye en el expediente: sólo su huella (cumple «nunca redistribuye»).

## 7. Límites de importación

| Entrada | Límite existente | Acción S1 |
|---|---|---|
| GML Catastro | 2 000 000 bytes, 32 parcelas, 4000 puntos, 64 polígonos, 128 anillos (`parcel-core`) | Reutilizar; no duplicar |
| BC3 | **ninguno en el códec** | Comprobar tamaño *antes* de llamar a `load` en el adaptador S1 (propuesta: 8 MB, a confirmar) sin tocar el códec |
| Plan/vínculo/presupuesto en texto | límites del importador FT3D-8 actual | Mantener |
| Publicación | 4 MB (`api/share.js`) | Mantener; el vídeo sigue dentro del HTML |

## 8. Matriz de invalidación del expediente

| Cambia… | Plan | Vínculo | Costes en entrega | Territorio en entrega | Manifiesto |
|---|---|---|---|---|---|
| Geometría del proyecto | válido | `obsolete` | revisar | revisar | **inválido** |
| `site.parcel` o colocación | válido | `obsolete` | — | revisar | **inválido** |
| Presupuesto (partida, precio, cantidad) | válido | — | `obsolete` | — | **inválido** |
| BC3 distinto (otra huella o columna) | válido | — | `obsolete` | — | **inválido** |
| Plan (fechas, dependencias, repartos) | — | revisar | revisar | — | **inválido** |
| Marca | — | — | — | — | **inválido** |
| Licencia de una fuente | — | — | revisar | recalcular `canExport` | **inválido** |

Regla: nunca se recalcula en silencio; se marca y se pide regenerar.

## 9. Pruebas negativas mínimas

1. BC3 mayor que el límite → rechazo antes de parsear.
2. BC3 malformado → mensaje del códec, sin estado parcial.
3. Partida con unidad distinta a la referencia → no se aplica (regla de `bc3-budget-core`).
4. Precio `unknown` → la entrega nunca supera `declared-plan`.
5. Parcela `restricted` → `canExport=false`, ni geometría ni coordenadas en MP4/HTML.
6. Parcela `verified` sin atribución → `missing-attribution`, no exportable.
7. Cambio de una sola cifra en el presupuesto → manifiesto inválido.
8. Plan de otro proyecto → `rejected` (`schedule-other-project`).
9. Edificio sin decisión P1 → costes `level-budget-not-building`, sin total inventado.
10. Publicación en pruebas → sólo mocks; ningún `fetch` real a `/api/share`.

## 10. Invariantes de aceptación

- No hay ningún parser BC3/GML ni transformación de coordenadas nuevos (`grep` en los archivos de S1).
- Ningún archivo protegido aparece en `git diff 0f9c6ea..HEAD --stat` (salvo P5-b: el workflow de FT3D-8).
- `accredited` nunca se alcanza; `approval-not-authenticated` sigue presente.
- Todo importe mostrado tiene procedencia o la etiqueta «procedencia desconocida».
- Ningún fixture contiene datos reales de cliente ni BC3 comerciales (sólo sintéticos generados en la prueba).

## 11. Archivos

**Permitidos:** `js/construction-*.js`, `labs/ft3d-8/**`, `tests/construction-*.test.cjs`, `tests/ft3d-8-*.cjs`,
`docs/product/ft3d-8-*.md`, `.github/workflows/ft3d-8v-schedule-core.yml` (sólo si P5-b).

**Protegidos (no se modifican):** `index.html`, visor 3D compartido, `budget-core.js`, `budget-draft-core.js`,
`quantity-core.js`, `quantity-schedule-core.js`, `project-core`, `building-core`, `bc3-budget-core.js`,
`fiebdc3-codec.js`, `cost-provider*.js`, `budget-cost-bridge.js`, `catastro-parcel-provider.js`, `parcel-core.js`,
`territory-*.js`, `api/*`, Entregas y todo lo de las PR de §12.

## 12. Coordinación con PR abiertas (archivos revisados: primeros 60 de cada PR)

| PR | Toca | Riesgo para S1 |
|---|---|---|
| Juanmaes83/floorplan-3d#166 (Delivery 3D Client) | **`api/share.js` (modificado)**, añade `api/delivery.js`, `api/unshare.js`, `js/delivery-*.js`, `index.html`, `client-share-ui.js`, `share-link-ui.js` | **Alto**: la publicación FT3D-8 usa `api/share.js` y `/api/view`. Si #166 cambia cabeceras o límites, la publicación de S1 debe reverificarse (I4). S1 no toca `api/*`. |
| Juanmaes83/floorplan-3d#168 (Section → Spatial Visit) | `index.html`, `presentation-story-core.js`, `presentation-ui.js` | Bajo: S1 no usa la presentación |
| Juanmaes83/floorplan-3d#169 (F03 fachadas) | `assets/materials/catalog.json`, workflows VQ-01 | Medio: si cambian colores/materiales de fachada, la fidelidad del laboratorio FT3D-8 (`VIEWER_DEFAULTS`) puede desviarse; volver a medir IoU |
| Juanmaes83/floorplan-3d#167 (Hero Fidelity V2) | **[sin verificar]** | Revisar antes de S1-C |
| Juanmaes83/floorplan-3d#149 (BC3-C3) | **[sin verificar]** si su contenido ya está en master (`bc3-budget-core.js` llegó a master en `de75f30`) | Confirmar que no hay una versión distinta pendiente |

## 13. Qué no se ha verificado

- Contenido completo de las PR #166–#169 más allá de los primeros 60 archivos, y de #167 y #149.
- Si `budget-core` guarda hoy el `priceIndex` y la huella del BC3 aplicados (lo comprueba S1-A).
- El límite de 8 MB propuesto para BC3 (sin medición de BC3 reales; sólo propuesta).

---
**Estado:** especificación preparada. Ningún código modificado. S1 sigue sin autorizar; requiere las decisiones P1–P5.
