#!/usr/bin/env python3
import argparse
import hashlib
import json
import math
import platform
from pathlib import Path

import numpy as np
import OpenEXR
from PIL import Image, ImageCms

MATERIALS = {
    "white_stucco": {
        "albedo": "white_stucco_diff_4k.jpg",
        "normal": "white_stucco_nor_gl_4k.exr",
        "roughness": "white_stucco_rough_4k.exr",
        "displacement": "white_stucco_disp_4k.png",
        "archive": "white_stucco_4k.blend.zip",
    },
    "white_rough_plaster": {
        "albedo": "white_rough_plaster_diff_4k.jpg",
        "normal": "white_rough_plaster_nor_gl_4k.exr",
        "roughness": "white_rough_plaster_rough_4k.jpg",
        "displacement": "white_rough_plaster_disp_4k.png",
        "archive": "white_rough_plaster_4k.blend.zip",
    },
    "rough_plaster_03": {
        "albedo": "rough_plaster_03_diff_4k.jpg",
        "normal": "rough_plaster_03_nor_gl_4k.exr",
        "roughness": "rough_plaster_03_rough_4k.jpg",
        "displacement": "rough_plaster_03_disp_4k.png",
        "archive": "rough_plaster_03_4k.blend.zip",
    },
}
PROFILES = {"hero": 1024, "balanced": 512}
COMPATIBILITY = {
    "white_stucco": {"preset": "surface-white-plaster-02", "albedo": "white-plaster-02.webp", "mapTint": "#f2f2f2"},
    "white_rough_plaster": {"preset": "surface-white-plaster-02", "albedo": "white-plaster-02.webp", "mapTint": "#f2f2f2"},
    "rough_plaster_03": {"preset": "surface-plastered-wall-03", "albedo": "plastered-wall-03.webp", "mapTint": "#ffffff"},
}


