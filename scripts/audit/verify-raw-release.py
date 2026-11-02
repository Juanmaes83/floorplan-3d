"""Verify the out-of-history GitHub RAW assets and record their recovery URLs."""
import json
import subprocess
from pathlib import Path

repo = Path(__file__).resolve().parents[2]
evidence = repo / 'docs/product/evidence/donor-runtime-audit-2026-11-02'
path = evidence / 'raw-package-manifest.json'
manifest = json.loads(path.read_text(encoding='utf-8'))
release = json.loads(subprocess.check_output([
    'gh', 'release', 'view', 'donor-runtime-audit-2026-11-02',
    '--repo', 'Juanmaes83/floorplan-3d', '--json', 'assets,isDraft,url'
], text=True))
assets = {a['name']: a for a in release['assets']}
assert release['isDraft'] is True
assert len(manifest['releaseParts']) == 3
for part in manifest['releaseParts']:
    remote = assets[part['name']]
    assert remote['size'] == part['bytes']
    assert remote['digest'] == 'sha256:' + part['sha256']
    assert remote['state'] == 'uploaded'
    part['remoteUrl'] = remote['url']
manifest['status'] = 'LOCAL_AND_REMOTE_VERIFIED'
manifest['remoteBinaryBackup'] = 'GITHUB_DRAFT_RELEASE_VERIFIED'
manifest['remoteReleaseUrl'] = release['url']
manifest['remoteReleaseDraft'] = True
manifest['remoteVerifiedPartCount'] = len(manifest['releaseParts'])
path.write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'release': release['url'], 'parts': len(manifest['releaseParts']), 'digestsMatched': True}, indent=2))
