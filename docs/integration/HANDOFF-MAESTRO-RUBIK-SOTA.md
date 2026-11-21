# RUBIK SOTA — HANDOFF MAESTRO DE EJECUCIÓN, RECUPERACIÓN Y CIERRE

> **Corte 21/11/2026.** R03 + idioma integrado en [#297](https://github.com/Juanmaes83/floorplan-3d/pull/297). Ver [estado maestro](../product/ESTADO-MAESTRO-RUBIK-SOTA.md). R02-A se reconcilió en aislamiento desde 8a6a1e37, conservando #296 por ascendencia, la localización de techos y las cuatro suites bloqueantes de ambos cortes. Candidata local f3a6d2314c334ab7964310bfe21efbd59803eee2, árbol 4bc68adf1c507ffb6e7107293d3e7bef5a965818. GOV-05 abierto, 2100 mm orientativo y sin bloqueo. Gates y autorización por separado. E3, HERO y STUDIO siguen independientes.

> **Corte 20/11/2026 · Simulator A y siguientes integraciones.** [Simulator A #295](https://github.com/Juanmaes83/floorplan-3d/pull/295) se integró en master `a6a0494b6f15ed60db542ef6c95530ae3c2c0ca2`, árbol `1dc7a264692ae6141de6156012978d4934baa567`. CI de PR con 32 aprobados y la omisión prevista de full-regression. [Production READY para el SHA exacto](https://vercel.com/juanma-espinosas-projects/floorplan-3d/Gyz9GuPknX9oaa8XSkyTsj1vo7jv). Seis recursos de Evolución coinciden byte a byte con master por HTTP autenticado. Se conserva la aceptación del propietario para la construcción por hiladas. La verificación posfusión se sigue por SHA en GitHub. R03 + idioma se preparó sobre la fusión real: HEAD `03c5504f21e40459fd754baba70727e66c75b68a`, árbol `77543108a7428ee937f03ab702c71e69add4728b` idéntico al [validado en Windows y Chromium 3D](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab/tree/683dcd61ad8543fa07d8c1f917c7cf19101d1d42/COMPONENTES/EVIDENCIA-INTEGRACION-20261120/CONTINUIDAD-OPERATIVA/R03-IDIOMA-POST295). R02-A es independiente y la revisión de #296 sigue a cargo de Claude Code 2. OP-05, HERO FINAL y STUDIO conservan sus gates propios.

> **Corte 20/11/2026 · OP-11 / F3.** [OP-11 lote 01 #294](https://github.com/Juanmaes83/floorplan-3d/pull/294) integrado en master `9eb7c5f0bffb826fe8789c98d655172befde5da6`, árbol `3af6b5aab9bdde2d24a9b4935332ac43cc106fcd`. CI de PR 93 aprobados y una omisión prevista. [Production READY para el SHA exacto](https://vercel.com/juanma-espinosas-projects/floorplan-3d/47cKosGTbB4vox1F7HwjXk1JnNXC). La CI posfusión se acredita por separado. F3 fija un plazo global de 12 s. El banco original vuelve a entregarse con bytes idénticos bajo 2,5 s de permiso y 6 s de GLB. [Diagnóstico, parche y regresiones](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab/tree/codex/evidencia-integracion-20261120/COMPONENTES/EVIDENCIA-INTEGRACION-20261120/CONTINUIDAD-OPERATIVA/SCENE-F3-PRESUPUESTO-20261120). Simulator A conserva la aceptación y tiene HEAD efectivo `01833c3d1a941552c82468f64f0c0b110765467d`, árbol aceptado `137f4cec775b6e6ea9cbac9b31ab62c33b8937f9`, pendiente de autorización por HEAD y de CI. OP-05 acredita la restauración WebKitGTK en la candidata aislada de códec H.264 nivel 3.1 con la misma área útil antes y después. C1 y P5–P8 siguen fuera de la activación.

## Corte operativo 20/11/2026 · #293 y recuperación auditada

El [estado maestro](../product/ESTADO-MAESTRO-RUBIK-SOTA.md) acredita `master@e32c7cd7` y Production de #293. Continuar la cola del [plan maestro §6.3](../product/PLAN-MAESTRO-RUBIK-SOTA-v1.12.md#63-cortes-propuestos) y la [matriz](../product/MATRIZ-TRAZABILIDAD-v1.12.md). El laboratorio conserva [evidencias y SHA](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab/tree/codex/evidencia-integracion-20261120/COMPONENTES/EVIDENCIA-INTEGRACION-20261120/CONTINUIDAD-OPERATIVA).

- OP-11 lote 01 y Simulator A conservan sus aceptaciones. #294 ejecutó sus gates sobre el HEAD anterior a #293 y detectó además que F2 no reconoce el nuevo manifiesto público de mismo origen. El respaldo local mantiene íntegro el delta funcional y amplía la lista de QA solo con esa ruta de lectura. Solicitar autorización por el HEAD y árbol efectivos nuevos. A va después del merge verificado de #294. Lote 02 conserva sus seis candidatos Kenney, admisión F3, pruebas y gate visual.
- Studio E3 parte del cierre `78a43dc3` y la candidata `64f8837f`. Mantener C1 read-only, `emitible:false`, `paquete:null`, Safari físico, aceptación y D4. #271 tiene corrección dirigida de captura de silueta preparada en copia. D conserva el gate de arranque WebKit. HERO FINAL permanece separado de la construcción por hiladas ya aceptada.
- [OP-05 P4](https://github.com/Juanmaes83/floorplan-3d/blob/968fcec54c451b99ffefaeafdc2b0c0311e6d8ae/labs/sculpt/op-05/HANDOFF-P3P4.md), árbol fuente `0c57b2e528ffcc1b38b7e188ca5f736c5a46d721`. Validación aislada P1–P4 en curso. C1 NO-GO. P5–P8 inactivos.
- [R03 holguras](https://github.com/Juanmaes83/floorplan-3d/blob/e95f106fe19125c18f711d985e243bbbf7a3563a/docs/integration/recuperacion-r-2026-11-20/HANDOFF-R03-HOLGURAS.md). API recuperada de solo lectura, todavía sin consumidor. [R02-A](https://github.com/Juanmaes83/floorplan-3d/blob/743343a1107187ba2558e722f33644266d2c0e6e/docs/integration/recuperacion-r-2026-11-20/R02A-ACEPTACION-PROFESIONAL.md) conserva alcance experimental integrado; la entrega es el recorrido de aceptación. [R01](https://github.com/Juanmaes83/floorplan-3d/blob/d9fe3f2a1c96e0fd8af4f13120f98fec6fd394c1/docs/integration/recuperacion-r-2026-11-20/HANDOFF-R01.md) recuperado en laboratorio y HOLD por GOV-05 y el contrato de propuesta revisable.
- [Coordinación A0/WebKit](https://github.com/Juanmaes83/floorplan-3d/blob/6503273013009cf516bad82994202ae08982b625/docs/integration/recuperacion-r-2026-11-20/A0-WEBKIT-MARCADOR-COORDINACION.md) y evidencia de mutaciones de imágenes durante propagación. A0 y F0 siguen congeladas, R1 abierto y OP-07 inactivo.

> **ACTUALIZACIÓN DE AUDITORÍA Y CONTINUIDAD · 20/11/2026 — LEER ANTES DEL CORTE HISTÓRICO**
>
> Guía de arranque y coordinación aprobada para su depósito documental por petición del propietario. La auditoría independiente de ChatGPT considera el handoff sustancialmente correcto, con los deltas y límites que siguen. El cuerpo original (§0–15) se conserva íntegro como foto fechada de la auditoría iniciada a las 09:44 CET: sus contadores, estados y referencias de rama no son automáticamente los actuales. En caso de conflicto, esta actualización y una consulta nueva de GitHub prevalecen para el estado operativo; catálogo, matriz, plan y contratos siguen siendo autoridades canónicas. No constituye autorización de desarrollo, merge, promoción, activación, migración ni gasto. Codex conserva la integración de producto; el depósito de esta guía es exclusivamente documental.

## Actualización A1 — contrastes independientes y deltas posteriores

- [R] Master en `a02af9454cedc02c5dd26e92260a339cf10c794a`, árbol `3bd385bbdff2da91756032919611d41abb6f677f`, sin cambio respecto del corte original; OP-04, F0.2b, K13 y R1 integrados. [CI] #272 posfusión 3/3 y Vercel success en GitHub para ese SHA. No se repitió consulta directa de aliases ni smoke público; conservar la evidencia anterior como histórica, no extrapolar disponibilidad.
- [R/CI] [SMART #288](https://github.com/Juanmaes83/floorplan-3d/pull/288) continúa abierta, HEAD `11b3c78224f1b4eadfc4a8cbf5e0bdcd16405151`, base master exacta, objeto de merge `d432f4d688581d3810a17d5b090011289a7f7239` con árbol autorizado `e57089f61dc7a915f316a176280e4c08ebd49057`. Última lectura: 91 success, 1 skipped, 1 failure, 0 pendientes (93 checks en API); 0 workflows en cola y 0 en ejecución en consulta separada. **CI no saturada, pero SMART NO-GO por gate rojo** [presentation-c](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44704778305/job/136181692580). Leer §1.4 para diagnóstico; la revisión de este documento no descargó de nuevo el TAP citado por su autor ni ejecutó las pruebas. No declarar flake sin causa.
- [R] [#275](https://github.com/Juanmaes83/floorplan-3d/pull/275) evolucionó a `597fd791ab7fbc0625982c90a3018426dca28ed0`. Ya contiene reconciliación de estado maestro, matriz, plan e [inventario Simulator C/A/D](https://github.com/Juanmaes83/floorplan-3d/blob/597fd791ab7fbc0625982c90a3018426dca28ed0/docs/integration/INVENTARIO-SIMULATOR-C-A-D.md). Lo indicado en §§0, 1.3, 5.6, 9 y 14 sobre archivos antiguos o ausencia de C/A es histórico y queda actualizado por ese registro. No rehacer el trabajo documental de Codex ni fusionar #275 sin comprobar base, delta y autorización.
- [R/E reportada] **C**: candidato local árbol `678a04b49b9d0dd3f0ac8542d749ff2275a018eb` sobre SMART; 4/4 dirigidas Firefox/WebKit escritorio y móvil, cero solapes y frames extra en reposo, p50 ≤2 ms, p95 ≤3 ms. Firefox teclado/foco y nombres accesibles. Pendientes aceptación visual y lector de pantalla; WebKit Windows headless deja malla en blanco, acredita DOM y contadores, no composición visual completa.
- [R/E reportada] **A**: árbol local `5997853d6af39cc529428da8f7016586bf829172`, 1/1 Firefox y 1/1 WebKit de Evolución, 70/70 muros y sólido final inspeccionable. WebKit headless Windows también da lienzo vacío en la base SMART; aceptación visual pendiente. OP-07: la sonda de Codex mide 4.000 mm por cuerda en A frente a 4.589 mm canónicos de muro curvo y 2.500 frente a 3.300 mm al extremo del inclinado; excluir muros curvos/inclinados de la fábrica y conservar sólido canónico hasta adaptación acreditada. No declarar nuevo gate superado por esta nota.
- [R/E reportada] **D**: con fuente `09557c4c` y master `0e1a6e0a`, dos sesiones Firefox Windows obtienen 4/4 fotogramas exactos tras aislar canvas, sin ampliar garantía general. WebKit Windows produce cuatro poses distintas pero cuatro fotogramas del mismo color: gate de movimiento/captura abierto; no declarar éxito por igualdad de hashes de lienzo vacío. Mantener contrato EQUIVALENCIA separado para canvas3d/window/element y aserciones. No repetir diagnóstico de la fuente antigua como si fuera el final.
- [R] Laboratorio Simulator permanece en `09557c4cac1e6390d3af56281922d8d43093234e`. B conserva pausa documental hasta constancia de mandato del propietario; F HOLD por derechos. OP-07 conserva nueve parches y tres ramas verificadas (ver §6), no reiniciar. A0 y #274–#279 congeladas; verde ordinario no resuelve WebKit persistente.
- [R] **Anexo §14 comprobado automáticamente contra matriz v1.12 en master del corte:** 98/98 IDs únicos, cero faltantes, cero adicionales, coincidencia de los 98 códigos históricos, programas e hitos. Las denominaciones abreviadas son descriptivas; la matriz conserva texto canónico. §3 contiene las 23 piedras originales (12 OP, 2 RG, 3 R, 6 Simulator); no son 23 IDs adicionales ni porcentajes de avance. Los recuentos y estados de matriz son históricos y se actualizan por Codex como delta acreditado.
- [V] Las cifras de pruebas publicadas por agentes, objetos locales, licencias de cada recurso de ambientación, detalles de facturación/concurrencia efectiva, aceptación humana y autorizaciones que no consten siguen sujetos a la evidencia original y sus gates. No se han ejecutado pruebas de producto durante esta revisión. En particular, la mención histórica de ~204 activos Kenney no acredita la licencia o admisión individual de un GLB; ni el MIT del código del donante autoriza todos sus assets.

## Actualización A2 — metodología SCULPT según madurez y próximos frentes

La metodología de §10 y [cartera canónica](https://github.com/Juanmaes83/floorplan-3d/blob/a02af9454cedc02c5dd26e92260a339cf10c794a/docs/product/sculpt-metodologia-y-cartera-2026-11-10.md) sigue vigente. **Reanudar desde la última fase acreditada**, no repetir SOURCE EXACT, baselines, pulido o aceptación ya válidos para el mismo alcance. Revalidar únicamente el delta cuando cambien fuente, base, árbol, contrato o entorno. SCULPT completo para subsistemas nuevos; mini-SCULPT (comparar, clasificar, adaptar, probar y preview) para deltas sobre capacidad existente; cierre/handoff y cirugía para fuentes ya terminadas; no usar metodología de donante para reinventar una arquitectura propia ya aprobada. Los gates de seguridad, licencia, pruebas, aceptación y autorización no se eliminan. No crear otro catálogo, motor/editor, persistencia, agente, presupuesto o geometría.

| Piedra / frente | Aplicación desde el estado actual | Siguiente trabajo propuesto (no GO implícito) |
|---|---|---|
| OP-05 GLB propios y biblioteca | Continuar escultura `a722f9dd`, no reclonar | Perfil GLB privado, resolver F3/Asset Lab y preparar puente en copia; F0.2c/F0.3 obligatorias para persistencia/backup/expediente privado. Sin escritor paralelo, sin exposición pública. |
| OP-11 Ambientación arquitectónica | SCULPT completo del delta; prioridad de siguiente laboratorio visual | Inventario de personas genéricas, vegetación interior/exterior, mobiliario exterior y entorno; fuente/licencia por recurso, normalización F3, instancias y presupuestos, rendimiento OP-02, preview Blender/Studio. No descargar todo ni incorporar activos sin derecho. Los recursos públicos/licenciados pueden investigarse independientemente de la futura biblioteca GLB privada; compartir catálogo único. |
| OP-10 Render local | Cierre/cirugía C1–C5/C7 Blender; mini-SCULPT posterior de render premium | No reabrir `6d3e5260`. Codex integra candidata acreditada tras SMART y autorización; C6 espera E3/F0. Después comparar calidad/tiempo/recursos CPU del render existente y delta fotorrealista, sin GPU/gasto ni motor paralelo de producto. No equiparar exportación fiel con render premium completo. |
| OP-12 MCP interactivo | Mini-SCULPT incremental de donante sobre MCP 1–2 y ProposalV1 K13 | Contrastar registro de herramientas, capacidades adicionales, etapa 3 de propuestas aisladas; etapa 4, escritura confirmada solo con rol/permiso, revisión, preflight, undo y autorización. No duplicar servidor o registro ni activar escrituras remotas. |
| RG-01 Experiencia de reforma fotográfica | Mini-SCULPT: comparar recorridos UX actuales | Pulido FOT-01, estado, consentimiento, comparación y simulación; no importar backend RoomGPT legado ni activar proveedor/gasto. |
| RG-02 Generación visual y estilos | Mini-SCULPT: recetas y estilos adicionales | Comparar PromptRecipeV1/IMG-08/11 y ampliar únicamente delta medible; sin proveedor adicional ni uso real de IA sin gates. |
| OP-06 Selección múltiple/alineación/transformación | SCULPT del delta del editor; siguiente laboratorio de arquitectura | Marquee, selección, alineación, rotación/duplicación y undo único; no introducir nueva geometría; preparar pruebas compatibles con OP-07. No modificar las ramas activas de geometría. |
| OP-01 Persistencia, recuperación y versiones | Ingeniería de cierre F0 existente, no reclonar ni reesculpir | A0 residual WebKit y cadena #274–#279; siete días de convivencia acreditados y autorización separada antes de migración real. F1 y privacidad posteriores. |
| OP-07 Muros curvos e inclinados | Terminar 9 parches desde §6 | roomRing al dividir, guardSave con WALL_PATH, Blender, CAD, previews y expediente. Compatibilidad v1/v2 y bloqueo de escritores. No modificar OP-10 congelada. |
| OP-08 Escaleras y edificios avanzados | SCULPT incremental sobre building-core | Baseline de plantas y escaleras rectas existentes; estudiar L/U, traslado y apilado; contratos compatibles con OP-07, sin reescribir edificios. |
| OP-09 Plantillas arquitectónicas | SCULPT incremental de valor no cubierto | Contrastar plantillas de vivienda/estancia, edición paramétrica, geometría única y ProposalV1, probar dimensiones y undo. |

**Asignación y prioridad recomendadas:** Codex continúa SMART → OP-10 → E → D con autorizaciones y gates independientes; prepara C/A, #271, Studio E3 y OP-05 sin olvidar sus bloqueos. Claude de geometría termina OP-07 y coordina diagnóstico A0; luego OP-06 y OP-08/09 por dependencia. Claude de visual/Simulator mantiene A/C/D/E congeladas salvo residual demostrado y termina B si se autoriza; siguiente mandato visual recomendado OP-11. OP-12 y RG-01/02 son deltas independientes que pueden planificarse sin modificar motores ni activar servicios. La concurrencia no es motivo por sí sola para abrir laboratorios; no desplazar entregas ya preparadas. La numeración de ventanas no es una identidad fija: asignar por frente, rama y handoff. El propietario decide desarrollo de nuevos cortes, Codex controla publicaciones y fusiones productivas.

## Actualización A3 — cómo mantener esta guía viva

Ruta estable: `docs/integration/HANDOFF-MAESTRO-RUBIK-SOTA.md`. Al abrir cualquier sesión, leer primero la última actualización fechada y el handoff individual, comprobar master, árbol, CI, PR, Production y autorización. Tras cada avance significativo, Codex actualiza el delta en esta guía (fecha, SHA/base/árbol, evidencia, estado, responsable, dependencia, siguiente acción y permiso); mantiene el historial y enlaza la matriz, plan, estado maestro y #275 o sucesor operativo. No editar en paralelo sus archivos sin acuerdo. La guía es índice/continuidad, no una segunda fuente normativa de estados ni un nuevo roadmap. Las referencias históricas se leen en su fecha. ChatGPT realiza auditorías comparadas, propone prioridades y mandatos; solo writes documentales expresamente solicitados en rama propia. La integración de esta guía en master corresponde a Codex, con el gate documental y autorización aplicables, sin cambios de producto. No iniciar nuevas esculturas por esta nota.

---

## Actualización A4 — regla permanente de integración funcional, UX/UI y QA

Antes de la cirugía, cada handoff y PR declara la capacidad, el área de RUBIK, la ruta paso a paso o el consumidor interno, la visibilidad, los componentes reutilizados, el cumplimiento de Perla y UX-FIRST, las dependencias y los permisos, las pruebas aplicables, la evidencia vinculada al SHA y los gates para Production. La lista completa y el criterio por estado viven en el [protocolo permanente](../agents/PROTOCOLO-COORDINACION-MULTIAGENTE.md#41-integración-funcional-uxui-y-qa).

Las mejoras visibles requieren acceso verificable desde el frontend. Las internas demuestran sus consumidores e impacto en el flujo real. Reutilizar las superficies y autoridades de RUBIK. Claude Code documenta el destino durante la escultura y el pulido. Codex valida la conexión durante la cirugía e integración. ChatGPT audita la experiencia y la disponibilidad. El propietario concede la aceptación y los permisos.

**DESARROLLADO → VALIDADO → INTEGRADO → CONECTADO → DISPONIBLE → ACEPTADO.** Registrar la evidencia de cada estado, con el alcance y entorno de cualquier aceptación previa. Los resultados operativos y los bloqueos de cada corte se siguen en [#275](https://github.com/Juanmaes83/floorplan-3d/pull/275).

## Actualización A5 — relevo de OP-10

El candidato exacto de #290 está publicado. El [registro de continuidad y evidencia en #275](https://github.com/Juanmaes83/floorplan-3d/blob/aa87295b2ffd3daab314c99e261e5f6c88bcccde/docs/integration/op10-evidence/entregar-56f099d/README.md) contiene el HEAD, la base, el árbol, la autorización registrada, el recorrido frontend y el procedimiento para cerrar el gate. Ese registro mantiene el estado y las capturas de OP-10. Consultarlo junto a los checks de GitHub antes de continuar.

## Actualización A6 — auditoría retrospectiva

Auditar todas las capacidades desde las primeras versiones hasta el master efectivo en Home, Plataforma y Entregables. El [protocolo permanente](../agents/PROTOCOLO-COORDINACION-MULTIAGENTE.md#42-auditoría-retrospectiva-de-capacidades) define cobertura, criterios y evidencias. Usar las autoridades existentes y registrar el resultado diferencial en continuidad. El inventario puede avanzar en paralelo con la CI. Acreditar disponibilidad sobre Production efectivo y reservar las correcciones para cortes autorizados.

## Actualización A7 — OP-10 en Production

#290 quedó integrada y disponible en Production. El [cierre en #275](https://github.com/Juanmaes83/floorplan-3d/blob/56d94bbc9056f662a600547471d8e5b3ae983ce7/docs/integration/op10-evidence/entregar-56f099d/README.md) contiene SHA, árbol, padres, CI y la prueba de descarga del frontend. El [registro inicial de auditoría retrospectiva](https://github.com/Juanmaes83/floorplan-3d/blob/56d94bbc9056f662a600547471d8e5b3ae983ce7/docs/integration/AUDITORIA-RETROSPECTIVA-CAPACIDADES.md) vive en #275. Simulator E y D conservan autorizaciones independientes.

## Actualización A8 — OP‑07 v3, traza A0 y Simulator E

La [coordinación en #275](https://github.com/Juanmaes83/floorplan-3d/blob/2d0cc64578f188709b06b26e2c09264fd81fc640/docs/integration/op07-a0-2026-11-20/README.md) contiene las trazas para Claude, las reproducciones de aislamiento de S7 y activación 2.0, y el residual independiente del nombre DXF. A0 y su cadena siguen congeladas. OP‑07 queda pendiente de candidata con gate efectivo y desambiguación de intenciones, validación multinavegador, dispositivos y autorización.

Simulator E se publicó en #291. CI Impact Observation requiere que el HEAD incluya master con OP‑10. El registro conserva un candidato local de idéntico árbol, pendiente de autorización por el nuevo SHA. Mantener E → D y las aceptaciones independientes de C/A.

## Actualización A9 — Simulator E integrado

[#291](https://github.com/Juanmaes83/floorplan-3d/pull/291) se fusionó en `8e917e1a70f499a6b8dc68850c8413b7d06c5682`, árbol `dec6d20694e083cb615f42eae60bb74fd3209523`. Añade siete archivos de QA. El [cierre en #275](https://github.com/Juanmaes83/floorplan-3d/blob/cbcbbd731a8cebeb7947f013d7201eab2b42c53b/docs/integration/op07-a0-2026-11-20/README.md#simulator-e--291) acredita 43 contratos CI, ocho pruebas dirigidas, CI posfusión 3/3 y [Production READY](https://vercel.com/juanma-espinosas-projects/floorplan-3d/6UsqaQ4HWiob45C8iCDB95F1pCby). El consumidor de E es el arnés interno para la planta activa. Presentación, Recorrer y Studio conservan sus gates para cualquier conexión futura.

La [auditoría retrospectiva](https://github.com/Juanmaes83/floorplan-3d/blob/cbcbbd731a8cebeb7947f013d7201eab2b42c53b/docs/integration/AUDITORIA-RETROSPECTIVA-CAPACIDADES.md) incorpora importación, RoomPlan, G-02, Home por profesión, Entregar y continuidad F0. La matriz registra G-02 como integrado con límites de alcance y mantiene su validación profesional pendiente. Simulator D conserva su gate WebKit y autorización independiente. A0 y #274–#279 siguen congeladas. OP‑07 v3 conserva NO-GO y sus cuatro residuales pasan a la corrección de Claude Code 2.

## Actualización A10 — publicación obligatoria y auditoría completa

Mandato permanente del propietario (20/11/2026): todas las entregas de Claude Code, Codex y ChatGPT han de quedar publicadas y localizables en su rama/laboratorio autorizado, con SHA completo, árbol, base, handoff y evidencia. Antes de ratificar una decisión, ChatGPT solicita cualquier material decisivo que no esté accesible. La autoridad de esta regla es el [protocolo §4.3](../agents/PROTOCOLO-COORDINACION-MULTIAGENTE.md#43-publicación-obligatoria-trazabilidad-y-auditoría-completa-de-entregas). Los archivos de arranque remiten al protocolo. Respetar las autorizaciones independientes y coordinar publicaciones para no disparar CI redundante. No constituye GO de ningún corte.

## Foto original de auditoría (09:44 CET, conservada íntegra)


**Edición:** 20/11/2026 · corte de auditoría iniciado a las 09:44 CET (Madrid), consultas sucesivas durante la preparación.  
**Repositorio productivo:** [Juanmaes83/floorplan-3d](https://github.com/Juanmaes83/floorplan-3d)  
**Master verificado:** `a02af9454cedc02c5dd26e92260a339cf10c794a`  
**Árbol:** `3bd385bbdff2da91756032919611d41abb6f677f`  
**Production:** [GxEbYKa9jMpgWDBLj5ndUqm6oZaV](https://vercel.com/juanma-espinosas-projects/floorplan-3d/GxEbYKa9jMpgWDBLj5ndUqm6oZaV), READY, Git SHA coincidente, confirmado directamente en Vercel.  
**Laboratorio Simulator:** [rubik-sculpt-simulator-lab](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab), `claude/sculpt-simulator-components@09557c4cac1e6390d3af56281922d8d43093234e`, árbol `435810ed92a107005df9dc1cb334ff473cffec6f`.

**Propósito:** que cualquier nueva sesión retome el proyecto sin reconstruir lo ya desarrollado, pierda el mínimo contexto y sepa con exactitud qué incorporar, qué terminar, qué validar, qué desarrollar y qué no activar. Actualiza el Documento Maestro del 19/11 y el handoff del 18/11; prevalece para estado operativo a este corte. Los documentos canónicos del repositorio siguen siendo la autoridad de nomenclatura, producto y contratos. Este handoff NO crea IDs ni concede por sí mismo permisos de fusión, activación, gasto, migración o promoción. 

## 0. LEER PRIMERO — decisiones de continuidad

1. **Codex continúa como único integrador.** #284/#268, #269, #287/#283 y #272 están fusionadas. No reabrirlas. #288 (SMART) es el próximo corte exacto previamente autorizado, pero la comprobación final detectó un fallo en `historical (presentation-c)`: NO-GO hasta diagnosticarlo y acreditar el gate. Ver §1.4. Verificar CI y base antes de fusionar. Luego OP-10, E y D, con autorización específica para cada candidato nuevo. Preparar C y A sin dejarlas fuera del inventario; coordinar orden sin invalidar los acumulados ya acreditados.
2. **Claude Code 1: cerrar OP-07 y coordinar A0, no rehacer nueve parches.** F0.2b ya existe, así que utilizar el master efectivo en copias aisladas. No propagar #274–#279 mientras ResizeObserver en WebKit siga abierto.
3. **Claude Code 2: A, C, D y E declaradas cerradas técnicamente en su laboratorio.** B está en pausa por instrucción expresamente recogida en el handoff; reanudar solo con nuevo mandato. D requiere reconciliar garantía multinavegador y fuente posterior a la que Codex probó. No repetir todos los baselines ni tocar OP-10 congelada. F HOLD por derechos.
4. **Studio E3 y OP-05 no deben olvidarse.** F0.2b desbloquea preparar sus conexiones, no activa F0.2c ni emite recetas o recursos privados sin gates. D4: autorización de preparación funcional redactada en esta conversación; verificar aceptación/envío por el propietario y registro de Codex antes de asumirla consumida. No equivale a fusión productiva.
5. **#275 debe convertirse en registro operativo versionado**, no solo descripción de PR. Su cuerpo contiene log acumulado útil pero el HEAD de sus archivos sigue en `bd4a6eb6`. Actualizar únicamente deltas sobre master efectivo cuando se autorice; no merge de una documentación vieja que revierta hechos.
6. **No usar un porcentaje global inventado.** Hay 98 IDs, 23 piedras de transferencia, 16 cortes K, seis olas y ocho programas que se solapan. Separar integrado, disponible, experimental, aislado, terminado no integrado, parcial, no desarrollado y bloqueado. Una biblioteca en master no equivale a función conectada; CI verde no equivale a aprobación humana, guardado seguro, licencia ni disponibilidad comercial.

### Mapa de prioridad en una mirada

| Carril | Prioridad próxima | Después | Bloqueador de salida |
|---|---|---|---|
| Integración | #288 SMART | OP-10 → E → D; C/A con candidatos propios; #271 UX | gates y autorizaciones por árbol efectivo |
| Persistencia | A0 WebKit | F0.2c núcleo/copia/migración aislada + F0.3, después convivencia/migración real autorizada | causa intermitente, evidencia 7 días, recuperación |
| Geometría | OP-07 cierre S7 + compatibilidad Blender/DXF | OP-06/08/09, R01 | compatibilidad v1/v2, persistencia, usuarios, CAD |
| Presentación | Studio E3 (D4), selector real | E4–E7, C6 Blender, B cinematografía, CAM-01 | revisión confirmada, licencia, aceptación, Safari |
| Comercial | registro capacidades y seguridad | K5/K6/K8/F1, piloto K7, precios, K16 | identidad, privacidad, cuota y legal |
| Recuperación | OP-05, visual F03 V2 y deltas R02/R03 | OP-11/12, RG, nuevas capacidades | derechos, arquitectura única, pruebas y mandato |

## 1. Foto real del repositorio y de las implementaciones

### 1.1 Integraciones efectivas desde el Documento Maestro del 19/11

| Hora Madrid | Vehículo | Merge real | Árbol acreditado | Efecto |
|---|---|---|---|---|
| 01:20:20 | [#284](https://github.com/Juanmaes83/floorplan-3d/pull/284), absorbe #268 | `42b9703d834af7f697af497591529411ad5da91c` | `7467b80db093ab2e698bd48ee9340c44923b6af0` | OP-04 unión rígida de escaneos RoomPlan por puerta; UI base, sin cambiar escala |
| 01:36:01 | [#269](https://github.com/Juanmaes83/floorplan-3d/pull/269) | `0e1a6e0a0eaaa234a40f1940cd9834d0dd7ee1e4` | `be2e5d8b87c3d5b09b973bba63a7d470f7b65045` | F0.2b consumidores de autoridad persistente en origen aislado |
| 09:26:03 | [#287](https://github.com/Juanmaes83/floorplan-3d/pull/287), absorbe #283 | `1daa74604b095e8e3b63d5662a303459e2c93bc1` | `b78190130eb0270827462c0029b1b79846b97ca5` | K13 ProposalV1 común compatible con lectura confirmada |
| 09:37:02 | [#272](https://github.com/Juanmaes83/floorplan-3d/pull/272) | `a02af9454cedc02c5dd26e92260a339cf10c794a` | `3bd385bbdff2da91756032919611d41abb6f677f` | Contrato R1 documental; NO ejecución ni migración F0.2c |

Verificada cadena de padres: `02712b5` → `42b9703d` → `0e1a6e0a` → `1daa7460` → `a02af945`. Comparación GitHub de `02712b5...a02af945`: 21 commits por delante, 0 por detrás, 47 rutas modificadas (no 47 prestaciones). Todos los árboles coinciden con las autorizaciones registradas. En K13 se usó como HEAD remoto `d9aa3df713f433970545df2ce9ea999cfe3931ec`, con padre master F0.2b y candidato `7bbf27011710400f50e12103dd2fa8654e34333d`; la resolución de doble merge-base mantuvo árbol. #283 consta fusionada por ascendencia. Se conserva antecedente CAT-IA FOT-01: fallo de visibilidad en montaje diferido de `photoReformCard`, presente también en master anterior, no acreditado como regresión de K13; CI final de `d9aa3df7` 92 success + 1 skipped. No volver a ejecutar pruebas por ese fallo histórico sin nueva evidencia.

**Base previa que permanece integrada:** #259 consolidó Studio E2 (#251), H01/H02 (#252/#253), MCP etapa 2 (#254), visual VQ-01/F02/F03 (#255), guardar JSON (#257), beta IA privada desactivada (#258). #261 reconciliación v1.12, #262 expediente F0.1, #263 IndexedDB F0.2a, #264 permiso/recogida conservadora, #265 DXF, #260 CI inteligente, #270 protección fotos MUE-01, #266 render bajo demanda OP-02. Se mantienen los detalles y actas en referencias históricas, no se vuelven a fusionar. 

| Corte de base | Merge acreditado |
|---|---|
| #259 | `163df68e83a80ddf11a008d573ee257d51c1821f` |
| #261 | `67367c6b4abf2d429a5979da3f0cbf1c58721b68` |
| #262 | `af6577aad2e7af56bd34c1b3901025553a2819f4` |
| #263 | `455309069ea52ac8c6c4b887209277cc1169900d` |
| #264 | `7bd414f697796360520f8b6294208d32a9d706b3` |
| #265 | `4c62c1fcbee4dcb7871508b2d2361778fc6e277a` |
| #260 | `dd528119bdfd80733c4faf5bb56a594190fea5ac` |
| #270 | `cff21adca2938b147a10a6fc69c43ffd3da0f3bf` |
| #266 | `02712b5147c15defa12a810b2f346e4b3e0ecb60` |

### 1.2 Producción, aliases y CI (no confundir despliegue con activación)

| Entorno | SHA / deployment | Resultado |
|---|---|---|
| Production, master actual | `a02af9454cedc02c5dd26e92260a339cf10c794a` / `dpl_GxEbYKa9jMpgWDBLj5ndUqm6oZaV` | READY, target production, Vercel status success. URL de deployment `floorplan-3d-3x4avlo2k-juanma-espinosas-projects.vercel.app` |
| [Alpha](https://floorplan-3d-alpha.vercel.app/) | `8525025a1470d48d52d8e365070e5a0acf116134` / `dpl_Bx191sBDRSa2nqhm8bwZhZzryvgA` | READY; histórico anterior, no actualizado |
| [Demo](https://floorplan-3d-demo.vercel.app/) | `7dccf7a6095e6700b2a6b81161f4172b53c340fb` / `dpl_64ndSF5qoDKDtey7XXwEYRAzYDTF` | READY; histórico anterior, no actualizado |
| F0.2b | `f0-2b.localhost` (origen de activación aislada de laboratorio) | NO se ha activado globalmente |
| Beta 01 | No identificada con precisión | No promover ni atribuir capacidades sin huella |

Posfusión #284 5/5 workflows; #269 10/10; #287 7/7; #272 3/3 (Project-First, ENT-01 I1B y CI impact observation). Vercel y GitHub consultados directamente. #288: en la última lectura de checks, 87 success, 4 in_progress, 0 queued, 1 skipped, 1 failure (93 Check Runs; Vercel success separado: 88 aprobados contando Vercel). El volumen cambia mientras se escribe el documento. Al inicio de la auditoría: 2 workflows en cola y 18 en ejecución; en la última lectura: 0 en cola y 5 en ejecución en el repositorio. No equiparar workflows con jobs/checks ni con el límite de la cuenta. El antiguo pico de 163 workflows en cola se resolvió; el usuario comunicó contratación GitHub Pro (límite de concurrencia de plan 40 frente a 20; no confirmado acceso al límite efectivo de cuenta ni causalidad). No comprar otra capacidad ni relanzar matrices sin necesidad. No asumir que toda nueva cola es un nuevo incidente. 

### 1.3 Inventario de TODAS las PR abiertas

Consulta inicial: 14 PR abiertas (las originales #280/#281/#285/#286 siguen abiertas mientras #288 no se fusione). Los HEAD exactos y las bases reportadas por GitHub son los siguientes. CI: success/skip de GitHub; Vercel separado. Consultas no simultáneas. Los cuerpos pueden conservar texto histórico, no usar su título como fuente exclusiva de estado.

| PR | HEAD | Base reportada (corta) | CI / estado | Acción |
|---|---|---|---|---|
| [#288](https://github.com/Juanmaes83/floorplan-3d/pull/288) | `11b3c78224f1b4eadfc4a8cbf5e0bdcd16405151` | `a02af945` | 87 OK, 4 ejec., 0 cola, 1 omit., 1 fallo; Vercel success | Próximo merge autorizado, bloqueado por presentation-c; diagnosticar §1.4 |
| #286 AST-01 | `f6f32d140843c208f9c7f895776455914ec9c22a` | `02712b5` | 22/1 | Incluida en #288 |
| #285 UX-03 | `ab172ff23c61adce28bf5632ce59b8945deab9ed` | `02712b5` | 91/1 | Incluida en #288 |
| #281 K9 | `f607fafb778e801679997f2a9a7f421d3d82592f` | `02712b5` | 92/1 | Incluye K4; incluida en #288 |
| #280 K4 | `070dbe8af139ac6bd79e5f239d449e2189cdb9ba` | `02712b5` | 92/1 | Incluida en #288; no duplicar |
| #279 F0.3 acciones | `d3bfe143238cf05f285761c4263b0f0a8c091697` | `25a5023a` | 17/1 | Congelada |
| #278 F0.3 estados | `25a5023a54dacb0f7a717465589b8458e3f7c3e8` | `02712b5` | 98/1 | Congelada |
| #277 migración | `36891ae7f69a444c9b8d4bec3c6f133497c93d3d` | `02712b5` | 98/1 | Congelada |
| #276 copia privada | `cf1539e7c63b491076ddb590a5597b7f6afbeb4a` | `02712b5` | 98/1 | Congelada |
| #275 continuidad | `bd4a6eb6acf399f950534960d84cdf2c3afeb1a4` | `02712b5` | 14/1 | Descripción avanzada; archivos antiguos; reconciliar |
| #274 núcleo | `2da9d49fdc508aa3fbd9012741ebb97356707135` | `02712b5` | 98/1 | Congelada |
| #273 A0 | `112eaf520157fb3f25a227b3c25fc48041220019` | `02712b5` | 98/1 | NO-GO por intermitencia local; no propagar |
| #271 Perla RoomPlan | `b052387b86646a3a2ebe9d9f087d44b1f077a2bb` | `497c37fb` | 40/1 | Aceptación UX y autorización propia |
| #267 OP-07 lab | `f48614f22e34478f0f15d4d39327b8b0f0e8a259` | `163df68` | 19/1 | Preservar lab, NO fusionar como producto |

#273–#279 son verdes en sus HEAD individuales, pero no acreditan compatibilidad con master nuevo ni la estabilidad de WebKit. Algunas refs de merge devuelven null. No tocar sus HEAD para eliminar conflictos ahora. #275 no es una PR de implementación ni un motivo para retrasar #288.

### 1.4 SMART: cierre del corte ya autorizado, no replanificar

GitHub calcula `d432f4d688581d3810a17d5b090011289a7f7239`, padres `a02af9454cedc02c5dd26e92260a339cf10c794a` + `11b3c78224f1b4eadfc4a8cbf5e0bdcd16405151`, árbol exacto `e57089f61dc7a915f316a176280e4c08ebd49057`. **Coincide con el árbol autorizado.** Comparé los cuatro HEAD originales con el HEAD #288: todos son ancestros (behind=0), K4 incluido una vez. Pruebas previas comunicadas 19/19 dirigidas y 9/9 de navegador; la matriz nueva se ejecuta sobre #288. No fusionar por separado ni repetir K13/R1. Condición: verificar gate remoto, HEAD/base/árbol vigentes y Production posfusión. Si #288 se hubiera fusionado al leer, acreditar el merge real, marcar #280/#281/#285/#286 absorbidas mediante ascendencia y proceder al siguiente corte. Si cambia árbol, pedir autorización nueva. 

**Bloqueo nuevo detectado al cerrar este handoff (20/11, fallo ejecutado a las 09:51:42 CET):** [historical (presentation-c)](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44704778305/job/136181692580). Revisé el log y descargué el [artefacto TAP exacto #14615336294](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44704778305/artifacts/14615336294), asociado a `11b3c78224f1b4eadfc4a8cbf5e0bdcd16405151`. `presentation-section.browser.test.cjs` pasa 7/7; `presentation-visit.browser.test.cjs` pasa 5/6. Falla subtest 4 «Escape while walking returns to the presentation; five cycles keep resources stable», `tests/presentation-visit.browser.test.cjs:102:1`, aserción línea 110:42: `geometries stable over cycles: 1087,1087,961,1087,1087` (ERR_ASSERTION). El dato muestra una caída y recuperación de recuento, no un crecimiento monotónico en esa secuencia; NO prueba por sí solo fuga de recursos, ni un flake inocuo ni relación causal con SMART. Codex debe comparar el caso dirigido sobre master efectivo y candidato, con mismo entorno y aserciones, instrumentar escena/recursos/estado de retorno Escape, verificar tiempos y propiedad de la geometría. Si es un problema de temporización, acreditar su causa y autorizar únicamente el relanzamiento dirigido correspondiente; si hay regresión, corregir mínimo, preservar las pruebas y presentar nuevo HEAD/árbol para autorización. No ejecutar todo otra vez ni fusionar con gate rojo. El último master y objeto de fusión siguen intactos.

Valor funcional a comprobar en el producto: K4 UX-24/UX-26 sugerir tipo de estancia usando autoridad única en project-core, intercambio de usos con undo; K9 GOV-03 registro de capacidades con evidencia y nivel honesto (K4 integrado discreto; F0 v2 no activo); UX-03 mide caras reales de muros interiores, bruta/huecos/neta de `quantity-core`, por nivel y sin asumir 2,8 m; AST-01 tarjeta Añadir planta abre `building-ui` sin crear planta automáticamente, mantiene máximo de dos, diferencias de significado de planta, ES/EN/ZH; no mutación hasta acción del usuario. 

### 1.5 Metodología de verificación y límites de esta foto

Auditoría de solo lectura mediante GitHub y Vercel. Enumeración de 351 referencias de rama de floorplan-3d (cinco páginas consultadas) y las tres de Simulator; contrastadas las ramas relevantes y los handoffs. No es auditoría funcional exhaustiva de cada rama ni de cada línea. Diferenciar [R] remoto comprobado (commit, árbol, PR, archivo), [CI] check remoto, [E] evidencia de pruebas publicada/comunicada por agente, [P] aceptación del propietario registrada y [V] pendiente de corroborar. No se han ejecutado nuevamente las pruebas locales; no hay acceso al PC de Codex. Los objetos locales no consultables no se acreditan como merges. No se ha modificado ningún repo, despliegue, regla, cuota o workflow.

## 2. Qué existe y no se vuelve a construir

RUBIK es una plataforma de arquitectura y continuidad de proyecto, no una colección de demos. Ya tiene editor 2D, muros rectos, huecos, estancias, muebles, catálogo, materiales, 3D, día/noche, cámaras, navegación orbital, Recorrer, minimapa, accesos por estancia, puertas, Dibujo Vivo, secciones, fachadas, axonometrías, captura y presentación, Comparar, variante local, medición, presupuesto y Evolución de obra 4D. Edificios con dos niveles y hasta cuatro escaleras rectas dentro del alcance histórico; importación guiada imagen/PDF/DXF/IFC/RoomPlan; calibración estimada/manual; BC3, C1–C4, BCCA-ES, CON-03 presupuestos. R02-A techos y R03 armarios ya experimentales en master. No presentarlos como normativa, fabricación o precisión certificada.

Autoridades a preservar: `project-core`/FloorPlanProject (modelo, geometría y operaciones), `quantity-core` (medición), presupuesto existente (partidas y precios verificables), una única sesión/historial por proyecto, `FloorPlanPersistence` (revisión confirmada F0.2b), expediente v1 y `contentId`, `View3D`/renderer y render bajo demanda, `FloorPlanConstructionVisualState` y `construction-schedule-core`, biblioteca/Asset Lab/F3 y recursos privados F0, `FloorPlanPresentation`/Comparar/Studio, `ProposalV1` (K13), registro de capacidades (K9, aún en #288), registro de herramientas Asistente/MCP, identidad futura RubikPrincipalV1, ledger común. No motor geométrico, compositor, visor, scheduler, catálogo, identidad, protocolo de escritura, reloj del producto ni inspector paralelos. Permitir módulos puros auxiliares que consumen una sola autoridad y declaran sus límites. 

El Asistente V2 local sin LLM, dos operaciones revisables y undo, MCP stdio etapa 1 (ocho herramientas de lectura) y etapa 2 propuesta `propose_layout` no autoaplicada ya están integrados. No confundir con MCP 3/4, escrituras remotas, agente multimodal, proveedor real o servicios IA activos. Beta privada de V3/FOT/CAT integrada pero desactivada; Render IA D1 tuvo aceptación histórica y posteriores incidentes de proveedor. No inferir actividad real actual. Enlaces de clientes GOV-08 S1–S3 con caducidad/revocación acotados; Blob público directo residual, no portal privado multiestudio. 

## 3. Registro de las 23 piedras SCULPT (14 + 3 + 6)

Cada piedra es una familia de transferencia. Estado de la porción objetivo y no de todo el donante. No crear nuevos IDs de producto. El objetivo es que cada capacidad útil llegue a su consumidor; los descartes y HOLD también se registran, no se importan por obligación. 

| Piedra | Estado vigente | Fuente / destino / siguiente gate |
|---|---|---|
| OP-01 Persistencia | Integración parcial, ruta crítica | #262/263/264/270/269/272 integradas; A0 y #274/276–279 pendientes; cierre F0 y F1 privada |
| OP-02 Render eficiente | Integrada #266 | mismo renderer, reposo cero; QA hardware real y regresiones de nuevos consumidores |
| OP-03 DXF | Integrada con límites #265 | G-02, pruebas CAD externas humanas y fallo edificio a resolver |
| OP-04 Unión escaneos | Integrada #284/#268 | unión estimada rígida por una puerta, #271 UX independiente y G-04 no completo |
| OP-05 GLB propios | Lab avanzado sin integrar | `a722f9dd`, Asset Lab/F3/F0; referencias, licencias, recuperación y cuota |
| OP-06 Edición múltiple | Pendiente de SCULPT incremental | selección múltiple, marquee, alineado, agrupación/transformación/duplicación; editor y undo, OP-07 |
| OP-07 Muros curvos/inclinados | Desarrollo avanzado, no cerrado | 9 parches `4a3118d6`/`04b8e6f2`; residuales S7 y Blender/DXF; §6 |
| OP-08 Escaleras/edificios | Parcial (producto actual) | L/U, apilado y traslado entre niveles, no reescribir building-core; §8 |
| OP-09 Plantillas paramétricas | Pendiente de desarrollo diferencial | vivienda/estancias L/T/U, GEN-01/ProposalV1, una geometría/solver |
| OP-10 Blender | C1–C5 y C7 observada terminadas, no integradas | `6d3e5260`, Codex `eb0a7ee9` local; aceptación visual P; C6 futuro §4 |
| OP-11 Ambientación | Pendiente | vegetación, personas genéricas, vehículos, entorno con licencias; biblioteca única OP-05 |
| OP-12 MCP interactivo | Infraestructura parcial integrada | MCP etapas 1–2 y ProposalV1, nuevo delta no desarrollado; permiso/confirmación en 3–4 |
| RG-01 Reforma foto | Simulada/parcial, no integración nueva | RoomGPT referente UX; FOT-01 privacidad/estado y activación real solo autorizada |
| RG-02 Estilos | Simulada/parcial, delta pendiente | PromptRecipeV1 y controles actuales; no backend legado ni proveedor duplicado |
| R01 Reconocimiento raster | Laboratorio preservado | #191/#205 cerradas no merge, F2/G-01/G-06; evaluación real, §8 |
| R02 Techos | Parcial experimental #223 | x-r02a-ceiling, deshacer, referencia vertical y aceptación; R02-B pendiente |
| R03 Armarios | Parcial experimental #222 | x-r03-cabinet, medidas, aceptación, entrega y privacidad; no fabricación |
| Simulator A Fábrica 4D | Cerrada técnicamente en Chromium | `09557c4c`, parche 5 archivos; Evolución, validación visual y actual base |
| Simulator B Dirección cinematográfica | Núcleo funcional, pausa | 11/11 puras; navegador, demo/CLASSIFY/HANDOFF pendientes; reanudar con mandato |
| Simulator C Etiquetas HUD | Cerrada técnicamente en Chromium | `b05e5103`, etiquetas 3D sin solapes; 2 archivos + 2 puntos de index; dispositivos |
| Simulator D Captura reproducible | Cerrada en Chromium con contrato limitado, gate externo abierto | `f31da812` + `8fb99b81`, Firefox diagnóstico previo no idéntico; §5 |
| Simulator E Colisiones | Cerrada técnicamente para QA acotada | `79a28ebf`, candidata local Codex `a5d4ccde`; herramienta aislada |
| Simulator F Sonido | HOLD derechos | no distribuir audio/GIF/samples; alcance independiente y decisión futura |

**Balance operativo de las 23:** OP-02/03/04 integradas (límites); OP-01/R02/R03/OP-08/OP-12/RG-01/RG-02 parciales o experimentales; OP-10 y Simulator A/C/D/E desarrollos cerrados en su alcance sin integración (D gate externo); OP-05/R01 lab avanzado; OP-07/B desarrollo parcial; OP-06/09/11 pendientes; F HOLD. Estas categorías son una lectura de transferencia, no reemplazan los estados de los 98 IDs. No declarar todo OP-10 (C6) ni todo C (inspector general) terminado por cierre del alcance acotado. 

## 4. OP-10 BLENDER — siguiente corte tras SMART

- Fuente congelada [6d3e5260fe4d7a8877291bd77983727582e7334e](https://github.com/Juanmaes83/floorplan-3d/commit/6d3e5260fe4d7a8877291bd77983727582e7334e), rama `claude/compassionate-galileo-mlgigy`, árbol `8483078505c56bb51bac27a2da38c2e18568ed03`. [Handoff](https://github.com/Juanmaes83/floorplan-3d/blob/6d3e5260fe4d7a8877291bd77983727582e7334e/docs/integration/OP10-BLENDER-HANDOFF.md). Laboratorio histórico `claude/sculpt-op10-blender@611b2f1d1dda473a4d95f7f6153960cd2ac2ad8f`, no usar como candidata final. El exportador histórico `codex/rubik-blender-candidate@86c20753` está incorporado vía #24; reutilizarlo, no segundo GLB.
- C1 piloto offline mismo pipeline (46/46 muebles, desvío 0); C2 huecos/lámparas identificados sin piezas huérfanas; C3 27 defectos de caras coincidentes → 0 en escenarios; C4 captura visual de solo lectura estable y cancelable/GLB byte a byte; C5 Entregar → Documentación → Escena para Blender con ZIP; C6 adaptador preparado NO conectado a expediente/Studio E3; C7 cámara y luz observadas, no CAM-01 persistida. 7 escenarios sintéticos, contrato de fidelidad ≤0,001 mm, 7 reaperturas .blend, dos exportaciones idénticas; no certificación de obra. OP-02 3/3, Dibujo Vivo 8/8, Entregar 17/17, GLB 17/17 comunicadas.
- Residual final: 50 textos de interfaz + LEEME ES/EN/ZH; asistente no tapa botones en 1280×800/390×844/844×390, Escape; ZIP incluye `rubik_blender_prepare.py` con hash. Dos caminos A importación glTF (geometría, colores, IDs, cámara; no luz de visor/vidrio real) y B script Blender sin interfaz con sol/cielo/luminarias/vidrio/techos; 94/94 mallas en prueba B. No enviar fotos ni texturas, color plano por privacidad/licencias. Script rechaza Blender con interfaz, no prueba runtime de ese rechazo en entorno de Claude. Pruebas dirigidas residual 5/5, navegador 1/1, core 19/19. 
- CPU comprobada: rápida 640×400/16 muestras 5–15 s, revisión 960×600/32 17–63 s, entrega 1600×1000/128 243–633 s, pico 2,05 GB. No presupuestos GPU ni servidor; estética todavía representación arquitectónica, no render fotográfico premium. Aceptación visual de fidelidad registrada por Codex en #275 para fuente final; no equivale a calidad de foto ni gate de fusión. [Comparativa](https://github.com/Juanmaes83/floorplan-3d/blob/6d3e5260fe4d7a8877291bd77983727582e7334e/docs/integration/op10-evidence/rubik-vs-blender-viewer.png).
- Candidata local de Codex `eb0a7ee98d7b5013d03ad6869eb690a907b258c0`, árbol acumulado sobre SMART `96b0693e477ea97db70f5042e01b38bd1e97116f`. Merge local previo `e638ee8b35089d328840ebccbe2b585b771fc1fe`. Ajuste mínimo `acwall` (lama/rejilla 1,22 cm²) prueba dirigida 0 solapes; officechair falso aviso. C5 Firefox Xvfb/CPU y WebKit PASS comunicado; aviso ResizeObserver anterior también en SMART sin OP-10; no extrapolar estabilidad universal. Conserva 42 contratos CI y R02/R03. Colocar carga en index detrás project-package y antes del bloque final R03, preservar F0 y demás consumidores. Objetos locales no verificados en remoto. 

**GO para preparar y solicitar publicación/fusión tras #288, no autorizar aquí.** Comprobar base real, delta acwall y árbol; publicar un solo candidato, gate remoto, CI, evidencia visual ya registrada, aceptación de cambio de alcance si aplica, postmerge y Production. No esperar a migración F0.2c para interfaz C1–C5/C7 observada. C6 se conecta solo con lectura confirmada y E3; CAM-01 guardada y render premium son otros cortes. Rollback mediante revert del corte sin perder exportación canónica ni datos. OP-07 debe adaptar su comparador, no devolver cambios a rama congelada.

## 5. Simulator — estado real de A a F, no perder los cuatro cierres

Donante [simulator@57d562c44fd6a52ef10f5ffdb15c466d1c304345](https://github.com/Juanmaes83/simulator/tree/57d562c44fd6a52ef10f5ffdb15c466d1c304345), código MIT; fuente congelada `lab/sculpt-simulator-source-20261119@a78999a17dbba1a3516d86b0aa11e16033027740` (92 blobs según manifiesto). Referencias `lab/sculpt-simulator-references-20261119@710e9fc12f70f8436f1ee0ddecd8bbd795376e70`. No importar mundo de juguete, grúas ni audio; licencias MIT de código no cubren fuentes, GIF, muestras o imágenes. Playwright Apache-2.0 herramienta de pruebas. Laboratorio referencia RUBIK `02712b5`, solo lectura. [Handoff global VIGENTE](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab/blob/09557c4cac1e6390d3af56281922d8d43093234e/COMPONENTES/HANDOFF-SIMULATOR.md); las secciones históricas §1–§6 de ese documento NO son pendientes actuales. 

### 5.1 E — preflight temporal (QA) · primero de los núcleos aislados

[Handoff E](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab/blob/79a28ebfedba366dbf9a48233bafc8faa5634ae2/COMPONENTES/E-qa-colisiones-animacion/HANDOFF.md). Fuente `79a28ebfedba366dbf9a48233bafc8faa5634ae2`, árbol `353bcd1ed5280d39c823418b6017aedef83a82ec`. 8/8 puras, 14/14 trayectorias reales clear (13 vuelos de estancia y una transición de presentación; dos paradas), 5/5 casos controlados (válida, muro, dos intervalos discontinuos, poses ausentes, salto entre muestras), 975 ms, 139 obstáculos (82 macizos, 12 vidrios, 45 muebles de altura catálogo), 0 externos/errores. Baseline 4 variantes, `plant-collide` un intervalo combinado; ahora intervalos separados. SAT puro OBB; segmento lineal con esfera y muestreo/adaptación para caja, `clear/contact/incomplete`, excepción con motivo, margen 1 mm, radio plano cercano 0,0635 m para FOV 45° y aspecto 1,6. Datos de `Core.geometry`, marcos y alturas. 

- **Límites que deben acompañar la integración:** cámara como esfera, no física real; movimiento lineal entre muestras, no garantizar curva arbitraria; cajas con rotación requieren comprobación adicional, evitar `clear` si falta cobertura; planta activa, puertas abiertas por hipótesis/per-opening no lectura de estado real, muebles OBB/altura catálogo no malla; escaleras y otras plantas no cubiertas. Vidrio sí obstáculo. OP-07 requiere adaptación futura. No certificación de seguridad ni motor de navegación. En revisión de código conviene pruebas negativas de entrada no finita/radio/semiejes, inclusión de `to` no múltiplo, rotación/cobertura y timestamps; no expandir mandato a motor general. 
- Candidata Codex **local** `a5d4ccdef8b7be45fb1e456126fe3145009d7e19` (8/8 sobre F0.2b según #275), árbol de su corte `083e05368372bfe40d6c461ab6ab2e58edf2f451`; acumulado previsto tras OP-10 `6808c90cc42b11c137f6000544fc6a33bf8f3b`. Destino inicial `scripts/capture/simulator-e`, copiar procedencia, MIT, pruebas, no index ni UI. UMD posterior si consumidor de navegador lo necesita. No confundir con SHA del laboratorio. No asumir publicado; autorización específica y gate sobre base efectiva. Reversión solo sus archivos. Conexión posterior con B/D, Presentación, Recorrer, Studio/preflight; registrar cuándo queda disponible y qué hipótesis usa.

### 5.2 D — captura determinista: la garantía HA CAMBIADO

- `05dbe0031388796e6bf8b04d97b73cd051e2aa10` (árbol `92e78188020f27d02b71e0d1e590a9f0408d1b1d`) resolvió bloqueo `FloorPlanPresentation.stop()` + `settle`: promesa de app dependiente del reloj virtual pausado, esperada directamente por Playwright. Se introdujo `act`, plazos reales, cancelación, cierre forzado y demo CSS/HDR. Claude reportó demo A/B idéntica. **Pero no es la fuente final.**
- `f31da81270bcc1f582cd2fab6a2a0be20e2c0d7f` (árbol `15e9a1bb7aaffb5431ba06e3b737dd88f99bd848`) reejecución independiente: 15/31 fotogramas diferentes en recorte incluyendo esquina de `#hint3d` (hasta 22 px, Δ27). Aislar WebGL, eliminar temporalmente visibilidad de overlays sin modificar layout ni proyecto; 3+3 sesiones con 0/31 diferentes. `window` ya NO es byte a byte. Ajuste plazo de prueba de 5 a 20 s; 5/5 navegador y 6/6 puras. `8fb99b818a094c23ed16e93dd21b81e42c38be99` (árbol `b3cb236d69d2383e6a4672d5b199f444b91865f1`) QA visual a 1440×900, hojas sin hueco vacío y MP4 de evidencia. Incorporar esta fuente posterior, no congelar el primer cierre como final.
- **Contrato vigente:** [EQUIVALENCIA](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab/blob/09557c4cac1e6390d3af56281922d8d43093234e/COMPONENTES/D-captura-reproducible/EQUIVALENCIA.md). `canvas3d` solo WebGL byte a byte **en entorno comprobado** Chromium 153.0.8010.12 + SwiftShader Linux/4 vCPU/Node22/Playwright1.63, 960×600 DPR1 y ejemplo. `window`: exacto fuera del lienzo, sobre el lienzo ≤1,2 % de píxeles y Δ≤64; observado 0,85 %, Δ52 en 124 pares (98 exactos, 26 equivalentes). `element`: hash sin garantía. Conservar hashes exactos en todos. Caso negativo de etiqueta ausente/desplazada debe fallar; no relajar por color de GPU. Limitaciones GPU física, DPR, GLB propios, sistemas operativos, navegador. 
- Diagnóstico anterior Codex sobre F0.2b y fuente `05dbe003`: Firefox 4 fotogramas, t=0,1 discrepó 2737 píxeles, 1,82 %, Δ89 con cámara igual; WebKit iguales en esa muestra. Esto NO acredita el HEAD posterior `f31da812` ni su aislamiento. Gate: probar el delta de `canvas3d` nuevo en Firefox/WebKit persistente (y Safari real según propósito); no prometer CDP CSS congelado en estos motores. Si no puede acreditar byte a byte, delimitar soporte antes de modificar contrato; no declarar multienvironment general. 
- [Handoff D actualizado](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab/blob/09557c4cac1e6390d3af56281922d8d43093234e/COMPONENTES/D-captura-reproducible/HANDOFF.md) y evidencias `evidence/demo-ab-final`, `evidence/determinismo`. Reloj virtual, red bloqueada, espera HDR, hashes/procedencia, snapshot no confirma F0, reposo OP-02, no mutación proyecto/localStorage/sessionStorage; memoria JS 21–31 MB reportada; rendimiento p50 0,6–1,7 s/fotograma demo SwiftShader. No acreditar no mutación de todo IndexedDB por estos checks: añadir en base F0 efectiva cuando proceda. `scripts/capture/` herramienta aislada bajo demanda, no sustituye grabador tiempo real `tour-recorder.js`; vídeo en QA visual no equivale a exportador MP4 de producto. Cerrar gate y autorización D por versión posterior a E, sin empezar una campaña de vídeo.

### 5.3 C — etiquetas de estancia sin solapes · corte pequeño visible

Fuente [b05e51032d7ab27263783e7aa6d1bb6ba54d2925](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab/commit/b05e51032d7ab27263783e7aa6d1bb6ba54d2925), árbol `cc96767dcd64caf2fe7418ee57f7b575ff90173f`. [Handoff C](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab/blob/09557c4cac1e6390d3af56281922d8d43093234e/COMPONENTES/C-seleccion-inspector-hud/HANDOFF.md). KEEP de HUD: recorte seguro, no inspector nuevo. `src/label-layout.cjs` → `js/label-layout-core.js` UMD; `src/rubik-labels.js` → `js/rubik-labels.js`; cargar scripts clásicos antes del módulo 3D y `RubikLabels.apply()` inmediatamente después de `labelRenderer.render(scene,camera)`. Idempotente, prioridad área/ID, desplazamiento limitado 72 px, compacta antes de ocultar, razón `data-layout`, guía SVG aria-hidden, histéresis. No guardar ni alterar geometría/cámara/proyecto ni CSS2DRenderer original.

| Viewport | Solapes antes→después | Visibles de 11 | Bajo paneles antes→después |
|---|---|---|---|
| 1440×900 | 4→0 | 9 | 4→0 |
| 1280×800 | 8→0 | 7 (1 compacta según informe) | 6→0 |
| 960×600 | 33→0 | 5 | 8→0 |
| 390×844 | 9→0 | 10 | 0→0 |

5/5 unit, 2/2 Chromium, p50 <8 ms 11 etiquetas, 35 fotogramas vuelo/385 apariciones 0 saltos, 3 cambios de modo. 0 mutación, errores, peticiones. **Calidad UX:** esconder etiquetas no equivale a resolver disposición del espacio; en 960×600 el lienzo mide 139 px de alto por guía. Inspeccionar evidencia `qa-labels.json` y capturas/videos; aceptación usuario + Firefox/WebKit/Safari y render bajo demanda, no bucle persistente. C no cierra todo UX-10. Revisar `AUDITORIA-UX-VISTA3D/` U3 pista recortada, U4 guía roba altura y U5 cabecera móvil como pequeños cortes del producto, no inventar ID ni meterlos de contrabando en C. C es independiente y puede prepararse en paralelo; el orden de publicación/merge debe proteger árboles autorizados. 

### 5.4 A — fábrica hilada a hilada en Evolución 4D · nuevo corte visible

Fuente [09557c4cac1e6390d3af56281922d8d43093234e](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab/commit/09557c4cac1e6390d3af56281922d8d43093234e), árbol `435810ed92a107005df9dc1cb334ff473cffec6f`. [Handoff A](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab/blob/09557c4cac1e6390d3af56281922d8d43093234e/COMPONENTES/A-construccion-procedural/HANDOFF.md). Donante `sims/site-shared/site.js#buildToyWalls` KEEP+GENERALISE. Muestra aparejo, huecos, dinteles y esquinas durante `0<avance<1`; fantasma/sólido antes/después sin cambios, demolición mismo tinte, no modificar plan ni selección/inventario/inspect; progreso de FloorPlanConstructionVisualState, A solo pinta. **Ilustrativo**, no despiece/cantidad, tiempos reales, estructura o normativa.

Cirugía de cinco archivos, 244 líneas añadidas / 5 eliminadas en `02712b5`: `js/masonry-core.js` (UMD RubikMasonry); `evolucion/masonry-three.js` (THREE r160 del producto, 2 InstancedMesh/muro); `evolucion/index.html` carga clásica tras adaptador de obra; `evolucion/fidelity-app.js` índice de muros por claves de inventario antes de `scene.load`; `evolucion/project-scene.js` tercer parámetro opcional, grupo visual y estado alterno. Parche `COMPONENTES/A-construccion-procedural/surgery/rubik-02712b5.patch` NO aplicar ciegamente, la base ya cambió F0.2b/K13/R1/SMART; verificar diff, lectores A0 y PR #276 etc en acumulado. 10/10 puras, 1/1 integración Chromium con parche en copia, 70/70 muros, 80 medios días visible, 0 antes y final, 2750 piezas <200 ms, 0 dientes/solapes/huecos en 18 esquinas ×14 hiladas según informe; pintar 6–10 ms/fotograma. Evidencias de vídeo 121 frames y obra sintética. Solo rectos; para OP-07 fallback sólido explícito/no fábrica si no compatible; no introducir aproximación por cuerda. Pruebas en otros proyectos, encuentros oblicuos, niveles, F0/Evolución, render y dispositivos. Aceptación visual. Rollback retirar 5 deltas preservando datos. No volver a incorporar maquinaria/atrezo descartado.

### 5.5 B — pendiente de reanudar / F — HOLD

B `src/shot-timeline.cjs` UMD puro, `poseAt(t)`, validación, inmutabilidad, paridad `film.js keyCam`, fin exacto, reduced-motion cortes, pausa/búsqueda/cancelación; 11/11 puras reportadas. `rubik-shots.cjs` usa View3D y paradas reales; prueba `test/rubik-shots.browser.test.cjs` escrita no ejecutada, demo previa de dos paradas obsoleta. Handoff global mantiene PAUSA; no hay `HANDOFF.md` individual consultable. Al reanudar: 4+ paradas, correspondencia pose↔fotograma, cancelación/restauración, fin exacto, repetibilidad según D vigente, reduced-motion sin barrido falso E entre cortes (separar salto de corte), CLASSIFY, preview y handoff; una demostración D+B+E. No segundo director ni reloj productivo. Mantener propuesta de destinos (núcleo en `js/shot-timeline-core.js`, adaptadores en `scripts/capture`), autorización nueva para conectar a Presentación/Recorrer/Studio.

F sonido queda fuera hasta derechos específicos, no copiar audio, temas, assets ni crear gasto. 

### 5.6 Orden de integración Simulator propuesto y decisión pendiente

Handoff de Claude sugiere C→A→E/D; #275 de Codex ya contiene OP-10→E→D sobre árboles preparados. Conservar la segunda ruta por economía de revalidación de los acumulados. Preparar C y A ahora sin publicarlas hasta poder fijar la base; después E/D o entre cortes SOLO con propuesta de árbol y autorización actualizada. No hay dependencia productiva estricta de C/A con D/E; sí pruebas visuales de C y algunas demos dependen de D. Si se desea priorizar un corte visible, presentar coste y nuevo árbol de C, no saltarse la secuencia. En todo caso, registrar una PR/corte exacto para cada una, no dejar C/A en laboratorio. La entrega A/C acaba de aparecer y todavía no consta registrada por Codex en #275: actualizar. Cuatro piedras técnicamente cerradas NO son cuatro funciones ya disponibles.

## 6. OP-07 — cierre definitivo de Claude Code 1

Ramas verificadas: `claude/op07-integracion@4a3118d63d3d7280aae8ea8251dad07302bd6017` (árbol `a3cb7fb3e896279af5721f7c10f7c97d9098a870`), `claude/op07-serie-local@04b8e6f29d48e4dfac02789b03506eaeec0369f5` (árbol `342752817fb08063501697b02df1e3644c284772`), `claude/op07-blender-lab@de74c86f72340518b5ebc7b12e921d5f2708f2dd` (árbol `50c02fb307a27fd359cf9a0531d413748bed3ebe`). Sin nuevos avances remotos en esas tres ramas a este corte. [Handoff](https://github.com/Juanmaes83/floorplan-3d/blob/4a3118d63d3d7280aae8ea8251dad07302bd6017/labs/sculpt/op-07/HANDOFF.md). #267 es fuente del laboratorio 34/34, no vehículo de producto. 9 parches y MANIFEST.sha256, script `node labs/sculpt/op-07/integration/apply-and-test.cjs [--browser] [--full]`; serie sobre `02712b5`. 1501/1501 puras, 8/8 navegador Chromium comunicadas. No repetir antes de trabajar.

| # | Corte preparado | Valor y condición de cierre |
|---|---|---|
| 1 | S1 | contrato mayor 2.0 solo documentos con `curve`/`heightEndMm`; v1 intacto; versión única `parseVersion/versionAtLeast/raiseVersion`, compatibilidad building-core; no activar v2 hasta que todos los escritores rechacen pérdida |
| 2 | S2 | plano piezas por faceta, política `Core.WALL_PATH` de 1 mm y cap 1024 (decisión de preparación registrada, no permiso producción) |
| 3 | S3 | medición izquierda/derecha, huecos, trapecios/mochetas, presupuesto v1 byte a byte |
| 4 | S6 | DXF por facetas compatible relectura, v1 byte a byte; CAD externo pendiente |
| 5 | S4 | 3D por altura variable y piezas |
| 6 | S5 | curvar/inclinar/dividir operaciones atómicas, rechazo al atravesar hueco |
| 7 | S3b | `Core.roomRing` suelo, perímetro, caras, presupuesto consistentes, cóncavas/convexas y ambos lados |
| 8 | S5b | manipulador central + panel Forma del muro: un arrastre = un historial y guardado, ratón/teclado real |
| 9 | S4b | juntas compartidas, costura 4,28 mm→0 en pruebas, normales suaves solo curva, dinteles facetas, OP-02 0 frames reposo, rebuild ~+5 % |

**Decisiones ya de preparación:** D-OP07-1/2/3 históricas; versión mayor D-OP07-4 opción B y resolución 1 mm/cap 1024 aplicadas al candidato. El propietario debe ratificar adopción productiva con su autorización exacta. F0.2b ya integrada: no es excusa para demorar el trabajo de laboratorio. 

**Pendientes obligatorios y orden de misión en nueva ventana** (no empezar la misión desde cero):

1. Blender `scene-fidelity.cjs` medición y geometría real de facetas/alturas/normal de huecos/suelo roomRing; añadir escenario `f7-curved`; reapertura .blend y geometría/IDs; bpy 5.2.1 si disponible (`python3 -m venv V && V/bin/pip install bpy==5.2.1`). Basarse en candidata final `6d3e5260`, y cotejar delta acwall de Codex; no modificar fuente congelada. Parche independiente.
2. Reproducir posible defecto real de `roomRing` al dividir muro curvo: busca cuerda original, tras división cambian las cuerdas y el polígono guardado puede no reconocer ambas piezas. Medir área/perímetro/caras/2D/3D, presupuesto, huecos y deshacer/rehacer. Corregir solo causa acreditada, no segunda geometría ni anillo inconsistente. Curvas cóncavas/convexas, estancias a ambos lados y casos de juntas múltiples. 
3. S7 `Core.guardSave(prev confirmado, siguiente, intent)` en `js/persistence-editor.js` F0.2b integrado, sobre copia; enlazar intención a operación/revisión y no `lastEditIntent` global persistente. Deshacer/rehacer y cola de ediciones, rechazo sin divergencia, conflicto revision, persistencia edificios, importación, reapertura, recuperación/exportación, lectores antiguos v1/degradados rechazan v2 sin pérdida. Corregir validación `validateOpening` que aún usa 16 facetas (pasar política WALL_PATH). No convertir v1 masivamente, rollback de código nunca abre v2 como recto ni sobrescribe. A0 protege lectores antiguos, no sustituirlo por versión mayor; garantizar path de escritura íntegro antes de usar campos nuevos. No activar migración real.
4. DXF CAD externo `tests/g02-dxf-cad.py`, unidades/huecos/cotas/relectura/longitudes y aceptación arquitecto en dos CAD. G-02 active building level download falla también en baseline, documentar/corregir como corte separado si autorizado, no atribuir a OP-07. No llamar validación CAD real a la relectura del propio parser.
5. Actualizar previews afectadas e `INTEGRACION.md` (describe seis parches antiguos), huellas, plan/rollback, evidencias F0 y deltas A/E para compatibilidad de muros (fallback de A; E no debe tratar irregularidades como cajas imprecisas favorables). Verificar convivencia F0, SMART, R02/R03, OP-02 y OP-10 efectiva. Firefox/WebKit, dispositivos, aceptación visual y una validación acumulada final. Congelar serie y entregar Codex. No abrir PR productiva ni fusión. 

## 7. Ruta crítica F0, A0, R1 y comercialización

### 7.1 Qué está y qué falta (NO equiparar F0.2b con F0 completo)

- F0.1 expediente núcleo v1, F0.2a IndexedDB, permiso persistente/recogida, P0 foto MUE-01 (#270), F0.2b consumidores (#269) y R1 documental (#272) están en master. F0.2b opera en origen aislado, Editor, Comparar y Evolución comparten revisión confirmada. F0.1 expone identidad `contentId`; no confundir hash de evidencia ni revisión observada con confirmada. P0 H-1 protege `photo.imageKey` con lock, pin y exclusión frente a GC; referencia viaja en paquete ordinario, foto no; no revertir sin alternativa equivalente. H9: downgrade del esquema IndexedDB puede dar VersionError; prohibido borrar DB o forzar downgrade para resolver. F0.3 permiso original (#264) no es la nueva interfaz F0.3 de #278/#279.
- A0 #273 `112eaf52`, árbol `40bd2d269450b5e12ea8dc0401299d504ce40aad`, corrige fixture que esperaba .menu-pop dentro de details cerrado; mantiene espera de animaciones visibles; cuatro ResizeObserver difieren escrituras al próximo frame (headerEnd/fabTop/app-shell.js, position/professional-workspace-ui.js, fitWalkCard/index). Firefox 21/21 (13 residuales+8 barrera). WebKit persistente 17/21; 4 fallos R1-T02b 1440×900, R1-T04 390×844 y originales R1-T02/R1-T04, todos F0.2b activo; repetición de 4 fallidos 4/4 sin aserciones cambiadas, confirma intermitencia, no causa. [Comentario Claude](https://github.com/Juanmaes83/floorplan-3d/pull/273#issuecomment-7023974320), [diagnóstico inicial Codex](https://github.com/Juanmaes83/floorplan-3d/pull/273#issuecomment-7021022541). CI normal verde no sustituye ejecución específica. No ocultar errores ni repetir hasta verde. 
- A0 siguiente acción: diagnóstico acotado de ResizeObserver, trazar callbacks, elementos, fase de frame, estilos y tamaños (mismo HEAD y baseline), preservar error sin filtro, reproducir y fijar causa concreta. Pruebas `a0-browser-residuals.browser.test.cjs`, `a0-writer-fence.browser`, núcleo y copia en WebKit persistente/Firefox. Registrar perfiles y tamaños. Claude 1 puede corregir cuando Codex aporte reproducción, sin paralizar OP-07. Una única propagación después de cierre, nunca seis pushes de tanteo. Los cuatro fallos preexistentes walk-controls se documentan por separado.

| Corte | Autoridad / estado | Salida exigida |
|---|---|---|
| A0 #273 | barrera de escritores/epoch y aviso; Evo satélite guardado | WebKit estable, negativos de lector antiguo, despliegue independiente, rollback compatible |
| #274 | store-v2 `rubik-sota-store-v2`: docs/resources/refs/journal/conflicts/meta, commit atómico e imágenes del diario explícitas | aislamiento, adversarios, preservación recursos y referencias |
| #276 | copia de emergencia privada completa/verificada/restaurable | consentimiento, huellas, restauración en DB nueva, Blob IDB persistente, no publicar fotos |
| #277 | migración sintética preexport/lease 2 min/fencing/cuota/3 reintentos/marker witness | crash, exclusión, no borrar legado, preserva escrituras nuevas, recuperación fail closed |
| #278 | estados F0.3 interfaz única, 19 estados | sustituir aviso A0, no apilar banners ni controles ocultos, ES/EN/ZH y mobile |
| #279 | acciones guardar, recuperar, backup; aisladas | flujos, estados, keyboard, permisos, sin segunda persistencia |

Cadena congelada hasta A0. Los árboles acumulados previos sobre SMART son antecedentes y no autorizaciones nuevas; Codex había comprobado equivalencia de seis merges vs un merge del HEAD #279 en una simulación (`1bf57cd5acbe84f2b04ccefe00ab3cb0f7f9a1c6` antes de novedades); recalcular con master efectivo. Recomendación: A0 independiente con rollback verificable, resto consolidado solo si mismo árbol, evidencia y autorización. Integrar aislados es diferente de activar. **Mínimo 7 días de convivencia real A0 acreditados antes de migrar datos reales**, recuperación, copia privada, UI nueva y autorización de migración separada. No empezar a contar desde CI verde, rama local o este handoff. No promover global F0.2b ni F0.2c por merge. F1 sincronización/almacén privado multidispositivo y roles siguen pendientes; definir contrato con GOV-06a/08. F0/F1/F2/F3 del ADR continuidad no confundir con F2 reconocimiento/F3 catálogo ni fases visuales F03–F09.

## 8. Recuperación de otros laboratorios y familias maduras

### 8.1 Studio E3–E7 · prioridad de valor profesional

[Informe 21](https://github.com/Juanmaes83/floorplan-3d/blob/8c53263423359e4fa71fc25494c7a3b6ee1f7fd1/labs/studio-presentation/reports/21-E3-CONTINUIDAD-F0.md) `lab/studio-presentation-e0e1@8c53263423359e4fa71fc25494c7a3b6ee1f7fd1`, árbol `1bbe949e09eb056ce483a00993b4b8aa8d35fc2f` (verificado sin nuevo commit). Base recuperada `0cf7c2e5afa28a4119da4ad6f3a9764f2022f363`. E2 integrado vía #259, no reconstruir. 21 recetas, seis perfiles, 43 fuentes, Architecture Book, FF&E 46 instancias/40 fichas, economía, 24/24 y estados 23/23; N01–N08 y RP-Q01–12 acreditados en alcance lab, 117/117 recetas y adaptador F0 11/11, RP07 resuelto, D08 visual `ca9fcc1`. N04 sin acreditar redistribución del núcleo económico. C/F son contratos, no emisión. No tratar 612 rutas históricas ausentes como funciones. 

D4 previsión: preparar selector de recetas y adaptadores existentes en Entregar → Preparar entrega, `FloorPlanPersistence.readConfirmed`, identidad de expediente `contentId` y revisión (huella de entrega y revisión local separadas); no acceder a escritura de sesión, no fingir revisión si ausente. Recetas L sobre autoridad F0 habilitadas para preparación tras #269. Leer informe 21, no repetir todo el lab; gates de H08 (68 archivos VIS en público), N04/licencia, fuentes excluidas, Safari/dispositivos físicos, escala física, revisión visual, permisos y base efectiva. Verificar mandato D4 (texto propuesto al usuario, no se ha acreditado como autorización de producción). No emitir C/F ni activar global. **C6 Blender** vínculo observado→confirmado únicamente cuando Studio/F0 lo permita; mantener expediente canónico. E3 debe tener una interfaz real, no otro compositor. 

| Etapa | Salida y dependencia |
|---|---|
| E2 | integrada: comparativas ENT-04, economía/vigencia/órdenes, conservar |
| E3 / K10 | selector de recetas y adaptadores sobre lectura confirmada; D4 y gates de arriba |
| E4 | Architecture Book/FF&E y láminas con escala/trazabilidad; resultado, imagen, cámara y revisión persistidos (coordinación K11/K12); ENT-05/IMG-12/ENT-01 |
| E5 | PDF editorial avanzado, banco comparativo y ADR de motor/reutilización; no compositor duplicado |
| E6 | lotes ENT-02/ENT-06, coste previo/ledger, cancelación, caducidad/revocación, privacidad GOV-08 S4/S5 |
| E7 | portal, ENT-07 firma/white-label, GOV-06b identidad multiusuario y legal; mandato separado |

**Nota de nomenclatura:** K11/K12 son cortes de resultado/cámara que alimentan E4; no sustituir el alcance Architecture Book/FF&E por solo cámara. E4–E7 conservan trabajo de laboratorio/contratos y etapas por desarrollar, no declarar todos terminados por existencia de recetas. 

### 8.2 OP-05 Biblioteca GLB privada · potencial recuperación de Asset Lab

[README](https://github.com/Juanmaes83/floorplan-3d/blob/a722f9ddaf735d1ef45ffc17c6fbb87c2e8f43a6/labs/sculpt/op-05/README.md) `codex/sculpt-op05-lab@a722f9ddaf735d1ef45ffc17c6fbb87c2e8f43a6`, árbol `f52f7b75db574f4d6cf7ea81fbf6357ee08f3e03`. 64 rutas fuente, 73/73 donante, 1/1 Chromium y 5/5 admisión. SHA bytes, derechos/deduplicación/conflictos, no externos, ciclos/índices/amplificación, perfil autocontenido. F3 8 MiB, 4 JPEG/4 texturas/8 materiales, ≤2048 px, memoria decodificada/GPU 16/24 MiB; donante tiene límites distintos, no copiar. Contrato private-glb-references.md; sin persistencia/red propia. Reusar Asset Lab/Amueblar, catálogo F3 para representación y F0 adjuntos privados. F0.2b ya permite preparar puente; F0.2c transacciones/adjuntos por ámbito, F0.3 cuota/copia/estado; prueba fallo/recuperación, export pública genérica, backup privado, licencia/identidad, sin GLB público indiscriminado. Precio/SKU acreditado si presupuesto, no foto-a-mueble automático. OP-11 inventario de vegetación/personas genéricas/vehículos CC0: ~204 activos Kenney inventariados históricamente, revalidar licencia de cada activo, no descargar todo. Aceptación de contrato antes del uso productivo. 

### 8.3 R01, R02, R03 y familia visual

R01 [#191](https://github.com/Juanmaes83/floorplan-3d/pull/191)/[#205](https://github.com/Juanmaes83/floorplan-3d/pull/205) cerradas no merge, ramas `lab/sculpt-r01-recognition@2158fd19207e4a33aeee8fed26d1b29be96103fa`, `lab/sculpt-r01-f2-readiness@2dca1c547ff67978d3387805d9f6bf94efadc92b`. Worker `analyse`, cancelación/timeout, hash píxeles y `scripts/f2-wall-evaluation.py`, 26 pruebas comunicadas, 6 planos sintéticos×2, `f2_validated:false`. Recuperar solo delta en wrapper `propuesta`, calibración congelada, OCR local sin escala inferida, huecos/estancias, 20 planos autorizados/5 sesiones, tiempos, error, precisión/recall, correcciones humanas, GOV-05 y móvil. No prometer precisión ni % mejora sin medición. 

R02-A #223 integrada experimental, `x-r02a-ceiling`: confirmar altura, referencia vertical, edición/undo, pasos libres y aceptación; R02-B no iniciado. LUZ-01 no equivale a cálculo lumínico o MEP. R03 #222 integrada experimental, `x-r03-cabinet`: dimensiones paramétricas, edición, 3D/deduplicación, falta aceptación profesional, medidas y entrega/privacidad; no fabricación ni catálogo comercial. OP-08 conservar building-core dos plantas/4 escaleras rectas, no atribuir L/U o traslado ya hecho. 

F03 V2 rama `feat/visual-families-next-f03-f04-f05-v1@e01e72d0e587c7a05df9c51d536ad34adb15df05`; código `dd9c26ff47da38a2e1672121d55cf8c4ccd07f98`; decisión visual [archivo e01e72d](https://github.com/Juanmaes83/floorplan-3d/blob/e01e72d0e587c7a05df9c51d536ad34adb15df05/docs/qa/visual-families-next-v1/F03-V2-DECISION-METODOLOGIA-Y-SIGUIENTE-MISION-2026-11-05.md). 10/10 unit, 1/1 Chromium histor., 42 WebP `4400994`, GPU HERO 16.777.218 B frente a 17.000.000 B. `rough_plaster_03` aceptado visualmente para imágenes evaluadas y método transferible, no revoco universal ni GO global. OFF por defecto sin mutación persistida. Recuperar M1 PBR/UV/luz, M2 estuco/piedra/ladrillo/madera/cerámica, M3 fachada/ventana/esquina A/B/C, M4 móvil y hardware, M5 regresiones/fallback/pérdida contexto/ON/OFF/mem/p50/p95. F04 iluminación presentación, F05 encuentros, F06–F09 dependen de datos/geom. No confundir OP-10 exportación local con IMG-03 coste IA o CAM-01 persistida. 197 rutas visuales ausentes según auditoría histórica no equivalen a 197 funciones. No integrar rama visual entera. 

### 8.4 Nuevas capacidades a iniciar solo cuando el carril anterior esté cerrado

- OP-06: selección múltiple y herramientas de edición geométrica con historial único; reutilizar R03/editor, no segundo modo que contradiga selector. OP-08: L/U, apilado, traslado, niveles y validación de geometría. OP-09: plantillas paramétricas sobre generación existente y ProposalV1, operaciones atómicas. OP-11 ambientación licencia única y privacidad. OP-12 MCP interactivo: registro único, etapa 3 simulada aislamiento/propuesta, etapa 4 aplicar confirmado en variante, rol/permiso/undo; no escritor remoto sin gobernanza. RG-01/02 recuperar UX/recetas sin backend antiguo/dup proveedor.
- K14 MSPDI XML desde `construction-schedule-core.serialize` con apertura manual MS Project/GanttProject. PAN-02 360 modelo real sin IA recomendado antes de PAN-01, D10 decisión pendiente; VID-01 B+D/E y presentación, VID-02 video IA aplazado. PROC A no añade despiece ni motor de obra. K11 persistencia imagen + revisión y cámara + K12 cámara 2D y luz (CAM-01/IMG-07) no cerrados. K5/K6/K8 identidad/enlaces/ledger antes de servicios; GOV-05 jurídico, ECO-03 piloto y ECO-02 precios. 

## 9. Plan de implementación — foco, etapas y asignación

Las prioridades siguientes son propuesta operativa, no promesa de plazos; trabajar por gates y dependencias. No paralizar los carriles independientes ni abrir cinco frentes nuevos por token disponible. Prioridad a recuperar trabajo terminado y cerrar residuales, después capacidades nuevas.

| Etapa | Codex (integraciones y candidato) | Claude 1 | Claude 2 | Resultado verificable |
|---|---|---|---|---|
| P0 ahora | #288 CI/merge, postmerge, reconciliar originales; #275 actualizado | OP-07 trabajo restante en copia de master | Preservar A/C/D/E y actualizar handoff para Codex; sin rehacer | SMART conectado y registro coherente |
| P1 siguientes cortes | OP-10 candidato final → E aislada → D aislada; nueva autorización cada una; preparar C/A y #271 | Terminar OP-07, atender diagnóstico A0 cuando exista | D delta multinavegador con Codex; B solo reanudada por mandato | Blender accesible, QA recuperado, C/A con ruta y preview |
| P2 interfaz visible y F0 | C HUD, A Evolución, #271 Perla, cerrar A0/agrupación aislada F0 | OP-07 final y revisión de consumidores v2; A0 corrección concreta y una propagación | Si se autoriza, cerrar B y D+B+E; pulir U3–U5 como deltas propios | A0 estable, nuevas superficies y protecciones acreditadas |
| P3 comercial local | E3 D4 preparar y publicar tras gates, C6, E4/K11–12; OP-05 puente | si OP-07 cierra, contrato versiones/persistencia y E3 según mandato | QA trayectorias, visual F03 V2/Blender premium offline por delta autorizado | Entregar trazable, OP-07 protegido, recursos privados seguros |
| P4 base segura | F1, K5/K6/K8, hardware, legal, K14/K15, piloto | arquitectura y pruebas adversarias, OP-06/08/09 únicamente cuando haya prioridad | QA/UX, OP-11, recuperación visual | hito B con seguridad real y piloto |
| P5 ampliación | E5–E7, K16 bajo autorización, GEN-01, demás olas | OP-12/ProposalV1, asistentes avanzados y F0 | B/D/E conexión producto, media/360, deltas RG según mandato | plataforma avanzada/premium con aceptación |

**Cómo ejecutar sin repetir el atasco:** un candidato remoto efectivo por corte y su CI; preparar acumulados locales transparentes sin lanzar nuevas matrices masivas; no publicar todos los laboratorios en floorplan-3d. Si CI aprueba y árbol exacto autorizado, fusionar sin pedir permiso redundante; si aparece nuevo árbol o alcance, nueva autorización. Verificar Production y postmerge cada vez. Si un flake real impide gate, preservar logs, causa, reproducción dirigida y único rerun justificado; no cancelar gates ni aceptar por casualidad. La cuenta GitHub Pro no autoriza costes adicionales. No reabrir matrices antiguas ni hacer polling con créditos de Claude. No forzar master/rebase/squash sustituyendo el merge commit autorizado. Conservar ramas originales; reconciliar las absorbidas con ascendencia y enlace, no borrar.

### 9.1 Mandatos cortos para continuar sesiones

**Codex:** «Master de corte `a02af945`, árbol `3bd385bb`, postmerge 3/3 y Production READY. #288 HEAD `11b3c78224f1b4eadfc4a8cbf5e0bdcd16405151`, árbol `e57089f61dc7a915f316a176280e4c08ebd49057`, CI en curso con fallo explícito presentation-visit (ver §1.4). Diagnostica y acredita gate; verifica delta desde este handoff y ejecuta autorización vigente sin nuevos permisos si permanece exacta. Después presenta candidatos OP-10 `eb0a7ee9` y E `a5d4ccde` sobre base real. D debe recuperar fuente posterior a `05dbe003`: contrato actualizado `f31da812`+`8fb99b81`; además A `09557c4c` y C `b05e5103` están cerradas técnicamente y deben entrar al registro/versionado. Prepara C/A con destino real y no las dejes sin integrar. Reconciliar #275, #271 UX y D4 E3. Mantener A0/F0.2c/F0.3 congeladas y todos los límites.»

**Claude 1:** «Nueva sesión: lee únicamente OP-07 HANDOFF.md `4a3118d6` y §6 de este documento. F0.2b ya está en master, R1 integrado; actualiza base de las copias. Continúa nueve parches sin repetir baseline; f7 Blender, roomRing tras dividir, S7 guardSave/revisión/intención/tolerancia, CAD, previews/expediente. Mantén fuente OP-10 congelada. A0 112eaf52 no propagar y coordinar causa WebKit. Sin PR productiva.»

**Claude 2:** «Lee estado vigente HANDOFF-SIMULATOR y los cuatro handoffs individuales en `09557c4c`. A/C/D/E cerrados en alcance declarado; no rehacer. Ayuda a Codex con D nueva fuente y diagnóstico Firefox/WebKit y entrega exacta C/A sobre master. B está pausada por mandato: no reanudar sin indicación; cuando se autorice, ejecutar pruebas escritas, demo y cierre SCULPT. F HOLD. No tocar ramas de Blender ni OP-07; no abrir PR productiva ni activar servicios.»

**Propietario:** acepta visual/funcional en Preview exacta (RoomPlan UX, C, A, OP-07, Studio, vídeo D/B), autoriza árbol de cada corte nuevo, revisa D4, límites de comercial/privacidad/gasto, CAD profesional, dispositivos físicos y pilotaje. No necesita revisar de nuevo un candidato exacto intacto ya autorizado. ChatGPT audita cambios y contradicciones, no ejecuta merges; devuelve GO condicionado o NO-GO y delta concreto.

## 10. Criterio de cierre, gobierno y registro permanente

SCULPT = SOURCE DISCOVERY (solo fuentes permitidas) → SOURCE EXACT (SHA, blobs, cierre dependencias, derechos) → ISOLATE → BASELINE → CLASSIFY (KEEP/GENERALISE/OPTIONALISE/REPLACE/REMOVE) → SCULPT → PULIR (observe/change/build/capture/critique/correct) → NORMALIZE (reutilizar autoridades) → VALIDATE (negativas, regresiones, rendimiento, no efectos secundarios) → PREVIEW → HANDOFF. Luego revisión humana, autorización y merge por Codex, postmerge/Production, conexión y activación autorizada. El cierre técnico puede estar acotado a navegador/fixture; declararlo. No copiar recursos con derechos dudosos. Donantes OpenPlan3D `771c9e1ad30bd1c3cc7584d6eca74deb2e14943d` y RoomGPT `611398c78da64f1794df2d99018c3d02d3ab0048`, fuente OP congelada `sculpt/openplan3d-fuente@6dadcbb`; worker iOS no accesible/licencia no acreditada, no reabrir investigación. X-01 a X-06 descartes históricos: telemetría decorativa; grúas/atrezo; MEP automático normas chinas; migrar CI Obscura; OSIRIS/GenCAD/CivilCraft/GeoModel3D/addons Blender; plazos PDF. No resucitar sin decisión.

| Gate de integración | Evidencia mínima |
|---|---|
| G0 identidad | repo, origen, SHA, licencia, base efectiva y árbol, delta semántico, ruta al consumidor, responsable |
| G1 compatibilidad | modelo/medición/presupuesto/render/historial/persistencia/biblioteca/identidad/gasto/propuesta únicos; v1/v2 y fallback |
| G2 datos/seguridad | negativos, permisos/privacidad/cuota, recuperación, no mutación ni datos reales por defecto, reversión |
| G3 CI | checks aplicables y postmerge definidos, resultado por SHA, skips justificados, pruebas dirigidas + regresión necesaria |
| G4 Preview | revisión visual/humana/profesional, dispositivos, evidencia exacta, a11y, no confundir captura con certificación |
| G5 autorización | para HEAD/árbol/base/alcance exactos; si ya concedida, preservar; nunca ampliar por equivalencia no acreditada |
| G6 merge | Codex, control exclusivo de escritura, verificar padres/árbol, CI postmerge y Production; reconciliar PR fuentes |
| G7 producto | interfaz/consumidor observable, procedencia y límites, promoción/activación/gasto/migración por decisiones independientes |

Estado de todo registro #275/matriz: `fuente → desarrollado → cierre técnico acotado → candidato aislado → validado → aceptación → integrado → conectado → disponible`. Mantener por cada elemento ID canónico, fuente y licencia, etapa, responsable, HEAD/árbol/base, evidencia, límites, PR y destino, riesgos/gates, siguiente acción, merge/Production/SHA/alias y fecha, autorización y rollback. Incluir A/C recién entregadas, actualización D y conexión E/B posterior. Si una propuesta se absorbe por otra, demostrar correspondencia/ascendencia o mismos delta/árbol, enlazar, no sumar prestación doble. Si se descarta, decisión y razón verificable. 

**Rollback:** revertir cortes por orden inverso real, solo con aprobación y pruebas; no reset --hard ni force push compartido. P0, A0 y v2 no revierten sin protección equivalente/lectura segura; mantener legado, recursos y almacenes IndexedDB originales, no borrar datos ni abrir v2 como recto. F0.2c necesita recuperación/copia y compatibilidad, rollback de código distinto de rollback de datos; aliases Vercel por origen independientes. Los 7 días de convivencia no se reemplazan por CI. No datos reales/fotos ni IA pagada, secretos, cuotas, Cron, servicios, GPU, promoción Alpha/Demo o firma sin permiso. Hardware real y legal por profesionales. Hacer accesibilidad, compatibilidad ES/EN/ZH y Perla UX-FIRST en interfaz. No prometer seguridad estructural, exactitud topográfica ni servicios que no estén activos. 

## 11. Las seis olas del catálogo: recorrido de cierre (sin perder el orden histórico)

Las olas originales no son macro-PR, ni el orden único para tareas independientes. Sus IDs se mantienen. El avance de F0, K13, #288 y SCULPT se superpone a la cartera, no se suma como IDs nuevos. [Catálogo maestro y olas](https://github.com/Juanmaes83/floorplan-3d/blob/a02af9454cedc02c5dd26e92260a339cf10c794a/docs/product/rubik-catalogo-maestro-mejoras-2026-11-09.md#5-orden-propuesto-olas).

| Ola | Lo existente / Recuperado | Trabajo residual y criterio de salida |
|---|---|---|
| 0 · Cerrar y ordenar | GOV-01a/b/c, GOV-09a/b, GOV-02/04, IMG-01/02 históricos cerrados/sustituidos; CI #260; #275 registra avances | GOV-03 único registro #288 K9, sello SHA y anuncio honesto; reconciliar matriz/documentos; respetar estados IA desactivada y alias antiguos |
| 1 · Vender lo que existe | HOM-01/02/03, demos HOM-04 limitadas; OBR-01; visita 3D y GOV-08 S1–S3 | K3 promoción específica; prueba del replay Dibujo Vivo/«Volver a ver» público; UX real y dispositivos GOV-07; multiplanta ENT-01, seguridad ENT-02/GOV-08 S4–S5, GOV-06a identidad, GOV-05 legal |
| 2a · Navegación | UX-22/23/25, OP-02 integrado, maqueta y selector parciales | UX-05/09, C etiquetas, U3–U5 específicos; QA 3D/reposo, dispositivos y Perla |
| 2b · Comparar | UX-07, E2 ENT-04, K13 ProposalV1 integrado | E3 selector, vigencia y revisión profesional, entregas con contrato |
| 2c · Editor y medición | UX-08, ayudas UX-04, panel existente, G-06 lineal; #288 UX-03 en CI; OP-04/03 integradas | conectar cambio UX-03 y revisar mediciones, G-06 superficie/conteo sobre plano calibrado, OP-07 estancias/curvas, #271 Perla y ayudas |
| 2d · Imágenes | D1 histórico, 6 suelos/5 paredes/4 estilos (baseline), 3D con iluminación, simulación recetas; OP-10 preparado | IMG-03 calidad/coste IA, IMG-05/06/08, IMG-07 luz IA, IMG-10/11 recetas reales, IMG-12 revisión/resultados/favoritos, CAM-01 desde 2D; K11/K12, F03 V2 y licencia única |
| 2e · Obra | OBR-02/03 fantasma y % plan/coste, planificación 4D | A fábrica ilustrativa conectada, probar origen/estado, OBR-04 límites y OBR-05 MSPDI posterior |
| 2f · Base comercial | HOM-03, BIB-01 parcial, ECO-01 infra de coste, ENT-03 lab | E3 selector real, BIB activos licenciados, ledger y cuota, registros con evidencia |
| 3 · Servicios cobrables | FOT-01/CAT-01 simulados; UX-12/13 experimentales; AST-01 acotado, mejora #288; K4 sugerencia en #288 | K5/K8/D1/D2/K16, consentimiento, costes, UX-11 acabado, PRE-01 sobre K13/E, IMG-09/13/15/16/22, ENT-05/06, VID-01 B+D, MUE-01 preservar, OBR-04, AG-0, ECO-03 antes de precios, PER-01 con licencias |
| 4 · Interoperabilidad | G-02 DXF y OP-04 integrados limitados; G-08 nativo superado; R01 laboratorio; AG-1/2/3 local acotado | G-01/F2 evaluación real, G-06 y dos CAD; residual G-08 planos externos; PRE/UX-10/21/26 (26 #288), CAT-02, IMG-14, PAN-01 (tras D10), PER-02/03, OBR-05, ampliar asistentes desde ProposalV1 una vez seguros |
| 5 · Investigación y escala | núcleos y contratos parciales; OP-05/07/10, R02/03 y Simulator aportan infraestructura | AG-3 remoto/4/5, CAT-03, FOT-02/MUE-02/GEN-01/UX-14, PAN-02/VID-02, LUZ-01, G-04/G-07 decisión, ENT-07/GOV-06b; no prometer resultados ni usar gasto sin autorización |

## 12. Los ocho programas y la ruta crítica A–D del plan v1.12

La agrupación principal es la de la [matriz v1.12](https://github.com/Juanmaes83/floorplan-3d/blob/a02af9454cedc02c5dd26e92260a339cf10c794a/docs/product/MATRIZ-TRAZABILIDAD-v1.12.md), no un nuevo programa. El anexo §14 conserva adscripción P/Hito por ID. 98 = P1 10 + P2 26 + P3 6 + P4 23 + P5 10 + P6 8 + P7 8 + P8 7. Recuento histórico; se conserva hasta reedición formal de matriz.

| Programa | Situación real y próximos cortes |
|---|---|
| P1 Studio Presentation E2–E7 | E2 conectado; K13 ya integrado; E3 lab recuperable y D4, E4 láminas/imagen/revisión, E5 PDF, E6 lote, E7 portal/firma; dependencia F0, D/B/E, OP-10 C6, K11–K12 |
| P2 Servicios IA | D1 histórico limitado; FOT/CAT/V3 simulación/inactivo; identidad, K8 ledger render, K11 persistencia y costes, legal, Prueba C real específica. No activar antes de gate |
| P3 Identidad, seguridad y cuotas | GOV-06a parte beta tester; RubikPrincipalV1 sesiones/CSRF/roles, F1 privado, GOV-08 S4 cuotas/S5 Blob privado, GOV-05 revisión jurídica y adversarios; GOV-06b multiusuario posterior |
| P4 Beta comercial | master/Production nuevos pero Alpha/Demo históricos, F0.2b aislada; K9/UX/AST-01 #288, C y #271, QA hardware, piloto, precios y promoción propia |
| P5 Fidelidad y bibliotecas | VQ-01/F02/F03 V1 integrados, F03 V2 parcial, OP-05, OP-10, OP-11, R02/R03; activos/medidas/licencias, luz y acabados, CAT-03; no GPU ni nuevo proveedor |
| P6 Interoperabilidad y precisión | OP-03/04 integradas limitadas, OP-07 cierre, R01 evaluación F2, G-06/04, K14 MSPDI, K15 CAD; no garantía de obra |
| P7 Generación y asistentes | MCP 1–2 y K13 integrados; PRE-01/E aislado; OP-06/09/12, GEN-01/AG-5 y permisos/escritura confirmada; no duplicar propuesta ni herramientas |
| P8 Experiencias premium | B/D vídeo/cine, 360, personas, foto a 3D, vida, portal/equipo; primero valor de C y derechos; reglas específicas de consentimientos y coste |

| Hito original | Estado y condición para considerarlo cerrado |
|---|---|
| A Producto consolidado (22 IDs base histórica) | Mucho código integrado (#259, OP-02/03/04, F0.1/2a/2b, R1, K13); #288 próximo. Falta completar registro, F0 conectado seguro, QA real y promoción pública autorizada con recorrido sintético, conservar limitaciones. No declarar A cerrado por READY. |
| B Primera versión comercial (24 IDs) | F0/F1 privada, legal, identidad/roles, seguridad enlaces/cuota, K5/K6/K8, aceptación Studio/UX, hardware real, piloto ECO-03 de 5 profesionales y precios. No ofrecer datos reales/IA comercial sin requisitos. |
| C Plataforma avanzada (37 IDs) | E3–E5, resultados persistidos/cámara, Prueba C y servicios autorizados, DXF CAD, MSPDI, biblioteca, OP-07, calidad/trayectorias/preview; cada capacidad con aceptación y prueba. |
| D Ecosistema premium (15 IDs) | Valor real de C, portal/equipos/roles, firma, personas/narrativas, 360/video, foto métrica/mueble, generador y navegación avanzada; decisiones legal/coste/hardware específicas. |

**Contratos transversales a mantener en la misma arquitectura:** C1 RubikPrincipalV1 identidad, C2 libro de gasto común y reserva/liquidación (`api/render.js`, `render-cost-core`), C3 registro herramientas único Asistente/MCP, C4 ProposalV1 integrado (consumidores más avanzados pendientes), C5 resultado visual persistido con cámara/imagen/coste/revisión, C6 expediente/continuidad F0/F1. Estos C1–C6 no son los cortes C1–C7 de Blender ni Simulator C. Expediente v2 `subjects[]/variantOf` es evolución a contrastar en contrato, no activada. No autoridad de Studio o IA paralela. 

## 13. K1–K16 y decisiones explícitas del propietario

| Corte | Estado efectivo al 20/11 | Siguiente gate y resultado observable |
|---|---|---|
| K1 Validación #259 | Acreditado 8/8 superficies candidata `26c0dbd` | Histórico, no repetir |
| K2 Integración #259 | Integrado `163df68`, 7/7 posfusión histórico | No repetir |
| K3 Promoción | Pendiente promoción específica de Alpha/Demo/versión pública (Production automática ya READY de master) | huella SHA, smoke 11/11, decisión D7 |
| K4 UX-24/UX-26 | #280 incorporada en #288, no fusionada aún | CI #288, un clasificador, intercambio con undo |
| K5 Identidad/cuota | Infraestructura beta #258, parcial | RubikPrincipalV1 y sesión, CSRF, profesionales aislados, prueba adversaria |
| K6 GOV-08 S4/S5 | Pendiente | cuota por profesional, Blob privado, enlace opaco, revocar y expirar |
| K7 Piloto ECO-03 | Pendiente | 5 profesionales con recorrido de referencia, tiempos/bloqueos/valoración, K3/K6/legal |
| K8 Ledger producción | Infraestructura, falta `api/render.js` en libro común | reserva/liquidación y máximo global efectivo, Redis real en CI autorizada |
| K9 Capacidades | #281 incluido en #288; estado no merge | Home/Asistente/matriz registro único SHA/estado/evidencia, sin anuncios falsos |
| K10 Studio E3 | Lab `8c532634`, F0.2b disponible para preparación | D4 verificada y gates, selector/recetas en Preparar entrega |
| K11 Resultado visual persistido | Parcial/pendiente | imagen, vista, revisión, coste y cuota recuperables sin datos perdidos |
| K12 CAM-01 + IMG-07 | Infra; Blender cámara/luz observadas NO cumple | cámara desde plano, pose guardada, día/noche, K11 y prueba real autorizada |
| K13 ProposalV1 | **Integrado** #287 absorbe #283, `1daa7460` | consumidores futuras propuestas/MCP/E3 reutilizan; no reabrir contrato |
| K14 OBR-05 MSPDI | Infra planificación, adaptador pendiente | XML MSPDI, apertura MS Project/GanttProject, fechas y dependencias ida/vuelta |
| K15 G-02 DXF | **Integrado limitado** #265, OP-07 extensión aún lab | dos CAD/arquitecto y fallo edificio; no declarar VP completo |
| K16 IA real | Desactivado, NO-GO | K5/K8, legal D1, gasto D2, Prueba C y ejecución real conciliada y autorizada, Preview aislada |

Decisiones del Plan Maestro, no confundir las D con Simulator D/CAM-01 ni con D-OP07: D1 revisión jurídica, D2 tope IA, D3-a…e decisiones proveedor/identidad/demo/Beta01/cuotas (arquitectura F0 por etapas), D4 E3 (preparación propuesta, autorización productiva pendiente), D5 precios tras piloto, D6 #259 consumida, D7 promoción pública, D8 residual G-08 externos, D9 aplazar/descartar G-07 IMDF, D10 PAN-02 antes de PAN-01, D11 CON-03 integrado sin ID nuevo, D12 cinco profesionales. Separar aceptación de laboratorio y D4 de autorización exacta de una fusión. D-OP07-4 opción B/tolerancia adoptadas para preparar, producción requiere GO posterior. El propietario ha autorizado la secuencia SMART exacta y aceptación Blender consta en #275, pero E/D/C/A y OP-07 no tienen aprobación de merge por este handoff.

## 14. Matriz de seguimiento de las 98 mejoras canónicas — anexo exhaustivo

**Fuente de ID, denominación, programa, hito y estado histórico:** matriz v1.12 leída directamente en master `a02af945`. Se conserva su código histórico aunque haya avances posteriores. La columna de acción es una actualización operativa de este handoff, no una modificación formal de la matriz auditada ni una prueba nueva de cada ID. Los estados históricos son: RV resuelto validado (20), RL integrado limitado (11), SU superado (2), EX experimental (5), SI simulado (6), PA parcial (22), IR infraestructura (10), ND no desarrollado (18), DX decisión externa (3), RD redundante/candidato a descarte (1). Total 98. PI/PV/DE son categorías posibles de la matriz, no contadas en ese corte. No publicar nuevo recuento por estado canónico hasta reconciliar #275. 

**Lectura:** las capacidades sin delta comprobado mantienen el nivel histórico; en los estados parciales/ND, la última columna expresa qué implementar y cómo salir. Los cuatro elementos SMART siguen pendientes de merge, aun si sus pruebas fuentes están verdes. Las referencias a piedras indican capacidad relacionada, no cierre total del ID. Priorización por hito, programa y dependencias §§9–13.

| ID | Mejora canónica | v1.12 | Programa / hito | Situación operativa, siguiente acción y gate |
|---|---|---|---|---|
| GOV-01a | Fusionar Render IA D1 | RV | P2/A | Integración histórica; preservar alcance, comprobar estado real antes de usar. |
| GOV-01b | Configurar entorno de Render IA | RV | P2/A | Histórica; no reconfigurar proveedor/cuota sin permiso. |
| GOV-01c | Promote de Render IA | RV | P2/A | Histórico; alias de hoy distintos, no promover de nuevo por esta evidencia. |
| GOV-09a | Acreditar el modelo antes del Promote | SU | P2/A | Superado por GOV-09b; no duplicar requisito. |
| GOV-09b | Confirmar modelo en registro de Production | RV | P2/A | Acreditación histórica; nuevas versiones registrar modelo/SHA exactos. |
| GOV-02 | Cerrar o archivar PR obsoletas | RV | P4/A | Higiene continua: #268/#283 absorbidas, #280/281/285/286 futuras; preservar ramas. |
| GOV-03 | Registro único de capacidades | PA | P4/B | **K9 #288 candidata**; conectar Home/Asistente/matriz, estado/huella/prueba, no activar anuncios falsos. |
| GOV-04 | Documentación de rama de preparación a master | RV | P4/A | #275 cuerpo actualizado, archivos antiguos; reconciliar tras SMART. |
| GOV-05 | Revisión jurídica y privacidad | DX | P3/B | Borrador no dictamen; fotos/catálogo/IA/consentimientos y licencia, profesional. |
| GOV-06a | Autenticación y cuotas por profesional | PA | P3/B | Tester beta parcial; K5 identidad real, CSRF, aislamiento, cuota/negativos. |
| GOV-06b | Plataforma multiusuario avanzada | ND | P3/D | Equipos, roles y F1/portal E7 tras K5/K6 y legal. |
| GOV-07 | Hardware real y resiliencia WebGL | PA | P4/B | Software y OP-02 integrados; dispositivos iOS/Android/GPU real, recovery y profiling. |
| GOV-08 | Publicación segura de enlaces de cliente | RL | P3/B | S1–S3, caducidad/revocación; K6 S4/S5, cuota/Blob privado y enlaces opacos. |
| HOM-01 | Home por profesión | RV | P4/A | Existente, regresiones de #288 y gate de anuncios. |
| HOM-02 | Perfil Constructora | RV | P4/A | Existente; A fábrica amplía Evolución, no repetir Home. |
| HOM-03 | «Nuevos servicios IA» en la Home | RV | P4/A | Integrada; K9 estado de simulación/inactividad honesto. |
| HOM-04 | Demostraciones guiadas en la Home | RL | P4/A | Datos sintéticos, replay Dibujo Vivo pendiente acreditar en URL pública; Perla/hardware. |
| ENT-01 | Visita 3D del cliente | RL | P1/B | Existente una planta; multiplanta, privacidad y dispositivos. Studio/QA E+D+B ayudan. |
| ENT-02 | Seguridad del enlace de cliente | RL | P3/B | GOV-08 S1–S3 existentes, E6 + K6; no URL privada falsa. |
| ENT-03 | Story y plantillas hacia el cliente | EX | P1/B | E3 lab 21 recetas, preparar selector D4; no emitir C/F. |
| ENT-04 | Dossier antes/después con presupuesto rotulado | RL | P1/B | E2 integrado #259, K13 integrado; vigencia Economía, aceptación profesional, Studio E3–E7. |
| ENT-05 | Fichas de imagen trazables | PA | P1/C | Studio E4 y K11 imagen/revisión/cámara/huella, licencias y escala. |
| ENT-06 | Lotes de entrega con coste y cancelación | ND | P1/C | E6, ledger/cuota, cancelación/errores, export ZIP, identidad. |
| ENT-07 | Portal profesional y white-label | ND | P3/D | E7 roles, privacidad, firma y decisión jurídica/comercial. |
| IMG-01 | Textos completos en exportación | RV | P2/A | Histórico; ES/EN/ZH y nuevos manifiestos preservar. |
| IMG-02 | Consumo, coste y registro por imagen | RV | P2/A | Histórico, no significa ledger universal; K8 ampliar. |
| IMG-03 | Calidad explícita y coste previsto | ND | P2/C | Presupuesto/calidades IA, antes de llamada, no confundir perfiles CPU Blender. |
| IMG-04 | Confirmación de gasto y lotes | PA | P2/B | Beta/ledger parcial, K8 tope global, E6 cancelación y aprobación explícita. |
| IMG-05 | Catálogo amplio de suelos | PA | P5/C | VQ/F03 base, biblioteca única/activos licencia, PBR/UV y aceptación. |
| IMG-06 | Paredes y techos | PA | P5/C | VQ/F03/R02-A experimental; OP-07 caras/medición y biblioteca. |
| IMG-07 | Iluminación del render IA | IR | P2/C | K12; C7 Blender solo luz observada local, no cierra IA. |
| IMG-08 | Estilos | PA | P2/C | RG-02, PromptRecipeV1 y biblioteca, ampliar sin proveedor doble. |
| IMG-09 | Decoración visual | ND | P2/C | Sobre recetas/licencias, mantener geometría y consentimiento; no otra simulación. |
| IMG-10 | Intensidad de cambio | SI | P2/C | Simulación rotulada; receta real controlada solo con K16. |
| IMG-11 | Presets por estancia | SI | P2/C | Simulados cocina/baño, K4 tipo estancia y receta única, activar solo con permiso. |
| IMG-12 | Variantes, comparador y favoritos | PA | P2/C | Comparar/E2/K13 integrados, K11 persistencia imágenes/revisión/favoritos. |
| IMG-13 | Biblioteca visual del estudio | PA | P5/C | OP-05/F0/F1 identidad y licencias, no segundo catálogo. |
| IMG-14 | Edición por zona | SI | P2/C | Preservar rotulado; proveedor/mascara/alcance, privacidad y gate K16. |
| IMG-15 | Referencia estética propia | SI | P2/C | Foto/licencia/consentimiento, almacenamiento privado y K16. |
| IMG-16 | Coherencia entre vistas | ND | P2/C | K11/K12 cámara/revisión y recetas; pruebas de consistencia, no prometer exactitud IA. |
| IMG-22 | Panel de consumo IA | IR | P2/C | K8 libro común + UI por profesional con cuota y conciliación. |
| CAM-01 | Cámara posicionable desde plano 2D | IR | P2/C | K12 pose guardada; B/C7/D capturan observada, no la función de 2D persistida. |
| PER-01 | Personas genéricas | ND | P8/D | OP-11 activos autorizados y privacidad, distinguir recurso local de IA. |
| PER-02 | Personas reales con consentimiento | DX | P8/D | Consentimiento y derechos/legal, no usar sin autorización. |
| PER-03 | Narrativas «Así se vive» | ND | P8/D | Studio/B narrativa y PER; respetar datos reales. |
| FOT-01 | Reforma sobre foto del cliente | SI | P2/B | Beta simulada/desactivada, RG-01, legal/gasto/K5/K8/K16 y aceptación. |
| FOT-02 | Foto a espacio métrico editable | ND | P6/D | F2/R01/OP-04 base parcial; referencia métrica/negativos/no inferir escala IA. |
| MUE-01 | «Trae tu mueble» simple | RV | P5/A | P0 #270 protege fotos referenciadas; preservación, export ordinaria sin foto. |
| MUE-02 | Foto a mueble 3D reconstruido | ND | P8/D | OP-05 GLB no reconstruye desde foto; investigación y licencia/coste. |
| CAT-01 | Catálogo del profesional como referencia de render | SI | P2/B | Privado/simulado, K16 real requiere derechos, identidad y ledger. |
| CAT-02 | Catálogos con fichas, SKU y medidas | EX | P5/B | Piloto; Asset Lab/F3, licencias y SKU real, pruebas profesionales. |
| CAT-03 | Productos 3D colocables y presupuestados | PA | P5/C | CAT-04 C1–C4 parcial; OP-05, R03 experimental; SKU/partida/precio autorizado. |
| BIB-01 | Biblioteca propia con licencias | PA | P5/B | OP-05 lab, OP-11, contrato privado, procedencia y export/backup. |
| VID-01 | Animación determinista | PA | P1/C | D cerrada Chromium, B parcial, E QA, A/C previews; conexión de grabación/presentación aún pendiente. |
| PAN-01 | Panorama conceptual | ND | P8/D | D10 priorizar 360 real, after K11/K16 y autorización IA. |
| PAN-02 | 360 del modelo 3D real | ND | P8/C | Captura seis caras sin IA, D/OP-02, cámara y revisión trazables. |
| VID-02 | Vídeo generativo | ND | P8/D | Aplazado, coste/consentimiento/proveedor, no confundir QA MP4. |
| UX-07 | Comparador antes/después | RV | P1/A | E2 y K13 integrados, conservar vigencia/revisión. |
| UX-22 | Minimapa en paseo | RV | P4/A | Existente, hardware real/regresiones C/D. |
| UX-23 | Accesos por estancia | RV | P4/A | Existente, QA E, C etiquetas y B futuro. |
| UX-25 | Abrir/cerrar todas las puertas | RV | P4/A | Existe, E no lee estado real por ID; conectar si procede. |
| UX-09 | Maqueta blanca | PA | P4/B | Alcance/aceptación, no duplicar render/materiales. |
| UX-05 | Selector agrupado de modos | PA | P4/B | Perla, U3–U5 y herramientas, validar navegación móvil. |
| UX-03 | Panel contextual con KPI | RL | P4/B | **#285 incluido #288**: cantidad caras/huecos/neta reales; esperar merge; OP-07 curvas. |
| UX-08 | Cotas en vivo | RV | P4/A | Existente, extender OP-07/edición múltiple sin degradar. |
| UX-04 | Ayudas y atajos | RL | P4/C | Ayudas existentes; residual contextual RoomPlan, teclado, Perla ES/EN/ZH. |
| PRE-01 | Preflight de integridad | IR | P7/C | K13 integrado; E candidata aislada temporal, no preflight total; conectar con propuestas y casos negativos. |
| UX-11 | Acabado de pared desde 3D | PA | P4/C | Edición material/selección y undo, fidelidad, OP-07 caras. |
| UX-12 | Amueblar por estancia | EX | P7/C | Prototipo; K4 tipo estancia, biblioteca y propuesta validada. |
| UX-13 | Recetas de estilo | EX | P7/C | Experimental; recetas y catálogo únicos, revisión humana. |
| UX-24 | Sugerir tipo de estancia | IR | P4/B | **K4 #288** candidata, heurística única y no inferencia silenciosa. |
| UX-10 | Píldora de inspección | IR | P4/C | C etiquetas resuelve delta HUD, no inspector completo; datos canónicos, a11y. |
| UX-26 | Intercambiar usos de estancias | IR | P4/C | **K4 #288** candidata, operación atómica y undo, verificar merge. |
| UX-21 | Panel de sol | PA | P5/C | C7 observada/Studio/F04, parámetros persistidos cuando toque, no cálculo solar. |
| LUZ-01 | Iluminación ambiental | IR | P5/D | R02-A y luminarias, F04/Blender, no lux/certificación. |
| UX-14 | Move Rooms topológico | ND | P7/D | OP-06/07/09, propuesta, geometría y undo, no solver dual. |
| OBR-01 | Pendientes FT3D-8 | RV | P1/A | Existente, regresión en Evolución con F0 y A. |
| OBR-02 | Fantasma de siguiente tarea | RV | P1/A | Integrado; A no lo sustituye, preservar planificación. |
| OBR-03 | % del plan y coste planificado | RV | P1/A | Integrado; A ilustrativo, no medición ni progreso real adicional. |
| OBR-04 | Muros de carga declarados y pasos libres | PA | P5/C | Declaración y medición real; OP-07/R02/E QA no certificación estructural. |
| OBR-05 | Exportar a MS Project o GanttProject | IR | P6/C | K14 MSPDI adaptador, fechas/dependencias y apertura externa. |
| G-06 | Medir sobre plano importado | PA | P6/C | Medidas lineales, calibración, área/conteo/F2 y OP-04 sin falso métrico. |
| G-01 | Auditoría del plano importado | EX | P6/C | R01/F2 lab, 20 planos/5 sesiones, precisión/recall y revisión humana. |
| G-08 | Alinear dos planos | SU | P6/C | Variantes nativas superan, OP-04 aporta unión estimada, residual dos externos D8. |
| G-02 | Exportación DXF profesional | ND | P6/C | **Delta integrado #265**, propuesto RL formal; K15 dos CAD/arquitecto y fallo edificio; S6 OP-07 pendiente. |
| G-07 | Exportación IMDF | RD | P6/D | D9 decisión externa aplazar/descartar, no trabajo sin valor probado. |
| G-04 | Foto, LiDAR o IFC a métrico | ND | P6/D | Importación guiada y OP-04 integrada acotada; reconocimiento métrico automático no cerrado. |
| AG-0 | Contratos, permisos, telemetría y costes | PA | P2/B | K13 contrato, ledger/identidad/registro herramientas; K5/K8/K16. |
| AG-1 | Asistente de consulta | RL | P2/B | V2 local; V3 desactivado, Prueba C real y permisos pendiente. |
| AG-2 | Propuestas revisables con diff | RL | P7/C | **K13 ProposalV1 integrado**; dos operaciones locales y MCP lectura, ampliar consumidores y negativos. |
| AG-3 | Aplicar con confirmación y deshacer | RL | P7/C | Local existente, MCP etapas 3/4 y escritura remota fuera; rol/consentimiento/undo. |
| AG-4 | Orquestar renders | PA | P2/C | Infra, K8/K16 presupuesto y confirmación, no proveedor activo por defecto. |
| AG-5 | Capacidades avanzadas | ND | P7/D | OP-12 registro único, propuesta/permiso y servicios seguros, no autoaplicar. |
| AST-01 | Onboarding con tarjetas | RL | P4/B | **#286 incluido #288** tarjeta Añadir planta abre UI existente, espera merge. |
| GEN-01 | Generación paramétrica de distribuciones | IR | P7/D | OP-09 y ProposalV1, preflight y restricciones, no solver nuevo. |
| ECO-01 | Medición de coste por imagen y lote | PA | P2/B | Libro parcial, K8 coste real/aceptado y panel, E6. |
| ECO-02 | Paquetes y precios comerciales | DX | P4/B | D5 después de piloto/consumo, no fijar precios aquí. |
| ECO-03 | Piloto con 5 profesionales | ND | P4/B | K7 tras hito A y K5/K6/legal, tiempos, valoración y condiciones. |

**No perder trabajos complementarios fuera del conteo:** H01/H02 dossier (#259); UX-BETA-001 guardar JSON; MCP 1–2 y etapas 3–4 futuras; VQ-01/F02/F03/F04–F09 visual; F0, F1–F3 ADR; P0; #260 CI; CON-03 importación de presupuesto, CAT-04 enlace producto/partida: mantener vínculo con ID existente o D11, no sumar como nuevos. Los IDs de la tabla son exactamente los 98 que existen en matriz, no todos los nombres de ramas. Las olas, hitos y programas se mantienen por referencia.

## 15. Fuentes de autoridad, decisiones no verificadas y rutina de arranque

### 15.1 Fuentes principales con versión fija

- [Master actual](https://github.com/Juanmaes83/floorplan-3d/commit/a02af9454cedc02c5dd26e92260a339cf10c794a), [PR #288](https://github.com/Juanmaes83/floorplan-3d/pull/288), [PR abiertas](https://github.com/Juanmaes83/floorplan-3d/pulls), [CI master](https://github.com/Juanmaes83/floorplan-3d/actions?query=branch%3Amaster), [registro operativo #275](https://github.com/Juanmaes83/floorplan-3d/pull/275) (descripción histórica acumulativa y rama documental separadas).
- [Plan Maestro v1.12](https://github.com/Juanmaes83/floorplan-3d/blob/a02af9454cedc02c5dd26e92260a339cf10c794a/docs/product/PLAN-MAESTRO-RUBIK-SOTA-v1.12.md), [Matriz v1.12](https://github.com/Juanmaes83/floorplan-3d/blob/a02af9454cedc02c5dd26e92260a339cf10c794a/docs/product/MATRIZ-TRAZABILIDAD-v1.12.md), [Catálogo/olas](https://github.com/Juanmaes83/floorplan-3d/blob/a02af9454cedc02c5dd26e92260a339cf10c794a/docs/product/rubik-catalogo-maestro-mejoras-2026-11-09.md).
- [Protocolo multiagente](https://github.com/Juanmaes83/floorplan-3d/blob/dd528119bdfd80733c4faf5bb56a594190fea5ac/docs/agents/PROTOCOLO-COORDINACION-MULTIAGENTE.md), [Registro de evidencias](https://github.com/Juanmaes83/floorplan-3d/blob/dd528119bdfd80733c4faf5bb56a594190fea5ac/docs/auditorias/reconciliacion-maestra-2026-11-18/REGISTRO-EVIDENCIAS.md), [SCULPT 14 original](https://github.com/Juanmaes83/floorplan-3d/blob/dd528119bdfd80733c4faf5bb56a594190fea5ac/docs/product/sculpt-openplan3d-roomgpt-2026-11-18.md). [Handoff F0/G02/SCULPT histórico](https://github.com/Juanmaes83/floorplan-3d/blob/dd528119bdfd80733c4faf5bb56a594190fea5ac/docs/integration/HANDOFF-F0-G02-SCULPT-2026-11-18.md).
- [Continuidad histórica rama docs/continuidad](https://github.com/Juanmaes83/floorplan-3d/blob/4feb0632f3e9e8f9b33ae8f02531e337ee4191ab/docs/integration/CONTINUIDAD-RUBIK-SOTA-2026-11-19.md): H1/H9, hipótesis de F0, decisiones y evidencias históricas, no pendientes actuales por sí sola. H1 ya corregido P0, H9 sigue gate de persistencia. [Consolidación inicial](https://github.com/Juanmaes83/floorplan-3d/blob/381bfa0085a8c7e34c6ce2bf963e7ed49d54e8be/docs/integration/CONSOLIDACION-261-F0-OP-2026-11-18.md).
- Los handoffs exactos de cada laboratorio figuran en §§4–8. Base documental aportada a la conversación: `RUBIK-SOTA-DOCUMENTO-MAESTRO-2026-11-19.md` (76.917 bytes) y `RUBIK-SOTA-HANDOFF-MAESTRO-2026-11-18(2).md` (48.149 bytes); conservar como antecedentes, no como cola vigente. Este archivo integra sus límites, decisiones y rutas relevantes sin reproducir la cola obsoleta.

### 15.2 Decisiones y bloqueos pendientes que requieren respuesta, no repetición de trabajo

| Requisito | Responsable | Cuándo |
|---|---|---|
| CI #288: presentation-visit geometries stable, árbol exacto y posfusión | Codex | inmediata, NO-GO hasta gate; autorización previa del candidato exacto |
| OP-10 C1–C5/C7 y E local | Codex + propietario | al fijar base tras SMART y luego Blender; autorizar exactos |
| D contrato actualizado + Firefox/WebKit | Codex/Claude 2 | con fuente f31da812/8fb99b81, no diagnóstico obsoleto |
| C y A preview, candidato y autorización | Codex + propietario | preparar en paralelo, orden de publicación explícito |
| B reanudar | propietario | no suponer permiso por terminar A/C/D/E |
| #271 Perla | propietario/Codex | aceptar Preview base efectiva y autorización independiente |
| A0 WebKit y propagación | Claude 1/Codex | reproducir causa, pruebas dirigidas, una propagación |
| OP-07 v2/tol, guardSave y compatibilidad | Claude 1/Codex/propietario | cierre lab, aceptación y exacto corte, preservar v1 y v2 |
| D4 E3 | propietario/Codex | confirmar alcance de preparación; luego gates y autorización de candidata |
| OP-05 privado/licencias | Codex | F0.2c/F0.3, derechos y respaldo privado; solo puente antes |
| Dispositivos físicos, CAD, legal, piloto, precios | propietarios/profesionales | hitos B–D, no aplazar indefinidamente |
| IA/GPU/servidor, promoción, migración real | propietario | autorización expresa separada; actualmente NO-GO |

### 15.3 Lo no acreditado por esta auditoría

La fuente exacta de #288 y sus ancestros están en remoto. OP-10 `eb0a7ee9`, E `a5d4ccde` y sus acumulados siguen registrados como locales, no se han leído sus contenidos de PC ni verificado sus hashes directamente; validar al publicar. Los números de pruebas locales son informes de Claude/Codex y sus artefactos, no nuevas ejecuciones del auditor. Master/Production y Alpha/Demo se han consultado, no se han hecho smoke funcionales públicos ni inspección exhaustiva de logs o GitHub Billing. No se ha comprobado toda política de protección de ramas ni seats/concurrencia real. No se ha reauditorizado cada uno de 351 refs de rama, ni cada funcionalidad de 98; se leyó su clasificación canónica completa y se actualizó el delta relevante, preservando los demás estados. La preparación de E3 D4 y siguientes misiones es propuesta de mandato: no se ha actuado ni confirmado autorización nueva por escribir en este archivo. La CI es dinámica y los contadores pueden cambiar. No se puede verificar trabajo local no publicado de los agentes. 

### 15.4 Arranque para cualquier sesión nueva (5 comprobaciones, no auditoría total)

1. Leer §0, §1 y el handoff individual de la tarea asignada; comprobar SHA de master, árbol y Production. Si ha cambiado, consultar `compare/<SHA-de-corte>...master`, merges recientes y #275, no rehacer el historial.
2. Revisar HEAD de PR/candidata y árbol de merge contra base real. Confirmar checks de ese SHA y gate exacto; los resultados de la fuente antes de acumular no sustituyen el gate del acumulado. Conservar autorizaciones exactas previas.
3. Trabajar solo en su rama/worktree/lab asignado, sin escritura simultánea de master. Reusar contratos y pruebas. Corregir deltas reales, no reconstruir motores ni ejecutar baterías redundantes. Si sesión se agota, publicar cambios coherentes con handoff y pruebas reales, no dejar todo local.
4. Actualizar inventario con los campos de §10; entregar un candidato exacto y las decisiones necesarias. No dar por terminada una función por cerrar solamente laboratorio, integración de núcleo o CI.
5. Codex ejecuta el siguiente merge autorizado, comprueba postmerge y Production, reconcilia PR y documento. El propietario decide activación/preview y nuevos cortes. ChatGPT audita y señala bloqueos, no cambia repo ni actúa como segundo integrador.

**Conclusión:** ya no estamos en una fase de acumular laboratorios. La prioridad es consolidar SMART, incorporar Blender y Simulator E/D/C/A, terminar OP-07, retomar B solo con autorización y llevar Studio/recursos privados/persistencia a sus consumidores efectivos. Las 98 mejoras y las 23 piedras están identificadas; ningún elemento cerrado se debe abandonar sin ruta de implementación, y ninguno incompleto debe presentarse como terminado. Construir sobre la misma plataforma, con evidencia, aceptación y protección de datos.
