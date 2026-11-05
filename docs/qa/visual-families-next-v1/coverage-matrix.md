# Visual Families Next V1 — cobertura y elegibilidad

Rama: `feat/visual-families-next-f03-f04-f05-v1`. Base: `ce70f85941e32ba2483ac9bba70d9c4dd674eca2`. Todo sistema nuevo permanece `VISUAL_ONLY` y desactivado por defecto.

| Familia | Estado | Cobertura o límite verificado | Siguiente evidencia |
|---|---|---|---|
| F01 Materiales | R0 / IN_PROGRESS | Se conservan las 50 superficies y sus contratos. `white_stucco` ya aprobado en el ejemplo F03 V1; hormigón sigue albedo-only. | Dos fixtures declarados y propagación por compatibilidad real. |
| F02 Carpinterías | PROTECTED_APPROVED_EXAMPLE | `F02/window-assembly@2` intacto; 12 ventanas compatibles en el fixture histórico. | Control A/B/C y regresión; no se modifica el sistema. |
| F03 Fachadas | R0 / IN_PROGRESS | `F03/facade-material@1` preservado. El fixture histórico sólo tiene un paño compatible; no equivale a toda la vivienda. | Extensión versionada, varios paños compatibles, presupuesto GPU efectivo y FULL/MEDIUM/DETAIL. |
| F04 Iluminación | PENDING_R2 | La luz de presentación y el análisis solar son autoridades separadas. | Piloto reversible con exposición/cámara emparejadas y control del estado solar. |
| F05 Detalles | PENDING_R3 | No duplicar jambas ni alféizares F02. El fixture tiene `roof:false`; `ROOF_JUNCTION_NOT_TESTED`. | Escena controlada sólo para encuentros con soporte geométrico. |
| F06 Paisajismo | NEEDS_SOURCE_DATA | El fixture no declara parcela, terreno exterior ni vegetación. | Sin poblamiento inventado; piloto sólo con datos válidos. |
| F07 Agua | NOT_APPLICABLE_CURRENT_FIXTURE | No hay piscina, fuente, mar ni otro elemento de agua declarado. | Compatibilidad futura; no crear agua ficticia. |
| F08 Vida ambiental | NEEDS_SOURCE_DATA / EDITORIAL_ONLY | No hay actores ni trayectorias reales. | Como máximo piloto editorial opt-in, separado del plano. |
| F09 Arquetipos | FUTURE_VOCABULARY | Las 14 etiquetas Costa Blanca y cinco constructores VECINIA son vocabulario, no catorce sistemas implementados. | Selección de recetas compatibles sin alterar forma ni geometría. |

## Fuentes acotadas consultadas

- `VECINIA-WORLDS@f4efdbea2a230d8b88911796af78bfc6ee630d4`, `visual/src/builders/textures.js:limewashTexture`: variación procedural determinista, recurso compartido y tinte independiente. No se copia su textura ni se sustituye el PBR aprobado.
- El mismo donante, `visual/src/skin/glsl-visual-depth.js:createFacadeDepthMaterial`: correlación de grano/variación y rugosidad. No se porta el parche GLSL: RUBIK ya dispone de mapas estándar y de campos correlacionados en `js/surface-fidelity.mjs`.
- `WORLD-COSTA-BLANCA@1979efc73237fa506090d3c74b8de284af3740ce`, `docs/32-VISUAL-SEMANTIC-META-TOKENS.md`: intención semántica → tokens → receta → runtime → QA. Los tokens no crean datos del inmueble.

## Fixtures declarados

- `tests/fixtures/visual-families-next-stucco-v1.json`: deriva del fixture VQ01 y asigna `surface-white-plaster-02` a nueve muros exteriores compatibles, incluidos dos con ventanas. Es una escena QA, no un proyecto de usuario.
- `tests/fixtures/visual-families-next-rough-v1.json`: asigna `surface-plastered-wall-03` a once muros y exige `rough_plaster_03` + `allowExperimentalVariant:true`. Nunca activa esta variante automáticamente.
- `surface-brushed-concrete` permanece asignado a `wal_ref-w28` como control de exclusión: no se promociona a PBR certificado.

La clasificación, elegibilidad y hashes generados por Chromium se publican en `inventory/`. Los resultados visuales y de regresión se añadirán con su propio hito; este documento no declara aceptación humana.
