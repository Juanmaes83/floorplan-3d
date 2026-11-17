"""Comprueba navegación y cuerpos tipográficos del Architecture Book impreso."""

import hashlib
import json
import math
import subprocess
import sys
from pathlib import Path

from pypdf import PdfReader


def spans(page):
    result = []

    def visit(text, ctm, tm, font, size):
        if not text.strip():
            return
        horizontal = math.hypot(tm[0] * ctm[0] + tm[1] * ctm[2],
                                tm[0] * ctm[1] + tm[1] * ctm[3])
        result.append((text.strip(), size * horizontal, ctm[4]))

    page.extract_text(visitor_text=visit)
    return result


def audit(path, expected, lang):
    reader = PdfReader(path)
    general = expected["indice"][0]["page"] - 1
    spans_on_plan = spans(reader.pages[general])
    scale = next(x for x in spans_on_plan if x[0] == "m" and x[2] > 0)
    scale_labels = [size for _, size, x in spans_on_plan if x == scale[2]]
    plan_labels = [size for _, size, x in spans_on_plan if 0 < x != scale[2]]
    footer_prefix = "Revisión rv" if lang == "es" else "Revision rv"
    footers = [size for page in reader.pages for text, size, _ in spans(page)
               if text.startswith(footer_prefix)]
    links = {str(annotation.get_object()["/Dest"]).lstrip("/")
             for annotation in reader.pages[1].get("/Annots", [])}
    text = subprocess.check_output(["pdftotext", "-layout", path, "-"]).decode()
    pages = text.split("\f")
    destinations = {}
    for sheet in expected["indice"]:
        code = sheet["code"]
        target = reader.named_destinations.get("/" + code) or reader.named_destinations[code]
        page = reader.get_destination_page_number(target) + 1
        destinations[code] = page
        if code not in links or page != sheet["page"] or code not in pages[page - 1]:
            raise ValueError(f"{lang}: índice o cajetín incoherente para {code}")
    categories = [row[0] for row in expected["correspondencia"]]
    if categories != [f"A-{i:02}" for i in range(1, 9)] or not all(k in pages[1] for k in categories):
        raise ValueError(f"{lang}: tabla A-01–A-08 incompleta en el PDF")
    if len(scale_labels) != 4 or min(scale_labels) < 9 or not plan_labels or min(plan_labels) < 9:
        raise ValueError(f"{lang}: escala o rótulos por debajo de 9 pt efectivos")
    if len(footers) != len(reader.pages) or min(footers) < 8.99:
        raise ValueError(f"{lang}: falta un pie o su texto es inferior a 9 pt")
    return dict(sha256=hashlib.sha256(path.read_bytes()).hexdigest(), paginas=len(reader.pages),
                indice=destinations, escalaPt=[round(x, 2) for x in scale_labels],
                rotuloMinPt=round(min(plan_labels), 2), pieMinPt=round(min(footers), 2))


if __name__ == "__main__":
    root, output = map(Path, sys.argv[1:3])
    qa = json.loads((root / "qa.json").read_text(encoding="utf-8"))
    book = qa["meta"]["architecture-book"]
    if len(book["indice"]) != book["laminas"] or len(set(s["code"] for s in book["indice"])) != book["laminas"]:
        raise SystemExit("Códigos de lámina duplicados o ausentes")
    result = {lang: audit(root / f"architecture-book{suffix}.pdf", book, lang)
              for lang, suffix in (("es", ""), ("en", ".en"))}
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("PASS Architecture Book ES/EN: destinos PDF, escala, rótulos y pies")
