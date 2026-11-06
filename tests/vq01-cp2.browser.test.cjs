// CP1-C: identical capture protocol for the baseline and candidate source SHAs.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const {createServer}=require('node:http'),{execFile,execFileSync}=require('node:child_process');
const {promisify}=require('node:util'),run=promisify(execFile),{chromium}=require('playwright');
const fixturePath=path.join(__dirname,'fixtures/vq01-material-ab-v2.json'),fixture=require(fixturePath);
const views=require('./fixtures/vq01-cp2-views.json');
const side=process.env.VQ01_AB_SIDE||'A0',bootstrap=process.env.VQ01_AB_BOOTSTRAP==='1';
const appRoot=path.resolve(process.env.VQ01_APP_ROOT||path.join(__dirname,'..'));
const output=path.resolve(process.env.VQ01_ARTIFACTS||`qa-results/vq01-cp1-c/${side.toLowerCase()}`);
const digest=data=>crypto.createHash('sha256').update(data).digest('hex');
const sourceSha=execFileSync('git',['-C',appRoot,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
const fixtureSha=digest(require('node:fs').readFileSync(fixturePath));
let server,url,browser;const cache=new Map();
before(async()=>{
 assert.ok(['A0','B1','B2'].includes(side));
 if(views.sources[side])assert.equal(sourceSha,views.sources[side],side+' source drift');
 server=createServer(async(req,res)=>{try{
  const pathname=req.url==='/'?'/index.html':new URL(req.url,'http://local').pathname,file=path.resolve(appRoot,'.'+pathname);
  if(!file.startsWith(appRoot+path.sep))throw Error('path escape');
  res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.webp')?'image/webp':file.endsWith('.json')?'application/json':'text/html');
  res.end(await fs.readFile(file));
 }catch{res.writeHead(404);res.end();}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));url=`http://127.0.0.1:${server.address().port}/`;
 const launch={args:['--no-sandbox','--enable-unsafe-swiftshader']};if(process.env.CHROME)launch.executablePath=process.env.CHROME;
 browser=await chromium.launch(launch);await fs.mkdir(output,{recursive:true});
});
after(async()=>{await browser?.close();await new Promise(resolve=>server?.close(resolve));});
async function newPage(){
 const {width,height,deviceScaleFactor}=fixture.viewport,context=await browser.newContext({viewport:{width,height},deviceScaleFactor});
 const page=await context.newPage(),errors=[],warnings=[];
 page.on('pageerror',e=>errors.push(`pageerror:${e.message}`));
 page.on('console',m=>{if(m.type()==='error')errors.push(`console:${m.text()}`);if(m.type()==='warning')warnings.push(`console:${m.text()}`);});
 await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**',async route=>{
  const target=route.request().url();
  if(!cache.has(target))cache.set(target,require('./helpers/three-module.cjs')(target,()=>run('curl',['--fail','--silent','--show-error','--max-time','30',target],{maxBuffer:4*1024*1024}).then(r=>r.stdout)));
  await route.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await cache.get(target)});
 });
 await page.goto(url);await page.waitForFunction(()=>window.View3D&&window.FloorPlanPresentation&&window.FloorPlanSurfaces&&FloorPlanSurfaces.entries.length===50,null,{timeout:15000});
 if(await page.locator('#welcomeDialog').evaluate(d=>d.open))await page.locator('#welcomeActionInput').press('Escape');
 await page.evaluate(()=>document.querySelector('#guideDetails').click());await page.evaluate(()=>document.querySelector('#guideAllTools').click());
 await require('./layout-fixture.cjs')(page);return{context,page,errors,warnings};
}
async function setupProject(page){
 const project=await page.evaluate(assignments=>{
  let p=structuredClone(FloorPlanApp.project);
  for(const a of assignments){const entry=FloorPlanSurfaces.get(a.surfaceId),target=(a.kind==='floor'?p.rooms:p.walls)[a.targetIndex];
   if(!entry||!target)throw Error(`missing ${a.surfaceId} or ${a.kind}[${a.targetIndex}]`);
   p=FloorPlanSurfaces.apply(p,entry,{kind:a.kind,id:target.id});
  }return p;
 },fixture.assignments);
 const hash=digest(JSON.stringify(project));if(!bootstrap)assert.equal(hash,fixture.projectSha256,'Project fixture drift');
 await page.evaluate(p=>FloorPlanApp.importProject(p),project);
 assert.equal(digest(JSON.stringify(await page.evaluate(()=>FloorPlanApp.project))),hash,'Project import drift');
 return hash;
}
async function present(page){
 await page.locator('#presentationBtn').click();await page.getByRole('button',{name:'Iniciar presentación'}).click();
 await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false',null,{timeout:30000});
 await page.waitForFunction(({ids,q})=>{const picked=View3D.surfaceMetrics.filter(m=>ids.includes(m.id));
  return View3D.surfaceQuality===q&&picked.length===ids.length&&picked.every(m=>m.state==='ready'&&(m.detailState==='ready'||m.detailState==='off'));
 },{ids:fixture.assignments.map(a=>a.surfaceId),q:fixture.presentation.surfaceQuality},{timeout:90000});
 await page.waitForFunction(()=>View3D.lifecycleMetrics.pendingAssets===0,null,{timeout:90000});
 const readiness=await page.evaluate(()=>{
  const before={pendingAssets:View3D.lifecycleMetrics.pendingAssets,disabled:document.querySelector('#presentationCapture').disabled,details:View3D.surfaceMetrics.map(m=>({id:m.id,state:m.state,detailState:m.detailState}))};
  dispatchEvent(new Event('floorplan-asset-status'));
  return {before,after:{pendingAssets:View3D.lifecycleMetrics.pendingAssets,disabled:document.querySelector('#presentationCapture').disabled}};
 });
 await fs.writeFile(path.join(output,'capture-readiness-last.json'),JSON.stringify(readiness,null,2)+'\n');
 await page.waitForFunction(()=>!document.querySelector('#presentationCapture').disabled,null,{timeout:30000});
 await require('./layout-fixture.cjs')(page);
 return readiness;
}
async function snapshot(page,hash){
 return page.evaluate(({hash,ids})=>{
  const stage=document.querySelector('#stage'),canvas=document.querySelector('#view3d canvas'),sr=stage.getBoundingClientRect(),cr=canvas.getBoundingClientRect();
  const current=FloorPlanPresentation.current||null,inspect=View3D.presentationInspect(),selected=new Set(ids);
  return{projectSha256:hash,viewport:{width:innerWidth,height:innerHeight,devicePixelRatio},stage:{width:sr.width,height:sr.height},
   canvas:{cssWidth:cr.width,cssHeight:cr.height,width:View3D.canvasState.width,height:View3D.canvasState.height,pixelRatio:View3D.canvasState.pixelRatio},
   presentation:{active:FloorPlanPresentation.active,current:current?{kind:current.kind||null,roomId:current.roomId||null,levelId:current.levelId??null}:null,status:document.querySelector('.presentation-status')?.textContent||'',moving:document.querySelector('#presentationOverlay')?.dataset.moving||null},
   camera:{position:inspect.position,quaternion:inspect.quaternion,target:inspect.target,fov:inspect.fov,aspect:inspect.aspect},viewOptions:inspect.options,
   light:View3D.presentationLight,environment3D:View3D.environment3D??null,surfaceQuality:View3D.surfaceQuality,
   surfaces:View3D.surfaceMetrics.filter(m=>selected.has(m.id)).map(m=>({id:m.id,state:m.state,detailState:m.detailState,bytes:m.bytes||0,gpuBytes:m.gpuBytes||0,
    map:m.map?{repeat:m.map.repeat,colorSpace:m.map.colorSpace}:null,normalMap:m.normalMap?{repeat:m.normalMap.repeat,colorSpace:m.normalMap.colorSpace}:null,
    roughnessMap:m.roughnessMap?{repeat:m.roughnessMap.repeat,colorSpace:m.roughnessMap.colorSpace}:null,error:m.error||null,detailError:m.detailError||null})).sort((a,b)=>a.id.localeCompare(b.id)),
   projectBindings:FloorPlanApp.project.materials.filter(m=>m.appearance?.preset?.startsWith('surface-')).map(m=>({id:m.id,category:m.category,preset:m.appearance.preset,repeatMm:m.appearance.repeatMm})).sort((a,b)=>a.preset.localeCompare(b.preset)),
   lifecycle:View3D.lifecycleMetrics};
 },{hash,ids:fixture.assignments.map(a=>a.surfaceId)});
}
function near(actual,expected,label){assert.equal(actual.length,expected.length,label);for(let i=0;i<actual.length;i++)assert.ok(Math.abs(actual[i]-expected[i])<=1e-10,`${label}[${i}] ${actual[i]} != ${expected[i]}`);}
function assertFrozen(s){
 assert.deepEqual(s.viewport,{width:fixture.viewport.width,height:fixture.viewport.height,devicePixelRatio:fixture.viewport.deviceScaleFactor});
 assert.deepEqual(s.stage,fixture.stage);assert.deepEqual(s.canvas,fixture.canvas);
 assert.deepEqual(s.presentation,{active:true,current:fixture.presentation.current,status:fixture.presentation.status,moving:fixture.presentation.moving});
 near(s.camera.position,fixture.camera.position,'camera.position');near(s.camera.quaternion,fixture.camera.quaternion,'camera.quaternion');near(s.camera.target,fixture.camera.target,'camera.target');
 assert.equal(s.camera.fov,fixture.camera.fov);assert.equal(s.camera.aspect,fixture.camera.aspect);
 assert.deepEqual(s.viewOptions,fixture.viewOptions);assert.deepEqual(s.light,fixture.light);assert.equal(s.environment3D,fixture.environment3D);
 assert.equal(s.surfaceQuality,fixture.presentation.surfaceQuality);
 if(!bootstrap){assert.equal(s.projectSha256,fixture.projectSha256);assert.deepEqual(s.projectBindings,fixture.projectBindings);
  assert.deepEqual(s.lifecycle,fixture.lifecycle);if(side==='A0')assert.deepEqual(s.surfaces,fixture.surfaces);}
 for(const m of s.surfaces){assert.equal(m.state,'ready');assert.ok(m.map);assert.equal(m.map.colorSpace,'srgb');
  if(m.normalMap){assert.equal(m.normalMap.colorSpace,'');assert.deepEqual(m.normalMap.repeat,m.map.repeat);}
  if(m.roughnessMap){assert.equal(m.roughnessMap.colorSpace,'');assert.deepEqual(m.roughnessMap.repeat,m.map.repeat);}}
}
async function reproduce(label){
 const {context,page,errors,warnings}=await newPage();try{
  const projectSha256=await setupProject(page),captureReadiness=await present(page);const runtime=await snapshot(page,projectSha256);assertFrozen(runtime);
  assert.deepEqual(errors,[],`${label}: page/console errors`);
  const png=path.join(output,`${label}-1440x900.png`);await page.screenshot({path:png});
  const diagnostic={sourceSha,fixtureSha,captureReadiness,viewsSha:digest(require('node:fs').readFileSync(path.join(__dirname,'fixtures/vq01-cp2-views.json'))),captureProtocolSha:digest(require('node:fs').readFileSync(path.join(__dirname,'fixtures/vq01-cp2-capture-v3.json'))),side,label,browserVersion:browser.version(),runtime,geometrySha256:digest(JSON.stringify(await page.evaluate(()=>View3D.renderedGeometry))),
   surfaceMaterialMetrics:await page.evaluate(ids=>View3D.surfaceMetrics.filter(m=>ids.includes(m.id)).map(m=>({id:m.id,material:m.material||null,bytes:m.bytes,gpuBytes:m.gpuBytes,detailState:m.detailState,recipe:m.recipe||null,generated:m.generated||null,physical:m.physical||null,ownedTextures:m.ownedTextures??null,ownedBitmaps:m.ownedBitmaps??null})).sort((a,b)=>a.id.localeCompare(b.id)),fixture.assignments.map(a=>a.surfaceId)),
   rendererMemory:await page.evaluate(()=>View3D.rendererMemory),
   surfaceDisposals:await page.evaluate(()=>View3D.surfaceDisposals),errors,warnings,screenshotSha256:digest(await fs.readFile(png))};
  diagnostic.closeups=[];
  for(const view of views.closeups){
   const result=await page.evaluate(async view=>{
    const T=await import('three');
    const c=new T.PerspectiveCamera(view.fov,innerWidth/innerHeight,.1,300);c.position.fromArray(view.position);c.lookAt(new T.Vector3(...view.target));
    const pose={...view,quaternion:c.quaternion.toArray()};View3D.presentationRestorePose(pose);
    return {pose:View3D.presentationPose(),png:document.querySelector('#view3d canvas').toDataURL('image/png'),light:View3D.presentationLight};
   },view);
   assert.deepEqual(result.light,runtime.light,'closeup lighting drift');
   const bytes=Buffer.from(result.png.split(',')[1],'base64'),name=`${label}-${view.id}.png`;
   await fs.writeFile(path.join(output,name),bytes);diagnostic.closeups.push({id:view.id,file:name,pose:result.pose,sha256:digest(bytes)});
  }
  await fs.writeFile(path.join(output,`${label}-manifest.json`),JSON.stringify(diagnostic,null,2)+'\n');return diagnostic;
 }finally{await context.close();}
}
async function pngDelta(first,second){
 const page=await browser.newPage();
 try{return await page.evaluate(async values=>{
  const images=await Promise.all(values.map(async base64=>{
   const binary=atob(base64),bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
   return createImageBitmap(new Blob([bytes],{type:'image/png'}));
  }));
  const width=images[0].width,height=images[0].height;
  if(images[1].width!==width||images[1].height!==height)throw Error('PNG dimensions differ');
  const pixels=images.map(image=>{const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
   const context=canvas.getContext('2d');context.drawImage(image,0,0);const data=context.getImageData(0,0,canvas.width,canvas.height).data;image.close();return data;});
  let changedPixels=0,maxChannelDelta=0,minX=width,minY=height,maxX=-1,maxY=-1;
  for(let i=0;i<pixels[0].length;i+=4){let changed=false;for(let c=0;c<3;c++){const delta=Math.abs(pixels[0][i+c]-pixels[1][i+c]);if(delta)changed=true;maxChannelDelta=Math.max(maxChannelDelta,delta);}
   if(changed){const p=i/4,x=p%width,y=Math.floor(p/width);changedPixels++;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}}
  return{changedPixels,maxChannelDelta,boundingBox:changedPixels?[minX,minY,maxX+1,maxY+1]:null};
 },[first.toString('base64'),second.toString('base64')]);}
 finally{await page.close();}
}
test(`VQ-01 CP2 ${side} reproduces four-family fixture twice`,{timeout:600000},async()=>{
 const first=await reproduce(`${side.toLowerCase()}1`),second=await reproduce(`${side.toLowerCase()}2`);
 const a=structuredClone(first.runtime),b=structuredClone(second.runtime);a.camera=b.camera=null;
 assert.deepEqual(b,a,'fresh contexts differ outside camera');
 near(second.runtime.camera.position,first.runtime.camera.position,'run camera.position');
 near(second.runtime.camera.quaternion,first.runtime.camera.quaternion,'run camera.quaternion');
 near(second.runtime.camera.target,first.runtime.camera.target,'run camera.target');
 const pixelDelta=await pngDelta(await fs.readFile(path.join(output,`${side.toLowerCase()}1-1440x900.png`)),await fs.readFile(path.join(output,`${side.toLowerCase()}2-1440x900.png`)));
 const closeupDeltas=[];for(let i=0;i<first.closeups.length;i++){const a=first.closeups[i],b=second.closeups[i];assert.deepEqual(a.pose,b.pose);const delta=await pngDelta(await fs.readFile(path.join(output,a.file)),await fs.readFile(path.join(output,b.file)));assert.ok(delta.changedPixels<=500&&delta.maxChannelDelta<=1,JSON.stringify({id:a.id,delta}));closeupDeltas.push({id:a.id,...delta});}
 assert.ok(pixelDelta.changedPixels<=500&&pixelDelta.maxChannelDelta<=1,`fresh screenshots diverge: ${JSON.stringify(pixelDelta)}`);
 await fs.writeFile(path.join(output,'ab-side-result.json'),JSON.stringify({result:'PASS',side,sourceSha,fixtureSha,projectSha256:first.runtime.projectSha256,screenshotSha256:[first.screenshotSha256,second.screenshotSha256],pixelDelta,closeupDeltas,runs:2,browserVersion:browser.version()},null,2)+'\n');
});

