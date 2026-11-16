// REC-238 · Generative Assistant × CAT-04 economic contracts. The model is a labelled TEST DOUBLE (scriptedAdapter): it
// is NOT a real model and nothing leaves the machine (no OpenAI, no network, no spend). What these tests prove is what
// RUBIK guarantees around ANY model: (1) the CAT-04 tools hand the model the right economic data (unit of the price,
// unit conflict, pending quantity, each cause of an incomplete total, the VAT rate of each item with its provenance,
// the studio and catalogue status of a visual reference); (2) the project and the budget are never mutated; (3) a figure
// the model makes up — an amount, a per-unit price in another unit, an object count turned into metres — is flagged as
// NOT verified and shown with a warning. Claims WITHOUT figures (e.g. «commercially verified») are only governed by the
// policy and the tool limitations: declared limits, measured below, never presented as verified.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const A=require('../js/assistant-agent-core.js'),RT=require('../js/assistant-runtime-core.js');
const CB=require('../js/catalog-budget-core.js'),P=require('../js/catalog-placement-core.js'),C=require('../js/catalog-product-core.js');
const D=require('../js/budget-draft-core.js'),B=require('../js/budget-core.js'),Core=require('../js/project-core.js');
const VR=require('../js/visual-reference-core.js'),V=require('../js/visual-reform-core.js');
const labels={title:'Presupuesto',floor:'Pavimento',skirting:'Rodapié',paint:'Pintura',newWalls:'Tabique',demolition:'Demolición',door:'Puerta',slidingDoor:'Corredera',window:'Ventana',tariff:'Tarifa',chapters:{floors:'P',walls:'W',partitions:'T',carpentry:'C'}};
const PILOT=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/cat-ia/fixtures/pilot-collection.json'),'utf8'));
const RB='cat:local:piloto-sintetico-qa:aparador-lumen:roble',EX={id:'catalog',title:'Productos de mi estudio'};
const consent={question:true,projectData:true};
const call=(name,args={},id='call_1')=>({type:'tool_calls',calls:[{id,name,arguments:JSON.stringify(args)}],usage:{inputTokens:400,outputTokens:30,costUsd:0.0002}});
const say=text=>({type:'message',text,usage:{inputTokens:700,outputTokens:80,costUsd:0.0004}});
const es=v=>v.toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2}),en=v=>v.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const catalogWith=(unit,rev,studioId='local')=>{const prods=JSON.parse(JSON.stringify(PILOT));const a=prods.products.find(x=>x.productId==='aparador-lumen'&&x.variantId==='roble');if(unit)a.commercial.unit=unit;
 let c=C.importCollection(C.createCatalog({catalogId:'piloto-sintetico-qa',studioId}),prods,{today:'2026-11-14'}).catalog;if(rev)c={...c,revision:rev};return c;};
const manual=(budget,id,price)=>B.validateBudget({...budget,items:budget.items.map(i=>i.id===id?B.setManualPrice(i,{unitPrice:price,label:'Precio propio'}):i)});
const priceAll=(budget,price=10)=>B.validateBudget({...budget,items:budget.items.map(i=>i.unitPrice===null?B.setManualPrice(i,{unitPrice:price,label:'Precio propio'}):i)});
const store=b=>JSON.parse(B.serializeBudget(b));
function ctxOf({p,budget,cats=[],visualRefs=[],lang='es'}){const r=CB.reconcile(p,cats,{studioId:'local',previous:budget}),st=CB.states(budget,r.report);
 return {project:p,budget,budgetSaved:true,area:'budget',lang,catalog:{studioId:'local',catalogs:cats.map(c=>({catalogId:c.catalogId,name:c.name,revision:c.revision,products:c.products.length})),products:[]},
  catalogReport:r.report.map((x,i)=>({...x,...st[i]})),visualRefs,caps:RT.capabilities({modules:{catalog:true}})};}
