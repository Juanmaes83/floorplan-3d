# SCULPT HUMAN-3D — Contrato de investigación y PREFLIGHT v1.0

**Fecha de corte:** 2026-11-20 (Europe/Madrid)  
**Producto:** RUBIK SOTA — `Juanmaes83/floorplan-3d`  
**Clase:** INVESTIGACIÓN / PREFLIGHT DOCUMENTAL, no SOURCE + ISOLATE ni implementación  
**Base auditada:** `master@4ea7cb3bb72e6c3bdd9a176cb08bd9e41b8866f2` — árbol `a134a2c3bcb503528a4778f6d432b408c8bc0856`  
**Rama documental:** `research/human3d-preflight-20261120`  
**Propietario de decisión:** Juanma. **Auditor:** ChatGPT. **Siguiente implementador:** por designar tras GO independiente.

## 0. Regla central y límites de autorización

Se autoriza únicamente documentar el preflight y el contrato para evaluar tres fuentes humanas 3D: `ffunch/vrm-avatar-maker`, `abdulrehman043/humanforge` y el pack `Quaternius Background Posed Humans`.

**PROHIBIDO EN ESTE CORTE:** clonar, descargar, extraer, reproducir, convertir o publicar assets/modelos; copiar runtime, generadores o sus dependencias; crear GLB derivados; modificar F3, `assets/f3/`, editor, persistencia, Scene Capture, UI, Production, ramas ajenas o `master`; abrir/cerrar merges; gastar en servicios; procesar fotografías/personas reales. Publicación permitida exclusivamente de documentos de investigación en rama propia, sin PR productiva ni merge.

No confundir `OP-11/C4` (12 símbolos **2D** ya inventariados en rama aislada) con `HUMAN-3D` (posibles figuras **3D**, todavía **no descargadas ni aceptadas**). No confundir los 204 GLB Furniture Kit de snapshots aislados con recursos integrados en F3; cualquier coincidencia requiere una futura comparación de manifiestos y hashes sin modificar snapshots.

## 1. Contexto canónico de RUBIK

**Fuente de verdad:** `AGENTS.md`; `docs/agents/PROTOCOLO-COORDINACION-MULTIAGENTE.md`; `docs/integration/HANDOFF-MAESTRO-RUBIK-SOTA.md`; `docs/product/sculpt-metodologia-y-cartera-2026-11-10.md`; `docs/product/sculpt-openplan3d-roomgpt-2026-11-18.md`.

**Cadena SCULPT:** SOURCE → ISOLATE → CLASSIFY → SCULPT → NORMALIZE → TEST → PREVIEW → HUMAN REVIEW → MERGE. Este contrato termina **antes** de SOURCE + ISOLATE y no autoriza saltar fases.

**Ubicación de capacidad propuesta:** OP-11/ambientación arquitectónica, subfamilia HUMAN-3D; posible reutilización del cargador técnico F3 sin introducir un segundo cargador/visor/editor, pero **no fingir que una persona decorativa es un SKU comercial**. No inventar medidas de producto, marca, precio ni fichas de catálogo. Coordinación necesaria con F3/CAT-02/CAT-03, PER-01, LUZ-01, OP-10 y entregables de escena.

## 2. Verificación del perfil F3 existente — inspección estática, NO test ejecutado

### Código inspeccionado
- `js/asset-loader.mjs` en `master@4ea7cb3bb72e6c3bdd9a176cb08bd9e41b8866f2`: `inspectGLB`, `readGLB`, `inspectTextures`, `normalize`, `load`.
- `js/asset-catalog.js`: `FloorPlanAssets.adapt`, validación de permiso, hash, catálogo, geometría y normalización.
- `assets/f3/catalog.manifest.json`, `assets/f3/external.manifest.json` y `scripts/f3-pipeline/integrate.mjs`.
- `js/catalog-placement-core.js`: vínculo CAT-03 de SKU/producto; NO equivalente a ambientación humana.
- `js/scene-export-ui.js`: consumidor de captura y exportación de escena a revisar en gate futuro.

