// E0 · Canonical snapshot for the Studio Presentation lab, exported from the REAL running product (local only).
// Every figure, name, plan and image comes from RUBIK's own engines on its example project:
//   geometry/areas → FloorPlanSurfaceMetrics.home · names → nm() (product localisation) · plan → FloorPlanSheet.preview()
//   and FloorPlanProjectPreview.plan() · 3D views → FloorPlanProjectViews.prepare() · palette → FloorPlanMoodboard.derive()
//   budget → FloorPlanBudget (quantities from the project) + FloorPlanBudgetPresentation.buildReport + FloorPlanEconomicDossier.view
//   identity → FloorPlanBrand snapshot · revision → RubikAssistantDomainTools.revision (content fingerprint).
// SYNTHETIC, labelled: the studio identity, the professional's texts and the TEST unit prices (applied to a COPY of
// the budget with FloorPlanBudget.setManualPrice, never saved). Usage: node snapshot.cjs <repoRoot> <outDir>
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),serve=require('./serve.cjs');
const [root,out]=process.argv.slice(2);fs.mkdirSync(path.join(out,'assets'),{recursive:true});
// Lab-only test prices per unit (€, before VAT), keyed by the budget unit. Labelled in every deliverable.
// Lab-only TEST prices (€ per unit, before VAT) by item description; labelled in every deliverable as test prices.
const TEST_PRICES=[[/parqu[eé]/i,46],[/m[aá]rmol/i,92],[/baldosa/i,34],[/rodapi[eé]/i,11],[/pintura/i,8.5],[/corredera/i,540],[/puerta/i,310],[/ventana/i,480]];
(async()=>{
 const srv=await serve(root),browser=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox','--enable-unsafe-swiftshader']});
 const ctx=await browser.newContext({viewport:{width:1600,height:1000},locale:'es-ES',timezoneId:'Europe/Madrid'});const external=[];
 ctx.on('request',r=>{const u=r.url();if(!u.startsWith(srv.url)&&!/^(data|blob|about):/.test(u))external.push(u);});
 const page=await ctx.newPage();page.setDefaultTimeout(120000);
 await page.goto(srv.url);await page.locator('#welcomeExample').click();await page.waitForFunction(()=>window.FloorPlanBrand&&window.FloorPlanApp?.entryId);
 await page.evaluate(()=>{const p=FloorPlanBrand.saveProfile(localStorage,{name:'Estudio Ejemplo',person:'Profesional de prueba',email:'estudio@example.invalid',web:'https://example.invalid',tagline:'Arquitectura e interiorismo'});
  FloorPlanBrand.setDelivery(localStorage,FloorPlanApp.entryId,{profileId:p.id,title:'Vivienda de ejemplo',intro:'Reorganización de una vivienda de tres dormitorios: zona de día abierta, dos baños y almacenamiento a medida.'});});
 await page.reload();await page.waitForFunction(()=>window.FloorPlanBudgetUI&&window.FloorPlanProjectViews&&window.FloorPlanMoodboard);
 await page.evaluate(()=>FloorPlanBudgetUI.open());await page.waitForTimeout(1200);await page.evaluate(()=>document.querySelector('dialog[open]')?.close());
 await page.evaluate(()=>FloorPlanProjectViews.prepare());await page.waitForFunction(()=>FloorPlanProjectViews.current().length>0,null,{timeout:240000});
 const snap=await page.evaluate(async TP=>{
  const app=FloorPlanApp,p=app.project,N=v=>typeof nm==='function'?nm(v):v;
  const m=FloorPlanSurfaceMetrics.home(p),brand=FloorPlanBrandUI.snapshot(),summary=FloorPlanProjectVisual.summary({project:p,geometry:app.geometry,metrics:m,levelContext:app.levelContext,brand});
  const roomName=new Map(p.rooms.map(r=>[r.id,N(r.name)]));
  const sheet=new XMLSerializer().serializeToString(FloorPlanSheet.preview());
  const holder=document.createElement('div');FloorPlanProjectPreview.plan(holder,{label:'Planta',cls:'project-plan'});const planSvg=holder.querySelector('svg')?.outerHTML||null;
  const views=FloorPlanProjectViews.current().map(v=>({kind:v.kind,label:v.label,roomId:v.roomId||null,dataUrl:v.dataUrl,provenance:'Vista del modelo 3D real del proyecto (RUBIK), no fotografía'}));
  const board=FloorPlanMoodboard.derive(p,{name:N});
  // Room of each object: the PRODUCT's own rule (FloorPlanReviewAnchors.roomAt: the room containing its position).
  const objects=p.objects.map(o=>{const r=o.position&&window.FloorPlanReviewAnchors?FloorPlanReviewAnchors.roomAt(p,o.position):null;return {id:o.id,name:N(o.name||o.type||''),type:o.type||null,roomId:r?.id||null,room:r?N(r.name):null,roomRule:'FloorPlanReviewAnchors.roomAt (posición en el plano)',size:o.size||o.dimensions||null,materialId:o.materialId||null,catalogRef:o.catalogRef||o.product||null};});
  // Budget: the product's saved budget for this project, priced on a COPY with clearly labelled test prices.
  const cur=FloorPlanBudgetUI.current(),B=FloorPlanBudget,P=FloorPlanBudgetPresentation,E=FloorPlanEconomicDossier;
  const original=cur?.budget?JSON.parse(B.serializeBudget(cur.budget)):null;let priced=null,report=null,views2=null,priceLog=[];
  if(original){priced=JSON.parse(JSON.stringify(original));priced.taxRatePercent=priced.taxRatePercent??21;
   priced.items=priced.items.map(it=>{const hit=TP.find(([re])=>new RegExp(re.source,'i').test(it.description||''));const price=hit?hit[1]:null;if(price===null){priceLog.push({id:it.id,description:it.description,price:null});return it;}
    priceLog.push({id:it.id,description:it.description,price});return B.setManualPrice(it,{unitPrice:price,label:'Precio de prueba (laboratorio RUBIK)',asOf:'2026-11-17'});});
   report=P.buildReport(priced);views2={professional:E.view(report,{variant:'professional'}),client:E.view(report,{variant:'client'})};}
  const unpricedReport=original?E.view(P.buildReport(original),{variant:'professional'}):null;
  const revision=window.RubikAssistantDomainTools?.revision?RubikAssistantDomainTools.revision(p):null;
  return {schema:'rubik-studio-lab.snapshot',version:1,takenAt:new Date().toISOString(),
   project:{id:p.id,name:N(p.name),revision,rooms:p.rooms.length,walls:p.walls.length,openings:p.openings.length,objects:p.objects.length,scale:summary.scale??null},
   brand,summary:{areaM2:summary.areaM2??m.areaM2,roomsCounted:summary.roomsCounted,complete:summary.complete,status:summary.status??null,scale:summary.scale??null},
   surfaces:{areaM2:m.areaM2,status:m.status??null,levels:m.levels.map(l=>({name:l.name||null,rooms:l.rooms.map(r=>({id:r.id,name:N(r.name),areaM2:r.areaM2,counted:r.counted,status:r.status??null}))}))},
   plan:{sheetSvg:sheet,planSvg},views,board,objects,
   // Canonical geometry (mm) for the lab's own vector plan: nothing derived here but names (nm) and room areas (metrics).
   geometry:{walls:p.walls.map(w=>({id:w.id,start:w.start,end:w.end,thicknessMm:w.thicknessMm,structure:w.structure||null,status:w.status||null})),
    openings:p.openings.map(o=>({id:o.id,wallId:o.wallId,kind:o.kind,offsetMm:o.offsetMm,widthMm:o.widthMm,swing:o.swing||null,isEntrance:!!o.isEntrance})),
    rooms:p.rooms.map(r=>{const mr=m.levels.flatMap(l=>l.rooms).find(x=>x.id===r.id);return {id:r.id,name:N(r.name),polygon:r.polygon,labelAt:r.labelAt||null,floorMaterialId:r.floorMaterialId||null,areaM2:mr?mr.areaM2:null,counted:mr?mr.counted:null};}),
    objects:p.objects.map(o=>({id:o.id,type:o.type,position:o.position,rotationDeg:o.rotationDeg||0,size:o.size}))},
   materials:(p.materials||[]).map(x=>({id:x.id,name:N(x.name),color:x.appearance?.color||null,preset:x.appearance?.preset||null})),
   budget:original?{original:{items:original.items.length,priced:original.items.filter(i=>i.unitPrice!=null).length,view:unpricedReport},
    test:{label:'Precios de prueba de laboratorio. No son precios de mercado ni una oferta.',taxRatePercent:priced.taxRatePercent,prices:priceLog,report,view:views2}}:null};
 },TEST_PRICES);
 // Images out of the JSON (lighter), referenced by file.
 snap.views=snap.views.map((v,i)=>{const f=`assets/view-${String(i+1).padStart(2,'0')}-${v.kind}.png`;fs.writeFileSync(path.join(out,f),Buffer.from(v.dataUrl.split(',')[1],'base64'));const {dataUrl,...rest}=v;return {...rest,file:f};});
 fs.writeFileSync(path.join(out,'assets/sheet.svg'),snap.plan.sheetSvg);if(snap.plan.planSvg)fs.writeFileSync(path.join(out,'assets/plan.svg'),snap.plan.planSvg);
 snap.plan={sheet:'assets/sheet.svg',plan:snap.plan.planSvg?'assets/plan.svg':null};snap.source={sha:process.env.SHA||null,external};
 fs.writeFileSync(path.join(out,'snapshot.json'),JSON.stringify(snap,null,1));
 console.log(JSON.stringify({project:snap.project,area:snap.surfaces.areaM2,views:snap.views.length,objects:snap.objects.length,materials:snap.materials.length,budget:snap.budget&&{items:snap.budget.original.items,priced:snap.budget.original.priced,testState:snap.budget.test.view?.professional?.state,keys:Object.keys(snap.budget.test.view?.professional||{})},external:external.length},null,1));
 await browser.close();await srv.close();
})().catch(e=>{console.error(e);process.exit(1);});