// What the model actually received from a tool (the compacted message), parsed back.
const seen=(r,tool)=>r.history.filter(m=>m.role==='tool'&&m.name===tool).map(m=>JSON.parse(m.content));
const turn=async(ctx,tool,text,question='¿Cómo está el presupuesto?')=>{const snap=[JSON.stringify(ctx.project),JSON.stringify(ctx.budget)];
 const r=await A.runTurn({question,ctx,consent,adapter:A.scriptedAdapter([call(tool),say(text)])});
 assert.equal(r.ok,true,JSON.stringify(r.error));assert.deepEqual([JSON.stringify(ctx.project),JSON.stringify(ctx.budget)],snap,'the project and the budget are never mutated by a turn');return r;};

// ---------- 1 · manual 180 €/m while the current sheet sells per unit (XR-01 / F2 / F3) ----------
function conflictWorld(){const p=Core.initial(),cM=catalogWith('ml');
 for(const o of ['obj_template-029','obj_template-031'])P.attach(p,o,P.linkOf(cM,C.findProduct(cM,'aparador-lumen','roble'),{representation:'generic-volume',fallbackReason:'no-model',asset:null}));
 let r=CB.reconcile(p,[cM],{studioId:'local'});let budget=manual(D.draft(p,{labels,extraLines:r.lines,extraChapters:[EX]}).budget,RB,180);
 const cU=catalogWith(null,2);r=CB.reconcile(p,[cU],{studioId:'local',previous:budget});
 const d=D.draft(p,{labels,previous:budget,extraLines:r.lines,extraChapters:[EX]});return {p,budget:d.budget,cats:[cU],conflicts:d.unitConflicts};}
test('GEN×CAT-04 · 1 · 180 €/m vs a sheet now sold per unit: the model gets the economic unit, the conflict and NO subtotal; an honest answer is grounded; «180 €/ud» and an invented subtotal are flagged (ES/EN/ZH)',async()=>{
 const w=conflictWorld(),ctx=ctxOf(w);assert.equal(w.conflicts.length,1,'fixture: XR-01 unit conflict');
 const r=await turn(ctx,'get_placed_products','El Aparador Lumen 160 roble tiene tu precio propio de 180 EUR/m, sin revisar. La ficha actual se vende por unidad: hay un conflicto de unidad y no hay subtotal hasta que midas los metros. Hay 2 objetos colocados.','¿Cuánto cuesta el aparador?');
 const x=seen(r,'get_placed_products')[0].data.products.find(y=>y.itemId===RB);
 assert.deepEqual([x.price.unitPrice,x.price.unit,x.unit,x.quantity,x.subtotalNet,x.objectCount,x.quantitySource],[180,'m','m',null,null,2,'budget-item'],'economic unit = the budget item, quantity unknown, no subtotal, object count apart');
 assert.deepEqual(x.unitConflict,{budgetUnit:'m',sheetUnit:'unit'});
 assert.match(seen(r,'get_placed_products')[0].limitations.join(' '),/nunca se convierte entre unidades/,'the limitation travels to the model');
 assert.equal(r.answer.grounded,true,JSON.stringify(r.answer));
 for(const [lang,text,bad] of [['es','Cuesta 180 EUR/ud; con 2 unidades son 360 EUR.',['180','360']],['en','It costs 180 EUR/unit; 2 units make 360 EUR.',['180','360']],['zh','价格为 180 欧元/件，2 件共 360 欧元。',['180','360']]]){
  const a=(await turn({...ctx,lang},'get_placed_products',text)).answer;
  assert.equal(a.grounded,false,`${lang}: ${text}`);for(const t of bad)assert.ok(a.unverifiedAmounts.includes(t),`${lang}: «${t}» flagged as an unverified amount → ${JSON.stringify(a)}`);}
});

