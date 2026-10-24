/* Client review by file (result 3, option A): the professional sends the project, the client writes observations
   about that version and downloads observaciones.json, the professional imports it into the same project and decides
   per observation. No observation changes the project; a file from another project is refused; a changed project
   is told that the observations refer to an earlier version. */
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');let server,browser,url;
before(async()=>{server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://l').pathname));if(!file.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':'text/html');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;browser=await chromium.launch({executablePath:process.env.CHROME||undefined});});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});
async function person(t,viewport){const narrow=viewport.width<=1100,context=await browser.newContext({viewport,isMobile:narrow,hasTouch:narrow,acceptDownloads:true});t.after(()=>context.close());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
 const press=async s=>{const l=page.locator(s).first();await l.waitFor({state:'visible',timeout:8000});await l.scrollIntoViewIfNeeded();if(narrow)await l.tap();else await l.click();};
 await page.goto(url);await page.waitForFunction(()=>window.FloorPlanReviewUI);await require('./editor-fixture.cjs')(page);
 const openMenu=async()=>{await press('details.menu summary');};
 return {page,errors,press,openMenu,project:()=>page.evaluate(()=>JSON.stringify(FloorPlanApp.project))};}
const download=async(page,action)=>{const p=page.waitForEvent('download');await action();const d=await p;return {name:d.suggestedFilename(),text:await fs.readFile(await d.path(),'utf8')};};

for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390}])test(`professional → client → professional by file ${viewport.width}x${viewport.height}`,{timeout:180000},async t=>{
 const pro=await person(t,viewport),client=await person(t,viewport),out=process.env.REVIEW_ARTIFACTS||os.tmpdir(),size=`${viewport.width}x${viewport.height}`;
 // 1. The professional sends the project (the existing «Exportar» of the plan).
 await pro.openMenu();const sent=await download(pro.page,()=>pro.press('#exportJson'));
 const sentProject=JSON.parse(sent.text);
 // 2. The client opens it and writes two observations; the project does not change.
 await client.page.locator('#fileIn').setInputFiles({name:sent.name,mimeType:'application/json',buffer:Buffer.from(sent.text)});
 await client.page.waitForFunction(id=>FloorPlanApp.project.id===id,sentProject.id);
 const clientBefore=await client.project();
 await client.openMenu();await client.press('#reviewNotesBtn');await client.page.locator('#reviewDialog[open]').waitFor();
 assert.match(await client.page.locator('#reviewCopyNote').textContent(),/esta es tu copia de la vivienda\. Lo que cambies en ella no llega al profesional/);
 assert.match(await client.page.locator('#reviewIdentity').textContent(),/versión [0-9a-f]{8}\. Las observaciones no cambian la vivienda/);
 assert.equal(await client.page.locator('#reviewDownload').isDisabled(),true,'nothing to download yet');
 const room=sentProject.rooms[0];
 await client.page.locator('#reviewName').fill('Ana');await client.page.locator('#reviewName').dispatchEvent('change');
 await client.page.locator('#reviewAnchor').selectOption(room.id);await client.page.locator('#reviewText').fill('¿Se puede ampliar la ventana?');await client.press('#reviewAdd');
 await client.page.locator('#reviewAnchor').selectOption('');await client.page.locator('#reviewText').fill('Me gusta la distribución');await client.press('#reviewAdd');
 assert.equal(await client.page.locator('#reviewMine li').count(),2);
 await client.page.screenshot({path:path.join(out,`${size}-client-notes.png`)});
 const notes=await download(client.page,()=>client.press('#reviewDownload'));
 assert.match(notes.name,/^observaciones-[0-9a-f]{8}\.json$/);const doc=JSON.parse(notes.text);
 assert.equal(doc.projectId,sentProject.id);assert.equal(doc.reviewer,'Ana');assert.equal(doc.notes.length,2);assert.equal(doc.notes[0].anchor.roomId,room.id);
 assert.ok(!notes.text.includes('"walls"'),'the file carries no project data');
 assert.equal(await client.project(),clientBefore,'writing observations does not change the home');
 // 3. The professional imports them into the same project and decides; the project does not change.
 const proBefore=await pro.project();
 await pro.openMenu();await pro.press('#reviewNotesBtn');await pro.page.locator('#reviewDialog[open]').waitFor();
 await pro.page.locator('#reviewImportFile').setInputFiles({name:notes.name,mimeType:'application/json',buffer:Buffer.from(notes.text)});
 await pro.page.locator('.review-received').waitFor();
 assert.match(await pro.page.locator('.review-received .review-ok').textContent(),/Se refieren a la versión abierta/);
 assert.match(await pro.page.locator('.review-from').textContent(),/^Ana · versión /);
 const [first,second]=doc.notes.map(n=>pro.page.locator(`[data-note="${n.id}"]`));
 await first.locator('[data-decision=incorporate]').click();await pro.page.locator(`[data-note="${doc.notes[1].id}"] [data-decision=discard]`).click();
 assert.equal(await pro.page.locator(`[data-note="${doc.notes[0].id}"] [data-decision=incorporate]`).getAttribute('aria-pressed'),'true');
 assert.match(await pro.page.locator('.review-counts').textContent(),/Implementadas: 0 · se incorporarán: 1 · descartadas: 1 · sin decidir: 0/);
 assert.match(await pro.page.locator(`[data-note="${doc.notes[0].id}"] .review-status`).textContent(),/Se incorporará \(aún no está en la vivienda\)/);
 assert.equal(await pro.project(),proBefore,'deciding does not change the project');
 await pro.page.screenshot({path:path.join(out,`${size}-professional-decides.png`)});
 // 4. Decisions persist in this browser.
 await pro.page.reload();await pro.page.waitForFunction(()=>window.FloorPlanReviewUI);await require('./editor-fixture.cjs')(pro.page);
 await pro.page.evaluate(()=>FloorPlanReviewUI.open());
 assert.equal(await pro.page.locator(`[data-note="${doc.notes[1].id}"] [data-decision=discard]`).getAttribute('aria-pressed'),'true');
 // 5. The professional makes the change, declares it «Hecho en esta versión» and answers the client.
 await pro.page.locator('#reviewDialog .review-close').click();
 await pro.page.evaluate(()=>{FloorPlanApp.project.rooms[0].name+=' ';});await pro.page.evaluate(()=>FloorPlanReviewUI.open());
 assert.match(await pro.page.locator('.review-received .review-warn').textContent(),/la vivienda ha cambiado/);
 const impl=pro.page.locator(`[data-note="${doc.notes[0].id}"] [data-decision=implemented]`);assert.equal(await impl.isDisabled(),false);
 assert.equal(await pro.page.locator(`[data-note="${doc.notes[1].id}"] [data-decision=implemented]`).isDisabled(),true,'only what will be incorporated can be marked done');
 await impl.click();const newVersion=await pro.page.evaluate(()=>FloorPlanReviewNotes.versionCode(FloorPlanGuide.revision(FloorPlanApp.project)));
 assert.equal(await pro.page.locator(`[data-note="${doc.notes[0].id}"] .review-status`).textContent(),`Implementada en la versión ${newVersion}`);
 const answer=await download(pro.page,()=>pro.page.locator('.review-answer').click());const reply=JSON.parse(answer.text);
 assert.deepEqual(reply.items.map(x=>[x.status,x.implementedIn||null]),[['implemented',newVersion],['discarded',null]]);
 await pro.page.locator('#reviewDialog .review-close').click();await pro.openMenu();const sentV2=await download(pro.page,()=>pro.press('#exportJson'));
 // 6. The client opens the answer in the old version (told where the change is), then opens the new version.
 await client.page.locator('#reviewAnswerFile').setInputFiles({name:answer.name,mimeType:'application/json',buffer:Buffer.from(answer.text)});
 await client.page.locator('#reviewAnswerList').waitFor();
 const answered=client.page.locator(`[data-answer="${doc.notes[0].id}"]`);
 assert.match(await answered.textContent(),new RegExp(`Implementada en la versión ${newVersion} · Tienes abierta la versión [0-9a-f]{8}: pide al profesional el proyecto de la versión ${newVersion}`));
 assert.match(await client.page.locator(`[data-answer="${doc.notes[1].id}"]`).textContent(),/Descartada/);
 await client.page.screenshot({path:path.join(out,`${size}-client-answer-old-version.png`)});
 await client.page.locator('#reviewDialog .review-close').click();
 await client.page.locator('#fileIn').setInputFiles({name:sentV2.name,mimeType:'application/json',buffer:Buffer.from(sentV2.text)});
 await client.page.waitForFunction(v=>FloorPlanReviewNotes.versionCode(FloorPlanGuide.revision(FloorPlanApp.project))===v,newVersion);
 await client.page.evaluate(()=>FloorPlanReviewUI.open());
 assert.match(await client.page.locator(`[data-answer="${doc.notes[0].id}"]`).textContent(),/Es la versión que tienes abierta: puedes verlo/);
 await client.page.screenshot({path:path.join(out,`${size}-client-answer-new-version.png`)});
 await pro.page.evaluate(()=>FloorPlanReviewUI.open());
 // 6. A file from another project is refused.
 const other={...doc,projectId:'prj_other',projectName:'Otra vivienda'};
 await pro.page.locator('#reviewImportFile').setInputFiles({name:'otra.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(other))});
 await pro.page.waitForFunction(()=>/otro proyecto/.test(document.querySelector('#toast').textContent));
 assert.equal(await pro.page.locator('.review-received').count(),1);
 assert.equal(await pro.page.evaluate(()=>document.querySelector('#reviewDialog').scrollWidth<=document.querySelector('#reviewDialog').clientWidth+1),true,'no horizontal scroll');
 assert.deepEqual([...pro.errors,...client.errors],[]);
});

test('keyboard: the dialog opens with focus on its title and closes with Escape',{timeout:60000},async t=>{
 const {page,errors}=await person(t,{width:1440,height:900});
 await page.evaluate(()=>FloorPlanReviewUI.open());assert.equal(await page.evaluate(()=>document.activeElement.id),'reviewTitle');
 await page.keyboard.press('Tab');await page.keyboard.press('Escape');assert.equal(await page.locator('#reviewDialog[open]').count(),0);assert.deepEqual(errors,[]);
});

// Finding 20 (24-10-2026): Escape in «Añadir observación» over a running presentation ended the presentation and
// left the dialog open over the editor. Escape closes the top layer only: the dialog first, then the presentation.
test('Escape over the presentation closes the observation dialog only; a second Escape ends the presentation',{timeout:300000,skip:!process.env.THREE_LOCAL_DIR&&'THREE_LOCAL_DIR not set: the presentation needs 3D'},async t=>{
 const context=await browser.newContext({viewport:{width:1440,height:900}});t.after(()=>context.close());
 const page=await context.newPage(),errors=[];page.setDefaultTimeout(120000);page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://cdn.jsdelivr.net/**',async r=>{try{await r.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await require('./helpers/three-module.cjs')(r.request().url(),()=>Promise.reject(Error('no cdn')))});}catch{await r.abort();}});
 await page.goto(url);await page.locator('#welcomeExample').click();await page.waitForTimeout(500);
 await page.locator('#guidePresent').click();await page.getByRole('button',{name:'Iniciar presentación'}).click();
 await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false',null,{timeout:200000});
 await page.locator('#presentationNote').click();await page.locator('#reviewDialog[open]').waitFor();
 await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#reviewDialog').open);await page.waitForTimeout(300);
 assert.equal(await page.evaluate(()=>FloorPlanPresentation.active),true,'the presentation goes on after closing the dialog');
 assert.equal(await page.evaluate(()=>document.activeElement?.id),'presentationNote','the focus returns to «Añadir observación»');
 await page.keyboard.press('Escape');await page.waitForFunction(()=>!FloorPlanPresentation.active,null,{timeout:120000});
 assert.equal(await page.locator('dialog[open]').count(),0,'nothing is left open over the editor');assert.deepEqual(errors,[]);
});
