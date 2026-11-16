// CON-03 · consolidation. The budget JSON Presupuestar downloads had no reader: a project carried to another browser
// arrived without its prices and VAT. FloorPlanBudgetDraft.adopt() + draft() bring it back through the SAME draft and
// the SAME calculation (no second budget model): quantities from the open project, prices/VAT/references by item id.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const CB=require('../js/catalog-budget-core.js'),P=require('../js/catalog-placement-core.js'),C=require('../js/catalog-product-core.js');
const D=require('../js/budget-draft-core.js'),B=require('../js/budget-core.js'),Core=require('../js/project-core.js');
const labels={title:'Presupuesto',floor:'Pavimento',skirting:'Rodapié',paint:'Pintura',newWalls:'Tabique nuevo',demolition:'Demolición',door:'Puerta de paso',slidingDoor:'Puerta corredera',window:'Ventana',tariff:'Tarifa del estudio',chapters:{floors:'Pavimentos',walls:'Paredes',partitions:'Tabiquería',carpentry:'Carpintería'}};
const PILOT=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/cat-ia/fixtures/pilot-collection.json'),'utf8'));
const catalog=()=>C.importCollection(C.createCatalog({catalogId:'piloto-sintetico-qa',studioId:'local'}),PILOT,{today:'2026-11-14'}).catalog;
const draft=(project,cats,previous=null)=>{const r=CB.reconcile(project,cats,{studioId:'local',previous});return D.draft(project,{labels,previous,extraLines:r.lines,extraChapters:r.lines.length?[{id:CB.CHAPTER,title:'Productos de mi estudio'}]:[]});};
const RB='cat:local:piloto-sintetico-qa:aparador-lumen:roble';
// Origin browser: a project with two sideboards, a manual price, an item with its own VAT, a review; then «Descargar (JSON)».
function origin(){const c=catalog(),p=Core.initial();p.id='prj_'+'c'.repeat(32);
 for(const o of ['obj_template-029','obj_template-030'])P.attach(p,o,P.linkOf(c,C.findProduct(c,'aparador-lumen','roble'),{representation:'generic-volume',fallbackReason:'no-model',asset:null}));
 let {budget}=draft(p,[c]);const set=(id,fn)=>{const i=budget.items.findIndex(x=>x.id===id);budget.items[i]=fn(budget.items[i]);};
 set(RB,i=>B.markReviewed(B.setManualPrice(i,{unitPrice:690,label:'Tarifa del estudio',asOf:'2026-11-16'}),{reviewedAt:'2026-11-16T09:00:00Z'}));
 set('paint',i=>({...B.setManualPrice(i,{unitPrice:7.5,label:'Precio propio',asOf:'2026-11-16'}),taxRatePercent:10}));
 budget=B.validateBudget({...budget,taxRatePercent:21});return {c,p,budget,file:B.serializeBudget(budget)};}
const money=b=>{const t=B.calculateBudget(b).totals;return [t.net.amount,t.tax.amount,t.gross.amount,t.net.complete];};

