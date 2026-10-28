# Punto 8A — Exterior V1 (candidato)

Base: `master` `cc929338b642a65b1f286c91e4b1c2bac72f6260`. El Punto 7 completo sigue abierto en esta base; 8A no incorpora ni reimplementa 7C-E/7D.

## Objetivo y autoridad

Mostrar una primera lectura exterior sin crear otro modelo del edificio. La autoridad es `FloorPlanProjectV1`: ejes/grosor/altura de `walls`, huecos ligados por `wallId`, polígonos y `family` de `rooms`, materiales ya asignados. En edificio, cada `FloorPlanBuildingV1.levels[].project` se deriva por separado; el renderer ya aplica `elevationMm`, `offsetMm` y el marco de la planta activa. No se infiere soporte estructural ni continuidad de cargas entre huellas diferentes.

## Derivación y presentación

`FloorPlanExterior.derive(project)` es pura y no persiste superficies. Para cada muro activo examina tres puntos del eje y la ocupación de estancias interiores a ambos lados, más allá de la mitad del grosor. Una cara ocupada y la otra libre en los tres puntos permite etiquetar fachada; ambas ocupadas indican interior. Sin evidencia consistente devuelve `unavailable`. Una declaración `partition` o `low` impide promover a fachada un muro por una estancia dibujada de forma incompleta; `structure: exterior` por sí solo no prueba el perímetro. Los huecos de fachadas son referencias a los `openings` originales, nunca copias geométricas.

La vista 3D sigue creando los sólidos y los recortes desde `Core.geometry`. La derivación sólo decide el acabado por defecto y la identificación. Un `surfaceMaterialId` existente tiene prioridad y sigue siendo editable con el flujo actual de acabados murales; sin asignación, la fachada recibe un tono neutro. El plano 2D da una etiqueta accesible al muro. `terrace` y `balcony` explícitos mantienen su suelo/material existente y no generan techo; no se inventan desde puertas o ventanas. No se añaden campos al schema, migraciones ni cambios de JSON/ZIP.

## Pruebas y límites

Tests sintéticos: planta asimétrica con habitaciones y muro compartido; huella en L; huecos, material y ausencia de material; veto de tabique; geometría insuficiente; terraza declarada; dos niveles con offsets, elevaciones y huellas distintas; proyecto de referencia 1.0; no mutación. Suite no browser final: 472 PASS, 0 FAIL, 2 SKIP opcionales de Blender. Comprobación visual local en Chromium: ejemplo 3D abre y representa muros/huecos; consola final sin errores ni avisos.

La clasificación es conservadora y puede ser parcial en proyectos con habitaciones no dibujadas o ejes/polígonos poco coherentes. No reconoce plataformas independientes sin declaración geométrica soportada. El contrato actual permite estancia `terrace`/`balcony` y material de suelo, pero no define barandillas, petos, voladizos ni altura propia; no se inventan. El acabado mural existente se aplica a ambas caras y no representa capas constructivas.

8B conserva cubierta, petos y volúmenes. 8C conserva parcela, terreno y fuentes territoriales. 8A funciona offline y no usa `FloorPlanGeoProvider`. No se marca como cerrado hasta aceptación y merge según el proceso del repositorio.
