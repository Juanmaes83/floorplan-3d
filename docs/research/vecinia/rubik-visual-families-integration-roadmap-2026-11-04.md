# Rubik Visual Families + Residential Experience — integración por recetas y loop visual

**Fecha:** 2026-11-04.  
**Estado:** `PROPOSED / RESEARCH_AND_QA_ONLY / NO_PRODUCT_MUTATION`.  
**Fuentes propias:** `Juanmaes83/VECINIA-WORLDS` y `Juanmaes83/WORLD-COSTA-BLANCA`. Ambas se tratarán como fuentes propias del usuario, **sin asumir** que todas sus dependencias, texturas y atlas externos tengan los mismos derechos.  
**Relación con CP2:** la base material VQ-01 está técnicamente validada por CI en el SHA `894607b38fa43a5e89a9f5296a41cdbcc989d5ce` y el propietario decidió **`VISUAL_PARTIAL_ACCEPT_FOUNDATION` el 2026-11-04**, documentado en [el acta de QA](../../qa/vq01-cp2-human-visual-partial-acceptance-2026-11-04.md). Se conserva B2 como fundación visual/material; la calidad profesional global sigue pendiente y **no se autoriza merge automático**. Este programa es **posterior e independiente** y no altera su comparador.  
**Referencias:** [Registro de evolución visual de VECINIA — PR #162](https://github.com/Juanmaes83/floorplan-3d/pull/162) y [CI final CP2](https://github.com/Juanmaes83/floorplan-3d/actions/runs/41802674784).

## 1. Principio de diseño no negociable

> La ilustración mejora libremente la presentación, pero jamás sustituye datos verificables del inmueble cuando éstos se comunican como hechos.

Rubik es dueño de `FloorPlanProjectV1`, `BuildingV1`, habitaciones, tabiques, huecos, materiales declarados, escaleras, plantas y parcela conocida. Las recetas visuales **derivan** geometría visible o contexto, **sin hacer persistente una geometría inventada**. Distinguir:
- `TECHNICAL_PROJECT`: edificio real, con autoridad de geometría/mediciones.
- `RESIDENTIAL_PRESENTATION`: edificio real más tratamientos ópticos, detalles derivados y ambientación ilustrativa etiquetada.
- `ILLUSTRATIVE_WORLD`: contexto escénico — familias vecinas, mar, barcos, vegetación, coches, fauna y vida — sin afirmar que esos objetos están en la parcela real.

Esas tres etiquetas son **conceptos de producto propuestos**, NO nuevas claves válidas del schema actual.

## 2. Qué reaprovechar de los proyectos propios

### Escritura y recetas semánticas

**WORLD-COSTA-BLANCA**: `docs/32-VISUAL-SEMANTIC-META-TOKENS.md` describe la cadena `intención semántica → tokens → composición → visualización → QA`. Su catálogo conceptual es más amplio que las familias ejecutables.

**VECINIA-WORLDS** (snapshot de investigación `f4efdbea2a230d8b88911796af78bfc6ee630d4c`):
- `visual/src/tokens/catalog.js`: vocabulario de `ARCH.FAMILY`, `MATERIAL.FACADE`, `MATERIAL.TRIM`, `MATERIAL.ROOF`, luz y ventana.
- `visual/src/tokens/resolver.js`: herencia `WORLD → DISTRICT → STREET → ENTITY → SHOT`; overrides específicos sobre defaults, con determinismo.
- `visual/src/builders/archetypes.js`: cinco familias implementadas: `oldtown-house`, `sea-villa`, `family-villa`, `hillside-apartment`, `townhouse`.
- `visual/src/skin/skin-binding.js`: separación identidad de inmueble / Skin visual por versión/procedencia/autoridad `VISUAL_ONLY`.
- `visual/src/skin/residential-dna.js` y `visual/src/skin/three-house-prototypes.js`: carpinterías, contraventanas, jambas, ventanas y `InteriorMappingMaterial`.
- `visual/src/skin/glsl-visual-depth.js`: shader exterior/agua/fachada; **donor de técnicas, NO import directo en CP2**.
- `visual/src/scene-extras.js`, `visual/src/skin/coastal-leisure-expansion.js`, `visual/src/skin/world-alive.js`: piscinas, vehículos, barcos, gaviotas, delfines, mar, paisajismo, mobiliario y ciclos día/golden/blue/night.

**Three-Fenestra**: en VECINIA se comprueba `three-fenestra@0.2.0`; el material usa un atlas de habitación/cortina y shader para paralaje. Es una representación de **interior aparente**, no el interior geométrico real de Rubik. Útil para ventanas `MIDGROUND/BACKGROUND` de inmuebles de contexto. Para una ventana del inmueble protagonista probar primero visibilidad/oclusiones y geometría real. Si se usa como efecto comercial, no presentarlo como reconstrucción verificada.

### Rubik: autoridades de destino, no reemplazar

- `js/surface-catalog.js`, `js/surface-renderer.mjs`: catálogo con procedencia, escala y ownership material; base para familias de materiales, no crear un segundo engine PBR.
- `js/project-schema.js`: autoridad estructural persistente.
- `js/exterior-core.js`, `js/exterior-volumes.js`: geometría arquitectónica real y derivados.
- `js/territory-renderer.js`, `js/territory-integration-core.js`: entorno, parcela y contexto.
- `js/presentation-ui.js`, `js/presentation-elevation-core.js`, `js/presentation-templates-core.js`: puesta en escena, captura y recorrido.
- `js/asset-catalog.js`, `js/asset-loader.mjs`: assets GLB y control de procedencia/carga.

**NO importar como autoridades** `WorldStore`, `Walker`, `CameraAuthority` ni un segundo renderer de VECINIA. No copiar shaders `onBeforeCompile` a CP2 ni mezclar el trabajo congelado de Hybrid.

## 3. Contrato del registro de familias visuales (propuesta)

Una **familia** contiene recetas versionadas, variantes, herencia, recursos, presupuesto, referencia visual y política de uso:

| Concepto | Ejemplo | Restricción |
|---|---|---|
| `familyId` | `mediterranean-townhouse` | ID visual, no altera la habitación ni la estructura |
| `recipeId` | `traditional-louvered-shutters-v1` | Versión inmutable y QA por receta |
| `semantics` | `ARCH.FAMILY=oldtown-house` | Tokens validados del catálogo |
| `target` | `existing-opening` / `context-building` | No generar ventanas reales no declaradas |
| `role` | `HERO`, `MIDGROUND`, `BACKGROUND` | Se define qué calidad y recursos se asignan |
| `provenance` | `Rubik` / `VECINIA` / tercero | Licencia, original, versión, textura/atlas |
| `renderBudget` | draw calls, mallas, texturas, memoria, GPU | Cap por modo/dispositivo, rollback |
| `visualGate` | `PENDING_JUANMA` / aprobado | Nunca autoaprobar por pixel diff |

**No registrar estas claves directamente en `ProjectV1` sin contrato de datos autorizado.** Guardarlas primero en un registro de presentación **derivado**, con IDs de elemento fuente conocidos y seed fijo, para mantener reproducibilidad y separar control de imágenes de verdad constructiva.

La propagación funciona como `familyId → recipeId@version → refs de assets/superficies → renderer Rubik → QA visual/funcional`, con overrides de estilo que no pueden alterar geometría verificable. Un fix de familia se ejecuta contra **múltiples fixtures**, no una única casa.

## 4. Backlog visual priorizado: impacto perceptivo frente a coste

Estimaciones: dificultad **relativa**, no calendario ni coste contratado.

| Orden | Familia y entrega incremental | Dificultad | Criterio de aceptación visual |
|---|---|---|---|
| P1.0 | **Registro de familias + QA fijo**: token resolver reducido, recipes, LOD HERO/MIDGROUND/BACKGROUND, fixtures y A/B vídeo/imagen | Media | Misma escena reproducible, igualdad de geometría y reversibilidad |
| P1.1 | **Ventanas y carpinterías**: marcos, jambas, vierteaguas, contraventanas; Fenestra opcional sólo en contexto o modo ilustrativo declarado | Media–alta | Profundidad real y aparente coherente en ángulo frontal/lateral |
| P1.2 | **Cinco familias arquitectónicas de contexto**: oldtown-house, sea-villa, family-villa, hillside-apartment, townhouse | Media | Variación sin repeticiones obvias, sin afectar la vivienda Rubik |
| P1.3 | **Fachadas / cubiertas / acabados**: yeso, piedra, madera, cerámica, remates; apoyados en SurfaceCatalog | Media | Escala física, materialidad y respuesta especular verificadas |
| P2.1 | **Piscinas, terrazas, pérgolas, barandillas, mobiliario exterior** | Media | Vistas exteriores de vivienda con mayor riqueza y sin interferencias |
| P2.2 | **Paisajismo mediterráneo**: olivos, pinos, palmeras, cipreses, buganvillas, jardinería contextual | Baja–media | Distribución coherente, buena silueta y LOD controlado |
| P3.1 | **Mar, costa, playa, puerto, agua y embarcaciones** | Alta | Escena costera creíble con costes acotados y variantes móviles |
| P3.2 | **Fauna, vehículos y vida**: gaviotas, delfines, coches, barcos, mobiliario urbano | Media | Animación discreta y desactivable, no roba protagonismo al proyecto |
| P4 | **Estados visuales y dirección de arte**: día, golden, blue, noche, vídeo y composición | Alta / coordinación de luz | Convergencia a referencias exigentes, no sólo un preset más |

La **primera prueba de concepto** debe combinar P1.0 + parte acotada de P1.1 y P1.2: una vivienda Rubik intacta, una o dos familias de casas de contexto y un tipo de ventana ilustrativa opcional. Vegetación/piscina se añaden sólo después de demostrar rendimiento y ausencia de contaminación de `FloorPlanProjectV1`.

## 5. Loop obligatorio de escultura visual

`REFERENCIA PROFESIONAL → FAMILIA SEMÁNTICA + RECETA VERSIONADA → IMPLEMENTACIÓN → IMAGEN + VÍDEO → CRÍTICA VISUAL → CORREGIR Y REPETIR → QA → JUANMA APRUEBA → PROPAGAR A TODAS LAS INSTANCIAS`.

Cada iteración entrega:
1. Referencias fotográficas originales con derechos de uso y objetivos **a igualar en credibilidad**, nunca replicación literal de la vivienda ajena.
2. Fixture Rubik con Project/cámara/iluminación y presupuesto congelados; versión de familia + seed.
3. Comparación baseline vs candidato por mismo encuadre, frontal/lateral/interior y recorrido de vídeo (al menos panorama 10–20s cuando la mejora incluya movimiento/iluminación).
4. Crítica de 3–5 defectos dominantes priorizados, con diagnóstico **mecanismo→resultado**; señalar lo que empeora y si los defectos son de otro workstream.
5. Corregir un mecanismo dominante por iteración; documentar shader/material/cámara o receta cambiada y su procedencia.
6. Repetir dentro de un presupuesto explícito de tiempo/tokens; si no converge, revisar mecanismo, NO aumentar arbitrariamente roughness ni generar bucles infinitos.
7. Gates técnicos: visual-only no persiste, toggle OFF, zero drift en modelo, memory/dispose, context-loss/reload, FPS p50/p95, triángulos/draw calls, móviles.
8. Gate humano separado: `PENDING_JUANMA`, `PASS`, `PARTIAL`, `NON_PASS`, con observaciones y firma/versionado. La comparación de píxeles **no determina calidad**.

**Tres referencias fotográficas aportadas por Juanma:** terraza portuaria con pérgola azul y sombra; casa tradicional con contraventanas marrones y estuco; villa marfil con contraventanas verdes, teja y paisajismo. Se usan como **estándares de credibilidad, materiales y detalle**, no como planos a copiar. Originales todavía pendientes de comprobar en rutas del repo. El usuario indicó que los subiría personalmente; **no se declara la copia realizada**.

## 6. Workstreams y reducción de gasto de modelos

### W0 — Cierre CP2, SIN nuevo modelado

Ver [checkpoint CI](../../qa/vq01-cp2-ci-success-human-visual-handoff-2026-11-04.md) y [decisión humana ya emitida](../../qa/vq01-cp2-human-visual-partial-acceptance-2026-11-04.md). **El propietario ha aceptado parcialmente B2**; congelar su SHA como fundación técnica, con gaps visuales asignados a familias. NO gastar otra sesión de Astra en las pruebas A0/B1/B2 o M08; NO convertir el reconocimiento de mejora en autorización de merge.

### W1 — Discovery y contrato de visual families (independiente)

- Reutilizar docs de VECINIA y Costa Blanca + repos Rubik verificados.
- Crear la matriz familia → módulos donantes → autoridad Rubik → gaps → riesgo → QA.
- Trabajar en rama/PR propios con fixtures limitados; no tocar VQ-01, Hybrid ni `master`.
- Definir licencia de atlas y texturas de Three-Fenestra; Three versión de Rubik no es necesariamente la de VECINIA.
- Demostrar persistencia cero de elementos ficticios y rollback al apagar.

### W2 — Deuda técnica y mejoras de producto separadas

En paralelo, ordenar las **26 capacidades pendientes del análisis NeonPlan**: 15 parciales `N03,N04,N05,N06,N07,N13,N20,N21,N22,N23,N24,N25,N26,N33,N36` y 11 diferenciales `N01,N02,N10,N11,N12,N15,N17,N29,N30,N31,N32`. No confundir propuesta de implantación con código desplegado. Quick wins estimados: snapping de mobiliario N04, modos de presentación N25/N26, recuperación GPU N23, carga/render 3D N22/N21 (medición previa). No reimplementar lo ya presente en Rubik.

La deuda arquitectónica (render loop, desacoplo de UI, políticas GPU, cleanup, bundle) requiere su propio scope, profiling y gates.

### W3 — Hybrid congelado

Rama `feat/hybrid-registered-elevation-v1@07ae6f9969cae9df746443e97410e40cee2e932a`: no merge ni refactor incidental. Cuando Juanma lo autorice, reconstruir sus pendientes y la deuda de Claude Code desde la rama y QA, **sin asumir que es PASS** ni reabrirla por defecto.

## 7. Continuación para Astra/Codex al recuperar créditos

**No reiniciar CP2.** Fuente verificable: QA run `41802674784`, artifact `13310485726`, SHA `894607b38fa43a5e89a9f5296a41cdbcc989d5ce`. El veredicto **`VISUAL_PARTIAL_ACCEPT_FOUNDATION` ya está registrado**. [PR #165 B2→master](https://github.com/Juanmaes83/floorplan-3d/pull/165) ya está preparado en **draft**, sin merge. Astra/Codex no deben regenerar este trabajo: en el futuro sólo revisarlo si se solicita una **autorización de merge independiente**. Después tomar **un workstream nuevo** de familias o deuda técnica, no ambos a la vez; empezar por contrato reducido y referencias profesionales.

**STOP:** introducir contenido de VECINIA en CP2 para dar un salto rápido; trasladar shader source con hooks prohibidos; implementar las nueve familias a la vez; falsear geometría real; publicar atlas privados sin licencia; perder la trazabilidad A/B; o gastar tokens reejecutando acciones técnicas que GitHub ya ha validado.
