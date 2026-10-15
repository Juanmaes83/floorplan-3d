const {test}=require('node:test');
const assert=require('node:assert/strict');
const Core=require('../js/project-core.js');
const Presentation=require('../js/presentation-core.js');

test('presentation plan uses real room IDs, project center and revision without changing source',()=>{
 const project=Core.initial(),before=JSON.stringify(project),geometry=Core.geometry(project);
 const plan=Presentation.create(project,geometry,'entry-example','rev-one');
 assert.ok(plan);
 assert.deepEqual(plan.center,geometry.center);
 assert.equal(plan.stops[0].kind,'overview');
 assert.equal(plan.stops[1].roomId,geometry.rooms[0].id);
 assert.ok(plan.stops[1].areaM2>0);
 assert.equal(JSON.stringify(project),before);
 assert.equal(Presentation.current(plan,project.id,'entry-example','rev-one'),true);
 assert.equal(Presentation.current(plan,project.id,'entry-copy','rev-one'),false);
 assert.equal(Presentation.current(plan,project.id,'entry-example','rev-two'),false);
});

test('presentation rejects empty or demolished layouts',()=>{
 const project=Core.initial();project.rooms=[];project.walls=[];
 assert.equal(Presentation.create(project,Core.geometry(project),'entry','rev'),null);
});

test('ordered room selection and sidecar reconciliation keep project geometry authoritative',()=>{
 const project=Core.initial(),geometry=Core.geometry(project),ids=geometry.rooms.slice(0,3).map(r=>r.id),before=JSON.stringify(project);
 const plan=Presentation.create(project,geometry,'entry-a','rev-a',[ids[2],ids[0],ids[2]]);
 assert.deepEqual(plan.stops.map(s=>s.roomId),[null,ids[2],ids[0]]);
 const saved=Presentation.sidecar(project.id,'entry-a','rev-a',[ids[2],ids[0]]);
 assert.equal(Presentation.key('entry-a',project.id),Presentation.key('entry-a',project.id));
 assert.notEqual(Presentation.key('entry-b',project.id),Presentation.key('entry-a',project.id));
 assert.deepEqual(Presentation.reconcile(saved,project,geometry,'entry-a','rev-a').selected,[ids[2],ids[0]]);
 assert.equal(Presentation.reconcile(saved,project,geometry,'entry-a','rev-b').changed,true);
 const stale={...saved,roomIds:[ids[2],'removed-room',ids[0]]};
 assert.deepEqual(Presentation.reconcile(stale,project,geometry,'entry-a','rev-b'),{selected:[ids[2],ids[0]],changed:true,missing:1,invalid:false});
 assert.equal(Presentation.reconcile(saved,project,geometry,'entry-b','rev-a').invalid,true);
 assert.equal(Presentation.reconcile({...saved,roomIds:[]},project,geometry,'entry-a','rev-a').invalid,true);
 assert.equal(Presentation.reconcile({...saved,roomIds:[ids[0],ids[0]]},project,geometry,'entry-a','rev-a').invalid,true);
 assert.equal(JSON.stringify(project),before);
});

test('minimap preserves irregular rotated coordinates and maps camera direction to plan axes',()=>{
 const geometry={center:{x:5000,y:3000},rooms:[
  {id:'angled',name:'Angled',poly:[[1000,2000],[3100,1100],[4800,2600],[3000,3900],[1800,3300]]},
  {id:'next',name:'Next',poly:[[5000,2600],[6500,3400],[5600,4700]]}
 ]};
 const before=JSON.stringify(geometry),pose={position:[1,8,2],target:[-1,0,-2]};
 const map=Presentation.minimap(geometry,pose,'angled');
 assert.deepEqual(map.rooms[0].poly,geometry.rooms[0].poly);
 assert.equal(map.rooms[0].active,true);assert.equal(map.rooms[1].active,false);
 assert.ok(map.viewBox[0]<1000&&map.viewBox[1]<1100);
 assert.deepEqual([map.heading.x,map.heading.y],[4000,1000]);
 assert.ok(map.heading.dx<0&&map.heading.dy<0);
 assert.ok(Math.abs(Math.hypot(map.heading.dx,map.heading.dy)-1)<1e-12);
 assert.equal(JSON.stringify(geometry),before);
});
