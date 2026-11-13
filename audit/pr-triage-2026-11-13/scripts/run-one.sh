#!/bin/bash
# run-one.sh <worktree> <outdir> <test>: ejecuta una suite y añade una línea a summary.tsv
WT=$1; OUT=$2; t=$3
export CHROME=/opt/pw-browsers/chromium-1194/chrome-linux/chrome THREE_LOCAL_DIR=vendor/three
cd $WT; s=$(date +%s); timeout 3600 node --test --test-concurrency=1 "$t" > "$OUT/$(basename $t).log" 2>&1; rc=$?
L="$OUT/$(basename $t).log"; p=$(grep -E '^# pass' $L | awk '{print $3}'); f=$(grep -E '^# fail' $L | awk '{print $3}'); k=$(grep -E '^# skipped' $L | awk '{print $3}'); c=$(grep -E '^# cancelled' $L | awk '{print $3}')
echo -e "$t\trc=$rc\tpass=$p\tfail=$f\tskip=$k cancelled=$c\t$(( $(date +%s)-s ))s" >> $OUT/summary.tsv
