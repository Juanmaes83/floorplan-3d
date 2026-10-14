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
