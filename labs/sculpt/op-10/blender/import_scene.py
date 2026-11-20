"""SCULPT OP-10 · Importa una escena observada de RUBIK (scene.json) en Blender y la verifica.

python import_scene.py -- CAPTURE-DIR OUT-DIR [--materials neutral|observed]
   (con el `python` del entorno bpy 5.2.1, o: blender --background --factory-startup --python-exit-code 1 --python ...)

- Marco: la escena llega en metros, Y arriba (Three.js). Blender es Z arriba: (XB, YB, ZB) = (x, -z, y), UNA sola vez.
  No se aplica ningún otro factor (la captura ya declara unitsToMetresApplied = 1).
- Un objeto por malla observada, con propiedades rubik_id / rubik_role / rubik_level / rubik_mesh. Colecciones por rol.
- Materiales: «neutral» (fase 1, solo geometría) u «observed» (color, rugosidad, metalicidad y opacidad del visor; nunca
  texturas: las imágenes no se copian y el mapa queda como color declarado).
- Salidas nuevas (nunca sobrescribe): scene.blend, import-report.json, blender-geometry.json (geometría devuelta al marco
  Y-up para comparar C con A y con B usando el mismo comparador).
"""
import hashlib, json, sys, time
from pathlib import Path
import bpy

ROLE_ORDER = ["room", "room-slab", "wall", "opening-leaf", "object", "stair", "level", "ceiling", "roof", "exterior", "unlinked", "derived-support"]


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hex_rgb(h):
    h = (h or "#bfbfbf").lstrip("#")
    return [srgb_to_linear(int(h[i:i + 2], 16) / 255) for i in (0, 2, 4)]


def material_for(mat, mode, cache):
    if mode == "neutral":
        key = "neutral-glass" if mat.get("kind") == "glass" else "neutral"
    else:
        key = f"{mat.get('kind')}|{mat.get('color')}|{mat.get('roughness')}|{mat.get('metalness')}|{mat.get('opacity')}"
    if key in cache:
        return cache[key]
    m = bpy.data.materials.new("op10:" + key)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    if mode == "neutral":
        bsdf.inputs["Base Color"].default_value = (0.8, 0.8, 0.8, 1) if key == "neutral" else (0.85, 0.92, 0.95, 1)
        bsdf.inputs["Roughness"].default_value = 0.8 if key == "neutral" else 0.05
        if key != "neutral":
            bsdf.inputs["Alpha"].default_value = 0.25
    else:
        r, g, b = hex_rgb(mat.get("color"))
        bsdf.inputs["Base Color"].default_value = (r, g, b, 1)
        if mat.get("roughness") is not None:
            bsdf.inputs["Roughness"].default_value = float(mat["roughness"])
        if mat.get("metalness") is not None:
            bsdf.inputs["Metallic"].default_value = float(mat["metalness"])
        if mat.get("kind") == "glass" or (mat.get("opacity") or 1) < 1:
            bsdf.inputs["Alpha"].default_value = float(mat.get("opacity") or 0.3)
            # Vidrio: transmisión para Cycles en vez de alfa opaco (el visor usa MeshPhysicalMaterial transparente).
            if mat.get("kind") == "glass" and "Transmission Weight" in bsdf.inputs:
                bsdf.inputs["Transmission Weight"].default_value = 1.0
                bsdf.inputs["Roughness"].default_value = 0.05
    m["op10_source"] = json.dumps({k: mat.get(k) for k in ("kind", "color", "roughness", "metalness", "opacity", "hasMap")})
    cache[key] = m
    return m


