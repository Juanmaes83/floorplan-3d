"""Offline length-based wall evaluation; approved metric method, product thresholds pending."""
import argparse
import importlib.util
import json
import math
import re
import sys
from collections import deque
from pathlib import Path

# Reuse strict parsing and finite-number checks; readiness remains the sole inventory.
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('f2_readiness', Path(__file__).with_name('f2-readiness.py'))
readiness = importlib.util.module_from_spec(spec)
spec.loader.exec_module(readiness)
MAX_CASES = 100
MAX_SEGMENTS = 200
MAX_INPUT_BYTES = 8 * 1024 * 1024


def fields(value, expected):
    if not isinstance(value, dict) or set(value) != set(expected):
        raise ValueError('Unexpected or missing fields')


def anonymous(value, pattern):
    if not isinstance(value, str) or not re.fullmatch(pattern, value):
        raise ValueError('Invalid anonymous ID or revision')


def segments(value):
    if not isinstance(value, list) or len(value) > MAX_SEGMENTS:
        raise ValueError('Invalid segment list')
    ids = set()
    result = []
    for row in value:
        fields(row, ('id', 'start', 'end'))
        anonymous(row['id'], r'seg_[0-9]{3}')
        if row['id'] in ids:
            raise ValueError('Duplicate segment IDs')
        ids.add(row['id'])
        for point in (row['start'], row['end']):
            fields(point, ('x', 'y'))
            if any(type(v) is not int or abs(v) > 1000000 for v in point.values()):
                raise ValueError('Coordinates must be bounded integer mm')
        a, b = row['start'], row['end']
        length = math.hypot(a['x'] - b['x'], a['y'] - b['y'])
        if not length:
            raise ValueError('Zero-length segment')
        axis = 'x' if a['y'] == b['y'] else 'y' if a['x'] == b['x'] else None
        transverse = 'y' if axis == 'x' else 'x'
        result.append({'id': row['id'], 'length': length, 'axis': axis,
                       'offset': a[transverse] if axis else None,
                       'low': min(a[axis], b[axis]) if axis else None,
                       'high': max(a[axis], b[axis]) if axis else None})
    return sorted(result, key=lambda s: s['id'])


def validate(data):
    fields(data, ('record_version', 'dataset_id', 'detector_commit', 'units', 'coordinate_frame', 'data_kind', 'cases'))
    if type(data['record_version']) is not int or data['record_version'] != 1:
        raise ValueError('Unsupported record version')
    anonymous(data['dataset_id'], r'eval_[0-9]{3}')
    anonymous(data['detector_commit'], r'[0-9a-f]{40}')
    if data['coordinate_frame'] != 'image-aligned-mm':
        raise ValueError('Use the frozen image-aligned mm frame')
    if data['units'] != 'mm' or data['data_kind'] not in ('synthetic', 'real'):
        raise ValueError('Explicit mm units and data kind required')
    if not isinstance(data['cases'], list) or not 1 <= len(data['cases']) <= MAX_CASES:
        raise ValueError('Provide a nonempty bounded case list')
    ids = set()
    rows = []
    for case in data['cases']:
        fields(case, ('id', 'type', 'analysis_status', 'reference_status', 'predictions', 'references'))
        anonymous(case['id'], r'case_[0-9]{3}')
        if case['id'] in ids:
            raise ValueError('Duplicate case IDs')
        ids.add(case['id'])
        if case['type'] not in ('digital', 'scan', 'photo'):
            raise ValueError('Invalid plan type')
        if case['analysis_status'] not in ('ok', 'failed') or case['reference_status'] not in ('reviewed', 'missing'):
            raise ValueError('Explicit analysis and reference states required')
        predictions = segments(case['predictions']) if case['analysis_status'] == 'ok' else None
        references = segments(case['references']) if case['reference_status'] == 'reviewed' else None
        if predictions is None and case['predictions'] is not None or references is None and case['references'] is not None:
            raise ValueError('Unavailable geometry must be null, not an empty list')
        # Reject collinear overlap in manual truth; touching endpoints are allowed.
        originals = case['references'] or []
        for i, a in enumerate(originals):
            u, v = a['start'], a['end']
            cross = lambda point: (v['x'] - u['x']) * (point['y'] - u['y']) - (v['y'] - u['y']) * (point['x'] - u['x'])
            axis = 'x' if u['x'] != v['x'] else 'y'
            for b in originals[i + 1:]:
                if cross(b['start']) == cross(b['end']) == 0:
                    left = max(min(u[axis], v[axis]), min(b['start'][axis], b['end'][axis]))
                    right = min(max(u[axis], v[axis]), max(b['start'][axis], b['end'][axis]))
                    if right > left:
                        raise ValueError('Overlapping collinear references require local annotation review')
        rows.append((case, predictions, references))
    return sorted(rows, key=lambda r: r[0]['id'])


