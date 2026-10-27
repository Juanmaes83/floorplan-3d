# Punto 7A — Quantity Engine

**Fecha:** 27-10-2026
**Estado:** **CERRADO** mediante PR #108.
**Merge/squash:** `57adfde7e10cdd7a6b7defcbe197d5e3d067e462`.
**Base de implementación:** `master@c4f42b8a1c05496b88a993113c44cb23c6366c9d`.
**Dependencias funcionales:** Punto 3 (`FloorPlanSurfaceMetrics`), contratos `FloorPlanProjectV1` / `FloorPlanBuildingV1`.
**Siguiente corte:** 7B — Budget Core.

## 0. Propósito

7A crea un núcleo único de cantidades derivadas que convierte únicamente datos geométricos ya persistidos por FLOOR PLAN 3D en magnitudes defendibles para futuros presupuestos.

Principio:

> Mostrar cantidades derivadas solo cuando los datos disponibles permiten justificarlas. Un dato desconocido no se convierte en cero.

Este corte no añade dinero, precios, IVA, partidas presupuestarias, BCCA, DDC, CostProvider, CRM ni UI de presupuesto.

## 1. Inventario real auditado

### Superficies de estancia

La autoridad existente sigue siendo `js/surface-core.js` / `FloorPlanSurfaceMetrics`.

- `rooms[].polygon` contiene la geometría interior de estancia.
- `FloorPlanSurfaceMetrics.level()` calcula área y agregación.
- `countsTowardArea === false` conserva el área individual pero la excluye del total útil.
- `scale.confidence === "real"` produce `measured`.
- `estimated` y `pending` producen `estimated`.
- un polígono no utilizable produce `areaM2: null` y `unavailable`.

7A reutiliza este resultado y no implementa una segunda fórmula de superficie de suelo.

### Muros

Cada `wall` persiste datos suficientes para derivar cantidades cuando son válidos:

- `start`;
- `end`;
- `thicknessMm`;
- `heightMm`;
- `status`;
- `structure`;
- opcionalmente `surfaceMaterialId`.

Esto permite longitud y superficie de una cara física. La API distingue una cara de la superficie equivalente de ambas caras del mismo muro físico.

### Huecos

Cada `opening` persiste:

- `wallId`;
- `kind`;
- `offsetMm`;
- `widthMm`;
- `heightMm`;
- `sillHeightMm`.

Cuando estos datos son válidos y coherentes con el muro puede calcularse área de hueco. Los solapes se unen geométricamente para no restar dos veces la misma superficie.

### Relación estancia ↔ muro

No existe relación persistida `roomId ↔ wallId`.

`room.polygon` y `walls[]` son geometrías independientes. Por ello 7A no inventa una asociación semántica.

Para atribuir una **cara de muro** a una estancia, el Quantity Engine exige coincidencia geométrica demostrable:

1. borde de estancia paralelo al eje del muro;
2. borde aproximadamente a `thicknessMm / 2` del eje;
3. solape longitudinal real;
4. ausencia de ambigüedad con otro muro superpuesto.

Si solo parte puede demostrarse, devuelve subtotal + incompletitud. Si no puede demostrarse o es ambiguo, devuelve `unavailable`.

## 2. Modelo conceptual

7A distingue:

### Muro físico

Una entidad `wall` persistida. No se duplica por pertenecer a dos estancias.

### Cara de muro

Una de las dos superficies longitudinales de un muro físico.

Una pared compartida entre dos estancias puede aportar una cara a cada estancia manteniendo un único muro físico.

### Borde de estancia

Segmento del polígono interior de `room`. Solo se convierte en cara de muro cuando la asociación geométrica queda demostrada.

Esta separación evita doble conteo estructural y permite que 7B consuma cantidades de acabado por estancia.

## 3. API cerrada de 7A

Módulo:

`js/quantity-core.js`

Namespace:

`FloorPlanQuantities`

API pública:

