const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const Cost=require('../js/cost-provider.js');
const Manual=require('../js/cost-provider-manual.js');

const input=overrides=>({description:'Pavimento porcelánico',unit:'m2',unitPrice:31,label:'Tarifa propia estudio',...overrides});
const price=(itemId='floor-bedroom',context=input())=>Cost.getPrice(Manual,itemId,context);
const available=async(context=input(),itemId='floor-bedroom')=>{
  const result=await price(itemId,context);
  assert.equal(result.status,'available');
  return result.quote;
};
const invalid=async(context,itemId='floor-bedroom')=>{
  const result=await price(itemId,context);
  assert.deepEqual(result,{status:'invalid',providerId:'manual',reason:'invalid-manual-input'});
};

test('CommonJS exports the provider object',()=>assert.strictEqual(require('../js/cost-provider-manual.js'),Manual));
test('provider ID is exactly manual',()=>assert.equal(Manual.id,'manual'));
test('capabilities match the 7C-A contract',()=>assert.deepEqual(Manual.getCapabilities(),{search:false,getItem:false,getPrice:true,network:'none'}));
test('inspectProvider accepts Manual without changing the contract',()=>{
  const inspected=Cost.inspectProvider(Manual);
  assert.equal(inspected.id,'manual');
  assert.equal(inspected.contractVersion,'1.0.0');
  assert.equal(inspected.capabilities.network,'none');
});
test('source metadata describes human entry with no external license',()=>{
  const metadata=Cost.validateSourceMetadata(Manual.getSourceMetadata(),'manual');
  assert.equal(metadata.kind,'manual');
  assert.equal(metadata.label,'Manual');
  assert.equal(metadata.sourceName,'Professional entry');
  assert.deepEqual(metadata.license,{status:'not-applicable',name:null,url:null});
  assert.equal(metadata.sourceUrl,null);
});
test('unsupported operations need no fake adapter methods',()=>{
  assert.equal(Manual.search,undefined);
  assert.equal(Manual.getItem,undefined);
  assert.equal(typeof Manual.getPrice,'function');
});
test('search is unsupported through the core wrapper',async()=>assert.deepEqual(await Cost.search(Manual,{text:'piso'}),{status:'unsupported',providerId:'manual',reason:'capability-disabled'}));
test('getItem is unsupported through the core wrapper',async()=>assert.deepEqual(await Cost.getItem(Manual,'floor-bedroom'),{status:'unsupported',providerId:'manual',reason:'capability-disabled'}));
test('getPrice returns one normalized EUR manual quote',async()=>{
  const result=await price();
  assert.equal(result.status,'available');
  assert.equal(result.providerId,'manual');
  assert.equal(result.reason,null);
  assert.deepEqual(result.quote,Cost.validateQuote(result.quote,'manual'));
  assert.deepEqual(result.quote,{
    providerId:'manual',itemId:'floor-bedroom',code:null,description:'Pavimento porcelánico',unit:'m2',
    unitPrice:31,currency:'EUR',priceKind:'manual',
    source:{label:'Tarifa propia estudio',asOf:null,retrievedAt:null,edition:null,region:null,
      sourceUrl:null,attribution:null,licenseStatus:'not-applicable',licenseName:null,licenseUrl:null}
  });
});
test('positive, decimal and explicit zero prices remain available without rounding',async()=>{
  for(const unitPrice of [31,31.5,0])assert.equal((await available(input({unitPrice}))).unitPrice,unitPrice);
});
test('negative, NaN and infinite prices are rejected',async()=>{
  for(const unitPrice of [-1,-10,NaN,Infinity,-Infinity])await invalid(input({unitPrice}));
});
test('numeric and localized strings are rejected without parsing',async()=>{
  for(const unitPrice of ['31','31.00','31 €','31,00'])await invalid(input({unitPrice}));
});
test('null and missing price never become zero',async()=>{
  await invalid(input({unitPrice:null}));
  await invalid(input({unitPrice:undefined}));
});
test('explicit item identity is preserved',async()=>assert.equal((await available(input(),'floor-bedroom')).itemId,'floor-bedroom'));
test('missing or blank item identity cannot produce a quote',async()=>{
  for(const itemId of ['', '  ',undefined])await assert.rejects(Cost.getPrice(Manual,itemId,input()),/getPrice.itemId/);
});
test('description follows the generic contract normalization',async()=>assert.equal((await available(input({description:'  Pavimento porcelánico  '}))).description,'Pavimento porcelánico'));
test('description is required',async()=>invalid(input({description:'  '})));
test('generic units are preserved without conversion',async()=>{
  for(const unit of ['m2','m','unit','m3','kg','h'])assert.equal((await available(input({unit}))).unit,unit);
});
test('no catalog code is invented',async()=>assert.equal((await available()).code,null));
test('explicit code is normalized by the generic contract',async()=>assert.equal((await available(input({code:'  F-1  '}))).code,'F-1'));
test('source label is mandatory',async()=>invalid(input({label:undefined})));
test('blank source label is rejected',async()=>invalid(input({label:'   '})));
test('source label follows generic trim rules',async()=>assert.equal((await available(input({label:'  Tarifa propia estudio  '}))).source.label,'Tarifa propia estudio'));
test('known asOf calendar date is preserved',async()=>assert.equal((await available(input({asOf:'2026-10-15'}))).source.asOf,'2026-10-15'));
test('unknown asOf remains null without a current-date fallback',async()=>{
  assert.equal((await available()).source.asOf,null);
  assert.equal((await available(input({asOf:null}))).source.asOf,null);
});
test('impossible and informal dates are rejected by the 7C-A validator',async()=>{
  for(const asOf of ['2026-02-31','2026-13-01','27/10/2026','ayer'])await invalid(input({asOf}));
});
test('retrievedAt is always null for human entry',async()=>assert.equal((await available(input({retrievedAt:'2026-10-27T12:00:00Z'}))).source.retrievedAt,null));
test('adapter and wrapper do not mutate caller input',async()=>{
  const context=Object.freeze(input({asOf:'2026-10-15'})),before=JSON.stringify(context);
  await available(context);
  assert.equal(JSON.stringify(context),before);
});
test('real registry registers, gets and inspects Manual',()=>{
  const registry=Cost.createRegistry();
  assert.equal(registry.has('manual'),false);
  assert.equal(registry.register(Manual).id,'manual');
  assert.strictEqual(registry.get('manual'),Manual);
  assert.equal(registry.inspect('manual').sourceMetadata.kind,'manual');
});
test('real registry executes getPrice and unsupported operations',async()=>{
  const registry=Cost.createRegistry([Manual]);
  assert.equal((await registry.getPrice('manual','floor-bedroom',input())).quote.priceKind,'manual');
  assert.equal((await registry.search('manual',{text:'piso'})).status,'unsupported');
  assert.equal((await registry.getItem('manual','floor-bedroom')).status,'unsupported');
});
test('real registry rejects duplicate ID',()=>{
  const registry=Cost.createRegistry([Manual]);
  assert.throws(()=>registry.register(Manual),/already registered/);
});
test('real registry unregisters Manual without changing its availability as an option',()=>{
  const registry=Cost.createRegistry([Manual]);
  assert.equal(registry.unregister('manual'),true);
  assert.equal(registry.get('manual'),null);
  assert.equal(registry.register(Manual).id,'manual');
});
test('browser global export works after explicit script loading',async()=>{
  const sandbox={};vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/cost-provider.js'),'utf8'),sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/cost-provider-manual.js'),'utf8'),sandbox);
  assert.equal(sandbox.FloorPlanManualCostProvider.id,'manual');
  assert.equal((await sandbox.FloorPlanCostProvider.getPrice(sandbox.FloorPlanManualCostProvider,'floor-bedroom',input())).quote.currency,'EUR');
});
test('browser adapter works with network, DOM and storage globals forbidden',async()=>{
  const sandbox={};
  for(const name of ['fetch','XMLHttpRequest','window','document','localStorage','indexedDB']){
    Object.defineProperty(sandbox,name,{get(){throw Error(`${name} was accessed`);}});
  }
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/cost-provider.js'),'utf8'),sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/cost-provider-manual.js'),'utf8'),sandbox);
  const result=await sandbox.FloorPlanCostProvider.getPrice(sandbox.FloorPlanManualCostProvider,'floor-bedroom',input());
  assert.equal(result.status,'available');
  assert.equal(result.quote.source.licenseStatus,'not-applicable');
});
test('quote contains no review or Budget bridge and Budget V1 stays at 1.0.0',async()=>{
  const quote=await available();
  assert.equal(Object.hasOwn(quote,'review'),false);
  assert.equal(Object.hasOwn(quote,'priceSource'),false);
  assert.equal(require('../js/budget-core.js').VERSION,'1.0.0');
});
