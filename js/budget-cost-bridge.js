/* Point 7C-C: explicitly apply a normalized CostQuote to one Budget item. */
(function(root){
  'use strict';
  const Budget=typeof module==='object'&&module.exports?require('./budget-core.js'):root.FloorPlanBudget;
  const Cost=typeof module==='object'&&module.exports?require('./cost-provider.js'):root.FloorPlanCostProvider;
  if(!Budget||!Cost)throw new Error('FloorPlanBudget and FloorPlanCostProvider must be loaded first');
  const fail=message=>{throw new TypeError(`FloorPlanBudgetCostBridge: ${message}`);};

  function itemIndex(budget,itemId){
    const index=budget.items.findIndex(item=>item.id===itemId);
    if(index<0)fail(`unknown budget item ${itemId}`);
    return index;
  }
  function checkedQuote(budget,item,quote){
    const clean=Cost.validateQuote(quote,quote?.providerId);
    if(clean.currency!==budget.currency)fail('quote currency must match budget currency');
    if(clean.unit!==item.quantity.unit)fail('quote unit must exactly match quantity unit; upgrade/conversion is not supported');
    return clean;
  }
  function change(budget,itemId,edit){
    const next=Budget.validateBudget(budget);
    const index=itemIndex(next,itemId);
    next.items[index]=edit(next,next.items[index]);
    return Budget.validateBudget(next);
  }
  function setPriceReferenceFromQuote(budget,itemId,quote){
    return change(budget,itemId,(next,item)=>{
      if(next.schemaVersion!=='1.1.0')fail('budget upgrade required for reference quote');
      const clean=checkedQuote(next,item,quote);
      if(clean.priceKind!=='reference')fail('priceReference requires a reference quote');
      if(item.priceSource?.type==='provider-reference' &&
        (item.priceSource.providerId!==clean.providerId||item.priceSource.itemId!==clean.itemId||item.unitPrice!==clean.unitPrice))
        fail('cannot replace the reference used by the active provider price');
      return {...item,priceReference:clean};
    });
  }
  function setPriceFromQuote(budget,itemId,quote){
    return change(budget,itemId,(next,item)=>{
      const clean=checkedQuote(next,item,quote);
      if(clean.priceKind==='manual')return Budget.setManualPrice(item,{unitPrice:clean.unitPrice,label:clean.source.label,asOf:clean.source.asOf});
      if(next.schemaVersion!=='1.1.0')fail('budget upgrade required for reference quote');
      return {...item,unitPrice:clean.unitPrice,priceSource:{type:'provider-reference',providerId:clean.providerId,itemId:clean.itemId},
        priceReference:clean,review:{status:'unreviewed',reviewedAt:null}};
    });
  }
  function clearPriceReference(budget,itemId){
    return change(budget,itemId,(next,item)=>{
      if(next.schemaVersion!=='1.1.0')fail('budget upgrade required for priceReference');
      if(item.priceSource?.type==='provider-reference')fail('clear or replace the active provider price first');
      return {...item,priceReference:null};
    });
  }
  const api=Object.freeze({setPriceReferenceFromQuote,setPriceFromQuote,clearPriceReference});
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.FloorPlanBudgetCostBridge=api;
})(globalThis);
