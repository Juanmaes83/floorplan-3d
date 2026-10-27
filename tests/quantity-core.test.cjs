const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const S=require('../js/surface-core.js'),Q=require('../js/quantity-core.js');
const close=(a,b,e=1e-9)=>assert.ok(a===b||Math.abs(a-b)<e,`${a} ≈ ${b}`);
function wall(id,start,end,{heightMm=2800,thicknessMm=200,status='existing',surfaceMaterialId}={}){return {id,start,end,thicknessMm,heightMm,structure:'partition',status,...(surfaceMaterialId?{surfaceMaterialId}:{})};}
function room(id,polygon,{counted=true,material='mat_floor'}={}){return {id,name:id,polygon,floorMaterialId:material,countsTowardArea:counted};}
function project(confidence='real'){
 const p={schema:'rubik-sota.floorplan-project',schemaVersion:'1.7.0',scale:{confidence},rooms:[],walls:[],openings:[]};
 p.walls=[
  wall('wal_top',{x:0,y:0},{x:4000,y:0},{surfaceMaterialId:'mat_wall'}),
  wall('wal_right',{x:4000,y:0},{x:4000,y:3000},{surfaceMaterialId:'mat_wall'}),
  wall('wal_bottom',{x:4000,y:3000},{x:0,y:3000},{surfaceMaterialId:'mat_wall'}),
  wall('wal_left',{x:0,y:3000},{x:0,y:0},{surfaceMaterialId:'mat_wall'})
 ];
 p.rooms=[room('rom_main',[{x:100,y:100},{x:3900,y:100},{x:3900,y:2900},{x:100,y:2900}])];
 p.openings=[
  {id:'opn_window',wallId:'wal_top',kind:'window',offsetMm:1400,widthMm:1200,heightMm:1200,sillHeightMm:900},
  {id:'opn_door',wallId:'wal_bottom',kind:'door',offsetMm:1000,widthMm:900,heightMm:2100,sillHeightMm:0}
 ];return p;
}

test('browser export uses its own global and requires the surface metrics global',()=>{
 const context={FloorPlanSurfaceMetrics:S};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/quantity-core.js'),'utf8'),context);
 assert.equal(typeof context.FloorPlanQuantities.room,'function');assert.equal(context.FloorPlanQuantities.STATUS.join(','),'measured,estimated,unavailable');
});

test('floor area is exactly the existing SurfaceMetrics result',()=>{
 const p=project(),q=Q.level(p),s=S.level(p);close(q.quantities.floor.areaM2,s.areaM2);close(q.rooms[0].floor.areaM2,s.rooms[0].areaM2);assert.equal(q.rooms[0].floor.source,'FloorPlanSurfaceMetrics');
});

test('measured, estimated and pending follow the existing scale semantics',()=>{
 for(const [confidence,status]of [['real','measured'],['estimated','estimated'],['pending','estimated']]){const q=Q.level(project(confidence));assert.equal(q.rooms[0].floor.status,status);assert.equal(q.rooms[0].perimeter.status,status);assert.equal(q.walls[0].status,status);}
});

test('room interior perimeter is derived from polygon and does not deduct openings',()=>{
 const r=Q.room(project(),'rom_main');close(r.perimeter.lengthM,13.2);assert.equal(r.perimeter.openingDeduction,'none');assert.equal(r.perimeter.complete,true);
});

test('wall physical quantities preserve one face and both faces explicitly',()=>{
 const w=Q.wall(project(),'wal_top');close(w.quantities.lengthM,4);close(w.quantities.heightM,2.8);close(w.quantities.faceGrossAreaM2,11.2);close(w.quantities.faceOpeningAreaM2,1.44);close(w.quantities.faceNetAreaM2,9.76);close(w.quantities.wallSurfaceGrossAreaM2,22.4);close(w.quantities.wallSurfaceOpeningAreaM2,2.88);close(w.quantities.wallSurfaceNetAreaM2,19.52);assert.equal(w.complete,true);
});

test('known zero opening area is zero, never confused with unknown',()=>{
 const p=project();p.openings=[];const w=Q.wall(p,'wal_top');assert.equal(w.quantities.faceOpeningAreaM2,0);close(w.quantities.faceNetAreaM2,w.quantities.faceGrossAreaM2);
});

test('invalid wall height makes wall area unavailable instead of zero',()=>{
 const p=project();delete p.walls[0].heightMm;const w=Q.wall(p,'wal_top');assert.equal(w.status,'unavailable');assert.equal(w.quantities.faceGrossAreaM2,null);assert.equal(w.reason,'invalid-wall-geometry');
});

