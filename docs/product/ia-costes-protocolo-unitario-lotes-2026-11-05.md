# RUBIK SOTA — Protocolo económico IA: coste unitario, lotes, referencias de cliente y precios
**Versión:** 1.0 · 2026-11-05 · **Estado:** modelo preparatorio, valores de gasto real PENDIENTES.
**Relación:** [Plan maestro IA](ia-imagenes-asistente-plan-maestro-2026-11-05.md).
**No implica generar más imágenes, fusionar PR, activar pagos ni fijar tarifas comerciales.**

## Nueva familia de costes y precios (05/11/2026)

Se añade la oferta **Foto→reforma** sin proyecto previo, y como líneas de exploración **panorama conceptual 360°, 360° consistente derivado del modelo 3D, animación no generativa de imágenes y vídeo generativo de imagen**. Ver [anexo detallado](ia-servicios-foto-reforma-panorama-360-video-valor-comercial-2026-11-05.md). Medir por separado el coste API de fotos editadas, número de imágenes de referencia, retoques, protección de datos y revisión; panoramas requieren QA de costuras; vídeo generativo se factura en USD/segundo según modelo/resolución. Precio premium de venta `!=` gasto de proveedor. Los valores de ofertas del anexo son **hipótesis para validar**, no tarifas oficiales RUBIK.

La presencia de una cifra de gasto en una captura agregada de OpenAI puede documentar **gasto observado de cuenta**, pero no garantiza asignación al único render de RUBIK salvo correlación de petición/horario. Registrar cifra exacta y fuente al recibir evidencia verificable.

## 1. Qué conocemos, qué no conocemos

