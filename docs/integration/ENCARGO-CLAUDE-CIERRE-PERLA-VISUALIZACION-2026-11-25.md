# RUBIK SOTA — Encargo de cierre para Claude Code

**Fecha:** 25 de noviembre de 2026.  
**Objetivo:** cerrar la candidata PERLA, completar la presentación comercial y la calidad de las salidas visuales, conectar el Asesor por profesión y dejar Presupuestar listo para la siguiente integración.

## 0. Punto de partida y orden

Lee AGENTS.md y el protocolo de coordinación. Verifica las referencias remotas, anota el SHA base de cada corte y usa worktrees y ramas propios. Los commits publicados tras esta foto prevalecen si traen evidencia para el mismo alcance. La rama que contiene el encargo es documental.

1. **Primero, cierre de PERLA.** Parte de la candidata aprobada `09eebc9c6709628e61d9a9d6552414bec1776d40`, PR #322. Aísla y corrige la CI. Entrega el SHA y los deltas a Codex para la integración a master.
2. **Después, Visualización y Home.** Prepara cortes revisables para Render IA, producción cinematográfica local y acceso al Asesor desde el retrato. Mantén las correcciones de CI trazables por separado del desarrollo de nuevas prestaciones.
3. **Presupuestos y geometría.** Cierra MSPDI con la candidata #320, avanza BCCA aportada y reconcilia la evidencia aprobada de A0 y muros. Avanza los bloques independientes si uno queda pendiente de una credencial, permiso o aplicación externa.
4. **Penúltimo bloque: StoryLayersV1 · Entrega Junior (§8).** La especificación operativa autosuficiente está íntegra en el §8 de este encargo; Claude debe trabajar desde aquí, sin depender de archivos locales no versionados. Si no puede acceder, lo informa y continúa los demás bloques.
5. **Último bloque: examen grabado de cinco proyectos (§9).** Solo después de cerrar y validar lo anterior, contrasta cinco planos sintéticos con fichas de referencia independientes.

Medioambiente, Personas y la hoja de ruta de Simuladores quedan aplazados. El alcance cinematográfico de este encargo corresponde a la exportación, el render local y la entrega.

## 1. PERLA y Recorrido de obra

**Contexto.** El propietario aprobó la revisión visual de la candidata `09eebc9c` y el cambio de Recorrido de obra. En la última consulta del 25/11, #322 tenía 76 comprobaciones correctas, 16 fallidas y 2 omitidas. Vuelve a consultar GitHub para detectar resultados posteriores. [PR #322](https://github.com/Juanmaes83/floorplan-3d/pull/322/checks) · [Traspaso anterior de Claude](https://github.com/Juanmaes83/floorplan-3d/blob/c9dff969/docs/qa/ux312-perla/ENTREGA-CODEX.md)

**Objetivo.** Resolver todos los fallos del SHA vigente. Obtén los logs y la prueba concreta de cada trabajo rojo. Separa regresiones del producto, selectores que ya no corresponden a la interfaz aprobada, fallos también presentes en la base y fallos del entorno. Reproduce los casos en el SHA candidato y en la base cuando sea necesario. Da por explicada una incidencia de entorno o de base solo con evidencia reproducible. Conserva las aserciones funcionales, el recorrido aprobado y los controles existentes.

**Aceptación.** Acredita la CI sobre el SHA que se proponga integrar. Para las pruebas de vídeo, comprueba que el archivo se produce, se descarga y se decodifica. Para los cambios de interfaz, graba y prueba Home, editor, Presupuestar y Entregar. En Recorrido de obra, comprueba en escritorio y móvil que cada paso lleva a su ficha, que el foco llega a la acción correcta y que «Abrir presupuesto» y «Crear plan de obra» aparecen una sola vez. Cuando la CI esté resuelta, entrega a Codex el avance exacto desde la rama de integración y el Preview correspondiente.

## 2. Home y Asesor en vivo junto al retrato