```js
FloorPlanQuantities.room(project, roomId)
FloorPlanQuantities.wall(project, wallId)
FloorPlanQuantities.level(project)
FloorPlanQuantities.home(projectOrBuilding)
```

El módulo funciona como CommonJS en tests y como global de navegador cuando `FloorPlanSurfaceMetrics` ya está disponible.

No persiste resultados y no modifica el objeto fuente.

## 4. Cantidades soportadas

### 4.1 Suelo

Por estancia:

- `areaM2`;
- estado `measured | estimated | unavailable`;
- `counted`;
- fuente explícita `FloorPlanSurfaceMetrics`.

Por planta/vivienda:

- área computable;
- `complete`;
- `missing`;
- `excluded`;
- estado agregado heredado del Punto 3.

### 4.2 Perímetro interior

Por estancia:

- `lengthM`;
- estado de medición;
- `complete`.

Definición: suma geométrica de los lados del polígono interior.

No descuenta puertas ni otros huecos. Es perímetro geométrico, no “metros de rodapié”.

### 4.3 Muro físico

Cuando geometría y altura son válidas:

- `lengthM`;
- `heightM`;
- `faceGrossAreaM2`;
- `faceOpeningAreaM2`;
- `faceNetAreaM2`;
- `wallSurfaceGrossAreaM2`;
- `wallSurfaceOpeningAreaM2`;
- `wallSurfaceNetAreaM2`.

`face*` representa una cara. `wallSurface*` representa ambas caras del mismo muro físico, no dos muros.

### 4.4 Caras de muro por estancia

Cuando la relación geométrica queda demostrada:

- longitud atribuida;
- superficie bruta;
- superficie de huecos;
- superficie neta;
- `wallId`;
- lado/cara;
- material de pared cuando existe;
- estado y completitud.

También se exponen:

- `matchedBoundaryM`;
- `missingBoundaryM`;
- `associationComplete`;
- `openingsComplete`.

Un subtotal parcial no se presenta como total completo.

### 4.5 Huecos

Cantidad directa:

- total de huecos;
- conteo por `door`;
- `sliding-door`;
- `window`;
- `opening`.

Cuando la geometría es válida se deriva el área de hueco por muro/cara y el área neta resultante.

Un hueco incompleto/inválido deja área de huecos y neta en `null`, conservando la bruta cuando sí es conocida.

### 4.6 Estado de muros

Los agregados permanecen separados por:

- `existing`;
- `new`;
- `demolished`.

Los muros demolidos siguen siendo cantidades documentales, pero no se usan para atribuir superficies actuales a las estancias.

### 4.7 Áreas por material de suelo

Se agrupa el área geométrica de estancias por `floorMaterialId`.

Las estancias excluidas del total útil no desaparecen del área material: `countsTowardArea` gobierna el total útil, no la existencia física del acabado.

## 5. Cantidades deliberadamente no soportadas

7A NO calcula:

- rodapié necesario;
- molduras;
- litros de pintura;
- cajas de pavimento;
- adhesivo;
- mortero;
- rendimientos;
- mermas;
- mano de obra;
- precios;
- impuestos;
- unidades comerciales;
- superficie construida;
- volumen;
- medición contractual;
- certificación.

Tampoco fuerza una superficie neta de pared por estancia cuando la relación estancia↔muro no puede demostrarse.

## 6. Estados y completitud

Se reutiliza el lenguaje del Punto 3:

- `measured`;
- `estimated`;
- `unavailable`.

Además, una métrica puede ser conocida pero incompleta.

Ejemplos:

- tres bordes asociados a muros y uno sin asociación: subtotal conocido + `complete: false`;
- muro con altura válida y hueco inválido: superficie bruta conocida, hueco/neto `null`;
- polígono degenerado: superficie y perímetro `unavailable`.

Un desconocido nunca se suma como cero.

## 7. Agregación y multiplanta

### Estancia

Devuelve suelo, perímetro y caras de muro demostradas.

### Planta

Devuelve:

