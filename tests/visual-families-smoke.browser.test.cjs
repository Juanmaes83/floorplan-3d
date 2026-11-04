const {test}=require('node:test');
const assert=require('node:assert/strict');
const harness=require('./visual-families-harness.cjs');

test('F02 shared seam toggles on and off on the real Rubik project',async()=>{
 const run=await harness.start(process.cwd());
 try{
  const project=await harness.setup(run.page);
  await harness.present(run.page);
  const before=await run.page.evaluate(()=>({source:View3D.source.id,visual:View3D.visualFamilies,project:JSON.stringify(FloorPlanApp.project)}));
  assert.equal(before.source,project.id);
  assert.equal(before.visual.active.length,0);
  for(const id of ['opn_window-7','opn_window-10','opn_window-1'])assert(before.visual.bindings.some(b=>b.id===id));
  const options={projectId:project.id,enabled:true,sourceIds:['opn_window-7','opn_window-10','opn_window-1'],overrides:{'frame.finish':'graphite'}};
  const on=await run.page.evaluate(o=>View3D.setVisualFamilies(o),options);
  assert.deepEqual([...on.active].sort(),[...options.sourceIds].sort());
  assert(on.resources.geometries>0);
  const off=await run.page.evaluate(()=>View3D.setVisualFamilies({enabled:false}));
  assert.equal(off.active.length,0);
  assert.equal(off.resources.geometries,0);
  assert.equal(await run.page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),before.project);
  assert.deepEqual(run.errors,[]);
  console.log(JSON.stringify({ids:on.active,resourcesOn:on.resources,resourcesOff:off.resources,disposals:off.disposals,warnings:run.warnings}));
 }finally{await run.close();}
});
