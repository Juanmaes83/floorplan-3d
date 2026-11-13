#!/usr/bin/env python3
"""Líneas añadidas por el delta propio de una PR que no están en el MISMO archivo de master.
Uso: python3 -I missing.py <repo> <metrics.tsv> <pr>..."""
import subprocess, sys, csv
REPO, MET, prs = sys.argv[1], sys.argv[2], sys.argv[3:]
def g(*a): return subprocess.run(['git','-c','core.quotepath=off',*a],cwd=REPO,capture_output=True).stdout.decode('utf-8','replace')
rows = {r['pr']: r for r in csv.DictReader(open(MET), delimiter='\t')}
for n in prs:
    r = rows[n]; head = g('rev-parse', f'refs/remotes/pr/{n}').strip()
    mb = g('merge-base', head, r['base_ref'] if r['base_ref'].startswith('origin') else 'refs/remotes/'+r['base_ref']).strip()
    cache = {}; cur = None; out = {}
    for l in g('diff','--no-renames','-U0',mb,head).splitlines():
        if l.startswith('+++ '): cur = l[6:] if l.startswith('+++ b/') else None; continue
        if l.startswith('+') and cur:
            s = l[1:].strip()
            if len(s) <= 25: continue
            if cur not in cache: cache[cur] = {x.strip() for x in g('show', f'refs/remotes/origin/master:{cur}').splitlines()}
            if s not in cache[cur]: out.setdefault(cur, []).append(s)
    print(f'=== #{n} missing lines by file')
    for f, ls in out.items():
        print(f'  {f}: {len(ls)}')
        for s in ls[:4]: print('     ', s[:150])
