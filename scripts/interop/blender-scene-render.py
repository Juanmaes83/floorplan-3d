# SPDX-License-Identifier: GPL-3.0-or-later
# Copyright (C) 2026 Juan Manuel Espinosa Galant · Rubik Sota
# Script del kit «Escena para Blender» de RUBIK SOTA. Usa la API bpy de Blender (GPL-2.0-or-later) y se distribuye bajo
# la GNU GPL v3 o posterior: ver LICENCIA-SCRIPTS.txt y COPYING-GPL-3.0.txt. Sin garantía. Esta licencia NO se extiende
# a la aplicación web de RUBIK, a los lanzadores ni a los proyectos, imágenes, renders o archivos .blend de la persona.
"""OP-10 · Render reproducible de una «Escena para Blender» importada (Cycles), con perfiles medidos.
M03 · viaja dentro del ZIP de Entregar como rubik_blender_render.py (copia exacta): el profesional renderiza SIN el código
de RUBIK. Lee las estancias de rubik-estancias.json (el ZIP) o de project.json (laboratorio).

python blender-scene-render.py -- IMPORT-DIR PACKAGE-DIR OUT-DIR --profile preview|review|delivery [--views auto|viewer,axon,rom_x]
    [--res WxH] [--samples N] [--device CPU|GPU] [--fill rooms|none] [--threads N]

M03 · reanudable: cada vista se escribe de forma atómica y el informe se actualiza tras cada una. Si el proceso se
interrumpe (Ctrl+C, cierre, fallo), volver a lanzar la MISMA orden continúa por la primera vista que falte; nunca se mezclan
resultados de otra escena o de otro perfil (se comprueba la huella de la escena y el perfil antes de reanudar).
«auto» = vista del visor + axonometría + las estancias interiores más representativas (contadas, ≥ 5 m², hasta 4).

Regla (laboratorio OP-10): la geometría y los materiales importados NO se tocan. La cámara «viewer» y el sol/cielo son los
capturados en el visor (C7). Lo añadido (cámaras derivadas, luz de relleno de estancias, fondo de la axonometría, color de
suelos texturizados) vive en la colección RUBIK_derived y se declara en el informe; nunca se presenta como dato del proyecto.
Cámaras interiores derivadas del polígono canónico (project.json): ojo a 1,35 m, al 70/50/30 % del centroide a cada vértice y
punto medio; se descartan ojos a < 0,4 m de una superficie o con algo bajo los pies; gana presencia × (1 − cercanía)².
Perfiles: blender-render-profiles.json (resolución, muestras y lente medidos en este laboratorio; ver HANDOFF).
"""
import hashlib, json, math, sys, time
try:
    import resource
except ImportError:
    resource = None

def peak_rss_bytes():
    if resource is None:
        return None
    rss = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
    return rss if sys.platform == "darwin" else rss * 1024

import os
from pathlib import Path
import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector

def sha(b): return hashlib.sha256(b).hexdigest()
def arg(name, default=None):
    a = sys.argv[sys.argv.index("--") + 1:]
    return a[a.index(name) + 1] if name in a else default

def fail(code, message):
    """Error comprensible para la persona y legible por el lanzador: una línea JSON y código de salida 3."""
    print(json.dumps({"error": code, "message": message}, ensure_ascii=False))
    sys.exit(3)

def load_rooms(cap, manifest):
    """Estancias para cámaras interiores y color de suelos. El ZIP de Entregar trae rubik-estancias.json (geometría de
    estancias y color de su material de suelo, sin texto libre del proyecto salvo el nombre visible de cada estancia);
    el laboratorio puede pasar project.json. Se devuelve con la forma mínima que usa este script."""
    pj, ej = cap / "project.json", cap / "rubik-estancias.json"
    expected = manifest["files"].get("rubik-estancias.json")
    if expected and (not ej.exists() or sha(ej.read_bytes()) != expected["sha256"]):
        fail("ROOMS_MISMATCH", "rubik-estancias.json no coincide con el manifiesto original")
    if not expected and pj.exists():
        p = json.loads(pj.read_text(encoding="utf8"))
        labels = {r["id"]: r["id"] for r in p["rooms"]}  # laboratorio: identificadores (los nombres guardados pueden no ser visibles en ES/EN)
        return p, labels
    if ej.exists():
        e = json.loads(ej.read_text(encoding="utf8"))
        if e.get("format") != "rubik-sota.scene-rooms":
            fail("ROOMS_FORMAT", "rubik-estancias.json no es un archivo de estancias de RUBIK")
        mats = [{"id": "floor:" + r["id"], "appearance": {"color": r["floorColor"]}, "sourceId": r.get("floorMaterialId"), "preset": r.get("floorPreset")}
                for r in e["rooms"] if r.get("floorColor")]  # sourceId/preset: rubik-estancias 1.2.0 (aditivo)
        rooms = [{"id": r["id"], "polygon": r["polygon"], "counted": r.get("counted", True), "levelId": r.get("levelId"),
                  "floorMaterialId": ("floor:" + r["id"]) if r.get("floorColor") else None} for r in e["rooms"]]
        return {"rooms": rooms, "materials": mats, "objects": e.get("objects", []), "defaults": {"wallHeightMm": e.get("wallHeightMm", 2800)}}, {r["id"]: r.get("label") or r["id"] for r in e["rooms"]}
    fail("ROOMS_MISSING", "Falta rubik-estancias.json: descarga de nuevo la escena desde RUBIK (Entregar › Escena para Blender)")

