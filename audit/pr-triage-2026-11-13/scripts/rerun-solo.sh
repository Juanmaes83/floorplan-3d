#!/bin/bash
# Repite en solitario (sin otra suite en paralelo) las suites que se cortaron por tiempo en la tanda paralela.
T=$(dirname "$0"); until grep -q DONE $T/l3-test-logs/summary.tsv; do sleep 20; done
: > $T/l3-test-logs/rerun/summary.tsv
for t in tests/browser.test.cjs tests/presentation.browser.test.cjs; do
  sed -i 's/timeout 2400/timeout 3600/' $T/run-one.sh
  $T/run-one.sh $T/mw $T/l3-test-logs/rerun $t
done
echo DONE >> $T/l3-test-logs/rerun/summary.tsv
