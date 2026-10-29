// Project-First A4: the automatic dossier composes the outputs Rubik already produced (real sheet, areas,
// orientation/sun/site, real views, signature) and says what is missing. Professional styles change the composition,
// never the project; the print window carries its own copy of every image. Desktop and phone.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');let server,browser,url;
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.glb':'model/gltf-binary'};
const location={latitude:40.4168,longitude:-3.7038,timeZone:'Europe/Madrid',source:{providerId:'manual',type:'user-entered'}};
before(async()=>{server=createServer(async(req,res)=>{try{const p=new URL(req.url,'http://l').pathname,f=path.resolve(root,'.'+(p==='/'?'/index.html':p));if(!f.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(await fs.readFile(f));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});});
after(async()=>{await browser?.close();await new Promise(r=>server.close(r));});

for(const viewport of [{width:1440,height:900},{width:390,height:844}])test('Project-First A4: automatic dossier with professional styles '+viewport.width+'x'+viewport.height,{timeout:120000},async t=>{
 const mobile=viewport.width<1100,context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile});t.after(()=>context.close());
 const page=await context.newPage(),errors=[],external=[];page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
 await context.route('**/*',r=>{const u=r.request().url();if(u.startsWith(url)||u.startsWith('blob:')||u.startsWith('data:')||u==='about:blank')return r.continue();external.push(u);return r.abort();});
 await page.goto(url);await page.locator('#welcomeExample').click();await page.waitForFunction(()=>window.FloorPlanProfessionalUI&&window.FloorPlanDossier);
 const workspace=page.locator('#professionalWorkspace');
 // The card states what the dossier contains now; missing sections say why, nothing pretends to be ready.
 await page.locator('#workArea-deliver').click();const dcard=workspace.locator('.professional-card[data-module="dossier"]');await dcard.waitFor();
 assert.match(await dcard.locator('.professional-state').innerText(),/^5 de 8 secciones con contenido real$/);
 const missing=await dcard.locator('.dossier-checklist .is-missing').allInnerTexts();assert.deepEqual(missing.map(s=>s.replace(/^· /,'')),['Emplazamiento — sin parcela','Imágenes 3D reales — prepara las vistas','Observaciones — sin observaciones']);
 // North, location and a signature from the app's own APIs, as Orientation and My studio do.
 await page.evaluate(location=>{FloorPlanApp.setSite({...(FloorPlanApp.project.site||{}),northOffsetDeg:30,location});const p=FloorPlanBrand.saveProfile(localStorage,{name:'Estudio Ejemplo',person:'Profesional de prueba',email:'estudio@example.com'});FloorPlanBrand.setDelivery(localStorage,FloorPlanApp.entryId,{profileId:(p.profile||p).id});},location);
 const configured=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));
 await page.locator('#workArea-design').click();await page.locator('#workArea-deliver').click();
 await workspace.getByRole('button',{name:'Preparar dossier',exact:true}).click();await page.locator('#dossierDialog[open]').waitFor();
 const doc=page.locator('#dossierDocument'),titles=()=>doc.locator('.dossier-page>h2').allInnerTexts();
 // Technical: every available section, real sheet and the area table from the metric.
 assert.equal(await page.locator('#dossierStyle').inputValue(),'technical');
 assert.match(await doc.locator('.dossier-cover').innerText(),/Estudio Ejemplo[\s\S]*Proyecto de ejemplo[\s\S]*87,18 m²/);
 assert.deepEqual((await titles()).map(s=>s.toUpperCase()),['PLANO DE DISTRIBUCIÓN','SUPERFICIES','ORIENTACIÓN Y SOL','EXTERIOR','IMÁGENES DE LA VIVIENDA','FUENTES Y ALCANCE']);
 const sheet=await doc.locator('img.dossier-sheet-image').evaluate(async i=>{await i.decode();return {blob:i.src.startsWith('blob:'),w:i.naturalWidth,svg:(await (await fetch(i.src)).text()).includes('Estudio Ejemplo')};});
 assert.deepEqual(sheet,{blob:true,w:sheet.w,svg:true});assert.ok(sheet.w>0,'real signed sheet');
 assert.equal(await doc.locator('.dossier-surfaces tbody tr').count(),await page.evaluate(()=>FloorPlanSurfaceMetrics.home(FloorPlanApp.project).levels[0].rooms.length));
 assert.equal(await doc.locator('.dossier-orientation svg.site-rose,.dossier-orientation svg.site-sun').count(),2);
 assert.match(await doc.locator('.dossier-views').innerText(),/Sin vistas preparadas/);assert.equal(await doc.locator('.dossier-views img').count(),0,'no fake images');
 assert.match(await doc.locator('.dossier-sources').innerText(),/No incluye presupuesto/);
 // Styles reorder and recompose the same content.
 const orders={};for(const style of ['client','realestate','studio']){await page.locator('#dossierStyle').selectOption(style);orders[style]=(await titles()).map(s=>s.toUpperCase());assert.equal(await doc.getAttribute('data-style'),style);}
 assert.equal(orders.client[0],'IMÁGENES DE LA VIVIENDA');assert.ok(!orders.client.includes('FUENTES Y ALCANCE'));
 assert.equal(orders.realestate[1],'SUPERFICIES');assert.equal(orders.studio[0],'PLANO DE DISTRIBUCIÓN');assert.ok(orders.studio.includes('FUENTES Y ALCANCE'));
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1),false);
 // Print window: its own data copies of the images, same sections.
 await page.locator('#dossierStyle').selectOption('technical');await page.evaluate(()=>{window.print=()=>{};});
 const [win]=await Promise.all([context.waitForEvent('page'),page.locator('#dossierPrint').click()]);await win.waitForLoadState();await win.evaluate(()=>{window.print=()=>{};});
 await win.waitForFunction(()=>document.querySelectorAll('.dossier-page').length>0&&!document.querySelector('img[src^="blob:"]'));
 assert.equal(await win.locator('.dossier-page').count(),await doc.locator('.dossier-page').count());assert.ok(await win.locator('img.dossier-sheet-image[src^="data:image/svg+xml"]').count()===1);
 await win.close();await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#dossierDialog').open);
 assert.equal(await page.evaluate(()=>document.activeElement?.dataset.route),'dossier','focus returns to the dossier action');
 assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),configured,'the dossier does not change the project');
 assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
});
