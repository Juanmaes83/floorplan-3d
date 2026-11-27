"""«Desde el paisaje» · importa el entorno de la «Escena para Blender» (rubik-entorno.json + rubik-ortofoto.jpg).

Rama claude/pelicula-efectos (fuera de #324). Lo llaman el kit de rodaje o la preparación; también se puede usar suelto:
    blender -b escena.blend --python blender-entorno.py -- <carpeta-del-ZIP>

- El terreno llega en el PLANO del modelo (mm) y en cotas sobre la cota cero del modelo (m), ya transformado por RUBIK con el
  emplazamiento introducido por el profesional (giro al norte, anclajes y cota cero). Aquí solo se pasa al marco de la escena con
  la misma regla que el resto del kit (to_blender: x/1000, −y/1000, z) y el mismo origen del plano (`originPlanMm`).
- La ortofoto se aplica con las UV que calcula RUBIK (misma fórmula que el visor). Sin red: todo sale del ZIP.
- La parcela catastral no viaja en el ZIP (licencia restringida) y no se reconstruye.
- Todo lo creado vive en la colección RUBIK_entorno con propiedades rubik_role='site-terrain' y la atribución obligatoria.
"""
import json
import sys
from pathlib import Path

import bpy


def to_blender(x_mm, y_mm, origin, z=0.0):
    return ((x_mm - origin["x"]) / 1000.0, -((y_mm - origin["y"]) / 1000.0), z)


def importar(pkg, origin=None):
    pkg = Path(pkg)
    doc = json.loads((pkg / "rubik-entorno.json").read_text(encoding="utf-8"))
    if doc.get("format") != "rubik-sota.scene-site":
        raise ValueError("rubik-entorno.json: formato inesperado")
    if origin is None:
        man = json.loads((pkg / "manifest.json").read_text(encoding="utf-8"))
        origin = man["scene"]["frame"]["originPlanMm"]
    t = doc["terrain"]
    index, verts, uvs = {}, [], []
    for i, v in enumerate(t["vertices"]):
        if v is None:
            continue
        index[i] = len(verts); verts.append(to_blender(v[0], v[1], origin, v[2])); uvs.append(t["uv"][i])
    faces = [tuple(index[k] for k in tri) for tri in t["triangles"] if all(k in index for k in tri)]
    me = bpy.data.meshes.new("RUBIK_terreno"); me.from_pydata(verts, [], faces); me.update()
    uvl = me.uv_layers.new(name="ortofoto")
    for poly in me.polygons:
        for li in poly.loop_indices:
            u, v = uvs[me.loops[li].vertex_index]; uvl.data[li].uv = (u, 1.0 - v)  # RUBIK: v hacia el sur; Blender: v hacia arriba
    for poly in me.polygons:
        poly.use_smooth = True
    col = bpy.data.collections.get("RUBIK_entorno") or bpy.data.collections.new("RUBIK_entorno")
    if col.name not in bpy.context.scene.collection.children:
        bpy.context.scene.collection.children.link(col)
    ob = bpy.data.objects.new("RUBIK_terreno", me); col.objects.link(ob)
    ob["rubik_role"] = "site-terrain"; ob["rubik_attribution"] = " · ".join(doc.get("attributions", []))
    ob["rubik_source_terrain"] = json.dumps(t.get("source"), ensure_ascii=False); ob["rubik_source_orthophoto"] = json.dumps(doc["orthophoto"].get("source"), ensure_ascii=False)
    mat = bpy.data.materials.new("RUBIK_ortofoto"); mat.use_nodes = True; N = mat.node_tree.nodes; L = mat.node_tree.links
    bs = N.get("Principled BSDF"); bs.inputs["Roughness"].default_value = 0.95
    img = bpy.data.images.load(str(pkg / doc["orthophoto"]["file"])); img.colorspace_settings.name = "sRGB"
    tx = N.new("ShaderNodeTexImage"); tx.image = img; tx.extension = "EXTEND"; L.new(tx.outputs["Color"], bs.inputs["Base Color"])
    me.materials.append(mat)
    zs = [p[2] for p in verts]
    return {"object": ob.name, "vertices": len(verts), "faces": len(faces), "zMin": min(zs), "zMax": max(zs),
            "attributions": doc.get("attributions", []), "placement": doc.get("placement"), "corners": doc["orthophoto"].get("cornersPlanMm")}


if __name__ == "__main__" and "--" in sys.argv:
    print(json.dumps(importar(sys.argv[sys.argv.index("--") + 1]), ensure_ascii=False, indent=1))
