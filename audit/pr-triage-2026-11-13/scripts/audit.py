#!/usr/bin/env python3
"""Auditoría reproducible, de solo lectura, de las PR abiertas frente a origin/master.
Uso: python3 -I audit.py <repo> <prs.tsv> <master-worktree> > metrics.tsv
Requiere refs pr/<n> (git fetch origin '+refs/pull/*/head:refs/remotes/pr/*')."""
import subprocess, sys, re, json, os
REPO, PRS, MW = sys.argv[1], sys.argv[2], sys.argv[3]
def g(*a, inp=None, ok=False, cwd=REPO):
    r = subprocess.run(['git', '-c', 'core.quotepath=off', *a], cwd=cwd, input=inp, capture_output=True)
    if r.returncode and not ok: raise SystemExit(f"git {a}: {r.stderr.decode()}")
    return r.stdout.decode('utf-8', 'replace') if inp is None or isinstance(inp, bytes) else r.stdout.decode()
def gb(*a, cwd=REPO):
    return subprocess.run(['git', '-c', 'core.quotepath=off', *a], cwd=cwd, capture_output=True).stdout
M = 'refs/remotes/origin/master'
MSHA = g('rev-parse', M).strip()
prs = [l.rstrip('\n').split('\t') for l in open(PRS) if l.strip()]
head_of_branch = {p[2]: p[3] for p in prs}
num_of_branch = {p[2]: p[0] for p in prs}
# Árbol de master: path -> blob ; conjunto de blobs
tree = {}
for l in g('ls-tree', '-r', M).splitlines():
    meta, path = l.split('\t', 1); tree[path] = meta.split()[2]
blobs = set(tree.values())
# Líneas de texto de master por archivo (solo texto, < 2 MB)
TEXT = re.compile(r'\.(js|cjs|mjs|ts|json|html|css|md|yml|yaml|txt|svg|sh|py|csv|tsv)$', re.I)
mlines_by_file, mlines_all = {}, set()
for path, blob in tree.items():
    if not TEXT.search(path): continue
    data = gb('cat-file', 'blob', blob)
    if len(data) > 2_000_000: continue
    s = {x.strip() for x in data.decode('utf-8', 'replace').splitlines() if len(x.strip()) > 25}
    mlines_by_file[path] = s; mlines_all |= s
# patch-ids de master (commits no merge)
def patchids(rng):
    log = gb('log', '-p', '--no-merges', '--format=commit %H', rng)
    out = subprocess.run(['git', 'patch-id', '--stable'], cwd=REPO, input=log, capture_output=True).stdout.decode()
    return {l.split()[0]: l.split()[1] for l in out.splitlines()}  # pid -> commit
master_pids = patchids(M)
# referencias en el log de master
mlog = g('log', M, '--format=%h%x09%s%x09%b%x1e').split('\x1e')
def refs(n):
    rx = re.compile(r'#%s(?!\d)' % n); hits = []
    for e in mlog:
        e = e.strip()
        if e and rx.search(e): hits.append(e.split('\t')[0])
    return hits
print('\t'.join(['pr','head','base_branch','base_ref','ancestor','mb','own_commits','own_pids','pids_in_master',
  'files','A','M','D','ident','differs','absent','added_exclusive','added_blob_elsewhere','add_lines','in_same_file','in_any_file',
  'rev_apply','fwd_apply','master_refs','exclusive_list','differs_list']))
for p in prs:
    n, d, br, h, base = p[:5]
    head = g('rev-parse', f'refs/remotes/pr/{n}').strip()
    if base == 'master': bref = M
    elif base in head_of_branch: bref = f'refs/remotes/pr/{num_of_branch[base]}'
    elif g('rev-parse', '-q', '--verify', f'refs/remotes/origin/{base}', ok=True).strip(): bref = f'refs/remotes/origin/{base}'
    else: bref = M
    anc = subprocess.run(['git', 'merge-base', '--is-ancestor', head, M], cwd=REPO).returncode == 0
    mb = g('merge-base', head, bref).strip()
    ownc = int(g('rev-list', '--count', '--no-merges', f'{mb}..{head}').strip())
    pids = patchids(f'{mb}..{head}')
    inm = sum(1 for pid in pids if pid in master_pids)
    zz = g('diff', '--no-renames', '--name-status', '-z', mb, head).split('\0')
    ns = [[zz[i], zz[i+1]] for i in range(0, len(zz) - 1, 2)]
    cnt = {'A': 0, 'M': 0, 'D': 0}; ident = differs = absent = 0; excl = []; elsewhere = 0; diffl = []
    for st, *paths in ns:
        path = paths[-1]; k = st[0]; cnt[k] = cnt.get(k, 0) + 1
        if k == 'D':
            if path in tree: differs += 1; diffl.append(path + '(D,present)')
            else: ident += 1
            continue
        hb = g('rev-parse', f'{head}:{path}').strip()
        if path not in tree:
            absent += 1
            if hb in blobs: elsewhere += 1
            elif k == 'A': excl.append(path)
            else: diffl.append(path + '(M,absent)')
        elif tree[path] == hb: ident += 1
        else: differs += 1; diffl.append(path)
    # líneas añadidas
    diff = g('diff', '--no-renames', '-U0', mb, head)
    cur = None; tot = same = anyf = 0
    for l in diff.splitlines():
        if l.startswith('+++ '): cur = l[6:] if l.startswith('+++ b/') else None; continue
        if l.startswith('+') and cur:
            s = l[1:].strip()
            if len(s) <= 25: continue
            tot += 1
            if s in mlines_by_file.get(cur, ()): same += 1
            if s in mlines_all: anyf += 1
    # aplicar el parche propio sobre master
    patch = gb('diff', '--no-renames', '--binary', mb, head)
    rev = subprocess.run(['git', 'apply', '-R', '--check'], cwd=MW, input=patch, capture_output=True).returncode == 0
    fwd = subprocess.run(['git', 'apply', '--check'], cwd=MW, input=patch, capture_output=True).returncode == 0
    if not patch.strip(): rev = fwd = 'EMPTY'
    r = refs(n)
    print('\t'.join(map(str, [n, head[:7], base, bref.replace('refs/remotes/', ''), anc, mb[:7], ownc, len(pids), inm,
      len(ns), cnt.get('A',0), cnt.get('M',0), cnt.get('D',0), ident, differs, absent, len(excl), elsewhere, tot, same, anyf,
      rev, fwd, ','.join(r[:6]) + ('…' if len(r) > 6 else ''), ';'.join(excl[:40]), ';'.join(diffl[:40])])))
    sys.stdout.flush()
print(f'# master={MSHA} master_noMerge_patchids={len(master_pids)}', file=sys.stderr)
