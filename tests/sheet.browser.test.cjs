const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
let server,url;
before(async()=>{const root=path.resolve(__dirname,'..');server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))throw Error('path');res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':'text/html');res.end(await fs.readFile(file));}catch{res.writeHead(404);res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;});
after(async()=>new Promise(r=>server.close(r)));
async function setup(t,viewport){const browser=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox','--enable-unsafe-swiftshader']});t.after(()=>browser.close());const page=await browser.newPage({viewport,isMobile:viewport.width<1000,hasTouch:viewport.width<1000}),errors=[];page.on('pageerror',error=>errors.push(error.message));await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**',async route=>{if(!process.env.THREE_LOCAL_DIR)return route.continue();await route.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await require('./helpers/three-module.cjs')(route.request().url(),()=>null)});});await page.goto(url);await page.waitForFunction(()=>window.FloorPlanSheet&&window.FloorPlanApp);await page.locator('#welcomeExample').click();return {page,errors};}
async function capture(page,name){const folder=process.env.SHEET_ARTIFACTS||'qa-results/serra-r3-m07';await fs.mkdir(folder,{recursive:true});await page.screenshot({path:path.join(folder,name+'.png')});}
const state=page=>page.evaluate(()=>({project:JSON.stringify(FloorPlanApp.project),entry:FloorPlanApp.entryId,guide:JSON.stringify(FloorPlanGuideUI.state()),undo:undoStack.length,redo:redoStack.length,selection:JSON.stringify(ui.sel),view:FloorPlanApp.viewMode,header:document.querySelector('header').scrollLeft}));
for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390},{width:360,height:800}])test(`R3 M07 sheet downloads standalone SVG and restores editor ${viewport.width}x${viewport.height}`,{timeout:90000},async t=>{
 const {page,errors}=await setup(t,viewport),size=`${viewport.width}x${viewport.height}`,consoleErrors=[];page.on('console',msg=>{if(msg.type()==='error')consoleErrors.push(msg.text());});
 await page.locator('#guideClose').click();const before=await state(page);await page.locator('details.menu summary').click();await page.locator('#openSheet').click();assert.equal(await page.locator('#sheetDialog').evaluate(el=>el.open),true);
 await page.locator('#sheetPreview').evaluate(async img=>{if(!img.complete)await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;});if(!img.naturalWidth)throw Error('Sheet image did not render');});
 await capture(page,`${size}-sheet`);
 if(viewport.width<1000){await page.locator('#sheetZoom').click();assert.ok(await page.locator('.sheet-scroll').evaluate(el=>el.scrollWidth>el.clientWidth));await capture(page,`${size}-sheet-zoomed`);await page.locator('#sheetZoom').click();}
 const pending=page.waitForEvent('download');await page.locator('#sheetDownload').click();const file=await pending,content=await fs.readFile(await file.path());
 assert.match(file.suggestedFilename(),/\.svg$/);assert.ok(content.byteLength>5000,'download has SVG bytes');
 const source=content.toString('utf8');assert.match(source,/<svg/);assert.match(source,/viewBox="0 0 1600 1100"/);assert.match(source,/Dormitorio principal/);assert.match(source,/87\.18 m²/);assert.match(source,/Revisión:/);assert.doesNotMatch(source,/<image\b|<foreignObject\b|javascript:/i);
 await fs.mkdir(process.env.SHEET_ARTIFACTS||'qa-results/serra-r3-m07',{recursive:true});await fs.writeFile(path.join(process.env.SHEET_ARTIFACTS||'qa-results/serra-r3-m07',`${size}-sheet-export.svg`),content);
 const parsed=await page.evaluate(markup=>{const doc=new DOMParser().parseFromString(markup,'image/svg+xml');return {error:doc.querySelector('parsererror')?.textContent||'',room:doc.querySelector('[data-room="rom_master"]')?.getAttribute('points'),size:[doc.documentElement.getAttribute('width'),doc.documentElement.getAttribute('height')]};},source);
 assert.equal(parsed.error,'');assert.ok(parsed.room);assert.deepEqual(parsed.size,['1600','1100']);
 await page.locator('#sheetClose').click();assert.equal(await page.locator('#sheetDialog').evaluate(el=>el.open),false);assert.deepEqual(await state(page),before);assert.deepEqual(errors,[]);assert.deepEqual(consoleErrors,[]);
});

