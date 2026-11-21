const assert=require('node:assert/strict'),path=require('node:path');
const root=process.env.OP07_REVIEW,K=require(path.join(root,'tests/photo-project/kit.cjs'));
const fixture=require(path.join(root,'tests/op07/fixtures.cjs'));
(async()=>{
 const env=await K.start();
 try{
  const {page,context,watch}=await K.editor(env);
  try{
   const p=await page.evaluate(()=>structuredClone(FloorPlanApp.project)), w=fixture.longest(p);
   await page.evaluate(id=>select({kind:'wall',id}),w.id);
   await page.locator('#wallEndHeight').fill('2300');
   await page.locator('#wallApplyShape').click();
   const seen=()=>page.evaluate(id=>{const lib=JSON.parse(localStorage.getItem(FloorPlanLibrary.KEY));const stored=lib.entries.find(x=>x.id===lib.activeId).project;return {version:stored.schemaVersion,storedEnd:stored.walls.find(x=>x.id===id).heightEndMm??null,projectEnd:FloorPlanApp.project.walls.find(x=>x.id===id).heightEndMm??null,f02b:!!FloorPlanPersistenceEditor.session,a0:!!window.FloorPlanSchemaEpoch};},w.id);
   const before=await seen();
   assert.deepEqual(before,{version:'2.0.0',storedEnd:2300,projectEnd:2300,f02b:false,a0:false});
   await page.evaluate(id=>FloorPlanApp.applyExtension(p=>{const next=structuredClone(p);delete next.walls.find(x=>x.id===id).heightEndMm;return {ok:true,project:next};}),w.id);
   const after=await seen();
   assert.deepEqual(after,{...before,storedEnd:null,projectEnd:null});
   assert.deepEqual(watch.errors,[]);
   console.log(JSON.stringify({wall:w.id,origin:'normal',before,after}));
  }finally{await context.close();}
 }finally{await env.stop();}
})().catch(e=>{console.error(e);process.exitCode=1;});
