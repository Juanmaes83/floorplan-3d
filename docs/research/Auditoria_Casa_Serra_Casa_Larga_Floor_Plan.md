# Auditoría de Casa Serra y Casa Larga para mejorar Floor Plan

Informe para Juanma · 13 de octubre de 2026 · Investigación y propuesta de implementación

## 1 Decisión recomendada

Casa Serra y Casa Larga aportan más que una transición vistosa entre plano y vivienda. Nos interesan su lenguaje de dibujo arquitectónico, la dirección de cámara, la presentación por estancias, la relación entre materiales y luz, y los mecanismos que permiten mostrar una escena compleja sin perder al visitante. Floor Plan puede incorporar esas capacidades conservando su geometría editable, proyectos locales, importaciones y exportaciones.

Recomiendo desarrollar primero una presentación reversible sobre el proyecto real, acompañada de control de carga y degradación, navegación accesible, fichas de estancia y capturas útiles. Después, ampliar materiales e iluminación mediante un piloto medido. Los efectos de dibujo y los recorridos interiores necesitan entregas posteriores. Esta auditoría identifica **20 capacidades** y desarrolla para cada una su utilidad, adaptación y criterio de aceptación. Las prioridades son recomendaciones técnicas de este informe, no nuevas fases canónicas aprobadas.

La preparación CS-1/CS-2/CS-3 de la PR #36 sigue siendo una base válida, pero deja varias oportunidades sin desarrollar: láminas y anotaciones exportables, encuadre de cámara reproducible, captura por estancias, comparación de variantes con la misma cámara, orientación mediante un plano pequeño, HDRI, reflejos selectivos, agrupación de geometría y créditos trazables. Conviene incorporarlas al plan de forma explícita y acotada, en lugar de absorber todo el código de las demos. [F3]

Las fichas, poses de cámara, movimiento reducido y parte del control de calidad ya están previstos en #36; aquí se concretan y refuerzan. Las ampliaciones nuevas más claras son la lámina exportable, las capturas en serie, el plano de orientación, la comparación visual de variantes, el piloto de reflejo y la optimización con identidad conservada. El visor portable se presenta como investigación posterior.

**Paso previo del proyecto.** La PR #38 continúa abierta y en borrador, con las correcciones publicadas pero sin verificación integral final. Su HEAD es `3e1e1dd755e2ccae23cce799006eea3fae4bdfe7`. El cierre de importación, navegación, persistencia, móvil y 3D precede a cualquier implementación dependiente. GitHub Actions ha bloqueado el inicio por facturación; las pruebas locales podrán aportar evidencia, pero deben distinguirse de una CI ejecutada. Esta investigación no modifica ni fusiona #36 o #38. [F1, F2]

## 2 Fuentes y evidencia de la auditoría

Los repositorios se inspeccionaron en snapshots exactos. Los forks de Juanma y sus originales coinciden en los HEAD consultados. Se revisaron las fuentes HTML, CSS y JavaScript, el prompt, los puntos de integración de Floor Plan y los recursos de imagen. Los scripts minificados de Serra se formatearon únicamente para lectura en una copia de investigación.

| Fuente | Referencia | Alcance comprobado |
| --- | --- | --- |
| Casa Serra | `b47b775` | Demo publicada, prompt, escena, efectos, carga, puerta de capacidad y recursos |
| Casa Larga | `dee3068` | Código legible de modelo, cámara, lámina, materiales y primer checkpoint |
| Floor Plan master | `3fdbc0f` | Base integrada tras la reconciliación documental #37 |
| Floor Plan PR #38 | `3e1e1dd` | Integración candidata de importación multiformato y correcciones |
| Preparación Casa Serra PR #36 | `9d781f0` | Especificación CS-1/CS-2/CS-3, todavía en borrador |

**Evidencia visible.** Se abrió la página del prompt y ambas demos. Serra mostró correctamente su alternativa de imagen y vídeo. Larga permaneció en la pantalla de carga y su consola registró que este navegador no pudo crear el contexto WebGL. Por tanto, esta auditoría no acredita haber recorrido interactivamente todo el 3D, medido FPS o validado rendimiento en móvil físico. Las capacidades gráficas identificadas se sustentan en el código y los recursos inspeccionados; su adaptación requiere pruebas de producto. La limitación pertenece al entorno de esta revisión y no demuestra que las demos fallen en el equipo de Juanma.

**Inventario físico.** Se decodificaron 91 imágenes de los directorios de recursos: 79 de Serra y 12 de Larga. Se registraron dimensiones, bytes y SHA-256. Esta comprobación valida archivos, no escala real de los materiales ni consumo medido de GPU.

| Conjunto | Archivos | Bytes en disco | Dimensiones observadas |
| --- | --- | --- | --- |
| Serra perfil completo | 39 mapas | 37 311 432 | 33 de 2048×2048 y 6 con otra altura |
| Serra perfil reducido | 39 mapas | 11 607 066 | 1024×1024 |
| Serra fondo de cielo JPEG | 1 imagen | 163 056 | 4096×2048 |
| Larga texturas | 12 mapas | 9 581 267 | 9 de 1024×1024 y 3 de 2048×2048 |

Los 39 mapas reducidos de Serra representan unos **156 MiB nominales** si cada píxel ocupa cuatro bytes, o unos **208 MiB** incluyendo una cadena completa de mipmaps. El perfil completo ronda 625 MiB y 833 MiB bajo las mismas hipótesis. Estas cifras excluyen HDR, buffers, sombras, copias y geometría; tampoco son una medición de VRAM. Explican por qué el tamaño de descarga no basta para decidir qué recursos incorporar.

## 3 Qué aportan realmente las dos referencias

### Casa Serra como referencia de presentación

La escena está construida en código para una casa específica. Las estancias, muebles, coordenadas de cámara, fichas y zonas de revelado están fijados para ese proyecto. El sistema combina una vista de plano, un corte que cambia de altura, materiales que aparecen por zonas, paradas de cámara, fichas informativas, iluminación y postprocesado. El código incluye reflejo de un espejo, agrupación de geometría y dos perfiles de texturas. [S2, S3, S4, S5, S7]

