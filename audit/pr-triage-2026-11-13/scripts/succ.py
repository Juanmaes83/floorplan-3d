#!/usr/bin/env python3
"""Compara el delta propio de una PR con el commit (o rango) sucesor de master.
Uso: python3 -I succ.py <repo> <metrics.tsv> <pr>=<commit>[+<commit>...] ...
Salida: pr, sucesor, patch-id igual, archivos PR, archivos comunes, líneas PR, % en el diff sucesor."""
import subprocess, sys, csv
REPO, MET = sys.argv[1], sys.argv[2]
def g(*a, inp=None):
    return subprocess.run(['git','-c','core.quotepath=off',*a],cwd=REPO,input=inp,capture_output=True).stdout
rows = {r['pr']: r for r in csv.DictReader(open(MET), delimiter='\t')}
def added(diff):
    cur=None; out={}
    for l in diff.decode('utf-8','replace').splitlines():
        if l.startswith('+++ '): cur = l[6:] if l.startswith('+++ b/') else None; continue
        if l.startswith('+') and cur and len(l[1:].strip())>25: out.setdefault(cur,set()).add(l[1:].strip())
    return out
def pid(diff):
    o = subprocess.run(['git','patch-id','--stable'],cwd=REPO,input=diff,capture_output=True).stdout.decode().split()
    return o[0] if o else ''
print('pr\tsuccessor\tpatchid_equal\tpr_files\tcommon_files\tpr_lines\tlines_in_successor\tpct')
for arg in sys.argv[3:]:
    n, cs = arg.split('='); r = rows[n]
    head = g('rev-parse', f'refs/remotes/pr/{n}').decode().strip()
    bref = r['base_ref'] if r['base_ref'].startswith('origin') else 'refs/remotes/'+r['base_ref']
    mb = g('merge-base', head, bref).decode().strip()
    pd = g('diff','--no-renames','-U3',mb,head)
    sd = b''.join(g('show','--format=','--no-renames','-U3','-m','--first-parent',c) for c in cs.split('+'))
    pa, sa = added(pd), added(sd)
    tot = sum(len(v) for v in pa.values()); hit = sum(len(v & sa.get(f,set())) for f,v in pa.items())
    same = 'n/a' if '+' in cs else str(pid(b'commit 0\n'+pd)==pid(b'commit 0\n'+g('show','--format=','--no-renames','-U3','-m','--first-parent',cs)))
    print(f"{n}\t{cs}\t{same}\t{len(pa)}\t{len(set(pa)&set(sa))}\t{tot}\t{hit}\t{(100*hit/tot if tot else 0):.0f}%")
