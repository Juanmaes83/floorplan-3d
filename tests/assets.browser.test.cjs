const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http');
const {execFile}=require('node:child_process'),{promisify}=require('node:util'),run=promisify(execFile);
const {chromium}=require('playwright'),Core=require('../js/project-core.js');
const fixture=require('../docs/contracts/examples/floorplan-project-v1.example.json');
let server,browser,url,protectedAssets=false;const cache=new Map();
before(async()=>{const root=path.resolve(__dirname,'..');server=createServer(async(req,res)=>{try{if(protectedAssets&&req.url.startsWith('/assets/f3/')&&!String(req.headers.cookie||'').split(';').some(c=>c.trim()==='qa-preview=authorized')){res.writeHead(401,{'Content-Type':'text/html'});res.end('Preview requires a session');return;}const p=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!p.startsWith(root+path.sep))throw Error();res.setHeader('Content-Type',/\.m?js$/.test(p)?'text/javascript':p.endsWith('.css')?'text/css':p.endsWith('.webp')?'image/webp':p.endsWith('.json')?'application/json':p.endsWith('.glb')?'model/gltf-binary':p.endsWith('.txt')?'text/plain':'text/html');res.end(await fs.readFile(p));}catch{res.writeHead(404);res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});
async function setup(t,viewport={width:1440,height:900}){
 const mobile=viewport.width<1000,context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile});t.after(()=>context.close());const page=await context.newPage(),errors=[],requests=[],consoleMessages=[];page.on('console',m=>consoleMessages.push({type:m.type(),text:m.text()}));page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push({url:r.url(),method:r.method(),body:r.postData()}));page.on('websocket',s=>errors.push('Unexpected WebSocket '+s.url()));
 // Verified HTTPS transport for the platform CA; no TLS bypass or product/network changes.
 await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**',async route=>{const target=route.request().url();let pending=cache.get(target);if(!pending){pending=run('curl',['--fail','--silent','--show-error','--max-time','20',target],{maxBuffer:4*1024*1024}).then(r=>r.stdout);cache.set(target,pending);}try{await route.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await pending});}catch(e){errors.push('Verified CDN unavailable: '+e.message);await route.abort();}});
 await page.goto(url);await page.waitForFunction(()=>window.View3D&&window.FloorPlanAssetUI?.ready,null,{timeout:40000});
 const project=Core.clone(fixture);project.objects=[project.objects[1]];delete project.objects[0].assetRef;project.objects[0].rotationDeg=90;project.objects[0].elevationMm=100;project.objects[0].roomId=project.rooms[0].id;delete project.sourceImages;delete project.scale.calibration;project.scale={confidence:'estimated',method:'template'};
 await page.evaluate(p=>FloorPlanApp.importProject(p),project);
 await page.locator('#gFurn [data-fid]').dispatchEvent('pointerdown',{button:0,pointerId:1,clientX:200,clientY:200});
 if(mobile)await page.locator('#tgPanel').tap();
 return {page,context,errors,requests,consoleMessages,project,mobile};
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
 await page.screenshot({path:`docs/qa/artifacts/f3-textures/${viewport.width}x${viewport.height}-loaded.png`});t.diagnostic(JSON.stringify({viewport,renderer:'SwiftShader software',...result.status,rendererMemory:result.memory}));
 assert.deepEqual(await page.evaluate(()=>FloorPlanApp.project.objects[0]),selected);
 if(!mobile){await page.reload();await page.waitForFunction(()=>window.View3D&&FloorPlanAssetUI.ready);assert.deepEqual(await page.evaluate(()=>FloorPlanApp.project.objects[0]),selected);await page.locator('#gFurn [data-fid]').dispatchEvent('pointerdown',{button:0,pointerId:1,clientX:200,clientY:200});await open3D(page);await page.waitForFunction(id=>View3D.assetStatus(id)?.state==='ready',id);}
 await context.setOffline(true);await page.evaluate(()=>View3D.refreshAssets());await page.waitForFunction(id=>View3D.assetStatus(id)?.state==='error',id);assert.equal(await page.evaluate(()=>View3D.assetObjects.length),0);
 // Open the properties drawer in 3D and show the accessible fallback status.
 if(mobile&&!(await page.locator('#panel').locator('..').evaluate(el=>el.classList.contains('open'))))await page.locator('#tgPanel').tap();
 assert.match(await page.locator('#fAssetStatus').textContent(),/se muestra el genérico/);await page.screenshot({path:`docs/qa/artifacts/f3-textures/${viewport.width}x${viewport.height}-fallback.png`});
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

