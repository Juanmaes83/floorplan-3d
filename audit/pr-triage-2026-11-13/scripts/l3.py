#!/usr/bin/env python3
"""L3: #70–#90 y #36 frente al squash #96 (f3d7678) y frente a master actual.
Uso: python3 -I l3.py <repo> > l3.tsv  (detalle en l3-detail.txt)"""
import subprocess, sys, os, csv, re
REPO = sys.argv[1]; D = os.path.dirname(os.path.abspath(__file__))
def g(*a, raw=False):
    r = subprocess.run(['git','-c','core.quotepath=off',*a], cwd=REPO, capture_output=True)
    return r.stdout if raw else r.stdout.decode('utf-8','replace')
M = g('rev-parse','refs/remotes/origin/master').strip()
SQ = g('rev-parse','f3d7678').strip()
met = {r['pr']: r for r in csv.DictReader(open(f'{D}/metrics.tsv'), delimiter='\t')}
PRS = ['90','88','87','86','85','84','83','82','81','80','79','78','76','75','74','73','72','71','70','36']
sqdiff = g('show','--format=','--no-renames','-U0',SQ)
sq_add = {x[1:].strip() for x in sqdiff.splitlines() if x.startswith('+') and not x.startswith('+++')}
sq_del = {x[1:].strip() for x in sqdiff.splitlines() if x.startswith('-') and not x.startswith('---')}
wf = '\n'.join(g('show',f'{M}:{p}') for p in g('ls-tree','-r','--name-only',M,'.github/workflows').split())
pkg = g('show', f'{M}:package.json')
det = open(f'{D}/l3-detail.txt','w')
print('\t'.join(['pr','pr_head','base_ref','merge_base','own_commits','files','files_blob_eq_squash','files_blob_eq_master','add_lines','add_in_squash',
                 'del_lines','del_in_squash','tests_pr','tests_in_master','tests_in_ci','squash_in_master','missing_lines']))
for n in PRS:
    r = met[n]; h = g('rev-parse',f'refs/remotes/pr/{n}').strip()
    bref = r['base_ref'] if r['base_ref'].startswith('origin') else 'refs/remotes/'+r['base_ref']
    if bref.startswith('origin'): bref = 'refs/remotes/'+bref
    mb = g('merge-base',h,bref).strip(); oc = g('rev-list','--count','--no-merges',f'{mb}..{h}').strip()
    files = g('diff','--name-only','--no-renames','-z',mb,h).split('\0'); files = [f for f in files if f]
    def blob(c,f): return g('rev-parse','-q','--verify',f'{c}:{f}').strip()
    eq_sq = sum(1 for f in files if blob(h,f) and blob(h,f)==blob(SQ,f))
    eq_m = sum(1 for f in files if blob(h,f) and blob(h,f)==blob(M,f))
    d = g('diff','--no-renames','-U0',mb,h)
    adds = [x[1:].strip() for x in d.splitlines() if x.startswith('+') and not x.startswith('+++') and len(x[1:].strip())>25]
    dels = [x[1:].strip() for x in d.splitlines() if x.startswith('-') and not x.startswith('---') and len(x[1:].strip())>25]
    miss = [x for x in adds if x not in sq_add]
    tests = [f for f in files if re.match(r'tests/.*\.(cjs|js|mjs)$', f)]
    tin = [f for f in tests if blob(M,f)]
    tci = [f for f in tin if os.path.basename(f) in wf or os.path.basename(f) in pkg or 'tests/*.test.cjs' in wf or ('.browser.' not in f and re.search(r'node --test[^\n]*tests', wf))]
    print('\t'.join(map(str,[n,h,r['base_branch'],mb,oc,len(files),eq_sq,eq_m,len(adds),len(adds)-len(miss),len(dels),sum(1 for x in dels if x in sq_del),
        len(tests),len(tin),len(tci),True,len(miss)])))
    det.write(f'=== #{n} head {h}\n  tests: {tests}\n  en master: {tin}\n  en CI: {tci}\n')
    for x in miss: det.write(f'  NO EN SQUASH: {x[:200]}\n')
det.close()
