# SPDX-License-Identifier: GPL-3.0-or-later
# Copyright (C) 2026 Juan Manuel Espinosa Galant · Rubik Sota
# Script del kit «Escena para Blender» de RUBIK SOTA. Usa la API bpy de Blender (GPL-2.0-or-later) y se distribuye bajo
# la GNU GPL v3 o posterior: ver LICENCIA-SCRIPTS.txt y COPYING-GPL-3.0.txt. Sin garantía. Esta licencia NO se extiende
# a la aplicación web de RUBIK, a los lanzadores ni a los proyectos, imágenes, renders o archivos .blend de la persona.
"""OP-10 · Reabre scene.blend en un proceso NUEVO y lo verifica contra su informe de importación.
M03 · viaja en el ZIP de Entregar como rubik_blender_verify.py (copia exacta).

python blender-scene-reopen.py -- IMPORT-DIR REPORT.json
Comprueba: hash del .blend, metadatos que enlazan la escena con su paquete, unidades, colecciones y recuentos, cámara,
propiedades rubik_* en cada malla y que la geometría regenerada desde el archivo reabierto tiene EXACTAMENTE el mismo hash
que blender-geometry.json (mismo algoritmo, importado de blender-scene-import.py).
"""
import hashlib, importlib.util, json, sys
from pathlib import Path
import bpy

sys.dont_write_bytecode = True  # importing the sibling importer must not leave __pycache__ in the repository

# En el repositorio el importador es blender-scene-import.py; dentro del ZIP de Entregar viaja como rubik_blender_prepare.py.
_imp = next(p for p in (Path(__file__).with_name("blender-scene-import.py"), Path(__file__).with_name("rubik_blender_prepare.py")) if p.exists())
spec = importlib.util.spec_from_file_location("blender_scene_import", _imp)
common = importlib.util.module_from_spec(spec)
spec.loader.exec_module(common)


def sha(b):
    return hashlib.sha256(b).hexdigest()


def main():
    a = sys.argv[sys.argv.index("--") + 1:]
    d, report_path = Path(a[0]), Path(a[1])
    if report_path.exists():
        raise SystemExit("Refusing overwrite")
    imp = json.loads((d / "import-report.json").read_text(encoding="utf8"))
    blend = d / "scene.blend"
    checks = []

    def check(name, ok, detail=None):
        checks.append({"check": name, "pass": bool(ok), "detail": detail})
    prepared_sha = sha(blend.read_bytes())
    check("blend hash equals import report", prepared_sha == imp["outputs"]["scene.blend"]["sha256"])
    bpy.ops.wm.open_mainfile(filepath=str(blend))
    sc = bpy.context.scene
    meta = json.loads(sc["rubik"])
    check("scene metadata links the package", meta["glbSha256"] == imp["input"]["glbSha256"] and meta["observedProjectSha256"] == imp["input"]["observedProjectSha256"], meta["projectId"])
    check("units metric, scale 1", sc.unit_settings.system == "METRIC" and abs(sc.unit_settings.scale_length - 1) < 1e-12)
    check("transform declared once", meta["transform"] == "(XB,YB,ZB)=(x,-z,y)")
    cols = {c.name[len("Rubik_"):]: len(c.objects) for c in bpy.data.collections if c.name.startswith("Rubik_")}
    check("collections and counts", cols == imp["collections"], cols)
    check("active camera kept", (sc.camera.name if sc.camera else None) == imp["camera"], sc.camera.name if sc.camera else None)
    meshes = [o for o in bpy.data.objects if o.type == "MESH"]
    check("mesh count", len(meshes) == imp["objects"], len(meshes))
    check("every mesh carries rubik_role and rubik_mesh", all(("rubik_role" in o and "rubik_mesh" in o) for o in meshes))
    names = {o["rubik_mesh"] for o in meshes if "rubik_mesh" in o}
    back, bad = common.geometry_back(names, json.loads((d / "blender-geometry.json").read_text(encoding="utf8"))["frame"])
    regenerated = sha(json.dumps(back, separators=(",", ":")).encode())
    check("regenerated geometry hash equals the import", not bad and regenerated == imp["outputs"]["blender-geometry.json"]["sha256"], regenerated[:16])
    out = {"status": "PASS" if all(c["pass"] for c in checks) else "FAIL", "process": "fresh", "blender": bpy.app.version_string, "checks": checks,
           "input": {"preparedBlendSha256": prepared_sha, **{k: meta[k] for k in ("glbSha256", "projectId", "observedProjectSha256")}}}
    report_path.write_text(json.dumps(out, indent=1) + "\n", encoding="utf8")
    print(json.dumps({"status": out["status"], "checks": len(checks), "failed": [c["check"] for c in checks if not c["pass"]]}))
    if out["status"] != "PASS":
        sys.exit(2)


if __name__ == "__main__":
    main()
