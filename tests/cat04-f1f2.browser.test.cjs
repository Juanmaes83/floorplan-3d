'use strict';
/* CAT-04 · cross-audit F1/F2/F3/F5/F6 in the REAL editor (Chromium), desktop 1440×900 (ES, then EN/ZH) and phone 390×844
   (EN). A catalogue sheet sold per linear metre gets a manual price of 180 €/m in Presupuestar; then the sheet changes to
   «ud» (new catalogue revision, the way a new import does). What the professional SEES in Presupuestar and what the
   RUBIK V2 assistant ANSWERS (guided mode: its real tools, no provider) must keep 180 €/m, never «180 €/ud», report the
   object count apart and explain an incomplete total by its real cause. No network, no /api/ calls. Optional evidence:
   CAT04_VIDEO / CAT04_SHOTS (scripts/qa/record-cat04.cjs). */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const K=require('./photo-project/kit.cjs'),{loadPilot}=require('./cat-ia/kit.cjs');
const VID=process.env.CAT04_VIDEO||null,rec=size=>VID?{recordVideo:{dir:VID,size}}:{};
const OUT=process.env.CAT04_SHOTS||null,shot=async(page,name)=>{if(!OUT)return;fs.mkdirSync(OUT,{recursive:true});await page.screenshot({path:path.join(OUT,name+'.png')});};
const RB='cat:local:piloto-sintetico-qa:aparador-lumen:roble';
let env;
test.before(async()=>{env=await K.start();});
test.after(async()=>{await env?.stop();});
const toEditor=async page=>{await page.locator('#workArea-design').click().catch(()=>{});await page.locator('#professionalWorkspace').waitFor({state:'hidden'}).catch(()=>{});};
async function openBudget(page,touch=false){const go=l=>touch?l.tap():l.click();await go(page.locator('#workArea-budget'));const b=page.locator('[data-route="budget-edit"]');await b.waitFor();await b.scrollIntoViewIfNeeded();await go(b);await page.locator('#budgetDialog[open]').waitFor();}
const closeBudget=page=>page.evaluate(()=>document.querySelector('#budgetDialog').close());
async function place(page,key){const tab=page.locator('#paletteTabFurnish');if(await tab.getAttribute('aria-selected')!=='true')await tab.click();
 await page.locator('#catalogPlaceOpen').click();await page.locator('#catalogDialog[open]').waitFor();await page.locator(`#catalogList .catalog-item[data-key="${key}"]`).click();await page.locator(`#catalogPreview[data-key="${key}"]`).waitFor();
 await page.waitForFunction(()=>!!document.querySelector('#catalogPlaceNote')?.dataset.state);await page.locator('#catalogPlace').click();await page.locator('#catalogDialog').waitFor({state:'hidden'});}
// New catalogue revision with the oak sideboard sold per «ml» or «ud» (same API the «Mis catálogos» import uses).
const setSheetUnit=(page,unit)=>page.evaluate(unit=>{const C=RubikCatalogProduct,cur=C.getCatalog(localStorage,'local','piloto-sintetico-qa');
 const prod=JSON.parse(JSON.stringify(cur.products.find(p=>p.productId==='aparador-lumen'&&p.variantId==='roble')));prod.commercial.unit=unit;prod.productVersion=(prod.productVersion||1)+1;
 const r=C.importCollection(cur,[prod],{today:'2026-11-15'});C.saveCatalog(localStorage,r.catalog);return {revision:r.catalog.revision,unit:r.catalog.products.find(p=>p.productId==='aparador-lumen'&&p.variantId==='roble').commercial.unit};},unit);
async function ask(page,q){if(!(await page.locator('#assistantPanel:not([hidden])').count()))await page.locator('#assistantOpen').click();await page.waitForSelector('#assistantPanel:not([hidden])');
 await page.fill('#assistantInput',q);await page.click('#assistantSend');await page.waitForFunction(()=>!RubikAssistantUI.state.pending);return page.evaluate(()=>RubikAssistantUI.state.log.at(-1)?.text||'');}

