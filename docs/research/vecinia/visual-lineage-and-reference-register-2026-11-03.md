# VECINIA → RUBIK — Evolución visual y referencias

**Fecha:** 2026-11-03  
**Estado:** `DISCOVERY_ONLY / NO_PRODUCT_CHANGE / MERGE_NOT_AUTHORIZED`  
**Rubik base:** `master@0f9c6ead9732901681498efec326d1ca92e42ffe`  
**Fuentes:** `Juanmaes83/VECINIA-WORLDS` y `Juanmaes83/WORLD-COSTA-BLANCA` (repositorios privados).  
**Destino del registro:** `Juanmaes83/floorplan-3d` (repositorio público). No copiar capturas privadas a este repositorio sin comprobación y decisión de publicación.

## 1. Decisión técnica

Aprovechar la exactitud arquitectónica, geométrica y material de Rubik y la riqueza visual, de familias semánticas y de contexto de VECINIA. Las capas ilustrativas pueden mejorar la presentación pero **no sustituyen los datos verificables de un inmueble** cuando se muestran como hechos. Mantener el `FloorPlanProjectV1` y la autoridad Rubik; no trasplantar WorldStore, CameraAuthority, Walker, otro renderer ni lógica de locomoción.

## 2. Evolución visual rastreada por ramas y QA

Las referencias siguientes son las puntas verificadas de ramas de VECINIA. Se ha comprobado que entorno→Skin→tres casas→GLSL→mundo vivo→expansión costera son mejoras en ramas descendientes; algunos intervalos incluyen commits intermedios y no se atribuyen íntegramente a un solo commit.

| Etapa | Rama (SHA) | Aportación y evidencia QA |
|---|---|---|
| Slice H1 | `codex/world-slice-h1-plan-v1@6bf3c6a646210dd1fa28c8213b3fbe17908257f6` | Contrato semántico y segmentos; `docs/world/WSP_H1_WATERFRONT_FISHER_SQUARE_MISSION.md` |
| Eje costa-Sierra | `codex/world-slice-kimi-axis-v1@9a78e1f250ef36f677de5c20021dcf2458ce00f6` | Territorio, rutas y villas; `visual/qa/world-slice-kimi-axis/after/` |
| Entorno costero | `codex/coastal-environment-pass-v1@2ee262f5142675bdcd7a02b9bc9693ae3f714ca3` | Costa, terreno y atmósfera; `visual/qa/coastal-environment-pass/after/` |
| Skin residencial | `codex/house-skin-propagation-v1@78f7bdc7149a8a4acdd984eb4964687d9230ceed` | Material y diversidad de viviendas; `visual/qa/house-skin-propagation/before/` y `after/` |
| Tres casas | `codex/three-house-quality-proof-v1@f3043238cbefd8ce9e121c8a33d974404897396e` | Sierra, Old Town y Marina: carpinterías, Fenestra, ventanas; `visual/qa/three-house-quality-proof/` |
| Profundidad GLSL | `codex/glsl-visual-depth-pass-v1@9a4395d495f85125a0022d78a452fc2f75be28b9` | Fachadas, costa y agua; `visual/qa/glsl-visual-depth-pass/before/`, `after/`, `detail/` |
| Mundo vivo | `codex/world-alive-urban-life-v1@c56bc41ffb52168374a63aab4d1c51e9fa598a55` | Terrazas, movilidad, fachadas y ambientes día/noche; `visual/qa/world-alive-pass/after/` |
| Expansión costera | `codex/coastal-leisure-expansion-v1@6d317f2a14734457fb910f9bc1af16d250746ed8` | Barcos, coches, gaviotas, delfines, faros, playa, puerto; `visual/qa/coastal-leisure-expansion/before/` y `after/` |
| Release visual S5 | `release/vecinia-full-world-s5-visual-default-2026-11@e1e18ab62c8a6b19d666e0fc0b887f9ca8f7a2ae` | Selección visual y rollback documentados; `docs/12-DECISION-REGISTER.md` |

**Fuente para comparar SHA:** `https://github.com/Juanmaes83/VECINIA-WORLDS/compare/<base>...<head>` (sustituir por los SHA de arriba).

## 3. Escritura semántica útil para Rubik

