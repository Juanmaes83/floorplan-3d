// v1.2 · A02/ST04 · Verificador INDEPENDIENTE de una entrega exportada por tools/exportar.cjs. No importa código del exportador.
// Comprueba: (1) el SHA-256 de MANIFIESTO.json coincide con el resumen externo <carpeta>.digest.json; (2) cada archivo de la
// carpeta (salvo el manifiesto) está en el manifiesto y no hay ninguno de más; (3) bytes y SHA-256 de cada archivo coinciden;
// (4) cada referencia relativa del HTML apunta a un archivo del manifiesto; (5) el HTML no tiene scripts, iframes ni recursos
// externos; (6) si existe el ZIP, su SHA-256 coincide con el resumen externo. Integridad, no autenticidad ni veracidad.
// Uso: node tools/verificar-entrega.cjs <carpeta>   → código 0 válido · 3 inválido
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const dir=path.resolve(process.argv[2]);const errs=[];const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const walk=(d,r='')=>fs.readdirSync(d).sort().flatMap(f=>{const p=path.join(d,f),rel=r?r+'/'+f:f;return fs.statSync(p).isDirectory()?walk(p,rel):[rel];});
let man,dig;try{dig=JSON.parse(fs.readFileSync(dir+'.digest.json','utf8'));}catch{errs.push('Falta el resumen externo '+path.basename(dir)+'.digest.json');}
try{const mb=fs.readFileSync(path.join(dir,'MANIFIESTO.json'));man=JSON.parse(mb);if(dig&&sha(mb)!==dig.manifestSha256)errs.push('MANIFIESTO.json no coincide con el resumen externo');}catch{errs.push('Falta o no se puede leer MANIFIESTO.json');}
if(man){const listed=new Map(man.files.map(f=>[f.path,f]));const present=walk(dir).filter(f=>f!=='MANIFIESTO.json');
 for(const f of present)if(!listed.has(f))errs.push('Archivo no declarado: '+f);
 for(const [p,f] of listed){const x=path.join(dir,p);if(!fs.existsSync(x)){errs.push('Falta '+p);continue;}const b=fs.readFileSync(x);if(b.length!==f.bytes)errs.push(`Tamaño distinto: ${p}`);if(sha(b)!==f.sha256)errs.push(`Huella distinta: ${p}`);}
 for(const p of [...listed.keys()].filter(p=>/\.html?$/.test(p))){const h=fs.readFileSync(path.join(dir,p),'utf8');
  if(p==='index.html'){if(/<script(?![^>]*type="application\/json")/i.test(h))errs.push('index.html contiene scripts');if(/<iframe/i.test(h))errs.push('index.html contiene iframes');}
  for(const m of h.matchAll(/(?:src|href|poster)="([^"#][^"]*)"/g)){const u=m[1];if(/^(data:|mailto:)/.test(u))continue;if(/^[a-z]+:/i.test(u)){errs.push(`Recurso externo en ${p}: ${u}`);continue;}
   const t=path.posix.normalize(path.posix.join(path.posix.dirname(p),decodeURI(u)));if(t.startsWith('..'))errs.push(`Ruta fuera de la carpeta en ${p}: ${u}`);else if(!listed.has(t))errs.push(`Referencia sin archivo en ${p}: ${u}`);}}}
if(dig&&fs.existsSync(dir+'.zip')&&sha(fs.readFileSync(dir+'.zip'))!==dig.zipSha256)errs.push('El ZIP no coincide con el resumen externo');
console.log(JSON.stringify({carpeta:path.basename(dir),valido:!errs.length,archivos:man?man.files.length:0,errores:errs},null,1));process.exit(errs.length?3:0);
