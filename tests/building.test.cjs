const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const C=require('../js/project-core.js'),B=require('../js/building-core.js'),P=require('../js/project-package.js'),T=require('../js/tracing-core.js'),Library=require('../js/project-library.js');
const F=require('./fixtures/building-fixture.cjs');
const clone=v=>JSON.parse(JSON.stringify(v)),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const canonicalHash=v=>sha(B.canonical(v));
const memory=()=>{const map=new Map();return {map,storage:{getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)}};};

test('asymmetric fixture validates and emits exactly the expected orientative warnings',()=>{
 const {building}=F.build(),{warnings}=B.validate(building);
 assert.deepEqual(warnings.map(w=>w.code),['BW3','BW4']);
 assert.match(warnings.find(w=>w.code==='BW4').message,/no un dictamen estructural/);
 assert.notEqual(building.levels[0].project.scale.confidence,building.levels[1].project.scale.confidence);
 assert.deepEqual(building.levels.map(l=>l.project.sourceImages[0].mediaType),['image/png','image/jpeg']);
 assert.deepEqual(building.levels[1].offsetMm,{x:2600,y:0});
});

test('derived geometry: slab opening equals stair footprint, areas per level sum to the total, rise from elevations',()=>{
 const {building}=F.build(),s=building.stairs[0],up=building.levels[1];
 const voids=B.slabVoids(building,up.id),fp=B.stairFootprint(s);
 assert.equal(voids.length,1);
 assert.deepEqual(voids[0].polygon,fp.map(p=>({x:p.x-up.offsetMm.x,y:p.y-up.offsetMm.y})));
 assert.deepEqual(fp,[{x:4900,y:1650},{x:4900,y:2550},{x:7300,y:2550},{x:7300,y:1650}]);
 assert.equal(B.slabVoids(building,building.levels[0].id).length,0);
 const a=B.areas(building);assert.equal(a.levels.length,2);assert.ok(Math.abs(a.totalM2-a.levels[0].m2-a.levels[1].m2)<1e-9);
 assert.equal(a.levels[0].m2,(4000*2400+3000*2400)/1e6);assert.equal(a.levels[1].m2,4400*2400/1e6);
 const info=B.stairInfo(building,s);assert.equal(info.riseMm,3100);assert.equal(info.riserMm,3100/14);
 const al=B.alignment(building,up.id);assert.equal(al.checked,4);assert.equal(al.supported,2);
});

test('a 1.x reader and every consumer sharing the validator reject a building explicitly',async()=>{
 const {building}=F.build();
 assert.throws(()=>C.validate(building),/multi-level building, not a FloorPlanProjectV1 project/);
 assert.throws(()=>C.prepare(JSON.stringify(building)),/multi-level building/);
 const {exportProject}=require('../scripts/interop/export.cjs');assert.throws(()=>exportProject(building),/multi-level building/);
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'bld-')),file=path.join(dir,'building.json');fs.writeFileSync(file,JSON.stringify(building));
 const {createProjectReader}=require('../tools/rubik-mcp/src/core.cjs');await assert.rejects(createProjectReader(file).load(),/multi-level building/);
 fs.rmSync(dir,{recursive:true});
 // The existing 1.x project ZIP reader also refuses a building package (no project.json).
 const {entries}=await B.packageEntries(building,im=>F.build().bytesFor(im.id),T.imageInfo);
 const blob=P.zip(entries,{check:B.packagePath});await assert.rejects(P.unzip(await blob.arrayBuffer()),/Ruta ZIP no permitida/);
});

