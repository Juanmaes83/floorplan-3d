# FT3D-8 · Siguiente misión DESPUÉS de fidelidad: Presupuesto real, Catastro, bancos de costes y experiencia comercial
**RUBIK SOTA · 05/11/2026 · DECISIÓN Y BACKLOG POSTERIOR · NO ORDEN DE INICIO NI AUTORIZACIÓN DE MERGE**

## 0. Orden explícito del propietario

El propietario establece que **Claude Code 2 debe terminar primero A–D de fidelidad a proyecto real y E documental** (encargo actualmente en curso) y entregar SHA, CI, pruebas de Chromium/Playwright, comparativas visuales, Preview navegable y revisión humana. **Solo cuando el propietario cierre/apruebe ese corte podrá arrancar una siguiente misión** en rama aislada.

Prioridad posterior en este orden:
1. **CONECTAR Y REUTILIZAR lo ya probado, aprobado y presente en master**: proyecto/edificio real, mediciones, presupuesto C1–C4, BC3, tarifa del estudio, fuentes de precio, parcela GML, ortofoto PNOA, MDT05, placement territorial y presentación.
2. **CERRAR LO PENDIENTE** en presupuestos españoles y Catastro, especialmente proveedor BCCA gestionado bajo evidencia de derechos, fuentes y actualización, y consulta por referencia catastral donde cumpla requisitos técnicos y legales.
3. **PRESENTAR EN FRONTEND** todo el valor de manera comercial, experiencial, atractiva, entendible y veraz, en Presupuestar, Entregar, Mi estudio y una experiencia FT3D-8 sincronizada. La entrega debe representar el proyecto **concreto** del cliente, no casa ni presupuesto genéricos.

Ninguna de las fases puede inventar datos: geometría de plano, mediciones, precio, fecha, tarea, estado de revisión, parcela, terreno, ejecución o certificación. Animaciones ilustrativas deben indicarse como tales. No hay fusión en master, producción ni uso de API de pago sin autorización puntual. No editar archivos de Claude original/Kimi ni Asistente IA hasta coordinar conflictos y aprobación.

## 1. Auditoría de lo que ya existe en master (verificado por inspección del 05/11)

### Economía / Punto 7

