const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const A=require('../js/asset-catalog.js'),G=require('../js/generic-catalog.js'),Core=require('../js/project-core.js');
const manifest=JSON.parse(fs.readFileSync('assets/f3/catalog.manifest.json','utf8'));
const options={catalog:'rubik-sota-local',revision:crypto.createHash('sha256').update(fs.readFileSync('assets/f3/catalog.manifest.json')).digest('hex').slice(0,40)};
const copy=x=>JSON.parse(JSON.stringify(x));
test('generic catalog has explicit validated three dimensions without rewriting old projects',()=>{
 const original=Core.initial(),before=JSON.stringify(original);let count=0;
 for(const group of G.groups)for(const item of group.items){count++;assert.equal(item.length,6);for(const n of [item[2],item[3],item[5]])assert.ok(Number.isSafeInteger(n)&&n>0&&n<=10000);assert.equal(item[5],G.heights[item[0]]);}
 assert.equal(count,60);assert.equal(JSON.stringify(Core.prepare(original).project),before);
});
test('manifest adapts one verified source and hashes real fixture and permission bytes',()=>{
 const result=A.adapt(manifest,options);assert.equal(result.entries.length,1);assert.deepEqual(result.excluded,[]);const e=result.entries[0];
 assert.equal(e.bytes,fs.statSync(e.url).size);assert.equal(e.sha256,crypto.createHash('sha256').update(fs.readFileSync(e.url)).digest('hex'));
 assert.equal(e.permissionSha256,crypto.createHash('sha256').update(fs.readFileSync(e.permissionUrl)).digest('hex'));assert.match(fs.readFileSync(e.permissionUrl,'utf8'),/MIT License/);
 assert.deepEqual(e.dimensionsMm,{width:600,height:450,depth:400});assert.equal(e.normalization.unitToMeter,.5);
});
test('permission gates deny pending/missing/expired or incomplete usage and dimensions',()=>{
 const mutations=[m=>delete m[0].f3Evidence,m=>m[0].f3Evidence.permission.commercial=false,m=>m[0].f3Evidence.permission.redistribution=false,m=>m[0].f3Evidence.permission.streaming=false,m=>m[0].f3Evidence.permission.modification=false,m=>m[0].f3Evidence.permission.expires='2020-01-01',m=>m[0].f3Evidence.permission.territory='spain',m=>m[0].f3Evidence.permission.attribution='',m=>m[0].permissionDocumentRef='permissions/README.md',m=>m[0].f3Evidence.permissionSha256='pending',m=>m[0].dimensions.width=null,m=>m[0].dimensions.unit='unknown',m=>m[0].f3Evidence.dimensionsSource='',m=>m[0].qaStatus='pending'];
 for(const mutate of mutations){const m=copy(manifest);mutate(m);assert.equal(A.adapt(m,options).entries.length,0);}
 const lab=[{id:'unverified-model',brand:'excluded',qaStatus:'approved',commercialUseAllowed:true,redistributionAllowed:true}];assert.equal(A.adapt(lab,{catalog:'immersphere-asset-lab',revision:options.revision}).entries.length,0);
});
test('untrusted transform, extension, paths, sizes and duplicate IDs are excluded',()=>{
 for(const mutate of [m=>m[0].f3Evidence.normalization.rotationDeg=[0,NaN,0],m=>m[0].f3Evidence.normalization.unitToMeter=0,m=>m[0].f3Evidence.extensionsRequired=['KHR_draco_mesh_compression'],m=>m[0].modelPath='https://remote/asset.glb',m=>m[0].modelPath='assets/f3/../secret.glb',m=>m[0].f3Evidence.bytes=9000000,m=>m[0].f3Evidence.modelSha256='pending']){const m=copy(manifest);mutate(m);assert.equal(A.adapt(m,options).entries.length,0);}
 const m=copy(manifest);m.push(copy(m[0]));assert.equal(A.adapt(m,options).excluded[0].reason,'invalid-or-duplicate-id');
});
test('assetRef association/clear keeps room, identity, geometry and compatibility intact',()=>{
 const p=Core.initial(),object=p.objects[0];object.roomId=p.rooms[0].id;object.size.heightMm=700;object.elevationMm=100;
 const original=copy(object),entry=A.adapt(manifest,options).entries[0],associated=A.associate(object,entry);
 assert.deepEqual(object,original);const other=copy(associated);delete other.assetRef;assert.deepEqual(other,original);
 assert.equal(A.resolve([entry],associated.assetRef),entry);assert.equal(A.resolve([entry],{...associated.assetRef,catalogRevision:'a'.repeat(40)}),null);assert.equal(A.resolve([entry],{catalog:'immersphere-asset-lab',assetId:entry.id}),null);
 p.schemaVersion='1.3.0';p.objects[0]=associated;Core.validate(p);assert.deepEqual(Core.prepare(p).project,p);assert.deepEqual(A.associate(associated,null),original);
});
