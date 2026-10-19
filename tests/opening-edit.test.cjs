// Contextual opening editing (js/opening-edit.js): side attribution, shared interval guard, edit/add previews and
// wall reversal. Geometry is checked against project-core.geometry, which drives the 2D leaf, 3D and the visit.
const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../js/project-core.js'),L=require('../js/room-layout.js'),T=require('../js/tracing-core.js'),O=require('../js/opening-edit.js'),R=require('../js/layout-review.js');
const Spatial=require('../tools/rubik-mcp/src/spatial.cjs');
const clone=v=>JSON.parse(JSON.stringify(v));

// Salón x 0–4000 and Cocina x 4240–7240 (y 0–3000) share the vertical wall at x 4120, drawn from y −120 to 3120.
function home(){let p=L.blank('Huecos');p=L.create(p,{name:'Salón',width:4000,depth:3000}).project;p=L.create(p,{name:'Cocina',width:3000,depth:3000,neighborId:p.rooms[0].id,side:'right'}).project;return p;}
const wallAt=(p,x)=>p.walls.find(w=>w.start.x===x&&w.end.x===x);
const withDoor=(p,wall,y=1000,kind='door',width=800)=>{const o=T.opening(p,wall.id,{x:wall.start.x,y},kind,width);return o;};
// Point 300 mm along the leaf direction from the hinge, as project-core draws and the 3D/visit use it.
const leafPoint=(p,id)=>{const d=C.geometry(p).doors.find(x=>x.id===id);return {x:d.h[0]+d.o[0]*300,y:d.h[1]+d.o[1]*300};};
const roomAt=(p,q)=>p.rooms.filter(r=>{let y=false;for(let i=0,j=r.polygon.length-1;i<r.polygon.length;j=i++){const a=r.polygon[i],b=r.polygon[j];if((a.y>q.y)!==(b.y>q.y)&&q.x<(b.x-a.x)*(q.y-a.y)/(b.y-a.y)+a.x)y=!y;}return y;}).map(r=>r.name);

test('sides of a shared wall follow the wall direction and match the leaf the 2D/3D draw', ()=>{
 const p=home(),w=wallAt(p,4120),o=withDoor(p,w);
 assert.deepEqual([w.start.y<w.end.y],[true],'drawn downwards: left hand looks east');
 const s=O.sideLabels(p,o);assert.equal(s.left,'Hacia «Cocina»');assert.equal(s.right,'Hacia «Salón»');
 for(const side of ['left','right'])for(const hinge of ['start','end']){
  const q=O.edit(p,o.id,{side,hinge}).project;assert.deepEqual(roomAt(q,leafPoint(q,o.id)),[s.sides[side].name],`${side}/${hinge}`);
 }
 // Same wall drawn the other way round: the labels swap with it, the physical meaning of each label does not.
 const r=clone(p),rw=wallAt(r,4120);[rw.start,rw.end]=[rw.end,rw.start];C.validate(r);
 const rs=O.sideLabels(r,r.openings[0]);assert.equal(rs.left,'Hacia «Salón»');assert.equal(rs.right,'Hacia «Cocina»');
 assert.deepEqual(roomAt(r,leafPoint(r,o.id)),[rs.sides[r.openings[0].swing.side].name]);
});

test('oblique walls: rotating the whole home keeps every label on the side the leaf really opens to', ()=>{
 const base=home();withDoor(base,wallAt(base,4120));
 for(const deg of [30,135,-60]){
  const a=deg*Math.PI/180,c=Math.cos(a),s=Math.sin(a),turn=q=>({x:Math.round(q.x*c-q.y*s),y:Math.round(q.x*s+q.y*c)}),p=clone(base);
  for(const w of p.walls){w.start=turn(w.start);w.end=turn(w.end);}for(const r of p.rooms){r.polygon=r.polygon.map(turn);r.labelAt=turn(r.labelAt);}
  const id=p.openings[0].id;
  for(const side of ['left','right']){const q=O.edit(p,id,{side}).project,lab=O.sides(q,q.openings[0])[side];assert.ok(lab.named,`${deg}° ${side}`);assert.deepEqual(roomAt(q,leafPoint(q,id)),[lab.name],`${deg}° ${side}`);}
 }
});

