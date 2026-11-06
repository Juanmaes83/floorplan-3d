const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{execFileSync}=require('node:child_process');
const h=require('./visual-families-harness.cjs');

test('F03 white stucco applies to compatible real facades without changing F02 or the project',{timeout:180000},async()=>{
 const root=path.resolve(process.env.VF_APP_ROOT||path.join(__dirname,'..')),codeSha=execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),out=process.env.VF_ARTIFACTS||path.join('qa-results','facade-fidelity-smoke',codeSha),r=await h.start(root);
 try{
  const project=await h.setup(r.page);await h.present(r.page);
  const original=await r.page.evaluate(()=>({project:JSON.stringify(FloorPlanApp.project),geometry:JSON.stringify(View3D.renderedGeometry),f02:View3D.visualFamilies,f03:View3D.facadeFidelity}));
  assert.equal(original.f03.status,'off');assert.equal(original.f03.resources.textures,0);assert(original.f03.candidates.length>0);
  const sourceIds=original.f02.bindings.map(b=>b.id),f02=await r.page.evaluate(ids=>View3D.setVisualFamilies({enabled:true,projectId:View3D.source.id,sourceIds:ids,mode:'capture'}),sourceIds);
  const on=await r.page.evaluate(()=>View3D.setFacadeFidelity({enabled:true,projectId:View3D.source.id,mode:'capture'}));
  assert.equal(on.status,'ready');assert(on.active.length>0,JSON.stringify(on.candidates));assert.equal(on.resources.textures,3);assert.equal(on.resources.materials,1);assert.equal(on.resources.pending,0);assert.equal(on.resources.geometries,on.meshCount);assert.deepEqual([...f02.active].sort(),[...sourceIds].sort());
  const off=await r.page.evaluate(()=>View3D.setFacadeFidelity({enabled:false}));
  assert.equal(off.active.length,0);assert.equal(off.resources.textures,0);assert.equal(off.resources.geometries,0);
  const after=await r.page.evaluate(()=>({project:JSON.stringify(FloorPlanApp.project),geometry:JSON.stringify(View3D.renderedGeometry),f02:View3D.visualFamilies}));
  assert.equal(after.project,original.project);assert.equal(after.geometry,original.geometry);assert.deepEqual([...after.f02.active].sort(),[...sourceIds].sort());assert.deepEqual(r.errors,[]);
  const manifest={codeSha,projectSha256:h.hash(after.project),geometrySha256:h.hash(after.geometry),browser:r.browserVersion,candidates:on.candidates,active:on.active,resources:on.resources,f02:{active:after.f02.active,resources:after.f02.resources},errors:r.errors,warnings:r.warnings};
  await fs.mkdir(out,{recursive:true});await fs.writeFile(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  console.log(JSON.stringify({out,active:on.active,meshCount:on.meshCount,resources:on.resources,candidates:on.candidates.reduce((a,c)=>(a[c.reason||'eligible']=(a[c.reason||'eligible']||0)+1,a),{}),f02:after.f02.active.length,warnings:r.warnings}));
 }finally{await r.close();}
});
