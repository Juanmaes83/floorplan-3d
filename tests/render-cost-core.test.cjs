// ECO-01 · measurement model of the AI render. Fictitious tariffs and events only: these prices are NOT real prices
// and must never be used as such. No provider call, no credential, no network.
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../js/render-cost-core.js');
const T={id:'fixture-model-a-2026',model:'fixture-model-a',currency:'USD',validFrom:'2026-01-01T00:00:00Z',validTo:'2027-01-01T00:00:00Z',taxIncluded:false,
 source:{kind:'provider-pricing-page',reference:'FICTITIOUS — test fixture',checkedAt:'2026-11-10T00:00:00Z'},perMillion:{inputText:'5',inputImage:'10.5',output:'40'}};
const ev=(o={})=>({event:'rubik-render',model:'fixture-model-a',status:'ok',at:'2026-11-09T13:55:31Z',usage:{inputTokens:1395,outputTokens:601,totalTokens:1996,inputTextTokens:95,inputImageTokens:1300},cost:null,...o});

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
 assert.equal(s.images.generated,1);assert.equal(s.images.accepted,null,'generated is not accepted');assert.equal(s.images.acceptanceReason,'no-acceptance-events');
});

test('ECO-01: tariffs are validated, bound to a model and a period, and never inferred from a name',()=>{
 assert.equal(C.validateTariff(T).ok,true);
 for(const [k,v] of [['currency','GBP'],['taxIncluded',undefined],['validFrom','soon'],['id','X'],['model','']])assert.ok(!C.validateTariff({...T,[k]:v}).ok,k);
 assert.ok(!C.validateTariff({...T,perMillion:{...T.perMillion,output:'1e3'}}).ok,'no exponent');
 assert.ok(!C.validateTariff({...T,perMillion:{...T.perMillion,output:40}}).ok,'decimal string, not a float');
 assert.ok(!C.validateTariff({...T,source:{kind:'guess',reference:'x',checkedAt:'2026-11-10T00:00:00Z'}}).ok,'verified source only');
 assert.ok(!C.validateTariff({...T,validTo:'2025-01-01T00:00:00Z'}).ok);
 assert.equal(C.estimateAttempt(ev({model:'fixture-model-a-mini'}),[T]).reason,'no-tariff-for-model','similar name ≠ same model');
 assert.equal(C.estimateAttempt(ev({at:'2027-03-01T00:00:00Z'}),[T]).reason,'no-tariff-for-date');
 assert.equal(C.estimateAttempt(ev({at:undefined}),[T]).reason,'date-unknown');
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
 assert.deepEqual(s.attempts,{logged:3,succeeded:2,failed:1,byStatus:{'ok':2,'provider-rate-limit':1}});
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

test('ECO-01: acceptance only from explicit decisions matched by id; download is not acceptance',()=>{
 const gens=[ev({id:'gen_1'}),ev({id:'gen_2'}),ev({id:'gen_3'})];
 const s=C.summarize(gens,{tariffs:[T],acceptances:[{generationId:'gen_1',decision:'accepted',at:'2026-11-10T10:00:00Z'},{generationId:'gen_2',decision:'rejected',at:'2026-11-10T10:00:00Z'},{generationId:'gen_3',decision:'downloaded',at:'2026-11-10T10:00:00Z'}]});
 assert.equal(s.images.accepted,1);assert.equal(s.images.rejected,1);assert.equal(s.estimate.perAcceptedMicros,114495,'all three generations / one accepted');
 const noIds=C.summarize([ev(),ev()],{tariffs:[T],acceptances:[]});assert.equal(noIds.images.accepted,null);assert.equal(noIds.images.acceptanceReason,'generations-without-id');
 const zero=C.summarize(gens,{tariffs:[T],acceptances:[]});assert.equal(zero.images.accepted,0);assert.equal(zero.estimate.perAcceptedMicros,null,'no division by zero');
});

test('ECO-01: estimate vs invoice only when comparable; logs are parsed defensively',()=>{
 const est=C.summarize([ev(),ev()],{tariffs:[T]}).estimate;
 assert.deepEqual(C.reconcile(est,{micros:80000,currency:'USD',taxIncluded:false,source:'invoice'}),{comparable:true,differenceMicros:3670,differencePct:4.81});
 assert.equal(C.reconcile(est,{micros:80000,currency:'USD',taxIncluded:true,source:'invoice'}).reason,'tax-basis-differs');
 assert.equal(C.reconcile(est,{micros:80000,currency:'EUR',taxIncluded:false,source:'invoice'}).reason,'currency-differs');
 assert.equal(C.reconcile(est,{micros:80000,currency:'USD',taxIncluded:false,source:'estimate'}).reason,'billing-unknown','an estimate is never called billing');
 assert.equal(C.reconcile({totalMicros:null},{micros:1,currency:'USD',taxIncluded:false,source:'invoice'}).reason,'estimate-incomplete');
 const log=['2026-11-09T13:55:31Z info {"event":"rubik-render","model":"m","status":"ok","usage":null,"cost":null}','random line','{"event":"other"}','{"event":"rubik-render",broken'].join('\n');
 assert.deepEqual(C.parseLog(log).map(e=>e.status),['ok']);
 assert.deepEqual(C.parseLog(''),[]);
});
