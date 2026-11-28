#!/bin/bash
# Película v1.1: espera a que termine la regresión de #324 (una sola tanda pesada), luego vista previa rápida y después el render 720p.
S=/tmp/claude-0/-home-user/8ae691a0-8fef-5086-ba65-d2c190bb8356/scratchpad
while pgrep -f integ-regr-final.sh >/dev/null; do sleep 30; done
cd $S/rodaje
TL=/home/user/rodaje/docs/qa/pelicula-proyecto/entrada/pel-f5-timeline-v1.1.json
nice -n 5 ../bpy52/bin/python /home/user/rodaje/scripts/interop/blender-rodaje.py -- kit5-f5/escena-preparada kit5-f5 pel-v11-prev --shot pelicula --timeline $TL --res 426x240 --samples 2 --tex kit5-f5/rodaje-texturas > pel-v11-prev.log 2>&1
ffmpeg -loglevel error -y -framerate 24 -i pel-v11-prev/frames/f%04d.png -c:v libx264 -pix_fmt yuv420p -crf 23 -an pel-v11-prev/previa.mp4 >> pel-v11-prev.log 2>&1
echo PREVIA-FIN >> pel-v11-prev.log
[ -f $S/pel-v11-STOP ] && exit 0
nice -n 5 ../bpy52/bin/python /home/user/rodaje/scripts/interop/blender-rodaje.py -- kit5-f5/escena-preparada kit5-f5 pel-v11 --shot pelicula --timeline $TL --res 1280x720 --samples 12 --tex kit5-f5/rodaje-texturas > pel-v11.log 2>&1
ffmpeg -loglevel error -y -framerate 24 -i pel-v11/frames/f%04d.png -c:v libx264 -pix_fmt yuv420p -crf 18 -preset slow -movflags +faststart -an pel-v11/pelicula-del-plano-a-la-vivienda-720p-v1.1.mp4 >> pel-v11.log 2>&1
echo FIN >> pel-v11.log
