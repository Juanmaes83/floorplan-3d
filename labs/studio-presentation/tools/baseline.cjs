// E0 · Baseline of the REAL product (master@f31f303), local only, RUBIK's synthetic example project.
// Captures Mi estudio, Entregar and the existing deliverables, generates the dossier PDFs through the product's OWN
// print path (its print window, intercepted), and records evidence for H01–H04. Nothing is published, no provider is
// called, external requests are blocked and listed. Usage: node baseline.cjs <repoRoot> <outDir>
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),serve=require('./serve.cjs');
const [root,out]=process.argv.slice(2);fs.mkdirSync(out,{recursive:true});
const log={external:[],errors:[],findings:{},captures:[]};
(async()=>{
 const srv=await serve(root),browser=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox','--enable-unsafe-swiftshader']});
 const ctx=await browser.newContext({viewport:{width:1440,height:900},locale:'es-ES',timezoneId:'Europe/Madrid',deviceScaleFactor:1});
 // H04 lesson: context.route() breaks the stylesheets of the product's document.write print window (harness artefact),
 // so external traffic is WATCHED (and must stay at zero), not intercepted.
 ctx.on('request',r=>{const u=r.url();if(!u.startsWith(srv.url)&&!/^(data|blob|about):/.test(u))log.external.push(u);});
 const page=await ctx.newPage();page.on('pageerror',e=>log.errors.push(e.message));page.setDefaultTimeout(60000);
 const shot=async(name,target=page,opts={})=>{const f=path.join(out,name+'.png');await target.screenshot({path:f,...opts});log.captures.push(name);};
 await page.goto(srv.url);await page.locator('#welcomeExample').click();await page.waitForFunction(()=>window.FloorPlanDossier&&window.FloorPlanBrand&&window.FloorPlanApp?.entryId);
 // Synthetic studio identity, labelled as QA (no real person, .invalid domain).
 const ids=await page.evaluate(()=>{const p=FloorPlanBrand.saveProfile(localStorage,{name:'Estudio Ejemplo (datos de prueba)',person:'Profesional de prueba',email:'estudio@example.invalid',web:'https://example.invalid',tagline:'Arquitectura e interiorismo · demostración'});
  FloorPlanBrand.setDelivery(localStorage,FloorPlanApp.entryId,{profileId:p.id,title:'Vivienda de ejemplo',intro:'Documento de demostración generado con datos de ejemplo de RUBIK.'});return {profile:p.id,entry:FloorPlanApp.entryId};});
 await page.reload();await page.waitForFunction(()=>window.FloorPlanDossier&&window.FloorPlanBudgetUI);
 const project=await page.evaluate(()=>({id:FloorPlanApp.project.id,name:FloorPlanApp.project.name,rooms:FloorPlanApp.project.rooms.length,walls:FloorPlanApp.project.walls.length,objects:FloorPlanApp.project.objects.length}));
 log.project=project;
 // Mi estudio and Entregar, as the professional sees them.
 for(const [area,name] of [['studio','01-mi-estudio'],['deliver','02-entregar'],['budget','03-presupuestar']]){const b=page.locator(`#workArea-${area}`);if(await b.count()){await b.click();await page.waitForTimeout(800);await shot(name);}}
 // Budget: opening the editor prepares and saves the project budget (the product's own behaviour).
 await page.evaluate(()=>FloorPlanBudgetUI.open());await page.waitForTimeout(1500);await shot('04-presupuesto-editor');
 const budget=await page.evaluate(()=>{const c=FloorPlanBudgetUI.current();const b=c?.budget;const r=b&&window.FloorPlanBudget?.calculateBudget?FloorPlanBudget.calculateBudget(b):null;
  return {items:b?.items?.length??null,priced:b?.items?.filter(i=>i.unitPrice!=null).length??null,status:r?.status??null,total:r?.totals?.grandTotal??r?.total??null,keys:r?Object.keys(r):null};});
 log.budget=budget;await page.evaluate(()=>document.querySelector('dialog[open]')?.close());
 // H01: what the dossier inventory says vs what the renderer composes.
 log.findings.H01=await page.evaluate(()=>{const c=FloorPlanDossier.contents();const paper=document.createElement('article');FloorPlanDossier.compose(paper,'technical');
  return {inventoryKeys:Object.keys(c.sections),inventoryHasEconomic:'economic' in c.sections,economicReady:!!window.FloorPlanEconomicDossierUI?.current(),renderedEconomicPage:!!paper.querySelector('.dossier-economic'),
   pagesRendered:[...paper.querySelectorAll('.dossier-page')].map(p=>p.className.replace('dossier-page ',''))};});
 // H02: economic dossier header with a selected brand.
 await page.evaluate(()=>FloorPlanEconomicDossierUI.open());await page.waitForTimeout(800);
 log.findings.H02=await page.evaluate(()=>{const snap=FloorPlanBrandUI.snapshot();const head=document.querySelector('.econ-brand');
  return {snapshotShape:snap?Object.keys(snap):null,snapshotHasTopLevelName:!!snap?.name,profileName:snap?.profile?.name||null,econBrandLineShown:!!head,econBrandText:head?.textContent||null};});
 await shot('05-dossier-economico');await page.evaluate(()=>document.querySelector('dialog[open]')?.close());
 // Prepared real 3D views (Entregar → Imágenes), so the dossiers carry them.
 try{await page.evaluate(()=>FloorPlanProjectViews.prepare());await page.waitForFunction(()=>FloorPlanProjectViews.current().length>0,null,{timeout:180000});log.views=await page.evaluate(()=>FloorPlanProjectViews.current().map(v=>({kind:v.kind,label:v.label})));}catch(e){log.views={error:e.message};}
 // The four dossier styles: dialog capture + the product's own print window → PDF.
 for(const st of ['technical','client','realestate','studio']){
  await page.evaluate(s=>FloorPlanDossier.open(s),st);await page.waitForTimeout(800);await shot(`06-dossier-${st}-dialogo`);
  const popupP=page.waitForEvent('popup');await page.evaluate(()=>{window.__realPrint=window.print;});await page.locator('#dossierPrint').click();
  const pop=await popupP;await pop.waitForLoadState('load');await pop.evaluate(()=>{window.print=()=>{};});await pop.waitForTimeout(1500);
  const cssLoaded=await pop.evaluate(()=>[...document.styleSheets].map(s=>{try{return {href:s.href,rules:s.cssRules.length};}catch{return {href:s.href,rules:-1};}}));
  log.findings['H04-'+st]={stylesheets:cssLoaded};
  await pop.emulateMedia({media:'print'});await pop.pdf({path:path.join(out,`07-dossier-${st}.pdf`),preferCSSPageSize:true,printBackground:true});
  await pop.screenshot({path:path.join(out,`07-dossier-${st}-ventana-impresion.png`),fullPage:false});await pop.close();await page.evaluate(()=>document.querySelector('#dossierDialog')?.close());}
 // Lámina, superficies, material board.
 await page.evaluate(()=>FloorPlanSheet.open());await page.waitForTimeout(1500);await shot('08-lamina');await page.evaluate(()=>document.querySelector('dialog[open]')?.close());
 await page.evaluate(()=>FloorPlanSurfaceSheet.open());await page.waitForTimeout(1000);await shot('09-ficha-superficies');await page.evaluate(()=>document.querySelector('dialog[open]')?.close());
 try{await page.evaluate(()=>FloorPlanMoodboardUI.open());await page.waitForTimeout(3000);await shot('10-material-board');await page.evaluate(()=>document.querySelector('dialog[open]')?.close());}catch(e){log.moodboard=e.message;}
 // B1 client file: build it with the product and render it offline.
 try{const html=await page.evaluate(async()=>(await FloorPlanClientShare.build({})).html);fs.writeFileSync(path.join(out,'11-archivo-cliente-B1.html'),html);
  const b1=await ctx.newPage();await b1.setContent(html,{waitUntil:'load'});await b1.waitForTimeout(800);await b1.screenshot({path:path.join(out,'11-archivo-cliente-B1.png'),fullPage:true});await b1.close();}catch(e){log.b1=e.message;}
 fs.writeFileSync(path.join(out,'baseline.json'),JSON.stringify({sha:process.env.SHA,ids,...log},null,1));
 await browser.close();await srv.close();console.log(JSON.stringify({project,budget:log.budget,views:log.views,H01:log.findings.H01,H02:log.findings.H02,external:log.external.length,errors:log.errors},null,1));
})().catch(e=>{console.error(e);process.exit(1);});
