# M05 · Copiloto profesional de proyecto

**Base de producto** `e777a6ed7f856aa7a251aa9392b3670ade877f81` · **Rama** `codex/m05-copiloto-profesional`

**Alcance de la candidata.** Editor → Asistente RUBIK → Consulta guiada o Conversación con IA. En el mismo panel, **Revisar con MCP local** entrega el JSON mediante el exportador canónico. La conversación generativa permanece sujeta al acceso y a los controles del entorno. Cada ejecución y autorización se identifica por el commit de esta rama y la PR de integración.

| Capacidad | Conexión y garantía |
| --- | --- |
| AG-0 / V3 | La interfaz comprueba disponibilidad con el código de la pestaña. El proveedor solo interviene tras dos consentimientos. Una revisión o ámbito cambiado durante un turno impide entregar su resultado o enviar otro paso. Volver a Consulta guiada cancela el turno en curso. |
| AG-1 / V2 | Consultas locales sobre estancias, superficies, distribución, materiales, mobiliario, precios y presupuesto. Las respuestas conservan fuente y revisión. |
| AG-2, AG-3 / K13 | La tarjeta distingue «Antes» y «Después». Aplicar revalida la propuesta y usa el editor. Su deshacer y rehacer comprueban proyecto, planta y paso de historial. Si el almacenamiento rechaza el cambio inmediato, el editor conserva proyecto e historial. F0.2b usa además su propio estado de guardado y conflictos. |
| AG-4, AG-5 | Presupuestar, catálogos, estudio visual y Render IA conservan sus rutas, límites y confirmaciones. Abrir una ruta no inicia una generación. |
| MCP 1–2 | Se conservan las nueve herramientas de consulta y propuesta, stdio y selección explícita de un JSON canónico. |
| MCP 3 | `simulate_layout` comprueba la huella de origen y evalúa una posición en memoria. Compara los dos estados con las métricas de variación del producto. |
| MCP 4 / OP-12 | Una persona confirma en terminal un ZIP de revisión independiente. Incluye la variante canónica y un manifiesto con huellas. Se abre desde el importador de RUBIK. El contrato de biblioteca conserva localmente los grupos nativos de variantes y el manifiesto conserva la procedencia del intercambio. |

El historial generativo se limita a la memoria de la conversación vigente. La consulta guiada conserva su historial de navegador por estudio e identidad canónica del proyecto o planta. Si el editor no pudo separar identidades históricas, el ámbito usa además la entrada y planta activas. Cada historial conserva la clave histórica del proyecto y delimita sus mensajes dentro de ella. Las entradas antiguas que carecen de ámbito quedan fuera de la restauración automática. «Borrar conversación» elimina el historial activo y el legado de ese proyecto. El contexto enviado a texto sigue sujeto a las exclusiones y al aviso de privacidad. [Consentimiento existente](../product/assistant-ai-v3/03-consentimiento-y-privacidad.md)

## Procedencia

