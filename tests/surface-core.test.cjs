// Surfaces room → level → home (roadmap point 3): one derivation over persisted data. Rooms in one level, N levels and
// the home total; measured / estimated / unavailable and their aggregate; an excluded room keeps its area but does not
// add up; older projects are read without being changed; the example keeps its net area.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const C=require('../js/project-core.js'),S=require('../js/surface-core.js'),V=require('../js/project-variants.js');
const F=require('./fixtures/building-fixture.cjs');

// A level with rectangular rooms [width, depth] mm; null = an unusable polygon; 'x' suffix = excluded from the total.
function project(rooms,confidence='real'){
 const p=C.initial();p.rooms=rooms.map((r,i)=>{const [w,d,flag]=r||[];return {id:`rom_t${i}`,name:`Estancia ${i}`,floorMaterialId:p.rooms[0]?.floorMaterialId??null,countsTowardArea:flag!=='x',
  polygon:r?[{x:0,y:0},{x:w,y:0},{x:w,y:d},{x:0,y:d}]:[{x:0,y:0},{x:1000,y:0},{x:2000,y:0}]};});
 p.scale={...p.scale,confidence};return p;
}
const close=(a,b)=>assert.ok(a===b||Math.abs(a-b)<1e-9,`${a} ≈ ${b}`);

test('browser export keeps the existing material surface catalog global intact',()=>{
 const catalog={get(){return 'sentinel';},notify(){}},context={FloorPlanSurfaces:catalog};vm.createContext(context);
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/surface-core.js'),'utf8'),context);
 assert.equal(context.FloorPlanSurfaces,catalog);assert.equal(context.FloorPlanSurfaces.get(),'sentinel');
 assert.equal(typeof context.FloorPlanSurfaceMetrics.level,'function');assert.equal(typeof context.FloorPlanSurfaceMetrics.home,'function');
});

test('rooms of one level add up; the status follows the level scale',()=>{
 for(const [confidence,status]of [['real','measured'],['estimated','estimated'],['pending','estimated']]){
  const l=S.level(project([[3000,4000],[2000,2500]],confidence));
  assert.deepEqual(l.rooms.map(r=>[r.areaM2,r.status]),[[12,status],[5,status]]);
  close(l.areaM2,17);assert.equal(l.status,status);assert.equal(l.complete,true);assert.deepEqual(l.excluded,[]);}
});

test('an excluded room keeps its area and does not add up',()=>{
 const l=S.level(project([[3000,4000],[1000,2000,'x']]));
 assert.equal(l.rooms[1].areaM2,2);assert.equal(l.rooms[1].counted,false);close(l.areaM2,12);assert.deepEqual(l.excluded,['rom_t1']);
});

test('an unavailable room is not 0 m²: the subtotal is the computable part and says it is incomplete',()=>{
 const l=S.level(project([[3000,4000],null]));
 assert.equal(l.rooms[1].areaM2,null);assert.equal(l.rooms[1].status,'unavailable');
 close(l.areaM2,12);assert.equal(l.status,'measured');assert.equal(l.complete,false);assert.deepEqual(l.missing,['rom_t1']);
 const none=S.level(project([null]));assert.equal(none.areaM2,null);assert.equal(none.status,'unavailable');
 // An excluded unusable room neither adds nor makes the level incomplete.
 const exUnavailable=project([[3000,4000]]);exUnavailable.rooms.push({...exUnavailable.rooms[0],id:'rom_tx',countsTowardArea:false,polygon:[{x:0,y:0},{x:1,y:0}]});
 assert.equal(S.level(exUnavailable).complete,true);
});

test('N levels and the home total; mixed statuses aggregate as estimated',()=>{
 const levels=[['Planta baja',project([[3000,4000],[2000,2500]],'real')],['Planta primera',project([[4000,4000]],'estimated')],['Ático',project([[2000,2000,'x'],null],'real')]];
 const building={levels:levels.map(([name,p],order)=>({id:`lvl_${order}`,name,order,project:p}))};
 const h=S.home(building);
 assert.deepEqual(h.levels.map(l=>[l.name,l.areaM2,l.status,l.complete]),[['Planta baja',17,'measured',true],['Planta primera',16,'estimated',true],['Ático',null,'unavailable',false]]);
 close(h.areaM2,33);assert.equal(h.status,'estimated');assert.equal(h.complete,false);assert.deepEqual(h.excluded,['rom_t0']);
 // All measured → measured.
 const all=S.home({levels:[{id:'a',name:'A',order:0,project:project([[3000,4000]])},{id:'b',name:'B',order:1,project:project([[1000,1000]])}]});
 close(all.areaM2,13);assert.equal(all.status,'measured');assert.equal(all.complete,true);
 // The building fixture: two levels, real + estimated.
 const fx=S.home(F.build().building);assert.equal(fx.levels.length,2);assert.equal(fx.status,'estimated');
 close(fx.areaM2,fx.levels.reduce((s,l)=>s+l.areaM2,0));
});

test('a single project is one level; reading never changes it; the example keeps its net area',()=>{
 const example=C.initial(),before=JSON.stringify(example);
 const h=S.home(example);assert.equal(h.levels.length,1);assert.equal(JSON.stringify(example),before);
 // Same figure as the area every view already shows (counted rooms, polygon area).
 const legacy=C.geometry(example).rooms.filter(r=>r.counted!==false).reduce((a,r)=>a+Math.abs(r.poly.reduce((s,p,i)=>{const q=r.poly[(i+1)%r.poly.length];return s+p[0]*q[1]-q[0]*p[1];},0))/2/1e6,0);
 close(h.areaM2,legacy);close(V.netAreaM2(example),legacy);assert.equal(Number(h.areaM2.toFixed(2)),87.18);
 assert.equal(h.status,example.scale.confidence==='real'?'measured':'estimated');
 // An older 1.0 project is accepted as is: no version bump, no new field.
 const older=project([[3000,4000]]);older.schemaVersion='1.0.0';const snapshot=JSON.stringify(older);S.home(older);assert.equal(JSON.stringify(older),snapshot);
});
