'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const Cost=require('../js/cost-provider.js');
const Fiebdc=require('../js/fiebdc3-codec.js');
const Bcca=require('../js/cost-provider-bcca-es.js');
const Budget=require('../js/budget-core.js');
const Bridge=require('../js/budget-cost-bridge.js');
const fixture=require('./fixtures/bcca-es/synthetic.cjs');

const freeze=value=>{if(value&&typeof value==='object'){Object.freeze(value);for(const x of Object.values(value))freeze(x);}return value;};
const synthetic=(overrides={})=>Bcca.create({model:fixture.model(),datasetMode:'synthetic',currency:'EUR',...overrides});
const official=(datasetMode,legalGate,overrides={})=>Bcca.create({model:fixture.model(),datasetMode,currency:'EUR',
  source:fixture.officialSource,legalGate,...overrides});
const verified={status:'VERIFIED',sourceOfficial:true,commercialUse:true,reuse:true,
  evidenceUrls:['https://example.test/SYNTHETIC-TEST-ONLY-evidence'],reviewDate:'2026-10-27'};
const price=(provider,id,selector)=>Cost.getPrice(provider,id,selector===undefined?{}:{priceSelector:selector});

test('factory validates canonical model, is immutable and conforms to CostProvider',()=>{
  const model=freeze(fixture.model()),snapshot=JSON.stringify(model);
  const p=synthetic({model});
  assert.equal(JSON.stringify(model),snapshot);
  assert.equal(Bcca.ID,'bcca-es');
  assert.deepEqual(Cost.inspectProvider(p).capabilities,{search:true,getItem:true,getPrice:true,network:'none'});
  assert.deepEqual(p.getGateStatus(),{technical:{status:'PASS',reason:null},legal:{status:'VERIFIED',scope:'synthetic-only'}});
  const m=p.getSourceMetadata();
  assert.equal(m.kind,'other');
  assert.match(m.label,/SYNTHETIC TEST ONLY/);
  assert.equal(m.region,'Andalucía, España');
  assert.deepEqual(Cost.validateSourceMetadata(m,'bcca-es'),m);
});

test('technical gate rejects fake or invalid model without repairing it',async()=>{
  const fake=synthetic({model:{version:{},concepts:[]}});
  assert.equal(fake.getGateStatus().technical.status,'FAIL');
  assert.equal((await Cost.search(fake,{text:'SYN'})).reason,'technical-gate-failed');
  assert.equal((await Cost.getItem(fake,'SYN-FLOOR')).reason,'technical-gate-failed');
  assert.equal((await price(fake,'SYN-FLOOR',{index:0})).reason,'technical-gate-failed');
  const empty=synthetic({model:Fiebdc.parse(fixture.file(['~V|A|FIEBDC-3/2016|P|Precios|850||||||']))});
  assert.equal(empty.getGateStatus().technical.status,'FAIL');
  const changed=fixture.model();changed.concepts[0].code='FORGED';
  assert.equal(synthetic({model:changed}).getGateStatus().technical.status,'FAIL');
});

test('index resolves canonical code, projected identity and exact aliases without case-folding IDs',async()=>{
  const p=synthetic(),registry=Cost.createRegistry();
  registry.register(p);
  assert.equal(registry.inspect('bcca-es').id,'bcca-es');
  for(const key of ['SYN-FLOOR','ALIASX']){
    const r=await registry.getItem('bcca-es',key);
    assert.equal(r.status,'available');assert.equal(r.item.itemId,'SYN-FLOOR');
  }
  assert.equal((await registry.getItem('bcca-es','ROOT')).reason,'item-not-priceable');
  assert.equal((await registry.getItem('bcca-es','CAP')).reason,'item-not-priceable');
  assert.equal((await registry.getItem('bcca-es','SYN-NOUNIT')).reason,'item-not-priceable');
  assert.equal((await registry.getItem('bcca-es','syn-floor')).reason,'item-not-found');
  assert.equal((await registry.getItem('bcca-es','ALIASX#')).reason,'item-not-found');
  assert.equal((await registry.getItem('bcca-es','MISSING')).status,'not-found');
  assert.equal((await registry.getItem('bcca-es','SYN-TEXT')).item.description,'Descripción ficticia del texto');
  assert.equal((await registry.getPrice('bcca-es','ALIASX',{priceSelector:{index:0}})).quote.itemId,'SYN-FLOOR');
});

