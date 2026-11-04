# RUBIK — Auditoría de capacidades IA: B2 / B8 / asistente de creación
**Fecha:** 2026-11-04
**Repositorio / base de análisis:** `Juanmaes83/floorplan-3d`, `master@0f9c6ead9732901681498efec326d1ca92e42ffe`
**Estado:** INFORME DOCUMENTAL; SIN CAMBIOS DE CÓDIGO, SIN LLAMADAS API, SIN DEPLOY, NO MERGE.

## Resumen de decisiones
1. Para consumir la API OpenAI desde RUBIK sí hace falta una **clave API válida** asociada a un **proyecto OpenAI Platform**. No se necesita una clave por funcionalidad, pero para limitar privilegios y diagnosticar gastos conviene separar credenciales de Render IA y Asistente si ambos se despliegan. Un único proyecto OpenAI dedicado a RUBIK puede contener las dos; no confundirlo con `FloorPlanProjectV1`.
2. La organización dispone de crédito prepago según captura aportada por usuario; auto-reload OFF según confirmación del propietario. Esto NO prueba que exista un proyecto OpenAI dedicado, clave activa, permisos, verificación de organización ni secretos en Vercel. No hacer llamadas reales sin esos gates y autorización expresa.
3. B2 y B8 comparten **un mismo endpoint de imagen**. El asistente de creación es otro subsistema; puede orquestar funciones B2/B8 con confirmación, pero no debe mezclarse con el renderer ni inventar otra autoridad geométrica.
4. El modelo `gpt-image-1` por defecto en `api/render.js` **dejó de funcionar el 2026-10-23**. Debe reemplazarse en una rama de implementación aislada y probarse contra modelo actual antes de usar créditos.
5. Las herramientas locales de guía/MCP existen, pero **no existe aún un asistente generativo in-app conectado a OpenAI que edite el proyecto**. No anunciarlo como disponible.

## 1. Fuente: RUBIK B2 / Render IA
- PR histórica: #139, `https://github.com/Juanmaes83/floorplan-3d/pull/139`. Su estado administrativo puede permanecer OPEN aunque el código se haya integrado a `master`; controlar por archivos y SHA, no solo estado PR.
- `js/professional-workspace-ui.js`: desde Entregar → Generar imágenes hay acción Render IA sobre vista real preparada de `FloorPlanProjectViews`.
- `js/ai-render-ui.js`: convierte esa vista a JPEG, solicita consentimiento para transmisión y código de acceso, envía `{style,image}` a `api/render`, compara vista original con IA y ofrece descarga con leyenda orientativa. Resultados en caché de sesión; no edita ni guarda proyecto.
- `api/render.js`: POST, clave `OPENAI_API_KEY` de servidor, código `RUBIK_RENDER_TOKEN`, validación de estilo/tamaño y prompt fijo. Llama a `POST https://api.openai.com/v1/images/edits` y espera `data[0].b64_json`.
- B2 preserva geometría **como instrucción de prompt**, NO como garantía geométrica del resultado; revisar puertas/ventanas, contornos, muebles, cotas visibles, encuadre y alteraciones.
- Limitaciones: modelo por defecto retirado, sin medida real de coste ni resultado proveedor, token profesional único almacenado en localStorage, sin contabilidad/cuotas individuales de usuario; confirmar arquitectura de acceso antes de servir usuarios externos. La imagen puede incluir contenido privado aun si el JSON no se transmite.

## 2. Fuente: RUBIK B8 / alternativas visuales IA
- PR histórica: #146, `https://github.com/Juanmaes83/floorplan-3d/pull/146`.
- Ampliación de B2, NO un motor separado: mismo botón, endpoint y proveedor.
- Inputs cerrados: `floor` [light-oak, walnut, microcement, marble, terrazzo, large-tile] y `walls` [white, warm-white, sage, sand-plaster, grey-blue] con `style`.
- El servidor construye un prompt como «Change ONLY these finishes»; cambia **imagen**, NO `FloorPlanProjectV1` ni el catálogo aplicado en Rubik.
- El diálogo muestra alternativas previas de esa vista y permite descargarlas; los acabados reales deben aplicarse desde el editor Superficies.
- QA visible en PR y tests `tests/ai-render-api.test.cjs`, `tests/ai-render.browser.test.cjs`: proveedor simulado, no evidencia de fidelidad real ni de consumo facturado.

