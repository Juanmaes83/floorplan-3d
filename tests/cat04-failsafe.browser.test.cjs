'use strict';
/* Audit #237 (case 1): if the CAT-04 reconciliation fails (an exception in RubikCat04.extraLines, or the module not loaded),
   Presupuestar must NOT silently overwrite the saved budget: catalogue items with a confirmed price, their reference and
   review must not be lost. Real editor (Chromium), synthetic QA catalogue, real S2 «Precios de referencia» flow to set the
   price. The failure is injected only in the page (no product change is needed for the injection). No network, no /api/. */
const test=require('node:test'),assert=require('node:assert/strict');
const K=require('./photo-project/kit.cjs'),{loadPilot}=require('./cat-ia/kit.cjs');
const RB='cat:local:piloto-sintetico-qa:aparador-lumen:roble';
let env;
test.before(async()=>{env=await K.start();});
test.after(async()=>{await env?.stop();});
const toEditor=async page=>{await page.locator('#workArea-design').click().catch(()=>{});await page.locator('#professionalWorkspace').waitFor({state:'hidden'}).catch(()=>{});};
async function openBudget(page){await page.locator('#workArea-budget').click();const b=page.locator('[data-route="budget-edit"]');await b.waitFor();await b.scrollIntoViewIfNeeded();await b.click();await page.locator('#budgetDialog[open]').waitFor();}
const closeBudget=page=>page.evaluate(()=>document.querySelector('#budgetDialog').close());
const saved=page=>page.evaluate(()=>{const all=JSON.parse(localStorage.getItem('rubik-budget-v1')||'{}');return JSON.stringify(all[FloorPlanApp.project.id]||null);});
const item=(doc,id)=>{const b=JSON.parse(doc);return b?.items?.find(i=>i.id===id)||null;};

