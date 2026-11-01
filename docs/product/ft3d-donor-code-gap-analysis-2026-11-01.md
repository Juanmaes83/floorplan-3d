# 0 STATUS / EXECUTIVE RESULT — CUT 1

**DONOR-CODE GAP ANALYSIS CUT 1 — COMPLETE.** Fecha: 01-11-2026. Cobertura de investigación: **D01–D08, 8/8**. No significa implementación, compatibilidad GPU acreditada ni aprobación visual. Documento acumulativo; D09–D21 permanecen pendientes. Sólo se añade este archivo. Atlas, contratos y producto intactos.

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

- D09 — PENDING.
- D10 — PENDING.
- D11 — PENDING.
- D12 — PENDING.
- D13 — PENDING.
- D14 — PENDING.
- D15 — PENDING.
- D16 — PENDING.
- D17 — PENDING.
- D18 — PENDING.
- D19 — PENDING.
- D20 — PENDING.
- D21 — PENDING.
