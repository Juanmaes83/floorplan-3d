from pathlib import Path
import hashlib, json, re, shutil, sys
source, dest = map(Path, sys.argv[1:])
# Leave full Blender working directories and the duplicate conceptual ZIP in the local archive.
groups=[Path('.'),Path('villa-linde'),Path('villa-linde/aceptacion')]
skip={'Villa-Linde-presentacion-conceptual.zip','Catastro-WFS.png','error-P7.png','08-recorrido-a-pie.webm','06-evolucion-ambas-plantas.webm','p7.log','p2-p5-p7.log'}
nested=[
 'blender-baja/preparada/verificacion.json',
 'blender-baja/previsualizacion/rom_linde-b-12.png',
 'blender-baja/previsualizacion/render-report.json',
 'blender-primera/preparada/verificacion.json',
 'blender-primera/previsualizacion/rom_linde-p-11.png',
 'blender-primera/previsualizacion/render-report.json',
]
sources=[p for group in groups for p in (source/group).iterdir() if p.is_file() and p.name not in skip]
sources += [source/'villa-linde/aceptacion'/n for n in nested]
path=r'(?i)C:(?:/|\\+)Users(?:/|\\+)temp123(?:/|\\+)Documents(?:/|\\+)ChatGPT(?:/|\\+)floorplan-3d(?:/|\\+)?'
secret=re.compile(r'(?i)BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY|github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|(?:sk-proj|sk-live|sk-test)-[A-Za-z0-9_-]{20,}|https?://[^/\s]+:[^@\s]+@')
manifest=[]
for p in sorted(sources):
    t = dest / p.relative_to(source)
    t.parent.mkdir(parents=True,exist_ok=True)
    if p.suffix.lower() in {'.cjs','.js','.json','.md','.log','.html','.py','.txt'}:
        data=p.read_bytes()
        text=data.decode('utf-8-sig',errors='strict')
        text=re.sub(path,'AUDIT_WORKSPACE/',text)
        if secret.search(text):
            raise ValueError(f'Possible credential in {p}')
        t.write_text(text,encoding='utf-8',newline='')
    else:
        shutil.copyfile(p,t)
    body=t.read_bytes()
    manifest.append({'archivo': t.relative_to(dest).as_posix(),'bytes':len(body),'sha256':hashlib.sha256(body).hexdigest()})
(dest/'MANIFIESTO-EVIDENCIAS.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'{len(manifest)} evidencias, {sum(m["bytes"] for m in manifest)/1048576:.1f} MiB')
