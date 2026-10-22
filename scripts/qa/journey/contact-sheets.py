"""Contact sheets of the journey audit (scripts/qa/journey/audit.cjs): one JPEG per journey and viewport with every
step in order, its number, what was done and any block, so a reviewer sees the sequence, not only the last screen.
Usage: python3 -I scripts/qa/journey/contact-sheets.py <audit-dir> <out-dir>"""
import json, sys, os
from PIL import Image, ImageDraw, ImageFont

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
report = json.load(open(os.path.join(src, 'audit.json')))
try:
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 15)
    small = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 12)
except OSError:
    font = small = ImageFont.load_default()

def wrap(draw, text, width, fnt):
    words, lines, line = text.split(), [], ''
    for w in words:
        test = (line + ' ' + w).strip()
        if draw.textlength(test, font=fnt) > width and line:
            lines.append(line); line = w
        else:
            line = test
    if line: lines.append(line)
    return lines[:3]

for j in report['journeys']:
    steps = j['steps']
    if not steps: continue
    first = Image.open(os.path.join(src, steps[0]['shot']))
    w, h = first.size
    thumb_w = 340 if w > h else 200
    thumb_h = round(h * thumb_w / w)
    cols = 4 if w > h else 6
    rows = -(-len(steps) // cols)
    cap = 64
    sheet = Image.new('RGB', (cols * (thumb_w + 12) + 12, 40 + rows * (thumb_h + cap + 12) + 12), '#eceeee')
    d = ImageDraw.Draw(sheet)
    status = 'COMPLETO' if j.get('completed', not j['blocked']) else 'BLOQUEADO: ' + '; '.join(b['step'] for b in j['blocked'])
    d.text((12, 12), f"{j['id']} · {j['title']} · {j['viewport']} · {report['commit'][:7]} · {status}", fill='#1f2326', font=font)
    for i, s in enumerate(steps):
        x, y = 12 + (i % cols) * (thumb_w + 12), 40 + (i // cols) * (thumb_h + cap + 12)
        im = Image.open(os.path.join(src, s['shot'])).convert('RGB').resize((thumb_w, thumb_h), Image.LANCZOS)
        sheet.paste(im, (x, y))
        blocked = 'BLOQUEADO' in (s.get('did') or '')
        d.rectangle([x, y, x + thumb_w - 1, y + thumb_h - 1], outline='#a3261b' if blocked else '#aeb5b9', width=2 if blocked else 1)
        for k, line in enumerate(wrap(d, f"{i + 1}. {s.get('did') or s['step']}", thumb_w, small)):
            d.text((x, y + thumb_h + 4 + k * 15), line, fill='#a3261b' if blocked else '#1f2326', font=small)
    sheet.save(os.path.join(out, f"{j['viewport']}-{j['id']}.jpg"), quality=72, optimize=True)
print('sheets', len(report['journeys']))
