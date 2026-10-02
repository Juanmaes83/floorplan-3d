"""Read-only fresh-process test of the saved portable fixture scene."""
import bpy, json, sys
from pathlib import Path
output = Path(sys.argv[sys.argv.index("--")+1])
if output.exists():
    raise ValueError("Refusing report overwrite")
scene = bpy.context.scene
if scene.unit_settings.system != "METRIC" or scene.unit_settings.scale_length != 1:
    raise AssertionError("Saved metric units lost")
ids = {o.get("rubik_id") for o in scene.objects if o.get("rubik_role") in ("wall","room","opening","object")}
if len(ids) != 17 or "obj_catalog-bench" not in ids:
    raise AssertionError("Saved entity IDs lost")
images = [i for i in bpy.data.images if i.type == "IMAGE" and i.size[0] > 0]
if not images or not all(i.packed_file for i in images):
    raise AssertionError("Textures not packed in saved .blend")
output.write_text(json.dumps({"status":"PASS","blender":bpy.app.version_string,"entities":len(ids),"images":[{"name":i.name,"dimensions":list(i.size),"packed":bool(i.packed_file)} for i in images],"unitSystem":"METRIC","scaleLength":1,"savedPackageSha256":scene["rubik_package_sha256"]},indent=2)+"\n",encoding="utf8")
print("PASS: saved .blend reopens with IDs, units and packed textures")