def main():
    args = sys.argv[sys.argv.index("--") + 1:]
    cap, out = Path(args[0]), Path(args[1])
    mode = args[args.index("--materials") + 1] if "--materials" in args else "neutral"
    if out.exists():
        raise SystemExit("Refusing overwrite: " + str(out))
    scene_bytes = (cap / "scene.json").read_bytes()
    manifest = json.loads((cap / "manifest.json").read_text(encoding="utf8"))
    if sha(scene_bytes) != manifest["outputs"]["scene.json"]["sha256"]:
        raise SystemExit("scene.json hash does not match its manifest")
    doc = json.loads(scene_bytes)
    if doc.get("schema") != "rubik-sota.observed-scene" or doc.get("units") != "metres" or doc.get("axes") != "three-y-up" or doc.get("unitsToMetresApplied") != 1:
        raise SystemExit("Unsupported scene: schema/units/axes/unit factor")
    t0 = time.monotonic()
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.unit_settings.system = "METRIC"
    sc.unit_settings.scale_length = 1.0
    sc["op10"] = json.dumps({"sceneSha256": manifest["outputs"]["scene.json"]["sha256"], "projectId": manifest["source"]["projectId"],
                             "projectCanonicalSha256": manifest["source"]["projectCanonicalSha256"], "gitHead": manifest["code"]["gitHead"],
                             "scope": doc.get("scope"), "frame": doc.get("frame"), "transform": "(XB,YB,ZB)=(x,-z,y)", "materials": mode})
    collections, cache, rows = {}, {}, []
    for m in doc["meshes"]:
        role = m["entity"]["role"]
        if role not in collections:
            c = bpy.data.collections.new("Rubik_" + role)
            sc.collection.children.link(c)
            collections[role] = c
        verts = [(x, -z, y) for (x, y, z) in m["vertices"]]  # Y-up → Z-up, una sola vez
        mesh = bpy.data.meshes.new(m["name"])
        mesh.from_pydata(verts, [], m["faces"])
        mesh.validate(verbose=False)
        mesh.update()
        mesh.materials.append(material_for(m["material"], mode, cache))
        obj = bpy.data.objects.new(m["name"], mesh)
        obj["rubik_id"] = m["entity"]["id"] or ""
        obj["rubik_role"] = role
        obj["rubik_level"] = m.get("level") or ""
        obj["rubik_mesh"] = m["name"]
        collections[role].objects.link(obj)
        rows.append({"name": m["name"], "vertices": len(mesh.vertices), "faces": len(mesh.polygons), "expectedVertices": len(m["vertices"]), "expectedFaces": len(m["faces"])})
    bad = [r for r in rows if r["vertices"] != r["expectedVertices"] or r["faces"] != r["expectedFaces"]]
    import_s = time.monotonic() - t0
    out.mkdir(parents=True)
    blend = out / "scene.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(blend))
    # Geometría devuelta al marco de la captura (Y arriba): XB, YB, ZB → x = XB, y = ZB, z = -YB.
    back = {"schema": "rubik-sota.observed-scene", "units": "metres", "axes": "three-y-up", "unitsToMetresApplied": 1, "frame": doc.get("frame"), "source": "blender-roundtrip", "meshes": []}
    for o in bpy.data.objects:
        if o.type != "MESH":
            continue
        mw = o.matrix_world
        vs = [[round(v[0], 6), round(v[2], 6), round(-v[1], 6)] for v in (mw @ vt.co for vt in o.data.vertices)]
        vs = [[0.0 if x == 0 else x for x in v] for v in vs]
        mm = {"min": [min(v[a] for v in vs) for a in range(3)], "max": [max(v[a] for v in vs) for a in range(3)]}
        back["meshes"].append({"name": o["rubik_mesh"], "entity": {"id": o["rubik_id"] or None, "role": o["rubik_role"]}, "level": o["rubik_level"] or None,
                               "material": json.loads(o.data.materials[0]["op10_source"]) if o.data.materials else {"kind": "none"},
                               "vertices": vs, "faces": [list(p.vertices) for p in o.data.polygons], "bounds": mm})
    back["meshes"].sort(key=lambda m: int(m["name"].rsplit(":", 1)[1]))
    geo = json.dumps(back, separators=(",", ":")).encode()
    (out / "blender-geometry.json").write_bytes(geo)
    report = {"status": "PASS" if not bad else "FAIL", "blender": bpy.app.version_string, "blenderBuildHash": bpy.app.build_hash.decode() if isinstance(bpy.app.build_hash, bytes) else bpy.app.build_hash,
              "importer": {"sha256": sha(Path(__file__).read_bytes()), "materials": mode, "transform": "(XB,YB,ZB)=(x,-z,y) once"},
              "input": {"sceneSha256": sha(scene_bytes), "manifestProject": manifest["source"]["projectId"], "projectCanonicalSha256": manifest["source"]["projectCanonicalSha256"]},
              "objects": len(rows), "collections": {k: len(v.objects) for k, v in collections.items()}, "materials": len(cache), "mismatches": bad[:20],
              "importSeconds": round(import_s, 3), "outputs": {"scene.blend": {"bytes": blend.stat().st_size, "sha256": sha(blend.read_bytes())}, "blender-geometry.json": {"bytes": len(geo), "sha256": sha(geo)}}}
    (out / "import-report.json").write_text(json.dumps(report, indent=1) + "\n", encoding="utf8")
    print(json.dumps({k: report[k] for k in ("status", "blender", "objects", "materials", "importSeconds")}))
    if bad:
        sys.exit(2)


if __name__ == "__main__":
    main()
