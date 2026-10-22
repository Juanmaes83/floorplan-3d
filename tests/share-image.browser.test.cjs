/* «Compartir imagen» in the presentation: the image of the current view goes to the system share sheet when files
   can be shared (phones), otherwise a panel offers download, WhatsApp and e-mail. It is an image, never a link to the
   project, and nothing changes in the project. */
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');let server,browser,url;
before(async()=>{server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://l').pathname));if(!file.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':file.endsWith('.webp')?'image/webp':'text/html');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;browser=await chromium.launch({executablePath:process.env.CHROME||undefined,args:['--enable-unsafe-swiftshader']});});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});
const skip=!process.env.THREE_LOCAL_DIR&&'THREE_LOCAL_DIR not set: the presentation needs 3D';
async function present(t,viewport,init){const narrow=viewport.width<=1100,context=await browser.newContext({viewport,isMobile:narrow,hasTouch:narrow,acceptDownloads:true});t.after(()=>context.close());
 const page=await context.newPage(),errors=[];page.setDefaultTimeout(120000);page.on('pageerror',e=>errors.push(e.message));if(init)await page.addInitScript(init);
 await page.route('https://cdn.jsdelivr.net/**',async r=>{try{await r.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await require('./helpers/three-module.cjs')(r.request().url(),()=>Promise.reject(Error('no cdn')))});}catch{await r.abort();}});
 await page.goto(url);await page.locator('#welcomeExample').click();await page.waitForTimeout(500);
 const before=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));
 await page.locator('#guidePresent').click();await page.getByRole('button',{name:'Iniciar presentación'}).click();
 await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false'&&!document.querySelector('#presentationShare').disabled,null,{timeout:200000});
 return {page,errors,before};}

for(const viewport of [{width:1440,height:900},{width:390,height:844}])test(`without file sharing: panel with the image, download, WhatsApp and e-mail ${viewport.width}x${viewport.height}`,{timeout:300000,skip},async t=>{
 const {page,errors,before}=await present(t,viewport,()=>{Object.defineProperty(navigator,'canShare',{value:undefined,configurable:true});});
 await page.locator('#presentationShare').click({timeout:120000});await page.locator('#shareDialog[open]').waitFor({timeout:120000});
 assert.ok(await page.locator('.share-preview').evaluate(i=>i.complete?i.naturalWidth:new Promise(r=>i.onload=()=>r(i.naturalWidth)))>200,'the preview is the real image');
 assert.match(await page.locator('.share-note').textContent(),/no un enlace al proyecto/);
 assert.match(await page.locator('#shareWhatsApp').getAttribute('href'),/^https:\/\/wa\.me\/\?text=.+medidas%20orientativas/);
 assert.match(await page.locator('#shareMail').getAttribute('href'),/^mailto:\?subject=.+&body=.+Adjunta%20la%20imagen/);
 const p=page.waitForEvent('download');await page.locator('#shareDownload').click({timeout:120000});const d=await p,bytes=await fs.readFile(await d.path());
 assert.equal(d.suggestedFilename(),'rubik-sota-vivienda.png');assert.deepEqual([...bytes.subarray(0,4)],[0x89,0x50,0x4e,0x47],'a PNG');
 await page.screenshot({path:path.join(process.env.SHARE_ARTIFACTS||os.tmpdir(),`share-panel-${viewport.width}.png`)});
 await page.locator('#shareDialog .btn:has-text("Cerrar")').click();
 assert.equal(await page.evaluate(()=>FloorPlanPresentation.active),true,'the presentation goes on');
 await page.keyboard.press('Escape');await page.waitForFunction(()=>!FloorPlanPresentation.active,null,{timeout:120000});
 assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),before,'nothing changes in the project');assert.deepEqual(errors,[]);
});

test('with file sharing (phone): the PNG goes to the system share sheet with a text, no panel 390x844',{timeout:300000,skip},async t=>{
 const {page,errors}=await present(t,{width:390,height:844},()=>{window.__shared=null;navigator.canShare=d=>!!d?.files?.length;navigator.share=async d=>{window.__shared={type:d.files[0].type,name:d.files[0].name,size:d.files[0].size,text:d.text,url:d.url||null};};});
 await page.locator('#presentationShare').tap({timeout:120000});await page.waitForFunction(()=>window.__shared,null,{timeout:120000});
 const shared=await page.evaluate(()=>window.__shared);
 assert.equal(shared.type,'image/png');assert.equal(shared.name,'rubik-sota-vivienda.png');assert.ok(shared.size>5000);assert.equal(shared.url,null,'no link');assert.match(shared.text,/medidas orientativas/);
 assert.equal(await page.locator('#shareDialog[open]').count(),0);assert.deepEqual(errors,[]);
});
