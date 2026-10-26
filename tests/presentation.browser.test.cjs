const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const {execFile}=require('node:child_process'),{promisify}=require('node:util'),run=promisify(execFile),cache=new Map();
let server,url;
before(async()=>{const root=path.resolve(__dirname,'..');server=createServer(async(req,res)=>{
 try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))throw Error('path');
  res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':'text/html');res.end(await fs.readFile(file));}
 catch{res.writeHead(404);res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;});
after(async()=>new Promise(r=>server.close(r)));
async function setup(t,viewport,webgl=true){const browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});t.after(()=>browser.close());
 const page=await browser.newPage({viewport,isMobile:viewport.width<1000,hasTouch:viewport.width<1000}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**',async route=>{if(!webgl)return route.abort();const target=route.request().url();let p=cache.get(target);if(!p){p=require('./helpers/three-module.cjs')(target,()=>run('curl',['--fail','--silent','--show-error','--max-time','30',target],{maxBuffer:4*1024*1024}).then(r=>r.stdout));cache.set(target,p);}await route.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await p});});
 await page.goto(url);await page.waitForFunction(w=>window.FloorPlanPresentation&&(!w||window.View3D),webgl);await page.locator('#welcomeExample').click();return {page,errors};}
const state=page=>page.evaluate(()=>({project:JSON.stringify(FloorPlanApp.project),entry:FloorPlanApp.entryId,goal:FloorPlanGuideUI.state().goal,guideEvidence:JSON.stringify(FloorPlanGuideUI.state().evidence),undo:undoStack.length,redo:redoStack.length,selection:JSON.stringify(ui.sel),view:FloorPlanApp.viewMode}));
// One presentation entry at a time (#guidePresent in the guide row, or #presentationBtn in the guided header once the
// guide moves on, e.g. after a presented version): exactly one is visible, and it is the one a person would use.
// Playwright strict mode: the click fails if both entries are visible and waits if none is, so exactly one is required.
const presentEntry=async page=>page.locator('#guidePresent:visible, #presentationBtn:visible');
// Focus is on the one visible presentation entry: a single round trip (the 3D loop keeps the page busy under SwiftShader).
async function assertFocusOnEntry(page,message){const {active,ids}=await page.evaluate(()=>({active:document.activeElement?.id||'',ids:['guidePresent','presentationBtn'].filter(id=>{const e=document.getElementById(id);return e&&!e.closest('[hidden]')&&e.getClientRects().length>0;})}));
 assert.equal(ids.length,1,`one visible presentation entry, got ${JSON.stringify(ids)}`);assert.equal(active,ids[0],message);}
