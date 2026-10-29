// Phase B6: anchored comments, end to end. In the client file the client comments on an element (named with its
// room), on a precise point of the plan (tapping it) and on one image («Comentar esta imagen»); the observations file
// carries those anchors; the professional imports it and reads each one by name, sees the points numbered over the
// plan, and an element removed since is flagged «ya no existe». The project never changes by itself.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),SHOTS=process.env.QA_SHOTS||'';let server,browser,url,dir;
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.glb':'model/gltf-binary'};
before(async()=>{dir=await fs.mkdtemp(path.join(os.tmpdir(),'rubik-b6-'));server=createServer(async(req,res)=>{try{const p=new URL(req.url,'http://l').pathname,f=path.resolve(root,'.'+(p==='/'?'/index.html':p));if(!f.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(await fs.readFile(f));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});});
after(async()=>{await browser?.close();await new Promise(r=>server.close(r));await fs.rm(dir,{recursive:true,force:true});});
const shot=async(page,name)=>{if(!SHOTS)return;await fs.mkdir(SHOTS,{recursive:true});await page.screenshot({path:path.join(SHOTS,name+'.png'),fullPage:false});};

test('Phase B6: comments anchored to an element, a point of the plan and an image travel to the professional',{timeout:480000},async t=>{
 const context=await browser.newContext({viewport:{width:1440,height:900},acceptDownloads:true});t.after(()=>context.close());
 const page=await context.newPage(),errors=[];page.setDefaultTimeout(30000);page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);await page.locator('#welcomeExample').click();await page.waitForFunction(()=>window.FloorPlanClientShare&&window.FloorPlanReviewAnchors);
 const workspace=page.locator('#professionalWorkspace');await page.locator('#workArea-deliver').click();
 await workspace.locator('[data-route="prepare-views"]').first().click();await page.waitForFunction(()=>FloorPlanProjectViews.status()!=='busy',null,{timeout:240000});
 const before=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));
 const bed=await page.evaluate(()=>{const o=FloorPlanApp.project.objects.find(x=>x.type==='bed');return {id:o.id};});
 const download=page.waitForEvent('download');await workspace.getByRole('button',{name:'Descargar archivo para el cliente',exact:true}).click();const file=path.join(dir,'cliente.html');await (await download).saveAs(file);

 // The client, offline, on a phone.
 const client=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,acceptDownloads:true});t.after(()=>client.close());
 const c=await client.newPage(),clientErrors=[];c.on('pageerror',e=>clientErrors.push(e.message));await c.goto('file://'+file);
 const select=c.locator('#shareAnchor');
 assert.deepEqual(await select.locator('optgroup').evaluateAll(g=>g.map(x=>x.label)),['Estancias','Muebles, puertas y ventanas','Imágenes']);
 // 1. An element, chosen by its name and room.
 const bedOption=await select.locator('option').evaluateAll((os,id)=>{const o=os.find(x=>x.value&&JSON.parse(x.value).elementId===id);return {value:o.value,label:o.textContent};},bed.id);
 assert.match(bedOption.label,/^Cama doble · Dormitorio principal$|^.+ · .+$/);
 await select.selectOption(bedOption.value);await c.locator('#shareText').fill('¿Cabe una cama de 160?');await c.locator('#shareAdd').click();
 // 2. A point: tapping the plan inside a room marks it and names the room.
 const box=await c.locator('#sharePlanPick').boundingBox();const target=await c.evaluate(()=>{const p=document.querySelector('#sharePlanPick .preview-room[data-room]');const b=p.getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2,room:p.dataset.label};});
 assert.ok(box&&box.width>200,'the plan is large enough to tap on a phone');
 await c.locator('#sharePlanPick').tap({position:{x:target.x-box.x,y:target.y-box.y}});
 assert.equal(await c.locator('#sharePointMark').count(),1);assert.equal(await select.evaluate(s=>s.options[s.selectedIndex].textContent),'Punto del plano · '+target.room);
 assert.match(await c.locator('#shareStatus').innerText(),/Punto marcado/);
 await c.locator('#shareText').fill('Aquí quiero un enchufe.');await c.locator('#shareAdd').click();
 // 3. An image, from the gallery.
 const views=c.locator('.share-comment-view');assert.ok(await views.count()>=1);await views.first().click();
 assert.match(await select.evaluate(s=>s.options[s.selectedIndex].textContent),/^Imagen: /);
 await c.locator('#shareText').fill('Esta vista me encanta.');await c.locator('#shareAdd').click();
 assert.deepEqual(await c.locator('#shareNotes li b').allInnerTexts().then(a=>a.map(s=>s.replace(/^(Imagen|Punto del plano).*/,'$1'))),[bedOption.label,'Punto del plano','Imagen']);
 if(SHOTS)await c.locator('#shareReview').screenshot({path:path.join(SHOTS,'b6-390-client.png')});
 const saved=c.waitForEvent('download');await c.locator('#shareSave').click();const jf=path.join(dir,'obs.json');await (await saved).saveAs(jf);
 const doc=JSON.parse(await fs.readFile(jf,'utf8'));assert.deepEqual(doc.notes.map(n=>n.anchor.kind),['element','point','view']);assert.equal(doc.version,1,'same file version');
 assert.equal(doc.notes[0].anchor.elementId,bed.id);assert.ok(Number.isInteger(doc.notes[1].anchor.x)&&doc.notes[1].anchor.roomId);
 assert.deepEqual(clientErrors,[]);

 // The professional imports it.
 await page.locator('#workArea-design').click();await page.evaluate(()=>FloorPlanReviewUI.open());await page.locator('#reviewImportFile').setInputFiles(jf);
 const recv=page.locator('#reviewDialog .review-received').first();await recv.waitFor();
 assert.deepEqual(await recv.locator('li[data-note] strong').allInnerTexts(),[bedOption.label+': ',`2. Punto del plano · ${target.room}: `,doc.notes[2].anchor.label+': ']);
 assert.equal(await recv.locator('.review-points .review-point').count(),1);assert.equal(await recv.locator('.review-point text').textContent(),'2');
 await shot(page,'b6-1440-professional');
 assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),before,'importing never changes the project');
 // An element removed afterwards is flagged.
 await page.evaluate(id=>{FloorPlanReviewUI.close?.();document.querySelector('#reviewDialog').close();const p=FloorPlanApp.project;p.objects=p.objects.filter(o=>o.id!==id);},bed.id);
 await page.evaluate(()=>FloorPlanReviewUI.open());assert.match(await page.locator('#reviewDialog .review-received li[data-note]').first().innerText(),/\(ya no existe\)/);
 assert.deepEqual(errors,[]);
});
