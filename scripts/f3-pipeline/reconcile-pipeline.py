"""Repeat the six-model conversion and two profile exclusions against preserved sources."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import time

root = Path(__file__).resolve().parents[2]
p = argparse.ArgumentParser()
p.add_argument('--source',required=True)
p.add_argument('--node',required=True)
a = p.parse_args()
out = root/'docs/qa/artifacts/f3-reconciliation/pipeline'
out.mkdir(parents=True,exist_ok=False)
result_path = root/'docs/technical/F3-pipeline-next-results.json'
original = result_path.read_bytes()
(out/'approved-results.json').write_bytes(original)
result = json.loads(original)
source = Path(a.source)
revision = subprocess.check_output(['git','rev-parse','HEAD'],cwd=source,text=True).strip()
assert revision == result['revision']
ids = [r['id'] for r in result['outputs']] + [r['id'] for r in result['rejected']]
paths = [r['outputPath'] for r in result['outputs']] + ['assets/f3/external.manifest.json','assets/f3/ASSET-LAB-NEXT-PROVENANCE.txt','docs/technical/F3-pipeline-inventory.json','docs/technical/F3-pipeline-results.json']
before = {name: hashlib.sha256((root/name).read_bytes()).hexdigest() for name in paths}
commands = [[a.node,'scripts/f3-pipeline/pipeline.mjs','prepare',str(source),'--next',*ids],[a.node,'scripts/f3-pipeline/integrate.mjs','--next']]
executions = []
for index,command in enumerate(commands):
    start = time.monotonic()
    run = subprocess.run(command,cwd=root,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
    (out/f'command-{index}.txt').write_bytes(run.stdout)
    executions.append(dict(command=command,exitCode=run.returncode,seconds=round(time.monotonic()-start,3)))
    if run.returncode: break
after = {name: hashlib.sha256((root/name).read_bytes()).hexdigest() for name in paths}
current = json.loads(result_path.read_bytes())
report = dict(status='PASS' if all(e['exitCode']==0 for e in executions) and before==after and result==current else 'FAIL', sourceRevision=revision,commands=executions,files=[dict(path=k,before=before[k],after=after[k],equal=before[k]==after[k]) for k in paths],normalizedModels=len(current['outputs']),excluded=current['rejected'],resultSemanticallyEqual=result==current,resultByteEqual=original==result_path.read_bytes(),physicalDimensions='NOT_VERIFIED')
(out/'verification.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report),flush=True)
if report['status']!='PASS': raise SystemExit(1)
