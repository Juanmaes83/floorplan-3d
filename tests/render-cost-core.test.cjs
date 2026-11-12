// ECO-01 · measurement model of the AI render. Fictitious tariffs and events only: these prices are NOT real prices
// and must never be used as such. No provider call, no credential, no network.
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../js/render-cost-core.js');
const T={id:'fixture-model-a-2026',model:'fixture-model-a',currency:'USD',validFrom:'2026-01-01T00:00:00Z',validTo:'2027-01-01T00:00:00Z',taxIncluded:false,
 source:{kind:'provider-pricing-page',reference:'FICTITIOUS — test fixture',checkedAt:'2026-11-10T00:00:00Z'},perMillion:{inputText:'5',inputImage:'10.5',output:'40'}};
// Same shape as the real api/render.js event (no date or id inside the JSON) plus `loggedAt`, which parseLog() takes
// from the platform log record.
const ev=(o={})=>({event:'rubik-render',model:'fixture-model-a',style:'natural',floor:null,walls:null,status:'ok',ms:21317,loggedAt:'2026-11-09T13:55:31.050Z',usage:{inputTokens:1395,outputTokens:601,totalTokens:1996,inputTextTokens:95,inputImageTokens:1300},cost:null,...o});

test('ECO-01: known usage and a valid tariff give an integer estimate, never a float',()=>{
 const a=C.estimateAttempt(ev(),[T]);
 // 95×5 + 1300×10.5 + 601×40 = 475 + 13 650 + 24 040 = 38 165 USD per 1e6 tokens → 0.038165 USD = 38 165 µUSD
 assert.deepEqual(a.estimate,{micros:38165,currency:'USD',taxIncluded:false,tariffId:T.id,basis:'estimate'});
 assert.equal(a.reason,null);assert.equal(C.formatMicros(38165,'USD'),'0,0382 USD');assert.equal(C.formatMicros(38165,'USD',2),'0,04 USD');
 assert.equal(C.formatMicros(5,'USD',6),'0,000005 USD');assert.equal(C.formatMicros(-1,'USD'),null);
 // Half-up rounding at the micro-unit: 1 token × 0.5 USD/1e6 = 0.5 µUSD → 1 µUSD.
 assert.equal(C.estimateAttempt(ev({usage:{inputTextTokens:1,inputImageTokens:0,outputTokens:0}}),[{...T,perMillion:{inputText:'0.5',inputImage:'0',output:'0'}}]).estimate.micros,1);
});

test('ECO-01: the D1 generation — 1 996 tokens measured, no tariff → cost unknown, not 0',()=>{
 const d1=ev({model:'gpt-image-2.5-sunburst'});const a=C.estimateAttempt(d1,[]);
 assert.equal(a.estimate,null);assert.equal(a.reason,'no-tariff-for-model');assert.equal(a.usage.total,1996);
 const s=C.summarize([d1]);
 assert.equal(s.tokens.total,1996);assert.equal(s.estimate.totalMicros,null);assert.equal(s.estimate.complete,false);assert.deepEqual(s.estimate.unknown,['no-tariff-for-model']);
 assert.equal(s.images.generated,1);assert.deepEqual(s.images.acceptance,{status:'unknown',accepted:null,rejected:null,undecided:null,acceptedAtLeast:null},'generated is not accepted');
});

