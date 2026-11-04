# RUBIK SOTA — PLAN MAESTRO IA: Imágenes, personalización, escenas habitadas y asistente
**Versión:** 1.0 · **Fecha:** 2026-11-05 · **Estado:** propuesta de producto/documentación, PENDIENTE DE VALIDACIÓN HUMANA · **NO MERGE / NO PUBLICAR**
**Ámbito:** FLOOR PLAN 3D CARACOLA / RUBIK SOTA · repositorio `Juanmaes83/floorplan-3d`.
**Bases:** `master@0f9c6ead9732901681498efec326d1ca92e42ffe`; prueba aislada `fix/b2-b8-gpt-image-25-compat-2026-11-04@7e738ec7bf9c20acd4b5e4b71daf1a68136b4fed`; auditoría `docs/product/ai-agent-b2-b8-technical-audit-2026-11-04.md`.
**Regla:** esta especificación NO autoriza despliegues funcionales, fusión en `master`, cambios sobre PR #166 de Claude, PR #161 legal ni ramas de Kimi. La integración se decide después del OK del propietario y el cierre coordinado de los agentes.

## 0. Decisión ejecutiva

Construir una **experiencia profesional de visualización y asesoramiento**, no una segunda aplicación: (I) **Render IA / Estudio de imágenes** para crear vistas persuasivas basadas en vistas reales del proyecto; (II) **Asistente IA RUBIK** como interlocutor contextual que invoca, con permisos y confirmaciones, las funciones canónicas de diseño, análisis, presupuestos y entrega existentes.

Se diferencian cuatro autoridades:
1. **Proyecto geométrico**: `FloorPlanProjectV1`, núcleos 2D/3D y sus validadores. Un render IA nunca sustituye la geometría ni permite certificar medidas.
2. **Datos económicos**: cantidades/presupuestos C1–C4 ya integrados; no crear un segundo calculador.
3. **Imagen de presentación**: resultado generativo orientativo, versionado y etiquetado. Puede alterar detalles incluso con instrucciones restrictivas.
4. **Acciones del usuario**: un asistente propone; solo la API/herramienta autorizada aplica ediciones confirmadas con diff y deshacer.

**Beneficio buscado**: explicar al cliente no solo cómo es su vivienda, sino cómo se sentiría y usaría el espacio; permitir decisiones de acabados y generar una entrega profesional convincente. El valor comercial debe medirse con calidad aceptada y coste real, no asumirse.

## Nueva ampliación comercial documentada (05/11/2026)

Por decisión de producto, se incorpora un nuevo frente prioritario de **reforma visual a partir de fotografías enviadas por clientes**, diferenciado de reconstrucción métrica, junto con **panorámicas conceptuales 360°, 360° vinculado al modelo 3D y vídeo desde renders aprobados**. También se formalizan paquetes premium y la reevaluación de prioridades visuales con Kimi, **sin detener ni modificar ramas ajenas**.

**Contrato detallado y criterios:** [Foto→reforma, panorama 360, vídeo y precio premium](ia-servicios-foto-reforma-panorama-360-video-valor-comercial-2026-11-05.md). Este documento es un **complemento normativo de planificación**; las prioridades antiguas deben interpretarse junto a él. No se afirma que las funciones añadidas ya estén implementadas.

## 1. Evidencias y estado real (no mezclar integraciones con propuestas)