Su puerta de capacidad comprueba WebGL2 y buffers HalfFloat con cuatro muestras. También distingue carga lenta, fallo de carga y pérdida de contexto, ofreciendo una imagen y un vídeo previamente preparados. En Floor Plan interesa adaptar esa gestión de estados para conservar el proyecto propio y permitir seguir trabajando en 2D. La imagen o el clip de Casa Serra no pueden funcionar como sustitutos de una vivienda importada. [S6]

### Casa Larga como referencia de implementación legible

Casa Larga permite entender cómo se mantiene una misma casa durante la lámina, el levantamiento de muros y la entrada al vestíbulo. `rig.js` separa el progreso de la cámara; `sheet.js` construye anotaciones y cajetín; `materials.js` mezcla dibujo y material; `solid.js` construye superficies de cajas ortogonales mediante una rejilla. El modelo y sus medidas siguen estando escritos para una vivienda inventada. [L2–L6]

Su entrega termina dentro de la entrada. Aunque hay habitaciones posteriores definidas, no constituye un tour completo de salón, cocina y patio. El README y el prompt describen una experiencia de desarrollo por checkpoints; un único ensayo no garantiza generar automáticamente una presentación fiable para cualquier proyecto. Nos interesa ese método de revisión por escenas, además del código legible. [L1, S1]

### Lo que Floor Plan ya tiene

Floor Plan ya deriva 2D y 3D de `FloorPlanProjectV1`; tiene transición de entrada y salida del 3D, corte de muros, recorrido manual, selección de habitaciones, puertas, luz diurna/nocturna, muebles genéricos y catálogo, materiales persistentes, variantes y capturas configurables. Su `SurfaceRenderer` verifica tamaño, hash y dimensiones antes de publicar texturas y libera recursos al dejar de usarlos. Ese comportamiento debe conservarse. [F4–F7]

La mejora consiste en orquestar y extender estas piezas. La transición actual hace crecer grupos mediante escala vertical; no es el mismo mecanismo que un corte animado sobre una malla a altura completa. Las etiquetas actuales de 3D son CSS2D y no aparecen en la captura del canvas. Estos dos puntos justifican adaptaciones concretas, sin volver a implementar toda la escena. [F4, F5]

## 4 Matriz de capacidades y prioridades

P1 significa primera tanda útil o condición de calidad; P2 requiere una entrega posterior o piloto; P3 queda como ampliación selectiva. S, M y L expresan complejidad relativa, sin compromiso de fechas. La validación de #38 y las mediciones que se indican siguen siendo necesarias.

PBR es el tratamiento de materiales mediante propiedades como rugosidad y relieve. HDRI es una imagen con rango de luz ampliado que puede iluminar el entorno. FOV es el campo de visión de la cámara. UV indica cómo se sitúa una textura sobre una superficie. Un sidecar es un archivo complementario al proyecto o a la escena; guarda información como cámaras y referencias sin alterar el plano original.

| ID y capacidad | Encaje en Floor Plan | Prioridad y complejidad |
| --- | --- | --- |
| M01 Presentación por estancias | Orquestar vistas existentes; núcleo de CS-1 | P1 · M |
| M02 Fichas y marcadores de estancia | Ampliar datos visibles del proyecto real | P1 · S–M |
| M03 Cámara y encuadre reproducibles | Sustituir coordenadas fijas por poses derivadas | P1 · M |
| M04 Movimiento reducido y controles | Integrar accesibilidad en la presentación | P1 · S–M |
| M05 Calidad y degradación por capacidad | Extender el fallback de 3D | P1 · M |
| M06 Carga por etapas y publicación segura | Ampliar estados de recursos existentes | P1 · M |
| M07 Lámina arquitectónica y anotaciones | Extender composición y exportación | P1 · M |
| M08 PBR selectivo y escala de textura | Ampliar el piloto de CS-2 | P2 · M |
| M09 HDRI y presets de iluminación | Ampliar el entorno y controles existentes | P2 · M |
| M10 Revelado de dibujo a materiales | Efecto por entidad, dentro de CS-3 | P2 · L |
| M11 Capturas y secuencia por estancias | Ampliar captura #29 y paquete #24 | P1 · M |
| M12 Comparación visual de variantes | Extender variantes #30 con cámaras iguales | P2 · M |
| M13 Plano pequeño de orientación | Nueva adaptación del vínculo 2D y cámara | P1 · M |
| M14 Espejo con reflejo selectivo | Piloto sobre un recurso identificado | P3 · M–L |
| M15 Sombras de contacto y efectos | Piloto visual con coste acotado | P2 · M–L |
| M16 Agrupación de geometría | Optimizar derivados conservando identidad | P2 · M–L |
| M17 Detalles procedurales de genéricos | Mejora selectiva del mobiliario actual | P3 · M |
| M18 Recorrido interior comprobado | Ampliación de CS-3 con colisiones | P2 · L |
| M19 Créditos y procedencia | Ampliar atribuciones y manifest por recurso | P1 · S |
| M20 Presentación portable | Propuesta de intercambio posterior | P3 · L |

## 5 Navegación y presentación que conviene implementar

### M01 Presentación reversible por estancias

**Por qué interesa.** Permite enseñar una vivienda importada o una variante sin manejar continuamente la cámara. Convierte el trabajo del editor en una presentación comprensible. Es el núcleo ya previsto en CS-1. [F3]

**Cómo.** Añadir «Presentar mi vivienda» al buscador, a Revisar y guardar y al editor completo. La configuración incluye vista general y habitaciones elegidas, ordenables. `presentation-core.js` genera paradas a partir de polígonos e IDs; `presentation-ui.js` muestra Anterior, Siguiente, Pausa y Volver a editar. La primera entrega utiliza vistas aéreas e isométricas. Cancelar o cambiar de proyecto invalida operaciones pendientes y restaura la pantalla de origen.

**Aceptación.** Presentar ejemplo, DXF y proyecto propio; cerrar con botón, Escape y Atrás; comprobar documento, entrada activa, selección, historial y estado de guardado. El progreso del recorrido debe permanecer separado del progreso de las tareas del proyecto.

