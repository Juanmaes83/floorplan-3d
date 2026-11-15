// CAT-04 · cross-audit F1/F2 (and F3) — the RUBIK V2 assistant with its REAL tools (assistant-domain-tools-core) and session
// (assistant-session-core), over budgets built with the real engines (budget-draft-core, budget-core, catalog-budget-core,
// cost-catalog-core). No provider, no network.
// F1: an incomplete total must be explained by its REAL cause (unpriced items, quantities pending measurement, tax not
//     set, unreviewed prices) — never «0 items without a price» — and a total that cannot be computed stays amount:null.
// F2: placed products report the ECONOMIC quantity and unit of the budget item (FloorPlanBudget), the object count
//     separately, the unit of the price, its source, its review and any unit conflict: 180 €/m is never «180 €/ud».
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const SE=require('../js/assistant-session-core.js'),T=require('../js/assistant-domain-tools-core.js'),RT=require('../js/assistant-runtime-core.js');
const CB=require('../js/catalog-budget-core.js'),P=require('../js/catalog-placement-core.js'),C=require('../js/catalog-product-core.js');
const D=require('../js/budget-draft-core.js'),B=require('../js/budget-core.js'),Cat=require('../js/cost-catalog-core.js'),Core=require('../js/project-core.js');
const labels={title:'Presupuesto',floor:'Pavimento',skirting:'Rodapié',paint:'Pintura',newWalls:'Tabique',demolition:'Demolición',door:'Puerta',slidingDoor:'Corredera',window:'Ventana',tariff:'Tarifa',chapters:{floors:'P',walls:'W',partitions:'T',carpentry:'C'}};
const PILOT=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/cat-ia/fixtures/pilot-collection.json'),'utf8'));
const RB='cat:local:piloto-sintetico-qa:aparador-lumen:roble';
const catalogWith=(unit,rev)=>{const prods=JSON.parse(JSON.stringify(PILOT));const a=prods.products.find(x=>x.productId==='aparador-lumen'&&x.variantId==='roble');if(unit)a.commercial.unit=unit;
 let c=C.importCollection(C.createCatalog({catalogId:'piloto-sintetico-qa',studioId:'local'}),prods,{today:'2026-11-14'}).catalog;if(rev)c={...c,revision:rev};return c;};
const manual=(budget,id,price)=>B.validateBudget({...budget,items:budget.items.map(i=>i.id===id?B.setManualPrice(i,{unitPrice:price,label:'Precio propio'}):i)});
const priceAll=(budget,price=10)=>B.validateBudget({...budget,items:budget.items.map(i=>i.unitPrice===null?B.setManualPrice(i,{unitPrice:price,label:'Precio propio'}):i)});
function ctxOf({p,budget,cats,lang='es'}){const r=CB.reconcile(p,cats,{studioId:'local',previous:budget}),st=CB.states(budget,r.report);
 return {project:p,budget,budgetSaved:true,lang,labels:{rooms:{},objects:{},materials:{},products:{[RB]:['Aparador Lumen 160 roble','QA-LUMEN-160-RB']},objectProduct:Object.fromEntries(Object.entries(P.links(p).active).map(([o,l])=>[o,P.itemIdOf(l)]))},
  catalog:{studioId:'local',catalogs:cats.map(c=>({catalogId:c.catalogId,name:c.name,revision:c.revision,products:c.products.length})),products:[]},catalogReport:r.report.map((x,i)=>({...x,...st[i]})),visualRefs:[],caps:RT.capabilities({modules:{catalog:true}})};}
const ask=(q,ctx,extra={})=>SE.handle(q,{...ctx,...extra}).messages[1].text;

// ---------- F1 ----------
function f1World(){const p=Core.initial();let budget=priceAll(D.draft(p,{labels}).budget);
 // Every item has a price; ONE quantity is pending measurement (value null) → net and gross not computable.
 const pending=budget.items.find(i=>i.id==='paint');budget=B.validateBudget({...budget,items:budget.items.map(i=>i.id===pending.id?{...i,quantity:{value:null,unit:i.quantity.unit,status:'unavailable',complete:false,source:{type:'manual',label:'Pendiente de medición'}}}:i)});
 return {p,budget,pendingId:pending.id};}
