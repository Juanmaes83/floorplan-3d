/* FT3D-8 · M1 · S2 — Cost catalog orchestration (pure, no IO, no network).
   One place to CONSULT price references from the sources RUBIK already supports and to APPLY a chosen one to a
   budget only by an explicit professional decision. It owns no prices, no parser and no budget arithmetic:
   - sources: BCCA adapter (FloorPlanBccaEsCostProvider over FIEBDC), BC3 supplied by the professional
     (FloorPlanBc3Budget) and the professional's own tariff (a BC3 marked as tariff);
   - every quote is validated by FloorPlanCostProvider; every change goes through FloorPlanBudgetCostBridge and every
     amount comes from FloorPlanBudget.calculateBudget;
   - inputs are never mutated: an applied change returns a NEW budget plus a change record (the history keeps the old
     one intact); unknown prices stay null; units are never converted (notation only: ud/u→unit, m²→m2, ml→m);
   - the RUBIK-managed BCCA catalogue stays blocked unless a documented legal gate is VERIFIED, and even then this
     module ships no download, hosting or redistribution operation. */
(function(root){
  'use strict';
  const node=typeof module==='object'&&module.exports;
  const Cost=node?require('./cost-provider.js'):root.FloorPlanCostProvider;
  const Budget=node?require('./budget-core.js'):root.FloorPlanBudget;
  const Bridge=node?require('./budget-cost-bridge.js'):root.FloorPlanBudgetCostBridge;
  const Bc3=node?require('./bc3-budget-core.js'):root.FloorPlanBc3Budget;
  const Fiebdc=node?require('./fiebdc3-codec.js'):root.FloorPlanFIEBDC3;
  if(!Cost||!Budget||!Bridge||!Bc3||!Fiebdc)throw new Error('FloorPlanCostCatalog requires CostProvider, Budget, BudgetCostBridge, Bc3Budget and FIEBDC3');

  const VERSION='1.0.0';
  const KINDS=Object.freeze(['bcca','bc3','tariff']);
  const KIND_LABEL=Object.freeze({bcca:'BCCA · Base de Costes de la Construcción de Andalucía',bc3:'BC3 aportado por el profesional',tariff:'Tarifa propia del estudio'});
  const LIMITS=Object.freeze({fileBytes:30*1024*1024,concepts:200000,searchLimit:100,queryMinChars:2,cacheEntries:64,staleAfterDays:365});
  // Legal record of the managed catalogue (docs/legal/bcca-es-reuse-gate-2026-10-27.md + M1 addendum 2026-11-05).
  const MANAGED_GATE=Object.freeze({status:'UNKNOWN',record:'docs/legal/bcca-es-reuse-gate-2026-10-27.md',
    addendum:'docs/legal/bcca-es-reuse-gate-addendum-m1-2026-11-05.md',reviewedAt:'2026-11-05'});
  const fail=message=>{throw new TypeError(`FloorPlanCostCatalog: ${message}`);};
  const clone=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
  const fold=s=>String(s??'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim();
  const deepFreeze=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){Object.freeze(o);for(const v of Object.values(o))deepFreeze(v);}return o;};

  /* ---------- states in plain language (FT8-S2-08) ---------- */
  const STATES=Object.freeze({
    found:{tone:'ok',title:'Referencia encontrada',detail:'Precio de referencia de la fuente indicada. Es una referencia, no una oferta ni un coste ejecutado.'},
    'no-price':{tone:'warn',title:'Sin precio',detail:'La partida existe en la fuente pero no tiene precio utilizable. Se mantiene como desconocido; nunca se cuenta como 0 €.'},
    'selector-required':{tone:'warn',title:'Elige la columna de precios',detail:'Esta fuente tiene varias columnas (zonas o variantes). Elige cuál usar; no se elige por ti.'},
    stale:{tone:'warn',title:'Precio desactualizado',detail:'La fecha de la referencia es antigua o existe una edición más reciente cargada. Revísalo antes de usarlo.'},
    'unit-incompatible':{tone:'bad',title:'Unidad incompatible',detail:'La unidad de la referencia no coincide con la de la partida. RUBIK no convierte unidades: elige otra referencia o corrige la medición.'},
    'currency-mismatch':{tone:'bad',title:'Moneda distinta',detail:'La referencia no está en euros. No se aplica.'},
    'not-found':{tone:'neutral',title:'No encontrada',detail:'No hay ninguna partida con ese código o texto en esta fuente.'},
    'catalog-unavailable':{tone:'bad',title:'Catálogo no disponible',detail:'La fuente no se ha podido leer o validar. Tus datos no han cambiado; vuelve a cargarla o usa otra fuente.'},
    unauthorized:{tone:'bad',title:'Fuente no autorizada',detail:'El uso de esta fuente no está autorizado documentalmente para este modo. Puedes seguir usando un BC3 que aportes tú.'},
    partial:{tone:'warn',title:'Presupuesto parcial',detail:'Hay partidas sin precio o sin cantidad. El importe conocido no es el coste completo de la obra.'},
    'pending-review':{tone:'warn',title:'Pendiente de revisión',detail:'Se aplicó un precio de referencia que todavía no has revisado como profesional.'},
    'update-available':{tone:'info',title:'Actualización disponible',detail:'Hay una edición distinta de la fuente con cambios. Revisa la comparación; nada cambia hasta que lo confirmes.'},
    'reviewed-price':{tone:'warn',title:'Precio ya revisado',detail:'Esta partida tiene un precio revisado por ti. Sustituirlo requiere tu consentimiento expreso.'}
  });
  function describe(state,extra={}){const s=STATES[state];if(!s)fail(`unknown state ${state}`);return Object.freeze({state,...s,...extra});}

  /* ---------- units (FT8-S2-05): notation only, never a conversion ---------- */
  function unitCheck(itemUnit,quoteUnit,currency='EUR'){
    if(currency!=='EUR')return {ok:false,state:'currency-mismatch',reason:'currency-mismatch'};
    if(!Budget.UNITS.includes(itemUnit))return {ok:false,state:'unit-incompatible',reason:'item-unit-unsupported'};
    const q=Budget.UNITS.includes(quoteUnit)?quoteUnit:Bc3.normUnit(quoteUnit);
    if(!q)return {ok:false,state:'unit-incompatible',reason:'quote-unit-unsupported',quoteUnit};
    if(q!==itemUnit)return {ok:false,state:'unit-incompatible',reason:'unit-mismatch',quoteUnit,normalized:q};
    return {ok:true,unit:q,notationOnly:q!==quoteUnit};
  }
  // Same quote with the budget's NOTATION of the same unit (ud → unit). Throws if the units are not the same unit.
  function adaptQuote(quote,itemUnit){
    const clean=Cost.validateQuote(quote,quote?.providerId);
    const u=unitCheck(itemUnit,clean.unit,clean.currency);if(!u.ok)fail(u.reason);
    return u.notationOnly?{...clean,unit:u.unit}:clean;
  }

  /* ---------- families (chapters) from the FIEBDC structure ---------- */
  function familyIndex(model){
    // Decompositions may name a concept by its code (C01#) or its identity (C01): resolve both to the concept.
    const byKey=new Map();for(const c of model.concepts)for(const k of [c.code,c.identity,...(c.aliases||[])])if(k&&!byKey.has(k))byKey.set(k,c);
    const chapter=c=>/[^#]#$/.test(c.code); // «X#» is a chapter (family); «X##» is the root of the base
    const parentOf=new Map();for(const d of model.decompositions){const p=byKey.get(d.parent);if(!p)continue;for(const ch of d.children){const c=byKey.get(ch.child);if(c&&!parentOf.has(c.code))parentOf.set(c.code,p);}}
    const out=new Map();
    for(const c of model.concepts){let p=parentOf.get(c.code),guard=0;while(p&&!chapter(p)&&guard++<50)p=parentOf.get(p.code);if(p&&chapter(p))out.set(c.code,{code:p.code,label:p.summary||p.identity});}
    return out;
  }

  /* ---------- sources ---------- */
  let seq=0;
  function lru(max){const m=new Map();return {get(k){if(!m.has(k))return undefined;const v=m.get(k);m.delete(k);m.set(k,v);return v;},set(k,v){m.set(k,v);if(m.size>max)m.delete(m.keys().next().value);},get size(){return m.size;},clear(){m.clear();}};}
  function baseSource({kind,label,providerId,edition,region,asOf,license,attribution,sourceUrl,legal,columns,column,families,count}){
    return {id:`src_${++seq}_${providerId}`,kind,kindLabel:KIND_LABEL[kind],label,providerId,edition:edition??null,region:region??null,asOf:asOf??null,
      license:clone(license),attribution:attribution??null,sourceUrl:sourceUrl??null,legal:clone(legal),columns:clone(columns||[]),column:column??null,
      families:[...new Set([...families.values()].map(f=>f.label))].sort((a,b)=>a.localeCompare(b,'es')),count};
  }
  const maxDate=dates=>dates.filter(Boolean).sort().at(-1)||null;
  // BCCA through the existing adapter. mode: 'user-supplied' (the professional's own BCCA BC3), 'synthetic' (tests) or
  // 'rubik-managed' (blocked by the adapter unless VERIFIED with evidence; see managedStatus()).
  function bccaSource({bytes=null,model=null,datasetMode,source,legalGate,column=null,fileName='bcca.bc3'}={}){
    if(bytes&&bytes.byteLength>LIMITS.fileBytes)return {status:'unavailable',state:'catalog-unavailable',reason:'file-too-large'};
    let m;try{m=model||Fiebdc.parse(bytes);}catch{return {status:'unavailable',state:'catalog-unavailable',reason:'invalid-bc3'};}
    if(m.concepts.length>LIMITS.concepts)return {status:'unavailable',state:'catalog-unavailable',reason:'catalog-too-large'};
    let provider;try{provider=root.FloorPlanBccaEsCostProvider?root.FloorPlanBccaEsCostProvider.create({datasetMode,model:m,source,legalGate,currency:'EUR'}):require('./cost-provider-bcca-es.js').create({datasetMode,model:m,source,legalGate,currency:'EUR'});}
    catch(e){return {status:'invalid',state:'catalog-unavailable',reason:'invalid-source-metadata',message:e.message};}
    const gate=provider.getGateStatus(),meta=provider.getSourceMetadata();
    if(gate.technical.status!=='PASS')return {status:'unavailable',state:'catalog-unavailable',reason:gate.technical.reason};
    if(datasetMode==='rubik-managed'&&gate.legal.status!=='VERIFIED')return {status:'unavailable',state:'unauthorized',reason:'legal-gate-not-verified',legal:gate.legal};
    if(gate.legal.status==='RESTRICTED')return {status:'unavailable',state:'unauthorized',reason:'legal-gate-restricted',legal:gate.legal};
    const families=familyIndex(m),labels=m.version?.labels?.length?m.version.labels:['Precio'];
    const dates=m.concepts.flatMap(c=>(c.prices||[]).map(p=>p.date)).filter(d=>/^\d{8}$/.test(d||'')).map(d=>`${d.slice(4)}-${d.slice(2,4)}-${d.slice(0,2)}`);
    const src=baseSource({kind:'bcca',label:meta.label,providerId:provider.id,edition:meta.edition,region:meta.region,asOf:maxDate(dates),license:meta.license,
      attribution:meta.attribution,sourceUrl:meta.sourceUrl,legal:{status:gate.legal.status,mode:datasetMode},columns:labels,column:labels.length===1?0:column,families,count:m.concepts.filter(c=>c.unit&&(c.prices||[]).some(p=>Number.isFinite(p.value))).length});
    const cache=lru(LIMITS.cacheEntries);
    const pricedFamily=code=>families.get(code)?.label||null;
    return {status:'available',source:deepFreeze(src),
      async search(q){
        const key=JSON.stringify(q);const hit=cache.get(key);if(hit)return hit;
        const r=await Cost.search(provider,{text:q.text,limit:LIMITS.searchLimit,...(q.unit?{unit:q.unit}:{})});
        let out;
        if(r.status!=='available')out={status:r.status,state:r.reason?.startsWith('legal')?'unauthorized':'catalog-unavailable',reason:r.reason,items:[]};
        else out={status:'available',items:r.items.map(it=>({code:it.code,description:it.description,unit:it.unit,family:pricedFamily(it.code)})).filter(it=>!q.family||it.family===q.family)};
        cache.set(key,out);return out;
      },
      async quote(code,{column=src.column}={}){
        const r=await Cost.getPrice(provider,code,column===null||column===undefined?{}:{priceSelector:{index:column}});
        if(r.status==='available')return {status:'available',state:'found',quote:r.quote,family:pricedFamily(code)};
        const reason=r.reason;
        return {status:r.status,reason,state:reason==='price-selector-required'?'selector-required':reason==='price-unavailable'||reason==='invalid-price-value'?'no-price':
          reason==='item-not-found'?'not-found':reason?.startsWith('legal')?'unauthorized':'catalog-unavailable'};
      },
      cacheSize:()=>cache.size};
  }
  // BC3 supplied by the professional (another price base) or their own tariff, through FloorPlanBc3Budget.
  function bc3Source({bytes,fileName='base.bc3',kind='bc3',column=null}={}){
    if(!KINDS.includes(kind)||kind==='bcca')fail('bc3Source kind must be bc3 or tariff');
    if(!bytes||typeof bytes.byteLength!=='number')return {status:'invalid',state:'catalog-unavailable',reason:'bytes-required'};
    if(bytes.byteLength>LIMITS.fileBytes)return {status:'unavailable',state:'catalog-unavailable',reason:'file-too-large'};
    let base,model;try{base=Bc3.load(bytes,fileName);model=Fiebdc.parse(bytes);}catch(e){return {status:'unavailable',state:'catalog-unavailable',reason:'invalid-bc3',message:e.message};}
    const families=familyIndex(model),dates=base.items.flatMap(i=>i.prices.map(p=>p.date));
    const src=baseSource({kind,label:kind==='tariff'?`Tarifa · ${base.owner||base.fileName}`:`BC3 · ${base.owner||base.fileName}`,providerId:Bc3.PROVIDER,edition:model.version?.date||null,
      region:null,asOf:maxDate(dates),license:{status:'unknown',name:null,url:null,note:'Aportado por el profesional, que responde de su licencia de uso'},
      attribution:null,sourceUrl:null,legal:{status:'USER-SUPPLIED',mode:'user-supplied'},columns:base.labels,column:base.labels.length===1?0:column,families,count:base.count});
    const cache=lru(LIMITS.cacheEntries);
    return {status:'available',source:deepFreeze(src),
      async search(q){
        const key=JSON.stringify(q);const hit=cache.get(key);if(hit)return hit;
        const unit=q.unit?(Bc3.normUnit(q.unit)||q.unit):null;
        const items=Bc3.search(base,{text:q.text,unit,limit:LIMITS.searchLimit}).map(it=>({code:it.code,description:it.description,unit:it.unit,rawUnit:it.rawUnit,family:families.get(it.code)?.label||null}))
          .filter(it=>!q.family||it.family===q.family);
        const out={status:'available',items};cache.set(key,out);return out;
      },
      async quote(code,{column=src.column}={}){
        const it=base.items.find(i=>i.code===code);if(!it)return {status:'not-found',state:'not-found',reason:'item-not-found'};
        if(it.prices.length>1&&(column===null||column===undefined))return {status:'unavailable',state:'selector-required',reason:'price-selector-required'};
        const p=it.prices.find(x=>x.index===(column??it.prices[0].index));if(!p)return {status:'unavailable',state:'no-price',reason:'price-unavailable'};
        const q=Bc3.quote(base,code,p.index);
        return {status:'available',state:'found',quote:Cost.validateQuote(kind==='tariff'?{...q,source:{...q.source,label:`Tarifa ${base.owner||base.fileName}${base.labels.length>1&&p.label?' · '+p.label:''}`}}:q,q.providerId),family:families.get(code)?.label||null};
      },
      cacheSize:()=>cache.size};
  }

  /* ---------- search across sources (FT8-S2-01): never mixes editions or regions ---------- */
  async function searchAll(sources,{text,code,family=null,unit=null,limit=30}={}){
    const needle=String(code||text||'').trim();
    if(needle.length<LIMITS.queryMinChars)return {status:'invalid',reason:'query-too-short',groups:[]};
    const groups=[];
    for(const s of sources){
      try{const r=await s.search({text:needle,family,unit});
        const items=(r.items||[]).filter(it=>!code||it.code===code||fold(it.code).startsWith(fold(code))).slice(0,Math.min(limit,LIMITS.searchLimit));
        groups.push({source:s.source,status:r.status,state:r.state||(items.length?'found':'not-found'),reason:r.reason||null,items});}
      catch{groups.push({source:s.source,status:'unavailable',state:'catalog-unavailable',reason:'provider-error',items:[]});}
    }
    return {status:'available',groups};
  }

  /* ---------- budget helpers ---------- */
  const itemOf=(budget,itemId)=>{const it=budget.items.find(i=>i.id===itemId);if(!it)fail(`unknown budget item ${itemId}`);return it;};
  // Stable revision tag of a budget document (FNV-1a 64 over the canonical serialisation): identical text ⇒ same tag.
  function revisionTag(budget){
    const text=Budget.serializeBudget(Budget.validateBudget(budget));let h=0xcbf29ce484222325n;const p=0x100000001b3n,m=(1n<<64n)-1n;
    for(let i=0;i<text.length;i++){h^=BigInt(text.charCodeAt(i));h=(h*p)&m;}return 'rev_'+h.toString(16).padStart(16,'0');
  }
  const daysBetween=(a,b)=>Math.round((Date.parse(b+'T00:00:00Z')-Date.parse(a+'T00:00:00Z'))/86400000);
  function freshness(quote,{today=null,latestEdition=null,staleAfterDays=LIMITS.staleAfterDays}={}){
    const asOf=quote?.source?.asOf||null,reasons=[];
    if(asOf&&today&&daysBetween(asOf,today)>staleAfterDays)reasons.push('old-date');
    if(latestEdition&&quote?.source?.edition&&quote.source.edition!==latestEdition)reasons.push('newer-edition');
    if(!asOf)reasons.push('no-date');
    return {stale:reasons.includes('old-date')||reasons.includes('newer-edition'),reasons,asOf};
  }
  // Coverage of the whole budget (FT8-S2-08): known amounts are never presented as the full cost.
  function coverage(budget){
    const c=Budget.calculateBudget(budget),t=c.totals;
    const states=[];if(!t.net.complete)states.push('partial');if(t.unreviewedPriceItemIds.length)states.push('pending-review');
    return {netKnown:t.net.amount,netComplete:t.net.complete,grossKnown:t.gross.amount,grossComplete:t.gross.complete,unpriced:t.unpricedItemIds,
      unavailableQuantity:t.unavailableQuantityItemIds,unreviewed:t.unreviewedPriceItemIds,states,
      label:t.net.complete?'Importe sin IVA de todas las partidas':'Importe sin IVA conocido (presupuesto parcial, no es el coste total)'};
  }

  /* ---------- compare without applying (FT8-S2-03) ---------- */
  function compare(budget,itemId,candidates,{today=null,latestEdition=null}={}){
    const clean=Budget.validateBudget(budget),item=itemOf(clean,itemId);
    const current={unitPrice:item.unitPrice,kind:item.priceSource?.type||null,label:item.priceSource?.type==='manual'?item.priceSource.label:item.priceReference?.source?.label||null,
      reviewed:item.review.status==='reviewed',reference:item.priceReference?{code:item.priceReference.code,unitPrice:item.priceReference.unitPrice,edition:item.priceReference.source.edition,label:item.priceReference.source.label}:null};
    const options=candidates.map(({source,quote,state})=>{
      if(!quote)return {sourceId:source.id,kind:source.kind,label:source.label,state:state||'not-found',unitPrice:null};
      const u=unitCheck(item.quantity.unit,quote.unit,quote.currency),f=freshness(quote,{today,latestEdition});
      const delta=current.unitPrice===null?null:Budget.roundMoney(quote.unitPrice-current.unitPrice);
      return {sourceId:source.id,kind:source.kind,label:quote.source.label,code:quote.code,unitPrice:quote.unitPrice,unit:quote.unit,edition:quote.source.edition,region:quote.source.region,
        asOf:quote.source.asOf,licenseStatus:quote.source.licenseStatus,state:!u.ok?u.state:f.stale?'stale':'found',unitOk:u.ok,delta,
        deltaPercent:current.unitPrice?Math.round((quote.unitPrice-current.unitPrice)/current.unitPrice*10000)/100:null};
    });
    return deepFreeze({itemId,unit:item.quantity.unit,quantity:item.quantity.value,current,options,applied:false});
  }

  /* ---------- explicit apply with preview (FT8-S2-03/05/06) ---------- */
  // as: 'price' (the reference becomes the item's price, review → unreviewed) or 'reference' (kept next to the price).
  function previewApply(budget,itemId,quote,{as='price',upgrade=false}={}){
    if(!['price','reference'].includes(as))fail('as must be price or reference');
    let clean=Budget.validateBudget(budget);const blockers=[],notes=[];
    if(clean.schemaVersion!==Budget.VERSION){if(upgrade)clean=Budget.upgradeBudget(clean);else blockers.push('budget-upgrade-required');}
    const item=itemOf(clean,itemId);let q;
    try{q=Cost.validateQuote(quote,quote?.providerId);}catch{return deepFreeze({ok:false,blockers:['invalid-quote'],notes});}
    const u=unitCheck(item.quantity.unit,q.unit,q.currency);if(!u.ok)blockers.push(u.state);
    if(q.source.licenseStatus==='restricted')blockers.push('unauthorized');
    if(as==='price'&&item.review.status==='reviewed'&&item.unitPrice!==null&&item.unitPrice!==q.unitPrice)notes.push('reviewed-price');
    if(as==='reference'&&item.priceSource?.type==='provider-reference')blockers.push('active-reference-price');
    if(blockers.length)return deepFreeze({ok:false,blockers,notes,itemId});
    const adapted=u.notationOnly?{...q,unit:u.unit}:q;
    const after=as==='price'?Bridge.setPriceFromQuote(clean,itemId,adapted):Bridge.setPriceReferenceFromQuote(clean,itemId,adapted);
    const lb=Budget.calculateItem(Budget.validateBudget(budget).items.find(i=>i.id===itemId),clean.taxRatePercent),la=Budget.calculateItem(after.items.find(i=>i.id===itemId),after.taxRatePercent);
    return deepFreeze({ok:true,blockers:[],notes,itemId,as,quote:adapted,rawUnit:u.notationOnly?q.unit:null,requiresConsent:notes.includes('reviewed-price'),
      before:{unitPrice:lb.unitPrice,subtotalNet:lb.subtotalNet,coverage:coverage(budget)},after:{unitPrice:la.unitPrice,subtotalNet:la.subtotalNet,coverage:coverage(after)},
      fromRevision:revisionTag(budget),candidate:after});
  }
  // The ONLY mutation path: requires {confirmed:true}; a reviewed price requires {replaceReviewed:true} as well.
  function apply(budget,preview,{confirmed=false,replaceReviewed=false,decidedAt=null,note=null}={}){
    if(!preview?.ok)fail('nothing applicable in this preview');
    if(confirmed!==true)fail('explicit professional confirmation is required');
    if(preview.requiresConsent&&replaceReviewed!==true)fail('replacing a reviewed price requires explicit consent');
    if(revisionTag(budget)!==preview.fromRevision)fail('the budget changed since the preview; prepare it again');
    const next=Budget.validateBudget(clone(preview.candidate)),before=itemOf(Budget.validateBudget(budget),preview.itemId),after=itemOf(next,preview.itemId);
    const pick=i=>({unitPrice:i.unitPrice,priceSource:clone(i.priceSource),priceReference:clone(i.priceReference??null),review:clone(i.review)});
    const change={kind:'apply-'+preview.as,itemId:preview.itemId,fromRevision:preview.fromRevision,toRevision:revisionTag(next),decidedAt,note,
      before:pick(before),after:pick(after),provenance:clone(preview.quote.source),providerId:preview.quote.providerId,code:preview.quote.code,rawUnit:preview.rawUnit};
    return {budget:next,change:deepFreeze(change)};
  }

  /* ---------- edition updates (FT8-S2-04): proposals only; nothing changes without a decision ---------- */
  async function proposeEditionUpdate(budget,next,{today=null}={}){
    const clean=Budget.validateBudget(budget),edition=next.source.edition,providerId=next.source.providerId,rows=[];
    for(const item of clean.items){
      const ref=item.priceReference;if(!ref||ref.providerId!==providerId)continue;
      if((ref.source.edition??null)===(edition??null))continue;
      const r=await next.quote(ref.code);
      const active=item.priceSource?.type==='provider-reference';
      if(r.status!=='available'){rows.push({itemId:item.id,code:ref.code,state:r.state==='not-found'?'missing-in-new':r.state,oldEdition:ref.source.edition,newEdition:edition,oldPrice:ref.unitPrice,newPrice:null,active,applicable:false});continue;}
      const u=unitCheck(item.quantity.unit,r.quote.unit,r.quote.currency);
      const changed=r.quote.unitPrice!==ref.unitPrice;
      rows.push({itemId:item.id,code:ref.code,state:!u.ok?'unit-incompatible':changed?'price-changed':'unchanged',oldEdition:ref.source.edition,newEdition:edition,
        oldPrice:ref.unitPrice,newPrice:r.quote.unitPrice,delta:Budget.roundMoney(r.quote.unitPrice-ref.unitPrice),active,applicable:u.ok,quote:u.ok?adaptQuote(r.quote,item.quantity.unit):null,
        reviewed:item.review.status==='reviewed'});
    }
    return deepFreeze({fromRevision:revisionTag(budget),providerId,newEdition:edition,rows,pending:rows.filter(r=>r.applicable&&r.state!=='unchanged').length});
  }
  function applyEditionUpdate(budget,proposal,acceptedItemIds,{confirmed=false,replaceReviewed=false,decidedAt=null}={}){
    if(confirmed!==true)fail('explicit professional confirmation is required');
    if(revisionTag(budget)!==proposal.fromRevision)fail('the budget changed since the proposal; prepare it again');
    let next=Budget.validateBudget(clone(budget));const changes=[],skipped=[];
    for(const row of proposal.rows){
      if(!acceptedItemIds.includes(row.itemId))continue;
      if(!row.applicable){skipped.push({itemId:row.itemId,reason:row.state});continue;}
      if(row.active&&row.reviewed&&replaceReviewed!==true){skipped.push({itemId:row.itemId,reason:'reviewed-price'});continue;}
      const before=itemOf(next,row.itemId);
      // An active reference price is replaced by the new edition's price (review → unreviewed); a kept reference is
      // replaced as a reference only (the item's own price does not move).
      next=row.active?Bridge.setPriceFromQuote(next,row.itemId,row.quote):Bridge.setPriceReferenceFromQuote(next,row.itemId,row.quote);
      const after=itemOf(next,row.itemId);
      changes.push({itemId:row.itemId,code:row.code,fromEdition:row.oldEdition,toEdition:row.newEdition,beforePrice:before.unitPrice,afterPrice:after.unitPrice,
        beforeReference:before.priceReference.unitPrice,afterReference:after.priceReference.unitPrice,active:row.active});
    }
    return {budget:next,change:deepFreeze({kind:'edition-update',fromRevision:proposal.fromRevision,toRevision:revisionTag(next),decidedAt,changes,skipped})};
  }

  /* ---------- managed catalogue (FT8-S2-07): fail-closed ---------- */
  function managedStatus(gate=MANAGED_GATE){
    const evidence=gate&&gate.status==='VERIFIED'&&gate.sourceOfficial===true&&gate.commercialUse===true&&gate.reuse===true&&gate.hosting===true&&
      Array.isArray(gate.evidenceUrls)&&gate.evidenceUrls.length>0&&/^\d{4}-\d\d-\d\d$/.test(gate.reviewDate||'');
    return Object.freeze({enabled:false,legal:evidence?'VERIFIED':gate?.status==='RESTRICTED'?'RESTRICTED':'UNKNOWN',
      // Even with VERIFIED evidence, M1 ships no download/hosting/update operation: enabling it is a later, separate change.
      reason:evidence?'managed-distribution-not-implemented':gate?.status==='RESTRICTED'?'legal-gate-restricted':'legal-gate-not-verified',
      record:MANAGED_GATE.record,addendum:MANAGED_GATE.addendum,
      cachePolicy:{persist:false,maxAgeDays:30,note:'Aplicable solo si se autoriza el catálogo gestionado; hoy no se guarda ningún catálogo.'}});
  }

  const api=Object.freeze({VERSION,KINDS,KIND_LABEL,LIMITS,MANAGED_GATE,STATES,describe,unitCheck,adaptQuote,familyIndex,bccaSource,bc3Source,searchAll,
    revisionTag,freshness,coverage,compare,previewApply,apply,proposeEditionUpdate,applyEditionUpdate,managedStatus});
  if(node)module.exports=api;else root.FloorPlanCostCatalog=api;
})(globalThis);
