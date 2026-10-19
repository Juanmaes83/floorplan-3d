"""Independent JSON Schema oracle for FloorPlanBuildingV1 and its embedded FloorPlanProjectV1 levels."""
import json
import unittest
from pathlib import Path
from jsonschema import Draft202012Validator, FormatChecker
from referencing import Registry, Resource

ROOT = Path(__file__).resolve().parents[1]
CONTRACTS = ROOT / 'docs' / 'contracts'


def validator():
    building = json.loads((CONTRACTS / 'FloorPlanBuildingV1.schema.json').read_text())
    project = json.loads((CONTRACTS / 'FloorPlanProjectV1.schema.json').read_text())
    registry = Registry().with_resources([
        (building['$id'], Resource.from_contents(building)),
        (project['$id'], Resource.from_contents(project)),
    ])
    return Draft202012Validator(building, registry=registry, format_checker=FormatChecker())


class BuildingSchema(unittest.TestCase):
    def test_example_is_valid(self):
        example = json.loads((CONTRACTS / 'examples' / 'floorplan-building-v1.example.json').read_text())
        errors = sorted(validator().iter_errors(example), key=lambda e: list(e.path))
        self.assertEqual([e.message for e in errors], [])

    def test_schema_rejects_unknown_version_field_and_stair_kind(self):
        example = json.loads((CONTRACTS / 'examples' / 'floorplan-building-v1.example.json').read_text())
        for mutate in (lambda b: b.update(schemaVersion='2.0.0'), lambda b: b.update(roof={}),
                       lambda b: b['stairs'][0].update(kind='spiral'), lambda b: b['levels'][1]['project'].update(levels=[])):
            doc = json.loads(json.dumps(example))
            mutate(doc)
            self.assertTrue(list(validator().iter_errors(doc)))


if __name__ == '__main__':
    unittest.main()
