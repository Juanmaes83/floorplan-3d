// Public demo «Ver cómo evoluciona una obra»: the example plan is built from the canonical example house with the real
// FT3D-8 contracts, links only real elements with admitted roles, carries no amounts and is deterministic.
const test=require('node:test'),assert=require('node:assert/strict');
globalThis.window=globalThis;require('../js/project-schema.js');require('../js/reference-project.js');
const Core=require('../js/project-core.js'),Demo=require('../js/construction-demo-core.js'),Schedule=require('../js/construction-schedule-core.js'),
  Adapter=require('../js/construction-project-adapter.js'),Visual=require('../js/construction-visual-state.js');

test('the demo project is the canonical example as a new build: same geometry, only the wall status changes',()=>{
 const ref=Core.initial(),p=Demo.project();
 assert.equal(p.id,ref.id);assert.equal(p.name,'Vivienda de ejemplo de RUBIK');
 assert.equal(p.walls.length,ref.walls.length);assert.equal(p.openings.length,ref.openings.length);assert.equal(p.rooms.length,ref.rooms.length);
 assert.ok(p.walls.every(w=>w.status==='new'));
 const strip=x=>({...x,walls:x.walls.map(({status,...w})=>w),rooms:x.rooms.map(({name,...r})=>r),name:null});
 assert.deepEqual(strip(p),strip(ref),'geometry, openings, rooms and furniture are the example\'s');
 Core.validate(p,{strict:true});
 assert.equal(Core.initial().walls[0].status,ref.walls[0].status,'the canonical example is not mutated');
});

test('the example plan is a valid FT3D-8 schedule over real elements, with admitted roles, no budget and a clean evaluation',async()=>{
 const input=await Demo.build();
 assert.deepEqual(input.budgets,[],'the demo shows no amounts');
 assert.equal(input.schedule.review.status,'draft');assert.equal(input.binding.review.status,'draft');assert.equal(input.binding.budgetId,null);
 Schedule.parse(JSON.stringify(input.schedule));
 const real=new Set([...input.project.walls,...input.project.openings,...input.project.rooms].map(x=>Adapter.elementKey(null,x.id)));
 for(const t of input.schedule.tasks){assert.match(t.source,/Datos de ejemplo/);
  for(const e of t.elements||[])assert.ok(real.has(e.elementId)||e.elementId.startsWith(Adapter.ILLUSTRATIVE_PREFIX),e.elementId);}
 const m=await Adapter.evaluate({source:input.project,schedule:input.schedule,budget:null,binding:input.binding});
 assert.equal(m.planning.status,'available');assert.notEqual(m.costs.status,'available');
 assert.deepEqual(m.issues.filter(i=>i.severity==='error'),[]);
 // Only what cannot be drawn stays without a task (the example's roof is not derivable): every drawable element is planned.
 assert.deepEqual(m.coverage.elements.unscheduled,m.coverage.elements.notRepresentable);
 assert.equal(m.coverage.elements.preExisting,0,'a new build: nothing stands before the plan');
});

test('the house builds up: nothing before the plan, structure in progress, every modelled element at the end, site resources removed',async()=>{
 const {schedule}=await Demo.build(),tl=Visual.timeline(schedule),present=d=>Visual.frameAt(schedule,d).elements.filter(e=>e.present).map(e=>e.elementId);
 assert.deepEqual(present(tl.preStartDate),[]);
 const after=new Date(Date.parse(Schedule.bounds(schedule).endDate+'T00:00:00Z')+86400000).toISOString().slice(0,10);
 const mid=present('2027-04-05'),end=present(after);
 assert.ok(mid.length>10&&mid.includes('illustrative/scaffold'));
 assert.ok(end.length>mid.length);assert.ok(!end.some(id=>id.startsWith('illustrative/')));
});

test('deterministic and unknown demos are refused',async()=>{
 assert.deepEqual(JSON.parse(JSON.stringify(await Demo.build())),JSON.parse(JSON.stringify(await Demo.build())));
 await assert.rejects(()=>Demo.build('otra'),/desconocida/);
});
