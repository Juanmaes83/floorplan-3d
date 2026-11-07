'use strict';
/* FT3D-8 · M1 · S2 — cost catalogue orchestration over the EXISTING providers (BCCA adapter, BC3, tariff), the budget
   bridge and the C1–C4 engine. Synthetic data only (all codes and prices invented). Each test names its requirement. */
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../js/cost-catalog-core.js'),Budget=require('../js/budget-core.js'),Bc3=require('../js/bc3-budget-core.js');
const E=require('./fixtures/bcca-es/editions.cjs'),T=require('./fixtures/bc3/synthetic-tariff.cjs'),S=require('./fixtures/bcca-es/synthetic.cjs');

const ed=year=>C.bccaSource({model:E.model(year==='2024'?E.e2024:E.e2025),datasetMode:'synthetic',source:E.source(year)});
const deepFrozenCopy=o=>{const c=JSON.parse(JSON.stringify(o));(function f(x){if(x&&typeof x==='object'){Object.freeze(x);Object.values(x).forEach(f);}})(c);return c;};
function budget(version='1.1.0'){
  let b=Budget.createBudget({id:'bud_m1-syn',subject:{type:'project',id:'prj_m1-syn'},title:'SYNTHETIC TEST ONLY',taxRatePercent:21});
  b.chapters.push(Budget.createChapter({id:'ch1',title:'Albañilería',order:1}));
  const q=(value,unit)=>Budget.manualQuantity({value,unit,status:'measured'});
  b.items.push(Budget.createItem({id:'it-fab',chapterId:'ch1',description:'Fábrica',quantity:q(40,'m2')}));
  b.items.push(Budget.createItem({id:'it-pue',chapterId:'ch1',description:'Puertas',quantity:q(5,'unit')}));
  b.items.push(Budget.createItem({id:'it-rod',chapterId:'ch1',description:'Rodapié',quantity:q(60,'m')}));
  b.items.push(Budget.createItem({id:'it-pin',chapterId:'ch1',description:'Pintura',quantity:q(120,'m2')}));
  b=Budget.validateBudget(b);
  if(version==='1.0.0'){b=JSON.parse(JSON.stringify(b));b.schemaVersion='1.0.0';b.items.forEach(i=>delete i.priceReference);b=Budget.validateBudget(b);}
  return b;
}
async function applyPrice(b,source,itemId,code,opts={}){
  const r=await source.quote(code);assert.equal(r.status,'available',`${code}: ${r.reason}`);
  const p=C.previewApply(b,itemId,r.quote,opts);assert.equal(p.ok,true,JSON.stringify(p.blockers));
  return C.apply(b,p,{confirmed:true,decidedAt:'2026-11-05T10:00:00Z',...opts}).budget;
}

test('FT8-S2-01 · search by code, text and family; each result keeps its own edition and region (never mixed)',async()=>{
  const a=ed('2024'),b=ed('2025');assert.equal(a.status,'available');assert.equal(b.status,'available');
  assert.notEqual(a.source.id,b.source.id);assert.equal(a.source.edition,'2024');assert.equal(b.source.edition,'2025');
  assert.equal(a.source.region,'Andalucía, España');
  const byCode=await C.searchAll([a,b],{code:'SYN-FAB'});
  assert.deepEqual(byCode.groups.map(g=>[g.source.edition,g.items.map(i=>i.code)]),[['2024',['SYN-FAB']],['2025',['SYN-FAB']]]);
  const byText=await C.searchAll([a],{text:'puerta'});assert.deepEqual(byText.groups[0].items.map(i=>i.code),['SYN-PUE']);
  assert.deepEqual(a.source.families,['Albañilería ficticia','Movimiento de tierras ficticio']);
  const byFamily=await C.searchAll([a],{text:'ficti',family:'Movimiento de tierras ficticio'});
  assert.deepEqual(byFamily.groups[0].items.map(i=>i.code),['SYN-EXC']);
  assert.equal((await C.searchAll([a],{text:'x'})).reason,'query-too-short');
  // Three kinds kept apart: BCCA, BC3 supplied and the studio's own tariff.
  const bc3=C.bc3Source({bytes:T.bytes(),fileName:'base.bc3'}),tariff=C.bc3Source({bytes:T.bytes(),fileName:'tarifa.bc3',kind:'tariff'});
  assert.deepEqual([a.source.kind,bc3.source.kind,tariff.source.kind],['bcca','bc3','tariff']);
  assert.match(tariff.source.label,/^Tarifa/);assert.deepEqual(tariff.source.columns,['Zona A','Zona B']);
});

