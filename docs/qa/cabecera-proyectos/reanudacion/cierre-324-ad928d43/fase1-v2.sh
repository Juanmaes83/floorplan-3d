#!/bin/bash
# Cadena v2 (28/11): un paso cada vez, log completo y código de salida por paso en $S/pasos/<id>.{log,rc}.
# Reanudable: un paso con rc=0 ya registrado no se repite. Tras un reinicio, relanzar este mismo script.
S=/tmp/claude-0/-home-user/8ae691a0-8fef-5086-ba65-d2c190bb8356/scratchpad; P=$S/pasos; mkdir -p $P
export CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome
while pgrep -f "fase1-resto.sh" >/dev/null; do sleep 20; done
paso(){ id=$1; dir=$2; shift 2; [ "$(cat $P/$id.rc 2>/dev/null)" = 0 ] && { echo "$id ya cerrado" >> $P/cadena.log; return; }
 cd $dir; echo "== $id INICIO $(date +%H:%M) sha=$(git rev-parse HEAD)" >> $P/cadena.log; git rev-parse HEAD > $P/$id.sha
 "$@" > $P/$id.log 2>&1; rc=$?; echo $rc > $P/$id.rc; echo "== $id rc=$rc $(date +%H:%M)" >> $P/cadena.log; }
T3=/home/user/efectos/vendor/three
paso 01-p10-a /home/user/integ env THREE_LOCAL_DIR=/home/user/integ/vendor/three timeout 900 node --test --test-name-pattern="§8.3" tests/story-assist.browser.test.cjs
paso 02-p10-b /home/user/integ env THREE_LOCAL_DIR=/home/user/integ/vendor/three timeout 900 node --test --test-name-pattern="§8.3" tests/story-assist.browser.test.cjs
paso 03-efectos-ui /home/user/efectos env THREE_LOCAL_DIR=$T3 timeout 1200 node --test --test-concurrency=1 tests/pelicula-efectos.browser.test.cjs
mkdir -p $S/zip3b-rec $S/zip3b-out
paso 04-efectos-zip /home/user/efectos env PEL_REC=$S/zip3b-rec PEL_OUT=$S/zip3b-out THREE_LOCAL_DIR=$T3 timeout 2400 node --test tests/pelicula-efectos-zip.browser.test.cjs
echo "FIN $(date +%H:%M)" >> $P/cadena.log
