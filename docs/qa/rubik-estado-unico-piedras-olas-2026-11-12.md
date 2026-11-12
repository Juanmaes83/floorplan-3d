# RUBIK SOTA — AUDITORÍA DOCUMENTAL DE ESTADO, PIEDRAS Y OLAS

**Fecha de comprobación:** 12 de noviembre de 2026 (hora local de España, mañana).

**Repositorio:** https://github.com/Juanmaes83/floorplan-3d

**Método:** lectura del catálogo maestro v1.10 en PR #192, anexo SCULPT, roadmap Pascal, roadmap del MCP, documentos técnicos del producto y contrastes de rama `master`, PR Draft y checks de GitHub. Auditoría base realizada en lectura; esta consolidación documental se guarda únicamente en la rama Draft de #192. La auditoría base original no inspeccionó Vercel, pero **el gate documental posterior del 12/11/2026 sí contrastó Production**: [Vercel `dpl_9s9H2dUnxXb3UYK7yFovoYTPtFtj` READY](https://vercel.com/juanma-espinosas-projects/floorplan-3d/9s9H2dUnxXb3UYK7yFovoYTPtFtj), asociado exactamente a `master@75615fdc6c96e7c43e52b13a24950b9652706f7d`. No equivale a inspección funcional completa ni autoriza merge, Promote o modificación del producto.

## Actualización de integración verificada — 12/11/2026 (posterior al corte inicial)

> **Precedencia:** esta sección es una **actualización aditiva** del estado actual del repositorio; las cifras y SHA históricos que siguen se conservan como fotografía de la auditoría inicial. No cambia el catálogo de 97 IDs ni renumera las olas.

