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
 await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**',async route=>{if(!webgl)return route.abort();const target=route.request().url();let p=cache.get(target);if(!p){p=run('curl',['--fail','--silent','--show-error','--max-time','30',target],{maxBuffer:4*1024*1024}).then(r=>r.stdout);cache.set(target,p);}await route.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await p});});
 await page.goto(url);await page.waitForFunction(w=>window.FloorPlanPresentation&&(!w||window.View3D),webgl);await page.locator('#welcomeExample').click();return {page,errors};}
const state=page=>page.evaluate(()=>({project:JSON.stringify(FloorPlanApp.project),entry:FloorPlanApp.entryId,goal:FloorPlanGuideUI.state().goal,guideEvidence:JSON.stringify(FloorPlanGuideUI.state().evidence),undo:undoStack.length,redo:redoStack.length,selection:JSON.stringify(ui.sel),view:FloorPlanApp.viewMode}));
async function screenshot(page,name){const dir=process.env.PRESENTATION_ARTIFACTS||'qa-results/serra-r1';await fs.mkdir(dir,{recursive:true});await page.screenshot({path:path.join(dir,name+'.png')});}
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
 await page.locator('#guidePresent').click();await page.locator('.presentation-room-row').nth(1).locator('input').check();
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
 await page.locator('#guidePresent').click();await page.getByRole('button',{name:'Iniciar presentación'}).click();
 await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false');
 assert.match(await progress(),/1 de 3 vistas visitadas/);
 await page.locator('#presentationClose').click();await page.waitForFunction(()=>!FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').hidden);
 assert.deepEqual(await state(page),beforeState);
});

test('3D camera, focus and editor state return after Escape and browser Back',{timeout:120000},async t=>{
 const {page,errors}=await setup(t,{width:1440,height:900});
 await page.locator('[data-view="3d"]').click();await page.waitForFunction(()=>FloorPlanApp.viewMode==='3d'&&!document.body.classList.contains('busy'));
 const beforeState=await state(page),camera=await page.evaluate(()=>View3D.presentationInspect());
 for(const exit of ['Escape','Back']){
  await page.locator('#guidePresent').click();await page.getByRole('button',{name:'Iniciar presentación'}).click();
  await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false');
  await page.getByRole('button',{name:'Siguiente →'}).click();await page.waitForFunction(()=>document.querySelector('#presentationOverlay').dataset.moving==='false');
  if(exit==='Escape')await page.keyboard.press('Escape');else await page.goBack();
  await page.waitForFunction(()=>!FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').hidden&&!document.body.classList.contains('presentation-exiting'));
  const afterState=await state(page);for(const key of Object.keys(beforeState))assert.ok(afterState[key]===beforeState[key],`${exit}: ${key} restored`);
  const restored=await page.evaluate(()=>View3D.presentationInspect());for(const key of ['position','quaternion','target'])for(let i=0;i<restored[key].length;i++)assert.ok(Math.abs(restored[key][i]-camera[key][i])<1e-5,`${exit}: camera ${key}[${i}]`);
  assert.ok(Math.abs(restored.fov-camera.fov)<1e-5);assert.equal(restored.aspect,camera.aspect);
  assert.deepEqual(restored.options,camera.options);assert.deepEqual(restored.doors,camera.doors);assert.deepEqual(restored.canvas,camera.canvas);
  assert.equal(await page.evaluate(()=>document.activeElement.id),'guidePresent');
 }
 assert.deepEqual(errors,[]);
});

test('Escape during 3D loading cancels without a late presentation',{timeout:120000},async t=>{
 const {page,errors}=await setup(t,{width:390,height:844}),beforeState=await state(page);
 await page.locator('#guidePresent').click();await page.getByRole('button',{name:'Iniciar presentación'}).click();await page.keyboard.press('Escape');
 await page.waitForFunction(()=>!FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').hidden&&!document.body.classList.contains('busy'),null,{timeout:30000});
 const afterState=await state(page);for(const key of Object.keys(beforeState))assert.ok(afterState[key]===beforeState[key],`${key} restored after cancel`);
 assert.deepEqual(errors,[]);
});

test('missing 3D runtime returns to the 2D document with an explanation',{timeout:45000},async t=>{
 const {page}=await setup(t,{width:390,height:844},false),beforeState=await state(page);
 await page.locator('#guidePresent').click();await page.getByRole('button',{name:'Iniciar presentación'}).click();
 await page.waitForFunction(()=>document.querySelector('#presentationOverlay').hidden&&!document.body.classList.contains('presentation-exiting'));
 const afterState=await state(page);for(const key of Object.keys(beforeState))assert.ok(afterState[key]===beforeState[key],`${key} restored without 3D`);
 assert.ok((await page.locator('#toast').textContent()).includes('3D no disponible'));
});

test('an empty project explains the layout prerequisite without starting 3D',{timeout:45000},async t=>{
 const {page,errors}=await setup(t,{width:390,height:844});
 await page.locator('#welcomeBtn').click();await page.locator('#welcomeBlank').click();await page.locator('#roomDesignCancel').click();
 if(await page.locator('#welcomeDialog').evaluate(d=>d.open))await page.locator('#welcomeReturn').click();
 const beforeState=await state(page);assert.equal(await page.evaluate(()=>FloorPlanApp.project.rooms.length),0);
 await page.locator('#actionSearchBtn').click();await page.fill('#editorActionInput','presentar mi vivienda');await page.locator('#editorActionResults [role=option]').first().click();
 assert.equal(await page.locator('#presentationConfig').evaluate(d=>d.open),true);
 assert.ok((await page.locator('#presentationConfig').textContent()).includes('Primero crea una estancia'));
 await page.getByRole('button',{name:'Ir a Distribuir'}).click();
 assert.equal(await page.locator('#guideDialog').evaluate(d=>d.open),true);
 const afterState=await state(page);for(const key of Object.keys(beforeState))assert.ok(afterState[key]===beforeState[key],`${key} unchanged for empty project`);
 assert.deepEqual(errors,[]);
});

test('R2 room selection and order persist outside project; stale room IDs reconcile on reload',{timeout:120000},async t=>{
 const {page,errors}=await setup(t,{width:390,height:844});
 const original=await state(page),key=await page.evaluate(()=>FloorPlanPresentationCore.key(FloorPlanApp.entryId,FloorPlanApp.project.id));
 await page.locator('#guidePresent').click();
 assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),null);
 await page.locator('.presentation-room-row').nth(1).locator('input').check();
 await page.getByRole('button',{name:'Subir Baño en suite'}).click();
 await page.getByRole('button',{name:'Cancelar'}).click();
 assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),null);
 assert.deepEqual(await state(page),original);
 await page.locator('#guidePresent').click();
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
 await page.locator('#guidePresent').click();
 assert.equal(await page.locator('.presentation-room-row').first().locator('span').textContent(),'Baño en suite');
 assert.equal(await page.locator('.presentation-room-row').nth(0).locator('input').isChecked(),true);
 assert.equal(await page.locator('.presentation-room-row').nth(1).locator('input').isChecked(),true);
 await page.locator('.presentation-room-row').first().locator('input').uncheck();
 await page.getByRole('button',{name:'Cancelar'}).click();
 assert.deepEqual(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).roomIds,key),saved.roomIds);
 await page.evaluate(k=>{const p=JSON.parse(localStorage.getItem(k));p.revision='old';p.roomIds=['removed-room',...p.roomIds];localStorage.setItem(k,JSON.stringify(p));},key);
 await page.reload();await page.waitForFunction(()=>window.FloorPlanPresentation);
 await page.locator('#guidePresent').click();
 assert.match(await page.locator('.presentation-config-message').textContent(),/1 estancia/);
 assert.equal(await page.locator('.presentation-room-row').first().locator('span').textContent(),'Baño en suite');
 await page.getByRole('button',{name:'Cancelar'}).click();
 assert.deepEqual(errors,[]);
});

