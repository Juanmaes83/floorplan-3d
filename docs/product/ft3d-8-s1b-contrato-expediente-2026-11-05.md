# FT3D-8 · S1-B — Contrato del expediente de obra vinculado

**Contrato:** `rubik-sota.construction-dossier` **0.1.0** (paquete) y `rubik-sota.construction-dossier-evaluation`
**0.1.0** (resultado de solo lectura). **Implementación:** `js/construction-dossier-core.js` (S1-C).
No modifica ningún esquema canónico de RUBIK: el paquete **contiene** los documentos reales sin alterarlos y añade
solo identidad, selección, asociaciones explícitas y huellas.

> Nombre: el editor ya tiene un «dossier profesional» imprimible (`js/project-dossier-ui.js`). Este contrato es
> distinto: es el **expediente de obra FT3D-8**, que demuestra la correspondencia entre las autoridades y no genera
> ningún documento imprimible.

## 1. Paquete `rubik-sota.construction-dossier` 0.1.0

```json
{
  "schema": "rubik-sota.construction-dossier",
  "schemaVersion": "0.1.0",
  "id": "dos_<16 hex de la huella de parts>",
  "assembledAt": "2026-11-05T10:00:00.000Z",
  "route": "local-package",
  "subject": {"type": "project | building", "id": "<project.id | building.id>"},
  "selection": {"budgetIds": ["bud_…"], "scheduleId": "sch_… | null"},
  "parts": {
    "project": "<FloorPlanProjectV1 | FloorPlanBuildingV1, tal cual>",
    "budgets": ["<FloorPlanBudget 1.0.0 | 1.1.0, tal cual>"],
    "schedule": "<plan FT3D-8 0.1.0 | 0.2.0 | null>",
    "binding": "<rubik-sota.construction-binding 0.1.0 | null>",
    "parcelEvidence": {"format": "gml", "fileName": "…", "sha256": "…", "reference": "14 caracteres",
                        "associatedWith": {"type": "…", "id": "…"}},
    "brand": {"snapshot": "<FloorPlanBrand.snapshot>", "appliesTo": {"type": "…", "id": "…"}}
  },
  "fingerprints": {"project": "…", "geometry": "…", "site": "… | null", "budgets": {"bud_…": "…"},
                    "schedule": "… | null", "binding": "… | null", "brand": "… | null"},
  "fingerprint": "<SHA-256 del paquete sin este campo>"
}
```

Reglas:
- `id` **se deriva** de la huella de `parts`: no se inventa ningún identificador de revisión.
- `parcelEvidence` guarda la **huella** del GML, no su texto: un GML de Catastro (`restricted`) no se redistribuye
  dentro del paquete. Para volver a comprobar la parcela hay que volver a cargar el GML; si no se carga, la evidencia
  queda `registered-not-loaded`. La geometría guardada de la parcela viaja dentro del proyecto (`site.parcel`), que es
  lo que el propio RUBIK exporta.
- `brand.appliesTo` registra a qué sujeto asoció el profesional la marca. `FloorPlanBrand` no guarda identidad de
  proyecto, así que la asociación solo puede declararse aquí.
- Al abrir un paquete se recalculan todas las huellas. Si alguna no coincide con la declarada, el expediente queda
  `altered` (error `dossier-altered`) y no se usa para entregar.
- Límites (justificados en §8): paquete ≤ 8 MiB, profundidad JSON ≤ 64, GML ≤ 2 000 000 bytes.

## 2. Entrada directa (sin paquete)

`evaluate({project, budgets, selectedBudgetIds, schedule, binding, parcelDocument, brand, package})` acepta los mismos
documentos cargados por separado. El laboratorio puede **ensamblar** un paquete con ellos (`assemble`) para que el
profesional lo guarde y lo vuelva a abrir.

## 3. Jerarquía de autoridades (precedencia por dato)

| Dato | Única autoridad | Lo que S1 **nunca** hace |
|---|---|---|
| Geometría | modelo RUBIK (`FloorPlanCore.geometry`, `FloorPlanBuilding`) | dibujar elementos que el modelo no tiene |
| Cantidad | motor de mediciones, a través de la partida C1–C4 | medir |
| Precio, impuesto, totales | presupuesto seleccionado (`FloorPlanBudget.calculateBudget`) | sumar o calcular fuera del motor |
| Reparto entre tareas | plan FT3D-8 (`budgetAllocations`) | repartir una partida sin un porcentaje explícito |
| Fecha, dependencia | plan FT3D-8 | deducir fechas de superficies, cantidades o precios |
| Parcela | `site.parcel` guardado en el proyecto o en `building.site` | colocar una parcela que solo llega como GML |
| Colocación y norte | `site.buildingPlacement`, `site.northOffsetDeg` | proponer una colocación por proximidad o por nombre |
| Evidencia de parcela | GML cargado y asociado explícitamente | sustituir con él la parcela guardada |
| Marca | instantánea `FloorPlanBrand.snapshot` asociada al sujeto | crear un perfil |
| Revisión aprobada | vínculo (`construction-binding`), como declaración | tratarla como autenticación |

