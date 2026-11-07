# FT3D-8 · M1-0 — Auditoría y contrato de S2 (BCCA/BC3) y S3 (Catastro directo)

Fecha: 2026-11-05 · Rama `feat/ft3d-8-s2-s3-m1-2026-11-05` · Base **`master@0f9c6ea`** (verificada: HEAD remoto de
master sin cambios desde el encargo).

## 1. Base y ramas
| Referencia | HEAD observado | Uso en M1 |
|---|---|---|
| `master` | `0f9c6ea` | Base de M1. Contiene todos los motores S2/S3 (C1–C4, BC3, BCCA, Catastro, territorio). |
| Gate D `feat/ft3d-8-ux4d-gate-d-2026-11-05` | `b12b925` | **No se mezcla.** FT3D-8 (`construction-*`, lab) no está en master. M1 no depende de él. |
| Documental `docs/rubik-evolution-preparation-2026-11-04` | `9c89bb7` | Documento Maestro v1.1 leído (618 líneas). |
| PR #166 (Entregar) y ramas de Kimi | — | No se tocan. |

## 2. Autoridades reales (APIs leídas en código, no supuestas)
### S2
| Autoridad | Archivo | API real | Estado |
|---|---|---|---|
| Contrato de proveedores de coste | `js/cost-provider.js` (1.0.0) | `inspectProvider`, `validateQuote`, `createRegistry` (`search`, `getItem`, `getPrice`); estados `available/not-found/unavailable/invalid/cancelled/unsupported`; licencias `not-applicable/unknown/verified/restricted` | Completo |
| BCCA | `js/cost-provider-bcca-es.js` | `create({datasetMode:'synthetic'\|'user-supplied'\|'rubik-managed', model, source, legalGate, currency})`; `getGateStatus()`; `rubik-managed` exige `VERIFIED` con evidencia y si no devuelve `legal-gate-not-verified`. Sin red. La búsqueda por categoría devuelve `category-filter-unavailable`. | Adaptador completo; **catálogo gestionado bloqueado** |
| BC3 aportado | `js/bc3-budget-core.js` (`FloorPlanBc3Budget`) | `load(bytes)`, `search(base,{text,unit})`, `quote(base,code,priceIndex)` → `user-bc3`, licencia `unknown`; `normUnit` solo normaliza la notación | Completo |
| Códec FIEBDC-3 | `js/fiebdc3-codec.js` | `parse`, `validate`, `serialize` | Completo |
| Precio manual (tarifa propia) | `js/cost-provider-manual.js` | `getPrice(itemId,{unitPrice,unit,label,…})` | Completo |
| Motor económico | `js/budget-core.js` (1.1.0; lee 1.0.0) | `calculateBudget`, `calculateItem`, `setManualPrice`, `markReviewed`, `serializeBudget`/`parseBudget`; `priceReference` con `source{label,asOf,edition,region,sourceUrl,attribution,licenseStatus,…}` | Autoridad única; **no se modifica** |
| Puente | `js/budget-cost-bridge.js` | `setPriceFromQuote` (unidad y moneda estrictas, revisión `unreviewed`), `setPriceReferenceFromQuote` (guarda la referencia sin cambiar el precio), `clearPriceReference` | Completo; **no se modifica** |
| Registro legal | `docs/legal/bcca-es-reuse-gate-2026-10-27.md` | Conclusión `UNKNOWN`, gestionado `DISABLED` | Se conserva; adenda nueva sin sobrescribir |

**Falta para S2:**
- consulta unificada multifuente con edición, región y familia;
- comparación sin aplicar;
- aplicación con consentimiento y registro del cambio;
- propuesta de actualización entre ediciones;
- estados en lenguaje natural;
- límites y caché;
- la interfaz.

### S3
| Autoridad | Archivo | API real | Estado |
|---|---|---|---|
| Contrato territorial | `js/geo-provider.js` (1.3.0) | `getParcel(providerId,{mode:'document'\|'reference'},{signal})`, motivos `…network-unavailable, cancelled`; `normalizeParcelSource` | **Prevé `reference`, pero ningún proveedor lo implementa** |
| Catastro GML | `js/catastro-parcel-provider.js` | `parseDocument(text, reference)` (INSPIRE CP 4.0/3.0, GML 3.2, sin DOCTYPE ni entidades), licencia `restricted` | Solo documento |
| Parcela | `js/parcel-core.js` | `normalizeReference` (14/18/20 → 14), `normalizeCrs` (25829/25830/25831/32628), `normalizeParcel`, `toLocalGeometry`, `LIMITS` | Completo |
| Persistencia | `js/parcel-site-adapter.js`, `js/project-schema.js` | `toSiteParcel`/`fromSiteParcel`; `site.parcel`, `buildingPlacement` (dependiente de `parcel` y `northOffsetDeg`) | Completo |
| Colocación | `js/territory-integration-core.js` | `validate`, `modelToParcel`/`parcelToModel` (tolerancia 0,001 mm), `sourceToLocal` | Completo |
| Exportación | `js/territory-export-policy.js` | `layer(source,available)` → `canExport` solo con `not-applicable` o `verified` más atribución | Completo |
| PNOA / MDT05 | `js/pnoa-orthophoto-provider.js`, `js/ign-mdt05-terrain-provider.js` | Proveedores opcionales | Completos |
| Interfaz del editor | `js/territory-ui.js`, `js/territory-placement-ui.js` | Diálogo del editor (archivo **compartido**) | **No se modifica** |

