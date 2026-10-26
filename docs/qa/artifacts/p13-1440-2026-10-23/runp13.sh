#!/bin/bash
# Runs the real P13 1440x900 case once on a worktree and appends: label sha result seconds error
S=/tmp/claude-0/-home-user/af3e7d78-49af-5a96-8c97-4de1ce7bfb92/scratchpad/p13
export CHROME=/opt/pw-browsers/chromium NODE_PATH=/opt/node-tools/node_modules THREE_LOCAL_DIR=/tmp/claude-0/-home-user-floorplan-3d/af3e7d78-49af-5a96-8c97-4de1ce7bfb92/scratchpad/three/package
cd /home/user/$1; sha=$(git rev-parse --short HEAD); n=$(date +%s)
out=$(PRESENTATION_ARTIFACTS=$S/art-$2 timeout 300 node --test --test-concurrency=1 --test-name-pattern='^R2 P13 presentation PNG is real and restores the view 1440x900$' tests/presentation.browser.test.cjs 2>&1)
echo "$out" > $S/log-$2-$n.txt
res=$(echo "$out" | grep -E "^(ok|not ok) 1 " | head -1 | awk '{print ($1=="ok")?"PASS":"FAIL"}'); [ -z "$res" ] && res=NORESULT
err=$(echo "$out" | grep -m1 -A3 "error:" | tr '\n' ' ' | cut -c1-160); dur=$(echo "$out" | grep -m1 duration_ms | awk '{print int($2/1000)}')
printf '%s\t%s\t%s\t%ss\t%s\n' "$2" "$sha" "$res" "$dur" "$err" | tee -a $S/p13-runs.tsv
git checkout -q -- docs/qa qa-results 2>/dev/null; git clean -fdq docs/qa qa-results 2>/dev/null
