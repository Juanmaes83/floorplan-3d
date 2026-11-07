'use strict';
/* FT3D-8 · M2 / S4 — integrated QA in real Chromium over the REAL application (index.html), never over a lab.
   Synthetic projects are seeded into the RUBIK library of the browser (two houses with the SAME NAME and a two-level
   building); every connection between modules goes through the product: Biblioteca → Analizar → Presupuestar →
   Plan de obra → Evolución 4D → Entregar. The official Catastro host is intercepted (synthetic INSPIRE answer).
   Evidence: screenshots in FT3D8_M2_SHOTS (viewport only). */
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),SHOTS=process.env.FT3D8_M2_SHOTS||'';
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.glb':'model/gltf-binary','.gml':'application/gml+xml'};
const KEY='rubik-sota-project-library-v1',CATASTRO='https://ovc.catastro.meh.es/';
const clone=x=>JSON.parse(JSON.stringify(x));
const GML=require('node:fs').readFileSync(path.join(__dirname,'fixtures','catastro-cp-synthetic.gml'),'utf8');
const TARIFF=require('./fixtures/bc3/synthetic-tariff.cjs');
let server,browser,url;
before(async()=>{server=createServer(async(req,res)=>{try{let p=new URL(req.url,'http://l').pathname;if(p.endsWith('/'))p+='index.html';const f=path.resolve(root,'.'+p);if(!f.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(await fs.readFile(f));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});});
after(async()=>{await browser?.close();await new Promise(r=>server.close(r));});

/* ---------- synthetic library: house A, house B (same name, other subject), building C ---------- */
function library(){
 const ref=require('../js/reference-project.js');
 const Core=require('../js/project-core.js');let A=clone(ref);A.id='prj_m2-house-a';A.name='Vivienda sintética';A=Core.setSite(A,{northOffsetDeg:15});Core.validate(A);
 const B=clone(ref);B.id='prj_m2-house-b';B.name='Vivienda sintética';B.walls[0].end={...B.walls[0].end,x:B.walls[0].end.x+200};
 const {building}=require('./fixtures/building-fixture.cjs').build();
 // A single-level house whose footprint is demonstrable (explicit placement on a parcel needs it).
 let P=clone(require('../js/building-core.js').exportLevel(building,building.levels[0].id).project);P.id='prj_m2-house-placed';P.name='Vivienda para emplazar';P=Core.setSite(P,{northOffsetDeg:20});Core.validate(P);
 return {version:1,activeId:'ent_m2-a',entries:[{id:'ent_m2-a',name:'Vivienda sintética',project:A},{id:'ent_m2-b',name:'Vivienda sintética',project:B},{id:'ent_m2-p',name:'Vivienda para emplazar',project:P},
  {id:'ent_m2-c',name:'Casa sintética de dos plantas',kind:'building',building,activeLevelId:building.levels[0].id}]};
}
async function boot(viewport={width:1440,height:900},{reducedMotion='no-preference'}={}){
 const context=await browser.newContext({viewport,acceptDownloads:true,reducedMotion});const page=await context.newPage();page.setDefaultTimeout(45000);
 const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(m.text());});
 page.on('request',r=>requests.push(r.url()));
 // The official host is never reached from CI: a synthetic INSPIRE answer for the fixture reference, «not found» otherwise.
 await context.route(CATASTRO+'**',r=>{const u=new URL(r.request().url()),ref=u.searchParams.get('refcat');
  return r.fulfill({status:200,headers:{'content-type':'text/xml; charset=utf-8','access-control-allow-origin':'*'},body:ref==='1907401VK4810H'?GML:`<ows:ExceptionReport xmlns:ows="http://www.opengis.net/ows/1.1"><ows:Exception><ows:ExceptionText><![CDATA[No se ha encontrado la parcela ${ref} para el huso ${u.searchParams.get('srsname').slice(6)}]]></ows:ExceptionText></ows:Exception></ows:ExceptionReport>`});});
 await context.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.request().url().startsWith(CATASTRO)?r.fallback():r.abort());
 await page.addInitScript(l=>{if(window.top!==window||sessionStorage.getItem('m2-seeded'))return;localStorage.clear();localStorage.setItem('rubik-sota-project-library-v1',l);sessionStorage.setItem('m2-seeded','1');},JSON.stringify(library()));
 await page.goto(url);await page.waitForFunction(()=>window.FloorPlanConstructionUI&&window.FloorPlanBudgetUI);
 await page.locator('#welcomeReturn').click();
 return {context,page,errors,requests};
}
const shot=async(page,name)=>{if(!SHOTS)return;await fs.mkdir(SHOTS,{recursive:true});await page.screenshot({path:path.join(SHOTS,name+'.jpg'),type:'jpeg',quality:82});};
async function area(page,key){await page.locator('#workArea-'+key).click();await page.waitForFunction(k=>document.getElementById('professionalWorkspace')?.dataset.area===k||document.querySelector('#professionalTitle'),key);}
async function openProject(page,entryId){
 if(!await page.locator('#professionalWorkspace').isHidden())await page.locator('#professionalWorkspace .professional-head button').first().click();
 await page.locator('#projectsBtn').click();await page.locator('#projectList').selectOption(entryId);await page.locator('#projectOpen').click();
 await page.waitForFunction(id=>FloorPlanApp.entryId===id,entryId);if(await page.locator('#projectsDialog').isVisible())await page.locator('#projectClose').click();
}
// Prices go through the real write path of Presupuestar (FloorPlanBudgetUI.commit), never into storage directly.
async function setPrices(page,prices){return page.evaluate(p=>{const c=FloorPlanBudgetUI.current(),B=FloorPlanBudget;let b=c.budget;
 b={...b,items:b.items.map(it=>p[it.id]!==undefined?B.setManualPrice(it,{unitPrice:p[it.id],label:'Precio propio',asOf:'2026-10-01'}):it)};FloorPlanBudgetUI.commit(b);
 return b.items.map(i=>({id:i.id,description:i.description,unit:i.quantity.unit}));},prices);}
