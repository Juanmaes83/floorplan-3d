# RUBIK SOTA — Ampliación comercial IA: FOTO→REFORMA, panorámicas 360°, vídeo y paquetes premium
**Versión 1.0 · 2026-11-05 · Estado: PROPUESTA A REVISAR · DOCUMENTACIÓN EXCLUSIVAMENTE · SIN MERGE/DEPLOY.**
**Complementa:** [Plan maestro IA](ia-imagenes-asistente-plan-maestro-2026-11-05.md) y [Modelo económico](ia-costes-protocolo-unitario-lotes-2026-11-05.md).
**Propuesta del propietario:** priorizar valor comercial de imágenes reales, reforma visual mediante foto del cliente, escenas habitadas, panoramas, vídeo y precios premium basados en utilidad; reevaluar la urgencia de mejoras visuales geométricas en paralelo con Kimi sin interrumpir ni desautorizar trabajo pendiente.

## Complemento CAT-IA — Reformas con catálogo real del profesional (05/11/2026)

A **FOT-01** se incorpora como línea prioritaria complementaria [CAT-IA — Catálogos comerciales y personalización visual por fabricante](cat-ia-catalogos-comerciales-personalizacion-fabricante-2026-11-05.md): subir una foto autorizada de la cocina/salón/baño del cliente, seleccionar referencias reales de muebles, electrodomésticos y revestimientos del profesional, generar 1–3 propuestas con coste previo, verificar productos y preparar fichas comerciales de entrega. Evoluciona en tres cortes: **(1) referencias visuales**, **(2) catálogo con SKU, ficha y medidas verificadas**, **(3) modelos 3D validados y presupuestos canónicos**. No confundir imagen generativa con colocación métrica/stock/precio/compatibilidad.

## 1. Cambio estratégico

RUBIK no debe limitarse a `plano → 3D → render`. Debe admitir **dos puertas comerciales de entrada** a una misma experiencia profesional y de entrega:

```
A. Proyecto RUBIK (plano/proyecto existente)
   → elegir vista real → render/reforma/acabados → ficha de imagen
   → variantes / escena habitada / 360 / vídeo → entrega cliente

B. Fotografía de estancia real enviada por cliente
   → permiso y privacidad → análisis visual / anotaciones
   → reforma fotográfica (mantener estructura o proponer alternativas)
   → antes/después + fichas de materiales + presupuesto opcional
   → 360 conceptual / vídeo → propuesta comercial
   ↘ reconstrucción métrica 2D/3D: SOLO subproyecto posterior con medidas y QA
```

No se permite que la ruta B construya ficticiamente un `FloorPlanProjectV1` exacto a partir de una foto. La reforma fotográfica es una **simulación visual**, y un presupuesto necesita mediciones confirmadas, nunca dimensiones inventadas.

## 2. SERVICIO FOT-01 — «Reforma sobre tu foto» (prioridad comercial P1)

**Quién usa:** profesionales de reforma/interiorismo/cocinas/baños, inmobiliarias para virtual staging, promotoras en comercialización, cliente final asistido por profesional.

**Qué:** subir 1–3 fotografías del interior existente con autorización; el profesional elige qué conservar (estructura, ventanas, puertas, sanitarios, mobiliario), qué cambiar (suelo, paredes, pintura, iluminación, cocina, mobiliario, decoración), estilo, nivel de libertad. Generar **antes/después** desde el mismo encuadre con aviso orientativo.

**Dónde implementar:** nueva subpestaña **`Entregar → Estudio de imágenes → Reformar desde foto`**, sin segunda Home ni editor paralelo; acceso rápido opcional en Home como ruta de producto secundaria **sin perder las tres entradas actuales**. Backend: reutilizar la capa de edición de imágenes existente, sin confundirla con `FloorPlanProjectViews`. `Mi estudio → Biblioteca visual` para materiales/moodboard con licencia. Fichas de resultado en Entregas, coordinadas con PR #166.

