# Estado canónico de producto — 28-10-2026

**Fuente de verdad de estado para agentes y revisiones.** Verificar siempre el HEAD real de `master` antes de ejecutar trabajo. Los documentos anteriores quedan como historia cuando contradigan este archivo o el repositorio.

## Base de este estado

Estado posterior al cierre funcional de **8C-D** y al merge de **PR #131 — terreno / elevación territorial**, squash `9d5a9fe48198f3a90d931dd82f88f6a122d30157`.

## Estado resumido

| Punto | Capacidad | Estado |
|---:|---|---|
| 1–6 | Construcción, medición, superficies, clasificación, ficha profesional, orientación/ubicación/solar/GeoProvider | **CERRADO** |
| 7 | Presupuesto de acabados/materiales | **CERRADO** — PR #120 |
| 8A | Fachada y exterior básico | **CERRADO** — PR #121, squash `10872796080a5b731290d45f1a3d6770dd00f7bf` |
| 8B-A | Huella, cubierta plana, retranqueos y superficies expuestas | **CERRADO** — PR #124, squash `7dc8b41aa21a37ebbb59ccf4855a2f4cbaf5ba4d` |
| 8B-B | Petos declarados y volúmenes exteriores simples | **CERRADO** — PR #125, squash `be8374f85512f19fdec0c5b6660095201594fd01` |
| 8B auditoría | Contención conservadora de huella / falsa certeza geométrica | **CERRADO** — PR #126, squash `581da1a24d8600b89ed20c5558cfe6195cafdd49` |
| 8B-C | Cubiertas inclinadas simples | **DIFERIDO POR ALCANCE** — no requerido para cerrar 8B |
| 8B | Cubierta y volúmenes exteriores | **CERRADO** |
| 8C-A | GeoProvider / contratos territoriales | **CERRADO** — PR #128, squash `f944088c315140d67cfadfbcd8db6350fd559a48` |
| 8C-B | Parcela, referencia y geometría territorial fuente | **CERRADO** — PR #129, squash `597014888fc80e7fafdfd011115e62113cafb0d0` |
| 8C-C | Ortofoto PNOA contextual | **CERRADO** — PR #130, squash `0adf6fa0cd3ca7cfcb2dd654eaaa7cef4e6adac0` |
| 8C-D | Terreno / elevación MDT05 contextual | **CERRADO** — PR #131, squash `9d5a9fe48198f3a90d931dd82f88f6a122d30157` |
| 8C-E | Integración final edificio + parcela + ortofoto + terreno + orientación + presentación/exportación | **ACTUAL / SIGUIENTE** |
| 8C | Parcela, terreno y contexto territorial | **ABIERTO — se cierra sólo tras 8C-E + auditoría final** |
| 9 | Instalaciones ligeras | **APROBADO, POSTERIOR** |

## Punto 8A — CERRADO

`FloorPlanExterior.derive(project)` aporta una lectura exterior conservadora sobre la autoridad existente de `FloorPlanProjectV1`: fachadas demostrables, huecos ligados a muros de fachada, materiales existentes y `terrace`/`balcony` únicamente cuando están declarados. No crea otro modelo del edificio, no cambia contratos y funciona offline, sin Catastro/IGN/CNIG/PNOA.

Documento: `docs/product/point-8a-exterior-v1-2026-10-28.md`.

## Punto 8B — CERRADO

Documento de cierre: `docs/product/point-8b-closure-2026-10-28.md`.

El alcance cerrado incluye:

- huella de cubierta sólo cuando existe un ciclo de fachada demostrable;
- offset exterior por semigrosor real de muro con miter acotado;
- validación de que las estancias interiores soportadas quedan contenidas en la huella demostrada, incluidas sus aristas en concavidades; si no, `unavailable / room-outside-facade-cycle`;
- cubierta plana y superficies inferiores `exposed-roof` en diferencias ortogonales soportadas;
- `FloorPlanBuildingV1` como autoridad de niveles, elevaciones y offsets;
- petos exclusivamente explícitos mediante `roofParapet` desde ProjectV1 1.8.0;
- volúmenes exteriores simples derivados de `FloorPlanRoof`;
- integración con «Exterior», Recorrer, Presentación, Solar, PNG y captura de entrega;
- geometría derivada no persistida;
- exportadores auditados con omisiones explícitas cuando no incorporan 8B.

Casos no demostrables degradan a `unavailable`/`invalid`; no se añadió CSG general, solver universal de cubiertas, inferencia estructural, normativa, drenaje ni construcción por capas.

### Auditoría geométrica final de 8B

La auditoría de 8B-A + 8B-B detectó un BUG-BLOCKING: un ciclo cerrado de fachada podía representar un patinillo o un cuerpo que no encerraba realmente las estancias interiores. PR #126 añadió la abstención `room-outside-facade-cycle` y una segunda corrección para huellas cóncavas: no basta con que los vértices de la estancia estén dentro; sus aristas completas deben permanecer dentro o sobre la huella exterior.

