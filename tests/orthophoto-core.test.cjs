const {test}=require('node:test'),assert=require('node:assert/strict');
const Parcel=require('../js/parcel-core.js'),Ortho=require('../js/orthophoto-core.js'),Adapter=require('../js/orthophoto-site-adapter.js'),Geo=require('../js/geo-provider.js'),Pnoa=require('../js/pnoa-orthophoto-provider.js');
const Project=require('../js/project-core.js'),Building=require('../js/building-core.js'),Package=require('../js/project-package.js'),Tracing=require('../js/tracing-core.js');
const parcel=Parcel.normalizeParcel({reference:'1907401VK4810H',sourceCrs:'EPSG:25830',sourceGeometry:{type:'MultiPolygon',polygons:[{rings:[[[500000,4500000],[500025,4500000],[500025,4500010],[500000,4500010]]]}]},source:{providerId:'fixture',type:'derived'}});
const source={providerId:Pnoa.provider.id,type:'official-source',sourceName:'Synthetic test',sourceUrl:Pnoa.ENDPOINT,retrievedAt:'2026-10-28T10:00:00Z',attribution:'Sistema Cartográfico Nacional',license:{status:'verified',name:'Test attribution'}};
const metadata=()=>{const {targetResolutionM,...q}=Ortho.requestFromParcel(parcel);return {...q,requestedResolutionM:targetResolutionM,sourcePolicy:'latest-available',mediaType:'image/jpeg',source};};
test('parcel source extent, pixels and north-up overlay are exact and bounded',()=>{
 const q=Ortho.requestFromParcel(parcel);assert.deepEqual(q.extent,{minX:500000,minY:4500000,maxX:500025,maxY:4500010});assert.equal(q.sourceCrs,'EPSG:25830');assert.deepEqual([q.widthPx,q.heightPx],[100,40]);assert.deepEqual(Ortho.sourceToPixel([500000,4500010],q),[0,0]);assert.deepEqual(Ortho.sourceToPixel([500025,4500000],q),[100,40]);
 assert.throws(()=>Ortho.normalizeRequest({...q,extent:{...q.extent,maxX:q.extent.minX+1000}}),/orthophoto-extent-too-large/);
 assert.throws(()=>Ortho.normalizeRequest({...q,sourceCrs:'EPSG:4326'}),/orthophoto-source-crs-unsupported/);
});
test('PNOA request uses fixed official WMS layer, exact EPSG metre bbox and JPEG',()=>{
 const u=new URL(Pnoa.buildGetMapUrl(Ortho.requestFromParcel(parcel))),p=u.searchParams;
 assert.equal(u.origin,'https://www.ign.es');assert.equal(u.pathname,'/wms-inspire/pnoa-ma');assert.equal(p.get('REQUEST'),'GetMap');assert.equal(p.get('VERSION'),'1.3.0');assert.equal(p.get('LAYERS'),'OI.OrthoimageCoverage');assert.equal(p.get('CRS'),'EPSG:25830');assert.equal(p.get('BBOX'),'500000,4500000,500025,4500010');assert.equal(p.get('WIDTH'),'100');assert.equal(p.get('HEIGHT'),'40');assert.equal(p.get('FORMAT'),'image/jpeg');
});
test('registry routes explicit orthophoto, validates provenance, keeps pixels out of durable site',async()=>{
 const q=Ortho.requestFromParcel(parcel),blob=new Blob([0xff,0xd8,0xff,0xd9],{type:'image/jpeg'}),fixture={...Pnoa.provider,id:'fixture-ortho',getProviderMetadata(){return {...Pnoa.provider.getProviderMetadata(),providerId:this.id};},getSourceMetadata(){return {...Pnoa.provider.getSourceMetadata(),providerId:this.id};},getOrthophoto(){return {status:'available',providerId:this.id,orthophoto:{...metadata(),imageBlob:blob,source:undefined},provenance:{...source,providerId:this.id}};}};
 const registry=Geo.createRegistry([fixture]);const result=await registry.getOrthophoto('fixture-ortho',q);assert.equal(result.status,'available');assert.equal(result.orthophoto.imageBlob,blob);const durable=Adapter.toSiteOrthophoto(result,parcel);assert.equal(durable.imageBlob,undefined);assert.equal(durable.source.providerId,'fixture-ortho');assert.deepEqual(Adapter.fromSiteOrthophoto(durable,parcel),durable);
 const missing=await registry.getOrthophoto('missing',q);assert.deepEqual([missing.status,missing.reason],['not-found','provider-not-registered']);const oversized=await registry.getOrthophoto('fixture-ortho',{...q,extent:{...q.extent,maxX:501000}});assert.deepEqual([oversized.status,oversized.reason],['unsupported','orthophoto-extent-too-large']);
 const controller=new AbortController();controller.abort();assert.equal((await registry.getOrthophoto('fixture-ortho',q,{signal:controller.signal})).status,'cancelled');
 assert.throws(()=>Adapter.fromSiteOrthophoto({...durable,extent:{...durable.extent,maxX:durable.extent.maxX+1}},parcel),/orthophoto-extent-invalid/);
});
test('PNOA rejects WMS XML, oversized and mismatched rasters even on HTTP 200',async()=>{
 const originalFetch=globalThis.fetch,originalBitmap=globalThis.createImageBitmap,q=Ortho.requestFromParcel(parcel);
 try{
  globalThis.fetch=async()=>new Response('<ServiceException/>',{status:200,headers:{'content-type':'text/xml'}});
  const xml=await Pnoa.provider.getOrthophoto(q);assert.deepEqual([xml.status,xml.reason],['unavailable','invalid-raster-response']);
  globalThis.fetch=async()=>new Response('x',{status:200,headers:{'content-type':'image/jpeg','content-length':'8000001'}});
  assert.equal((await Pnoa.provider.getOrthophoto(q)).reason,'response-too-large');
  globalThis.fetch=async()=>new Response(new Uint8Array([0xff,0xd8,0xff,0xd9]),{status:200,headers:{'content-type':'image/jpeg'}});
  globalThis.createImageBitmap=async()=>({width:99,height:40,close(){}});
  assert.equal((await Pnoa.provider.getOrthophoto(q)).reason,'invalid-raster-response');
  globalThis.createImageBitmap=async()=>({width:100,height:40,close(){}});
  assert.equal((await Pnoa.provider.getOrthophoto(q)).status,'available');
  globalThis.fetch=async()=>new Response('missing',{status:404,headers:{'content-type':'text/html'}});
  assert.equal((await Pnoa.provider.getOrthophoto(q)).reason,'service-error');
  globalThis.fetch=async()=>new Response(null,{status:200,headers:{'content-type':'image/jpeg'}});
  assert.equal((await Pnoa.provider.getOrthophoto(q)).reason,'invalid-raster-response');
  globalThis.fetch=async()=>{throw Error('offline');};
  assert.equal((await Pnoa.provider.getOrthophoto(q)).reason,'network-unavailable');
  const controller=new AbortController();controller.abort();assert.equal((await Pnoa.provider.getOrthophoto(q,{signal:controller.signal})).status,'cancelled');
  const during=new AbortController();globalThis.fetch=async(_url,options)=>{during.abort();throw options.signal.reason;};assert.equal((await Pnoa.provider.getOrthophoto(q,{signal:during.signal})).status,'cancelled');
 }finally{globalThis.fetch=originalFetch;globalThis.createImageBitmap=originalBitmap;}
});
test('project and building JSON/ZIP keep metadata, never raster, with root site authority',async()=>{
 const durable=metadata(),base=Project.initial(),withSite=Project.setSite(base,{parcel:{...parcel,source:{providerId:'fixture',type:'derived'}},orthophoto:durable});
 assert.equal(withSite.schemaVersion,'1.10.0');assert.equal(withSite.site.orthophoto.imageBlob,undefined);
 assert.throws(()=>Project.validate({...withSite,schemaVersion:'1.9.0'}),/requires project 1.10.0/);
 assert.throws(()=>Project.setSite(base,{orthophoto:durable}),/orthophoto/);
 assert.deepEqual(Project.prepare(JSON.stringify(withSite)).project.site.orthophoto,durable);
 const entries=await Package.unzip(await (await Package.encode(withSite,()=>{throw Error('image');})).arrayBuffer());assert.deepEqual((await Package.validateEntries(entries,Tracing.imageInfo)).project.site.orthophoto,durable);
 const building=Building.create(withSite);assert.equal(building.schemaVersion,'1.3.0');assert.deepEqual(building.site.orthophoto,durable);assert.equal(building.levels[0].project.site?.orthophoto,undefined);
 assert.deepEqual(Building.prepare(JSON.stringify(building)).site.orthophoto,durable);
 const packed=await Building.packageEntries(building,()=>{throw Error('image');});assert.deepEqual((await Building.readEntries(packed.entries,Tracing.imageInfo)).building.site.orthophoto,durable);
 const exported=Building.exportLevel(building,building.levels[0].id).project;assert.deepEqual(exported.site.orthophoto,durable);assert.equal(exported.schemaVersion,'1.10.0');
});
