# FT3D-8 · Siguiente misión DESPUÉS de vídeo y fidelidad: Presupuesto real, Catastro, bancos de costes y experiencia comercial
**RUBIK SOTA · 05/11/2026 · ACTUALIZADO tras `f78b5e3` · Decisión y backlog de siguiente misión · NO MERGE ni autorización automática de integración**

## 0. Orden explícito del propietario

**El corte de fidelidad geométrica está terminado y visualmente aprobado por el propietario. El corte posterior de vídeo, marca y presentación se entregó en `f78b5e3a94ffe0d3fd2cc44c0e08c7fd28b64cbb`, con CI verde y Preview READY; las capturas y el vídeo fueron revisados por el propietario con valoración favorable.** Se autoriza preparar la siguiente misión documental y su prompt. Cualquier nueva implementación o integración debe respetar sus propias autorizaciones y operar en rama aislada: no se deduce autorización para merge ni Production. Una publicación real a clientes aún no está probada ni autorizada como parte de este corte.

Prioridad posterior en este orden:
1. **CONECTAR Y REUTILIZAR lo ya probado, aprobado y presente en master**: proyecto/edificio real, mediciones, presupuesto C1–C4, BC3, tarifa del estudio, fuentes de precio, parcela GML, ortofoto PNOA, MDT05, placement territorial y presentación.
2. **CERRAR LO PENDIENTE** en presupuestos españoles y Catastro, especialmente proveedor BCCA gestionado bajo evidencia de derechos, fuentes y actualización, y consulta por referencia catastral donde cumpla requisitos técnicos y legales.
3. **PRESENTAR EN FRONTEND** todo el valor de manera comercial, experiencial, atractiva, entendible y veraz, en Presupuestar, Entregar, Mi estudio y una experiencia FT3D-8 sincronizada. La entrega debe representar el proyecto **concreto** del cliente, no casa ni presupuesto genéricos.

Ninguna de las fases puede inventar datos: geometría de plano, mediciones, precio, fecha, tarea, estado de revisión, parcela, terreno, ejecución o certificación. Animaciones ilustrativas deben indicarse como tales. No hay fusión en master, producción ni uso de API de pago sin autorización puntual. No editar archivos de Claude original/Kimi ni Asistente IA hasta coordinar conflictos y aprobación.

## 1. Auditoría de lo que ya existe en master (verificado por inspección del 05/11)

### Economía / Punto 7

- `js/quantity-core.js`, `js/quantity-schedule-core.js`: mediciones y disponibilidad de datos.
- `js/budget-core.js`: `FloorPlanBudget` C1–C4, importes, `null` desconocido, revisión y presupuestos por sujeto. No supongas que hay referencia de revisión del proyecto.
- `js/cost-provider.js`: contrato de proveedor de costes y provenance.
- `js/cost-provider-manual.js`: tarifas explícitas, offline.
- `js/fiebdc3-codec.js`: subconjunto documentado del estándar BC3, no universal.
- `js/cost-provider-bcca-es.js`: adaptador BCCA_ES **implementado**, modo con gate técnico y legal, **no auto-registrado ni conectado como catálogo oficial gestionado al frontend**.
- `js/budget-cost-bridge.js`: CostQuote → precio activo o referencia, sin revisión automática.
- `js/bc3-budget-core.js` + `js/budget-ui.js`: **sí hay UI funcional de carga local BC3, búsqueda de partidas, aplicación o solo referencia, exportación de presupuesto BC3 y tarifas manuales**.
- `js/budget-presentation.js`: exportación y avisos de completitud, precios, cantidades y revisión.
- `js/budget-draft-core.js`: reconstruye borrador a partir de proyecto/mediciones y conserva precios relevantes.
- `window.FloorPlanBudgetUI.current()`: acceso de lectura al presupuesto correspondiente al proyecto visible **dentro del navegador**; verificar alcance de edificio/plantas y guardado antes de reutilizar.
- Contract docs: `docs/contracts/FloorPlanBccaEsCostProvider.md`, `docs/contracts/FloorPlanFIEBDC3.md`, `docs/contracts/FloorPlanBudgetV1.md`, `docs/product/point-7d-budget-presentation-export-2026-10-28.md`.
- PR #118 BCCA y PR #120 Presupuesto exportado **fusionadas a master** históricamente.

