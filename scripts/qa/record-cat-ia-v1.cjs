'use strict';
/* CAT-IA V1 · grabador de evidencias en el editor REAL (Playwright + Chromium, recordVideo). Solo se actúa con los
   controles visibles (clics, dedo, teclado, archivos); las lecturas internas son comprobaciones posteriores.
   Corte C1 (CAT-02 «Mi estudio → Mis catálogos»): piloto sintético, búsqueda/filtros, ficha exportable, selección
   congelada, casos negativos uno a uno (assert + captura), separación por estudio, reabrir; 1440×900 y 1280×800 ES,
   390×844 EN y 844×390 ZH. Fixtures SINTÉTICOS propios (assets/cat-ia/fixtures, LICENSE.txt); sin proveedor, sin gasto.
   Salida (nunca se sube al repositorio; CI la publica como artefacto):
     qa-results/cat-ia-v1/video/*.webm|mp4   qa-results/cat-ia-v1/screens/*.png   qa-results/cat-ia-v1/downloads/*
     qa-results/cat-ia-v1/manifest.json      (campos exigidos por el encargo V2 §5)
   Uso: node scripts/qa/record-cat-ia-v1.cjs   (CHROME=<chromium> si no está en /usr/bin/chromium) */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const K=require('../../tests/photo-project/kit.cjs'),C=require('../../js/catalog-product-core.js');
