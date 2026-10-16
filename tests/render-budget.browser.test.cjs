const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const {execFile}=require('node:child_process'),{promisify}=require('node:util'),run=promisify(execFile);
let server,browser,url;const cache=new Map();
const output=path.resolve(__dirname,'../qa-results/serra-r7-m16');
before(async()=>{const root=path.resolve(__dirname,'..');server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))throw Error('path');res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.webp')?'image/webp':file.endsWith('.png')?'image/png':'text/html');res.end(await fs.readFile(file));}catch{res.writeHead(404);res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;browser=await chromium.launch({executablePath:process.env.CHROME,headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});await fs.mkdir(output,{recursive:true});});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});
const median=values=>values.sort((a,b)=>a-b)[Math.floor(values.length/2)];
async function sample(page){const rows=await page.evaluate(async()=>{const out=[];for(let i=0;i<32;i++){await new Promise(resolve=>requestAnimationFrame(resolve));out.push({time:performance.now(),...View3D.renderBudget});}return out;});return {calls:median(rows.map(r=>r.calls)),triangles:median(rows.map(r=>r.triangles)),frameMs:median(rows.slice(1).map((r,i)=>r.time-rows[i].time)),geometries:rows.at(-1).geometries,textures:rows.at(-1).textures,meshes:rows.at(-1).meshes};}

test('M16 measure example draw calls with furniture, hidden furniture and restored scene',{timeout:120000},async t=>{
 const context=await browser.newContext({viewport:{width:1440,height:900}});t.after(()=>context.close());const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**',async route=>{const target=route.request().url();if(!cache.has(target))cache.set(target,run('curl',['--fail','--show-error','--max-time','30',target],{maxBuffer:4*1024*1024}).then(r=>r.stdout));await route.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await cache.get(target)});});await page.goto(url);await require('./editor-fixture.cjs')(page);
 const original=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));await page.locator('[data-view="3d"]').click();await page.waitForFunction(()=>window.View3D?.renderBudget?.calls>0&&window.View3D.lifecycleMetrics.pendingAssets===0&&!window.View3D.lifecycleMetrics.animating&&!window.View3D.lifecycleMetrics.flying,null,{timeout:30000});
 await page.locator('#vIso').click();await page.waitForFunction(()=>!View3D.lifecycleMetrics.animating&&!View3D.lifecycleMetrics.flying);
 assert.equal(await page.evaluate(()=>View3D.primitiveBatching),true);await page.evaluate(()=>View3D.setPrimitiveBatching(false));
 await page.waitForFunction(()=>View3D.lifecycleMetrics.pendingAssets===0,null,{timeout:30000});
 const camera=await page.evaluate(()=>View3D.cameraState),full=await sample(page);await page.screenshot({path:path.join(output,'example-full.png')});
 await page.locator('#toggles3d [data-t="furn"]').click();const empty=await sample(page);await page.screenshot({path:path.join(output,'example-hidden-furniture.png')});
 await page.locator('#toggles3d [data-t="furn"]').click();const restored=await sample(page);await page.screenshot({path:path.join(output,'example-restored.png')});
 await page.evaluate(()=>View3D.setPrimitiveBatching(true));await page.waitForFunction(()=>View3D.lifecycleMetrics.pendingAssets===0,null,{timeout:30000});const batched=await sample(page),summary=await page.evaluate(()=>View3D.primitiveBatchSummary);await page.screenshot({path:path.join(output,'example-batched.png')});
 const visual=await page.evaluate(async()=>{
   const pixels=async name=>{const image=await createImageBitmap(await(await fetch(`/qa-results/serra-r7-m16/${name}`)).blob()),canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const context=canvas.getContext('2d');context.drawImage(image,0,0);image.close();return context.getImageData(0,0,canvas.width,canvas.height).data;};
   const full=await pixels('example-full.png'),restored=await pixels('example-restored.png'),batched=await pixels('example-batched.png');
   const count=other=>{let changed=0;for(let i=0;i<full.length;i+=4)if(Math.max(Math.abs(full[i]-other[i]),Math.abs(full[i+1]-other[i+1]),Math.abs(full[i+2]-other[i+2]))>20)changed++;return changed;};
   return {restoredChangedPixels:count(restored),batchedChangedPixels:count(batched)};
 });
 assert.ok(visual.batchedChangedPixels<=visual.restoredChangedPixels+3000,`batch changed the scene: ${JSON.stringify(visual)}`);
 const hit=await page.evaluate(()=>{const r=document.querySelector('#view3d canvas').getBoundingClientRect();for(let yi=2;yi<=24;yi++)for(let xi=2;xi<=24;xi++){const x=r.left+r.width*xi/26,y=r.top+r.height*yi/26,id=View3D.pickFurnitureAt(x,y);if(id)return {x,y,id};}return null;});
 assert.ok(hit,'at least one visible batched furniture footprint must be pickable');await page.mouse.click(hit.x,hit.y);
 const selected=await page.evaluate(()=>FloorPlanApp.capturePresentationEntry().selection);assert.deepEqual(selected,{kind:'furn',id:hit.id});
 await page.evaluate(()=>View3D.setPrimitiveBatching(false));await page.waitForFunction(()=>View3D.lifecycleMetrics.pendingAssets===0,null,{timeout:30000});const unbatchedAgain=await sample(page);
 assert.ok(full.calls>empty.calls,`full ${full.calls}, hidden ${empty.calls}`);assert.equal(full.meshes.furniture,restored.meshes.furniture);assert.equal(empty.meshes.furniture,0);
 assert.ok(batched.calls<restored.calls,`batched ${batched.calls}, original ${restored.calls}`);assert.equal(unbatchedAgain.meshes.furniture,restored.meshes.furniture);
 assert.ok(summary.batches>0&&summary.instances>summary.batches);assert.equal(summary.unmapped,0);assert.equal(summary.fallbacks,0);assert.deepEqual(await page.evaluate(()=>View3D.cameraState),camera);
 assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),original);
 await page.evaluate(()=>View3D.setPrimitiveBatching(true));const stable=await sample(page),disposeStart=(await page.evaluate(()=>View3D.primitiveBatchSummary)).disposed;
 for(let i=0;i<3;i++){await page.evaluate(()=>View3D.setPrimitiveBatching(false));await sample(page);await page.evaluate(()=>View3D.setPrimitiveBatching(true));assert.equal((await sample(page)).geometries,stable.geometries);}
 const disposeEnd=(await page.evaluate(()=>View3D.primitiveBatchSummary)).disposed;assert.ok(disposeEnd-disposeStart>=summary.batches*3);
 await fs.writeFile(path.join(output,'draw-call-pilot.json'),JSON.stringify({full,hiddenFurniture:empty,restored,batched,summary,visual,unbatchedAgain,cycles:{count:3,stableGeometries:stable.geometries,disposed:disposeEnd-disposeStart}},null,2));assert.deepEqual(errors,[]);
 t.diagnostic(JSON.stringify({full,hiddenFurniture:empty,restored,batched,summary,unbatchedAgain}));
});