async function screenshot(page,name){const dir=process.env.PRESENTATION_ARTIFACTS||'qa-results/serra-r1';await fs.mkdir(dir,{recursive:true});await page.screenshot({path:path.join(dir,name+'.png')});}
for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390},{width:360,height:800}])test(`R2 P01/P02 search and closed-guide entry preserve the project ${viewport.width}x${viewport.height}`,{timeout:150000},async t=>{
 const {page,errors}=await setup(t,viewport),size=`${viewport.width}x${viewport.height}`,initial=await state(page),consoleErrors=[];
 page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text());});
 for(const query of ['presentar mi vivienda','tour','presentación en 3D']){
  await page.locator('#actionSearchBtn').click();await page.locator('#editorActionInput').fill(query);
  const option=page.locator('#editorActionResults [role=option]').first();assert.match(await option.textContent(),/Presentar mi vivienda/);
  if(query==='tour')await page.locator('#editorActionInput').press('Enter');else await option.click();
  assert.equal(await page.locator('#presentationConfig').evaluate(d=>d.open),true,`${query} opens presentation config`);
  assert.equal(await page.evaluate(()=>FloorPlanApp.viewMode),'2d');assert.deepEqual(await state(page),initial,`${query} does not change document or goal`);
  await screenshot(page,`${size}-p01-${query==='tour'?'tour':query==='presentar mi vivienda'?'presentar':'3d'}-config`);
  await page.locator('#presentationConfig').getByRole('button',{name:'Cancelar'}).click();assert.deepEqual(await state(page),initial);
 }
 await page.locator('#guidePresent').click();assert.equal(await page.locator('#presentationConfig').evaluate(d=>d.open),true);
 await page.locator('.presentation-room-row').nth(1).locator('input').check();
 await page.getByRole('button',{name:'Iniciar presentación'}).click();await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false',null,{timeout:30000});
 await page.locator('#presentationClose').click();await page.waitForFunction(()=>!FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').hidden);
 assert.deepEqual(await state(page),initial);
 await page.locator('#guideClose').click();assert.equal(await page.locator('#presentationBtn').isVisible(),true);
 const closedGuide=await state(page);await page.locator('#presentationBtn').click();assert.equal(await page.locator('#presentationConfig').evaluate(d=>d.open),true);
 assert.deepEqual(await page.locator('.presentation-room-row input:checked').count(),2,'same saved room selection after guide close');
 await screenshot(page,`${size}-p02-closed-guide-config`);
 await page.locator('#presentationConfig').getByRole('button',{name:'Cancelar'}).click();assert.deepEqual(await state(page),closedGuide);
 assert.deepEqual(errors,[]);assert.deepEqual(consoleErrors,[]);
});
async function presentationPng(page){
 const expected=await page.evaluate(()=>View3D.shotSize({size:'1280',aspect:'view'}));
 const pending=page.waitForEvent('download');await page.locator('#presentationCapture').click();const download=await pending;
 assert.match(download.suggestedFilename(),/3D\.png$/);
 const chunks=[];for await(const chunk of await download.createReadStream())chunks.push(chunk);const png=Buffer.concat(chunks);
 assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(png.subarray(12,16).toString(),'IHDR');
 assert.deepEqual([png.readUInt32BE(16),png.readUInt32BE(20)],[expected.width,expected.height]);
 const colours=await page.evaluate(async b64=>{const img=new Image();img.src='data:image/png;base64,'+b64;await img.decode();const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');x.drawImage(img,0,0,64,64);const d=x.getImageData(0,0,64,64).data,set=new Set();for(let i=0;i<d.length;i+=4)set.add(d[i]>>3<<10|d[i+1]>>3<<5|d[i+2]>>3);return set.size;},png.toString('base64'));
 assert.ok(colours>40,`rendered PNG has ${colours} colour buckets`);return png;
}
for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390},{width:360,height:800}])test(`R2 P13 presentation PNG is real and restores the view ${viewport.width}x${viewport.height}`,{timeout:150000},async t=>{
 const {page,errors}=await setup(t,viewport),size=`${viewport.width}x${viewport.height}`,before=await state(page),consoleErrors=[];
 page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text());});
 await (await presentEntry(page)).click();await page.getByRole('button',{name:'Iniciar presentación'}).click();
 await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false',null,{timeout:30000});
 const capture=page.locator('#presentationCapture'),expected=await page.evaluate(()=>View3D.shotSize({size:'1280',aspect:'view'}));
 assert.equal(await capture.textContent(),`Guardar PNG ${expected.width}×${expected.height}`);
 const rect=await capture.boundingBox();assert.ok(rect&&rect.x>=0&&rect.y>=0&&rect.x+rect.width<=viewport.width&&rect.y+rect.height<=viewport.height,`${size} capture visible`);
 const viewState=()=>page.evaluate(()=>({scene:View3D.presentationInspect(),canvas:View3D.canvasState,stop:document.querySelector('.presentation-status').textContent}));
 const stable=v=>JSON.parse(JSON.stringify(v,(_,x)=>typeof x==='number'?Math.round(x*1e8)/1e8:x));
 const general=await viewState(),generalPng=await presentationPng(page);assert.deepEqual(stable(await viewState()),stable(general));
 await screenshot(page,`${size}-p13-overview`);
 // Every state of the flight is recorded in the page, so a slow software renderer cannot hide it behind a slow click.
 await page.evaluate(()=>{const o=document.querySelector('#presentationOverlay'),c=document.querySelector('#presentationCapture');window.__motion=[];new MutationObserver(()=>window.__motion.push({moving:o.dataset.moving,captureDisabled:c.disabled})).observe(o,{attributes:true,attributeFilter:['data-moving']});});
 await page.getByRole('button',{name:'Siguiente →'}).click();
 await page.waitForFunction(()=>window.__motion.some(m=>m.moving==='true'),null,{timeout:30000});
 assert.deepEqual(await page.evaluate(()=>window.__motion.filter(m=>m.moving==='true').map(m=>m.captureDisabled).filter(d=>!d)),[],'capture serialized with camera motion');
 await page.waitForFunction(()=>document.querySelector('#presentationOverlay').dataset.moving==='false'&&document.querySelector('.presentation-status').textContent.includes('Vista 2'));
 const room=await viewState(),roomPng=await presentationPng(page);assert.deepEqual(stable(await viewState()),stable(room));
 assert.notDeepEqual(roomPng,generalPng,'room and overview render different images');
 await screenshot(page,`${size}-p13-room`);
 if(size==='390x844'){const dir=process.env.PRESENTATION_ARTIFACTS||'qa-results/serra-r1';await fs.writeFile(path.join(dir,'390x844-p13-room-download.png'),roomPng);}
 if(size==='360x800'){
  await page.setViewportSize({width:844,height:390});await page.waitForFunction(()=>{const canvas=View3D.canvasState,overlay=document.querySelector('#presentationOverlay');return canvas.width===844&&canvas.height>0&&Math.abs(View3D.cameraState.aspect-canvas.width/canvas.height)<.001&&overlay.dataset.moving==='false';});
  await page.waitForFunction(()=>!document.querySelector('#presentationCapture').disabled);
  const resized=await viewState(),resizedPng=await presentationPng(page);assert.deepEqual(stable(await viewState()),stable(resized));
  const dir=process.env.PRESENTATION_ARTIFACTS||'qa-results/serra-r1';await fs.writeFile(path.join(dir,'360-to-844-p13-room-download.png'),resizedPng);
  await screenshot(page,'360-to-844-p13-room');
 }
 await page.locator('#presentationClose').click();await page.waitForFunction(()=>!FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').hidden);
 assert.deepEqual(await state(page),before);assert.deepEqual(errors,[]);assert.deepEqual(consoleErrors,[]);
});
for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390},{width:360,height:800}])test(`presentation starts from a real room and restores 2D ${viewport.width}x${viewport.height}`,{timeout:120000},async t=>{
 const {page,errors}=await setup(t,viewport),size=`${viewport.width}x${viewport.height}`,beforeState=await state(page);
 const matches=await page.evaluate(()=>FloorPlanGuide.resolve('presentación en 3D').map(a=>a.id));assert.equal(matches[0],'presentation');
 await page.locator('#guidePresent').click();assert.equal(await page.locator('#presentationConfig').evaluate(d=>d.open),true);await screenshot(page,`${size}-config`);
 const startBox=await page.getByRole('button',{name:'Iniciar presentación'}).boundingBox();
 assert.ok(startBox&&startBox.y>=0&&startBox.y+startBox.height<=viewport.height,`${size}: start button inside viewport`);
 await page.getByRole('button',{name:'Iniciar presentación'}).click();await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false',null,{timeout:30000});
 assert.match(await page.locator('.presentation-progress').textContent(),/1 de 2 vistas visitadas/);
 await screenshot(page,`${size}-overview`);
 await page.getByRole('button',{name:'Siguiente →'}).click();await page.waitForFunction(()=>document.querySelector('.presentation-status')?.textContent?.includes('Vista 2')&&document.querySelector('#presentationOverlay').dataset.moving==='false');await screenshot(page,`${size}-room`);
 assert.match(await page.locator('.presentation-progress').textContent(),/2 de 2 vistas visitadas/);
 const layout=await page.evaluate(()=>({viewport:innerWidth,card:document.querySelector('.presentation-card').getBoundingClientRect().toJSON(),canvas:document.querySelector('#view3d canvas').getBoundingClientRect().toJSON(),roomId:FloorPlanPresentation.plan.stops[1].roomId}));
 assert.ok(layout.roomId);assert.ok(layout.card.left>=0&&layout.card.right<=layout.viewport);assert.ok(layout.canvas.left>=0&&layout.canvas.right<=layout.viewport);
 await page.locator('#presentationClose').click();await page.waitForFunction(()=>!FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').hidden);
 const afterState=await state(page);for(const key of Object.keys(beforeState))assert.ok(afterState[key]===beforeState[key],`${key} restored`);assert.deepEqual(errors,[]);
});

test('R2 P06/P12 manual jumps and revisits count completed stops without guide evidence',{timeout:120000},async t=>{
 const {page,errors}=await setup(t,{width:390,height:844}),beforeState=await state(page);
 const consoleErrors=[];page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text());});
 await (await presentEntry(page)).click();await page.locator('.presentation-room-row').nth(1).locator('input').check();
 await page.getByRole('button',{name:'Iniciar presentación'}).click();
 await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false',null,{timeout:30000});
 const progress=()=>page.locator('.presentation-progress').textContent();
 assert.match(await progress(),/1 de 3 vistas visitadas/);
 assert.equal(await page.getByRole('button',{name:'← Anterior'}).isDisabled(),true);
 await page.locator('.presentation-stops button').nth(2).click();
 await page.waitForFunction(()=>document.querySelector('.presentation-status').textContent.includes('Vista 3')&&document.querySelector('#presentationOverlay').dataset.moving==='false');
 assert.match(await progress(),/2 de 3 vistas visitadas/);
 assert.equal(await page.getByRole('button',{name:'Siguiente →'}).isDisabled(),true);
 await page.getByRole('button',{name:'← Anterior'}).click();
 await page.waitForFunction(()=>document.querySelector('.presentation-status').textContent.includes('Vista 2')&&document.querySelector('#presentationOverlay').dataset.moving==='false');
 assert.match(await progress(),/3 de 3 vistas visitadas/);
 await page.locator('.presentation-stops button').first().click();
 await page.waitForFunction(()=>document.querySelector('.presentation-status').textContent.includes('Vista 1')&&document.querySelector('#presentationOverlay').dataset.moving==='false');
 assert.match(await progress(),/3 de 3 vistas visitadas/);
 assert.equal(await page.getByRole('button',{name:'← Anterior'}).isDisabled(),true);
 await page.locator('#presentationClose').click();await page.waitForFunction(()=>!FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').hidden);
 assert.deepEqual(await state(page),beforeState);assert.deepEqual(errors,[]);assert.deepEqual(consoleErrors,[]);
 await (await presentEntry(page)).click();await page.getByRole('button',{name:'Iniciar presentación'}).click();
 await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false');
 assert.match(await progress(),/1 de 3 vistas visitadas/);
 await page.locator('#presentationClose').click();await page.waitForFunction(()=>!FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').hidden);
 assert.deepEqual(await state(page),beforeState);
});

