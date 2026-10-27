"""Independent schema oracle for the persisted Point 6 addition."""
import copy
import json
import unittest
from pathlib import Path
from jsonschema import Draft202012Validator, FormatChecker
from referencing import Registry, Resource

ROOT = Path(__file__).resolve().parents[1] / 'docs' / 'contracts'

class SiteSchema(unittest.TestCase):
    def setUp(self):
        project = json.loads((ROOT / 'FloorPlanProjectV1.schema.json').read_text(encoding='utf-8'))
        building = json.loads((ROOT / 'FloorPlanBuildingV1.schema.json').read_text(encoding='utf-8'))
        registry = Registry().with_resources([(project['$id'], Resource.from_contents(project)), (building['$id'], Resource.from_contents(building))])
        self.project = Draft202012Validator(project, registry=registry, format_checker=FormatChecker())
        self.building = Draft202012Validator(building, registry=registry, format_checker=FormatChecker())
        self.p = json.loads((ROOT / 'examples' / 'floorplan-project-v1.example.json').read_text(encoding='utf-8'))
        self.site = {'northOffsetDeg': 25, 'location': {'latitude': 40.4168, 'longitude': -3.7038, 'timeZone': 'Europe/Madrid', 'source': {'providerId': 'manual', 'type': 'user-entered'}}}

    def test_project_legacy_absence_and_new_site(self):
        self.project.validate(self.p)
        self.p.update(schemaVersion='1.7.0', site=self.site)
        self.project.validate(self.p)
        self.p['schemaVersion'] = '1.6.0'
        self.assertTrue(list(self.project.iter_errors(self.p)))

    def test_invalid_or_incomplete_values_are_not_zero_defaults(self):
        self.p.update(schemaVersion='1.7.0', site=self.site)
        for field, value in [('northOffsetDeg', 360), ('northOffsetDeg', None), ('northOffsetDeg', -1)]:
            p = copy.deepcopy(self.p)
            p['site'][field] = value
            self.assertTrue(list(self.project.iter_errors(p)))
        for field, value in [('latitude', ''), ('latitude', 91), ('longitude', 181), ('timeZone', '')]:
            p = copy.deepcopy(self.p)
            p['site']['location'][field] = value
            self.assertTrue(list(self.project.iter_errors(p)))

    def test_building_has_one_optional_root_site(self):
        b = json.loads((ROOT / 'examples' / 'floorplan-building-v1.example.json').read_text(encoding='utf-8'))
        self.building.validate(b)
        b.update(schemaVersion='1.1.0', site=self.site)
        self.building.validate(b)
        b['schemaVersion'] = '1.0.0'
        self.assertTrue(list(self.building.iter_errors(b)))

if __name__ == '__main__':
    unittest.main()
