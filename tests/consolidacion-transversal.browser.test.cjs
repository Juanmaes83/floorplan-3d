'use strict';
/* CONSOLIDACIÓN · recorrido transversal reproducible (Chromium, controles visibles, sin red ni /api/).
   UN proyecto sintético recorre el producto de extremo a extremo y se comprueba con los contratos vigentes
   (FloorPlanProjectV1, FloorPlanBudgetV1 + calculateBudget, CAT-03/04, Asistente V2) — sin otro modelo ni otro cálculo:
   A. 2D: muro nuevo desde «Construir» → 3D → 2D.            B. Mobiliario: dos productos de «Mis catálogos».
   C. Presupuestar: precio de ficha confirmado, IVA.           D. Cerrar y reabrir: todo sigue igual.
   E. Asistente V2: las mismas cifras que Presupuestar.        F. Exportar proyecto y presupuesto (dos documentos).
   G. CON-02 (abierto): el mismo archivo importado otra vez conserva su id y comparte presupuesto; Presupuestar lo avisa.
   H. Proyecto B: no ve nada de A; A no cambia.
   I. Navegador limpio: importar proyecto → CON-01 (la cantidad sin ficha no se inventa al reabrir) → CON-03 «Importar
      presupuesto (JSON)» con vista previa, cancelar, confirmar → mismas cifras que en origen → Asistente igual.
   Evidencia opcional: CONSOLIDACION_SHOTS=<dir>. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const K=require('./photo-project/kit.cjs'),{loadPilot}=require('./cat-ia/kit.cjs');
const OUT=process.env.CONSOLIDACION_SHOTS||null,RB='cat:local:piloto-sintetico-qa:aparador-lumen:roble',H60='cat:local:piloto-sintetico-qa:horno-h60:inox';
let env;test.before(async()=>{env=await K.start();});test.after(async()=>{await env?.stop();});
const shot=async(page,name)=>{if(!OUT)return;fs.mkdirSync(OUT,{recursive:true});await page.screenshot({path:path.join(OUT,name+'.png')});};
const toEditor=async page=>{await page.locator('#workArea-design').click().catch(()=>{});await page.locator('#professionalWorkspace').waitFor({state:'hidden'}).catch(()=>{});};
async function openFromPalette(page){const tab=page.locator('#paletteTabFurnish');if(await tab.getAttribute('aria-selected')!=='true')await tab.click();const b=page.locator('#catalogPlaceOpen');await b.scrollIntoViewIfNeeded();await b.click();await page.locator('#catalogDialog[open]').waitFor();}
async function place(page,key){const it=page.locator(`#catalogList .catalog-item[data-key="${key}"]`);await it.scrollIntoViewIfNeeded();await it.click();await page.locator(`#catalogPreview[data-key="${key}"]`).waitFor();
 await page.waitForFunction(()=>!!document.querySelector('#catalogPlaceNote')?.dataset.state);const before=new Set(await page.evaluate(()=>FloorPlanApp.project.objects.map(o=>o.id)));
 const b=page.locator('#catalogPlace');await b.scrollIntoViewIfNeeded();await b.click();await page.locator('#catalogDialog').waitFor({state:'hidden'});
 return (await page.evaluate(()=>FloorPlanApp.project.objects.map(o=>o.id))).find(x=>!before.has(x));}
async function openBudget(page){await page.locator('#workArea-budget').click();const b=page.locator('[data-route="budget-edit"]');await b.waitFor();await b.scrollIntoViewIfNeeded();await b.click();await page.locator('#budgetDialog[open]').waitFor();}
const closeBudget=page=>page.evaluate(()=>document.querySelector('#budgetDialog').close());
async function ask(page,q){await page.waitForFunction(()=>!!window.RubikAssistantUI);if(!(await page.locator('#assistantPanel:not([hidden])').count()))await page.locator('#assistantOpen').click();
 await page.waitForSelector('#assistantPanel:not([hidden])');await page.fill('#assistantInput',q);await page.click('#assistantSend');await page.waitForFunction(()=>!RubikAssistantUI.state.pending);
 return page.evaluate(()=>RubikAssistantUI.state.log.at(-1)?.text||'');}
// Geometry and links of the open project, and the economic facts of THE budget Presupuestar keeps for it (one authority).
const facts=page=>page.evaluate(()=>{const p=FloorPlanApp.project,cur=FloorPlanBudgetUI.current(),c=FloorPlanBudget.calculateBudget(cur.budget),it=id=>cur.budget.items.find(i=>i.id===id)||null,q=i=>i&&[i.quantity.value,i.quantity.unit,i.quantity.status,i.unitPrice,i.review.status];
 return {pid:p.id,entry:FloorPlanApp.entryId,walls:p.walls.length,openings:p.openings.length,objects:p.objects.length,links:Object.values(p.extensions?.['x-cat03-catalog-link']?.links||{}).map(l=>l.sku).sort(),
  saved:cur.saved,vat:cur.budget.taxRatePercent,items:cur.budget.items.map(i=>i.id).sort(),rb:q(it('cat:local:piloto-sintetico-qa:aparador-lumen:roble')),h60:q(it('cat:local:piloto-sintetico-qa:horno-h60:inox')),partition:q(it('partition-new')),
  net:c.totals.net.amount,tax:c.totals.tax.amount,gross:c.totals.gross.amount,complete:c.totals.net.complete,unpriced:c.totals.unpricedItemIds.length,stored:Object.keys(JSON.parse(localStorage.getItem('rubik-budget-v1')||'{}')).sort()};});
const stored=(page,pid)=>page.evaluate(pid=>JSON.stringify(JSON.parse(localStorage.getItem('rubik-budget-v1')||'{}')[pid]||null),pid);
const importProject=async(page,name,text)=>{const n=await page.evaluate(()=>FloorPlanApp.entryId);await page.locator('#fileIn').setInputFiles({name,mimeType:'application/json',buffer:Buffer.from(text)});await page.waitForFunction(n=>FloorPlanApp.entryId!==n,n);};
const es=n=>n.toLocaleString('es-ES');

test('CONSOLIDACIÓN · un mismo proyecto: 2D/3D → catálogo → presupuesto con IVA → reabrir → Asistente → exportar → aislamiento → otro navegador → importar presupuesto',{timeout:600000},async()=>{
 let projectJson,budgetJson,A;
 {const {context,page}=await K.editor(env,{acceptDownloads:true}),w=K.watch(page,env.base),api=[];page.on('request',r=>{if(/\/api\//.test(r.url()))api.push(r.url());});
 try{
  const f0=await facts(page);assert.equal(f0.saved,false);assert.deepEqual(f0.stored,[]);
  // A. 2D: a new wall with the visible «Construir» tools; 3D shows the project; back to 2D.
  const tapWorld=async q=>{const s=await page.evaluate(p=>{const m=new DOMPoint(p.x,p.y).matrixTransform(document.querySelector('#plan').getScreenCTM());return {x:m.x,y:m.y};},q);await page.mouse.click(s.x,s.y);await page.waitForTimeout(300);};
  const bb=await page.evaluate(()=>{const ws=FloorPlanApp.project.walls,xs=ws.flatMap(w=>[w.start.x,w.end.x]),ys=ws.flatMap(w=>[w.start.y,w.end.y]);return {x1:Math.max(...xs),y0:Math.min(...ys),y1:Math.max(...ys)};});
  await page.locator('#paletteTabBuild').click();await page.locator('#paletteWall').click();await tapWorld({x:bb.x1+1500,y:bb.y0});await tapWorld({x:bb.x1+1500,y:bb.y1});await page.locator('#paletteWallDone').click();
  assert.equal((await facts(page)).walls,f0.walls+1,'wall drawn');
  await K.open3D(page);assert.equal(await page.evaluate(()=>FloorPlanApp.viewMode),'3d');await shot(page,'01-3d');
  await page.locator('#viewSeg .btn[data-view="2d"]').click();await page.waitForFunction(()=>FloorPlanApp.viewMode==='2d');
  // B. Furniture from «Mis catálogos» (synthetic QA sheets): two products, two links in the project.
  await loadPilot(page,false);await toEditor(page);await page.locator('#paletteTabFurnish').click();await openFromPalette(page);const o1=await place(page,'aparador-lumen@roble');await openFromPalette(page);const o2=await place(page,'horno-h60@inox');assert.ok(o1&&o2);
  // C. Presupuestar: the new wall and both products are items of the ONE budget; sheet price confirmed; VAT 10 %.
  await openBudget(page);let f=await facts(page);assert.deepEqual(f.links,['QA-H60-INOX','QA-LUMEN-160-RB']);assert.ok(f.partition&&f.partition[0]>0&&f.partition[1]==='m2','the new wall is measured in the same budget');
  assert.deepEqual(f.rb,[1,'unit','measured',null,'unreviewed'],'no automatic price');assert.equal(f.net,null,'nothing priced → no amount, never 0');
  const tr=page.locator(`#budgetDialog tr[data-item="${RB}"]`);await tr.locator('.cat04-price').click();await page.locator('#pricesDialog').waitFor();await page.click('#pricesAsPrice');await page.locator('#pricesPreview').waitFor();await page.click('#pricesConfirm');
  await page.waitForFunction(()=>/Cambio aplicado/.test(document.querySelector('#pricesStatus')?.textContent||''));await page.evaluate(()=>document.querySelector('#pricesDialog').close());
  await page.waitForFunction(id=>document.querySelector(`#budgetDialog tr[data-item="${id}"] [data-field="price"]`)?.value==='690',RB);
  await page.selectOption('#budgetVat','10');await tr.locator('[data-field="review"]').check();
  A=await facts(page);assert.deepEqual([A.rb,A.h60,A.vat,A.net,A.tax,A.gross,A.complete],[[1,'unit','measured',690,'reviewed'],[1,'unit','measured',null,'unreviewed'],10,690,69,759,false]);
  assert.deepEqual(A.stored,[A.pid],'one budget document, keyed by the project');await shot(page,'02-presupuesto-origen');
  // F (budget). «Descargar presupuesto (JSON)».
  const [bd]=await Promise.all([page.waitForEvent('download'),page.locator('#budgetJson').click()]);budgetJson=fs.readFileSync(await bd.path(),'utf8');assert.deepEqual(JSON.parse(budgetJson).subject,{type:'project',id:A.pid});await closeBudget(page);
  // D. Close and reopen: geometry, objects, links, prices, VAT and review are the same.
  await toEditor(page);await K.reopen(page);assert.deepEqual(await facts(page),A,'identical after reload');
  // E. Assistant V2 answers with the figures of that same document.
  const ans=await ask(page,'¿Qué partidas siguen sin precio?');assert.match(ans,/Horno integrable H60 inox · QA-H60-INOX/);assert.doesNotMatch(ans,/Aparador Lumen/);
  const sku=await ask(page,'¿Qué SKU he colocado en este proyecto?');assert.match(sku,/QA-LUMEN-160-RB · Aparador Lumen 160 roble: 1 unidad/);await page.click('#assistantClose');
  // F (project). «Exportar JSON»: links travel, prices do not (the budget is its own document).
  await page.locator('details.menu summary').first().click();const [pd]=await Promise.all([page.waitForEvent('download'),page.locator('#exportJson').click()]);projectJson=fs.readFileSync(await pd.path(),'utf8');
  assert.equal(JSON.parse(projectJson).id,A.pid);assert.equal(projectJson.includes('unitPrice'),false);
  // G. CON-02 (open, owner decision): the same file imported again keeps its project.id — client review by file needs
  // that — so the copy and the original read and write ONE budget. It is no longer silent: Presupuestar names the twin.
  await importProject(page,'copia.json',projectJson);let c=await facts(page);assert.notEqual(c.entry,A.entry);assert.equal(c.pid,A.pid,'the portable id is kept');
  assert.deepEqual([c.walls,c.objects,c.links,c.net,c.gross],[A.walls,A.objects,A.links,A.net,A.gross]);
  await openBudget(page);const warn=page.locator('#budgetSharedProject');await warn.waitFor();assert.equal(await warn.getAttribute('data-count'),'1');assert.match(await warn.innerText(),/compartido con otro proyecto local/);await shot(page,'02b-presupuesto-compartido');await closeBudget(page);
  // H. Project B (new template): nothing of A; then back to A, which is still exactly A.
  await toEditor(page);await page.locator('#projectsBtn').click();await page.locator('#projectsDialog[open]').waitFor();await page.fill('#projectName','Proyecto B');await page.click('#projectCreate');await page.waitForFunction(e=>FloorPlanApp.entryId!==e,c.entry);
  const b=await facts(page);assert.deepEqual([b.links,b.saved,b.net,b.items.some(i=>i.startsWith('cat:'))],[[],false,null,false]);assert.notEqual(b.pid,A.pid);if(await page.locator('#projectsDialog[open]').count())await page.locator('#projectClose').click();await openBudget(page);assert.equal(await page.locator('#budgetSharedProject').count(),0,'B shares nothing');await closeBudget(page);await toEditor(page);
  if(await page.locator('#projectsDialog[open]').count())await page.locator('#projectClose').click();
  await page.locator('#projectsBtn').click();await page.locator('#projectsDialog[open]').waitFor();await page.selectOption('#projectList',A.entry);await page.click('#projectOpen');await page.waitForFunction(e=>FloorPlanApp.entryId===e,A.entry);
  if(await page.locator('#projectsDialog[open]').count())await page.locator('#projectClose').click();
  assert.deepEqual(await facts(page),{...A,stored:[A.pid,b.pid].sort()},'A is unchanged after working on B');
  assert.deepEqual(api,[]);assert.deepEqual(w.external,[]);assert.deepEqual(w.errors,[]);
 }finally{await context.close();}}

 // I. Another browser (clean storage): only the two exported files travel.
 {const {context,page}=await K.editor(env,{acceptDownloads:true}),w=K.watch(page,env.base),api=[];page.on('request',r=>{if(/\/api\//.test(r.url()))api.push(r.url());});
 try{
  await importProject(page,'traspaso-proyecto.json',projectJson);let f=await facts(page);
  assert.deepEqual([f.walls,f.openings,f.objects,f.links],[A.walls,A.openings,A.objects,A.links],'geometry, objects and catalogue links arrive');assert.deepEqual([f.saved,f.net],[false,null],'no price arrives with the project');
  // CON-01: without the studio catalogue the commercial unit is not verifiable → quantity pending, and it STAYS pending
  // however many times Presupuestar is opened (it used to become «1 ud · medido» on the second open).
  for(let n=1;n<=3;n++){await openBudget(page);f=await facts(page);assert.deepEqual(f.rb.slice(0,3),[null,'unit','unavailable'],`open #${n}: quantity not invented`);assert.equal(f.net,null);await closeBudget(page);}
  // The studio catalogue is imported here too (its own document) → the sheet verifies the unit again.
  await toEditor(page);await loadPilot(page,false);await openBudget(page);f=await facts(page);assert.deepEqual(f.rb,[1,'unit','measured',null,'unreviewed']);
  // CON-03: «Importar presupuesto (JSON)» → preview → cancel changes nothing → preview → confirm.
  const pid=f.pid,before=await stored(page,pid),file={name:'presupuesto-origen.json',mimeType:'application/json',buffer:Buffer.from(budgetJson)};
  await page.locator('#budgetImportFile').setInputFiles({name:'no-es.json',mimeType:'application/json',buffer:Buffer.from('{"schema":"otra-cosa"}')});
  await page.waitForFunction(()=>/Importación rechazada/.test(document.querySelector('#budgetStatus')?.textContent||''));assert.equal(await page.locator('#budgetImportPreview').count(),0);assert.equal(await stored(page,pid),before,'a foreign document changes nothing');
  await page.locator('#budgetImportFile').setInputFiles(file);const pv=page.locator('#budgetImportPreview');await pv.waitFor();
  if(pid===A.pid){assert.equal(await pv.getAttribute('data-same-subject'),'true');assert.equal(await page.locator('#budgetImportOther').count(),0);}
  else{assert.equal(await pv.getAttribute('data-same-subject'),'false');assert.equal(await page.locator('#budgetImportConfirm').isDisabled(),true,'another project → explicit tick first');}
  assert.equal(await pv.getAttribute('data-applied'),'1');assert.match(await pv.innerText(),/IVA: 21 % → 10 %/);assert.match(await pv.innerText(),/Base imponible: sin importe → 690,00\s€ sin IVA · parcial/);
  assert.equal(await stored(page,pid),before,'the preview saves nothing');await shot(page,'03-vista-previa-importacion');
  await page.click('#budgetImportCancel');assert.equal(await page.locator('#budgetImportPreview').count(),0);assert.equal(await stored(page,pid),before,'cancel changes nothing');
  await page.locator('#budgetImportFile').setInputFiles(file);await pv.waitFor();if(pid!==A.pid)await page.locator('#budgetImportOther').check();
  await page.click('#budgetImportConfirm');await page.waitForFunction(()=>/Presupuesto importado/.test(document.querySelector('#budgetStatus')?.textContent||''));
  f=await facts(page);const review=pid===A.pid?'reviewed':'unreviewed';
  assert.deepEqual([f.rb,f.h60,f.vat,f.net,f.tax,f.gross,f.complete,f.unpriced],[[1,'unit','measured',690,review],A.h60,10,690,69,759,false,A.unpriced],'the same economic figures as in the origin browser');
  assert.match(await page.locator(`#budgetDialog tr[data-item="${RB}"]`).innerText(),/690,00\s€/);await shot(page,'04-presupuesto-importado');await closeBudget(page);
  // Reopen and Assistant: the imported budget is THE budget of this project here.
  await toEditor(page);await K.reopen(page);const g=await facts(page);assert.deepEqual([g.rb,g.vat,g.net,g.gross,g.saved],[f.rb,10,690,759,true]);
  const ans=await ask(page,'¿Qué partidas siguen sin precio?');assert.match(ans,/Horno integrable H60 inox/);assert.doesNotMatch(ans,/Aparador Lumen/);
  assert.deepEqual(api,[]);assert.deepEqual(w.external,[]);assert.deepEqual(w.errors,[]);
 }finally{await context.close();}}
});

test('CONSOLIDACIÓN · proyecto propio (id único) llevado a otro navegador: conserva su id y su presupuesto entra sin casilla, con IVA propio y revisión',{timeout:300000},async()=>{
 let projectJson,budgetJson,O;
 {const {context,page}=await K.editor(env,{acceptDownloads:true}),w=K.watch(page,env.base);
 try{
  const e0=await page.evaluate(()=>FloorPlanApp.entryId);await page.locator('#projectsBtn').click();await page.locator('#projectsDialog[open]').waitFor();await page.fill('#projectName','Vivienda piloto');await page.click('#projectCreate');await page.waitForFunction(e=>FloorPlanApp.entryId!==e,e0);
  if(await page.locator('#projectsDialog[open]').count())await page.locator('#projectClose').click();
  await openBudget(page);const price=page.locator('#budgetDialog tr[data-item="paint"] [data-field="price"]');await price.fill('7.5');await price.press('Tab');
  await page.waitForFunction(()=>FloorPlanBudgetUI.current().budget.items.find(i=>i.id==='paint').unitPrice===7.5);await page.locator('#budgetDialog tr[data-item="paint"] [data-field="review"]').check();await page.selectOption('#budgetVat','21');
  O=await facts(page);assert.match(O.pid,/^prj_[0-9a-f]{32}$/);assert.ok(O.net>0);
  const [bd]=await Promise.all([page.waitForEvent('download'),page.locator('#budgetJson').click()]);budgetJson=fs.readFileSync(await bd.path(),'utf8');await closeBudget(page);await toEditor(page);
  await page.locator('details.menu summary').first().click();const [pd]=await Promise.all([page.waitForEvent('download'),page.locator('#exportJson').click()]);projectJson=fs.readFileSync(await pd.path(),'utf8');assert.deepEqual(w.errors,[]);
 }finally{await context.close();}}
 {const {context,page}=await K.editor(env,{acceptDownloads:true}),w=K.watch(page,env.base);
 try{
  await importProject(page,'vivienda-piloto.json',projectJson);assert.equal((await facts(page)).pid,O.pid,'an id unknown to this browser is kept');
  await openBudget(page);await page.locator('#budgetImportFile').setInputFiles({name:'vivienda-piloto-presupuesto.json',mimeType:'application/json',buffer:Buffer.from(budgetJson)});const pv=page.locator('#budgetImportPreview');await pv.waitFor();
  assert.equal(await pv.getAttribute('data-same-subject'),'true');assert.equal(await page.locator('#budgetImportOther').count(),0);assert.equal(await page.locator('#budgetImportConfirm').isEnabled(),true);
  await page.click('#budgetImportConfirm');await page.waitForFunction(()=>/Presupuesto importado/.test(document.querySelector('#budgetStatus')?.textContent||''));
  const f=await facts(page);assert.deepEqual([f.net,f.tax,f.gross,f.vat,f.complete,f.unpriced],[O.net,O.tax,O.gross,O.vat,O.complete,O.unpriced]);
  assert.equal(await page.evaluate(()=>FloorPlanBudgetUI.current().budget.items.find(i=>i.id==='paint').review.status),'reviewed','same project, same quantity → the review holds');
  assert.equal(await stored(page,O.pid),JSON.stringify(JSON.parse(budgetJson)),'the stored document is the exported one');assert.deepEqual(w.errors,[]);
 }finally{await context.close();}}
});

// CON-02 · reproduced defect kept visible for the owner's decision (it does not fail the run): two local projects made
// from the same file share one budget, so a price typed in the copy changes the original. Giving the copy a new id fixes
// this but breaks client review by file (tests/client-review.browser.test.cjs binds the notes to project.id); the real
// fix is a budget identity per library entry, which is a storage change that needs its own cut and GO.
test('CON-02 · TODO: a price typed in an imported copy must not change the budget of the original',{todo:'budget identity per library entry — owner decision',timeout:300000},async()=>{
 const {context,page}=await K.editor(env,{acceptDownloads:true});
 try{
  await openBudget(page);const price=()=>page.locator('#budgetDialog tr[data-item="paint"] [data-field="price"]');await price().fill('7');await price().press('Tab');await page.waitForFunction(()=>FloorPlanBudgetUI.current().budget.items.find(i=>i.id==='paint').unitPrice===7);await closeBudget(page);await toEditor(page);
  const A=await facts(page),savedA=await stored(page,A.pid);await page.locator('details.menu summary').first().click();const [pd]=await Promise.all([page.waitForEvent('download'),page.locator('#exportJson').click()]);
  await importProject(page,'copia.json',fs.readFileSync(await pd.path(),'utf8'));
  await openBudget(page);await price().fill('5');await price().press('Tab');await page.waitForFunction(()=>FloorPlanBudgetUI.current().budget.items.find(i=>i.id==='paint').unitPrice===5);
  const paint=t=>JSON.parse(t).items.find(i=>i.id==='paint').unitPrice;assert.equal(paint(await stored(page,A.pid)),paint(savedA),'the price of the original (7) is not the one typed in the copy (5)');
 }finally{await context.close();}
});
