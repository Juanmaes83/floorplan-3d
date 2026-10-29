// Phase B1: «Archivo para tu cliente». Rubik produces one self-contained HTML file: it opens from disk with no network
// (Content-Security-Policy, every image inlined), shows the client-style dossier and lets the client write
// observations that save as the rubik-sota.review-notes file the professional imports. Nothing is uploaded.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),Notes=require('../js/review-notes-core.js');let server,browser,url,dir;
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.glb':'model/gltf-binary'};
before(async()=>{dir=await fs.mkdtemp(path.join(os.tmpdir(),'rubik-share-'));server=createServer(async(req,res)=>{try{const p=new URL(req.url,'http://l').pathname,f=path.resolve(root,'.'+(p==='/'?'/index.html':p));if(!f.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(await fs.readFile(f));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});});
after(async()=>{await browser?.close();await new Promise(r=>server.close(r));await fs.rm(dir,{recursive:true,force:true});});

test('Phase B1: client file opens offline, shows the project and returns importable observations',{timeout:180000},async t=>{
 const context=await browser.newContext({viewport:{width:1440,height:900},acceptDownloads:true});t.after(()=>context.close());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);await page.locator('#welcomeExample').click();await page.waitForFunction(()=>window.FloorPlanClientShare);
 await page.evaluate(()=>{const p=FloorPlanBrand.saveProfile(localStorage,{name:'Estudio Ejemplo',person:'Profesional de prueba',email:'estudio@example.com'});FloorPlanBrand.setDelivery(localStorage,FloorPlanApp.entryId,{profileId:(p.profile||p).id});});
 const before=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),workspace=page.locator('#professionalWorkspace');
 await page.locator('#workArea-deliver').click();const cardText=await workspace.locator('.professional-card[data-module="client-file"]').innerText();
 assert.match(cardText,/Archivo para tu cliente/);assert.match(cardText,/sin vistas: prepáralas en Imágenes/,'missing content is said, not faked');assert.match(cardText,/Rubik no sube nada/);
 const download=page.waitForEvent('download');await workspace.getByRole('button',{name:'Descargar archivo para el cliente',exact:true}).click();const d=await download;
 assert.equal(d.suggestedFilename(),'rubik-sota-proyecto-de-ejemplo-para-el-cliente.html');const file=path.join(dir,d.suggestedFilename());await d.saveAs(file);
 const html=await fs.readFile(file,'utf8');assert.match(html,/<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:;/);
 assert.doesNotMatch(html,/<(script|link|img)[^>]+(src|href)="(https?:|\/\/|blob:)/i,'no external or blob resource');assert.doesNotMatch(html,/"walls"\s*:/,'no editable project inside');
 assert.match(await workspace.locator('.professional-card[data-module="client-file"] [role=status]').innerText(),/Archivo descargado \(\d/);
 assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),before,'producing the file does not change the project');
 // The client: opens the file from disk in a separate browser profile, phone size, without network.
 const client=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,acceptDownloads:true});t.after(()=>client.close());
 const requests=[];client.on('request',r=>{if(!/^(data|file|blob):/.test(r.url()))requests.push(r.url());});
 const c=await client.newPage(),clientErrors=[];c.on('pageerror',e=>clientErrors.push(e.message));await c.goto('file://'+file);
 assert.match(await c.title(),/^Proyecto de ejemplo · Propuesta · Estudio Ejemplo$/);
 const text=await c.locator('body').innerText();for(const s of ['Proyecto de ejemplo','87,18 m²','SUPERFICIES','PLANO DE DISTRIBUCIÓN','TUS OBSERVACIONES','Estudio Ejemplo'])assert.ok(text.toUpperCase().includes(s.toUpperCase()),s);
 assert.match(text,/Sin vistas preparadas/);assert.equal(await c.locator('img:not([src^="data:"])').count(),0);
 const sheet=await c.locator('img.dossier-sheet-image').evaluate(async i=>{await i.decode();return i.naturalWidth;});assert.ok(sheet>0,'real sheet renders offline');
 assert.equal(await c.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1),false);
 assert.equal(await c.locator('#shareSave').isDisabled(),true);
 await c.locator('#shareReviewer').fill('Ana Cliente');await c.locator('#shareAnchor').selectOption({label:'Salón'});await c.locator('#shareText').fill('Me gustaría más luz en el salón.');await c.locator('#shareAdd').click();
 await c.locator('#shareAnchor').selectOption({index:0});await c.locator('#shareText').fill('¿Se puede ampliar la cocina?');await c.locator('#shareAdd').click();
 assert.equal(await c.locator('#shareNotes li').count(),2);
 // A note survives reopening the same file (per-version draft in the client's browser).
 await c.reload();assert.equal(await c.locator('#shareNotes li').count(),2);assert.equal(await c.locator('#shareReviewer').inputValue(),'Ana Cliente');
 const saved=c.waitForEvent('download');await c.locator('#shareSave').click();const j=await saved;const version=await page.evaluate(()=>FloorPlanReviewNotes.versionCode(FloorPlanGuide.revision(FloorPlanApp.project)));
 assert.equal(j.suggestedFilename(),`observaciones-${version}.json`);const jf=path.join(dir,j.suggestedFilename());await j.saveAs(jf);
 const doc=Notes.read(await fs.readFile(jf,'utf8'));assert.equal(doc.reviewer,'Ana Cliente');assert.deepEqual(doc.notes.map(n=>[n.anchor.kind,n.anchor.label||null,n.text]),[['room','Salón','Me gustaría más luz en el salón.'],['project',null,'¿Se puede ampliar la cocina?']]);
 assert.deepEqual(requests,[],'the client file makes no network request');assert.deepEqual(clientErrors,[]);
 // The professional imports it through the existing flow: same project, same version.
 await page.locator('#workArea-design').click();await page.evaluate(()=>FloorPlanReviewUI.open());await page.locator('#reviewImportFile').setInputFiles(jf);
 await page.waitForFunction(()=>document.querySelector('#reviewDialog').innerText.includes('Me gustaría más luz en el salón.'));
 const received=await page.locator('#reviewDialog').innerText();assert.match(received,/Ana Cliente/);assert.match(received,/¿Se puede ampliar la cocina\?/);
 assert.deepEqual(errors,[]);
});

test('Phase B1: names cannot inject markup or scripts into the client file',{timeout:60000},async t=>{
 const context=await browser.newContext();t.after(()=>context.close());const page=await context.newPage();
 await page.goto(url);await page.locator('#welcomeExample').click();await page.waitForFunction(()=>window.FloorPlanClientShare);
 const evil='</script><script>window.pwned=1</script><img src=x onerror="window.pwned=2">"&';
 await page.evaluate(evil=>mutate(()=>{FloorPlanApp.project.name=evil;FloorPlanApp.project.rooms[0].name=evil;}),evil);
 const out=await page.evaluate(()=>FloorPlanClientShare.build());assert.equal((out.html.match(/<script/g)||[]).length,3,'only the config, review core and form scripts');
 const file=path.join(dir,'evil.html');await fs.writeFile(file,out.html);const c=await context.newPage(),errors=[];c.on('pageerror',e=>errors.push(e.message));await c.goto('file://'+file);
 assert.equal(await c.evaluate(()=>window.pwned||0),0);assert.equal(await c.title(),evil+' · Propuesta');assert.equal(await c.locator('#shareAnchor option').nth(1).innerText(),evil);assert.deepEqual(errors,[]);
});
