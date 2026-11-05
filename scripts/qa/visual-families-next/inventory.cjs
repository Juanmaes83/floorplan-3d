const fs=require('node:fs/promises'),path=require('node:path');
const h=require('../../../tests/visual-families-harness.cjs');
const fixtures={
 canonical:require('../../../tests/fixtures/vq01-material-ab-v2.json'),
 stucco:require('../../../tests/fixtures/visual-families-next-stucco-v1.json'),
 rough:require('../../../tests/fixtures/visual-families-next-rough-v1.json')
};
async function build(page,fixture){
 const project=await page.evaluate(assignments=>{let p=JSON.parse(JSON.stringify(FloorPlanApp.project));for(const a of assignments){const id=a.kind==='floor'?p.rooms[a.targetIndex].id:p.walls[a.targetIndex].id;p=FloorPlanSurfaces.apply(p,FloorPlanSurfaces.get(a.surfaceId),{kind:a.kind,id});}return p;},fixture.assignments);
 const projectSha256=h.hash(JSON.stringify(project));
 if(fixture.projectSha256&&fixture.projectSha256!==projectSha256)throw Error(`Project fixture drift: ${fixture.id||'canonical'}`);
 await page.evaluate(p=>FloorPlanApp.importProject(p),project);
 return {project,projectSha256};
}
async function inventory(root,key,out){
 const fixture=fixtures[key];if(!fixture)throw Error('Unknown inventory fixture: '+key);
 const r=await h.start(root);try{
  const {project,projectSha256}=await build(r.page,fixture);await h.present(r.page);
  const sourceIds=await r.page.evaluate(()=>View3D.visualFamilies.bindings.map(b=>b.id));
  await r.page.evaluate(ids=>View3D.setVisualFamilies({enabled:true,projectId:View3D.source.id,sourceIds:ids,mode:'capture'}),sourceIds);
  const f03=await r.page.evaluate(({materialId,allowExperimentalVariant})=>View3D.setFacadeFidelity({enabled:true,projectId:View3D.source.id,mode:'capture',materialId,allowExperimentalVariant:!!allowExperimentalVariant}),fixture);
  const data=await r.page.evaluate(()=>{const p=FloorPlanApp.project,e=FloorPlanExterior.derive(p),f02=new Set(View3D.visualFamilies.active),candidates=new Map(View3D.facadeFidelity.candidates.map(c=>[c.wallId,c]));return {projectId:p.id,exteriorStatus:e.status,exteriorRooms:e.exteriorRooms,walls:e.walls.map(c=>{const w=p.walls.find(x=>x.id===c.wallId),m=p.materials.find(x=>x.id===w.surfaceMaterialId),lengthMm=Math.hypot(w.end.x-w.start.x,w.end.y-w.start.y),openings=p.openings.filter(o=>o.wallId===w.id);return {wallId:w.id,exteriorStatus:c.status,exteriorReason:c.reason,surfaceMaterialId:w.surfaceMaterialId||null,preset:m?.appearance?.preset||null,category:m?.category||null,lengthMm,heightMm:w.heightMm,grossAreaM2:lengthMm*w.heightMm/1e6,start:w.start,end:w.end,structure:w.structure||null,openings:openings.map(o=>({id:o.id,kind:o.kind,f02Active:f02.has(o.id)})),f03:candidates.get(w.id)||null};})};});
  const result={schema:'visual-families-next/wall-inventory@1',fixture:fixture.id||'vq01-material-ab-v2',fixturePath:fixture.id?`tests/fixtures/${fixture.id}.json`:'tests/fixtures/vq01-material-ab-v2.json',projectSha256,geometrySha256:h.hash(await r.page.evaluate(()=>JSON.stringify(View3D.renderedGeometry))),f03:{materialId:f03.decision.materialId,status:f03.status,active:f03.active,resources:f03.resources},summary:{walls:data.walls.length,facades:data.walls.filter(w=>w.exteriorStatus==='facade').length,interiors:data.walls.filter(w=>w.exteriorStatus==='interior').length,unavailable:data.walls.filter(w=>w.exteriorStatus==='unavailable').length,assignedFacades:data.walls.filter(w=>w.exteriorStatus==='facade'&&w.surfaceMaterialId).length,f03Eligible:data.walls.filter(w=>w.f03?.eligible).length,f02ActiveOpenings:data.walls.reduce((n,w)=>n+w.openings.filter(o=>o.f02Active).length,0)},...data};
  await fs.mkdir(out,{recursive:true});await fs.writeFile(path.join(out,`${key}-inventory.json`),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({key,out,projectSha256,summary:result.summary,f03:result.f03,errors:r.errors,warnings:r.warnings}));
  if(r.errors.length)throw Error('Browser errors: '+r.errors.join('; '));
 }finally{await r.close();}
}
(async()=>{const root=path.resolve(process.env.VF_APP_ROOT||path.join(__dirname,'../../..')),out=path.resolve(process.env.VF_ARTIFACTS||path.join(root,'docs/qa/visual-families-next-v1/inventory'));for(const key of process.argv.slice(2).length?process.argv.slice(2):Object.keys(fixtures))await inventory(root,key,out);})().catch(error=>{console.error(error);process.exitCode=1;});