// ---------- 2 · unknown quantity: an object count is never metres, nothing is priced from it ----------
test('GEN×CAT-04 · 2 · unknown quantity: «2 objects» is not «2 m»; an amount computed from the object count is flagged; the honest answer is grounded (ES/EN/ZH)',async()=>{
 const w=conflictWorld(),ctx=ctxOf(w);
 const r=await turn(ctx,'get_placed_products','Hay 2 objetos colocados del aparador; la cantidad en metros está pendiente de medición, así que no hay importe.');
 assert.equal(r.answer.grounded,true,JSON.stringify(r.answer));
 const x=seen(r,'get_placed_products')[0].data.products.find(y=>y.itemId===RB);assert.deepEqual([x.quantity,x.quantityComplete,x.objectCount],[null,false,2]);
 for(const [lang,text] of [['es','Has colocado 2 m de aparador: a 180 EUR/m son 360 EUR.'],['en','You placed 2 m of sideboard: at 180 EUR/m that is 360 EUR.'],['zh','你放置了 2 米的餐边柜：按 180 欧元/米 共 360 欧元。']]){
  const a=(await turn({...ctx,lang},'get_placed_products',text)).answer;
  assert.equal(a.grounded,false,`${lang}: ${text}`);assert.ok(a.unverified.includes('2'),`${lang}: the object count presented as metres is flagged → ${JSON.stringify(a)}`);
  assert.ok(a.unverifiedAmounts.includes('360'),`${lang}: the invented amount is flagged`);assert.equal(a.unverifiedAmounts.includes('180'),false,`${lang}: 180 €/m is the real price in its own unit`);}
});

// ---------- 3 · incomplete budget: each cause apart ----------
test('GEN×CAT-04 · 3 · incomplete budget: the model receives each cause apart (no price, pending quantity, unreviewed price, VAT not set) with counts; an invented total is flagged',async()=>{
 const p=Core.initial();let b=priceAll(D.draft(p,{labels}).budget);const [noPrice,pending,ownVat]=b.items.map(i=>i.id);
 b=B.validateBudget({...b,taxRatePercent:null,items:b.items.map(i=>i.id===noPrice?{...i,unitPrice:null,priceSource:null,review:{status:'unreviewed',reviewedAt:null}}
  :i.id===pending?{...i,quantity:{value:null,unit:i.quantity.unit,status:'unavailable',complete:false,source:{type:'manual',label:'Pendiente de medición'}}}:i.id===ownVat?{...i,taxRatePercent:10}:i)});
 const c=B.calculateBudget(b),ctx=ctxOf({p,budget:b}),noVat=c.lines.filter(l=>l.effectiveTaxRatePercent===null).length,unrev=c.totals.unreviewedPriceItemIds.length;
 assert.ok(noVat>1&&noVat<c.lines.length,'fixture: VAT missing on some items only (one has its own 10 %)');
 const r=await turn(ctx,'get_budget_summary',`Está incompleto por cuatro causas: 1 partida sin precio, 1 partida con la cantidad pendiente de medición, ${noVat} partidas sin IVA aplicable y ${unrev} precios sin revisar. No hay total.`);
 const s=seen(r,'get_budget_summary')[0].data;
 assert.deepEqual([s.incomplete.unpriced,s.incomplete.quantityPending,s.incomplete.taxPending,s.incomplete.taxMissingItems,s.incomplete.unreviewedPrices],[1,1,true,noVat,unrev]);
 assert.equal(s.gross.amount,null,'a partial total is never handed over as the total');assert.equal(r.answer.grounded,true,JSON.stringify(r.answer));
 for(const text of ['El total es 12.400 EUR.','The total is 12,400 EUR.','总价为 12.400 欧元。']){const a=(await turn(ctx,'get_budget_summary',text)).answer;assert.equal(a.grounded,false,text);assert.equal(a.unverifiedAmounts.length,1,text);}
});

