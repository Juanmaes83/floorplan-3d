# -*- coding: utf-8 -*-
"""CAT-02 pilot fixtures: five synthetic product drawings made here (no photos, no third-party marks, no people).
Deterministic: same script + Pillow version -> same bytes. Writes PNGs and the pilot collection with their SHA-256.
Run: python3 -I scripts/cat-ia/make-fixtures.py  (Pillow 12.3.0); --check verifies the committed files without writing."""
import hashlib, json, pathlib
from PIL import Image, ImageDraw
OUT = pathlib.Path(__file__).resolve().parents[2] / 'assets' / 'cat-ia' / 'fixtures'
OUT.mkdir(parents=True, exist_ok=True)
W, H = 480, 360

def canvas(bg):
    im = Image.new('RGB', (W, H), bg); return im, ImageDraw.Draw(im)

def label(d, text):
    d.rectangle([0, H - 34, W, H], fill=(29, 36, 51)); d.text((12, H - 26), text, fill=(255, 255, 255))

def sideboard(wood, name):
    im, d = canvas((238, 241, 246)); d.rectangle([60, 250, 420, 262], fill=(150, 156, 168))
    d.rectangle([70, 110, 410, 250], fill=wood, outline=(60, 50, 40), width=3)
    for x in (183, 296): d.line([x, 112, x, 248], fill=(60, 50, 40), width=3)
    for x in (126, 239, 352): d.rectangle([x - 14, 174, x + 14, 180], fill=(40, 40, 40))
    for x in (84, 396): d.rectangle([x - 4, 250, x + 4, 276], fill=(40, 40, 40))
    label(d, name + ' - SINTETICO QA'); return im

def oven():
    im, d = canvas((232, 236, 242)); d.rectangle([120, 60, 360, 300], fill=(205, 208, 214), outline=(70, 74, 82), width=3)
    d.rectangle([140, 80, 340, 108], fill=(40, 44, 52)); d.rectangle([150, 128, 330, 272], fill=(30, 32, 38), outline=(120, 124, 132), width=4)
    d.rectangle([150, 116, 330, 122], fill=(150, 154, 160))
    for x in (170, 200, 280, 310): d.ellipse([x - 7, 87, x + 7, 101], fill=(190, 192, 198))
    label(d, 'Horno H60 - SINTETICO QA'); return im

def worktop():
    im, d = canvas((60, 62, 66))
    seed = 7
    for i in range(1400):
        seed = (seed * 1103515245 + 12345) & 0x7fffffff; x = seed % W
        seed = (seed * 1103515245 + 12345) & 0x7fffffff; y = seed % (H - 34)
        g = 90 + (seed >> 8) % 90; d.point((x, y), fill=(g, g, g + 6))
    d.line([0, 40, W, 120], fill=(180, 182, 188), width=2); d.line([0, 200, W, 150], fill=(160, 162, 170), width=1)
    label(d, 'Encimera Basalto - SINTETICO QA'); return im

def pendant():
    im, d = canvas((246, 244, 238)); d.line([240, 0, 240, 120], fill=(40, 40, 40), width=3)
    d.pieslice([140, 100, 340, 300], 180, 360, fill=(222, 170, 70), outline=(90, 70, 30), width=3)
    d.ellipse([222, 188, 258, 214], fill=(255, 246, 200))
    label(d, 'Lampara Orbe - SINTETICO QA'); return im

images = {
    'aparador-lumen-roble.png': sideboard((196, 154, 108), 'Aparador Lumen roble'),
    'aparador-lumen-nogal.png': sideboard((112, 78, 52), 'Aparador Lumen nogal'),
    'horno-h60.png': oven(),
    'encimera-basalto.png': worktop(),
    'lampara-orbe.png': pendant(),
}
import sys
CHECK = '--check' in sys.argv
sha = {}
for name, im in images.items():
    p = OUT / name
    if CHECK:
        # PNG compression may differ between zlib builds: compare the decoded pixels, and the declared SHA with the file.
        old = Image.open(p).convert('RGB')
        if old.size != im.size or old.tobytes() != im.tobytes(): sys.exit('pixels differ: ' + name)
    else:
        im.save(p, format='PNG', optimize=False, compress_level=9)
    sha[name] = hashlib.sha256(p.read_bytes()).hexdigest()

LIC = {'scope': ['catalog-sheet', 'reference-image', 'qa', 'review-preview'], 'proofRef': 'assets/cat-ia/fixtures/LICENSE.txt', 'expiresAt': None, 'attribution': 'RUBIK QA · dibujo sintético propio'}
BASE = {'catalogId': 'piloto-sintetico-qa', 'manufacturer': 'RUBIK Fixtures QA', 'brand': 'RUBIK Sintético', 'brandKind': 'synthetic',
        'source': {'kind': 'synthetic-fixture', 'ref': 'scripts/cat-ia/make-fixtures.py'}, 'affiliation': 'none',
        'license': {'scope': ['catalog-sheet', 'qa', 'review-preview'], 'proofRef': 'assets/cat-ia/fixtures/LICENSE.txt', 'expiresAt': None},
        'availability': {'status': 'unknown', 'source': None, 'verifiedAt': None}, 'reviewStatus': 'REVIEWED', 'model3dRef': None}