for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390},{width:360,height:800}])test(`R2 P11 missing GLB keeps generic furniture and warns ${viewport.width}x${viewport.height}`,{timeout:120000},async t=>{
 const {page,errors}=await setup(t,viewport),size=`${viewport.width}x${viewport.height}`;
 await page.waitForFunction(()=>FloorPlanAssetUI?.ready);
 const target=await page.evaluate(()=>{
  const entry=FloorPlanAssetUI.entries.find(e=>e.url.includes('songesand'));if(!entry)throw Error('Missing authorized fixture');
  mutate(()=>{project.objects[0].assetRef={catalog:entry.catalog,assetId:entry.id,catalogRevision:entry.revision};});
  return {id:project.objects[0].id,url:entry.url};
 });
 await page.route('**/assets/f3/*.glb',route=>route.fulfill({status:404,body:'Missing'}));
 const beforeState=await state(page);
 await (await presentEntry(page)).click();await page.getByRole('button',{name:'Iniciar presentación'}).click();
 await page.waitForFunction(id=>FloorPlanPresentation.active&&View3D.assetStatus(id)?.state==='error',target.id,{timeout:30000});
 await page.waitForFunction(()=>document.querySelector('#presentationOverlay').dataset.moving==='false');
 assert.match(await page.locator('.presentation-warning').textContent(),/se muestran muebles genéricos/);
 assert.equal(await page.locator('.presentation-warning').isVisible(),true);
 assert.equal(await page.evaluate(id=>View3D.assetObjects.some(o=>o.id===id),target.id),false);
 await screenshot(page,`${size}-asset-fallback`);
 await page.getByRole('button',{name:'Siguiente →'}).click();await page.waitForFunction(()=>document.querySelector('#presentationOverlay').dataset.moving==='false');
 await page.locator('#presentationClose').click();await page.waitForFunction(()=>!FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').hidden);
 assert.deepEqual(await state(page),beforeState);assert.deepEqual(errors,[]);
});

test('R2 P11 corrupt GLB also keeps the generic and the project',{timeout:90000},async t=>{
 const {page,errors}=await setup(t,{width:390,height:844});await page.waitForFunction(()=>FloorPlanAssetUI?.ready);
 const id=await page.evaluate(()=>{const entry=FloorPlanAssetUI.entries.find(e=>e.url.includes('songesand'));mutate(()=>{project.objects[0].assetRef={catalog:entry.catalog,assetId:entry.id,catalogRevision:entry.revision};});return project.objects[0].id;});
 await page.route('**/assets/f3/*.glb',route=>route.fulfill({status:200,contentType:'model/gltf-binary',body:'invalid GLB bytes'}));
 const beforeState=await state(page);await (await presentEntry(page)).click();await page.getByRole('button',{name:'Iniciar presentación'}).click();
 await page.waitForFunction(id=>FloorPlanPresentation.active&&View3D.assetStatus(id)?.state==='error',id,{timeout:30000});
 assert.equal(await page.locator('.presentation-warning').isVisible(),true);
 await page.locator('#presentationClose').click();await page.waitForFunction(()=>!FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').hidden);
 assert.deepEqual(await state(page),beforeState);assert.deepEqual(errors,[]);
});

for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390},{width:360,height:800}])test(`R2 P11 WebGL context loss returns intact 2D ${viewport.width}x${viewport.height}`,{timeout:120000},async t=>{
 const {page,errors}=await setup(t,viewport),size=`${viewport.width}x${viewport.height}`,beforeState=await state(page);
 const consoleErrors=[];page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text());});
 await (await presentEntry(page)).click();await page.getByRole('button',{name:'Iniciar presentación'}).click();
 await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false',null,{timeout:30000});
 const extension=await page.evaluate(()=>{const canvas=document.querySelector('#view3d canvas'),gl=canvas.getContext('webgl2')||canvas.getContext('webgl');const ext=gl?.getExtension('WEBGL_lose_context');if(ext)ext.loseContext();else canvas.dispatchEvent(new Event('webglcontextlost',{cancelable:true}));return !!ext;});
 await page.waitForFunction(()=>!FloorPlanPresentation.active&&FloorPlanApp.viewMode==='2d'&&document.querySelector('#presentationOverlay').hidden&&!document.body.classList.contains('m3d')&&getComputedStyle(document.querySelector('#plan')).opacity==='1',null,{timeout:30000});
 assert.ok(await page.locator('#plan .room').count()>0,'2D rooms remain visible');
 await page.waitForFunction(()=>{const stage=document.querySelector('#stage').getBoundingClientRect(),rooms=[...document.querySelectorAll('#plan .room')].map(el=>el.getBoundingClientRect());return rooms.length>0&&rooms.every(r=>r.left>=stage.left-2&&r.right<=stage.right+2&&r.top>=stage.top-2&&r.bottom<=stage.bottom+2);});
 assert.equal(await page.evaluate(()=>View3D.contextAvailable),false);
 assert.match(await page.locator('#toast').textContent(),/El plano sigue disponible en 2D/);
 await screenshot(page,`${size}-context-loss-2d`);
 assert.deepEqual(await state(page),beforeState);assert.deepEqual(errors,[]);assert.deepEqual(consoleErrors,[]);
 await (await presentEntry(page)).click();await page.getByRole('button',{name:'Iniciar presentación'}).click();
 await page.waitForFunction(()=>!FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').hidden&&!document.body.classList.contains('busy'));
 assert.equal(await page.evaluate(()=>FloorPlanApp.viewMode),'2d');
 assert.deepEqual(await state(page),beforeState);
 if(!extension)t.diagnostic('WEBGL_lose_context unavailable; synthetic context-loss event used');
});

test('R2 P11 context loss while 3D starts cannot reopen the presentation',{timeout:90000},async t=>{
 const {page,errors}=await setup(t,{width:390,height:844}),beforeState=await state(page);
 await (await presentEntry(page)).click();await page.getByRole('button',{name:'Iniciar presentación'}).click();
 await page.waitForFunction(()=>!!document.querySelector('#view3d canvas'),null,{timeout:20000});
 await page.evaluate(()=>{const canvas=document.querySelector('#view3d canvas'),gl=canvas.getContext('webgl2')||canvas.getContext('webgl');const ext=gl?.getExtension('WEBGL_lose_context');if(ext)ext.loseContext();else canvas.dispatchEvent(new Event('webglcontextlost',{cancelable:true}));});
 await page.waitForFunction(()=>!FloorPlanPresentation.active&&FloorPlanApp.viewMode==='2d'&&document.querySelector('#presentationOverlay').hidden&&!document.body.classList.contains('busy')&&getComputedStyle(document.querySelector('#plan')).opacity==='1',null,{timeout:30000});
 assert.deepEqual(await state(page),beforeState);assert.deepEqual(errors,[]);
});