test('F1 · all items priced but a quantity pending: the summary separates the causes, keeps amount:null, and the assistant never says «0 items without a price» (ES/EN/ZH)',()=>{
 const {p,budget,pendingId}=f1World(),c=B.calculateBudget(budget);
 assert.equal(c.totals.unpricedItemIds.length,0);assert.equal(c.totals.net.complete,false,'fixture: total not computable');
 const ctx=ctxOf({p,budget,cats:[]});
 for(const [q,lang,re,cause] of [['¿Por qué el presupuesto está incompleto?','es',/0 partidas? (sin precio|no tienen? precio)/,/cantidad pendiente de medición/],
   ['Why is my budget incomplete?','en',/0 items? (without a price|have no price|has no price)/,/quantity pending measurement/],['为什么预算不完整？','zh',/0 个条目(没有|无)价格/,/待测量/],
   ['¿Cuánto cuesta?','es',/0 de \d+ partidas sin precio/,/cantidad pendiente de medición/],['How much does it cost?','en',/0 of \d+ items without a price/,/quantity pending measurement/]]){
  const t=ask(q,{...ctx,lang});assert.doesNotMatch(t,re,`${lang} «${q}» → ${t}`);assert.match(t,cause,`${lang} «${q}» names the real cause → ${t}`);}
 const s=T.execute('get_budget_summary',{},{project:p,budget,budgetSaved:true,expectedProjectId:p.id}).data;
 assert.equal(s.net.amount,null);assert.equal(s.gross.amount,null);
 assert.deepEqual(s.incomplete.quantityPendingItems.map(x=>x.id),[pendingId]);assert.equal(s.incomplete.unpriced,0);assert.equal(s.incomplete.taxPending,false);
});
test('F1 · tax not set (VAT empty) with every item priced and measured: the cause is the tax, not prices',()=>{
 const p=Core.initial();const budget=B.validateBudget({...priceAll(D.draft(p,{labels}).budget),taxRatePercent:null});const c=B.calculateBudget(budget);
 assert.equal(c.totals.net.complete,true);assert.equal(c.totals.gross.complete,false,'fixture: gross not computable');
 const ctx=ctxOf({p,budget,cats:[]});
 for(const [q,lang,cause] of [['¿Cuánto cuesta?','es',/IVA|impuesto/i],['How much does it cost?','en',/VAT|tax/i],['总共多少钱？','zh',/税/]]){const t=ask(q,{...ctx,lang});
  assert.doesNotMatch(t,/0 (de|of) \d+ (partidas|items)|0 个条目/,t);assert.match(t,cause,t);}
 const s=T.execute('get_budget_summary',{},{project:p,budget,budgetSaved:true,expectedProjectId:p.id}).data;assert.equal(s.incomplete.taxPending,true);assert.equal(s.gross.amount,null);assert.equal(s.net.amount,c.totals.net.amount,'net stays known');
});
test('F1 · a mixed budget lists each cause with its own count; unreviewed prices are named, not mistaken for missing prices',()=>{
 const {p,budget:b0}=f1World();const budget=B.validateBudget({...b0,items:b0.items.map((i,k)=>k===0?{...i,unitPrice:null,priceSource:null,review:{status:'unreviewed',reviewedAt:null}}:i)});
 const t=ask('¿Por qué el presupuesto está incompleto?',ctxOf({p,budget,cats:[]}));assert.match(t,/1 partida no tiene precio/);assert.match(t,/1 partida con la cantidad pendiente de medición/);assert.match(t,/precios? sin revisar/);
 const s=T.execute('get_budget_summary',{},{project:p,budget,budgetSaved:true,expectedProjectId:p.id}).data;assert.equal(s.incomplete.unpriced,1);assert.equal(s.incomplete.quantityPendingItems.length,1);assert.ok(s.incomplete.unreviewedPrices>0);
});

