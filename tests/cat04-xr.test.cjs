// CAT-04 · cross audit (#237, HEAD bd1024c): two adversarial risk paths, pure.
// XR-01 — Units and prices are conserved. An item with a MANUAL price per m² / per m whose sheet disappears (or whose
//   sheet unit changes) must never come back counted in units with that price: no €/m² or €/m is ever turned into €/ud.
//   The price keeps its provenance, an unknown quantity stays unknown and a unit change requires an explicit review.
// XR-02 — Visual provenance across studios. Linking the same sheet (same hash) from a second studio must never silently
//   re-attribute the first link; legacy links (no studio) keep working and rubik-visual-result-sheet/1 is unchanged.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const CB=require('../js/catalog-budget-core.js'),P=require('../js/catalog-placement-core.js'),C=require('../js/catalog-product-core.js');
const D=require('../js/budget-draft-core.js'),B=require('../js/budget-core.js'),Core=require('../js/project-core.js');
const VR=require('../js/visual-reference-core.js'),V=require('../js/visual-reform-core.js');
const labels={title:'Presupuesto',floor:'Pavimento',skirting:'Rodapié',paint:'Pintura',newWalls:'Tabique nuevo',demolition:'Demolición',door:'Puerta de paso',slidingDoor:'Puerta corredera',window:'Ventana',tariff:'Tarifa del estudio',chapters:{floors:'Pavimentos',walls:'Paredes',partitions:'Tabiquería',carpentry:'Carpintería'}};
const PILOT=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/cat-ia/fixtures/pilot-collection.json'),'utf8'));
const withUnit=(productId,unit)=>PILOT.products.map(p=>p.productId===productId?{...JSON.parse(JSON.stringify(p)),commercial:{...p.commercial,unit}}:p);
const catalog=(products=PILOT.products,studioId='local',catalogId='piloto-sintetico-qa')=>C.importCollection(C.createCatalog({catalogId,studioId}),{...PILOT,catalogId,products:products.map(p=>({...p,catalogId}))},{today:'2026-11-14'}).catalog;
const ENC='cat:local:piloto-sintetico-qa:encimera-basalto:-';
function placed(c,list){const p=Core.initial();for(const [objId,productId,variantId] of list)P.attach(p,objId,P.linkOf(c,C.findProduct(c,productId,variantId),{representation:'generic-volume',fallbackReason:'no-model',asset:null}));return p;}
function draft(project,cats,previous=null){const r=CB.reconcile(project,cats,{studioId:'local',previous});
 const d=D.draft(project,{labels,previous,extraLines:r.lines,extraChapters:r.lines.length?[{id:CB.CHAPTER,title:'Productos de mi estudio'}]:[]});return {...d,report:r.report};}
const item=(b,id)=>b.items.find(i=>i.id===id);
const encId=c=>CB.reconcile(placed(c,[['obj_template-029','encimera-basalto',null]]),[c],{studioId:'local'}).report[0].itemId;
// A manual price per m² typed by the professional on the worktop item (quantity pending measurement), then reviewed.
function pricedPerSquareMetre(c,{review=true}={}){
 const p=placed(c,[['obj_template-029','encimera-basalto',null],['obj_template-030','encimera-basalto',null]]),id=encId(c);
 let {budget}=draft(p,[c]);const i=budget.items.findIndex(x=>x.id===id);
 assert.deepEqual([budget.items[i].quantity.unit,budget.items[i].quantity.value],['m2',null],'fixture: sheet priced per m² → pending measurement');
 budget.items[i]=B.setManualPrice(budget.items[i],{unitPrice:180,label:'Precio manual del estudio por m²',asOf:'2026-11-15'});
 if(review)budget.items[i]=B.markReviewed(budget.items[i],{reviewedAt:'2026-11-15T10:00:00Z'});
 return {p,id,budget:B.validateBudget(budget)};}
// The one oracle of XR-01: the price stays per m² with its source, the quantity stays unknown, nothing is ever 2 × 180.
function assertConserved(b,id,{unit='m2',reviewed=false}={},msg=''){
 const it=item(b,id);assert.ok(it,msg+' item kept');
 assert.equal(it.quantity.unit,unit,msg+' the unit of the price is kept (no €/'+unit+' → €/ud)');
 assert.equal(it.quantity.value,null,msg+' an unknown quantity stays unknown');
 assert.equal(it.unitPrice,180,msg+' the price is kept');assert.deepEqual(it.priceSource,{type:'manual',label:'Precio manual del estudio por m²',asOf:'2026-11-15'},msg+' with its provenance');
 assert.equal(it.review.status,reviewed?'reviewed':'unreviewed',msg+' review');
 const t=B.calculateBudget(b),line=t.lines.find(l=>l.id===id);
 assert.equal(line.subtotalNet,null,msg+' no amount from a count of objects');assert.notEqual(line.subtotalNet,360,msg+' never 2 objects × 180 €/m²');
 assert.equal(t.totals.net.complete,false,msg+' the budget is not complete');assert.ok(t.totals.unavailableQuantityItemIds.includes(id),msg+' flagged as unknown quantity');}

