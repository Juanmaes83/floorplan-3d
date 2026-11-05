# RUBIK SOTA — MISIÓN KIMI CODE · VISUAL FAMILIES: SIGUIENTE CORTE
## F01 / F03 ampliada / F04 / F05 · Calidad arquitectónica visible, continuidad y QA
> **ADENDA PRIORITARIA — DECISIÓN HUMANA DEL 05/11/2026 (posterior a la misión inicial).** La muestra visual F03 V2 de `rough_plaster_03` está **aprobada** y es el referente **preferido de calidad** de la siguiente fase. **No se aprueba extender universalmente ese revoco**: la decisión principal es **trasladar la técnica/metodología experimental** a OTROS referentes y materiales compatibles, conservando las características propias de cada uno. F02 V2 y `white_stucco` F03 V1 siguen protegidos. F03 V2 como fachada completa y su móvil todavía **no están aprobados**. Faltan imágenes desde **altura humana** con fachada, carpinterías y encuentros legibles; el móvil existente es insuficiente. Esta adenda prevalece sobre cualquier etiqueta previa que dijera «revoco no aprobado». Ver [decisión completa y próxima misión](../qa/visual-families-next-v1/F03-V2-DECISION-METODOLOGIA-Y-SIGUIENTE-MISION-2026-11-05.md).

**Fecha:** 5 noviembre 2026 · **Modo:** misión de implementación autorizada, sin merge ni deploy.

