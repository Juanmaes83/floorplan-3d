# Punto 7A — Quantity Engine

**Fecha:** 27-10-2026  
**Estado:** implementación candidata en `feat/point-7a-quantity-engine`; no cierra todavía el Punto 7 completo.  
**Base de implementación:** `master@c4f42b8a1c05496b88a993113c44cb23c6366c9d`.  
**Dependencias funcionales:** Punto 3 (`FloorPlanSurfaceMetrics`), contratos `FloorPlanProjectV1` / `FloorPlanBuildingV1`.  
**Siguiente corte previsto:** 7B — Budget Core.

## 0. Propósito

7A crea un núcleo único de cantidades derivadas que convierte únicamente datos geométricos ya persistidos por FLOOR PLAN 3D en magnitudes defendibles para futuros presupuestos.

Principio:

> Mostrar cantidades derivadas solo cuando los datos disponibles permiten justificarlas. Un dato desconocido no se convierte en cero.

Este corte no añade dinero, precios, IVA, partidas presupuestarias, BCCA, DDC, CostProvider, CRM ni UI de presupuesto.

## 1. Inventario real auditado

### Superficies de estancia

La autoridad existente es `js/surface-core.js` / `FloorPlanSurfaceMetrics`.

- `rooms[].polygon` contiene la geometría interior de la estancia.
- `FloorPlanSurfaceMetrics.level()` calcula el área de estancia y la agregación.
- `countsTowardArea === false` conserva el área de la estancia pero la excluye del total útil.
- `scale.confidence === "real"` produce estado `measured`.
- Los demás estados de escala existentes, incluido `pending`, producen `estimated`.
- Un polígono degenerado/no utilizable produce `areaM2: null` y `unavailable`.

7A reutiliza ese resultado; no implementa una segunda fórmula de superficie de suelo.

### Muros

Cada `wall` persiste:

- `start`;
- `end`;
- `thicknessMm`;
- `heightMm`;
- `status`;
- `structure`;
- opcionalmente `surfaceMaterialId`.

Esto permite derivar longitud y superficie de una cara física cuando longitud y altura son válidas.

El contrato actual aplica `surfaceMaterialId` a las dos caras del muro, por lo que 7A también puede exponer explícitamente la superficie de acabado de ambas caras sin confundirla con la superficie de una sola cara.

### Huecos

Cada `opening` persiste:

- `wallId`;
- `kind`;
- `offsetMm`;
- `widthMm`;
- `heightMm`;
- `sillHeightMm`.

Por tanto, cuando esos datos son válidos y coherentes con el muro, puede calcularse área de hueco. Los solapes se unen geométricamente para no restar dos veces la misma superficie.

### Relación estancia ↔ muro

No existe una relación persistida `roomId ↔ wallId`.

`room.polygon` y `walls[]` son geometrías independientes y su coherencia se valida como advertencia, no como vínculo contractual. Por ello 7A no inventa una asociación semántica.

Para atribuir una **cara de muro** a una estancia, el Quantity Engine exige coincidencia geométrica demostrable:

1. borde de estancia paralelo al eje del muro;
2. borde situado aproximadamente a `thicknessMm / 2` del eje;
3. solape longitudinal real;
4. ausencia de ambigüedad con otro muro superpuesto.

Si solo parte del borde puede demostrarse, devuelve subtotal + estado incompleto. Si no puede demostrarse o es ambiguo, devuelve `unavailable`.

## 2. Modelo conceptual

Se distinguen tres conceptos.

### Muro físico

Una entidad `wall` persistida. No se duplica por pertenecer a dos estancias.

### Cara de muro

Una de las dos superficies longitudinales de un muro físico.

Una pared compartida entre dormitorio y pasillo puede producir una cara atribuible a cada estancia, manteniendo un solo muro físico.

### Borde de estancia

Segmento del polígono interior de `room`. Solo se convierte en cara de muro cuando la asociación geométrica anterior queda demostrada.

Esta separación evita doble conteo estructural y permite que 7B use en el futuro cantidades de acabado por estancia.

## 3. API

Nuevo módulo:

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

Definición: suma geométrica de los lados del polígono interior de la estancia.

**No descuenta puertas ni otros huecos.** Es perímetro geométrico, no “metros de rodapié”. Aplicar reglas constructivas de rodapié pertenece a un corte posterior.

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

`face*` representa una cara.

`wallSurface*` representa ambas caras del mismo muro físico y no dos muros.

### 4.4 Caras de muro por estancia

Cuando la relación geométrica queda demostrada:

- longitud atribuida;
- superficie bruta;
- superficie de huecos;
- superficie neta;
- `wallId`;
- lado/cara;
- material de pared cuando exista;
- estado y completitud.

También expone:

- `matchedBoundaryM`;
- `missingBoundaryM`;
- `associationComplete`;
- `openingsComplete`.

Un subtotal parcial no se disfraza de total completo.

### 4.5 Huecos

Cantidad directa:

