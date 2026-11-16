import sys,re,json,os
# Per-model load times for the Asset Lab scenes: from the diagnostic (passing tests) or the assertion message (failing).
for p in sys.argv[1:]:
    t=re.sub(r'^\d{4}-\d{2}-\d{2}T[\d:.]+Z ','',open(p,encoding='utf8',errors='replace').read(),flags=re.M)
    tag=os.path.basename(p).rsplit('.',1)[0]
    for m in re.finditer(r'# (\{"viewport".*\})\s*$',t,flags=re.M):
        d=json.loads(m.group(1))
        if 'states' not in d: continue
        vp=f"{d['viewport']['width']}x{d['viewport']['height']}";kind='cohort' if 'ids' in d else 'mixed'
        ms=[round(s['durationMs']) if s.get('durationMs') is not None else '-' for s in d['states']]
        print(tag,kind,vp,'ok',0,ms)
    for m in re.finditer(r'not ok \d+ - ((normalized Asset Lab mixed scene|next Asset Lab cohort renders and persists) (\d+x\d+))[\s\S]*?error: \'(\[.*?\])\'',t):
        st=json.loads(m.group(4));print(tag,'mixed' if 'mixed' in m.group(2) else 'cohort',m.group(3),'FAIL',sum(s['state']=='error' for s in st),[round(s['durationMs']) if s.get('durationMs') else 'ABORT' for s in st])
