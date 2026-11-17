// v1.2 · A01/A02/A03/A05 · EXPORTACIÓN SELECTIVA REAL de la entrega de cliente (prototipo funcional del laboratorio).
// Entrada: una selección (tipo + capítulos + documentos + modo). Salida: una carpeta que contiene FÍSICAMENTE solo lo elegido,
// su manifiesto de todos los archivos y un resumen externo (fuera de la carpeta) con el SHA-256 del manifiesto y del ZIP.
// La web de cliente final no lleva scripts ni escucha mensajes: lo no elegido no se oculta, se elimina del HTML, y los medios
// y PDF que ya no se referencian no se copian. Las comprobaciones (gates) se derivan de los datos y de los artefactos finales,
// no de valores fijos: un «bloquea» impide la exportación y un «revisar» exige reconocimiento explícito en modo cliente.
// Uso: node tools/exportar.cjs <seleccion.json> <dirSalida>   (código de salida 0 exportado · 2 bloqueado · 1 error)
// seleccion.json: {"tipo":"propuesta-comercial","capitulos":[...]?,"documentos":[...]?,"modo":"cliente"|"borrador","reconocidos":["..."]?}
const fs=require('fs'),path=require('path'),crypto=require('crypto'),{execFileSync}=require('child_process'),{chromium}=require('playwright');
const LAB=path.resolve(__dirname,'..'),SRC=process.env.ENTREGA_SRC||path.join(LAB,'out/v3/entrega'),SNAP=process.env.ENTREGA_SNAPSHOT||path.join(LAB,'snapshot/snapshot.json');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const [selFile,outArg]=process.argv.slice(2);
const SEL=JSON.parse(fs.readFileSync(selFile,'utf8')),OUT=path.resolve(outArg);
const REG=JSON.parse(fs.readFileSync(path.join(SRC,'entrega.json'),'utf8')),S=JSON.parse(fs.readFileSync(SNAP,'utf8'));
const TIPOS=Object.fromEntries(REG.tipos.map(t=>[t.tipo,t]));
// Requisitos de contenido de cada documento: un PDF que contiene un capítulo no puede ir si ese capítulo se ha excluido.
// La lista se contrasta además con el texto extraído de cada PDF (gate de fuga), así que un requisito olvidado no pasa.
const DOC_NEEDS={'commercial-proposal-client-v3':['presupuesto'],'entrega-integral':'*','architecture-sheet-strip':[],'interior-book-v3':['estancias'],'materials-furniture-book-v3':['materiales'],'real-estate-sheet-v3':['vivienda','presupuesto'],'real-estate-sheet-v3-sin-presupuesto':['vivienda']};
// El texto de presentación de cada tipo está en su propia página generada (el registro no lo guarda).
const leadOf=t=>{const f=path.join(SRC,TIPOS[t].file);const m=/id="tipoLead"[^>]*>([^<]*)</.exec(fs.readFileSync(f,'utf8'));return m?m[1].replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>'):'';};
const ALLCH=TIPOS.integral.chapters.filter(c=>c!=='portada');
const gates=[];const gate=(k,s,t)=>gates.push({k,s,t});
const listFiles=d=>{const o=[];const w=(x,r='')=>{for(const f of fs.readdirSync(x).sort()){const p=path.join(x,f),rel=r?r+'/'+f:f;fs.statSync(p).isDirectory()?w(p,rel):o.push(rel);}};w(d);return o;};
const pdfText=f=>{try{return execFileSync('pdftotext',['-q',f,'-']).toString();}catch{return '';}};
(async()=>{
 // ---------- 1. selección efectiva ----------
 const base=TIPOS[SEL.tipo];if(!base){console.error('Tipo desconocido: '+SEL.tipo);process.exit(1);}
 const ch=(SEL.capitulos||base.chapters).filter(c=>c!=='portada'),docs=SEL.documentos||base.documents,mode=SEL.modo||'cliente',ack=new Set(SEL.reconocidos||[]);
 for(const c of ch)if(!ALLCH.includes(c))gate('Selección válida','block',`Capítulo desconocido: ${c}.`);
 for(const d of docs){const need=DOC_NEEDS[d];if(need===undefined){gate('Selección válida','block',`Documento desconocido: ${d}.`);continue;}
  const miss=need==='*'?ALLCH.filter(c=>!ch.includes(c)):need.filter(c=>!ch.includes(c));
  if(miss.length)gate('Selección coherente','block',`«${d}» contiene ${miss.join(', ')}, que no están elegidos: regenerar el PDF sin esas secciones o no incluirlo.`);}
 const excluded=ALLCH.filter(c=>!ch.includes(c));
 const custom=!(ch.length===base.chapters.filter(c=>c!=='portada').length&&ch.every(c=>base.chapters.includes(c))&&docs.length===base.documents.length&&docs.every(d=>base.documents.includes(d)));
 // ---------- 2. HTML final: podar en el DOM y serializar (sin scripts, sin nodos ocultos) ----------
 const browser=await chromium.launch({args:['--no-sandbox']});const ctx=await browser.newContext();const ext=[];
 await ctx.route('**/*',r=>{const u=r.request().url();if(/^(file|data|about):/.test(u))return r.continue();ext.push(u);return r.abort();});
 const pg=await ctx.newPage();await pg.goto('file://'+path.join(SRC,'index.html'));
 const html=await pg.evaluate(({ch,excluded,docs,kind,lead})=>{
  for(const s of document.querySelectorAll('section.ch'))if(excluded.includes(s.id))s.remove();
  for(const a of document.querySelectorAll('.toc a'))if(excluded.includes(a.hash.slice(1)))a.remove();
  for(const x of document.querySelectorAll('[data-needs]'))if(excluded.includes(x.dataset.needs))x.remove();else x.hidden=false;
  for(const x of document.querySelectorAll('[data-unless]'))x.hidden=!excluded.includes(x.dataset.unless)&&!!document.querySelector('[data-needs="'+x.dataset.unless+'"]');
  for(const a of document.querySelectorAll('a.doc'))if(!docs.includes(a.dataset.doc))a.remove();
  const docsSec=document.getElementById('documentos');if(docsSec&&!docsSec.querySelector('a.doc'))docsSec.remove(),document.querySelector('.toc a[href="#documentos"]')?.remove();
  const k=document.querySelector('.hero .kind');if(k)k.textContent=kind;const l=document.getElementById('tipoLead');if(l)l.textContent=lead;
  document.querySelectorAll('script').forEach(s=>s.remove());document.querySelectorAll('[hidden]').forEach(x=>x.remove());
  // Si queda un solo número de figura en el héroe, la retícula sigue siendo válida; los enlaces internos a capítulos eliminados se quitan.
  for(const a of document.querySelectorAll('a[href^="#"]'))if(a.hash.length>1&&!document.getElementById(a.hash.slice(1)))a.replaceWith(...a.childNodes);
  return '<!doctype html>\n'+document.documentElement.outerHTML;
 },{ch,excluded,docs,kind:custom?`Selección personalizada a partir de «${base.name}»`:base.name,lead:custom?`Contenido elegido por el estudio: ${ch.length} capítulos y ${docs.length} documentos.`:leadOf(SEL.tipo)});
 await browser.close();
 // ---------- 3. archivos referenciados por el HTML final (solo esos se copian) ----------
 const refs=new Set();for(const m of html.matchAll(/(?:src|href|poster)="([^"#][^"]*)"/g)){const u=m[1];if(/^(data:|mailto:)/.test(u))continue;if(/^[a-z]+:/i.test(u)){gate('Sin recursos externos','block',`Referencia externa en el HTML final: ${u}`);continue;}refs.add(decodeURI(u));}
 for(const d of docs)refs.add(`documentos/${d}.pdf`);
 // ---------- 4. gates derivados de datos y artefactos ----------
 const prof=S.brand?.profile||{},studioEmail=(prof.email||'').toLowerCase();
 if(!prof.name)gate('Identidad del estudio','block','Falta el perfil de «Mi estudio»: la entrega saldría sin firma.');
 else if(/\.invalid$/.test(studioEmail))gate('Identidad del estudio','warn',`Perfil sintético del laboratorio (${prof.email}).`);else gate('Identidad del estudio','ok',prof.name);
 if(REG.project?.id!==S.project.id||REG.project?.revision!==S.project.revision)gate('Mismo proyecto y revisión','block',`El registro de la entrega (${REG.project?.id} ${REG.project?.revision}) no coincide con el snapshot (${S.project.id} ${S.project.revision}).`);
 const usesObra=[...refs].some(r=>/^media\/obra|^documentos\/obra-/.test(r));
 if(usesObra){const fp=REG.ft3d8?.project?.id;if(fp!==S.project.id)gate('Mismo proyecto y revisión','block',`El vídeo/presentación de obra declara el proyecto ${fp||'(ninguno)'}, no ${S.project.id}.`);
  else gate('Plan de obra','warn','Plan de ejemplo importado: fechas ilustrativas y sin presupuesto vinculado (rotulado en la entrega).');}
 if(!gates.some(g=>g.k==='Mismo proyecto y revisión'))gate('Mismo proyecto y revisión','ok',`${S.project.id}, revisión ${S.project.revision}.`);
 if(ch.includes('presupuesto')){const v=S.budget?.test?.view?.client;if(v&&!v.summary.reviewComplete)gate('Presupuesto revisado','warn',`${v.summary.items-v.summary.unreviewed} de ${v.summary.items} partidas revisadas; precios de prueba de laboratorio.`);}
 if([...refs].some(r=>/^media\/ia-/.test(r)))gate('Imágenes IA','warn','Imágenes orientativas generadas con IA, rotuladas y siempre junto a la vista del modelo.');
 // Prohibidos dentro de la entrega: archivos de proyecto editable, geometría en bruto, datos de contacto ajenos.
 const texts=[['index.html',html]];
 for(const r of refs){const f=path.join(SRC,r);if(!fs.existsSync(f)){gate('Archivos presentes','block',`Falta ${r}.`);continue;}
  if(/\.(rubik|zip|json)$/i.test(r))gate('Sin proyecto editable','block',`Archivo no permitido en una entrega de cliente: ${r}.`);
  if(/\.html?$/i.test(r))texts.push([r,fs.readFileSync(f,'utf8')]);if(/\.pdf$/i.test(r))texts.push([r,pdfText(f)]);}
 const editable=texts.filter(([,t])=>/"walls"\s*:\s*\[|"openings"\s*:\s*\[|FloorPlanApp|"rubik-sota\.project"/.test(t)).map(([r])=>r);
 if(editable.length)gate('Sin proyecto editable','block',`Geometría editable o código de la aplicación en: ${editable.join(', ')}.`);else gate('Sin proyecto editable','ok','Ningún archivo de proyecto ni geometría en bruto.');
 const emails=new Set();for(const [r,t] of texts)for(const m of t.matchAll(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g))if(m[0].toLowerCase()!==studioEmail)emails.add(`${m[0]} (${r})`);
 if(emails.size)gate('Datos personales','block',`Contactos que no son del estudio: ${[...emails].join(', ')}.`);else gate('Datos personales','ok','Solo el contacto del estudio.');
 // Fuga de lo excluido: cadenas canónicas de cada capítulo excluido buscadas en todo el texto final (HTML, HTML anexos y PDF).
 const nf=d=>new Intl.NumberFormat('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d});
 const FORBID={presupuesto:(()=>{const v=S.budget?.test?.view?.client;if(!v)return [];return [nf(2).format(v.summary.gross.amount),nf(2).format(v.summary.net.amount),nf(2).format(v.summary.tax.amount),nf(0).format(Math.round(v.summary.gross.amount)),...v.chapters.map(c=>nf(2).format(c.lines.reduce((s,l)=>s+l.subtotalNet,0)))];})(),
  obra:['Cómo avanzará la obra','plan de obra'],recorrido:['Recorrer la vivienda'],decisiones:['Lo que hay que decidir']};
 const leaks=[];for(const c of excluded)for(const s of FORBID[c]||[])for(const [r,t] of texts)if(t.toLowerCase().includes(s.toLowerCase()))leaks.push(`«${s}» (${c}) en ${r}`);
 if(leaks.length)gate('Lo excluido no está','block',`Contenido de capítulos excluidos presente: ${leaks.slice(0,8).join('; ')}${leaks.length>8?` y ${leaks.length-8} más`:''}.`);
 else gate('Lo excluido no está','ok',excluded.length?`Buscado en ${texts.length} archivos de texto: ningún rastro de ${excluded.join(', ')}.`:'Entrega completa.');
 if(ext.length)gate('Sin recursos externos','block',`Peticiones externas al cargar: ${ext.join(', ')}`);
 // ---------- 5. política: bloquea siempre; «revisar» exige reconocimiento en modo cliente ----------
 const blocked=gates.filter(g=>g.s==='block'),pending=mode==='cliente'?gates.filter(g=>g.s==='warn'&&!ack.has(g.k)):[];
 const result={schema:'rubik-lab-export-result/1',modo:mode,tipo:SEL.tipo,capitulos:['portada',...ch],documentos:docs,excluidos:excluded,gates,exportado:false};
 if(blocked.length||pending.length){result.motivo=[...blocked.map(g=>`BLOQUEA · ${g.k}: ${g.t}`),...pending.map(g=>`SIN RECONOCER · ${g.k}: ${g.t}`)];
  fs.mkdirSync(path.dirname(OUT),{recursive:true});fs.writeFileSync(OUT+'.resultado.json',JSON.stringify(result,null,1));if(fs.existsSync(OUT))fs.rmSync(OUT,{recursive:true});
  console.log(JSON.stringify({exportado:false,motivo:result.motivo},null,1));process.exit(2);}
 // ---------- 6. escribir carpeta, manifiesto (todos los archivos salvo él mismo) y resumen externo ----------
 if(fs.existsSync(OUT))fs.rmSync(OUT,{recursive:true});fs.mkdirSync(OUT,{recursive:true});
 let final=html;if(mode==='borrador')final=final.replace('<main>','<main><p style="margin:0;padding:10px 16px;background:#fff4dc;color:#7a5200;font:700 14px/1.4 system-ui">BORRADOR · no apto para enviar al cliente</p>');
 fs.writeFileSync(path.join(OUT,'index.html'),final);
 for(const r of refs){fs.mkdirSync(path.dirname(path.join(OUT,r)),{recursive:true});fs.copyFileSync(path.join(SRC,r),path.join(OUT,r));}
 const prov=Object.fromEntries((REG.pieces||[]).map(p=>[p.file,{from:p.from||null,producer:p.producer||null,sourceSha256:p.sourceSha256||null}]));
 const TYPE={html:'text/html',pdf:'application/pdf',jpg:'image/jpeg',png:'image/png',mp4:'video/mp4'};
 const files=listFiles(OUT).map(rel=>{const b=fs.readFileSync(path.join(OUT,rel));return {path:rel,bytes:b.length,sha256:sha(b),type:TYPE[rel.split('.').pop().toLowerCase()]||'application/octet-stream',origin:rel==='index.html'?'tools/exportar.cjs (HTML final podado)':prov[rel]||{from:'compositor del laboratorio'}};});
 const manifest={schema:'rubik-lab-entrega-manifiesto/1',generated:new Date().toISOString(),project:{id:S.project.id,name:S.project.name,revision:S.project.revision},
  studio:{name:prof.name||null,synthetic:/\.invalid$/.test(studioEmail)},seleccion:{modo:mode,tipo:SEL.tipo,personalizada:custom,capitulos:['portada',...ch],documentos:docs,excluidos:excluded,reconocidos:[...ack]},
  gates,files,notIncluded:['proyecto editable','visita 3D interactiva (requiere enlace publicado)','datos de otros proyectos',...excluded.map(c=>'capítulo '+c)],
  note:'Integridad, no autenticidad ni veracidad: las huellas prueban que los archivos no han cambiado desde la exportación.'};
 const mb=Buffer.from(JSON.stringify(manifest,null,1));fs.writeFileSync(path.join(OUT,'MANIFIESTO.json'),mb);
 const zip=OUT+'.zip';if(fs.existsSync(zip))fs.rmSync(zip);execFileSync('zip',['-qrX',zip,'.'],{cwd:OUT});
 const ext_={schema:'rubik-lab-entrega-digest/1',folder:path.basename(OUT),manifestSha256:sha(mb),zip:path.basename(zip),zipSha256:sha(fs.readFileSync(zip)),zipBytes:fs.statSync(zip).size,files:files.length};
 fs.writeFileSync(OUT+'.digest.json',JSON.stringify(ext_,null,1));result.exportado=true;result.digest=ext_;fs.writeFileSync(OUT+'.resultado.json',JSON.stringify(result,null,1));
 console.log(JSON.stringify({exportado:true,files:files.length,bytes:files.reduce((s,f)=>s+f.bytes,0),digest:ext_},null,1));
})().catch(e=>{console.error(e);process.exit(1);});
