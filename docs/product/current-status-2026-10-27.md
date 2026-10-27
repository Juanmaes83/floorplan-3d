# Estado canónico de producto — 27-10-2026

**Esta es la fuente de verdad de estado para agentes y revisiones a partir del cierre del Punto 6.**

Base de producto al registrar el cierre 1–6: `master@422d6a893325e343e6e045805c2ec034a27ae631`.

Base de implementación del candidato 7A: `master@c4f42b8a1c05496b88a993113c44cb23c6366c9d`.

No deducir el estado actual a partir de documentos fechados anteriores. Los documentos históricos explican decisiones y contexto, pero cuando exista contradicción sobre qué está implementado/cerrado, prevalece este archivo y el estado real de `master`.

## Resumen

| Punto | Capacidad | Estado | Evidencia principal |
|---:|---|---|---|
| 1 | Construir y medir — acceso/contexto | **CERRADO** | PR #99 + estado integrado posterior |
| 2 | Tipo declarado de muro | **CERRADO** | PR #101 |
| 3 | Superficies estancia → planta → vivienda | **CERRADO** | PR #102 |
| 4 | Familia funcional + nombre libre de estancia | **CERRADO** | PR #103 |
| 5 | Ficha profesional de superficies | **CERRADO** | PR #104, squash `2f6a7583a0f3d65238e1de2903f40fdd20cbe4a2` |
| 6 | Orientación + ubicación + solar orientativo + GeoProvider | **CERRADO** | PR #106, squash `422d6a893325e343e6e045805c2ec034a27ae631` |
| 7 | Presupuesto de acabados/materiales | **EN IMPLEMENTACIÓN — 7A CANDIDATO** | `FloorPlanQuantities`; 7B/7C/7D pendientes |
| 8 | Exterior V1 → V3 | **APROBADO, POSTERIOR** | Mantiene alcance original |
| 9 | Instalaciones ligeras | **APROBADO, POSTERIOR** | Símbolos/elementos, no MEP |

## Puntos 1–6 — estado cerrado

### 1 — Construir y medir

No existe un segundo sistema de dibujo/medición. Se mejoró el acceso y contexto de las herramientas existentes. Esta línea se considera cerrada dentro del programa 1–6.

### 2 — Tipo declarado de muro

Persisten tipo y procedencia declarados por el profesional/importación/revisión. No se infiere capacidad estructural por geometría, grosor ni IA. No constituye verificación estructural.

### 3 — Superficies

Existe núcleo derivado de superficies con jerarquía estancia → planta → vivienda, estados medido/estimado/no disponible, exclusiones y compatibilidad multiplanta. No se inventa superficie cuando falta evidencia.

### 4 — Familias de estancias

`room.family` y `room.name` son conceptos separados. La familia sirve a automatismos/estadística; el nombre sigue siendo libre. Compatibilidad legacy preservada.

### 5 — Ficha profesional de superficies

La ficha reutiliza el núcleo del Punto 3 y presenta estancia/planta/vivienda, estado de medición, exclusiones y pavimentos con salida profesional/printable. No convierte estimaciones en mediciones certificadas.

### 6 — Orientación, ubicación, solar y GeoProvider

Cerrado mediante PR #106.

#### 6A — Orientación básica
- norte lógico declarado/configurable;
- visible en 2D;
- persistente;
- borrable;
- compartido coherentemente en edificio multiplanta;
- no rota destructivamente la geometría;
- no se infiere automáticamente.

#### 6B — Ubicación
- latitud;
- longitud;
- timezone IANA;
- entrada manual/offline;
- procedencia mínima;
- privacidad: guardar ubicación interna y publicarla son decisiones separadas;
- `site` opcional en contrato; proyectos antiguos siguen abriendo sin inferencias.

#### 6C — Solar orientativo
- SunCalc 2.1.1 vendorizado, licencia BSD preservada;
- núcleo solar separado del renderer;
- adaptación explícita de azimut/elevación al sistema de escena;
- reutiliza la `DirectionalLight` existente;
- Presentación y Solar orientativo son modos diferenciados y reversibles;
- Three.js 0.160.0 queda vendorizado localmente; el arranque 3D ya no depende de jsDelivr;
- no se promete estudio de soleamiento, energía, normativa ni precisión pericial.

#### 6D — `FloorPlanGeoProvider`
- existe frontera estable de proveedor geográfico;
- proveedor manual/offline es funcional y permanente;
- solar no conoce Catastro/IGN/PNOA/Google Maps directamente;
- España continúa como primer objetivo de proveedor territorial real;
- Catastro/IGN/CNIG/PNOA quedan para cortes territoriales posteriores, especialmente Exterior V3;
- no se implementó GIS general ni datos personales/protegidos.

### QA final del Punto 6

El HEAD candidato `6838636835fe3d1ea681c8f2ed756dc31c4564f4` terminó con los cinco workflows relevantes en SUCCESS:

- Rubik local MCP;
- Guided experience;
- Point 6 solar and compatibility;
- Integrated browser regressions;
- Multiformat guided import.

El ajuste final de Multiformat fue exclusivamente del harness de test: al vendorizase Three.js, el escenario `webgl=false` debía bloquear también `/vendor/three/**`. No cambió lógica de producto.

## Punto 7 — estado por cortes

El Punto 7 completo **NO está cerrado**. El estado actual es:

- **7A — Quantity Engine: CANDIDATO EN REVISIÓN.** Núcleo derivado `FloorPlanQuantities` para suelo, perímetros, muros, huecos y caras de muro solo cuando son geométricamente justificables. Reutiliza `FloorPlanSurfaceMetrics`, no persiste totales y no contiene dinero.
- **7B — Budget Core: PENDIENTE.** Partidas, cantidad, unidad, merma, precio unitario, subtotal, EUR, IVA configurable, revisión y procedencia.
- **7C — `FloorPlanCostProvider`: PENDIENTE.** Proveedor Manual obligatorio; `BCCA_ES` solo después de verificar las condiciones oficiales de reutilización. No incorporar en producción la compilación DDC CC BY-NC.
- **7D — Presentación/exportación: PENDIENTE.** Resúmenes por estancia/planta/vivienda/capítulos y exportación cuando corresponda.
- **Etapa 2 posterior:** Asset Lab para mobiliario/equipamiento/catálogo comercial cuando exista demanda.

### Regla de 7A

7A solo convierte datos persistidos y superficies existentes en cantidades defendibles. Un desconocido no se convierte en cero y un subtotal parcial no se presenta como completo. No introduce precios, IVA, BCCA, CostProvider ni UI de presupuesto.

Documento técnico/producto del candidato:

`docs/product/point-7a-quantity-engine-2026-10-27.md`

## Regla para agentes

1. Leer primero este archivo.
2. Verificar `master` y SHA antes de trabajar.
3. Los documentos con fecha anterior pueden ser historia o diseño previo, no estado actual.
4. No reabrir Puntos 1–6 salvo regresión reproducible o decisión expresa.
5. No considerar 7A cerrado hasta merge autorizado del candidato.
6. No empezar 7B/7C/7D dentro de la PR de 7A.
7. No adelantar Punto 8/9 dentro de Punto 7.
8. No asumir que una fuente externa equivale a certificación de Rubik.
