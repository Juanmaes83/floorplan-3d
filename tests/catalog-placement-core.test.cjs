// CAT-03 (pure part): SKU → 3D through the existing asset pipeline (FloorPlanAssets.adapt/resolve), labelled generic
// fallback with its reason, never placing without verified dimensions, project link with undo-safe copies, and a
// C1–C4 cost provider that quotes only the sheet's sourced price (never from images).
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const P=require('../js/catalog-placement-core.js'),C=require('../js/catalog-product-core.js'),A=require('../js/asset-catalog.js'),Cost=require('../js/cost-provider.js');
const ROOT=path.join(__dirname,'..'),raw=fs.readFileSync(path.join(ROOT,'assets/f3/cat-ia.manifest.json')),MANIFEST=JSON.parse(raw);
const REV=crypto.createHash('sha256').update(raw).digest('hex').slice(0,40);
const entries=(m=MANIFEST,today)=>A.adapt(m,{catalog:'rubik-sota-local',revision:REV,today}).entries;
const PILOT=JSON.parse(fs.readFileSync(path.join(ROOT,'assets/cat-ia/fixtures/pilot-collection.json'),'utf8'));
const cat=()=>C.importCollection(C.createCatalog({catalogId:'piloto-sintetico-qa',studioId:'local'}),PILOT,{today:'2026-11-14'}).catalog;
const prod=(c,id,v)=>C.findProduct(c,id,v);

test('the two CAT-03 GLBs (own manifest assets/f3/cat-ia.manifest.json, catalogue rubik-sota-local) are our own, pass the SAME asset pipeline and match their generator byte for byte',()=>{
 const e=entries();assert.deepEqual(e.map(x=>x.id),['cat-ia-aparador-lumen','cat-ia-horno-h60']);assert.deepEqual(e.map(x=>x.room),[undefined,undefined],'not in the generic furniture search: placed only through «Producto de mi estudio», which keeps the SKU link and price');
 for(const id of ['cat-ia-aparador-lumen','cat-ia-horno-h60']){const x=e.find(y=>y.id===id),bytes=fs.readFileSync(path.join(ROOT,x.url));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),x.sha256);assert.equal(bytes.length,x.bytes);
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,x.permissionUrl))).digest('hex'),x.permissionSha256);
  // GLB accessor bounds (metres) equal the declared millimetres: x = width, y = height, z = depth.
  const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString()),a=json.accessors[0];
  assert.deepEqual([0,1,2].map(i=>Math.round((a.max[i]-a.min[i])*1000)),[x.dimensionsMm.width,x.dimensionsMm.height,x.dimensionsMm.depth]);
  assert.deepEqual(json.extensionsUsed,undefined);assert.equal(json.nodes[0].scale,undefined);}
 assert.equal(require('node:child_process').spawnSync('python3',['-I','scripts/cat-ia/make-glb-fixtures.py','--check'],{cwd:ROOT}).status,0);
});

test('plan: validated model when the reference resolves and measures match; labelled generic volume otherwise',()=>{
 const c=cat(),e=entries();
 const roble=P.plan(prod(c,'aparador-lumen','roble'),e);assert.equal(roble.ok,true);assert.equal(roble.representation,'validated-model');
 assert.deepEqual(roble.spec,{type:'dresser',w:1600,d:450,h:780,name:'Aparador Lumen 160 roble'});assert.deepEqual(roble.asset,{catalog:'rubik-sota-local',assetId:'cat-ia-aparador-lumen',catalogRevision:REV});
 const oven=P.plan(prod(c,'horno-h60','inox'),e);assert.equal(oven.representation,'validated-model');assert.equal(oven.spec.type,'ovencol');assert.deepEqual([oven.spec.w,oven.spec.d,oven.spec.h],[595,548,595]);
 const nogal=P.plan(prod(c,'aparador-lumen','nogal'),e);assert.equal(nogal.representation,'generic-volume');assert.equal(nogal.fallbackReason,'no-model');assert.match(nogal.spec.name,/volumen genérico$/);assert.equal(nogal.asset,null);
 assert.equal(P.plan(prod(c,'encimera-basalto',null),e).reason,'material-not-placeable');
 assert.equal(P.plan(prod(c,'horno-h60','inox'),[]).fallbackReason,'model-not-validated','assets not loaded → generic, never an unverified model');
});

test('negatives: unknown dimensions block placement; expired licence, unknown unit or a measure mismatch fall back to generic',()=>{
 const c=cat(),e=entries();
 const p=JSON.parse(JSON.stringify(prod(c,'lampara-orbe','ambar')));p.dimensionsStatus='partial';assert.equal(P.plan(p,e).reason,'dimensions-unknown');
 const expired=JSON.parse(JSON.stringify(MANIFEST));expired.find(x=>x.id==='cat-ia-horno-h60').f3Evidence.permission.expires='2026-01-01';
 const ex=A.adapt(expired,{catalog:'rubik-sota-local',revision:REV,today:'2026-11-14'});assert.deepEqual(ex.excluded,[{id:'cat-ia-horno-h60',reason:'permission-not-verified-for-this-use'}]);
 assert.equal(P.plan(prod(c,'horno-h60','inox'),ex.entries).fallbackReason,'model-not-validated');
 const unit=JSON.parse(JSON.stringify(MANIFEST));unit.find(x=>x.id==='cat-ia-horno-h60').dimensions.unit='in';
 assert.equal(A.adapt(unit,{catalog:'rubik-sota-local',revision:REV}).excluded[0].reason,'dimensions-not-verifiable','GLB with doubtful units is excluded');
 const big=JSON.parse(JSON.stringify(prod(c,'horno-h60','inox')));big.dimensionsMm.width=640;assert.equal(P.plan(big,e).fallbackReason,'model-dimensions-mismatch','45 mm off → generic');
 const ok=JSON.parse(JSON.stringify(prod(c,'horno-h60','inox')));ok.dimensionsMm.width=610;assert.equal(P.plan(ok,e).representation,'validated-model','within 20 mm');
});

