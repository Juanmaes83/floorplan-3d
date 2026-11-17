// v1.3 · A01–A03, A07–A09, A12–A19 · EXPORTACIÓN SELECTIVA REAL de la entrega de cliente (prototipo del laboratorio).
// Entrada: una selección ligada por huella al snapshot. Salida: <dir>/ (solo lo elegido, LEEME y MANIFIESTO dentro),
// <dir>.zip (el ZIP de reparto exacto) y <dir>.digest.json (resumen externo: huellas del manifiesto y de ese ZIP).
// Orden: (1) contrato de la selección → (2) destino confinado y sin sobrescribir → (3) integridad y procedencia de cada
// fuente → (4) HTML final podado en el DOM, sin scripts → (5) grafo de contenido y gates calculados → (6) preparación en
// carpeta temporal exclusiva → (7) comprobación de carrera (nada ha cambiado desde el inicio) → (8) verificador e
// inspector independientes sobre el ZIP exacto → (9) publicación por renombrado. Cualquier fallo deja un informe de
// rechazo aparte (<dir>.rechazo.json) y ni crea ni borra salidas válidas anteriores.
// Uso: node tools/exportar.cjs <seleccion.json> <dirSalida>   → 0 exportado · 2 rechazado/bloqueado · 1 error de entorno
'use strict';
const fs=require('fs'),path=require('path'),os=require('os'),crypto=require('crypto'),{execFileSync,spawnSync}=require('child_process');
const CAT=require('./catalogo-entrega.cjs');
const LAB=path.resolve(__dirname,'..'),SRC=path.resolve(process.env.ENTREGA_SRC||path.join(LAB,'out/v3/entrega'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),shaF=f=>sha(fs.readFileSync(f));
const [selFile,outArg]=process.argv.slice(2);
if(!selFile||!outArg){console.error('Uso: node tools/exportar.cjs <seleccion.json> <dirSalida>');process.exit(1);}
const OUT=path.resolve(outArg),NAME=path.basename(OUT),PARENT=path.dirname(OUT);
let lock=null,stage=null;
const cleanup=()=>{try{stage&&fs.rmSync(stage,{recursive:true,force:true});}catch{}try{lock&&fs.rmdirSync(lock);}catch{}};
// Informe de rechazo: se escribe junto al destino si el destino es válido; nunca toca <dir>, <dir>.zip ni <dir>.digest.json.
const reject=(code,kind,motivo,extra={})=>{const r={schema:'rubik-lab-export-rechazo/1',fecha:new Date().toISOString(),tipo:kind,exportado:false,motivo:[].concat(motivo),...extra};
 if(destOk)try{fs.writeFileSync(OUT+'.rechazo.json',JSON.stringify(r,null,1));}catch{}
 console.log(JSON.stringify({exportado:false,tipo:kind,motivo:r.motivo.slice(0,12)},null,1));cleanup();process.exit(code);};
// ---------- (2a) destino confinado: raíces permitidas, nombre simple, sin enlaces simbólicos ----------
const real=p=>{try{return fs.realpathSync(p);}catch{return null;}};
const ROOTS=[path.join(LAB,'dist'),path.join(LAB,'out'),os.tmpdir(),...(process.env.RUBIK_EXPORT_ROOTS||'').split(':').filter(Boolean)].map(real).filter(Boolean);
let destOk=false;{const rp=real(PARENT);
 if(!rp||!ROOTS.some(r=>rp===r||rp.startsWith(r+path.sep))){console.error(`Destino fuera de las raíces permitidas: ${PARENT}`);process.exit(1);}
 if(!/^[a-z0-9][a-z0-9._-]{0,80}$/.test(NAME)){console.error(`Nombre de salida no permitido: ${NAME}`);process.exit(1);}
 if(rp!==path.resolve(PARENT)&&fs.lstatSync(PARENT).isSymbolicLink()){console.error('El directorio de salida es un enlace simbólico');process.exit(1);}
 destOk=true;}
// ---------- (0) herramientas: si falta una, no hay exportación (nunca «texto vacío válido») ----------
for(const t of ['pdftotext','pdfinfo','ffprobe','zip','unzip','python3']){if(spawnSync('which',[t]).status!==0)reject(1,'entorno',`Falta la herramienta ${t}: no se puede verificar la entrega.`);}
// ---------- (1) contrato estricto de la selección ----------
let SEL,REG,REGRAW;
try{SEL=JSON.parse(fs.readFileSync(selFile,'utf8'));}catch(e){reject(2,'selección inválida','La selección no es un JSON legible.');}
try{REGRAW=fs.readFileSync(path.join(SRC,'entrega.json'));REG=JSON.parse(REGRAW);}catch{reject(1,'entorno','No hay entrega compuesta (entrega.json) en '+path.relative(LAB,SRC));}
if(REG.schema!=='rubik-lab-entrega/0.2')reject(2,'origen','Registro de entrega de una versión no admitida: '+REG.schema);
const SNAP=path.resolve(LAB,REG.snapshot.file);
// el snapshot vive en el laboratorio o junto a la entrega compuesta; nunca en otra parte del disco
if(![LAB,path.dirname(SRC)].some(r=>SNAP.startsWith(r+path.sep))||!/\.json$/.test(SNAP))reject(2,'origen','Ruta de snapshot no permitida en el registro.');
const errs=[];const E=m=>errs.push(m);
const isStrArr=a=>Array.isArray(a)&&a.every(x=>typeof x==='string'&&x.length&&x.length<80);
const dup=a=>a.filter((x,i)=>a.indexOf(x)!==i);
if(!SEL||typeof SEL!=='object'||Array.isArray(SEL))E('La selección debe ser un objeto.');
else{const KEYS=['tipo','capitulos','documentos','omitir','modo','idioma','reconocidos','base','nota','seleccionadaEn'];
 for(const k of Object.keys(SEL))if(!KEYS.includes(k))E(`Campo no admitido: ${k}.`);
 if(!CAT.MODOS.includes(SEL.modo))E(`Modo no válido: ${JSON.stringify(SEL.modo)}. Solo «cliente» o «borrador», siempre explícito.`);
 if(!CAT.IDIOMAS.includes(SEL.idioma))E(`Idioma no válido: ${JSON.stringify(SEL.idioma)}. Solo «es» o «en».`);
 if(!REG.tipos.some(t=>t.tipo===SEL.tipo))E(`Tipo de entrega desconocido: ${JSON.stringify(SEL.tipo)}.`);
 for(const k of ['capitulos','documentos','omitir','reconocidos'])if(SEL[k]!==undefined){if(!isStrArr(SEL[k]))E(`«${k}» debe ser una lista de identificadores.`);else if(dup(SEL[k]).length)E(`«${k}» repetidos: ${[...new Set(dup(SEL[k]))].join(', ')}.`);}
 const b=SEL.base;if(!b||typeof b!=='object')E('Falta «base»: proyecto, revisión y huella del snapshot con los que se preparó la selección.');
 else{if(b.proyecto!==REG.project.id)E(`La selección es del proyecto ${b.proyecto}; la entrega compuesta es de ${REG.project.id}.`);
  if(b.revision!==REG.project.revision)E(`La selección es de la revisión ${b.revision}; la entrega compuesta es de ${REG.project.revision}.`);
  if(b.snapshotSha256!==REG.snapshot.sha256)E('La selección se preparó sobre otro snapshot (huella distinta): está obsoleta.');}}
if(errs.length)reject(2,'selección inválida',errs);
const TIPOS=Object.fromEntries(REG.tipos.map(t=>[t.tipo,t])),base=TIPOS[SEL.tipo];
const ALLCH=TIPOS.integral.chapters.filter(c=>c!=='portada');
const ch=(SEL.capitulos||base.chapters).filter(c=>c!=='portada'),docs=SEL.documentos||base.documents,mode=SEL.modo,ack=new Set(SEL.reconocidos||[]);
for(const c of ch)if(!ALLCH.includes(c))E(`Capítulo desconocido o no compuesto: ${c}.`);
for(const d of docs){if(!CAT.DOCUMENTOS[d])E(`Documento desconocido: ${d}.`);else if(!REG.pieces.some(p=>p.file===`documentos/${d}.pdf`))E(`Documento no disponible en esta entrega compuesta: ${d}.`);}
if(docs.length&&!ch.includes('documentos'))E('Hay documentos elegidos pero no el capítulo «Documentos»: el cliente no tendría cómo abrirlos. Elegir el capítulo o quitar los documentos.');
const omit=SEL.omitir||[];for(const o of omit)if(!CAT.RECURSOS[o])E(`Recurso que no se puede omitir: ${o}. Admitidos: ${Object.keys(CAT.RECURSOS).join(', ')}.`);
for(const r of ack)if(!CAT.AVISOS.includes(r))E(`Reconocimiento de un aviso que no existe: ${r}. Los bloqueos no se reconocen.`);
if(errs.length)reject(2,'selección inválida',errs);
// ---------- (2b) no sobrescribir y exclusión mutua (dos preparaciones simultáneas al mismo destino) ----------
for(const p of [OUT,OUT+'.zip',OUT+'.digest.json'])if(fs.existsSync(p))reject(1,'destino ocupado',`Ya existe ${path.basename(p)}: una entrega anterior no se sobrescribe. Elegir otro nombre.`);
try{fs.mkdirSync(OUT+'.lock');lock=OUT+'.lock';}catch{reject(1,'destino ocupado','Otra exportación está escribiendo en este destino.');}
// ---------- (3) estado de las fuentes al inicio (para la comprobación de carrera) ----------
const state=()=>({snapshot:shaF(SNAP),registro:shaF(path.join(SRC,'entrega.json')),web:Object.fromEntries(REG.web.map(w=>[w.file,fs.existsSync(path.join(SRC,w.file))?shaF(path.join(SRC,w.file)):null]))});
const S0=state();
if(S0.snapshot!==REG.snapshot.sha256)reject(2,'origen obsoleto','El snapshot ha cambiado después de componer la entrega: hay que volver a componer.');
const S=JSON.parse(fs.readFileSync(SNAP,'utf8'));
if(S.project.id!==REG.project.id||S.project.revision!==REG.project.revision)reject(2,'origen','El snapshot y el registro no son del mismo proyecto y revisión.');
for(const w of REG.web)if(S0.web[w.file]!==w.sha256)reject(2,'origen',`La página ${w.file} no coincide con su huella registrada.`);
const PIECE=Object.fromEntries(REG.pieces.map(p=>[p.file,p]));
const gates=[];const gate=(k,s,t)=>gates.push({k,s,t});
const excluded=ALLCH.filter(c=>!ch.includes(c));
const custom=(SEL.omitir||[]).length>0||!(ch.length===base.chapters.filter(c=>c!=='portada').length&&ch.every(c=>base.chapters.includes(c))&&docs.length===base.documents.length&&docs.every(d=>base.documents.includes(d)));
// Idioma: la web y los documentos se componen por idioma; uno que no existe se bloquea (nunca se mezclan idiomas).
const idiomas=REG.idiomas||['es'];if(!idiomas.includes(SEL.idioma))gate('Idioma','block',`La entrega no está compuesta en «${SEL.idioma}» (disponible: ${idiomas.join(', ')}).`);
const leadOf=t=>{const m=/id="tipoLead"[^>]*>([^<]*)</.exec(fs.readFileSync(path.join(SRC,TIPOS[t].file),'utf8'));return m?m[1].replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>'):'';};
(async()=>{
 const {chromium}=require('playwright');
 // ---------- (4) HTML final: podar en el DOM y serializar; referencias recogidas por el parser del navegador ----------
 const browser=await chromium.launch({args:['--no-sandbox']});const ctx=await browser.newContext({javaScriptEnabled:true});const ext=[];
 await ctx.route('**/*',r=>{const u=r.request().url();if(/^(file|data|about|blob):/.test(u))return r.continue();ext.push(u);return r.abort();});
 const pg=await ctx.newPage();await pg.goto('file://'+path.join(SRC,'index.html'));
 const {html,refs:rawRefs}=await pg.evaluate(({excluded,docs,kind,lead,marks})=>{
  for(const m of marks){document.querySelectorAll(`[data-res~="${m}"]`).forEach(x=>x.remove());document.querySelectorAll(`[data-res-sin~="${m}"]`).forEach(x=>x.hidden=false);}
  document.querySelectorAll('[data-res-sin][hidden]').forEach(x=>x.remove());
  for(const s of document.querySelectorAll('section.ch'))if(excluded.includes(s.id))s.remove();
  for(const a of document.querySelectorAll('.toc a'))if(excluded.includes(a.hash.slice(1)))a.remove();
  for(const x of document.querySelectorAll('[data-needs]'))if(excluded.includes(x.dataset.needs))x.remove();else x.hidden=false;
  for(const x of document.querySelectorAll('[data-unless]'))x.hidden=!excluded.includes(x.dataset.unless)&&!!document.querySelector('[data-needs="'+x.dataset.unless+'"]');
  for(const a of document.querySelectorAll('a.doc'))if(!docs.includes(a.dataset.doc))a.remove();
  const docsSec=document.getElementById('documentos');if(docsSec&&!docsSec.querySelector('a.doc'))docsSec.remove(),document.querySelector('.toc a[href="#documentos"]')?.remove();
  const k=document.querySelector('.hero .kind');if(k)k.textContent=kind;const l=document.getElementById('tipoLead');if(l)l.textContent=lead;
  document.querySelectorAll('script,iframe,object,embed,base,meta[http-equiv]').forEach(s=>s.remove());document.querySelectorAll('[hidden]').forEach(x=>x.remove());
  for(const el of document.querySelectorAll('*'))for(const a of [...el.attributes])if(/^on/i.test(a.name))el.removeAttribute(a.name);
  for(const a of document.querySelectorAll('a[href^="#"]'))if(a.hash.length>1&&!document.getElementById(a.hash.slice(1)))a.replaceWith(...a.childNodes);
  // referencias: atributos de recurso, srcset y url() de estilos (inline y <style>)
  const refs=[];const add=(u,where)=>{if(u&&!u.startsWith('#'))refs.push({u,where});};
  for(const el of document.querySelectorAll('[src],[href],[poster],[srcset],[data]'))for(const at of ['src','href','poster','data'])if(el.hasAttribute(at))add(el.getAttribute(at),el.tagName+'@'+at);
  for(const el of document.querySelectorAll('[srcset]'))for(const p of el.getAttribute('srcset').split(','))add(p.trim().split(/\s+/)[0],'srcset');
  const css=[...document.querySelectorAll('style')].map(s=>s.textContent).concat([...document.querySelectorAll('[style]')].map(e=>e.getAttribute('style'))).join('\n');
  for(const m of css.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g))add(m[2],'css url()');for(const m of css.matchAll(/@import\s+(['"])([^'"]+)\1/g))add(m[2],'css @import');
  return {html:'<!doctype html>\n'+document.documentElement.outerHTML,refs};
 },{marks:omit.map(o=>CAT.RECURSOS[o].marca),excluded,docs,kind:custom?`Selección personalizada a partir de «${base.name}»`:base.name,lead:custom?`Contenido elegido por el estudio: ${ch.length} capítulos y ${docs.length} documentos${omit.length?` (sin ${omit.map(o=>({'imagenes-ia':'imágenes IA','videos':'vídeos'})[o]).join(' ni ')})`:''}.`:leadOf(SEL.tipo)});
 // ---------- (5a) referencias: esquema, confinamiento, existencia, registro ----------
 const refs=new Set();
 for(const {u,where} of rawRefs){if(/^data:/i.test(u))continue;if(/^mailto:/i.test(u))continue;
  if(/^[a-z][a-z0-9+.-]*:/i.test(u)||u.startsWith('//')){gate('Sin recursos externos','block',`Referencia externa (${where}): ${u.slice(0,80)}`);continue;}
  let r;try{r=decodeURI(u.split(/[?#]/)[0]);}catch{gate('Rutas válidas','block',`Ruta mal codificada: ${u.slice(0,80)}`);continue;}
  const n=path.posix.normalize(r);if(n.startsWith('/')||n.startsWith('..')||r.includes('\\')||!CAT.RUTA.test(n)){gate('Rutas válidas','block',`Ruta no permitida (${where}): ${u.slice(0,80)}`);continue;}
  refs.add(n);}
 for(const d of docs)refs.add(`documentos/${d}.pdf`);
 const files=[...refs].sort();let total=0;
 for(const r of files){const f=path.join(SRC,r),ext_=r.split('.').pop().toLowerCase();
  if(!CAT.FORMATOS[ext_]||ext_==='json'||ext_==='txt'){gate('Formato permitido','block',`Formato no admitido en la entrega: ${r}.`);continue;}
  let st;try{st=fs.lstatSync(f);}catch{gate('Archivos presentes','block',`Falta ${r}.`);continue;}
  if(st.isSymbolicLink()||!st.isFile()||!real(f).startsWith(real(SRC)+path.sep)){gate('Rutas válidas','block',`${r} es un enlace o sale de la entrega compuesta.`);continue;}
  if(st.size>CAT.LIMITES.bytesArchivo)gate('Tamaño','block',`${r} supera ${CAT.LIMITES.bytesArchivo/1048576} MB.`);total+=st.size;
  const p=PIECE[r];if(!p){gate('Procedencia','block',`${r} no está en el registro de la entrega: procedencia no acreditada.`);continue;}
  const b=fs.readFileSync(f);
  if(sha(b)!==p.sha256)gate('Integridad de origen','block',`${r} no coincide con la huella registrada al componer.`);
  if(!CAT.firma(ext_,b))gate('Formato válido','block',`${r} no tiene la firma de un ${ext_.toUpperCase()}.`);
  if(p.sourceSha256&&p.from){const of=path.join(LAB,p.from);if(!fs.existsSync(of))p._origen='no disponible para comprobar';else if(shaF(of)!==p.sourceSha256)gate('Origen vigente','block',`El origen de ${r} (${p.from}) ha cambiado después de componer: la entrega está obsoleta.`);else p._origen='comprobado';}}
 if(files.length>CAT.LIMITES.archivos)gate('Tamaño','block',`Más de ${CAT.LIMITES.archivos} archivos.`);if(total>CAT.LIMITES.bytesTotal)gate('Tamaño','block','La entrega supera el tamaño máximo documentado.');
 // ---------- (5b) grafo de contenido: ningún archivo de un capítulo excluido, ningún documento que lo contenga ----------
 const graphLeaks=[];for(const r of files){const p=PIECE[r];
  if(r.startsWith('documentos/')&&r.endsWith('.pdf')){const c=CAT.DOCUMENTOS[r.slice(11,-4)]?.contiene;const need=c==='*'?ALLCH:c||[];const miss=need.filter(x=>excluded.includes(x));if(miss.length)graphLeaks.push(`${r} contiene ${miss.join(', ')}`);}
  else if(p&&p.capitulo&&excluded.includes(p.capitulo))graphLeaks.push(`${r} pertenece a «${p.capitulo}»`);}
 for(const r of files){for(const o of omit)if(CAT.RECURSOS[o].archivos.test(r))graphLeaks.push(`${r} es un recurso omitido («${o}»)`);
  if(r.startsWith('documentos/')&&r.endsWith('.pdf'))for(const o of (CAT.DOCUMENTOS[r.slice(11,-4)]?.recursos||[]).filter(x=>omit.includes(x)))graphLeaks.push(`${r} contiene el recurso omitido «${o}»`);}
 if(graphLeaks.length)gate('Lo excluido no está','block',`Por el grafo de contenido: ${graphLeaks.join('; ')}.`);
 // ---------- (5c) lectura real de cada archivo (los errores de herramienta bloquean) ----------
 const texts=[['index.html',html]];
 const run=(cmd,args)=>{const r=spawnSync(cmd,args,{maxBuffer:1<<28});return r.status===0?r.stdout.toString():null;};
 for(const r of files){const f=path.join(SRC,r);if(!fs.existsSync(f))continue;
  if(r.endsWith('.pdf')){const t=run('pdftotext',['-q',f,'-']),i=run('pdfinfo',[f]);if(t===null||i===null||!/Pages:\s+[1-9]/.test(i))gate('Formato válido','block',`${r}: PDF ilegible para pdftotext/pdfinfo.`);else texts.push([r,t]);}
  else if(r.endsWith('.mp4')){const j=run('ffprobe',['-v','error','-show_streams','-of','json',f]);let ok=false;try{ok=JSON.parse(j).streams.some(s=>s.codec_type==='video');}catch{}if(!ok)gate('Formato válido','block',`${r}: vídeo ilegible para ffprobe.`);}
  else if(r.endsWith('.html')){texts.push([r,fs.readFileSync(f,'utf8')]);
   // anexo HTML (presentación FT3D-8): se abre sin red; ninguna petición externa; scripts solo de datos (application/json)
   const a=await ctx.newPage();const before=ext.length;await a.goto('file://'+f);await a.waitForTimeout(300);
   const {bad,extRefs}=await a.evaluate(()=>{const u=[];for(const el of document.querySelectorAll('[src],[href],[poster],[srcset],[data]'))for(const at of ['src','href','poster','data','srcset'])if(el.hasAttribute(at))u.push(...el.getAttribute(at).split(',').map(x=>x.trim().split(/\s+/)[0]));
    const css=[...document.querySelectorAll('style')].map(s=>s.textContent).concat([...document.querySelectorAll('[style]')].map(e=>e.getAttribute('style'))).join('\n');for(const m of css.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g))u.push(m[2]);
    return {bad:[...document.scripts].filter(s=>s.type!=='application/json').length+document.querySelectorAll('iframe,object,embed,base,form').length+[...document.querySelectorAll('*')].filter(e=>[...e.attributes].some(x=>/^on/i.test(x.name))).length,
     extRefs:u.filter(x=>/^[a-z][a-z0-9+.-]*:/i.test(x)&&!/^(data|mailto|blob):/i.test(x)||x.startsWith('//'))};});await a.close();
   if(extRefs.length)gate('Sin recursos externos','block',`${r} referencia recursos externos: ${extRefs.slice(0,3).join(', ')}.`);
   if(ext.length>before)gate('Sin recursos externos','block',`${r} pide recursos externos al abrirse.`);if(bad)gate('Sin código ejecutable','block',`${r} contiene ${bad} script(s) ejecutable(s) o marcos.`);}}
 await browser.close();
 // ---------- (5d) gates derivados de datos ----------
 const prof=S.brand?.profile||{},studioEmail=(prof.email||'').toLowerCase();
 if(!prof.name)gate('Identidad del estudio','block','Falta el perfil de «Mi estudio»: la entrega saldría sin firma.');
 else if(/\.invalid$/.test(studioEmail))gate('Identidad del estudio','warn',`Perfil sintético del laboratorio (${prof.email}).`);else gate('Identidad del estudio','ok',prof.name);
 const usesObra=files.some(r=>PIECE[r]?.capitulo==='obra');
 if(usesObra){const ft=REG.ft3d8;
  if(!ft)gate('Mismo proyecto y revisión','block','Hay piezas de obra pero el registro no tiene manifiesto FT3D-8.');
  else{if(ft.project?.id!==S.project.id)gate('Mismo proyecto y revisión','block',`El vídeo/presentación de obra declara el proyecto ${ft.project?.id||'(ninguno)'}, no ${S.project.id}.`);
   const mf=path.join(LAB,ft.file);if(!fs.existsSync(mf)||shaF(mf)!==ft.sha256)gate('Integridad de origen','block','El manifiesto FT3D-8 original no coincide con su huella registrada.');
   gate('Plan de obra','warn','Plan de ejemplo importado: fechas ilustrativas y sin presupuesto vinculado (rotulado en la entrega).');}}
 if(!gates.some(g=>g.k==='Mismo proyecto y revisión'))gate('Mismo proyecto y revisión','ok',`${S.project.id}, revisión ${S.project.revision}.`);
 if(ch.includes('presupuesto')){const v=S.budget?.test?.view?.client;if(v&&!v.summary.reviewComplete)gate('Presupuesto revisado','warn',`${v.summary.items-v.summary.unreviewed} de ${v.summary.items} partidas revisadas; precios de prueba de laboratorio.`);}
 if(files.some(r=>/^media\/ia-/.test(r)))gate('Imágenes IA','warn','Imágenes orientativas generadas con IA, rotuladas y siempre junto a la vista del modelo.');
 const editable=texts.filter(([,t])=>/"walls"\s*:\s*\[|"openings"\s*:\s*\[|FloorPlanApp|"rubik-sota\.project"/.test(t)).map(([r])=>r);
 if(editable.length)gate('Sin proyecto editable','block',`Geometría editable o código de la aplicación en: ${editable.join(', ')}.`);else gate('Sin proyecto editable','ok','Ningún archivo de proyecto ni geometría en bruto.');
 const emails=new Set();for(const [r,t] of texts)for(const m of t.matchAll(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g))if(m[0].toLowerCase()!==studioEmail)emails.add(`${m[0]} (${r})`);
 if(emails.size)gate('Datos personales','block',`Contactos que no son del estudio: ${[...emails].join(', ')}.`);else gate('Datos personales','ok','Solo el contacto del estudio.');
 // auxiliar al grafo: búsqueda de cifras canónicas y títulos de capítulos excluidos en todo el texto final
 const nf=d=>new Intl.NumberFormat('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d});
 const v=S.budget?.test?.view?.client;
 const FORBID={presupuesto:v?[nf(2).format(v.summary.gross.amount),nf(2).format(v.summary.net.amount),nf(2).format(v.summary.tax.amount),nf(0).format(Math.round(v.summary.gross.amount)),...v.chapters.map(c=>nf(2).format(c.lines.reduce((s,l)=>s+l.subtotalNet,0))),...v.chapters.flatMap(c=>c.lines.map(l=>nf(2).format(l.subtotalNet))).filter(x=>x.length>=6)]:[],
  obra:['Cómo avanzará la obra','plan de obra'],recorrido:['Recorrer la vivienda'],decisiones:['Lo que hay que decidir'],materiales:['Materiales y mobiliario'],dibujo:['Del dibujo a la imagen']};
 const leaks=[];for(const c of excluded)for(const s of new Set(FORBID[c]||[]))for(const [r,t] of texts)if(t.toLowerCase().includes(s.toLowerCase()))leaks.push(`«${s}» (${c}) en ${r}`);
 if(leaks.length)gate('Lo excluido no está','block',`Texto de capítulos excluidos presente: ${leaks.slice(0,8).join('; ')}${leaks.length>8?` y ${leaks.length-8} más`:''}.`);
 else if(!graphLeaks.length)gate('Lo excluido no está','ok',excluded.length?`Grafo y texto (${texts.length} archivos) sin rastro de ${excluded.join(', ')}.`:'Entrega completa.');
 if(ext.length)gate('Sin recursos externos','block',`Peticiones externas al cargar: ${ext.slice(0,5).join(', ')}`);
 // ---------- política: un bloqueo nunca se salta; un aviso exige reconocimiento en modo cliente ----------
 const blocked=gates.filter(g=>g.s==='block'),pending=mode==='cliente'?gates.filter(g=>g.s==='warn'&&!ack.has(g.k)):[];
 const sel={modo:mode,idioma:SEL.idioma,tipo:SEL.tipo,personalizada:custom,capitulos:['portada',...ch],documentos:docs,omitidos:omit,excluidos:excluded,reconocidos:[...ack].filter(k=>gates.some(g=>g.k===k&&g.s==='warn'))};
 if(blocked.length||pending.length)reject(2,'bloqueado',[...blocked.map(g=>`BLOQUEA · ${g.k}: ${g.t}`),...pending.map(g=>`SIN RECONOCER · ${g.k}: ${g.t}`)],{seleccion:sel,gates});
 // ---------- (6) preparación en carpeta temporal exclusiva, en el mismo sistema de archivos que el destino ----------
 stage=fs.mkdtempSync(path.join(PARENT,'.exportando-'));const DIR=path.join(stage,NAME);fs.mkdirSync(DIR);
 let final=html;if(mode==='borrador')final=final.replace('<main>','<main><p style="margin:0;padding:10px 16px;background:#fff4dc;color:#7a5200;font:700 14px/1.4 system-ui">BORRADOR · no apto para enviar al cliente</p>');
 fs.writeFileSync(path.join(DIR,'index.html'),final);
 for(const r of files){fs.mkdirSync(path.dirname(path.join(DIR,r)),{recursive:true});fs.copyFileSync(path.join(SRC,r),path.join(DIR,r));}
 // borrador: cada PDF lleva el rótulo en todas sus páginas (estampado sobre el original; la huella cambia y se declara)
 if(mode==='borrador'&&files.some(r=>r.endsWith('.pdf'))){const st=spawnSync('python3',['-I',path.join(__dirname,'estampar-borrador.py'),DIR,...files.filter(r=>r.endsWith('.pdf'))],{encoding:'utf8'});
  if(st.status!==0)reject(1,'entorno',`No se pudo rotular «borrador» en los PDF: ${(st.stderr||'').slice(0,200)}`);}
 const fecha=new Intl.DateTimeFormat('es-ES',{dateStyle:'long',timeZone:'Europe/Madrid'}).format(new Date(REG.generated));
 fs.writeFileSync(path.join(DIR,'LEEME.txt'),[`${S.brand?.title||S.project.name}. Entrega de ${prof.name||'estudio'} (${custom?'selección personalizada':base.name}).`,mode==='borrador'?'BORRADOR: no apto para enviar al cliente.':'',
  `Proyecto ${S.project.id}, revisión ${S.project.revision}. Compuesta el ${fecha}.`,'',
  'Cómo abrirla: descomprimir la carpeta y abrir index.html en un navegador. Funciona sin conexión y sin instalar nada.',
  'Qué contiene y con qué huella: MANIFIESTO.json, dentro de esta carpeta, lista cada archivo con su tamaño y su SHA-256.',
  'La huella del manifiesto y la del ZIP están en el resumen externo (archivo .digest.json), que se entrega por separado.','Es una prueba de integridad,',
  'no una firma digital: demuestra que los archivos no han cambiado desde la exportación, no quién los firma ni que sean ciertos.','',
  'No contiene el proyecto editable ni la visita 3D interactiva (esa necesita un enlace publicado).',
  /\.invalid$/.test(studioEmail)?'Datos de laboratorio: estudio sintético y precios de prueba.':''].filter((x,i,a)=>x!==''||a[i-1]!=='').join('\n')+'\n');
 const listFiles=d=>{const o=[];const w=(x,r='')=>{for(const f of fs.readdirSync(x).sort()){const p=path.join(x,f),rel=r?r+'/'+f:f;fs.statSync(p).isDirectory()?w(p,rel):o.push(rel);}};w(d);return o;};
 const mfiles=listFiles(DIR).map(rel=>{const b=fs.readFileSync(path.join(DIR,rel)),p=PIECE[rel],e=rel.split('.').pop().toLowerCase();
  const origin=rel==='index.html'?{producer:'tools/exportar.cjs',transform:'HTML final podado (sin scripts) a partir de '+TIPOS.integral.file,from:'entrega compuesta',sourceSha256:REG.web.find(w=>w.file===TIPOS.integral.file).sha256}
   :rel==='LEEME.txt'?{producer:'tools/exportar.cjs'}
   :{producer:p.producer||'compositor del laboratorio (tools/compose.cjs)',from:p.from||null,sourceSha256:p.sourceSha256||null,transform:p.transform||(mode==='borrador'&&e==='pdf'?'rótulo de borrador estampado':null),composedSha256:p.sha256,origenComprobado:p._origen||(p.from?'sin huella de origen registrada':'pieza producida por el compositor'),capitulo:p.capitulo??null};
  return {path:rel,bytes:b.length,sha256:sha(b),type:CAT.FORMATOS[e].mime,origin};});
 const manifest={schema:'rubik-lab-entrega-manifiesto/2',generated:REG.generated,project:{id:S.project.id,name:S.project.name,revision:S.project.revision},
  base:{snapshotSha256:REG.snapshot.sha256,registroSha256:sha(REGRAW)},studio:{name:prof.name||null,synthetic:/\.invalid$/.test(studioEmail)},seleccion:sel,gates,files:mfiles,
  notIncluded:['proyecto editable','visita 3D interactiva (requiere enlace publicado)','datos de otros proyectos',...excluded.map(c=>'capítulo '+c),...omit.map(o=>'recurso '+o)],
  note:'Integridad, no autenticidad ni veracidad: las huellas prueban que los archivos no han cambiado desde la exportación. El resumen externo no es una firma digital.'};
 const mb=Buffer.from(JSON.stringify(manifest,null,1));fs.writeFileSync(path.join(DIR,'MANIFIESTO.json'),mb);
 // ZIP reproducible: entradas ordenadas, fecha fija (la de composición), sin atributos extra
 const t=new Date(REG.generated);for(const rel of [...listFiles(DIR)])fs.utimesSync(path.join(DIR,rel),t,t);
 const ZIP=path.join(stage,NAME+'.zip');const list=listFiles(DIR).map(r=>NAME+'/'+r);
 execFileSync('zip',['-qX','-D',ZIP,'-@'],{cwd:stage,input:list.join('\n')});
 const zb=fs.readFileSync(ZIP);const digest={schema:'rubik-lab-entrega-digest/2',folder:NAME,manifest:`${NAME}/MANIFIESTO.json`,manifestSha256:sha(mb),zip:NAME+'.zip',zipSha256:sha(zb),zipBytes:zb.length,files:mfiles.length+1,
  alcance:'Huellas SHA-256 del manifiesto y del ZIP de reparto exacto. Integridad, no firma ni autenticidad.'};
 fs.writeFileSync(path.join(stage,NAME+'.digest.json'),JSON.stringify(digest,null,1));
 // gancho SOLO de pruebas: simula un cambio de las fuentes mientras se prepara (carrera)
 if(process.env.RUBIK_LAB_TEST==='1'&&process.env.RUBIK_LAB_TEST_HOOK)require(path.resolve(process.env.RUBIK_LAB_TEST_HOOK))({SRC,LAB,DIR,stage});
 // ---------- (7) carrera: las fuentes deben seguir idénticas al estado del inicio ----------
 const S1=state();const changed=[];if(S1.snapshot!==S0.snapshot)changed.push('snapshot');if(S1.registro!==S0.registro)changed.push('registro de la entrega');
 for(const k of Object.keys(S0.web))if(S1.web[k]!==S0.web[k])changed.push(k);
 for(const r of files)if(!fs.existsSync(path.join(SRC,r))||shaF(path.join(SRC,r))!==PIECE[r].sha256)changed.push(r);
 if(changed.length)reject(2,'obsoleto',`Las fuentes han cambiado durante la preparación (${changed.slice(0,6).join(', ')}): se cancela este candidato. Volver a preparar.`,{seleccion:sel});
 // ---------- (8) verificación independiente del ZIP exacto + inspección por tipo de archivo ----------
 const ver=spawnSync('node',[path.join(__dirname,'verificar-entrega.cjs'),'--zip',ZIP,'--digest',path.join(stage,NAME+'.digest.json')],{encoding:'utf8'});
 if(ver.status!==0)reject(1,'verificación',`El verificador independiente rechaza el candidato: ${(ver.stdout||ver.stderr).slice(0,400)}`);
 const insp=spawnSync('python3',['-I',path.join(__dirname,'inspeccionar-paquete.py'),ZIP,'cliente',path.join(stage,'inspeccion.json')],{encoding:'utf8'});
 if(insp.status!==0)reject(insp.status===4?2:1,'inspección',`La inspección del ZIP encuentra problemas: ${(insp.stdout||insp.stderr).slice(0,400)}`);
 // ---------- (9) publicación: renombrado del ZIP, del resumen y de la carpeta (mismo sistema de archivos) ----------
 fs.renameSync(ZIP,OUT+'.zip');fs.renameSync(path.join(stage,NAME+'.digest.json'),OUT+'.digest.json');fs.renameSync(DIR,OUT);
 const result={schema:'rubik-lab-export-result/2',exportado:true,seleccion:sel,gates,digest,inspeccion:JSON.parse(fs.readFileSync(path.join(stage,'inspeccion.json'),'utf8')).bloquea===0?'sin hallazgos que bloqueen':'?'};
 fs.writeFileSync(OUT+'.resultado.json',JSON.stringify(result,null,1));if(fs.existsSync(OUT+'.rechazo.json'))fs.rmSync(OUT+'.rechazo.json');cleanup();
 console.log(JSON.stringify({exportado:true,files:digest.files,bytes:mfiles.reduce((s,f)=>s+f.bytes,0),digest},null,1));
})().catch(e=>{console.error(e);cleanup();process.exit(1);});
