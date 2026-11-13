#!/usr/bin/env python3
"""L2: evidencia reforzada de #133–#151 frente a sus commits sucesores en master.
Uso: python3 -I l2.py <repo> > l2.tsv  (y l2-detail.txt en el mismo directorio que el script)"""
import subprocess, sys, os
REPO = sys.argv[1]; D = os.path.dirname(os.path.abspath(__file__))
def g(*a, inp=None, raw=False):
    r = subprocess.run(['git','-c','core.quotepath=off',*a], cwd=REPO, input=inp, capture_output=True)
    return r.stdout if raw else r.stdout.decode('utf-8','replace')
M = g('rev-parse','refs/remotes/origin/master').strip()
# pila: pr -> (base PR o None)
STACK = {'133':None,'134':'133','135':'134','136':'135','137':'136','138':'137','139':'138','140':'139','141':'140','142':'141','143':'142',
         '145':'143','146':'145','147':'146','148':'147','149':'148','150':None,'151':'150'}
SUCC = {'133':'6411179','134':'a88c724','135':'ba60b94','136':'bf147e1','137':'2edfb98','138':'f585468','139':'5f89957','140':'96b44ee','141':'77fa761',
        '142':'06abd54','143':'9cc460b','145':'3495c46','146':'c86d496','147':'902bc44','148':'c317d9e','149':'de75f30','150':'b44d40d..9a21b25','151':'579189d'}
def pid(diff):
    o = subprocess.run(['git','patch-id','--stable'], cwd=REPO, input=b'commit 0\n'+diff, capture_output=True).stdout.decode().split()
    return o[0] if o else ''
def added(diff):
    cur=None; out={}
    for l in diff.decode('utf-8','replace').splitlines():
        if l.startswith('+++ '): cur = l[6:] if l.startswith('+++ b/') else None; continue
        if l.startswith('+') and cur and len(l[1:].strip())>25: out.setdefault(cur,set()).add(l[1:].strip())
    return out
det = open(f'{D}/l2-detail.txt','w')
print('\t'.join(['pr','pr_head','base_head','merge_base','own_commits','delta_patchid','succ_first','succ_last','succ_patchid','patchid_equal',
                 'succ_in_master','files_pr','files_common','files_only_pr','files_only_succ','lines_pr','lines_missing_in_succ','lines_extra_in_succ','master_commits_since_on_files']))
for n, b in STACK.items():
    h = g('rev-parse', f'refs/remotes/pr/{n}').strip()
    bh = g('rev-parse', f'refs/remotes/pr/{b}').strip() if b else M
    mb = g('merge-base', h, bh).strip()
    oc = g('rev-list','--count','--no-merges',f'{mb}..{h}').strip()
    pd = g('diff','--no-renames','--binary',mb,h, raw=True)
    s = SUCC[n]
    if '..' in s:
        a, z = s.split('..'); a = g('rev-parse',a).strip(); z = g('rev-parse',z).strip()
        sd = g('diff','--no-renames','--binary',a+'^',z, raw=True)
    else:
        a = z = g('rev-parse',s).strip(); sd = g('diff','--no-renames','--binary',a+'^',a, raw=True)
    inm = all(subprocess.run(['git','merge-base','--is-ancestor',c,M],cwd=REPO).returncode==0 for c in {a,z})
    p1, p2 = pid(pd), pid(sd)
    pf = set(g('diff','--name-only','--no-renames',mb,h).split()); sf = set(g('diff','--name-only','--no-renames',a+'^',z).split())
    pa, sa = added(pd), added(sd)
    miss = {f: sorted(v - sa.get(f,set())) for f, v in pa.items() if v - sa.get(f,set())}
    extra = {f: sorted(v - pa.get(f,set())) for f, v in sa.items() if v - pa.get(f,set())}
    since = g('rev-list','--count',f'{z}..{M}','--',*sorted(pf)).strip() if pf else '0'
    print('\t'.join(map(str,[n,h,bh,mb,oc,p1,a,z,p2,p1==p2,inm,len(pf),len(pf&sf),';'.join(sorted(pf-sf)),';'.join(sorted(sf-pf)),
        sum(len(v) for v in pa.values()), sum(len(v) for v in miss.values()), sum(len(v) for v in extra.values()), since])))
    det.write(f'=== #{n}  head {h}  succ {a}..{z}\n')
    for lab, dd in (('EN LA PR, NO EN EL SUCESOR', miss), ('EN EL SUCESOR, NO EN LA PR', extra)):
        for f, ls in dd.items():
            det.write(f'  [{lab}] {f}: {len(ls)}\n')
            for x in ls[:5]: det.write(f'      {x[:180]}\n')
det.close()
