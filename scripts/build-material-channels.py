"""Derive bounded Floor Plan data maps from the pinned Casa Serra CC0 JPEGs.

Usage: python scripts/build-material-channels.py PATH_TO_VERIFIED_SOURCE_MAPS
The source directory contains oak_wood_planks/{nor,arm}.jpg and
marble_01/{nor,arm}.jpg. Verify its hashes against the source audit first.
"""

import hashlib
import json
import sys
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(sys.argv[1]).resolve()
CATALOG = ROOT / "assets/materials/catalog.json"
AUDIT = ROOT / "docs/qa/artifacts/casa-serra/source-map-audit.json"
SPEC = {
    "surface-oak-wood-planks": ("oak_wood_planks", "oak-wood-planks"),
    "surface-marble-01": ("marble_01", "marble-01"),
}


def write_map(source_asset, stem, channel):
    source_name = "nor.jpg" if channel == "normal" else "arm.jpg"
    source_record = next(m for m in audit["maps"] if m["path"].endswith(f"/{source_asset}/{source_name}"))
    with Image.open(SOURCE / source_asset / source_name) as image:
        image = image.convert("RGB").resize((256, 256), Image.Resampling.LANCZOS)
        if channel == "roughness":
            # ARM encodes roughness in G; do not silently turn B into metalness.
            green = image.getchannel("G")
            image = Image.merge("RGB", (green, green, green))
        target = ROOT / "assets/materials" / f"{stem}-{channel}.webp"
        image.save(target, format="WEBP", lossless=True, method=6)
    payload = target.read_bytes()
    assert 0 < len(payload) <= 512 * 1024
    return {
        "path": target.relative_to(ROOT).as_posix(),
        "format": "image/webp",
        "width": 256,
        "height": 256,
        "bytes": len(payload),
        "sha256": hashlib.sha256(payload).hexdigest(),
        "origin": {
            "repository": audit["sourceRepository"],
            "revision": audit["sourceRevision"],
            "path": source_record["path"],
            "sha256": source_record["sha256"],
            "license": "CC0-1.0",
            "derivation": "256px Lanczos; lossless WebP; ARM green only" if channel == "roughness" else "256px Lanczos; lossless WebP; GL normal RGB"
        },
    }


catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
audit = json.loads(AUDIT.read_text(encoding="utf-8"))
for source_asset, _ in SPEC.values():
    for channel in ("diff", "nor", "arm"):
        file = SOURCE / source_asset / f"{channel}.jpg"
        record = next(m for m in audit["maps"] if m["path"].endswith(f"/{source_asset}/{channel}.jpg"))
        data = file.read_bytes()
        if len(data) != record["bytes"] or hashlib.sha256(data).hexdigest() != record["sha256"]:
            raise ValueError(f"Source audit mismatch: {file}")
for entry in catalog["entries"]:
    if entry["id"] not in SPEC:
        continue
    source_asset, stem = SPEC[entry["id"]]
    entry["maps"]["normal"] = write_map(source_asset, stem, "normal")
    entry["maps"]["roughness"] = write_map(source_asset, stem, "roughness")
    entry["totalBytes"] = entry["sample"]["bytes"] + sum(m["bytes"] for m in entry["maps"].values())
    entry["estimatedGpuBytes"] = sum((m["width"] * m["height"] * 4 * 4 + 2) // 3 for m in entry["maps"].values())
CATALOG.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
