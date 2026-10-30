// Phase B2: AI render from a real view. The dialog says what is sent and where, asks for consent and the access code,
// sends ONLY the view image and a style to /api/render (intercepted here: no OpenAI call), shows the AI result next
// to the real view, labels it as AI everywhere and never changes the project. Server errors are said plainly.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');let server,browser,url;
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.glb':'model/gltf-binary'};
const PNG='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAYAAAD0In+KAAAAEUlEQVR42mP8z8DwnwEIGBkZAQ0WAv/W3h2LAAAAAElFTkSuQmCC';
before(async()=>{server=createServer(async(req,res)=>{try{const p=new URL(req.url,'http://l').pathname,f=path.resolve(root,'.'+(p==='/'?'/index.html':p));if(!f.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(await fs.readFile(f));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});});
after(async()=>{await browser?.close();await new Promise(r=>server.close(r));});

test('Phase B2: AI render of a real view with consent, access code and honest labels',{timeout:300000},async t=>{
 const context=await browser.newContext({viewport:{width:1440,height:900},acceptDownloads:true});t.after(()=>context.close());
 const page=await context.newPage(),errors=[],external=[],sent=[];let reply={status:200,body:{image:PNG,model:'gpt-image-1',style:'warm',generatedAt:'2026-10-29T12:00:00Z'}};page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async r=>{const u=r.request().url();
  if(u.startsWith(url+'api/render')){sent.push({headers:r.request().headers(),body:JSON.parse(r.request().postData()||'{}')});return r.fulfill({status:reply.status,contentType:'application/json',body:JSON.stringify(reply.body)});}
  if(u.startsWith(url)||u.startsWith('blob:')||u.startsWith('data:'))return r.continue();external.push(u);return r.abort();});
 await page.goto(url);await page.locator('#welcomeExample').click();await page.waitForFunction(()=>window.FloorPlanAIRender&&window.FloorPlanProjectViews);
 const workspace=page.locator('#professionalWorkspace'),dialog=page.locator('#aiRenderDialog');
 await page.locator('#workArea-deliver').click();await workspace.locator('[data-route="prepare-views"]').first().click();
 await page.waitForFunction(()=>FloorPlanProjectViews.status()!=='busy',null,{timeout:240000});const before=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));
 await workspace.getByRole('button',{name:'Generar imágenes',exact:true}).click();await workspace.getByRole('button',{name:'Render IA de: Vista general',exact:true}).click();await dialog.waitFor();
 assert.match(await dialog.locator('#aiRenderConsent').innerText(),/Se envía sólo la imagen de esta vista a OpenAI[\s\S]*No se envían el proyecto, la ubicación ni tus datos/);
 // Consent and access code are required before anything leaves the browser.
 await dialog.locator('#aiRenderGo').click();assert.match(await dialog.locator('#aiRenderStatus').innerText(),/Confirma que entiendes qué se envía/);
 await dialog.locator('#aiRenderAgree').check();await dialog.locator('#aiRenderGo').click();assert.match(await dialog.locator('#aiRenderStatus').innerText(),/Introduce el código de acceso/);assert.equal(sent.length,0);
 await dialog.locator('#aiRenderToken').fill('access-123');await dialog.locator('#aiRenderStyle').selectOption('warm');await dialog.locator('#aiRenderGo').click();
 await dialog.locator('figure.is-ai img').waitFor();
 // Only the image and the style travel, with the access code in its header.
 assert.equal(sent.length,1);assert.deepEqual(Object.keys(sent[0].body).sort(),['image','style']);assert.equal(sent[0].body.style,'warm');
 assert.match(sent[0].body.image,/^data:image\/jpeg;base64,/);assert.equal(sent[0].headers['x-rubik-render-token'],'access-123');
 assert.ok(!JSON.stringify(sent[0].body).includes('rom_'),'no project data in the request');
 assert.deepEqual(await dialog.locator('figure figcaption').allInnerTexts(),['Vista real del proyecto','Render IA (orientativo)']);
 assert.match(await dialog.locator('#aiRenderStatus').innerText(),/Compáralo con la vista real/);
 // The download is a delivery image that says it is AI.
 const download=page.waitForEvent('download');await dialog.locator('#aiRenderDownload').click();const d=await download;assert.equal(d.suggestedFilename(),'rubik-sota-render-ia-vista-general.png');
 const bytes=await fs.readFile(await d.path());assert.equal(bytes.readUInt32BE(16),1600);assert.equal(bytes.readUInt32BE(20),1000);
 const note=await page.evaluate(async()=>{const r=FloorPlanAIRender.results[0];return {count:FloorPlanAIRender.results.length,style:r.style,floor:r.floor};});assert.deepEqual(note,{count:1,style:'warm',floor:null});
 // The same view and style are not sent twice in the session.
 await dialog.locator('#aiRenderGo').click();await page.waitForTimeout(300);assert.equal(sent.length,1);
 // B8: an alternative of finishes for the same view: only the keys travel, the result says it, and both can be compared.
 reply={status:200,body:{image:PNG,model:'gpt-image-1',style:'warm',floor:'microcement',walls:'sage',generatedAt:'2026-10-30T12:00:00Z'}};
 await dialog.locator('#aiRenderFloor').selectOption('microcement');await dialog.locator('#aiRenderWalls').selectOption('sage');await dialog.locator('#aiRenderGo').click();
 await page.waitForFunction(()=>/Suelo: Microcemento · Paredes: Verde salvia/.test(document.querySelector('#aiRenderDialog figure.is-ai figcaption')?.textContent||''));
 assert.equal(sent.length,2);assert.deepEqual(Object.keys(sent[1].body).sort(),['floor','image','style','walls']);assert.deepEqual([sent[1].body.floor,sent[1].body.walls],['microcement','sage']);
 const alts=dialog.locator('#aiRenderAlternatives .ai-render-alt');assert.equal(await alts.count(),2);assert.deepEqual(await alts.locator('span').allInnerTexts(),['Cálido','Cálido · Suelo: Microcemento · Paredes: Verde salvia']);
 assert.match(await dialog.locator('#aiRenderAlternatives').innerText(),/no cambian el proyecto; para usar un acabado, elígelo en Superficies/);
 if(process.env.QA_SHOTS){await fs.mkdir(process.env.QA_SHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.QA_SHOTS,'b8-1440-alternatives.png')});}
 await alts.first().click();assert.deepEqual(await dialog.locator('figure figcaption').allInnerTexts(),['Vista real del proyecto','Render IA (orientativo)']);assert.equal(await dialog.locator('#aiRenderFloor').inputValue(),'');
 assert.equal(await page.evaluate(()=>FloorPlanAIRender.results.length),2);await alts.first().focus();
 // Server answers are said plainly; a wrong access code is forgotten.
 reply={status:401,body:{error:'token'}};await dialog.locator('#aiRenderStyle').selectOption('natural');await dialog.locator('#aiRenderGo').click();
 await page.waitForFunction(()=>/El código de acceso no es correcto/.test(document.querySelector('#aiRenderStatus').textContent));assert.equal(await page.evaluate(()=>localStorage.getItem('rubik-render-token')),null);
 reply={status:503,body:{error:'not-configured'}};await dialog.locator('#aiRenderToken').fill('access-123');await dialog.locator('#aiRenderAgree').check();await dialog.locator('#aiRenderStyle').selectOption('premium');await dialog.locator('#aiRenderGo').click();
 await page.waitForFunction(()=>/no está configurado en este servidor[\s\S]*OPENAI_API_KEY y RUBIK_RENDER_TOKEN/.test(document.querySelector('#aiRenderStatus').textContent));
 await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#aiRenderDialog').open);
 assert.equal(await page.evaluate(()=>document.activeElement?.dataset.route),'ai-overview','focus returns to the view action');
 assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),before,'an AI render never changes the project');
 assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
});
