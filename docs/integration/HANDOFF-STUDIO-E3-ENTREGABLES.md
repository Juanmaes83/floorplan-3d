# Studio E3 · Entregables profesionales

Candidata independiente sobre `cf0b50128603c6064ce45837e749772ab32df23e`, el merge real de R03 #297. Fuente y evidencia de procedencia en [handoff del laboratorio](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab/blob/083b8d764942b604caf96cf5bb11f2b96d5d8d76/COMPONENTES/STUDIO-E3-entregas/HANDOFF.md), árbol `b4624b01c4c905869b3ddee14470cf8da1108781`. Este corte corresponde a Entregables profesionales.

## Alcance y acceso

1. En **Entregar** o **Mi estudio**, abrir **Entregables profesionales → Preparar entregables**.
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

El catálogo ofrece diez accesos. La prueba de vistas acredita la generación completa de cinco vistas con sus dos descargas, y las pruebas de delegación acreditan aperturas concretas. Ninguna prueba envía imágenes a IA, publica enlaces, ni inicia una grabación.

## Identidad, seguridad y conservación

- La identidad se lee mediante `FloorPlanBrandUI.snapshot()`. Las imágenes firmadas de vistas conservan la regla de `FloorPlanProjectViews.image()` y `FloorPlanDeliveryImage`: nombre y logotipo, con el contacto vacío. No se añade una autoridad de marca ni un almacén. El flujo de demostración de Blender comprueba fugas de persona, teléfono, correo y web.
- Las vistas existentes quedan obsoletas al cambiar el idioma y pueden volver a prepararse antes de firmar. Así no se reutilizan rótulos capturados en ZH en una entrega ES/EN. Se conserva la revisión de proyecto y el selector de planta de la autoridad existente.
- Usa el espacio de trabajo y botones Perla ya existentes. El diálogo anuncia resultados, conserva foco y teclado y presenta estados cuando el generador falla. La guarda de chino visible recorre las dos entradas y los tres pasos. El activo público de ejemplo es una copia byte a byte del render de OP-10 ya acreditado.
- R03, R02-A, HERO y STUDIO A/B/C conservan sus cortes. E3 no escribe el estado de R03 ni modifica los datos de proyecto, persistencia o firma. El código de QA del laboratorio y la herramienta offline de Blender quedan fuera del frontend.

## Cierre del corte

Validar la candidata con los casos E3-01–E3-07 del laboratorio y las regresiones dirigidas de delegación, idioma y R03 sobre el mismo árbol. Los gates de fusión son CI completa, revisión visual en la Preview exacta y autorización del propietario por SHA y árbol, incluido el efecto automático de Production que corresponda. El prototipo de firma de Blender se mantiene separado de OP-10.
