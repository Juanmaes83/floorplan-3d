"""Real decoder/node wiring test for the synthetic channel diagnostic, not visual PBR QA."""
import bpy, json, sys, hashlib
from pathlib import Path
source, report = map(Path, sys.argv[sys.argv.index("--")+1:])
if report.exists():
    raise ValueError("Refusing report overwrite")
bpy.ops.import_scene.gltf(filepath=str(source.resolve()))
mat = bpy.data.materials["synthetic-pbr-channel-diagnostic"]
images = {n.image.name: n for n in mat.node_tree.nodes if n.type == "TEX_IMAGE" and n.image}
for name in ("baseColor", "ORM", "normal"):
    if name not in images or tuple(images[name].image.size) != (2,2):
        raise AssertionError("Missing/undecodable synthetic map: " + name)
principled = next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
for name in ("Base Color", "Roughness", "Metallic", "Normal"):
    if not principled.inputs[name].is_linked:
        raise AssertionError("Channel not wired: " + name)
if images["baseColor"].image.colorspace_settings.name != "sRGB":
    raise AssertionError("Base color not sRGB")
for name in ("ORM", "normal"):
    if images[name].image.colorspace_settings.name != "Non-Color":
        raise AssertionError("Linear channel color space wrong")
links = [{"fromNode":l.from_node.name,"fromSocket":l.from_socket.name,"toNode":l.to_node.name,"toSocket":l.to_socket.name} for l in mat.node_tree.links]
report.write_text(json.dumps({"status":"PASS","blender":bpy.app.version_string,"fileSha256":hashlib.sha256(source.read_bytes()).hexdigest(),"images":list(images),"links":links,"scope":"Original synthetic PNG maps: decoder and node wiring only; no commercial material set nor photoreal validation"},indent=2)+"\n",encoding="utf8")
print("PASS: PNG baseColor / ORM / tangent normal decoded and wired in Blender")
