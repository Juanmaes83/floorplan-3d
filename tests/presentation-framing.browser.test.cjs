const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http');
const {execFile}=require('node:child_process'),{promisify}=require('node:util'),run=promisify(execFile),{chromium}=require('playwright');
const irregularHome=require('./helpers/irregular-home.cjs');
const QA=process.env.R10_ARTIFACTS||'qa-results/serra-r10-framing';let server,url,browser;const cache=new Map();
const three=target=>require('./helpers/three-module.cjs')(target,()=>run('curl',['--fail','--show-error','--max-time','30',target],{maxBuffer:4*1024*1024}).then(r=>r.stdout));
before(async()=>{const root=path.resolve(__dirname,'..');server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))throw Error('path');res.setHeader('Content-Type',file.endsWith('.hdr')?'application/octet-stream':/\.m?js$/.test(file)?'text/javascript':file.endsWith('.webp')?'image/webp':file.endsWith('.json')?'application/json':'text/html');res.end(await fs.readFile(file));}catch{res.writeHead(404);res.end();}});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));url=`http://127.0.0.1:${server.address().port}/`;browser=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox','--enable-unsafe-swiftshader']});await fs.mkdir(QA,{recursive:true});});
after(async()=>{await browser?.close();await new Promise(resolve=>server?.close(resolve));});
async function setup(t,viewport,options={}){const context=await browser.newContext({viewport,isMobile:viewport.width<1000,hasTouch:viewport.width<1000,...options});t.after(()=>context.close());const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**',async route=>{const target=route.request().url();if(!cache.has(target))cache.set(target,three(target));await route.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await cache.get(target)});});await page.goto(url);await page.waitForFunction(()=>window.View3D?.presentationRoute&&window.FloorPlanPresentation&&FloorPlanSurfaces.entries.length===50,null,{timeout:30000});if(await page.locator('#welcomeDialog').evaluate(d=>d.open))await page.locator('#welcomeActionInput').press('Escape');await page.evaluate(()=>document.querySelector('#guideDetails').click());await page.evaluate(()=>document.querySelector('#guideAllTools').click());await require('./layout-fixture.cjs')(page);return{page,errors};}
async function present(page,ids){await page.locator('#presentationBtn').click();await page.evaluate(ids=>{document.querySelectorAll('#presentationConfig input[type=checkbox]').forEach(i=>{const want=ids.includes(i.value);if(i.checked!==want){i.checked=want;i.dispatchEvent(new Event('change'));}});},ids);await page.getByRole('button',{name:'Iniciar presentación'}).click();await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false',null,{timeout:60000});}
async function goRoom(page,id){await page.evaluate(id=>{const i=FloorPlanPresentation.plan.stops.findIndex(s=>s.roomId===id);document.querySelectorAll('.presentation-stops button')[i].click();},id);await page.waitForFunction(id=>document.querySelector('#presentationOverlay').dataset.moving==='false'&&View3D.presentationFrameInfo?.roomId===id,id,{timeout:60000});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));}
const snapshot=page=>page.evaluate(()=>({project:JSON.stringify(FloorPlanApp.project),entry:FloorPlanApp.entryId,cut:View3D.presentationInspect()?.options?.cut??null,decor:View3D.presentationDecor}));
const card=page=>page.evaluate(()=>{const r=document.querySelector('.presentation-card').getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:innerWidth,height:innerHeight};});

