#!/bin/sh
S=/tmp/claude-0/-home-user/8ae691a0-8fef-5086-ba65-d2c190bb8356/scratchpad; R=$S/rodaje
cd $R/kit2-f2-rot30 && $S/bin/blender --background --factory-startup --python-exit-code 1 --python k-v3.py -- escena-preparada . mp4-completo/interior-1440 --tex rodaje-texturas --profile entrega1440 --shot interior --light dia --frames 0-47 2>&1 | grep -E '"frame"|NO_SHOT|Traceback|Error:'
echo "EXIT $(date +%H:%M:%S)"
