"""Independent JSON Schema gates for the 8C-B durable parcel."""
import copy
import json
import unittest
from pathlib import Path
from jsonschema import Draft202012Validator, FormatChecker
from referencing import Registry, Resource

ROOT = Path(__file__).resolve().parents[1] / 'docs' / 'contracts'

class ParcelSchema(unittest.TestCase):
    def setUp(self):
        p_schema = json.loads((ROOT / 'FloorPlanProjectV1.schema.json').read_text(encoding='utf-8'))
        b_schema = json.loads((ROOT / 'FloorPlanBuildingV1.schema.json').read_text(encoding='utf-8'))
        registry = Registry().with_resources([(item['$id'], Resource.from_contents(item)) for item in (p_schema, b_schema)])
        self.project_validator = Draft202012Validator(p_schema, registry=registry, format_checker=FormatChecker())
        self.building_validator = Draft202012Validator(b_schema, registry=registry, format_checker=FormatChecker())
        self.project = json.loads((ROOT / 'examples' / 'floorplan-project-v1.example.json').read_text(encoding='utf-8'))
        self.building = json.loads((ROOT / 'examples' / 'floorplan-building-v1.example.json').read_text(encoding='utf-8'))
        self.parcel = {
            'reference': '1907401VK4810H', 'sourceCrs': 'EPSG:25830',
            'sourceGeometry': {'type': 'MultiPolygon', 'polygons': [{'rings': [[[0, 0], [1, 0], [1, 1], [0, 1]]]}]},
            'frame': {'sourceCrs': 'EPSG:25830', 'originX': .5, 'originY': .5, 'sourceUnits': 'm', 'xAxis': 'east', 'yAxis': 'north'},
            'source': {'providerId': 'catastro-inspire-cp', 'type': 'official-source', 'license': {'status': 'restricted'}}
        }

    def test_project_version_gate_and_shape(self):
        self.project.update(schemaVersion='1.9.0', site={'parcel': self.parcel})
        self.project_validator.validate(self.project)
        old = copy.deepcopy(self.project); old['schemaVersion'] = '1.8.0'
        self.assertTrue(list(self.project_validator.iter_errors(old)))
        invalid = copy.deepcopy(self.project); invalid['site']['parcel']['sourceGeometry']['extra'] = 'raw GML'
        self.assertTrue(list(self.project_validator.iter_errors(invalid)))

    def test_building_root_authority_only(self):
        self.building.update(schemaVersion='1.2.0', site={'parcel': self.parcel})
        self.building_validator.validate(self.building)
        old = copy.deepcopy(self.building); old['schemaVersion'] = '1.1.0'
        self.assertTrue(list(self.building_validator.iter_errors(old)))
        level = copy.deepcopy(self.building)
        level['levels'][0]['project'].update(schemaVersion='1.9.0', site={'parcel': self.parcel})
        self.assertTrue(list(self.building_validator.iter_errors(level)))

if __name__ == '__main__':
    unittest.main()
