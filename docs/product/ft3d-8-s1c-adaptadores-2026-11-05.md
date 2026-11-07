# FT3D-8 · S1-C — Adaptadores del expediente: funciones, entradas, salidas y pruebas

**Módulo nuevo:** `js/construction-dossier-core.js` (`FloorPlanConstructionDossier`), código puro UMD que funciona
igual en Node y en el navegador, sin DOM, sin red, sin almacenamiento y sin mutar las entradas. Su contrato es
[`ft3d-8-s1b-contrato-expediente-2026-11-05.md`](./ft3d-8-s1b-contrato-expediente-2026-11-05.md).
**Cambios en módulos FT3D-8 existentes:** `construction-project-adapter.js` (presupuesto con `subject.type:'building'`) y
`construction-delivery-core.js` (manifiesto 0.2.0). No se modificó ningún archivo protegido.

## 1. Dependencias: solo autoridades existentes

| Necesidad | Autoridad que se llama | Nunca se reimplementa |
|---|---|---|
| Validar proyecto o edificio, geometría, vínculos, coberturas, nivel | `FloorPlanConstructionProject.validateSource/evaluate` | geometría y reglas de rol |
| Importes y totales | `FloorPlanBudget.validateBudget/calculateBudget` | sumas, IVA y redondeos |
| Plan | `FloorPlanConstructionSchedule.canonical/parse` | fechas y dependencias |
| Revisión de geometría | `FloorPlanGuide.revision` (la del editor) | — |
| Huella SHA-256 canónica | `FloorPlanBuilding.canonical/sha256` | — |
| Parcela | `FloorPlanParcelSiteAdapter.fromSiteParcel/toSiteParcel`, `FloorPlanParcelCore.LIMITS` | GML, CRS |
| Colocación | `FloorPlanTerritoryIntegration.validate/modelToParcel/parcelToModel/localToSource/elevationToModel/rebaseForLevel` | transformaciones |
| Derechos de exportación | `FloorPlanTerritoryExportPolicy.layer` | licencias |
| Marca | `FloorPlanBrand.normalizeProfile`, `LOGO_MAX_BYTES` | perfiles |
| Lectura del GML (navegador) | `FloorPlanCatastroParcel.provider.getParcel({mode:'document'})` (inyectado) | parser GML |

## 2. Funciones

| Función | Entrada | Salida | Errores |
|---|---|---|---|
| `readJson(text,{maxBytes})` | texto | objeto | `import-too-large`, `import-not-json` (el primer carácter no es `{`), `import-malformed`, `import-too-deep` |
| `kindOf(doc)` | objeto | `dossier\|project\|building\|budget\|schedule\|binding\|brand\|null`, según `schema` (nunca según la extensión) | — |
| `checkGml(text)` | texto | texto | `import-too-large` (2 000 000 bytes), `import-not-gml` |
| `readParcelDocument(text,{provider,fileName,associatedWith})` | GML y proveedor | `{fileName, sha256, result, associatedWith}` | las de `checkGml` |
| `aspects(parts)` | documentos | huellas por aspecto: `project`, `geometry`, `site`, `budgets{id}`, `schedule`, `binding`, `brand`, `parcelEvidence` | — |
| `budgetView(budget)` | presupuesto | totales neto/IVA/total con su completitud y procedencia por partida, todo de `calculateBudget` | las del motor |
| `assemble(input)` | documentos | paquete `rubik-sota.construction-dossier` 0.1.0, sin el texto del GML | `project-invalid` |
| `openPackage(pkg)` | paquete | `{integrity:'verified'\|'altered', changed[], id, input}` | `import-unknown-kind`, `dossier-version-unsupported`, `import-malformed` |
| `evaluate(input)` | `{project, budgets, selectedBudgetIds, schedule, binding, parcelDocument, registeredParcel, brand, opened}` | evaluación congelada (§3) | nunca lanza por incompatibilidad: la informa |
| `invalidation(prev,next)` | dos evaluaciones | `{subjectChanged, changed[], invalidates{links,costs,territory,delivery}, history:'kept'}` | — |
| `human(code)` / `MESSAGES` | código | mensaje en castellano | — |