test('incomplete opening geometry keeps gross area but makes opening/net unavailable',()=>{
 const p=project();delete p.openings[0].heightMm;const w=Q.wall(p,'wal_top');close(w.quantities.faceGrossAreaM2,11.2);assert.equal(w.quantities.faceOpeningAreaM2,null);assert.equal(w.quantities.faceNetAreaM2,null);assert.equal(w.complete,false);assert.deepEqual(w.openings.invalid,['opn_window']);
});

test('overlapping persisted openings use union area rather than double subtraction',()=>{
 const p=project();p.openings=[{id:'a',wallId:'wal_top',kind:'window',offsetMm:1000,widthMm:1000,heightMm:1000,sillHeightMm:500},{id:'b',wallId:'wal_top',kind:'window',offsetMm:1500,widthMm:1000,heightMm:1000,sillHeightMm:500}];
 const w=Q.wall(p,'wal_top');close(w.quantities.faceOpeningAreaM2,1.5);close(w.quantities.faceNetAreaM2,9.7);
});

test('room wall faces are calculated only for geometrically demonstrated wall-face overlaps',()=>{
 const r=Q.room(project(),'rom_main');assert.equal(r.wallFaces.status,'measured');assert.equal(r.wallFaces.associationComplete,true);assert.equal(r.wallFaces.openingsComplete,true);close(r.wallFaces.matchedBoundaryM,13.2);close(r.wallFaces.missingBoundaryM,0);close(r.wallFaces.grossAreaM2,36.96);close(r.wallFaces.openingAreaM2,3.33);close(r.wallFaces.netAreaM2,33.63);assert.equal(r.wallFaces.segments.length,4);
});

test('partial room-wall association returns a subtotal and marks the missing boundary',()=>{
 const p=project();p.walls=p.walls.slice(0,1);p.openings=p.openings.filter(o=>o.wallId==='wal_top');const r=Q.room(p,'rom_main');assert.equal(r.wallFaces.status,'measured');assert.equal(r.wallFaces.complete,false);assert.equal(r.wallFaces.associationComplete,false);close(r.wallFaces.matchedBoundaryM,3.8);close(r.wallFaces.missingBoundaryM,9.4);assert.equal(r.wallFaces.reason,'partial-room-wall-association');
});

test('room with no demonstrable wall relation reports wall-face area unavailable',()=>{
 const p=project();p.walls=p.walls.map(w=>({...w,start:{x:w.start.x+50000,y:w.start.y},end:{x:w.end.x+50000,y:w.end.y}}));p.openings=[];const r=Q.room(p,'rom_main');assert.equal(r.wallFaces.status,'unavailable');assert.equal(r.wallFaces.grossAreaM2,null);assert.equal(r.wallFaces.reason,'room-wall-association-not-demonstrable');
});

test('shared physical wall becomes one face for each adjacent room without duplicating the wall entity',()=>{
 const p={schemaVersion:'1.7.0',scale:{confidence:'real'},walls:[wall('wal_shared',{x:4000,y:0},{x:4000,y:3000})],openings:[],rooms:[room('rom_a',[{x:100,y:100},{x:3900,y:100},{x:3900,y:2900},{x:100,y:2900}]),room('rom_b',[{x:4100,y:100},{x:7900,y:100},{x:7900,y:2900},{x:4100,y:2900}])]};
 const q=Q.level(p);assert.equal(q.walls.length,1);for(const r of q.rooms){assert.equal(r.wallFaces.segments.length,1);close(r.wallFaces.segments[0].lengthM,2.8);close(r.wallFaces.grossAreaM2,7.84);assert.equal(r.wallFaces.complete,false);}assert.notEqual(q.rooms[0].wallFaces.segments[0].face,q.rooms[1].wallFaces.segments[0].face);
});

test('ambiguous overlapping physical walls do not produce a confident room-face total',()=>{
 const p=project();p.walls.push({...p.walls[0],id:'wal_top_duplicate'});const r=Q.room(p,'rom_main');assert.equal(r.wallFaces.status,'unavailable');assert.equal(r.wallFaces.reason,'ambiguous-wall-face-association');assert.equal(r.wallFaces.netAreaM2,null);
});

test('excluded room keeps its floor quantity but only SurfaceMetrics floor total excludes it',()=>{
 const p=project();p.rooms.push(room('rom_ex',[{x:5000,y:0},{x:6000,y:0},{x:6000,y:1000},{x:5000,y:1000}],{counted:false,material:'mat_tile'}));const q=Q.level(p);close(q.rooms.find(r=>r.id==='rom_ex').floor.areaM2,1);close(q.quantities.floor.areaM2,10.64);assert.deepEqual(q.quantities.floor.excluded,['rom_ex']);assert.equal(q.quantities.floorMaterials.find(x=>x.materialId==='mat_tile').areaM2,1);
});

