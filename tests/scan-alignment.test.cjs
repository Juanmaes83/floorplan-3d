const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../js/project-core.js');
const I=require('../js/plan-intake.js');
const A=require('../js/scan-alignment.js');
const T=require('../js/tracing-core.js');
const roomPlan=require('./fixtures/intake/roomplan-capturedroom.json');

const imported=()=>I.roomPlanToProject(roomPlan).project;
const door=p=>A.doors(p)[0].id;
const prepare=(target,scan)=>A.propose(target,scan,{targetId:door(target),movingId:door(scan)});

test('OP-04 keeps fixed geometry and moves an independent scan with its relationships and measurements',()=>{
 const target=imported(),scan=structuredClone(target),before=JSON.stringify(target);
 scan.measurements.push({id:'msr_scan',a:{x:1000,y:1000},b:{x:1300,y:1400}});
 scan.objects.push({id:'obj_scan',type:'chair',name:'Silla',position:{x:1000,y:1000},rotationDeg:90,size:{widthMm:450,depthMm:450},roomId:scan.rooms[0].id});
 const original=JSON.stringify(scan),r=prepare(target,scan),p=r.project;
 assert.equal(JSON.stringify(target),before);assert.equal(JSON.stringify(scan),original);
 assert.equal(r.canApply,true);assert.equal(r.gapMm,target.walls[0].thicknessMm);
 assert.equal(r.targetReference.x,r.reference.x);assert.ok(r.reference.y<r.targetReference.y);
 assert.equal(p.rooms.length,2);assert.deepEqual(p.walls.slice(0,target.walls.length),target.walls);
 assert.equal(p.objects[0].roomId,p.rooms[1].id);assert.equal(p.objects[0].rotationDeg,270);
 const measurement=p.measurements[0];assert.equal(Math.hypot(measurement.a.x-measurement.b.x,measurement.a.y-measurement.b.y),500);
 const record=p.extensions['x-op04-roomplan'].joins[0];
 assert.ok(record.wallIds.includes(p.openings.find(o=>o.id===record.movingDoorId).wallId));
 assert.notEqual(record.movingDoorId,record.targetDoorId);assert.equal(p.scale.confidence,'estimated');
 C.validate(p,{strict:true});
});

test('OP-04 accepts arbitrary scan axes and blocks repeated placement over existing geometry',()=>{
 const target=imported(),scan=imported();
 const rotate=p=>({x:-p.y,y:p.x});
 for(const w of scan.walls){w.start=rotate(w.start);w.end=rotate(w.end);}
 for(const r of scan.rooms){r.polygon=r.polygon.map(rotate);r.labelAt=rotate(r.labelAt);}
 const r=prepare(target,scan);
 assert.equal(r.reference.x,r.targetReference.x);assert.equal(r.reference.y,r.targetReference.y-r.gapMm);
 assert.throws(()=>prepare(r.project,imported()),/solapa/);
});

test('OP-04 allows preview of pending scale without adopting it and rejects ambiguous anchors',()=>{
 const target=imported();target.scale={confidence:'pending',method:'none'};delete target.measurements;
 const r=prepare(target,imported());assert.equal(r.canApply,false);assert.deepEqual(r.project.scale,target.scale);
 target.rooms.push({...target.rooms[0],id:'rom_duplicated'});
 assert.throws(()=>prepare(target,imported()),/una sola estancia/);
});

test('OP-04 does not extend a verified calibration to imported geometry',()=>{
 const target=imported();
 target.sourceImages=[{id:'img_synthetic',mediaType:'image/png',widthPx:480,heightPx:320,storage:{kind:'local-browser',ref:'img_bytes'}}];
 T.calibrate(target,'img_synthetic',{x:50,y:50},{x:450,y:50},4000);
 T.verify(target,{x:50,y:250},{x:450,y:250},4000);T.confirm(target);
 assert.equal(target.scale.confidence,'real');
 const r=prepare(target,imported());assert.equal(r.canApply,false);
 assert.deepEqual(r.project.scale,target.scale);assert.deepEqual(r.project.sourceImages,target.sourceImages);
});
