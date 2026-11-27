import hashlib
import json
import struct
import zipfile
from collections import defaultdict
from pathlib import Path

project = json.loads(Path("plano-girado-30.json").read_text(encoding="utf-8-sig"))
with zipfile.ZipFile("escena-girada-30.zip") as archive:
    manifest = json.loads(archive.read("manifest.json"))
    blob = archive.read("scene.glb")
json_size = struct.unpack_from("<I", blob, 12)[0]
gltf = json.loads(blob[20:20 + json_size])
binary = memoryview(blob)[28 + json_size:]
parent = {child: index for index, node in enumerate(gltf["nodes"]) for child in node.get("children", [])}
origin = manifest["scene"]["frame"]["originPlanMm"]

def unpack_accessor(index):
    accessor = gltf["accessors"][index]
    view = gltf["bufferViews"][accessor["bufferView"]]
    fmt = "<" + {5126: "f", 5125: "I", 5123: "H", 5121: "B"}[accessor["componentType"]] * (3 if accessor["type"] == "VEC3" else 1)
    width = view.get("byteStride", struct.calcsize(fmt))
    base = view.get("byteOffset", 0) + accessor.get("byteOffset", 0)
    return [struct.unpack_from(fmt, binary, base + width * i) for i in range(accessor["count"])]

floors = defaultdict(list)
for i, node in enumerate(gltf["nodes"]):
    meta = node.get("extras", {})
    if meta.get("rubik_role") != "room" or "mesh" not in node:
        continue
    root = gltf["nodes"][parent[i]]
    assert all(not ({"rotation", "scale", "matrix"} & x.keys()) for x in (root, node))
    translation = [sum(x.get("translation", [0, 0, 0])[j] for x in (root, node)) for j in range(3)]
    for primitive in gltf["meshes"][node["mesh"]]["primitives"]:
        pos = unpack_accessor(primitive["attributes"]["POSITION"])
        coords = [(x + translation[0], z + translation[2]) for x, _, z in pos]
        indices = [x[0] for x in unpack_accessor(primitive["indices"])]
        layer_areas = defaultdict(float)
        for t in range(0, len(indices), 3):
            a, b, c = [coords[j] for j in indices[t:t + 3]]
            heights = [pos[j][1] + translation[1] for j in indices[t:t + 3]]
            if max(heights) - min(heights) > 1e-6:
                continue
            layer_areas[round(heights[0], 5)] += abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) / 2
        floors[meta["rubik_id"]].append((coords, layer_areas))

errors = []
for room in project["rooms"]:
    expected = [((v["x"] - origin["x"]) / 1000, (v["y"] - origin["y"]) / 1000) for v in room["polygon"]]
    mesh = floors[room["id"]]
    actual = [v for coords, _ in mesh for v in coords]
    extents = lambda pts: [bound(v[axis] for v in pts) for bound in (min, max) for axis in (0, 1)]
    expected_area = abs(sum(x * expected[(i + 1) % len(expected)][1] - y * expected[(i + 1) % len(expected)][0] for i, (x, y) in enumerate(expected))) / 2
    layers = defaultdict(float)
    for _, heights in mesh:
        for h, area in heights.items():
            layers[h] += area
    finish_floor_area = layers[max(layers)]
    errors.append((room["id"], max(abs(x - y) * 1000 for x, y in zip(extents(expected), extents(actual))), abs(expected_area - finish_floor_area)))

assert hashlib.sha256(blob).hexdigest() == manifest["files"]["scene.glb"]["sha256"]
print(json.dumps({"rooms":len(errors), "bound_error_mm":max(v[1] for v in errors), "mesh_area_difference_max_m2":max(v[2] for v in errors), "areas_per_room":[[i, a] for i, _, a in errors]}))

