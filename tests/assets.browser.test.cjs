const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http');
const {execFile}=require('node:child_process'),{promisify}=require('node:util'),run=promisify(execFile);
const {chromium}=require('playwright'),Core=require('../js/project-core.js');
const fixture=require('../docs/contracts/examples/floorplan-project-v1.example.json');
let server,browser,url;const cache=new Map();
before(async()=>{const root=path.resolve(__dirname,'..');server=createServer(async(req,res)=>{try{const p=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!p.startsWith(root+path.sep))throw Error();res.setHeader('Content-Type',/\.m?js$/.test(p)?'text/javascript':p.endsWith('.json')?'application/json':p.endsWith('.glb')?'model/gltf-binary':p.endsWith('.txt')?'text/plain':'text/html');res.end(await fs.readFile(p));}catch{res.writeHead(404);res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});
async function setup(t,viewport={width:1440,height:900}){
 const mobile=viewport.width<1000,context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile});t.after(()=>context.close());const page=await context.newPage(),errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push({url:r.url(),method:r.method(),body:r.postData()}));page.on('websocket',s=>errors.push('Unexpected WebSocket '+s.url()));
 // Verified HTTPS transport for the platform CA; no TLS bypass or product/network changes.
 await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**',async route=>{const target=route.request().url();let pending=cache.get(target);if(!pending){pending=run('curl',['--fail','--silent','--show-error','--max-time','20',target],{maxBuffer:4*1024*1024}).then(r=>r.stdout);cache.set(target,pending);}try{await route.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await pending});}catch(e){errors.push('Verified CDN unavailable: '+e.message);await route.abort();}});
 await page.goto(url);await page.waitForFunction(()=>window.View3D&&window.FloorPlanAssetUI?.ready,null,{timeout:40000});
 const project=Core.clone(fixture);project.objects=[project.objects[1]];delete project.objects[0].assetRef;project.objects[0].rotationDeg=90;project.objects[0].elevationMm=100;project.objects[0].roomId=project.rooms[0].id;delete project.sourceImages;delete project.scale.calibration;project.scale={confidence:'estimated',method:'template'};
 await page.evaluate(p=>FloorPlanApp.importProject(p),project);
 await page.locator('#gFurn [data-fid]').dispatchEvent('pointerdown',{button:0,pointerId:1,clientX:200,clientY:200});
 if(mobile)await page.locator('#tgPanel').tap();
 return {page,context,errors,requests,project,mobile};
}
async function open3D(page){await page.click('[data-view="3d"]');await page.waitForFunction(()=>document.querySelector('#stage').classList.contains('is3d')&&!document.body.classList.contains('busy'),null,{timeout:20000});}
for(const viewport of [{width:390,height:844},{width:844,height:390},{width:1440,height:900}])test(`F3 authorized load, dimensions, state and offline fallback ${viewport.width}x${viewport.height}`,{timeout:90000},async t=>{
 const {page,context,errors,requests,project,mobile}=await setup(t,viewport),id=project.objects[0].id;
 assert.deepEqual(await page.evaluate(()=>FloorPlanApp.project),project);await page.locator('#fAsset').scrollIntoViewIfNeeded();if(mobile)await page.locator('#fAsset').tap();else await page.locator('#fAsset').focus();await page.locator('#fAsset').selectOption('synthetic-bench');
 const selected=await page.evaluate(()=>FloorPlanApp.project.objects[0]),before=Core.clone(selected);delete before.assetRef;assert.deepEqual(before,project.objects[0]);assert.equal(selected.assetRef.catalog,'rubik-sota-local');
 await open3D(page);await page.waitForFunction(id=>View3D.assetStatus(id)?.state==='ready',id);
 const result=await page.evaluate(id=>({status:View3D.assetStatus(id),objects:View3D.assetObjects,memory:View3D.rendererMemory,canvasHeight:document.querySelector('#view3d canvas').clientHeight,stageHeight:document.querySelector('#stage').clientHeight}),id);
 assert.equal(result.status.triangles,60);assert.equal(result.objects.length,1);assert.equal(result.objects[0].id,id);assert.ok(Math.abs(result.objects[0].rotation+Math.PI/2)<1e-10);assert.equal(result.objects[0].position[1],.1);
 for(const [axis,value]of Object.entries({width:600,height:450,depth:400}))assert.ok(Math.abs(result.status.normalizedDimensionsMm[axis]-value)<.01);
 assert.deepEqual(result.status.instanceDimensionsMm,{width:selected.size.widthMm,height:selected.size.heightMm,depth:selected.size.depthMm});assert.ok(result.canvasHeight>=result.stageHeight*.6);
 await page.screenshot({path:`docs/qa/artifacts/f3/${viewport.width}x${viewport.height}-loaded.png`});t.diagnostic(JSON.stringify({viewport,renderer:'SwiftShader software',...result.status,rendererMemory:result.memory}));
 assert.deepEqual(await page.evaluate(()=>FloorPlanApp.project.objects[0]),selected);
 if(!mobile){await page.reload();await page.waitForFunction(()=>window.View3D&&FloorPlanAssetUI.ready);assert.deepEqual(await page.evaluate(()=>FloorPlanApp.project.objects[0]),selected);await page.locator('#gFurn [data-fid]').dispatchEvent('pointerdown',{button:0,pointerId:1,clientX:200,clientY:200});await open3D(page);await page.waitForFunction(id=>View3D.assetStatus(id)?.state==='ready',id);}
 await context.setOffline(true);await page.evaluate(()=>View3D.refreshAssets());await page.waitForFunction(id=>View3D.assetStatus(id)?.state==='error',id);assert.equal(await page.evaluate(()=>View3D.assetObjects.length),0);
 // Open the properties drawer in 3D and show the accessible fallback status.
 if(mobile&&!(await page.locator('#panel').locator('..').evaluate(el=>el.classList.contains('open'))))await page.locator('#tgPanel').tap();
 assert.match(await page.locator('#fAssetStatus').textContent(),/se muestra el genérico/);await page.screenshot({path:`docs/qa/artifacts/f3/${viewport.width}x${viewport.height}-fallback.png`});
 await page.locator('#fAsset').selectOption('');assert.equal((await page.evaluate(()=>FloorPlanApp.project.objects[0])).assetRef,undefined);await context.setOffline(false);
 await page.click('[data-view="2d"]');await page.waitForFunction(()=>!document.body.classList.contains('busy'));assert.equal(await page.locator('#gFurn [data-fid]').count(),1);
 assert.deepEqual(await page.evaluate(()=>FloorPlanApp.project.objects[0]),project.objects[0]);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.reload();assert.deepEqual(await page.evaluate(()=>FloorPlanApp.project.objects[0]),project.objects[0]);assert.deepEqual(errors,[]);
 for(const r of requests){const u=new URL(r.url);assert.equal(r.method,'GET');assert.equal(r.body,null);assert.equal(u.search,'');assert.ok(u.origin===new URL(url).origin||u.host==='cdn.jsdelivr.net');if(u.host==='cdn.jsdelivr.net')assert.ok(u.pathname.startsWith('/npm/three@0.160.0/'));}
});
test('F3 loader rejects bad headers, extensions, external dependencies, integrity, dimensions and timeout',{timeout:90000},async t=>{
 const {page,errors}=await setup(t);
 const checks=await page.evaluate(async()=>{
  const L=await import('./js/asset-loader.mjs'),entry=FloorPlanAssetUI.entries[0],buffer=await(await fetch(entry.url)).arrayBuffer(),results=[];
  const reject=async fn=>{try{await fn();return false;}catch{return true;}};
  const broken=buffer.slice(0);new DataView(broken).setUint32(4,1,true);results.push(await reject(()=>L.inspectGLB(broken)));
  function encoded(mutate){const original=L.inspectGLB(buffer),doc=structuredClone(original);mutate(doc);let bytes=new TextEncoder().encode(JSON.stringify(doc));const n=Math.ceil(bytes.length/4)*4,source=new DataView(buffer),oldJSON=source.getUint32(12,true),rest=new Uint8Array(buffer,20+oldJSON),b=new ArrayBuffer(20+n+rest.length),view=new DataView(b);view.setUint32(0,0x46546c67,true);view.setUint32(4,2,true);view.setUint32(8,b.byteLength,true);view.setUint32(12,n,true);view.setUint32(16,0x4e4f534a,true);new Uint8Array(b,20,n).fill(32);new Uint8Array(b,20,bytes.length).set(bytes);new Uint8Array(b,20+n).set(rest);return b;}
  for(const mutate of [d=>d.extensionsRequired=['KHR_draco_mesh_compression'],d=>d.meshes[0].primitives[0].extensions={KHR_draco_mesh_compression:{}},d=>d.buffers[0].uri='https://unapproved/model.bin',d=>d.images=[{uri:'private.png'}],d=>d.animations=[{}]])results.push(await reject(()=>L.inspectGLB(encoded(mutate))));
  results.push(await reject(()=>L.load({...entry,sha256:'0'.repeat(64)})));results.push(await reject(()=>L.load({...entry,permissionSha256:'0'.repeat(64)})));results.push(await reject(()=>L.load({...entry,dimensionsMm:{...entry.dimensionsMm,width:630}})));results.push(await reject(()=>L.load({...entry,url:'https://unapproved/asset.glb'})));results.push(await reject(()=>L.load(entry,{timeoutMs:0})));
  return results;
 });assert.equal(checks.length,11);assert.ok(checks.every(Boolean));assert.deepEqual(errors,[]);
});
test('F3 missing reference, broken URL and stale asynchronous success keep a generic editor',{timeout:90000},async t=>{
 const {page,errors,project}=await setup(t),id=project.objects[0].id;
 await page.locator('#fAsset').selectOption('synthetic-bench');await page.route('**/assets/f3/synthetic-bench.glb',route=>route.fulfill({status:404,body:'missing'}));await open3D(page);await page.waitForFunction(id=>View3D.assetStatus(id)?.state==='error',id);assert.equal(await page.evaluate(()=>View3D.assetObjects.length),0);
 await page.unroute('**/assets/f3/synthetic-bench.glb');let release;const hold=new Promise(r=>release=r);await page.route('**/assets/f3/synthetic-bench.glb',async route=>{await hold;try{await route.continue();}catch{}});await page.evaluate(()=>View3D.refreshAssets());await page.waitForFunction(id=>View3D.assetStatus(id)?.state==='loading',id);await page.locator('#fAsset').selectOption('');release();await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>View3D.assetObjects.length),0);
 const changed=Core.clone(project);changed.objects[0].assetRef={catalog:'immersphere-asset-lab',assetId:'not-authorized'};await page.evaluate(p=>FloorPlanApp.importProject(p),changed);await page.waitForFunction(id=>View3D.assetStatus(id)?.state==='error',id);assert.equal(await page.evaluate(()=>View3D.assetObjects.length),0);assert.deepEqual(await page.evaluate(()=>FloorPlanApp.project.objects[0]),changed.objects[0]);assert.deepEqual(errors,[]);
});
