// Free-place search (js/furniture-placement.js) and the building-wide BW5 status, on a conflicting building that is
// not the corrected multi-level fixture (tests/fixtures/stair-conflict-building.cjs).
const {test}=require('node:test'),assert=require('node:assert/strict');
const PL=require('../js/furniture-placement.js'),B=require('../js/building-core.js');
const S=require('./fixtures/stair-conflict-building.cjs');
const clone=v=>JSON.parse(JSON.stringify(v));
const item=(over={})=>({id:'obj_new',type:'shelf',name:'Estantería',position:{x:2400,y:1900},size:{widthMm:600,depthMm:300},rotationDeg:0,...over});
const level=(b,i)=>({p:b.levels[i].project,zones:B.stairZonesOf(b,b.levels[i])});

test('building status is global, derived and names every conflict with level, object, zone and scale confidence', ()=>{
 const {building}=S.build(),st=B.buildingStatus(building),text=JSON.stringify(building);
 assert.equal(st.state,'pending');assert.equal(st.headline,'2 conflictos en 2 plantas: distribución pendiente');
 assert.deepEqual(st.conflicts.map(c=>c.summary),[
  'Planta baja: «Sofá» sobre los peldaños 1 · 800 mm (escala pendiente: medida nominal)',
  'Planta primera: «Cama» sobre el hueco de la escalera 1 · 660 mm (escala estimada: medida nominal)']);
 assert.equal(JSON.stringify(building),text,'nothing is written into the document');
 const fixed=clone(building);fixed.levels[0].project.objects=fixed.levels[0].project.objects.filter(o=>o.id!=='obj_conflict-sofa');fixed.levels[1].project.objects[0].position={x:2600,y:2600};
 assert.equal(B.buildingStatus(fixed).state,'clear');
 // An object that cannot be evaluated is never reported as «clear».
 const bad=clone(fixed);bad.levels[1].project.objects[1].position.x=Number.NaN;
 const sb=B.buildingStatus(bad);assert.equal(sb.state,'insufficient');assert.equal(sb.unevaluated[0].objectId,'obj_conflict-desk');assert.match(sb.headline,/Evidencia insuficiente/);
});

test('search: nearest valid pose inside one room, clear of stair, walls, door swing and furniture; deterministic', ()=>{
 const {building}=S.build(),{p,zones}=level(building,1),o=item({position:{x:5000,y:1900}});
 const a=PL.find(p,o,{zones}),b2=PL.find(p,o,{zones});assert.deepEqual(a,b2,'same input, same answer');
 assert.equal(a.ok,true);assert.deepEqual(PL.problems(p,{...o,position:a.position},{zones}),[]);
 assert.equal(a.roomName,'Estudio');assert.ok(a.distanceMm>0);
 // Size, rotation and id are kept; only the position changes.
 const turned=PL.find(p,item({position:{x:5000,y:1900},rotationDeg:35}),{zones});assert.equal(turned.ok,true);
 assert.deepEqual(PL.problems(p,{...item({rotationDeg:35}),position:turned.position},{zones}),[],'rotated footprint checked, not its box');
});

test('search refuses instead of guessing: no room, ambiguous room, no free place', ()=>{
 const {building,pasoCenterX}=S.build(),g=level(building,0);
 assert.equal(PL.find(g.p,item({position:{x:100,y:100}}),{zones:g.zones}).reason,'no-room','outside every room');
 // A point on the shared wall face belongs to no single room: no certainty about the room.
 const amb=clone(g.p);amb.rooms.push({...clone(amb.rooms[0]),id:'rom_overlap',name:'Solape',labelAt:{x:4500,y:1900},polygon:[{x:4000,y:400},{x:5000,y:400},{x:5000,y:3400},{x:4000,y:3400}]});
 assert.equal(PL.find(amb,item({position:{x:4200,y:1900}}),{zones:g.zones}).reason,'ambiguous-room');
 // The narrow «Paso» is taken by the stair: nothing valid, and the message says why.
 const none=PL.find(g.p,item({name:'Banco',position:{x:Math.round(pasoCenterX),y:2200},size:{widthMm:900,depthMm:400}}),{zones:g.zones});
 assert.equal(none.ok,false);assert.equal(none.reason,'no-space');assert.match(none.message,/No hay sitio libre para «Banco» en «Paso» sin pisar la escalera/);
 assert.ok(none.tried>0&&none.tried<=PL.MAX_CANDIDATES);
});

