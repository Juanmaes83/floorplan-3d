"""OP-10 · Importa una «Escena para Blender» de RUBIK (scene.glb + manifest.json) y la verifica. Candidata de integración.
Se entrega también dentro del ZIP como rubik_blender_prepare.py: es el camino B, «preparación completa» (el camino A es la
importación nativa del GLB, que no reconstruye la luz del visor; ambos caminos NO dan el mismo render).
Desde la carpeta descomprimida:  blender --background --factory-startup --python rubik_blender_prepare.py -- . escena-preparada

python blender-scene-import.py -- PACKAGE-DIR OUT-DIR [--materials observed|neutral] [--light viewer|none]
   (python del entorno bpy 5.2.1, o: blender --background --factory-startup --python-exit-code 1 --python ... -- ...)

- Usa el importador glTF NATIVO de Blender (el mismo camino que «Archivo › Importar › glTF 2.0» de una persona usuaria).
  Ningún otro conversor de geometría: Y arriba → Z arriba lo aplica el importador una vez, (XB, YB, ZB) = (x, -z, y).
- Comprueba la huella de scene.glb contra el manifiesto ANTES de importar; rechaza paquetes alterados.
- Organiza colecciones por rol (Rubik_<rol>) sin mover ni transformar nada; propiedades rubik_* llegan de los extras glTF.
- Vidrio: transmisión para Cycles (el visor usa vidrio transparente). «neutral» = materiales grises (revisión de geometría).
- C7 · luz del visor: sol con la dirección, color e intensidad capturados; cielo con el color hemisférico; de noche, las
  luminarias capturadas (rol fixture) encendidas con la intensidad del visor. La conversión de unidades está declarada.
- Salidas nuevas (nunca sobrescribe): scene.blend, import-report.json, blender-geometry.json (malla a malla, marco Y arriba).
"""
import hashlib, json, math, struct, sys, time
from pathlib import Path
import bpy
from mathutils import Vector

# Conversión declarada visor → Cycles (no es un dato del proyecto): sol Three.js r160 (intensidad ~2,6) → ~3,9 W/m²;
# hemisférica → fuerza del mundo; luminaria (PointLight intensidad 6, 7 m) → 60 W por intensidad unidad / 6.
SUN_W_PER_UNIT = 1.5
WORLD_PER_UNIT = 0.35
LAMP_W_PER_UNIT = 10.0


def sha(b):
    return hashlib.sha256(b).hexdigest()


def glb_json(b):
    if b[:4] != b"glTF" or struct.unpack_from("<I", b, 4)[0] != 2 or struct.unpack_from("<I", b, 8)[0] != len(b):
        raise SystemExit("Not a GLB 2.0 file")
    n, t = struct.unpack_from("<II", b, 12)
    if t != 0x4E4F534A:
        raise SystemExit("GLB without JSON chunk")
    return json.loads(b[20:20 + n].decode("utf8"))


def srgb_lin(h):
    h = (h or "#ffffff").lstrip("#")
    out = []
    for i in (0, 2, 4):
        c = int(h[i:i + 2], 16) / 255
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return out


def to_blender(v):
    return Vector((v[0], -v[2], v[1]))


def geometry_back(expected, frame):
    """Geometría de cada malla RUBIK en el marco de la captura (Y arriba), ordenada por malla. La usan la importación y la
    reapertura en un proceso nuevo: el mismo algoritmo debe dar el MISMO hash."""
    bad, back = [], {"schema": "rubik-sota.observed-scene", "units": "metres", "axes": "three-y-up", "unitsToMetresApplied": 1,
                     "frame": frame, "source": "blender-roundtrip", "meshes": []}
    seen = set()
    for o in bpy.data.objects:
        if o.type != "MESH":
            continue
        name = o.get("rubik_mesh")
        if not name or name not in expected:
            bad.append({"object": o.name, "issue": "mesh without rubik_mesh"})
            continue
        seen.add(name)
        mw = o.matrix_world
        vs = [[round(v[0], 6), round(v[2], 6), round(-v[1], 6)] for v in (mw @ vt.co for vt in o.data.vertices)]
        vs = [[0.0 if x == 0 else x for x in v] for v in vs]
        back["meshes"].append({"name": name, "entity": {"id": o.get("rubik_id") or None, "role": o.get("rubik_role")}, "level": o.get("rubik_level") or None,
                               "vertices": vs, "faces": [list(p.vertices) for p in o.data.polygons],
                               "bounds": {"min": [min(v[i] for v in vs) for i in range(3)], "max": [max(v[i] for v in vs) for i in range(3)]}})
    missing = sorted(set(expected) - seen)
    if missing:
        bad.append({"issue": "meshes missing after import", "count": len(missing), "first": missing[:5]})
    back["meshes"].sort(key=lambda m: int(m["name"].rsplit(":", 1)[1]))
    return back, bad


