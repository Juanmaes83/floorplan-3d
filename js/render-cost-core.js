/* ECO-01 · Measurement model of the AI render: what was CONSUMED (measured by the provider), what Rubik ESTIMATES
   (consumption × a verified tariff), what was BILLED (only the provider's invoice) and what was ACCEPTED (only an
   explicit decision). Pure module: no DOM, network, storage, provider call nor price of its own.
   It reads the events api/render.js already writes ({"event":"rubik-render", model, status, usage, cost, …}, see
   docs/render-ai/d1-pr4-img02-consumo-y-coste.md) and never replaces the live estimate of #182 (costOf): it adds what an
   analysis needs and #182 cannot express — tariffs bound to a model and a validity period, integer money arithmetic,
   unknown kept as unknown (never 0), and acceptance only from explicit events.
   Money: integer micro-units of the tariff currency (1 USD = 1 000 000 µUSD), half-up rounding at the micro-unit; cents
   only for display, rounded explicitly. Amounts are WITHOUT taxes unless the tariff says otherwise; a tax-included
   invoice is never compared with a tax-free estimate. UMD: FloorPlanRenderCost / module.exports. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanRenderCost=api;})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 const PROVIDER_STATUSES=['ok','provider-unreachable','provider-rate-limit','provider-rejected','provider-error','provider-empty'];
 const CATEGORIES=['inputText','inputImage','output'];
 const isInt=v=>Number.isSafeInteger(v)&&v>=0;
 const isoOk=s=>typeof s==='string'&&Number.isFinite(Date.parse(s));
 // Decimal string price (≤ 6 decimals) per 1 000 000 tokens → BigInt micro-units per million tokens. Never a float.
 function priceMicros(v){if(typeof v!=='string'||!/^\d{1,6}(\.\d{1,6})?$/.test(v))return null;const [i,f='']=v.split('.');return BigInt(i)*1000000n+BigInt((f+'000000').slice(0,6));}
 /* Tariff (one per model and period), from a verified source the owner records — never inferred from a model name:
    {id, model, currency:'USD'|'EUR', validFrom:ISO, validTo?:ISO, taxIncluded:boolean, source:{kind:'provider-pricing-page'|
     'invoice'|'contract', reference, checkedAt:ISO}, perMillion:{inputText, inputImage, output} as decimal strings} */
 function validateTariff(t){
  const e=[];
  if(!t||typeof t!=='object')return {ok:false,errors:['tariff']};
  if(typeof t.id!=='string'||!/^[a-z0-9][a-z0-9._-]{2,63}$/.test(t.id))e.push('id');
  if(typeof t.model!=='string'||!t.model.trim())e.push('model');
  if(!['USD','EUR'].includes(t.currency))e.push('currency');
  if(!isoOk(t.validFrom))e.push('validFrom');if(t.validTo!==undefined&&(!isoOk(t.validTo)||Date.parse(t.validTo)<=Date.parse(t.validFrom)))e.push('validTo');
  if(typeof t.taxIncluded!=='boolean')e.push('taxIncluded');
  if(!t.source||!['provider-pricing-page','invoice','contract'].includes(t.source.kind)||typeof t.source.reference!=='string'||!t.source.reference||!isoOk(t.source.checkedAt))e.push('source');
  for(const c of CATEGORIES)if(priceMicros(t.perMillion?.[c])===null)e.push('perMillion.'+c);
  return {ok:!e.length,errors:e};
 }
 // The tariff that applies to a model at a moment: exact model, validFrom ≤ at < validTo. Ambiguity is not resolved by guessing.
 function tariffFor(tariffs,model,at){
  if(!isoOk(at))return {tariff:null,reason:'date-unknown'};
  const same=(tariffs||[]).filter(x=>x?.model===model),valid=same.filter(x=>validateTariff(x).ok);
  if(!same.length)return {tariff:null,reason:'no-tariff-for-model'};
  if(!valid.length)return {tariff:null,reason:'tariff-invalid'};
  const t=Date.parse(at),hits=valid.filter(x=>Date.parse(x.validFrom)<=t&&(x.validTo===undefined||t<Date.parse(x.validTo)));
  if(!hits.length)return {tariff:null,reason:'no-tariff-for-date'};
  if(hits.length>1)return {tariff:null,reason:'ambiguous-tariff'};
  return {tariff:hits[0],reason:null};
 }
 const roundDiv=(n,d)=>(n+d/2n)/d; // half-up, non-negative operands
 /* One provider call (an event of api/render.js, optionally with `at` and `id`). Returns the measured usage as reported
    and the estimate, or the precise reason it is unknown. A failed call may still have consumed tokens: when the provider
    reported usage it is estimated like any other; when not, its cost is unknown, never 0. */
 function estimateAttempt(ev,tariffs){
  const u=ev?.usage&&typeof ev.usage==='object'?ev.usage:null;
  const usage={inputText:isInt(u?.inputTextTokens)?u.inputTextTokens:null,inputImage:isInt(u?.inputImageTokens)?u.inputImageTokens:null,output:isInt(u?.outputTokens)?u.outputTokens:null,input:isInt(u?.inputTokens)?u.inputTokens:null,total:isInt(u?.totalTokens)?u.totalTokens:null};
  const base={model:typeof ev?.model==='string'?ev.model:null,status:PROVIDER_STATUSES.includes(ev?.status)?ev.status:'unknown',usage};
  if(!u)return {...base,estimate:null,reason:'usage-unknown'};
  if(usage.output===null)return {...base,estimate:null,reason:'output-tokens-unknown'};
  if(usage.inputText===null||usage.inputImage===null)return {...base,estimate:null,reason:'input-categories-unknown'}; // never split the input by assumption
  if(!base.model)return {...base,estimate:null,reason:'model-unknown'};
  const {tariff,reason}=tariffFor(tariffs,base.model,ev.at);if(!tariff)return {...base,estimate:null,reason};
  const micros=roundDiv(BigInt(usage.inputText)*priceMicros(tariff.perMillion.inputText)+BigInt(usage.inputImage)*priceMicros(tariff.perMillion.inputImage)+BigInt(usage.output)*priceMicros(tariff.perMillion.output),1000000n);
  return {...base,estimate:{micros:Number(micros),currency:tariff.currency,taxIncluded:tariff.taxIncluded,tariffId:tariff.id,basis:'estimate'},reason:null};
 }
 // Display only: micro-units → «0,0123 USD» style string with an explicit half-up rounding to `decimals` (default 4).
 function formatMicros(micros,currency,decimals=4){
  if(!Number.isSafeInteger(micros)||micros<0||!Number.isInteger(decimals)||decimals<0||decimals>6)return null;
  const step=10n**BigInt(6-decimals),v=roundDiv(BigInt(micros),step),s=v.toString().padStart(decimals+1,'0');
  return `${decimals?s.slice(0,-decimals)+','+s.slice(-decimals):s} ${currency}`;
 }
 /* A batch (e.g. one day of logs, or one project): counts, consumption, estimates and acceptance, each with its own
    completeness. acceptances: explicit decisions [{generationId, decision:'accepted'|'rejected', at}] — Rubik does not
    record them today, so they are usually absent and «accepted» stays unknown. A generation can only be matched to a
    decision through an `id` on its event (api/render.js does not write one yet). */
 function summarize(events,{tariffs=[],acceptances=null}={}){
  const list=(Array.isArray(events)?events:[]).filter(e=>e&&e.event==='rubik-render');
  const attempts=list.map(e=>({id:typeof e.id==='string'?e.id:null,...estimateAttempt(e,tariffs)}));
  const ok=attempts.filter(a=>a.status==='ok');
  const sumTokens=k=>attempts.every(a=>a.usage[k]!==null)?attempts.reduce((n,a)=>n+a.usage[k],0):null;
  const currencies=new Set(attempts.filter(a=>a.estimate).map(a=>a.estimate.currency+(a.estimate.taxIncluded?'+tax':'')));
  const allEstimated=attempts.length>0&&attempts.every(a=>a.estimate)&&currencies.size===1;
  const total=allEstimated?attempts.reduce((n,a)=>n+a.estimate.micros,0):null;
  const [currency]=allEstimated?[attempts[0].estimate.currency]:[null];
  let accepted=null,rejected=null,acceptanceReason='no-acceptance-events';
  if(Array.isArray(acceptances)){
   if(ok.some(a=>!a.id))acceptanceReason='generations-without-id';
   else{const byId=new Map();for(const x of acceptances)if(x&&typeof x.generationId==='string'&&['accepted','rejected'].includes(x.decision)&&isoOk(x.at))byId.set(x.generationId,x.decision);
    accepted=ok.filter(a=>byId.get(a.id)==='accepted').length;rejected=ok.filter(a=>byId.get(a.id)==='rejected').length;acceptanceReason=null;}}
  const per=(n)=>total!==null&&Number.isInteger(n)&&n>0?Math.round(total/n):null; // no division by zero, no estimate from partial data
  return {
   attempts:{logged:attempts.length,succeeded:ok.length,failed:attempts.length-ok.length,byStatus:Object.fromEntries(PROVIDER_STATUSES.map(s=>[s,attempts.filter(a=>a.status===s).length]).filter(([,n])=>n))},
   tokens:{inputText:sumTokens('inputText'),inputImage:sumTokens('inputImage'),output:sumTokens('output'),total:sumTokens('total')},
   images:{generated:ok.length,accepted,rejected,acceptanceReason},
   estimate:{totalMicros:total,currency,taxIncluded:allEstimated?attempts[0].estimate.taxIncluded:null,perGeneratedMicros:per(ok.length),perAcceptedMicros:accepted===null?null:per(accepted),
    complete:allEstimated,unknown:attempts.filter(a=>!a.estimate).map(a=>a.reason)},
   note:'Estimación calculada por Rubik; no es facturación. Los intentos rechazados antes de llamar al proveedor (código, límites) no se registran como llamadas.'};
 }
 /* Estimate vs invoice: only comparable with the same currency, the same tax treatment and both amounts known.
    billed: {micros, currency, taxIncluded, period:{from,to}, source:'invoice'} — entered by the owner from the invoice. */
 function reconcile(estimate,billed){
  if(!estimate||!Number.isSafeInteger(estimate.totalMicros))return {comparable:false,reason:'estimate-incomplete'};
  if(!billed||!Number.isSafeInteger(billed.micros)||billed.source!=='invoice')return {comparable:false,reason:'billing-unknown'};
  if(billed.currency!==estimate.currency)return {comparable:false,reason:'currency-differs'};
  if(billed.taxIncluded!==estimate.taxIncluded)return {comparable:false,reason:'tax-basis-differs'};
  const diff=billed.micros-estimate.totalMicros;
  return {comparable:true,differenceMicros:diff,differencePct:estimate.totalMicros?Math.round(diff*10000/estimate.totalMicros)/100:null};
 }
 // Lines exported from the function log: only {"event":"rubik-render"} JSON objects are kept; anything else is ignored.
 function parseLog(text){
  const out=[];for(const line of String(text||'').split(/\r?\n/)){const i=line.indexOf('{"event":"rubik-render"');if(i<0)continue;
   try{const e=JSON.parse(line.slice(i));if(e&&e.event==='rubik-render')out.push(e);}catch{}}
  return out;
 }
 return Object.freeze({PROVIDER_STATUSES,validateTariff,tariffFor,estimateAttempt,formatMicros,summarize,reconcile,parseLog});
});