**Conocido:**
- B2/B8 realizó **una generación real el 2026-11-04** sobre la vista Salón, estilo Premium inmobiliario, suelo porcelánico gran formato, paredes estuco arena. La petición acabó en imagen y fue exportada; dimensiones del archivo de entrega verificado: 1600×1000 px. Se observó banda descriptiva truncada.
- El flujo utiliza un endpoint de imagen `POST /v1/images/edits` con `n=1`, tamaño de solicitud `1536x1024`, salida render de base64, prompt de preservación de geometría; la UI prepara un JPEG con calidad 0.9 a partir de la vista de Rubik.
- La implementación de prueba con Sunburst y token Preview aislado pasó **6/6 tests** en [CI](https://github.com/Juanmaes83/floorplan-3d/actions/runs/41927791516).
- Se había añadido un crédito inicial API de **10 USD** y se desactivó la recarga automática, por indicación del propietario; esto no determina el saldo actual.

**No conocido:** consumo exacto de tokens de esa generación; coste facturado atribuible a esa petición, tiempo transcurrido preciso, modelo efectivo de esa respuesta (el valor existe en la respuesta interna pero no figura en las capturas), calidad efectiva cuando el parámetro se omite, coste marginal del servidor, inversión humana por foto o tasa de rechazo a escala. **No calcular un «coste real» a partir de la belleza del PNG.**

### Procedimiento para atribuir la prueba histórica
1. Consultar [OpenAI Platform Usage](https://platform.openai.com/usage) del proyecto FLOOR PLAN 3D CARACOLA en la ventana de tiempo concreta de la generación; buscar imagen/edit y modelo, sin compartir claves.
2. Si hubo **exactamente una petición facturable** en ese intervalo, anotar importe y fecha como `OBSERVADO_EN_PLATAFORMA / CONFIANZA_MEDIA`. Si hubo otras peticiones, no atribuirlo de manera unilateral.
3. Conciliar con saldos/Usage acumulado y, si es posible, request ID de proveedor; la llamada antigua no persistía correlación, así que puede permanecer `NO_ATRIBUIBLE`.
4. Registrar si la cifra es coste neto API o incluye impuestos y moneda. Nunca recuperar imágenes privadas para calcular precio.

## 2. Tarifas vigentes consultadas (2026-11-05), ESTÁNDAR, USD/1 millón de tokens

| Modelo | Imagen entrada | Texto entrada | Imagen salida |
| --- | ---: | ---: | ---: |
| GPT Image 2.5 Sunburst | 8,00 USD | 5,00 USD | 30,00 USD |
| GPT Image 2.5 Flare | 8,00 USD | 5,00 USD | 30,00 USD |

Fuente canónica: https://developers.openai.com/api/docs/pricing ; explicaciones: https://developers.openai.com/api/docs/guides/image-generation y referencia `/images/edits`: https://developers.openai.com/api/reference/resources/images/methods/edit .

**Atención:** mismas tarifas por token **NO** significan mismo coste por render: los tokens varían con modelo, calidad, dimensiones, complejidad y número de imágenes de referencia. El endpoint Images `/v1/images/edits` no obtiene el descuento de caché atribuido al image-generation tool de Responses. La tarifa «Batch» de OpenAI es otro procesamiento contractual y **no equivale** a elegir `n=3` o a enviar un lote en la UI. Verificar tarifas cuando se comercialice, tasas aplicables y fecha.

### Fórmula técnica estándar

Si la respuesta permite separar `usage.input_tokens_details.image_tokens`, `text_tokens`, y `usage.output_tokens_details.image_tokens` o `usage.output_tokens` cuando sea totalmente imagen, entonces:

```text
coste_api_estimado_usd =
    (tokens_imagen_entrada * 8 / 1_000_000)
  + (tokens_texto_entrada * 5 / 1_000_000)
  + (tokens_imagen_salida  * 30 / 1_000_000)
```

No sumar `usage.input_tokens` además de sus desgloses (duplicaría entrada). Si faltan desglose, tomar coste observado en Usage como autoridad o marcar `ESTIMACIÓN INCOMPLETA`; no asumir `input_tokens` son todos imagen. En salidas con otras modalidades o herramienta de Responses, modelar esos costes explícitamente. El cálculo de respuesta debe revisarse contra factura/Usage para resolver ajustes, redondeos, residencia y otros conceptos.

### Ejemplo didáctico — NO ES PRECIO REAL RUBIK

**Suposición artificial** por render: 3.000 tokens imagen entrada, 120 texto entrada y 6.000 imagen salida.

| Concepto ilustrativo | Operación | USD |
| --- | --- | ---: |
| Entrada imagen | 3.000×8/1M | 0,0240 |
| Entrada texto | 120×5/1M | 0,0006 |
| Salida imagen | 6.000×30/1M | 0,1800 |
| **Total hipotético por imagen** | suma | **0,2046** |

| Lote hipotético de imágenes independientes | Solo API USD (idéntico consumo supuesto) |
| ---: | ---: |
| 1 | 0,2046 |
| 3 | 0,6138 |
| 5 | 1,0230 |
| 10 | 2,0460 |
| 20 | 4,0920 |
| 50 | 10,2300 |

No confundir estas cantidades con una factura real. **Sin conocer tokens de salida según calidad, ni siquiera el orden de magnitud del escenario tiene por qué representar el `max` real.** Los 10 USD de crédito de prueba no son un compromiso de 50 renders.

## 3. Coste por imagen entregable, no solo por intento

`coste_variable_total` = API de TODOS los intentos + otros proveedores + almacenamiento + transporte/funciones atribuibles.

`coste_unitario_generado` = coste_variable_total / nº imágenes generadas.

`coste_unitario_aceptado` = coste_variable_total / nº imágenes aceptadas para entregar.

**Ejemplo hipotético**: 10 intentos a 0,2046 USD, 8 aceptados → coste API por aceptada = 2,046 / 8 = **0,25575 USD**, antes de revisión, Vercel y demás. Si el cliente exige cambios y acepta 5, coste por aceptada = 0,4092 USD. **Importa la tasa de aceptación**.

`coste_completo_por_entregable` = coste_API_efectivo + coste_funciones + coste_almacenamiento_transferencia + tiempo_profesional × coste_hora + cuota_soporte_licencia_prorrateada + costes_transacción + contingencia.

`precio_neto_objetivo` = coste_completo / (1 − margen_bruto_objetivo), con margen entre 0 y 1.

**Ejemplo académico**: coste completo 0,60 USD, margen objetivo 70% → precio neto 2,00 USD. No es recomendación comercial. Añadir impuestos, cobro en EUR/cambio FX, descuentos, comisiones y marketing después; definir alcance de soporte y número de revisiones incluidos.

## 4. Matriz obligatoria de ensayos unitarios y de lote

Cada prueba deberá llevar `record_id`, `consent`, `model`, `quality`, `size`, `referencias`, `n`, `usage`, `billed_usd`, `latency_ms`, `approved` y `defects`.

| SKU interno de prueba | Entrada y salida | Qué coste medir | GATE |
| --- | --- | --- | --- |
| R-01 B2 fiel | 1 vista, sin cambios, 1 salida | coste y fidelidad baseline | 1 aceptada y defectos críticos 0 |
| R-02 B8 acabado | 1 vista, suelo o pared, 1 salida | delta vs R-01 | acabado correcto, geometría intacta visualmente |
| R-03 B8 combinado | 1 vista, suelo + pared, 1 salida | sobrecoste de prompt/material | no alterar muebles/huecos |
| R-04 calidad | mismo input en `low`, `high`, `max` por separado | curva coste/calidad/tiempo | calidad vs coste comprobada |
| R-05 variantes | 1 vista, 3 alternativas | coste total y coste/aceptada | variantes revisables, gasto previsto |
| R-06 cinco vistas | 5 estancias secuenciales, 1 render cada una | total lote / factura | detener en límite; consistencia de materiales |
| R-07 ref. estética | 1 vista + 1–2 fotos de referencia de estilo | incremento tokens de imagen entrada y aceptación | permiso de uso de imagen |
| R-08 escena genérica | 1 vista + 1–3 personas generadas | coste, fallos de anatomía y desplazamiento | lectura espacial preservada |
| R-09 cliente integrado | 1 vista + 1 foto de persona consentida | coste adicional de imagen y QA privado | consentimiento, seguridad, borrado |
| R-10 familia integrada | 1 vista + 2–3 referencias consentidas | escalado por número de referencias | sin identidad inventada, no menores sin autorización |
| R-11 narrativa | 3–5 escenas del mismo hogar, mismas referencias | coste total y coherencia multiimagen | consistencia/uso/ética |
| R-12 asistente lectura | 1 consulta + N herramientas read-only | tokens LLM + backend | sin mutación, respuesta factual |
| R-13 asistente propuesta | consulta + validación de cambio sin aplicarlo | coste LLM/herramienta, tiempo | diff, revisión y cancelación |
| R-14 asistente + imagen | un pedido de render desde chat | sumar LLM + Image API y reintentos | consentimiento + gasto preaprobado |

### Combinatoria mínima sin derrochar
No probar cada textura × cada estancia × cada calidad × cada escena. Usar **matriz por pares** con 2–3 fixtures representativos, tras prototipo unitario. Primero medir los extremos de calidad y la fidelidad, luego seleccionar un único perfil económico para usuarios. No pasar automáticamente a 10 o 50 renders.

### Hipótesis de coste al añadir referencias privadas
- Una imagen original + una referencia adicional puede consumir **más tokens de imagen de entrada** y aumentar tiempo; varias fotografías pueden incrementar riesgo de inconsistencia y retrabajo.
- El número exacto de tokens por imagen depende de tratamiento del proveedor; no extrapolar linealmente «3 fotos = coste ×3» sin datos.
- Las ediciones con personas pueden requerir más intentos por coherencia/consentimiento y más revisión humana; contabilizar **coste por imagen aceptada**, no por prompt.
- Presupuesto de almacenamiento/expiración y soporte de borrado, si se habilitan fotos privadas. Piloto ideal sin almacenamiento persistente.
- Medir el riesgo de generar/compartir una composición engañosa y el coste de corrección, no solo GPU.

## 5. Medición técnica a implementar ANTES del siguiente ensayo

### 5.1 Servidor `api/render.js`
- Asignar `renderOperationId` aleatorio no sensible, no reutilizar el token de acceso como ID.
- Validar acceso, consentimiento, n, calidad, tamaño y lista blanca de operaciones; facturar solo después de preflight.
- Capturar fecha, versión de receta, `model` efectivo, `quality`, dimensiones, número y hash no reversible de imágenes de entrada (evitar huellas de personas si innecesarias), `usage.input_tokens_details`, `usage.output_tokens`, latencia, código de error, petición parcial si se factura.
- Estimar coste usando **tabla de tarifas versionada**, devolver al navegador total estimado y desglose seguro, conciliando con Usage. No almacenar imágenes ni secretos en log.
- Evitar devolver cabeceras internas, errores de OpenAI con datos privados o prompts sin filtrar.
- Si `usage` no está presente, registrar `usage_missing` y reconciliar el gasto; no inventar tokens.

### 5.2 Interfaz `js/ai-render-ui.js`
- Mostrar **estimación previa** con intervalo, etiqueta «estimación no factura» y advertencia sobre reintentos/calidad.
- Cada acción tiene confirmación consciente y contador de renders restantes permitido; sin reintentos automáticos ocultos.
- Al acabar, mostrar modelo/calidad, duración, coste aproximado si hay uso, identificador, etiqueta IA y botón comparación.
- Historial de sesión y ficha de exportación con operación referenciada, sin revelar token ni grabar material de cliente.
- Futuro lote: cola secuencial, tope de coste y cancelación de pendientes. Abort no implica devolución de un trabajo ya facturado.

### 5.3 Conciliación financiera
- Fuente A: `usage` por respuesta (si está disponible); fuente B: Usage OpenAI por proyecto y fecha; fuente C: logs sanitizados Vercel; fuente D: tiempo de trabajo y almacenamiento.
- Marcar `ESTIMADO / OBSERVADO / CONCILIADO / NO ATRIBUIBLE`. Solo `CONCILIADO` sirve para precios y previsión de margen.
- Agrupar día, entorno, modelo, calidad, SKU, proyecto profesional y cliente sin nombres en la telemetría; generar costes en USD y convertir a EUR con tipo de cambio de la fecha usado, anotado.
- Conservar factura y registro agregado conforme al marco legal/contable; datos visuales privados por separado con retención mínima.

## 6. Plan de precios posterior, sujeto a datos

Separar:
1. **Render visual sencillo:** una vista, estilo y acabado, 1 salida.
2. **Render profesional:** calidad definida + hasta X revisiones, etiqueta de entrega.
3. **Pack 5 vistas:** coste real medido y cohorte de aceptación.
4. **Materiales/alternativas:** precios por número de opciones y calidad (no prometer ilimitado).
5. **Escena habitada genérica:** mayor esfuerzo de QA.
6. **Escena personalizada con referencias del cliente:** cargo específico por gestión consentida, privacidad, identidad, revisiones y eliminación; no sólo más tokens.
7. **Servicio estudio/asistente:** tarifa por valor de diseño humano o cuota, con coste de tokens de consulta aparte y límites claros.

**Qué falta antes de poner un solo precio público:** 20–30 operaciones controladas representativas *si el presupuesto lo permite*, tasas de fallos y aceptación, curva `quality`/consumo, costes Vercel y tiempo profesional, política fiscal/FX y margen objetivo decidido por propietario. No se justifica gastar ese volumen ahora con 10 USD de crédito.

## 7. Plantilla de registro económico (sin secretos)

**Campos mínimos:** `operation_id, date_utc, environment, category, scenario, view_id, model, quality, size, reference_count, output_count, image_input_tokens, text_input_tokens, image_output_tokens, observed_billed_usd, estimate_usd, latency_ms, status, accepted_count, retry_count, provenance, comments`.

La hoja Excel entregada junto a este plan sirve para registrar esta matriz, sumar costes por lote y simular márgenes. **Dejar celdas reales vacías hasta disponer de evidencia**, no introducir un importe de fantasía para la prueba del 04/11.

## 8. Referencias del proveedor y estado documental

- Precios: https://developers.openai.com/api/docs/pricing
- Imagen, calidad, caché y costes: https://developers.openai.com/api/docs/guides/image-generation
- Respuesta `usage` de edición: https://developers.openai.com/api/reference/resources/images/methods/edit
- Buenas prácticas prompts/consistencia: https://developers.openai.com/api/docs/guides/image-prompting

**Conclusión económica:** el render real de RUBIK funciona. Su coste real **aún no está medido individualmente**; el plan deja el instrumento y la fórmula para medirlo antes de comercializar. Ninguna cifra ilustrativa de este documento debe convertirse en tarifa sin conciliación.
