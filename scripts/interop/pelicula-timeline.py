#!/usr/bin/env python3
"""§11 Película del proyecto · formato «Del plano a la vivienda» · cronología y anexo de report (primer corte 720p, sin sonido).

Python puro (sin bpy): lee el manifest.json del ZIP «Escena para Blender» exportado por RUBIK (`rubik-sota.scene-delivery`)
y escribe `pelicula-timeline.json` con los 7 planos del storyboard aprobado para revisión
(docs/qa/pelicula-proyecto/README.md), sus rangos de fotogramas y los grupos de aparición por `rubik_role` QUE EXISTEN en el ZIP.
Lo ausente se omite y se registra; ninguna cifra sale en un rótulo sin su fuente. El kit de rodaje (blender-rodaje.py) lee
este archivo para cámara y tiempos dentro de RUBIK_derived; la escena de entrada no se modifica.

Estructura adaptada (no copiada) del donante MIT `blueprint-A-pen-…` @ 2d3463e4 (`houses/courtyard/timeline.json`:
cronología por sistemas con fases y filas de aparición).

Uso:
  python3 pelicula-timeline.py MANIFEST.json OUT.json [--zip-sha256 HEX] [--area "87,18 m²" --area-source "Ficha de superficies"]
                                [--fps 24] [--width 1280 --height 720]
"""
import argparse, hashlib, json, sys

SCHEMA = "rubik-sota.pelicula-timeline"
VERSION = "1.1.0"
# (id, inicio s, fin s, cámara, grupos que aparecen en el plano, rótulo)
SHOTS = [  # 30 s · v1.1 (auditoría del propietario 27/11 sobre f4e75386): arranque más corto, etapas separadas de la órbita,
    # entrada más larga y tendida, y final con movimiento lento en lugar de 5 s casi fijos
    ("plan", 0.0, 2.5, "cenital: planta legible con rótulos de estancia (arranca a moverse a los 2,5 s)", ["room"], "project"),
    ("floors", 2.5, 5.0, "del cenital a la diagonal (continuidad de cámara)", [], "rooms"),
    ("walls", 5.0, 10.0, "órbita corta y lenta mientras los muros crecen desde su huella", ["wall"], "walls"),
    ("openings", 10.0, 13.0, "órbita casi detenida: los huecos se leen", ["opening", "opening-leaf"], "openings"),
    ("furniture", 13.0, 17.0, "acercamiento oblicuo a la estancia principal", ["object"], None),
    ("enter", 17.0, 24.5, "planeo tendido hacia la estancia hasta la altura de los ojos, con la pared del fondo siempre a la vista", [], None),
    ("living", 24.5, 30.0, "avance lento y paneo suave dentro de la estancia", [], "studio"),
]
# Roles que la película no anima y por qué (se registran como omisiones, nunca se esconden en silencio).
NOT_ANIMATED = {"ceiling": "techo oculto en los planos exteriores; aparece cuando la cámara ya está dentro de la estancia (por encima del encuadre); solo lo ve la cámara: no proyecta sombra ni rebota, la luz no cambia al entrar (v1.1)",
                "fixture": "luminarias de techo: aparecen con el techo, al entrar (no flotan en los planos exteriores)"}
EXPECTED = ["room", "wall", "opening", "opening-leaf", "object"]


def glb_entities(glb_bytes):
    """rubik_id distintos por rubik_role en el JSON del GLB (lo que se verá en pantalla), y mallas por rol."""
    import struct
    n = struct.unpack("<I", glb_bytes[12:16])[0]; j = json.loads(glb_bytes[20:20 + n])
    ids, meshes = {}, {}
    for node in j.get("nodes", []):
        e = node.get("extras") or {}; r = e.get("rubik_role")
        if not r or r == "camera": continue
        meshes[r] = meshes.get(r, 0) + 1
        if e.get("rubik_id"): ids.setdefault(r, set()).add(e["rubik_id"])
    return {r: sorted(v) for r, v in ids.items()}, meshes


PROJECT_KEYS = {"room": "rooms", "wall": "walls", "opening": "openings", "object": "furniture"}


