const {test}=require('node:test'),assert=require('node:assert/strict');
const Solar=require('../js/solar-core.js'),Geo=require('../js/geo-provider.js'),Core=require('../js/project-core.js'),B=require('../js/building-core.js');
const madrid={latitude:40.4168,longitude:-3.7038,timeZone:'Europe/Madrid',northOffsetDeg:0,localDate:'2026-06-21',localTime:'14:00'};
test('north hemisphere: morning east, afternoon west, summer higher than winter and night below horizon',()=>{
 const p=t=>Solar.position({...madrid,localTime:t}),am=p('09:00'),noon=p('14:00'),pm=p('19:00'),night=p('02:00');
 assert.equal(noon.status,'available-orientative');assert.ok(am.azimuthDeg>45&&am.azimuthDeg<135);assert.ok(pm.azimuthDeg>225&&pm.azimuthDeg<315);assert.ok(noon.altitudeDeg>70);assert.ok(!night.aboveHorizon);
 assert.ok(Solar.position({...madrid,localDate:'2026-12-21'}).altitudeDeg<30);
 assert.ok(am.sceneDirection.x>0);assert.ok(pm.sceneDirection.x<0);assert.ok(noon.sceneDirection.z>0);
});
test('south hemisphere summer sun is north at noon; normalized direction and declared north rotate the scene only',()=>{
 const p=Solar.position({...madrid,latitude:-33.8688,longitude:151.2093,timeZone:'Australia/Sydney',localDate:'2026-12-21',localTime:'13:00'});
 assert.ok(p.altitudeDeg>70);assert.ok(p.azimuthDeg<25||p.azimuthDeg>335);assert.ok(p.sceneDirection.z<0);
 const q=Solar.position({...madrid,northOffsetDeg:90}),r=Solar.position(madrid);
 assert.equal(q.azimuthDeg,r.azimuthDeg);assert.ok(Math.abs(q.sceneDirection.x+r.sceneDirection.z)<1e-12);assert.ok(Math.abs(q.sceneDirection.z-r.sceneDirection.x)<1e-12);
 assert.ok(Math.abs(Math.hypot(...Object.values(q.sceneDirection))-1)<1e-12);
});
test('IANA local time resolves winter, summer and DST; nonexistent and repeated times are rejected explicitly',()=>{
 assert.equal(Solar.localInstant('2026-01-15','12:00','Europe/Madrid').instant,'2026-01-15T11:00:00.000Z');
 assert.equal(Solar.localInstant('2026-07-15','12:00','Europe/Madrid').instant,'2026-07-15T10:00:00.000Z');
 assert.equal(Solar.localInstant('2026-03-29','02:30','Europe/Madrid').reason,'nonexistent-time');
 assert.equal(Solar.localInstant('2026-10-25','02:30','Europe/Madrid').reason,'ambiguous-time');
 assert.equal(Solar.localInstant('2026-03-29','03:30','Europe/Madrid').instant,'2026-03-29T01:30:00.000Z');
 assert.equal(Solar.localInstant('2026-06-21','12:00','Asia/Kolkata').offsetMinutes,330);
 const utc=Solar.position({...madrid,timeZone:'UTC',localTime:'12:00'}),local=Solar.position(madrid);assert.equal(utc.instant,local.instant);assert.equal(utc.azimuthDeg,local.azimuthDeg);
});
test('invalid or absent data never creates coordinates, time or north',()=>{
 for(const patch of [{latitude:''},{latitude:91},{longitude:181},{timeZone:'UTC+1'},{northOffsetDeg:undefined},{northOffsetDeg:360},{localDate:'2026-02-30'},{localTime:'25:00'}])assert.equal(Solar.position({...madrid,...patch}).status,'unavailable');
 assert.equal(Solar.position().status,'unavailable');
 const p=Core.initial(),before=JSON.stringify(p);assert.equal(p.site,undefined);assert.equal(Solar.position(p.site).status,'unavailable');assert.equal(JSON.stringify(p),before);
});
test('manual provider contract is offline, minimal and honest about supported capabilities',()=>{
 assert.equal(Geo.Manual.capabilities.coordinates,true);for(const name of ['search','parcel','geometry','orthophoto','elevation','terrain'])assert.equal(Geo.Manual.capabilities[name],false);
 const result=Geo.Manual.getCoordinates({...madrid,owner:'private',taxValue:123});assert.equal(result.status,'available');assert.deepEqual(result.location,{latitude:madrid.latitude,longitude:madrid.longitude,timeZone:madrid.timeZone,source:{providerId:'manual',type:'user-entered'}});
 assert.equal(Geo.Manual.getCoordinates({latitude:'',longitude:'',timeZone:''}).status,'unavailable');
});
test('site roundtrip, versioning, unknown future project fields and shared building authority',()=>{
 const site={northOffsetDeg:25,location:Geo.Manual.getCoordinates(madrid).location},p=Core.initial(),original=JSON.stringify(p),q=Core.setSite(p,site);
 assert.equal(q.schemaVersion,'1.7.0');assert.equal(JSON.stringify(p),original);assert.deepEqual(Core.prepare(JSON.stringify(q)).project.site,site);
 const future={...q,schemaVersion:'1.99.0',futureFeature:{value:7}};assert.deepEqual(Core.setSite(future,{...site,northOffsetDeg:40}).futureFeature,{value:7});
 const building=B.create(q),second=Core.initial();second.id=Core.id('prj');second.sourceImages=[];const multi=B.addLevel(building,second,{name:'Upper'}),updated=B.setSite(multi,{...site,northOffsetDeg:150});
 assert.equal(updated.schemaVersion,'1.1.0');assert.equal(updated.site.northOffsetDeg,150);assert.equal(updated.levels[0].project.site.northOffsetDeg,25);
 assert.equal(B.exportLevel(updated,updated.levels[1].id).project.site.northOffsetDeg,150);
 assert.deepEqual(B.prepare(JSON.stringify(updated)).site,updated.site);assert.deepEqual(B.duplicate(updated).site,updated.site);
 assert.throws(()=>B.validate({...updated,schemaVersion:'1.0.0'}),/requires/);assert.throws(()=>Core.validate({...q,schemaVersion:'1.6.0'}),/requires/);
});
test('independent NREL SPA published example agrees within 0.5 degrees (product tolerance)',()=>{
 // https://docs.nlr.gov/docs/fy08osti/34302.pdf, Appendix A reference output.
 // NREL/TP-560-34302 SPA example, 2003-10-17 12:30:30 MST: azimuth 194.34024°, zenith 50.11162°.
 // Minute-only UI uses 12:30:00, a 30s difference. SunCalc refraction differs slightly; no scientific claim.
 const p=Solar.position({latitude:39.742476,longitude:-105.1786,timeZone:'Etc/GMT+7',localDate:'2003-10-17',localTime:'12:30',northOffsetDeg:0});
 assert.ok(Math.abs(p.azimuthDeg-194.34024)<.5);assert.ok(Math.abs(p.altitudeDeg-(90-50.11162))<.5);
});

test('project and building ZIP roundtrip retain internal site without adding geographic media or network dependencies',async()=>{
 const Package=require('../js/project-package.js'),T=require('../js/tracing-core.js');
 const p=Core.initial();p.sourceImages=[];const site={northOffsetDeg:70,location:Geo.Manual.getCoordinates(madrid).location},q=Core.setSite(p,site);
 const archive=await Package.encode(q,()=>{throw Error('unexpected image');});const entries=await Package.unzip(await archive.arrayBuffer());const parsed=await Package.validateEntries(entries,T.imageInfo);assert.deepEqual(parsed.project.site,site);assert.equal(entries.size,1);
 const b=B.create(q),pack=await B.packageEntries(b,()=>{throw Error('unexpected image');});const decoded=await B.readEntries(pack.entries,T.imageInfo);assert.deepEqual(decoded.building.site,site);assert.equal(pack.entries.size,2);
});