def area_m2(poly):
    return abs(sum(p["x"] * q["y"] - q["x"] * p["y"] for p, q in zip(poly, poly[1:] + poly[:1]))) / 2e6

def auto_rooms(project, n=4, min_area=5.0):
    rs = [r for r in project["rooms"] if r.get("counted", True) is not False and len(r["polygon"]) >= 3 and area_m2(r["polygon"]) >= min_area]
    return [r["id"] for r in sorted(rs, key=lambda r: -area_m2(r["polygon"]))[:n]]

def hero_box(room, origin):
    """M03 · mueble protagonista de la estancia: el objeto (mallas con el mismo rubik_id) de mayor huella en planta cuyo
    centro cae dentro de la estancia (en un dormitorio, la cama; en un salón, el sofá o el mueble de TV). Devuelve las 8
    esquinas de su caja en el marco de Blender, o None. No se clasifica por tipo: es una regla geométrica, declarada."""
    groups = {}
    for o in bpy.data.objects:
        if o.type == "MESH" and o.get("rubik_role") == "object":
            groups.setdefault(o.get("rubik_id"), []).extend(o.matrix_world @ Vector(c) for c in o.bound_box)
    best = None
    for k, pts in groups.items():
        lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts))); hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
        ctr = (lo + hi) / 2
        if not inside(room["polygon"], ctr.x * 1000 + origin["x"], -ctr.y * 1000 + origin["y"]):
            continue
        fp = (hi.x - lo.x) * (hi.y - lo.y)
        if best is None or fp > best[0]:
            best = (fp, k, [Vector((x, y, z)) for x in (lo.x, hi.x) for y in (lo.y, hi.y) for z in (lo.z, hi.z)])
    return best

def hero_in_frame(cam, hero, margin=0):
    """Fracción de las 8 esquinas del mueble protagonista que caen dentro del encuadre (1 = se ve entero)."""
    if not hero:
        return 1.0
    sc = bpy.context.scene
    return sum(1 for q in hero[2] if (lambda t: margin <= t.x <= 1 - margin and margin <= t.y <= 1 - margin and t.z > 0)(world_to_camera_view(sc, cam, q))) / 8

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

def presence(cam, room, origin, depsgraph, n=24, hero_id=None):
    """(presencia, cercanía, primer plano): fracción de rayos cuyo primer impacto cae en la estancia objetivo, fracción que
    choca a < 1 m, y (M03) fracción que choca con MOBILIARIO a < 1,8 m: un mueble cortado en primer plano (la cama del
    dormitorio en la línea base) impide leer la estancia aunque no esté a menos de 1 m."""
    sc = bpy.context.scene
    frame = cam.data.view_frame(scene=sc)
    hits = inside_n = near = fg = cut = bottom = 0
    for i in range(n):
        for j in range(n):
            u, v = (i + 0.5) / n, (j + 0.5) / n
            p = frame[2].lerp(frame[1], u).lerp(frame[3].lerp(frame[0], u), v)
            d = (cam.matrix_world @ p - cam.matrix_world.translation).normalized()
            ok, loc, _n, _i, obj, _m = sc.ray_cast(depsgraph, cam.matrix_world.translation, d)
            if ok:
                hits += 1
                dist = (loc - cam.matrix_world.translation).length
                if dist < 1.0:
                    near += 1
                furniture = obj is not None and obj.get("rubik_role") == "object" and obj.get("rubik_id") != hero_id
                if dist < 1.8 and furniture:
                    fg += 1
                if v < 0.3:  # franja inferior del encuadre (v=0 abajo)
                    bottom += 1
                    if furniture and dist < 2.4:
                        cut += 1
                px, py = loc.x * 1000 + origin["x"], -loc.y * 1000 + origin["y"]
                if inside(room["polygon"], px, py):
                    inside_n += 1
    return inside_n / (n * n), near / (n * n), fg / (n * n), (cut / bottom if bottom else 0.0)