test('exterior wall, overlapping rooms and repeated names fall back to «Lado 1/2»', ()=>{
 const p=home(),ext=wallAt(p,-120),o=withDoor(p,ext);
 const s=O.sideLabels(p,o);assert.equal(s.left,'Hacia «Salón»');assert.equal(s.right,'Lado 2');assert.equal(s.sides.right.reason,'no-room');
 // Two rooms called «Salón»: a name would not tell which one, even on the exterior wall.
 const dup=clone(p);dup.rooms[1].name='Salón';assert.equal(O.sideLabels(dup,dup.openings[0]).left,'Lado 1');
 const shared=withDoor(dup,wallAt(dup,4120));const ds=O.sideLabels(dup,shared);assert.equal(ds.left,'Lado 1');assert.equal(ds.right,'Lado 2');assert.equal(ds.sides.left.named,false);
 const over=clone(p);over.rooms.push({...clone(over.rooms[1]),id:'rom_overlap-copy',name:'Despensa'});C.validate(over);
 const os=O.sideLabels(over,withDoor(over,wallAt(over,4120)));assert.equal(os.left,'Lado 1');assert.equal(os.sides.left.reason,'overlapping-rooms');
});

test('side attribution agrees with the MCP spatial relation (#40) on the reference home', ()=>{
 const p=C.initial(),spatial=Spatial.createSpatialIndex(p);let compared=0;
 for(const o of p.openings){const rel=spatial.relation('openings',o),s=O.sides(p,o),mine=[s.left.roomId,s.right.roomId].filter(Boolean).sort();
  if(rel.status==='shared'&&rel.roomIds.length===2){assert.deepEqual(mine,[...rel.roomIds].sort(),o.id);compared++;}
  if(rel.status==='unique')assert.ok(mine.every(id=>rel.roomIds.includes(id)),o.id);}
 assert.ok(compared>=8,`${compared} shared openings compared`);
});

test('interval guard: touching is fine; overlapping, outside the wall or worsening a legacy overlap is refused', ()=>{
 const p=home(),w=wallAt(p,4120),a=withDoor(p,w,800),b=withDoor(p,w,2200);
 assert.deepEqual([a.offsetMm,a.widthMm,b.offsetMm],[520,800,1920]);
 const touch=O.edit(p,b.id,{offsetMm:1320});assert.equal(touch.changed,true);assert.deepEqual(O.conflicts(touch.project),[]);
 assert.throws(()=>O.edit(p,b.id,{offsetMm:1300}),e=>{assert.match(e.message,/Se solaparía 20 mm con Puerta abatible · tramo 520–1320 mm/);assert.doesNotMatch(e.message,/opn_/);return true;});
 assert.throws(()=>O.edit(p,b.id,{widthMm:2000}),/no cabe/);
 assert.throws(()=>O.edit(p,b.id,{offsetMm:-10}),/antes del inicio del muro, marcado «0»/);
 // Old file with an overlap: it opens unchanged, is reported, can be edited without worsening and can be resolved.
 const old=clone(p);old.openings[1].offsetMm=1200;C.validate(old);const bytes=JSON.stringify(old);
 assert.deepEqual(O.conflicts(old).map(c=>[c.overlapMm]),[[120]]);assert.equal(JSON.stringify(old),bytes);
 assert.equal(O.edit(old,b.id,{heightMm:2000}).changed,true,'unrelated edit allowed');
 assert.throws(()=>O.edit(old,b.id,{offsetMm:1100}),e=>{assert.match(e.message,/Se solaparía 220 mm/);assert.match(e.message,/Puerta abatible · tramo 520–1320 mm/);assert.doesNotMatch(e.message,/opn_/);return true;});
 assert.deepEqual(O.conflicts(O.edit(old,b.id,{offsetMm:1400}).project),[]);
});