for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390},{width:360,height:800}])test(`R10 small rooms are framed as protagonists ${viewport.width}x${viewport.height}`,{timeout:240000},async t=>{
 const {page,errors}=await setup(t,viewport),size=`${viewport.width}x${viewport.height}`;
 await page.locator('[data-view="3d"]').click();await page.waitForFunction(()=>FloorPlanApp.viewMode==='3d'&&!View3D.lifecycleMetrics.animating);const editor=await snapshot(page);
 await present(page,['rom_mbath','rom_master','rom_hall']);
 for(const id of ['rom_mbath','rom_hall','rom_master']){
  await goRoom(page,id);const frame=await page.evaluate(()=>View3D.presentationFrameInfo),where=`${size} ${id}`;
  assert.ok(frame.accepted,`${where} ${JSON.stringify(frame)}`);assert.ok(frame.share>=.4&&frame.otherShare<.25&&frame.floorVisible>=.75,where);
  assert.ok(Array.isArray(frame.region)&&frame.region[2]>frame.region[0],`${where} card-aware region`);
  const note=await page.locator('#presentationSection');assert.equal(await note.isVisible(),frame.section,`${where} section note`);
  if(frame.section)assert.equal((await snapshot(page)).cut,frame.wallTop);
  assert.equal((await snapshot(page)).decor.outline,id);assert.equal((await snapshot(page)).decor.ceilingFixtures,'hidden');
  const box=await card(page);assert.ok(box.left>=0&&box.top>=0&&box.right<=box.width&&box.bottom<=box.height,`${where} card fits`);
  await page.screenshot({path:path.join(QA,`${size}-${id}.png`)});
 }
 if(viewport.width===360){await page.setViewportSize({width:844,height:390});await page.waitForFunction(()=>document.querySelector('#presentationOverlay').dataset.moving==='false'&&Math.abs(View3D.cameraState.aspect-844/390)<.01);const frame=await page.evaluate(()=>View3D.presentationFrameInfo);assert.ok(frame.accepted);await page.screenshot({path:path.join(QA,'360-to-844-rom_master.png')});}
 await page.locator('#presentationClose').click();await page.waitForFunction(()=>!FloorPlanPresentation.active&&FloorPlanApp.viewMode==='3d');
 const restored=await snapshot(page);assert.equal(restored.project,editor.project);assert.equal(restored.entry,editor.entry);assert.equal(restored.cut,editor.cut);assert.equal(restored.decor.outline,null);assert.equal(restored.decor.ceilingFixtures,editor.decor.ceilingFixtures);
 assert.deepEqual(errors,[]);
});
test('R10 framing is repeatable, respects reduced motion and an editor wall cut',{timeout:240000},async t=>{
 const {page,errors}=await setup(t,{width:1440,height:900},{reducedMotion:'reduce'});
 await page.locator('[data-view="3d"]').click();await page.waitForFunction(()=>FloorPlanApp.viewMode==='3d'&&!View3D.lifecycleMetrics.animating);
 await present(page,['rom_mbath']);await goRoom(page,'rom_mbath');const first=await page.evaluate(()=>View3D.cameraState);
 await page.evaluate(()=>document.querySelectorAll('.presentation-stops button')[0].click());await page.waitForFunction(()=>document.querySelector('#presentationOverlay').dataset.moving==='false'&&!View3D.presentationFrameInfo);
 await goRoom(page,'rom_mbath');const second=await page.evaluate(()=>View3D.cameraState);
 for(let i=0;i<3;i++)assert.ok(Math.abs(first.position[i]-second.position[i])<1e-9);
 await page.locator('#presentationClose').click();await page.waitForFunction(()=>!FloorPlanPresentation.active);
 await page.evaluate(()=>document.querySelector('[data-cut="1.2"]').click());const cutEditor=await snapshot(page);assert.equal(cutEditor.cut,1.2);
 await present(page,['rom_mbath']);await goRoom(page,'rom_mbath');const frame=await page.evaluate(()=>View3D.presentationFrameInfo);
 assert.equal(frame.section,false);assert.equal(frame.wallTop,1.2);assert.equal(await page.locator('#presentationSection').isVisible(),false);
 await page.locator('#presentationClose').click();await page.waitForFunction(()=>!FloorPlanPresentation.active);assert.equal((await snapshot(page)).cut,1.2);assert.equal((await snapshot(page)).project,cutEditor.project);
 assert.deepEqual(errors,[]);
});
test('R10 rotated irregular plan frames every counted room',{timeout:300000},async t=>{
 const {page,errors}=await setup(t,{width:1440,height:900});
 const id=await page.evaluate(f=>{const p=eval(f)(FloorPlanReference);FloorPlanApp.importProject(p);return FloorPlanApp.project.id;},`(${irregularHome.toString()})`);assert.equal(id,'prj_irregular-rotated');
 const rooms=await page.evaluate(()=>FloorPlanApp.geometry.rooms.filter(r=>r.counted!==false).map(r=>r.id));const before=await snapshot(page);
 await present(page,rooms);
 for(const room of rooms){await goRoom(page,room);const frame=await page.evaluate(()=>View3D.presentationFrameInfo);assert.ok(frame.accepted,`${room} ${JSON.stringify(frame)}`);if(['rom_mbath','rom_master','rom_hall'].includes(room))await page.screenshot({path:path.join(QA,`irregular-1440x900-${room}.png`)});}
 await page.locator('#presentationClose').click();await page.waitForFunction(()=>!FloorPlanPresentation.active);assert.equal((await snapshot(page)).project,before.project);assert.deepEqual(errors,[]);
});
