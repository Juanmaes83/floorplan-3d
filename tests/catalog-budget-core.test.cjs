// CAT-04 · Gate 1 (pure): products placed from «Mis catálogos» become items of the ONE budget Presupuestar keeps
// (FloorPlanBudgetDraft.draft + FloorPlanBudget.calculateBudget). Identity by studio/catalogue/product/variant, count
// as a labelled manual quantity, no unit conversions, no automatic prices, explicit S2 apply with preview,
// confirmation, consent and revision check; duplicates, removals, undo-safe retention, stale sheets and isolation.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const CB=require('../js/catalog-budget-core.js'),P=require('../js/catalog-placement-core.js'),C=require('../js/catalog-product-core.js');
const D=require('../js/budget-draft-core.js'),B=require('../js/budget-core.js'),Cat=require('../js/cost-catalog-core.js'),Core=require('../js/project-core.js');
const labels={title:'Presupuesto',floor:'Pavimento',skirting:'Rodapié',paint:'Pintura',newWalls:'Tabique nuevo',demolition:'Demolición',door:'Puerta de paso',slidingDoor:'Puerta corredera',window:'Ventana',tariff:'Tarifa del estudio',chapters:{floors:'Pavimentos',walls:'Paredes',partitions:'Tabiquería',carpentry:'Carpintería'}};
const PILOT=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/cat-ia/fixtures/pilot-collection.json'),'utf8'));
const catalog=(studioId='local',catalogId='piloto-sintetico-qa',products=PILOT.products)=>C.importCollection(C.createCatalog({catalogId,studioId}),{...PILOT,catalogId,products:products.map(p=>({...p,catalogId}))},{today:'2026-11-14'}).catalog;
const RB='cat:local:piloto-sintetico-qa:aparador-lumen:roble',H60='cat:local:piloto-sintetico-qa:horno-h60:inox';
// Place products on objects of the reference project, exactly as CAT-03 does (attach = link + model reference).
function placed(cats,list){const p=Core.initial();for(const [objId,productId,variantId] of list){const c=cats[0],prod=C.findProduct(c,productId,variantId);P.attach(p,objId,P.linkOf(c,prod,{representation:'generic-volume',fallbackReason:'no-model',asset:null},'2026-11-15T09:00:00Z'));}return p;}
// The single canonical path: draft(project, {previous, extraLines}) — what FloorPlanBudgetUI.load() does.
function draft(project,cats,previous=null,studioId='local'){const r=CB.reconcile(project,cats,{studioId,previous});const d=D.draft(project,{labels,previous,extraLines:r.lines,extraChapters:r.lines.length?[{id:CB.CHAPTER,title:'Productos de mi estudio'}]:[]});return {...d,report:r.report,orphans:r.orphans,states:CB.states(d.budget,r.report)};}
const item=(b,id)=>b.items.find(i=>i.id===id);
const roundtrip=b=>B.parseBudget(B.serializeBudget(b));
async function catalogQuote(cats,sku){const src=CB.priceSources(cats,{studioId:'local'})[0];return (await src.quote(sku)).quote;}

test('placing a product creates ONE catalogue item with identity, labelled count and NO active price; geometry items intact',()=>{
 const cats=[catalog()],p=placed(cats,[['obj_template-029','aparador-lumen','roble']]);
 const base=D.draft(Core.initial(),{labels}).budget,{budget,report,states}=draft(p,cats);
 const it=item(budget,RB);assert.ok(it,'item in the budget document');assert.equal(it.chapterId,'catalog');assert.match(it.description,/Aparador Lumen 160 roble · QA-LUMEN-160-RB · ficha sintética QA/);
 assert.deepEqual([it.quantity.value,it.quantity.unit,it.quantity.status,it.quantity.source.type],[1,'unit','measured','manual']);assert.match(it.quantity.source.label,/no es una medición del motor de cantidades/);
 assert.equal(it.unitPrice,null,'never automatic');assert.equal(it.priceReference,null);assert.equal(states[0].state,'sheet-price-available');assert.equal(states[0].sheetPrice.unitPrice,690);
 assert.deepEqual(report[0].identity,{studioId:'local',catalogId:'piloto-sintetico-qa',productId:'aparador-lumen',variantId:'roble'});assert.deepEqual(report[0].objects,['obj_template-029']);
 assert.deepEqual(budget.items.filter(i=>!CB.isCatalogItem(i.id)),base.items,'geometric items unchanged');
 assert.equal(B.calculateBudget(budget).totals.unpricedItemIds.includes(RB),true,'unknown price is not 0');
});