HEAD final auditado de PR #126: `d94206b18937c878ab2557ba7e282b975b2a42e8`.

El squash de #126 incluye `[skip ci]` para evitar repetir en `push` a `master` la misma validación ejecutada sobre el HEAD exacto de la PR.

## Decisión sobre 8B-C

Las cubiertas inclinadas simples (`mono-pitch` / `gable`) estaban permitidas como ampliación opcional después de estabilizar la base plana, no como requisito obligatorio de V2. Se **difieren**. No se introduce ahora nuevo contrato de pendiente/cumbrera, UI adicional ni geometría de faldones sólo para ampliar cobertura.

Esta decisión no impide retomarlas mediante una decisión de producto futura y explícita. **No bloquea el cierre de 8B.**

## Punto 8C — A–D CERRADOS; 8C-E ACTIVO

8C extiende el contexto territorial sin convertir datos oficiales en geometría editable ni atribuirles una precisión que no demuestran.

### 8C-A — GeoProvider / contratos — CERRADO

PR #128 estableció la frontera agnóstica `FloorPlanGeoProvider`, capacidades declaradas, provenance/licencia/atribución y adapters sin acoplar la UI a proveedores concretos. El registry no es autoridad persistida y un proyecto conserva validez aunque falte un provider runtime.

Documento: `docs/product/point-8c-a-geo-provider-contracts-2026-10-28.md`.

### 8C-B — parcela / geometría territorial fuente — CERRADO

PR #129 añadió `site.parcel`, importación GML INSPIRE CP de Catastro en modo documento, CRS territorial demostrado, `sourceGeometry` separada de cualquier geometría editable y `parcel.frame` como marco local común. No se afirma lindero legal certificado ni posición del edificio.

Documento: `docs/product/point-8c-b-parcel-source-geometry-2026-10-28.md`.

### 8C-C — ortofoto / contexto — CERRADO

PR #130 añadió ortofoto PNOA Máxima Actualidad mediante WMS 1.3.0, carga explícita, raster sólo runtime y `site.orthophoto` como snapshot durable de configuración/procedencia. El raster no se persiste ni se descarga al abrir; `retrievedAt` no se presenta como fecha de vuelo. No sitúa el edificio.

Documento: `docs/product/point-8c-c-orthophoto-context-2026-10-28.md`.

### 8C-D — terreno / elevación — CERRADO

PR #131 añadió MDT05 primera cobertura mediante WCS 2.0.1, `GeoProvider.getTerrain`, TerrainGrid runtime, consulta contextual de cotas y superficie derivada determinista en el marco de la parcela. ProjectV1 1.11.0 y BuildingV1 1.4.0 persisten sólo `site.terrain` metadata; grid, respuesta cruda y mesh no se persisten. Las alturas se tratan como ortométricas según la fuente; 5 m es paso de malla, no precisión. No se infiere relación vertical entre edificio y terreno.

Documento: `docs/product/point-8c-d-terrain-elevation-2026-10-28.md`.

### 8C-E — integración final — ACTUAL / SIGUIENTE

8C-E debe integrar, sin crear una segunda autoridad espacial:

- edificio 8A/8B;
- `site.parcel` y `parcel.frame`;
- ortofoto 8C-C;
- terreno/elevación 8C-D;
- orientación/norte y Solar ya existentes;
- escena exterior, Recorrer y Presentación;
- matriz explícita de exportación y atribución.

La integración debe demostrar una única cadena de transformaciones y evitar doble aplicación de offsets, norte o CRS. La relación edificio↔parcela/terreno no puede inferirse silenciosamente: si el contrato actual no contiene una colocación territorial demostrable del edificio, 8C-E debe introducir únicamente el mínimo dato/flujo explícito necesario, con provenance y sin inventar precisión.

Punto 8 **no se cierra** hasta completar 8C-E y una auditoría final de todo 8A–8C: persistencia, offline/provider ausente, Recorrer, Presentación, Solar, exportaciones, atribuciones/licencias, móvil, consola y CI.

## Regla para agentes

1. Leer este archivo primero y verificar el HEAD real de `master`.
2. No reabrir 1–8C-D salvo regresión reproducible o decisión expresa.
3. **8C-E es el único corte funcional activo dentro de Punto 8.**
4. Mantener `FloorPlanGeoProvider` como frontera transversal y agnóstica de proveedor.
5. Mantener separada la geometría territorial fuente de cualquier geometría editable derivada.
6. Mantener una sola cadena espacial: CRS fuente → `parcel.frame` → colocación explícita del edificio → BuildingV1/levels → renderer.
7. No afirmar precisión catastral, topográfica, geotécnica o normativa que la fuente no demuestre.
8. Conservar procedencia, licencia/condiciones aplicables y fecha/cobertura cuando exista fuente externa.
9. `site.orthophoto` y `site.terrain` conservan metadata, no los bytes/grids runtime; no asumir reproducibilidad pixel/value-perfect.
10. Mantener la regla de producto: **más contexto, no más falsa certeza**.
