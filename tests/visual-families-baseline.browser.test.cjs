const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{execFileSync}=require('node:child_process');
const h=require('./visual-families-harness.cjs'),fixture=require('./fixtures/visual-families-v1.json');
const root=path.resolve(process.env.VF_APP_ROOT||path.join(__dirname,'..')),out=process.env.VF_ARTIFACTS||'qa-results/visual-families-baseline';
for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390}])test(`B2 Visual Families baseline ${viewport.width}x${viewport.height}`,{timeout:240000},async()=>{
 assert.equal(execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),fixture.baselineSha,'Baseline source SHA');
 const r=await h.start(root,viewport);try{
  const begin=Date.now(),project=await h.setup(r.page);await h.present(r.page);const loadMs=Date.now()-begin,global=await r.page.evaluate(()=>View3D.presentationPose()),scenes=[];
  for(const view of viewport.width===1440?fixture.scenes:[fixture.scenes[0]]){
   if(view.id==='G1')await r.page.evaluate(p=>View3D.presentationRestorePose(p),global);else await h.pose(r.page,view);
   const file=`${viewport.width}x${viewport.height}-${view.id}.png`;scenes.push({id:view.id,file,sha256:await h.png(r.page,path.join(out,file)),pose:await r.page.evaluate(()=>View3D.presentationPose())});
  }
  const frame=await r.page.evaluate(async()=>{const samples=[];let last;await new Promise(resolve=>{const tick=t=>{if(last!==undefined)samples.push(t-last);last=t;if(samples.length<90)requestAnimationFrame(tick);else resolve();};requestAnimationFrame(tick);});samples.sort((a,b)=>a-b);return {samples:90,metric:'requestAnimationFrame interval; not GPU timer',p50:samples[44],p95:samples[85],p99:null};});
  const state=await r.page.evaluate(()=>({budget:View3D.renderBudget,memory:View3D.rendererMemory,pending:View3D.lifecycleMetrics.pendingAssets,light:View3D.presentationLight,geometry:JSON.stringify(View3D.renderedGeometry),project:JSON.stringify(FloorPlanApp.project),device:(()=>{const gl=document.querySelector('#view3d canvas').getContext('webgl2'),ext=gl.getExtension('WEBGL_debug_renderer_info');return {userAgent:navigator.userAgent,dpr:devicePixelRatio,renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),vendor:ext?gl.getParameter(ext.UNMASKED_VENDOR_WEBGL):gl.getParameter(gl.VENDOR),documentLoadMs:performance.getEntriesByType('navigation')[0]?.loadEventEnd};})()}));
  assert.equal(state.pending,0);assert.equal(h.hash(state.project),fixture.projectSha256);assert.deepEqual(r.errors,[]);assert.deepEqual(r.warnings,[]);
  const manifest={baselineSha:fixture.baselineSha,projectSha256:h.hash(state.project),geometrySha256:h.hash(state.geometry),viewport,device:state.device,browser:r.browserVersion,sceneReadyMs:loadMs,measurementScene:scenes.at(-1).id,frame,budget:state.budget,memory:state.memory,light:state.light,scenes,errors:r.errors,warnings:r.warnings,physicalMobile:'NOT_TESTED'};
  await fs.mkdir(out,{recursive:true});await fs.writeFile(path.join(out,`${viewport.width}x${viewport.height}.json`),JSON.stringify(manifest,null,2)+'\n');
 }finally{await r.close();}
});