**UX recomendada:**
1. Cargar foto, recortar, retirar EXIF/metadatos, confirmar permiso de uso y almacenamiento.
2. Identificar superficies **como candidatos revisables**; usuario confirma máscara o región (suelo/pared/armario/cocina).
3. Selector `Mantener` vs `Cambiar`, receta de estilo, intensidad Fiel/Equilibrado/Creativo, materiales e iluminación.
4. Selector simple de alcance: retoque cosmético / renovación de acabados / nueva decoración / reforma conceptual de distribución. **El último debe rotularse «conceptual, sin garantía constructiva».**
5. Vista original ↔ opción A ↔ opción B y notas de cambios. Generación 1 o pack 3, presupuesto visible antes de ejecutar.
6. Ficha descargable (imagen, modificaciones solicitadas, límites, versión, consentimiento, coste) y opción de exportar al paquete de cliente.
7. El profesional decide si el cliente puede solicitar más variantes, con límites de créditos o aprobación.

**Aceptación:** precisión suficiente de huecos y contornos en modo Fiel, no «reparar» arbitrariamente geometría; no mostrar una reforma de ingeniería como viable; trazabilidad de foto fuente y derechos; edición/descarga funciona en móvil; coste por referencia y nº reintentos medido.

**Subservicios que aportan valor:** sustituir suelo por foto comercial autorizada del fabricante; comparar dos cocinas reales en mismo espacio; renovar baño sin obra aparente; home staging de inmueble vacío; iluminación diurna/nocturna; incluir mobiliario aportado como foto de catálogo (escala orientativa); modo `preservar fachada` para edificios; eliminar elementos decorativos no estructurales con advertencia. Evitar borrar instalaciones/elementos estructurales de forma engañosa.

## 3. SERVICIO FOT-02 — «Foto a espacio editable»: ingeniería inversa real (P3, NO confundir con FOT-01)

**Qué puede hacerse pronto:** extraer hipótesis visuales: clasificación de superficies, indicios de perspectiva, tipo de estancia, objetos, posiciones aproximadas, referencias útiles para reconstrucción y preguntas al usuario.

**Qué NO puede afirmarse con una foto:** longitudes y alturas métricas exactas, espesor de muros, instalaciones ocultas, estructuralidad, huecos fuera de plano o habitaciones no visibles.

**Dónde:** `Diseñar → Importar → A partir de fotografías` como piloto aislado *después* de FOT-01. Salida = borrador de geometría **no aprobado**; el usuario aporta medidas de referencia, plano adicional o varias vistas y revisa escala/puertas/ventanas antes de crear proyecto; utilizar validador canónico y sin alterar fuente.

**QA:** medir error de dimensiones frente a proyecto ground truth; «dato desconocido» en lo oculto; no generador inventado a partir de imágenes. Diferenciar comercialmente **«reformar foto»** de **«crear plano editable con mediciones»**.

## 4. SERVICIO PAN-01 / PAN-02 — Imágenes 360° y visita panorámica

**Terminología estricta:**
- **PAN-01: panorama conceptual de ambiente (P2)**: una imagen amplia o equirectangular (ideal 2:1) generada a partir de referencias. Puede verse en un visor que gira; sectores invisibles en la foto original son **inferidos por IA**. Es aspiracional, NO captura fiel de toda la habitación.
- **PAN-02: 360° arquitectónicamente consistente (P3)**: partir del **modelo 3D real existente**; capturar seis caras de cubemap o panorama equirectangular desde punto/cámara verificables; realizar enriquecimiento visual de todas las caras con **continuidad entre costuras y geometría**. Si una transformación IA no conserva consistencia, entregar el panorama 3D estándar o una colección de vistas, no prometer recorrido exacto.
- **Recorrido 3D interactivo** de PR #166 / FT3D es **otro producto**: navegación desde modelo, no «360 generado por IA». Mantenerlo y coordinar entregas.

**Dónde:** `Entregar → Experiencias inmersivas` futuro, con acción `Vista panorámica` en Galería/Presentación y lector 360 con controles móvil/giroscopio opcional. Mantener accesibilidad, degradación a imagen plana, sin WebGL obligatorio en Home.

**Dependencia del proveedor:** GPT Image 2.5 permite dimensiones personalizadas dentro de límites; poder pedir aspecto 2:1 **no implica** proyección equirectangular geométricamente correcta. Probar fisuras en unión izquierda/derecha, líneas verticales, puertas, mobiliario, sombras y suelo/techo en pólos. Con 360 verificación requiere mapa de referencia o 3D.

**Prueba del producto:** escena con 4–6 objetos fiduciales y abertura conocida; error de costura; consistencia visual y métrica frente al proyecto; navegación y fallback; rechazo humano si no es creíble.

