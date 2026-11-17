// v1.4 §11 · N08 · Verificador del MAPA DE IMPACTO para reutilizarlo (Codex u otro agente) sin fiarse de él a ciegas:
// identidad (snapshot y registro actuales), cada dependencia existe con sus bytes, SHA-256 (huella binaria) y blob git
// (huella del contenido versionado), cada prueba citada existe, y cada artefacto declarado como evidencia sigue ligado al
// registro actual (evidencia obsoleta = error). El mapa NO autoriza omitir CI: solo dice qué depende de qué.
// Uso: node tools/verificar-impacto.cjs [mapa.json] → 0 vigente · 3 obsoleto/inválido
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),{execFileSync}=require('child_process');
const LAB=path.resolve(__dirname,'..'),M=path.resolve(process.argv[2]||path.join(LAB,'evidence/impacto/mapa.json'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');const errs=[];const E=m=>errs.push(m);
let m;try{m=JSON.parse(fs.readFileSync(M,'utf8'));}catch{E('Mapa ilegible');}
if(m){if(m.schema!=='rubik-lab-impacto/1')E('Esquema de mapa no admitido: '+m.schema);
 const reg=fs.readFileSync(path.join(LAB,'out/v3/entrega/entrega.json'));const R=JSON.parse(reg);
 if(m.identidad?.registroSha256!==sha(reg))E('Identidad obsoleta: el registro de la entrega ha cambiado desde que se hizo el mapa.');
 if(m.identidad?.snapshotSha256!==R.snapshot.sha256)E('Identidad obsoleta: otro snapshot.');
 for(const [rel,d] of Object.entries(m.dependenciasComunes||{})){const f=path.resolve(LAB,rel);
  if(!f.startsWith(LAB+path.sep)){E('Dependencia fuera del laboratorio: '+rel);continue;}
  if(!fs.existsSync(f)){E('Dependencia inexistente: '+rel);continue;}const b=fs.readFileSync(f);
  if(b.length!==d.bytes||sha(b)!==d.sha256)E('Archivo cambiado: '+rel);
  else if(d.gitBlob){const blob=execFileSync('git',['hash-object',f]).toString().trim();if(blob!==d.gitBlob)E('Blob git distinto: '+rel);}}
 for(const [id,g] of Object.entries(m.gates||{}))for(const p of g.pruebas||[])if(!fs.existsSync(path.join(LAB,p)))E(`Prueba inexistente en ${id}: ${p}`);
 for(const r of m.recetas||[])for(const [lang,o] of Object.entries(r.salida||{}))if(o.evidencia==='ejecutada y ligada al registro'&&m.identidad?.registroSha256!==sha(reg))E(`Evidencia obsoleta: ${r.receta}/${lang}`);}
console.log(JSON.stringify({mapa:path.basename(M),vigente:!errs.length,errores:errs.slice(0,30),total:errs.length,nota:'El mapa no autoriza omitir pruebas de CI.'},null,1));process.exit(errs.length?3:0);
