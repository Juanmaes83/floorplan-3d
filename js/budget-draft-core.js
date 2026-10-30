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
 function draft(project,{previous=null,tariff={},taxRatePercent=21,name=v=>v,labels,now=new Date().toISOString()}={}){
  const prev=previous?B.validateBudget(B.upgradeBudget?B.upgradeBudget(previous):previous):null,old=new Map((prev?.items||[]).map(i=>[i.id,i]));
  const b=B.createBudget({id:prev?.id||`bud_${project.id}`,subject:{type:'project',id:project.id},title:labels.title,taxRatePercent:prev?prev.taxRatePercent:taxRatePercent});
  CHAPTERS.forEach((c,i)=>b.chapters.push(B.createChapter({id:c,title:labels.chapters[c],order:i})));
  const changed=[];
  for(const l of lines(project,{name,labels})){
   const before=old.get(l.key);let price=null,review=undefined;
   if(before&&before.unitPrice!==null){price={unitPrice:before.unitPrice,priceSource:before.priceSource};
    // A review holds only for the quantity it was made on.
    if(before.review?.status==='reviewed'&&sameQuantity(before.quantity,l.quantity))review=before.review;else if(before.review?.status==='reviewed')changed.push(l.key);}
   else if(tariff[l.tariffKey]&&Number.isFinite(tariff[l.tariffKey].unitPrice))price={unitPrice:tariff[l.tariffKey].unitPrice,priceSource:{type:'manual',label:labels.tariff,asOf:tariff[l.tariffKey].asOf||null}};
   b.items.push(B.createItem({id:l.key,chapterId:l.chapter,description:l.description,quantity:l.quantity,wastePercent:before?before.wastePercent:l.waste,unitPrice:price?.unitPrice??null,priceSource:price?.priceSource??null,review:review??{status:'unreviewed',reviewedAt:null}}));
  }
  b.chapters=b.chapters.filter(c=>b.items.some(i=>i.chapterId===c.id));
  return {budget:B.validateBudget(b),reviewInvalidated:changed,tariffKeys:Object.fromEntries(lines(project,{name,labels}).map(l=>[l.key,l.tariffKey]))};
 }
 return {draft,lines,CHAPTERS};
});
