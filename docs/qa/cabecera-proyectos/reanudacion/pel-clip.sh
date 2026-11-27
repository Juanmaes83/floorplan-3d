#!/bin/bash
while pgrep -f integ-regr.sh >/dev/null || pgrep -f hdr-regr-final4.sh >/dev/null; do sleep 30; done
cd /tmp/claude-0/-home-user/8ae691a0-8fef-5086-ba65-d2c190bb8356/scratchpad/rodaje && nice -n 5 ../bpy52/bin/python /home/user/rodaje/scripts/interop/blender-rodaje.py -- kit5-f5/escena-preparada kit5-f5 pel-clip --shot pelicula --timeline pel-f5-timeline.json --res 1280x720 --samples 8 --tex kit5-f5/rodaje-texturas > pel-clip.log 2>&1
ffmpeg -loglevel error -y -framerate 24 -i pel-clip/frames/f%04d.png -c:v libx264 -pix_fmt yuv420p -crf 20 -movflags +faststart -an pel-clip/pelicula-del-plano-a-la-vivienda-720p.mp4 >> pel-clip.log 2>&1
echo FIN >> pel-clip.log
