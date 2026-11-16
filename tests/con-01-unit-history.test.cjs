// CON-01 · consolidation (master 46174d6). A catalogue item whose sheet is NOT in this browser and that was never
// budgeted has no verifiable commercial unit (XR-01): its quantity stays unknown. Presupuestar saves on open
// (load → draft → save), so that placeholder used to be read back as «history in units» the next time and came out as
// «N ud · measured» without any sheet or decision — also for a product the sheet prices per m². The placeholder is not
// evidence: only a unit that was once verified or priced (a counted quantity, m²/m, a price or a reference) is history.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const CB=require('../js/catalog-budget-core.js'),P=require('../js/catalog-placement-core.js'),C=require('../js/catalog-product-core.js');
const D=require('../js/budget-draft-core.js'),B=require('../js/budget-core.js'),Core=require('../js/project-core.js');
const labels={title:'Presupuesto',floor:'Pavimento',skirting:'Rodapié',paint:'Pintura',newWalls:'Tabique nuevo',demolition:'Demolición',door:'Puerta de paso',slidingDoor:'Puerta corredera',window:'Ventana',tariff:'Tarifa del estudio',chapters:{floors:'Pavimentos',walls:'Paredes',partitions:'Tabiquería',carpentry:'Carpintería'}};
const PILOT=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/cat-ia/fixtures/pilot-collection.json'),'utf8'));
const catalog=()=>C.importCollection(C.createCatalog({catalogId:'piloto-sintetico-qa',studioId:'local'}),PILOT,{today:'2026-11-14'}).catalog;
function placed(c,list){const p=Core.initial();for(const [objId,productId,variantId] of list)P.attach(p,objId,P.linkOf(c,C.findProduct(c,productId,variantId),{representation:'generic-volume',fallbackReason:'no-model',asset:null}));return p;}
function draft(project,cats,previous=null){const r=CB.reconcile(project,cats,{studioId:'local',previous});
 const d=D.draft(project,{labels,previous,extraLines:r.lines,extraChapters:r.lines.length?[{id:CB.CHAPTER,title:'Productos de mi estudio'}]:[]});return {...d,report:r.report};}
const reopen=b=>B.parseBudget(B.serializeBudget(b));
const item=(b,id)=>b.items.find(i=>i.id===id);

test('CON-01 · project opened where the sheet is missing: the unknown quantity stays unknown after Presupuestar is saved and reopened (m² and ud sheets)',()=>{
 const c=catalog();
 for(const [productId,variantId,sheetUnit] of [['encimera-basalto',null,'m2'],['aparador-lumen','roble','ud']]){
  const p=placed(c,[['obj_template-029',productId,variantId],['obj_template-030',productId,variantId]]);
  // Another browser: the project (with its links) arrived, the studio catalogue did not, no budget yet.
  const first=draft(p,[]),id=first.report[0].itemId;
  assert.equal(item(first.budget,id).quantity.value,null,sheetUnit+': first open → unknown');assert.equal(first.report[0].quantityStatus,'unit-unverifiable');
  let b=reopen(first.budget);
  for(let n=2;n<=4;n++){const r=draft(p,[],b),it=item(r.budget,id),line=B.calculateBudget(r.budget).lines.find(l=>l.id===id);
   assert.equal(it.quantity.value,null,`${sheetUnit}: open #${n} → still unknown, never «2 ud» out of a saved placeholder`);
   assert.equal(it.quantity.status,'unavailable');assert.equal(r.report[0].quantityStatus,'unit-unverifiable');assert.equal(line.subtotalNet,null);b=reopen(r.budget);}
  // A price typed on the placeholder does not turn it into a count either (2 objects × 180 is never an amount).
  const i=b.items.findIndex(x=>x.id===id);b.items[i]=B.setManualPrice(b.items[i],{unitPrice:180,label:'Precio manual',asOf:'2026-11-16'});b=reopen(B.validateBudget(b));
  const priced=draft(p,[],b),calc=B.calculateBudget(priced.budget);
  assert.equal(item(priced.budget,id).quantity.value,null,sheetUnit+': priced placeholder stays unknown');assert.equal(item(priced.budget,id).unitPrice,180,'the typed price is kept');
  assert.equal(calc.lines.find(l=>l.id===id).subtotalNet,null);assert.ok(calc.totals.unavailableQuantityItemIds.includes(id));
  // The sheet arrives (catalogue imported in this browser): the unit comes from the sheet, as always.
  // Unpriced placeholder → the sheet unit applies. Priced placeholder + m² sheet → the XR-01 draft rule holds: a priced
  // line never changes unit silently, so it stays pending (no 180 €/ud turned into €/m², no amount).
  const clean=item(draft(p,[c],reopen(first.budget)).budget,id).quantity;
  assert.deepEqual([clean.value,clean.unit,clean.status],sheetUnit==='ud'?[2,'unit','measured']:[null,'m2','unavailable'],sheetUnit+': unpriced placeholder takes the sheet unit');
  const back=draft(p,[c],reopen(priced.budget)),q=item(back.budget,id).quantity,sub=B.calculateBudget(back.budget).lines.find(l=>l.id===id).subtotalNet;
  if(sheetUnit==='ud')assert.deepEqual([q.value,q.unit,q.status,sub],[2,'unit','measured',360]);else assert.deepEqual([q.value,q.status,sub],[null,'unavailable',null]);
 }
});
test('CON-01 · genuine history is still honoured: a quantity counted with its sheet keeps its units when the sheet disappears',()=>{
 const c=catalog(),p=placed(c,[['obj_template-029','aparador-lumen','roble'],['obj_template-030','aparador-lumen','roble']]);
 const withSheet=draft(p,[c]),id=withSheet.report[0].itemId;assert.equal(item(withSheet.budget,id).quantity.value,2);
 let b=reopen(withSheet.budget);
 for(let n=0;n<3;n++){const r=draft(p,[],b);assert.deepEqual([item(r.budget,id).quantity.value,item(r.budget,id).quantity.unit,r.report[0].quantityStatus],[2,'unit','counted']);b=reopen(r.budget);}
});
