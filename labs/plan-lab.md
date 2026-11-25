# SCULPT 1.1 · Plano, sol y vuelo

Base RUBIK `6ca70a5b49e21346384b034eedf03235921d106d`. Fuente exacta [floorplan-to-3d-house](https://github.com/Juanmaes83/floorplan-to-3d-house/tree/1ec97dc01f997dfd99ebf607ab4e7186f7a6c5d2), MIT. El validador original terminó con código 0 en los dos ejemplos. Se adaptaron los criterios de ancho de hueco, ancho de escalera y superficie de dormitorio al contrato RUBIK. El contexto de la parcela usa las transformaciones nativas, con el modelo en su propio sistema de coordenadas.

## Prueba local

- Desde la raíz, arrancar `python -m http.server 43991 --bind 127.0.0.1` y abrir [Plano, sol y vuelo](http://127.0.0.1:43991/labs/plan-lab.html).
- Ejecutar `node --test labs/plan-validator-poc.test.cjs tests/solar-core.test.cjs tests/surface-core.test.cjs tests/parcel-core.test.cjs`.
- Ejecutar `playwright-cli open http://127.0.0.1:43991/labs/plan-lab.html --browser=chrome` y después `playwright-cli run-code --filename labs/plan-lab.browser.txt`.

El recorrido cubre escritorio y móvil vertical y horizontal, cambios de fecha y distancia de referencia, reproducción y pausa, carga JSON de una y dos plantas, datos ausentes y rechazo de un archivo inválido. La agregación usa superficies sin redondear, como el producto.

## Alcance y límites

- Superficie útil, dormitorios por debajo de la referencia, altura de paso de huecos, alturas declaradas R02-A y huella de planta baja frente a los linderos de una parcela implantada. Falta evidencia suficiente para la altura libre sobre el itinerario de la escalera y para validar cumplimiento urbanístico.
- Sol directo orientativo por estancia en el centro de ventanas exteriores identificables. Intervalos de 15 minutos, orientación y hora local mediante el motor solar existente, y obstrucciones de muros modelados. Las losas, voladizos y el entorno exterior quedan fuera de este modelo. En los días de cambio de hora se informa de que el estudio no está disponible.
- Vuelo helicoidal reproducible y medido con el núcleo de movimiento de RUBIK, sobre una vista reducida de geometría de muros y suelos. La aplicación conecta el vuelo al visor y al exportador MP4 en Presentación → Grabar vídeo.
- La vivienda de referencia usa una parcela y ubicación de demostración. Los proyectos JSON se procesan en la pestaña, en memoria. El laboratorio mantiene su vista separada. La aplicación usa el mismo núcleo de comprobación en Analizar y su visor 3D existente para el vuelo.
