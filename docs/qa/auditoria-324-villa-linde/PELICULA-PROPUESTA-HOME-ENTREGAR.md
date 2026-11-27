# Encargo de implementación · tres efectos de película para RUBIK SOTA

**Decisión de Juanma.** Aprobados los nombres **Pieza a pieza**, **Maqueta abierta** y **Desde el paisaje**, su ubicación junto a **Dibujo vivo** en Home y Entregar, y el flujo de vista previa ligera, estimación y confirmación. Se exigen **tres vídeos independientes, cada uno de más de 20 segundos**. La implementación y la aceptación visual siguen pendientes. «Tu proyecto cobra vida» es una propuesta de nombre para el conjunto.

## 1. Destino y alcance

El repositorio madre es **Juanmaes83/floorplan-3d**, rama **master**. Base comprobada al redactar el encargo: `dacb5d395abf32449102d73ffd03200e6c09c019`. Al empezar, comprueba el remoto y anota el SHA de partida. Trabaja en una rama y un worktree propios del repositorio madre. Identifica en el handoff qué dependencias pueden reutilizarse desde esa base y cuáles pertenecen a ramas pendientes. **El encargo queda fuera de #324.** Deja preparada la revisión por Claude, Codex y Juanma. La autorización de fusión y la de despliegue se conceden por separado. [Repositorio madre](https://github.com/Juanmaes83/floorplan-3d) · [Base comprobada](https://github.com/Juanmaes83/floorplan-3d/commit/dacb5d395abf32449102d73ffd03200e6c09c019) · [PR #324](https://github.com/Juanmaes83/floorplan-3d/pull/324)

**Meta de producto.** El profesional elige qué quiere explicar al cliente sobre su proyecto: cómo se forma la vivienda, cómo se distribuye y se vive por dentro, o cómo se relaciona con su entorno y cómo se accede a ella. Puede comparar los resultados antes de comprometer tiempo de render y obtener una película lista para compartir, con un informe que identifica la revisión que está enseñando. La entrega se completa cuando ese recorrido funciona desde la interfaz y los tres efectos se reconocen al verlos.

## 2. Qué reutilizar y qué está pendiente

