# v1.2 · A05/ST06/ST09 · Inspección completa de un ZIP: cada archivo se abre y se examina según su tipo, no con un grep global.
# Texto (html, json, md, cjs, js, mjs, py, sh, css, svg, txt): secretos, contactos fuera de la allowlist, rutas absolutas del
#   entorno, código de la aplicación o geometría editable (solo en el paquete de cliente).
# Imágenes (png, jpg): metadatos EXIF, XMP y bloques de texto PNG; se informan y, en el paquete de cliente, bloquean si no
#   están vacíos. PDF: Author, Creator, Producer, Title, Subject y Keywords. Vídeo: etiquetas del contenedor (ffprobe).
# Uso: python3 -I tools/inspeccionar-paquete.py <zip> <cliente|laboratorio> <informe.json>   (código 0 limpio · 4 hallazgos)
import json, re, subprocess, sys, zipfile, io, hashlib, tempfile, os, stat
from PIL import Image
zp, kind, outp = sys.argv[1], sys.argv[2], sys.argv[3]
ALLOW_EMAIL = {'estudio@example.invalid', 'noreply@anthropic.com'}
# v1.3: en el paquete de LABORATORIO, los dominios reservados .invalid son fixtures sintéticos (se informan, no bloquean).
redact = lambda t: (t[:4] + '…[' + str(len(t)) + ' caracteres ocultos]') if len(t) > 4 else '…'
SECRET = re.compile(r'ghp_[A-Za-z0-9]{20}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9]{20}|AKIA[0-9A-Z]{16}|xox[bp]-|BEGIN (RSA|OPENSSH|EC) PRIVATE|Bearer [A-Za-z0-9._-]{20,}|RUBIK_(SHARE|RENDER)_TOKEN=\S+')
EMAIL = re.compile(r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}')
ABSPATH = re.compile(r'(?:/home/user|/root/|/tmp/claude|C:\\Users\\)[^\s"\'<>]*')
EDITABLE = re.compile(r'"walls"\s*:\s*\[|"openings"\s*:\s*\[|FloorPlanApp\b')
TEXT = ('.html', '.htm', '.json', '.md', '.cjs', '.js', '.mjs', '.py', '.sh', '.css', '.svg', '.txt', '.csv', '.tap')
findings, files = [], []
def flag(path, what, detail, severity='bloquea'):
    findings.append({'archivo': path, 'que': what, 'detalle': detail[:300], 'gravedad': severity})