test('FT8-S2-02 · a quote shows code, description, unit, currency, price, edition, date and source',async()=>{
  const r=await ed('2025').quote('SYN-FAB');assert.equal(r.state,'found');
  const q=r.quote;assert.deepEqual([q.code,q.description,q.unit,q.currency,q.unitPrice,q.priceKind],['SYN-FAB','Fábrica de ladrillo ficticia','m2','EUR',33.7,'reference']);
  assert.deepEqual([q.source.edition,q.source.asOf,q.source.region],['2025','2025-01-01','Andalucía, España']);
  assert.match(q.source.label,/SYNTHETIC TEST ONLY/);
});

test('FT8-S2-03 · compare reference, tariff and current price WITHOUT applying anything',async()=>{
  const b0=await applyPrice(budget(),ed('2024'),'it-fab','SYN-FAB');const frozen=deepFrozenCopy(b0);
  const ref=await ed('2025').quote('SYN-FAB'),tar=await C.bc3Source({bytes:T.bytes(),kind:'tariff'}).quote('PINT-LISA',{column:0});
  const cmp=C.compare(frozen,'it-fab',[{source:ed('2025').source,quote:ref.quote},{source:{id:'t',kind:'tariff',label:'Tarifa'},quote:tar.quote}],{today:'2026-11-05'});
  assert.equal(cmp.applied,false);assert.equal(cmp.current.unitPrice,31.2);
  assert.deepEqual(cmp.options.map(o=>[o.unitPrice,o.delta,o.unitOk]),[[33.7,2.5,true],[7.9,-23.3,true]]);
  assert.deepEqual(frozen,b0,'comparing never mutates the budget');
  // A preview is not a change either: the budget stays identical until apply() with confirmation.
  const p=C.previewApply(frozen,'it-fab',ref.quote);assert.equal(p.ok,true);assert.equal(p.after.unitPrice,33.7);
  assert.equal(C.revisionTag(frozen),C.revisionTag(b0));
  assert.throws(()=>C.apply(frozen,p),/explicit professional confirmation/);
});

test('FT8-S2-03 · a reviewed price is never replaced without explicit consent',async()=>{
  let b=await applyPrice(budget(),ed('2024'),'it-fab','SYN-FAB');
  b={...b,items:b.items.map(i=>i.id==='it-fab'?Budget.markReviewed(i,{reviewedAt:'2026-11-05T09:00:00Z'}):i)};
  const ref=await ed('2025').quote('SYN-FAB'),p=C.previewApply(b,'it-fab',ref.quote);
  assert.equal(p.requiresConsent,true);assert.deepEqual(p.notes,['reviewed-price']);
  assert.throws(()=>C.apply(b,p,{confirmed:true}),/explicit consent/);
  const out=C.apply(b,p,{confirmed:true,replaceReviewed:true});
  assert.equal(out.budget.items.find(i=>i.id==='it-fab').review.status,'unreviewed','an applied reference must be reviewed again');
  assert.equal(out.change.before.review.status,'reviewed');assert.equal(out.change.after.unitPrice,33.7);
});