## 3. Fuente: asistencia al diseño / agente
- `js/guide-core.js` y `js/guide-ui.js`: búsqueda de acciones + guía de objetivos, 100 % local y determinista, sin llamadas OpenAI; **ayuda existente**, no LLM.
- `js/wall-assist.js`: sugerencias de líneas en imágenes a escala limitada, prototipo de procesamiento local; no identifica automáticamente todo el plano de forma garantizada.
- `tools/rubik-mcp/README.md` y `tools/rubik-mcp/src/server.mjs`: servidor MCP local **de solo lectura** sobre JSON exportado; herramientas `get_project_summary`, `list_project_elements`, `get_project_element`, `review_layout`, `diagnose_project`, `measure_elements`, `inspect_pair_clearance`, `check_route_2d`.
- `docs/technical/local-mcp-roadmap.md`: propone siguientes etapas: 2 propuestas explicables; 3 simulación aislada; 4 variante revisable con confirmación. No interpretarlas como ya implementadas.
- `docs/product/professional-client-experience-2026-10-21.md` §7 «Ayuda inteligente opcional» separa: comprender la herramienta (existente) vs edición natural (no existe). Requiere decisión D-08: consentimiento para enviar geometría/imagen a proveedor y límites.
- No se localiza en `master` una función serverless `api/agent.js`, `api/assistant.js` ni un chat LLM conectado al proyecto activo; el único endpoint OpenAI de `api/` es `render.js`. Revisar cualquier nueva rama antes de concluir ausencia fuera de `master`.

## 4. Arquitectura recomendada: UNA experiencia de ayuda, subsistemas separados
```
Usuario RUBIK (proyecto activo / permiso y consentimiento)
  → Asistente: comprensión, explicación, ayuda contextual
  → Servidor API de RUBIK (clave privada / cuotas / acceso)
      → Modelo conversacional via Responses API, function calling
      → Herramientas con esquema estricto / lista blanca:
          consultar_resumen / consultar_estancia / medir / diagnosticar
          consultar_cantidades / consultar_presupuesto
          proponer_edicion_material / proponer_movimiento_mueble
          solicitar_render_visual (B2) / solicitar_alternativa (B8)
      → Validador canónico FloorPlanProjectV1 / layout / cantidades / costes
  → Propuesta tipada + diff + comprobación de revisión
  → Vista previa / aceptación del propietario
  → APLICACIÓN por acciones de editor existentes + Undo
  → Actualización de vistas (2D, 3D, cantidades, dossier)
```
- **Lectura y ayuda** son el primer corte, con proyecto minimizado/anónimo, confidencialidad y consentimiento explícitos.
- **Escritura** solo con herramientas tipadas, precondiciones, revisión del JSON/versión para evitar cambios concurrentes, simulación, confirmación y deshacer; sin ejecución de código libre ni edición directa de JSON por el modelo.
- **Visual IA** son llamadas de edición de imagen (Image API) independientes de las modificaciones reales del modelo.
- **Codex / agentes de desarrollo** trabajan el código fuente; NO son automáticamente el asistente de los clientes del editor. La Responses API y/o Agents SDK se integran en el producto, según necesidad.
- En futuras funciones foto→mueble 3D y plantas paramétricas, el asistente puede servir de interfaz, pero la validación dimensional y de distribución pertenece a núcleos especializados, no al texto del LLM.

