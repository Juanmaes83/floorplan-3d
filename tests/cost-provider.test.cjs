const test=require('node:test');
const assert=require('node:assert/strict');
const Cost=require('../js/cost-provider.js');

function provider(overrides={}){
  const base={
    id:'synthetic',
    getCapabilities(){return {search:true,getItem:true,getPrice:true,network:'none'};},
    getSourceMetadata(){return {providerId:'synthetic',label:'Synthetic',kind:'other',sourceName:'Synthetic fixture',sourceUrl:null,edition:null,region:null,attribution:null,license:{status:'not-applicable',name:null,url:null}};},
    async search(query){return {status:'available',providerId:'synthetic',items:[{providerId:'synthetic',itemId:'it-1',code:'A1',description:`Found ${query.text}`,unit:'m2',category:'floor'}]};},
    async getItem(id){return id==='missing'?{status:'not-found',providerId:'synthetic',reason:'missing'}:{status:'available',providerId:'synthetic',item:{providerId:'synthetic',itemId:id,code:null,description:'Item',unit:'m2',category:null}};},
    async getPrice(id){return {status:'available',providerId:'synthetic',quote:{providerId:'synthetic',itemId:id,code:'A1',description:'Item',unit:'m2',unitPrice:28.43,currency:'EUR',priceKind:'reference',source:{label:'Synthetic source',asOf:'2026-10-27',retrievedAt:'2026-10-27T12:00:00Z',edition:'2026',region:'ES',sourceUrl:'https://example.test/source',attribution:'Fixture attribution',licenseStatus:'verified',licenseName:'Fixture',licenseUrl:'https://example.test/license'}}};}
  };
  return Object.assign(base,overrides);
}

test('exports contract constants',()=>{
  assert.equal(Cost.CONTRACT_VERSION,'1.0.0');
  assert.equal(Cost.CURRENCY,'EUR');
  assert.ok(Cost.RESULT_STATUSES.includes('unsupported'));
});

test('valid provider inspection returns normalized snapshot',()=>{
  const inspected=Cost.inspectProvider(provider());
  assert.equal(inspected.id,'synthetic');
  assert.deepEqual(inspected.capabilities,{search:true,getItem:true,getPrice:true,network:'none'});
  assert.equal(inspected.sourceMetadata.license.status,'not-applicable');
});

test('provider id must be non-empty',()=>assert.throws(()=>Cost.inspectProvider(provider({id:' '})),/provider.id/));
test('provider requires getCapabilities',()=>assert.throws(()=>Cost.inspectProvider(provider({getCapabilities:null})),/getCapabilities/));
test('provider requires getSourceMetadata',()=>assert.throws(()=>Cost.inspectProvider(provider({getSourceMetadata:null})),/getSourceMetadata/));
test('capability true requires method',()=>assert.throws(()=>Cost.inspectProvider(provider({search:null})),/provider.search/));
test('metadata provider id must match',()=>assert.throws(()=>Cost.inspectProvider(provider({getSourceMetadata(){return {providerId:'other',label:'x',kind:'other',sourceName:'x',license:{status:'unknown'}};}})),/must match provider.id/));
test('license status is explicit',()=>assert.throws(()=>Cost.validateSourceMetadata({providerId:'x',label:'x',kind:'other',sourceName:'x',license:{status:'yes'}},'x'),/license.status/));
test('http(s) URLs only',()=>assert.throws(()=>Cost.validateSourceMetadata({providerId:'x',label:'x',kind:'other',sourceName:'x',sourceUrl:'file:///tmp/a',license:{status:'unknown'}},'x'),/http\(s\)/));

test('search query normalizes optional filters',()=>{
  assert.deepEqual(Cost.validateSearchQuery({text:' piso ',unit:'m2',category:'floor',region:'ES',limit:5}),{text:'piso',unit:'m2',category:'floor',region:'ES',limit:5});
});
test('search requires text',()=>assert.throws(()=>Cost.validateSearchQuery({}),/search.text/));
test('search limit bounded',()=>assert.throws(()=>Cost.validateSearchQuery({text:'x',limit:101}),/between 1 and 100/));

test('catalog item keeps provider identity and unit',()=>{
  const item=Cost.validateItem({providerId:'p',itemId:'1',code:null,description:'Mortero',unit:'kg',category:null},'p');
  assert.equal(item.unit,'kg');
});
test('catalog item rejects provider mismatch',()=>assert.throws(()=>Cost.validateItem({providerId:'q',itemId:'1',description:'x',unit:'m2'},'p'),/must match provider.id/));

