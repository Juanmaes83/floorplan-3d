'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const Cost=require('../js/cost-provider.js');
const Bcca=require('../js/cost-provider-bcca-es.js');
const fixture=require('./fixtures/bcca-es/synthetic.cjs');

const gate=reviewDate=>({
  status:'VERIFIED',
  sourceOfficial:true,
  commercialUse:true,
  reuse:true,
  evidenceUrls:['https://example.test/SYNTHETIC-TEST-ONLY-evidence'],
  reviewDate
});

const provider=reviewDate=>Bcca.create({
  model:fixture.model(),
  datasetMode:'rubik-managed',
  currency:'EUR',
  source:fixture.officialSource,
  legalGate:gate(reviewDate)
});

test('rubik-managed VERIFIED requires a real calendar review date',async()=>{
  for(const impossible of ['2026-02-30','2026-13-01','2026-00-10']){
    const p=provider(impossible);
    assert.equal(p.getGateStatus().legal.status,'UNKNOWN');
    const quote=await Cost.getPrice(p,'SYN-FLOOR',{priceSelector:{index:0}});
    assert.equal(quote.reason,'legal-gate-not-verified');
  }

  const valid=provider('2026-10-27');
  assert.equal(valid.getGateStatus().legal.status,'VERIFIED');
  assert.equal((await Cost.getPrice(valid,'SYN-FLOOR',{priceSelector:{index:0}})).status,'available');
});
