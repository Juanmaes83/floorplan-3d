# QA — Delivery 3D Client Experience V1

Rama `feat/delivery-client-3d-experience-v1`, base `master@0f9c6ea`. El entorno es Chromium 141 en contenedor, con WebGL por SwiftShader (CPU) y sin GPU. El SHA exacto del último commit verificado figura en la descripción de la PR.

## 1. Pruebas

| Suite | Resultado | Notas |
|---|---|---|
| `tests/delivery-core.test.cjs` (nueva) | 6/6 | Lista blanca, fugas, escala «real» con referencia mínima, validadores reales (proyecto, F1B y edificio de 2 plantas), versionado y validación estricta. |
| `tests/delivery-api.test.cjs` (nueva) | 3/3 | `share kind=delivery`, `/api/delivery` (no es proxy abierto, `no-store`, 404/422/502) y `/api/unshare` (código, solo el propio almacén, como máximo 8). |
| `tests/delivery-3d.browser.test.cjs` (nueva) | 6/6 | Escenarios A–G (ver §2). |
| Unitarias relacionadas: guide, project, building, presentation-core/route, share-api, ai-render-api | 95/95 | Incluye las nuevas. |
| client-share, share-link, share-image, client-review | 2/2, 1/1, 3/3, 5/5 | |
| guide-navigation, first-paint-language | 14/14, 1/1 | |
| walk, walk-controls | 2/2, 8/8 | `walk-controls` falló 1 vez al correr en paralelo con otra suite. En solitario pasa 8/8 en la rama y en la base. |
| building-presentation, presentation-route | 7/7, 7/7 | |
| professional-workspace | 17/17 | Encontró una regresión real: «Entregar» exige jerarquía igual entre CTAs (Point9). Corregida en `08cac3f`. Base: 17/17. |

## 2. Escenarios A–G

- **A.** Proyecto de ejemplo:
  - se prepara la presentación con el diálogo real;
  - tarjeta en estado `ready`;
  - la vista previa no sube nada;
  - recorrido libre;
  - la visita guiada sigue **exactamente** las estancias decididas;
  - al publicar se suben el snapshot y la página, y la tarjeta pasa a `live`;
  - el dossier muestra la sección de visita;
  - la visita servida por `/api/delivery` funciona y «Volver al documento» lleva de vuelta al documento;
  - el estado desactualizado se muestra en la tarjeta;
  - la retirada funciona.
- **B.** Edificio de 2 plantas: visita guiada por las estancias de ambas plantas, según la decisión, y recorrido libre.
- **C.** Entrega inexistente, de otro almacén, `javascript:` o manipulada: «ya no está disponible» o error. Una red caída da error con «Reintentar», y el reintento funciona.
- **D.** Móvil 390×844 y 844×390:
  - sin scroll horizontal y con objetivos táctiles de 44 px o más;
  - texto de joystick;
  - recorrido con *tap*;
  - el 3D ocupa el ancho completo.
- **E.** Sin WebGL: estado `no-3d`, sin botones que no funcionen. Al perder el contexto durante la visita, vuelta a la portada con el aviso.
- **F.** Sin `RUBIK_RENDER_TOKEN` ni token del almacén en el snapshot, la página, la URL de visita ni el enlace. Sin campos excluidos. El `localStorage` real no cambia tras la visita del cliente. La versión del snapshot coincide con la del proyecto. Retirada: archivos borrados, dossier con 404 y visita con «ya no está disponible». Ninguna petición externa.
- **G.** El archivo descargable (offline) no tiene sección ni enlace de visita. El diálogo antiguo «Enlace para el cliente» no marca la visita 3D por defecto.

## 3. Defectos encontrados y corregidos durante el QA

