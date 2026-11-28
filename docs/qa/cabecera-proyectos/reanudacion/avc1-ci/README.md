# Diagnóstico avc1 · P10 §8.3 de #324 con el Chromium exacto de CI · 28/11/2026

**Navegador**: el de CI, instalado aislado (`playwright@1.62.1` → `chromium-1234`, *Google Chrome for Testing 151.0.7922.34*).
Local habitual: Chromium 153 (`chromium-1243`). Sonda reproducible: [`grabar-recorrido.cjs`](grabar-recorrido.cjs).

## 1 · La prueba de la candidata (`ad928d43`) con Chromium 151
- `p10-8.3-chromium151.log`: **código de salida 1**, `not ok 1`, el mismo aviso que CI:
  «When using "avc1" for mp4 encoding, the codec description is not supposed to change…». **Reproducido en local.**
- El vídeo que viaja al cliente dentro del ZIP: `candidata-ad928d43/p10-8.3-video-del-zip-cliente.mp4`.

## 2 · Mismo recorrido de grabación en master (`dacb5d39`), donde la prueba no existe
Recorrido idéntico por la interfaz (Entregar › Preparar presentación › 2 estancias › Iniciar › Grabar vídeo), ejemplo, 1440×900.

| | master dacb5d39 | candidata ad928d43 |
|---|---|---|
| Código de salida de la sonda | 0 | 0 |
| Aviso avc1 en consola durante la grabación | **sí** | **sí** |
| Formato / MIME elegido | MP4 · `avc1.42E01E` | MP4 · `avc1.42E01E` |
| Duración (ffprobe / `<video>`) | 7,36 s / 7,36 s | 7,37 s / 7,37 s |
| Reproducción completa en Chromium (`ended`) | sí, 1280×720 | sí, 1280×720 |
| Decodificación estricta ffmpeg (`-xerror`) | rc 0 | rc 0 |
| Fotogramas · resolución | 38 · todos 1280×720 | 29 · todos 1280×720 |

(El MP4 del ZIP de P10 dura 8,58 s, 35 fotogramas, mismas propiedades.) «dropped» en `resultado.json` es la reproducción a 4× del
probador, no del archivo: la decodificación completa con ffmpeg no pierde ninguno.

## 3 · ¿El aviso corresponde a un defecto del archivo? **No.**
- Un solo `avcC`/`stsd`; los dos fotogramas clave llevan SPS en banda **idéntico** entre sí y **idéntico al del `avcC`**; un solo PPS.
  La descripción del códec no cambia, la resolución no cambia (lienzo fijo 1280×720 en `js/tour-recorder.js`).
- El aviso aparece igual en master: no lo introduce #324; la prueba nueva de #324 lo detecta porque exige cero avisos.
- Con Chromium 153 (local) el mismo recorrido no lo emite (6 grabaciones, 3 master y 3 #324, 27/11): es propio de Chromium 151.

## Recomendación
- **Mantener avc1** para el vídeo del cliente: el archivo es válido, se abre, dura lo esperado y se reproduce completo; avc1 es el
  MP4 de mayor compatibilidad (iPhone/QuickTime, Windows). Cambiar a avc3 por un aviso falso cambiaría el archivo del cliente sin
  beneficio y con más riesgo de compatibilidad; WebM empeora la apertura en iPhone/QuickTime.
- **No relajar la aserción.** Para que CI pase sin tocarla: alinear CI con un Chromium que no emita el aviso espurio
  (Playwright cuya Chromium sea ≥ 153, la versión local verificada), cambio del workflow que decide Juanma (afecta a toda la CI).
- Si se prefiere ensayar otro formato, cualquier cambio debe repetir esta sonda (descarga = mismos bytes, reproducción completa).

**Qué revisar**: la tabla de §2 y la comprobación SPS/avcC de §3; los tres MP4 se pueden abrir directamente desde esta carpeta.
#324 sigue en borrador.
