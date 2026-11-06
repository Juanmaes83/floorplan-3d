# RUBIK SOTA — Roadmap operativo reconciliado y matriz de cierre
## Corte documental: 5 de noviembre de 2026 · Sin autorización de implementación

> **Alcance:** reconciliación documental de `master`, roadmap histórico, traspaso maestro V2, PR/ramas activas y QA aportado. Este documento **no es un merge**, no modifica runtime, no aprueba costes API y no autoriza publicar en producción.
>
> **Regla de precedencia:** para el estado global posterior al 05/11, usar esta fotografía documentada y verificar de nuevo GitHub antes de cualquier decisión. Conservar todos los roadmaps de octubre como **historia fechada**; sus frases «siguiente FT3D-5», «FT3D-6 sin implementar» y «B2/B8 sin prueba real» están superadas.
>
> **Seguir a los agentes:** Claude aún trabaja en Section → Spatial Visit y la rama documental F03 aún cambia; los HEAD de este documento son **observaciones**, no una congelación de sus próximas entregas.
>
> **Autoridad humana:** ventanas F02 V2 aprobadas visualmente por el propietario, y minimapa/botones de Delivery V1 también. Ni una aprobación parcial ni el verde de CI autorizan merge o lanzamiento.

## A. Estado comprobado, con evidencia

