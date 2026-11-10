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
 /* TIME CONTRACT (real format, verified against the master log on 10/11): the JSON that api/render.js writes has NO date
    and NO id. The date of a call is the timestamp of the platform's log record (Vercel), which surrounds the JSON, and
    the platform request id identifies the record. parseLog() keeps both as `loggedAt` and `requestId`, marked as
    coming from the platform. `at` inside the JSON is only used if a future version of api/render.js writes it (not
    today; that change needs authorisation). Without either, the date is unknown and no tariff is chosen. */
 const dateOf=ev=>isoOk(ev?.at)?{at:ev.at,source:'event'}:isoOk(ev?.loggedAt)?{at:ev.loggedAt,source:'platform-log'}:{at:null,source:null};
 const MAX=BigInt(Number.MAX_SAFE_INTEGER);
 const safeNum=b=>b<=MAX?Number(b):null; // BigInt → Number only when exact
 /* One provider call. Returns the measured usage as reported and the estimate, or the precise reason it is unknown. A
    failed call may still have consumed tokens: when the provider reported usage it is estimated like any other; when
    not, its cost is unknown, never 0. */
 function estimateAttempt(ev,tariffs){
  const u=ev?.usage&&typeof ev.usage==='object'?ev.usage:null;
  const usage={inputText:isInt(u?.inputTextTokens)?u.inputTextTokens:null,inputImage:isInt(u?.inputImageTokens)?u.inputImageTokens:null,output:isInt(u?.outputTokens)?u.outputTokens:null,input:isInt(u?.inputTokens)?u.inputTokens:null,total:isInt(u?.totalTokens)?u.totalTokens:null};
  const date=dateOf(ev);
  const base={model:typeof ev?.model==='string'?ev.model:null,status:PROVIDER_STATUSES.includes(ev?.status)?ev.status:'unknown',usage,at:date.at,dateSource:date.source};
  if(!u)return {...base,estimate:null,reason:'usage-unknown'};
  if(usage.output===null)return {...base,estimate:null,reason:'output-tokens-unknown'};
  if(usage.inputText===null||usage.inputImage===null)return {...base,estimate:null,reason:'input-categories-unknown'}; // never split the input by assumption
  if(!base.model)return {...base,estimate:null,reason:'model-unknown'};
  const {tariff,reason}=tariffFor(tariffs,base.model,date.at);if(!tariff)return {...base,estimate:null,reason};
  const micros=safeNum(roundDiv(BigInt(usage.inputText)*priceMicros(tariff.perMillion.inputText)+BigInt(usage.inputImage)*priceMicros(tariff.perMillion.inputImage)+BigInt(usage.output)*priceMicros(tariff.perMillion.output),1000000n));
  if(micros===null)return {...base,estimate:null,reason:'amount-out-of-range'};
  return {...base,estimate:{micros,currency:tariff.currency,taxIncluded:tariff.taxIncluded,tariffId:tariff.id,basis:'estimate'},reason:null};
 }
 // Display only: micro-units → «0,0123 USD» style string with an explicit half-up rounding to `decimals` (default 4).
 function formatMicros(micros,currency,decimals=4){
  if(!Number.isSafeInteger(micros)||micros<0||!Number.isInteger(decimals)||decimals<0||decimals>6)return null;
  const step=10n**BigInt(6-decimals),v=roundDiv(BigInt(micros),step),s=v.toString().padStart(decimals+1,'0');
  return `${decimals?s.slice(0,-decimals)+','+s.slice(-decimals):s} ${currency}`;
 }
 // Exact sum in BigInt; null when any part is unknown or the result is not a safe integer.
 const exactSum=vals=>{if(vals.some(v=>v===null))return {value:null,reason:'incomplete'};const b=vals.reduce((n,v)=>n+BigInt(v),0n);const v=safeNum(b);return v===null?{value:null,reason:'out-of-range'}:{value:v,reason:null};};
 /* A batch of calls (e.g. the export of one log window).
    coverage {from, to, complete}: the window the events were taken from and whether the export is declared COMPLETE
    for it (every call of the window is present). Without it, or with an event outside it or without a date, the period
    of the estimate is unknown and it cannot be compared with an invoice.
    acceptances {entries:[{generationId, decision:'accepted'|'rejected', at}], complete}: explicit decisions, and whether
    that register is declared complete. Three distinct states, never confused:
      - 'unknown'  : no register (today: Rubik records no decision) → accepted = null;
      - 'partial'  : a register not declared complete → only a lower bound (acceptedAtLeast), accepted = null;
      - 'complete' : complete register → exact counts, including a true 0.
    Generations can only be matched through an id; the real events have none, so with a register the status is
    'unmatchable' until api/render.js returns an id (needs authorisation). */
 function summarize(events,{tariffs=[],acceptances=null,coverage=null}={}){
  const list=(Array.isArray(events)?events:[]).filter(e=>e&&e.event==='rubik-render');
  const attempts=list.map(e=>({id:typeof e.id==='string'?e.id:null,...estimateAttempt(e,tariffs)}));
  const ok=attempts.filter(a=>a.status==='ok');
  const tokens={};const tokenReasons={};
  for(const k of ['inputText','inputImage','output','total']){const r=exactSum(attempts.map(a=>a.usage[k]));tokens[k]=r.value;if(r.reason)tokenReasons[k]=r.reason;}
  const kinds=new Set(attempts.filter(a=>a.estimate).map(a=>a.estimate.currency+(a.estimate.taxIncluded?'+tax':'')));
  const allEstimated=attempts.length>0&&attempts.every(a=>a.estimate)&&kinds.size===1;
  let total=null,totalReason=null;
  if(allEstimated){const r=exactSum(attempts.map(a=>a.estimate.micros));total=r.value;totalReason=r.reason?'amount-out-of-range':null;}
  // Period of the estimate: only a declared window that contains every (dated) event.
  let period=null,periodReason='coverage-unknown';
  if(coverage&&isoOk(coverage.from)&&isoOk(coverage.to)&&Date.parse(coverage.from)<Date.parse(coverage.to)){
   const f=Date.parse(coverage.from),t=Date.parse(coverage.to);
   if(attempts.some(a=>!a.at))periodReason='event-date-unknown';
   else if(attempts.some(a=>Date.parse(a.at)<f||Date.parse(a.at)>=t))periodReason='event-outside-coverage';
   else{period={from:coverage.from,to:coverage.to,complete:coverage.complete===true};periodReason=null;}}
  // Acceptance states.
  let acceptance={status:'unknown',accepted:null,rejected:null,undecided:null,acceptedAtLeast:null};
  if(acceptances&&Array.isArray(acceptances.entries)){
   if(ok.some(a=>!a.id))acceptance={...acceptance,status:'unmatchable'};
   else{const byId=new Map();for(const x of acceptances.entries)if(x&&typeof x.generationId==='string'&&['accepted','rejected'].includes(x.decision)&&isoOk(x.at))byId.set(x.generationId,x.decision);
    const acc=ok.filter(a=>byId.get(a.id)==='accepted').length,rej=ok.filter(a=>byId.get(a.id)==='rejected').length;
    acceptance=acceptances.complete===true?{status:'complete',accepted:acc,rejected:rej,undecided:ok.length-acc-rej,acceptedAtLeast:acc}:{status:'partial',accepted:null,rejected:null,undecided:null,acceptedAtLeast:acc};}}
  const per=n=>total!==null&&Number.isInteger(n)&&n>0?Math.round(total/n):null; // no division by zero, no estimate from partial data
  return {
   attempts:{logged:attempts.length,succeeded:ok.length,failed:attempts.length-ok.length,byStatus:Object.fromEntries(PROVIDER_STATUSES.map(s=>[s,attempts.filter(a=>a.status===s).length]).filter(([,n])=>n)),
    datedFrom:{event:attempts.filter(a=>a.dateSource==='event').length,platformLog:attempts.filter(a=>a.dateSource==='platform-log').length,unknown:attempts.filter(a=>!a.dateSource).length}},
   tokens,tokenReasons,
   images:{generated:ok.length,acceptance},
   estimate:{totalMicros:total,currency:allEstimated?attempts[0].estimate.currency:null,taxIncluded:allEstimated?attempts[0].estimate.taxIncluded:null,
    perGeneratedMicros:per(ok.length),perAcceptedMicros:acceptance.status==='complete'?per(acceptance.accepted):null,
    complete:allEstimated&&total!==null,unknown:[...attempts.filter(a=>!a.estimate).map(a=>a.reason),...(totalReason?[totalReason]:[])],period,periodReason},
   note:'Estimación calculada por Rubik; no es facturación. Los intentos rechazados antes de llamar al proveedor (código, límites) no se registran como llamadas.'};
 }
 /* Estimate vs invoice: only when both are known, with the same currency and tax treatment, and the estimate covers
    EXACTLY the billed period with a complete export of calls. Otherwise the reason, never a misleading difference.
    billed: {micros, currency, taxIncluded, period:{from,to}, source:'invoice'} — entered by the owner from the invoice. */
 function reconcile(estimate,billed){
  if(!estimate||!Number.isSafeInteger(estimate.totalMicros))return {comparable:false,reason:'estimate-incomplete'};
  if(!billed||!Number.isSafeInteger(billed.micros)||billed.micros<0||billed.source!=='invoice')return {comparable:false,reason:'billing-unknown'};
  if(billed.currency!==estimate.currency)return {comparable:false,reason:'currency-differs'};
  if(billed.taxIncluded!==estimate.taxIncluded)return {comparable:false,reason:'tax-basis-differs'};
  if(!billed.period||!isoOk(billed.period.from)||!isoOk(billed.period.to))return {comparable:false,reason:'billing-period-unknown'};
  if(!estimate.period)return {comparable:false,reason:'estimate-period-unknown'};
  if(Date.parse(estimate.period.from)!==Date.parse(billed.period.from)||Date.parse(estimate.period.to)!==Date.parse(billed.period.to))return {comparable:false,reason:'period-differs'};
  if(estimate.period.complete!==true)return {comparable:false,reason:'coverage-incomplete'};
  const diff=billed.micros-estimate.totalMicros;
  return {comparable:true,differenceMicros:diff,differencePct:estimate.totalMicros?Math.round(diff*10000/estimate.totalMicros)/100:null};
 }
 /* Function-log exports. Two real shapes are understood:
    (a) one line per record: «<ISO timestamp> … {"event":"rubik-render",…}» (timestamp at the start of the line);
    (b) the multi-line record of the Vercel runtime-logs export: «### <ISO timestamp> POST /api/render …», a metadata
        line with «request=<id>», then the JSON line.
    Only {"event":"rubik-render"} objects are kept. `loggedAt` and `requestId` come from the platform record, never
    invented; when the record has no timestamp they stay absent. Anything that is not a rubik-render JSON is ignored. */
 const ISO_RE=/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?Z)/;
 function parseLog(text){
  const out=[];let stamp=null,request=null;
  for(const line of String(text||'').split(/\r?\n/)){
   const header=/^#{1,6}\s+/.test(line)?ISO_RE.exec(line):null;
   if(header){stamp=header[1];request=null;continue;}
   const rq=/(?:^|\s)request=([A-Za-z0-9_.:-]{1,128})(?:\s|$)/.exec(line);if(rq&&!line.includes('{"event"')){request=rq[1];continue;}
   const i=line.indexOf('{"event":"rubik-render"');if(i<0)continue;
   let e;try{e=JSON.parse(line.slice(i));}catch{continue;}
   if(!e||e.event!=='rubik-render')continue;
   const inline=ISO_RE.exec(line.slice(0,i)),loggedAt=inline?inline[1]:stamp;
   out.push({...e,...(loggedAt&&isoOk(loggedAt)?{loggedAt}:{}),...(request?{requestId:request}:{})});
   stamp=null;request=null;
  }
  return out;
 }
 return Object.freeze({PROVIDER_STATUSES,validateTariff,tariffFor,estimateAttempt,formatMicros,summarize,reconcile,parseLog});
});