- \`js/quantity-core.js\`, \`js/quantity-schedule-core.js\`: mediciones y disponibilidad de datos.
- \`js/budget-core.js\`: \`FloorPlanBudget\` C1–C4, importes, \`null\` desconocido, revisión y presupuestos por sujeto. No supongas que hay referencia de revisión del proyecto.
- \`js/cost-provider.js\`: contrato de proveedor de costes y provenance.
- \`js/cost-provider-manual.js\`: tarifas explícitas, offline.
- \`js/fiebdc3-codec.js\`: subconjunto documentado del estándar BC3, no universal.
- \`js/cost-provider-bcca-es.js\`: adaptador BCCA_ES **implementado**, modo con gate técnico y legal, **no auto-registrado ni conectado como catálogo oficial gestionado al frontend**.
- \`js/budget-cost-bridge.js\`: CostQuote → precio activo o referencia, sin revisión automática.
- \`js/bc3-budget-core.js\` + \`js/budget-ui.js\`: **sí hay UI funcional de carga local BC3, búsqueda de partidas, aplicación o solo referencia, exportación de presupuesto BC3 y tarifas manuales**.
- \`js/budget-presentation.js\`: exportación y avisos de completitud, precios, cantidades y revisión.
- \`js/budget-draft-core.js\`: reconstruye borrador a partir de proyecto/mediciones y conserva precios relevantes.
- \`window.FloorPlanBudgetUI.current()\`: acceso de lectura al presupuesto correspondiente al proyecto visible **dentro del navegador**; verificar alcance de edificio/plantas y guardado antes de reutilizar.
- Contract docs: \`docs/contracts/FloorPlanBccaEsCostProvider.md\`, \`docs/contracts/FloorPlanFIEBDC3.md\`, \`docs/contracts/FloorPlanBudgetV1.md\`, \`docs/product/point-7d-budget-presentation-export-2026-10-28.md\`.
- PR #118 BCCA y PR #120 Presupuesto exportado **fusionadas a master** históricamente.

**No confundir:** \`BC3\` importado por profesional y \`BCCA_ES\` como proveedor gestionado por RUBIK. El primer flujo funciona ya; el segundo necesita preparar dataset, ámbito, derechos, edición y operación sin falsear estado.

### Catastro / Punto 8

- \`js/catastro-parcel-provider.js\`: entrada actual \`mode:'document'\`, **GML INSPIRE CP aportado localmente**, parser de referencia y geometría parcelaria; no hay WFS automático.
- \`js/geo-provider.js\`: registry con proveedor de parcela Catastro, manual, PNOA e IGN MDT05.
- \`js/territory-ui.js\`: entrada visible «Contexto territorial», archivo GML, guardar parcela; solicitudes separadas ortofoto y terreno.
- \`js/territory-placement-ui.js\` y \`js/territory-integration-core.js\`: colocación explícita del edificio y CRS/norte/offset; nunca alineación automática a parcela o terrain sin elección.
- \`js/pnoa-orthophoto-provider.js\`, \`js/ign-mdt05-terrain-provider.js\`: peticiones externas explícitas de contexto, sujetos a red, cobertura y licencias.
- \`js/territory-export-policy.js\` + \`docs/product/point-8-final-audit-2026-10-28.md\`: solo contenido exportable/atribuible; raster y grid solo runtime; el vídeo actual omite contexto territorial conservadoramente.
- PR #132 fusionada. El servicio catastral **no es levantamiento topográfico, lindero legal certificado ni detalle constructivo**.

**Corrección de escritura:** el formato es **GML**, no «GLM». Indicarlo de forma amable en la UI y en la comunicación comercial.

### FT3D-8 ya desarrollado

- Rama exclusiva \`feat/ft3d-8v-schedule-core-2026-11-05\`, Visual Lab del 05/11 verificado en \`9887d902d3f2523e2d15e1a57983ce2238974ceb\`, CI [#42009486663](https://github.com/Juanmaes83/floorplan-3d/actions/runs/42009486663).
- FT3D-8 \`0.2.0\`, roles visuales, estados, FS/SS/FF/SF, reparto presupuestario por tareas, Gantt y laboratorio \`/labs/ft3d-8/\`.
- Sigue pendiente entrega del nuevo corte de **fidelidad al modelo real** encargado a Claude Code 2. Antes de integrar fuentes nuevas, releer lo entregado y auditar rama, SHA, CI y contratos. No asumir que lo pendiente hoy sigue pendiente entonces.

## 2. Derechos BCCA: actualización declarada por el propietario, no confundir con gate documental

**El propietario declara el 05/11/2026 que ha confirmado mediante otras fuentes y consulta telefónica la autorización comercial y permisos de uso de BCCA para su actividad RUBIK**, y que el registro interno \`docs/legal/bcca-es-reuse-gate-2026-10-27.md\` de 27/10 (\`UNKNOWN\`) quedó desfasado.

**Tratar el cambio con respeto y sin perder trazabilidad:**
- Registrar la declaración del propietario como hecho de gestión; no afirmar que la fuente oficial publicada por sí sola contiene licencia comercial expresa ni inventar una URL que la certifique.
- **Antes de cambiar \`legalGate.status\` a \`VERIFIED\` o publicar, alojar, distribuir o actualizar BCCA en RUBIK:** registrar ámbito autorizado, fecha/contacto/organismo, referencias documentales, modalidad (uso, adaptación, descarga, cache, distribución a terceros, embedding), obligaciones de atribución, edición y región, y aprobación responsable. Recuperar correo/acta o respuesta escrita si es posible. Una llamada no transcrita no es por sí sola la evidencia URLs exigida por el contrato técnico actual.
- Distinguir \`user-supplied\` ya soportado de \`rubik-managed\`. Si la autorización comercial sí existe pero es limitada (p.ej. solo consulta y generación de presupuestos), respetar ese alcance y no presumir redistribución del banco íntegro.
- La BCCA consultada en la documentación interna es edición enero 2024 de **Andalucía**; no presentar tarifas como actualidad de mercado ni como precios aplicables universalmente a otra región.
- Registrar la resolución como adenda posterior a la auditoría de octubre; **no borrar la historia anterior ni levantar bloqueos silenciosamente**.

Fuente: https://www.juntadeandalucia.es/organismos/viviendajuventudyordenaciondelterritorio/areas/vivienda-rehabilitacion/planes-instrumentos/paginas/bcca-ene-2024.html

## 3. Repositorios FORKEADOS por el propietario (verificado)

| Fork | Procedencia | Uso elegido |
|---|---|---|
| https://github.com/Juanmaes83/gantt | \`frappe/gantt\`, paquete MIT | Gantt principal: estudiar compatibilidad con UI JS RUBIK y formato \`construction-gantt-adapter\`; fijar commit/versión y atribución |
| https://github.com/Juanmaes83/4DBIM | \`iman48HK/4DBIM\`, MIT | Patrones de mapeo objeto↔tarea y visualización 4D; **no trasplantar Next.js/React/IFC/Three.js propio** |
| https://github.com/Juanmaes83/jsgantt-improved | \`jsGanttImproved/jsgantt-improved\` | Alternativa, no importar sin revisar diferencia de licencia: GitHub \`NOASSERTION\`, package indica \`ISC\` y LICENSE contiene condiciones de autoría BSD-like |

Los forks **no son integración**, ni garantizan compatibilidad entre versiones. Seleccionar un solo Gantt para producción y documentar por qué; preservar avisos de licencias.

## 4. MISIÓN POSTERIOR — Fase 1: Reutilizar y conectar lo aprobado (primera prioridad)

Gate de inicio: corte anterior de fidelidad de Claude 2 terminado, artefactos y Preview comprobados, propietario autoriza misión posterior. Nada de autoarranque.

1. **Snapshot correcto:** resolver proyecto activo, edificio/plantas, presupuesto seleccionado, fecha/revisión y plan aprobado con IDs congruentes. Las revisiones imposibles de comprobar deben rotularse \`no verificable\`.
2. **Economía:** reutilizar \`FloorPlanBudgetUI.current()\` / \`FloorPlanBudget.calculateBudget()\` con lectura no mutante; contrastar sujeto, planta/edificio, cobertura, partidas ligadas, precios actuales/referencias BC3, \`null\`, descuentos/impuestos y estados. No reprocesar ni sumar un coste por fuera del motor C1–C4.
3. **Catastro:** reutilizar \`site.parcel\` GML, CRS, \`buildingPlacement\`, norte, offsets y los metadatos de PNOA/MDT05 existentes; sin red automática ni reconocimiento de huella inventada. No utilizar imagen de parcela como prueba de cimentación, excavación o cota real.
4. **FT3D-8:** mapa estable de \`elementId→taskId+role\` y \`budgetItemId→taskId+share\` que conserve fuentes, geometría del modelo, materiales y revisión. El estado final debe ser visualmente congruente con el modelo auténtico.
5. **Validación:** dos proyectos distintos (sin datos privados), reforma y edificio si soportado, plan parcial, presupuesto parcial, cambio de revisión y presupuestos por planta. Playwright/Chromium y comparación de screenshots con escena real. Sin efectos comerciales no respaldados.

Entrega: primer laboratorio capaz de usar de modo explícito **las mismas autoridades reales que el editor**, Gantt y fichas de costes trazables, sin editar \`index.html\`, Entregas ni visor compartido hasta obtener coordinación y permiso.

## 5. MISIÓN POSTERIOR — Fase 2: Cerrar brechas reales de BCCA y Catastro

**No empezar automáticamente ni asumir que estos servicios están disponibles sin smoke real.** Subcortes por separado con evidencia propia:

**2A — BCCA gestionada / precios españoles**
- Completar adenda de derechos concretos, disponibilidad y política de actualización.
- Auditoría del adapter BCCA_ES contra el importador BC3 genérico actual; **no mantener dos motores comerciales duplicados**.
- Ensayo con BC3 oficial de edición identificada aportado legalmente, sin meter base real en repositorio ni artefactos públicos.
- Mapeo de unidades, variantes/región, fechas, precios de referencia, licencia/atribución, revisión humana, coexistencia con tarifa propia y presupuestos anteriores. No convertir €/kg a €/m² sin desglose justificado.
- Si se habilita modo \`rubik-managed\`, respetar gate comercial documentado, límites de tamaño, memoria/cache, procedencia y seguridad. No activar carga masiva o endpoints externos sin aprobación y prueba.
- QA contractual, CLI, importación, comparación de totales e interfaz. Importes estimativos no equivalen a ofertas o precios cerrados.

**2B — Catastro por referencia / servicios oficiales**
- Investigar servicio WFS/INSPIRE oficial actual, HTTPS, CORS, límites, formato/CRS, licencia, cobertura (la DGC excluye País Vasco y Navarra), errores y cancelación.
- Implementar \`mode:'reference'\` **solo tras pruebas de red reales y autorización de arquitectura**; si el navegador no puede acceder con seguridad, documentar alternativa autorizada. No inventar un proxy ni saltarse barreras.
- Conservar \`mode:'document'\` GML que ya funciona siempre como vía offline.
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

**Estados obligatorios del frontend, visibles siempre:** \`verificado\`, \`estimado\`, \`pendiente\`, \`no disponible\`, \`desactualizado\`; diferenciación entre presupuesto previsto, coste real ejecutado (no desarrollado) y certificación (no desarrollada). No presentar 100% de cumplimiento cuando faltan partidas o geometría.

**Marca:** adaptar controles/tarjetas/tipografía/espacios a Sistema Perla de RUBIK sin alterar materiales auténticos de viviendas. Distinguir marca de RUBIK de marca comercial del estudio. No romper móvil, accesibilidad ni ES/EN/ZH donde aplique.

**Asistente IA:** AG-1 de solo lectura tiene rama propia, pero **conversación, permisos de escritura y orquestación todavía no están integrados**, y el usuario pidió congelar su desarrollo hasta nueva decisión. En la UX incluir **previsión/espacio futuro**, nunca anunciarlo como activo ni abrir llamadas al proveedor sin aprobación.

**Entrega y vídeo:** no enviar snapshot privado, parcela sin licencia de exportación, ortofoto o grid runtime por defecto. Respetar \`territory-export-policy\` y resolver atribución antes de prometer territorio en vídeos. Presentaciones deben corresponder a la revisión exacta de proyecto+presupuesto+cronograma.

## 7. QA, autorización y coordinación

- Primero CI y pruebas puras; después Playwright/Chromium con 1440×900 y 390×844, evidencia en artefactos GitHub, comparativas de proyectos distintos, interacción real.
- Navegar Preview de Vercel con el commit exacto y constatar \`READY\`; especificar si solo está probado local o remotamente. Mostrar diferencias de datos a nivel 2D/3D/Gantt/€ y reportes de revisión, sin exponer archivos privados.
- Reutilizar forks fijados por commit, sin descargar dependencias innecesarias o incompatibles.
- Separar cambios por gates y con informe de riesgos/rollback; **no merges, no \`master\`, no Production, no gasto API sin consentimiento explícito**.
- Claude original continúa Entregas; Kimi fidelidad visual; ChatGPT supervisa, valida y acompaña al propietario. Toda modificación de código compartido depende de haber recibido resultados y aprobación de integración.
- El propietario **debe poder realizar revisión visual humana y aprobar cada transición**; tests verdes no reemplazan esta aceptación.

## 8. Registro de decisiones (no implementación)

- **PRIORIDAD CONFIRMADA:** primero integración de sistemas existentes, luego cierre de las piezas que faltan, después experiencia comercial y Entregas.
- **BCCA:** el propietario informa que permisos comerciales fueron aclarados por consulta y otras fuentes; deuda documental del 27/10 a actualizar antes de activar la vía gestionada; no bloquear el trabajo de integración de BC3 aportado por usuario.
- **Catastro:** GML offline ya está integrado; WFS por referencia pendiente, nunca simularlo como listo.
- **Forks:** verificados, pero no se han instalado como dependencias de FT3D-8.
- **Asistente IA:** congelado por encargo anterior hasta reanudación expresa, aunque su futura integración se contempla en diseño.
- **Estado actual de esta nota:** solo planificación y coordinación en rama de documentación; no autoriza por sí misma a Claude a empezar nuevo código ni a tocar la misión actual.