test('strict level profile rejects hidden multi-level meaning a 1.x reader would ignore',()=>{
 const cases={
  'levels[] inside a level project':[b=>{b.levels[1].project.levels=[{id:'lvl_x'}];},/\/levels\/1\/project: \/levels: unknown field/],
  'levelId on a wall':[b=>{b.levels[1].project.walls[0].levelId='lvl_fixture-ground';},/walls\/0\/levelId: unknown field/],
  'x-levels extension':[b=>{b.levels[1].project.extensions={'x-levels':{floors:2}};},/x-levels: multi-level data is not allowed/],
  'nested stair key in an extension':[b=>{b.levels[0].project.extensions={'x-meta':{stairs:[]}};},/x-meta\/stairs: multi-level data is not allowed/],
  'unknown future 1.x version':[b=>{b.levels[0].project.schemaVersion='1.13.0';},/unsupported level project version 1.13.0/],
  'nested building':[b=>{b.levels[1].project={...F.build().building};},/a building cannot be nested/],
 };
 for(const [name,[mutate,message]] of Object.entries(cases)){const b=F.build().building;mutate(b);assert.throws(()=>B.validate(b),message,name);}
 // The same project with only defined fields is valid.
 assert.doesNotThrow(()=>B.validate(F.build().building));
});

test('invalid building documents are rejected with a path and never mutated',()=>{
 const cases={
  'unknown building version':[b=>{b.schemaVersion='1.6.0';},/unsupported building version/],
  'major 2':[b=>{b.schemaVersion='2.0.0';},/unsupported building version/],
  'bad building ID':[b=>{b.id='building-1';},/\/id: invalid building ID/],
  'unknown top-level field':[b=>{b.roof={};},/\/roof: unknown field/],
  'missing stairs':[b=>{delete b.stairs;},/missing stairs/],
  'duplicate level/stair ID':[b=>{b.stairs[0].id='str_fixture-main';b.levels[1].id='lvl_fixture-ground';},/duplicate ID/],
  'duplicate project ID across levels':[b=>{b.levels[1].project.id=b.levels[0].project.id;},/duplicate project ID/],
  'duplicate image ID across levels':[b=>{b.levels[1].project.sourceImages[0].id=b.levels[0].project.sourceImages[0].id;b.levels[1].project.sourceImages[0].storage.ref='images/img_synthetic.jpg';},/duplicate image ID/],
  'broken stair reference':[b=>{b.stairs[0].toLevelId='lvl_missing';},/missing level reference lvl_missing/],
  'stair on the same level':[b=>{b.stairs[0].toLevelId=b.stairs[0].fromLevelId;},/directly above/],
  'stair going down':[b=>{[b.stairs[0].fromLevelId,b.stairs[0].toLevelId]=[b.stairs[0].toLevelId,b.stairs[0].fromLevelId];},/directly above/],
  'non-contiguous order':[b=>{b.levels[1].order=2;},/contiguous order/],
  'upper level not higher':[b=>{b.levels[1].elevationMm=0;},/higher than the level below/],
  'slab reaching the floor below':[b=>{b.levels[1].slabThicknessMm=1000;b.levels[1].elevationMm=900;},/slab reaches/],
  'level 0 offset':[b=>{b.levels[0].offsetMm={x:10,y:0};},/building frame/],
  'non-integer offset':[b=>{b.levels[1].offsetMm.x=2600.5;},/integer mm/],
  'third level':[b=>{b.levels.push({...clone(b.levels[1]),id:'lvl_third',order:2,elevationMm:6200});},/between 1 and 2 levels/],
  'stair width out of range':[b=>{b.stairs[0].widthMm=100;},/widthMm/],
  'curved stair kind':[b=>{b.stairs[0].kind='spiral';},/only straight/],
  'risers out of range':[b=>{b.stairs[0].risers=1;},/risers/],
  'invalid embedded geometry':[b=>{b.levels[1].project.rooms[0].polygon=[{x:0,y:0},{x:1,y:1}];},/levels\/1\/project/],
  'updatedAt before createdAt':[b=>{b.updatedAt='2020-01-01T00:00:00.000Z';},/earlier than createdAt/],
 };
 for(const [name,[mutate,message]] of Object.entries(cases)){
  const b=F.build().building;mutate(b);const before=JSON.stringify(b);
  assert.throws(()=>B.validate(b),message,name);assert.equal(JSON.stringify(b),before,`${name}: validation must not mutate`);
  assert.throws(()=>B.prepare(before),message,name);
 }
 assert.throws(()=>B.prepare('{"schema":"rubik-sota.floorplan-building"'),/no es JSON válido/);
 assert.throws(()=>B.prepare(JSON.stringify(C.initial())),/No es un documento de edificio/);
});