| Fuente | Papel en este encargo |
|---|---|
| [Donante Blueprint, MIT, commit 2d3463e4](https://github.com/Juanmaes83/blueprint-A-pen-sketch-a-floor-plan-or-3-references-/tree/2d3463e42de902bef64157fdfb0dc1d09790b740) | Estudiar sus tres demostraciones y recuperar ideas de puesta en escena, montaje y cámara. Documentar cualquier código que se reutilice y su licencia. Los modelos, materiales, planos, escenarios y música del donante quedan fuera del material de RUBIK. |
| [Kit y handoff de rodaje](https://github.com/Juanmaes83/floorplan-3d/blob/fd3c4a8e1a1aee6d7047015b28e86b9c2182d56f/docs/qa/rodaje/HANDOFF-RODAJE-WINDOWS.md) | Base de trabajo para rodar con el ZIP real, su manifiesto y la cronología. Revisar qué parte del kit está disponible en la base de producto. |
| [Piloto de 30 s e informe, 91b4ced9](https://github.com/Juanmaes83/floorplan-3d/tree/91b4ced9644953b4668725112898d17b5c21890d/docs/qa/pelicula-proyecto/clip-720) | «Del plano a la vivienda», a 720p, es referencia de comparación y material de partida para **Maqueta abierta**. Su revisión nocturna corrige el piloto sobre la misma vivienda y se registra como hito propio. Los tres efectos necesitan su evidencia de aceptación individual. |
| [Home](https://github.com/Juanmaes83/floorplan-3d/blob/dacb5d395abf32449102d73ffd03200e6c09c019/js/home-en-accion.js) · [Entregar](https://github.com/Juanmaes83/floorplan-3d/blob/dacb5d395abf32449102d73ffd03200e6c09c019/js/perla-entregar-ui.js) · [P1 Cinematográfico](https://github.com/Juanmaes83/floorplan-3d/blob/dacb5d395abf32449102d73ffd03200e6c09c019/js/presentation-film.js) | Puntos de entrada existentes para contrastar navegación y componentes. Preservar los recorridos de P1, Dibujo vivo, P4 Evolución, P8 Blueprint 3D y P9 Despiece. **P8 conserva su identidad y función técnica.** |
| [Escena para Blender](https://github.com/Juanmaes83/floorplan-3d/blob/dacb5d395abf32449102d73ffd03200e6c09c019/js/assistant-journey-core.js#L83) | En la base comprobada, la acción prepara y descarga un ZIP. El render se ejecuta aparte. Aprovechar este contrato y comprobar la recepción del resultado en el flujo elegido. |

## 3. Resultado audiovisual por efecto

Cada fila define lo que debe entender el espectador. El montaje, las trayectorias de cámara y la solución técnica quedan a criterio de Claude.

| Efecto | Inicio | Transición | Cierre y prueba visual |
|---|---|---|---|
| **Pieza a pieza** · *Courtyard house* | Mostrar el croquis alineado o la planta de RUBIK identificada. | Grupos reconocibles de piezas reales entran y encajan en el lugar que les corresponde. La relación con el plano se mantiene visible durante el montaje. | Mostrar la vivienda montada de forma que el espectador pueda relacionar las piezas con su huella de origen. |
| **Maqueta abierta** · *Apartment* | Mostrar una planta legible y permitir que el espectador localice la estancia que visitará. | La planta gana volumen. La maqueta abierta muestra cómo se conectan las habitaciones. La cámara conserva referencias visibles al acercarse y descender. | Llegar al interior de esa misma estancia con un encuadre estable y una transición de luz coherente. El espectador puede señalar en la planta dónde terminó. |
| **Desde el paisaje** · *Cliff villa* | Situar la vivienda en el entorno representado en el proyecto. | Acercarse a escala comprensible desde el exterior, mostrar el acceso y atravesar un hueco real. | Llegar al interior conservando la relación con el exterior y el acceso. Terraza, agua o iluminación exterior se muestran cuando existen en los datos de origen. |

**Fuente de verdad.** Elegir y registrar el proyecto, revisión o huella, plantas incluidas y ZIP exportado que alimenta cada ejemplo. Usar la geometría, huecos, posiciones y materiales de esa revisión. Comparar los efectos sobre un mismo proyecto cuando cubra sus requisitos. Para **Desde el paisaje**, usar un caso con entorno representado y acceso real. Si faltan, la interfaz explica qué falta antes de preparar ese efecto. Si el croquis original no está disponible o no está alineado, usar la planta de RUBIK y rotularla. Registrar cualquier aproximación que vea el cliente.

**Calidad de los clips.** Entregar **un MP4 continuo por efecto, de duración estrictamente superior a 20,0 s**, medido sobre el archivo publicado. La duración debe sostener una transformación legible. El inicio, la transición y el cierre se juzgan al reproducir el vídeo. Las imágenes fijas son evidencia auxiliar. Revisar los cuatro problemas del piloto: continuidad de iluminación (salto a 22,21 s), orientación en la entrada al salón, ritmo entre etapas y legibilidad de rótulos y estabilidad del vidrio. Los 720p corresponden al piloto. Declara el perfil que usas para revisión y separa la elección del perfil final para Home de la aceptación creativa.

## 4. Recorrido que debe funcionar en RUBIK

**Home → Descubre RUBIK en acción.** Módulo propio junto a **Dibujo vivo**, con el mismo estándar visual que las capacidades principales. Los tres nombres se ven, cada selección actualiza su portada, vídeo y explicación, y el usuario puede reproducir cada ejemplo desde la misma ficha. Identifica los ejemplos renderizados en Blender. El acceso «Preparar con mi proyecto» aparece cuando su destino funciona en la candidata.

**Entregar → Vídeo.** Espacio propio junto a **Dibujo vivo**. Si el índice vigente necesita un acceso desde «La vivienda, para tu cliente», ambos accesos conducen al mismo selector. El profesional ve los tres efectos, los requisitos del seleccionado, la revisión activa y las plantas incluidas.

1. **Vista previa ligera.** Reproduce la transición completa sobre la revisión elegida, con el mismo guion que se usará en el render completo. Debe permitir juzgar ritmo, montaje y movimiento de cámara.
2. **Estimación.** Antes de confirmar, muestra la estimación para el perfil elegido o «Estimación no disponible» cuando falten datos. Identifica los factores relevantes y actualiza el estado si cambia el perfil, el guion o la revisión. Los tiempos del piloto sirven como medición de aquella prueba.
3. **Confirmación y resultado.** Cancelar tras la muestra deja el render completo sin iniciar. Indica dónde se ejecuta el proceso y qué acción corresponde al usuario. Si el flujo es externo, la acción debe reflejar que prepara el trabajo para Blender y el recorrido debe indicar cómo se recuperan el MP4 y el informe. Cuando el flujo permita iniciar realmente la generación desde RUBIK, la interfaz puede ofrecer esa acción. Documenta el recorrido elegido y prueba qué ve el profesional si la preparación falla o el render se interrumpe.

## 5. Evidencia y decisión de cierre

| Entrega | Qué se debe poder comprobar |
|---|---|
| **Tres vídeos y tres informes** | Enlace directo a cada MP4, duración medida, resolución, fotogramas por segundo, SHA-256 del archivo, commit de la implementación, proyecto y revisión o huella, plantas, ZIP de origen, perfil y marcas de tiempo para revisar inicio, transformación y llegada. La reproducción completa permite aprobar cada efecto por separado. |
| **Grabación del producto** | En escritorio y móvil, localizar el módulo de Home y reproducir los tres ejemplos. Desde Entregar, elegir un efecto con un proyecto propio, ver la vista previa, consultar la estimación, confirmar y recuperar el MP4 y su informe. Grabar también la cancelación previa al render. |
| **Casos y regresión** | Validar proyecto de una planta, proyecto de dos plantas, cambio de revisión y requisito ausente para un efecto. Comprobar que siguen funcionando P1, Dibujo vivo, P4, P8, P9 y la exportación para Blender. Revisar diseño, botones, navegación, legibilidad e idioma de la interfaz, rótulos y evidencias en ES y EN conforme a las reglas de RUBIK. |
| **Paquete para revisión** | Rama, base, SHA candidato, Preview, pruebas y enlaces de evidencia del mismo corte. Registrar por separado el estado de cada efecto, la integración Home/Entregar y la aceptación humana. Identificar cualquier límite real del render y cuándo impide completar el recorrido. |

Publica los resultados y sus enlaces en el handoff de tu rama. La revisión visual decide si cada efecto cumple su objetivo. La aprobación de los nombres y del flujo ya está registrada.
