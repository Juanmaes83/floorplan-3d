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

// F8 · VAT per item. budget-core lets an item carry its own taxRatePercent (overrides the budget's; never null). The only
// way such a document reaches the Presupuestar screen is the public FloorPlanBudgetUI.commit() followed by a redraw of the
// open dialog (here: the user sets the general VAT selector to «No indicado»). The «VAT not set» cause must follow the rate EFFECTIVELY
// applicable to each line, and (F8-C) reopening Presupuestar must keep each item's own rate.
test('F8 escritorio: IVA general vacío pero IVA propio en partidas — la causa del total parcial es la real (ES/EN/ZH)',{timeout:300000},async()=>{
 const {context,page}=await K.editor(env,rec({width:1440,height:900}));const w=K.watch(page,env.base),api=[];page.on('request',r=>{if(/\/api\//.test(r.url()))api.push(r.url());});
 const totals=()=>page.locator('#budgetTotals').innerText(),warns=()=>page.locator('#budgetWarnings').innerText();
 const commitVat=own=>page.evaluate(own=>{const cur=FloorPlanBudgetUI.current().budget;FloorPlanBudgetUI.commit({...cur,taxRatePercent:21,items:cur.items.map((i,k)=>{const p=i.unitPrice===null?FloorPlanBudget.setManualPrice(i,{unitPrice:10,label:'Precio propio'}):i;if(own===null||k<own)return {...p,taxRatePercent:10};const {taxRatePercent,...inherit}=p;return inherit;})});return cur.items.length;},own);// items past `own` explicitly inherit (F8-C keeps earlier own rates)
 const clearGeneralVat=async()=>{const v=page.locator('#budgetVat');await v.selectOption('');await v.dispatchEvent('change');await page.waitForFunction(()=>FloorPlanBudgetUI.budget?.taxRatePercent===null);};
 try{
  await loadPilot(page,false);await toEditor(page);await place(page,'aparador-lumen@roble');await setSheetUnit(page,'ml');
  await openBudget(page);await page.locator(`#budgetDialog tr[data-item="${RB}"]`).waitFor();
  // A · every item has its own 10 % VAT, general VAT emptied; the ONLY cause left is the pending quantity of the ml sheet.
  await commitVat(null);await clearGeneralVat();
  const c=await page.evaluate(()=>{const c=FloorPlanBudget.calculateBudget(FloorPlanBudgetUI.budget);return {nullVat:c.lines.filter(l=>l.effectiveTaxRatePercent===null).length,unpriced:c.totals.unpricedItemIds.length,pending:c.totals.unavailableQuantityItemIds.length};});
  assert.deepEqual(c,{nullVat:0,unpriced:0,pending:1});
  assert.match(await totals(),/Total parcial \(1 con cantidad pendiente\)/);assert.doesNotMatch(await totals(),/IVA sin definir|sin IVA/);
  assert.doesNotMatch(await warns(),/No has indicado el IVA|sin IVA aplicable/);assert.doesNotMatch(await page.locator('#budgetTotals div').nth(1).innerText(),/—/);
  await shot(page,'f8-01-iva-propio-es');
  await page.evaluate(()=>{try{setLang('en');}catch{}});await clearGeneralVat();
  assert.match(await totals(),/Partial total \(1 quantity pending\)/);assert.doesNotMatch(await totals(),/VAT not set|without VAT/);assert.doesNotMatch(await warns(),/You have not set the VAT|applicable VAT/);
  await page.evaluate(()=>{try{setLang('zh');}catch{}});await clearGeneralVat();assert.doesNotMatch(await warns(),/未设置增值税|没有适用的增值税/);
  // A′ · only the first 3 items carry their own VAT: the cause names the items with NO applicable rate, with their count.
  await page.evaluate(()=>{try{setLang('es');}catch{}});const n=await commitVat(3);await clearGeneralVat();const miss=n-3;
  assert.match(await totals(),new RegExp(`Total parcial \\(1 con cantidad pendiente · ${miss} sin IVA\\)`));
  assert.match(await warns(),new RegExp(`${miss} partidas sin IVA aplicable`));assert.doesNotMatch(await warns(),/No has indicado el IVA/);
  await shot(page,'f8-02-iva-parcial-es');
  await page.evaluate(()=>{try{setLang('en');}catch{}});await clearGeneralVat();assert.match(await totals(),new RegExp(`${miss} without VAT`));assert.match(await warns(),new RegExp(`${miss} items without an applicable VAT`));
  await page.evaluate(()=>{try{setLang('zh');}catch{}});await clearGeneralVat();assert.match(await warns(),new RegExp(`${miss} 个条目没有适用的增值税`));
  // F8-C: reopening Presupuestar (load → draft → save) keeps the 3 own rates; the general VAT stays empty, so the cause
  // is still «N items without an applicable VAT», never «You have not set the VAT». The assistant reads the same document.
  await page.evaluate(()=>{try{setLang('es');}catch{}});await closeBudget(page);await openBudget(page);
  assert.equal(await page.evaluate(()=>FloorPlanBudgetUI.current().budget.items.filter(i=>Object.prototype.hasOwnProperty.call(i,'taxRatePercent')&&i.taxRatePercent===10).length),3);
  assert.match(await warns(),new RegExp(`${miss} partidas sin IVA aplicable`));assert.doesNotMatch(await warns(),/No has indicado el IVA/);
  await shot(page,'f8-03-reabrir-conserva-iva-propio');await closeBudget(page);await toEditor(page);
  const a=await ask(page,'¿Por qué el presupuesto está incompleto?');assert.match(a,new RegExp(`IVA sin definir en ${miss} partidas`),a);
  assert.deepEqual(api,[]);assert.deepEqual(w.external,[]);assert.deepEqual(w.errors,[]);
 }finally{await context.close();}
});

// F8-C (P1) · a budget saved with per-item VAT (10 %, 0 % and inherited) is opened in the REAL Presupuestar (load → draft →
// save), edited explicitly (price, general VAT) and reopened: the persisted document and the computed amounts keep every
// own rate and its provenance. Opening without editing must leave the stored budget byte-for-byte identical.
test('F8-C escritorio: presupuesto guardado con IVA por partida — abrir, editar y reabrir sin perder tipos ni importes',{timeout:300000},async()=>{
 const {context,page}=await K.editor(env,rec({width:1440,height:900}));const w=K.watch(page,env.base),api=[];page.on('request',r=>{if(/\/api\//.test(r.url()))api.push(r.url());});
 const stored=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('rubik-budget-v1'))[FloorPlanApp.project.id]);
 const money=b=>page.evaluate(b=>{const c=FloorPlanBudget.calculateBudget(b);return {lines:c.lines.map(l=>[l.id,l.effectiveTaxRatePercent,l.taxAmount,l.subtotalGross]),tax:c.totals.tax.amount,gross:c.totals.gross.amount};},b);
 const vat=b=>Object.fromEntries(b.items.map(i=>[i.id,Object.prototype.hasOwnProperty.call(i,'taxRatePercent')?i.taxRatePercent:'inherit']));
 const cents=t=>t.replace(/[^0-9]/g,'');
 try{
  await toEditor(page);await openBudget(page);await closeBudget(page);
  // A budget saved earlier with its own VAT per item (same validated document Presupuestar writes).
  const seeded=await page.evaluate(()=>{const id=FloorPlanApp.project.id,all=JSON.parse(localStorage.getItem('rubik-budget-v1'));const b=all[id];b.taxRatePercent=21;
   b.items=b.items.map((i,k)=>{const p=i.unitPrice===null?FloorPlanBudget.setManualPrice(i,{unitPrice:10+k,label:'Precio propio'}):i;return k%3===0?{...p,taxRatePercent:10}:k%3===1?{...p,taxRatePercent:0}:p;});
   all[id]=JSON.parse(FloorPlanBudget.serializeBudget(FloorPlanBudget.validateBudget(b)));localStorage.setItem('rubik-budget-v1',JSON.stringify(all));return all[id];});
  const v0=vat(seeded),m0=await money(seeded);assert.ok(Object.values(v0).includes(10)&&Object.values(v0).includes(0)&&Object.values(v0).includes('inherit'));
  // 1 · open without editing → identical document and amounts; the screen shows the same VAT.
  await openBudget(page);const s1=await stored();assert.deepEqual(s1,seeded,'opening Presupuestar must not rewrite the per-item VAT');assert.deepEqual(await money(s1),m0);
  assert.equal(cents(await page.locator('#budgetTotals div').nth(1).locator('dd').innerText()),String(Math.round(m0.tax*100)));
  assert.doesNotMatch(await page.locator('#budgetWarnings').innerText(),/IVA/);
  await shot(page,'f8c-01-abrir-sin-editar');
  // 2 · explicit price edit on an own-10 % item → its rate stays.
  const first=seeded.items[0].id,pr=page.locator(`#budgetDialog tr[data-item="${first}"] [data-field="price"]`);await pr.fill('77');await pr.dispatchEvent('change');
  await page.waitForFunction(id=>JSON.parse(localStorage.getItem('rubik-budget-v1'))[FloorPlanApp.project.id].items.find(i=>i.id===id).unitPrice===77,first);
  assert.deepEqual(vat(await stored()),v0);
  // 3 · general VAT 21 → 4 %: own rates kept, inherited lines follow.
  await page.locator('#budgetVat').selectOption('4');await page.waitForFunction(()=>JSON.parse(localStorage.getItem('rubik-budget-v1'))[FloorPlanApp.project.id].taxRatePercent===4);
  const s3=await stored(),m3=await money(s3);assert.deepEqual(vat(s3),v0);
  for(const [id,eff] of m3.lines)assert.equal(eff,v0[id]==='inherit'?4:v0[id],`line ${id}`);
  // 4 · close and reopen → identical to what was saved; the assistant's source (current()) has the same rates.
  await closeBudget(page);await openBudget(page);const s4=await stored();assert.deepEqual(s4,s3,'reopen keeps the edited document');assert.deepEqual(await money(s4),m3);
  assert.deepEqual(vat(await page.evaluate(()=>FloorPlanBudgetUI.current().budget)),v0);
  await shot(page,'f8c-02-reabrir-tras-editar');
  assert.deepEqual(api,[]);assert.deepEqual(w.external,[]);assert.deepEqual(w.errors,[]);
 }finally{await context.close();}
});
