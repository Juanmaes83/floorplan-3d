'use strict';
// Offline pilot, optional visual sidecar: the browser's procedural furniture for each project object, exported
// as GLB with one root node per object ID, in the same metric frame as scripts/interop/export.cjs.
// It is a declared visual representation of this app revision, not part of the canonical package contract.
// Usage: node capture-visual.cjs project.json NEW-folder   (env CHROME, THREE_DIR = local three@0.160.0 package)
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {chromium}=require('playwright'),E=require('../interop/export.cjs');
const root=path.resolve(__dirname,'../..'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.glb':'model/gltf-binary','.txt':'text/plain','.svg':'image/svg+xml','.wasm':'application/wasm'};

async function capture(project,dest,{chrome=process.env.CHROME,threeDir=process.env.THREE_DIR}={}){
 if(fs.existsSync(dest))throw Error('Refusing overwrite: '+dest);
 const server=http.createServer((req,res)=>{try{const p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://l').pathname.replace(/^\/$/,'/index.html')));if(!p.startsWith(root+path.sep))throw Error();res.setHeader('Content-Type',types[path.extname(p)]||'application/octet-stream');res.end(fs.readFileSync(p));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({...(chrome?{executablePath:chrome}:{}),args:['--no-sandbox','--enable-unsafe-swiftshader']});
 try{const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  if(threeDir)await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**',async r=>{const rel=new URL(r.request().url()).pathname.replace('/npm/three@0.160.0/','');await r.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:fs.readFileSync(path.join(threeDir,rel))});});
  await page.addInitScript(()=>{window.__THREE_DEVTOOLS__=new EventTarget();window.__pilotScenes=[];__THREE_DEVTOOLS__.addEventListener('observe',e=>{if(e.detail?.isScene)window.__pilotScenes.push(e.detail);});});
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.waitForFunction(()=>window.FloorPlanApp&&window.View3D,null,{timeout:90000});
  await page.evaluate(async p=>{document.querySelector('#welcomeDialog')?.close?.();FloorPlanApp.importProject(p);await setView('3d');},project);
  // Wait until every object has a furniture group at full growth.
  const ids=project.objects.map(o=>o.id).sort();
  await page.waitForFunction(ids=>{const g=[];for(const s of window.__pilotScenes)s.traverse(o=>{if(o.userData?.fid)g.push(o);});const got=[...new Set(g.map(o=>o.userData.fid))].sort();return JSON.stringify(got)===JSON.stringify(ids)&&g.every(o=>o.parent.scale.y===1);},ids,{timeout:90000});
  const result=await page.evaluate(async()=>{const {GLTFExporter}=await import('three/addons/exporters/GLTFExporter.js'),THREE=await import('three'),groups=[];for(const s of window.__pilotScenes)s.traverse(o=>{if(o.userData?.fid&&!o.userData.authorizedAsset)groups.push(o);});
   const roots=groups.map(g=>{const c=g.clone(true);c.name=g.userData.fid;c.traverse(o=>{if(o.isLine||o.isLineSegments)o.visible=false;});c.updateMatrixWorld(true);return c;}),rows=roots.map(c=>{const b=new THREE.Box3().setFromObject(c);let tris=0;c.traverse(o=>{if(o.isMesh&&o.visible){const gm=o.geometry;tris+=(gm.index?gm.index.count:gm.attributes.position.count)/3;}});return {id:c.name,position:c.position.toArray(),rotationY:c.rotation.y,boundsMin:b.min.toArray(),boundsMax:b.max.toArray(),triangles:tris};});
   const glb=await new GLTFExporter().parseAsync(roots,{binary:true,onlyVisible:true});return {glb:Array.from(new Uint8Array(glb)),rows};});
  if(errors.length)throw Error('Page errors: '+errors.join(' | '));
  const glb=Buffer.from(result.glb),source=Buffer.from(E.canonical(project)+'\n');let revision=null;try{revision=execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim();}catch{}
  fs.mkdirSync(dest,{recursive:true});fs.writeFileSync(path.join(dest,'visual-furniture.glb'),glb,{flag:'wx'});
  const manifest={format:'floorplan-offline-pilot-visual-furniture',version:'0.1.0',status:'declared visual representation, not canonical geometry',projectId:project.id,projectSha256:sha(source),appRevision:revision,indexHtmlSha256:sha(fs.readFileSync(path.join(root,'index.html'))),three:'0.160.0 GLTFExporter',frame:'three scene metres: x=(planX-center.x)/1000, y up, z=(planY-center.y)/1000; same as export.cjs glTF nodes',glb:{bytes:glb.length,sha256:sha(glb)},objectIds:result.rows.map(r=>r.id),objects:result.rows,excluded:'authorized catalog assets (already in the canonical package) and edge/skirting lines'};
  fs.writeFileSync(path.join(dest,'visual-manifest.json'),JSON.stringify(manifest,null,1)+'\n',{flag:'wx'});return manifest;
 }finally{await browser.close();server.close();}
}
module.exports={capture};
if(require.main===module){const [src,dest]=process.argv.slice(2);if(!src||!dest){console.error('Usage: node capture-visual.cjs project.json NEW-folder');process.exit(1);}
 capture(JSON.parse(fs.readFileSync(src,'utf8')),dest).then(m=>console.log(JSON.stringify({objects:m.objectIds.length,glb:m.glb,appRevision:m.appRevision}))).catch(e=>{console.error(e.message);process.exitCode=1;});}