const snap=page=>page.evaluate(async()=>{const s=await FloorPlanConstructionContext.snapshot();return {entryId:s.entry.id,subject:s.subject,revision:s.revision,record:s.record};});
async function elements(page){return page.evaluate(async()=>{const s=await FloorPlanConstructionContext.snapshot(),inv=FloorPlanConstructionProject.inventory(s.doc);
 return {walls:inv.elements.filter(e=>e.type==='wall'&&e.lifecycle==='existing').map(e=>e.key),floors:inv.elements.filter(e=>e.type==='floor').map(e=>e.key)};});}
// The scenario of the owner's addendum, through the plan editor UI: dependencies, simultaneous tasks, a task without
// geometry, one item split 60/40 between two tasks (each with real elements).
async function buildPlanThroughUI(page,{itemId,elementsA,elementsB}){
 await area(page,'budget');await page.locator('[data-route="construction-plan"]').click();await page.waitForSelector('#planDialog[open]');
 await page.locator('#planCreate').click();
 const addTask=async({title,start,end,dep=null,els=[],ill=[],alloc=[],milestone=false})=>{
  await page.locator(milestone?'#planAddMilestone':'#planAddTask').click();await page.fill('#taskTitle',title);await page.fill('#taskStart',start);if(!milestone)await page.fill('#taskEnd',end);
  if(dep){await page.locator('#taskAddDep').click();const r=page.locator('#taskForm [data-dep]').last();await r.locator('select').first().selectOption({label:dep.label});await r.locator('select').nth(1).selectOption(dep.type);await r.locator('input').fill(String(dep.lag));}
  for(const k of els)await page.locator(`#taskElements input[data-element="${k}"]`).check();
  for(const [k,role] of ill){await page.locator(`#taskElements input[data-element="${k}"]`).check();await page.locator(`#taskElements label:has(input[data-element="${k}"]) select`).selectOption(role);}
  for(const a of alloc){await page.locator('#taskAddItem').click();const r=page.locator('#taskForm [data-alloc]').last();await r.locator('select').selectOption(a.itemId);await r.locator('input').fill(String(a.share));}
  await page.locator('#taskSave').click();if(await page.locator('#taskForm').count())assert.fail('task not saved: '+await page.locator('#taskError').textContent());};
 await addTask({title:'Replanteo y protecciones',start:'2026-03-02',end:'2026-03-04'});                          // no geometry, no items
 await addTask({title:'Revestimiento de muros',start:'2026-03-05',end:'2026-03-18',dep:{label:'1 Replanteo y protecciones',type:'FS',lag:0},els:elementsA,ill:[['illustrative/scaffold','temporary']],alloc:[{itemId,share:60}]});
 await addTask({title:'Pavimentos',start:'2026-03-10',end:'2026-03-24',dep:{label:'1 Replanteo y protecciones',type:'FS',lag:3},els:elementsB,alloc:[{itemId,share:40}]});
 await addTask({title:'Entrega de llaves',start:'2026-03-25',milestone:true,dep:{label:'3 Pavimentos',type:'FS',lag:0}});
 await page.locator('#planSave').click();await page.waitForFunction(()=>/Plan guardado/.test(document.getElementById('planStatus').textContent));
}
async function openEvolution(page,opts){await page.evaluate(o=>FloorPlanConstructionUI.openEvolution(o),opts||{});
 await page.waitForFunction(()=>{const f=document.getElementById('evolutionFrame');return f?.contentDocument?.body?.classList.contains('ready')&&(f.contentWindow.__ft3dFidelity?.ctx||f.contentDocument.body.dataset.state);},null,{timeout:60000});
 return page.frames().find(f=>f.url().includes('/evolucion/'));}

