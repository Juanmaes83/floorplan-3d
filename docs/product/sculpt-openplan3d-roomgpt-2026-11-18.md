# SCULPT · openPlan3D y roomGPT: oportunidades reconciliadas con v1.12

**Fecha:** 18/11/2026. **Método:** [cartera canónica SCULPT](sculpt-metodologia-y-cartera-2026-11-10.md). **Prioridad de producto:** [Plan maestro v1.12](PLAN-MAESTRO-RUBIK-SOTA-v1.12.md) y su [matriz de trazabilidad](MATRIZ-TRAZABILIDAD-v1.12.md).
**Fuente exacta:** rama `sculpt/openplan3d-fuente`, carpeta `labs/sculpt/openplan3d-771c9e1/`. Es una copia fiel con `MANIFEST.sha256` y `PROCEDENCIA.md`.

## Donantes verificados

| Donante | Commit | Licencia | Pila | Observación |
|---|---|---|---|---|
| openPlan3D | `771c9e1ad30bd1c3cc7584d6eca74deb2e14943d` (14/11/2026) | MIT (theLodgeStudio) | SvelteKit + TypeScript + Firebase | Módulos reales y probados para casi todas las familias |
| roomGPT | `611398c78da64f1794df2d99018c3d02d3ab0048` (20/09/2023) | MIT (Hassan El Mghari) | Next.js 13 + Replicate + Upstash | Prototipo pequeño, con 4 archivos de lógica |

## Baseline ejecutado

Copia aislada del donante, `npm ci` y `svelte-kit sync`.

| Familia | Suites | Resultado |
|---|---|---|
| Exportación DXF | 5 | **69/69** |
| Persistencia | 5 | **132/132** |

El resto de familias **no se ha ejecutado**. Su capacidad no se da por verificada, aunque aparezca en el README del donante.

## Reconciliación con los 98 IDs y los programas de v1.12

