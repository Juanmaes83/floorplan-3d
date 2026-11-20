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

test('the additive proof certifies only a new unit file at the end of the intake step', () => {
  const script = String.raw`
import copy
import runpy
import sys

proof = runpy.run_path(sys.argv[1])
check = proof['certified_test_append']
workflow = proof['INTAKE_WORKFLOW']
job = proof['INTAKE_JOB']
file = 'tests/scan-alignment.test.cjs'
command = proof['NODE_TEST'] + ' tests/plan-intake.test.cjs'
base = {'on': {'pull_request': {}, 'workflow_dispatch': {}},
        'jobs': {job: {'runs-on': 'ubuntu-latest', 'steps': [
            {'name': 'Syntax', 'run': 'node --check js/plan-intake.js'},
            {'name': 'Unit regressions', 'run': command},
            {'name': 'Browser', 'run': 'node --test tests/upload.browser.test.cjs'},
        ]}}}
head = copy.deepcopy(base)
step = head['jobs'][job]['steps'][1]
step['run'] += ' ' + file
present = lambda path: path == file
assert check(workflow, base, head, present)['test'] == file
assert check(workflow, base, head, lambda path: False) is None
assert check('.github/workflows/other.yml', base, head, present) is None
for run in (proof['NODE_TEST'] + ' ' + file, command + ' tests/plan-intake.test.cjs',
            command + ' ' + file + ' tests/second.test.cjs',
            command + ' ' + file + ' || true', command + ' ' + file + '\nexit 0',
            proof['NODE_TEST'] + ' ' + file + ' tests/plan-intake.test.cjs',
            command + ' tests/../scan-alignment.test.cjs'):
    variant = copy.deepcopy(head)
    variant['jobs'][job]['steps'][1]['run'] = run
    assert check(workflow, base, variant, lambda path: True) is None
for context in ({'if': 'false'}, {'continue-on-error': 'true'}, {'working-directory': 'test'},
                {'env': {'NODE_OPTIONS': '--test-only'}}, {'shell': 'python'}):
    variant = copy.deepcopy(head)
    variant['jobs'][job]['steps'][1].update(context)
    assert check(workflow, base, variant, present) is None
variant = copy.deepcopy(head)
variant['jobs'][job]['steps'][0]['run'] += '\nnode --check js/scan-alignment.js'
assert check(workflow, base, variant, present) is None
variant = copy.deepcopy(head)
variant['on'].pop('pull_request')
assert check(workflow, base, variant, present) is None
`;
  assert.doesNotThrow(() => execFileSync('python', ['-B', '-c', script, path.join(__dirname, 'prove-workflows.py')]));
});