const ROOT=path.resolve(__dirname,'../..'),OUT=path.join(ROOT,'qa-results/cat-ia-v1'),VID=path.join(OUT,'video'),SCR=path.join(OUT,'screens'),DL=path.join(OUT,'downloads');
const PILOT=JSON.parse(fs.readFileSync(path.join(ROOT,'assets/cat-ia/fixtures/pilot-collection.json'),'utf8'));
const sh=(cmd,args)=>{try{return execFileSync(cmd,args,{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}catch{return null;}};
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const clone=v=>JSON.parse(JSON.stringify(v));
const pause=(page,ms=600)=>page.waitForTimeout(ms);
const CLI=['node scripts/qa/record-cat-ia-v1.cjs'];

function recorder(name){
 const steps=[],shots=[];
 return {name,steps,shots,
  check(step,ok,detail){steps.push({step,ok:!!ok,detail:detail===undefined?null:detail,at:new Date().toISOString()});if(!ok)throw Error(`${name}: ${step} — ${JSON.stringify(detail)}`);},
  async shot(page,file,what){const p=path.join(SCR,file);await page.screenshot({path:p});shots.push({file:`screens/${file}`,what,sha256:sha(p)});}};
}
async function openContext(env,{viewport,mobile,video,lang}){
 const context=await env.browser.newContext({viewport,deviceScaleFactor:1,acceptDownloads:true,...(mobile?{isMobile:true,hasTouch:true}:{}),...(video?{recordVideo:{dir:VID,size:viewport}}:{})});
 const page=await context.newPage(),w=K.watch(page,env.base),network=[];
 await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
 page.on('request',r=>{const u=new URL(r.url());network.push(u.origin+u.pathname===env.base.replace(/\/$/,'')+u.pathname?{sameOrigin:true,path:u.pathname,method:r.method()}:{sameOrigin:false,origin:u.origin,method:r.method()});});
 await page.goto(env.base);await require('../../tests/editor-fixture.cjs')(page);
 if(lang&&lang!=='es'){await page.evaluate(l=>localStorage.setItem('rubik-sota-floorplan-lang',l),lang);await K.reopen(page);}
 await page.waitForFunction(()=>!!window.RubikCatalogUI&&!!window.RubikCatalogProduct);
 return {context,page,w,network,video:video?page.video():null};
}
async function openCatalogs(page,touch){const go=l=>touch?l.tap():l.click();await go(page.locator('#workArea-studio'));await page.locator('#catalogStudioCard').waitFor();const b=page.locator('#catalogOpen');await b.scrollIntoViewIfNeeded();await go(b);await page.locator('#catalogDialog[open]').waitFor();}
async function save(page,locator,as){const [d]=await Promise.all([page.waitForEvent('download'),locator.click()]);const p=path.join(DL,as||d.suggestedFilename());await d.saveAs(p);return {file:`downloads/${path.basename(p)}`,sha256:sha(p),text:fs.readFileSync(p,'utf8')};}
const keys=page=>page.locator('#catalogList .catalog-item').evaluateAll(n=>n.map(x=>x.dataset.key).sort());
const collection=products=>({schema:'rubik-catalog-collection/1',catalogId:'piloto-sintetico-qa',name:'Piloto sintético QA',products});
const NEG=(()=>{const p=PILOT.products;
 const noDate=Object.assign(clone(p[4]),{productId:'lampara-sin-fecha',variantId:null,sku:'QA-NODATE-1'});noDate.commercial.verifiedAt=null;
 const noPerm=Object.assign(clone(p[4]),{productId:'lampara-sin-permiso',variantId:null,sku:'QA-NOPERM-1'});noPerm.imageRefs[0].license={scope:['qa'],proofRef:'x'};
 const expired=Object.assign(clone(p[4]),{productId:'lampara-caducada',variantId:null,sku:'QA-EXP-1'});expired.imageRefs[0].license.expiresAt='2026-01-01';
 const huge=Object.assign(clone(p[2]),{productId:'horno-gigante',sku:'QA-H60-XXL'});huge.dimensionsMm.height=5950;
 const unknownDims=Object.assign(clone(p[2]),{productId:'horno-sin-medidas',sku:'QA-H60-NODIM'});unknownDims.dimensionsMm={width:null,height:null,depth:null};unknownDims.dimensionsProvenance=null;
 return [
  ['sku-duplicado',Object.assign(clone(p[2]),{productId:'horno-h60-copia'}),'QA-H60-INOX',/ya existe en el catálogo/],
  ['marca-falsa',Object.assign(clone(p[4]),{productId:'lampara-falsa',variantId:null,sku:'QA-FAKE-1',brand:'IKEA'}),'QA-FAKE-1',/Marca de terceros usada como propia/],
  ['precio-sin-fecha',noDate,'QA-NODATE-1',/fecha en que se comprobó/],
  ['imagen-sin-permiso',noPerm,'QA-NOPERM-1',/sin permiso documentado/],
  ['licencia-caducada',expired,'QA-EXP-1',/licencia ha caducado/],
  ['electrodomestico-incongruente',huge,'QA-H60-XXL',/incongruente/],
  ['variante-contradictoria',Object.assign(clone(p[0]),{variantId:'blanco',sku:'QA-LUMEN-160-BL',family:'dormitorios'}),'QA-LUMEN-160-BL',/Variante contradictoria/],
  // Medidas desconocidas NO es un rechazo: se acepta y se marca «No verificada».
  ['medidas-desconocidas-aceptadas',unknownDims,null,null]];})();

async function desktop(env,{viewport,video,full}){
 const name=`cat02-escritorio-${viewport.width}x${viewport.height}-es`,r=recorder(name);const {context,page,w,network,video:v}=await openContext(env,{viewport,video});const failed=[];
 try{
  const before=await K.snapshot(page);
  await openCatalogs(page,false);r.check('diálogo abierto desde Mi estudio',await page.locator('#catalogDialog[open]').count()===1);
  r.check('aviso de piloto local visible',/ni separa estudios de forma segura/.test(await page.locator('#catalogTruth').innerText()));
  await r.shot(page,`${name}-01-vacio.png`,'Mis catálogos sin catálogo: aviso de piloto local');
  await page.locator('#catalogLoadPilot').click();await page.waitForFunction(()=>document.querySelector('#catalogDialog').dataset.imported==='5');
  r.check('piloto: 5 fichas, revisión 1',/Revisión 1 · 5 fichas/.test(await page.locator('#catalogRevision').innerText()),await page.locator('#catalogRevision').innerText());
  await page.waitForFunction(()=>document.querySelectorAll('#catalogList .catalog-thumb img').length===5);await pause(page);
  await r.shot(page,`${name}-02-piloto.png`,'Piloto sintético: 5 fichas con miniaturas e insignias');
  await page.locator('#catalogSearch').fill('lumen');await pause(page,400);r.check('búsqueda «lumen» → 2 variantes',JSON.stringify(await keys(page))===JSON.stringify(['aparador-lumen@nogal','aparador-lumen@roble']));
  await page.locator('#catalogSearch').fill('');await page.locator('#catalogPrice').selectOption('unknown');r.check('filtro precio desconocido → horno',JSON.stringify(await keys(page))==='["horno-h60@inox"]');
  await r.shot(page,`${name}-03-filtro-precio.png`,'Filtro «Precio desconocido»');
  await page.locator('#catalogPrice').selectOption('');await page.locator('#catalogDims').selectOption('unknown');r.check('filtro medidas desconocidas → encimera',JSON.stringify(await keys(page))==='["encimera-basalto@-"]');await page.locator('#catalogDims').selectOption('');
  await page.locator('#catalogList .catalog-item[data-key="horno-h60@inox"]').click();await page.locator('#catalogPreviewImage').waitFor();await pause(page);
  r.check('ficha horno: precio «Desconocido»',await page.locator('#catalogSheetTable tr[data-k="price"] td').innerText()==='Desconocido');
  r.check('ficha horno: avisos de no afiliación y sintético',/Sin afiliación/.test(await page.locator('#catalogNotices').innerText())&&/Fixture sintético/.test(await page.locator('#catalogNotices').innerText()));
  await page.locator('#catalogPreview').scrollIntoViewIfNeeded();await r.shot(page,`${name}-04-ficha-horno.png`,'Ficha del horno con precio desconocido y avisos');
  if(full){
   const html=await save(page,page.locator('#catalogSheetHtml'));r.check('ficha HTML: sin scripts, CSP, imagen embebida, valor desconocido',!/<script/i.test(html.text)&&/default-src 'none'/.test(html.text)&&/data:image\/png;base64/.test(html.text)&&/Desconocido/.test(html.text),html.file);
   const sheetPage=await context.newPage();await sheetPage.setContent(html.text);await sheetPage.setViewportSize(viewport);await r.shot(sheetPage,`${name}-05-ficha-exportada.png`,'Ficha HTML descargada, abierta tal cual');await sheetPage.close();
   const js=await save(page,page.locator('#catalogSheetJson'));const sj=JSON.parse(js.text);{const{hash,...b}=sj;r.check('ficha JSON: huella SHA-256 verificable',C.hashOf(b)===hash,hash);}
   await page.locator('#catalogAddSel').click();
   await page.locator('#catalogList .catalog-item[data-key="aparador-lumen@roble"]').click();await page.locator('#catalogPreview[data-key="aparador-lumen@roble"]').waitFor();
   await page.locator('#catalogAddSel').click();await page.locator('#catalogAddSel').click();
   const fr=await save(page,page.locator('#catalogFreeze'));const frozen=JSON.parse(fr.text);{const{hash,...b}=frozen;r.check('selección congelada: revisión 1, precio 690, huella verificable',frozen.catalogRevision===1&&frozen.items[1].product.commercial.netUnitPrice===690&&C.hashOf(b)===hash);}
   await page.locator('#catalogSelectionBox').scrollIntoViewIfNeeded();await r.shot(page,`${name}-06-seleccion-congelada.png`,'Selección congelada (revisión 1)');
   // Casos negativos uno a uno: assert + captura.
   for(const [id,product,sku,why] of NEG){
    await page.locator('#catalogImportFile').setInputFiles({name:`${id}.json`,mimeType:'application/json',buffer:Buffer.from(JSON.stringify(collection([product])))});
    if(why){await page.waitForFunction(s=>!!document.querySelector(`#catalogRejected li[data-sku="${s}"]`),sku);const txt=await page.locator(`#catalogRejected li[data-sku="${sku}"]`).innerText();
     try{r.check(`negativo ${id}: rechazado y explicado`,why.test(txt),txt);}catch(e){failed.push({case:id,error:e.message});}}
    else{await page.waitForFunction(()=>/1 nuevas/.test(document.querySelector('#catalogImportSummary')?.textContent||''));await page.locator('#catalogList .catalog-item[data-key="horno-sin-medidas@inox"]').click();await page.locator('#catalogPreview[data-key="horno-sin-medidas@inox"]').waitFor();
     r.check('medidas desconocidas: aceptada y marcada «No verificada»',await page.locator('#catalogSheetTable tr[data-k="width"] td').innerText()==='No verificada');}
    await page.locator('#catalogImportReport').scrollIntoViewIfNeeded();await r.shot(page,`${name}-neg-${id}.png`,`Caso negativo: ${id}`);
   }
   const edit=clone(PILOT.products[0]);edit.commercial.netUnitPrice=710;
   await page.locator('#catalogImportFile').setInputFiles({name:'nueva-version.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(collection([edit])))});
   await page.waitForFunction(()=>/1 nuevas versiones/.test(document.querySelector('#catalogImportSummary')?.textContent||''));
   r.check('nueva versión: revisión 3 (piloto + horno sin medidas + precio)',/Revisión 3 · 6 fichas/.test(await page.locator('#catalogRevision').innerText()),await page.locator('#catalogRevision').innerText());
   r.check('la selección congelada conserva 690',frozen.items[1].product.commercial.netUnitPrice===690);
   // Otro estudio no ve este catálogo.
   await page.locator('#catalogClose').click();await page.evaluate(()=>FloorPlanBrand.saveProfile(FloorPlanBrandUI.store,{name:'Estudio Sur QA'}));await openCatalogs(page,false);
   const sur=await page.locator('#catalogStudio option').evaluateAll(o=>o.map(x=>x.value).find(v=>v!=='local'));await page.locator('#catalogStudio').selectOption(sur);
   try{r.check('negativo fuga entre estudios: otro estudio sin catálogos',/Sin catálogo/.test(await page.locator('#catalogRevision').innerText())&&(await keys(page)).length===0);}catch(e){failed.push({case:'fuga-entre-estudios',error:e.message});}
   await r.shot(page,`${name}-neg-fuga-entre-estudios.png`,'Otro estudio (perfil «Estudio Sur QA»): sin catálogos');
   await page.locator('#catalogStudio').selectOption('local');await page.locator('#catalogClose').click();
   await K.reopen(page);await openCatalogs(page,false);r.check('reabrir: catálogo persistido (revisión 3)',/Revisión 3 · 6 fichas/.test(await page.locator('#catalogRevision').innerText()));
   await r.shot(page,`${name}-07-reabierto.png`,'Tras recargar: el catálogo sigue en revisión 3');
  }
  const after=await K.snapshot(page);r.check('proyecto e historial intactos',after.project===before.project&&after.undo===before.undo&&after.redo===before.redo);
  r.check('sin desplazamiento lateral',!(await K.hScroll(page)));
  r.check('sin peticiones externas ni errores',!w.external.length&&!w.errors.length,{external:w.external,errors:w.errors});
 }finally{await context.close();}
 const file=v?`video/${name}.webm`:null;if(v)await v.saveAs(path.join(OUT,file));
 return {name,viewport,lang:'es',file,steps:r.steps,shots:r.shots,failedCases:failed,network:summarize(network)};
}
async function mobile(env,{viewport,lang,video}){
 const name=`cat02-movil-${viewport.width}x${viewport.height}-${lang}`,r=recorder(name);const {context,page,w,network,video:v}=await openContext(env,{viewport,mobile:true,video,lang});
 const T={en:{title:'My catalogues',unk:'Unknown',rej:/already exists/},zh:{title:'我的目录',unk:'未知',rej:/已用于/}}[lang];
 try{
  await openCatalogs(page,true);r.check(`título en ${lang}`,await page.locator('#catalogTitle').innerText()===T.title);
  await r.shot(page,`${name}-01-abierto.png`,'Mis catálogos (táctil)');
  await page.locator('#catalogLoadPilot').tap();await page.waitForFunction(()=>document.querySelector('#catalogDialog').dataset.imported==='5');await page.waitForFunction(()=>document.querySelectorAll('#catalogList .catalog-thumb img').length===5);
  const oven=page.locator('#catalogList .catalog-item[data-key="horno-h60@inox"]');await oven.scrollIntoViewIfNeeded();await r.shot(page,`${name}-02-lista.png`,'Lista del piloto');
  await oven.tap();await page.locator('#catalogPreviewImage').waitFor();await pause(page);
  r.check('precio desconocido traducido',await page.locator('#catalogSheetTable tr[data-k="price"] td').innerText()===T.unk);
  await r.shot(page,`${name}-03-ficha.png`,'Ficha del horno');
  const o=await page.evaluate(()=>{const d=document.querySelector('#catalogDialog');return {dialog:d.scrollWidth>d.clientWidth+1,page:document.documentElement.scrollWidth>innerWidth+1};});
  r.check('sin desbordes',!o.dialog&&!o.page,o);
  const small=await page.locator('#catalogDialog button:visible').evaluateAll(b=>b.filter(x=>{const q=x.getBoundingClientRect();return q.height<44&&q.width>0;}).map(x=>x.id||x.textContent));r.check('objetivos táctiles ≥ 44 px',!small.length,small);
  await page.locator('#catalogImportFile').setInputFiles({name:'d.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(collection([Object.assign(clone(PILOT.products[2]),{productId:'horno-copia'})])))});
  await page.waitForFunction(()=>document.querySelector('#catalogDialog').dataset.rejected==='1');r.check('SKU duplicado explicado',T.rej.test(await page.locator('#catalogRejected').innerText()));
  await page.locator('#catalogImportReport').scrollIntoViewIfNeeded();await r.shot(page,`${name}-04-rechazo.png`,'Rechazo de SKU duplicado');
  r.check('sin peticiones externas ni errores',!w.external.length&&!w.errors.length,{external:w.external,errors:w.errors});
 }finally{await context.close();}
 const file=v?`video/${name}.webm`:null;if(v)await v.saveAs(path.join(OUT,file));
 return {name,viewport,lang,file,steps:r.steps,shots:r.shots,failedCases:[],network:summarize(network)};
}
function summarize(network){const same=new Map(),ext=[];for(const n of network){if(n.sameOrigin){const k=n.method+' '+n.path;same.set(k,(same.get(k)||0)+1);}else ext.push(n);}
 return {sameOriginPaths:[...same.keys()].sort(),api:[...same.keys()].filter(k=>/\/api\//.test(k)),external:ext};}
function probe(file){
 const json=sh('ffprobe',['-v','error','-show_entries','format=duration,size:stream=codec_name,width,height','-of','json',file]);
 if(!json)return {ffprobe:false,bytes:fs.statSync(file).size};
 const d=JSON.parse(json),s=d.streams?.[0]||{};return {ffprobe:true,codec:s.codec_name,width:s.width,height:s.height,durationS:+(+d.format?.duration||0).toFixed(2),bytes:+d.format?.size||fs.statSync(file).size};
}

(async()=>{
 fs.rmSync(OUT,{recursive:true,force:true});for(const d of [VID,SCR,DL])fs.mkdirSync(d,{recursive:true});
 const env=await K.start(),runs=[],errors=[],started=new Date().toISOString();let chromium=null;
 try{chromium=env.browser.version();
  for(const [label,fn] of [
   ['escritorio-1440',()=>desktop(env,{viewport:{width:1440,height:900},video:true,full:true})],
   ['escritorio-1280',()=>desktop(env,{viewport:{width:1280,height:800},video:false,full:false})],
   ['movil-390-en',()=>mobile(env,{viewport:{width:390,height:844},lang:'en',video:true})],
   ['apaisado-844-zh',()=>mobile(env,{viewport:{width:844,height:390},lang:'zh',video:false})]]){
   try{runs.push(await fn());}catch(e){errors.push({run:label,error:String(e.message||e)});}
  }
 }finally{await env.stop();}
 for(const r of runs.filter(r=>r.file)){
  const webm=path.join(OUT,r.file);r.webm={...probe(webm),sha256:sha(webm)};
  if(!r.webm.ffprobe){errors.push({run:r.name,error:'ffprobe no disponible: el vídeo no se puede verificar'});continue;}
  if(!(r.webm.durationS>0&&r.webm.width===r.viewport.width&&r.webm.height===r.viewport.height))errors.push({run:r.name,error:`vídeo no válido: ${JSON.stringify(r.webm)}`});
  r.decodeOk=sh('ffmpeg',['-v','error','-i',webm,'-f','null','-'])!==null;if(!r.decodeOk)errors.push({run:r.name,error:'ffmpeg no decodifica el vídeo completo'});
  const mp4=webm.replace(/\.webm$/,'.mp4');
  if(sh('ffmpeg',['-y','-v','error','-i',webm,'-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',mp4])!==null&&fs.existsSync(mp4))r.mp4={file:`video/${path.basename(mp4)}`,...probe(mp4),sha256:sha(mp4)};
 }
 const failedCases=runs.flatMap(r=>r.failedCases.map(f=>({run:r.name,...f})));
 const version=(cmd)=>(sh(cmd,['-version'])||'').split('\n')[0]||null;
 const head=sh('git',['rev-parse','HEAD']),base=process.env.BASE_SHA||sh('git',['merge-base','HEAD','origin/master'])||null;
 const manifest={
  purpose:'CAT-IA V1 · corte C1 (CAT-02 Mis catálogos) en el editor real',mode:'MOCK/LOCAL: sin proveedor de imágenes',
  headSha:head,baseSha:base,sourceShas:{},previewDeployment:process.env.PREVIEW_DEPLOYMENT||null,
  viewports:runs.map(r=>({run:r.name,viewport:r.viewport,lang:r.lang})),
  browser:{name:'chromium',version:chromium},PlaywrightVersion:(()=>{try{return require('playwright/package.json').version;}catch{return null;}})(),
  versions:{node:process.version,ffprobe:version('ffprobe'),ffmpeg:version('ffmpeg')},
  CLIcommands:CLI,timestampsUtc:{started,finished:new Date().toISOString()},
  fixturesWithLicense:PILOT.products.map(p=>({sku:p.sku,source:p.source,license:p.license,images:p.imageRefs.map(i=>({path:i.path,sha256:i.sha256,license:i.license}))})),
  steps:runs.map(r=>({run:r.name,asserts:r.steps})),
  images:runs.flatMap(r=>r.shots),videos:runs.filter(r=>r.file).map(r=>({run:r.name,webm:{file:r.file,...r.webm},decodeOk:r.decodeOk,mp4:r.mp4||null})),
  downloads:fs.readdirSync(DL).map(f=>({file:`downloads/${f}`,sha256:sha(path.join(DL,f))})),
  failedCases,networkCalls:runs.map(r=>({run:r.name,...r.network})),
  providerRequestIds:[],outputsBilled:0,budgetCap:'STOP_GASTO: sin tope monetario aprobado por el propietario',estimate:null,invoiceObserved:null,
  acceptanceDecision:'no aplica (CAT-02 no genera imágenes)',
  privacyVerdict:'OK: fixtures sintéticos propios; sin fotos de clientes ni personas; sin peticiones externas ni a /api/; el proyecto no cambia',
  ok:!errors.length&&!failedCases.length,errors,runs:runs.map(r=>({name:r.name,viewport:r.viewport,lang:r.lang,video:r.file,steps:r.steps.length}))};
 fs.writeFileSync(path.join(OUT,'manifest.json'),JSON.stringify(manifest,null,2));
 console.log(JSON.stringify({ok:manifest.ok,errors,failedCases,runs:manifest.runs,videos:manifest.videos},null,2));
 if(!manifest.ok)process.exit(1);
})().catch(e=>{console.error(e);process.exit(1);});