test('F3 core embedded JPEG loads without blob URLs; budgets, MIME and external resources fail closed',{timeout:90000},async t=>{
 const {createTexturedGLB,mutateGLB}=require('./helpers/textured-glb.cjs'),crypto=require('node:crypto');
 const {page,errors}=await setup(t),valid=createTexturedGLB();
 const mutations=[d=>d.images[0].uri='https://external/image.jpg',d=>d.images[0].uri='blob:external',d=>d.images[0].uri='data:image/jpeg;base64,anything',d=>d.images[0].mimeType='image/png',d=>d.images[0].bufferView=999,d=>d.bufferViews[4].byteOffset=Number.MAX_SAFE_INTEGER,d=>d.images=Array(5).fill(d.images[0]),d=>d.textures=Array(5).fill(d.textures[0]),d=>d.textures[0].source=8,d=>d.materials[0].emissiveTexture={index:0},d=>d.materials[0].pbrMetallicRoughness.baseColorTexture.texCoord=1,d=>d.samplers=[{wrapS:0}],d=>d.buffers[0].uri='file:///private.bin',d=>d.extensionsUsed=['EXT_texture_webp']];
 const invalid=mutations.map(fn=>mutateGLB(valid,fn));
 // Sufficient binary bytes: each failure targets its guard, not truncated JSON.
 invalid.push(mutateGLB(valid,(d,bin)=>{const v=d.bufferViews[4],b=Buffer.alloc(v.byteOffset+1024*1024+1);bin.copy(b);v.byteLength=1024*1024+1;d.buffers[0].byteLength=b.length;return b;}));
 function dimensions(width,height,textures=1){return mutateGLB(valid,(d,bin)=>{const v=d.bufferViews[4];let at=v.byteOffset+2;while(at<bin.length){while(bin[at]===255)at++;const marker=bin[at++],n=bin.readUInt16BE(at);if([192,193,194].includes(marker)){bin.writeUInt16BE(height,at+3);bin.writeUInt16BE(width,at+5);break;}at+=n;}d.textures=Array(textures).fill({source:0});return bin;});}
 invalid.push(dimensions(2049,512),dimensions(2048,2048,4));
 await page.route('**/assets/f3/synthetic-bench.glb',r=>r.fulfill({contentType:'model/gltf-binary',body:valid}));
 const result=await page.evaluate(async({valid,invalid,sha})=>{
  const L=await import('./js/asset-loader.mjs'),buffer=Uint8Array.from(valid).buffer;const rejected=[];
  for(const bytes of invalid){try{L.inspectGLB(Uint8Array.from(bytes).buffer);rejected.push(false);}catch{rejected.push(true);}}
  const create=URL.createObjectURL;URL.createObjectURL=()=>{throw Error('No blob URL is permitted for pilot textures');};
  let loaded;try{loaded=await L.load({...FloorPlanAssetUI.entries[0],sha256:sha,bytes:buffer.byteLength});}finally{URL.createObjectURL=create;}
  let textured=0;loaded.scene.traverse(o=>{if(o.material?.map?.image)textured++;});const stats=loaded.textureStats;
  L.dispose(loaded.scene);return {rejected,textured,stats};
 },{valid:[...valid],invalid:invalid.map(x=>[...x]),sha:crypto.createHash('sha256').update(valid).digest('hex')});
 assert.equal(result.rejected.length,17);assert.ok(result.rejected.every(Boolean));assert.ok(result.textured>0);assert.equal(result.stats.images,1);assert.equal(result.stats.textures,1);assert.ok(result.stats.decodedBytes>0&&result.stats.textureBytes<=24*1024*1024);assert.deepEqual(errors,[]);
});

