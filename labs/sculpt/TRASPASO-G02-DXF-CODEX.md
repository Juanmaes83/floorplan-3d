# Traspaso a Codex · G-02 «Exportación DXF profesional» (SCULPT, primer corte de openPlan3D)

**Decisión del propietario (18/11/2026):** G-02 se aprueba como primer corte SCULPT de openPlan3D. Lo ejecuta **Codex después de consolidar #259**. Claude Code ha hecho SOURCE EXACT, BASELINE y la clasificación inicial, y no ha empezado el desarrollo.

## Hecho (no repetir)

| Fase | Resultado | Dónde |
|---|---|---|
| SOURCE EXACT | Copia fiel `openPlan3D@771c9e1ad30bd1c3cc7584d6eca74deb2e14943d`, MIT, 84 archivos con SHA-256 | `labs/sculpt/openplan3d-771c9e1/` (`PROCEDENCIA.md`, `MANIFEST.sha256`) |
| BASELINE | 5 suites de exportación del donante: **69/69** | Comandos en `PROCEDENCIA.md` |
| Situación en RUBIK | Lee DXF (`js/plan-intake.js`), no lo escribe. Matriz v1.12: G-02 en estado **ND**, programa P6 | `docs/product/MATRIZ-TRAZABILIDAD-v1.12.md` (#261) |

## Cierre de dependencias y clasificación

El cierre de importaciones de `src/lib/utils/cadExport.ts` tiene **63 archivos**, listados en `MANIFEST.sha256` bajo `src/`. Casi todo es el editor del donante: modelo `Project`, stores de Svelte, catálogo, detección de estancias y contornos de muro. RUBIK ya tiene sus propias autoridades para todo eso.

| Pieza | Decisión | Motivo |
|---|---|---|
| `utils/canvasSymbolDxf.ts` (49 líneas) | **KEEP** | Contexto 2D falso que convierte un dibujo de canvas en DXF exacto: líneas y splines con curvas reales, sin duplicados. Permite reutilizar el dibujo de símbolos que RUBIK ya hace en canvas. Solo depende de `dxf-writer`. |
| `dxf-writer` 1.18.4 (MIT) | **KEEP** | Escritor DXF probado. `drawSpline` existe aunque no esté en sus tipos. |
| `utils/exportText.ts` (`cadText`) | **KEEP** | Texto apto para DXF. |
| Capas de `cadExport.ts`: WALLS, DOORS, DOORS_HIDDEN (discontinua), WINDOWS, FURNITURE, DIMENSIONS, ROOMS, MEASUREMENTS, STAIRS, COLUMNS, ENTOURAGE | **GENERALISE** | Convención CAD útil. Se conserva nombre, color y tipo de línea. |
| `utils/doorSymbol.ts`, `furnitureDxf.ts`, `entourageDxf.ts` | **GENERALISE** | Patrón de símbolo a capa. El símbolo debe salir del dibujo de RUBIK, no del catálogo del donante. |
| `cadExport.ts` (orquestación), `roomDetection`, `planWallOutline`, `planOpening`, `dimensionPlanGeometry`, `stairPlanGeometry`, `columnPlanGeometry` | **REPLACE** | La geometría sale del modelo canónico de RUBIK (muros, huecos, estancias, cotas) y de sus autoridades de planta. |
| stores Svelte, i18n, catálogo, entourage, GLB, `projectPackageZip` | **REMOVE** | Específicos del donante o duplicados de RUBIK. |
| `exportDWG` | **REMOVE** | Escribe DXF con otro nombre; no es DWG real. |

## Criterios de aceptación propuestos

1. **Unidades y orientación.** DXF en milímetros (`$INSUNITS=4`), coordenadas del modelo e Y invertida como hace el donante. Sin escala estimada presentada como real: si la escala del proyecto es estimada, se rotula.
2. **Fuente de la geometría.** Muros (contorno) desde la autoridad canónica de RUBIK; huecos con su símbolo; estancias con nombre y superficie de la misma métrica que la ficha de superficies.
3. **Ida y vuelta.** `js/plan-intake.js` importa el DXF exportado y reproduce muros y estancias dentro de una tolerancia fijada.
4. **Pruebas.** Se adaptan los casos del donante que aplican (símbolo de puerta, splines, visibilidad, sin duplicados) y se añaden pruebas propias sobre el proyecto de referencia de RUBIK.
5. **Alcance.** Sin tocar el 3D, la persistencia ni el MCP. Acción de exportar desde la lámina o desde Entregar.

## Límites conocidos

- El donante usa centímetros (`setUnits('Centimeters')`). RUBIK usa milímetros: se decide en la adaptación.
- `canvasSymbolDxf` necesita que el dibujo de RUBIK reciba el contexto por parámetro. Si alguna función dibuja sobre un `ctx` global, primero hay que ajustarla.
