// Activos reales del proyecto de ejemplo para la entrega integral, producidos por el PROPIO producto (código de esta rama),
// en Chromium local. /api/* se bloquea: nada se publica ni tiene coste. Uso: node delivery-assets.cjs <repoRoot> <labDir> [ft3d8|living|walk|all]
// 1 ft3d8  · Evolución de obra con ?demo=obra (el mismo prj_reference-home: tools/correspondence.cjs), perfil de estudio sintético
//            del snapshot (dominio .invalid). Exporta el vídeo, la presentación de solo lectura y el manifiesto de la entrega.
const path=require('node:path'),fs=require('node:fs/promises'),{createServer}=require('node:http'),crypto=require('node:crypto');const {chromium}=require('playwright');
const [root,lab,what='all']=process.argv.slice(2);const three=require(path.join(root,'tests/helpers/three-module.cjs'));
const S=require(path.join(lab,'snapshot/snapshot.json'));const prof=S.brand.profile;
const TYPES={js:'text/javascript',mjs:'text/javascript',css:'text/css',json:'application/json',svg:'image/svg+xml',png:'image/png',jpg:'image/jpeg',webp:'image/webp',glb:'model/gltf-binary',html:'text/html',hdr:'application/octet-stream',wasm:'application/wasm'};
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{const server=createServer(async(req,res)=>{try{let p=new URL(req.url,'http://l').pathname;if(p.endsWith('/'))p+='index.html';const f=path.resolve(root,'.'+decodeURIComponent(p));
  if(!f.startsWith(root))throw 0;res.setHeader('Content-Type',TYPES[f.split('.').pop()]||'application/octet-stream');res.end(await fs.readFile(f));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}/`;
 const browser=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required']});
 const blocked=[],log={generated:new Date().toISOString(),url:'local',items:[]};
 const prep=async ctx=>{await ctx.route('**/*',async r=>{const t=r.request().url();
  if(t.startsWith('https://cdn.jsdelivr.net/npm/three@0.160.0/'))return r.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await three(t,()=>{throw Error('three');})});
  if(t.startsWith(url+'api/')){blocked.push(t);return r.abort();}if(t.startsWith(url)||t.startsWith('blob:')||t.startsWith('data:'))return r.continue();blocked.push(t);return r.abort();});};
 const save=async(dir,name,buf,meta)=>{await fs.mkdir(dir,{recursive:true});const f=path.join(dir,name);await fs.writeFile(f,buf);log.items.push({file:path.relative(lab,f),bytes:buf.length,sha256:sha(buf),...meta});console.log('saved',path.relative(lab,f),buf.length);};
 const dl=async(p,sel)=>{const [d]=await Promise.all([p.waitForEvent('download'),p.locator(sel).click()]);return {name:d.suggestedFilename(),buf:await fs.readFile(await d.path())};};
 if(what==='all'||what==='ft3d8'){const out=path.join(lab,'assets/ft3d8');
  // Camino real del producto: ejemplo → biblioteca del navegador → Presupuestar → Plan de obra → «Importar plan (JSON)» con el
  // plan que construye la demo FT3D-8 para ESTE proyecto (Schedule.serialize) → Guardar plan → Ver evolución (biblioteca)
  // → Entrega → vídeo, presentación de solo lectura y manifiesto. Perfil de estudio sintético del snapshot vía FloorPlanBrand.
  const ctx=await browser.newContext({viewport:{width:1440,height:900},acceptDownloads:true,locale:'es-ES'});await prep(ctx);const p=await ctx.newPage();p.setDefaultTimeout(600000);
  const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(url);await p.waitForFunction(()=>window.FloorPlanConstructionUI&&window.FloorPlanBudgetUI);await p.locator('#welcomeExample').click();await p.waitForFunction(()=>window.FloorPlanBrand&&window.FloorPlanApp?.entryId);
  await p.evaluate(pr=>{const x=FloorPlanBrand.saveProfile(localStorage,{name:pr.name,person:pr.person,email:pr.email,web:pr.web,tagline:pr.tagline});
   FloorPlanBrand.setDelivery(localStorage,FloorPlanApp.entryId,{profileId:x.id,title:'La obra de tu vivienda, paso a paso',intro:'Cómo se construiría la vivienda de ejemplo, fase a fase. Fechas de ejemplo.'});},prof);
  await p.locator('#workArea-budget').click();await p.locator('[data-route="construction-plan"]').click();await p.waitForSelector('#planDialog[open]');
  await p.locator('#planDialog input[type=file]').first().setInputFiles(path.join(lab,'assets/ft3d8-plan-demo.reforma.schedule.json'));
  const importMsg=(await p.locator('#planDialog').innerText()).match(/Plan importado[^\n]*/)?.[0]||null;
  await p.locator('#planSave').click();await p.waitForFunction(()=>/Plan guardado/.test(document.getElementById('planStatus')?.textContent||''));
  const ident=await p.evaluate(async()=>{const s=await FloorPlanConstructionContext.snapshot();return {entryId:s.entry.id,subject:s.subject,revision:s.revision,scheduleId:s.record?.selectedScheduleId||null,projectRevisionRubik:window.RubikAssistantDomainTools?.revision?RubikAssistantDomainTools.revision(FloorPlanApp.project):null};});
  console.log('ident',JSON.stringify(ident),importMsg);
  await p.locator('#planClose').click();
  await p.evaluate(()=>FloorPlanConstructionUI.openEvolution({}));
  await p.waitForFunction(()=>{const f=document.getElementById('evolutionFrame');return f?.contentDocument?.body?.classList.contains('ready')&&f.contentWindow.__ft3dDelivery&&f.contentWindow.__ft3dFidelity?.ctx;},null,{timeout:300000});
  const f=p.frames().find(x=>x.url().includes('/evolucion/'));
  await f.evaluate(()=>{window.__ft3dUI.reveal('#deliverPanel');document.querySelectorAll('#deliverPanel details:not(#publishBox)').forEach(d=>d.open=true);});
  const fsrc=await f.evaluate(()=>({mode:window.__ft3dSource?.mode,entry:window.__ft3dSource?.entry,subject:window.__ft3dSource?.subject,brand:window.__ft3dDelivery.state.source,planning:window.__ft3dFidelity.ctx.model?.planning?.status}));console.log('frame',JSON.stringify(fsrc));
  const dossier=await f.evaluate(()=>{const d=window.__ft3dFidelity.ctx.dossier;return d?{usable:d.usable,level:d.delivery?.level,blockers:d.delivery?.blockers,issues:d.issues.map(i=>({code:i.code,severity:i.severity,message:i.message}))}:null;});
  console.log('dossier',JSON.stringify(dossier));
  if(dossier&&!dossier.usable.delivery){log.ft3d8={blocked:true,dossier,ident,importMsg};throw Error('Entrega bloqueada por el expediente: '+JSON.stringify(dossier.issues.filter(i=>i.severity==='error')));}
  if(await f.locator('#costMode').isVisible())await f.locator('#costMode').selectOption('none');
  await f.locator('#videoGo').click();
  await f.waitForFunction(()=>window.__ft3dDelivery.state.video||/cancelad|no válido|no generó|no puede/.test(document.getElementById('videoStatus').textContent),null,{timeout:1200000});
  const v=await f.evaluate(()=>{const v=window.__ft3dDelivery.state.video;return v?{type:v.type,bytes:v.bytes,width:v.width,height:v.height,durationMs:v.durationMs,sha256:v.sha256,filename:v.filename}:{error:document.getElementById('videoStatus').textContent};});console.log('video',v);
  if(v.error)throw Error(v.error);
  const dlf=async sel=>{const [d]=await Promise.all([p.waitForEvent('download'),f.locator(sel).click()]);return {name:d.suggestedFilename(),buf:await fs.readFile(await d.path())};};
  const vid=await dlf('#videoDownload');await save(out,vid.name,vid.buf,{kind:'video',producer:'RUBIK · Evolución de obra (FT3D-8) · Entrega · Generar vídeo',declaredSha256:v.sha256,matchesDeclared:sha(vid.buf)===v.sha256,width:v.width,height:v.height,durationMs:v.durationMs});
  await f.locator('#docPrepare').click();await f.waitForFunction(()=>window.__ft3dDelivery.state.doc);
  const doc=await dlf('#docDownload');await save(out,doc.name,doc.buf,{kind:'client-presentation',producer:'RUBIK · Evolución de obra (FT3D-8) · Entrega · presentación de solo lectura'});
  const man=await dlf('#manifestDownload');await save(out,man.name,man.buf,{kind:'manifest',producer:'RUBIK · Evolución de obra (FT3D-8) · Entrega · manifiesto'});
  log.ft3d8={path:'biblioteca → Plan de obra (importar plan de la demo) → Evolución (?source=library) → Entrega',importMsg,ident,frame:fsrc,errors,manifest:JSON.parse(man.buf.toString())};await ctx.close();}
 // 2 living / 3 walk · «Presentar mi vivienda» del editor con el ejemplo (prj_reference-home), 4 estancias. living = Dibujo vivo
 //   activado; walk = presentación fotográfica. En cada parada: fotograma LIMPIO (solo el lienzo 3D, el resto de la interfaz oculto
 //   con visibility) y al final el vídeo del propio producto («Grabar vídeo», FloorPlanTourRecorder: solo la vista 3D).
 for(const mode of ['living','walk']){if(!(what==='all'||what===mode))continue;const out=path.join(lab,'assets',mode==='living'?'dibujo-vivo':'recorrido');
  const ctx=await browser.newContext({viewport:{width:1440,height:900},acceptDownloads:true,locale:'es-ES'});await prep(ctx);const p=await ctx.newPage();p.setDefaultTimeout(600000);
  const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(url);await p.locator('#welcomeExample').click();await p.waitForTimeout(800);
  const ident=await p.evaluate(()=>({projectId:FloorPlanApp.project.id,revision:window.RubikAssistantDomainTools?.revision?RubikAssistantDomainTools.revision(FloorPlanApp.project):null}));console.log(mode,'ident',ident);
  await p.locator('#presentationBtn:visible,#guidePresent:visible').first().click();await p.locator('#presentationConfig[open]').waitFor();
  const rows=p.locator('.presentation-room-row');const n=await rows.count();const ROOMS=/^(Salón|Comedor|Cocina|Dormitorio principal)\b/;
  for(let i=0;i<n;i++){const row=rows.nth(i),text=(await row.textContent()).trim(),box=row.locator('input[type=checkbox]');if(await box.count()===0)continue;const want=ROOMS.test(text.replace(/^\d+\s*/,''));if((await box.isChecked())!==want)await box.setChecked(want);}
  if(mode==='living')await p.locator('#presentationLivingDrawing').check();
  const st=p.getByRole('button',{name:'Iniciar presentación'});await st.scrollIntoViewIfNeeded();await st.click();
  await p.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false'&&!View3D.lifecycleMetrics.flying,null,{timeout:300000});await p.waitForTimeout(1500);
  const stops=await p.evaluate(()=>FloorPlanPresentation.plan.stops.map(s=>({kind:s.kind,roomId:s.roomId||null,name:s.name||s.title||null})));
  const frames=[];
  for(let i=0;i<stops.length;i++){
   if(i>0){await p.locator('.presentation-stops button').nth(i).click();await p.waitForFunction(i=>document.querySelector('.presentation-status').textContent.includes('Vista '+(i+1))&&document.querySelector('#presentationOverlay').dataset.moving==='false',i,{timeout:300000});await p.waitForTimeout(1500);}
   await p.addStyleTag({content:'body *{visibility:hidden!important}#view3d canvas{visibility:visible!important}'}).then(h=>h.evaluate(e=>e.id='__clean'));
   const canvas=p.locator('#view3d canvas').first();const buf=await canvas.screenshot();
   await p.evaluate(()=>document.getElementById('__clean').remove());
   const label=(stops[i].roomId||'overview').replace(/^rom_/,''),name=`${String(i).padStart(2,'0')}-${label}.png`;
   await save(out,name,buf,{kind:'frame',producer:mode==='living'?'Presentar mi vivienda + Dibujo vivo (lienzo 3D, interfaz oculta)':'Presentar mi vivienda (lienzo 3D, interfaz oculta)',stop:i,roomId:stops[i].roomId,stopName:stops[i].name,
    drawing:mode==='living'?await p.evaluate(()=>View3D.presentationLivingDrawingInfo):undefined});frames.push(name);}
  let video=null;
  if(await p.locator('#presentationVideo').isVisible()){await p.locator('#presentationVideo').click();await p.locator('#tourVideoGo').click();
   await p.waitForFunction(()=>{const d=document.getElementById('tourVideoDownload');return (d&&!d.hidden&&!d.disabled)||/no se pudo|error|no puede/i.test(document.getElementById('tourVideoDialog')?.textContent||'');},null,{timeout:900000});
   if(await p.locator('#tourVideoDownload').isVisible()){const v=await dl(p,'#tourVideoDownload');await save(out,v.name,v.buf,{kind:'video',producer:'Presentar mi vivienda · Grabar vídeo (FloorPlanTourRecorder)'+(mode==='living'?' con Dibujo vivo':'')});video=v.name;}
   else video={error:(await p.locator('#tourVideoDialog').textContent()).trim().slice(0,300)};}
  else video={error:'el botón Grabar vídeo no está disponible (sin codificador)'};
  console.log(mode,'video',video);log[mode]={ident,stops,frames,video,errors};await ctx.close();}

 // 4 drawing · secuencia de la apertura con Dibujo vivo (solo en la parada de vista general, por diseño del producto): fotogramas
 //   limpios del lienzo cada ~1,2 s desde «Iniciar presentación». El producto aún no exporta Dibujo vivo como vídeo (su grabador
 //   graba el render normal): esta secuencia es una captura de laboratorio, rotulada así, y el vídeo se monta con ffmpeg.
 if(what==='all'||what==='drawing'){const out=path.join(lab,'assets/dibujo-vivo/secuencia');
  const ctx=await browser.newContext({viewport:{width:1440,height:900},locale:'es-ES'});await prep(ctx);const p=await ctx.newPage();p.setDefaultTimeout(600000);
  await p.goto(url);await p.locator('#welcomeExample').click();await p.waitForTimeout(800);
  await p.locator('#presentationBtn:visible,#guidePresent:visible').first().click();await p.locator('#presentationConfig[open]').waitFor();
  await p.locator('#presentationLivingDrawing').check();
  const st=p.getByRole('button',{name:'Iniciar presentación'});await st.scrollIntoViewIfNeeded();await st.click();
  await p.addStyleTag({content:'body *{visibility:hidden!important}#view3d canvas{visibility:visible!important}'});
  const t0=Date.now(),seq=[];let seenActive=false;
  for(let i=0;i<60;i++){const info=await p.evaluate(()=>View3D.presentationLivingDrawingInfo||{});if(info.active)seenActive=true;
   const buf=await p.locator('#view3d canvas').first().screenshot();const name=`f${String(i).padStart(3,'0')}.png`;await save(out,name,buf,{kind:'sequence-frame',t:Date.now()-t0,active:!!info.active,frames:info.frames??null});seq.push({name,t:Date.now()-t0,active:!!info.active});
   if(seenActive&&!info.active&&i>4)break;if(!seenActive&&i>25)break;await p.waitForTimeout(1200);}
  log.drawing={seenActive,frames:seq};await ctx.close();}
 log.blocked=[...new Set(blocked.map(u=>u.replace(url,'/')))];
 await fs.writeFile(path.join(lab,`assets/log-${what}.json`),JSON.stringify(log,null,1));console.log('blocked',log.blocked);
 await browser.close();server.close();})().catch(e=>{console.error(e);process.exit(1);});
