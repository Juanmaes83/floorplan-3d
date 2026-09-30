"""Offline, anonymous evaluation records. Never reads images or authorizes F2."""
import argparse
import json
import math
import re
import statistics
from pathlib import Path


def unique_keys(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError('Repeated JSON key')
        result[key] = value
    return result


def number(value, positive=False):
    return (isinstance(value, (int, float)) and not isinstance(value, bool)
            and math.isfinite(value) and (value > 0 if positive else value >= 0))


def percentile90(values):
    # Nearest-rank: fixed convention, including small samples. No interpolation.
    return sorted(values)[math.ceil(.9 * len(values)) - 1] if values else None


def validate_plan(plan, baseline):
    if not isinstance(plan, dict) or not re.fullmatch(r'plan_[0-9]{3}', plan.get('id', '')):
        raise ValueError('Use anonymous plan IDs: plan_NNN')
    if plan.get('type') not in ('digital', 'scan', 'photo'):
        raise ValueError('Unsupported plan type')
    if plan.get('format') not in ('png', 'jpeg', 'webp'):
        raise ValueError('Record a supported raster format')
    if plan.get('data_kind') not in ('real', 'synthetic'):
        raise ValueError('Distinguish real plans from synthetic infrastructure fixtures')
    for field in ('width_px', 'height_px', 'bytes'):
        value = plan.get(field)
        if not number(value, True) or int(value) != value:
            raise ValueError('Record positive integer raster dimensions and byte count')
    if plan.get('orientation_deg') not in (0, 90, 180, 270):
        raise ValueError('Record raster orientation without EXIF or filenames')
    authorization = plan.get('authorization', {})
    if authorization.get('status') not in ('pending', 'reviewed'):
        raise ValueError('Record authorization status')
    if authorization['status'] == 'reviewed' and not re.fullmatch(r'auth_[0-9]{3}', authorization.get('evidence_id', '')):
        raise ValueError('Reviewed authorization requires an anonymous evidence ID')
    calibration = plan.get('calibration_reference_ids', [])
    validation = plan.get('validation_reference_ids', [])
    references = calibration + validation
    if any(not isinstance(ref, str) or not re.fullmatch(r'dim_[0-9]{3}', ref) for ref in references):
        raise ValueError('Use anonymous dimension IDs')
    if len(set(references)) != len(references):
        raise ValueError('Calibration and validation dimensions must be independent')
    if baseline:
        if len(calibration) > 1 or len(validation) > 1:
            raise ValueError('Baseline records use one calibration and one independent verification dimension')
        for field in ('load_success', 'calibration_success'):
            if not isinstance(plan.get(field), bool):
                raise ValueError('Record load and calibration outcomes, including failures')
        for field in ('tracing_seconds', 'known_length_mm', 'measured_length_mm'):
            if plan.get(field) is not None and not number(plan[field], True):
                raise ValueError('Measurements must be positive finite numbers or null')
        corrections = plan.get('corrections')
        if corrections is not None and (not isinstance(corrections, dict) or set(corrections) != {'wall', 'opening', 'room', 'scale'}
                                        or any(not number(v) or int(v) != v for v in corrections.values())):
            raise ValueError('Record nonnegative integer corrections by category or null')
        if plan.get('incidents_count') is not None and (not number(plan['incidents_count']) or int(plan['incidents_count']) != plan['incidents_count']):
            raise ValueError('Record a nonnegative incident count or null')
    else:
        if not isinstance(plan.get('geometry_reference_available'), bool) or not isinstance(plan.get('furniture_drawn'), bool):
            raise ValueError('Record reference geometry and furniture coverage')


def summarize(data):
    if type(data.get('record_version')) is not int or data['record_version'] != 1:
        raise ValueError('Unsupported evaluation record version')
    baseline = data.get('baseline', [])
    evaluation = data.get('evaluation', {})
    plans = evaluation.get('plans', [])
    if not isinstance(baseline, list) or not isinstance(plans, list):
        raise ValueError('Expected plan lists')
    for group, is_baseline in ((baseline, True), (plans, False)):
        ids = []
        for plan in group:
            validate_plan(plan, is_baseline)
            ids.append(plan['id'])
        if len(set(ids)) != len(ids):
            raise ValueError('Each set must contain distinct plans')
    eligible = lambda p: (p['data_kind'] == 'real' and p['authorization']['status'] == 'reviewed'
                          and max(p['width_px'], p['height_px']) <= 8000 and p['bytes'] <= 15 * 1024 * 1024)
    measured = [p for p in baseline if eligible(p) and p['load_success'] and p['calibration_success']
                and p.get('calibration_reference_ids') and p.get('validation_reference_ids')
                and all(p.get(k) is not None for k in ('tracing_seconds', 'known_length_mm', 'measured_length_mm', 'corrections', 'incidents_count'))]
    ready_evaluation = [p for p in plans if eligible(p) and p['geometry_reference_available']
                        and p.get('calibration_reference_ids') and p.get('validation_reference_ids')]
    authorized = [p for p in baseline if p['data_kind'] == 'real' and p['authorization']['status'] == 'reviewed']
    errors = [abs(p['measured_length_mm'] - p['known_length_mm']) / p['known_length_mm'] * 100 for p in measured]
    times = [p['tracing_seconds'] for p in measured]
    corrections = [sum(p['corrections'].values()) for p in measured]
    baseline_ready = len(measured) >= 5 and {'digital', 'scan', 'photo'} <= {p['type'] for p in measured}
    evaluation_ready = (len(ready_evaluation) >= 20 and evaluation.get('frozen') is True
                        and bool(re.fullmatch(r'eval_[0-9]{3}', evaluation.get('revision_id') or ''))
                        and {'digital', 'scan', 'photo'} <= {p['type'] for p in ready_evaluation}
                        and {False, True} <= {p['furniture_drawn'] for p in ready_evaluation})
    return {
        'scope': 'declared anonymous records; authorizations and references require human verification',
        'baseline': {'declared': len(baseline), 'eligible_measured': len(measured),
                     'real_with_reviewed_authorization': len(authorized),
                     'load_failures': sum(not p['load_success'] for p in authorized),
                     'calibration_failures_after_loading': sum(p['load_success'] and not p['calibration_success'] for p in authorized),
                     'over_ingestion_limits': sum(max(p['width_px'], p['height_px']) > 8000 or p['bytes'] > 15 * 1024 * 1024 for p in authorized),
                     'types_measured': sorted({p['type'] for p in measured}),
                     'error_absolute_percent_median': statistics.median(errors) if errors else None,
                     'error_absolute_percent_p90_nearest_rank': percentile90(errors),
                     'tracing_seconds_median': statistics.median(times) if times else None,
                     'tracing_seconds_p90_nearest_rank': percentile90(times),
                     'corrections_total': sum(corrections) if corrections else None,
                     'corrections_by_category': {key: sum(p['corrections'][key] for p in measured)
                                                 for key in ('wall', 'opening', 'room', 'scale')} if measured else None,
                     'plans_needing_correction_fraction_among_measured': sum(c > 0 for c in corrections) / len(corrections) if corrections else None},
        'evaluation': {'declared': len(plans), 'eligible_with_references': len(ready_evaluation),
                       'types_eligible': sorted({p['type'] for p in ready_evaluation}),
                       'frozen': evaluation.get('frozen') is True,
                       'overlap_with_baseline_count': len({p['id'] for p in baseline} & {p['id'] for p in plans})},
        'gate': {'baseline_complete_on_declared_records': baseline_ready,
                 'evaluation_set_complete_on_declared_records': evaluation_ready,
                 'thresholds': 'pending explicit human decision; this tool does not approve budgets',
                 'implementation_authorized': False},
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('records', type=Path, help='Local anonymous JSON; no image paths required')
    args = parser.parse_args()
    try:
        data = json.loads(args.records.read_text(), object_pairs_hook=unique_keys,
                          parse_constant=lambda _: (_ for _ in ()).throw(ValueError('Nonfinite JSON number')))
        if not isinstance(data, dict):
            raise ValueError('Expected an evaluation record object')
        print(json.dumps(summarize(data), indent=2, allow_nan=False))
    except (ValueError, TypeError, KeyError, AttributeError, OSError):
        # Do not echo filenames, record values, consent content or private paths.
        parser.exit(2, 'Invalid evaluation records; review anonymous IDs, types, independent references and measurements locally.\n')


if __name__ == '__main__':
    main()