test('quote accepts zero as a real price',()=>{
  const q=Cost.validateQuote({providerId:'p',itemId:'1',description:'Gratis',unit:'unit',unitPrice:0,currency:'EUR',priceKind:'reference',source:{label:'Fuente'}},'p');
  assert.equal(q.unitPrice,0);
  assert.equal(q.source.asOf,null);
});
test('quote rejects null price',()=>assert.throws(()=>Cost.validateQuote({providerId:'p',itemId:'1',description:'x',unit:'m2',unitPrice:null,currency:'EUR',priceKind:'reference',source:{label:'x'}},'p'),/unitPrice/));
test('quote is EUR-only in contract V1',()=>assert.throws(()=>Cost.validateQuote({providerId:'p',itemId:'1',description:'x',unit:'m2',unitPrice:1,currency:'USD',priceKind:'reference',source:{label:'x'}},'p'),/must be EUR/));
test('quote keeps manual/reference distinction',()=>{
  assert.equal(Cost.validateQuote({providerId:'p',itemId:'1',description:'x',unit:'m',unitPrice:1,currency:'EUR',priceKind:'manual',source:{label:'x'}},'p').priceKind,'manual');
});
test('quote requires offset-aware retrievedAt',()=>assert.throws(()=>Cost.validateQuote({providerId:'p',itemId:'1',description:'x',unit:'m2',unitPrice:1,currency:'EUR',priceKind:'reference',source:{label:'x',retrievedAt:'2026-10-27T12:00:00'}},'p'),/offset-aware/));

test('search normalizes available items',async()=>{
  const result=await Cost.search(provider(),{text:'piso'});
  assert.equal(result.status,'available');
  assert.equal(result.items[0].description,'Found piso');
});
test('getItem preserves not-found status',async()=>{
  const result=await Cost.getItem(provider(),'missing');
  assert.deepEqual(result,{status:'not-found',providerId:'synthetic',reason:'missing'});
});
test('getPrice returns normalized quote',async()=>{
  const result=await Cost.getPrice(provider(),'it-1');
  assert.equal(result.quote.unitPrice,28.43);
  assert.equal(result.quote.source.region,'ES');
  assert.equal(result.quote.source.licenseStatus,'verified');
});
test('disabled capability returns unsupported without calling method',async()=>{
  let called=false;
  const p=provider({getCapabilities(){return {search:false,getItem:true,getPrice:true,network:'none'};},search(){called=true;throw Error('no');}});
  const result=await Cost.search(p,{text:'x'});
  assert.equal(result.status,'unsupported');
  assert.equal(called,false);
});
test('provider operational exception becomes unavailable',async()=>{
  const p=provider({async getPrice(){throw Error('offline');}});
  const result=await Cost.getPrice(p,'it-1');
  assert.deepEqual(result,{status:'unavailable',providerId:'synthetic',reason:'provider-error'});
});
test('malformed provider payload is a contract error',async()=>{
  const p=provider({async getPrice(){return {status:'available',providerId:'synthetic',quote:{}};}});
  await assert.rejects(()=>Cost.getPrice(p,'it-1'),/quote.providerId/);
});
test('invalid license status in quote is a contract error',()=>assert.throws(()=>Cost.validateQuote({providerId:'p',itemId:'1',description:'x',unit:'m2',unitPrice:1,currency:'EUR',priceKind:'reference',source:{label:'x',licenseStatus:'yes'}},'p'),/licenseStatus/));

test('input objects are cloned before provider invocation',async()=>{
  const q={text:'x'}; const ctx={nested:{a:1}};
  const p=provider({async search(query,context){query.text='mutated';context.nested.a=9;return {status:'available',providerId:'synthetic',items:[]};}});
  await Cost.search(p,q,ctx);
  assert.equal(q.text,'x');assert.equal(ctx.nested.a,1);
});

test('context must be a JSON-compatible object',async()=>{
  const cyclic={};cyclic.self=cyclic;
  await assert.rejects(()=>Cost.search(provider(),{text:'x'},cyclic),/JSON-compatible/);
});

test('registry registers and lists providers deterministically',()=>{
  const a=provider({id:'b',getSourceMetadata(){return {providerId:'b',label:'B',kind:'other',sourceName:'B',license:{status:'unknown'}};}});
  const b=provider({id:'a',getSourceMetadata(){return {providerId:'a',label:'A',kind:'other',sourceName:'A',license:{status:'unknown'}};}});
  const r=Cost.createRegistry([a,b]);
  assert.deepEqual(r.list().map(x=>x.id),['a','b']);
});
test('registry rejects duplicate provider ids',()=>{
  const r=Cost.createRegistry([provider()]);
  assert.throws(()=>r.register(provider()),/already registered/);
});
test('registry get and inspect do not invent missing provider',()=>{
  const r=Cost.createRegistry();
  assert.equal(r.get('missing'),null);assert.equal(r.inspect('missing'),null);
});
test('registry missing provider operation is normalized not-found',async()=>{
  const r=Cost.createRegistry();
  assert.deepEqual(await r.getPrice('missing','x'),{status:'not-found',providerId:'missing',reason:'provider-not-registered'});
});
test('registry can unregister',()=>{
  const r=Cost.createRegistry([provider()]);
  assert.equal(r.has('synthetic'),true);assert.equal(r.unregister('synthetic'),true);assert.equal(r.has('synthetic'),false);
});
test('browser global export works',()=>{
  const fs=require('node:fs'),vm=require('node:vm');
  const source=fs.readFileSync(require.resolve('../js/cost-provider.js'),'utf8');
  const context={URL,globalThis:null};context.globalThis=context;vm.createContext(context);vm.runInContext(source,context);
  assert.equal(context.FloorPlanCostProvider.CONTRACT_VERSION,'1.0.0');
});