test('R2 P14 reduced motion and four resize aspects keep the active stop framed',{timeout:120000},async t=>{
 const {page,errors}=await setup(t,{width:1440,height:900}),beforeState=await state(page);
 const consoleErrors=[];page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text());});
 await page.emulateMedia({reducedMotion:'reduce'});
 await (await presentEntry(page)).click();await page.getByRole('button',{name:'Iniciar presentación'}).click();
 await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false',null,{timeout:30000});
 await page.locator('.presentation-stops button').nth(1).click();
 assert.equal(await page.locator('#presentationOverlay').getAttribute('data-moving'),'false','reduced-motion jump resolves without tour animation');
 for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390},{width:360,height:800}]){
  await page.setViewportSize(viewport);
  await page.waitForFunction(target=>{const canvas=document.querySelector('#view3d canvas').getBoundingClientRect(),scene=View3D.presentationInspect();return Math.abs(canvas.width-target.width)<1&&document.querySelector('#presentationOverlay').dataset.moving==='false'&&Math.abs(scene.aspect-canvas.width/canvas.height)<.03;},viewport);
  const info=await page.evaluate(()=>{const canvas=document.querySelector('#view3d canvas').getBoundingClientRect(),card=document.querySelector('.presentation-card').getBoundingClientRect(),scene=View3D.presentationInspect();return {canvas:canvas.toJSON(),card:card.toJSON(),aspect:scene.aspect,fly:View3D.lifecycleMetrics.flying};});
  assert.ok(info.canvas.left>=0&&info.canvas.right<=viewport.width&&info.canvas.width>0&&info.canvas.height>0);
  assert.ok(info.card.left>=0&&info.card.right<=viewport.width&&info.card.top>=0&&info.card.bottom<=viewport.height);
  assert.equal(info.fly,false);await screenshot(page,`${viewport.width}x${viewport.height}-reduced-resize-room`);
 }
 await page.locator('#presentationClose').click();await page.waitForFunction(()=>!FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').hidden);
 assert.deepEqual(await state(page),beforeState);assert.deepEqual(errors,[]);assert.deepEqual(consoleErrors,[]);
});

test('R2 P14 presentation entered from 3D restores camera and final viewport aspect',{timeout:90000},async t=>{
 const {page,errors}=await setup(t,{width:390,height:844});
 await page.locator('[data-view="3d"]').click();await page.waitForFunction(()=>FloorPlanApp.viewMode==='3d'&&!document.body.classList.contains('busy'));
 const beforeState=await state(page),camera=await page.evaluate(()=>View3D.presentationInspect());
 await (await presentEntry(page)).click();await page.getByRole('button',{name:'Iniciar presentación'}).click();
 await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false');
 await page.setViewportSize({width:844,height:390});
 await page.waitForFunction(()=>document.querySelector('#presentationOverlay').dataset.moving==='false'&&Math.abs(View3D.presentationInspect().aspect-document.querySelector('#view3d canvas').getBoundingClientRect().width/document.querySelector('#view3d canvas').getBoundingClientRect().height)<.03);
 await page.locator('#presentationClose').click();await page.waitForFunction(()=>!FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').hidden&&FloorPlanApp.viewMode==='3d');
 await page.waitForFunction(()=>{const c=document.querySelector('#view3d canvas').getBoundingClientRect();return Math.abs(View3D.presentationInspect().aspect-c.width/c.height)<.03;});
 const after=await page.evaluate(()=>({scene:View3D.presentationInspect(),css:document.querySelector('#view3d canvas').getBoundingClientRect().toJSON(),pixelRatio:View3D.canvasState.pixelRatio}));
 const restored=after.scene;
 for(const key of ['position','target','quaternion'])for(let i=0;i<camera[key].length;i++)assert.ok(Math.abs(restored[key][i]-camera[key][i])<.0001,`${key}[${i}] restored`);
 assert.equal(restored.fov,camera.fov);assert.deepEqual(restored.options,camera.options);assert.deepEqual(restored.doors,camera.doors);
 assert.ok(Math.abs(restored.aspect-after.css.width/after.css.height)<.03);
 assert.equal(restored.canvas.width,Math.round(after.css.width*after.pixelRatio));assert.equal(restored.canvas.height,Math.round(after.css.height*after.pixelRatio));
 assert.deepEqual(await state(page),beforeState);assert.deepEqual(errors,[]);
});

test('R2 P15 ten presentation cycles release their loop and keep renderer memory stable',{timeout:180000},async t=>{
 const {page,errors}=await setup(t,{width:390,height:844}),beforeState=await state(page);
 const consoleErrors=[];page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text());});
 const metrics=[];
 for(let cycle=0;cycle<=10;cycle++){
  await (await presentEntry(page)).click();await page.getByRole('button',{name:'Iniciar presentación'}).click();
  await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false',null,{timeout:30000});
  await page.locator('.presentation-stops button').nth(1).click();
  await page.waitForFunction(()=>document.querySelector('#presentationOverlay').dataset.moving==='false'&&document.querySelector('.presentation-status').textContent.includes('Vista 2'));
  if(cycle===10)await screenshot(page,'390x844-ten-cycles-room');
  await page.locator('#presentationClose').click();
  await page.waitForFunction(()=>!FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').hidden&&FloorPlanApp.viewMode==='2d'&&!document.body.classList.contains('busy'));
  const measure=await page.evaluate(()=>({memory:View3D.rendererMemory,lifecycle:View3D.lifecycleMetrics,history:history.length}));metrics.push(measure);
  assert.deepEqual(measure.lifecycle,{loopActive:false,animating:false,flying:false,pendingAssets:0},`cycle ${cycle} releases work`);
  assert.deepEqual(await state(page),beforeState,`cycle ${cycle} restores document`);
 }
 t.diagnostic(`cycle renderer memory=${JSON.stringify(metrics.map(m=>m.memory))}`);
 const warm=metrics[0];for(let i=1;i<metrics.length;i++){
  assert.equal(metrics[i].memory.geometries,warm.memory.geometries,`cycle ${i} geometry count stable`);
  assert.equal(metrics[i].memory.textures,warm.memory.textures,`cycle ${i} texture count stable`);
  assert.equal(metrics[i].history,warm.history,`cycle ${i} does not grow history`);
 }
 t.diagnostic(`renderer memory warm=${JSON.stringify(warm.memory)} final=${JSON.stringify(metrics.at(-1).memory)}`);
 await screenshot(page,'390x844-ten-cycles-2d');
 assert.deepEqual(errors,[]);assert.deepEqual(consoleErrors,[]);
});

