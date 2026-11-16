# Fichas técnicas individuales de las 29 PR
**Base de comparación:** `master@46174d6918e336119a79f5bda9fd2733aa5464c4`; datos crudos y comentarios en `pr-forensics.json`. Cada ficha distingue árbol, capacidad, preparación y decisión.

## PR #238 — Asistente generativo V3 [D]
**Enlace:** https://github.com/Juanmaes83/floorplan-3d/pull/238 · **autor:** Juanmaes83 · **actualizada:** 2026-11-15T19:20:02Z · **estado:** Draft.
**HEAD:** `5e3a2e987f89e95a83d4888b08e64a4758d42f26` · **base declarada:** `feat/cat-04-catalog-budget-assistant@bd1024cded97a020246f410affdc7fb0fc73f566` · **ancestro con master:** `bd1024cded97a020246f410affdc7fb0fc73f566` · **rev-list master/PR:** `6	10` · **commits/archivos PR:** 10/25.
**Descripción y comentarios leídos:** cuerpo 3270 caracteres, 5 comentarios de conversación, 0 revisiones y 0 comentarios inline. El JSON conserva el texto exacto.
**Función:** Conversación con herramientas de lectura y dos propuestas tipadas; el servidor fija lista de herramientas y reserva el peor coste antes de llamar al proveedor.
**Relación con master:** V2 guiado y CAT-04 están en master; el remoto parte de bd1024c y omite seis commits posteriores de #237, incluidos IVA por partida y XR/F1-F8.
**Código/evidencia exclusiva:** API de modelo, ledger Redis atómico, orquestador, UI, eval y tests nuevos. Archivos relevantes: `.github/workflows/assistant-ai-v2.yml`, `api/_spend-ledger.js`, `api/assistant.js`, `css/assistant.css`, `index.html`, `js/assistant-agent-core.js`, `js/assistant-gen-ui.js`, `js/assistant-ui.js`.
**Archivos de código/prueba con blob diferente de master (no todos representan función exclusiva):** `.github/workflows/assistant-ai-v2.yml`, `api/_spend-ledger.js`, `api/assistant.js`, `css/assistant.css`, `index.html`, `js/assistant-agent-core.js`, `js/assistant-gen-ui.js`, `js/assistant-ui.js`, `tests/assistant-agent-core.test.cjs`, `tests/assistant-ai-v2.test.cjs`, `tests/assistant-gen-api.test.cjs`, `tests/assistant-gen-eval.test.cjs`, `tests/assistant-gen.browser.test.cjs`, `tests/spend-ledger.test.cjs`.
**Diff comprobado:** 25 archivos en PR; 0 blobs iguales a master. Esto es comparación exacta, no equivalencia semántica. `git cherry` no marcó parches equivalentes. Commits recientes: 5e3a2e9 Merge branch 'feat/cat-04-catalog-budget-assistant' into feat/assistant-generative-v3 / 1d2c91e fix(assistant-gen): isolate the generative conversation per studio+project; honest consent with question redaction / 17b825b Merge bran….
**Dependencias:** #237, identidad/permiso por estudio, Redis, tarifa/modelo/proveedor y GO de gasto; Claude trabaja en corte local no accesible.
**Git:** Conflicto 1 contra master; GitHub informa `CONFLICTING` contra `feat/cat-04-catalog-budget-assistant`. Conflictos: CONFLICT (content): Merge conflict in .github/workflows/assistant-ai-v2.yml.
**Compatibilidad:** Necesita reconciliación económica y de workflow; el modelo local de estudio no es identidad de servidor. **Preparación:** Requiere correcciones, CI verde del SHA final, pruebas de aislamiento y piloto C autorizado; no corresponde incorporar remoto.
**Pruebas y CI del HEAD remoto:** FAILURE:1, SUCCESS:25. El workflow Actions browser falla en assets.browser; otros jobs comunicados 24/25. El rollup GitHub de estados suma 25 success y 1 failure porque incluye Vercel. Tests nuevos de API/ledger/core, pero ninguna prueba con modelo real autorizada.
**Riesgo:** P1: coste, privacidad, aislamiento y cifras económicas; CI browser rojo por dos casos Asset Lab «Loading aborted». **Producto:** Conservar aislada; reauditar el SHA final de Claude antes de planificar un corte, sin activar proveedor.
**Condición para actuar:** Entregar SHA y diff contra master, IVA/unidad por partida, proyecto/estudio aislados, consentimiento renovado, ledger persistente, CI exacto y prueba C autorizada. **Dictamen:** sin merge ni cierre en esta auditoría.