### Límites duros constatados en código
| Área | Límite actual | Implicación HUMAN-3D |
|---|---|---|
| Archivo | GLB 2.0 autocontenido, 20 bytes–8 MiB, recursos binarios internos | FBX/OBJ/Blend no admitidos directamente |
| Animación | Rechaza `animations` | Figuras animadas requieren un derivado estático si se quiere reutilizar F3 |
| Esqueleto | Rechaza `skins` | Los GLB con rig deben convertirse/bakearse; no basta con cambiar extensión |
| Morph targets | Rechaza `primitive.targets` | Aplanar geometría y expresión; conservar derivado separado del original |
| Extensiones glTF | Rechaza cualquier `extensions`, `extensionsUsed` y `extensionsRequired` | VRM, mesh-quantization, Draco, meshopt, KTX2 y cualquier otra extensión no pasan tal cual |
| Texturas | Solo `image/jpeg` embebida en bufferView, sin URI externa | WebP/PNG/URI requieren derivado compatible sin alterar loader |
| Imagen individual | ≤1 MiB y ≤2048 × 2048 | Verificar cada imagen después del derivado, no la resolución declarada |
| Número de imágenes | ≤4 | Exige consolidación cuando hay muchos mapas |
| Texturas/samplers | ≤4 | Aplicar el validador efectivo |
| Materiales | ≤8 | Hacer atlas/bake si procede; comprobar estética |
| Memoria | 16 MiB decodificado, 24 MiB de texturas estimadas | Garantizar cálculo del validador, no inferir del peso del ZIP |
| Geometría | Mallas de triángulos, accesores acotados, sin sparse | Validación positiva de estructura requerida |
| Catálogo | SHA-256, bytes, licencia, scopes, normalización, geometría y `qaStatus:approved` | No dar por aprobado ningún recurso tras simple descarga |
| Dimensiones | Transformación Y-up/metros, dimensiones manifestadas en mm con tolerancia ±20 mm | Altura humana debe medirse en mesh y anotar como geometría estimada |

No confundir el límite **8 MiB** con 8 MB decimales. No declarar presupuesto de FPS físico o de triángulos aprobado porque no se ha validado un presupuesto de dispositivo real. La ruta `asset-catalog.js` actual acepta solamente identidades `rubik-sota-local` o `immersphere-asset-lab` y tiene supuestos de producto, permisos y procedencia; un futuro tipo de entourage requiere diseño y decisión, **sin cambio ahora**.

**Resultado de compatibilidad del preflight:** ningún candidato queda declarado compatible F3 as-is sin inspección binaria. VRM y HumanForge presentan incompatibilidad documental explícita por rigs/skins/morphs y/o extensiones; Quaternius usa FBX/OBJ/Blend y requiere transformación futura. Una futura transformación NO es parte de este GO.

## 3. Las tres fuentes — corte y licencia

### A. `ffunch/vrm-avatar-maker`
- **Repositorio:** https://github.com/ffunch/vrm-avatar-maker
- **SHA de investigación:** `1435345c66da752e0e7a3b6cbae2c09bb1766c98` (`main` consultado 2026-11-20).
- **Código:** MIT, `LICENSE`; assets de personajes CC0 declarados y enumerados en `ASSETS.md`.
- **Terceros:** `three.js`, `three-vrm`, meshoptimizer MIT y MediaPipe/face-hair models Apache-2.0: conservar cada licencia, no atribuir CC0 al runtime.
- **Modelo de producto:** editor de humanos realistas en navegador, con exportación VRM 1.0 y GLB. Su README declara un máximo de 40.000 triángulos, 16 materiales, texturas 2048 y 20 MB. **Esos máximos son del donante, no superan automáticamente las restricciones F3.**
- **Incompatibilidad:** el GLB exportado conserva bones/skin/face shapes según README. No es un GLB estático libre de skins/morphs. Posible candidato a crear figuras de referencia para un posterior bake offline.
- **Proveniencia:** `ASSETS.md` tiene autor atribuido y etiquetas CC0 por elemento; algunos nombres de autor aparecen como «unknown». No basta el encabezado general: exigir comprobación por componentes seleccionados y hash/asset.
- **Privacidad:** prohibir el modo «From a photo» en este preflight. Ninguna imagen de persona, biometría o foto de tercero.
- **Evaluación:** **HOLD FOR STATIC EXPORT RESEARCH**. Buen potencial para realismo y variedad, mayor coste de cirugía técnica.

