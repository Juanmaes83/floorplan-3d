const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{execFileSync}=require('node:child_process');
const h=require('./visual-families-harness.cjs'),fixture=require('./fixtures/visual-families-v1.json');
test('Hero Fidelity V2 HDR lighting comparison on the real Rubik project',{timeout:240000},async()=>{
 const root=path.resolve(process.env.VF_APP_ROOT||path.join(__dirname,'..')),codeSha=execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
 const out=process.env.VF_ARTIFACTS||path.join('qa-results','hero-fidelity-v2-lighting',codeSha),r=await h.start(root,fixture.viewport);
 try{
  const project=await h.setup(r.page);await h.present(r.page);
  await r.page.waitForFunction(()=>View3D.presentationLight.status==='hdr'&&View3D.presentationLight.environment==='hdr');
  const original=await r.page.evaluate(()=>({project:JSON.stringify(FloorPlanApp.project),geometry:JSON.stringify(View3D.renderedGeometry)}));
  const visual=await r.page.evaluate(options=>View3D.setVisualFamilies(options),{projectId:project.id,enabled:true,sourceIds:fixture.sourceIds,mode:'capture',overrides:{'frame.finish':'graphite'}}),captures=[];
  for(const view of fixture.scenes.filter(v=>['D1','M1','M2'].includes(v.id))){
   await h.pose(r.page,view);await r.page.waitForTimeout(150);
   const file=`HDR-${view.id}.png`,sha256=await h.png(r.page,path.join(out,file));
   captures.push({view:view.id,file,sha256,pose:await r.page.evaluate(()=>View3D.presentationPose())});
  }
  const state=await r.page.evaluate(()=>({project:JSON.stringify(FloorPlanApp.project),geometry:JSON.stringify(View3D.renderedGeometry),light:View3D.presentationLight,pending:View3D.lifecycleMetrics.pendingAssets,device:(()=>{const gl=document.querySelector('#view3d canvas').getContext('webgl2'),ext=gl.getExtension('WEBGL_debug_renderer_info');return {userAgent:navigator.userAgent,dpr:devicePixelRatio,renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)};})()}));
  assert.equal(state.light.bytes,1615248);assert.equal(state.light.error,'');assert.equal(state.project,original.project);assert.equal(state.geometry,original.geometry);assert.equal(state.pending,0);assert.deepEqual(r.errors,[]);assert.deepEqual(r.warnings,[]);
  const manifest={codeSha,comparison:{type:'lighting-only',baselineCodeSha:'49555e9d063cb39ee47d5a90e7e35dfd70a7eba8',baselineEnvironment:'synthetic fallback',candidateEnvironment:'hdr'},projectSha256:h.hash(state.project),geometrySha256:h.hash(state.geometry),viewport:fixture.viewport,browser:r.browserVersion,device:state.device,light:state.light,visual,captures,errors:r.errors,warnings:r.warnings};
  await fs.mkdir(out,{recursive:true});await fs.writeFile(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  console.log(JSON.stringify({codeSha,out,captures:captures.length,light:state.light}));
 }finally{await r.close();}
});
