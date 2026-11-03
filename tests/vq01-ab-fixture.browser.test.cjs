const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto'),{createServer}=require('node:http');
const {execFile}=require('node:child_process'),{promisify}=require('node:util'),run=promisify(execFile),{chromium}=require('playwright');
const fixture=require('./fixtures/vq01-material-ab-fixture.json');
let server,url,browser;const cache=new Map(),QA=process.env.VQ01_ARTIFACTS||'qa-results/vq01-cp1-a';

const hash=value=>crypto.createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex');
const stableMetric=m=>({
 id:m.id,state:m.state,detailState:m.detailState,bytes:m.bytes||0,gpuBytes:m.gpuBytes||0,
 map:m.map?{repeat:m.map.repeat,colorSpace:m.map.colorSpace}:null,
 normalMap:m.normalMap?{repeat:m.normalMap.repeat,colorSpace:m.normalMap.colorSpace}:null,
 roughnessMap:m.roughnessMap?{repeat:m.roughnessMap.repeat,colorSpace:m.roughnessMap.colorSpace}:null
});

before(async()=>{
 const root=path.resolve(__dirname,'..');
 server=createServer(async(req,res)=>{try{
  const pathname=req.url==='/'?'/index.html':new URL(req.url,'http://local').pathname,file=path.resolve(root,'.'+pathname);
  if(!file.startsWith(root+path.sep))throw Error('path');
  res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.webp')?'image/webp':file.endsWith('.json')?'application/json':'text/html');
  res.end(await fs.readFile(file));
 }catch{res.writeHead(404);res.end();}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox','--enable-unsafe-swiftshader']});
 await fs.mkdir(QA,{recursive:true});
});
after(async()=>{await browser?.close();await new Promise(resolve=>server?.close(resolve));});

async function setup(t){
 const {width,height,deviceScaleFactor}=fixture.viewport;
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor,acceptDownloads:true});
 t.after(()=>context.close());
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(`pageerror:${e.message}`));
 page.on('console',m=>{if(m.type()==='error')errors.push(`console:${m.text()}`);});
 await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**',async route=>{
  const target=route.request().url();
  if(!cache.has(target))cache.set(target,require('./helpers/three-module.cjs')(target,()=>run('curl',['--fail','--silent','--show-error','--max-time','30',target],{maxBuffer:4*1024*1024}).then(r=>r.stdout)));
  await route.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await cache.get(target)});
 });
 await page.goto(url);
 await page.waitForFunction(()=>window.View3D&&window.FloorPlanPresentation&&window.FloorPlanSurfaces&&FloorPlanSurfaces.entries.length===50,null,{timeout:15000});
 await require('./editor-fixture.cjs')(page);
 return {page,errors};
}

async function applyAssignments(page,assignments){
 return page.evaluate(assignments=>{
  let p=structuredClone(FloorPlanApp.project);
  for(const a of assignments){
   const entry=FloorPlanSurfaces.get(a.surfaceId);if(!entry)throw Error(`missing surface ${a.surfaceId}`);
   const list=a.kind==='floor'?p.rooms:p.walls,target=list[a.targetIndex];if(!target)throw Error(`missing ${a.kind}[${a.targetIndex}]`);
   p=FloorPlanSurfaces.apply(p,entry,{kind:a.kind,id:target.id});
  }
  return p;
 },assignments);
}

