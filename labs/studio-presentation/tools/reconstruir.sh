#!/usr/bin/env bash
# v1.3 · Reconstrucción desde el ZIP del laboratorio, dos veces, y comparación. Uso: bash tools/reconstruir.sh <lab.zip> <dirTrabajo>
# Descomprime en una carpeta limpia, instala las fuentes fijadas (npm ci) y compone dos veces (out-a, out-b). Compara entre sí y con
# los PDF empaquetados (out/v3): páginas y texto de cada página, problemas de QA y huellas de los medios de la entrega.
# Los PDF no son idénticos byte a byte (fecha de creación del PDF): por eso se compara su contenido.
set -euo pipefail
ZIP="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")";W="$2";rm -rf "$W";mkdir -p "$W/lab";cd "$W/lab";unzip -q "$ZIP"
( cd tools && npm ci --no-audit --no-fund --silent )
export CHROME="${CHROME:-}"
for r in a b; do node tools/compose.cjs snapshot "$W/out-$r" > "$W/compose-$r.log" 2>&1 || { echo "compose $r falló"; tail -5 "$W/compose-$r.log"; exit 1; }; done
node - "$W" <<'JS'
const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');const W=process.argv[2];
const pages=f=>+/Pages:\s+(\d+)/.exec(execFileSync('pdfinfo',[f]).toString())[1];
const text=f=>execFileSync('pdftotext',['-layout',f,'-']).toString();
const pdfs=fs.readdirSync(path.join(W,'out-a')).filter(f=>f.endsWith('.pdf')).sort();const res=[];
for(const f of pdfs){const a=path.join(W,'out-a',f),b=path.join(W,'out-b',f),o=path.join(W,'lab/out/v3',f);
 const r={pdf:f,paginas:pages(a),igualAB:text(a)===text(b)&&pages(a)===pages(b),igualEmpaquetado:fs.existsSync(o)?text(a)===text(o)&&pages(a)===pages(o):null};res.push(r);}
const qa=r=>{const q=JSON.parse(fs.readFileSync(path.join(W,`out-${r}`,'qa.json'),'utf8'));return Object.values(q.docs).reduce((s,v)=>s+v.overflowCount+v.textOverlapCount+v.spillCount+v.svgClipCount+(v.lint?.red?.length||0)+v.external.length+v.errors.length,0);};
const reg=r=>JSON.parse(fs.readFileSync(path.join(W,`out-${r}`,'entrega/entrega.json'),'utf8'));const A=reg('a'),B=reg('b');
const media=x=>Object.fromEntries(x.pieces.filter(p=>p.file.startsWith('media/')).map(p=>[p.file,p.sha256]));const ma=media(A),mb=media(B);
const out={pdfs:res.length,igualesAB:res.filter(r=>r.igualAB).length,igualesEmpaquetado:res.filter(r=>r.igualEmpaquetado).length,distintos:res.filter(r=>!r.igualAB||r.igualEmpaquetado===false),
 qaProblemas:{a:qa('a'),b:qa('b')},idiomas:{a:A.idiomas,b:B.idiomas},medios:{n:Object.keys(ma).length,iguales:Object.keys(ma).filter(k=>ma[k]===mb[k]).length},snapshot:{a:A.snapshot.sha256,b:B.snapshot.sha256}};
fs.writeFileSync(path.join(W,'RECONSTRUCCION.json'),JSON.stringify(out,null,1));console.log(JSON.stringify(out,null,1));
JS