- Repositorio: https://github.com/Juanmaes83/floorplan-3d
- `master` verificado: `0f9c6ead9732901681498efec326d1ca92e42ffe`, merge funcional de FT3D-6 / PR [#159](https://github.com/Juanmaes83/floorplan-3d/pull/159) (**MERGED**).
- Roadmap/cierre antiguo: `docs/product/roadmap-completion-matrix-2026-10-30.md` y `docs/product/current-status-2026-10-30.md` registraban estado de **01/11**. NO interpretarlos como estado actual.
- Fotografía de 02/11 más reciente, pero mantenida en **otra rama documental**, no en master: `docs/multi-agent-ops-status-2026-11-02:docs/product/current-status-2026-11-02.md`. No asumir `docs/ops/ACTIVE-WORKSTREAMS.md` en master: la lectura por ruta devolvió 404.
- Traspaso maestro y siete anexos consultados: `docs/product/rubik-traspaso-maestro-v2-2026-11-05.md`, `home-v2-content-audit-2026-11-04.md`, `evolution-preparation-gates-2026-11-04.md`, `ai-agent-b2-b8-technical-audit-2026-11-04.md`, `ia-imagenes-asistente-plan-maestro-2026-11-05.md`, `ia-costes-protocolo-unitario-lotes-2026-11-05.md`, `ia-servicios-foto-reforma-panorama-360-video-valor-comercial-2026-11-05.md` y `ia-costes-pruebas-registro-2026-11-05.csv`. Todos en la rama `docs/rubik-evolution-preparation-2026-11-04`.
- Base de donantes: `docs/product/ft3d-donor-global-reconciliation-2026-11-01.md`; Cuts 1–5 y manifiesto. Los donantes inspiran técnicas, no sustituyen la geometría, las rutas, los materiales ni los presupuestos de Rubik.
- Verificación remota de CI: Delivery #166 **10/10 checks success** en `cef06ff`; Visual F02 #167 **9 success, 1 cancelled** en `fe876c1`; Section `275bee` **1 check success**. No generalizar esas cifras a «producto entero verde».
- Branch protection de master: **NO VERIFICABLE con este conector** (403). Es una verificación pendiente del administrador, no afirmar protección actual/desactivación actual como hecho comprobado.

### Estados controlados

`INTEGRADO` = código en master; `IMPLEMENTADO EN RAMA` = no disponible en master; `QA REPORTADO` = pruebas declaradas y trazables, no inspección humana; `VISUAL_APROBADO` = aprobación explícita de un alcance; `VALIDACIÓN/PUBLICACIÓN PENDIENTE` = gate no cerrado; `PROPUESTO` = sin implementación acreditada; `DIFERIDO` = no bloquea release definido.

## B. Lo que YA TENEMOS — no volver a programar

| Subsistema | Estado en master@0f9c6ea | Autoridad / límite real |
|---|---|---|
| Editor 2D/3D, estancias/muros/huecos/mobiliario | INTEGRADO | `FloorPlanProjectV1`, geometría/renderer existentes; no se garantiza precisión certificada para cualquier plano |
| Importación multimodal y gestión de proyectos | INTEGRADO en los formatos/condiciones implementados | Seguir evaluando F1b/F2 con planos reales; importación DXF **no equivale** a exportación DXF |
| Edificio y dos plantas, exterior, emplazamiento/solar | INTEGRADO en alcance existente | No hay paseo real por escaleras ni cubierta inclinada universal |
| Fase A / A1–A4 (Project-First: vistas, análisis, dossier) | IMPLEMENTACIÓN INTEGRADA | Cierre humano/documental histórico todavía no debe suponerse automático |
| Fase B / B1–B8: offline cliente, render IA, vídeo, compartir, servicio de plano, comentarios, moodboard y variantes IA | CÓDIGO INTEGRADO | B4 tiene validación real; B2/B8 primera prueba real, **sin validación comercial integral** |
| Fase C / C1–C4 (cantidades, presupuesto, BC3, dossier económico) | INTEGRADO Y VALIDADO EN SU ALCANCE | Mantener autoridad económica existente; no crear otro motor para IA |
| FT3D-1 / plan reveal y room descent | INTEGRADO | Revisión de experiencia global puede seguir pendiente |
| FT3D-2 / Story engine | INTEGRADO Y VALIDADO | Misma autoridad de progreso, lifecycle, cámara y captions |
| FT3D-3 / sección dinámica | INTEGRADO Y VALIDADO EN SU ALCANCE | `sectionOpen` + clipping vertical real; **Section → Spatial Visit es una ampliación distinta** |
| FT3D-4 / alzado y fachada narrativa | INTEGRADO Y VALIDADO EN SU ALCANCE | No confundir con Hybrid Registered Elevation ni con F03 de materiales |
| **FT3D-5 / axonometría + exploded** | **INTEGRADO** | Ya no es «siguiente fase»; núcleo `js/presentation-axon-core.js` |
| **FT3D-6 / cinco plantillas profesionales** | **INTEGRADO — PR #159 fusionada** | `js/presentation-templates-core.js` y UI; transportar plantillas/Story completas a cliente aún tiene otro gate |

**Conclusión de B:** no necesitamos rehacer las fases A, C, FT3D-1..6 ni el importador existente por el mero hecho de que haya PR viejas abiertas. Necesitamos cerrar lo faltante, evaluar experiencia real, integrar ramas y documentar correctamente.

## C. Trabajo aislado en curso / candidato — no tocar ni fusionar ahora

| Línea | HEAD remoto observado | Qué existe y aprobación | Próximo gate |
|---|---|---|---|
| **Claude — Delivery 3D V1** [#166](https://github.com/Juanmaes83/floorplan-3d/pull/166) | `cef06ff78ae6f8654acfdf26305d512b1a9da7dc` | PR draft. Visita cliente, publicación/snapshot, minimapa plegable clicable y botones. **Minimapa y botones VISUAL_APROBADOS por propietario**; 10 checks CI success | Revisión integral de seguridad y producto, Story/FT3D-6 en entrega, móvil físico, rendimiento, integración y política de enlaces |
| **Claude — Section → Spatial Visit** | `275bee78a6531dac1a026337a6e40e51d03b30ca` | Rama `feat/section-spatial-visit-v1`. FT3D-3 reutilizada; R1–R3 con vídeos, `room-visit` y relevo a Recorrer; progress informa R4/browser 6/6, R5/regresiones pendientes. **EN DESARROLLO** | Esperar cierre Claude; revisión humana del vídeo/flujo, CI y QA conjunto. No dar por terminada esta noche |
| **Claude — Hybrid Registered Elevation** | `07ae6f9969cae9df746443e97410e40cee2e932a` | `feat/hybrid-registered-elevation-v1`, snapshot técnico `READY_FOR_REVIEW`, sin aprobación visual humana final | Revisar vídeo/capturas y defectos; después integración coordinada, no rediseñarlo de cero |
| **Kimi — Hero Fidelity F02 V2** [#167](https://github.com/Juanmaes83/floorplan-3d/pull/167) | `fe876c1c2016beafba48f1993b5c23ecb82f6814` | PR draft; ventanas de 2 familias, geometría/fachadas circundantes, cobertura 12/12; **VENTANAS VISUAL_APROBADAS por propietario**. CI 9 success, un check cancelled | Revisar run cancelado, regresión conjunta y dependencia/duplicación con CP2 (#164/#165); sin merge; fachada completa aún NO aprobada |
| **Biblioteca de referencias F03 (otra ventana)** | `6b8d9f33cbf5ada5f4e210777f195a73e4ddfa1c` | Rama `docs/f03-facade-visual-references-v1`: **12 PNG conceptuales sin clasificación visual, 13 albedos 4K, 9 mapas PBR**, 3 sets completos como fuente, índices/handoff. No son 36 escenas terminadas ni F03 renderizado | Clasificación, permisos de assets, optimización, referencias restantes y autorización separada para Kimi F03 |
| **B2/B8: compatibilidad API de imágenes** | `7e738ec7bf9c20acd4b5e4b71daf1a68136b4fed` | Rama `fix/b2-b8-gpt-image-25-compat-2026-11-04`; ensayo real de salón en Preview, CI 6/6 reportado. No merge | Revisar modelo realmente usado, exportación truncada, calidad/consistencia, seguridad y costes exactos antes de promoción |
| **Visual Families / CP2** [#164](https://github.com/Juanmaes83/floorplan-3d/pull/164), [#165](https://github.com/Juanmaes83/floorplan-3d/pull/165) | #164 `4091b92`; #165 `894607b` | Material/fundación y trazabilidad, drafts | Resolver dependencia con F02 V2, evitar doble incorporación |
| **Legal** [#161](https://github.com/Juanmaes83/floorplan-3d/pull/161) | `8d591bb` | Borrador documental, sin valor de términos publicados | Revisión jurídica, privacidad, derechos de terceros y autorización de publicación |
| **Coordinación multiagente** [#160](https://github.com/Juanmaes83/floorplan-3d/pull/160) | `91bb8d3` | Documentación de estado/operación en draft, no es master | Consolidar sólo después de reconciliar el estado más reciente; no copiar literalmente snapshots pasados |

**Otras experiencias distinguidas correctamente:**
- **Floor-by-Floor**: experiencia premium específica pendiente/reanudable. La existencia de FT3D-5 exploded por plantas NO demuestra que esa experiencia autónoma esté cerrada.
- **The Face**: experiencia premium de fachada/lectura visual, distinta de FT3D-4 alzado base, del Hybrid y de F03 PBR. Potencial reutilización entre ellas; no duplicar implementaciones. Estado actual: pausada, sin aceptación final documentada en este corte.
- **Section → Spatial Visit**: no es FT3D-3 base. Sigue trabajo actual de Claude.
- **F03 fachada**: familia de materiales/visual geométrico aplicada a paramentos reales; NO es The Face, NO es render IA 2D.

## D. Discrepancias que quedan reconciliadas — no arrastrar tareas antiguas

| Fuente/premisa anterior | Corrección operativa 05/11 |
|---|---|
| «FT3D-5 siguiente fase; FT3D-6 diseñado pero no implementado» en matrices 30/10 y status 01/11 | **AMBAS INTEGRADAS.** Removerlas de la cola de implementación, conservarlas en historia |
| «B2/B8 bloqueadas sin créditos ni primera prueba real» | **PRIMERA GENERACIÓN REAL SUCEDIÓ**, en Preview; coste unitario exacto, modelo efectivo, calidad comercial y cuotas siguen sin acreditarse |
| «360 formalmente diferido» 31/10 | Decisión histórica válida a esa fecha, pero **reabierto como estudio comercial** de panoramas y servicios premium el 05/11; NO implementado, NO bloqueante de release |
| «Kimi sin rama/trazabilidad» en documentos 04/11 | Existe F02 V2 PR #167, SHA fijo y aprobación humana limitada a ventanas; F03 biblioteca documental observada, sin implementación |
| «Claude sigue sólo en Entregas» | Delivery V1 está candidato; **Section → Spatial Visit es su misión actualmente activa**, Hybrid espera revisión |
| «Todas las PR abiertas son features pendientes» | GitHub muestra **50 PR abiertas**, con histórico apilado. Código de A/B/C y FT3D-1..6 puede estar ya en master a través de integraciones posteriores. **Auditar alcance/ancestría antes de cerrar administrativamente**; ninguna PR vieja implica reimplementación automática |
| «Un test de viewport móvil valida móvil físico» | NO. SwiftShader/Chromium emulado no certifica rendimiento, interacción real ni estabilidad de hardware móvil |
| «Render IA puede reemplazar fidelidad de modelo» | NO. Render IA es propuesta visual; F02/F03 y renderer conservan geometría real, colisiones, ventanas y escenas navegables |
| «Referencia F03 publicada equivale a familia implementada» | NO. 12 PNG sin clasificar + PBR fuente ≠ 36 referencias aprobadas ≠ receta ejecutable ≠ render visual aprobado |
| «Documento de contrato FT3D-6 dice implementación no autorizada» | Es snapshot anterior a su **merge real #159**, no autoridad vigente para declarar la funcionalidad inexistente |
| «Un historial local de publicaciones equivale a servicio multiusuario» | NO. Delivery necesita políticas de acceso, revocación, caché y recuperación entre dispositivos |

**Norma documental:** conservar todos los documentos antiguos, nunca borrar pruebas ni cambiar lo que fue verdad en su fecha; enlazar a este estado más reciente y marcar `HISTÓRICO_SUPERADO` en su uso operativo.

## E. Qué significa «terminar todo RUBIK» — tres definiciones diferentes

**E1 — Núcleo funcional de vivienda y economía (ya integrado).**
A/B/C + FT3D-1..6 están implementados en master en su alcance. Esto NO implica que todos los requisitos de calidad física, experiencia de cliente, uso comercial y privacidad estén cerrados.

**E2 — Primera entrega comercial profesional controlada (todavía NO cerrada).**
Incluye seguridad y estabilidad de producto, presentación y Entregar fiables, Home coherente con lo realmente disponible, reglas de cliente, QA en dispositivos reales, política legal y económica, integración de ramas aprobadas y mecanismos de soporte/regresión. Este es el **objetivo de cierre recomendable a corto plazo**, con alcance que el propietario deberá confirmar.

**E3 — Visión extendida premium (NO es condición automática de E2).**
Incluye asistente IA completo, edición conversacional, reforma sobre fotografía, escenas habitadas/referencias privadas, 360°, vídeo generativo, DXF export mejorado, foto→mueble, generación paramétrica de plantas, nuevas familias de render, FT3D-8, colaboración/portal, BIM/LiDAR, cubiertas diferidas. Requieren producto, presupuesto, pruebas y autorizaciones propios; «todos terminados» sin corte de alcance es una meta abierta.

**No existe un porcentaje fiable de «proyecto completo» ni una fecha de finalización demostrada a partir de los documentos. No inventarlos.**

## F. Gates restantes para E2 — primera entrega comercial

| Gate | Obligación concreta y aceptación comprobable | Estado / propietario |
|---|---|---|
| **G0 · Cerrar candidatos de agentes** | Esperar fin de Section; revisar Hybrid y Section visualmente; conservar aprobación F02 ventanas y Delivery minimapa/botones; exigir clips/QA del SHA final | **Pendiente — Juanma + Claude/Kimi** |
| **G1 · Integración segura** | Inventario de dependencias y resolución de diffs. Confrontar PR #166/#167, CP2 #164/#165, Hybrid y Section. Construir candidato conjunto sólo cuando Juanma lo autorice, comparar tests base/candidato, vídeo, visitas y restore | **Pendiente — sin autorización merge** |
| **G2 · Seguridad de entrega cliente** | Modelo de acceso, qué ve quien posee el enlace, caducidad/contraseña si se deciden, revocación y cachés, aislamiento de snapshots, límites de almacenamiento, historial recuperable/privacidad y borrado; prueba de enlaces reales | **Pendiente de decisión + QA** |
| **G3 · Story/plantillas hacia cliente** | Definir FT3D-7: serializar y reproducir de forma segura la Story/selección FT3D-6, no sólo orden de rooms. Paridad con presentación profesional o límites expresos al cliente | **Pendiente funcional** |
| **G4 · Hardware y calidad** | Pruebas físicas iOS/Android y desktop GPU, control de DPR/calidad adaptativa, accesibilidad, reduced-motion, latencia, contexto WebGL, memoria, carga y 5 ciclos; imágenes y vídeos antes/después | **Pendiente** |
| **G5 · Fidelidad arquitectónica** | Revisión F02 + CI cancelado; evaluar si F03 completa es gate comercial o mejora posterior por perfiles. Referencias verificadas/optimizadas; comparaciones antes/después de fachada completa sin geometría ficticia | **Pendiente de producto** |
| **G6 · Render IA seguro y medible** | Revisar compatibilidad Preview, resultado real en otras estancias, texto exportado truncado, modelo real, cuotas/ratelimits, autenticación, visibilidad de coste y límites de gasto; no llamar API sin autorización | **Pendiente** |
| **G7 · Home V2** | Rehacer experiencia de bienvenida sin cambiar `welcomeUpload`/`welcomeBlank`/`welcomeExample`; hero honesto, flujo 2D→3D real, cinco momentos, público profesional, ES/EN/ZH, móvil, accesibilidad y carga ligera. No anunciar drafts como disponibles | **Especificada, NO implementada** |
| **G8 · Legal/comercial** | Revisar #161 con profesional jurídico, políticas de privacidad/retención, licencias assets y donantes, consentimiento de imágenes, textos del servicio, ofertas/soporte/precio/cuotas antes de cobrar | **Pendiente** |
| **G9 · Evidencia y gobernanza** | Ensayo end-to-end importación→diseño→presupuesto→Story→Entrega, restauración/undo, coste y auditoría por cliente, informes actuales, limpieza razonada de 50 PR, verificar branch protection con admin; aprobar liberación | **Pendiente** |

**Mínimo para decidir fecha y alcance de E2:** cerrar G0, fijar alcance comercial de G3/G5/G6, entonces priorizar G1/G2/G4/G7/G8/G9. No convertir F03 ni todo el plan de IA en bloqueantes tácitos de la primera entrega si Juanma no lo decide.

### Riesgo de integración demostrado por comparación de archivos

Se han observado cambios **concurrentes en `index.html`** en las cuatro líneas: Delivery, Kimi F02, Hybrid y Section. `js/presentation-ui.js` es compartido por F02/Hybrid/Section. `js/presentation-story-core.js` lo modifican Hybrid y Section. **Esto confirma solapamiento de archivos, no conflictos de merge ya demostrados.** Nunca fusionar PR simultáneamente sin preparar resolución específica, QA y autorización.

No tocar la rama de otro agente para «anticipar integración». Trabajar después sobre una rama de integración autorizada, desde HEAD de master entonces vigente, con PR y evidencia revisada.

## G. Roadmap propuesto tras cierre de agentes (NO autorizado para ejecutar aún)

### Etapa 0 — Esperar y revisar
1. Claude termina R4/R5 de Section y deja remote HEAD/PR/evidencia. Evitar consumo innecesario en volver a hacer FT3D-3.
2. Juanma revisa vídeos de **Hybrid y Section**; registrar defectos reales/aceptación.
3. Revisar #167 en su alcance de ventanas ya aprobado, anotar check cancelado y plan de cobertura conjunta. No disparar F03 automáticamente.
4. Consolidar evidencias de referencia F03 y clasificar 12 PNG/3 PBR completos; no afirmar 36 escenas. Verificar licencia antes de usarlas.
5. Solo con resultados, elegir componentes que entrarán en E2.

### Etapa 1 — Seguridad e integración
1. Inventario de archivos solapados, ownership y orden de incorporación.
2. Proyecto demo/fixtures representativos: vivienda simple, irregular, dúplex y proyectos de importación.
3. Integrar en entorno aislado sólo ramas autorizadas, sin cambiar esquema ni fuentes constructivas.
4. Tests focalizados + batería completa + QA visual/temporal + restauración + pérdidas WebGL.
5. Decisión humana de merge por PR, una a una, con estado GitHub exacto. Producción separada del merge.

### Etapa 2 — Cierre funcional de cliente/FT3D-7
1. Story / FT3D-6 en entrega, con límites claros del snapshot.
2. Seguridad de enlaces, acceso, retirada, borrado y trazabilidad.
3. Móvil físico, rendimiento adaptativo, foco/teclado y accesibilidad.
4. Experiencia Entregar/Cliente consistente con presupuestos, dossier, galería y vídeo existentes; no crear un segundo panel.
5. QA y aceptación comercial final.

### Etapa 3 — Calidad comercial y economía de IA
1. Home V2 sobre la bienvenida existente.
2. Render IA B2/B8: corregir exportación, confirmar modelo, coste de intento/lote/aceptada y experiencia de usuario, con prueba de uso real sólo autorizada.
3. Seguridad de proveedor: secrets servidor, autenticación, cuotas, límites, conciliación con facturación, auto-reload OFF no basta.
4. Textos legales, privacidad, límites de precisión y elección de paquetes/precios aprobados.
5. Validación completa de flujo comercial, soporte y rollback.

### Etapa 4 — Servicios premium futuros, sólo mediante nuevos gates
- **Estudio de imágenes:** IMG-01..IMG-22, materiales/estilos/luz, modo fiel/equilibrado/creativo, variantes y fichas, sin mutar proyecto.
- **FOT-01:** reforma de fotografías reales con conservación seleccionable, antes/después y transparencia de lo inferido; no equivale a generar geometría editable.
- **FOT-02:** foto→espacio medible/editable requiere medidas externas y validación; posterior a FOT-01.
- **Personas:** genéricas antes de referencias de clientes; consentimientos explícitos, retención/borrado y protección especial de imágenes de menores.
- **PAN-01/PAN-02:** panorama IA conceptual vs panorámica derivada de geometría real; la visita interactiva 3D actual es un tercer producto. 360 reabierto para estudio comercial, no automáticamente autorizado.
- **VID-01/VID-02:** edición de vídeos con imágenes existentes vs vídeo generativo de proveedor, con costes/derechos/coherencia temporal diferenciados.
- **Asistente IA AG-1..AG-5:** lectura sin modificación → propuestas tipadas → simulación/validación → confirmación/Undo → consumo autorizado de servicios. Nunca segundo editor, presupuesto ni autoridad 3D.
- **DXF export:** no inferir de DXF import; capas, unidades, compatibilidad lector independiente y reimportación acotada.
- **Foto→mueble 3D y plantas paramétricas:** pilotos con escala, colisiones, medidas/validadores, revisión humana.
- **FT3D-8, cubiertas diferidas, BIM/LiDAR, colaboración, portal y white-label:** backlog estratégico futuro, no bloqueantes implícitos E2.

No estimar precios ni duraciones sin datos de uso y alcance aprobados. El registro `ia-costes-pruebas-registro-2026-11-05.csv` conserva valores de coste faltantes EN BLANCO: **nunca sustituirlos por cero ni por 0,02 USD inferidos de una captura mensual**.

## H. Seguimiento operativo — no dejar tareas huérfanas

| Identificador | Estado actual | Responsable de siguiente decisión | Gate de salida |
|---|---|---|---|
| `RUBIK-AGENT-SECTION` | Claude implementando R4→R5 | Juanma revisa vídeo tras handoff | PR/evidencia/QA y aprobación humana |
| `RUBIK-AGENT-HYBRID` | Preparado revisión | Juanma | Registro de defectos/aprobación o iteración acotada |
| `RUBIK-AGENT-DELIVERY` | Visual aprobado mapa/botones, producto no cerrado | Juanma + coordinación técnica | G2/G3/G4 completados o alcance explícitamente limitado |
| `RUBIK-AGENT-F02` | Visual aprobado ventanas, branch draft | Juanma + integración | Resolver un check cancelado y regresión conjunta |
| `RUBIK-DOCS-F03` | Biblioteca parcial, sin F03 implementado | Juanma + quien prepara referencias | Clasificación/QA/licencia y nuevo mandato |
| `RUBIK-HOME-V2` | Diseño documentado, no implementado | Juanma | Alcance comercial, QA visual, textos reales |
| `RUBIK-B2B8` | Prueba Preview real, sin coste unitario | Juanma + técnico IA | Instrumentación/coste/límites/consistencia |
| `RUBIK-FT3D7` | Pendiente, no duplicar Story | Juanma + coordinación técnica | Contrato de entrega Story aprobado |
| `RUBIK-LEGAL` | Borrador #161 | Juanma + asesoría jurídica | Texto validado y publicado expresamente |
| `RUBIK-LEGACY-PRS` | ~50 PR abiertas, varias históricas | Coordinación Git | Inventario de ancestría, cierre consciente y sin pérdida |
| `RUBIK-QUALITY-REAL` | Datos F1b/F2 y móvil físico incompletos | QA/propietario | Pruebas con viviendas/medidas/dispositivos reales |

## I. No acciones y próximo disparador

**Hasta nuevo mandato de Juanma:**
- No pedir nuevos trabajos a Claude/Kimi; no reabrir sus ramas.
- No fusionar, desplegar, activar producción, cambiar claves, consumir API, ni crear tareas de pago.
- No convertir F03, Home o asistente en trabajos iniciados por este documento.
- Esperar handoff Claude y revisión humana Hybrid/Section.
- Revisar siempre nueva fecha/HEAD/CI/PR, porque la actividad de agentes puede continuar y esta matriz quedará fechada.

**Próxima acción autorizable sólo después:** revisión humana de clips y evidencias; documento de integración con gates exactos para PR candidatas, sin tocar producción hasta decisión separada.

**Principio rector:** Rubik ya resuelve mucho del flujo profesional. La prioridad no es sumar ideas sin fin, sino **unificar, validar, comercializar de forma segura y entregar una vivienda real sin perder autoridad geométrica, economía ni confianza**.


---

## Adenda 05/11/2026 — FT3D-8 obligatorio para E2 (decisión posterior del propietario)

**Autoridad temporal:** esta adenda refleja una decisión posterior y expresa del propietario, y prevalece **exclusivamente en la clasificación y gates FT3D-8**, sin borrar ni reescribir los hechos históricos E2/E3 del corte original. No convierte automáticamente otras funciones premium E3 en obligatorias para E2.

- **Decisión vigente:** FT3D-8, incluyendo la integración comercial S4 necesaria para una evolución y entrega auténticas, es **requisito E2**. El epígrafe histórico «FT3D-8» bajo E3 en §E y §G queda **superado en este punto**, no eliminadas las demás capacidades E3.
- **S1 / Gate D:** los motores de expediente y experiencia 4D existen en rama aislada. GD-UX-01 se corrigió en `b12b9252fe1df5adb06cea5b17cde48642a893b2`; **el propietario aprobó visualmente esa Preview el 05/11/2026**, y la CI del mismo SHA `42118973111` terminó en `completed/success`, comprobado posteriormente. Gate D queda cerrado para el alcance UX/4D de esa rama, sin aprobar integración, merge ni Production.
- **Pendiente para E2:** S2 BCCA gestionada (condicionada a permisos acreditados), S3 Catastro directo (con GML local como alternativa y servicio oficial verificado), S4 biblioteca + presupuesto + planificación + visor + marca + Entregar + experiencia cliente. El alcance obligatorio exacto de activación BCCA gestionada y de publicación remota debe respetar los gates y decisiones del propietario; no hacer una excepción implícita a la política de acceso.
- **Requisito de integración:** un proyecto **guardado** de RUBIK debe poder vincular su presupuesto, plan, parcela cuando procede y evolución, generar MP4/HTML con snapshot histórico y ofrecer acceso cliente solo cuando se haya autorizado. El laboratorio con archivos manuales no equivale a cierre E2.
- **Fuente documental de referencia (borrador en revisión):** [FT3D-8 Documento Maestro E2 v1.1](./ft3d-8-e2-documento-maestro-borrador-v1.md). Conserva 16 capítulos, 41 requisitos, 24 escenarios QA y las dos misiones M1 (S2+S3), M2 (S4). Su publicación en rama documental no autoriza implementación compartida, merge, Production, publicación real ni cambios en ramas de otros agentes.
- **Responsables:** Claude Code 2 (FT3D-8), Claude original (PR #166 Entregar), Kimi (contrato de mallas) y propietario (decisiones, gates y aprobación final), sujetos al mandato específico y la coordinación de archivos.
- **Historia preservada:** los demás gates de E2 y la distinción E3 del corte original no quedan automáticamente cerrados ni modificados por esta adenda.

**Estado documental de esta adenda:** actualización de prioridades; pendiente de aprobación del contenido definitivo del Documento Maestro por el propietario.


---

## Adenda 06/11/2026 — HOME-UX-E2 · Home adaptativa por profesión y descubrimiento de capacidades

**Decisión expresa del propietario:** incorporar al roadmap documental la mejora de Home para mostrar las capacidades reales de RUBIK y adaptar el contenido prioritario a la profesión elegida. **Autorización documental, no autorización de implementación ni merge.**

**Documento normativo de esta línea (versión de preparación):** [HOME-UX-E2 — requisitos y QA](./home-ux-e2-roadmap-2026-11-06.md).

- **Objetivo P0 de producto:** la Home existente (`js/guide-ui.js::buildWelcome()`) debe mostrar qué aporta RUBIK a arquitectura, inmobiliaria, promotora, reformas e interiorismo. La profesión cambia hero, demostración, ventajas/orden y CTA relevante, **no el modelo, permisos, presupuestos ni las herramientas disponibles**.
- **Base a conservar:** tres entradas principales Subir plano / Crear desde cero / Probar ejemplo; selector de profesión opcional en `rubik-professional-audience-v1`; ejemplo 2D/3D real; cinco áreas Diseñar / Analizar / Presupuestar / Entregar / Mi estudio. No duplicar aplicación, navegación ni motores.
- **Disciplina comercial:** un registro de capacidades con evidencia, SHA, permisos y estados `INTEGRADO_VERIFICADO`, `INTEGRADO_CON_CONDICIONES`, `EN_VALIDACION`, `EN_PREPARACION`, `BLOQUEADO_PERMISOS` y `NO_SOPORTADO`. No anunciar como integradas FT3D-8 S4, Catastro directo, BCCA gestionada, PR #166 ni otras ramas con CI verde pero sin integración y gates.
- **Primer corte H1, aún no encargado:** **14 requisitos HOME-UX-E2-01…14 y 18 casos HUX-QA-01…18**, con pruebas por perfil, claims, navegación, permisos, ES/EN/ZH, 1280×720/1366×768/1440×900/1920×1080, móvil 390×844/844×390, zoom y regresiones.
- **Otras hipótesis con alcance separado:** panel contextual + KPI y preflight de modificaciones (P0 candidatos); filtros de muebles, recetas de estilo, amueblamiento local y modos 3D (P1); iluminación y tipología asistida (P2); randomización global controlada (P3). No incluirlas de forma implícita en H1 ni declarar implementadas capacidades observadas únicamente en el benchmark Floorcraft.
- **Independencia y secuencia:** FT3D-8 M1 S2+S3 continúa sin cambios; S4 conserva sus dependencias, y Home H1 necesita encargo propio y coordinación de la bienvenida/UI compartida. **La clasificación como bloqueo obligatorio de release E2 requiere decisión posterior del propietario.**
- **Gates:** catálogo comercial fiel a master/QA, funcionalidad real, aprobación visual del propietario, seguridad y autorizaciones separadas para merge y Production.
- **Antecedentes:** `docs/product/home-v2-content-audit-2026-11-04.md`, Punto 9 y el PDF Floorcraft vs RUBIK SOTA (material de referencia aportado por propietario, no una demostración de capacidades en master).

**Seguimiento operativo:** `RUBIK-HOME-V2` pasa de «diseño documentado» a «HOME-UX-E2 plan documentado con requisitos y QA; implementación H1 no encargada». No elevarlo a implementado hasta nuevo mandato.

---

## Adenda 06/11/2026 — Reconciliación posterior a M2/S4 y prioridad P1 documental

**Precedencia:** esta adenda posterior complementa la tabla histórica de agentes, etapas y gates y **no elimina tareas ni reescribe fechas anteriores**. Los estados de las secciones precedentes que anuncian S4/M1 como no iniciados son una instantánea obsoleta, no una orden vigente. [Documento Maestro FT3D-8 v1.1 — adenda D M1/M2/S4](./ft3d-8-e2-documento-maestro-borrador-v1.md) conserva los 41 requisitos originales y 24 QA e incorpora diez gates `S4-GINT-01…10` y diez pruebas `S4-INT-QA-01…10` adicionales, sin renumeración ni aprobación final.

**Estado comprobado 06/11 (rama/commit):** `master@840189407cb63a996a71e47f14ad8931a3dcfb4a`; Gate D `b12b925` con CI y aprobación visual del propietario; M1 `970ca54` implementado técnicamente (S2/BCCA gestionada bloqueada; S3 Catastro real acreditado en M1 con límites); M2/S4 `49e8feb`, CI [42209990134](https://github.com/Juanmaes83/floorplan-3d/actions/runs/42209990134) verde y [Preview READY](https://floorplan-3d-nai78rskz-juanma-espinosas-projects.vercel.app/) protegida, **sin merge ni aprobación visual M2**. La rama M2 y master divergen 54/37 commits desde `0f9c6ea`. La superposición de archivos incluye `index.html`, pero **no** excluye incompatibilidades de estado, orden de scripts, módulos, selección de proyectos o visor. Section/visita espacial avanzó en master; PR #166 Entregar, #167 visor y #169 F03 siguen abiertas/draft. No duplicar S1, Gate D, M1 ni S4.

**Orden operativo vigente (planeamiento, no ejecución de código):**

| Prioridad | Línea | Condición de aceptación / responsable |
|---|---|---|
| **P0 inmediata** | M2-GATE-09: revisión humana escritorio/móvil de Preview `49e8feb` | Propietario. Tres incidencias `M2-UX-MOB-01/02` y `M2-UX-DEMO-03` **detectadas en capturas, aún pendientes de confirmación funcional**; no ordenar cambios sobre un mecanismo de navegación sin probarlo interactivamente. Exclusivamente capturas auténticas de RUBIK, cada una con SHA y viewport. |
| **P1 en paralelo** | Consolidación Maestro FT3D-8 y estados S4, M1/M2, 10 gates + 10 QA, decisiones y excepciones | ChatGPT en rama documental aislada; **no modificar código**, no sobrescribir histórico ni declarar aprobado el borrador. La adenda D referencia los SHA y fuentes originales. |
| **P1 condicionado** | Correcciones mínimas M2 (solo si los defectos se confirman y el propietario autoriza) | Claude Code 2 en su ámbito autorizado; cubrir botones nuevos del panel de selección 3D y vuelta Presupuestar → Evolución tras cambiar datos, con QA, nuevo SHA, CI completa y evidencias visuales. |
| **P1 planificación** | Ensayo aislado con `master` actualizado, Section y propietarios de contratos (economía, biblioteca, editor, territorio, marca), coordinación con Entregar/Kimi | Regresión conjunta **funcional**, no solo conflicto Git: inicialización, scripts, estados/modes 3D, visita espacial, identidad/proyecto, presupuesto C1–C4, plan, Evolución, vuelta y entrega. Sin merge sin decisión expresa. |
| **P1 gates E2** | DEC-05/06/07; FT8-S4-10 Kimi; PR #166; derechos BCCA; Catastro/licencias; QA-21/22; seguridad y cliente | **Abiertos/bloqueados/no ejecutados según alcance**. DEC-06 edificio sin total ficticio y comunes únicos, DEC-07 revisión `unverifiable`, cliente sin publicación, BCCA `rubik-managed` desactivada. Ningún gate se cierra por CI verde. |
| **Backlog conservado** | [HOME-UX-E2](./home-ux-e2-roadmap-2026-11-06.md) y las demás líneas históricas E2/E3 | 14 requisitos HOME-UX-E2 y 18 QA HUX; H1 no encargado ni comercialmente disponible. Conservar además Entregar/FT3D-7, legal #161, B2/B8, calidad real y propuestas premium E3, cada una con su gate propio. |

**Prohibiciones:** no merge/rebase/cherry-pick, Production, activación de enlaces de cliente, BCCA gestionada, servicios legales/de pago/IA, cambios de licencias/dominios, publicación de proyectos reales ni modificación de ramas de otros agentes sin autorización explícita. Cualquier estado aceptado debe citar prueba, SHA y aprobación competente. **FT3D-8 desarrollado en rama ≠ terminado para E2.**
