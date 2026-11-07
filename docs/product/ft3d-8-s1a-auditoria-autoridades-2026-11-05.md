# FT3D-8 · S1-A — Auditoría de autoridades y recuperación de datos

**Rama:** `feat/ft3d-8-s1-real-project-integration-2026-11-05` · **base:** `e730974` (= `f78b5e3` + especificación S1, solo
documentación) · **master:** `0f9c6ea`, sin cambios · **fecha:** 2026-11-05.
Auditoría de lectura: no se modificó ningún motor ni interfaz compartida. Cada afirmación cita el archivo y la línea, o
la función que se inspeccionó.

## 0. Estado de partida verificado

| Comprobación | Resultado |
|---|---|
| ¿Existe ya una rama S1? | No: `git branch -r` no muestra ninguna rama `*s1*` antes de crear esta |
| Último SHA validado | `f78b5e3`: CI [#42046877070](https://github.com/Juanmaes83/floorplan-3d/actions/runs/42046877070) en verde (176 pruebas puras y 14 en Chromium) |
| Base elegida | `e730974`, hijo directo de `f78b5e3` que solo añade `docs/product/ft3d-8-s1-especificacion-verificada-2026-11-05.md`. Se elige para no perder la especificación verificada; el código es idéntico a `f78b5e3` |
| Disparo de la CI en S1 | **No ocurría:** el workflow solo se disparaba en la rama FT3D-8 y con una lista cerrada de rutas. Corregido en `3c82721` (rama S1 añadida y comodines). La rama original conserva su disparador |

## 1. Mapa de autoridades y consumidores

| Dato | Autoridad (productor) | API verificada | Consumidor FT3D-8 / S1 |
|---|---|---|---|
| Proyecto de una planta | `js/project-core.js` (`FloorPlanCore`) | `validate`, `geometry`, `setSite`, `load(storage,'rubik-sota-floorplan-project-v1')` | `construction-project-adapter.inventory` |
| Edificio y plantas | `js/building-core.js` (`FloorPlanBuilding`) | `SCHEMA='rubik-sota.floorplan-building'`; lector 1.0.0–1.5.0; `LIMITS.levels=2`; `setSite` | adaptador: claves `<levelId>/<id>` y forjado `<lvl>/slab` |
| Biblioteca local | `js/project-library.js` (`FloorPlanLibrary`) | `rubik-sota-project-library-v1` `{version:1, activeId, entries[]}`; una entrada es `{id,name,project}` o `{id,name,kind:'building',building,activeLevelId}` | **Ninguno en S1** (solo se usa a través de los archivos que exporta el editor; §3) |
| Revisión de la geometría | `js/guide-core.js` (`FloorPlanGuide.revision`) | `JSON.stringify([walls,openings,rooms,objects,materials,defaults,scale,sourceImages,measurements])`, usada por las revisiones del editor (`review-notes-ui.js:16`) | S1-C: huella `geometry` del expediente |
| Mediciones | `js/quantity-core.js` (`FloorPlanQuantities`), `js/quantity-schedule-core.js` | estados `measured/estimated/unavailable`; un dato no disponible es `null` | Ya las consume `FloorPlanBudgetDraft` → partidas |
| Presupuesto C1–C4 | `js/budget-core.js` (`FloorPlanBudget`) | `SCHEMA='rubik-sota.floorplan-budget'`, versiones `1.0.0`/`1.1.0`; `validateBudget`, `upgradeBudget`, `parseBudget`, `calculateBudget` | `construction-schedule-core.budgetReport` (importes **solo** a través de `calculateBudget`) |
| Presupuesto guardado | `js/budget-ui.js` | `rubik-budget-v1[app.project.id]` (línea 29); `current()` → `{budget,saved}`; exportación JSON `rubik-sota-presupuesto-<slug>.json` (línea 85) | S1: el JSON exportado es la entrada real |
| Precio de referencia | `js/cost-provider*.js`, `js/budget-cost-bridge.js`, `js/bc3-budget-core.js` | `priceSource` `manual{label,asOf}` o `provider-reference{providerId,itemId}`; `priceReference{providerId,itemId,code,description,unit,unitPrice,currency,priceKind:'reference',source{label,asOf,retrievedAt,edition,region,sourceUrl,attribution,licenseStatus,licenseName,licenseUrl}}` | S1-C: procedencia por partida, copiada sin reconstruirla |
| Plan de obra | `js/construction-schedule-core.js` (FT3D-8) | lector 0.1.0/0.2.0, `canonical`, `budgetReport` | Gantt, timelapse, entrega |
| Vínculo | `js/construction-project-adapter.js` | `rubik-sota.construction-binding` 0.1.0 | obsolescencia por autoridad |
| Parcela | `js/catastro-parcel-provider.js` + `js/parcel-core.js` + `js/parcel-site-adapter.js` | `provider.getParcel({mode:'document',text})` → `{status,parcel,provenance}`; `toSiteParcel`/`fromSiteParcel` | S1-C/D: candidata GML y parcela guardada |
| Colocación y norte | `js/territory-integration-core.js` | `validate`, `modelToParcel`, `parcelToModel`, `sourceToLocal`, `localToSource`, `elevationToModel`, `rebaseForLevel` | S1-C: comprobaciones numéricas |
| Política de exportación | `js/territory-export-policy.js` | `layer(source,available)` | S1-C: qué capas puede llevar cada canal |
| Marca | `js/brand-core.js` (`FloorPlanBrand`) | `normalizeProfile`, `snapshot(storage,entryId,projectName)`; `MAX_PROFILES=12`, `MAX_BYTES=300*1024` | entrega FT3D-8 (sin cambios) |
| Entrega | `js/construction-delivery-core.js` (FT3D-8) | manifiesto `rubik-sota.construction-delivery` 0.1.0 | S1-D: se ligará al expediente |
| Publicación | `api/share.js`, `api/view.js` | POST con token, 4 MB | Solo con mocks (sin cambios) |

## 2. Fuentes exactas y recorrido real en el editor

Biblioteca → entrada activa → proyecto (o planta activa de un edificio) → geometría → presupuesto → territorio →
plan → entrega:

1. `index.html:1039` carga `FloorPlanLibrary.load(storage, …)`. `index.html:1042` redirige la clave
   `rubik-sota-floorplan-project-v1` a `library.save(...)`: **guardar el proyecto escribe en la entrada activa**.
2. `index.html:1080-1095`: cada cambio confirmado pasa por `commit` → valida → `save()`. **Lo visible y lo guardado
   coinciden** salvo durante una edición en curso, cuando un guardado falla (aviso «Save failed») o cuando el edificio
   tiene una planta pendiente (`building-ui.js:334`, `pendingLevel`). S1 no puede observar esos estados: trabaja con
   archivos exportados, que son instantáneas de lo guardado.
3. En un edificio, el editor trabaja sobre el proyecto 1.x de la planta activa (`project-library.js`: `projectOf(e)`);
   el contenedor del edificio y `building.site` se guardan aparte.
4. El presupuesto se guarda **por el `id` del proyecto abierto** (`budget-ui.js:29,31`), es decir, por planta.
5. El territorio se guarda en `site` del proyecto o en `building.site`; las plantas no pueden llevar parcela
   (`building-core.js:130`).
6. El plan FT3D-8 **no tiene almacenamiento en RUBIK**: solo existe como documento (`serialize`/`parse`).
7. La entrega FT3D-8 existe solo en el laboratorio (manifiesto congelado + HTML descargado).

### Identidades que no deben confundirse

| Identidad | Dónde está | Riesgo |
|---|---|---|
| ID de entrada de biblioteca | `entries[].id` (`Core.id('prj')` para la semilla) | **No es el ID del proyecto**: una entrada y su `project.id` pueden diferir; no viajan en el JSON exportado |
| ID de proyecto | `project.id` | Sujeto del presupuesto y del plan |
| ID de edificio | `building.id` (`bld_…`) | Sujeto del plan de edificio |
| ID de planta | `building.levels[].id` (nivel) y `levels[].project.id` (proyecto de la planta) | El presupuesto apunta al **proyecto de la planta**, no al nivel |
| Revisión | No existe un ID de revisión canónico. Hay tres huellas: `FloorPlanGuide.revision` (geometría, usada por el editor), el `versionCode` FNV-1a de 32 bits de las revisiones y la SHA-256 canónica de FT3D-8 (documento completo) | S1 debe decir cuál compara en cada caso |
| Fecha | `updatedAt` (lo actualiza `commit`) | Una fecha no es una revisión: dos guardados del mismo milisegundo, o una importación, pueden coincidir |
| Snapshot de una entrega | manifiesto FT3D-8 (`fingerprint`, `dlv_…`) | Solo del laboratorio |

## 3. Almacenamiento entre dominios: dos rutas separadas

`localStorage` es por **origen**. Una Preview de Vercel (`floorplan-3d-<hash>-….vercel.app`) **no ve** la biblioteca,
los presupuestos, la marca ni el territorio del dominio de producción. Cualquier lectura de `localStorage` en la
Preview solo vería datos creados en esa misma Preview. Por eso:

| | Ruta S1 (autorizada y desarrollada) | Ruta futura (no desarrollada) |
|---|---|---|
| Entrada | Archivos que el editor real exporta (JSON de proyecto o edificio, JSON de presupuesto, GML de Catastro) más el plan y el vínculo FT3D-8, que se cargan localmente o se agrupan en un **paquete de expediente** | `FloorPlanLibrary` activa, `FloorPlanBudgetUI.current()`, `FloorPlanBrandUI.snapshot()` y `building.site` **del mismo origen que el editor** |
| Qué demuestra | Que los documentos corresponden al mismo sujeto (IDs + huellas), que cada uno pasa su validador real y que FT3D-8 usa exactamente esos documentos | Además, que es el proyecto **abierto ahora** y su presupuesto **guardado** |
| Qué no demuestra | Que el archivo sea la última versión guardada en el editor del profesional | — |
| Envío a servidores | Ninguno | Ninguno |
| Requisitos | Ninguno compartido | Cambios autorizados en `index.html`/Entregar (S4) |

S1 nunca llama «integración directa con RUBIK» a la ruta S1, y el laboratorio lo dice en pantalla.

## 4. Presupuesto C1–C4 (verificado en `budget-core.js`)

| Aspecto | Hecho |
|---|---|
| ID y sujeto | `id`, `subject{type:'project'\|'building', id}`. El **esquema admite `building`**, pero `budget-ui` solo escribe presupuestos para `app.project.id` (planta): no hay productor de presupuestos de edificio |
| Capítulos y partidas | `chapters[]{id,title,order}`, `items[]{id,chapterId\|null,description,quantity{value,unit,status,complete,…},wastePercent,unitPrice\|null,priceSource,priceReference(1.1),taxRatePercent?,review}` |
| Unidades | `UNITS` del motor; una referencia solo se acepta con la misma unidad (`validatePriceAndReview`) |
| Precio conocido frente a revisado | `unitPrice` puede existir con `review.status='unreviewed'`; «revisado» exige `reviewedAt`. Es una **declaración**, no una autenticación |
| Impuestos | `taxRatePercent` del presupuesto o de la partida; `calculateItem` → `subtotalNet`, `taxAmount`, `subtotalGross`; cada nivel tiene su `missingItemIds` |
| Descuentos | **No existen en el contrato C1–C4** (solo `wastePercent`). S1 no los inventa y lo comunica |
| Desconocidos | `null` en `unitPrice`, `quantity.value`, `taxRatePercent` → totales `complete:false` y `missingItemIds` |
| Repartos entre tareas | Solo en el plan FT3D-8 (`budgetAllocations`), calculados en céntimos sobre el **neto** de `calculateBudget` |
| Persistencia | `rubik-budget-v1` por `project.id`; exportación JSON y BC3 |
| Versiones | `1.0.0` se lee y se actualiza en memoria (`upgradeBudget`, con `priceReference:null`); `1.1.0` es la actual |
| Revisión del proyecto | **El presupuesto no guarda ninguna revisión del proyecto**: el emparejamiento presupuesto↔revisión solo puede declararse (vínculo) o verificarse por huella dentro del expediente |
| Partidas agrupadas | `FloorPlanBudgetDraft` genera partidas por tipo (`floor:<mat>`, `paint`, `opening:<kind>`…), no por muro: **no hay vínculo partida→elemento** en C1–C4 |

## 5. Planificación (FT3D-8 0.2.0, verificado)

`id`, `projectRef{type,id,revision}` (revisión = SHA-256 del proyecto), `review{status,by?,at?}`, tareas con fechas
ISO, `dependsOn` FS/SS/FF/SF con `lagDays`, `elements[{elementId,role}]`, `budgetAllocations[{itemId,sharePercent}]`.
El lector acepta 0.1.0 (que se actualiza en memoria) y guarda la forma 0.1.0 cuando se puede. Las fechas solo salen
del plan; `stateAt` no inventa fechas. La **persistencia** es solo por archivo: RUBIK no guarda planes.

## 6. Catastro y territorio (verificado)

| Dato | Persistido al reabrir | Runtime | No disponible |
|---|---|---|---|
| `site.parcel` (referencia de 14 caracteres, `sourceCrs` ∈ EPSG:25829/25830/25831/32628, `sourceGeometry` MultiPolygon, `frame{originX,originY,'m','east','north'}`, `source{providerId,type,attribution,license}`) | Sí (proyecto ≥ 1.9.0; edificio ≥ 1.2.0) | — | — |
| `northOffsetDeg` | Sí (es necesario para colocar) | — | — |
| `buildingPlacement{horizontal{modelAnchorMm,parcelLocalAnchorMm,source:user-entered},vertical{modelZeroElevationM,orthometric}}` | Sí (proyecto ≥ 1.12.0; edificio ≥ 1.5.0) | — | Nunca se calcula: solo `user-entered` |
| `site.orthophoto` (PNOA) | Metadatos de la petición | Píxeles (`FloorPlanTerritorySession`) | En entregas, salvo si la política lo permite |
| `site.terrain` (MDT05) | Metadatos | Malla | Ídem |
| Consulta WFS por referencia | — | — | **No existe** (`getParcel` con `mode:'reference'` → `unsupported`) |
| Topografía legal, cimentación, movimiento de tierras | — | — | No existen en RUBIK |

Al guardar una parcela nueva, `territory-ui.js:117` **borra** ortofoto, terreno y colocación: RUBIK ya invalida la
colocación cuando cambia la parcela. La parcela de Catastro llega con licencia `restricted` (`catastro-parcel-provider.js:88`),
y `territory-export-policy.layer` solo permite exportar `not-applicable` o `verified` con atribución: **una parcela
catastral no puede salir en un vídeo ni en un HTML de cliente**. La política permite mostrarla en pantalla
(`canDisplay:true`): mostrar no es redistribuir.

## 7. Agentes concurrentes (revisado con `git diff merge-base..rama`)

| Rama / PR | Archivos que S1 lee o usa | Riesgo |
|---|---|---|
| `feat/delivery-client-3d-experience-v1` · Juanmaes83/floorplan-3d#166 (Claude original) | `api/share.js` (+ `delivery`), `api/delivery.js`, `api/unshare.js` | Bajo: añade el tipo `delivery` y no cambia `html`/`mp4` ni el límite de 4 MB. S1 no toca `api/*` |
| `feat/visual-families-hero-fidelity-v2` · Juanmaes83/floorplan-3d#167 (Kimi) | ninguno | — |
| `feat/f03-facade-material-fidelity-v1` · Juanmaes83/floorplan-3d#169 | ninguno (`assets/materials/catalog.json`) | Bajo para S1 |
| `feat/section-spatial-visit-v1` · Juanmaes83/floorplan-3d#168 | ninguno | — |
| `feat/visual-families-next-f03-f04-f05-v1`, `feat/vq-01-material-fidelity-foundation` | ninguno | — |
| `feat/agent-ai-ag1-readonly-2026-11-05` (Asistente IA) | ninguno | Fuera de alcance |
| `docs/rubik-evolution-preparation-2026-11-04` (ChatGPT) | ninguno | Documentación de continuidad (leída) |

Propietarios: el editor, los motores y Entregar son de Claude original y del propietario; la fidelidad visual, de Kimi;
`js/construction-*` y `labs/ft3d-8/` son de FT3D-8 (esta línea de trabajo).

## 8. Qué se puede verificar y qué no

**Verificable en la ruta S1:** que cada documento pasa su validador real; la identidad por tipo+ID entre proyecto,
edificio, plantas, presupuesto, plan, vínculo y parcela; las huellas SHA-256 del contenido; la obsolescencia frente
a un vínculo; la coincidencia entre la referencia del GML y `site.parcel`; las transformaciones de colocación
(numéricas); la licencia y la atribución de cada capa; la procedencia de cada precio (tal como la guarda C1–C4).

**No verificable:** que un archivo sea la última versión guardada en el editor; la identidad de quien declara una
revisión (`reviewedBy`, `review.by`); que un presupuesto se hiciera sobre una revisión concreta del proyecto (C1–C4
no la guarda); la vigencia de un precio de referencia; los linderos legales; la obra ejecutada.

## 9. Riesgos de incompatibilidad

1. Presupuesto 1.0.0 frente a 1.1.0: debe leerse con `parseBudget` (actualiza en memoria) y nunca reescribirse.
2. Plan 0.1.0: `canonical` lo actualiza en memoria; el documento del profesional no se modifica.
3. Proyecto < 1.9 sin parcela, o < 1.12 sin colocación: es un estado legítimo (`not-available`), no un error.
4. Edificio: la parcela está en `building.site`; un JSON de planta exportado (`exportLevel`) no lleva parcela.
5. La huella completa del proyecto cambia al renombrarlo; la huella de geometría (`FloorPlanGuide.revision`) no. S1
   usa cada una para lo que corresponde (§ matriz de invalidación, S1-B).

## 10. Coordinación futura y decisiones pendientes

**Archivos que habría que tocar para la ruta futura (no se tocan en S1):** `index.html` (exponer el expediente del
proyecto activo), `js/budget-ui.js` (presupuesto de edificio o selección), `js/budget-core.js` (campo opcional de
revisión del proyecto en el presupuesto), Entregar (tipo «evolución de obra»), `js/brand-ui.js` (marca activa). Sus
responsables son Claude original y el propietario.

**Decisiones del propietario:**
- **D-S1-1:** presupuesto de edificio. S1 aplica las opciones 1 y 2: un presupuesto de planta identificado como tal, o
  varios presupuestos de planta mostrados **sin sumarlos**. La opción 3 (agregación) queda documentada para aprobación.
- **D-S1-2:** ¿añadir `subject.revision` al presupuesto C1–C4? Hace falta para pasar de «emparejamiento declarado» a
  «verificado por el motor».
- **D-S1-3:** BCCA con permisos comerciales declarados: S1 solo **muestra** la procedencia y la licencia guardadas en
  la partida; actualizar el registro legal queda para S2.
- **D-S1-4:** territorio en las entregas: con Catastro `restricted`, S1 solo exporta texto (referencia y atribución).

**Gate A:** ninguna vinculación de S1 depende de un contrato inexistente. Todo lo que usa S1-C está en los archivos
citados. Lo que no existe (presupuesto de edificio, revisión en el presupuesto, WFS, aprobación autenticada) se
trata como ausencia de dato, nunca como coincidencia.
