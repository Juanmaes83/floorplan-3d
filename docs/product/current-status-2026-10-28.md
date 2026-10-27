# Estado canónico de producto — 28-10-2026

**Fuente de verdad de estado para agentes y revisiones.**

Verificar siempre el HEAD real de `master` antes de ejecutar trabajo. Los documentos anteriores quedan como historia cuando contradigan este archivo o el repositorio.

## Base de este estado

Base del corte 7D: `master@561ca43145977a7003fd23b79f4af123db6ba445`, resultado del merge de PR #118.

## Estado resumido

| Punto | Capacidad | Estado |
|---:|---|---|
| 1–6 | Construcción, medición, superficies, clasificación, ficha profesional, orientación/ubicación/solar/GeoProvider | **CERRADO** |
| 7A | Quantity Engine | **CERRADO** — PR #108 |
| 7B | Budget Core | **CERRADO** — PR #110 |
| 7C-A | `FloorPlanCostProvider` core | **CERRADO** — PR #112 |
| 7C-B | `ManualCostProvider` | **CERRADO** — PR #114 |
| 7C-C | Budget provenance / CostQuote bridge | **CERRADO** — PR #116 |
| 7C-D | Codec FIEBDC-3/BC3 | **CERRADO** — PR #117 |
| 7C-E | `BCCA_ES` + gate legal/técnico | **CERRADO** — PR #118 |
| 7D | Presentación/exportación de presupuesto | **CANDIDATO EN REVISIÓN** — este corte |
| 8A | Fachada y exterior básico | **SIGUIENTE / EN PREPARACIÓN** |
| 8B | Cubierta y volúmenes | **APROBADO, POSTERIOR** |
| 8C | Parcela, terreno y contexto | **APROBADO, POSTERIOR** |
| 9 | Instalaciones ligeras | **APROBADO, POSTERIOR** |

## Punto 7C — CERRADO

La familia 7C está cerrada hasta el alcance aprobado:

- contrato provider agnóstico;
- Manual offline permanente;
- provenance/reference prices en Budget 1.1;
- codec FIEBDC-3/BC3;
- adapter `BCCA_ES` con fixtures sintéticos y gate técnico/legal.

La activación de **datos BCCA reales gestionados por Rubik sigue deshabilitada** mientras no exista evidencia legal suficiente para el producto/endpoint y uso comercial concreto. Cerrar 7C-E no cambia ese gate.

## Punto 7D — candidato actual

Documento: `docs/product/point-7d-budget-presentation-export-2026-10-28.md`.

El corte añade `FloorPlanBudgetPresentation` como capa pura de presentación/exportación sobre `FloorPlanBudget.calculateBudget()`:

- reporte estructurado;
- capítulos y partidas sin capítulo;
- agrupación por `room | level | home` únicamente cuando el `quantity.source.ref` lo demuestra;
- advertencias de incompletitud;
- procedencia/revisión;
- CSV interoperable;
- JSON de reporte.

Reglas:

- 7D no mide geometría;
- 7D no recalcula merma, subtotal ni IVA desde inputs crudos;
- `null` nunca se convierte en 0;
- cero explícito se conserva;
- provider/reference no equivale a revisión profesional;
- no se añaden dependencias XLSX/PDF sólo para marcar formatos;
- un futuro XLSX/PDF/CRM debe consumir el reporte estructurado.

Si CI y revisión del HEAD exacto quedan verdes y este corte se fusiona, **Punto 7 queda cerrado**.

## Punto 8

Tras el cierre de 7D, el trabajo funcional pasa a Punto 8:

- **8A / Exterior V1** — fachada, materiales, huecos exteriores y exterior básico;
- **8B / Exterior V2** — cubierta, petos, retranqueos y volúmenes, con alcance deliberadamente limitado;
- **8C / Exterior V3** — parcela, terreno y contexto territorial, donde `FloorPlanGeoProvider` puede alimentar fuentes normalizadas.

8A y 8B no deben depender de Catastro/IGN/CNIG/PNOA.

La documentación específica de límites 8B vive en la PR documental #119 mientras no haya sido fusionada.

## Regla para agentes

1. Leer este archivo primero.
2. Verificar `master`/SHA real.
3. No reabrir 1–6 ni 7A–7C-E salvo regresión reproducible o decisión expresa.
4. Mientras 7D no esté fusionado, no mezclar trabajo de 7D dentro de 8A.
5. Tras el cierre de 7D, Punto 7 queda cerrado y 8A es el corte funcional activo.
6. Mantener `FloorPlanGeoProvider` como capacidad transversal; no renumerarlo como otro punto.
7. Mantener la regla de producto: **más contexto, no más falsa certeza**.
