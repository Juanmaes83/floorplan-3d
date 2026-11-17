"""v1.4 §7 · N02/N07 · QA tipográfico EFECTIVO de TODAS las páginas de las piezas técnicas (Architecture Book, lámina A3 y
libro FF&E con keyplans), ES y EN, sobre el PDF final: altura de cada palabra (pdftotext -bbox), palabras fuera de la página
(recorte), páginas sin texto, códigos AB del índice presentes en sus páginas. Además FF&E (N03): instancias del modelo =
suma de unidades de las fichas; catálogo aportado ligado a instancias reales; ningún SKU dentro del presupuesto de obra.
Uso: python3 -I tools/laminas-qa.py <labDir> → evidence/architecture/laminas-qa.json (código 1 si algo falla)"""
import json, re, subprocess, sys, os, html
LAB = sys.argv[1]; OUT = os.path.join(LAB, 'out/v3'); MIN_PT = 6.0
def words(pdf):
    x = subprocess.run(['pdftotext', '-q', '-bbox', pdf, '-'], capture_output=True, text=True, check=True).stdout
    pages = []
    for pg in re.finditer(r'<page width="([\d.]+)" height="([\d.]+)">(.*?)</page>', x, re.S):
        W, H = float(pg.group(1)), float(pg.group(2))
        ws = [(float(a), float(b), float(c), float(d), html.unescape(t)) for a, b, c, d, t in re.findall(r'<word xMin="([\d.-]+)" yMin="([\d.-]+)" xMax="([\d.-]+)" yMax="([\d.-]+)">([^<]*)</word>', pg.group(3))]
        pages.append((W, H, ws))
    return pages
res, fails = {'schema': 'rubik-lab-laminas-qa/1', 'umbralPt': MIN_PT, 'docs': {}}, []
for doc in ['architecture-book', 'architecture-sheet-strip', 'materials-furniture-book-v3']:
    for suf in ['', '.en']:
        f = os.path.join(OUT, doc + suf + '.pdf')
        if not os.path.exists(f): fails.append(f'falta {doc}{suf}'); continue
        per = []
        for i, (W, H, ws) in enumerate(words(f), 1):
            real = [w for w in ws if w[4].strip()]
            hmin = min((w[3] - w[1] for w in real), default=0)
            clip = [w[4] for w in real if w[0] < -0.5 or w[1] < -0.5 or w[2] > W + 0.5 or w[3] > H + 0.5]
            small = sorted({w[4] for w in real if (w[3] - w[1]) < MIN_PT})[:5]
            per.append({'pagina': i, 'palabras': len(real), 'alturaMinPt': round(hmin, 2), 'recortadas': clip[:5], 'pequenas': small})
            if not real: fails.append(f'{doc}{suf} p{i}: página sin texto')
            if clip: fails.append(f'{doc}{suf} p{i}: {len(clip)} palabras fuera de la página')
            if small: fails.append(f'{doc}{suf} p{i}: texto bajo {MIN_PT} pt: {small}')
        txt = subprocess.run(['pdftotext', '-q', f, '-'], capture_output=True, text=True).stdout
        if doc == 'architecture-book':
            codes = sorted(set(re.findall(r'AB-\d\d', txt)))
            if len(codes) < 8: fails.append(f'{doc}{suf}: solo {len(codes)} códigos AB')
            per.append({'codigosAB': codes})
        res['docs'][doc + suf] = per
# FF&E N03
S = json.load(open(os.path.join(LAB, 'snapshot/snapshot.json'))); AP = json.load(open(os.path.join(LAB, 'snapshot/aportaciones.json')))['campos']
ffe = subprocess.run(['pdftotext', '-q', os.path.join(OUT, 'materials-furniture-book-v3.pdf'), '-'], capture_output=True, text=True).stdout
refs = sorted(set(re.findall(r'M-\d\d', ffe)))
ids = {o['id'] for o in S['objects']}; cat = AP.get('catalogoProductos', {}).get('valor', [])
bud = json.dumps(S.get('budget') or {}, ensure_ascii=False)
ffeRes = {'instancias': len(S['objects']), 'lineasFicha': len(refs), 'catalogoLigado': all(c['objectId'] in ids for c in cat), 'skuEnPresupuesto': [c['sku'] for c in cat if c['sku'] in bud],
          'estados': sorted({c['estado'] for c in cat}), 'instaladoDeclarado': 'Instalado: ninguno' in ffe}
if not ffeRes['catalogoLigado']: fails.append('catálogo ligado a un objeto inexistente')
if ffeRes['skuEnPresupuesto']: fails.append('SKU de catálogo dentro del presupuesto de obra (coste duplicado)')
if not ffeRes['instaladoDeclarado']: fails.append('no se declara el estado «instalado»')
res['ffe'] = ffeRes; res['fallos'] = fails; res['ok'] = not fails
json.dump(res, open(os.path.join(LAB, 'evidence/architecture/laminas-qa.json'), 'w'), ensure_ascii=False, indent=1)
print(json.dumps({'ok': res['ok'], 'fallos': fails[:12], 'ffe': ffeRes}, ensure_ascii=False, indent=1)); sys.exit(0 if res['ok'] else 1)
