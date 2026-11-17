// v1.4 · N01 · QA DE RECETAS (RP-Q01 taxonomía, RP-Q02 selector y elegibilidad, parte de RP-Q03/RP-Q08 y RP-Q10).
// Confronta los ZIP finales, no el DOM: cada receta L se exporta de verdad en ES y EN, se verifica con verificar-entrega
// y se comprueba su contenido contra la resolución. C y F deben rechazarse sin dejar descarga.
// Uso: node tools/recetas-qa.cjs [dirTrabajo] [partes=esquema,exportar,negativos,ui] → evidence/recetas/recetas-qa.json
'use strict';
const fs=require('fs'),path=require('path'),os=require('os'),{spawnSync,execFileSync}=require('child_process');
const {createHash}=require('crypto'),{isDeepStrictEqual}=require('util');
const RC=require('./recetas.cjs'),CAT=require('./catalogo-entrega.cjs');
const LAB=path.resolve(__dirname,'..'),SRC=path.join(LAB,'out/v3/entrega'),EV=path.join(LAB,'evidence/recetas');
const root=path.resolve(process.argv[2]||os.tmpdir());
fs.mkdirSync(root,{recursive:true});
const W=fs.mkdtempSync(path.join(root,'rubik-recetas-'));fs.mkdirSync(EV,{recursive:true});
const PARTS=(process.argv[3]||'esquema,exportar,negativos,ui').split(',');
const ACK='Identidad del estudio,Presupuesto revisado,Imágenes IA,Plan de obra'; // reconocimiento explícito del QA, como en package.sh
const casos=[];const caso=(id,ok,detalle)=>{casos.push({id,ok:!!ok,detalle});console.log(`${ok?'PASS':'FAIL'} ${id}${ok?'':' · '+JSON.stringify(detalle).slice(0,300)}`);};
const ctx=RC.contexto(LAB,SRC);const REG=ctx.REG;
const hash=b=>createHash('sha256').update(b).digest('hex');
const registroSha=()=>hash(fs.readFileSync(path.join(SRC,'entrega.json')));
const frozen=registroSha();
const run=(args,env={})=>spawnSync('node',args,{encoding:'utf8',env:{...process.env,...env}});
const exists=p=>fs.existsSync(p);
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const verify=out=>run([path.join(__dirname,'verificar-entrega.cjs'),'--zip',out+'.zip','--digest',out+'.digest.json']);
const manifest=out=>read(path.join(out,'MANIFIESTO.json'));
function inventory(files){
 const entries=new Map();
 for(const file of files){
  const normalized=path.posix.normalize(file.path.replaceAll('\\','/'));
  if(entries.has(normalized))throw new Error('Ruta duplicada en el inventario: '+normalized);
  entries.set(normalized,{...file,path:normalized});
 }
 return entries;
}
function compare(a,b){
 const project={id:REG.project.id,revision:REG.project.revision};
 const base={snapshotSha256:REG.snapshot.sha256,registroSha256:frozen};
 const identify=m=>m.project?.id===project.id&&m.project?.revision===project.revision&&isDeepStrictEqual(m.base,base);
 const canonical=s=>({...s,...Object.fromEntries(['capitulos','documentos','omitidos','excluidos','reconocidos'].map(k=>[k,[...s[k]].sort()]))});
 const {files:left,seleccion:ls,...lm}=a,{files:right,seleccion:rs,...rm}=b;
 const A=inventory(left),B=inventory(right);
 return {identidad:identify(a)&&identify(b),seleccion:isDeepStrictEqual(canonical(ls),canonical(rs)),
  manifiesto:isDeepStrictEqual(lm,rm),inventario:A.size>0&&isDeepStrictEqual(A,B),
  distintas:[...new Set([...A.keys(),...B.keys()])].filter(k=>!isDeepStrictEqual(A.get(k),B.get(k))).sort()};
}
// ---------------------------------------------------------------- RP-Q01 esquema y compatibilidad
if(PARTS.includes('esquema')){
 const R=RC.RECETAS,keys=R.map(r=>r.key);
 caso('Q01-claves',keys.length===21&&new Set(keys).size===21&&keys.every((k,i)=>k===`RP${String(i+1).padStart(2,'0')}`),keys);
 const niv=l=>R.filter(r=>r.nivel===l).map(r=>r.key);
 caso('Q01-niveles',niv('L').join()==='RP01,RP02,RP03,RP04,RP05,RP06,RP07,RP08,RP09,RP10,RP11,RP12'&&niv('C').join()==='RP13,RP14,RP15,RP17,RP21'&&niv('F').join()==='RP16,RP18,RP19,RP20',{L:niv('L'),C:niv('C'),F:niv('F')});
 const mods=CAT.MODULOS.map(m=>m.n),bad=[];
 for(const r of R){
  if(!r.es||!r.en)bad.push(r.key+': etiqueta');if(!r.fases.length||!r.fases.every(f=>RC.FASES[f]))bad.push(r.key+': fase');
  if(!r.perfiles.length||!r.perfiles.every(p=>RC.PERFILES[p]))bad.push(r.key+': perfil');if(!RC.FAMILIAS[r.familia])bad.push(r.key+': familia');
  if(r.tipo!==null&&!RC.TIPOS_DOC.includes(r.tipo))bad.push(r.key+': tipo');if(r.tipo===null&&r.nivel!=='F')bad.push(r.key+': solo F sin tipo');
  if(!r.modulos.length||!r.modulos.every(m=>mods.includes(m)))bad.push(r.key+': módulo');
  for(const f of [...r.requeridas,...r.completas,...r.opcionales])if(!RC.FUENTES[f])bad.push(r.key+': fuente '+f);
  if(!r.autoridad?.es||!r.autoridad?.en)bad.push(r.key+': autoridad');
  if(r.nivel==='L'){if(!r.sel||!RC.MODALIDADES.includes(r.sel.tipo))bad.push(r.key+': modalidad');
   for(const c of r.sel?.capitulos||[])if(!CAT.CAPITULOS.includes(c)||c==='portada')bad.push(r.key+': capítulo '+c);
   for(const d of r.sel?.documentos||[])if(!CAT.DOCUMENTOS[d])bad.push(r.key+': documento '+d);
   if(r.sel?.documentos?.length&&!r.sel.capitulos?.includes('documentos'))bad.push(r.key+': documentos sin capítulo');}
  else{if(r.sel)bad.push(r.key+': C/F con selección');if(!r.contrato?.length)bad.push(r.key+': C/F sin contrato');}}
 caso('Q01-campos',!bad.length,bad);
 // compatibilidad: ningún ID nuevo de producto; los ejes existentes intactos
 const reg7=REG.tipos.map(t=>t.tipo);
 caso('Q01-modalidades-intactas',reg7.length===7&&RC.MODALIDADES.every(m=>reg7.includes(m)),reg7);
 caso('Q01-modulos-10',CAT.MODULOS.length===10,CAT.MODULOS.map(m=>m.n));
 caso('Q01-tipos-5-story-5',RC.TIPOS_DOC.length===5&&RC.STORY.length===5,{tipos:RC.TIPOS_DOC,story:RC.STORY});
 const clash=keys.filter(k=>reg7.includes(k)||CAT.DOCUMENTOS[k]||CAT.CAPITULOS.includes(k));caso('Q01-sin-ids-nuevos-de-producto',!clash.length,clash);
 // RP-Q02 filtros reversibles: no mutan nada y la resolución no depende del filtro
 const before=JSON.stringify(R),res0=JSON.stringify(R.map(r=>RC.resolver(r.key,ctx,'es')));
 const fil={};for(const p of Object.keys(RC.PERFILES))for(const f of [null,...Object.keys(RC.FASES)])fil[p+(f||'')]=RC.filtrar({perfil:p,fase:f||undefined}).map(r=>r.key);
 for(const f of Object.keys(RC.FASES))fil[f]=RC.filtrar({fase:f}).map(r=>r.key);
 caso('Q02-filtros-cubren',Object.keys(RC.PERFILES).every(p=>fil[p].length)&&Object.keys(RC.FASES).every(f=>fil[f].length)&&new Set([].concat(...Object.keys(RC.PERFILES).map(p=>fil[p]))).size===21,fil);
 caso('Q02-filtros-no-mutan',JSON.stringify(R)===before&&JSON.stringify(R.map(r=>RC.resolver(r.key,ctx,'es')))===res0,'');
 let thr=0;try{RC.filtrar({perfil:'XX'});}catch{thr++;}try{RC.filtrar({fase:'Z'});}catch{thr++;}caso('Q02-filtro-desconocido-rechazado',thr===2,thr);
 fs.writeFileSync(path.join(EV,'filtros.json'),JSON.stringify(fil,null,1));
 // matriz RP01–RP21 con su resolución (ES), evidencia legible para el registro
 fs.writeFileSync(path.join(EV,'matriz-recetas.json'),JSON.stringify(R.map(r=>{const x=RC.resolver(r.key,ctx,'es');return {key:r.key,es:r.es,en:r.en,nivel:r.nivel,fases:r.fases,perfiles:r.perfiles,familia:r.familia,tipo:r.tipo,modulos:r.modulos,corte:r.corte,
  estado:x.estado,modalidad:x.seleccion?.tipo||null,capitulos:x.seleccion?.capitulos||null,documentos:x.seleccion?.documentos||null,falta:x.falta,incompleta:x.incompleta,omitidas:x.omitidas,motivo:x.motivo};}),null,1));}
