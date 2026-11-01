# 0 STATUS / EXECUTIVE RESULT — CUT 1

**Actualización acumulativa Cut 2 (01-11-2026): D01–D13 analizados; D14–D21 pendientes.** Cut 1 permanece congelado en `6a573f1955fd70dd52bb10450c9b9df9b4833aa0`; sus dossiers D01–D08 no se han modificado. La ampliación comienza en §21; la cola §20 se actualiza explícitamente.

**DONOR-CODE GAP ANALYSIS CUT 1 — COMPLETE.** Fecha: 01-11-2026. Cobertura histórica de investigación: **D01–D08, 8/8**. No significa implementación, compatibilidad GPU acreditada ni aprobación visual. En aquel checkpoint D09–D21 estaban pendientes y se añadió sólo este archivo. Atlas, contratos y producto intactos.

| ID | Mechanism | Reuse decision principal | Rubik target | Priority | Implementation order | FT3D-5 dependency |
|---|---|---|---|---|---|---|
| D01 | frame/lens/distance, ángulo corto, desplazamiento óptico | COPY + ADAPT | matemáticas de Story y aplicación de cámara existente | P0 | S1 | integración compartida pendiente; laboratorio independiente |
| D02 | rectángulo de corte, punto de fuga, apertura frontal | EXTRACT MECHANISM | sectionOpen + descriptor de sección | P0 | S2 | sólo reconciliar un futuro consumidor compartido |
| D03 | encuadre de fachada y lente logarítmica | REFERENCE ONLY | elevationOpen; contraste con D01 | P1 | referencia en S1/S2 | pendiente si cambia el encuadre de axon |
| D04 | tinta geométrica, pesos, aparición y wash | EXTRACT MECHANISM | representación temporal sobre las mallas actuales | P1 | S3 | membership/ownership pendiente para axon/exploded |
| D05 | normal/depth/ID, bordes y poché en pantalla | REIMPLEMENT FROM MECHANISM | alternativa de laboratorio a D04 | P1 | S4, decisión comparativa | no bloquea FT3D-5; integración posterior pendiente |
| D06 | caps de extrusión, color y notas de sección | EXTRACT MECHANISM | begin/apply/endSection + anotaciones existentes | P1 | S5 | caps de otras plantas requieren reconciliación |
| D07 | sombra física como hatch, mezcla técnica/material | EXTRACT MECHANISM | representación de fachada; materiales y Solar conservados | P1 | S6 | luz/material compartidos pendientes si los consume FT3D-5 |
| D08 | frente espacial de materialización | EXTRACT MECHANISM | estado de representación + sección/fachada | P1 | máscara pura S2; render S7 | consumo en axon/exploded pendiente |

**What we should reuse.** La relación altura completa–tangente–distancia y la interpolación angular corta de D01, sólo donde no dupliquen la fórmula ya presente en Story. Reutilizar ante todo geometría, framing, rutas, descriptores y transacciones de Rubik.

**What we should adapt.** De D02, la separación entre rectángulo legible y punto de fuga; de D04, tinta y pesos desacoplados de la casa; de D06, cache por topología y notas proyectadas; de D07, hatch filtrado desde la misma sombra; de D08, máscara espacial evaluada desde progreso absoluto.

**What we should reimplement.** El pase técnico D05 para mallas, clipping y materiales reales de Rubik, si gana la comparación de laboratorio. Los adaptadores de ownership, restauración, cargas tardías y coordenadas son Rubik, no módulos donantes enteros.

**What we should reject.** Como autoridad de producto: casas, partes precortadas, etiquetas/cotas, puntos de visita, splines, materiales por posición, sol con fecha ficticia, estructura inferida y límites de mundo del donante. No se rechaza su utilidad como golden master aislado.

**What common infrastructure emerges.** Un vocabulario mínimo de encuadre en metros con altura **completa**, una base espacial para máscara/progreso y un lease temporal de representación sobre recursos existentes. Son responsabilidades propuestas, no nombres/API aprobados. No aparece evidencia que justifique otro renderer de producto, otra Story ni tres sistemas de cámara.

**What must wait for FT3D-5 final HEAD.** Ownership de niveles y grupos globales, transforms temporales, anchors, coexistencia de efectos, estado de cámara y restore. **PENDING FINAL FT3D-5 HEAD RECONCILIATION**; el trabajo V2 sigue independiente y no recibe nuevos gates retroactivos.

# 1 Scope & Rules

Investigación de código y diseño de adaptación, sin extracción al producto ni Sculpture Lab implementado. Se leyó **íntegro** el Atlas canónico, líneas 1–851, antes de analizar código. Se usó como índice; los dossiers siguientes proceden de las funciones reales. No se repiten la auditoría de procedencia ni la campaña de 14 rutas, vídeos o regresiones de producto.

Worktree propio: `C:/Users/temp123/work/floorplan-3d-donor-gap-analysis`. Rama propia: `docs/ft3d-donor-code-gap-analysis-2026-11-01`. No existía al inspeccionar. Creada con `git worktree add -b … <path> 7696fb2…`. No se inspeccionó el working tree de Claude ni su implementación FT3D-5. El listado de worktrees se consultó únicamente para aislamiento. No reset, clean, rebase, merge ni PR.

Se preservan Core.geometry, proyecto/Building/niveles/Exterior, materiales autorizados, Solar, PresentationStory, rutas y lifecycle. Efecto futuro OFF → comportamiento actual sin cambios. Ningún campo nuevo persistente, red, schema, modelo geométrico paralelo ni precisión inventada se deduce de este estudio.

# 2 Fixed Evidence Manifest

| Autoridad | SHA / estado fijado | Comprobación y uso |
|---|---|---|
| Atlas | `7696fb2c6c30f158001d38ecc53feb2674acaa25` | HEAD del worktree Atlas, limpio y publicado; leído completo; sólo añade el Atlas |
| Padre directo y baseline Rubik | `5f4e3d20e905f5f302783f67fda0ab4a7eb21371` | `HEAD^` del Atlas coincide; fuente productiva del nuevo worktree idéntica a este master |
| origin/master tras fetch | `5f4e3d20e905f5f302783f67fda0ab4a7eb21371` | registrado al inicio; no se usa un master flotante para conclusiones |
| Rama nueva al inicio | `docs/ft3d-donor-code-gap-analysis-2026-11-01`, HEAD `7696fb2…` | status limpio, sin upstream todavía |
| Flat-to-3D, fork/upstream | `d7b9b69753d3af679535ee56695a05c8d955c3c6` | checkout externo `…/ft3d-reference-workspace/flat-to-3d`, limpio; LICENSE releída; procedencia heredada del Atlas |
| FT3D-5 V2 + adenda | `a0b6b0d6c3c8d8475e99a43a6f137afe9c355e8b` | contrato documental de `docs/ft3d-5-axon-exploded-contract`; `git show` contrastado; implementación WIP / NOT CANONICAL |