test('R3 M07 imported irregular room and localized sheet text stay tied to current project',{timeout:90000},async t=>{
 const {page,errors}=await setup(t,{width:1440,height:900}),consoleErrors=[];page.on('console',msg=>{if(msg.type()==='error')consoleErrors.push(msg.text());});
 await page.locator('#guideClose').click();
 const id=await page.evaluate(()=>{const p=structuredClone(FloorPlanApp.project);p.id='prj_sheet-irregular';p.name='Plano <script>alert(1)</script>';p.rooms[0].id='rom_sheet-concave';p.rooms[0].name='Sala <script>alert(1)</script>';p.rooms[0].polygon=[{x:6600,y:0},{x:10270,y:0},{x:10270,y:3370},{x:8700,y:3370},{x:8700,y:1900},{x:6600,y:1900}];delete p.rooms[0].labelAt;FloorPlanApp.importProject(p);return FloorPlanApp.project.id;});
 assert.equal(id,'prj_sheet-irregular');if(await page.locator('#guideClose').isVisible())await page.locator('#guideClose').click();const before=await state(page);
 await page.locator('details.menu summary').click();await page.locator('#openSheet').click();await page.locator('#sheetPreview').evaluate(async img=>{if(!img.complete)await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;});});await capture(page,'1440x900-sheet-irregular');
 const pending=page.waitForEvent('download');await page.locator('#sheetDownload').click();const data=(await fs.readFile(await (await pending).path())).toString('utf8');
 assert.match(data,/data-project-id="prj_sheet-irregular"/);assert.match(data,/data-room="rom_sheet-concave"/);assert.match(data,/Sala &lt;script&gt;alert\(1\)&lt;\/script&gt;/);assert.doesNotMatch(data,/<script>/);assert.match(data,/Plano &lt;script&gt;/);
 await page.locator('#sheetClose').click();assert.deepEqual(await state(page),before);
 await page.locator('#langBtn').click();await page.locator('details.menu summary').click();await page.locator('#openSheet').click();const english=await page.locator('#sheetPreview').evaluate(async img=>{const res=await fetch(img.src);return res.text();});assert.match(english,/FLOOR PLAN SHEET/);assert.match(english,/Revision:/);await capture(page,'1440x900-sheet-irregular-en');await page.locator('#sheetClose').click();
 await page.locator('#langBtn').click();await page.locator('details.menu summary').click();await page.locator('#openSheet').click();const chinese=await page.locator('#sheetPreview').evaluate(async img=>{const res=await fetch(img.src);return res.text();});assert.match(chinese,/平面设计图/);assert.match(chinese,/修订:/);await capture(page,'1440x900-sheet-irregular-zh');await page.locator('#sheetClose').click();
 assert.deepEqual(errors,[]);assert.deepEqual(consoleErrors,[]);
});

for(const viewport of [{width:1440,height:900},{width:390,height:844}])test(`R3 M07 own copy and DXF sheet use the active project ${viewport.width}x${viewport.height}`,{timeout:120000},async t=>{
 const {page,errors}=await setup(t,viewport),consoleErrors=[];page.on('console',msg=>{if(msg.type()==='error')consoleErrors.push(msg.text());});
 await page.locator('#guideCopyExample').click();await page.waitForFunction(()=>FloorPlanGuideUI.state().kind==='own');await page.locator('#guideClose').click();
 async function check(kind){const before=await state(page),source=await page.evaluate(()=>({id:FloorPlanApp.project.id,rooms:FloorPlanApp.project.rooms.map(room=>room.id)}));await page.locator('details.menu summary').click();await page.locator('#openSheet').click();await page.locator('#sheetPreview').evaluate(async img=>{if(!img.complete)await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;});});await capture(page,`${viewport.width}x${viewport.height}-sheet-${kind}`);const pending=page.waitForEvent('download');await page.locator('#sheetDownload').click();const data=(await fs.readFile(await (await pending).path())).toString('utf8');const details=await page.evaluate(markup=>{const doc=new DOMParser().parseFromString(markup,'image/svg+xml');return {id:doc.documentElement.getAttribute('data-project-id'),rooms:[...doc.querySelectorAll('[data-room]')].map(el=>el.getAttribute('data-room')),error:!!doc.querySelector('parsererror')};},data);assert.equal(details.id,source.id);assert.equal(details.error,false);for(const id of source.rooms)assert.ok(details.rooms.includes(id),`${kind} sheet includes ${id}`);await page.locator('#sheetClose').click();assert.deepEqual(await state(page),before);}
 await check('own');const ownId=await page.evaluate(()=>FloorPlanApp.project.id);
 await page.locator('#uploadPlanBtn').click();await page.locator('#uploadIn').setInputFiles(path.join(__dirname,'fixtures/intake/vivienda-dos-estancias.dxf'));
 await page.waitForFunction(id=>FloorPlanApp.project.id!==id&&!document.body.classList.contains('uploading'),ownId,{timeout:30000});if(await page.locator('#guideClose').isVisible())await page.locator('#guideClose').click();await check('dxf');
 assert.deepEqual(errors,[]);assert.deepEqual(consoleErrors,[]);
});

// Closing the sheet queues its «close» event; a reopen that runs before that event (a fast close and reopen, or a test
// that does both at once) must keep the new preview and download it, not show an empty sheet that refuses to download.
for(const viewport of [{width:1440,height:900},{width:390,height:844}])test(`sheet reopened before the previous close event keeps its preview and downloads ${viewport.width}x${viewport.height}`,{timeout:90000},async t=>{
 const {page,errors}=await setup(t,viewport);await page.locator('#guideClose').click();
 const openSheet=()=>{const d=document.getElementById('openSheet').closest('details');if(d)d.open=true;document.getElementById('openSheet').click();};
 await page.evaluate(openSheet);await page.locator('#sheetDialog[open]').waitFor();
 // Close and reopen in the same task: the first close event is still queued when the sheet opens again.
 await page.evaluate(()=>{document.querySelector('#sheetClose').click();const d=document.getElementById('openSheet').closest('details');if(d)d.open=true;document.getElementById('openSheet').click();});
 await page.evaluate(()=>new Promise(resolve=>setTimeout(resolve,100)));
 assert.equal(await page.locator('#sheetDialog').evaluate(el=>el.open),true,'the reopened sheet stays open');
 await page.locator('#sheetPreview').evaluate(async img=>{if(!img.getAttribute('src'))throw Error('reopened sheet has no preview');if(!img.complete)await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;});if(!img.naturalWidth)throw Error('Sheet image did not render');});
 const pending=page.waitForEvent('download',{timeout:10000});await page.locator('#sheetDownload').click();const file=await pending;
 assert.match((await fs.readFile(await file.path())).toString('utf8'),/<svg/);
 assert.doesNotMatch(await page.locator('#toast').textContent(),/El proyecto cambió/);
 await page.locator('#sheetClose').click();assert.deepEqual(errors,[]);
});
