#!/bin/bash
# Runs each presentation case on its own and records it; skips cases already recorded for the same SHA.
S=/tmp/claude-0/-home-user/af3e7d78-49af-5a96-8c97-4de1ce7bfb92/scratchpad/regF
export THREE_LOCAL_DIR=/tmp/claude-0/-home-user-floorplan-3d/af3e7d78-49af-5a96-8c97-4de1ce7bfb92/scratchpad/three/package CHROME=/opt/pw-browsers/chromium NODE_PATH=/opt/node-tools/node_modules
cd /home/user/fp-int; sha=$(git rev-parse --short HEAD); R=$S/resumable-$sha.tsv; touch $R
while IFS= read -r name; do
 grep -qF "	$name" $R && continue
 pat=$(printf '%s' "$name" | sed 's/[][\.*^$()+?{}|/]/\\&/g')
 out=$(timeout 600 node --test --test-concurrency=1 --test-name-pattern="^${pat}\$" tests/presentation.browser.test.cjs 2>&1)
 res=$(echo "$out" | grep -E "^(ok|not ok) 1 " | head -1 | awk '{print ($1=="ok")?"PASS":"FAIL"}'); err=$(echo "$out" | grep -m1 -A1 "error:" | grep -v "^ *error: *|-$" | sed "s/^ *\(error: *\)\{0,1\}//" | head -1 | cut -c1-80); dur=$(echo "$out" | grep -m1 duration_ms | awk '{print int($2/1000)}')
 [ -z "$res" ] && res=NORESULT; case "$err" in *"timed out"*) res=TIMEOUT;; esac
 printf '%s\t%s\t%ss\t%s\n' "$res" "$name" "$dur" "$err" | sed "s/^\([A-Z]*\)\t/\1\t/" >> $R
 git checkout -q -- docs/qa qa-results 2>/dev/null; git clean -fdq docs/qa qa-results 2>/dev/null
done < $S/pres-names.txt
echo DONE >> $S/resumable-$sha.done
