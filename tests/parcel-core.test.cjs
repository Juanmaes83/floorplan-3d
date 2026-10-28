const {test}=require('node:test'),assert=require('node:assert/strict');
const Parcel=require('../js/parcel-core.js'),Adapter=require('../js/parcel-site-adapter.js');
const Geo=require('../js/geo-provider.js'),Core=require('../js/project-core.js'),Building=require('../js/building-core.js');
const Package=require('../js/project-package.js'),Tracing=require('../js/tracing-core.js');
const freeze=v=>{if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
const outer=[[0,0],[10,0],[10,10],[0,10],[0,0]];
const hole=[[2,2],[2,4],[4,4],[4,2],[2,2]];
const next=[[20,0],[25,0],[25,5],[20,5],[20,0]];
const geometry={type:'MultiPolygon',polygons:[{rings:[outer,hole]},{rings:[next]}]};
const raw=(g=geometry,crs='EPSG:25830')=>({reference:'1907401VK4810H',sourceCrs:crs,sourceGeometry:g});
const source={providerId:'fixture-territory',type:'official-source',sourceName:'Synthetic GML',attribution:'Synthetic attribution',license:{status:'restricted',name:'Synthetic terms'}};
test('reference normalization follows official 14/18/20 prefix rule without correction',()=>{
 assert.equal(Parcel.normalizeReference(' 1907401vk4810h '),'1907401VK4810H');
 assert.equal(Parcel.normalizeReference('1907401VK4810H0000'),'1907401VK4810H');
 assert.equal(Parcel.normalizeReference('1907401VK4810H000000'),'1907401VK4810H');
 assert.equal(Parcel.normalizeReference('1907401-VK4810H'),'1907401VK4810H');
 for(const bad of ['1907401VK4810','1907401VK4810H*','1907401VK4810H00000','1907401/VK4810H'])assert.throws(()=>Parcel.normalizeReference(bad),/invalid-parcel-reference/);
});
test('canonical source geometry preserves holes, members, precision and deterministic frame',()=>{
 const a=freeze(raw()),normal=Parcel.normalizeParcel(a);
 const rotated=outer.slice(2,-1).concat(outer.slice(0,3)).reverse();
 const reversedHole=hole.slice().reverse();
 const swapped={type:'MultiPolygon',polygons:[{rings:[next.slice().reverse()]},{rings:[rotated,reversedHole]}]};
 assert.deepEqual(Parcel.normalizeParcel(raw(swapped)),normal);
 assert.equal(normal.sourceGeometry.polygons.length,2);assert.equal(normal.sourceGeometry.polygons[0].rings.length,2);
 assert.deepEqual(normal.frame,{sourceCrs:'EPSG:25830',originX:12.5,originY:5,sourceUnits:'m',xAxis:'east',yAxis:'north'});
 const local=Parcel.toLocalGeometry(normal);assert.deepEqual(local.polygons[0].rings[0][0],[-12500,5000]);
 assert.deepEqual(a,raw());assert.equal(normal.sourceGeometry.polygons[0].rings[0].length,4);
 const island={type:'MultiPolygon',polygons:[{rings:[outer,hole]},{rings:[[[2.5,2.5],[3.5,2.5],[3.5,3.5],[2.5,3.5],[2.5,2.5]]]}]};
 assert.equal(Parcel.normalizeParcel(raw(island)).sourceGeometry.polygons.length,2);
});
test('geometry rejects invalid rings, holes, overlap and unsupported CRS without repairing',()=>{
 const cases=[
  {type:'MultiPolygon',polygons:[{rings:[[[0,0],[10,10],[0,10],[10,0],[0,0]]]}]},
  {type:'MultiPolygon',polygons:[{rings:[outer,[[9,9],[11,9],[11,11],[9,11],[9,9]]]}]},
  {type:'MultiPolygon',polygons:[{rings:[outer]},{rings:[[[5,5],[15,5],[15,15],[5,15],[5,5]]]}]},
  {type:'MultiPolygon',polygons:[{rings:[[[0,0],[10,0],[10,0],[0,10],[0,0]]]}]},
  {type:'MultiPolygon',polygons:[{rings:[[[0,0],[10,0],[5,0],[10,10],[0,10],[0,0]]]}]}
 ];
 for(const g of cases)assert.throws(()=>Parcel.normalizeParcel(raw(g)),/invalid-source-geometry/);
 for(const crs of ['EPSG:4326','EPSG:4258','EPSG:3857','EPSG:25832'])assert.throws(()=>Parcel.normalizeParcel(raw(geometry,crs)),/unsupported-source-crs/);
 assert.equal(Parcel.normalizeCrs('http://www.opengis.net/def/crs/EPSG/0/32628'),'EPSG:32628');
});
test('registry parcel routing is explicit, capability-gated, immutable and stable',async()=>{
 const registry=Geo.createDefaultRegistry(),desc=registry.inspect('catastro-inspire-cp');
 assert.equal(desc.network,'none');assert.deepEqual(desc.parcelInputModes,['document']);assert.equal(desc.license.status,'restricted');
 assert.deepEqual(await registry.getParcel('missing',{mode:'document',text:'x'}),{status:'not-found',providerId:'missing',reason:'provider-not-registered'});
 assert.deepEqual(await registry.getParcel('manual',{mode:'document',text:'x'}),{status:'unsupported',providerId:'manual',reason:'capability-disabled'});
 assert.deepEqual(await registry.getParcel('catastro-inspire-cp',{mode:'reference',reference:'1907401VK4810H'}),{status:'unsupported',providerId:'catastro-inspire-cp',reason:'parcel-input-mode-disabled'});
 const controller=new AbortController();controller.abort();
 assert.deepEqual(await registry.getParcel('catastro-inspire-cp',{mode:'document',text:'x'},{signal:controller.signal}),{status:'cancelled',providerId:'catastro-inspire-cp',reason:'cancelled'});
});
test('site.parcel survives project and building JSON/ZIP without provider and never changes editable geometry',async()=>{
 const parcel=Parcel.normalizeParcel(raw()),durable=freeze({...parcel,source});
 assert.deepEqual(Adapter.toSiteParcel(Adapter.fromSiteParcel(durable)),durable);
 const project=Core.initial(),before={walls:project.walls,openings:project.openings,rooms:project.rooms,materials:project.materials,objects:project.objects};
 const next=Core.setSite(project,{parcel:durable});
 assert.equal(next.schemaVersion,'1.9.0');
 assert.deepEqual(Object.fromEntries(Object.keys(before).map(k=>[k,next[k]])),before);
 assert.throws(()=>Core.validate({...next,schemaVersion:'1.8.0'}),/requires project 1.9.0/);
 assert.deepEqual(Core.prepare(JSON.stringify(next)).project.site.parcel,durable);
 const entries=await Package.unzip(await (await Package.encode(next,()=>{throw Error('image');})).arrayBuffer());
 assert.deepEqual((await Package.validateEntries(entries,Tracing.imageInfo)).project.site.parcel,durable);
 const building=Building.create(next);assert.equal(building.schemaVersion,'1.2.0');assert.equal(building.levels[0].project.site.parcel,undefined);
 assert.deepEqual(building.site.parcel,durable);
 assert.deepEqual(Building.prepare(JSON.stringify(building)).site.parcel,durable);
 const packed=await Building.packageEntries(building,()=>{throw Error('image');});
 assert.deepEqual((await Building.readEntries(packed.entries,Tracing.imageInfo)).building.site.parcel,durable);
 const exported=Building.exportLevel(building,building.levels[0].id).project;
 assert.equal(exported.schemaVersion,'1.9.0');assert.deepEqual(exported.site.parcel,durable);
 const removed=Core.setSite(next,undefined);assert.equal(removed.schemaVersion,'1.9.0');
 const removedBuilding=Building.setSite(building,undefined);assert.equal(removedBuilding.schemaVersion,'1.2.0');
});
