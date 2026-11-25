// Phase B3: «Grabar vídeo» in the client presentation. The preview plays the same Blob that is downloaded, the format
// is said honestly (WebM with a warning when MP4 cannot be created), cancelling keeps the previous video and nothing
// else, focus returns to the presentation and the project never changes. Captures go to QA_SHOTS when set.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{createHash}=require('node:crypto'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),SHOTS=process.env.QA_SHOTS||'';let server,browser,url;
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.glb':'model/gltf-binary'};
before(async()=>{server=createServer(async(req,res)=>{try{const p=new URL(req.url,'http://l').pathname,f=path.resolve(root,'.'+(p==='/'?'/index.html':p));if(!f.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(await fs.readFile(f));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});});
after(async()=>{await browser?.close();await new Promise(r=>server.close(r));});
const shot=async(page,name)=>{if(!SHOTS)return;await fs.mkdir(SHOTS,{recursive:true});await page.screenshot({path:path.join(SHOTS,name+'.png')});};
require('./helpers/tour-video-discoverability.cjs')({getBrowser:()=>browser,getOrigin:()=>url});

for(const viewport of [{width:1440,height:900},{width:390,height:844}])
test(`Phase B3: tour video preview is the downloaded file ${viewport.width}x${viewport.height}`,{timeout:420000},async t=>{
 const context=await browser.newContext({viewport,acceptDownloads:true});t.after(()=>context.close());
 const page=await context.newPage(),errors=[],external=[];page.setDefaultTimeout(30000);page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>{const u=r.request().url();if(u.startsWith(url)||u.startsWith('blob:')||u.startsWith('data:'))return r.continue();external.push(u);return r.abort();});
 await page.goto(url);await page.locator('#welcomeExample').click();await page.waitForFunction(()=>window.FloorPlanTourVideo&&window.View3D);
 const before=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),type=await page.evaluate(()=>FloorPlanTourRecorder.pickType());
 await page.locator('#workArea-deliver').click();const workspace=page.locator('#professionalWorkspace');
 // UX-312 PERLA: la indicación vive en el detalle de la ficha compacta («Ver detalles»); sigue en el DOM.
 assert.match(await workspace.textContent(),/Vídeo del recorrido: inicia la presentación y pulsa «Grabar vídeo»/);
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
 const recorded=await page.evaluate(async()=>{
  const {blob,frames,durationMs}=FloorPlanTourVideo.result;
  const previewBytes=await (await fetch(document.getElementById('tourVideoPreview').src)).arrayBuffer();
  const digest=async data=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)));
  return {frames,durationMs,previewHash:await digest(previewBytes),blobHash:await digest(await blob.arrayBuffer())};
 });
 assert.ok(recorded.frames>0&&recorded.durationMs>0,'the recording contains frames and has a positive duration');
 assert.deepEqual(recorded.previewHash,recorded.blobHash,'the player references the exact recorded bytes');
 assert.equal(createHash('sha256').update(bytes).digest('hex'),Buffer.from(recorded.previewHash).toString('hex'),'the download is byte-identical to the preview');
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
// Exportar el vuelo de dron (433 fotogramas a 640×360) cuesta ~200 s de render por CPU en SwiftShader (456 ms/fotograma;
// preparación 0,9 s, codificación 0,06 s): ver docs/integration/perla-ci-322/sculpt-dron-fases.txt y film.cjs.
test('SCULPT plan and drone use the active project and the presentation recorder', {timeout: 600000}, async t => {
 const context=await browser.newContext({viewport:{width:1440,height:900}});
 t.after(()=>context.close());
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());
 await page.goto(url);
 await page.locator('#welcomeExample').click();
 await page.waitForFunction(()=>window.FloorPlanTourVideo&&window.View3D);
 const before=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));
 await page.locator('#workArea-analyze').click();
 await page.getByRole('button',{name:'Comprobar el plano',exact:true}).click();
 const report=page.locator('#planAnalysisDialog');
 assert.match(await report.innerText(),/87,18 m²/);
 await report.locator('#planAnalysisInput').fill('3');
 await report.getByRole('button',{name:'Calcular',exact:true}).click();
 assert.match(await report.innerText(),/Retranqueo pendiente de parcela/);
 await report.getByRole('button',{name:'Cerrar',exact:true}).click();
 await page.getByRole('button',{name:'Sol directo por estancia',exact:true}).click();
 assert.match(await report.innerText(),/Revisa la ubicación/);
 await report.getByRole('button',{name:'Cerrar',exact:true}).click();
 await page.evaluate(()=>FloorPlanApp.setSite({...FloorPlanApp.project.site,northOffsetDeg:0,location:{latitude:40.4,longitude:-3.7,timeZone:'Europe/Madrid',source:{providerId:'manual',type:'user-entered'}}}));
 const configured=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));
 await page.getByRole('button',{name:'Sol directo por estancia',exact:true}).click();
 await report.locator('#planAnalysisInput').fill('2026-06-21');
 await report.getByRole('button',{name:'Calcular',exact:true}).click();
 assert.equal(await report.locator('li').count(),13);
 await report.getByRole('button',{name:'Cerrar',exact:true}).click();
 await page.locator('#workArea-deliver').click();
 await page.getByRole('button',{name:'Preparar presentación',exact:true}).click();
 await page.getByRole('button',{name:'Iniciar presentación',exact:true}).click();
 await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false',null,{timeout:120000});
 await page.locator('#presentationVideo').click();
 const drone=page.locator('input[name=tourVideoMode][value=drone]');
 if(await drone.isDisabled())return t.skip('Chromium has no H.264 encoder');
 await drone.check();
 assert.match(await page.locator('#tourVideoNote').innerText(),/Vuelo exterior de 54 s/);
 await page.locator('#tourVideoClose').click();
 const readView=()=>page.evaluate(()=>{
  const view=View3D.presentationViewState();
  for(const key of ['position','quaternion','target'])view.pose[key]=view.pose[key].map(value=>Number(value.toFixed(9)));
  return view;
 });
 const originalView=await readView();
 const moved=await page.evaluate(async()=>{
  const before=View3D.presentationPose().position.toString(),control=new AbortController();
  let moved=false;
  try{await FloorPlanPresentationFilm.previsualizar({drone:true,signal:control.signal,onProgress:progress=>{
   moved ||= before!==View3D.presentationPose().position.toString();
   if(progress>0)control.abort();
  }});}catch(error){if(error.name!=='AbortError')throw error;}
  return moved;
 });
 assert.equal(moved,true);
 assert.deepEqual(await readView(),originalView,'cancel restores the view');
 const flight=await page.evaluate(async()=>{
  const output=await FloorPlanPresentationFilm.exportar({drone:true,width:640,height:360,fps:8});
  const bytes=new Uint8Array(await output.blob.arrayBuffer());
  return {bytes:Array.from(bytes),frames:output.frames,ms:output.durationMs,type:output.type};
 });
 assert.equal(flight.type,'video/mp4');
 assert.equal(flight.frames,433);
 assert.ok(flight.ms>=54000);
 const bytes=Buffer.from(flight.bytes);
 assert.equal(bytes.subarray(4,8).toString(),'ftyp');
 if(process.env.QA_DRONE_MP4)await fs.writeFile(process.env.QA_DRONE_MP4,bytes);
 assert.deepEqual(await readView(),originalView,'export restores the view');
 assert.notEqual(before,configured);
 assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),configured);
 assert.deepEqual(errors,[]);
});