test('FT8-S2-04 / QA-06 · a new edition proposes changes; history stays identical; only accepted items change',async()=>{
  let b=budget();
  b=await applyPrice(b,ed('2024'),'it-fab','SYN-FAB');b=await applyPrice(b,ed('2024'),'it-pue','SYN-PUE');b=await applyPrice(b,ed('2024'),'it-rod','SYN-ROD');
  // it-pin keeps a manual price and only a REFERENCE to the old edition (its own price must never move).
  b={...b,items:b.items.map(i=>i.id==='it-pin'?Budget.setManualPrice(i,{unitPrice:9,label:'Mi precio'}):i)};
  const refOld=await ed('2024').quote('SYN-FAB');const pr=C.previewApply(b,'it-pin',refOld.quote,{as:'reference'});
  assert.equal(pr.ok,true);b=C.apply(b,pr,{confirmed:true}).budget;
  const history=deepFrozenCopy(b),tag=C.revisionTag(history),calc=JSON.stringify(Budget.calculateBudget(history));
  const proposal=await C.proposeEditionUpdate(history,ed('2025'));
  const rows=Object.fromEntries(proposal.rows.map(r=>[r.itemId,[r.state,r.oldPrice,r.newPrice]]));
  assert.deepEqual(rows,{'it-fab':['price-changed',31.2,33.7],'it-pue':['unchanged',180,180],'it-rod':['unit-incompatible',8.4,2.1],'it-pin':['price-changed',31.2,33.7]});
  assert.equal(proposal.pending,2);
  assert.equal(C.revisionTag(history),tag,'proposing does not modify the budget');
  assert.throws(()=>C.applyEditionUpdate(history,proposal,['it-fab']),/explicit professional confirmation/);
  const out=C.applyEditionUpdate(history,proposal,['it-fab','it-rod','it-pin'],{confirmed:true,decidedAt:'2026-11-05T11:00:00Z'});
  const item=id=>out.budget.items.find(i=>i.id===id);
  assert.equal(item('it-fab').unitPrice,33.7);assert.equal(item('it-fab').priceReference.source.edition,'2025');assert.equal(item('it-fab').review.status,'unreviewed');
  assert.equal(item('it-pue').unitPrice,180);assert.equal(item('it-pue').priceReference.source.edition,'2024','not accepted → unchanged');
  assert.equal(item('it-rod').unitPrice,8.4,'unit changed in the new edition → never applied');
  assert.equal(item('it-pin').unitPrice,9,'a kept reference never moves the item own price');assert.equal(item('it-pin').priceReference.unitPrice,33.7);
  assert.deepEqual(out.change.skipped,[{itemId:'it-rod',reason:'unit-incompatible'}]);
  // The historical budget: same text, same tag, same totals.
  assert.equal(C.revisionTag(history),tag);assert.equal(JSON.stringify(Budget.calculateBudget(history)),calc);
  assert.notEqual(out.change.toRevision,out.change.fromRevision);
  assert.throws(()=>C.applyEditionUpdate(out.budget,proposal,['it-fab'],{confirmed:true}),/changed since the proposal/);
});

test('FT8-S2-05 / QA-05 · units: notation only (ud→unit), never a conversion; kg, m3 and other currencies rejected',async()=>{
  assert.deepEqual(C.unitCheck('unit','ud'),{ok:true,unit:'unit',notationOnly:true});
  assert.equal(C.unitCheck('m2','kg').state,'unit-incompatible');assert.equal(C.unitCheck('m2','kg').reason,'quote-unit-unsupported');
  assert.equal(C.unitCheck('m','m2').reason,'unit-mismatch');assert.equal(C.unitCheck('m2','m2','USD').state,'currency-mismatch');
  const b=budget(),pue=await ed('2024').quote('SYN-PUE');
  const p=C.previewApply(b,'it-pue',pue.quote);assert.equal(p.ok,true);assert.equal(p.quote.unit,'unit');assert.equal(p.rawUnit,'ud');
  const exc=await ed('2024').quote('SYN-EXC');assert.deepEqual(C.previewApply(b,'it-fab',exc.quote).blockers,['unit-incompatible']);
  // The BC3 loader already drops items whose unit is not a budget unit (MORTERO, kg): they are not offered at all.
  assert.equal((await C.bc3Source({bytes:T.bytes()}).quote('MORTERO')).state,'not-found');
  const kg=await C.bccaSource({model:S.model(),datasetMode:'synthetic'}).quote('SYN-KG',{column:0});assert.equal(kg.state,'found');
  assert.deepEqual(C.previewApply(b,'it-fab',kg.quote).blockers,['unit-incompatible']);
  assert.throws(()=>C.adaptQuote(kg.quote,'m2'),/quote-unit-unsupported/);
});

test('FT8-S2-05 / QA-05 · unknown prices stay null; a partial budget is labelled partial, never total',async()=>{
  const none=await ed('2024').quote('SYN-NOPRICE');assert.equal(none.state,'no-price');assert.equal(none.quote,undefined);
  const b=await applyPrice(budget(),ed('2024'),'it-fab','SYN-FAB');const cov=C.coverage(b);
  assert.equal(cov.netComplete,false);assert.ok(cov.states.includes('partial'));assert.ok(cov.states.includes('pending-review'));
  assert.equal(cov.netKnown,1248);assert.match(cov.label,/presupuesto parcial, no es el coste total/);
  assert.deepEqual(cov.unpriced.sort(),['it-pin','it-pue','it-rod']);
  const line=Budget.calculateBudget(b).lines.find(l=>l.id==='it-pue');assert.equal(line.unitPrice,null);assert.equal(line.subtotalNet,null);
});