test('R2 changing active project invalidates the live plan and keeps sidecars isolated',{timeout:90000},async t=>{
 const {page,errors}=await setup(t,{width:844,height:390});
 await page.locator('#guidePresent').click();await page.getByRole('button',{name:'Iniciar presentación'}).click();
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
 await page.locator('#guidePresent').click();await page.getByRole('button',{name:'Iniciar presentación'}).click();
 await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false');
 const oldCamera=await page.evaluate(()=>View3D.presentationInspect().position);
 await page.setViewportSize({width:844,height:390});
 await page.waitForFunction(()=>{const c=document.querySelector('#view3d canvas').getBoundingClientRect(),s=View3D.presentationInspect();return c.width>0&&Math.abs(s.aspect-c.width/c.height)<.03;});
 await page.waitForFunction(old=>{const s=View3D.presentationInspect();return document.querySelector('#presentationOverlay').dataset.moving==='false'&&s.position.some((v,i)=>Math.abs(v-old[i])>.1);},oldCamera);
 await fs.mkdir('qa-results/serra-r2',{recursive:true});await page.screenshot({path:'qa-results/serra-r2/360x800-resized-to-844x390.png'});
 await page.evaluate(()=>mutate(()=>{project.rooms[0].name='Dormitorio actualizado';}));
 await page.waitForFunction(()=>!FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').hidden);
 assert.equal(await page.evaluate(()=>FloorPlanApp.project.rooms[0].name),'Dormitorio actualizado');
 await page.locator('#guidePresent').click();
 assert.match(await page.locator('.presentation-config-message').textContent(),/El plano cambió/);
 await page.getByRole('button',{name:'Cancelar'}).click();
 assert.deepEqual(errors,[]);
});

test('R2 project switch during 3D loading cannot reopen a stale presentation',{timeout:90000},async t=>{
 const {page,errors}=await setup(t,{width:390,height:844});
 await page.locator('#guidePresent').click();await page.getByRole('button',{name:'Iniciar presentación'}).click();
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
 await page.locator('#guidePresent').click();await page.locator('.presentation-room-row').nth(1).locator('input').check();
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
