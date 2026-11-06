#!/bin/bash
# Regresión EX-3: suites existentes en secuencia, sin concurrencia, sobre el worktree QA (código = 49e8feb).
cd /home/user/floorplan-3d-qa
export CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome FT3D8_M2_SHOTS=${TMPDIR:-/tmp}/regshots
OUT=${TMPDIR:-/tmp}/reg; rm -rf $OUT; mkdir -p $OUT
suite(){ name=$1; shift; s=$(date +%s); node --test --test-concurrency=1 "$@" > $OUT/$name.tap 2>&1; rc=$?; e=$(date +%s);
 p=$(grep -E '^# pass' $OUT/$name.tap|awk '{print $3}'); f=$(grep -E '^# fail' $OUT/$name.tap|awk '{print $3}'); k=$(grep -E '^# skipped' $OUT/$name.tap|awk '{print $3}');
 echo "$name|rc=$rc|pass=$p|fail=$f|skip=$k|$((e-s))s" | tee -a $OUT/summary.txt; }
suite puras $(ls tests/*.test.cjs | grep -v browser)
suite m2-s4 tests/m2-s4.browser.test.cjs
suite gate-d tests/ft3d-8-ux4d.browser.test.cjs tests/ft3d-8-fit.browser.test.cjs tests/ft3d-8-fidelity.browser.test.cjs tests/ft3d-8-dossier.browser.test.cjs tests/ft3d-8-delivery.browser.test.cjs tests/ft3d-8-lab.browser.test.cjs
suite m1 tests/m1-s2-s3.browser.test.cjs
for t in budget-ui economic-dossier professional-workspace professional-entry project-first site-analyze parcel territory-integration brand quantity-schedule presentation-section presentation-story; do suite $t tests/$t.browser.test.cjs; done
