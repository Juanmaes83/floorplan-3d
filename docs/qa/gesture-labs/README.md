# Gesture Labs §6 · ensayo aislado «Presentar con gestos»

**Rama:** `claude/gesture-labs` · base `cd694e88` (StoryLayersV1 aprobado). **Estado:** laboratorio aislado; no es una función
publicada. Solo se carga con `?gesture-lab=1`; sin ese parámetro, RUBIK no cambia.

## Autorización y procedencia de las piezas
- Autorización del propietario (27/11/2026): los donantes son suyos y públicos; se pueden consultar y adaptar sus piezas
  según el encargo y sus SHA fijados.
- **Director de Orquesta** @ `dcf4b7ac`:
  - *Antes y después de reforma v2.1.2*: clasificación por dedos extendidos con EMA de apertura (0,52/0,48), estabilización
    (OPEN 2 · FIST 4 · HOLDING 5), deslizamiento (|dx| ≥ 0,18, |dy| ≤ 0,11, ≥ 0,55/s, ventana de 520 ms y 850 ms entre
    disparos), mano perdida a 700 ms sin disparo y parada de pistas → **adaptado** en `gesture-core.js`.
  - *Bola Imagen v1.3*: despliegue animado de una imagen → **adaptado** como despliegue del plano (`gl-unfold`, respeta
    «movimiento reducido»).
  - *Air Guitar V2*: **descartado** en este corte; con dos gestos no hace falta distinguir funciones por mano.
- **map-gesture-controls · La Batuta v0.2** @ `6939d43a`: tutorial corto siempre visible, indicador de cámara (punto de estado y
  texto) y modo sin cámara con el mismo recorrido → **adaptados** a la barra y al HUD del laboratorio. OpenLayers no se usa.
- No se copia interfaz, marca ni recursos de los donantes.

## Qué hace
Vivienda real de RUBIK (proyecto de ejemplo) con **dos revisiones guardadas**: el original y su variante de P10, que tiene un
mueble retirado y guardado.

| Paso | Qué se ve | Gesto | Control equivalente |
|---|---|---|---|
| 1 · Plano | plano guardado de la revisión «antes» que se despliega; rótulo «Imagen del plano guardado · revisión …» y estancia resaltada (Salón) | mano abierta quieta ≥ 600 ms = siguiente | «Siguiente →», → o Espacio |
| 2 · Vista 3D | visor 3D **interactivo** de la misma revisión, encuadrado en el Salón; el rótulo lo dice | mano abierta = siguiente | igual |
| 3 · Antes y después | plano de las dos revisiones con el mismo encuadre y la misma escala; llamadas con valor, unidad, fuente, revisión (nombre y fecha de guardado) y estado | mano cerrada y deslizar = antes/después | «Ver después/antes», A/D |

Además:
- Si se pierde la mano durante 700 ms, se pausan los gestos sin disparar nada; la vista se conserva y los botones siguen.
- Si se deniega el permiso de cámara, aparece un aviso y la presentación sigue con botones y teclado.
- Al salir, al apagar la cámara o al ocultar la pestaña, las pistas de la cámara se detienen.
- Nada se escribe en el proyecto y no se graba ni se guarda imagen. El modelo de manos de MediaPipe se descarga del CDN solo al
  activar la cámara.

## Pruebas y evidencia
- `tests/gesture-core.test.cjs`: 7/7. Clasificación, un solo disparo por gesto sostenido, apertura breve sin disparo,
  deslizamiento en espejo con enfriamiento, movimiento lento o vertical ignorado, y mano perdida sin acción.
- `tests/gesture-lab.browser.test.cjs`: 3/3. Recorrido completo en 1440×900 y 390×844 con **gestos sintéticos** inyectados
  (`RubikGestureLab.feed`) y una pista de cámara simulada. Comprueba:
  - siguiente por gesto, botón y teclado;
  - deslizar a «después»;
  - pérdida de la mano;
  - continuidad con los botones;
  - las llamadas;
  - que al salir las pistas queden en `ended`;
  - que no haya chino con el laboratorio abierto;
  - el caso de permiso denegado.
- Vídeos: `video/gl-recorrido-{escritorio,movil}.mp4`. Capturas: `gl-{1-plano,2-3d,3-antes,4-despues}-{escritorio,movil}.png`.
- Entorno: Chromium (Playwright) sin interfaz, en el contenedor. No hay webcam física.

## Pendiente de comprobar con cámara real (no hay webcam en este entorno)
- Clasificación real con MediaPipe Hands: iluminación, distancia y fondos.
- Disparos involuntarios en uso real.
- Comodidad de los 600 ms de «mano abierta quieta».
- Comportamiento en portátil y móvil con cámara frontal.
- Prueba de usabilidad con una persona que no conozca la demo.

Reproducir: abre `/?gesture-lab=1`, pulsa «Presentar con gestos · laboratorio» y después «Activar cámara (opcional)». Hace
falta HTTPS o localhost, y una variante guardada con algún cambio (Entregar → P10).

## Dónde se integraría en Entregar
Como acción de la ficha **P1 «Presentación 3D»**: «Presentar con gestos (opcional)», junto a «Preparar presentación». Abriría
este mismo recorrido con la revisión activa y su variante de P10. Antes de integrarlo hacen falta la prueba con cámara real y
tu aprobación.