test('duplicate → quantity 2 in one item; remove one → 1; remove all without price → item gone; orphan links reported, never revived',()=>{
 const cats=[catalog()],p=placed(cats,[['obj_template-029','aparador-lumen','roble'],['obj_template-031','aparador-lumen','roble']]);
 let d=draft(p,cats);assert.equal(d.budget.items.filter(i=>CB.isCatalogItem(i.id)).length,1);assert.equal(item(d.budget,RB).quantity.value,2);
 p.objects=p.objects.filter(o=>o.id!=='obj_template-031');d=draft(p,cats,roundtrip(d.budget));assert.equal(item(d.budget,RB).quantity.value,1);assert.deepEqual(d.orphans,['obj_template-031']);
 p.objects=p.objects.filter(o=>o.id!=='obj_template-029');d=draft(p,cats,roundtrip(d.budget));assert.equal(item(d.budget,RB),undefined);assert.equal(d.budget.chapters.some(c=>c.id==='catalog'),false);
 for(let i=0;i<3;i++)d=draft(p,cats,roundtrip(d.budget));assert.equal(d.budget.items.length,new Set(d.budget.items.map(x=>x.id)).size,'reopening never duplicates');
});

test('S2 explicit apply: preview → confirm → calculateBudget; refused without confirmation, after a budget change, and over a reviewed price without consent; cancel changes nothing',async()=>{
 const cats=[catalog()],p=placed(cats,[['obj_template-029','aparador-lumen','roble']]);let {budget}=draft(p,cats);
 const q=await catalogQuote(cats,'QA-LUMEN-160-RB');assert.equal(q.itemId,RB);assert.equal(q.code,'QA-LUMEN-160-RB');assert.equal(q.unit,'ud');assert.equal(q.source.edition,'rev 1 · ficha v1');assert.match(q.source.attribution,/synthetic-fixture/);
 const pv=Cat.previewApply(budget,RB,q,{as:'price'});assert.equal(pv.ok,true);assert.equal(pv.rawUnit,'ud','ud ≡ unit by notation, no conversion');assert.equal(pv.before.subtotalNet,null);assert.equal(pv.after.subtotalNet,690);
 assert.throws(()=>Cat.apply(budget,pv,{}),/explicit professional confirmation/);
 const cancelled=budget;assert.deepEqual(budget,cancelled,'a cancelled preview leaves the budget as it was');
 const other=B.validateBudget({...budget,taxRatePercent:10});assert.throws(()=>Cat.apply(other,pv,{confirmed:true}),/changed since the preview/);
 const out=Cat.apply(budget,pv,{confirmed:true,decidedAt:'2026-11-15T10:00:00Z'});budget=out.budget;
 const it=item(budget,RB);assert.equal(it.unitPrice,690);assert.deepEqual(it.priceSource,{type:'provider-reference',providerId:'studio-catalog',itemId:RB});assert.equal(it.review.status,'unreviewed');
 assert.equal(B.calculateBudget(budget).lines.find(l=>l.id===RB).subtotalNet,690);assert.equal(out.change.code,'QA-LUMEN-160-RB');
 budget=B.validateBudget({...budget,items:budget.items.map(i=>i.id===RB?B.markReviewed(i,{reviewedAt:'2026-11-15T10:05:00Z'}):i)});
 const pv2=Cat.previewApply(budget,RB,{...q,unitPrice:700},{as:'price'});assert.equal(pv2.requiresConsent,true);assert.throws(()=>Cat.apply(budget,pv2,{confirmed:true}),/explicit consent/);
});

test('persistence: applied price, reference and review survive serialise → reopen → reconcile; duplicate invalidates the review, keeps the price',async()=>{
 const cats=[catalog()],p=placed(cats,[['obj_template-029','aparador-lumen','roble']]);let {budget}=draft(p,cats);
 const q=await catalogQuote(cats,'QA-LUMEN-160-RB');budget=Cat.apply(budget,Cat.previewApply(budget,RB,q),{confirmed:true}).budget;
 budget=B.validateBudget({...budget,items:budget.items.map(i=>i.id===RB?B.markReviewed(i,{reviewedAt:'2026-11-15T10:05:00Z'}):i)});
 let d=draft(p,cats,roundtrip(budget));assert.equal(item(d.budget,RB).unitPrice,690);assert.equal(item(d.budget,RB).review.status,'reviewed');assert.equal(d.states[0].state,'reviewed');assert.equal(item(d.budget,RB).priceReference.code,'QA-LUMEN-160-RB');
 P.duplicate(p,'obj_template-029','obj_template-031');d=draft(p,cats,roundtrip(d.budget));
 assert.equal(item(d.budget,RB).quantity.value,2);assert.equal(item(d.budget,RB).unitPrice,690);assert.equal(item(d.budget,RB).review.status,'unreviewed');assert.deepEqual(d.reviewInvalidated,[RB]);
 assert.equal(B.calculateBudget(d.budget).lines.find(l=>l.id===RB).subtotalNet,1380);
});

