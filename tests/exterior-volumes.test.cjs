const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const Core=require('../js/project-core.js'),Building=require('../js/building-core.js'),Package=require('../js/project-package.js');
const Exterior=require('../js/exterior-core.js'),Roof=require('../js/roof-core.js'),Volumes=require('../js/exterior-volumes.js');
const rect=(x0,y0,x1,y1)=>[{x:x0,y:y0},{x:x1,y:y0},{x:x1,y:y1},{x:x0,y:y1}];
const L=[{x:0,y:0},{x:6000,y:0},{x:6000,y:2000},{x:3000,y:2000},{x:3000,y:4000},{x:0,y:4000}];
const U=[{x:0,y:0},{x:7000,y:0},{x:7000,y:5000},{x:5000,y:5000},{x:5000,y:2000},{x:2000,y:2000},{x:2000,y:5000},{x:0,y:5000}];
function inset(poly,d=100){return poly.map((p,i)=>{
  const a=poly[(i+poly.length-1)%poly.length],b=poly[(i+1)%poly.length],u={x:p.x-a.x,y:p.y-a.y},v={x:b.x-p.x,y:b.y-p.y};
  const n1={x:-u.y/Math.hypot(u.x,u.y),y:u.x/Math.hypot(u.x,u.y)},n2={x:-v.y/Math.hypot(v.x,v.y),y:v.x/Math.hypot(v.x,v.y)};
  const q={x:p.x+n1.x*d,y:p.y+n1.y*d},r={x:p.x+n2.x*d,y:p.y+n2.y*d},t=((r.x-q.x)*v.y-(r.y-q.y)*v.x)/(u.x*v.y-u.y*v.x);
  return {x:q.x+t*u.x,y:q.y+t*u.y};
});}
function project(poly,height=2800){return {walls:poly.map((p,i)=>({id:`wal_${i}`,start:p,end:poly[(i+1)%poly.length],thicknessMm:200,heightMm:height,structure:'exterior',status:'existing'})),rooms:[{id:'rom_test',polygon:inset(poly),floorMaterialId:'mat_floor',countsTowardArea:true}],openings:[],materials:[{id:'mat_wall',name:'Arena',category:'wall',appearance:{color:'#bbaa99'}}]};}
function building(lower,upper,{offset={x:0,y:0},elevation=3200}={}){return {levels:[
  {id:'lvl_lower',order:0,elevationMm:0,offsetMm:{x:0,y:0},project:lower},
  {id:'lvl_upper',order:1,elevationMm:elevation,offsetMm:offset,project:upper}
]};}
test('old project has no inferred parapet; one proved prism is deterministic and read-only',()=>{
  const p=project(rect(0,0,6000,4000)),before=JSON.stringify(p),a=Volumes.deriveProject(p,Roof,Exterior),b=Volumes.deriveProject(p,Roof,Exterior);
  assert.equal(a.status,'available');assert.deepEqual(a.parapets,[]);assert.equal(a.volumes.length,1);
  assert.equal(a.volumes[0].zBottomMm,0);assert.equal(a.volumes[0].zTopMm,2800);
  assert.deepEqual(a,b);assert.equal(JSON.stringify(p),before);
});
test('declared rectangular parapet follows exact outer roof boundary, height and wall material',()=>{
  const p=project(rect(0,0,6000,4000));p.roofParapet={enabled:true,heightMm:875,materialId:'mat_wall'};
  const result=Volumes.deriveProject(p,Roof,Exterior),f=result.volumes[0].footprint;
  assert.equal(result.status,'available');assert.equal(result.parapets.length,4);
  assert.deepEqual(result.parapets.map(x=>x.start),f);
  assert.ok(result.parapets.every(x=>x.heightMm===875&&x.zBottomMm===2800&&x.zTopMm===3675&&x.materialId==='mat_wall'));
});
test('L and U roofs use their actual concave perimeter; explicit off remains off',()=>{
  for(const poly of [L,U]){const p=project(poly);p.roofParapet={enabled:true,heightMm:640};
    const result=Volumes.deriveProject(p,Roof,Exterior);assert.equal(result.status,'available',result.reason);
    assert.equal(result.parapets.length,result.roof.footprint.polygon.length);assert.ok(result.parapets.every(x=>x.materialId===null));
    p.roofParapet={enabled:false};assert.deepEqual(Volumes.deriveProject(p,Roof,Exterior).parapets,[]);
  }
});
test('invalid height and unknown material abstain; missing footprint and nonorthogonal setback propagate',()=>{
  const p=project(rect(0,0,6000,4000));p.roofParapet={enabled:true,heightMm:0};
  assert.deepEqual(Volumes.deriveProject(p,Roof,Exterior),{status:'invalid',reason:'invalid-parapet-height'});
  p.roofParapet={enabled:true,heightMm:600,materialId:'mat_missing'};
  assert.deepEqual(Volumes.deriveProject(p,Roof,Exterior),{status:'invalid',reason:'invalid-parapet-material'});
  p.walls.pop();assert.equal(Volumes.deriveProject(p,Roof,Exterior).status,'unavailable');
  const tri=[{x:0,y:0},{x:5000,y:0},{x:2500,y:4000}];
  assert.equal(Volumes.deriveBuilding(building(project(tri),project(tri),{offset:{x:100,y:0}}),Roof,Exterior,Building).reason,'non-orthogonal-setback');
});
test('two equal footprints derive two volumes and only the upper roof may have a parapet',()=>{
  const low=project(rect(0,0,6000,4000)),up=project(rect(0,0,6000,4000),2600);up.roofParapet={enabled:true,heightMm:700};
  const b=building(low,up),before=JSON.stringify(b),r=Volumes.deriveBuilding(b,Roof,Exterior,Building);
  assert.equal(r.status,'available');assert.deepEqual(r.volumes.map(v=>[v.zBottomMm,v.zTopMm]),[[0,2800],[3200,5800]]);
  assert.equal(r.parapets.length,4);assert.ok(r.parapets.every(x=>x.levelId==='lvl_upper'));
  assert.equal(JSON.stringify(b),before);
});
test('setback and offset create parapets only on proved outer edges, never internal cell or upper-body seams',()=>{
  const low=project(rect(0,0,6000,4000)),up=project(rect(500,500,4500,3000),2700);
  low.roofParapet={enabled:true,heightMm:900};up.roofParapet={enabled:true,heightMm:650};
  const b=building(low,up,{offset:{x:800,y:-200}}),r=Volumes.deriveBuilding(b,Roof,Exterior,Building);
  assert.equal(r.status,'available',r.reason);assert.equal(r.volumes.length,2);assert.equal(r.volumes[1].footprint[0].x,1200);
  const lower=r.roof.levels[0].polygon,lowerPetos=r.parapets.filter(x=>x.levelId==='lvl_lower');
  assert.ok(lowerPetos.length>0);assert.ok(r.parapets.some(x=>x.levelId==='lvl_upper'));
  for(const p of lowerPetos)assert.ok(lower.some((a,i)=>{
    const c=lower[(i+1)%lower.length],u={x:c.x-a.x,y:c.y-a.y},s={x:p.start.x-a.x,y:p.start.y-a.y},e={x:p.end.x-a.x,y:p.end.y-a.y};
    return Math.abs(u.x*s.y-u.y*s.x)<1e-3&&Math.abs(u.x*e.y-u.y*e.x)<1e-3;
  }),'lower parapet must be on lower footprint boundary');
});
test('partial geometric overhang has no invented supports; separate level heights are exact',()=>{
  const low=project(rect(0,0,6000,4000),2800),up=project(rect(4000,0,8000,3000),2500);
  const r=Volumes.deriveBuilding(building(low,up,{offset:{x:500,y:0},elevation:3300}),Roof,Exterior,Building);
  assert.equal(r.status,'available');assert.ok(r.roof.relation.overhangMm2>0);
  assert.deepEqual(r.volumes.map(v=>[v.zBottomMm,v.zTopMm]),[[0,2800],[3300,5800]]);
  assert.equal(JSON.stringify(r).includes('support'),false);
});
test('vertical level overlap and unproved elevation abstain without CSG or maximum-height fallback',()=>{
  const low=project(rect(0,0,6000,4000),2800),up=project(rect(0,0,4000,3000),2500);
  assert.equal(Volumes.deriveBuilding(building(low,up,{elevation:2700}),Roof,Exterior,Building).reason,'overlapping-level-heights');
  up.walls[0].heightMm=2700;
  assert.equal(Volumes.deriveBuilding(building(low,up),Roof,Exterior,Building).reason,'heterogeneous-top-elevation');
});
test('1.8 declaration validates, JSON and ZIP round-trip; old document remains byte-identical on read',async()=>{
  const old=Core.initial(),before=JSON.stringify(old);
  assert.equal(Core.prepare(before).project.schemaVersion,'1.0.0');assert.equal(JSON.stringify(old),before);
  assert.equal(Core.prepare(before).project.roofParapet,undefined);
  const withParapet=Core.setRoofParapet(old,{enabled:true,heightMm:875});
  assert.equal(withParapet.schemaVersion,'1.8.0');assert.deepEqual(Core.prepare(JSON.stringify(withParapet)).project.roofParapet,{enabled:true,heightMm:875});
  const archive=await Package.encode(withParapet,async()=>null);
  const entries=await Package.unzip(await archive.arrayBuffer());
  assert.deepEqual((await Package.validateEntries(entries)).project.roofParapet,{enabled:true,heightMm:875});
  assert.throws(()=>Core.validate({...old,roofParapet:{enabled:true,heightMm:875}}),/requires project 1.8.0/);
  assert.throws(()=>Core.setRoofParapet(old,{enabled:true,heightMm:0}),/minimum 100/);
  assert.deepEqual(Core.setRoofParapet(withParapet,{enabled:false}).roofParapet,{enabled:false});
});
test('contract building accepts 1.8 per-level declaration and JSON/ZIP preserve it',async()=>{
  const b=JSON.parse(fs.readFileSync(path.join(__dirname,'../docs/contracts/examples/floorplan-building-v1.example.json'),'utf8'));
  b.levels[1].project=Core.setRoofParapet(b.levels[1].project,{enabled:true,heightMm:800});
  assert.doesNotThrow(()=>Building.validate(b));
  const copied=JSON.parse(JSON.stringify(b));assert.deepEqual(copied.levels[1].project.roofParapet,{enabled:true,heightMm:800});
  const source=Building.create(Core.setRoofParapet(Core.initial(),{enabled:true,heightMm:800}));
  const {entries}=await Building.packageEntries(source,async()=>null,()=>null);
  const archive=Package.zip(entries,{check:Building.packagePath});
  const unpacked=await Package.unzip(await archive.arrayBuffer(),{check:Building.packagePath,required:'building.json',maxEntries:Building.MAX_ENTRIES,jsonNames:['building.json','manifest.json']});
  const restored=await Building.readEntries(unpacked,()=>null);
  assert.deepEqual(restored.building.levels[0].project.roofParapet,{enabled:true,heightMm:800});
});
