"""Independent JSON Schema checks for explicit root placement and version gates."""
import copy
import importlib.util
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('terrain_schema', Path(__file__).with_name('terrain_schema.test.py'))
support = importlib.util.module_from_spec(spec)
spec.loader.exec_module(support)

class PlacementSchema(unittest.TestCase):
    def setUp(self):
        support.TerrainSchema.setUp(self)
        self.site = {'parcel':self.parcel,'northOffsetDeg':37,'buildingPlacement':{
            'horizontal':{'modelAnchorMm':{'x':1700,'y':2300},'parcelLocalAnchorMm':{'x':9400,'y':-3700},'source':{'type':'user-entered'}},
            'vertical':{'modelZeroElevationM':124.5,'verticalReference':'orthometric','source':{'type':'user-entered'}}}}

    def test_project_versions_dependencies_and_no_parallel_rotation(self):
        self.project.update(schemaVersion='1.12.0',site=self.site)
        self.pv.validate(self.project)
        for version in ('1.7.0','1.9.0','1.10.0','1.11.0'):
            bad=copy.deepcopy(self.project);bad['schemaVersion']=version;self.assertTrue(list(self.pv.iter_errors(bad)))
        for key in ('parcel','northOffsetDeg'):
            bad=copy.deepcopy(self.project);del bad['site'][key];self.assertTrue(list(self.pv.iter_errors(bad)))
        bad=copy.deepcopy(self.project);bad['site']['buildingPlacement']['rotationDeg']=37;self.assertTrue(list(self.pv.iter_errors(bad)))

    def test_building_root_only(self):
        self.building.update(schemaVersion='1.5.0',site=self.site)
        self.bv.validate(self.building)
        old=copy.deepcopy(self.building);old['schemaVersion']='1.4.0';self.assertTrue(list(self.bv.iter_errors(old)))
        level=copy.deepcopy(self.building);level['levels'][0]['project'].update(schemaVersion='1.12.0',site=self.site);self.assertTrue(list(self.bv.iter_errors(level)))

if __name__ == '__main__': unittest.main()