- total de huecos;
- conteo por `door`;
- `sliding-door`;
- `window`;
- `opening`.

Cuando la geometría es válida:

- área de hueco por muro/cara;
- área neta tras descontar la unión geométrica de huecos.

Un hueco incompleto/inválido hace que área de huecos y neta sean `null`, manteniendo la bruta cuando sí es conocida.

### 4.6 Estado de muros

Los agregados de muro se separan por:

- `existing`;
- `new`;
- `demolished`.

Los muros demolidos siguen siendo cantidades documentales del proyecto, pero no se usan para atribuir superficies actuales a las estancias.

### 4.7 Áreas por material de suelo

Se agrupa el área geométrica de estancias por `floorMaterialId`.

Las estancias excluidas del total útil no desaparecen del área material: `countsTowardArea` gobierna el total de superficie útil, no la existencia física del acabado.

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

Además, una métrica puede ser conocida pero **incompleta**.

Ejemplos:

- tres bordes de una habitación asociados a muros y uno sin asociación: subtotal conocido + `complete: false`;
- muro con altura válida y hueco inválido: superficie bruta conocida, hueco/neto `null`;
- polígono degenerado: superficie y perímetro `unavailable`.

Un desconocido nunca se suma como cero.

## 7. Agregación

### Estancia

Devuelve:

- suelo;
- perímetro;
- caras de muro demostradas.

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

Las métricas de pared conservan su propia completitud independiente.

### Vivienda / edificio

`FloorPlanQuantities.home()` acepta:

- proyecto individual;
- `FloorPlanBuildingV1`.

Para edificio:

- respeta `levels[].order`;
- admite N plantas;
- mezcla `measured` y `estimated` degradando el estado agregado;
- conserva incompletitud cuando alguna planta contiene datos desconocidos.

Jerarquía:

`estancia → planta → vivienda`

## 8. Unidades

La API devuelve números sin formato:

- longitud: metros (`m`);
- superficie: metros cuadrados (`m2` en metadata de unidad; valores numéricos);
- conteos: `unit`.

No devuelve cadenas localizadas y no redondea para presentación. El redondeo pertenece a 7B/7D o a consumidores posteriores.

## 9. Contrato y persistencia

No cambia:

- versión de `FloorPlanProjectV1`;
- versión de `FloorPlanBuildingV1`;
- schemas;
- persistencia JSON/ZIP.

El Quantity Engine es completamente derivado.

No guarda totales ni reescribe proyectos legacy/futuros V1.

## 10. Compatibilidad

El módulo no modifica:

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

No se añade UI en 7A.

El módulo queda preparado para ser consumidor de 7B sin obligar a cargar una UI de presupuesto.

## 11. QA dirigido

Suite nueva:

`tests/quantity-core.test.cjs`

Cobertura dirigida: **26 casos**.

Incluye:

- export global de navegador;
- consistencia exacta con `FloorPlanSurfaceMetrics`;
- `real`, `estimated`, `pending`;
- perímetro;
- muro físico;
- cero conocido vs desconocido;
- altura de muro inválida;
- hueco incompleto;
- huecos solapados;
- caras de estancia completas;
- asociación parcial;
- asociación no demostrable;
- pared compartida;
- asociación ambigua;
- estancia excluida;
- polígono degenerado;
- conteo de huecos;
- estados existing/new/demolished;
- área por material;
- edificio N plantas;
- proyecto individual;
- legacy;
- versión V1 futura;
- no mutación;
- entradas inválidas;
- unidades numéricas.

Resultado dirigido antes de publicar:

`26 PASS · 0 FAIL · 0 SKIP`.

La CI de la Draft PR debe ejecutar además la suite Node completa y las regresiones existentes que se disparan por cambios en `js/**` / `tests/**`.

## 12. Limitaciones explícitas

1. La asociación estancia↔cara de muro es geométrica porque el contrato no persiste ese vínculo.
2. Geometría importada que no haga coincidir el polígono interior con las caras de muro puede producir resultados parciales/unavailable.
3. No se infieren espesores/alturas/dimensiones estándar.
4. No se modelan capas constructivas ni rendimientos.
5. Los huecos se descuentan solo cuando sus dimensiones persistidas son válidas.
6. No existe todavía lógica monetaria.

## 13. Handoff a 7B

7B debe consumir este módulo, no volver a medir geometría.

El Budget Core podrá mapear cantidades justificables a partidas, pero deberá mantener separadas:

- cantidad geométrica;
- reglas de merma/rendimiento;
- precio;
- procedencia/revisión.

7B no debe modificar la semántica de certeza de 7A para hacer que un presupuesto “parezca completo”.

## 14. Criterio de cierre de 7A

7A puede cerrarse cuando:

- `FloorPlanQuantities` está integrado;
- suite dirigida y regresiones necesarias están verdes;
- no hay schema nuevo;
- no hay mutación;
- no hay dinero/precios/CostProvider;
- Draft PR queda revisada y, posteriormente, autorizada para merge.

Hasta el merge, el estado es **candidato**, no cerrado.
