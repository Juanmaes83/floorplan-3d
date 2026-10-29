// Phase B7: «Material board» in Entregar. The preview and the download are the same 1600×1100 PNG, built from the
// project; opening it never changes the project and makes no network request.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),SHOTS=process.env.QA_SHOTS||'';let server,browser,url;
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.glb':'model/gltf-binary'};
before(async()=>{server=createServer(async(req,res)=>{try{const p=new URL(req.url,'http://l').pathname,f=path.resolve(root,'.'+(p==='/'?'/index.html':p));if(!f.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(await fs.readFile(f));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});});
after(async()=>{await browser?.close();await new Promise(r=>server.close(r));});
for(const viewport of [{width:1440,height:900},{width:390,height:844}])
test(`Phase B7: material board from the project ${viewport.width}x${viewport.height}`,{timeout:180000},async t=>{
 const context=await browser.newContext({viewport,acceptDownloads:true});t.after(()=>context.close());
 const page=await context.newPage(),errors=[],external=[];page.setDefaultTimeout(30000);page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>{const u=r.request().url();if(u.startsWith(url)||u.startsWith('blob:')||u.startsWith('data:'))return r.continue();external.push(u);return r.abort();});
 await page.goto(url);await page.locator('#welcomeExample').click();await page.waitForFunction(()=>window.FloorPlanMoodboardUI);
 const before=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),workspace=page.locator('#professionalWorkspace');
 await page.locator('#workArea-deliver').click();const cardText=await workspace.locator('[data-route="moodboard"]').locator('xpath=ancestor::*[contains(@class,"professional-card")][1]').innerText();
 assert.match(cardText,/Material board[\s\S]*6 suelos · 0 paredes · 8 colores/);
 await workspace.locator('[data-route="moodboard"]').click();const dialog=page.locator('#moodboardDialog');await dialog.locator('#moodboardPreview').waitFor();
 assert.match(await dialog.locator('#moodboardStatus').innerText(),/^6 suelos · 0 acabados de pared · 8 colores de mobiliario$/);
 assert.match(await dialog.locator('#moodboardNote').innerText(),/nada se inventa/);
 const preview=await dialog.locator('#moodboardPreview').evaluate(async i=>{await i.decode();return [i.naturalWidth,i.naturalHeight];});assert.deepEqual(preview,[1600,1100]);
 if(SHOTS){await fs.mkdir(SHOTS,{recursive:true});await page.screenshot({path:path.join(SHOTS,`b7-${viewport.width}.png`)});}
 const download=page.waitForEvent('download');await dialog.locator('#moodboardDownload').click();const d=await download;
 assert.equal(d.suggestedFilename(),'rubik-sota-material-board-proyecto-de-ejemplo.png');const bytes=await fs.readFile(await d.path());
 assert.equal(bytes.readUInt32BE(16),1600);assert.equal(bytes.readUInt32BE(20),1100);
 if(SHOTS&&viewport.width===1440)await fs.writeFile(path.join(SHOTS,'b7-board.png'),bytes);
 await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#moodboardDialog').open);
 assert.equal(await page.evaluate(()=>document.activeElement?.dataset.route),'moodboard');
 assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),before);assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
});
