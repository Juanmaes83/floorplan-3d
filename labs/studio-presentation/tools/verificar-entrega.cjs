// v1.3 · A02/A09/ST04 · Verificador INDEPENDIENTE de una entrega exportada. No importa ni el exportador ni su catálogo.
// Dos modos:
//   node tools/verificar-entrega.cjs --zip <entrega.zip> --digest <entrega.digest.json>   (lo que recibe el cliente)
//   node tools/verificar-entrega.cjs <carpeta>        (carpeta ya extraída; busca <carpeta>.digest.json al lado)
// Comprueba, con mensajes deterministas: esquema y versión del resumen externo y del manifiesto; huella del ZIP exacto;
// entradas del ZIP únicas, relativas, sin «..», sin enlaces simbólicos y todas dentro de la carpeta declarada; inventario
// EXACTO (ningún archivo de más ni de menos; solo MANIFIESTO.json se excluye a sí mismo); tamaño, SHA-256 y firma binaria
// del tipo MIME declarado de cada archivo; referencias de cada HTML (atributos, srcset, url() de CSS) resueltas dentro del
// inventario; sin scripts ejecutables, marcos, <base>, refresco ni recursos externos.
// Integridad, no autenticidad: un resumen externo sustituido junto con el ZIP no se detecta; eso exige una firma (fuera de fase).
// Código de salida: 0 válido · 3 inválido · 1 uso incorrecto.
'use strict';
const fs=require('fs'),path=require('path'),os=require('os'),crypto=require('crypto'),{spawnSync}=require('child_process');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const errs=[];const E=m=>errs.push(m);const a=process.argv.slice(2);
const RUTA=/^[A-Za-z0-9][A-Za-z0-9._-]*(\/[A-Za-z0-9][A-Za-z0-9._-]*)*$/;
const MAGIC={'application/pdf':b=>b.subarray(0,5).toString('latin1')==='%PDF-','image/jpeg':b=>b[0]===0xff&&b[1]===0xd8&&b[2]===0xff,
 'image/png':b=>b.subarray(0,8).toString('hex')==='89504e470d0a1a0a','video/mp4':b=>b.subarray(4,8).toString('latin1')==='ftyp',
 'text/html':b=>/^\s*<!doctype html/i.test(b.subarray(0,64).toString('utf8')),'text/plain':b=>!b.includes(0)};
let dir,digPath,zipPath,tmp=null;
if(a[0]==='--zip'){zipPath=path.resolve(a[1]);if(a[2]!=='--digest'||!a[3]){console.error('Uso: --zip <zip> --digest <digest.json>');process.exit(1);}digPath=path.resolve(a[3]);}
else if(a[0]){dir=path.resolve(a[0]);digPath=dir+'.digest.json';if(fs.existsSync(dir+'.zip'))zipPath=dir+'.zip';}
else{console.error('Uso: node tools/verificar-entrega.cjs (<carpeta> | --zip <zip> --digest <digest.json>)');process.exit(1);}
const done=()=>{if(tmp)fs.rmSync(tmp,{recursive:true,force:true});console.log(JSON.stringify({entrega:dig?.folder||path.basename(dir||zipPath||''),valido:!errs.length,archivos:man?.files?.length||0,errores:errs},null,1));process.exit(errs.length?3:0);};
let dig=null,man=null;
try{dig=JSON.parse(fs.readFileSync(digPath,'utf8'));}catch{E('Falta o no se puede leer el resumen externo '+path.basename(digPath));done();}
if(dig.schema!=='rubik-lab-entrega-digest/2')E('Resumen externo de un esquema no admitido: '+dig.schema);
for(const k of ['folder','manifestSha256','zip','zipSha256'])if(typeof dig[k]!=='string')E(`Resumen externo sin «${k}»`);
if(!/^[a-z0-9][a-z0-9._-]{0,80}$/.test(dig.folder||''))E('Nombre de carpeta no válido en el resumen externo');
if(errs.length)done();
// ---------- ZIP exacto ----------
if(zipPath){const zb=fs.readFileSync(zipPath);
 if(path.basename(zipPath)!==dig.zip)E(`El ZIP se llama ${path.basename(zipPath)}, el resumen externo declara ${dig.zip}`);
 if(sha(zb)!==dig.zipSha256)E('El ZIP no coincide con el resumen externo (huella distinta)');
 if(typeof dig.zipBytes==='number'&&zb.length!==dig.zipBytes)E('El ZIP no tiene el tamaño declarado');
 const z=spawnSync('zipinfo',['-l',zipPath],{encoding:'utf8',maxBuffer:1<<26});if(z.status!==0){E('ZIP ilegible');done();}
 const entries=[];for(const l of z.stdout.split('\n')){const m=/^([-dl?][rwxsStT-]{9})\s.*\s(\S+)$/.exec(l);if(!m)continue;entries.push({perm:m[1],name:m[2]});}
 const names=entries.map(e=>e.name);
 for(const n of names.filter((x,i)=>names.indexOf(x)!==i))E('Entrada duplicada en el ZIP: '+n);
 for(const e of entries){if(e.perm[0]==='l')E('Enlace simbólico en el ZIP: '+e.name);
  const n=e.name.replace(/\/$/,'');if(e.perm[0]==='d')continue;if(!n.startsWith(dig.folder+'/')||!RUTA.test(n))E('Entrada fuera de la carpeta declarada o con ruta no válida: '+e.name);}
 if(errs.length)done();
 if(a[0]==='--zip'){tmp=fs.mkdtempSync(path.join(os.tmpdir(),'verificar-'));const u=spawnSync('unzip',['-qq',zipPath,'-d',tmp]);if(u.status!==0){E('No se puede extraer el ZIP');done();}
 dir=path.join(tmp,dig.folder);
 zipList=entries.filter(e=>e.perm[0]!=='d').map(e=>e.name.slice(dig.folder.length+1)).sort();}}
