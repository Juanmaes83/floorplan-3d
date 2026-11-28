# Contraste aislado · P10 §8.3 de #324 (`ad928d43`) con Chromium 153 · avc1 y aserciones sin tocar

| Mismo SHA `ad928d43` | Chromium 151 (CI actual, playwright 1.62.1) | **Chromium 153** (playwright 1.63.0) |
|---|---|---|
| P10 §8.3 | **rc 1**, aviso avc1 (`../candidata-ad928d43/p10-8.3-chromium151.log`) | **rc 0**, `ok 1`, 0 avisos (`p10-8.3-chromium153.log`) |
| Códec del vídeo | MP4 `avc1.42E01E` | MP4 `avc1.42E01E` (sin cambios) |
| MP4 del ZIP del cliente | 8,58 s · 35 fotogramas · decodifica | **9,95 s · 138 fotogramas** · decodificación estricta rc 0 · sha256 = manifiesto |
| Reproducción completa en el navegador (sonda) | `ended` 7,37 s | `ended` 10,23 s · 138 decodificados · 0 perdidos · consola vacía |

La descarga es el mismo archivo: la huella del `manifiesto-8-3.json` coincide con los bytes del MP4 del ZIP (comprobado).
(«non monotonically increasing dts» de ffmpeg sale del muxer nulo de salida en 151 y en 153; no es error de decodificación.)

## Cambio mínimo de CI propuesto (NO aplicado: lo autoriza Juanma)
- **Mínimo**: `.github/workflows/consolidation-regression.yml`, líneas 47 y 87: `playwright@1.62.1` → `playwright@1.63.0`
  (trae Chromium 153.0.8010.12). Afecta solo a los jobs `contract` e `historical` de ese workflow.
- **Alcance completo**: la versión está fijada 42 veces en 31 workflows (fijada el 24/11). Cambiar solo uno deja la CI con dos
  Chromium distintos; recomendación: probar primero el mínimo en #324, y si queda verde, igualar los 31 en un PR propio de CI.
- Riesgo: cualquier otra prueba sensible a la versión del navegador; por eso primero el mínimo y su CI completa.
#324 sigue en borrador.