for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390},{width:360,height:800}])test(`R2 P16 long HTML-like room name stays text and controls fit ${viewport.width}x${viewport.height}`,{timeout:120000},async t=>{
 const {page,errors}=await setup(t,viewport),size=`${viewport.width}x${viewport.height}`;
 const name='<script>window.__presentationInjected=1</script> &amp; Á住宅 '+('SinEspacios'.repeat(3));
 await page.evaluate(value=>mutate(()=>{project.rooms.find(r=>r.id===FloorPlanApp.geometry.rooms[0].id).name=value;}),name);
 const beforeState=await state(page),beforeScripts=await page.locator('script').count();
 await (await presentEntry(page)).click();
 assert.equal(await page.locator('.presentation-room-row').first().locator('span').textContent(),name);
 assert.equal(await page.locator('#presentationConfig script').count(),0);
 await screenshot(page,`${size}-long-name-config`);
 await page.getByRole('button',{name:'Iniciar presentación'}).click();
 await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false',null,{timeout:30000});
 await page.locator('.presentation-stops button').nth(1).click();
 await page.waitForFunction(()=>document.querySelector('#presentationOverlay').dataset.moving==='false'&&document.querySelector('.presentation-status').textContent.includes('Vista 2'));
 assert.equal(await page.locator('.presentation-card h2').textContent(),name);
 assert.equal(await page.locator('.presentation-stops button').nth(1).textContent(),name);
 const bounds=await page.evaluate(()=>{const card=document.querySelector('.presentation-card'),button=document.querySelector('.presentation-stops button:last-child'),close=document.querySelector('#presentationClose');return {viewport:{width:innerWidth,height:innerHeight},card:card.getBoundingClientRect().toJSON(),close:close.getBoundingClientRect().toJSON(),stop:button.getBoundingClientRect().toJSON(),stopContentFits:button.scrollWidth<=button.clientWidth+1,overflow:document.documentElement.scrollWidth>innerWidth,executed:window.__presentationInjected};});
 assert.equal(bounds.executed,undefined);assert.equal(await page.locator('script').count(),beforeScripts);
 assert.equal(bounds.overflow,false,'no page horizontal overflow');
 assert.ok(bounds.card.left>=0&&bounds.card.right<=bounds.viewport.width&&bounds.card.top>=0&&bounds.card.bottom<=bounds.viewport.height,'presentation card fits viewport');
 assert.ok(bounds.close.left>=0&&bounds.close.right<=bounds.viewport.width&&bounds.close.top>=0&&bounds.close.bottom<=bounds.viewport.height,'close button fits viewport');
 assert.ok(bounds.stop.left>=bounds.card.left&&bounds.stop.right<=bounds.card.right&&bounds.stopContentFits,'stop button text fits card');
 assert.ok(bounds.stop.top>=bounds.card.top&&bounds.stop.bottom<=bounds.card.bottom,`selected stop remains visible within card ${JSON.stringify(bounds)}`);
 await screenshot(page,`${size}-long-name-room`);
 await page.locator('#presentationClose').click();await page.waitForFunction(()=>!FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').hidden);
 assert.deepEqual(await state(page),beforeState);assert.deepEqual(errors,[]);
});

test('3D camera, focus and editor state return after Escape and browser Back',{timeout:120000},async t=>{
 const {page,errors}=await setup(t,{width:1440,height:900});
 await page.locator('[data-view="3d"]').click();await page.waitForFunction(()=>FloorPlanApp.viewMode==='3d'&&!document.body.classList.contains('busy'));
 const beforeState=await state(page),camera=await page.evaluate(()=>View3D.presentationInspect());
 for(const exit of ['Escape','Back']){
  await (await presentEntry(page)).click();await page.getByRole('button',{name:'Iniciar presentación'}).click();
  await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false');
  await page.getByRole('button',{name:'Siguiente →'}).click();await page.waitForFunction(()=>document.querySelector('#presentationOverlay').dataset.moving==='false');
  if(exit==='Escape')await page.keyboard.press('Escape');else await page.goBack();
  await page.waitForFunction(()=>!FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').hidden&&!document.body.classList.contains('presentation-exiting'));
  const afterState=await state(page);for(const key of Object.keys(beforeState))assert.ok(afterState[key]===beforeState[key],`${exit}: ${key} restored`);
  const restored=await page.evaluate(()=>View3D.presentationInspect());for(const key of ['position','quaternion','target'])for(let i=0;i<restored[key].length;i++)assert.ok(Math.abs(restored[key][i]-camera[key][i])<1e-5,`${exit}: camera ${key}[${i}]`);
  assert.ok(Math.abs(restored.fov-camera.fov)<1e-5);assert.equal(restored.aspect,camera.aspect);
  assert.deepEqual(restored.options,camera.options);assert.deepEqual(restored.doors,camera.doors);assert.deepEqual(restored.canvas,camera.canvas);
  await assertFocusOnEntry(page);
 }
 assert.deepEqual(errors,[]);
});

test('R2 P08 walk pointer lock releases for presentation and needs a new gesture on return',{timeout:120000},async t=>{
 const {page,errors}=await setup(t,{width:1440,height:900}),consoleErrors=[];
 page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text());});
 await page.locator('#guideClose').click();
 await page.locator('[data-view="3d"]').click();await page.waitForFunction(()=>FloorPlanApp.viewMode==='3d'&&!document.body.classList.contains('busy'));
 await page.locator('[data-mode="walk"]').click();assert.equal(await page.evaluate(()=>View3D.walking()),true);
 await page.locator('#walkOverlay').click();await page.waitForFunction(()=>!!document.pointerLockElement);
 const before=await state(page),scene=await page.evaluate(()=>View3D.presentationInspect());
 await screenshot(page,'1440x900-p08-walk-locked');
 await page.locator('#presentationBtn').focus();await page.locator('#presentationBtn').press('Enter');
 assert.equal(await page.locator('#presentationConfig').evaluate(d=>d.open),true);
 await page.getByRole('button',{name:'Iniciar presentación'}).focus();await page.getByRole('button',{name:'Iniciar presentación'}).press('Enter');
 await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false');
 assert.equal(await page.evaluate(()=>document.pointerLockElement),null,'presentation releases pointer lock');
 assert.equal(await page.evaluate(()=>View3D.presentationInspect().options.mode),'orbit');
 await screenshot(page,'1440x900-p08-walk-presentation');
 await page.locator('#presentationClose').click();await page.waitForFunction(()=>!FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').hidden);
 const restored=await page.evaluate(()=>View3D.presentationInspect());
 assert.deepEqual(restored.options,scene.options);assert.deepEqual(restored.doors,scene.doors);
 for(const key of ['position','quaternion','target'])for(let i=0;i<scene[key].length;i++)assert.ok(Math.abs(restored[key][i]-scene[key][i])<1e-5,`walk ${key}[${i}] restored`);
 assert.deepEqual(await state(page),before);assert.equal(await page.evaluate(()=>document.pointerLockElement),null,'return does not grab pointer without gesture');
 assert.equal(await page.locator('#walkOverlay').isVisible(),true,'walk ready for new gesture');
 await screenshot(page,'1440x900-p08-walk-returned');
 await page.locator('#walkOverlay').click();await page.waitForFunction(()=>!!document.pointerLockElement);
 assert.deepEqual(errors,[]);assert.deepEqual(consoleErrors,[]);
});

for(const viewport of [{width:390,height:844},{width:844,height:390},{width:360,height:800}])test(`R2 P08 touch walk stops and resumes by gesture ${viewport.width}x${viewport.height}`,{timeout:120000},async t=>{
 const {page,errors}=await setup(t,viewport),consoleErrors=[],size=`${viewport.width}x${viewport.height}`;
 page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text());});
 await page.locator('#guideClose').click();await page.locator('[data-view="3d"]').click();
 await page.waitForFunction(()=>FloorPlanApp.viewMode==='3d'&&!document.body.classList.contains('busy'));
 await page.locator('[data-mode="walk"]').click();await page.locator('#walkOverlay').click();
 assert.equal(await page.locator('#joy').isVisible(),true,'touch joystick active before presentation');
 const before=await state(page),scene=await page.evaluate(()=>View3D.presentationInspect());
 await screenshot(page,`${size}-p08-touch-walk`);
 await page.locator('#presentationBtn').click();await page.getByRole('button',{name:'Iniciar presentación'}).click();
 await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false');
 assert.equal(await page.locator('#joy').isVisible(),false,'touch joystick released in presentation');
 assert.equal(await page.evaluate(()=>View3D.presentationInspect().options.mode),'orbit');
 await screenshot(page,`${size}-p08-touch-presentation`);
 if(size==='360x800'){
  await page.setViewportSize({width:844,height:390});
  await page.waitForFunction(()=>{const c=View3D.cameraState,s=document.querySelector('#stage'),canvas=View3D.canvasState;return s.clientWidth===844&&Math.abs(c.aspect-s.clientWidth/s.clientHeight)<.001&&canvas.width===s.clientWidth&&document.querySelector('#presentationOverlay').dataset.moving==='false';});
  await screenshot(page,'360-to-844-p08-touch-resized');
 }
 await page.locator('#presentationClose').click();await page.waitForFunction(()=>!FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').hidden);
 const restored=await page.evaluate(()=>View3D.presentationInspect());
 assert.deepEqual(restored.options,scene.options);assert.deepEqual(restored.doors,scene.doors);
 for(const key of ['position','quaternion','target'])for(let i=0;i<scene[key].length;i++)assert.ok(Math.abs(restored[key][i]-scene[key][i])<1e-5,`${size} walk ${key}[${i}] restored`);
 assert.deepEqual(await state(page),before);assert.equal(await page.locator('#joy').isVisible(),false,'touch walk not resumed without gesture');
 assert.equal(await page.locator('#walkOverlay').isVisible(),true,'walk can resume by touch');
 const stageAspect=await page.locator('#stage').evaluate(s=>s.clientWidth/s.clientHeight);
 assert.ok(Math.abs(restored.aspect-stageAspect)<.001,`${size} walk camera matches current 3D viewport`);
 await screenshot(page,`${size}-p08-touch-returned`);
 await page.locator('#walkOverlay').click();assert.equal(await page.locator('#joy').isVisible(),true,'new gesture resumes touch walk');
 assert.deepEqual(errors,[]);assert.deepEqual(consoleErrors,[]);
});