test('a pose against a wall face is contact, through a wall is not; the door swing and other furniture block', ()=>{
 const {building}=S.build(),g=level(building,0),salon=g.p.rooms.find(r=>r.name==='Salón');
 // 600×300 turned 90°: 300 mm along x, so a centre at x 550 puts its edge on the wall face (x 400).
 const flush=item({size:{widthMm:600,depthMm:300},rotationDeg:90});
 assert.deepEqual(PL.problems(g.p,{...flush,position:{x:550,y:1900}},{zones:g.zones}),[],'touching the wall face (x 400) is allowed');
 assert.ok(PL.problems(g.p,{...flush,position:{x:540,y:1900}},{zones:g.zones}).some(x=>x.kind==='wall'||x.kind==='room'),'10 mm into the wall is refused');
 // The door between «Salón» and «Paso» swings into «Salón» (hinge 4400, 2380; leaf 800 mm).
 assert.ok(PL.problems(g.p,item({position:{x:4100,y:2700}}),{zones:g.zones}).some(x=>x.kind==='door'),'door swing blocks');
 assert.ok(PL.problems(g.p,item({position:{x:1600,y:1300}}),{zones:g.zones}).some(x=>x.kind==='furniture'),'the table blocks');
 const near=PL.find(g.p,item({position:{x:4100,y:2700}}),{zones:g.zones});assert.equal(near.ok,true);assert.equal(near.roomId,salon.id);
 assert.deepEqual(PL.problems(g.p,{...item(),position:near.position},{zones:g.zones}),[]);
});

test('search budget: bounded candidates and time with many pieces of furniture', ()=>{
 const {building}=S.build(),u=clone(building.levels[1].project);
 for(let i=0;i<40;i++)u.objects.push({id:`obj_fill-${i}`,type:'box',name:`Caja ${i}`,position:{x:600+(i%10)*450,y:700+Math.floor(i/10)*500},size:{widthMm:300,depthMm:300},rotationDeg:(i*17)%360});
 const zones=B.stairZonesOf(building,building.levels[1]),t=performance.now(),r=PL.find(u,item({position:{x:3000,y:1900},size:{widthMm:2500,depthMm:2000}}),{zones});
 const ms=performance.now()-t;assert.ok(r.tried<=PL.MAX_CANDIDATES);assert.ok(ms<1500,`${ms.toFixed(0)} ms`);
 if(r.ok)assert.deepEqual(PL.problems(u,{...item({size:{widthMm:2500,depthMm:2000}}),position:r.position},{zones}),[]);
});

test('BW5 geometry is the one the 3D builds: stair corners and furniture poses agree within 1 mm', ()=>{
 // Reproduces index.html: steps from the start point along +x, width along z, group rotated by −rotationDeg.
 const {building}=S.build(),s=building.stairs[0],a=-s.rotationDeg*Math.PI/180;
 const world=(x,z)=>({x:s.startMm.x+x*Math.cos(a)+z*Math.sin(a),y:s.startMm.y-x*Math.sin(a)+z*Math.cos(a)});
 const built=[[0,-s.widthMm/2],[0,s.widthMm/2],[s.runLengthMm,s.widthMm/2],[s.runLengthMm,-s.widthMm/2]].map(([x,z])=>world(x,z));
 const fp=B.stairFootprint(s);for(const p of built)assert.ok(fp.some(q=>Math.hypot(p.x-q.x,p.y-q.y)<1),'built corner on the footprint');
});

