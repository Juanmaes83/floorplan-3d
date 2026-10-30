// Project-First A1: Deliver, Analyze and My studio show the project and the outputs Rubik already produced, before any
// click. Previews come from the real project (plan, sheet, metric, signature), say what is not ready and never change
// the model. Desktop, laptop, phone and landscape phone.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');let server,browser,url;
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
before(async()=>{server=createServer(async(req,res)=>{try{const p=new URL(req.url,'http://l').pathname,f=path.resolve(root,'.'+(p==='/'?'/index.html':p));if(!f.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(await fs.readFile(f));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});});
after(async()=>{await browser?.close();await new Promise(r=>server.close(r));});

for(const viewport of [{width:1440,height:900},{width:1280,height:800},{width:390,height:844},{width:844,height:390}])test('Project-First A1: the project and its real outputs are visible before any click '+viewport.width+'x'+viewport.height,{timeout:120000},async t=>{
 const mobile=viewport.width<1100,context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile});t.after(()=>context.close());
 const page=await context.newPage(),errors=[],external=[];page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>{const u=r.request().url();if(u.startsWith(url)||u.startsWith('blob:')||u.startsWith('data:'))return r.continue();external.push(u);return r.abort();});
 await page.goto(url);await page.locator('#welcomeExample').click();await page.waitForFunction(()=>window.FloorPlanProfessionalUI&&window.FloorPlanProjectPreview);
 const original=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),workspace=page.locator('#professionalWorkspace');
 const facts=await page.evaluate(()=>{const m=FloorPlanSurfaceMetrics.home(FloorPlanApp.project);return {rooms:FloorPlanApp.geometry.rooms.length,walls:FloorPlanApp.geometry.walls.length,counted:m.levels[0].rooms.filter(r=>r.counted).length,top:m.levels[0].rooms.filter(r=>r.counted).sort((a,b)=>b.areaM2-a.areaM2).slice(0,5).map(r=>typeof nm==='function'?nm(r.name):r.name)};});

 // Case A — Deliver: which project, what documentation and visuals exist, what is ready, what is missing, which identity.
 await page.locator('#workArea-deliver').click();await workspace.getByRole('heading',{name:'Entregar al cliente',exact:true}).waitFor();
 const hero=workspace.locator('.project-context');
 assert.equal(await hero.locator('svg[role=img]').getAttribute('aria-label'),'Vista esquemática de la planta activa');
 assert.equal(await hero.locator('.preview-room').count(),facts.rooms,'the house drawn from its own rooms');assert.equal(await hero.locator('.preview-wall').count(),facts.walls);
 const heroText=await hero.innerText();assert.match(heroText,/Proyecto de ejemplo/);assert.match(heroText,/87,18 m²/);assert.match(heroText,/Estimado/);assert.match(heroText,new RegExp(`${facts.counted} estancias en el cómputo`));
 assert.match(heroText,/Listo para revisar: ficha, lámina, presentación 3D, observaciones/);assert.match(heroText,/Se genera al pulsar: imágenes/);assert.match(heroText,/Falta: firma profesional/);assert.match(heroText,/Presupuesto: no disponible todavía/);
 // Surface schedule preview: its largest rooms, as the schedule lists them.
 const rows=await workspace.locator('.delivery-document li span:first-child').allInnerTexts();assert.deepEqual(rows,facts.top);
 // Sheet: the real sheet document, loaded locally as an image, and its state says it is ready to review.
 const sheet=workspace.locator('[data-module="sheet"]');await sheet.locator('img.project-sheet-image').evaluate(img=>img.decode());
 const image=await sheet.locator('img.project-sheet-image').evaluate(img=>({src:img.src.slice(0,5),w:img.naturalWidth,alt:img.alt}));assert.equal(image.src,'blob:');assert.ok(image.w>0);assert.match(image.alt,/lámina/);
 assert.match(await sheet.innerText(),/Lista para revisar · ajustada a la hoja/);assert.match(await sheet.innerText(),/Sin firma profesional/);
 // 3D: a labelled model scheme, explicitly not a render; images: none shown as ready.
 const presentation=workspace.locator('[data-module="presentation"]');assert.equal(await presentation.locator('svg[role=img]').getAttribute('aria-label'),'Esquema axonométrico del modelo de la planta activa');assert.match(await presentation.innerText(),/No es un render/);
 const images=await workspace.locator('[data-module="images"]').innerText();assert.match(images,/Todavía no hay imágenes guardadas/);assert.match(images,/Se genera al pulsar/);assert.equal(await workspace.locator('[data-module="images"] img').count(),0,'no fake thumbnails');
 assert.match(await workspace.locator('[data-module="budget"]').innerText(),/todavía no disponible/);assert.match(await workspace.locator('[data-module="review"]').innerText(),/Sin observaciones pendientes/);
 assert.match(await workspace.locator('[data-module="studio"] .project-signature').innerText(),/Sin firma profesional/);
 // Existing routes are intact.
 await workspace.getByRole('button',{name:'Abrir lámina',exact:true}).click();await page.locator('#sheetDialog[open]').waitFor();await page.locator('#sheetClose').click();
 await page.waitForFunction(()=>document.activeElement?.dataset.route==='sheet');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1),false);
 assert.equal(await workspace.evaluate(w=>w.scrollWidth>w.clientWidth+1),false,'no horizontal scroll in the workspace');

 // Case B — Analyze: the house stays present and the area reads on the plan.
 await page.locator('#workArea-analyze').click();await workspace.getByRole('heading',{name:'Medidas y superficies',exact:true}).waitFor();
 assert.match(await workspace.locator('.project-context').innerText(),/87,18 m²/);assert.equal(await workspace.locator('.project-context .preview-room.preview-excluded').count(),await page.evaluate(()=>FloorPlanApp.geometry.rooms.filter(r=>r.counted===false).length));

 // Case C — My studio: the selected identity applied to this project's real sheet.
 await page.evaluate(()=>{const p=FloorPlanBrand.saveProfile(localStorage,{name:'Estudio Ejemplo',person:'Profesional de prueba',email:'estudio@example.com'});FloorPlanBrand.setDelivery(localStorage,FloorPlanApp.entryId,{profileId:(p.profile||p).id});});
 await page.locator('#workArea-studio').click();await workspace.locator('.studio-sheet img').evaluate(img=>img.decode());
 assert.match(await workspace.locator('.studio-sheet').innerText(),/Así aparece Estudio Ejemplo en la lámina de este proyecto/);assert.match(await workspace.locator('.project-context').innerText(),/Proyecto de ejemplo/);
 const signed=await workspace.locator('.studio-sheet img').evaluate(async img=>(await (await fetch(img.src)).text()).includes('Estudio Ejemplo'));assert.equal(signed,true,'the preview is the real signed sheet');
 await page.locator('#workArea-deliver').click();assert.match(await workspace.locator('[data-module="studio"] .project-signature').innerText(),/Estudio Ejemplo/);assert.match(await workspace.locator('[data-module="sheet"]').innerText(),/Firmada por Estudio Ejemplo/);

 assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),original,'previews never change the project');
 assert.deepEqual(external,[],'no remote preview, image or font');assert.deepEqual(errors,[]);
});

