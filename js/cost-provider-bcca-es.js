/* Point 7C-E: offline BCCA_ES adapter over the validated FIEBDC model. No BC3 parsing or IO. */
(function(root){
  'use strict';
  const Cost=typeof module==='object'&&module.exports?require('./cost-provider.js'):root.FloorPlanCostProvider;
  const Fiebdc=typeof module==='object'&&module.exports?require('./fiebdc3-codec.js'):root.FloorPlanFIEBDC3;
  if(!Cost||!Fiebdc)throw new Error('FloorPlanCostProvider and FloorPlanFIEBDC3 must be loaded first');
  const ID='bcca-es',REGION='Andalucía, España',CAPABILITIES=Object.freeze({search:true,getItem:true,getPrice:true,network:'none'});
  const fail=message=>{throw new TypeError(`FloorPlanBccaEsCostProvider: ${message}`);};
  const nonempty=value=>typeof value==='string'&&value.trim()?value.trim():null;
  const result=(status,reason,extra={})=>({status,providerId:ID,reason,...extra});
  const clone=value=>JSON.parse(JSON.stringify(value));
  const calendarDate=value=>{
    if(typeof value!=='string'||!/^\d{4}-\d\d-\d\d$/.test(value))return false;
    const [year,month,day]=value.split('-').map(Number);
    if(month<1||month>12||day<1)return false;
    return day<=new Date(Date.UTC(year,month,0)).getUTCDate();
  };

  function legalStatus(mode,gate){
    if(mode==='synthetic')return 'VERIFIED'; // Fixture-only permission; never an official-data claim.
    const status=gate?.status??'UNKNOWN';
    if(!['VERIFIED','UNKNOWN','RESTRICTED'].includes(status))fail('legalGate.status must be VERIFIED, UNKNOWN or RESTRICTED');
    if(status!=='VERIFIED')return status;
    // A URL alone is evidence of a location, not a verified commercial-use permission.
    if(gate.sourceOfficial!==true||gate.commercialUse!==true||gate.reuse!==true||
      !Array.isArray(gate.evidenceUrls)||!gate.evidenceUrls.length||!calendarDate(gate.reviewDate))return 'UNKNOWN';
    return 'VERIFIED';
  }

  function sourceMetadata(mode,source,legal){
    const synthetic=mode==='synthetic';
    if(!synthetic&&(!nonempty(source?.label)||!nonempty(source?.sourceName)))fail('official source label and sourceName are required');
    const metadata={
      providerId:ID,
      label:synthetic?'SYNTHETIC TEST ONLY — BCCA_ES fixture':source.label,
      kind:synthetic?'other':'official-dataset',
      sourceName:synthetic?'SYNTHETIC TEST ONLY — invented BC3':source.sourceName,
      sourceUrl:source?.sourceUrl??null,edition:source?.edition??null,
      region:REGION,attribution:source?.attribution??null,
      license:{status:synthetic?'not-applicable':legal==='VERIFIED'?'verified':legal==='RESTRICTED'?'restricted':'unknown',
        name:source?.licenseName??null,url:source?.licenseUrl??null,
        note:synthetic?'SYNTHETIC TEST ONLY':legal==='UNKNOWN'?'Commercial reuse not verified':undefined}
    };
    return Cost.validateSourceMetadata(metadata,ID);
  }

  function asOf(raw){
    if(typeof raw!=='string'||!/^\d{8}$/.test(raw))return null;
    const day=Number(raw.slice(0,2)),month=Number(raw.slice(2,4)),year=Number(raw.slice(4));
    if(month<1||month>12||day<1)return null;
    const days=[31,(year%4===0&&(year%100!==0||year%400===0))?29:28,31,30,31,30,31,31,30,31,30,31];
    if(day>days[month-1])return null;
    return `${raw.slice(4)}-${raw.slice(2,4)}-${raw.slice(0,2)}`;
  }

  function selector(variants,requested){
    if(!variants.length)return result('unavailable','price-unavailable');
    if(requested===undefined){
      return variants.length===1?variants[0]:result('unavailable','price-selector-required');
    }
    if(!requested||typeof requested!=='object'||Array.isArray(requested)||
      Object.keys(requested).length!==1)return result('invalid','invalid-price-selector');
    if(Object.hasOwn(requested,'index')){
      if(!Number.isSafeInteger(requested.index)||requested.index<0)return result('invalid','invalid-price-selector');
      return variants.find(v=>v.index===requested.index)||result('invalid','invalid-price-selector');
    }
    if(Object.hasOwn(requested,'label')){
      if(!nonempty(requested.label)||requested.label!==requested.label.trim())return result('invalid','invalid-price-selector');
      const matches=variants.filter(v=>v.label===requested.label);
      if(matches.length>1)return result('unavailable','price-selector-ambiguous');
      return matches[0]||result('invalid','invalid-price-selector');
    }
    return result('invalid','invalid-price-selector');
  }

  function create(options={}){
    if(!options||typeof options!=='object'||Array.isArray(options))fail('options must be an object');
    const mode=options.datasetMode;
    if(!['synthetic','user-supplied','rubik-managed'].includes(mode))fail('datasetMode must be synthetic, user-supplied or rubik-managed');
    const legal=legalStatus(mode,options.legalGate);
    const metadata=sourceMetadata(mode,options.source,legal);
    let model=null,technicalReason=null;
    try{model=Fiebdc.validate(options.model);}catch{technicalReason='technical-gate-failed';}
    if(model&&(!model.version||!Array.isArray(model.concepts)||!model.concepts.length))technicalReason='technical-gate-failed';
    if(options.currency!=='EUR')technicalReason='currency-unverified';

    const entries=[],byKey=new Map(),textByKey=new Map();
    if(model&&!technicalReason){
      // Only identities exposed by 7C-D are indexed. Alias-derived identities are unavailable.
      for(const concept of model.concepts){
        const keys=[concept.code,concept.identity,...concept.aliases];
        for(const key of keys){
          const previous=byKey.get(key);
          if(previous&&previous.concept!==concept)technicalReason='technical-gate-failed';
        }
        const entry={concept,item:null,keys:[...new Set(keys)]};
        entries.push(entry);
        for(const key of entry.keys)byKey.set(key,entry);
      }
      for(const t of model.texts){
        const key=t.code,entry=byKey.get(key);
        if(entry&&nonempty(t.text)&&!textByKey.has(entry.concept.code))textByKey.set(entry.concept.code,t.text);
      }
      for(const entry of entries){
        const c=entry.concept,description=nonempty(c.summary)||nonempty(textByKey.get(c.code));
        if(!description||!nonempty(c.unit))continue;
        try{entry.item=Cost.validateItem({providerId:ID,itemId:c.code,code:c.code,description,unit:c.unit,category:null},ID);}
        catch{technicalReason='technical-gate-failed';}
        if(!Array.isArray(c.prices)||c.prices.some(p=>!p||!Number.isSafeInteger(p.index)||p.index<0||
          (p.label!==null&&typeof p.label!=='string')||(p.date!==null&&typeof p.date!=='string')||
          (p.value!==null&&typeof p.value!=='number')))technicalReason='technical-gate-failed';
      }
      if(!entries.some(e=>e.item))technicalReason='technical-gate-failed';
    }
    const technical=technicalReason?{status:'FAIL',reason:technicalReason}:{status:'PASS',reason:null};
    const blocked=operation=>{
      if(technical.status==='FAIL')return result('unavailable',operation==='getPrice'&&technicalReason==='currency-unverified'?'currency-unverified':'technical-gate-failed');
      if(mode!=='synthetic'&&(legal==='RESTRICTED'||mode==='rubik-managed'&&legal!=='VERIFIED'))
        return result('unavailable',legal==='RESTRICTED'?'legal-gate-restricted':'legal-gate-not-verified');
      return null;
    };
    const lookup=itemId=>byKey.get(itemId)||null;
    const provider={
      id:ID,
      getCapabilities(){return {...CAPABILITIES};},
      getSourceMetadata(){return clone(metadata);},
      getGateStatus(){return {technical:{...technical},legal:{status:legal,scope:mode==='synthetic'?'synthetic-only':'official'}};},
      search(query){
        const stop=blocked('search');if(stop)return stop;
        const q=Cost.validateSearchQuery(query);
        if(q.region&&q.region!==REGION)return result('available',null,{items:[]});
        if(q.category)return result('available','category-filter-unavailable',{items:[]});
        const needle=q.text.toLocaleLowerCase('es'),ranked=[];
        for(const entry of entries){
          if(!entry.item||q.unit&&q.unit!==entry.item.unit)continue;
          const keys=entry.keys.map(k=>k.toLocaleLowerCase('es'));
          const rank=keys.some(k=>k===needle)?0:keys.some(k=>k.startsWith(needle))?1:
            entry.item.description.toLocaleLowerCase('es').includes(needle)?2:null;
          if(rank!==null)ranked.push({rank,item:entry.item});
        }
        ranked.sort((a,b)=>a.rank-b.rank||(a.item.itemId<b.item.itemId?-1:a.item.itemId>b.item.itemId?1:0));
        return result('available',null,{items:ranked.slice(0,q.limit??100).map(x=>clone(x.item))});
      },
      getItem(itemId){
        const stop=blocked('getItem');if(stop)return stop;
        const entry=lookup(itemId);
        if(!entry)return result('not-found','item-not-found');
        if(!entry.item)return result('unavailable','item-not-priceable');
        return result('available',null,{item:clone(entry.item)});
      },
      getPrice(itemId,context={}){
        const stop=blocked('getPrice');if(stop)return stop;
        const entry=lookup(itemId);
        if(!entry)return result('not-found','item-not-found');
        if(!entry.item)return result('unavailable','item-not-priceable');
        const chosen=selector(entry.concept.prices,Object.hasOwn(context,'priceSelector')?context.priceSelector:options.priceSelector);
        if(chosen.status)return chosen;
        if(chosen.value===null||chosen.value===undefined)return result('unavailable','price-unavailable');
        if(typeof chosen.value!=='number'||!Number.isFinite(chosen.value)||chosen.value<0)return result('unavailable','invalid-price-value');
        const quote=Cost.validateQuote({
          ...entry.item,unitPrice:chosen.value,currency:'EUR',priceKind:'reference',
          source:{label:metadata.label,asOf:asOf(chosen.date),retrievedAt:null,edition:metadata.edition,
            region:metadata.region,sourceUrl:metadata.sourceUrl,attribution:metadata.attribution,
            licenseStatus:metadata.license.status,licenseName:metadata.license.name,licenseUrl:metadata.license.url}
        },ID);
        return result('available',null,{quote});
      }
    };
    Cost.inspectProvider(provider);
    return Object.freeze(provider);
  }

  const api=Object.freeze({ID,REGION,create});
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.FloorPlanBccaEsCostProvider=api;
})(globalThis);