### B. `abdulrehman043/humanforge`
- **Repositorio:** https://github.com/abdulrehman043/humanforge
- **SHA de investigación:** `2226df1f50a04c5a8e1c02ea33780d28337dfbb1` (`main` consultado 2026-11-20).
- **Código:** MIT, `LICENSE`; assets humanos CC0 declarados en `LICENSE.ASSETS.md`; MakeHuman/MPFB2 y prendas comunitarias identificadas. La documentación distingue packs CC0 y CC-BY excluidos.
- **Terceros:** MediaPipe Face Landmarker / modelos de Google, Apache-2.0 para foto-ajuste opcional; no transportar ni habilitar en RUBIK.
- **Modelo de producto:** SDK/editor paramétrico humano Three.js/React/React Native, exportación GLB. README declara cuerpo base de 26,7k triángulos, exportación GLB comprimida alrededor de 3 MB, Mixamo rig, ARKit blendshapes, WebP y `KHR_mesh_quantization` en su pipeline.
- **Incompatibilidad:** GLB exportado puede conservar esqueleto, morph targets y extensiones; las texturas WebP requieren salida compatible JPEG para F3.
- **Calidad:** ropa y pelo comunitario; autor indica explícitamente limitaciones de pelo mediante cards alfa. No asumir acabado arquitectónico premium sin revisión visual.
- **Madurez:** proyecto muy reciente en octubre 2026 y comunidad pequeña al corte; smoke tests declarados por autor, **no ejecutados por RUBIK**.
- **Privacidad:** descartar selfie-to-avatar y cualquier imagen personal o externa.
- **Evaluación:** **HOLD — EXPERIMENTAL STATIC CANDIDATE**. Ventaja de personalización; mayor deuda y complejidad.

### C. Quaternius — `Background Posed Humans Pack`
- **Página ORIGINAL del autor:** https://quaternius.com/packs/backgroundposedhumans.html (publicada agosto 2018).
- **Versionado:** NO hay commit GitHub oficial de este pack identificado durante este preflight; no inventar SHA fuente ni clonar espejos como fuente primaria.
- **Contenido declarado:** página indica 28 modelos; descripción precisa **20 personas posadas + 8 peinados**. No venderlo como 28 humanos diferentes sin revisar el paquete.
- **Formatos declarados:** FBX, OBJ, Blend; no GLB del autor en esta página.
- **Derechos:** la página individual enlaza CC0. El autor publicó además **Quaternius Asset License (QAL) v1.0 28-08-2026**, que permite incorporar assets en productos pero prohíbe redistribuir modelos como ficheros/paquetes independientes. Sección 7 limita cambios retroactivos para assets ya obtenidos bajo una licencia anterior.
- **Gate obligatorio antes de adquisición:** comprobar y archivar evidencia de la página de pack, licencia incluida en el archivo de descarga, fecha de adquisición y derechos específicos de uso, redistribución y GitHub público. En caso de QAL o ambigüedad, **HOLD**: no publicar archivos originales o derivados en repositorio público ni dar permisos `redistribution:true` sin autorización/aclaración.
- **Compatibilidad técnica:** poses estáticas simplifican respecto a rigs; conversión FBX/OBJ/Blend→GLB, geometría Y-up, materiales/texturas JPEG y validación F3 serían una fase futura.
- **Calidad:** estilo low-poly para personajes de fondo y escala. Potencial conflicto con una visualización premium; revisión humana obligatoria.
- **Evaluación:** **PRIORIDAD DE PRÓXIMO PREFLIGHT DE ARCHIVO**, **NO autorización de descarga**. Mejor riesgo técnico inicial, riesgo jurídico aún sin cerrar a nivel de fichero.

## 4. Decisión de preflight / ranking inicial

