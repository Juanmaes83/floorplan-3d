"""Hand-calculable synthetic geometry; never real plan quality evidence."""
import copy
import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('wall_eval', ROOT / 'scripts/f2-wall-evaluation.py')
evaluator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(evaluator)


def segment(n=0, a=(0, 0), b=(100, 0)):
    return {'id': f'seg_{n:03}', 'start': dict(zip(('x', 'y'), a)), 'end': dict(zip(('x', 'y'), b))}


def case(n=0, predictions=None, references=None):
    return {'id': f'case_{n:03}', 'type': 'digital', 'analysis_status': 'ok',
            'reference_status': 'reviewed',
            'predictions': [segment()] if predictions is None else predictions,
            'references': [segment()] if references is None else references}


def records(cases=None):
    return {'record_version': 1, 'dataset_id': 'eval_001', 'detector_commit': 'a' * 40,
            'units': 'mm', 'coordinate_frame': 'image-aligned-mm', 'data_kind': 'synthetic',
            'cases': [case()] if cases is None else cases}


def metrics(row, tolerance=1):
    return evaluator.evaluate(records([row]), tolerance)['cases'][0]['metrics']


class WallEvaluationTests(unittest.TestCase):
    def test_exact_reversed_and_vertical_matches(self):
        for a, b in [((0, 0), (100, 0)), ((0, 0), (0, 100))]:
            with self.subTest(a=a, b=b):
                report = metrics(case(predictions=[segment(a=b, b=a)], references=[segment(a=a, b=b)]))
                self.assertEqual(report['matched_length_mm'], 100)
                self.assertEqual(report['precision_length'], 1)
                self.assertEqual(report['recall_length_all_orientations'], 1)
                self.assertEqual(report['references']['fully_covered_segments'], 1)

    def test_absent_predictions_references_and_both_have_explicit_denominators(self):
        report = metrics(case(predictions=[]))
        self.assertIsNone(report['precision_length'])
        self.assertEqual(report['recall_length_all_orientations'], 0)
        self.assertEqual(report['missed_reference_length_mm'], 100)
        report = metrics(case(references=[]))
        self.assertEqual(report['precision_length'], 0)
        self.assertIsNone(report['recall_length_all_orientations'])
        report = metrics(case(predictions=[], references=[]))
        self.assertIsNone(report['precision_length']); self.assertIsNone(report['recall_length_all_orientations'])

    def test_partial_and_overlong_segments_use_overlap_without_endpoint_expansion(self):
        short = metrics(case(predictions=[segment(b=(40, 0))]))
        self.assertEqual(short['precision_length'], 1)
        self.assertEqual(short['recall_length_all_orientations'], .4)
        self.assertEqual(short['references']['partially_covered_segments'], 1)
        long = metrics(case(predictions=[segment(a=(-50, 0), b=(150, 0))]), 20)
        self.assertEqual(long['precision_length'], .5); self.assertEqual(long['recall_length_all_orientations'], 1)
        self.assertEqual(long['predictions']['partially_covered_segments'], 1)
        outside = metrics(case(predictions=[segment(a=(100, 0), b=(200, 0))]), 100)
        self.assertEqual(outside['matched_length_mm'], 0)

    def test_transverse_tolerance_is_inclusive_and_mandatory(self):
        row = case(predictions=[segment(a=(0, 5), b=(100, 5))])
        self.assertEqual(metrics(row, 5)['matched_length_mm'], 100)
        self.assertEqual(metrics(row, 4.99)['matched_length_mm'], 0)
        self.assertEqual(metrics(case(), 0)['matched_length_mm'], 100)
        for tolerance in (None, -1, True, float('nan'), float('inf')):
            with self.subTest(tolerance=tolerance), self.assertRaises(ValueError):
                evaluator.evaluate(records(), tolerance)

    def test_prediction_duplicates_and_overlaps_are_penalized_once(self):
        duplicated = metrics(case(predictions=[segment(), segment(1, (100, 0), (0, 0))]))
        self.assertEqual(duplicated['predicted_length_mm'], 200)
        self.assertEqual(duplicated['matched_length_mm'], 100)
        self.assertEqual(duplicated['precision_length'], .5)
        self.assertEqual(duplicated['recall_length_all_orientations'], 1)
        overlap = metrics(case(predictions=[segment(), segment(1, (50, 0), (150, 0))], references=[segment(b=(150, 0))]))
        self.assertEqual(overlap['matched_length_mm'], 150); self.assertEqual(overlap['precision_length'], .75)
        self.assertEqual(overlap['recall_length_all_orientations'], 1)

    def test_fragmented_predictions_and_references_preserve_length_scores(self):
        halves = [segment(b=(50, 0)), segment(1, (50, 0), (100, 0))]
        for row in [case(predictions=halves), case(references=halves)]:
            report = metrics(row)
            self.assertEqual(report['precision_length'], 1); self.assertEqual(report['recall_length_all_orientations'], 1)

    def test_reference_duplicates_and_collinear_overlap_require_annotation_review(self):
        for duplicate in [segment(1), segment(1, (50, 0), (150, 0))]:
            with self.subTest(duplicate=duplicate), self.assertRaises(ValueError):
                metrics(case(references=[segment(), duplicate]))
        with self.assertRaises(ValueError):
            metrics(case(references=[segment(a=(0, 0), b=(100, 100)), segment(1, (50, 50), (150, 150))]))

    def test_parallel_ambiguity_uses_maximum_capacity_not_greedy_first_hit(self):
        row = case(predictions=[segment(a=(0, 3), b=(100, 3)), segment(1)],
                   references=[segment(), segment(1, (0, 6), (100, 6))])
        report = metrics(row, 4)
        self.assertEqual(report['matched_length_mm'], 200)
        row['predictions'].reverse(); row['references'].reverse()
        self.assertEqual(metrics(row, 4), report)

    def test_unsupported_diagonals_are_unmatched_and_global_recall_retains_them(self):
        row = case(predictions=[segment(), segment(1, (0, 0), (30, 40))],
                   references=[segment(), segment(1, (0, 0), (30, 40))])
        report = metrics(row)
        self.assertEqual(evaluator.evaluate(records([row]), 1)['rules_status'], 'metric_method_approved_thresholds_pending')
        self.assertEqual(report['reference_length_mm'], 150)
        self.assertAlmostEqual(report['precision_length'], 2/3)
        self.assertAlmostEqual(report['recall_length_all_orientations'], 2/3)
        self.assertEqual(report['recall_length_supported_axes'], 1)
        self.assertEqual(report['references']['unsupported_orientation_segments'], 1)
        perpendicular = metrics(case(predictions=[segment(a=(50, -50), b=(50, 50))]))
        self.assertEqual(perpendicular['matched_length_mm'], 0)

    def test_failed_analysis_retains_reference_and_missing_reference_is_unscored(self):
        failed = case(); failed.update(analysis_status='failed', predictions=None)
        missing = case(1); missing.update(reference_status='missing', references=None)
        report = evaluator.evaluate(records([failed, missing]), 1)
        self.assertEqual(report['cases'][0]['metrics']['recall_length_all_orientations'], 0)
        self.assertIsNone(report['cases'][1]['metrics'])
        aggregate = report['aggregate']
        self.assertEqual(aggregate['cases_with_failures'], 2)
        self.assertEqual(aggregate['micro_length_metrics']['reference_length_mm'], 100)
        self.assertEqual(aggregate['unscored_prediction_length_mm'], 100)
        self.assertFalse(aggregate['all_analyses_succeeded']); self.assertFalse(aggregate['all_cases_have_reviewed_reference'])
        self.assertFalse(report['f2_validated'])

    def test_micro_aggregate_has_denominators_and_keeps_each_failed_plan_visible(self):
        rows = [case(), case(1, predictions=[], references=[segment(b=(300, 0))])]
        report = evaluator.evaluate(records(rows), 1)
        aggregate = report['aggregate']['micro_length_metrics']
        self.assertEqual(aggregate['precision_length'], 1)
        self.assertEqual(aggregate['recall_length_all_orientations'], .25)
        self.assertEqual(report['cases'][1]['metrics']['missed_reference_length_mm'], 300)

    def test_invalid_fields_units_ids_coordinates_states_and_limits_are_rejected(self):
        changes = [lambda d: d.pop('units'), lambda d: d.update(units='px'),
                   lambda d: d.update(record_version=True), lambda d: d.update(coordinate_frame='world'),
                   lambda d: d.update(cases=[]), lambda d: d.update(detector_commit='latest'),
                   lambda d: d.update(private_path='PRIVATE'),
                   lambda d: d['cases'][0].update(id='ADDRESS'),
                   lambda d: d['cases'][0].update(analysis_status='failed'),
                   lambda d: d['cases'][0].update(reference_status='missing'),
                   lambda d: d['cases'][0]['predictions'][0]['start'].update(x=True),
                   lambda d: d['cases'][0]['predictions'][0]['end'].update(x=0),
                   lambda d: d['cases'][0]['predictions'][0]['end'].update(x=float('nan')),
                   lambda d: d['cases'][0]['predictions'][0]['end'].update(x=1000001),
                   lambda d: d['cases'][0]['predictions'][0].update(confidence=.99),
                   lambda d: d['cases'].append(copy.deepcopy(d['cases'][0])),
                   lambda d: d['cases'][0]['predictions'].append(segment()),
                   lambda d: d['cases'][0].update(predictions=[segment(n) for n in range(201)])]
        for n, change in enumerate(changes):
            data = records(); change(data)
            with self.subTest(n=n), self.assertRaises((ValueError, TypeError)):
                evaluator.evaluate(data, 1)

    def test_fixture_is_synthetic_and_output_never_contains_geometry(self):
        data = json.loads((ROOT / 'tests/fixtures/f2-wall-evaluation.synthetic.json').read_text())
        report = evaluator.evaluate(data, 5)
        self.assertEqual(report['data_kind'], 'synthetic')
        self.assertEqual(report['aggregate']['micro_length_metrics']['matched_length_mm'], 250)
        output = json.dumps(report)
        for key in ('"start"', '"end"', '"predictions": [', 'seg_'):
            self.assertNotIn(key, output)

    def test_evaluation_has_no_network_or_image_file_io(self):
        with patch('socket.socket', side_effect=AssertionError('Network forbidden')), \
             patch('builtins.open', side_effect=AssertionError('Image IO forbidden')), \
             patch.object(Path, 'open', side_effect=AssertionError('Image IO forbidden')):
            report = evaluator.evaluate(records(), 1)
        self.assertEqual(report['aggregate']['micro_length_metrics']['matched_length_mm'], 100)

    def test_all_invalid_cases_fail_atomically_instead_of_printing_partial_scores(self):
        data = records([case(), case(1)])
        data['cases'][1]['predictions'][0]['end']['x'] = 0
        with self.assertRaises(ValueError):
            evaluator.evaluate(data, 1)
        failed = case(); failed.update(analysis_status='failed', predictions=None,
                                      reference_status='missing', references=None)
        report = evaluator.evaluate(records([failed]), 1)
        self.assertEqual(report['cases'][0]['failures'], ['analysis_failed', 'reference_missing'])
        self.assertIsNone(report['cases'][0]['metrics'])

    def test_cli_privacy_strict_json_invalid_cases_and_argument_errors(self):
        with tempfile.TemporaryDirectory() as directory:
            file = Path(directory) / 'PRIVATE-ADDRESS.json'
            command = [sys.executable, str(ROOT / 'scripts/f2-wall-evaluation.py'), str(file)]
            def run(raw, args=None):
                file.write_text(raw)
                result = subprocess.run(command + (['--tolerance-mm', '1'] if args is None else args), capture_output=True, text=True)
                self.assertNotIn('PRIVATE', result.stdout + result.stderr)
                self.assertNotIn('OWNER', result.stdout + result.stderr)
                return result
            good = json.dumps(records())
            for raw in [good.replace('"units": "mm"', '"units":"mm","units":"mm"'),
                        good.replace('"x": 0', '"x":0,"x":0', 1),
                        good.replace('"x": 0', '"x":NaN', 1),
                        '{"owner":"OWNER"}', good.replace('"digital"', '"OWNER"')]:
                result = run(raw); self.assertEqual(result.returncode, 2); self.assertEqual(result.stdout, '')
            for args in [[], ['--tolerance-mm', 'OWNER'], ['--tolerance-mm', '1', '--PRIVATE', 'OWNER']]:
                self.assertEqual(run(good, args).returncode, 2)
            result = run(good); self.assertEqual(result.returncode, 0)
            self.assertEqual(json.loads(result.stdout)['cases'][0]['metrics']['precision_length'], 1)
            file.unlink(); result = subprocess.run(command + ['--tolerance-mm', '1'], capture_output=True, text=True)
            self.assertEqual(result.returncode, 2); self.assertNotIn('PRIVATE', result.stderr)


if __name__ == '__main__':
    unittest.main()
