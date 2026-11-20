import copy
import json
import pathlib
import re
import subprocess
import sys

import yaml

CAT_WORKFLOW = '.github/workflows/cat-ia-v1.yml'
PROVIDER_TEST = 'tests/photo-reform-provider.test.cjs'
RETAINED_STEP = 'photo-reform/1 server (closed by default) against a LOCAL fake provider, and its browser client without provider secrets'
TRIMMED_STEP = 'CatalogProductV1 core, and the guards of R03, R02-A and the photo project with the catalogue loaded'
NODE_TEST = 'node --test --test-concurrency=1'
INTAKE_WORKFLOW = '.github/workflows/multiformat-import.yml'
INTAKE_JOB = 'import-and-regressions'
INTAKE_UNIT_STEP = 'Unit regressions'
UNIT_FILE = r'tests/[a-z0-9][a-z0-9_-]*\.test\.cjs'


def normalized(jobs):
    return json.dumps(jobs, sort_keys=True).replace(
        'github.event.pull_request.head.sha }}',
        'github.event.pull_request.head.sha || github.sha }}',
    )


def certified_duplicate(workflow, base, head):
    if workflow != CAT_WORKFLOW:
        return None
    expected = copy.deepcopy(base)
    pure = expected['jobs'].get('pure', {})
    if any(key in config for config in (base, pure) for key in ('env', 'defaults')):
        return None
    steps = pure.get('steps', [])
    retained = [i for i, step in enumerate(steps) if step.get('name') == RETAINED_STEP]
    trimmed = [i for i, step in enumerate(steps) if step.get('name') == TRIMMED_STEP]
    if len(retained) != 1 or len(trimmed) != 1 or retained[0] >= trimmed[0]:
        return None
    node_steps = [step for step in steps if step.get('uses', '').startswith('actions/setup-node@')]
    if node_steps != [{'uses': 'actions/setup-node@v4', 'with': {'node-version': '22.13.0'}}]:
        return None
    if steps.index(node_steps[0]) >= retained[0]:
        return None

    for index in (retained[0], trimmed[0]):
        step = steps[index]
        if set(step) != {'name', 'run'} or '\n' in step['run']:
            return None
        words = step['run'].split()
        if words[:3] != NODE_TEST.split() or words[3:].count(PROVIDER_TEST) != 1:
            return None
        if len(words) < 5 or not all(re.fullmatch(r'tests/[\w.-]+\.test\.cjs', path) for path in words[3:]):
            return None

    command = steps[trimmed[0]]['run']
    steps[trimmed[0]]['run'] = ' '.join(word for word in command.split() if word != PROVIDER_TEST)
    if expected != head:
        return None
    return {
        'job': 'pure',
        'test': PROVIDER_TEST,
        'command': NODE_TEST,
        'retainedStep': RETAINED_STEP,
        'trimmedStep': TRIMMED_STEP,
        'scope': 'one duplicate file invocation; the original file still runs in the same job',
    }


def certified_test_append(workflow, base, head, new_test):
    if workflow != INTAKE_WORKFLOW:
        return None
    expected = copy.deepcopy(base)
    old_steps = expected['jobs'][INTAKE_JOB]['steps']
    new_steps = head['jobs'].get(INTAKE_JOB, {}).get('steps', [])
    matches = [i for i, step in enumerate(old_steps) if step.get('name') == INTAKE_UNIT_STEP]
    if len(matches) != 1 or len(old_steps) != len(new_steps):
        return None
    i = matches[0]
    step, after = old_steps[i], new_steps[i]
    if set(step) != {'name', 'run'} or set(after) != set(step):
        return None
    command = step['run']
    if not re.fullmatch(NODE_TEST + f'(?: {UNIT_FILE})+', command):
        return None
    extension = re.fullmatch(re.escape(command) + f' ({UNIT_FILE})', after['run'])
    if extension is None:
        return None
    filename = extension[1]
    step['run'] = after['run']
    if expected != head or filename in command.split() or not new_test(filename):
        return None
    return {'job': INTAKE_JOB, 'step': INTAKE_UNIT_STEP, 'test': filename,
            'command': NODE_TEST, 'scope': 'one new regular test file appended; original invocations preserved'}


def tree_entry(ref, path):
    return subprocess.check_output(['git', 'ls-tree', '--full-tree', ref, '--', path]).decode().strip()


def read(ref, workflow):
    return yaml.load(subprocess.check_output(['git', 'show', f'{ref}:{workflow}']), Loader=yaml.BaseLoader)


def main(base, head, output):
    files = subprocess.check_output(['git', 'ls-tree', '-r', '--name-only', base, '.github/workflows']).decode().splitlines()
    results = []
    for workflow in files:
        before, after = read(base, workflow), read(head, workflow)
        result = {'workflow': workflow, 'existingTriggers': 'unchanged', 'dispatch': 'enabled'}
        if normalized(before['jobs']) == normalized(after['jobs']):
            result['jobsAndAssertions'] = 'unchanged except explicit head SHA fallback for dispatch'
        else:
            duplicate = certified_duplicate(workflow, before, after)
            addition = None if duplicate else certified_test_append(
                workflow, before, after,
                lambda path: not tree_entry(base, path) and tree_entry(head, path).startswith('100644 blob '),
            )
            if not duplicate and not addition:
                raise SystemExit(workflow + ' changed execution contracts')
            if duplicate:
                result['jobsAndAssertions'] = 'unique test coverage preserved; one repeated invocation removed'
                result['certifiedDuplicate'] = duplicate
            else:
                result['jobsAndAssertions'] = 'original invocations preserved; one new unit test file appended'
                result['certifiedTestAppend'] = addition
        if not all(k in after['on'] and after['on'][k] == v for k, v in before['on'].items()):
            raise SystemExit(workflow + ' changed previous triggers')
        if 'workflow_dispatch' not in after['on']:
            raise SystemExit(workflow + ' has no manual dispatch')
        results.append(result)
    pathlib.Path(output).write_text(json.dumps(results, indent=2) + '\n')
    duplicates = sum('certifiedDuplicate' in result for result in results)
    additions = sum('certifiedTestAppend' in result for result in results)
    print(f'{len(results)} original workflow contracts checked; {duplicates} certified duplicate invocations removed; {additions} certified test additions')


if __name__ == '__main__':
    main(*sys.argv[1:])
