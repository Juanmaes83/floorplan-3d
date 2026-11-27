# MP4 completo · tapicería v3 · 2 s a 1440p — EN PAUSA (decisión del propietario)

- **Estado:** 3 de 48 fotogramas (`f0000`–`f0002`); **primer fotograma pendiente: `f0003`**. Proceso detenido el 27/11.
- **Salida (temporal):** `scratchpad/rodaje/kit2-f2-rot30/mp4-completo/interior-1440/frames/`
  (scratchpad = `/tmp/claude-0/-home-user/8ae691a0-8fef-5086-ba65-d2c190bb8356/scratchpad`). Si se pierde, se rehace con el mismo comando.
- **Kit:** `scripts/interop/blender-rodaje.py` (copia de trabajo `k-v3.py`, sha256 `8bfc80f4b0408f59…`), Blender 5.2.1 `bpy`.
- **Escena:** «escena preparada» del kit `kit2-f2-rot30` (proyecto de ejemplo, giro 30°), texturas `rodaje-texturas`.

## Comando exacto (continúa por el primer fotograma que falte)
```bash
cd <scratchpad>/rodaje/kit2-f2-rot30 && <scratchpad>/bin/blender --background --factory-startup --python-exit-code 1 \
  --python k-v3.py -- escena-preparada . mp4-completo/interior-1440 --tex rodaje-texturas \
  --profile entrega1440 --shot interior --light dia --frames 0-47
```
Script equivalente: `mp4-reanudar.sh` (en esta carpeta). Coste medido: ~600 s por fotograma en 4 núcleos con la CPU libre
(≈ 7,5 h para los 45 restantes). No lanzar en paralelo con regresiones (cada pausa lo retrasa).

## Montaje al terminar
```bash
ffmpeg -framerate 24 -i frames/f%04d.png -c:v libx264 -pix_fmt yuv420p -crf 18 tapiceria-v3_salon_1440p_2s.mp4
```
Publicar en `docs/qa/rodaje/tapiceria-v3/movimiento/` con enlace raw directo. La carta de materiales va después.