z = zipfile.ZipFile(zp)
names = [i.filename for i in z.infolist()]
for n in sorted(set(x for x in names if names.count(x) > 1)): flag(n, 'entrada duplicada en el ZIP', n)
TMP = tempfile.mkdtemp(prefix='insp-')
for info in z.infolist():
    if info.is_dir():
        continue
    if stat.S_ISLNK(info.external_attr >> 16): flag(info.filename, 'enlace simbólico en el ZIP', info.filename); continue
    if info.filename.startswith('/') or '..' in info.filename.split('/') or '\\' in info.filename: flag(info.filename, 'ruta no permitida en el ZIP', info.filename); continue
    p, b = info.filename, z.read(info.filename)
    files.append({'path': p, 'bytes': len(b), 'sha256': hashlib.sha256(b).hexdigest()})
    low = p.lower()
    if 'node_modules/' in p or low.endswith(('.rubik', '.env')) or '/.git/' in p:
        flag(p, 'archivo no permitido', p)
    if low.endswith(TEXT):
        t = b.decode('utf8', 'replace')
        for m in SECRET.finditer(t): flag(p, 'posible secreto', redact(m.group(0)))  # nunca se imprime en claro
        for m in set(EMAIL.findall(t)):
            if m.lower() not in ALLOW_EMAIL and not m.lower().endswith(('.png', '.jpg', '.svg')):
                if kind == 'laboratorio' and m.lower().endswith('.invalid'): flag(p, 'contacto sintético de fixture (.invalid)', m, 'info')
                else: flag(p, 'contacto fuera de la allowlist', m, 'bloquea' if kind == 'cliente' else 'revisar')
        for m in set(ABSPATH.findall(t)): flag(p, 'ruta absoluta del entorno', m, 'bloquea' if kind == 'cliente' else 'revisar')
        if kind == 'cliente' and EDITABLE.search(t): flag(p, 'geometría editable o código de la aplicación', EDITABLE.search(t).group(0))
        if kind == 'cliente' and low.endswith(('.html', '.htm')) and re.search(r'<script(?![^>]*type="application/json")', t, re.I) and p == 'index.html':
            flag(p, 'script en la web del cliente', 'index.html')
    elif low.endswith(('.png', '.jpg', '.jpeg', '.webp')):
        try:
            im = Image.open(io.BytesIO(b)); meta = {}
            ex = im.getexif()
            if len(ex): meta['exif'] = {str(k): str(v)[:80] for k, v in ex.items()}
            for k in ('xmp', 'XML:com.adobe.xmp', 'icc_profile'):
                if k in im.info and k != 'icc_profile': meta[k] = str(im.info[k])[:120]
            txt = {k: str(v)[:120] for k, v in im.info.items() if k not in ('dpi', 'gamma', 'icc_profile', 'jfif', 'jfif_version', 'jfif_unit', 'jfif_density', 'progressive', 'progression', 'adobe', 'adobe_transform', 'transparency', 'aspect', 'srgb', 'chromaticity')}
            if txt: meta['info'] = txt
            if meta: flag(p, 'metadatos de imagen', json.dumps(meta, ensure_ascii=False), 'bloquea' if kind == 'cliente' else 'revisar')
        except Exception as e:
            flag(p, 'imagen ilegible', str(e))
    elif low.endswith('.pdf'):
        tf = os.path.join(TMP, 'x.pdf'); open(tf, 'wb').write(b)
        pr = subprocess.run(['pdfinfo', tf], capture_output=True, text=True); info_ = pr.stdout
        if pr.returncode != 0 or 'Pages:' not in info_: flag(p, 'PDF ilegible (pdfinfo)', pr.stderr.strip()[:120] or 'sin salida'); continue
        if b'/JavaScript' in b or b'/JS ' in b or b'/Launch' in b or b'/EmbeddedFile' in b: flag(p, 'PDF con JavaScript, acciones o adjuntos', 'marcadores /JavaScript /Launch /EmbeddedFile', 'bloquea' if kind == 'cliente' else 'revisar')
        meta = {k: v.strip() for k, v in (l.split(':', 1) for l in info_.splitlines() if ':' in l) if k in ('Title', 'Author', 'Creator', 'Producer', 'Subject', 'Keywords')}
        if meta.get('Author') or meta.get('Subject') or meta.get('Keywords'): flag(p, 'metadatos de PDF', json.dumps(meta, ensure_ascii=False), 'revisar')
        files[-1]['pdf'] = meta
    elif low.endswith(('.mp4', '.webm')):
        tf = os.path.join(TMP, 'x' + low[low.rfind('.'):]); open(tf, 'wb').write(b)
        pr = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format_tags', '-of', 'json', tf], capture_output=True, text=True)
        if pr.returncode != 0: flag(p, 'vídeo ilegible (ffprobe)', pr.stderr.strip()[:120]); continue
        tags = json.loads(pr.stdout or '{}').get('format', {}).get('tags', {})
        extra = {k: v for k, v in tags.items() if k.lower() not in ('major_brand', 'minor_version', 'compatible_brands', 'encoder')}
        if extra: flag(p, 'etiquetas de vídeo', json.dumps(extra, ensure_ascii=False), 'revisar')
        files[-1]['videoTags'] = tags
import shutil; shutil.rmtree(TMP, ignore_errors=True)
blocking = [f for f in findings if f['gravedad'] == 'bloquea']
rep = {'schema': 'rubik-lab-inspeccion/1', 'zip': zp.split('/')[-1], 'tipo': kind, 'archivos': len(files), 'bytes': sum(f['bytes'] for f in files),
       'bloquea': len(blocking), 'revisar': sum(f['gravedad'] == 'revisar' for f in findings), 'info': sum(f['gravedad'] == 'info' for f in findings), 'hallazgos': findings, 'files': files}
json.dump(rep, open(outp, 'w'), ensure_ascii=False, indent=1)
print(json.dumps({k: rep[k] for k in ('zip', 'tipo', 'archivos', 'bytes', 'bloquea', 'revisar', 'info')}, ensure_ascii=False))
for f in findings[:25]: print(' ', f['gravedad'], f['que'], f['archivo'], f['detalle'][:120])
sys.exit(4 if blocking else 0)
