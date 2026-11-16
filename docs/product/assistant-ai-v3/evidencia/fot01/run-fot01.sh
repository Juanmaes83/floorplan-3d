#!/usr/bin/env bash
# FOT-01 comparison: whole tests/photo-project.browser.test.cjs, sequential and alternating master ↔ branch, 3 runs each.
OUT=/tmp/claude-0/rec238/fot01/runs; mkdir -p $OUT
declare -A TREE=([master]=/tmp/claude-0/rec238/wt-master [branch]=/home/user/genai)
CMD='CHROME=/opt/pw-browsers/chromium node --test --test-concurrency=1 --test-reporter=tap tests/photo-project.browser.test.cjs'
for i in 1 2 3; do for t in master branch; do d=${TREE[$t]}; sha=$(git -C $d rev-parse HEAD); f=$OUT/$i-$t-${sha:0:7}
  { echo "tree=$t sha=$sha run=$i"; echo "cmd=(cd <tree> && $CMD)"; echo "date=$(date -u +%FT%TZ)"; echo "node=$(node --version) playwright=$(node -e 'console.log(require("playwright/package.json").version)') chrome=$(/opt/pw-browsers/chromium --version)";
    echo "nproc=$(nproc) cpu=$(grep -m1 'model name' /proc/cpuinfo | cut -d: -f2 | xargs) loadavg=$(cut -d' ' -f1-3 /proc/loadavg) memAvailMB=$(awk '/MemAvailable/{print int($2/1024)}' /proc/meminfo) kernel=$(uname -r)"; } > $f.env
  s=$(date +%s.%N); (cd $d && eval "$CMD" > $f.tap 2>&1); rc=$?; e=$(date +%s.%N)
  echo "exit=$rc wallS=$(echo "$e - $s" | bc) loadavgEnd=$(cut -d' ' -f1-3 /proc/loadavg)" >> $f.env
  fot=$(grep -E "^(ok|not ok) [0-9]+ - FOT-01 escritorio" $f.tap | cut -d' ' -f1-2 | sed 's/ [0-9]*$//'); dur=$(grep -A3 -E "^(ok|not ok) [0-9]+ - FOT-01 escritorio" $f.tap | grep -o 'duration_ms: [0-9.]*' | cut -d' ' -f2)
  echo "$i $t ${sha:0:7} exit=$rc file:[$(grep -E '^# (pass|fail|skipped)' $f.tap | tr '\n' ' ')] FOT-01-escritorio=$fot ${dur}ms"
done; done
