# SmoothUI · Selección, procedencia y piloto Perla

Donante: [Juanmaes83/smoothui en 6ca7f2cc46953692c02e2fae707f5e6642aabd0a](https://github.com/Juanmaes83/smoothui/tree/6ca7f2cc46953692c02e2fae707f5e6642aabd0a). Se leyeron las fuentes seleccionadas como datos y se cotejó cada blob con Git. Licencia raíz [MIT](https://github.com/Juanmaes83/smoothui/blob/6ca7f2cc46953692c02e2fae707f5e6642aabd0a/LICENSE), blob dee522da2952b47b437e37f03f1fa2ab351eb5f1, © 2024 Eduardo Calvo. En la ruta inspeccionada de componentes no figura una licencia distinta. No se copian código, fuentes, iconos, imágenes o ejemplos del donante; la atribución de los patrones queda en este registro. Dependencias nuevas en RUBIK: ninguna. Las dependencias que se enumeran son las del donante, descartadas para el piloto.

## Selección

Las rutas son relativas al prefijo packages/smoothui/components/ del commit donante. Los archivos base identificados implementan las primitivas que reexportan sus entradas.

| Patrón | Archivo y blob Git | Dependencia del donante | Decisión en Perla y verificación |
|---|---|---|---|
| Vector Editor Toolbar | vector-editor-toolbar/index.tsx · b3b3e66aafdb6bc91cbcf0cefa45871b1859ea31 | React, Motion y utilidades | Referencia de herramientas por contexto y teclado. Reserva para Construir/Medir cuando la auditoría pruebe necesidad. Descartar pill animado, layout y motor. |
| Toolbar | toolbar/toolbar.base.tsx · ca0325843bcdfc631b48a83130aa6790ceb131d1 | Base UI, React | Adoptar acciones afines agrupadas y alcanzables. Botón nativo «Unir escaneo» en el header existente, junto a Subir. Verificar hit testing de 44 px y conservar Archivo. |
| Command | command/index.tsx · 909b03db0f3c39e7526306421c36a74da73c6cd2 | React, cmdk, diálogo, lucide | Adoptar búsqueda por intención y selección por teclado. Añadir intención a guide-core y usar el combobox/listbox de guide-ui. Verificar flechas, Enter, foco y diferencia importar/unir. |
| Toast | toast/index.tsx · ea90595f1ea39d83b72989a4053094c318366e9c | Base UI, Motion, React | Adoptar confirmación con siguiente acción, fuera del lienzo. Mensaje de estado y acción nativa vinculada al historial existente. Verificar foco, caducidad, Undo/Redo y mensajes. |
| Animated Stepper | animated-stepper/index.tsx · 7fd8eccfed2f5eb7d2987c7dd5cfcc1f99926ada | Motion, React | Referencia para progreso de comprobación en guías largas. No añadir pasos a una unión sencilla. Verificar pasos, cancelación y salida si se adopta después. |
| Animated File Upload | animated-file-upload/index.tsx · 646419018ba92a2013f72833897dcbffd2fba5e4 | React, Motion, SmoothButton | Reusar input, cancelación y validación locales. Reservar filas de estado para nuevos casos de archivos demostrados. No integrar un uploader. |
| Rich Popover | rich-popover/index.tsx · eef5a2c378824e4ccdecd0ed474e8769dcee1559 | Radix, Motion, React, lucide | Referencia de ayuda próxima a la acción. En OP‑04, details/summary nativo en el diálogo; verificar lectura, cierre y retorno. Descartar animación y popover independiente. |
| Tooltip | tooltip/tooltip.base.tsx · 2ff6d097b14d942227231a957aee10d4bdcd8638 | Base UI, React | Complemento futuro de iconos. En historial, texto de sesión y descripciones accesibles; información esencial siempre con texto. |
| Drawer | drawer/index.tsx · 217f7c09d3f07ced36cc0fe976cfaa26f8ce7524 | Base UI, React, Motion | Reservar patrón para el panel existente si aparecen problemas verificables de foco o área táctil. No sustituir cajones ni añadir gesto de arrastre al lienzo. |
| Number Field | number-field/number-field.base.tsx · d598e4a9909f0821de199fc5a36ff1e6e88038f6 | Base UI, React | Referencia futura de edición por teclado, unidades y error. Mantener input y validación canónicos de medida/presupuesto. |
| Tabs | tabs/tabs.base.tsx · 26530d5bff22df9ef65f71107b90fe0a7f88e977 | Base UI, React, Motion | Referencia futura de foco y estado seleccionado. Mantener paletas y navegación existentes. |
| Context Menu | context-menu/index.tsx · d7821c077db7c211ebda1ba9cbed89b02cb0af35 | Radix, React, Motion | Posponer. En editor, toda acción esencial necesita una ruta visible y de teclado. No interceptar clic secundario, selección ni gestos. |
| Progress | progress/progress.base.tsx · c48ed33e2a865eedaedec664d7b5f68fe6ac9590 | Base UI, React, Motion | Adoptar semántica nativa cuando haya progreso medible. Para espera indeterminada, anunciar etapa y permitir cancelación. Sin loop. |
| Empty | empty/index.tsx · 51f1b3f4ddcb0b0dd191478ee38607afbf68ed07 | React, utilidades | Referencia futura de explicación y acción de salida en estados vacíos. Reusar estados del producto. |
| AI Approval | ai-approval/index.tsx · 61a28fe7392158eb5fc3f64531392d850ff56379 | React, Motion, lucide | Solo referencia futura de confirmación y revisión de consecuencias. |
| AI Diff | ai-diff/index.tsx · c77770dcb8b6f2714bc7142dedf1cde9b54af97f | React, Motion, SmoothButton | Solo referencia futura para presentar cambios antes de aplicar o entregar. |
| AI Task List | ai-task-list/index.tsx · 8fdd36d20696283279e3c6ec4b9f5bdcb6141d1 | React, Motion | Solo referencia futura de pasos y estados comprensibles. Sin servicios ni activación. |

## Aplicación en OP‑04

Base 497c37fb4bc355f89aee98f93c68e0a7c14d80c6, árbol 1cc9faf754a68084ce1b82675bb241de124ed878. Se mantiene el importador RoomPlan, el cálculo de unión y la validación de estimación/calibración. El editor usa una fila de confirmación que no tapa el lienzo. La acción contextual comprueba proyecto, entrada, nivel, profundidad, paso superior y contenido actual antes de llamar al Deshacer existente. Una acción que caduca no revive al deshacer una edición posterior. Los marcadores A/B y el ancho provienen del diálogo existente. El contorno discontinuo usa los IDs de las estancias añadidas para la confirmación actual, sin renombrar estancias homónimas. El contorno es un estado visual de sesión y no se persiste ni se incorpora a la geometría. El historial de edición sigue siendo de sesión.

La referencia visual del propietario informa la agrupación, resultado y contraste de planos. Se mantienen el lienzo, Perla, 2D/3D, gestos y atajos existentes. No se modifica journey-core.js. Su responsabilidad sigue siendo decidir el siguiente paso, y la nueva intención pertenece al buscador de guide-core/guide-ui. La posición del diálogo en pantalla pequeña sigue el patrón de insets explícitos de Presentación. No se utiliza el ancho transitorio del layout viewport para centrar un diálogo móvil.

## Evolución transversal

La base documental es premium-ux-design-2026-10-20.md, css/design-system.css, css/guided-experience.css y la separación de guide-ui, guide-core y journey-core. Aplicar los patrones apoyándose en los tokens de Perla y los eventos ya existentes. El inventario UX‑FIRST de 17 flujos y 98 IDs conserva los contratos y los responsables. Extensión propuesta:

1. Inicio e importación: descubrimiento por intención, estado vacío, destino y cancelación.
2. Construcción 2D, muros/huecos, mobiliario, unión, plantas y escaleras: acciones contextuales visibles, cambios confirmados y reversibles, nivel explícito. Un gesto debe conservar su función actual.
3. Escena 3D, medición y calibración: foco y salida, unidades, disponibilidad y estado del visor. Comparar rendimiento medido con la línea base.
4. Presupuestos, variantes, Presentación y Evolución: estado confirmado y datos de origen comprensibles, comparar y volver. Evitar autoridad paralela y revisar permisos o privacidad antes de amplificar flujos.
5. Guardado/recuperación, exportación/entrega y asistente: confirmación honesta, alternativa de recuperación y ayuda local. P0, F0.2c y laboratorios quedan fuera del piloto.

## Mensajes contextuales de Perla

El piloto conserva el diálogo nativo y el estado de RoomPlan. Usa los roles de color de Perla y la clase `.perla-notice` para informar junto a la decisión. El estado anuncia el título y la explicación juntos. Mantener el foco en la selección durante las comprobaciones. Al mostrar una pareja comprobada por petición de la persona, llevar el foco a la acción de unir.

| Mensaje | Cuándo y cómo se comunica | Acción |
|---|---|---|
| Información | Estado o resultado esperado, con título y texto breve. Usar `role="status"` si cambia en el momento. | Continuar o revisar el resultado. |
| Advertencia | La acción sigue disponible y tiene una consecuencia que conviene revisar. | Dar la comprobación concreta y mantener la salida. |
| Error recuperable | La acción intentada falló. La causa se explica junto al control. Reservar `role="alert"` para cambios urgentes que requieren atención inmediata. | Corregir el dato o reintentar. Conservar lo ya introducido cuando sea seguro. |
| Bloqueo | La acción no se puede completar. Mostrar causa, localización, estado de los datos y alternativa. El control deshabilitado describe su estado y enlaza la explicación. | Elegir otra opción, cambiar la entrada o salir con los datos preservados. |
| Confirmación con riesgo | Diálogo nativo con un resumen de qué se modifica, qué se conserva y las consecuencias. El foco inicial favorece la salida segura cuando procede. | Confirmar con un verbo específico o cancelar. |

La forma, la etiqueta y el mensaje deben seguir siendo comprensibles sin color. Usar contraste de texto AA, un foco visible y acciones alcanzables sin gestos de precisión. El toast existente queda para respuestas breves tras una acción, como informar de una cancelación. La explicación de un bloqueo se conserva en su contexto.

OP‑04 muestra elegibilidad de cada puerta y revisa la geometría de cada pareja antes de declararla compatible. Si hay solapamiento, dibuja el intento como vista previa: trama sobre elementos entrantes y contorno discontinuo sobre los elementos existentes afectados. Ambas marcas identifican las piezas implicadas. Se usa la misma regla geométrica para la vista previa y la operación. Se vuelve a validar en la confirmación. La búsqueda puede comprobar otras parejas mientras el diálogo sigue abierto. El escaneo permanece seleccionado si falla su reemplazo. Importarlo como proyecto independiente requiere pulsar la acción explícita y usa el importador existente. El protocolo exige registrar la aceptación funcional de #268 y la UX de #271 por separado.

En cada grupo del roadmap se aplicará primero el patrón a sus bloqueos reproducidos y se verificará el estado de los datos en la recuperación. Registrar el flujo y los IDs ya existentes, documentar la evidencia en la PR y pasar después al siguiente corte priorizado.

## Presupuesto y aceptación

Cero paquetes, nuevas peticiones, instrumentación de producción, listeners por frame o rAF nuevos. El piloto visual se midió frente a un objetivo provisional de 16 KiB netos. El corte de elegibilidad, diagnóstico y recuperación amplía el alcance y suma aproximadamente 23 KiB netos en los seis archivos de ejecución respecto a #268. La búsqueda de parejas cede el hilo entre comprobaciones y solo se ejecuta con el diálogo abierto. Medir trabajo de render en reposo y llamadas de dibujo tras fijar la misma escena. #268 aún tiene render continuo; confirmar que el piloto no añade un bucle y que sobre el árbol simulado con OP‑02 se mantiene el reposo sin renders. Las cifras de software no equivalen a hardware real ni a una estimación clínica de latencia.

Criterios: cuatro viewports, acceso y Deshacer alcanzables sin desplazamiento automático, teclado y foco visible, roles y nombres accesibles, contraste de texto, objetivo táctil de 44 px para acciones principales, ausencia de cambios con Cancelar/Escape, caducidad probada de la acción e historial correcto tras recarga. Pasar la regresión dirigida del diálogo y comprobar sincronía del visor. Antes de la aceptación final, completar la prueba de autonomía con una persona nueva y la comprobación de anuncios en un lector de pantalla real. La automatización observa el árbol de accesibilidad, pero no reproduce el anuncio del lector ni sustituye la revisión humana.