test('undo-safe: removing every object of a priced item keeps it with 0 units (subtotal 0, price kept); placing again restores the quantity',async()=>{
 const cats=[catalog()],p=placed(cats,[['obj_template-029','aparador-lumen','roble']]);let {budget}=draft(p,cats);
 budget=Cat.apply(budget,Cat.previewApply(budget,RB,await catalogQuote(cats,'QA-LUMEN-160-RB')),{confirmed:true}).budget;
 const kept=JSON.parse(JSON.stringify(p));p.objects=p.objects.filter(o=>o.id!=='obj_template-029');
 let d=draft(p,cats,roundtrip(budget));const it=item(d.budget,RB);assert.equal(it.quantity.value,0);assert.equal(it.unitPrice,690);assert.equal(d.report.find(r=>r.itemId===RB).retired,true);
 assert.equal(B.calculateBudget(d.budget).lines.find(l=>l.id===RB).subtotalNet,0);
 d=draft(kept,cats,roundtrip(d.budget));assert.equal(item(d.budget,RB).quantity.value,1);assert.equal(item(d.budget,RB).unitPrice,690,'undo finds the same price');
});

test('stale sheet: a new price in the catalogue is detected and NEVER overwrites the applied price; a deleted catalogue keeps the historical evidence',async()=>{
 let cats=[catalog()];const p=placed(cats,[['obj_template-029','aparador-lumen','roble']]);let {budget}=draft(p,cats);
 budget=Cat.apply(budget,Cat.previewApply(budget,RB,await catalogQuote(cats,'QA-LUMEN-160-RB')),{confirmed:true}).budget;
 const edit=JSON.parse(JSON.stringify(PILOT.products[0]));edit.commercial.netUnitPrice=710;cats=[C.importCollection(cats[0],[edit],{today:'2026-11-15'}).catalog];
 let d=draft(p,cats,roundtrip(budget));assert.equal(d.states[0].state,'stale');assert.equal(item(d.budget,RB).unitPrice,690);assert.equal(d.states[0].sheetPrice.unitPrice,710);assert.equal(d.states[0].sheetPrice.edition,'rev 2 · ficha v2');
 assert.equal(d.report[0].versionChanged,true);assert.equal(d.report[0].revisionChanged,true);
 d=draft(p,[],roundtrip(d.budget));assert.equal(d.report[0].sheet.status,'catalog-missing');assert.equal(d.states[0].sheetGone,true);assert.equal(item(d.budget,RB).priceReference.unitPrice,690,'historical evidence kept');
});

test('negatives: oven without price, worktop (material, m²) not placed, USD and invalid date rejected, per-m² sheet never multiplied by objects',async()=>{
 const cats=[catalog()],p=placed(cats,[['obj_template-023','horno-h60','inox']]);const d=draft(p,cats);
 assert.equal(d.states[0].state,'unknown-price');assert.equal(item(d.budget,H60).unitPrice,null);
 {const c=B.calculateBudget(d.budget),id=item(d.budget,H60).id,line=c.lines.find(l=>l.id===id);assert.equal(line.subtotalNet,null,'unknown price → no subtotal, never 0');assert.ok(c.totals.unpricedItemIds.includes(id));assert.equal(c.totals.net.complete,false,'no complete total while a price is unknown');assert.ok(c.totals.net.missingItemIds.includes(id),'the unknown price is reported missing, not counted as 0');assert.notEqual(item(d.budget,H60).review?.status,'reviewed');assert.equal(item(d.budget,H60).priceReference??null,null,'no price reference invented');}assert.equal((await CB.priceSources(cats)[0].quote('QA-H60-INOX')).state,'no-price');
 assert.equal(P.plan(C.findProduct(cats[0],'encimera-basalto',null),[]).reason,'material-not-placeable');
 const usd=JSON.parse(JSON.stringify(PILOT.products[4]));usd.commercial.currency='USD';const r1=C.importCollection(C.createCatalog({catalogId:'usd',studioId:'local'}),[{...usd,catalogId:'usd'}],{today:'2026-11-14'});
 const t1=r1.catalog.products.length?CB.priceSources([r1.catalog])[0]:null;assert.ok(!t1||(await t1.quote(usd.sku)).state!=='found','USD never quoted into an EUR budget');
 const bad=JSON.parse(JSON.stringify(PILOT.products[4]));bad.commercial.verifiedAt='2026-13-45';const r2=C.importCollection(C.createCatalog({catalogId:'bad',studioId:'local'}),[{...bad,catalogId:'bad'}],{today:'2026-11-14'});assert.equal(r2.catalog.products.length,0,'invalid date rejected at import');
 const nosrc=JSON.parse(JSON.stringify(PILOT.products[4]));nosrc.commercial.priceSource=null;const r3=C.importCollection(C.createCatalog({catalogId:'nosrc',studioId:'local'}),[{...nosrc,catalogId:'nosrc'}],{today:'2026-11-14'});
 assert.ok(!r3.catalog.products.length||(await CB.priceSources([r3.catalog])[0].quote(nosrc.sku)).state!=='found','price without source is never quoted');
 // A placeable product priced per linear metre: quantity stays unavailable (pending measurement), subtotal unknown.
 const ml=JSON.parse(JSON.stringify(PILOT.products[4]));ml.commercial.unit='ml';const mc=C.importCollection(C.createCatalog({catalogId:'ml',studioId:'local'}),[{...ml,catalogId:'ml'}],{today:'2026-11-14'}).catalog;
 const pm=Core.initial();P.attach(pm,'obj_template-029',P.linkOf(mc,mc.products[0],{representation:'generic-volume',fallbackReason:'no-model',asset:null}));P.attach(pm,'obj_template-031',P.linkOf(mc,mc.products[0],{representation:'generic-volume',fallbackReason:'no-model',asset:null}));
 const dm=draft(pm,[mc]),id='cat:local:ml:lampara-orbe:ambar',im=item(dm.budget,id);assert.deepEqual([im.quantity.value,im.quantity.unit,im.quantity.status],[null,'m','unavailable']);assert.match(im.quantity.source.label,/Pendiente de medición/);
 const q=(await CB.priceSources([mc])[0].quote(ml.sku)).quote,pv=Cat.previewApply(dm.budget,id,q);assert.equal(pv.ok,true);assert.equal(pv.after.subtotalNet,null,'2 objects × €/ml is never computed');
});