def lock_output(out):
    # The OS releases the lock even if Blender is interrupted. Keep the lock file beside the results.
    out.parent.mkdir(parents=True, exist_ok=True)
    stream = (out.parent / ("." + out.name + ".rubik-lock")).open("a+b")
    try:
        if os.name == "nt":
            import msvcrt
            if stream.seek(0, os.SEEK_END) == 0:
                stream.write(b"0")
                stream.flush()
            stream.seek(0)
            msvcrt.locking(stream.fileno(), msvcrt.LK_NBLCK, 1)
        else:
            import fcntl
            fcntl.flock(stream, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except OSError:
        stream.close()
        fail("OUTPUT_BUSY", "Ya se está renderizando en esta carpeta. Espera o elige otro perfil.")
    return stream


def main():
    a = sys.argv[sys.argv.index("--") + 1:]
    imp, cap, out = (Path(value).resolve() for value in a[:3])
    with lock_output(out):
        render(imp, cap, out)


def render(imp, cap, out):
    here = Path(__file__)
    prof_file = next((p for p in (here.with_name("blender-render-profiles.json"), here.with_name("rubik_render_profiles.json"), cap / "rubik_render_profiles.json") if p.exists()), None)
    if not prof_file:
        fail("PROFILES_MISSING", "Faltan los perfiles de render (rubik_render_profiles.json) junto al script")
    profiles = json.loads(prof_file.read_text(encoding="utf8"))
    pname = arg("--profile", "review")
    if pname not in profiles["profiles"]:
        fail("PROFILE_UNKNOWN", "Perfil desconocido: " + pname + " (preview, review o delivery)")
    prof = profiles["profiles"][pname]
    phase = 3  # composición arquitectónica del laboratorio (dos puntos, AgX), la validada en la fase 3
    res = [int(v) for v in arg("--res", prof["resolution"]).split("x")]; samples = int(arg("--samples", str(prof["samples"])))
    device = arg("--device", "CPU"); fill = arg("--fill", prof.get("fill", "rooms"))
    if not (imp / "scene.blend").exists():
        fail("SCENE_NOT_PREPARED", "No hay escena preparada en " + str(imp) + ": ejecuta antes la preparación (rubik_blender_prepare.py)")
    if not (cap / "manifest.json").exists():
        fail("MANIFEST_MISSING", "Falta manifest.json del paquete en " + str(cap))
    manifest_bytes = (cap / "manifest.json").read_bytes()
    manifest = json.loads(manifest_bytes)
    project, labels = load_rooms(cap, manifest)
    manifest_sha = sha(manifest_bytes)
    script_sha = sha(Path(__file__).read_bytes())
    prepared_sha = sha((imp / "scene.blend").read_bytes())
    origin = manifest["scene"]["frame"]["originPlanMm"]
    views_arg = arg("--views", "auto")
    views = (["viewer", "axon"] + auto_rooms(project)) if views_arg == "auto" else views_arg.split(",")
    known = {r["id"] for r in project["rooms"]}
    for v in views:
        if v not in ("viewer", "axon") and v not in known:
            fail("VIEW_UNKNOWN", "Vista desconocida: " + v)
    run_identity = sha(json.dumps([manifest_sha, prepared_sha, script_sha, prof, res, samples, device, fill,
                                   arg("--threads"), views], sort_keys=True).encode())
    # Reanudación (M03): sólo sobre una salida de ESTA escena y ESTE perfil; cualquier otra carpeta existente se respeta.
    previous = None
    if out.exists():
        rp = out / "render-report.json"
        leftovers = [p for p in out.iterdir() if not (p.name.startswith("_") and ".part." in p.name)]
        if not rp.exists() and leftovers:
            fail("OUTPUT_FOREIGN", "La carpeta de salida ya existe y no es un render de RUBIK: elige otra (" + str(out) + ")")
        # Interrumpido antes de terminar la primera vista: sólo quedan temporales propios; se empieza limpio.
        previous = json.loads(rp.read_text(encoding="utf8")) if rp.exists() else None
    if previous is not None:
        if previous.get("runIdentity") != run_identity:
            fail("OUTPUT_OTHER_RUN", "La carpeta de salida es de otra escena o de otro perfil: elige otra carpeta (" + str(out) + ")")
    bpy.ops.wm.open_mainfile(filepath=str(imp / "scene.blend"))
    sc = bpy.context.scene
    meta = json.loads(sc["rubik"])
    if ((manifest.get("captureId") and meta.get("manifestSha256") != manifest_sha)
            or meta["glbSha256"] != manifest["files"]["scene.glb"]["sha256"]
            or meta["projectId"] != manifest["source"]["projectId"]
            or meta.get("observedProjectSha256") != manifest["source"].get("observedProjectSha256")):
        fail("SCENE_MISMATCH", "scene.blend no pertenece a este paquete: vuelve a preparar la escena")
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
            fail("GPU_UNAVAILABLE", "Se pidió GPU pero no hay ningún dispositivo Cycles GPU aquí (no se declara ningún resultado GPU)")
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
    out.mkdir(parents=True, exist_ok=True)
    rows = [r for r in (previous or {}).get("views", []) if r.get("view") in views and (out / f"{r['view']}.png").exists()
            and sha((out / f"{r['view']}.png").read_bytes()) == r["png"]["sha256"]]
    done = {r["view"] for r in rows}
    t_start = time.monotonic()

    def write_report(status):
        report = {"format": "rubik-sota.blender-render", "version": "1.1.0", "status": status, "profile": pname, "profileSpec": prof, "resolution": res, "samples": samples,
                  "blender": bpy.app.version_string, "renderer": f"Cycles {sc.cycles.device}{(' ' + gpu) if gpu else ''}, {samples} samples, denoise, {res[0]}x{res[1]}, AgX",
                  "threads": sc.render.threads, "cpuCount": os.cpu_count(), "requestedViews": views,
                  "runIdentity": run_identity, "input": {"manifestSha256": manifest_sha, "preparedBlendSha256": prepared_sha, "glbSha256": meta["glbSha256"], "projectId": meta["projectId"], "observedProjectSha256": meta.get("observedProjectSha256"), "materials": meta["materials"], "light": meta["light"]},
                  "derived": declared, "views": rows, "peakRssBytes": peak_rss_bytes(),
                  "rendererScriptSha256": script_sha, "resumedViews": sorted(done)}
        if (out / "review.blend").exists():
            report["reviewBlend"] = {"bytes": (out / "review.blend").stat().st_size}
        tmp = out / "render-report.json.part"
        tmp.write_text(json.dumps(report, indent=1, ensure_ascii=False) + "\n", encoding="utf8"); os.replace(tmp, out / "render-report.json")
        return report

    def render_to(view):
        """Render atómico: se escribe en un temporal y se renombra; una interrupción nunca deja un PNG a medias."""
        tmp = out / f"_{view}.part.png"; sc.render.filepath = str(tmp)
        t0 = time.monotonic(); bpy.ops.render.render(write_still=True); dt = time.monotonic() - t0
        os.replace(tmp, out / f"{view}.png")
        png = out / f"{view}.png"
        return {"seconds": round(dt, 2), "png": {"bytes": png.stat().st_size, "sha256": sha(png.read_bytes())}}

    def progress(view, k):
        print(json.dumps({"progress": {"view": view, "index": k + 1, "of": len(views), "label": labels.get(view, view)}}, ensure_ascii=False), flush=True)

    for k, view in enumerate(views):
        reused = next((r for r in rows if r["view"] == view), None)
        if reused and ((out / "review.blend").is_file() or view == "viewer"):
            continue
        progress(view, k)
        info = {"view": view, "label": labels.get(view) if view not in ("viewer", "axon") else view}
        if view == "viewer":  # C7: la pose exacta del visor al preparar la escena (no derivada)
            if not viewer_cam:
                fail("NO_CAMERA", "El paquete no trae la cámara del visor")
            sc.camera = viewer_cam; sc.world = world
            if ceilings: ceilings.hide_render = False
            if fixtures: fixtures.hide_render = False
            aspect = manifest["scene"]["view"]["camera"]["aspect"]
            sc.render.resolution_y = int(round(res[0] / aspect)) if aspect else res[1]
            info.update({"camera": "captured viewer pose (C7)", "fovDeg": manifest["scene"]["view"]["camera"]["fovDeg"], "resolution": [res[0], sc.render.resolution_y]})
            bpy.context.view_layer.update()
            info.update(render_to(view)); rows.append(info); sc.render.resolution_y = res[1]; write_report("partial")
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
            c = centroid(room["polygon"]); area = area_m2(room["polygon"])
            cam_data.lens = 24 if phase < 3 else (16 if area < 8 else 18 if area < 14 else 22)
            cam_data.sensor_width = 36
            best = None
            poly = room["polygon"]
            hero = hero_box(room, origin)
            anchors = poly + [{"x": (p["x"] + q["x"]) / 2, "y": (p["y"] + q["y"]) / 2} for p, q in zip(poly, poly[1:] + poly[:1])]
            nominal_lens = cam_data.lens
            # Larger rooms have enough stand-off to keep more of the walls and openings in frame.
            shifts = (-.02, -.08, -.14) if area >= 14 else (-.08, -.18, -.28, -.34)
            for f, v in ((f, v) for f in (0.92, 0.85, 0.7, 0.5, 0.3) for v in anchors):
                ex, ey = c["x"] + f * (v["x"] - c["x"]), c["y"] + f * (v["y"] - c["y"])
                if not inside(room["polygon"], ex, ey):
                    continue
                eye = to_blender(ex, ey, origin, 1.35)
                free, floor_gap = clearance(eye, bpy.context.evaluated_depsgraph_get())
                if free < 0.4 or abs(floor_gap - 1.35) > 0.05:  # dentro o pegado a un mueble, o algo bajo los pies
                    continue
                opposite = to_blender(c["x"] - .6 * (v["x"] - c["x"]), c["y"] - .6 * (v["y"] - c["y"]), origin, 1.35)
                center = to_blender(c["x"], c["y"], origin, 1.35)
                targets = [opposite, center]
                if hero:
                    middle = (hero[2][0] + hero[2][-1]) / 2
                    targets.extend((middle, center.lerp(middle, .65)))
                cam.location = eye
                for target in targets:
                    direction = target - eye
                    direction.z = 0
                    if direction.length < .1:
                        continue
                    cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
                    for lens in dict.fromkeys((nominal_lens, 16, 14, 13)):
                        cam_data.lens = lens
                        for shift in shifts:
                            cam_data.shift_y = shift
                            bpy.context.view_layer.update()
                            pres, near, fg, cutf = presence(cam, room, origin, bpy.context.evaluated_depsgraph_get(), n=12, hero_id=hero[1] if hero else None)
                            hf = hero_in_frame(cam, hero, margin=.035)
                            quality = pres * (1 - near)**2 * (1 - fg)**2 * (1 - cutf)**3 * (lens / nominal_lens)**.3
                            score = hf + .35 * quality
                            if best is None or score > best[0]:
                                best = (score, eye.copy(), cam.rotation_euler.copy(), (round(ex), round(ey)), lens, shift)
            if best is None:
                fail("NO_INTERIOR_VIEW", "No hay una posición de cámara válida dentro de " + labels.get(view, view))
            cam.location, cam.rotation_euler = best[1], best[2]
            cam_data.lens, cam_data.shift_y = best[4], best[5]
            bpy.context.view_layer.update()
            pres, near, fg, cutf = presence(cam, room, origin, bpy.context.evaluated_depsgraph_get(), hero_id=hero[1] if hero else None)
            info.update({"camera": f"perspective {cam_data.lens} mm, eye 1.35 m at plan {best[3]}", "targetRoomPresence": round(pres, 3), "nearSurfaceFraction": round(near, 3),
                         "foregroundFurnitureFraction": round(fg, 3), "bottomCutFurnitureFraction": round(cutf, 3),
                         "heroInFrame": hero_in_frame(cam, hero), "heroWithMargin": hero_in_frame(cam, hero, margin=.035),
                         "heroObject": hero[1] if hero else None, "score": round(best[0], 3), "twoPoint": True})
        bpy.context.view_layer.update()
        if not reused:
            info.update(render_to(view)); rows.append(info); write_report("partial")
    # Publica la primera revisión completa sin sustituir una edición de la persona ni la salida de otro proceso.
    review = out / "review.blend"
    if not review.exists():
        import tempfile
        with tempfile.TemporaryDirectory(dir=out, prefix="_review.part.") as scratch:
            tmpb = Path(scratch) / "review.blend"
            bpy.ops.wm.save_as_mainfile(filepath=str(tmpb), copy=True)
            if not review.exists():
                os.replace(tmpb, review)
    for name in ("manifest.json", "referencia-rubik.png", "rubik-estancias.json"):
        if (cap / name).exists() and not (out / name).exists():
            (out / name).write_bytes((cap / name).read_bytes())
    report = write_report("complete")
    report["totalSeconds"] = round(time.monotonic() - t_start, 1)
    print(json.dumps({"status": "complete", "phase": phase, "views": [(r["view"], r["seconds"], r.get("targetRoomPresence"), r.get("heroInFrame")) for r in rows]}, ensure_ascii=False))

if __name__ == "__main__":
    main()