### M02 Fichas y marcadores con información real

**Por qué interesa.** Las fichas de Serra relacionan una parada con información del espacio. En Floor Plan pueden explicar superficie, acabados y elementos relevantes, evitando que el usuario pierda la relación entre escena y proyecto. [S3]

**Cómo.** Usar `roomId` como vínculo; generar texto con nombre, área del polígono, material asignado y estado de escala. Ofrecer un marcador seleccionable y una ficha breve. Para muebles, declarar el método de asociación espacial y los casos ambiguos. Las descripciones arquitectónicas fijas de Serra no se trasladan a viviendas de usuarios. Los datos libres se insertan como texto mediante SafeDOM, y ES/EN/ZH usan el mecanismo de traducción existente.

**Aceptación.** Habitaciones cóncavas, nombres largos, muebles entre dos estancias y datos incompletos. La ficha debe abrirse con teclado, cerrarse conservando el foco y no ocultar las acciones principales en móvil.

### M03 Cámara con encuadre continuo y reproducible

**Por qué interesa.** Larga coordina distancia, campo de visión y centro para que el plano y la entrada formen una secuencia continua. Serra combina paradas con interpolación. Estas técnicas ayudan a evitar saltos y encuadres que cortan la vivienda. [L2, S3]

**Cómo.** Derivar poses de la envolvente del proyecto y de cada polígono, usando el mismo origen que View3D. Guardar FOV vertical, aspecto, target y pose en un plan separado. Interpolar encuadre y distancia de forma coherente; tratar el giro mediante quaternion o ángulos normalizados. En CS-1, mantener la trayectoria aérea por encima de los obstáculos o usar un corte entre vistas si no se puede demostrar su seguridad.

**Aceptación.** Vivienda pequeña y grande, importación desplazada del origen, diagonal, estancia estrecha y cambio vertical/horizontal. El resultado se repite para una misma revisión. Una spline suave o una interpolación monotónica no garantizan que la trayectoria tridimensional esté libre de paredes.

### M04 Controles accesibles y movimiento reducido

**Por qué interesa.** La experiencia debe poder usarse sin scroll preciso, sin ratón y sin animaciones extensas. Serra consulta `prefers-reduced-motion`; Floor Plan necesita convertir esa preferencia en una ruta de navegación completa. [S3]

**Cómo.** Dar prioridad a botones y selección directa de paradas. Ofrecer cambios inmediatos o transiciones breves al reducir movimiento; desactivar parallax y reproducción automática. Limitar los atajos al modo presentación y evitar interceptar teclas mientras se escribe. Mantener controles táctiles de al menos el tamaño ya usado por el editor y un retorno visible.

**Aceptación.** Teclado, lector mediante etiquetas DOM, tacto, preferencia de movimiento reducido y Escape. No introducir Lenis ni secuestrar el scroll global del editor como requisito del tour.

### M13 Orientación mediante un plano pequeño

**Por qué interesa.** Es una propuesta nueva derivada del plano común y los marcadores de progreso; las demos auditadas no demuestran este minimapa como función terminada. Permitiría saber qué estancia se presenta y desde dónde se mira.

**Cómo.** Renderizar una versión SVG simplificada del proyecto con estancia activa y dirección de cámara transformada al sistema de milímetros. Hacerlo plegable en móvil. Un clic sobre una estancia selecciona su parada; no cambia geometría ni escala. Reutilizar el mismo `roomId` que la ficha.

**Aceptación.** Plano girado, forma irregular, cambio de centro y variantes. La flecha debe corresponder a la cámara actual y desaparecer si la presentación queda obsoleta.

## 6 Fiabilidad y rendimiento antes de añadir efectos

### M05 Calidad por capacidad y degradación útil

**Por qué interesa.** Serra ofrece una alternativa visible cuando el render no puede empezar. Larga deja ver la importancia de ese mecanismo: en esta revisión no salió de carga tras el fallo de contexto. [S6, L6]

**Cómo.** Crear perfiles Básica y Mejorada sobre el renderer actual, con capacidades por efecto. La falta de HalfFloat o MSAA debe desactivar el efecto que lo requiere; no expulsar de todo el 3D si el render básico funciona. Ante pérdida de contexto, conservar el documento y ofrecer 2D. Mostrar una captura local solo si pertenece a la misma entrada y revisión, identificándola como imagen.

**Aceptación.** Sin WebGL, falta de un buffer avanzado, contexto perdido, textura fallida y resize. La interfaz explica el estado y permite editar/guardar. La reducción de calidad no cambia asignaciones, cámara ni geometría. MDN recomienda tratar extensiones y límites como dependientes del dispositivo y presupuestar recursos; no convertir la RAM declarada o el tamaño de pantalla en una garantía de rendimiento. [T3]

**Hallazgo concreto.** `fx-experience.js` contiene una reducción de `renderScale` por tiempo de frame, pero Serra configura inicialmente 0,5 y el ajuste solo actúa por encima de 0,5. Por ello, esa lógica no acredita una reducción adicional en esta configuración. Floor Plan debe probar su controlador con límites e histéresis propios, y registrar tiempos de frame como observación, no como medición aislada de GPU.

### M06 Carga por etapas y publicación segura

**Por qué interesa.** El loader de Serra cuenta recursos, prepara texturas y compila materiales antes de presentar. Floor Plan ya tiene estados y validaciones; conviene darles una UX coordinada que no mantenga bloqueada toda la aplicación. [S3, S4, F6]

**Cómo.** Separar geometría lista, materiales opcionales y modelos de catálogo. Publicar primero la escena básica y cargar solo recursos usados. Mostrar etapas reales y fallos por recurso; un porcentaje de archivos no representa necesariamente bytes o tiempo restante. La compilación anticipada se limita a los materiales activos y a las APIs disponibles en Three 0.160.0. Conservar AbortController, hashes, caché y liberación existentes.