test('XR-01 · sheet disappears: a manual €/m² price is NOT re-applied to a count of units; unit, provenance and unknown quantity are kept',()=>{
 const c=catalog(),{p,id,budget}=pricedPerSquareMetre(c);
 for(const [cats,why] of [[[],'catalogue removed'],[[catalog(PILOT.products.filter(x=>x.productId!=='encimera-basalto'))],'sheet removed']]){
  const r=draft(p,cats,budget);assertConserved(r.budget,id,{reviewed:true},why+':');
  const again=draft(p,cats,B.parseBudget(B.serializeBudget(r.budget)));assertConserved(again.budget,id,{reviewed:true},why+' (reopened):');
  // The sheet comes back: still per m², still pending, same price.
  assertConserved(draft(p,[c],again.budget).budget,id,{reviewed:true},why+' (sheet back):');}
});

test('XR-01 · the sheet unit changes m² → ud: no conversion; the line keeps €/m² pending and the review is invalidated until the professional decides',()=>{
 const c=catalog(),{p,id,budget}=pricedPerSquareMetre(c),cUd=catalog(withUnit('encimera-basalto','ud'));
 const r=draft(p,[cUd],budget);
 assertConserved(r.budget,id,{reviewed:false},'unit change:');
 assert.ok(r.reviewInvalidated.includes(id),'the unit change invalidates the review');
 assert.deepEqual((r.unitConflicts||[]).map(u=>[u.key,u.from,u.to,u.unitPrice]),[[id,'m2','unit',180]],'the conflict is reported, with the kept price');
 // Only an explicit decision (remove the per-m² price) lets the new unit in; the count then has NO price.
 const i=r.budget.items.findIndex(x=>x.id===id),cleared=B.validateBudget({...r.budget,items:r.budget.items.map((x,k)=>k===i?B.clearPrice(x):x)});
 const after=draft(p,[cUd],cleared),it=item(after.budget,id);
 assert.deepEqual([it.quantity.unit,it.quantity.value,it.unitPrice],['unit',2,null],'after the explicit decision: 2 ud without price');
 assert.deepEqual(after.unitConflicts||[],[]);
});

test('XR-01 · per metre (ml) and the generic draft rule: a priced line never changes unit silently; geometric lines unaffected',()=>{
 const cMl=catalog(withUnit('encimera-basalto','ml')),p=placed(cMl,[['obj_template-029','encimera-basalto',null]]),id=encId(cMl);
 let {budget}=draft(p,[cMl]);const i=budget.items.findIndex(x=>x.id===id);assert.equal(budget.items[i].quantity.unit,'m');
 budget.items[i]=B.setManualPrice(budget.items[i],{unitPrice:180,label:'Precio manual del estudio por m²',asOf:'2026-11-15'});budget=B.validateBudget(budget);
 assertConserved(draft(p,[],budget).budget,id,{unit:'m'},'ml, sheet removed:');
 assertConserved(draft(p,[catalog()],budget).budget,id,{unit:'m'},'ml → m²:');
 // Generic rule in draft(): an extra line arriving with another unit than the priced previous item.
 const base=D.draft(Core.initial(),{labels}).budget,geo=base.items.map(x=>x.id);
 const prev=D.draft(Core.initial(),{labels,extraLines:[{key:'x:1',tariffKey:null,chapter:'catalog',description:'X',quantity:{value:null,unit:'m',status:'unavailable',complete:false,source:{type:'manual',label:'pendiente'}},waste:0}],extraChapters:[{id:'catalog',title:'C'}]}).budget;
 prev.items=prev.items.map(x=>x.id==='x:1'?B.setManualPrice(x,{unitPrice:180,label:'Precio manual del estudio por m²',asOf:'2026-11-15'}):x);
 const r=D.draft(Core.initial(),{labels,previous:prev,extraLines:[{key:'x:1',tariffKey:null,chapter:'catalog',description:'X',quantity:{value:3,unit:'unit',status:'measured',complete:true,source:{type:'manual',label:'3 objetos'}},waste:0}],extraChapters:[{id:'catalog',title:'C'}]});
 assertConserved(r.budget,'x:1',{unit:'m'},'generic draft rule:');
 assert.deepEqual(r.budget.items.filter(x=>geo.includes(x.id)),base.items,'geometric items unchanged');
 assert.deepEqual(D.draft(Core.initial(),{labels,previous:base}).unitConflicts||[],[],'no conflict without a unit change');
});

