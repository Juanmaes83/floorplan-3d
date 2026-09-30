"""Synthetic records test the recorder only, not actual plans or authorization."""
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
spec = importlib.util.spec_from_file_location('readiness', ROOT / 'scripts/f2-readiness.py')
readiness = importlib.util.module_from_spec(spec)
spec.loader.exec_module(readiness)


def plan(n, baseline=True):
    # Artificial entries model a completed input; their metrics are never QA evidence.
    row = {'id': f'plan_{n:03}', 'type': ('digital', 'scan', 'photo')[n % 3],
           'format': 'png', 'data_kind': 'real', 'width_px': 480, 'height_px': 320,
           'bytes': 1000, 'orientation_deg': 0,
           'authorization': {'status': 'reviewed', 'evidence_id': f'auth_{n:03}'},
           'calibration_reference_ids': ['dim_001'], 'validation_reference_ids': ['dim_002']}
    if baseline:
        row.update(load_success=True, calibration_success=True, known_length_mm=1000,
                   measured_length_mm=1010, tracing_seconds=100 + n * 20,
                   corrections={'wall': n % 2, 'opening': 0, 'room': 0, 'scale': 0}, incidents_count=0)
    else:
        row.update(geometry_reference_available=True, furniture_drawn=n % 2 == 0)
    return row


def records():
    return {'record_version': 1, 'baseline': [],
            'evaluation': {'revision_id': None, 'frozen': False, 'plans': []}}


