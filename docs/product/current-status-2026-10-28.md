# Estado canónico de producto — 28-10-2026

**Fuente de verdad de estado para agentes y revisiones.** Verificar siempre el HEAD real de `master` antes de ejecutar trabajo. Los documentos anteriores quedan como historia cuando contradigan este archivo o el repositorio.

## Base de este estado

Estado posterior al cierre funcional de **Punto 8B** y al merge de **PR #126 — auditoría geométrica final de 8B**, squash `581da1a24d8600b89ed20c5558cfe6195cafdd49`.

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
| 8C | Parcela, terreno y contexto territorial | **ACTUAL / SIGUIENTE** |
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

### Auditoría geométrica final

La auditoría de 8B-A + 8B-B detectó un BUG-BLOCKING: un ciclo cerrado de fachada podía representar un patinillo o un cuerpo que no encerraba realmente las estancias interiores. PR #126 añadió la abstención `room-outside-facade-cycle` y una segunda corrección para huellas cóncavas: no basta con que los vértices de la estancia estén dentro; sus aristas completas deben permanecer dentro o sobre la huella exterior.

HEAD final auditado de PR #126: `d94206b18937c878ab2557ba7e282b975b2a42e8`.

Evidencia final de esa PR:

- suite Node no-browser local: **528 PASS, 0 FAIL, 2 SKIP** opcionales;
- Chromium relevante: **24/24 PASS**;
- Guided experience: **SUCCESS**;
- Point 6 solar and compatibility: **SUCCESS**;
- Multiformat guided import: **SUCCESS**;
- Vercel: **SUCCESS**;
- sin hilos de revisión pendientes;
- `mergeable: true` antes del merge.

El squash de #126 incluye `[skip ci]` para evitar repetir en `push` a `master` la misma validación ejecutada sobre el HEAD exacto de la PR.

## Decisión sobre 8B-C

Las cubiertas inclinadas simples (`mono-pitch` / `gable`) estaban permitidas como ampliación opcional después de estabilizar la base plana, no como requisito obligatorio de V2. Se **difieren**. No se introduce ahora nuevo contrato de pendiente/cumbrera, UI adicional ni geometría de faldones sólo para ampliar cobertura.

Esta decisión no impide retomarlas mediante una decisión de producto futura y explícita. **No bloquea el cierre de 8B.**

## Punto 8C — ACTUAL / SIGUIENTE

8C trata un problema distinto: parcela, terreno y contexto territorial. `FloorPlanGeoProvider` ya existe como frontera offline con proveedor Manual y capacidades declaradas; 8C debe extender contratos/adapters sin acoplar la UI a proveedores concretos ni confundir dato fuente/oficial con geometría editable.

Catastro/IGN/CNIG/PNOA no deben activarse ni presentarse como fuentes disponibles hasta verificar técnicamente el servicio concreto, sus condiciones de uso/licencia, atribución, cobertura y procedencia. La existencia de `FloorPlanGeoProvider` no autoriza por sí sola ninguna integración real.

## Regla para agentes

1. Leer este archivo primero y verificar el HEAD real de `master`.
2. No reabrir 1–8B salvo regresión reproducible o decisión expresa.
3. **8C es el corte funcional activo.**
4. Mantener `FloorPlanGeoProvider` como frontera transversal y agnóstica de proveedor.
5. Mantener separada la geometría territorial fuente de cualquier geometría editable derivada.
6. No afirmar precisión catastral, topográfica, geotécnica o normativa que la fuente no demuestre.
7. Conservar procedencia, licencia/condiciones aplicables y fecha/cobertura cuando exista fuente externa.
8. Mantener la regla de producto: **más contexto, no más falsa certeza**.
