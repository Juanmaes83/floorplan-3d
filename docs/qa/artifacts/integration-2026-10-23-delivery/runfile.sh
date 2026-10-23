#!/bin/bash
# runfile.sh <worktree> <test file> : runs one browser test file serially, records each subtest result for the SHA.
S=/tmp/claude-0/-home-user/af3e7d78-49af-5a96-8c97-4de1ce7bfb92/scratchpad/int2
export CHROME=/opt/pw-browsers/chromium NODE_PATH=/opt/node-tools/node_modules THREE_LOCAL_DIR=/tmp/claude-0/-home-user-floorplan-3d/af3e7d78-49af-5a96-8c97-4de1ce7bfb92/scratchpad/three/package
cd $1; sha=$(git rev-parse --short HEAD); f=$2; log=$S/$(basename $1)-$sha-$(basename $f .cjs).log
timeout ${3:-560} node --test --test-concurrency=1 $f > $log 2>&1; rc=$?
grep -E "^(ok|not ok) [0-9]+ - " $log | sed -E "s/^ok [0-9]+ - (.*)( # SKIP.*)$/SKIP\t\1/;s/^ok [0-9]+ - /PASS\t/;s/^not ok [0-9]+ - /FAIL\t/" | sed "s/^/$sha\t$(basename $f)\t/" | tee -a $S/results-$(basename $1).tsv
[ $rc = 124 ] && echo -e "$sha\t$(basename $f)\tKILLED\trunner timeout ${3:-560}s" | tee -a $S/results-$(basename $1).tsv
grep -E "^# (pass|fail|skipped|cancelled)" $log | tr '\n' ' '; echo
git checkout -q -- docs/qa qa-results 2>/dev/null; git clean -fdq docs/qa qa-results 2>/dev/null
