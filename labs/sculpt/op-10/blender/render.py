"""SCULPT OP-10 · Render de revisión de la escena importada (Cycles por CPU, resoluciones económicas).

python render.py -- IMPORT-DIR CAPTURE-DIR OUT-DIR --phase 1|2|3 [--views axon,rom_living,...] [--res 640x400] [--samples 16]

Regla: la geometría y los materiales capturados NO se tocan. Todo lo añadido (cámaras, luces, cielo) vive en la colección
OP10_derived, nombrado y declarado en el informe como DERIVADO, nunca como dato del proyecto. No se inventan muebles,
materiales, huecos ni medidas.
  Fase 1 · geometría: materiales neutros (importación --materials neutral), luz plana de cielo + sol, sin techos en la axo.
  Fase 2 · ambiente: materiales observados del visor (importación --materials observed), cielo físico, sol y luz de
           estancia (un área por estancia a la altura del techo, declarada derivada).
  Fase 3 · arquitectura: perspectiva de dos puntos (desplazamiento de lente), lente por tamaño de estancia, AgX, más muestras.
Cámaras interiores derivadas del polígono canónico (project.json): ojo a 1,35 m, al 70/50/30 % del camino desde el centroide
hacia cada vértice y punto medio de arista; se descartan ojos a < 0,4 m de cualquier superficie o con algo bajo los pies, y se
elige la que maximiza presencia de la estancia objetivo × (1 − fracción de superficies a < 1 m)².
"""
import hashlib, json, math, resource, sys, time
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
    phase = int(arg("--phase", "1")); res = [int(v) for v in arg("--res", "640x400").split("x")]; samples = int(arg("--samples", "16"))
    views = arg("--views", "axon,rom_living,rom_kitchen,rom_master").split(",")
    if out.exists():
        raise SystemExit("Refusing overwrite: " + str(out))
    project = json.loads((cap / "project.json").read_text(encoding="utf8")); manifest = json.loads((cap / "manifest.json").read_text(encoding="utf8"))
    origin = manifest["frame"]["originPlanMm"]
    bpy.ops.wm.open_mainfile(filepath=str(imp / "scene.blend"))
    sc = bpy.context.scene
    meta = json.loads(sc["op10"])
    if meta["sceneSha256"] != manifest["outputs"]["scene.json"]["sha256"]:
        raise SystemExit("scene.blend does not belong to this capture")
    derived = bpy.data.collections.new("OP10_derived"); sc.collection.children.link(derived)
    declared = []
    # Motor
    sc.render.engine = "CYCLES"; sc.cycles.device = "CPU"; sc.cycles.samples = samples; sc.cycles.use_denoising = True
    sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = res[0], res[1], 100
    sc.render.image_settings.file_format = "PNG"; sc.render.film_transparent = False
    sc.view_settings.view_transform = "AgX"
    if phase >= 3:
        sc.view_settings.look = "AgX - Medium High Contrast"
    # Mundo
    world = bpy.data.worlds.new("OP10_world"); sc.world = world; world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    if phase == 1:
        bg.inputs["Color"].default_value = (0.8, 0.82, 0.85, 1); bg.inputs["Strength"].default_value = 0.6
        declared.append("world: flat grey sky 0.6 (derived)")
    elif phase >= 3:
        # Exterior NEUTRO y luminoso, sin horizonte: un cielo físico dibuja bajo el horizonte una banda oscura que se lee como
        # «vistas al mar» — contexto que el proyecto no tiene. Se rechaza (ciclo 2 de la fase 3) y se declara.
        bg.inputs["Color"].default_value = (0.78, 0.82, 0.87, 1); bg.inputs["Strength"].default_value = 0.8
        declared.append("world: neutral bright exterior without horizon (no invented view); sun keeps the direction (derived)")
    else:
        sky = world.node_tree.nodes.new("ShaderNodeTexSky")
        for t in ("MULTIPLE_SCATTERING", "NISHITA", "PREETHAM"):
            try:
                sky.sky_type = t; break
            except TypeError:
                continue
        sky.sun_elevation = math.radians(38); sky.sun_rotation = math.radians(135)
        world.node_tree.links.new(sky.outputs["Color"], bg.inputs["Color"]); bg.inputs["Strength"].default_value = 0.35
        declared.append(f"world: procedural sky {sky.sky_type}, sun 38° elevation, 135° azimuth (derived)")
    sun_data = bpy.data.lights.new("OP10_sun", "SUN"); sun_data.energy = 3.0 if phase == 1 else 4.0; sun_data.angle = math.radians(1.5)
    sun = bpy.data.objects.new("OP10_sun", sun_data); sun.rotation_euler = (math.radians(52), 0, math.radians(135)); derived.objects.link(sun)
    declared.append(f"sun lamp {sun_data.energy} (derived; matches the sky direction)")
    if phase >= 2:  # luz de estancia: un área por estancia contada, a la altura del techo (derivada, no es un aparato del proyecto)
        h = (project.get("defaults") or {}).get("wallHeightMm", 2800) / 1000
        for r in project["rooms"]:
            xs = [p["x"] for p in r["polygon"]]; ys = [p["y"] for p in r["polygon"]]
            c = centroid(r["polygon"]); w, d = (max(xs) - min(xs)) / 1000, (max(ys) - min(ys)) / 1000
            L = bpy.data.lights.new("OP10_room_" + r["id"], "AREA"); L.shape = "RECTANGLE"; L.size, L.size_y = max(0.3, w * 0.5), max(0.3, d * 0.5)
            L.energy = 20.0 * max(1.0, w * d) ** 0.5
            o = bpy.data.objects.new("OP10_room_" + r["id"], L); o.location = to_blender(c["x"], c["y"], origin, h - 0.02); derived.objects.link(o)
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
            src = json.loads(o.data.materials[0].get("op10_source", "{}"))
            r = rooms.get(o.get("rubik_id")); pm = mats.get(r.get("floorMaterialId")) if r else None
            if not src.get("hasMap") or not pm or not (pm.get("appearance") or {}).get("color"):
                continue
            m = o.data.materials[0].copy(); m.name = "op10:project-floor:" + pm["id"]
            col = pm["appearance"]["color"].lstrip("#"); lin = [((int(col[i:i + 2], 16) / 255) / 12.92) if int(col[i:i + 2], 16) / 255 <= 0.04045 else (((int(col[i:i + 2], 16) / 255 + 0.055) / 1.055) ** 2.4) for i in (0, 2, 4)]
            m.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (*lin, 1); o.data.materials[0] = m
            mapped.append({"object": o.name, "room": r["id"], "projectMaterial": pm["id"], "color": pm["appearance"]["color"]})
        declared.append(f"textured floors coloured from their project material ({len(mapped)} meshes; textures never copied)")
    # Techos y ayudas según vista
    ceilings = bpy.data.collections.get("Rubik_ceiling")
    depsgraph = bpy.context.evaluated_depsgraph_get()
    out.mkdir(parents=True)
    rows = []
    for view in views:
        cam_data = bpy.data.cameras.new("OP10_cam_" + view); cam = bpy.data.objects.new("OP10_cam_" + view, cam_data); derived.objects.link(cam); sc.camera = cam
        info = {"view": view}
        if view == "axon":
            if ceilings: ceilings.hide_render = True
            if phase >= 2:  # desde arriba el cielo físico se ve oscuro bajo el horizonte: fondo de estudio gris claro (derivado)
                axw = bpy.data.worlds.get("OP10_world_axon") or bpy.data.worlds.new("OP10_world_axon"); axw.use_nodes = True
                axw.node_tree.nodes["Background"].inputs["Color"].default_value = (0.86, 0.86, 0.85, 1); axw.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.9
                sc.world = axw; info["world"] = "studio grey for the axonometry (derived)"
            pts = [o.matrix_world @ Vector(c) for o in bpy.data.objects if o.type == "MESH" for c in o.bound_box]
            lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts))); hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
            ctr = (lo + hi) / 2; diag = (hi - lo).length
            cam_data.type = "ORTHO"; cam_data.ortho_scale = diag * 1.02
            az, el = math.radians(-35), math.radians(38)
            cam.location = ctr + Vector((math.cos(el) * math.sin(az), -math.cos(el) * math.cos(az), math.sin(el))) * diag * 2
            cam.rotation_euler = (ctr - cam.location).to_track_quat("-Z", "Y").to_euler()
            cam_data.clip_end = diag * 6
            info.update({"camera": "orthographic axonometry", "ceilings": "hidden in this view (declared)"})
        else:
            sc.world = world
            if ceilings: ceilings.hide_render = False
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
    report = {"phase": phase, "blender": bpy.app.version_string, "renderer": f"Cycles CPU, {samples} samples, denoise, {res[0]}x{res[1]}, AgX",
              "input": {"sceneSha256": meta["sceneSha256"], "projectId": meta["projectId"], "materials": meta["materials"]},
              "derived": declared, "views": rows, "peakRssBytes": resource.getrusage(resource.RUSAGE_SELF).ru_maxrss * 1024,
              "rendererScriptSha256": sha(Path(__file__).read_bytes()), "reviewBlend": {"bytes": (out / "review.blend").stat().st_size}}
    (out / "render-report.json").write_text(json.dumps(report, indent=1) + "\n", encoding="utf8")
    print(json.dumps({"phase": phase, "views": [(r["view"], r["seconds"], r.get("targetRoomPresence"), r.get("nearSurfaceFraction")) for r in rows]}))

if __name__ == "__main__":
    main()
