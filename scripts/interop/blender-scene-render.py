"""OP-10 · Render reproducible de una «Escena para Blender» importada (Cycles), con perfiles medidos. Candidata de integración.

python blender-scene-render.py -- IMPORT-DIR PACKAGE-DIR OUT-DIR --profile preview|review|delivery [--views viewer,axon,rom_x]
    [--res WxH] [--samples N] [--device CPU|GPU] [--fill rooms|none] [--threads N]

Regla (laboratorio OP-10): la geometría y los materiales importados NO se tocan. La cámara «viewer» y el sol/cielo son los
capturados en el visor (C7). Lo añadido (cámaras derivadas, luz de relleno de estancias, fondo de la axonometría, color de
suelos texturizados) vive en la colección RUBIK_derived y se declara en el informe; nunca se presenta como dato del proyecto.
Cámaras interiores derivadas del polígono canónico (project.json): ojo a 1,35 m, al 70/50/30 % del centroide a cada vértice y
punto medio; se descartan ojos a < 0,4 m de una superficie o con algo bajo los pies; gana presencia × (1 − cercanía)².
Perfiles: blender-render-profiles.json (resolución, muestras y lente medidos en este laboratorio; ver HANDOFF).
"""
import hashlib, json, math, resource, sys, time
import os
from pathlib import Path
import bpy
from mathutils import Vector

def sha(b): return hashlib.sha256(b).hexdigest()
def arg(name, default=None):
    a = sys.argv[sys.argv.index("--") + 1:]
    return a[a.index(name) + 1] if name in a else default

def to_blender(x_mm, y_mm, origin, z=0.0):
    return Vector(((x_mm - origin["x"]) / 1000, -((y_mm - origin["y"]) / 1000), z))

def centroid(poly):
    a = cx = cy = 0.0
    for i, p in enumerate(poly):
        q = poly[(i + 1) % len(poly)]; c = p["x"] * q["y"] - q["x"] * p["y"]; a += c; cx += (p["x"] + q["x"]) * c; cy += (p["y"] + q["y"]) * c
    a *= 0.5
    return {"x": cx / (6 * a), "y": cy / (6 * a)}

def inside(poly, x, y):
    c = False
    for i in range(len(poly)):
        a, b = poly[i], poly[i - 1]
        if (a["y"] > y) != (b["y"] > y) and x < (b["x"] - a["x"]) * (y - a["y"]) / (b["y"] - a["y"]) + a["x"]:
            c = not c
    return c

def clearance(eye, depsgraph):
    """Distancia libre mínima alrededor del ojo (16 rayos horizontales) y hasta el suelo: rechaza ojos dentro de muebles."""
    sc = bpy.context.scene; best = math.inf
    for k in range(16):
        a = 2 * math.pi * k / 16; ok, loc, *_ = sc.ray_cast(depsgraph, eye, Vector((math.cos(a), math.sin(a), 0)))
        if ok: best = min(best, (loc - eye).length)
    ok, loc, *_ = sc.ray_cast(depsgraph, eye, Vector((0, 0, -1)))
    floor_gap = (eye - loc).length if ok else math.inf
    return best, floor_gap

def presence(cam, room, origin, depsgraph, n=24):
    """(presencia, cercanía): fracción de rayos cuyo primer impacto cae en la estancia objetivo, y fracción que choca a < 1 m."""
    sc = bpy.context.scene
    frame = cam.data.view_frame(scene=sc)
    hits = inside_n = near = 0
    for i in range(n):
        for j in range(n):
            u, v = (i + 0.5) / n, (j + 0.5) / n
            p = frame[2].lerp(frame[1], u).lerp(frame[3].lerp(frame[0], u), v)
            d = (cam.matrix_world @ p - cam.matrix_world.translation).normalized()
            ok, loc, *_ = sc.ray_cast(depsgraph, cam.matrix_world.translation, d)
            if ok:
                hits += 1
                if (loc - cam.matrix_world.translation).length < 1.0:
                    near += 1
                px, py = loc.x * 1000 + origin["x"], -loc.y * 1000 + origin["y"]
                if inside(room["polygon"], px, py):
                    inside_n += 1
    return inside_n / (n * n), near / (n * n)

