// Declared wall type (contract 1.5.0): unspecified by default in older projects, set by a professional to
// load-bearing, partition or back to unspecified, with its origin kept through save and load. Never inferred.
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../js/project-core.js');

const store=()=>{const data=new Map();return {getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};};
const roundTrip=project=>{const s=store();s.setItem('rubik-sota-floorplan-project-v1',JSON.stringify(project));return C.load(s).project;};
// An older project: 1.0.0, a wall that the person never declared.
const older=()=>{const p=C.initial();p.walls[0].structure='unknown';delete p.walls[0].structureSource;return p;};

test('an older project opens unchanged: no origin is added and the version stays',()=>{
 const p=older(),loaded=roundTrip(p);
 assert.equal(loaded.schemaVersion,'1.0.0');assert.equal(loaded.walls[0].structure,'unknown');assert.equal('structureSource' in loaded.walls[0],false);
 assert.deepEqual(loaded,p);
});

test('declaring load-bearing, partition and back to unspecified, each time by a professional',()=>{
 const p=older(),id=p.walls[0].id;
 let q=C.declareWallStructure(p,id,'load-bearing');assert.equal(q.walls[0].structure,'load-bearing');assert.equal(q.walls[0].structureSource,'professional');assert.equal(q.schemaVersion,'1.5.0');
 q=C.declareWallStructure(q,id,'partition');assert.equal(q.walls[0].structure,'partition');
 q=C.declareWallStructure(q,id,'unknown');assert.equal(q.walls[0].structure,'unknown');assert.equal(q.walls[0].structureSource,'professional');
 // The original project is not modified, and other walls keep what they had.
 assert.equal(p.walls[0].structureSource,undefined);assert.deepEqual(q.walls.slice(1),p.walls.slice(1));
});

test('the type and its origin survive save and load',()=>{
 const p=older(),id=p.walls[0].id;
 for(const [structure,source]of [['load-bearing','professional'],['partition','pending-review'],['other','imported']]){
  const loaded=roundTrip(C.declareWallStructure(p,id,structure,source));
  assert.equal(loaded.walls[0].structure,structure);assert.equal(loaded.walls[0].structureSource,source);assert.equal(loaded.schemaVersion,'1.5.0');}
});

test('a newer V1 version is kept; invalid values are refused; nothing is inferred',()=>{
 const p=older();p.schemaVersion='1.7.0';const id=p.walls[0].id;
 assert.equal(C.declareWallStructure(p,id,'partition').schemaVersion,'1.7.0');
 assert.throws(()=>C.declareWallStructure(p,id,'exterior'),/Tipo de muro no admitido/);
 assert.throws(()=>C.declareWallStructure(p,id,'partition','ai'),/Procedencia no admitida/);
 assert.throws(()=>C.declareWallStructure(p,'wal_missing','partition'),/Muro no encontrado/);
 const bad=C.clone(p);bad.walls[0].structureSource='guessed';assert.throws(()=>C.validate(bad));
 // Other walls are never given a declaration by these calls.
 const q=C.declareWallStructure(p,id,'load-bearing');assert.equal(q.walls.filter(w=>w.structureSource).length,1);
});