**Aceptación.** Red lenta, recurso corrupto, cancelación, cambio de proyecto durante carga y entrada/salida repetida. Un recurso tardío no debe aparecer en otra vivienda. Las texturas fallidas mantienen un fallback identificado, y guardar no depende de que termine una mejora visual.

### M16 Agrupación de geometría conservando IDs

**Por qué interesa.** Serra agrupa geometrías por material y Larga reduce caras internas en su sólido. Puede disminuir llamadas de dibujo, pero el editor necesita identificar cada pared y mueble. [S4, L3]

**Cómo.** Medir primero las llamadas y tiempos del proyecto de control. Agrupar inicialmente elementos decorativos estáticos o instancias repetidas, manteniendo un índice de entidad por rango o instancia. Separar objetos seleccionados, editables, transparentes y con animación. El agrupamiento vive en el derivado 3D y se invalida al cambiar la revisión.

**Aceptación.** Selección, resaltado, arrastre, cambio de acabado, puerta animada y exportación conservan correspondencia exacta con IDs. `RectSolid` se estudia solo para una optimización ortogonal acotada: su rejilla crece como el producto de divisiones X/Y/Z y no sustituye el modelo de muros diagonales o habitaciones irregulares.

## 7 Dibujo materiales e iluminación

### M07 Lámina arquitectónica y anotaciones exportables

**Por qué interesa.** La lámina de Larga integra nombres, cotas, puertas, escala gráfica, corte y cajetín. Floor Plan ya muestra parte de esa información, pero puede mejorar su composición y trasladarla a entregables consistentes. [L4, F5]

**Cómo.** Crear un compositor derivado del proyecto para modo lámina y exportación. Reutilizar el SVG 2D y las cotas válidas; añadir título, revisión, leyenda de acabados y estado de escala. Calcular etiquetas interiores para polígonos cóncavos y evitar colisiones. Si se incorporan etiquetas al 3D, usar una capa renderizable o composición posterior: CSS2D no forma parte del canvas PNG. Una escala numérica impresa exige salida física controlada; una vista de pantalla no demuestra 1:100. El norte solo aparece si existe orientación declarada.

**Aceptación.** Exportación de habitaciones irregulares y texto en tres idiomas; coherencia entre superficie y geometría; lectura en móvil e imagen. El cajetín no inventa dirección, autor del plano, fecha de medición ni medidas verificadas.

### M08 Materiales PBR selectivos con repetición coherente

**Por qué interesa.** Normal, rugosidad y oclusión aportan volumen a acabados ya disponibles. Serra usa tríos diff/nor/arm; Larga muestra combinaciones legibles de color, normal y roughness. El objetivo es mejorar dos materiales primero, no cargar los 13 juegos de Serra. [S4, L5, F3]

**Cómo.** Empezar con los candidatos roble y mármol de #36. Comparar crop, orientación y UV frente a los albedos actuales: compartir nombre no prueba alineación. Extender manifest y SurfaceRenderer con mapas opcionales, SHA, bytes, dimensiones, formato y rol. Aplicar repetición y rotación coherentes a todos los canales. Base color usa sRGB; normales y rugosidad son datos sin espacio de color. Revisar UV de AO y la versión fijada de Three. [T1]

**Aceptación.** Una tabla de comparación con igual cámara y luz, orientación de normal, continuidad, memoria estimada y fallback. El helper PBR de Serra conecta ARM a AO y rugosidad, pero no conecta metalnessMap; no atribuir integración metálica automática al canal restante. Mantener los 50 acabados existentes y sus IDs.

### M09 HDRI y presets de luz reversibles

**Por qué interesa.** Serra usa un HDRI preparado mediante PMREM y un fondo de cielo; Larga usa un entorno sintético y luz cálida. Floor Plan ya tiene luz y noche, por lo que la aportación es un entorno seleccionado y presets reproducibles. [S4, S7, L6, F4]

**Cómo.** Añadir primero un HDRI autorizado y acotado con preset neutro y cálido. Separar iluminación de fondo visible: el usuario puede conservar fondo limpio. Usar el cargador oficial compatible con la versión fijada en lugar de incorporar el parser HDR personalizado de Serra. Encapsular exposición, entorno, intensidad y fondo en estado de presentación, restaurable al salir.

**Aceptación.** Mismo material bajo ambos presets, captura con color consistente, fallo del HDRI y recuperación de la luz anterior. Los presets expresan apariencia; no acreditan asoleo real de una dirección, fotometría ni calidad física del plano.

### M10 Revelado por entidades del proyecto

**Por qué interesa.** Ver un espacio pasar de dibujo a materiales puede explicar mejor la vivienda y sus acabados. El patrón de Larga es legible; Serra ofrece efectos más complejos. [L5, S2]

**Cómo.** Iniciar con un efecto sencillo en suelo y paredes de una sola estancia. Asociar mallas a `roomId`, `wallId` y objeto, con tratamiento explícito de las dos caras de paredes compartidas. Usar materiales derivados y uniforms; preservar callbacks y claves de programa. Cambiar uniforms no debe recompilar cada frame. Cuando cambie la estructura del shader, la clave de caché debe reflejarla; los callbacks de materiales requieren tratamiento expreso al clonar. [T2]

**Aceptación.** Estancia cóncava, muro diagonal, habitación contigua y modelo GLB. El efecto no revela otra estancia por una caja rectangular incorrecta. `roomOf` de las demos depende de rectángulos fijos y no sirve directamente para todos los planos de Floor Plan. Pintura, grano y otros finishers quedan opcionales; cargar `fx-paint.js` no demuestra que PaintFinisher sea la ruta seleccionada.

### M15 Sombras de contacto y postprocesado acotado

**Por qué interesa.** Las sombras ayudan a situar muebles y leer volúmenes. Larga usa parches procedurales; Serra tiene AO y otros efectos. Floor Plan puede mejorar apoyo visual sin exigir toda la cadena. [L5, S5]

**Cómo.** Probar primero sombras de contacto o AO en un proyecto de control, con intensidad moderada. Añadir una opción de presentación que vuelva al renderer base si falta capacidad. Medir coste y comprobar recorte, etiquetas, selección, puertas y muebles. Bloom, profundidad de campo y aberración no deben ocultar cotas o límites que el usuario necesita revisar.