test('Escape during 3D loading cancels without a late presentation',{timeout:120000},async t=>{
 const {page,errors}=await setup(t,{width:390,height:844}),beforeState=await state(page);
 await (await presentEntry(page)).click();await page.getByRole('button',{name:'Iniciar presentación'}).click();await page.keyboard.press('Escape');
 await page.waitForFunction(()=>!FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').hidden&&!document.body.classList.contains('busy'),null,{timeout:30000});
 const afterState=await state(page);for(const key of Object.keys(beforeState))assert.ok(afterState[key]===beforeState[key],`${key} restored after cancel`);
 assert.deepEqual(errors,[]);
});

for(const {viewport,exit} of [
 {viewport:{width:1440,height:900},exit:'Back'},
 {viewport:{width:390,height:844},exit:'Close'},
 {viewport:{width:844,height:390},exit:'Escape'},
 {viewport:{width:360,height:800},exit:'Back'}
])test(`R2 P07 ${exit} while 2D presentation is loading restores editor ${viewport.width}x${viewport.height}`,{timeout:120000},async t=>{
 const {page,errors}=await setup(t,viewport),beforeState=await state(page),consoleErrors=[],size=`${viewport.width}x${viewport.height}`;
 page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text());});
 await page.evaluate(()=>{const enter=FloorPlanApp.enterPresentation3D;FloorPlanApp.enterPresentation3D=async()=>{const ok=await enter();await new Promise(resolve=>window.releaseP07Load=resolve);return ok;};});
 await (await presentEntry(page)).click();await page.getByRole('button',{name:'Iniciar presentación'}).click();
 await page.waitForFunction(()=>typeof window.releaseP07Load==='function');
 assert.equal(await page.locator('#presentationOverlay').isVisible(),true);
 await screenshot(page,`${size}-p07-${exit.toLowerCase()}-loading`);
 if(exit==='Back')await page.goBack();else if(exit==='Close')await page.locator('#presentationClose').click();else await page.keyboard.press('Escape');
 await page.evaluate(()=>window.releaseP07Load());
 await page.waitForFunction(()=>!FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').hidden&&!document.body.classList.contains('busy'));
 await page.waitForFunction(()=>location.hash==='#editor');
 await page.waitForTimeout(750);
 assert.equal(await page.locator('#presentationOverlay').isVisible(),false,'no late reopening after load cancellation');
 await screenshot(page,`${size}-p07-${exit.toLowerCase()}-returned`);
 assert.equal(new URL(page.url()).hash,'#editor',`${exit} consumes presentation entry during load`);
 assert.deepEqual(await state(page),beforeState);await assertFocusOnEntry(page);
 assert.deepEqual(errors,[]);assert.deepEqual(consoleErrors,[]);
});

for(const {viewport,exit} of [
 {viewport:{width:1440,height:900},exit:'Close'},
 {viewport:{width:390,height:844},exit:'Back'},
 {viewport:{width:844,height:390},exit:'Escape'},
 {viewport:{width:360,height:800},exit:'Close'}
])test(`R2 P07 ${exit} during room flight restores editor ${viewport.width}x${viewport.height}`,{timeout:120000},async t=>{
 const {page,errors}=await setup(t,viewport),beforeState=await state(page),consoleErrors=[],size=`${viewport.width}x${viewport.height}`;
 page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text());});
 await (await presentEntry(page)).click();await page.getByRole('button',{name:'Iniciar presentación'}).click();
 await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false');
 // The exit is fired by the page itself the moment the flight starts, so it really happens during the flight whatever
 // the renderer speed; the recorded state proves it.
 await page.evaluate(exit=>{const o=document.querySelector('#presentationOverlay');window.__exitAt=null;const mo=new MutationObserver(()=>{if(o.dataset.moving!=='true'||window.__exitAt)return;window.__exitAt={moving:o.dataset.moving,active:FloorPlanPresentation.active};mo.disconnect();
  if(exit==='Back')history.back();else if(exit==='Close')document.querySelector('#presentationClose').click();else document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));});mo.observe(o,{attributes:true,attributeFilter:['data-moving']});},exit);
 await page.locator('.presentation-stops button').nth(1).click();
 await page.waitForFunction(()=>window.__exitAt,null,{timeout:30000});
 assert.deepEqual(await page.evaluate(()=>window.__exitAt),{moving:'true',active:true},'exit during the room flight');
 await page.waitForFunction(()=>!FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').hidden&&location.hash==='#editor');
 await page.waitForTimeout(750);
 assert.equal(await page.locator('#presentationOverlay').isVisible(),false,'late flight cannot reopen presentation');
 await screenshot(page,`${size}-p07-${exit.toLowerCase()}-flight-returned`);
 assert.deepEqual(await state(page),beforeState);await assertFocusOnEntry(page);
 assert.deepEqual(errors,[]);assert.deepEqual(consoleErrors,[]);
});

test('missing 3D runtime returns to the 2D document with an explanation',{timeout:45000},async t=>{
 const {page}=await setup(t,{width:390,height:844},false),beforeState=await state(page);
 await (await presentEntry(page)).click();await page.getByRole('button',{name:'Iniciar presentación'}).click();
 await page.waitForFunction(()=>document.querySelector('#presentationOverlay').hidden&&!document.body.classList.contains('presentation-exiting'));
 const afterState=await state(page);for(const key of Object.keys(beforeState))assert.ok(afterState[key]===beforeState[key],`${key} restored without 3D`);
 assert.ok((await page.locator('#toast').textContent()).includes('3D no disponible'));
});