| Elemento | Evidencia / estado al corte | Falta |
| --- | --- | --- |
| B2: vista 3D real → imagen IA | Código existente en `master`: `js/ai-render-ui.js`, `api/render.js`; **1 generación real satisfactoria** en Preview de prueba el 2026-11-04, salón | coste real individual, calidad máxima, comparación en otras estancias |
| B8: alternativas de acabado | Mismo endpoint B2, listas cerradas de materiales, muestra lado a lado; **1 generación real** con porcelánico gran formato + estuco arena | pruebas de cumplimiento por material, ausencia de alteraciones geométricas |
| Automatización QA | GitHub Actions `41927791516`, **6 tests passed, 0 failed**, incluyendo token aislado Preview | browser QA multidispositivo y flujo de errores real |
| Compatibilidad modelo | Rama aislada cambia default retirado `gpt-image-1` a `gpt-image-2.5-sunburst`; `RUBIK_RENDER_MODEL` env Preview | capturar modelo efectivo por solicitud y calidad efectiva |
| Seguridad Preview | Token `RUBIK_RENDER_TOKEN_PREVIEW` opcional en rama de prueba, token general mantenido; secretos en Vercel | limpiar duplicados tras autorización; auth por usuario/organización antes de comercializar |
| Exportación de imagen | Captura aportada `rubik-sota-render-ia-salo-n.png`, **1600×1000 px**, aprox. 2,6 MB; etiqueta IA/orientativa presente | la descripción de acabado en banda aparece **truncada** |
| Fidelidad de primera prueba | composición general, sofá, sillón, mesa y carpintería acristalada se conservan visualmente; luz y materiales muy mejorados | puertas, muros, cotas, objetos pequeños y textura no verificados objetivamente |
| Guía actual | `js/guide-core.js`, `js/guide-ui.js`: ayuda local/determinista | no confundir con agente LLM |
| MCP local | `tools/rubik-mcp`: lectura, elementos, diagnosis/medidas/ruta limitada sobre JSON exportado | no conectado automáticamente a editor activo ni habilitado para escribir |
| Asistente LLM en RUBIK | **no implementado en `master` examinado**; diseño preparatorio documentado | API servidor, esquema de herramientas, permisos, UI, pruebas, costes |
| PR de Entregas | PR #166 de Claude, borrador, sin merge autorizado | auditoría y coordinación UX; no duplicar su panel |
| Protección/condiciones | PR #161 documento jurídico borrador | revisión jurídica/privacidad antes de uso comercial |
| Estado de producto | documentos antiguos aún registran B2/B8 como «validación real pendiente» | actualizar el estado SOLO tras aceptación y contabilidad; la prueba real ya sucedió |

**Alcance probado de B2/B8:** una vista, un estilo, un suelo, una pared, descarga. No está probada alta concurrencia, gama amplia de materiales, escenas con personas, referencias de clientes, facturación ni tasas de aceptación.

## 2. Auditoría técnica del recorrido actual

`Entregar → Imágenes → Preparar 5 vistas → Generar imágenes → seleccionar una vista → Render IA` es el recorrido real observado. La preparación crea vistas basadas en el proyecto existente. La UI transforma una vista en JPEG de entrada y envía solamente imagen y claves de estilo/acabado al `POST /api/render`, con consentimiento y token de acceso. El servidor construye prompt fijo y llama a `POST /v1/images/edits`; pide `n=1` y `size=1536x1024`, **sin `quality` explícito** (la API utiliza `auto` por defecto), recibe base64 y muestra comparación/descarga. El resultado vive en la sesión del navegador; la edición no altera el JSON del proyecto. Los prompts prohíben añadir personas y grandes cambios.

**Deudas demostradas:**
- Acceso muy oculto y demasiados clics; la etiqueta pública debe seguir siendo **Render IA** (B2/B8 son nombres internos).
- Catálogo de estilos, suelos y paredes corto; sin luz/atmósfera/techo/tejidos/elementos selectivos.
- Sin control por capas, región, máscaras, variantes planificadas, referencia secundaria, personas ni consistencia entre habitaciones.
- Sin calidad `low/medium/high/xhigh/max` seleccionable, sin selector de coste antes de ejecución.
- El servidor no expone ni persiste `usage`, duración, ID interno correlacionable o coste; por tanto no hay coste unitario retrospectivo demostrable desde el archivo PNG.
- Un único token de acceso compartido y persistido en `localStorage` no es autenticación profesional multiusuario ni límite de gasto. Diseñar sustitución antes de apertura pública.
- Exportación: banda de texto cortada; sustituir truncamiento silencioso por composición adaptable (varias líneas/encaje/título completo) con tests de textos largos, ES/EN/ZH.

## 3. Diseño de producto: «Estudio de imágenes» dentro de Entregar