test('FT8-S2-06 / QA-24 · provenance survives serialise → reopen; budget 1.0 needs an explicit upgrade',async()=>{
  const b=await applyPrice(budget(),ed('2025'),'it-fab','SYN-FAB');
  const reopened=Budget.parseBudget(Budget.serializeBudget(b)),ref=reopened.items.find(i=>i.id==='it-fab').priceReference;
  assert.deepEqual([ref.providerId,ref.code,ref.unit,ref.currency,ref.source.edition,ref.source.region,ref.source.asOf,ref.source.licenseStatus],
    ['bcca-es','SYN-FAB','m2','EUR','2025','Andalucía, España','2025-01-01','not-applicable']);
  assert.deepEqual(reopened.items.find(i=>i.id==='it-fab').priceSource,{type:'provider-reference',providerId:'bcca-es',itemId:'SYN-FAB'});
  assert.equal(C.revisionTag(reopened),C.revisionTag(b));
  const old=budget('1.0.0'),q=(await ed('2025').quote('SYN-FAB')).quote;
  assert.deepEqual(C.previewApply(old,'it-fab',q).blockers,['budget-upgrade-required']);
  const up=C.previewApply(old,'it-fab',q,{upgrade:true});assert.equal(up.ok,true);assert.equal(up.candidate.schemaVersion,'1.1.0');
  assert.equal(old.schemaVersion,'1.0.0','the old document is untouched');
  // BC3 supplied: provider user-bc3, licence unknown (the professional answers for its use).
  const bc3=(await C.bc3Source({bytes:T.bytes()}).quote('PINT-LISA',{column:1})).quote;
  assert.deepEqual([bc3.providerId,bc3.source.licenseStatus,bc3.source.region,bc3.unitPrice],['user-bc3','unknown','Zona B',8.4]);
});

test('FT8-S2-07 / QA-07 · RUBIK-managed BCCA stays blocked (fail-closed); a BC3 supplied by the professional keeps working',async()=>{
  const managed=C.bccaSource({model:S.model(),datasetMode:'rubik-managed',source:S.officialSource});
  assert.deepEqual([managed.status,managed.state,managed.reason],['unavailable','unauthorized','legal-gate-not-verified']);
  const restricted=C.bccaSource({model:S.model(),datasetMode:'user-supplied',source:S.officialSource,legalGate:{status:'RESTRICTED'}});
  assert.equal(restricted.state,'unauthorized');
  // A URL or a declaration alone is not evidence: still UNKNOWN.
  const weak=C.bccaSource({model:S.model(),datasetMode:'rubik-managed',source:S.officialSource,legalGate:{status:'VERIFIED',evidenceUrls:['https://example.org']}});
  assert.equal(weak.reason,'legal-gate-not-verified');
  assert.deepEqual([C.managedStatus().enabled,C.managedStatus().legal,C.managedStatus().reason],[false,'UNKNOWN','legal-gate-not-verified']);
  assert.equal(C.managedStatus({status:'RESTRICTED'}).reason,'legal-gate-restricted');
  const full={status:'VERIFIED',sourceOfficial:true,commercialUse:true,reuse:true,hosting:true,evidenceUrls:['https://example.org/permiso'],reviewDate:'2026-11-05'};
  assert.deepEqual([C.managedStatus(full).enabled,C.managedStatus(full).reason],[false,'managed-distribution-not-implemented'],'even verified, M1 ships no hosting/download');
  assert.equal(C.managedStatus().cachePolicy.persist,false);
  // No download/hosting API exists in this module.
  assert.ok(!Object.keys(C).some(k=>/download|fetch|host|publish|upload/i.test(k)));
  // The professional's own BCCA BC3 (user-supplied, technical gate PASS) works with licence «unknown».
  const user=C.bccaSource({model:S.model(),datasetMode:'user-supplied',source:S.officialSource});
  assert.equal(user.status,'available');assert.equal(user.source.license.status,'unknown');
  const bc3=await C.searchAll([C.bc3Source({bytes:T.bytes()})],{text:'pintura'});assert.deepEqual(bc3.groups[0].items.map(i=>i.code),['PINT-LISA']);
});