| Familia del donante | Módulos del donante | ID v1.12 | Situación en RUBIK | Clase | Siguiente paso y responsable |
|---|---|---|---|---|---|
| Exportación DXF | `cadExport`, `canvasSymbolDxf`, `exportText`, `dxf-writer` | **G-02** (P6) | Importación en master y primer corte de exportación en #265 | **Cierra un pendiente** tras validación e integración | **Codex**. Traspaso en `labs/sculpt/TRASPASO-G02-DXF-CODEX.md` |
| Persistencia IndexedDB, copia y recuperación | `storagePersistence`, `localDatabase`, `libraryRestore`, `saveStatus`, `versionHistory`, `snapshotStorage` | F0 (ADR de persistencia) | #262 → #263 → #264 en revisión. Permiso unificado en #264 | **Amplía F0.3** con permiso y aviso de copia; estado y recuperación requieren su validación | Línea F0 |
| Renderizado bajo demanda | `drawScheduler`, `sceneSignature` | — | Bucle 3D continuo (`index.html`, `startLoop`/`loop`) | Amplía el rendimiento | Motor 3D: **acordar con Codex** (#255) |
| Unión de escaneos RoomPlan | `roomplanMerge`, `scanAlignment`, `roomplanValidation` | — (G-08 cubre la alineación de planos nativos) | Importa un escaneo (`js/plan-intake.js`) | **Amplía** la importación | Decisión de producto. Corte pequeño sobre `plan-intake` |
| GLB propios | `localGLB*`, `customModel*` | CAT-03 (PA) | Piloto con dos GLB propios | **Amplía CAT-03** | Decisión de producto. Se valida con la autoridad del catálogo |
| Biblioteca de recursos autorizados | `furnitureCatalog`, `entourageCatalog`, `MODEL_SOURCES.md` | CAT-02, IMG-13 | El catálogo exige licencia y prueba de permiso | **Revisar licencias** recurso a recurso | No copiar recursos sin licencia acreditada |
| Selección múltiple, alineación y transformación | `marqueeSelection`, `alignment`, `multiSelectionBounds`, `selectionRotation`, `duplicateSelection` | — | Sin selección múltiple | **Nueva** | Decisión de producto. Toca el editor |
| Muros curvos e inclinados | `slopedWallGeometry`, `splitWallGeometry`, `wallProfiles` | — | Sin muros curvos | **Nueva** | Decisión de producto. Cambia el modelo canónico, así que es la de más riesgo |
| Escaleras avanzadas y edificios | `stair*`, `floorStack`, `moveToFloor` | Edificio y plantas existentes | Plantas y escaleras básicas | **Amplía** | Decisión de producto |
| Plantillas paramétricas | `houseTemplates`, `roomTemplates`, `roomPresets` | — | Sin plantillas | **Nueva** | Decisión de producto |
| Render local de alta calidad | `three-gpu-pathtracer` 0.0.24 y `renderLab` | IMG-03, IMG-07 (relacionados) | Render IA remoto; 3D en tiempo real | **Amplía**, alternativa local sin gasto | **Codex** (motor 3D). Requiere GO |
| Ambientación arquitectónica | `entourage*` | LUZ-01, PER-01 (relacionados) | Sin entourage | **Amplía** | Revisar licencias de recursos |
| MCP y agentes | `agentBridge`, `routes/mcp`, `skills` | MCP Etapa 2 (#254) | Integrada por #259 en alcance de solo lectura | **Equivalencia parcial** para el alcance de Etapa 2 | Contrastar las capacidades adicionales con las herramientas vigentes |
| roomGPT · reforma fotográfica | `app/generate/route.ts` (Replicate) | FOT-01 (SI) | `api/photo-reform.js` cerrado; #258 lo conecta con control de gasto | **REMOVE** del backend antiguo: controles inferiores | Nada que recuperar |
| roomGPT · estilos y estancias | `utils/dropdownTypes.ts` | IMG-08, IMG-11 | 4 estilos y 6 recetas | Ampliación menor de listas | Decisión de producto (IMG-08) |
| roomGPT · comparación | `CompareSlider` (react-compare-slider) | IMG-12 | La cortina de `comparar/` (E2) ya existe | **REPLACE** por la de E2 | Nada que recuperar |
| roomGPT · límites de uso, subida | Upstash, Bytescale | IMG-04, GOV-06a | Libro común de #258 e intake local | **REPLACE** | Nada que recuperar |

## Cartera de openPlan3D y roomGPT

Este registro reproduce las denominaciones, donantes y prioridades originales confirmadas por el propietario. Las 14 piedras se suman a R01, R02 y R03 en la cartera canónica. El plan maestro v1.12 rige las olas, el trabajo residual y las autorizaciones de cada corte.

| Piedra | Denominación original | Donante | Prioridad original |
|---|---|---|---|
| OP-01 | Persistencia, recuperación y versiones | OpenPlan3D | Muy alta |
| OP-02 | Renderizado eficiente y rendimiento | OpenPlan3D | Muy alta |
| OP-03 | Exportación CAD/DXF | OpenPlan3D | Alta |
| OP-04 | Importación y unión de escaneos | OpenPlan3D | Alta |
| OP-05 | Modelos GLB propios y biblioteca | OpenPlan3D | Alta |
| OP-06 | Edición múltiple y herramientas geométricas | OpenPlan3D | Alta |
| OP-07 | Muros curvos e inclinados | OpenPlan3D | Alta |
| OP-08 | Escaleras y edificios avanzados | OpenPlan3D | Alta |
| OP-09 | Plantillas arquitectónicas paramétricas | OpenPlan3D | Alta |
| OP-10 | Render fotorrealista local | OpenPlan3D | Estratégica |
| OP-11 | Ambientación arquitectónica | OpenPlan3D | Media |
| OP-12 | Puente MCP interactivo | OpenPlan3D | Estratégica |
| RG-01 | Experiencia de reforma fotográfica | RoomGPT | Alta |
| RG-02 | Generación visual y estilos | RoomGPT | Alta |

### Subfamilias conservadas

| Piedra | Subfamilias conservadas | Contraste con RUBIK |
|---|---|---|
| OP-01 | IndexedDB, permiso persistente, avisos, estado de guardado, copias, restauración, historial e instantáneas | Contrastar cada bloque con F0 y su diario para conservar una sola autoridad de guardado |
| OP-02 | Render bajo demanda, planificador de dibujado, firma de escena y rendimiento | Comparar el coste del bucle, latencia y fluidez con escenas equivalentes en el motor vigente |
| OP-03 | Exportación DXF, capas CAD, símbolos, contornos, superficies y cotas | G-02 y el importador existente. Validar dimensiones, orientación, unidades y escala declarada |
| OP-04 | Importación y fusión RoomPlan, alineación y validación de escaneos | RUBIK importa un escaneo. Acreditar el delta de unión y conservar el rótulo de escala estimada cuando corresponda |
| OP-05 | Bibliotecas 3D, biblioteca de recursos autorizados, modelos GLB propios y mobiliario | Contrastar F3, Asset Lab, CAT-02/CAT-03 e IMG-13. Acreditar procedencia y licencia por recurso |
| OP-06 | Selección, alineación y transformación múltiple, límites de selección, rotación y duplicación | Comparar con la edición vigente y verificar historial, geometría y reversión |
| OP-07 | Muros curvos e inclinados, división y perfiles | Acreditar el delta sobre la geometría canónica y validar los consumidores antes de ampliar el contrato |
| OP-08 | Escaleras avanzadas, apilado y gestión de plantas, traslado entre plantas | Verificar qué cubren ya los edificios y escaleras de RUBIK |
| OP-09 | Plantillas de vivienda, plantillas de estancia y presets paramétricos | Comparar con Arranque y creación de estancias. Validar medidas y edición posterior |
| OP-10 | Render local fotorrealista, trazado de rayos y laboratorio de render | Comparar calidad, tiempo, equipo y coste con el 3D en tiempo real y el Render IA remoto. Requiere validación propia |
| OP-11 | Vegetación interior y exterior, personas y figuras, entourage y ambientación arquitectónica | Inventariar y licenciar cada recurso. Distinguir usos y límites frente a F3, BIB-01, LUZ-01 y PER-01 |
| OP-12 | Puente MCP, agentes y asistentes, herramientas, habilidades y propuestas | Contrastar con MCP Etapa 2 y la autoridad de propuestas. Validar el alcance adicional y la confirmación humana |
| RG-01 | Recorrido de reforma sobre fotografía, carga, comparación y límites de uso | Evaluar FOT-01, E2 y los controles de RUBIK con el mismo recorrido. Conservar solo el delta de experiencia acreditado |
| RG-02 | Generación visual, estilos, recetas y tipos de estancia | Contrastar con IMG-08, IMG-11 y el generador de RUBIK. Aislar estilos o recetas que aporten valor y validar su alcance |

### Cortes en ejecución

- **G-02 · DXF.** [#265](https://github.com/Juanmaes83/floorplan-3d/pull/265) contiene el primer corte en borrador.
- **F0.3 · Permiso de almacenamiento.** [#264](https://github.com/Juanmaes83/floorplan-3d/pull/264) consolida el permiso en una sola autoridad. El estado de guardado, recuperación e historial siguen la validación del ADR.
- **OP-07 · Muros curvos e inclinados.** [#267](https://github.com/Juanmaes83/floorplan-3d/pull/267) es solo laboratorio, en `labs/sculpt/op-07/`, sin tocar producción. Baseline del donante: 10 suites, 68/68. Paridad del núcleo en mm con el donante y con `quantity-core`/`project-core` en muros rectos: 19/19 en local. Propone dos campos opcionales (`curve.control`, `heightEndMm`) y un plan de cirugía S1–S6, a la espera de F0.2b y de las decisiones D-OP07-1/2/3.

Cada piedra sigue los gates de SCULPT según corresponda. Fijar fuente exacta, SHA, licencias y manifiesto; aislar el bloque y medir su baseline; clasificar, esculpir y pulir; integrar mediante cirugía sobre los contratos existentes; ejecutar pruebas dirigidas y regresiones; acreditar Preview y revisión humana antes de solicitar integración. Una equivalencia se acredita con la misma entrada y resultados esperados en donante y RUBIK, sus límites y evidencia enlazada. El corte recupera únicamente el valor incremental demostrado.

## Reglas que se mantienen

- No se crea un segundo editor, modelo, motor 3D, catálogo, persistencia ni asistente.
- No se copia ningún recurso (modelos, texturas, imágenes) sin licencia acreditada recurso a recurso.
- La copia fiel no se modifica. Cada adaptación vive en su propia ruta y en su propia PR draft.