test('search ranking, case insensitivity, filters and stable limit',async()=>{
  const p=synthetic();
  const exact=await Cost.search(p,{text:'aliasx'});
  assert.deepEqual(exact.items.map(x=>x.itemId),['SYN-FLOOR']);
  const first=await Cost.search(p,{text:'syn',limit:3});
  assert.deepEqual(first.items.map(x=>x.itemId),['SYN-EMPTY','SYN-FLOOR','SYN-KG']);
  assert.deepEqual((await Cost.search(p,{text:'ficticia',unit:'m'})).items.map(x=>x.itemId),['SYN-LENGTH']);
  assert.deepEqual((await Cost.search(p,{text:'SYN',region:'Madrid'})).items,[]);
  assert.deepEqual((await Cost.search(p,{text:'SYN',region:'Andalucía, España'})).items,first.items.concat((await Cost.search(p,{text:'SYN'})).items.slice(3)));
  const category=await Cost.search(p,{text:'SYN',category:'Acabados'});
  assert.equal(category.reason,'category-filter-unavailable');assert.deepEqual(category.items,[]);
});

test('price variants require selector, preserve inherited projections and zero',async()=>{
  const p=synthetic();
  assert.equal((await price(p,'SYN-FLOOR')).reason,'price-selector-required');
  assert.equal((await price(p,'SYN-EMPTY')).reason,'price-unavailable');
  const first=await price(p,'SYN-FLOOR',{index:0});
  assert.equal(first.quote.unitPrice,11);
  assert.equal(first.quote.source.asOf,'2026-01-01');
  const inherited=await price(p,'SYN-FLOOR',{index:2});
  assert.equal(inherited.quote.unitPrice,12);
  assert.equal(inherited.quote.source.asOf,'2026-01-01');
  assert.equal((await price(p,'SYN-LENGTH',{label:'Centro'})).quote.unitPrice,4);
  assert.equal((await price(p,'SYN-ZERO',{index:0})).quote.unitPrice,0);
  assert.equal((await price(synthetic({model:fixture.single()}),'SYN-SINGLE')).quote.unitPrice,6.5);
  assert.equal((await price(synthetic({model:fixture.duplicateLabels()}),'SYN-FLOOR',{label:'Norte'})).reason,'price-selector-ambiguous');
  for(const selector of [{index:99},{index:-1},{label:'Absent'},{index:0,label:'Norte'},null,{}])
    assert.equal((await price(p,'SYN-FLOOR',selector)).reason,'invalid-price-selector');
});

test('invalid price value is unavailable and unrelated codec warnings are tolerated',async()=>{
  const changed=fixture.model();changed.records[3].fields[3]='-1\\12\\';
  const p=synthetic({model:{records:changed.records}});
  assert.equal(p.getGateStatus().technical.status,'PASS');
  assert.equal((await price(p,'SYN-FLOOR',{index:0})).reason,'invalid-price-value');
  assert.equal((await price(p,'SYN-FLOOR',{index:1})).status,'available');
  const warned=fixture.model();warned.records.push({type:'X',fields:['SYNTHETIC TEST ONLY']});
  const withWarning=synthetic({model:{records:warned.records}});
  assert.equal(withWarning.getGateStatus().technical.status,'PASS');
  assert.equal((await Cost.getItem(withWarning,'SYN-FLOOR')).status,'available');
});

test('full dates are DDMMYYYY, partial and impossible dates never become asOf',async()=>{
  const p=synthetic();
  assert.equal((await price(p,'SYN-LENGTH',{index:0})).quote.source.asOf,'2026-01-02');
  const partial=fixture.single();partial.records[1].fields[4]='012026';
  assert.equal((await price(synthetic({model:{records:partial.records}}),'SYN-SINGLE')).quote.source.asOf,null);
  const impossible=fixture.single();impossible.records[1].fields[4]='31022026';
  assert.equal((await price(synthetic({model:{records:impossible.records}}),'SYN-SINGLE')).quote.source.asOf,null);
});

test('user-supplied UNKNOWN operates with unknown provenance; restricted blocks',async()=>{
  const p=official('user-supplied',{status:'UNKNOWN'});
  assert.equal(p.getGateStatus().technical.status,'PASS');
  assert.equal(p.getGateStatus().legal.status,'UNKNOWN');
  assert.equal(p.getSourceMetadata().kind,'official-dataset');
  assert.equal(p.getSourceMetadata().license.status,'unknown');
  assert.equal((await Cost.search(p,{text:'SYN'})).status,'available');
  assert.equal((await Cost.getItem(p,'SYN-FLOOR')).status,'available');
  const r=await price(p,'SYN-FLOOR',{index:0});
  assert.equal(r.status,'available');assert.equal(r.quote.source.licenseStatus,'unknown');
  const restricted=official('user-supplied',{status:'RESTRICTED'});
  assert.equal((await Cost.search(restricted,{text:'SYN'})).reason,'legal-gate-restricted');
  assert.equal((await Cost.getItem(restricted,'SYN-FLOOR')).reason,'legal-gate-restricted');
  assert.equal((await price(restricted,'SYN-FLOOR',{index:0})).reason,'legal-gate-restricted');
});

