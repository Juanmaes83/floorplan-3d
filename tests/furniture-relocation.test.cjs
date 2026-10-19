// «Buscar sitio libre» (FloorPlanPlacement.proposeSet): proposals for existing furniture over a stair, on a building
// that is not the corrected fixture. A proposal never mutates its input; a set is compatible by construction and
// validated as a whole; when nothing valid exists within the budget it says so instead of guessing.
const {test}=require('node:test'),assert=require('node:assert/strict');
const PL=require('../js/furniture-placement.js'),B=require('../js/building-core.js'),T=require('../js/tracing-core.js'),R=require('../js/layout-review.js');
const S=require('./fixtures/stair-conflict-building.cjs');
const clone=v=>JSON.parse(JSON.stringify(v));
const zonesOf=(b,i)=>B.stairZonesOf(b,b.levels[i]);

test('a proposal keeps id, size and rotation, resolves the conflict and does not touch the input', ()=>{
 const {building}=S.build(),p=building.levels[1].project,before=JSON.stringify(p);
 const r=PL.proposeSet(p,['obj_conflict-bed'],{zones:zonesOf(building,1)});
 assert.equal(JSON.stringify(p),before,'input untouched');assert.equal(r.valid,true);assert.equal(r.failed.length,0);
 const [m]=r.moves;assert.deepEqual(m.from,{x:4600,y:1900});assert.equal(m.roomName,'Estudio');assert.ok(m.distanceMm>0&&m.tried<=PL.MAX_CANDIDATES);
 const moved=r.project.objects.find(o=>o.id==='obj_conflict-bed'),orig=p.objects.find(o=>o.id==='obj_conflict-bed');
 assert.deepEqual([moved.id,moved.size,moved.rotationDeg,moved.type],[orig.id,orig.size,orig.rotationDeg,orig.type]);
 const after=clone(building);after.levels[1].project=r.project;
 assert.equal(B.stairConflicts(after,{levelId:'lvl_conflict-upper'}).length,0,'no BW5 left on the level');
 assert.deepEqual(PL.problems(r.project,moved,{zones:zonesOf(building,1)}),[],'no wall, door, furniture or room problem');
 // Deterministic.
 assert.deepEqual(PL.proposeSet(p,['obj_conflict-bed'],{zones:zonesOf(building,1)}).moves,r.moves);
});

test('no free place within the budget: reported, nothing proposed (the narrow «Paso»)', ()=>{
 const {building}=S.build(),r=PL.proposeSet(building.levels[0].project,['obj_conflict-sofa'],{zones:zonesOf(building,0)});
 assert.deepEqual(r.moves,[]);assert.equal(r.failed[0].reason,'no-space');
 assert.match(r.failed[0].message,/No se ha encontrado sitio libre para «Sofá» en «Paso» dentro del límite de búsqueda \(\d+ posiciones\)\. Corrígelo a mano/);
});

test('two pieces whose individual proposals would collide: the set is computed together and stays valid', ()=>{
 const {building}=S.build(),b=clone(building),p=b.levels[1].project,zones=zonesOf(b,1),room=p.rooms[0].id;
 p.objects=p.objects.filter(o=>o.id!=='obj_conflict-bed');
 p.objects.push({id:'obj_chest-a',type:'cabinet',name:'Cómoda',position:{x:5100,y:1500},size:{widthMm:1000,depthMm:600},rotationDeg:0,color:'#888888',roomId:room},
  {id:'obj_chest-b',type:'cabinet',name:'Baúl',position:{x:5100,y:1550},size:{widthMm:1000,depthMm:600},rotationDeg:0,color:'#888888',roomId:room});
 B.validate(b);assert.equal(B.stairConflicts(b,{levelId:'lvl_conflict-upper'}).length,2);
 // Proposals computed in isolation (each ignoring the other) land on top of each other.
 const alone=['obj_chest-a','obj_chest-b'].map(id=>{const o=p.objects.find(x=>x.id===id),r=PL.find(p,o,{zones,ignoreIds:p.objects.filter(x=>x.id.startsWith('obj_chest')).map(x=>x.id)});return T.footprint({...o,position:r.position});});
 assert.ok(R.penetration(alone[0],alone[1])>1,'isolated proposals collide: they must not be applied together');
 const set=PL.proposeSet(p,['obj_chest-a','obj_chest-b'],{zones});
 assert.equal(set.valid,true);assert.equal(set.moves.length,2);
 const fa=T.footprint(set.project.objects.find(o=>o.id==='obj_chest-a')),fb=T.footprint(set.project.objects.find(o=>o.id==='obj_chest-b'));
 assert.ok(!(R.penetration(fa,fb)>1),'the set does not collide');
 const after=clone(b);after.levels[1].project=set.project;assert.equal(B.buildingStatus(after).conflicts.filter(c=>c.levelId==='lvl_conflict-upper').length,0);
});

test('proposals stay inside the unique room of the object; an ambiguous position is not guessed', ()=>{
 const {building}=S.build(),p=clone(building.levels[1].project);
 p.rooms.push({...clone(p.rooms[0]),id:'rom_extra',name:'Altillo',labelAt:{x:4800,y:1900},polygon:[{x:4400,y:400},{x:5840,y:400},{x:5840,y:3400},{x:4400,y:3400}]});
 const r=PL.proposeSet(p,['obj_conflict-bed'],{zones:zonesOf(building,1)});
 assert.deepEqual(r.moves,[]);assert.equal(r.failed[0].reason,'ambiguous-room');
});
