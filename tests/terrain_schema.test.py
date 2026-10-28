"""Independent 8C-D terrain metadata gates; no grid bytes are durable."""
import copy
import json
import unittest
from pathlib import Path
from jsonschema import Draft202012Validator, FormatChecker
from referencing import Registry, Resource

ROOT = Path(__file__).resolve().parents[1] / 'docs' / 'contracts'

class TerrainSchema(unittest.TestCase):
    def setUp(self):
        ps = json.loads((ROOT / 'FloorPlanProjectV1.schema.json').read_text(encoding='utf-8'))
        bs = json.loads((ROOT / 'FloorPlanBuildingV1.schema.json').read_text(encoding='utf-8'))
        registry = Registry().with_resources([(s['$id'], Resource.from_contents(s)) for s in (ps, bs)])
        self.pv = Draft202012Validator(ps, registry=registry, format_checker=FormatChecker())
        self.bv = Draft202012Validator(bs, registry=registry, format_checker=FormatChecker())
        self.project = json.loads((ROOT / 'examples' / 'floorplan-project-v1.example.json').read_text(encoding='utf-8'))
        self.building = json.loads((ROOT / 'examples' / 'floorplan-building-v1.example.json').read_text(encoding='utf-8'))
        e = {'minX': 0, 'minY': 0, 'maxX': 20, 'maxY': 20}
        self.parcel = {'reference':'1907401VK4810H','sourceCrs':'EPSG:25830','sourceGeometry':{'type':'MultiPolygon','polygons':[{'rings':[[[0,0],[20,0],[20,20],[0,20]]]}]},'frame':{'sourceCrs':'EPSG:25830','originX':10,'originY':10,'sourceUnits':'m','xAxis':'east','yAxis':'north'},'source':{'providerId':'fixture','type':'derived'}}
        self.terrain = {'sourceCrs':'EPSG:25830','requestedExtent':e,'coverageExtent':e,'sampleDomain':{'minX':2.5,'minY':2.5,'maxX':17.5,'maxY':17.5},'cols':4,'rows':4,'cellSizeX':5,'cellSizeY':5,'verticalReference':'orthometric','sampleModel':'cell-center','resolutionM':5,'productName':'MDT05 primera cobertura','coverageId':'Elevacion25830_5','source':{'providerId':'ign-mdt05-terrain','type':'official-source','sourceId':'Elevacion25830_5','retrievedAt':'2026-10-28T10:00:00Z','attribution':'SCNE','license':{'status':'verified','name':'CC BY 4.0'}}}

    def test_project_version_and_metadata_only(self):
        self.project.update(schemaVersion='1.11.0',site={'parcel':self.parcel,'terrain':self.terrain})
        self.pv.validate(self.project)
        old = copy.deepcopy(self.project); old['schemaVersion']='1.10.0'; self.assertTrue(list(self.pv.iter_errors(old)))
        for field in ('values','rawCoverage','mesh'):
            bad=copy.deepcopy(self.project); bad['site']['terrain'][field]=[]; self.assertTrue(list(self.pv.iter_errors(bad)))
        absent=copy.deepcopy(self.project); del absent['site']['parcel']; self.assertTrue(list(self.pv.iter_errors(absent)))
        bad=copy.deepcopy(self.project); bad['site']['terrain']['verticalReference']='EGM96'; self.assertTrue(list(self.pv.iter_errors(bad)))

    def test_building_root_authority(self):
        self.building.update(schemaVersion='1.4.0',site={'parcel':self.parcel,'terrain':self.terrain})
        self.bv.validate(self.building)
        old=copy.deepcopy(self.building); old['schemaVersion']='1.3.0'; self.assertTrue(list(self.bv.iter_errors(old)))
        level=copy.deepcopy(self.building); level['levels'][0]['project'].update(schemaVersion='1.11.0',site={'parcel':self.parcel,'terrain':self.terrain}); self.assertTrue(list(self.bv.iter_errors(level)))

if __name__ == '__main__': unittest.main()
