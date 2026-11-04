const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{execFileSync}=require('node:child_process');
const h=require('./visual-families-harness.cjs'),fixture=require('./fixtures/visual-families-v1.json');
async function frameIntervals(page,count=90){return page.evaluate(async count=>{const deltas=[];let previous=await new Promise(requestAnimationFrame);for(let i=0;i<count;i++){const now=await new Promise(requestAnimationFrame);deltas.push(now-previous);previous=now;}const sorted=[...deltas].sort((a,b)=>a-b);return {samples:deltas.length,p50:sorted[Math.floor(sorted.length*.5)],p95:sorted[Math.floor(sorted.length*.95)],max:sorted.at(-1),kind:'requestAnimationFrame interval; not GPU work duration'};},count);}
test('Hero Fidelity V2 all compatible real windows, cleanup and frame intervals',{timeout:240000},async()=>{
 const root=path.resolve(process.env.VF_APP_ROOT||path.join(__dirname,'..')),codeSha=execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
 const out=process.env.VF_ARTIFACTS||path.join('qa-results','hero-fidelity-v2-coverage',codeSha),r=await h.start(root,fixture.viewport,{hdr:false});
 try{
  const project=await h.setup(r.page);await h.present(r.page);
  const original=await r.page.evaluate(()=>({project:JSON.stringify(FloorPlanApp.project),geometry:JSON.stringify(View3D.renderedGeometry),pose:View3D.presentationPose(),bindings:View3D.visualFamilies.bindings}));
  const allIds=original.bindings.map(b=>b.id),captures=[],performance={};
  for(const variant of ['OFF','V2']){
   const visual=await r.page.evaluate(options=>View3D.setVisualFamilies(options),{projectId:project.id,enabled:variant==='V2',sourceIds:allIds,mode:'capture',overrides:{'frame.finish':'graphite'}});
   if(variant==='V2'){
    assert.deepEqual([...visual.active].sort(),[...allIds].sort());assert.equal(visual.resources.geometries,1);assert.equal(visual.resources.textures,3);assert(visual.resources.facadeMeshes>=allIds.length);assert(visual.resources.triangles<160000);assert(visual.resources.gpuBytes<1600000);
   }else assert.equal(visual.active.length,0);
   for(const view of fixture.scenes.filter(v=>['M1','M3','G1'].includes(v.id))){
    if(view.id==='G1')await r.page.evaluate(p=>View3D.presentationRestorePose(p),original.pose);else await h.pose(r.page,view);
    await r.page.waitForTimeout(150);const file=`${variant}-${view.id}.png`,sha256=await h.png(r.page,path.join(out,file));
    captures.push({variant,view:view.id,file,sha256,pose:await r.page.evaluate(()=>View3D.presentationPose())});
   }
   await h.pose(r.page,fixture.scenes.find(v=>v.id==='M1'));performance[variant]={frameIntervals:await frameIntervals(r.page),memory:await r.page.evaluate(()=>View3D.rendererMemory)};
  }
  const cycles=[];for(let i=0;i<3;i++){
   const on=await r.page.evaluate(options=>View3D.setVisualFamilies(options),{projectId:project.id,enabled:true,sourceIds:allIds,mode:'capture'});assert.equal(on.active.length,allIds.length);
   const off=await r.page.evaluate(options=>View3D.setVisualFamilies(options),{projectId:project.id,enabled:false,sourceIds:allIds});assert.equal(off.active.length,0);assert.equal(off.resources.geometries,0);assert.equal(off.resources.materials,0);assert.equal(off.resources.textures,0);assert.equal(off.resources.meshes,0);cycles.push({cycle:i+1,onResources:on.resources,offResources:off.resources});
  }
  const state=await r.page.evaluate(()=>({visual:View3D.visualFamilies,project:JSON.stringify(FloorPlanApp.project),geometry:JSON.stringify(View3D.renderedGeometry),light:View3D.presentationLight,pending:View3D.lifecycleMetrics.pendingAssets,device:(()=>{const gl=document.querySelector('#view3d canvas').getContext('webgl2'),ext=gl.getExtension('WEBGL_debug_renderer_info');return {userAgent:navigator.userAgent,dpr:devicePixelRatio,renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)};})()}));
  assert.equal(state.project,original.project);assert.equal(state.geometry,original.geometry);assert.equal(state.pending,0);assert.equal(state.light.environment,'synthetic');assert.deepEqual(r.errors,[]);assert.deepEqual(r.warnings,[]);
  const coverage={existing:original.bindings.length,compatible:allIds.length,treated:allIds.length,excluded:[],ids:allIds};
  const manifest={codeSha,projectSha256:h.hash(state.project),geometrySha256:h.hash(state.geometry),viewport:fixture.viewport,browser:r.browserVersion,device:state.device,light:state.light,coverage,performance,cycles,captures,errors:r.errors,warnings:r.warnings,physicalMobile:'NOT_TESTED'};
  await fs.mkdir(out,{recursive:true});await fs.writeFile(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  console.log(JSON.stringify({codeSha,out,coverage,performance,captures:captures.length}));
 }finally{await r.close();}
});