test('ECO-01: tariffs are validated, bound to a model and a period, and never inferred from a name',()=>{
 assert.equal(C.validateTariff(T).ok,true);
 for(const [k,v] of [['currency','GBP'],['taxIncluded',undefined],['validFrom','soon'],['id','X'],['model','']])assert.ok(!C.validateTariff({...T,[k]:v}).ok,k);
 assert.ok(!C.validateTariff({...T,perMillion:{...T.perMillion,output:'1e3'}}).ok,'no exponent');
 assert.ok(!C.validateTariff({...T,perMillion:{...T.perMillion,output:40}}).ok,'decimal string, not a float');
 assert.ok(!C.validateTariff({...T,source:{kind:'guess',reference:'x',checkedAt:'2026-11-10T00:00:00Z'}}).ok,'verified source only');
 assert.ok(!C.validateTariff({...T,validTo:'2025-01-01T00:00:00Z'}).ok);
 assert.equal(C.estimateAttempt(ev({model:'fixture-model-a-mini'}),[T]).reason,'no-tariff-for-model','similar name ≠ same model');
 assert.equal(C.estimateAttempt(ev({loggedAt:'2027-03-01T00:00:00Z'}),[T]).reason,'no-tariff-for-date');
 assert.equal(C.estimateAttempt(ev({loggedAt:undefined}),[T]).reason,'date-unknown');
 assert.equal(C.estimateAttempt(ev(),[T,{...T,id:'fixture-dup'}]).reason,'ambiguous-tariff');
 assert.equal(C.estimateAttempt(ev(),[{...T,currency:'GBP'}]).reason,'tariff-invalid','an invalid tariff is never used');
});

test('ECO-01: incomplete categories, failed attempts and missing usage stay unknown',()=>{
 assert.equal(C.estimateAttempt(ev({usage:{inputTokens:1395,outputTokens:601,totalTokens:1996}}),[T]).reason,'input-categories-unknown','input is never split by assumption');
 assert.equal(C.estimateAttempt(ev({usage:{inputTextTokens:95,inputImageTokens:1300}}),[T]).reason,'output-tokens-unknown');
 assert.equal(C.estimateAttempt(ev({usage:null,status:'provider-unreachable'}),[T]).reason,'usage-unknown');
 // A failed call that reported usage is estimated like any other (it may have consumed).
 const failed=C.estimateAttempt(ev({status:'provider-empty'}),[T]);assert.equal(failed.estimate.micros,38165);assert.equal(failed.status,'provider-empty');
 assert.equal(C.estimateAttempt(ev({usage:{inputTextTokens:-1,inputImageTokens:1,outputTokens:1}}),[T]).reason,'input-categories-unknown','negative is not a count');
});

test('ECO-01: a batch — counts, totals, per-image figures, and no division by zero',()=>{
 const s=C.summarize([ev(),ev({status:'provider-rate-limit',usage:null}),ev({status:'ok'})],{tariffs:[T]});
 assert.deepEqual(s.attempts,{logged:3,succeeded:2,failed:1,byStatus:{'ok':2,'provider-rate-limit':1},datedFrom:{event:0,platformLog:3,unknown:0}});
 assert.equal(s.estimate.complete,false,'one attempt without usage makes the total incomplete');assert.equal(s.estimate.totalMicros,null);assert.equal(s.estimate.perGeneratedMicros,null);
 assert.equal(s.tokens.total,null,'a total over partial data is not reported');
 const full=C.summarize([ev(),ev()],{tariffs:[T]});
 assert.equal(full.estimate.totalMicros,76330);assert.equal(full.estimate.perGeneratedMicros,38165);assert.equal(full.estimate.perAcceptedMicros,null);assert.equal(full.tokens.total,3992);
 const none=C.summarize([ev({status:'provider-error'})],{tariffs:[T]});assert.equal(none.images.generated,0);assert.equal(none.estimate.perGeneratedMicros,null,'0 images → no per-image cost');
 assert.equal(C.summarize([]).estimate.totalMicros,null);
 // Different currencies are never added.
 const eur={...T,id:'fixture-model-b-eur',model:'fixture-model-b',currency:'EUR'};
 assert.equal(C.summarize([ev(),ev({model:'fixture-model-b'})],{tariffs:[T,eur]}).estimate.totalMicros,null);
});

