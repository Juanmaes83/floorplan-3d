# bpdp/ · Blueprint 3D y Despiece 3D (candidata)

Generado desde el laboratorio `Juanmaes83/rubik-sculpt-simulator-lab` (BP-DP/premium) con `tools/sync-product.cjs`. No editar a mano: el origen es el laboratorio.

- Demos de la Home: `bpdp/?demo=blueprint` (vivienda de ejemplo) y `bpdp/?demo=despiece` (escena sintética identificada; `&escena=rubik-real` para la vivienda de ejemplo).
- Entregar: `window.BpdpEntregar.card(contenedor, 'blueprint' | 'despiece')` y `window.BpdpEntregar.abrir(modulo, { origen, accion })`. Hasta que Entregar llame a `card()`, solo se monta con `?bpdp=blueprint,despiece` o `localStorage['rubik-sota-bpdp-v1']`.
- Motores del producto reutilizados: three.js de `vendor/three`, `FloorPlanConstructionMp4`, `RubikShotTimeline`, `RubikFinalCore`, `RubikFinalTitulos`, `FloorPlanBrand`.
