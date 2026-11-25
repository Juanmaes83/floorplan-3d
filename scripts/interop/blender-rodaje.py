# SPDX-License-Identifier: GPL-3.0-or-later
# Copyright (C) 2026 Juan Manuel Espinosa Galant · Rubik Sota
# Script del kit «Escena para Blender» de RUBIK SOTA (API bpy de Blender, GPL-2.0-or-later). GNU GPL v3 o posterior; ver
# LICENCIA-SCRIPTS.txt. Sin garantía. No se extiende a la aplicación web de RUBIK ni a los proyectos o renders de la persona.
"""§4 · Rodaje local: fragmento de vídeo con Cycles a partir de una escena YA preparada (rubik_blender_prepare.py).

python blender-rodaje.py -- PREP-DIR PACKAGE-DIR OUT-DIR --profile revision|entrega1440|entrega4k [--realismo on|off] [--tex DIR] --shot aereo|interior
    [--room ROOM_ID] [--light dia|tarde] [--seconds 2] [--fps 24] [--res WxH] [--samples N] [--frames a-b] [--still]

- Reutiliza la escena, la cámara del visor y las estancias del paquete; NO toca geometría ni materiales importados. Lo
  añadido (cámara animada, focos, cielo de tarde) vive en RUBIK_derived y se declara en rodaje-report.json.
- Estabilidad temporal: semilla FIJA (sin semilla animada), desenfocado de movimiento apagado y desruido OIDN con
  albedo+normal; se mide la variación de luminancia entre fotogramas consecutivos.
- Reanudable: cada fotograma se escribe de forma atómica; volver a lanzar la misma orden sigue por el primero que falte.
- Perfiles: revision (1280×720, rápido), entrega1440 (2560×1440 nativo, entrega recomendada) y entrega4k (3840×2160 UHD
  nativo, opcional). Resolución y muestras configurables.
- Realismo (--realismo on, por defecto): materiales PBR CC0 de Poly Haven listados en rodaje-recursos.json (huella SHA-256,
  autor, licencia) a ESCALA REAL (dimensiones del autor), con el color medio ajustado al color del material DEL PROYECTO;
  relieve de enlucido en muros sin cambiar su color; vidrio físico; cielo HDRI orientado al sol capturado. Si falta un
  recurso, se conserva el color plano y se declara la sustitución. --realismo off = escena «antes» (misma cámara y luz).
"""
import hashlib, importlib.util, json, math, os, platform, sys, time
from pathlib import Path
import bpy
from mathutils import Vector

HERE = Path(__file__).resolve()
_spec = importlib.util.spec_from_file_location("rubik_render", next(p for p in (HERE.with_name("blender-scene-render.py"), HERE.with_name("rubik_blender_render.py")) if p.exists()))
R = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(R)
PROFILES = {"revision": {"res": "1280x720", "samples": 16}, "entrega1440": {"res": "2560x1440", "samples": 32}, "entrega4k": {"res": "3840x2160", "samples": 24}}

def arg(n, d=None):
    a = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    return a[a.index(n) + 1] if n in a and a.index(n) + 1 < len(a) else d

def flag(n):
    return n in (sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])

def cpu_model():
    try:
        return next(l.split(":", 1)[1].strip() for l in open("/proc/cpuinfo") if l.startswith("model name"))
    except Exception:
        return platform.processor() or "unknown"

def ram_gb():
    try:
        return round(int(next(l.split()[1] for l in open("/proc/meminfo") if l.startswith("MemTotal"))) / 1048576, 1)
    except Exception:
        return None

COLOR_USE = {"#d8b88a": "mat_wood", "#9b7250": "mat_walnut", "#ebe6dc": "mat_tile800", "#dfe3e1": "mat_tile600", "#f1eee8": "mat_marble", "#d3d8d4": "mat_antislip"}