## 3. Salida de `evaluate`

- `dossier`: `id` (`dos_` + 16 hex derivados de las huellas), `route` (`local-documents` o `local-package`),
  `integrity`, `fingerprint`.
- `subject`: tipo, ID, nombre y plantas (`levelId` y `projectId`).
- `authorities`: `project`, `budget` (`scope` `project`/`building`/`level`/`levels-not-summed`/`none`, presupuestos
  `selected` con totales y procedencia), `schedule`, `binding` (obsolescencia), `territory` (parcela, evidencia,
  colocación con comprobaciones numéricas y capas) y `brand`.
- `correspondence[]`: `{authority, against, result ∈ match|mismatch|obsolete|absent|unverifiable, code, message}`.
- `conflicts[]`: `{code, message, values, resolution:'none'}`.
- `coverage`: las tres coberturas FT3D-8 (partidas cargadas, alcance y geometría).
- `usable`: `{model, timelapse, costs, territory, delivery, reasons}`.
- `delivery`: nivel FT3D-8. Cualquier error lo baja a `internal` con el bloqueo `dossier-errors`.
- `exportPolicy`: por canal (interno, paquete, captura, vídeo, HTML y enlace público, este desactivado).
- `issues[]`: `{severity, code, message (comprensible), technical, detail, origin}`.
- `model`: el modelo de presentación FT3D-8 que consumen el Gantt, el timelapse y la entrega **sin volver a
  evaluarlo**.

## 4. Laboratorio (S1-D) sobre los adaptadores

- `labs/ft3d-8/dossier-ui.js`: carga documentos con `readJson`/`kindOf`/`readParcelDocument` y el proveedor real;
  evalúa; entrega `evaluation.model` a `__ft3dFidelity.show(input, meta, model, evaluation)`.
- `labs/ft3d-8/fidelity-app.js`: `show` acepta un modelo ya evaluado (una sola evaluación por expediente).
- `labs/ft3d-8/delivery-ui.js`: marca del expediente, bloqueo por incompatibilidades, `dossier` en `createManifest` e
  historial de solo lectura.
- `labs/ft3d-8/dossier-fixtures.js`: expedientes sintéticos A–D construidos con los motores reales: parcelas `FX…`,
  colocación `user-entered`, presupuesto de la planta alta de B, marca y GML INSPIRE CP sintético.

## 5. Pruebas

| Suite | Pruebas | Qué cubre |
|---|---|---|
| `tests/construction-dossier-core.test.cjs` | 21 | Casos A–J, economía (C6), procedencia BC3, territorio numérico (C7), no mutación (C8), paquete e integridad, importaciones (C4), tamaño del paquete, marca, compatibilidad 1.0.0/0.1.0, cambio de expediente, mensajes |
| `tests/construction-project-adapter.test.cjs` | +1 (28) | presupuesto cuyo sujeto es el edificio |
| `tests/construction-delivery-core.test.cjs` | +1 (10) | manifiesto 0.2.0: identidad del expediente, territorio solo como texto, rechazo de expedientes incompatibles o de otro sujeto, lectura de 0.1.0 |
| `tests/ft3d-8-dossier.browser.test.cjs` | 6 (Chromium) | proveedor real de Catastro = sustituto de Node, escenarios A–J con capturas, cambio de proyecto mediante el input real de archivos, paquete de ida y vuelta, Gantt y timelapse, vídeo real ligado al expediente con historial, móvil |
| Regresión de autoridades añadida a la CI | 67 | `budget-core`, `bc3-budget`, `budget-cost-bridge`, `fiebdc3-codec`, `parcel-core`, `geo-site-adapter`, `territory-integration`, `guide` |

**Las pruebas detectan fallos reales:** al romper deliberadamente la regla de identidad del presupuesto falla el caso
E, y al aceptar una parcela sin parcela guardada como coincidente falla el caso G. Después se restauró el código.

**Tolerancias:** colocación 0,001 mm (las transformaciones son rotación y traslación exactas; solo se absorbe el
redondeo de coma flotante). Duración del vídeo: un fotograma (40 ms) en el archivo y 80 ms en el reproductor.