def img(asset, name, alt): return [{'assetId': asset, 'path': 'assets/cat-ia/fixtures/' + name, 'mediaType': 'image/png', 'sha256': sha[name], 'usageRights': 'own', 'alt': alt, 'license': LIC}]
PROV = 'Fixture sintético: medidas de diseño definidas por RUBIK QA'
PRICE = 'Tarifa sintética QA (no es un precio de mercado)'
products = [
    {**BASE, 'productId': 'aparador-lumen', 'variantId': 'roble', 'sku': 'QA-LUMEN-160-RB', 'family': 'mobiliario', 'kind': 'furniture', 'collection': 'Lumen',
     'displayName': 'Aparador Lumen 160 roble', 'description': 'Aparador de tres puertas. Fixture sintético para pruebas de catálogo.',
     'dimensionsMm': {'width': 1600, 'height': 780, 'depth': 450}, 'dimensionsProvenance': PROV,
     'commercial': {'currency': 'EUR', 'unit': 'ud', 'netUnitPrice': 690, 'vatRate': 0.21, 'priceSource': PRICE, 'verifiedAt': '2026-11-14'},
     'imageRefs': img('img-lumen-roble', 'aparador-lumen-roble.png', 'Aparador Lumen roble (dibujo sintético)')},
    {**BASE, 'productId': 'aparador-lumen', 'variantId': 'nogal', 'sku': 'QA-LUMEN-160-NG', 'family': 'mobiliario', 'kind': 'furniture', 'collection': 'Lumen',
     'displayName': 'Aparador Lumen 160 nogal', 'description': 'Variante nogal del aparador Lumen. Fixture sintético.',
     'dimensionsMm': {'width': 1600, 'height': 780, 'depth': 450}, 'dimensionsProvenance': PROV,
     'commercial': {'currency': 'EUR', 'unit': 'ud', 'netUnitPrice': 745, 'vatRate': 0.21, 'priceSource': PRICE, 'verifiedAt': '2026-11-14'},
     'imageRefs': img('img-lumen-nogal', 'aparador-lumen-nogal.png', 'Aparador Lumen nogal (dibujo sintético)')},
    {**BASE, 'productId': 'horno-h60', 'variantId': 'inox', 'sku': 'QA-H60-INOX', 'family': 'electrodomesticos', 'kind': 'appliance', 'collection': 'Cocción QA',
     'displayName': 'Horno integrable H60 inox', 'description': 'Horno integrable de 60 cm. Precio desconocido a propósito.',
     'dimensionsMm': {'width': 595, 'height': 595, 'depth': 548}, 'dimensionsProvenance': PROV,
     'commercial': {'currency': 'EUR', 'unit': 'ud', 'netUnitPrice': None, 'vatRate': None, 'priceSource': None, 'verifiedAt': None},
     'imageRefs': img('img-horno-h60', 'horno-h60.png', 'Horno H60 (dibujo sintético)')},
    {**BASE, 'productId': 'encimera-basalto', 'variantId': None, 'sku': 'QA-ENC-BASALTO', 'family': 'encimeras', 'kind': 'material', 'collection': 'Piedra QA',
     'displayName': 'Encimera cuarzo Basalto', 'description': 'Material de encimera. Formato de tablero desconocido a propósito.',
     'dimensionsMm': {'width': None, 'height': None, 'depth': None}, 'dimensionsProvenance': None,
     'commercial': {'currency': 'EUR', 'unit': 'm2', 'netUnitPrice': 180, 'vatRate': 0.21, 'priceSource': PRICE, 'verifiedAt': '2026-11-14'},
     'imageRefs': img('img-encimera-basalto', 'encimera-basalto.png', 'Encimera Basalto (muestra sintética)')},
    {**BASE, 'productId': 'lampara-orbe', 'variantId': 'ambar', 'sku': 'QA-ORBE-40-AM', 'family': 'iluminacion', 'kind': 'lighting', 'collection': 'Orbe',
     'displayName': 'Lámpara colgante Orbe 40 ámbar', 'description': 'Lámpara colgante. Fixture sintético.',
     'dimensionsMm': {'width': 400, 'height': 300, 'depth': 400}, 'dimensionsProvenance': PROV,
     'commercial': {'currency': 'EUR', 'unit': 'ud', 'netUnitPrice': 95, 'vatRate': 0.21, 'priceSource': PRICE, 'verifiedAt': '2026-11-14'},
     'imageRefs': img('img-orbe-ambar', 'lampara-orbe.png', 'Lámpara Orbe (dibujo sintético)')},
]
text = (json.dumps({'schema': 'rubik-catalog-collection/1', 'catalogId': 'piloto-sintetico-qa', 'name': 'Piloto sintético QA', 'products': products}, ensure_ascii=False, indent=1) + '\n')
if CHECK:
    if (OUT / 'pilot-collection.json').read_text() != text: sys.exit('pilot-collection.json differs from the generator')
    print('fixtures OK'); sys.exit(0)
(OUT / 'pilot-collection.json').write_text(text)
print(json.dumps(sha, indent=1))
