"""Import and independently verify a hash-linked package in factory-startup Blender.

blender --background --factory-startup --python-exit-code 1 --python SCRIPT -- PACKAGE REPORT BLEND
Only a fresh output .blend is saved. No MCP, source scene, camera or external network.
"""
import hashlib, json, math, sys
from pathlib import Path
import bpy
from mathutils import Vector


def digest(data):
    return hashlib.sha256(data).hexdigest()


def close(a, b, message, tolerance=0.00002):
    if len(a) != len(b) or any(abs(x-y) > tolerance for x, y in zip(a, b)):
        raise AssertionError(f"{message}: actual={a}, expected={b}")


def main():
    args = sys.argv[sys.argv.index("--")+1:]
    if len(args) != 3:
        raise ValueError("Expected PACKAGE REPORT NEW-BLEND")
    root, report_path, blend_path = map(Path, args)
    if report_path.exists() or blend_path.exists():
        raise ValueError("Refusing evidence overwrite")
    manifest = json.loads((root / "package.json").read_text(encoding="utf8"))
    if manifest["format"] != "rubik-blender-package" or manifest["version"] != "1.0.0":
        raise ValueError("Unsupported package")
    if set(manifest["files"]) != {"source-project.json", "scene.glb", "semantic.json"}:
        raise ValueError("Unexpected package files")
    for name, expected in manifest["files"].items():
        data = (root/name).read_bytes()
        if len(data) != expected["bytes"] or digest(data) != expected["sha256"]:
            raise ValueError("Package integrity failed: " + name)
    semantic = json.loads((root/"semantic.json").read_text(encoding="utf8"))
    project = json.loads((root/"source-project.json").read_text(encoding="utf8"))
    if digest((root/"semantic.json").read_bytes()) != manifest["semanticSha256"]:
        raise ValueError("Semantic manifest linkage failed")
    if semantic["projectSha256"] != manifest["files"]["source-project.json"]["sha256"]:
        raise ValueError("Source linkage failed")
    if list(bpy.data.objects):
        # --factory-startup loads defaults, not an owner's scene.
        bpy.ops.object.select_all(action="SELECT")
        bpy.ops.object.delete(use_global=False)
    bpy.context.scene.unit_settings.system = "METRIC"
    bpy.context.scene.unit_settings.scale_length = 1.0
    result = bpy.ops.import_scene.gltf(filepath=str((root/"scene.glb").resolve()))
    if result != {"FINISHED"}:
        raise RuntimeError("GLB import did not finish")
    bpy.context.view_layer.update()
    cx, cy = (semantic["coordinateMapping"]["centerMm"][k] for k in ("x", "y"))

    def point(x, y, z=0):
        return [(x-cx)/1000, -(y-cy)/1000, z/1000]

    def points(obj):
        out = []
        for child in [obj] + list(obj.children_recursive):
            if child.type == "MESH":
                out.extend(child.matrix_world @ v.co for v in child.data.vertices)
        return out

    def bounds(vs):
        return {"min": [min(v[i] for v in vs) for i in range(3)],
                "max": [max(v[i] for v in vs) for i in range(3)]}

    rows = []
    for entity in semantic["entities"]:
        matches = [o for o in bpy.data.objects if o.get("rubik_id") == entity["id"]]
        if len(matches) != 1:
            raise AssertionError("Missing/duplicate stable ID: " + entity["id"])
        obj, src, role = matches[0], entity["source"], entity["role"]
        if obj.get("rubik_role") != role:
            raise AssertionError("Role mismatch")
        collection_name = "Rubik_" + role + "s"
        collection = bpy.data.collections.get(collection_name)
        if not collection:
            collection = bpy.data.collections.new(collection_name)
            bpy.context.scene.collection.children.link(collection)
        for child in [obj] + list(obj.children_recursive):
            for old in list(child.users_collection):
                old.objects.unlink(child)
            if child.name not in collection.objects:
                collection.objects.link(child)
        obj["rubik_project_id"] = project["id"]
        obj["rubik_source_json"] = json.dumps(src, sort_keys=True)
        vs = points(obj)
        measured = bounds(vs) if vs else None
        materials = sorted({slot.material.name for child in [obj]+list(obj.children_recursive)
                            if child.type == "MESH" for slot in child.material_slots if slot.material})
        if role == "room":
            expected = bounds([point(v["x"], v["y"]) for v in src["polygon"]])
            close(measured["min"], expected["min"], "Room min")
            close(measured["max"], expected["max"], "Room max")
            if src["floorMaterialId"] not in materials:
                raise AssertionError("Room material ID lost")
            polygon = src["polygon"]
            area = abs(sum(v["x"]*polygon[(i+1)%len(polygon)]["y"]-polygon[(i+1)%len(polygon)]["x"]*v["y"]
                           for i,v in enumerate(polygon)))/2e6
            actual_area = sum(poly.area for poly in obj.data.polygons)
            close([actual_area], [area], "Triangulated area", 0.0001)
        elif role == "object":
            close(list(obj.location), point(src["position"]["x"],src["position"]["y"],src.get("elevationMm",0)), "Instance origin")
            rotation = -math.radians(src["rotationDeg"])
            x_axis = obj.rotation_quaternion @ Vector((1,0,0)) if obj.rotation_mode == "QUATERNION" else obj.rotation_euler.to_matrix() @ Vector((1,0,0))
            close(list(x_axis), [math.cos(rotation), math.sin(rotation), 0], "Clockwise yaw")
            local = [obj.matrix_world.inverted() @ v for v in vs]
            b = bounds(local)
            width, depth, height = entity["dimensionsMeters"]
            close(b["min"],[-width/2,-depth/2,0],"Local object min")
            close(b["max"],[width/2,depth/2,height],"Local object max")
            if entity["asset"] and len(obj.children_recursive) < 2:
                raise AssertionError("Catalog geometry hierarchy missing")
        elif role == "opening":
            wall = next(w for w in project["walls"] if w["id"] == src["wallId"])
            angle = math.atan2(wall["end"]["y"]-wall["start"]["y"],wall["end"]["x"]-wall["start"]["x"])
            s = src["offsetMm"] + src["widthMm"]/2
            close(list(obj.location), point(wall["start"]["x"]+math.cos(angle)*s,wall["start"]["y"]+math.sin(angle)*s,src["sillHeightMm"]), "Opening position")
            if vs:
                raise AssertionError("Opening must be an empty/void, not an obstructing solid")
        elif role == "wall":
            solids = [o for o in obj.children_recursive if o.type == "MESH"]
            if len(solids) != entity["fragmentCount"]:
                raise AssertionError("Wall fragment count")
            volume = 0
            wall_openings = [o for o in project["openings"] if o["wallId"] == src["id"]]
            length = math.hypot(src["end"]["x"]-src["start"]["x"],src["end"]["y"]-src["start"]["y"])
            # Independently integrate the union of aperture heights along the source axis.
            cuts = sorted({0,length} | {x for o in wall_openings for x in (o["offsetMm"],o["offsetMm"]+o["widthMm"])})
            void_area = 0
            for a,b in zip(cuts,cuts[1:]):
                intervals = sorted((o["sillHeightMm"],o["sillHeightMm"]+o["heightMm"]) for o in wall_openings if o["offsetMm"] < (a+b)/2 < o["offsetMm"]+o["widthMm"])
                union_height, end = 0, 0
                for lower,upper in intervals:
                    union_height += max(0,upper-max(lower,end))
                    end = max(end,upper)
                void_area += (b-a)*union_height
            source_volume = 0 if src["status"] == "demolished" else (length*src["heightMm"]-void_area)*src["thicknessMm"]/1e9
            for solid in solids:
                # Compare actual imported mesh dimensions/pose to independently calculated interval.
                interval = solid.get("wall_interval_mm")
                x1,x2,z1,z2 = interval
                close(list(solid.dimensions),[(x2-x1)/1000,src["thicknessMm"]/1000,(z2-z1)/1000],"Wall solid dimensions")
                angle = math.atan2(src["end"]["y"]-src["start"]["y"],src["end"]["x"]-src["start"]["x"])
                direction = solid.matrix_world.to_3x3() @ Vector((1,0,0))
                close(list(direction),[math.cos(angle),-math.sin(angle),0],"Wall orientation including diagonal")
                s = (x1+x2)/2
                close(list(solid.location),point(src["start"]["x"]+math.cos(angle)*s,src["start"]["y"]+math.sin(angle)*s,z1),"Wall fragment origin")
                if x1 < -0.001 or x2 > length+0.001 or z1 < 0 or z2 > src["heightMm"]:
                    raise AssertionError("Wall fragment outside source")
                for opening in wall_openings:
                    if max(x1,opening["offsetMm"]) < min(x2,opening["offsetMm"]+opening["widthMm"])-0.001 and max(z1,opening["sillHeightMm"]) < min(z2,opening["sillHeightMm"]+opening["heightMm"])-0.001:
                        raise AssertionError("Actual solid intrudes into an opening")
                volume += math.prod(solid.dimensions)
                if src.get("surfaceMaterialId") and src["surfaceMaterialId"] not in materials:
                    raise AssertionError("Wall material lost")
            close([volume],[entity["solidVolumeM3"]],"Wall volume",0.0001)
            close([volume],[source_volume],"Independent source wall volume",0.0001)
        rows.append({"id":entity["id"],"role":role,"object":obj.name,"collection":collection_name,
                     "boundsMeters":measured,"materials":materials,"children":len(obj.children_recursive),"status":"PASS"})
    imported_ids = {o.get("rubik_id") for o in bpy.data.objects if o.get("rubik_id") in {e["id"] for e in semantic["entities"]}}
    expected_ids = {x["id"] for k in ("walls","rooms","openings","objects") for x in project[k]}
    if imported_ids != expected_ids:
        raise AssertionError("Entity correspondence differs from source")
    textures = [i for i in bpy.data.images if i.type == "IMAGE" and i.size[0] > 0]
    if len(textures) != semantic["metrics"]["images"]:
        raise AssertionError("Texture count mismatch")
    for m in project["materials"]:
        if not bpy.data.materials.get(m["id"]):
            raise AssertionError("Material missing: " + m["id"])
    bpy.context.scene["rubik_package_sha256"] = digest((root/"package.json").read_bytes())
    bpy.context.scene["rubik_semantic_sha256"] = manifest["semanticSha256"]
    bpy.context.scene["rubik_scale_confidence"] = project["scale"]["confidence"]
    bpy.context.scene["rubik_mapping"] = json.dumps(semantic["coordinateMapping"],sort_keys=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path.resolve()))
    report = {"status":"PASS","blenderVersion":bpy.app.version_string,"blenderBuildHash":bpy.app.build_hash.decode(),
              "importOperator":"bpy.ops.import_scene.gltf","operatorResult":sorted(result),
              "options":{"factoryStartup":True,"background":True,"unitSystem":"METRIC","scaleLength":1.0},
              "packageSha256":digest((root/"package.json").read_bytes()),
              "verifierSha256":digest(Path(__file__).read_bytes()),
              "blend":{"filename":blend_path.name,"bytes":blend_path.stat().st_size,"sha256":digest(blend_path.read_bytes())},
              "entities":rows,"images":[{"name":i.name,"dimensions":list(i.size)} for i in textures],
              "limitations":semantic["omittedOrSubstituted"]}
    report_path.write_text(json.dumps(report,indent=2,ensure_ascii=False)+"\n",encoding="utf8")
    print(json.dumps({"status":"PASS","entities":len(rows),"blender":bpy.app.version_string}))


if __name__ == "__main__":
    main()