test('F1/F2/F3/F5/F6 escritorio: 180 €/m nunca 180 €/ud; recuento aparte; conflicto de unidad; total parcial por su causa real (ES/EN/ZH)',{timeout:400000},async()=>{
 const {context,page}=await K.editor(env,rec({width:1440,height:900}));const w=K.watch(page,env.base),api=[];page.on('request',r=>{if(/\/api\//.test(r.url()))api.push(r.url());});
 try{
  await loadPilot(page,false);await toEditor(page);await place(page,'aparador-lumen@roble');
  assert.equal((await setSheetUnit(page,'ml')).unit,'ml');
  // Presupuestar: unit of the item = m, quantity pending; F5 header and per-row price unit.
  await openBudget(page);const tr=page.locator(`#budgetDialog tr[data-item="${RB}"]`);await tr.waitFor();
  assert.match(await page.locator('#budgetDialog thead').first().innerText(),/Precio unitario/);assert.doesNotMatch(await page.locator('#budgetDialog').innerText(),/Precio €\/ud/);
  assert.equal(await tr.locator('[data-field="priceUnit"]').innerText(),'€/m');
  await tr.locator('[data-field="price"]').fill('180');await tr.locator('[data-field="price"]').dispatchEvent('change');
  await page.waitForFunction(id=>document.querySelector(`#budgetDialog tr[data-item="${id}"] [data-field="price"]`)?.value==='180',RB);
  await shot(page,'f1f2-01-precio-180-por-m');await closeBudget(page);
  // The sheet changes to «ud» (new revision): XR-01 keeps 180 €/m; F3 → unit-conflict state; F5 per-row unit stays €/m.
  assert.equal((await setSheetUnit(page,'ud')).unit,'ud');
  await openBudget(page);await tr.waitFor();
  const it=await page.evaluate(id=>{const i=FloorPlanBudgetUI.current().budget.items.find(x=>x.id===id);return {unit:i.quantity.unit,value:i.quantity.value,price:i.unitPrice,src:i.priceSource.type};},RB);
  assert.deepEqual(it,{unit:'m',value:null,price:180,src:'manual'},'the price keeps its unit; quantity pending');
  assert.equal(await tr.locator('[data-field="priceUnit"]').innerText(),'€/m');assert.equal(await tr.locator('.cat04-row').getAttribute('data-state'),'unit-conflict');
  assert.match(await tr.locator('.cat04-row').innerText(),/Conflicto de unidad/);
  // F6: commercial pending apart from geometry; F1 (screen): the total is labelled partial with its causes.
  assert.equal(await page.locator('#budgetWarnings li[data-kind="commercial-pending"]').count(),1);
  assert.match(await page.locator('#budgetTotals').innerText(),/Total parcial \(.*1 con cantidad pendiente/);
  await shot(page,'f1f2-02-conflicto-de-unidad');
  // Price every other item so that the ONLY remaining cause is the pending quantity (F1: «0 unpriced» must not appear).
  await page.evaluate(id=>{const cur=FloorPlanBudgetUI.current().budget;FloorPlanBudgetUI.commit({...cur,items:cur.items.map(i=>i.id!==id&&i.unitPrice===null?FloorPlanBudget.setManualPrice(i,{unitPrice:10,label:'Precio propio'}):i)});},RB);
  await page.evaluate(()=>FloorPlanBudgetUI.refresh());assert.equal(await page.evaluate(()=>FloorPlanBudget.calculateBudget(FloorPlanBudgetUI.current().budget).totals.unpricedItemIds.length),0);
  assert.match(await page.locator('#budgetTotals').innerText(),/Total parcial \(1 con cantidad pendiente\)/);assert.doesNotMatch(await page.locator('#budgetTotals').innerText(),/sin precio/);
  await shot(page,'f1f2-03-total-parcial-por-cantidad');await closeBudget(page);await toEditor(page);
  // Assistant (guided: real tools, no provider).
  let a=await ask(page,'¿Cuánto cuesta el QA-LUMEN-160-RB?');
  assert.match(a,/180 EUR\/m\b/);assert.doesNotMatch(a,/180 EUR\/ud|180 EUR(?!\/)/);assert.match(a,/conflicto de unidad: unidad de la ficha \(ud\) distinta de la del precio \(m\)/);assert.match(a,/1 objeto colocado/);assert.match(a,/origen del precio: precio propio/);
  a=await ask(page,'¿Por qué el presupuesto está incompleto?');assert.doesNotMatch(a,/0 partidas? (no tienen?|sin) precio/);assert.match(a,/no por precios/);assert.match(a,/1 partida con la cantidad pendiente de medición/);
  a=await ask(page,'¿Cuánto cuesta?');assert.doesNotMatch(a,/0 de \d+ partidas sin precio/);assert.match(a,/cantidad pendiente de medición/);
  await shot(page,'f1f2-04-asistente-es');
  await page.evaluate(()=>{try{setLang('en');}catch{}});a=await ask(page,'How much does QA-LUMEN-160-RB cost?');assert.match(a,/180 EUR\/m\b/);assert.match(a,/unit conflict/);assert.doesNotMatch(a,/180 EUR\/(ud|unit)/);
  a=await ask(page,'Why is my budget incomplete?');assert.match(a,/not because of prices/);assert.match(a,/1 item with the quantity pending measurement/);
  await page.evaluate(()=>{try{setLang('zh');}catch{}});a=await ask(page,'为什么预算不完整？');assert.match(a,/待测量/);assert.doesNotMatch(a,/0 个条目(没有|无)价格/);
  await shot(page,'f1f2-05-asistente-zh');
  assert.deepEqual(api,[]);assert.deepEqual(w.external,[]);assert.deepEqual(w.errors,[]);
 }finally{await context.close();}
});

test('F1/F2 móvil 390×844 EN: la unidad del precio y la causa del total incompleto se ven en el teléfono sin desbordar',{timeout:300000},async()=>{
 const {context,page}=await K.editor(env,{viewport:{width:390,height:844},isMobile:true,hasTouch:true,...rec({width:390,height:844})});const w=K.watch(page,env.base);
 try{
  await page.evaluate(()=>{try{setLang('en');}catch{}});await loadPilot(page,true);await toEditor(page);
  await page.evaluate(()=>{const d=JSON.parse(JSON.stringify(RubikCatalogProduct.getCatalog(localStorage,'local','piloto-sintetico-qa')));return d.revision;});
  // Place through the same dialog (opened from the palette drawer on the phone).
  if(!(await page.locator('aside.lib.open').count())){await page.locator('#tgLib').tap();await page.locator('aside.lib.open').waitFor();}
  const tab=page.locator('#paletteTabFurnish');if(await tab.getAttribute('aria-selected')!=='true')await tab.tap();
  await page.locator('#catalogPlaceOpen').tap();await page.locator('#catalogDialog[open]').waitFor();await page.locator('#catalogList .catalog-item[data-key="aparador-lumen@roble"]').tap();
  await page.locator('#catalogPreview[data-key="aparador-lumen@roble"]').waitFor();await page.waitForFunction(()=>!!document.querySelector('#catalogPlaceNote')?.dataset.state);await page.locator('#catalogPlace').tap();await page.locator('#catalogDialog').waitFor({state:'hidden'});
  await setSheetUnit(page,'m2');await openBudget(page,true);const tr=page.locator(`#budgetDialog tr[data-item="${RB}"]`);await tr.waitFor();
  await tr.locator('[data-field="price"]').fill('95');await tr.locator('[data-field="price"]').dispatchEvent('change');await page.waitForFunction(id=>document.querySelector(`#budgetDialog tr[data-item="${id}"] [data-field="price"]`)?.value==='95',RB);
  assert.equal(await tr.locator('[data-field="priceUnit"]').innerText(),'€/m²');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'no horizontal overflow');
  await tr.scrollIntoViewIfNeeded();await shot(page,'f1f2-06-movil-precio-por-m2');await closeBudget(page);await toEditor(page);
  if(!(await page.locator('#assistantPanel:not([hidden])').count()))await page.locator('#assistantOpen').tap();await page.waitForSelector('#assistantPanel:not([hidden])');
  await page.fill('#assistantInput','How much does QA-LUMEN-160-RB cost?');await page.locator('#assistantSend').tap();await page.waitForFunction(()=>!RubikAssistantUI.state.pending);
  const a=await page.evaluate(()=>RubikAssistantUI.state.log.at(-1).text);assert.match(a,/95 EUR\/m²/);assert.doesNotMatch(a,/95 EUR\/(ud|unit)/);assert.match(a,/1 object placed \(count, not the economic quantity\)/);
  const box=await page.locator('#assistantPanel').boundingBox();assert.ok(box.x+box.width<=390.5);await shot(page,'f1f2-07-movil-asistente');
  assert.deepEqual(w.external,[]);assert.deepEqual(w.errors,[]);
 }finally{await context.close();}
});
