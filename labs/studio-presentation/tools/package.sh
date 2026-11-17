#!/usr/bin/env bash
# v1.3 · Paquetes reproducibles. Salida en dist/ (no versionada).
# (1) Cliente: la entrega integral en cada idioma compuesto, tal cual la produce tools/exportar.cjs (LEEME o README DENTRO del
#     manifiesto). Se verifica el ZIP exacto con su resumen externo y NO se le añade nada después.
# (2) Laboratorio: por lista de permitidos. Se copia a una carpeta de preparación donde se sanean las rutas absolutas de los
#     textos (registro en SANEAMIENTO.json) y se quitan los metadatos de fecha de los vídeos de evidencia; los archivos de la
#     entrega compuesta (out/v3/entrega) no se tocan, para que su registro de huellas siga valiendo. ZIP con fechas fijas.
# Si la inspección o la verificación encuentra algo que bloquea, el script termina con error.
set -euo pipefail
LAB="$(cd "$(dirname "$0")/.." && pwd)";DIST="$LAB/dist";rm -rf "$DIST";mkdir -p "$DIST"
cd "$LAB"
export TZ=UTC SOURCE_DATE_EPOCH=1795392000   # 17/11/2026 00:00 UTC: fecha fija de los archivos del ZIP del laboratorio
ACK='["Identidad del estudio","Presupuesto revisado","Imágenes IA","Plan de obra"]'
LANGS=$(node -e "const r=require('./out/v3/entrega/entrega.json');console.log((r.idiomas||['es']).join(' '))")
BASE=$(node -e "const r=require('./out/v3/entrega/entrega.json');console.log(JSON.stringify({proyecto:r.project.id,revision:r.project.revision,snapshotSha256:r.snapshot.sha256}))")
for L in $LANGS; do
  printf '{"tipo":"integral","modo":"cliente","idioma":"%s","reconocidos":%s,"base":%s}' "$L" "$ACK" "$BASE" > "$DIST/seleccion-integral-$L.json"
  node tools/exportar.cjs "$DIST/seleccion-integral-$L.json" "$DIST/entrega-vivienda-de-ejemplo-$L" > "$DIST/exportacion-$L.json"
  node tools/verificar-entrega.cjs --zip "$DIST/entrega-vivienda-de-ejemplo-$L.zip" --digest "$DIST/entrega-vivienda-de-ejemplo-$L.digest.json" > "$DIST/verificacion-$L.json"
  rm -rf "$DIST/entrega-vivienda-de-ejemplo-$L"   # la carpeta ya está dentro del ZIP verificado
