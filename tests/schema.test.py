"""Independent JSON Schema oracle using the environment's existing jsonschema."""
import json
import re
import subprocess
import unittest
from pathlib import Path
from jsonschema import Draft202012Validator, FormatChecker

ROOT = Path(__file__).resolve().parents[1]

def reject_duplicate_keys(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"Clave JSON duplicada: {key}")
        result[key] = value
    return result

def load_unique_json(path):
    return json.loads(path.read_text(), object_pairs_hook=reject_duplicate_keys)

def browser_schema(source):
    # This module embeds the schema as a JSON literal. Parse before JS evaluation
    # can silently replace a repeated property, including in nested objects.
    literal = source.split('const schema = ', 1)[1]
    schema, end = json.JSONDecoder(object_pairs_hook=reject_duplicate_keys).raw_decode(literal)
    if not literal[end:].lstrip().startswith('; if(typeof module'):
        raise ValueError('Unexpected schema module suffix')
    return schema


class SchemaSourceTests(unittest.TestCase):
    def test_published_contract_status_distinguishes_implementation_from_decisions(self):
        schema = load_unique_json(ROOT / 'docs/contracts/FloorPlanProjectV1.schema.json')
        description = schema['description']
        self.assertRegex(description, r'Contrato de datos implementado')
        self.assertIn('F1a/F1b integrada en master', description)
        self.assertIn('1.2.0', description)
        self.assertIn('WebP estático', description)
        self.assertRegex(description, r'no implica aprobar las decisiones de producto F0 que sigan pendientes')
        self.assertNotRegex(description, r'(?i)propuesta F0|no (?:está )?implementad')
        document = (ROOT / 'docs/contracts/FloorPlanProjectV1.md').read_text()
        self.assertNotRegex(document.split('## 1.', 1)[0], r'(?i)propuesta F0|no (?:está )?implementad')

    def test_duplicate_detector(self):
        for source in ('{"verification":1,"verification":2}',
                       '{"scale":{"verification":1,"verification":2}}',
                       r'{"verification":1,"verifi\u0063ation":2}'):
            with self.subTest(source=source), self.assertRaisesRegex(ValueError, 'Clave JSON duplicada: verification'):
                json.loads(source, object_pairs_hook=reject_duplicate_keys)
        self.assertEqual(json.loads('{"a":{"x":1},"b":{"x":2}}',
                                    object_pairs_hook=reject_duplicate_keys),
                         {'a': {'x': 1}, 'b': {'x': 2}})

    def test_schema_sources_and_runtime_match(self):
        canonical = json.loads((ROOT / 'docs/contracts/FloorPlanProjectV1.schema.json').read_text(),
                               object_pairs_hook=reject_duplicate_keys)
        browser = browser_schema((ROOT / 'js/project-schema.js').read_text())
        runtime = json.loads(subprocess.check_output(
            ['node', '-e', "console.log(JSON.stringify(require('./js/project-schema.js')))"], cwd=ROOT))
        self.assertEqual(browser, canonical)
        self.assertEqual(runtime, canonical)
        for schema in (canonical, browser):
            properties = schema['$defs']['scale']['properties']
            self.assertEqual(list(properties).count('verification'), 1)
            self.assertEqual(properties['verification'], {'$ref': '#/$defs/verification'})
            self.assertEqual(schema['$defs']['verification']['type'], 'object')

    def test_reintroduced_duplicate_fails_in_both_sources(self):
        reference = '"verification": { "$ref": "#/$defs/verification" }'
        canonical = (ROOT / 'docs/contracts/FloorPlanProjectV1.schema.json').read_text()
        browser = (ROOT / 'js/project-schema.js').read_text()
        for source, parse in ((canonical, lambda s: json.loads(s, object_pairs_hook=reject_duplicate_keys)),
                              (browser, browser_schema)):
            self.assertEqual(source.count(reference), 1)
            mutated = source.replace(reference, reference + ',\n' + reference, 1)
            with self.assertRaisesRegex(ValueError, 'Clave JSON duplicada: verification'):
                parse(mutated)


class ContractTests(unittest.TestCase):
    def setUp(self):
        self.schema = load_unique_json(ROOT / 'docs/contracts/FloorPlanProjectV1.schema.json')
        self.validator = Draft202012Validator(
            self.schema, format_checker=FormatChecker())

    def test_reference_matches_authoritative_schema(self):
        raw = subprocess.check_output(
            ['node', '-e', "console.log(JSON.stringify(require('./js/project-core.js').initial()))"], cwd=ROOT)
        self.validator.validate(json.loads(raw))

    def test_json_duplicate_key_guard_rejects_duplicates(self):
        with self.assertRaisesRegex(ValueError, 'Clave JSON duplicada'):
            json.loads('{"duplicate": 1, "duplicate": 2}',
                       object_pairs_hook=reject_duplicate_keys)

    def test_js_schema_matches_canonical_and_scale_has_one_verification_ref(self):
        js_schema = json.loads(subprocess.check_output(
            ['node', '-e', "process.stdout.write(JSON.stringify(require('./js/project-schema.js')))"],
            cwd=ROOT))
        self.assertEqual(js_schema, self.schema)

        source = (ROOT / 'js/project-schema.js').read_text()
        defs_start = source.index('  "$defs": {')
        scale_start = source.index('    "scale": {', defs_start)
        scale_tail = source[scale_start:]
        boundary = re.search(r'(?m)^    "verification": \{', scale_tail)
        self.assertIsNotNone(boundary)
        scale_source = scale_tail[:boundary.start()]
        verification_keys = re.findall(r'(?m)^        "verification":', scale_source)
        self.assertEqual(len(verification_keys), 1)
        self.assertIn('"verification": { "$ref": "#/$defs/verification" }', scale_source)

    def test_valid_f0_example(self):
        self.validator.validate(json.loads((ROOT / 'docs/contracts/examples/floorplan-project-v1.example.json').read_text()))

    def test_f1b_example(self):
        self.validator.validate(json.loads((ROOT / 'docs/contracts/examples/floorplan-project-v1.f1b.example.json').read_text()))

    def test_invalid_f0_example(self):
        errors = list(self.validator.iter_errors(json.loads((ROOT / 'docs/contracts/examples/floorplan-project-v1.invalid.example.json').read_text())))
        # Ajv reports an additional synthetic `if` error. Assert the actual rejected fields.
        rejected = {tuple(error.absolute_path) for error in errors}
        self.assertTrue({('units',), ('scale',), ('scale','method'),
                         ('sourceImages',0,'mediaType'), ('sourceImages',0,'storage','ref'),
                         ('walls',0), ('walls',0,'end','x'), ('rooms',0,'polygon'),
                         ('materials',0), ('objects',0,'rotationDeg')}.issubset(rejected))

if __name__ == '__main__':
    unittest.main()