test('library: a conflicting building is stored, duplicated and varied as received; the state stays derived', ()=>{
 const Library=require('../js/project-library.js'),C=require('../js/project-core.js'),map=new Map(),storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};
 const library=Library.load(storage,C.initial()),{building}=S.build();library.addBuilding(building,{activeLevelId:building.levels[0].id});
 const id=library.activeId(),stored=library.building();assert.equal(B.canonical(stored),B.canonical(building),'stored unchanged');
 assert.equal(B.buildingStatus(stored).state,'pending');assert.ok(!map.get(Library.KEY).includes('BW5'),'nothing derived is stored');
 library.duplicate(id,'Copia del dúplex');const copy=library.building();assert.notEqual(copy.id,building.id);
 assert.deepEqual(copy.levels.map(l=>l.project.objects.map(o=>[o.id,o.position,o.rotationDeg])),building.levels.map(l=>l.project.objects.map(o=>[o.id,o.position,o.rotationDeg])),'positions kept');
 assert.equal(B.buildingStatus(copy).conflicts.length,2);
 library.open(id);library.variant(library.project(),'Variante del dúplex');const group=library.group(library.activeId());
 assert.ok(group.every(g=>g.building&&B.buildingStatus(g.building).state==='pending'),'variant cards can show the pending state');
});

test('diagnosis with many objects on every level stays fast', ()=>{
 const b=clone(S.build().building);
 for(const l of b.levels)for(let i=0;i<150;i++)l.project.objects.push({id:`obj_${l.id}-${i}`,type:'box',name:`Caja ${i}`,position:{x:600+(i%15)*330,y:600+Math.floor(i/15)*270},size:{widthMm:200,depthMm:200},rotationDeg:(i*23)%360});
 const t=performance.now();for(let k=0;k<10;k++)B.buildingStatus(b);const ms=(performance.now()-t)/10;
 assert.ok(ms<50,`${ms.toFixed(1)} ms per full evaluation with ${b.levels.reduce((n,l)=>n+l.project.objects.length,0)} objects`);
});

// Finding 12: one level, no stair. Stacking by design (a hob set into a worktop) does not block, as in the layout review;
// a bed is placed beside another one or refused when the room is full, never on top.
test('one level: design stacking does not block, real overlaps do',()=>{
 const C=require('../js/project-core.js'),L=require('../js/room-layout.js'),P=require('../js/furniture-placement.js');
 let p=L.blank('Una planta');p=L.create(p,{name:'Dormitorio',width:6000,depth:4000,x:0,y:0}).project;
 const obj=(id,type,x,y,w,d,rot=0)=>{const {cx,cy,w:_w,d:_d,rot:_r,...o}={...C.object(type,type,x,y,w,d,rot,'#888'),id};return o;};
 p.objects.push(obj('obj_counter','counter',3000,600,2400,600));
 assert.equal(P.problems(p,obj('obj_stove','stove',3000,600,600,600)).filter(x=>x.kind==='furniture').length,0,'hob in the worktop');
 const bed=obj('obj_bed1','bed',3000,2400,1800,2000);p.objects.push(bed);
 const second=P.find(p,obj('obj_bed2','bed',3000,2400,1800,2000));assert.equal(second.ok,true);assert.ok(second.distanceMm>0,'moved beside');
 p.objects.push({...obj('obj_bed2','bed',0,0,1800,2000),position:second.position});
 assert.deepEqual(P.problems(p,p.objects.find(o=>o.id==='obj_bed2')),[]);
 const third=P.find(p,obj('obj_bed3','bed',3000,2400,1800,2000));if(third.ok){p.objects.push({...obj('obj_bed3','bed',0,0,1800,2000),position:third.position});}
 const fourth=P.find(p,obj('obj_bed4','bed',3000,2400,1800,2000));assert.equal(fourth.ok,false);assert.equal(fourth.reason,'no-space');
 // Rotated: a 90° bed fits along the other axis or is refused, never on top.
 const rot=P.find(p,obj('obj_bed5','bed',3000,2400,1800,2000,90));if(rot.ok)assert.deepEqual(P.problems(p,{...obj('obj_bed5','bed',0,0,1800,2000,90),position:rot.position}).filter(x=>x.kind==='furniture'),[]);
});
