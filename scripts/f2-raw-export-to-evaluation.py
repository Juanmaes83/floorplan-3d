"""Convert a private raw-wall download to the existing evaluator record; no network."""
import importlib.util
import json
import sys
from pathlib import Path

sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('wall_evaluation', Path(__file__).with_name('f2-wall-evaluation.py'))
evaluator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(evaluator)


def convert(data):
    evaluator.fields(data, ('export_format', 'export_version', 'scale_applied', 'detector_source_sha256', 'evaluation_record'))
    if data['export_format'] != 'rubik-sota.raw-wall-predictions' or type(data['export_version']) is not int or data['export_version'] != 1:
        raise ValueError('Unsupported raw export version')
    evaluator.anonymous(data['detector_source_sha256'], r'[0-9a-f]{64}')
    scale = data['scale_applied']
    evaluator.fields(scale, ('method', 'mm_per_pixel', 'confidence'))
    if scale['method'] != 'known-dimension' or not evaluator.readiness.number(scale['mm_per_pixel'], True) or scale['mm_per_pixel'] > 1000 or scale['confidence'] not in ('estimated', 'real'):
        raise ValueError('Invalid applied scale')
    record = data['evaluation_record']
    evaluator.validate(record)
    if len(record['cases']) != 1 or record['cases'][0]['analysis_status'] != 'ok' or record['cases'][0]['reference_status'] != 'missing' or record['cases'][0]['references'] is not None or not record['cases'][0]['predictions']:
        raise ValueError('Raw export requires one unreviewed prediction case without references')
    return record


def main():
    parser = evaluator.PrivateParser(description=__doc__)
    parser.add_argument('records', type=Path, help='Local raw-wall JSON download')
    args = parser.parse_args()
    try:
        with args.records.open('rb') as stream:
            raw = stream.read(evaluator.MAX_INPUT_BYTES + 1)
        if len(raw) > evaluator.MAX_INPUT_BYTES:
            raise ValueError('Input limit exceeded')
        data = json.loads(raw, object_pairs_hook=evaluator.readiness.unique_keys,
                          parse_constant=lambda _: (_ for _ in ()).throw(ValueError('Nonfinite JSON number')))
        print(json.dumps(convert(data), indent=2, allow_nan=False))
    except (ValueError, TypeError, KeyError, AttributeError, OSError, RecursionError, OverflowError):
        parser.exit(2, 'Invalid raw export; review format, anonymous metadata, scale and geometry locally.\n')


if __name__ == '__main__':
    main()