## 3. Servicio oficial de Catastro (verificado el 05/11/2026)
- **Servicio:** WFS INSPIRE de parcela catastral (CP) de la Dirección General del Catastro,
  `https://ovc.catastro.meh.es/INSPIRE/wfsCP.aspx`.
- **Fuentes:** página oficial de servicios INSPIRE (`catastro.hacienda.gob.es/webinspire/index.html`) y descripción
  oficial del servicio (`webinspire/documentos/inspire-cp-WFS.pdf`).
- **Consulta:** `service=wfs&version=2&request=getfeature&STOREDQUERIE_ID=GetParcel&refcat=<14>&srsname=EPSG::<código>`.
  `REFCAT` admite 14 posiciones (urbana y rústica). La respuesta es `CP:CadastralParcel` en GML 3.2, el mismo formato
  que ya lee `parseDocument`.
- **Condiciones oficiales:**
  - el acceso supone aceptar la licencia de cesión de la DGC;
  - cobertura del 95 % del territorio responsabilidad de la DGC (no incluye el País Vasco ni Navarra);
  - límite de 1 km² y 5.000 elementos.
- **Prueba desde el entorno de desarrollo:**
  - el host no estaba permitido; se añadió solo `ovc.catastro.meh.es` a la lista de hosts permitidos del entorno;
  - una consulta `GetParcel` con la referencia de ejemplo **publicada en la documentación oficial** (`3662001TF3136S`)
    y una `GetCapabilities` sin modificar recibieron **HTTP 400 en HTML** («No se puede procesar su petición»), con
    cabecera `Access-Control-Allow-Origin: *`;
  - no se han modificado cabeceras para eludir el control del servidor.
- **Conclusión:**
  - CORS abierto: el navegador puede llamar directamente, sin proxy;
  - **no hay respuesta oficial válida comprobada desde este entorno.**
  - La consulta directa se implementa contra el contrato publicado, trata la respuesta HTML o 400 como servicio no
    disponible y ofrece GML como alternativa.
  - Estado: **IMPLEMENTADO, NO VERIFICADO EN REMOTO**. No se declara «Catastro directo operativo».

## 4. Decisiones de implementación (sin cambios en archivos compartidos)
1. **S2: núcleo nuevo** `js/cost-catalog-core.js`. Orquesta los proveedores existentes y aplica cambios **solo**
   mediante `FloorPlanBudgetCostBridge`. No crea un motor de precios, un parser BC3 ni otro sistema de referencias.
2. **S3: proveedor nuevo** `js/catastro-wfs-provider.js` con modo `reference` y `network:'required'`. Reutiliza
   `parseDocument`, `parcel-core`, el contrato `GeoProvider` y `parcel-site-adapter`. Núcleo de asociación
   `js/parcel-association-core.js`: vincula la parcela al sujeto (proyecto y revisión), sustituye solo con
   confirmación y conserva la colocación salvo decisión explícita.
3. **Interfaz aislada** en `labs/m1-s2-s3/`, sobre Perla (`css/design-system.css`), preparada para que S4 la lleve a
   Presupuestar y Territorio. No modifica `index.html`, `budget-ui.js`, `territory-ui.js` ni
   `territory-placement-ui.js`.
4. **BCCA gestionado:** permanece **desactivado**. No hay ninguna operación de descarga, alojamiento o redistribución.
   Se añade una adenda legal fechada sin sobrescribir el registro de 27/10/2026.
5. **CI propia** para la rama M1. No modifica los workflows existentes.

## 5. Matriz de pruebas planificada
| QA | Suite | Requisitos |
|---|---|---|
| QA-05 parcial, `null`, unidades | `tests/cost-catalog-core.test.cjs` | S2-03, S2-05, S2-08 |
| QA-06 nueva edición sin sobrescritura | ídem | S2-04, S2-06 |
| QA-07 gestionado bloqueado y BC3 activo | ídem | S2-07 |
| QA-23 regresión C1–C4, BC3, BCCA | suites existentes (214 pruebas puras de base) | todos |
| QA-24 reabrir y versiones | ídem + `serialize`/`parse` | S2-06, S3-03 |
| QA-08 consulta y asociación | `tests/catastro-wfs-provider.test.cjs`, `tests/parcel-association-core.test.cjs` | S3-01…04 |
| QA-09 red, GML inválido, otra referencia | ídem | S3-05 |
| QA-10 cambio de proyecto o revisión | ídem | S3-03 |
| QA-17 exportación territorial | ídem + política existente | S3-06, S3-07 |
| Navegador | `tests/m1-s2-s3.browser.test.cjs` (Chromium; escritorio y móvil; teclado; sin peticiones externas inesperadas) | S2-08, S3-08 |
