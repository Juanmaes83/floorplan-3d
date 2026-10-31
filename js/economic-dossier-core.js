/* C4 economic dossier — pure view model. Input: the canonical report of FloorPlanBudgetPresentation.buildReport(budget)
   (C2, over C1 quantities and C3 references). Output: what the dossier shows, for the professional or the client.
   It never measures, never recomputes waste, budget quantity, subtotals, VAT, totals, completeness or review: every
   figure is copied from the report, and every state comes from a field the report already carries. Pure: the report
   is not mutated, nothing is persisted. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanEconomicDossier=api;})(typeof self!=='undefined'?self:this,function(){
 'use strict';
 const VARIANTS=['professional','client'];
 const WARNINGS=['unpriced-items','unavailable-quantities','incomplete-quantities','unreviewed-prices','tax-incomplete'];
 // Client: only the warnings about certainty of the figures (contract §9); review status stays professional detail.
 const CLIENT_WARNINGS=['unpriced-items','unavailable-quantities','incomplete-quantities','tax-incomplete'];
 const copy=v=>v===undefined?undefined:JSON.parse(JSON.stringify(v));
 // Price origin and review are two dimensions (contract §5).
 function origin(line){if(line.unitPrice===null)return 'none';return line.priceSource?.type==='provider-reference'?'reference':'own';}
 function review(line){return line.unitPrice===null?null:line.review?.status==='reviewed'?'reviewed':'pending';}
 // VAT as the report states it (contract §6): incomplete when the report says so; 0 % is a defined value.
 function tax(report){
  const t=report.totals.tax,lines=report.lines,rates=[...new Set(lines.filter(l=>l.effectiveTaxRatePercent!==null).map(l=>l.effectiveTaxRatePercent))];
  if(!t.complete)return {state:lines.some(l=>l.effectiveTaxRatePercent===null)?'undefined':'incomplete',amount:t.amount,complete:false,ratePercent:report.taxRatePercent,missing:t.missingItemIds.length};
  if(!lines.length)return {state:'empty',amount:null,complete:true,ratePercent:report.taxRatePercent,missing:0};
  return {state:rates.length===1&&rates[0]===0?'zero':'defined',amount:t.amount,complete:true,ratePercent:rates.length===1?rates[0]:null,mixed:rates.length>1,missing:0};
 }
 function reference(r,variant){if(!r)return null;const s=r.source||{};
  const out={code:r.code,description:r.description,unit:r.unit,unitPrice:r.unitPrice,label:s.label,asOf:s.asOf||null,edition:s.edition||null,region:s.region||null};
  if(variant==='professional')Object.assign(out,{providerId:r.providerId,itemId:r.itemId,attribution:s.attribution||null,licenseStatus:s.licenseStatus??null,licenseName:s.licenseName||null,licenseUrl:s.licenseUrl||null,sourceUrl:s.sourceUrl||null});
  return out;}
 function lineView(line,context,variant){
  const o=origin(line),pro=variant==='professional';
  const v={description:line.description,quantity:{value:line.quantity.value,unit:line.quantity.unit,status:line.quantity.status,complete:line.quantity.complete,source:line.quantity.source?.type==='quantity-engine'?'project':'manual'},
   context:context?(variant==='professional'?{scope:context.scope,id:context.id}:{scope:context.scope}):null,wastePercent:line.wastePercent,budgetQuantity:line.budgetQuantity,unitPrice:line.unitPrice,origin:o,review:review(line),
   taxRatePercent:line.effectiveTaxRatePercent,subtotalNet:line.subtotalNet,taxAmount:line.taxAmount,subtotalGross:line.subtotalGross,pricingComplete:line.pricingComplete,taxComplete:line.taxComplete};
  // Active reference price, or a reference kept only for contrast while the active price is the professional's own.
  if(o==='reference')v.reference=reference(line.priceReference||{providerId:line.priceSource.providerId,itemId:line.priceSource.itemId,description:null,source:{}},variant);
  else if(line.priceReference)v.contrastReference=reference(line.priceReference,variant);
  if(o==='own')v.ownSource={label:line.priceSource?.label||null,asOf:line.priceSource?.asOf||null};
  if(pro){v.id=line.id;v.quantity.sourceLabel=line.quantity.source?.type==='manual'?line.quantity.source.label||null:null;if(line.review?.reviewedAt)v.reviewedAt=line.review.reviewedAt;if(line.review?.note)v.reviewNote=line.review.note;}
  return v;}
 const group=(totals)=>({net:copy(totals.net),tax:copy(totals.tax),gross:copy(totals.gross),complete:totals.net.complete&&totals.tax.complete,unpriced:totals.unpricedItemIds.length,unavailable:totals.unavailableQuantityItemIds.length,incomplete:totals.incompleteQuantityItemIds.length,unreviewed:totals.unreviewedPriceItemIds.length});
 /* report: FloorPlanBudgetPresentation.buildReport(budget). variant: 'professional' | 'client'.
    Both variants carry the same figures; the client one drops ids, provider ids and licence metadata. */
 function view(report,{variant='professional'}={}){
  if(!report||!Array.isArray(report.lines)||!report.totals)throw TypeError('FloorPlanEconomicDossier: a budget report is required');
  if(!VARIANTS.includes(variant))throw TypeError('FloorPlanEconomicDossier: unknown variant');
  const ctx=new Map();for(const c of report.contexts||[])for(const id of c.itemIds)ctx.set(id,c);
  const lineMap=new Map(report.lines.map(l=>[l.id,l])),lv=id=>lineView(lineMap.get(id),ctx.get(id),variant);
  const t=report.totals,taxView=tax(report);
  const v={variant,subject:{type:report.subject.type},title:report.title,currency:report.currency,
   summary:{net:{amount:t.net.amount,complete:t.net.complete},tax:taxView,gross:{amount:t.gross.amount,complete:t.gross.complete,final:t.gross.complete&&report.lines.length>0},
    chapters:report.chapters.length,items:report.lines.length,unassigned:report.unassigned.itemIds.length,unpriced:t.unpricedItemIds.length,unavailable:t.unavailableQuantityItemIds.length,
    incomplete:t.incompleteQuantityItemIds.length,unreviewed:t.unreviewedPriceItemIds.length,reviewComplete:t.reviewComplete,empty:report.lines.length===0},
   chapters:report.chapters.map(c=>({title:c.title,...(variant==='professional'?{id:c.id}:{}),lines:c.itemIds.map(lv),totals:group(c.totals)})),
   unassigned:report.unassigned.itemIds.length?{lines:report.unassigned.itemIds.map(lv),totals:group(report.unassigned.totals)}:null,
   // Canonical warnings, mapped one to one; nothing is inferred beyond them.
   warnings:report.warnings.filter(w=>WARNINGS.includes(w.code)&&(variant==='professional'||CLIENT_WARNINGS.includes(w.code))).map(w=>({code:w.code,count:w.itemIds.length,...(variant==='professional'?{items:w.itemIds.map(id=>lineMap.get(id)?.description||id)}:{})}))};
  if(variant==='professional'){v.budgetId=report.budgetId;v.subject.id=report.subject.id;
   v.trace={projectQuantities:report.lines.filter(l=>l.quantity.source?.type==='quantity-engine').length,manualQuantities:report.lines.filter(l=>l.quantity.source?.type!=='quantity-engine').length,
    ownPrices:report.lines.filter(l=>origin(l)==='own').length,referencePrices:report.lines.filter(l=>origin(l)==='reference').length,contrastReferences:report.lines.filter(l=>origin(l)!=='reference'&&l.priceReference).length,
    sources:sources(report)};}
  return v;}
 // Distinct reference sources (C3 provenance) as the report carries them; empty when there is none.
 function sources(report){const m=new Map();for(const l of report.lines){const r=l.priceReference;if(!r)continue;const s=r.source||{},k=[r.providerId,s.label,s.edition,s.region,s.asOf].join('|');
  if(!m.has(k))m.set(k,{providerId:r.providerId,label:s.label,edition:s.edition||null,region:s.region||null,asOf:s.asOf||null,attribution:s.attribution||null,licenseStatus:s.licenseStatus??null,licenseName:s.licenseName||null,licenseUrl:s.licenseUrl||null,items:0});m.get(k).items++;}
  return [...m.values()];}
 // The ENTREGAR card state: a final total only when the report says the total is complete.
 function cardState(report){if(!report)return {state:'none'};const t=report.totals;
  if(!report.lines.length)return {state:'empty'};
  const issues=report.warnings.filter(w=>WARNINGS.includes(w.code)).length;
  return {state:t.gross.complete&&t.net.complete?'complete':'incomplete',gross:t.gross.complete?t.gross.amount:null,net:t.net.amount,netComplete:t.net.complete,issues,items:report.lines.length};}
 return {view,cardState,origin,review,tax,VARIANTS,WARNINGS};
});