**Entrada principal:** `Entregar → Imágenes`, con acción visible **Render IA** por vista y un acceso destacado a **Estudio de imágenes** desde la galería. **No** crear un segundo visor 3D. Las imágenes deben conservar el vínculo con `projectId`, `revision` y `viewId` existentes cuando se guardan de forma autorizada.

### 3.1 Estructura UX en tres niveles
- **Rápido (por defecto):** vista original; estilo; iluminación; suelo; paredes; personas (No/Genéricas); calidad estimada y coste estimado **antes de generar**; consentimiento; botón único.
- **Avanzado (opt-in):** control de grado de transformación, catálogo de materiales/texturas, color, brillo/rugosidad visual, techos, mobiliario, decoración, sombra/hora, región/máscara, referencias, composición, salida y variantes.
- **Estudio/Entrega:** original ↔ resultado con slider y zoom; comparador 2–4; selección de candidata; calidad y coste; historial local temporal; aprobar/rechazar; generar archivo de cliente; descargar. No se comparte automáticamente.

### 3.2 Mapa de mejoras: QUÉ, DÓNDE, POR QUÉ, CRITERIO
| ID / Prioridad | Qué implementar | Ubicación y contratos | Por qué / aceptación mínima |
| --- | --- | --- | --- |
| IMG-01 P0 | Corregir etiqueta cortada, nombre largo y composición de exportación | `js/ai-render-ui.js` + `FloorPlanDeliveryImage` / Entregar | título de acabado íntegro en 1600×1000, 1440×900 y móvil, sin esconder advertencia IA |
| IMG-02 P0 | Transparencia y medición de consumo con ID por petición | `api/render.js` + nueva capa de contabilización server-side | petición tiene modelo, tokens, éxito/error, duración, coste estimado/facturado, sin imágenes ni secretos en logs |
| IMG-03 P0 | Calidad explícita: Borrador / Presentación / Máxima | selector Render IA, validación servidor, `quality` API | `low`/opción intermedia/`max`, coste estimado visible; comprobar disponibilidad por modelo, no suponer «Premium» = máxima calidad |
| IMG-04 P0 | Selector de presupuesto/confirmación e interrupción de lotes | cabecera Estudio + api de cuotas | no generar 3/5/20 imágenes silenciosamente; mostrar coste previsto, máximo, número total y confirmación |
| IMG-05 P1 | Catálogo extenso de suelos: especies de madera, espiga, formatos de porcelánico, mate/pulido, piedra, terrazzo, microcemento | panel Materiales, catálogo de tokens controlados servidor + interfaz | diferencia visible, no inventar un material aplicado al proyecto; origen/licencia de texturas |
| IMG-06 P1 | Paredes: color, estuco, panelado, pintura y pared acento; techos como capa separada | panel Acabados, contratos `finishSelections` tipados | sólo cambiar superficies permitidas; techo y panelado no crear nueva geometría sin consentimiento |
| IMG-07 P1 | Iluminación: mañana, mediodía, tarde, nocturna, natural/artificial, temperatura y sombras | panel Iluminación, prompt/controles de servidor | escenas comparables con orientación plausible; no prometer cálculo lumínico |
| IMG-08 P1 | Ambiente/estilos: mediterráneo, japandi, orgánico, industrial suave, escandinavo, contemporáneo, familiar, hotelero | presets en Render IA | reducir esfuerzo sin limitar control avanzado; comparar misma vista |
| IMG-09 P1 | Decoración y mobiliario visual: textiles, lámparas, cuadros, vegetación, menaje | Decoración; reglas de objetos conservados/removibles | no reemplazar mobiliario contratado ni bloquear puertas; cambios sólo visuales |
| IMG-10 P1 | Intensidad de cambio: Fiel / Equilibrado / Creativo + bloqueo de geometría/cámara | avanzado y prompts + revisión de comparación | indicador honesto de riesgo de desviación; nunca certificar geometría desde imagen |
| IMG-11 P1 | Presets por estancia: salón, cocina, baño, dormitorio, despacho, exterior compatible | selector sobre `FloorPlanProjectViews` | evitar recetas inadecuadas; fallback si la vista no contiene estancia identificada |
| IMG-12 P1 | Variantes 2–5, comparación, favoritos y «volver a anterior» | Galería/Estudio | coste previo `n`, cada salida tiene id y coste, no sobrescribir la original |
| IMG-13 P1 | Biblioteca de materiales y referencias: muestras/colores con metadatos, licencia, miniatura | `Mi estudio → Biblioteca visual` (propuesta) y selector de acabados | reuso profesional y consistencia; no copiar catálogo jurídico ni presupuestos |
| IMG-14 P2 | Edición localizada por región/máscara con vista previa de zona | avanzado, `/v1/images/edits` y datos de máscara | cambiar pared/suelo localizado sin modificar resto; falsos positivos visibles |
| IMG-15 P2 | Referencia estética adicional: foto de interior, moodboard o material permitido | avanzado → Referencias | trasladar paleta/luz/acabado sin sustituir la distribución; consentimiento/licencia |
| IMG-16 P2 | Consistencia entre vistas y espacios: receta bloqueada + paleta + referencias de proyecto | Estudio/galería, `styleRecipeVersion` y `projectRevision` | misma decoración/material no deriva entre salón/dormitorio; revisar mediante matriz visual |
| IMG-17 P2 | Fichas de imagen: original, final, materiales, ambiente, selección, versiones y leyenda IA | `Entregar → Galería → Ficha de imagen` (coordinar PR #166) | pieza compartible con trazabilidad y revisión; sin exponer claves |
| IMG-18 P2 | Lotes y entregas: 5 vistas, 3 alternativas, dossier y ZIP opcional | `Entregar`, reutilizar exportador y Story | coste/lote y progreso por imagen, cancelar pendientes, sin generar contenido no aprobado |
| IMG-19 P2 | Modo personas genéricas: 0, 1, 2 o grupo; actividad y naturalidad | `Render IA → Escena habitada` | figuras plausibles sin tapar huecos ni confundir con ocupantes reales; aviso «personas generadas» |
| IMG-20 P3 | Referencias de personas reales del cliente, explícitamente opt-in | `Render IA → Escena habitada → Referencias privadas`; servidor aislado | preservar identidad solo cuando la persona autoriza; auditoría de privacidad y coste adicional |
| IMG-21 P3 | Narrativa «Así se vive»: escenas del día, hábitos, mascota, trabajo, comida, descanso | `Entregar → Galería/Fichas` y Story (sin reescribirla) | experiencia del cliente más comprensible; no inducir a creer que es foto real |
| IMG-22 P3 | Panel profesional de analítica: ratio de aceptación, coste/imagen, coste/lote, errores, calidad | `Mi estudio → Consumo IA` y servidor | defender precios, anticipar saldo, detectar uso anómalo |

**Clasificación:** P0 correcciones/medición, P1 personalización viable sin fotos privadas, P2 flujos de referencia y consistencia, P3 escenas personalizadas avanzadas. Las prioridades son **propuestas**, no compromiso de entrega.

### 3.3 Escena habitada y referencias de clientes — dos productos distintos
**A. Personas genéricas:** un selector de cantidad y actividad (leer, cocinar, conversar, trabajar, descansar); figuras generadas, sin imágenes privadas. Primer piloto. Configurar ubicación preferida cuando el encuadre permita, evitar ventanas/recorridos/ocultación del espacio. Nunca cambiar proyecto.

**B. Cliente real mediante referencias (premium, posterior):**
1. El profesional obtiene consentimiento verificable del titular de las fotos; si hay menores, consentimiento de sus responsables y evaluación reforzada. No tomar fotos de terceros de redes sociales por conveniencia.
2. El cliente autoriza explícitamente **uso para una propuesta IA concreta**, proveedor, destinatarios, retención y opción de retirada. No usar la imagen para entrenar identidades ni generar escenas engañosas.
3. Flujo `Añadir referencias privadas`: miniaturas locales, recorte/selectores, validación PNG/JPEG/WebP, EXIF eliminado, límites de tamaño y cantidad. Los originales permanecen privados y no viajan hasta confirmar.
4. Primera versión con **1–3 referencias**; considerar que la API admite hasta 16, pero no son un requisito ni justifican el coste. Evaluar preservación de identidad, ropa y actividad con consentimiento; **no se garantiza coincidencia facial perfecta**.
5. Cada encargo produce ficha: `imagen del espacio + referencias permitidas + actividad + acabado + coste + versión`. Mantener consentimiento por sesión y por persona; evitar almacenamiento permanente por defecto.
6. Al terminar: borrar temporales, permitir eliminación de fichas y revocar accesos; no almacenar fotos en logs, analíticas ni en el JSON canónico. Si se decide usar Blob, exigir política de almacenamiento privado, acceso, caducidad, borrado y auditoría D-08/D-09.
7. Generar la imagen señalada claramente como **composición IA recreada**. No presentar a terceros como fotografía documental, prueba de ocupación, comercialización de una persona o material de proyecto construido.
8. Validar fidelidad del espacio, realismo de figuras, representaciones respetuosas, consentimiento, borrado, revocación y **coste diferencial de añadir imágenes de referencia**.

**Importante:** «Subir referencias» puede significar (1) inspiración decorativa del cliente, (2) material/textura del fabricante o (3) fotos de personas; sus permisos y tratamientos son distintos. Crear tres categorías de entrada, no un campo de archivo ambiguo.

### 3.4 Principios de calidad arquitectónica
- Modo **Fiel** por defecto para documentos de proyecto: encuadre, muros, huecos, puertas, dimensiones, circulación y muebles principales son restricciones semánticas; defectos se revisan frente a la vista original.
- No confiar en el prompt «EXACTLY» como garantía. Contrastar con pares de imágenes, máscaras/contornos cuando sean fiables, capturas fijas y checklist humano; si hay deriva crítica, rechazar la salida.
- El modo Creativo **siempre** advierte que representa una alternativa estética, no modifica `FloorPlanProjectV1`.
- Diferenciar iluminación simulada de informe Solar/orientación calculado. Sin falsear ventanas o vistas.
- Fotos con personas: una salida atractiva no certifica identidad, parentesco ni uso real del inmueble.

## 4. Asistente IA RUBIK — experiencia y arquitectura

### 4.1 Objetivo y ubicaciones
Un **Asistente RUBIK contextual** accesible desde `Diseñar` (guía de creación), `Analizar` (consulta explicada), `Presupuestar` (cantidades y partidas) y `Entregar` (preparar galería/solicitar render). Entrada discreta y consistente, no un chat que sustituye la navegación.

- **En Diseñar:** «¿Qué estancias tengo?», «¿qué obstáculos muestra la revisión?», «sugiere una ubicación para el sofá» (primero lectura, luego propuesta simulada).
- **En Analizar:** consultar superficie, escala/procedencia, orientación/datos disponibles; no declarar certificado ni normativa.
- **En Presupuestar:** explicar partidas/fuentes C1–C4 y recalcular solo mediante núcleos actuales con autorización.
- **En Entregar:** seleccionar vistas, pedir un estilo, presupuesto de 3 renders y comparar resultados; delegar en B2/B8, no crear otra ruta de imágenes.

### 4.2 Cortes de producto
| Corte | Comportamiento | Herramientas y controles | Criterio de salida |
| --- | --- | --- | --- |
| AG-0: catálogo y permisos | Diseñar contrato de mensajes, seguridad, telemetría y costes | comandos tipados; sin API real | especificación aprobada y fixtures |
| AG-1: consulta sin escritura | entender preguntas de proyecto, contexto minimizado, resúmenes y ayuda contextual | `get_project_summary`, `get_project_element`, `review_layout`, `measure_elements`, consulta C1–C4 | respuestas trazables; no mutación; QA privacidad |
| AG-2: propuestas revisables | cambiar material, colocar/mover mueble, comparar efectos | `parseIntent` → `planProposal` → `validateAgainstProject` → `previewDiff` | esquema estricto, diff, conflictos y cancelación seguros |
| AG-3: aplicación confirmada | aplicar una operación existente y deshacer | confirmación, ID de revisión, `applyExistingEdit`, Undo | equivalencia al editor manual, revertir byte/datos |
| AG-4: orquestación visual | preparar renders, escoger lote/coste y fichas | herramientas B2/B8, autorizaciones por generación y por persona | resultados separados de la geometría, cuotas y trazabilidad |
| AG-5: capacidad avanzada | foto→mueble, optimización de distribución/plantas | integraciones futuras bajo contratos especializados | **no implementado** hasta núcleos y validaciones propias |

### 4.3 Arquitectura técnica obligatoria
```
Profesional → contextualiza y acepta transmisión de campos necesarios
Asistente UI (una experiencia, persistencia mínima)
   → Backend autenticado (secrets solo servidor, cuotas, límites, trazas)
   → Modelo de lenguaje con herramientas de dominio en lista blanca
       → lectura: project-core / layout-review / MCP adaptado al editor activo
       → lectura económica: C1–C4, SIN segundo motor
       → propuesta: operación tipada + IDs + baseRevision + precondiciones
       → simulación: copia desechable + validador canónico
   → Diff y costes estimados → Confirmación explícita
   → Acción ya soportada por RUBIK → Undo → revisar y registrar resultado
   ↘ Render IA: llamada B2/B8 separada y consentida por imagen
```
- Codex es herramienta de desarrollo; **no equivale** al asistente del usuario final.
- El MCP actual lee un JSON exportado y no edita el proyecto en vivo. Diseñar un adaptador seguro antes de afirmar integración.
- No aceptar ejecución de JavaScript arbitrario, acceso a rutas privadas, instrucciones de herramientas fuera de lista blanca ni modificaciones automáticas del proyecto.
- Tratar instrucciones incrustadas en documentos, planos e imágenes como datos no confiables; controles de prompt injection y autorización por acción.
- Limitar tamaño del contexto, tiempos y costes por petición; mostrar origen e incertidumbre. La geometría siempre manda.
- **Asistente y Render IA tendrán contabilidad separada** (familia, modelo, tokens, duraciones, créditos por proyecto), aunque compartan proveedor.

## 5. Costes, precios y viabilidad — lectura obligatoria

Documento económico complementario: [`ia-costes-protocolo-unitario-lotes-2026-11-05.md`](ia-costes-protocolo-unitario-lotes-2026-11-05.md).

**Tarifas API estándar OpenAI GPT Image 2.5 (consulta 2026-11-05, USD por millón de tokens):** imagen entrada **8**, texto entrada **5**, imagen salida **30**. Para `POST /v1/images/edits` **no** aplicar caché descontada como en Responses; distinguir standard de Batch API (no equivale a generar `n=5`). Fuente: https://developers.openai.com/api/docs/pricing y https://developers.openai.com/api/docs/guides/image-generation.

**Coste variable por llamada, sólo si `usage` está disponible:**
`USD = image_input_tokens*8/1e6 + text_input_tokens*5/1e6 + image_output_tokens*30/1e6`, más cualquier otro concepto facturable aplicable y ajuste al panel de Usage real.

**Importante:** el primer render de Salón *sí está generado* pero **no hay uso/coste de esa petición en la UI o el PNG**. Estado contable: `NO MEDIDO`; no inventar «costó X». Recuperar coste de Usage/OpenAI si existe correlación horaria y ninguna otra petición; de lo contrario `ATRIBUCIÓN NO VERIFICABLE`.

Distinguir:
- **Coste de generación**: API (también intentos/reintentos facturables si los hubiera).
- **Coste de producción efectivo**: consumo total / nº de imágenes **aceptadas** para entregar, que incorpora rechazos y retrabajo.
- **Coste completo**: API + Vercel/invocaciones + almacenamiento/transferencias + revisión humana + comisiones + administración + contingencias.
- **Precio comercial**: coste completo, margen bruto objetivo, IVA/impuestos y canal según política; NO asignar tarifa sin datos de mercado y margen decidido.

**Productos a medir por separado:** B2 sin cambios; B8 un suelo/una pared; `quality=high`; `quality=max`; variante 3×; lote 5 vistas; un render con referencia decorativa; escena genérica; escena con 1–3 fotos consentidas; regeneración por rechazo; asistente lectura/propuesta/orquestación.

**Guardias:** presupuesto previsualizado, confirmación, tope por usuario/proyecto/mes, rechazo ante saldo/limite, cola secuencial y parada de lote al alcanzar umbral. Los 10 USD iniciales fueron crédito de prueba; no conocemos el saldo disponible tras la generación y no debemos inferirlo del archivo.

## 6. Plan de pruebas medibles

### 6.1 Registro estandarizado por operación
`request_internal_id, timestamp_utc, proyecto_fixture/revision, tipo(B2/B8/personas/referencias/agente), imagenes_entrada, hashes_no_reversibles, modelo_pedido/modelo_respondido, quality, size, style, floor, walls, escena, fotos_ref_count, éxito/error, proveedor_request_id_sanitizado, latencia_ms, usage_image_in, usage_text_in, usage_image_out, billed_usd, estimated_usd, accepted_human, defect_codes, nota_privacidad`.

No guardar base64, prompts con datos personales, claves, foto original del cliente ni nombres de personas en el registro económico. Encolar y agregar sólo con consentimiento/protección de datos.

### 6.2 Matriz QA visual
- **Fidelidad:** contornos de muros, huecos, puertas, ventilación visual, cocina, mobiliario fijo y encuadre (OK / defecto menor / crítico).
- **Material:** superficie correcta, continuidad del patrón, textura, reflejos y solidez de frontera.
- **Luz:** orientación plausible, exposición, sombras, interior/exterior coherentes.
- **Escenas humanas:** proporciones, extremidades/manos, postura, apoyo, mirada y escala respecto a mobiliario; no bloquear lectura.
- **Referencias de personas:** consentimiento y eliminación documentados, parecido razonable sin promesa de identidad perfecta; no contenido engañoso.
- **Salida:** nitidez, texto completo, leyenda IA, versión, exportación correcta, descarga y accesibilidad móvil.
- **Economía:** coste medido, éxito, intentos, tiempo, precio de material de referencia, idempotencia sin cobro inesperado.

**Gate de calidad:** ninguna salida con geometría crítica alterada entra en entrega sin revisión humana; un «pasa» de provider/CI no aprueba visualmente el resultado.

### 6.3 Ensayo propuesto con control de gasto
1. P0 sin proveedor: unitarias, UI, exportación y trazabilidad.
2. Calibración B2: misma vista, `quality=low/high/max` **uno por nivel si presupuesto permite**, con coste y evaluación ciega.
3. Calibración B8: mismo encuadre con una sola superficie; después suelo y pared.
4. Variantes: repetir 3 veces mismo encargo para medir dispersión y tasa de aceptación.
5. Lote: 5 vistas secuenciales, coste bruto, éxito/reintentos y estilo consistente.
6. Personas genéricas: solo después de comprobar métricas anteriores y los límites del flujo.
7. Fotos de clientes: pilotos opt-in consentidos, con auditoría de privacidad previa y coste por referencia comparado.
8. Asistente: consultas con oráculos canónicos y coste por petición, después propuestas sin escritura, luego confirmación.

## 7. Coordinación de implementación sin duplicidades

| Ciclo | Responsable/propuesta | Dependencias / límite |
| --- | --- | --- |
| D0 (ahora) | Documentar visión, fichas económicas, métricas, estados y mock UX | sin merge y sin gastar API |
| D1 | Corregir export IMG-01 y capturar `usage`/costes IMG-02 | rama aislada; revisión seguridad, tests antes de nueva llamada |
| D2 | Calidad explícita, coste anticipado y presets/materiales IMG-03/04/05/06/07/08 | comprobar contratos Image API, matriz de calidad y económica |
| D3 | Comparador/galería, 3 variantes y consistencia IMG-10/12/13/16/17 | coordinar **PR #166** con Claude antes de tocar Entregas |
| D4 | Imágenes de referencia de ambientes + personas genéricas IMG-15/19 | consentimiento, moderación y QA por estancia |
| D5 | Referencias reales del cliente IMG-20/21 | auditoría D-08/D-09, privacidad, eliminación y costes |
| A0→A4 | Asistente IA: lectura → propuesta → aplicar con undo → orquestar Render IA | backend, auth, permisos, `FloorPlanProjectV1`, C1–C4 y MCP |
| Producto | Home V2 debe mostrar **Disponible / En validación / En preparación** según evidencia | no anunciar capacidades de rama ni PR #166 como integradas |

No iniciar otro editor, otro motor de presupuesto, otro proyecto geométrico, otro servicio de imágenes o una UI de Entregas paralela. Crear cortes pequeños, QA reproducible, revisión humana y autorización individual.

## 8. Preguntas de decisión que hay que resolver antes de desarrollo premium

1. Público inicial: estudio interno, profesionales invitados o SaaS multiestudio; define autenticación y cuotas.
2. Qué se cobra: por imagen, créditos, lote, cuota mensual, servicio de diseño humano o combinación.
3. Umbral de calidad objetivo por producto; ¿fidelidad arquitectónica o presentación aspiracional?
4. Política de almacenamiento: sesión, proyectos guardados o galería compartible; plazos de retención/retirada.
5. Consentimiento de referencias reales; quién lo obtiene, cómo se demuestra, cuánto dura y qué ocurre con terceros/menores.
6. Qué estilos/materiales de la biblioteca tienen licencia comercial y qué texturas se pueden reusar.
7. Margen objetivo y costes humanos; confirmar precios en EUR, cambio FX, impuestos y soporte.
8. Qué permisos iniciales del agente son solo lectura; qué operaciones quedan para versiones posteriores.
9. Quién aprueba cambios en Entregas mientras la PR #166 continúa.
10. Qué evidencia exigir para «Disponible» en Home antes del primer cliente externo.

## 9. Criterios de terminación del programa

No declarar «IA terminada» hasta que estén verificados: fidelidad visual aprobada; coste por imagen con `usage` y conciliación; lotes con parada por gasto; seguridad de secretos y usuarios; privacidad de referencias; exportaciones sin truncamiento; móvil/accesibilidad; no mutación del proyecto por renders; y asistente con permisos/confirmación/undo antes de escritura.

**Queda expresamente prohibido interpretar este documento como autorización para fusionar PR #161/#166 o cualquier otra.**

## 10. Referencias y trazabilidad

**Internas:**
- [Auditoría B2/B8 y agente](ai-agent-b2-b8-technical-audit-2026-11-04.md)
- [Puertas de evolución 04/11](evolution-preparation-gates-2026-11-04.md)
- [Home V2](home-v2-content-audit-2026-11-04.md)
- [Estado de producto antiguo (histórico)](roadmap-completion-matrix-2026-10-30.md)
- [Contratos MCP local](../technical/local-mcp-roadmap.md)
- Código `master`: [render](https://github.com/Juanmaes83/floorplan-3d/blob/master/api/render.js) · [UI](https://github.com/Juanmaes83/floorplan-3d/blob/master/js/ai-render-ui.js)
- Rama QA B2/B8: [código](https://github.com/Juanmaes83/floorplan-3d/tree/fix/b2-b8-gpt-image-25-compat-2026-11-04), [CI 6/6](https://github.com/Juanmaes83/floorplan-3d/actions/runs/41927791516).
- PR coordinación: [#166 Entregas](https://github.com/Juanmaes83/floorplan-3d/pull/166), [#161 legal](https://github.com/Juanmaes83/floorplan-3d/pull/161).

**Proveedor, consulta 2026-11-05:**
- https://developers.openai.com/api/docs/guides/image-generation
- https://developers.openai.com/api/reference/resources/images/methods/edit
- https://developers.openai.com/api/docs/guides/image-prompting
- https://developers.openai.com/api/docs/pricing

**Aclaración documental:** esta versión actualiza la *evidencia* de B2/B8 después de la primera generación real. Los antiguos documentos previos al 04/11 describen correctamente la situación de entonces; su estado «pendiente de prueba real» está ahora parcialmente superado, pero no implica cierre comercial.