**Aceptación.** Mueble junto a muro, solape y escena sin geometría; comparar con la misma luz. Las sombras no modifican el análisis geométrico. La captura de #29 debe seguir reflejando el modo visible con la misma conversión de color.

### M14 Reflejo de espejo selectivo

**Por qué interesa.** Serra renderiza una cámara reflejada a un target para un espejo concreto. Floor Plan usa materiales de apariencia reflectante con entorno, pero el punto auditado no genera una imagen dinámica equivalente de la habitación. [S2, F4]

**Cómo.** Reservar un piloto posterior para un único espejo identificado. Renderizar solo cuando sea visible y la cámara o escena cambien, limitar resolución y frecuencia, ocultar el propio espejo y evitar reflexión recursiva. Conservar un fallback de material y liberar su target al cambiar de proyecto.

**Aceptación.** Reflejo orientado correctamente, estabilidad al moverse, captura y restauración del framebuffer. No activar para todos los objetos brillantes ni confundir un envMap con un reflejo exacto de la escena.

### M17 Detalles procedurales en genéricos

**Por qué interesa.** Ambas casas crean mobiliario y decoración mediante geometría y semillas. Se pueden mejorar bordes, telas o apoyos de algunos genéricos cuando no haya una malla externa disponible. [S4, S8, L3]

**Cómo.** Elegir dos o tres tipos existentes y generar un derivado visual con semilla estable, presupuesto de triángulos y misma envolvente del objeto. Mantener IDs, dimensiones y fallback actual. La decoración extra debe ser opcional y reconocible; no añadir muebles invisibles al inventario del proyecto.

**Aceptación.** Repetir render/exportación produce el mismo aspecto; selección y dimensiones no cambian. No inferir marca, modelo comercial o medidas oficiales de una silla construida en código.

## 8 Entregables y comparación

### M11 Capturas por estancias y secuencia reproducible

**Por qué interesa.** Una presentación debe producir imágenes útiles. Larga incorpora un modo de frame exacto para un grabador; Floor Plan ya tiene captura configurable y paquete para Blender. La ampliación aporta poses y secuencia, sin prometer un MP4 automático. [L6, F5, F7]

**Cómo.** Empezar con «Capturar esta vista» y «Capturar estancias seleccionadas». Serializar animación y captura, esperar recursos requeridos e informar los faltantes. Reutilizar `View3D.shot`, su presupuesto y restauración; ampliar su interfaz para captura con pose explícita y composición de etiquetas. Exportar después un sidecar con poses, tiempos, ejes, aspecto, FOV, revisión y hashes de recursos para el flujo offline ya existente.

**Aceptación.** PNG con dimensiones correctas, etiquetas presentes si se solicitan, orden estable y ausencia de mutación del proyecto/cámara. La reproducibilidad significa misma configuración y contenido bajo un entorno fijado; no implica PNG idéntico byte a byte entre GPUs. MP4 requiere un pipeline y codec comprobados en una entrega posterior.

### M12 Comparación visual de variantes con cámara común

**Por qué interesa.** Es una propuesta nueva que combina la dirección visual de las demos con las variantes de Floor Plan. Permite evaluar acabados o distribución sin que un cambio de cámara altere la comparación. [F8]

**Cómo.** Compartir pose, FOV, exposición, perfil de calidad y tamaño de salida entre original y variante. Mantener sus entradas e IDs separados. Si las geometrías tienen distinto centro, almacenar primero la referencia común en coordenadas de proyecto y derivar cada pose. Mostrar capturas lado a lado y, si resulta útil, un control de alternancia.

**Aceptación.** Diferencias de mobiliario y acabados visibles con encuadre igual; cambios de envolvente y escala tratados explícitamente. El render visual no sustituye métricas geométricas ni convierte preferencias en cumplimiento normativo.

### M20 Presentación portable como ampliación posterior

**Por qué interesa.** Una secuencia local podría compartirse fuera del editor. Las demos son páginas publicadas para casas fijas; no demuestran un exportador genérico de viviendas. Esta capacidad es una propuesta de producto nueva.

**Cómo.** Investigar primero un paquete local con imágenes, manifest y plan de vistas. Un visor HTML portátil exigiría recursos empaquetados, compatibilidad y control de dependencias. Publicación web, sincronización, enlaces públicos o permisos de acceso necesitan alcance propio. El primer paquete puede funcionar sin backend y sin transmitir automáticamente planos.

**Aceptación.** Reabrir el paquete autorizado y relacionar sus imágenes con la revisión exacta. Declarar qué es imagen, escena interactiva o archivo editable; no anunciar integración con CRM, Immersphere o LAB por generar un archivo.

## 9 Arquitectura de adaptación

**Fuente de verdad.** `FloorPlanProjectV1` conserva la geometría en milímetros. Cámaras, fichas, estilos, calidad y secuencia son derivados de una entrada local y una revisión. No se incorpora `PresentationPlanV1` dentro del JSON por comodidad. El vínculo de variantes actual sigue siendo metadato de biblioteca y no viaja automáticamente con el JSON. [F3, F8]

La propuesta de módulos separa lógica pura, UI y renderer. Los nombres siguientes son puntos de implementación propuestos, salvo las piezas actuales que se identifican expresamente.

| Pieza | Responsabilidad | Integración |
| --- | --- | --- |
| presentation core | Paradas, IDs, revisión, encuadres y estados | Lee proyecto y geometría canónicos |
| presentation UI | Configuración, fichas, controles y foco | Buscador y Revisar y guardar actuales |
| Adaptador de View3D | Capturar/restaurar estado, cancelar y aplicar poses | Extensión del módulo actual en index.html |
| quality controller | Capacidades por efecto y presupuestos | Renderer y métricas existentes |
| sheet composer | Anotaciones y composición de salida | SVG 2D y captura existente |
| Material presentation | Efectos reversibles y callbacks | SurfaceRenderer y cargador F3 actuales |
| presentation export | Imágenes y sidecar de poses | Captura #29 y exportador #24 |

