const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{execFileSync}=require('node:child_process');
const h=require('./visual-families-harness.cjs');
const view={position:[1.345,1.6,13.2],target:[1.345,1.4,5.4],fov:45};
async function intervals(page,count=120){return page.evaluate(async count=>{const values=[];let previous=await new Promise(requestAnimationFrame);for(let i=0;i<count;i++){const now=await new Promise(requestAnimationFrame);values.push(now-previous);previous=now;}values.sort((a,b)=>a-b);return {samples:values.length,p50:values[Math.floor(values.length*.5)],p95:values[Math.floor(values.length*.95)],max:values.at(-1),kind:'requestAnimationFrame interval; not GPU execution time'};},count);}
async function measure(root,viewport){
 const r=await h.start(root,viewport);try{
  const project=await h.setup(r.page);await h.present(r.page);const ids=await r.page.evaluate(()=>View3D.visualFamilies.bindings.map(b=>b.id));await r.page.evaluate(ids=>View3D.setVisualFamilies({enabled:true,projectId:View3D.source.id,sourceIds:ids,mode:'capture'}),ids);await h.pose(r.page,view);
  const result={viewport,browser:r.browserVersion,mobileEmulated:viewport.width<1000,physicalMobile:'NOT_TESTED'};
  for(const variant of ['B','C']){
   const f03=await r.page.evaluate(enabled=>View3D.setFacadeFidelity({enabled,projectId:enabled?View3D.source.id:null,mode:innerWidth<1000?'mobile':'capture'}),variant==='C');await h.pose(r.page,view);await r.page.waitForTimeout(250);
   const observed=await r.page.evaluate(()=>({render:View3D.renderBudget,memory:View3D.rendererMemory,light:View3D.presentationLight,transfer:performance.getEntriesByType('resource').filter(e=>e.name.includes('/assets/materials/f03/')).reduce((n,e)=>n+(e.encodedBodySize||0),0),device:(()=>{const gl=document.querySelector('#view3d canvas').getContext('webgl2'),ext=gl.getExtension('WEBGL_debug_renderer_info');return {userAgent:navigator.userAgent,renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)};})()}));
   result[variant]={f03,frameIntervals:await intervals(r.page),...observed};
  }
  assert.deepEqual(result.B.light,result.C.light);assert.deepEqual(r.errors,[]);return result;
 }finally{await r.close();}
}
test('F03 equivalent baseline/candidate transfer, render and RAF costs',{timeout:240000},async()=>{
 const root=path.resolve(process.env.VF_APP_ROOT||path.join(__dirname,'..')),codeSha=execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),out=process.env.VF_ARTIFACTS||path.join('qa-results','facade-fidelity-performance',codeSha),desktop=await measure(root,{width:1440,height:900}),mobile=await measure(root,{width:390,height:844}),manifest={codeSha,desktop,mobile,notes:['B=F02 ON/F03 OFF; C=F02 ON/F03 ON','RAF intervals are not GPU execution duration','GPU bytes are manifest estimates, not driver measurements','Mobile is Chromium emulation, not physical hardware']};await fs.mkdir(out,{recursive:true});await fs.writeFile(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify({out,desktop:{B:desktop.B.frameIntervals,C:desktop.C.frameIntervals,renderB:desktop.B.render,renderC:desktop.C.render,bytes:desktop.C.f03.resources.bytes,loadMs:desktop.C.f03.loadMs},mobile:{B:mobile.B.frameIntervals,C:mobile.C.frameIntervals,renderB:mobile.B.render,renderC:mobile.C.render,bytes:mobile.C.f03.resources.bytes,loadMs:mobile.C.f03.loadMs}}));
});