def main():
    a = sys.argv[sys.argv.index("--") + 1:]
    imp, cap, out = Path(a[0]), Path(a[1]), Path(a[2])
    profiles = json.loads(Path(__file__).with_name("blender-render-profiles.json").read_text(encoding="utf8"))
    pname = arg("--profile", "review")
    if pname not in profiles["profiles"]:
        raise SystemExit("Unknown profile: " + pname)
    prof = profiles["profiles"][pname]
    phase = 3  # composición arquitectónica del laboratorio (dos puntos, AgX), la validada en la fase 3
    res = [int(v) for v in arg("--res", prof["resolution"]).split("x")]; samples = int(arg("--samples", str(prof["samples"])))
    views = arg("--views", "viewer,axon").split(",")
    device = arg("--device", "CPU"); fill = arg("--fill", prof.get("fill", "rooms"))
    if out.exists():
        raise SystemExit("Refusing overwrite: " + str(out))
    project = json.loads((cap / "project.json").read_text(encoding="utf8")); manifest = json.loads((cap / "manifest.json").read_text(encoding="utf8"))
    origin = manifest["scene"]["frame"]["originPlanMm"]
    bpy.ops.wm.open_mainfile(filepath=str(imp / "scene.blend"))
    sc = bpy.context.scene
    meta = json.loads(sc["rubik"])
    if meta["glbSha256"] != manifest["files"]["scene.glb"]["sha256"]:
        raise SystemExit("scene.blend does not belong to this package")
    derived = bpy.data.collections.new("RUBIK_derived"); sc.collection.children.link(derived)
    declared = []
    viewer_cam = bpy.data.objects.get("RUBIK_camera")
    captured_world = sc.world
    # Motor
    sc.render.engine = "CYCLES"; sc.cycles.samples = samples; sc.cycles.use_denoising = True
    gpu = None
    if device == "GPU":
        prefs = bpy.context.preferences.addons["cycles"].preferences
        for kind in ("OPTIX", "CUDA", "HIP", "METAL", "ONEAPI"):
            try:
                prefs.compute_device_type = kind; prefs.get_devices()
                if any(d.type == kind for d in prefs.devices):
                    gpu = kind; break
            except TypeError:
                continue
        if not gpu:
            raise SystemExit("GPU requested but no Cycles GPU device is available here (no GPU result is claimed)")
        for d in prefs.devices: d.use = d.type == gpu
    sc.cycles.device = "GPU" if gpu else "CPU"
    if arg("--threads"):
        sc.render.threads_mode = "FIXED"; sc.render.threads = int(arg("--threads"))
    sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = res[0], res[1], 100
    sc.render.image_settings.file_format = "PNG"; sc.render.film_transparent = False
    sc.view_settings.view_transform = "AgX"
    if phase >= 3:
        sc.view_settings.look = "AgX - Medium High Contrast"
    # Mundo y sol: los CAPTURADOS en el visor (importación, colección RUBIK_light_from_viewer). Solo si faltan se usa el
    # exterior neutro del laboratorio (fase 3), declarado.
    world = captured_world
    if not any(o.type == "LIGHT" and o.data.type == "SUN" for o in bpy.data.objects):
        world = bpy.data.worlds.new("RUBIK_world_neutral"); sc.world = world; world.use_nodes = True
        bg = world.node_tree.nodes["Background"]; bg.inputs["Color"].default_value = (0.78, 0.82, 0.87, 1); bg.inputs["Strength"].default_value = 0.8
        sun_data = bpy.data.lights.new("RUBIK_sun_derived", "SUN"); sun_data.energy = 4.0; sun_data.angle = math.radians(1.5)
        sun = bpy.data.objects.new("RUBIK_sun_derived", sun_data); sun.rotation_euler = (math.radians(52), 0, math.radians(135)); derived.objects.link(sun)
        declared.append("no captured light: neutral exterior 0.8 and sun 4.0 at 52°/135° (derived)")
    else:
        declared.append("sun and sky: captured from the viewer (see import-report derivedLight)")
    if fill == "rooms":  # luz de estancia: un área por estancia contada, a la altura del techo (derivada, no es un aparato del proyecto)
        h = (project.get("defaults") or {}).get("wallHeightMm", 2800) / 1000
        for r in project["rooms"]:
            xs = [p["x"] for p in r["polygon"]]; ys = [p["y"] for p in r["polygon"]]
            c = centroid(r["polygon"]); w, d = (max(xs) - min(xs)) / 1000, (max(ys) - min(ys)) / 1000
            L = bpy.data.lights.new("RUBIK_room_fill_" + r["id"], "AREA"); L.shape = "RECTANGLE"; L.size, L.size_y = max(0.3, w * 0.5), max(0.3, d * 0.5)
            L.energy = 20.0 * max(1.0, w * d) ** 0.5
            o = bpy.data.objects.new("RUBIK_room_fill_" + r["id"], L); o.location = to_blender(c["x"], c["y"], origin, h - 0.02); derived.objects.link(o)
        declared.append(f"room fill: one ceiling area light per room ({len(project['rooms'])}), energy 20·√area W (derived)")
    if phase >= 2:
        sc.view_settings.exposure = -0.4
        declared.append("exposure -0.4 EV (derived)")
        # Suelos texturizados en el visor: la imagen no se copia; su color se toma del material DEL PROYECTO de la estancia
        # (room.floorMaterialId → materials[].appearance.color). Correspondencia verificable por ID, declarada.
        mats = {m["id"]: m for m in project.get("materials", [])}; rooms = {r["id"]: r for r in project["rooms"]}; mapped = []
        for o in bpy.data.objects:
            if o.type != "MESH" or o.get("rubik_role") not in ("room", "room-slab") or not o.data.materials:
                continue
            src = {"hasMap": bool(o.data.materials[0].get("rubik_has_map"))}
            r = rooms.get(o.get("rubik_id")); pm = mats.get(r.get("floorMaterialId")) if r else None
            if not src.get("hasMap") or not pm or not (pm.get("appearance") or {}).get("color"):
                continue
            m = o.data.materials[0].copy(); m.name = "rubik:project-floor:" + pm["id"]
            col = pm["appearance"]["color"].lstrip("#"); lin = [((int(col[i:i + 2], 16) / 255) / 12.92) if int(col[i:i + 2], 16) / 255 <= 0.04045 else (((int(col[i:i + 2], 16) / 255 + 0.055) / 1.055) ** 2.4) for i in (0, 2, 4)]
            next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED").inputs["Base Color"].default_value = (*lin, 1); o.data.materials[0] = m
            mapped.append({"object": o.name, "room": r["id"], "projectMaterial": pm["id"], "color": pm["appearance"]["color"]})
        declared.append(f"textured floors coloured from their project material ({len(mapped)} meshes; textures never copied)")
    # Techos y ayudas según vista
    ceilings = bpy.data.collections.get("Rubik_ceiling"); fixtures = bpy.data.collections.get("Rubik_fixture")
    depsgraph = bpy.context.evaluated_depsgraph_get()
    out.mkdir(parents=True)
    rows = []
    for view in views:
        info = {"view": view}
        if view == "viewer":  # C7: la pose exacta del visor al preparar la escena (no derivada)
            if not viewer_cam:
                raise SystemExit("The package has no captured camera")
            sc.camera = viewer_cam; sc.world = world
            if ceilings: ceilings.hide_render = False
            if fixtures: fixtures.hide_render = False
            aspect = manifest["scene"]["view"]["camera"]["aspect"]
            sc.render.resolution_y = int(round(res[0] / aspect)) if aspect else res[1]
            info.update({"camera": "captured viewer pose (C7)", "fovDeg": manifest["scene"]["view"]["camera"]["fovDeg"], "resolution": [res[0], sc.render.resolution_y]})
            bpy.context.view_layer.update()
            png = out / f"{view}.png"; sc.render.filepath = str(png)
            t0 = time.monotonic(); bpy.ops.render.render(write_still=True); dt = time.monotonic() - t0
            info.update({"seconds": round(dt, 2), "png": {"bytes": png.stat().st_size, "sha256": sha(png.read_bytes())}})
            rows.append(info); sc.render.resolution_y = res[1]
            continue
        cam_data = bpy.data.cameras.new("RUBIK_cam_" + view); cam = bpy.data.objects.new("RUBIK_cam_" + view, cam_data); derived.objects.link(cam); sc.camera = cam
        if view == "axon":
            if ceilings: ceilings.hide_render = True
            if fixtures: fixtures.hide_render = True
            if phase >= 2:  # desde arriba el cielo físico se ve oscuro bajo el horizonte: fondo de estudio gris claro (derivado)
                axw = bpy.data.worlds.get("RUBIK_world_axon") or bpy.data.worlds.new("RUBIK_world_axon"); axw.use_nodes = True
                axw.node_tree.nodes["Background"].inputs["Color"].default_value = (0.86, 0.86, 0.85, 1); axw.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.9
                sc.world = axw; info["world"] = "studio grey for the axonometry (derived)"
            pts = [o.matrix_world @ Vector(c) for o in bpy.data.objects if o.type == "MESH" and o.get("rubik_role") != "ceiling" for c in o.bound_box]
            lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts))); hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
            ctr = (lo + hi) / 2; diag = (hi - lo).length
            cam_data.type = "ORTHO"; cam_data.ortho_scale = diag * 1.02
            az, el = math.radians(-35), math.radians(38)
            cam.location = ctr + Vector((math.cos(el) * math.sin(az), -math.cos(el) * math.cos(az), math.sin(el))) * diag * 2
            cam.rotation_euler = (ctr - cam.location).to_track_quat("-Z", "Y").to_euler()
            cam_data.clip_end = diag * 6
            info.update({"camera": "orthographic axonometry", "ceilings": "ceilings and ceiling fixtures hidden in this view (declared)"})
        else:
            sc.world = world
            if ceilings: ceilings.hide_render = False
            if fixtures: fixtures.hide_render = False
            room = next(r for r in project["rooms"] if r["id"] == view)
            c = centroid(room["polygon"]); area = abs(sum(p["x"] * q["y"] - q["x"] * p["y"] for p, q in zip(room["polygon"], room["polygon"][1:] + room["polygon"][:1]))) / 2e6
            cam_data.lens = 24 if phase < 3 else (16 if area < 8 else 18 if area < 14 else 22)
            cam_data.sensor_width = 36
            best = None
            poly = room["polygon"]
            anchors = poly + [{"x": (p["x"] + q["x"]) / 2, "y": (p["y"] + q["y"]) / 2} for p, q in zip(poly, poly[1:] + poly[:1])]
            for f, v in ((f, v) for f in (0.7, 0.5, 0.3) for v in anchors):
                ex, ey = c["x"] + f * (v["x"] - c["x"]), c["y"] + f * (v["y"] - c["y"])
                if not inside(room["polygon"], ex, ey):
                    continue
                eye = to_blender(ex, ey, origin, 1.35)
                free, floor_gap = clearance(eye, bpy.context.evaluated_depsgraph_get())
                if free < 0.4 or abs(floor_gap - 1.35) > 0.05:  # dentro o pegado a un mueble, o algo bajo los pies
                    continue
                tx, ty = c["x"] - 0.6 * (v["x"] - c["x"]), c["y"] - 0.6 * (v["y"] - c["y"])
                target = to_blender(tx, ty, origin, 1.35)
                direction = (target - eye); direction.z = 0
                cam.location = eye
                cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
                if phase >= 3:
                    cam_data.shift_y = -0.12  # mirar hacia abajo sin inclinar la cámara: verticales paralelas (dos puntos)
                else:
                    cam.rotation_euler.x -= math.radians(8)
                bpy.context.view_layer.update()
                pres, near = presence(cam, room, origin, bpy.context.evaluated_depsgraph_get())
                score = pres * (1 - near) ** 2
                if best is None or score > best[0]:
                    best = (score, eye.copy(), cam.rotation_euler.copy(), (round(ex), round(ey)), pres, near)
            if best is None:
                raise SystemExit("No valid eye position inside " + view)
            cam.location, cam.rotation_euler = best[1], best[2]
            info.update({"camera": f"perspective {cam_data.lens} mm, eye 1.35 m at plan {best[3]}", "targetRoomPresence": round(best[4], 3), "nearSurfaceFraction": round(best[5], 3), "score": round(best[0], 3), "twoPoint": phase >= 3})
        bpy.context.view_layer.update()
        png = out / f"{view}.png"; sc.render.filepath = str(png)
        t0 = time.monotonic(); bpy.ops.render.render(write_still=True); dt = time.monotonic() - t0
        info.update({"seconds": round(dt, 2), "png": {"bytes": png.stat().st_size, "sha256": sha(png.read_bytes())}})
        rows.append(info)
    bpy.ops.wm.save_as_mainfile(filepath=str(out / "review.blend"))
    report = {"profile": pname, "profileSpec": prof, "blender": bpy.app.version_string, "renderer": f"Cycles {sc.cycles.device}{(' ' + gpu) if gpu else ''}, {samples} samples, denoise, {res[0]}x{res[1]}, AgX",
              "threads": sc.render.threads, "cpuCount": os.cpu_count(),
              "input": {"glbSha256": meta["glbSha256"], "projectId": meta["projectId"], "materials": meta["materials"], "light": meta["light"]},
              "derived": declared, "views": rows, "peakRssBytes": resource.getrusage(resource.RUSAGE_SELF).ru_maxrss * 1024,
              "rendererScriptSha256": sha(Path(__file__).read_bytes()), "reviewBlend": {"bytes": (out / "review.blend").stat().st_size}}
    (out / "render-report.json").write_text(json.dumps(report, indent=1) + "\n", encoding="utf8")
    print(json.dumps({"phase": phase, "views": [(r["view"], r["seconds"], r.get("targetRoomPresence"), r.get("nearSurfaceFraction")) for r in rows]}))

if __name__ == "__main__":
    main()