// ---------- 4 · per-item VAT 10 % / 0 % kept through open, edit and reopen; own told apart from inherited ----------
const withVat=(budget,fn)=>B.validateBudget({...budget,items:budget.items.map((i,k)=>{const r=fn(i,k);return r===undefined?i:{...i,taxRatePercent:r};})});
test('GEN×CAT-04 · 4 · per-item VAT 10 % and 0 %: after open, edit and reopen the model sees each OWN rate apart from the inherited one, with the same amounts as Presupuestar (ES/EN/ZH)',async()=>{
 const p=Core.initial();const saved=store(withVat({...priceAll(D.draft(p,{labels}).budget),taxRatePercent:21},(i,k)=>k===0?10:k===1?0:undefined));
 const [a,z]=saved.items.map(i=>i.id),nInh=saved.items.length-2;
 const check=async(b,general,lang,text)=>{const c=B.calculateBudget(b),r=await turn(ctxOf({p,budget:b,lang}),'get_budget_summary',text(c));const v=seen(r,'get_budget_summary')[0].data.vat;
  assert.ok(v,'the summary carries the VAT of each item');assert.equal(v.budgetRatePercent,general);
  assert.deepEqual(v.ownRateItems.map(x=>[x.id,x.ratePercent]),[[a,10],[z,0]],'own rates with their item (0 % is a rate, not a missing value)');
  assert.equal(v.inheritingItems,nInh,'the rest inherit the general rate');assert.deepEqual(v.withoutRateItems,[]);
  assert.equal(seen(r,'get_budget_summary')[0].data.tax.amount,c.totals.tax.amount,'same tax as calculateBudget');
  assert.equal(r.answer.grounded,true,JSON.stringify(r.answer));return c;};
 // open without editing (load → draft → save)
 const opened=store(D.draft(p,{labels,previous:saved}).budget);assert.deepEqual(opened,saved,'F8-C: opening keeps the document');
 await check(opened,21,'es',c=>`Dos partidas tienen IVA propio: una el 10 % y otra el 0 %; las otras ${nInh} partidas heredan el 21 % general. IVA total: ${es(c.totals.tax.amount)} EUR.`);
 // explicit edit: price of the own-10 % item and the general rate 21 → 4; then reopen
 const edited=B.validateBudget({...opened,taxRatePercent:4,items:opened.items.map(i=>i.id===a?B.setManualPrice(i,{unitPrice:33,label:'Precio propio'}):i)});
 const reopened=store(D.draft(p,{labels,previous:store(edited)}).budget);
 await check(reopened,4,'en',c=>`Two items keep their own VAT (10 % and 0 %); the other ${nInh} items inherit the general 4 %. Total VAT: ${en(c.totals.tax.amount)} EUR.`);
 await check(reopened,4,'zh',c=>`两个条目保留自有增值税（10 % 和 0 %），其余 ${nInh} 项 继承 4 % 的总税率。增值税合计 ${es(c.totals.tax.amount)} 欧元。`);
});
test('GEN×CAT-04 · 4b · a placed catalogue product with its own VAT: the model sees the rate and that it is the item\'s own, through a unit conflict',async()=>{
 const p=Core.initial(),cM=catalogWith('ml');for(const o of ['obj_template-029','obj_template-031'])P.attach(p,o,P.linkOf(cM,C.findProduct(cM,'aparador-lumen','roble'),{representation:'generic-volume',fallbackReason:'no-model',asset:null}));
 let r0=CB.reconcile(p,[cM],{studioId:'local'});let b=manual(D.draft(p,{labels,extraLines:r0.lines,extraChapters:[EX]}).budget,RB,180);b=B.validateBudget({...b,items:b.items.map(i=>i.id===RB?{...i,taxRatePercent:4}:i)});
 const cU=catalogWith(null,2);r0=CB.reconcile(p,[cU],{studioId:'local',previous:b});const budget=D.draft(p,{labels,previous:store(b),extraLines:r0.lines,extraChapters:[EX]}).budget;
 const r=await turn(ctxOf({p,budget,cats:[cU]}),'get_placed_products','El aparador lleva su IVA propio del 4 %.');
 const x=seen(r,'get_placed_products')[0].data.products.find(y=>y.itemId===RB);assert.deepEqual(x.vat,{ratePercent:4,source:'item'});
 assert.equal(r.answer.grounded,true,JSON.stringify(r.answer));
 // The general rate is not in this tool's result: a model that states it is flagged (it must look it up).
 assert.deepEqual((await turn(ctxOf({p,budget,cats:[cU]}),'get_placed_products','El aparador lleva el 4 %; el general es del 21 %.')).answer.unverified,['21']);
 // Without its own rate the same product inherits the general one, and says so.
 const inh=B.validateBudget({...budget,items:budget.items.map(i=>{if(i.id!==RB)return i;const {taxRatePercent,...rest}=i;return rest;})});
 const y=seen(await turn(ctxOf({p,budget:inh,cats:[cU]}),'get_placed_products','Hereda el IVA general.'),'get_placed_products')[0].data.products.find(z=>z.itemId===RB);
 assert.deepEqual(y.vat,{ratePercent:21,source:'budget'});
});

