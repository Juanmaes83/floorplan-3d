# RUBIK SOTA · Auditoría independiente de estado real y punto de continuidad

> **ACTUALIZACIÓN DE MÁXIMA PRIORIDAD · 22/11/2026 · ADENDA v1.2 — #313 NO-GO DE ACEPTACIÓN HUMANA.** Esta adenda **prevalece** sobre cualquier valoración anterior de «lista para merge», «GO técnico» o «aprobada visualmente» aplicada a Simulator B #313. El corte v1.1 y el cuerpo v1.0 se mantienen abajo **íntegros como historial**, no como autorización vigente. Revalidar GitHub/Preview antes de actuar.

### Adenda v1.2: incidencia funcional y UX confirmada por revisión humana de Simulator B #313

**Decisión del propietario tras revisión real: NO-GO para fusión y despliegue de #313.** Existe una incidencia de descubribilidad y acceso a **«Grabar vídeo»** en la experiencia de Presentación con escenas narrativas. La CI en verde **no levanta este bloqueo**. No corregir por desmarcar opciones ni atribuirlo al usuario.

**Identidades comprobadas en GitHub al registrar el corte:**
- Repositorio: `Juanmaes83/floorplan-3d`. `master@c355bdf8e5716a634a6c9835df4aec3c3b86ba3b` (contiene la auditoría #314); el contenido de este informe en `master` conserva v1.0 hasta la eventual fusión documental de #315.
- [PR de producto #313](https://github.com/Juanmaes83/floorplan-3d/pull/313): `OPEN / DRAFT / NO MERGED`; HEAD `4d2eee7859ee0bc4922c2b0adb817678cbb99c66`; árbol citado y verificado en v1.1: `2692e9433e918c070f86db691a4db9fc035b9826`. El HEAD de Codex puede cambiar tras la corrección: no ejecutar operaciones usando estos SHAs sin volver a consultarlos.
- CI publicada para ese HEAD: 30/30 workflows `success`; 93 check-runs = **92 `success` + 1 `skipped`**; no hay aceptación funcional humana solo por esa CI. [Preview del HEAD examinado](https://floorplan-3d-oy95100ew-juanma-espinosas-projects.vercel.app) estaba `READY`. **NO autoriza Production**.
- [PR documental #315](https://github.com/Juanmaes83/floorplan-3d/pull/315): `OPEN / DRAFT`; esta actualización debe mantenerse en su **misma rama documental**, sin crear PR duplicadas y sin modificar la rama #313.

**Caso de usuario (evidencia de revisión humana, no de suite automatizada):**
1. Abrir la Preview de #313 y el proyecto de ejemplo desde el editor 3D.
2. Pulsar **«Presentar mi vivienda»**.
3. Activar las opciones narrativas disponibles: **«Empezar desde el plano»**, **«Incluir sección dinámica»**, **«Sección → visita espacial»** y **«Alzado/fachada narrativa»**, según disponibilidad de la configuración concreta.
4. Pulsar **«Iniciar presentación»** y observar/recorrer la escena 3D.
5. Buscar **«Grabar vídeo»** sin recurrir a herramientas de desarrollo.
6. **Resultado observado por el propietario en vídeo aportado durante la revisión:** el acceso no se encuentra; la tarjeta/herramientas no resultan visibles en los momentos revisados. El archivo MP4 es evidencia humana proporcionada en la conversación, **no está alojado en el repo**; no declarar que su reproducción automatizada se haya ejecutado.

**Hallazgos de código, verificados directamente sobre #313@4d2eee78 (distinguir causa y alcance):**
- [`js/tour-video-ui.js` líneas 22–27](https://github.com/Juanmaes83/floorplan-3d/blob/4d2eee7859ee0bc4922c2b0adb817678cbb99c66/js/tour-video-ui.js#L22-L27): el botón `#presentationVideo` se crea dentro de `#presentationTools`. `open.hidden=!byStopsType` y, después de la detección asíncrona, `open.hidden=!cineOK&&!byStopsType`. **Confirmado en código:** puede desaparecer por falta de formatos; el `catch(()=>{})` no informa del motivo. **No demostrado:** que esa condición de códec sea la causa exacta del recorrido humano.
- [`index.html` líneas 524–525](https://github.com/Juanmaes83/floorplan-3d/blob/4d2eee7859ee0bc4922c2b0adb817678cbb99c66/index.html#L524-L525): `.presentation-overlay[data-story="playing"] .presentation-card-body > :is(.presentation-controls,.presentation-stops){display:none}`. **Causa estructural demostrada:** los controles, incluido «Grabar vídeo», se ocultan durante `playing`.
- [`js/presentation-ui.js` líneas 809–815](https://github.com/Juanmaes83/floorplan-3d/blob/4d2eee7859ee0bc4922c2b0adb817678cbb99c66/js/presentation-ui.js#L809-L815): el componente pone `data-story=playing/paused/end`; su texto pide pausar para ver herramientas. Eso **no satisface** la exigencia humana de acceso visible y comprensible durante la historia.
- [`index.html` línea 423](https://github.com/Juanmaes83/floorplan-3d/blob/4d2eee7859ee0bc4922c2b0adb817678cbb99c66/index.html#L423): `data-walking=true` oculta la **tarjeta completa** mientras se usa la visita espacial. **Posible factor adicional, no causalidad demostrada para el vídeo concreto**. También deben inspeccionarse `data-route`, el contenedor `#stage`, CSS calculado, clipping y estados asíncronos.
- [`js/tour-video-ui.js` líneas 31–34](https://github.com/Juanmaes83/floorplan-3d/blob/4d2eee7859ee0bc4922c2b0adb817678cbb99c66/js/tour-video-ui.js#L31-L34): cámara moviéndose, grabador ocupado, vista previa y lote activos bloquean el botón. **No se deben desactivar los bloqueos seguros**; sí explicar el estado y conservar la posibilidad de localizar la función.

**Corrección acotada solicitada a Codex (NO consta ejecutada ni desplegada al publicar esta nota):**
- Trabajar **solo sobre la rama existente de #313**, conservando historial, sin PR duplicada, reset ni force-push; verificar HEAD remoto inmediatamente antes de cada escritura.
- Diagnosticar el recorrido anterior con Playwright + inspección de `#presentationOverlay`, `.presentation-card`, `#presentationTools`, `#presentationVideo`, ancestros ocultos, estilos calculados, viewport, foco, códecs y estados `playing/paused/end/walking/route/moving`. Separar **reproducido / confirmado en código / hipótesis / NOT_RUN**.
- Mantener una acción reconocible **«Grabar vídeo»** durante la experiencia narrativa, con disponibilidad real y razón visible cuando esté temporalmente bloqueada; al faltar ambos formatos, explicar la incompatibilidad, no ocultar sin aviso. Una autoridad funcional, sin duplicaciones ni nueva barra flotante innecesaria.
- Preservar los dos motores (**«Por paradas» y «Cinematográfico»**), H.264/MP4 1280×720 y 30 fps del modo cine cuando soportado, WebM cuando proceda, edición, cámara, Escape, regreso, descargas con los mismos bytes y restauración del proyecto.
- Verificar: narración activada y desactivada, playback/pausa/final, visita y retorno, estados incompatibles, escritorio y móvil (incluidos 1440×900 y 390×844), teclado y accesibilidad; Chromium, Firefox y WebKit; reproducción/descarga real de cada modo compatible y casos negativos. CI con pruebas de interfaz **visibles**, no solo aserción de existencia en DOM.
- Preparar **nueva Preview READY ligada al nuevo HEAD**, capturas/evidencias y aceptación humana explícita. **No fusionar #313 ni desplegar Production** por esta orden.

**Gate concreto para levantar NO-GO:** (1) el usuario identifica el acceso sin indicaciones externas incluso al activar las cuatro opciones narrativas; (2) los estados de incompatibilidad/espera tienen causa visible; (3) cada modo compatible graba, previsualiza y descarga sin alterar el proyecto; (4) teclado/móvil funcionan; (5) CI, pruebas negativas, SHA, árbol, diff y Preview verificables; (6) el propietario aprueba **el HEAD corregido exacto**. Hasta entonces: `NO-GO FUNCIONAL + UX`, incluso si CI/Preview dicen `SUCCESS/READY`.

**Coordinación y riesgos:** #310 A0 mantiene su **NO-GO de concurrencia** independiente; no tocar persistencia, migraciones o pruebas de A0. UX-312 PERLA sigue en LAB y puede solaparse con `index.html` / `js/presentation-ui.js`: documentar compatibilidad, no integrar PERLA en #313. No reabrir #311 HERO ni crear un grabador paralelo. Un eventual merge aprobado de #313 exige **nuevo corte de continuidad** con SHA real, CI/Preview y aceptación, no reescribir retroactivamente la incidencia.

---


> **ACTUALIZACIÓN POSTERIOR AL CORTE ORIGINAL · 22/11/2026 · POST-#314 / #313 / UX-312 / A0.** Esta entrada es la **fotografía operativa más reciente de este archivo**; el cuerpo de v1.0 que aparece después sigue íntegro como histórico y sus SHAs, contadores y estados de PR corresponden a su fecha. **Volver a consultar GitHub antes de ordenar un nuevo corte.**

### Adenda v1.1: estado verificado tras la integración documental #314

**Referencia nueva:** `master@c355bdf8e5716a634a6c9835df4aec3c3b86ba3b`. [PR documental #314](https://github.com/Juanmaes83/floorplan-3d/pull/314): **FUSIONADA** a 22/11/2026 15:35:37 UTC, con esta auditoría y los enlaces desde Continuidad y Handoff. El informe v1.0 partía de `3d3992c…`; no tratar ese SHA como master vigente. La fusión de documentación por sí sola no autoriza ninguna otra integración.

**M11 / Simulator B — candidata nueva, NO fusionada al elaborar esta adenda:**
- [PR #313](https://github.com/Juanmaes83/floorplan-3d/pull/313) `OPEN/DRAFT`, `mergeable=true`, base GitHub actual `master@c355bdf8e5716a634a6c9835df4aec3c3b86ba3b`, HEAD `4d2eee7859ee0bc4922c2b0adb817678cbb99c66`, árbol `2692e9433e918c070f86db691a4db9fc035b9826`. Padres del HEAD: `c355bdf8e5716a634a6c9835df4aec3c3b86ba3b` y `80911c6cdf11ac22c806b14bf324b2d9a6400a5c` (candidata aceptada visualmente). El SHA del objeto de merge prospectivo es `8d5a202c38867e1fef1b90dbe16f627ab5222368`; no confundir con un merge realizado.
- **Verificación independiente vía GitHub:** 30/30 workflows `success` para el HEAD; **93 check-runs totales = 92 `success` + 1 `skipped` de `full-regression`** y 0 fallos o pendientes. La frase del agente «93 checks aprobados y 1 omisión» no coincide literalmente con el endpoint de checks; este documento adopta el recuento directo 92+1 sin desmerecer los 30 workflows.
- **Comparación directa del master efectivo contra el HEAD:** 7 archivos de producto netos, 0 archivos de documentación netos: `index.html`, `js/film-plan-core.js`, `js/motion-quality-core.js`, `js/presentation-film.js`, `js/presentation-ui.js`, `js/shot-timeline-core.js`, `js/tour-video-ui.js`. La lista de la PR puede mostrar 17 archivos por la historia previa a la recomposición; para este corte se usa el compare `c355bdf8...4d2eee78`.
- **Preview verificada en Vercel:** [`floorplan-3d-oy95100ew`](https://floorplan-3d-oy95100ew-juanma-espinosas-projects.vercel.app) deployment `dpl_J14X9qmGKYiwFSmCy8sH3JtFLZW7`, `READY` y Git SHA `4d2eee7859ee0bc4922c2b0adb817678cbb99c66`, **no Production**. La identidad de los siete blobs con lo aprobado visualmente está documentada en la PR [H]; esta adenda comprobó árbol, diff, CI y destino Vercel, no repitió los recorridos audiovisuales.
- **Cierre de B:** [P/H] la aceptación visual anterior se registra en el cuerpo de PR; pendiente autorización específica para **merge commit** y despliegue automático habitual de Production **sobre ese HEAD y base exactos**. Si cambia alguno, revalidar. A0 no está en el delta de B y sigue bloqueado por separado.

**UX-312 / PERLA — inspección independiente de LAB, NO producto integrado:**
- Fuente congelada: [auditoría UX-312 H1/F4](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab/blob/761bea377ede3993c1740bf10dfe3beebdd7aca4/AUDITORIAS/UX-312-H1-F4-20261122/AUDITORIA.md). [H] H1: inventario de 101 elementos, 606 verificaciones dirigidas en seis viewports; falta T3 paridad funcional en el producto y medición conjunta de las tres reducciones de altura.
- Dos configuradores de Dibujo vivo/Evolución: 12 recorridos Linux HTTP de laboratorio, tres motores Chromium/Firefox/WebKit, escritorio y móvil emulado: **cero operaciones de almacenamiento detectadas**, sin nuevas claves; no equivale a garantía de no escritura en rutas productivas ni móvil físico.
- La sonda original de capturas podía **no interceptar escrituras en Firefox y WebKit** al asignar `setItem` sobre objetos Storage. Una sonda independiente instrumentó prototipos, altas/borrados/vaciados y IndexedDB; detectó controles de escritura conocidos en los tres motores. No reutilizar la sonda defectuosa para un GO.
- F2 puede proseguir aislado según su coordinación y decisiones aprobadas; **F3/F4** deben coordinar entradas con A0 y `js/presentation-ui.js` con B. Permanecen pendientes integración producto, QA de paridad, verificación de no escritura en demos conectadas y aceptación por SHA.

**M01 / A0 #310 — NO-GO reforzado por reproducción real en LAB:**
- Fuente: [escritura de documentos con testigos visibles](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab/blob/323179f74158e56cf567d00266bc0e5be7923875/COMPONENTES/A-construccion-procedural/final-hero/integracion-ci-309/codex-a0-post311/escritura-documentos-testigos.md), prueba de edición sintética con dos pestañas y Firefox/WebKit persistentes.
- Composición aislada `d45e579a587a527559789b83e8e90ef3435396f8` sobre master `c355bdf8...` y A0 #310 `2c7e773...`. **8 casos disconformes + 4 controles correctos**: testigos `rubik-sota-v2-switching` y `rubik-sota-v2-switched` permiten confirmación de escritura en origen normal y F0.2b; el marcador definitivo de época 2 sí bloquea. El proyecto permanece en memoria y no se han demostrado pérdidas de Production. Las pruebas cuentan dos clases de defecto distintas: reconocimiento de testigos y orden de barreras/visibilidad del marcador.
- Criterio de cierre: rechazar testigos e ilegibles, proteger documentos+imágenes **antes** del marcador visible, no rechazar escrituras legítimas previas a la barrera; reproducir en Chromium/Firefox/WebKit y dispositivos prescritos. Hasta entonces **NO MERGE de A0; NO F0.2c/F0.3; NO MIGRACIÓN**. CI general verde de #310 no revoca el NO-GO.

**Regla anti-solapamiento después de esta adenda:** Codex mantiene su rama #313 hasta decisión expresa. Claude conserva PERLA aislado y coordina F3/F4 para no sobrescribir `js/presentation-ui.js` ni los puntos críticos de persistencia. El defecto A0 tiene dueño/gate propio. Ningún agente debe reimplementar #311 ni asignar UX-312 como si fuera integrado en Production.

**Autorizaciones de esta publicación:** se modifica solamente esta documentación. No se autoriza merge de #313, A0, F03 ni UX-312; tampoco gastos, migraciones ni Production. Para #313, el propietario debe pronunciarse explícitamente sobre la base `c355bdf8…`, HEAD `4d2eee78…` y árbol `2692e943…`. El próximo corte tras una eventual fusión de #313 debe registrar el merge SHA efectivo, CI y despliegue Production sin modificar retrospectivamente los hechos de este corte.

---

**Corte de referencia: 22/11/2026 · v1.0 · documento operativo, solo documentación.**

> **IMPORTANTE PARA CUALQUIER AGENTE QUE RETOME EL PROYECTO:** este informe congela un corte verificable, **no es un estado en tiempo real**. Antes de actuar, volver a consultar `master`, las PR abiertas, sus HEAD y checks, y Production. No volver a ejecutar ni desarrollar una capacidad fusionada por el mero hecho de que una tabla histórica la describa como pendiente. Tampoco deducir autorización de una nota o una CI verde.

## 0. Identidad, alcance y jerarquía de autoridad

- **Producto/repo:** [Juanmaes83/floorplan-3d](https://github.com/Juanmaes83/floorplan-3d). Rama principal: `master`.
- **Base congelada de esta auditoría:** `master@3d3992c27e980bec5c22fea677e53f333429e6f0`; árbol `36e7a1de951d98ad80552e1c905ffb94189db9c7`. Esta fusión (#305) es **solo documental**; padre productivo #311 `527ffe3bd3a5002bb2e2d5cc1b39c8bf5d150e50`.
- **CI leída sobre la base documental:** 4 checks `success`, 1 `skipped`, 0 fallos. **No** significa regresión completa de los 14 módulos. [GitHub Actions](https://github.com/Juanmaes83/floorplan-3d/actions).
- **Production consultada:** Vercel `dpl_B1opdTW4KtCtuTuKmn1wNQScmsQZ`, estado `READY`, commit `3d3992c27e980bec5c22fea677e53f333429e6f0`, [URL fija de despliegue](https://floorplan-3d-i75itx0yr-juanma-espinosas-projects.vercel.app). `READY` no prueba todas las funciones ni permisos, acceso humano o recuperación de datos.
- **PR abiertas al corte:** 12, enumeradas en §4. Pueden cambiar; volver a comprobarlas.
- **Origen:** contraste de la auditoría aportada en la conversación (`Markdown pegado(20261122-142951).md`) con GitHub, código principal y de las ramas candidatas, contratos, pruebas publicadas y Vercel. No se sustituyen las evidencias propias de cada PR por este informe.
- **Limitación:** auditoría documental y de código **dirigida**, no una revisión exhaustiva línea por línea de todos los archivos ni una ejecución independiente de la suite global. No se ejecutaron pruebas locales o sobre hardware físico durante esta redacción. Las pruebas CI se **consultaron**, no se reejecutaron. Los resultados históricos/laboratorio son evidencia **reportada**.
- **Autoridades:** [AGENTS.md](../../AGENTS.md) → [protocolo multiagente](../agents/PROTOCOLO-COORDINACION-MULTIAGENTE.md) → [continuidad vigente](CONTINUIDAD-OPERATIVA-VIGENTE.md) y este corte → [plan v1.12](../product/PLAN-MAESTRO-RUBIK-SOTA-v1.12.md) / [matriz de 98 IDs](../product/MATRIZ-TRAZABILIDAD-v1.12.md) / [catálogo maestro](../product/rubik-catalogo-maestro-mejoras-2026-11-09.md) → contratos/PR originales. El [maestro operativo de 14 módulos](https://github.com/Juanmaes83/floorplan-3d/blob/3401038afdfa14f5150f737397d53733f1128f7f/docs/product/MAESTRO-OPERATIVO-14-MODULOS-DE-CIERRE.md) está en una **referencia documental separada**, NO en este `master`. Sus nombres/criterios de dirección se usan sin asumir vigencia de sus estados antiguos.
- **Orden para comprobar hechos técnicos:** GitHub/entorno efectivos → código y consumidores del SHA → pruebas/checks del mismo SHA → contratos y decisiones específicas → documentación histórica. **Autorizaciones:** las decisiones explícitas del propietario prevalecen en su ámbito, pero no crean evidencia técnica inexistente.

**Clases de evidencia:** [R] GitHub/PR/HEAD consultados; [I] código inspeccionado; [CI] checks consultados; [H] prueba/informe anterior publicado por su ejecutor, no repetido aquí; [P] autorización/aceptación expresada por propietario según acta; [V] no demostrado; [PROP] recomendación sin autorización de desarrollo. Conservar la distinción.

## 1. Dictamen ejecutivo y principales correcciones a la auditoría anterior

**Producto avanzado y numerosas conexiones reales. No certificado todavía como plataforma profesional comercial completa.** El mayor riesgo no es la ausencia general de funciones: es la **continuidad fiable de datos y recursos**, seguida por identidad/seguridad, activación controlada, UX y validación profesional externa.

**Rectificaciones explícitas para no perpetuar errores:**
1. Las 14 áreas **no** son 14 nuevos desarrollos; muchas PR están fusionadas y conectadas. No asignar un porcentaje de avance global inventado a los 98 IDs (pesos y dependencias distintos).
2. `#305` (documentación), `#311` (HERO), `#306` (Blender), `#303/#304` (MCP), `#299` (Studio E3), `#300/#301/#271` (idiomas/cámara/RoomPlan) **ya están fusionadas**. Las frases que aún los presenten como pendientes en capítulos históricos son **fotografías antiguas**, no una cola de trabajo.
3. `#309` es **antecedente** de HERO; el cierre de producto está en `#311`. No abrir una segunda integración HERO por leer notas antiguas.
4. `#310 A0` tiene 99 checks `success` + 1 `skipped`, pero la evidencia publicada deja **sin cierre acreditado** el gate de concurrencia persistente Firefox/WebKit. Los fallos históricos/intermitentes son un **riesgo por diagnosticar**, no prueba independiente en esta sesión de pérdida de datos en Production. **NO-GO para dar por cerrada A0**, y no ejecutar migración.
5. `#313 Simulator B` tiene 92 `success` + 1 `skipped` y Preview `READY`. Sigue en borrador para aceptación visual y autorización; no confundirla con Production.
6. `#296` tiene alcance funcional absorbido por `#298` según continuidad; `#307` documenta un defecto del candidato inicial de M08 cuyo cierre corregido es `#308`. No borrarlas sin reconciliar su contenido único. `#302` es continuidad documental histórica.
7. Studio E3 proporciona **diez accesos/delegaciones a generadores existentes**, no diez motores nuevos completos. Blender integrado es **flujo local Cycles y revisión/entrega**; no afirmar granja de render cloud.
8. El control de IA **no** es un único gasto global ya consolidado: `api/render.js` cuenta solicitudes por instancia de función, mientras `api/_spend-ledger.js` contiene el libro Redis común cuya integración integral sigue pendiente.
9. La planificación de obra `construction-schedule-core` produce evidencias de **plan estimado/aprobado**, no ejecución real certificada.
10. **La matriz v1.12 (98 IDs) conserva recuentos históricos del 18/11.** No tratarla como situación de hoy sin actualizar filas tras integraciones posteriores.

## 2. Integraciones demostradas: no repetir

| Frente | Integración en `master` | Qué existe; límite de alcance |
|---|---|---|
| Studio E3, Mi estudio y Entregar | [#299](https://github.com/Juanmaes83/floorplan-3d/pull/299) | [`js/e3-entregas-ui.js`](../../js/e3-entregas-ui.js) y catálogo: escoger, previsualizar y delegar generadores; E4–E7 no quedan automáticamente terminados. |
| Copiloto y MCP local | [#303](https://github.com/Juanmaes83/floorplan-3d/pull/303), [#304](https://github.com/Juanmaes83/floorplan-3d/pull/304) | Consulta, propuestas supervisadas, simulación, variante ZIP, guía de 27 recorridos. Proveedor real sujeto a gates. |
| Blender profesional | [#306](https://github.com/Juanmaes83/floorplan-3d/pull/306) | Kit offline/Cycles, validación de resultados, revisión y entrega. Distinguir identidad observada de revisión F0 confirmada. |
| Movimiento de tabique con contexto | [#308](https://github.com/Juanmaes83/floorplan-3d/pull/308) | [`wall-move-core`](../../js/wall-move-core.js) con guarda estructural y UI. No equivale a geometrías curvas completas. |
| Techos y paso orientativo / R03 | [#298](https://github.com/Juanmaes83/floorplan-3d/pull/298), [#297](https://github.com/Juanmaes83/floorplan-3d/pull/297) | Conectados al editor; aviso de altura y sector de apertura son experimentales/indicativos, no comprobación normativa. |
| Simulator A / C-C-bis / E | [#295](https://github.com/Juanmaes83/floorplan-3d/pull/295), [#293](https://github.com/Juanmaes83/floorplan-3d/pull/293), [#291](https://github.com/Juanmaes83/floorplan-3d/pull/291) | A: Evolución; C: etiquetas; E: QA interno de trayectoria. No extender E a todos los recorridos sin pruebas. |
| Idiomas y recorrido de navegación | [#300](https://github.com/Juanmaes83/floorplan-3d/pull/300), [#301](https://github.com/Juanmaes83/floorplan-3d/pull/301), [#271](https://github.com/Juanmaes83/floorplan-3d/pull/271) | ES/EN/ZH, restauración cámara/presentación, unión RoomPlan. La emulación móvil no sustituye teléfono físico. |
| HERO FINAL | [#311](https://github.com/Juanmaes83/floorplan-3d/pull/311) | Enlace efectivo con Evolución/Dibujo vivo, Studio y Entrega, con aceptación registrada; #309 es antecedente. |
| DXF, F0 y perf. / CI | [#265](https://github.com/Juanmaes83/floorplan-3d/pull/265), [#269](https://github.com/Juanmaes83/floorplan-3d/pull/269), [#270](https://github.com/Juanmaes83/floorplan-3d/pull/270), [#266](https://github.com/Juanmaes83/floorplan-3d/pull/266) | DXF de planta activa, autoridad F0.2b **solo en origen aislado**, protección de fotos y render a demanda. |
| Continuidad documental | [#305](https://github.com/Juanmaes83/floorplan-3d/pull/305) | Fusionada; la fecha/corte de sus subapartados determina su validez; corregir lectura de tablas antiguas mediante este informe. |

## 3. Cartera actual de 14 módulos (estado del resultado de usuario, no porcentaje)

**Leyenda de estado:** **INT** integrado con alcance delimitado; **PAR** parcial, faltan capacidades de resultado; **LAB** trabajo publicable aislado; **BLOQ** gate imprescindible sin cerrar; **VAL** falta validación externa; **OFF** función no autorizada/activada. Los estados pueden coexistir.

| Módulo y objetivo | Comprobado / preservar | Residual exacto y gate de cierre |
|---|---|---|
| **M01 Continuidad** | **PAR/BLOQ**. Biblioteca, expediente F0.1, F0.2a/b, exportaciones y protecciones actuales. | #310 A0 con concurrencia multitab/navegadores; tras A0 **activo ≥7 días** y observación `writersSeen`, F0.2c autoridad única de documentos+bytes+diario, backup completo verificado, migración recuperable y F0.3 UX. F1 multidispositivo separado. No anunciar recuperación íntegra garantizada. |
| **M02 Identidad y entrega segura** | **PAR**. [`api/_share-auth.js`](../../api/_share-auth.js), compartir, revocar, caducar, limpieza controlada en publicación. | Cuentas profesionales, sesiones/roles y aislamiento efectivo, GOV-06a/08 (cuotas/Blob privado), pruebas adversarias y GOV-05 jurídico. Un código compartido no es identidad individual. |
| **M03 Blender profesional** | **INT/VAL** #306. Exportar escena → Cycles local → revisión/hashes → entrega limpia/firmada. | Validar en más escenas reales/hardware y ergonomía posrender; no rehacer exportador/kit ni prometer cloud. C6 confirmado solo desde autoridad F0. |
| **M04 Studio y Entregar** | **INT/PAR** #299. E3 conectado con diez destinos existentes. | E4–E7/K11 revisables: colecciones, PDF/lote/portal y evidencia de entrega según contratos. UX-312 exige mejorar acceso sin eliminar capacidades. |
| **M05 Asistente/MCP** | **INT/OFF** #303/#304. Consulta contextual, propuestas con confirmación/undo, simulación, variante ZIP, 27 guías. | **Prueba C real** con credenciales separadas y máximo gasto, Redis externo, proveedor/autorización, GOV-06a. No declarar V3 activo porque haya mocks. |
| **M06 Imágenes IA** | **INT/PAR**. Endpoint real para imágenes bajo token y flags, interfaz de render. | Libro de gasto común duradero y límites, trazabilidad coste/imagen, persistencia de resultados, consentimiento y aprobación por proveedor. No confundir contador por instancia con cuota global. |
| **M07 Fidelidad visual** | **INT/LAB/VAL**. F03 V1/superficies/OP-11 lote inicial; F03 V2 15/15 **reportado en laboratorio**. | Reconciliación F03 V2 con master efectivo, aceptación visual, presupuesto GPU/móvil físico, procedencia/licencias; F04/F05 por separado. |
| **M08 Geometría** | **INT/LAB**. R02-A/R03 y #308 integrados. | OP-07 curvas/inclinaciones sigue #267 laboratorio; comprobaciones estructurales, formatos de proyecto, UX, aceptación. OP-06/08/09 no quedan cerrados por #308. |
| **M09 Reconocimiento** | **PAR/VAL**. Importación PDF, imagen, DXF, IFC, RoomPlan, revisión manual y sugerencias F2. | R01 y F2: corpus autorizado, métricas de error/escala/incertidumbre y revisión humana; no anunciar precisión profesional universal. |
| **M10 Mobiliario** | **INT/PAR/LAB**. Catálogo, R03, muebles propios y fotos locales; OP-05 P1–P4 en lab. | Persistencia y exportación de bytes GLB privados con procedencia/privacidad, C1 NO-GO; ampliar bibliotecas solo tras tests F3, escala, licencias y rendimiento. |
| **M11 Cinematografía** | **INT/LAB**. HERO #311, A/C/E integrados. | Simulator B #313 Draft: aceptación visual, modo por paradas intacto y validación MP4. D conserva gate WebKit propio; F HOLD. |
| **M12 Edición/navegación** | **INT/VAL**. Home, idiomas #300, cámara #301, OP-04 UX #271. | UX-312 PERLA y jerarquía de Home/Mi estudio/Entregar; accesibilidad y teléfonos físicos; no rehacer las PR cerradas. |
| **M13 Presupuestos/obra** | **INT/PAR/VAL**. Cantidades, partidas, BC3/BCCA acotado, calendarios, Gantt y 4D de plan. | Fuente/precios y permisos verificables, exportaciones profesionales y precisión; la ejecución/certificación **real** no está soportada por `construction-schedule-core` actual. |
| **M14 CAD/BIM/interoperabilidad** | **INT/VAL**. DXF planta activa con mm/capas/integridad; importación DXF/IFC, advertencias para DWG. | Pruebas externas en al menos dos CAD, BIM/IFC reales, unidades y pérdidas del roundtrip. No iniciar otro exportador por error documental. |

**Hito comercial:** el plan A–D y los ocho P1–P8 continúan como arquitectura. El cierre de M01/M02, seguridad/privacidad, revisión de recorridos y piloto profesional son condiciones más determinantes de comercialización que agregar módulos visuales nuevos. No se altera el catálogo de 98 IDs por mera inferencia.

## 4. Doce PR abiertas: inventario e instrucción de no duplicación

| Familia | PR abiertas al corte | Tratamiento |
|---|---|---|
| **A0 + continuidad F0** | [#273](https://github.com/Juanmaes83/floorplan-3d/pull/273), [#310](https://github.com/Juanmaes83/floorplan-3d/pull/310), [#274](https://github.com/Juanmaes83/floorplan-3d/pull/274), [#276](https://github.com/Juanmaes83/floorplan-3d/pull/276), [#277](https://github.com/Juanmaes83/floorplan-3d/pull/277), [#278](https://github.com/Juanmaes83/floorplan-3d/pull/278), [#279](https://github.com/Juanmaes83/floorplan-3d/pull/279) | Siete PR de una **cadena**, no siete líneas funcionales independientes. #273 original preservada; #310 candidata A0 nueva. Componer/testar por base y contrato R1, **no fusionar ni migrar por este documento**. |
| **Simulator B** | [#313](https://github.com/Juanmaes83/floorplan-3d/pull/313) | HEAD `80911c6cdf11ac22c806b14bf324b2d9a6400a5c`, 92 success/1 skipped; Preview `READY` [enlace](https://floorplan-3d-pun80cwj6-juanma-espinosas-projects.vercel.app). Pendiente aceptación visual/autorización. |
| **OP-07** | [#267](https://github.com/Juanmaes83/floorplan-3d/pull/267) | Código de laboratorio, no merge de producto. Auditoría geométrica/contratos/QA sobre base vigente. |
| **Documentación histórica** | [#302](https://github.com/Juanmaes83/floorplan-3d/pull/302), [#307](https://github.com/Juanmaes83/floorplan-3d/pull/307) | Reconciliar y registrar relación con #311 y #308 respectivamente; no borrar evidencia. |
| **R02-A absorbida** | [#296](https://github.com/Juanmaes83/floorplan-3d/pull/296) | Revisar diff/cobertura respecto #298 antes de considerar cierre administrativo. |

**A0 #310 — identidad y evidencia:** HEAD `2c7e77392a6137be2d1efb5674fd774385942e85`; 99 `success` y 1 `skipped`; `js/schema-epoch.js` y dos baterías de navegador añadidas. El test fuente usa Chromium y declara recorridos previstos para Firefox/WebKit; el texto de la PR conserva intermitencias previas de ResizeObserver/concurrencia. **No se verificó en este corte una repetición multitab nativa Firefox/WebKit satisfactoria**. CI general ≠ gate específico satisfecho.

**Simulator B #313:** nuevos módulos `js/presentation-film.js` / `js/shot-timeline-core.js` / `js/motion-quality-core.js`, con WebCodecs H.264+MP4 reutilizado. Los informes de MP4 Chromium/WebKit son [H], no nuevos ensayos de esta auditoría.

## 5. Laboratorios y propuestas que NO son Production

| Línea | Evidencia fija | Qué falta / precaución |
|---|---|---|
| F03 V2 fachadas | [Handoff 15/15 reportado](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab/blob/ba4b138063f47f4095615a367bf8668cc67356d5/COMPONENTES/F03-V2-fachadas/HANDOFF.md) | Construido para base antigua `1bc501d`; reconciliar con master actual, revisar hardware real/VRAM y aceptación visual. OFF por defecto. |
| UX-312 | [Laboratorio y matriz de consolidación](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab/tree/e94e783bf38cc7273c0c09482d728fcdbc2982b7/COMPONENTES/UX-312) | Propuesta, no código productivo. PERLA como dirección de arte; no retirar elementos por contradicciones entre texto antiguo y decisión de mantenerlos. Revisar Gate 1 y secuencia F1–F5. |
| OP-05 GLB propios | [Continuidad §3 M10](CONTINUIDAD-OPERATIVA-VIGENTE.md#3-estado-de-los-14-módulos-capacidades-existentes-y-delta-pendiente) | Biblioteca privada C1 aún NO-GO; referencias sin bytes no garantizan un proyecto transportable. |
| R01/F2 | [Roadmap F2](../ROADMAP.md) | Evaluación con planos reales/consentimiento, no extrapolar de fixtures sintéticos. |
| F0.2c/F0.3 | PRs #274/#276–#279 | Candidatas de datos sintéticos, no autoridad única productiva ni restauración acreditada; dependen de A0 y decisión de migración. |

**Observación UX-312:** la matriz LAB reporta Home 5846 px, Mi estudio 3816 px y Entregar 6587 px a 1440×900; **no repetimos aquí esas medidas**. Los textos de matriz que dicen “desaparece/retirar” chocan con la posterior instrucción de no eliminar elementos: reconciliar antes de codificar. No aplicar una migración visual masiva sin pruebas de paridad de rutas, datos y accesibilidad.

## 6. Defectos/riesgos constatados en código y pruebas: no fabricar garantías

1. **M01 — origen normal distinto de F0.2b.** [`js/persistence-editor.js`](../../js/persistence-editor.js) define `enabled=P.isTestOrigin()&&!isolated` y usa `localStorage` cuando está desactivado. En paralelo, [`js/local-images.js`](../../js/local-images.js) almacena imágenes en `rubik-sota-images-v1`. No hay autoridad única completa de documentos+bytes en Production. [I]
2. **M01 — A0 no integrado.** `js/schema-epoch.js` existe en #310 y no en master. Se deben verificar escrituras/cruces de época, pestañas antiguas, `onversionchange` y recogida de imágenes, sin relajar aserciones. [R/I/H/V]
3. **M02 — identidad comercial.** [`api/_share-auth.js`](../../api/_share-auth.js) exige `RUBIK_SHARE_TOKEN`; publicar/revocar/caducar están implementados, pero ese token compartido no aporta identidad profesional individual. [I]
4. **M05 — proveedor de texto fail-closed.** [`api/assistant.js`](../../api/assistant.js) requiere flag, código propio, modelo, clave, tarifa, cap y store; [`api/_beta-controls.js`](../../api/_beta-controls.js) limita beta a Preview. No concluir que una simulación acredita Prueba C real. [I]
5. **M06 — coste no global.** [`api/render.js`](../../api/render.js) usa medidor en memoria **por instancia** y [`api/_spend-ledger.js`](../../api/_spend-ledger.js) documenta integración posterior con ese render. Antes de actividad comercial real, comprobar límite global y provisión de store. [I]
6. **M10 — referencias fotográficas.** [`js/own-furniture-core.js`](../../js/own-furniture-core.js) indica explícitamente que al exportar viaja la referencia, no necesariamente la foto; no vender portabilidad íntegra de muebles/GLB propios. [I]
7. **M13 — Gantt ≠ obra ejecutada.** [`js/construction-schedule-core.js`](../../js/construction-schedule-core.js) rechaza `executionRecords` no vacío y solo asigna estados de plan. Presupuestos tienen precios sin revisar y un BCCA offline bajo control de licencias. [I]
8. **M14 — DXF real con límites.** [`js/dxf-export.js`](../../js/dxf-export.js) exporta milímetros, capas y cotas; [`js/plan-intake.js`](../../js/plan-intake.js) incluye rutas DXF/IFC. Persisten verificaciones CAD/BIM externas; DWG nativo no está acreditado. [I]
9. **CI.** [`.github/workflows/ci-impact.yml`](../../.github/workflows/ci-impact.yml) usa selección por impacto; el trabajo de regresión total se despacha en ejecución programada/manual. Los checks de un merge documental no demuestran funcionamiento integral. [I/CI]
10. **Gobierno.** El estado GitHub de `master` mostraba `protected:false` y consulta de rulesets sin entradas; la lectura avanzada de protección devolvió 403 a esta integración, por lo que no se presume control efectivo de todas las rutas de despliegue. Verificar antes de beta comercial. [R/V]

**No se modifica ningún gate ni se añade una protección por este informe.**

## 7. Ruta crítica propuesta y paralelismo seguro

| Orden | Frente | Salida que demuestra cierre | Dependencia / responsable sugerido |
|---|---|---|---|
| **P0-1** | #310 A0 | Test nativo reproducible de concurrencia en Chromium/Firefox/WebKit (2 pestañas, 1440×900 y 390×844, origen normal y F0.2b), sin pérdida de bytes, pruebas de epoch/rollback, SHA/CI y aceptación específica. | Codex integra solo cuando gate y autorización existan; Claude puede diagnosticar sin modificar rama ajena. |
| **P0-2** | M01/F0.2c/F0.3 | Tras A0 activo ≥7 días y `writersSeen` sin antiguos, backup completo SHA-256 restaurado, migración única recuperable, conflictos y UI con pruebas de fallo/interrupción. | Requiere A0 integrado/activo, contrato R1 y autorizaciones separadas de cada migración. |
| **P0-3** | M02 + gasto IA | Cuentas/roles/sesiones, permisos de documentos y entregas, cuotas/store compartido, fallos seguros, privacidad/consentimiento y revisión legal. | Paralelismo arquitectónico **solo aislado**, sin activar servicios ni gasto. |
| **P1-1** | UX-312 / PERLA | Inventario sin pérdida, tokens únicos, Home–Mi estudio–Entregar navegables, paridad, a11y y revisión móvil/desktop. | Empezar especificación/pruebas; **no escribir** en los mismos archivos que HERO, A0 o Simulator B sin coordinación. |
| **P1-2** | Simulator B #313 | Revisión visual humana y consentimiento de merge específico; preservar “Por paradas”, MP4 real, foco/Escape, CPU, compatibilidad. | Independiente de M01; no modificar ramas de Codex. |
| **P1-3** | F03 V2 y OP-05 | Rebase/reconciliación aislada, licencias/hashes, escala, rendimiento real, transporte/recuperación de recursos, aceptación por SHA. | F03 visual puede ir en paralelo; **biblioteca privada productiva depende de continuidad M01**. |
| **P1/P2** | M09/M13/M14 | Corpus real autorizado, error cuantificado; precios/documentos revisados; CAD/BIM en herramientas externas y pérdidas conocidas. | Profesionales + Codex; no anunciar precisión normativa antes del resultado. |
| **Hito beta** | Piloto integral | Importar → editar → guardar → cerrar → reabrir → exportar → visualizar/Blender → compartir → revocar → recuperar, con fallos inducidos y acceso individual. | Tras los gates P0 pertinentes, aceptación y decisión de despliegue/operación. |

**Trabajo simultáneo autorizado por este documento: ninguno.** Esta tabla **ordena propuestas**, no inicia misiones ni autoriza migraciones, gasto, producción o fusiones. Para la siguiente misión, comprobar primero la rama, el propietario del corte, los consumidores y el HEAD actualizado.

## 8. Instrucciones operativas para reanudar SIN repetir ni romper

1. Leer `AGENTS.md`, este documento, continuidad, handoff, contratos F0/R1 y plan/matriz. Comprobar GitHub `master` y todas las PR abiertas **en ese momento**; anotar commit y árbol.
2. Identificar **un resultado de usuario completo** dentro de M01–M14. Buscar su implementación y consumidores (`index.html`, `js/`, `api/`, `evolucion/`, `tools/rubik-mcp/`) antes de escribir. Verificar si ya llegó por PR fusionada o heredó una corrección.
3. Diferenciar 7 estados: desarrollado, validado, integrado, conectado, disponible, aceptado, más aislado/bloqueado como condiciones. Un LAB con 15/15 no es Production; un check verde no es aceptación visual; un `READY` no es seguridad de datos.
4. Revisar solapamientos actuales de archivos **especialmente sensibles**: `index.html`, `js/persistence-store.js`, `js/persistence-editor.js`, `js/local-images.js`, `js/professional-workspace-ui.js`, `js/studio-hero-ui.js`, `js/presentation-ui.js`, `evolucion/*`. No dar instrucciones incompatibles a Claude Code 1/2 y Codex.
5. Crear rama única desde base exacta, sin tocar `master` ni el worktree de otro agente. Producir el **delta mínimo de producto**; reutilizar autoridad de proyecto, geometría, renderer, presupuesto, identidad/brand, expediente, propuesta y gasto, no montar motores duplicados.
6. Registrar por corte: resultado, ruta visible/consumidor, estado, archivos, SHA+árbol/base, pruebas realizadas/pendientes, preview, seguridad/privacidad/licencia/coste, hardware/idioma, rollback, responsable y aprobación. Validar mismo SHA y mismo entorno.
7. Para entregables visibles, pruebas con proyecto sintético, escritorio/móvil, ES/EN sin CJK, accesibilidad, regreso atrás, exportación, recarga, fotos y persistencia. Para cambios críticos, negativos multitab/rollback/borrado y pruebas tras fallo inducido.
8. PR borrador, **sin merge hasta aceptación por SHA**. No reactivar una fase por copiar información histórica. Tras merge autorizado: nueva entrada fechada de continuidad, actualización de filas afectadas de matriz y estado real de Production, sin reescribir el pasado.
9. **Condición de cierre de esta auditoría:** solo documento publicado + PR identificable; no se certificarán nuevas funcionalidades en esta rama.

## 9. Registro de decisiones, límites y consultas antes de nuevas órdenes

- [P] Prioridad del propietario: **partir del estado real, no repetir, no romper, no olvidar**; la presente entrega es **solo documental**.
- [P/H] A0 autorizada como candidata concreta según #310; **no** está autorizada automáticamente su fusión ni F0.2c/F0.3.
- [R] #313 Draft, sin autorización de integración por este informe.
- [H] F03 V2 GO-LAB propuesto, aceptación visual a reconciliar; UX-312 diseño PERLA sin implementación productiva.
- [V] CI completa manual del árbol actual, dispositivos físicos, recuperación integral, coste real consolidado, licencias finales/precisión profesional y acceso de cuentas: **no acreditados aquí**.
- [PROP] No enviar un prompt gigante a Claude Code 2. Asignarle solamente una misión con **residual técnico comprobado**, sin solapamiento y con entrada/salida/gates definidos. Confirmar PR y rama antes de cualquier intervención.
- [PROP] No promover una beta comercial ni afirmar “guardado garantizado” mientras M01/M02 y sus verificaciones estén incompletos.

**Siguiente acción documental:** cuando se apruebe el corte, integrar este documento y su enlace de navegación en `master` bajo autorización expresa. **Siguiente acción de producto:** verificar gate A0 de #310, no otro motor ni otra auditoría general. Mantener la continuidad en un registro único y fechable.

## 10. Fuentes de recuperación directas

- [Continuidad operativa](CONTINUIDAD-OPERATIVA-VIGENTE.md) · [Handoff maestro](HANDOFF-MAESTRO-RUBIK-SOTA.md) · [Recuperación](RECUPERACION-Y-REANUDACION-RUBIK.md).
- [Plan maestro v1.12](../product/PLAN-MAESTRO-RUBIK-SOTA-v1.12.md) · [Matriz v1.12](../product/MATRIZ-TRAZABILIDAD-v1.12.md) · [Catálogo 98](../product/rubik-catalogo-maestro-mejoras-2026-11-09.md) · [R1 persistencia](../contracts/persistencia-f0-2c-r1.md).
- [Protocolo multiagente](../agents/PROTOCOLO-COORDINACION-MULTIAGENTE.md) · [PR abiertas](https://github.com/Juanmaes83/floorplan-3d/pulls?q=is%3Aopen).
- [Lab F03 V2](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab/blob/ba4b138063f47f4095615a367bf8668cc67356d5/COMPONENTES/F03-V2-fachadas/HANDOFF.md) · [Lab UX-312](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab/tree/e94e783bf38cc7273c0c09482d728fcdbc2982b7/COMPONENTES/UX-312).

**Cierre de este corte:** lectura e integración de conocimiento **sin tocar código**, sin activar servicios ni abrir una misión técnica. Lo que cambie después del SHA base deberá incorporarse mediante una **entrada fechada** y comprobación del HEAD remoto.
