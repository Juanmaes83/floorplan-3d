// 3D setting (premium UX cut B) at 1440×900, 390×844 and 844×390: «Entorno» offers studio (default), soft garden
// and city; the choice is a browser preference that survives a reload and never enters the project or its history;
// it is announced as decorative; day and night change the look; and the exported 3D PNG uses the same backdrop as
// the editor. Needs three.js (THREE_LOCAL_DIR when the CDN is unreachable).
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),shots=process.env.ENV3D_SHOTS||null;
let server,browser,url;
before(async()=>{server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))throw Error('path');res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.webp')?'image/webp':file.endsWith('.json')?'application/json':file.endsWith('.png')?'image/png':file.endsWith('.glb')?'model/gltf-binary':'text/html');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox']});if(shots)await fs.mkdir(shots,{recursive:true});});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});

for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390}])
test(`3D setting ${viewport.width}x${viewport.height}`,{timeout:300000,skip:!process.env.THREE_LOCAL_DIR&&'needs THREE_LOCAL_DIR (CDN unreachable)'},async t=>{
 const mobile=viewport.width<=1100,name=`${viewport.width}x${viewport.height}`;
 const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,acceptDownloads:true});t.after(()=>context.close());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(m.text());});
 await page.route('https://cdn.jsdelivr.net/**',async r=>{try{await r.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await require('./helpers/three-module.cjs')(r.request().url(),()=>Promise.reject(Error('no cdn')))});}catch{await r.abort();}});
 await page.goto(url);await require('./editor-fixture.cjs')(page);
 const to3D=async()=>{await page.evaluate(()=>setView('3d'));await page.waitForFunction(()=>FloorPlanApp.viewMode==='3d'&&!document.body.classList.contains('busy'),null,{timeout:90000});await page.waitForTimeout(1200);};
 await to3D();
 const before=await page.evaluate(()=>({project:JSON.stringify(FloorPlanApp.project),undo:undoStack.length}));
 // Default and announcement.
 assert.equal(await page.evaluate(()=>View3D.environment3D),'studio','studio by default');
 const sel=page.locator('#env3d');assert.equal(await sel.count(),1);
 assert.deepEqual(await sel.locator('option').allTextContents(),['Estudio','Jardín suave','Ciudad']);
 assert.match(await page.locator('#env3dNote').textContent(),/decorativo: no representa terreno, jardín ni entorno urbano reales/);
 assert.equal(await sel.getAttribute('aria-describedby'),'env3dNote');
 await sel.scrollIntoViewIfNeeded();const box=await sel.boundingBox();assert.ok(box&&box.x>=0&&box.x+box.width<=viewport.width+1,'the selector can be reached');
 // Backdrop colour read from the rendered canvas (top-left), per setting and day/night.
 const sky=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>{const c=document.querySelector('#view3d canvas'),x=document.createElement('canvas');x.width=c.width;x.height=c.height;x.getContext('2d').drawImage(c,0,0);const p=x.getContext('2d').getImageData(3,3,1,1).data;r([p[0],p[1],p[2]]);})));
 const studio=await sky();
 await sel.selectOption('garden');await page.waitForTimeout(800);const garden=await sky();
 assert.equal(await page.evaluate(()=>View3D.environment3D),'garden');
 assert.ok(Math.abs(studio[2]-garden[2])+Math.abs(studio[0]-garden[0])+Math.abs(studio[1]-garden[1])>8,`backdrop changes (${studio} → ${garden})`);
 if(shots)await page.screenshot({path:path.join(shots,`${name}-garden-day.png`)});
 await page.evaluate(()=>document.querySelector('header [data-t="night"]').click());await page.waitForTimeout(800);const night=await sky();
 assert.ok(night.reduce((a,b)=>a+b,0)<garden.reduce((a,b)=>a+b,0)-150,`night is darker (${garden} → ${night})`);
 assert.ok(night.reduce((a,b)=>a+b,0)>=30,`the night setting stays readable, not black (${night})`);
 await page.evaluate(()=>document.querySelector('header [data-t="night"]').click());await page.waitForTimeout(500);
 // The exported 3D PNG carries the same backdrop.
 const dl=page.waitForEvent('download',{timeout:30000});await page.evaluate(()=>{document.querySelector('header details.menu').open=true;document.querySelector('#exportPng').click();});
 const file=await (await dl).path(),corner=await page.evaluate(async b64=>{const img=new Image();img.src='data:image/png;base64,'+b64;await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const x=c.getContext('2d');x.drawImage(img,0,0);const p=x.getImageData(3,3,1,1).data;return [p[0],p[1],p[2]];},(await fs.readFile(file)).toString('base64'));
 assert.ok(corner.every((v,i)=>Math.abs(v-garden[i])<=6),`exported PNG backdrop ${corner} matches the editor ${garden}`);
 // A preference, not project data: no change to the project or its history; it survives a reload.
 assert.deepEqual(await page.evaluate(()=>({project:JSON.stringify(FloorPlanApp.project),undo:undoStack.length})),before,'the project and its history are unchanged');
 assert.ok(!(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project))).includes('garden'));
 await page.reload();await page.waitForFunction(()=>window.FloorPlanApp&&FloorPlanApp.project&&window.View3D);if(await page.locator('#welcomeDialog').evaluate(d=>d.open))await page.locator('#welcomeActionInput').press('Escape');
 // The guided editor keeps the advanced 3D controls (sun, setting) hidden, as before; open the full editor again.
 if(await page.locator('#guideDetails').isVisible()){await page.locator('#guideDetails').click();await page.locator('#guideAllTools').click();await page.waitForTimeout(400);}
 await to3D();
 assert.equal(await page.evaluate(()=>View3D.environment3D),'garden','kept after reload');assert.equal(await sel.inputValue(),'garden');
 await sel.selectOption('city');await page.waitForTimeout(500);assert.equal(await page.evaluate(()=>View3D.environment3D),'city');
 if(shots)await page.screenshot({path:path.join(shots,`${name}-city-day.png`)});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
 assert.deepEqual(errors,[]);
});
