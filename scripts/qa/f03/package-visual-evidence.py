#!/usr/bin/env python3
import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageDraw


def identity(path, root):
    data = path.read_bytes()
    return {"path": path.relative_to(root).as_posix(), "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}


def save_webp(source, destination, quality=90):
    destination.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as image:
        image.convert("RGB").save(destination, "WEBP", quality=quality, method=6)


def contact_sheet(root, destination, views, size, title):
    width, height = size
    label_height = 42
    sheet = Image.new("RGB", (width * 3, (height + label_height) * len(views) + 56), (242, 242, 240))
    draw = ImageDraw.Draw(sheet)
    draw.text((12, 12), title, fill=(20, 20, 20))
    draw.text((12, 30), "A: F02 OFF/F03 OFF  |  B: F02 ON/F03 OFF  |  C: F02 ON/F03 ON", fill=(20, 20, 20))
    for row, view in enumerate(views):
        for column, variant in enumerate(("A", "B", "C")):
            x, y = column * width, 56 + row * (height + label_height)
            draw.text((x + 10, y + 12), f"{variant} / {view}", fill=(20, 20, 20))
            with Image.open(root / f"{variant}-{view}.png") as image:
                sheet.paste(image.convert("RGB").resize((width, height), Image.Resampling.LANCZOS), (x, y + label_height))
    destination.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(destination, "WEBP", quality=92, method=6)


def detail_pair(root, destination, view, crop=None):
    images = []
    for variant in ("B", "C"):
        with Image.open(root / f"{variant}-{view}.png") as image:
            images.append(image.convert("RGB").crop(crop) if crop else image.convert("RGB"))
    width, height = images[0].size
    sheet = Image.new("RGB", (width * 2, height + 42), (242, 242, 240))
    draw = ImageDraw.Draw(sheet)
    draw.text((12, 14), f"B / {view} / F03 OFF", fill=(20, 20, 20))
    draw.text((width + 12, 14), f"C / {view} / F03 ON", fill=(20, 20, 20))
    sheet.paste(images[0], (0, 42))
    sheet.paste(images[1], (width, 42))
    destination.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(destination, "WEBP", quality=94, method=6)


def convert_manifest(source, destination):
    manifest = json.loads(source.read_text(encoding="utf-8"))
    for capture in manifest["captures"]:
        source_name = capture["file"]
        capture["sourcePngSha256"] = capture.pop("sha256")
        capture["file"] = str(Path(source_name).with_suffix(".webp")).replace("\\", "/")
    destination.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return manifest


def main():
    parser = argparse.ArgumentParser(description="Empaqueta capturas F03 como WebP y hojas comparativas verificables")
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[3]
    source, output = args.input.resolve(), args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    desktop = convert_manifest(source / "desktop-manifest.json", output / "desktop-manifest.json")
    mobile = convert_manifest(source / "mobile-manifest.json", output / "mobile-manifest.json")
    for manifest in (desktop, mobile):
        for capture in manifest["captures"]:
            save_webp(source / capture["file"].replace(".webp", ".png"), output / capture["file"])
    contact_sheet(source, output / "desktop-contact.webp", ["D1", "M1", "M2", "M3", "F1", "G1", "F02-M1"], (480, 300), "RUBIK F03 / desktop / fixed cameras")
    contact_sheet(source / "mobile", output / "mobile-contact.webp", ["M1", "F1"], (390, 500), "RUBIK F03 / emulated mobile 390x844")
    detail_pair(source, output / "D1-material-detail.webp", "D1", (400, 200, 1040, 700))
    detail_pair(source, output / "F02-window-control.webp", "F02-M1")
    files = [identity(path, root) for path in sorted(output.rglob("*")) if path.is_file() and path.name != "evidence-manifest.json"]
    evidence = {
        "schema": "F03/visual-evidence@1",
        "codeSha": desktop["codeSha"],
        "projectSha256": desktop["projectSha256"],
        "geometrySha256": desktop["geometrySha256"],
        "desktopCaptures": len(desktop["captures"]),
        "mobileCaptures": len(mobile["captures"]),
        "sourcePngPolicy": "Los PNG originales se convirtieron a WebP RGB; sourcePngSha256 conserva la identidad de la captura original.",
        "visualGate": "VISUAL_PENDING_HUMAN",
        "files": files,
    }
    (output / "evidence-manifest.json").write_text(json.dumps(evidence, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"output": output.relative_to(root).as_posix(), "files": len(files) + 1, "desktopCaptures": len(desktop["captures"]), "mobileCaptures": len(mobile["captures"])}))


if __name__ == "__main__":
    main()
