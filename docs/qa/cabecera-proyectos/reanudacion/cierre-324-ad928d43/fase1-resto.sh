#!/bin/bash
# Reanudación tras el compact (28/11): lo que quedó sin ejecutar de fase1.sh, un paso cada vez, sin renders largos.
# Requisitos: worktrees /home/user/{integ,efectos}, venv bpy en $S/bpy52 y kit de prueba $S/rodaje/kit5-f5 (si se perdieron, ver README).
S=/tmp/claude-0/-home-user/8ae691a0-8fef-5086-ba65-d2c190bb8356/scratchpad; export CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome
H=/home/user/hdr/docs/qa/cabecera-proyectos/reanudacion/cierre-324-ad928d43
echo "INICIO $(date +%H:%M)" > $S/fase1-resto.log
cd /home/user/integ && for i in 1 2; do echo "== story-assist §8.3 $i" >> $S/fase1-resto.log; THREE_LOCAL_DIR=$PWD/vendor/three timeout 900 node --test --test-name-pattern="§8.3" tests/story-assist.browser.test.cjs 2>&1 | grep -E "^(not )?ok|# (pass|fail)|avc1" >> $S/fase1-resto.log; done
cd /home/user/efectos && echo "== efectos UI $(git rev-parse --short HEAD)" >> $S/fase1-resto.log
THREE_LOCAL_DIR=$PWD/vendor/three timeout 1200 node --test --test-concurrency=1 tests/pelicula-efectos.browser.test.cjs > $S/efectos-ui.log 2>&1; grep -E "^(not )?ok|# (pass|fail)" $S/efectos-ui.log >> $S/fase1-resto.log
echo "== efectos ZIP $(git rev-parse --short HEAD)" >> $S/fase1-resto.log; mkdir -p $S/efectos-zip-rec $S/efectos-zip-out
PEL_REC=$S/efectos-zip-rec PEL_OUT=$S/efectos-zip-out THREE_LOCAL_DIR=$PWD/vendor/three timeout 2400 node --test tests/pelicula-efectos-zip.browser.test.cjs > $S/efectos-zip.log 2>&1; grep -E "^(not )?ok|# (pass|fail)" $S/efectos-zip.log >> $S/fase1-resto.log
cd $S/rodaje && for e in maqueta-abierta pieza-a-pieza; do echo "== previa $e" >> $S/fase1-resto.log
 timeout 3600 nice -n 5 ../bpy52/bin/python /home/user/efectos/scripts/interop/blender-rodaje.py -- kit5-f5/escena-preparada kit5-f5 previa-$e --guion $H/guion-$e.json --res 480x270 --samples 2 --paso 12 --tex kit5-f5/rodaje-texturas > previa-$e.log 2>&1; echo "rc=$? $(ls previa-$e/frames 2>/dev/null | wc -l) fotogramas" >> $S/fase1-resto.log; done
echo "FIN $(date +%H:%M)" >> $S/fase1-resto.log