test('ECO-01: acceptance — unknown, partial and complete are different; download is not acceptance',()=>{
 const gens=[ev({id:'gen_1'}),ev({id:'gen_2'}),ev({id:'gen_3'})];
 const entries=[{generationId:'gen_1',decision:'accepted',at:'2026-11-10T10:00:00Z'},{generationId:'gen_2',decision:'rejected',at:'2026-11-10T10:00:00Z'},{generationId:'gen_3',decision:'downloaded',at:'2026-11-10T10:00:00Z'}];
 const full=C.summarize(gens,{tariffs:[T],acceptances:{entries,complete:true}});
 assert.deepEqual(full.images.acceptance,{status:'complete',accepted:1,rejected:1,undecided:1,acceptedAtLeast:1});assert.equal(full.estimate.perAcceptedMicros,114495,'all three generations / one accepted');
 // Same decisions from a register NOT declared complete: only a lower bound, never an exact count.
 const part=C.summarize(gens,{tariffs:[T],acceptances:{entries}});
 assert.deepEqual(part.images.acceptance,{status:'partial',accepted:null,rejected:null,undecided:null,acceptedAtLeast:1});assert.equal(part.estimate.perAcceptedMicros,null);
 // An empty list is NOT «zero accepted» unless the register is declared complete.
 assert.equal(C.summarize(gens,{tariffs:[T],acceptances:{entries:[]}}).images.acceptance.status,'partial');
 assert.equal(C.summarize(gens,{tariffs:[T],acceptances:{entries:[]}}).images.acceptance.accepted,null);
 const zero=C.summarize(gens,{tariffs:[T],acceptances:{entries:[],complete:true}});assert.equal(zero.images.acceptance.accepted,0,'a true zero needs a complete register');assert.equal(zero.estimate.perAcceptedMicros,null,'no division by zero');
 // No register at all → unknown; real events (no id) → unmatchable.
 assert.equal(C.summarize(gens,{tariffs:[T]}).images.acceptance.status,'unknown');
 assert.equal(C.summarize([ev(),ev()],{tariffs:[T],acceptances:{entries:[],complete:true}}).images.acceptance.status,'unmatchable');
});

const COV={from:'2026-11-01T00:00:00Z',to:'2026-12-01T00:00:00Z',complete:true},BILL={micros:80000,currency:'USD',taxIncluded:false,source:'invoice',period:{from:'2026-11-01T00:00:00Z',to:'2026-12-01T00:00:00Z'}};
test('ECO-01: estimate vs invoice only with the same currency, tax basis AND period, from a complete export',()=>{
 const est=C.summarize([ev(),ev()],{tariffs:[T],coverage:COV}).estimate;
 assert.deepEqual(est.period,COV);
 assert.deepEqual(C.reconcile(est,BILL),{comparable:true,differenceMicros:3670,differencePct:4.81});
 assert.equal(C.reconcile(est,{...BILL,taxIncluded:true}).reason,'tax-basis-differs');
 assert.equal(C.reconcile(est,{...BILL,currency:'EUR'}).reason,'currency-differs');
 assert.equal(C.reconcile(est,{...BILL,source:'estimate'}).reason,'billing-unknown','an estimate is never called billing');
 assert.equal(C.reconcile({totalMicros:null},BILL).reason,'estimate-incomplete');
 // Periods: a different billed month, an unknown period, a partial export — no difference is computed.
 assert.equal(C.reconcile(est,{...BILL,period:{from:'2026-10-01T00:00:00Z',to:'2026-11-01T00:00:00Z'}}).reason,'period-differs');
 assert.equal(C.reconcile(est,{...BILL,period:undefined}).reason,'billing-period-unknown');
 assert.equal(C.reconcile(C.summarize([ev(),ev()],{tariffs:[T]}).estimate,BILL).reason,'estimate-period-unknown');
 assert.equal(C.reconcile(C.summarize([ev(),ev()],{tariffs:[T],coverage:{...COV,complete:false}}).estimate,BILL).reason,'coverage-incomplete');
 // An event outside the declared window, or without date, makes the period unknown.
 const out=C.summarize([ev(),ev({loggedAt:'2026-12-02T00:00:00Z'})],{tariffs:[T],coverage:COV}).estimate;
 assert.equal(out.period,null);assert.equal(out.periodReason,'event-outside-coverage');
 assert.equal(C.summarize([ev({loggedAt:undefined})],{tariffs:[T],coverage:COV}).estimate.periodReason,'event-date-unknown');
});