test('unusable floor polygon is unavailable rather than 0 and makes floor subtotal incomplete',()=>{
 const p=project();p.rooms.push(room('rom_bad',[{x:0,y:0},{x:1000,y:0},{x:2000,y:0}]));const q=Q.level(p);const bad=q.rooms.find(r=>r.id==='rom_bad');assert.equal(bad.floor.areaM2,null);assert.equal(bad.floor.status,'unavailable');assert.equal(q.quantities.floor.complete,false);assert.ok(q.quantities.floor.missing.includes('rom_bad'));
});

test('opening counts are direct document quantities by kind',()=>{
 const counts=Q.level(project()).quantities.openings;assert.equal(counts.total,2);assert.equal(counts.byKind.window,1);assert.equal(counts.byKind.door,1);assert.equal(counts.byKind['sliding-door'],0);assert.equal(counts.unit,'unit');
});

test('wall lifecycle totals stay separate for existing, new and demolished walls',()=>{
 const p=project();p.walls[1].status='new';p.walls[2].status='demolished';const q=Q.level(p).quantities.wallsByStatus;assert.equal(q.existing.count,2);assert.equal(q.new.count,1);assert.equal(q.demolished.count,1);close(q.demolished.wallLength.value,4);
});

test('floor material areas are derived without hiding excluded rooms',()=>{
 const p=project();p.rooms.push(room('rom_second',[{x:5000,y:0},{x:7000,y:0},{x:7000,y:2000},{x:5000,y:2000}],{counted:false,material:'mat_floor'}));const m=Q.level(p).quantities.floorMaterials.find(x=>x.materialId==='mat_floor');close(m.areaM2,14.64);assert.equal(m.complete,true);assert.deepEqual(m.roomIds.sort(),['rom_main','rom_second']);
});

test('N-level home keeps order and aggregates mixed measured/estimated quantities',()=>{
 const a=project('real'),b=project('estimated');b.rooms[0].polygon=[{x:100,y:100},{x:2100,y:100},{x:2100,y:2100},{x:100,y:2100}];const building={levels:[{id:'lvl_b',name:'B',order:2,project:b},{id:'lvl_a',name:'A',order:1,project:a}]};const q=Q.home(building);assert.deepEqual(q.levels.map(l=>l.levelId),['lvl_a','lvl_b']);assert.equal(q.status,'estimated');close(q.quantities.floor.areaM2,14.64);assert.equal(q.quantities.openings.total,4);assert.equal(q.quantities.walls.count,8);
});

test('single project home is one level',()=>{const q=Q.home(project());assert.equal(q.levels.length,1);close(q.quantities.floor.areaM2,10.64);});

test('legacy and future V1-like inputs are read without mutation or version changes',()=>{
 for(const version of ['1.0.0','1.99.0']){const p=project();p.schemaVersion=version;p.futureField={kept:true};const before=JSON.stringify(p);Q.home(p);assert.equal(JSON.stringify(p),before);assert.equal(p.schemaVersion,version);}
});

test('quantity engine never mutates its source object',()=>{const p=project(),before=JSON.stringify(p);Q.level(p);Q.room(p,'rom_main');Q.wall(p,'wal_top');assert.equal(JSON.stringify(p),before);});

test('invalid inputs and unknown IDs fail explicitly instead of fabricating quantities',()=>{
 assert.throws(()=>Q.level(null),TypeError);assert.throws(()=>Q.home({}),TypeError);const p=project();assert.throws(()=>Q.room(p,'rom_missing'),RangeError);assert.throws(()=>Q.wall(p,'wal_missing'),RangeError);
});

test('quantity API keeps professional units numeric and unformatted',()=>{const q=Q.level(project());assert.equal(typeof q.quantities.floor.areaM2,'number');assert.equal(q.quantities.walls.wallLength.unit,'m');assert.equal(q.quantities.walls.faceNetArea.unit,'m2');assert.equal(q.quantities.openings.unit,'unit');});

test('room face with missing wall height is unavailable rather than fabricated',()=>{
 const p=project();delete p.walls[0].heightMm;const r=Q.room(p,'rom_main');const seg=r.wallFaces.segments.find(s=>s.wallId==='wal_top');assert.equal(seg.status,'unavailable');assert.equal(seg.grossAreaM2,null);assert.equal(r.wallFaces.complete,false);assert.equal(r.wallFaces.netAreaM2,null);assert.equal(r.wallFaces.reason,'invalid-wall-geometry');
});