## 5. Configuración segura de API, SIN gastarla aún
**Organización OpenAI:** crédito API común a proyectos. Comprobar que existe proyecto Platform `RUBIK SOTA` o crearlo si es necesario; usar nombres separados como `RUBIK - Preview` / `RUBIK - Production` cuando proceda.
- Clave API **es necesaria para hacer llamadas pagadas**; si ya existe una clave restringida y segura para el proyecto correcto, se puede reutilizar; evitar generar claves innecesarias.
- Para servidor: una clave restringida con escritura en `/v1/images/edits` para B2/B8; cuando exista el asistente, usar otra credencial con permisos para `/v1/responses` y herramientas autorizadas. Es una **recomendación operativa**, no obligación técnica de OpenAI.
- Vercel: `OPENAI_API_KEY` solo como secreto servidor en entorno autorizado; `RUBIK_RENDER_TOKEN` control de acceso profesional; `RUBIK_RENDER_MODEL` actualizado al modelo actual. Las claves nunca en navegador, GitHub, chat o capturas.
- Proyecto: establecer límite de gasto mensual y **activar Enforce a hard limit** si está disponible (puede haber leve exceso por retardo). Las simples alertas NO detienen consumo. Auto-reload OFF protege compras repetidas, no sustituye límite API.
- Modelos de imagen documentados: `gpt-image-2.5-sunburst` para edición precisa; `gpt-image-2.5-flare` para generación rápida. Revisar coste real (tokens de entrada/salida, tamaño, calidad) y verificación de organización en la consola.
- No mandar proyecto entero cuando baste resumen, IDs y campos necesarios; imagen/renders pueden contener información sensible visual.

## 6. Contratos de QA y criterios de aceptación
### B2 / B8
1. Unitarias con proveedor simulado, actualizado el modelo, validaciones de formato y respuestas; test de frontend/consentimiento.
2. Smoke **una** imagen sintética o ejemplo no sensible, con modelo válido y calidad económica.
3. Una llamada B2 natural y una B8 con cambios de acabado sobre **misma imagen/vista**; registrar tiempo, modelo, `usage` y coste observado sin registrar secretos.
4. Revisión visual humana: elementos permanentes del proyecto sin alteraciones críticas; B8 cambia únicamente acabados solicitados.
5. No divulgar el token en cliente ni permitir llamadas masivas sin límite. No usar resultados para mediciones ni proyectos ejecutivos.

### Agente — corte 1
1. Reconoce petición de consulta; ofrece respuesta sustentada en funciones canónicas y sus IDs.
2. Distingue certeza, incertidumbre, escala estimada, datos insuficientes y fuentes de coste.
3. Resiste peticiones maliciosas para saltar permisos, inventar certificación o borrar contenido.
4. Nunca aplica cambios ni transmite imagen/geometría sin autorización y sin consentimiento correspondiente.
5. Coste medido por llamada / presupuesto. Sin almacenar contenidos sensibles innecesarios.

### Agente — corte 2 (posterior)
1. Propuesta estructurada, impacto, diff, validación canónica, vista previa, confirmación, aplicar y deshacer.
2. Escenarios de conflictos geométricos, revisión obsoleta, cancelación y rollback.
3. Original idéntico cuando se cancela, y no altera presupuestos fuera de motores canónicos.
4. Flujo accesible en móvil y revisión humana real.

## 7. Fuentes verificadas
### RUBIK
- https://github.com/Juanmaes83/floorplan-3d/blob/master/api/render.js
- https://github.com/Juanmaes83/floorplan-3d/blob/master/js/ai-render-ui.js
- https://github.com/Juanmaes83/floorplan-3d/blob/master/js/guide-core.js
- https://github.com/Juanmaes83/floorplan-3d/blob/master/tools/rubik-mcp/README.md
- https://github.com/Juanmaes83/floorplan-3d/blob/master/docs/technical/local-mcp-roadmap.md
- https://github.com/Juanmaes83/floorplan-3d/blob/master/docs/product/professional-client-experience-2026-10-21.md
- https://github.com/Juanmaes83/floorplan-3d/pull/139
- https://github.com/Juanmaes83/floorplan-3d/pull/146
### OpenAI (consultadas 2026-11-04)
- https://help.openai.com/en/articles/9186755-managing-projects-in-the-api-platform
- https://developers.openai.com/api/docs/guides/image-generation
- https://developers.openai.com/api/reference/resources/images/methods/edit
- https://developers.openai.com/api/docs/guides/function-calling
- https://developers.openai.com/api/docs/guides/agents/sdk
- https://developers.openai.com/api/docs/guides/safety-best-practices
- https://developers.openai.com/api/docs/pricing

**Sin merge, sin cambios en la aplicación, sin uso de saldo y sin aprobación tácita del diseño del asistente.**