test('ECO-01: parseLog on the REAL format of master (anonymised Vercel runtime-log record, verified 10/11)',()=>{
 // Structure copied from the production record of the D1 generation; deployment, request id and domain replaced by
 // fixtures. The JSON is exactly what api/render.js writes: no date and no id inside it.
 const real=['### 2026-11-09T13:55:31.050Z POST /api/render [info/function]',
  'dep=dpl_FIXTURE branch=master request=req-fixture-0001 domain=example.vercel.app environment=production region=cdg1 runtime=nodejs24.x stream=stdout',
  '    {"event":"rubik-render","model":"gpt-image-2.5-sunburst","style":"natural","floor":null,"walls":null,"status":"ok","ms":21317,"usage":{"inputTokens":1395,"outputTokens":601,"totalTokens":1996,"inputTextTokens":95,"inputImageTokens":1300},"cost":null}'].join('\n');
 const [e]=C.parseLog(real);
 assert.equal(e.at,undefined,'no date inside the JSON');assert.equal(e.id,undefined,'no id inside the JSON');
 assert.equal(e.loggedAt,'2026-11-09T13:55:31.050Z','date taken from the platform record');assert.equal(e.requestId,'req-fixture-0001');
 assert.equal(e.usage.totalTokens,1996);
 const a=C.estimateAttempt(e,[{...T,model:'gpt-image-2.5-sunburst'}]);assert.equal(a.dateSource,'platform-log');assert.equal(a.at,'2026-11-09T13:55:31.050Z');assert.ok(a.estimate);
 // Without the platform record, the bare JSON line has no date: the tariff cannot be chosen.
 const bare=C.parseLog(real.split('\n')[2]);assert.equal(bare[0].loggedAt,undefined);assert.equal(C.estimateAttempt(bare[0],[{...T,model:'gpt-image-2.5-sunburst'}]).reason,'date-unknown');
 // One-line exports with the timestamp at the start; a future `at` inside the JSON takes precedence and is labelled.
 const one=C.parseLog('2026-11-09T13:55:31Z info {"event":"rubik-render","model":"m","status":"ok","usage":null,"cost":null}');assert.equal(one[0].loggedAt,'2026-11-09T13:55:31Z');
 assert.equal(C.estimateAttempt(ev({at:'2026-11-09T10:00:00Z'}),[T]).dateSource,'event');
 // Noise, other events, broken JSON and two records in a row (dates never leak from one record to the next).
 const two=[real,'random line','{"event":"other"}','{"event":"rubik-render",broken','    {"event":"rubik-render","model":"m","status":"ok","usage":null,"cost":null}'].join('\n');
 const parsed=C.parseLog(two);assert.equal(parsed.length,2);assert.equal(parsed[1].loggedAt,undefined,'the second record had no header');
 assert.deepEqual(C.parseLog(''),[]);
});

test('ECO-01: numbers stay exact — huge amounts and sums are refused, never rounded silently',()=>{
 const big=ev({usage:{inputTextTokens:0,inputImageTokens:0,outputTokens:Number.MAX_SAFE_INTEGER}});
 assert.equal(C.estimateAttempt(big,[{...T,perMillion:{inputText:'0',inputImage:'0',output:'999999'}}]).reason,'amount-out-of-range');
 const s=C.summarize([big,big],{tariffs:[]});assert.equal(s.tokens.output,null);assert.equal(s.tokenReasons.output,'out-of-range');
 // Each estimate is safe but their sum is not.
 const half=ev({usage:{inputTextTokens:0,inputImageTokens:0,outputTokens:Math.floor(Number.MAX_SAFE_INTEGER*0.6/999999)}});
 const t={...T,perMillion:{inputText:'0',inputImage:'0',output:'999999'}};
 const one=C.estimateAttempt(half,[t]);assert.ok(Number.isSafeInteger(one.estimate.micros));
 const sum=C.summarize([half,half],{tariffs:[t]});assert.equal(sum.estimate.totalMicros,null);assert.ok(sum.estimate.unknown.includes('amount-out-of-range'));assert.equal(sum.estimate.complete,false);
 assert.equal(C.estimateAttempt(ev({usage:{inputTextTokens:2**53,inputImageTokens:0,outputTokens:1}}),[T]).reason,'input-categories-unknown','an unsafe count is not a count');
});