def matching(active_predictions, active_references, tolerance):
    """Deterministic maximum-cardinality matching, one capacity per segment/cell."""
    edges = {p['id']: sorted((r for r in active_references if abs(p['offset'] - r['offset']) <= tolerance),
                            key=lambda r: (abs(p['offset'] - r['offset']), r['id'])) for p in active_predictions}
    owners = {}
    for prediction in active_predictions:
        root = prediction['id']
        queue = deque([root]); parents = {}; seen_p = {root}; seen_r = set(); free = None
        while queue and free is None:
            current = queue.popleft()
            for reference in edges[current]:
                ref = reference['id']
                if ref in seen_r:
                    continue
                seen_r.add(ref); parents[ref] = current
                if ref not in owners:
                    free = ref; break
                previous = owners[ref]
                if previous not in seen_p:
                    seen_p.add(previous); queue.append(previous)
        if free is not None:
            while True:
                current = parents[free]
                previous_ref = next((r for r, p in owners.items() if p == current), None)
                owners[free] = current
                if previous_ref is None:
                    break
                free = previous_ref
    return [(p, r) for r, p in sorted(owners.items())]


def coverage(predictions, references, tolerance):
    pred_matched = {s['id']: 0 for s in predictions}
    ref_matched = {s['id']: 0 for s in references}
    for axis in ('x', 'y'):
        ps = [s for s in predictions if s['axis'] == axis]
        rs = [s for s in references if s['axis'] == axis]
        ends = sorted({v for s in ps + rs for v in (s['low'], s['high'])})
        for low, high in zip(ends, ends[1:]):
            active_p = [s for s in ps if s['low'] <= low and s['high'] >= high]
            active_r = [s for s in rs if s['low'] <= low and s['high'] >= high]
            for pid, rid in matching(active_p, active_r, tolerance):
                pred_matched[pid] += high - low
                ref_matched[rid] += high - low
    return pred_matched, ref_matched


def ratio(numerator, denominator):
    return numerator / denominator if denominator else None


def scores(predictions, references, pred_matched, ref_matched):
    p_length = sum(s['length'] for s in predictions)
    r_length = sum(s['length'] for s in references)
    matched = sum(pred_matched.values())
    supported_reference = sum(s['length'] for s in references if s['axis'])
    def counts(rows, matched_lengths):
        return {'segments': len(rows),
                'fully_covered_segments': sum(matched_lengths[s['id']] == s['length'] for s in rows),
                'partially_covered_segments': sum(0 < matched_lengths[s['id']] < s['length'] for s in rows),
                'unmatched_segments': sum(matched_lengths[s['id']] == 0 for s in rows),
                'unsupported_orientation_segments': sum(s['axis'] is None for s in rows)}
    return {'predictions': counts(predictions, pred_matched), 'references': counts(references, ref_matched),
            'predicted_length_mm': p_length, 'reference_length_mm': r_length,
            'matched_length_mm': matched, 'unmatched_predicted_length_mm': p_length - matched,
            'missed_reference_length_mm': r_length - matched,
            'supported_reference_length_mm': supported_reference,
            'precision_length': ratio(matched, p_length), 'recall_length_all_orientations': ratio(matched, r_length),
            'recall_length_supported_axes': ratio(matched, supported_reference)}


