# RUBIK SOTA — Encargo de cierre para Claude Code

**Fecha:** 25 de noviembre de 2026.  
**Objetivo:** cerrar la candidata PERLA, completar la presentación comercial y la calidad de las salidas visuales, unificar el Asistente por profesión y canal, dejar Presupuestar listo para la integración y acreditar el MVP antes del piloto.

## 0. Punto de partida y orden

Lee AGENTS.md y el protocolo de coordinación. Verifica las referencias remotas, anota el SHA base de cada corte y usa worktrees y ramas propios. Los commits publicados tras esta foto prevalecen si traen evidencia para el mismo alcance. La rama que contiene el encargo es documental.

1. **Primero, cierre de PERLA.** Parte de la candidata aprobada `09eebc9c6709628e61d9a9d6552414bec1776d40`, PR #322. Aísla y corrige la CI. Entrega el SHA y los deltas a Codex para la integración a master.
2. **Después, Visualización y Home.** Prepara cortes revisables para Render IA, producción cinematográfica local y acceso al Asesor desde el retrato y continuidad de perfil y contexto entre canales (§2.1). Mantén las correcciones de CI trazables por separado del desarrollo de nuevas prestaciones.
3. **Presupuestos y geometría.** Cierra MSPDI con la candidata #320, avanza BCCA aportada y reconcilia la evidencia aprobada de A0 y muros. Avanza los bloques independientes si uno queda pendiente de una credencial, permiso o aplicación externa.
4. **Antes del piloto, examen del MVP.** Ejecuta cinco recorridos completos sobre la candidata cerrada (§8).

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

### 2.1. Continuidad entre texto, voz y avatar