## PR #236 — HOM-03 y registro de capacidades [C]
**Enlace:** https://github.com/Juanmaes83/floorplan-3d/pull/236 · **autor:** Juanmaes83 · **actualizada:** 2026-11-15T12:19:17Z · **estado:** Draft.
**HEAD:** `732cdfb77a68a3b08a21c361395fb489909186b0` · **base declarada:** `master@b9f761326a554e0a7a58d0b88e823771e36b5a7c` · **ancestro con master:** `b9f761326a554e0a7a58d0b88e823771e36b5a7c` · **rev-list master/PR:** `17	3` · **commits/archivos PR:** 3/36.
**Descripción y comentarios leídos:** cuerpo 4199 caracteres, 2 comentarios de conversación, 0 revisiones y 0 comentarios inline. El JSON conserva el texto exacto.
**Función:** Hace visibles Render IA, Asistente guiado, catálogos y simulaciones con estados distintos; no activa servicios.
**Relación con master:** HOM-01/02 están en master y alias público; HOM-03 no. Base b9f7613 precede #237, aunque contiene un gate textual CAT-04.
**Código/evidencia exclusiva:** Bloque de cuatro estados, registro, rutas de Home, capturas de seis perfiles y tests. Archivos relevantes: `.github/workflows/home-profession.yml`, `css/guided-experience.css`, `js/capability-registry.js`, `js/guide-ui.js`.
**Archivos de código/prueba con blob diferente de master (no todos representan función exclusiva):** `.github/workflows/home-profession.yml`, `css/guided-experience.css`, `js/capability-registry.js`, `js/guide-ui.js`, `tests/capability-registry.test.cjs`, `tests/welcome-ai-services.browser.test.cjs`.
**Diff comprobado:** 36 archivos en PR; 0 blobs iguales a master. Esto es comparación exacta, no equivalencia semántica. `git cherry` no marcó parches equivalentes. Commits recientes: 732cdfb HOM-03: capturas reales (neutra + 6 perfiles × 3 tamaños, y los 5 lugares que abre cada botón) con manifiesto SHA-256 del árbol e94e6da / e94e6da HOM-03: el vídeo de evidencias es uno solo y continuo (misma pestaña vuelve a la Home….
**Dependencias:** CAT-04 #237, estado del alias público, js/capability-registry.js e index.html; coordinar con titular de Home.
**Git:** Limpia en merge-tree contra master; GitHub informa `MERGEABLE` contra `master`. Sin conflicto en la simulación directa.
**Compatibilidad:** Merge-tree limpio, pero hay que reconciliar mensajes y fecha/SHA de capacidad con master. **Preparación:** Requiere revisión funcional y visual sobre HEAD actual; no basta 11/11 de su base.
**Pruebas y CI del HEAD remoto:** SUCCESS:12. Las pruebas declaradas están en los archivos de PR; no se ejecutó esta rama en local.
**Riesgo:** P2: declarar disponible en Production lo que solo está en master/Preview, rutas falsas o simulaciones confundidas. **Producto:** Candidata a integración en corte propio después de reconciliar #237 y verificar dominio objetivo.
**Condición para actuar:** Cada tarjeta abre su módulo real en seis perfiles, 1440/390/844, tres idiomas y teclado; estados coinciden con despliegue, CI del SHA exacto. **Dictamen:** sin merge ni cierre en esta auditoría.

## PR #227 — FOT-01 + MUE-01 [A]
**Enlace:** https://github.com/Juanmaes83/floorplan-3d/pull/227 · **autor:** Juanmaes83 · **actualizada:** 2026-11-14T11:46:51Z · **estado:** Draft.
**HEAD:** `fbf1730003dae2190e28a63347c3b27be602a385` · **base declarada:** `master@c8021fcfb27d02d8577e9520c47950a97c7b434c` · **ancestro con master:** `c8021fcfb27d02d8577e9520c47950a97c7b434c` · **rev-list master/PR:** `41	9` · **commits/archivos PR:** 9/14.
**Descripción y comentarios leídos:** cuerpo 3337 caracteres, 1 comentarios de conversación, 0 revisiones y 0 comentarios inline. El JSON conserva el texto exacto.
**Función:** Foto→reforma simulada y mueble propio por foto/medidas, con proveedor preparado pero desactivado.
**Relación con master:** #228 integró el corte; master posteriores corrigieron UI/proveedor, por eso solo 7/14 blobs coinciden hoy.
**Código/evidencia exclusiva:** Ningún código funcional exclusivo demostrado: 13/14 blobs iguales al commit combinado 136f98c; index.html se reconcilió. Archivos relevantes: `.github/workflows/photo-project-v1.yml`, `css/photo-project.css`, `index.html`, `js/own-furniture-core.js`, `js/own-furniture-ui.js`, `js/photo-reform-core.js`, `js/photo-reform-provider.js`, `js/photo-reform-ui.js`.
**Archivos de código/prueba con blob diferente de master (no todos representan función exclusiva):** `index.html`, `js/own-furniture-ui.js`, `js/photo-reform-provider.js`, `js/photo-reform-ui.js`, `tests/photo-project.browser.test.cjs`, `tests/photo-reform-provider.test.cjs`.
**Diff comprobado:** 14 archivos en PR; 7 blobs iguales a master. Esto es comparación exacta, no equivalencia semántica. `git cherry` no marcó parches equivalentes. Commits recientes: fbf1730 FOT-01: sin resultado que comparar no quedan a la vista el deslizador, la nota anterior ni la descarga / 2658ec7 FOT-01: contrato de proveedor v1 preparado SIN ACTIVAR, trazabilidad de la sesión y adaptador único / 1f4b1ee MUE-01: ….
**Dependencias:** #228 y tests photo-project; no traer rama antigua.
**Git:** Conflicto 7 contra master; GitHub informa `CONFLICTING` contra `master`. Conflictos: CONFLICT (add/add): Merge conflict in docs/photo-project/fot01-proveedor-contrato-v1.md, CONFLICT (content): Merge conflict in index.html, CONFLICT (add/add): Merge conflict in js/own-furniture-ui.js, CONFLICT (add/add): Merge conflict in js/photo-reform-provider.js, CONFLICT (add/add): Merge conflict in js/photo-reform-ui.js, CONFLICT (add/add): Merge conflict in tests/photo-project.browser.test.cjs, CONFLICT (add/add): Merge conflict in tests/photo-reform-provider.test.cjs.
**Compatibilidad:** Riesgo de duplicación/regresión frente a master. **Preparación:** No corresponde incorporación.
**Pruebas y CI del HEAD remoto:** SUCCESS:66. Las pruebas declaradas están en los archivos de PR; no se ejecutó esta rama en local.
**Riesgo:** P2 si se fusiona: siete conflictos y reversión de correcciones posteriores. **Producto:** Candidata a cierre con GO tras conservar enlace a #228 y confirmar que no hay prueba exclusiva.
**Condición para actuar:** Comparar módulo y suite photo-project en master; no perder test ni contrato de proveedor. **Dictamen:** sin merge ni cierre en esta auditoría.

## PR #226 — Amueblamiento UX-12/13 [A]
**Enlace:** https://github.com/Juanmaes83/floorplan-3d/pull/226 · **autor:** Juanmaes83 · **actualizada:** 2026-11-14T10:28:19Z · **estado:** Draft.
**HEAD:** `0ac6b4a0205183eca00ec506b949275c728dab27` · **base declarada:** `master@c8021fcfb27d02d8577e9520c47950a97c7b434c` · **ancestro con master:** `c8021fcfb27d02d8577e9520c47950a97c7b434c` · **rev-list master/PR:** `41	6` · **commits/archivos PR:** 6/19.
**Descripción y comentarios leídos:** cuerpo 8200 caracteres, 3 comentarios de conversación, 0 revisiones y 0 comentarios inline. El JSON conserva el texto exacto.
**Función:** Generación por estancia con densidad/semilla y comprobaciones de solape, con aplicación al proyecto.
**Relación con master:** #228 incorporó la rama y sus pruebas.
**Código/evidencia exclusiva:** No hay módulo/test exclusivo útil: 18/19 blobs idénticos a master; index.html fue reconciliado. Archivos relevantes: `.github/workflows/smart-furnishing.yml`, `index.html`, `js/smart-furnishing-core.js`, `js/smart-furnishing-ui.js`.
**Archivos de código/prueba con blob diferente de master (no todos representan función exclusiva):** `index.html`.
**Diff comprobado:** 19 archivos en PR; 18 blobs iguales a master. Esto es comparación exacta, no equivalencia semántica. `git cherry` no marcó parches equivalentes. Commits recientes: 0ac6b4a UX-12: la generación usa el criterio exacto de solape de la revisión al aplicar / c043b70 test(ux08): leer cifras dibujadas y del núcleo en el mismo turno / fbb0d60 docs(ux12-13): capturas del recorrido real y evidencias.
**Dependencias:** #228, proyecto y mobiliario canónico.
**Git:** Conflicto 1 contra master; GitHub informa `CONFLICTING` contra `master`. Conflictos: CONFLICT (content): Merge conflict in index.html.
**Compatibilidad:** Duplicada por integración combinada. **Preparación:** No corresponde incorporación.
**Pruebas y CI del HEAD remoto:** SUCCESS:64. Las pruebas declaradas están en los archivos de PR; no se ejecutó esta rama en local.
**Riesgo:** P2 si se fusiona: conflicto de index.html y duplicación. **Producto:** Candidata a cierre con GO; preservar historial como procedencia.
**Condición para actuar:** Suite smart-furnishing verde en master y ruta 2D/3D/Undo preservada. **Dictamen:** sin merge ni cierre en esta auditoría.

## PR #225 — NAV3D y minimapa [A]
**Enlace:** https://github.com/Juanmaes83/floorplan-3d/pull/225 · **autor:** Juanmaes83 · **actualizada:** 2026-11-14T11:47:02Z · **estado:** Draft.
**HEAD:** `9118152e1bd22664bb9ce55cc7d5644dd9fab756` · **base declarada:** `master@c8021fcfb27d02d8577e9520c47950a97c7b434c` · **ancestro con master:** `c8021fcfb27d02d8577e9520c47950a97c7b434c` · **rev-list master/PR:** `41	7` · **commits/archivos PR:** 7/17.
**Descripción y comentarios leídos:** cuerpo 2116 caracteres, 1 comentarios de conversación, 0 revisiones y 0 comentarios inline. El JSON conserva el texto exacto.
**Función:** Panel de navegación, paseo, minimapa y controles táctiles.
**Relación con master:** #228 incorporó el corte y las pruebas nav3d/walk.
**Código/evidencia exclusiva:** No hay módulo/test exclusivo útil: 16/17 blobs idénticos a master; index.html se reconcilió. Archivos relevantes: `.github/workflows/nav3d-pro-v1.yml`, `css/nav3d.css`, `index.html`, `js/nav3d-core.js`, `js/nav3d-ui.js`.
**Archivos de código/prueba con blob diferente de master (no todos representan función exclusiva):** `index.html`.
**Diff comprobado:** 17 archivos en PR; 16 blobs iguales a master. Esto es comparación exacta, no equivalencia semántica. `git cherry` no marcó parches equivalentes. Commits recientes: 9118152 walk-controls (teléfono): pasos del joystick proporcionales a la distancia al entrar en el baño / 421ddd4 NAV3D V1 · panel y minimapa dentro del contenedor del 3D (#view3d) / d668333 NAV3D V1 · CI: ejecutar de verdad walk y walk-co….
**Dependencias:** #228, visor 3D de index.html.
**Git:** Conflicto 1 contra master; GitHub informa `CONFLICTING` contra `master`. Conflictos: CONFLICT (content): Merge conflict in index.html.
**Compatibilidad:** Duplicada por integración combinada. **Preparación:** No corresponde incorporación.
**Pruebas y CI del HEAD remoto:** SUCCESS:67. Las pruebas declaradas están en los archivos de PR; no se ejecutó esta rama en local.
**Riesgo:** P2 si se fusiona: conflicto de index.html; controles móviles posteriores podrían revertirse. **Producto:** Candidata a cierre con GO tras conservar procedencia.
**Condición para actuar:** Paseo, minimapa y regreso al editor en master, desktop/móvil. **Dictamen:** sin merge ni cierre en esta auditoría.

## PR #217 — Puente puro R02-A [A]
**Enlace:** https://github.com/Juanmaes83/floorplan-3d/pull/217 · **autor:** Juanmaes83 · **actualizada:** 2026-11-13T09:11:35Z · **estado:** Draft.
**HEAD:** `a258e1136b4b7c87f762b26fdd7bd32a17c2374d` · **base declarada:** `lab/sculpt-r02a-normalized@501dcb3181406148223f8a664bc8ba3b9049ac2d` · **ancestro con master:** `a258e1136b4b7c87f762b26fdd7bd32a17c2374d` · **rev-list master/PR:** `144	0` · **commits/archivos PR:** 1/4.
**Descripción y comentarios leídos:** cuerpo 2199 caracteres, 1 comentarios de conversación, 0 revisiones y 0 comentarios inline. El JSON conserva el texto exacto.
**Función:** Mutación de techos, Undo y limpieza de referencias huérfanas en puente puro.
**Relación con master:** El commit a258e11 está en la historia de master; #223 activó la UI experimental.
**Código/evidencia exclusiva:** Ningún commit exclusivo: pr/217 es ancestro directo de master (144 a la izquierda, 0 a la derecha). Archivos relevantes: `.github/workflows/r02a-normalized.yml`, `js/r02a-ceiling-bridge.js`.
**Archivos de código/prueba con blob diferente de master (no todos representan función exclusiva):** `.github/workflows/r02a-normalized.yml`, `js/r02a-ceiling-bridge.js`, `tests/r02a-ceiling-bridge.test.cjs`.
**Diff comprobado:** 4 archivos en PR; 1 blobs iguales a master. Esto es comparación exacta, no equivalencia semántica. `git cherry` no marcó parches equivalentes. Commits recientes: .
**Dependencias:** R02-A #223; base apilada lab/sculpt-r02a-normalized.
**Git:** Ya ancestro de master contra master; GitHub informa `MERGEABLE` contra `lab/sculpt-r02a-normalized`. Sin conflicto en la simulación directa.
**Compatibilidad:** Ya incorporada por historial. **Preparación:** No corresponde incorporación.
**Pruebas y CI del HEAD remoto:** SUCCESS:7. Las pruebas declaradas están en los archivos de PR; no se ejecutó esta rama en local.
**Riesgo:** P3: solo cierre administrativo; remerge carece de sentido. **Producto:** Candidata a cierre con GO; conservar documentación de laboratorio.
**Condición para actuar:** Confirmar pruebas R02-A y descendencia en HEAD. **Dictamen:** sin merge ni cierre en esta auditoría.

## PR #215 — Revisión/activación R03 [B]
**Enlace:** https://github.com/Juanmaes83/floorplan-3d/pull/215 · **autor:** Juanmaes83 · **actualizada:** 2026-11-13T10:09:27Z · **estado:** Draft.
**HEAD:** `adce8f936cf11589404ff204efa1380d917af6d4` · **base declarada:** `master@2a76cd6ff47e2660f189a50c9003f19c6be27b49` · **ancestro con master:** `2a76cd6ff47e2660f189a50c9003f19c6be27b49` · **rev-list master/PR:** `97	11` · **commits/archivos PR:** 11/18.
**Descripción y comentarios leídos:** cuerpo 2492 caracteres, 3 comentarios de conversación, 0 revisiones y 0 comentarios inline. El JSON conserva el texto exacto.
**Función:** Propone conectar el interior de armario al editor real y documenta pruebas de split/escape y pantallas.
**Relación con master:** #222 activó R03 y añadió test vigente; la rama #215 precede el merge y sus evidencias no son todas iguales.
**Código/evidencia exclusiva:** Capturas y guía de aceptación humanas, y versión anterior de test de editor; la activación funcional fue sustituida por #222. Archivos relevantes: `.github/workflows/r03-sculpt-complete.yml`, `index.html`.
**Archivos de código/prueba con blob diferente de master (no todos representan función exclusiva):** `.github/workflows/r03-sculpt-complete.yml`, `index.html`, `tests/r03-editor-in-rubik.browser.test.cjs`.
**Diff comprobado:** 18 archivos en PR; 0 blobs iguales a master. Esto es comparación exacta, no equivalencia semántica. `git cherry` no marcó parches equivalentes. Commits recientes: adce8f9 review(r03): definitive human review guide on master 2a76cd6 — prueba C step by step (desktop and phone) / 34c9242 Merge remote-tracking branch 'origin/master' into review/r03-editor-in-rubik-20261113 / 61df19a review(r03): evidenc….
**Dependencias:** #222, index.html, workflow R03.
**Git:** Conflicto 3 contra master; GitHub informa `CONFLICTING` contra `master`. Conflictos: CONFLICT (content): Merge conflict in .github/workflows/r03-sculpt-complete.yml, CONFLICT (content): Merge conflict in index.html, CONFLICT (add/add): Merge conflict in tests/r03-editor-in-rubik.browser.test.cjs.
**Compatibilidad:** Solución funcional sustituida; preservar evidencias que sigan siendo útiles. **Preparación:** No corresponde incorporar la rama; revisar QA exclusiva.
**Pruebas y CI del HEAD remoto:** FAILURE:1, SUCCESS:13. Las pruebas declaradas están en los archivos de PR; no se ejecutó esta rama en local.
**Riesgo:** P2: tres conflictos; merge podría revertir guardas R02/R03. **Producto:** Conservar aislada hasta extraer/cotejar pruebas y capturas, luego candidata a cierre.
**Condición para actuar:** Test actual cubre split, salida y persistencia; evidencia humana accesible sin traer código viejo. **Dictamen:** sin merge ni cierre en esta auditoría.

## PR #205 — R01 cancelación y puente F2 [E]
**Enlace:** https://github.com/Juanmaes83/floorplan-3d/pull/205 · **autor:** Juanmaes83 · **actualizada:** 2026-11-12T17:36:29Z · **estado:** Draft.
**HEAD:** `2dca1c547ff67978d3387805d9f6bf94efadc92b` · **base declarada:** `lab/sculpt-r01-recognition@2158fd19207e4a33aeee8fed26d1b29be96103fa` · **ancestro con master:** `75615fdc6c96e7c43e52b13a24950b9652706f7d` · **rev-list master/PR:** `159	11` · **commits/archivos PR:** 1/10.
**Descripción y comentarios leídos:** cuerpo 2096 caracteres, 3 comentarios de conversación, 0 revisiones y 0 comentarios inline. El JSON conserva el texto exacto.
**Función:** Mejora el reconocimiento raster experimental; no escribe el proyecto.
**Relación con master:** R01 no forma parte del editor; master tiene trazado/asistencia local distinta.
**Código/evidencia exclusiva:** Web Worker, cancelación real, puente al evaluador F2 y tests en laboratorio. Archivos relevantes: `.github/workflows/sculpt-r01-lab.yml`, `labs/sculpt/r01-recognition/f2-bridge.js`, `labs/sculpt/r01-recognition/index.html`, `labs/sculpt/r01-recognition/recognition-runner.js`, `labs/sculpt/r01-recognition/recognition-worker.js`.
**Archivos de código/prueba con blob diferente de master (no todos representan función exclusiva):** `.github/workflows/sculpt-r01-lab.yml`, `labs/sculpt/r01-recognition/f2-bridge.js`, `labs/sculpt/r01-recognition/index.html`, `labs/sculpt/r01-recognition/recognition-runner.js`, `labs/sculpt/r01-recognition/recognition-worker.js`, `tests/sculpt-r01-cancel.browser.test.cjs`, `tests/sculpt-r01-f2-bridge.test.cjs`.
**Diff comprobado:** 10 archivos en PR; 0 blobs iguales a master. Esto es comparación exacta, no equivalencia semántica. `git cherry` no marcó parches equivalentes. Commits recientes: 2dca1c5 feat(sculpt-r01): real cancellation in a Web Worker and the bridge into the approved F2 wall evaluator / 2158fd1 docs(sculpt-r01): acta de cierre técnico del primer corte / ab64708 fix(sculpt-r01): hash de píxeles obligatorio en Re….
**Dependencias:** #191 y dataset de planos autorizados con escala, OCR, tasas de error.
**Git:** Limpia en merge-tree contra master; GitHub informa `MERGEABLE` contra `lab/sculpt-r01-recognition`. Sin conflicto en la simulación directa.
**Compatibilidad:** Sin contrato de integración canónica validado. **Preparación:** Investigación; no corresponde producto.
**Pruebas y CI del HEAD remoto:** SUCCESS:8. Las pruebas declaradas están en los archivos de PR; no se ejecutó esta rama en local.
**Riesgo:** P2: falsos positivos geométricos y derechos de planos. **Producto:** Conservar laboratorio apilado y validar en planos reales antes de diseñar entrada.
**Condición para actuar:** Benchmark licenciado, escala, cancelación, revisión humana y Undo antes de cualquier commit canónico. **Dictamen:** sin merge ni cierre en esta auditoría.

## PR #204 — MCP Etapa 2 endurecimiento [E]
**Enlace:** https://github.com/Juanmaes83/floorplan-3d/pull/204 · **autor:** Juanmaes83 · **actualizada:** 2026-11-12T17:43:57Z · **estado:** Draft.
**HEAD:** `3e17a07b50127972a7cf8665505fb608444eff24` · **base declarada:** `lab/mcp-stage2-empirical-validation@0ce3c44b892b7ac8567fc242ab97bca823cc3527` · **ancestro con master:** `75615fdc6c96e7c43e52b13a24950b9652706f7d` · **rev-list master/PR:** `159	11` · **commits/archivos PR:** 3/8.
**Descripción y comentarios leídos:** cuerpo 2453 caracteres, 4 comentarios de conversación, 0 revisiones y 0 comentarios inline. El JSON conserva el texto exacto.
**Función:** Endurece la generación de propuestas de distribución sin escritura.
**Relación con master:** Master solo tiene MCP Etapa 1 de lectura; V2 propone cambios en su propio flujo.
**Código/evidencia exclusiva:** Worker aislado, límites de entrada, cancelación y pruebas adversarias. Archivos relevantes: `tools/rubik-mcp/package.json`, `tools/rubik-mcp/src/core.cjs`, `tools/rubik-mcp/src/isolate-worker.cjs`, `tools/rubik-mcp/src/isolate.cjs`, `tools/rubik-mcp/src/lockdown.cjs`, `tools/rubik-mcp/src/server.mjs`, `tools/rubik-mcp/test/hardening.test.mjs`.
**Archivos de código/prueba con blob diferente de master (no todos representan función exclusiva):** `tools/rubik-mcp/package.json`, `tools/rubik-mcp/src/core.cjs`, `tools/rubik-mcp/src/isolate-worker.cjs`, `tools/rubik-mcp/src/isolate.cjs`, `tools/rubik-mcp/src/lockdown.cjs`, `tools/rubik-mcp/src/server.mjs`, `tools/rubik-mcp/test/hardening.test.mjs`.
**Diff comprobado:** 8 archivos en PR; 0 blobs iguales a master. Esto es comparación exacta, no equivalencia semántica. `git cherry` no marcó parches equivalentes. Commits recientes: 3e17a07 test(mcp-stage2): prove input provenance and adversarial parity; state the lockdown's exact scope / ee94fc3 fix(mcp-stage2): lock the isolated worker down; C1–C3 report with before/after measurements / 8dd4139 fix(mcp-stage2): isol….
**Dependencias:** #197→#196; contrato de propuesta, permisos, plano calibrado.
**Git:** Limpia en merge-tree contra master; GitHub informa `MERGEABLE` contra `lab/mcp-stage2-empirical-validation`. Sin conflicto en la simulación directa.
**Compatibilidad:** Apilada; un merge directo arrastraría Etapa 2 sin aceptación. **Preparación:** Laboratorio con pruebas sintéticas; falta validación profesional.
**Pruebas y CI del HEAD remoto:** SUCCESS:4. Las pruebas declaradas están en los archivos de PR; no se ejecutó esta rama en local.
**Riesgo:** P2: carga, aislamiento y propuesta no fiable en plano real. **Producto:** Conservar aislada; no integrar el stack en MVP.
**Condición para actuar:** Prueba stdio con proyecto calibrado, límites medidos, rechazo y cancelación reproducibles. **Dictamen:** sin merge ni cierre en esta auditoría.

## PR #197 — MCP Etapa 2 validación empírica [E]
**Enlace:** https://github.com/Juanmaes83/floorplan-3d/pull/197 · **autor:** Juanmaes83 · **actualizada:** 2026-11-12T07:32:37Z · **estado:** Draft.
**HEAD:** `0ce3c44b892b7ac8567fc242ab97bca823cc3527` · **base declarada:** `lab/rubik-mcp-stage2-proposals@316487cd73a343b06eee4121d6a6e46e4298ed47` · **ancestro con master:** `75615fdc6c96e7c43e52b13a24950b9652706f7d` · **rev-list master/PR:** `159	8` · **commits/archivos PR:** 5/197.
**Descripción y comentarios leídos:** cuerpo 10424 caracteres, 1 comentarios de conversación, 0 revisiones y 0 comentarios inline. El JSON conserva el texto exacto.
**Función:** Ejercita el motor de propuestas de #196 en escenarios sintéticos y evidencia antes/después.
**Relación con master:** No cambia el editor ni su UI de producto; master conserva Etapa 1.
**Código/evidencia exclusiva:** 197 archivos, principalmente fixtures, vídeos y harness stdio/Chromium; la consulta GraphQL truncó a 100 y se completó con REST. Archivos relevantes: `tools/rubik-mcp/test/validation-stage2.test.cjs`, `tools/rubik-mcp/validation/enumerate-candidates.cjs`, `tools/rubik-mcp/validation/lab/index.html`, `tools/rubik-mcp/validation/lab/lab-data.js`, `tools/rubik-mcp/validation/lab/lab.js`, `tools/rubik-mcp/validation/record-lab.mjs`, `tools/rubik-mcp/validation/run-stdio.mjs`, `tools/rubik-mcp/validation/validation-projects.cjs`.
**Archivos de código/prueba con blob diferente de master (no todos representan función exclusiva):** `tools/rubik-mcp/test/validation-stage2.test.cjs`, `tools/rubik-mcp/validation/enumerate-candidates.cjs`, `tools/rubik-mcp/validation/lab/index.html`, `tools/rubik-mcp/validation/lab/lab-data.js`, `tools/rubik-mcp/validation/lab/lab.js`, `tools/rubik-mcp/validation/record-lab.mjs`, `tools/rubik-mcp/validation/run-stdio.mjs`, `tools/rubik-mcp/validation/validation-projects.cjs`.
**Diff comprobado:** 197 archivos en PR; 0 blobs iguales a master. Esto es comparación exacta, no equivalencia semántica. `git cherry` no marcó parches equivalentes. Commits recientes: 0ce3c44 docs(mcp): informe y manifiesto del corte F1/F2/F3; recuento corregido (30 = 5/12/8/5) / 985eb5d Merge remote-tracking branch 'origin/lab/rubik-mcp-stage2-proposals' into lab/mcp-stage2-empirical-validation / 4c0caa3 qa(mcp): F1/F2….
**Dependencias:** #196 y luego #204.
**Git:** Limpia en merge-tree contra master; GitHub informa `MERGEABLE` contra `lab/rubik-mcp-stage2-proposals`. Sin conflicto en la simulación directa.
**Compatibilidad:** Apilada; no es módulo independiente para merge. **Preparación:** Requiere prueba de aceptación externa.
**Pruebas y CI del HEAD remoto:** SUCCESS:4. Las pruebas declaradas están en los archivos de PR; no se ejecutó esta rama en local.
**Riesgo:** P2: validar escenarios sintéticos no acredita planos reales. **Producto:** Conservar laboratorio de evidencia; no merge de producto.
**Condición para actuar:** Muestras de arquitectos, planos con escala y criterios medidos; no segundo escritor. **Dictamen:** sin merge ni cierre en esta auditoría.

## PR #196 — MCP Etapa 2 propuestas [E]
**Enlace:** https://github.com/Juanmaes83/floorplan-3d/pull/196 · **autor:** Juanmaes83 · **actualizada:** 2026-11-12T07:31:57Z · **estado:** Draft.
**HEAD:** `316487cd73a343b06eee4121d6a6e46e4298ed47` · **base declarada:** `master@75615fdc6c96e7c43e52b13a24950b9652706f7d` · **ancestro con master:** `75615fdc6c96e7c43e52b13a24950b9652706f7d` · **rev-list master/PR:** `159	3` · **commits/archivos PR:** 3/11.
**Descripción y comentarios leídos:** cuerpo 7531 caracteres, 1 comentarios de conversación, 0 revisiones y 0 comentarios inline. El JSON conserva el texto exacto.
**Función:** Herramienta `propose_layout` explica una distribución sin cambiar el proyecto.
**Relación con master:** MCP lectura existe en master; el generador de propuestas no.
**Código/evidencia exclusiva:** proposal.cjs, protocolo, fixtures y tests nuevos. Archivos relevantes: `.github/workflows/rubik-mcp.yml`, `tools/rubik-mcp/README.md`, `tools/rubik-mcp/fixtures/proposal-projects.cjs`, `tools/rubik-mcp/package.json`, `tools/rubik-mcp/src/core.cjs`, `tools/rubik-mcp/src/proposal.cjs`, `tools/rubik-mcp/src/server.mjs`, `tools/rubik-mcp/test/proposal-protocol.test.mjs`….
**Archivos de código/prueba con blob diferente de master (no todos representan función exclusiva):** `.github/workflows/rubik-mcp.yml`, `tools/rubik-mcp/README.md`, `tools/rubik-mcp/fixtures/proposal-projects.cjs`, `tools/rubik-mcp/package.json`, `tools/rubik-mcp/src/core.cjs`, `tools/rubik-mcp/src/proposal.cjs`, `tools/rubik-mcp/src/server.mjs`, `tools/rubik-mcp/test/proposal-protocol.test.mjs`, `tools/rubik-mcp/test/proposal.test.cjs`, `tools/rubik-mcp/test/protocol.test.mjs`.
**Diff comprobado:** 11 archivos en PR; 0 blobs iguales a master. Esto es comparación exacta, no equivalencia semántica. `git cherry` no marcó parches equivalentes. Commits recientes: 316487c docs(mcp): coste medido del límite de verificaciones (~6 s, 25,7 ms por verificación con 100 muebles) / 77ca084 fix(mcp): propose_layout — F1 barrido supuesto, F2 búsqueda continua, F3 evidencia de seguridad / 369c5b7 feat(mcp): Et….
**Dependencias:** Herramientas MCP de lectura y contrato del proyecto.
**Git:** Limpia en merge-tree contra master; GitHub informa `MERGEABLE` contra `master`. Sin conflicto en la simulación directa.
**Compatibilidad:** Técnicamente separable, funcionalmente no aceptada. **Preparación:** Laboratorio listo para más validación, no integración.
**Pruebas y CI del HEAD remoto:** SUCCESS:4. Las pruebas declaradas están en los archivos de PR; no se ejecutó esta rama en local.
**Riesgo:** P2: propuesta sin validación profesional ni entrada UI. **Producto:** Aplazar; no convertir demostración en producto.
**Condición para actuar:** Propuesta con diff verificable, escala confirmada, límites claros y aplicación solo por escritor canónico. **Dictamen:** sin merge ni cierre en esta auditoría.

## PR #194 — R03 laboratorio de armarios [B]
**Enlace:** https://github.com/Juanmaes83/floorplan-3d/pull/194 · **autor:** Juanmaes83 · **actualizada:** 2026-11-12T11:10:43Z · **estado:** Draft.
**HEAD:** `fc5a4224f2a48be2f18cdb3a701240e21bd2269f` · **base declarada:** `master@75615fdc6c96e7c43e52b13a24950b9652706f7d` · **ancestro con master:** `75615fdc6c96e7c43e52b13a24950b9652706f7d` · **rev-list master/PR:** `159	4` · **commits/archivos PR:** 4/39.
**Descripción y comentarios leídos:** cuerpo 3708 caracteres, 11 comentarios de conversación, 0 revisiones y 0 comentarios inline. El JSON conserva el texto exacto.
**Función:** Escultura pura de armario paramétrico con puertas, interior y casos de espacio.
**Relación con master:** R03-I1 está en master por #202/#214/#222, con UI, extensión y persistencia; el laboratorio original conserva alcance adicional.
**Código/evidencia exclusiva:** Escenarios de fabricación/colisiones, evidencia y fixtures del donante MIT; no forman la UI R03-I1 de master. Archivos relevantes: `.github/workflows/sculpt-r03-lab.yml`, `labs/sculpt/r03-cabinets/PROVENANCE.md`, `labs/sculpt/r03-cabinets/SOURCE-EXACT.sha256`, `labs/sculpt/r03-cabinets/baseline/no-external-requests.cjs`, `labs/sculpt/r03-cabinets/cabinet-compare-core.js`, `labs/sculpt/r03-cabinets/cabinet-core.js`, `labs/sculpt/r03-cabinets/cabinet-evidence-core.js`, `labs/sculpt/r03-cabinets/fetch-source-exact.sh`….
**Archivos de código/prueba con blob diferente de master (no todos representan función exclusiva):** `.github/workflows/sculpt-r03-lab.yml`, `labs/sculpt/r03-cabinets/PROVENANCE.md`, `labs/sculpt/r03-cabinets/SOURCE-EXACT.sha256`, `labs/sculpt/r03-cabinets/baseline/no-external-requests.cjs`, `labs/sculpt/r03-cabinets/cabinet-compare-core.js`, `labs/sculpt/r03-cabinets/cabinet-core.js`, `labs/sculpt/r03-cabinets/cabinet-evidence-core.js`, `labs/sculpt/r03-cabinets/fetch-source-exact.sh`, `labs/sculpt/r03-cabinets/fixtures/cabinet-scenarios.js`, `labs/sculpt/r03-cabinets/index.html`, `labs/sculpt/r03-cabinets/qa/lab-browser-qa.cjs`, `labs/sculpt/r03-cabinets/verify-workshop.cjs`, `labs/sculpt/r03-cabinets/workshop/LICENSE-donor-MIT.txt`, `labs/sculpt/r03-cabinets/workshop/cabinet-model.js`, `labs/sculpt/r03-cabinets/workshop/design.js`, `labs/sculpt/r03-cabinets/workshop/tests/design.test.cjs`, `tests/sculpt-r03-cabinets.test.cjs`.
**Diff comprobado:** 39 archivos en PR; 0 blobs iguales a master. Esto es comparación exacta, no equivalencia semántica. `git cherry` no marcó parches equivalentes. Commits recientes: fc5a422 docs(sculpt-r03): acta de cierre técnico — defectos A–C antes/después, auditoría visual, cobertura y límites / 417f389 lab(sculpt-r03): auditoría visual de cierre — terminología, estados de puertas, ediciones sin rescate, QA amplia….
**Dependencias:** #222, derechos por componente y límites de fabricación.
**Git:** Limpia en merge-tree contra master; GitHub informa `MERGEABLE` contra `master`. Sin conflicto en la simulación directa.
**Compatibilidad:** Requiere selección por capacidad; merge completo duplicaría motores. **Preparación:** No corresponde incorporar laboratorio completo.
**Pruebas y CI del HEAD remoto:** SUCCESS:15. Las pruebas declaradas están en los archivos de PR; no se ejecutó esta rama en local.
**Riesgo:** P2: segundo modelo de armario y afirmaciones de fabricación sin validación. **Producto:** Conservar aislada; extraer solo prueba/algoritmo cuando exista demanda profesional concreta.
**Condición para actuar:** Comparar cada rasgo adicional contra R03 master, validar dimensiones reales y no romper x-r03-cabinet. **Dictamen:** sin merge ni cierre en esta auditoría.

## PR #193 — R02-A laboratorio de techos/equipos [B]
**Enlace:** https://github.com/Juanmaes83/floorplan-3d/pull/193 · **autor:** Juanmaes83 · **actualizada:** 2026-11-11T09:17:16Z · **estado:** Draft.
**HEAD:** `7d8a6269047ec714fcdc51cf308f28c2650b23dc` · **base declarada:** `master@75615fdc6c96e7c43e52b13a24950b9652706f7d` · **ancestro con master:** `75615fdc6c96e7c43e52b13a24950b9652706f7d` · **rev-list master/PR:** `159	7` · **commits/archivos PR:** 7/27.
**Descripción y comentarios leídos:** cuerpo 2314 caracteres, 1 comentarios de conversación, 0 revisiones y 0 comentarios inline. El JSON conserva el texto exacto.
**Función:** Laboratorio de disposición de techos, luminarias, cortineros y relaciones verticales.
**Relación con master:** R02-A experimental está activo en master por #203/#217/#223, con 2D/3D/Undo; laboratorio amplio no.
**Código/evidencia exclusiva:** Comparador, escenarios diagonales/verticales y equipo del donante MIT; alcance no certificado en editor. Archivos relevantes: `.github/workflows/sculpt-r02-lab.yml`, `labs/sculpt/r02-ceiling/PROVENANCE.md`, `labs/sculpt/r02-ceiling/SOURCE-EXACT.sha256`, `labs/sculpt/r02-ceiling/baseline/playwright-test-shim.cjs`, `labs/sculpt/r02-ceiling/ceiling-compare-core.js`, `labs/sculpt/r02-ceiling/ceiling-layout-evidence-core.js`, `labs/sculpt/r02-ceiling/extract-donor.cjs`, `labs/sculpt/r02-ceiling/fetch-source-exact.sh`….
**Archivos de código/prueba con blob diferente de master (no todos representan función exclusiva):** `.github/workflows/sculpt-r02-lab.yml`, `labs/sculpt/r02-ceiling/PROVENANCE.md`, `labs/sculpt/r02-ceiling/SOURCE-EXACT.sha256`, `labs/sculpt/r02-ceiling/baseline/playwright-test-shim.cjs`, `labs/sculpt/r02-ceiling/ceiling-compare-core.js`, `labs/sculpt/r02-ceiling/ceiling-layout-evidence-core.js`, `labs/sculpt/r02-ceiling/extract-donor.cjs`, `labs/sculpt/r02-ceiling/fetch-source-exact.sh`, `labs/sculpt/r02-ceiling/fixtures/ceiling-scenarios.js`, `labs/sculpt/r02-ceiling/index.html`, `labs/sculpt/r02-ceiling/workshop/LICENSE-donor-MIT.txt`, `labs/sculpt/r02-ceiling/workshop/donor-ceiling-extracts.js`, `labs/sculpt/r02-ceiling/workshop/donor-placement.test.cjs`, `labs/sculpt/r02-ceiling/workshop/donor-rules-reference.txt`, `tests/sculpt-r02-ceiling-layout.test.cjs`.
**Diff comprobado:** 27 archivos en PR; 0 blobs iguales a master. Esto es comparación exacta, no equivalencia semántica. `git cherry` no marcó parches equivalentes. Commits recientes: 7d8a626 docs(sculpt-r02a): acta de cierre técnico — laboratorio completado, pendiente de aceptación humana / a840f3f lab(sculpt-r02a): estados de previewDiff en la vista B y el comparador; capturas actualizadas / d4f9969 fix(sculpt-r02a): ….
**Dependencias:** #223, validación de equipos/MEP y derechos.
**Git:** Limpia en merge-tree contra master; GitHub informa `MERGEABLE` contra `master`. Sin conflicto en la simulación directa.
**Compatibilidad:** Solo cortes validados, no merge de laboratorio entero. **Preparación:** No corresponde incorporación actual.
**Pruebas y CI del HEAD remoto:** FAILURE:1, SUCCESS:13. Las pruebas declaradas están en los archivos de PR; no se ejecutó esta rama en local.
**Riesgo:** P2: normas, interferencias y duplicación del modelo de techo. **Producto:** Conservar aislada para futuros casos de techo profesional.
**Condición para actuar:** Escenario real de techo/equipo, altura libre, vista y Undo, sin afirmación normativa. **Dictamen:** sin merge ni cierre en esta auditoría.

## PR #191 — R01 reconocimiento raster [E]
**Enlace:** https://github.com/Juanmaes83/floorplan-3d/pull/191 · **autor:** Juanmaes83 · **actualizada:** 2026-11-10T18:31:58Z · **estado:** Draft.
**HEAD:** `2158fd19207e4a33aeee8fed26d1b29be96103fa` · **base declarada:** `master@75615fdc6c96e7c43e52b13a24950b9652706f7d` · **ancestro con master:** `75615fdc6c96e7c43e52b13a24950b9652706f7d` · **rev-list master/PR:** `159	10` · **commits/archivos PR:** 10/18.
**Descripción y comentarios leídos:** cuerpo 1944 caracteres, 1 comentarios de conversación, 0 revisiones y 0 comentarios inline. El JSON conserva el texto exacto.
**Función:** Sugiere trazos desde píxeles, con evidencias; no produce un plano profesional aprobado.
**Relación con master:** Master tiene trazo manual y asistencia de ejes distinta.
**Código/evidencia exclusiva:** Motor raster de donante MIT, RecognitionEvidenceV1, comparador y tests sintéticos. Archivos relevantes: `.github/workflows/sculpt-r01-lab.yml`, `labs/sculpt/r01-recognition/PROVENANCE.md`, `labs/sculpt/r01-recognition/SOURCE-EXACT.sha256`, `labs/sculpt/r01-recognition/fetch-source-exact.sh`, `labs/sculpt/r01-recognition/fixtures/synthetic-plans.js`, `labs/sculpt/r01-recognition/index.html`, `labs/sculpt/r01-recognition/recognition-compare-core.js`, `labs/sculpt/r01-recognition/recognition-evidence-core.js`….
**Archivos de código/prueba con blob diferente de master (no todos representan función exclusiva):** `.github/workflows/sculpt-r01-lab.yml`, `labs/sculpt/r01-recognition/PROVENANCE.md`, `labs/sculpt/r01-recognition/SOURCE-EXACT.sha256`, `labs/sculpt/r01-recognition/fetch-source-exact.sh`, `labs/sculpt/r01-recognition/fixtures/synthetic-plans.js`, `labs/sculpt/r01-recognition/index.html`, `labs/sculpt/r01-recognition/recognition-compare-core.js`, `labs/sculpt/r01-recognition/recognition-evidence-core.js`, `labs/sculpt/r01-recognition/workshop/LICENSE-donor-MIT.txt`, `labs/sculpt/r01-recognition/workshop/donor-recognition.test.cjs`, `labs/sculpt/r01-recognition/workshop/ocr-postprocess-rules.js`, `labs/sculpt/r01-recognition/workshop/recognition-core.js`, `tests/sculpt-r01-recognition.test.cjs`.
**Diff comprobado:** 18 archivos en PR; 0 blobs iguales a master. Esto es comparación exacta, no equivalencia semántica. `git cherry` no marcó parches equivalentes. Commits recientes: 2158fd1 docs(sculpt-r01): acta de cierre técnico del primer corte / ab64708 fix(sculpt-r01): hash de píxeles obligatorio en RecognitionEvidenceV1 / 43fb03f docs(sculpt-r01): registro con #192, CLASSIFY por capacidad, GOV-05 abierto e integ….
**Dependencias:** Derechos de planos de prueba, OCR, escala y evaluador F2.
**Git:** Limpia en merge-tree contra master; GitHub informa `MERGEABLE` contra `master`. Sin conflicto en la simulación directa.
**Compatibilidad:** No existe entrada UI canónica ni persistencia validada. **Preparación:** Laboratorio.
**Pruebas y CI del HEAD remoto:** SUCCESS:13. Las pruebas declaradas están en los archivos de PR; no se ejecutó esta rama en local.
**Riesgo:** P2: errores de geometría y licencia de muestras. **Producto:** Conservar; no merge.
**Condición para actuar:** Datos reales licenciados, métricas de error, aprobación de cada muro y coherencia 3D. **Dictamen:** sin merge ni cierre en esta auditoría.

## PR #169 — F03 fachada material [E]
**Enlace:** https://github.com/Juanmaes83/floorplan-3d/pull/169 · **autor:** Juanmaes83 · **actualizada:** 2026-11-05T12:28:59Z · **estado:** Draft.
**HEAD:** `ce70f85941e32ba2483ac9bba70d9c4dd674eca2` · **base declarada:** `master@0f9c6ead9732901681498efec326d1ca92e42ffe` · **ancestro con master:** `0f9c6ead9732901681498efec326d1ca92e42ffe` · **rev-list master/PR:** `293	57` · **commits/archivos PR:** 57/174.
**Descripción y comentarios leídos:** cuerpo 4456 caracteres, 1 comentarios de conversación, 0 revisiones y 0 comentarios inline. El JSON conserva el texto exacto.
**Función:** Asignación reversible de materiales de fachada, con perfiles de textura y pruebas de rendimiento.
**Relación con master:** Master dispone de fachadas/materiales básicos; este nivel de fidelidad y assets no está incorporado.
**Código/evidencia exclusiva:** Módulos facade-fidelity*, derivados de textura y tests/capturas; 174 archivos reales (REST). Archivos relevantes: `.github/workflows/vq-01-material-ab-v2.yml`, `.github/workflows/vq-01-material-cp2.yml`, `.github/workflows/vq-01-material-fixture.yml`, `index.html`, `js/facade-fidelity-adapter.mjs`, `js/facade-fidelity-core.mjs`, `js/facade-fidelity-preview.mjs`, `js/presentation-ui.js`….
**Archivos de código/prueba con blob diferente de master (no todos representan función exclusiva):** `.github/workflows/vq-01-material-ab-v2.yml`, `.github/workflows/vq-01-material-cp2.yml`, `.github/workflows/vq-01-material-fixture.yml`, `index.html`, `js/facade-fidelity-adapter.mjs`, `js/facade-fidelity-core.mjs`, `js/facade-fidelity-preview.mjs`, `js/presentation-ui.js`, `js/surface-catalog.js`, `js/surface-fidelity.mjs`, `js/surface-renderer.mjs`, `js/visual-families-adapter.mjs`, `js/visual-families-core.mjs`, `js/visual-families-preview.mjs`, `tests/facade-fidelity-lifecycle.browser.test.cjs`, `tests/facade-fidelity-performance.browser.test.cjs`, `tests/facade-fidelity-smoke.browser.test.cjs`, `tests/facade-fidelity-visual.browser.test.cjs`, `tests/facade-fidelity.test.cjs`, `tests/fixtures/visual-families-v1.json`, `tests/fixtures/vq01-cp2-baselines.json`, `tests/fixtures/vq01-cp2-capture-v2.json`, `tests/fixtures/vq01-cp2-capture-v3.json`, `tests/fixtures/vq01-cp2-ready-baselines.json`, `tests/fixtures/vq01-cp2-views.json`, `tests/fixtures/vq01-material-ab-fixture.json`, `tests/fixtures/vq01-material-ab-v2-a-evidence.json`, `tests/fixtures/vq01-material-ab-v2.json`, `tests/hero-fidelity-v2-coverage.browser.test.cjs`, `tests/hero-fidelity-v2-lifecycle.browser.test.cjs`, `tests/hero-fidelity-v2-lighting.browser.test.cjs`, `tests/hero-fidelity-v2-systems.browser.test.cjs`, `tests/hero-fidelity-v2.browser.test.cjs`, `tests/material-detail.browser.test.cjs`, `tests/surface-fidelity.test.cjs`, `tests/surfaces.test.cjs`, `tests/visual-families-baseline.browser.test.cjs`, `tests/visual-families-harness.cjs`, `tests/visual-families-smoke.browser.test.cjs`, `tests/visual-families.test.cjs`, `tests/vq01-ab-compare.cjs`, `tests/vq01-ab-fixture.browser.test.cjs`, `tests/vq01-ab-v2.browser.test.cjs`, `tests/vq01-cp2-compare.cjs`, `tests/vq01-cp2.browser.test.cjs`.
**Diff comprobado:** 174 archivos en PR; 0 blobs iguales a master. Esto es comparación exacta, no equivalencia semántica. `git cherry` no marcó parches equivalentes. Commits recientes: ce70f85 docs(f03): checkpoint delivery report and draft PR / 94d18e9 test(f03): publish lifecycle performance and visual evidence / 1cb022d fix(f03): preserve assigned facade color identity.
**Dependencias:** #165/#167, licencias de activos y aceptación visual humana.
**Git:** Conflicto 1 contra master; GitHub informa `CONFLICTING` contra `master`. Conflictos: CONFLICT (content): Merge conflict in tests/material-detail.browser.test.cjs.
**Compatibilidad:** Puede convivir por módulos, pero ramas visuales antiguas se solapan y la prueba actual no basta. **Preparación:** Requiere revisión visual y licencia.
**Pruebas y CI del HEAD remoto:** SUCCESS:11. Las pruebas declaradas están en los archivos de PR; no se ejecutó esta rama en local.
**Riesgo:** P2: carga/performance, derechos y regresión de render. **Producto:** Aplazar; mantener aislada y comparar capturas sobre HEAD con un proyecto profesional.
**Condición para actuar:** Inventario de derechos, comparación A/B y presupuestos de memoria/tiempo en dispositivos admitidos. **Dictamen:** sin merge ni cierre en esta auditoría.

## PR #167 — Hero Architectural Fidelity V2 [E]
**Enlace:** https://github.com/Juanmaes83/floorplan-3d/pull/167 · **autor:** Juanmaes83 · **actualizada:** 2026-11-04T18:52:29Z · **estado:** Draft.
**HEAD:** `fe876c1c2016beafba48f1993b5c23ecb82f6814` · **base declarada:** `master@0f9c6ead9732901681498efec326d1ca92e42ffe` · **ancestro con master:** `0f9c6ead9732901681498efec326d1ca92e42ffe` · **rev-list master/PR:** `293	44` · **commits/archivos PR:** 44/65.
**Descripción y comentarios leídos:** cuerpo 1079 caracteres, 1 comentarios de conversación, 0 revisiones y 0 comentarios inline. El JSON conserva el texto exacto.
**Función:** Mejora presentación arquitectónica y fidelidad de la escena, pero no resuelve una brecha de datos.
**Relación con master:** Master tiene presentación 3D; mejora visual propuesta sigue fuera.
**Código/evidencia exclusiva:** Visual Families adapter/core/preview y pruebas de iluminación, cobertura y ciclo; assets/evidencias. Archivos relevantes: `.github/workflows/vq-01-material-ab-v2.yml`, `.github/workflows/vq-01-material-cp2.yml`, `.github/workflows/vq-01-material-fixture.yml`, `index.html`, `js/presentation-ui.js`, `js/surface-catalog.js`, `js/surface-fidelity.mjs`, `js/surface-renderer.mjs`….
**Archivos de código/prueba con blob diferente de master (no todos representan función exclusiva):** `.github/workflows/vq-01-material-ab-v2.yml`, `.github/workflows/vq-01-material-cp2.yml`, `.github/workflows/vq-01-material-fixture.yml`, `index.html`, `js/presentation-ui.js`, `js/surface-catalog.js`, `js/surface-fidelity.mjs`, `js/surface-renderer.mjs`, `js/visual-families-adapter.mjs`, `js/visual-families-core.mjs`, `js/visual-families-preview.mjs`, `tests/fixtures/visual-families-v1.json`, `tests/fixtures/vq01-cp2-baselines.json`, `tests/fixtures/vq01-cp2-capture-v2.json`, `tests/fixtures/vq01-cp2-capture-v3.json`, `tests/fixtures/vq01-cp2-ready-baselines.json`, `tests/fixtures/vq01-cp2-views.json`, `tests/fixtures/vq01-material-ab-fixture.json`, `tests/fixtures/vq01-material-ab-v2-a-evidence.json`, `tests/fixtures/vq01-material-ab-v2.json`, `tests/hero-fidelity-v2-coverage.browser.test.cjs`, `tests/hero-fidelity-v2-lifecycle.browser.test.cjs`, `tests/hero-fidelity-v2-lighting.browser.test.cjs`, `tests/hero-fidelity-v2-systems.browser.test.cjs`, `tests/hero-fidelity-v2.browser.test.cjs`, `tests/material-detail.browser.test.cjs`, `tests/surface-fidelity.test.cjs`, `tests/surfaces.test.cjs`, `tests/visual-families-baseline.browser.test.cjs`, `tests/visual-families-harness.cjs`, `tests/visual-families-smoke.browser.test.cjs`, `tests/visual-families.test.cjs`, `tests/vq01-ab-compare.cjs`, `tests/vq01-ab-fixture.browser.test.cjs`, `tests/vq01-ab-v2.browser.test.cjs`, `tests/vq01-cp2-compare.cjs`, `tests/vq01-cp2.browser.test.cjs`.
**Diff comprobado:** 65 archivos en PR; 0 blobs iguales a master. Esto es comparación exacta, no equivalencia semántica. `git cherry` no marcó parches equivalentes. Commits recientes: fe876c1 docs(visual-families): link draft handoff PR / b0255cc docs(visual-families): finalize tested handoff checkpoint / a2db71c docs(visual-families): publish mobile and lifecycle evidence.
**Dependencias:** #165, referencias con derechos y aceptación visual.
**Git:** Conflicto 1 contra master; GitHub informa `CONFLICTING` contra `master`. Conflictos: CONFLICT (content): Merge conflict in tests/material-detail.browser.test.cjs.
**Compatibilidad:** Necesita reconciliar renderer y superficie con master. **Preparación:** Requiere aceptación visual.
**Pruebas y CI del HEAD remoto:** CANCELLED:1, SUCCESS:10. Las pruebas declaradas están en los archivos de PR; no se ejecutó esta rama en local.
**Riesgo:** P2: regresión visual/performance y superposición con #169. **Producto:** Conservar aislada; no gate de MVP.
**Condición para actuar:** Comparación visual ciega con Juanma/profesionales y pruebas de ciclo/3D actual. **Dictamen:** sin merge ni cierre en esta auditoría.

## PR #166 — Delivery 3D cliente [B]
**Enlace:** https://github.com/Juanmaes83/floorplan-3d/pull/166 · **autor:** Juanmaes83 · **actualizada:** 2026-11-12T09:34:07Z · **estado:** Draft.
**HEAD:** `cef06ff78ae6f8654acfdf26305d512b1a9da7dc` · **base declarada:** `master@0f9c6ead9732901681498efec326d1ca92e42ffe` · **ancestro con master:** `0f9c6ead9732901681498efec326d1ca92e42ffe` · **rev-list master/PR:** `293	11` · **commits/archivos PR:** 11/78.
**Descripción y comentarios leídos:** cuerpo 2663 caracteres, 2 comentarios de conversación, 0 revisiones y 0 comentarios inline. El JSON conserva el texto exacto.
**Función:** Visita 3D del destinatario con preview profesional y paquete publicado.
**Relación con master:** Master tiene contrato snapshot, GET /api/delivery, share/unshare y preview I1B; delivery-client master prohíbe fetch remoto y requiere opener.
**Código/evidencia exclusiva:** Lectura remota `?entrega=` en delivery-client, enlace desde Entregar, prueba delivery-3d y mapa de visita; no todo está en master. Archivos relevantes: `api/delivery.js`, `api/share.js`, `api/unshare.js`, `css/delivery-client.css`, `index.html`, `js/building-ui.js`, `js/client-share-ui.js`, `js/delivery-client.js`….
**Archivos de código/prueba con blob diferente de master (no todos representan función exclusiva):** `api/delivery.js`, `api/share.js`, `api/unshare.js`, `index.html`, `js/building-ui.js`, `js/client-share-ui.js`, `js/delivery-client.js`, `js/delivery-core.js`, `js/delivery-ui.js`, `js/professional-workspace-ui.js`, `js/share-link-ui.js`, `tests/delivery-3d.browser.test.cjs`, `tests/delivery-api.test.cjs`, `tests/delivery-core.test.cjs`, `tests/delivery-map-core.test.cjs`, `tests/helpers/delivery-perf.cjs`, `tests/helpers/delivery-server.cjs`.
**Diff comprobado:** 78 archivos en PR; 2 blobs iguales a master. Esto es comparación exacta, no equivalencia semántica. `git cherry` no marcó parches equivalentes. Commits recientes: cef06ff Delivery 3D V1: visible focus ring and disabled accent state in the button system / 5989ad5 Delivery 3D V1: QA notes for the mini-map and the button state system / 206687f Delivery 3D V1: tests for the free-walk mini-map (unit + br….
**Dependencias:** #189/#200/#201, GOV-08 S1/S2, Blob, permisos y privacidad.
**Git:** Conflicto 8 contra master; GitHub informa `CONFLICTING` contra `master`. Conflictos: CONFLICT (add/add): Merge conflict in api/delivery.js, CONFLICT (content): Merge conflict in api/share.js, CONFLICT (add/add): Merge conflict in api/unshare.js, CONFLICT (content): Merge conflict in index.html, CONFLICT (content): Merge conflict in js/client-share-ui.js, CONFLICT (add/add): Merge conflict in js/delivery-client.js, CONFLICT (content): Merge conflict in js/professional-workspace-ui.js, CONFLICT (content): Merge conflict in js/share-link-ui.js.
**Compatibilidad:** No fusionar rama 293 commits atrasada; portar solo lector/enlace y pruebas sobre master. **Preparación:** Requiere rediseño localizado y E2E de seguridad.
**Pruebas y CI del HEAD remoto:** SUCCESS:11. Las pruebas declaradas están en los archivos de PR; no se ejecutó esta rama en local.
**Riesgo:** P1: ocho conflictos con endpoints, index y share; enlace público puede filtrar proyecto. **Producto:** Incorporar parcialmente en rama nueva solo si Juanma exige visita remota; entrega local sirve piloto básico.
**Condición para actuar:** Publicar snapshot sintético, abrir sin sesión en navegador nuevo, confirmar mínimos, revocar, probar error/aislamiento/móvil. **Dictamen:** sin merge ni cierre en esta auditoría.

## PR #165 — VQ-01 fidelidad material [E]
**Enlace:** https://github.com/Juanmaes83/floorplan-3d/pull/165 · **autor:** Juanmaes83 · **actualizada:** 2026-11-04T09:51:45Z · **estado:** Draft.
**HEAD:** `894607b38fa43a5e89a9f5296a41cdbcc989d5ce` · **base declarada:** `master@0f9c6ead9732901681498efec326d1ca92e42ffe` · **ancestro con master:** `0f9c6ead9732901681498efec326d1ca92e42ffe` · **rev-list master/PR:** `293	21` · **commits/archivos PR:** 21/26.
**Descripción y comentarios leídos:** cuerpo 2919 caracteres, 1 comentarios de conversación, 0 revisiones y 0 comentarios inline. El JSON conserva el texto exacto.
**Función:** Fundación técnica para fidelidad de materiales y familias visuales.
**Relación con master:** Master tiene superficie y materiales, pero la variante VQ-01 no.
**Código/evidencia exclusiva:** Renderer/material fidelity, fixtures y pruebas A/B; aceptación humana solo parcial. Archivos relevantes: `.github/workflows/vq-01-material-ab-v2.yml`, `.github/workflows/vq-01-material-cp2.yml`, `.github/workflows/vq-01-material-fixture.yml`, `index.html`, `js/presentation-ui.js`, `js/surface-catalog.js`, `js/surface-fidelity.mjs`, `js/surface-renderer.mjs`.
**Archivos de código/prueba con blob diferente de master (no todos representan función exclusiva):** `.github/workflows/vq-01-material-ab-v2.yml`, `.github/workflows/vq-01-material-cp2.yml`, `.github/workflows/vq-01-material-fixture.yml`, `index.html`, `js/presentation-ui.js`, `js/surface-catalog.js`, `js/surface-fidelity.mjs`, `js/surface-renderer.mjs`, `tests/fixtures/vq01-cp2-baselines.json`, `tests/fixtures/vq01-cp2-capture-v2.json`, `tests/fixtures/vq01-cp2-capture-v3.json`, `tests/fixtures/vq01-cp2-ready-baselines.json`, `tests/fixtures/vq01-cp2-views.json`, `tests/fixtures/vq01-material-ab-fixture.json`, `tests/fixtures/vq01-material-ab-v2-a-evidence.json`, `tests/fixtures/vq01-material-ab-v2.json`, `tests/material-detail.browser.test.cjs`, `tests/surface-fidelity.test.cjs`, `tests/surfaces.test.cjs`, `tests/vq01-ab-compare.cjs`, `tests/vq01-ab-fixture.browser.test.cjs`, `tests/vq01-ab-v2.browser.test.cjs`, `tests/vq01-cp2-compare.cjs`, `tests/vq01-cp2.browser.test.cjs`.
**Diff comprobado:** 26 archivos en PR; 0 blobs iguales a master. Esto es comparación exacta, no equivalencia semántica. `git cherry` no marcó parches equivalentes. Commits recientes: 894607b ci(vq-01): rerun CP2 impact QA when M08 browser export test changes / eb8f159 test(vq-01): correct M08 PNG export action wait, preserving real download QA / c3c8a29 test(vq-01): refresh historical capture controls after verified re….
**Dependencias:** Revisión visual CP2, referencias y #167/#169.
**Git:** Conflicto 1 contra master; GitHub informa `CONFLICTING` contra `master`. Conflictos: CONFLICT (content): Merge conflict in tests/material-detail.browser.test.cjs.
**Compatibilidad:** Rama antigua se solapa con render actual. **Preparación:** Laboratorio visual, no preparado para producto.
**Pruebas y CI del HEAD remoto:** SUCCESS:12. Las pruebas declaradas están en los archivos de PR; no se ejecutó esta rama en local.
**Riesgo:** P2: renderer compartido, performance y aceptación incompleta. **Producto:** Conservar aislada; no merge hasta aceptación visual completa.
**Condición para actuar:** Comparación A/B aprobada, capturas y métricas en HEAD actual. **Dictamen:** sin merge ni cierre en esta auditoría.

## PR #164 — Acta visual CP2 [F]
**Enlace:** https://github.com/Juanmaes83/floorplan-3d/pull/164 · **autor:** Juanmaes83 · **actualizada:** 2026-11-04T09:52:48Z · **estado:** Draft.
**HEAD:** `4091b921bb7f47f9e42f791bf8a63651db64d6c1` · **base declarada:** `master@0f9c6ead9732901681498efec326d1ca92e42ffe` · **ancestro con master:** `0f9c6ead9732901681498efec326d1ca92e42ffe` · **rev-list master/PR:** `293	7` · **commits/archivos PR:** 7/3.
**Descripción y comentarios leídos:** cuerpo 2398 caracteres, 1 comentarios de conversación, 0 revisiones y 0 comentarios inline. El JSON conserva el texto exacto.
**Función:** Registra que el experimento visual fue aceptado solo parcialmente; no cambia producto.
**Relación con master:** La documentación de master puede ser posterior; no demuestra cierre visual.
**Código/evidencia exclusiva:** Tres documentos de aceptación parcial y roadmap visual. Archivos relevantes: `docs/qa/vq01-cp2-ci-success-human-visual-handoff-2026-11-04.md`, `docs/qa/vq01-cp2-human-visual-partial-acceptance-2026-11-04.md`.
**Archivos de código/prueba con blob diferente de master (no todos representan función exclusiva):** ninguno.
**Diff comprobado:** 3 archivos en PR; 0 blobs iguales a master. Esto es comparación exacta, no equivalencia semántica. `git cherry` no marcó parches equivalentes. Commits recientes: 4091b92 docs(qa): distinguish partial human acceptance from unresolved global visual gap / 99ae1cb docs(research): align Visual Families roadmap to signed CP2 partial acceptance / 011aad9 docs(qa): link actual partial visual acceptance and….
**Dependencias:** #165/#167/#169.
**Git:** Limpia en merge-tree contra master; GitHub informa `MERGEABLE` contra `master`. Sin conflicto en la simulación directa.
**Compatibilidad:** No hay conflicto mecánico, pero no es integración funcional. **Preparación:** Conocimiento histórico.
**Pruebas y CI del HEAD remoto:** SUCCESS:3. Las pruebas declaradas están en los archivos de PR; no se ejecutó esta rama en local.
**Riesgo:** P3: trasladar un estado histórico como actual. **Producto:** Conservar como referencia; archivar/cerrar solo tras migrar decisión vigente.
**Condición para actuar:** Acta vigente vinculada a SHA/capturas, sin presentar aceptación parcial como completa. **Dictamen:** sin merge ni cierre en esta auditoría.

## PR #162 — Referencias visuales VECINIA [F]
**Enlace:** https://github.com/Juanmaes83/floorplan-3d/pull/162 · **autor:** Juanmaes83 · **actualizada:** 2026-11-03T21:43:20Z · **estado:** Draft.
**HEAD:** `eb888c1c9b0a06b3f4b77fab32fa3318ac2175af` · **base declarada:** `master@0f9c6ead9732901681498efec326d1ca92e42ffe` · **ancestro con master:** `0f9c6ead9732901681498efec326d1ca92e42ffe` · **rev-list master/PR:** `293	1` · **commits/archivos PR:** 1/1.
**Descripción y comentarios leídos:** cuerpo 535 caracteres, 1 comentarios de conversación, 0 revisiones y 0 comentarios inline. El JSON conserva el texto exacto.
**Función:** Trazabilidad de referencias visuales, sin código de producto.
**Relación con master:** No introduce función en master.
**Código/evidencia exclusiva:** Registro de linaje de tres imágenes y fuentes. Archivos relevantes: `docs/research/vecinia/visual-lineage-and-reference-register-2026-11-03.md`.
**Archivos de código/prueba con blob diferente de master (no todos representan función exclusiva):** ninguno.
**Diff comprobado:** 1 archivos en PR; 0 blobs iguales a master. Esto es comparación exacta, no equivalencia semántica. `git cherry` no marcó parches equivalentes. Commits recientes: eb888c1 docs(research): preserve VECINIA visual evolution and register three reference images.
**Dependencias:** Licencias y cadena de fuentes.
**Git:** Limpia en merge-tree contra master; GitHub informa `MERGEABLE` contra `master`. Sin conflicto en la simulación directa.
**Compatibilidad:** Documental. **Preparación:** Referencia histórica.
**Pruebas y CI del HEAD remoto:** SUCCESS:3. Las pruebas declaradas están en los archivos de PR; no se ejecutó esta rama en local.
**Riesgo:** P3: derechos mal interpretados si se reutiliza sin revisar. **Producto:** Preservar registro; no merge funcional.
**Condición para actuar:** Revisión de procedencia antes de cualquier reutilización visual. **Dictamen:** sin merge ni cierre en esta auditoría.

## PR #161 — Borrador legal protección [F]
**Enlace:** https://github.com/Juanmaes83/floorplan-3d/pull/161 · **autor:** Juanmaes83 · **actualizada:** 2026-11-03T19:49:51Z · **estado:** Draft.
**HEAD:** `8d591bb8e6f39d42129607790972a457d1515505` · **base declarada:** `master@0f9c6ead9732901681498efec326d1ca92e42ffe` · **ancestro con master:** `0f9c6ead9732901681498efec326d1ca92e42ffe` · **rev-list master/PR:** `293	2` · **commits/archivos PR:** 2/1.
**Descripción y comentarios leídos:** cuerpo 763 caracteres, 1 comentarios de conversación, 0 revisiones y 0 comentarios inline. El JSON conserva el texto exacto.
**Función:** Propuesta jurídica, no condiciones aprobadas ni control técnico.
**Relación con master:** No cambia autenticación ni seguridad de master.
**Código/evidencia exclusiva:** Borrador de uso/ingeniería inversa y decisión pendiente. Archivos relevantes: `docs/legal/rubik-uso-servicio-ingenieria-inversa-extraccion-y-competencia-borrador-2026-11-03.md`.
**Archivos de código/prueba con blob diferente de master (no todos representan función exclusiva):** ninguno.
**Diff comprobado:** 1 archivos en PR; 0 blobs iguales a master. Esto es comparación exacta, no equivalencia semántica. `git cherry` no marcó parches equivalentes. Commits recientes: 8d591bb docs(legal): record Rubik protection decision and discovery handoff / 0c88c4b docs(legal): draft Rubik reverse-engineering and extraction protections.
**Dependencias:** Asesoría jurídica y decisión de Juanma.
**Git:** Limpia en merge-tree contra master; GitHub informa `MERGEABLE` contra `master`. Sin conflicto en la simulación directa.
**Compatibilidad:** Documental, no contrato operativo. **Preparación:** Requiere decisión humana externa.
**Pruebas y CI del HEAD remoto:** SUCCESS:3. Las pruebas declaradas están en los archivos de PR; no se ejecutó esta rama en local.
**Riesgo:** P2: publicar términos sin revisión legal. **Producto:** Conservar aislada; no publicarla como política vigente.
**Condición para actuar:** Revisión jurídica y aprobación del propietario. **Dictamen:** sin merge ni cierre en esta auditoría.

## PR #160 — Protocolo multiagente/documentación [F]
**Enlace:** https://github.com/Juanmaes83/floorplan-3d/pull/160 · **autor:** Juanmaes83 · **actualizada:** 2026-11-03T12:08:09Z · **estado:** Draft.
**HEAD:** `91bb8d3b7539ac70026f7a84483356df68822adc` · **base declarada:** `master@0f9c6ead9732901681498efec326d1ca92e42ffe` · **ancestro con master:** `0f9c6ead9732901681498efec326d1ca92e42ffe` · **rev-list master/PR:** `293	45` · **commits/archivos PR:** 45/60.
**Descripción y comentarios leídos:** cuerpo 1998 caracteres, 3 comentarios de conversación, 0 revisiones y 0 comentarios inline. El JSON conserva el texto exacto.
**Función:** Propone coordinación y trazabilidad entre agentes, sin efecto en el producto.
**Relación con master:** Master y actas posteriores superan varias fechas/estados; el protocolo puede conservar reglas útiles.
**Código/evidencia exclusiva:** Handoffs, política de donantes y estado de 2/11; 60 archivos, muchos históricos. Archivos relevantes: `docs/ops/ACTIVE-WORKSTREAMS.md`, `docs/ops/HANDOFF-TEMPLATE.md`.
**Archivos de código/prueba con blob diferente de master (no todos representan función exclusiva):** ninguno.
**Diff comprobado:** 60 archivos en PR; 0 blobs iguales a master. Esto es comparación exacta, no equivalencia semántica. `git cherry` no marcó parches equivalentes. Commits recientes: 91bb8d3 docs: advance VQ-01 to CP1-B after fixture PASS / 3ac0776 docs: record VQ-01 CP1-A fixture checkpoint / 765d291 docs: add VQ-01 CP0.1 handoff and CP1 authorization.
**Dependencias:** Confirmar responsables y flujos vigentes.
**Git:** Limpia en merge-tree contra master; GitHub informa `MERGEABLE` contra `master`. Sin conflicto en la simulación directa.
**Compatibilidad:** Sin conflicto Git directo, pero duplicaría documentos. **Preparación:** Reconciliación documental.
**Pruebas y CI del HEAD remoto:** SUCCESS:3. Las pruebas declaradas están en los archivos de PR; no se ejecutó esta rama en local.
**Riesgo:** P3: documentación de estado viejo confundida con realidad. **Producto:** Extraer reglas operativas vigentes; no fusionar bloque histórico.
**Condición para actuar:** Una fuente vigente por tema, fechas y SHA actuales. **Dictamen:** sin merge ni cierre en esta auditoría.

## PR #89 — Estudio de recorrido/revisión/vídeo [F]
**Enlace:** https://github.com/Juanmaes83/floorplan-3d/pull/89 · **autor:** Juanmaes83 · **actualizada:** 2026-10-24T13:06:13Z · **estado:** Draft.
**HEAD:** `a9fb14171314c87f244914a5783e79a396adafb6` · **base declarada:** `master@e796e3da403e58f1b0bc03d8b40a62bc28c2456a` · **ancestro con master:** `e796e3da403e58f1b0bc03d8b40a62bc28c2456a` · **rev-list master/PR:** `416	1` · **commits/archivos PR:** 1/1.
**Descripción y comentarios leídos:** cuerpo 988 caracteres, 1 comentarios de conversación, 0 revisiones y 0 comentarios inline. El JSON conserva el texto exacto.
**Función:** Idea de recorrido protagonista y revisión profesional.
**Relación con master:** Presentación/entrega posteriores cubren parte; no implementa otro vídeo.
**Código/evidencia exclusiva:** Documento de producto con criterios para entrega y vídeo. Archivos relevantes: `docs/product/recorrido-revision-video-2026-10-24.md`.
**Archivos de código/prueba con blob diferente de master (no todos representan función exclusiva):** ninguno.
**Diff comprobado:** 1 archivos en PR; 0 blobs iguales a master. Esto es comparación exacta, no equivalencia semántica. `git cherry` no marcó parches equivalentes. Commits recientes: a9fb141 docs(product): definir recorrido, revisión profesional y entrega en vídeo.
**Dependencias:** Contrastar contra módulos de Entregar.
**Git:** Limpia en merge-tree contra master; GitHub informa `MERGEABLE` contra `master`. Sin conflicto en la simulación directa.
**Compatibilidad:** Documental. **Preparación:** No requiere código.
**Pruebas y CI del HEAD remoto:** SUCCESS:2. Las pruebas declaradas están en los archivos de PR; no se ejecutó esta rama en local.
**Riesgo:** P3: backlog duplicado. **Producto:** Conservar ideas no cubiertas como investigación; no merge funcional.
**Condición para actuar:** Tarea concreta solo si piloto revela necesidad. **Dictamen:** sin merge ni cierre en esta auditoría.

## PR #86 — Guía de ejemplo/copia y entrega [A]
**Enlace:** https://github.com/Juanmaes83/floorplan-3d/pull/86 · **autor:** Juanmaes83 · **actualizada:** 2026-10-24T12:31:55Z · **estado:** Draft.
**HEAD:** `01fc51f836c59f2d3102f8fe8447ee5c4265a102` · **base declarada:** `feat/solutions@f800c7d5b97080e0ea488e38c89a83bb9564da4e` · **ancestro con master:** `e796e3da403e58f1b0bc03d8b40a62bc28c2456a` · **rev-list master/PR:** `416	61` · **commits/archivos PR:** 10/6.
**Descripción y comentarios leídos:** cuerpo 2038 caracteres, 3 comentarios de conversación, 0 revisiones y 0 comentarios inline. El JSON conserva el texto exacto.
**Función:** Evita duplicar ejemplos, lleva a entrega desde la guía y conserva cierre visible en móvil.
**Relación con master:** Código equivalente en js/guide-ui.js y CSS master; 3/6 blobs idénticos, otros evolucionaron.
**Código/evidencia exclusiva:** Pruebas y texto históricos pueden diferir; master contiene ejemplo reutilizado, guía a Entregar y encabezado sticky. Archivos relevantes: `css/guided-experience.css`, `js/guide-ui.js`, `js/journey-core.js`.
**Archivos de código/prueba con blob diferente de master (no todos representan función exclusiva):** `css/guided-experience.css`, `js/guide-ui.js`, `tests/guide-navigation.browser.test.cjs`.
**Diff comprobado:** 6 archivos en PR; 3 blobs iguales a master. Esto es comparación exacta, no equivalencia semántica. `git cherry` no marcó parches equivalentes. Commits recientes: 01fc51f fix(guide): one button per action in «Tareas y ayuda»; its heading stays in view / 838124a fix(guide): delivery (sheet, client observations, image) is reachable from the guide / d407370 fix(guide): a reused unchanged example is lis….
**Dependencias:** Base apilada feat/solutions (#76); no mezclar stack antiguo.
**Git:** Conflicto 12 contra master; GitHub informa `MERGEABLE` contra `feat/solutions`. Conflictos: CONFLICT (content): Merge conflict in css/design-system.css, CONFLICT (content): Merge conflict in css/guided-experience.css, CONFLICT (content): Merge conflict in docs/ROADMAP.md, CONFLICT (content): Merge conflict in index.html, CONFLICT (content): Merge conflict in js/build-palette.js, CONFLICT (content): Merge conflict in js/guide-ui.js, CONFLICT (content): Merge conflict in js/presentation-ui.js, CONFLICT (add/add): Merge conflict in scripts/qa/journey/audit.cjs, CONFLICT (content): Merge conflict in tests/browser.test.cjs, CONFLICT (content): Merge conflict in tests/guide-navigation.browser.test.cjs, CONFLICT (content): Merge conflict in tests/presentation.browser.test.cjs, CONFLICT (add/add): Merge conflict in tests/professional-entry.browser.test.cjs.
**Compatibilidad:** Función absorbida; rama apilada antigua no apta para master. **Preparación:** No corresponde merge.
**Pruebas y CI del HEAD remoto:** SUCCESS:2. Las pruebas declaradas están en los archivos de PR; no se ejecutó esta rama en local.
**Riesgo:** P2: merge-tree directo master da 12 conflictos aunque GitHub dice limpio contra su base. **Producto:** Candidata a cierre tras comparar tests exclusivos y preservar conocimiento.
**Condición para actuar:** Guía actual pasa ejemplo repetido, copia, Entregar y móvil. **Dictamen:** sin merge ni cierre en esta auditoría.

## PR #77 — Estudio exterior/ubicación/vídeo [F]
**Enlace:** https://github.com/Juanmaes83/floorplan-3d/pull/77 · **autor:** Juanmaes83 · **actualizada:** 2026-10-22T07:23:32Z · **estado:** Draft.
**HEAD:** `aa01f7964f0960fbde60a3f84fa674c2471172fb` · **base declarada:** `master@e796e3da403e58f1b0bc03d8b40a62bc28c2456a` · **ancestro con master:** `e796e3da403e58f1b0bc03d8b40a62bc28c2456a` · **rev-list master/PR:** `416	1` · **commits/archivos PR:** 1/1.
**Descripción y comentarios leídos:** cuerpo 617 caracteres, 1 comentarios de conversación, 0 revisiones y 0 comentarios inline. El JSON conserva el texto exacto.
**Función:** Propuesta de producto, no código.
**Relación con master:** FT3D, NAV3D y entregas posteriores cubren varias ideas.
**Código/evidencia exclusiva:** Documento de candidatos de exterior, mobiliario y visita. Archivos relevantes: `docs/product/exterior-location-video-candidates-2026-10-22.md`.
**Archivos de código/prueba con blob diferente de master (no todos representan función exclusiva):** ninguno.
**Diff comprobado:** 1 archivos en PR; 0 blobs iguales a master. Esto es comparación exacta, no equivalencia semántica. `git cherry` no marcó parches equivalentes. Commits recientes: aa01f79 docs(product): record exterior, 3D furniture, immersion, location and video candidates.
**Dependencias:** Comparar cada idea con master.
**Git:** Limpia en merge-tree contra master; GitHub informa `MERGEABLE` contra `master`. Sin conflicto en la simulación directa.
**Compatibilidad:** Documental. **Preparación:** Sin función que integrar.
**Pruebas y CI del HEAD remoto:** SUCCESS:2. Las pruebas declaradas están en los archivos de PR; no se ejecutó esta rama en local.
**Riesgo:** P3: roadmap obsoleto. **Producto:** Preservar ideas sin cobertura, no merge funcional.
**Condición para actuar:** Solo abrir tarea si aporta diferencial medido en piloto. **Dictamen:** sin merge ni cierre en esta auditoría.

## PR #71 — Orientación de guía [A]
**Enlace:** https://github.com/Juanmaes83/floorplan-3d/pull/71 · **autor:** Juanmaes83 · **actualizada:** 2026-10-24T16:02:03Z · **estado:** Draft.
**HEAD:** `aba44e387d9bd57b54fbd915a638347de0c83267` · **base declarada:** `master@e796e3da403e58f1b0bc03d8b40a62bc28c2456a` · **ancestro con master:** `e796e3da403e58f1b0bc03d8b40a62bc28c2456a` · **rev-list master/PR:** `416	28` · **commits/archivos PR:** 28/96.
**Descripción y comentarios leídos:** cuerpo 2780 caracteres, 2 comentarios de conversación, 0 revisiones y 0 comentarios inline. El JSON conserva el texto exacto.
**Función:** Propone siguiente acción del recorrido y ejecuta su destino.
**Relación con master:** Ruta y mensajes presentes en master por integraciones posteriores; 84/96 blobs iguales, resto evolucionó.
**Código/evidencia exclusiva:** Evidencia/capturas históricas; master ya tiene journey-core, botones reales y guía evolucionada. Archivos relevantes: `css/design-system.css`, `css/guided-experience.css`, `index.html`, `js/app-shell.js`, `js/build-palette.js`, `js/guide-ui.js`, `js/journey-core.js`, `js/presentation-ui.js`.
**Archivos de código/prueba con blob diferente de master (no todos representan función exclusiva):** `css/design-system.css`, `css/guided-experience.css`, `index.html`, `js/app-shell.js`, `js/build-palette.js`, `js/guide-ui.js`, `js/journey-core.js`, `js/presentation-ui.js`, `tests/build-palette.browser.test.cjs`, `tests/journey-orientation.browser.test.cjs`, `tests/presentation.browser.test.cjs`.
**Diff comprobado:** 96 archivos en PR; 84 blobs iguales a master. Esto es comparación exacta, no equivalencia semántica. `git cherry` no marcó parches equivalentes. Commits recientes: aba44e3 qa(journey): N stops at the first task when «← Paso anterior» is disabled and says why / c82c702 fix(journey): the guided header wraps in 3D and with two levels instead of hiding controls / d437ca6 test(presentation): one round tri….
**Dependencias:** Editor/guía actual.
**Git:** Conflicto 9 contra master; GitHub informa `CONFLICTING` contra `master`. Conflictos: CONFLICT (content): Merge conflict in css/design-system.css, CONFLICT (add/add): Merge conflict in docs/product/journey-orientation-2026-10-21.md, CONFLICT (content): Merge conflict in index.html, CONFLICT (content): Merge conflict in js/build-palette.js, CONFLICT (content): Merge conflict in js/guide-ui.js, CONFLICT (add/add): Merge conflict in js/journey-core.js, CONFLICT (content): Merge conflict in js/presentation-ui.js, CONFLICT (add/add): Merge conflict in tests/journey-orientation.browser.test.cjs, CONFLICT (content): Merge conflict in tests/presentation.browser.test.cjs.
**Compatibilidad:** Absorbida funcionalmente. **Preparación:** No corresponde merge.
**Pruebas y CI del HEAD remoto:** SUCCESS:2. Las pruebas declaradas están en los archivos de PR; no se ejecutó esta rama en local.
**Riesgo:** P2: merge-tree directo master tiene nueve conflictos y podría revertir UX. **Producto:** Candidata a cierre tras preservar pruebas exclusivas.
**Condición para actuar:** Desde Home a proyecto, acción de guía abre módulo real, sin doble botón. **Dictamen:** sin merge ni cierre en esta auditoría.

## PR #64 — Cierre documental MCP/UX [F]
**Enlace:** https://github.com/Juanmaes83/floorplan-3d/pull/64 · **autor:** Juanmaes83 · **actualizada:** 2026-10-19T21:37:14Z · **estado:** Draft.
**HEAD:** `9e27dd1b065fe2762157616588c2a1b48ee94ac3` · **base declarada:** `master@bd153c76e493eb5dea1b2908c768f66935f5a192` · **ancestro con master:** `bd153c76e493eb5dea1b2908c768f66935f5a192` · **rev-list master/PR:** `467	4` · **commits/archivos PR:** 4/3.
**Descripción y comentarios leídos:** cuerpo 2423 caracteres, 1 comentarios de conversación, 0 revisiones y 0 comentarios inline. El JSON conserva el texto exacto.
**Función:** Reconciliación de octubre, no código ejecutable.
**Relación con master:** MCP Etapa 1 y UX posteriores cambian el estado.
**Código/evidencia exclusiva:** Tres documentos de estado MCP y roadmap UX. Archivos relevantes: `docs/ROADMAP-2-proposal.md`, `docs/ROADMAP.md`.
**Archivos de código/prueba con blob diferente de master (no todos representan función exclusiva):** ninguno.
**Diff comprobado:** 3 archivos en PR; 0 blobs iguales a master. Esto es comparación exacta, no equivalencia semántica. `git cherry` no marcó parches equivalentes. Commits recientes: 9e27dd1 docs: record #57 merged and the approved two-level presentation candidate (#65) / 5a7ef8c Merge master bd153c7 (#57) into docs/closeout-ux-roadmap-20261019 / 680343e docs: fix complete roadmap blob and preserve canonical history.
**Dependencias:** Documentos posteriores.
**Git:** Limpia en merge-tree contra master; GitHub informa `MERGEABLE` contra `master`. Sin conflicto en la simulación directa.
**Compatibilidad:** Documental. **Preparación:** Solo referencia histórica.
**Pruebas y CI del HEAD remoto:** SUCCESS:2. Las pruebas declaradas están en los archivos de PR; no se ejecutó esta rama en local.
**Riesgo:** P3: fecha antigua. **Producto:** No merge de estado viejo; conservar decisiones no sustituidas.
**Condición para actuar:** Citar SHA y fecha si alguna decisión sigue vigente. **Dictamen:** sin merge ni cierre en esta auditoría.

## PR #61 — Handoff Floorplan [F]
**Enlace:** https://github.com/Juanmaes83/floorplan-3d/pull/61 · **autor:** Juanmaes83 · **actualizada:** 2026-10-19T19:55:50Z · **estado:** Draft.
**HEAD:** `53e5c9831ff38a2c7c2497a0088fb834aa31a1bd` · **base declarada:** `master@d9cd11ba587d8c68bfa9d3a598958be28a0e0206` · **ancestro con master:** `d9cd11ba587d8c68bfa9d3a598958be28a0e0206` · **rev-list master/PR:** `487	2` · **commits/archivos PR:** 2/1.
**Descripción y comentarios leídos:** cuerpo 961 caracteres, 1 comentarios de conversación, 0 revisiones y 0 comentarios inline. El JSON conserva el texto exacto.
**Función:** Guía de continuación de octubre.
**Relación con master:** Master ha avanzado 487 commits desde su ancestro común.
**Código/evidencia exclusiva:** Documento de traspaso histórico. Archivos relevantes: `docs/HANDOFF-FLOORPLAN-2026-10-19.md`.
**Archivos de código/prueba con blob diferente de master (no todos representan función exclusiva):** ninguno.
**Diff comprobado:** 1 archivos en PR; 0 blobs iguales a master. Esto es comparación exacta, no equivalencia semántica. `git cherry` no marcó parches equivalentes. Commits recientes: 53e5c98 docs: actualizar handoff tras integrar #60 y #62 / ec46d8f docs: handoff operativo para continuidad de Floorplan.
**Dependencias:** Ninguna de producto.
**Git:** Limpia en merge-tree contra master; GitHub informa `MERGEABLE` contra `master`. Sin conflicto en la simulación directa.
**Compatibilidad:** Documental. **Preparación:** Referencia histórica.
**Pruebas y CI del HEAD remoto:** SUCCESS:2. Las pruebas declaradas están en los archivos de PR; no se ejecutó esta rama en local.
**Riesgo:** P3: instrucciones obsoletas. **Producto:** Conservar archivada, no integración.
**Condición para actuar:** No usar como estado actual. **Dictamen:** sin merge ni cierre en esta auditoría.

## PR #48 — LoRA LAB gate documental [F]
**Enlace:** https://github.com/Juanmaes83/floorplan-3d/pull/48 · **autor:** Juanmaes83 · **actualizada:** 2026-10-20T09:36:34Z · **estado:** Draft.
**HEAD:** `a260abdaf5ba4f16b8fa43dcc4444c129407548e` · **base declarada:** `master@bd153c76e493eb5dea1b2908c768f66935f5a192` · **ancestro con master:** `bd153c76e493eb5dea1b2908c768f66935f5a192` · **rev-list master/PR:** `467	20` · **commits/archivos PR:** 20/19.
**Descripción y comentarios leídos:** cuerpo 4993 caracteres, 2 comentarios de conversación, 0 revisiones y 0 comentarios inline. El JSON conserva el texto exacto.
**Función:** Investiga si LoRA LAB aporta a visuales.
**Relación con master:** No activa proveedor ni cambia renderer en master.
**Código/evidencia exclusiva:** Estudio, referencias, vídeo y test de evidencia; no código de producto. Archivos relevantes: `docs/qa/artifacts/loralab/references-2026-10-19/README.md`, `docs/qa/artifacts/loralab/references-2026-10-19/c1-2d-construir-objeto-coche.png`.
**Archivos de código/prueba con blob diferente de master (no todos representan función exclusiva):** `tests/loralab-evidence.test.cjs`.
**Diff comprobado:** 19 archivos en PR; 0 blobs iguales a master. Esto es comparación exacta, no equivalencia semántica. `git cherry` no marcó parches equivalentes. Commits recientes: a260abd docs(loralab): own folder for the reference captures and the 47 s video (V3) / a81d041 Add files via upload / e47ea9c Add files via upload.
**Dependencias:** Derechos de referencias y aceptación humana.
**Git:** Limpia en merge-tree contra master; GitHub informa `MERGEABLE` contra `master`. Sin conflicto en la simulación directa.
**Compatibilidad:** No es módulo integrable. **Preparación:** Estudio histórico.
**Pruebas y CI del HEAD remoto:** FAILURE:2, SUCCESS:2. Las pruebas declaradas están en los archivos de PR; no se ejecutó esta rama en local.
**Riesgo:** P2: activos externos/imagen sin licencia clara para producto. **Producto:** Conservar evidencia; no merge de producto.
**Condición para actuar:** Procedencia de imagen y valor medido antes de cualquier corte visual. **Dictamen:** sin merge ni cierre en esta auditoría.
