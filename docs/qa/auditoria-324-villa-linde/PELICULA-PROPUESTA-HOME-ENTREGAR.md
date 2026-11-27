# Película del proyecto · ubicación en Home y Entregar

Propuesta de producto del 27/11/2026, pendiente de aprobación visual y de encargo de implementación. El objetivo es que un visitante entienda el montaje por piezas y que el profesional encuentre cómo preparar la película de su propia revisión.

## Punto de partida verificado

El handoff de rodaje fija **Película del proyecto** y documenta la exportación de escena como entrada. En la rama de rodaje existe el modo Blender y hay tres fotogramas publicados. La ruta de frontend para el nuevo formato y su comunicación en Home siguen pendientes. El Cinematográfico de P1 ya usa «Del plano a la vivienda» para su escena inicial. Mantener el nombre principal decidido y proponer **«Montaje por piezas»** para el primer guion público. [Handoff de rodaje](https://github.com/Juanmaes83/floorplan-3d/blob/90d38d54cd34ad5c0f4a498cefb864e155e9ba8a/docs/qa/pelicula-proyecto/README.md) · [Guion de P1](https://github.com/Juanmaes83/floorplan-3d/blob/dacb5d395abf32449102d73ffd03200e6c09c019/js/presentation-film.js).

## Home · mostrar el resultado

- **Ubicación:** Home → Descubre RUBIK en acción → Visualización profesional. Dentro de la ficha existente, dejar accesibles «Ver comparativa de render» y «Ver película de ejemplo». Aprovechar el patrón visual y el visor de muestras de `js/guide-ui.js` y `js/home-en-accion.js`.
- **Muestra:** un clip continuo aprobado sobre un proyecto real de RUBIK, con reproducción a petición y una imagen de portada extraída del mismo vídeo. El clip deja ver el plano, el montaje por grupos y una vista interior. Etiqueta «Ejemplo renderizado en Blender».
- **Texto propuesto:** «Tu proyecto se monta por piezas y la cámara recorre el resultado». Cuando la ruta para proyectos propios esté validada, la muestra puede llevar a «Preparar con mi proyecto». Si solo está aprobada la muestra, la acción disponible reproduce el ejemplo.

## Entregar · preparar la película del proyecto activo

- **Ubicación propuesta:** Entregar → P1 Presentación 3D → panel de la ficha, sección **Película del proyecto**. Mostrar un acceso visible «Preparar película en Blender». Dentro del panel P1, conservar «Grabar vídeo» como acceso al Cinematográfico en navegador. Conectar la preparación a T1 **Escena para Blender**, reutilizando el exportador y su manifiesto. T1 puede enlazar a la misma preparación, con un solo flujo de generación.
- **Guion inicial:** «Montaje por piezas». El profesional ve el nombre y la revisión del proyecto, el alcance por planta y qué incluye la escena. Si el ZIP cubre la planta activa, identificarla antes de descargar. Si admite ambas plantas, demostrarlo contra el manifiesto y el clip. Mostrar qué causas limitan la entrega, por ejemplo una cubierta sin geometría contrastada.
- **Flujo propuesto:** proyecto y revisión → preparar el ZIP de escena y el kit o receta del guion → renderizar en Blender → revisar el MP4 con su report. La primera versión debe identificar con claridad el paso externo. La revisión puede empezar abriendo el archivo local producido. Un visor que vincule el MP4 al proyecto o una generación remota se evalúan como ampliaciones si hacen falta.
- P8 conserva Blueprint 3D, P9 conserva Despiece y P4 conserva Evolución de obra con sus fechas y tareas. Apartment, Courtyard y Villa siguen como referencias de puesta en escena. El primer lanzamiento comunica el único guion implementado y validado.

## Evidencia para decidir y aceptar

1. **Comparación visual.** Revisar el MP4 continuo de 30 s a 720p frente a P1 Cinematográfico sobre la misma revisión. Comprobar legibilidad del plano, continuidad y ritmo, montaje reconocible por grupos y llegada a una estancia del modelo. Cuando esté publicado, enlazar el MP4, su huella y el report.
2. **Home.** En escritorio y móvil, grabar desde «Descubre RUBIK en acción» hasta reproducir y cerrar la muestra. Comprobar que se reconoce como ejemplo, vuelve el foco y abrirla no dispara un render.
3. **Entregar.** Grabar desde la ficha P1 de un proyecto propio hasta la descarga real y revisión de la salida. Verificar que la revisión, alcance, nombres de estancias y geometría final coinciden con el ZIP y el report. Probar una planta y un edificio de dos, incluyendo una revisión posterior y un elemento ausente. Adjuntar el archivo real con su huella. Dejar #324 fuera de este corte.