test('F3 cancellation during image decoding closes late resources and shared disposal is unique',{timeout:90000},async t=>{
 const {createTexturedGLB}=require('./helpers/textured-glb.cjs'),crypto=require('node:crypto'),valid=createTexturedGLB();const {page,errors}=await setup(t);
 await page.route('**/assets/f3/synthetic-bench.glb',r=>r.fulfill({contentType:'model/gltf-binary',body:valid}));
 const result=await page.evaluate(async({sha,bytes})=>{
  const L=await import('./js/asset-loader.mjs'),entry={...FloorPlanAssetUI.entries[0],sha256:sha,bytes},controller=new AbortController();let release,started=false,closed=0;
  const original=createImageBitmap;globalThis.createImageBitmap=()=>{started=true;return new Promise(r=>release=()=>r({width:1,height:1,close:()=>closed++}));};
  let canceled=false;try{const task=L.load(entry,{signal:controller.signal});while(!started)await new Promise(r=>setTimeout(r,5));controller.abort();try{await task;}catch{canceled=true;}release();await new Promise(r=>setTimeout(r,50));}finally{globalThis.createImageBitmap=original;}
  const counts={geometry:0,material:0,texture:0,bitmap:0},bitmap={close:()=>counts.bitmap++},texture={isTexture:true,image:bitmap,dispose:()=>counts.texture++},material={map:texture,occlusionMap:texture,dispose:()=>counts.material++},geometry={dispose:()=>counts.geometry++};
  L.dispose({traverse:fn=>{fn({material,geometry});fn({material,geometry});}});
  return {canceled,closed,counts};
 },{sha:crypto.createHash('sha256').update(valid).digest('hex'),bytes:valid.length});
 assert.equal(result.canceled,true);assert.equal(result.closed,1);assert.deepEqual(result.counts,{geometry:1,material:1,texture:1,bitmap:1});assert.deepEqual(errors,[]);
});