// ---------- F2 / F3 ----------
// A manual price of 180 €/m set while the sheet was sold per linear metre; the sheet now says «ud» (new revision).
function f2World({s2=false}={}){
 const p=Core.initial(),cM=catalogWith('ml');
 for(const o of ['obj_template-029','obj_template-031'])P.attach(p,o,P.linkOf(cM,C.findProduct(cM,'aparador-lumen','roble'),{representation:'generic-volume',fallbackReason:'no-model',asset:null}));
 let r=CB.reconcile(p,[cM],{studioId:'local'});let budget=D.draft(p,{labels,extraLines:r.lines,extraChapters:[{id:'catalog',title:'Productos de mi estudio'}]}).budget;
 if(s2){const q=P.costProvider(()=>[cM]).getPrice(RB).quote;budget=Cat.apply(budget,Cat.previewApply(budget,RB,q),{confirmed:true}).budget;}
 else budget=manual(budget,RB,180);
 const cU=catalogWith(null,2);r=CB.reconcile(p,[cU],{studioId:'local',previous:budget});
 const d=D.draft(p,{labels,previous:budget,extraLines:r.lines,extraChapters:[{id:'catalog',title:'Productos de mi estudio'}]});
 return {p,budget:d.budget,cats:[cU],conflicts:d.unitConflicts};}
test('F2 · placed products take quantity and unit from the BUDGET item; object count apart; price unit, source, review and conflict; 180 €/m never «180 €/ud» (ES/EN/ZH)',()=>{
 const {p,budget,cats,conflicts}=f2World();const it=budget.items.find(i=>i.id===RB);
 assert.deepEqual([it.quantity.unit,it.quantity.value,it.unitPrice],['m',null,180],'XR-01 fixture: price and unit kept, quantity pending');assert.equal(conflicts.length,1);
 const ctx=ctxOf({p,budget,cats});const sel={selection:{kind:'furn',id:'obj_template-029'}};
 for(const [q,lang,bad,good] of [['¿Cuánto cuesta este producto?','es',/180 EUR(?!\/m)|180 EUR\/ud|2 unidades/,/180 EUR\/m\b/],['How much does this product cost?','en',/180 EUR(?!\/m)|180 EUR\/(ud|unit)|2 units/,/180 EUR\/m\b/],['这个产品多少钱？','zh',/180 EUR(?!\/m)|180 EUR\/ud|2 件/,/180 EUR\/m\b/],
   ['¿Cuántas unidades de ese producto he colocado?','es',/: 2 unidades/,/2 objetos colocados/]]){
  const t=ask(q,{...ctx,lang},sel);assert.doesNotMatch(t,bad,`${lang} «${q}» → ${t}`);assert.match(t,good,`${lang} «${q}» → ${t}`);}
 assert.match(ask('¿Cuánto cuesta este producto?',ctx,sel),/unidad de la ficha \(ud\) distinta de la del precio \(m\)/);
 const x=T.execute('get_placed_products',{},{project:p,budget,budgetSaved:true,catalogReport:ctx.catalogReport,expectedProjectId:p.id}).data.products.find(y=>y.itemId===RB);
 assert.equal(x.quantity,null,'economic quantity = budget item (pending), not the object count');assert.equal(x.unit,'m');assert.equal(x.objectCount,2);
 assert.deepEqual([x.price.unitPrice,x.price.unit,x.price.source.type,x.price.reviewed],[180,'m','manual',false]);
 assert.deepEqual(x.unitConflict,{budgetUnit:'m',sheetUnit:'unit'});
});
test('F2 · manual €/m² price with the sheet gone keeps its unit; origin of the price stated; other-studio item never priced from the sheet',()=>{
 const p=Core.initial(),cM2=catalogWith('m2');P.attach(p,'obj_template-029',P.linkOf(cM2,C.findProduct(cM2,'aparador-lumen','roble'),{representation:'generic-volume',fallbackReason:'no-model',asset:null}));
 let r=CB.reconcile(p,[cM2],{studioId:'local'});let budget=manual(D.draft(p,{labels,extraLines:r.lines,extraChapters:[{id:'catalog',title:'P'}]}).budget,RB,95);
 r=CB.reconcile(p,[],{studioId:'local',previous:budget});budget=D.draft(p,{labels,previous:budget,extraLines:r.lines,extraChapters:[{id:'catalog',title:'P'}]}).budget;
 const ctx=ctxOf({p,budget,cats:[]});
 const t=ask('¿Cuánto cuesta este producto?',ctx,{selection:{kind:'furn',id:'obj_template-029'}});assert.match(t,/95 EUR\/m²/);assert.match(t,/precio propio/i);assert.doesNotMatch(t,/95 EUR\/ud/);
 const x=T.execute('get_placed_products',{},{project:p,budget,budgetSaved:true,catalogReport:ctx.catalogReport,expectedProjectId:p.id}).data.products.find(y=>y.itemId===RB);
 assert.deepEqual([x.unit,x.price.unit,x.price.unitPrice,x.quantity,x.objectCount],['m2','m2',95,null,1]);
});
test('F3 · a price applied from S2 whose unit changed is reported as a unit conflict, not as «applied, pending review»',()=>{
 const {p,budget,cats}=f2World({s2:true});const it=budget.items.find(i=>i.id===RB);assert.equal(it.priceSource.type,'provider-reference');assert.equal(it.quantity.unit,'m');
 const ctx=ctxOf({p,budget,cats});const row=ctx.catalogReport.find(r=>r.itemId===RB);assert.equal(row.state,'unit-conflict');
 const t=ask('¿Cuánto cuesta este producto?',ctx,{selection:{kind:'furn',id:'obj_template-029'}});assert.match(t,/conflicto de unidad/i);assert.doesNotMatch(t,/pendiente de revisión/);
});

