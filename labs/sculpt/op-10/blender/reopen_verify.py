"""SCULPT OP-10 · Reabre scene.blend en un proceso NUEVO y lo verifica contra su informe de importación.

python reopen_verify.py -- IMPORT-DIR REPORT.json
Comprueba: hash del .blend, metadatos de origen, número de objetos por colección, IDs y roles, unidades, y que la
geometría regenerada desde el archivo reabierto tiene EXACTAMENTE el mismo hash que blender-geometry.json.
"""
import hashlib, json, sys
from pathlib import Path
import bpy

def sha(b): return hashlib.sha256(b).hexdigest()

def main():
    a = sys.argv[sys.argv.index("--") + 1:]
    d, report_path = Path(a[0]), Path(a[1])
    if report_path.exists():
        raise SystemExit("Refusing overwrite")
    imp = json.loads((d / "import-report.json").read_text(encoding="utf8"))
    blend = d / "scene.blend"
    checks = []
    def check(name, ok, detail=None): checks.append({"check": name, "pass": bool(ok), "detail": detail})
    check("blend hash equals import report", sha(blend.read_bytes()) == imp["outputs"]["scene.blend"]["sha256"])
    bpy.ops.wm.open_mainfile(filepath=str(blend))
    sc = bpy.context.scene
    meta = json.loads(sc["op10"])
    check("scene metadata links the capture", meta["sceneSha256"] == imp["input"]["sceneSha256"] and meta["projectCanonicalSha256"] == imp["input"]["projectCanonicalSha256"], meta["projectId"])
    check("units metric, scale 1", sc.unit_settings.system == "METRIC" and abs(sc.unit_settings.scale_length - 1) < 1e-12)
    check("transform declared once", meta["transform"] == "(XB,YB,ZB)=(x,-z,y)")
    objs = [o for o in bpy.data.objects if o.type == "MESH"]
    check("object count", len(objs) == imp["objects"], len(objs))
    cols = {c.name[len("Rubik_"):]: len(c.objects) for c in bpy.data.collections if c.name.startswith("Rubik_")}
    check("collections and counts", cols == imp["collections"], cols)
    check("every object carries rubik_role and rubik_mesh", all(("rubik_role" in o and "rubik_mesh" in o) for o in objs))
    # Geometría regenerada desde el archivo reabierto (mismo algoritmo que import_scene.py).
    back = {"schema": "rubik-sota.observed-scene", "units": "metres", "axes": "three-y-up", "unitsToMetresApplied": 1, "frame": meta.get("frame"), "source": "blender-roundtrip", "meshes": []}
    for o in objs:
        mw = o.matrix_world
        vs = [[round(v[0], 6), round(v[2], 6), round(-v[1], 6)] for v in (mw @ vt.co for vt in o.data.vertices)]
        vs = [[0.0 if x == 0 else x for x in v] for v in vs]
        mm = {"min": [min(v[i] for v in vs) for i in range(3)], "max": [max(v[i] for v in vs) for i in range(3)]}
        back["meshes"].append({"name": o["rubik_mesh"], "entity": {"id": o["rubik_id"] or None, "role": o["rubik_role"]}, "level": o["rubik_level"] or None,
                               "material": json.loads(o.data.materials[0]["op10_source"]) if o.data.materials else {"kind": "none"},
                               "vertices": vs, "faces": [list(p.vertices) for p in o.data.polygons], "bounds": mm})
    back["meshes"].sort(key=lambda m: int(m["name"].rsplit(":", 1)[1]))
    regenerated = sha(json.dumps(back, separators=(",", ":")).encode())
    check("regenerated geometry hash equals the import", regenerated == imp["outputs"]["blender-geometry.json"]["sha256"], regenerated[:16])
    out = {"status": "PASS" if all(c["pass"] for c in checks) else "FAIL", "process": "fresh", "blender": bpy.app.version_string, "checks": checks}
    report_path.write_text(json.dumps(out, indent=1) + "\n", encoding="utf8")
    print(json.dumps({"status": out["status"], "checks": len(checks), "failed": [c["check"] for c in checks if not c["pass"]]}))
    if out["status"] != "PASS":
        sys.exit(2)

if __name__ == "__main__":
    main()
