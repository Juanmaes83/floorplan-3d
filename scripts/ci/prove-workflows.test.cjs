const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const test = require('node:test');

test('the CAT duplicate proof permits exactly one repeated test under the original execution contract', () => {
  const script = String.raw`
import copy
import runpy
import sys

proof = runpy.run_path(sys.argv[1])
check = proof['certified_duplicate']
workflow = proof['CAT_WORKFLOW']
test_file = proof['PROVIDER_TEST']
command = proof['NODE_TEST']
base = {'jobs': {'pure': {'runs-on': 'ubuntu-latest', 'steps': [
    {'uses': 'actions/setup-node@v4', 'with': {'node-version': '22.13.0'}},
    {'name': proof['RETAINED_STEP'], 'run': command + ' tests/api.test.cjs ' + test_file},
    {'name': proof['TRIMMED_STEP'], 'run': command + ' tests/catalog.test.cjs ' + test_file},
]}}}
head = copy.deepcopy(base)
head['jobs']['pure']['steps'][2]['run'] = command + ' tests/catalog.test.cjs'
assert check(workflow, base, head)['test'] == test_file
assert check('.github/workflows/other.yml', base, head) is None
assert check(workflow, base, base) is None

for drift in ({'if': 'false'}, {'env': {'NODE_OPTIONS': '--experimental-test-isolation=none'}},
              {'working-directory': 'other'}, {'continue-on-error': 'true'},
              {'run': command + ' tests/api.test.cjs'}):
    mismatched = copy.deepcopy(base)
    mismatched['jobs']['pure']['steps'][1].update(drift)
    unsafe = copy.deepcopy(head)
    unsafe['jobs']['pure']['steps'][1].update(drift)
    assert check(workflow, mismatched, unsafe) is None

changed = copy.deepcopy(head)
changed['jobs']['pure']['steps'][2]['run'] = command + ' tests/new.test.cjs'
assert check(workflow, base, changed) is None
changed = copy.deepcopy(head)
changed['jobs']['pure']['runs-on'] = 'windows-latest'
assert check(workflow, base, changed) is None
for config in (base, head):
    config['env'] = {'NODE_OPTIONS': '--experimental-test-isolation=none'}
assert check(workflow, base, head) is None
`;
  assert.doesNotThrow(() => execFileSync('python', ['-B', '-c', script, path.join(__dirname, 'prove-workflows.py')]));
});
