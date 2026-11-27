# Home y Entregar · tres formas de animar un proyecto

Decisión de producto de Juanma del 27/11/2026. Quedan aprobados los tres nombres y sus descripciones, la ubicación junto a Dibujo vivo en Home y Entregar, y la vista previa ligera seguida de una estimación antes del render completo. La aceptación visual de los resultados y el encargo de implementación siguen pendientes.

## Referencia y resultado esperado

El repositorio donante presenta tres demostraciones, cada una con una entrada y una puesta en escena distintas. En RUBIK el punto de partida de las tres es la escena exportada de una revisión del proyecto. El croquis o plano original puede aparecer cuando exista, pueda utilizarse y esté alineado. Si falta, el guion sobre el papel puede usar la planta de RUBIK identificada como tal. Se reutilizan ideas de cámara y montaje, con los elementos que realmente existen en la escena. [Repositorio donante](https://github.com/Juanmaes83/blueprint-A-pen-sketch-a-floor-plan-or-3-references-) · [Handoff de rodaje](https://github.com/Juanmaes83/floorplan-3d/blob/90d38d54cd34ad5c0f4a498cefb864e155e9ba8a/docs/qa/pelicula-proyecto/README.md)

**Nombre de familia propuesto en la interfaz: «Tu proyecto cobra vida».** El título invita a ver el resultado. Cada guion tiene un nombre que anticipa la acción y una línea que la concreta.

| Nombre aprobado | Qué debe verse en la película | Referencia |
|---|---|---|
| **Pieza a pieza** | Vista del croquis o plano. Las piezas entran y encajan en su posición, por grupos reconocibles. La composición conserva la relación con el papel hasta que se entiende cómo surge el conjunto. | Courtyard house |
| **Maqueta abierta** | Planta legible que gana volumen. La cámara muestra la distribución desde arriba, desciende a una estancia y permite entender cómo se conectan las habitaciones. | Apartment |
| **Desde el paisaje** | Comienza situando el edificio en su entorno representado. El exterior cambia de escala conforme la cámara se acerca y cruza un hueco real. Puede mostrar iluminación, agua o terraza cuando esos elementos estén disponibles y se conozca su procedencia. | Cliff villa |

### Qué existe y qué falta

Claude tiene en su rama un guion de Blender que combina montaje por grupos y transición al interior. Hay tres fotogramas de control publicados. El guion combinado se conserva como material para el primer clip y la comparación con P1. La definición de tres guiones separados, los clips de referencia y las superficies de Home y Entregar quedan pendientes. P1 Cinematográfico ya tiene una escena «Del plano a la vivienda». P8 Blueprint 3D conserva su uso técnico. [Código de P1](https://github.com/Juanmaes83/floorplan-3d/blob/dacb5d395abf32449102d73ffd03200e6c09c019/js/presentation-film.js)

## Home · módulo propio

En **Descubre RUBIK en acción**, añadir un módulo del mismo rango visual que las capacidades principales, junto a **Dibujo vivo**, con una imagen protagonista y un selector de los tres efectos aprobados. Cada efecto tiene su portada y su clip reproducible. La selección actualiza vídeo y texto juntos. Indicar «Ejemplo renderizado en Blender». Explicar el beneficio visible en una línea y mostrar el resultado desde la propia ficha. La ruta «Preparar con mi proyecto» aparece cuando se haya verificado el flujo de proyectos propios. La comparación de imágenes fijas sigue en Visualización profesional.

## Entregar · espacio propio en Vídeo

Añadir una sección propia junto a **Dibujo vivo** en el espacio de **Presentación 3D y vídeo** para elegir un efecto y preparar la salida. Si la arquitectura vigente no ofrece una agrupación de Vídeo descubrible en el índice, darle una ficha propia en «La vivienda, para tu cliente» y enlazarla desde Vídeo. Abrir siempre el mismo selector. El profesional ve ejemplos, requisitos y alcance antes de elegir. La acción «Preparar en Blender» reutiliza T1 Escena para Blender y su manifiesto. El resultado es el MP4 del guion elegido y su informe. Mostrar la revisión de origen, las plantas incluidas y el paso externo de render. P1 Cinematográfico, Dibujo vivo, P4 Evolución, P8 Blueprint y P9 Despiece conservan sus recorridos.

## Aceptación visual y funcional

1. Publicar un clip continuo por efecto, con revisión, SHA e informe. Cada clip muestra su comienzo, una transición suficientemente desarrollada y su llegada. Los fotogramas de control se usan para inspeccionar encuadres.
2. Comparar los guiones en una misma escena cuando sea viable y usar un proyecto que tenga entorno representado para el tercer efecto. Comprobar que alguien que ve los clips sin conocer los donantes puede explicar qué cambia en cada uno. Comparar además con P1 Cinematográfico para confirmar que la opción aporta un resultado reconocible.
3. Usar la geometría, huecos, materiales y plantas de la exportación real. Documentar elementos omitidos o aproximados y comprobar las posiciones finales. Si falta una condición del guion elegido, explicar cuál antes de preparar el ZIP.
4. Tras la aprobación, validar Home en escritorio y móvil. En Entregar, grabar la elección, preparación y revisión de la salida sobre proyecto propio. Comprobar una planta, dos plantas y una revisión posterior. Registrar qué efectos quedan aprobados y cuáles siguen pendientes de grabación o ajuste.

## Flujo aprobado · vista previa, estimación y render completo

1. El profesional elige un efecto sobre su proyecto. Antes de preparar la vista previa, ve la revisión y las plantas incluidas.
2. Genera una **vista previa ligera que recorre la transición completa**. Debe permitir juzgar el ritmo, el montaje y el movimiento de cámara con el mismo guion y la misma revisión que se usarán en el render final. Identificarla como «Vista previa».
3. Antes de confirmar **«Generar película completa»**, mostrar una estimación para el perfil de salida elegido. Mostrar un rango si la medición lo permite y explicar qué condiciona el cálculo. Si no hay datos suficientes, mostrar «Estimación no disponible». Las 4–6 horas del handoff pertenecen a un clip y un equipo de prueba concretos.
4. El render completo arranca con la confirmación del profesional. Indicar que el procesamiento se realiza en Blender, qué puede reanudarse y dónde se obtiene el MP4 y su informe. Si cambia la revisión, el guion o el perfil, actualizar la estimación y avisar cuando corresponda regenerar la vista previa.

La prueba de aceptación debe grabar la secuencia **vista previa → estimación → confirmación → resultado** con un caso real de RUBIK. Verificar que cancelar tras ver la muestra no inicia el render completo. El clip de rodaje en curso conserva su papel como evidencia de comparación.
