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
import re, hashlib, importlib.util, json, math, os, platform, sys, time
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
BACKFACE = set()  # materiales generados que sustituyen a uno del visor con la cara trasera oculta
UPHOLSTERED = {"sofa", "armchair", "baycushion", "bed", "chair"}
WOODEN = {"table", "dining-table", "bench", "sidetable", "dresser", "coffeetable", "tvstand", "cabinet", "desk", "bookshelf", "nightstand", "wardrobe", "roundtable", "shoecab", "vanity"}
SANITARY = {"toilet", "shower", "bathtub", "basin", "bidet"}
APPLIANCE = {"fridge", "washer", "stove", "oven", "dishwasher", "dryer", "hood"}
KITCHEN = {"counter", "ksink", "island"}

def _hsv(h):
    import colorsys
    h = h.lstrip("#"); return colorsys.rgb_to_hsv(*(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)))

def floor_family(pm, mid, by_use):
    """Recurso de suelo para el material de la estancia, de más a menos fiable, y cómo se decidió (se declara):
    1) el identificador del material del proyecto coincide con uno del manifiesto de recursos («material declarado»);
    2) el color coincide EXACTAMENTE con un material de suelo de RUBIK («material de catálogo por color»);
    3) la familia se deduce del identificador o del preset del material (madera, mármol, baldosa…) («familia del material»);
    4) si nada lo identifica, el tono decide entre madera y baldosa neutra («aproximación por color»)."""
    pm = pm or {}; col = str((pm.get("appearance") or {}).get("color", "")).lower(); src = pm.get("sourceId")
    for k in (mid, src):
        if k in by_use and k.startswith("mat_"):
            return k, "material declarado"
    if col in COLOR_USE:
        return COLOR_USE[col], "material de catálogo por color"
    words = " ".join(str(x or "").lower() for x in (src, pm.get("preset")))
    lum = _lum(col) if col.startswith("#") else .5
    for keys, fam in ((("walnut", "nogal"), "mat_walnut"), (("wood", "oak", "parquet", "plank", "madera", "roble"), "mat_wood"),
                      (("marble", "marmol"), "mat_marble"), (("antislip", "antidesl"), "mat_antislip"),
                      (("tile", "porcel", "ceram", "stone", "slate", "granite", "terrazzo", "piedra", "baldosa"), "mat_tile800")):
        if any(w in words for w in keys):
            if fam == "mat_wood" and lum < .08:
                fam = "mat_walnut"
            return fam, "familia del material"
    if not col.startswith("#"):
        return None, "sin color"
    h, s, v = _hsv(col)
    if s > .22 and .03 < h < .14:  # tonos cálidos saturados (marrones, miel): madera
        return ("mat_walnut" if lum < .08 else "mat_wood"), "aproximación por color"
    return "mat_tile800", "aproximación por color"

MT = {"doc": None, "estado": None, "byTarget": {}, "rows": [], "objetos": {}, "modelosCatalogo": None}
TOKEN_USE = (("material.wood.oak", "mat_wood"), ("material.wood.walnut", "mat_walnut"), ("material.ceramic.porcelain.polished", "mat_tile800"),
             ("material.ceramic.porcelain.matte", "mat_tile600"), ("material.ceramic.porcelain.antislip", "mat_antislip"),
             ("material.stone.marble", "mat_marble"), ("material.stone.terrazzo", "mat_tile800"), ("material.fabric.wool.carpet", "rug"))

def token_use(token):
    """Recurso de suelo para un token (prefijo); terrazo → porcelánico pulido es una APROXIMACIÓN y se declara."""
    for pre, use in TOKEN_USE:
        if token and (token == pre or token.startswith(pre + ".")):
            return use, ("aproximación de recurso: terrazo representado con porcelánico pulido" if pre == "material.stone.terrazzo" else None)
    return None, None

def cargar_materiales(pkg, manifest):
    """rubik-materiales.json (Material Tokens 1.x) si viaja en el ZIP con la huella del manifiesto. ZIP anterior, huella
    distinta o versión desconocida → no se usa y el informe explica hasta dónde llega la preparación (tipo y color)."""
    # Objetos con modelo de catálogo (manifest › fallbacks): los demás son representaciones procedimentales de RUBIK.
    fb = manifest.get("fallbacks") or {}
    MT["modelosCatalogo"] = set(fb.get("catalogModels") or []) if "catalogModels" in fb else None
    p = pkg / "rubik-materiales.json"; exp = (manifest.get("files") or {}).get("rubik-materiales.json")
    if not p.exists() or not exp:
        MT["estado"] = "ZIP sin rubik-materiales.json (anterior a Material Tokens): identidad de materiales no declarada; suelos por material/familia y mobiliario por tipo, pieza y color (aproximación)"; return
    if hashlib.sha256(p.read_bytes()).hexdigest() != exp.get("sha256"):
        MT["estado"] = "rubik-materiales.json con huella distinta a la del manifiesto: se ignora (se aproxima y se declara)"; return
    d = json.loads(p.read_text(encoding="utf8"))
    if d.get("format") != "rubik-sota.material-tokens" or str(d.get("version", "")).split(".")[0] != "1":
        MT["estado"] = f"rubik-materiales.json de formato o versión no soportados ({d.get('format')} {d.get('version')}): se ignora"; return
    MT["doc"] = d; MT["estado"] = f"Material Tokens {d['version']} (taxonomía {d.get('taxonomyVersion')}): {len(d.get('assignments', []))} asignaciones leídas"
    for a in d.get("assignments", []):
        t = a.get("target") or {}
        MT["byTarget"][(t.get("kind"), t.get("id"))] = a.get("requested") or {}

def huella_geometria():
    """Huella por objeto de las posiciones de vértices en coordenadas de mundo (0,01 mm): comprueba que el pase de
    materiales no altera geometría, dimensiones ni posición (salvo las separaciones de contacto declaradas)."""
    out = {}
    for o in bpy.data.objects:
        if o.type == "MESH" and o.get("rubik_role"):
            mw = o.matrix_world; h = hashlib.sha256()
            for v in o.data.vertices:
                w = mw @ v.co; h.update(f"{round(w.x * 1e5)},{round(w.y * 1e5)},{round(w.z * 1e5)};".encode())
            out[o.name] = h.hexdigest()
    return out

def _cuenta(oid, t, kind):
    pz = MT["objetos"].setdefault(oid, {"tipo": t, "piezas": {}})["piezas"]; pz[kind] = pz.get(kind, 0) + 1

def contacto(declared):
    """Separación de contacto (recurso de render, declarado): una pieza de doble cara (el visor la dibuja por ambos lados)
    cuya base coincide con la cara superior de otra que la sostiene comparte plano con ella; en Cycles las dos superficies
    se disputan cada píxel y aparecen manchas (vajilla sobre la mesa). Se eleva esa pieza 0,5 mm. Nada más se mueve.
    Se registra cada pieza movida (soporte, cota, área de contacto) y cada descarte, para acreditar que la regla no toca
    piezas que solo se solapan en planta sin tocarse, ni piezas cerradas (cara trasera oculta), ni planos sin solape."""
    from mathutils import Vector
    boxes = []
    for o in bpy.data.objects:
        if o.type != "MESH" or o.get("rubik_role") not in ("object", "fixture", "room", "room-slab"):
            continue
        bb = [o.matrix_world @ Vector(c) for c in o.bound_box]
        boxes.append((o, [min(p[i] for p in bb) for i in range(3)], [max(p[i] for p in bb) for i in range(3)]))
    tops = {}
    for o, lo, hi in boxes:
        tops.setdefault(round(hi[2] * 5000), []).append((o, lo, hi))  # cubetas de 0,2 mm
    moved, desc = [], {"cerradas_cara_trasera_oculta": 0, "mismo_plano_sin_solape_en_planta": 0, "solape_en_planta_sin_contacto": 0}
    ejemplos = {k: [] for k in desc}
    def ej(k, o, b=None):
        desc[k] += 1
        if len(ejemplos[k]) < 5: ejemplos[k].append({"pieza": o.name, "objeto": o.get("rubik_id"), **({"otro": b.name} if b else {})})
    for o, lo, hi in boxes:
        m = o.data.materials[0] if o.data.materials else None
        if o.get("rubik_role") != "object" or not m:
            continue
        k = round(lo[2] * 5000); cands = tops.get(k, []) + tops.get(k - 1, []) + tops.get(k + 1, [])
        coplanar = [(b, blo, bhi) for b, blo, bhi in cands if b is not o and abs(bhi[2] - lo[2]) <= 2e-4]
        xy = lambda blo, bhi: lo[0] < bhi[0] and hi[0] > blo[0] and lo[1] < bhi[1] and hi[1] > blo[1]
        sup = next(((b, blo, bhi) for b, blo, bhi in coplanar if xy(blo, bhi)), None)
        if m.get("rubik_backface"):
            if sup: ej("cerradas_cara_trasera_oculta", o, sup[0])
            continue
        if not sup:
            if coplanar: ej("mismo_plano_sin_solape_en_planta", o, coplanar[0][0])
            else:  # ¿se solapa en planta con algo SIN tocarlo (atraviesa o flota)? No se mueve.
                over = next((b for b, blo, bhi in boxes if b is not o and xy(blo, bhi) and blo[2] < lo[2] < bhi[2] - 2e-4), None)
                if over: ej("solape_en_planta_sin_contacto", o, over)
            continue
        b, blo, bhi = sup; area = (min(hi[0], bhi[0]) - max(lo[0], blo[0])) * (min(hi[1], bhi[1]) - max(lo[1], blo[1]))
        mw = o.matrix_world.copy(); mw.translation.z += .0005; o.matrix_world = mw
        MT.setdefault("contacto", []).append(o.name)
        moved.append({"pieza": o.name, "objeto": o.get("rubik_id"), "soporte": b.name, "soporteObjeto": b.get("rubik_id"), "cotaM": round(lo[2], 4), "areaContactoCm2": round(area * 1e4, 1)})
    MT["contactoDetalle"] = {"movidas": moved, "descartes": desc, "ejemplosDescarte": ejemplos, "elevacionMm": 0.5, "toleranciaMm": 0.2}
    declared.append(f"separación de contacto: {len(moved)} piezas de doble cara apoyadas en el mismo plano que su soporte, elevadas 0,5 mm; "
                    f"descartes: {json.dumps(desc, ensure_ascii=False)} (detalle en materiales.contacto)")

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

KNOWN_FAMILIES = ("material.wood", "material.ceramic", "material.stone", "material.plaster", "material.fabric", "material.thread", "material.leather",
                  "material.metal", "material.plastic", "material.glass", "material.art", "material.paper", "material.plant")

def known_prefix(token):
    """Token reconocido por familia (las variantes más largas que el kit no conoce se leen por su familia)."""
    return token if isinstance(token, str) and any(token == f or token.startswith(f + ".") for f in KNOWN_FAMILIES) else None

def _velvet(name, colour):
    """Terciopelo: pelo corto con brillo en los bordes (sheen alto y rugosidad alta), sin relieve grande."""
    m = _proc(name, colour, .85, bump=.15, bump_scale=2500); b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    b.inputs["Sheen Weight"].default_value = 1.0; b.inputs["Sheen Roughness"].default_value = .25; return m

