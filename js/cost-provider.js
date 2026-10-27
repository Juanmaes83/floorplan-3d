/* Cost Provider boundary (Point 7C-A): normalized provider contract and registry.
   No UI, network implementation, storage, budget mutation, or external dataset is included here. */
(function(root){
  'use strict';

  const CONTRACT_VERSION='1.0.0';
  const CURRENCY='EUR';
  const RESULT_STATUSES=Object.freeze(['available','not-found','unavailable','invalid','cancelled','unsupported']);
  const NETWORK_MODES=Object.freeze(['none','optional','required']);
  const SOURCE_KINDS=Object.freeze(['manual','official-dataset','commercial','other']);
  const LICENSE_STATUSES=Object.freeze(['not-applicable','unknown','verified','restricted']);
  const PRICE_KINDS=Object.freeze(['manual','reference']);
  const OPERATIONS=Object.freeze(['search','getItem','getPrice']);
  const clone=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
  const finite=Number.isFinite;
  const fail=message=>{throw new TypeError(`FloorPlanCostProvider: ${message}`);};
  const text=(value,label,{nullable=false}={})=>{
    if(value===null&&nullable)return null;
    if(typeof value!=='string'||!value.trim())fail(`${label} must be a non-empty string${nullable?' or null':''}`);
    return value.trim();
  };
  const optionalText=(value,label)=>value===undefined||value===null?null:text(value,label);
  const calendarDateValid=value=>{
    if(typeof value!=='string'||!/^\d{4}-\d\d-\d\d$/.test(value))return false;
    const [year,month,day]=value.split('-').map(Number);
    if(month<1||month>12)return false;
    return day>=1&&day<=new Date(Date.UTC(year,month,0)).getUTCDate();
  };
  const date=(value,label)=>{
    if(value===undefined||value===null)return null;
    if(!calendarDateValid(value))fail(`${label} must be YYYY-MM-DD or null`);
    return value;
  };
  const dateTime=(value,label)=>{
    if(value===undefined||value===null)return null;
    if(typeof value!=='string'||!/^\d{4}-\d\d-\d\d[Tt]\d\d:\d\d:\d\d(?:\.\d+)?(?:[Zz]|[+-]\d\d:\d\d)$/.test(value)||!calendarDateValid(value.slice(0,10))||!Number.isFinite(Date.parse(value)))fail(`${label} must be an offset-aware ISO date-time or null`);
    return value;
  };
  const url=(value,label)=>{
    if(value===undefined||value===null)return null;
    const clean=text(value,label);
    let parsed;try{parsed=new URL(clean);}catch{fail(`${label} must be an http(s) URL or null`);}
    if(!['http:','https:'].includes(parsed.protocol))fail(`${label} must be an http(s) URL or null`);
    return clean;
  };
  const unit=value=>{
    const clean=text(value,'unit');
    if(clean.length>32)fail('unit is too long');
    return clean;
  };

  function validateCapabilities(value){
    if(!value||typeof value!=='object'||Array.isArray(value))fail('getCapabilities() must return an object');
    const out={};
    for(const operation of OPERATIONS){
      if(typeof value[operation]!=='boolean')fail(`capabilities.${operation} must be boolean`);
      out[operation]=value[operation];
    }
    if(!NETWORK_MODES.includes(value.network))fail(`capabilities.network must be one of ${NETWORK_MODES.join(', ')}`);
    out.network=value.network;
    return Object.freeze(out);
  }

  function validateLicense(value){
    if(!value||typeof value!=='object'||Array.isArray(value))fail('sourceMetadata.license must be an object');
    if(!LICENSE_STATUSES.includes(value.status))fail(`sourceMetadata.license.status must be one of ${LICENSE_STATUSES.join(', ')}`);
    const out={status:value.status,name:optionalText(value.name,'sourceMetadata.license.name'),url:url(value.url,'sourceMetadata.license.url')};
    if(value.note!==undefined&&value.note!==null)out.note=text(value.note,'sourceMetadata.license.note');
    return out;
  }

  function validateSourceMetadata(value,expectedProviderId=null){
    if(!value||typeof value!=='object'||Array.isArray(value))fail('getSourceMetadata() must return an object');
    const providerId=text(value.providerId,'sourceMetadata.providerId');
    if(expectedProviderId!==null&&providerId!==expectedProviderId)fail('sourceMetadata.providerId must match provider.id');
    if(!SOURCE_KINDS.includes(value.kind))fail(`sourceMetadata.kind must be one of ${SOURCE_KINDS.join(', ')}`);
    const out={
      providerId,
      label:text(value.label,'sourceMetadata.label'),
      kind:value.kind,
      sourceName:text(value.sourceName,'sourceMetadata.sourceName'),
      sourceUrl:url(value.sourceUrl,'sourceMetadata.sourceUrl'),
      edition:optionalText(value.edition,'sourceMetadata.edition'),
      region:optionalText(value.region,'sourceMetadata.region'),
      attribution:optionalText(value.attribution,'sourceMetadata.attribution'),
      license:validateLicense(value.license)
    };
    return Object.freeze(out);
  }

  function inspectProvider(provider){
    if(!provider||typeof provider!=='object'||Array.isArray(provider))fail('provider must be an object');
    const id=text(provider.id,'provider.id');
    if(typeof provider.getCapabilities!=='function')fail('provider.getCapabilities() is required');
    if(typeof provider.getSourceMetadata!=='function')fail('provider.getSourceMetadata() is required');
    const capabilities=validateCapabilities(provider.getCapabilities());
    const sourceMetadata=validateSourceMetadata(provider.getSourceMetadata(),id);
    for(const operation of OPERATIONS)if(capabilities[operation]&&typeof provider[operation]!=='function')fail(`provider.${operation}() is required when capability is true`);
    return Object.freeze({id,contractVersion:CONTRACT_VERSION,capabilities,sourceMetadata});
  }

  function validateSearchQuery(value={}){
    if(!value||typeof value!=='object'||Array.isArray(value))fail('search query must be an object');
    const out={text:text(value.text,'search.text')};
    if(value.unit!==undefined&&value.unit!==null)out.unit=unit(value.unit);
    if(value.category!==undefined&&value.category!==null)out.category=text(value.category,'search.category');
    if(value.region!==undefined&&value.region!==null)out.region=text(value.region,'search.region');
    if(value.limit!==undefined){
      if(!Number.isSafeInteger(value.limit)||value.limit<1||value.limit>100)fail('search.limit must be an integer between 1 and 100');
      out.limit=value.limit;
    }
    return out;
  }

  function validateItem(value,providerId){
    if(!value||typeof value!=='object'||Array.isArray(value))fail('provider item must be an object');
    const actualProvider=text(value.providerId,'item.providerId');
    if(actualProvider!==providerId)fail('item.providerId must match provider.id');
    return {
      providerId:actualProvider,
      itemId:text(value.itemId,'item.itemId'),
      code:optionalText(value.code,'item.code'),
      description:text(value.description,'item.description'),
      unit:unit(value.unit),
      category:optionalText(value.category,'item.category')
    };
  }

  function validateQuote(value,providerId){
    if(!value||typeof value!=='object'||Array.isArray(value))fail('provider quote must be an object');
    const actualProvider=text(value.providerId,'quote.providerId');
    if(actualProvider!==providerId)fail('quote.providerId must match provider.id');
    if(!PRICE_KINDS.includes(value.priceKind))fail(`quote.priceKind must be one of ${PRICE_KINDS.join(', ')}`);
    if(!finite(value.unitPrice)||value.unitPrice<0)fail('quote.unitPrice must be a finite non-negative number');
    if(value.currency!==CURRENCY)fail(`quote.currency must be ${CURRENCY}`);
    if(!value.source||typeof value.source!=='object'||Array.isArray(value.source))fail('quote.source must be an object');
    const source={
      label:text(value.source.label,'quote.source.label'),
      asOf:date(value.source.asOf,'quote.source.asOf'),
      retrievedAt:dateTime(value.source.retrievedAt,'quote.source.retrievedAt'),
      edition:optionalText(value.source.edition,'quote.source.edition'),
      region:optionalText(value.source.region,'quote.source.region'),
      sourceUrl:url(value.source.sourceUrl,'quote.source.sourceUrl'),
      attribution:optionalText(value.source.attribution,'quote.source.attribution'),
      licenseStatus:value.source.licenseStatus===undefined||value.source.licenseStatus===null?null:(LICENSE_STATUSES.includes(value.source.licenseStatus)?value.source.licenseStatus:fail(`quote.source.licenseStatus must be one of ${LICENSE_STATUSES.join(', ')}`)),
      licenseName:optionalText(value.source.licenseName,'quote.source.licenseName'),
      licenseUrl:url(value.source.licenseUrl,'quote.source.licenseUrl')
    };
    return {
      providerId:actualProvider,
      itemId:text(value.itemId,'quote.itemId'),
      code:optionalText(value.code,'quote.code'),
      description:text(value.description,'quote.description'),
      unit:unit(value.unit),
      unitPrice:value.unitPrice,
      currency:CURRENCY,
      priceKind:value.priceKind,
      source
    };
  }

  function validateReason(value){return value===undefined||value===null?null:text(value,'result.reason');}
  function validateResultEnvelope(value,providerId,operation){
    if(!value||typeof value!=='object'||Array.isArray(value))fail(`${operation} result must be an object`);
    if(!RESULT_STATUSES.includes(value.status))fail(`${operation} result.status is invalid`);
    if(value.providerId!==providerId)fail(`${operation} result.providerId must match provider.id`);
    const base={status:value.status,providerId,reason:validateReason(value.reason)};
    if(value.status!=='available')return base;
    if(operation==='search'){
      if(!Array.isArray(value.items))fail('search available result requires items array');
      return {...base,items:value.items.map(item=>validateItem(item,providerId))};
    }
    if(operation==='getItem')return {...base,item:validateItem(value.item,providerId)};
    if(operation==='getPrice')return {...base,quote:validateQuote(value.quote,providerId)};
    fail(`unknown operation ${operation}`);
  }

  async function invoke(provider,operation,input,context){
    const inspected=inspectProvider(provider);
    if(!OPERATIONS.includes(operation))fail(`unsupported operation ${operation}`);
    if(!inspected.capabilities[operation])return {status:'unsupported',providerId:inspected.id,reason:'capability-disabled'};
    const cleanInput=operation==='search'?validateSearchQuery(input):text(input,`${operation}.itemId`);
    if(context!==undefined&&(!context||typeof context!=='object'||Array.isArray(context)))fail('context must be an object');
    let cleanContext;
    try{cleanContext=context===undefined?{}:clone(context);}catch{fail('context must be JSON-compatible');}
    let raw;
    try{raw=await provider[operation](clone(cleanInput),cleanContext);}catch(error){
      return {status:'unavailable',providerId:inspected.id,reason:'provider-error'};
    }
    return validateResultEnvelope(raw,inspected.id,operation);
  }

  const search=(provider,query,context)=>invoke(provider,'search',query,context);
  const getItem=(provider,itemId,context)=>invoke(provider,'getItem',itemId,context);
  const getPrice=(provider,itemId,context)=>invoke(provider,'getPrice',itemId,context);

  function createRegistry(initialProviders=[]){
    if(!Array.isArray(initialProviders))fail('initialProviders must be an array');
    const providers=new Map();
    const register=provider=>{
      const inspected=inspectProvider(provider);
      if(providers.has(inspected.id))fail(`provider ${inspected.id} is already registered`);
      providers.set(inspected.id,provider);
      return snapshot(inspected);
    };
    const snapshot=inspected=>({id:inspected.id,contractVersion:CONTRACT_VERSION,capabilities:clone(inspected.capabilities),sourceMetadata:clone(inspected.sourceMetadata)});
    for(const provider of initialProviders)register(provider);
    return Object.freeze({
      register,
      unregister(id){const clean=text(id,'provider id');return providers.delete(clean);},
      has(id){return providers.has(text(id,'provider id'));},
      get(id){return providers.get(text(id,'provider id'))||null;},
      list(){return [...providers.values()].map(provider=>snapshot(inspectProvider(provider))).sort((a,b)=>a.id.localeCompare(b.id));},
      inspect(id){const provider=providers.get(text(id,'provider id'));return provider?snapshot(inspectProvider(provider)):null;},
      search(id,query,context){const clean=text(id,'provider id'),provider=providers.get(clean);return provider?search(provider,query,context):Promise.resolve({status:'not-found',providerId:clean,reason:'provider-not-registered'});},
      getItem(id,itemId,context){const clean=text(id,'provider id'),provider=providers.get(clean);return provider?getItem(provider,itemId,context):Promise.resolve({status:'not-found',providerId:clean,reason:'provider-not-registered'});},
      getPrice(id,itemId,context){const clean=text(id,'provider id'),provider=providers.get(clean);return provider?getPrice(provider,itemId,context):Promise.resolve({status:'not-found',providerId:clean,reason:'provider-not-registered'});}
    });
  }

  const api={CONTRACT_VERSION,CURRENCY,RESULT_STATUSES,NETWORK_MODES,SOURCE_KINDS,LICENSE_STATUSES,PRICE_KINDS,inspectProvider,validateCapabilities,validateSourceMetadata,validateSearchQuery,validateItem,validateQuote,validateResultEnvelope,search,getItem,getPrice,createRegistry};
  if(typeof module==='object')module.exports=api;else root.FloorPlanCostProvider=api;
})(globalThis);
