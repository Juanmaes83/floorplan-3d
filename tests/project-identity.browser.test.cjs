'use strict';
/* IDENTITY CONTRACT in the real editor (Chromium, visible controls, no network): one project.id per local project.
   1. The same project file imported twice → independent projects; 11 € in the original, 99 € typed in a copy, the
      original still shows 11 €; the Assistant log does not travel between them; reload keeps it so.
   2. «Duplicar» and «Crear variante» → new identity with the amounts, the item's own VAT and the review; then independent.
   3. A collection saved before the contract (two entries, one id, one budget) is migrated once: each keeps the prices it
      showed, they stop sharing writes, and a second load changes nothing.
   Optional evidence: IDENTITY_SHOTS=<dir>. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const K=require('./photo-project/kit.cjs'),Core=require('../js/project-core.js');
const OUT=process.env.IDENTITY_SHOTS||null,LIB='rubik-sota-project-library-v1',BUD='rubik-budget-v1';
let env;test.before(async()=>{env=await K.start();});test.after(async()=>{await env?.stop();});
const shot=async(page,name)=>{if(!OUT)return;fs.mkdirSync(OUT,{recursive:true});await page.screenshot({path:path.join(OUT,name+'.png')});};
const toEditor=async page=>{await page.locator('#workArea-design').click().catch(()=>{});await page.locator('#professionalWorkspace').waitFor({state:'hidden'}).catch(()=>{});};
async function openBudget(page){await page.locator('#workArea-budget').click();const b=page.locator('[data-route="budget-edit"]');await b.waitFor();await b.scrollIntoViewIfNeeded();await b.click();await page.locator('#budgetDialog[open]').waitFor();}
const closeBudget=async page=>{await page.evaluate(()=>document.querySelector('#budgetDialog').close());await toEditor(page);};
async function setPrice(page,value){await openBudget(page);const p=page.locator('#budgetDialog tr[data-item="paint"] [data-field="price"]');await p.fill(String(value));await p.press('Tab');
 await page.waitForFunction(v=>FloorPlanBudgetUI.current().budget.items.find(i=>i.id==='paint').unitPrice===v,value);}
// The paint item and the totals of THE budget of the open project (Presupuestar's own document and calculation).
const facts=page=>page.evaluate(()=>{const cur=FloorPlanBudgetUI.current(),c=FloorPlanBudget.calculateBudget(cur.budget),it=cur.budget.items.find(i=>i.id==='paint');
 return {pid:FloorPlanApp.project.id,entry:FloorPlanApp.entryId,subject:cur.budget.subject.id,saved:cur.saved,price:it.unitPrice,unit:it.quantity.unit,review:it.review.status,ownVat:it.taxRatePercent??null,net:c.totals.net.amount,tax:c.totals.tax.amount,gross:c.totals.gross.amount,
  log:(window.RubikAssistantUI?.state.log||[]).length,keys:Object.keys(JSON.parse(localStorage.getItem('rubik-budget-v1')||'{}')).sort(),shared:false};});
const projects=page=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)).entries.flatMap(e=>e.kind==='building'?e.building.levels.map(l=>l.project.id):[e.project.id]),LIB);
const openProjects=async page=>{if(!(await page.locator('#projectsDialog[open]').count())){await page.locator('#projectsBtn').click();await page.locator('#projectsDialog[open]').waitFor();}};
const closeProjects=async page=>{if(await page.locator('#projectsDialog[open]').count())await page.locator('#projectClose').click();};
async function switchTo(page,entry){await openProjects(page);await page.selectOption('#projectList',entry);await page.click('#projectOpen');await page.waitForFunction(e=>FloorPlanApp.entryId===e,entry);await closeProjects(page);}
async function importFile(page,name,text){const e=await page.evaluate(()=>FloorPlanApp.entryId);await page.locator('#fileIn').setInputFiles({name,mimeType:'application/json',buffer:Buffer.from(text)});await page.waitForFunction(e=>FloorPlanApp.entryId!==e,e);}
async function ask(page,q){await page.waitForFunction(()=>!!window.RubikAssistantUI);if(!(await page.locator('#assistantPanel:not([hidden])').count()))await page.locator('#assistantOpen').click();
 await page.waitForSelector('#assistantPanel:not([hidden])');await page.fill('#assistantInput',q);await page.click('#assistantSend');await page.waitForFunction(()=>!RubikAssistantUI.state.pending);await page.click('#assistantClose');}
// The original: paint at 11 €, reviewed, with its own VAT 10 % (written through Presupuestar's single write path).
async function original(page){await setPrice(page,11);await page.locator('#budgetDialog tr[data-item="paint"] [data-field="review"]').check();
 await page.evaluate(()=>{const b=JSON.parse(JSON.stringify(FloorPlanBudgetUI.current().budget));b.items.find(i=>i.id==='paint').taxRatePercent=10;FloorPlanBudgetUI.commit(b);FloorPlanBudgetUI.refresh();});await closeBudget(page);
 const f=await facts(page);assert.deepEqual([f.price,f.unit,f.review,f.ownVat,f.subject],[11,'m2','reviewed',10,f.pid]);assert.ok(f.net>0);return f;}
const unique=async page=>{const ids=await projects(page);assert.equal(new Set(ids).size,ids.length,'one project.id per local project');return ids;};

test('IDENTIDAD · el mismo archivo importado dos veces: proyectos independientes; 11 € → 99 € en la copia no cambia el original; el Asistente no se mezcla; reabrir lo mantiene',{timeout:420000},async()=>{
 const {context,page}=await K.editor(env,{acceptDownloads:true}),w=K.watch(page,env.base);
 try{
  const A=await original(page);await ask(page,'¿Qué partidas siguen sin precio?');assert.ok((await facts(page)).log>0);
  await page.locator('details.menu summary').first().click();const [d]=await Promise.all([page.waitForEvent('download'),page.locator('#exportJson').click()]),file=fs.readFileSync(await d.path(),'utf8');assert.equal(JSON.parse(file).id,A.pid);
  const savedA=await page.evaluate(([k,id])=>JSON.stringify(JSON.parse(localStorage.getItem(k))[id]),[BUD,A.pid]);
  await importFile(page,'copia-1.json',file);const B1=await facts(page);await importFile(page,'copia-2.json',file);const C1=await facts(page);
  assert.equal(new Set([A.pid,B1.pid,C1.pid]).size,3,'three identities');assert.equal((await unique(page)).length,3);
  for(const x of [B1,C1])assert.deepEqual([x.price,x.net,x.saved,x.subject,x.log],[null,null,false,x.pid,0],'an imported file inherits neither prices nor Assistant history');
  assert.equal(await page.evaluate(()=>FloorPlanApp.originProjectId),A.pid,'the file identity is remembered for reviews by file');
  // 99 € in copy 2.
  await setPrice(page,99);await shot(page,'01-copia-99');await closeBudget(page);
  assert.equal(await page.evaluate(([k,id])=>JSON.stringify(JSON.parse(localStorage.getItem(k))[id]),[BUD,A.pid]),savedA,'the budget of the original is byte-identical');
  await switchTo(page,A.entry);let a=await facts(page);assert.deepEqual([a.price,a.review,a.ownVat,a.net,a.gross],[11,'reviewed',10,A.net,A.gross],'the original still shows 11 €');
  await openBudget(page);assert.equal(await page.locator('#budgetDialog tr[data-item="paint"] [data-field="price"]').inputValue(),'11');assert.equal(await page.locator('#budgetSharedProject').count(),0);await shot(page,'02-original-11');await closeBudget(page);
  await switchTo(page,B1.entry);const b=await facts(page);assert.deepEqual([b.price,b.log],[null,0]);await switchTo(page,C1.entry);assert.equal((await facts(page)).price,99);
  // Close and reopen.
  await switchTo(page,A.entry);await K.reopen(page);a=await facts(page);assert.deepEqual([a.pid,a.price,a.net],[A.pid,11,A.net]);const logs=await page.evaluate(()=>JSON.parse(localStorage.getItem('rubik-assistant-v1')||'{}'));assert.ok(logs[A.pid]?.length>0,'the original keeps its own Assistant history');assert.deepEqual(Object.keys(logs),[A.pid],'no other identity received it');
  await switchTo(page,C1.entry);const c=await facts(page);assert.deepEqual([c.pid,c.price],[C1.pid,99]);await page.locator('#assistantOpen').click();await page.waitForSelector('#assistantPanel:not([hidden])');assert.equal(await page.evaluate(()=>RubikAssistantUI.state.log.length),0,'the copy opens the Assistant with an empty history');await page.click('#assistantClose');await unique(page);
  assert.deepEqual(w.external,[]);assert.deepEqual(w.errors,[]);
 }finally{await context.close();}
});

test('IDENTIDAD · «Duplicar» y «Crear variante»: identidad nueva con importes, IVA propio y revisión; después, independientes entre A/B/C y tras reabrir',{timeout:420000},async()=>{
 const {context,page}=await K.editor(env),w=K.watch(page,env.base);
 try{
  const A=await original(page);
  await openProjects(page);await page.fill('#projectName','Copia duplicada');await page.click('#projectDuplicate');await page.waitForFunction(e=>FloorPlanApp.entryId!==e,A.entry);await closeProjects(page);const B=await facts(page);
  await switchTo(page,A.entry);await openProjects(page);await page.click('#projectVariant');await page.waitForFunction(e=>FloorPlanApp.entryId!==e,A.entry);await closeProjects(page);const C=await facts(page);
  assert.equal(new Set([A.pid,B.pid,C.pid]).size,3);await unique(page);
  for(const x of [B,C])assert.deepEqual([x.subject,x.saved,x.price,x.unit,x.review,x.ownVat,x.net,x.tax,x.gross],[x.pid,true,11,'m2','reviewed',10,A.net,A.tax,A.gross],'the copy keeps the economic data under its own identity');
  await openBudget(page);await shot(page,'03-variante-conserva-importes');await closeBudget(page);
  // Independent writes: 99 € in the variant, 55 € in the duplicate; A stays at 11 €.
  await setPrice(page,99);await closeBudget(page);await switchTo(page,B.entry);await setPrice(page,55);await closeBudget(page);
  await switchTo(page,A.entry);assert.deepEqual([(await facts(page)).price,(await facts(page)).net],[11,A.net]);
  await K.reopen(page);const after={};for(const [k,x] of [['A',A],['B',B],['C',C]]){await switchTo(page,x.entry);after[k]=await facts(page);}
  assert.deepEqual([after.A.price,after.B.price,after.C.price],[11,55,99]);assert.deepEqual([after.A.pid,after.B.pid,after.C.pid],[A.pid,B.pid,C.pid]);assert.deepEqual(after.A.keys,[A.pid,B.pid,C.pid].sort());
  assert.deepEqual([after.A.review,after.A.ownVat],['reviewed',10]);
  assert.deepEqual(w.external,[]);assert.deepEqual(w.errors,[]);
 }finally{await context.close();}
});

test('IDENTIDAD · migración: una colección anterior con dos entradas y un solo id se separa una vez, sin perder cifras, y no se repite',{timeout:300000},async()=>{
 // Legacy storage as master 46174d6 could leave it: original + the same file imported, one id, one budget (paint 11 €).
 const p=Core.initial(),twin=Core.clone(p);
 const D=require('../js/budget-draft-core.js'),Bd=require('../js/budget-core.js'),labels={title:'Presupuesto',floor:'Pavimento',skirting:'Rodapié',paint:'Pintura',newWalls:'Tabique nuevo',demolition:'Demolición',door:'Puerta de paso',slidingDoor:'Puerta corredera',window:'Ventana',tariff:'Tarifa',chapters:{floors:'Pavimentos',walls:'Paredes',partitions:'Tabiquería',carpentry:'Carpintería'}};
 let {budget}=D.draft(p,{labels});const i=budget.items.findIndex(x=>x.id==='paint');budget.items[i]=Bd.setManualPrice(budget.items[i],{unitPrice:11,label:'Precio propio',asOf:'2026-11-16'});
 const lib=JSON.stringify({version:1,activeId:'prj_legacy1',entries:[{id:'prj_legacy1',name:'Original',project:p},{id:'prj_legacy2',name:'Copia importada',project:twin}]}),bud=JSON.stringify({[p.id]:JSON.parse(Bd.serializeBudget(Bd.validateBudget(budget)))});
 const context=await env.browser.newContext({viewport:{width:1440,height:900}});await context.addInitScript(([lk,lv,bk,bv])=>{if(!localStorage.getItem(lk)){localStorage.setItem(lk,lv);localStorage.setItem(bk,bv);}},[LIB,lib,BUD,bud]);
 const page=await context.newPage(),w=K.watch(page,env.base);
 try{
  await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());await page.goto(env.base);await require('./editor-fixture.cjs')(page);await page.waitForFunction(()=>!!window.FloorPlanBudgetUI);
  const ids=await unique(page);assert.equal(ids.length,2);assert.equal(ids[0],p.id,'the first entry keeps its id');
  const a=await facts(page);assert.deepEqual([a.entry,a.pid,a.price,a.subject],['prj_legacy1',p.id,11,p.id]);
  await switchTo(page,'prj_legacy2');const b=await facts(page);assert.deepEqual([b.pid,b.price,b.subject,b.net],[ids[1],11,ids[1],a.net],'the twin keeps the prices it was showing, under its own identity');
  await setPrice(page,99);await closeBudget(page);await switchTo(page,'prj_legacy1');assert.equal((await facts(page)).price,11,'they no longer share writes');
  const stored=await page.evaluate(k=>localStorage.getItem(k),LIB);await K.reopen(page);assert.deepEqual(await projects(page),ids,'a second load re-identifies nothing');
  assert.equal(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).entries.length,LIB),2);assert.equal(JSON.parse(stored).entries[1].origin.projectId,p.id);
  assert.deepEqual(w.external,[]);assert.deepEqual(w.errors,[]);
 }finally{await context.close();}
});

test('IDENTIDAD · si falla la migración, presupuestar queda de solo lectura y no comparte escrituras',{timeout:180000},async()=>{
 const p=Core.initial(),lib=JSON.stringify({version:1,activeId:'prj_legacy2',entries:[
  {id:'prj_legacy1',name:'Original',project:p},
  {id:'prj_legacy2',name:'Copia',project:Core.clone(p)}]});
 const D=require('../js/budget-draft-core.js'),B=require('../js/budget-core.js');
 const {budget}=D.draft(p,{labels:{title:'Presupuesto',floor:'Pavimento',skirting:'Rodapié',paint:'Pintura',newWalls:'Tabique',demolition:'Demolición',door:'Puerta',slidingDoor:'Corredera',window:'Ventana',tariff:'Tarifa',chapters:{floors:'Pavimentos',walls:'Paredes',partitions:'Tabiquería',carpentry:'Carpintería'}}});
 const bud=JSON.stringify({[p.id]:JSON.parse(B.serializeBudget(budget))});
 const context=await env.browser.newContext({viewport:{width:1440,height:900}});
 await context.addInitScript(([lk,lv,bk,bv])=>{
  if(!localStorage.getItem(lk)){
   const original=Storage.prototype.setItem;original.call(localStorage,lk,lv);original.call(localStorage,bk,bv);
   Storage.prototype.setItem=function(k,v){if(k===lk)throw new DOMException('Storage full','QuotaExceededError');return original.call(this,k,v);};
  }
 },[LIB,lib,BUD,bud]);
 const page=await context.newPage();
 try{
  await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());await page.goto(env.base);await require('./editor-fixture.cjs')(page);await page.waitForFunction(()=>!!window.FloorPlanBudgetUI);
  assert.equal(await page.evaluate(()=>FloorPlanApp.identityMigration.failed),true);
  assert.equal(new Set(await projects(page)).size,1,'both project ids remain duplicated after the failed write');
  const before=await page.evaluate(k=>localStorage.getItem(k),BUD);
  await openBudget(page);
  assert.match(await page.locator('#budgetIdentityBlocked').innerText(),/Presupuesto bloqueado/);
  assert.equal(await page.locator('#budgetDialog tr[data-item="paint"] [data-field="price"]').isDisabled(),true);
  assert.equal(await page.locator('#budgetImport').isDisabled(),true);
  assert.match(await page.evaluate(()=>{try{FloorPlanBudgetUI.commit(FloorPlanBudgetUI.current().budget);return '';}catch(e){return e.message;}}),/Presupuesto bloqueado/);
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),BUD),before,'failed migration and attempted edit leave saved budget byte-identical');
  await closeBudget(page);
 }finally{await context.close();}
});

test('UX-BETA-001 · §9 · descarga JSON desde Proyecto ▾ con el mismo exportador; confirma y no duplica en la cabecera',{timeout:90000},async()=>{
 const {context,page}=await K.editor(env,{acceptDownloads:true});
 try{
  for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
   await page.setViewportSize(viewport);await page.waitForTimeout(300);
   assert.equal(await page.locator('#exportJsonQuick').isVisible(),false,'sin botón duplicado en la cabecera');
   await page.locator('#perlaProjectMenu > summary').click();
   const button=page.getByRole('menuitem',{name:/Descargar proyecto JSON/});
   await button.waitFor({state:'visible'});
   const bounds=await button.boundingBox();
   assert.ok(bounds.x>=0&&bounds.x+bounds.width<=viewport.width,'visible dentro de la pantalla al abrir Proyecto ▾');
   const expected=await page.evaluate(()=>structuredClone(FloorPlanApp.project));
   const [download]=await Promise.all([page.waitForEvent('download'),button.press('Enter')]);
   assert.match(download.suggestedFilename(),/\.json$/);
   assert.deepEqual(JSON.parse(fs.readFileSync(await download.path(),'utf8')),expected,'mismo exportador: el archivo es el proyecto');
   assert.equal(await page.locator('#perlaProjectMenu').evaluate(d=>d.open),false,'el menú se cierra tras la acción');
   await page.waitForFunction(()=>/Proyecto JSON descargado/.test(document.querySelector('#toast').textContent));
  }
 }finally{await context.close();}
});
