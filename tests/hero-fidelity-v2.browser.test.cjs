const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{execFileSync}=require('node:child_process');
const h=require('./visual-families-harness.cjs'),fixture=require('./fixtures/visual-families-v1.json');
test('Hero Fidelity V2 fixed-view OFF/candidate evidence on the real Rubik project',{timeout:240000},async()=>{
 const root=path.resolve(process.env.VF_APP_ROOT||path.join(__dirname,'..')),codeSha=execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
 const out=process.env.VF_ARTIFACTS||path.join('qa-results','hero-fidelity-v2',codeSha),r=await h.start(root,fixture.viewport);
 try{
  const project=await h.setup(r.page);await h.present(r.page);
  const original=await r.page.evaluate(()=>({project:JSON.stringify(FloorPlanApp.project),geometry:JSON.stringify(View3D.renderedGeometry),pose:View3D.presentationPose()}));
  const captures=[];
  for(const variant of ['OFF','V2']){
   const visual=await r.page.evaluate(options=>View3D.setVisualFamilies(options),{projectId:project.id,enabled:variant==='V2',sourceIds:fixture.sourceIds,mode:'capture',overrides:{'frame.finish':'graphite'}});
   for(const view of fixture.scenes){
    if(view.id==='G1')await r.page.evaluate(p=>View3D.presentationRestorePose(p),original.pose);else await h.pose(r.page,view);
    await r.page.waitForTimeout(150);
    const file=`${variant}-${view.id}.png`,sha256=await h.png(r.page,path.join(out,file));
    captures.push({variant,view:view.id,file,sha256,pose:await r.page.evaluate(()=>View3D.presentationPose())});
   }
   if(variant==='V2'){
    assert.deepEqual([...visual.active].sort(),[...fixture.sourceIds].sort());assert.equal(visual.resources.textures,3);assert(visual.resources.facadeMeshes>0);
   }else assert.equal(visual.active.length,0);
  }
  const state=await r.page.evaluate(()=>({visual:View3D.visualFamilies,project:JSON.stringify(FloorPlanApp.project),geometry:JSON.stringify(View3D.renderedGeometry),light:View3D.presentationLight,memory:View3D.rendererMemory,pending:View3D.lifecycleMetrics.pendingAssets,device:(()=>{const gl=document.querySelector('#view3d canvas').getContext('webgl2'),ext=gl.getExtension('WEBGL_debug_renderer_info');return {userAgent:navigator.userAgent,dpr:devicePixelRatio,renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)};})()}));
  assert.equal(state.project,original.project);assert.equal(state.geometry,original.geometry);assert.equal(state.pending,0);assert.deepEqual(r.errors,[]);assert.deepEqual(r.warnings,[]);
  const manifest={codeSha,projectSha256:h.hash(state.project),geometrySha256:h.hash(state.geometry),viewport:fixture.viewport,browser:r.browserVersion,device:state.device,light:state.light,visual:state.visual,memory:state.memory,captures,errors:r.errors,warnings:r.warnings,physicalMobile:'NOT_TESTED'};
  await fs.mkdir(out,{recursive:true});await fs.writeFile(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  console.log(JSON.stringify({codeSha,out,captures:captures.length,visual:state.visual,light:state.light}));
 }finally{await r.close();}
});
