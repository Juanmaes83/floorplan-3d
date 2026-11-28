# Recorrido 3D en móvil · hallazgo de revisión de Juanma

**Estado:** mejora nueva de interacción, pendiente de diagnóstico e implementación. Juanma la detectó usando un móvil físico en la Preview compartida de RUBIK. Confirmar en el dispositivo la ruta concreta que abre el recorrido y contrastar con el handoff de Visita 3D (§5.1), la candidata #324 y la base de producto vigente en `Juanmaes83/floorplan-3d`.

## Hallazgos y resultado esperado

- **Control táctil difícil.** El joystick actual dificulta moverse por la vivienda. El visitante debe poder avanzar, girar, parar y pasar por una puerta con precisión, sin movimientos involuntarios ni necesidad de aprender el control. Identificar qué produce la dificultad antes de escoger la solución. Comprobar, entre otros casos, que soltar el dedo, cancelar el gesto y volver desde una pausa detienen el movimiento.
- **Interfaz que rompe la inmersión.** Durante la visita, la cabecera general y los controles ajenos al recorrido deben quedar fuera de la vista. El visitante necesita el máximo espacio para la escena y un modo de salir visible. Evaluar pantalla completa cuando el navegador lo permita y una vista inmersiva que ocupe la pantalla cuando esa capacidad falte. Al salir, debe volver al punto desde el que abrió la visita.

El objetivo es que un cliente pueda **entrar, orientarse, recorrer la vivienda y volver a Entregar desde su teléfono**, con una interacción coherente con RUBIK. El diseño del control y la implementación quedan a criterio de Claude tras el diagnóstico.

## Evidencia para aceptar

1. Grabar antes y después desde la entrada real del módulo, con la misma vivienda. Mostrar avance corto, giro, parada, cruce de puerta, salida y vuelta al punto de origen.
2. Comprobar en Playwright o Chromium los estados de entrada y salida, el comportamiento táctil y la superficie visible. Confirmar la facilidad de uso con un móvil físico. Revisar vertical y horizontal y conservar el recorrido de escritorio.
3. Publicar Preview, SHA y vídeo continuo con el caso probado. La revisión de Juanma decide si la navegación resulta precisa y la pantalla inmersiva. La aprobación y la fusión se registran por separado.
