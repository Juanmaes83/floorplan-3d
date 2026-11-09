# FT3D-8 · Misión M2 / S4 — M2-0: auditoría de integración y contrato único de identidad

Fecha: 2026-11-06 · Responsable: Claude Code 2 · **Pendiente de revisión del propietario.** Sin merge, sin Production y
sin publicación.

## 1. Referencias verificadas al empezar

| Referencia | SHA | Estado |
|---|---|---|
| `master` | `0f9c6ead9732901681498efec326d1ca92e42ffe` | Base de M2 |
| M1 S2+S3 `feat/ft3d-8-s2-s3-m1-2026-11-05` | `970ca54c2bf31a2dacf3f53694e8e477dfe5a90f` | CI verde (ejecución 4) |
| Gate D `feat/ft3d-8-ux4d-gate-d-2026-11-05` | `b12b9252fe1df5adb06cea5b17cde48642a893b2` | Aprobado visualmente (DEC-12) |
| Documento Maestro `docs/rubik-evolution-preparation-2026-11-04` | `2291e3c` | Borrador v1.1, leído completo |
| PR #166 Entregar (Claude original) | `cef06ff` | Abierta, borrador. No se toca |
| PR #167 visor (Kimi) | `fe876c1` | Abierta, borrador. No se toca |
| PR #169 materiales (Kimi) | `ce70f85` | Abierta, borrador. No se toca |
| PR #168, #170, #172 (Section / Hybrid) | — | Nuevas desde el encargo; fuera del alcance (Maestro §1.3) |

**Rama M2:** `feat/ft3d-8-m2-s4-integracion-2026-11-06`, creada desde `master@0f9c6ea`. Se fusionan en ella Gate D y M1,
ambas de Claude Code 2:
- las dos ramas parten exactamente de `0f9c6ea` y solo añaden archivos (cero conflictos);
- las ramas originales no se modifican.

## 2. Autoridades comprobadas en código (no en propuestas)

| Dominio | Autoridad real | API verificada | Persistencia real |
|---|---|---|---|
| Colección de proyectos | `FloorPlanLibrary` (`js/project-library.js`) | `load`, `all`, `list`, `activeId`, `project`, `building`, `activeLevelId`, `save`, `saveBuilding`, `open` | `localStorage['rubik-sota-project-library-v1']` `{version:1, activeId, entries[]}` |
| Proyecto 1.x / planta | `FloorPlanCore` + `project-schema.js` | `validate`, `id`, `updatedAt` | Dentro de la entrada (`entry.project`) |
| Edificio | `FloorPlanBuilding` | `validate`, `canonical`, `sha256`, `setProject`, `setSite` | Dentro de la entrada (`entry.building`, `activeLevelId`) |
| Guardado del editor | `index.html:1042` | Intercepta `STORE` → `library.save(project)` en cada cambio | El editor siempre deja la biblioteca al día |
| Cantidades | Motores 7A/7B (`quantity-core`, `surface-core`) vía `FloorPlanBudgetDraft` | `draft(project,{previous,tariff})` | Se recalculan; no se guardan |
| Precios, IVA, totales | C1–C4 `FloorPlanBudget` 1.1.0 | `calculateBudget`, `validateBudget`, `serializeBudget`, `parseBudget` | `localStorage['rubik-budget-v1'][project.id]` (un presupuesto por proyecto 1.x, es decir, **por planta**) |
| Presupuestar (UI) | `FloorPlanBudgetUI` (`js/budget-ui.js`) | `open`, `summary`, `current`, `budget` | Misma clave |
| Catálogos y referencias | M1 `FloorPlanCostCatalog` | `searchAll`, `compare`, `previewApply`, `apply`, `proposeEditionUpdate`, `managedStatus` | Ninguna propia (opera sobre el presupuesto) |
| Parcela y colocación | `site.parcel`, `site.buildingPlacement`, `site.northOffsetDeg` | `app.setSite` (proyecto) / `FloorPlanBuildingUI.site` (edificio) | Dentro del proyecto o de `building.site` |
| Consulta oficial | M1 `FloorPlanCatastroWfs` | `create().getParcel({mode:'reference'})`, `setZone` | — |
| UI de emplazamiento | `js/territory-ui.js` | Registro `Geo.createDefaultRegistry()`; ya tiene sección de referencia (`#territoryReference`) que se activa si un proveedor declara `parcelInputModes:['reference']` | Guarda con `app.setSite` (borra colocación, ortofoto y terreno al cambiar de parcela) |
| Plan y dependencias | `FloorPlanConstructionSchedule` 0.2.0 | `create`, `validate`, `canonical`, `stateAt`, `ganttRows`, `budgetReport`, `dependencyReport` | **No existía** persistencia (solo laboratorio) |
| Vínculo y fidelidad | `FloorPlanConstructionProject` | `inventory`, `elementKey`, `fingerprint`, `createBinding`, `evaluate({source,schedule,budget,binding})` | **No existía** persistencia |
| Expediente | `FloorPlanConstructionDossier` 0.1.0 | `evaluate`, `invalidation`, `aspects` | Paquete local (laboratorio) |
| Evolución y Gantt | Gate D (`labs/ft3d-8/fidelity-app.js`, `ux-shell.js`, `project-scene.js`, `gantt-view.js`) | `show(input, meta)` | — |
| Marca | `FloorPlanBrand` / `FloorPlanBrandUI` | `snapshot()` (perfil elegido «Firmar con» por proyecto) | Claves de `brand-core` |
| Entrega 4D | `FloorPlanConstructionDelivery` 0.2.0 + `construction-mp4-muxer` + `labs/ft3d-8/delivery-ui.js` | `createManifest`, `clientDocument`, `storyboard`, `moment` | Descarga local |
| Entregar (UI) | `js/professional-workspace-ui.js` (área `deliver`) | Tarjetas por grupos | — |