- VECINIA separa `BRAIN` (identidad) → `SKELETON` (física) → `WORLD CONTENT` (ambientación) → `SKIN` (apariencia), sin ceder autoridad del estado del mundo a elementos visuales.
- Resolución visual por capas: `WORLD → DISTRICT → STREET → ENTITY → SHOT`; prevalece el nivel más específico. Código: `visual/src/tokens/catalog.js`, `visual/src/tokens/resolver.js`.
- Familias P0 construidas: `oldtown-house`, `sea-villa`, `family-villa`, `hillside-apartment`, `townhouse`. La taxonomía más amplia del repositorio WORLD-COSTA-BLANCA es propuesta semántica, no todos son builders terminados.
- Contenido ilustrativo verificado: piscinas, pérgolas, contraventanas, balcones, vegetación, coches, ferry, veleros, yates, motos acuáticas, gaviotas, delfines, agua y vida urbana. Muchos objetos son de bajo poligonaje y deben evaluarse por distancia y dispositivo.
- Integración potencial por **adaptador de presentación opcional** sobre `FloorPlanExterior`, `TerritoryRenderer`, `Presentation`, sin crear una fuente de datos constructivos alternativa.

## 4. Tres imágenes recién compartidas por Juanma — registro de entrada

Las tres imágenes fueron enviadas inline en la conversación el 2026-11-03, por este orden. No se expusieron como archivos descargables en el runtime de esta sesión y **NO se ha importado su binario** ni verificado su contenido exacto frente a los QA de VECINIA. Los identificadores son registros provisionales, no archivos existentes:

| ID | Orden | Estado |
|---|---|---|
| `USER-VIS-20261103-01` | Primera imagen | `REFERENCE_REGISTERED / ORIGINAL_FILE_PENDING` |
| `USER-VIS-20261103-02` | Segunda imagen | `REFERENCE_REGISTERED / ORIGINAL_FILE_PENDING` |
| `USER-VIS-20261103-03` | Tercera imagen | `REFERENCE_REGISTERED / ORIGINAL_FILE_PENDING` |

**Pendiente:** recibir los tres originales como PNG/JPG descargables, inspeccionar imagen y procedencia, calcular SHA-256, documentar dimensiones, registrar los hallazgos visuales y decidir destino privado/público. No sustituir los originales por capturas diferentes ni por imágenes generadas.

### Referencias técnicas de VECINIA ya verificadas (NO se presumen idénticas a las tres imágenes enviadas)

- [Sierra — ventanas](https://github.com/Juanmaes83/VECINIA-WORLDS/blob/f3043238cbefd8ce9e121c8a33d974404897396e/visual/qa/three-house-quality-proof/after-window/sierra.png)
- [Old Town — ventanas](https://github.com/Juanmaes83/VECINIA-WORLDS/blob/f3043238cbefd8ce9e121c8a33d974404897396e/visual/qa/three-house-quality-proof/after-window/oldtown.png)
- [Marina — ventanas](https://github.com/Juanmaes83/VECINIA-WORLDS/blob/f3043238cbefd8ce9e121c8a33d974404897396e/visual/qa/three-house-quality-proof/after-window/marina.png)
- [Detalles GLSL](https://github.com/Juanmaes83/VECINIA-WORLDS/tree/9a4395d495f85125a0022d78a452fc2f75be28b9/visual/qa/glsl-visual-depth-pass/detail)
- [Expansión costera](https://github.com/Juanmaes83/VECINIA-WORLDS/tree/6d317f2a14734457fb910f9bc1af16d250746ed8/visual/qa/coastal-leisure-expansion/after)

## 5. Cómo evaluar potenciales incrementos Rubik

Comparar cada mecanismo aislado en A/B con cámara, inmueble, geometría y luz constantes cuando se evalúa material, y con capa de contexto controlada cuando se evalúa ambientación. Medir salto perceptivo humano (no sólo pixel-diff), coherencia exterior/interior, draw calls, p95, memoria y cleanup. Clasificar cada elemento como `FACTUAL_PROJECT`, `DERIVED_PROJECT` o `VISUAL_ONLY` únicamente **en el contrato del experimento**; no añadir nuevas claves al schema canónico sin aprobación.

El experimento futuro puede combinar familias, ventanas Fenestra para edificios de contexto, vegetación, agua y vida ambiental; no debe sustituir las ventanas ni las habitaciones reales de Rubik con información visual contradictoria. Three-Fenestra usa shaders basados en `onBeforeCompile`, fuera del CP2 de VQ-01 sin contract delta.

**No tocar**: VQ-01/CP2, Hybrid, master product, Three.js, la autoridad de cámara ni la geometría real. Esto es investigación y registro, **sin autorización de implementación ni merge**.