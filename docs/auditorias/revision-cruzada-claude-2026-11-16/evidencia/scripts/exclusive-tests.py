import subprocess,re,sys,json
def sh(*a):return subprocess.run(a,capture_output=True,text=True).stdout
master_tests=sh('git','ls-tree','-r','--name-only','origin/master','tests').split()
mt=set()
TITLE=re.compile(r"""\btest\(\s*(['"`])((?:\\.|(?!\1).)*)\1""")
for f in master_tests:
    if f.endswith('.cjs') or f.endswith('.mjs'):
        for m in TITLE.finditer(sh('git','show',f'origin/master:{f}')):mt.add(m.group(2))
mtext='\n'.join(sh('git','show',f'origin/master:{f}') for f in master_tests if f.endswith(('.cjs','.mjs')))
for n in sys.argv[1:]:
    files=[f for f in sh('git','diff','--name-only',f'origin/master...pr/{n}').split() if f.startswith(('tests/','tools/rubik-mcp/test/','labs/')) and f.endswith(('.cjs','.mjs'))]
    out=[]
    for f in files:
        src=sh('git','show',f'pr/{n}:{f}')
        for m in TITLE.finditer(src):
            t=m.group(2)
            if t in mt:continue
            # template titles: compare the static prefix
            pre=re.split(r'\$\{',t)[0][:60]
            if pre and pre in mtext:continue
            out.append((f,t[:150]))
    print(f"#{n}: {len(files)} test files changed vs merge-base; titles absent from master: {len(out)}")
    for f,t in out[:40]:print(f"   {f} :: {t}")