**Convención de evidencia.** `F:path:Lx–y/symbol` significa fuente donante en d7b9b69; `R:` significa baseline Rubik en 5f4e3d2. Los rangos son localizadores, no versiones distintas. Enlaces raíz: [donor fijado](https://github.com/Juanmaes83/flat-to-3d/tree/d7b9b69753d3af679535ee56695a05c8d955c3c6), [Rubik fijado](https://github.com/Juanmaes83/floorplan-3d/tree/5f4e3d20e905f5f302783f67fda0ab4a7eb21371), [Atlas canónico](https://github.com/Juanmaes83/floorplan-3d/blob/7696fb2c6c30f158001d38ecc53feb2674acaa25/docs/product/ft3d-reference-atlas-2026-11-01.md).

Abreviaturas de rutas usadas después: `F:01/` = `01-exploded-house/`, `F:02/` = `02-section-sweep/`, `F:03/` = `03-open-section/`, `F:07/` = `07-sunlit-elevation/`; `R:story-core` = `js/presentation-story-core.js`, `R:section-core` = `js/presentation-section-core.js`, `R:elevation-core` = `js/presentation-elevation-core.js`, `R:surface renderer` = `js/surface-renderer.mjs`. `index` es `index.html`. Los símbolos prevalecen sobre un número de línea aproximado.

**Evidencia nueva fuera de producto:** `C:/Users/temp123/work/ft3d-reference-workspace/evidence/cut1/`. `dependencies.json` guarda URL, HTTP, bytes y SHA-256 de versiones concretas; `deps.cjs` reproduce descarga/manifest. `probe.cjs` ejecuta funciones reales extraídas sin editarlas, Three local r160 y compara ShaderChunk con r160.1/r169; resultados `mechanism-probes.json`. `specialize.cjs` ejecuta resolve/mix/camAt reales, resultados `specialization-probes.json`. No son tests de integración ni GPU.

**Hipótesis y resultados reproducibles, sin repetir browser:**

1. D01, target=(0,0,0), altura completa=20 m, az=90°, elevación=0, landmark=(0,5,0), FOV=1.5/30/60°. NDC y = .5/.5000000000000001/.49999999999999994. Misma prueba con landmark z=-5: .4967486023/.4409269852/.3879953811. **Invariante en el plano encuadrado; no en toda la casa profunda**. Prueba de proyección real con matrices Three; no necesita rasterizado.
2. D01 350°→10° pasa por 360°, lente intermedia sqrt(1.5×60)=9.48683298°. Evaluar cinco p en avance y orden inverso produce estados idénticos. `roll` se devuelve pero applyCam no lo usa. Con posición explícita a 10 m, h=20,w=100,aspect=1600/900,FOV=60, D calculada=48.71392896 aunque el ojo sigue a 10 m: no transportar esa combinación como fit válido.
3. D02 rect=[-10,-5,10,5],1600×900,at central: frameH=**5.625 m de semialtura**. Mix 1.6°→64° en .5 da 35.42867416°, D=17.61023910; no es la media logarítmica de D01/D03.
4. D03 yaw350°→10° en .5 da **180°**, no giro corto. fh20,fov2→50 da fh20,fov10. `setCam` no contiene shift. Son diferencias observadas del algoritmo, no fallos reproducidos del producto.

Runtime anterior se referencia, no se vuelve a contar: Atlas E-runtime 14 rutas/84 capturas, E-rubik 73 puros y 2 casos browser PASS en el baseline; no ejecutados de nuevo aquí. SwiftShader acredita observación visual, no coste en GPU física. No hay una pregunta de render que pueda resolverse honestamente sin construir el adapter; queda gate del laboratorio.

# 3 Method / Reuse Classification

Secuencia aplicada: rutas/símbolos/imports con rg → callers y helpers → lectura profunda de unidades → estado/cleanup → fórmulas → comparación con Rubik → pruebas matemáticas concretas → decisión. No se deduce comprensión de un conteo automático. Las categorías son excluyentes **como decisión principal de cada dossier**, aunque se rechacen subpartes.

| Categoría | Significado en este corte |
|---|---|
| COPY + ADAPT | fórmula/unidad pequeña separable; atribución y adaptación explícitas; no importar el módulo con sus singletons |
| EXTRACT MECHANISM | separar técnica útil de responsabilidades/datos de demo antes de integrar |
| REIMPLEMENT FROM MECHANISM | conservar idea demostrada pero escribir pipeline propio compatible con autoridades existentes |
| REFERENCE ONLY | contraste/golden master; no portar otra implementación redundante |
| DEFER | no implementar hasta una dependencia material posterior |
| REJECT | contenido o autoridad inapropiada; permiso legal no basta para incorporarlo |

Tipo A puro: distancia y giro corto D01. Tipo B mezclado: D02/D04–D08, técnica con renderer/geometría/estado demo. Tipo C: coordenadas/casas/etiquetas/fechas, **REJECT AS PRODUCT AUTHORITY** en los ocho dossiers. D03 se conserva como referencia de especialización, sin necesidad de copiarlo.

## 3.1 Compatibilidad real de dependencias

Rubik usa importmap **local** `vendor/three/build/three.module.js`, manifest **0.160.0**, `REVISION='160'`, y closure local de addons. Fuente: R:index:453–456, scripts/vendor-three.cjs, vendor/three/manifest.json y LICENSE. No actualizar Three como consecuencia de este documento.

| Donor dependency | Donor version | Rubik equivalent/version | Compatible directly? | Adaptation | Risk |
|---|---|---|---|---|---|
| Three D01/D04 | CDN 0.169.0, index01:14–15 | local 0.160.0 | fórmulas sí; módulo/render no acreditado | mismo THREE del host; extraer math; probar shaders en r160 | MEDIUM para math; HIGH para shader port |
| Three D05/D08 | CDN 0.160.0, index02:287–288 | misma versión local | APIs presentes; pipeline no es drop-in | addons ausentes + layout ND/clipping/color space propios | HIGH |
| Three D02/D06 | CDN 0.160.1, index03:276–277 | 0.160.0 | chunks relevantes iguales en comparación de fuente | no importar casa/Lambert ni renderer propio | MEDIUM/HIGH |
| Three D03/D07 | CDN 0.160.1, index07A:47–48 (B/C usan mismo engine) | 0.160.0 | math sí; material patch no probado en Rubik | validar clases/material maps/orden de hooks | MEDIUM/HIGH |
| LineSegments2/Geometry/LineMaterial | addons de la misma versión de cada familia | no vendorizados; sólo BufferGeometryUtils ya existe | no, imports faltan | eventual closure r160 local y avisos, o líneas propias; sin segundo THREE | MEDIUM |
| FXAAShader / EffectComposer / RenderPass / GTAOPass / OutputPass | 0.160.0 | no están en closure Rubik | no, imports faltan | estudiar mínimo técnico D05, no añadir AO/shafts por reflejo | HIGH |
| Lenis, import estático en engine07:18 | 1.1.14 | Story/controles Rubik, sin Lenis | no necesario | excluir runner `run`; no añadir scroll smoothing | LOW si excluido |
| Chakra Petch / IBM Plex Mono | Google Fonts, pesos declarados; CSS sin versión de binario fijada | tipografía/UI existentes | no requerido | usar fuentes Rubik; no copiar binarios/CDN | LOW si excluidas |
| procedural textures, entourage, casas | JS donante, SHA fijo | materiales/GLB autorizados | no como dato | excluir paletas/meshes/copy de demo; mantener catalogue | HIGH si se confundieran con datos |

Comparación ejecutada: los **12 chunks** project_vertex, clipping_planes_fragment, map_fragment, color_fragment, worldpos_vertex, shadowmap_pars_fragment, shadowmask_pars_fragment, roughnessmap_fragment, normal_fragment_maps, aomap_fragment, dithering_fragment, colorspace_fragment existen en las tres versiones; **12/12 iguales r160 vs r160.1**. En r169 cambian clipping_planes_fragment, shadowmap_pars_fragment y shadowmask_pars_fragment; los otros nueve coinciden. Presencia de anchors `void main() {`, color_fragment, instanceStart/End en LineMaterial r160/r169 confirmada; sus archivos completos difieren. Eso no prueba compilación/composición de hooks.

Además se comparó el **blob Git** de `vendor/three/build/three.module.js` del baseline con el módulo CDN0.160.1: byte idéntico, SHA-256 `76dea8151bc9352aef3528b4262e249b2604f62543828328db978d060d61a495`, 1.272.972 bytes. La diferencia de etiqueta0.160.0/0.160.1 no demuestra diferencia de ese engine concreto; **no extiende identidad a todos sus addons ni a la composición de materiales del producto**. Se mantiene manifest/importmap Rubik0.160.0.

D04 parchea project_vertex, clipping_planes_fragment y map_fragment; patchLine depende del shader instanciado de LineMaterial. D06 usa common/color_vertex/colorspace_fragment y atributos propios; D07 además worldpos, shadowmask, roughnessmap, normal_fragment_maps, aomap y dithering. D07 mezcla **después** del dithering (normalmente tras tone mapping/color space), D06 antes del colorspace, D05 compone valores de papel sRGB directamente y consume OutputPass del real. No unificar estos espacios como si todos fueran lineales.

r169 requiere WebGL2 en el renderer; r160 conserva camino WebGL1. D05 requiere target RGBA FloatType renderizable (EXT_color_buffer_float en WebGL2; comprobar soporte efectivo/FBO, no sólo existencia de FloatType). `fwidth/dFdx/dFdy` también condicionan WebGL1/extensiones. Futuro adapter debe gatear capacidad y caer a representación actual. D01–D03 math no necesita extensiones.

No se encontraron `customDepthMaterial` ni `customDistanceMaterial` en las unidades de D01–D08 y sus renderers relevantes. D06 sí declara `clipShadows:true` en faces. Si una futura máscara descarta geometría o cambia alpha, decidir/probar explícitamente coherencia de sombra con depth/distance para luces direccionales/puntuales. Una mezcla de color sola no exige ocultar el caster físico.

## 3.2 Licencia y futura atribución

F:LICENSE releída completa: MIT ©2026 Samnang Aing, conservar copyright y permiso en copias/porciones sustanciales, con disclaimer AS IS. **No relicencia terceros**. Three mantiene MIT propio (Rubik vendor/three/LICENSE, ©2010–2023; r169 header ©2010–2024). [Licencia oficial Three r169](https://github.com/mrdoob/three.js/blob/r169/LICENSE). Lenis 1.1.14: MIT ©2024 darkroom.engineering, texto del paquete descargado y hash en dependencies.json; [fuente oficial Lenis](https://github.com/darkroomengineering/lenis/blob/v1.1.14/LICENSE).

Fuentes declaradas: [Chakra Petch OFL1.1](https://github.com/google/fonts/blob/main/ofl/chakrapetch/OFL.txt), ©2018 autores del proyecto; [IBM Plex Mono OFL1.1](https://github.com/google/fonts/blob/main/ofl/ibmplexmono/OFL.txt), ©2017 IBM, nombre reservado Plex. Textos consultados y hashes guardados; **binarios específicos servidos por Google no fijados/auditados ni propuestos para copiar**. No se necesitan para ningún mecanismo. No hay assets externos de imagen obligatorios en estas unidades: texturas/entourage son procedurales; no se extiende este hallazgo al resto del repositorio.

Shaders contienen hashes/noise convencionales sin atribución individual de snippet. No se encontró aviso que identifique otro origen en los archivos inspeccionados; **no se afirma autoría original de cada fórmula**. Una extracción literal futura debe conservar MIT, revisar el fragmento exacto y cualquier notice descubierto; si no puede aclararse procedencia de un snippet material, reimplementarlo desde el mecanismo, sin copiar su expresión. Este corte no redistribuye código.

Rubik no tiene un THIRD-PARTY-NOTICES central identificado por inventario. Sí tiene patrón verificable: vendor/<dependencia>/LICENSE + manifest con hashes (Three/SunCalc), headers SPDX originales, assets/materials/licenses + catálogo de procedencia y atribución visible, docs/technical/surface-material-library.md y README «Legal y uso». Recomendación futura: licencia donante íntegra en `vendor/flat-to-3d/LICENSE`, manifest de fragmentos/SHA/transformaciones y header en cada unidad derivada; registrar créditos en documentación técnica/Legal cuando se integre. Si se prefiere otra ubicación, debe conservar el texto junto a la distribución. **No se crea aún ninguna de esas rutas ni se altera la licencia del producto.**

# 4 Relevant Rubik Baseline

| Concepto | Fuente verificada en R@5f4e3d2 | Autoridad y límite para adaptación |
|---|---|---|
| Geometría y unidades | js/project-core.js:geometry; index:buildArch/wallBox/buildFurniture | plan mm; wx/wz restan OX/OY y convierten a metros; no reemplazar por piezas de casa donante |
| Building y niveles | building-core:LIMITS, building-ui:presentationSources:36; index:buildLevels/levelSlab | máximo dos niveles; activo en y=0 y restantes relativos. presentationSources clona proyectos/geometría/revisión/elevación/offset, **no incluye slabThicknessMm**; no inventar ese campo al consumirlo |
| roomFrame | presentation-core:75–176 | candidatos orientados por polígono, muebles y oclusores; fit en región libre y lower section declarada; devolver eye/look plan mm y altura m; no sustituir por rect genérico |
| presentationFrame / overviewPose / presentationStopPose | index:4334/4345/4361 | cache por geometría, región/aspect/cut; overview prueba ocho esquinas y aumenta distancia; dirección [.42,.84,.34]; punto de llegada real, no key donor |
| Story | presentation-story-core:sectionOpen:125, elevationOpen:190; index:presentationStoryBegin:4551/Apply:4607/endPresentationStory:4630 aprox. | stateAt puro; misma cámara; snapshot posición/quaternion/target/fov/near/far/orbit; finalizar restaura lens/límites/grupos, keepPose decide posición |
| Sección | presentation-section-core:derive/buildingAxis/crossings; index:4651–4688 | candidatos .5/.4/.6; huecos, muros activos, rooms; clipping edificio, no terreno. Caps del nivel activo construidos en plano destino, visibles tras hold; otras plantas sin caps |
| Fachada | presentation-elevation-core:derive/outward; index:4695–4728 | Exterior determina fachada; normal derivada de ocupación, sectores45°; default largo→huecos→orden, no «principal». Encuadre usa edificio, no muebles |
| Section continuity existente | story-core:SECTION_OPEN/sectionOpen | frontal, frame0 fijo en dolly .45–.68, tan en log, giro al overview; p1 conserva corte hasta End. No es dibujo técnico ni scan |
| Elevation continuity existente | story-core:ELEVATION_OPEN/elevationOpen | frontal4°, perspectiva oblicua derivada/fitted, vuelta exacta p0/p1; luz snapshot opcional, upper levels y contexto temporales |
| Rutas | presentation-route:plan/choreography; index:presentationRoute | entrada/altura y obstáculos, grid con clearance220mm default, segmentos/suavizado validados; aerial/unavailable explícitos. No sustituir por CatmullRom demo |
| UI/lifecycle | presentation-ui:fullStory546, holdsOf555, enterScene613, closeStory680, invalidate953, resize988 | player único, ARIA/teclado/Back, cambio de nivel/epoch, resize recrea narrativa y p; no asignar scroll del documento como nuevo propietario |
| Materiales | surface-catalog:validate/get; surface-renderer.mjs:SurfaceRenderer | MeshStandardMaterial con appearance y mapas locales verificados SHA/MIME/dimensiones, cache/AbortController/textures/bitmaps/dispose. Material compartido y carga tardía exigen lease; no sobrescribir catálogo |
| Luz | solar-renderer-adapter:apply; index:applyLight/applyElevation/endElevation | sólo available-orientative; snapshot no recalculado, savedSolar se restaura. Luz visual de hatch no es cálculo Solar |
| Renderer | index:init2522 y contextlost2525 | r160 local, DPR≤2, ACES exposición1.05, sombras PCFSoft, CSS2D; pérdida contexto aborta 3D; no renderer nuevo por efecto |

Dependencias necesarias revisadas: Building/Exterior y su conversión al marco activo, superficies/procedencia, ruta, grupos de renderer y transacción de sección/fachada. No se auditó código WIP FT3D-5. `js/surface-core.js` sigue siendo métricas, no autor de materiales.

**Contrato transversal futuro de seguridad (T0, aplica a todos los dossiers N):** proyecto y Building antes/después iguales; misma identidad de geometría y materiales al salir; p 0→1 y 1→0 por checkpoints y saltos desordenados; close/cancel/Back/rebuild/entrada fallida; resize en hold y en transición; reduced por holds/estados discretos; escritorio y móvil portrait/landscape; uno/dos niveles con offsets; datos insuficientes con razón y fallback actual; OFF sin nuevos passes/targets/hooks/recursos. WebGL/context loss donde exista recurso GPU; en matemática pura se prueba en wrapper, no se simula como propiedad de una fórmula. Captura y export existentes conservan sus permisos/atribuciones. No hay nuevas pruebas productivas en este corte documental.

# 5 D01

## A. Identity

**ID:** D01; familia 01-exploded-house. **Files:** core.js:301–355, main.js:119–146. **Primary symbols:** eyeKey, camAt(keys0,p), applyCam(c,R=80); helpers V,D2R,clamp,lerp,ease,ctx.phone/W/H. **Call graph:** main.step → S.update/intro → camAt(S.keys,p) → applyCam(state,S.R) → camera.updateProjectionMatrix/inverse → labels.update → renderer.render. Las claves las entrega build de dir-a/b/c; sólo se lee su contrato de datos, no sus mecanismos D09–D11. **License:** MIT donor; Vector/Camera/Matrix Three MIT independiente.

## B. Behaviour

Evalúa claves absolutas; escoge override `ph` en ancho<700. Interpola target/dirección/lente/frame o una rama de ojo explícito. Aplica PerspectiveCamera existente en el módulo. Mantiene escala del plano perpendicular al eje en el target cuando frame y target se conservan; no inmoviliza todos los landmarks en profundidad. Shift desplaza proyección sin girar cámara. No resuelve colisiones, selección de habitación ni encuadre de volumen con oclusiones.

## C. Data Flow

keys `{at,t,az,el,h,fov,w?,sx?,sy?,pos?,laz?,lel?,ldist?,ph?,easeFn?}` + p + viewport → intervalo/easing → estado interpolado → h efectiva/D/pose/proyección → imagen/labels. eyeKey(E,T) convierte pose de ojo a los dos contratos. Unidades de demo: mundo en metros, ángulos en grados, h/w completas, sx/sy en términos de matriz (no metros).

## D. State & Lifecycle

camAt no muta claves; asigna arrays nuevos y lee ctx global. applyCam muta camera.position/up/fov/aspect/near/far/projectionMatrix/Inverse/userData.D. No aplica `roll` aunque camAt lo devuelve. El renderer/scene/camera se crean al importar core; main registra resize y RAF. No Begin/End, cancel ni dispose de cámara necesario; no snapshot para devolver el control a un editor. Reverse de la función es reevaluar p, no deshacer deltas. La transacción Rubik debe poseer cualquier mutación nueva.

## E. Dependencies

Internas: helpers anteriores, viewport ctx y camera singleton; fog/labels usan D después. Externas: Three0.169.0, DOM/innerWidth por módulo. La unidad matemática aislada no necesita renderer, Labels, Part, materiales, luces, fonts, assets ni Lenis. No importar core entero para obtener dos funciones.

## F. Mathematical / Rendering Mechanism

Sea e=ease(clamp((p-a.at)/(b.at-a.at))). Azimut `a.az + wrap180(b.az-a.az)*e`; target LERP. `fov=exp(LERP(log fovA,log fovB,e))`, `h=exp(LERP(log hA,log hB,e))`; exige valores positivos. `H=max(h,w/aspect)`; `D=H/[2 tan(fov π/360)]`. Offset es `[D cos(el)cos(az), D sin(el), D cos(el)sin(az)]`. near=max(.04,D−R), far=D+3R. Proyección recién calculada: elementos8−=sx y9−=sy; invertir después. Con cámara frontal, altura normalizada=2y/H para puntos del plano target, independiente de fov; en otra profundidad depende de D.

Rama pos: LERP de ojo, look az corto, look elev/dist lineales; target reconstruido desde look. h=2·ldist·tan(fov/2), pero **applyCam no recoloca pos al aumentar H por w**: pueden divergir distancia real y D usada para clipping/fog. No adoptar esa combinación sin contrato explícito. La matriz no evita convergencia vertical si se inclina el ojo; shift por sí solo no convierte toda vista en paralela.

## G. Demo Assumptions

R default80 m, near .04 m, far +3R, Y-up, az cero sobre +X, breakpoint700px, claves y ojo de casa, tiempos normalizados del scroll, FOV inicial 1.5°/2.2° por variante. El ancho mínimo es un fit de plano, no Box3. Nada de esto acredita bounds/recorrido del proyecto. Roll no implementado y posiciones mixtas entre claves tampoco garantizan transición de ruta.

## H. Reusable Core

Fórmula H/fov/D, log para valores positivos, ángulo corto y aplicación coherente de shift/inverse. Extraer sin singleton ni claves. Rubik **ya usa** frame/2/tan y tan log en section/elevation: principal valor adicional es formalizar unidades/invariantes y comparar, no reemplazarlo todo con otra función camAt.

## I. Reuse Decision

**COPY + ADAPT**, restringido a helpers matemáticos mínimos que falten y su atribución. Mantener fórmulas existentes equivalentes en Rubik; no copiar applyCam literal con clipping por R, cámara global ni rama pos inconsistente. Código legalmente copiable no vuelve obligatorio introducir una dependencia.

## J. Rubik Authority Mapping

| Donor concept | Rubik authority | Existing? | Adapter needed? |
|---|---|---|---|
| target/bounds | roomFrame, presentationStopPose, descriptores | sí | conversión mm→marco activo en m |
| frame/lens | story-core sectionOpen/elevationOpen | sí | vocabulario de altura completa, no segunda cámara |
| keys/eye | PresentationStory + route.plan/choreography | sí | consumir anchors/poses validadas, no claves demo |
| shift y near/far | View3D cámara/region/snapshot | parcialmente | lease de proyección/view offset si se añade shift óptico |

## K. Preserve / Replace Map

PRESERVE geometría, roomFrame, overview/end pose, Story, planner y lifecycle. CANDIDATE REUSE distancia y wrap corto. REPLACE ctx/keys/R/near/far por viewport regional/bounds reales y límites aprobados. DO NOT USE spline/posiciones como ruta; no modificar Core.geometry para encajar el frame.

## L. Exact Adaptation Blueprint

**Inputs:** pose/target de narrativa, altura completa y ancho derivados, aspect/region, bounds reales y p. **Outputs:** pose/lens/near/far y shift opcional validado, sin render propio. **Owner/state:** evaluador puro dentro del flujo Story; View3D posee cámara y lease. **API boundary:** no persistencia, ni selección de target dentro del helper. **Hook:** Begin captura lens/up/view/projection si se amplía el estado actual; Apply calcula desde p; End restaura, incluso fallo parcial. **Reverse:** mismo p→mismo estado, sin acumulación. **Restore:** incluir camera.view/shift/up si se usan, ya que snapshot actual no los guarda; actualizar inverse. **Resize:** recrear fit con nueva región y mismo p. **Fallback:** pose Rubik actual si altura/FOV/bounds inválidos; no pos+width silencioso. **Reduced:** holds del player, sin dolly obligado. **OFF:** no tocar proyección ni fitting actual. Cualquier uso FT3D-5: PENDING FINAL FT3D-5 HEAD RECONCILIATION.

## M. Risks

Architecture: duplicar fitting/ruta, MEDIUM. Visual: falsa invariancia de volumen, MEDIUM. Performance: **LOW RISK**, cero passes/targets/texturas/clones adicionales; trigonometría y matrices por Apply, sin recompilar shader; no geometría que disponer. Precision: FOV diminuto y near/far demo, MEDIUM. Mobile: ancho mínimo y región, MEDIUM. WebGL: math independiente; wrapper/context loss debe cancelar, LOW. Accessibility: movimiento sólo opcional/holds. Maintenance: dos convenciones de azimut/shift si no se explicitan. License: MIT + headers; no fuentes/assets necesarios. Coste de escena permanece UNKNOWN — MEASURE IN SCULPTURE LAB; SwiftShader no presupuesto físico.

## N. Tests Required

T0 completo. Puros: factor2, h/w/aspect, 350→10, FOV positivo, endpoints, frames oblicuos/profundos y pos+width rechazado. Browser: landmarks del plano y Box3 interior, shift→inverse/raycast y volver a proyección previa, resize portrait/landscape, cancel en mitad de dolly, context loss en wrapper, dos niveles/offset/no bounds y OFF exacto. No prometer que los puntos profundos son invariantes; probar cambio esperado. Reduced usa holds y teclado.

## O. Sculpture Strategy

S0: congelar 01 y estados golden master existentes. **S1:** aislar eyeKey/intervalo/altura/D/giro sin renderer. **S2:** reproducir claves de 01 en lab con la misma Three/viewport, comparar landmarks y matrices, no sólo still. **S3:** quitar únicamente R fijo. **S4:** sustituirlo por bounds del descriptor Rubik y clipping apropiado. **S5:** sustituir claves/ctx/shift de demo una a una por anchors/región Rubik, eliminar dependencia del singleton; comparar contra Story existente antes de decidir qué helper realmente falta. S6–S10 en §16.

## P. Evidence

F:01-exploded-house/core.js:301–355 y413–420; main.js:119–146. R:story-core:125–171/190–247, index:4334–4369/4551–4644. SHA según §2. `mechanism-probes.json`: cinco estados forward/reverse iguales, invariancia planar y contraejemplo profundo/pos explícita. No nueva medición GPU.

## Q. Confidence

**HIGH** en mecanismo y duplicación existente: lectura completa de funciones y ejecución matemática con Three. **MEDIUM** para propuesta de shift compartido: aún sin adapter/lifecycle ni evaluación humana; no constituye aprobación para cambiar cámaras actuales.

# 6 D02

## A. Identity

**ID:** D02; 03-open-section. **Files/symbols:** engine.js:561–622 resolve/place, page.js:92–110 mix/stateAt, PLAN/HERO:21–85. **Call graph:** page frame → stateAt(vh) → PLAN desk/phone.map(E.resolve) → mix → E.place → updateCaps y estado de color/fog → E.notes/render. Resolve llama bands; place usa camera/setViewOffset, planes/sprites/cache de sombra (parte D06). **License:** MIT donor + Three0.160.1 MIT; fuentes UI excluidas de extracción.

## B. Behaviour

Mantiene cámara **frontal al plano z=cut**, sin órbita, aun con lente amplia. Encuadra un rectángulo en una posición de pantalla y permite otro punto de fuga `vp`. Abrir lente cambia profundidad aparente detrás de la sección, conservando su tamaño si rect/frame no cambia. PLAN puede además trasladar/variar rect: la demo no mantiene el mismo corte inmóvil durante toda la visita. No es un algoritmo de navegación interior válida.

## C. Data Flow

rect=[x0,y0,x1,y1], at opcional, vp opcional, lens/cut/fog + viewport → resolve en centro/semialtura → mix por tracks(vh) → place(S) → ojo/proyección/fog/plano de corte y lectura ppm. Datos espaciales en m, at en fracciones CSS de pantalla (Y abajo), frameH **semialtura**; no confundir con D01/D03.

## D. State & Lifecycle

resolve/mix devuelven objetos sin mutar inputs. stateAt recalcula lista resuelta con viewport actual; progreso desde scroll real/vh. place hace Object.assign a S persistente, muta cámara/view offset, cut/reveal planes, fog, caps y agua/vidrio/sprites. Parámetros omitidos pueden conservar estado anterior; wrapper Rubik deberá emitir estado completo. Engine crea renderer/cámaras/escena una vez, resize actualiza tamaños; no End/dispose global. Reaplicar p devuelve cámara, no cancela timers de captions en page. No adoptar su page lifecycle.

## E. Dependencies

Internas: bands, S, cutPlane/revA/B/C, updateCaps, spriteMeshes, lineMats, colourX y house. La matemática resolve/mix/place-camera se puede separar de esos efectos. Externas: PerspectiveCamera.setViewOffset de Three0.160.1, DOM/Canvas2D y viewport en engine completo; sin Lenis. No exige house/entourage/fonts para framing aislado.

## F. Mathematical / Rendering Mechanism

Con at: `fh=max((y1-y0)/2,(x1-x0)/(2aspect))`. Sin at: reserva mt/mb, free=H−mt−mb, `fh=max((y1−y0)H/(2free),(x1−x0)/(2aspect))`, at=[.5,(mt+free/2)/H]. `cx=midX−(at.x−.5)2fh·aspect`; `cy=midY+(at.y−.5)2fh`. vp default=[cx,cy]. Mix interpola cx/cy/fh/vp/cut/fog linealmente; `lens=2atan(LERP(tan(lensA/2),tan(lensB/2),t))`. StateAt usa smoothstep de cada intervalo, no log-FOV.

`dist=fh/tan(lens/2)`, ojo=(vx,vy,cut+dist), mira(vx,vy,cut); `ppm=H/(2fh)`. View offset=(cx−vx)ppm, −(cy−vy)ppm con fullWidth=W,fullHeight=H. near=max(.05,.6dist), far=dist+160; fog=[dist,dist+S.fog]. Al generalizar, construir base tangente/up/normal del descriptor y expresar vp/rect en ella; no girar una z mundial hardcoded. El margen sólo vertical de bands no sustituye toda region Rubik.

## G. Demo Assumptions

HERO rect[-10.9,-5.8,37.9,22.2], vp[13.4,4.2], cut−4.6, lens1.6/fog34; PLANa1600vh y PLANc1250vh; coordenadas/tres niveles/rooms/visitas de esa casa. Breakpoint700, bands[66,132] móvil/[80,104] desktop. near .6D y far+160 no valen para todo proyecto; eje frontal fijo +Z y alturas de plantas ajenas no se trasladan.

## H. Reusable Core

Separación «rect legible»/«punto de fuga», ajuste por región y blend de tangente para apertura frontal. Rubik sectionOpen ya conserva frame durante dolly y deriva plano; no adoptar PLAN, camera owner o generación de caps de la demo para conseguir esto.

## I. Reuse Decision

**EXTRACT MECHANISM.** Encapsular matemática de región/punto de fuga como especialización de cámara existente. No portar createEngine ni imponer el calendario scroll. La interpolación de tangente es alternativa visual a comparar, no corrección automática al tan log actual.

## J. Rubik Authority Mapping

| Donor concept | Rubik authority | Existing? | Adapter needed? |
|---|---|---|---|
| rect/cut | section-core descriptor + builtTop | sí | frame local tangente/normal/up |
| region/bands | presentation-ui:viewRegion + Story | sí | región real; sin pixel bands fijas |
| lens/target | sectionOpen + end overviewPose | sí | vp opcional derivado, no posiciones donor |
| per-room visit | route.plan/choreography / roomFrame | sí | fuera del mecanismo: no afirmar paseo a través del corte |

## K. Preserve / Replace Map

PRESERVE descriptor/huecos/offset/end pose, scope de edificio y player. REPLACE rect/PLAN/vh/bands/vp fijos por dato derivado y región disponible. CANDIDATE REUSE relación fh/lens/view offset. DO NOT REPLACE routing ni política de sección por visitas de tres plantas.

## L. Exact Adaptation Blueprint

**Inputs:** descriptor de sección actual, altura construida, región/aspect, anchor overview, p y opcional punto focal real. **Outputs:** pose frontal/cámara, sin modificar plano descriptor. **Owner/state:** sectionOpen puro y lease de cámara View3D, no engine. **Boundary:** separar camera placement de colour/caps/sprites que place mezcla. **Begin:** validar descriptor/snapshot de camera.view; **Apply:** estado completo, convertir semialtura a altura completa al cruzar frontera; **End:** restaurar view offset/proyección y cámara. **Reverse:** evaluación absoluta, mismo vp derivado; **resize:** región nueva y p retenido; **fallback:** sección actual sin shift cuando no hay focal válido; no inventar habitación. **Reduced:** hold frontal/corte final actual; apertura opcional discreta. **OFF:** no cambia sectionOpen existente. Reconciliar FT3D-5 sólo si consume helper compartido, pendiente final.

## M. Risks

Architecture: place acopla cámara/caps/luces, HIGH si se porta completo. Visual: confundir cambio de rect con dolly invariante, MEDIUM. Performance: cámara aislada **LOW RISK**, cero passes/targets/texturas/clones/recompile; excluido updateCaps (D06). Precision: near .6D puede cortar volumen frente al plano, MEDIUM. Mobile: región libre pequeña/teclado, MEDIUM. WebGL: setViewOffset estándar pero restore necesario. Accessibility: captions donantes no autoridad; controles/holds Rubik. Maintenance: semialtura frente a altura completa. License: MIT; fonts/entourage no necesarios. GPU/fps de integración UNKNOWN — MEASURE IN SCULPTURE LAB.

## N. Tests Required

T0; puros resolve/mix en wide/portrait, bandas imposibles, rect degenerado y equivalencia fh vs2fh. Browser landmarks **en el plano** en ambos ejes de sección y ambos signos; punto de fuga distinto del centro sin órbita; prueba de profundidad no constante; restore de camera.view/inverse, resize/cancel/context loss; dos niveles/offset y falta de descriptor; reduced holds y OFF sin shift. Separar pruebas de cámara de caps/color para no ocultar errores con snapshots globales.

## O. Sculpture Strategy

**S1:** aislar resolve/mix/place-camera con vp/bands explícitos. **S2:** reproducir intervalo frontal de 03A con rect fijo y comprobar NDC. **S3:** quitar sólo z=cut como eje universal. **S4:** base de descriptor de sección Rubik, misma geometría. **S5:** reemplazar bands/rect/vp/tiempos por region/anchors/Story uno a uno; comparar tan lineal vs tan log con criterio visual humano. No recrear PLAN ni visita interplanta.

## P. Evidence

F:03-open-section/engine.js:561–622; page.js:21–110 y frame caller; R:section-core:derive, story-core:125–171, index:4551–4590/4651–4688. specialization-probes.json confirma semialtura y lente intermedia. Atlas E-runtime03A/C sustenta apariencia; no se reejecutó campaña.

## Q. Confidence

**HIGH** en cámara/estado y mecanismo extraíble; funciones leídas y matemática ejecutada. **MEDIUM** para calidad del focal generalizado: necesita laboratorio con proyectos no rectangulares y review visual.

# 7 D03

## A. Identity

**ID:** D03; 07-sunlit-elevation. Ruta real **engine/elevation.js** dentro de familia07. Primary symbols internos createStage: keyFor,fitFh,camAt(p,keys):1146–1160,setCam:1162–1172. Call graph: a/b/c page run.frame(p) → S.camAt → S.setCam → render/placePins. run calcula progreso/intro y S.render; camAt no llama run. License: MIT + Three0.160.1; import estático Lenis1.1.14 en módulo, aunque math no lo necesita.

## B. Behaviour

Lente y frameheight logarítmicos; target/yaw/pitch lineales con ease del key de salida `a.ease`. Ajuste mínimo de ancho antes de interpolar, con overrides phone. Cámara alrededor del target, frontal inicialmente y perspectiva después. **No shift en setCam**, ni giro shortest-path. La legibilidad depende de claves elegidas por el autor, no de un resolver de fachada.

## C. Data Flow

p (vh) + keys `{p,t,fh,fov,yaw?,pitch?,minW?,phone?,ease?}` + W/H → keyFor/fitFh → estado → setCam → position/lookAt/proyección + S.camDist/S.camTarget → pins/render. fh es altura completa m; yaw cero apunta +Z, distinto de az cero +X en D01.

## D. State & Lifecycle

camAt calcula arrays nuevos; lee viewport y cfg closure. setCam muta cámara y lastTarget; S.camTarget referencia ese vector mutable. createStage posee renderer/root/U/material cache/luces/resize listener; run posee Lenis/RAF/DOM. Sin snapshot ni cleanup global/destrucción Lenis en el código auditado. Resize cambia renderer y resolución de líneas; frame siguiente reevalúa cámara. Reverse geométrico por p no equivale a restaurar renderer del editor.

## E. Dependencies

Internas: span, ease, lerp, phone=(W/H<.8), keyFor, fitFh, lastTarget y cámara de stage. Externas: Three; Lenis/fonts/PMREM del stage/runner son incidentales y deben quedar fuera. No dependencia matemática de casa ni D07, pese a compartir archivo grande.

## F. Mathematical / Rendering Mechanism

`fitFh(k)=max(k.fh,k.minW/aspect)`; LL(x,y)=exp(LERP(log x,log y,e)). t/yaw/pitch LERP; e=(a.ease||ease)(span(p,a.p,b.p)). `d=(fh/2)/tan(fov/2)`; dirección=[sin yaw cos pitch,sin pitch,cos yaw cos pitch]. Ojo=target+d·dir. near=max(.05,d−80,.03d),far=d+260. lookAt y updateProjectionMatrix. No elementos8/9, setViewOffset ni roll. Al interpolar fit por key se conserva ancho mínimo de esos keys, no se demuestra fit 3D intermedio. Giro350→10 pasa por180, confirmado por ejecución.

## G. Demo Assumptions

Fachadas/alzados sobre plano XY con profundidad Z, keys y minW de las casas; phone por aspect<.8; FOV inicial2°, rango variable hasta interiores; clipping80/260 m; no comprobación de oclusión/ruta/bounds. Intro/captions y length760/660/540vh son contenido de página, no propiedad de camAt.

## H. Reusable Core

La misma relación altura/FOV/distancia y fit por aspect de D01, con convención yaw distinta. Útil como evidencia comparativa de continuidad de fachada. Rubik elevationOpen ya tiene frame, fit **de esquinas del edificio**, giro corto, región libre y endpoints de overview: autoridad más robusta para producto.

## I. Reuse Decision

**REFERENCE ONLY.** No portar tercer evaluador. Preservar el caso visual de fachada como golden master y sus diferencias de convención para no «unificar» cambiando encuadre. Si falta una fórmula común se cubre por D01, con especialización de descriptor Rubik; no introducir Lenis ni stage.

## J. Rubik Authority Mapping

| Donor concept | Rubik authority | Existing? | Adapter needed? |
|---|---|---|---|
| facade target/minW | elevation-core frame/envelope | sí | sólo prueba comparativa de conversión |
| log fh/fov | elevationOpen tan/frame | sí | ninguna segunda implementación |
| yaw/pitch keys | normal/tangent + fit edificio | sí | no copiar claves; mantener giro corto Rubik |
| renderer/controls | View3D/Story | sí | no stage/Lenis |

## K. Preserve / Replace Map

PRESERVE Exterior, normal/tangent, building corners, region, Solar y anchors. REPLACE claves/80/260/phone por políticas Rubik si se reproduce el mecanismo en lab. REJECT stage como renderer de producto. CamAt sirve de referencia, no de autoridad para «mejorar» shortest turn existente.

## L. Exact Adaptation Blueprint

**Inputs:** descriptor fachada y poses ya disponibles; **outputs:** comparación de frame/lens/landmarks, no nuevo API de producto. **Owner/state:** evaluador existente y harness externo; sin S compartido. **Boundary:** no integrar run. **Lifecycle:** pruebas en Begin/Apply/End existentes; si D01 introduce shift futuro, aquí confirmar que no se añade involuntariamente al alzado. **Reverse/restore:** conservar p0/p1 y savedSolar/context/levelScale actuales. **Fallback:** fachada actual cuando no procede estilo técnico; unsupported mantiene razón. **Reduced:** holds .35/.86 actuales, no Lenis. **Resize:** refit descriptor/region, no minW fijo. **OFF:** identidad exacta actual. Cambios de cámara compartida con FT3D-5 pendientes de HEAD final.

## M. Risks

Architecture: portar D03 duplicaría D01/Story, HIGH evitado con REFERENCE ONLY. Visual: yaw largo/convención diferente, MEDIUM. Performance: math **LOW RISK**, sin passes/targets/clones/recompile/texturas/dispose nuevo. Stage entero añade PMREM/sombras/materiales ajenos, excluido. Precision: clipping fijo, MEDIUM. Mobile: minW no región/volumen, MEDIUM. WebGL: math sin requisito GPU; pérdida contexto responsabilidad host. Accessibility: conservar holds. Maintenance: eliminar duplicación. License: no copia; si lab redistribuye donor mantener MIT y dependencias. Performance físico UNKNOWN, no inferir desde SwiftShader.

## N. Tests Required

T0 en consumidor común; puros equivalencia altura/D y diferencia yaw350→10, endpoints y phone keys; browser frontal normal/tangent de fachadas rotadas, fit de todos los niveles y región, reverse y resize con misma escala; cancel/contextloss, reduced, no fachada/offsets y OFF. No testear como aprobado el giro largo donor ni sustituir política de fachada automática.

## O. Sculpture Strategy

No port productivo previsto. **S1:** aislar camAt/setCam sólo como harness de comparación. **S2:** reproducir alzado07A con claves originales. **S3:** quitar el target literal de una fachada. **S4:** usar descriptor Rubik manteniendo el evaluador Rubik como candidato. **S5:** comparar ambas convenciones y borrar dependencia de keys/stage en la propuesta de producto; freeze de diferencias útiles, no tercer engine. S6–S10 aplican a D01 compartido.

## P. Evidence

F:07-sunlit-elevation/engine/elevation.js:1141–1200 y a-one-door/page.js:frame; R:elevation-core:derive/outward, story-core:190–247. specialization-probes.json yaw180 y fov10. **ATLAS CORRECTION CANDIDATE ACC-02:** cualquier lectura de la continuidad común como shift/shortest-angle presente también en D03 es incorrecta; el Atlas localiza bien el archivo pero no detalla esta diferencia. Es una precisión de alcance, no edición del Atlas.

## Q. Confidence

**HIGH**: código y probe concuerdan; duplicación y mayor cobertura de Rubik visibles en fuente. Paridad estética completa sigue sin acreditarse por esta decisión de arquitectura.

# 8 D04

## A. Identity

**ID:** D04, familia01. **Files/symbols:** core.js DRAW/DRAW_GLSL/addDraw:27–37, patchFill:38–51, patchLine:53–62, lineMat:134–144, toneMat:146–225, stdMat:226–237, hullMat:239–250, Part:253–282, segs/liveLine/boxUV y resize. **Call graph:** dir build → pal/lineMat/toneMat/stdMat → Part.add → Part.build → mergeGeometries/EdgesGeometry/LineSegments2/hull; main intro/update → DRAW uniforms → renderer.compile/render → callbacks onBeforeCompile. stdMat→patchFill; lineMat→patchLine; toneMat es ShaderMaterial propio, **no pasa por patchFill**. **License:** MIT; Three0.169 y addons MIT separados.

## B. Behaviour

Tinta por aristas de geometría y silueta expandida opcional, no detector universal en pantalla. Part fusiona por material y genera EdgesGeometry con threshold, conservando tres familias de peso cuando la paleta las asigna. Frente world-space hace aparecer líneas, punta naranja y fills retrasados. patchFill añade wash/grano al material; toneMat hace sus propios colores/textura/luz pintada. No son el mismo acabado en A que en B/C.

## C. Data Flow

geometrías + pal[key]={mat,edges,thr,w,line,hull,…} → atributos filtrados/UV → buckets → mesh fusionada + edges + hull opcional → DRAW y uniforms → fill/ink visible. Orden de aparición `dot(world,dir.xyz)+dir.w*length(world.xz−center.xz)`; procede de la configuración demo. No hay identificación semántica de muros/estructura por algoritmo.

## D. State & Lifecycle

Part.add convierte indexed a nonindexed y borra atributos fuera position/normal/uv; puede modificar geometría suministrada cuando no se clona. build añade meshes al parent, comparte material paleta, guarda hullMat en spec y vacía buckets. No dispone geometrías fuente/intermedias ni EdgesGeometry temporal; no cleanup de parent/línea/material. ctx.lineMats Set conserva referencias. DRAW compartido globalmente modifica todos los materiales participantes; patchFill encadena prev.onBeforeCompile, patchLine lo sustituye. Sin customProgramCacheKey propio en estos parches, a diferencia de D07; variantes o.grain/wash capturadas en closure requieren atención al cache. Reverse del frente se logra cambiando uniforms, no restaurando callbacks originales.

## E. Dependencies

Internas: DRAW, geometría/boxUV, paletas, ctx.res/phone, mergeGeometries, EdgesGeometry, hullMat, DOM renderer del core. Externas: Three/addons r169, shaders estándar y LineMaterial instanciado. Fuentes/PMREM/paleta no hacen falta para tinta mínima; ensureEnv sólo por materiales standard demo. No assets de imagen obligatorios: varios canvas procedurales en variantes son contenido excluido.

## F. Mathematical / Rendering Mechanism

patchFill inserta vWD=(modelMatrix·transformed).xyz y vLP=transformed tras project_vertex; descarta cuando drawOrder>uDrawFill. Wash mezcla diffuse hacia gris (dot .3/.59/.11), luego papel .975/.962/.94, control uWash; grano hash(floor(vLP×140)) amplitud default.022(1−.5uWash). patchLine elige instanceStart/End según position.y<.5, proyecta world y descarta k=uDraw−order<0; color=mix(pen,diffuse,smoothstep(0,uDrawSoft,k)). Línea conserva su grosor de LineMaterial en pantalla, depthWrite=false; teléfono×.72.

Part: EdgesGeometry(thr default30°), un draw para mesh por bucket y otro para edges; hull añade otro mesh usando la misma geometría. Hull desplaza gl_Position.xy por dirección normal proyectada normalizada×`px·2/res·clip.w`, backfaces. No sustituye un outline de todos los meshes skinned/GLB. Normales con mat3(modelMatrix) en toneMat no son normales correctas bajo escala no uniforme; repetirlo durante separación/grow puede producir luz falsa.

## G. Demo Assumptions

INK/PAPER/ACCENT fijos; mode0 papel/1madera/2hormigón/3zinc/4tejido/5vidrio; luces pintadas L1/L2 y unidades de grano140/m. DirA pesos1.45/.95/.6px, C1/.6/.45; no pesos universales del core. Threshold30° (algunas hojas20°), polygonOffset1/1, phone700/×.72, frente por Y/radial según variante. Nombres CLT/rafter/cladding o paleta no prueban composición constructiva del proyecto.

## H. Reusable Core

Estilos de línea separados de material, frente de aparición compartido para líneas/fill, threshold geométrico y silueta en píxel. No conservar batching destructivo de atributos ni toda la librería de superficies. La tinta puede ser una derivación temporal de la geometría renderizada existente; no otro modelo de edificio.

## I. Reuse Decision

**EXTRACT MECHANISM.** Evaluar primero edges y wash mínimos con recursos propios del efecto; reescribir ownership/leases. No portar Part para fusionar GLB porque elimina skinIndex/skinWeight/morph/custom attributes y semántica de selección. patchFill literal requiere validación de callbacks y versión, no instalarlo por defecto en SurfaceRenderer.

## J. Rubik Authority Mapping

| Donor concept | Rubik authority | Existing? | Adapter needed? |
|---|---|---|---|
| piece/bucket | buildArch/buildLevels/furniture y owners | sí | selección de mallas elegibles sin borrar atributos |
| palette/material | project.materials + SurfaceRenderer | sí | representación temporal que conserve maps/appearance |
| ink weights | líneas/caps actuales; sin perfil común | parcial | perfil visual por clase derivada, no estructura inferida |
| DRAW progress | Story.stateAt | sí | uniforms por sesión, no DRAW global |

## K. Preserve / Replace Map

PRESERVE geometría/material original, mapas verificados, clipping, sombras y selección/owner. EXTRACT tinta/hull opcional. REPLACE Part mutador, Set global y paleta por handles temporales con dispose. REJECT shaders timber/CLT/painted light como autoridad física; no añadir capas arquitectónicas.

## L. Exact Adaptation Blueprint

**Inputs:** mesh handles vigentes/revisión/owner, perfil técnico opcional, p y basis de frente. **Outputs:** líneas derivadas y/o material lease temporal; sin nuevas superficies persistentes. **Owner/state:** sesión View3D; Map mesh→original material/callbacks/cacheKey/flags más recursos exclusivamente creados. **Boundary:** SurfaceRenderer mantiene sus materiales y carga; no mutar cache global. **Begin:** preparar mallas soportadas y shaders; fallo hace rollback completo. **Apply:** uniforms absolutos, no needsUpdate por p. **Late asset:** epoch/rebind al evento correcto, no revivir sesión cerrada; mapas SurfaceRenderer que terminen después requieren sincronización explícita. **End:** restaurar referencias, callback/cacheKey/flags, liberar líneas/geometrías/leases; no disponer texturas compartidas. **Reverse:** p anterior reproduce dibujo sin acumulación; **resize:** resolución CSS/buffer explícita y grosor constante. **Fallback:** material/outline actual en material no soportado, no proxy engañoso; **reduced:** switch técnico/material o holds sin plotter; **OFF:** ninguna derivación/hook. FT3D-5 ownership pendiente.

## M. Risks

Architecture: fusión pierde ownership/atributos, HIGH. Visual: exceso de aristas, z-fight, grano temporal, HIGH. Performance: **MEDIUM RISK** para edges acotados, HIGH si se generan para todos los GLB. Cero targets/passes fullscreen; draw calls≈mesh+edges(+hull) por bucket, más geometría lineal; nonindexed duplica vértices. Clonar material por mesh dispara programas/memoria; agrupar sólo por compatibilidad y lease. Uniforms no recompilan; presencia de clip/defines sí. Texturas originales se comparten sin disponer. Precision: normal y distancias mundo/pequeña escala, MEDIUM. Mobile: geometría extra y fillrate, MEDIUM/HIGH. WebGL: anchors r169 vs r160 y sombras ante discard, HIGH. Accessibility: grain/plotter desactivables; texto sigue DOM Rubik. Maintenance: callbacks/cachekey/version frágiles. License: MIT y addons, sin fonts necesarios. Conteos reales de GPU/drawcalls pendientes de lab físico; SwiftShader no extrapolable.

## N. Tests Required

T0; puros clasificación/lease idempotente y sin borrar atributos. Browser mesh básica/standard/multimaterial/GLB, clipping caps y superficies con mapas tardíos; pesos consistentes DPR1/2, nonuniform scale, sombras coherentes con política; forward/reverse/golden stills, resize/cancel/rebuild/context loss con recuento de recursos sin crecimiento; reduced/mobile/dos niveles/no mallas compatibles; OFF referencias y programas originales. Verificar restauración de callback/cacheKey, no sólo color final.

## O. Sculpture Strategy

**S1:** aislar línea + patch mínimo, excluyendo Part/renderer/paletas. **S2:** misma pieza de donor con tres pesos y aparición, golden master01. **S3:** quitar sólo paleta fija. **S4:** usar material autorizado y una malla Rubik sin fusionarla. **S5:** sustituir sucesivamente eje/DRAW global/parent/viewport y geometría por handles reales, probar mapa tardío y salida antes de ampliar a GLB. No copiar contenido de casa para obtener «calidad».

## P. Evidence

F:01/core.js:27–70/134–282/413–420; main:82–91/119–146; dir-a:63 y dir-c:76 sólo asignación de pesos. R:surface-renderer.mjs:get/load/end/disposeAll; index:buildArch/buildLevels/clipSectionMaterials. Comparación de chunks §3.1. **ACC-03:** Atlas queue patchFill/Part es locator parcial: fill01A usa toneMat independiente; no basta extraer patchFill para reproducir todo01.

## Q. Confidence

**HIGH** en técnica, pérdida de atributos y ausencia de cleanup; **MEDIUM** en elección geométrica para Rubik hasta comparar coste/estética contra D05. No se declara shader compatible por presencia de chunks.

# 9 D05

## A. Identity

**ID:** D05; familia02-section-sweep. **Files:** draw.js:1–225 completo; house.js:ID/buildPieces/mergePieces para contrato de entrada; real.js:57–142 sólo dependencia de composición; main.js:update/sizes. **Symbols:** createDrawing, ND_MAT, INK.fragmentShader helpers nd/nrm/foot/worldAt/bend/edgeAt, resize, renderND, compose. **Call graph:** buildPieces→createDrawing→mergePieces por behind/front/people; main.update→renderND→(real.render si S.real)→compose→inkScene→fxaaScene. **License:** MIT donor, Three r160 y FXAA/GTAO derivados de addon con su licencia; conservar avisos por archivo si se incorporasen, no asumir licencia del repo sobre ellos.

## B. Behaviour

Un único pase de geometría empaqueta normal XY, profundidad lineal relativa al near e ID en un target float. Un fullscreen extrae bordes/poché/tierra/jerarquía y mezcla real; otro hace FXAA. No son tres passes separados normal/depth/ID. La escena técnica está duplicada **como geometría render auxiliar**, desde mismas pieces; no un proyecto distinto. Vidrio omitido, gente y vegetación usan IDs especiales. No hay cap generation en draw.js: recibe caras ya precortadas/clasificadas de house.js.

## C. Data Flow

pieces con geometría,part,glass,aId → mergePieces(id:true) → tres meshes double-sided compartiendo ND shader → ndRT RGBA32F+depth → INK(9 muestras ND en superficie, vecinas/derivadas/profundidad) + tReal/tShaft → inkRT RGBA8 → FXAA → framebuffer. Cámara debe suministrar matrixWorld, near y **userData.fr** de placePose, que una PerspectiveCamera Rubik estándar no ofrece por sí sola.

## D. State & Lifecycle

createDrawing posee scene/materiales/quad geometry/targets/parts/uniforms. front empieza oculto, main sincroniza front en ambas representaciones. resize dispone ndRT/inkRT anteriores y crea tamaños drawingBuffer reales; no dispose total, ni limpieza final de meshes/materiales/quads. renderND cambia target/clearColor y vuelve a null, **no restaura target previo**; compose también termina en null. Uniforms clonados por instancia; algunas values pasan por asignación desde main. No wrapper de contexto perdido, cancel, scissor/viewport/override restore. Donor es dueño único del renderer; Rubik no puede asumirlo en captura/multipass.

## E. Dependencies

Internas: mergePieces/IDs, cam.userData.fr y real.render/tReal/tShaft; IDs numéricos de house. Externas: ShaderMaterial, RGBA FloatType/Nearest/targets, FXAAShader0.160.0. Real añade EffectComposer/RenderPass/GTAOPass/OutputPass, HalfFloat, shadow y shaft targets. AO/shafts no son condición para técnico mínimo, deben excluirse del primer laboratorio. Fonts y notas SVG no afectan edge extraction.

## F. Mathematical / Rendering Mechanism

ND vertex: vD=−mv.z,vN=normalize(normalMatrix·normal),vId=aId. Fragment doble cara invierte normal si backface; RGBA=(n.x,n.y,vD−near,id). Reconstrucción n.z=+sqrt(max(0,1−dot(n.xy,n.xy))) **pierde signo z**; no tratarla como normal universal para cualquier cámara/concavidad. Depth relativo conserva más precisión float que guardar distancia kilométrica completa.

`z=near+storedDepth`; mundo=matrixWorld·[mix(fr.left,right,uv.x)z,mix(fr.bottom,top,uv.y)z,−z,1]. `foot=z(fr.top−fr.bottom)/res.y`. Bend(a,b,c)=2c−a−b+(c−a)²/(near+a)+(c−b)²/(near+b); edge máximo de cuatro pares (8 vecinos), discontinuidad de fondo, bend/foot thresholds dK..2dK y normal dot .1..28. Vegetación ID6 usa regla especial bend .7..1.4. Bordes remotos: peso mix(1,.46,smoothstep(.4,12,max(0,−worldZ))); **profundidad según worldZ de esa casa**, no distancia cámara genérica.

Poché: ID entre1.5 y3.5, rank=(ID−2)/.9, fill prog clamp((uPoche−rank·.62)/.38), rayado diagonal en pantalla6DPR hasta sólido. Tierra ID4: rayado mundo(.31 m), cobertura derivada de foot. ID5/6 personas/vida. Colores/grain y scan se detallan en D08; FXAA toma inkRT al tamaño buffer. No inferir espesor/estructura del ID.

## G. Demo Assumptions

ID1paper,2+.9rank poché,4earth,5person,6life; rank por altura/casa+random semilla; CUT=0 y partes behind/front. Peso worldZ .4–12, fondo planoZ−30 y rayos10–90, anotaciones/shafts/earth con límites propios. Vidrio excluido del ND (no política universal); mergePieces de piezas no sirve para GLB arbitrario, skinned/instanced/alpha-tested. Frustum manual donor y paleta paper/ink son también contratos específicos.

## H. Reusable Core

Pase técnico compacto + discontinuidades depth/normal calibradas por footprint, jerarquía por clase, poché sólo sobre caras realmente existentes. Lo importante es comparar bordes de pantalla con D04, no clonar toda arquitectura de dos escenas y efectos cinematográficos.

## I. Reuse Decision

**REIMPLEMENT FROM MECHANISM.** Layout de normal/depth/ID, clases, frustum, clipping y tratamiento de transparencia no son seguros literalmente para todo Rubik. Usar geometría autoritativa/poses compartidas y output equivalente de laboratorio; no incorporar house/real ni AO/shafts. Mantener D05 como alternativa hasta demostrar beneficio frente a D04, no sumar ambos por defecto.

## J. Rubik Authority Mapping

| Donor concept | Rubik authority | Existing? | Adapter needed? |
|---|---|---|---|
| pieces/part/ID | mesh owner + Geometry/sectionCap metadata | parcial | clases visuales explícitas, sin inferencia estructural |
| cut/poché | section descriptor + caps renderer | sí | renderizar caps reales en pase técnico |
| frustum | camera projection/inverse de View3D | sí | reconstrucción desde matriz real, incluido shift/captura |
| real/material | render actual + SurfaceRenderer | sí | consumidor del color autorizado, no escena real donor |

## K. Preserve / Replace Map

PRESERVE geometría, visibilidad, transforms, clipping y materiales originales. REPLACE mergePieces/IDs, worldZ/fondo fijo y normal sin signo por representación propia de precisión explícita. REJECT caps implícitos o poché en mallas sólo porque parecen estructura. No reemplazar renderer/cámara/salida actual.

## L. Exact Adaptation Blueprint

**Inputs:** handles de mallas visibles autorizadas, clases visuales/caps reales, matriz cámara/viewport/clip y p. **Outputs:** representación técnica temporal/texture opcional para D08, sin modelo persistente. **Owner/state:** sesión renderer, targets/material variants y contador recursos; permiso para override por draw con restore en finally. **Boundary:** mismo set de geometría/transforms/visibilidad; ningún segundo proyecto ni rebuild por frame. **Begin:** comprobar Float/FBO/extensiones y preparar target; si falla, liberar y mantener estilo actual. **Apply:** actualizar uniforms, render sólo si dirty; guardar/restaurar target, viewport, scissor, clearColor/alpha, tone/color configuration/override. **Reverse:** textura calculada de estado absoluto, sin historial; **restore:** materiales originales siempre restaurados incluso render throw; dispose targets/quads/variants, nunca geometría/texturas compartidas. **Resize:** targets al tamaño efectivo y no CSS a ciegas; cancel y contextloss abandonan lease. **Fallback:** D04 limitado o representación actual, sin llamar poché a un proxy; **reduced:** estado técnico fijo/switch. **OFF:** ni allocation ni renderND. Integración de mallas transformadas FT3D-5 pendiente.

## M. Risks

Architecture HIGH por sincronizar material/visibilidad y renderer state. Visual HIGH: normales sin signo, transparencias/huecos, aliasing y color space. Performance **HIGH RISK**: mínimo donante técnico **3 renders** (ND+ink+FXAA), dos targets: ND color16·Wb·Hb bytes + depth implementación, ink4·Wb·Hb; escala con DPR². Tres meshes merged reducen drawcalls donor, no acreditan mismo coste en Rubik. Real añade ping-pong HalfFloat, escena, AO normal/depth+GTAO+denoise+copy/blend y OutputPass; shafts target a mitad y sun float1024; sombras4096 y renders dirty. No denominarlo pipeline de «un pass» total. Clonar materiales por clase, no por frame; shader variants estables, clipping/defines pueden recompilar. Dispose parcial sólo resize en donor. Precision MEDIUM/HIGH por depth cercano a cero y float; Mobile HIGH por bandwidth/VRAM. WebGL HIGH por float framebuffer. Accessibility conservar DOM/holds. Maintenance HIGH por pipeline/versión. License revisar FXAA/addons notices, no fonts/assets requeridos. UNKNOWN — MEASURE IN SCULPTURE LAB para coste exacto GPU física; sin FPS ni presupuesto inventados.

## N. Tests Required

T0; puros world reconstruction vs projectionInverse (incluido offset), layout con normal de ambos signos, IDs/tolerancias/depth cerca de near, matriz owner. Browser geometría oblicua, huecos/clipping/caps, vidrio/alpha/GLB y meshes transformadas; lectura/fallback FBO, resize/DPR/captura; forward/reverse/cancel/rebuild/context loss sin target/material leak; reduced/mobile/uno-dos niveles/no datos/OFF; comparar lado a lado edges D04 con presupuesto real medido. Si no logra fidelidad/beneficio, no integrarlo.

## O. Sculpture Strategy

**S1:** aislar ND+edge/poché+FXAA, sin real/AO/shafts. **S2:** reproducir piezas02 y sus IDs sin cambiarlos, golden master de dibujo. **S3:** quitar sólo reconstrucción `userData.fr`. **S4:** usar projection/inverse de cámara Rubik y landmarks de control. **S5:** reemplazar IDs/merge/cut/transforms/fondo por mallas/clases/caps Rubik una dependencia cada vez; medir y elegir D04 o D05 antes de ampliar. No añadir ambos a producto como «completitud».

## P. Evidence

F:02/draw.js completo, house.js:14–17/466–487/563+, main.js:524–549, real.js:57–142 y GTAOPass0.160.0 render. R:index:init/sectionTargets/beginSection y superficie renderer. dependencies.json fija fuente addon GTAO y versiones. **ACC-04:** Atlas «normal/depth/ID passes» debe leerse como canales de **un pase ND**, seguido por compose+FXAA; «createDrawing/renderND/compose» no es cap generation ni reconstrucción genérica de cualquier cámara.

## Q. Confidence

**HIGH** en formato/pipeline y riesgo de port literal: unidades completas inspeccionadas, addon GTAO contrastado. **MEDIUM** en conveniencia final: decisión bloqueada por comparación de calidad/coste del futuro laboratorio, no por más inventario.

# 10 D06

## A. Identity

**ID:** D06; familia03. **Files:** engine.js:76–856 y contrato shapes de house.js; page.js:colourAt/frame. **Primary symbols reales:** `updateCaps(zc)` interno:491–515; **`const withColour = (m) =>`**, no function declaration:111–239; withColourCap:300–311; notes:628–700; helpers earthMaterial, scr/scrAt, solidShapes/hitsShape/spriteBoxes/groundY. **Call graph:** createEngine→precompute p.cap/p.capLines→place→updateCaps; page.stateAt/colourAt→place→colourX/materials→notes→scr/project + shape/sprite collision→Canvas2D; render→main scene (+key scissor). License MIT donor + Three0.160.1, fonts separadas si se usaran.

## B. Behaviour

Recorta con plano z, tapa sólidos conocidos como extrusiones de una **misma sección 2D** con rango z0/z1 y colorea superficies tras frente X. Caps no son CSG de meshes arbitrarios: copia de shape invariable trasladada a la profundidad de corte. Notas son grid/niveles/labels y fronts proyectados a pantalla, con selección de ubicaciones que evita sprites/sólidos. No es motor de cotas universales ni clasificación de materiales reales.

## C. Data Flow

house pieces `{shape,pts,holes,z0,z1,kind,mat,…}` → ExtrudeGeometry con color/color2/matId + ShapeGeometry cap y contorno → zc filtra piezas atravesadas → key de índices → merge por kind + líneas → caps.position.z. colorX + atributos/posición → withColour shader → dibujo/material procedural. Grid/levels/labels/groundLine + S/camera → notes→canvas. Donor muta pieces con p.cap/p.capLines en construcción; ese almacenamiento no debe entrar en proyecto Rubik.

## D. State & Lifecycle

Engine posee S, caps group/capKey, materiales por kind, planes, colourX, shadowKey y canvas; p.cap por pieza es precálculo de la casa. Cuando key cambia, elimina hijos de caps y dispone **su geometría fusionada/líneas**, reutiliza materiales y source caps. En misma topología sólo mueve z. No limpieza final de source caps/materiales/renderer/texturas/sprites. withColour sustituye callback sin encadenar anterior ni cacheKey particular; clon de faces de tierra se vuelve a parchear explícitamente. Cantidad de clipping planes permanece estable, cambiando sus constantes para evitar recompilación scroll. Notas limpia canvas cada frame; shapeCache depende de cámara/cut/viewport con redondeo4decimales. Timers de page no son cancelados por este engine.

## E. Dependencies

Internas: house pieces/floors/grid/levels/labels/coursing y entourage procedural, ambos/reveal/late/sprite clipping planes; mergeGeometries/ShapeGeometry/EdgesGeometry; colorFor/matIdFor por posición y material demo. Externas: Three/Lambert/LineMaterial0.160.1 y Canvas2D. IBM Plex Mono sólo para texto; no necesaria. Sin Lenis, assets remotos de malla ni un solver de sección general.

## F. Mathematical / Rendering Mechanism

cutPlane normal(0,0,−1), constante=cut; selección cap `p.z0 < zc−1e−4 && p.z1 > zc+1e−4`. Key=índices de piezas activas. ByKind fusiona cap shapes, incluyendo holes; drops por kind .006/.004/.003/.002m, líneas .001m para evitar z-fight, renderOrder según earth/otros. Esta identidad por intervalo z sólo es válida para prismas con contorno constante. No cap de muebles GLB por aproximación silenciosa.

withColour usa color original como vInk y cambia vColor a color2. **vCm se calcula por vértice**: `1−smoothstep(colourX−.42,colourX+.42,worldX)` y se interpola al fragmento; procTex por matId/posición multiplica litCol, luego mezcla vInk/litCol antes de colorspace. Banda naranja por fragmento usa worldX/y/z. Cap de mueble mezcla color/color2 por vértice con ancho .35. Diferencia con máscara per-fragment D07/D08: sobre triángulos grandes puede ensanchar/distorsionar frente; no afirmar máscara espacial idéntica entre engines.

Notes: scr(x,y) proyecta [x,y,cut] con cámara actual; convierte NDC a CSS W/H. Canvas backing×DPR, transform(DPR), escalas/font CSS. Labels prueban spots, depth, reveal, bounds pantalla, taken sprite boxes y hitsShape; guardan reason en __labelWhy. Grid/niveles son datos casa; mobile omite level labels y cambia densidad. Render de radar modifica viewport/scissor/fog/reveal temporalmente y los restituye al acabar, sin finally de error; no copiar ese ownership.

## G. Demo Assumptions

Casa de tres niveles6.6/3.3/0 y living6.25; cut−4.6; front X −12..38.5; kinds earth/cut/layer/furn/glass/water; paletas/libros y matIDs0–6; colorFor decide material por alturas/X. Drops/tolerancias en metros, líneas y datum x34.3/23.8/34.9, grid de casa, tierra fuera−30..50 y y>−14, sol/pointlights en rooms, shadow4096, note/header bands y positions. Todas DEMO CONSTANT; un acabado visual no acredita composición/estructura ni dato Solar.

## H. Reusable Core

Cache por cambio topológico y traslado barato, estilo diferenciado de cap verdadero, separación ink/material y colocación de notas con detección de solape. Rubik tiene caps de muros+huecos y floor lines de descriptor activo: conservar su derivación, no sustituirla por shapes donantes ni prometer caps universales. El contenido de notas sólo procede de entidades/medidas reales o se omite.

## I. Reuse Decision

**EXTRACT MECHANISM.** Cache/representación y regla de notes pueden extraerse; algoritmo de cap shape es referencia de **subconjunto extruido**, no solver general adoptable. Extender cobertura Rubik sería un corte posterior con datos/topología demostrados. ColorFor/procTex no se portan como biblioteca de materiales.

## J. Rubik Authority Mapping

| Donor concept | Rubik authority | Existing? | Adapter needed? |
|---|---|---|---|
| cut/caps | section-core crossings + index beginSection | sí | estilo sobre cap real; no generar p.cap desde GLB |
| material color2/matId | project.materials + SurfaceRenderer | sí | máscara técnica sobre material autorizado, no IDs por posición |
| levels/notes | Building + descriptor + UI caption/minimap | sí | layout proyectado, datum/procedencia explícitos |
| rebuild/cache | sectionKey + asset status/Story epoch | sí parcial | revisión estable; no key por índice de casa |

## K. Preserve / Replace Map

PRESERVE cruces/aberturas, clipping sólo edificio, materiales, datum/niveles reales y ARIA. EXTRACT cache/layout/estilo. REPLACE shape/kind/colourFor/drops/bounds/textos por descriptor y escala/tolerancias explícitas. REJECT etiquetar tierra/cotas/estructura no disponibles. No cambiar sección existente para simular tres niveles.

## L. Exact Adaptation Blueprint

**Inputs:** descriptor actual, caps existentes, fuentes Building con offsets y labels reales, región/cámara/p + estilo técnico optativo. **Outputs:** representación de cap y notas efímeras, máscara de color común. **Owner/state:** sesión section View3D y UI para texto semántico; cache ligada a revisión geométrica/target/level, no al frame. **Boundary:** no parser de casa en renderer; no sustituir descriptor durante render. **Begin:** capturar estilos/clipping originales y crear sólo recursos derivados; **Apply:** uniforms/posiciones absolutos; mientras plane sweep no ha llegado al target no exhibir caps construidos para otro plano. **Reverse:** ocultar/exhibir según mismo estado p. **Restore:** endSection restaura clipping y dispone recursos propios; notas borradas y texto DOM desregistrado; cancel/rebuild invalida cache. **Resize:** reproyectar y recalcular colisión manteniendo p; **fallback:** mantener caps actuales/omitir notas con razón de falta de dato; **reduced:** hold de sección y notas fijas; **OFF:** estilo/cobertura actual. Otras plantas: PENDING FINAL FT3D-5 HEAD RECONCILIATION.

## M. Risks

Architecture HIGH al confundir extrusión con CSG/membership. Visual MEDIUM/HIGH por z-fight, saturación y frente interpolado por vértice. Performance **MEDIUM RISK** para estilo/cache; HIGH si se regeneran caps por frame: filter/key en todas piezas, indexOf por pieza activa puede costar O(n²), merge/allocation al cruzar topología; no atribuirle coste constante. Main render1 + inset1 opcional + shadow dirty, sin fullscreen targets propios; shadow4096 y sprites/texturas dependen de engine completo, excluidos del mínimo. Materiales reutilizados, un clone faces para earth; uniforms sin recompilar si número planes fijo. Dispose sólo geometrías reemplazadas, global incompleto. Precision tolerancias/meters/topología MEDIUM. Mobile labels/caps/drawcalls MEDIUM, bajar densidad sin inventar datos. WebGL HIGH para composición de hooks/clipping/normal en escala no uniforme. Accessibility Canvas no semántico: conservar alternativa DOM. Maintenance separar notas/caps/color. License MIT/Three; fuentes excluidas. Coste físico UNKNOWN — MEASURE IN SCULPTURE LAB, no inferir desde SwiftShader.

## N. Tests Required

T0; puros intersecciones con huecos/intervalos y cache por revisión, unidad mm→m/signo/eje/offset. Browser caps no tapan puertas/ventanas ni aparecen durante plane distinto; close/reverse/cancel y rebuild/assetlate sin residuos; notas sin colisión y con equivalente DOM/teclado; resize/DPR/mobile/uno-dos niveles y clipping de terreno excluido. contextloss libera handles; material map tardío no se pierde; no-data omite notas; reduced hold y OFF cobertura/colores originales. Subconjunto no extruido debe rechazar cap nuevo, no fingir precisión.

## O. Sculpture Strategy

**S1:** separar updateCaps-cache de house y notes-layout de textos. **S2:** reproducir una extrusión con hole y sus notas en lab03 sin cambiar selección. **S3:** retirar una cota/shape literal. **S4:** usar un cruce+gap real de sección Rubik y una etiqueta con fuente. **S5:** cambiar por separado eje/offset/membership/color/sprite avoidance a autoridades Rubik; conservar caps actuales cuando no exista topología soportada. Futuro multi-level sólo después de reconciliación.

## P. Evidence

F:03/engine.js:111–239/287–325/423–439/491–515/561–622/624–856; page.js:colourAt y frame. R:section-core:crossings/derive e index:4651–4688; UI:minimap/caption/holds. **ACC-05:** locator `withColour` es función flecha interna; updateCaps presupone shape extruida, no corte de malla genérica. **ACC-06:** la equivalencia semántica de scan03/07/02 no implica máscara numéricamente idéntica: 03 interpola el factor por vértice.

## Q. Confidence

**HIGH** en límites/topología/ciclo y referencias; **MEDIUM** para reutilización del layout de notas sobre proyectos densos. La generación universal de caps permanece fuera de alcance y sin promesa.

# 11 D07

## A. Identity

**ID:** D07; familia07, archivo real `07-sunlit-elevation/engine/elevation.js`. **Symbols:** GLSL_COMMON:33–83 (sweepS/revealAt/lineAt/lineFade/frontBand/hatchWipe/detailWipe/planeUV), createStage/U/aimSun/setSun, mat(kind,o):187–450 y lineMat:453–492 como dependencia de representación de aristas. **Call graph:** page→createStage→house/add→mat→MATS cache→MeshStandardMaterial.onBeforeCompile→GLSL_COMMON; run/frame→U+setSun→S.render→shadow map y fragment mix. **License:** donor MIT + Three0.160.1; Lenis import1.1.14 incidental, fonts OFL excluidas.

## B. Behaviour

La sombra sobre geometría se representa como hatch filtrado cuando rv≈0 y material iluminado cuando rv≈1, usando el **mismo caster y la misma luz**. Después la página cambia dirección/color/intensidad del sol. No convierte hatch en geometría ni calcula astronomía. mat contiene además biblioteca procedural por KIND y AO por coordenadas de casa: no es sólo un blend técnico limpio.

## C. Data Flow

kind/options + BASE → MATS[kind+JSON(options)] → material standard con hooks/defines → geometría/instancias world pos+normal → shadowmap + normal·uSun → shade → paper/hatch/details → revealAt/frontBand mezcla con salida material. U compartido por stage recibe sweep/real/hatch/depthcue, progreso y luces de page. El renderer sigue dando mapas y luz estándar antes del override final.

## D. State & Lifecycle

Stage posee cache de materiales/U/root/renderer/PMREM/luces/LMATS/listeners; mat comparte objetos por key. customProgramCacheKey=`elev-K-faint-realOnly-drawOnly`, evita mezclar esas variantes; updates uniform no recompilan. No cleanup global de cache/PMREM/shadow/maps/listener/Lenis. No snapshot del renderer o Solar previo; la página es dueña de todo. Forward/reverse recalculan U y sun desde p; intro depende del tiempo. No adoptar contaminación de luz o callback sobre material compartido Rubik.

## E. Dependencies

Internas: KIND15clases/BASE, cfg, U, procedural brickAt/matHeight/noise, planeUV, patch estándar, lineMaterial de aristas. Externas: Three standard shaders/shadowmask/PMREM/derivatives/PCFSoft y Lenis en módulo. No imagen externa obligatoria en técnica central. Los efectos brick/wood/porchAO/door/proxy house se excluyen; tampoco copiar branding/copy de horas/medidas.

## F. Mathematical / Rendering Mechanism

`s=dot(p.xy,uSweep.xy)`, `rv=clamp(uReal+1−smoothstep(center−soft,center+soft,s),0,1)`. FrontBand usa banda gaussiana laser+halo y grids mundo(.5,.5,.25); sólo activo cuando center∈[−35,35) y uReal≠1. Puede desligarse sin afectar máscara.

`lit=getShadowMask()*smoothstep(−.02,.06,dot(normalWorld,uSun))`; shade=1−lit. planeUV elige XZ si |Ny|>.7 o ZY/XY por normal dominante. lineAt sobre q.x+q.y usa periodo uHatch y `fwidth(t)`, ancho en píxeles; lineFade compara periodo/fwidth(c) con minPx para fundir rayado demasiado denso hacia cobertura .32. HatchWipe por dot(p.xy,[.7071,−.7071]) y rango uWipe, no fecha Solar. Color papel/hatch se mezcla con gl_FragColor material **tras dithering**, y luego frontBand agrega acento. REAL_ONLY/DRAW_ONLY descartan según rv con umbral. uDepthCue usa profundidad **worldZ fija** de la casa.

Vertex considera instanceMatrix para posición, pero normal vWN=normalize(mat3(modelMatrix)*objectNormal), sin inverse transpose y sin transformación de normal de instancia. No es seguro con nonuniform scale/instancias rotadas Rubik. getShadowMask mezcla sombras de las luces configuradas por Three; en Rubik con otros shadow lights se debe definir qué máscara representa «sol», no dar por supuesto un único donor sun. Si sólo se cambia color no se necesita custom depth; si discard/alpha afecta visibilidad, hay que conciliar caster explícitamente.

## G. Demo Assumptions

CONVENTION=normalize(−1,1,1) → altitud35.2643897°, no45°astronómico; LATE/RAKE/horas son escenografía. aimSun targetz−3.5, dist90, shadow ext24/map4096/near6/far210 y bias. cfg default hatch.11m, soft.8, drawSpan0..12/wipe−12..8, line1.05DPR. KIND/BASE, juntas215×65+10mm, porchAO z−.08..−2.1, roomCorner y.45, brick relief son de demo. No convertir periodos/rayado/juntas o ampliación óptica en detalle constructivo medido. EjeXY del sweep no es universal.

## H. Reusable Core

Hatch antialias con fade por frecuencia, misma máscara de sombra para lectura técnica/material y máscara espacial compartida con D08. Separar ese núcleo de shader-material procedural y política de luces. No añadir shadowmaps si no hay dato/capacidad, ni afirmarlas geográficas sin Solar.

## I. Reuse Decision

**EXTRACT MECHANISM.** Extraer funciones filtradas de hatch/reveal y esquema de mezcla conservando procedencia; reescribir bridge sobre materiales autorizados y luz ya controlada por Rubik. No portar mat(kind) completo, PMREM ni setSun de la demo. Más barato en arquitectura que heredar material catalog paralelo.

## J. Rubik Authority Mapping

| Donor concept | Rubik authority | Existing? | Adapter needed? |
|---|---|---|---|
| material KIND/BASE | SurfaceRenderer/project.materials | sí | temporal técnica/hatch sin sustituir texturas ni PBR |
| sun/shadow | applyLight + solar-renderer-adapter | sí | política de máscara y snapshot, no cálculo Solar |
| plane/depthcue | elevation descriptor tangent/normal/up | sí | espacio local de fachada, no worldXY/Z fijos |
| rv/U/p | Story.stateAt + session owner | sí parcial | estado de representación opcional + lifecycle |

## K. Preserve / Replace Map

PRESERVE Solar/fecha/aboveHorizon, material maps/clipping, geometría y facade descriptor. EXTRACT filtro hatch/reveal; REPLACE U global/KIND/normal shader/porchAO/worldbasis por sesión/descriptores/materials. REJECT fecha16:40/«45°sun»/brick relief como hechos de Rubik. Luz artística, si se aprobara, se rotula visual y se restaura; no altera Solar.

## L. Exact Adaptation Blueprint

**Inputs:** facade basis, mallas y material handles, p/mask, luz actual o snapshot Solar disponible y estilo explícito. **Outputs:** mezcla técnica/sombra/material temporal. **Owner/state:** lease de representación View3D; Solar permanece propietario de su resultado, no del shader. **Boundary:** pasarela de hook con cacheKey propio/encadenado y espacio de color declarado; no nueva biblioteca. **Begin:** snapshot de hooks/referencias y luz/tone/flags tocados, soporte por material; precompile y rollback. **Apply:** uniforms absolutos; mantener dirección que produce hatch y sombra material durante transición; moverla sólo por política existente/aprobada. **Reverse:** misma matriz/máscara, sin dependencia de tiempo no fijado. **Restore:** devolver callbacks/referencias/luz/contexto y eliminar leases, no dispose de textura compartida; **resize:** hatch por buffer/DPR y periodo visual filtrado, sin modificar datos arquitectónicos. **Fallback:** material existente sin hatch si no hay sombra soportada, no inventarla; **reduced:** frontal fijo/switch; **OFF:** no nuevos shaders ni cambios de luz. FT3D-5 consumidor pendiente final.

## M. Risks

Architecture HIGH al tocar cache/material/luz compartida. Visual HIGH: mismo shadow no implica tono idéntico al mezclar post-colorspace, moiré/flicker/bias/alpha; normal incorrecta en escalas. Performance **MEDIUM/HIGH RISK**: un scene render más renders de sombra de luces que sombrean; en donor07 shadowMap autoUpdate queda por defecto, no cache dirty como03. Sin target fullscreen adicional; shadow4096, PMREM al inicio con passes/targets transitorios, materiales/lines por clase y draws extra de aristas. Procedural/bump derivadas elevan ALU; no copiarlos para hatch mínimo. Cache mat crece por opciones, sin dispose final; variantes/defines pueden recompilar, uniforms no. Precision shadow bias/escala MEDIUM/HIGH. Mobile HIGH por sombra/resolución, requiere fallback. WebGL HIGH por derivatives/hooks y mezcla. Accessibility no única comunicación por textura/luz y sin scan obligado. Maintenance HIGH chunks/cacheKey/composición. License MIT, origen individual noise no demostrado: revisar fragmento antes de copia literal. Hardware performance UNKNOWN — MEASURE IN SCULPTURE LAB, SwiftShader no aprobación móvil.

## N. Tests Required

T0; puros basis/mask/fade, sin modificación Solar. Browser hatch→material con sombra coincidente en checkpoints, luces existentes y snapshot above/belowHorizon, normal nonuniform/instanced, vidrio/GLB/texture late; filtros en alejamiento/DPR1/2/resize; reverse/cancel/rebuild/contextloss restauran luz y materiales; dos niveles/offset, reduced/no shadow/no façade y OFF. Comparar color space y flicker en movimiento, no sólo still favorable.

## O. Sculpture Strategy

**S1:** aislar lineAt/lineFade/shadow→hatch/reveal del material procedural. **S2:** reproducir un fragmento07 con la misma luz/caster y sweep, golden master antes de mover sol. **S3:** quitar sólo ejeXY/worldZ. **S4:** descriptor de fachada Rubik y normal transform correcta. **S5:** sustituir KIND/BASE/U/sol/PMREM por materiales/lifecycle/luz Rubik, uno cada vez; si no hay máscara solar utilizable conservar fallback explícito. No rediseñar Solar para salvar el efecto.

## P. Evidence

F:07/engine/elevation.js:31–83/86–170/187–450/453–492/1187–1200; a/page.js:frame. R:surface renderer, solar adapter:apply, index:4695–4728. §3.1 chunks r160.1 vs local r160 iguales, integración no compilada. Altitud35.26 ya corregida por Atlas; no se registra como error nuevo. ACC-06 distingue mezcla de D06.

## Q. Confidence

**HIGH** en mecanismo y condiciones de sombra/shader; **MEDIUM** en bridge a materiales heterogéneos. Compatibilidad GPU/estética y coste necesitan S6, no otra auditoría de las14 demos.

# 12 D08

## A. Identity

**ID:** D08; familia02. **Files/symbols:** draw.js INK.fragmentShader/compose:209; main.js **forwardScanX(sp):221**, **story(y):230**, **update(T,y,force):524** y sizes/REAL_SCALE; real.js render/setFront como dependencia. **Call graph:** RAF/offline __frame → update→story→forwardScanX + chapter masks→placePose→drawing.renderND→real.render→drawing.compose(uniforms)→INK. **scanX no es función**: es campo `S.scanX` calculado por story. **License:** MIT donor; dependencias del pipeline D05, no nueva biblioteca de sweep.

## B. Behaviour

Una frontera en coordenada worldX divide representación técnica y material sobre el mismo estado de cámara/partes. En este compositor, **técnico a la izquierda de scanX y material a la derecha**; la frontera avanza decreciendo X para materializar. El regreso narrativo hace el frente en sentido contrario y vuelve a dibujo. Scrub inverso vuelve a evaluar story(y); no depende de historial de frames. No es un shader que hace crecer geometría ni mueve corte de sección.

## C. Data Flow

y scroll en screen heights + capítulos CH/WALK → story(S.pose,S.scanX,S.real,S.front,S.scanLine,S.shaft) → render de mismas piezas/visibilidad con cámara común → ND reconstruye world position y sample material del target → mask/frente + acento → salida. T controla intro y uniform uTime; en main se fuerza `uSweepMode:3`, no variantes de producto. Front de la casa se oculta/muestra según recorrido donor; eso es distinto del frente de representación.

## D. State & Lifecycle

story(y) recalcula estado absoluto pero lee CH/WALK precomputados de demo. update guarda curS/lastY/dirty y redraw durante loader o al cambiar y/dirty/force. Cambia drawing.parts.front y real.setFront; latter invalida sombras/sun. No copia transaccional previa ni dispose global. compose asigna valores uniforms y renderer target; wrappers futuros deben restaurarlos. Grain/intro/time pueden variar aun con p fijo: golden master debe fijar también tiempo/opciones. Reverse por scroll no es End de editor.

## E. Dependencies

Internas: capítulos/forwardScanX/swingState/walkPose, ND de D05, look/real material render, camera.userData.fr y near. D08 semántico sólo necesita p,basis,extent,softness y colores existentes; no requiere spline/shafts/house/Lenis. Externas: Three shaders/derivatives/targets de D05. Fonts y notas/HUD de main son ajenos al mecanismo de máscara.

## F. Mathematical / Rendering Mechanism

Geometría: sw=.015m, `m = uReal>.5 ? 1−smoothstep(scanX−sw,scanX+sw,wp.x) : 1`. Resultado `mix(real,drawing,m)`. Fondo usa sw5m y world point inventado por rayo contra z=−30/clamp10–90; no válido como autoridad territorial. Banda de acento: distancia px=`abs(wp.x−scanX)/max(fwidth(wp.x),1e−5)`; estilos1/2/3 añaden grids/hatches/datum, main fija3 (banda1.15m, contour fract(worldY), línea1.65DPR). Son lenguaje visual demo, no dimensiones.

forwardScanX: sp≤0→40; 0<sp≤.82→LERP(25.5,3.4,eInCont(sp/.82)); .82<sp<1: t=(sp−.82)/.18, `3.4−3.4t−60t²`; sp≥1→−60. eInCont(x)=x²(2.3−1.3x). El comentario «single C1» no prueba continuidad estricta en todo dominio: **40→25.5 en el límite inicial**, slope join .82 aproximado, y cierre a constante−60 cambia derivada. Es visualmente fuera de casa al inicio, no primitiva matemática universal.

story: sp=clamp((y−2)/(CH.sweep.end−2)); swing/sweep usan forwardScanX, walk usa−100, rev antes.58 interpola−18→30 con easeIO, después40. scanLine se enciende/apaga por ramps; real false al final. **No hacer de esos números el contrato Rubik.** Generalización propuesta: coordenada local `s=dot(world−origin,unitAxis)` y frente derivado de extents del modelo, polaridad explícita. Softness en m o píxel declarados; bounded progress→center, sin sentinels1000. p1 de la narrativa puede volver a representación actual, distinto del progreso local de materialización.

## G. Demo Assumptions

Eje X, scan40/25.5/3.4/−60/−100/−18/30; banda.015/5m; CH.swing0..2.5 y recorrido WK; umbral shafts18.4, tamaño/worldZ del fondo, geometría front/behindCUT0, modo3/hatches1m sin dato métrico. REAL_SCALE .6/.75 según SMALL/DPR, sunboxes, WB y AO son efectos demo. No usar spline como prueba de acceso ni materializar terreno con punto de fondo ficticio.

## H. Reusable Core

Máscara espacial absoluta, polaridad/softness y frente compartido entre representaciones con mismo depth/cámara. Separar geometría visible de estilo. El mismo concepto aparece en D04 (aparición discard), D06 (color por vértice), D07 (blend fragment diagonal): **no son cuatro sistemas que integrar**, ni las mismas garantías.

## I. Reuse Decision

**EXTRACT MECHANISM.** Extraer regla local de frente, no su schedule/curva literal ni renderer de dos escenas. Con D07 compartir estado semántico y usar backend geométrico/shader elegido. Si se elige D05, compose consume esa máscara; si no, material lease la aplica sobre la misma escena. No obliga a portar todo D05.

## J. Rubik Authority Mapping

| Donor concept | Rubik authority | Existing? | Adapter needed? |
|---|---|---|---|
| worldX/extent | section/elevation basis + bounds | sí | unitAxis/origin/extents reales en marco activo |
| scan timing | Story.stateAt/sequence | sí | progreso local de representación, no CH/WALK |
| material image | SurfaceRenderer + render actual | sí | backend escogido, sin paleta/look donor |
| front geometry visibility | route/section/level lifecycle | sí | no mapear S.front a visibilidad de Rubik por reflejo |

## K. Preserve / Replace Map

PRESERVE visibilidad/huecos/niveles/ruta/materiales y end overview. EXTRACT máscara/frente. REPLACE X/sentinels/CH/softness arbitraria/realRender por eje+extents+estado de sesión y backends soportados. REJECT fondo falso, datum rayado sin fuente, sun shafts implícitos y recorrido donor como verdad de acceso.

## L. Exact Adaptation Blueprint

**Inputs:** p local de representación, basis/extents de descriptor, softness visual, mesh/material handles y políticas de elegibilidad. **Outputs:** weight de material [0,1], frente opcional y estado absoluto para backend; no cambia geometría. **Owner/state:** Story produce dato, sesión renderer lo consume; no global U compartido entre escenas. **Boundary:** elegir explícitamente qué lado materializa, documentar y probar. **Begin:** guardar referencias/hooks/targets y conectar al backend aprobado; **Apply:** actualizar uniforms sin recomputar mesh/caps ni cargar texturas; **reverse:** mismo p reproduce máscara; p0/p1 acoplados a narrativa y endpose actuales sin residuo. **Restore:** abort loads/rebind de sesión, restaurar renderer/material callbacks/referencias con finally, dispose sólo propios. **Resize:** mantener coord mundo y adaptar anchura píxel si elegida; **fallback:** switch discreto actual si backend no soporta material/GLB/transparency o sin descriptor; **reduced:** dos estados/hold sin frente en movimiento; **OFF:** ninguna mutación/pase. FT3D-5 integración de transforms/membership pendiente.

## M. Risks

Architecture MEDIUM/HIGH por coord mundo vs local transformada y coexistencia de effects. Visual HIGH si ND y real no alinean, transparencias o fondo ficticio, signos de máscara distintos; usar extents válidos sin inventar suelo. Performance **LOW RISK** para evaluador puro/máscara uniform; **HIGH RISK** si arrastra D05+real/shafts: costes §9M, no contarlos como gratis. No targets extra del frente mismo, `fwidth`/mix por fragmento; uniform no recompila; clones/targets/dispose corresponden al backend/lease. Precisión MEDIUM por extents grandes/unitAxis/softness y p extremos. Mobile HIGH si multipass, MEDIUM con shader mínimo. WebGL derivative/float fallback según backend. Accessibility reducir/suprimir movimiento; conocimiento no sólo color. Maintenance separar schedule/backend. License MIT + addons si se copian; sin fonts/assets nuevos necesarios. Coste físico UNKNOWN — MEASURE IN SCULPTURE LAB, no FPS de SwiftShader.

## N. Tests Required

T0; puros mask bounds/polaridad/degenerate extent/nonfinite, ejes rotados/ambos signos/offsets; endpoints y saltos aleatorios sin estado acumulado. Browser unión técnico/material sin doble contorno ni huecos, mismo depth/cámara/visibilidad, cap/vidrio/GLB/map late y dos niveles; forward/reverse/rebuild/resize/DPR/cancel/contextloss restore; reduced switch, sin datos fallback y OFF sin target. Test específico contra sentinels/discontinuidad de curva donor: nueva curva debe derivarse y demostrar su contrato, no repetir comentario C1.

## O. Sculpture Strategy

**S1:** aislar máscara de INK y story.scanX, sin curve/walk. **S2:** reproducir scan de02 con mismo ND/real y checkpoints ya fijados; contraste diagonal07 como variante de la misma responsabilidad. **S3:** quitar sólo eje worldX. **S4:** tangente/up o eje de sección Rubik y extents reales, probar proyecto rotado. **S5:** reemplazar schedule/sentinels/fondo/cámara/material por Story/lifecycle/materiales actuales una dependencia cada vez. No convertir front de casa donor en política de clipping Rubik.

## P. Evidence

F:02/draw.js:75–174/209–223; main.js:221–264/274–282/524–550; real.js:119–142. R:story-core:stateAt, section/elevation descriptor, View3D transacciones. **ACC-01:** Atlas `main:update/scanX` es locator simplificado: el cálculo es **story(y)→forwardScanX(sp)→S.scanX**, update sólo lo consume; scanX no es símbolo función. **ACC-07:** no elevar comentario «single C1» a garantía de continuidad del frente reusable: límites/derivadas y sentinels requieren reemplazo. Atlas no afirmaba esa garantía matemática; precisión preventiva del siguiente análisis.

## Q. Confidence

**HIGH** en dirección/pipeline/estado; **MEDIUM** en backend final por materiales/targets pendientes del lab. No hay motivo para volver a recorrer14 rutas para resolver una decisión de integración aún no implementada.

# 13 Cross-Candidate Architecture

## 13.1 Duplicación y elección de autoridad

| Cluster comprobado | Coincidencia | Diferencia que importa | Elección justificada |
|---|---|---|---|
| D01/D02/D03 cámara | altura/fov/distancia y pose absoluta | D01 giro corto y shift matricial; D02 semialtura y punto de fuga frontal; D03 altura completa, yaw lineal, sin shift | fórmula común mínima D01, **autoridad funcional Story Rubik**; D02 especialización de sección, D03 referencia de fachada; no tres evaluadores |
| D04/D05 bordes | dibujo sobre geometría existente | D04 edges/hull por geometría; D05 discontinuidad raster, layout float, más passes | D04 primer prototipo por menor dependencia; D05 alternativa comparativa; elegir por calidad/coste, sin declarar ganador visual antes del lab |
| D05/D06 poché/caps | lectura de cara cortada | D05 consume ID en cara ya creada, D06 genera cap de prismas | **Rubik descriptor+caps es autoridad**; D06 informa cache/estilo, D05 sólo representa; no usar uno como solver del otro |
| D04/D06/D07/D08 fronts | progreso gobierna representación | D04 discard/plotter, D06 peso por vértice, D07 fragment shade/material, D08 pantalla+targets | compartir dato espacial/polaridad y progreso, **no** shader/pipeline completo; D07/D08 especializaciones más útiles de mezcla |
| D07 luz técnica | sombra física del mismo objeto | depende de shadowmask y normales correctas; no lo resuelve scan por sí solo | bridge específico, Solar/aplicar luz Rubik sigue propietario; no convertirlo en requisito del ink mínimo |
| lifecycle de todos | reverse por estado absoluto | demos poseen página; falta transacción editor | lifecycle Rubik prevalece; ningún runner donor reutilizado |

**Generalidad/robustez/desacoplamiento:** D01 math es el más separable, pero su rama pos/width y clipping fijo son menos robustos que fitting Rubik para producto. D02 tiene mejor separación composición/punto de fuga para un corte frontal, pero createEngine está acoplado. D03 es más sencillo, no más general; suprimir giro largo y recuperar region/fit desde Rubik es preferible a portarlo. «Usar donor» aquí significa aislar lo que falta, no sustituir código local equivalente mejor adaptado.

## 13.2 Responsabilidades emergentes, sin fijar API

1. **Encuadre común:** altura completa m, coordenadas del marco activo, basis/orientación, región, lens/tan y clipping derivado; ausencia explícita y pruebas de landmarks. Room selection/occlusion/ruta permanecen fuera de la primitiva.
2. **Estado espacial de representación:** origin/eje unitario/extents, peso de técnica/material, polaridad y softness; p absoluto, no T oculto ni sentinels. Permitir perfil discreto reduced y cero efecto OFF. No persistirlo en proyecto.
3. **Lease de representación:** referencias originales, callbacks/cacheKeys/flags, variantes compatibles, recursos propios, epoch para cargas tardías y rollback/finally. Mantiene clipping/visibilidad/transform que ya pertenecen a Story/FT3D-5. No es catálogo nuevo ni autoridad geométrica.
4. **Backends técnicos alternativos:** líneas geométricas o buffer de pantalla; caps siguen dato derivado, sombra es especialización opcional. Compartir datos no fuerza iguales passes.
5. **Evidencia de escultura:** golden master y candidato con SHA/viewport/DPR/proyecto/cámara/luz/time iguales, diferencias conocidas de profundidad, metadatos de capacidades y aprobación humana. Los nombres anteriores son descripciones, no contratos/clases aprobados.

No emerge necesidad demostrada de otro scene graph autoritativo, otra cámara productiva, scroll provider, schema, provider de materiales o motor Solar. Un pase auxiliar puede leer la misma geometría sin convertirse en otra verdad, pero exige sincronización/recurso demostrable. Si la complejidad no compensa visualmente, mantener el renderer actual.

## 13.3 ATLAS CORRECTION CANDIDATE ledger

Ninguna corrección aplicada al Atlas. Se distingue locator simplificado de error confirmado: no «refutar» una afirmación que el Atlas nunca hizo.

| ID | Atlas locator / formulación | Actual symbol / evidencia fijada | Correction / naturaleza |
|---|---|---|---|
| ACC-01 | D08 main:update/scanX | F:02/main.js:221 forwardScanX;230 story;242–244 S.scanX;524 update | locator simplificado: función productora story, consumidor update; no función scanX |
| ACC-02 | D03 camAt/setCam en cluster común lens/shift | F:07/engine/elevation.js:1148–1172; probe yaw180 | precisar que D03 no implementa shift ni giro corto; **precisión**, Atlas no los afirmaba individualmente |
| ACC-03 | D04 patchLine/patchFill/Part como índice técnico01 | F:01/core.js:146–225 toneMat;226stdMat | añadir toneMat como ruta real de fill01A; locator incompleto, no todos los fills pasan por patchFill |
| ACC-04 | D05 «normal/depth/ID passes» | F:02/draw.js:12–20/176–224 | un pase empaquetado ND/ID, luego compose y FXAA; corregir lectura de plural como passes separados |
| ACC-05 | D06 updateCaps/withColour/notes | F:03/engine.js:111 const withColour;423shape;491updateCaps | nombres válidos; withColour es flecha interna; caps limitados a extrusiones. Aclaración de responsabilidad, no renombrado |
| ACC-06 | scan/representation conceptual común03/07/02 | F:03/engine.js:121–132; F:07 GLSL_COMMON; F:02 INK | factor por vértice03 vs máscara por fragmento07/02; equivalencia conceptual no igualdad numérica |
| ACC-07 | posible reutilización de scan02 como trayectoria continua | F:02/main.js:221–228 | comentario C1 de donor no se sostiene estrictamente en todos límites; precisión preventiva, **no claim existente del Atlas** |
| ACC-08 | familia07 descrita como Three0.160 en resumen | HTML07A:47–48 y HTML03:276–277 | precisar patch **0.160.1** frente a02 **0.160.0**,01 **0.169.0**; afecta auditoría de compatibilidad, no inventario de variantes |

Conclusión adicional sin cambiar Atlas: screen-space invariance se limita a plano/frame fijo; eye keys/rect/target/width pueden cambiar y el volumen profundo no es invariante (§2). No atribuir error al Atlas por usar un nombre de mecanismo abreviado.

# 14 Dependency Graph

| Nodo | depends_on | unlocks | can_parallelize | blocks |
|---|---|---|---|---|
| I0 baseline/autoridad/lifecycle + golden master | SHAs/licencias fijados | todos los labs | preparar fixtures/evidencia | cualquier extracción sin freeze ni licencia |
| C encuadre mínimo D01 + referencia D03 | I0, poses/region Rubik | especialización D02, comparaciones estables | M máscara pura | nuevos cambios cámara sin contrato de unidades/endpose |
| C2 frontal sección D02 | C, section descriptor | continuidad sección en S5/S7 | backends técnicos | uso de rect/z/PLAN donor como autoridad |
| M máscara local D08/D07 | I0, basis/extents reales | ambos backends, material scan | C y D04 aislados | sweep sin polaridad/restore/reduced |
| G backend geométrico D04 | C/M, mesh ownership/material lease | elección de tinta, scan sobre shader | alternativa B y caps style en fixtures separados | integración hasta soportar recursos/late maps |
| B alternativa pantalla D05 | C/M, frame reconstruction, capacidades FBO | decisión G vs B | G, sin integrar ambos | producto hasta medir fidelidad/coste/transparencia |
| P caps/notes D06 | descriptor actual, C2, backend elegido | sección técnica honesta | H hatch sobre otra fixture | caps de otras topologías sin dato |
| H hatch D07 | M, material lease, sombra/luz disponible | fachada técnica/light bridge | P | «Solar verificado» desde luz demo; integración sin color-space review |
| T composición D08 | M + G **o** B elegido; no requiere ambos | sección/fachada continuas | pruebas P/H ya aisladas | restore/reduced/OFF sin cerrar |
| L lifecycle integrado | C/P/H/T según corte | candidato de revisión visual | pruebas en fixtures uno/dos niveles | publicación como aprobado sin S9/S10 |
| F5 reconciliación | HEAD final FT3D-5, no WIP | uso en axon/exploded | **todos los labs anteriores** | sólo integración que toque sus owners/transforms/anchors |

Ruta corta: I0→C/M→G→decisión B si aporta→P/H→T→L→review. M puede estudiarse antes del backend. FT3D-5 continúa V2 en paralelo sin depender de estos labs; F5 no bloquea cerrar este análisis ni sustituye un handoff estable.

# 15 Reuse Decision Matrix

| ID | Principal | Copiable legalmente bajo repo MIT | Conviene conservar | Reescritura/adaptación mínima | Lo rechazado como autoridad |
|---|---|---|---|---|---|
| D01 | COPY + ADAPT | sí, con avisos; dependencias aparte | fórmula altura/tan, wrap | unidades/sesión/region/clipping y validación | claves/cámara global/R y pos+width inconsistente |
| D02 | EXTRACT MECHANISM | sí | rect vs punto de fuga | base de descriptor y transacción projection/view | PLAN/vh/rooms/casa3niveles |
| D03 | REFERENCE ONLY | sí, pero redundante | comparación de fachada | ninguna API productiva nueva | stage/Lenis/yaw largo/keys |
| D04 | EXTRACT MECHANISM | sí, verificar snippet/headers | pesos/edges/appearance front | lease/callback/cache/GLB/normal/lifecycle | batching destructivo/paleta/estructura |
| D05 | REIMPLEMENT FROM MECHANISM | sí, addons con notices propios | depth-footprint/bordes/poché | layout+clipping+mesh classes+capabilities+restore | IDs/cut/normal ambigua/fondo/real pipeline completo |
| D06 | EXTRACT MECHANISM | sí | cache topología/notas/estilo cap | descriptor/offset/dato real/layout/DOM/lease | solver universal fingido/colourFor/cotas demo |
| D07 | EXTRACT MECHANISM | sí, revisar fragmento exacto | hatch filtrado/misma sombra | normal/basis/color space/material/luz snapshot | KIND/porchAO/fecha/sol como dato |
| D08 | EXTRACT MECHANISM | sí | máscara/polaridad/estado absoluto | extents/Story/backend/restore | curva/sentinels/WALK/fondo ficticio |

No candidato recibe «COPY + ADAPT» a nivel de módulo completo. D03 no se porta por mera completitud. Los datos de demo son Tipo C rechazado incluso en los candidatos viables. Las obligaciones de terceros se mantienen separadas (§3.2). La decisión de algoritmo no aprueba alcance de implementación.

# 16 Sculpture Backlog — Cut 1

**No implementado ni autorizado por este documento.** S0 freeze → S1 aislamiento → S2 misma demo en lab → S3 quitar **una** assumption → S4 autoridad Rubik → S5 repetir; después **S6** lifecycle, **S7** forward/reverse/restore, **S8** mobile/reduced/performance, **S9** comparación lado a lado, **S10** aprobación humana/freeze. Son etapas de método, no diez commits obligatorios. Los SCULPTURE CUT S1…S8 siguientes son entregas pequeñas distintas de esas etapas; cada corte recorre las etapas necesarias y conserva un checkpoint recuperable.

## SCULPTURE CUT S1 — Encuadre verificable

- **Goal/source/target:** demostrar una primitiva sin duplicar Story; D01 core:eyeKey/camAt/applyCam y D03 como contraste; destino evaluadores existentes + harness aislado.
- **Copied:** sólo helpers matemáticos ausentes; **rewritten:** binding de cámara, unidades y clipping; sin importar core/stage.
- **Authority:** roomFrame/overview/endpose y geometry/Building bounds reemplazan keys/R; no se cambia selección de estancia ni ruta.
- **Golden master:** 01 en plano/frame constante y07 frontal, con poses/FOV/viewport/time fijados; incluir contraejemplo de punto profundo.
- **Tests/evidence:** puros de factor2/shortest-angle/proyección/pos-width; stills de mismos landmarks, resize y matrices antes/después; perfil de precisión.
- **Exit gate:** invariante definida sin falsa promesa de volumen fijo, endpoints/restore/OFF idénticos, no shader/dependencia nueva; review de delta antes de ampliar.

## SCULPTURE CUT S2 — Frontal y máscara pura

- **Goal/source/target:** D02 resolve/mix/place-camera y D08 regla de máscara; sección local + estado puro de representación, **sin materializar todavía**.
- **Copied:** fórmulas de rect/tangente y máscara reducidas; **rewritten:** basis/region/polaridad/extents, sentinels y scheduler.
- **Authority:** descriptor de sección/fachada, p Story, región UI; nada de PLAN/WALK.
- **Golden master:** 03 intervalo frontal fijo y02 frente en coordenada mundo; cada uno en su convención, no comparación de curvas distintas como iguales.
- **Tests/evidence:** NDC/semialtura, ejes/signos/offsets, progress aleatorio/reverse y máscara en puntos conocidos; móvil/resize de fit.
- **Exit gate:** mismo corte legible sin órbita, estado total/reversible, no shader/render nuevo ni cambio del producto OFF. Opciones tan lineal/log se comparan, no se impone cambio visual aún.

## SCULPTURE CUT S3 — Tinta geométrica mínima

- **Goal/source/target:** D04 línea+fill mínimo sobre **una** malla compatible Rubik, fuera de flujo default.
- **Copied:** edge/line weighting/frente mínimo; **rewritten:** lease/references/normal/cacheKey y disposal, sin Part mutador.
- **Authority:** mesh real y material autorizado; no copiar casa/colores/madera.
- **Golden master:** pieza01 con mismos tres pesos, cámara y DPR; candidato con geometría Rubik, comparación explícita de qué cambia.
- **Tests/evidence:** mapas tardíos, clipping, callback original, no pérdida atributos, drawcalls/geometría/memoria cold/warm, F/R/restore y móvil.
- **Exit gate:** estilo técnico legible y reversible, cero residuo/leak, programa no recompila por p; decidir si aporta suficiente antes de abrir alternativa cara.

## SCULPTURE CUT S4 — Alternativa raster acotada

- **Goal/source/target:** evaluar D05 como **alternativa**, una fixture con caps/huecos; no nueva arquitectura de producto.
- **Copied:** como máximo constantes de comparación atribuidas; **rewritten:** pase técnico/layout/reconstrucción/clases y renderer-state ownership propios. No AO/shafts/look.
- **Authority:** misma geometría/transforms/clipping/cámara que S3 y caps reales.
- **Golden master:** dibujo02 ND+compose+FXAA separado del real; comparación contra S3 sobre misma fixture, viewport/DPR/luz.
- **Tests/evidence:** normal ambos signos, FBO unsupported, vidrio/GLB/clip/resize/contextloss, coste de targets y draws en GPU física/teléfono cuando disponible.
- **Exit gate:** decisión registrada G **o** B por calidad/coste/soporte. Si no hay beneficio o hardware, queda experimental; no sumar pipeline al default ni declarar rendimiento móvil aprobado.

## SCULPTURE CUT S5 — Cap verdadero y nota con fuente

- **Goal/source/target:** D06 estilo/cache/layout sobre caps actuales de **un nivel**, manteniendo openings.
- **Copied:** mecanismo mínimo de cache/posición de nota; **rewritten:** descriptor/lease/DOM y tolerancias en marco Rubik.
- **Authority:** crossings/gaps/builtTop y etiqueta/datum de entidad real; no shape/level/cota donor.
- **Golden master:** extrusión03 con hole y nota, comparada con sección Rubik real equivalente en topología, sin fingir misma casa.
- **Tests/evidence:** cap no aparece en plano equivocado ni tapa hueco; cancel/reverse/rebuild/density/mobile y fuente de cada texto.
- **Exit gate:** mejora visual sin ampliar cobertura geométrica falsamente, OFF actual, nota accesible; multi-level caps separado tras F5 si procede.

## SCULPTURE CUT S6 — Sombra técnica mínima

- **Goal/source/target:** D07 hatch/shadow blend sobre un material y fachada compatibles.
- **Copied:** filtro hatch/mecanismo de máscara con notice; **rewritten:** normal transform, espacio de color, hook/lease y selección de sombra de luz existente. Sin brick/porchAO/PMREM/fecha demo.
- **Authority:** façade descriptor, SurfaceRenderer y Solar snapshot/luz de presentación actual.
- **Golden master:**07 antes/después de sweep con sol fijo; después comparación Rubik bajo luz idéntica, no imponer LATE ni 16:40.
- **Tests/evidence:** identidad de sombra, movimiento/flicker/DPR/resize, Solar sin cambiar, nonuniform/multimaterial/late maps, F/R/restore y coste real.
- **Exit gate:** hatch legible y filtrado, transición sin salto de sombra, material original intacto al salir, fallback honesto sin shadow y review humana del color space.

## SCULPTURE CUT S7 — Una transición completa

- **Goal/source/target:** D08 con backend **elegido** y D02 para una sección, o D07 para una fachada; escoger sólo una primero.
- **Copied:** regla mínima de mezcla/frente; **rewritten:** timeline de representación local sobre stateAt, callbacks/targets y lifecycle host.
- **Authority:** Story/cámara/descriptor/ruta/materiales actuales; no spline ni geometría front/behind donor.
- **Golden master:** frente02 o07 en puntos fijos y retorno, pares Rubik efectoOFF/ON con mismo proyecto/cámara/viewport/DPR/luz/time.
- **Tests/evidence:** p0/.25/.5/.75/1 y reverse real/saltos; close/cancel/Back/rebuild/assetlate/resize/contextloss/reduced; capturas sin residuos, medición GPU física si se declara soporte.
- **Exit gate:** misma identidad espacial, sin doble contorno/material perdido, restore exacto/OFF intacto, unsupported con razón. Ninguna obligación de conectar aún FT3D-5.

## SCULPTURE CUT S8 — Cierre de lifecycle y reconciliación opcional

- **Goal/source/target:** cerrar consumidores implementados de S1–S7 con proyectos uno/dos niveles; no añadir efectos.
- **Copied:** nada nuevo; **rewritten:** sólo adapters que fallen en evidencia, no Core.geometry ni contratos.
- **Authority:** transacciones actuales, capabilities y HEAD final FT3D-5 **si se decide integrarlo**. Sin ese HEAD, terminar sólo sección/fachada y registrar pendiente.
- **Golden master:** pares congelados S7 y baseline antes del efecto, materiales/maps/lighting/viewport documentados.
- **Tests/evidence:** T0 completo, pruebas de fallo Begin/rollback, permisos/atribuciones de captura existentes y cierre de recursos; matriz soportado/fallback/no-data.
- **Exit gate:** S9 comparativas y S10 aprobación explícita de Juanma por SHA; ningún test, score ni SwiftShader sustituye esa aprobación. No promover templates ni cambiar V2 por este backlog.

**Formato mínimo de futura evidencia:** donor SHA y producto SHA; fixture/revisión y procedencia de medidas; pose/target/FOV/shift; p local/global y tiempo fijo; luz/snapshot; viewport CSS/buffer/DPR; opciones/quality/capabilities; capturas F/R/OFF/restored; lista de recursos/limitaciones. Registrar medianas/tails sólo después de medir, sin presupuesto inventado ni comparar máquinas distintas como equivalentes.

# 17 FT3D-5 Reconciliation Pending

**PENDING FINAL FT3D-5 HEAD RECONCILIATION**. Contrato V2 en a0b6b0d es autoridad contractual; implementación en `feat/ft3d-5-axon-exploded` = **WIP / NOT CANONICAL**, sin inspección de su working tree ni comparación contra un HEAD móvil.

| Candidatos potenciales | Comprobar cuando llegue HEAD final | Qué NO cambiar antes |
|---|---|---|
| D01/D02/D03 | estado de cámara, altura/lente, region, near/far, p0/p1 y overview(level) elegible | anchors/overview semantics, duraciones y campos de contrato; no crear overview(building) por helper |
| D04/D05 | membership/matrices de meshes activos/secundarios, slab/furniture/lamps y recursos globales | ownership V2, reparenting prohibido, geometría, deltas absolutos y límite2niveles |
| D06 | si caps de otro nivel realmente existen y qué descriptor permite representarlos | no inventar espesor/huecos, no prometer caps multi-level desde demo3niveles |
| D07/D08 | cómo transformaciones temporales afectan basis/mask, materiales/clipping/luz, caches y cargas tardías | Solar/material source; ningún sweep altera baseTransform ni escala del proyecto |
| Todos | Begin failure rollback, End/cancel/Back/rebuild/resize/contextloss, holds/reduced/OFF, recursos devueltos | no añadir gates premium al cierre V2 ni declarar su implementación obsoleta |

V2 preserva un player, misma cámara/escena, nivel activo sin reparenting, separación visual absoluta y recomposición antes de End. No se rediseña aquí. La reconciliación requiere SHA final entregado, diff estable y evidencia de sus adapters; **no esperar ni provocar esa entrega** para cerrar Cut1. FT3D-6/7/8 no se promueven ni implementan.

# 18 Risks / Unknowns

| ID | Riesgo / unknown exacto | Evidencia actual | Gate / resolución futura |
|---|---|---|---|
| U1 | costes reales GPU/teléfono de edges/targets/shadow | source counts y SwiftShader Atlas; no benchmarks del adapter inexistente | S3/S4/S6/S7 medir equipo físico, cold/warm/DPR/resources; no FPS/budget afirmado |
| U2 | compilación/composición de hooks con todos GLB/materiales Rubik | anchors presentes; r160.1 chunks iguales; r169 diferencias | fixtures de material/skin/instancia/map late/clipping y GPU; fallback actual por clase |
| U3 | selección final backend tinta | D04 menos passes, D05 cobertura de bordes raster distinta | decisión comparativa S3/S4, no portar ambos preventivamente |
| U4 | procedencia individual de snippets hash/noise sin firma | repo MIT, ningún notice individual en unidades inspeccionadas | revisar fragmento literal antes de redistribuir; reimplementar si origen material no se aclara; no requiere copiar noise demo |
| U5 | binarios concretos Google Fonts | OFL oficiales verificadas, CSS donor no fija versión de font | no incorporarlos; si se eligiesen, auditoría/versionado separado |
| U6 | renderable float/transparencia/normal signo | capacidades varían; layout D05 no universal | FBO real y normal/depth format propio, fallback/OFF sin allocations |
| U7 | estado adicional view/up/callbacks de nueva representación | snapshot actual no registra un shift/view nuevo | lease/restore explícitos, rollback/throw/contextloss antes de integración |
| U8 | fuente canónica de FT3D-5 implementado | sólo V2 es autoridad en este corte | HEAD final + reconciliación §17, no leer WIP |
| U9 | calidad/acabado aprobado para geometría arbitraria | donor14 runtime ya observado; no producto con efecto implementado | stills/reverse/reel corto sólo si resuelve pregunta; Juanma review S10 |
| U10 | cap universal/fondo/estructura/cotas no modelados | ausencia de dato/algoritmo universal, no contradicción pendiente | no prometerlos, preservar caps actuales/omitir con razón; no ampliar scope |

Estos son **gates de extracción/integración futura**, registrados con límites concretos. No faltan archivos/símbolos materiales para el análisis D01–D08; por eso no se convierten en un PASS de compatibilidad ni bloquean la entrega documental. Si una implementación quisiera afirmar soporte/precisión/rendimiento antes de resolverlos, su estado sería INCOMPLETE. No se trasladan tests o claims históricos del Atlas a este corte como ejecutados hoy.

# 19 Coverage & Gates

**Cobertura:** 8/8 dossiers con bloques conceptuales A–Q en orden; ocho decisiones principales; call graphs y fronteras de responsabilidad; fuentes/producto/contrato fijados; duplicaciones, riesgos y backlog. Los símbolos simplificados se registran en ACC sin modificar Atlas. Se inspeccionaron las autoridades obligatorias en §4, no una implementación WIP.

| Gate | Resultado / evidencia |
|---|---|
| D01 exact symbols inspected | PASS, §5A/F/P y probe real |
| D02 exact symbols inspected | PASS, §6A/F/P y probe real |
| D03 exact symbols inspected | PASS, §7A/F/P y probe real |
| D04 exact symbols inspected | PASS, §8A–G, incluye toneMat/hull/Part |
| D05 exact symbols inspected | PASS, §9A–G, shaders/targets/compose completo |
| D06 exact symbols inspected | PASS, §10A–G, flecha withColour/caps/notes/helpers |
| D07 exact symbols inspected | PASS, §11A–G, mat y GLSL_COMMON/shadow |
| D08 exact symbols inspected | PASS, §12A–G, story/forwardScanX/update/compose |
| callers/callees relevant identified 8/8 | PASS, A/E de cada dossier |
| internal dependencies mapped 8/8 | PASS, A/E/F |
| external dependencies mapped 8/8 | PASS, E/M y §3.1/3.2 |
| Three.js compatibility analysed where applicable | PASS de análisis, §3.1; **no** compilación GPU certificada |
| demo assumptions enumerated 8/8 | PASS, G; no constantes adoptadas como datos |
| reusable core identified 8/8 | PASS, H y §13 |
| reuse decision assigned 8/8 | PASS, I, §15; una principal por ID |
| Rubik authority mapped 8/8 | PASS, tablas J y baseline §4 |
| preserve/replace map complete 8/8 | PASS, K |
| exact adaptation blueprint complete 8/8 | PASS, L, con owner/boundary/fallback |
| forward/reverse/restore implications complete 8/8 | PASS, D/L/N y T0 |
| reduced-motion implications complete 8/8 | PASS, L/N; holds/discrete, no scroll obligado |
| performance risks classified 8/8 | PASS, M; costes por pipeline separados, sin FPS ficticios |
| tests required defined 8/8 | PASS, N/T0; propuestos, no tests de producto ejecutados |
| sculpture strategy for all viable candidates | PASS, O: S1–S5 por ID; D03 reference harness explícito |
| cross-candidate duplication analysed | PASS, §13; no tres cámaras ni todos los renderers |
| dependency graph completed | PASS, §14: depends_on/unlocks/can_parallelize/blocks |
| implementation-order proposal completed | PASS, §16: SCULPTURE CUT S1–S8, pequeños y con exit gate |
| FT3D-5 dependencies explicitly marked pending | PASS, §17 y blueprints; no handoff inventado |
| no product code modified | PASS, sólo archivo documental de esta entrega |
| no FT3D contract modified | PASS, sólo este archivo; V2/Atlas intactos |
| no Claude branch touched | PASS, worktree propio desde Atlas; no inspección WIP |
| git diff --check | PASS requerido y verificado en cierre del commit |
| worktree clean after commit | comprobación del SHA publicado en handoff; ningún scratch dentro del producto |
| branch pushed normally | push de esta rama únicamente; remoto exacto verificado en handoff |
| no PR | PASS, este flujo no crea PR |
| no merge | PASS, un commit documental sobre Atlas |

**Validación del corte:** lectura de fuentes fijadas + comparación de12chunks/4anchors LineMaterial + pruebas deterministas de cámara/invariantes descritas en §2; validación estructural de secciones0–20, A–Q×8, tablas y locators; diff documental y whitespace. No CI/Preview ni suite browser/productiva nueva: no cambia runtime y no hay una hipótesis de integración ejecutable que justifique repetir las campañas anteriores. Las comprobaciones Git de publicación se informan con SHA exacto en el handoff para evitar un autorregistro circular del commit.

**Conclusión:** análisis COMPLETE; ningún blocker material para este corte documental. Adaptación/escultura/compatibilidad GPU/aprobación visual **no realizadas** y condicionadas a gates explícitos, no asumidas como PASS. Sólo se publicó documentación, sin PR/merge.

# 20 Future Cuts

Actualización explícita de la cola histórica al cerrar Cut 2: D09–D13 pasan a análisis completo (§§22–26), sin implementación productiva.

- D09 — COMPLETE, §22; adaptación final pendiente F5.
- D10 — COMPLETE, §23.
- D11 — COMPLETE, §24.
- D12 — COMPLETE, §25.
- D13 — COMPLETE, §26.
- D14 — PENDING.
- D15 — PENDING.
- D16 — PENDING.
- D17 — PENDING.
- D18 — PENDING.
- D19 — PENDING.
- D20 — PENDING.
- D21 — PENDING.

# 21 CUT 2 — Status, Evidence Manifest & Delta

**DONOR-CODE GAP ANALYSIS CUT 2 — COMPLETE.** Investigación D09–D13, **5/5**; acumulado D01–D13, **13/13**. Sólo documentación. Ningún adapter, nueva capacidad, contrato, test productivo, Atlas o Roadmap modificado. No aprobación visual/productiva. D14–D21 no iniciados. La frontera obligatoria es: **datos Rubik → descomposición/representación temporal → recomposición → orientación/selección → room/entry válidos → ruta validada por Rubik → coreografía → hold/stop → reverse/exit → restore**.

| Autoridad | SHA exacto / estado | Uso en Cut 2 |
|---|---|---|
| Cut 1, padre directo | `6a573f1955fd70dd52bb10450c9b9df9b4833aa0` | fetch normal inicial, HEAD local/remoto exactos y limpio; nuevo worktree desde este commit |
| Atlas, padre de Cut 1 | `7696fb2c6c30f158001d38ecc53feb2674acaa25` | índice ya leído íntegro, no evidencia sustitutiva de fuente; sin editar |
| Producto Rubik | `5f4e3d20e905f5f302783f67fda0ab4a7eb21371` | autoridad runtime; origin/master seguía en este SHA al fetch; no cambio de baseline |
| Donor flat-to-3d | `d7b9b69753d3af679535ee56695a05c8d955c3c6` | checkout externo limpio, LICENSE releída, fuente y runtime fijados |
| Contrato FT3D-5 V2 y addendum | `a0b6b0d6c3c8d8475e99a43a6f137afe9c355e8b` | ambos leídos completos desde git show del commit, copias externas; nunca implementación móvil |
| Claude FT3D-5 | WIP / NOT CANONICAL | no inspeccionado, leído, diffado, probado ni tocado; **PENDING FINAL FT3D-5 HEAD RECONCILIATION** (F5) |

**Aislamiento:** rama `docs/ft3d-donor-code-gap-analysis-cut2-2026-11-01`, worktree `C:/Users/temp123/work/floorplan-3d-donor-gap-analysis-cut2`, ambos nuevos. Único cambio permitido: este archivo. No reset/clean/rebase/cherry-pick/merge/force-push/PR. Otros worktrees intactos. Cut 1 es padre de investigación; los locators R siguientes se refieren al código producto idéntico al baseline, no a una implementación FT3D-5 posterior.

**Convención de evidencia:** F = donor fijado, rutas abreviadas `01=01-exploded-house`, `02=02-section-sweep`, `03=03-open-section`, `05=05-schedule-build`, `07=07-sunlit-elevation`; R = Rubik baseline. Las líneas son 1-based de esas fuentes, los símbolos son el locator estable. SOURCE-PROVEN = lectura/trazado; PROBE-PROVEN = ejecución del cuerpo extraído; RUNTIME-OBSERVED = observación dirigida; PROPOSED FUTURE TEST = aún no ejecutado; UNKNOWN = límite abierto. Ningún histórico Atlas/Cut1 se suma a los resultados de hoy.

## 21.1 Evidencia ejecutada y límites

Directorio externo único: `C:/Users/temp123/work/ft3d-reference-workspace/evidence/cut2/`. Reproducción con Node y SDK Playwright ya instalado en `floorplan-solar-ci-tools/node_modules/playwright` (1.62.1); Chrome `153.0.8010.53`, headless, SwiftShader, DPR1. Servidor local de sólo lectura en 8847. No instalación ni dependencia de producto.

| Evidencia EXECUTED | Fuente / entrada / invariant | Resultado exacto y alcance |
|---|---|---|
| `transforms.cjs` → `transforms.json` | cuerpos reales update de dir-c/a/b, declaraciones GAP/LAND/LIFT/PULL/FOLD/GROW originales; Three0.169; owners/labels/dash mock | **3 escenarios**, 17 evaluaciones cada uno; mismo p produce mismo snapshot en forward/reverse/saltos; no 51 tests de producto |
| `verify-probes.cjs` → `verify-probes.json` | posiciones esperadas independientes D09, globals y tolerancia 1e-10 | PASS; coordenadas y escala core verificadas, incluyendo piso inferior/otro piso/ciudad/cap. No prueba builder, GPU, topología ni End inexistente |
| `curves.cjs` → `curves.json` | extracción real buildWalk/walkPose02 + sampleTourSpline05 y datos reales; Three160/169 respectivos; 1440×900 | **2 escenarios de curva + 1 contraejemplo sintético**; muestras 0/.25/.5/.75/1 y overshoot en ambas curvas. Barrido 99 puntos interiores/segmento; no máximo continuo ni prueba de choque con casa |
| `runtime.cjs` → `runtime.json` | 8 escenarios dirigidos: 01C/A/B, nav01, nav03, nav07, path02, tour05 | 7 observados; nav07 falló por expectativa externa530 frente a override525. Registro conservado, no fallo atribuido al donor |
| `nav07-corrected.cjs/json` | repetir **sólo** nav07 contra data-at real525 | observado525, foco PARLOUR, active PARLOUR, sin pageerror; total **8 escenarios distintos observados en 9 intentos** |
| Capturas + inspección visual | 01A/B/C en p0/.5/1; nav03 desktop y390×844, nav07, path02, tour05 | 14 imágenes originales; `decomposition-contact.png` y `navigation-contact.png` revisadas visualmente; no inferir seguridad/rendimiento de las imágenes |

Las unidades completas primarias leídas: dir-a/b/c y main/core pertinentes01; main02 con helpers/solids; page03 y render/radar03; run07 y los tres page.js con overrides; view05 completo y helpers importados necesarios (sin abrir investigación D18). Contrato/addendum y acumulativo Cut1 completos. Se releyeron geometry/project, Building/presentationSources, renderer de niveles, Story, minimap/UI, framing, route.plan/choreography, snapshot/begin/apply/end. No campaña de14 rutas repetida ni regresiones no relacionadas.

## 21.2 Dependencias/licencias alcanzadas — delta de §3

| Dependencia alcanzada | Versión / licencia | Necesaria para mecanismo / incidental | Equivalente Rubik, compatibilidad y obligación |
|---|---|---|---|
| donor fuente propia | SHA fijado, MIT ©2026 Samnang Aing | algoritmos/procedural/HUD en golden master | si se extrae código conservar copyright/licencia; permiso no valida arquitectura ni datos. No código redistribuido aquí |
| Three + addons01/05 | 0.169.0, MIT | vectores/matrices/curvas útiles; renderer/RoomEnvironment/Line2/geometry addons incidentales al mecanismo puro | Rubik vendor0.160.0; diferencias de shaders/materials/pass y API se prueban en lab. No mezclar runtimes ni portar core/view entero; preservar notices addons si se copian |
| Three02 | 0.160.0, MIT | CatmullRomCurve3 real; pipeline dibujo/real incidental a D13 | misma revisión matemática que vendor Rubik; no garantiza seguridad de spline ni compatibilidad de pipeline completo |
| Three03/07 | 0.160.1, MIT | proyección/radar real03;07 SVG no necesita WebGL adicional | versión patch distinta; scissor/viewport/state son del renderer host, no copia de stage |
| Lenis07 | 1.1.14, MIT | importado por engine/run; scroll suave incidental | player Rubik suficiente; excluir Lenis de adaptación, no segundo scheduler; si algún día se redistribuye requiere notice propio |
| Google Fonts | IBM Plex Mono; Chakra Petch; OFL1.1 (licencias oficiales ya verificadas §3.2) | texto DOM/canvas; no necesarias para math/transform/seek | excluir fonts/assets; fuente del sistema Rubik. HTML no fija binarios concretos, no afirmar auditoría de cada binario ni que MIT los relicencia |
| DOM/SVG/Canvas2D/RAF/ResizeObserver/MutationObserver | APIs navegador | etiquetas/input/proyección según caso | usar lifecycle/semántica host, liberar listeners/observers. No licencia de paquete adicional |
| Texturas/casas/cotas/entourage procedurales | código donor MIT, sin archivo externo necesario en estas unidades | incidentales al golden master | no importar ni convertir en verdad del proyecto; RoomEnvironment/PMREM sólo iluminación de demo, Solar Rubik sigue autoridad |

No proveedor, descarga de datos, font, mesh, nuevo runtime Three ni dependencia de red propuestos para Rubik. Compatible legalmente no equivale a adecuado. El coste físico GPU/telefonía de adapters inexistentes es **UNKNOWN — MEASURE IN SCULPTURE LAB**.

# 22 D09 — Floor by Floor

## A. Identity

F:01/dir-c.js completo, `build(labels):14`, helper `storey:74`, `timberFloor:115`, `GAP:210`, `LAND:212`, `keys:213`, `update:223`, `radar:273`. MIT y dependencias §21.2. Call graph material: main01 elige dir por query → await build(Labels) → storey/Part.build crean grupos/mallas → main.step calcula intro y p → **S.update(p)** escribe transforms/UI → core.camAt(S.keys,p)/applyCam → Labels.update → renderer.render. `introHook(T)` gobierna llegada de sombras, distinto reloj de p. update no llama cámara ni planner.

## B. Behaviour

Apila **seis grupos**: Ground S0(base0), Level01..04 SL(bases4.5/8/11.5/15m), Roof05 SR(base18.5m). Son cinco plantas más cubierta, no algoritmo de tres niveles. Orden explícito de construcción del array, no orden deducido de geometría. p0 es edificio separado **incluyendo el piso inferior elevado**; p1 ensamblado con cámara dentro de Level3. La narrativa deja Level4 separado mientras entra visualmente en Level3 y luego lo baja. No selecciona un nivel de proyecto, resuelve entrada, conecta escaleras ni vuelve a overview al final.

## C. Data Flow

Constantes de casa → builders de geometría local por planta → `storeys[{base,g,part,lines,label}]` → LAND/GAP y p absoluto → posiciónY por grupo, escala core, cap, color/opacity de líneas/labels, dash y captions. `keys` separados + viewport → pose D01; radar recibe cámara/stop y dibujo manual XZ. Fuente no es Building ni modelo importado; ningún `levelId` ni room/entry válido entra en este flujo.

Inventario SOURCE-PROVEN:

| Owner | Contenido y efecto | Al separar / global |
|---|---|---|
| S0 | losa/base, columnas/fachada y piezas de ground | todo hijo mueve en Y con S0 |
| SL01..04 | beams/columns CLT, screed, glazing/fins, collars y luminarias geométricas | todo hijo acompaña nivel; muebles/mesas/sillas/personas/plantas sólo en L3=SL[2] |
| SR | cubierta y piezas roof locales | mueve con último grupo, no roof global de Rubik |
| coreG | núcleo global continuo, geometría authored | **escala vertical**, no separa en tramos ni valida conexión |
| capG | remate del núcleo | traslada al top del SR |
| cityUp / street/context | ciudad alta, calle/papel/contexto | cityUp se aplasta `.scale.y=.012` en **cada** update, incluso p1; resto fijo |
| sun/hemi/ambient | luces globales | no mueven por planta; introHook altera shadow intensity por T, no p |
| dash / labels | líneas de separación globales; labels con anchor local y proyección | dash se reconstruye cada update; anchors siguen matrixWorld, fade de labels .36–.40 |

Las luminarias de planta son meshes, no un sistema de luces fotométricas por nivel. No llamar «conector real» al núcleo estirado.

## D. State & Lifecycle

Builders añaden grupos una vez; update **no reparenta, no clona ni suma al frame previo**. Reverse = reevaluar p, sin undo. Mock probe prueba mismos transforms para secuencia desordenada, no restauración de objetos originales del editor. No Begin/End, snapshot, cancellation ni dispose: la página posee escena/cámara/listeners/RAF durante su vida. p1 no restaura cityUp ni cámara inicial. Resize actualiza ctx/renderer/proyección y siguiente frame usa keys phone; no deriva GAP/LAND de bounds ni reordena plantas. Error de build/labels no tiene rollback editorial. Futura transacción debe envolver todo, no confiar en endpoints de demo.

## E. Dependencies

Part/geometry/materials/labels/dash/core helpers; ease cúbica simétrica, win/clamp, arrays cerrados sobre build. Three169 y DOM para tags; textures/entourage/sky/intro/paper incidentales. Núcleo puro sólo necesita bases, intervalos y distancias, sin renderer ni fonts. No dependencia de ruta/room solver. D01 keys y proyección de labels son consumidores independientes del estado, no inputs de separación.

## F. Mathematical / Spatial / Rendering Mechanism

`win(p,a,b)=clamp((p-a)/(b-a),0,1)`; `ease(t)=4t³` si t<.5, si no `1-(-2t+2)³/2`. `LAND=[[.06,.13],[.11,.18],[.16,.23],[.21,.30],[.70,.82],[.80,.90]]` son **intervalos temporales de aterrizaje**, no cotas. `GAP=[3.6,3.6,3.6,3.6,5.4,3.6]m` son **extras por interfaz**, incluida interfaz suelo→S0; no alturas ni separación total de cada planta.

`land_i=ease(win(p,a_i,b_i)); extra_i=Σ(j=0..i) GAP_j*(1-land_j); Y_i=base_i+extra_i`. Y vertical mundo; X/Z y rotaciones preservados. Cálculo absoluto respecto a base literal. La interfaz baja que queda abierta levanta todas superiores. Core: `top=Y_SR+.5+.24+2.6`; `scaleY=(top-.3)/(21.84-.3)`; cap.positionY=top. Ciudad=.012. Dash: nueve puntos de columna en cada una de cinco interfaces con gap>.05m, más cuatro bajo S0 si elevado: máximo49 segmentos; p1 cero. No bounds dinámicos alimentan fit ni radar.

PROBE-PROVEN, esperado/actual coincidentes dentro1e-10 (metros, redondeo sólo de tabla):

| p | S0 Y esperado=actual | L3 Y esperado=actual | SR Y esperado=actual | cap Y esperado=actual | core scale esperado=actual | ciudad scale |
|---|---|---|---|---|---|---|
| 0 | 3.6 | 25.9 | 41.9 | 45.24 | 2.08635097493036 | .012 |
| .25 | 0 | 13.8358024691358 | 29.8358024691358 | 33.1758024691358 | 1.52626752410101 | .012 |
| .5 | 0 | 11.5 | 27.5 | 30.84 | 1.41782729805014 | .012 |
| .75 | 0 | 11.5 | 25.9375 | 29.2775 | 1.34528783658310 | .012 |
| 1 | 0 | 11.5 | 18.5 | 21.84 | 1 | .012 |

`transforms.json` contiene las seis plantas/49..0 dash, no sólo tabla. Secuencia exacta: `[0,.25,.5,.75,1,1,.75,.5,.25,0,.73,.12,1,.25,.5,0,.25]`. Historial independiente para todos los snapshots. El core mock verifica escala, no exactitud constructiva del núcleo. p0 camera axon usa tY22, altura56 y fov 1.5°; p.60 pose authored `[10.4,EYE,7.1]→[-6,EYE,3.4]`, EYE13.84m, fov56°/phone 82°. No auto-fit a los grupos separados ni garantía de continuidad con un anchor Rubik. Radar XZ ignora desplazamientoY: orientación no visualización volumétrica del gap.

## G. Demo Assumptions

**Algorithmic:** suma acumulativa y easing absoluto, evaluación desde base; **visual policy:** LAND, GAP, colores/fade/umbral .05, radio130, encuadre y duración scroll; **donor-house-specific:** BX12/BZ8, FH3.5/G04.5/BEAM.5/SLAB.24, seis grupos, L3 amueblada, núcleo/cap y ciudad; **unsafe as product truth:** CLT/glulam/cotas/FFL, sistema resistente, área384m², núcleo extensible, exacta entrada a estudio y ciudad aplastada. Ninguno se convierte en dato Rubik. Número de plantas se cuenta del builder; no se hereda una suposición «tres niveles» de otra familia.

## H. Reusable Core

Evaluación pura de offsets visuales ordenados desde base inmutable, con estado total en cualquier p; separar membership, política de gaps y cámara. Es una idea pequeña, no hace falta importar timberFloor, coreG, R ni HUD. Para Rubik V2 ya existe política contractual distinta; el valor es verificar reversibilidad y responsabilidades, no reemplazarla con GAP.

## I. Reuse Decision

**EXTRACT MECHANISM.** Retener patrón absoluto y separación de evaluator/owner como fixture de laboratorio. Reescribir binding/política/timeline a V2; rechazar escala de conector, ciudad y cámara dentro de casa como autoridad. Copiar módulo completo contradice scope/owners/endpoints del contrato.

## J. Rubik Authority Mapping

| Responsabilidad donor | Autoridad Rubik estable | Adapter / frontera exacta |
|---|---|---|
| bases y orden | Building.levels + presentationSources; V2 descriptor source estructural completo | orden `(order,sourceIndex,levelId)`; no selected-room subset, máximo2 niveles; axon≥1, exploded≥2 |
| base transform | V2 baseBuilding/active frame; View3D owners vigentes | snapshot original; planXY/elevationmm, mundoX←planX,Y←vertical,Z←planY; mm→m **una vez en Begin** |
| delta absoluto | V2 extraMm y perfil temporal | `currentY=savedBaseY+dyM`, nunca +=; no GAP donor. Gap nominal mediana diferencia positiva o fallback wallheight2800; visualgap clamp(round(storey*.45),800,1600)mm; clearance clamp(round(gap*.25),200,400) |
| separación antiintersección | V2 bounds bottom/top en descriptor | extra0=0; extra_i=max(i*gap,prev.top+extraPrev+clearance-current.bottom,0); datos reales, no núcleo estirado |
| active level | renderer archFloor/archUp/furnG/lampG distribuidos | handles separados, **no active reparenting**; owner final pendiente F5 |
| slab | levelSlab/levelsG; losa superior real puede estar en levelsG aun siendo nivel activo | asignar una vez al owner correcto, conservar huecos; no mover dos veces |
| furniture | project.objects, buildFurniture, GLB child del padre | acompañar owner si visible; GLB no delta adicional individual; mueblesOFF sigueOFF |
| lamps | lampG y política actual | separar luminarias mesh y luces reales, respetar toggles; no copiar luces demo |
| globals/connectors | V2 global policy, Building.stairs | ground/context/roof/exterior no mover; hide en exploded según contrato; escaleras keep compacto/hide exploded, **nunca stretch**; contact shadow hide |
| cámara/overview(level) | PresentationPlan elegible, overviewPose/presentationStopPose y Story | p0/p1 misma overview(level), sin overview(building) ni anchor desde habitación inexistente; continuidad D01 subordinada a estas poses |
| begin/rollback | V2 lifecycle View3D | snapshot semántico nivelView/visibilidad/cámara/orbit; active→all sync si preciso, resolver handles **después**; Begin fallido rollback y error propagado |
| p0/p1/reverse | V2 secuencia única | exploded10s:0–.22compact,.22–.55separar,.55–.74hold,.74–.90recomponer,.90–1overview; axon7s hold.28–.72; p0/p1 visibles exactos **antes** de End |
| recomposición/End | View3D lifecycle + V2 | restaurar owners vigentes y visibilidad, después levelView/sync; no tocar handles muertos; End idempotente y snapshot cámara |
| resize/reduced | mismo descriptor/anchors, nuevo aspect/region, mismo p | sin Box3/rebuild por Apply; reduced estados discretos compact/exploded; un player y una ocurrencia global |

V2 mapping completo es documental, no certificación de implementación. F5 §31 enumera cada binding aún desconocido. No se añaden labels/minimap del gap ni se cambian anchors, duraciones o límites para imitar al donor.

## K. Preserve / Replace Map

**PRESERVE:** Building/Core geometry, transforms base, toggles, selección, cámara/Story/End Rubik. **CANDIDATE:** evaluator puro y fixture acumulativa donor. **REPLACE:** membership literal, unidades/política gap/tiempo, labels y fit por descriptor V2. **REJECT:** escala core/city, seis niveles por defecto, falsa estructura y ruta del estudio. **DEFER:** integración real a owners finalizados hasta F5; Board/Unfolded no se incorporan a V2.

## L. Exact Adaptation Blueprint

Inputs futuros: descriptor V2 puro, p local Story, handles vigentes y snapshot/revisión; outputs offsets/visibilidad temporales y pose derivada del plan, sin proyecto nuevo. Owner: sesión View3D existente, no nueva escena ni player. Begin valida supported y overview elegible, captura estado semántico, hace sync permitido y resuelve owners; fallo parcial restaura estado previo antes de devolver error. Apply desde base+delta absoluta, sin rebuild/allocgeom/reparent; reverse/seek mismos outputs. Recompone antes de p1; End restaura transforms/flags actuales, camera y levelView en orden V2 e invalida leases/caches. Resize conserva descriptor/p y refit de región; no redescubre membership por frame. Unsupported/no overview/context loss → fallback actual con razón; reduced holds discretos; **OFF no snapshot, delta, recursos ni cambio de encuadre**. Binding final, bounds y coordinación con asset late quedan F5; no se programa aquí.

## M. Risks

Architecture HIGH si grupo global se asigna como planta o se usa handle previo al sync; geometry HIGH si estirar núcleo/GLB o doble slab; route HIGH si entrar a L3 separado se interpreta como camino; precision MEDIUM mm/m/offsets. CPU por update donor O6 más líneas/labels, hasta49 segmentos regenerados; seis matrices de grupo más core/cap/city, descendants matrixWorld por renderer. No clone geom ni bounds por frame; arrays nuevos LAND/dash/strings y material color updates. Labels6+core, Canvas texturas sólo build; no FBO/target/pase extra propio de separar; drawcalls de escena conservados, dashed line se actualiza (ocultar poropacity no ahorra draw); shaders técnicos son D04, no requisito del gap. Sin dispose editor ni restauración donor: riesgo HIGH de leaks en port literal. Mobile HIGH por fit authored/fov82/labels y seis plantas, no medición de teléfono. Accesibilidad requiere UI host y reduced; mantenimiento de owners/bounds HIGH; notices MIT/addons. Rendimiento final **UNKNOWN — MEASURE IN SCULPTURE LAB**, no FPS extraídos de SwiftShader.

## N. Tests Required

**PROPOSED FUTURE TEST:** T0 y §33; puro para uno/dos niveles, offsets, bounds heterogéneos, gap mínimo y orden estable, mm/m una vez, p0/p1/reverse/random repetidos. Integración membership activo/secundario/slab/furn/lamps/GLB, globals/stairs/toggles; cinco ciclos sin deriva, geometría/material/IDs idénticos; Begin throw tras sync, End doble, Back/cancel/rebuild/contextloss; resize hold/transición y reduced/OFF sin allocations. Capturas cámara0/1 antes de End y después, no sustituir verificación numérica por screenshot.

## O. Sculpture Strategy

S0 freeze donor y capturas01C; S1 extraer update sin cambiar fórmula; S2 reproducir tabla/forward/reverse y separar globals; S3 reemplazar **sólo** membership por fixture contractual dos niveles; S4 reemplazar GAP por V2, preservando datum y base; S5 binding Rubik sólo tras F5; S6–S8 lifecycle/mobile/reduced y costes; S9 comparativas con pose/datos fijos; S10 aprobación humana por SHA. No fabricar seis niveles ni introducir demo como prueba de contrato. Entregas concretas C2-S1/S2/S7/S8 en §30.

## P. Evidence

F:dir-c:74–209 owners;210–271 evaluator/timeline;273–305 radar;main01:121–173 orden cámara/labels. R:building-core y building-ui:presentationSources; index:buildLevels/levelSlab, presentationStoryBegin/Apply/End; contrato V2+addendum fijados. PROBE-PROVEN tabla y globals; RUNTIME-OBSERVED `01-c`1440×900 p0/.25/.5/.75/1/.5/0, imágenes 0/.5/1 inspeccionadas: gap y estudio, no retorno overview. FunctionSHA256 y valores completos en JSON. No afirmación de restore productivo ejecutado.

## Q. Confidence

**Source HIGH:** fórmula/owners/tiempos/direct calls y probes completos. **Adaptación MEDIUM contractual, pendiente F5 en bindings reales**; seguridad/coste/visual de adapter no implementado UNKNOWN. A. Donor mechanism analysis COMPLETE. B. Final Rubik adaptation **PENDING FINAL FT3D-5 HEAD RECONCILIATION**.

# 23 D10 — The Board

## A. Identity

F:01/dir-a.js completo, `build:29`, `layer:61`, side subgroups y builders, `LIFT/PULL/ORDER:316–320`, `landAt`, labels:323+, `keys:340`, `STOPS:363`, `update:371`, `drawPlan:472`; caller main01→S.update→camAt/applyCam→Labels.update→render. layer crea grupo/Part/líneas/anchor; Part.build materializa geometría agrupada por material. No clasificación de mesh importada. MIT, Three169/addons y Canvas, §21.2.

## B. Behaviour

Seis capas **manualmente semánticas y authored**, no materiales descubiertos automáticamente ni geometría clasificada. Floor, structure, glazing, cladding, rafters, roof. Algunas comparten lift vertical y otras añaden pull lateral; el montaje acaba antes de la visita authored porch→long room→loft/ridge. ORDER parece ensamblaje constructivo porque el autor conoce su casa; el algoritmo sólo hace una secuencia visual. No acredita orden real de obra, estructura ni capas de otro proyecto.

## C. Data Flow

Constantes FL/EH/roof pitch/espesores → geometrías locales `layer.g` con piezas en coordenadas authored → `part.build()` y subs.build → map id→intervalo → p→lift[level]+pull*dir → transforms/linecolor/labelopacity/dash → cámara definida por keys, intro draw y DOM caps. Inputs Rubik inexistentes. Part agrupa por material dentro de layer pero **membership de layer lo decidió código**, no ese material.

| Grupo | Owner / contenido real | Movimiento |
|---|---|---|
| L1 floor | slab/strip footings, suelo, muebles apoyados, patch solar pintado | lift1, sin pull |
| L2 structure | paredes CLT, tabiques, loft y escalera authored, cocina/muebles loft | lift2, sin deducir estructura |
| L3 glazing | subgrupos E/S/N/W y quinto subgrupo puerta | lift2, pull±X/±Z3.4m; puerta además corre enZ |
| L4 cladding | subgrupos S/N/W | lift2, pull±Z/−X6.2m |
| L5 rafters | glulam ridge/rafters a600, steel collars y pendants geométricos | lift3 |
| L6 roof | paneles aislados, zinc con seams y gutters | lift4 |
| global | paper/planPlane/dash, scene lights | fijo excepto regeneración dash; plan no acompaña a floor |

No luz física nueva por layer; sunpatch es malla decorativa, no cálculo Solar. Mobiliario distribuido por conveniencia authored, sin ownership reutilizable room/objectID.

## D. State & Lifecycle

Grupos creados/build una vez, posiciónY asignada absolutamente; subs.position reseteada desde dir cada update. La puertaZ se **sobrescribe después**, no suma a pull. No reparenting dentro de update; no ocultación `.visible=false` al «aterrizar»: capas continúan en escena. Vidrio transparente y drawing/wash participan; etiquetas se desvanecen, eso no elimina meshes ni trabajo de render. Reverse/saltos deterministas en probe; p1 casa montada con puerta abierta, no estado inicial de editor. No snapshot/End/dispose/rollback. Resize cambia cámara/ctx y colX/labelgap, no geometría ni clasificación. Cancelar el scroll sólo para progreso, no devuelve recursos a un host.

## E. Dependencies

Core Part/Labels/Lines/Dash y helpers; Three169/BufferGeometry/Shape/rounded geometry, Canvas2D drawPlan. Texturas, papel, hatching y marca son incidentales. Extractor de transforms no requiere buildPlan/furniture/shaders/room solver. Cámara D01 comparte runner, pero no está integrada al lift. El plano raster2400×1600 con cotas y materiales authored no es un output de geometry Rubik.

## F. Mathematical / Spatial / Rendering Mechanism

ORDER de seis IDs. `landAt(id)=[.05+i*.056,.05+i*.056+.068]`; `land[id]=ease(win(...))`. `lv={1:1-land.floor,2:1-land.structure,3:1-land.rafters,4:1-land.roof}`; `LIFT={1:2.3,2:4.9,3:10.2,4:15.6}`m. Para k1..4: `lift[k]=Σ(j≤k)(LIFT[j]-LIFT[j-1])*lv[j]`, con LIFT0=0. GrupoY=lift[group.level]. Glazing/cladding tienen land propio para pull, pero el lift2 lo gobierna **structure**, no su land.

`sub.position = dir * PULL[id]*(1-land[id])`, PULL glazing3.4/cladding6.2. Direcciones authored normales cardinales por fachada, sin derivación de normal de muro. `L3.door.g.position.z=-1.25*ease(win(p,.54,.64))`: puerta deslizante independiente. Colores de lines acentúan el último intervalo iniciado; label opacity=(.5 o1)*(1-win(.40,.45)); anchors por getWorldPosition proyectados en Labels con gap mínimo48CSSdesktop/26phone, colX=.725W o W−100. No cálculo universal de oclusión ni cota generada por label.

PROBE-PROVEN, seis layerY y puerta/pull:

| p | layerY floor/structure/glazing/cladding/rafters/roof (m) | pull relevante | puertaZ | dash segmentos |
|---|---|---|---|---|
| 0 | 2.3 / 4.9 / 4.9 / 4.9 / 10.2 / 15.6 | glazing3.4, cladding6.2 | 0 | 28 |
| .25 | 0 / 0 / 0 / 0 / 5.3 / 10.7 | glazing0, cladding3.61550987176878 | 0 | 16 |
| .5 | 0 / 0 / 0 / 0 / 0 / 0 | ambos0 | 0 | 0 |
| .75 / 1 | 0 / 0 / 0 / 0 / 0 / 0 | ambos0 | −1.25 | 0 |

Los transforms y valores secundarios coinciden al repetir p forward/reverse/random (§21.1), sin probar restore editorial. keys hacen legible el stack con axon de altura authored y pasan a perspectiva interior; no bounds-after-transform ni relación inferida con ruta. Dash<=28 segmentos en estado inicial de esta demo, sin targets extra por Board. El renderer sigue pipeline01 técnico D04 y sombra existente.

## G. Demo Assumptions

**Algorithmic:** capas con base y evaluator absoluto, suma de incrementos lift, proyección de anchor; **visual policy:** separación vertical/lateral, ORDER/stagger, gap labels, paleta/cámara; **donor-house-specific:** seis IDs, loft, CLT120/glulam600, pitched40°, zinc, larch22×140, puerta y strip footings; **unsafe as product truth:** importar materiales/productos/cálculo resistente/aislamiento/construcción/obra y cotas del sheet. Apariencia madera o wall.structure='load-bearing' declarado **no demuestra CLT, vigas, entramado o solución calculada** (R:project-core:301–313 limita declaración a unknown/partition/load-bearing/other y fuente humana/importada).

## H. Reusable Core

Descriptor temporal de membership **ya probado**, composición de lift con pull por normal real y anchors que siguen world matrices. La posibilidad de explicar grupos modelados aporta; clasificador semántico/casa/caption no. Una sola vista de muros/suelos/huecos reales basta para investigar beneficio sin fabricar cinco grupos inexistentes.

## I. Reuse Decision

**EXTRACT MECHANISM.** Aislar evaluación de transforms/anchors, reescribir membership desde fuentes reales y etiquetas honestas. No COPY del builder. Es **capacidad futura separada**, comparte responsabilidades temporales con D09, no se añade a FT3D-5 V2 por parecido visual.

## J. Rubik Authority Mapping

Derivabilidad revalidada contra R:project-core.geometry:268–296/wallRect y declaración limitada, index buildArch/buildFurniture/levelSlab/buildLevels, roof-core y SurfaceRenderer; Atlas§10.1 sólo inicio. «Legal/honesto» de tabla = afirmación arquitectónica, permiso MIT tratado aparte. No fila ESTIMATED necesaria: no hay estimación estructural autorizada.

| Donor group / evidence | Rubik source posible | Clase / certeza | ¿Honesto renderizar? | Adapter requerido / fallback |
|---|---|---|---|---|
| floor L1 / builder slab+footings | rooms.polygon/floorMaterialId, Building.slabThicknessMm y levelSlab con huecos | SOURCE dato, DERIVED malla / HIGH | sí superficie y losa visual donde existe; **UNAVAILABLE cimentación resistente** | membership suelo/losa real, nombre «suelo/losa visual»; sin espesor conocido lámina explícita; omitir strip footings |
| structure L2 / paredes+loft+ladder | project.walls.height/thickness/openings, geometry, objects | DERIVED muros / HIGH; **UNAVAILABLE CLT/frame/loft estructural** | sí muros modelados, muebles existentes; declaración portante conserva fuente, no verificación | agrupar por IDs, mantener huecos/status, no asignar glulam/CLT por material; omitir estructura no modelada/escalera invented |
| glazing L3 / cuatro sides+door | openings.wallId/offset/width/sill/height/hinge, geometry.windows/doors/slides | SOURCE/DERIVED / HIGH | sí huecos/ventanas/puertas existentes, no triple glazing/producto certificado | normals/hinges desde muro, no fachada acristalada completa si no existe; omitir faltantes |
| cladding L4 / boardsAlong y sides | wall.materialId/appearance, SurfaceRenderer | SOURCE apariencia / HIGH; UNAVAILABLE espesor/build-up | sí acabado visual asignado; no tablones físicos22×140/aislamiento | overlay **VISUALIZATION ONLY** rotulado si se aprueba futuro; preferir superficie actual, omitir capa volumétrica |
| rafters L5 / ridge y rafters cada.6 | no autoridad rafters/joists/trusses; objects puede contener luminarias | UNAVAILABLE estructura / HIGH | no fabricar cerchas/rafters; luminaria real SOURCE independiente | omitir con razón «estructura no modelada»; no utilizar roof envelope para inferir vigas |
| roof L6 / paneles/zinc/gutter | roof-core deriveProject/deriveBuilding y roofG según capacidad | DERIVED condicional / HIGH | envolvente visual actual sí, pitched/insulation/zinc/seams no declarados no | conservar derivación/clipping/topología real; omit cuando unsupported, no pitched por defecto |
| furniture/pendants repartidos L1/L2/L5 | project.objects y assets autorizados, owner nivel | SOURCE/DERIVED / HIGH | sí geometría actual, sin reasignar a estructura por apariencia | usar IDs/revisión y toggles; sin objeto, ausencia |
| planPlane global / drawPlan | geometry.rooms/walls/openings y minimap | DERIVED plano / HIGH; cotas dependen calibración | sí plano actual, no sheet de la casa | proyección con unidades/fuente; no copiar cotas/logo/norte/schedule de demo |
| dash/lift/pull/callout | state temporal + anchors objetos reales | VISUALIZATION ONLY / HIGH | sí como explicación visual, nunca secuencia de obra | UI rotula «despiece visual»; sin anchor no callout, no completar datos |
| context/paper/sunpatch | site/context real y luces existentes | SOURCE/DERIVED condicional; patch donor VISUALIZATION ONLY | sólo contexto existente respetando atribución; no soleamiento medido de una malla | excluir patch/city demo; OFF/context ausente se respeta |

## K. Preserve / Replace Map

**PRESERVE:** geometría/owners/IDs/materials/toggles/Building/Solar Rubik. **CANDIDATE:** lift/pull/anchor evaluados por p. **REPLACE:** capas semánticas por descriptor de grupos realmente derivables; camera por bounds/region D01 actual. **REJECT:** vocabulario constructivo inferido, fusión destructiva Part en GLB, orden de obra, cotas/puerta demo. **DEFER:** Board como capacidad hasta aceptación/fixtures; uso del lease final FT3D-5 pendiente F5, sin convertirlo en requisito de cierre V2.

## L. Exact Adaptation Blueprint

Inputs: grupos con sourceIDs/revisión, handles vigentes, normal/bounds derivados, progresión de representación no constructiva; outputs transforms/labels temporales. Owner sesión View3D y UI existentes. Begin valida cada grupo y descarta unsupported con razón, captura base/visible/material/anchor sin cambiar padre; mesh de múltiples grupos es error de membership, no mover dos veces. Apply base+lift+normal*pull absolutos, labels de dato real desde matrixWorld actual; sin regex de material para «rafters». End/cancel/failure devuelve exactamente estado/referencias e invalida anchors/epoch; reverse reevaluación. Resize refit sobre bounds temporales cacheados por estado, re-layout DOM; no boxes por mesh por frame. Fallo/no capas suficientes→vista actual y razón; reduced estado compacto/despiece discreto con controles accesibles; OFF cero groups/clones/overlays nuevos. Board no inicia ruta: recomponer→seleccionar stop real→planner host. No nombres/API nuevos aprobados.

## M. Risks

Arquitectura/topología HIGH: membership compartida, abertura separada del muro, ownership de slab/glass/material; falso sistema estructural HIGH, no solucionable con estilo. Route HIGH si puertas visuales sustituyen entradas; visual MEDIUM/HIGH por depth/transparencia/clipping/labels; precisión MEDIUM de normals/unidades. CPU O6+8 subs (cinco glazing, tres cladding), color/label/dash; seis grupos principales+ocho subgrupos de transform, puertaZ override; descendent matrices adicionales del renderer. Geometría merge/build una vez, no clone/bounds/frame; drawPlan canvas2400×1600 build, seis DOM anchors. Cero targets/passes nuevos por despiece; drawcalls existentes+dash/labels, vidrio transparente sigue renderizando aun montado. Material/shader D04 existente en demo, no requerido al separar. Arrays/strings temporales cadaupdate; falta disposal/Snapshot donor. Mobile labelcol/gap mejora densidad pero keys/casa fijas, no prueba de escena arbitraria. A11y/acceso a datos/foco se exige host; mantenerMIT/addons; coste real **UNKNOWN — MEASURE IN SCULPTURE LAB**.

## N. Tests Required

**PROPOSED FUTURE TEST:** T0/§33; membership disjunto, base+normal correcto en muros rotados y offsets, apertura acompaña sin cortar topología, no false structure, metadata SOURCE/DERIVED/VISUALIZATION ONLY/UNAVAILABLE honesta. Probe grupo omitido y falta roof, sólo suelo/muro/huecos. Browser F/R/random, cinco ciclos, cancel/throw/no reparent, assets tardíos/toggles, transparency y selección intacta; label source/projectID/position, móvil portrait/landscape/reduced/teclado/OFF. Medir drawcalls/memoria sin sumar presupuesto inventado. Ninguna de estas pruebas de adapter se ejecutó aquí.

## O. Sculpture Strategy

S0 golden 01A sin cambios; S1 separar evaluator de builders conservando seis grupos; S2 sustituir una capa por fixture de muros modelados; S3 quitar rafters/CLT/footings sin dato y demostrar ausencia; S4 derivar normals/huecos/labels de fixture Rubik; S5 integrar temporalmente una capacidad Board separada sólo si se autoriza y bindings reconciliados; S6–S10 restore/measure/comparativas/review. C2-S3 es entrega mínima, no un «FT3D-5 extra».

## P. Evidence

Source locators A/F/J; `transforms.D10` 17 evaluaciones, `01-a` runtime p0/.25/.5/.75/1/.5/0 y imágenes 0/.5/1 inspeccionadas: stack legible, montado antes de visita, puerta independiente. El texto CLT/glulam es autor de la casa, no entrada al clasificador. C2-CC1 (§28) precisa cola Atlas frente a seis capas reales sin reescribir Atlas.

## Q. Confidence

**Source HIGH**, grouping/lift/pull/callout y límites respaldados por fuente/probe/runtime. **Adaptación MEDIUM** de subset derivable; estructura ausente no es unknown a rellenar, se omite. Calidad/performance de Board arbitrario UNKNOWN; lease real si compartido queda F5.

# 24 D11 — Unfolded Room

## A. Identity

F:01/dir-b.js completo, `build:21`, `wall:106`, `FOLD/GROW:198–199`, `keys:204`, `update:217`, `SH:262`, `decal:266`, `CODES:285`, `OUT:314`, `drawSheet:377`, `buildTextures:455`, oakFloor/zellige/rug. Call graph main01→await build→floor/wall/Part.build→update(0)+scene.updateMatrixWorld→drawSheet/decal/attach/tag creation→main.step:update→camera→Labels→render. `update` wrapper también actualiza tags/textura fade; probe captura núcleo fold/grow/light, no builder/decal/raster. MIT+Three169, RoundedBoxGeometry/materials/Canvas incidentales al plegado puro.

## B. Behaviour

Una cocina authored de **6×4.8m**, cuatro paredes verticales cardinales, altura2.9m/espesor.12m; floor fijo, walls levantadas con bisagras y lid dependiente de north. No elige roomID ni detecta paredes; orden N/S/W/E lo decide autor. Presenta seis superficies planas sobre hoja, levanta paredes/ceiling, hace crecer contenido/decoración y entra con cámara authored. No soporte paramétrico demostrado para room arbitrary. Una habitación no rectangular/curva/no ortogonal no se arregla cambiando RX/RZ: la geometría, pivotes, sheet y textos están codificados por separado.

## C. Data Flow

RX3/RZ2.4/H2.9/TH.12→OX3.12/OZ2.52 → floor, wall(id,pos) con `{pivot,items,wp,ip}` → meshes authored por cara → FOLD/GROW(p)→rotations/scales y door/light → parent chains desplazan huecos/decal/tags. Paralelamente SH y medidas/códigos manuales→dos CanvasTextures→planos recortados UV→attach al owner en pose flat. Ninguna cota/schedule se calcula desde una pared Rubik ni del tamaño de hueco importado.

| Owner | Geometría / relación |
|---|---|
| floor / fItems | floor fijo; muebles de suelo child fItems escalaY |
| N pivot(0,0,−OZ) | panel sólido, kitchen sobre items; lid hijo de este pivot |
| S pivot(0,0,+OZ) | contorno de muro con notch de puerta x1.4..2.3/head2.2, frame en wp; door hinge bajo pivot |
| W pivot(−OX,0,0) | panel sólido, sideboard/art en ip/items |
| E pivot(+OX,0,0) | Shape hole ventana z±1.3,sill.48/head2.45; frame/glass wp, bench/curtains ip |
| lid / lItems | techo apoyado en N aY=H, recorre z0..2OZ local; bisagra propia además de rotación N; pendant en lItems |
| global | groundsheet/paper, sun y lamp; transform no es owner de habitación Rubik |

Huecos existen en la geometría authored E/S; frames y glass siguen el mismo wall pivot. No resolución de colisión en esquinas ni identidad de muro compartido. Corners son coincidencias de coordenadas de paneles separados, no grafo topológico.

## D. State & Lifecycle

update asigna cada rotación/escala desde p; reverse evaluable y probado para fold/grow/door/sun/lamp/wash. Floor no cambia transform de base; crecen sus hijos. Construcción hace reparenting **real** en decal: scene.add(mesh), actualizar matrices, `parent.attach(mesh)` conserva world pose flat. No reparent por frame, pero política incompatible con «nunca reparentar owner activo» si se copiara sobre mallas productivas. No clones del proyecto porque casa es creada por demo; no prueba de identidad preservada en editor. No End/dispose/rollback/cancel de recursos, p1 paredes cerradas/door abierta y luz diferente. Resize cambia fit/layout de canvas/DOM labels; no redibuja topología o layout sheet desde datos. No validación pública de input arbitrario: failure para curva/sharedwall no es fallback implementado, es **caso no soportado por el diseño authored**.

## E. Dependencies

Part/Shape/extrusion/rounded boxes, core draw/fog/materials/Labels, scene/camera/ctx, sun/DRAW; Canvas2D para textures y cotas manuales. buildTextures crea plaster/oak/walnut/zellige/art/rug con seeds, no proveedor. Códigos/tablas/fonts decorativos no necesarios para math de hinge. Sin detector de room/wall adjacency, solver net/collision, construcción BIM o association openings genérico. Window/door shape manual no acredita parser de topología.

## F. Mathematical / Spatial / Rendering Mechanism

`fold_X=1-ease(win(p,FOLD_X))`. N.rotationX=−π/2*foldN, S.rotationX=+π/2*foldS, W.rotationZ=+π/2*foldW, E.rotationZ=−π/2*foldE, lid.rotationX=−π/2*foldLid. Pivots en arista inferior exterior fija, no centroid. Posición mundo de hijo=producto matrices parent desde roomRoot; lid acumula N+lid. FOLD: west.12–.24,north.19–.31,east.26–.38,south.33–.45,lid.42–.56. Orden de montaje visual distinto del orden de creación.

`grow=.015+.985*ease(win(p,GROW_X))`; floor/lid items.scaleY, N/Sitems.scaleZ, W/Eitems.scaleX: escala normal/profundidad del contenido, **no cambia paredes para resolver topología**. GROW: floor.06–.18,west.16–.26,north.23–.33,east.30–.40,south.37–.47,lid.44–.52. S door localhinge(1.42,0,−.07) rotaY=`ease(win(.56,.65))+1.6*ease(win(.78,.85))`, termina2.6rad. Sun lerp A(−7,11,8)→B(10,7.2,3.2) en.56–.70; lamp5.5*win(.66,.84); DRAWwash1−ease(win(.20,.50)). Luces visuales, no fechas/resultados Solar.

PROBE-PROVEN: p0 folds N/S/W/E/lid=(−π/2,+π/2,+π/2,−π/2,−π/2), grow todos.015, door0,wash1,lamp0; p.25 N−π/4,S+π/2,W0,E−π/2,lid−π/2; p.5 paredes0,lid−.494594761789647rad,growlid.9384375; p.75 folds0/grow1/door1/lamp2.75; p1folds0/grow1/door2.6/lamp5.5. Misma p en17 evaluaciones→mismos snapshots. No confundir esto con sampler de tag/camera history ni restore de material.

Sheet: SH=(x0−8.6,z0−11.6,w17.2,d18.4,s150), canvases2580×2760 cada uno, panel y ground. Decal genera PlaneGeometry en worldXZ, recorta UV al canvas global y attach en estado plano con matrices actualizadas; **siete decals panel** (incluido segundo fragmentoS) y uno ground. CODES13 tags + OUT7=20 DOM labels; normal transformada y dot con cámara gobiernan visibilidad, proyección core. Canvas code() dibuja punto y retorna antes de texto, texto upright proviene de tags DOM. Cotas/norte/1:50/schedule y coordenadas sheet authored, no derivadas. Panel material fade en.48–.56; ground fade.10–.18; opacity0 con transparent/depthWritefalse no elimina objeto ni draw automáticamente. main llama S.update antes de aplicar cámara del mismo frame: futura adaptación debe actualizar matrices/pose antes de proyectar, sin asumir que ese orden demuestra error visible observado.

## G. Demo Assumptions

**Algorithmic:** matriz alrededor de pivot conocido, jerarquía/attach preservando world en init, easing absoluto; **visual policy:** FOLD/GROW/order/fades/doorangles/sun/lineweights; **donor-house-specific:** rectángulo/cardinales/altura/espesor, notch/ventana/techo/lid norte/layout SH/kitchen; **unsafe as product truth:** norte, cota medida, acabado/productos/sheet certificado, propiedad compartida de muros, altura uniforme o ceiling real sin dato. No afirmar soporte curved/non-axis con rotaciones cardinales; ejes de muro rotado podrían derivarse, pero forma de sheet y shared ownership requieren otro adapter.

## H. Reusable Core

Concepto de superficie con arista de bisagra y transform absoluto, anchor local que acompaña matriz y separación entre geometría y overlay. La net de seis caras, auto-room y cotas no son core general: no existen como algoritmo. Extraer hinge aislado es pequeño; la mayor parte de la solución futura es asociación/topología Rubik, por eso decisión siguiente distinta de D09/D10.

## I. Reuse Decision

**REIMPLEMENT FROM MECHANISM.** Derivar cara/arista/normal/huecos de datos validados y usar representaciones temporales con ownership explícito; no portar wall()/drawSheet como solver. Unfolded es capacidad futura separada de FT3D-5. Si no se demuestra topología, vista de estancia actual con razón, no rectángulo sustituto.

## J. Rubik Authority Mapping

Revalidación R:project-core.geometry:268–296 conserva polígono, wallRect rotado y opening.wallId; Building offsets/elevation y renderer ceilings/slabs; Guide revision y sourceCurrent UI. Inputs requeridos:

| Input | Fuente Rubik / disponibilidad | Adapter y fallback honesto |
|---|---|---|
| room boundary | **existing** rooms.polygon→geometry.rooms.poly | validar polígono no degenerado; sin boundary unavailable |
| ordered wall segments / face | **derivable** orden de edges del polígono, **ambiguous** relación exacta cara-room→wallIDs fragmentados | comprobar distancia/tolerancias/orientación/multiplicidad; no usar nearestWall sin prueba; fallback room view |
| wall height | **existing** wall.heightMm o defaults.wallHeightMm | conservar altura heterogénea/procedencia; default sólo visual rotulado, no medición; si no apto omitir desarrollo |
| wall thickness | **existing** thicknessMm y wallRect | plano de cara según lado interior, no centro de pared por comodidad; sin espesor sólo representación plana explícita |
| openings shape/location | **existing** kind/offset/width/sill/head/swing y geometría derivada | cortar misma superficie preservando límites; no hueco inventado cuando faltante |
| opening-to-wall | **existing** opening.wallId, **ambiguous** cara de room/shared side | vincular IDs y lado, no asignar a ambos rooms; corner-crossing invalid/ambiguous→fallback, no clipping silencioso |
| neighbouring/shared wall identity | **ambiguous** IDswalls existen pero room↔faces/vecinos no grafo explícito probado | resolver ownership face único; no plegar wall editor compartida ni duplicar dato como fuente |
| floor elevation | **existing** Building.level.elevationMm, offsetMm; marco activo de renderer | mm→world única vez, floorpolygon actual; sin Building datum local rotulado |
| room orientation | **derivable** edge/normal interior; **existing** norte sólo si site declarado | usar ejes/local A/B sin norte; no cuatro cardinales inventados |
| surface/material | **existing** floorMaterialId/wall.materialId/appearance; **ambiguous** acabado distinto por cara si no modelado | mantener superficie/neutral explícito, no producto/capa técnica |
| annotation/callout | **existing** name/ID y medidas modelo **derivable**, dato de fabricante **unavailable** sin fuente | texto con fuente/unidades/calidad; omitir SG-01/OK-02/schedule/norte/certificación donor |
| stable IDs / revision | **existing** project/room/wall/opening IDs y Guide.revision/UI sourceCurrent | resolver handles vigentes, epoch para cambios, cancelar ante revision distinta |
| ceiling | **derivable** cierre visual actual según room y altura, **ambiguous/unavailable** techo real complejo | optional plano visual rotulado u omitir; no lid rígida/roof inventada |
| furniture | **existing** objects posición/rotación/tamaño y assets autorizados | optional owner de suelo, no pegar a pared por cercanía, respetar OFF; omitir si no hay ownership |

No todos los datos ambiguos impiden toda representación: una fixture rectangular con asociaciones demostradas es posible; no habilita room universal. Topología no rectangular/concava/curva/sharedwall y aperturas entre caras requiere evidencia específica, no default arquitectónico.

## K. Preserve / Replace Map

**PRESERVE:** Core/Building/topología/IDs/materials/selection. **CANDIDATE:** hinge math y proyección de anchors en representación propia temporal. **REPLACE:** wall selection/ordering, pivot/basis, membership, text/UV/layout y light state por dato/procedencia host. **REJECT:** sheet/cotas/norte/productos/kitchen/corner assumptions como truth; attach del owner activo y escalado de malla real. **DEFER:** unsupported topologies/ceiling y binding compartido F5; no ampliar V2.

## L. Exact Adaptation Blueprint

Inputs futuros: roomID/revisión, boundary+faces ordenadas con referencias de pared/huecos y calidad/procedencia, basis/pivots derivados, poses/región. Output representación transitoria de caras comprobadas con huecos/labels honestos, sin modificar proyecto. Owner sesión View3D; originales preservados. Begin valida topología **antes** de asignar recursos, snapshot de visibilidad/cámara y recursos exclusivamente propios; cualquier clone de representación debe conservar holes/atributos y disponer sólo sus recursos. No reparentar originales ni asumir reutilización de lease FT3D-5. Apply matriz desde base/hinge absoluta, no crecer paredes reales; transforms no alteran dimension metadata. End/fallo/cancel libera representación/DOM/listeners y restaura originales/snapshot/selection; reverse reevaluación, no undo. Resize refit y layout según mismas caras/datos/p, cache invalidada cuando revisión cambia. Ambiguo/no-data→room view actual con razón, nunca caja rectangular sustitutiva. Reduced layout estático/plano o cerrado con selector; teclado/foco/lectura textual para cada cara; OFF cero clones/meshes/resources y comportamiento actual.

## M. Risks

Topology/authority HIGH por room-face association, sharedwalls/corners/openings/concavity y falsos defaults; precision HIGH por espesor y pivot en cara vs centerline. Architecture HIGH si attach originales, geometry/material lease incorrecto o closure reconstruida; route HIGH si puerta desplegada se interpreta como entrada válida. CPU por update cinco rotaciones+seis escalas+door/sun/lamp/wash y20 tags, matrices descendants; no clones/bounds por frame donor, pero renderer actualiza matrices. Init merge/extrusion/texturas intensivo; dos sheet textures2580×2760 ≈54.3MiB RGBA combinados sin mipmaps (tamaño de almacenamiento base estimado, no medida GPU), además maps/bump/art. Ocho decals añaden meshes/draws transparentes, **cero pase/target propio** del fold; sombras existentes añaden sus draws según renderer, no prometer ahorro opacity0. Arrays tag/proyección y DOM por frame; falta disposal editor. Mobile HIGH por sheet/callouts/touch/fillrate; access HIGH si sólo diagramas. Shader draw/wash propio de D04 opcional, no requisito de hinge; mantenimiento alto si se copia builder. MIT y addons/font separados; performance final **UNKNOWN — MEASURE IN SCULPTURE LAB**.

## N. Tests Required

**PROPOSED FUTURE TEST:** T0/§33; fixture rectangular conocida: pivots/límites/aperturas al desplegar y replegar idénticos, floor/lid parents correctos sin editor reparent. Después rotado, L-shape/concavo, paredes compartidas y alturas variables, opening corner/incompleto/solapado: supported con prueba o fallback explícito. IDs/revisión/text source/material/source ceiling; pure matrix composition/normal/UV y p random; browser F/R/cancel/failBegin/resize/Back/assets/toggles/disposal/OFF; teclado foco por cara/reduced/static/móvil. No aprobar no-rectangular por una prueba de rectángulo.

## O. Sculpture Strategy

S0 flat/closed 01B golden; S1 aislar pivots sin quitar casa todavía; S2 reemplazar un wallface por fixture con hole conocido; S3 quitar labels/cotas/sheet manual una a una, generar sólo measures del modelo; S4 incluir rectangle completo con ownership no compartido; ampliar a no-rect/shared sólo tras pruebas propias, unsupported explícito mientras; S5 binding transitorio Rubik separado de FT3D-5, F5 si comparte owners; S6–S10 restore/measure/mobile/comparativas/review. C2-S4 acota primer lab, no implementado.

## P. Evidence

Source A/F/J, `transforms.D11` y capturas/runtime 01B p0/.25/.5/.75/1/.5/0. Inspección visual: sheet desarrollado0, habitación casi cerrada.5, interior1; agujeros/window/door authored siguen cara. No probe de geometría arbitraria, net solver, identidad de original o performance. C2-CC2 (§28) aclara simplificación de locator, no reescribe Atlas.

## Q. Confidence

**Source HIGH** para authored rectangular/pivots/growth/annotations. **Adaptación MEDIUM para subset probado, LOW para arbitrary room** hasta resolver asociaciones/topologías; no soporte universal ni mejoras V2 declaradas.

# 25 D12 — Radar / Navigation / Seek

## A. Identity

No subsistema único llamado radar. F:01/main.js:36–80 init/jumpToP/__jumpTo y121–173 step, configs en dir-a/b/c; F:02/main.js:418 jumpToStop, hud:435 y HTMLcm-zone; F:03/page.js keybuttons/getRadarKey/frame + engine.js render(key); F:07/engine/elevation.js `run:1205+`, jumpToP, radarCfg y render loop, overrides **a-one-door/b-the-row/c-the-face/page.js**; F:05/view.js activeInteriorStop/renderHud/bindHudEvents/setTargetWeek/loop. Unidades completas y callers leídos, no sólo grep. MIT, Three y dependencia Lenis07, §21.2.

Call graphs:01 init deS.radar→DOMSVG/buttons→click/jump→scroll→main.p→S.update stop/camera→dot/cone.02 zones→jumpToStop(WALK.stops)→scrollY→story→walkPose→hud.03 ckbutton→scrollTo(__at(PLANstop.at))→stateAt→E.place→getRadarKey→E.render(key).07 run creaLenis/radar/RAF→page.frame(p) coloca cámara→SVG marker/active/captions.05 button/slider/wheel→targetWeek/targetTour→loop→sampleTourSpline/applyCamera→renderHud→rebinding. Ninguna flecha click→planner arquitectónico donor.

## B. Behaviour

01 y07 son planosSVG orientativos con posición/cone/chapterjump,02 es **sección XY** con puntos y frente,03 es **viewport3D auxiliar real**,05 son selector de parada y scrubber temporal sin radar geométrico. Los nombres room/porch/garden de demo son destinos de progreso; no Room IDs ni autorización de ruta accesible. No importar HUD como navegación productiva por tener controles similares a minimap.

## C. Data Flow

Inventario material (owner es módulo/página indicado):

| Implementación / tipo | Inputs → output/render | Handlers / a11y | Camera / route / lifecycle |
|---|---|---|---|
| 01 main + S.radar: mini-map, orientation cue, cone, chapter selector/jump | SVGplan/path/zones authored, boundsXZ, actualeye/target/FOV y S.update.stop → dot/cone/active/tag | rect mouseenter/leave/click; botones nativos click/Enter/Space, hover tag; rectsin tabindex/keyboard; claseactive sin aria-current | perspectiva usaeyeXZ, axo marcador convencional fijo; no path/route; listeners/RAF globales sin teardown |
| 02 main/html: section mini-map, camera/cone, scan marker y stop-jump | geometry authored en SVG, camera X/Y/shift, WALK.stops y scanX → SVG/labels | zones SVG hover/click sin equivalente botón dedicado de zona; __jumpTo debug no es accesibilidad; reduced sí quita smoothscroll | sección XY, no mapa room XZ; control depende de WALK, no planner; notes/listeners/RAF sin editor cleanup |
| 03 page/engine: viewport inset3D + chapter selector | stateAt(vh), actualcamera/keyCam, section/cut y PLAN.stops → viewport/scissor de mismo renderer y botones | native ck-nav button click/teclado; `.on` visual, no aria-current; escondido phone | render segunda vista de misma escena, **no raster de minimap**; frustum/cut indicators 3D; selección p, no ruta; listeners/observer/RAF de página |
| 07 run: mapXZ rotado, decorative HUD/cone, chapter jump | radarCfg zones/ox/mirrorX y cámara, p/sweep → SVGdot/cone/scan/active/tag | SVGrectmouse; native buttons keyboard, aria-label del contenedor; activación sólo CSS, no aria-current | pageframe autoría mueve cámara, no ruta; Lenis o smoothscroll nativo; run no destroy general/observers/listeners |
| 05 view: stop selector «rooms», mode selector, progress scrubber | INTERIOR_STOPS.u/TOUR y week/targetWeek → cámara/HUD/SVGprogramme | native buttons/range, pointercapture Gantt, wheel/touch; HUD se reemplaza y rebind; roomclick pierdefoco(BODY observado) | cambia targetTour y fuerza wk14, no selección físicaRoom; RAF perpetuo; no path authority; programme no construcción real de Rubik |
| debug hooks01/02/03/07/05 | __frame/__at/__jumpTo/__p/__state | sólo automatización/diagnóstico | no API productiva ni garantía de route/keyboard |

## D. State & Lifecycle

01 p sigue scrollmáximo con factor.12/frame; `drive` desactiva RAF normal para frame manual. Jump no aplica cámara directamente, depende del scheduler y smoothscroll.02/03 normalizan vh y suavizan progreso por dt;03 getRadarKey y visibility dependen de fase/closing/phone.07 Lenis RAF o scroll nativo, MutationObserver/listeners inicializados por run; sin destrucción host.05 renderHud reemplaza DOM, rebind evita conservar listeners de nodos desconectados pero elimina foco; observa BODY tras04LOFT. Resize01/07 recalcula marker/fit,03 ajusta renderer y oculta inset cuando phone,05 modifica sheet/viewport y pone dirty; no snapshot previo del editor ni cancel semántico. Back de navegador no equivale a restaurar la cámara de entrada en demos aisladas.

03 engine.render(key) altera temporalmente viewport/scissor/fog/reveal/lineResolution y usa keyCam (fov23°) con axon/cut camera indicator; restaura normalmente después, **sin finally** alrededor de excepciones. Un port literal puede contaminar viewport/materials/mainpass. Captura y DPR necesitan viewport CSS→buffer coherente; no copiar cálculos rect del DOM sin convertir al buffer host.

## E. Dependencies

SVG/DOM para01/02/07, rendererThree extra view03, programme/Canvas05; no canvas accesible por sí solo. Three sólo para matemática de orientación01/02 o vista03;07 marcador SVG no necesita nuevos targets. Lenis07/font/layout/página incidentales, excluir de Rubik. R:FloorPlanPresentationCore.minimap, UIStory/seq/stateAt/player y View3D.pose ya cubren selección/progreso/rutas. Nuevo radar genérico duplicaría autoridad.

## F. Mathematical / Spatial / Rendering Mechanism

**01:** `jumpToP(q)`→scrollTo(clamp(q)*max(0,documentHeight-innerHeight)), smooth por defecto sin guard reduced específico en este helper. Marker perspectiva toma eye[x,z] clamped en límites S.radar; dirección target−eye normalizada; cone representa orientación con apertura ilustrativa, no prueba de visibilidad/oclusión. Axo usa dot predeterminado, no proyección deeye lejano. Stop activo viene de umbrales S.update, no testpoint-in-room. DotXZ no cambia al subirY del exploded. __jumpTo(stop) busca data-stop en DOM, no Room ID.

**02:** jumpToStop compara **texto** `g.label[1]` en WALK.stops; `scrollTop=(CH.swing.end+g.v/100)*innerHeight`; smooth sólo si no REDUCED. Dot se proyecta en secciónX/Y con clamps/camera target y shift, cone refleja dirección de mirada; scanX esotra coordenada independiente del frente. No inferir nivel activo de dotsuperpuesto a section. Los stops no constituyen lista de entradas validadas.

**03:** `__at(vh)=vh/PLAN.T*(track.offsetHeight-innerHeight)` y ckbuttons usan PLAN.stops. getRadarKey devuelve rect real244×120CSS en prueba desktop; alpha smooth(45,95,vh)*(1−smooth(flatAgain−45,flatAgain,vh))*(1−smooth(.05,.45,closing)); phone(<700px helper de página) devuelve null. Es el mismo modelo renderizado con keyCam, no otro Building ni solver. RUNTIME desktop ckbutton2 salta al stop 735; resize390×844 esconde cad-key(displaynone), cinco botones siguen en DOM pero ocultos con el grupo, no accesibilidad móvil acreditada por contar nodos.

**07:** p=scrollY/innerHeight*100, `jumpToP(q)`→Lenis.scrollTo(q/100*innerHeight) o window.scrollTo smooth. Helper no guarda reduced. `u=clamp(-cameraZ,-3.6,17)`; `rawX=cameraX-ox`; `v=clamp(mirrorX?6-rawX:rawX,.4,5.6)`. Cone desde atan2(dv,du), radio2.8 y semiapertura.42rad, **no frustum exacto** ni alcance físico. Activezone por intervalos u más caso especial p>340/u<.2; scan usa lerp(−3.5,16.5,clamp((sweepZ+14)/28)). ConfigA overrides stops95/385/**525**/635/**735**; B ox18/mirrorXtrue, stops105/405/550/635/655; C ox0, labels1:20WALL/RAKESUN/HEADER/PORCH/INTERIOR, stops92/280/375/455/520. Reusar engine defaults530/730 paraA es error de expectativa. Telemetría de sol deriva vector visual; no fecha Solar verificada.

**05:** roomtab busca INTERIOR_STOPS.id y guarda targetTour.u, pausa playing, roomPinned y camModeinside, forceweek14si<13.5; no calcula paso por puerta. activeInteriorStop es máscercano u, no contiene(room,camera). Rangeinput/setTargetWeek y pointer Gantt controlan semana de demo. Wheel inside cambia targetTour, touchmove cambia semana: asimetría SOURCE-PROVEN que no debe portarse. Direction buttons navegan URL; no estados/IDs productivos nuevos.

## G. Demo Assumptions

**Algorithmic:** projección/clamp y seek de progreso; **visual policy:** cone/fades/colors/stopintervals/animation smoothing; **house-specific:** SVGplan ysection authored, mirroring6m, ox18, textos/umbral room/week; **unsafe truth:** marker define room/entry/path/accessible route, «CAD1:100»certifica plano, soltag define fecha, closetab define selección geométrica. No convertir vh/normalizedp en coordenada arquitectónica.

## H. Reusable Core

Cue sencillo de dirección y vínculo stop↔progreso como referencia comparativa; Rubik ya posee mapa real+player+controles. No hace falta un nuevo radar ni copiar viewport3D para resolver un control de seek. El aprendizaje útil es comunicar ubicación/estado sin usar la UI como autoridad de ruta y preservar semántica/foco al navegar.

## I. Reuse Decision

**REFERENCE ONLY.** No portar subsystem de navegación redundante y menos accesible. Usar golden masters para comparar orientación/lectura; si se aprobara cue extra, implementarlo dentro de minimap/player existentes, con datos y semántica Rubik. Es decisión rederivada: la multiplicidad de implementaciones y cobertura existente pesa más que facilidad de copiar SVG.

## J. Rubik Authority Mapping

| Responsabilidad | Autoridad actual / evidencia R | Acción necesaria / nunca importar |
|---|---|---|
| plano/orientación | presentation-core.minimap y geometry.rooms.poly, paredes/huecos reales | mantener marco local y offset nivel; cue opcional sólo con pose actual válida |
| selectedroom/stop | PresentationPlan/createBuilding, roomId+levelId, UI.go | no labels/regex/ox/casa; sourceCurrent/revision decide disponibilidad |
| progresión/seek | Story.seq.locate, seekStory/setStory, stateAt y un player | cross scene async enterScene con epoch/busy; no scroll/Lenis nuevo |
| ARIA/keyboard | renderMinimap:76+ rolebutton/tabindex/aria-label/aria-currentlocation y Enter/Space; stops aria-currentstep | preservar equivalentes no visuales; controles nativos y caption aria-live; no canvas-only |
| captions/slider | drawStory, aria-valuetext, player/scene controls | estado actual pronunciable, no telemetría decorativa falsa |
| Back/focus | UI.stop:930+, onKey y modalOpen; restorePresentationEntry/refocus | Escape del diálogo no cierra presentación; Back restaura entry/foco; no reemplazo de DOM que pierda activeElement |
| ruta | presentationRouteInfo y Route.plan/choreography | minimap dibuja points sólo statusrunning/complete; click roomstop no definepath; routebutton pideplanner |
| renderer | View3D principal/transaction/capture | si se propusiera inset requerir try/finally completo viewport/scissor/fog/target/clipping y presupuesto; no necesidad demostrada |

## K. Preserve / Replace Map

**PRESERVE:** minimap, plan, routes, selecciónIDs, UIplayer, Back/ARIA/focus. **CANDIDATE:** sólo referencia de cue visual/compactstop. **REPLACE:** todo adapter de dato/evento/semántica dentro host si futura UX lo pide. **REJECT:** Lenis/globalpage runner, textmatch room, decorativeplan como truth, scrollbar como route authority e inset sin restore. **DEFER:** cue volumétrico de exploded/anchors hasta F5 y aprobación de alcance; no sumar al V2.

## L. Exact Adaptation Blueprint

No API nueva: input pose/level/stop/route ya expuestos; output cue opcionalSVG/text dentro mapa existente. OwnerUI sesión/epoch. Begin suscribe a estado actual y snapshot de foco/visibilidad si temporal; Apply puro a ese estado, sin scroll/cámara porcue; seek usa acción Story/stop existente y espera enterScene antes de render. End/cancel/failure retira nodos/listeners propios y devuelve foco, no deja mapa de otra revisión. Reverse/seek actualiza current/valuetext sin acumulación. Resize mantiene stop/p y recalcula tamaño, no geometría; missingpose→cue oculto con texto/estado válido, fallback a UI actual. Reduced no smoothscroll/camera obligatoria; estado discreto. OFF mapa actual sin extra DOM. A11y: botón nativo o rolebutton con Enter/Space, nombre de room+nivel con fuente, aria-current/selected coherente, foco conservado por ID al redraw, click/tap igual función, texto deubicación paraSR; nada hover-only. F5 sólo para nuevo cue/handoff vinculado a descomposición.

## M. Risks

Autoridad route/room HIGH si marker/textoprogreso se interpreta geométrico. Accesibilidad HIGH en SVGzones sin teclado, mobile03 oculto y focusreset05; no afirmar todo donor accesible por tenerbutton. CPU01/02/07 Ozonas con attrs/strings cadaframe, sin clonegeom/bounds; pocosvectors temporales/proyección; etiquetas/canvas05 máscoste porHUD rebuild. 03 añade **una renderización de escena auxiliar** cuando visible, viewport/scissor y actualizaciones de matrices/line resolution, sin nuevo render target exclusivo de radar; drawcalls aumentan por escena visible en inset, shaders existentes.01/02/07 cueSVG cero pase/FBO/draw WebGL adicional,05 usa render actual; no atribuir multipass deD05 al cue. DOM replacement/listeners/observers sin cleanup editorial, HIGH de port literal. PrecisiónCSS/buffer/offset/clampsMEDIUM; visualcone no occlusionHIGH. Mobile tamaño/hide/touch y reducedHIGH; mantenimiento configs duplicadas; MIT/font/Lenis excluidos. Rendimiento final **UNKNOWN — MEASURE IN SCULPTURE LAB**.

## N. Tests Required

**PROPOSED FUTURE TEST:** T0/§33; mapa usa polígono/ID/offset correctos, cue cámara vs target real, sin ruta fabricada; native keyboard/pointer/touch equivalentes, foco por ID tras redraw, aria-current/valuecaption/SR/Back/modalEscape. Seekrandom/cross scene/reverse mantiene selección/revisión; portrait/landscape/reduced/OFF; cue sin pose y sin room no inventa dato. Si inset se considerase, prueba inyección de throw enrender para restorestate, contextloss/dispose y captura/DPR; hoy se recomienda no portarlo.

## O. Sculpture Strategy

S0 conservar golden 01/03/07 y05stop; S1 fixture comparativa de mapa actual vs cue sin mutarcámara; S2 quitar plano/textos manuales porgeo/stophost; S3 accesibilidad y refocusantes de ampliar; S4 elegir si cue aporta o descartar por redundante; S5–S10 lifecycle/measure/review si procede. Como REFERENCE ONLY puede cerrar sin extraer código. C2-S5 es evaluación acotada, no compromiso de feature.

## P. Evidence

SOURCE-PROVEN A/F/J. RUNTIME nav01STUDIO: normalizado .9754320987654321 dentro tolerancia .005 deltarget.98, foco STUDIO, active CSS y sin aria-current, cero SVG rect con tabindex. nav03desktop1440×900inset244×120, Enterbutton2→735, mobile390×844displaynone. nav07corrected:525 exacto, foco/active PARLOUR, aria-current null, dot(2.59,2.96), sin pageerror. tour05click 04 LOFT→TOUR .82/wk14/inside, foco BODY. Capturas revisadas visualmente. Estado numérico/cámara no demuestra ruta segura. Fallo inicial deexpectativa07 conservado y explicado §28.

## Q. Confidence

**Source HIGH** en las cinco familias, seek/camera/renderer y semántica; **adaptación HIGH para preservar host, MEDIUM para utilidad de cue nuevo** hasta comparación humana. No testSR/teléfono físico ejecutado; desconocidos no convertidos enPASS.

# 26 D13 — Choreography / Route Handoff

## A. Identity

F:02/main.js completo: `frames:64`, `walkKeys:105` (WK, nombre real del generador), `buildWalk:143`, `walkPose:187`, `chapters/story:211/230`, `update:524`, `__checkPath:572`; `house.solids:583`. F:05/view.js completo: `TOUR_KEYS:64`, curves:77–78, `sampleTourSpline:80`, `getTargetCameraPose:253`, `applyCamera:260`, updateSceneForWeek/autoShot/bindHudEvents/loop:977. Helpers clamp01/PHASES/rendergeometry sólo dependencia contextual, no D18 abierto. MIT+Three160.0(02)/169.0(05), §21.2.

Call graphs02:resize→frames/buildWalk→WK/pc/tc/V/U/M→chapters; RAFscroll→story→walkPose→placePose/render/hud. __checkPath es **hook separado**, no caller de buildWalk/update ni gate.05input/autoWeek→targetTour→loop tour smoothing→getTargetCameraPose→sampleTourSpline→applyCamera→render. Looktarget y posición tienen curvas distintas en ambos. No llamada a un planner geométrico dentro de estas cadenas.

## B. Behaviour

02 recorre una casa concreta de tres niveles por 30 keys de eye/target/fov/rest; primeros puntos vienen de framing F.end/F.sweep calculado, resto authored para escaleras/salas. Sale al frame inicial al final.05 usa10 keys y cinco stops de cottage/loft; tourentra en último tramo de14semanas o tabs, no ruta derivada de geometry. Entrar a roomtab no valida puerta. **Sí existe chequeo de colisiones en02**; es diagnóstico muestreado opt-in, no planificación ni enforcement.05 no tiene equivalente de planner/clearance en la unidad auditada.

## C. Data Flow

02const house+viewport→F poses→walkKeys(WK)→dos CatmullRom + métrica de scrollV/U/M→walkPose(v)eye/target/shift/fov→story(cut/reveal/doorsvisibility)→cámara. Stops son labels/rest deWK, no entrada/salida topológica. `solids()` reejecuta structure builder como cajas no-glass para diagnóstico.05TOUR_KEYS/INTERIOR_STOPS.u + state.week/mode/roomPinned→state.tour interpolado→sampleTourSpline→curCamPos/At/Fov suavizados→cámara. Datos de proyecto Rubik no entran, ninguna licencia/source de la demo acredita sus room relationships.

## D. State & Lifecycle

Sampler02 puro respecto aWALK ya construido/viewport, reverse de v = reevaluación; buildWalk recalcula métricas con aspect alresize, así mismo normalized progress no implica mismos metros. RAF aplica lag al scroll salvoREDUCED; hooks__frameoffline permiten evaluación directa, no restauran editor.05 sampler puro, pero **cámara renderizada depende del historial** por doble smoothing de tour y curCam. applyCamera usa lerpFactor(.18 loop/.15 cola); no garantiza endpoint exacto enseek arbitrario, no copiar este estado residual. Tailloop se dispara por distancia posición²>.005, no una prueba conjunta de target/FOV; registrar riesgo de precisión, no bug visual confirmado. No Begin/End/cancel/snapshot/dispose para devolver control aeditor; listeners/RAF viven página. Reverse de curva no es rollback de doors/lights/proyecto.

## E. Dependencies

Math/ThreeCatmullRomCurve3 y vectors son necesarios en probes; walkthrough del módulo completo arrastra02house/clipping/look/real/draw/HUD y05house/RoomEnvironment/sun/programme. Son incidentales al aprendizaje de pacing. No importar módulos por obtener spline. Rubik ya posee Route.plan/choreography y camera/player con restore. `rest` de02 no es API de hold común. Lenis no necesario02/05; fonts/render tech tampoco.

## F. Mathematical / Spatial / Rendering Mechanism

### 02 — geometría de curva y tiempo

`pc=CatmullRomCurve3(WK.p,false,'centripetal')`, `tc` separado sobre WK.t. No es curva cerrada aunque el último punto coincide con el frame inicial. V0=U0=0. Segmento0 tiene 210vh. Para i>0: `ΔV_i=clamp(9*distanceMeters+.55*lookAngleDegrees,42,145)+.65*(rest_i+rest_{i+1})`; Ui=i/(n−1). `sec_i=ΔU_i/ΔV_i`; M extremos=.95sec; M interior=harmonicMean(secprev,secnext)*(.52 si rest>0, si no 1). Rest aumenta duración y reduce derivada; **no pausa con velocidad cero** en sala.

Para v clamped, localizar intervalo, h=ΔV, t=(v−Vi)/h, du=ΔU, `m0=M_i*h/du`, `m1=M_{i+1}*h/du`; `s=(t³−2t²+t)m0+(−2t³+3t²)+(t³−t²)m1`; `u=clamp(Ui+du*clamp(s),0,1)`. Pos=pc.getPoint(u), look=tc.getPoint(u), no getPointAt: **no parametrización por longitud de arco ni velocidad constante**. FOV interpola eSine dentro de la fracción de key. `lv` mezcla mirada nivelada en interior; targetY=lerp(rawtargetY,eyeY,lv), `sy=clamp(rawtargetY-targetY,−.42*dXZ,+.42*dXZ)` en metros de shift, **no clamp±.42m**. Target independiente de tangente; nivelar cámara y desplazar lente no convierte la ruta en segura. `inAt/outAt` muestrea cada .5vh el cruce z<CUT−.35 para visibilidad del frente, no para resolver puertas/colisiones.

Resize portrait aspect<.9 altera framing/poses/fov(×1.22hasta78) y recomponeWALK/V/L/chapters; móvil no es simplemente misma curva con canvasmenor. Loop normal aproxima scroll con1−exp(−6dt); REDUCED elimina lag de scroll, no demuestra una alternativa global sin movimiento de toda la cámara.

### 05 — tour y smoothing

Keys.u=[0,.12,.25,.38,.5,.58,.67,.74,.82,1]. Pos/at curvas centripetal separadas, no tangente. Para ucclamped: idx tal que ui≤uc≤ui+1; local=(uc−ui)/Δui, splineT=(idx+local)/9; getPoint(splineT); FOVlinear entre keys. No arc-length o rest, los segmentos de u desigual dan distinta velocidad espacial. Stopsu0/.25/.5/.82/1; nearest-u elige etiqueta. Look independiente y loft/stairauthoría. Loop: tour+=(targetTour−tour)*min(1,6.5dt), snapdifference≤.001; después applyCamera lerpea curCam. Pacingweek baja de1.15 a.095 desde13.38; autoinsideA13.38/C13.48 (B top), roomPinned rompe bindingweek. No calendario/planningRubik ni normalización necesaria del producto.

### Muestreo EXECUTED de funciones reales

Entrada1440×900.02n30,L3013.2406684198268vh,inAt441,outAt2738. Valores completos de target/shift/FOV enJSON; tabla posiciones en metros:

| p estable | 02 walkPose(p*L).position | 05 sampleTourSpline(p).position |
|---|---|---|
| 0 | (28.8899727571,5.15066171724,17.2452970569) | (1.55,1.58,4.15) |
| .25 | (5.00094497497,4.82,−5.49892282722) | (.65,1.58,2.25) |
| .5 | (7.75307235945,3.47849218076,−7.05333648013) | (−.55,1.5,1.15) |
| .75 | (16.6524260795,−1.58163480090,−2.99498049665) | (.270464534242,4.28235036356,−1.88190831555) |
| 1 | (28.8899727571,5.15066171724,17.2452970569) | (−.32,4.48,.55) |

02endpointstarget≈(11.2,1.1,−4.6),FOV35;05p.75target(−3.57077702638,3.72262714838,.49683652122),FOV60.25;05p1target(4.85,1.55,−.55),FOV60. No comparar la tabla a ruta productiva ni afirmar misma cámara/política de altura.

### Overshoot y seguridad

Barrido99 samples interiores porsegmento de las **curvas reales**, no una curva inventada para simular02/05.02segment27 localt.40: A=(15,1.65,−1.6),B=(15.8,1.85,8.8),P=(14.2065743403,1.60712944246,1.77366329827): sale de envolvente de coordenadas **.793425659706m**, distancia a segmento1.05519268714m.05segment5 localt.36: A=(.58,1.68,1.35),B=(.58,3.1,−.55),P=(.732023405379,2.09396339658,.838357311631): X fuera **.152023405379m**, distancia.154113303713m. No son máximos analíticos ni choques demostrados con paredes donor.

Contraejemplo sintético adicional, misma CatmullRom centripetal real: control(0,0,0),(1,0,0),(1,0,1),(2,0,1), segmento2t.33→(1.2559315,0,1.0740685), sale.0740685m. Un corredor estrecho que contenga la polilínea pero tenga borde z≤1.02 deja endpoints/polilínea libres y excluye ese P: **endpoints válidos no garantizan ruta válida; spline puede cortar/salir de corredor**. Es demostración matemática, no collisionreport de casa. No corregir cambiando sólo tensión: se requiere corredor demostrado o revalidación de cada segmento/muestra resultante con las constraints de ruta.

02 `__checkPath()` sí calcula distancia a AABB no-glass con radio .18m y muestras v desde WALK.V[1] hasta L cada .5vh; toma el primer box hit por muestra. `house.solids` sólo devuelve cajas de structure(...), sin cobertura de todo mobiliario/site ni puertas cerradas dinámicamente; no calcula entradas de room ni prueba segmentos completos de forma continua. El hook no se llama en el recorrido normal y no corrige trayectoria. RUNTIME `path02`→**0 hits** en esa casa a ese SHA; no significa «no hay chequeos», «planner validado» ni seguridad universal. 05 no tiene chequeo equivalente en la unidad auditada.

## G. Demo Assumptions

**Algorithmic:** curvas independientes pos/look, ease de pacing/Hermite/sampling; **visual policy:** ratios9/.55/.52, rest/longitudscroll210, FOV/smoothing, umbralweek; **house-specific:**30/10 keys, escalera/loft/door/labels/cut y dimensiones; **unsafe truth:** controlpoint marcaentrada, spline evitaobstáculos, lowest/threelevels aplican a BuildingRubik, rest es hold garantizado,0 hits de diagnóstico es ruta certificada. No métricas deaccesibilidad ni navegaciónmulti-level derivadas deesta demo.

## H. Reusable Core

Idea de ralentizar por cambio de orientación/etiqueta, look target independiente y poses finales legibles. Puede informar pacing **encima de ruta validada**; no conservar curva pos libre que sustituya path. Rubik ya implementa velocidad/turn/accel/lookarrival. Port literal sería redundante y másdébil; investigar sólo una mejora de target/tiempo contra baseline, con endpoints exactos y sin laghistory.

## I. Reuse Decision

**EXTRACT MECHANISM.** Aislar hipótesis de pacing/hold/target como comparación, reescribir evaluación absoluta sobre ruta Rubik. Rechazar waypoints/spline pos como autoridad; no copiar wrapper RAF/scroll ni doblesuavizado05. No razón para reemplazar planner porque tour luzca suave.

## J. Rubik Authority Mapping

| Responsabilidad | Rubik actual / garantía acotada | Frontera del adapter |
|---|---|---|
| entrada/room/obstáculo | Route.plan:7–70 sobre project+geometry+roomId | puerta.entry real; no_room/no_entry/low_entry(height<1.85)unavailable; no inferir de nombre o stop |
| búsqueda válida | gridrotada200mmdefault,clearance220,comfort450, máximo12000celdas; **Dijkstra8connected**, diagonal con orthogonals libres | modela rooms/doors y obstáculos paredes/windows/slides/low doors/furnitureexcept rugs; no BIM solver3D o accesibilidad certificada |
| ruta/interpolación | safeSegment40mm, shortcuts/cornercut5passes, densify40mm y revalidación final | fallback aerial porbudget/no_free/obstructed/interpolation; sourcecomment limita intrusión no detectada20mm; no prueba continua exacta |
| cámara sobre ruta | choreography:75–155 consume route.path o resamplepolyline40mm | posiciones permanecen sobre ruta, puede truncar en sample seguro paraarrival; no CatmullRom libre ni lateraloffset sin validar |
| mirada/arrival | lookahead1200mm, sight60mm, obstacles incl. leaves door open; floor/content/opennessscore, yawunwrap+Gaussian450mm | smoothing de yaw no mueve camino; región visible convierte a cameraYaw/Pitch; vistailegible closeShare>.12→aerial en View3D |
| tiempo/velocidad | vmax.85..1.1m/sdefault,turn35°/s,accel.8m/s², forward/back ramp y suavizado250mm | donorrest no obliga nuevo campo; tiempo depende de ruta real, no vh/semana |
| recorrido UI/renderer | index.presentationRoute:4413–4493; descend/walk/turn/arrive/rise/return | doorIds reales se abren, originales guardados por ID para rebuild; alcomplete/cancel restaura pose/doors/cut/orbit/aids |
| Story/level/handoff | PresentationPlan/Story.enterScene, showLevel y presentationStopPose | mismo player/cámara; hoy routeRun separado es acción existente, no integración automática general de exploded; F5 antes de enlazar sus owners/anchors |

Choreography details SOURCE-PROVEN: eye1.5m, walkpitch8°,arrival11° cap20; suaviza yaw, no x/y. Límite de velocidad por segmento por turnrate `v=min(vmax,turn/|dyaw/ds|)`, extremos0, ramps `v_i≤sqrt(v_prev²+2aΔs)`, tiempos `Δs/max(.06,avgSpeed)`. Posiciones samples se conservan. Renderer walkAt interpola **lineal** entre samples y yaw por ángulocorto; phases smoothstep para descensos/aerial/return. Esto no garantiza trayectoaéreo físico libre, es representación rotulada aerial. Reduced presentationRoute publica complete sin mover cámara. Cancel restituye snapshot y doorspor ID; no rediseñar currentflow aquí.

## K. Preserve / Replace Map

**PRESERVE:** Route.plan garantías/fallback y authority, choreography actual, stops/IDs y cámara y door restore host. **CANDIDATE:** ralentización/look hold por semántica real si mejora lectura. **REPLACE:** WK/TOUR_KEYS y vh/week por path validado/duraciónhost, p absoluto yendposes. **REJECT:** spline libre entre puntosválidos, planner inferido de0 hits, entrada por label, doble smoothing con historia. **DEFER:** handoff de nivel separado a room hasta recomposición y F5, sin ampliarFT3D-5.

## L. Exact Adaptation Blueprint

Inputs: route validada con revision/level/room/doorIds, samples/distance, start/endposes reales, región y pStory; output pose/target/time absoluto, no geometría/ruta nueva. Owner flowView3D/Story actual. Begin exige recomposición y nivelrealactivo, resolver room/entry de su geometry, llamar plan y respetar unavailable/aerial con razón; snapshot de cámara/door/cut antes demutar. Apply pos sobre segmentos ya validados; hipótesis detarget/pacing no cambia path. Si se modifica camino, verificar **cada nuevo segmento** contra constraints con sampling no máslaxo queplan (y declarar su límite); fallo→path original/fallback, nuncaaceptar silenciosamente. Endpoint p0/p1 exactos, sinlerp desde cámara previa. Reverse determinista sobre las mismas samples, epochs cancelan trabajo tardío. End/cancel/failure/Back restaura snapshot/doorspor ID/cut/orbit/aids/selection ylibera RAF; no volver ahandlesmuertos trasrebuild. Resize recalcula fit/lookregion conservando ruta/p/revisión, no waypoints decorativos. Reduced holds/poses discretas sinviaje, OFF routeactual intacta. F5 bloquea sólo enlace anuevosanchors/owners, nofixturepura.

## M. Risks

Route HIGH por spline overshoot/furniture/closed doors/clearance; geometry/topology HIGH por pasos entre distintos niveles sin entrada demostrada. Estado/history HIGH por easingdinámicoy seek; precisión MEDIUM endpoints/fov/yawshift/units; visual MEDIUM por mirarfuera decontenido o frente a pared.02buildWalk Okeys y samples0.5vh parain/out (~miles; enresize/build,noApply), CatmullRom lookup/cálculo por pose, allocations de vectores; __checkPath O(samples×solidboxes) sólo debug.05two curves+vectors y curCamlerps, HUD rebuildmáscaro que math. No clonegeometry, boundsrecompute, extra render pass/target/shader requerido **por curva**; no atribuir AO/D05/PMREM/schedule alcoreography. Draw calls normales, labels/HUD DOM y strings; no disposal hostdonor. Mobile camera rebuild/latency/motion/desorientación HIGH y acceso a salidas por teclado; no accesibilidad de camino porradius. LicenciasMIT separadas, no fonts requeridas; mantenimiento de keysHIGH. Costes reales/adapters **UNKNOWN — MEASURE IN SCULPTURE LAB**.

## N. Tests Required

**PROPOSED FUTURE TEST:** T0/§33; puro timeline/pacingsin cambio de path, end pose/target exactos y random seek vs directeval, yaw350→10, stops/hold/resize; counterexample spline rechazado porvalidador, pasilloestrecho/puerta baja/mueble/rotated plan/entrada ausente/ilegible con fallback con razón. Integración frames con ruta válida del mismo ID/revisión, puertas restauradas trasrebuild/cancel, nivel antes de plan, body/focus/Back/OFF; reverse sin errores acumulados y reduced sin movimiento. No test ejecutado de productplanner en Cut2; lectura de sus garantías yprobes donor no sonsuiteRubik.

## O. Sculpture Strategy

S0 conservar02/05 conposes/JSON de keys fijos; S1 extraermétrica de tiempo/target sin renderer; S2 reemplazar waypoints porruta Rubik conocida **sin spline pos**; S3 comparar pacingactual yunanueva hipótesis, endpoints/seguridad idénticos; S4 añadirhold/look real con región siaportavalor; S5 handoff postrecomposición trasF5; S6–S10 lifecycle/measure/reduced/mobile/stills/review. C2-S6/S7/S8 pequeños, no nuevoplanner ni tercerplayer.

## P. Evidence

LocatorsA/F/J; curvas reales muestreadas `curves.cjs/json`; runtime02offline/noao/dpr1/rs.4,__frame(99,.5),__checkPath0 hits y captura path02;05 wk14/inside/tabloft TOUR .82 ycaptura tour05. Inspeccionadas, no prueba de seguridad por imagen. C2-CC3 identifica hook existente paraevitar falsaafirmación «no collisioncheck». Nuevostests proposed separados de EXECUTED.

## Q. Confidence

**Source HIGH** parámetro/origen/riesgo/planner vs choreography; **adaptación MEDIUM** para mejoras de pacing porque Rubik ya posee mecanismos mejores acoplados arutavalidada. Safe-smoothing arbitrary sincorredor/prueba UNKNOWN; no volverlo aprobado por evidencia visual. Handoff real FT3D-5 pendiente F5.

# 27 Cut 2 — Cross-Candidate Spatial & Narrative Authorities

## 27.1 D09 vs D10 vs D11

| Dimensión | D09 Floor by Floor | D10 Board | D11 Unfolded |
|---|---|---|---|
| Membership | seis plantas/cubierta authored, grupo único por planta | seis capas semánticas authored, ocho subs por lados | caras de una sola habitación, hijos por pared, lid dependiente deN |
| Ejes | traslaciónY acumulativa; escalaY core global | liftY + pull cardinalXZ, doorZ independiente | rotaciónX/Z alrededor de arista, escalas locales de contenido |
| Pivot | raíz de planta en baseY; no hinge | raíz de layer con geometría authored y subs por side | borde inferior de cada panel y borde superiorN para lid |
| Requisitos de dato | orden/base/altura/bounds/owner por nivel | pertenencia comprobada de cada componente y normal válida | boundary→cara→wall/opening, lado interior, shared ownership y net válida |
| Topología | separación no cambia topología de cada grupo, pero core se deforma | mueve conjuntos, no descubre build-up ni corta piezas | requiere caras explícitas, huecos y parent composition; no solver general |
| Globals | ciudad aplastada/core estirado/cap, luces fijas | paper/plan/luces, dash auxiliar | groundsheet/luces; paneldecals attach a caras |
| Endpoint donor | separado→montado/interior | despiece→montado/interior, puerta abierta | hoja→habitación/interior, luces/puerta diferentes |
| Restore necesario en Rubik | base/visibilidad/nivelView/cámara/stairs/caches | base de cada owner/sub, flags/materials/labels/selección | originals intactos y representación propia liberada, faces/huecos/annotations/cámara |

**Común demostrado:** evaluación absoluta desde estado base y anchors que siguen matrices. **No común:** criterio de grouping, significado del progreso, política de pivot o garantías topológicas. Un «exploder» genérico que clasifique componentes, cambie parents y determine cámara/ruta juntaría tres autoridades sin evidencia. Una herramienta de matemática compartida no debe poseer Building ni prometer topología válida.

## 27.2 Infraestructura mínima legítima, sin aprobar API

1. Snapshot **inmutable** de base transform y flags de handles vigentes, con fuente/owner/revisión y epoch. Resolver handles después de sync, no guardar objetos muertos como autoridad.
2. Evaluador absoluto de transforms temporales desde descriptor comprobado. Membership separado de política de tiempo; rechazar duplicate-owner/double-delta. No acumulación += ni persistencia de coordenadas presentadas.
3. Lease temporal que arbitra quién puede tocar transforms/visibility/materials y en qué orden los restaura. D09 puede tocar owners reales sin reparent; D11 puede requerir representaciones propias, nunca se asume equivalencia. Reutilización de lease implementado FT3D-5 **pregunta F5**, no hecho.
4. Bounds temporales derivados de base bounds y transform donde sea suficiente, con invalidación por revisión/owner/p/region. Cachear descriptor y refit cuando cambie estado pertinente; evitar Box3 completo por Apply. Bounds de cámara no redefinen geometría de proyecto ni ruta.
5. Proyección de anchor local con **matrices actuales y cámara actual** → layout/lectura DOM, fuente y calidad del texto. Cámara/p no convierten annotation en cota técnica. Guardar/restaurar renderer-state con try/finally si alguna representación añade viewport/pase.
6. Transacción única de Begin/Apply/End, rollback, cancel/Back/rebuild/contextloss y reduced, dentro de lifecycle existente. Clear de recursos exclusivamente propios, sin disponer shared geometry/textures/materials.

No emerge evidencia para otro scene graph autoritativo, Building model, route planner, cámara productiva, Story player, schema de transforms persistente, campos de proyecto ni estado de red. Una representación derivada temporal no es un modelo paralelo editable. No se fijan nombres de clase/API ni se implementa framework por este documento.

## 27.3 D12 vs D13 y el handoff exacto

| Etapa conceptual | Autoridad demostrada al baseline | Adapter futuro / restricción |
|---|---|---|
| building/level overview | Building/presentationSources + PresentationPlan.createBuilding, overview(level) elegible | V2 da axon/exploded, no nuevo overview(building) ni anchor de habitación inexistente; binding final F5 |
| descomposición temporal | contrato FT3D-5 V2, separado de Board/Unfolded | no iniciar trayecto en geometría separada; recomponer antes de transferir control |
| orientación/selección | minimap real, UI.go, stop.roomId+levelId y player | cue D12 sólo muestra estado; selección no acredita entrada/ruta ni salta por label |
| selected level | UI.enterScene/showLevel y proyectos de Building | resolver geometry/revision del nivel real después de sync; no coord mundial donor/ox18 |
| anchor room/entry | room polygon/roomFrame/presentationStopPose + door.entry validada por plan | overview sin entrada puede verse, pero route unavailable no se inventa; no usar nearest opening como entrada |
| ruta validada | **presentation-route.plan()** o sucesor verificado | preserva fallback unavailable/aerial y límites del modelo; D13 no planifica |
| coreografía sobre ruta | presentation-route.choreography y View3D.presentationRoute | look/pacing pueden mejorarse sin mover path; si cambia, revalidar cada segmento; endpoints absolutos, un dueño de cámara |
| room/stop/hold | PresentationPlan/UI/caption/actual arrival | hold/target con fuente real y región medida; no INTERIOR_STOPS de demo |
| reverse/exit/restore | Story End + presentationRoute cancel/complete + presentación.stop | transacción restaura nivel inicial, pose/cut/doors/aids/selection/foco; crossflow nuevo requiere adapter y pruebas, no asumirlo ya integrado |

La secuencia **overview → nivel elegido → recomposición → room/entry válidos → plan → choreography → hold/stop → reverse/exit → restore** es conceptual futura. El baseline ya tiene overview/selección/plan/choreography/retorno y Story por niveles; **no se ha demostrado un handoff automático general de exploded hacia route**. F5 debe fijar pose/anchors/lifecycle del tramo nuevo antes de unirlos. No usar cámara donor interior como sustituto de un anchor que Rubik no tiene.

Orientación comunica dónde se mira. Seek selecciona un estado narrativo. Stop identifica una vista. Planner decide por dónde cabe un recorrido según su modelo. Choreography decide cuándo/mirada/encuadre sobre esa ruta. Render pinta. Ninguna coordenada del slider/SVG ni la etiqueta «room» cruza esa frontera para convertirse en geometría de navegación.

## 27.4 Interacción con Cut 1, sin reabrir decisiones

| Dependencia cerrada | Interacción Cut 2 | Límite conservado |
|---|---|---|
| D01 cámara/framing | D09 requiere encuadre de bounds temporales y endpoints V2, no R130 ni EYE13.84; D13 usa start/endpose y región actual | altura completa/unidades/fit y cámara host; no auto-room ni spline libre |
| D02/D03 sección/fachada | D12 inset puede mostrar la misma representación; comparación de región/altura sirve de referencia | no tercera cámara funcional ni run/Lenis nuevo; D03 sigue REFERENCE ONLY |
| D04 representación | líneas/fill deben seguir matrixWorld temporal de D09/D10/D11 sin mutar source | lease de material/edges separado del de transform, recursos propios; no Part destructivo de GLB |
| D05/D06 | pase técnico/caps tendrían que consumir las mismas transformaciones/clip/owners | caps siguen descriptor real, no cap donor estirado; backend no se adopta automáticamente |
| D07/D08 | máscara espacial/basis y sombras de geometría separada requieren declarar marco local/mundo | no front diferente por mesh sin intención, no mover Solar por plegado, restaurar bases/materials; caches se invalidan con transforms |
| T0/Story/player | D12 seek/ARIA/foco existentes, D13 evaluación absoluta | una secuencia/epoch/control de cámara, no segundo scrollplayer; extender pruebas, no cambiar Cut1 |

Orden de leases futuro: validar sources → snapshot base → transforms temporales → actualizar matrices/bounds/cámara → representación/anchors → render. Al salir: parar scheduler → liberar representación derivada → restaurar transforms/flags vigentes → restaurar levelView/sync y cámara según contrato → foco/UI. El orden concreto de owners final es F5, no se inventa a partir del WIP.

# 28 CUT2 CORRECTION CANDIDATE Ledger

Ningún Atlas ni dossier Cut1 editado. «Candidate» no supone que el claim histórico fuese falso; se cita la precisión real y su impacto.

| ID | Previous locator / claim | Actual symbol / fixed evidence | Naturaleza / efecto en conclusión |
|---|---|---|---|
| C2-CC1 | Atlas§10.1/coverage «nueve capas» de derivabilidad Board; cola D10 update/layer | F:dir-a.layer + seis instancias L1..L6, ocho subs; Atlas incluye walls/furniture/site además de seis categorías | distinguir matriz conceptual de Rubik de **seis layers authored**; precisión de inventario, no declarar error en matriz conceptual ni cambiar decisión Cut1 |
| C2-CC2 | Atlas D11 wall/FOLD/GROW/update/drawSheet resume habitación desarrollada | F:dir-b.wall106 y decal266 con **attach inicial**, lid hijo N, dos texturas y ocho decals | completa ownership/annotations; plegado no es auto-unfold universal; no cambio silencioso de contrato/Atlas |
| C2-CC3 | Una lectura de «ruta authored/no planner» como «ningún chequeo de colisión» sería incorrecta | F:02.main.__checkPath572 + house.solids583; runtime 0 hits | **sí diagnóstico opt-in**; no gate/planner. Precisión preventiva, no atribuir a Cut1/Atlas una frase literal inexistente |
| C2-CC4 | Atlas locator 07/...:radar o engine default PARLOUR530/GARDEN730 | F:07/A.page.radar override PARLOUR525/GARDEN735, B ox18/mirrorXtrue, C labels distintas | distinguir defaults/config activa; cambia expectativa de harness, no algoritmo ni route authority |
| C2-CC5 | Simplificación «WK/curves» en Atlas D13 | F:02.walkKeys105→buildWalk143→walkPose187 y hook separado;05.sampleTourSpline80→applyCamera260→loop977 | métricas scroll vs spline parameter vs frame history distintos; precisión de callgraph, sin cambiar Cut1 |
| C2-CC6 | Navegación03 llamada radar genéricamente | F:03.page.getRadarKey + engine.render(key) con viewport/scissor | **inset3D real**, no SVG plan; implica render pass/state restore adicional. Cut1 ya menciona radar state, aquí desglosado |

Registro de ejecución: primer intento nav07 esperó 530; timeout sin pageerror. Fuente A data-at 525 y motor default530 explican diferencia. Se corrigió **sólo** script externo `nav07-corrected.cjs`, observación 525 exacto, no cambio donor/producto ni rerun amplio. Artefacto fallido conservado. No contar dos intentos como dos casos distintos ni esconder timeout bajo «todo pasó».

# 29 Extended Dependency Graph & Cumulative Decisions

| Node | depends_on | unlocks | can_parallelize | blocks |
|---|---|---|---|---|
| C2-I0 fixed source/golden/provenance | Cut1 y SHAs§21 | todos los experimentos Cut2 | documentación/licencias | usar fuente móvil/datos sin autoridad |
| D09pure | I0,math D01 y lifecycle T0 | fixture de transform contractual C2-S2 | D10truth/D11topology/D12comparison/D13pure | integración real sin V2/F5, nunca análisis donor |
| D10truth | I0,geometry/owners existentes y matriz§23J | Board fixture derivable | D09pure/D11topology | construir grupos/estructura sin source |
| D11topology | I0,faces/openings/IDs y fixture conocida | hinge/net mínima | D09pure/D10truth | soporte shared/nonrect/curved sin demostración |
| D12orientation/seek | I0,minimap/player/ARIA existentes | comparación cue y selección con IDs | D13timing/labs de decomposition | UI como route authority/scrollplayer/foco perdido |
| D13timing | I0,ruta validada y endpoints D01 | pacing/lookhypothesis | D09/D10/D11puros | spline pos libre, cambios de path no revalidados |
| leases/bounds/anchors mínimos | T0, owners reales del consumidor, D04/D08 sólo si usados | lifecycle de representación temporal | fixture de topology/timing | colisión de owners/materials o caches stale |
| **F5 final audited reconciliation** | HEAD final entregado/aceptado por Juanma + contrato V2 + ledger§31 | binding real D09/shared leases y anchors/handoff | **todos los análisis y labs aislados anteriores**, no esperar a Claude | sólo decisiones dependientes de implementación final, no imponer nuevos gates V2 |
| handoffC2-S7 | recomposición, selección/entry/plan reales, D13 validado; F5 si FT3D-5 participa | spatial→route flow único | pruebas de accesibilidad/material fixtures | ruta en plantas separadas/anchor inventado/doble scheduler |
| closureC2-S8 | adapters que realmente se hayan autorizado/implementado | comparativas S9 y review S10 | mediciones hardware/QAdata | declarar aprobado sin restore/endpoints/móvil/evidencia humana |

No altera dependencias cerradas §14. Ruta corta propuesta: C2-S1→C2-S2 contractual; paralelos C2-S3truth/C2-S4topology/C2-S5cue/C2-S6timing; **sólo después F5 si aplica**→C2-S7→C2-S8→review. No obligación de implementar todos: REFERENCE ONLY D12 puede cerrar en comparación sin adaptación.

Matriz acumulativa: D01 COPY + ADAPT; D02 EXTRACT MECHANISM; D03 REFERENCE ONLY; D04 EXTRACT MECHANISM; D05 REIMPLEMENT FROM MECHANISM; D06 EXTRACT MECHANISM; D07 EXTRACT MECHANISM; D08 EXTRACT MECHANISM (**sin cambios**, detalle§15).

| Delta Cut2 | Principal única | Retener en lab | Reescribir/excluir | Estado integración |
|---|---|---|---|---|
| D09 | EXTRACT MECHANISM | base+offset absoluto, fixture acumulativa | V2 gap/membership/lifecycle; excluir core/city/casa/keys | pendiente F5, no cambio V2 |
| D10 | EXTRACT MECHANISM | lift/pull/anchor | descriptor truth/owners; excluir estructura/cotas/authored order | futura capacidad separada, no implementada |
| D11 | REIMPLEMENT FROM MECHANISM | hinge y proyección | topology/ownership/net/labels; excluir attach de original/manual sheet | futura capacidad separada, subset primero |
| D12 | REFERENCE ONLY | comparación de cue/seek | conservar UI host; no Lenis/subsystem nuevo | ninguna extracción comprometida |
| D13 | EXTRACT MECHANISM | hipótesis de pacing/look | time/poses host; excluir spline pos como autoridad | sólo sobre ruta Rubik validada |

# 30 Sculpture Backlog — Cut 2 (No Implementado)

Etiquetas **C2-S1…C2-S8** son entregas pequeñas futuras, diferentes de etapas metodológicas S0…S10 de Cut1. Cada entrega mantiene golden master SHA/fixture/pose/viewport/DPR/luz/p constantes, introduce un cambio de assumption a la vez y acaba en checkpoint recuperable. Nada queda autorizado a producto por figurar aquí.

## C2-S1 — Floor-by-Floor donor reproduction

- **Goal/donor:** reproducir exactamente dir-c.update/GAP/LAND sobre golden 01C, sin geometría Rubik.
- **Rubik authority:** ninguna modificada; I0/T0 sólo criterio de comparación.
- **Copied vs rewritten:** copiar evaluator atribuido en lab externo; wrapper/probe propios; no editar golden.
- **Golden master:** seis grupos originales p0/.25/.5/.75/1 y reverse con tabla§22F/capturas; conservar city/core deliberadamente para mostrar qué se retirará.
- **Assumptions removed:** primero dependencia de renderer/DOM para math, no cambiar número/grupos/gap todavía.
- **Tests/evidence:** valores de todos los niveles/globals, random seek, functionhash, stills idénticos por pose; resource baseline.
- **Exit gate:** mismo output por p independiente de historia, diferencias declaradas; no integración ni promesa de restore editor.
- **F5:** ninguna; no bloqueo.

## C2-S2 — Provisional contractual transform fixture

- **Goal/donor:** reemplazar membership y gap de D09 en pasos separados por fixture V2 uno/dos niveles.
- **Rubik authority:** contrato V2/addendum fijados, Building.source metadata; **no owner binding real**.
- **Copied vs rewritten:** math absoluta mínima atribuida; escribir delta/units/timeline según V2, no cambiar V2 para acomodar donor.
- **Golden master:** conservar C2-S1 y comparar fixture compact/exploded con expected numéricos contractuales, no fingir misma casa.
- **Assumptions removed:** seis niveles/groundlift, cotas/GAP, corestretch/city, endpoints inside; cada uno con evidencia.
- **Tests/evidence:** offsets/slab/toggles/globals/stairs/overview elegible y p0/p1/reverse/resize/reduced, bases inmutables.
- **Exit gate:** descriptor puro conforme V2 sin fuentes duplicadas, no nuevos anchors, zero source writes.
- **F5:** fixture no; binding a handles actuales **PENDING FINAL FT3D-5 HEAD RECONCILIATION**.

## C2-S3 — Board derivability fixture

- **Goal/donor:** una o varias capas demostrables, desde dir-a.layer/update, mostrando claramente ausencias.
- **Rubik authority:** geometry/walls/openings/rooms y objects existentes; SurfaceRenderer/Building preservados.
- **Copied vs rewritten:** evaluator lift/pull candidato; grouping/normals/labels/owner adapter reescritos.
- **Golden master:** 01A por separado; candidato muros/suelo/huecos de fixture Rubik con OFF/ON misma cámara.
- **Assumptions removed:** retirar CLT/frame/rafters/footings/build-up que no tengan fuente, luego sustituir labels/cotas.
- **Tests/evidence:** matriz§23J materializada por ID, unsupported ausente, no falso orden de obra; huecos/toggles/GLB/reverse/failure/restore.
- **Exit gate:** despiece visual honesto y útil con un subset, no completar capas por estética; review antes de ampliarlo.
- **F5:** lab aislado no; reutilizar lease/membership de la implementación final sí.

## C2-S4 — Unfolded topology fixture

- **Goal/donor:** hinge D11 para cuarto rectangular con cara/huecos/IDs conocidos; no universal net.
- **Rubik authority:** boundary/wall/opening del fixture y procedencia altura/material; original editable intacto.
- **Copied vs rewritten:** hinge math atribuible; face association/pivots/openings/net/UV/annotations y representación propia reescritos.
- **Golden master:** 01B flat/closed con posición de cámara fija; fixture equivalente declarando geometría distinta.
- **Assumptions removed:** cardinales/medidas/schedule/attach de originales una a una; sin datos roof omitir techo.
- **Tests/evidence:** openings misma face before/after, sharedwall/no-rect/curved/cornercase supported demostrado o fallback; material identity/selección/recursos/teclado.
- **Exit gate:** topología acotada explícita, sin caja sustitutiva ni cota falsa, reverse/End sin residuo; ampliar sólo después.
- **F5:** topology lab no; acceso a owners/lease compartido sí, y sin añadir capacidad a V2.

## C2-S5 — Navigation cue / seek comparison

- **Goal/donor:** comparar cue 01/07 y viewport 03 con mapa/stop UI actual; no adoptar por completitud.
- **Rubik authority:** minimap/PresentationPlan/Story.player/ARIA/foco/Back.
- **Copied vs rewritten:** referencia visual, **ningún subsystem copiado**; cue mínimo si se autoriza se escribe en host.
- **Golden master:** nav01/03/07 dirigidos vs misma fixture Rubik con cue OFF/ON y misma pose.
- **Assumptions removed:** plano/textos manuales, matchlabel, scrollY como authority, hover-only y focusreset.
- **Tests/evidence:** native keyboard/EnterSpace/tap/aria-current/lectura de texto/reduced, seek async entre escenas y source change; no path inventado.
- **Exit gate:** aporta lectura medible/aceptada y mantiene accesibilidad; si redundante cerrar referencia sin feature.
- **F5:** no para mapa actual; sólo si pretende nuevo anchor/cue de exploded.

## C2-S6 — Validated-route choreography

- **Goal/donor:** investigar una hipótesis de pacing/look de 02/05 sobre ruta Rubik ya validada, no cambiar la planificación.
- **Rubik authority:** Route.plan/choreography/doorIds/camera endposes.
- **Copied vs rewritten:** fórmula reducida de tiempo si aporta; timeline absoluto/target adapter propios, no WK/TOUR_KEYS/pos curve.
- **Golden master:** JSON/capturas02/05 congelados y baseline Rubik con misma ruta; separar sus objetivos.
- **Assumptions removed:** paths/casa/restlabels/vh/week, doble smoothing; primero conservar posiciones, luego variar mirada/timing.
- **Tests/evidence:** contraejemplo de esquina rechazado, todos los segmentos con constraints, narrowdoor/furniture/rotation/fallback, direct eval vs seek/F/R/end pose exacta/reduced.
- **Exit gate:** mejora de lectura sin salir derutavalidada; sin beneficio no port; ninguna garantía3D/accesible no acreditada.
- **F5:** no en ruta actual aislada; handoff desde nueva descomposición sí.

## C2-S7 — Spatial → navigation handoff

- **Goal/donor:** componer conceptosD09→D12→D13 dentro flujo actual, no conectar páginas donor.
- **Rubik authority:** V2 recompuesto, PresentationPlan/selectedlevel/roomentry, planner/choreography yun camera owner.
- **Copied vs rewritten:** nada de nuevo literal; adapter de transacción secuencial/anchors revisados.
- **Golden master:** OFFactual y snapshots de etapas C2-S2/S5/S6 por fixture/sha.
- **Assumptions removed:** caminar en piso separado, entry inventada, active level ambiguo, dos players; resolver una frontera cada vez.
- **Tests/evidence:** pose exacta postrecomposición, showLevel/sync→geometry correcta→plan; no entry/unavailable/aerial razonados; cancelen cada frontera/reverse/Back/foco.
- **Exit gate:** trayectoria y sourceID coherentes del mismo proyecto, restore repetible, sin excepción silenciosa; no ampliación deV2.
- **F5:** **sí** donde use FT3D-5 real, ledger§31 completo sobreHEAD final, no WIP.

## C2-S8 — Lifecycle / restore / reduced / mobile closure

- **Goal/donor:** cerrar los adapters realmente implementados y autorizados, sin nuevos efectos.
- **Rubik authority:** lifecycle existente/T0 extendido; datos/Building/materials/permiso export/captura preservados.
- **Copied vs rewritten:** nada nuevo; reparar sólo adapter propio si una evidencia falla.
- **Golden master:** snapshots OFF/restored/forward/reverse de todos los cortes aceptados, viewport/luz/p iguales.
- **Assumptions removed:** End implícito, renderer state global, pose history, fonts/red no requeridos; documentar limitaciones aún reales.
- **Tests/evidence:** matriz§33, cinco ciclos/rebuild/late assets/contextloss/failBegin, desktop/portrait/landscape/reduced, drawcalls/targets/memoria/GPU física cuando se afirme soporte.
- **Exit gate:** no drifts/orphans/resource growth, endpoints/caches/selection intactos; comparativaS9 y **Juanma aprobaciónS10 por SHA**, no porSwiftShader/test count.
- **F5:** sólo consumidores compartidos; no bloqueo de finalizar el lab independiente.

# 31 PENDING FINAL FT3D-5 HEAD RECONCILIATION

**F5. Preguntas para el HEAD final auditado que Juanma entregue.** No inspección de Claude WIP, no afirmaciones sobre sus módulos reales ni nuevos gates retroactivos V2. Cada línea requiere locator+SHA+evidencia de compatibilidad; «pendiente» no invalida análisis donor ni mapping contractual completo.

| ID / ámbito | Pregunta o comprobación exacta pendiente |
|---|---|
| F5-01 D09 modules | ¿Qué módulo/símbolos implementan descriptor V2, Begin/Apply/End y timeline? ¿SHA final aceptado y diff estable? |
| F5-02 membership | ¿Cómo se resuelve cada nivel estructural completo desde presentationSources, no subset de rooms, con orden/sourceIndex/levelId estables? |
| F5-03 base | ¿Dónde se guarda base local/mundo inmutable y cómo se diferencia de pose temporal? ¿mm→m convertido una vez en marco activo? |
| F5-04 delta | ¿Qué assignments implementan savedBaseY+dyM? ¿Hay evidencia de random seek/ciclos sin+= ni doble offset? |
| F5-05 active | ¿Cuáles son handles vigentes archFloor/archUp/furnG/lampG y cómo se obtienen después de sync? |
| F5-06 slab | ¿Cómo queda la losa superior real alojada en levelsG cuando pertenece al nivel activo? ¿Mueve exactamente una vez preservando huecos? |
| F5-07 furniture | ¿Qué owner mueve muebles/GLB, y se evita delta extra alchild? ¿Respeta OFF/cargas tardías/epoch? |
| F5-08 lamps | ¿Cómo acompañan lámparas/luminarias/luces al owner y qué flags de iluminación/toggles se restauran? |
| F5-09 globals/connectors | ¿Cómo se identifican ground/context/roof/exterior/stairs/contact/reveal/aids y se aplica keep/hide/restore sin deformar conectores? |
| F5-10 visibility | ¿Se capturan flags base por objeto y levelView semántico? ¿ON/OFF previo no se pierde al restore? |
| F5-11 no reparent | ¿Qué evidencia muestra que nivel activo no cambia parent, ni se crean orphans en error/End/rebuild? |
| F5-12 snapshotcamera | ¿Qué campos pose/target/fov/near/far/up/projection/view/orbit se tocan realmente y cuáles se guardan/restauran? No exigir campos nuevos que no se usen |
| F5-13 overview | ¿Cómo se selecciona overview(level) elegible conbounds reales y región? ¿Sin rooms/anchor válido retorna unsupported con razón? |
| F5-14 p0/p1 | ¿Capturas y valores antes de End prueban endpoints overview exactos, no una restauración tardía que disimula salto? |
| F5-15 recomposition | ¿En qué fase se vuelven a base transforms/visibilidad antes de p1 y antes de permitir otro consumidor? |
| F5-16 rollback | ¿Qué ocurre si Begin falla tras levelView→all/sync y antes de guardar todos los handles? ¿Se restaura semántica previa y se propaga error? |
| F5-17 reverse | ¿Samep en orden no monótono da mismos transforms/cámara, incluidos globals, sin depender de aplicar antes p0? |
| F5-18 End | ¿End idempotente restaura handles actuales antes de levelView/sync, sin tocar objetos muertos ni disponer shared resources? |
| F5-19 resize | ¿Se retienen descriptor/anchors/p y sólo se refit cámara/region? ¿No Box3/rebuild en cada Apply? |
| F5-20 reduced | ¿Holds compact/exploded discretos usan mismo player y una ocurrencia global? ¿OFF sigue sin efecto/residuo? |
| F5-21 bounds/caches | ¿Qué bounds/caches cambian con transform temporal y cómo se invalidan/restauran tras End/rebuild/revisión/resize? |
| F5-22 D10/D11lease | ¿Existe lease de transform temporal reutilizable o sólo lógica especializada? ¿Puede usarse sin expandir semantics de axon/exploded ni reparent originales? |
| F5-23 D10/D11addressability | ¿Owners reales siguen addressables para futuros Board/faces mientras cambian handles? ¿Cómo evita colisiones de membership y double transform? No asumir soporteBoard/Unfolded |
| F5-24 D12anchors | ¿Introduce/cambia anchors/stops o sólo consume plan existente? ¿Hay level/room IDs reales y no punto authored? |
| F5-25 D13handoffpose | ¿Cuál es la pose exacta postrecomposición y qué snapshot posee el siguiente flujo para no perder continuidad? |
| F5-26 D13planner | ¿Cómo recibe planner elselectedlevel/geometry/revision yentry real después de sync? ¿No route enlayout separado? |
| F5-27 player | ¿Estado cámara/player existente suficiente para handoff o se requiere adapter acotado? ¿Cancel/Back devuelven al mismo editor/foco sin dos RAF rivales? |

# 32 Cut 2 Risks / Unknowns

| ID | Riesgo / límite | Qué sí se sabe | Resolución futura, sin rellenar con supuestos |
|---|---|---|---|
| C2-U1 | FT3D-5 real no canónico todavía | V2/addendum y fuente donor completos | F5 porHEAD final; no consultar WIP ni esperar para cerrar estudio |
| C2-U2 | room-face/shared ownership/curved net | polygon/wall/openingID existen, asociación a cara puede serambigua | fixture yvalidación C2-S4; unsupported con razón, no defaults arquitectónicos |
| C2-U3 | estructura/build-up donor ausentes | datoswall/appearance no acreditanCLT/rafters/aislamiento | omitir, nunca estimar poraspecto; no dependencia de nueva función en este corte |
| C2-U4 | spline pos fuera decorridor | overshootreal en02/05 y contraejemplo probado;02diagnóstico0 hits sólo casa fija | C2-S6 preserva ruta o revalida cada segmento, no tensión heurística como garantía |
| C2-U5 | performance/render quality de adapters | transform/curve counts y recursos derivables;sinperf física | **UNKNOWN — MEASURE IN SCULPTURE LAB**, comparar hardware/DPR/scene iguales, no FPSinventados |
| C2-U6 | matriz/caches/material con transforms | base y renderer ownership contratados, dependenciasD04/08 claras | lease/epoch/restorematrix/cache/lateasset; no asumir coexistencia por dibujar bien una vez |
| C2-U7 | accesibilidad móvil/cues | nativeteclado01/03/07, pérdidafoco05, SVGzones nosemánticas | UIhost/ARIA/focus/reduced y pruebasSR/touch/teléfono físico, no aprobadas aquí |
| C2-U8 | exacthandoff nuevo aún no existe | plan/choreography/stop/level restore del baseline existen | C2-S7 despuésF5; no puerta/anchor inventado |
| C2-U9 | licencias de assets/fonts futuros | MITdonor y dependencias licenciadas, fontsbinariosno fijados | excluirlos; si se copian posteriormente auditar versión/notice particular |
| C2-U10 | «seguro» significado excesivo | Rubik2.5D clearance/revalidación muestreada, no pruebaBIM3D/accesibilidad | comunicar límites del modelo; no elevar routevisual a itinerario accesible certificado |

No unknown material sobre la fórmula/owners/datos/curvas de los dossiers que justifique análisisvago. Lo abierto es adaptación/soporte/performance futuros y no se declara probado. No cambios de datos/modelos para rellenar ausencias.

# 33 T0 Extended — Future Adapter Gates

**PROPOSED FUTURE TESTS, no ejecutados como suite de producto en Cut2.** Añaden a T0§4, no modifican V2 ni convierten este backlog en criterios de cierre de Claude.

| Gate | Pure / integration / browser evidence a exigir |
|---|---|
| source identity | project/Building/geometry/revision antes/después iguales; materialrefs/IDs/selección/ownership iguales trasEnd; sin writes/schema/red |
| evaluation | p0/.25/.5/.75/1, reverse y random seek, directeval vs historical, endpointpose/target exactos; cinco ciclos sin drift |
| base/parent | bases restauradas, parent identities/orphans invariantes; slab/GLB/lamps no doubledelta, global/connectors restaurados |
| state ownership | un dueño de cámara/player/RAF; no lease concurrente incompatible, no meshes viejos trasrebuild; recursos propios liberados una vez |
| bounds/cache | actual matrixWorld antes de camera/labels, cache invalidación portransform/revisión/resize y restore al estado anterior; no Box3por frame |
| exits/errors | close/cancel/Back/rebuild/failed Begin rollback, throw enpaso intermedio/renderer state finally, contextloss; epoch evita late asset callback trasEnd |
| viewport | desktop/portrait/landscape, resize durante transición/hold, mismos p/anchor/IDs, CSS→buffer/DPR correcto |
| reduced/OFF | sin movimiento obligado, holds/estados discretos; OFF exactamente comportamiento actual, sin recursos/transforms/listeners nuevos |
| levels/data | uno/dos niveles soportados, offsets/desniveles/toggles, no eligible overview/no entry/no-room/no-data/unsupported con razón; ningún anchor inventado |
| truth/topology | no estructura/capa/cota/norte/ceiling falso; sharedwalls/openings en suface, no caja default cuando ambigua, source/calidad de cada label |
| route constraints | ruta validada sigue válida; ninguna curva nueva aceptada sin corredor probado o revalidación de cada segmento/muestra; fallback original/aerial/unavailable honesto |
| choreography | p jump no acumula camera error; reverse determinista/endtarget exacto/doorsIDrestore, tiempo/look no muta path, reducido no-moving |
| navigation/a11y | keyboard equivalente Enter/Space, foco estable/retorno a opener, SRtext/current/valuetext, pointer/touch parity, Back ymodalEscape correctos |
| resources/perf | cold/warm geometries/textures/programs/targets/drawcalls/DOMlisteners antes/durante/después; sin crecimiento repetido, GPU física para claims rendimiento; no clonar meshes por Apply |
| evidence/review | donor/productSHA, fixturesource, units/camera/region/luz/p/viewport/DPR/quality fijos; OFF/ON/reverse/restored stills, límites explícitos y aprobación visual humana por SHA |

# 34 Cut 2 Coverage & Gates

**Cobertura SOURCE-PROVEN:** D09–D13 completos A–Q en orden, una decisión principal por ID, cinco tablas de autoridades, matricesBoard/Unfolded y callgraphs materiales. Lectura de fuentes/contexto y probes/runtime separados de futuro. Se conservan íntegros dossiers D01–D08 y sus decisiones; update de header/queue explícito. Cada resultado siguiente es **gate de análisis**, no certificación de implementación.

| Gate obligatorio | Resultado / evidencia |
|---|---|
| Cut1/donor/Atlas/product/V2 exactos fijados | PASS, manifest§21, fetch inicial y checkoutfijados |
| Claude WIP no usado | PASS, sólo contrato/addendum gitshow, F5 preguntas§31 |
| D09 exact symbols/full unit/callers/helpers | PASS, §22A/E/P |
| D09 math/state/LAND/GAP y moved/fixedinventory | PASS, §22C/F, seis grupos yglobals explícitos |
| D09 forward/reverse/random seekprobe | PASS,3 escenarios separados, D09expectedactual§22F yJSON; no End product test |
| D09 assumptions/classification/principal | PASS, §22G/H/I, EXTRACT MECHANISM |
| D09 V2mapping + dependencias finales individuales | PASS, §22J/L/Q +27 preguntas F5§31, donor completo, adaptación pendiente |
| D09 A–Q | PASS, §22 |
| D10 exact symbols/construcción de grupos | PASS, §23A/C, seismanual+subs, no clasificación material |
| D10 transforms/callouts/probe | PASS, §23D/F/P, lift/pull/dooroverride/anchors |
| D10 matriz de derivabilidad/estructura no soportada | PASS, §23J con SOURCE/DERIVED/VISUALIZATION ONLY/UNAVAILABLE por grupo yfallback, ningún ESTIMATED usado sin fundamento |
| D10 scope FT3D-5/principal/A–Q | PASS, §23I/K/L, Board separado, EXTRACT MECHANISM |
| D11 exact symbols/pivots/fold/grow/openings | PASS, §24A–F, jerarquía N/lid/doorwindow/decals/probe |
| D11 inputmatrix/topology/nonrect/shared limitations | PASS, §24J,14 inputs con estado yfallback, no altura factual por default |
| D11 separate capability/principal/A–Q | PASS, §24I/L, REIMPLEMENT FROM MECHANISM |
| D12 inventario de navegación relevante | PASS, §25A/C/F,01/02/03/07A/B/C/05, debugaid yreal3Dinset |
| D12 orientation/seek/route +Rubikcomparison | PASS, §25F/J y§27.3, planner permanece Rubik |
| D12 accessibility/lifecycle/renderer state | PASS de análisis, §25D/J/L/M/N; no SR/hardware aprobado |
| D12 principal/A–Q | PASS, §25I, REFERENCE ONLY |
| D13 curve origin/maths/muestreo determinista | PASS, §26A–F, dos escenarios reales+un contraejemplo, JSON |
| D13 cornerovershoot/planner vs choreography | PASS, §26F/J/L, diagnóstico02existe pero no gate, smoothing validado obligatorio |
| D13 safe handoff/principal/A–Q | PASS, §26I/L y§27.3, EXTRACT MECHANISM |
| D09/10/11 comparison/infraestructura mínima | PASS, §27.1/2, no genericexploder prematuro |
| D12/13 authorities andCut1 dependencies | PASS, §27.3/4, D01/D04/D08 sin reabrir |
| dependencygraph/backlog/F5ledger | PASS, §§29–31;depends_on/unlocks/can_parallelize/blocks, C2-S1…S8 conexit/F5 |
| license/dependency/performance | PASS de análisis, §21.2/E/Mpor ID; notices separados, no FPS ni aprobación desde SwiftShader |
| testsrequired/risks/unknowns correctamente etiquetados | PASS, Npor ID y§§32/33; proposed no contados como executed |
| ledger de correcciones, sin rewritingAtlas/Cut1 | PASS, §28; precisión/error de expectativa diferenciados |
| queue D09–13 no pending, D14–21 pending | PASS, §20 actualizado y§35, F5 pendiente no seconfunde con análisis |
| sólo archivo canónico, ningúnproduct/contract/Atlas/master/WIP modificado | PASS, diff de publicación sóloeste documento |
| structuralA–Q/diffwhitespace/preservedD01–08 | PASS, validator externo de estructura/tablas y comparación contra padre, git diff --check |
| publicación del repositorio | un commitCut2 sobreCut1, pushnormal/remoteHEAD/clean comprobados en handofffinal; sinPR ni merge |

**Conclusión:** análisis Cut2 COMPLETE, no blocker material pendiente de investigación D09–D13. Ejecución nueva:3 probes de transforms (17 evaluaciones cada uno),2 curvas reales+1contraejemplo,8 casos runtime distintos observados en9 intentos (timeout porharness07 conservado); verificación de esperados D09 y chequeos documentales. No suiteproducto/CI/Preview nueva porque no haycambio runtime. Autoridades/precondiciones de implementación/performance/revisión humana permanecen abiertas en lab/F5, sin presentarlas como PASS de producto.

# 35 Future Queue — D14–D21

No iniciados en Cut2. Recomiendo siguiente corte documental **D14–D15 (cámara de escala/descenso y sweep de06)**: reutiliza conclusionesD01/D08/D13 para distinguir escala narrativa/cámara de geometría ydatos autoritativos antes de tocar planificación 4D. Después D16–D18 requieren su propio contrato/datos element-time; D19 material detail yD20métodoQA separados; D21capturaprovenance sólo si faltaevidencia. Es recomendación, no inicio ni autorización de producto.

- D14 — PENDING, análisis posterior.
- D15 — PENDING, análisis posterior.
- D16 — PENDING, análisis posterior; tiempo/elementos no inferidos de demo.
- D17 — PENDING, análisis posterior.
- D18 — PENDING, análisis posterior; helpers de05 alcanzados en Cut2 no cierran schedule analysis.
- D19 — PENDING, análisis posterior; overridesradar07C no son auditoría de material detail.
- D20 — PENDING, análisis posterior; no copiar donante sinlicencia aplicable.
- D21 — PENDING, bajo necesidad de evidencia; no dependencia de producto.