class ReadinessTests(unittest.TestCase):
    def test_empty_template_has_no_measured_values_and_does_not_open_f2(self):
        data = json.loads((ROOT / 'docs/qa/f2-evaluation.template.json').read_text())
        report = readiness.summarize(data)
        self.assertEqual(report['baseline']['eligible_measured'], 0)
        self.assertIsNone(report['baseline']['error_absolute_percent_median'])
        self.assertIsNone(report['baseline']['tracing_seconds_median'])
        self.assertFalse(report['gate']['implementation_authorized'])
        self.assertFalse(report['gate']['evaluation_set_complete_on_declared_records'])

    def test_baseline_arithmetic_uses_independent_verification_and_absolute_error(self):
        data = records(); data['baseline'] = [plan(n) for n in range(5)]
        for row, value in zip(data['baseline'], [1000, 1010, 990, 1020, 1000]):
            row['measured_length_mm'] = value
        report = readiness.summarize(data)
        self.assertEqual(report['baseline']['error_absolute_percent_median'], 1)
        self.assertEqual(report['baseline']['error_absolute_percent_p90_nearest_rank'], 2)
        self.assertEqual(report['baseline']['tracing_seconds_median'], 140)
        self.assertEqual(report['baseline']['corrections_total'], 2)
        self.assertEqual(report['baseline']['plans_needing_correction_fraction_among_measured'], .4)
        self.assertTrue(report['gate']['baseline_complete_on_declared_records'])
        self.assertFalse(report['gate']['implementation_authorized'])

    def test_synthetic_pending_failed_and_incomplete_records_cannot_supply_baseline(self):
        data = records(); data['baseline'] = [plan(n) for n in range(5)]
        data['baseline'][0]['data_kind'] = 'synthetic'
        data['baseline'][1]['authorization']['status'] = 'pending'
        data['baseline'][2]['load_success'] = False
        data['baseline'][3]['tracing_seconds'] = None
        report = readiness.summarize(data)
        self.assertEqual(report['baseline']['eligible_measured'], 1)
        self.assertEqual(report['baseline']['load_failures'], 1)
        self.assertFalse(report['gate']['baseline_complete_on_declared_records'])

    def test_baseline_requires_each_type_among_five_eligible_sessions(self):
        for missing in ('digital', 'scan', 'photo'):
            data = records(); data['baseline'] = [plan(n) for n in range(5)]
            replacement = next(kind for kind in ('digital', 'scan', 'photo') if kind != missing)
            for row in data['baseline']:
                if row['type'] == missing: row['type'] = replacement
            with self.subTest(missing=missing):
                self.assertFalse(readiness.summarize(data)['gate']['baseline_complete_on_declared_records'])
            excluded = plan(5); excluded['type'] = missing; excluded['data_kind'] = 'synthetic'
            data['baseline'].append(excluded)
            with self.subTest(missing=missing, excluded=True):
                self.assertFalse(readiness.summarize(data)['gate']['baseline_complete_on_declared_records'])

    def test_baseline_minimum_does_not_add_furniture_or_distribution_quotas(self):
        data = records(); data['baseline'] = [plan(n) for n in range(5)]
        for row, kind in zip(data['baseline'], ('digital', 'scan', 'photo', 'digital', 'digital')):
            row['type'] = kind
        self.assertTrue(readiness.summarize(data)['gate']['baseline_complete_on_declared_records'])
        data['baseline'].pop()
        self.assertFalse(readiness.summarize(data)['gate']['baseline_complete_on_declared_records'])
        data['baseline'].extend([plan(4), plan(5)])
        self.assertTrue(readiness.summarize(data)['gate']['baseline_complete_on_declared_records'])

    def test_duplicates_and_reused_calibration_dimensions_are_rejected(self):
        data = records(); data['baseline'] = [plan(1), plan(1)]
        with self.assertRaisesRegex(ValueError, 'distinct'):
            readiness.summarize(data)
        data['baseline'] = [plan(1)]
        data['baseline'][0]['validation_reference_ids'] = ['dim_001']
        with self.assertRaisesRegex(ValueError, 'independent'):
            readiness.summarize(data)
        with self.assertRaisesRegex(ValueError, 'Repeated'):
            json.loads('{"a":{"x":1,"x":2}}', object_pairs_hook=readiness.unique_keys)

    def test_negative_boolean_and_nonfinite_measurements_are_rejected(self):
        for value in (-1, True, float('inf'), float('nan')):
            data = records(); data['baseline'] = [plan(1)]
            data['baseline'][0]['tracing_seconds'] = value
            with self.subTest(value=value), self.assertRaises(ValueError):
                readiness.summarize(data)

    def test_evaluation_needs_twenty_fixed_varied_plans_with_reference_geometry(self):
        data = records(); data['evaluation'] = {'revision_id': 'eval_001', 'frozen': True,
                                             'plans': [plan(n, False) for n in range(20)]}
        report = readiness.summarize(data)
        self.assertTrue(report['gate']['evaluation_set_complete_on_declared_records'])
        self.assertFalse(report['gate']['baseline_complete_on_declared_records'])
        self.assertFalse(report['gate']['implementation_authorized'])
        for change in ('missing-reference', 'not-frozen', 'missing-type', 'limit'):
            mutated = copy.deepcopy(data)
            if change == 'missing-reference': mutated['evaluation']['plans'][0]['geometry_reference_available'] = False
            if change == 'not-frozen': mutated['evaluation']['frozen'] = False
            if change == 'missing-type':
                for row in mutated['evaluation']['plans']: row['type'] = 'digital'
            if change == 'limit': mutated['evaluation']['plans'][0]['width_px'] = 8001
            self.assertFalse(readiness.summarize(mutated)['gate']['evaluation_set_complete_on_declared_records'])

    def test_evaluation_requires_each_type_and_both_furniture_states_among_eligible_plans(self):
        data = records(); data['evaluation'] = {'revision_id': 'eval_001', 'frozen': True,
                                             'plans': [plan(n, False) for n in range(20)]}
        for missing in ('digital', 'scan', 'photo', False, True):
            mutated = copy.deepcopy(data)
            for row in mutated['evaluation']['plans']:
                if isinstance(missing, bool): row['furniture_drawn'] = not missing
                elif row['type'] == missing:
                    row['type'] = next(kind for kind in ('digital', 'scan', 'photo') if kind != missing)
            with self.subTest(missing=missing):
                self.assertFalse(readiness.summarize(mutated)['gate']['evaluation_set_complete_on_declared_records'])
            excluded = plan(20, False); excluded['authorization']['status'] = 'pending'
            if isinstance(missing, bool): excluded['furniture_drawn'] = missing
            else: excluded['type'] = missing
            mutated['evaluation']['plans'].append(excluded)
            with self.subTest(missing=missing, excluded=True):
                self.assertFalse(readiness.summarize(mutated)['gate']['evaluation_set_complete_on_declared_records'])

    def test_evaluation_minimum_allows_overlapping_categories_without_six_combinations(self):
        data = records(); data['evaluation'] = {'revision_id': 'eval_001', 'frozen': True,
                                             'plans': [plan(n, False) for n in range(20)]}
        for n, row in enumerate(data['evaluation']['plans']):
            row['type'] = 'scan' if n == 0 else 'photo' if n == 1 else 'digital'
            row['furniture_drawn'] = n == 0
        self.assertTrue(readiness.summarize(data)['gate']['evaluation_set_complete_on_declared_records'])
        data['evaluation']['plans'].pop()
        self.assertFalse(readiness.summarize(data)['gate']['evaluation_set_complete_on_declared_records'])
        data['evaluation']['plans'].extend([plan(19, False), plan(20, False)])
        self.assertTrue(readiness.summarize(data)['gate']['evaluation_set_complete_on_declared_records'])

    def test_sets_remain_separate_and_overlap_is_reported(self):
        data = records(); data['baseline'] = [plan(1)]
        data['evaluation']['plans'] = [plan(1, False)]
        report = readiness.summarize(data)
        self.assertEqual(report['evaluation']['overlap_with_baseline_count'], 1)
        self.assertEqual(report['baseline']['eligible_measured'], 1)
        self.assertEqual(report['evaluation']['eligible_with_references'], 1)

    def test_cli_does_not_echo_private_paths_or_extra_record_content(self):
        with tempfile.TemporaryDirectory() as directory:
            file = Path(directory) / 'PRIVATE-ADDRESS.json'
            file.write_text('{"private-name": "OWNER", "record_version": 99}')
            result = subprocess.run(['python3', str(ROOT / 'scripts/f2-readiness.py'), str(file)], capture_output=True, text=True)
            self.assertEqual(result.returncode, 2)
            self.assertNotIn('PRIVATE', result.stderr)
            self.assertNotIn('OWNER', result.stderr)
            data = records(); data['private-name'] = 'OWNER'
            file.write_text(json.dumps(data))
            result = subprocess.run(['python3', str(ROOT / 'scripts/f2-readiness.py'), str(file)], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0)
            self.assertNotIn('OWNER', result.stdout)


if __name__ == '__main__':
    unittest.main()
