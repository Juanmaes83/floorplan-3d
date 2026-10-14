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