def _srgb_to_lin(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def _hex_lin(h):
    h = h.lstrip("#"); return [_srgb_to_lin(int(h[i:i + 2], 16) / 255) for i in (0, 2, 4)]

ORIGIN = [None]
UPHOLSTERED = {"sofa", "armchair", "baycushion", "bed", "chair"}
WOODEN = {"table", "coffeetable", "tvstand", "cabinet", "desk", "bookshelf", "nightstand", "wardrobe", "roundtable", "shoecab", "vanity"}

def _lum(h):
    r, g, b = _hex_lin(h); return .2126 * r + .7152 * g + .0722 * b

def _proc(name, colour, rough, metallic=0.0, coat=0.0, translucency=0.0, bump=0.0, bump_scale=200.0, variation=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True; N = m.node_tree.nodes; Lk = m.node_tree.links
    b = next(n for n in N if n.type == "BSDF_PRINCIPLED"); base = (*_hex_lin(colour), 1)
    b.inputs["Base Color"].default_value = base; b.inputs["Roughness"].default_value = rough; b.inputs["Metallic"].default_value = metallic
    b.inputs["Coat Weight"].default_value = coat
    if translucency:  # hojas y pétalos: transmisión difusa (contraluz) mezclada con el BSDF
        out = next(n for n in N if n.type == "OUTPUT_MATERIAL"); tr = N.new("ShaderNodeBsdfTranslucent"); tr.inputs["Color"].default_value = base
        mx = N.new("ShaderNodeMixShader"); mx.inputs["Fac"].default_value = translucency
        Lk.new(b.outputs["BSDF"], mx.inputs[1]); Lk.new(tr.outputs["BSDF"], mx.inputs[2]); Lk.new(mx.outputs["Shader"], out.inputs["Surface"])
    if variation:  # variación sutil de tono/valor por pieza (cada hoja distinta), sin cambiar el color medio
        oi = N.new("ShaderNodeObjectInfo"); hsv = N.new("ShaderNodeHueSaturation"); hsv.inputs["Color"].default_value = base
        mr = N.new("ShaderNodeMapRange"); mr.inputs["To Min"].default_value = 1 - variation; mr.inputs["To Max"].default_value = 1 + variation
        Lk.new(oi.outputs["Random"], mr.inputs["Value"]); Lk.new(mr.outputs["Result"], hsv.inputs["Value"])
        h2 = N.new("ShaderNodeMapRange"); h2.inputs["To Min"].default_value = .5 - variation / 4; h2.inputs["To Max"].default_value = .5 + variation / 4
        Lk.new(oi.outputs["Random"], h2.inputs["Value"]); Lk.new(h2.outputs["Result"], hsv.inputs["Hue"]); Lk.new(hsv.outputs["Color"], b.inputs["Base Color"])
    if bump:
        tc = N.new("ShaderNodeTexCoord"); nz = N.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = bump_scale; nz.inputs["Detail"].default_value = 6
        bp = N.new("ShaderNodeBump"); bp.inputs["Strength"].default_value = bump; bp.inputs["Distance"].default_value = .002
        Lk.new(tc.outputs["Object"], nz.inputs["Vector"]); Lk.new(nz.outputs["Fac"], bp.inputs["Height"]); Lk.new(bp.outputs["Normal"], b.inputs["Normal"])
    return m

def acabados(project, by_use, ok, img, mean_lin, pbr):
    """Acabado por TIPO de objeto del proyecto (rubik-estancias.json 1.1.0 o project.json) y por pieza (color, polígonos,
    tamaño). El proyecto da tipo y color, no el material: TODO acabado de mobiliario es una APROXIMACIÓN VISUAL y se
    registra. No se cambia geometría, posición, dimensión ni color medio de ninguna pieza."""
    from mathutils import Vector
    types = {o["id"]: o.get("type") for o in project.get("objects", []) if isinstance(o, dict) and o.get("id")}
    if not types:
        return ["mobiliario: el paquete no trae tipos de objeto (rubik-estancias.json < 1.1.0): se conservan los colores planos"]
    rooms = project["rooms"]; origin = ORIGIN[0]
    outdoor = [r for r in rooms if any(k in r["id"].lower() for k in ("balcony", "terrace", "terraza", "patio", "garden"))]
    def is_outdoor(o):
        c = o.matrix_world.translation; x, y = c.x * 1000 + origin["x"], -c.y * 1000 + origin["y"]
        return any(R.inside(r["polygon"], x, y) for r in outdoor)
    cache = {}; log = {}
    def get(kind, colour, make):
        k = (kind, colour)
        if k not in cache:
            cache[k] = make()
        return cache[k]
    fabric, rug, wl, wd = (by_use.get(u) for u in ("fabric", "rug", "wood-light", "wood-dark"))
    soft = {"tejido": dict(sheen=.6, ao=.5), "alfombra": dict(sheen=.4, ao=.6), "tejido-exterior": dict(sheen=.2, ao=.5)}
    def tex_or(kind, a, colour, scale, normal, rough_mul, fallback):
        return get(kind, colour, lambda: pbr(f"rubik:rodaje-{kind}:{colour}", a, colour, "Object", scale, normal=normal, rough_mul=rough_mul, **soft.get(kind, {})) if ok(a) else fallback())
    for o in bpy.data.objects:
        if o.type != "MESH" or o.get("rubik_role") != "object" or not o.data.materials:
            continue
        src = o.data.materials[0]; t = types.get(o.get("rubik_id")); col = (src.get("rubik_color") or "#808080").lower()
        if src.name.startswith("rubik:glass") or src.get("rubik_viewer_type") == "MeshPhysicalMaterial":
            continue
        n = len(o.data.polygons); bb = [o.matrix_world @ Vector(c) for c in o.bound_box]
        dims = sorted((max(p[i] for p in bb) - min(p[i] for p in bb)) for i in range(3)); lum = _lum(col)
        r, g, b = _hex_lin(col); green = g > r * 1.15 and g > b * 1.15
        if t == "plant" or (green and n in (12, 24, 320)):
            if n == 320 or (green and n == 12):
                kind, m = "hoja", get("hoja", col, lambda: _proc("rubik:rodaje-hoja:" + col, col, .4, translucency=.45, bump=.3, bump_scale=35, variation=.28, coat=.25))
            elif n == 24 or (t == "plant" and dims[0] < .06 and dims[2] > .2):
                kind, m = "tallo", get("tallo", col, lambda: _proc("rubik:rodaje-tallo:" + col, col, .6, variation=.08))
            elif lum < .06:
                kind, m = "sustrato", get("sustrato", col, lambda: _proc("rubik:rodaje-sustrato:" + col, col, .95, bump=.4, bump_scale=400))
            else:
                kind, m = "maceta-ceramica", get("maceta", col, lambda: _proc("rubik:rodaje-maceta:" + col, col, .5, coat=.1, bump=.05, bump_scale=30))
        elif n == 168:
            kind, m = "flor", get("flor", col, lambda: _proc("rubik:rodaje-flor:" + col, col, .5, translucency=.3, variation=.1))
        elif t == "rug":
            kind, m = "alfombra-tejida", tex_or("alfombra", rug, col, (rug or {}).get("dimensionsMm", [270])[0] / 1000, 1.6, 1.0, lambda: _proc("rubik:rodaje-alfombra:" + col, col, .95, bump=.5, bump_scale=900))
        elif t == "armchair" and is_outdoor(o) and lum < .12:
            # sillón exterior: la ESTRUCTURA (patas) es metal lacado; la tapicería, tejido de exterior (más mate)
            kind, m = "exterior-estructura-metal-lacado", get("metal-ext", col, lambda: _proc("rubik:rodaje-metal-exterior:" + col, col, .35, metallic=.6, coat=.3))
        elif t == "armchair" and is_outdoor(o) and n >= 500:
            kind, m = "exterior-tapiceria-lona", tex_or("tejido-exterior", fabric, col, (fabric or {}).get("dimensionsMm", [270])[0] / 1000, 1.2, 1.15, lambda: _proc("rubik:rodaje-lona:" + col, col, .95))
        elif t in UPHOLSTERED and n >= 500 and lum > .08:
            kind, m = "tapiceria-tejido", tex_or("tejido", fabric, col, (fabric or {}).get("dimensionsMm", [270])[0] / 1000, 1.4, 1.05, lambda: _proc("rubik:rodaje-tejido:" + col, col, .9, bump=.3, bump_scale=800))
        elif lum < .02 and n <= 12 and dims[1] > .5:
            kind, m = "pantalla-vidrio-negro", get("pantalla", col, lambda: _proc("rubik:rodaje-pantalla:" + col, col, .05, coat=1.0))
        elif lum < .02:
            kind, m = "plastico-satinado", get("plastico", col, lambda: _proc("rubik:rodaje-plastico:" + col, col, .4))
        elif n in (120, 192, 320, 504) and lum > .55 and dims[2] < .4:
            kind, m = "ceramica-esmaltada", get("ceramica", col, lambda: _proc("rubik:rodaje-ceramica:" + col, col, .12, coat=.6))
        elif n == 12 and dims[0] < .05 and dims[2] < .5 and t in WOODEN | {"coffeetable"}:
            kind, m = "papel-carton", get("papel", col, lambda: _proc("rubik:rodaje-papel:" + col, col, .85, bump=.05, bump_scale=300))
        elif lum < .12 and not green:
            kind, m = "madera-oscura", tex_or("madera-oscura", wd, col, 1.0, .5, .8, lambda: _proc("rubik:rodaje-madera-oscura:" + col, col, .45))
        elif t in WOODEN:
            kind, m = "madera-clara-barnizada", tex_or("madera-clara", wl, col, 1.0, .4, .7, lambda: _proc("rubik:rodaje-madera-clara:" + col, col, .4))
        else:
            continue
        o.data.materials[0] = m; key = f"{t or 'sin-tipo'} → {kind}"; log[key] = log.get(key, 0) + 1
    return ["mobiliario (APROXIMACIÓN VISUAL por tipo y pieza; el proyecto no identifica el material): " + json.dumps(dict(sorted(log.items())), ensure_ascii=False)]

def realismo(project, labels, light, sun, tex):
    import numpy as np
    out = []; man_p = tex / "rodaje-recursos.json"
    if not man_p.exists():
        return ["realismo: no hay rodaje-recursos.json en " + str(tex) + "; se conservan los colores planos (sustitución declarada)"]
    man = json.loads(man_p.read_text()); by_use = {a["use"]: a for a in man["assets"]}
    def ok(a):
        return a and all((tex / f["file"]).exists() and hashlib.sha256((tex / f["file"]).read_bytes()).hexdigest() == f["sha256"] for f in a["files"].values())
    def img(a, k, colour):
        im = bpy.data.images.load(str(tex / a["files"][k]["file"]), check_existing=True)
        im.colorspace_settings.name = "sRGB" if colour else "Non-Color"; return im
    def mean_lin(im):
        px = np.empty(len(im.pixels), dtype=np.float32); im.pixels.foreach_get(px); px = px.reshape(-1, 4)[::7, :3]
        lin = np.where(px <= .04045, px / 12.92, ((px + .055) / 1.055) ** 2.4)  # imágenes de 8 bits: valores sRGB codificados
        return lin.mean(axis=0)
    def pbr(name, a, tint_hex, coord, scale_m, normal=0.6, rough_mul=1.0, albedo=True, sheen=0.0, ao=0.0, flatten=0.0):
        m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; N = nt.nodes; Lk = nt.links
        b = next(n for n in N if n.type == "BSDF_PRINCIPLED")
        tc = N.new("ShaderNodeTexCoord"); mp = N.new("ShaderNodeMapping"); mp.inputs["Scale"].default_value = (1 / scale_m, 1 / scale_m, 1 / scale_m)
        Lk.new(tc.outputs[coord], mp.inputs["Vector"])
        def tnode(k, colour):
            t = N.new("ShaderNodeTexImage"); t.image = img(a, k, colour); t.projection = "BOX"; t.projection_blend = .25; Lk.new(mp.outputs["Vector"], t.inputs["Vector"]); return t
        d = tnode("diff", True); r = tnode("rough", False); n = tnode("nor", False)
        mix = N.new("ShaderNodeMix"); mix.data_type = "RGBA"; mix.blend_type = "MULTIPLY"; mix.inputs["Factor"].default_value = 1
        target = _hex_lin(tint_hex); mean = mean_lin(d.image); f = [min(4.0, t / max(1e-4, float(mv))) for t, mv in zip(target, mean)]
        mix.inputs["B"].default_value = (*f, 1); Lk.new(d.outputs["Color"], mix.inputs["A"])
        col_out = mix.outputs["Result"]
        if flatten:  # reduce el contraste de la textura hacia el color del proyecto (porcelánico liso)
            fl = N.new("ShaderNodeMix"); fl.data_type = "RGBA"; fl.inputs["Factor"].default_value = flatten; fl.inputs["B"].default_value = (*target, 1)
            Lk.new(col_out, fl.inputs["A"]); col_out = fl.outputs["Result"]
        if ao:  # oscurecimiento de contacto en pliegues y uniones (cojín-asiento, borde de alfombra)
            aon = N.new("ShaderNodeAmbientOcclusion"); aon.inputs["Distance"].default_value = .06; am = N.new("ShaderNodeMix"); am.data_type = "RGBA"; am.blend_type = "MULTIPLY"
            am.inputs["Factor"].default_value = ao; Lk.new(col_out, am.inputs["A"]); Lk.new(aon.outputs["AO"], am.inputs["B"]); col_out = am.outputs["Result"]
        if sheen:
            b.inputs["Sheen Weight"].default_value = sheen; b.inputs["Sheen Roughness"].default_value = .4
        if albedo:
            Lk.new(col_out, b.inputs["Base Color"])
        else:  # muros: color plano DEL PROYECTO; del recurso solo relieve y rugosidad
            b.inputs["Base Color"].default_value = (*target, 1)
        rm = N.new("ShaderNodeMath"); rm.operation = "MULTIPLY"; rm.inputs[1].default_value = rough_mul; Lk.new(r.outputs["Color"], rm.inputs[0]); Lk.new(rm.outputs[0], b.inputs["Roughness"])
        nm = N.new("ShaderNodeNormalMap"); nm.inputs["Strength"].default_value = normal; Lk.new(n.outputs["Color"], nm.inputs["Color"]); Lk.new(nm.outputs["Normal"], b.inputs["Normal"])
        return m
    mats = {m["id"]: m for m in project.get("materials", [])}; rooms = {r["id"]: r for r in project["rooms"]}; cache = {}; floors = []; subst = []
    for o in bpy.data.objects:
        if o.type != "MESH" or o.get("rubik_role") not in ("room", "room-slab"):
            continue
        rid = str(o.get("rubik_id", "")).split(":")[-1]; r = rooms.get(rid) or {}
        # El ZIP trae el color del suelo (floorColor), no el id del material: correspondencia EXACTA con el color de los
        # materiales de suelo de RUBIK (COLOR_USE); con project.json (laboratorio) se usa floorMaterialId.
        mid = r.get("floorMaterialId"); pm = mats.get(mid)
        if mid not in by_use:  # ZIP: «floor:<estancia>» con su color → material de suelo de RUBIK por color exacto
            mid = COLOR_USE.get(str(((pm or {}).get("appearance") or {}).get("color", "")).lower(), mid)
        a = by_use.get(mid)
        if not pm or not ok(a):
            subst.append({"estancia": labels.get(rid, rid), "material": mid, "motivo": "sin recurso verificado: color plano"}); continue
        key = mid
        if key not in cache:
            smooth = mid in ("mat_tile800", "mat_tile600", "mat_marble")  # porcelánico y mármol pulidos: reflejo y menos contraste
            cache[key] = pbr("rubik:rodaje-suelo:" + mid, a, (pm.get("appearance") or {}).get("color", "#cccccc"), "Object", a["dimensionsMm"][0] / 1000, rough_mul=.45 if smooth else 1.0, flatten=.55 if smooth else 0.0)
        o.data.materials[0] = cache[key]; floors.append({"estancia": labels.get(rid, rid), "materialProyecto": mid, "recurso": a["id"], "escalaM": a["dimensionsMm"][0] / 1000})
    out.append(f"suelos: {len(floors)} estancias con PBR CC0 a escala real y color medio = color del material del proyecto; sustituciones: " + json.dumps(floors, ensure_ascii=False))
    if subst:
        out.append("suelos sin recurso (color plano conservado): " + json.dumps(subst, ensure_ascii=False))
    wa = by_use.get("walls"); nw = 0
    if ok(wa):
        wcache = {}
        for o in bpy.data.objects:
            if o.type != "MESH" or o.get("rubik_role") != "wall" or not o.data.materials:
                continue
            src = o.data.materials[0]; col = src.get("rubik_color") or "#f2efe9"
            if col not in wcache:
                wcache[col] = pbr("rubik:rodaje-muro:" + col, wa, col, "Object", wa["dimensionsMm"][0] / 1000, normal=.15, rough_mul=1.0, albedo=False)
            o.data.materials[0] = wcache[col]; nw += 1
        out.append(f"muros: solo relieve y rugosidad (color plano del proyecto) de «{wa['id']}» (CC0) en {nw} piezas; el color es el del proyecto (sin cambio de tono)")
    ng = 0
    for m in bpy.data.materials:
        if m.get("rubik_viewer_type") == "MeshPhysicalMaterial" and m.use_nodes:
            b = next((n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None)
            if b and b.inputs["Transmission Weight"].default_value > .5:
                b.inputs["Roughness"].default_value = .02; b.inputs["IOR"].default_value = 1.5; ng += 1
    out.append(f"vidrio físico: {ng} materiales (rugosidad 0,02, IOR 1,5)")
    out.extend(acabados(project, by_use, ok, img, mean_lin, pbr))
    sky = by_use.get("sky-day")
    if light == "dia" and ok(sky):
        w = bpy.data.worlds.new("RUBIK_world_hdri"); w.use_nodes = True; N = w.node_tree.nodes; Lk = w.node_tree.links
        env = N.new("ShaderNodeTexEnvironment"); env.image = img(sky, "hdri", False); env.image.colorspace_settings.name = "Linear Rec.709"
        tc = N.new("ShaderNodeTexCoord"); mp = N.new("ShaderNodeMapping"); Lk.new(tc.outputs["Generated"], mp.inputs["Vector"]); Lk.new(mp.outputs["Vector"], env.inputs["Vector"])
        if sun:
            mp.inputs["Rotation"].default_value = (0, 0, sun.rotation_euler.z)
        bg = N["Background"]; bg.inputs["Strength"].default_value = .6; Lk.new(env.outputs["Color"], bg.inputs["Color"]); bpy.context.scene.world = w
        out.append(f"cielo: HDRI CC0 «{sky['id']}» 0,6, girado al azimut del sol capturado; el sol del visor se conserva")
    return out

def main():
    pos = [a for a in sys.argv[sys.argv.index("--") + 1:] if not a.startswith("--")]
    # posicionales = los tres primeros que no son valor de una opción
    a = sys.argv[sys.argv.index("--") + 1:]; pos = []; i = 0
    while i < len(a):
        if a[i].startswith("--"):
            i += 1 if a[i] in ("--still",) else 2; continue
        pos.append(a[i]); i += 1
    prep, pkg, out = (Path(p).resolve() for p in pos[:3])
    pname = arg("--profile", "revision"); prof = PROFILES[pname]
    res = [int(v) for v in arg("--res", prof["res"]).split("x")]; samples = int(arg("--samples", prof["samples"]))
    shot = arg("--shot", "aereo"); light = arg("--light", "dia"); fps = int(arg("--fps", "24")); secs = float(arg("--seconds", "2"))
    nframes = max(1, int(round(fps * secs)))
    fr = arg("--frames"); f0, f1 = (int(x) for x in fr.split("-")) if fr else (0, nframes - 1)
    manifest = json.loads((pkg / "manifest.json").read_bytes())
    project, labels = R.load_rooms(pkg, manifest)
    origin = manifest["scene"]["frame"]["originPlanMm"]; ORIGIN[0] = origin
    bpy.ops.wm.open_mainfile(filepath=str(prep / "scene.blend"))
    sc = bpy.context.scene
    derived = bpy.data.collections.new("RUBIK_derived"); sc.collection.children.link(derived); declared = []
    # Motor y color
    sc.render.engine = "CYCLES"; sc.cycles.device = "CPU"; sc.cycles.samples = samples
    sc.cycles.use_adaptive_sampling = True; sc.cycles.adaptive_threshold = 0.02
    sc.cycles.use_denoising = True; sc.cycles.denoiser = "OPENIMAGEDENOISE"; sc.cycles.denoising_input_passes = "RGB_ALBEDO_NORMAL"
    sc.cycles.seed = 1729; sc.cycles.use_animated_seed = False; sc.render.use_motion_blur = False
    sc.cycles.max_bounces = 6; sc.cycles.diffuse_bounces = 3; sc.cycles.glossy_bounces = 3; sc.cycles.transparent_max_bounces = 8
    sc.cycles.sample_clamp_indirect = 8.0
    sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = res[0], res[1], 100
    sc.render.image_settings.file_format = "PNG"; sc.render.image_settings.color_depth = "8"
    sc.view_settings.view_transform = "AgX"; sc.view_settings.look = "AgX - Medium High Contrast"
    declared.append(f"Cycles CPU, {samples} muestras adaptativas (umbral 0,02), OIDN albedo+normal, semilla fija 1729, sin desenfoque de movimiento")
    ceilings = bpy.data.collections.get("Rubik_ceiling"); fixtures = bpy.data.collections.get("Rubik_fixture")
    h = (project.get("defaults") or {}).get("wallHeightMm", 2800) / 1000
    # Iluminación: sol/cielo capturados del visor (día) o cielo de tarde derivado + focos interiores
    sun = next((o for o in bpy.data.objects if o.type == "LIGHT" and o.data.type == "SUN"), None)
    if light == "tarde":
        w = bpy.data.worlds.new("RUBIK_world_tarde"); w.use_nodes = True; sc.world = w
        bg = w.node_tree.nodes["Background"]; bg.inputs["Color"].default_value = (0.30, 0.36, 0.52, 1); bg.inputs["Strength"].default_value = 0.35
        if sun:
            sun.data.energy = 1.2; sun.data.color = (1.0, 0.62, 0.38); sun.rotation_euler = (math.radians(80), 0, math.radians(250))
        declared.append("tarde: cielo azulado 0,35 y sol rasante cálido 1,2 a 80°/250° (derivados)")
    else:
        declared.append("día: sol y cielo capturados del visor (sin cambios)")
    nf = 0
    for r in project["rooms"]:
        if not r.get("counted", True):
            continue
        c = R.centroid(r["polygon"]); xs = [p["x"] for p in r["polygon"]]; ys = [p["y"] for p in r["polygon"]]
        wd, dp = (max(xs) - min(xs)) / 1000, (max(ys) - min(ys)) / 1000
        L = bpy.data.lights.new("RUBIK_ambiente_" + r["id"], "AREA"); L.shape = "RECTANGLE"; L.size, L.size_y = max(.3, wd * .5), max(.3, dp * .5)
        L.energy = (14.0 if light == "dia" else 35.0) * max(1.0, wd * dp) ** .5; L.color = (1.0, 0.86, 0.70) if light == "tarde" else (1.0, 0.96, 0.9)
        o = bpy.data.objects.new(L.name, L); o.location = R.to_blender(c["x"], c["y"], origin, h - .03); derived.objects.link(o)
        # focos: dos puntos empotrados por estancia ≥ 6 m², haz de 70°, luz cálida (derivados, no son aparatos del proyecto)
        if wd * dp >= 6:
            for k, t in enumerate((.3, .7)):
                S = bpy.data.lights.new(f"RUBIK_foco_{r['id']}_{k}", "SPOT"); S.energy = 60.0 if light == "tarde" else 25.0
                S.spot_size = math.radians(70); S.spot_blend = .6; S.shadow_soft_size = .05; S.color = (1.0, 0.84, 0.66)
                so = bpy.data.objects.new(S.name, S); so.location = R.to_blender(min(xs) + t * (max(xs) - min(xs)), c["y"], origin, h - .05)
                so.rotation_euler = (0, 0, 0); derived.objects.link(so); nf += 1
    declared.append(f"ambiente: un área por estancia contada; focos: {nf} puntos empotrados de 70° (derivados)")
    if arg("--realismo", "on") == "on":
        declared.extend(realismo(project, labels, light, sun, Path(arg("--tex", str(HERE.with_name("rodaje-texturas")))).resolve()))
    else:
        declared.append("realismo desactivado: materiales de color plano del visor (escena «antes»)")
    # Cámara animada
    cd = bpy.data.cameras.new("RUBIK_cam_rodaje"); cam = bpy.data.objects.new("RUBIK_cam_rodaje", cd); derived.objects.link(cam); sc.camera = cam
    cd.sensor_width = 36; sc.frame_start, sc.frame_end = 0, nframes - 1; sc.render.fps = fps
    if shot == "aereo":
        if ceilings: ceilings.hide_render = True
        if fixtures: fixtures.hide_render = True
        pts = [o.matrix_world @ Vector(c) for o in bpy.data.objects if o.type == "MESH" and o.get("rubik_role") != "ceiling" for c in o.bound_box]
        lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts))); hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
        ctr = (lo + hi) / 2; diag = (hi - lo).length; cd.lens = 28; cd.clip_end = diag * 8
        def pose(t):
            az = math.radians(-50 + 30 * t); el = math.radians(42 - 6 * t); dist = diag * (1.25 - .12 * t)
            return ctr + Vector((math.cos(el) * math.sin(az), -math.cos(el) * math.cos(az), math.sin(el))) * dist, ctr
        declared.append("plano aéreo: arco de 30° y acercamiento del 10 % sobre la vivienda; techos ocultos en este plano (declarado)")
    else:
        if ceilings: ceilings.hide_render = False
        if fixtures: fixtures.hide_render = False
        rid = arg("--room") or R.auto_rooms(project, 1)[0]
        room = next(r for r in project["rooms"] if r["id"] == rid); poly = room["polygon"]; c = R.centroid(poly)
        cd.lens = 18
        far = max(poly, key=lambda p: (p["x"] - c["x"]) ** 2 + (p["y"] - c["y"]) ** 2)
        a0 = R.to_blender(c["x"] + .55 * (far["x"] - c["x"]), c["y"] + .55 * (far["y"] - c["y"]), origin, 1.35)
        a1 = R.to_blender(c["x"] + .25 * (far["x"] - c["x"]), c["y"] + .25 * (far["y"] - c["y"]), origin, 1.35)
        tgt = R.to_blender(c["x"] - .8 * (far["x"] - c["x"]), c["y"] - .8 * (far["y"] - c["y"]), origin, 1.2)
        def pose(t):
            return a0.lerp(a1, t), tgt
        free, _ = R.clearance(a0, bpy.context.evaluated_depsgraph_get())
        declared.append(f"plano interior: travelling de {round((a1 - a0).length, 2)} m hacia el centro de «{labels.get(rid, rid)}» a 1,35 m; holgura inicial {round(free, 2)} m")
    for f in range(nframes):
        t = f / max(1, nframes - 1); t = t * t * (3 - 2 * t)  # suavizado
        loc, look = pose(t); cam.location = loc; cam.rotation_euler = (look - loc).to_track_quat("-Z", "Y").to_euler()
        cam.keyframe_insert("location", frame=f); cam.keyframe_insert("rotation_euler", frame=f)
    out.mkdir(parents=True, exist_ok=True); fdir = out / "frames"; fdir.mkdir(exist_ok=True)
    rep_path = out / "rodaje-report.json"
    rep = json.loads(rep_path.read_text()) if rep_path.exists() else {"frames": {}}
    rep.update({"format": "rubik-sota.blender-rodaje", "version": "1.0.0", "profile": pname, "resolution": res, "samples": samples,
                "shot": shot, "light": light, "fps": fps, "frameCount": nframes, "declared": declared,
                "equipment": {"device": "CPU", "cpu": cpu_model(), "logicalCpus": os.cpu_count(), "ramGb": ram_gb(), "gpu": None,
                              "blender": bpy.app.version_string, "cycles": bpy.app.version_string, "os": platform.platform()},
                "package": {"manifestSha256": hashlib.sha256((pkg / "manifest.json").read_bytes()).hexdigest()},
                "script": {"sha256": hashlib.sha256(HERE.read_bytes()).hexdigest()}})
    for f in range(f0, f1 + 1):
        p = fdir / f"f{f:04d}.png"
        if p.exists() and str(f) in rep["frames"]:
            continue
        sc.frame_set(f); tmp = fdir / f"_f{f:04d}.part.png"; sc.render.filepath = str(tmp)
        t0 = time.monotonic(); bpy.ops.render.render(write_still=True); dt = round(time.monotonic() - t0, 1)
        os.replace(tmp, p)
        rep["frames"][str(f)] = {"seconds": dt, "sha256": hashlib.sha256(p.read_bytes()).hexdigest(), "peakRssBytes": R.peak_rss_bytes()}
        rep_path.write_text(json.dumps(rep, ensure_ascii=False, indent=1))
        print(json.dumps({"frame": f, "of": nframes, "seconds": dt}), flush=True)
        if flag("--still"):
            break
    rep_path.write_text(json.dumps(rep, ensure_ascii=False, indent=1))

if __name__ == "__main__":
    main()
