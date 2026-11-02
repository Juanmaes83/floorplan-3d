"""Split the verified RAW ZIP into GitHub release-sized, hash-addressed chunks."""
import hashlib
import json
from pathlib import Path

repo = Path(__file__).resolve().parents[2]
evidence = repo / 'docs/product/evidence/donor-runtime-audit-2026-11-02'
manifest = json.loads((evidence / 'raw-package-manifest.json').read_text(encoding='utf-8'))
source = Path(manifest['packagePath'])
part_size = 1_500_000_000
parts = []
whole = hashlib.sha256()
with source.open('rb') as src:
    index = 1
    while True:
        block = src.read(part_size)
        if not block:
            break
        whole.update(block)
        target = source.with_name(f'{source.name}.part{index:03d}')
        with target.open('wb') as out:
            out.write(block)
        part_hash = hashlib.sha256(block).hexdigest()
        parts.append({'path': str(target), 'name': target.name, 'bytes': len(block), 'sha256': part_hash})
        index += 1
assert whole.hexdigest() == manifest['sha256']
assert sum(part['bytes'] for part in parts) == manifest['bytes']
manifest['releaseParts'] = parts
manifest['releaseReassembly'] = 'Concatenate parts in numeric order as raw bytes; then verify the ZIP SHA256.'
(evidence / 'raw-package-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'parts': parts, 'zipSha256': whole.hexdigest()}, indent=2))