// ---------------------------------------------------------------------------------------------------------- XR-02
const SHA='a'.repeat(64),SHA2='b'.repeat(64);
const req={version:1,mode:'catalog',recipeId:'kitchen-catalog-faithful',recipeVersion:'1.0.0',zone:'appliance',intensity:'faithful',alternatives:1,preserve:['furniture-layout'],mask:[[0.55,0.4,0.2,0.3]],references:[{family:'electrodomesticos',kind:'appliance',sha256:SHA}]};
const ref={catalogId:'piloto-sintetico-qa',catalogRevision:1,productId:'horno-h60',variantId:'inox',sku:'QA-H60-INOX',displayName:'Horno integrable H60 inox',family:'electrodomesticos',imageSha256:SHA,license:{scope:['reference-image'],proofRef:'LICENSE.txt'}};
const ok=V.review({ratios:{inside:.4,outside:0},intensity:'faithful',human:{openingsIntact:true,geometryIntact:true}});
const sheet=()=>V.resultSheet({source:{kind:'photo',sha256:SHA2,width:1200,height:900},request:req,references:[ref],result:{kind:'simulated'},review:ok,decision:'accepted',at:'2026-11-15T09:00:00Z'});
const entry=(p,h)=>JSON.parse(JSON.stringify(p.extensions[VR.EXT].refs[h]));

test('XR-02 · the same sheet linked from a second studio is refused: the first attribution is never silently re-assigned',()=>{
 const s=sheet(),p=Core.initial();VR.link(p,s,{at:'2026-11-15T09:05:00Z',studioId:'estudio-a'});const first=entry(p,s.hash),snap=JSON.stringify(p);
 assert.throws(()=>VR.link(p,s,{at:'2026-11-15T09:10:00Z',studioId:'estudio-b'}),e=>e.code==='studio-conflict','second studio → explicit refusal');
 assert.equal(JSON.stringify(p),snap,'nothing changed in the project');assert.deepEqual(entry(p,s.hash),first);
 assert.deepEqual(VR.conflictOf(p,s,{studioId:'estudio-b'}),{conflict:true,reason:'studio-conflict',linkedStudioId:'estudio-a'});
 // Re-linking from the SAME studio is idempotent: the original link (date, studio) is kept.
 VR.link(p,s,{at:'2026-11-15T09:20:00Z',studioId:'estudio-a'});assert.deepEqual(entry(p,s.hash),first,'same studio → no-op');
 assert.deepEqual(VR.conflictOf(p,s,{studioId:'estudio-a'}),{conflict:false,reason:'already-linked',linkedStudioId:'estudio-a'});
 // A link WITHOUT studio cannot erase the studio of an existing link either.
 assert.throws(()=>VR.link(p,s,{at:'2026-11-15T09:30:00Z'}),e=>e.code==='studio-conflict');assert.deepEqual(entry(p,s.hash),first);
 // Read side: still studio A.
 assert.equal(VR.list(p)[0].references[0].studioId,'estudio-a');assert.equal(VR.list(p)[0].linkedAt,'2026-11-15T09:05:00Z');
});

test('XR-02 · legacy links (no studio) keep working and are never silently attributed; explicit unlink + link re-attributes',()=>{
 const s=sheet(),p=Core.initial();VR.link(p,s,{at:'2026-11-14T08:00:00Z'});const legacy=entry(p,s.hash);
 assert.equal('studioId' in legacy,false,'legacy entry shape unchanged (no studioId key)');
 assert.equal(VR.list(p)[0].references[0].catalogStatus,'studio-unknown');assert.equal(VR.list(p)[0].references[0].placedStatus,'not-placed');
 VR.link(p,s,{at:'2026-11-14T09:00:00Z'});assert.deepEqual(entry(p,s.hash),legacy,'legacy relink without studio → no-op');
 assert.throws(()=>VR.link(p,s,{studioId:'estudio-a'}),e=>e.code==='studio-conflict','a legacy link is not silently claimed by a studio');
 assert.deepEqual(entry(p,s.hash),legacy);
 assert.deepEqual(VR.conflictOf(p,s,{studioId:'estudio-a'}),{conflict:true,reason:'studio-conflict',linkedStudioId:null});
 // The explicit, visible path: «Quitar vínculo» then «Vincular al proyecto».
 assert.deepEqual(VR.unlink(p,s.hash),{changed:true});VR.link(p,s,{at:'2026-11-15T11:00:00Z',studioId:'estudio-a'});
 assert.equal(entry(p,s.hash).studioId,'estudio-a');
 // Contract unchanged: the stored sheet is the same rubik-visual-result-sheet/1 object with the same hash, still verifying.
 const e=entry(p,s.hash);assert.equal(e.sheet.schema,V.SHEET_SCHEMA);assert.equal(e.sheet.hash,s.hash);assert.deepEqual(e.sheet,JSON.parse(JSON.stringify(s)));assert.equal(VR.verify(e.sheet).ok,true);
 assert.deepEqual(Object.keys(e).sort(),['linkedAt','projectId','sheet','studioId']);
 // A historical project (written before this change) still lists and verifies.
 const old=Core.initial();old.extensions={[VR.EXT]:{version:1,refs:{[s.hash]:{sheet:JSON.parse(JSON.stringify(s)),projectId:old.id,linkedAt:'2026-11-10T10:00:00Z'}}}};
 assert.equal(VR.list(old)[0].status,'verified');assert.doesNotThrow(()=>Core.validate(old));
});
