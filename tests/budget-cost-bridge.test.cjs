const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const Budget=require('../js/budget-core.js');
const Cost=require('../js/cost-provider.js');
const Manual=require('../js/cost-provider-manual.js');
const Bridge=require('../js/budget-cost-bridge.js');

const quote=(overrides={})=>({
  providerId:'synthetic-reference',itemId:'ref-1',code:'S-1',description:'Baldosa sintética',unit:'m2',
  unitPrice:28.43,currency:'EUR',priceKind:'reference',
  source:{label:'Catálogo sintético',asOf:'2026-10-01',retrievedAt:'2026-10-27T18:00:00+01:00',
    edition:'2026',region:'Andalucía',sourceUrl:'https://example.test/ref',attribution:'Fixture',
    licenseStatus:'unknown',licenseName:null,licenseUrl:null},...overrides
});
const provider={
  id:'synthetic-reference',
  getCapabilities(){return {search:false,getItem:false,getPrice:true,network:'none'};},
  getSourceMetadata(){return {providerId:this.id,label:'Synthetic',kind:'other',sourceName:'Fixture',sourceUrl:null,
    edition:null,region:null,attribution:null,license:{status:'unknown',name:null,url:null}};},
  getPrice(itemId){return {status:'available',providerId:this.id,quote:quote({itemId})};}
};
const budget=()=>{
  const b=Budget.createBudget({id:'bud-1',subject:{type:'project',id:'project-1'},title:'Reforma',taxRatePercent:21});
  b.chapters=[Budget.createChapter({id:'ch-1',title:'Acabados',order:1})];
  b.items=[Budget.createItem({id:'floor',chapterId:'ch-1',description:'Pavimento dormitorio principal',
    quantity:Budget.manualQuantity({value:12.84,unit:'m2',label:'Medición profesional'}),wastePercent:7,
    taxRatePercent:10,unitPrice:31,priceSource:{type:'manual',label:'Tarifa estudio',asOf:'2026-10-27'}})];
  return b;
};
const legacy=()=>{const b=budget();b.schemaVersion='1.0.0';delete b.items[0].priceReference;return b;};
const item=b=>b.items[0];
const manualQuote=async(unitPrice=31)=>{
  const result=await Cost.getPrice(Manual,'manual-floor',{description:'Precio profesional',unit:'m2',unitPrice,label:'Tarifa estudio',asOf:'2026-10-27'});
  assert.equal(result.status,'available');return result.quote;
};

