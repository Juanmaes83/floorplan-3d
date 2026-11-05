# Section → Spatial Visit V1 — diseño técnico

Rama `feat/section-spatial-visit-v1`, base `master@0f9c6ea`. No hay merge ni despliegue. FT3D-3 no se reconstruye: se encadena tal cual.

## Qué hace
En «Presentar mi vivienda», la sub-opción **«Sección → visita espacial»** de la sección dinámica, que está desactivada por defecto y solo se activa con la sección, convierte la historia completa en:

`plan-reveal → section-open (FT3D-3, sin cambios) → room-visit → «Explorar desde aquí» (Recorrer)`.

`room-visit` es una **narrativa pura de Story** (`js/presentation-story-core.js`). Por tanto hereda el player existente: play, pausa, búsqueda, reversa, repetición, reduced motion, deslizador y captions. No hay un bucle de animación propio ni un renderer nuevo.

## Autoridad de la trayectoria (D13)
La cámara **no inventa caminos**. Se usa lo mismo que ya valida Rubik para «Recorrido»:
- `FloorPlanPresentationRoute.plan(project, geometry, roomId)`: rejilla con Dijkstra sobre zona transitable, con holgura de 220 mm frente a muros, ventanas, puertas bajas y muebles (no alfombras), muestreo de 40 mm y validación final de la curva. Devuelve `interior` o, si no hay camino, `aerial`/`unavailable` con su motivo.
- `FloorPlanPresentationRoute.choreography(...)`: cámara a la altura de los ojos, yaw suavizado según la vista libre, velocidad limitada en curvas, aceleración y frenado, y vista de llegada puntuada.

`roomVisitPlan` en `index.html` solo:
1. **Elige el punto de aterrizaje.** Es la muestra de la ruta situada 1,2–4 m antes de la puerta del destino (o del final de la coreografía, si esta termina en una vista desde la puerta). Debe estar dentro de una estancia y a más de 250 mm de cualquier puerta, para que nunca quede un dintel encima.
2. **Prolonga la llegada si hace falta.** Si la coreografía se detiene fuera del destino (vista desde la puerta), la visita continúa **por el mismo `plan.path` validado** hasta 0,9 m dentro de la estancia. Ese tramo va de reposo a reposo y gira hacia el rincón más lejano.
3. **Rechaza en lugar de falsear.** Sin ruta interior, sin coreografía legible, sin punto de aterrizaje o sin llegada dentro del destino, no hay capítulo: `fullStory` usa el descenso existente (`room-descent`) y el caption dice «Visita espacial no disponible: motivo».

## Composición (iteración de calidad visual)
- **Muros bajos durante la llegada.** La narrativa da la altura de muro: baja de la altura de la vista general a 1,1 m mientras la cámara se aproxima, se mantiene durante el descenso y sube a la altura completa, con su techo, a la altura de los ojos. Así ningún canto de muro cortado cruza la lente al bajar. Se aplica como escala de los muros construidos, igual que en `room-descent`.
- **Aterrizaje.**
  - Si el espacio previo a la puerta del destino es amplio, se baja en el punto de la ruta validada más alejado de los muros, entre 1,2 y 4 m antes de la puerta.
  - Si es un pasillo estrecho (ningún punto queda a 0,7 m de un muro), se baja directamente en el punto de la ruta más despejado dentro del destino. La puerta y la ruta se leen desde arriba durante la aproximación.
- **Mirada.**
  - Aproximación: picada (58°) hacia el punto de aterrizaje, con el contorno real del suelo del destino resaltado.
  - Cruce de la puerta: la cámara mira hacia donde camina.
  - Giro final: su sentido y su amplitud se fijan una sola vez, a 35°/s. Esto corrige un giro de 360° que aparecía cuando el objetivo quedaba casi detrás.
  - Llegada: hacia el rincón más lejano, que da la lectura más amplia.
- **Interfaz.** Desplazamientos de yaw y pitch según la región que deja libre la tarjeta (escritorio a la derecha, móvil abajo), los mismos que usa el recorrido clásico. Se introducen de forma gradual en la aproximación y se mantienen hasta la llegada, de modo que el relevo a Recorrer conserva la pose exacta.

