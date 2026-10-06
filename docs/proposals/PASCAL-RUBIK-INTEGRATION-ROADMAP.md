# Pascal Editor → Rubik Sota: propuesta de evolución post-F3 por «escultura»

> **Estado: BORRADOR DE PROPUESTA. No aprobado.** Este documento no modifica el
> [roadmap canónico](../ROADMAP.md), ni la numeración de fases, ni el contrato
> `FloorPlanProjectV1`. No implementa nada. Las fases de la sección 8 son
> hipótesis para revisión de Juanma, no compromisos de alcance ni de fecha.
>
> Auditoría realizada el 06-10-2026 sobre los SHA indicados en la sección 2.
> Las decisiones abiertas de F0 (D-01, D-04, D-06, D-08, D-16 y otras) siguen abiertas.

## 1. Resumen ejecutivo

1. **El fork de Juanma es idéntico al upstream.** El HEAD de ambos es
   `67f8041034e8d3f84c7dfce8e524356fd764cf7a` (02-10-2026). No hay commits propios
   del fork ni commits del upstream que le falten. Basta con auditar `pascalorg/editor`.
2. **Pascal y Rubik no comparten stack ni modelo de datos.**
   - **Pascal:** monorepo Bun/Turbo con Next 16, React 19, R3F y Three 0.186 (WebGPU con fallback a WebGL2). Escena como grafo de nodos zod en **metros**, con plano X/Z e Y hacia arriba. Persistencia en SQLite y localStorage.
   - **Rubik:** app estática sin compilación, Three 0.160 (WebGL), contrato JSON `FloorPlanProjectV1` en **milímetros enteros**, con x a la derecha e y hacia abajo.
   - **Consecuencia:** casi nada se puede copiar literalmente. Lo valioso son **algoritmos aislados, contratos de salida y patrones de diseño**.
3. **Rubik ya tiene más de lo que parecía. Hay que evitar re-implementarlo:**
   - **Captura 3D:** existe en código, está accesible desde la UI en 3D y **la he verificado en ejecución** en esta auditoría: descarga un PNG válido en escritorio y en móvil. **Ningún test del repositorio la cubre**, y la resolución equivale al tamaño del canvas, sin opciones.
   - **Revisión de muebles frente a muros y estancia:** existe un aviso **W3** con huella orientada (OBB/SAT) y polígono de estancia, más protecciones geométricas al dimensionar estancias.
   - **Lo que falta:** colisión **mueble-mueble**, holguras y zona de puerta.
4. **El `check_collisions` de Pascal es más débil geométricamente que W3 de Rubik.**
   - Usa una AABB que envuelve la huella rotada, y solo compara `item` contra `item`.
   - Su **contrato de salida** sí es ejemplar: estados `checked` / `partial` / `insufficient_evidence`, motivos de omisión y una lista explícita de lo que **no** comprueba (altura, pertenencia a la estancia, giro de puerta, ruta de entrega, malla).
   - **La «piedra» es ese contrato y su honestidad epistémica, no su geometría.**
5. **Lo más vistoso de Pascal no es extraíble:**
   - **Solo demo:** X-ray, corte interactivo, «exploded» con el tejado elevado y sistemas ocultos. El propio README (l. 17-20) dice que Pascal Next «no es todavía parte del editor open source».
   - **Librerías o servicios externos:** la captura ARKit/RoomPlan es una librería opcional **no montada** en el editor y requiere un productor externo (Capture alojado). La interpretación de imágenes depende del *sampling* del cliente MCP; no incluye ningún modelo.
6. **Los vídeos adjuntos no estaban disponibles** en este entorno (ni en el disco ni en Google Drive). La sección 5 deja el protocolo de análisis preparado y no infiere su contenido.
7. **Recomendación para la primera revisión.** Propongo dos fases como primer paso, sin cambios de contrato y totalmente locales:
   - **Fase A:** revisión local de distribución, de solo lectura.
   - **Fase B:** pruebas y opciones de la captura 3D existente.

   Ambas tienen coste S–M y riesgo bajo. El MCP local de lectura (fase D1) es la siguiente candidata, pero necesita antes una decisión de dependencias.

## 2. Estado verificado de ambos repositorios