**Rama YA CREADA para esta misión:** `feat/visual-families-next-f03-f04-f05-v1`
**Base exacta inicial:** `feat/f03-facade-material-fidelity-v1@ce70f85941e32ba2483ac9bba70d9c4dd674eca2`.
**Repo:** `Juanmaes83/floorplan-3d`.
**PR anteriores:** [#167 F02 ventanas](https://github.com/Juanmaes83/floorplan-3d/pull/167), [#169 F03 materialidad](https://github.com/Juanmaes83/floorplan-3d/pull/169), ambas **draft, sin merge**.
**Aprobación humana expresada en conversación:** las **ventanas F02 V2** y el **acabado `white_stucco` de F03 V1** han sido aprobados visualmente en los ejemplos revisados. **No confundir** aprobación del material de una malla con aprobación del conjunto de fachadas, otros materiales, escenarios o producción.
**Autorizado:** desarrollar, inspeccionar, iterar y publicar por hitos dentro de esta misión, con tests y capturas reales, sin esperar un OK por cada ajuste seguro.
**No autorizado:** fusionar, desplegar, editar ramas Claude/Delivery/Hybrid/Section/FT3D8/AG-1, borrar trabajos históricos, consumir APIs de imagen o recursos facturables sin permiso, cambiar datos estructurales, instalar otro renderer.

## 0. META FINAL QUE QUEREMOS VER

**No más pruebas de que una textura se puede cargar.** Eso ya lo demuestra F03 V1.

Queremos que, en un proyecto RUBIK **real y semánticamente compatible**, el profesional vea **un salto perceptible en la representación arquitectónica de TODO el exterior que tenga datos válidos**, sin que el motor invente volúmenes, materiales, ventanas, cubiertas, vegetación ni piscinas.

El objetivo visual se juzga con **una vista general clara, alzados, oblicuas y detalles**, donde se lean:
- acabados y rugosidades correctos por superficie;
- continuidad entre paños y esquinas, escala real del grano y juntas;
- transición entre revoco, hormigón, piedra, madera, pavimento y carpinterías **sólo donde el material real esté asignado**;
- iluminación exterior convincente y controlable para **presentación visual**, sin alterar el módulo de cálculo solar;
- encuentros y remates que tengan soporte geométrico/semántico real, con detalle limpio y proporcionado;
- fidelidad geométrica y visual F02/F03, móviles y restauración sin regresiones.

**No basta** colorear fachadas, levantar ruido exagerado o añadir una pérgola/piscina «para que luzca». Si los datos faltan, comunicar la ausencia y dejar fallback; las referencias conceptuales nunca crean arquitectura verdadera.

## 1. EL DOCUMENTO ORIGINAL QUE EXPLICA LAS NUEVE FAMILIAS

**Leer primero, acotando las secciones 5, 7, 8, 14, 15, 17, 18 y 21:**
`docs/agents/visual-families-hero-fidelity-v2.md`, en la base de esta rama. La sección 14 enumera:
- **F01 — Materiales**
- **F02 — Carpinterías** → candidato visual aprobado; **CONGELADO**
- **F03 — Fachadas y cubiertas** → V1 material `white_stucco` aprobado en una malla; ampliación pendiente
- **F04 — Iluminación**
- **F05 — Detalles constructivos**
- **F06 — Paisajismo**
- **F07 — Agua**
- **F08 — Vida ambiental**
- **F09 — Arquetipos**

**La lista de 9 familias es una arquitectura prevista, NO nueve sistemas construidos.** No implementar las nueve a medias para satisfacer una tabla.

La misión anterior de 39 KB se centró en F02; no hay que repetirla.

### Donantes fijados
- `Juanmaes83/VECINIA-WORLDS@f4efdbea2a230d8b88911796af78bfc6ee630d4`: `visual/src/skin/three-house-prototypes.js`, `residential-dna.js`, `glsl-visual-depth.js`, `world-alive.js`, `coastal-leisure-expansion.js`, `visual/src/builders/textures.js`, `archetypes.js` y `visual/src/tokens/catalog.js`/`resolver.js`. Consultar **sólo las funciones implicadas en la carencia visual que estés resolviendo**.
- `Juanmaes83/WORLD-COSTA-BLANCA@1979efc73237fa506090d3c74b8de284af3740ce`: `docs/32-VISUAL-SEMANTIC-META-TOKENS.md`. Gramática `ARCH.FAMILY`/`ARCH.MASSING`/`ARCH.ROOF`/`ARCH.OPENINGS`, `MATERIAL.*`, `LIGHT.*`, `LANDSCAPE.*`, `WATER.*`, `CAMERA.*`, `QUALITY.*`.
- `docs/qa/f03-facade-fidelity-v1/reference-index.md`, `visual-reference-matrix.md` y `reference-manifest.json`; `material-token-map.md`, `pbr-audit-and-conversion.md`, `delivery-report.md`, `facade-integration.md`.
- `docs/technical/terminal-development-loop.md`: adaptar CLI, Playwright/Chromium, capturas y GitHub, sin reabrir una auditoría entera.

**Importante sobre referencias:** GitHub contiene 12 PNG (9 escenas independientes, 3 collages), 13 albedos, 9 mapas fuente de tres materiales completos, y 18 WebP optimizados. El objetivo histórico de 36 escenas **no está cumplido**: 27 originales pendientes, no inventes enlaces/archivos. Los PNG conceptuales enseñan dirección artística, no características de la vivienda real ni derechos de terceros automáticamente acreditados. No contar albedos como casas.

## 2. PRIORIDADES: TRABAJO SUSTANCIAL SIN DESPERDICIAR CRÉDITOS

**Objetivo primario de esta rama (implementar por hitos y comparar):**

**P1 · F01 + F03 V2 — Materiales y FACHADAS DE CONJUNTO.**
- Preservar `F03/facade-material@1` y `F02/window-assembly@2` tal como están, a modo de baseline; extender de forma modular/versionada.
- En la vivienda de prueba, inventariar cada muro exterior: `exteriorStatus`, `surfaceMaterialId`, `appearance.preset`, superficie, ubicación, tratamiento F02 y elegibilidad F03.
- Mostrar **por qué sólo `wal_ref-w18` recibió estuco** y proponer un incremento real de cobertura SIN repintar paredes incompatibles. Preparar **al menos dos fixtures reales/reproducibles con asignaciones exteriores válidas y diferentes** (uno de revestimiento mineral y otro de acabado realmente soportado) para demostrar que la receta se propaga cuando corresponde. Si no hay segundo material con normal/roughness válidos, documentar límite y avanzar con un segundo sistema compatible comprobable; nunca inventar datos persistidos en un proyecto de usuario.
- Aprovechar las fuentes PBR existentes y derivar solo mapas legales, cromática/UV correctas y costes medidos. Las otras 2 variantes F03 son `EXPERIMENTAL`; no activarlas automáticamente ni confundir revoco deteriorado con estuco nuevo.
- Para piedra, ladrillo, madera, cerámica y hormigón, evaluar materiales realmente disponibles y sus permisos/canales; **no promover equivalencias por parecido visual**. Si falta normal/roughness, no presentar el albedo como paquete PBR certificado. Los materiales de suelo no son fachadas.
- El acabado aplicado debe **seguir viéndose mejor en vista general** y no sólo en macrodetalle. Capturas FULL + MEDIUM + DETAIL, esquinas y encuentro con F02, A/B/C fijas.
- Conciliar presupuesto interno `renderBudget.gpuBytes=14,000,000` con la medición HERO estimada `~16,777,218 B` de F03 V1. El control real de memoria y fallback debe ser honesto antes de escalar a muchas fachadas.

**P2 · F04 — Iluminación arquitectónica de presentación.**
- Crear una mejora de iluminación que describa la arquitectura y revele materiales (luz diurna mediterránea, luz suave/difusa o rasante editorial si es aplicable), sobre la misma geometría y los mismos acabados reales.
- Definir separación explícita entre **luz de presentación artística** y **análisis solar calculado/medible**. No cambiar el resultado del análisis de orientación, sombreamiento o horas de sol.
- No lavar interiores como el HDR rechazado de F02; conservar blancos, vidrio transparente y exposición. Comparar días/hora/perfil con cámaras emparejadas, sin confundir cambiar toda la exposición con mejorar material.
- Calidad adaptativa, recursos y restauración reversibles, sin introducir nuevas dependencias grandes, shaders experimentales injustificados ni otro renderer.

**P3 · F05 — Detalles constructivos visibles y fiables.**
- Mejorar remates, encuentros de planos, esquinas, revestimientos y uniones fachada/carpintería/cubierta **sólo si los datos reales del modelo los soportan**. No duplicar alfeizares/jambas que F02 ya posee.
- Como mínimo, hacer una escena controlada con encuentros identificados y demostrar en vistas oblicuas una mejora geométrica/material legible y sin z-fighting o costuras. En un fixture sin cubierta modelada, declarar `ROOF_JUNCTION_NOT_TESTED`, no inventar un tejado para pasar QA de una vivienda.
- Los «detalles» son puramente visuales; no se les atribuyen dimensiones, sistema de impermeabilización, estructura ni cumplimiento constructivo que la fuente no certifica.
- Estudiar hasta dónde llega F03 «fachadas y cubiertas» con los datos disponibles; documentar si hace falta un contrato de cubierta distinto, antes de añadir arquitectura.

**P4 · F06–F09 — Preparación honesta y primeros pilotos condicionales, NO cuatro mundos ficticios.**
- F06 paisajismo: si Rubik ya tiene terreno/parcelas/vegetación con datos válidos, proponer una pequeña receta con especies y escala rastreable; sin poblar solares vacíos por defecto.
- F07 agua: piscinas/fuentes/mar solo si el proyecto los contiene o están definidos explícitamente por el profesional; de lo contrario dejar `NOT_APPLICABLE` y una propuesta de compatibilidad futura, no una piscina inventada.
- F08 vida ambiental: cualquier animación/personas/vehículos como **capa editorial opt-in independiente, etiquetada como escenificación**, nunca como realidad inferida. No usar imágenes de personas reales de terceros sin derechos ni contaminar el plano.
- F09 arquetipos: organizar las 14 etiquetas `ARCH.FAMILY` documentadas por Costa Blanca y los cinco constructores técnicos de VECINIA (`oldtown-house`, `sea-villa`, `family-villa`, `hillside-apartment`, `townhouse`) como **vocabulario/configuración aplicable a modelos existentes, NO fábrica de edificios ni cambio de geometría**. Una receta F09 puede seleccionar reglas VISUAL_ONLY compatibles, sin inventar forma ni hacer pasar 14 conceptos por 14 implementaciones.
- Para cada una: inventario `IMPLEMENTABLE_NOW / NEEDS_SOURCE_DATA / NOT_APPLICABLE / FUTURE`, candidatos de receta y riesgos. **No consumir horas generando efectos en categorías inaplicables**. Un piloto real pequeño puede desarrollarse al terminar P1–P3 si tiene un caso probado y no necesita otro ámbito o permisos, con su propio hito, QA y PR draft separado.

**Secuencia:** terminar un salto perceptible P1, después P2, después P3. No hacer tres demos mediocres. No bloquear P2/P3 por una superficie F03 que no puede ampliarse legítimamente. P4 es trabajo verificable de compatibilidad y pilotos condicionales, no obligación de completar F06–F09 en esta rama.

## 3. CONTROL DE CALIDAD Y «LOOP» QUE EL PROPIETARIO APRUEBA

**Aprobada la metodología:** observar → escoger defecto importante → implementar → unitarias → Playwright/Chromium → capturar → **abrir y revisar imágenes/video** → corregir → COMMIT/PUSH → verificar SHA remoto → actualizar checkpoint → continuar.

- Reutilizar los scripts de `tests/facade-fidelity-*.browser.test.cjs`, `tests/hero-fidelity-v2*.browser.test.cjs` y `tests/visual-families-harness.cjs`. Para F04 y F05 crear QA dirigidos y fixtures declarados; no reiniciar toda la batería general con cada microcambio.
- Comparar OFF / F02 / F02+F03 / nuevo perfil o familia desde cámara, luz y material comparable. **Un render a hora distinta no sirve por sí solo para medir una mejora material**; separar variables.
- Guardar imágenes D1/M1/M2/M3/F1/G1 con vistas de edificio real; incluir escenas de exterior con ventanas y al menos una segunda asignación/edificio si existe y es compatible.
- Al menos dos ciclos de corrección visual sustentados en defectos observables y pruebas medibles por familia implementada, salvo que el primer prototipo tenga evidencia excepcional.
- Desktop 1440×900, móvil 390×844 y landscape 844×390, con perfil HERO/balanced y cuidado de VRAM; si no hay móvil físico, reportar `MOBILE_PHYSICAL_PENDING`.
- Medir en la misma GPU/perfil: p50/p95 RAF **no equivale** a GPU frame time, carga/transferencia, texturas, draw calls, triángulos, memoria estimada, lifecycle y 3× ON/OFF/rebuild/context loss.
- Tests de proyecto canónico: ningún cambio de `FloorPlanProjectV1`, `FloorPlanBuildingV1`, `renderedGeometry`, IDs, cotas, huecos, puertas, rutas o colisiones. Escala de textura y materiales deben persistir sólo en decisiones `VISUAL_ONLY` activables.
- No aceptar por screenshot pequeño ni «PASS» autodeclarado: el propietario aprobará visualmente por familia/corte al ver una lámina antes/después. Siempre mostrar **diferencias claramente visibles donde proceda**, sin sacrificar verdad ni estabilidad.
- En caso de 3–4 loops sin mejora material, marcar `NON_CONVERGENT` y cambiar técnica/candidato antes de gastar más crédito.

### Git y artefactos

- Primera acción: `git status`, worktree, `git rev-parse HEAD`, `git ls-remote` y lectura del último `docs/qa/f03-facade-fidelity-v1/progress.md`. **Esta rama YA EXISTE**; no crear una duplicada, y no resetear WIP ajeno.
- Escribir `docs/qa/visual-families-next-v1/progress.md` y un `coverage-matrix.md` con los nueve códigos F01–F09, estados y relaciones a referencias.
- **Una etapa útil = commit + push + comparación SHA remoto**. No guardar todo en el equipo local. Publicar contactos JPG/WebP ligeros, manifiestos y pruebas de la última revisión; conservar vídeos pesados sólo en almacenamiento autorizado con enlaces reales.
- Hacer PR **draft** de esta rama contra `feat/f03-facade-material-fidelity-v1` para que el diff muestre sólo el nuevo corte. Si GitHub no permite tal base o cambió el estado, parar y documentar la dependencia, no abrir un PR enorme contra master que duplique #167/#169.
- Esta rama está basada en un F03 V1 que contiene F02 V2 y Visual Families; eso **NO autoriza** merge de la pila ni deploy. Si otra persona cambia parent branch, reconciliar SHA y cambios antes de rebasar.
- Evitar tocar `index.html` o `js/presentation-ui.js` salvo hook mínimo indispensable: Claude Section/Hybrid/Delivery siguen con trabajo independiente sobre esos archivos. No editar jamás ramas de Claude ni crear conflictos innecesarios.
- Mantener separadas las familias y gate de aceptación. Si P1 está listo visualmente para revisión, no declararlo aprobado por terminar P2.

## 4. MILESTONES INDEPENDIENTES Y RESULTADOS ESPERADOS

| Hito | Resultado que debe estar disponible en GitHub | Estado |
|---|---|---|
| **R0** | Mapa F01–F09 de piezas existentes, referencias viables, nuevos fixtures de materiales reales y QA inicial. Primer push | Comenzar |
| **R1** | F01/F03: varias superficies/paños **compatibles**, compare A/B/C, textura/encuentros coherentes; cifras de cobertura honestas; presupuesto recursos conciliado; primer vídeo/capturas | Implementar |
| **R2** | F04: al menos un modo de iluminación de presentación que mejore lectura arquitectónica con comparación controlada y sin cambiar análisis solar | Implementar |
| **R3** | F05: al menos un sistema de encuentros o detalles genuinamente sustentado por datos reales, visualmente perceptible, sin duplicar F02 | Implementar si viable; fallback justificado |
| **R4** | F06–F09: matriz de elegibilidad y **un solo piloto adicional** si hay autoridad semántica y tiempo útil; si no, decisiones documentadas, nada falso | Condicional |
| **R5** | Suite afectada de tests y regresiones F02/F03, lifecycle, rendimiento, móviles emulados, inspección de imágenes y vídeos, estado visual por familia | Obligatorio |
| **R6** | PR draft, informe final, SHA probado/HEAD remoto, contacto antes/después, riesgos/NOT_APPLICABLE y handoff para integración | Obligatorio |

**Meta para cerrar:** poder abrir la lámina general y decir **«el exterior de esta vivienda real ha subido de nivel arquitectónico»**, no sólo «tengo más archivos PBR». Si las asignaciones materiales reales sólo permiten un paño, el resultado honesto será un sistema listo para más fachadas **demostrado en fixtures declarados**, NO «toda la casa mejorada».

## 5. PROHIBICIONES, LÍMITES Y AUTORIZACIONES

**Puedes avanzar autónomamente por R0–R6 dentro del alcance y publicar tantas iteraciones sustanciales como requiera lograr los gates.** No es una autorización para gastar créditos sin necesidad ni para introducir material de terceros con licencia incierta.

**Queda prohibido:**
- Merge/rebase/force push sobre ramas ajenas, deploy de producción o activación visual por defecto.
- Reabrir o alterar el acabado F03 V1 aprobado o las ventanas F02 sin justificación y nueva QA.
- Cambiar geometría del proyecto o atribuir falsamente elementos del paisaje/agua.
- Crear once plantillas falsas o probar mejora en una casa de VECINIA fingiendo que es la vivienda Rubik.
- Llamar API de imagen/texto de pago o aumentar límites de facturación sin autorización.
- Declarar `VISUAL_APPROVED_HUMAN` por cuenta propia.

**Informe final para Juanma:** repositorio, rama/PR, SHAs; qué quedó implementado por familia; 5–8 comparativas descargables; cobertura y exclusiones; evidencia en ventanas/materiales y exteriores; regresiones y modo GPU; móvil físico no probado si aplica; partidas de deuda futura F06–F09; riesgos de integración; cero merges/deploy.

**ORDEN DE EJECUCIÓN:** lee este documento, confirma el baseline F03 y sus QA, reusa F02/F03 aprobados, identifica la primera mejora exterior **realmente perceptible**, crea y publica el primer checkpoint y empieza a implementar R1. Continúa por hitos, sin planificar otra vez todo VECINIA. **No más sólo recolores.**
