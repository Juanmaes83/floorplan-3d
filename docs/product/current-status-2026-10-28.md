# Estado canónico de producto — 28-10-2026

**Fuente de verdad de estado para agentes y revisiones.** Verificar siempre el HEAD real de `master` antes de ejecutar trabajo. Los documentos anteriores quedan como historia cuando contradigan este archivo o el repositorio.

## Base de este estado

Estado posterior al cierre funcional de **8C-E** y al merge de **PR #132 — integración territorial final**, squash `012fb1409f1e73f4ca3c088aea0bb8682bec3197`.

La auditoría final canónica de Punto 8 está en `docs/product/point-8-final-audit-2026-10-28.md`.

## Estado resumido

| Punto | Capacidad | Estado |
|---:|---|---|
| 1–6 | Construcción, medición, superficies, clasificación, ficha profesional, orientación/ubicación/solar/GeoProvider | **CERRADO** |
| 7 | Presupuesto de acabados/materiales | **CERRADO** — PR #120 |
| 8A | Fachada y exterior básico | **CERRADO** — PR #121 |
| 8B-A | Huella, cubierta plana, retranqueos y superficies expuestas | **CERRADO** — PR #124 |
| 8B-B | Petos declarados y volúmenes exteriores simples | **CERRADO** — PR #125 |
| 8B auditoría | Contención conservadora de huella / falsa certeza geométrica | **CERRADO** — PR #126 |
| 8B-C | Cubiertas inclinadas simples | **DIFERIDO POR ALCANCE** — no requerido para cerrar 8B |
| 8B | Cubierta y volúmenes exteriores | **CERRADO** |
| 8C-A | GeoProvider / contratos territoriales | **CERRADO** — PR #128, squash `f944088c315140d67cfadfbcd8db6350fd559a48` |
| 8C-B | Parcela, referencia y geometría territorial fuente | **CERRADO** — PR #129, squash `597014888fc80e7fafdfd011115e62113cafb0d0` |
| 8C-C | Ortofoto PNOA contextual | **CERRADO** — PR #130, squash `0adf6fa0cd3ca7cfcb2dd654eaaa7cef4e6adac0` |
| 8C-D | Terreno / elevación MDT05 contextual | **CERRADO** — PR #131, squash `9d5a9fe48198f3a90d931dd82f88f6a122d30157` |
| 8C-E | Integración edificio + parcela + ortofoto + terrain + orientación + Presentación/exportación | **CERRADO** — PR #132, squash `012fb1409f1e73f4ca3c088aea0bb8682bec3197` |
| 8C | Parcela, terreno y contexto territorial | **CERRADO** |
| 8 | Exterior + cubierta + contexto territorial | **CERRADO** — auditoría final `point-8-final-audit-2026-10-28.md` |
| 9 | Instalaciones ligeras | **APROBADO, SIGUIENTE** |

## Punto 8A — CERRADO

`FloorPlanExterior.derive(project)` aporta una lectura exterior conservadora sobre la autoridad existente de `FloorPlanProjectV1`: fachadas demostrables, huecos ligados a muros de fachada, materiales existentes y `terrace`/`balcony` únicamente cuando están declarados. No crea otro modelo del edificio ni cambia contratos territoriales.

Documento: `docs/product/point-8a-exterior-v1-2026-10-28.md`.

## Punto 8B — CERRADO

Documento de cierre: `docs/product/point-8b-closure-2026-10-28.md`.

El alcance cerrado incluye huella de cubierta demostrable, offset exterior por semigrosor, contención conservadora de estancias, cubierta plana, superficies `exposed-roof`, BuildingV1 como autoridad de niveles/offsets, petos explícitos y volúmenes exteriores simples. Los casos no demostrables degradan a `unavailable`/`invalid`; no se añadió CSG general, solver universal, inferencia estructural, normativa ni drenaje.

Las cubiertas inclinadas simples 8B-C permanecen diferidas por alcance y no bloquean el cierre de 8B.

## Punto 8C — CERRADO

8C extiende el contexto territorial sin convertir datos oficiales en geometría editable ni atribuirles una precisión que no demuestran.

### 8C-A — GeoProvider / contratos

PR #128 estableció `FloorPlanGeoProvider`, capacidades declaradas, provenance/licencia/atribución y registry no durable. Un proyecto conserva validez aunque falte un provider runtime.