**Contexto.** PERLA ya muestra un retrato distinto para cada profesión. El Asesor en vivo se revisó en la rama `claude/asesor-rubik-en-vivo` en `eac4187ab299245c4c1c82f91da0ec12f702420d`. En esa rama, el adaptador pasó pruebas contra un simulador del protocolo. [Selector y retratos](https://github.com/Juanmaes83/floorplan-3d/blob/09eebc9c/js/guide-ui.js#L229) · [Informe del Asesor](https://github.com/Juanmaes83/floorplan-3d/blob/eac4187a/docs/qa/asesor-rubik/U14-NUANCE-LIVE-Y-SKILLS.md)

**Objetivo.** Añade «Hablar con el Asesor» junto al retrato dentro de «¿En qué trabajas?». Al pulsarlo, abre el Asesor con la profesión ya seleccionada. Adapta el saludo, el tono y las preguntas de ejemplo con una sola configuración para los seis perfiles actuales. Reutiliza la lista de herramientas, el puente con RUBIK y los permisos por sesión. La profesión personaliza la experiencia. El modo y la identidad verificada determinan el acceso. La consulta guiada de Home mantiene su entrada propia. La demo muestra «Simulada», usa datos de ejemplo y empieza solo por acción explícita.

**Cierre del adaptador.** Corrige en `api/advisor-session.js` y el cliente la cancelación previa al inicio y el cierre activo. `/abandon` usa el token de sesión. `/end` usa la clave de servidor. Conserva el bloqueo de sesión hasta confirmar estado terminal o reconciliarlo con el proveedor. Cubre cierre rechazado, respuesta 200 aún activa, cancelación que coincide con el arranque, reintento y pérdida de conexión. El transporte de prueba debe exigir las mismas credenciales que el proveedor. Prepara en inglés las instrucciones y descripciones que se envían a Nuance, conforme a su contrato. Los textos de RUBIK pueden mostrarse en español. [Abandono](https://docs.nuancelabs.ai/reference/api/browser/abandon-a-conversation) · [Cierre](https://docs.nuancelabs.ai/reference/api/server/end-a-conversation) · [Idioma y reglas de contenido](https://docs.nuancelabs.ai/safety)

**Aceptación.** En Playwright y Chromium, comprueba los seis retratos y perfiles, ida y vuelta, teclado y toque, traspaso a texto, y que el modo cliente conserva su límite de acceso al pasar a texto. Publica el registro de cero peticiones a Nuance. La prueba privada real queda sujeta a autorización, presupuesto, credenciales y verificación del inicio desde servidor. El lanzamiento en español requiere una conversación real con reconocimiento y respuesta en español.

## 3. Render IA · Comparación de estilos y exportación 2K–4K

**Contexto.** `api/render.js` solicita 1536 × 1024. La muestra de Home usa imágenes de 1280 × 656 y enseña Nórdico, Industrial y Mediterráneo. El render de producto ofrece Luz natural, Cálido, Escandinavo y Premium inmobiliario. La propia documentación de procedencia conserva una descripción anterior a las variantes. [Generador](https://github.com/Juanmaes83/floorplan-3d/blob/09eebc9c/api/render.js#L122) · [Muestra de Home](https://github.com/Juanmaes83/floorplan-3d/blob/09eebc9c/js/home-en-accion.js#L24)

**Texto aprobado para Home y el diálogo de muestra**

- **Titular:** Enseña el después de tu proyecto antes de empezar
- **Subtítulo:** Transforma una vista de tu proyecto con distintos estilos. Compara cómo cambian la luz, los materiales y el ambiente desde el mismo encuadre.
- **Información:** Usa las variantes para explicar tu propuesta, explorar acabados y ayudar al cliente a elegir antes de la obra.
- **Frase de resolución:** Los pequeños detalles de tu proyecto en alta resolución 2K–4K.
- **Botón:** Comparar estilos

**Objetivo.** Usa un catálogo canónico para Home, cliente y API. Incorpora Industrial y Mediterráneo, unifica Nórdico y Escandinavo como una opción visible y conserva los identificadores aceptados y los estilos existentes de proyectos previos. Reutiliza una misma captura fuente, con su encuadre y su revisión, para todas las variantes. Actualiza las procedencias y distingue si una muestra procede de un generador externo o del producto. Valida visualmente que la variante sigue representando el espacio, evitando prometer conservación geométrica exacta.

Implementa descarga con opciones 2K y 4K. Define dimensiones por encuadre y enseña los píxeles reales del archivo. Para 16:9, usa **2560 × 1440** y **3840 × 2160 UHD**. Para otras proporciones, conserva el encuadre con el largo equivalente y muestra sus dimensiones exactas. Si el original se amplía, marca «4K reescalado desde …». Solo etiqueta como «4K nativo» una salida generada a ese tamaño. La frase comercial de resolución se activa donde la descarga esté disponible y verificada. Mantén la apertura de la muestra local y gratuita. Respeta credenciales y confirmación de gasto. Revisa el contador por instancia de Render IA y prueba una cuota global persistente con el mecanismo de reservas existente antes de ampliar el acceso. Conserva la medición del coste por imagen cuando haya tarifa configurada.

**Aceptación.** Descarga variantes desde la misma vista, comprueba las dimensiones de los PNG descargados y prueba la procedencia, el estado del selector, la compatibilidad del catálogo y la etiqueta nativa o reescalada. Usa imágenes de prueba locales para Chromium y prueba artefactos de salida reales. Acredita cualquier capacidad generativa nueva con evidencia del proveedor en un ensayo autorizado.

## 4. Visualización profesional · Rodaje local en ordenador

**Contexto.** El flujo existente exporta la escena, renderiza imágenes fijas localmente y vuelve a RUBIK para comparar y entregar. La demo comparativa acredita la misma cámara y un render de 1600 × 1000. El informe técnico identifica materiales que llegan como color plano. El producto todavía debe demostrar el recorrido completo del vídeo cinematográfico realista local antes de ofrecerlo públicamente. [Flujo Blender](https://github.com/Juanmaes83/floorplan-3d/blob/6ca70a5b/docs/integration/OP10-BLENDER-HANDOFF.md) · [Render local existente](https://github.com/Juanmaes83/floorplan-3d/blob/6ca70a5b/scripts/interop/blender-scene-render.py)

**Texto aprobado para ofrecer el recorrido cinematográfico una vez validado**

- **Titular:** El proyecto de tu vida grabado a nivel cine
- **Subtítulo:** Presenta tu proyecto con luces, focos, acción y en máxima resolución.
- **Información:** Eleva tu idea a vídeo cinematográfico realista.
- **Botón:** Comienza el rodaje

El nombre Blender Cycles puede figurar en las instrucciones técnicas del flujo local. En Home y en el botón, habla del resultado que busca el cliente. «Comienza el rodaje» debe abrir un recorrido que realmente permita preparar y entregar vídeo. La comparativa de fotogramas sigue mostrando la misma cámara como evidencia.

**Objetivo.** Mejora la escena exportada y el render que el cliente hace en su ordenador. Reutiliza los scripts vigentes, la cámara y la escena del proyecto. Define un perfil de revisión rápido y una salida de entrega con 4K UHD a **3840 × 2160** y resolución configurable según equipo y encuadre. Prioriza render nativo. Lleva texturas autorizadas o referencias portables, mapas de materiales, UV, iluminación exterior e interior, focos, sombras y encuadres comprobados. Identifica en la exportación los materiales o recursos ausentes y documenta su sustitución. Valida estabilidad temporal, uniones entre planos y ausencia de parpadeo o ruido evidente. El móvil sirve para consultar y revisar, mientras que el render de máxima calidad corre localmente en el ordenador del cliente.

**Aceptación.** Genera imágenes y al menos un fragmento MP4 4K nativo con el flujo local. Prueba como mínimo dos escenas con condiciones distintas y documenta el equipo utilizado, dispositivo, versión de Cycles, muestras, resolución, tiempos, RAM/VRAM disponible y limitaciones. Guarda pares de la misma cámara antes/después, fotogramas representativos, vídeo reproducible y registro de FFmpeg/FFprobe con resolución, códec, duración y decodificación. Abre el archivo final desde Entregar y comprueba que conserva su resolución. Si solo se dispone de un equipo, identifica la validación en un segundo equipo como pendiente.

## 5. Presupuestos · MSPDI y BCCA

### MSPDI

**Contexto.** Usa como candidata de cierre [#320](https://github.com/Juanmaes83/floorplan-3d/pull/320), `01285f246f5864046f0dfbbc490158c19cb781c2`. #316 es el antecedente. El propietario confirma que los archivos abren en las aplicaciones. La evidencia publicada ya documenta la lectura con MPXJ.

**Objetivo y aceptación.** Registra la apertura acreditada por el propietario como tal. Recoge, si están disponibles, aplicación, versión y archivo ensayado. Comprueba los XML del SHA final con MPXJ, compara fechas, hitos, calendario y dependencias con el Gantt de origen, y registra capturas de exportación en escritorio y móvil. Si la aplicación externa está disponible, reproduce la apertura y conserva evidencia. Presenta #320 como única candidata de integración de MSPDI y deja identificado qué trabajo conserva de #316. [Lista de comprobación](https://github.com/Juanmaes83/floorplan-3d/blob/01285f24/docs/integration/m13-mspdi/COMPROBACION-APLICACIONES.md)

### BCCA

**Contexto.** RUBIK ya abre el BC3 que aporta el usuario. El catálogo gestionado está en `UNKNOWN`. La edición más reciente que lista la página oficial consultada es **enero de 2024**. La adenda del repositorio recoge un permiso comercial comunicado por el propietario, con evidencia escrita todavía pendiente en el repositorio para los usos concretos. [Ediciones oficiales](https://www.juntadeandalucia.es/organismos/viviendajuventudyordenaciondelterritorio/areas/vivienda-rehabilitacion/planes-instrumentos/paginas/vivienda-bcca.html) · [Adenda de permisos](https://github.com/Juanmaes83/floorplan-3d/blob/6ca70a5b/docs/legal/bcca-es-reuse-gate-addendum-m1-2026-11-05.md)

**Decisión técnica propuesta.** Perfecciona primero el BC3 aportado por el usuario. Verifica importación local, búsqueda, aplicación con confirmación y procedencia en el presupuesto. Usa BCCA como referencia de Andalucía con tolerancia a ediciones anteriores y a catálogos alternativos. Muestra edición, fecha, ámbito, origen y si el precio se ha ajustado o se ha sustituido por una oferta. Las partidas ya presupuestadas conservan su fuente y precio.

| Perfil | Valor ofrecido |
| --- | --- |
| Estudio de arquitectura | Contrastar mediciones y justificar estimaciones con partidas trazables. |
| Inmobiliaria | Mostrar una estimación resumida de acondicionamiento, con fecha y alcance. |
| Promotora | Comparar escenarios iniciales de coste por fase y por tipología. |
| Reformas | Buscar partidas comparables y ajustar importes con ofertas reales. |
| Decoración e interiorismo | Estimar acabados y partidas de instalación, admitiendo precios propios de producto. |
| Constructora / jefe de obra | Revisar descompuestos y contrastarlos con compras y mediciones de obra. |

**Catálogo gestionado.** Prepara una ficha de derechos por edición que cubra obtención, copia, alojamiento, caché, adaptación/indexación, consulta, incrustación, redistribución del BC3 y de sus partidas, actualización, atribución y uso comercial. Si faltan condiciones primarias, deja redactada una solicitud al titular para que el propietario la apruebe y envíe. Una vez acreditados los usos, diseña actualización por versiones con origen oficial, huella, importación de prueba, comparación, aprobación explícita y reversión. Publica la nueva referencia sin recalcular automáticamente presupuestos existentes. Implementa y prueba la cadena con un BC3 sintético hasta que el catálogo gestionado pueda activarse con evidencia.

**Aceptación.** Acredita que el BC3 aportado funciona sin subir el catálogo, que la procedencia se conserva, que una revisión anterior se puede volver a consultar y que el catálogo gestionado permanece bloqueado con derechos desconocidos o restringidos.

## 6. Geometría y A0

**Contexto.** El propietario valida Geometría y A0 e informa de la acreditación de concurrencia en Firefox y WebKit. La PR [#310](https://github.com/Juanmaes83/floorplan-3d/pull/310) sigue en borrador en `2c7e77392a6137be2d1efb5674fd774385942e85`. La [#267 de muros](https://github.com/Juanmaes83/floorplan-3d/pull/267) sigue como laboratorio.

**Objetivo.** Localiza el informe acreditado, vincula cada prueba al SHA probado y compara los deltas con #310 y #267. Si la evidencia corresponde a otra composición o el código cambió, reproduce únicamente los escenarios críticos sobre la candidata que se proponga entregar. Para A0, verifica dos pestañas, cambio de época y persistencia de escrituras legítimas en Firefox y WebKit con el mismo origen. Para muros, verifica caso recto, curvo e inclinado, edición, deshacer, guardado/reapertura y consumidores de planta, 3D y exportación. Publica un candidato integrable por frente con su evidencia. Las migraciones mantienen su autorización específica.

## 7. Herramientas y entrega verificable

- **Git y GitHub CLI.** Congela el SHA, registra árbol y base, consulta checks y guarda links a los logs. Usa GitHub Actions para certificar el commit final en la rama de integración. Para cualquier bloqueo registra el caso, el comando y el resultado exacto.
- **Playwright CLI y Chromium.** Usa el navegador y los recorridos reales en escritorio **1440 × 900** y móvil **390 × 844**. Guarda capturas y vídeos de acciones, cambios de pantalla y estados de error. Para A0 ejecuta también Firefox y WebKit. Usa los motores de CLI del repositorio y el binario local de Blender para render y comprobación del archivo descargado.
- **FFmpeg y FFprobe.** Documenta las características de los MP4 descargados y decodifícalos completos. Para fotos y PNG, inspecciona los píxeles de los originales descargados. Identifica por separado las capturas de evidencia, las muestras estáticas y la salida entregable.
- **Acta por corte.** Publica en la rama de trabajo una matriz con requisito, ubicación en código, pasos, SHA/árbol, navegador o motor, resultado y enlace a captura o vídeo. Anota pruebas pasadas, fallidas y pendientes. Incluye URL de Preview cuando esté autorizada y disponible, y los commits exactos que Codex debe tomar.
- **Límites de ejecución.** Trabaja autonomamente en código y pruebas sin cargos con datos de ejemplo, sintéticos o permitidos. Las llamadas facturables a Nuance o Render IA, activaciones, gestión pública de BCCA, migraciones, subidas a la rama de integración, fusión a master y producción conservan sus autorizaciones por separado.


## 8. Penúltimo bloque · StoryLayersV1 (Entrega Junior)

**Orden y fuente.** Este es el penúltimo bloque de implementación; el examen del §9 es el último. Antes de trabajar, lee la sección «Floor Plan 3D Rubik — Especificación Técnica Definitiva: StoryLayersV1 (Entrega Junior)» del documento madre **RUBIK — Auditoría de referencias**, y anota aquí la URL y revisión consultadas. Si no está accesible, comunica el bloqueo de este bloque sin detener la cola anterior.

**Contexto que debe revalidarse en el SHA vigente.** La auditoría identificó capturas de vistas del proyecto, composición de imagen y exportación HTML con manifiesto. Referencias: View3D.deliveryShot, js/delivery-image.js y js/before-after-dossier-core.js / exportDossier. Blueprint ofrece captura y secuenciación que podría reutilizarse. Verifica contratos y estado actuales antes de depender de ellos. generateDossierPDF y storyDossierBundle fueron propuestas, no capacidades acreditadas. Componer una imagen no equivale a producir un render fotorrealista de alta resolución.

**Objetivo.** Crear una nueva entrega narrativa visual para el cliente: capítulos en orden, capturas del proyecto y llamadas/rótulos vinculados a elementos visibles y datos verificables. Cada dato debe incluir unidad, origen/revisión y estado (medido, estimado, orientativo o ausente). Debe ser legible y reconocible frente al plano y permitir al profesional explicar el proyecto. El proyecto, cámara y capturas deben corresponder a una revisión identificable; ante cambios, marcar la historia obsoleta y pedir revisión.

**Veracidad y límites.** Usa el plano, los motores de RUBIK o entradas explícitas del profesional. No inventes medidas, geometría, materiales, precios ni resultados. Una imagen generada por IA es ilustrativa, no medición ni prueba geométrica. Los textos requieren revisión profesional. No anuncies 4K/nativo, vídeo, audio, PDF ni funcionamiento offline hasta verificar el archivo descargado. Evalúa Blueprint como reutilización opcional, preservando cámara, revisión y continuidad. La entrada de imágenes para reconstrucción es un flujo separado y necesita revisión humana de escala, geometría y huecos. Incluye narración/audio solo si existe una captura autorizada y sincronizada; de lo contrario, déjalo explícitamente para otra fase.

**Alcance V1.** Prioriza historia web revisable y exportación de imágenes fijas. Prueba una porción de vídeo solo si conserva continuidad y legibilidad y supera la validación del archivo. Ofrece una nueva acción en Entregar; no redirijas ni elimines controles existentes. El manifiesto conserva fuentes y revisión, no depende de URL blob: temporales, y respeta permisos y atribución de recursos.

**Aceptación.**
- Entrar desde Entregar y volver a la misma ficha, posición y foco; escritorio, móvil, teclado y toque.
- Crear una historia con el proyecto de ejemplo y datos ausentes/estimados; contrastar cada valor contra referencia independiente.
- Validar anclajes, cámaras, orden, obsolescencia al cambiar revisión y revisión/aprobación profesional.
- Abrir y comprobar cada archivo que se anuncie: dimensiones, formato/códec, duración, atribución y offline si se promete. Retirar o etiquetar honestamente formatos no validados.
- No romper las entregas existentes; probar cancelación, errores, accesibilidad y ausencia de datos inventados.
- Prototipar primero en labs/. Usa Playwright CLI + Chromium y FFprobe/FFmpeg para artefactos audiovisuales. Publica matriz ligada al SHA final y separa local de CI.

**Valor/dificultad inicial.** Valor comercial potencial alto; dificultad media-alta por trazabilidad, anclajes y exportación. Empieza por una prueba vertical: historia web con capturas y dos llamadas de datos trazables. Amplía a vídeo/audio tras validarlo.

## 9. Último bloque · Examen grabado de cinco proyectos

**Momento.** Tras completar la cola y antes de proponer el MVP a pilotos. No reemplaza pruebas unitarias ni CI. Usa cinco proyectos sintéticos distintos: planta regular, irregular, reforma parcial, varias plantas e información incompleta. Para cada uno crea una ficha de referencia independiente con cotas, superficies, estancias, orientación y datos conocidos/ausentes; no los presentes como proyectos reales.

**Recorrido y verdad.** Claude Code adopta perfiles profesionales y completa los flujos pertinentes en RUBIK desde importación/creación hasta análisis, diseño, presupuesto y Entregar; incluye StoryLayers cuando aplique. Graba recorridos completos con Playwright, conserva capturas y archivos descargados. A través de los cinco casos cubre los seis perfiles sin forzar acciones irrelevantes. Compara plano, 2D/3D, superficies, ubicación/sol si se configuró, imágenes, presupuesto, cronograma y entregables contra la ficha independiente. La coincidencia entre módulos no basta: no debe propagarse un mismo error como si fuera verificación. Los datos ausentes permanecen ausentes.

**Incidencias.** Registra ID, caso, paso, SHA, navegador, esperado/real, ubicación, causa, impacto, severidad y evidencia. Clasifica defecto, entrada, límite de entorno o expectativa incorrecta. Corrige defectos bloqueantes y de veracidad en rama de trabajo; reinicia el caso afectado y repite los demás si la corrección los puede afectar. No escondas fallos no bloqueantes: documéntalos y deja su estado.

**Aceptación final.** Cinco vídeos reproducibles, fichas de verdad, artefactos y matriz ligados a un SHA único. Cada caso queda aprobado, fallido o pendiente. No se aprueba con discrepancias de datos sin resolver, controles rotos, archivos corruptos o formatos anunciados no verificados. No fusionar ni desplegar como parte del examen.