test('FT8-S2-08 · every state has a plain-language message; restricted quotes are blocked',async()=>{
  for(const s of ['found','no-price','selector-required','stale','unit-incompatible','currency-mismatch','not-found','catalog-unavailable','unauthorized','partial','pending-review','update-available','reviewed-price']){
    const d=C.describe(s);assert.ok(d.title&&d.detail&&d.tone,s);assert.doesNotMatch(d.detail,/null|undefined|NaN/);}
  assert.equal(C.describe('no-price').detail.includes('nunca se cuenta como 0 €'),true);
  const q=(await ed('2025').quote('SYN-FAB')).quote;
  const restricted={...q,source:{...q.source,licenseStatus:'restricted'}};
  assert.deepEqual(C.previewApply(budget(),'it-fab',restricted).blockers,['unauthorized']);
  assert.deepEqual(C.freshness(q,{today:'2025-06-01'}).stale,false);assert.deepEqual(C.freshness(q,{today:'2026-11-05'}).reasons,['old-date'],'more than 365 days old');
  assert.deepEqual(C.freshness({...q,source:{...q.source,asOf:'2020-01-01'}},{today:'2026-11-05'}).reasons,['old-date']);
  assert.deepEqual(C.freshness((await ed('2024').quote('SYN-FAB')).quote,{latestEdition:'2025'}).reasons,['newer-edition']);
  assert.equal((await C.bc3Source({bytes:T.bytes()}).quote('PAV-ROBLE')).state,'selector-required','several price columns: never chosen for the user');
  assert.equal((await ed('2024').quote('NOPE')).state,'not-found');
});

test('FT8-S2-09 · limits, cache, failure recovery and a representative catalogue (measured)',async()=>{
  assert.equal(C.bc3Source({bytes:{byteLength:C.LIMITS.fileBytes+1}}).reason,'file-too-large');
  assert.equal(C.bc3Source({bytes:new Uint8Array([1,2,3])}).state,'catalog-unavailable');
  assert.equal(C.bccaSource({bytes:new Uint8Array([1,2,3]),datasetMode:'synthetic'}).reason,'invalid-bc3');
  // A provider that throws never breaks the search of the other sources.
  const broken={source:{id:'b',kind:'bc3',label:'Roto'},async search(){throw Error('boom');}};
  const r=await C.searchAll([broken,ed('2024')],{text:'fábrica'});
  assert.deepEqual(r.groups.map(g=>[g.state,g.items.length]),[['catalog-unavailable',0],['found',1]]);
  // Representative catalogue: 20 000 invented concepts; search latency measured and bounded; LRU cache bounded.
  const rows=[];for(let i=0;i<20000;i++)rows.push(`~C|SYN-${String(i).padStart(5,'0')}|m2|Partida sintética ${i} de prueba|${(i%97)+1}.5|01012025|0|`);
  const big=E.bytes(['~V|SYNTHETIC TEST ONLY|FIEBDC-3/2016|Synthetic generator|Precio|ANSI||||||',...rows].join('\r\n')+'\r\n\x1a');
  const t0=performance.now(),src=C.bccaSource({bytes:big,datasetMode:'synthetic',source:E.source('BIG')}),tLoad=performance.now()-t0;
  assert.equal(src.status,'available');assert.equal(src.source.count,20000);
  const t1=performance.now();const s1=await src.search({text:'SYN-19999'});const tSearch=performance.now()-t1;
  assert.equal(s1.items[0].code,'SYN-19999');
  const t2=performance.now();await src.search({text:'SYN-19999'});const tCached=performance.now()-t2;
  for(let i=0;i<100;i++)await src.search({text:'SYN-'+i});assert.ok(src.cacheSize()<=C.LIMITS.cacheEntries);
  console.log(`# FT8-S2-09 measured: load ${tLoad.toFixed(0)} ms, search ${tSearch.toFixed(1)} ms, cached ${tCached.toFixed(2)} ms (20 000 concepts)`);
  assert.ok(tSearch<1500,'search under 1.5 s on CI hardware');assert.ok(tCached<tSearch);
});

test('QA-23 · the C1–C4 engine stays the only authority: totals equal calculateBudget, nothing recomputed here',async()=>{
  const b=await applyPrice(budget(),ed('2024'),'it-fab','SYN-FAB');const c=Budget.calculateBudget(b);
  assert.equal(c.totals.net.amount,C.coverage(b).netKnown);assert.equal(c.lines.find(l=>l.id==='it-fab').subtotalNet,1248);
  assert.equal(Bc3.normUnit('ud'),'unit');
});