for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390}])test(`F3 external textured catalog end-to-end ${viewport.width}x${viewport.height}`,{timeout:120000},async t=>{
 const {page,errors,requests,consoleMessages,project,mobile}=await setup(t,viewport),id=project.objects[0].id;
 const catalog=await page.evaluate(()=>FloorPlanAssetUI.entries.filter(e=>e.catalog==='immersphere-asset-lab'));assert.equal(catalog.length,2);
 const commit=(await run('git',['rev-parse','HEAD'])).stdout.trim(),crypto=require('node:crypto'),fingerprint=crypto.createHash('sha256');
 for(const name of ['index.html','js/asset-loader.mjs','js/asset-ui.js','js/asset-catalog.js','assets/f3/external.manifest.json']){fingerprint.update(name);fingerprint.update(await fs.readFile(name));}
 const metrics=[];const failures=[];page.on('requestfailed',r=>failures.push({url:r.url(),error:r.failure()?.errorText}));
 for(const entry of catalog){
  for(const [selector,value]of [['#fName',entry.name],['#fX',2200],['#fY',1800],['#fR',0],['#fW',entry.dimensionsMm.width],['#fD',entry.dimensionsMm.depth],['#fH',entry.dimensionsMm.height]]){await page.locator(selector).fill(String(value));await page.locator(selector).dispatchEvent('change');}
  const before=await page.evaluate(()=>structuredClone(FloorPlanApp.project.objects[0]));await page.locator('#fAsset').selectOption(entry.id);
  const selected=await page.evaluate(()=>structuredClone(FloorPlanApp.project.objects[0])),without=structuredClone(selected);delete without.assetRef;delete before.assetRef;assert.deepEqual(without,before);assert.equal(selected.assetRef.catalogRevision,entry.revision);
  await page.screenshot({path:`docs/qa/artifacts/f3-textures/${viewport.width}x${viewport.height}-${entry.id}-2d.png`});
  await open3D(page);await page.waitForFunction(id=>['ready','error'].includes(View3D.assetStatus(id)?.state),id);
  if(await page.evaluate(id=>View3D.assetStatus(id)?.state,id)==='error'){const detail=await page.evaluate(async entry=>{try{await(await import('./js/asset-loader.mjs')).load(entry);return 'Unexpected successful direct load';}catch(e){return e.message;}},entry);assert.fail(detail);}
  const status=await page.evaluate(id=>({status:View3D.assetStatus(id),memory:View3D.rendererMemory,canvas:document.querySelector('#view3d canvas').clientHeight,stage:document.querySelector('#stage').clientHeight}),id);
  for(const axis of ['width','height','depth'])assert.ok(Math.abs(status.status.normalizedDimensionsMm[axis]-entry.dimensionsMm[axis])<=20);
  assert.equal(status.status.textureStats.images,entry.id.includes('songesand')?2:3);assert.ok(status.status.textureStats.textureBytes<=24*1024*1024);assert.ok(status.canvas>=status.stage*.6);assert.deepEqual(await page.evaluate(()=>FloorPlanApp.project.objects[0]),selected);
  await page.evaluate(room=>View3D.flyToRoom(room),selected.roomId);await page.waitForTimeout(1100);
  await page.evaluate(text=>{let el=document.getElementById('qa-sha');if(!el){el=document.createElement('div');el.id='qa-sha';el.style.cssText='position:fixed;bottom:3px;left:5px;font:9px monospace;background:white;color:black;z-index:99999;pointer-events:none';document.body.append(el);}el.textContent=text;},`QA local / SwiftShader / ${viewport.width}x${viewport.height} / ${commit}`);
  await page.screenshot({path:`docs/qa/artifacts/f3-textures/${viewport.width}x${viewport.height}-${entry.id}-3d.png`});
  metrics.push({assetId:entry.id,modelSha256:entry.sha256,...status});
  await page.click('[data-view="2d"]');await page.waitForFunction(()=>!document.body.classList.contains('busy'));
  await page.reload();await page.waitForFunction(()=>window.View3D&&FloorPlanAssetUI.ready);assert.deepEqual(await page.evaluate(()=>FloorPlanApp.project.objects[0]),selected);
  const projectAfterReload=await page.evaluate(()=>structuredClone(FloorPlanApp.project));await page.evaluate(()=>{const p=structuredClone(FloorPlanApp.project);delete p.objects[0].assetRef;FloorPlanApp.importProject(p);});await page.locator('#fileIn').setInputFiles({name:'f3-project.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(projectAfterReload))});await page.waitForFunction(asset=>FloorPlanApp.project.objects[0].assetRef?.assetId===asset,entry.id);
  const zip=await page.evaluate(async()=>Array.from(new Uint8Array(await(await FloorPlanPackage.encode(FloorPlanApp.project,async()=>null)).arrayBuffer())));await page.evaluate(()=>{const p=structuredClone(FloorPlanApp.project);delete p.objects[0].assetRef;FloorPlanApp.importProject(p);});await page.locator('#traceZipFile').setInputFiles({name:'f3-project.zip',mimeType:'application/zip',buffer:Buffer.from(zip)});await page.waitForFunction(asset=>FloorPlanApp.project.objects[0].assetRef?.assetId===asset,entry.id);assert.deepEqual(await page.evaluate(()=>FloorPlanApp.project.objects[0]),selected);
  await page.locator('#gFurn [data-fid]').dispatchEvent('pointerdown',{button:0,pointerId:1,clientX:200,clientY:200});if(mobile&&!(await page.locator('#panel').locator('..').evaluate(el=>el.classList.contains('open'))))await page.locator('#tgPanel').tap();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);
 for(const r of requests){const u=new URL(r.url);assert.ok(u.origin===new URL(url).origin||u.host==='cdn.jsdelivr.net');}
 await fs.writeFile(`docs/qa/artifacts/f3-textures/${viewport.width}x${viewport.height}-metrics.json`,JSON.stringify({commitAtRun:commit,appFingerprint:fingerprint.digest('hex'),viewport,rendering:'Chromium SwiftShader software',metrics,consoleMessages,pageErrors:errors,failedRequests:failures},null,2)+'\n');
});

for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390}])test(`furniture search filters insertion persistence and touch/keyboard ${viewport.width}x${viewport.height}`,{timeout:120000},async t=>{
 const {page,errors,requests,mobile}=await setup(t,viewport);
 async function library(){if(mobile){if(!await page.locator('aside.lib').evaluate(el=>el.classList.contains('open')))await page.locator('#tgLib').tap();await page.waitForFunction(()=>document.querySelector('aside.lib').getBoundingClientRect().left>=-.5);}}
 await library();assert.equal(await page.locator('#searchResults .item').count(),63);
 const input=page.getByRole('searchbox',{name:'Buscar muebles'});await input.fill(' SOFÁ ');const accented=await page.locator('#searchResults .item').count();await input.fill('sofa');assert.equal(await page.locator('#searchResults .item').count(),accented);
 await input.fill('nevera');assert.equal(await page.locator('#searchResults .item').count(),2);
 await input.fill('silla');await page.locator('#searchRoom').selectOption('2');await page.locator('#searchFamily').selectOption('asientos');assert.equal(await page.locator('#searchResults .item').count(),1);assert.equal(await page.locator('#searchResults .item').getAttribute('data-key'),'2:3');
 await page.locator('#searchClear').click();assert.equal(await page.locator('#searchRoom').inputValue(),'2');assert.equal(await input.inputValue(),'');assert.equal(await input.evaluate(el=>el===document.activeElement),true);
 await page.locator('#searchAll').click();assert.equal(await page.locator('#searchResults .item').count(),63);assert.equal(await page.locator('#searchFamily').inputValue(),'');
 await input.fill('noexistezz');assert.equal(await page.locator('#searchResults .item').count(),0);assert.match(await page.locator('#searchCount').innerText(),/^0 resultados/);await page.locator('#searchEmptyReset').click();assert.equal(await page.locator('#searchResults .item').count(),63);
 await input.fill('bed');const card=page.locator('.item[data-key="0:0"]'),count=await page.evaluate(()=>FloorPlanApp.project.objects.length);assert.match(await card.innerText(),/Genérico/);
 if(mobile)await card.tap();else{await card.focus();await card.press('Enter');}
 assert.equal(await page.evaluate(()=>FloorPlanApp.project.objects.length),count+1);
 const generic=await page.evaluate(()=>structuredClone(FloorPlanApp.project.objects.at(-1)));assert.deepEqual(generic.size,{widthMm:1800,depthMm:2000,heightMm:1100});assert.equal(generic.type,'bed');assert.equal(generic.assetRef,undefined);
 for(const term of ['SONGESAND','pouf']){
  await library();await input.fill(term);assert.equal(await page.locator('#searchResults .item').count(),term==='SONGESAND'?1:2);const result=page.locator('#searchResults .item[data-key^="asset:"]');assert.match(await result.innerText(),/Modelo 3D autorizado/);assert.match(await result.innerText(),/IKEA/);
  const count=await page.evaluate(()=>FloorPlanApp.project.objects.length);if(mobile)await result.tap();else{await result.focus();await result.press('Space');}
  assert.equal(await page.evaluate(()=>FloorPlanApp.project.objects.length),count+1);
  const inserted=await page.evaluate(()=>structuredClone(FloorPlanApp.project.objects.at(-1)));assert.equal(inserted.assetRef.catalog,'immersphere-asset-lab');assert.deepEqual(inserted.size,term==='SONGESAND'?{widthMm:820,heightMm:810,depthMm:500}:{widthMm:690,heightMm:400,depthMm:650});
  await open3D(page);await page.waitForFunction(id=>View3D.assetStatus(id)?.state==='ready',inserted.id);assert.deepEqual(await page.evaluate(id=>FloorPlanApp.project.objects.find(o=>o.id===id),inserted.id),inserted);
  await page.click('[data-view="2d"]');await page.waitForFunction(()=>!document.body.classList.contains('busy'));await page.reload();await page.waitForFunction(()=>window.View3D&&FloorPlanAssetUI.ready);assert.deepEqual(await page.evaluate(id=>FloorPlanApp.project.objects.find(o=>o.id===id),inserted.id),inserted);
 }
 await library();await input.fill('lampara');assert.equal(await page.locator('#searchResults .item').count(),1);assert.equal(await page.locator('#searchResults .item').getAttribute('data-key'),'1:11');
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 const commit=(await run('git',['rev-parse','HEAD'])).stdout.trim();await page.evaluate(text=>{const e=document.createElement('div');e.textContent=text;e.style.cssText='position:fixed;bottom:0;left:0;background:white;font:9px monospace;z-index:99';document.body.append(e);},`Search QA / local SwiftShader / ${commit}`);
 await fs.mkdir('docs/qa/artifacts/furniture-search',{recursive:true});await page.screenshot({path:`docs/qa/artifacts/furniture-search/${viewport.width}x${viewport.height}.png`});
 await input.fill('ikea');assert.equal(await page.locator('#searchResults .item').count(),2);await page.screenshot({path:`docs/qa/artifacts/furniture-search/${viewport.width}x${viewport.height}-authorized.png`});
 await fs.writeFile(`docs/qa/artifacts/furniture-search/${viewport.width}x${viewport.height}-metrics.json`,JSON.stringify({commitAtRun:commit,viewport,rendering:'Chromium SwiftShader software',resultCounts:{all:63,authorizedQuery:2},pageErrors:errors,requests:requests.map(r=>({url:new URL(r.url).pathname,method:r.method,hasBody:!!r.body})),objects:await page.evaluate(()=>FloorPlanApp.project.objects.map(o=>({type:o.type,size:o.size,assetRef:o.assetRef})))},null,2)+'\n');
 assert.deepEqual(errors,[]);assert.ok(requests.every(r=>r.method==='GET'&&!r.body&&!new URL(r.url).search));t.diagnostic('Search remains local; 3D rendered with SwiftShader software.');
});