**Conflicto:** cuando dos fuentes afirman cosas distintas sobre el mismo dato (por ejemplo, la referencia de
`site.parcel` y la del GML), se genera `conflicts[]` con los dos valores, `resolution:'none'`, y **ninguno de los dos**
se usa para lo que está en disputa. Nada se sobrescribe.

## 4. Comprobación de identidad: cinco resultados posibles

`correspondence[]` registra cada par comprobado con uno de estos resultados:

| Resultado | Significado | Ejemplo |
|---|---|---|
| `match` | Coincidencia verificable por ID y, si es posible, por huella | presupuesto `subject.id` = `project.id` |
| `mismatch` | Incompatibilidad: no se usa | plan de otra vivienda con tareas que se llaman igual |
| `obsolete` | Identidad correcta, pero revisión distinta de la registrada | plan aprobado sobre otra huella del proyecto |
| `absent` | Falta el documento o el dato | sin plan, sin parcela |
| `unverifiable` | No hay información suficiente para comparar | revisión del proyecto en el presupuesto (C1–C4 no la guarda) |

`unverifiable` **nunca cuenta como coincidencia**. Rechazos obligatorios: presupuesto de otro proyecto
(`budget-other-project`); presupuesto de planta usado como total de edificio (`level-budget-not-building`); plan de otra
vivienda (`schedule-other-project`); plan obsoleto (`schedule-project-revision-obsolete`); parcela asociada a otro
proyecto (`parcel-other-project`); referencia de parcela distinta (`parcel-reference-mismatch`); elemento inexistente
(`link-unknown-element`); revisión distinta del vínculo (`*-revision-obsolete`); marca de otro proyecto
(`brand-other-project`); varios presupuestos del mismo proyecto sin selección explícita (`budget-selection-required`).

## 5. Presupuesto de edificio (problema prioritario)

| Opción | S1 | Comportamiento |
|---|---|---|
| 1. Un presupuesto de planta, identificado | **Sí** | «Presupuesto de la planta baja (prj_…)»; sin reparto entre las tareas del edificio |
| 2. Varios presupuestos de planta, sin sumar | **Sí** | Se muestra cada uno con sus totales de `calculateBudget` (neto/IVA/total y si están completos); **no hay total del edificio** |
| 3. Agregación | **No** (requiere aprobación) | Diseño propuesto: un presupuesto `subject.type:'building'` producido por Presupuestar, con partidas comunes declaradas una sola vez, IVA por partida, revisión por planta y regla de no duplicación por `itemId`+nivel |

El esquema C1–C4 **ya admite** `subject.type:'building'`, aunque ningún componente lo produce. Si llega uno
cuyo `subject.id` es el del edificio, se trata como presupuesto del edificio (identidad verificable), con el aviso de
que no lo produjo Presupuestar.

## 6. Distribución y coberturas económicas

Reutiliza FT3D-8 0.2.0 sin cambios: porcentajes explícitos, ≤ 100 % por partida, restante pendiente, céntimos por
restos mayores sobre el neto de C1–C4, `null` desconocido y partidas agrupadas sin reparto a elementos. El expediente
añade:

- **Procedencia por partida** (`provenance[]`): `priceSource` y `priceReference` copiados del documento
  (`providerId`, `code`, `edition`, `region`, `licenseStatus`, `attribution`, `asOf`), más `review.status`. Una partida
  BC3 conserva su `providerId` (`user-bc3`, `bcca-es`) y su código.
- **Tipos de importe**: el reparto entre tareas es **neto**; el IVA y el total se muestran solo a nivel de presupuesto
  (`totals.tax`, `totals.gross`) y con su indicación de completitud. No hay descuentos en C1–C4 (`discounts:'not-in-contract'`).
- Las tres coberturas de FT3D-8 se conservan separadas: partidas cargadas, alcance presupuestado y geometría.

## 7. Territorio y CRS

`territory` se calcula con las autoridades existentes:

1. `parcel`: `site.parcel` del proyecto (o `building.site.parcel`), validado por `FloorPlanParcelSiteAdapter.fromSiteParcel`.
2. `evidence`: GML cargado → `FloorPlanCatastroParcel.provider.getParcel({mode:'document',text})` →
   `FloorPlanParcelSiteAdapter.toSiteParcel`. Debe estar asociado explícitamente al sujeto; si no, conflicto.
3. `placement`: si hay `buildingPlacement`, `FloorPlanTerritoryIntegration.validate(site)` y comprobaciones numéricas:
   `modelToParcel(modelAnchor) = parcelLocalAnchor` (tolerancia 0,001 mm), ida y vuelta modelo→parcela→modelo
   (tolerancia 0,001 mm), ancla en coordenadas del CRS de origen con `localToSource`, y si el ancla cae dentro de la
   parcela. Las tolerancias cubren solo el redondeo de coma flotante: las transformaciones son rotaciones y
   traslaciones exactas.
4. Sin colocación: `not-placed`. Nunca se propone una.

## 8. Límites de importación (derivados de contratos reales)

