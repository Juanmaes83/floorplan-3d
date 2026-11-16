#!/usr/bin/env bash
# Sequential, alternating master/branch runs of tests/assets.browser.test.cjs under the same conditions.
# Usage: run.sh <N> <cpus: e.g. 0,1 or all> <label>
N=$1; CPUS=$2; LABEL=$3; OUT=/tmp/claude-0/rec238/assets/runs
declare -A TREE=([master]=/tmp/claude-0/rec238/wt-master [branch]=/home/user/genai)
for i in $(seq 1 $N); do for t in master branch; do
  d=${TREE[$t]}; sha=$(git -C $d rev-parse --short HEAD); f=$OUT/$LABEL-$i-$t-$sha
  { echo "tree=$t sha=$(git -C $d rev-parse HEAD) cpus=$CPUS run=$i"; echo "date=$(date -u +%FT%TZ)"; echo "node=$(node --version) playwright=$(node -e 'console.log(require("playwright/package.json").version)') chrome=$(/opt/pw-browsers/chromium --version)";
    echo "nproc=$(nproc) loadavg=$(cut -d' ' -f1-3 /proc/loadavg) memAvailMB=$(awk '/MemAvailable/{print int($2/1024)}' /proc/meminfo)"; echo "kernel=$(uname -r)"; } > $f.env
  s=$(date +%s.%N)
  if [ "$CPUS" = all ]; then (cd $d && CHROME=/opt/pw-browsers/chromium node --test --test-concurrency=1 --test-reporter=tap tests/assets.browser.test.cjs > $f.tap 2>&1); rc=$?
  else (cd $d && CHROME=/opt/pw-browsers/chromium taskset -c $CPUS node --test --test-concurrency=1 --test-reporter=tap tests/assets.browser.test.cjs > $f.tap 2>&1); rc=$?; fi
  e=$(date +%s.%N); echo "exit=$rc wallS=$(echo "$e - $s" | bc) loadavgEnd=$(cut -d' ' -f1-3 /proc/loadavg)" >> $f.env
  echo "$LABEL $i $t $sha rc=$rc $(grep -E '^# (pass|fail)' $f.tap | tr '\n' ' ') $(grep '^not ok' $f.tap | sed 's/not ok [0-9]* - //' | tr '\n' ';')"
done; done