def _brushed(name, colour):
    """Acero cepillado: metálico, rugosidad media y anisotropía; el rayado es un ruido estirado en una dirección (≈0,3 mm)."""
    m = _proc(name, colour, .32, metallic=1.0); N = m.node_tree.nodes; Lk = m.node_tree.links; b = next(n for n in N if n.type == "BSDF_PRINCIPLED")
    b.inputs["Anisotropic"].default_value = .6
    tc = N.new("ShaderNodeTexCoord"); mp = N.new("ShaderNodeMapping"); mp.inputs["Scale"].default_value = (3000, 30, 30); nz = N.new("ShaderNodeTexNoise"); nz.inputs["Detail"].default_value = 2
    bp = N.new("ShaderNodeBump"); bp.inputs["Strength"].default_value = .08; bp.inputs["Distance"].default_value = .0003
    Lk.new(tc.outputs["Object"], mp.inputs["Vector"]); Lk.new(mp.outputs["Vector"], nz.inputs["Vector"]); Lk.new(nz.outputs["Fac"], bp.inputs["Height"]); Lk.new(bp.outputs["Normal"], b.inputs["Normal"])
    return m

def inventario(sc, cam, project):
    """Qué aparece en la toma (fotograma 0): primer plano (< 2,5 m), segundo plano o A TRAVÉS DEL VIDRIO (el primer
    impacto hacia su centro es un vidrio). Por objeto: tipo exportado, piezas y acabado aplicado a cada una."""
    from bpy_extras.object_utils import world_to_camera_view
    from mathutils import Vector
    sc.frame_set(0); dg = bpy.context.evaluated_depsgraph_get(); types = {o["id"]: o.get("type") for o in project.get("objects", []) if isinstance(o, dict)}
    groups = {}
    for o in bpy.data.objects:
        if o.type == "MESH" and o.get("rubik_role") in ("object", "room", "wall", "opening"):
            groups.setdefault((o.get("rubik_role"), o.get("rubik_id")), []).append(o)
    rows = []; eye = cam.matrix_world.translation
    for (role, rid), objs in groups.items():
        pts = [o.matrix_world @ Vector(c) for o in objs for c in o.bound_box]; ctr = sum(pts, Vector()) / len(pts)
        # En toma si su caja proyectada se solapa con el encuadre (no solo su centro: una alfombra cuyo centro queda bajo el
        # borde inferior sigue estando a la vista y debe declararse).
        if role in ("wall", "room"):
            continue
        vs = [world_to_camera_view(sc, cam, p) for p in pts]; vs = [q for q in vs if q.z > 0]
        if not vs or max(q.x for q in vs) < 0 or min(q.x for q in vs) > 1 or max(q.y for q in vs) < 0 or min(q.y for q in vs) > 1:
            continue
        d = ctr - eye; hit, _, _, _, ho, _ = sc.ray_cast(dg, eye, d.normalized(), distance=d.length)
        through = bool(hit and ho and ho.data.materials and ho.data.materials[0].get("rubik_viewer_type") == "MeshPhysicalMaterial" and ho.get("rubik_id") != rid)
        plano = "a través del vidrio" if through else ("primer plano" if d.length < 2.5 else "segundo plano")
        def fin_of(o):
            m = o.data.materials[0] if o.data.materials else None
            if m and m.name.startswith("rubik:rodaje"):
                return m.name.split(":")[1]
            return "vidrio físico" if m and m.get("rubik_viewer_type") == "MeshPhysicalMaterial" else "color plano del visor"
        fin = sorted({fin_of(o) for o in objs})
        flat = "color plano del visor" in fin
        estado = ("representación genérica de RUBIK (sin modelo): volumen neutro" if fin == ["rodaje-volumen-generico"] else
                  "sin regla: color plano" if flat and len(fin) == 1 else "aproximación con piezas sin regla" if flat else "aproximación por tipo y pieza")
        rows.append({"id": rid, "rol": role, "tipoExportado": types.get(rid) if role == "object" else role, "piezas": len(objs), "distanciaM": round(d.length, 2), "plano": plano, "acabados": fin,
                     "fuente": "tipo y color (aproximación visual)" if role == "object" else "geometría del hueco", "estado": estado,
                     **({"aviso": "Acabado pendiente de revisión"} if (flat or fin == ["rodaje-volumen-generico"]) and plano == "primer plano" else {})})
    return sorted(rows, key=lambda r: r["distanciaM"])

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
    cache = {}; log = {}; rug_layers = {}
    for o in bpy.data.objects:  # alfombra por capas: la mayor y más baja es la base (canto y remate); la menor, el campo; el resto, cenefas
        if o.type == "MESH" and types.get(o.get("rubik_id")) == "rug":
            bb = [o.matrix_world @ Vector(c) for c in o.bound_box]; a2 = (max(p.x for p in bb) - min(p.x for p in bb)) * (max(p.y for p in bb) - min(p.y for p in bb))
            rug_layers.setdefault(o.get("rubik_id"), []).append((a2, o.name))
    rug_role = {}
    for rid, ls in rug_layers.items():
        ls.sort(reverse=True)
        for i, (_, name) in enumerate(ls):
            rug_role[name] = "campo" if (i == len(ls) - 1) else "canto" if i == 0 else "cenefa"
    def get(kind, colour, make):
        k = (kind, colour)
        if k not in cache:
            cache[k] = make()
        return cache[k]
    fabric, rug, wl, wd = (by_use.get(u) for u in ("fabric", "rug", "wood-light", "wood-dark"))
    soft = {"tejido": dict(sheen=.6, ao=.6, edge=.12), "tejido-exterior": dict(sheen=.2, ao=.5),
            "alfombra-campo": dict(sheen=.7, ao=.5, weave=.22, pile=.35, abrash=.07), "alfombra-cenefa": dict(sheen=.7, ao=.5, weave=.26, pile=.35, abrash=.05),
            "alfombra-canto": dict(sheen=.5, ao=.9, weave=.18, pile=.2, abrash=.04)}
    receta = arg("--recetas", "v3")
    if receta == "v3":  # TAPICERÍA v3 (26/11/2026, tras el rechazo visual del sofá v1): ver pbr() › frame/slub/heather/tone
        soft["tejido"] = dict(sheen=1.0, sheen_rough=.35, ao=.6, edge=.2, frame=True, slub=.13, heather=.11, tone=.03, spec=.25, rough_min=.72, relief=.0022)
        soft["tejido-exterior"] = dict(sheen=.35, sheen_rough=.5, ao=.5, frame=True, slub=.09, heather=.07, tone=.02, spec=.2, rough_min=.8, relief=.0018)
    if receta == "v2":  # v2 (Astra SOLACE: microarrugas + slub) EVALUADA Y DESCARTADA en A/B 1440p: emborrona la trama y mancha; se conserva solo para reproducir la comparativa
        soft["tejido"] = dict(sheen=.6, ao=.6, edge=.12, wrinkle=.18, abrash=.045, abrash_scale=(6.0, 18.0, 6.0))
        soft["tejido-exterior"] = dict(sheen=.25, ao=.5, wrinkle=.12, abrash=.03, abrash_scale=(6.0, 18.0, 6.0))
        soft["alfombra-campo"] = dict(sheen=.75, ao=.6, weave=.22, pile=.35, abrash=.10)
        soft["alfombra-cenefa"] = dict(sheen=.75, ao=.6, weave=.26, pile=.35, abrash=.07)
    def tex_or(kind, a, colour, scale, normal, rough_mul, fallback, rot=(0, 0, 0), extra=None):
        if not ok(a):
            falt = log.setdefault("_sin_recurso", {}); falt[kind] = (a or {}).get("id", "no listado")
        return get((kind, rot, json.dumps(extra or {})), colour, lambda: pbr(f"rubik:rodaje-{kind}:{colour}", a, colour, "Object", scale, normal=normal, rough_mul=rough_mul, rot=rot, **{**soft.get(kind, {}), **(extra or {})}) if ok(a) else fallback())
    def receta_token(token, col):
        """Biblioteca inicial de recetas por token (nivel C). Los valores son PARÁMETROS VISUALES, no datos de fabricante.
        Lino y cuero adaptan las recetas SOLACE de Astra (ver REUTILIZACION-CINCO-REPOS.md); el resto, recetas RUBIK."""
        k = known_prefix(token)
        if not k:
            return None
        fs = (fabric or {}).get("dimensionsMm", [270])[0] / 1000
        R_ = {
            "material.fabric.linen": lambda: tex_or("tejido", fabric, col, fs, 2.6, 1.05, lambda: _proc("rubik:rodaje-lino:" + col, col, .9, bump=.3, bump_scale=800)),
            "material.fabric.cotton": lambda: tex_or("tejido", fabric, col, fs * .6, 1.6, 1.0, lambda: _proc("rubik:rodaje-algodon:" + col, col, .85, bump=.2, bump_scale=1200)),
            "material.fabric.velvet": lambda: get("terciopelo", col, lambda: _velvet("rubik:rodaje-terciopelo:" + col, col)),
            "material.fabric.wool": lambda: tex_or("alfombra-campo", rug, col, (rug or {}).get("dimensionsMm", [270])[0] / 1000, 2.2, 1.0, lambda: _proc("rubik:rodaje-lana:" + col, col, .95, bump=.5, bump_scale=900)),
            "material.leather": lambda: get("cuero", col, lambda: _proc("rubik:rodaje-cuero:" + col, col, .48 if "suede" not in token else .9, bump=.08 if "suede" not in token else .2, bump_scale=8 if "suede" not in token else 600, coat=.15 if "synthetic" in token else 0)),
            "material.wood.walnut": lambda: tex_or("madera-oscura", wd, col, 1.0, .5, .8, lambda: _proc("rubik:rodaje-madera-oscura:" + col, col, .45)),
            "material.wood": lambda: tex_or("madera-clara", wl, col, 1.0, .4, .7, lambda: _proc("rubik:rodaje-madera-clara:" + col, col, .4)),
            "material.metal.stainless": lambda: get("inox", col, lambda: _brushed("rubik:rodaje-inox:" + col, col)),
            "material.metal": lambda: get("aluminio", col, lambda: _proc("rubik:rodaje-aluminio:" + col, col, .35, metallic=.6, coat=.2)),
            "material.plastic": lambda: get("plastico", col, lambda: _proc("rubik:rodaje-plastico:" + col, col, .4)),
            "material.ceramic": lambda: get("ceramica", col, lambda: _proc("rubik:rodaje-ceramica:" + col, col, .12, coat=.6)),
            "material.stone": lambda: get("encimera", col, lambda: _proc("rubik:rodaje-encimera:" + col, col, .28, coat=.35, bump=.04, bump_scale=60, variation=.05)),
            "material.art.canvas": lambda: get("lienzo", col, lambda: _proc("rubik:rodaje-lienzo:" + col, col, .8, bump=.25, bump_scale=1500)),
            "material.paper": lambda: get("papel", col, lambda: _proc("rubik:rodaje-papel:" + col, col, .85, bump=.05, bump_scale=300)),
        }
        for pre in sorted(R_, key=len, reverse=True):
            if k == pre or k.startswith(pre + "."):
                return R_[pre]()
        return None
    # Volumen genérico: un objeto SIN modelo de catálogo cuya representación en RUBIK es una sola caja (6 caras). No es un
    # mueble modelado: vestirlo con chapa de madera lo haría pasar por uno terminado (f3-openings: «dining-table» como bloque
    # macizo). Se rueda como volumen neutro mate con su color del proyecto y el informe lo declara.
    def tapiz(o, t, kind, fuente):
        """Informe de tapicería: qué receta entró en qué pieza, con qué recurso, escala y marco, y con qué límites."""
        if not ("tapiceria" in kind or kind.startswith("token:material.fabric") or kind.startswith("token:material.leather")):
            return
        cuero = "leather" in kind; exterior = "exterior" in kind
        tex_ok = (not cuero) and ok(fabric)
        lim = ["el modelo exportado no trae costuras, vivos ni pespuntes: los cantos y uniones se leen por la forma redondeada, "
               "el contacto (oclusión) y el brillo rasante, no por una costura"]
        if not tex_ok and not cuero:
            lim.append("textura de tejido ausente o con huella distinta: receta procedimental de reserva (sustitución declarada)")
        if receta != "v3":
            lim.append(f"receta {receta} pedida por opción (--recetas): no es la de entrega")
        MT.setdefault("tapiceria", []).append({
            "objeto": o.get("rubik_id"), "tipo": t, "pieza": o.name, "receta": kind, "version": receta,
            "familia": "cuero" if cuero else ("textil exterior" if exterior else "tapicería interior"),
            "fuente": fuente, "recurso": (fabric or {}).get("id") if tex_ok else ("receta de cuero (Astra SOLACE adaptada)" if cuero else "procedimental"),
            "escalaM": round((fabric or {}).get("dimensionsMm", [270])[0] / 1000, 4) if tex_ok else None,
            "marcoGrados": MT["marcos"].get(o.name), "proyeccion": "triplanar en el marco de la pieza" if receta == "v3" and not cuero else "caja en ejes del mundo",
            "limitaciones": lim})
    # Marco propio de cada pieza de mobiliario (orientación en planta, módulo 90°): de la normal de sus caras verticales,
    # ponderada por área. La rotación del proyecto llega horneada en los vértices, así que es la única fuente fiable.
    MT["marcos"] = {}
    for o in bpy.data.objects:
        if o.type != "MESH" or o.get("rubik_role") != "object":
            continue
        c_ = s_ = 0.0
        for p_ in o.data.polygons:
            nn = p_.normal
            if abs(nn.z) < .5:
                a4 = 4 * math.atan2(nn.y, nn.x); c_ += p_.area * math.cos(a4); s_ += p_.area * math.sin(a4)
        yaw = math.atan2(s_, c_) / 4 if (abs(c_) + abs(s_)) > 1e-9 else 0.0
        o["rubik_tex_yaw"] = (0.0, 0.0, -yaw); MT["marcos"][o.name] = round(math.degrees(yaw), 1)
    piezas_por_id = {}
    for o in bpy.data.objects:
        if o.type == "MESH" and o.get("rubik_role") == "object":
            piezas_por_id[o.get("rubik_id")] = piezas_por_id.get(o.get("rubik_id"), 0) + 1
    for o in bpy.data.objects:
        if o.type != "MESH" or o.get("rubik_role") != "object" or not o.data.materials:
            continue
        src = o.data.materials[0]; t = types.get(o.get("rubik_id")); col = (src.get("rubik_color") or "#808080").lower()
        if src.name.startswith("rubik:glass") or src.get("rubik_viewer_type") == "MeshPhysicalMaterial":
            continue
        req = MT["byTarget"].get(("object", o.get("rubik_id"))) or {}
        if req.get("token") and req.get("source") == "explicit":  # 1) material explícito del profesional: prevalece sobre la regla
            rm = receta_token(req["token"], col)
            if rm:
                if src.get("rubik_backface"): BACKFACE.add(rm.name)
                o.data.materials[0] = rm; kind = "token:" + req["token"]; log[f"{t} → {kind}"] = log.get(f"{t} → {kind}", 0) + 1
                _cuenta(o.get("rubik_id"), t, kind); tapiz(o, t, kind, "material explícito del profesional (token)")
                o["rubik_material_applied"] = kind; continue
            MT.setdefault("tokensSinReceta", set()).add(req["token"])
        n = len(o.data.polygons); bb = [o.matrix_world @ Vector(c) for c in o.bound_box]
        ax = [max(p[i] for p in bb) - min(p[i] for p in bb) for i in range(3)]; dims = sorted(ax); lum = _lum(col)
        long = ax.index(max(ax)); grain = (0, 0, 0) if long == 0 else (0, 0, math.pi / 2) if long == 1 else (0, math.pi / 2, 0)
        r, g, b = _hex_lin(col); green = g > r * 1.15 and g > b * 1.15
        generico = (MT["modelosCatalogo"] is not None and o.get("rubik_id") not in MT["modelosCatalogo"]
                    and piezas_por_id.get(o.get("rubik_id")) == 1 and n in (6, 12) and len(o.data.vertices) <= 24)
        if generico:
            kind, m = "volumen-generico", get("volumen", col, lambda: _proc("rubik:rodaje-volumen-generico:" + col, col, .6))
        elif t == "plant" or (green and n in (12, 24, 320)):
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
            role = rug_role.get(o.name, "campo"); sc = (rug or {}).get("dimensionsMm", [270])[0] / 1000
            # campo: trama a escala real; cenefa: la misma lana a escala real girada 90° (cambio de dirección de los hilos);
            # canto: remate de la base con más sombra de contacto. Color medio = color del proyecto en las tres.
            rot = {"campo": (0, 0, 0), "cenefa": (0, 0, math.pi / 2), "canto": (0, 0, math.pi / 2)}[role]
            kind = "alfombra-" + role
            m = tex_or(kind, rug, col, sc, 2.2, 1.0, lambda: _proc(f"rubik:rodaje-{kind}:" + col, col, .95, bump=.5, bump_scale=900), rot=rot)
        elif t == "armchair" and is_outdoor(o) and lum < .12:
            # sillón exterior: la ESTRUCTURA (patas) es metal lacado; la tapicería, tejido de exterior (más mate)
            kind, m = "exterior-estructura-metal-lacado", get("metal-ext", col, lambda: _proc("rubik:rodaje-metal-exterior:" + col, col, .35, metallic=.6, coat=.3))
        elif t == "armchair" and is_outdoor(o) and n >= 500:
            kind, m = "exterior-tapiceria-lona", tex_or("tejido-exterior", fabric, col, (fabric or {}).get("dimensionsMm", [270])[0] / 1000, 1.2, 1.15, lambda: _proc("rubik:rodaje-lona:" + col, col, .95))
        elif t in UPHOLSTERED and n >= 500 and lum > .08:
            kind, m = "tapiceria-tejido", tex_or("tejido", fabric, col, (fabric or {}).get("dimensionsMm", [270])[0] / 1000, 2.6, 1.05, lambda: _proc("rubik:rodaje-tejido:" + col, col, .9, bump=.3, bump_scale=800))
        elif t in SANITARY and lum > .35:  # loza sanitaria vitrificada
            kind, m = "ceramica-sanitaria", get("sanitaria", col, lambda: _proc("rubik:rodaje-sanitaria:" + col, col, .06, coat=.9))
        elif t in SANITARY | APPLIANCE | KITCHEN and .02 <= lum <= .35 and abs(r - b) < .04 and abs(r - g) < .04:  # gris neutro: acero
            kind, m = "acero-inoxidable-cepillado", get("inox", col, lambda: _brushed("rubik:rodaje-inox:" + col, col))
        elif t in SANITARY | APPLIANCE | KITCHEN and .02 <= lum < .12:  # piezas oscuras (zócalos, mandos, perfiles): metal oscuro satinado
            kind, m = "metal-oscuro-satinado", get("metal-oscuro", col, lambda: _proc("rubik:rodaje-metal-oscuro:" + col, col, .38, metallic=.7))
        elif t in APPLIANCE and lum > .35:  # carcasa esmaltada/lacada de electrodoméstico
            kind, m = "electrodomestico-esmaltado", get("esmalte", col, lambda: _proc("rubik:rodaje-esmalte:" + col, col, .22, coat=.6))
        elif t in KITCHEN and lum > .02 and dims[2] < .06 and dims[0] > .3:  # encimera: losa horizontal fina
            kind, m = "encimera-piedra-compacta", get("encimera", col, lambda: _proc("rubik:rodaje-encimera:" + col, col, .28, coat=.35, bump=.04, bump_scale=60, variation=.05))
        elif t in KITCHEN and lum > .12:  # frentes de mueble de cocina
            kind, m = "frente-lacado-satinado", get("lacado", col, lambda: _proc("rubik:rodaje-lacado:" + col, col, .32, coat=.4))
        elif t in UPHOLSTERED and n < 500 and lum > .08 and not green:  # piezas tapizadas sencillas (cojines de banco)
            kind, m = "tapiceria-tejido-simple", tex_or("tejido", fabric, col, (fabric or {}).get("dimensionsMm", [270])[0] / 1000, 2.6, 1.05, lambda: _proc("rubik:rodaje-tejido:" + col, col, .9, bump=.3, bump_scale=800))
        elif lum < .02 and n <= 12 and dims[1] > .5:
            kind, m = "pantalla-vidrio-negro", get("pantalla", col, lambda: _proc("rubik:rodaje-pantalla:" + col, col, .05, coat=1.0))
        elif lum < .02:
            kind, m = "plastico-satinado", get("plastico", col, lambda: _proc("rubik:rodaje-plastico:" + col, col, .4))
        elif n in (120, 192, 320, 504) and lum > .55 and dims[2] < .4:
            kind, m = "ceramica-esmaltada", get("ceramica", col, lambda: _proc("rubik:rodaje-ceramica:" + col, col, .12, coat=.6))
        elif n == 12 and dims[0] < .05 and dims[2] < .5 and t in WOODEN | {"coffeetable"}:
            kind, m = "papel-carton", get("papel", col, lambda: _proc("rubik:rodaje-papel:" + col, col, .85, bump=.05, bump_scale=300))
        elif lum < .12 and not green:
            kind, m = "madera-oscura", tex_or("madera-oscura", wd, col, 1.0, .5, .8, lambda: _proc("rubik:rodaje-madera-oscura:" + col, col, .45), rot=grain)
        elif t in WOODEN:
            kind, m = "madera-clara-barnizada", tex_or("madera-clara", wl, col, 1.0, .4, .7, lambda: _proc("rubik:rodaje-madera-clara:" + col, col, .4), rot=grain)
        else:
            sin = log.setdefault("_sin_regla", {}); sin[t or "sin-tipo"] = sin.get(t or "sin-tipo", 0) + 1
            continue
        if src.get("rubik_backface"): BACKFACE.add(m.name)
        o.data.materials[0] = m; key = f"{t or 'sin-tipo'} → {kind}"; log[key] = log.get(key, 0) + 1
        _cuenta(o.get("rubik_id"), t, kind); tapiz(o, t, kind, "aproximación visual por tipo, pieza y color (RUBIK no declara el material)")
        o["rubik_material_applied"] = kind  # diagnóstico en el DERIVADO de Blender (nunca en el proyecto)
    for o in bpy.data.objects:  # carpinterías de puertas y ventanas (marcos, hojas, herrajes): no traen material, se aproximan por color
        if o.type != "MESH" or o.get("rubik_role") not in ("opening", "opening-leaf") or not o.data.materials:
            continue
        src = o.data.materials[0]; col = (src.get("rubik_color") or "#808080").lower()
        if src.name.startswith("rubik:glass") or src.get("rubik_viewer_type") == "MeshPhysicalMaterial" or src.name.startswith("rubik:rodaje"):
            continue
        lum = _lum(col); h, sat, v = _hsv(col)
        if sat > .22 and .03 < h < .14:
            kind, m = "carpinteria-madera", tex_or("madera-clara", wl, col, 1.0, .4, .7, lambda: _proc("rubik:rodaje-madera-clara:" + col, col, .4))
        elif lum < .35:
            kind, m = "carpinteria-aluminio-lacado", get("aluminio", col, lambda: _proc("rubik:rodaje-aluminio:" + col, col, .35, metallic=.6, coat=.2))
        else:
            kind, m = "carpinteria-lacada", get("lacado", col, lambda: _proc("rubik:rodaje-lacado:" + col, col, .32, coat=.4))
        if src.get("rubik_backface"): BACKFACE.add(m.name)
        o.data.materials[0] = m; key = f"{o.get('rubik_role')} → {kind}"; log[key] = log.get(key, 0) + 1
    sin = log.pop("_sin_regla", {}); falt = log.pop("_sin_recurso", {})
    res = ["mobiliario (APROXIMACIÓN VISUAL por tipo y pieza; el proyecto no identifica el material): " + json.dumps(dict(sorted(log.items())), ensure_ascii=False)]
    if falt:
        res.append("recursos no disponibles o con huella distinta → acabado procedural equivalente: " + json.dumps(falt, ensure_ascii=False))
    if sin:
        res.append("piezas SIN acabado identificado (se conserva el color plano del visor), por tipo: " + json.dumps(sin, ensure_ascii=False))
    return res