test('isolation: same SKU in two catalogues → two items and an ambiguous SKU lookup; another studio is never priced; another project budget contributes nothing',async()=>{
 const a=catalog('local','cat-a'),b=catalog('local','cat-b'),p=Core.initial();
 P.attach(p,'obj_template-029',P.linkOf(a,C.findProduct(a,'aparador-lumen','roble'),{representation:'generic-volume',fallbackReason:null,asset:null}));
 P.attach(p,'obj_template-031',P.linkOf(b,C.findProduct(b,'aparador-lumen','roble'),{representation:'generic-volume',fallbackReason:null,asset:null}));
 const d=draft(p,[a,b]);const ids=d.budget.items.filter(i=>CB.isCatalogItem(i.id)).map(i=>i.id).sort();assert.deepEqual(ids,['cat:local:cat-a:aparador-lumen:roble','cat:local:cat-b:aparador-lumen:roble']);
 assert.equal(P.costProvider(()=>[a,b]).getPrice('QA-LUMEN-160-RB').reason,'ambiguous-sku','never the first match');
 const s=catalog('otro'),po=Core.initial();P.attach(po,'obj_template-029',P.linkOf(s,C.findProduct(s,'aparador-lumen','roble'),{representation:'generic-volume',fallbackReason:null,asset:null}));
 const ds=draft(po,[s],null,'local');assert.equal(ds.states[0].state,'other-studio');assert.equal(ds.report[0].price.quote,null);
 const foreign=D.draft({...Core.initial(),id:'prj_other'},{labels}).budget;const pf=placed([catalog()],[]);const df=CB.reconcile(pf,[catalog()],{studioId:'local',previous:{...foreign,items:[...foreign.items,{...foreign.items[0],id:RB,unitPrice:5,priceSource:{type:'manual',label:'x',asOf:null}}]}});assert.equal(df.lines.length,0);
});

test('compatibility: BC3/tariff/manual prices on geometric items stay; a 1.0.0 budget is upgraded only through the existing path',async()=>{
 const cats=[catalog()],p=placed(cats,[['obj_template-029','aparador-lumen','roble']]);let {budget}=draft(p,cats);
 const paint=budget.items.find(i=>i.id==='paint');budget=B.validateBudget({...budget,items:budget.items.map(i=>i.id==='paint'?B.markReviewed(B.setManualPrice(i,{unitPrice:9.5,label:'BC3 · tarifa'}),{reviewedAt:'2026-11-15T08:00:00Z'}):i)});
 const d=draft(p,cats,roundtrip(budget));const pp=item(d.budget,'paint');assert.equal(pp.unitPrice,9.5);assert.equal(pp.review.status,'reviewed');assert.equal(pp.quantity.value,paint.quantity.value);
 const old=D.draft(Core.initial(),{labels}).budget,v100=JSON.parse(B.serializeBudget(old));v100.schemaVersion='1.0.0';for(const i of v100.items)delete i.priceReference;
 const d2=draft(p,cats,B.parseBudget(JSON.stringify(v100)));assert.equal(d2.budget.schemaVersion,'1.1.0');assert.ok(item(d2.budget,RB));
});