def sha256(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def stats(array):
    values = np.asarray(array, dtype=np.float32)
    return {
        "min": float(values.min()),
        "max": float(values.max()),
        "mean": float(values.mean()),
    }


def file_identity(path, root):
    return {
        "path": path.relative_to(root).as_posix(),
        "bytes": path.stat().st_size,
        "sha256": sha256(path),
    }


def exr_source(path, root, expected_channels):
    with OpenEXR.File(str(path)) as source:
        header = source.header()
        channels = source.channels()
        expected = set(expected_channels)
        rgba_normal = expected == {"RGB"} and set(channels) == {"RGBA"}
        if set(channels) != expected and not rgba_normal:
            raise ValueError(f"Canales EXR inesperados en {path}: {list(channels)}")
        pixels = {name: channel.pixels.astype(np.float32) for name, channel in channels.items()}
        primary = pixels[next(iter(pixels))]
        record = file_identity(path, root)
        record.update({
            "format": "EXR",
            "width": primary.shape[1],
            "height": primary.shape[0],
            "depth": "float16",
            "colorSpace": "linear",
            "compression": str(header["compression"]),
            "dataWindow": np.asarray(header["dataWindow"]).tolist(),
            "channels": {name: stats(value) for name, value in pixels.items()},
        })
        return pixels, record


def ldr_source(path, root):
    with Image.open(path) as source:
        source.load()
        icc = source.info.get("icc_profile")
        profile = None
        if icc:
            import io
            profile = ImageCms.getProfileDescription(ImageCms.ImageCmsProfile(io.BytesIO(icc))).strip()
        record = file_identity(path, root)
        record.update({
            "format": source.format,
            "width": source.width,
            "height": source.height,
            "depth": 16 if source.mode.startswith("I") else 8,
            "mode": source.mode,
            "channels": list(source.getbands()),
            "iccProfile": profile,
            "extrema": source.getextrema(),
        })
        return source.copy(), icc, record


def area_reduce(values, size):
    height, width = values.shape[:2]
    if height % size or width % size:
        raise ValueError("La reducción de datos requiere dimensiones múltiplo del destino")
    shape = (size, height // size, size, width // size) + values.shape[2:]
    return values.reshape(shape).mean(axis=(1, 3), dtype=np.float32)


def srgb_image(source, icc):
    image = source.convert("RGB")
    if icc:
        import io
        input_profile = ImageCms.ImageCmsProfile(io.BytesIO(icc))
        output_profile = ImageCms.createProfile("sRGB")
        image = ImageCms.profileToProfile(image, input_profile, output_profile, outputMode="RGB")
    return image


def normal_pixels(exr):
    group = "RGB" if "RGB" in exr else "RGBA"
    encoded = np.clip(exr[group][:, :, :3], 0.0, 1.0)
    vectors = encoded * 2.0 - 1.0
    lengths = np.linalg.norm(vectors, axis=2, keepdims=True)
    degenerate = lengths[:, :, 0] < 0.1
    unit = vectors / np.maximum(lengths, 1e-8)
    unit[degenerate] = (0.0, 0.0, 1.0)
    return unit, int(np.count_nonzero(degenerate))


def encode_normal(vectors):
    lengths = np.linalg.norm(vectors, axis=2, keepdims=True)
    unit = vectors / np.maximum(lengths, 1e-8)
    return np.rint(np.clip(unit * 0.5 + 0.5, 0.0, 1.0) * 255.0).astype(np.uint8)


def roughness_pixels(source, exr=None):
    if exr is not None:
        return np.clip(exr["Y"], 0.0, 1.0)
    if source.mode not in ("L", "I", "I;16"):
        array = np.asarray(source.convert("RGB"))
        if not (np.array_equal(array[:, :, 0], array[:, :, 1]) and np.array_equal(array[:, :, 1], array[:, :, 2])):
            raise ValueError("La rugosidad LDR debe ser monocanal o RGB gris")
        source = Image.fromarray(array[:, :, 0], "L")
    if source.mode != "L":
        source = source.convert("L")
    return np.asarray(source, dtype=np.float32) / 255.0


def save_webp(image, path, lossless):
    path.parent.mkdir(parents=True, exist_ok=True)
    options = {"format": "WEBP", "method": 6, "exact": True}
    if lossless:
        options["lossless"] = True
        options["quality"] = 100
    else:
        options["quality"] = 88
    image.save(path, **options)


def derivative_record(path, root, role, size, source, color_space):
    record = file_identity(path, root)
    record.update({
        "role": role,
        "width": size,
        "height": size,
        "format": "WebP",
        "colorSpace": color_space,
        "sourceSha256": source["sha256"],
        "estimatedGpuBytesWithMipmaps": math.ceil(size * size * 4 * 4 / 3),
    })
    return record


def integration_record(material, root, output):
    compatibility = COMPATIBILITY[material]
    original_path = root / "assets/materials" / compatibility["albedo"]
    derived_path = output / material / "hero/albedo.webp"
    with Image.open(original_path) as image:
        original = np.asarray(image.convert("RGB"), dtype=np.float64) / 255.0
    with Image.open(derived_path) as image:
        derived = np.asarray(image.convert("RGB"), dtype=np.float64) / 255.0
    to_linear = lambda values: np.where(values <= 0.04045, values / 12.92, ((values + 0.055) / 1.055) ** 2.4)
    to_srgb = lambda values: np.where(values <= 0.0031308, 12.92 * values, 1.055 * values ** (1 / 2.4) - 0.055)
    tint = np.array([int(compatibility["mapTint"][i:i + 2], 16) / 255.0 for i in (1, 3, 5)])
    ratio = to_linear(original).mean(axis=(0, 1)) * to_linear(tint) / to_linear(derived).mean(axis=(0, 1))
    return {
        "compatiblePreset": compatibility["preset"],
        "originalAlbedo": file_identity(original_path, root),
        "originalMapTint": compatibility["mapTint"],
        "tintLinear": ratio.tolist(),
        "tintSrgb": to_srgb(ratio).tolist(),
        "method": "Media RGB lineal del albedo original multiplicada por mapTint, dividida por la media lineal del nuevo albedo HERO; conserva identidad cromática sin alterar el proyecto.",
    }


def convert_material(material, paths, root, output, repeat_mm):
    source_records = {}
    albedo, albedo_icc, source_records["albedo"] = ldr_source(paths["albedo"], root)
    normal_exr, source_records["normal"] = exr_source(paths["normal"], root, ["RGB"])
    normal, degenerate_count = normal_pixels(normal_exr)
    source_records["normal"]["degeneratePixelsBelow0.1"] = degenerate_count
    source_records["normal"]["degeneratePixelPolicy"] = "Reparados como normal plana +Z; los demás vectores se normalizan."
    if paths["roughness"].suffix.lower() == ".exr":
        rough_exr, source_records["roughness"] = exr_source(paths["roughness"], root, ["Y"])
        roughness = roughness_pixels(None, rough_exr)
        rough_source_image = None
    else:
        rough_source_image, _, source_records["roughness"] = ldr_source(paths["roughness"], root)
        roughness = roughness_pixels(rough_source_image)
    _, _, source_records["displacement"] = ldr_source(paths["displacement"], root)
    source_records["displacement"].update({
        "runtimeEnabled": False,
        "reason": "Sin subdivisión apta ni autorización para alterar cotas constructivas; se conserva sólo la fuente.",
    })

    variants = {}
    for profile, size in PROFILES.items():
        destination = output / material / profile
        albedo_image = srgb_image(albedo, albedo_icc).resize((size, size), Image.Resampling.LANCZOS)
        albedo_path = destination / "albedo.webp"
        save_webp(albedo_image, albedo_path, False)
        with Image.open(albedo_path) as verified:
            error = np.abs(np.asarray(verified.convert("RGB"), dtype=np.int16) - np.asarray(albedo_image, dtype=np.int16))
            albedo_mae = float(error.mean())

        reduced_normal = area_reduce(normal, size)
        normal_path = destination / "normal-gl.webp"
        save_webp(Image.fromarray(encode_normal(reduced_normal), "RGB"), normal_path, True)
        with Image.open(normal_path) as verified:
            decoded = np.asarray(verified.convert("RGB"), dtype=np.float32) / 255.0 * 2.0 - 1.0
            unit_error = np.abs(np.linalg.norm(decoded, axis=2) - 1.0)
            normal_unit_error = {"mean": float(unit_error.mean()), "max": float(unit_error.max())}

        reduced_roughness = np.clip(area_reduce(roughness, size), 0.0, 1.0)
        roughness_bytes = np.rint(reduced_roughness * 255.0).astype(np.uint8)
        roughness_path = destination / "roughness.webp"
        save_webp(Image.fromarray(np.repeat(roughness_bytes[:, :, None], 3, axis=2), "RGB"), roughness_path, True)
        with Image.open(roughness_path) as verified:
            decoded = np.asarray(verified.convert("RGB"))
            if not (np.array_equal(decoded[:, :, 0], decoded[:, :, 1]) and np.array_equal(decoded[:, :, 1], decoded[:, :, 2])):
                raise ValueError("Fallo de verificación del canal G de rugosidad")

        variants[profile] = {
            "repeatMm": {"x": repeat_mm, "y": repeat_mm},
            "scaleAuthority": "EXPERIMENTAL_NOT_SOURCE_CERTIFIED",
            "maps": {
                "albedo": derivative_record(albedo_path, root, "baseColor", size, source_records["albedo"], "SRGBColorSpace"),
                "normal": derivative_record(normal_path, root, "normalOpenGL_Yplus", size, source_records["normal"], "NoColorSpace"),
                "roughness": derivative_record(roughness_path, root, "roughness_replicated_RGB_read_G", size, source_records["roughness"], "NoColorSpace"),
            },
            "verification": {
                "albedoMeanAbsoluteError8bit": albedo_mae,
                "normalUnitLengthErrorAfter8bit": normal_unit_error,
                "normalYFlippedByPipeline": False,
                "roughnessGreenEqualsRedAndBlue": True,
                "displacementEnabled": False,
            },
        }
    return {
        "sourceArchive": paths["archive"],
        "provenance": "Poly Haven; CC0 comunicada por el usuario",
        "sources": source_records,
        "integration": integration_record(material, root, output),
        "variants": variants,
    }


def main():
    parser = argparse.ArgumentParser(description="Convierte los tres sets F03 sin alterar las fuentes 4K")
    parser.add_argument("--repeat-mm", type=int, default=2000)
    parser.add_argument("--audit-only", action="store_true")
    args = parser.parse_args()
    if args.repeat_mm <= 0:
        parser.error("--repeat-mm debe ser positivo")
    root = Path(__file__).resolve().parents[3]
    references = root / "docs/qa/f03-facade-fidelity-v1/references/02-facade-materials"
    output = root / "assets/materials/f03"
    materials = {}
    for name, files in MATERIALS.items():
        paths = {role: references / ("albedo-previews" if role == "albedo" else "pbr-source-maps") / filename for role, filename in files.items() if role != "archive"}
        paths["archive"] = files["archive"]
        if args.audit_only:
            records = {}
            for role in ("albedo", "roughness", "displacement"):
                if paths[role].suffix.lower() != ".exr":
                    _, _, records[role] = ldr_source(paths[role], root)
            for role, channels in (("normal", ["RGB"]), ("roughness", ["Y"])):
                if paths[role].suffix.lower() == ".exr":
                    _, records[role] = exr_source(paths[role], root, channels)
            materials[name] = {"sourceArchive": paths["archive"], "sources": records}
        else:
            materials[name] = convert_material(name, paths, root, output, args.repeat_mm)
    manifest = {
        "schema": "F03/pbr-derivatives@1",
        "visualOnly": True,
        "enabledByDefault": False,
        "tool": {
            "script": "scripts/qa/f03/convert-pbr.py",
            "python": platform.python_version(),
            "OpenEXR": OpenEXR.__version__,
            "NumPy": np.__version__,
            "Pillow": Image.__version__,
            "albedoWebP": {"quality": 88, "method": 6},
            "dataWebP": {"lossless": True, "method": 6, "exact": True},
        },
        "sourceColorPolicy": "Albedo convertido a sRGB si ICC está presente; sin ICC se conservan valores y se declara sRGB. Datos EXR/JPG lineales sin gamma.",
        "profiles": PROFILES,
        "materials": materials,
    }
    destination = output / ("source-audit.json" if args.audit_only else "derivatives-manifest.json")
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(destination.relative_to(root).as_posix())


if __name__ == "__main__":
    main()
