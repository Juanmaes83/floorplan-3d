# SPDX-License-Identifier: GPL-3.0-or-later
"""Comprobación reproducible del contrato Material Tokens en el kit de Blender (sin render: --preflight).

python3 scripts/interop/rodaje-materiales-check.py KIT-DIR OUT-DIR [--blender RUTA]
  KIT-DIR: ZIP de RUBIK › Entregar › Escena para Blender descomprimido, con escena-preparada/ y rodaje-texturas/ verificadas.
Variantes (cada una en una copia, el KIT-DIR no se toca):
  A actual · B ZIP anterior (sin rubik-materiales.json) · C huella distinta · D tokens explícitos inyectados (versión futura
  del proyecto: objeto de varias piezas, token conocido y token desconocido) · E textura ausente.
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
    shutil.copytree(kit, d, ignore=shutil.ignore_patterns("resultados", "rodaje-texturas", "escena-preparada"))
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

def tamper(d):
    p = d / "rubik-materiales.json"; p.write_text(p.read_text(encoding="utf8").replace("material.wood.oak.natural", "material.wood.walnut.satin"), encoding="utf8")

def inject(d):
    doc = J(d / "rubik-materiales.json")
    for x in doc["assignments"]:
        tok = {"obj_design-table": "material.wood.walnut.satin", "obj_unknown-ref": "material.leather.natural.aniline", "obj_catalog-bench": "material.unobtainium.alloy.x"}.get(x["target"]["id"])
        if tok:
            x["requested"] = {"token": tok, "source": "explicit", "certainty": "declared", "reason": None}
    set_materials(d, doc)

def no_oak(d):
    for f in (d / "rodaje-texturas").glob("oak_wood_planks_*"):
        f.unlink()

checks = []
def chk(name, ok, detail=""):
    checks.append({"comprobacion": name, "ok": bool(ok), "detalle": detail})

rows = lambda pf: {(r["objetivo"]["tipo"], r["objetivo"]["id"]): r for r in pf["materiales"]["asignaciones"]}
A = variant("A-actual", lambda d: None); ra = rows(A)
chk("A · se lee el contrato", A["materiales"]["documento"].startswith("Material Tokens"), A["materiales"]["documento"])
chk("A · suelo del salón: selección explícita del catálogo aplicada", ra[("suelo", "rom_living")]["estado"] == "declarado aplicado", ra[("suelo", "rom_living")]["estado"])
chk("A · suelo del estudio sin identidad: aproximación declarada", ra[("suelo", "rom_study")]["estado"] == "aproximación", ra[("suelo", "rom_study")]["estado"])
chk("A · objetos sin material declarado: aproximación por tipo y pieza", ra[("objeto", "obj_design-table")]["estado"] == "aproximación por tipo y pieza")
chk("A · geometría y posiciones intactas (salvo contacto declarado)", A["materiales"]["integridad"]["soloContactoDeclarado"], A["materiales"]["integridad"]["resultado"])
B = variant("B-zip-anterior", old_zip)
chk("B · ZIP anterior: abre y explica hasta dónde llega", B["materiales"]["documento"].startswith("ZIP sin rubik-materiales.json"), B["materiales"]["documento"])
chk("B · ZIP anterior: los suelos siguen resolviéndose por material/familia", rows(B)[("suelo", "rom_living")]["aplicado"] is not None)
C = variant("C-huella-distinta", tamper)
chk("C · huella distinta: se ignora el documento y se dice", "huella distinta" in C["materiales"]["documento"], C["materiales"]["documento"])
D = variant("D-tokens-explicitos", inject); rd = rows(D)
mesa, mueble, banco = rd[("objeto", "obj_design-table")], rd[("objeto", "obj_unknown-ref")], rd[("objeto", "obj_catalog-bench")]
chk("D · token explícito prevalece sobre la regla (mesa → nogal)", mesa["estado"] == "declarado aplicado" and "token:material.wood.walnut.satin" in mesa["aplicado"]["piezas"], json.dumps(mesa["aplicado"]))
chk("D · objeto de varias piezas: todas las piezas no vidrio reciben el token", mueble["estado"] == "declarado aplicado" and list(mueble["aplicado"]["piezas"]) == ["token:material.leather.natural.aniline"], json.dumps(mueble["aplicado"]))
chk("D · token desconocido: aproximación declarada, nunca un material inventado", banco["estado"] == "token sin receta: aproximación" and "material.unobtainium.alloy.x" in D["materiales"]["tokensSinReceta"], banco["estado"])
chk("D · integridad también con tokens", D["materiales"]["integridad"]["soloContactoDeclarado"])
E = variant("E-textura-ausente", no_oak); re_ = rows(E)
chk("E · textura ausente: reserva visible (color plano) y veredicto pendiente", re_[("suelo", "rom_living")]["estado"].startswith("reserva") and E["veredicto"] == "Acabado pendiente de revisión", re_[("suelo", "rom_living")]["estado"] + " · " + E["veredicto"])
res = {"format": "rubik-sota.rodaje-materiales-check", "version": "1.0.0", "kit": str(kit), "ok": all(c["ok"] for c in checks), "comprobaciones": checks}
(out / "resultado.json").write_text(json.dumps(res, ensure_ascii=False, indent=1))
print(json.dumps({"ok": res["ok"], "pasan": sum(c["ok"] for c in checks), "de": len(checks)}, ensure_ascii=False))
for c in checks:
    print(("PASS " if c["ok"] else "FAIL ") + c["comprobacion"] + ("" if c["ok"] else " · " + str(c["detalle"])))
sys.exit(0 if res["ok"] else 1)
