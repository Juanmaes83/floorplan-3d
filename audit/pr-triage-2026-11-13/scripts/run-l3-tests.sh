#!/bin/bash
# Ejecuta sobre un worktree de master las pruebas que las PR de L3 añadieron o modificaron.
# Uso: run-l3-tests.sh <worktree-master> <l3-tests.tsv> <outdir>
WT=$1; LIST=$2; OUT=$3; mkdir -p $OUT
export CHROME=/opt/pw-browsers/chromium-1194/chrome-linux/chrome THREE_LOCAL_DIR=vendor/three
cd $WT
: > $OUT/summary.tsv
cut -f1 $LIST | grep -v editor-fixture | sort -t. -k2 | while read t; do
  s=$(date +%s); timeout 1200 node --test --test-concurrency=1 "$t" > "$OUT/$(basename $t).log" 2>&1; rc=$?
  p=$(grep -E '^# pass' "$OUT/$(basename $t).log" | awk '{print $3}'); f=$(grep -E '^# fail' "$OUT/$(basename $t).log" | awk '{print $3}'); k=$(grep -E '^# skipped' "$OUT/$(basename $t).log" | awk '{print $3}')
  echo -e "$t\trc=$rc\tpass=$p\tfail=$f\tskip=$k\t$(( $(date +%s)-s ))s" | tee -a $OUT/summary.tsv
done
echo DONE >> $OUT/summary.tsv
