# Estado canónico de producto — 28-10-2026

**Fuente de verdad de estado para agentes y revisiones.**

Verificar siempre el HEAD real de `master` antes de ejecutar trabajo. Los documentos anteriores quedan como historia cuando contradigan este archivo o el repositorio.

## Base de este estado

Estado posterior al merge de **PR #120 — Punto 7D**, squash `69a9b20a0ceab6f379150e2c7fb0b64f7136b4f5`.

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
| 7D | Presentación/exportación de presupuesto | **CERRADO** — PR #120 |
| 8A | Fachada y exterior básico | **ACTUAL / EN IMPLEMENTACIÓN** |
| 8B | Cubierta y volúmenes | **APROBADO, DOCUMENTADO, POSTERIOR** |
| 8C | Parcela, terreno y contexto | **APROBADO, POSTERIOR** |
| 9 | Instalaciones ligeras | **APROBADO, POSTERIOR** |

## Punto 7 — CERRADO

El Punto 7 queda cerrado hasta el alcance aprobado:

- **7A** — cantidades derivadas con certeza explícita;
- **7B** — presupuesto EUR, merma, IVA, revisión y procedencia;
- **7C** — providers, Manual, provenance/reference prices, FIEBDC-3/BC3 y adapter `BCCA_ES` con gate técnico/legal;
- **7D** — presentación estructurada y exportación CSV/JSON derivadas de `FloorPlanBudget.calculateBudget()`.

La activación de **datos BCCA reales gestionados por Rubik sigue deshabilitada** mientras no exista evidencia legal suficiente para el producto/endpoint y uso comercial concreto. Cerrar el Punto 7 no cambia ese gate.

## Punto 7D — CERRADO

Documento: `docs/product/point-7d-budget-presentation-export-2026-10-28.md`.

`FloorPlanBudgetPresentation` aporta una capa pura de presentación/exportación sobre `FloorPlanBudget.calculateBudget()`:

- reporte estructurado;
- capítulos y partidas sin capítulo;
- agrupación por `room | level | home` únicamente cuando `quantity.source.ref` lo demuestra;
- advertencias de incompletitud;
- procedencia y revisión;
- CSV interoperable;
- JSON de reporte para futuros exportadores.

Reglas cerradas:

- 7D no mide geometría;
- 7D no recalcula merma, subtotal ni IVA desde inputs crudos;
- `null` nunca se convierte en 0;
- cero explícito se conserva;
- provider/reference no equivale a revisión profesional;
- no se añadieron dependencias XLSX/PDF sólo para marcar formatos;
- futuros XLSX/PDF/CRM deben consumir el reporte estructurado.

### Evidencia de cierre

- PR #120 fusionada con squash `69a9b20a0ceab6f379150e2c7fb0b64f7136b4f5`;
- HEAD validado de la PR: `91fd89e8fbd26bd7f4ab79bdfd0b78e7742ad4d7`;
- Guided experience: **SUCCESS**;
- Point 6 solar and compatibility: **SUCCESS**;
- Multiformat guided import: **SUCCESS**;
- Vercel: **SUCCESS**;
- sin hilos de revisión pendientes;
- mergeable antes del merge.

El commit de squash incluye `[skip ci]` únicamente para evitar repetir en `push` a `master` la misma suite ya validada sobre el HEAD exacto de la PR. No sustituye ninguna comprobación previa al merge.

## Punto 8 — ACTUAL

El trabajo funcional pasa a Punto 8:

- **8A / Exterior V1** — fachada, materiales, huecos exteriores y exterior básico;
- **8B / Exterior V2** — cubierta, petos, retranqueos y volúmenes, con alcance deliberadamente limitado;
- **8C / Exterior V3** — parcela, terreno y contexto territorial, donde `FloorPlanGeoProvider` puede alimentar fuentes normalizadas.

8A y 8B deben funcionar sin Catastro/IGN/CNIG/PNOA. `FloorPlanGeoProvider` sigue siendo infraestructura transversal y adquiere especial relevancia en 8C.

Documento obligatorio de alcance y control de complejidad para 8B: [`point-8b-exterior-v2-roof-volumes-2026-10-27.md`](point-8b-exterior-v2-roof-volumes-2026-10-27.md).

Ese documento fija, entre otras reglas, cubierta plana como base, petos/volúmenes simples como siguiente capa, inclinadas sólo para casos explícitos, ausencia de solver universal y secuencia interna recomendada 8B-A → 8B-B → 8B-C.

## Regla para agentes

1. Leer este archivo primero.
2. Verificar `master`/SHA real.
3. No reabrir 1–7 salvo regresión reproducible o decisión expresa.
4. **8A es el corte funcional activo.**
5. Antes de implementar 8B, leer completo `point-8b-exterior-v2-roof-volumes-2026-10-27.md`.
6. No adelantar 8B/8C dentro de 8A.
7. Mantener `FloorPlanGeoProvider` como capacidad transversal; no renumerarlo como otro punto.
8. Mantener separada la geometría fuente/oficial de cualquier representación editable derivada cuando lleguen fuentes territoriales.
9. Mantener la regla de producto: **más contexto, no más falsa certeza**.
