"""Independent JSON Schema oracle using the environment's existing jsonschema."""
import json
import subprocess
import unittest
from pathlib import Path
from jsonschema import Draft202012Validator, FormatChecker

ROOT = Path(__file__).resolve().parents[1]

class ContractTests(unittest.TestCase):
    def setUp(self):
        self.validator = Draft202012Validator(
            json.loads((ROOT / 'docs/contracts/FloorPlanProjectV1.schema.json').read_text()),
            format_checker=FormatChecker())

    def test_reference_matches_authoritative_schema(self):
        raw = subprocess.check_output(
            ['node', '-e', "console.log(JSON.stringify(require('./js/project-core.js').initial()))"], cwd=ROOT)
        self.validator.validate(json.loads(raw))

    def test_valid_f0_example(self):
        self.validator.validate(json.loads((ROOT / 'docs/contracts/examples/floorplan-project-v1.example.json').read_text()))

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
