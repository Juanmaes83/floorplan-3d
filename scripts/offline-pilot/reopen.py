"""Offline pilot: reopen pilot.blend in a NEW process and compare it with the render report.

python|blender --background --python reopen.py -- RENDER-OUT NEW-REPORT.json
Fails (exit 1) when IDs, roles, counts, input hashes, camera keys or the saved file hash differ.
"""
import hashlib, json, sys
from pathlib import Path
import bpy


def digest(data):
    return hashlib.sha256(data).hexdigest()


def main():
    out, report_path = map(Path, sys.argv[sys.argv.index("--")+1:][:2])
    if report_path.exists():
        raise ValueError("Refusing overwrite")
    report = json.loads((out/"render-report.json").read_text(encoding="utf8"))
    blend = out/"pilot.blend"
    saved_hash = digest(blend.read_bytes())
    checks = []

    def check(name, actual, expected):
        checks.append({"check": name, "actual": actual, "expected": expected, "pass": actual == expected})

    check("pilot.blend sha256 unchanged since render", saved_hash, report["pilotBlend"]["sha256"])
    bpy.ops.wm.open_mainfile(filepath=str(blend.resolve()))
    scene = bpy.context.scene
    entities = {o.get("rubik_id"): o for o in scene.objects if o.get("rubik_role") in ("wall", "room", "opening", "object")}
    check("entity counts by role", {r: sum(1 for o in entities.values() if o.get("rubik_role") == r) for r in ("room", "wall", "opening", "object")}, report["scene"]["entities"])
    check("entity IDs sha256", digest("\n".join(sorted(entities)).encode()), report["scene"]["entityIdsSha256"])
    check("package sha256 in scene", scene.get("rubik_package_sha256"), report["inputs"]["packageSha256"])
    check("shots sha256 in scene", scene.get("pilot_shots_sha256"), report["inputs"]["shotsSha256"])
    check("unit system", [scene.unit_settings.system, scene.unit_settings.scale_length], ["METRIC", 1.0])
    check("frame range", [scene.frame_start, scene.frame_end], [1, report["framesInTimeline"]])
    cam = scene.camera
    check("camera", cam.name if cam else None, "PilotCamera")
    action = cam.animation_data.action if cam and cam.animation_data else None
    curves = [] if action is None else list(action.fcurves) if hasattr(action, "fcurves") else \
        [fc for layer in action.layers for strip in layer.strips for bag in strip.channelbags for fc in bag.fcurves]
    keys = sorted({int(k.co[0]) for fc in curves for k in fc.keyframe_points})
    check("camera keys use constant interpolation (hard cuts)", all(k.interpolation == "CONSTANT" for fc in curves for k in fc.keyframe_points), True)
    check("camera keyed on every frame", len(keys), report["scene"]["cameraKeyframes"])
    for shot in report["timeline"]:
        scene.frame_set(shot["first"])
        check(f"{shot['roomId']} first-frame camera inside scene bounds", all(abs(v) < 100 for v in cam.location), True)
    ok = all(c["pass"] for c in checks)
    result = {"status": "PASS" if ok else "FAIL", "blender": bpy.app.version_string, "process": "fresh", "checks": checks}
    report_path.write_text(json.dumps(result, indent=1, ensure_ascii=False)+"\n", encoding="utf8")
    print(json.dumps({"status": result["status"], "checks": len(checks), "failed": [c["check"] for c in checks if not c["pass"]]}))
    if not ok:
        sys.exit(1)


if __name__ == "__main__":
    main()
