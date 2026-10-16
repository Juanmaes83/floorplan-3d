"""Offline pilot: render a review video of short in-room shots from a verified Floorplan scene.

python|blender --background --python render.py -- VERIFIED.blend PACKAGE SHOTS.json NEW-OUT [--visual VISUAL.glb]
    [--resolution 640x360] [--samples 16] [--frames all|anchors] [--rooms id,id] [--threads N]

The input .blend is the one saved by scripts/interop/blender-verify.py (PR #24 pipeline). It is opened read-only:
results go to a NEW output folder (pilot.blend, frames, anchors, report). Lighting and camera are presentation
additions declared in the report; no geometry, furniture or measurement is invented.
"""
import hashlib, json, math, resource, sys, time
from pathlib import Path
import bpy
from mathutils import Vector


def digest(data):
    return hashlib.sha256(data).hexdigest()


def args():
    a = sys.argv[sys.argv.index("--")+1:]
    pos = [x for i, x in enumerate(a) if not x.startswith("--") and (i == 0 or not a[i-1].startswith("--"))]
    opt = {a[i][2:]: a[i+1] for i in range(len(a)-1) if a[i].startswith("--")}
    if len(pos) != 4:
        raise ValueError("Expected VERIFIED.blend PACKAGE SHOTS.json NEW-OUT")
    return [Path(p) for p in pos], opt


def fcurves(idblock):
    """F-curves of an animated ID, for legacy and Blender 5 layered actions."""
    action = idblock.animation_data.action if idblock.animation_data else None
    if action is None:
        return []
    if hasattr(action, "fcurves"):
        return list(action.fcurves)
    return [fc for layer in action.layers for strip in layer.strips for bag in strip.channelbags for fc in bag.fcurves]


def inside(x, y, poly):
    c, j = False, len(poly)-1
    for i in range(len(poly)):
        ax, ay = poly[i]["x"], poly[i]["y"]
        bx, by = poly[j]["x"], poly[j]["y"]
        if (ay > y) != (by > y) and x < (bx-ax)*(y-ay)/(by-ay)+ax:
            c = not c
        j = i
    return c


