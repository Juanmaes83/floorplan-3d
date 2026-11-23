# bpdp/ · Blueprint 3D y Despiece 3D (candidata)

Runtime sincronizado desde `Juanmaes83/rubik-sculpt-simulator-lab` (BP-DP/premium, corte `c124fe4575695a0b78d5bce12d34135cbbf88e0d`). Esta candidata de integración añade las conexiones de producto y la compatibilidad AVC comprobada en Firefox. Mantener esos cambios al sincronizar el laboratorio de nuevo.

- Home → Descubre RUBIK en acción → demos de Blueprint y Despiece sobre la vivienda de ejemplo. La escena constructiva sintética sigue disponible desde la demo de Despiece, identificada como tal.
- Entregar → La vivienda, para tu cliente → ambos visores. Entregar → Preparar entregables → dos PNG A3 y dos MP4 1080p. El catálogo llama a `BpdpEntregar.preparar` y `descargar` en la revisión activa. La producción de vídeo requiere un codificador WebCodecs H.264. La lámina E3 preexistente mantiene su generador SVG.
- Motores del producto reutilizados: three.js de `vendor/three`, `FloorPlanConstructionMp4`, `RubikShotTimeline`, `RubikFinalCore`, `RubikFinalTitulos`, `FloorPlanBrand`.

## Comprobación de integración

Sirve la raíz del producto en loopback en el puerto 43987 y ejecuta `node --test tests/bpdp-routes.browser.test.cjs` con Playwright, FFmpeg y FFprobe disponibles. `BPDP_BROWSER` acepta `chromium`, `firefox` y `webkit`. El caso auxiliar de Chromium importa el edificio sintético de dos plantas, abre ambos visores y compara el proyecto, la planta, la cámara y la geometría al cerrar.

Para esta candidata se conserva el Studio aislado. Usa un contexto WebGL adicional y las mallas capturadas de RUBIK. Se suspende el visor del editor durante la experiencia y se libera el contexto de Studio al cerrar. La medición local en RTX y el caso de edificio son controles de esta candidata. La fusión requiere resolver la política de recursos frente a G1 y validar el alcance en proyectos más grandes y dispositivos representativos, además de la escala física en A3 y Safari real.