test('search keeps generics during catalog pending/exclusion and unavailable model fallback',{timeout:90000},async t=>{
 const {page,context,errors}=await setup(t);
 let release;const pending=new Promise(r=>release=r);
 await page.route('**/assets/f3/external.manifest.json',async route=>{await pending;const source=JSON.parse(await fs.readFile('assets/f3/external.manifest.json','utf8'));source.source[1].qaStatus='pending';await route.fulfill({contentType:'application/json',body:JSON.stringify(source)});});
 await page.reload({waitUntil:'domcontentloaded'});await page.waitForSelector('#furnitureSearch');assert.match(await page.locator('#searchCatalogState').innerText(),/Cargando catálogo/);assert.equal(await page.locator('#searchResults .item').count(),60);await page.locator('#furnitureSearch').fill('cama');assert.ok(await page.locator('#searchResults .item').count()>0);
 release();await page.waitForFunction(()=>FloorPlanAssetUI.ready);await page.locator('#searchAll').click();assert.equal(await page.locator('#searchResults .item').count(),62);await page.locator('#furnitureSearch').fill('stockholm');assert.equal(await page.locator('#searchResults .item').count(),0);
 await page.route('**/assets/f3/songesand-90366839.glb',r=>r.fulfill({status:404,body:'Missing'}));await page.locator('#furnitureSearch').fill('songesand');await page.locator('#searchResults .item').click();const inserted=await page.evaluate(()=>structuredClone(FloorPlanApp.project.objects.at(-1)));
 await open3D(page);await page.waitForFunction(id=>View3D.assetStatus(id)?.state==='error',inserted.id);assert.deepEqual(await page.evaluate(id=>FloorPlanApp.project.objects.find(o=>o.id===id),inserted.id),inserted);assert.match(await page.locator('#fAssetStatus').innerText(),/genérico/);assert.equal(await page.evaluate(()=>View3D.assetObjects.length),0);await page.click('[data-view="2d"]');assert.deepEqual(errors,[]);
 await page.unroute('**/assets/f3/external.manifest.json');await page.route('**/assets/f3/external.manifest.json',r=>r.fulfill({status:404,body:'Missing catalog'}));await page.reload();await page.waitForFunction(()=>FloorPlanAssetUI.ready);await page.locator('#searchAll').click();assert.equal(await page.locator('#searchResults .item').count(),61);assert.match(await page.locator('#searchCatalogState').innerText(),/genérico/);
});

