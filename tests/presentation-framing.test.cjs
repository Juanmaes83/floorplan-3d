const {test}=require('node:test'),assert=require('node:assert/strict');
const Core=require('../js/project-core.js'),Presentation=require('../js/presentation-core.js'),Route=require('../js/presentation-route.js');
const reference=require('../js/reference-project.js'),irregularHome=require('./helpers/irregular-home.cjs');
// Visible regions measured from the presentation card in the three review viewports (stage fractions).
const views=[{name:'1440x900',aspect:905/900,region:[0,0,.63,1]},{name:'390x844',aspect:390/844,region:[0,0,1,.6]},{name:'844x390',aspect:844/390,region:[0,0,.6,1]}];
const counted=geometry=>geometry.rooms.filter(r=>r.counted!==false).map(r=>r.id);
const frame=(project,geometry,id,view,extra={})=>Presentation.roomFrame(geometry,project.objects,id,{aspect:view.aspect,region:view.region,fovDeg:45,wallTop:2.8,sectionTops:[1.2],...extra});

for(const [label,make] of [['reference home',()=>structuredClone(reference)],['rotated home with concave bedroom',()=>irregularHome(reference)]])
 test(`R10 room stops make every counted room the protagonist: ${label}`,()=>{
  const project=make(),before=JSON.stringify(project),geometry=Core.geometry(project),geometryBefore=JSON.stringify(geometry);
  for(const view of views)for(const id of counted(geometry)){
   const result=frame(project,geometry,id,view),where=`${view.name} ${id}`;
   // Documented R10 exception: a room more than 2.5 times longer than wide cannot fill 40 % of a near-square
   // region without cropping; it must still be the clear protagonist.
   const poly=geometry.rooms.find(r=>r.id===id).poly,edge=Math.max(...poly.map((p,i)=>{const q=poly[(i+1)%poly.length];return Math.hypot(q[0]-p[0],q[1]-p[1]);})),elongation=edge*edge/(Presentation.area(poly)*1e6);
   const regionAspect=view.aspect*(view.region[2]-view.region[0])/(view.region[3]-view.region[1]);
   if(elongation>2.5&&regionAspect>.6&&regionAspect<1.6&&!result.accepted){assert.ok(result.share>=.35&&result.otherShare<result.share/2,`${where} elongated ${JSON.stringify(result)}`);continue;}
   assert.ok(result.accepted,`${where} accepted ${JSON.stringify(result)}`);
   assert.ok(result.share>=.4,`${where} share ${result.share}`);
   assert.ok(result.otherShare<.25&&result.otherShare<result.share,`${where} neighbour ${result.otherShare}`);
   assert.ok(result.floorVisible>=.75,`${where} visible ${result.floorVisible}`);
   assert.ok(result.eye[1]>result.wallTop,`${where} camera above the walls it frames`);
  }
  assert.equal(JSON.stringify(project),before);assert.equal(JSON.stringify(geometry),geometryBefore);
 });

test('R10 small en-suite bathroom is not dominated by the main bedroom',()=>{
 const geometry=Core.geometry(reference);
 for(const view of views){const result=frame(reference,geometry,'rom_mbath',view);assert.ok(result.share>=.4,`${view.name} ${result.share}`);assert.ok(result.otherShare<=.15,`${view.name} ${result.otherShare}`);}
});

test('R10 framing is deterministic, declares sections and honours a cut editor view',()=>{
 const geometry=Core.geometry(reference),view=views[0],a=frame(reference,geometry,'rom_mbath',view),b=frame(reference,geometry,'rom_mbath',view);
 assert.deepEqual(a,b);
 assert.equal(a.section,a.wallTop<2.8);
 const noSection=frame(reference,geometry,'rom_mbath',view,{sectionTops:[]});assert.equal(noSection.section,false);assert.equal(noSection.wallTop,2.8);
 const cut=frame(reference,geometry,'rom_mbath',view,{wallTop:1.2,sectionTops:[]});assert.equal(cut.section,false);assert.equal(cut.wallTop,1.2);
 assert.equal(Presentation.roomFrame(geometry,reference.objects,'rom_missing',{}),null);
 const tiny=frame(reference,geometry,'rom_mbath',{aspect:1,region:[0,0,.1,.1]});assert.ok(tiny.accepted,'too-small regions fall back to the full stage');
});