test('JSON round trip keeps IDs, references and canonical content',()=>{
 const {building}=F.build(),text=JSON.stringify(building,null,2),back=B.prepare(text);
 assert.equal(B.canonical(back),B.canonical(building));
 assert.deepEqual(back.levels.map(l=>l.id),building.levels.map(l=>l.id));assert.equal(back.stairs[0].fromLevelId,building.levels[0].id);
 assert.deepEqual(back.levels.map(l=>l.project.sourceImages.map(i=>i.sha256)),building.levels.map(l=>l.project.sourceImages.map(i=>i.sha256)));
});

test('ZIP round trip resolves images per level exactly, with matching SHA-256 and IDs',async()=>{
 const fx=F.build(),{entries,building}=await B.packageEntries(fx.building,im=>fx.bytesFor(im.id),T.imageInfo);
 assert.deepEqual([...entries.keys()].sort(),['building.json','levels/lvl_fixture-ground/images/img_synthetic.png','levels/lvl_fixture-upper/images/img_fixture-upper.jpg','manifest.json']);
 const blob=P.zip(entries,{check:B.packagePath}),read=await P.unzip(await blob.arrayBuffer(),{check:B.packagePath,required:'building.json',maxEntries:B.MAX_ENTRIES,jsonNames:['building.json','manifest.json']});
 const result=await B.readEntries(read,T.imageInfo);
 assert.equal(B.canonical(result.building),B.canonical(building));
 for(const {levelId,image,bytes} of result.images){assert.equal(sha(bytes),image.sha256);assert.equal(sha(bytes),sha(fx.bytesFor(image.id)));assert.ok(fx.building.levels.find(l=>l.id===levelId).project.sourceImages.some(i=>i.id===image.id));}
 // Everything except image storage references is identical to the source building.
 const strip=b=>{const x=clone(b);for(const l of x.levels)for(const i of l.project.sourceImages||[]){delete i.storage;delete i.originalFileName;}return x;};
 assert.equal(B.canonical(strip(result.building)),B.canonical(strip(fx.building)));
});

test('tampered, incomplete or foreign building ZIPs are rejected before anything is applied',async()=>{
 const fx=F.build(),base=(await B.packageEntries(fx.building,im=>fx.bytesFor(im.id),T.imageInfo)).entries;
 const variants={
  'changed image byte':[m=>{const k='levels/lvl_fixture-upper/images/img_fixture-upper.jpg',b=new Uint8Array(m.get(k));b[b.length-3]^=1;m.set(k,b);},/huella SHA-256/],
  'missing image':[m=>{m.delete('levels/lvl_fixture-ground/images/img_synthetic.png');},/Falta la imagen/],
  'extra entry':[m=>{m.set('levels/lvl_fixture-ground/images/img_extra-1.png',m.get('levels/lvl_fixture-ground/images/img_synthetic.png'));},/entradas ajenas/],
  'image moved to the other level':[m=>{const k='levels/lvl_fixture-upper/images/img_fixture-upper.jpg';m.set('levels/lvl_fixture-ground/images/img_fixture-upper.jpg',m.get(k));m.delete(k);},/Falta la imagen levels\/lvl_fixture-upper/],
  'manifest of another building':[m=>{const x=JSON.parse(new TextDecoder().decode(m.get('manifest.json')));x.buildingId='bld_other-house';m.set('manifest.json',new TextEncoder().encode(JSON.stringify(x)));},/otro edificio/],
  'manifest hash mismatch':[m=>{const x=JSON.parse(new TextDecoder().decode(m.get('manifest.json')));x.images[0].sha256='0'.repeat(64);m.set('manifest.json',new TextEncoder().encode(JSON.stringify(x)));},/manifiesto no coincide/],
  'invalid building.json':[m=>{const x=JSON.parse(new TextDecoder().decode(m.get('building.json')));x.stairs[0].toLevelId='lvl_gone';m.set('building.json',new TextEncoder().encode(JSON.stringify(x)));},/missing level reference lvl_gone/],
  'no manifest':[m=>{m.delete('manifest.json');},/sin building.json o manifest.json/],
 };
 for(const [name,[mutate,message]] of Object.entries(variants)){const m=new Map([...base].map(([k,v])=>[k,new Uint8Array(v)]));mutate(m);await assert.rejects(B.readEntries(m,T.imageInfo),message,name);}
 assert.throws(()=>B.packagePath('levels/lvl_fixture-ground/../project.json'),/Ruta ZIP no permitida/);
 assert.throws(()=>B.packagePath('project.json'),/Ruta ZIP no permitida/);
 // Corrupted archive bytes fail in the ZIP reader itself.
 const bytes=new Uint8Array(await P.zip(base,{check:B.packagePath}).arrayBuffer());bytes[60]^=0xff;
 await assert.rejects(P.unzip(bytes.buffer,{check:B.packagePath,required:'building.json',maxEntries:B.MAX_ENTRIES,jsonNames:['building.json','manifest.json']}));
});

