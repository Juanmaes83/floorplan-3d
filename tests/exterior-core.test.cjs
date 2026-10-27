const {test} = require('node:test');
const assert = require('node:assert/strict');
const Exterior = require('../js/exterior-core.js');
const reference = require('../js/reference-project.js');

const wall = (id,x1,y1,x2,y2,material) => ({id,start:{x:x1,y:y1},end:{x:x2,y:y2},thicknessMm:200,status:'existing',surfaceMaterialId:material});
const room = (id,coords,family) => ({id,polygon:coords.map(([x,y])=>({x,y})),family,floorMaterialId:'mat_floor'});
const square = [wall('north',0,0,6000,0,'mat_facade'),wall('east',6000,0,6000,4000),wall('south',6000,4000,0,4000),wall('west',0,4000,0,0)];
const base = () => ({walls:square,rooms:[room('left',[[100,100],[3000,100],[3000,3900],[100,3900]]),room('right',[[3000,100],[5900,100],[5900,3900],[3000,3900]])],openings:[{id:'window',wallId:'north',kind:'window'},{id:'door',wallId:'south',kind:'door'}]});

test('asymmetric multiroom footprint: perimeter facade, shared wall interior, original openings and material',()=>{
  const p=base();p.walls=[...square,{...wall('shared',3000,100,3000,3900),structure:'exterior'}];
  p.openings.push({id:'inner-door',wallId:'shared',kind:'door'});
  const before=JSON.stringify(p),x=Exterior.derive(p);
  assert.equal(x.status,'available');
  assert.deepEqual(x.walls.filter(w=>w.status==='facade').map(w=>w.wallId),['north','east','south','west']);
  assert.equal(x.walls.at(-1).status,'interior');
  assert.deepEqual(x.openings.map(o=>o.openingId),['window','door']);
  assert.equal(x.walls[0].materialId,'mat_facade');assert.equal(x.walls[1].materialId,null);
  assert.equal(JSON.stringify(p),before);
});
test('L-shaped footprint follows rooms rather than bounding rectangle',()=>{
  const p={walls:[wall('top',0,0,6000,0),wall('right',6000,0,6000,2000),wall('step',6000,2000,3000,2000),wall('inset',3000,2000,3000,4000),wall('bottom',3000,4000,0,4000),wall('left',0,4000,0,0)],rooms:[room('l',[[100,100],[5900,100],[5900,1900],[2900,1900],[2900,3900],[100,3900]])],openings:[]};
  assert.equal(Exterior.derive(p).walls.filter(w=>w.status==='facade').length,6);
});
test('missing room evidence remains unavailable; old project needs no new fields',()=>{
  const x=Exterior.derive({walls:[wall('w',0,0,5000,0)],rooms:[],openings:[]});
  assert.equal(x.status,'partial');assert.equal(x.walls[0].status,'unavailable');
});
test('a declared partition cannot become facade through incomplete room coverage',()=>{
  const p=base();p.walls=[{...wall('partition',3000,100,3000,3900),structure:'partition'}];p.rooms=[p.rooms[0]];
  assert.equal(Exterior.derive(p).walls[0].status,'interior');
});
test('openings on a vetoed partition are never exposed as facade openings',()=>{
  const p=base();
  p.walls=[{...wall('partition',3000,100,3000,3900),structure:'partition'}];
  p.rooms=[p.rooms[0]];
  p.openings=[{id:'inner-window',wallId:'partition',kind:'window'}];
  const x=Exterior.derive(p);
  assert.equal(x.walls[0].status,'interior');
  assert.deepEqual(x.openings,[]);
});
test('declared terrace is exterior surface without an inferred balcony from openings',()=>{
  const p=base();p.rooms.push(room('terrace',[[100,4100],[3000,4100],[3000,5400],[100,5400]],'terrace'));
  const x=Exterior.derive(p);assert.deepEqual(x.exteriorRooms,[{roomId:'terrace',kind:'terrace',materialId:'mat_floor'}]);
  assert.equal(x.exteriorRooms.length,1);
});
test('two levels keep independent footprint and offset/elevation authority',()=>{
  const lower=base(),upper={walls:[wall('upper-top',0,0,3000,0)],rooms:[room('upper',[[100,100],[2900,100],[2900,1900],[100,1900]])],openings:[]};
  const levels=[{elevationMm:0,offsetMm:{x:0,y:0},project:lower},{elevationMm:3100,offsetMm:{x:500,y:-200},project:upper}];
  const before=JSON.stringify(levels),results=levels.map(l=>Exterior.derive(l.project));
  assert.equal(results[0].walls.length,4);assert.equal(results[1].walls.length,1);
  assert.equal(results[1].walls[0].status,'facade');assert.equal(JSON.stringify(levels),before);
});
test('existing 1.0 reference project derives without migration or mutation',()=>{
  const before=JSON.stringify(reference),result=Exterior.derive(reference);
  assert.equal(reference.schemaVersion,'1.0.0');
  assert.ok(result.walls.some(w=>w.status==='facade'));
  assert.ok(result.walls.some(w=>w.status==='interior'));
  assert.equal(JSON.stringify(reference),before);
});