| Entrada | Límite | Origen |
|---|---|---|
| GML | 2 000 000 bytes, 32 parcelas, 4000 puntos | `FloorPlanParcelCore.LIMITS` |
| Logo de marca | 300 KiB | `FloorPlanBrand.LOGO_MAX_BYTES` |
| Paquete JSON | 8 MiB | Un edificio de 2 plantas en el límite de `building-core` (`LIMITS.levels=2`), con presupuestos y plan, mide menos de 1 MiB en los fixtures; las imágenes de origen no viajan en JSON (se exportan en ZIP). 8 MiB deja un margen ×8 y evita bloquear el hilo principal con `JSON.parse` |
| Proyecto, presupuesto, plan y vínculo por separado | 8 MiB cada uno | Ídem |
| Profundidad JSON | 64 | Los contratos tienen menos de 12 niveles; protege frente a estructuras patológicas |
| Tipo real | primer carácter `{` (JSON) o `<` (GML); la extensión no basta | — |

## 9. Matriz de invalidación

Se compara la evaluación anterior con la nueva (`invalidation(prev, next)`). Las huellas son por aspecto: `geometry`
(la misma que usa el editor, `FloorPlanGuide.revision`, cifrada con SHA-256), `project` (documento completo), `site`,
cada presupuesto, `schedule`, `binding` y `brand`.

| Cambia | Vínculos plan↔elemento | Costes | Territorio | Entrega preparada | Entregas ya descargadas |
|---|---|---|---|---|---|
| Un muro o un hueco | recomprobados (`link-unknown-element` si desaparece) | se mantienen (el presupuesto no cambió) y la revisión del plan pasa a `obsolete` | colocación recomprobada | **inválida** | se conservan |
| La planta o el edificio (`project`) | recomprobados | recomprobados | recomprobado | **inválida** | se conservan |
| Solo el nombre | sin cambio (`geometry` igual) | sin cambio | sin cambio | **inválida** (el título cambia) | se conservan |
| El presupuesto o una partida | — | `budget-revision-obsolete` | — | **inválida** | se conservan |
| Una fecha o una dependencia | `schedule-revision-obsolete` | recalculados | — | **inválida** | se conservan |
| La parcela | — | — | recomprobado (RUBIK ya borra la colocación) | **inválida** | se conservan |
| La colocación | — | — | recomprobada | **inválida** | se conservan |
| La marca | — | — | — | **inválida** | se conservan |
| El contenido de la entrega (título, vídeo) | — | — | — | se crea una entrega nueva con otro `dlv_` | se conservan |

Una entrega descargada nunca se reescribe: el manifiesto está congelado y el laboratorio mantiene un historial de
solo lectura con `dlv_`, `dos_` y fecha.

## 10. Estados de revisión

Se reutilizan los niveles FT3D-8: `internal`, `orientative`, `declared-plan` y `evidenced-plan`. `accredited` sigue
reservado y no se alcanza (`approval-not-authenticated`). No hay etiqueta «certificado». Un `review.by` o un
`reviewedBy` en JSON es una declaración. Lo planificado nunca se presenta como ejecutado. El expediente añade su
propio bloqueo: cualquier `mismatch`, conflicto o `altered` deja la entrega en `internal`.

## 11. Privacidad y exportación por canal

| Canal | Incluye | Excluye |
|---|---|---|
| Vista interna (laboratorio) | todo, con la parcela visible si `canDisplay` | nada se envía |
| Paquete local | proyecto, presupuestos, plan, vínculo, marca y la **huella** del GML | texto del GML; rásteres de terreno y ortofoto |
| Captura (CI) | solo fixtures sintéticos | datos de clientes |
| Vídeo | modelo, fases y costes según la política de costes | geometría de parcela no exportable, ortofoto y terreno |
| HTML descargable | manifiesto, vídeo, referencia catastral como texto y atribución | documentos editables, geometría de parcela `restricted`/`unknown` |
| Enlace público futuro | lo mismo que el HTML | todo lo que no permita la política; **no se activa en S1** |

## 12. Compatibilidad

Lee proyectos 1.0–1.12, edificios 1.0–1.5, presupuestos 1.0.0/1.1.0 (actualizados en memoria), planes 0.1.0/0.2.0,
vínculo 0.1.0 y manifiestos 0.1.0. Nunca reescribe un documento del profesional. Un paquete con una
`schemaVersion` desconocida se rechaza (`dossier-version-unsupported`); una versión futura menor se rechaza hasta
que se documente su migración.

## 13. Mensajes

Cada código tiene un mensaje comprensible (por ejemplo `budget-other-project` → «El presupuesto pertenece a otro
proyecto»; `planning-unavailable` → «Todavía no hay una planificación asociada»; `parcel-reference-mismatch` → «La
parcela necesita comprobarse: la referencia del archivo no es la del proyecto»). El código técnico se muestra en el
panel de diagnóstico profesional. La lista completa está en `MESSAGES` (`js/construction-dossier-core.js`).

**Gate B:** ninguna fuente sustituye a otra en silencio. Las discrepancias se convierten en `mismatch`, `obsolete` o
`conflicts[]`, y lo que falta en `absent` o `unverifiable`.
