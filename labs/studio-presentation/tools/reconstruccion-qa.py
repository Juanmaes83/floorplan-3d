"""Compara dos reconstrucciones con la salida incluida en el ZIP del laboratorio."""

import hashlib
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path, PurePosixPath


def sha(data):
    return hashlib.sha256(data).hexdigest()


def read_json(path):
    return json.loads(path.read_bytes())


def inventory(root):
    files = {p.relative_to(root).as_posix(): p for p in root.rglob("*") if p.is_file()}
    if not files:
        raise ValueError(f"Inventario vacío: {root.name}")
    return files


def validate_registry(reg, files):
    declared = {"entrega.json"}
    for item, field in [(p, "file") for p in (reg["web"] + reg["pieces"])]:
        name = item[field]
        normalized = PurePosixPath(name)
        if normalized.as_posix() != name or normalized.is_absolute() or ".." in normalized.parts:
            raise ValueError(f"Ruta no canónica en registro: {name}")
        if name in declared or name not in files or sha(files[name].read_bytes()) != item["sha256"]:
            raise ValueError(f"Pieza ausente, duplicada o alterada: {name}")
        declared.add(name)
    if declared != files.keys():
        raise ValueError(f"Archivos fuera del registro: {sorted(files.keys() - declared)}")


PDF_DATE = re.compile(rb"/(CreationDate|ModDate) \(D:[0-9]{14}(?:Z|[+-][0-9]{2}'[0-9]{2}')\)")


def pdf_evidence(path, temp):
    raw = path.read_bytes()
    # Solo neutraliza las fechas PDF de Chromium, conservando longitud y offsets.
    canonical = PDF_DATE.sub(
        lambda m: re.sub(rb"[0-9]", b"0", m[0]), raw
    )
    info = subprocess.check_output(["pdfinfo", path], env={"LC_ALL": "C"})
    pages = int(re.search(rb"^Pages:\s+(\d+)$", info, re.M)[1])
    text = subprocess.check_output(["pdftotext", "-layout", path, "-"])
    with tempfile.TemporaryDirectory(dir=temp) as rasters:
        prefix = Path(rasters) / "page"
        subprocess.run(["pdftoppm", "-r", "110", "-png", path, prefix], check=True)
        rendered = sorted(Path(rasters).glob("page-*.png"))
        if len(rendered) != pages:
            raise ValueError(f"Número incorrecto de páginas rasterizadas: {path.name}")
        visual = sha(b"".join(bytes.fromhex(sha(p.read_bytes())) for p in rendered))
    return dict(sha256=sha(raw), sha256SinFechas=sha(canonical), paginas=pages,
                textoSha256=sha(text), renderSha256=visual)


def qa_problems(qa):
    failures = []
    if qa.get("blocked") or not qa["en"]["on"] or qa["en"]["blocked"]:
        failures.append("composición o inglés bloqueado")
    if not qa["docs"] or not qa["entregaWeb"]:
        failures.append("faltan documentos o modalidades")
    for name, doc in qa["docs"].items():
        checks = ("overflowCount", "textOverlapCount", "spillCount", "svgClipCount",
                  "tagOverlaps", "blockOverlaps", "external", "errors")
        if (any(doc[key] for key in checks) or not doc["flow"]["ok"]
                or doc["lint"] is None or doc["lint"]["red"]
                or (doc["pdfRows"] and not doc["pdfRows"]["ok"])):
            failures.append(name)
    return failures