// ---------- F8 (final cross-audit): VAT per item ----------
// budget-core contract: an item MAY carry its own taxRatePercent (0–100), which overrides the budget's; an item's own
// rate can never be null (rejected by validateItem). The tax cause of an incomplete total must come from the EFFECTIVE
// rate of each line (calculateBudget → line.effectiveTaxRatePercent), not from the global rate alone.
const withVat=(budget,fn)=>B.validateBudget({...budget,items:budget.items.map((i,k)=>{const r=fn(i,k);return r===undefined?i:{...i,taxRatePercent:r};})});
test('F8-A · global VAT null but EVERY item has its own valid VAT: the total is complete; nothing says «VAT not set» (ES/EN/ZH)',()=>{
 const p=Core.initial();const budget=withVat({...priceAll(D.draft(p,{labels}).budget),taxRatePercent:null},()=>10);const c=B.calculateBudget(budget);
 assert.equal(c.totals.gross.complete,true,'contract: per-item VAT makes the gross computable');
 const ctx=ctxOf({p,budget,cats:[]});
 for(const [q,lang] of [['¿Cuánto cuesta?','es'],['How much does it cost?','en'],['总共多少钱？','zh']]){const t=ask(q,{...ctx,lang});assert.doesNotMatch(t,/IVA sin definir|VAT not set|增值税未设定/,t);}
 const s=T.execute('get_budget_summary',{},{project:p,budget,budgetSaved:true,expectedProjectId:p.id}).data;assert.equal(s.incomplete.taxPending,false);assert.equal(s.gross.amount,c.totals.gross.amount);
});
test('F8-A · global VAT null, every item with its own VAT, one quantity pending: the cause is the quantity, NOT the VAT (ES/EN/ZH)',()=>{
 const {p,budget:b0}=f1World();const budget=withVat({...b0,taxRatePercent:null},()=>21);assert.equal(B.calculateBudget(budget).totals.gross.complete,false);
 const ctx=ctxOf({p,budget,cats:[]});
 for(const [q,lang,cause] of [['¿Por qué el presupuesto está incompleto?','es',/cantidad pendiente de medición/],['Why is my budget incomplete?','en',/quantity pending measurement/],['为什么预算不完整？','zh',/待测量/],['¿Cuánto cuesta?','es',/cantidad pendiente de medición/]]){
  const t=ask(q,{...ctx,lang});assert.match(t,cause,t);assert.doesNotMatch(t,/IVA sin definir|VAT not set|增值税未设定/,`${lang} «${q}» must not blame the VAT → ${t}`);}
 assert.equal(T.execute('get_budget_summary',{},{project:p,budget,budgetSaved:true,expectedProjectId:p.id}).data.incomplete.taxPending,false);
});
test('F8-A · global VAT null and only SOME items with their own VAT: the VAT cause counts the items without an applicable rate (ES/EN/ZH)',()=>{
 const p=Core.initial();const b0={...priceAll(D.draft(p,{labels}).budget),taxRatePercent:null};const budget=withVat(b0,(i,k)=>k<3?10:undefined);
 const c=B.calculateBudget(budget),missing=c.lines.filter(l=>l.effectiveTaxRatePercent===null).length;assert.ok(missing>0&&missing<c.lines.length);
 const s=T.execute('get_budget_summary',{},{project:p,budget,budgetSaved:true,expectedProjectId:p.id}).data;assert.equal(s.incomplete.taxPending,true);assert.equal(s.incomplete.taxMissingItems,missing);
 const ctx=ctxOf({p,budget,cats:[]});
 for(const [q,lang,re] of [['¿Cuánto cuesta?','es',new RegExp(`IVA sin definir en ${missing} partidas`)],['How much does it cost?','en',new RegExp(`VAT not set on ${missing} items`)],['总共多少钱？','zh',new RegExp(`${missing} 个条目增值税未设定`)]])assert.match(ask(q,{...ctx,lang}),re);
});
test('F8-B · an item VAT explicitly null is NOT a valid budget (contract): it is rejected, never summarised as if it were valid',()=>{
 const p=Core.initial();const ok=priceAll(D.draft(p,{labels}).budget);const bad={...ok,taxRatePercent:21,items:ok.items.map((i,k)=>k===0?{...i,taxRatePercent:null}:i)};
 assert.throws(()=>B.validateBudget(bad),/item\.taxRatePercent must be between 0 and 100/);assert.throws(()=>B.calculateBudget(bad),/item\.taxRatePercent/);
 const r=T.execute('get_budget_summary',{},{project:p,budget:bad,budgetSaved:true,expectedProjectId:p.id});assert.equal(r.ok,false,'no summary is fabricated from an invalid budget');
});