var zipList;
// ---------- manifiesto ----------
const walk=(d,r='')=>fs.readdirSync(d).sort().flatMap(f=>{const p=path.join(d,f),rel=r?r+'/'+f:f,st=fs.lstatSync(p);if(st.isSymbolicLink()){E('Enlace simbólico: '+rel);return [];}return st.isDirectory()?walk(p,rel):[rel];});
if(!dir||!fs.existsSync(dir)){E('No existe la carpeta de la entrega');done();}
let mb;try{mb=fs.readFileSync(path.join(dir,'MANIFIESTO.json'));man=JSON.parse(mb);}catch{E('Falta o no se puede leer MANIFIESTO.json');done();}
if(sha(mb)!==dig.manifestSha256)E('MANIFIESTO.json no coincide con el resumen externo');
if(man.schema!=='rubik-lab-entrega-manifiesto/2')E('Manifiesto de un esquema no admitido: '+man.schema);
if(!Array.isArray(man.files)){E('El manifiesto no tiene lista de archivos');done();}
const listed=new Map();
for(const f of man.files){if(!f||typeof f.path!=='string'||typeof f.sha256!=='string'||!/^[0-9a-f]{64}$/.test(f.sha256)||!Number.isInteger(f.bytes)||typeof f.type!=='string'){E('Entrada de manifiesto mal formada: '+JSON.stringify(f).slice(0,80));continue;}
 if(!RUTA.test(f.path)||f.path.split('/').includes('..'))E('Ruta no válida en el manifiesto: '+f.path);
 if(f.path==='MANIFIESTO.json')E('El manifiesto se declara a sí mismo');
 if(listed.has(f.path))E('Ruta repetida en el manifiesto: '+f.path);listed.set(f.path,f);}
if(typeof dig.files==='number'&&dig.files!==listed.size+1)E(`El resumen externo declara ${dig.files} archivos; el manifiesto ${listed.size} más él mismo`);
const present=walk(dir).filter(f=>f!=='MANIFIESTO.json');
for(const f of present)if(!listed.has(f))E('Archivo no declarado: '+f);
if(zipList){const want=[...listed.keys(),'MANIFIESTO.json'].sort();if(want.join('\n')!==zipList.join('\n'))E('El inventario del ZIP no es exactamente el del manifiesto');}
for(const [p,f] of listed){const x=path.join(dir,p);if(!fs.existsSync(x)){E('Falta '+p);continue;}const b=fs.readFileSync(x);
 if(b.length!==f.bytes)E('Tamaño distinto: '+p);if(sha(b)!==f.sha256)E('Huella distinta: '+p);
 const m=MAGIC[f.type];if(!m)E(`Tipo no admitido en una entrega: ${f.type} (${p})`);else if(!m(b))E(`El contenido de ${p} no es un ${f.type}`);}
// ---------- HTML: referencias y código ----------
for(const p of [...listed.keys()].filter(p=>/\.html?$/.test(p))){const h=fs.readFileSync(path.join(dir,p),'utf8');
 for(const m of h.matchAll(/<script\b([^>]*)>/gi))if(!/type\s*=\s*["']?application\/json/i.test(m[1]))E(`Script ejecutable en ${p}`);
 if(/<(iframe|object|embed|base|form)\b/i.test(h))E(`Marco, objeto, <base> o formulario en ${p}`);
 if(/<meta[^>]+http-equiv\s*=\s*["']?refresh/i.test(h))E(`Redirección automática en ${p}`);
 if(/\son[a-z]+\s*=/i.test(h.replace(/<script[\s\S]*?<\/script>/gi,'')))E(`Atributo de evento (on…) en ${p}`);
 const refs=[];for(const m of h.matchAll(/\s(?:src|href|poster|data)\s*=\s*["']([^"']*)["']/gi))refs.push(m[1]);
 for(const m of h.matchAll(/\ssrcset\s*=\s*["']([^"']*)["']/gi))for(const s of m[1].split(','))refs.push(s.trim().split(/\s+/)[0]);
 for(const m of h.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g))refs.push(m[2]);for(const m of h.matchAll(/@import\s+['"]([^'"]+)['"]/g))refs.push(m[1]);
 for(const u of refs){if(!u||u.startsWith('#')||/^(data|mailto):/i.test(u))continue;if(/^[a-z][a-z0-9+.-]*:/i.test(u)||u.startsWith('//')){E(`Recurso externo en ${p}: ${u.slice(0,80)}`);continue;}
  let d;try{d=decodeURI(u.split(/[?#]/)[0]);}catch{E(`Referencia mal codificada en ${p}`);continue;}
  const t=path.posix.normalize(path.posix.join(path.posix.dirname(p),d));if(t.startsWith('..')||t.startsWith('/'))E(`Ruta fuera de la carpeta en ${p}: ${u}`);else if(!listed.has(t))E(`Referencia sin archivo en ${p}: ${u}`);}}
done();
