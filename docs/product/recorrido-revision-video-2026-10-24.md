# Recorrer, revisar y entregar una vivienda en vídeo — decisión de producto

**Fecha:** 24-10-2026  
**Estado:** Juanma aprueba la **meta de producto** y pide incorporarla al programa de trabajo. Este documento no declara implementada la grabación, no elige un códec ni autoriza un enlace alojado.  
**Público:** profesionales de arquitectura, promoción, inmobiliaria, reformas e interiorismo; después, sus clientes.  
**Relación:** programa de entrega [#80](https://github.com/Juanmaes83/floorplan-3d/pull/80), estudio de vídeo [#83](https://github.com/Juanmaes83/floorplan-3d/pull/83), orientación [#71](https://github.com/Juanmaes83/floorplan-3d/pull/71), entrada profesional [#73](https://github.com/Juanmaes83/floorplan-3d/pull/73) y [#76](https://github.com/Juanmaes83/floorplan-3d/pull/76), presentación multipiso integrada [#65](https://github.com/Juanmaes83/floorplan-3d/pull/65), marca integrada [#69](https://github.com/Juanmaes83/floorplan-3d/pull/69), revisión [#75](https://github.com/Juanmaes83/floorplan-3d/pull/75), compartir imagen [#78](https://github.com/Juanmaes83/floorplan-3d/pull/78) e imagen de entrega [#81](https://github.com/Juanmaes83/floorplan-3d/pull/81).

## 1. Por qué entra ahora

«Recorrer la vivienda» es uno de los resultados que debe distinguir FLOOR PLAN: transformar un plano en una visita comprensible y una entrega convincente hecha por el profesional para su cliente. No puede quedar como un botón secundario de cámara. La persona debe descubrirlo, entender qué va a obtener, entrar sin perderse, atravesar las estancias, revisar el resultado y continuar naturalmente hacia una entrega que pueda utilizar fuera de Rubik.

Juanma ha probado la preview conjunta `2334b14` del 24-10-2026. En «Escena 3D → Recorrer», con la cruz visible, puede girar la vista, pero **WASD y las flechas no desplazan la cámara** en el proyecto de ejemplo. La auditoría del código encuentra un defecto reproducible del punto inicial: la cámara se coloca en la bisagra de la entrada `(4820, 9200 mm)`, dentro de la zona de colisión del muro contiguo `wal_ref-w21`. Cada paso se rechaza. Es una capacidad ya anunciada que no cumple su tarea básica, por lo que su corrección y validación deben entrar en el cierre de la integración actual. El arreglo no debe limitarse a las coordenadas del ejemplo: debe funcionar en proyectos creados o importados con otras puertas y geometrías.

La aprobación previa de Juanma de la preview conjunta, de #78 y de la composición D de #81 **no aprueba este recorrido libre defectuoso**. El resultado N de la auditoría A–O y la actualización de las PR siguen siendo trabajo pendiente de esa integración.

## 2. Meta de la experiencia

Un profesional prepara una vivienda de una o dos plantas, la recorre y comprueba que la representación 3D corresponde a lo que pretende mostrar. Puede corregirla, volver a revisarla y **confirmar expresamente una versión para entrega**. Después puede generar un vídeo auténtico de *su proyecto*, verlo tal como lo recibirá el cliente, descargar un archivo reproducible y compartirlo por los canales que realmente admitan ese archivo. El cliente recibe una narración clara de la vivienda, sus espacios y la identidad del profesional, sin controles de edición ni datos que el profesional no haya autorizado a mostrar.

La revisión profesional es una decisión humana ligada a la versión revisada. No equivale a una certificación de medidas, accesibilidad, normativa ni fidelidad automática al plano. Si el proyecto cambia tras la revisión, la interfaz debe explicar de forma honesta el estado de esa revisión antes de entregar una versión nueva. Un conflicto de distribución o una escala pendiente no se presenta como resuelto por grabar un vídeo.

## 3. Resultado visible en cada momento

| Momento | Qué debe entender y poder hacer la persona |
|---|---|
| Descubrir | «Recorrer» se reconoce como una capacidad principal, con una llamada a la acción clara y una explicación breve del resultado. Su tratamiento visual premium destaca por jerarquía y contraste, dentro del sistema de diseño, sin multiplicar botones equivalentes ni recurrir a oro, lila o púrpura. |
| Preparar | Antes de entrar, se entiende si se visitará libremente o se reproducirá una secuencia preparada, desde qué planta y qué controles sirven en ese dispositivo. La presentación con paradas y la visita libre no se confunden. |
| Recorrer | La persona entra en un lugar válido, se orienta, avanza, gira, atraviesa puertas transitables y comprende cómo cambiar de planta cuando sea posible. Si el navegador no permite un control, recibe una alternativa comprensible. Puede detenerse y salir sin perder el trabajo. |
| Revisar | El profesional puede comprobar el modelo completo, identificar un problema, volver al editor y repetir la revisión. La confirmación de una versión es voluntaria, visible y revocable; el cliente no ve una afirmación de «aprobado» que el profesional no haya realizado. |
| Preparar la entrega | «Grabar recorrido» se descubre como continuación natural de la revisión, con alcance, duración aproximada, orientación y datos visibles entendibles antes de empezar. El profesional conserva el control de qué vivienda, plantas, estancias, marca y contacto aparecen. |
| Obtener el vídeo | Se puede ver el vídeo final, cancelar una generación sin artefactos parciales, descargarlo y compartirlo donde se haya comprobado la compatibilidad. El archivo debe ser útil fuera de Rubik y corresponder a su vista previa. |
| Cliente | El vídeo comunica la vivienda con nombre, estancias y marca cuando estén disponibles y autorizados. Omite lo que falta; no inventa superficie, ubicación, aprobación, contacto ni características. No muestra el editor, identificadores internos, nombres de archivo privados ni una pantalla accidental. |

Claude debe **pensar, comparar y decidir** la interacción, el lenguaje, el tratamiento cromático y la relación entre recorrido libre, presentación guiada y vídeo. Esta tabla describe el resultado buscado; no prescribe componentes, arquitectura ni una técnica de grabación.

## 4. Qué cuenta como entrega utilizable

El profesional necesita archivos fáciles de incorporar a fichas de inmuebles, webs, redes sociales, mensajería y, cuando proceda, portales inmobiliarios como Idealista. «Compartir» no significa subir automáticamente a esas plataformas. Antes de prometer un destino se debe comprobar su formato aceptado, reproducción, orientación, tamaño y gesto real de adjuntar o publicar. Una descarga local compatible y una instrucción honesta pueden ser un resultado útil sin integración directa con ese servicio.

Se busca coherencia con la identidad y los datos de la imagen de entrega de #81: vivienda protagonista, nombre y vista, marca del profesional elegida por proyecto y contacto solo cuando lo haya autorizado. La ubicación del inmueble sigue siendo una decisión separada; el vídeo no debe deducirla ni introducir mapas. No se crea un enlace público, alojamiento, cuenta o subida de planos por inferencia de este brief: D-06, D-08 y D-09 permanecen abiertos.

El estudio #83 observa WebM en Chromium de pruebas y ausencia de H.264 allí; **no demuestra compatibilidad universal**. Claude debe actualizar su evidencia sobre navegadores y dispositivos relevantes y presentar la mejor opción de producto con sus límites antes de prometer MP4, iPhone, WhatsApp o portales. Los límites físicos aceptados para la integración previa (GPU real, «Compartir…» en teléfono y lámina A3 impresa) siguen sin ser PASS y **no se trasladan automáticamente** a una función nueva de vídeo.

## 5. Orden y convivencia con el trabajo en curso

1. **Cierre de la integración actual:** corregir el bloqueo del recorrido libre y demostrar movimiento desde la entrada hasta otra estancia; cerrar N, actualizar descripciones y comprobar el nuevo SHA conjunto. No dar por bueno «Recorrer» por ver la cruz, mover el ratón o activar Pointer Lock.
2. **Diseño de la experiencia completa:** en paralelo al cierre, comparar alternativas de jerarquía visual y del paso «recorrer → revisar → grabar → previsualizar → descargar/compartir». Detectar dónde los trabajos en curso de guía, cabecera, presentación, marca y compartir imagen deberían anticipar esta experiencia. Evitar añadir controles vacíos o duplicados.
3. **Cortes de vídeo:** decidir el mínimo resultado que se puede comprobar y entregar en PR propias con dependencias explícitas sobre la integración, #78 y #81. Reconciliar el estudio #83 con esta decisión. Si la viabilidad o compatibilidad bloquea una promesa, mostrar evidencia, opciones y recomendación; continuar con el trabajo independiente.

Claude decide si un pequeño ajuste de interfaz debe acompañar al arreglo del recorrido o entrar con el vídeo. Debe explicar el orden elegido y el coste de posponer cada ajuste. **No retrasar el diagnóstico del fallo de movimiento para abordar una grabación aún no implementada, ni fusionar una experiencia que anuncia movimiento cuando el ejemplo se queda inmóvil.** No fusionar PR ni desplegar sin la revisión y la autorización correspondientes.

## 6. Demostración y criterio de cierre

Para el recorrido libre, observar un desplazamiento real con teclado en Chrome de escritorio desde la entrada hasta otra estancia, con puertas y obstáculos, y comprobar otra vivienda cuya puerta no esté en el mismo lugar. Cubrir salida y regreso, error de captura del ratón, teclado/foco y las alternativas móviles; distinguirlo de la reproducción de paradas. Usar una y dos plantas sin afirmar que se puede subir una escalera caminando si no se ha demostrado.

Para el vídeo, recorrer la tarea completa con un proyecto del profesional y otro de prueba: revisión de versión, generación, previsualización, descarga y apertura del archivo fuera de Rubik; probar cancelación, cambios del proyecto, ausencia de marca, dos plantas y datos opcionales. Validar legibilidad, tamaño, fluidez y formatos en los dispositivos y destinos que se anuncien. Conservar capturas y vídeo de evidencia, resultados por navegador y tamaño, comandos, SHA exacto y una preview única para revisión humana. Playwright, Chromium y CLI sirven para la regresión, pero no sustituyen la inspección visual de los archivos ni las pruebas físicas donde importen GPU, códecs y compartir nativo.

En cada corte, el informe debe decir qué funciona, qué está solo diseñado o estudiado, qué no se ha probado y qué decisión impide el siguiente paso. La meta de este documento no se declara cumplida por publicar una PR documental, por corregir WASD o por generar cualquier archivo de vídeo: se cumple cuando el profesional y el cliente terminan la experiencia prevista sin perderse ni recibir promesas falsas.
