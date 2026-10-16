const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http');
const {execFile}=require('node:child_process'),{promisify}=require('node:util'),run=promisify(execFile),cache=new Map();
const {chromium}=require('playwright');let server,url;
before(async()=>{const root=path.resolve(__dirname,'..');server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))throw Error('path');res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':'text/html');res.end(await fs.readFile(file));}catch{res.writeHead(404);res.end();}});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));url=`http://127.0.0.1:${server.address().port}/`;});
after(async()=>new Promise(resolve=>server.close(resolve)));
async function setup(t,viewport){const browser=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox','--enable-unsafe-swiftshader']});t.after(()=>browser.close());const page=await browser.newPage({viewport,isMobile:viewport.width<1000,hasTouch:viewport.width<1000}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**',async route=>{const target=route.request().url();let promise=cache.get(target);if(!promise){promise=require('./helpers/three-module.cjs')(target,()=>run('curl',['--fail','--silent','--show-error','--max-time','30',target],{maxBuffer:4*1024*1024}).then(r=>r.stdout));cache.set(target,promise);}await route.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await promise});});await page.goto(url);await page.waitForFunction(()=>window.FloorPlanPresentation&&window.FloorPlanApp);await page.locator('#welcomeExample').click();return {page,errors};}
const state=page=>page.evaluate(()=>({project:JSON.stringify(FloorPlanApp.project),entry:FloorPlanApp.entryId,guide:JSON.stringify(FloorPlanGuideUI.state()),undo:undoStack.length,redo:redoStack.length,selection:JSON.stringify(ui.sel),view:FloorPlanApp.viewMode}));
async function capture(page,name){const folder=process.env.MINIMAP_ARTIFACTS||'qa-results/serra-r3-m13';await fs.mkdir(folder,{recursive:true});await page.screenshot({path:path.join(folder,name+'.png')});}
for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390},{width:360,height:800}])test(`R3 M13 minimap room identity, direction and return ${viewport.width}x${viewport.height}`,{timeout:150000},async t=>{
 const {page,errors}=await setup(t,viewport),size=`${viewport.width}x${viewport.height}`,beforeState=await state(page);
 await page.locator('#guidePresent').click();await page.locator('.presentation-room-row').nth(1).locator('input').check();await page.getByRole('button',{name:'Iniciar presentación'}).click();
 await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false'&&!document.querySelector('#presentationMinimap').hidden,null,{timeout:30000});
 const toggle=page.locator('#presentationMinimapToggle'),panel=page.locator('#presentationMinimapPanel');
 const initiallyOpen=viewport.width>=700&&viewport.height>500;assert.equal(await panel.isVisible(),initiallyOpen);
 if(!initiallyOpen)await toggle.click();
 const source=await page.evaluate(()=>({rooms:FloorPlanApp.geometry.rooms.filter(r=>r.poly.length>=3&&FloorPlanPresentationCore.area(r.poly)>0).map(r=>({id:r.id,poly:r.poly})),stop:FloorPlanPresentation.plan.stops[1].roomId,pose:View3D.presentationPose()}));
 const paths=await page.locator('#presentationMinimap svg polygon').evaluateAll(nodes=>nodes.map(n=>({id:n.getAttribute('data-room-id'),points:n.getAttribute('points')})));
 assert.deepEqual(paths.map(p=>p.id),source.rooms.map(r=>r.id));assert.equal(paths[0].points,source.rooms[0].poly.map(p=>p.join(',')).join(' '));
 assert.ok(await page.locator('#presentationMinimap svg path.presentation-minimap-heading').count());
 const bounds=await page.locator('#presentationMinimap').boundingBox();assert.ok(bounds&&bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=viewport.width&&bounds.y+bounds.height<=viewport.height);
 await capture(page,`${size}-overview-map`);
 const room=page.locator(`#presentationMinimap svg polygon[data-room-id="${source.stop}"]`);await room.click();await page.waitForFunction(id=>document.querySelector('#presentationOverlay').dataset.moving==='false'&&FloorPlanPresentation.plan.stops[1].roomId===id&&document.querySelector('.presentation-status').textContent.includes('Vista 2'),source.stop);
 assert.equal(await room.getAttribute('aria-current'),'location');const heading=await page.locator('#presentationMinimap svg path.presentation-minimap-heading').evaluate(node=>({dx:Number(node.getAttribute('data-heading-x')),dy:Number(node.getAttribute('data-heading-y'))}));assert.ok(Math.hypot(heading.dx,heading.dy)>.99);
 await capture(page,`${size}-room-map`);
 await page.locator('.presentation-stops button').first().click();await page.waitForFunction(()=>document.querySelector('#presentationOverlay').dataset.moving==='false'&&document.querySelector('.presentation-status').textContent.includes('Vista 1'));
 await room.press('Enter');await page.waitForFunction(()=>document.querySelector('#presentationOverlay').dataset.moving==='false'&&document.querySelector('.presentation-status').textContent.includes('Vista 2'));
 await toggle.click();assert.equal(await panel.isVisible(),false);await capture(page,`${size}-collapsed`);
 await page.locator('#presentationClose').click();await page.waitForFunction(()=>!FloorPlanPresentation.active&&FloorPlanApp.viewMode==='2d');assert.deepEqual(await state(page),beforeState);assert.equal(await page.locator('#presentationMinimap').isVisible(),false);assert.deepEqual(errors,[]);
});

test('R3 M13 resize keeps map coordinates and camera heading aligned with the current stage',{timeout:150000},async t=>{
 const {page,errors}=await setup(t,{width:360,height:800}),beforeState=await state(page);
 await page.locator('#guidePresent').click();await page.getByRole('button',{name:'Iniciar presentación'}).click();
 await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false',null,{timeout:30000});
 await page.locator('#presentationMinimapToggle').click();const original=await page.locator('#presentationMinimap svg').getAttribute('viewBox');
 await page.setViewportSize({width:844,height:390});
 await page.waitForFunction(()=>{const stage=document.querySelector('#stage'),canvas=View3D.canvasState;return document.querySelector('#presentationOverlay').dataset.moving==='false'&&canvas.width===stage.clientWidth&&Math.abs(View3D.cameraState.aspect-stage.clientWidth/stage.clientHeight)<.001;},null,{timeout:30000});
 assert.equal(await page.locator('#presentationMinimap svg').getAttribute('viewBox'),original);
 assert.equal(await page.locator('#presentationMinimapPanel').isVisible(),true);
 const arrow=await page.locator('#presentationMinimap svg path').evaluate(node=>[Number(node.getAttribute('data-heading-x')),Number(node.getAttribute('data-heading-y'))]);
 assert.ok(Math.abs(Math.hypot(...arrow)-1)<1e-8);await capture(page,'360-to-844-resize-map');
 const box=await page.locator('#presentationMinimap').boundingBox();assert.ok(box&&box.x>=0&&box.y>=0&&box.x+box.width<=844&&box.y+box.height<=390);
 await page.locator('#presentationClose').click();await page.waitForFunction(()=>!FloorPlanPresentation.active&&FloorPlanApp.viewMode==='2d');assert.deepEqual(await state(page),beforeState);assert.deepEqual(errors,[]);
});