test('rubik-managed UNKNOWN/RESTRICTED block; VERIFIED simulation is activable',async()=>{
  const unknown=official('rubik-managed',{status:'UNKNOWN'});
  assert.equal((await Cost.search(unknown,{text:'SYN'})).reason,'legal-gate-not-verified');
  assert.equal((await Cost.getItem(unknown,'SYN-FLOOR')).reason,'legal-gate-not-verified');
  assert.equal((await price(unknown,'SYN-FLOOR',{index:0})).reason,'legal-gate-not-verified');
  const restricted=official('rubik-managed',{status:'RESTRICTED'});
  assert.equal((await price(restricted,'SYN-FLOOR',{index:0})).reason,'legal-gate-restricted');
  const urlOnly=official('rubik-managed',{status:'VERIFIED',evidenceUrls:['https://example.test/download']});
  assert.equal(urlOnly.getGateStatus().legal.status,'UNKNOWN');
  const pass=official('rubik-managed',verified);
  assert.equal(pass.getGateStatus().legal.status,'VERIFIED');
  assert.equal((await price(pass,'SYN-FLOOR',{index:0})).quote.source.licenseStatus,'verified');
  assert.match(pass.getSourceMetadata().label,/SYNTHETIC TEST ONLY/);
});

test('currency is explicit, unit is preserved, and quote passes generic validator',async()=>{
  const absent=synthetic({currency:undefined});
  assert.equal(absent.getGateStatus().technical.status,'FAIL');
  assert.equal((await price(absent,'SYN-FLOOR',{index:0})).reason,'currency-unverified');
  const p=synthetic();
  const kg=(await price(p,'SYN-KG',{index:0})).quote;
  assert.equal(kg.unit,'kg');assert.equal(kg.currency,'EUR');assert.equal(kg.priceKind,'reference');
  assert.deepEqual(Cost.validateQuote(kg,'bcca-es'),kg);
  assert.equal(kg.source.retrievedAt,null);
});

test('registry quote integrates with Budget bridge without professional review or unit conversion',async()=>{
  const registry=Cost.createRegistry([synthetic()]);
  const r=await registry.getPrice('bcca-es','SYN-FLOOR',{priceSelector:{index:0}});
  assert.equal(r.status,'available');
  const b=Budget.createBudget({id:'synthetic-budget',subject:{type:'project',id:'synthetic-project'},title:'SYNTHETIC TEST ONLY',taxRatePercent:21});
  b.items=[Budget.createItem({id:'floor',description:'Partida inventada',quantity:Budget.manualQuantity({value:3,unit:'m2',label:'Medición ficticia'}),wastePercent:0})];
  const referenced=Bridge.setPriceReferenceFromQuote(b,'floor',r.quote);
  assert.equal(referenced.items[0].unitPrice,null);
  assert.equal(referenced.items[0].review.status,'unreviewed');
  const active=Bridge.setPriceFromQuote(b,'floor',r.quote);
  assert.equal(active.items[0].unitPrice,11);
  assert.equal(active.items[0].priceSource.type,'provider-reference');
  assert.equal(active.items[0].review.status,'unreviewed');
  const kg=(await registry.getPrice('bcca-es','SYN-KG',{priceSelector:{index:0}})).quote;
  assert.throws(()=>Bridge.setPriceFromQuote(b,'floor',kg),/unit must exactly match/);
  assert.equal(b.items[0].unitPrice,null);
});

test('browser module works with poisoned network, DOM and storage globals',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../js/cost-provider-bcca-es.js'),'utf8');
  const poison=()=>{throw Error('forbidden capability');};
  const context=vm.createContext({FloorPlanCostProvider:Cost,FloorPlanFIEBDC3:Fiebdc,
    fetch:poison,XMLHttpRequest:poison,WebSocket:poison,document:undefined,window:undefined,
    localStorage:poison,indexedDB:poison});
  vm.runInContext(source,context);
  const p=context.FloorPlanBccaEsCostProvider.create({model:fixture.model(),datasetMode:'synthetic',currency:'EUR'});
  assert.equal(p.getItem('SYN-FLOOR').status,'available');
  assert.equal(context.FloorPlanBudget,undefined);
});
