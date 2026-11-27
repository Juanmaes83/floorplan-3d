# Guion de grabación · Gesture Labs con la cámara frontal (Juanma)

**Rama:** `claude/gesture-labs`. Es un ensayo fuera de #324 y solo se activa con `?gesture-lab=1`.
**Objetivo:** validar con una mano real lo que la prueba automática solo puede simular con fotogramas sintéticos.
Duración: unos 3 minutos por equipo.

## Preparación (1 min)
1. Graba con dos equipos si puedes: un portátil (cámara frontal) y un móvil (cámara frontal, en vertical).
2. Abre la Preview de la rama `claude/gesture-labs` (el enlace está en el comentario de Vercel de la rama) y añade `?gesture-lab=1` a la URL. Tiene que ser HTTPS, porque sin HTTPS el navegador no concede la cámara.
3. Luz de frente o lateral, no a contraluz. Colócate a unos 50–70 cm de la cámara, con fondo liso si es posible.
4. Activa la grabación de pantalla del sistema. En el móvil, la grabación nativa; en el portátil, la del sistema o OBS. Que se vean la pantalla y, en la miniatura, tu mano.

## Recorrido (dilo en voz alta mientras lo haces)
| # | Acción | Qué debe pasar | Anota si falla |
|---|---|---|---|
| 1 | Home → «Abrir proyecto de ejemplo» → **Entregar** → ficha **P11 · Presentación con gestos** | La ficha dice «en ensayo» y muestra el plano real del ejemplo | ¿Aparece P11? |
| 2 | Pulsa abrir → lee la **introducción** → «Empezar» | Se ve el plano **enrollado** y la viñeta con la palma | ¿Se entiende qué hacer sin leer este guion? |
| 3 | «Activar cámara» → concede el permiso | El texto pasa por «Pidiendo permiso y cargando el modelo de manos…» y luego dice «Cámara activa · procesamiento en este equipo» | Tiempo hasta «activa» |
| 4 | **Palma abierta a la cámara, quieta 1 s** | «✓ Gesto detectado: mano abierta → plano desplegado»; queda una estancia resaltada | ¿Cuántos intentos? |
| 5 | Cierra la mano, ábrela y mantenla quieta 1 s | Pasa al **3D de la misma vivienda**, encuadrado en esa estancia, con la miniatura de planta | ¿Es la misma estancia? |
| 6 | Cierra y abre la mano, luego **desplázala despacio** a un lado (unos 20 cm en 2 s) | La maqueta **gira** sin cambiar de paso | ¿Gira con suavidad? ¿Se para al detener la mano? |
| 7 | Haz un **barrido rápido** con la mano abierta | **No** gira ni avanza | ¿Hubo algún giro o avance indeseado? |
| 8 | Saca la mano del encuadre 2 s | «Mano perdida · gestos en pausa, no se ha cambiado nada» | ¿Cambió algo? |
| 9 | Pulsa «Antes y después» | Avisa de que hace falta una variante guardada y ofrece ir a P10 | — |
| 10 | **«Apagar cámara»** y después **Salir** (o Escape) | El indicador de la cámara del sistema se apaga y vuelves a Entregar en el mismo punto | ¿Se apagó la luz de la cámara? |
| 11 | Repite el paso 3 y sal **mientras carga** el modelo | La cámara se apaga y nada se reactiva después | ¿Se encendió algo al salir? |

## Qué me envías
- El vídeo de cada equipo, con su modelo y navegador.
- Por cada fila: OK o falla y el número de intentos. Basta con una línea por fila.
- Todo lo que te haya resultado confuso aunque haya funcionado.

## Privacidad
Las imágenes se procesan solo en tu equipo: no se graban ni se envían. Tu grabación de pantalla es solo para la revisión. Si aparece tu cara, recórtala antes de compartirla fuera del equipo.