if(side==='B2'&&process.env.VQ01_LIFECYCLE==='1')test('CP2 recipes recreate, fall back, dispose and recover after context loss',{timeout:900000},async()=>{
 const {context,page,errors,warnings}=await newPage(),cycles=[];
 try{
  const hash=await setupProject(page),saved=await page.evaluate(()=>FloorPlanApp.project);
  const waitQuality=async quality=>{await page.waitForFunction(q=>View3D.surfaceQuality===q&&View3D.surfaceMetrics.length===4&&View3D.surfaceMetrics.every(m=>m.state==='ready'&&(q==='base'?m.detailState==='off':m.detailState==='ready')),quality,{timeout:90000});await require('./layout-fixture.cjs')(page);};
  const measure=()=>page.evaluate(()=>({memory:View3D.rendererMemory,metrics:View3D.surfaceMetrics,pendingAssets:View3D.lifecycleMetrics.pendingAssets}));
  for(let i=0;i<3;i++){
   await present(page);await waitQuality('enhanced');const enhanced=await measure();
   assert.equal(enhanced.pendingAssets,0);assert.equal(enhanced.metrics.reduce((n,m)=>n+m.ownedTextures,0),12);
   assert.ok(enhanced.metrics.reduce((n,m)=>n+m.gpuBytes,0)<=fixture.surfaces.reduce((n,m)=>n+m.gpuBytes,0)+views.resources.maxExtraSurfaceGpuBytes);
   if(i){assert.deepEqual(enhanced.memory,cycles[0].enhanced.memory);assert.deepEqual(enhanced.metrics.map(m=>m.generated),cycles[0].enhanced.metrics.map(m=>m.generated));}
   await page.evaluate(()=>View3D.setSurfaceQuality('base'));await waitQuality('base');const base=await measure();
   assert.equal(base.metrics.reduce((n,m)=>n+m.ownedTextures,0),4);assert.ok(base.metrics.every(m=>m.generated===null));
   await page.evaluate(()=>View3D.setSurfaceQuality('enhanced'));await waitQuality('enhanced');
   await page.locator('#presentationClose').click();await page.waitForFunction(()=>!FloorPlanPresentation.active&&FloorPlanApp.viewMode==='2d',null,{timeout:30000});
   assert.equal(digest(JSON.stringify(await page.evaluate(()=>FloorPlanApp.project))),hash);cycles.push({enhanced,base});
  }
  await present(page);await page.evaluate(()=>View3D.setSurfaceQuality('base'));await waitQuality('base');
  await page.evaluate(()=>{window.__qaGetContext=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,options){if(options?.willReadFrequently)throw Error('QA recipe bake failure');return window.__qaGetContext.call(this,type,options);};View3D.setSurfaceQuality('enhanced');});
  await page.waitForFunction(()=>View3D.surfaceMetrics.find(m=>m.id==='surface-white-plaster-02')?.detailState==='fallback',null,{timeout:90000});
  const fallback=await measure(),plaster=fallback.metrics.find(m=>m.id==='surface-white-plaster-02');assert.ok(plaster.map);assert.equal(plaster.normalMap,null);assert.equal(plaster.ownedTextures,1);assert.match(plaster.detailError,/QA recipe bake failure/);
  await page.evaluate(()=>{HTMLCanvasElement.prototype.getContext=window.__qaGetContext;delete window.__qaGetContext;View3D.setSurfaceQuality('base');});await waitQuality('base');
  await page.evaluate(()=>View3D.setSurfaceQuality('enhanced'));await waitQuality('enhanced');
  await page.evaluate(()=>document.querySelector('#view3d canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
  await page.waitForFunction(()=>!View3D.contextAvailable&&View3D.surfaceMetrics.length===0&&View3D.lifecycleMetrics.pendingAssets===0);
  const loss=await page.evaluate(()=>({metrics:View3D.surfaceMetrics,disposals:View3D.surfaceDisposals,pendingAssets:View3D.lifecycleMetrics.pendingAssets}));
  // Baseline Rubik deliberately fails closed on context loss. Recovery is a page reload, not an invented live renderer restore.
  await page.reload();await page.waitForFunction(()=>window.View3D&&window.FloorPlanPresentation&&FloorPlanSurfaces.entries.length===50);
  if(await page.locator('#welcomeDialog').evaluate(d=>d.open))await page.locator('#welcomeActionInput').press('Escape');
  await page.evaluate(()=>{document.querySelector('#guideDetails').click();document.querySelector('#guideAllTools').click();});
  await page.evaluate(p=>FloorPlanApp.importProject(p),saved);await present(page);await waitQuality('enhanced');const recovered=await measure();
  assert.deepEqual(recovered.memory,cycles[0].enhanced.memory);assert.equal(digest(JSON.stringify(await page.evaluate(()=>FloorPlanApp.project))),hash);assert.deepEqual(errors,[]);
  await fs.writeFile(path.join(output,'lifecycle.json'),JSON.stringify({result:'PASS',cycles,fallback,loss,recovery:'reload',recovered,errors,warnings},null,2)+'\n');
 }finally{await context.close();}
});
