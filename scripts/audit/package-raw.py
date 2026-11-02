"""Create and verify a recoverable ZIP of the immutable RAW folder outside Git."""
import hashlib
import json
from pathlib import Path
import zipfile

repo = Path(__file__).resolve().parents[2]
evidence = repo / 'docs/product/evidence/donor-runtime-audit-2026-11-02'
inventory_path = evidence / 'raw-inventory.json'
inventory = json.loads(inventory_path.read_text(encoding='utf-8'))
raw = Path(inventory['rawRoot'])
package = raw.with_suffix('.zip')

def sha256(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()

for item in inventory['files']:
    source = raw / item['path']
    if not source.is_file() or source.stat().st_size != item['bytes']:
        raise RuntimeError(f'Missing/size mismatch: {source}')
    if sha256(source) != item['sha256']:
        raise RuntimeError(f'RAW SHA mismatch: {source}')

with zipfile.ZipFile(package, 'w', compression=zipfile.ZIP_STORED, allowZip64=True) as archive:
    for item in inventory['files']:
        archive.write(raw / item['path'], arcname=item['path'])

with zipfile.ZipFile(package, 'r', allowZip64=True) as archive:
    names = archive.namelist()
    expected = [item['path'] for item in inventory['files']]
    if names != expected:
        raise RuntimeError('ZIP members differ from sorted RAW inventory')
    failed = archive.testzip()
    if failed:
        raise RuntimeError(f'ZIP CRC failure: {failed}')

manifest = {
    'schemaVersion': 'rubik-donor-runtime-audit.raw-package.v1',
    'status': 'LOCAL_VERIFIED_NOT_UPLOADED',
    'packagePath': str(package),
    'format': 'ZIP_STORED_ZIP64',
    'bytes': package.stat().st_size,
    'sha256': sha256(package),
    'rawRoot': str(raw),
    'rawFileCount': inventory['fileCount'],
    'rawBytes': inventory['totalBytes'],
    'rawPackageContentSha256': inventory['packageContentSha256'],
    'rawInventorySha256': sha256(inventory_path),
    'memberPathsAndCRCsVerified': True,
    'originalRawPreserved': True,
    'remoteBinaryBackup': 'NOT_UPLOADED',
    'note': 'ZIP is outside Git and does not alter the original RAW folder. Git carries per-file hashes and nonvideo evidence.'
}
(evidence / 'raw-package-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'packagePath': str(package), 'bytes': manifest['bytes'], 'sha256': manifest['sha256'], 'members': len(names)}))