// ---------------------------------------------------------------- RP-Q02/RP-Q10 exportación real de cada L, ES y EN
// Texto examinado: un «EUR» dentro de un binario base64 no es un importe; el resto (scripts incluidos) sí se examina.
const textOf=(dir,f)=>{const p=path.join(dir,f);if(/\.pdf$/.test(f))return execFileSync('pdftotext',[p,'-']).toString();if(/\.(html|txt|json)$/.test(f))return fs.readFileSync(p,'utf8').replace(/data:[a-z]+\/[a-z0-9.+-]+;base64,[A-Za-z0-9+\/=]+/g,'«binario embebido»');return '';};
const MONEY=/€|\bEUR\b|\d[\d.,]*\s?(?:€|EUR)/;
const salidas={};
const verified=new Map();
if(PARTS.includes('exportar')){
 for(const r of RC.RECETAS)for(const lang of ['es','en']){
  if(process.env.RECETAS_SOLO&&!process.env.RECETAS_SOLO.split(',').includes(r.key))continue; // reejecución acotada de lo afectado
  const name=`${r.key.toLowerCase()}-${lang}`,out=path.join(W,name),t0=Date.now();
  const p=run([path.join(__dirname,'receta-exportar.cjs'),r.key,lang,out,'--reconocer',ACK]);const ms=Date.now()-t0;
  if(r.nivel!=='L'){
   const rj=exists(out+'.receta-rechazo.json')?JSON.parse(fs.readFileSync(out+'.receta-rechazo.json','utf8')):null;
   caso(`Q02-${name}-sin-descarga`,p.status===2&&!exists(out)&&!exists(out+'.zip')&&!exists(out+'.digest.json')&&rj&&rj.exportado===false&&rj.falta.length>0&&rj.estado===(r.nivel==='C'?'no-elegible':'no-disponible'),{code:p.status,estado:rj?.estado,falta:rj?.falta});continue;}
  const ev=exists(out+'.receta.json')?JSON.parse(fs.readFileSync(out+'.receta.json','utf8')):null;
  if(p.status!==0||!ev){caso(`Q02-${name}-exporta`,false,{code:p.status,out:p.stdout.slice(0,400),err:p.stderr.slice(0,300)});continue;}
  const v=verify(out);
  const man=manifest(out);const files=man.files.map(f=>f.path);
  if(v.status===0)verified.set(name,man);
  const suf=lang==='en'?'.en':'';const expDocs=ev.seleccion.documentos.map(d=>`documentos/${d}${suf}.pdf`).sort();const gotDocs=files.filter(f=>/^documentos\/.*\.pdf$/.test(f)).sort();
  const docsOk=JSON.stringify(expDocs)===JSON.stringify(gotDocs);
  const chOk=man.seleccion.tipo===r.sel.tipo&&JSON.stringify(man.seleccion.capitulos.filter(c=>c!=='portada').sort())===JSON.stringify([...ev.seleccion.capitulos].sort());
  const html=fs.readFileSync(path.join(out,'index.html'),'utf8'),htmlLang=/<html[^>]*lang="(\w+)"/.exec(html)?.[1];
  caso(`Q02-${name}-exporta`,v.status===0&&docsOk&&chOk&&htmlLang===lang&&man.seleccion.idioma===lang&&man.seleccion.modo==='cliente',{verif:v.status,docsOk,expDocs,gotDocs,chOk,htmlLang});
  // estado parcial declarado igual en ES y EN; la receta queda ligada al ZIP por su huella
  caso(`Q02-${name}-evidencia`,!!ev.exportacion.digest?.zipSha256&&ev.estado===(ev.incompleta.length?'emitible-parcial':'emitible'),{estado:ev.estado,incompleta:ev.incompleta});
  if(r.economia==='sin-importes'||r.economia==='sin-economia-del-plan'){const hits=files.filter(f=>MONEY.test(textOf(out,f)));caso(`Q06-${name}-sin-importes`,!hits.length,hits);}
  salidas[name]={zipSha256:ev.exportacion.digest.zipSha256,registroSha256:frozen,ms,files:Object.fromEntries(man.files.map(f=>[f.path,f.sha256])),estado:ev.estado,incompleta:ev.incompleta};}
 // RP02 y RP09 tienen recibos de receta distintos y un mismo contenido para el cliente.
 const selected=process.env.RECETAS_SOLO?.split(',');
 if(!selected||['RP02','RP09'].every(k=>selected.includes(k)))for(const lang of ['es','en']){
  const a=verified.get(`rp02-${lang}`),b=verified.get(`rp09-${lang}`);
  const eq=a&&b?compare(a,b):null;
  caso(`Q02-rp02-rp09-${lang}-misma-salida`,eq?.identidad===true&&eq.seleccion&&eq.manifiesto&&eq.inventario,eq);}
 fs.writeFileSync(path.join(EV,'salidas.json'),JSON.stringify(salidas,null,1));}