| Repositorio | Rama / HEAD | Fecha HEAD | Comprobación |
| --- | --- | --- | --- |
| `Juanmaes83/floorplan-3d` (Rubik) | `master` = `c4f2493195c05fe54ca22bc1b9fbaf7ea1681af3` | 02-10-2026 | `git fetch origin master` el 06-10-2026. Checkout limpio. Rama local de trabajo `claude/intelligent-pasteur-vci64k` en el mismo SHA. |
| `pascalorg/editor` (upstream) | `main` = `67f8041034e8d3f84c7dfce8e524356fd764cf7a` («Merge PR #994 feat/freeform-elements») | 02-10-2026 16:54 −0400 | Clon de solo lectura, 1971 commits. |
| Fork de Juanma `editor-Open-source-3D-architectural-editor-…` | `main` = `67f8041034e8d3f84c7dfce8e524356fd764cf7a` | igual | `merge-base` = HEAD. Commits propios: **0**. Upstream sin integrar: **0**. |

**Estado de PR de Rubik (API GitHub, 06-10-2026):**
- #23 se cerró por squash el 02-10-2026 18:37Z; su commit es el HEAD actual `c4f2493`.
- #24, #25 y #26 se fusionaron el 02-10-2026.
- **#21** («visible authorship and legal use panel») sigue **abierta**. El roadmap indica que no se toca.
- El roadmap fija como siguiente entrega autorizada **«LAB v03»** (seis modelos y cinco familias de superficie) tras el merge de #23. No consta PR abierta para ella.
- **Esta propuesta no la sustituye ni la adelanta.**

**Licencias de Pascal:**
- **Código:** MIT, «Copyright (c) 2026 Pascal Group Inc.», en el [LICENSE raíz](https://github.com/pascalorg/editor/blob/67f8041034e8d3f84c7dfce8e524356fd764cf7a/LICENSE) y en `packages/{cli,core,editor,geometry-script,ifc-converter,mcp,nodes,viewer}/LICENSE`. **Obligación:** conservar el aviso de copyright y la licencia en cualquier copia o porción sustancial. Si se reutiliza código literal, Rubik debe añadir un `THIRD-PARTY-NOTICES` o una cabecera en el fichero con el SHA de origen.
- **Media de Pascal Next:** CC BY 4.0 ([`docs/media/next-demo/LICENSE.md`](https://github.com/pascalorg/editor/blob/67f8041034e8d3f84c7dfce8e524356fd764cf7a/docs/media/next-demo/LICENSE.md)). No concede derechos de marca.
- **Fuentes del PDF:** OFL 1.1 (GeistMono) y Liberation, en `packages/editor/src/lib/floorplan/pdf-fonts/`.
- **Modelos, texturas, HDRI y audio:** `apps/editor/public` contiene 145 `.glb`, 394 `.webp`, 65 `.jpg`, 62 `.ktx2`, 1 `.hdr` y 24 `.mp3`. **No hay ningún fichero de licencia ni de atribución**, y el catálogo apunta además a un bucket Supabase público.
- **Conclusión sobre licencias:** su procedencia **no está verificada**. **No se propone incorporar ningún asset de Pascal a Rubik.** Esto es coherente con D-11, que exige verificar cada recurso.

## 3. Qué hace Pascal en el editor open source y qué es demo o experimental

Leyenda de madurez:
- **(1)** implementado en el editor OSS;
- **(2)** paquete o herramienta opcional;
- **(3)** experimental o dependiente de un proveedor externo;
- **(4)** solo en Pascal Next o en una demo;
- **(5)** descrito sin evidencia de ejecución.

**Evidencia:** «código» y «tests» significan que el fichero existe. **No ejecuté la suite de Pascal**: requiere Bun y dependencias que no instalé.

| Capacidad | Madurez | Evidencia (ruta @ `67f8041`) | Límites relevantes |
| --- | --- | --- | --- |
| Jerarquía Site → Building → Level → nodos, con 54 tipos zod | (1) | `packages/core/src/schema/types.ts:89-143`, `schema/base.ts:22-39`; tests `schema/*.test.ts` | Metros. Plano `[x,z]`. IDs `prefijo_` + 16 caracteres nanoid. Grafo plano `{nodes, rootNodeIds}` sin versión de documento; migraciones por detección de forma (`core/src/store/use-scene.ts:608`). |
| «Habitación» = `ZoneNode` con polígono y huecos | (1) | `schema/nodes/zone.ts` | Losa y techo derivados de la zona. |
| Muros: ingletes, fusión, topología, división | (1) | `core/src/systems/wall/wall-mitering.ts`, `wall-merge.ts`, `wall-operations.ts` + tests | Admite curvos (`curve-tool.tsx`). Rubik no los admite (C-3). |
| Puertas y ventanas por CSG | (1) | `viewer/src/systems/wall/wall-system.tsx` (three-bvh-csg) + tests de cutout | Acoplado a R3F/WebGPU. |
| Losas, techos, cubiertas, escaleras, columnas, MEP (conductos y tuberías) | (1) en esquema y nodos | `schema/nodes/*.ts`, `packages/nodes/src/*` | Modelo de edificio completo. Rubik es de una sola planta (D-16 aplazada). |
| Snapping, selección, transformaciones, pintura por regiones de cara | (1) | `core/src/services/snap.ts`, `editor/src/lib/material-paint.ts`, `paint-regions.ts` + tests | Pintura por cara y región. Rubik pinta la pared completa (ambas caras). |
| **`check_collisions`** (MCP, solo lectura) | (1) | [`packages/mcp/src/tools/check-collisions.ts`](https://github.com/pascalorg/editor/blob/67f8041034e8d3f84c7dfce8e524356fd764cf7a/packages/mcp/src/tools/check-collisions.ts) (salida l. 70-75; `unsupportedChecks` l. 124-149); geometría `itemPlanAabb` en [`core/src/agent-operations/door-clearance.ts:126-145`](https://github.com/pascalorg/editor/blob/67f8041034e8d3f84c7dfce8e524356fd764cf7a/packages/core/src/agent-operations/door-clearance.ts#L126-L145); 13 tests en `check-collisions.test.ts`, más 24 en `layout-clearance.test.ts` y `door-clearance.test.ts` | Ver detalle a continuación. |
| `furnish_room`, `findValidPlacement`, zonas libres de puerta | (1) | `core/src/agent-operations/layout-clearance.ts:139,199`; `door-clearance.ts:250` (`doorKeepoutFromWall`), constantes l. 71-73 | La zona libre es un **rectángulo** de ±0,65 m por ancho/2 + 0,05 m, **no el arco de giro**, e ignora `hingesSide` y `swingDirection`. La estancia se aproxima con su AABB y 0,05 m de margen, no con el polígono. |
| `spatialGridManager.canPlaceOnFloor` (editor) | (1) | `core/src/hooks/spatial-grid/spatial-grid-manager.ts:551-625` | AABB X/Z sobre item, estantería, columna, armario y escalera. No encontré un test dedicado al gestor. |
| **`generate_variants`** | (1) en MCP con store | [`packages/mcp/src/tools/variants/generate-variants.ts`](https://github.com/pascalorg/editor/blob/67f8041034e8d3f84c7dfce8e524356fd764cf7a/packages/mcp/src/tools/variants/generate-variants.ts) (`forkSceneGraph` l. 104, `countInvalidNodes` l. 51, `saveScene` l. 123); `mutations.ts` | Mutaciones aleatorias con semilla: grosor y altura, barajar nombres, ±10 % en endpoints, borrar un muro interior, puertas, vallas. **La única validación es zod por nodo**, sin geometría ni colisiones. La mutación de puertas escribe `door.wallT`, un campo inexistente en `DoorNode` (`mutations.ts:241`), así que **probablemente no tiene efecto** (no comprobado en ejecución). Cada variante se guarda como escena nueva. |
| CLI local y persistencia SQLite | (1) | `packages/cli/src/bin/pascal.ts`, `packages/mcp/src/storage/sqlite-scene-store.ts:620-663` | Descarga el runtime del editor (con verificación SHA-256) a `~/.pascal`. Revisiones y eventos versionados. Requiere Node ≥ 22.13 o Bun. |
| Sincronización en vivo | (1) | `apps/editor/app/api/scenes/[id]/events/route.ts` (SSE con sondeo de 250 ms), `packages/mcp/src/tools/live-sync.ts` | Reemplaza el grafo completo cuando llega una versión mayor. Es una SSE, no un WebSocket. |
| **Servidor MCP local** (68 herramientas, 3 prompts, recursos) | (1) | `packages/mcp/src/server.ts`, `src/tools/index.ts`, `src/tools/annotations.ts`; transporte HTTP en `src/transports/http.ts` (loopback, token, comprobación de Origin) | Anotaciones de solo lectura, aditivas o destructivas. **Sin modo dry-run ni diff.** `apply_patch` muta directamente. El CHANGELOG dice «46» herramientas y el código registra 68: hay documentación desfasada. |
| MCP alojado (`https://editor.pascal.app/api/mcp`) | (3) | `server.json`, `skills/.mcp.json` | Servicio externo con `sk_live_…`. No auditable desde el repositorio. |
| Skills para agentes (`pascal-3d`, `furniture-fit`) | (2) | `skills/*/SKILL.md` y evals | `furniture-fit` exige decir «la huella cabe», no «cabe». Es texto de política, sin código adicional. |
| Exportación GLB, USDZ, OBJ, STL, 3MF, IFC y PDF de planta | (1) en el navegador | `packages/editor/src/lib/glb-export.ts`, `usdz-export.ts`, `ifc-export.ts`, `floorplan/floorplan-export.tsx` + tests (salvo OBJ y STL) | `export_glb` en MCP devuelve **`not_implemented`** (`mcp/src/tools/export-glb.ts`). IFC importa en «Early alpha» (app aparte). No hay DXF ni DWG. |
| **Captura de imagen 3D** | (1) | [`viewer/src/lib/snapshot-pipeline.ts`](https://github.com/pascalorg/editor/blob/67f8041034e8d3f84c7dfce8e524356fd764cf7a/packages/viewer/src/lib/snapshot-pipeline.ts) (WebP 0,9, borde máx. 2048, modos `standard\|viewport\|area` l. 48-61); [`editor/src/components/editor/snapshot-capture-overlay.tsx:56-62`](https://github.com/pascalorg/editor/blob/67f8041034e8d3f84c7dfce8e524356fd764cf7a/packages/editor/src/components/editor/snapshot-capture-overlay.tsx#L56-L62) (16:9, 9:16, 4:3, 3:4, 1:1); `thumbnail-generator.tsx:65-67` (supermuestreo por mosaicos hasta 8192 px) | La superposición solo se monta con `projectId`. La subida de miniaturas es un stub (`scene-loader.tsx` «TODO(phase7)»). El «Take Screenshot» del command palette usa `toDataURL` sin `preserveDrawingBuffer` (resultado no verificado). Sin tests dedicados localizados. |
| Recorrido en primera persona (walk/drone, colisionadores), interacción con puertas, órbita y vista superior | (1) | `editor/src/components/editor/first-person-controls.tsx`, `first-person/build-collider-world.ts` | Rubik ya tiene órbita, isométrica, superior, recorrido WASD/joystick y apertura de puertas. |
| Cutaway de muros (`up/cutaway/down`), niveles «exploded» | (1) | `viewer/src/store/use-viewer.ts:21,109` | El «exploded» con el tejado elevado de Pascal Next es (4). |
| **X-ray, corte de sección interactivo, sistemas ocultos, reconstrucción detallada** | **(4)** | README l. 15-31. `xray` está declarado pero «Not wired into the viewer store yet» (`viewer/src/lib/display-state.ts:9-11`). El X-ray de ingeniería vive en un plugin externo `@pascal-app/plugin-bones`, no revisado. Los planos de clip solo existen para capturas (`thumbnail-generator.tsx:465`). | **No son piedras disponibles.** |
| Entorno (luz y atmósfera) | (2) en plugin externo | `apps/editor/lib/bootstrap.ts:99-101` (`AxiomeCG/environment`) | Código fuera del repositorio. |
| Objetos paramétricos: recetas declarativas | (1) | `packages/core/src/procedural-items/` (`recipe.ts`, `design.ts`) + muchos tests | Datos sin código ejecutable. Las recetas v2 llevan el aviso `design_version_not_enabled`. |
| Objetos libres «freeform» (PR #994): script three.js → GLB | (1) en el editor; (3) en MCP | `packages/geometry-script/src/compile.ts:705-722` (`new Function` y `SOURCE_GUARD`, «A deterrent, not the isolation boundary»), aislamiento en `editor/src/lib/geometry-script/client.ts` (iframe sandbox + CSP + Worker) | Tests escasos (1 en compile y 3 en handles). Ninguno cubre el sandbox. El MCP standalone no inyecta host (`pascal-mcp.ts:61`), así que allí está desactivado. |
| Runtime de captura ARKit/RoomPlan | (2) + (3) | `core/src/capture/schema.ts`, `viewer/src/capture/capture-runtime.tsx` + tests | **No está montado** en el editor (`rg CaptureRuntime apps packages/editor` → 0). Necesita un productor externo (Capture alojado) con un dispositivo iOS con LiDAR. No hay app iOS ni parser de `CapturedRoom`, ni conversión de escaneo a muros. En el OSS solo se puede subir un `.glb` como referencia visual. |
| Interpretación de imagen de plano o foto | (3) | `packages/mcp/src/tools/vision/index.ts:6-11`, `analyze-floorplan-image.ts`, `photo-to-scene.ts` | No incluye modelo: usa el *sampling* del cliente MCP, que es remoto y depende del proveedor. Los tests usan un handler simulado. Precisión no verificada. |
| Calco manual sobre imagen con escala | (1) | `schema/nodes/guide.ts:14-23` | Equivalente a F1b de Rubik, que además verifica una segunda cota. |
| Catálogo de muebles | (1) con dependencia de red | `editor/src/components/ui/item-catalog/catalog-items.tsx` (111 ítems, URLs Supabase) | Licencias no documentadas. |

### 3.1 Detalle de `check_collisions`: qué comprueba y qué no

- **Comprueba:**
  - solo nodos `type === 'item'` del mismo nivel (`layout-clearance.ts:65,107`);
  - en planta X/Z;
  - con `itemPlanAabb`, una caja alineada a los ejes que **envuelve** el rectángulo rotado (`|cos|`, `|sin|`). Es conservadora y sobrestima los solapes en piezas giradas;
  - el solape es estricto, así que tocarse no cuenta;
  - con `minimumClearance` en metros (por defecto 0) clasifica cada caso como `overlap` o `clearance`;
  - admite un `candidate` hipotético que no se inserta en la escena.
- **Datos de entrada:** dimensiones **declaradas** del asset × escala. **No carga mallas.**
- **No comprueba** (y lo declara en `unsupportedChecks`):
  - altura y holgura vertical;
  - pertenencia a la estancia;
  - envolvente de giro de puerta;
  - ruta de entrega (giros, escaleras, huecos);
  - geometría de malla;
  - ítems alojados en un marco no de nivel.
- **Tampoco compara** con muros, columnas, escaleras, armarios o estanterías.
- **Evidencia insuficiente:** omite piezas con motivo (`missing_dimensions`, `non_planar_rotation`, `unresolved_level`, …). Devuelve `status: insufficient_evidence` si no pudo comprobar ninguna y `partial` si omitió alguna.
- **Discrepancia:** `packages/mcp/README.md:353` promete «out-of-bounds placements», pero el código no lo hace.
- **Conclusión:** un informe de huellas **no garantiza que «el mueble cabe»**, ni que se pueda usar, ni que cumpla ninguna norma.

## 4. Qué tiene ya Rubik (HEAD `c4f2493`)

Tipos de evidencia: **R** = README o documentación; **C** = código localizado; **T** = test en el repositorio; **E** = ejecutado por mí en esta auditoría (Chromium headless con SwiftShader, o `node --test`).

| Capacidad | Clasificación | Evidencia | Fuente |
| --- | --- | --- | --- |
| Contrato `FloorPlanProjectV1` 1.4.0 (mm enteros, x→ e y↓, IDs con prefijo, W1–W4, S1–S7) | Integrada y documentada | R C T E | [`docs/contracts/FloorPlanProjectV1.md`](https://github.com/Juanmaes83/floorplan-3d/blob/c4f2493195c05fe54ca22bc1b9fbaf7ea1681af3/docs/contracts/FloorPlanProjectV1.md), `js/project-core.js`, `js/project-schema.js`, `tests/project.test.cjs` (E: pasa) |
| Varios proyectos locales (crear, abrir, renombrar, **duplicar**, borrar); JSON y ZIP | Integrada | R C T | `js/project-library.js:25` (`duplicate` genera un `prj_` nuevo), `js/project-package.js`, `tests/library.test.cjs` (E: pasa) |
| Importación de imagen PNG/JPG/WebP, calibración, segunda cota, trazado | Integrada (F1b). Faltan los cinco planos reales | R C T | `js/tracing-core.js`, `js/tracing-ui.js`, `tests/tracing.test.cjs` (E: pasa) |
| Sugerencia local de muros (F2) | **Experimental, no validada empíricamente** | R C T | `js/wall-assist.js`, `tests/wall_assist.test.cjs`. Pendientes: cinco sesiones, veinte planos y umbrales. **No bloquea** otras entregas (ROADMAP). |
| Estancias rectangulares con dimensión numérica y protección geométrica | Integrada (#18) | R C T E | [`js/room-layout.js:32-45`](https://github.com/Juanmaes83/floorplan-3d/blob/c4f2493195c05fe54ca22bc1b9fbaf7ea1681af3/js/room-layout.js#L32-L45): SAT y bloqueo si un cambio invadiría otra estancia, cruzaría un muro o **colisionaría un muro con un mueble**. `tests/room-layout.test.cjs` (E: pasa). |
| **Aviso W3: mueble fuera de su estancia o solapado con un muro** | Integrada (F1b) | R C T E | [`js/tracing-core.js:115-121`](https://github.com/Juanmaes83/floorplan-3d/blob/c4f2493195c05fe54ca22bc1b9fbaf7ea1681af3/js/tracing-core.js#L115-L121): huella **orientada** (OBB), pertenencia al polígono con cruce de aristas (cubre estancias cóncavas) y SAT contra los sólidos de muro **descontando huecos**. Tests en `tests/tracing.test.cjs:11,13,24`. Visible en `#traceWarnings` (`js/tracing-ui.js:101`). |
| Colisión **mueble-mueble**, holguras de paso, zona libre de puerta | **No existe** | — | `rg overlap\|clearance` sin resultados de mobiliario. |
| Catálogo: más de 60 genéricos, 2 piloto + 12 + 6 GLB normalizados, búsqueda | Integrada (#17/#20/#23). Escala física y móvil sin verificar | R C T | `js/asset-catalog.js`, `js/furniture-search.js`, `tests/assets*.test.cjs` |
| 50 acabados CC0 para suelo y pared | Integrada (#19) | R C T | `js/surface-catalog.js`, `tests/surfaces*.test.cjs` |
| Vista 3D: órbita, isométrica, superior, recorrido WASD/joystick, puertas, muros completos o en sección, sol y modo noche, mover muebles | Integrada | R C E (entrada a 3D y render verificados) | `index.html:291-298`, `index.html:1855+` |
| **Exportar PNG 2D** | Integrada y probada | R C T | `index.html:1662-1679` (3200 px de ancho); `tests/browser.test.cjs:55` comprueba la firma PNG y el ancho 3200 |
| **Exportar PNG 3D** | Integrada en código y UI, **sin test en el repositorio**, verificada aquí | C E | Ver 4.1 |
| Exportación determinista Rubik → GLB/Blender | Integrada (#24) como **CLI offline**, no en la UI | R C T E | `scripts/interop/export.cjs`, `tests/interop.test.cjs` (E: 17 pasan y 1 se omite porque requiere Blender) |
| Multiplanta, cubiertas, escaleras, sistemas | **No existe**. D-16 aplazada | R | Contrato §1 y C-4 |
| MCP u operaciones para agentes | **No existe** | — | `rg -i mcp js index.html` → 0 |
| Variantes de diseño | **No existe** como función. La duplicación de proyecto es la base. | C | `js/project-library.js:25` |
| Objetos personalizados o paramétricos | **No existe** (genéricos con tamaño editable) | C | — |
| Escaneo o interpretación multimodal | **No existe**. Solo F2 local, ortogonal y experimental | R C | `docs/technical/F2-wall-assist.md` |

### 4.1 Comprobación obligatoria de la captura 3D

| Afirmación | Resultado | Evidencia |
| --- | --- | --- |
| La función existe en el código | **Sí** | [`index.html:1663`](https://github.com/Juanmaes83/floorplan-3d/blob/c4f2493195c05fe54ca22bc1b9fbaf7ea1681af3/index.html#L1663): `if (is3D()) return window.View3D.shot();` y [`index.html:3027`](https://github.com/Juanmaes83/floorplan-3d/blob/c4f2493195c05fe54ca22bc1b9fbaf7ea1681af3/index.html#L3027): `shot()` hace `renderer.domElement.toDataURL('image/png')` y lo descarga como `…-3D.png`. El renderer usa `preserveDrawingBuffer:true` (`index.html:1863`). `shot` se expone en `window.View3D` (l. 3031). |
| La acción está disponible en la interfaz | **Sí** | `#exportPng` está en el menú «Archivo» (`index.html:329`) y **no** lleva la clase `only2d`. **E:** en 3D, el menú es visible a 1440×900 y a 390×844. |
| La descarga 3D se ha probado automáticamente | **No** en el repositorio | El único test de `#exportPng` (`tests/browser.test.cjs:55`) se ejecuta en **2D** (ancho 3200). Ningún test de navegador cambia a 3D y pulsa el botón. **E (fuera del repositorio, script en el scratchpad):** con Three 0.160.0 servido localmente, la descarga 3D produjo `rubik-sota-floor-plan-3D.png`, con firma PNG válida, de **904×735** a 1440×900 y de **390×404** a 390×844, sin errores de página. |
| Resolución, recorte o relación de aspecto configurables | **No** | El tamaño es el del buffer del canvas (ancho y alto del contenedor × `min(devicePixelRatio, 2)`). No hay opción de tamaño, aspecto, recorte, fondo transparente ni supermuestreo. Las **etiquetas CSS2D de estancia no se incluyen**, porque se dibujan con un renderer DOM separado (`labelRenderer`, l. 1870); la imagen capturada no las muestra. Sin conmutar el HUD. En móvil la imagen sale pequeña y vertical. |

**Brecha real frente a Pascal:** no falta la captura, sino sus **opciones**:
- resolución objetivo independiente del viewport;
- presets de aspecto;
- recorte de área;
- supermuestreo;
- inclusión opcional de etiquetas;
- y una **prueba automatizada** del recorrido 3D.

## 5. Observaciones de los dos vídeos

**Estado: no disponibles.** Ni `VIDEO REFERENCIA RENDER VIVIENDA- PLATAFORMA.mp4` ni `VIDEO 2 REFERENCIA RENDER VIVIENDA- PLATAFORMA.mp4` están en el sistema de ficheros del entorno (`find / -iname '*.mp4'` → 0 resultados), y una búsqueda por título en Google Drive no devolvió resultados. **No se infiere su contenido**, ni el nombre, el stack o las capacidades de la aplicación grabada. Tampoco se confunden con los GIF/MP4 de Pascal Next del README de Pascal.

**Protocolo pendiente** para cuando se aporten:
1. Ejecutar `ffprobe -v error -show_entries format=duration:stream=width,height,r_frame_rate` sobre cada vídeo.
2. Extraer un fotograma cada 2 s y en los cambios de escena con `ffmpeg -vf "select='gt(scene,0.3)'"`.
3. Registrar por vídeo:
   - las interacciones visibles y su secuencia;
   - la respuesta del editor;
   - los datos y controles en pantalla;
   - el encuadre, la navegación, los materiales y la iluminación;
   - lo que **no** puede afirmarse.
4. Rellenar la columna «Vídeo 1/2» de la matriz con «observado en vídeo», separado de «confirmado en repositorio».

Hasta entonces, esa columna dice **«no comprobado»**.

## 6. Matriz de brechas

Valores de brecha: no existe · parcial · existe con límites · experimental · fuera de alcance · no comprobado.

| Capacidad | Rubik hoy | Pascal hoy (OSS) | Vídeo 1/2 | Brecha real | Fuente exacta | Madurez Pascal | Valor potencial | Coste/riesgo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Creación y edición geométrica | Muros por eje, huecos y polígonos. Rectángulos con dimensión numérica. Sin muros curvos. | Muros con ingletes, curvos, división y fusión, zonas automáticas | no comprobado | **Existe con límites.** El editor numérico para formas irregulares queda fuera del alcance actual (#18). | Rubik `js/room-layout.js`; Pascal `core/src/systems/wall/*` | (1) | Medio | Alto: modelo topológico distinto (C-2) |
| Importación de plano y escala | F1b con calibración de 2 puntos y **segunda cota**. F2 experimental. | `GuideNode` con escala de 1 referencia | no comprobado | **Rubik va por delante.** No hay brecha frente a Pascal. | `js/tracing-core.js`; `schema/nodes/guide.ts` | (1) | — | — |
| Colocación de muebles y catálogo | Más de 60 genéricos y 20 GLB verificados, búsqueda, arrastre, rotación, ajuste a muro | 111 ítems remotos, ajuste a muro y suelo, rejilla espacial | no comprobado | **Existe con límites.** El catálogo de Pascal no es reutilizable (licencias). | `js/asset-catalog.js`; `catalog-items.tsx` | (1) | Bajo (assets) | Alto (licencia) |
| Límites de estancia y obstáculos | **W3 con OBB y polígono contra estancia y muros (menos huecos).** Bloqueos en #18. | AABB de la estancia en `classifyPlacement`; `check_collisions` no lo cubre | no comprobado | **Rubik va por delante.** | `tracing-core.js:115-121`; `layout-clearance.ts:139` | (1) | — | — |
| Colisiones y espacios de acceso | **No existe** mueble-mueble ni holgura | AABB envolvente ítem-ítem, holgura mínima, zona libre de puerta rectangular, contrato `partial/insufficient_evidence` | no comprobado | **No existe** en Rubik | `check-collisions.ts`, `door-clearance.ts` | (1) | **Alto** para el usuario que amuebla | **Bajo.** Solo lectura, sin contrato. |
| Puertas, ventanas y huecos | Huecos con `offsetMm`, alféizar y `swing` (bisagra y lado). Apertura en el recorrido. | CSG, puertas paramétricas, mecanismos | no comprobado | **Existe con límites.** Rubik tiene más datos de giro de los que usa Pascal en sus comprobaciones. | Contrato §4; `door.ts`, `wall-system.tsx` | (1) | Medio | Medio |
| Edición de materiales | 50 CC0, suelo por estancia, pared completa y repetición | Pintura por región y cara, eyedropper, biblioteca PBR | no comprobado | **Parcial.** Falta acabado por cara o región (el contrato 1.4.0 lo excluye a propósito). | `surface-material-library.md`; `material-paint.ts` | (1) | Medio | Medio: cambio de contrato |
| Cámara, recorrido y presentación | Órbita, isométrica, superior, recorrido, puertas, sección y noche | Igual, más drone, cámara guardada por nodo y WebXR (plugin) | no comprobado | **Existe con límites.** Falta guardar vistas o cámaras con nombre. | `index.html:291-298`; `first-person-controls.tsx` | (1)/(2) | Medio | Bajo–medio |
| Captura y exportación de imagen | PNG 2D a 3200 px (probado). PNG 3D a tamaño del canvas (verificado aquí, sin test). | Presets de aspecto, área, supermuestreo hasta 8192, WebP | no comprobado | **Parcial:** faltan opciones y test | §4.1; `snapshot-pipeline.ts` | (1) | Medio–alto (presentación) | **Bajo** |
| Proyectos y persistencia local | localStorage + IndexedDB, JSON y ZIP, duplicar | SQLite con revisiones y eventos; localStorage en el navegador | no comprobado | **Existe con límites.** Sin historial de revisiones por proyecto. | `project-library.js`; `sqlite-scene-store.ts` | (1) | Bajo–medio | Medio |
| Multiplanta y sistemas constructivos | No (D-16 aplazada) | Sí (Level, Roof, Stair, MEP…) | no comprobado | **No existe / fuera del alcance actual** | Contrato C-4 | (1) | Depende de D-01 | **Alto**: contrato y UI |
| Operaciones de agente y MCP | No | 68 herramientas, recursos, prompts, skills | no comprobado | **No existe** | `packages/mcp/src/*` | (1) | Medio–alto (automatización y QA) | Medio: dependencias, seguridad |
| Alternativas de diseño | Solo duplicar proyecto | `generate_variants` aleatorio, validación solo zod | no comprobado | **Parcial** (base de duplicación) | `project-library.js:25`; `generate-variants.ts` | (1), calidad baja | Medio | Medio |
| Objetos personalizados | No | Recetas declarativas, scripts three.js en sandbox | no comprobado | **No existe** | `procedural-items/`, `geometry-script/` | (1)/(3) | Bajo–medio | **Alto** (seguridad, contrato) |
| Captura, escaneo e interpretación de imágenes | F2 local experimental | Runtime ARKit no montado; visión por *sampling* externo | no comprobado | **Experimental en ambos.** Pascal depende de externos. | `wall-assist.js`; `capture/*`, `vision/*` | (2)/(3) | Incierto | **Alto** (privacidad D-08, precisión D-04) |
| Exportación e interoperabilidad | GLB+semántica offline (CLI); JSON y ZIP; PNG | GLB, USDZ, OBJ, STL, 3MF, IFC y PDF en el navegador | no comprobado | **Parcial.** Faltan el GLB desde la UI y el PDF de planta. | `scripts/interop/export.cjs`; `export-manager.tsx` | (1) | Medio | Medio |

## 7. «Piedras» priorizadas y método de extracción

**Método de escultura** para cada piedra:
1. **Seleccionar:** fichero y símbolo exactos @ `67f8041`.
2. **Aislar:** listar sus dependencias y cortar las de framework (React, zod, store).
3. **Adaptar bordes:**
   - metros → mm enteros;
   - `[x,z]` con Y arriba → `{x,y}` con y abajo;
   - giro: en Pascal `rotation[1]` está en radianes, en Rubik `rotationDeg` es horario;
   - IDs `wall_…` → `wal_…`.
4. **Pulir:** tests propios con fixtures sintéticos.

Si se copia código literal, aplicar el aviso MIT. **Nunca** se importan assets de Pascal.

| # | Piedra | Beneficio para el usuario de Rubik | Fuente Pascal | Reutilización | Se descarta | Adaptación a `FloorPlanProjectV1` | Clasificación |
| --- | --- | --- | --- | --- | --- | --- | --- |
| P1 | **Contrato de informe honesto de distribución** | Saber qué muebles se solapan o quedan sin paso, y **qué no se ha comprobado** | `check-collisions.ts` l. 37-149 y 230-302 (estados, `skipped`, `unsupportedChecks`, `assessmentGraphHash`) | **Contrato/protocolo** (forma de la salida) | AABB envolvente, zod, transporte MCP | Salida calculada, **no persistida**. Sin cambio de schema. | Extraíble y acotada |
| P2 | **Zona libre de puerta** | Aviso si un mueble bloquea una puerta | `door-clearance.ts:250-295` (`doorKeepoutFromWall`), constantes l. 71-73 | **Algoritmo aislado** como patrón, reescrito en mm | El rectángulo simétrico | Usar `opening.swing` (bisagra y lado) que Rubik **sí** tiene: barrido de hoja = sector de radio `widthMm` hacia el lado de apertura, más profundidad de paso parametrizable. Sin schema. | Reutilizable con adaptador |
| P3 | **Búsqueda de posición válida** (`findValidPlacement`) | Sugerir dónde cabe la huella de un mueble | `layout-clearance.ts:171-199` | **Patrón** | La aproximación de la estancia por AABB | Usar el polígono, W3 y la SAT existentes en Rubik. **Solo sugerencia**, nunca mueve sin confirmación. | Patrón útil, implementación incompatible |
| P4 | **Opciones de captura** (aspecto, área, supermuestreo) | Imágenes de presentación nítidas y con formato fijo | `snapshot-pipeline.ts:48-61,481-493`; `snapshot-capture-overlay.tsx:56-62`; `thumbnail-generator.tsx:65-67` | **Patrón** (presets, cálculo de recorte, mosaico) | WebGPU, R3F, event bus, WebP por defecto | Ninguna en el contrato. Implementación sobre `WebGLRenderer` 0.160 con `setSize` temporal o `WebGLRenderTarget`. | Patrón útil, implementación incompatible |
| P5 | **Variante = copia validada** | Comparar alternativas sin tocar el original | `generate-variants.ts` (fork → validar → guardar copia, semilla reproducible) | **Patrón** del flujo | Las mutaciones aleatorias y la validación solo zod | Reutilizar `ProjectLibrary.duplicate`. Validar con `project-core` (S1–S7), W1–W4 y P1. Metadato de origen en un nombre o en `extensions['x-variant']`, a decidir (C-5). | Reutilizable con adaptador |
| P6 | **Servidor MCP local de solo lectura** | Que un agente lea, valide y explique un JSON exportado | `packages/mcp/src/tools/annotations.ts` (anotaciones), `transports/http.ts` (loopback, token, Origin), estilo de las herramientas `get_scene`, `measure`, `validate_scene` | **Contrato/protocolo y patrón** | Todo el store SQLite, live-sync y las herramientas mutantes | Herramientas Node sobre `js/project-core.js`, `tracing-core.js` y P1, con entrada = **fichero JSON explícito**. Transporte stdio. | Reutilizable con adaptador (dependencia SDK a decidir) |
| P7 | **Propuestas como diff revisable** | Que un agente proponga cambios que el usuario acepta o rechaza | `apply-patch.ts` + `patch-guards.ts:97-178` (guardas de borrado) | **Patrón** (guardas) | Aplicación directa, que en Pascal no tiene dry-run | JSON Patch (RFC 6902) sobre un proyecto exportado. La salida es otro fichero y nunca escribe en el almacenamiento del navegador. | Patrón útil |
| P8 | **Recetas paramétricas declarativas** | Muebles a medida sin código ejecutable | `core/src/procedural-items/recipe.ts`, `design.ts` | Patrón y quizá algoritmo | Los scripts `geometry-script` (`new Function`) | Requiere un campo nuevo (minor) o `extensions`. Revisión de schema. | Demasiado grande para esta etapa |
| P9 | **Niveles, cubierta, escalera** | Edificio completo | `schema/nodes/level.ts`, `roof*.ts`, `stair*.ts` | Solo patrón | Todo el código | `levels[]` (C-4, D-16): minor o major, con migración | Demasiado grande para esta etapa |
| P10 | X-ray, corte interactivo, exploded del tejado, sistemas ocultos | — | Pascal Next (README l. 15-31); `display-state.ts:11` «not wired» | — | — | — | **Solo demo / no extraíble** |
| P11 | Runtime ARKit/RoomPlan y `photo_to_scene` | — | `core/src/capture/*`, `mcp/src/tools/vision/*` | Solo contrato de datos como referencia | Todo | Requiere proveedor y hardware; D-08 | Demasiado grande / dependiente de externos |

### 7.1 Ficha detallada de las piedras candidatas a corto plazo

**P1 + P2: revisión local de distribución**
- **Licencia y dependencias:**
  - La fuente es MIT.
  - Se propone **reimplementar** en JS plano dentro de un nuevo `js/layout-review.js` (UMD, como el resto de `js/`), usando el contrato de salida como especificación.
  - No se copia código literal, así que no se requiere aviso. Si se copiaran constantes o funciones, añadir cabecera MIT con el SHA.
  - Sin dependencias nuevas.
- **Conversión de unidades y ejes:**
  - Rubik ya trabaja en mm y planta; no hay conversión.
  - Constantes de Pascal en metros (0,65 m; 0,05 m; 0,08 m) → parámetros en mm **sin carácter normativo**, que el usuario puede ajustar.
- **Geometría:**
  - Mueble-mueble con OBB y SAT (reutilizar la proyección de `tracing-core.js:119-120`).
  - Holgura por expansión de la OBB o por distancia mínima entre polígonos.
  - Puerta con un sector de giro basado en `swing`.
  - Sin altura en la primera iteración: declararlo en `unsupportedChecks`, junto con «ruta de entrega», «malla real» y «normativa».
- **Procedencia de medidas:**
  - Si `scale.confidence ≠ real` (W4), o el mueble viene de un GLB con «medidas de malla», el informe debe marcarlo.
  - Estado `partial` cuando faltan datos o la escala no está confirmada.
- **Impacto:** contrato y schema ninguno; almacenamiento ninguno; UI: una lista de avisos en el panel de revisión existente y un resaltado en 2D. Compatibilidad total.
- **Local y privacidad:** 100 % local. Sin riesgos de privacidad.
- **Riesgos:**
  - Precisión: falsos positivos por tolerancias.
  - Rendimiento: O(n²) en n muebles, aceptable con n < 200 o con filtro por estancia.
  - Atribución: ninguno si es patrón.
- **Pruebas:**
  - Pascal aporta los casos de `check-collisions.test.ts` y `door-clearance.test.ts` como **catálogo de escenarios**: solape, cercano sin solape, candidato sin mutación, evidencia insuficiente, otro nivel.
  - Rubik añade:
    - tests unitarios con fixtures sintéticos (OBB girada 45° sin solape real, que la AABB marcaría falsamente);
    - puerta con bisagra a la izquierda y a la derecha;
    - estancia en L;
    - escala estimada;
    - un test de navegador que verifique que el informe **no muta** el proyecto (`JSON.stringify` antes y después).
- **Estimación:** S–M, 3–6 días de trabajo efectivo más el ciclo de revisión. **Supuestos:** una persona con un asistente de código y sin cambios de contrato.
- **Aceptación observable:** con el fixture «sofá girado 45° junto a una mesa», el informe distingue solape de holgura, cita los IDs `obj_…`, muestra `unsupportedChecks` y **no cambia** el JSON exportado.
- **Detener o aplazar si:** la tasa de falsos positivos en los proyectos de ejemplo hace el aviso ruidoso (umbral a decidir por Juanma), o si se pretende presentarlo como cumplimiento normativo.

**P4: opciones de la captura 3D existente**
- **Dependencias:** ninguna; Three 0.160 ya está.
- **Implementación:**
  - Render fuera de pantalla a la resolución elegida mediante `WebGLRenderTarget` o un redimensionado temporal, restaurado en `finally`.
  - Aspectos 16:9, 4:3, 1:1 y 9:16.
  - Etiquetas opcionales, compuestas en un canvas 2D.
  - Mantener PNG.
- **Riesgos:**
  - Memoria en móvil: limitar el borde máximo (p. ej. 4096) según el contexto WebGL (`MAX_TEXTURE_SIZE`).
  - No dejar el renderer en mal estado si falla.
- **Pruebas:**
  - Test de navegador que entra en 3D y descarga, comprobando firma PNG, dimensiones exactas por preset, ausencia de errores y canvas restaurado.
  - Repetir en móvil a 390×844.
  - Captura visual en `docs/qa/artifacts/`.
- **Estimación:** S, 2–4 días.
- **Aceptación:** «16:9 / 1920» produce exactamente 1920×1080 en escritorio y en móvil, y la vista interactiva queda idéntica tras capturar.
- **Detener si:** SwiftShader o un móvil físico no soportan el tamaño. Caer a «tamaño de pantalla» con aviso.

**P5: variantes seguras**
- **Flujo:** «Crear variante» = duplicar el proyecto actual, nombrarlo `«<nombre> · variante N»` y abrirlo. El original no se toca.
- **Validación:** antes de guardar cualquier cambio, la variante se valida con `Core.validate`, W1–W4 y P1.
- **Comparación:** tabla lado a lado de área útil, número de muebles y avisos.
- **Sin mutaciones aleatorias** en la primera iteración.
- **Contrato:** ninguno si el vínculo con el original vive solo en el nombre o en metadatos de la biblioteca. Si se quiere en el JSON, usar `extensions['x-variant-of']` (experimental, C-5) o proponer un minor.
- **Estimación:** M, 5–8 días.
- **Detener si:** la cuota de localStorage o IndexedDB con imágenes compartidas se agota. Hay que medirlo antes, porque las imágenes se comparten por referencia según D-09.

**P6: MCP local de solo lectura**
- **Dependencia:** `@modelcontextprotocol/sdk` (MIT), en un `tools/mcp/package.json` aislado como el de `scripts/f3-pipeline`. **No afecta a la app estática.** Alternativa: implementar JSON-RPC por stdio a mano (unas 200 líneas) para no añadir dependencias.
- **Herramientas iniciales:**
  - `validate_project`: esquema, S1–S7 y W1–W4;
  - `summarize_project`: estancias, áreas, muebles y escala;
  - `review_layout`: P1+P2;
  - `measure`: distancia entre IDs.
- **Entrada:** ruta de un JSON exportado por el usuario. **Nunca** lee el almacenamiento del navegador.
- **Seguridad:** stdio, sin red ni escritura. Lista blanca del directorio de entrada.
- **Estimación:** M, 4–7 días.
- **Aceptación:** con Claude Code o Codex, `validate_project` sobre `docs/contracts/examples/*.json` reproduce exactamente los errores documentados en el contrato §8.

## 8. Propuesta de evolución post-F3 (no aprobada)

> No se crea F4/F5. Las fases se nombran **A–G** solo dentro de esta propuesta.
> Todas quedan **detrás** de la entrega ya autorizada «LAB v03» y no la desplazan,
> salvo decisión expresa de Juanma. F2 sigue experimental y **no bloquea** ninguna de ellas.

**Puertas comunes a cada fase:**
1. auditoría terminada;
2. diseño revisable (un documento técnico breve en `docs/technical/`);
3. **una PR acotada por piedra**;
4. CI o tests locales y preview Vercel del SHA exacto, verificados;
5. revisión visual de Juanma en móvil y escritorio;
6. aprobación explícita para el merge;
7. cierre documental en el roadmap canónico (solo después del merge).

### Fase A: revisión local de distribución, de solo lectura (P1 + P2)

| Campo | Contenido |
| --- | --- |
| Objetivo / usuario | Quien amuebla una vivienda detecta solapes entre muebles, holguras escasas y puertas bloqueadas, con transparencia sobre lo no comprobado. |
| Prerequisitos | Aprobar esta propuesta. Decidir los valores por defecto de holgura (D-A1). |
| Incluido | Mueble-mueble con OBB, holgura configurable, sector de puerta con `swing`, estados `checked/partial/insufficient_evidence`, `unsupportedChecks`, lista en el panel y resaltado 2D. |
| Excluido | Mover muebles automáticamente, altura, ruta de entrega, normativa (CTE/IRC), mallas GLB, 3D. |
| Piedras | P1 (contrato), P2 (zona de puerta, adaptada). |
| Impacto en `FloorPlanProjectV1` | **Ninguno.** Es un cálculo derivado y no persistido. |
| Compatibilidad | Total. Proyectos 1.0–1.4 sin cambios. |
| Pruebas | Unitarias de geometría (`tests/layout-review.test.cjs`); navegador: informe sin mutación, escritorio y 390×844; visual: captura del resaltado. |
| Artefactos | `js/layout-review.js`, doc técnico, fixtures sintéticos, capturas QA, preview. |
| Rango temporal | 1–1,5 semanas de calendario con revisión. Confianza **media-alta**. |
| Riesgos / salida | Falsos positivos o interpretación normativa. Salir si Juanma considera el ruido inaceptable tras la preview. |
| Criterio para avanzar | Aprobación visual y cero mutaciones verificadas por test. |

### Fase B: captura 3D configurable (P4)

| Campo | Contenido |
| --- | --- |
| Objetivo / usuario | Presentación a cliente o agente con imágenes de formato fijo. |
| Prerequisitos | Ninguno técnico. Puede ir en paralelo a A si se separa en otra PR. |
| Incluido | Presets de aspecto y resolución, etiquetas opcionales, test 3D de descarga (cubre la brecha de pruebas actual). |
| Excluido | WebGPU, recorte por arrastre (iteración posterior), vídeo, render offline, subida de imágenes. |
| Impacto en el contrato | Ninguno. Si se quisieran «vistas guardadas», sería otra decisión de contrato (no incluida). |
| Pruebas | Navegador con dimensiones exactas, móvil y restauración del canvas. Visual: tres capturas de referencia. |
| Rango | 0,5–1 semana. Confianza **alta**. |
| Riesgos / salida | Límites de memoria WebGL en móvil. Medir en teléfono físico (pendiente general D-10). |
| Avanzar si | La descarga verificada por test pasa en SwiftShader y Juanma valida la calidad. |

### Fase C: variantes seguras (P5)

| Campo | Contenido |
| --- | --- |
| Objetivo / usuario | Comparar dos o tres distribuciones sin riesgo para el original. |
| Prerequisitos | A integrada, porque las variantes se validan con su informe. Decisión D-C1 sobre dónde guardar el vínculo. |
| Incluido | Crear variante (duplicado), etiqueta, comparación de métricas y avisos, borrado con confirmación. |
| Excluido | Mutaciones automáticas o aleatorias, fusión de variantes, sincronización. |
| Impacto en el contrato | Ninguno (opción 1) o `extensions['x-variant-of']` (opción 2, experimental). Un campo formal requeriría un minor 1.5.0 y su revisión. |
| Pruebas | Unitarias (el original queda intacto byte a byte); navegador (crear, editar la variante, el original sin cambios); cuota de almacenamiento. |
| Rango | 1,5–2 semanas. Confianza **media**. |
| Salida | Cuotas de almacenamiento o confusión de UX en móvil. |

### Fase D: MCP local para Rubik (D1 lectura → D2 propuestas por diff) (P6, P7)

| Campo | Contenido |
| --- | --- |
| Objetivo / usuario | Equipo técnico o usuario avanzado que usa un agente para auditar y explicar un proyecto exportado. |
| Prerequisitos | A integrada (reutiliza `review_layout`). Decisión D-D1 sobre la dependencia del SDK. |
| D1 incluido | Servidor stdio de solo lectura sobre un **JSON explícito**: validar, resumir, revisar distribución y medir. |
| D2 incluido (después) | `propose_patch`: escribe un **JSON Patch** y un JSON resultante validado en un fichero nuevo. El usuario lo importa manualmente en la app. |
| Excluido | Acceso al localStorage o IndexedDB del navegador, live sync, HTTP, servicios alojados, escritura in situ. |
| Impacto en el contrato | Ninguno. Los patches deben producir un JSON válido 1.x. |
| Pruebas | Unitarias por herramienta; contrato de las herramientas (anotación de solo lectura); un test e2e con un cliente MCP mínimo; fixtures del contrato. |
| Rango | D1: 1–1,5 semanas; D2: 1,5–2 semanas. Confianza **media**. |
| Salida | Si la dependencia del SDK o la superficie de seguridad no se aceptan, quedarse en un CLI Node sin MCP (mismo valor, menos integración). |

### Fase E (condicional): multiplanta y sistemas constructivos

- **Solo** si Juanma decide pasar de «plano residencial» a «edificio» (D-16, D-01).
- Requiere un `levels[]` en el contrato (minor con migración trivial «un nivel» o major), revisión de los exportadores (#24) y una UI nueva.
- **Pascal solo aporta patrón** (P9).
- Estimación: L, 4–8 semanas. Confianza **baja**.
- **No recomendada en esta etapa.**

### Fase F (condicional): objetos geométricos personalizados

- Empezar, si acaso, por **recetas declarativas** (P8), nunca por ejecución de scripts.
- Requiere diseño de schema, límites de triángulos y tamaño, tests de aislamiento y una decisión sobre su exportación a GLB y Blender.
- Estimación: L, 3–6 semanas. Confianza **baja**.
- **Detener** si se exige ejecutar código de usuario o de un agente en el navegador sin una revisión de seguridad independiente.

### Fase G (condicional): interpretación multimodal de planos

- Prerequisitos:
  - D-08: proveedor, local o remoto, consentimiento, retención;
  - D-04: umbrales;
  - completar la evaluación empírica de F2: cinco sesiones y veinte planos con referencias.
- Pascal solo aporta el patrón «el host aporta el modelo» y el formato de resultado. Sus tests usan un *mock*.
- Todo resultado entra como `source.method:"suggested"`, con revisión humana (W1).
- Estimación: L+. Confianza **muy baja**.

## 9. Estimaciones, dependencias y puertas de decisión

```
LAB v03 (ya autorizada) ─┐
                         ├─► A (revisión distribución) ─┬─► C (variantes)
B (captura 3D) ──────────┘                              └─► D1 (MCP lectura) ─► D2 (diff)
E / F / G: solo tras decisiones D-16 / seguridad / D-08+D-04+F2 empírica
```

| Fase | Talla | Rango (calendario con revisión) | Confianza | Depende de | Cambia el contrato |
| --- | --- | --- | --- | --- | --- |
| A | S–M | 1–1,5 sem | Media-alta | Aprobación + D-A1 | No |
| B | S | 0,5–1 sem | Alta | — | No |
| C | M | 1,5–2 sem | Media | A, D-C1 | No / opcional `extensions` |
| D1 | M | 1–1,5 sem | Media | A, D-D1 | No |
| D2 | M | 1,5–2 sem | Media-baja | D1 | No |
| E | L | 4–8 sem | Baja | D-16, D-01 | **Sí** |
| F | L | 3–6 sem | Baja | Revisión de seguridad | **Sí** |
| G | L+ | indeterminado | Muy baja | D-08, D-04, F2 empírica | Posible |

**Supuestos de estimación:**
- una persona con un asistente de código;
- los ciclos de revisión de Juanma, de 1–3 días por PR, están incluidos;
- no se incluye la medición en teléfono físico (pendiente general);
- no se repiten las suites completas en Windows.

## 10. Riesgos y funciones que no conviene integrar todavía

- **Migrar a Pascal o reescribir con React, Next o WebGPU:** descartado. Rompería la app estática, las garantías locales y el contrato en mm. El Roadmap 2 (§9) ya excluye reescribir Three.js.
- **Assets de Pascal** (GLB, texturas, HDRI, audio): sin licencia ni atribución en el repositorio. **No integrar.**
- **`geometry-script` (`new Function`):** el propio código lo califica de «deterrent, not the isolation boundary». Los tests del sandbox no existen. **No integrar.**
- **`generate_variants` tal cual:** mutaciones aleatorias sin validación geométrica, más un probable defecto en la mutación de puertas. Solo patrón.
- **Funciones de Pascal Next** (X-ray, corte interactivo, exploded del tejado, sistemas ocultos): **solo demo**.
- **Runtime ARKit/RoomPlan:** necesita productor externo y hardware. No es una app de escaneo.
- **MCP alojado y skills de publicación:** servicio de terceros con clave. Fuera de la política local (D-08).
- **Presentar holguras como normativa:** el informe debe decir «huella» y «orientativo», en línea con D-15 y el Roadmap 2 §7.
- **Riesgo de deriva documental:** el README y el CHANGELOG de Pascal contradicen su propio código: dicen 46 herramientas frente a 68 registradas, y «IndexedDB» frente a SQLite. Cualquier piedra se toma del **código**, nunca del README.

## 11. Fuentes exactas, rutas y commits

**Rubik**, `Juanmaes83/floorplan-3d` @ [`c4f2493`](https://github.com/Juanmaes83/floorplan-3d/tree/c4f2493195c05fe54ca22bc1b9fbaf7ea1681af3):
- Captura: [`index.html#L1662-L1679`](https://github.com/Juanmaes83/floorplan-3d/blob/c4f2493195c05fe54ca22bc1b9fbaf7ea1681af3/index.html#L1662-L1679), [`#L1863`](https://github.com/Juanmaes83/floorplan-3d/blob/c4f2493195c05fe54ca22bc1b9fbaf7ea1681af3/index.html#L1863), [`#L3027`](https://github.com/Juanmaes83/floorplan-3d/blob/c4f2493195c05fe54ca22bc1b9fbaf7ea1681af3/index.html#L3027), botón [`#L329`](https://github.com/Juanmaes83/floorplan-3d/blob/c4f2493195c05fe54ca22bc1b9fbaf7ea1681af3/index.html#L329).
- Test de PNG 2D: [`tests/browser.test.cjs#L55`](https://github.com/Juanmaes83/floorplan-3d/blob/c4f2493195c05fe54ca22bc1b9fbaf7ea1681af3/tests/browser.test.cjs#L55).
- W1–W4: [`js/tracing-core.js#L98-L122`](https://github.com/Juanmaes83/floorplan-3d/blob/c4f2493195c05fe54ca22bc1b9fbaf7ea1681af3/js/tracing-core.js#L98-L122); tests [`tests/tracing.test.cjs`](https://github.com/Juanmaes83/floorplan-3d/blob/c4f2493195c05fe54ca22bc1b9fbaf7ea1681af3/tests/tracing.test.cjs).
- Protección de dimensiones: [`js/room-layout.js#L32-L45`](https://github.com/Juanmaes83/floorplan-3d/blob/c4f2493195c05fe54ca22bc1b9fbaf7ea1681af3/js/room-layout.js#L32-L45).
- Duplicar proyecto: [`js/project-library.js#L25`](https://github.com/Juanmaes83/floorplan-3d/blob/c4f2493195c05fe54ca22bc1b9fbaf7ea1681af3/js/project-library.js#L25).
- Exportador offline: [`scripts/interop/export.cjs`](https://github.com/Juanmaes83/floorplan-3d/blob/c4f2493195c05fe54ca22bc1b9fbaf7ea1681af3/scripts/interop/export.cjs).
- Contrato: [`docs/contracts/FloorPlanProjectV1.md`](https://github.com/Juanmaes83/floorplan-3d/blob/c4f2493195c05fe54ca22bc1b9fbaf7ea1681af3/docs/contracts/FloorPlanProjectV1.md); roadmap: [`docs/ROADMAP.md`](https://github.com/Juanmaes83/floorplan-3d/blob/c4f2493195c05fe54ca22bc1b9fbaf7ea1681af3/docs/ROADMAP.md); decisiones: [`docs/product/F0-decisions.md`](https://github.com/Juanmaes83/floorplan-3d/blob/c4f2493195c05fe54ca22bc1b9fbaf7ea1681af3/docs/product/F0-decisions.md); [`docs/ROADMAP-2-proposal.md`](https://github.com/Juanmaes83/floorplan-3d/blob/c4f2493195c05fe54ca22bc1b9fbaf7ea1681af3/docs/ROADMAP-2-proposal.md).
- PR: [#23](https://github.com/Juanmaes83/floorplan-3d/pull/23) (squash `c4f2493`), [#24](https://github.com/Juanmaes83/floorplan-3d/pull/24), [#21 abierta](https://github.com/Juanmaes83/floorplan-3d/pull/21).

**Pascal**, `pascalorg/editor` @ [`67f8041`](https://github.com/pascalorg/editor/tree/67f8041034e8d3f84c7dfce8e524356fd764cf7a) (el fork de Juanma está en el mismo SHA):
- README, Pascal Next: [`README.md#L15-L31`](https://github.com/pascalorg/editor/blob/67f8041034e8d3f84c7dfce8e524356fd764cf7a/README.md#L15-L31).
- Colisiones: [`packages/mcp/src/tools/check-collisions.ts`](https://github.com/pascalorg/editor/blob/67f8041034e8d3f84c7dfce8e524356fd764cf7a/packages/mcp/src/tools/check-collisions.ts), [`packages/core/src/agent-operations/door-clearance.ts`](https://github.com/pascalorg/editor/blob/67f8041034e8d3f84c7dfce8e524356fd764cf7a/packages/core/src/agent-operations/door-clearance.ts), [`layout-clearance.ts`](https://github.com/pascalorg/editor/blob/67f8041034e8d3f84c7dfce8e524356fd764cf7a/packages/core/src/agent-operations/layout-clearance.ts), tests `check-collisions.test.ts`, `door-clearance.test.ts`, `layout-clearance.test.ts`.
- Variantes: [`packages/mcp/src/tools/variants/`](https://github.com/pascalorg/editor/tree/67f8041034e8d3f84c7dfce8e524356fd764cf7a/packages/mcp/src/tools/variants).
- Captura: [`packages/viewer/src/lib/snapshot-pipeline.ts`](https://github.com/pascalorg/editor/blob/67f8041034e8d3f84c7dfce8e524356fd764cf7a/packages/viewer/src/lib/snapshot-pipeline.ts), [`packages/editor/src/components/editor/snapshot-capture-overlay.tsx`](https://github.com/pascalorg/editor/blob/67f8041034e8d3f84c7dfce8e524356fd764cf7a/packages/editor/src/components/editor/snapshot-capture-overlay.tsx), [`thumbnail-generator.tsx`](https://github.com/pascalorg/editor/blob/67f8041034e8d3f84c7dfce8e524356fd764cf7a/packages/editor/src/components/editor/thumbnail-generator.tsx).
- MCP: [`packages/mcp/src/server.ts`](https://github.com/pascalorg/editor/blob/67f8041034e8d3f84c7dfce8e524356fd764cf7a/packages/mcp/src/server.ts), [`src/tools/annotations.ts`](https://github.com/pascalorg/editor/blob/67f8041034e8d3f84c7dfce8e524356fd764cf7a/packages/mcp/src/tools/annotations.ts), [`src/transports/http.ts`](https://github.com/pascalorg/editor/blob/67f8041034e8d3f84c7dfce8e524356fd764cf7a/packages/mcp/src/transports/http.ts), [`src/tools/export-glb.ts`](https://github.com/pascalorg/editor/blob/67f8041034e8d3f84c7dfce8e524356fd764cf7a/packages/mcp/src/tools/export-glb.ts), [`src/tools/vision/index.ts`](https://github.com/pascalorg/editor/blob/67f8041034e8d3f84c7dfce8e524356fd764cf7a/packages/mcp/src/tools/vision/index.ts).
- Objetos libres: [`packages/geometry-script/src/compile.ts`](https://github.com/pascalorg/editor/blob/67f8041034e8d3f84c7dfce8e524356fd764cf7a/packages/geometry-script/src/compile.ts); recetas: [`packages/core/src/procedural-items/`](https://github.com/pascalorg/editor/tree/67f8041034e8d3f84c7dfce8e524356fd764cf7a/packages/core/src/procedural-items).
- Captura de escaneo: [`packages/core/src/capture/schema.ts`](https://github.com/pascalorg/editor/blob/67f8041034e8d3f84c7dfce8e524356fd764cf7a/packages/core/src/capture/schema.ts), [`packages/viewer/src/capture/`](https://github.com/pascalorg/editor/tree/67f8041034e8d3f84c7dfce8e524356fd764cf7a/packages/viewer/src/capture).
- Estado del X-ray: [`packages/viewer/src/lib/display-state.ts`](https://github.com/pascalorg/editor/blob/67f8041034e8d3f84c7dfce8e524356fd764cf7a/packages/viewer/src/lib/display-state.ts).
- Licencias: [`LICENSE`](https://github.com/pascalorg/editor/blob/67f8041034e8d3f84c7dfce8e524356fd764cf7a/LICENSE), [`docs/media/next-demo/LICENSE.md`](https://github.com/pascalorg/editor/blob/67f8041034e8d3f84c7dfce8e524356fd764cf7a/docs/media/next-demo/LICENSE.md).

**Métodos de esta auditoría:**
- Clones de solo lectura en un directorio temporal.
- `git merge-base` entre el fork y el upstream.
- `rg`, `sed`.
- Dos lecturas delegadas del código de Pascal, con las afirmaciones críticas recomprobadas a mano: `check_collisions`, `itemPlanAabb`, la mutación de puertas, `new Function`, `export_glb`, el *sampling* de visión, el montaje de `CaptureRuntime`, los presets de captura y el estado del X-ray.
- En Rubik: `node --test` sobre `tracing`, `room-layout`, `project`, `library` e `interop`: 94 tests, 93 pasan, 1 se omite y 0 fallan.
- Prueba de captura 3D en Chromium headless con SwiftShader. Three 0.160.0 se obtuvo del registro npm a un directorio temporal, porque jsDelivr estaba bloqueado por el proxy del entorno.
- **No** se ejecutaron las suites de Pascal ni la suite completa de navegador de Rubik.

## 12. Decisiones pendientes para Juanma

| ID (propuesta) | Decisión | Opciones y consecuencias |
| --- | --- | --- |
| D-P0 | ¿Se admite esta propuesta como base de discusión y en qué orden respecto a LAB v03? | (a) Tras LAB v03: no altera lo autorizado. (b) En paralelo con B (riesgo bajo, otra PR). (c) Archivar. |
| D-A1 | Valores por defecto de holgura y profundidad de paso de puerta en la fase A | (a) Parámetros neutros (p. ej. 600 mm de paso), editables y etiquetados como «orientativo». (b) Sin valor por defecto: solo solapes. (c) Perfil normativo: **no recomendado** sin jurisdicción ni asesoría (Roadmap 2 §7, D-15). |
| D-C1 | Dónde vive el vínculo variante → original | (a) Solo en el nombre o en la biblioteca local: sin contrato, se pierde al exportar. (b) `extensions['x-variant-of']`: viaja en el JSON, experimental. (c) Campo formal en un minor 1.5.0: requiere revisión de contrato. |
| D-D1 | Dependencias del MCP local | (a) `@modelcontextprotocol/sdk` en `tools/mcp/` aislado. (b) JSON-RPC stdio propio, sin dependencias. (c) Solo CLI, sin MCP. |
| D-B1 | Resolución máxima de la captura en móvil | (a) Limitar a 2048 px. (b) Hasta `MAX_TEXTURE_SIZE`, con riesgo de memoria. (c) Medir primero en un teléfono físico (pendiente D-10). |
| D-01 / D-16 | Segmento y multiplanta (abiertas en F0) | Condicionan E. No se resuelven aquí. |
| D-08 / D-04 | Procesamiento remoto y umbrales de precisión | Condicionan G. No se resuelven aquí. F2 sigue experimental. |
| D-V | Aportar los dos vídeos de referencia | Sin ellos, la columna «Vídeo» queda «no comprobado» y no se puede contrastar el objetivo visual. |