def compare(run, report):
    roots = {"a": run / "out-a", "b": run / "out-b", "paquete": run / "a/out/v3"}
    snapshots = {"a": run / "a", "b": run / "b", "paquete": run / "a"}
    errors = report["errores"]
    qa = {name: read_json(root / "qa.json") for name, root in roots.items()}
    delivery = {name: inventory(root / "entrega") for name, root in roots.items()}
    professional = {name: inventory(root / "profesional") for name, root in roots.items()}
    regs = {name: read_json(files["entrega.json"]) for name, files in delivery.items()}
    report["qaProblemas"] = {name: qa_problems(q) for name, q in qa.items()}
    if any(report["qaProblemas"].values()):
        errors.append("Problemas de QA")
    report["idiomas"] = {name: reg["idiomas"] for name, reg in regs.items()}
    if any(sorted(ls) != ["en", "es"] for ls in report["idiomas"].values()):
        errors.append("La entrega debe acreditar ES y EN")
    report["snapshot"] = {}
    for name, reg in regs.items():
        validate_registry(reg, delivery[name])
        actual = sha((snapshots[name] / "snapshot/snapshot.json").read_bytes())
        report["snapshot"][name] = actual
        if reg["snapshot"] != {"file": "snapshot/snapshot.json", "sha256": actual}:
            errors.append(f"Registro y snapshot distintos: {name}")
    if len(set(report["snapshot"].values())) != 1:
        errors.append("Las reconstrucciones usan un snapshot distinto del paquete")

    all_files = {}
    for name, root in roots.items():
        pdfs = {p.name: p for p in root.glob("*.pdf")}
        if not pdfs or set(pdfs) != {doc + ".pdf" for doc in qa[name]["docs"]}:
            errors.append(f"El conjunto de PDF no coincide con QA: {name}")
        all_files[name] = {**pdfs, **{f"entrega/{k}": v for k, v in delivery[name].items()},
                           **{f"profesional/{k}": v for k, v in professional[name].items()}}
    original = all_files["paquete"]
    report["archivos"] = {name: sorted(files) for name, files in all_files.items()}
    for name in ("a", "b"):
        missing = original.keys() - all_files[name].keys()
        extra = all_files[name].keys() - original.keys()
        if missing or extra:
            errors.append(f"Inventario {name}: faltan {sorted(missing)}, sobran {sorted(extra)}")

    report["pdf"] = {}
    report["medios"] = {}
    pdf_cache = {}
    for location in sorted(set.intersection(*(set(files) for files in all_files.values()))):
        files = {name: files[location] for name, files in all_files.items()}
        hashes = {name: sha(p.read_bytes()) for name, p in files.items()}
        if location.endswith(".pdf"):
            facts = {}
            for name, p in files.items():
                digest = hashes[name]
                if digest not in pdf_cache:
                    pdf_cache[digest] = pdf_evidence(p, run)
                facts[name] = pdf_cache[digest]
            canonical = len({f["sha256SinFechas"] for f in facts.values()}) == 1
            text = len({(f["paginas"], f["textoSha256"]) for f in facts.values()}) == 1
            visual = len({f["renderSha256"] for f in facts.values()}) == 1
            report["pdf"][location] = dict(binario=len(set(hashes.values())) == 1,
                                          sinFechas=canonical, texto=text, visual=visual, huellas=facts)
            if not (canonical and text and visual):
                errors.append(f"PDF distinto: {location}")
        elif location != "entrega/entrega.json" and location != "profesional/preparar-entrega.html":
            if location.startswith("entrega/media/"):
                report["medios"][location] = hashes
            if len(set(hashes.values())) != 1:
                errors.append(f"Bytes distintos: {location}")

    # Los registros se verificaron contra cada pieza. La fecha de composición y
    # las huellas de PDF equivalentes son las únicas variaciones de publicación.
    normalized = {}
    for name, reg in regs.items():
        reg.pop("generated")
        for p in reg["pieces"]:
            if p["file"].endswith(".pdf"):
                p["sha256"] = pdf_cache[p["sha256"]]["sha256SinFechas"]
        normalized[name] = json.dumps(reg, sort_keys=True)
    if len(set(normalized.values())) != 1:
        errors.append("Registros distintos tras cotejar PDF y fecha")

    preparers = {}
    for name, files in professional.items():
        raw = files["preparar-entrega.html"].read_bytes()
        for entry in report["pdf"].values():
            fact = entry["huellas"][name]
            for length in (64, 16):
                raw = raw.replace(fact["sha256"][:length].encode(), fact["sha256SinFechas"][:length].encode())
        preparers[name] = sha(raw)
    report["preparadorSha256Normalizado"] = preparers
    if len(set(preparers.values())) != 1:
        errors.append("Preparadores distintos tras cotejar las huellas de PDF")


if __name__ == "__main__":
    run, output = map(Path, sys.argv[1:3])
    result = {"zipSha256": sys.argv[3], "resolucionVisualDpi": 110, "errores": []}
    try:
        compare(run, result)
    except (OSError, ValueError, KeyError, TypeError, subprocess.SubprocessError) as exc:
        result["errores"].append(str(exc))
    result["ok"] = not result["errores"]
    output.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"PDF comparados: {len(result.get('pdf', {}))}. Resultado: {'PASS' if result['ok'] else 'FAIL'}")
    for error in result["errores"]:
        print(error)
    sys.exit(0 if result["ok"] else 2)