for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390}])test(`protected preview session keeps both authorized catalogs and textured assets ${viewport.width}x${viewport.height}`,{timeout:120000},async t=>{
 const {page,context,errors,mobile}=await setup(t,viewport),responses=[];
 page.on('response',r=>{const p=new URL(r.url()).pathname;if(p.startsWith('/assets/f3/'))responses.push({path:p,status:r.status()});});
 await context.addCookies([{name:'qa-preview',value:'authorized',url,httpOnly:true,sameSite:'Lax'}]);protectedAssets=true;t.after(()=>{protectedAssets=false;});
 await page.reload();await page.waitForFunction(()=>FloorPlanAssetUI.ready);
 assert.equal(await page.evaluate(()=>FloorPlanAssetUI.entries.filter(e=>e.catalog==='immersphere-asset-lab').length),2,JSON.stringify({responses,error:await page.evaluate(()=>FloorPlanAssetUI.error)}));
 assert.equal(await page.evaluate(()=>FloorPlanAssetUI.entries.length),3);assert.equal(await page.evaluate(()=>FloorPlanAssetUI.error),null);
 for(const term of ['cómoda','puf']){
  if(mobile&&!await page.locator('aside.lib').evaluate(el=>el.classList.contains('open')))await page.locator('#tgLib').tap();
  if(mobile)await page.waitForFunction(()=>document.querySelector('aside.lib').getBoundingClientRect().left>=-.5);
  await page.locator('#furnitureSearch').fill(term);const card=page.locator('#searchResults .item[data-key^="asset:"]');assert.equal(await card.count(),1);assert.match(await card.innerText(),term==='cómoda'?/SONGESAND/:/STOCKHOLM/);assert.match(await card.innerText(),/Modelo 3D autorizado/);assert.ok(await page.locator('#searchResults .item[data-key^="asset:"]').count());
  await card.click();const object=await page.evaluate(()=>structuredClone(FloorPlanApp.project.objects.at(-1)));assert.deepEqual(object.size,term==='cómoda'?{widthMm:820,depthMm:500,heightMm:810}:{widthMm:690,depthMm:650,heightMm:400});
  await open3D(page);await page.waitForFunction(id=>['ready','error'].includes(View3D.assetStatus(id)?.state),object.id);const status=await page.evaluate(id=>View3D.assetStatus(id),object.id);assert.equal(status.state,'ready',JSON.stringify({status,responses}));assert.match(status.attribution,/IKEA/);assert.ok(status.textureStats.images>0);
  await page.click('[data-view="2d"]');await page.waitForFunction(()=>!document.body.classList.contains('busy'));
 }
 for(const p of ['/assets/f3/catalog.manifest.json','/assets/f3/external.manifest.json','/assets/f3/ASSET-LAB-PROVENANCE.txt','/assets/f3/songesand-90366839.glb','/assets/f3/stockholm-pouf-80586139.glb'])assert.ok(responses.some(r=>r.path===p&&r.status===200),p);
 assert.ok(responses.every(r=>r.status===200));assert.deepEqual(errors,[]);
 const commit=(await run('git',['rev-parse','HEAD'])).stdout.trim();await fs.mkdir('docs/qa/artifacts/f3-preview-auth',{recursive:true});await fs.writeFile(`docs/qa/artifacts/f3-preview-auth/${viewport.width}x${viewport.height}.json`,JSON.stringify({commitAtRun:commit,viewport,method:'Local browser with session-protected fixture server; SwiftShader software',responses,catalog:await page.evaluate(()=>FloorPlanAssetUI.diagnostics)},null,2)+'\n');
});