**Nota de alcance:** el roadmap histórico difería «360 dedicado». Esta propuesta **reabre su estudio** porque existe una nueva justificación comercial, pero NO revoca la decisión anterior hasta aprobación explícita. Primero piloto conceptual económico, después decisión sobre PAN-02.

## 5. SERVICIO VID-01 / VID-02 — Movimiento y vídeo desde imágenes (P2→P3)

- **VID-01: animación de imágenes autorizadas (P2)**: zoom/pan suave, secuencias antes/después, voz/textos opcionales, montaje descargable con créditos/licencias; puede ser determinista (sin nuevo vídeo generativo). Reutilizar `Entregar → Vídeo/Presentación` y B3, no sustituir Story. Coste variable principalmente procesamiento, almacenamiento y tiempo humano.
- **VID-02: foto/render IA → vídeo generativo corto (P3)**: imagen fuente con prompt de movimiento de cámara/ambiente → `/v1/videos` modelo compatible, revisión de coherencia. La referencia puede anclar el primer fotograma, no garantiza que la geometría permanezca igual durante todo el vídeo. Mostrar etiqueta `vídeo ilustrativo IA`; no hacer afirmaciones métricas.
- **Con personas del cliente:** piloto aparte con consentimiento **específico de animación**, mayor riesgo de suplantación, privacidad y restricciones de imagen de personas. Las herramientas/modelos de vídeo pueden imponer limitaciones adicionales: no anunciar hasta verificar condiciones y política del proveedor.
- **Dónde:** `Entregar → Vídeos`, conectado a la ficha de imagen; «Animar esta imagen» en cada resultado aprobado. B3 mantiene vídeo del recorrido real.
- **Coste de referencia vídeo (OpenAI, estándar 2026-11-05):** `sora-2` 720p = **0,10 USD/s**, `sora-2-pro` 720p = **0,30 USD/s**, 1024p = **0,50 USD/s**, 1080p = **0,70 USD/s**. Ejemplos **solo consumo base de vídeo**, 8 s = 0,80 / 2,40 / 4,00 / 5,60 USD respectivamente, sin imagen anterior, reintentos, infraestructura ni personal. Revalidar precio y disponibilidad en el proyecto antes de integración.
  Fuente: https://developers.openai.com/api/docs/pricing . Referencia de imagen a vídeo: https://developers.openai.com/cookbook/examples/sora/sora2_prompting_guide .

## 6. Estrategia económica: elevar precio por VALOR, NO inflar gasto del proveedor

**Distinciones obligatorias:**
- El **coste unitario OpenAI** es lo que pagamos al proveedor; buscamos medirlo y controlarlo, no incrementarlo artificialmente.
- El **coste completo** incorpora todos los intentos, rechazos, materiales de referencia, edición, almacenamiento y revisión del profesional.
- El **precio de venta** puede y debe reflejar el valor al cliente: experiencia, rapidez, posibilidades de aprobación, control de estilos, ficha, revisiones y presentación. Se decide después de cuantificar el coste y comprobar disposición a pagar.
- Evitar prometer «margen alto» automáticamente: una llamada barata puede requerir 15–30 minutos de trabajo profesional; personas y vídeo elevan coste/revisión y responsabilidad.

**Hipótesis para validar, NO tarifas aprobadas ni precios de mercado:**
| Oferta | Entregable claro | Experimento de precio neto EUR (orientativo) | Puerta económica |
| --- | --- | ---: | --- |
| Reformar una foto | antes/después, 1 propuesta, 1 revisión | 19–49 € | coste total/aceptación |
| Render profesional 3D→IA | 1 estancia, estilo, acabados, ficha | 25–59 € | calidad aprobada |
| Pack comercial 5 vistas | paleta coherente, 5 imágenes + exportación | 99–249 € | coherencia y QA en lote |
| Reforma visual con 3 alternativas | 3 propuestas y comparador | 59–149 € | 3 intentos y tiempo revisión |
| Escena habitada genérica | 1 imagen contextual con personas generadas | 39–89 € | tasa de aceptación |
| Personalización con fotos reales | imagen consentida + control/retirada | desde 79 € (precio por acordar) | privacidad y gestión documental |
| Panorama conceptual 360° | 1 panorama orientativo en visor | 69–199 € | seam QA y honestidad |
| Vídeo corto de imagen | 4–8 s generativos + revisión | 59–199 € | segundos × calidad, rechazo |
| Tour 360 consistente del modelo | navegación a partir de 3D real | **sin precio hasta validar** | alto coste QA |
Las cifras anteriores son **hipótesis internas para tests de mercado**, no ofertas publicables. IVA/impuestos, moneda, descuentos, soporte y alcance de revisiones deben ser explícitos.

