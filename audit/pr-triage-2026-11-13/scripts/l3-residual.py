#!/usr/bin/env python3
"""Para cada línea añadida por una PR de L3 que no está literal en el squash f3d7678, busca la línea más parecida
del mismo archivo en f3d7678 (difflib) y en master. Uso: python3 -I l3-residual.py <repo> <metrics.tsv> > l3-residual.tsv"""
import subprocess, sys, csv, difflib
REPO, MET = sys.argv[1], sys.argv[2]
def g(*a): return subprocess.run(['git','-c','core.quotepath=off',*a],cwd=REPO,capture_output=True).stdout.decode('utf-8','replace')
met = {r['pr']: r for r in csv.DictReader(open(MET), delimiter='\t')}
SQ='f3d7678'; M='refs/remotes/origin/master'
print('pr\tfile\tsim_squash\tsim_master\tline\tbest_squash')
for n in ['90','81','79','78','73','72','71','70','36']:
    r = met[n]; bref = 'refs/remotes/'+r['base_ref']
    h = g('rev-parse',f'refs/remotes/pr/{n}').strip(); mb = g('merge-base',h,bref).strip()
    cur=None; cache={}
    for l in g('diff','--no-renames','-U0',mb,h).splitlines():
        if l.startswith('+++ '): cur = l[6:] if l.startswith('+++ b/') else None; continue
        if not (l.startswith('+') and cur): continue
        s = l[1:].strip()
        if len(s) <= 25: continue
        if cur not in cache:
            cache[cur] = ([x.strip() for x in g('show',f'{SQ}:{cur}').splitlines() if len(x.strip())>10],
                          [x.strip() for x in g('show',f'{M}:{cur}').splitlines() if len(x.strip())>10])
        sq, ms = cache[cur]
        if s in sq: continue
        def best(pool):
            c = difflib.get_close_matches(s, pool, n=1, cutoff=0)
            return (round(difflib.SequenceMatcher(None, s, c[0]).ratio(),2), c[0]) if c else (0.0, '')
        bs, ls = best(sq); bm, _ = best(ms)
        print(f'{n}\t{cur}\t{bs}\t{bm}\t{s[:140]}\t{ls[:140]}')
