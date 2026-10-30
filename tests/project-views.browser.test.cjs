// Project-First A2: automatic project views are real frames of the 3D view, taken from the presentation's own stops.
// Before preparing, nothing pretends to be an image; afterwards Deliver and «Generar imágenes» show the real frames,
// each downloadable as a delivery image. The editor view, the camera and the project are restored; a later change
// marks the views as out of date instead of showing an old house.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');let server,browser,url;
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.glb':'model/gltf-binary'};
before(async()=>{server=createServer(async(req,res)=>{try{const p=new URL(req.url,'http://l').pathname,f=path.resolve(root,'.'+(p==='/'?'/index.html':p));if(!f.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(await fs.readFile(f));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});});
after(async()=>{await browser?.close();await new Promise(r=>server.close(r));});

for(const viewport of [{width:1440,height:900},{width:390,height:844}])test('Project-First A2: real project views from the 3D view, restored editor '+viewport.width+'x'+viewport.height,{timeout:300000},async t=>{
 const mobile=viewport.width<1100,context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,acceptDownloads:true});t.after(()=>context.close());
 const page=await context.newPage(),errors=[],external=[];page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>{const u=r.request().url();if(u.startsWith(url)||u.startsWith('blob:')||u.startsWith('data:'))return r.continue();external.push(u);return r.abort();});
 await page.goto(url);await page.locator('#welcomeExample').click();await page.waitForFunction(()=>window.FloorPlanProfessionalUI&&window.FloorPlanProjectViews);
 const workspace=page.locator('#professionalWorkspace'),before=await page.evaluate(()=>({project:JSON.stringify(FloorPlanApp.project),view:FloorPlanApp.viewMode}));
 await page.locator('#workArea-deliver').click();await workspace.getByRole('heading',{name:'Entregar al cliente',exact:true}).waitFor();
 // Before: no image pretends to exist; the action says how many views Rubik can prepare.
 const stops=await page.evaluate(()=>FloorPlanProjectViews.plan().stops.map(s=>s.id));assert.equal(stops[0],'overview');assert.ok(stops.length>=2&&stops.length<=5);
 assert.equal(await workspace.locator('[data-module="images"] img').count(),0);assert.match(await workspace.locator('[data-module="images"]').innerText(),/Todavía no hay vistas preparadas/);
 const prepare=workspace.getByRole('button',{name:`Preparar ${stops.length} vistas del proyecto`,exact:true});await prepare.click();
 await page.waitForFunction(()=>FloorPlanProjectViews.status()!=='busy',null,{timeout:240000});
 assert.equal(await page.evaluate(()=>FloorPlanProjectViews.status()),'ready',await page.evaluate(()=>FloorPlanProjectViews.error));
 // After: real PNG frames, labelled, at the delivery image size; the presentation card shows the real overview.
 const frames=await workspace.locator('[data-module="images"] .project-view-image').evaluateAll(imgs=>Promise.all(imgs.map(async i=>{await i.decode();return {alt:i.alt,png:i.src.startsWith('data:image/png'),w:i.naturalWidth,h:i.naturalHeight};})));
 assert.equal(frames.length,stops.length);assert.ok(frames.every(f=>f.png&&f.w===1600&&f.h===820&&/^Vista 3D real: /.test(f.alt)));
 assert.equal(await workspace.locator('[data-module="presentation"] img.project-view-image').getAttribute('alt'),'Vista general real de la vivienda en 3D');
 assert.match(await workspace.locator('[data-module="images"] .professional-state').innerText(),new RegExp(`${stops.length} vistas reales preparadas`));
 assert.match(await workspace.locator('.project-context-ready').innerText(),/Listo para revisar: [^·]*imágenes/);
 // The editor returns as it was: same view mode, same project; keyboard focus stays on the action.
 assert.deepEqual(await page.evaluate(()=>({project:JSON.stringify(FloorPlanApp.project),view:FloorPlanApp.viewMode})),before);
 assert.equal(await page.evaluate(()=>document.activeElement?.dataset.route),'prepare-views');
 // «Generar imágenes»: each view downloads as the delivery image with the project data.
 await workspace.getByRole('button',{name:'Generar imágenes',exact:true}).click();await workspace.getByRole('heading',{name:'Vistas del proyecto',exact:true}).waitFor();
 assert.equal(await workspace.locator('.project-views-card .project-view-image').count(),stops.length);
 const download=page.waitForEvent('download');await workspace.getByRole('button',{name:'Descargar imagen: Vista general',exact:true}).click();const file=await download;
 assert.equal(file.suggestedFilename(),'rubik-sota-vista-general.png');const bytes=await fs.readFile(await file.path());assert.deepEqual([...bytes.subarray(0,4)],[0x89,0x50,0x4e,0x47]);
 assert.equal(bytes.readUInt32BE(16),1600);assert.equal(bytes.readUInt32BE(20),1000,'1600×1000 delivery image: 820 px view + data band');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1),false);
 // A later change marks the views out of date: the old house is not shown as current.
 await page.locator('#workArea-design').click();await page.evaluate(()=>mutate(()=>{FloorPlanApp.project.rooms[0].name='Estancia cambiada';}));
 await page.locator('#workArea-deliver').click();assert.equal(await page.evaluate(()=>FloorPlanProjectViews.status()),'stale');
 assert.equal(await workspace.locator('[data-module="images"] img').count(),0);assert.match(await workspace.locator('[data-module="images"]').innerText(),/El proyecto cambió después de preparar las vistas/);
 assert.equal(await workspace.getByRole('button',{name:`Preparar ${stops.length} vistas del proyecto`,exact:true}).count(),1);
 assert.deepEqual(external,[],'frames are rendered locally');assert.deepEqual(errors,[]);
});