1. Una escala «real» invalidaba el snapshot: la calibración nombra la imagen del plano. Ahora viaja solo una referencia mínima de la imagen.
2. La visita guiada de un edificio volvía a la portada antes de arrancar (condición de carrera del vigilante).
3. El `#welcomeDialog` se reabría como modal oculto y dejaba la página inerte.
4. «Volver al documento» se perdía porque el router de la app reescribe el hash. Ahora el origen se lee en `<head>`.
5. La tarjeta no se redibujaba al publicar o retirar.
6. El diálogo antiguo marcaba la visita 3D por defecto. Esto cambiaba lo que se comparte; corregido.
7. Una publicación fallida podía dejar en el almacén el snapshot o el vídeo. Ahora se limpian.
8. Herramientas profesionales visibles en la visita del cliente: luz, sombras, vídeo, «Volver a editar», capas de contexto y la pista a «Presentar mi vivienda».
9. Franja de 112 px en móvil horizontal, causada por el margen del carril lateral del editor.
10. «Esc para salir» era falso (Esc pausa).
11. La jerarquía de CTAs de «Entregar» incumplía la regla Point9.

## 4. Rendimiento (`tests/helpers/delivery-perf.cjs`)

> SwiftShader renderiza en CPU: las cifras absolutas (fps de un solo dígito, entradas de unos 20 s dominadas por las animaciones de cámara a menos de 1 fps) **no representan un dispositivo real**. Sirven para comparar y para detectar fugas.

| Medida | Resultado |
|---|---|
| Abrir «Entregar» (tarjeta) | 227 ms. **No inicializa View3D** (`rendererMemory` es `null`): la tarjeta no carga el modelo. |
| Tamaño del snapshot (proyecto de ejemplo, sin portada) | 32 KB (límite 4 MB; portada de 900 KB como máximo) |
| Portada lista en modo cliente | 2,1 s en escritorio y 1,8 s en móvil (incluye validación e importación) |
| Recorrido, app normal | 2,1 fps con lienzo de 884×493 (0,44 MP) |
| Recorrido, modo cliente en escritorio | 0,7 fps con lienzo de 1440×848 (1,22 MP) |
| Recorrido, modo cliente en móvil | 1,2–1,3 fps con lienzo de 390×792 |
| 5 ciclos de entrar y salir | Geometrías y texturas **constantes** (1225/9 en escritorio, 1209/9 en móvil). Heap de JS entre 38,7 y 40,9 MB, sin crecimiento. Sin fugas. |

**Lectura honesta:**
- La caída frente a la app normal (2,8 veces) coincide exactamente con el aumento de píxeles (2,8 veces), porque el cliente ve el 3D a pantalla completa. Por píxel, el coste es idéntico.
- Probé y descarté que la causa fuera el `backdrop-filter`. Aun así lo eliminé de la barra: es caro sobre WebGL.
- View3D ya limita la densidad a `min(devicePixelRatio, 2)`.

**Pendiente:**
- **Validación en un móvil real (gate humano).** Medir fps en un iPhone y en un Android de gama media.
- **Calidad adaptativa** (bajar la densidad o las sombras si los frames superan 33 ms). Necesita un gancho en View3D (`index.html`), que no he tocado para no colisionar con otras ramas. Lo dejo como propuesta de interfaz compartida.

## 5. Evidencia visual

Las capturas de cada escenario (`QA_SHOTS=<dir> node --test tests/delivery-3d.browser.test.cjs`) se adjuntan a la PR y no se versionan. Revisadas a mano:
- tarjeta del profesional en los estados listo, publicado y desactualizado;
- portada del cliente en escritorio y en móvil vertical y horizontal;
- recorrido;
- visita guiada sin herramientas del profesional;
- sección de visita del dossier;
- entrega retirada;
- error con reintento;
- sin WebGL;
- contexto perdido.

## 6. Mejora visual: mini-mapa en la exploración libre y estados de botón

### Mini-mapa
- **Componente reutilizado.** Es el plano de orientación de la presentación. La geometría la da `FloorPlanPresentationCore.minimap()`, que es función pura y calcula `viewBox` y polígonos en mm. El aspecto viene de las clases `.presentation-minimap*`: panel, polígonos de estancia, activa y seleccionable. No hay un mapa paralelo. Lo nuevo vive en `js/delivery-map-core.js`, un módulo puro con tests, que añade dos funciones:
  - `roomAt()` resuelve la estancia actual por punto en polígono; si hay polígonos solapados, gana el más pequeño.
  - `marker()` dibuja el punto «estás aquí» y un cono de visión.
