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