- **`master` vigente verificado:** `de028ad082bfe1f40e0c1ae93fcf54825a00e2d6`, tras [merge de código R03-I0 #198](https://github.com/Juanmaes83/floorplan-3d/pull/198) en `0680afa` y [cierre documental #199](https://github.com/Juanmaes83/floorplan-3d/pull/199) en `de028ad`; el corte histórico inicial fue `75615fd`.
- **R03-I0 INTEGRADO ÚNICAMENTE COMO MOTOR PURO:** `js/r03-cabinet-core.js` junto con pruebas, workflow, atribución MIT y acta técnica. No está cargado desde el editor; no hay UI de interiores, persistencia ni nuevos campos de `FloorPlanProjectV1`. Por tanto, **SCULPT-R03 #194 permanece Draft/HOLD como piedra de laboratorio** y no debe declararse una mejora de armarios disponible en Production.
- **Production Vercel comprobada:** [`dpl_BTA5VnQyLzMtDSjAmM7KXedXDhBn`](https://vercel.com/juanma-espinosas-projects/floorplan-3d/BTA5VnQyLzMtDSjAmM7KXedXDhBn) `READY`, asociada a `master@de028ad`; el alias de `master` apunta a ella. El despliegue previo del código I0 fue `dpl_CdMf1...` sobre `0680afa`. READY no demuestra aceptación funcional de los armarios.
- **CI:** 6/6 workflows verdes en el HEAD previo al merge de #198, y **3/3 workflows posteriores sobre `master@0680afa` terminados SUCCESS** (Guided experience, Project-First y Multiformat guided import). El gate de #199 también terminó SUCCESS antes de fusionar; los checks posteriores a `de028ad` son un corte distinto.
- **Documentación posterior:** [PR #199](https://github.com/Juanmaes83/floorplan-3d/pull/199) **fusionada**, con un único Markdown que deja constancia del I0 integrado y de los HOLD I1–I3. [#192](https://github.com/Juanmaes83/floorplan-3d/pull/192) sigue Draft y requiere decisión de integración documental propia y CI de su HEAD actualizado.
- **Deudas intactas:** I1 contrato de interiores y compatibilidad V1, I2 interfaz con validación humana restante y móvil, I3 geometría 3D y alturas; GOV-05 comercial con riesgo residual; GOV-08/ENT-01 siguen sin autorización de producto; #195 y MCP Etapa 3/4 en HOLD.

---

## 0. Acta de reconciliación y autoridad — 12/11/2026

**Estado de esta acta:** cierre de auditoría documental autorizado por el propietario; NO es aprobación de merge, despliegue, una ola completa, ni integración de una piedra. Este documento se incorpora exclusivamente en la rama Draft de [PR #192](https://github.com/Juanmaes83/floorplan-3d/pull/192) como fotografía de estado y matriz de decisiones pendientes.

**Fuentes y precedencia:** autorización expresa del propietario > código/HEAD de `master` acreditado > PR Draft con SHA y CI propios > documentos técnicos y catálogo v1.10 > propuestas históricas. `master` confirma integración, una PR Draft confirma trabajo no integrado; una CI verde o una Preview no equivalen a aprobación humana, validez profesional ni Production. El catálogo maestro sigue siendo la única autoridad para IDs y olas 0–5; SCULPT solo registra investigación y gates. Conservar el historial y no duplicar capacidades.

**Corte confirmado al inicio:** `master@75615fdc6c96e7c43e52b13a24950b9652706f7d` y 62 PR abiertas; #192 era `f48a930838149e88bb53b372cc798a12afb52646`, Draft. Este SHA de #192 es **baseline previa a la consolidación**; las ediciones documentales posteriores de esta misma rama no afectan a los SHA ni al estado de producto descritos.

### Semáforo de integración — sin confundir estados

| Frente | Verificado | Autoridad y siguiente gate |
|---|---|---|
| **Producto en `master`** | Funciones enumeradas en §2; no duplicar motores existentes | Mejora nueva solo después de demostrar delta y autorización concreta |
| **Catálogo #192** | v1.10; 97 IDs y seis descartes; Draft, solo documentación | Revisión humana del catálogo; no merge automático |
| **GOV-08** | S1 #187 → S2 #188 → aislamiento #195, todos Draft; #195 congelada | Seguridad, dependencias, política de enlaces, CI y aceptación humana; sin Promote |
| **ENT-01** | #189 contrato puro; #166 propuesta histórica, ninguno integrado | Dependencias GOV-08/ENT-02, privacidad, dispositivos y entrega real, aceptación por corte |
| **MCP** | Etapa 1 integrada de lectura; #196 y #197 Etapa 2, laboratorios con CI verde | Dato real autorizado + escala confirmada; HOLD merge y Etapas 3–4 |
| **SCULPT** | R01 #191, R02-A #193 y R03 #194 son TRES laboratorios no integrados | Gate individual de cada piedra; no R04 ni integración en bloque |
| **ECO-01** | #190: modelo puro de coste, no integrado | Revisión de evidencia, medición real, permisos y aprobación por corte antes de nuevos servicios |

### Decisión ya registrada sobre MCP Etapa 2

En la descripción de [PR #197](https://github.com/Juanmaes83/floorplan-3d/pull/197) consta la **aceptación humana PROVISIONAL del límite de 250 verificaciones completas por llamada, solo para el laboratorio**. Mantener el valor y su respuesta conservadora `pending` al alcanzar el presupuesto; no declarar que no existe solución ni que su tiempo máximo sea de 6 segundos. **No** autoriza integración ni Etapa 3. La validación real de las Etapas 1 y 2 con `FloorPlanProjectV1` autorizado, escala real comprobada, comparación de D1–D3 y reevaluación del límite permanece **DEUDA TÉCNICA ABIERTA**.

### Cuatro reconciliaciones aplicadas sin alterar el catálogo

1. **250 verificaciones:** aceptación provisional registrada en #197; la validación real y aprobación de integración siguen pendientes.
2. **Inventario F12:** doce fuentes externas iniciales más cuatro verificadas adicionalmente = **16 fuentes verificadas**, y una URL no localizada; fuentes **no** equivalen a piedras. Solo R01–R03 formalizadas.
3. **Ola 2:** GOV-06a es transversal; IMG-04 figura en la ola 2 pero **no está asignada expresamente a uno de los cortes 2a–2f**. La asignación es PENDIENTE DE DECISIÓN, sin inventar corte 2g ni modificar IDs u olas.
4. **PR #192:** archivo de catálogo v1.10; la descripción histórica que menciona v1.6 debe indicar que esa fue una versión anterior. Esta auditoría consolida el estado sin reescribir decisiones del catálogo.

### Orden operativo autorizado como planificación, NO como autorización de ejecución

1. **Olas 0–1:** revisar y clasificar GOV-02 (PR obsoletas), completar GOV-03 (registro de capacidades), decidir GOV-04 (documentos), y realizar revisión documental de #192. Ninguna de estas tareas autoriza cerrar PR ajenas ni fusionar #192 automáticamente.
2. **Seguridad y entrega:** preparar la revisión humana de GOV-08 S1/S2 y #195 congelada, y del contrato ENT-01 #189; preservar S3/S4/S5, privacidad, navegadores reales y gates comerciales como pendientes independientes. No reanudar trabajo técnico de #195 por esta acta.
3. **MCP Etapa 2:** conservar F1/F2/F3 corregidos, evidencia y los dos workflows verdes de #197. La aceptación de 250 es solo de laboratorio; la validación con proyecto real autorizado sigue pendiente. HOLD etapas 3/4.
4. **SCULPT R01/R02-A/R03:** tres revisiones humanas **separadas**; decidir origen/permisos, ID maestro o falta de encaje, contrato, pruebas reales y aceptación de integración de cada una. No fusionar laboratorios ni crear nuevas piedras.
5. **Ola 2:** revisar ECO-01 #190 y medición/coste/aceptación real antes de elegir **un solo** corte 2a–2f conforme a sus dependencias. No activar olas 3–5 ni fijar precios sin datos.

**Modelo de colaboración:** el propietario decide prioridades, datos y autorizaciones; ChatGPT acompaña la coordinación, reconcilia estados y audita evidencias; Claude Code implementa o documenta exclusivamente encargos acotados y deja PR/CI/actas verificables. Ningún agente se autoaprueba un merge, gasto, publicación, despliegue ni cambio de etapa.

---

## 1. La situación actual en una frase

RUBIK ya tiene editor 2D/3D, importadores, edificio, presentaciones, biblioteca F3, variantes, entregas parciales, Render IA, presupuestos y obra 4D en `master`. Pero las tres piedras SCULPT R01–R03 están aisladas en PR Draft sin integración; la cadena comercial GOV-08/ENT-01 está desarrollada solo parcialmente en Draft; y MCP Etapa 2 está técnicamente corregida y validada en laboratorio, sin merge ni proyecto real autorizado. La cartera está descrita en olas 0–5; son grupos de decisión, no lotes que se ejecutan juntos.

**HEAD de `master`:** `75615fdc6c96e7c43e52b13a24950b9652706f7d`.

**PR abiertas:** 62 (incluyen muchas antiguas o apiladas, no 62 funcionalidades independientes).

**Catálogo v1.10:** 97 filas activas de mejora, más 6 registros descartados X-01–X-06. Estados documentales: 8 E (integradas), 28 P (parciales), 56 N (nuevas/no ejecutadas), 4 R (investigación), 1 advertencia histórica GOV-09a. Esta clasificación no se ha actualizado automáticamente para los cambios recientes en ramas Draft.

**Fuente del catálogo (baseline anterior a la consolidación):** https://github.com/Juanmaes83/floorplan-3d/blob/f48a930838149e88bb53b372cc798a12afb52646/docs/product/rubik-catalogo-maestro-mejoras-2026-11-09.md · **Versión viva para revisión:** https://github.com/Juanmaes83/floorplan-3d/blob/docs/sculpt-catalogue-reconciliation-2026-11-10/docs/product/rubik-catalogo-maestro-mejoras-2026-11-09.md

## 2. Comparación: producto integrado vs laboratorios

### Confirmado en el árbol de `master`

- `js/project-core.js`, `project-schema.js`, `tracing-core.js`, `layout-review.js`, `furniture-placement.js`, `room-layout.js`: geometría, modelo, trazado, revisión y colocación.
- `building-core.js`, `roof-core.js`, `exterior-core.js`, módulos de parcela, ortofoto y terreno: capacidades de edificio y contexto; no duplicar motores.
- `project-variants.js`, `project-library.js`: variantes seguras integradas por PR #30.
- Presentación y entrega: `presentation-*`, `client-share-ui.js`, `share-link-ui.js`, `tour-recorder.js`, `tour-video-ui.js`, `moodboard-ui.js`, etc.
- `api/render.js`, `api/share.js`, `api/view.js`: Render IA y publicación actuales, antes de integrar la cadena nueva GOV-08.
- C1–C4/BC3: `budget-*`, `bc3-budget-core.js`, `fiebdc3-codec.js`, `quantity-core.js`, `economic-dossier-*`.
- FT3D-8: `construction-*`, Gantt, dossier y MP4.
- MCP local en `tools/rubik-mcp/src`: ocho herramientas de lectura; PR #31/#40/#41/#43/#57 integradas.

Estar en `master` acredita integración de código, **no** aprobación automática de exactitud técnica, normativa, dispositivo real, coste o despliegue comercial.

### Fases Pascal que no hay que reconstruir

- Fase A/P1–P2, informe y revisión de distribución: PR #27 MERGED.
- Fase B/P4, captura 3D configurable: PR #29 MERGED, PNG 16:9/4:3/1:1/9:16, tamaño 1280/1920/2560 y restauración de vista. **Fuera del alcance integrado:** recorte manual, supermuestreo y etiquetas adicionales.
- Fase C/P5, variantes seguras: PR #30 MERGED.
- Fase D1/P6, MCP de lectura: PR #31 MERGED, con ampliaciones de Etapa 1.
- P3: búsqueda de colocación ya existente en RUBIK y MCP Etapa 2 Draft.
- P7: propuestas mediante diff/JSON Patch **no integradas**; MCP Etapa 2 solo propone posiciones; etapas 3 y 4 pendientes de decisión.
- P8 recetas paramétricas generales: no integradas; R03 es laboratorio específico.
- P9: RUBIK ya tiene niveles, cubiertas y escaleras propios; no trasplantar sistema Pascal.
- P10: demo/no extraíble según roadmap.
- P11: hardware/proveedores externos, investigación no aprobada.

**Fuente Pascal:** https://github.com/Juanmaes83/floorplan-3d/blob/master/docs/proposals/PASCAL-RUBIK-INTEGRATION-ROADMAP.md

## 3. Piedras SCULPT R01–R03

| Piedra | PR y HEAD | Estado | Pendiente para integrar |
|---|---|---|---|
| **R01** Reconocimiento/OCR | [#191](https://github.com/Juanmaes83/floorplan-3d/pull/191) `2158fd19207e4a33aeee8fed26d1b29be96103fa` | Laboratorio funcional; no validado sobre planos reales; HOLD | F2 en cinco sesiones/20 planos autorizados, OCR real, escala, validación, permisos GOV-05 por familia, decisión F2/G-01/G-06 e integración. |
| **R02-A** Techos/equipos | [#193](https://github.com/Juanmaes83/floorplan-3d/pull/193) `7d8a6269047ec714fcdc51cf308f28c2650b23dc` | Laboratorio; 25/25 tests; CI final 12/13 con excepción heredada; HOLD | Aceptación humana, GOV-05, contrato y geometría de producto, ID funcional y validación; R02-B no iniciado. No es MEP certificado. |
| **R03** Armarios paramétricos | [#194](https://github.com/Juanmaes83/floorplan-3d/pull/194) `fc5a4224f2a48be2f18cdb3a701240e21bd2269f` | Laboratorio completado; 98/98; CI 14/14; GO laboratorio/HOLD integración | Aceptación humana, contrato canónico para interiores, encaje F3/CAT-03, límites de hardware y fabricación; no es CAT-03 completo. |

**Catálogo SCULPT:** [#192](https://github.com/Juanmaes83/floorplan-3d/pull/192), v1.10, Draft. El commit `f48a930838149e88bb53b372cc798a12afb52646` es la baseline anterior a esta actualización documental, no el HEAD final de #192.

**Anexo de donantes:** https://github.com/Juanmaes83/floorplan-3d/blob/f48a930838149e88bb53b372cc798a12afb52646/docs/product/sculpt-metodologia-y-cartera-2026-11-10.md

**Otras familias:** 8 PR upstream identificadas, 12 repositorios externos del inventario inicial + 4 fuentes externas adicionales verificadas en F12 (**16 fuentes externas verificadas**, más una URL F12 no localizada), 2 forks propios y 11 familias adicionales; no son 11 piedras aprobadas ni nuevas olas. PR upstream #8 (editor), #9 (muebles) y #15 (elementos constructivos) son investigaciones candidatas. La “P4” de nubes de puntos en anexo §8.6 es distinta de P4 captura Pascal y no es una piedra formalizada. No inventar R04.

## 4. MCP Etapas 1–4 — ESTADO VERIFICADO A 12/11

- **Etapa 1:** ocho herramientas de lectura integradas en `master` mediante PR #31, #40, #41, #43 y #57. No se declara validada con proyectos reales de escala confirmada.
- **Etapa 2:** `propose_layout` y `RubikLayoutProposalV1` en [PR #196](https://github.com/Juanmaes83/floorplan-3d/pull/196), **HEAD `316487cd73a343b06eee4121d6a6e46e4298ed47`**, Draft, sobre `master`. F1/F2/F3 corregidos y 108/108 pruebas MCP. Checks del HEAD: test, project-first y Vercel, **3/3 success**.
- **Validación Etapa 2:** [PR #197](https://github.com/Juanmaes83/floorplan-3d/pull/197), **HEAD `0ce3c44b892b7ac8567fc242ab97bca823cc3527`**, Draft apilada sobre #196. 128/128 tests MCP en CI; project-first y Preview también verdes. El documento de validación informa 101/101 comprobaciones visuales locales con Playwright/Chromium, 78 capturas y tres vídeos, sin escritura. F1/F2/F3 comprobados con motor corregido. Pendiente prueba con un proyecto real autorizado y aceptación humana **para la integración**. El límite de 250 verificaciones completas por llamada está **aceptado provisionalmente SOLO para laboratorio** y debe reevaluarse con datos reales; no garantiza tiempo fijo.
- **Etapa 3:** simulación aislada de cambios, **no implementada ni autorizada**.
- **Etapa 4:** crear una variante revisable en archivo separado con confirmación, **no implementada ni autorizada**.

**IMPORTANTE:** Etapa 2 de MCP no equivale al ID maestro AG-2 completo, que pide propuestas por diff y experiencia de revisión. Ni las Etapas 3/4 se aprueban por tener CI verde.

Fuente: https://github.com/Juanmaes83/floorplan-3d/blob/master/docs/technical/local-mcp-roadmap.md

## 5. Olas: INVENTARIO DE LOS 97 CÓDIGOS ACTIVOS

Convención del catálogo: **E** integrada, **P** parcial, **N** nueva/no ejecutada, **R** investigación, **⚠** desviación histórica; los códigos en Draft pueden estar más avanzados que su estado documental.

### OLA 0 · Cerrar y ordenar — 10 códigos

- **E:** GOV-01a, GOV-01b, GOV-01c, GOV-09b, IMG-01, IMG-02.
- **P:** GOV-03 registro mínimo de capacidades integrado, falta registro global completo.
- **R:** GOV-04 selección de documentación de ramas.
- **N:** GOV-02 cerrar/clasificar PR obsoletas; hay 62 PR abiertas.
- **⚠:** GOV-09a no ocurrió antes del Promote, reconocido y acreditado con posterioridad.

### OLA 1 · Vender lo existente — 8 códigos

- **E:** HOM-01 y HOM-02 en `master` y documentados como publicados.
- **P:** GOV-08, ENT-02, OBR-01.
- **R:** GOV-05, ENT-01 (PR #189, contrato puro probado, sin integración).
- **N:** GOV-07 validación hardware real.
- **Detalle GOV-08:** [S1 #187](https://github.com/Juanmaes83/floorplan-3d/pull/187) `2e18161` CI 10/11 con excepción solo para revisión; [S2 #188](https://github.com/Juanmaes83/floorplan-3d/pull/188) `9c00c81` CI 5/5; [aislamiento #195](https://github.com/Juanmaes83/floorplan-3d/pull/195) `4903e0a` Draft congelada, CI GitHub navegador bloqueada por DNS, local sí probado. Sin merge ni autorización Production.
- **Faltan:** caducidad S3, cuotas S4, enlaces opacos/Blob privado S5, aprobación de pérdida de observaciones al recargar, Safari/Firefox/vídeo real, identidad GOV-06a, registro servidor y política de retención. Visita ENT-01 debe seguir sus propios gates.

### OLA 2 · Mejoras rápidas — 28 códigos

- **P (18):** ENT-04, IMG-04, IMG-05, IMG-06, IMG-08, IMG-12, UX-07, UX-22, UX-23, UX-25, UX-09, UX-05, UX-03, UX-04, OBR-02, OBR-03, G-06, ECO-01.
- **N (10):** GOV-06a, HOM-03, ENT-03, IMG-03, IMG-07, IMG-10, IMG-11, CAM-01, BIB-01, UX-08.

**Cortes ya documentados:**
- **2a Navegación 3D:** UX-22/23/25/05/09. Parciales; pulir y validar, no reconstruir.
- **2b Comparar:** UX-07 y ENT-04. Parciales.
- **2c Editor:** UX-03, UX-08, UX-04, G-06. UX-08 es nueva; el resto parcial.
- **2d Imágenes:** IMG-03, IMG-05/06/07/08, IMG-10/11/12, CAM-01. Coste y visuales con gates.
- **2e Obra:** OBR-02 y OBR-03. FT3D-8 ya existe.
- **2f Base comercial:** BIB-01, ECO-01, HOM-03 y ENT-03.

**Reconciliación de alcance:** `GOV-06a` es transversal en esta ola. `IMG-04` está en el inventario de la ola, pero no se asigna explícitamente a 2a–2f en la tabla del catálogo; asignación pendiente de decisión humana. No añadir corte nuevo ni asumir que forma parte de 2d por mera proximidad.

**Avance no integrado del 2f:** [ECO-01 #190](https://github.com/Juanmaes83/floorplan-3d/pull/190) `bea179f`, 6/6 CI verde, calcula estimaciones y concilia solo datos comparables. Falta integración, medición/aceptación real, persistencia y decisiones de precios. No implementa cuotas globales.

### OLA 3 · Nuevos servicios comerciales — 22 códigos

- **P (4):** VID-01, UX-11, UX-13, OBR-04.
- **N (18):** ENT-05, ENT-06, IMG-09, IMG-13, IMG-15, IMG-16, IMG-22, FOT-01, MUE-01, CAT-01, PRE-01, UX-12, UX-24, AG-0, AST-01, ECO-02, ECO-03, PER-01 (al final de ola 3).

**Dependencias destacadas:** FOT-01 y CAT-01 requieren GOV-05 y costes controlados; UX-12 depende de BIB-01; PER-01 va después de IMG-12 y ECO-01; ECO-02 y ECO-03 requieren datos reales y piloto. No confundir con servicios ya integrados.

### OLA 4 · Interoperabilidad/asistente — 14 códigos

- **P (2):** UX-10, UX-21.
- **R (1):** AG-1 (MCP consulta integrado parcialmente, no asistente completo).
- **N (11):** IMG-14, PER-02, PER-03, CAT-02, PAN-01, UX-26, OBR-05, G-01, G-08, G-02, AG-2.

**AG-2 documental sigue N**; existe trabajo MCP Etapa 2 Draft, pero **no diff/patch revisable en producto**. G-01, G-08 y G-02 son nuevas integraciones de auditoría/alineación/exportación DXF, no confundir con el importador DXF ya existente. PER-02 requiere protecciones específicas de privacidad y consentimiento.

### OLA 5 · Investigación y gran escala — 15 códigos

- **N (15):** GOV-06b, ENT-07, FOT-02, MUE-02, CAT-03, PAN-02, VID-02, LUZ-01, UX-14, G-07, G-04, AG-3, AG-4, AG-5, GEN-01.

**CAT-03** no queda hecha por R03; **LUZ-01** no queda hecha por R02-A; **G-04 LiDAR/foto/IFC a espacio métrico** no queda hecha por tener importación IFC y un visor 3D. Todas exigen decisión posterior expresa.

### Descartes

X-01–X-06 se preservan como registro documental de ideas descartadas, **no son seis tareas pendientes**.

## 6. Otras PR y deudas importantes

| PR/deuda | Estado |
|---|---|
| #192 catálogo SCULPT | Versión v1.10 en Draft, sin master; necesita revisión documental para consolidarlo. |
| #189 ENT-01 | Contrato puro 9/9, 6/6 CI; no hay UI/API integradas. |
| #190 ECO-01 | Motor puro corregido; CI 6/6; no hay medición de coste/aceptación comercial integrada. |
| #187 → #188 → #195 GOV-08 | Rama comercial apilada; sólo S2 y parte de aislamiento localmente comprobados; #195 congelada; sin merges. |
| #196 → #197 MCP Etapa 2 | GO técnico laboratorio en los nuevos SHA y CI verde; 250 verificaciones aceptadas provisionalmente solo para laboratorio; validación real y aceptación de integración pendientes; sin merge. |
| #191/#193/#194 SCULPT | Sin integración; permisos/contratos/validación humana pendientes según piedra. |
| `brand.browser` / `real-3d` | Flaky en 1440×900; excepción R02-A/S1 documentada, causa definitiva no demostrada. |
| DNS runner para #195 | `azure.archive.ubuntu.com` no resolvía al instalar Chromium, por lo que esas pruebas de CI no se ejecutaron. No declarar CI verde. |
| Dependencias MCP | Alertas transitivas (`body-parser`, `fast-uri`), revisar sin inferir seguridad total por usar stdio. |
| F2 reconocimiento | Falta validación autorizada con planos reales y escala; no prometer exactitud del OCR. |
| GOV-06a / datos | Identidad y cuotas por profesional, consentimiento, política de conservación, control y aislamiento de secretos. |
| K1–K11 | Matriz de conflictos en §4 del catálogo con casillas de decisión; no considerar todas aprobadas por aparecer una propuesta. |

## 7. Orden de trabajo aconsejado sin crear un roadmap nuevo

**Carril A: consolidación comercial, olas 0–1 (prioridad para entregar clientes)**

1. Clasificar PR antiguas (GOV-02) y decidir qué documentos se incorporan (GOV-04); completar GOV-03.
2. Revisar la cadena S1 #187 → S2 #188 → aislamiento #195 con sus gates, revalidación de CI y aceptación humana sobre observaciones y compatibilidad.
3. Proseguir ENT-01 #189 solo sobre dependencias seguras; mantener S3/S4/S5 y GOV-06a como cortes separados, sujetos a decisiones.
4. Cerrar OBR-01 y planificación de dispositivos GOV-07. No activar servicios comerciales sin condiciones.

**Carril B: validar lo ya hecho técnicamente (sin bloquear el carril A)**

5. Mantener el cierre sintético F1/F2/F3 de #196 + #197 con los SHA y checks verdes, documentando las 250 verificaciones ya aceptadas provisionalmente para laboratorio y la deuda de validación real. No aprobar merge ni iniciar Etapa 3 automáticamente.
6. Revisión humana SCULPT R01/R02-A/R03; decidir si alguna merece trabajo de integración, y documentar esquema, permisos y pruebas necesarias por familia. No inventar R04.
7. Revisar #192 (catálogo v1.10 y el presente informe) para decisión documental independiente; consolidar evidencia no implica autorización de merge.

**Carril C: ola 2, una mejora verificable por PR**

8. Revisar ECO-01 #190 para habilitar mediciones reales de coste y aceptación. Elegir después **un solo corte** entre 2a–2f, justificando valor, riesgo y dependencia.
9. Las olas 3–5 quedan como cartera, no como activación por lotes. Actualizar el registro de decisiones antes de comenzarlas.

**Separación fundamental:** La disponibilidad de una PR Draft, un check verde o una Preview no concede merge, Promote, Production ni autorización legal. El productor y la persona propietaria deben aprobar los gates específicos de cada corte.

## 8. Próximos datos pendientes para un estado verdaderamente comercial

- **Production Vercel:** comprobado el despliegue `dpl_9s9H2dUnxXb3UYK7yFovoYTPtFtj` `READY`, asociado a `master@75615fd` en la consulta del gate documental. Siguen pendientes la revisión funcional de Production, las variables y servicios por existencia/configuración **sin leer secretos**, y los gates de publicación comercial.
- Disponibilidad de proyectos reales con autorización y escala confirmada para F2/MCP.
- Aceptación comercial de borradores de observaciones no persistidos y política de enlaces antiguos.
- Política de privacidad/retención, permisos de assets y consentimientos.
- Métricas reales de coste/aceptación de Render IA.

## 9. Enlaces de referencia

- [Catálogo maestro v1.10 — PR #192](https://github.com/Juanmaes83/floorplan-3d/pull/192)
- [Documento de catálogo v1.10](https://github.com/Juanmaes83/floorplan-3d/blob/f48a930838149e88bb53b372cc798a12afb52646/docs/product/rubik-catalogo-maestro-mejoras-2026-11-09.md)
- [SCULPT](https://github.com/Juanmaes83/floorplan-3d/blob/f48a930838149e88bb53b372cc798a12afb52646/docs/product/sculpt-metodologia-y-cartera-2026-11-10.md)
- [Roadmap Pascal](https://github.com/Juanmaes83/floorplan-3d/blob/master/docs/proposals/PASCAL-RUBIK-INTEGRATION-ROADMAP.md)
- [Roadmap MCP](https://github.com/Juanmaes83/floorplan-3d/blob/master/docs/technical/local-mcp-roadmap.md)
- [Workflow](https://github.com/Juanmaes83/floorplan-3d/blob/master/docs/DEVELOPMENT-WORKFLOW.md)
- [Cierre R01 #191](https://github.com/Juanmaes83/floorplan-3d/pull/191)
- [Cierre R02 #193](https://github.com/Juanmaes83/floorplan-3d/pull/193)
- [Cierre R03 #194](https://github.com/Juanmaes83/floorplan-3d/pull/194)
- [GOV-08 #187](https://github.com/Juanmaes83/floorplan-3d/pull/187), [#188](https://github.com/Juanmaes83/floorplan-3d/pull/188), [#195](https://github.com/Juanmaes83/floorplan-3d/pull/195)
- [MCP Etapa 2 #196](https://github.com/Juanmaes83/floorplan-3d/pull/196), [Validación #197](https://github.com/Juanmaes83/floorplan-3d/pull/197)
- [ENT-01 #189](https://github.com/Juanmaes83/floorplan-3d/pull/189), [ECO-01 #190](https://github.com/Juanmaes83/floorplan-3d/pull/190)

**Procedencia:** la auditoría base adjunta se realizó en modo lectura. Esta consolidación modifica solo documentación en la rama Draft de #192 y su descripción; no modifica código, `master`, los laboratorios, ni Production, y no fusiona ninguna PR.