async function runtimeSnapshot(page,projectSha,candidateId){
 return page.evaluate(({projectSha,candidateId})=>{
  const stage=document.querySelector('#stage'),canvas=document.querySelector('#view3d canvas'),rect=stage.getBoundingClientRect(),canvasRect=canvas.getBoundingClientRect();
  const current=FloorPlanPresentation.current||null,inspect=View3D.presentationInspect?.()||null,light=View3D.presentationLight||null;
  const picked=new Set(['surface-oak-wood-planks','surface-marble-01','surface-brushed-concrete','surface-white-plaster-02']);
  return {
   fixtureVersion:1,candidateId,projectSha256:projectSha,
   viewport:{width:innerWidth,height:innerHeight,devicePixelRatio},
   stage:{width:rect.width,height:rect.height},
   canvas:{cssWidth:canvasRect.width,cssHeight:canvasRect.height,...View3D.canvasState},
   presentation:{active:FloorPlanPresentation.active,current:current?{kind:current.kind||null,roomId:current.roomId||null,levelId:current.levelId??null}:null,status:document.querySelector('.presentation-status')?.textContent||'',moving:document.querySelector('#presentationOverlay')?.dataset.moving||null},
   camera:inspect?{position:inspect.position,quaternion:inspect.quaternion,target:inspect.target,fov:inspect.fov,aspect:inspect.aspect}:View3D.cameraState,
   viewOptions:inspect?.options||null,
   light,
   environment3D:View3D.environment3D??null,
   surfaceQuality:View3D.surfaceQuality,
   surfaces:View3D.surfaceMetrics.filter(m=>picked.has(m.id)).map(m=>({id:m.id,state:m.state,detailState:m.detailState,bytes:m.bytes||0,gpuBytes:m.gpuBytes||0,map:m.map?{repeat:m.map.repeat,colorSpace:m.map.colorSpace}:null,normalMap:m.normalMap?{repeat:m.normalMap.repeat,colorSpace:m.normalMap.colorSpace}:null,roughnessMap:m.roughnessMap?{repeat:m.roughnessMap.repeat,colorSpace:m.roughnessMap.colorSpace}:null})).sort((a,b)=>a.id.localeCompare(b.id)),
   rendererMemory:View3D.rendererMemory,
   lifecycle:View3D.lifecycleMetrics,
   projectBindings:FloorPlanApp.project.materials.filter(m=>m.appearance?.preset?.startsWith('surface-')).map(m=>({id:m.id,category:m.category,preset:m.appearance.preset,repeatMm:m.appearance.repeatMm})).sort((a,b)=>a.preset.localeCompare(b.preset))
  };
 },{projectSha,candidateId});
}

async function startPresentation(page){
 await page.locator('#presentationBtn').click();
 await page.getByRole('button',{name:'Iniciar presentación'}).click();
 await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false',null,{timeout:30000});
 await page.waitForFunction(q=>View3D.surfaceQuality===q&&View3D.surfaceMetrics.every(m=>m.state==='ready'&&(q==='base'||m.detailState==='ready'||m.detailState==='off')),fixture.presentation.surfaceQuality,{timeout:30000});
 await require('./layout-fixture.cjs')(page);
}

test('VQ-01 CP1-A identifies and reproduces the documented A fixture without drift',{timeout:180000},async t=>{
 const {page,errors}=await setup(t),base=await page.evaluate(()=>structuredClone(FloorPlanApp.project));
 const candidates=[];let match=null;
 for(const candidate of fixture.candidateAssignments){
  await page.evaluate(project=>FloorPlanApp.importProject(project),base);
  const project=await applyAssignments(page,candidate.assignments),projectJson=JSON.stringify(project),projectSha=hash(projectJson);
  candidates.push({id:candidate.id,projectSha256:projectSha,assignments:candidate.assignments});
  if(projectSha===fixture.expectedProjectSha256){match={candidate,project,projectSha};break;}
 }
 await fs.writeFile(path.join(QA,'candidate-hashes.json'),JSON.stringify({expected:fixture.expectedProjectSha256,candidates},null,2)+'\n');
 assert.ok(match,`CP0.1 project hash not reproduced; expected ${fixture.expectedProjectSha256}; candidates=${JSON.stringify(candidates)}`);
 await page.evaluate(project=>FloorPlanApp.importProject(project),match.project);
 assert.equal(hash(JSON.stringify(await page.evaluate(()=>FloorPlanApp.project))),fixture.expectedProjectSha256,'import changed Project identity');
 await startPresentation(page);
 const snapshot=await runtimeSnapshot(page,match.projectSha,match.candidate.id);
 await fs.writeFile(path.join(QA,'a-runtime-probe.json'),JSON.stringify(snapshot,null,2)+'\n');
 await page.screenshot({path:path.join(QA,'a-1440x900.png')});
 assert.deepEqual(snapshot.viewport,{width:fixture.viewport.width,height:fixture.viewport.height,devicePixelRatio:fixture.viewport.deviceScaleFactor});
 assert.equal(snapshot.canvas.cssWidth,fixture.expectedCanvas.width,'A canvas width drifted from CP0.1');
 assert.equal(snapshot.canvas.cssHeight,fixture.expectedCanvas.height,'A canvas height drifted from CP0.1');
 assert.equal(snapshot.presentation.active,true);
 assert.equal(snapshot.presentation.moving,'false');
 assert.equal(snapshot.surfaceQuality,fixture.presentation.surfaceQuality);
 assert.equal(snapshot.lifecycle.pendingAssets,0,'A still has pending assets');
 assert.deepEqual(errors,[]);
});