## 3. Contrato único de identidad (M2)

```text
Entrada de biblioteca  entry.id (metadato de colección; nunca identidad del sujeto)
 └─ Sujeto  {type: 'project' | 'building', id: project.id | building.id}
     ├─ revisión del sujeto   = SHA-256(canonical(documento))      (FloorPlanConstructionProject.fingerprint)
     ├─ revisión geométrica   = FloorPlanGuide.revision por planta (aspecto 'geometry' del expediente S1)
     ├─ planta activa         = entry.activeLevelId (edificio) | null
     ├─ presupuestos          = rubik-budget-v1[level.project.id]  (subject {type:'project', id})
     ├─ plan de obra          = registro M2  (schedule.projectRef = sujeto + revisión)
     │    ├─ tarea ↔ elementKey + rol      (inventario real del sujeto)
     │    └─ partida ↔ tarea + % explícito  (budgetAllocations del motor)
     ├─ parcela y colocación  = site del sujeto (proyecto o building.site)
     ├─ marca                 = FloorPlanBrandUI.snapshot() → copia congelada en cada entrega
     └─ entregas              = historial de solo lectura (dlv_, huellas, fecha)
```

**Reglas:**
1. **Nunca por nombre.** La identidad es `type + id`. Dos entradas con el mismo `project.id` (por ejemplo, el mismo
   archivo importado dos veces) se señalan como **identidad duplicada** y la evolución queda en `internal`.
2. **La clave del registro M2 es `entry.id | type:id`.** Sobrevive al cambio de nombre y no se confunde entre
   entradas.
3. **Resultados de correspondencia S1 sin cambios:** `match / mismatch / obsolete / absent / unverifiable`.
   `unverifiable` nunca equivale a `match`.
4. **Presupuesto y revisión del proyecto:** C1–C4 no guarda la revisión del proyecto (DEC-07 pendiente). Por eso
   la relación presupuesto↔revisión es `unverifiable`. No se presenta como coincidencia.
5. **Edificio y presupuesto:**
   - Los presupuestos son por planta.
   - Un plan de edificio (`projectRef.type:'building'`) no puede repartir partidas de planta. El motor exige el mismo
     sujeto, y DEC-06 no está aprobada.
   - Se muestran los presupuestos de cada planta por separado, **sin total del edificio**.

## 4. Matriz productor → consumidor → contrato → revisión → persistencia → prueba → responsable

