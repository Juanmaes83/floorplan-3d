# LoRA LAB — flujo de creación y edición: aporte de UX para el estudio #48

**Estado (18-10-2026):** observación de una grabación aportada por Juanma, no especificación aprobada ni resultado de una prueba de usabilidad. Complementa el estudio de [#48](https://github.com/Juanmaes83/floorplan-3d/pull/48), que analiza una sesión y un JSON distintos. Antes de escoger una entrega, Claude Code debe reconciliar ambas evidencias y el `master` vigente. Este documento no modifica el contrato ni autoriza copiar recursos, nombres comerciales o estilos visuales de LoRA LAB.

**Fuente:** vídeo «PRUEBA FUN. LORALAB.TOP .mp4» aportado en la conversación, 104,07 s, 2558×1362. La URL de la herramienta es <https://fun.loralab.top/tool/c9ae6fe7-55ca-4fde-bae4-f8484c49bfc6?lang=zh-CN>. Los tiempos son aproximados. La grabación muestra acciones en un proyecto ya abierto; no demuestra persistencia tras recargar, exactitud dimensional, accesibilidad de teclado ni funcionamiento móvil. El vídeo original no se añade al repositorio.

## 1. Lo observado, sin extrapolar

| Momento | Acción o interfaz visible | Alcance de la evidencia |
| --- | --- | --- |
| 0:12–0:20 | Se delimita sobre el plano una estancia a la izquierda de la vivienda; aparece «Garaje» con muros y superficie. | Se observa la creación visual y el resultado en 2D, no sus reglas de unión de muros ni su guardado. |
| 0:24–0:40 | Se dibuja otra estancia junto al plano y se muestra «Habitación de invitados». El panel contextual ofrece `Tipo de estancia`, nombre, acabados de suelo y paredes mediante muestras con nombres, y controles de color de luz. | Se observan selección y opciones. No se ha probado que cada muestra se conserve en JSON o se vea igual en 3D. |
| 0:40–0:52 | Se selecciona una puerta en un muro: el panel presenta estilos con nombres reconocibles, ancho, alto, color de marco y sentido/apertura. | La grabación no valida la geometría, el barrido ni la persistencia de todos los estilos enumerados. |
| 1:00–1:16 | Se selecciona una ventana exterior. El panel muestra familias de ventana, dimensiones, altura de antepecho, acabados del marco y controles de cortina. | Son controles visibles; no se comprueba el comportamiento de todas las familias ni la interacción de la cortina en visita. |
| 1:20–1:32 | El tipo de estancia «Vestidor» y las muestras de suelo y pared se presentan en el mismo contexto de selección, sin salir a otro flujo. | Es una pauta de interfaz. No se infiere que el tipo aplique automáticamente objetos o reglas. |

El panel muestra además una ayuda para añadir una esquina al borde y arrastrar vértices. La grabación permite afirmar que la instrucción es visible; no demuestra una edición arbitraria de polígonos ni una solución general de muros compartidos.

## 2. Comparación con Rubik en `master` (18-10-2026)

| Tarea | Capacidad actual de Rubik | Diferencia de experiencia o de modelo |
| --- | --- | --- |
| Crear estancia y muros | `+ Estancia` abre un formulario con nombre y dimensiones en mm, posición X/Y o unión rectangular a derecha/debajo; el trazado manual permite marcar vértices y cerrar la estancia. `js/room-layout-ui.js`, `js/room-layout.js`, `js/tracing-ui.js`. | Existen las entidades y operaciones básicas. El vídeo coloca la estancia de forma directa en el lienzo y ofrece propiedades contextuales; Rubik reparte la tarea entre formulario, modo de trazado y panel. La unión automática actual tiene restricciones geométricas que deben seguir siendo explícitas. |
| Añadir puerta o ventana | «Plano propio» permite elegir «Puerta» o «Ventana» y tocar un muro; se crea con ancho inicial de 800 mm y se ajusta después. `js/tracing-ui.js`, `js/tracing-core.js`. | Equivalencia de entidad básica, no de todos los estilos. El catálogo de puerta de garaje, pivotante, mirador, cortina o marco detallado del vídeo requiere evaluar datos y 3D antes de prometerlo. |
| Acabados | Biblioteca local de 50 superficies verificadas, con aplicación a suelo por estancia y acabado de pared. `js/surface-catalog.js`, `js/surface-ui.js`, `index.html` (`roomPanel`). | Rubik tiene un catálogo real; su descubrimiento y aplicación pasan por una biblioteca/modal y controles dispersos. El vídeo coloca muestras y nombres junto a las propiedades de la estancia. No se debe duplicar el catálogo para lograrlo. |
| Tipos de estancia y ejemplos | Rubik conserva nombre y geometría de la estancia y ofrece un proyecto de ejemplo y guía. | No se observa un selector equivalente de «Garaje», «Habitación de invitados» o «Vestidor» con ejemplos iniciales en el mismo flujo. Hay que distinguir sugerencias de interfaz de una taxonomía persistente nueva. |

**Hipótesis de producto, no medida:** para inmobiliarias, promotoras y estudios de arquitectura (D-01), una secuencia visible «dibujar estancia → elegir nombre/tipo sugerido → ajustar medidas → elegir acabado» puede reducir pasos y dudas frente a modos separados. También puede ayudar al segundo público de reformas e interiorismo. Debe comprobarse con tareas equivalentes y usuarios; la tecnología disponible no prueba por sí sola que la nueva interfaz sea mejor.

## 3. Candidato de primer corte para decidir tras #48

Un **flujo de creación y edición contextual de estancias** que reutilice los modelos, validadores, deshacer y biblioteca de materiales existentes:

1. Desde una acción reconocible, dibujar o previsualizar un rectángulo en el plano; mostrar medidas y zona compartida antes de confirmar. Si no hay una unión inequívoca, explicar la limitación y ofrecer trazado manual sin inventar muros.
2. Tras crear o seleccionar la estancia, mantener un panel contextual con nombre, dimensiones editables donde ya se soportan, suelo actual y acceso visible a muestras de acabados existentes. Los tipos de ejemplo serían **etiquetas sugeridas** hasta decidir si hace falta almacenarlos; cambiar el tipo nunca debe mover geometría ni muebles en silencio.
3. Añadir una puerta o ventana desde el mismo contexto sólo cuando haya un muro compatible; previsualizar ubicación y dimensiones, conservar IDs, escala, deshacer y advertencias ya existentes.

**Fuera de este primer corte propuesto:** nuevas familias geométricas de puerta/ventana, marcos, cortinas, iluminación por estancia, solver universal de polígonos, cambios de contrato, imágenes o activos de LoRA LAB. Cada capacidad nueva necesita un contrato y pruebas propios. No se aprueba este corte hasta completar el estudio y decidir su alcance.

## 4. Preguntas y aceptación para la decisión

- Claude Code debe comparar esta observación con #48, el código actual y la evidencia de la sesión larga; corregir las filas que esa evidencia contradiga y separar «ejecutado», «control visible» y «no comprobado». Si dispone del vídeo corto, contrastar los tiempos; si no, citar esta observación como evidencia secundaria, no como prueba directa suya.
- Medir en una tarea equivalente el número de cambios de modo/panel y de acciones desde proyecto abierto hasta estancia con nombre, puerta, ventana y suelo aplicado. Registrar tiempo y errores observados sin inventar una mejora cuantitativa.
- Si se aprueba el primer corte, definir antes de implementarlo: estados de dibujo/cancelación, colisiones y unión de muros, teclado/táctil, zoom, escalas pendientes, edificio de dos plantas, importación y proyectos existentes, reversibilidad, accesibilidad y pruebas a 1440×900, 390×844 y 844×390, además de teléfono físico cuando corresponda.
- QA de producto: ningún doble muro o hueco huérfano, ninguna modificación silenciosa de estancias vecinas, materiales e IDs persistentes tras guardar/reabrir, y mensajes que expliquen por qué no se puede completar una acción. Revisar capturas y recorrido humano en 2D y 3D.

**Secuencia:** reconciliar #48 y esta observación → elegir una sola entrega mínima y decidir contrato → PR de implementación → QA técnica y visual → decisión de merge. El estudio LoRA LAB sigue con Claude Code; el MCP mantiene su roadmap propio.
