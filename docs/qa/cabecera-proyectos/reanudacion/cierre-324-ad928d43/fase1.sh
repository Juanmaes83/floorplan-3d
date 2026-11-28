#!/bin/bash
# Fase 1 (validaciones dirigidas, sin renders largos). Espera a la regresión de #324; un paso cada vez.
S=/tmp/claude-0/-home-user/8ae691a0-8fef-5086-ba65-d2c190bb8356/scratchpad; export CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome
while pgrep -f integ-regr-final.sh >/dev/null; do sleep 30; done
echo "INICIO $(date +%H:%M)" > $S/fase1.log
# 1 · avc1: grabación reproducible ×3 en master (base53 = dacb5d39) y ×3 en #324 (integ = ad928d43)
mkdir -p $S/avc1/out
for t in base53 integ; do echo "== avc1 $t $(git -C /home/user/$t rev-parse --short HEAD)" >> $S/fase1.log; (cd $S/avc1 && timeout 1500 node grabar.cjs /home/user/$t $t 3 $S/avc1/out > $S/avc1/$t.json 2>>$S/fase1.log); echo "rc=$?" >> $S/fase1.log; done
# 1b · la prueba de P10 de #324, repetida ×2
cd /home/user/integ && for i in 1 2; do echo "== story-assist $i" >> $S/fase1.log; THREE_LOCAL_DIR=$PWD/vendor/three timeout 900 node --test --test-name-pattern="§8.3" tests/story-assist.browser.test.cjs 2>&1 | grep -E "^(not )?ok|# (pass|fail)|avc1" >> $S/fase1.log; done
# 2 · efectos: Home/Entregar (escritorio, móvil, ES, EN) y ZIP
cd /home/user/efectos && echo "== efectos UI $(git rev-parse --short HEAD)" >> $S/fase1.log
THREE_LOCAL_DIR=$PWD/vendor/three timeout 1200 node --test --test-concurrency=1 tests/pelicula-efectos.browser.test.cjs > $S/efectos-ui.log 2>&1; grep -E "^(not )?ok|# (pass|fail)" $S/efectos-ui.log >> $S/fase1.log
echo "== efectos ZIP" >> $S/fase1.log
mkdir -p $S/efectos-zip-rec $S/efectos-zip-out; PEL_REC=$S/efectos-zip-rec PEL_OUT=$S/efectos-zip-out THREE_LOCAL_DIR=$PWD/vendor/three timeout 2400 node --test tests/pelicula-efectos-zip.browser.test.cjs > $S/efectos-zip.log 2>&1; grep -E "^(not )?ok|# (pass|fail)" $S/efectos-zip.log >> $S/fase1.log
# 3 · previas ligeras de Blender (480×270, 2 muestras, 1 de cada 12 fotogramas) de Maqueta abierta y Pieza a pieza
cd $S/rodaje && for e in maqueta-abierta pieza-a-pieza; do echo "== previa $e" >> $S/fase1.log
 timeout 3600 nice -n 5 ../bpy52/bin/python /home/user/efectos/scripts/interop/blender-rodaje.py -- kit5-f5/escena-preparada kit5-f5 previa-$e --guion $S/previas/guion-$e.json --res 480x270 --samples 2 --paso 12 --tex kit5-f5/rodaje-texturas > previa-$e.log 2>&1; echo "rc=$? $(ls previa-$e/frames 2>/dev/null | wc -l) fotogramas" >> $S/fase1.log; done
echo "FIN $(date +%H:%M)" >> $S/fase1.log
