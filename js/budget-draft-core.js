/* Phase C2: budget items from quantities (quantities → items → prices). Pure. Builds a FloorPlanBudgetV1 (7B) whose
   items take their quantity from FloorPlanQuantities (7A) with provenance, never typed by hand. Prices come only from
   the professional: a price kept in the previous version of this budget, or the studio's own tariff for that kind of
   item. Every price starts «unreviewed» unless the professional reviewed exactly that price before; a quantity that
   changed since then needs a new review. Nothing here invents a price. */
(function(root,factory){const api=factory(typeof module==='object'?require('./quantity-core.js'):root.FloorPlanQuantities,typeof module==='object'?require('./budget-core.js'):root.FloorPlanBudget);if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanBudgetDraft=api;})(typeof self!=='undefined'?self:this,function(Q,B){
 'use strict';
 if(!Q||!B)throw Error('FloorPlanBudgetDraft requires FloorPlanQuantities and FloorPlanBudget.');
 const worst=list=>list.includes('unavailable')?'unavailable':list.includes('estimated')?'estimated':'measured';
 const sum=(parts,field)=>{const ok=parts.filter(p=>p[field].value!==null);if(!ok.length)return null;return {value:ok.reduce((n,p)=>n+p[field].value,0),status:worst(parts.map(p=>p[field].status)),complete:parts.every(p=>p[field].complete)};};
 const quantity=(v,unit,ref)=>v&&v.value!==null&&v.value>0?B.quantityFrom7A({value:v.value,unit,status:v.status==='unavailable'?'estimated':v.status,complete:!!v.complete,ref}):null;
 // Chapters and the kinds of item Rubik can justify from geometry. key = stable item id (also the tariff key).
 function lines(project,{name=v=>v,labels}){
  const q=Q.home(project).quantities,out=[],materials=new Map((project.materials||[]).map(m=>[m.id,m]));
  for(const f of q.floorMaterials||[]){const m=materials.get(f.materialId);const qq=quantity({value:f.areaM2,status:f.status,complete:f.complete},'m2',{scope:'floorMaterial',materialId:f.materialId});if(qq)out.push({key:`floor:${f.materialId}`,tariffKey:`floor:${m?.appearance?.preset||f.materialId}`,chapter:'floors',description:`${labels.floor} ${m?name(m.name):f.materialId}`,quantity:qq,waste:5});}
  const per=quantity({value:q.roomPerimeter.lengthM,status:q.roomPerimeter.status,complete:q.roomPerimeter.complete},'m',{scope:'roomPerimeter'});if(per)out.push({key:'skirting',tariffKey:'skirting',chapter:'floors',description:labels.skirting,quantity:per,waste:5});
  const standing=['existing','new'].map(s=>q.wallsByStatus[s]).filter(w=>w&&w.count>0);
  const paint=standing.length?sum(standing,'wallSurfaceNetArea'):null;const pq=paint&&quantity(paint,'m2',{scope:'walls',statuses:['existing','new'],field:'wallSurfaceNetArea'});if(pq)out.push({key:'paint',tariffKey:'paint',chapter:'walls',description:labels.paint,quantity:pq,waste:0});
  const nw=q.wallsByStatus.new;if(nw?.count){const v=quantity(nw.faceNetArea,'m2',{scope:'walls',statuses:['new'],field:'faceNetArea'});if(v)out.push({key:'partition-new',tariffKey:'partition-new',chapter:'partitions',description:labels.newWalls,quantity:v,waste:3});}
  const dw=q.wallsByStatus.demolished;if(dw?.count){const v=quantity(dw.faceGrossArea,'m2',{scope:'walls',statuses:['demolished'],field:'faceGrossArea'});if(v)out.push({key:'demolition',tariffKey:'demolition',chapter:'partitions',description:labels.demolition,quantity:v,waste:0});}
  for(const [kind,label] of [['door',labels.door],['sliding-door',labels.slidingDoor],['window',labels.window]]){const n=q.openings.byKind[kind];if(n>0)out.push({key:`opening:${kind}`,tariffKey:`opening:${kind}`,chapter:'carpentry',description:label,quantity:B.quantityFrom7A({value:n,unit:'unit',status:'measured',complete:true,ref:{scope:'openings',kind}}),waste:0});}
  return out;
 }
 const CHAPTERS=['floors','walls','partitions','carpentry'];
 const sameQuantity=(a,b)=>a&&b&&a.unit===b.unit&&Math.abs(a.value-b.value)<1e-6;
 // previous: the budget kept for this project (or null). tariff: {tariffKey:{unitPrice,label}} the studio's own prices.
 // extraLines / extraChapters (CAT-04): lines of other RUBIK sources (products placed from «Mis catálogos») with the
 // same shape as lines(); they get exactly the same treatment (kept prices, references and reviews) and never a tariff
 // price unless they declare a tariffKey. Without them the result is unchanged.
 function draft(project,{previous=null,tariff={},taxRatePercent=21,name=v=>v,labels,now=new Date().toISOString(),extraLines=[],extraChapters=[]}={}){
  const prev=previous?B.validateBudget(B.upgradeBudget?B.upgradeBudget(previous):previous):null,old=new Map((prev?.items||[]).map(i=>[i.id,i]));
  const b=B.createBudget({id:prev?.id||`bud_${project.id}`,subject:{type:'project',id:project.id},title:labels.title,taxRatePercent:prev?prev.taxRatePercent:taxRatePercent});
  CHAPTERS.forEach((c,i)=>b.chapters.push(B.createChapter({id:c,title:labels.chapters[c],order:i})));
  extraChapters.forEach((c,i)=>{if(!b.chapters.some(x=>x.id===c.id))b.chapters.push(B.createChapter({id:c.id,title:c.title,order:CHAPTERS.length+i}));});
  const all=[...lines(project,{name,labels}),...extraLines];
  const changed=[],unitConflicts=[];
  const conflictLabel=(from,to)=>(typeof labels.unitConflict==='function'?labels.unitConflict(from,to):`La unidad de la partida ha cambiado (${from} → ${to}): se conserva tu precio por ${from} con su origen y la cantidad queda pendiente; revisa la partida o quita el precio para usar la nueva unidad`);
  for(const raw of all){
   const before=old.get(raw.key);let price=null,review=undefined;
   // XR-01: a price belongs to the unit it was set for. If the line now comes in another unit, the price is never
   // carried over (no €/m² or €/m becomes €/ud): the item keeps its previous unit, price and provenance, its quantity
   // becomes unknown (no amount) and its review is withdrawn. Only an explicit decision — removing that price — lets
   // the new unit in. Geometric lines never change unit, so they are not affected.
   const unitConflict=!!before&&before.unitPrice!==null&&before.quantity?.unit!==raw.quantity.unit;
   const l=unitConflict?{...raw,quantity:{value:null,unit:before.quantity.unit,status:'unavailable',complete:false,source:{type:'manual',label:conflictLabel(before.quantity.unit,raw.quantity.unit)}}}:raw;
   if(unitConflict)unitConflicts.push({key:l.key,from:before.quantity.unit,to:raw.quantity.unit,unitPrice:before.unitPrice,priceSource:JSON.parse(JSON.stringify(before.priceSource))});
   if(before&&before.unitPrice!==null){price={unitPrice:before.unitPrice,priceSource:before.priceSource};
    // A review holds only for the quantity (and unit) it was made on.
    if(before.review?.status==='reviewed'&&!unitConflict&&sameQuantity(before.quantity,l.quantity))review=before.review;else if(before.review?.status==='reviewed')changed.push(l.key);}
   else if(l.tariffKey&&tariff[l.tariffKey]&&Number.isFinite(tariff[l.tariffKey].unitPrice))price={unitPrice:tariff[l.tariffKey].unitPrice,priceSource:{type:'manual',label:labels.tariff,asOf:tariff[l.tariffKey].asOf||null}};
   // A reference price (BC3) stays attached while its unit still matches the item.
   const reference=before?.priceReference&&before.priceReference.unit===l.quantity.unit?before.priceReference:null;
   const active=price?.priceSource?.type==='provider-reference'&&!reference?null:price;
   b.items.push(B.createItem({id:l.key,chapterId:l.chapter,description:l.description,quantity:l.quantity,wastePercent:before?before.wastePercent:l.waste,unitPrice:active?.unitPrice??null,priceSource:active?.priceSource??null,priceReference:reference,review:active?review??{status:'unreviewed',reviewedAt:null}:{status:'unreviewed',reviewedAt:null},
    // F8-C: an item's own VAT (budget-core: optional, 0–100) is economic data — kept as is, with its provenance: an own
    // rate stays own; an item without one keeps inheriting the budget's rate. Never invented, never dropped on reopen.
    ...(before&&Object.prototype.hasOwnProperty.call(before,'taxRatePercent')?{taxRatePercent:before.taxRatePercent}:{})}));
  }
  b.chapters=b.chapters.filter(c=>b.items.some(i=>i.chapterId===c.id));
  return {budget:B.validateBudget(b),reviewInvalidated:changed,unitConflicts,tariffKeys:Object.fromEntries(all.filter(l=>l.tariffKey).map(l=>[l.key,l.tariffKey]))};
 }
 /* CON-03 · bring a budget FILE (the JSON Presupuestar downloads) back as the `previous` of draft(). Nothing is
    computed here: the file is validated as FloorPlanBudgetV1 and handed to the same draft, which takes quantities from
    the open project and keeps prices, waste, VAT and references by item id (XR-01 unit rule included).
    - Same project (subject.id): returned as is — reviews hold only where draft() finds the same quantity.
    - Another project: allowed only as an explicit decision of the professional (`sameSubject:false` is for the caller
      to confirm). The copy is re-addressed to the open project and EVERY review is withdrawn: a review made on another
      project is never shown as made on this one. Building or other subjects are refused. */
 function adopt(incoming,project){
  const b=B.validateBudget(B.upgradeBudget?B.upgradeBudget(incoming):incoming);
  if(b.subject?.type!=='project'||typeof b.subject.id!=='string')throw Error('El archivo no es el presupuesto de un proyecto.');
  const same=b.subject.id===project.id,out=JSON.parse(B.serializeBudget(b));
  if(!same){out.id=`bud_${project.id}`;out.subject={type:'project',id:project.id};for(const it of out.items)it.review={status:'unreviewed',reviewedAt:null};}
  return {previous:B.validateBudget(out),sameSubject:same,sourceSubjectId:b.subject.id};
 }
 /* What importing would change, from the three documents involved (all read with B.calculateBudget, no other sums):
    current = the budget Presupuestar shows now; incoming = adopt().previous; candidate = draft() over incoming. */
 function importSummary(current,incoming,candidate){
  const cur=new Map((current?.items||[]).map(i=>[i.id,i])),cand=new Map(candidate.items.map(i=>[i.id,i])),carries=i=>i.unitPrice!==null||!!i.priceReference;
  const total=b=>{const t=B.calculateBudget(b).totals;return {net:t.net.amount,netComplete:t.net.complete,gross:t.gross.amount,grossComplete:t.gross.complete};};
  // CAT-04 keeps a priced catalogue item whose objects are not in the project with 0 units (it can be retired there).
  const empty=i=>cand.get(i.id)?.quantity?.value===0;
  return {applied:incoming.items.filter(i=>i.unitPrice!==null&&cand.get(i.id)?.unitPrice===i.unitPrice&&!empty(i)).map(i=>i.id),
   withoutObjects:incoming.items.filter(i=>carries(i)&&cand.has(i.id)&&empty(i)).map(i=>i.id),
   notInProject:incoming.items.filter(i=>carries(i)&&!cand.has(i.id)).map(i=>i.id),
   notCarried:incoming.items.filter(i=>i.unitPrice!==null&&cand.has(i.id)&&cand.get(i.id).unitPrice!==i.unitPrice).map(i=>i.id),
   replaced:[...cur.values()].filter(i=>i.unitPrice!==null&&cand.has(i.id)&&cand.get(i.id).unitPrice!==null&&cand.get(i.id).unitPrice!==i.unitPrice).map(i=>i.id),
   removed:[...cur.values()].filter(i=>i.unitPrice!==null&&(!cand.has(i.id)||cand.get(i.id).unitPrice===null)).map(i=>i.id),
   ownVat:candidate.items.filter(i=>Object.prototype.hasOwnProperty.call(i,'taxRatePercent')).map(i=>i.id),
   vat:{before:current?current.taxRatePercent:null,after:candidate.taxRatePercent},before:current?total(current):null,after:total(candidate)};
 }
 return {draft,lines,CHAPTERS,adopt,importSummary};
});