| Posición | Fuente | Derecho de uso afirmado documentalmente | Directo a F3 | Valor visual esperado | Estado |
|---|---|---|---|---|---|
| 1 | Quaternius | CC0 en ficha 2018; conflicto contextual QAL de 2026 pendiente de archivo | NO: no GLB originario | Ambientación low-poly y poses | HOLD de adquisición, priorizar verificar licencia del ZIP |
| 2 | VRM Avatar Maker | Código MIT / modelos CC0 declarados, revisión per asset pendiente | NO: rig/morph, posibles materiales y tamaño | Figuras humanas variadas más realistas | HOLD, candidato de bake |
| 3 | HumanForge | Código MIT / modelos CC0 declarados, revisión per asset pendiente | NO: rig/morph/extensions/WebP | Figuras personalizables, ropa/pelo a valorar | HOLD experimental |

Estas posiciones son **priorización técnica para una investigación futura**, no puntuaciones derivadas de render ni licencias finales aprobadas.

## 5. Contrato de calidad editorial / arquitectónica a medir después

La utilidad para RUBIK no es construir avatares sociales ni animaciones: es introducir **referencias humanas que eleven la legibilidad espacial de escenas inmobiliarias y arquitectónicas**.

**Escenarios mínimos de futura validación, con datos sintéticos:** 1 figura de pie en un salón; 1 sentada en silla o sofá; pareja en terraza; figura caminando exterior; grupo 5 y 10 figuras como control de densidad.

**Dimensiones de inspección (sin afirmar resultados actuales):**
1. **Fidelidad y lenguaje visual:** silueta, proporciones, manos, pies, cara, piel, pelo, ropa; evaluar en primer plano y distancia real de cámara.
2. **Escala y pose:** altura y apoyo sobre suelo geométrico sin atravesar muebles, clipping del asiento, orientación, identidad/centro de pivote.
3. **Materiales y sombras:** JPEG PBR admitida, skin tone coherente, normales, doble cara, alfa en pelo; iluminación escena RUBIK frente a fondo neutro.
4. **Diversidad de uso:** edades adultas, estilos y vestuario apropiados para vivienda, turismo, comercio y oficina, sin caricaturizar ni usar rasgos personales reales.
5. **Compatibilidad:** static GLB, ninguna extensión, skin, animation o morph, 8 MiB máximo, permisos y manifiestos aptos.
6. **Rendimiento futuro:** medir triángulos, draw calls, GPU/CPU, memoria textura, tamaño binario y tiempos de carga con 1, 5 y 10 humanos en escritorio y móvil. No inventar FPS ni afirmar pruebas.
7. **Entregables:** contraste en escena 3D, vista 2D (símbolo representativo), captura/GLB Blender, fidelidad de escena exportada, persistencia reversible. Estos son **gates posteriores**, no alcance presente.

Para visualización premium puede convenir **OPTIONALISE** figuras low-poly solo como placeholders o antecedentes; no forzar calidad heterogénea en la escena de render.

## 6. Contrato jurídico / procedencia por asset (gate futuro)

Campos imprescindibles antes de SOURCE/ISOLATE:
`assetId`, `sourcePublisher`, `sourceUrl`, `sourceCommitOrArchiveVersion`, `originalFilePath`, `downloadDate`, `sourceSha256`, `licenseId`, `licenseTextOrLink`, `licenseEvidenceTimestamp`, `assetAuthor`, `thirdPartyComponents`, `commercialUseAllowed`, `modificationAllowed`, `publicRedistributionAllowed`, `cdnStreamingAllowed`, `attributionRequired`, `licenseConflict`, `reviewDecision`.

**Regla de seguridad:** ausencia de fuente, licencia no resuelta, paquete no verificado o derechos de redistribución inciertos ⇒ **BLOCKED**, no `CC0` por inferencia de un README. Código MIT no implica derechos CC0 sobre modelos, texturas ni fotografías. No atribuir autoría propia de modelos externos. No agregar paquetes QAL a un catálogo público descargable sin revisión jurídica específica.

El requisito actual `permission.brand==='own-no-third-party-mark'` de F3 y el catálogo restringido a dos orígenes no deben manipularse introduciendo personas como IKEA/SKU. En el corte posterior proponer una identidad canónica **de figura decorativa**, en otro contrato autorizado y sin romper consumidores existentes.

## 7. Gates medibles de decisión

