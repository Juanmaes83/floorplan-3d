/* Point 7C-B: one stateless, offline provider for a professional's explicit price. */
(function(root){
  'use strict';

  const Cost=typeof module==='object'&&module.exports?require('./cost-provider.js'):root.FloorPlanCostProvider;
  if(!Cost)throw new Error('FloorPlanCostProvider must be loaded before FloorPlanManualCostProvider');
  const ID='manual';

  const provider=Object.freeze({
    id:ID,
    getCapabilities(){return {search:false,getItem:false,getPrice:true,network:'none'};},
    getSourceMetadata(){return {
      providerId:ID,label:'Manual',kind:'manual',sourceName:'Professional entry',
      sourceUrl:null,edition:null,region:null,attribution:null,
      license:{status:'not-applicable',name:null,url:null}
    };},
    getPrice(itemId,context={}){
      const quote={
        providerId:ID,itemId,code:context.code??null,description:context.description,
        unit:context.unit,unitPrice:context.unitPrice,currency:'EUR',priceKind:'manual',
        source:{label:context.label,asOf:context.asOf??null,retrievedAt:null,licenseStatus:'not-applicable'}
      };
      try{
        return {status:'available',providerId:ID,quote:Cost.validateQuote(quote,ID)};
      }catch{
        return {status:'invalid',providerId:ID,reason:'invalid-manual-input'};
      }
    }
  });

  if(typeof module==='object'&&module.exports)module.exports=provider;
  else root.FloorPlanManualCostProvider=provider;
})(globalThis);