test('catalog failures and exclusions cannot silently leave generic search results',{timeout:90000},async t=>{
 const {page,errors,consoleMessages}=await setup(t);
 const manifest=JSON.parse(await fs.readFile('assets/f3/external.manifest.json','utf8'));
 const excluded=structuredClone(manifest);for(const e of excluded.source)e.qaStatus='pending';
 const cases=[
  {label:'HTTP 401',status:401,body:'Session required',contentType:'text/html',expect:/HTTP 401/},
  {label:'HTTP 404',status:404,body:'Not found',contentType:'text/html',expect:/HTTP 404/},
  {label:'HTML instead of JSON',status:200,body:'<!doctype html><title>Login</title>',contentType:'text/html',expect:/JSON inválido.*text\/html/},
  {label:'invalid identity',status:200,body:JSON.stringify({...manifest,catalogRevision:'invalid'}),contentType:'application/json',expect:/Adaptación: Invalid manifest identity/},
  {label:'excluded entries',status:200,body:JSON.stringify(excluded),contentType:'application/json',expect:/unsupported-or-unverified-resource/}
 ];
 for(const scenario of cases){
  await page.route('**/assets/f3/external.manifest.json',r=>r.fulfill({status:scenario.status,body:scenario.body,contentType:scenario.contentType}));await page.reload();await page.waitForFunction(()=>FloorPlanAssetUI.ready);
  const diagnostic=await page.evaluate(()=>FloorPlanAssetUI.diagnostics[1]);assert.equal(diagnostic.httpStatus,scenario.status);assert.match(diagnostic.reason,scenario.expect,scenario.label);assert.ok(['error','warning'].includes(diagnostic.state));
  assert.match(await page.locator('#searchCatalogState').innerText(),/assets\/f3\/external.manifest.json/);assert.match(await page.locator('#searchCatalogState').innerText(),scenario.expect);await page.locator('#furnitureSearch').fill('cómoda');assert.equal(await page.locator('#searchResults .item[data-key^="asset:"]').count(),0);assert.equal(await page.locator('#searchResults .item').count(),1);assert.match(await page.locator('#searchResults .item').innerText(),/Genérico/);
  await page.unroute('**/assets/f3/external.manifest.json');
 }
 await page.route('**/assets/f3/catalog.manifest.json',r=>r.fulfill({status:404,body:'Missing'}));await page.reload();await page.waitForFunction(()=>FloorPlanAssetUI.ready);assert.match(await page.locator('#searchCatalogState').innerText(),/assets\/f3\/catalog.manifest.json.*HTTP 404/);assert.equal(await page.evaluate(()=>FloorPlanAssetUI.entries.filter(e=>e.catalog==='immersphere-asset-lab').length),2);
 assert.ok(consoleMessages.some(m=>m.type==='warning'&&m.text.includes('F3 catálogo QA')));assert.deepEqual(errors,[]);
});