test('editing one level never changes the canonical hash of the other',()=>{
 let b=F.build().building;const ground=canonicalHash(b.levels[0].project),upper=canonicalHash(b.levels[1].project);
 const p=clone(b.levels[1].project);p.objects[0].position.x+=300;p.rooms[0].name='Dormitorio principal';b=B.setProject(b,b.levels[1].id,p);
 assert.equal(canonicalHash(b.levels[0].project),ground);assert.notEqual(canonicalHash(b.levels[1].project),upper);
 const q=clone(b.levels[0].project);q.objects.pop();const after=canonicalHash(b.levels[1].project);b=B.setProject(b,b.levels[0].id,q);
 assert.equal(canonicalHash(b.levels[1].project),after);
 // Building-level edits (offset, stair) leave both embedded projects untouched.
 const g=canonicalHash(b.levels[0].project),u=canonicalHash(b.levels[1].project);
 b=B.updateLevel(b,b.levels[1].id,{offsetMm:{x:2700,y:0}});b=B.setStair(b,{...b.stairs[0],startMm:{x:5000,y:2100}});
 assert.equal(canonicalHash(b.levels[0].project),g);assert.equal(canonicalHash(b.levels[1].project),u);
});

test('reversible migration: wrapping, single-level export and level export keep the 1.x project lossless',()=>{
 const project=JSON.parse(fs.readFileSync(path.join(__dirname,'..','docs/contracts/examples/floorplan-project-v1.surfaces.example.json'),'utf8'));
 const before=B.canonical(project),b=B.create(project);
 assert.equal(B.canonical(project),before,'the source project is not modified');
 assert.equal(B.canonical(b.levels[0].project),before);
 const out=B.exportLevel(b,b.levels[0].id);assert.equal(B.canonical(out.project),before);assert.doesNotThrow(()=>C.validate(out.project,{strict:true}));
 const fx=F.build().building,up=B.exportLevel(fx,fx.levels[1].id);
 assert.doesNotThrow(()=>C.validate(up.project));assert.match(up.warning,/Se exporta sólo «Planta primera»/);assert.match(up.warning,/escalera/);assert.match(up.warning,/elevación \(3100 mm\)/);
 assert.equal(B.canonical(up.project),B.canonical(fx.levels[1].project));
 // The exported level is a normal project for the Blender exporter.
 const {exportProject}=require('../scripts/interop/export.cjs');assert.ok(exportProject(up.project).semantic.entities.length>0);
 // Removing the upper level drops its stair; the ground project stays identical.
 const r=B.removeLevel(fx,fx.levels[1].id);assert.equal(r.levels.length,1);assert.equal(r.stairs.length,0);assert.equal(B.canonical(r.levels[0].project),B.canonical(fx.levels[0].project));
 assert.throws(()=>B.removeLevel(fx,fx.levels[0].id),/marco del edificio/);
 assert.throws(()=>B.addLevel(fx,C.initial()),/2 plantas como máximo/);
});