test('fallo de conciliación CAT-04: Presupuestar no sobrescribe el presupuesto guardado, conserva precio/referencia/revisión, avisa y se recupera',{timeout:300000},async()=>{
 const {context,page}=await K.editor(env);const w=K.watch(page,env.base),api=[];page.on('request',r=>{if(/\/api\//.test(r.url()))api.push(r.url());});
 try{
  await loadPilot(page,false);await toEditor(page);
  const tab=page.locator('#paletteTabFurnish');if(await tab.getAttribute('aria-selected')!=='true')await tab.click();
  await page.locator('#catalogPlaceOpen').click();await page.locator('#catalogDialog[open]').waitFor();
  await page.locator('#catalogList .catalog-item[data-key="aparador-lumen@roble"]').click();await page.locator('#catalogPreview[data-key="aparador-lumen@roble"]').waitFor();
  await page.waitForFunction(()=>!!document.querySelector('#catalogPlaceNote')?.dataset.state);await page.locator('#catalogPlace').click();await page.locator('#catalogDialog').waitFor({state:'hidden'});
  // Confirmed price through the real S2 flow (preview → confirm), then reviewed.
  await openBudget(page);const tr=page.locator(`#budgetDialog tr[data-item="${RB}"]`);await tr.waitFor();
  await tr.locator('.cat04-price').click();await page.locator('#pricesDialog').waitFor();await page.click('#pricesAsPrice');await page.locator('#pricesPreview').waitFor();await page.click('#pricesConfirm');
  await page.waitForFunction(()=>/Cambio aplicado/.test(document.querySelector('#pricesStatus')?.textContent||''));await page.evaluate(()=>document.querySelector('#pricesDialog').close());
  await page.waitForFunction(id=>document.querySelector(`#budgetDialog tr[data-item="${id}"] [data-field="price"]`)?.value==='690',RB);
  await page.evaluate(id=>{const cur=FloorPlanBudgetUI.current().budget;FloorPlanBudgetUI.commit({...cur,items:cur.items.map(i=>i.id===id?{...i,review:{status:'reviewed',reviewedAt:'2026-11-15T18:00:00.000Z'}}:i)});},RB);
  await closeBudget(page);
  const before=await saved(page),it0=item(before,RB);
  assert.deepEqual([it0.unitPrice,it0.priceSource.type,it0.priceReference.code,it0.review.status],[690,'provider-reference','QA-LUMEN-160-RB','reviewed'],'fixture: confirmed and reviewed catalogue price');
  for(const [label,inject] of [['excepción en extraLines',()=>{window.__cat04=window.RubikCat04;window.RubikCat04={...window.__cat04,extraLines(){throw new Error('fallo inyectado de conciliación');}};}],
                               ['módulo CAT-04 no cargado',()=>{window.__cat04=window.RubikCat04;delete window.RubikCat04;}]]){
   await page.evaluate(inject);
   await openBudget(page);
   assert.equal(await saved(page),before,label+': the saved document is NOT overwritten');
   const err=page.locator('#cat04ReconcileError');await err.waitFor();assert.match(await err.innerText(),/No se han podido conciliar|no se ha guardado/i,label+': visible error');
   const cur=await page.evaluate(id=>{const c=FloorPlanBudgetUI.current(),it=c.budget.items.find(i=>i.id===id);return it&&{price:it.unitPrice,ref:it.priceReference?.code,review:it.review.status,src:it.priceSource?.type};},RB);
   assert.deepEqual(cur,{price:690,ref:'QA-LUMEN-160-RB',review:'reviewed',src:'provider-reference'},label+': current() keeps the catalogue item as saved (same figures for assistant/dossier)');
   assert.equal(await page.locator(`#budgetDialog tr[data-item="${RB}"] [data-field="price"]`).inputValue(),'690',label+': row still shown with its price');
   await closeBudget(page);assert.equal(await saved(page),before,label+': closing does not write either');
   await page.evaluate(()=>{window.RubikCat04=window.__cat04;});
  }
  // Recovery: with the module back, Presupuestar reconciles and nothing was lost.
  await openBudget(page);await tr.waitFor();assert.equal(await page.locator('#cat04ReconcileError').count(),0);
  const after=item(await saved(page),RB);assert.deepEqual([after.unitPrice,after.priceReference.code,after.review.status],[690,'QA-LUMEN-160-RB','reviewed']);
  assert.deepEqual(api,[]);assert.deepEqual(w.external,[]);assert.deepEqual(w.errors,[]);
 }finally{await context.close();}
});

// Audit #237 (case 2) in the real editor: studio A («local») has the QA oven placed; a visual reference made with studio
// B's catalogue (SAME catalogue/product/variant ids) and a legacy reference without studio are linked. Presupuestar must
// not show either as «colocado» / «ficha vigente».
test('referencias visuales entre estudios: ids coincidentes no se confunden; sin estudio no se afirma nada (ES/EN)',{timeout:300000},async()=>{
 const {context,page}=await K.editor(env);const w=K.watch(page,env.base);
 try{
  await loadPilot(page,false);await toEditor(page);
  const tab=page.locator('#paletteTabFurnish');if(await tab.getAttribute('aria-selected')!=='true')await tab.click();
  await page.locator('#catalogPlaceOpen').click();await page.locator('#catalogDialog[open]').waitFor();
  await page.locator('#catalogList .catalog-item[data-key="horno-h60@inox"]').click();await page.locator('#catalogPreview[data-key="horno-h60@inox"]').waitFor();
  await page.waitForFunction(()=>!!document.querySelector('#catalogPlaceNote')?.dataset.state);await page.locator('#catalogPlace').click();await page.locator('#catalogDialog').waitFor({state:'hidden'});
  const linked=await page.evaluate(()=>{const V=RubikVisualReform,VR=RubikVisualReferences;
   const req={version:1,mode:'catalog',recipeId:'kitchen-catalog-faithful',recipeVersion:'1.0.0',zone:'appliance',intensity:'faithful',alternatives:1,preserve:['furniture-layout'],mask:[[0.55,0.4,0.2,0.3]],references:[{family:'electrodomesticos',kind:'appliance',sha256:'a'.repeat(64)}]};
   const ref={catalogId:'piloto-sintetico-qa',catalogRevision:1,productId:'horno-h60',variantId:'inox',sku:'QA-H60-INOX',displayName:'Horno integrable H60 inox',family:'electrodomesticos',imageSha256:'a'.repeat(64),license:{scope:['reference-image'],proofRef:'LICENSE.txt'}};
   const ok=V.review({ratios:{inside:.4,outside:0},intensity:'faithful',human:{openingsIntact:true,geometryIntact:true}});
   const mk=sha=>V.resultSheet({source:{kind:'photo',sha256:sha,width:1200,height:900},request:req,references:[ref],result:{kind:'simulated'},review:ok,decision:'accepted',at:'2026-11-15T09:00:00Z'});
   const sB=mk('b'.repeat(64)),sL=mk('c'.repeat(64));
   const r=FloorPlanApp.applyExtension(p=>{VR.link(p,sB,{studioId:'brd-estudio-b'});VR.link(p,sL);return {ok:true,project:p};});return {ok:r?.ok,b:sB.hash,l:sL.hash};});
  assert.equal(linked.ok,true);
  await openBudget(page);const list=page.locator('#cat04VisualList');await list.waitFor();
  const read=h=>page.evaluate(h=>{const li=document.querySelector(`#cat04VisualList li[data-hash="${h}"]`),sm=li?.querySelector('.cat04-vref');return sm&&{text:sm.textContent,placed:sm.dataset.placed,ps:sm.dataset.placedStatus,cs:sm.dataset.catalogStatus};},h);
  const b=await read(linked.b),l=await read(linked.l);
  assert.deepEqual([b.placed,b.ps,b.cs],['false','not-placed','other-studio'],'studio B reference vs studio A placed product');
  assert.match(b.text,/NO colocado/);assert.match(b.text,/ficha de otro estudio/);assert.doesNotMatch(b.text,/ficha vigente|colocado en el proyecto/);
  assert.deepEqual([l.placed,l.ps,l.cs],['false','ambiguous','studio-unknown'],'legacy link without studio');
  assert.match(l.text,/colocación no verificable/);assert.match(l.text,/estudio desconocido/);assert.doesNotMatch(l.text,/ficha vigente|colocado en el proyecto/);
  assert.equal(await page.evaluate(()=>FloorPlanBudgetUI.current().budget.items.filter(i=>i.id.startsWith('cat:')).length),1,'only the placed oven is a budget item; references create none');
  await closeBudget(page);await page.evaluate(()=>{try{setLang('en');}catch{}});await openBudget(page);
  assert.match((await read(linked.b)).text,/sheet of another studio: not checked here/);assert.match((await read(linked.l)).text,/placement cannot be verified/);
  assert.deepEqual(w.external,[]);assert.deepEqual(w.errors,[]);
 }finally{await context.close();}
});