- Assistant V2 desde #229, V3 desde #238, #258 y #259. Las pruebas conservan la pasarela, el libro de gasto, CAT-04 y las acciones tipadas.
- MCP desde #196, #197, #204 y #254. K13 desde #283 y #287. Simulación y empaquetado reutilizan `propose_layout`, `ProposalV1`, `FloorPlanCore`, `FloorPlanVariants` y el ZIP existente. [Guía operativa](../../tools/rubik-mcp/README.md)
- OpenPlan3D `771c9e1` documenta el vínculo entre sesión de editor y agente, sincronización y permisos del puente. RUBIK adopta la separación entre consulta, confirmación y escritura mediante stdio y un archivo seleccionado. Su editor remoto y su almacenamiento quedan fuera de M05. Licencia MIT. Blob del puente: `00dba7833f33f9632edc41b24fd33a43b8d0f5a4`. [Puente](https://github.com/Juanmaes83/openPlan3D/blob/771c9e1/docs/agent-bridge.md) · [Licencia](https://github.com/Juanmaes83/openPlan3D/blob/771c9e1/LICENSE)
- Pascal `e873b80129b228a9073bbd1f8ed335d0c875434e` aporta ejemplos de medición, verificación previa y revisión de cambios. RUBIK conserva su modelo de estancias y sus comprobaciones, mientras Pascal opera sobre su grafo de escenas. Licencia MIT. Blob de la guía: `f16e7cd267785a1fb1739a7a727ab1dab2ba63b3`. [MCP de Pascal](https://github.com/pascalorg/editor/tree/e873b80129b228a9073bbd1f8ed335d0c875434e/packages/mcp)
- Revit MCP `77d7753db1aa1f5c02f7429fe07057c5a4a63ce9` distingue lecturas y acciones protegidas. Su modelo Revit y sus conexiones no intervienen en el proyecto canónico de RUBIK. Licencia MIT. Blob de seguridad: `1280caab2290972cf52373038da1a2391a37d311`. [Guía de seguridad](https://github.com/sharafutdinovdi/revit-model-mcp/blob/77d7753db1aa1f5c02f7429fe07057c5a4a63ce9/docs/guides/safety.md)

Los tres donantes se consultaron como referencias. La candidata incorpora únicamente código y motores de RUBIK y reutiliza las dependencias ya fijadas de MCP.

## Evidencia reproducible

```sh
npm ci --prefix tools/rubik-mcp --ignore-scripts
npm test --prefix tools/rubik-mcp
node --test tests/assistant-ai-v2.browser.test.cjs tests/assistant-gen.browser.test.cjs tests/assistant-gen-cat04.browser.test.cjs
node scripts/qa/record-m05.cjs qa-results/m05 chromium
node scripts/qa/record-m05.cjs qa-results/m05-firefox firefox
node scripts/qa/record-m05.cjs qa-results/m05-webkit webkit
```

El registrador usa Playwright y FFmpeg. Abre un proyecto de ejemplo, revisa y deshace una propuesta, usa herramientas reales con proveedor de texto simulado y mide el recorrido de ida y vuelta por MCP con un plano sintético. Revisa el vídeo, capturas, JSON exportado, diagnóstico, simulación y ZIP auténtico en [evidencias](m05-evidencia/README.md).

La regresión local incluye 178 pruebas de núcleo, 138 del servidor MCP en Linux, 19 de navegador y 6 del libro compartido con Redis local real. La prueba de enlaces simbólicos requiere privilegio de creación que este Windows no concede. El caso se ejecutó en Linux y se mantiene intacto. La compatibilidad en el editor pasó 49 pruebas adicionales en Windows, incluidas Studio E3, F0.2b, edificios, R02-A/R03 y ES/EN sin chino visible.

La prueba histórica de identidad falló al cambiar la forma del historial local. Se reprodujo el mismo fallo en Windows. La corrección conserva el índice por proyecto y delimita cada mensaje por ámbito. La prueba histórica permanece intacta. Se conserva también la consulta guiada al recargar la vivienda de ejemplo antes de guardar. La prueba comprueba que consultar no escribe en la biblioteca de proyectos. Identidad, V2, V3, CAT-04 y las pruebas de agente pasaron 31/31 en la revalidación dirigida. [Job de la reproducción inicial](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44921262665/job/136897661624)

## Prueba C y disponibilidad

**PENDIENTE DE PRUEBA C REAL · NO-GO de activación.** En Vercel verifiqué los nombres y destinos de las variables. Aparece la clave de Render IA. Faltan la configuración de Assistant V3 y el almacén de gasto del piloto. La Preview devuelve beta cerrada y el Asistente ofrece seguir con la consulta guiada. Render IA estándar mantiene su circuito actual. El libro común del piloto ya se puede acreditar con Redis local, mientras que su provisión externa y la integración del Render IA estándar requieren una decisión propia. GOV-06a permanece como dependencia de operación general.

La propuesta para la Prueba C usa OpenAI Chat Completions y el snapshot `gpt-5.4-mini-2026-03-17`, con función de herramientas. Tarifa estándar consultada el 21 de noviembre de 2026: 0,75 USD/M de entrada y 4,50 USD/M de salida. El tope propuesto de RUBIK es **1,00 USD**, con reserva previa y Redis dedicado a una Preview protegida del SHA exacto. El acceso efectivo exige el interruptor de beta, lista de testers con sus huellas, namespace y topes del envoltorio privado. Mantener las familias de imagen desactivadas durante C. [Configuración del piloto](../product/assistant-ai-v3/08-piloto-privado-operacion.md) Los 30 casos del programa existente deben ejecutarse con datos sintéticos, clave y acceso separados de Render IA, sin recarga automática, conciliación posterior con el libro y revisión humana de cada oráculo. Las alertas del proveedor son informativas y cualquier límite impuesto por el proveedor puede tardar en aplicarse. El interruptor y los permisos de Production requieren una decisión posterior. [Modelo y tarifa](https://developers.openai.com/api/docs/models/gpt-5.4-mini) · [Límites de OpenAI](https://help.openai.com/en/articles/9186755-managing-projects-in-the-api-platform) · [Protocolo de la Prueba C](../product/assistant-ai-v3/04-protocolo-prueba-c.md)

`store:false` limita el estado de aplicación. La documentación de Chat Completions describe además medidas de retención y control de abusos propias del proveedor. La autorización se circunscribe al modelo, tarifa, cap, acceso, Preview y datos sintéticos indicados. [Controles de datos](https://developers.openai.com/api/docs/guides/your-data)

La aceptación humana y el merge con despliegue automático de Production son gates independientes. M05 llega a revisión con su proveedor desactivado.

## Guía de las cinco fases · corte dependiente de #303

**Destino.** Editor → Asistente RUBIK → Guía de las cinco fases. Elige fase y acción, pulsa «Ver cómo» y usa el botón del módulo existente. También se puede escribir el nombre de la acción. El panel responde en ES, EN o ZH. Dentro de un diálogo abierto, conserva sus controles y explica cómo salir sin perder el contexto. Este acceso queda fuera de las vistas de cliente.

| Fase | Recorridos comprobados en Chromium | Evidencia y límites |
| --- | --- | --- |
| Imaginar | Subir plano, lienzo en blanco, plantilla, escáner, CAD | Selector de archivos e Inicio reales. RoomPlan y DXF/IFC usan el importador nativo. Para DWG, se indica una conversión previa a DXF. |
| Diseñar | Redistribuir, habitaciones, muros, techos, suelos, exterior, muebles | Editor, Propiedades y biblioteca existentes. Recuento de estancias y revisión geométrica con fuente. Los avisos de altura son orientativos. |
| Construir | Localización, Catastro, presupuesto, planificación, Gantt | Emplazamiento, presupuesto y Plan de obra. Las fechas proceden del plan guardado y se comprueba su revisión. Ausencia, fecha inválida o revisión obsoleta tienen salida explicada. |
| Presentar | Blender, Normal, Render IA, Híbrido, Corte | Preparar presentación, OP-10 e Imágenes existentes. El acceso a Imágenes no genera nada. Dibujo vivo sigue experimental. Blender conserva su exportación propia y el render posterior. |
| Recorrer | Navegación 3D, recorrido libre, visita guiada, revisión como cliente, enviar enlace | Visor y Entregar existentes. El visor privado se habilita con la vivienda de ejemplo. La alternativa al enlace es el archivo descargable para el cliente. |

**MCP.** `get_workflow_guidance` usa las mismas 27 entradas, enlaza exclusivamente herramientas existentes de lectura y declara que desconoce el estado del editor en vivo. Las herramientas de proyecto conservan el SHA-256 del JSON seleccionado. La guía no devuelve datos del plan guardado, credenciales ni estado de conectores.

**Reproducción.** Windows y Playwright con Chromium. La regresión de navegador comprueba los 27 recorridos, el punto de entrada de cada uno, igualdad del proyecto y ausencia de escrituras de consulta o peticiones de servicio. El caso Gantt incluye plan ausente, plan vigente, fecha inválida y plan obsoleto. Incluye idioma EN/ZH, comparación de la revisión de distribución con su fuente y bloqueo de navegación desde un diálogo abierto. Firefox y WebKit comprueban el recorrido Gantt hasta Plan de obra. Las capturas son de la vivienda de ejemplo en Chromium. [Escritorio](evidence/m05-guia/gantt-es.webp) · [Móvil](evidence/m05-guia/gantt-movil-es.webp)

**Pruebas reproducibles.** `node --test --test-name-pattern 'guía' tests/assistant-ai-v2.browser.test.cjs`. Los controles anteriores siguen en la suite del Asistente. `npm test --prefix tools/rubik-mcp` en Linux verifica los contratos stdio, las 27 entradas de la guía y la inmutabilidad del JSON original.

**Dependencias y decisión.** Padre exacto de producto M05 `3ffe6f32e8e5f3d5432abf3567f9f8e05370432d`. Base común de producto `e777a6ed7f856aa7a251aa9392b3670ade877f81`. La CI y la Preview de este corte se evalúan sobre su propio SHA. La revisión de esta guía no acredita la Prueba C con un proveedor real ni cambia los permisos del piloto, el almacén, la publicación de enlaces o Production.