test('Project-First A1: Deliver follows a change in the project',{timeout:90000},async t=>{
 const context=await browser.newContext({viewport:{width:1280,height:800}});t.after(()=>context.close());const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);await page.locator('#welcomeExample').click();await page.waitForFunction(()=>window.FloorPlanProfessionalUI);const workspace=page.locator('#professionalWorkspace');
 await page.locator('#workArea-deliver').click();const before=await workspace.locator('.project-context-meta').innerText();
 // An existing edit (exclude the largest room from the area) through the app's own mutation path.
 await page.locator('#workArea-design').click();await page.evaluate(()=>mutate(()=>{const g=FloorPlanApp.geometry.rooms.filter(r=>r.counted!==false);FloorPlanApp.project.rooms.find(r=>r.id===g[0].id).countsTowardArea=false;}));
 await page.locator('#workArea-deliver').click();const after=await workspace.locator('.project-context-meta').innerText(),expected=await page.evaluate(()=>FloorPlanSurfaceMetrics.home(FloorPlanApp.project));
 assert.notEqual(after,before);assert.match(after,new RegExp(`${expected.levels[0].rooms.filter(r=>r.counted).length} estancias en el cómputo`));
 assert.match(await workspace.locator('.project-context').innerText(),new RegExp(expected.areaM2.toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2}).replace('.','\\.')+' m²'));
 assert.deepEqual(errors,[]);
});
