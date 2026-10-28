# Punto 8B-A — envolvente superior y cubierta plana — CERRADO

**Implementación:** PR #124  
**Base funcional:** 8A fusionado en PR #121  
**HEAD validado de #124:** `780487d4b746319793ba944b5477fa129e6ce9f2`  
**Squash de #124:** `7dc8b41aa21a37ebbb59ccf4855a2f4cbaf5ba4d`  
**Auditoría geométrica final:** PR #126, squash `581da1a24d8600b89ed20c5558cfe6195cafdd49`

## Autoridades y algoritmo

`FloorPlanExterior.derive(project)` decide qué muros son fachada. `FloorPlanRoof.footprint` exige clasificación completa y que los muros de fachada formen exactamente un ciclo simple, sin ramas ni extremos abiertos. Los ejes se desplazan hacia el exterior por la mitad del grosor real declarado y las esquinas se resuelven con miter acotado.

Antes de triangular se normalizan duplicados y colineales, se valida simplicidad, longitud de arista y área, y se fija orientación y vértice inicial canónicos. `Core.geometry().envelope` no se usa como huella ni como fallback.

La cota de cubierta exige una altura superior común demostrable en todos los muros de fachada relevantes. No se usa `max(wall.heightMm)`, la primera altura disponible ni un default como autoridad.

## Contención de las estancias interiores

La auditoría #126 detectó que un ciclo cerrado de fachada no demuestra por sí solo que represente el cuerpo exterior: un patinillo cerrado entre estancias o un ciclo que deja habitaciones fuera podía producir una huella `available` falsa.

La regla final es conservadora:

- se usan las mismas estancias interiores que 8A considera ocupación (`polygon` válido de 3+ vértices, excluyendo `terrace` y `balcony`);
- cada vértice debe quedar dentro o sobre la huella exterior;
- cada arista completa de la estancia debe permanecer dentro o sobre la huella, también en polígonos cóncavos;
- los contactos, vértices tangentes y solapes colineales con el borde se admiten;
- si una arista sale por una concavidad y vuelve a entrar, la huella abstiene.

Motivo final:

`unavailable / room-outside-facade-cycle`

Esta comprobación evita que 8B-B derive volúmenes o petos desde una huella no demostrada.

## Multiplanta y superficies expuestas

`FloorPlanBuilding.toBuilding` traslada cada huella por el `offsetMm` contractual antes de comparar plantas. Para dos huellas ortogonales soportadas, la compresión de coordenadas produce celdas disjuntas y permite derivar:

- `top-roof` de la planta superior;
- `exposed-roof` de la planta inferior donde la superior no cubre;
- área de solape;
- `overhang` puramente geométrico.

No se infieren apoyos, transitabilidad, terraza ni solución estructural.

Para huellas no ortogonales distintas, el retranqueo queda `unavailable / non-orthogonal-setback`. No existe Boolean general ni CSG.

## Triangulación y renderer

Three.js vendorizado usa `ShapeGeometry` sobre polígonos normalizados. Los tests comparan área triangulada con área geométrica y verifican normal `+Y` para rectángulo, L/U y casos soportados.

«Exterior» controla la visibilidad de la cubierta. Recorrer y Presentación la ocultan para mantener accesible el interior y restauran el estado al salir. PNG/captura de entrega reflejan la escena. Solar no cambia su matemática.

## Matriz de soporte final

| Caso | Resultado / razón |
|---|---|
| Rectángulo, L, U y concavidad simple con ciclo de fachada demostrable | supported |
| Espesores distintos con esquina inequívoca y miter acotado | supported |
| Una planta; dos plantas con igual huella, retranqueo ortogonal, offset, tangencia, solape parcial o voladizo geométrico | supported |
| Superficie inferior expuesta pequeña pero válida | supported; sin umbral de producto |
| Fachada abierta o ramificada | `unavailable / open-or-branched-facade` |
| Varios ciclos de fachada | `unavailable / multiple-facade-cycles` |
| Clasificación 8A incompleta | `unavailable / incomplete-facade-classification` |
| Ciclo que no encierra completamente las estancias interiores soportadas | `unavailable / room-outside-facade-cycle` |
| Alturas superiores diferentes | `unavailable / heterogeneous-top-elevation` |
| Altura ausente o inválida | `unavailable / invalid-facade-height` |
| Retranqueo no ortogonal distinto | `unavailable / non-orthogonal-setback` |
| Miter patológico / offset que rompe topología | `unavailable / miter-limit` o `invalid-exterior-offset` |
| Polígono degenerado/autointersectado | `invalid / degenerate-polygon` o `self-intersection` |
| Patio/hueco interior no expresable por el soporte actual | `unavailable` |

Los epsilons siguen centralizados en `FloorPlanRoof.EPS`; son tolerancias numéricas, no umbrales de producto.

## Persistencia, exportación y límites

No se persisten mallas, huellas ni superficies `exposed-roof`. JSON/ZIP conservan únicamente el modelo fuente. La cubierta no afirma impermeabilización, aislamiento, estructura, drenaje ni cumplimiento normativo.

Los exportadores geométricos independientes del renderer no incorporan esta capa y esa omisión debe seguir declarándose de forma honesta.

## Evidencia final

La auditoría final #126, HEAD `d94206b18937c878ab2557ba7e282b975b2a42e8`, terminó con:

- suite Node no-browser local: **528 PASS, 0 FAIL, 2 SKIP** opcionales;
- Chromium relevante: **24/24 PASS**;
- Guided experience, Solar y Multiformat: **SUCCESS**;
- Vercel: **SUCCESS**;
- sin hilos de revisión pendientes;
- mergeable antes del merge.

8B-A queda cerrado dentro del Punto 8B cerrado. Las cubiertas inclinadas simples de 8B-C quedan diferidas por alcance.
