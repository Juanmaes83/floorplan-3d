# Studio E3 · Entregables profesionales

[Candidata independiente #299](https://github.com/Juanmaes83/floorplan-3d/pull/299) sobre `1bc501d64ab091a8fac25669bf8843f8f5076a3d`, el merge real de R02-A #298 que conserva R03. Fuente y evidencia de procedencia en [handoff del laboratorio](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab/blob/083b8d764942b604caf96cf5bb11f2b96d5d8d76/COMPONENTES/STUDIO-E3-entregas/HANDOFF.md), árbol `b4624b01c4c905869b3ddee14470cf8da1108781`. Este corte corresponde a Entregables profesionales.

## Alcance y acceso

1. En **Entregar → Documentación** o **Mi estudio**, abrir **Entregables profesionales → Preparar entregables**. La tarjeta usa la acción secundaria de Perla. Sigue a las acciones existentes, que mantienen su orden y peso visual. El botón anuncia el diálogo y recupera el foco al cerrarlo.
2. **Elegir** permite seleccionar entre diez fichas agrupadas. Se explica la alternativa cuando el generador no está disponible en la versión o en el navegador.
3. **Previsualizar** diferencia los originales y la firma en vistas preparadas. Para Blender muestra un render Cycles sintético, con su copia firmada como ejemplo del prototipo posterior al render.
4. **Preparar** permite generar y descargar las vistas de proyecto con los controles existentes. En las otras fichas delega en los generadores de RUBIK. La ficha de vídeo lleva a Presentación, donde comienza la grabación local. Render IA usa una vista preparada del proyecto y conserva el consentimiento y token de su diálogo.

| Opción | Consumidor y alcance |
| --- | --- |
| Vistas reales | `FloorPlanProjectViews`. Descarga de bytes originales o imagen firmada de RUBIK. |
| Render IA | `FloorPlanAIRender.open(view)`. La consulta abre el generador existente. |
| Escena para Blender | `RubikSceneExport.open`. La escena y el GLB son técnicos y limpios. |
| Lámina, superficies y dossier | `FloorPlanSheet`, `FloorPlanSurfaceSheet`, `FloorPlanDossier`. Cada generador conserva sus opciones y requisitos. |
| Vídeo y presentación | `FloorPlanPresentation`, `FloorPlanTourRecorder` y `FloorPlanTourVideo`. La disponibilidad de vídeo depende del grabador del navegador. |
| Archivo y enlace del cliente | `FloorPlanClientShare` y `FloorPlanShareLink`. Se mantienen las reglas de descarga, consentimiento y publicación del generador. |

El catálogo ofrece diez accesos. La prueba de vistas acredita la generación completa de cinco vistas con sus dos descargas, y las pruebas de delegación acreditan aperturas concretas. Las pruebas de delegación acreditan los permisos sin enviar imágenes a IA ni publicar enlaces. La miniatura de vídeo se obtuvo de una grabación local con la vivienda de ejemplo.

## Identidad, seguridad y conservación

- La identidad se lee mediante `FloorPlanBrandUI.snapshot()`. Las imágenes firmadas de vistas conservan la regla de `FloorPlanProjectViews.image()` y `FloorPlanDeliveryImage`: nombre y logotipo, con el contacto vacío. No se añade una autoridad de marca ni un almacén. El flujo de demostración de Blender comprueba fugas de persona, teléfono, correo y web.
- Las vistas existentes quedan obsoletas al cambiar el idioma y pueden volver a prepararse antes de firmar. Así no se reutilizan rótulos capturados en ZH en una entrega ES/EN. Se conserva la revisión de proyecto y el selector de planta de la autoridad existente.
- Usa el espacio de trabajo y botones Perla ya existentes. El diálogo anuncia resultados, conserva foco y teclado y presenta estados cuando el generador falla. La guarda de chino visible recorre las dos entradas y los tres pasos. El activo público de ejemplo es una copia byte a byte del render de OP-10 ya acreditado.
- R03, R02-A, HERO y STUDIO A/B/C conservan sus cortes. E3 no escribe el estado de R03 ni modifica los datos de proyecto, persistencia o firma. El código de QA del laboratorio y la herramienta offline de Blender quedan fuera del frontend.

## Correcciones tras la CI de reconciliación

- La tarjeta inicial se anteponía a las existentes, mostraba dos imágenes y añadía una acción primaria a Entregar. Ahora forma parte de Documentación y aparece después de la lámina y la ficha de superficies. En Mi estudio sigue a las acciones de identidad y configuración. Las imágenes de muestra están dentro del recorrido.
- R02-A podía reconstruir su panel antes de recibir el evento asíncrono `toggle`. El resumen actualiza la apertura en la misma interacción y los eventos de nodos reemplazados se ignoran. La prueba fuerza una reconstrucción en el mismo turno, comprueba el resultado visible, el cierre voluntario y la igualdad del proyecto. La evaluación, el guardado y las reglas de altura conservan sus contratos.
- El nuevo control E3 acredita el orden, la acción secundaria, los diez elementos y la devolución del foco con teclado desde las dos áreas. Se ejecutan las regresiones de R02-A ES/EN/ZH, R03, el espacio profesional, CAT-IA, vistas y los casos visuales de E3. Se conserva el inventario de accesos previo.

## Pulido visual y procedencia

Las diez miniaturas de `assets/e3/thumbs` se cargan al acercarse a la zona visible. La ficha de vistas toma una imagen del proyecto cuando el generador ya dispone de ella. El resto usa ejemplos, con el origen indicado en la tarjeta. Render IA muestra un dormitorio de ejemplo como vista de partida. El diálogo usa el fondo gris Perla, tarjetas blancas, selección grafito y la acción principal petróleo. El área que se desplaza contiene las opciones. El avance y el Asistente ocupan zonas propias debajo. La selección vacía indica qué hacer para continuar.

| Miniatura | Fuente del producto |
| --- | --- |
| Vistas reales | Primera imagen limpia de `FloorPlanProjectViews`, generada desde la vivienda de ejemplo. |
| Render IA | Detalle del dormitorio juvenil, una vista de proyecto que puede utilizarse como entrada. Captura en Chromium desde FloorPlanProjectViews, sin generar una imagen con IA. |
| Blender | Vista interior del salón. Render Cycles publicado en `docs/integration/op10-evidence/entrega-1600x1000-rom_living.jpg`. |
| Lámina, superficies y dossier | Lámina, tabla y vista previa del dossier de la vivienda de ejemplo, capturadas en sus generadores existentes. |
| Presentación y vídeo | Presentación activa de ejemplo y fotograma de la vista previa de un recorrido grabado localmente, con los controles de reproducción visibles. |
| Archivo para tu cliente | HTML de ejemplo descargado y abierto en Chromium. |
| Enlace para tu cliente | Diálogo de consentimiento con el campo de código vacío. |

Las capturas se obtuvieron con Chromium en la Preview de `eef09ae7f3635f01d7b65916823bb5fb3948f787` y la candidata local de E3, con datos de ejemplo. Las diez imágenes WebP de 360 × 225 suman 70.408 bytes. El navegador puede hacer la comparación y recorrer las fichas antes de preparar las imágenes del proyecto.

## Cierre del corte

Validar la candidata con los casos E3-01–E3-07 del laboratorio y las regresiones dirigidas de delegación, idioma y R03 sobre el mismo árbol. Los gates de fusión son CI completa, revisión visual en la Preview exacta y autorización del propietario por SHA y árbol, incluido el efecto automático de Production que corresponda. El prototipo de firma de Blender se mantiene separado de OP-10.
