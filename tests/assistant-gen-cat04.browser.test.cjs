'use strict';
/* REC-238 · Generative Assistant × CAT-04 in the REAL editor (Chromium, desktop and mobile). No external network:
   /api/assistant is replaced by a LABELLED TEST DOUBLE (same contract rubik-assistant/2 as the real gateway; it is not a
   model). What the professional sees: a budget saved with its own per-item VAT (10 %, 0 %, inherited) is opened in
   Presupuestar and kept (F8-C); the model receives each item's own rate apart from the inherited one; an honest answer
   shows no warning; an answer that invents a total is shown WITH the «figures not found» warning; the assistant never
   changes the stored budget. */
const test=require('node:test'),assert=require('node:assert/strict');
const kit=require('./r02a/editor-kit.cjs');
let env;
test.before(async()=>{env=await kit.start();});
test.after(async()=>{await env?.stop();});
async function fakeGateway(page,queue){const seen=[];
 await page.route('**/api/assistant',async route=>{const body=JSON.parse(route.request().postData()||'{}');seen.push(body);
  if(body.action==='status')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({enabled:true,reason:'ok',model:'test-double',priceDate:'2026-11-15',capUsd:0.05,spentUsd:0})});
  const next=queue.shift(),out=typeof next==='function'?await next(body):next||{type:'error',code:'internal',message:'queue empty'};
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({...out,usage:{inputTokens:700,outputTokens:60,costUsd:0.0004,costBasis:'tarifa 2026-11-15',spentUsd:0.0004,capUsd:0.05},model:'test-double'})});});
 return seen;}
const call=name=>({type:'tool_calls',calls:[{id:'call_'+name,name,arguments:'{}'}]});
const lastTool=body=>JSON.parse(body.messages.filter(m=>m.role==='tool').at(-1).content);
async function ask(page,q){await page.fill('#assistantInput',q);await page.click('#assistantSend');await page.waitForFunction(()=>!RubikAssistantUI.state.pending);return page.evaluate(()=>RubikAssistantUI.state.log.at(-1));}
const stored=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('rubik-budget-v1'))[FloorPlanApp.project.id]);
const es=v=>v.toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2});

for(const viewport of [{width:1440,height:900},{width:390,height:844}])test(`IVA por partida en modo IA ${viewport.width}x${viewport.height}: abrir Presupuestar conserva los tipos; el modelo recibe el propio y el heredado; un total inventado se avisa; nada se modifica`,{timeout:240000},async()=>{
 const mobile=viewport.width<1000,{context,page,watch}=await kit.editor(env,{viewport,isMobile:mobile,hasTouch:mobile});
 try{
  await page.evaluate(()=>{FloorPlanBudgetUI.open();document.querySelector('#budgetDialog').close();});
  const seeded=await page.evaluate(()=>{const id=FloorPlanApp.project.id,all=JSON.parse(localStorage.getItem('rubik-budget-v1'));const b=all[id];b.taxRatePercent=21;
   b.items=b.items.map((i,k)=>{const p=i.unitPrice===null?FloorPlanBudget.setManualPrice(i,{unitPrice:10+k,label:'Precio propio'}):i;return k===0?{...p,taxRatePercent:10}:k===1?{...p,taxRatePercent:0}:p;});
   all[id]=JSON.parse(FloorPlanBudget.serializeBudget(FloorPlanBudget.validateBudget(b)));localStorage.setItem('rubik-budget-v1',JSON.stringify(all));return all[id];});
  // Opening Presupuestar (load → draft → save) keeps every own rate (F8-C).
  await page.evaluate(()=>{FloorPlanBudgetUI.open();document.querySelector('#budgetDialog').close();});assert.deepEqual(await stored(page),seeded);
  const tax=await page.evaluate(b=>FloorPlanBudget.calculateBudget(b).totals.tax.amount,seeded),nInh=seeded.items.length-2;
  const seen=await fakeGateway(page,[call('get_budget_summary'),body=>{const v=lastTool(body).data.vat;
    return {type:'message',text:`Dos partidas tienen IVA propio: «${v.ownRateItems[0].description}» el ${v.ownRateItems[0].ratePercent} % y «${v.ownRateItems[1].description}» el ${v.ownRateItems[1].ratePercent} %. Las otras ${v.inheritingItems} partidas heredan el ${v.budgetRatePercent} % general. IVA total: ${es(lastTool(body).data.tax.amount)} EUR.`};},
   call('get_budget_summary'),{type:'message',text:'Todas las partidas llevan el 21 % y el total con IVA es 999,99 EUR.'}]);
  await page.waitForFunction(()=>!!window.RubikAssistantUI&&!!window.RubikAssistantGenUI);await page.locator('#assistantOpen').click();await page.waitForSelector('#assistantPanel:not([hidden])');
  await page.click('#assistantModeGen');await page.waitForFunction(()=>RubikAssistantGenUI.active());await page.check('#assistantConsentQuestion');await page.check('#assistantConsentData');
  let m=await ask(page,'¿Qué IVA lleva cada partida del presupuesto?');
  const vat=lastTool(seen.filter(s=>s.action==='step')[1]).data.vat;
  assert.deepEqual(vat.ownRateItems.map(x=>[x.id,x.ratePercent]),[[seeded.items[0].id,10],[seeded.items[1].id,0]],'the model receives each own rate (0 % is a rate)');
  assert.deepEqual([vat.budgetRatePercent,vat.inheritingItems,vat.withoutRateItems],[21,nInh,[]]);
  assert.match(m.text,new RegExp(`el 10 %.*el 0 %.*Las otras ${nInh} partidas heredan el 21 % general\\. IVA total: ${es(tax).replace('.','\\.')} EUR\\.`));
  assert.doesNotMatch(m.text,/⚠/,'an honest answer carries no warning');
  m=await ask(page,'¿Y el total?');
  assert.match(m.text,/⚠ Cifras que no aparecen en los datos consultados en RUBIK: 999,99/,'an invented total is shown with the warning');
  assert.deepEqual(await stored(page),seeded,'the assistant never changes the stored budget');
  assert.equal(JSON.stringify(seen).includes('"walls"'),false,'the project document is never sent');assert.deepEqual(watch.external,[]);assert.deepEqual(watch.errors,[]);
 }finally{await context.close();}
});