// ---------- 5 · visual references of another studio or of an unknown studio ----------
const SHA='a'.repeat(64),SHA2='b'.repeat(64);
const req={version:1,mode:'catalog',recipeId:'kitchen-catalog-faithful',recipeVersion:'1.0.0',zone:'appliance',intensity:'faithful',alternatives:1,preserve:['furniture-layout'],mask:[[0.55,0.4,0.2,0.3]],references:[{family:'electrodomesticos',kind:'appliance',sha256:SHA}]};
const vref={catalogId:'piloto-sintetico-qa',catalogRevision:1,productId:'horno-h60',variantId:'inox',sku:'QA-H60-INOX',displayName:'Horno integrable H60 inox',family:'electrodomesticos',imageSha256:SHA,license:{scope:['reference-image'],proofRef:'LICENSE.txt'}};
const sheet=()=>V.resultSheet({source:{kind:'photo',sha256:SHA2,width:1200,height:900},request:req,references:[vref],result:{kind:'simulated'},review:V.review({ratios:{inside:.4,outside:0},intensity:'faithful',human:{openingsIntact:true,geometryIntact:true}}),decision:'accepted',at:'2026-11-15T09:00:00Z'});
test('GEN×CAT-04 · 5 · visual references of ANOTHER studio and of an UNKNOWN studio reach the model as such, never with an amount; the limitation says «verified» is only the visual fingerprint',async()=>{
 const cA=catalogWith(null,null,'local');const p=Core.initial();P.attach(p,'obj_template-023',P.linkOf(cA,C.findProduct(cA,'horno-h60','inox'),{representation:'generic-volume',fallbackReason:'no-model',asset:null}));
 VR.link(p,sheet(),{studioId:'brd-estudio-b'});const q=Core.initial();VR.link(q,sheet());
 const budget=D.draft(p,{labels}).budget;
 for(const [proj,visualRefs,status,studio] of [[p,VR.list(p,{catalogs:[cA],studioId:'local'}),'other-studio','brd-estudio-b'],[q,VR.list(q,{catalogs:[cA],studioId:'local'}),'studio-unknown',null]]){
  const r=await turn(ctxOf({p:proj,budget:{...budget,subject:{type:'project',id:proj.id}},visualRefs}),'get_visual_references','Es una referencia visual de otro estudio o de estudio desconocido: no está verificada comercialmente ni es un precio.','¿Este horno está verificado?');
  const got=seen(r,'get_visual_references')[0],x=got.data.references[0].references[0];
  assert.deepEqual([x.catalogStatus,x.studioId,x.placed],[status,studio,false]);
  assert.equal(JSON.stringify(got.data).match(/"(unitPrice|amount|price|subtotal\w*|total\w*)"/),null,'no amount travels with a visual reference');
  assert.match(got.limitations.join(' '),/«verified» se refiere solo a la huella visual/);assert.equal(r.answer.grounded,true);
  // LÍMITE DECLARADO (no comportamiento deseado): una afirmación SIN cifras («verificado comercialmente») no la detecta la
  // comprobación de cifras; la gobiernan la política del sistema y la limitación de la herramienta. Debe medirse con un
  // modelo real (piloto #239, sin autorizar). La interfaz nunca la presenta como verificada: comprobación «parcial».
  const lie=(await turn(ctxOf({p:proj,budget:{...budget,subject:{type:'project',id:proj.id}},visualRefs}),'get_visual_references','Sí, el horno está verificado comercialmente.')).answer;
  assert.equal(lie.grounded,true,'known limitation: claims without figures are not checked');assert.equal(lie.check,'partial');assert.match(lie.limits.join(' '),/no verifica afirmaciones sin cifras/);}
 assert.match(A.SYSTEM_POLICY,/A visual reference or simulation never certifies a product, a measure or a price/);
});