**Contrato derivado propuesto.** `PresentationPlanV1` incluye versión, ID de entrada local, projectId, hash/revisión visual, roomIds ordenados, poses, FOV vertical, aspecto, duración, preset y calidad. Los estados de recursos y de recorrido se separan del progreso de la guía. Un importado con projectId coincidente sigue siendo otra entrada local; su presentación no puede heredar la de la entrada anterior.

**Ejes y escala.** Floor Plan utiliza X=(x−cx)/1000, Y=altura/1000 y Z=(y−cy)/1000. Larga usa metros con Z=−n; Serra centra su casa mediante desplazamientos fijos. Adaptar las poses al centro y signos de Rubik una sola vez, verificándolo con un fixture asimétrico. Un cambio de centro exige regenerar las poses. La apariencia de una cámara a altura de persona no confirma la escala estimada de un plano.

**Restauración.** Añadir APIs explícitas de guardar/restaurar vista y de transición cancelable. Los getters `cameraState` y `canvasState` actuales sirven para observar; no proporcionan por sí solos una API de restauración. Restaurar modo 2D/3D, cámara, target, FOV, corte, luz, etiquetas, selección, paneles, foco y scroll. Tras resize se restaura el aspecto adecuado al viewport actual. Pointer lock solo se recupera con un gesto permitido, nunca como efecto lateral del cierre.

**Cancelación y revisión.** Cada operación captura entrada, revisión y token. Inicio, Atrás, salir, importar, editar o cambiar de variante invalidan resultados antiguos. Cancelar RAF, promesas y listeners propios; liberar clones/targets/texturas de presentación y conservar recursos compartidos del catálogo. Serializar la captura y cualquier animación que altere cámara o framebuffer.

**Dependencias.** Floor Plan usa Three 0.160.0 modular; Serra usa 0.160.1 global y Larga 0.170.0 modular. No añadir una segunda copia de Three. Adaptar cada mecanismo al runtime fijado; un upgrade necesita revisión separada de loaders, materiales, capturas y color. GSAP/Lenis no son requisitos de CS-1: las interpolaciones y el bucle existentes permiten empezar con controles explícitos.

## 10 Secuencia propuesta de implementación

La ampliación mantiene CS-1/CS-2/CS-3 como entregas ya documentadas y separa extensiones que aún no tenían alcance. No asigna una nueva F4 ni aprueba conjuntamente todas las capacidades.

| Entrega | Resultado verificable | Condición de avance |
| --- | --- | --- |
| Cierre #38 | Importación y persistencia comprobadas en el commit final | Pruebas finales, preview, aprobación y merge |
| Reconciliación #36 | Preparación actualizada con esta auditoría | Base vigente y alcance de cada entrega claro |
| CS-1 | M01–M04 con mínimos de M05/M06/M19 | Retorno intacto, escritorio/móvil y revisión humana |
| Extensión de entregables | M07/M11 y piloto M13 | Capturas legibles y correspondencia con revisión |
| CS-2 | Piloto M08/M09 y calidad medida | Recursos, color, UV, fallback y presupuesto |
| CS-3 primera parte | M10 y piloto M15 | Reversibilidad y geometrías no rectangulares |
| CS-3 recorrido interior | M18 | Trayectoria comprobada y alternativa segura |
| Ampliaciones selectivas | M12/M14/M16/M17/M20 | Medición o caso de uso que justifique cada alcance |

**Primer checkpoint de CS-1.** Una vista general y una estancia del proyecto propio, controles manuales, ficha con datos reales, transición aérea y salida intacta. Grabar o capturar el resultado y revisarlo antes de ampliar a todas las estancias. El primer checkpoint no exige PBR, espejo, postprocesado ni recorrido por puertas.

### M18 Recorrido interior con comprobación geométrica

**Por qué interesa.** Caminar entre estancias es una de las aportaciones más atractivas de Serra. Para viviendas arbitrarias requiere más evidencia que las coordenadas de una casa preparada. [S2, S3]

**Cómo.** Crear conectividad desde huecos transitables y comprobar la cámara y segmentos contra muros, puertas y mobiliario. Definir altura y envolvente de cámara orientativas. Validar la trayectoria interpolada completa y sus radios de giro. `__checkPath` de Serra muestrea posiciones contra cajas; es una comprobación útil de esa escena, pero no un planificador general ni una prueba continua de ausencia de colisiones. Una spline puede exceder sus puntos de control.

**Aceptación.** Puerta cerrada, hueco estrecho, muro diagonal, estancia desconectada y mueble en paso. Si no hay recorrido demostrado, usar vistas aéreas o cambio directo de parada. No prometer accesibilidad, evacuación o cumplimiento normativo con este recorrido visual.

## 11 Pruebas que deben cerrar cada entrega

| Área | Escenario mínimo | Resultado exigido |
| --- | --- | --- |
| Estado | Entrar/salir con botón, Escape y Atrás | Proyecto e historial intactos; vista restaurada |
| Aislamiento | Dos entradas con mismo projectId | Presentaciones y recursos independientes |
| Carrera | Importar o editar durante carga | Operación antigua cancelada y sin reapertura |
| Geometría | Cóncava, diagonal y pared compartida | Ficha/revelado/cámara sobre la entidad correcta |
| Cámara | Plano pequeño, grande y origen desplazado | Encuadre derivado sin corte ni giro inesperado |
| Móvil | Vertical, horizontal y resize durante tour | Controles visibles y retorno usable |
| Accesibilidad | Teclado y movimiento reducido | Navegación completa sin animación obligatoria |
| Degradación | Sin WebGL o falta de efecto avanzado | 2D o render base disponibles sin pérdida |
| Materiales | Hash/bytes/normal/UV incorrectos | Rechazo o fallback con motivo visible |
| Captura | Pose, etiquetas, aspecto y tamaño | Imagen correcta y buffer/cámara restaurados |
| Variantes | Comparación con distinta envolvente | Referencia común y origen protegido |
| Recursos | Entradas/salidas repetidas | Sin acumulación persistente de recursos propios |