## Fases de `room-visit` (`stateAt(p)` puro y determinista)
| Fase | Qué ocurre | Por qué es válida |
|---|---|---|
| approach | De la pose de la vista general a la vertical del punto de aterrizaje, a una altura mayor que todos los muros y muebles + 0,8 m | Por encima de todo no hay sólidos que cruzar |
| descend | Bajada vertical hasta 1,6 m (la altura de ojos de Recorrer), con el corte horizontal activo | El punto de aterrizaje está libre en planta. No hay techo que atravesar: el modelo está cortado (cutaway), igual que en la sección |
| close | A la altura de los ojos, el corte vuelve a altura completa: muros, huecos y techo se cierran alrededor | Una sola reconstrucción en el umbral, nunca por fotograma |
| walk | Muestras de la coreografía interpoladas por su propio reloj; entrada suave C¹ si la visita empieza a mitad de la ruta | Cada posición está sobre la ruta validada |
| turn / arrive | Giro en el sitio hacia la vista de llegada y espera | — |

Durante la visita, las puertas de la ruta se abren y recuperan su estado al terminar. Las ayudas de paseo (cantos y rodapiés) solo se activan a altura completa.

## Relevo y retorno (S5/S6)
- `View3D.presentationWalkFrom()` entra en Recorrer **en la misma pose**: posición, yaw y pitch, a 1,6 m, si `blocked()` deja el punto libre. Si no, usa el inicio propio de Recorrer y lo dice en la tarjeta. Colisiones, puertas, teclado, pointer lock y joystick son los de Recorrer, sin cambios.
- Una barra compacta muestra «Recorrer · estancia», «Volver a la presentación» y «Volver a la sección». Escape vuelve primero a la presentación; un segundo Escape la cierra.
- `View3D.presentationWalkEnd()` sale sin el vuelo de órbita y repone el corte de la presentación. Cerrar la presentación o perder el contexto también sale del paseo.
- Cerrar la presentación restaura el clipping, las puertas, el corte y el editor. El JSON del proyecto no cambia (lo comprueba el test).

## Caché y encuadre
`roomVisitPlan` guarda el resultado por geometría, estancia y tamaño de pantalla (`WeakMap`). Un objeto de geometría nuevo, que aparece con cualquier edición o cambio de planta o de proyecto, invalida la caché.

La coreografía cuesta unos 1000 ms de JavaScript. Se calcula una sola vez, en la comprobación de disponibilidad, y la escena entra en unos 12 ms. Para poder compartirla, la cámara de la visita se centra en la pantalla completa, sin la compensación de la tarjeta que usa el recorrido clásico.

## Minimapa
Es el mismo plano de orientación de la presentación. Durante la visita resalta el destino, dibuja la ruta validada (`presentation-minimap-route`) y la flecha de posición y dirección.

## Restauración al salir de la presentación (corrección de causa raíz)
Al cerrar la presentación se reconstruye el layout del editor. Durante unos 600 ms el visor 3D pasa por 0 px y por alturas transitorias. El `ResizeObserver` y `presentationRestore` adoptaban esas medidas (proporción 0, 0,068 o 0,137) mientras la presentación ya se declaraba inactiva, así que cualquier lectura en esa ventana veía una cámara incorrecta.
- **View3D:** el `ResizeObserver` y `presentationRestore` ignoran un visor de 0 px. `viewportSettled()` resuelve cuando el visor mantiene el mismo tamaño real durante 3 fotogramas y sincroniza con él la cámara y el renderer.
- **Presentación:** `stop()` espera a `viewportSettled()` cuando se vuelve al 3D. `FloorPlanPresentation.active` sigue siendo `true` mientras se sale. La cubierta, oculta al presentar, se vuelve a sincronizar cuando el flag se limpia.

## Limitaciones conocidas de V1
- **Puntos de partida:** la ruta parte siempre de la puerta de entrada identificada (`Route.plan`). Una casa sin puerta de entrada marcada no ofrece el capítulo.
- **Edificios de dos plantas:** la ruta existe solo en la planta con entrada. En la otra, fallback honesto. No se simulan escaleras.
- **Descenso en espacios estrechos:** el canto de un muro seccionado puede pasar cerca del objetivo (holgura de 220 mm).
- **Rendimiento:** medido en SwiftShader (CPU), no representa una GPU real ni un móvil físico.
- **Delivery (cliente):** no publica este capítulo. Integración futura: el snapshot de Delivery ya transporta la decisión de estancias; bastaría con añadir una bandera de capítulo y reutilizar `room-visit` sin cambios.

## Procedencia
Del donante `Juanmaes83/flat-to-3d@d7b9b69` (02-section-sweep, 03-open-section) **no se ha copiado código**. Se ha tomado solo el principio: sección del mismo modelo, apertura de lente y entrada al interior. La trayectoria es exclusivamente la ruta validada de Rubik (D13), no una spline del donante.