test('project link: attach writes assetRef + extension; links ignore deleted objects; duplicate copies the link',()=>{
 const c=cat(),e=entries(),product=prod(c,'aparador-lumen','roble'),pl=P.plan(product,e),link=P.linkOf(c,product,pl,'2026-11-14T16:00:00Z');
 const project={objects:[{id:'obj_1',type:'dresser',name:'x'},{id:'obj_2',type:'sofa',name:'y'}],extensions:{other:{keep:true}}};
 P.attach(project,'obj_1',link);assert.deepEqual(project.objects[0].assetRef,pl.asset);assert.deepEqual(project.extensions.other,{keep:true});
 const l=project.extensions[P.EXT].links.obj_1;assert.equal(l.sku,'QA-LUMEN-160-RB');assert.equal(l.catalogRevision,1);assert.equal(l.productVersion,1);assert.match(l.revisionHash,/^[0-9a-f]{64}$/);
 const g=P.linkOf(c,prod(c,'aparador-lumen','nogal'),P.plan(prod(c,'aparador-lumen','nogal'),e));project.objects[1].assetRef={catalog:'x',assetId:'y'};P.attach(project,'obj_2',g);
 assert.equal(project.objects[1].assetRef,undefined,'generic volume never keeps a model reference');
 project.objects.push({id:'obj_3'});assert.deepEqual(P.duplicate(project,'obj_1','obj_3'),{changed:true});assert.equal(project.extensions[P.EXT].links.obj_3.sku,'QA-LUMEN-160-RB');
 project.objects=project.objects.filter(o=>o.id!=='obj_1');const L=P.links(project);assert.deepEqual(Object.keys(L.active).sort(),['obj_2','obj_3']);assert.deepEqual(L.orphans,['obj_1']);
 assert.throws(()=>P.attach(project,'nope',link),/not found/);assert.deepEqual(P.duplicate(project,'nope','x'),{changed:false});
});

test('C1–C4: the catalogue cost provider follows FloorPlanCostProvider and quotes only sourced prices (never images)',async()=>{
 const c=cat(),prov=P.costProvider(()=>[c]);
 assert.ok(Cost.inspectProvider(prov),'contract accepted by the C1–C4 registry');const reg=Cost.createRegistry([prov]);
 const q=await reg.getPrice(P.PROVIDER_ID,'QA-LUMEN-160-RB');assert.equal(q.status,'available');assert.equal(q.quote.unitPrice,690);assert.equal(q.quote.currency,'EUR');
 assert.equal(q.quote.source.asOf,'2026-11-14');assert.match(q.quote.source.label,/Tarifa sintética QA/);assert.equal(q.quote.priceKind,'reference');
 assert.equal((await reg.getPrice(P.PROVIDER_ID,'QA-H60-INOX')).status,'unavailable','unknown price → no quote, never 0');
 assert.equal((await reg.getPrice(P.PROVIDER_ID,'QA-NOPE')).status,'not-found');
});

test('budget lines: quantities from linked objects, totals only from sourced prices, flags missing price and catalogue changes',()=>{
 let c=cat();const e=entries(),project={objects:[],extensions:{}};
 const place=(id,pid,v)=>{project.objects.push({id});const p=prod(c,pid,v);P.attach(project,id,P.linkOf(c,p,P.plan(p,e)));};
 place('a','aparador-lumen','roble');place('b','aparador-lumen','roble');place('c','horno-h60','inox');place('d','lampara-orbe','ambar');
 let b=P.budgetLines(project,()=>[c]);
 assert.deepEqual(b.lines.map(l=>[l.sku,l.quantity,l.status,l.subtotal]),[['QA-H60-INOX',1,'no-price',null],['QA-LUMEN-160-RB',2,'sourced',1380],['QA-ORBE-40-AM',1,'sourced',95]]);
 assert.equal(b.netTotal,1475);assert.equal(b.complete,false);assert.deepEqual(b.excluded,['QA-H60-INOX']);assert.match(b.basis,/nunca desde imágenes/);
 const edit=JSON.parse(JSON.stringify(PILOT.products[0]));edit.commercial.netUnitPrice=710;c=C.importCollection(c,[edit],{today:'2026-11-14'}).catalog;
 b=P.budgetLines(project,()=>[c]);const rb=b.lines.find(l=>l.sku==='QA-LUMEN-160-RB');assert.equal(rb.subtotal,1420);assert.equal(rb.versionChanged,true,'the line says the sheet changed after placement');
 assert.equal(P.budgetLines(project,()=>[]).lines.every(l=>l.status==='catalog-missing'),true);
});