test('edit keeps the ID, removes or creates the swing with the type and never certifies a review', ()=>{
 const p=home(),o=withDoor(p,wallAt(p,4120));p.openings[0].source={method:'manual',review:'confirmed'};const before=JSON.stringify(p);
 const win=O.edit(p,o.id,{kind:'window'});assert.equal(JSON.stringify(p),before,'input untouched');
 const w=win.project.openings[0];assert.equal(w.id,o.id);assert.equal(w.swing,undefined);assert.deepEqual([w.heightMm,w.sillHeightMm],[1200,900]);assert.equal(w.source.review,'unreviewed');
 assert.ok(win.notes.some(n=>/Se elimina el sentido/.test(n)));
 const back=O.edit(win.project,o.id,{kind:'door'}).project.openings[0];assert.deepEqual(back.swing,{hinge:'start',side:'left'});assert.deepEqual([back.heightMm,back.sillHeightMm],[2100,0]);
 const flip=O.edit(p,o.id,{side:'right',hinge:'end'}).project.openings[0];assert.deepEqual(flip.swing,{hinge:'end',side:'right'});assert.equal(flip.source.review,'unreviewed');
 assert.equal(O.edit(p,o.id,{side:'left'}).changed,false,'no change, no new state');
 assert.throws(()=>O.edit(p,o.id,{heightMm:3000}),/supera la altura del muro/);
 assert.throws(()=>O.edit(win.project,o.id,{side:'right'}),/Sólo una puerta abatible/);
 for(const kind of O.KINDS){const q=O.edit(p,o.id,{kind}).project;C.validate(q);assert.equal(!!q.openings[0].swing,kind==='door');}
});

test('the chosen side drives layout review of door leaves', ()=>{
 const p=home(),o=withDoor(p,wallAt(p,4120),1500);
 const salon=p.rooms.find(r=>r.name==='Salón');p.objects.push({...C.object('cabinet','Aparador',3700,1500,500,900,0,'#888888'),roomId:salon.id});
 const clean=({cx,cy,w,d,rot,...o})=>o;p.objects=p.objects.map(clean);C.validate(p);
 const into=side=>R.review(O.edit(p,o.id,{side}).project).findings.filter(f=>f.code==='puerta').length;
 assert.equal(into('right'),1,'opening into Salón hits the sideboard');assert.equal(into('left'),0,'opening into Cocina is clear');
});

test('add from a room: only its walls, door opens into it, no overlap, input untouched', ()=>{
 const p=home(),salon=p.rooms.find(r=>r.name==='Salón'),cocina=p.rooms.find(r=>r.name==='Cocina'),before=JSON.stringify(p);
 const walls=O.roomWalls(p,salon.id).map(w=>w.id);assert.equal(walls.length,4);assert.ok(walls.includes(wallAt(p,4120).id));assert.ok(!walls.includes(wallAt(p,7360).id));
 const r=O.add(p,salon.id,wallAt(p,4120).id,'door',{x:4120,y:1500});assert.equal(JSON.stringify(p),before);
 const o=r.project.openings.find(x=>x.id===r.id);assert.deepEqual(roomAt(r.project,leafPoint(r.project,o.id)),['Salón']);
 assert.deepEqual(O.add(p,cocina.id,wallAt(p,4120).id,'door',{x:4120,y:1500}).project.openings[0].swing.side,'left');
 assert.throws(()=>O.add(p,salon.id,wallAt(p,7360).id,'door',{x:7360,y:1500}),/no bordea la estancia/);
 assert.throws(()=>O.add(r.project,salon.id,wallAt(p,4120).id,'window',{x:4120,y:1700}),/Se solaparía/);
});

test('a wall reversed in «Plano propio» keeps its openings in place with the same leaf', ()=>{
 const p=home(),w=wallAt(p,4120),o=withDoor(p,w,600);T.opening(p,w.id,{x:4120,y:2400},'window',600);
 const g0=C.geometry(p),d0=g0.doors[0],win0=g0.windows[0];
 const q=clone(p),qw=wallAt(q,4120);[qw.start,qw.end]=[qw.end,qw.start];
 assert.deepEqual(O.wallEdited(p,q,qw.id).sort(),p.openings.map(x=>x.id).sort());C.validate(q);
 const g1=C.geometry(q),d1=g1.doors[0],win1=g1.windows[0];
 for(const k of [0,1]){assert.ok(Math.abs(d1.h[k]-d0.h[k])<1,'hinge');assert.ok(Math.abs(d1.o[k]-d0.o[k])<1e-9,'leaf direction');assert.ok(Math.abs(win1.center[k]-win0.center[k])<1,'window');}
 assert.ok(q.openings.every(x=>x.source.review==='unreviewed'));
 assert.deepEqual(O.wallEdited(p,clone(p),w.id),[],'same direction: nothing moves');
});