test('real CostProvider registry quote is validated and applied as active reference',async()=>{
  const registry=Cost.createRegistry([provider]);
  const result=await registry.getPrice('synthetic-reference','ref-1');
  assert.equal(result.status,'available');
  const b=Bridge.setPriceFromQuote(budget(),'floor',result.quote);
  assert.equal(item(b).unitPrice,28.43);
  assert.deepEqual(item(b).priceSource,{type:'provider-reference',providerId:'synthetic-reference',itemId:'ref-1'});
  assert.deepEqual(item(b).priceReference,result.quote);
  assert.deepEqual(item(b).review,{status:'unreviewed',reviewedAt:null});
  assert.equal(item(b).description,'Pavimento dormitorio principal');
  assert.equal(Budget.calculateBudget(b).totals.reviewComplete,false);
});
test('ManualCostProvider real quote applies as manual active price, without reference or auto-review',async()=>{
  const q=await manualQuote(0);
  const b=Bridge.setPriceFromQuote(budget(),'floor',q);
  assert.equal(item(b).unitPrice,0);
  assert.deepEqual(item(b).priceSource,{type:'manual',label:'Tarifa estudio',asOf:'2026-10-27'});
  assert.equal(item(b).priceReference,null);
  assert.equal(item(b).review.status,'unreviewed');
});
test('ManualCostProvider quote works on legacy 1.0 without silent upgrade',async()=>{
  const b=Bridge.setPriceFromQuote(legacy(),'floor',await manualQuote(25));
  assert.equal(b.schemaVersion,'1.0.0');
  assert.equal(item(b).unitPrice,25);
  assert.equal(Object.hasOwn(item(b),'priceReference'),false);
});
test('reference quote requires explicit upgrade from 1.0',()=>{
  assert.throws(()=>Bridge.setPriceFromQuote(legacy(),'floor',quote()),/upgrade required/);
  assert.throws(()=>Bridge.setPriceReferenceFromQuote(legacy(),'floor',quote()),/upgrade required/);
});
test('attaching a reference leaves active price, source, review, calculation and all other fields intact',()=>{
  const b=budget();b.items[0]=Budget.markReviewed(item(b),{reviewedAt:'2026-10-27T19:00:00+01:00'});
  const before=Budget.calculateBudget(b),original=JSON.stringify(b);
  const next=Bridge.setPriceReferenceFromQuote(b,'floor',quote());
  assert.equal(JSON.stringify(b),original);
  assert.equal(item(next).unitPrice,31);
  assert.deepEqual(item(next).priceSource,item(b).priceSource);
  assert.deepEqual(item(next).review,item(b).review);
  assert.deepEqual(item(next).priceReference,Cost.validateQuote(quote(),'synthetic-reference'));
  for(const key of ['quantity','wastePercent','taxRatePercent','description','chapterId'])assert.deepEqual(item(next)[key],item(b)[key]);
  for(const key of ['budgetQuantity','subtotalNet','taxAmount','subtotalGross'])assert.equal(Budget.calculateBudget(next).lines[0][key],before.lines[0][key]);
});
test('reference quote cannot be attached to a different active provider reference',()=>{
  const active=Bridge.setPriceFromQuote(budget(),'floor',quote());
  assert.throws(()=>Bridge.setPriceReferenceFromQuote(active,'floor',quote({itemId:'ref-2'})),/cannot replace/);
});
test('full lifecycle: reference 28.43, professional review, manual override 31, retained reference, re-review',()=>{
  let b=Bridge.setPriceFromQuote(budget(),'floor',quote());
  b.items[0]=Budget.markReviewed(item(b),{reviewedAt:'2026-10-27T19:00:00+01:00'});
  assert.equal(item(b).review.status,'reviewed');
  b.items[0]=Budget.setManualPrice(item(b),{unitPrice:31,label:'Tarifa estudio',asOf:'2026-10-27'});
  assert.equal(item(b).unitPrice,31);
  assert.equal(item(b).priceSource.type,'manual');
  assert.equal(item(b).priceReference.unitPrice,28.43);
  assert.deepEqual(item(b).review,{status:'unreviewed',reviewedAt:null});
  b.items[0]=Budget.markReviewed(item(b),{reviewedAt:'2026-10-27T19:30:00+01:00'});
  assert.equal(item(b).review.status,'reviewed');
  assert.equal(item(b).priceReference.unitPrice,28.43);
  assert.equal(Budget.validateBudget(b).items[0].unitPrice,31);
});
test('applying Manual quote over a reference keeps that reference and resets review',async()=>{
  let b=Bridge.setPriceFromQuote(budget(),'floor',quote());
  b.items[0]=Budget.markReviewed(item(b),{reviewedAt:'2026-10-27T19:00:00+01:00'});
  b=Bridge.setPriceFromQuote(b,'floor',await manualQuote(31));
  assert.equal(item(b).priceReference.unitPrice,28.43);
  assert.equal(item(b).priceSource.type,'manual');
  assert.equal(item(b).review.status,'unreviewed');
});
test('changing reference quote resets review even if active price was previously reviewed',()=>{
  let b=Bridge.setPriceFromQuote(budget(),'floor',quote());
  b.items[0]=Budget.markReviewed(item(b),{reviewedAt:'2026-10-27T19:00:00+01:00'});
  b=Bridge.setPriceFromQuote(b,'floor',quote({unitPrice:29}));
  assert.equal(item(b).unitPrice,29);
  assert.equal(item(b).review.status,'unreviewed');
});
test('clearing active price retains reference; clearing reference is then allowed',()=>{
  const b=Bridge.setPriceFromQuote(budget(),'floor',quote());
  assert.throws(()=>Bridge.clearPriceReference(b,'floor'),/active provider price first/);
  const cleared=budget();cleared.items[0]=Budget.clearPrice(item(b));
  assert.equal(item(cleared).unitPrice,null);
  assert.equal(item(cleared).priceSource,null);
  assert.equal(item(cleared).priceReference.unitPrice,28.43);
  assert.equal(Budget.calculateBudget(cleared).totals.unpricedItemIds[0],'floor');
  assert.equal(Bridge.clearPriceReference(cleared,'floor').items[0].priceReference,null);
});
test('clearing reference is allowed with manual active price and preserves review',()=>{
  const b=Bridge.setPriceReferenceFromQuote(budget(),'floor',quote());
  b.items[0]=Budget.markReviewed(item(b),{reviewedAt:'2026-10-27T19:00:00+01:00'});
  const next=Bridge.clearPriceReference(b,'floor');
  assert.equal(item(next).priceReference,null);
  assert.deepEqual(item(next).review,item(b).review);
  assert.equal(item(next).unitPrice,31);
});
test('unit exact match and EUR are required without conversion',()=>{
  for(const q of [quote({unit:'kg'}),quote({unit:'m'})]){
    assert.throws(()=>Bridge.setPriceFromQuote(budget(),'floor',q),/exactly match/);
    assert.throws(()=>Bridge.setPriceReferenceFromQuote(budget(),'floor',q),/exactly match/);
  }
  assert.throws(()=>Bridge.setPriceFromQuote(budget(),'floor',quote({currency:'USD'})),/must be EUR/);
});
test('source provenance and license statuses persist exactly; no permission is inferred',()=>{
  for(const status of ['unknown','restricted']){
    const q=quote({source:{...quote().source,licenseStatus:status,licenseName:null,licenseUrl:null}});
    const b=Bridge.setPriceFromQuote(budget(),'floor',q);
    assert.deepEqual(item(b).priceReference,Cost.validateQuote(q,'synthetic-reference'));
    assert.equal(Budget.parseBudget(Budget.serializeBudget(b)).items[0].priceReference.source.licenseStatus,status);
    assert.equal(item(b).priceReference.source.licenseUrl,null);
  }
});
test('bridge rejects manual quote as priceReference and malformed quotes',async()=>{
  const manual=await manualQuote();
  assert.throws(()=>Bridge.setPriceReferenceFromQuote(budget(),'floor',manual),/reference quote/);
  assert.throws(()=>Bridge.setPriceFromQuote(budget(),'floor',quote({unitPrice:-1})),/unitPrice/);
});
test('unknown budget item and invalid budget are rejected without mutations',()=>{
  const b=budget(),before=JSON.stringify(b),q=quote(),quoteBefore=JSON.stringify(q);
  assert.throws(()=>Bridge.setPriceFromQuote(b,'missing',q),/unknown budget item/);
  assert.throws(()=>Bridge.setPriceFromQuote({...b,currency:'USD'},'floor',q),/currency/);
  Bridge.setPriceFromQuote(b,'floor',q);
  assert.equal(JSON.stringify(b),before);
  assert.equal(JSON.stringify(q),quoteBefore);
});
test('browser global bridge loads without DOM or network',()=>{
  const context={URL};vm.createContext(context);
  for(const name of ['fetch','document','localStorage'])Object.defineProperty(context,name,{get(){throw Error(`${name} accessed`);}});
  for(const file of ['cost-provider.js','budget-core.js','budget-cost-bridge.js'])
    vm.runInContext(fs.readFileSync(path.join(__dirname,'../js',file),'utf8'),context);
  assert.equal(typeof context.FloorPlanBudgetCostBridge.setPriceFromQuote,'function');
});