Documento: `docs/product/point-8c-a-geo-provider-contracts-2026-10-28.md`.

### 8C-B — parcela / geometría territorial fuente

PR #129 añadió `site.parcel`, importación GML INSPIRE CP, CRS territorial demostrado, `sourceGeometry` separada de cualquier geometría editable y `parcel.frame` como marco local común. No afirma lindero legal certificado ni posición del edificio.

Documento: `docs/product/point-8c-b-parcel-source-geometry-2026-10-28.md`.

### 8C-C — ortofoto / contexto

PR #130 añadió ortofoto PNOA mediante WMS, carga explícita, raster sólo runtime y `site.orthophoto` como snapshot durable. No hay auto-fetch al abrir; `retrievedAt` no se presenta como fecha de vuelo.

Documento: `docs/product/point-8c-c-orthophoto-context-2026-10-28.md`.

### 8C-D — terreno / elevación

PR #131 añadió MDT05 mediante WCS, `GeoProvider.getTerrain`, TerrainGrid runtime, consulta contextual de cotas y superficie derivada determinista. ProjectV1 1.11.0 y BuildingV1 1.4.0 persisten sólo metadata; grid/respuesta/mesh no se persisten. 5 m es paso de malla, no precisión.

Documento: `docs/product/point-8c-d-terrain-elevation-2026-10-28.md`.

### 8C-E — integración territorial final

PR #132 cierra la integración mediante:

- `site.buildingPlacement` explícito — ProjectV1 1.12.0 / BuildingV1 1.5.0;
- `northOffsetDeg` como única autoridad de orientación;
- una única cadena CRS fuente → `parcel.frame` → parcel-local → placement+norte → marco del modelo → renderer;
- rebase de placement en `exportLevel` para conservar posición física;
- parcela, ortofoto, terrain y norte como grupo de contexto sin transformar el edificio histórico;
- cota vertical explícita, nunca inferida automáticamente del MDT;
- runtime territorial no durable y cero auto-fetch;
- integración de contexto en Presentación sin cambiar stops interiores;
- Walk sin colliders territoriales;
- política de exportación por snapshot de licencia: `verified` con atribución, `restricted/unknown` omitidos automáticamente;
- matriz explícita JSON/ZIP/PNG/share/delivery/Presentation/GLB/Blender/vídeo;
- independencia de visibilidad Ortofoto/Terreno, conservando las policies de ambas fuentes cuando la ortofoto está drapeada sobre geometría terrain.

Documento: `docs/product/point-8c-e-territorial-integration-2026-10-28.md`.

## Evidencia final de Punto 8

El HEAD final de PR #132 `482a2b8a8bef15f33c16de5580713a45b9941a30` quedó con todos los workflows naturales finales en `success`, sin reruns manuales: Guided experience, Rubik local MCP, 8C-C orthophoto, 8C-D terrain/integration, Integrated browser regressions, Solar y Multiformat.

El cierre mantiene documentados dos baselines anteriores a 8C-E que **no se convierten en PASS**:

- 10 casos originales Walk/Walk-controls fallan igual en master base y rama, con 0 fallos nuevos;
- una aserción histórica de aspect ratio de Presentation también falla en master base.

Detalles: `docs/qa/point-8c-e-local-validation-2026-10-28.md`.

## Regla para agentes

1. Leer este archivo primero y verificar el HEAD real de `master`.
2. **No reabrir 1–8 salvo regresión reproducible o decisión expresa.**
3. Punto 8 está cerrado; el siguiente corte funcional aprobado es **Punto 9 — instalaciones ligeras**.
4. Mantener `FloorPlanGeoProvider` como frontera transversal y agnóstica de proveedor.
5. Mantener separada la geometría territorial fuente de cualquier geometría editable.
6. Mantener una sola cadena espacial; no duplicar norte, offsets ni CRS.
7. No afirmar precisión catastral, topográfica, geotécnica o normativa que la fuente no demuestre.
8. Conservar procedencia, licencia/atribución y cobertura/fecha cuando exista fuente externa.
9. `site.orthophoto` y `site.terrain` conservan metadata, no raster/grid runtime.
10. Mantener la regla de producto: **más contexto, no más falsa certeza**.
