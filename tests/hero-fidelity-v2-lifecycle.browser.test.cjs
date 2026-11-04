const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{execFileSync}=require('node:child_process');
const h=require('./visual-families-harness.cjs'),fixture=require('./fixtures/visual-families-v1.json');
async function intervals(page,count=60){return page.evaluate(async count=>{const values=[];let previous=await new Promise(requestAnimationFrame);for(let i=0;i<count;i++){const now=await new Promise(requestAnimationFrame);values.push(now-previous);previous=now;}values.sort((a,b)=>a-b);return {samples:values.length,p50:values[Math.floor(values.length*.5)],p95:values[Math.floor(values.length*.95)],max:values.at(-1),kind:'requestAnimationFrame interval; not GPU work duration'};},count);}
test('Hero V2 emulated-mobile quality, presentation reentry and forced context loss',{timeout:240000},async()=>{
 const root=path.resolve(process.env.VF_APP_ROOT||path.join(__dirname,'..')),codeSha=execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),viewport={width:390,height:844};
 const out=process.env.VF_ARTIFACTS||path.join('qa-results','hero-fidelity-v2-lifecycle',codeSha),r=await h.start(root,viewport,{hdr:false});
 try{
  const project=await h.setup(r.page);await h.present(r.page);
  const original=await r.page.evaluate(()=>({project:JSON.stringify(FloorPlanApp.project),geometry:JSON.stringify(View3D.renderedGeometry),pose:View3D.presentationPose(),bindings:View3D.visualFamilies.bindings})),allIds=original.bindings.map(b=>b.id);
  const set=options=>r.page.evaluate(options=>View3D.setVisualFamilies(options),{projectId:project.id,sourceIds:allIds,...options});
  const detail=await set({enabled:true,mode:'capture'}),mobile=await set({enabled:true,mode:'mobile'});
  assert.equal(mobile.decision.profile,'balanced');assert.equal(mobile.active.length,allIds.length);assert(mobile.resources.triangles<detail.resources.triangles);
  const captures=[];
  for(const view of fixture.scenes.filter(v=>['M1','G1'].includes(v.id))){
   if(view.id==='G1')await r.page.evaluate(p=>View3D.presentationRestorePose(p),original.pose);else await h.pose(r.page,view);
   await r.page.waitForTimeout(150);const file=`MOBILE-${view.id}.png`,sha256=await h.png(r.page,path.join(out,file));captures.push({view:view.id,file,sha256,pose:await r.page.evaluate(()=>View3D.presentationPose())});
  }
  await h.pose(r.page,fixture.scenes.find(v=>v.id==='M1'));const performance={V2:await intervals(r.page)};await set({enabled:false});performance.OFF=await intervals(r.page);
  await set({enabled:true,mode:'mobile'});await r.page.locator('#presentationClose').click();await r.page.waitForFunction(()=>!FloorPlanPresentation.active&&!document.body.classList.contains('presentation-exiting'),null,{timeout:60000});
  const exited=await r.page.evaluate(()=>({visual:View3D.visualFamilies,project:JSON.stringify(FloorPlanApp.project)}));assert.equal(exited.visual.active.length,0);assert.equal(exited.visual.resources.meshes,0);assert.equal(exited.visual.resources.textures,0);assert.equal(exited.project,original.project);
  await h.present(r.page);const reentered=await r.page.evaluate(()=>View3D.visualFamilies);assert.equal(reentered.active.length,allIds.length);assert.equal(reentered.decision.profile,'balanced');
  await r.page.evaluate(()=>{window.__heroContextLost=0;addEventListener('floorplan-3d-context-lost',()=>window.__heroContextLost++);document.querySelector('#view3d canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext();});
  await r.page.waitForFunction(()=>!View3D.contextAvailable&&!FloorPlanPresentation.active&&window.__heroContextLost===1);
  const lost=await r.page.evaluate(()=>({visual:View3D.visualFamilies,project:JSON.stringify(FloorPlanApp.project),geometry:JSON.stringify(View3D.renderedGeometry),contextAvailable:View3D.contextAvailable,presentationActive:FloorPlanPresentation.active,events:window.__heroContextLost}));
  assert.equal(lost.visual.active.length,0);assert.equal(lost.visual.resources.meshes,0);assert.equal(lost.visual.resources.textures,0);assert.equal(lost.project,original.project);assert.equal(lost.geometry,original.geometry);assert.deepEqual(r.errors,[]);
  const manifest={codeSha,projectSha256:h.hash(original.project),geometrySha256:h.hash(original.geometry),viewport,browser:r.browserVersion,emulatedMobile:true,physicalMobile:'NOT_TESTED',light:await r.page.evaluate(()=>View3D.presentationLight),profiles:{capture:detail.resources,mobile:mobile.resources},performance,captures,lifecycle:{exited,reentered,lost},errors:r.errors,warnings:r.warnings};
  await fs.mkdir(out,{recursive:true});await fs.writeFile(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  console.log(JSON.stringify({codeSha,out,profiles:manifest.profiles,performance,captures:captures.length,lifecycle:{exitResources:exited.visual.resources,reentryActive:reentered.active.length,contextLostEvents:lost.events},warnings:r.warnings}));
 }finally{await r.close();}
});