- detalle de estancias;
- detalle de muros;
- total de suelo procedente de `FloorPlanSurfaceMetrics`;
- suma de perímetros interiores;
- cantidades físicas de muros;
- cantidades por estado de muro;
- conteo de huecos;
- áreas por material de suelo.

### Vivienda / edificio

`FloorPlanQuantities.home()` acepta proyecto individual o `FloorPlanBuildingV1`.

Para edificio:

- respeta `levels[].order`;
- admite N plantas;
- mezcla `measured` y `estimated` degradando correctamente el estado;
- conserva incompletitud cuando alguna planta contiene datos desconocidos.

Jerarquía:

`estancia → planta → vivienda`

## 8. Unidades

La API devuelve números sin formato:

- longitud: `m`;
- superficie: `m2`;
- conteos: `unit`.

No devuelve cadenas localizadas ni redondea para presentación. Ese trabajo pertenece a consumidores posteriores.

## 9. Contrato y persistencia

7A no cambia:

- versión de `FloorPlanProjectV1`;
- versión de `FloorPlanBuildingV1`;
- schemas;
- persistencia JSON/ZIP.

El Quantity Engine es completamente derivado y no reescribe proyectos legacy/futuros V1.

## 10. Compatibilidad

7A no modifica:

- Punto 1;
- declaraciones de tipo de muro;
- `FloorPlanSurfaceMetrics`;
- familias de estancia;
- ficha profesional;
- solar/GeoProvider;
- importadores;
- exportación;
- presentación;
- PNG/vídeo;
- 2D/3D.

No añade UI.

## 11. QA final

Suite nueva:

`tests/quantity-core.test.cjs`

Resultado dirigido sobre el `surface-core.js` real de `master`:

`26 PASS · 0 FAIL · 0 SKIP`.

Cobertura:

- consistencia exacta con `FloorPlanSurfaceMetrics`;
- `real`, `estimated`, `pending`;
- perímetro;
- muro físico;
- cero conocido vs desconocido;
- altura inválida;
- huecos incompletos y solapados;
- caras completas/parciales/no demostrables/ambiguas;
- pared compartida;
- estancia excluida;
- polígono degenerado;
- conteo de huecos;
- estados `existing/new/demolished`;
- área por material;
- edificio N plantas;
- proyecto individual;
- legacy;
- versión V1 futura;
- no mutación;
- entradas inválidas;
- unidades numéricas.

En el HEAD final de PR #108 terminaron en SUCCESS los workflows de compatibilidad disparados por el cambio, incluidos:

- Guided experience;
- Multiformat guided import;
- Point 6 solar and compatibility.

## 12. Limitaciones explícitas

1. La asociación estancia↔cara de muro es geométrica porque el contrato no persiste ese vínculo.
2. Geometría importada que no haga coincidir polígono interior y caras de muro puede producir resultados parciales/unavailable.
3. No se infieren espesores, alturas ni dimensiones estándar.
4. No se modelan capas constructivas ni rendimientos.
5. Los huecos se descuentan solo cuando sus dimensiones persistidas son válidas.
6. No existe lógica monetaria en 7A.

## 13. Handoff a 7B

7B debe consumir `FloorPlanQuantities`; no debe volver a medir geometría.

El Budget Core deberá mantener separadas:

- cantidad geométrica;
- reglas de merma/rendimiento;
- precio;
- procedencia/revisión.

7B no debe modificar la semántica de certeza de 7A para hacer que un presupuesto parezca completo.

## 14. Cierre

7A queda **CERRADO** mediante PR #108 y squash `57adfde7e10cdd7a6b7defcbe197d5e3d067e462`.

Se cumplieron los criterios de cierre:

- `FloorPlanQuantities` integrado;
- suite dirigida verde;
- regresiones necesarias verdes;
- sin schema nuevo;
- sin mutación;
- sin precios, IVA, BCCA ni CostProvider;
- sin UI de presupuesto.

El siguiente corte funcional es **7B — Budget Core**.