**No confundir:** `BC3` importado por profesional y `BCCA_ES` como proveedor gestionado por RUBIK. El primer flujo funciona ya; el segundo necesita preparar dataset, ámbito, derechos, edición y operación sin falsear estado.

### Catastro / Punto 8

- `js/catastro-parcel-provider.js`: entrada actual `mode:'document'`, **GML INSPIRE CP aportado localmente**, parser de referencia y geometría parcelaria; no hay WFS automático.
- `js/geo-provider.js`: registry con proveedor de parcela Catastro, manual, PNOA e IGN MDT05.
- `js/territory-ui.js`: entrada visible «Contexto territorial», archivo GML, guardar parcela; solicitudes separadas ortofoto y terreno.
- `js/territory-placement-ui.js` y `js/territory-integration-core.js`: colocación explícita del edificio y CRS/norte/offset; nunca alineación automática a parcela o terrain sin elección.
- `js/pnoa-orthophoto-provider.js`, `js/ign-mdt05-terrain-provider.js`: peticiones externas explícitas de contexto, sujetos a red, cobertura y licencias.
- `js/territory-export-policy.js` + `docs/product/point-8-final-audit-2026-10-28.md`: solo contenido exportable/atribuible; raster y grid solo runtime; el vídeo actual omite contexto territorial conservadoramente.
- PR #132 fusionada. El servicio catastral **no es levantamiento topográfico, lindero legal certificado ni detalle constructivo**.

**Corrección de escritura:** el formato es **GML**, no «GLM». Indicarlo de forma amable en la UI y en la comunicación comercial.

### FT3D-8: fidelidad, vídeo y entrega YA DESARROLLADOS (auditoría 05/11)

