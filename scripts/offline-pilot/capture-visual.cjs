'use strict';
// Offline pilot, optional visual sidecar: the browser's procedural furniture for each project object, exported as GLB
// with one root node per object ID, in the same metric frame as scripts/interop/export.cjs.
// OP-10 C1: rebuilt on the single «Scene for Blender» chain (View3D.captureScene → js/scene-capture-core.js#toGLTF, same GLB
// container as scripts/interop/glb.cjs#pack). No CDN, no GLTFExporter, no removed FloorPlanApp.importProject: the project is
// loaded through the real file input. It is a declared visual representation, not part of the canonical package contract.
// Usage: node capture-visual.cjs project.json NEW-folder   (env CHROME optional)
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const E=require('../interop/export.cjs'),GLB=require('../interop/glb.cjs'),Capture=require('../interop/scene-capture.cjs'),Scene=require('../../js/scene-capture-core.js'),Core=require('../../js/project-core.js');
const root=path.resolve(__dirname,'../..'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');

async function capture(project,dest){
 if(fs.existsSync(dest))throw Error('Refusing overwrite: '+dest);
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'pilot-visual-')),src=path.join(tmp,'project.json'),cap=path.join(tmp,'capture');
 fs.writeFileSync(src,JSON.stringify(project));
 await Capture.capture(src,cap,{via:'api'});
 const doc=JSON.parse(fs.readFileSync(path.join(cap,'scene.json'),'utf8')),manifest=JSON.parse(fs.readFileSync(path.join(cap,'manifest.json'),'utf8'));
 const catalog=new Set(manifest.fallbacks.catalogModels),c=Core.geometry(project).center;
 // Procedural furniture only: authorized catalog models are already in the canonical package (as before).
 const meshes=doc.meshes.filter(m=>m.entity.role==='object'&&!catalog.has(m.entity.id));
 const origins=new Map(project.objects.map(o=>['object:'+o.id,[(o.position.x-c.x)/1000,(o.elevationMm||0)/1000,(o.position.y-c.y)/1000]]));
 const {gltf,bin}=Scene.toGLTF({...doc,meshes,view:null},{origins,sceneRoot:false}),glb=GLB.pack(gltf,Buffer.from(bin));GLB.parse(glb);
 const ids=[...new Set(meshes.map(m=>m.entity.id))].sort(),rows=ids.map(id=>{const ms=meshes.filter(m=>m.entity.id===id),min=[0,1,2].map(a=>Math.min(...ms.map(m=>m.bounds.min[a]))),max=[0,1,2].map(a=>Math.max(...ms.map(m=>m.bounds.max[a])));
  return {id,position:origins.get('object:'+id)||null,boundsMin:min,boundsMax:max,triangles:ms.reduce((n,m)=>n+m.faces.length,0)};});
 const source=Buffer.from(E.canonical(project)+'\n');let revision=null;try{revision=execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim();}catch{}
 fs.mkdirSync(dest,{recursive:true});fs.writeFileSync(path.join(dest,'visual-furniture.glb'),glb,{flag:'wx'});
 const out={format:'floorplan-offline-pilot-visual-furniture',version:'0.2.0',status:'declared visual representation, not canonical geometry',projectId:project.id,projectSha256:sha(source),appRevision:revision,indexHtmlSha256:sha(fs.readFileSync(path.join(root,'index.html'))),
  chain:'View3D.captureScene → RubikSceneCapture.toGLTF (scene-capture-core '+Scene.VERSION+') → glb.cjs#pack',frame:'three scene metres: x=(planX-center.x)/1000, y up, z=(planY-center.y)/1000; same as export.cjs glTF nodes',
  glb:{bytes:glb.length,sha256:sha(glb)},objectIds:ids,objects:rows,excluded:'authorized catalog assets (already in the canonical package); lines are never captured',scenePackage:{glbSha256:manifest.files['scene.glb'].sha256}};
 fs.writeFileSync(path.join(dest,'visual-manifest.json'),JSON.stringify(out,null,1)+'\n',{flag:'wx'});fs.rmSync(tmp,{recursive:true,force:true});return out;
}
module.exports={capture};
if(require.main===module){const [src,dest]=process.argv.slice(2);if(!src||!dest){console.error('Usage: node capture-visual.cjs project.json NEW-folder');process.exit(1);}
 capture(JSON.parse(fs.readFileSync(src,'utf8')),dest).then(m=>console.log(JSON.stringify({objects:m.objectIds.length,glb:m.glb,appRevision:m.appRevision}))).catch(e=>{console.error(e.message);process.exitCode=1;});}
