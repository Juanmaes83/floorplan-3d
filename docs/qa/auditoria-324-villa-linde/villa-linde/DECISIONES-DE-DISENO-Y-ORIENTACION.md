# Villa Linde · Decisiones de diseño y carencias de RUBIK

Sustituye los planos rectangulares de la primera prueba como propuesta de vivienda. La evidencia de regresión de aquella prueba sigue asociada al archivo anterior.

## Escenario de orientación

Alicante como escenario de cálculo (38,35° N, 0,48° O, coordenadas aproximadas), zona Europe/Madrid y norte arriba. El acceso al norte y el jardín al sur son hipótesis. Las vistas, el ruido, los edificios vecinos y el desnivel siguen sin verificar. La parcela pública del ensayo previo de Catastro no es el solar del proyecto.

Cálculo con el módulo solar de la candidata 5a061725, azimut horario desde norte y altura sobre el horizonte. Horas locales.

| Fecha | Hora | Azimut | Altura |
| --- | --- | ---: | ---: |
| 21 junio | 09:00 | 79,0° | 25,0° |
| 21 junio | 13:00 | 133,1° | 69,8° |
| 21 junio | 17:00 | 261,3° | 49,8° |
| 21 diciembre | 09:00 | 126,9° | 6,6° |
| 21 diciembre | 13:00 | 180,0° | 28,2° |
| 21 diciembre | 17:00 | 233,1° | 6,6° |

El sur gana valor para las estancias de día en invierno. Conviene estudiar porche y protección de verano sin bloquear el sol bajo invernal. El oeste necesita una comprobación separada en verano. La distribución deja dormitorios en alas con accesos propios y reserva estancia diurna arriba para comparar el valor de las vistas con un escenario sin vistas. La planta alta ofrece recorridos más privados para suite, despacho y balcones; la baja concentra coche, servicio y relación directa con el exterior, con dormitorios y baños utilizables sin subir.

[Planta baja](villa-linde-propuesta-baja.png) · [Planta primera](villa-linde-propuesta-primera.png). Láminas conceptuales nuevas. El modelo editable y la comprobación de la geometría curva, acceso y giro del coche, escalera, sombras, mobiliario de catálogo y colocación sobre una parcela real quedan pendientes. S1 identifica el mismo hueco en ambas láminas. El trazo curvo marca el borde del porche que se quiere estudiar.

## Comportamiento actual de RUBIK

- Analizar → Orientación y sol calcula el recorrido con ubicación, norte, fecha, hora y zona horaria. El informe también agrupa las fachadas y longitudes de ventana detectadas de la planta activa. La ubicación y el norte se comparten entre plantas. Sin esos datos muestra qué falta.
- Analizar → Emplazamiento relaciona la parcela y la huella si se coloca el edificio. Las fuentes de terreno y ortofoto aportan contexto. El cálculo astronómico del informe no incorpora sombras del relieve ni de vecinos. Tampoco acredita vistas ni ruido, y el análisis actual no propone dónde colocar cada estancia.
- Cada planta debe contrastarse con el mismo escenario y con su propia geometría. Separar visualmente en la ficha de cada estancia qué dato está calculado, qué condición declaró el profesional y qué condición falta por comprobar.

## Mejora candidata para Diseñar ↔ Analizar

Objetivo verificable. El profesional abre la ficha de una estancia desde el plano y puede explicar la decisión sobre planta y orientación con la fuente a la vista. Ejemplo: «Salón de piscina · baja · salida a terraza · huecos al sur detectados · vistas sin verificar». Debe poder volver desde el informe a la estancia y comparar alternativas sin alterar el original.

Aceptación en Villa Linde. Cambiar el norte y comprobar que se recalculan la orientación y los huecos por fachada de ambas plantas. Si falta ubicación, indicar que no se puede calcular el recorrido solar. Si faltan alturas o geometría de obstáculos, mantener las sombras como desconocidas. Si se reubica un dormitorio, comprobar que el resultado refleja su planta, fachada y huecos actuales. Razones como privacidad, ruido, vistas y preferencia del cliente se muestran como declaraciones hasta que exista información que las respalde. Mantener la decisión final en manos del profesional.
