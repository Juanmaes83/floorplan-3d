# Hybrid V2: auditoría de la prueba de concepto (05-11-2026)

- **Vídeo revisado como vídeo y además a 2 fps:** `hybrid-v2-poc-salon-cocina.mp4` (13,0 s, 1280×720, 24 fps, 312 fotogramas).
- **Base:** RUBIK `master@0f9c6ea`, sin modificar.
- **Entorno:** Chromium 141 con SwiftShader (CPU).
- **Hybrid V1 grabado hoy en su HEAD `07ae6f9`** con su propio script de evidencia: `hybrid-v1-07ae6f9-forward.mp4` y su manifiesto.

## Proceso: observar → corregir → probar → grabar → inspeccionar

| Ronda | Qué observé | Qué cambié |
|---|---|---|
| Vistas | La capa real del ejemplo sale pálida y plana. El dibujo tenía los muros demasiado grises | Vestido con el catálogo de RUBIK; papel más claro |
| Fijos 1 | Bordes rasgados con islas. Halo amarillo que parecía suciedad. Muro gris moteado como humedad. TV negra en el encuadre | Menos ruido fino; el frente pasa a un trazo de grafito más una subida breve de luz; se quita el yeso del catálogo de los muros del salón |
| Fijos 2 | Muros con islas por la frontera de estancias; techo a parches | La estancia se busca desplazada según la normal; el techo llega el último |
| Fijos 3 | El hueco de la puerta abierta se ve blanco | El exterior se materializa con el salón (4,4 s) |
| Vídeo 1 | **Tirón de cámara en t = 4,4 s:** de 0,18 a 0,59 m/s y de 4 a 15°/s, medido numéricamente | Hermite parametrizada en tiempo real (C¹). Ahora el máximo es de 0,89 m/s y 21,5°/s, sin saltos |
| Fijos 4–5 | La puerta de entrada domina el tramo del comedor; la TV aparece de cerca | Nueva trayectoria: llegada por el norte del paso y giro alejado de la TV |
| Vídeo 2 (entregado) | Ver abajo | — |

## Lo que demuestra

- **Dibujo:** una lámina a grafito sobre la geometría real, con 46 muebles reconocibles, a partir de bordes de profundidad, normal e identidad. Lleva doble trazo leve, rayado solo donde falta luz y líneas que se aclaran con la distancia.
- **Manchas:**
  - once semillas asíncronas sobre protagonistas elegidos;
  - en el salón llegan a 0,9 / 1,75 / 2,35 / 2,9 / 3,45 / 3,95 s;
  - en el comedor y la cocina, a 6,55 / 7,35 / 7,95 / 8,6 / 9,25 s;
  - están ancladas en el mundo y siguen pegadas a su objeto mientras la cámara se mueve.
- **Coexistencia:** entre 4,5 y 5 s, el salón está casi real y el comedor y la cocina siguen dibujados en profundidad (`decisive-4.75s.jpg`).
- **Continuidad:** la cámara sale con el salón hacia el 75 % y termina girando con la cocina hacia el 85 %.
- **Sin círculos ni barrido:**
  - el borde sale del ruido 3D en coordenadas de mundo y de piezas de 45 cm;
  - cada estancia se limita a sí misma (mapa rasterizado desde los polígonos del plano);
  - los muebles secundarios llegan enteros y opacos;
  - el techo llega el último.

## Lo que aún no está al nivel

| Tiempo | Defecto | Causa | Corrección propuesta |
|---|---|---|---|
| 5,0–6,5 s | La pantalla negra de la TV entra por la derecha y pesa en el encuadre | Objeto real oscuro y grande cerca de la trayectoria | En producto, una regla de encuadre que penalice objetos grandes y oscuros a menos de 1,5 m de la línea de visión, igual que hoy se penalizan los muros |
| 6,0–8,5 s | La puerta de entrada abierta y un exterior blanco ocupan la izquierda | Esta vista de RUBIK no dibuja exterior detrás de la puerta | Cerrar la puerta de entrada durante la secuencia (la Story ya controla puertas en «Sección → visita espacial») o encuadrar sin ella |
| 9,5–10,5 s | Bordes rasgados con islas de papel en los muros del comedor | Varias semillas y ruido de frontera demasiado alto en paramentos lisos | En muros, piezas más grandes (panel completo) y menos ruido; el ruido orgánico solo en suelo y muebles |
| 9–13 s | La planta del paso ocupa el primer plano inferior | Está en la línea del paso al comedor | Cámara 10–15 cm más alta en ese tramo, o la planta como marco breve y no sostenido |
| — | El realismo del ejemplo es correcto, no premium | Colores pastel, geometría simple, tejidos sin textura | Decisión 3 de la propuesta (acabados del catálogo) y una luz focal cálida por estancia |
| — | El trazo es limpio pero aún «CAD» | Grosor constante | Variación de presión por curvatura y distancia; esquinas que se prolongan levemente |
| — | Sin medir en GPU, móvil, reversa ni movimiento reducido | La PoC es un prototipo aislado | Checkpoints C4–C5 de la propuesta |

## Coste medido (solo comparativo)

| Medida | Valor |
|---|---|
| Por fotograma, en SwiftShader | 2,3–2,8 s: pase real, pase AUX y composición con 12 muestras de oclusión |
| Vídeo completo | 312 fotogramas en unos 35 min |

Estas cifras no representan una GPU.