**Punto de partida.** En PERLA, la consulta guiada guarda historial local vinculado al proyecto y la conversación con IA conserva su propio historial por revisión. En U14, la memoria de nombre, tarea y misión y las capacidades de asesoría están en el laboratorio. Nuance usa un prompt fijo para el ejemplo y tres herramientas en modo cliente. «Continuar por texto» preserva ese modo y puede recibir una pregunta autorizada. Todavía falta un perfil común y un traspaso de contexto entre canales. [Historial de texto](https://github.com/Juanmaes83/floorplan-3d/blob/09eebc9c/js/assistant-gen-ui.js) · [Memoria del laboratorio](https://github.com/Juanmaes83/floorplan-3d/blob/eac4187a/labs/asesor-rubik/skills.js) · [Herramientas y traspaso](https://github.com/Juanmaes83/floorplan-3d/blob/eac4187a/labs/asesor-rubik/tools.js)

**Objetivo.** Define en RUBIK un perfil y un catálogo de capacidades comunes a la consulta guiada, el texto con IA, la voz y el avatar. Reutiliza los motores y contratos de herramientas existentes. Cada canal recibe las capacidades que admite y el usuario tiene autorizadas. Los adaptadores del proveedor traducen el contexto y las herramientas a su protocolo. Si un canal carece de una capacidad, muestra el estado y ofrece un canal permitido cuando exista. El rol se verifica al leer proyectos y ejecutar acciones. La profesión elegida en Home personaliza el trato.

- **Base para los seis perfiles.** Aplica criterio crítico y estético, organización, seguimiento de plazos, realismo y profesionalidad. Explica la recomendación y sus implicaciones. Ayuda a presentar y vender el proyecto con argumentos comprobables. Distingue plazos del plan de obra, plazos propuestos y datos ausentes.
- **Prioridades por profesión.** Arquitectura: distribución y documentación. Inmobiliaria: recorrido y presentación. Promotora: variantes y fases. Reformas: alcance y dependencias. Decoración e interiorismo: materiales, luz y coherencia visual. Constructora o jefe de obra: mediciones, partidas y secuencia de obra.
- **Memoria bajo control de la persona.** Si hay identidad verificada, guarda solo lo que autorice: nombre, profesión, preferencias y una nota o anécdota voluntaria y no sensible. Permite ver, corregir y borrar lo recordado. Recupera los proyectos desde el catálogo de la cuenta con sus permisos vigentes. Si falta identidad verificable, conserva el prototipo con datos sintéticos y memoria de sesión.
- **Continuidad de conversación.** Al cambiar de canal, traspasa el contexto autorizado mínimo: proyecto, revisión, objetivo, tarea y siguiente paso acordado. Consulta de nuevo al motor para obtener medidas, precios y fechas. Si cambia la revisión, descarta respuestas y propuestas desfasadas. Cuando falte un dato, indícalo con claridad. Los cambios del proyecto pasan por el flujo vigente de confirmación.

**Aceptación.** Prueba las seis profesiones, el tránsito voz a texto y vuelta cuando esté disponible, el cambio de proyecto y de revisión, y la edición y el borrado de un recuerdo. Comprueba que después del cambio de canal se conserva la tarea y se consulta la cifra con su fuente, que un dato ausente sigue ausente y que un cliente no accede a costes internos, edición o publicación. Comprueba que una cuenta no ve la memoria de otra. Valida primero en Chromium con proveedores simulados. Registra por separado lo comprobado en móvil y con proveedor real. Mantén las condiciones de activación del §2.

**Ensayo real en móvil.** En un Preview privado HTTPS con datos de prueba, prepara el Asistente de texto, Render IA y Nuance en ese orden. Texto requiere credencial propia, control de acceso, consentimiento y registro persistente de consumo. Para Render IA verifica generación, descarga y dimensiones. Para Nuance completa primero el cierre del adaptador y prueba inicio por clic, micrófono, audio y vídeo del avatar, paso a texto y fin confirmado de la sesión. Mantén cada activación sujeta a las condiciones del §7.

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

## 8. Examen previo al piloto · cinco proyectos de principio a fin

**Cuándo.** Ejecuta este bloque sobre una candidata cerrada del MVP, antes de abrir el piloto a profesionales. Registra el SHA inicial y el final. Durante el cierre de PERLA y los demás bloques, prepara el protocolo y los casos sin confundir las pruebas de desarrollo con el examen final.

**Preparación.** Crea cinco planos y proyectos sintéticos distintos. Antes de abrir RUBIK, fija una hoja de referencia independiente de la aplicación, con unidades, escala, entradas, cálculos y resultados esperados, tolerancias justificadas, datos intencionadamente ausentes y salidas exigidas. Conserva los archivos iniciales para poder repetir. Asume el rol indicado y opera por los accesos normales, desde el inicio hasta Entregar y la comprobación del resultado que recibiría el cliente.

| Caso | Papel | Qué debe demostrar |
| --- | --- | --- |
| 1. Vivienda de una planta con plano acotado | Estudio de arquitectura | Calibración, escala, unidades, superficies y huecos coherentes en 2D, 3D y documentos. Comprueba la vigencia y las láminas y vídeos de Blueprint y Despiece desde las rutas disponibles. |
| 2. Piso amueblado para comercializar | Inmobiliaria | Visita, imágenes, vídeo y entrega al cliente. Verifica cámara, formato, resolución real y permisos de acceso. |
| 3. Reforma con partidas incompletas | Reformas | Cambia un tabique y una medida en una copia. Comprueba cantidades, fórmulas, unidades, origen del precio y totales. Valida «Sin precio» y el estado de las salidas de la revisión anterior. |
| 4. Interior con dos propuestas de acabados | Decoración e interiorismo | Parte de la misma cámara para comparar RUBIK, Render IA y Cycles. Verifica qué cambia en la propuesta visual, los materiales sustituidos y los archivos realmente descargados. |
| 5. Edificio de dos plantas con variantes y plan de obra | Promotora y constructora / jefe de obra, en dos revisiones del mismo proyecto | Compara plantas y variantes, comprueba dependencias, hitos y fechas, y contrasta el MSPDI con el Gantt. |

**Reglas de veracidad.** Contrasta cada medida, fórmula, métrica, precio y plano con el dato aportado o el resultado independiente. Registra el proyecto, la revisión, la fuente y las unidades en la matriz. Cambia un dato y comprueba qué se actualiza y qué queda obsoleto. Distingue estimación, dato ausente y precio confirmado. Trata las variantes de Render IA como propuestas visuales y conserva accesible la vista original. Ensaya la continuidad del Asistente y los permisos del cliente con al menos uno de los cinco proyectos.

**Primera pasada y corrección.** Graba los cinco recorridos completos con Playwright CLI y Chromium. Haz capturas de los hitos, conserva las descargas y repite en móvil los recorridos previstos para ese dispositivo. Por cada fallo, registra el proyecto, SHA, pantalla, pasos, resultado esperado y real, impacto y minuto del vídeo. Detén el recorrido afectado si hay pérdida de datos, ruptura de permisos o información falsa en una entrega. Si el problema permite continuar, completa el recorrido y corrígelo después. Añade una comprobación de regresión para cada corrección y conserva las grabaciones de la primera pasada.

**Pasada final y decisión.** Repite los cinco desde los archivos originales sobre el mismo SHA final. Entrega cinco vídeos finales, capturas, archivos descargados y una matriz por proyecto y comprobación, siguiendo el §7. Declara cada caso aprobado, fallido o pendiente, y distingue proveedores reales de simulados. Si un recorrido depende de un proveedor real y la prueba no está autorizada o no se pudo ejecutar, registra esa capacidad como pendiente. El examen se cierra con los cinco recorridos acordados acreditados y los fallos que comprometan datos, permisos o entrega resueltos.
