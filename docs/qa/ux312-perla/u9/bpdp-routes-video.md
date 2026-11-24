# bpdp-routes · «dos demos, dos visores y cuatro salidas» — causa comprobada

- **Síntoma en la batería (8368cfa7):** `locator.waitFor: Timeout 90000ms` esperando `e3-descargar-blueprint-video`.
- **Observación ampliada (b0ffb13c, mismo código de prueba; solo se amplían los tiempos de espera en una copia temporal):**
  | Salida | Espera hasta «Descargar» | Archivo |
  |---|---|---|
  | blueprint-lamina | 3 s | PNG 915.815 B |
  | despiece-lamina | 3 s | PNG 883.522 B |
  | blueprint-video | 184 s | MP4 11.233.122 B |
  | despiece-video | 337 s | MP4 12.204.087 B |
  Resultado: `ok 1` con todas las aserciones funcionales (formato, tamaño, densidad PNG, cabecera MP4, foco al cerrar).
- **Reproducción (ffprobe/ffmpeg):** blueprint-video h264 1920×1080 30 fps, 571 fotogramas, 19,03 s; despiece-video h264 1920×1080 30 fps, 646 fotogramas, 21,53 s. `ffmpeg -f null` decodifica ambos completos sin errores.
- **Causa:** el contenedor de pruebas renderiza 3D por software (SwiftShader); la codificación de 1080p supera el margen de 90 s de la prueba. No es un fallo de producto ni de la integración PERLA.
- **Decisión:** se conservan las aserciones y los tiempos de la prueba de Codex; la CI con su hardware es la referencia. Si la CI también supera el margen, se propondrá a Codex ampliar la espera del vídeo, sin relajar ninguna aserción.