def build(manifest, *, zip_sha256=None, area=None, area_source=None, fps=24, width=1280, height=720, glb=None, project=None):
    if manifest.get("format") != "rubik-sota.scene-delivery":
        raise ValueError("manifest: formato inesperado (se espera rubik-sota.scene-delivery)")
    scene = manifest.get("scene") or {}
    roles = (scene.get("stats") or {}).get("roles") or {}
    present = {r: n for r, n in roles.items() if isinstance(n, int) and n > 0}
    omissions = [{"role": r, "reason": "no existe en el ZIP"} for r in EXPECTED if r not in present]
    omissions += [{"role": r, "reason": why, "count": present[r]} for r, why in NOT_ANIMATED.items() if r in present]
    unknown = sorted(r for r in present if r not in EXPECTED and r not in NOT_ANIMATED)
    omissions += [{"role": r, "reason": "rol sin regla de aparición: visible desde el inicio", "count": present[r]} for r in unknown]
    ent, meshes = glb_entities(glb) if glb else ({}, {})
    # Rótulos: ENTIDADES (rubik_id distintos del GLB), nunca mallas. Sin GLB no hay cifra.
    labels_src = {k: (w, len(ent[r]) if r in ent else None, f"scene.glb · rubik_id distintos con rubik_role={r}")
                  for k, w, r in [("rooms", "estancias", "room"), ("walls", "muros", "wall"), ("openings", "huecos", "opening")]}
    reconcile = []
    if project is not None:
        pr = project.get("project", project)
        for role, key in PROJECT_KEYS.items():
            if key not in pr: continue
            pid = sorted(x.get("id") for x in pr[key] if isinstance(x, dict) and x.get("id"))
            inglb = set(ent.get(role, []))
            reconcile.append({"role": role, "project": len(pid), "glbEntities": len(inglb), "glbMeshes": meshes.get(role, 0),
                              "manifestMeshes": present.get(role, 0), "missingInScene": [i for i in pid if i not in inglb],
                              "notInProject": sorted(i for i in inglb if i not in pid)})
    shots, f0 = [], 0
    for sid, t0, t1, cam, groups, label in SHOTS:
        a, b = round(t0 * fps), round(t1 * fps) - 1
        g = [{"role": r, "meshes": present[r], "rubikIds": ent.get(r, [])} for r in groups if r in present]
        missing = [r for r in groups if r not in present]
        lab = None
        if label == "project":
            lab = {"text": "nombre del proyecto", "source": "manifest.source.projectId"}
            if area and area_source:
                lab = {"text": f"nombre del proyecto · {area}", "source": f"manifest.source.projectId · {area_source}"}
        elif label in labels_src:
            word, n, src = labels_src[label]
            lab = {"text": f"{n} {word}", "source": src} if n else None
        elif label == "studio":
            lab = {"text": "logo de Mi estudio (si el profesional lo elige)", "source": "Mi estudio · opcional"}
        shots.append({"id": sid, "seconds": [t0, t1], "frames": [a, b], "camera": cam, "appear": g,
                      "skippedGroups": missing, "label": lab})
        f0 = b + 1
    return {
        "schema": SCHEMA, "version": VERSION,
        "output": {"width": width, "height": height, "fps": fps, "frames": f0, "seconds": f0 / fps, "audio": None},
        "input": {"format": manifest.get("format"), "version": manifest.get("version"),
                  "projectId": (manifest.get("source") or {}).get("projectId"),
                  "observedProjectSha256": (manifest.get("source") or {}).get("observedProjectSha256"),
                  "sceneGlbSha256": ((manifest.get("files") or {}).get("scene.glb") or {}).get("sha256"),
                  "zipSha256": zip_sha256, "bounds": (scene.get("stats") or {}).get("bounds"), "units": scene.get("units")},
        "groups": [{"role": r, "count": present[r]} for r in EXPECTED if r in present],
        "shots": shots, "omissions": omissions, "reconcile": reconcile,
        "approximations": [], "derived": "RUBIK_derived · cámara, tiempos, luz editorial y rótulos; la escena de entrada no se escribe",
        "check": "al cerrar, huella de geometría y posiciones finales = escena de entrada (blender-rodaje.py)",
        "donor": {"repo": "Juanmaes83/blueprint-A-pen-sketch-a-floor-plan-or-3-references-", "commit": "2d3463e4", "license": "MIT",
                  "reused": "estructura de cronología por sistemas (adaptada); sin código, texturas, música ni modelos"},
    }


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("manifest"); ap.add_argument("out")
    ap.add_argument("--zip-sha256"); ap.add_argument("--zip", help="ruta del ZIP para calcular su huella")
    ap.add_argument("--area"); ap.add_argument("--area-source")
    ap.add_argument("--glb", help="scene.glb del ZIP: rótulos por entidad y lista de rubik_id por grupo")
    ap.add_argument("--project", help="project.json del ZIP: conciliación proyecto ↔ escena")
    ap.add_argument("--fps", type=int, default=24); ap.add_argument("--width", type=int, default=1280); ap.add_argument("--height", type=int, default=720)
    a = ap.parse_args(argv)
    sha = a.zip_sha256
    if a.zip:
        h = hashlib.sha256()
        with open(a.zip, "rb") as f:
            for chunk in iter(lambda: f.read(1 << 20), b""): h.update(chunk)
        sha = h.hexdigest()
    with open(a.manifest, encoding="utf-8") as f: m = json.load(f)
    glb = open(a.glb, "rb").read() if a.glb else None
    prj = json.load(open(a.project, encoding="utf-8")) if a.project else None
    t = build(m, zip_sha256=sha, area=a.area, area_source=a.area_source, fps=a.fps, width=a.width, height=a.height, glb=glb, project=prj)
    with open(a.out, "w", encoding="utf-8") as f: json.dump(t, f, ensure_ascii=False, indent=2)
    print(f"{a.out}: {len(t['shots'])} planos · {t['output']['frames']} fotogramas a {a.fps} fps · omisiones {len(t['omissions'])}")


if __name__ == "__main__":
    sys.exit(main())
