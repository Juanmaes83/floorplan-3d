"""Local conversion tests use synthetic downloads only."""
import copy
import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('raw_convert', ROOT / 'scripts/f2-raw-export-to-evaluation.py')
converter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(converter)


def fixture():
    return json.loads((ROOT / 'tests/fixtures/f2-raw-export.synthetic.json').read_text())


class RawExportTests(unittest.TestCase):
    def test_converter_preserves_missing_reference_units_frame_metadata_and_diagonals(self):
        raw = fixture(); record = converter.convert(raw)
        self.assertEqual(record, raw['evaluation_record'])
        self.assertEqual(record['units'], 'mm'); self.assertEqual(record['coordinate_frame'], 'image-aligned-mm')
        self.assertIsNone(record['cases'][0]['references'])
        report = converter.evaluator.evaluate(record, 5)
        self.assertIsNone(report['cases'][0]['metrics'])
        self.assertEqual(report['cases'][0]['failures'], ['reference_missing'])
        # After local manual reference completion, diagonals still have global denominator.
        completed = copy.deepcopy(record); row = completed['cases'][0]
        row['reference_status'] = 'reviewed'; row['references'] = copy.deepcopy(row['predictions'])
        metrics = converter.evaluator.evaluate(completed, 5)['cases'][0]['metrics']
        self.assertEqual(metrics['reference_length_mm'], 4500)
        self.assertEqual(metrics['matched_length_mm'], 4000)
        self.assertAlmostEqual(metrics['recall_length_all_orientations'], 8/9)
        self.assertEqual(metrics['recall_length_supported_axes'], 1)
        self.assertEqual(metrics['references']['unsupported_orientation_segments'], 1)

    def test_invalid_units_frame_scale_sha_metadata_and_added_private_content_rejected(self):
        changes = [lambda d: d.pop('scale_applied'), lambda d: d.update(export_version=True),
                   lambda d: d.update(detector_source_sha256='latest'), lambda d: d.update(image='PRIVATE'),
                   lambda d: d['scale_applied'].update(mm_per_pixel=0),
                   lambda d: d['scale_applied'].update(method='template'),
                   lambda d: d['scale_applied'].update(mm_per_pixel=True),
                   lambda d: d['evaluation_record'].pop('units'),
                   lambda d: d['evaluation_record'].update(coordinate_frame='world'),
                   lambda d: d['evaluation_record'].update(detector_commit='latest'),
                   lambda d: d['evaluation_record'].pop('dataset_id'),
                   lambda d: d['evaluation_record']['cases'][0].update(type=''),
                   lambda d: d['evaluation_record']['cases'][0].update(reference_status='reviewed',references=[]),
                   lambda d: d['evaluation_record']['cases'][0].update(predictions=[])]
        for n, change in enumerate(changes):
            raw = fixture(); change(raw)
            with self.subTest(n=n), self.assertRaises(ValueError): converter.convert(raw)

    def test_cli_privacy_duplicate_keys_missing_files_and_output(self):
        with tempfile.TemporaryDirectory() as directory:
            file = Path(directory) / 'PRIVATE-ADDRESS.json'
            command = [sys.executable,str(ROOT/'scripts/f2-raw-export-to-evaluation.py'),str(file)]
            for raw in ['{"owner":"OWNER"}',json.dumps(fixture()).replace('"export_version": 1','"export_version":1,"export_version":1'),json.dumps(fixture()).replace('"x": 400','"x":NaN',1)]:
                file.write_text(raw); result = subprocess.run(command,capture_output=True,text=True)
                self.assertEqual(result.returncode,2);self.assertEqual(result.stdout,'')
                self.assertNotIn('PRIVATE',result.stderr);self.assertNotIn('OWNER',result.stderr)
            file.write_text(json.dumps(fixture())); result = subprocess.run(command,capture_output=True,text=True)
            self.assertEqual(result.returncode,0); self.assertEqual(json.loads(result.stdout),fixture()['evaluation_record'])
            result = subprocess.run(command+['--PRIVATE','OWNER'],capture_output=True,text=True)
            self.assertEqual(result.returncode,2);self.assertNotIn('PRIVATE',result.stderr);self.assertNotIn('OWNER',result.stderr)
            file.unlink();result=subprocess.run(command,capture_output=True,text=True)
            self.assertEqual(result.returncode,2);self.assertNotIn('PRIVATE',result.stderr)


if __name__ == '__main__': unittest.main()