done
# ---------- laboratorio: lista de permitidos ----------
LIST="$DIST/allowlist-laboratorio.txt"
{ ls HANDOFF.md HANDOFF-v1.3.md HANDOFF-v1.4.md PROMPT-CONTINUACION.md RECETA.md
  find reports system snapshot i18n vendor diagnostico assets mandatos -type f 2>/dev/null
  find tools -maxdepth 2 -type f \( -name '*.cjs' -o -name '*.js' -o -name '*.mjs' -o -name '*.py' -o -name '*.sh' -o -name 'package.json' -o -name 'package-lock.json' \) -not -path '*/node_modules/*'
  find evidence -type f
  find out/v3 -maxdepth 1 -type f \( -name '*.pdf' -o -name 'qa.json' \)
  find out/v3/b2 out/v3/b3 -type f -name '*.json' 2>/dev/null
  find out/v3/entrega out/v3/profesional -type f
} | LC_ALL=C sort -u > "$LIST"
STAGE="$DIST/.laboratorio";rm -rf "$STAGE";mkdir -p "$STAGE"
while IFS= read -r f; do mkdir -p "$STAGE/$(dirname "$f")"; cp -p "$f" "$STAGE/$f"; done < "$LIST"
python3 -I - "$STAGE" "$LAB" "$DIST/SANEAMIENTO.json" <<'PY'
import sys,os,re,json,subprocess,hashlib
stage,lab,report=sys.argv[1:4];repo=os.path.dirname(os.path.dirname(lab));home=os.path.expanduser('~')
subs=[(lab,'<LABORATORIO>'),(repo,'<REPOSITORIO>'),('/home/user/studio','<REPOSITORIO-OTRA-SESION>'),('/home/user','<HOME>'),(home,'<HOME>'),('/tmp/claude-0','<TMP>'),('/tmp','<TMP>'),('/opt/pw-browsers','<NAVEGADORES>')]
KEEP={'tools/package.sh','tools/inspeccionar-paquete.py'}  # contienen estos patrones como código: reescribirlos los rompería
TEXT=('.md','.json','.cjs','.js','.mjs','.py','.sh','.txt','.html','.csv','.svg')
out={'regla':'Rutas absolutas del entorno sustituidas por marcadores en la COPIA empaquetada; el repositorio no cambia.','sustituciones':[s[1] for s in subs],'archivos':[],'videos':[],'intactos':'out/v3/entrega/** (su registro de huellas debe seguir valiendo)'}
for root,_,files in os.walk(stage):
  for f in sorted(files):
    p=os.path.join(root,f);rel=os.path.relpath(p,stage)
    if rel.startswith('out/v3/entrega/'):
      if f.endswith(TEXT):
        t=open(p,encoding='utf-8',errors='replace').read()
        if any(a in t for a,_ in subs):raise SystemExit(f'BLOQUEA: ruta absoluta dentro de la entrega compuesta: {rel}')
      continue
    if rel in KEEP or rel.startswith('mandatos/RUBIK-SOTA-'):continue
    if f.endswith(TEXT):
      t=open(p,encoding='utf-8',errors='surrogateescape').read();n=0
      for a,b in subs:
        c=t.count(a)
        if c:t=t.replace(a,b);n+=c
      if n:open(p,'w',encoding='utf-8',errors='surrogateescape').write(t);out['archivos'].append({'archivo':rel,'sustituciones':n})
    elif f.endswith(('.webm','.mp4')) and rel.startswith('evidence/'):
      before=hashlib.sha256(open(p,'rb').read()).hexdigest();tmp=p+'.tmp'+os.path.splitext(f)[1]
      subprocess.run(['ffmpeg','-v','error','-y','-i',p,'-map','0','-c','copy','-map_metadata','-1','-fflags','+bitexact','-flags:v','+bitexact',tmp],check=True);os.replace(tmp,p)
      out['videos'].append({'archivo':rel,'antes':before,'despues':hashlib.sha256(open(p,'rb').read()).hexdigest(),'cambio':'sin metadatos de fecha (creation_time) ni etiquetas'})
json.dump(out,open(report,'w'),ensure_ascii=False,indent=1)
print('saneados',len(out['archivos']),'archivos;',len(out['videos']),'vídeos')
PY
cp "$DIST/SANEAMIENTO.json" "$STAGE/SANEAMIENTO.json"
find "$STAGE" -exec touch -h -d "@$SOURCE_DATE_EPOCH" {} +
( cd "$STAGE" && find . -type f | sed 's|^\./||' | LC_ALL=C sort | zip -qX -D "$DIST/rubik-studio-presentation-lab.zip" -@ )
rm -rf "$STAGE"
status=0
for L in $LANGS; do python3 -I tools/inspeccionar-paquete.py "$DIST/entrega-vivienda-de-ejemplo-$L.zip" cliente "$DIST/inspeccion-cliente-$L.json" || status=$?; done
python3 -I tools/inspeccionar-paquete.py "$DIST/rubik-studio-presentation-lab.zip" laboratorio "$DIST/inspeccion-laboratorio.json" || status=$?
( cd "$DIST" && sha256sum *.zip *.digest.json > SHA256SUMS && ls -la *.zip SHA256SUMS )
node -e "const fs=require('fs'),d='$DIST';const z=fs.readdirSync(d).filter(f=>/\.zip$/.test(f)).map(f=>({zip:f,bytes:fs.statSync(d+'/'+f).size}));fs.writeFileSync(d+'/INDICE.json',JSON.stringify({generated:new Date().toISOString(),node:process.version,idiomas:'$LANGS'.split(' '),zips:z,sha256:fs.readFileSync(d+'/SHA256SUMS','utf8').trim().split('\n')},null,1));"
exit $status
