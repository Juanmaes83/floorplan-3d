const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{execFileSync}=require('node:child_process');
const h=require('./visual-families-harness.cjs');
const fixtures={
 stucco:require('./fixtures/visual-families-next-stucco-v1.json'),
 rough:require('./fixtures/visual-families-next-rough-v1.json')
};
const views=[
 {id:'D1',purpose:'approved mineral grain and matte response',position:[2.1,1.65,7.35],target:[2.1,1.4,5.4],fov:40},
 {id:'M1',purpose:'medium facade scale',position:[4.5,2.2,11.5],target:[1.345,1.35,5.4],fov:45},
 {id:'M2',purpose:'south-east corner and compatible plane continuity',position:[15,3.4,16],target:[7.4,1.35,9.9],fov:45},
 {id:'M3',purpose:'opposite oblique, west planes and repetition',position:[-6,3.4,15],target:[2,1.35,8.8],fov:45},
 {id:'F1',purpose:'complete original compatible facade',position:[1.345,1.6,13.2],target:[1.345,1.4,5.4],fov:45},
 {id:'G1',purpose:'whole dwelling and multi-wall coverage'}
];
async function setup(page,fixture){
 const project=await page.evaluate(assignments=>{let p=JSON.parse(JSON.stringify(FloorPlanApp.project));for(const a of assignments){const id=a.kind==='floor'?p.rooms[a.targetIndex].id:p.walls[a.targetIndex].id;p=FloorPlanSurfaces.apply(p,FloorPlanSurfaces.get(a.surfaceId),{kind:a.kind,id});}return p;},fixture.assignments);
 assert.equal(h.hash(JSON.stringify(project)),fixture.projectSha256);await page.evaluate(p=>FloorPlanApp.importProject(p),project);
}
async function webp(page,file){const data=await page.evaluate(()=>document.querySelector('#view3d canvas').toDataURL('image/webp',.92));const bytes=Buffer.from(data.split(',')[1],'base64');await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,bytes);return {sha256:h.hash(bytes),bytes:bytes.length};}
async function captureFixture(root,out,key,viewport={width:1440,height:900}){
 const fixture=fixtures[key],r=await h.start(root,viewport);try{
  await setup(r.page,fixture);await h.present(r.page);
  const original=await r.page.evaluate(()=>({project:JSON.stringify(FloorPlanApp.project),geometry:JSON.stringify(View3D.renderedGeometry),pose:View3D.presentationPose(),light:View3D.presentationLight,sourceIds:View3D.visualFamilies.bindings.map(b=>b.id)})),captures=[],states={};
  for(const variant of ['A','B','C']){
   const f02=await r.page.evaluate(({enabled,ids})=>View3D.setVisualFamilies({enabled,projectId:View3D.source.id,sourceIds:ids,mode:'capture'}),{enabled:variant!=='A',ids:original.sourceIds});
   const f03=await r.page.evaluate(({enabled,materialId,allowExperimentalVariant,mobile})=>View3D.setFacadeFidelity({enabled,projectId:enabled?View3D.source.id:null,mode:mobile?'mobile':'capture',recipeId:'facade-material-v2',recipeVersion:2,materialId,allowExperimentalVariant}),{enabled:variant==='C',materialId:fixture.materialId,allowExperimentalVariant:fixture.allowExperimentalVariant,mobile:viewport.width<1000});
   assert.equal(f03.status,variant==='C'?'ready':'off');if(variant==='C'){assert.equal(f03.active.length,9);assert.equal(f03.meshCount,11);assert.equal(f03.resources.textures,3);assert.equal(f03.resources.materials,1);}states[variant]={f02,f03};
   const selected=viewport.width<1000?views.filter(v=>['M1','G1'].includes(v.id)):views;
   for(const view of selected){
    if(view.id==='G1')await r.page.evaluate(p=>View3D.presentationRestorePose(p),original.pose);else await h.pose(r.page,view);
    await r.page.waitForTimeout(200);const file=`${variant}-${view.id}.webp`,image=await webp(r.page,path.join(out,file));captures.push({variant,view:view.id,file,...image,pose:await r.page.evaluate(()=>View3D.presentationPose())});
   }
   const current=await r.page.evaluate(()=>({project:JSON.stringify(FloorPlanApp.project),geometry:JSON.stringify(View3D.renderedGeometry),light:View3D.presentationLight}));assert.equal(current.project,original.project);assert.equal(current.geometry,original.geometry);assert.deepEqual(current.light,original.light);
  }
  assert.deepEqual(r.errors,[]);return {browser:r.browserVersion,viewport,mobileEmulated:viewport.width<1000,physicalMobile:'NOT_TESTED',fixture:fixture.id,projectSha256:h.hash(original.project),geometrySha256:h.hash(original.geometry),light:original.light,captures,states,errors:r.errors,warnings:r.warnings};
 }finally{await r.close();}
}
test('F03 V2 multi-wall A/B/C evidence for approved stucco and experimental rough plaster',{timeout:300000},async()=>{
 const root=path.resolve(process.env.VF_APP_ROOT||path.join(__dirname,'..')),codeSha=execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),out=process.env.VF_ARTIFACTS||path.join('qa-results','facade-fidelity-v2-visual',codeSha),results={};
 for(const key of Object.keys(fixtures)){const result=await captureFixture(root,path.join(out,key),key);results[key]=result;await fs.mkdir(out,{recursive:true});await fs.writeFile(path.join(out,key,'manifest.json'),JSON.stringify({codeSha,...result},null,2)+'\n');}
 const mobile=await captureFixture(root,path.join(out,'stucco','mobile'),'stucco',{width:390,height:844});await fs.writeFile(path.join(out,'stucco','mobile','manifest.json'),JSON.stringify({codeSha,...mobile},null,2)+'\n');
 console.log(JSON.stringify({codeSha,out,stucco:{active:results.stucco.states.C.f03.active,captures:results.stucco.captures.length},rough:{active:results.rough.states.C.f03.active,captures:results.rough.captures.length},mobileCaptures:mobile.captures.length}));
});
