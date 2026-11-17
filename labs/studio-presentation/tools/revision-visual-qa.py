"""Rasteriza el candidato y compara cada página con los PDF distribuidos de la baseline."""

import hashlib
import html
import json
import subprocess
import sys
import tempfile
from pathlib import Path


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def render(pdf, output):
    output.mkdir(parents=True, exist_ok=True)
    subprocess.run(["pdftoppm", "-r", "110", "-png", pdf, output / "pagina"], check=True)
    pages = sorted(output.glob("pagina-*.png"))
    if not pages:
        raise ValueError(f"PDF vacío: {pdf.name}")
    return pages


if __name__ == "__main__":
    baseline, candidate, review = map(Path, sys.argv[1:4])
    review.mkdir(parents=True, exist_ok=True)
    docs = sorted(candidate.glob("*.pdf"))
    results = []
    index = []
    with tempfile.TemporaryDirectory() as temp:
        for doc in docs:
            older = baseline / doc.name
            proof = dict(archivo=doc.name, sha256=sha(doc), baseline=sha(older) if older.is_file() else None,
                         paginas=[])
            target = review / doc.stem
            new = render(doc, target)
            old = render(older, Path(temp) / doc.stem) if older.is_file() else []
            index.append(f"<h2>{html.escape(doc.stem)}</h2><ol>")
            for page_num, page in enumerate(new, 1):
                digest = sha(page)
                previous = sha(old[page_num-1]) if page_num <= len(old) else None
                status = "equivalente" if digest == previous else "modificada" if previous else "nueva"
                proof["paginas"].append(dict(pagina=page_num, rasterSha256=digest, anterior=previous, estado=status))
                url = html.escape(page.relative_to(review).as_posix(), quote=True)
                index.append(f'<li><a href="{url}">Página {page_num}</a> · {status}</li>')
            proof["paginasRetiradas"] = max(0, len(old)-len(new))
            results.append(proof)
            index.append("</ol>")
    (review / "comparativa.json").write_text(
        json.dumps(dict(baselineCommit="585fd9c", dpi=110, documentos=results), ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8")
    (review / "index.html").write_text(
        '<!doctype html><html lang="es"><meta charset="utf-8"><title>Revisión visual v1.4</title>'
        '<h1>Studio Presentation · revisión visual v1.4</h1>'
        '<p>Páginas del candidato ES/EN a 110 dpi. Comparación con los PDF de 585fd9c.</p>' + "".join(index),
        encoding="utf-8")
    print(f"{len(docs)} documentos, {sum(len(d['paginas']) for d in results)} páginas")