def main():
    (blend, package, shots_path, out), opt = args()
    if out.exists():
        raise ValueError("Refusing overwrite: " + str(out))
    manifest_bytes = (package/"package.json").read_bytes()
    manifest = json.loads(manifest_bytes)
    for name, expected in manifest["files"].items():
        data = (package/name).read_bytes()
        if len(data) != expected["bytes"] or digest(data) != expected["sha256"]:
            raise ValueError("Package integrity failed: " + name)
    semantic = json.loads((package/"semantic.json").read_text(encoding="utf8"))
    project = json.loads((package/"source-project.json").read_text(encoding="utf8"))
    shots_bytes = shots_path.read_bytes()
    plan = json.loads(shots_bytes)
    if plan["format"] != "floorplan-offline-pilot-shots" or plan["projectId"] != project["id"]:
        raise ValueError("Shots do not belong to this project")
    center = semantic["coordinateMapping"]["centerMm"]
    if any(abs(plan["coordinateMapping"]["centerMm"][k]-center[k]) > 1e-6 for k in ("x", "y")):
        raise ValueError("Shots and package use different origins")
    bpy.ops.wm.open_mainfile(filepath=str(blend.resolve()))
    scene = bpy.context.scene
    if scene.get("rubik_package_sha256") != digest(manifest_bytes):
        raise ValueError("Verified .blend was saved from a different package")
    out.mkdir(parents=True)
    (out/"frames").mkdir()
    (out/"anchors").mkdir()
    started = time.time()

    rooms = {r["id"]: r for r in project["rooms"]}
    room_of_object = {o["id"]: next((r for r in rooms if inside(o["position"]["x"], o["position"]["y"], rooms[r]["polygon"])), None)
                      for o in project["objects"]}
    entities = {o.get("rubik_id"): o for o in scene.objects if o.get("rubik_role") in ("wall", "room", "opening", "object")}

    # Optional visual sidecar (browser procedural furniture, keyed by object ID). Replaces only the render of the
    # matching dimensional box, which stays in the scene for verification.
    visual = []
    if opt.get("visual"):
        vpath = Path(opt["visual"])
        before = set(bpy.data.objects)
        bpy.ops.import_scene.gltf(filepath=str(vpath.resolve()))
        imported = [o for o in bpy.data.objects if o not in before]
        coll = bpy.data.collections.new("Pilot_visual_furniture")
        scene.collection.children.link(coll)
        for o in imported:
            for c in list(o.users_collection):
                c.objects.unlink(o)
            coll.objects.link(o)
        for root in [o for o in imported if o.parent is None]:
            fid = root.name.split(".")[0]
            box = entities.get(fid)
            if not box or box.get("rubik_role") != "object":
                root["pilot_unmatched"] = True
                visual.append({"id": fid, "status": "unmatched-hidden"})
                for o in [root]+list(root.children_recursive):
                    o.hide_render = True
                continue
            delta = (root.matrix_world.translation - box.matrix_world.translation).length
            meshes = [o for o in [root]+list(root.children_recursive) if o.type == "MESH"]
            if delta > 0.02 or not meshes:
                visual.append({"id": fid, "status": "rejected", "originDeltaM": round(delta, 4)})
                for o in [root]+list(root.children_recursive):
                    o.hide_render = True
                continue
            for o in [root]+list(root.children_recursive):
                o["pilot_visual_for"] = fid
            for o in [box]+list(box.children_recursive):
                o.hide_render = True
            visual.append({"id": fid, "status": "replaces-box-in-render", "originDeltaM": round(delta, 4), "meshes": len(meshes)})

    # Presentation lighting (declared): soft sky, one sun. No ceiling exists in the package, so the sky lights the
    # rooms from above like a section model.
    world = bpy.data.worlds.new("PilotWorld")
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs[0].default_value = (0.78, 0.82, 0.88, 1)
    bg.inputs[1].default_value = 0.9
    scene.world = world
    sun_data = bpy.data.lights.new("PilotSun", "SUN")
    sun_data.energy = 2.2
    sun_data.angle = math.radians(8)
    sun = bpy.data.objects.new("PilotSun", sun_data)
    sun.rotation_euler = (math.radians(38), math.radians(10), math.radians(35))
    scene.collection.objects.link(sun)

    cam_data = bpy.data.cameras.new("PilotCamera")
    cam_data.sensor_fit = "HORIZONTAL"
    cam_data.sensor_width = 36
    cam_data.clip_start = 0.05
    cam = bpy.data.objects.new("PilotCamera", cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam
    wanted = set(opt["rooms"].split(",")) if opt.get("rooms") else None
    shots = [s for s in plan["shots"] if s["status"] == "ok" and (not wanted or s["roomId"] in wanted)]
    frame = 1
    timeline = []
    for s in shots:
        first = frame
        for b in s["blender"]:
            cam.location = b["location"]
            cam.rotation_mode = "QUATERNION"
            cam.rotation_quaternion = Vector(b["direction"]).to_track_quat("-Z", "Y")
            cam.keyframe_insert("location", frame=frame)
            cam.keyframe_insert("rotation_quaternion", frame=frame)
            cam_data.lens = s["lensMm"]
            cam_data.keyframe_insert("lens", frame=frame)
            frame += 1
        timeline.append({"roomId": s["roomId"], "first": first, "last": frame-1,
                         "anchors": [first+a["frame"] for a in s["anchors"]]})
    for fc in fcurves(cam)+fcurves(cam_data):
        for k in fc.keyframe_points:
            k.interpolation = "CONSTANT"
    scene.frame_start, scene.frame_end = 1, frame-1
    scene.render.fps = 30
    w, h = (int(v) for v in opt.get("resolution", "640x360").split("x"))
    scene.render.resolution_x, scene.render.resolution_y, scene.render.resolution_percentage = w, h, 100
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = int(opt.get("samples", 16))
    scene.cycles.use_adaptive_sampling = True
    scene.cycles.max_bounces = 4
    scene.cycles.use_denoising = True
    try:
        scene.cycles.denoiser = "OPENIMAGEDENOISE"
    except TypeError:
        pass
    scene.render.use_motion_blur = False
    if opt.get("threads"):
        scene.render.threads_mode, scene.render.threads = "FIXED", int(opt["threads"])
    scene.render.image_settings.file_format = "PNG"
    scene["pilot_shots_sha256"] = digest(shots_bytes)

    # Presence by entity ID along the real camera frustum (scene.ray_cast on the rendered geometry).
    def owner(obj):
        o = obj
        while o is not None:
            if o.get("pilot_visual_for"):
                return "object", o["pilot_visual_for"]
            if o.get("rubik_parent_id"):
                return "wall", o["rubik_parent_id"]
            if o.get("rubik_role"):
                return o["rubik_role"], o.get("rubik_id")
            o = o.parent
        return None, None

    def room_at(loc):
        x, y = loc.x*1000+center["x"], -loc.y*1000+center["y"]
        return next((r for r in rooms if inside(x, y, rooms[r]["polygon"])), None)

    def presence(cols=96, rows=54):
        depsgraph = bpy.context.evaluated_depsgraph_get()
        frame_pts = [cam.matrix_world @ v for v in cam.data.view_frame(scene=scene)]
        tr, br, bl, tl = frame_pts
        origin = cam.matrix_world.translation
        counts, seen = {}, set()
        for j in range(rows):
            for i in range(cols):
                u, v = (i+.5)/cols, (j+.5)/rows
                p = tl.lerp(tr, u).lerp(bl.lerp(br, u), v)
                d = (p-origin).normalized()
                hit, loc, _n, _i, obj, _m = scene.ray_cast(depsgraph, origin, d)
                if not hit:
                    key = "void"
                else:
                    role, eid = owner(obj)
                    if role == "room":
                        key = eid
                    elif role == "object":
                        key = room_of_object.get(eid) or "outside"
                        seen.add(eid)
                    else:
                        key = room_at(loc - d*0.06) or "outside"
                counts[key] = counts.get(key, 0)+1
        n = cols*rows
        return {k: round(c/n, 4) for k, c in sorted(counts.items(), key=lambda kv: -kv[1])}, sorted(seen)

    measured = []
    for t, s in zip(timeline, shots):
        for a in t["anchors"]:
            scene.frame_set(a)
            share, seen = presence()
            others = {k: v for k, v in share.items() if k not in (s["roomId"], "void", "outside")}
            top = max(others.items(), key=lambda kv: kv[1]) if others else (None, 0)
            measured.append({"roomId": s["roomId"], "frame": a, "targetShare": share.get(s["roomId"], 0),
                             "largestOther": top[0], "largestOtherShare": top[1], "void": share.get("void", 0),
                             "contentSeen": [c for c in s["contents"] if c in seen], "contents": s["contents"],
                             "share": share})
    pilot_blend = out/"pilot.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(pilot_blend.resolve()), copy=True)

    mode = opt.get("frames", "all")
    frames = list(range(scene.frame_start, scene.frame_end+1)) if mode == "all" else sorted({a for t in timeline for a in t["anchors"]})
    times = []
    for f in frames:
        scene.frame_set(f)
        target = out/"frames"/f"{f:05d}.png"
        if target.exists():
            raise ValueError("Refusing frame overwrite")
        scene.render.filepath = str(target.resolve())
        t0 = time.time()
        bpy.ops.render.render(write_still=True)
        times.append(round(time.time()-t0, 3))
        if any(f in t["anchors"] for t in timeline):
            (out/"anchors"/f"{f:05d}.png").write_bytes(target.read_bytes())
    report = {"status": "rendered", "blender": bpy.app.version_string, "engine": "CYCLES", "device": "CPU",
              "samples": scene.cycles.samples, "denoiser": getattr(scene.cycles, "denoiser", None),
              "resolution": [w, h], "fps": 30, "framesRendered": len(frames), "framesInTimeline": scene.frame_end,
              "secondsPerFrame": {"mean": round(sum(times)/max(1, len(times)), 3), "max": max(times or [0]), "min": min(times or [0])},
              "wallSeconds": round(time.time()-started, 1),
              "peakRssMiB": round(resource.getrusage(resource.RUSAGE_SELF).ru_maxrss/1024, 1),
              "inputs": {"packageSha256": digest(manifest_bytes), "shotsSha256": digest(shots_bytes),
                         "verifiedBlendSha256": digest(blend.read_bytes()),
                         "visualSidecarSha256": digest(Path(opt["visual"]).read_bytes()) if opt.get("visual") else None,
                         "rendererSha256": digest(Path(__file__).read_bytes())},
              "pilotBlend": {"bytes": pilot_blend.stat().st_size, "sha256": digest(pilot_blend.read_bytes())},
              "scene": {"entities": {r: sum(1 for o in entities.values() if o.get("rubik_role") == r) for r in ("room", "wall", "opening", "object")},
                        "entityIdsSha256": digest("\n".join(sorted(entities)).encode()),
                        "materials": len(bpy.data.materials), "images": len([i for i in bpy.data.images if i.size[0] > 0]),
                        "cameraKeyframes": scene.frame_end},
              "presentationAdditions": ["PilotWorld sky 0.9", "PilotSun 2.2 W/m2, 8 deg", "PilotCamera keyed per frame, constant interpolation (hard cuts)"],
              "visualSidecar": visual, "timeline": timeline, "presence": measured}
    (out/"render-report.json").write_text(json.dumps(report, indent=1, ensure_ascii=False)+"\n", encoding="utf8")
    print(json.dumps({k: report[k] for k in ("status", "framesRendered", "secondsPerFrame", "wallSeconds", "peakRssMiB")}))


if __name__ == "__main__":
    main()