| Gate | Evidencia requerida | STOP |
|---|---|---|
| P0 — este preflight | fuentes URL/SHA, licencia documental, F3 revisado, riesgos, contrato publicado | si no hay evidencia fuente o contrato |
| P1 — licencia específica, futuro GO | archivo/licencia individual, versión/fecha, permisos Git/CDN/venta, hash verificable | ambigüedad redistribución |
| P2 — SOURCE+ISOLATE, futuro GO | snapshot inmutable, manifiesto por asset, SHA originales, sin cambios en F3 | material sin licencia o duplicado no clasificado |
| P3 — CLASSIFY, futuro GO | KEEP/GENERALISE/OPTIONALISE/REPLACE/REMOVE, estilo, coste, duplicados con OP-11/F3 | diseño duplica motor/estado |
| P4 — SCULPT/NORMALIZE, futuro GO | GLB estático compatible, fotos sintéticas, medidas geometría | esquemas falsificados o optimizaciones destructivas |
| P5 — TEST/PREVIEW, futuro GO | inspectGLB, permisos SHA, escena múltiple, móviles y Blender, capturas | fallos reales ignorados |
| P6 — HUMAN REVIEW/MERGE, futuro GO | revisión y aprobación por SHA separados | falta de aprobación explícita |

## 8. Pruebas y estado actual

- GitHub: ramas, documentación del repositorio, licencias/README y perfiles técnicos **inspeccionados remotamente**.
- Licencia Quaternius: página del pack y QAL **contrastadas en web**.
- Archivos 3D: **NOT_DOWNLOADED**.
- Licencias dentro de ZIP/GLB: **NOT_INSPECTED**.
- Validación glTF: **NOT_RUN**.
- Benchmark: **NOT_RUN**.
- Pipeline y conversión: **NOT_RUN**.
- Preview y human review: **NOT_RUN**.
- Integración F3, editor, master o Production: **NOT_RUN / NOT_AUTHORIZED**.

**DICTAMEN DEL CORTE:** investigación documental completada. NO-GO para admisión directa de los tres candidatos en F3; GO **solo potencial** para proponer un P1 de licencia específica y selección mínima cuando el propietario lo autorice. El siguiente agente no debe tratar este contrato como permiso de descarga/extracción.

## 9. Referencias primarias

- RUBIK: https://github.com/Juanmaes83/floorplan-3d/blob/4ea7cb3bb72e6c3bdd9a176cb08bd9e41b8866f2/js/asset-loader.mjs
- F3 permisos: https://github.com/Juanmaes83/floorplan-3d/blob/4ea7cb3bb72e6c3bdd9a176cb08bd9e41b8866f2/js/asset-catalog.js
- Metodología: https://github.com/Juanmaes83/floorplan-3d/blob/4ea7cb3bb72e6c3bdd9a176cb08bd9e41b8866f2/docs/product/sculpt-metodologia-y-cartera-2026-11-10.md
- VRM commit: https://github.com/ffunch/vrm-avatar-maker/tree/1435345c66da752e0e7a3b6cbae2c09bb1766c98
- VRM licencia: https://github.com/ffunch/vrm-avatar-maker/blob/1435345c66da752e0e7a3b6cbae2c09bb1766c98/LICENSE
- VRM assets: https://github.com/ffunch/vrm-avatar-maker/blob/1435345c66da752e0e7a3b6cbae2c09bb1766c98/ASSETS.md
- HumanForge commit: https://github.com/abdulrehman043/humanforge/tree/2226df1f50a04c5a8e1c02ea33780d28337dfbb1
- HumanForge licencia: https://github.com/abdulrehman043/humanforge/blob/2226df1f50a04c5a8e1c02ea33780d28337dfbb1/LICENSE
- HumanForge assets: https://github.com/abdulrehman043/humanforge/blob/2226df1f50a04c5a8e1c02ea33780d28337dfbb1/LICENSE.ASSETS.md
- Quaternius pack: https://quaternius.com/packs/backgroundposedhumans.html
- QAL: https://quaternius.com/license.html
- Contraste externo fechado: https://tmhsdigital.github.io/Free-Game-Dev-Assets/entry/quaternius-background-posed-humans/
