#!/bin/bash
# overlap.sh <pr> <target-ref> : % de líneas (>25) añadidas en .js/.cjs del delta propio de la PR presentes en cualquier .js/.cjs del árbol target
pr=$1; tgt=$2; M=origin/master
mb=$(git merge-base pr/$pr $M)
git diff -U0 $mb pr/$pr -- '*.js' '*.cjs' | grep '^+[^+]' | sed 's/^+//;s/^[[:space:]]*//;s/[[:space:]]*$//' | awk 'length>25' | sort -u > /tmp/ov_a
git ls-tree -r --name-only $tgt | grep -E '\.(js|cjs)$' | while read f; do git show $tgt:"$f"; done | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | awk 'length>25' | sort -u > /tmp/ov_b
t=$(wc -l < /tmp/ov_a); h=$(comm -12 /tmp/ov_a /tmp/ov_b | wc -l); echo "#$pr js lines in $tgt: $h/$t"