test('CON-03 · same project in a clean browser: the imported file gives back the same prices, per-item VAT, review and totals',()=>{
 const {c,p,budget,file}=origin(),before=draft(p,[c]).budget;assert.equal(B.calculateBudget(before).totals.net.amount,null,'clean browser: no price at all');
 const a=D.adopt(B.parseBudget(file),p);assert.equal(a.sameSubject,true);const after=draft(p,[c],a.previous).budget,s=D.importSummary(before,a.previous,after);
 assert.equal(B.serializeBudget(after),B.serializeBudget(draft(p,[c],budget).budget),'identical to reopening it where it was made');
 assert.deepEqual(money(after),money(budget));
 const rb=after.items.find(i=>i.id===RB),paint=after.items.find(i=>i.id==='paint');
 assert.deepEqual([rb.unitPrice,rb.quantity.value,rb.review.status,paint.unitPrice,paint.taxRatePercent,after.taxRatePercent],[690,2,'reviewed',7.5,10,21]);
 assert.deepEqual([s.applied.sort(),s.notInProject,s.replaced,s.removed,s.ownVat,s.before.net,s.after.net],[[RB,'paint'].sort(),[],[],[],['paint'],null,B.calculateBudget(budget).totals.net.amount]);
});
test('CON-03 · the project changed since the export: quantities come from the open project and the review of a changed quantity is withdrawn',()=>{
 const {c,p,file}=origin(),q=Core.clone(p);P.attach(q,'obj_template-031',P.linkOf(c,C.findProduct(c,'aparador-lumen','roble'),{representation:'generic-volume',fallbackReason:'no-model',asset:null}));
 const r=draft(q,[c],D.adopt(B.parseBudget(file),q).previous),rb=r.budget.items.find(i=>i.id===RB);
 assert.deepEqual([rb.quantity.value,rb.unitPrice,rb.review.status],[3,690,'unreviewed']);assert.deepEqual(r.reviewInvalidated,[RB]);
 assert.equal(B.calculateBudget(r.budget).lines.find(l=>l.id===RB).subtotalNet,2070,'3 objects of THIS project × the imported price');
});
test('CON-03 · a file of another project is re-addressed only through adopt(), with every review withdrawn; items that do not exist here are not imported',()=>{
 const {c,file}=origin(),other=Core.initial();other.id='prj_'+'d'.repeat(32);            // no catalogue products here
 const incoming=B.parseBudget(file),a=D.adopt(incoming,other);assert.equal(a.sameSubject,false);assert.equal(a.sourceSubjectId,'prj_'+'c'.repeat(32));
 assert.deepEqual(a.previous.subject,{type:'project',id:other.id});assert.ok(a.previous.items.every(i=>i.review.status==='unreviewed'));
 assert.equal(incoming.subject.id,'prj_'+'c'.repeat(32),'the parsed file is not mutated');
 const before=draft(other,[c]).budget,after=draft(other,[c],a.previous).budget,s=D.importSummary(before,a.previous,after);
 // A priced catalogue item with no object here follows the CAT-04 rule: 0 units, 0 €, retirable — and is reported apart.
 const rb=after.items.find(i=>i.id===RB);assert.deepEqual([rb.quantity.value,rb.unitPrice,B.calculateBudget(after).lines.find(l=>l.id===RB).subtotalNet],[0,690,0]);
 assert.deepEqual([s.withoutObjects,s.notInProject,s.applied],[[RB],[],['paint']]);
 assert.equal(after.items.find(i=>i.id==='paint').review.status,'unreviewed');
 // Without adopt() the catalogue reconciliation refuses a budget of another subject (CAT-04 rule, unchanged).
 assert.equal(CB.reconcile(origin().p,[c],{studioId:'local',previous:{...incoming,subject:{type:'project',id:'prj_x'}}}).report[0].itemId,RB);
});
test('CON-03 · importing over an existing budget reports exactly what is replaced or left unpriced; building budgets and foreign documents are refused',()=>{
 const {c,p,file}=origin();let current=draft(p,[c]).budget;const set=(id,v)=>{const i=current.items.findIndex(x=>x.id===id);current.items[i]=B.setManualPrice(current.items[i],{unitPrice:v,label:'Precio propio',asOf:'2026-11-16'});};
 set(RB,700);set('skirting',4);current=B.validateBudget(current);
 const a=D.adopt(B.parseBudget(file),p),after=draft(p,[c],a.previous).budget,s=D.importSummary(current,a.previous,after);
 assert.deepEqual([s.replaced,s.removed],[[RB],['skirting']]);assert.equal(after.items.find(i=>i.id==='skirting').unitPrice,null);
 const bld=JSON.parse(file);bld.subject={type:'building',id:'bld_1'};assert.throws(()=>D.adopt(bld,p),/no es el presupuesto de un proyecto/);
 assert.throws(()=>B.parseBudget(JSON.stringify({schema:'otra-cosa'})));assert.throws(()=>B.parseBudget('{'));
});
