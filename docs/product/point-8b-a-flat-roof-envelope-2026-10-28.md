# Punto 8B-A — envolvente superior y cubierta plana (candidato)

**Base:** `master` `10872796080a5b731290d45f1a3d6770dd00f7bf` (8A fusionado por PR #121). **Estado:** candidato de revisión; 8B completo no está cerrado.

## Autoridades y algoritmo

`FloorPlanExterior.derive(project)` de 8A decide qué muros son fachada. `FloorPlanRoof.footprint` exige que la clasificación sea completa y que esos muros formen exactamente un ciclo simple, sin ramas ni extremos abiertos. Enlaza sus ejes por extremos reales y desplaza cada tramo hacia el exterior una distancia igual a la mitad del grosor declarado. Interseca los tramos vecinos con límite de miter; una esquina dudosa, una autointersección, un segundo cuerpo o información insuficiente devuelve estado explícito. `Core.geometry().envelope` no se usa como huella ni como fallback.

Antes de triangular se eliminan duplicados consecutivos y colineales, se valida simplicidad, longitud de arista y área, y se fija orientación antihoraria y vértice inicial canónico. La huella no se escribe al proyecto. La cota de cubierta de cada planta exige **igual altura en todos sus muros de fachada**; se suma a `level.elevationMm` en edificio. El máximo de alturas no es una autoridad. `slabThicknessMm` describe el forjado entre plantas y no se toma como espesor constructivo de cubierta.

`FloorPlanBuilding.toBuilding` traslada cada huella por el `offsetMm` contractual antes de comparar plantas. Para dos huellas ortogonales, la compresión de coordenadas de ambos polígonos crea celdas disjuntas; una celda interior a la inferior y exterior a la superior es `exposed-roof`. El solape y el área exterior de la superior (`overhang`) son datos geométricos; no se infieren apoyos ni transitabilidad. La planta superior conserva su superficie superior completa. Para huellas no ortogonales sólo se acepta la equivalencia exacta canónica; un retranqueo no ortogonal queda `unavailable`.

Three.js vendorizado recibe polígonos ya normalizados y usa `ShapeGeometry`. La adaptación invierte el eje de dibujo antes de rotar para obtener normales `+Y`; los tests comparan el área triangulada con el área pura, también para L/U. El renderer actual crea las mallas cuando reconstruye la arquitectura, no en cada frame. «Exterior» es un control reversible de visibilidad con encuadre exterior; el modo Recorrer y Presentación ocultan la cubierta para mantener accesible el interior. PNG/entrega usan la visibilidad de la escena; no se cambia Solar ni su matemática.

## Matriz inicial

| Caso | Resultado | Razón si no disponible |
|---|---|---|
| Rectángulo, L, U y concavidad simple con ciclo de fachada demostrable | supported | — |
| Espesores distintos con esquina inequívoca y miter acotado | supported | — |
| Una planta; dos plantas con igual huella, retranqueo ortogonal, offset, tangencia, solape parcial o voladizo geométrico | supported | — |
| Superficie inferior expuesta pequeña pero válida | supported | Sin umbral de producto |
| Fachada abierta, ramificada o varios cuerpos | unavailable | `open-or-branched-facade` / `multiple-facade-cycles` |
| Clasificación 8A incompleta | unavailable | `incomplete-facade-classification` |
| Alturas superiores diferentes entre fachadas | unavailable | `heterogeneous-top-elevation` |
| Altura de fachada ausente o inválida | unavailable | `invalid-facade-height` |
| Retranqueo no ortogonal distinto | unavailable | `non-orthogonal-setback` |
| Miter patológico o offset exterior que rompe topología | unavailable | `miter-limit` / `invalid-exterior-offset` |
| Polígono degenerado/autointersecado | invalid | `degenerate-polygon` / `self-intersection` |
| Patio o hueco interior no expresable con un único ciclo | unavailable | `multiple-facade-cycles` o clasificación insuficiente |

Los epsilons matemáticos están centralizados en `FloorPlanRoof.EPS`: coincidencia y longitud `0,001 mm`, producto cruzado y área `0,001 mm²`, igualdad de cota `0,001 mm`; miter máximo `4 × semigrosor mayor`. Son límites numéricos, **no** una política para ocultar superficies. No existe umbral de producto de `0,01 m²` ni descarte silencioso de áreas pequeñas.

## Persistencia, tests y límites

No hay campos nuevos en `FloorPlanProjectV1` ni `FloorPlanBuildingV1`; no se persisten mallas, huellas ni superficies expuestas. JSON/ZIP editables conservan los documentos existentes. La cubierta es una capa de visualización y no afirma impermeabilización, aislamiento, estructura, drenaje ni normativa. Una superficie `exposed-roof` no equivale a terraza.

`tests/roof-core.test.cjs`: ciclo/área/offset, rectángulo/L/U, espesores distintos, normalización determinista, extremos abiertos, varios cuerpos, alturas incompatibles, autointersección, miter acotado, superficies de 0,005 m², retranqueos, offset entre plantas, área conservada, ejemplo contractual de edificio sin mutación y triangulación/normal `+Y` con Three.js vendorizado. Suite no browser final: **515 PASS, 0 FAIL, 2 SKIP** (Blender opcional). Chromium: proyecto sintético importado, vista 3D con «Exterior» activado, normal `+Y` y 26,4576 m² verificados; [captura de una planta](../qa/point-8b-a-flat-roof.png). El ejemplo contractual de dos plantas produjo dos celdas inferiores expuestas y una superficie superior, con normales `+Y`; [captura del edificio](../qa/point-8b-a-building.png). Se verificó el apagado reversible del control y no hubo errores ni avisos en consola.

**Límites:** no hay solver booleano general, huecos interiores, múltiples cuerpos, cubierta inclinada ni capa de espesor constructivo. Una clasificación 8A parcial abstiene toda la huella. Los exportadores de geometría independientes del renderer no incorporan esta capa y no deben describirse como exportación de cubierta. 8B-B conserva petos y volúmenes sencillos; 8B-C conserva inclinadas simples sólo si se aprueban parámetros explícitos; 8C conserva parcela, terreno y contexto territorial.
