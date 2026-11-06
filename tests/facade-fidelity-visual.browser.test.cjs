const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{execFileSync}=require('node:child_process');
const h=require('./visual-families-harness.cjs'),fixture=require('./fixtures/visual-families-v1.json');
const facadeViews=[
 {id:'D1',purpose:'white stucco grain and matte response',position:[2.1,1.65,7.35],target:[2.1,1.4,5.4],fov:40},
 {id:'M1',purpose:'medium facade scale',position:[4.5,2.2,11.5],target:[1.345,1.35,5.4],fov:45},
 {id:'M2',purpose:'oblique facade and plane continuity',position:[8,2.4,11],target:[1.345,1.35,5.4],fov:45},
 {id:'M3',purpose:'opposite oblique and repetition check',position:[-5.2,2.4,11],target:[1.345,1.35,5.4],fov:45},
 {id:'F1',purpose:'complete compatible facade',position:[1.345,1.6,13.2],target:[1.345,1.4,5.4],fov:45},
 {id:'G1',purpose:'existing dwelling overview control'},
 {...fixture.scenes.find(v=>v.id==='M1'),id:'F02-M1',purpose:'protected window reveals control'}
];
async function captureRun(root,out,viewport,mobile){
 const r=await h.start(root,viewport);try{
  const project=await h.setup(r.page);await h.present(r.page);
  const original=await r.page.evaluate(()=>({project:JSON.stringify(FloorPlanApp.project),geometry:JSON.stringify(View3D.renderedGeometry),pose:View3D.presentationPose(),light:View3D.presentationLight,bindings:View3D.visualFamilies.bindings})),sourceIds=original.bindings.map(b=>b.id),captures=[],states={};
  for(const variant of ['A','B','C']){
   const f02=await r.page.evaluate(({enabled,ids})=>View3D.setVisualFamilies({enabled,projectId:View3D.source.id,sourceIds:ids,mode:'capture'}),{enabled:variant!=='A',ids:sourceIds});
   const f03=await r.page.evaluate(enabled=>View3D.setFacadeFidelity({enabled,projectId:enabled?View3D.source.id:null,mode:innerWidth<1000?'mobile':'capture'}),variant==='C');
   assert.equal(f03.status,variant==='C'?'ready':'off');if(variant==='C')assert(f03.active.length>0);states[variant]={f02,f03};
   const views=mobile?facadeViews.filter(v=>['M1','F1'].includes(v.id)):facadeViews;
   for(const view of views){
    if(view.id==='G1')await r.page.evaluate(p=>View3D.presentationRestorePose(p),original.pose);else await h.pose(r.page,view);
    await r.page.waitForTimeout(200);const file=`${variant}-${view.id}.png`,sha256=await h.png(r.page,path.join(out,file));
    captures.push({variant,view:view.id,file,sha256,pose:await r.page.evaluate(()=>View3D.presentationPose())});
   }
   const current=await r.page.evaluate(()=>({project:JSON.stringify(FloorPlanApp.project),geometry:JSON.stringify(View3D.renderedGeometry),light:View3D.presentationLight}));
   assert.equal(current.project,original.project);assert.equal(current.geometry,original.geometry);assert.deepEqual(current.light,original.light);
  }
  assert.deepEqual(r.errors,[]);return {run:r,result:{browser:r.browserVersion,viewport,mobileEmulated:mobile,physicalMobile:'NOT_TESTED',projectSha256:h.hash(original.project),geometrySha256:h.hash(original.geometry),light:original.light,captures,states,errors:r.errors,warnings:r.warnings}};
 }catch(error){await r.close();throw error;}
}
test('F03 fixed-camera A/B/C visual evidence on desktop and emulated mobile',{timeout:300000},async()=>{
 const root=path.resolve(process.env.VF_APP_ROOT||path.join(__dirname,'..')),codeSha=execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),out=process.env.VF_ARTIFACTS||path.join('qa-results','facade-fidelity-visual',codeSha),desktop=await captureRun(root,out,fixture.viewport,false);
 try{
  await fs.mkdir(out,{recursive:true});await fs.writeFile(path.join(out,'desktop-manifest.json'),JSON.stringify({codeSha,...desktop.result},null,2)+'\n');
  const mobileOut=path.join(out,'mobile'),mobile=await captureRun(root,mobileOut,{width:390,height:844},true);
  try{await fs.writeFile(path.join(out,'mobile-manifest.json'),JSON.stringify({codeSha,...mobile.result},null,2)+'\n');}finally{await mobile.run.close();}
  console.log(JSON.stringify({codeSha,out,desktopCaptures:desktop.result.captures.length,mobileCaptures:mobile.result.captures.length,active:desktop.result.states.C.f03.active,resources:desktop.result.states.C.f03.resources,f02:desktop.result.states.C.f02.active.length,warnings:[...desktop.run.warnings,...mobile.run.warnings]}));
 }finally{await desktop.run.close();}
});