Las pruebas automatizadas se complementan con revisión de la preview del SHA exacto y un teléfono físico identificado. Registrar navegador, dispositivo, viewport, perfiles activos, tiempo de carga y distribución de tiempos de frame. Los presupuestos y umbrales de aceptación se fijan con una línea base, no se copian del equipo de la demo.

La #38 todavía requiere las suites de su workflow de importación y regresiones y el recorrido final móvil/3D. Los resultados históricos de #29/#34 o la etiqueta READY no se presentan como pruebas nuevas. La investigación documental de este informe no ejecutó la suite de producto ni modificó facturación.

## 12 Créditos procedencia y reconciliación del roadmap

### M19 Créditos por código técnica y recurso

**Por qué interesa.** Juanma solicita también identificar atribuciones. La adaptación debe permitir reconocer qué aporta Sam Aing, qué se construye para Rubik y qué procede de recursos de terceros, sin convertir una licencia de texturas en licencia de toda la demo.

**Cómo.** Registrar por módulo adaptado autor, repo, SHA, archivos, cambios y base de autorización. Por recurso, registrar procedencia original, hash, canal, dimensiones, transformación y licencia declarada. Añadir el crédito a Legal y uso y a los manifests/paquetes pertinentes; mantener Rubik Sota como producto y distinguir una técnica adaptada de una casa ajena incorporada como ejemplo.

La PR #36 registra la autorización de Juanma para usar Casa Serra y conservar atribución a Sam Aing/Lintel. Los snapshots de Serra y Larga no contienen LICENSE/NOTICE. La incorporación literal de código de Larga debe documentar su base de autorización antes de esa implementación; esta auditoría sí puede estudiar y proponer sus mecanismos. Poly Haven publica sus assets como CC0; eso cubre los recursos correspondientes, no el código, marca o textos de Casa Serra/Larga. [F3, T4]

**Aceptación.** Créditos visibles y metadata exportada coinciden con los recursos realmente incorporados. Conservar atribuciones actuales del catálogo, fuentes y bibliotecas; no declarar a toda la copia MIT o CC0 sin evidencia. El rescate visual de #21 continúa como entrega independiente, aunque comparte el panel Legal y uso.

### Correcciones documentales necesarias

La PR #36 parte de `88b0cb5` y conserva referencias a #28/#32/#33 como abiertas. #37 ya reconcilió y cerró las dos primeras como sustituidas, y #33 está cerrada porque su CTA quedó incorporada. Actualizar estos estados y reconciliar desde el master resultante al abordar #36.

Roadmap 2 conserva frases sobre #23 pendiente de merge y LAB v03 como próxima entrega; el roadmap canónico ya registra esos cierres. La exportación técnica Rubik→Blender #24 tampoco debe volver a presentarse como pendiente, aunque su integración comercial/general sigue siendo otra propuesta. Registrar #38 como candidata hasta su cierre y después como integrada con el SHA real.

Mantener F2 como experimental: cinco sesiones, veinte planos con referencias y umbrales pendientes. La evolución MCP, el adaptador Room Designer→CRM y el segmento comercial D-01 no quedan aprobados por la integración de Casa Serra. CS-1/2/3, las etapas MCP y el orden 4 de Roadmap 2 representan secuencias distintas.

Estas correcciones deben actualizar el estado vigente y conservar los antecedentes fechados como históricos. [F9]

## 13 Límites y capacidades que conviene posponer

La evidencia permite diseñar adaptaciones; todavía no demuestra su funcionamiento en Floor Plan. La demo completa de Serra no fue recorrida en WebGL durante esta auditoría. No se hicieron mediciones físicas de rendimiento, nueva ejecución de Blender, producción de vídeo, validación empírica de F2 ni pruebas con escaneo RoomPlan real.

Posponer el traslado completo de `scene.js`, los muebles y cámaras fijos de las casas, el renderer/postprocesador entero, los 39 mapas simultáneos y el parser HDR personalizado. Tampoco adoptar el bloqueo de todo el 3D por una capacidad de efectos ausente, una casa estática como fallback de un proyecto propio, el control global del scroll o los globals de debug como API pública.

El valor inicial está en enseñar y entregar mejor el proyecto que el usuario ya ha construido. La primera implementación debe demostrar una presentación de una estancia, con datos correctos y retorno intacto. Las siguientes incorporaciones se justifican con comparación visual, pruebas y presupuesto observado, manteniendo la base editable de Floor Plan.

## 14 Referencias verificadas

Consulta del 13 de octubre de 2026. S y L identifican fuentes de las demos; F identifica Floor Plan; T identifica documentación primaria de apoyo. Los enlaces GitHub fijan las versiones inspeccionadas. Los resultados de navegación son observaciones de esta auditoría, no benchmarks.