test('M2-QA-01 · same house in every area: subject, revision and level verified; no import, no lab',{timeout:240000},async()=>{
 const {page,errors,requests,context}=await boot();
 const s=await snap(page);assert.deepEqual([s.entryId,s.subject.type,s.subject.id],['ent_m2-a','project','prj_m2-house-a']);
 await area(page,'analyze');await shot(page,'m2-01-analizar');
 await area(page,'budget');assert.match(await page.locator('#constructionPlanCard').innerText(),/Sin plan de obra/);
 await page.locator('[data-route="construction-plan"]').click();await page.waitForSelector('#planDialog[open]');
 assert.match(await page.locator('#planSubject').innerText(),new RegExp(`Vivienda sintética[\\s\\S]*Proyecto · revisión ${s.revision.slice(0,8)}`));
 await page.locator('#planClose').click();
 const f=await openEvolution(page);const m=await f.evaluate(()=>({...window.__ft3dFidelity.model,text:document.body.innerText,source:document.documentElement.dataset.source}));
 assert.deepEqual([m.subject.type,m.subject.id,m.fingerprint],['project','prj_m2-house-a',s.revision],'Evolución shows the same subject at the same revision');
 assert.equal(m.source,'library');assert.equal(m.planning,'unavailable');
 assert.doesNotMatch(m.text,/FIXTURE|Expediente de prueba|Datos de prueba|Marca de prueba/,'no lab wording in the product');
 assert.match(await f.locator('#planMissing').innerText(),/todavía no tiene plan de obra[\s\S]*RUBIK no inventa fechas/);
 assert.match(await page.locator('#evolutionCrumbs').innerText(),new RegExp(`revisión ${s.revision.slice(0,8)}`));
 assert.ok(!requests.some(u=>/\/labs\//.test(u)),'nothing is loaded from labs/');assert.deepEqual(errors,[]);await context.close();
});

test('M2-QA-02 · Catastro in Analizar: official lookup (intercepted), association, explicit placement, saved and reopened',{timeout:240000},async()=>{
 const {page,errors,context}=await boot();await openProject(page,'ent_m2-p');
 await area(page,'analyze');await page.locator('[data-route="territory"]').click();await page.waitForSelector('#territoryDialog[open]');
 await page.locator('#territoryProvider').selectOption('catastro-inspire-wfs');assert.equal(await page.locator('#territoryReference').isHidden(),false,'reference lookup offered by the existing territory UI');
 await page.fill('#territoryLookupReference','0000000AA0000A');await page.locator('#territoryLookup').click();
 await page.waitForFunction(()=>/no tiene ninguna parcela con esa referencia/.test(document.getElementById('territoryStatus').textContent));const nf=await page.locator('#territoryStatus').innerText();assert.doesNotMatch(nf,/parcel-not-found/,'no technical code on screen');
 await page.fill('#territoryLookupReference','1907401VK4810H');await page.locator('#territoryLookup').click();await page.waitForFunction(()=>!document.getElementById('territoryCard').hidden&&/1907401VK4810H/.test(document.getElementById('territoryCard').textContent));
 await page.locator('#territorySave').click();await page.waitForFunction(()=>FloorPlanApp.project.site?.parcel?.reference==='1907401VK4810H');
 const parcel=await page.evaluate(()=>FloorPlanApp.project.site.parcel);assert.deepEqual([parcel.source.providerId,parcel.sourceCrs],['catastro-inspire-wfs','EPSG:25830']);
 assert.equal(await page.evaluate(()=>FloorPlanApp.project.site.buildingPlacement),undefined,'a reference never moves the house');
 // Explicit placement: the professional clicks inside the parcel and saves.
 await page.locator('#territoryPlacementPreview svg').click();await page.locator('#territoryPlacementSave').click();
 await page.waitForFunction(()=>!!FloorPlanApp.project.site.buildingPlacement);await shot(page,'m2-02-emplazamiento');
 const saved=await page.evaluate(()=>FloorPlanApp.project.site);await page.locator('#territoryClose').click();
 await page.reload();await page.waitForFunction(()=>window.FloorPlanConstructionUI);if(await page.locator('#welcomeReturn').isVisible())await page.locator('#welcomeReturn').click();
 assert.deepEqual(await page.evaluate(()=>FloorPlanApp.project.site),saved,'same parcel, provenance, CRS and placement after reopening');
 await area(page,'analyze');await page.waitForSelector('#parcelOrigin');assert.match(await page.locator('#parcelOrigin').innerText(),/Consulta oficial al Catastro · referencia 1907401VK4810H · EPSG:25830/);
 // House B is untouched.
 await openProject(page,'ent_m2-a');assert.equal(await page.evaluate(()=>FloorPlanApp.project.site?.parcel??null),null,'no parcel leaks into another house');
 assert.ok(nf.length>0);assert.deepEqual(errors,[]);await context.close();
});

test('M2-QA-03/04 · BC3 price applied in Presupuestar; one item in two tasks and two element groups; both directions; no double amount',{timeout:300000},async()=>{
 const {page,errors,context}=await boot();
 const items=await setPrices(page,{'skirting':9.5});const oak=items.find(i=>/roble/i.test(i.description)&&i.unit==='m2');assert.ok(oak,'oak floor item exists');
 // S2 inside Presupuestar: BC3 tariff (two price columns) → search → provenance → explicit confirmation.
 await area(page,'budget');await page.locator('[data-route="reference-prices"]').click();await page.waitForSelector('#pricesDialog[open]');
 await page.locator(`#pricesItems [data-item="${oak.id}"]`).click();
 await page.setInputFiles('#pricesBc3',{name:'tarifa-sintetica.bc3',mimeType:'application/octet-stream',buffer:Buffer.from(TARIFF.text,'latin1')});
 await page.waitForSelector('#pricesSources [data-col]');await page.locator('#pricesSources [data-col]').selectOption('0');
 assert.match(await page.locator('#pricesManaged').innerText(),/no disponible/);assert.equal(await page.locator('#pricesManaged').getAttribute('data-enabled'),'false');
 await page.fill('#pricesQuery','roble');await page.locator('#pricesSearch button[type=submit]').click();await page.waitForSelector('[data-quote="PAV-ROBLE"]');
 await page.locator('[data-quote="PAV-ROBLE"]').click();await page.locator('[data-detail="0"]').click();
 assert.match(await page.locator('#pricesProvenance').innerText(),/PAV-ROBLE[\s\S]*38,50/);
 const before=await page.evaluate(id=>FloorPlanBudgetUI.current().budget.items.find(i=>i.id===id).unitPrice,oak.id);
 await page.locator('#pricesAsPrice').click();await page.waitForSelector('#pricesPreview');
 assert.equal(await page.evaluate(id=>FloorPlanBudgetUI.current().budget.items.find(i=>i.id===id).unitPrice,oak.id),before,'previewing changes nothing');
 await page.locator('#pricesConfirm').click();await page.waitForFunction(()=>/Cambio aplicado/.test(document.getElementById('pricesStatus').textContent));await shot(page,'m2-03-precios-referencia');
 await page.locator('#pricesDialog .cx-head button').click();
 const {walls,floors}=await elements(page);
 await buildPlanThroughUI(page,{itemId:oak.id,elementsA:walls.slice(0,2),elementsB:floors.slice(0,2)});
 // Close, reload: same item, price, source and plan in Presupuestar and Plan de obra.
 await page.locator('#planClose').click();await page.reload();await page.waitForFunction(()=>window.FloorPlanConstructionUI);if(await page.locator('#welcomeReturn').isVisible())await page.locator('#welcomeReturn').click();
 const it=await page.evaluate(id=>{const b=FloorPlanBudgetUI.current().budget,i=b.items.find(x=>x.id===id),l=FloorPlanBudget.calculateBudget(b).lines.find(x=>x.id===id);return {price:i.unitPrice,source:i.priceSource,ref:i.priceReference?.code,net:l.subtotalNet};},oak.id);
 assert.deepEqual([it.price,it.source.type,it.ref],[38.5,'provider-reference','PAV-ROBLE']);
 await area(page,'budget');await page.locator('[data-route="budget-edit"]').click();await page.waitForSelector('#budgetDialog[open]');
 const row=page.locator(`#budgetDialog tr[data-item="${oak.id}"]`);assert.match(await row.innerText(),/Precio de referencia[\s\S]*PAV-ROBLE/);
 // Item → tasks (from the real budget dialog).
 assert.match(await row.locator('.budget-links').innerText(),/2 Revestimiento de muros · 60 %[\s\S]*3 Pavimentos · 40 %[\s\S]*4 elementos/);
 await row.locator('[data-task]').first().click();await page.waitForSelector('#planDialog[open]');
 assert.equal(await page.locator('#planTasks tr.is-focus').getAttribute('data-task')!==null,true,'the task is focused');
 // Task → item, with amounts that add up to the item, never twice.
 await page.locator('#planTab-items').click();const r2=page.locator(`#planItems tr[data-item="${oak.id}"]`);const txt=await r2.innerText();
 const amounts=[...txt.matchAll(/· ([\d.]+,\d{2})\s€/g)].map(x=>Number(x[1].replace(/\./g,'').replace(',','.')));
 assert.equal(amounts.length,2);assert.equal(Math.round((amounts[0]+amounts[1])*100),Math.round(it.net*100),'60 % + 40 % = the item, in cents');
 assert.match(txt,/Repartida 100 %/);await shot(page,'m2-04-partida-tareas');
 // Element → tasks.
 await r2.locator('[data-element]').first().click();assert.match(await page.locator('#planElements tr.is-focus').innerText(),/Revestimiento de muros · acabado|Pavimentos · acabado/);
 await page.locator('#planClose').click();if(await page.locator('#budgetDialog').isVisible())await page.locator('#budgetClose').click();
 assert.deepEqual(errors,[]);await context.close();
});

test('M2-QA-05 · Evolución: scene, Gantt, date, card and amounts from one evaluation (simultaneous works, task without geometry)',{timeout:300000},async()=>{
 const {page,errors,context}=await boot();
 const items=await setPrices(page,{});const oak=items.find(i=>/roble/i.test(i.description)&&i.unit==='m2');await setPrices(page,{[oak.id]:36});
 const {walls,floors}=await elements(page);await buildPlanThroughUI(page,{itemId:oak.id,elementsA:walls.slice(0,3),elementsB:floors.slice(0,2)});await page.locator('#planClose').click();
 const f=await openEvolution(page);
 for(const d of ['2026-03-03','2026-03-12','2026-03-20','2026-03-25']){
  const r=await f.evaluate(date=>{const F=window.__ft3dFidelity,last=F.setDate(date),st=FloorPlanConstructionSchedule.stateAt(F.ctx.schedule,date);
   return {last,expected:st.tasks.filter(t=>t.plannedPhase==='in-progress').map(t=>t.id).sort(),cursor:document.querySelector('#gantt [data-role=cursor]')?.dataset.date,card:document.getElementById('cardDate').textContent,tasks:[...document.querySelectorAll('#cardTasks li .t')].map(x=>x.textContent)};},d);
  assert.deepEqual([...r.last.activeTaskIds].sort(),r.expected,'active tasks = engine at '+d);assert.equal(r.cursor,d,'Gantt cursor at '+d);
  if(d==='2026-03-12')assert.equal(r.tasks.length,2,'two simultaneous works on the card');
  if(d==='2026-03-03')assert.match(r.tasks.join(' '),/Replanteo/,'a task without geometry is still on the card');}
 await f.evaluate(()=>window.__ft3dFidelity.setDate('2026-03-12'));await page.waitForTimeout(300);await shot(page,'m2-05-evolucion-simultaneas');
 const ill=await f.evaluate(()=>({n:(window.__ft3dFidelity.ctx.model.illustrative||[]).length,card:document.getElementById('cardTasks').textContent}));
 assert.equal(ill.n,1,'the scaffold linked in the plan is drawn');assert.match(ill.card,/andamio \(ilustración\)/,'and said to be an illustration');
 // Card amounts = C1–C4 subtotal × explicit share.
 const c=await f.evaluate(()=>{const F=window.__ft3dFidelity,rep=F.ctx.model.costs.report;return {byTask:rep.byTask.map(t=>({id:t.taskId,known:t.knownNet})),econ:document.getElementById('cardEconomy')?.textContent};});
 const net=await page.evaluate(id=>FloorPlanBudget.calculateBudget(FloorPlanBudgetUI.current().budget).lines.find(l=>l.id===id).subtotalNet,oak.id);
 const parts=c.byTask.filter(t=>t.known!==null).map(t=>t.known);assert.equal(Math.round(parts.reduce((a,b)=>a+b,0)*100),Math.round(net*100),'no amount counted twice');
 assert.match(c.econ,/Presupuesto conocido del proyecto: .* sin IVA \(parcial\) · \d+ partidas sin precio · \d+ partidas sin asignar a tareas/,'known, partial, unpriced and unassigned said plainly');
 // Select a task → its elements are highlighted; partida → Presupuestar over the evolution; back to the same moment.
 const sel=await f.evaluate(()=>{const F=window.__ft3dFidelity,id=F.ctx.canon.tasks.find(t=>/Pavimentos/.test(t.title)).id,r=F.selectTask(id);return {id,highlighted:r.highlighted,date:F.last.date};});
 assert.ok(sel.highlighted>0,'real elements highlighted');await f.evaluate(()=>document.querySelector('#cardExtra details')?.setAttribute('open',''));await shot(page,'m2-05-tarea-seleccionada');
 await f.locator('#cardExtra [data-rubik="open-budget"]').first().click();await page.waitForSelector('#budgetDialog[open]');
 assert.equal(await page.locator(`#budgetDialog tr.is-focus`).getAttribute('data-item'),oak.id,'the linked item opens in Presupuestar');await shot(page,'m2-05-partida-en-presupuestar');
 await page.locator('#budgetClose').click();await page.waitForTimeout(500);
 const back=await page.frames().find(x=>x.url().includes('/evolucion/')).evaluate(()=>({date:window.__ft3dFidelity.last.date,selected:window.__ft3dFidelity.selected}));
 assert.deepEqual(back,{date:sel.date,selected:sel.id},'same date and task after coming back');
 assert.deepEqual(errors,[]);await context.close();
});

test('M2-QA-06 · two houses with the same name and a building: switching never mixes parcel, prices, plan or brand',{timeout:300000},async()=>{
 const {page,errors,context}=await boot();
 const items=await setPrices(page,{});const oak=items.find(i=>/roble/i.test(i.description));await setPrices(page,{[oak.id]:40});
 const {walls}=await elements(page);await buildPlanThroughUI(page,{itemId:oak.id,elementsA:walls.slice(0,1),elementsB:[]});await page.locator('#planClose').click();
 const a=await snap(page);
 await openProject(page,'ent_m2-b');const b0=await snap(page);
 assert.deepEqual([b0.subject.id,b0.record],['prj_m2-house-b',null],'B has no plan of A (same name, other subject)');
 assert.equal(await page.evaluate(id=>FloorPlanBudgetUI.current().budget.items.find(i=>i.id===id).unitPrice,oak.id),null,'B has no price of A');
 await setPrices(page,{[oak.id]:55});await area(page,'budget');await page.locator('[data-route="construction-plan"]').click();await page.locator('#planCreate').click();await page.locator('#planSave').click();await page.locator('#planClose').click();
 await openProject(page,'ent_m2-a');const a2=await snap(page);
 assert.equal(a2.record.schedule.tasks.length,a.record.schedule.tasks.length);assert.equal(a2.record.schedule.id,a.record.schedule.id);
 assert.equal(await page.evaluate(id=>FloorPlanBudgetUI.current().budget.items.find(i=>i.id===id).unitPrice,oak.id),40,'A keeps its own price');
 // The building: one budget per level, listed, never summed; a building plan does not split level items.
 await openProject(page,'ent_m2-c');const c=await snap(page);assert.equal(c.subject.type,'building');
 await area(page,'budget');await page.locator('[data-route="construction-plan"]').click();await page.locator('#planCreate').click();
 assert.match(await page.locator('#planDialog').innerText(),/Edificio de varias plantas[\s\S]*todavía no tiene presupuesto de edificio/);
 await page.locator('#planTab-items').click();assert.match(await page.locator('#planLevelBudgets').innerText(),/Planta/);assert.doesNotMatch(await page.locator('#planDialog').innerText(),/Total del edificio/);
 await shot(page,'m2-06-edificio');await page.locator('#planClose').click();if(await page.locator('#planDiscard').isVisible())await page.locator('#planDiscard').click();
 assert.deepEqual(errors,[]);await context.close();
});

test('M2-QA-07/08 · local delivery with Mi estudio signature; later changes make it obsolete; history kept; no restricted layer',{timeout:420000},async()=>{
 const {page,errors,context}=await boot();
 // Mi estudio: a real profile chosen for this project through the brand core of the app.
 await page.evaluate(()=>{const B=FloorPlanBrand,p=B.saveProfile(localStorage,{name:'Estudio Perla Sintético',person:'Arquitecta de prueba',email:'estudio@example.test'});B.setDelivery(localStorage,FloorPlanApp.entryId,{profileId:p.id});});
 const items=await setPrices(page,{});const oak=items.find(i=>/roble/i.test(i.description));await setPrices(page,{[oak.id]:36});
 const {walls,floors}=await elements(page);await buildPlanThroughUI(page,{itemId:oak.id,elementsA:walls.slice(0,2),elementsB:floors.slice(0,1)});await page.locator('#planClose').click();
 // Parcel saved from the official service: its geometry is restricted and must not travel in the HTML.
 await area(page,'analyze');await page.locator('[data-route="territory"]').click();await page.locator('#territoryProvider').selectOption('catastro-inspire-wfs');await page.fill('#territoryLookupReference','1907401VK4810H');await page.locator('#territoryLookup').click();
 await page.waitForFunction(()=>!document.getElementById('territoryCard').hidden);await page.locator('#territorySave').click();await page.locator('#territoryClose').click();
 const s=await snap(page);
 const f=await openEvolution(page,{mode:'deliver'});assert.equal(await f.evaluate(()=>document.body.dataset.tab),'entrega');
 assert.match(await f.locator('#brandSel').innerText(),/Firma de este proyecto \(Mi estudio\): Estudio Perla Sintético/);assert.doesNotMatch(await f.locator('#brandSel').innerText(),/laboratorio/);
 assert.equal(await f.locator('#publishBox').isVisible(),false,'remote publication stays off');assert.match(await f.locator('#publishOff').textContent(),/desactivado/);
 const doc=await f.evaluate(async()=>{const d=await window.__ft3dDelivery.prepareDocument();return {html:d.html,id:d.manifest.id,project:d.manifest.project};});
 assert.equal(doc.project.id,'prj_m2-house-a');assert.match(doc.html,/Estudio Perla Sintético/);assert.match(doc.html,/Vivienda sintética/);
 const parcel=await page.evaluate(()=>FloorPlanApp.project.site.parcel);const coord=String(parcel.sourceGeometry.polygons[0].rings[0][0][0]);
 assert.ok(!doc.html.includes(coord),'no restricted parcel geometry in the HTML');
 await shot(page,'m2-08-entrega');
 await page.waitForFunction(()=>{const r=JSON.parse(localStorage.getItem('rubik-construction-v1'));return Object.values(r.records).some(x=>x.deliveries.length);});
 await page.locator('#evolutionBack').click();
 await area(page,'deliver');await page.waitForSelector('#deliveryState');assert.equal(await page.locator('#deliveryState').getAttribute('data-result'),'match');await shot(page,'m2-07-entregar-al-dia');
 // A price changes → the prepared delivery is obsolete; the recorded one stays.
 await setPrices(page,{[oak.id]:41});await area(page,'deliver');await page.waitForSelector('#deliveryState');
 assert.equal(await page.locator('#deliveryState').getAttribute('data-result'),'obsolete');assert.match(await page.locator('#deliveryState').innerText(),/el presupuesto/);
 // The signature changes → also named.
 await page.evaluate(()=>{const B=FloorPlanBrand,p=B.readProfiles(localStorage).profiles[0];B.saveProfile(localStorage,{...p,name:'Estudio Perla Renombrado'});});
 await area(page,'analyze');await area(page,'deliver');await page.waitForSelector('#deliveryState');assert.match(await page.locator('#deliveryState').innerText(),/la firma de Mi estudio/);
 // A wall changes (saved project) → the plan is obsolete and the broken link must be fixed before saving.
 const linked=walls[0].split('/')[1];
 await page.evaluate(w=>{const lib=JSON.parse(localStorage.getItem('rubik-sota-project-library-v1')),e=lib.entries.find(x=>x.id==='ent_m2-a');e.project.walls=e.project.walls.filter(x=>x.id!==w);e.project.openings=e.project.openings.filter(o=>o.wallId!==w);localStorage.setItem('rubik-sota-project-library-v1',JSON.stringify(lib));},linked);
 await page.reload();await page.waitForFunction(()=>window.FloorPlanConstructionUI);if(await page.locator('#welcomeReturn').isVisible())await page.locator('#welcomeReturn').click();
 await area(page,'budget');assert.match(await page.locator('#constructionPlanCard').innerText(),/El proyecto ha cambiado desde que guardaste el plan/);
 await page.locator('[data-route="construction-plan"]').click();assert.match(await page.locator('#planDialog').innerText(),/El proyecto ha cambiado desde que se guardó este plan/);
 await page.locator('#planTab-checks').click();assert.match(await page.locator('#planDialog').innerText(),/vínculo apunta a elementos que ya no existen/);await shot(page,'m2-07-vinculo-desactualizado');
 const after=await snap(page);assert.notEqual(after.revision,s.revision);assert.equal(after.record.deliveries.length,1,'delivery history intact');
 await page.locator('#planFixLinks').click();await page.locator('#planSave').click();await page.waitForFunction(()=>/Plan guardado/.test(document.getElementById('planStatus').textContent));
 assert.equal((await snap(page)).record.schedule.projectRef.revision,after.revision,'saved again for the current revision');
 await page.locator('#planClose').click();assert.deepEqual(errors,[]);await context.close();
});

test('M2-QA-08 · MP4 of the same plan, downloaded and inspected (Chromium WebCodecs)',{timeout:420000},async()=>{
 const {page,errors,context}=await boot({width:1440,height:900});
 const items=await setPrices(page,{});const oak=items.find(i=>/roble/i.test(i.description));await setPrices(page,{[oak.id]:36});
 const {walls,floors}=await elements(page);await buildPlanThroughUI(page,{itemId:oak.id,elementsA:walls.slice(0,2),elementsB:floors.slice(0,1)});await page.locator('#planClose').click();
 const f=await openEvolution(page,{mode:'deliver'});
 const out=await f.evaluate(async()=>{if(typeof VideoEncoder==='undefined')return {skipped:'no WebCodecs'};const meta=await window.__ft3dDelivery.record();const v=window.__ft3dDelivery.state?.video;if(!meta||!v?.blob)return {skipped:'not recorded'};
  const buf=new Uint8Array(await v.blob.arrayBuffer());return {bytes:buf.length,info:window.FloorPlanConstructionMp4?FloorPlanConstructionMp4.inspect(buf):null,name:v.filename,type:v.blob.type};});
 if(out.skipped){console.log('# MP4 not produced in this browser:',out.skipped);}
 else{assert.ok(out.bytes>10000);assert.equal(out.type,'video/mp4');if(out.info)assert.equal(out.info.valid,true);}
 const rec=await page.evaluate(()=>Object.values(JSON.parse(localStorage.getItem('rubik-construction-v1')).records).flatMap(r=>r.deliveries));
 if(!out.skipped)assert.ok(rec.some(d=>d.output==='vídeo'),'the video delivery is recorded');
 assert.deepEqual(errors,[]);await context.close();
});

test('M2-QA-09 · full route Biblioteca → Analizar → Presupuestar → Plan de obra → Evolución → Entregar, with no lab and no JSON',{timeout:300000},async()=>{
 const {page,errors,requests,context}=await boot();
 await openProject(page,'ent_m2-a');await area(page,'analyze');
 const items=await setPrices(page,{});const oak=items.find(i=>/roble/i.test(i.description));await setPrices(page,{[oak.id]:36});
 const {walls,floors}=await elements(page);await buildPlanThroughUI(page,{itemId:oak.id,elementsA:walls.slice(0,1),elementsB:floors.slice(0,1)});
 await page.locator('#planEvolution').click();const f=await openEvolution(page);await f.evaluate(()=>window.__ft3dFidelity.setDate('2026-03-12'));
 await page.locator('.cx-step[data-step="entrega"]').click();assert.equal(await f.evaluate(()=>document.body.dataset.tab),'entrega');
 await page.locator('#evolutionBack').click();await area(page,'deliver');await page.waitForSelector('#constructionDeliveryCard');
 assert.ok(!requests.some(u=>/\/labs\//.test(u)),'no request to labs/');
 const inputs=await page.evaluate(()=>window.__m2FileInputsUsed||0);assert.equal(inputs,0);
 assert.deepEqual(errors,[]);await context.close();
});

for(const vp of [{width:1280,height:720},{width:1366,height:768},{width:1440,height:900},{width:1920,height:1080}])
test(`M2-QA-10 · desktop ${vp.width}×${vp.height}: house, controls, date, card and Gantt visible without page scroll inside RUBIK`,{timeout:240000},async()=>{
 const {page,errors,context}=await boot(vp);
 const items=await setPrices(page,{});const oak=items.find(i=>/roble/i.test(i.description));await setPrices(page,{[oak.id]:36});
 const {walls,floors}=await elements(page);await buildPlanThroughUI(page,{itemId:oak.id,elementsA:walls.slice(0,2),elementsB:floors.slice(0,1)});await page.locator('#planClose').click();
 const f=await openEvolution(page);await f.evaluate(()=>window.__ft3dFidelity.setDate('2026-03-12'));await page.waitForTimeout(300);
 const box=await f.evaluate(()=>{const r=id=>{const e=document.getElementById(id)||document.querySelector(id);const b=e.getBoundingClientRect();return {top:b.top,bottom:b.bottom,h:b.height};};
  return {vh:innerHeight,scroll:document.documentElement.scrollHeight>innerHeight+1,hscroll:document.documentElement.scrollWidth>innerWidth+1,stage:r('stage'),transport:r('.transport'),card:r('cardDate'),gantt:r('gantt')};});
 for(const k of ['stage','transport','card','gantt'])assert.ok(box[k].top>=0&&box[k].bottom<=box.vh+1,`${k} inside the viewport at ${vp.width}×${vp.height}`);
 assert.ok(box.stage.h>=box.vh*0.38,'the house stays the protagonist');assert.equal(box.scroll,false,'no page scroll');assert.equal(box.hscroll,false);
 await shot(page,`m2-10-evolucion-${vp.width}x${vp.height}`);assert.deepEqual(errors,[]);await context.close();
});

test('M2-QA-10 · mobile 390×844, keyboard and reduced motion: plan editor and evolution usable, no horizontal scroll',{timeout:240000},async()=>{
 const {page,errors,context}=await boot({width:390,height:844},{reducedMotion:'reduce'});
 const items=await setPrices(page,{});const oak=items.find(i=>/roble/i.test(i.description));await setPrices(page,{[oak.id]:36});
 const {walls,floors}=await elements(page);await buildPlanThroughUI(page,{itemId:oak.id,elementsA:walls.slice(0,1),elementsB:floors.slice(0,1)});
 assert.equal(await page.evaluate(()=>{const d=document.getElementById('planDialog');return d.scrollWidth>d.clientWidth+1;}),false,'plan editor fits the phone');
 await page.locator('#planTab-tasks').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.evaluate(()=>document.activeElement.id),'planTab-items','tabs with arrow keys');
 await shot(page,'m2-10-movil-plan');await page.locator('#planClose').click();
 const f=await openEvolution(page);await f.evaluate(()=>window.__ft3dFidelity.setDate('2026-03-12'));await page.waitForTimeout(300);
 assert.equal(await f.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'evolution without horizontal scroll');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
 await shot(page,'m2-10-movil-evolucion');assert.deepEqual(errors,[]);await context.close();
});

test('M2 · Entregar with a partially priced budget answers (master froze here: endless mutation loop in the C4 summary)',{timeout:120000},async()=>{
 const {page,errors,context}=await boot();
 const items=await setPrices(page,{});await setPrices(page,{[items[0].id]:30});
 await page.evaluate(()=>{setTimeout(()=>FloorPlanProfessionalUI.open('deliver'),0);});await page.waitForTimeout(1500);
 const r=await Promise.race([page.evaluate(()=>document.querySelector('.project-context-ready')?.textContent||''),new Promise(res=>setTimeout(()=>res('BLOCKED'),8000))]);
 assert.notEqual(r,'BLOCKED','the page keeps answering');assert.equal((r.match(/Presupuesto: /g)||[]).length<=1,true,'the budget state is written once, not repeated');
 assert.deepEqual(errors,[]);await context.close();
});
