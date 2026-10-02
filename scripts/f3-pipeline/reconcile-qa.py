"""Run the existing full suites, without replacing historical screenshot evidence."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser()
parser.add_argument('--node', required=True)
parser.add_argument('--approved', default='5b7267f84380586d5e482373bd70f0392e896009')
parser.add_argument('--out', default='docs/qa/artifacts/f3-reconciliation')
parser.add_argument('--node-pattern')
parser.add_argument('--node-file', action='append')
args = parser.parse_args()
out = (ROOT / args.out).resolve()
out.mkdir(parents=True, exist_ok=False)
env = dict(os.environ, PYTHONUTF8='1', F3_RECONCILE_QA=str(out))
results = []
def run(name, command):
    start = time.monotonic()
    completed = subprocess.run(command, cwd=ROOT, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    (out / (name + '.txt')).write_bytes(completed.stdout)
    result = dict(name=name, command=command, exitCode=completed.returncode, seconds=round(time.monotonic()-start, 3))
    results.append(result)
    print(json.dumps(result), flush=True)
    return completed

visible = ['index.html', 'assets/f3/external.manifest.json', 'assets/f3/ASSET-LAB-NEXT-PROVENANCE.txt']
visible += subprocess.check_output(['git','ls-tree','-r','--name-only',args.approved,'js','assets/f3','assets/materials'], cwd=ROOT, text=True).splitlines()
comparison = []
for name in sorted(set(visible)):
    data = (ROOT/name).read_bytes()
    approved = subprocess.check_output(['git','show',f'{args.approved}:{name}'], cwd=ROOT)
    comparison.append(dict(path=name, bytes=len(data), sha256=hashlib.sha256(data).hexdigest(), equalToApproved=data==approved))
assert all(row['equalToApproved'] for row in comparison), 'Visible assets differ: new human review required'
(out/'approved-content.json').write_text(json.dumps(dict(approved=args.approved,files=comparison,status='PASS'),indent=2)+'\n',encoding='utf-8')
preload = str(ROOT/'scripts/f3-pipeline/reconcile-browser-preload.cjs')
node_command = [args.node,'--require',preload,'--test','--test-concurrency=1']
if args.node_pattern: node_command += ['--test-name-pattern',args.node_pattern]
node_files = args.node_file or [str(p.relative_to(ROOT)) for p in sorted((ROOT/'tests').glob('*.test.cjs'))]
run('node-full', [*node_command,*node_files])
for name in ['schema','f2_readiness','f2_wall_evaluation','f2_raw_export']:
    run('python-'+name,[sys.executable,'scripts/interop/run-python-tests.py','tests/'+name+'.test.py'])
for name in ['pipeline.mjs','integrate.mjs']:
    run('syntax-'+name,[args.node,'--check','scripts/f3-pipeline/'+name])
run('markdown',[sys.executable,'scripts/check-documents.py','README.md','docs/ROADMAP.md','docs/ROADMAP-2-proposal.md','docs/contracts/FloorPlanProjectV1.md','docs/technical/F3-asset-lab-next.md'])
run('diff-check',['git','diff','--check'])
summary = dict(status='PASS' if all(r['exitCode']==0 for r in results) else 'FAIL', results=results, approvedContent='PASS', humanApproval='PRESERVED_ONLY_IF_NO_VISIBLE_CHANGE', node=subprocess.check_output([args.node,'--version'],text=True).strip(),python=sys.version,chrome=env.get('CHROME'),nodePath=env.get('NODE_PATH'))
(out/'validation.json').write_text(json.dumps(summary,indent=2)+'\n',encoding='utf-8')
print(json.dumps(summary),flush=True)
sys.exit(0 if summary['status']=='PASS' else 1)