- **Posición y orientación.** Se leen de un gancho nuevo y mínimo de View3D: `View3D.walkPose()`, que devuelve la posición de la cámara en mm del plano (`x·1000+OX`, `z·1000+OY`) y la dirección de la mirada proyectada en planta. El mapa se refresca cada 150 ms mientras dura la exploración libre. Al salir, se elimina el temporizador.
- **Navegación clicable.** Cada estancia del mapa es un botón: clic, *tap* o Enter/Espacio con teclado. Llama a `View3D.walkToRoom(id)`, que aplica las mismas reglas que el inicio del recorrido:
  - entra por una puerta de la estancia y queda justo dentro, o, si no hay puerta, se coloca cerca de su centro;
  - comprueba colisiones con muros y puertas (`blocked`);
  - mira hacia la esquina más lejana de la estancia, que da la vista más profunda y nunca una pared a un palmo.

  Si la estancia no tiene un sitio libre, lo dice y no mueve al visitante. Los eventos del mapa no se propagan al lienzo, así que no inician un arrastre ni la mirada.
- **Plegable.** «Ocultar plano» y «Ver plano», con `aria-expanded`. Está abierto por defecto si la pantalla mide 520 px de alto o más, y plegado en un móvil en horizontal, para no tapar la vivienda. Plegado sigue mostrando la estancia actual.
- **Legible.** Los nombres se pintan solo si caben en su estancia. El nombre completo queda como tooltip y en la línea «estás aquí».
- **Responsive.** 300 px en escritorio, 200 px en móvil vertical y 210 px en móvil horizontal. El botón de plegar mide 40 px o más.
- **Gancho en `index.html`.** `walkPose` y `walkToRoom` están junto a la lógica de Recorrer (`walkStart`/`blocked`) y en la lista de exportación de View3D, **lejos del bloque de ventanas y de los hooks F02**.

### Sistema de estados de botón
Un solo tratamiento, definido en `css/delivery-client.css`, que usa los roles del design system (`--action`, `--line-strong`, `--focus`, …). Su alcance está limitado a la visita del cliente (portada, barra, tarjeta de Recorrer, panel de la presentación y mapa) y a `#professionalWorkspace[data-area="deliver"]`. El resto del editor no cambia. Estados:

| Estado | Tratamiento |
|---|---|
| default | Superficie de panel, línea fuerte y elevación suave (dos sombras) |
| hover | Sube 1 px, sombra más profunda y borde del color de acción |
| active / pressed | Baja 1 px, sombra interior y superficie hundida |
| focus-visible | Anillo de foco de 3 px (solo con teclado) más la elevación |
| disabled | Plano, apagado, sin elevación y cursor `not-allowed` |
| acento | La acción principal de cada pantalla, con los mismos estados sobre petróleo: «Explorar la vivienda» y «Empezar el recorrido» |

- La parada actual de la presentación se pinta en grafito (`aria-current="step"`).
- «Salir de la visita» lleva una flecha y un borde más marcado.
- `prefers-reduced-motion` desactiva los desplazamientos.
- **En «Entregar» se mantiene la regla Point9:** ninguna tarjeta tiene un CTA relleno. «Revisar como cliente» usa un **contorno de acento** (`data-emphasis="accent"`) para tener jerarquía dentro de su tarjeta sin competir con las demás.

### Pruebas añadidas
- `tests/delivery-map-core.test.cjs`: 2/2.
- Escenario A, escritorio:
  - mapa abierto, todas las estancias y la actual resaltada;
  - navegación por clic a otra estancia y por teclado de vuelta, sin dejar de caminar;
  - plegar y desplegar.
- Escenario D, móvil vertical y horizontal: abierto en vertical, plegado en horizontal, dentro de la pantalla, objetivo táctil del botón y navegación por *tap*.