// ---------------------------------------------------------------- negativos (RP-Q02/RP-Q03/RP-Q08)
if(PARTS.includes('negativos')){
 const neg=(id,args,pred,env)=>{const out=path.join(W,'neg-'+id);const p=run([path.join(__dirname,'receta-exportar.cjs'),...args.map(x=>x==='OUT'?out:x)],env);
  const rj=exists(out+'.receta-rechazo.json')?JSON.parse(fs.readFileSync(out+'.receta-rechazo.json','utf8')):null;
  caso('NEG-'+id,p.status!==0&&!exists(out+'.zip')&&pred(rj,p),{code:p.status,estado:rj?.estado,motivo:rj?.motivo||p.stdout.slice(0,200)});};
 neg('receta-desconocida',['RP99','es','OUT'],rj=>rj?.estado==='desconocida');
 neg('receta-minusculas',['rp07','es','OUT'],rj=>rj?.estado==='desconocida');
 neg('idioma-no-valido',['RP07','fr','OUT'],rj=>rj?.estado==='idioma-no-valido');
 // selección obsoleta: misma receta, huella de snapshot distinta → el exportador la rechaza
 const r7=RC.resolver('RP07',ctx,'es');const stale={...r7.seleccion,modo:'cliente',reconocidos:ACK.split(','),base:{...r7.seleccion.base,snapshotSha256:'0'.repeat(64)}};
 const sf=path.join(W,'stale.json');fs.writeFileSync(sf,JSON.stringify(stale));const ps=run([path.join(__dirname,'exportar.cjs'),sf,path.join(W,'neg-stale')]);
 caso('NEG-seleccion-obsoleta',ps.status===2&&!exists(path.join(W,'neg-stale.zip'))&&/obsoleta/.test(ps.stdout),ps.stdout.slice(0,300));
 // sin reconocer los avisos: no hay ZIP de cliente
 const pn=run([path.join(__dirname,'receta-exportar.cjs'),'RP05','es',path.join(W,'neg-sin-ack')]);
 caso('NEG-sin-reconocer',pn.status===2&&!exists(path.join(W,'neg-sin-ack.zip'))&&/SIN RECONOCER/.test(pn.stdout),pn.stdout.slice(0,300));
 // aportaciones (fixtures rotuladas): C cumple requisitos pero NO emite; incompatibles se rechazan; L no las da por compuestas
 const fx=(n,o)=>{const f=path.join(W,n+'.json');fs.writeFileSync(f,JSON.stringify(o));return f;};
 const ofertas=v=>({ofertasIndependientes:{atribucion:'Fixture de laboratorio: ofertas sintéticas para probar el contrato RP13.',valor:v}});
 const oferta={moneda:'EUR',ivaIncluido:false,alcance:'reforma integral',ambito:'vivienda',unidad:'m2',metodo:'partidas homologadas',fecha:'2026-11-17',proyecto:ctx.S.project.id,revision:ctx.S.project.revision};
 const ok2=[{...oferta,proveedor:'Proveedor A (sintético)'},{...oferta,proveedor:'Proveedor B (sintético)'}];
 neg('rp13-contrato-cumplido-sin-emision',['RP13','es','OUT','--aportaciones',fx('of-ok',ofertas(ok2))],rj=>rj?.estado==='contrato-cumplido-sin-emision'&&rj.fuentes.ofertasIndependientes.estado==='disponible');
 neg('rp13-moneda-incompatible',['RP13','es','OUT','--aportaciones',fx('of-mon',ofertas([ok2[0],{...ok2[1],moneda:'USD'}]))],rj=>rj?.estado==='no-elegible'&&rj.fuentes.ofertasIndependientes.estado==='incompatible');
 neg('rp13-unidad-incompatible',['RP13','es','OUT','--aportaciones',fx('of-unit',ofertas([ok2[0],{...ok2[1],unidad:'ud'}]))],rj=>rj?.fuentes.ofertasIndependientes.estado==='incompatible');
 neg('rp13-revision-ajena',['RP13','es','OUT','--aportaciones',fx('of-rev',ofertas([ok2[0],{...ok2[1],revision:'otra'}]))],rj=>rj?.fuentes.ofertasIndependientes.estado==='incompatible');
 neg('rp13-ambito-distinto',['RP13','es','OUT','--aportaciones',fx('of-ambito',ofertas([ok2[0],{...ok2[1],ambito:'edificio'}]))],rj=>rj?.fuentes.ofertasIndependientes.estado==='incompatible');
 neg('rp13-mismo-proveedor',['RP13','es','OUT','--aportaciones',fx('of-dup',ofertas([ok2[0],{...ok2[0]}]))],rj=>rj?.fuentes.ofertasIndependientes.estado==='incompatible');
 neg('rp13-una-oferta',['RP13','es','OUT','--aportaciones',fx('of-one',ofertas([ok2[0]]))],rj=>rj?.fuentes.ofertasIndependientes.estado==='incompatible');
 neg('rp13-sin-atribucion',['RP13','es','OUT','--aportaciones',fx('of-noattr',{ofertasIndependientes:{valor:ok2}})],rj=>rj?.fuentes.ofertasIndependientes.estado==='incompatible');
 neg('rp15-observacion-sin-autor',['RP15','es','OUT','--aportaciones',fx('obs',{observacionesObra:{atribucion:'Fixture de laboratorio.',valor:[{fecha:'2026-11-17'}]}})],rj=>rj?.fuentes.observacionesObra.estado==='incompatible');
 neg('rp15-simulacion-no-es-observacion',['RP15','es','OUT','--aportaciones',fx('obs-simulada',{observacionesObra:{atribucion:'Fixture de laboratorio.',valor:[{fecha:'2026-11-17',autor:'Fixture',ubicacion:'Estancia',proyecto:ctx.S.project.id,revision:ctx.S.project.revision,autoridad:'simulado'}]}})],rj=>rj?.fuentes.observacionesObra.estado==='incompatible');
 const foreignPlan={...ctx,REG:{...ctx.REG,ft3d8:{...ctx.REG.ft3d8,project:{id:'otro'}}}};
 const r15=RC.resolver('RP15',foreignPlan,'es');
 caso('NEG-rp15-plan-de-otro-proyecto',r15.estado==='no-elegible'&&r15.fuentes.planObra.estado==='incompatible',r15.fuentes.planObra);
 neg('rp20-futura-aunque-haya-datos',['RP20','es','OUT','--aportaciones',fx('liq',{costeLiquidado:{atribucion:'Fixture.',valor:1},manualesGarantias:{atribucion:'Fixture.',valor:1},actasEntrega:{atribucion:'Fixture.',valor:1}})],rj=>rj?.estado==='no-disponible');
 // v1.4 §4: L cuenta solo lo COMPUESTO (registro); una aportación distinta de la compuesta se ignora y se dice
 const r1=RC.resolver('RP01',RC.contexto(LAB,SRC,{honorarios:{atribucion:'Fixture.',valor:[{fase:'Proyecto básico',importe:1000,moneda:'EUR'}]}}),'es');
 caso('NEG-rp01-aportacion-no-completa-L',r1.fuentes.honorarios.estado==='disponible'&&/fixture/.test(r1.fuentes.honorarios.autoridad)&&r1.motivo.some(m=>/honorarios.*no compuesta/.test(m)),r1.motivo);
 // una receta sin importes que arrastrase el presupuesto se bloquea (guarda del resolvedor sobre una copia alterada)
 const R7=RC.RECETAS.find(r=>r.key==='RP07'),orig=JSON.stringify(R7.sel);R7.sel={...R7.sel,documentos:['real-estate-sheet-v3'],capitulos:[...R7.sel.capitulos]};
 const g=RC.resolver('RP07',ctx,'es');R7.sel=JSON.parse(orig);caso('NEG-sin-importes-guarda',g.estado==='bloqueada'&&!g.emitible,g.motivo);}
