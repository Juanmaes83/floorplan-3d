# SCULPT · openPlan3D y roomGPT: oportunidades reconciliadas con v1.12

**Fecha:** 18/11/2026. **Método:** `sculpt-metodologia-y-cartera-2026-11-10.md`.
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
| Exportación DXF | `cadExport`, `canvasSymbolDxf`, `exportText`, `dxf-writer` | **G-02** (ND, P6) | Lee DXF y no lo escribe | **Cierra un pendiente** | **Codex**, tras consolidar #259. Traspaso en `labs/sculpt/TRASPASO-G02-DXF-CODEX.md` |
| Persistencia IndexedDB, copia y recuperación | `storagePersistence`, `localDatabase`, `libraryRestore`, `saveStatus`, `versionHistory`, `snapshotStorage` | F0 (ADR de persistencia) | F0.1 (#262) y F0.2a (#263) hechos | **Amplía F0.3**: `persist()`, aviso de copia, estado y recuperación | **Claude Code**, línea F0 |
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
| MCP y agentes | `agentBridge`, `routes/mcp`, `skills` | MCP Etapa 2 (#254) | Codex en curso | **Ya cubierto** en otra línea | **Codex**, solo contraste |
| roomGPT · reforma fotográfica | `app/generate/route.ts` (Replicate) | FOT-01 (SI) | `api/photo-reform.js` cerrado; #258 lo conecta con control de gasto | **REMOVE** del backend antiguo: controles inferiores | Nada que recuperar |
| roomGPT · estilos y estancias | `utils/dropdownTypes.ts` | IMG-08, IMG-11 | 4 estilos y 6 recetas | Ampliación menor de listas | Decisión de producto (IMG-08) |
| roomGPT · comparación | `CompareSlider` (react-compare-slider) | IMG-12 | La cortina de `comparar/` (E2) ya existe | **REPLACE** por la de E2 | Nada que recuperar |
| roomGPT · límites de uso, subida | Upstash, Bytescale | IMG-04, GOV-06a | Libro común de #258 e intake local | **REPLACE** | Nada que recuperar |

## Secuencia de cortes (propuesta)

1. **G-02 · DXF (Codex).** Primer corte aprobado. Fuente, baseline y clasificación ya están hechos.
2. **F0.3 · `persist()` y aviso de copia (Claude Code).** Se esculpe `storagePersistence` del donante sobre la autoridad de F0.2a, sin conectarla al editor antes de F0.2b.
3. **F0.3 · Estado de guardado y recuperación (Claude Code).** Se contrasta `saveStatus`, `libraryRestore` y `versionHistory` con el diario de recuperación de F0.2a. Se toma solo lo que falte.
4. **Pendientes de decisión de producto:**
   - unión de escaneos RoomPlan;
   - GLB propios (CAT-03);
   - selección múltiple;
   - plantillas;
   - escaleras;
   - muros curvos.
5. **Pendientes de acordar con Codex:** renderizado bajo demanda, render local y ambientación.

## Reglas que se mantienen

- No se crea un segundo editor, modelo, motor 3D, catálogo, persistencia ni asistente.
- No se copia ningún recurso (modelos, texturas, imágenes) sin licencia acreditada recurso a recurso.
- La copia fiel no se modifica. Cada adaptación vive en su propia ruta y en su propia PR draft.