for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390},{width:360,height:800}])test(`R2 P03 empty project explains layout in both entry paths ${viewport.width}x${viewport.height}`,{timeout:60000},async t=>{
 const {page,errors}=await setup(t,viewport),size=`${viewport.width}x${viewport.height}`,consoleErrors=[];
 page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text());});
 await page.locator('#welcomeBtn').click();await page.locator('#welcomeBlank').click();await page.locator('#roomDesignCancel').click();
 if(await page.locator('#welcomeDialog').evaluate(d=>d.open))await page.locator('#welcomeReturn').click();
 const beforeState=await state(page);assert.equal(await page.evaluate(()=>FloorPlanApp.project.rooms.length),0);
 await page.locator('#actionSearchBtn').click();await page.fill('#editorActionInput','presentar mi vivienda');await page.locator('#editorActionResults [role=option]').first().click();
 assert.equal(await page.locator('#presentationConfig').evaluate(d=>d.open),true);
 assert.ok((await page.locator('#presentationConfig').textContent()).includes('Primero crea una estancia'));
 assert.equal(await page.locator('#presentationConfig').getByRole('button',{name:'Iniciar presentación'}).count(),0);
 await screenshot(page,`${size}-p03-empty-search`);
 await page.locator('#presentationConfig').getByRole('button',{name:'Cancelar'}).click();assert.deepEqual(await state(page),beforeState);
 assert.equal(await page.evaluate(()=>document.activeElement?.tagName),'BUTTON','cancel returns focus to an action');
 await page.locator('#guideClose').click();await page.locator('#presentationBtn').click();
 assert.ok((await page.locator('#presentationConfig').textContent()).includes('Primero crea una estancia'));
 await screenshot(page,`${size}-p03-empty-editor`);
 await page.getByRole('button',{name:'Ir a Distribuir'}).click();
 assert.equal(await page.locator('#guideDialog').evaluate(d=>d.open),true);
 assert.equal(await page.evaluate(()=>document.activeElement?.closest('#guideDialog')?.id),'guideDialog','layout guidance receives focus');
 const afterState=await state(page);for(const key of Object.keys(beforeState))assert.ok(afterState[key]===beforeState[key],`${key} unchanged for empty project`);
 assert.equal(await page.evaluate(()=>FloorPlanApp.viewMode),'2d');assert.deepEqual(errors,[]);assert.deepEqual(consoleErrors,[]);
});

for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390},{width:360,height:800}])test(`R2 P05 own and imported room data and poses follow active IDs ${viewport.width}x${viewport.height}`,{timeout:180000},async t=>{
 const {page,errors}=await setup(t,viewport),size=`${viewport.width}x${viewport.height}`,consoleErrors=[];
 page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text());});
 async function verify(kind){
  const before=await state(page),source=await page.evaluate(()=>({id:FloorPlanApp.project.id,entry:FloorPlanApp.entryId,rooms:FloorPlanApp.geometry.rooms.map(r=>({id:r.id,name:r.name,poly:r.poly}))}));
  assert.ok(source.rooms.length>=2,`${kind} has two real rooms`);
  await page.locator('#presentationBtn').click();
  assert.equal(await page.locator('#presentationConfig').evaluate(d=>d.open),true);
  const inputs=await page.locator('.presentation-room-row input').evaluateAll(list=>list.map(input=>input.value));
  assert.deepEqual(inputs.slice(0,2),source.rooms.slice(0,2).map(r=>r.id),`${kind} config uses current room IDs`);
  await page.locator('.presentation-room-row').nth(1).locator('input').check();
  await screenshot(page,`${size}-p05-${kind}-config`);
  await page.getByRole('button',{name:'Iniciar presentación'}).click();
  await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false',null,{timeout:30000});
  const plan=await page.evaluate(()=>structuredClone(FloorPlanPresentation.plan));
  assert.equal(plan.projectId,source.id);assert.equal(plan.entryId,source.entry);
  assert.deepEqual(plan.stops.map(s=>s.roomId),[null,...source.rooms.slice(0,2).map(r=>r.id)]);
  for(const [i,room] of source.rooms.slice(0,2).entries()){
   const stop=plan.stops[i+1];assert.equal(stop.label,room.name);
   const expected=await page.evaluate(poly=>({area:FloorPlanPresentationCore.area(poly),bounds:FloorPlanPresentationCore.bounds(poly)}),room.poly);
   assert.ok(Math.abs(stop.areaM2-expected.area)<1e-8);assert.deepEqual(stop.bounds,expected.bounds);
  }
  const toastOverlap=await page.evaluate(()=>{const toast=document.querySelector('#toast'),card=document.querySelector('.presentation-card');if(!toast.classList.contains('show'))return false;const a=toast.getBoundingClientRect(),b=card.getBoundingClientRect();return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;});
  assert.equal(toastOverlap,false,`${kind} notification does not cover presentation controls`);
  await screenshot(page,`${size}-p05-${kind}-overview`);
  await page.locator('.presentation-stops button').nth(1).click();
  await page.waitForFunction(()=>document.querySelector('#presentationOverlay').dataset.moving==='false'&&document.querySelector('.presentation-status').textContent.includes('Vista 2'));
  const firstPose=await page.evaluate(()=>View3D.presentationInspect());
  assert.ok(firstPose.position.every(Number.isFinite));assert.equal(await page.locator('.presentation-card h2').textContent(),await page.evaluate(name=>nm(name),source.rooms[0].name));
  await screenshot(page,`${size}-p05-${kind}-room`);
  await page.locator('#presentationClose').click();await page.waitForFunction(()=>!FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').hidden);
  assert.deepEqual(await state(page),before,`${kind} return is intact`);
  await page.locator('#presentationBtn').click();assert.equal(await page.locator('.presentation-room-row input:checked').count(),2);
  await page.getByRole('button',{name:'Iniciar presentación'}).click();await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false');
  await page.locator('.presentation-stops button').nth(1).click();await page.waitForFunction(()=>document.querySelector('#presentationOverlay').dataset.moving==='false'&&document.querySelector('.presentation-status').textContent.includes('Vista 2'));
  const secondPose=await page.evaluate(()=>View3D.presentationInspect());
  for(const key of ['position','quaternion','target'])for(let i=0;i<firstPose[key].length;i++)assert.ok(Math.abs(firstPose[key][i]-secondPose[key][i])<1e-5,`${kind} repeat ${key}[${i}]`);
  await page.locator('#presentationClose').click();await page.waitForFunction(()=>!FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').hidden);
  assert.deepEqual(await state(page),before);
 }
 await page.locator('#guideCopyExample').click();await page.waitForFunction(()=>FloorPlanGuideUI.state().kind==='own');
 await page.locator('#guideClose').click();await verify('own');
 const ownId=await page.evaluate(()=>FloorPlanApp.project.id);
 await page.locator('#uploadPlanBtn').click();await page.locator('#uploadIn').setInputFiles(path.join(__dirname,'fixtures/intake/vivienda-dos-estancias.dxf'));
 await page.waitForFunction(id=>FloorPlanApp.project.id!==id&&!document.body.classList.contains('uploading'),ownId,{timeout:30000});
 await page.locator('#guideClose').click();await verify('imported');
 assert.deepEqual(errors,[]);assert.deepEqual(consoleErrors,[]);
});