// ---------- F8-C (P1): per-item VAT must never be lost silently ----------
// Presupuestar rebuilds its document with draft() each time it opens (load) and saves it (save). An item's own VAT is
// economic data: it must survive draft(), load(), open(), explicit edits, save and reopen, with its provenance (own rate
// stays own; an inherited rate stays inherited and follows the general one). An unedited budget must come back identical.
const own=i=>Object.prototype.hasOwnProperty.call(i,'taxRatePercent');
const vatMap=b=>Object.fromEntries(b.items.map(i=>[i.id,own(i)?i.taxRatePercent:'inherit']));
const money=b=>{const c=B.calculateBudget(b);return {lines:c.lines.map(l=>[l.id,l.effectiveTaxRatePercent,l.taxAmount,l.subtotalGross]),tax:c.totals.tax.amount,gross:c.totals.gross.amount,complete:c.totals.gross.complete};};
const store=b=>JSON.parse(B.serializeBudget(b));
test('F8-C · a saved budget with per-item VAT (10 %, 0 % and inherited) opened WITHOUT editing keeps every rate, its provenance and its amounts; document identical',()=>{
 const p=Core.initial();const saved=store(withVat({...priceAll(D.draft(p,{labels}).budget),taxRatePercent:21},(i,k)=>k%3===0?10:k%3===1?0:undefined));
 const v0=vatMap(saved),m0=money(saved);assert.ok(Object.values(v0).includes(0)&&Object.values(v0).includes(10)&&Object.values(v0).includes('inherit'),'fixture mixes 10 %, 0 % and inherited');
 const once=store(D.draft(p,{labels,previous:saved}).budget),twice=store(D.draft(p,{labels,previous:once}).budget);
 assert.deepEqual(vatMap(once),v0,'open #1 keeps own rates and inherited ones');assert.deepEqual(money(once),m0,'open #1 keeps the computed amounts');
 assert.deepEqual(once,saved,'an unedited budget comes back identical (load → save)');assert.deepEqual(twice,saved,'and stays identical on reopen');
 // The assistant reads the same figures.
 const sum=b=>{const d=T.execute('get_budget_summary',{},{project:p,budget:b,budgetSaved:true,expectedProjectId:p.id}).data;return [d.tax.amount,d.gross.amount,d.incomplete.taxPending];};
 assert.deepEqual(sum(once),sum(saved));
});
test('F8-C · explicit edits (price, waste, general VAT) keep each item\'s own VAT; inherited lines follow the general rate; save and reopen',()=>{
 const p=Core.initial();let b=store(withVat({...priceAll(D.draft(p,{labels}).budget),taxRatePercent:21},(i,k)=>k===0?10:k===1?0:undefined));
 const [a,z,inh]=b.items.map(i=>i.id);
 b=B.validateBudget({...b,taxRatePercent:4,items:b.items.map(i=>i.id===a?B.setManualPrice(i,{unitPrice:33,label:'Precio propio'}):i.id===z?{...i,wastePercent:7}:i)});
 const re=D.draft(p,{labels,previous:store(b)}).budget,c=B.calculateBudget(re),line=id=>c.lines.find(l=>l.id===id);
 assert.equal(re.items.find(i=>i.id===a).unitPrice,33);assert.equal(re.items.find(i=>i.id===z).wastePercent,7);
 assert.deepEqual([line(a).effectiveTaxRatePercent,line(z).effectiveTaxRatePercent,line(inh).effectiveTaxRatePercent],[10,0,4],'own 10 % and own 0 % kept; inherited follows the new general 4 %');
 assert.equal(line(z).taxAmount,0,'an own 0 % VAT is a rate, not a missing value');assert.equal(own(re.items.find(i=>i.id===inh)),false,'an inherited rate is never turned into an own one');
 assert.deepEqual(money(re),money(b),'amounts after save + reopen = amounts of the edited budget');
});
test('F8-C · catalogue item with its own VAT keeps it through reconciliation, a unit conflict (XR-01) and retention at 0 ud',()=>{
 const p=Core.initial(),cM=catalogWith('ml');for(const o of ['obj_template-029','obj_template-031'])P.attach(p,o,P.linkOf(cM,C.findProduct(cM,'aparador-lumen','roble'),{representation:'generic-volume',fallbackReason:'no-model',asset:null}));
 const ex=(r)=>({extraLines:r.lines,extraChapters:[{id:'catalog',title:'P'}]});
 let r=CB.reconcile(p,[cM],{studioId:'local'});let b=manual(D.draft(p,{labels,...ex(r)}).budget,RB,180);b=B.validateBudget({...b,items:b.items.map(i=>i.id===RB?{...i,taxRatePercent:4}:i)});
 const cU=catalogWith(null,2);r=CB.reconcile(p,[cU],{studioId:'local',previous:b});const d=D.draft(p,{labels,previous:store(b),...ex(r)});
 assert.equal(d.unitConflicts.length,1);const it=d.budget.items.find(i=>i.id===RB);assert.deepEqual([it.unitPrice,it.quantity.unit,it.taxRatePercent],[180,'m',4],'unit conflict keeps price, unit AND own VAT');
 p.objects=p.objects.filter(o=>!['obj_template-029','obj_template-031'].includes(o.id));// both placed objects deleted
 const r2=CB.reconcile(p,[cU],{studioId:'local',previous:d.budget}),kept=D.draft(p,{labels,previous:store(d.budget),...ex(r2)}).budget.items.find(i=>i.id===RB);
 assert.ok(kept,'priced item retained');assert.equal(kept.taxRatePercent,4,'retained item keeps its own VAT');
});