| Dato | Productor | Consumidores M2 | Contrato | Revisión / huella | Persistencia | Prueba M2 | Responsable |
|---|---|---|---|---|---|---|---|
| Sujeto e identidad | Editor + biblioteca | Expediente, Plan, Evolución, Entregar | FloorPlanProjectV1 1.x / Building 1.x | SHA-256 canónico | Biblioteca | M2-QA-01, 06 | Editor/biblioteca (lectura) |
| Planta activa | Biblioteca | Plan (elementos), Presupuestar | `activeLevelId` | — | Biblioteca | M2-QA-06 | Editor |
| Cantidades | 7A/7B | Presupuesto | `budget-draft` | Por recálculo | — | Regresión C1–C4 | Economía |
| Presupuesto | C1–C4 | Plan (repartos), Evolución, Entregar | Budget 1.1.0 | Etiqueta `rev_` (M1 `revisionTag`) | `rubik-budget-v1` | M2-QA-03, 04 | Economía (lectura y escritura con confirmación) |
| Precio de referencia | M1 Catálogo + puente | Presupuesto | CostQuote → `priceSource`/`priceReference` | `rev_` antes/después | Presupuesto + historial M2 | M2-QA-03 | M1 (Claude Code 2) |
| Parcela | Catastro WFS / GML | Emplazamiento, expediente, Evolución, Entregar | `site.parcel` | Huella de `site` | Proyecto / edificio | M2-QA-02 | Territorio (lectura y escritura con `app.setSite`) |
| Colocación y norte | Profesional | Expediente, vídeo | `buildingPlacement`, `northOffsetDeg` | Huella de `site` | Proyecto / edificio | M2-QA-02 | Territorio |
| Plan de obra | Editor de plan M2 | Evolución, Entregar, Presupuestar | Schedule 0.2.0 | SHA-256 del plan | **Registro M2 nuevo** | M2-QA-04, 05 | Claude Code 2 |
| Vínculo revisado | Profesional («Revisar plan») | Evolución (obsolescencia) | construction-binding 0.1.0 | Huellas de proyecto, plan y presupuesto | Registro M2 | M2-QA-07 | Claude Code 2 |
| Evolución | Gate D | Profesional, vídeo | `show(input)` | Misma evaluación por día | — | M2-QA-05 | Claude Code 2 |
| Marca | Mi estudio | Entrega | `FloorPlanBrand.snapshot` | Huella `brand` | Copia en la entrega | M2-QA-07, 08 | Mi estudio (lectura) |
| Entrega 4D | Gate D delivery | Cliente (descarga local) | Manifiesto 0.2.0 | `dlv_` y huellas | Historial M2 (metadatos); archivos descargados | M2-QA-07, 08 | Claude Code 2; publicación: Claude original (PR #166) |

## 5. Decisiones de arquitectura de M2

1. **Registro M2 (`rubik-construction-v1`).**
   - Sigue el patrón ya aprobado del presupuesto (decisión 7B: documento separado del proyecto).
   - Clave por `entry.id | type:id`.
   - Guarda el plan (Schedule 0.2.0), el vínculo revisado, el historial de cambios de precio por sujeto
     presupuestario y los metadatos de entregas.
   - **Nunca reescribe la geometría ni el presupuesto.**
   - Versión `0.1.0`. Rechaza versiones desconocidas y nunca migra en silencio.
2. **S2 en Presupuestar.**
   - El catálogo M1 opera sobre el **presupuesto auténtico** del proyecto abierto (`rubik-budget-v1`), mediante la
     propia `FloorPlanBudgetUI`.
   - Cada aplicación requiere confirmación. El historial de revisiones va al registro M2.
3. **S3 en Analizar.**
   - Se registra `catastro-inspire-wfs` en el registro territorial por defecto. La sección de referencia que ya
     existe en Emplazamiento se activa sola.
   - Se guarda en `site.parcel` con `app.setSite`, sin un segundo sistema de parcelas. Elegir el huso es explícito
     y opcional.
4. **Plan de obra.** Diálogo nuevo en Presupuestar sobre `FloorPlanConstructionSchedule`. Valida con el motor y nunca
   mueve fechas.
5. **Evolución.**
   - La experiencia Gate D pasa a ser una página de producto (`evolucion.html`) y lee el sujeto, el plan y el
     presupuesto de la biblioteca del mismo origen.
   - El laboratorio sigue disponible para QA, pero la app no depende de `labs/`.
6. **Entregar.**
   - Tipo «Evolución de obra» en el área Entregar, con la entrega guiada de Gate D.
   - Marca congelada y descarga local de MP4 y HTML. **Sin publicación remota.**

## 6. Archivos compartidos: qué se toca y cómo

Todo cambio en archivos compartidos es **aditivo**, va en la rama M2 y queda pendiente de revisión de su
responsable. No se toca ninguna rama ajena.

| Archivo | Cambio previsto | Motivo | Coordinación |
|---|---|---|---|
| `index.html` | Etiquetas `<script>` de los módulos M2 | Sin esto nada existe en la app | Responsable editor: pendiente de revisión |
| `js/budget-ui.js` | `commit(budget)` y un gancho por partida (vínculos) | Escribir el presupuesto real sin duplicar su guardado; navegación partida→tareas | Responsable Presupuestar: pendiente |
| `js/geo-provider.js` | Añadir `catastro-inspire-wfs` a `createDefaultRegistry` (mismo patrón que los demás) | Activar la sección de referencia existente | Territorio: pendiente |
| `js/professional-workspace-ui.js` | Tarjetas «Plan de obra», «Precios de referencia», «Evolución de obra» | Puntos de entrada en las áreas reales | Responsable workspace: pendiente |
| `tests/geo-provider.test.cjs` | La lista del registro por defecto incluye el nuevo proveedor | Consecuencia directa | Territorio: pendiente |

**No se toca:** `budget-core.js` (DEC-06/07), `api/share.js` y `api/view.js` (PR #166), visor y mallas (Kimi),
`brand-core.js`.

## 7. Decisiones que M2 no toma (bloqueos registrados)

| Decisión | Impacto exacto en M2 | Qué se entrega mientras tanto |
|---|---|---|
| A. Presupuesto global de edificio (DEC-06) | Un plan de edificio no reparte importes. Sin total de edificio | Presupuestos por planta mostrados por separado, con aviso |
| B. Revisión del sujeto en el presupuesto (DEC-07) | Presupuesto↔revisión `unverifiable` | Etiqueta `rev_` del presupuesto en el registro M2, sin tocar el esquema |
| C. Contrato de mallas de Kimi | Evolución usa la escena Gate D (inventario del proyecto guardado) | Requisitos de interfaz documentados; sin copiar su visor |
| D. Entregar / PR #166 | No se integra con su publicación ni con `api/` | Tipo «Evolución de obra» con descarga local |
| E. BCCA gestionada | `managedStatus().enabled:false` | BC3 aportado operativo |
| F. Publicación de clientes | Desactivada | Solo descarga local |

## 8. Plan de pruebas M2

| ID | Prueba automatizada (Chromium) | Proyecto sintético |
|---|---|---|
| M2-QA-01 | Biblioteca → Analizar → Presupuestar → Evolución: mismo `type:id`, revisión y planta | Vivienda A (biblioteca sembrada) |
| M2-QA-02 | Referencia (servicio oficial interceptado) → asociar → colocar → recargar | Vivienda A |
| M2-QA-03 | BC3 sintético → aplicar con confirmación → recargar → mismo precio en Presupuestar y Plan | Vivienda A |
| M2-QA-04 | Una partida en 2 tareas (60/40) y 2 elementos; partida→tareas, tarea→partida; sin doble importe | Vivienda A |
| M2-QA-05 | Varios instantes con trabajos simultáneos: escena, Gantt, fecha, tarjeta y costes coherentes | Vivienda A |
| M2-QA-06 | A → B (modificar B) → A: sin contaminación de parcela, presupuesto, plan ni marca | Viviendas A y B, edificio de 2 plantas |
| M2-QA-07 | Cambiar muro, precio, fecha, parcela o marca → plan y entrega obsoletos; historial intacto | Vivienda A |
| M2-QA-08 | MP4 y HTML local con marca; sin capa restringida | Vivienda A |
| M2-QA-09 | Recorrido completo sin `labs/` ni JSON de conexión | Vivienda A |
| M2-QA-10 | 1280×720 … 1920×1080, zoom, móvil, teclado, movimiento reducido | Vivienda A |