test('library stores, saves, duplicates, varies, reopens and removes a building as one unit',()=>{
 const {storage,map}=memory(),library=Library.load(storage,C.initial()),single=library.activeId(),singleProject=library.project();
 const {building}=F.build(),openUpper=library.addBuilding(building,{activeLevelId:building.levels[1].id});
 const id=library.activeId();assert.ok(library.isBuilding());assert.equal(openUpper.id,building.levels[1].project.id);
 assert.deepEqual(library.list().find(e=>e.id===id),{id,name:building.name,kind:'building',levels:2});
 // Saving from the editor writes only the active level.
 const edited=library.project();edited.objects[0].position.x+=100;const groundHash=canonicalHash(library.building().levels[0].project);library.save(edited);
 assert.equal(canonicalHash(library.building().levels[0].project),groundHash);assert.equal(library.building().levels[1].project.objects[0].position.x,edited.objects[0].position.x);
 // Switching level returns that level's project.
 assert.equal(library.setActiveLevel(building.levels[0].id).id,building.levels[0].project.id);
 // Reload restores the building, its active level and both levels.
 const reload=Library.load(storage,C.initial());assert.ok(reload.isBuilding());assert.equal(reload.activeLevelId(),building.levels[0].id);
 assert.equal(B.canonical(reload.building()),B.canonical(library.building()));
 // The 1.x entry it came from is untouched.
 reload.open(single);assert.equal(B.canonical(reload.project()),B.canonical(singleProject));assert.equal(reload.isBuilding(),false);reload.open(id);
 // Duplicate: new building, level and project IDs; same content.
 reload.duplicate(id,'Copia');const copy=reload.building();assert.notEqual(copy.id,building.id);assert.notDeepEqual(copy.levels.map(l=>l.id),building.levels.map(l=>l.id));
 assert.equal(copy.levels.length,2);assert.equal(copy.stairs[0].fromLevelId,copy.levels[0].id);assert.equal(B.canonical(copy.levels[1].project.rooms),B.canonical(reload.list().length&&library.building().levels[1].project.rooms));
 // Variant of the open building: whole building copied, linked, comparable level by level.
 reload.open(id);const visible=reload.project();reload.variant(visible);assert.ok(reload.isBuilding());const variantId=reload.activeId();
 const group=reload.group(variantId);assert.equal(group.length,2);assert.ok(group.every(g=>g.levelName==='Planta baja'));
 // Image cleanup sees every level of every building.
 const refs=reload.projects().flatMap(p=>(p.sourceImages||[]).map(i=>i.id));assert.ok(refs.includes('img_fixture-upper'));assert.ok(refs.includes('img_synthetic'));
 // Removing the building leaves other entries intact.
 reload.remove(id);assert.ok(!reload.list().some(e=>e.id===id));assert.ok(reload.list().some(e=>e.id===single));
 // A corrupted building entry is refused on load without overwriting storage.
 const data=JSON.parse(map.get(Library.KEY)),bad=data.entries.find(e=>e.kind==='building');bad.building.stairs=[{id:'str_bad-1'}];map.set(Library.KEY,JSON.stringify(data));const raw=map.get(Library.KEY);
 assert.throws(()=>Library.load(storage,C.initial()));assert.equal(map.get(Library.KEY),raw);
});

// Footprint of a 1.x object: centre `position`, `size` width (x) × depth (y) before the clockwise rotation.
const objectFootprint=o=>{const a=o.rotationDeg*Math.PI/180,c=Math.cos(a),s=Math.sin(a),w=o.size.widthMm/2,d=o.size.depthMm/2;
 return [[-w,-d],[w,-d],[w,d],[-w,d]].map(([x,y])=>({x:o.position.x+x*c-y*s,y:o.position.y+x*s+y*c}));};
const zonesOf=(b,l)=>b.stairs.filter(s=>s.fromLevelId===l.id||s.toLevelId===l.id).map(s=>B.toLocal(B.stairFootprint(s),l));