def main():
    a = sys.argv[sys.argv.index("--") + 1:]
    pkg, out = Path(a[0]), Path(a[1])
    mode = a[a.index("--materials") + 1] if "--materials" in a else "observed"
    light_mode = a[a.index("--light") + 1] if "--light" in a else "viewer"
    if out.exists():
        raise SystemExit("Refusing overwrite: " + str(out))
    if not bpy.app.background:  # parte de una escena vacía: dentro de una sesión abierta descartaría el trabajo de la persona
        raise SystemExit("Run it headless: blender --background --factory-startup --python rubik_blender_prepare.py -- . escena-preparada")
    glb = (pkg / "scene.glb").read_bytes()
    manifest = json.loads((pkg / "manifest.json").read_text(encoding="utf8"))
    if manifest.get("format") != "rubik-sota.scene-delivery":
        raise SystemExit("Not a RUBIK scene delivery manifest")
    if sha(glb) != manifest["files"]["scene.glb"]["sha256"] or len(glb) != manifest["files"]["scene.glb"]["bytes"]:
        raise SystemExit("scene.glb does not match its manifest (altered or truncated package)")
    gl = glb_json(glb)
    sx = gl["scenes"][0].get("extras", {})
    if sx.get("rubik_schema") != "rubik-sota.observed-scene" or gl.get("extensionsUsed"):
        raise SystemExit("Unsupported scene: schema or extensions")
    view = json.loads(sx.get("rubik_view") or "null") or {}
    expected = {n["extras"]["rubik_mesh"]: n for n in gl["nodes"] if "mesh" in n}

    t0 = time.monotonic()
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.unit_settings.system = "METRIC"
    sc.unit_settings.scale_length = 1.0
    res = bpy.ops.import_scene.gltf(filepath=str((pkg / "scene.glb").resolve()), merge_vertices=False, import_shading="NORMALS")
    if "FINISHED" not in res:
        raise SystemExit("glTF importer failed")
    import_s = time.monotonic() - t0

    collections = {}
    for o in list(bpy.data.objects):
        role = o.get("rubik_role")
        if not role:
            continue
        name = "Rubik_" + role
        if name not in collections:
            c = bpy.data.collections.new(name)
            sc.collection.children.link(c)
            collections[name] = c
        for c in list(o.users_collection):
            c.objects.unlink(o)
        collections[name].objects.link(o)

    declared = []
    for m in bpy.data.materials:
        kind = m.get("rubik_kind")
        if not kind or not m.use_nodes:
            continue
        bsdf = next((n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None)
        if not bsdf:
            continue
        if mode == "neutral":
            bsdf.inputs["Base Color"].default_value = (0.85, 0.92, 0.95, 1) if kind == "glass" else (0.8, 0.8, 0.8, 1)
            bsdf.inputs["Roughness"].default_value = 0.05 if kind == "glass" else 0.8
            bsdf.inputs["Metallic"].default_value = 0.0
        if kind == "glass":
            bsdf.inputs["Transmission Weight"].default_value = 1.0
            bsdf.inputs["Roughness"].default_value = 0.05
            bsdf.inputs["Alpha"].default_value = 1.0
        if m.use_backface_culling:  # material de una cara (glTF doubleSided=false): la cara trasera no se ve, como en el visor
            nt = m.node_tree
            outn = next(n for n in nt.nodes if n.type == "OUTPUT_MATERIAL")
            src = outn.inputs["Surface"].links[0].from_socket if outn.inputs["Surface"].links else bsdf.outputs[0]
            geo, transp, mix = nt.nodes.new("ShaderNodeNewGeometry"), nt.nodes.new("ShaderNodeBsdfTransparent"), nt.nodes.new("ShaderNodeMixShader")
            nt.links.new(geo.outputs["Backfacing"], mix.inputs["Fac"]); nt.links.new(src, mix.inputs[1]); nt.links.new(transp.outputs[0], mix.inputs[2])
            nt.links.new(mix.outputs[0], outn.inputs["Surface"])
            m["rubik_backface"] = "hidden (viewer front-side material)"
    declared.append("glass: transmission 1.0, roughness 0.05 (Cycles equivalent of the viewer transparent glass)")
    declared.append("single-sided materials: back faces transparent in Cycles, as the viewer culls them (e.g. ceilings seen from above)")
    if mode == "neutral":
        declared.append("materials: neutral grey (geometry review)")

    cam = bpy.data.objects.get("RUBIK_camera")
    if cam and cam.type == "CAMERA":
        sc.camera = cam
        cam["rubik_camera_source"] = (view.get("camera") or {}).get("source", "viewer")

    derived = bpy.data.collections.new("RUBIK_light_from_viewer")
    sc.collection.children.link(derived)
    lt = view.get("light") or {}
    world = bpy.data.worlds.new("RUBIK_world")
    sc.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    if light_mode == "viewer" and lt:
        sun = lt.get("sun") or {}
        if sun.get("direction") and sun.get("intensity") is not None:
            data = bpy.data.lights.new("RUBIK_sun", "SUN")
            data.energy = float(sun["intensity"]) * SUN_W_PER_UNIT
            data.color = srgb_lin(sun.get("color"))
            data.angle = math.radians(1.5)
            o = bpy.data.objects.new("RUBIK_sun", data)
            d = to_blender(sun["direction"]).normalized()
            o.rotation_euler = (-d).to_track_quat("-Z", "Y").to_euler()
            derived.objects.link(o)
            declared.append(f"sun from viewer: direction {sun['direction']}, intensity {sun['intensity']} x {SUN_W_PER_UNIT} W/m2")
        hemi = lt.get("hemi") or {}
        sky = srgb_lin(hemi.get("sky") or "#fff8ee")
        strength = float(hemi.get("intensity") or 1.0) * WORLD_PER_UNIT
        bg.inputs["Color"].default_value = (*sky, 1)
        bg.inputs["Strength"].default_value = strength
        declared.append(f"world from viewer hemisphere: {hemi.get('sky')} x {round(strength, 3)}")
        lamps = lt.get("lamps") or {}
        if lamps.get("on"):
            n = 0
            for o in bpy.data.objects:
                if o.get("rubik_role") != "fixture" or o.type != "MESH":
                    continue
                pts = [o.matrix_world @ Vector(c) for c in o.bound_box]
                ctr = sum(pts, Vector()) / 8
                data = bpy.data.lights.new("RUBIK_lamp_" + o["rubik_id"], "POINT")
                data.energy = float(lamps.get("intensity") or 0) * LAMP_W_PER_UNIT
                data.color = srgb_lin(lamps.get("color"))
                data.shadow_soft_size = 0.1
                lo = bpy.data.objects.new("RUBIK_lamp_" + o["rubik_id"], data)
                lo.location = ctr + Vector((0, 0, -0.24))
                derived.objects.link(lo)
                n += 1
            declared.append(f"night: {n} captured ceiling fixtures lit, intensity {lamps.get('intensity')} x {LAMP_W_PER_UNIT} W")
    else:
        bg.inputs["Color"].default_value = (0.8, 0.82, 0.85, 1)
        bg.inputs["Strength"].default_value = 0.6
        declared.append("light: none captured; neutral grey world 0.6")
    sc.view_settings.view_transform = "AgX"
    sc["rubik"] = json.dumps({"glbSha256": manifest["files"]["scene.glb"]["sha256"], "projectId": manifest["source"]["projectId"],
                              "observedProjectSha256": manifest["source"]["observedProjectSha256"], "scope": sx.get("rubik_scope"),
                              "transform": "(XB,YB,ZB)=(x,-z,y)", "materials": mode, "light": light_mode, "importer": "glTF native"})

    back, bad = geometry_back(set(expected), json.loads(sx.get("rubik_frame") or "null"))
    out.mkdir(parents=True)
    blend = out / "scene.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(blend))
    geo = json.dumps(back, separators=(",", ":")).encode()
    (out / "blender-geometry.json").write_bytes(geo)
    report = {"status": "PASS" if not bad else "FAIL", "blender": bpy.app.version_string,
              "blenderBuildHash": bpy.app.build_hash.decode() if isinstance(bpy.app.build_hash, bytes) else bpy.app.build_hash,
              "python": sys.version.split()[0], "importer": {"kind": "io_import_scene_gltf2 (native)", "script": sha(Path(__file__).read_bytes()), "materials": mode, "light": light_mode},
              "input": {"glbSha256": sha(glb), "manifestProject": manifest["source"]["projectId"], "observedProjectSha256": manifest["source"]["observedProjectSha256"]},
              "objects": len(back["meshes"]), "expectedMeshes": len(expected), "collections": {k[len("Rubik_"):]: len(v.objects) for k, v in collections.items()},
              "camera": cam.name if cam else None, "derivedLight": declared, "issues": bad[:20], "importSeconds": round(import_s, 3),
              "outputs": {"scene.blend": {"bytes": blend.stat().st_size, "sha256": sha(blend.read_bytes())}, "blender-geometry.json": {"bytes": len(geo), "sha256": sha(geo)}}}
    (out / "import-report.json").write_text(json.dumps(report, indent=1) + "\n", encoding="utf8")
    print(json.dumps({k: report[k] for k in ("status", "blender", "objects", "expectedMeshes", "importSeconds", "camera")}))
    if bad:
        sys.exit(2)


if __name__ == "__main__":
    main()