test('R2 room selection and order persist outside project; stale room IDs reconcile on reload',{timeout:120000},async t=>{
 const {page,errors}=await setup(t,{width:390,height:844});
 const original=await state(page),key=await page.evaluate(()=>FloorPlanPresentationCore.key(FloorPlanApp.entryId,FloorPlanApp.project.id));
 await (await presentEntry(page)).click();
 assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),null);
 await page.locator('.presentation-room-row').nth(1).locator('input').check();
 await page.getByRole('button',{name:'Subir Baño en suite'}).click();
 await page.getByRole('button',{name:'Cancelar'}).click();
 assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),null);
 assert.deepEqual(await state(page),original);
 await (await presentEntry(page)).click();
 await page.locator('.presentation-room-row').nth(1).locator('input').check();
 await page.getByRole('button',{name:'Subir Baño en suite'}).click();
 const names=await page.locator('.presentation-room-row label span').allTextContents();assert.equal(names[0],'Baño en suite');
 await fs.mkdir('qa-results/serra-r2',{recursive:true});await page.screenshot({path:'qa-results/serra-r2/390x844-ordered-config.png'});
 await page.getByRole('button',{name:'Iniciar presentación'}).click();
 await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false');
 const plan=await page.evaluate(()=>FloorPlanPresentation.plan),saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
 assert.deepEqual(plan.stops.slice(1).map(s=>s.roomId),saved.roomIds);assert.equal(plan.stops.length,3);
 await page.locator('#presentationClose').click();await page.waitForFunction(()=>!FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').hidden);
 assert.deepEqual(await state(page),original);
 const download=page.waitForEvent('download');await page.evaluate(()=>exportProjectJson());
 const chunks=[];for await(const chunk of await (await download).createReadStream())chunks.push(chunk);
 assert.deepEqual(JSON.parse(Buffer.concat(chunks).toString()),JSON.parse(original.project));
 await page.reload();await page.waitForFunction(()=>window.FloorPlanPresentation);
 await (await presentEntry(page)).click();
 assert.equal(await page.locator('.presentation-room-row').first().locator('span').textContent(),'Baño en suite');
 assert.equal(await page.locator('.presentation-room-row').nth(0).locator('input').isChecked(),true);
 assert.equal(await page.locator('.presentation-room-row').nth(1).locator('input').isChecked(),true);
 await page.locator('.presentation-room-row').first().locator('input').uncheck();
 await page.getByRole('button',{name:'Cancelar'}).click();
 assert.deepEqual(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).roomIds,key),saved.roomIds);
 await page.evaluate(k=>{const p=JSON.parse(localStorage.getItem(k));p.revision='old';p.roomIds=['removed-room',...p.roomIds];localStorage.setItem(k,JSON.stringify(p));},key);
 await page.reload();await page.waitForFunction(()=>window.FloorPlanPresentation);
 await (await presentEntry(page)).click();
 assert.match(await page.locator('.presentation-config-message').textContent(),/1 estancia/);
 assert.equal(await page.locator('.presentation-room-row').first().locator('span').textContent(),'Baño en suite');
 await page.getByRole('button',{name:'Cancelar'}).click();
 assert.deepEqual(errors,[]);
});

test('R2 changing active project invalidates the live plan and keeps sidecars isolated',{timeout:90000},async t=>{
 const {page,errors}=await setup(t,{width:844,height:390});
 await (await presentEntry(page)).click();await page.getByRole('button',{name:'Iniciar presentación'}).click();
 await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false');
 const old=await page.evaluate(()=>({entry:FloorPlanApp.entryId,id:FloorPlanApp.project.id}));
 await page.evaluate(()=>switchProject(library.create('Proyecto aislado')));
 await page.waitForFunction(()=>!FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').hidden);
 const current=await page.evaluate(()=>({entry:FloorPlanApp.entryId,id:FloorPlanApp.project.id}));
 assert.notDeepEqual(current,old);
 assert.equal(await page.evaluate(()=>localStorage.getItem(FloorPlanPresentationCore.key(FloorPlanApp.entryId,FloorPlanApp.project.id))),null);
 await page.locator('#actionSearchBtn').click();await page.fill('#editorActionInput','presentar mi vivienda');
 await page.locator('#editorActionResults [role=option]').first().click();
 assert.match(await page.locator('#presentationConfig').textContent(),/Selecciona y ordena las estancias/);
 assert.equal(await page.locator('.presentation-room-row input:checked').count(),1);
 await page.getByRole('button',{name:'Cancelar'}).click();
 assert.deepEqual(errors,[]);
});

test('R2 geometry revision invalidates the tour and resize restores the current aspect',{timeout:90000},async t=>{
 const {page,errors}=await setup(t,{width:360,height:800});
 await (await presentEntry(page)).click();await page.getByRole('button',{name:'Iniciar presentación'}).click();
 await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false');
 const oldCamera=await page.evaluate(()=>View3D.presentationInspect().position);
 await page.setViewportSize({width:844,height:390});
 await page.waitForFunction(()=>{const c=document.querySelector('#view3d canvas').getBoundingClientRect(),s=View3D.presentationInspect();return c.width>0&&Math.abs(s.aspect-c.width/c.height)<.03;});
 await page.waitForFunction(old=>{const s=View3D.presentationInspect();return document.querySelector('#presentationOverlay').dataset.moving==='false'&&s.position.some((v,i)=>Math.abs(v-old[i])>.1);},oldCamera);
 await fs.mkdir('qa-results/serra-r2',{recursive:true});await page.screenshot({path:'qa-results/serra-r2/360x800-resized-to-844x390.png'});
 await page.evaluate(()=>mutate(()=>{project.rooms[0].name='Dormitorio actualizado';}));
 await page.waitForFunction(()=>!FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').hidden);
 assert.equal(await page.evaluate(()=>FloorPlanApp.project.rooms[0].name),'Dormitorio actualizado');
 await (await presentEntry(page)).click();
 assert.match(await page.locator('.presentation-config-message').textContent(),/El plano cambió/);
 await page.getByRole('button',{name:'Cancelar'}).click();
 assert.deepEqual(errors,[]);
});

test('R2 project switch during 3D loading cannot reopen a stale presentation',{timeout:90000},async t=>{
 const {page,errors}=await setup(t,{width:390,height:844});
 await (await presentEntry(page)).click();await page.getByRole('button',{name:'Iniciar presentación'}).click();
 const old=await page.evaluate(()=>FloorPlanApp.project.id);
 await page.evaluate(()=>switchProject(library.create('Cambio durante carga')));
 await page.waitForFunction(()=>!document.body.classList.contains('busy')&&!FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').hidden);
 const current=await page.evaluate(()=>FloorPlanApp.project.id);assert.notEqual(current,old);
 await page.locator('#actionSearchBtn').click();await page.fill('#editorActionInput','presentar mi vivienda');
 await page.locator('#editorActionResults [role=option]').first().click();
 assert.equal(await page.evaluate(()=>FloorPlanApp.project.id),current);
 assert.equal(await page.locator('.presentation-room-row input:checked').count(),1);
 await page.getByRole('button',{name:'Cancelar'}).click();
 assert.deepEqual(errors,[]);
});

test('R2 variant starts with independent presentation metadata',{timeout:90000},async t=>{
 const {page,errors}=await setup(t,{width:1440,height:900});
 await (await presentEntry(page)).click();await page.locator('.presentation-room-row').nth(1).locator('input').check();
 await page.getByRole('button',{name:'Iniciar presentación'}).click();
 await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false');
 const source=await page.evaluate(()=>({id:FloorPlanApp.project.id,entry:FloorPlanApp.entryId,key:FloorPlanPresentationCore.key(FloorPlanApp.entryId,FloorPlanApp.project.id)}));
 await page.evaluate(()=>switchProject(library.variant(FloorPlanApp.project)));
 await page.waitForFunction(()=>!FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').hidden);
 const variant=await page.evaluate(()=>({id:FloorPlanApp.project.id,entry:FloorPlanApp.entryId,key:FloorPlanPresentationCore.key(FloorPlanApp.entryId,FloorPlanApp.project.id)}));
 assert.notEqual(variant.id,source.id);assert.notEqual(variant.entry,source.entry);assert.notEqual(variant.key,source.key);
 assert.equal(await page.evaluate(k=>localStorage.getItem(k),variant.key),null);
 assert.ok(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).roomIds.length,source.key)>1);
 await page.locator('#actionSearchBtn').click();await page.fill('#editorActionInput','presentar mi vivienda');
 await page.locator('#editorActionResults [role=option]').first().click();
 assert.equal(await page.locator('.presentation-room-row input:checked').count(),1);
 await page.getByRole('button',{name:'Cancelar'}).click();assert.deepEqual(errors,[]);
});
