"""Independent 8C-C project/building orthophoto JSON Schema gates."""
import copy
import json
import unittest
from pathlib import Path
from jsonschema import Draft202012Validator, FormatChecker
from referencing import Registry, Resource

ROOT = Path(__file__).resolve().parents[1] / 'docs' / 'contracts'


class OrthophotoSchema(unittest.TestCase):
    def setUp(self):
        project_schema = json.loads((ROOT / 'FloorPlanProjectV1.schema.json').read_text(encoding='utf-8'))
        building_schema = json.loads((ROOT / 'FloorPlanBuildingV1.schema.json').read_text(encoding='utf-8'))
        registry = Registry().with_resources([(s['$id'], Resource.from_contents(s)) for s in (project_schema, building_schema)])
        self.project_validator = Draft202012Validator(project_schema, registry=registry, format_checker=FormatChecker())
        self.building_validator = Draft202012Validator(building_schema, registry=registry, format_checker=FormatChecker())
        self.project = json.loads((ROOT / 'examples' / 'floorplan-project-v1.example.json').read_text(encoding='utf-8'))
        self.building = json.loads((ROOT / 'examples' / 'floorplan-building-v1.example.json').read_text(encoding='utf-8'))
        self.parcel = {
            'reference': '1907401VK4810H', 'sourceCrs': 'EPSG:25830',
            'sourceGeometry': {'type': 'MultiPolygon', 'polygons': [{'rings': [[[0, 0], [1, 0], [1, 1], [0, 1]]]}]},
            'frame': {'sourceCrs': 'EPSG:25830', 'originX': .5, 'originY': .5, 'sourceUnits': 'm', 'xAxis': 'east', 'yAxis': 'north'},
            'source': {'providerId': 'catastro-inspire-cp', 'type': 'official-source', 'license': {'status': 'restricted'}}
        }
        self.ortho = {
            'sourceCrs': 'EPSG:25830', 'extent': {'minX': 0, 'minY': 0, 'maxX': 1, 'maxY': 1},
            'widthPx': 4, 'heightPx': 4, 'requestedResolutionM': .25,
            'resolutionXMPerPx': .25, 'resolutionYMPerPx': .25, 'mediaType': 'image/jpeg',
            'sourcePolicy': 'latest-available',
            'source': {'providerId': 'ign-pnoa-ma-wms', 'type': 'official-source', 'retrievedAt': '2026-10-28T10:00:00Z',
                       'attribution': 'Sistema Cartográfico Nacional', 'license': {'status': 'verified'}}
        }

    def test_project_gate_and_raster_exclusion(self):
        self.project.update(schemaVersion='1.10.0', site={'parcel': self.parcel, 'orthophoto': self.ortho})
        self.project_validator.validate(self.project)
        old = copy.deepcopy(self.project); old['schemaVersion'] = '1.9.0'
        self.assertTrue(list(self.project_validator.iter_errors(old)))
        pixels = copy.deepcopy(self.project); pixels['site']['orthophoto']['imageBlob'] = 'embedded image'
        self.assertTrue(list(self.project_validator.iter_errors(pixels)))
        absent = copy.deepcopy(self.project); del absent['site']['parcel']
        self.assertTrue(list(self.project_validator.iter_errors(absent)))

    def test_building_root_only(self):
        self.building.update(schemaVersion='1.3.0', site={'parcel': self.parcel, 'orthophoto': self.ortho})
        self.building_validator.validate(self.building)
        old = copy.deepcopy(self.building); old['schemaVersion'] = '1.2.0'
        self.assertTrue(list(self.building_validator.iter_errors(old)))
        level = copy.deepcopy(self.building); level['levels'][0]['project'].update(schemaVersion='1.10.0', site={'parcel': self.parcel, 'orthophoto': self.ortho})
        self.assertTrue(list(self.building_validator.iter_errors(level)))


if __name__ == '__main__':
    unittest.main()
