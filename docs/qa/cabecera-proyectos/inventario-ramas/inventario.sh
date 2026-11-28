#!/bin/bash
cd /home/user/hdr
echo "rama,fecha,commits_propios,ficheros,identicos_en_master,ausentes_en_master,distintos,ultimo_asunto"
while read d b rest; do
  files=$(git log --format= --name-only origin/master..$b 2>/dev/null | sort -u | grep -v '^$')
  n=0; same=0; abs=0; diff=0
  for f in $files; do n=$((n+1)); bt=$(git rev-parse -q --verify "$b:$f" 2>/dev/null); mt=$(git rev-parse -q --verify "origin/master:$f" 2>/dev/null)
    if [ -z "$bt" ]; then continue; elif [ -z "$mt" ]; then abs=$((abs+1)); elif [ "$bt" = "$mt" ]; then same=$((same+1)); else diff=$((diff+1)); fi; done
  c=$(git rev-list --count --no-merges origin/master..$b); s=$(git log -1 --format=%s $b | tr ',' ';' | cut -c1-90)
  echo "${b#origin/},$d,$c,$n,$same,$abs,$diff,$s"
done < <(sed "s/ ahead=.*//" /tmp/claude-0/-home-user/8ae691a0-8fef-5086-ba65-d2c190bb8356/scratchpad/ramas.txt)