- **Rama técnica aislada:** `feat/ft3d-8v-schedule-core-2026-11-05`. HEAD verificado `f78b5e3a94ffe0d3fd2cc44c0e08c7fd28b64cbb`; base inicial del corte previo de fidelidad `64bb2439bb899f5395f3d3c3a0feb4db6e72d8f0`.
- **CI verificada:** [GitHub Actions #42046877070](https://github.com/Juanmaes83/floorplan-3d/actions/runs/42046877070): jobs `validate` y `visual-lab-browser` `success`; 176/176 pruebas puras y 14/14 pruebas de navegador distribuidas en demo (2), fidelidad (6) y entrega (6).
- **Artefactos presentes:** `ft3d-8-delivery-evidence` (MP4 A y B, fotogramas, metadatos y capturas), `ft3d-8-fidelity-evidence` y `ft3d-8-visual-lab-screenshots`.
- **Preview exacta:** https://floorplan-3d-n8erxh3mu-juanma-espinosas-projects.vercel.app/labs/ft3d-8/ — Vercel confirma `READY`, rama y SHA correctos; las pruebas de navegador son local/CI, no una certificación de navegación remota por Claude.
- **Funciones efectivas en el laboratorio:** modelos A (vivienda una planta), B (edificio dos plantas), C (reforma), D (sin plan); importación explícita de proyecto, plan, presupuesto y vínculo; identificación de revisiones y errores; cursor visual+Gantt; tres coberturas independientes; vídeo MP4 H.264 indexado (WebCodecs+MP4 muxer puro cuando el navegador lo soporta), grabar/cancelar/previsualizar/descargar, saltar entre fases; identidad del estudio desde `FloorPlanBrand`; manifiesto congelado por huellas y HTML de solo lectura descargable con vídeo incorporable.
- **Verificación específica del vídeo:** fixture A 1280×720, 25 fps, 491 fotogramas, duración 19,64 s; navegación a seis instantes, apertura/fases/cierre y reproducción completa comprobadas en Chromium; también fixture B. Fallback `MediaRecorder` **no garantiza navegación precisa** y debe comunicarse como limitación, no equipararse a la variante indexada.
- **Publicación del enlace cliente:** existe cableado para `/api/share` y `/api/view`, consentimiento y gestión de límites; **SOLO VALIDADA CON RESPUESTAS SIMULADAS** (sin subidas reales, sin contraseña, caducidad ni borrado desde la UI). `READY` de la Preview no demuestra un enlace comercial remoto. Un HTML puede descargarse con el vídeo integrado; publicar una página puede hacerse con o sin vídeo según la selección. No dar por incluidos contenidos que el documento realmente diga «Vídeo no incluido».
- **Marca:** selector en Preview usa perfiles del mismo origen o una marca de prueba en memoria; NO recupera automáticamente «Mi estudio» guardado en el dominio principal. La integración futura debe leer la marca activa autorizada, no reescribir el sistema de marca.
- **Límites reconocidos:** identidad de mallas reutilizables del visor (coordinar con Kimi); presupuesto canónico por proyecto/planta (no edificio); revisión de presupuesto ↔ proyecto aún sin soporte canónico; aprobación autenticada no desarrollada; enlace público real no probado; no hay acceso a Catastro WFS por referencia ni BCCA gestionada integrada.
- **Documento técnico de cierre:** [ft3d-8-entrega-video-enlace-2026-11-05.md](https://github.com/Juanmaes83/floorplan-3d/blob/f78b5e3a94ffe0d3fd2cc44c0e08c7fd28b64cbb/docs/product/ft3d-8-entrega-video-enlace-2026-11-05.md).
- **Git master:** sigue `0f9c6ead9732901681498efec326d1ca92e42ffe`; ninguna parte del laboratorio FT3D-8 está fusionada. La publicación de vídeo/evolución en Entregar sigue siendo trabajo futuro coordinado con PR #166.

## 2. Derechos BCCA: actualización declarada por el propietario, no confundir con gate documental

**El propietario declara el 05/11/2026 que ha confirmado mediante otras fuentes y consulta telefónica la autorización comercial y permisos de uso de BCCA para su actividad RUBIK**, y que el registro interno `docs/legal/bcca-es-reuse-gate-2026-10-27.md` de 27/10 (`UNKNOWN`) quedó desfasado.

**Tratar el cambio con respeto y sin perder trazabilidad:**
- Registrar la declaración del propietario como hecho de gestión; no afirmar que la fuente oficial publicada por sí sola contiene licencia comercial expresa ni inventar una URL que la certifique.
- **Antes de cambiar `legalGate.status` a `VERIFIED` o publicar, alojar, distribuir o actualizar BCCA en RUBIK:** registrar ámbito autorizado, fecha/contacto/organismo, referencias documentales, modalidad (uso, adaptación, descarga, cache, distribución a terceros, embedding), obligaciones de atribución, edición y región, y aprobación responsable. Recuperar correo/acta o respuesta escrita si es posible. Una llamada no transcrita no es por sí sola la evidencia URLs exigida por el contrato técnico actual.
- Distinguir `user-supplied` ya soportado de `rubik-managed`. Si la autorización comercial sí existe pero es limitada (p.ej. solo consulta y generación de presupuestos), respetar ese alcance y no presumir redistribución del banco íntegro.
- La BCCA consultada en la documentación interna es edición enero 2024 de **Andalucía**; no presentar tarifas como actualidad de mercado ni como precios aplicables universalmente a otra región.
- Registrar la resolución como adenda posterior a la auditoría de octubre; **no borrar la historia anterior ni levantar bloqueos silenciosamente**.

Fuente: https://www.juntadeandalucia.es/organismos/viviendajuventudyordenaciondelterritorio/areas/vivienda-rehabilitacion/planes-instrumentos/paginas/bcca-ene-2024.html

## 3. Repositorios FORKEADOS por el propietario (verificado)

| Fork | Procedencia | Uso elegido |
|---|---|---|
| https://github.com/Juanmaes83/gantt | `frappe/gantt`, paquete MIT | Gantt principal: estudiar compatibilidad con UI JS RUBIK y formato `construction-gantt-adapter`; fijar commit/versión y atribución |
| https://github.com/Juanmaes83/4DBIM | `iman48HK/4DBIM`, MIT | Patrones de mapeo objeto↔tarea y visualización 4D; **no trasplantar Next.js/React/IFC/Three.js propio** |
| https://github.com/Juanmaes83/jsgantt-improved | `jsGanttImproved/jsgantt-improved` | Alternativa, no importar sin revisar diferencia de licencia: GitHub `NOASSERTION`, package indica `ISC` y LICENSE contiene condiciones de autoría BSD-like |

Los forks **no son integración**, ni garantizan compatibilidad entre versiones. Seleccionar un solo Gantt para producción y documentar por qué; preservar avisos de licencias.

## 4. MISIÓN POSTERIOR — Fase 1: Reutilizar y conectar lo aprobado (primera prioridad)

Gate de inicio: fidelidad y vídeo entregados en `f78b5e3`, CI/artefactos/Preview verificados y revisión visual favorable. La próxima tarea comienza por auditar los módulos reales y definir su propia rama y aceptación; **no hacer merge ni tocar archivos de otros agentes**. No repetir los adaptadores ni exportadores FT3D-8 ya desarrollados.

1. **Snapshot correcto:** resolver proyecto activo, edificio/plantas, presupuesto seleccionado, fecha/revisión y plan aprobado con IDs congruentes. Las revisiones imposibles de comprobar deben rotularse `no verificable`.
2. **Economía:** reutilizar `FloorPlanBudgetUI.current()` / `FloorPlanBudget.calculateBudget()` con lectura no mutante; contrastar sujeto, planta/edificio, cobertura, partidas ligadas, precios actuales/referencias BC3, `null`, descuentos/impuestos y estados. No reprocesar ni sumar un coste por fuera del motor C1–C4.
3. **Catastro:** reutilizar `site.parcel` GML, CRS, `buildingPlacement`, norte, offsets y los metadatos de PNOA/MDT05 existentes; sin red automática ni reconocimiento de huella inventada. No utilizar imagen de parcela como prueba de cimentación, excavación o cota real.
4. **FT3D-8:** mapa estable de `elementId→taskId+role` y `budgetItemId→taskId+share` que conserve fuentes, geometría del modelo, materiales y revisión. El estado final debe ser visualmente congruente con el modelo auténtico.
5. **Validación:** dos proyectos distintos (sin datos privados), reforma y edificio si soportado, plan parcial, presupuesto parcial, cambio de revisión y presupuestos por planta. Playwright/Chromium y comparación de screenshots con escena real. Sin efectos comerciales no respaldados.

Entrega: primer laboratorio capaz de usar de modo explícito **las mismas autoridades reales que el editor**, Gantt y fichas de costes trazables, sin editar `index.html`, Entregas ni visor compartido hasta obtener coordinación y permiso.

## 5. MISIÓN POSTERIOR — Fase 2: Cerrar brechas reales de BCCA y Catastro

**No empezar automáticamente ni asumir que estos servicios están disponibles sin smoke real.** Subcortes por separado con evidencia propia:

**2A — BCCA gestionada / precios españoles**
- Completar adenda de derechos concretos, disponibilidad y política de actualización.
- Auditoría del adapter BCCA_ES contra el importador BC3 genérico actual; **no mantener dos motores comerciales duplicados**.
- Ensayo con BC3 oficial de edición identificada aportado legalmente, sin meter base real en repositorio ni artefactos públicos.
- Mapeo de unidades, variantes/región, fechas, precios de referencia, licencia/atribución, revisión humana, coexistencia con tarifa propia y presupuestos anteriores. No convertir €/kg a €/m² sin desglose justificado.
- Si se habilita modo `rubik-managed`, respetar gate comercial documentado, límites de tamaño, memoria/cache, procedencia y seguridad. No activar carga masiva o endpoints externos sin aprobación y prueba.
- QA contractual, CLI, importación, comparación de totales e interfaz. Importes estimativos no equivalen a ofertas o precios cerrados.

**2B — Catastro por referencia / servicios oficiales**
- Investigar servicio WFS/INSPIRE oficial actual, HTTPS, CORS, límites, formato/CRS, licencia, cobertura (la DGC excluye País Vasco y Navarra), errores y cancelación.
- Implementar `mode:'reference'` **solo tras pruebas de red reales y autorización de arquitectura**; si el navegador no puede acceder con seguridad, documentar alternativa autorizada. No inventar un proxy ni saltarse barreras.
- Conservar `mode:'document'` GML que ya funciona siempre como vía offline.
- Continuar con PNOA/MDT05 y placement manual; revisar licencias de salida, atribución y exclusiones de vídeo para visualización al cliente.
- No convertir parcela geográfica en levantamiento legal, topografía certificada, cimentación, movimiento de tierras o ejecución real.

## 6. MISIÓN POSTERIOR — Fase 3: Frontend comercial coherente, seductor y veraz

**Tono producto:** fácil de entender por un particular y útil para arquitecto, reformista, constructora, comercializador, cocina/baño y estudio. Nada de promesas mágicas.

**Narrativa de un mismo caso de cliente:**
1. **«Importa tu proyecto»**: plano/documento y geometría RUBIK, escala y verificaciones.
2. **«Sitúalo en su parcela»**: archivo **GML Catastro**, ortofoto/terreno opcionales, posición explícita.
3. **«Mide y presupuesta»**: cantidades demostrables, BC3 o tarifas propias, importes y fuente.
4. **«Planifica la obra»**: tareas reales, fechas, dependencias, asignación a elementos y partidas, cobertura y validación profesional.
5. **«Vive la evolución»**: timelapse con Play/Pausa/scrub, Gantt sincronizado, fase/tarea, costes y contexto que se puede exportar.
6. **«Comparte con tu cliente»**: presentación y entrega con versión, marca de «Mi estudio», trazabilidad, limitaciones y gestión de licencia de capas.

**Estados obligatorios del frontend, visibles siempre:** `verificado`, `estimado`, `pendiente`, `no disponible`, `desactualizado`; diferenciación entre presupuesto previsto, coste real ejecutado (no desarrollado) y certificación (no desarrollada). No presentar 100% de cumplimiento cuando faltan partidas o geometría.

**Marca:** adaptar controles/tarjetas/tipografía/espacios a Sistema Perla de RUBIK sin alterar materiales auténticos de viviendas. Distinguir marca de RUBIK de marca comercial del estudio. No romper móvil, accesibilidad ni ES/EN/ZH donde aplique.

**Asistente IA:** AG-1 de solo lectura tiene rama propia, pero **conversación, permisos de escritura y orquestación todavía no están integrados**, y el usuario pidió congelar su desarrollo hasta nueva decisión. En la UX incluir **previsión/espacio futuro**, nunca anunciarlo como activo ni abrir llamadas al proveedor sin aprobación.

**Entrega y vídeo:** reutilizar `FloorPlanConstructionDelivery`, el MP4 indexado, el HTML cliente y el manifiesto YA entregados; NO crear un segundo grabador ni sistema de marca/compartición. No enviar snapshot editable, parcela sin licencia de exportación, ortofoto o grid runtime por defecto. Respetar `territory-export-policy` y resolver atribución antes de prometer territorio en vídeos. Presentaciones deben corresponder a revisiones explícitas de proyecto+presupuesto+cronograma. La publicación real de enlace debe probarse y aprobarse aparte.

## 7. QA, autorización y coordinación

- Primero CI y pruebas puras; después Playwright/Chromium con 1440×900 y 390×844, evidencia en artefactos GitHub, comparativas de proyectos distintos, interacción real.
- Navegar Preview de Vercel con el commit exacto y constatar `READY`; especificar si solo está probado local o remotamente. Mostrar diferencias de datos a nivel 2D/3D/Gantt/€ y reportes de revisión, sin exponer archivos privados.
- Reutilizar forks fijados por commit, sin descargar dependencias innecesarias o incompatibles.
- Separar cambios por gates y con informe de riesgos/rollback; **no merges, no `master`, no Production, no gasto API sin consentimiento explícito**.
- Claude original continúa Entregas; Kimi fidelidad visual; ChatGPT supervisa, valida y acompaña al propietario. Toda modificación de código compartido depende de haber recibido resultados y aprobación de integración.
- El propietario **debe poder realizar revisión visual humana y aprobar cada transición**; tests verdes no reemplazan esta aceptación.

## 8. Registro de decisiones (no implementación)

- **PRIORIDAD CONFIRMADA:** primero integración de sistemas existentes, luego cierre de las piezas que faltan, después experiencia comercial y Entregas.
- **BCCA:** el propietario informa que permisos comerciales fueron aclarados por consulta y otras fuentes; deuda documental del 27/10 a actualizar antes de activar la vía gestionada; no bloquear el trabajo de integración de BC3 aportado por usuario.
- **Catastro:** GML offline ya está integrado; WFS por referencia pendiente, nunca simularlo como listo.
- **Forks:** verificados, pero no se han instalado como dependencias de FT3D-8.
- **Asistente IA:** congelado por encargo anterior hasta reanudación expresa, aunque su futura integración se contempla en diseño.
- **Estado actual de esta nota:** solo planificación y coordinación en rama de documentación; no autoriza por sí misma a Claude a empezar nuevo código ni a tocar la misión actual.


## 9. Adenda operativa del 05/11/2026: aceptación del corte actual y cambios necesarios en la siguiente misión

### 9.1 Lo que se considera terminado y NO debe volver a implementarse

| Producto/capacidad | Estado real al cierre `f78b5e3` | Implicación |
|---|---|---|
| Geometría RUBIK distinta para A/B/C/D | Fidelidad comparada en Chromium, aprobación visual del propietario | Reutilizar inventario, vinculación y comparativas; no volver a dibujar una vivienda genérica |
| Plan FT3D-8, estados por fecha, Gantt y costes atribuidos | Núcleo/adaptadores puros probados | Conectar a presupuesto real persistido, no recalcular importes ni inferir fechas |
| Vídeo de evolución 1280×720 y marca | MP4 H.264 indexado comprobado en Chromium, con fallback de compatibilidad | Reutilizar grabador y documentar navegadores reales; no desarrollar segundo encoder |
| HTML descargable + manifiesto | Se puede producir con vídeo incorporado y huellas; aviso de límites | Integrar como tipo de Entregar cuando esté autorizado; conservar versiones |
| Publicación /api/share /api/view | Flujo probado solo con mocks; subidas reales deliberadamente NO realizadas | No marcar enlace público listo para clientes ni dar por garantizada la capacidad remota |
| Identidad de Mi estudio | Core de marca reutilizado; lab tiene selección local/de prueba | Futuro adaptador a marca activa de estudio; no nuevo CRM de identidad |

### 9.2 Brechas prioritarias revisadas: CINCO originales + TRES adicionales

1. **Vínculo verificable proyecto ↔ presupuesto ↔ plan (P0):** asociar los IDs y huellas de revisión a una fuente guardada real. No confiar en que la Preview comparta `localStorage` con Production ni en campos `reviewedBy` de JSON sin identidad acreditada.
2. **Presupuesto C1–C4 seleccionado y persistido (P0):** enlazar la partida a tareas/elementos cuando sea demostrable. Conservar las tres coberturas: partidas cargadas asignadas; alcance presupuestado; geometría representada. `null` ≠ 0; no inventar precios, duraciones o partida por cada muro cuando el presupuesto agrupa partidas por tipo.
3. **Presupuestos multiestructura/edificio (P0 diseño, P1 implementación):** el modelo de dos plantas NO tiene presupuesto canónico de edificio. Proponer una estrategia explícita por planta vs edificio, antideduplicación, IVA y revisiones antes de mostrar un total global. Cualquier cambio de `budget-core.js` requiere decisión expresa y compatibilidad 1.0/1.1.
4. **Integración territorial (P1):** recuperar `site.parcel` GML, `site.buildingPlacement`, `northOffsetDeg`, CRS y snapshots. Las capas PNOA/MDT05 se cargan por petición y tienen componentes runtime no persistidos; en una entrega reproducible se omiten si no están disponibles o no son exportables. El documento exportado nunca recrea automáticamente ortofotos/terreno a partir de Internet.
5. **Catastro por referencia oficial (P1):** analizar y conectar `mode:'reference'` si WFS HTTPS/CORS/formato/CRS/cobertura/licencia lo permiten. Conservar GML local como alternativa robusta. No equiparar geometría de parcela con topografía certificada.
6. **BCCA comercial gestionada (P1):** usar `cost-provider-bcca-es.js`, el parser BC3 y bridge existentes; no dos motores. El propietario comunicó autorización comercial adicional, pero registrar su alcance (consulta, adaptación, redistribución, almacenamiento, actualización, atribución, edición y región) antes de cambiar el gate técnico `rubik-managed=VERIFIED`. No borrar la auditoría histórica de 27/10. Precio de referencia ≠ oferta aprobada.
7. **Revisión, aprobación e inmutabilidad del entregable (P0 diseño, P1 implementación):** huellas de proyecto, plan, presupuesto y marca. La identidad de un revisor declarada en JSON no es autenticación. La entrega al cliente debe mantener contenido/versiones congelados y avisar cuando el proyecto cambie.
8. **Política de exportación/licencias y privacidad (P0):** `territory-export-policy` trata `restricted/unknown` como no exportable; no desactivar el bloqueo. Respetar atribución, permiso, tipos de datos y consentimiento al publicar. Aclarar en UI si la página se comparte CON vídeo o SIN vídeo, como aparece en distintos estados de las evidencias.

### 9.3 Orden de los próximos cuatro cortes verificables (antes de mezclar con Entregas compartidas)

**Corte S1 — Contratos + conexión real (prioridad máxima).** Auditoría de storage/selección de proyecto, presupuesto y marca. Adaptadores independientes que relacionen proyecto real (incluido edificio), presupuesto seleccionado, plan y contexto de parcela guardado; escenarios de datos parciales y revisión obsoleta. UX inicial de pasos 1–6, sin editar el visor/editor. Pruebas de dos casas + reforma + edificio con huecos monetarios y GML sintético; captura de referencia y FT3D-8. **Gate:** un cambio de proyecto nunca deja costes/tareas/parcela de otro cliente y el total no afirma cubrir obra no modelada.

**Corte S2 — BCCA y catálogo español gestionado.** Registrar la declaración de permisos y evidencia concreta; probar adaptador con una edición BC3 identificada de fuente lícita; catálogos de referencias, variaciones, unidades y precios con revisión profesional; revisar rendimiento y licencia; UI de referencia y fuente, sin actualización silenciosa. **Gate:** correspondencia exacta de unidades, moneda, origen y edición, prueba de que no se sobrescribe un presupuesto revisado sin consentimiento. Si gate documental no está listo, continuar con BC3 importado y no activar modo gestionado.

**Corte S3 — Catastro directo y contexto visual.** WFS por referencia con pruebas y fallbacks; preservar GML local, colocación manual, norte y CRS; geografía/terreno como contexto, nunca operación constructiva inventada; exportar únicamente capas permitidas con los créditos. **Gate:** exactitud de fuente de parcela, prueba de error/desconexión y separación entre lo visible internamente y lo que es legalmente exportable.

**Corte S4 — Producto comercial y entrega integrada.** Definir el recorrido de interfaz: importar proyecto → situarlo en parcela → medir/presupuestar → planificar → ver evolución → entregar con marca/vídeo/link; usar Perla, Frappe Gantt solo si supera análisis y no introduce duplicación, y las capacidades de entrega/compartición existentes. Prever una experiencia técnica para el profesional y otra clara para cliente. Coordinar con Claude original (PR #166) y Kimi antes de modificar archivos compartidos. **Gate:** Preview con un proyecto coherente, evidencias capturadas, descarga de vídeo verificada, contenido de enlace con/sin vídeo explícito y revisión humana; no Production ni merge.

**Importante:** el diseño comercial de cada corte debe empezar en S1, pero la integración en `index.html`, Presupuestar, Entregar, Mi estudio, el visor o el backend de publicación requiere autorización expresa. El Asistente IA continúa fuera de alcance y congelado.

### 9.4 Riesgos y evidencias que NO se deben dar por cerrados

- **Enlace público:** la CI prueba mocks; falta una prueba real expresamente autorizada con fixture no privado, y verificación fuera de la cuenta autenticada si se ofrece a clientes. `READY` de Vercel no confirma publicación en Blob.
- **Compatibilidad MP4:** los 14 tests navegador son Chromium; H.264 WebCodecs indexado se probó ahí. No afirmar compatibilidad universal Safari/Firefox/móviles sin matriz de dispositivos y fallback contrastado.
- **UX comercial de documentos:** las capturas todavía muestran nombres de fixture, identificadores internos, advertencias extensas y algunas etiquetas técnicas en inglés. Necesario lenguaje natural ES/EN/ZH, tarjetas claras, contraste y adaptación móvil antes de venta real.
- **Cobertura de ejemplo:** 19.717,64 € en fixture A es el total conocido de partidas cargadas y asignadas, **no el coste total de construir esa vivienda**. Revisar cómo se comunica en vídeo y documento, sin omitir partidas o categorías no disponibles.
- **Vídeo no incluido en una captura de presentación:** técnicamente permitido si el usuario elige no incluirlo, pero el panel debe mostrar y confirmar ese estado; no enviarlo como si contuviera vídeo.
- **Catastro y datasets:** GML local ya existe, WFS por referencia no. BCCA offline existe, catálogo RUBIK-managed no. Ni el terreno ni los bancos de precios reemplazan la revisión profesional.

### 9.5 Alcance y autorización

Este documento es planificación. La actualización presente se ha realizado **solo en la rama de documentación**. El propietario ha revisado favorablemente las imágenes y el funcionamiento del laboratorio entregado; **no hay merge, Production, cambios de API ni publicación real de enlaces de clientes**. Para abrir cada corte: releer la rama FT3D-8 y la CI más reciente, comprobar agentes concurrentes y definir su propia rama aislada y evidencias. **No modificar `master` ni ramas ajenas.**