def evaluate(data, tolerance):
    if not readiness.number(tolerance):
        raise ValueError('Explicit nonnegative finite tolerance in mm required')
    rows = validate(data)
    cases = []; aggregate_p = []; aggregate_r = []; aggregate_pm = {}; aggregate_rm = {}
    for case, predictions, references in rows:
        failures = []
        if predictions is None:
            failures.append('analysis_failed')
        if references is None:
            failures.append('reference_missing')
        report = {'id': case['id'], 'type': case['type'], 'failures': failures,
                  'prediction_segments_declared': len(predictions) if predictions is not None else None,
                  'reference_segments_declared': len(references) if references is not None else None,
                  'unscored_prediction_length_mm': sum(s['length'] for s in predictions or []) if references is None else 0}
        if references is None:
            report['metrics'] = None
        else:
            # A failed detector earns zero credit, retaining its reviewed reference denominator.
            ps = predictions or []
            pm, rm = coverage(ps, references, tolerance)
            report['metrics'] = scores(ps, references, pm, rm)
            for source, target, matched, target_matched in ((ps, aggregate_p, pm, aggregate_pm), (references, aggregate_r, rm, aggregate_rm)):
                for segment in source:
                    key = case['id'] + ':' + segment['id']
                    target.append({**segment, 'id': key}); target_matched[key] = matched[segment['id']]
        cases.append(report)
    return {'metric_version': 'axis-length-capacity-v1', 'rules_status': 'metric_method_approved_thresholds_pending',
            'record_version': 1, 'dataset_id': data['dataset_id'], 'detector_commit': data['detector_commit'],
            'units': 'mm', 'coordinate_frame': 'image-aligned-mm', 'data_kind': data['data_kind'], 'tolerance_mm': tolerance,
            'f2_validated': False, 'cases': cases,
            'aggregate': {'declared_cases': len(cases),
                          'all_cases_have_reviewed_reference': all(c['metrics'] is not None for c in cases),
                          'all_analyses_succeeded': all('analysis_failed' not in c['failures'] for c in cases),
                          'unscored_prediction_length_mm': sum(c['unscored_prediction_length_mm'] for c in cases),
                          'cases_with_failures': sum(bool(c['failures']) for c in cases),
                          'cases_without_reviewed_reference': sum(c['metrics'] is None for c in cases),
                          'cases_in_length_denominators': sum(c['metrics'] is not None for c in cases),
                          'micro_length_metrics': scores(aggregate_p, aggregate_r, aggregate_pm, aggregate_rm)}}


class PrivateParser(argparse.ArgumentParser):
    def error(self, message):
        # argparse normally echoes unknown argument values (possibly private paths).
        self.exit(2, 'Invalid arguments; supply local records and an explicit nonnegative --tolerance-mm.\n')


def main():
    parser = PrivateParser(description=__doc__)
    parser.add_argument('records', type=Path, help='Local anonymous geometry JSON')
    parser.add_argument('--tolerance-mm', required=True, type=float, help='Explicit geometric comparison tolerance; no product default')
    args = parser.parse_args()
    try:
        with args.records.open('rb') as stream:
            raw = stream.read(MAX_INPUT_BYTES + 1)
        if len(raw) > MAX_INPUT_BYTES:
            raise ValueError('Input size limit exceeded')
        data = json.loads(raw, object_pairs_hook=readiness.unique_keys,
                          parse_constant=lambda _: (_ for _ in ()).throw(ValueError('Nonfinite JSON number')))
        report = evaluate(data, args.tolerance_mm)
        print(json.dumps(report, indent=2, allow_nan=False))
    except (ValueError, TypeError, KeyError, AttributeError, OSError, RecursionError, OverflowError):
        parser.exit(2, 'Invalid wall evaluation records; review fields, states, anonymous IDs, units and geometry locally.\n')


if __name__ == '__main__':
    main()