def descargar(man, tex):
    """Kit en el ordenador del profesional: descarga los recursos CC0 del manifiesto y verifica cada huella SHA-256. Sin red
    o con una huella distinta, ese recurso no se usa (la superficie conserva su color plano y el informe lo dice)."""
    import urllib.request
    tex.mkdir(parents=True, exist_ok=True); got = bad = 0
    for a in man["assets"]:
        for f in a["files"].values():
            dst = tex / f["file"]
            if dst.exists() and hashlib.sha256(dst.read_bytes()).hexdigest() == f["sha256"]:
                continue
            try:
                b = urllib.request.urlopen(urllib.request.Request(f["url"], headers={"User-Agent": "rubik-texture-fetch/1.0"}), timeout=60).read()
            except Exception:
                bad += 1; continue
            if hashlib.sha256(b).hexdigest() != f["sha256"]:
                bad += 1; continue
            tmp = dst.with_suffix(".part"); tmp.write_bytes(b); os.replace(tmp, dst); got += 1
    (tex / "rodaje-recursos.json").write_text(json.dumps(man, ensure_ascii=False, indent=1))
    return f"recursos: {got} descargados y verificados; {bad} no disponibles (sin red o huella distinta: color plano declarado)"

def realismo(project, labels, light, sun, tex):
    import numpy as np
    out = []; man_p = next((p for p in (tex / "rodaje-recursos.json", HERE.with_name("rubik_rodaje_recursos.json"), HERE.with_name("rodaje-recursos.json")) if p.exists()), tex / "rodaje-recursos.json")
    if man_p.exists() and flag("--fetch"):
        out.append(descargar(json.loads(man_p.read_text()), tex))
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
    def pbr(name, a, tint_hex, coord, scale_m, normal=0.6, rough_mul=1.0, albedo=True, sheen=0.0, ao=0.0, flatten=0.0, rot=(0, 0, 0), edge=0.0, weave=0.0, pile=0.0, abrash=0.0, wrinkle=0.0, abrash_scale=(2.5, 7.0, 2.5),
            frame=False, slub=0.0, heather=0.0, tone=0.0, spec=None, rough_min=0.0, sheen_rough=.4, relief=0.0):
        m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; N = nt.nodes; Lk = nt.links
        b = next(n for n in N if n.type == "BSDF_PRINCIPLED")
        tc = N.new("ShaderNodeTexCoord"); mp = N.new("ShaderNodeMapping"); mp.inputs["Scale"].default_value = (1 / scale_m, 1 / scale_m, 1 / scale_m)
        mp.inputs["Rotation"].default_value = rot
        P = tc.outputs[coord]; Nrm = tc.outputs["Normal"]
        if frame and coord == "Object":
            # MARCO PROPIO DE LA PIEZA: la rotación de cada pieza viene horneada en sus vértices (el sofá de f2-rot30 está a
            # −30°); proyectar en ejes del mundo cruza la trama en diagonal y la estira en las caras verticales. Se gira la
            # posición y la normal al marco de la pieza (propiedad de objeto rubik_tex_yaw) y la proyección triplanar usa
            # la normal GIRADA (la caja de Image Texture usaría la normal sin girar).
            att = N.new("ShaderNodeAttribute"); att.attribute_type = "OBJECT"; att.attribute_name = "rubik_tex_yaw"
            rp = N.new("ShaderNodeVectorRotate"); rp.rotation_type = "EULER_XYZ"; Lk.new(P, rp.inputs["Vector"]); Lk.new(att.outputs["Vector"], rp.inputs["Rotation"]); P = rp.outputs["Vector"]
            rn = N.new("ShaderNodeVectorRotate"); rn.rotation_type = "EULER_XYZ"; Lk.new(Nrm, rn.inputs["Vector"]); Lk.new(att.outputs["Vector"], rn.inputs["Rotation"])
            rn2 = N.new("ShaderNodeVectorRotate"); rn2.rotation_type = "EULER_XYZ"; rn2.inputs["Rotation"].default_value = rot; Lk.new(rn.outputs["Vector"], rn2.inputs["Vector"]); Nrm = rn2.outputs["Vector"]
        Lk.new(P, mp.inputs["Vector"]); V = mp.outputs["Vector"]
        tri = None
        if frame and coord == "Object":  # pesos triplanares |n|^6 normalizados (transición corta: sin dobles tramas en caras planas)
            ab = N.new("ShaderNodeVectorMath"); ab.operation = "ABSOLUTE"; Lk.new(Nrm, ab.inputs[0])
            sx = N.new("ShaderNodeSeparateXYZ"); Lk.new(ab.outputs["Vector"], sx.inputs[0]); ws = []
            for ax_ in ("X", "Y", "Z"):
                pw = N.new("ShaderNodeMath"); pw.operation = "POWER"; pw.inputs[1].default_value = 6; Lk.new(sx.outputs[ax_], pw.inputs[0]); ws.append(pw)
            s1 = N.new("ShaderNodeMath"); s1.operation = "ADD"; Lk.new(ws[0].outputs[0], s1.inputs[0]); Lk.new(ws[1].outputs[0], s1.inputs[1])
            s2 = N.new("ShaderNodeMath"); s2.operation = "ADD"; Lk.new(s1.outputs[0], s2.inputs[0]); Lk.new(ws[2].outputs[0], s2.inputs[1])
            wn = []
            for w_ in ws:
                dv = N.new("ShaderNodeMath"); dv.operation = "DIVIDE"; Lk.new(w_.outputs[0], dv.inputs[0]); Lk.new(s2.outputs[0], dv.inputs[1]); wn.append(dv.outputs[0])
            sv = N.new("ShaderNodeSeparateXYZ"); Lk.new(V, sv.inputs[0]); planes = []
            for u_, v_ in (("Y", "Z"), ("X", "Z"), ("X", "Y")):
                cb = N.new("ShaderNodeCombineXYZ"); Lk.new(sv.outputs[u_], cb.inputs["X"]); Lk.new(sv.outputs[v_], cb.inputs["Y"]); planes.append(cb.outputs[0])
            tri = (wn, planes)
        def tnode(k, colour):
            if tri is None:
                t = N.new("ShaderNodeTexImage"); t.image = img(a, k, colour); t.projection = "BOX"; t.projection_blend = .25; Lk.new(V, t.inputs["Vector"]); return t
            wn, planes = tri; acc = None
            for w_, pl in zip(wn, planes):
                t = N.new("ShaderNodeTexImage"); t.image = img(a, k, colour); t.interpolation = "Cubic"; Lk.new(pl, t.inputs["Vector"])
                sc_ = N.new("ShaderNodeVectorMath"); sc_.operation = "SCALE"; Lk.new(t.outputs["Color"], sc_.inputs[0]); Lk.new(w_, sc_.inputs["Scale"])
                if acc is None:
                    acc = sc_.outputs["Vector"]
                else:
                    ad = N.new("ShaderNodeVectorMath"); ad.operation = "ADD"; Lk.new(acc, ad.inputs[0]); Lk.new(sc_.outputs["Vector"], ad.inputs[1]); acc = ad.outputs["Vector"]
            class _T:  # misma interfaz que un Image Texture (outputs["Color"]) y su imagen (para medir el color medio)
                pass
            o_ = _T(); o_.outputs = {"Color": acc}; o_.image = img(a, k, colour); return o_
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
        if edge:  # cantos convexos (ribetes, bordes de cojín) un poco más claros; la curvatura sale de la malla (Pointiness)
            gm = N.new("ShaderNodeNewGeometry"); cr = N.new("ShaderNodeMapRange"); cr.inputs["From Min"].default_value = .5; cr.inputs["From Max"].default_value = .58
            cr.inputs["To Min"].default_value = 1.0; cr.inputs["To Max"].default_value = 1.0 + edge; Lk.new(gm.outputs["Pointiness"], cr.inputs["Value"])
            em = N.new("ShaderNodeVectorMath"); em.operation = "SCALE"; Lk.new(col_out, em.inputs[0]); Lk.new(cr.outputs["Result"], em.inputs["Scale"]); col_out = em.outputs["Vector"]
        if weave:  # trama legible: el dibujo del tejido vive en el relieve; se lleva al color con su propio contraste medido
            px = np.empty(len(d.image.pixels), dtype=np.float32); d.image.pixels.foreach_get(px); px = px.reshape(-1, 4)[::5, :3]
            lum = (np.where(px <= .04045, px / 12.92, ((px + .055) / 1.055) ** 2.4) * (.2126, .7152, .0722)).sum(axis=1)
            mu, sd = float(lum.mean()), max(1e-4, float(lum.std()))
            bw = N.new("ShaderNodeRGBToBW"); Lk.new(d.outputs["Color"], bw.inputs["Color"]); wr = N.new("ShaderNodeMapRange"); wr.clamp = True
            wr.inputs["From Min"].default_value = mu - 2.5 * sd; wr.inputs["From Max"].default_value = mu + 2.5 * sd
            wr.inputs["To Min"].default_value = 1 - weave; wr.inputs["To Max"].default_value = 1 + weave; Lk.new(bw.outputs["Val"], wr.inputs["Value"])
            wm = N.new("ShaderNodeVectorMath"); wm.operation = "SCALE"; Lk.new(col_out, wm.inputs[0]); Lk.new(wr.outputs["Result"], wm.inputs["Scale"]); col_out = wm.outputs["Vector"]
        if abrash:  # «abrash»: variación tonal de lote de la lana en franjas a lo largo de la urdimbre (5–25 cm), visible a distancia
            tc3 = N.new("ShaderNodeTexCoord"); mp3 = N.new("ShaderNodeMapping"); mp3.inputs["Rotation"].default_value = rot
            mp3.inputs["Scale"].default_value = abrash_scale; Lk.new(tc3.outputs["Object"], mp3.inputs["Vector"])
            nz3 = N.new("ShaderNodeTexNoise"); nz3.inputs["Detail"].default_value = 3; nz3.inputs["Roughness"].default_value = .55; Lk.new(mp3.outputs["Vector"], nz3.inputs["Vector"])
            ar = N.new("ShaderNodeMapRange"); ar.inputs["From Min"].default_value = .3; ar.inputs["From Max"].default_value = .7; ar.clamp = True
            ar.inputs["To Min"].default_value = 1 - abrash; ar.inputs["To Max"].default_value = 1 + abrash; Lk.new(nz3.outputs["Fac"], ar.inputs["Value"])
            am3 = N.new("ShaderNodeVectorMath"); am3.operation = "SCALE"; Lk.new(col_out, am3.inputs[0]); Lk.new(ar.outputs["Result"], am3.inputs["Scale"]); col_out = am3.outputs["Vector"]
        if (slub or heather) and tri is not None:
            # HILO REAL A ESCALA FÍSICA: variación de grosor y tono del hilo (slub, ~1 mm × 4 cm) y mezcla de hebras (heather,
            # ~4 mm × 10 cm), alargadas SEGÚN LOS HILOS de cada cara: urdimbre y trama, las dos direcciones del plano de la
            # cara (la vena alargada según la normal no se ve y se descarta). A distancia normal el hilo queda bajo el píxel,
            # pero estas vetas dan al tejido su lectura textil sin agrandarlo; son simétricas (claras y oscuras), sin manchas.
            wn3 = tri[0]
            for amp, (L_, W_) in ((slub, (.04, .0012)), (heather, (.09, .005))):
                if not amp:
                    continue
                acc_ = None
                for i_, sc3 in enumerate(((1 / L_, 1 / W_, 1 / W_), (1 / W_, 1 / L_, 1 / W_), (1 / W_, 1 / W_, 1 / L_))):
                    mm = N.new("ShaderNodeMapping"); mm.inputs["Scale"].default_value = sc3; mm.inputs["Location"].default_value = (i_ * 7.31, i_ * 3.17, i_ * 5.03); Lk.new(P, mm.inputs["Vector"])
                    nz_ = N.new("ShaderNodeTexNoise"); nz_.inputs["Scale"].default_value = 1.0; nz_.inputs["Detail"].default_value = 2; nz_.inputs["Roughness"].default_value = .5
                    Lk.new(mm.outputs["Vector"], nz_.inputs["Vector"])
                    om = N.new("ShaderNodeMath"); om.operation = "SUBTRACT"; om.inputs[0].default_value = 1.0; Lk.new(wn3[i_], om.inputs[1])  # 1 − peso de la cara normal a esta vena
                    pr = N.new("ShaderNodeMath"); pr.operation = "MULTIPLY"; Lk.new(nz_.outputs["Fac"], pr.inputs[0]); Lk.new(om.outputs[0], pr.inputs[1])
                    if acc_ is None:
                        acc_ = pr.outputs[0]
                    else:
                        ad_ = N.new("ShaderNodeMath"); ad_.operation = "ADD"; Lk.new(acc_, ad_.inputs[0]); Lk.new(pr.outputs[0], ad_.inputs[1]); acc_ = ad_.outputs[0]
                hv = N.new("ShaderNodeMath"); hv.operation = "MULTIPLY"; hv.inputs[1].default_value = .5; Lk.new(acc_, hv.inputs[0])  # media de las dos venas del plano
                mr = N.new("ShaderNodeMapRange"); mr.clamp = True; mr.inputs["From Min"].default_value = .36; mr.inputs["From Max"].default_value = .64
                mr.inputs["To Min"].default_value = 1 - amp; mr.inputs["To Max"].default_value = 1 + amp; Lk.new(hv.outputs[0], mr.inputs["Value"])
                vm = N.new("ShaderNodeVectorMath"); vm.operation = "SCALE"; Lk.new(col_out, vm.inputs[0]); Lk.new(mr.outputs["Result"], vm.inputs["Scale"]); col_out = vm.outputs["Vector"]
        if tone:  # cada pieza (cojín, brazo, respaldo) con un matiz propio muy leve, como el pelo de la tela cortado en otra dirección
            oi = N.new("ShaderNodeObjectInfo"); tr_ = N.new("ShaderNodeMapRange"); tr_.inputs["To Min"].default_value = 1 - tone; tr_.inputs["To Max"].default_value = 1 + tone
            Lk.new(oi.outputs["Random"], tr_.inputs["Value"]); tv = N.new("ShaderNodeVectorMath"); tv.operation = "SCALE"; Lk.new(col_out, tv.inputs[0]); Lk.new(tr_.outputs["Result"], tv.inputs["Scale"]); col_out = tv.outputs["Vector"]
        if spec is not None:  # reflectancia especular baja: la tela no tiene la película brillante de un plástico
            b.inputs["Specular IOR Level"].default_value = spec
        if sheen:
            b.inputs["Sheen Weight"].default_value = sheen; b.inputs["Sheen Roughness"].default_value = sheen_rough
        if albedo:
            Lk.new(col_out, b.inputs["Base Color"])
        else:  # muros: color plano DEL PROYECTO; del recurso solo relieve y rugosidad
            b.inputs["Base Color"].default_value = (*target, 1)
        rm = N.new("ShaderNodeMath"); rm.operation = "MULTIPLY"; rm.inputs[1].default_value = rough_mul; Lk.new(r.outputs["Color"], rm.inputs[0]); rough_out = rm.outputs[0]
        if rough_min:  # suelo de rugosidad: ninguna zona del tejido llega a brillar como un plástico
            rx = N.new("ShaderNodeMath"); rx.operation = "MAXIMUM"; rx.inputs[1].default_value = rough_min; Lk.new(rough_out, rx.inputs[0]); rough_out = rx.outputs[0]
        Lk.new(rough_out, b.inputs["Roughness"])
        if tri is not None and relief:
            # Sin UV no hay espacio tangente fiable para el mapa de normales: el relieve de la trama sale de la altura del propio
            # escaneo (luminancia de su color, proyectada en el marco de la pieza) a la altura física del hilo.
            hb = N.new("ShaderNodeRGBToBW"); Lk.new(d.outputs["Color"], hb.inputs["Color"]); bpn = N.new("ShaderNodeBump")
            bpn.inputs["Strength"].default_value = 1.0; bpn.inputs["Distance"].default_value = relief; Lk.new(hb.outputs["Val"], bpn.inputs["Height"]); nrm = bpn.outputs["Normal"]
        else:
            nm = N.new("ShaderNodeNormalMap"); nm.inputs["Strength"].default_value = normal; Lk.new(n.outputs["Color"], nm.inputs["Color"]); nrm = nm.outputs["Normal"]
        if wrinkle:  # microarrugas y tensión del tapizado (escala de centímetros, legible a 2–3 m): receta de lino de Astra (SOLACE)
            tc4 = N.new("ShaderNodeTexCoord"); nz4 = N.new("ShaderNodeTexNoise"); nz4.inputs["Scale"].default_value = 28; nz4.inputs["Detail"].default_value = 4; nz4.inputs["Roughness"].default_value = .72
            bp4 = N.new("ShaderNodeBump"); bp4.inputs["Strength"].default_value = wrinkle; bp4.inputs["Distance"].default_value = .004
            Lk.new(tc4.outputs["Object"], nz4.inputs["Vector"]); Lk.new(nz4.outputs["Fac"], bp4.inputs["Height"]); Lk.new(nrm, bp4.inputs["Normal"]); nrm = bp4.outputs["Normal"]
        if pile:  # pelo fino (≈2,5 mm, del tamaño de la fibra, no mayor) sobre el relieve de la trama
            tc2 = N.new("ShaderNodeTexCoord"); nz = N.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 400; nz.inputs["Detail"].default_value = 4
            bp = N.new("ShaderNodeBump"); bp.inputs["Strength"].default_value = pile; bp.inputs["Distance"].default_value = .0015
            Lk.new(tc2.outputs["Object"], nz.inputs["Vector"]); Lk.new(nz.outputs["Fac"], bp.inputs["Height"]); Lk.new(nrm, bp.inputs["Normal"]); Lk.new(bp.outputs["Normal"], b.inputs["Normal"])
        else:
            Lk.new(nrm, b.inputs["Normal"])
        return m
    mats = {m["id"]: m for m in project.get("materials", [])}; rooms = {r["id"]: r for r in project["rooms"]}; cache = {}; floors = []; subst = []
    solo_luz = flag("--sin-materiales")  # comparativa controlada: misma luz, cielo, vidrio y portales; materiales del visor
    for o in ([] if solo_luz else bpy.data.objects):
        if o.type != "MESH" or o.get("rubik_role") not in ("room", "room-slab"):
            continue
        rid = str(o.get("rubik_id", "")).split(":")[-1]; r = rooms.get(rid) or {}
        # El ZIP trae el color del suelo (floorColor), no el id del material: correspondencia EXACTA con el color de los
        # materiales de suelo de RUBIK (COLOR_USE); con project.json (laboratorio) se usa floorMaterialId.
        mid = r.get("floorMaterialId"); pm = mats.get(mid); req = MT["byTarget"].get(("room-floor", rid)) or {}
        use, nota = token_use(req.get("token"))
        if use and use in by_use:  # 1) explícito / 2) documentado del catálogo, por token
            mid, via = use, ("selección explícita del profesional, identidad documentada por el catálogo (token)" if req.get("source") == "explicit" else "familia documentada del catálogo (token)")
            estado = "declarado aplicado" if not nota else "declarado con recurso aproximado"
        else:  # 3) aproximación por familia (id/preset/color), declarada
            mid, via = floor_family(pm, mid, by_use); estado = "aproximación" if "aproximación" in via or "familia" in via else "documentado aplicado"
            nota = ("token sin recurso de suelo en el kit: " + str(req.get("token"))) if req.get("token") else None
        a = by_use.get(mid)
        row = {"objetivo": {"tipo": "suelo", "id": rid, "estancia": labels.get(rid, rid)}, "solicitado": {k: req.get(k) for k in ("token", "source", "certainty")},
               "aplicado": None, "estado": estado, "motivo": nota}
        if not pm or not ok(a):
            row.update(estado="reserva: color plano", motivo="recurso ausente o con huella distinta"); MT["rows"].append(row)
            subst.append({"estancia": labels.get(rid, rid), "material": mid, "motivo": "recurso ausente o sin verificar: color plano"}); continue
        row["aplicado"] = {"receta": "suelo-pbr:" + mid, "recurso": a["id"], "licencia": a.get("license", "CC0-1.0"), "escalaM": a["dimensionsMm"][0] / 1000, "orientacion": "proyección por caja en coordenadas del objeto", "como": via}
        MT["rows"].append(row)
        key = mid
        if key not in cache:
            smooth = mid in ("mat_tile800", "mat_tile600", "mat_marble")  # porcelánico y mármol pulidos: reflejo y menos contraste
            cache[key] = pbr("rubik:rodaje-suelo:" + mid, a, (pm.get("appearance") or {}).get("color", "#cccccc"), "Object", a["dimensionsMm"][0] / 1000, rough_mul=.45 if smooth else 1.0, flatten=.55 if smooth else 0.0)
        if o.data.materials[0].get("rubik_backface"): BACKFACE.add(cache[key].name)
        o.data.materials[0] = cache[key]; floors.append({"estancia": labels.get(rid, rid), "materialProyecto": mid, "recurso": a["id"], "escalaM": a["dimensionsMm"][0] / 1000, "como": via})
    out.append(f"suelos: {len(floors)} estancias con PBR CC0 a escala real y color medio = color del material del proyecto; sustituciones: " + json.dumps(floors, ensure_ascii=False))
    if subst:
        out.append("suelos sin recurso (color plano conservado): " + json.dumps(subst, ensure_ascii=False))
    wa = by_use.get("walls"); nw = 0
    if solo_luz:
        out.append("COMPARATIVA CONTROLADA: materiales del visor sin cambios (solo se aplica la luz, el cielo, el vidrio y los portales)")
    if ok(wa) and not solo_luz:
        wcache = {}
        for o in bpy.data.objects:
            if o.type != "MESH" or o.get("rubik_role") != "wall" or not o.data.materials:
                continue
            src = o.data.materials[0]; col = src.get("rubik_color") or "#f2efe9"
            if col not in wcache:
                wcache[col] = pbr("rubik:rodaje-muro:" + col, wa, col, "Object", wa["dimensionsMm"][0] / 1000, normal=.15, rough_mul=1.0, albedo=False)
            if src.get("rubik_backface"): BACKFACE.add(wcache[col].name)
            o.data.materials[0] = wcache[col]; nw += 1
        out.append(f"muros: solo relieve y rugosidad (color plano del proyecto) de «{wa['id']}» (CC0) en {nw} piezas; el color es el del proyecto (sin cambio de tono)")
    ng = 0
    for m in bpy.data.materials:
        if m.get("rubik_viewer_type") == "MeshPhysicalMaterial" and m.use_nodes:
            b = next((n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None)
            if b and b.inputs["Transmission Weight"].default_value > .5:
                b.inputs["Roughness"].default_value = 0.0; b.inputs["IOR"].default_value = 1.45; ng += 1
                N = m.node_tree.nodes; Lk = m.node_tree.links; outn = next(n for n in N if n.type == "OUTPUT_MATERIAL")
                lp = N.new("ShaderNodeLightPath"); tr = N.new("ShaderNodeBsdfTransparent"); mx = N.new("ShaderNodeMixShader")
                Lk.new(lp.outputs["Is Shadow Ray"], mx.inputs["Fac"]); Lk.new(b.outputs["BSDF"], mx.inputs[1]); Lk.new(tr.outputs["BSDF"], mx.inputs[2]); Lk.new(mx.outputs["Shader"], outn.inputs["Surface"])
    out.append(f"vidrio físico: {ng} materiales (IOR 1,45, liso); los rayos de sombra lo atraviesan para que entre el sol (recurso de visualización)")
    from mathutils import Vector
    np_ = 0
    for o in bpy.data.objects:
        if o.type == "MESH" and o.get("rubik_role") == "opening" and o.data.materials and o.data.materials[0].get("rubik_viewer_type") == "MeshPhysicalMaterial":
            bb = [o.matrix_world @ Vector(c) for c in o.bound_box]; lo = Vector([min(p[i] for p in bb) for i in range(3)]); hi = Vector([max(p[i] for p in bb) for i in range(3)])
            d = hi - lo; w = max(d.x, d.y); h = d.z
            if w < .3 or h < .3:
                continue
            L = bpy.data.lights.new("RUBIK_portal_" + o.name[-12:], "AREA"); L.shape = "RECTANGLE"; L.size, L.size_y = w, h; L.cycles.is_portal = True
            po = bpy.data.objects.new(L.name, L); po.location = (lo + hi) / 2; po.rotation_euler = (math.pi / 2, 0, (math.pi / 2 if d.x < d.y else 0)); bpy.context.scene.collection.objects.link(po); np_ += 1
    out.append(f"luz de ventana: {np_} portales de luz en los huecos acristalados (recurso de visualización; guían el muestreo del cielo, no añaden energía)")
    if not solo_luz:
        out.extend(acabados(project, by_use, ok, img, mean_lin, pbr))
    for name in BACKFACE:  # igual que el visor y la importación: la cara trasera no se ve (si no, el reverso del borde de un plato sale negro)
        m = bpy.data.materials.get(name); N = m.node_tree.nodes; Lk = m.node_tree.links; outn = next(n for n in N if n.type == "OUTPUT_MATERIAL")
        cur = outn.inputs["Surface"].links[0].from_socket; geo = N.new("ShaderNodeNewGeometry"); tr = N.new("ShaderNodeBsdfTransparent"); mx = N.new("ShaderNodeMixShader")
        Lk.new(geo.outputs["Backfacing"], mx.inputs["Fac"]); Lk.new(cur, mx.inputs[1]); Lk.new(tr.outputs["BSDF"], mx.inputs[2]); Lk.new(mx.outputs["Shader"], outn.inputs["Surface"]); m["rubik_backface"] = "hidden (as in the viewer)"
    out.append(f"cara trasera oculta como en el visor en {len(BACKFACE)} materiales generados")
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

def pelicula(sc, cd, cam, derived, project, labels, origin, h, TL, declared, nframes):
    """Del plano a la vivienda: planta legible → muros que crecen desde su huella → huecos → mobiliario → entrada a la estancia.
    Solo se animan transformaciones de los nodos de entidad (rubik_id) y siempre terminan en su valor de entrada."""
    from mathutils import Vector as V
    fps = TL["output"]["fps"]; S = {x["id"]: x["frames"] for x in TL["shots"]}
    ents = [o for o in bpy.data.objects if o.parent and o.parent.name == "RUBIK_scene" and o.get("rubik_role")]
    by = {}
    for o in ents: by.setdefault(o.get("rubik_role"), []).append(o)
    pts = [o.matrix_world @ V(c) for o in bpy.data.objects if o.type == "MESH" and o.get("rubik_role") in ("room", "wall") for c in o.bound_box]
    lo = V([min(p[i] for p in pts) for i in range(3)]); hi = V([max(p[i] for p in pts) for i in range(3)]); ctr = V(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, 0)); diag = (hi - lo).length
    def key(o, f, loc, sc_):
        o.location = loc; o.scale = sc_; o.keyframe_insert("location", frame=f); o.keyframe_insert("scale", frame=f)
    def grow(o, f0, f1, s0, drop=0.0):  # de s0 a su escala real, y desde drop metros por encima, entre f0 y f1
        L, Sc = o.location.copy(), o.scale.copy()
        if f0 > 0: key(o, 0, L * 1 if s0 is None else V((L.x, L.y, L.z * (s0[2] if s0 else 1) + drop)), V([Sc[i] * s0[i] for i in range(3)]))
        key(o, f0, V((L.x, L.y, L.z * s0[2] + drop)), V([Sc[i] * s0[i] for i in range(3)])); key(o, f1, L, Sc)
    ang = lambda o: math.atan2(o.location.y - ctr.y, o.location.x - ctr.x)
    # Muros: la huella (3 %) se ve en la planta; los tramos altos (dinteles, antepechos superiores) entran al crecer.
    w0, w1 = S["walls"]; ws = sorted(by.get("wall", []), key=ang); n = max(1, len(ws)); span = w1 - w0 - int(1.2 * fps)
    for i, o in enumerate(ws):
        a = w0 + int(span * i / n); base = o.location.z < .05
        grow(o, a, a + int(1.2 * fps), (1, 1, .03) if base else (1, 1, 0.0005))
    for role, sh, drop in (("opening", "openings", .0), ("opening-leaf", "openings", .0), ("object", "furniture", .45)):
        a0, a1 = S[sh]; xs = sorted(by.get(role, []), key=lambda o: (ang(o), o.name)); n = max(1, len(xs)); span = a1 - a0 - int(.8 * fps)
        for i, o in enumerate(xs):
            a = a0 + int(span * i / n); grow(o, a, a + int(.8 * fps), (.0005, .0005, .0005), drop)
    # Estancia final: la que el proyecto llama salón (por su nombre visible) o, si no, la mayor contada.
    rooms = [r for r in project["rooms"] if r.get("counted", True)]
    area = lambda r: abs(sum(p["x"] * q["y"] - q["x"] * p["y"] for p, q in zip(r["polygon"], r["polygon"][1:] + r["polygon"][:1]))) / 2
    room = next((r for r in rooms if re.search(r"sal[oó]n|living|estar", str(labels.get(r["id"], "")), re.I)), None) or max(rooms, key=area)
    poly = room["polygon"]; c = R.centroid(poly); lc = R.to_blender(c["x"], c["y"], origin, 0)
    far = max(poly, key=lambda p: (p["x"] - c["x"]) ** 2 + (p["y"] - c["y"]) ** 2)
    eye0 = R.to_blender(c["x"] + .6 * (far["x"] - c["x"]), c["y"] + .6 * (far["y"] - c["y"]), origin, 1.45)
    eye1 = R.to_blender(c["x"] + .45 * (far["x"] - c["x"]), c["y"] + .45 * (far["y"] - c["y"]), origin, 1.4)
    tg0 = R.to_blender(c["x"] - .9 * (far["x"] - c["x"]), c["y"] - .9 * (far["y"] - c["y"]), origin, 1.1)
    side = (tg0 - eye0).cross(V((0, 0, 1))).normalized() * 1.6; tg1 = tg0 + side
    # Rótulos de estancia (nombre visible del proyecto) tendidos sobre la planta: se leen en el cenital y se retiran al girar.
    mat = bpy.data.materials.new("RUBIK_rotulo"); mat.use_nodes = True; bs = mat.node_tree.nodes.get("Principled BSDF"); bs.inputs["Base Color"].default_value = (.03, .03, .035, 1); bs.inputs["Roughness"].default_value = .9
    plate = bpy.data.materials.new("RUBIK_rotulo_placa"); plate.use_nodes = True; pb = plate.node_tree.nodes.get("Principled BSDF"); pb.inputs["Base Color"].default_value = (.92, .91, .88, 1); pb.inputs["Roughness"].default_value = .95
    f_out = S["floors"][1] - int(.6 * fps); nlab = 0
    for r in rooms:
        t = labels.get(r["id"]) or ""
        if not t or re.search(r"[㐀-鿿]", t): continue
        if area(r) / 1e6 < 2.5: continue  # p. ej. miradores: el rótulo no cabe; la estancia sigue visible en la planta
        lines = t.split(" ", 1) if len(t) > 11 and " " in t else [t]; longest = max(len(x) for x in lines)
        cu = bpy.data.curves.new("RUBIK_rotulo_" + r["id"], "FONT"); cu.body = "\n".join(lines); cu.align_x = "CENTER"; cu.align_y = "CENTER"; xs_ = [p["x"] for p in r["polygon"]]; ys_ = [p["y"] for p in r["polygon"]]; wmin = min(max(xs_) - min(xs_), max(ys_) - min(ys_)) / 1000; cu.size = max(.34, min(.75, (max(xs_) - min(xs_)) / 1000 / max(4, longest) * 2.0, wmin * .34 / len(lines) * 1.4)); cu.extrude = .002
        ob = bpy.data.objects.new(cu.name, cu); ob.data.materials.append(mat); derived.objects.link(ob); cc = R.centroid(r["polygon"])
        L = R.to_blender(cc["x"], cc["y"], origin, .03); key(ob, 0, L, V((1, 1, 1))); key(ob, f_out, L, V((1, 1, 1))); key(ob, f_out + int(.6 * fps), L, V((.0005, .0005, .0005))); nlab += 1
        # placa clara bajo el rótulo (contraste sobre cualquier suelo); se retira con él
        pw, ph = cu.size * longest * .62 + .16, cu.size * 1.25 * len(lines) + .1
        bpy.ops.mesh.primitive_plane_add(size=1); pl = bpy.context.active_object; pl.name = "RUBIK_rotulo_placa_" + r["id"]; pl.scale = (pw, ph, 1); bpy.ops.object.transform_apply(scale=True)
        for cl in list(pl.users_collection): cl.objects.unlink(pl)
        derived.objects.link(pl); pl.data.materials.append(plate); Lp = R.to_blender(cc["x"], cc["y"], origin, .026)
        key(pl, 0, Lp, V((1, 1, 1))); key(pl, f_out, Lp, V((1, 1, 1))); key(pl, f_out + int(.6 * fps), Lp, V((.0005, .0005, .0005)))
    # Cámara: puntos clave y Catmull-Rom (velocidad continua: sin cortes entre 2D y volumen).
    def orbit(az, el, d): az, el = math.radians(az), math.radians(el); return ctr + V((math.cos(el) * math.sin(az), -math.cos(el) * math.cos(az), math.sin(el))) * d * diag
    top = lambda z: ctr + V((0, -.002 * diag, z * diag))
    lens_top = 50; H = (max(hi.x - lo.x, (hi.y - lo.y) * 16 / 9) * 1.18) * lens_top / 36 / diag  # planta entera en el encuadre
    # Entrada (auditoría 27/11: caía casi en vertical y levantaba la mirada de golpe): planeo tendido en el plano vertical que
    # contiene la mirada final; el objetivo se desliza del centro de la estancia a la pared del fondo, que siempre está a la vista.
    Rr = ((far["x"] - c["x"]) ** 2 + (far["y"] - c["y"]) ** 2) ** .5 / 1000
    back = (eye0 - lc); back.z = 0; back = back.normalized()
    aprox = lc + back * (1.7 * Rr + 1.5) + V((0, 0, h + 2.4)); umbral = lc + back * (.95 * Rr) + V((0, 0, h - .15))
    tg_mid = (lc + V((0, 0, .5))).lerp(tg0, .55)
    eye1 = lc + back * (.32 * Rr) + V((0, 0, 1.4)); tg1 = tg0 + side * 1.5  # final: avance lento (≈ 0,3 R) y paneo suave
    K = [(0, top(H), ctr, lens_top), (S["plan"][1], top(H * .985), ctr, lens_top), (S["floors"][1], orbit(-22, 60, 1.25), ctr, 40),
         (S["walls"][1], orbit(-9, 50, 1.16), ctr, 36), (S["openings"][1], orbit(2, 46, 1.1), ctr, 35),
         (S["furniture"][1], aprox, lc + V((0, 0, .3)), 28), (S["enter"][0] + int(3.8 * fps), umbral, tg_mid, 22), (S["enter"][1], eye0, tg0, 18), (nframes - 1, eye1, tg1, 18)]
    def cr(p0, p1, p2, p3, t): return .5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3)
    def at(f, idx):
        for k in range(len(K) - 1):
            if K[k][0] <= f <= K[k + 1][0]:
                t = (f - K[k][0]) / max(1, K[k + 1][0] - K[k][0]); t = t * t * (3 - 2 * t) if k in (0, len(K) - 2) else t
                g = lambda j: K[min(max(j, 0), len(K) - 1)][idx]
                return cr(g(k - 1), g(k), g(k + 1), g(k + 2), t) if idx < 3 else g(k) + (g(k + 1) - g(k)) * t
        return K[-1][idx]
    for f in range(0, nframes, 6): cd.lens = at(f, 3); cd.keyframe_insert("lens", frame=f)
    cd.clip_start = .05; cd.clip_end = diag * 10
    # Techos y luminarias: entran cuando la cámara ya está por debajo del techo, fuera del encuadre.
    f_in = next((f for f in range(S["furniture"][1], nframes) if at(f, 1).z < h - .25), S["enter"][1])
    for o in by.get("ceiling", []) + by.get("fixture", []): grow(o, f_in, f_in + 2, (.0005, .0005, .0005))
    # Continuidad de luz (auditoría 27/11, salto en 532→533): techo y luminarias no proyectan sombra ni rebotan en ningún momento;
    # solo los ve la cámara. La luz de la escena es la misma antes y después de entrar.
    nray = 0
    for o in bpy.data.objects:
        if o.get("rubik_role") in ("ceiling", "fixture") or (o.parent and o.parent.get("rubik_role") in ("ceiling", "fixture")):
            for a in ("visible_shadow", "visible_diffuse", "visible_glossy", "visible_transmission", "visible_volume_scatter"): setattr(o, a, False)
            nray += 1
    # Fondo (auditoría: azul de una escena sin entorno): el proyecto no trae entorno; la CÁMARA ve un fondo neutro declarado y la
    # iluminación del cielo no cambia (Light Path · rayo de cámara).
    w = sc.world
    if w and w.use_nodes:
        N = w.node_tree.nodes; Lk = w.node_tree.links; outw = next(n for n in N if n.type == "OUTPUT_WORLD"); cur = outw.inputs["Surface"].links[0].from_socket
        lp = N.new("ShaderNodeLightPath"); neu = N.new("ShaderNodeBackground"); neu.inputs["Color"].default_value = (.58, .58, .57, 1); neu.inputs["Strength"].default_value = 1.0
        mx = N.new("ShaderNodeMixShader"); Lk.new(lp.outputs["Is Camera Ray"], mx.inputs["Fac"]); Lk.new(cur, mx.inputs[1]); Lk.new(neu.outputs["Background"], mx.inputs[2]); Lk.new(mx.outputs["Shader"], outw.inputs["Surface"])
    # Vidrio (moteado del ventanal): sin cáusticas y con brillo filtrado; se declara
    sc.cycles.caustics_reflective = False; sc.cycles.caustics_refractive = False; sc.cycles.blur_glossy = 1.0; sc.cycles.sample_clamp_direct = 10.0
    try: sc.cycles.denoising_prefilter = "ACCURATE"
    except Exception: pass
    declared.append(f"continuidad de luz: techo y luminarias ({nray} objetos) solo visibles para la cámara, sin sombra ni rebote; fondo de cámara neutro gris (el proyecto no trae entorno), el cielo ilumina igual")
    declared.append("vidrio: sin cáusticas, brillo filtrado 1,0, límite directo 10, OIDN con prefiltro preciso")
    sc.render.use_persistent_data = True  # misma escena en todos los fotogramas: se reutiliza entre ellos
    declared.append(f"Película del proyecto · «Del plano a la vivienda»: {nframes} fotogramas a {fps} fps sin sonido; cronología {TL['_sha256'][:12]}")
    declared.append(f"planta legible: cenital con objetivo de {lens_top} mm, suelos del ZIP, huella de los muros al 3 % y {nlab} rótulos con el nombre visible de cada estancia (se retiran al girar)")
    declared.append(f"aparición en su posición: {len(ws)} muros crecen desde su huella; {len(by.get('opening', []))} huecos, {len(by.get('opening-leaf', []))} hojas y {len(by.get('object', []))} muebles crecen en su sitio (muebles desde 0,45 m por encima); techos y luminarias al entrar (fotograma {f_in})")
    declared.append(f"estancia final «{labels.get(room['id'], room['id'])}» (reconocible en la planta): descenso dentro de ella y giro lento a 1,4 m")
    return lambda f: (at(f, 1), at(f, 2))

