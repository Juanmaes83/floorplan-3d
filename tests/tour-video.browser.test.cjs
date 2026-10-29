// Phase B3: «Grabar vídeo» in the client presentation. The preview plays the same Blob that is downloaded, the format
// is said honestly (WebM with a warning when MP4 cannot be created), cancelling keeps the previous video and nothing
// else, focus returns to the presentation and the project never changes. Captures go to QA_SHOTS when set.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),SHOTS=process.env.QA_SHOTS||'';let server,browser,url;
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.glb':'model/gltf-binary'};
before(async()=>{server=createServer(async(req,res)=>{try{const p=new URL(req.url,'http://l').pathname,f=path.resolve(root,'.'+(p==='/'?'/index.html':p));if(!f.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(await fs.readFile(f));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});});
after(async()=>{await browser?.close();await new Promise(r=>server.close(r));});
const shot=async(page,name)=>{if(!SHOTS)return;await fs.mkdir(SHOTS,{recursive:true});await page.screenshot({path:path.join(SHOTS,name+'.png')});};

for(const viewport of [{width:1440,height:900},{width:390,height:844}])
test(`Phase B3: tour video preview is the downloaded file ${viewport.width}x${viewport.height}`,{timeout:420000},async t=>{
 const context=await browser.newContext({viewport,acceptDownloads:true});t.after(()=>context.close());
 const page=await context.newPage(),errors=[],external=[];page.setDefaultTimeout(30000);page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>{const u=r.request().url();if(u.startsWith(url)||u.startsWith('blob:')||u.startsWith('data:'))return r.continue();external.push(u);return r.abort();});
 await page.goto(url);await page.locator('#welcomeExample').click();await page.waitForFunction(()=>window.FloorPlanTourVideo&&window.View3D);
 const before=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),type=await page.evaluate(()=>FloorPlanTourRecorder.pickType());
 await page.locator('#workArea-deliver').click();const workspace=page.locator('#professionalWorkspace');
 assert.match(await workspace.innerText(),/Vídeo del recorrido: inicia la presentación y pulsa «Grabar vídeo»/);
 await workspace.getByRole('button',{name:'Preparar presentación'}).click();
 // Two rooms keep the recording short on software rendering; the selection is the professional's, as in the product.
 const rows=page.locator('#presentationConfig .presentation-room-row input');const n=await rows.count();for(let i=2;i<n;i++)await rows.nth(i).uncheck();
 await page.locator('#presentationConfig').getByRole('button',{name:'Iniciar presentación',exact:true}).click();
 await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false',null,{timeout:180000});
 const stops=await page.evaluate(()=>FloorPlanPresentation.plan.stops.length);
 const open=page.locator('#presentationVideo'),dialog=page.locator('#tourVideoDialog');
 await open.click({timeout:60000});await dialog.waitFor();
 assert.match(await dialog.locator('#tourVideoNote').innerText(),new RegExp(`las ${stops} paradas[\\s\\S]*nada se envía`));
 const format=await dialog.locator('#tourVideoFormat').innerText();
 if(type.startsWith('video/mp4'))assert.match(format,/MP4/);else{assert.match(format,/WebM\. Este navegador no puede crear MP4[\s\S]*conviértelo a MP4/);assert.ok(await dialog.locator('#tourVideoFormat.is-warning').count());}
 await shot(page,`b3-${viewport.width}-intro`);
 await dialog.locator('#tourVideoGo').click();await dialog.locator('#tourVideoCancel').waitFor();assert.equal(await dialog.locator('#tourVideoClose').isDisabled(),true,'no closing mid-recording');
 await dialog.locator('#tourVideoPreview').waitFor({timeout:300000});
 const meta=await dialog.locator('#tourVideoMeta').innerText();assert.match(meta,new RegExp(`^${type.startsWith('video/mp4')?'MP4':'WEBM'} · 1280×720 · [\\d,.]+ s · ${stops} paradas · [\\d,.]+ (KB|MB)$`));
 // The preview is a real, playable video of the recorded Blob.
 const preview=await page.evaluate(async()=>{const v=document.querySelector('#tourVideoPreview');if(v.readyState<1)await new Promise((ok,ko)=>{v.onloadedmetadata=ok;v.onerror=()=>ko(Error('video error'));});return {w:v.videoWidth,h:v.videoHeight,src:v.src,size:FloorPlanTourVideo.result.blob.size};});
 assert.deepEqual([preview.w,preview.h],[1280,720]);assert.match(preview.src,/^blob:/);
 await shot(page,`b3-${viewport.width}-preview`);
 const download=page.waitForEvent('download');await dialog.locator('#tourVideoDownload').click();const d=await download;
 assert.equal(d.suggestedFilename(),`rubik-sota-recorrido-${await page.evaluate(()=>FloorPlanTourVideo.filename().replace(/^rubik-sota-recorrido-/,''))}`);
 assert.match(d.suggestedFilename(),type.startsWith('video/mp4')?/\.mp4$/:/\.webm$/,'a WebM file is never named .mp4');
 const bytes=await fs.readFile(await d.path());assert.equal(bytes.length,preview.size,'the download is the previewed Blob');
 // Cancelling a second recording keeps the first video and says nothing was kept.
 // Cancelled at once (a pointer click waits for a stable frame, which on software rendering can outlast the recording).
 await dialog.locator('#tourVideoGo').click();await page.evaluate(()=>document.querySelector('#tourVideoCancel').click());
 await page.waitForFunction(()=>/Grabación cancelada\. No se ha guardado nada/.test(document.querySelector('#tourVideoStatus').textContent),null,{timeout:60000});
 assert.equal(await page.evaluate(()=>FloorPlanTourVideo.result.blob.size),preview.size);assert.equal(await page.evaluate(()=>FloorPlanTourRecorder.busy),false);
 await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#tourVideoDialog').open);
 assert.equal(await page.evaluate(()=>document.activeElement?.id),'presentationVideo','focus returns to the presentation');
 assert.equal(await page.evaluate(()=>FloorPlanPresentation.active),true);
 await page.locator('#presentationClose').click({timeout:30000});await page.waitForFunction(()=>!FloorPlanPresentation.active);
 assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),before,'recording never changes the project');
 assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
});