test('R10 walkthrough choreography keeps eye height, gentle pitch, ramps and limited turning',()=>{
 for(const project of [structuredClone(reference),irregularHome(reference)]){
  const geometry=Core.geometry(project);
  for(const id of ['rom_master','rom_mbath','rom_hall','rom_kid']){
   const plan=Route.plan(project,geometry,id);if(plan.kind!=='interior')continue;
   const moves=Route.choreography(project,geometry,id,plan),S=moves.samples,where=`${project.id} ${id}`;
   assert.ok(S.length>10,where);assert.equal(S[0].t,0);
   assert.ok(S.every(s=>s.h>=1.4&&s.h<=1.6),`${where} eye height`);
   assert.ok(S.every(s=>s.pitchDeg>=0&&s.pitchDeg<=20),`${where} pitch`);
   let maxSpeed=0,maxTurn=0;for(let i=1;i<S.length;i++){const dt=S[i].t-S[i-1].t;assert.ok(dt>0,`${where} monotonic time`);maxSpeed=Math.max(maxSpeed,(S[i].s-S[i-1].s)/1000/dt);maxTurn=Math.max(maxTurn,Math.abs(S[i].yaw-S[i-1].yaw)/dt*180/Math.PI);}
   assert.ok(maxSpeed<=1.1+1e-9,`${where} speed ${maxSpeed}`);assert.ok(maxTurn<=60,`${where} turn ${maxTurn}`);
   const rampIn=S.find(s=>s.s>=300)?.t,rampOut=moves.duration-[...S].reverse().find(s=>moves.lengthMm-s.s>=300)?.t;
   assert.ok(rampIn>=.6&&rampOut>=.6,`${where} ramps ${rampIn} ${rampOut}`);
   // Arrival may be a doorway view: within 0.7 m of the room and seeing at least half of its floor.
   const room=geometry.rooms.find(r=>r.id===id),edge=inside(room.poly,moves.arrival.x,moves.arrival.y)?0:Math.min(...room.poly.map((a,i)=>segmentDistance(moves.arrival,a,room.poly[(i+1)%room.poly.length])));
   assert.ok(edge<=700,`${where} arrival ${edge} mm from the room`);assert.ok(moves.arrival.viewScore>=.5,`${where} arrival view ${moves.arrival.viewScore}`);
   assert.ok(moves.arrival.pitchDeg>=0&&moves.arrival.pitchDeg<=20,`${where} arrival pitch`);
  }
 }
});

test('R10 planner grid follows the dominant wall angle of a rotated plan without changing axis-aligned routes',()=>{
 const reference_=structuredClone(reference),geometry=Core.geometry(reference_),rotated=irregularHome(reference),rotatedGeometry=Core.geometry(rotated);
 const kinds=['rom_kid','rom_gbath','rom_hall','rom_dining'].map(id=>Route.plan(rotated,rotatedGeometry,id).kind);assert.deepEqual(kinds,['interior','interior','interior','interior']);
 assert.equal(Route.plan(reference_,geometry,'rom_master').kind,'interior');
});
test('R10 smoothed route keeps clearance along its whole dense path',()=>{
 const geometry=Core.geometry(reference);
 for(const id of ['rom_master','rom_mbath','rom_kid','rom_gbath']){
  const plan=Route.plan(reference,geometry,id);if(plan.kind!=='interior')continue;
  assert.ok(plan.path.length>plan.points.length);
  for(let i=1;i<plan.path.length;i++)assert.ok(Math.hypot(plan.path[i].x-plan.path[i-1].x,plan.path[i].y-plan.path[i-1].y)<=40.001,`${id} step ${i}`);
  const walls=geometry.walls.filter(w=>w.status!=='demolished');
  for(const p of plan.path)for(const w of walls){const dx=p.x-w.center[0],dy=p.y-w.center[1],c=Math.cos(w.angle),s=Math.sin(w.angle);
   assert.ok(!(Math.abs(dx*c+dy*s)<w.spanMm/2+220&&Math.abs(-dx*s+dy*c)<w.thickness/2+220),`${id} clearance at ${p.x},${p.y}`);}
 }
});
function segmentDistance(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p.x-a[0])*dx+(p.y-a[1])*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a[0]-dx*t,p.y-a[1]-dy*t);}
function inside(poly,x,y){let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;}