def main():
    pos = [a for a in sys.argv[sys.argv.index("--") + 1:] if not a.startswith("--")]
    # posicionales = los tres primeros que no son valor de una opción
    a = sys.argv[sys.argv.index("--") + 1:]; pos = []; i = 0
    while i < len(a):
        if a[i].startswith("--"):
            i += 1 if a[i] in ("--still", "--preflight", "--fetch", "--sin-materiales", "--con-guion") else 2; continue
        pos.append(a[i]); i += 1
    prep, pkg, out = (Path(p).resolve() for p in pos[:3])
    # «Tu proyecto cobra vida»: el guion elegido en RUBIK › Entregar › Vídeo (rubik-pelicula-guion.json en el ZIP) manda sobre
    # efecto, planos, fotogramas y perfil. Sin guion, el kit funciona como siempre.
    GUION = None; gp = arg("--guion") or (str(Path(pos[1]).resolve() / "rubik-pelicula-guion.json") if flag("--con-guion") else None)
    if gp:
        gpp = Path(gp).resolve(); GUION = json.loads(gpp.read_bytes()); GUION["_sha256"] = hashlib.sha256(gpp.read_bytes()).hexdigest()
        if GUION.get("format") != "rubik-sota.pelicula-script": raise SystemExit("rubik-pelicula-guion.json: formato inesperado")
    pname = arg("--profile", (GUION or {}).get("profile") or "revision"); prof = PROFILES[pname]
    res = [int(v) for v in arg("--res", prof["res"]).split("x")]; samples = int(arg("--samples", prof["samples"]))
    shot = arg("--shot", "aereo"); light = arg("--light", "dia"); fps = int(arg("--fps", "24")); secs = float(arg("--seconds", "2"))
    nframes = max(1, int(round(fps * secs)))
    TL = None
    EFECTOS_KIT = {"maqueta-abierta"}  # coreografías disponibles en este kit; las demás se declaran pendientes (sin inventar)
    if GUION:
        if GUION["effect"] not in EFECTOS_KIT:
            raise SystemExit(f"El efecto «{GUION['effect']}» aún no tiene coreografía en este kit (pendiente); no se renderiza nada.")
        shot = "pelicula"; fps = int(GUION["fps"]); nframes = int(GUION["frames"])
        TL = {"output": {"fps": fps, "frames": nframes, "seconds": GUION["seconds"]}, "shots": GUION["shots"], "_sha256": GUION["_sha256"], "guion": GUION}
    elif shot == "pelicula":  # §11 «Película del proyecto» · formato «Del plano a la vivienda»: la cronología manda
        tlp = Path(arg("--timeline")).resolve(); TL = json.loads(tlp.read_bytes()); TL["_sha256"] = hashlib.sha256(tlp.read_bytes()).hexdigest()
        fps = int(TL["output"]["fps"]); nframes = int(TL["output"]["frames"])
    fr = arg("--frames"); f0, f1 = (int(x) for x in fr.split("-")) if fr else (0, nframes - 1)
    manifest = json.loads((pkg / "manifest.json").read_bytes()); cargar_materiales(pkg, manifest)
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
    crop = arg("--crop")  # x0,y0,x1,y1 en píxeles del fotograma completo (origen arriba a la izquierda): recorte nativo 1:1
    if crop:
        x0, y0, x1, y1 = (int(v) for v in crop.split(",")); sc.render.use_border = True; sc.render.use_crop_to_border = True
        sc.render.border_min_x, sc.render.border_max_x = x0 / res[0], x1 / res[0]; sc.render.border_min_y, sc.render.border_max_y = 1 - y1 / res[1], 1 - y0 / res[1]
        declared.append(f"RECORTE NATIVO {x1 - x0}×{y1 - y0} px en ({x0},{y0}) del fotograma {res[0]}×{res[1]}: misma cámara, luz y exposición que el fotograma completo")
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
    geo0 = huella_geometria()
    if arg("--realismo", "on") == "on":
        declared.extend(realismo(project, labels, light, sun, Path(arg("--tex", str(HERE.with_name("rodaje-texturas")))).resolve()))
    else:
        declared.append("realismo desactivado: materiales de color plano del visor (escena «antes»)")
    contacto(declared)
    geo1 = huella_geometria(); cambiadas = sorted(k for k in geo0 if geo1.get(k) != geo0[k]); esperadas = sorted(MT.get("contacto", []))
    integridad = {"objetosComprobados": len(geo0), "cambiados": len(cambiadas), "soloContactoDeclarado": cambiadas == esperadas,
                  "resultado": "geometría, dimensiones y posiciones intactas" if not cambiadas else ("solo las separaciones de contacto declaradas (+0,5 mm)" if cambiadas == esperadas else "CAMBIOS NO DECLARADOS: " + ", ".join(cambiadas[:8]))}
    for a in (MT["doc"] or {}).get("assignments", []):  # objetos: solicitado frente a aplicado
        t = a.get("target") or {}
        if t.get("kind") != "object":
            continue
        got = MT["objetos"].get(t.get("id")); req = a.get("requested") or {}
        piezas = (got or {}).get("piezas", {}); tok = [k for k in piezas if k.startswith("token:")]
        estado = ("declarado aplicado" if tok else "token sin receta: aproximación" if req.get("token") else
                  "representación genérica de RUBIK (sin modelo): volumen neutro" if list(piezas) == ["volumen-generico"] else
                  "aproximación por tipo y pieza") if piezas else "sin regla: color plano (reserva)"
        MT["rows"].append({"objetivo": {"tipo": "objeto", "id": t.get("id"), "tipoCatalogo": t.get("type")}, "solicitado": {k: req.get(k) for k in ("token", "source", "certainty")},
                           "aplicado": {"piezas": piezas} if piezas else None, "estado": estado, "motivo": req.get("reason")})
    tap = MT.get("tapiceria", [])
    tapiceria = {"piezas": tap, "resumen": {k: sum(1 for x in tap if x["receta"] == k) for k in sorted({x["receta"] for x in tap})},
                 "objetos": sorted({x["objeto"] for x in tap if x["objeto"]})}
    materiales = {"documento": MT["estado"], "tapiceria": tapiceria, "orden": ["explícito", "documentado del catálogo", "aproximación por familia y pieza", "reserva visible"],
                  "asignaciones": MT["rows"], "tokensSinReceta": sorted(MT.get("tokensSinReceta", [])), "integridad": integridad, "contacto": MT.get("contactoDetalle")}
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
    elif shot == "primerplano":  # plano cercano genérico de un tipo de objeto (--target rug|sofa|…): canto, remate y trama a escala útil
        if ceilings: ceilings.hide_render = False
        if fixtures: fixtures.hide_render = False
        types = {o["id"]: o.get("type") for o in project.get("objects", []) if isinstance(o, dict)}
        tgt_t = arg("--target", "rug"); ids = [i for i, t in types.items() if t == tgt_t]
        pts = [o.matrix_world @ Vector(c) for o in bpy.data.objects if o.type == "MESH" and o.get("rubik_id") in ids[:1] for c in o.bound_box]
        if not pts:
            raise SystemExit(json.dumps({"status": "NO_SHOT", "reason": f"no hay ningún objeto de tipo {tgt_t}"}, ensure_ascii=False))
        lo = Vector([min(p[i] for p in pts) for i in range(3)]); hi = Vector([max(p[i] for p in pts) for i in range(3)]); ctr = (lo + hi) / 2
        rc = [R.centroid(r["polygon"]) for r in project["rooms"] if r.get("counted", True)]
        room_c = min((R.to_blender(c["x"], c["y"], origin, 0) for c in rc), key=lambda v: (v.x - ctr.x) ** 2 + (v.y - ctr.y) ** 2)
        d0 = ctr - room_c; d0.z = 0; d0 = d0.normalized() if d0.length > .05 else Vector((0, -1, 0))
        h0 = max(.45, (hi.z - lo.z) + .45); dg = bpy.context.evaluated_depsgraph_get(); best = None
        for k in range(8):  # ocho direcciones desde la del centro de la estancia: la primera con vista libre del canto
            d = d0.copy(); d.rotate(__import__("mathutils").Euler((0, 0, k * math.pi / 4)))
            edge = ctr.copy(); step = 0.0
            while step < 6:  # canto REAL (no la caja alineada): último punto, hacia la estancia, donde un rayo vertical toca el objeto
                q = ctr - d * step  # el rayo parte justo encima del objeto: los muebles que tenga encima no lo interrumpen
                h_, _, _, _, ho_, _ = sc.ray_cast(dg, Vector((q.x, q.y, hi.z + .004)), Vector((0, 0, -1)), distance=hi.z - lo.z + .01)
                if h_ and ho_ and ho_.get("rubik_id") in ids[:1]:
                    edge = Vector((q.x, q.y, ctr.z))
                elif step > .05:
                    break
                step += .02
            a0 = edge - d * .55 + Vector((0, 0, h0)); tgt = Vector((edge.x, edge.y, hi.z - .002)) + d * .25  # justo bajo la cara superior: el rayo debe tocar el objeto
            ok_view = True
            for t in (0, .5, 1):  # el centro y los dos lados del encuadre deben ver el objeto
                side = d.cross(Vector((0, 0, 1))) * (t - .5) * .5; q = tgt + side; v = q - a0
                hit, _, _, _, ho, _ = sc.ray_cast(dg, a0, v.normalized(), distance=v.length + .05)
                ok_view &= bool(hit and ho and ho.get("rubik_id") in ids[:1])
            up, _, _, _, _, _ = sc.ray_cast(dg, a0, Vector((0, 0, 1)), distance=.3)  # cámara no metida bajo un mueble
            if ok_view and not up:
                best = (d, edge, a0, tgt, k); break
        if not best:
            raise SystemExit(json.dumps({"status": "NO_SHOT", "reason": f"ningún punto de vista libre hacia «{tgt_t}»"}, ensure_ascii=False))
        d, edge, a0, tgt, kdir = best; a1 = a0 + d * .05 + Vector((0, 0, -.03))
        cd.lens = 50
        declared.append(f"primer plano de «{tgt_t}»: primer canto con vista libre (dirección {kdir}/8 desde el centro de la estancia) a ~0,6 m, objetivo de 50 mm (lectura de trama, remate y apoyo)")
        def pose(t):
            return a0.lerp(a1, t), tgt
    elif shot in ("detalle", "balcon"):
        if ceilings: ceilings.hide_render = False
        if fixtures: fixtures.hide_render = False
        types = {o["id"]: o.get("type") for o in project.get("objects", []) if isinstance(o, dict)}
        def centre(ids):
            pts = [o.matrix_world @ Vector(c) for o in bpy.data.objects if o.type == "MESH" and o.get("rubik_id") in ids for c in o.bound_box]
            return (Vector([min(p[i] for p in pts) for i in range(3)]) + Vector([max(p[i] for p in pts) for i in range(3)])) / 2 if pts else None
        if shot == "detalle":  # encuadre de lectura de acabados: mesa de centro con sofá y alfombra detrás
            ids = [i for i, t in types.items() if t == "coffeetable"] or [i for i, t in types.items() if t in ("sofa", "table", "dining-table")]
            sofa = centre([i for i, t in types.items() if t == "sofa"]) or centre(ids)
            tc = centre(ids[:1]); away = (tc - sofa); away.z = 0; away = away.normalized() if away.length > .01 else Vector((0, -1, 0))
            a0 = tc + away * 1.35 + Vector((0, 0, .55)); a1 = tc + away * 1.15 + Vector((0, 0, .5)); tgt = tc.lerp(sofa, .35) + Vector((0, 0, .05))
            cd.lens = 40
            declared.append("plano de detalle: mesa de centro, sofá y alfombra a 1,1–1,35 m, objetivo de 40 mm (encuadre de lectura de acabados)")
        else:  # vista directa del balcón: mobiliario exterior
            out_r = [r for r in project["rooms"] if any(k in r["id"].lower() for k in ("balcony", "terrace", "terraza", "patio"))]
            if not out_r:
                fail_msg = "el proyecto no tiene balcón o terraza identificable"; raise SystemExit(json.dumps({"status": "NO_SHOT", "reason": fail_msg}, ensure_ascii=False))
            r0 = out_r[0]; c = R.centroid(r0["polygon"]); far = max(r0["polygon"], key=lambda p: (p["x"] - c["x"]) ** 2 + (p["y"] - c["y"]) ** 2)
            a0 = R.to_blender(c["x"] + .8 * (far["x"] - c["x"]), c["y"] + .8 * (far["y"] - c["y"]), origin, 1.3)
            a1 = R.to_blender(c["x"] + .7 * (far["x"] - c["x"]), c["y"] + .7 * (far["y"] - c["y"]), origin, 1.25)
            tgt = R.to_blender(c["x"] - .6 * (far["x"] - c["x"]), c["y"] - .6 * (far["y"] - c["y"]), origin, .55); cd.lens = 20
            declared.append(f"vista directa del balcón «{labels.get(r0['id'], r0['id'])}»: cámara en su esquina a 1,3 m, objetivo de 20 mm")
        def pose(t):
            return a0.lerp(a1, t), tgt
    elif shot == "pelicula":
        pose_f = pelicula(sc, cd, cam, derived, project, labels, origin, h, TL, declared, nframes)
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
        loc, look = pose_f(f) if shot == "pelicula" else pose(t); cam.location = loc
        if shot == "pelicula":  # orientación explícita: con la cámara cenital, el norte del dibujo de RUBIK queda arriba
            from mathutils import Matrix
            zc = (loc - look).normalized(); k = min(1.0, max(0.0, (0.985 - zc.z) / 0.25)); k = k * k * (3 - 2 * k)
            hint = (Vector((0, 1, 0)) * (1 - k) + Vector((0, 0, 1)) * k).normalized(); xc = hint.cross(zc)
            xc = xc.normalized() if xc.length > 1e-6 else Vector((1, 0, 0)); yc = zc.cross(xc)
            cam.rotation_euler = Matrix((xc, yc, zc)).transposed().to_euler()
        else:
            cam.rotation_euler = (look - loc).to_track_quat("-Z", "Y").to_euler()
        cam.keyframe_insert("location", frame=f); cam.keyframe_insert("rotation_euler", frame=f)
    if shot == "pelicula":  # velocidad angular de la mirada (auditoría: giro brusco al entrar); se declara el máximo por tramo
        dirs = [(lambda L, T: (T - L).normalized())(*pose_f(f)) for f in range(nframes)]
        vel = [math.degrees(dirs[f].angle(dirs[f + 1])) * fps if dirs[f].length and dirs[f + 1].length else 0 for f in range(nframes - 1)]
        for x in TL["shots"]:
            a, b = x["frames"]; seg = vel[a:min(b, nframes - 2) + 1] or [0]
            declared.append(f"mirada · tramo «{x['id']}» ({x['seconds'][0]}–{x['seconds'][1]} s): giro máximo {max(seg):.1f}°/s")
    if shot == "pelicula":  # al final de la película todo está en su sitio: huella = escena de entrada
        sc.frame_set(nframes - 1); geo2 = huella_geometria(); dif = sorted(k for k in geo0 if geo2.get(k) != geo1.get(k))
        integridad["finalPelicula"] = {"fotograma": nframes - 1, "cambiados": len(dif), "resultado": "posiciones y dimensiones finales = escena de entrada" if not dif else "DIFERENCIAS: " + ", ".join(dif[:8])}
        sc.frame_set(0)
    inv = inventario(sc, cam, project)
    out.mkdir(parents=True, exist_ok=True)
    pend = [r for r in inv if r.get("aviso")] + [r for r in materiales["asignaciones"] if r["objetivo"]["tipo"] == "suelo" and r["estado"].startswith("reserva")]
    # Tapicería sin su textura verificada: la reserva procedimental es legible, pero no es el acabado de entrega.
    pend += [{"id": oid, "motivo": "tapicería sin su textura de tejido verificada: receta procedimental de reserva"}
             for oid in sorted({x["objeto"] for x in materiales["tapiceria"]["piezas"] if x["recurso"] == "procedimental" and x["objeto"]})]
    pre = {"format": "rubik-sota.blender-preflight", "version": "1.0.0", "profile": pname, "shot": shot, "light": light, "materiales": materiales,
           "inventario": inv, "veredicto": ("Acabado pendiente de revisión" if pend else "Listo para revisión visual"),
           "pendientes": [{"id": r.get("id") or r["objetivo"].get("id"), "motivo": r.get("aviso") or r.get("motivo") or r.get("estado")} for r in pend],
           "nota": "El render de revisión puede continuar con estas limitaciones visibles; la entrega final exige resolverlas o aceptarlas."}
    (out / "preflight.json").write_text(json.dumps(pre, ensure_ascii=False, indent=1))
    if flag("--preflight"):
        print(json.dumps({"preflight": pre["veredicto"], "pendientes": len(pre["pendientes"]), "integridad": materiales["integridad"]["resultado"]}, ensure_ascii=False)); return
    fdir = out / "frames"; fdir.mkdir(exist_ok=True)
    rep_path = out / "rodaje-report.json"
    rep = json.loads(rep_path.read_text()) if rep_path.exists() else {"frames": {}}
    rep.update({"format": "rubik-sota.blender-rodaje", "version": "1.0.0", "profile": pname, "resolution": res, "samples": samples,
                "shot": shot, "light": light, "inventario": inv, "fps": fps, "frameCount": nframes, "declared": declared, "materiales": materiales,
                "equipment": {"device": "CPU", "cpu": cpu_model(), "logicalCpus": os.cpu_count(), "ramGb": ram_gb(), "gpu": None,
                              "blender": bpy.app.version_string, "cycles": bpy.app.version_string, "os": platform.platform()},
                "package": {"manifestSha256": hashlib.sha256((pkg / "manifest.json").read_bytes()).hexdigest()},
                **({"guion": ({"efecto": GUION["effect"], "perfil": pname, "segundos": GUION["seconds"], "fotogramas": GUION["frames"], "revision": GUION.get("revision"), "sha256": GUION["_sha256"]} if GUION else None),
                "pelicula": {"modulo": "Película del proyecto", "formato": ("Maqueta abierta" if GUION else "Del plano a la vivienda"), "timelineSha256": TL["_sha256"],
                                 "planos": [{k: x.get(k) for k in ("id", "seconds", "frames", "camera")} for x in TL["shots"]], "omisiones": TL.get("omissions", []),
                                 "conciliacion": TL.get("reconcile"), "audio": None}} if TL else {}),
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
