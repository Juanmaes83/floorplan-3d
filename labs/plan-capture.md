# SCULPT 1.4 · Captura de demos

En RUBIK, abrir Entregar → Preparar presentación → Iniciar presentación → Grabar vídeo. La grabación **Por paradas** usa la captura del lienzo y mantiene el reproductor y la descarga del mismo archivo. **Cinematográfico** y **Vuelo de dron** exportan con H.264 y el muxer MP4 que usa RUBIK. El dron se encuadra sobre la escena activa y reutiliza la cámara, las capas y la cancelación de Presentación.

Para una demo que incluya la interfaz completa (mapa, consultas y botones), utilizar una grabación de la ventana desde una aplicación externa, por ejemplo [OpenScreen](https://github.com/getopenscreen/openscreen). Su documentación cubre Windows, macOS y Linux. La grabación de la ventana es un flujo independiente de la descarga de vídeo de Presentación.

## Validación reproducible

- `node --test tests/tour-video.browser.test.cjs` en Chromium con Playwright disponible.
- `QA_DRONE_MP4` admite una ruta absoluta para guardar la muestra generada por la prueba del dron.
- Validar la decodificación completa con `ffmpeg -v error -i archivo.mp4 -f null -`.