**Fórmulas:**
`coste_por_aceptada = (API total de intentos + coste técnico + coste profesional) / nº aceptadas`;
`precio_minimo_neto = coste_completo / (1 − margen_bruto_objetivo)`.
Margen bruto y *markup* no son sinónimos. El precio requiere valor percibido + disposición a pagar, no solo aplicar un multiplicador.

**Coste de packs:** contabilizar coste unitario de cada familia + total esperado + reintentos + tiempo de QA; cobrar el valor de una propuesta coherente, no vender sin límite ni ocultar consumo.

## 7. Prioridad frente a Kimi, Claude y programa visual

**Propuesta de reordenación, sujeta a aprobación del propietario:**
1. **Primero** cerrar problemas B2/B8 medibles: uso/coste real, exportación truncada, calidad explícita, cuota y autorización. FOT-01 (foto→reforma visual) puede aprovechar el endpoint actual con ruta y consentimiento propios. Es la nueva oportunidad comercial inmediata.
2. **En paralelo** permitir a Kimi completar su alcance actual y entregar evidencia; **NO cancelar unilateralmente** ni descartar mejoras arquitectónicas. Priorizar defectos geométricos/visuales necesarios para fidelidad de imágenes (huecos, marcos, iluminación, cámaras) frente a cambios estéticos difíciles de percibir.
3. Claude PR #166 sigue siendo candidata a presentación/recorrido real y un contenedor de las futuras fichas. No implementar un panel Entregas paralelo ni hacer merge hasta aprobación explícita.
4. **Después** ampliar variantes, materiales, personas genéricas, biblioteca visual, consentimiento de fotos reales.
5. **Exploración pagada acotada** del panorama conceptual, vídeo generativo y reconstrucción fotométrica, con decisión de continuar basada en calidad/coste/fidelidad, no por entusiasmo.
6. Asistente IA: facilitar pedir estos servicios con autorización y coste anticipado, sin crear segundo editor o plataforma.

**Qué no eliminar:** fidelidad de huecos, cámaras y geometría. La mejora comercial por IA depende de una referencia correcta. Una imagen falsa o contradictoria con el plano puede perjudicar más que una visualización menos fotorrealista.

## 8. Tabla de decisiones / gates
| Gate | Decisión | Evidencia para aceptar |
| --- | --- | --- |
| G1 | medir B2/B8 | token `usage` por petición + coste conciliado + 5 vistas |
| G2 | lanzar FOT-01 | pruebas fotos consentidas, máscaras/estructura, antes/después, calidad y coste |
| G3 | ofrecer pack premium | coste/aceptada, revisiones reales, precio de test, margen neto y consentimiento |
| G4 | PAN-01 | panorama válido en visor, costuras, etiqueta conceptual, estimación por render |
| G5 | PAN-02 | modelo 3D real + consistencia cubemap y navegación |
| G6 | VID-01 | vídeo no generativo y licencia media, descarga/compartición |
| G7 | VID-02 | coste por segundo real, revisión de coherencia, derechos, políticas proveedor |
| G8 | foto→plano | precisión métrica con medidas de control y revisión de ingeniería |
| G9 | cliente/familia personalizada | consentimiento verificable y revocable, privacidad/retención/borrado, sin engaño |
| G10 | integración visual | Claude/Kimi completados + QA combinada + OK propietario, sin merge adelantado |

## 9. Referencias operativas
- https://developers.openai.com/api/docs/guides/image-generation
- https://developers.openai.com/api/reference/resources/images/methods/edit
- https://developers.openai.com/api/docs/pricing
- https://developers.openai.com/cookbook/examples/sora/sora2_prompting_guide
- Código base: `api/render.js`, `js/ai-render-ui.js`, `js/professional-workspace-ui.js`.
- D-08/D-09: `docs/product/professional-client-experience-2026-10-21.md`.
- PR #166, #161: abiertas, sin autorización de merge.

**Última regla:** este anexo reordena el estudio; no acredita que PAN-01, PAN-02, VID-02 o reconstrucción métrica estén desarrollados. Tampoco constituye permiso para gastar saldo.
