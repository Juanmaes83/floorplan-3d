// v1.4 · N01 · EXPORTAR UNA RECETA. Adaptador mínimo: traduce la receta RPxx a una selección del contrato v1.3
// (modalidad, capítulos y documentos existentes) y llama a exportar.cjs SIN cambiar su contrato. La receta y su versión
// van en el campo «nota» de la selección, que el exportador copia al MANIFIESTO del candidato.
//   · L elegible  → exportación real: carpeta, ZIP y resumen externo de exportar.cjs + <dir>.receta.json (evidencia del lab)
//   · L bloqueada, C o F → <dir>.receta-rechazo.json con el estado y lo que falta; NINGUNA carpeta, ZIP ni resumen.
// Uso: node tools/receta-exportar.cjs <RPxx> <es|en> <dirSalida> [--modo cliente|borrador] [--reconocer "Aviso A,Aviso B"]
//        [--aportaciones fixture.json]
// Código de salida: el del exportador (0 exportado, 2 rechazado, 1 entorno); 2 para recetas no emitibles.
'use strict';
const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
const RC=require('./recetas.cjs');
const LAB=path.resolve(__dirname,'..'),SRC=path.resolve(process.env.ENTREGA_SRC||path.join(LAB,'out/v3/entrega'));
const a=process.argv.slice(2);const opt=k=>{const i=a.indexOf(k);if(i<0)return null;const v=a[i+1];a.splice(i,2);return v;};
const modo=opt('--modo')||'cliente',rec=opt('--reconocer'),apf=opt('--aportaciones');
const [key,lang,outArg]=a;
if(!key||!lang||!outArg){console.error('Uso: node tools/receta-exportar.cjs <RPxx> <es|en> <dirSalida> [--modo cliente|borrador] [--reconocer "..."] [--aportaciones f.json]');process.exit(1);}
const OUT=path.resolve(outArg);
let aport=null;if(apf){try{aport=JSON.parse(fs.readFileSync(apf,'utf8'));}catch{console.error('Aportaciones ilegibles: '+apf);process.exit(1);}}
const ctx=RC.contexto(LAB,SRC,aport);const res=RC.resolver(key,ctx,lang);
const write=(suf,o)=>fs.writeFileSync(OUT+suf,JSON.stringify(o,null,1));
if(!res.emitible){
 // fail-closed: nunca queda una descarga de una selección que no se puede emitir
 for(const s of ['','.zip','.digest.json'])if(fs.existsSync(OUT+s)){console.error('El destino ya existe; no se toca: '+path.basename(OUT+s));process.exit(1);}
 const o={schema:'rubik-lab-receta-rechazo/1',fecha:new Date().toISOString(),receta:key,idioma:lang,exportado:false,...res};
 write('.receta-rechazo.json',o);console.log(JSON.stringify({receta:key,exportado:false,estado:res.estado,motivo:res.motivo},null,1));process.exit(2);}
const sel={...res.seleccion,modo,reconocidos:rec?rec.split(',').map(s=>s.trim()).filter(Boolean):[]};
const selFile=OUT+'.receta-seleccion.json';write('.receta-seleccion.json',sel);
const t0=Date.now();const r=spawnSync('node',[path.join(__dirname,'exportar.cjs'),selFile,OUT],{encoding:'utf8',env:process.env});
const read=s=>{try{return JSON.parse(fs.readFileSync(OUT+s,'utf8'));}catch{return null;}};
const digest=read('.digest.json');
const ev={schema:'rubik-lab-receta/1',fecha:new Date().toISOString(),receta:key,version:res.version,catalogo:res.catalogo,nivel:res.nivel,estado:res.estado,idioma:lang,modo,
 seleccionSha256:RC.selSha(sel),seleccion:sel,fuentes:res.fuentes,incompleta:res.incompleta,omitidas:res.omitidas,motivo:res.motivo,autoridad:res.autoridad,
 exportacion:{codigo:r.status,ms:Date.now()-t0,digest,rechazo:read('.rechazo.json')}};
write('.receta.json',ev);
console.log(JSON.stringify({receta:key,exportado:r.status===0,estado:res.estado,codigo:r.status,zip:digest?path.basename(OUT)+'.zip':null,motivo:r.status===0?res.motivo:(ev.exportacion.rechazo?.motivo||[r.stderr.slice(0,300)])},null,1));
process.exit(r.status);
