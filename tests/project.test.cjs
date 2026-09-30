const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const Core=require('../js/project-core.js');
const example=JSON.parse(fs.readFileSync('docs/contracts/examples/floorplan-project-v1.example.json'));
const invalid=JSON.parse(fs.readFileSync('docs/contracts/examples/floorplan-project-v1.invalid.example.json'));
function storage(){const values=new Map();return {getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};}
test('browser schema is an exact copy of the F0 authority',()=>{
  assert.deepEqual(require('../js/project-schema.js'),JSON.parse(fs.readFileSync('docs/contracts/FloorPlanProjectV1.schema.json')));
});
test('reference home validates and projects rooms, 48 original wall segments and 22 openings',()=>{
  const p=Core.initial(),g=Core.geometry(p);
  assert.doesNotThrow(()=>Core.validate(p));assert.equal(p.rooms.length,13);assert.equal(p.objects.length,46);
  assert.equal(g.walls.length,48);assert.equal(p.openings.length,22);assert.equal(g.source,p);
  assert.equal(g.windows.length,12);assert.equal(g.doors.length,6);assert.equal(g.slides.length,2);
});
test('F0 valid example round-trips every field, image reference, asset pointer and extension',()=>{
  const p=Core.clone(example);p.extensions={'x-test':{nested:{text:'<img onerror="attack()">'},list:[1,2,3]}};
  const store={project:Core.initial(),storage:storage(),key:'project'};
  Core.importInto(store,JSON.stringify(p));assert.deepEqual(JSON.parse(JSON.stringify(store.project)),p);
  assert.deepEqual(Core.prepare(JSON.stringify(store.project)).project,p);
});
test('newer minor retains unknown data; unknown major is rejected',()=>{
  const p=Core.clone(example);p.schemaVersion='1.1.0';p.futureMetadata={text:'retained'};p.objects[0].futureField=123;
  assert.deepEqual(Core.prepare(p).project,p);assert.ok(Core.prepare(p).warnings.some(x=>x.includes('Newer')));
  p.schemaVersion='2.0.0';assert.throws(()=>Core.prepare(p),/version/);
});
const invalidCases=[
  ['malformed JSON',()=>'{'],
  ['F0 invalid fixture',()=>invalid],
  ['unknown version',p=>{p.schemaVersion='2.0.0';return p;}],
  ['wrong units',p=>{p.units='m';return p;}],
  ['duplicate ID',p=>{p.objects.push(Core.clone(p.objects[0]));return p;}],
  ['broken wall reference',p=>{p.openings[0].wallId='wal_missing';return p;}],
  ['broken material reference',p=>{p.rooms[0].floorMaterialId='mat_missing';return p;}],
  ['broken room reference',p=>{p.objects[0].roomId='rom_missing';return p;}],
  ['out of range coordinate',p=>{p.objects[0].position.x=1000001;return p;}],
  ['fractional coordinate',p=>{p.objects[0].position.x=.5;return p;}],
  ['negative dimension',p=>{p.objects[0].size.widthMm=-1;return p;}],
  ['non-finite number',p=>{p.objects[0].size.widthMm=Infinity;return p;}],
  ['wrong numeric type',p=>{p.objects[0].size.widthMm='1000';return p;}],
  ['zero length wall',p=>{p.walls[0].end={...p.walls[0].start};return p;}],
  ['opening outside wall',p=>{p.openings[0].offsetMm=99999;return p;}],
  ['opening above wall',p=>{p.openings[0].sillHeightMm=10000;return p;}],
  ['self-intersecting polygon',p=>{p.rooms[0].polygon=[{x:0,y:0},{x:400,y:300},{x:0,y:400},{x:300,y:0}];return p;}],
  ['repeated closing vertex',p=>{p.rooms[0].polygon.push({...p.rooms[0].polygon[0]});return p;}],
  ['bad calibration',p=>{p.scale.calibration.mmPerPixel=100;return p;}],
  ['invalid timestamp',p=>{p.createdAt='2026-02-30T00:00:00Z';return p;}],
  ['timestamp order',p=>{p.updatedAt='2020-01-01T00:00:00Z';return p;}],
  ['event injection in ID',p=>{p.objects[0].id='obj_bad" onmouseover="attack()';return p;}],
  ['CSS injection in color',p=>{p.objects[0].color='#fff" onload="attack()';return p;}],
  ['unknown 1.0 field',p=>{p.materials[0].price=123;return p;}],
  ['future field cannot shadow numeric adapter',p=>{p.schemaVersion='1.1.0';p.objects[0].cx='0" onload="attack()';return p;}],
];
for(const [name,change]of invalidCases)test(`atomic rejection: ${name}`,()=>{
  const s=storage(),previous=Core.initial();s.setItem('project',JSON.stringify(previous));
  const store={project:previous,storage:s,key:'project'},before=s.getItem('project');
  assert.throws(()=>Core.importInto(store,change(Core.clone(example))));
  assert.equal(store.project,previous);assert.equal(s.getItem('project'),before);
});
test('storage failure does not apply an otherwise valid import',()=>{
  const old=Core.initial(),store={project:old,key:'p',storage:{setItem(){throw Error('quota');}}};
  assert.throws(()=>Core.importInto(store,example),/quota/);assert.equal(store.project,old);
});
const legacy={furniture:[{id:'fold-001',type:'bed',name:'Old bed',cx:1000.4,cy:1200.6,w:1500,d:2000,rot:90,color:'#c9d6df'}],rooms:{master:{name:'Old room',mat:'carpet'}},demolished:['w29'],measures:[{a:{x:0,y:0},b:{x:500,y:0}}]};
test('legacy migration preserves IDs, rounds mm, maps references and retains original storage',()=>{
  const s=storage(),original=JSON.stringify(legacy);s.setItem('huxing-design-v1',original);
  const first=Core.load(s),second=Core.load(s);
  assert.equal(first.migrated,true);assert.equal(first.project.objects[0].id,'obj_fold-001');
  assert.deepEqual(first.project.objects[0].position,{x:1000,y:1201});
  assert.equal(first.project.rooms.find(r=>r.id==='rom_master').floorMaterialId,'mat_carpet');
  assert.equal(first.project.walls.find(w=>w.id==='wal_ref-w29').status,'demolished');
  assert.equal(s.getItem('huxing-design-v1'),original);assert.deepEqual(second.project,first.project);
});
test('corrupt old/new saved states degrade to reference without overwriting originals',()=>{
  for(const key of ['huxing-design-v1','rubik-sota-floorplan-project-v1']){
    const s=storage();s.setItem(key,'{');const result=Core.load(s);
    assert.equal(result.project.id,Core.initial().id);assert.ok(result.message.includes('could not'));assert.equal(s.getItem(key),'{');
  }
});
test('failed migration write keeps original and usable migrated in-memory project',()=>{
  const s={getItem:k=>k==='huxing-design-v1'?JSON.stringify(legacy):null,setItem(){throw Error('quota');}};
  const result=Core.load(s);assert.equal(result.saved,false);assert.equal(result.project.objects[0].id,'obj_fold-001');assert.ok(result.message.includes('memory'));
});
test('editing adapters mutate canonical entities; history serialization has no aliases',()=>{
  const p=Core.initial(),edit=Core.editing(()=>p),old=p.objects.length;
  edit.furniture.push(Core.object('bed','new',500,600,1400,2000));assert.equal(p.objects.length,old+1);
  const f=edit.furniture.at(-1);f.cx=700.4;f.rot=450;assert.equal(f.position.x,700);assert.equal(f.rotationDeg,90);
  edit.rooms.rom_master.name='renamed';edit.rooms.rom_master.mat='mat_carpet';
  assert.equal(p.rooms[0].name,'renamed');assert.equal(p.rooms[0].floorMaterialId,'mat_carpet');
  const json=JSON.parse(JSON.stringify(p));assert.ok(!Object.hasOwn(json.objects.at(-1),'cx'));Core.validate(json);
});
test('projection follows geometry edits and stable IDs despite wall reorder',()=>{
  const p=Core.clone(example),first=Core.geometry(p);p.walls.reverse();const next=Core.geometry(p);
  assert.deepEqual(next.doors.find(d=>d.id===first.doors[0].id).rect.poly,first.doors[0].rect.poly);
  p.rooms[0].polygon[0].x=130;assert.equal(Core.geometry(p).rooms[0].poly[0][0],130);
  p.walls[0].start.x+=100;Core.validate(p);assert.notDeepEqual(Core.geometry(p).walls[0].poly,next.walls[0].poly);
});
test('diagonal wall projection retains finite geometry without changing array length',()=>{
  const p=Core.clone(example);p.walls[1].end.x=7000;const next=Core.prepare(p),rect=Core.geometry(next.project).walls.find(w=>w.id==='wal_ext-east');
  assert.equal(rect.length,5);assert.ok(Math.abs(rect.spanMm-Math.hypot(1000,4000))<1e-8);
  assert.ok(rect.poly.flat().every(Number.isFinite));
});
