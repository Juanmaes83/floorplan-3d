# MISIÓN PARA KIMI CODE — F03 Facade Fidelity · biblioteca verificada

**Proyecto:** RUBIK SOTA, `Juanmaes83/floorplan-3d`. **Referencia de documentación:** `docs/f03-facade-fidelity-v1` en la rama `docs/f03-facade-visual-references-v1`. **Baseline técnico de ventanas:** PR #167 @ `fe876c1c2016beafba48f1993b5c23ecb82f6814`, sin fusionar. **Estado:** contrato de trabajo; no se autoriza merge ni deploy.

## Tu objetivo
Transformar la biblioteca de referencias y materiales PBR publicada en GitHub en **una mejora visible de la fachada completa**, preservando la vivienda real y las ventanas F02 aprobadas para el alcance visual. No cambies ventanas, vidrio, perfilería, alféizares, huecos, medidas, IDs ni contrato F02. Tampoco inventes datos de proyecto.

## Lecturas obligatorias, por orden
1. `docs/qa/f03-facade-fidelity-v1/reference-index.md` y `reference-manifest.json`.
2. `material-token-map.md`: `MATERIAL.WALL` es por ahora vocabulario **propuesto**, NO API existente. Conserva `wall.surfaceMaterialId`, `material.appearance.preset`, `assets/materials/catalog.json` y el esquema vigente.
3. `pbr-audit-and-conversion.md` y CSV fuente; `visual-coverage-and-gaps.md`.
4. `docs/qa/hero-fidelity-v2/progress.md`, `visual-acceptance.md` y evidencia F02, más PR #167.
5. `js/visual-families-core.mjs`, `js/visual-families-adapter.mjs`, `js/surface-catalog.js`, `js/surface-renderer.mjs`, `js/exterior-core.js`, `tests/visual-families-harness.cjs` y tests de regresión F02.

## Roles, autoridad y límites
- Este PR documental **no** te autoriza a fusionar, desplegar o reabrir F02.
- Primero comprueba rama/worktree/`git status`/HEAD/PRs abiertos y evita modificar el worktree de documentación o ramas de otros agentes. Trabaja en rama de implementación **separada desde el baseline autorizado**, no directamente sobre docs F03 ni master sin inspeccionar diferencias y dependencias.
- F03 debe ser `VISUAL_ONLY`, con fallback, explícitamente activable para QA y con recursos derivados desechables. Nunca persistir sustituciones de materiales en `FloorPlanProjectV1`.
- No confundir 12 PNG conceptuales **sin clasificación visual certificada**, 13 albedos de materiales y 9 mapas fuente. No declarar 36 escenas terminadas. La licencia CC0 informada aplica a los ZIP de Poly Haven, no automáticamente a PNG conceptuales.
- Evitar importar el ZIP `.blend` a producción y no añadir EXR originales al bundle. No agregar presets al catálogo existente de 50 por atajo.

## Programa de ejecución acotado
**F03-0 · Auditoría y clasificación (docs):** comprobar rutas/hash/tamaño, abrir y clasificar realmente los 12 PNG, anotar el catálogo-mosaico si procede, formalizar la matriz 36 escenas vs. evidencias. Los 4 JPG locales no están en GitHub: no inventar accesibilidad. Conservar evidencia de qué referencias se usan y cuáles no.

**F03-1 · Preparación PBR offline:** tomar los paquetes `white_stucco`, `white_rough_plaster` y `rough_plaster_03` completos (albedo + normal OpenGL + roughness + displacement); convertir EXR con datos lineales a LDR optimizados, generar WebP reproducible y estudiar KTX2 solo como optimización opcional. Revisar escala, normal Y, roughness en canal G, sRGB vs. NoColorSpace, hash y procedencia. Desplazamiento OFF salvo geometría apta y gate visual. Emitir manifiesto de derivados y informe de tamaños.

**F03-2 · Prototipo reversible:** diseñar una receta nueva y pequeña de fachada, sin tocar `F02/window-assembly@2`. Consumir solo muros derivados como fachada válida por `FloorPlanExterior.derive(project)` y material compatible realmente asignado. Si el usuario seleccionó otro material, no aplicar textura incompatible: fallback. Empieza por fachada mineral clara, con variantes sólo si aportan resultado comprobable. Mantén coste de carga y GPU controlado.

**F03-3 · Prueba visual real:** reproducir el mismo proyecto, cámaras, luz, resolución y materiales. Comparar `F02 OFF`, `F02 ON sin F03` y `F02 ON + F03`; vistas D1/M1/M2/M3/G1 **y nueva vista de fachada completa**, móvil emulado 390×844 y, si se dispone, móvil físico. Demuestra mejora de escala, grano, sombras de contacto, continuidad de paños, jambas y relación con cubierta sin cambiar carpinterías F02.

**F03-4 · Gates y entrega:** ejecutar tests existentes `tests/visual-families.test.cjs` y los tests `hero-fidelity-v2*.browser.test.cjs` pertinentes, más nuevos tests dirigidos de F03, fixtures estables, 3 ciclos ON/OFF, cleanup, reentrada, pérdida de contexto, verificación de Project/geometry hashes, performance p50/p95 de intervalos y, si es posible, GPU real. CI, evidencias y PR **draft**, no merge ni deploy.

## Entregables exigidos
1. Tabla de rutas exactas, selección de referencias y exclusiones justificadas, **sin contar albedos como escenas**.
2. Manifiesto PBR de derivados (hash, dimensiones, bytes, conversor/versión, canales, colorSpace, escala, fuente) con fallback.
3. Informe de decisiones entre `surfaceMaterialId` existentes y etiquetas semánticas propuestas, sin overwrite automático.
4. Capturas antes/después, una composición comparativa de **fachada completa**, detalles, planos oblicuos y móvil, mismo encuadre.
5. Matriz de no regresión F02: 12/12 ventanas compatibles intactas (si es el mismo fixture), recursos y hashes estables; sin mutación de proyecto; QA de todas las fachadas compatibles.
6. Informe de rendimiento (cargas, draw calls, triángulos, número y bytes texturas, estimación GPU, p50/p95; marcar navegador emulado vs. físico).
7. PR en borrador con SHA, rama, descripción y enlaces a evidencias, más riesgos, bloqueos y decisión `VISUAL_PENDING_HUMAN` hasta aprobación real.

## Criterios que impiden afirmar terminado
- Una colección de imágenes o materiales publicada no equivale a una mejora renderizada.
- Solo tres de los trece materiales disponen de cuatro canales fuente **en GitHub**, no están optimizados ni integrados.
- Una prueba con una ventana no acredita fachada completa; una fachada bonita con huecos inventados tampoco.
- Sin comparación visiblemente mejor y firma humana, resultado = `CANDIDATE_NOT_APPROVED`.
- Sin tests de memoria, lifecycle y proyectos, no hay pase a rama principal.
- No realizar merges ni deploys. No modificar F02.

**Primera acción de Kimi:** devolver una tabla de estado exacta (HEAD/ramas/activos presentes/faltantes), clasificar los PNG y presentar una propuesta técnica mínima de F03 con riesgos y pruebas. Ejecutar el prototipo solo tras demostrar que no altera F02.
