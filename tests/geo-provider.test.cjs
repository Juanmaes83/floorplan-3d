const {test}=require('node:test'),assert=require('node:assert/strict');
const Geo=require('../js/geo-provider.js');
const input={latitude:40.4168,longitude:-3.7038,timeZone:'Europe/Madrid'};
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const capabilities=()=>Object.fromEntries(Geo.CAPABILITIES.map(k=>[k,['coordinates','sourceMetadata'].includes(k)]));
function fixture(id='fixture-offline',patch={}){
 const caps=patch.capabilities||capabilities();
 const metadata=patch.metadata||{providerId:id,label:'Fixture',kind:'other',network:'none',sourceName:'Synthetic fixture',license:{status:'unknown'},...(caps.parcel?{parcelInputModes:['document']}:null)};
 const source=patch.source||{providerId:id,type:'derived'};
 return {id,contractVersion:Geo.CONTRACT_VERSION,getCapabilities:()=>caps,getProviderMetadata:()=>metadata,
  getSourceMetadata:()=>source,getCoordinates:patch.getCoordinates||(()=>({status:'available',location:{...input,source}})),getParcel:patch.getParcel||(()=>({status:'not-found',reason:'parcel-not-found'}))};
}
test('v1 contract has exactly eight capabilities, finite modes and compatible offline Manual',async()=>{
 assert.equal(Geo.CONTRACT_VERSION,'1.2.0');
 assert.deepEqual(Geo.CAPABILITIES,['search','parcel','geometry','coordinates','sourceMetadata','orthophoto','elevation','terrain']);
 assert.deepEqual(Geo.NETWORK_MODES,['none','optional','required']);
 assert.deepEqual(Geo.RESULT_STATUSES,['available','not-found','unavailable','invalid','unsupported','cancelled']);
 assert.deepEqual(Geo.Manual.capabilities,capabilities());
 assert.deepEqual(Geo.Manual.getCapabilities(),Geo.Manual.capabilities);
 assert.deepEqual(Geo.Manual.getSourceMetadata(),{providerId:'manual',type:'user-entered'});
 const direct=Geo.Manual.getCoordinates(freeze({...input,owner:'private'}));
 assert.deepEqual(direct,{status:'available',location:{...input,source:{providerId:'manual',type:'user-entered'}}});
 assert.equal(Geo.Manual.getCoordinates({latitude:'',longitude:'',timeZone:''}).status,'unavailable');
 const descriptor=Geo.inspectProvider(Geo.Manual);
 assert.equal(descriptor.network,'none');assert.deepEqual(descriptor.license,{status:'not-applicable'});
 assert.equal(descriptor.sourceName,undefined);assert.equal(descriptor.sourceUrl,undefined);
 const normalized=await Geo.createDefaultRegistry().getCoordinates('manual',freeze({...input,owner:'private'}));
 assert.deepEqual(normalized,{status:'available',providerId:'manual',location:input,provenance:{providerId:'manual',type:'user-entered'}});
 assert.equal(normalized.provenance.retrievedAt,undefined);
});
test('inspection validates descriptor, provenance and operation atomically',()=>{
 const provider=fixture('fixture-official',{metadata:{providerId:'fixture-official',label:'Fixture official',kind:'official',network:'optional',sourceName:'Synthetic only',sourceUrl:'https://example.test/source',edition:'2026',region:'test',coverage:'test-square',attribution:'Test attribution',license:{status:'unknown',note:'Unverified'}}});
 const descriptor=Geo.inspectProvider(provider);assert.equal(descriptor.providerId,'fixture-official');assert.equal(descriptor.network,'optional');assert.equal(descriptor.license.status,'unknown');
 assert.equal(descriptor.sourceUrl,'https://example.test/source');assert.equal(descriptor.capabilities.coordinates,true);
 const cases=[
  [fixture(''),/provider.id/],
  [fixture('bad id'),/provider.id/],
  [{...fixture(),getCapabilities:()=>({coordinates:true})},/capabilities.search/],
  [{...fixture(),getCapabilities:()=>({...capabilities(),parcel:'true'})},/capabilities.parcel/],
  [{...fixture(),getCapabilities:()=>({...capabilities(),parcel:1})},/capabilities.parcel/],
  [{...fixture(),getCapabilities:()=>({...capabilities(),parcel:null})},/capabilities.parcel/],
  [{...fixture(),getProviderMetadata:()=>({...fixture().getProviderMetadata(),network:'sometimes'})},/network/],
  [{...fixture(),getProviderMetadata:()=>({...fixture().getProviderMetadata(),providerId:'other'})},/providerId/],
  [{...fixture(),getProviderMetadata:()=>({...fixture().getProviderMetadata(),license:{status:'approved'}})},/license.status/],
  [{...fixture(),getProviderMetadata:()=>({...fixture().getProviderMetadata(),sourceUrl:'file:///tmp/source'})},/sourceUrl/],
  [{...fixture(),getProviderMetadata:()=>({...fixture().getProviderMetadata(),license:{status:'unknown',url:'javascript:alert(1)'}})},/license.url/],
  [{...fixture(),getCoordinates:undefined},/getCoordinates/],
  [{...fixture(),getSourceMetadata:()=>({providerId:'other',type:'derived'})},/source.providerId/],
  [{...fixture(),getSourceMetadata:()=>({providerId:'fixture-offline',type:'derived',retrievedAt:'2026-02-31T10:00:00Z'})},/retrievedAt/]
 ];
 const registry=Geo.createRegistry([provider]);const before=registry.list();
 for(const [bad,message] of cases){assert.throws(()=>Geo.inspectProvider(bad),message);assert.throws(()=>registry.register(bad),message);assert.deepEqual(registry.list(),before);}
});
test('registry is isolated, sorted, filterable and duplicate registration is atomic',()=>{
 const a=fixture('z-provider'),b=fixture('a-provider',{capabilities:{...capabilities(),coordinates:false,parcel:true},getCoordinates(){throw Error('must not call');}});
 const registry=Geo.createRegistry([a]);registry.register(b);
 assert.equal(registry.has(a.id),true);assert.equal(registry.get(a.id),a);assert.equal(registry.get('missing'),null);
 assert.deepEqual(registry.list().map(d=>d.providerId),['a-provider','z-provider']);
 assert.deepEqual(registry.list({capability:'coordinates'}).map(d=>d.providerId),['z-provider']);
 assert.deepEqual(registry.list({capability:'parcel'}).map(d=>d.providerId),['a-provider']);
 assert.throws(()=>registry.list({capability:'unknown'}),/capability/);
 const before=registry.list();assert.throws(()=>registry.register(fixture('a-provider')),/already registered/);assert.deepEqual(registry.list(),before);
 const inspected=registry.inspect('z-provider');inspected.capabilities.coordinates=false;inspected.license.status='verified';
 registry.list()[0].label='Changed';assert.equal(registry.inspect('z-provider').capabilities.coordinates,true);assert.equal(registry.inspect('z-provider').license.status,'unknown');
 assert.equal(registry.unregister('a-provider'),true);assert.equal(registry.unregister('a-provider'),false);assert.equal(registry.has('a-provider'),false);
 assert.deepEqual(Geo.createRegistry().list(),[]);
});
test('routing has no fallback; disabled, invalid, thrown and cancelled calls never claim availability',async()=>{
 let called=0;
 const disabled=fixture('disabled',{capabilities:{...capabilities(),coordinates:false},getCoordinates(){called++;throw Error('unreachable');}});
 const broken=fixture('broken',{getCoordinates(){called++;throw Error('private stack');}});
 const absent=fixture('absent',{getCoordinates(){called++;return {status:'not-found',reason:'private detail'};}});
 const malformed=fixture('malformed',{getCoordinates(){called++;return {status:'available',location:{...input,source:{providerId:'wrong',type:'derived'}}};}});
 const registry=Geo.createRegistry([disabled,broken,absent,malformed,Geo.Manual]);
 assert.deepEqual(await registry.getCoordinates('missing',input),{status:'not-found',providerId:'missing',reason:'provider-not-registered'});
 assert.deepEqual(await registry.getCoordinates(undefined,input),{status:'invalid',providerId:null,reason:'invalid-provider-id'});
 assert.deepEqual(await registry.getCoordinates('disabled',input),{status:'unsupported',providerId:'disabled',reason:'capability-disabled'});
 assert.equal(called,0);
 assert.deepEqual(await registry.getCoordinates('manual',{...input,latitude:''}),{status:'invalid',providerId:'manual',reason:'coordinates'});
 assert.deepEqual(await registry.getCoordinates('manual',{...input,timeZone:'UTC+1'}),{status:'invalid',providerId:'manual',reason:'timeZone'});
 assert.deepEqual(await registry.getCoordinates('broken',input),{status:'unavailable',providerId:'broken',reason:'provider-error'});
 assert.deepEqual(await registry.getCoordinates('absent',input),{status:'not-found',providerId:'absent',reason:'coordinates-not-found'});
 assert.deepEqual(await registry.getCoordinates('malformed',input),{status:'unavailable',providerId:'malformed',reason:'provider-error'});
 const controller=new AbortController();controller.abort();
 assert.deepEqual(await registry.getCoordinates('broken',input,{signal:controller.signal}),{status:'cancelled',providerId:'broken',reason:'cancelled'});
 assert.equal(called,3);
});
test('async providers receive a separate frozen query, retain result provenance and do not mutate inputs',async()=>{
 const query=freeze({...input,privateToken:'never pass'}),context=freeze({note:'private'});
 let called=0;
 const source=freeze({providerId:'async-fixture',type:'official-source',sourceName:'Synthetic',sourceUrl:'https://example.test/item',sourceId:'item-1',retrievedAt:'2026-10-28T10:00:00Z',version:'v1',derivedFrom:'fixture'});
 const provider=fixture('async-fixture',{source,getCoordinates:async(received,receivedContext)=>{
  called++;assert.equal(Object.isFrozen(received),true);assert.equal(Object.isFrozen(receivedContext),true);
  assert.deepEqual(received,input);assert.deepEqual(receivedContext,{});
  return {status:'available',location:{...received,source}};
 }});
 const registry=Geo.createRegistry([provider]);const descriptor=registry.inspect(provider.id);
 const output=await registry.getCoordinates(provider.id,query,context);
 assert.equal(called,1);assert.deepEqual(output.location,input);assert.deepEqual(output.provenance,source);
 assert.equal(output.provenance.license,undefined);assert.equal(descriptor.license.status,'unknown');
 assert.deepEqual(query,{...input,privateToken:'never pass'});assert.deepEqual(context,{note:'private'});
 assert.equal(registry.list({capability:'orthophoto'}).length,0);
 assert.deepEqual(Geo.createDefaultRegistry().list().map(d=>d.providerId),['catastro-inspire-cp','ign-pnoa-ma-wms','manual']);
});
