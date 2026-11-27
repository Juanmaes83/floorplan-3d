# SPDX-License-Identifier: GPL-3.0-or-later
"""Comprobación reproducible de la receta de tapicería v3 del kit de Blender (sin render: --preflight).

python3 scripts/interop/rodaje-tapiceria-check.py KIT-DIR OUT-DIR [--blender RUTA]
  KIT-DIR: ZIP de RUBIK › Entregar › Escena para Blender descomprimido, con escena-preparada/ y rodaje-texturas/ verificadas,
  de un proyecto con mobiliario tapizado (p. ej. f5-furniture o f2-rot30).
Variantes (cada una en una copia; el KIT-DIR no se toca):
  A actual · B ZIP anterior (sin rubik-materiales.json) · E textura de tejido ausente · D cuero explícito en un sofá.
Escribe OUT-DIR/resultado.json y sale con 1 si alguna comprobación falla.
"""
import hashlib, json, os, shutil, subprocess, sys
from pathlib import Path

a = [x for x in sys.argv[1:] if not x.startswith("--")]
kit, out = Path(a[0]).resolve(), Path(a[1]).resolve()
bl = sys.argv[sys.argv.index("--blender") + 1] if "--blender" in sys.argv else os.environ.get("BLENDER", "blender")
out.mkdir(parents=True, exist_ok=False)
J = lambda p: json.loads(Path(p).read_text(encoding="utf8"))
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()

def variant(name, edit):
    d = out / name
    shutil.copytree(kit, d, ignore=shutil.ignore_patterns("resultados", "rodaje-texturas", "escena-preparada", "cmp", "tap", "mov", "k-*.py"))
    os.symlink(kit / "escena-preparada", d / "escena-preparada"); tex = d / "rodaje-texturas"; shutil.copytree(kit / "rodaje-texturas", tex)
    edit(d)
    r = subprocess.run([bl, "--background", "--factory-startup", "--python-exit-code", "1", "--python", str(d / "rubik_blender_rodaje.py"), "--",
                        str(d / "escena-preparada"), str(d), str(d / "pf"), "--profile", "revision", "--shot", "interior", "--tex", str(tex), "--preflight"],
                       capture_output=True, text=True)
    if r.returncode:
        raise SystemExit(f"{name}: rodaje falló\n{r.stdout[-2000:]}\n{r.stderr[-2000:]}")
    return J(d / "pf" / "preflight.json")

def set_materials(d, doc):
    p = d / "rubik-materiales.json"; p.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + "\n", encoding="utf8")
    m = J(d / "manifest.json"); m["files"]["rubik-materiales.json"] = {"bytes": p.stat().st_size, "sha256": sha(p)}
    (d / "manifest.json").write_text(json.dumps(m, indent=1) + "\n")

def old_zip(d):
    (d / "rubik-materiales.json").unlink(); m = J(d / "manifest.json"); m["files"].pop("rubik-materiales.json", None)
    (d / "manifest.json").write_text(json.dumps(m, indent=1) + "\n")

def no_fabric(d):
    for f in (d / "rodaje-texturas").glob("rough_linen_*"):
        f.unlink()

SOFA = {}
def leather(d):
    doc = J(d / "rubik-materiales.json")
    sofas = [x for x in doc["assignments"] if x["target"].get("kind") == "object" and x["target"].get("type") == "sofa"]
    SOFA["id"] = sofas[0]["target"]["id"]
    sofas[0]["requested"] = {"token": "material.leather.natural.aniline", "source": "explicit", "certainty": "declared", "reason": None}
    set_materials(d, doc)

checks = []
def chk(name, ok, detail=""):
    checks.append({"comprobacion": name, "ok": bool(ok), "detalle": detail})
tap = lambda pf: pf["materiales"]["tapiceria"]

A = variant("A-actual", lambda d: None); ta = tap(A)
tex = [x for x in ta["piezas"] if x["familia"] != "cuero"]
chk("A · la receta llega sola a las piezas tapizadas del proyecto (sin asignar a mano)", len(ta["piezas"]) > 0 and len(ta["objetos"]) >= 2, json.dumps(ta["resumen"]))
chk("A · tejido con su escaneo a escala física y proyección en el marco de cada pieza", tex and all(x["version"] == "v3" and x["recurso"] == "rough_linen" and x["escalaM"] and x["proyeccion"].startswith("triplanar") for x in tex))
chk("A · cada pieza declara fuente, marco y limitaciones (sin costuras en el modelo)", all(x["fuente"] and x["marcoGrados"] is not None and any("costuras" in l for l in x["limitaciones"]) for x in ta["piezas"]))
chk("A · interior y exterior se distinguen", {"tapicería interior"} <= {x["familia"] for x in ta["piezas"]}, sorted({x["familia"] for x in ta["piezas"]}))
chk("A · geometría y posiciones intactas (salvo contacto declarado)", A["materiales"]["integridad"]["soloContactoDeclarado"], A["materiales"]["integridad"]["resultado"])
B = variant("B-zip-anterior", old_zip); tb = tap(B)
chk("B · ZIP anterior: la tapicería se resuelve igual por tipo y pieza", tb["resumen"] == ta["resumen"] and B["materiales"]["documento"].startswith("ZIP sin rubik-materiales.json"), json.dumps(tb["resumen"]))
E = variant("E-tejido-ausente", no_fabric); te = tap(E)
chk("E · textura de tejido ausente: reserva procedimental legible y sustitución declarada", te["piezas"] and all(x["recurso"] == "procedimental" and any("ausente" in l for l in x["limitaciones"]) for x in te["piezas"] if x["familia"] != "cuero"))
chk("E · textura ausente: el veredicto lo dice", E["veredicto"] == "Acabado pendiente de revisión", E["veredicto"])
D = variant("D-cuero-explicito", leather); td = tap(D)
cu = [x for x in td["piezas"] if x["objeto"] == SOFA.get("id")]
chk("D · material explícito (cuero) prevalece sobre la regla en ese sofá y solo en él", cu and all(x["familia"] == "cuero" and x["fuente"].startswith("material explícito") for x in cu)
    and all(x["familia"] != "cuero" for x in td["piezas"] if x["objeto"] != SOFA.get("id")), f"{SOFA.get('id')}: {sorted({x['receta'] for x in cu})}")
res = {"format": "rubik-sota.rodaje-tapiceria-check", "version": "1.0.0", "kit": kit.name, "ok": all(c["ok"] for c in checks), "comprobaciones": checks,
       "resumenActual": ta["resumen"], "objetosActual": ta["objetos"]}
(out / "resultado.json").write_text(json.dumps(res, ensure_ascii=False, indent=1))
print(json.dumps({"ok": res["ok"], "pasan": sum(c["ok"] for c in checks), "de": len(checks)}, ensure_ascii=False))
for c in checks:
    print(("PASS " if c["ok"] else "FAIL ") + c["comprobacion"] + ("" if c["ok"] else " · " + str(c["detalle"])))
sys.exit(0 if res["ok"] else 1)