// ---------------------------------------------------------------- RP-Q02/RP-Q09 selector en «Preparar entrega» (navegador)
(async()=>{
if(PARTS.includes('ui')){
 const {chromium}=require('playwright');const b=await chromium.launch({args:['--no-sandbox']});const PAGE='file://'+path.join(LAB,'out/v3/profesional/preparar-entrega.html');
 const SH=path.join(EV,'capturas');fs.mkdirSync(SH,{recursive:true});
 for(const vp of [{n:'escritorio',w:1440,h:900},{n:'movil',w:390,h:844},{n:'estrecho',w:320,h:720}]){
  const c=await b.newContext({viewport:{width:vp.w,height:vp.h},acceptDownloads:true});const ext=[];await c.route('**/*',r=>{const u=r.request().url();if(/^(file|data|about|blob):/.test(u))return r.continue();ext.push(u);return r.abort();});
  const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));await p.goto(PAGE);await p.waitForTimeout(400);
  const n=async()=>p.locator('[data-rec]').count();
  const all=await n();await p.selectOption('#fPerfil','IM');const im=await n();await p.selectOption('#fFase','P');const imP=await n();await p.selectOption('#fPerfil','');await p.selectOption('#fFase','');const back=await n();
  caso(`UI-${vp.n}-filtros`,all===21&&im===RC.filtrar({perfil:'IM'}).length&&imP===RC.filtrar({perfil:'IM',fase:'P'}).length&&back===21,{all,im,imP,back});
  const ow=await p.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);caso(`UI-${vp.n}-sin-desborde`,ow<=0,ow);
  if(vp.n!=='escritorio'){await p.locator('#recH').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(SH,`preparar-recetas-${vp.n}.png`)});await c.close();continue;}
  // aplicar RP07, descargar la selección y exportarla de verdad
  await p.locator('[data-rec=RP07]').click();const det=await p.locator('#recDetail').innerText();await p.locator('#recApply').click();await p.waitForTimeout(300);
  const dl=async()=>{const [d]=await Promise.all([p.waitForEvent('download'),p.locator('#reg').click()]);return JSON.parse(fs.readFileSync(await d.path(),'utf8'));};
  const s7=await dl(),r7=RC.resolver('RP07',ctx,'es').seleccion;
  const same=(x,y)=>x.tipo===y.tipo&&JSON.stringify([...x.capitulos].sort())===JSON.stringify([...y.capitulos].sort())&&JSON.stringify([...x.documentos].sort())===JSON.stringify([...y.documentos].sort());
  caso('UI-rp07-aplicada',same(s7,r7)&&s7.nota===r7.nota&&s7.reconocidos.length===0&&s7.idioma==='es'&&/Obtendrás/.test(det),{tipo:s7.tipo,nota:s7.nota});
  await p.locator('#recH').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(SH,'preparar-recetas-escritorio.png')});
  const sf=path.join(W,'ui-rp07.json');fs.writeFileSync(sf,JSON.stringify({...s7,reconocidos:ACK.split(',')}));const pe=run([path.join(__dirname,'exportar.cjs'),sf,path.join(W,'ui-rp07')]);
  const out=path.join(W,'ui-rp07'),reference=verified.get('rp07-es');
  const vi=pe.status===0&&verify(out).status===0;
  const eq=vi&&reference?compare(manifest(out),reference):null;
  const unchanged=registroSha()===frozen;
  const equal=eq?.identidad===true&&eq.seleccion&&eq.manifiesto&&eq.inventario&&unchanged;
  caso('UI-rp07-artefacto-real-igual-al-adaptador',equal===true,{code:pe.status,verificado:vi,adaptador:!!reference,registroSha256:frozen,estable:unchanged,comparacion:eq});
  // modificada tras aplicar
  await p.locator('[data-ch=recorrido]').uncheck();const sm=await dl();caso('UI-rp07-modificada',/modificada/.test(sm.nota)&&!sm.capitulos.includes('recorrido'),sm.nota);
  // cambio a una receta C tras previsualizar: no aplica nada y explica
  const before=await dl();
  for(const key of ['RP13','RP16']){
   await p.locator(`[data-rec=${key}]`).click();
   const dis=await p.locator('#recDetail button[disabled]').count(),detail=await p.locator('#recDetail').innerText();
   const blocked=await p.locator('#reg').isDisabled(),hidden=await p.locator('#open').isHidden();
   const status=await p.locator('#candidateStatus').innerText();
   const required=key==='RP13'?/Ofertas independientes/.test(detail):true;
   caso(`UI-${key.toLowerCase()}-sin-descarga`,dis===1&&blocked&&hidden&&required&&/Sin descarga de cliente/.test(detail)&&status.includes('RP07')&&status.includes(key),{dis,blocked,hidden,status});}
  await p.locator('#clearRecipe').click();
  const after=await dl();
  caso('UI-seleccion-activa-recuperada',same(before,after)&&before.nota===after.nota&&after.nota.includes('RP07'),after.nota);
  // otra receta L; luego inglés
  await p.locator('[data-rec=RP05]').click();await p.locator('#recApply').click();const s5=await dl();caso('UI-rp05-cambio-de-receta',same(s5,RC.resolver('RP05',ctx,'es').seleccion)&&/RP05/.test(s5.nota),s5.nota);
  await p.locator('[name=idioma][value=en]').check();await p.waitForTimeout(200);const s5e=await dl();caso('UI-rp05-ingles',s5e.idioma==='en'&&same(s5e,RC.resolver('RP05',ctx,'en').seleccion)&&s5e.nota===RC.resolver('RP05',ctx,'en').seleccion.nota,{idioma:s5e.idioma});
  // teclado: tabular hasta una receta y elegirla con Intro
  await p.goto(PAGE);await p.waitForTimeout(300);let k=0,on=null;while(k++<15){await p.keyboard.press('Tab');on=await p.evaluate(()=>document.activeElement?.dataset?.rec||null);if(on)break;}
  if(on)await p.keyboard.press('Enter');const pressed=on?await p.locator(`[data-rec=${on}]`).getAttribute('aria-pressed'):null;
  const fv=await p.evaluate(()=>{const s=getComputedStyle(document.activeElement);return s.outlineStyle!=='none'&&parseFloat(s.outlineWidth)>0;});
  caso('UI-teclado',on==='RP01'&&pressed==='true'&&fv,{on,pressed,foco:fv});
  caso('UI-red-y-errores',!ext.length&&!errs.length,{ext,errs});await c.close();}
 await b.close();}
const res={schema:'rubik-lab-recetas-qa/1',fecha:new Date().toISOString(),catalogo:RC.VERSION,snapshotSha256:REG.snapshot.sha256,registroSha256:frozen,partes:PARTS,solo:process.env.RECETAS_SOLO||null,total:casos.length,pass:casos.filter(c=>c.ok).length,casos};
fs.writeFileSync(path.join(EV,'recetas-qa.json'),JSON.stringify(res,null,1));
console.log(`${res.pass}/${res.total}`);process.exit(casos.every(c=>c.ok)?0:1);
})();
