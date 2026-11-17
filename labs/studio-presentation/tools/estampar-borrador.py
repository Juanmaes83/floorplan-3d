# v1.3 · A03/A17 · Rótulo «BORRADOR» en cada página de cada PDF de una entrega exportada en modo borrador.
# Banda superior con texto Helvetica (fuente estándar del PDF, sin incrustar nada). Modifica los PDF EN SU SITIO dentro de la
# carpeta temporal de la exportación (nunca los originales compuestos). Falla con código ≠ 0 si un PDF no se puede rotular.
# Uso: python3 -I tools/estampar-borrador.py <carpeta> <ruta/rel.pdf>...
import sys, os
from pypdf import PdfReader, PdfWriter, PageObject
from pypdf.generic import DecodedStreamObject, DictionaryObject, NameObject, ArrayObject
TXT = 'BORRADOR \xb7 no apto para enviar al cliente'
def overlay(w, h):
    band = 22
    s = (f'q 1 0.957 0.863 rg 0 {h-band:.2f} {w:.2f} {band} re f '
         f'0.478 0.322 0 rg BT /FB 11 Tf 14 {h-band+7:.2f} Td ({TXT}) Tj ET Q').encode('latin-1')
    p = PageObject.create_blank_page(width=w, height=h)
    st = DecodedStreamObject(); st.set_data(s)
    font = DictionaryObject({NameObject('/Type'): NameObject('/Font'), NameObject('/Subtype'): NameObject('/Type1'),
                             NameObject('/BaseFont'): NameObject('/Helvetica-Bold'), NameObject('/Encoding'): NameObject('/WinAnsiEncoding')})
    p[NameObject('/Resources')] = DictionaryObject({NameObject('/Font'): DictionaryObject({NameObject('/FB'): font})})
    p[NameObject('/Contents')] = st
    return p
root = sys.argv[1]
for rel in sys.argv[2:]:
    f = os.path.join(root, rel)
    r = PdfReader(f); w = PdfWriter()
    for page in r.pages:
        mb = page.mediabox
        page.merge_page(overlay(float(mb.width), float(mb.height)))
        w.add_page(page)
    w.add_metadata({'/Title': 'BORRADOR'})
    with open(f + '.tmp', 'wb') as o: w.write(o)
    os.replace(f + '.tmp', f)
    print(rel, len(r.pages), 'páginas rotuladas')