test('fixture furniture never sits on a stair footprint or slab void of its level',()=>{
 const {building}=F.build();
 for(const l of building.levels)for(const o of l.project.objects)for(const z of zonesOf(building,l))
  assert.equal(B.convexOverlap(objectFootprint(o),z),false,`${o.name} of «${l.name}» overlaps the stair zone`);
 // The detector itself: the previous bed (centre 2400,1500 · 1600×2000 · 90°) covered 1100×650 mm of the void, and
 // the previous sofa (centre 6000,1300 · 2000×900) a 2000×100 mm strip of the stair on the ground level.
 const upper=building.levels[1],[zone]=zonesOf(building,upper);
 assert.deepEqual(zone,[{x:2300,y:1650},{x:2300,y:2550},{x:4700,y:2550},{x:4700,y:1650}]);
 assert.equal(B.convexOverlap(objectFootprint({position:{x:2400,y:1500},size:{widthMm:1600,depthMm:2000},rotationDeg:90}),zone),true);
 assert.equal(B.convexOverlap(objectFootprint({position:{x:6000,y:1300},size:{widthMm:2000,depthMm:900},rotationDeg:0}),zonesOf(building,building.levels[0])[0]),true);
});

test('room labels keep clear of stair zones without changing labelAt; a real conflict is reported, not hidden',()=>{
 const {building}=F.build(),upper=building.levels[1],room=upper.project.rooms[0],[zone]=zonesOf(building,upper),before=B.canonical(building);
 const box={left:700,right:700,above:230,below:500},rect=(p,m=0)=>[{x:p.x-box.left-m,y:p.y-box.above-m},{x:p.x+box.right+m,y:p.y-box.above-m},{x:p.x+box.right+m,y:p.y+box.below+m},{x:p.x-box.left-m,y:p.y+box.below+m}];
 assert.deepEqual(room.labelAt,{x:2600,y:1600});
 assert.equal(B.convexOverlap(rect(room.labelAt),zone),true,'the stored anchor overlaps the void: this is the reported defect');
 const at=B.labelAnchor(room.polygon,room.labelAt,box,[zone]);
 assert.equal(at.moved,true);assert.equal(at.blocked,false);assert.equal(B.convexOverlap(rect(at,100),zone),false);
 assert.ok(rect(at).every(p=>p.x>=400&&p.x<=4800&&p.y>=400&&p.y<=2800),'label stays inside the bedroom');
 assert.equal(B.canonical(building),before,'display only: the document is unchanged');
 const bed=objectFootprint(upper.project.objects[0]),preferred=B.labelAnchor(room.polygon,room.labelAt,box,[zone],{prefer:[[bed]]});
 assert.equal(B.convexOverlap(rect(preferred,100),bed),false,'a moved label prefers a place clear of the furniture');assert.equal(B.convexOverlap(rect(preferred,100),zone),false);
 assert.equal(B.convexOverlap(rect(B.labelAnchor(room.polygon,room.labelAt,box,[zone],{prefer:[[room.polygon]]}),100),zone),false,'furniture everywhere: still clear of the stair');
 assert.deepEqual(B.labelAnchor(room.polygon,{x:1300,y:900},box,[zone]),{x:1300,y:900,moved:false,blocked:false},'a clear anchor is kept');
 const full=[{x:0,y:0},{x:6000,y:0},{x:6000,y:4000},{x:0,y:4000}];
 assert.deepEqual(B.labelAnchor(room.polygon,room.labelAt,box,[full]),{x:2600,y:1600,moved:false,blocked:true},'no clear place: stored anchor, flagged');
});

test('stair label sits inside the stair footprint on both levels, upright and fitted',()=>{
 const {building}=F.build(),[s]=building.stairs;
 for(const [l,text] of [[building.levels[0],'Sube'],[building.levels[1],'Hueco de escalera']]){
  const at=B.stairLabel(s,l,text),[zone]=zonesOf(building,l),w=[...text].length*at.fontMm*0.6/2,h=at.fontMm/2;
  assert.equal(at.angleDeg,0);assert.ok(at.fontMm<=170&&at.fontMm>=100);
  assert.ok([{x:at.x-w,y:at.y-h},{x:at.x+w,y:at.y+h}].every(p=>p.x>=zone[0].x&&p.x<=zone[2].x&&p.y>=zone[0].y&&p.y<=zone[2].y),`${text} inside the footprint`);
 }
 assert.equal(B.stairLabel({...s,rotationDeg:180},building.levels[0],'Sube').angleDeg,0,'kept upright when climbing west');
 assert.equal(B.stairLabel({...s,rotationDeg:90},building.levels[0],'Sube').angleDeg,90);
});