- **S1 Prompt y antecedentes de Serra** — [README y metodología](https://github.com/Juanmaes83/casa-serra/blob/b47b775fae642439e8d42d6201ab5d1677d67f99/README.md), [starter prompt](https://github.com/Juanmaes83/casa-serra/blob/b47b775fae642439e8d42d6201ab5d1677d67f99/starter-prompt.md), [página publicada](https://sam1983aing.github.io/casa-serra/prompt/).
- **S2 Escena de Serra** — [scene.js](https://github.com/Juanmaes83/casa-serra/blob/b47b775fae642439e8d42d6201ab5d1677d67f99/scene.js). Casa fija, zonas de revelado, iluminación, espejo y anotaciones.
- **S3 Experiencia de Serra** — [fx-experience.js](https://github.com/Juanmaes83/casa-serra/blob/b47b775fae642439e8d42d6201ab5d1677d67f99/shared/fx-experience.js). Cámara, fichas, carga, escala de render y checkPath.
- **S4 Recursos y geometría de Serra** — [fx-core.js](https://github.com/Juanmaes83/casa-serra/blob/b47b775fae642439e8d42d6201ab5d1677d67f99/shared/fx-core.js). Loader, PBR, UV, PMREM y Batch.
- **S5 Efectos de Serra** — [fx-post.js](https://github.com/Juanmaes83/casa-serra/blob/b47b775fae642439e8d42d6201ab5d1677d67f99/shared/fx-post.js) y [fx-paint.js](https://github.com/Juanmaes83/casa-serra/blob/b47b775fae642439e8d42d6201ab5d1677d67f99/shared/fx-paint.js).
- **S6 Degradación de Serra** — [gate.js](https://github.com/Juanmaes83/casa-serra/blob/b47b775fae642439e8d42d6201ab5d1677d67f99/gate.js) y [demo publicada](https://sam1983aing.github.io/casa-serra/).
- **S7 Luz de Serra** — [light-options.js](https://github.com/Juanmaes83/casa-serra/blob/b47b775fae642439e8d42d6201ab5d1677d67f99/light-options.js).
- **S8 Mobiliario de Serra** — [staging.js](https://github.com/Juanmaes83/casa-serra/blob/b47b775fae642439e8d42d6201ab5d1677d67f99/staging.js).
- **L1 Alcance de Larga** — [README](https://github.com/Juanmaes83/casa-larga/blob/dee30681d465664a0aa714499cca7a15611f6eac/README.md) y [demo publicada](https://sam1983aing.github.io/casa-larga/).
- **L2 Cámara de Larga** — [rig.js](https://github.com/Juanmaes83/casa-larga/blob/dee30681d465664a0aa714499cca7a15611f6eac/js/rig.js).
- **L3 Geometría de Larga** — [house.js](https://github.com/Juanmaes83/casa-larga/blob/dee30681d465664a0aa714499cca7a15611f6eac/js/house.js) y [solid.js](https://github.com/Juanmaes83/casa-larga/blob/dee30681d465664a0aa714499cca7a15611f6eac/js/solid.js).
- **L4 Lámina de Larga** — [sheet.js](https://github.com/Juanmaes83/casa-larga/blob/dee30681d465664a0aa714499cca7a15611f6eac/js/sheet.js) y [plan.js](https://github.com/Juanmaes83/casa-larga/blob/dee30681d465664a0aa714499cca7a15611f6eac/js/plan.js).
- **L5 Materiales de Larga** — [materials.js](https://github.com/Juanmaes83/casa-larga/blob/dee30681d465664a0aa714499cca7a15611f6eac/js/materials.js).
- **L6 Runtime de Larga** — [main.js](https://github.com/Juanmaes83/casa-larga/blob/dee30681d465664a0aa714499cca7a15611f6eac/js/main.js) e [index.html](https://github.com/Juanmaes83/casa-larga/blob/dee30681d465664a0aa714499cca7a15611f6eac/index.html).
- **F1 Integración pendiente** — [PR #38](https://github.com/Juanmaes83/floorplan-3d/pull/38).
- **F2 Revisión de #38** — [informe y pendientes](https://github.com/Juanmaes83/floorplan-3d/blob/3e1e1dd755e2ccae23cce799006eea3fae4bdfe7/docs/qa/pr38-review-2026-10-13.md).
- **F3 Preparación Casa Serra** — [PR #36](https://github.com/Juanmaes83/floorplan-3d/pull/36) y [especificación fijada](https://github.com/Juanmaes83/floorplan-3d/blob/9d781f0ac86df82b80b0b2580caa50dc0ab4c78a/docs/technical/casa-serra-integration.md).
- **F4 Editor y View3D** — [index.html](https://github.com/Juanmaes83/floorplan-3d/blob/3e1e1dd755e2ccae23cce799006eea3fae4bdfe7/index.html).
- **F5 Captura integrada** — [capture-3d-phase-b.md](https://github.com/Juanmaes83/floorplan-3d/blob/3e1e1dd755e2ccae23cce799006eea3fae4bdfe7/docs/technical/capture-3d-phase-b.md).
- **F6 Acabados actuales** — [surface-renderer.mjs](https://github.com/Juanmaes83/floorplan-3d/blob/3e1e1dd755e2ccae23cce799006eea3fae4bdfe7/js/surface-renderer.mjs).
- **F7 Exportación integrada** — [post-F3-rubik-blender-candidate.md](https://github.com/Juanmaes83/floorplan-3d/blob/3e1e1dd755e2ccae23cce799006eea3fae4bdfe7/docs/technical/post-F3-rubik-blender-candidate.md).
- **F8 Variantes actuales** — [variants-phase-c.md](https://github.com/Juanmaes83/floorplan-3d/blob/3e1e1dd755e2ccae23cce799006eea3fae4bdfe7/docs/technical/variants-phase-c.md).
- **F9 Roadmaps vigentes** — [roadmap canónico](https://github.com/Juanmaes83/floorplan-3d/blob/3e1e1dd755e2ccae23cce799006eea3fae4bdfe7/docs/ROADMAP.md), [Roadmap 2](https://github.com/Juanmaes83/floorplan-3d/blob/3e1e1dd755e2ccae23cce799006eea3fae4bdfe7/docs/ROADMAP-2-proposal.md) y [workflow](https://github.com/Juanmaes83/floorplan-3d/blob/3e1e1dd755e2ccae23cce799006eea3fae4bdfe7/docs/DEVELOPMENT-WORKFLOW.md).
- **T1 Gestión de color de Three** — [documentación oficial](https://threejs.org/manual/pages/color-management.html). Consultar las APIs contra la versión 0.160.0 usada por Floor Plan.
- **T2 Materiales de Three** — [documentación oficial](https://threejs.org/docs/pages/Material.html). Callbacks, caché de programas y liberación de recursos.
- **T3 WebGL** — [MDN WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices). Capacidades, presupuestos y agrupación.
- **T4 Recursos de Poly Haven** — [licencia oficial](https://polyhaven.com/license). CC0 para assets; alcance separado del código y marcas de las demos.

Referencias completas de los snapshots: Casa Serra `b47b775fae642439e8d42d6201ab5d1677d67f99`; Casa Larga `dee30681d465664a0aa714499cca7a15611f6eac`; Floor Plan master `3fdbc0f34db9b545e5a2d4b037a66bcf841e23e4`; preparación #36 `9d781f0ac86df82b80b0b2580caa50dc0ab4c78a`.
