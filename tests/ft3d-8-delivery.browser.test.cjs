/* FT3D-8 delivery lab in real Chromium: brand (FloorPlanBrand), a REAL evolution video recorded, downloaded and played
   back from the downloaded file, cancellation, frozen deliveries, the client presentation, and publication through the
   existing /api/share contract with MOCKED responses (no real upload). FIXTURE data only. Evidence -> FT3D8_DELIVERY_SHOTS. */
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto'),{createServer}=require('node:http'),{chromium}=require('playwright');
const View=require('../api/view.js'),F=require('../labs/ft3d-8/fidelity-fixtures.js');
const root=path.resolve(__dirname,'..'),shots=process.env.FT3D8_DELIVERY_SHOTS||null;
const TYPES={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json'};
const BLOB_HOST='fixturestore.public.blob.vercel-storage.com';
let server,browser,base,tmp;
before(async()=>{
  server=createServer(async(req,res)=>{try{let p=new URL(req.url,'http://local').pathname;if(p.endsWith('/'))p+='index.html';
    const file=path.resolve(root,'.'+decodeURIComponent(p));if(!file.startsWith(root+path.sep))throw Error('path');
    res.setHeader('Content-Type',TYPES[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${server.address().port}/`;
  browser=await chromium.launch({...(process.env.CHROME?{executablePath:process.env.CHROME}:{}),args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required']});
  tmp=await fs.mkdtemp(path.join(require('node:os').tmpdir(),'ft3d8-dlv-'));if(shots)await fs.mkdir(shots,{recursive:true});
});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});
const shot=async(page,name,opts={})=>{if(shots)await page.screenshot({path:path.join(shots,name),...opts});};
const elShot=async(loc,name)=>{if(shots)await loc.screenshot({path:path.join(shots,name)});};
function watch(page){const errors=[],external=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'&&!/^Failed to load resource/.test(m.text()))errors.push(m.text());});
  page.on('request',r=>{const u=r.url();if(!u.startsWith(base)&&!/^(data|blob):/.test(u))external.push(u);});return {errors,external};}
async function open(page,caseId){await page.goto(`${base}labs/ft3d-8/?case=${caseId}`);
  await page.waitForFunction(id=>document.body.dataset.case===id&&window.__ft3dDelivery,caseId,{timeout:30000});}
async function labBrand(page,name='FIXTURE Estudio Demo'){
  const logo=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=180;c.height=60;const x=c.getContext('2d');x.fillStyle='#1f5a66';x.fillRect(0,0,180,60);
    x.fillStyle='#fff';x.font='bold 28px Arial';x.fillText('FX',20,42);return c.toDataURL('image/png').split(',')[1];});
  await page.locator('#brandSel').selectOption('lab');
  await page.fill('#labName',name);await page.fill('#labPerson','Persona Ficticia');await page.fill('#labEmail','estudio@example.com');
  await page.fill('#labPhone','+34 600 000 000');await page.fill('#labWeb','example.com');await page.fill('#labTagline','FIXTURE lema');
  await page.locator('#labLogo').setInputFiles({name:'logo.png',mimeType:'image/png',buffer:Buffer.from(logo,'base64')});
  await page.locator('#labBrandSave').click();await page.waitForFunction(()=>window.__ft3dDelivery.state.source==='lab');
  await page.fill('#brandTitle','FIXTURE La obra de tu casa');await page.locator('#inc-email').check();
}
async function recordVideo(page){
  await page.locator('#videoGo').click();
  await page.waitForFunction(()=>window.__ft3dDelivery.state.video||/cancelad|no válido|no generó|no puede/.test(document.getElementById('videoStatus').textContent),null,{timeout:400000});
  return page.evaluate(()=>{const v=window.__ft3dDelivery.state.video;return v&&{type:v.type,ext:v.ext,bytes:v.bytes,width:v.width,height:v.height,durationMs:v.durationMs,sha256:v.sha256,filename:v.filename,manifestId:window.__ft3dDelivery.state.manifest.id};});
}
const M=require('../js/construction-mp4-muxer.js'),D=require('../js/construction-delivery-core.js'),A=require('../js/construction-project-adapter.js');
// Verify the DOWNLOADED file: container index, real duration, seeking to several points, full playback.
async function verifyVideoFile(file,type,{caseId,declaredMs,prefix}){
  const bytes=await fs.readFile(file),info=M.inspect(bytes);
  assert.equal(info.valid,true,'indexed MP4 (moov present): '+info.reason);assert.deepEqual(info.boxes,['ftyp','mdat','moov']);
  assert.equal(info.width,1280);assert.equal(info.height,720);assert.equal(info.codec,'avc1');
  assert.ok(Math.abs(info.movieDurationSec*1000-declaredMs)<=41,`file duration ${info.movieDurationSec}s vs declared ${declaredMs}ms`);
  assert.ok(info.keyframes.length>=Math.floor(declaredMs/1000),'a keyframe every second makes the file seekable');
  const c=await F.build(caseId),sb=D.storyboard(c.schedule),m=await A.evaluate(c);
  // Seek points inside the timeline whose plan state differs (several construction phases).
  const points=[.08,.3,.48,.64,.8,.97].map(k=>k*declaredMs/1000);
  const phases=points.map(t=>{const f=sb.at(t*1000);return f.segment==='timeline'?D.overlay(m,c.schedule,f.date,null).headline:f.segment;});
  assert.ok(new Set(phases.filter(p=>!['opening','closing'].includes(p))).size>=3,'sampled points show at least three different phases: '+phases.join(' | '));
  const ctx=await browser.newContext();const page=await ctx.newPage();
  await page.route('http://player.local/**',r=>r.request().url().endsWith('/video')?r.fulfill({path:file,contentType:type,headers:{'accept-ranges':'bytes'}}):r.fulfill({body:'<!doctype html><body style="margin:0;background:#000"></body>',contentType:'text/html'}));
  await page.goto('http://player.local/');
  const res=await page.evaluate(async points=>{const v=document.createElement('video');v.muted=true;v.preload='auto';v.src='/video';document.body.append(v);
    await new Promise((r,j)=>{v.onloadedmetadata=r;v.onerror=()=>j(Error('cannot load '+(v.error&&v.error.code)));});
    const duration=v.duration,frames=[];
    const grab=()=>{const cv=document.createElement('canvas');cv.width=v.videoWidth;cv.height=v.videoHeight;const g=cv.getContext('2d');g.drawImage(v,0,0);
      const d=g.getImageData(0,0,cv.width,cv.height).data;let sig=0;for(let i=0;i<d.length;i+=997)sig=(sig*31+d[i])>>>0;return {png:cv.toDataURL('image/png'),sig};};
    for(const t of points){v.currentTime=t;await new Promise(r=>v.addEventListener('seeked',r,{once:true}));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));frames.push({t:v.currentTime,...grab()});}
    // Full playback from the start to the end.
    v.currentTime=0;await new Promise(r=>v.addEventListener('seeked',r,{once:true}));v.playbackRate=2;await v.play();
    await new Promise((r,j)=>{v.addEventListener('ended',r,{once:true});setTimeout(()=>j(Error('playback did not end')),duration*1000+20000);});
    return {duration,w:v.videoWidth,h:v.videoHeight,endedAt:v.currentTime,frames};},points);
  await ctx.close();
  assert.equal(res.w,1280);assert.equal(res.h,720);
  assert.ok(Math.abs(res.duration*1000-declaredMs)<=41,`player duration ${res.duration}s = declared ${declaredMs}ms (no gap between declared and effective)`);
  assert.ok(Math.abs(res.endedAt-res.duration)<0.1,'played to the end');
  res.frames.forEach((f,i)=>assert.ok(Math.abs(f.t-points[i])<0.06,`seek landed at ${f.t} for ${points[i]}`));
  assert.ok(new Set(res.frames.map(f=>f.sig)).size>=5,'seeking shows different frames');
  if(shots)for(const [i,f] of res.frames.entries())await fs.writeFile(path.join(shots,`${prefix}-video-${String(i+1).padStart(2,'0')}-${(points[i]).toFixed(1)}s-${phases[i].replace(/[^\w]+/g,'-').slice(0,40)}.png`),Buffer.from(f.png.split(',')[1],'base64'));
  return {info,player:res,phases};
}

test('desktop · brand, real video, download, playback of the downloaded file, client document',{timeout:900000},async t=>{
  const ctx=await browser.newContext({viewport:{width:1440,height:900},acceptDownloads:true});t.after(()=>ctx.close());
  const page=await ctx.newPage(),{errors,external}=watch(page);
  const shareCalls=[];await page.route('**/api/share',r=>{shareCalls.push(r.request().url());return r.fulfill({status:500,body:'{}'});});
  await open(page,'A');
  // Brand
  await labBrand(page);
  assert.match(await page.locator('#brandPreview').innerText(),/FIXTURE Estudio Demo[\s\S]*FIXTURE La obra de tu casa[\s\S]*estudio@example\.com/);
  assert.doesNotMatch(await page.locator('#brandPreview').innerText(),/600 000 000/,'phone not included');
  await elShot(page.locator('#step3'),'01-selector-marca.png');
  // Cards have a usable size at 1440 px (three per row for steps 3-5, two for 1-2).
  const sizes=await page.evaluate(()=>['step1','step2','step3','step4','step5'].map(id=>Math.round(document.getElementById(id).getBoundingClientRect().width)));
  assert.ok(sizes.slice(0,2).every(w=>w>=640)&&sizes.slice(2).every(w=>w>=420),'card widths '+sizes);
  // Button states before recording.
  const btn=()=>page.evaluate(()=>({go:!document.getElementById('videoGo').disabled,goText:document.getElementById('videoGo').textContent,cancel:!document.getElementById('videoCancel').hidden,
    download:!document.getElementById('videoDownload').hidden,preview:!document.getElementById('videoPreview').hidden}));
  assert.deepEqual(await btn(),{go:true,goText:'Generar vídeo',cancel:false,download:false,preview:false});
  await page.waitForFunction(()=>window.__ft3dDelivery.state.encoder!==undefined);
  assert.match(await page.locator('#videoFormat').innerText(),/MP4 \(H\.264\) indexado/);
  await page.locator('#costMode').selectOption('tasks');
  // Video (button states during recording are checked while it runs).
  await page.locator('#videoGo').click();await page.waitForFunction(()=>window.__ft3dDelivery.state.recording);
  assert.deepEqual(await btn(),{go:false,goText:'Generar vídeo',cancel:true,download:false,preview:false});
  await page.waitForFunction(()=>window.__ft3dDelivery.state.video||/no válido|no generó|no puede|codificador/.test(document.getElementById('videoStatus').textContent),null,{timeout:400000});
  const v=await page.evaluate(()=>{const v=window.__ft3dDelivery.state.video;return v&&{type:v.type,ext:v.ext,bytes:v.bytes,width:v.width,height:v.height,durationMs:v.durationMs,playerDurationMs:v.playerDurationMs,sha256:v.sha256,filename:v.filename,seekable:v.seekable,keyframes:v.keyframes,fps:v.fps,manifestId:window.__ft3dDelivery.state.manifest.id};});
  assert.ok(v,'video produced: '+await page.locator('#videoStatus').innerText());
  assert.deepEqual(await btn(),{go:true,goText:'Grabar de nuevo',cancel:false,download:true,preview:true});
  assert.equal(v.ext,'mp4');assert.equal(v.type,'video/mp4');assert.equal(v.seekable,true);assert.equal(v.fps,25);
  assert.equal(v.width,1280);assert.equal(v.height,720);assert.ok(v.bytes>20000,'non-trivial file');
  const sb=D.storyboard((await F.build('A')).schedule);assert.ok(Math.abs(v.durationMs-Math.round(sb.totalMs/40)*40)<=1,'declared duration = storyboard');
  assert.ok(Math.abs(v.playerDurationMs-v.durationMs)<=41,'player duration = declared');
  assert.match(v.filename,new RegExp(`^rubik-sota-evolucion-fixture-a-vivienda-una-planta-[0-9a-f]{8}\\.${v.ext}$`));
  await elShot(page.locator('#step4'),'02-controles-video.png');
  // The preview element plays the same Blob URL that is downloaded.
  assert.equal(await page.evaluate(()=>document.getElementById('videoPreview').src===window.__ft3dDelivery.state.video.url),true);
  const dl=page.waitForEvent('download');await page.locator('#videoDownload').click();const d=await dl;
  assert.equal(d.suggestedFilename(),v.filename);const file=path.join(tmp,v.filename);await d.saveAs(file);
  const bytes=await fs.readFile(file);assert.equal(bytes.length,v.bytes);
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),v.sha256,'downloaded bytes = manifest SHA-256');
  if(shots)await fs.copyFile(file,path.join(shots,'A-'+v.filename));
  const check=await verifyVideoFile(file,v.type,{caseId:'A',declaredMs:v.durationMs,prefix:'A'});
  if(shots)await fs.writeFile(path.join(shots,'A-video-properties.json'),JSON.stringify({file:v.filename,type:v.type,bytes:v.bytes,sha256:v.sha256,container:check.info.boxes,codec:check.info.codec,
    width:check.player.w,height:check.player.h,declaredMs:v.durationMs,fileDurationSec:check.info.movieDurationSec,playerDurationSec:check.player.duration,playedToEndSec:check.player.endedAt,
    fps:v.fps,samples:check.info.sampleCount,keyframes:check.info.keyframes.length,seekPoints:check.player.frames.map(f=>+f.t.toFixed(2)),phasesAtSeekPoints:check.phases,manifest:v.manifestId},null,1));
  // Video playing in the lab preview
  await page.evaluate(()=>{const p=document.getElementById('videoPreview');p.currentTime=0;return p.play();});await page.waitForTimeout(5500);
  const playing=await page.evaluate(()=>{const v=document.getElementById('videoPreview'),c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;
    c.getContext('2d').drawImage(v,0,0);return {t:v.currentTime,paused:v.paused,png:c.toDataURL('image/png')};});
  assert.ok(playing.t>3&&!playing.paused,'the lab preview plays the generated Blob');
  if(shots)await fs.writeFile(path.join(shots,'03-video-en-reproduccion.png'),Buffer.from(playing.png.split(',')[1],'base64'));
  // Client document
  await page.locator('#docPrepare').click();await page.waitForFunction(()=>window.__ft3dDelivery.state.doc);
  const html=await page.evaluate(()=>window.__ft3dDelivery.state.doc.html);
  assert.ok(html.toLowerCase().startsWith('<!doctype html>'));
  for(const s of ['FIXTURE Estudio Demo','FIXTURE La obra de tu casa','estudio@example.com','Fases del plan','no son gasto ejecutado','identidad no verificada','Alcance parcial',v.manifestId])assert.ok(html.includes(s),s);
  assert.ok(!html.includes('+34 600 000 000'));assert.ok(!/"walls"|sourceImages/.test(html),'no editable project');
  // The document embeds exactly the generated video, and its manifest carries the same SHA-256 and frozen brand.
  const embedded=/<video[^>]+src="data:video\/mp4;base64,([^"]+)"/.exec(html);assert.ok(embedded,'video embedded');
  assert.equal(crypto.createHash('sha256').update(Buffer.from(embedded[1],'base64')).digest('hex'),v.sha256);
  const docManifest=JSON.parse(/<script type="application\/json" id="ft3d8-manifest">([\s\S]*?)<\/script>/.exec(html)[1]);
  assert.equal(docManifest.video.sha256,v.sha256);assert.equal(docManifest.brand.name,'FIXTURE Estudio Demo');assert.equal(docManifest.id,v.manifestId);
  assert.equal(docManifest.costs.mode,'tasks');
  await page.waitForTimeout(800);await elShot(page.locator('#clientPreview'),'04-documento-cliente.png');
  await page.locator('#publishBox summary').click();await elShot(page.locator('#step5'),'05-descargar-compartir.png');
  // Nothing was published automatically.
  assert.deepEqual(shareCalls,[]);
  // Publication WITH the video through the mocked /api/share (no real upload): video first, then the page linking to it.
  await page.unroute('**/api/share');const uploads=[];
  await page.route('**/api/share',r=>{const h=r.request().headers(),kind=h['x-rubik-share-kind'],body=r.request().postDataBuffer(),url=`https://${BLOB_HOST}/rubik-share/fx-${uploads.length}.${kind}`;
    uploads.push({kind,body,url,path:new URL(r.request().url()).pathname});return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({url,kind,bytes:body.length})});});
  await page.locator('#publishVideo').check();await page.locator('#publishAgree').check();await page.fill('#publishToken','fixture-code');
  await page.locator('#publishGo').click();await page.waitForFunction(()=>/Enlace publicado|No publicado/.test(document.getElementById('publishStatus').textContent));
  assert.match(await page.locator('#publishStatus').innerText(),/Enlace publicado/);
  assert.deepEqual(uploads.map(u=>[u.kind,u.path]),[['mp4','/api/share'],['html','/api/share']]);
  assert.equal(crypto.createHash('sha256').update(uploads[0].body).digest('hex'),v.sha256,'the uploaded video is the generated file');
  assert.ok(uploads[1].body.toString().includes(`src="${uploads[0].url}"`),'the published page plays that uploaded video');
  await elShot(page.locator('#step5'),'05b-publicacion-con-video-simulada.png');
  // Professional / client modes (same data).
  await page.locator('[data-mode=client]').click();await page.waitForTimeout(500);
  assert.equal(await page.locator('.coverage').isVisible(),false);assert.match(await page.locator('#clientHeader').innerText(),/FIXTURE Estudio Demo/);
  assert.match(await page.locator('#simulation').innerText(),/no es obra ejecutada/);
  await shot(page,'06-modo-cliente.png');
  await page.locator('[data-mode=pro]').click();
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
});

test('cancel, frozen delivery after a brand change, foreign plan and over-limit video',{timeout:300000},async t=>{
  const ctx=await browser.newContext({viewport:{width:1440,height:900},acceptDownloads:true});t.after(()=>ctx.close());
  const page=await ctx.newPage(),{errors}=watch(page);await open(page,'A');await labBrand(page);
  // Cancel keeps nothing.
  await page.locator('#videoGo').click();await page.waitForFunction(()=>window.__ft3dDelivery.state.recording);await page.waitForTimeout(1500);
  await page.locator('#videoCancel').click();
  await page.waitForFunction(()=>/Grabación cancelada/.test(document.getElementById('videoStatus').textContent));
  assert.equal(await page.evaluate(()=>window.__ft3dDelivery.state.video),null);assert.equal(await page.locator('#videoDownload').isVisible(),false);
  // A delivery is frozen: changing the brand afterwards produces a NEW manifest, the downloaded one stays as it was.
  await page.locator('#docPrepare').click();await page.waitForFunction(()=>window.__ft3dDelivery.state.doc);
  const dl=page.waitForEvent('download');await page.locator('#manifestDownload').click();const first=JSON.parse(await fs.readFile(await (await dl).path(),'utf8'));
  assert.equal(first.brand.name,'FIXTURE Estudio Demo');assert.equal(first.project.id,'prj_fx-house-a');
  await page.fill('#labName','FIXTURE Estudio Renombrado');await page.locator('#labBrandSave').click();
  await page.waitForFunction(()=>window.__ft3dDelivery.snapshot().name==='FIXTURE Estudio Renombrado');
  assert.equal(await page.evaluate(()=>window.__ft3dDelivery.state.manifest),null,'previous delivery is not edited in place');
  await page.locator('#docPrepare').click();await page.waitForFunction(()=>window.__ft3dDelivery.state.doc);
  const second=await page.evaluate(()=>window.__ft3dDelivery.state.manifest);
  assert.notEqual(second.id,first.id);assert.equal(second.brand.name,'FIXTURE Estudio Renombrado');assert.equal(first.brand.name,'FIXTURE Estudio Demo');
  // Over the 4 MB limit: the video is not offered for publication; publishing it is refused with the reason.
  await page.evaluate(()=>{const s=window.__ft3dDelivery.state;s.video={blob:new Blob([new Uint8Array(4*1024*1024+10)],{type:'video/webm'}),type:'video/webm',ext:'webm',bytes:4*1024*1024+10,url:'blob:x',filename:'x.webm',width:1280,height:720,durationMs:9000,sha256:'0'.repeat(64)};});
  await page.locator('#publishBox summary').click();await page.locator('#publishVideo').dispatchEvent('change');
  assert.equal(await page.locator('#publishVideo').isDisabled(),true);assert.match(await page.locator('#publishVideoNote').innerText(),/supera el límite de 4 MB/);
  await assert.rejects(page.evaluate(()=>window.__ft3dDelivery.publish({code:'x',agree:true,withVideo:true})),/supera 4 MB/);
  // Foreign plan: C's geometry with A's plan is rejected; no playback, no video.
  await page.locator('#caseSel').selectOption('C');await page.waitForFunction(()=>document.body.dataset.case==='C');
  const a=await F.build('A');await page.evaluate(s=>window.__ft3dFidelity.loadPart('schedule',s),JSON.stringify(a.schedule));
  assert.match(await page.locator('#planRejected').innerText(),/PLAN DE OTRO PROYECTO \(prj_fx-house-a\)/);
  assert.equal(await page.locator('.transport').getAttribute('data-disabled'),'true');
  assert.equal(await page.locator('#videoGo').isDisabled(),true);assert.match(await page.locator('#videoBlocked').innerText(),/plan válido/);
  await shot(page,'07-plan-de-otro-proyecto.png',{fullPage:true});
  assert.deepEqual(errors,[]);
});

test('publication through the existing /api/share contract (mocked): consent, errors, routes, CSP, no token leak',{timeout:300000},async t=>{
  const ctx=await browser.newContext({viewport:{width:1440,height:900}});t.after(()=>ctx.close());
  const page=await ctx.newPage(),{errors}=watch(page);await open(page,'A');await labBrand(page);
  await page.locator('#docPrepare').click();await page.waitForFunction(()=>window.__ft3dDelivery.state.doc);
  await page.locator('#publishBox summary').click();
  let mode='503';const calls=[];const stored=new Map();
  await page.route('**/api/share',async r=>{const req=r.request(),h=req.headers();calls.push({url:req.url(),headers:h,body:req.postDataBuffer()});
    if(mode==='abort')return r.abort();
    const json=(status,b)=>r.fulfill({status,contentType:'application/json',body:JSON.stringify(b)});
    if(mode==='503')return json(503,{error:'not-configured'});if(mode==='401')return json(401,{error:'token'});if(mode==='413')return json(413,{error:'size'});if(mode==='502')return json(502,{error:'storage-error'});
    const kind=h['x-rubik-share-kind'],url=`https://${BLOB_HOST}/rubik-share/fixture-${calls.length}.${kind}`;stored.set(url,req.postDataBuffer());return json(200,{url,kind,bytes:req.postDataBuffer().length});});
  const go=async()=>{await page.locator('#publishGo').click();await page.waitForFunction(()=>!document.getElementById('publishGo').disabled&&!/Publicando/.test(document.getElementById('publishStatus').textContent));return page.locator('#publishStatus').innerText();};
  // Consent is mandatory and checked before any request.
  await page.fill('#publishToken','fixture-code');assert.match(await go(),/Confirma que entiendes/);assert.equal(calls.length,0);
  await page.locator('#publishAgree').check();
  await page.fill('#publishToken','');assert.match(await go(),/código de acceso/);assert.equal(calls.length,0);
  await page.fill('#publishToken','fixture-code');
  assert.match(await go(),/no están configurados en este servidor.*BLOB_READ_WRITE_TOKEN/);await shot(page,'08-publicacion-503.png',{clip:await page.locator('#step5').boundingBox()});
  mode='401';assert.match(await go(),/código de acceso no es correcto/);
  mode='413';assert.match(await go(),/supera 4 MB/);
  mode='502';assert.match(await go(),/No se ha publicado nada/);
  mode='abort';assert.match(await go(),/No se pudo contactar con el almacenamiento/);
  assert.equal(await page.locator('#publishResult').isVisible(),false,'no link shown after an error');
  // Correct absolute route, never /labs/ft3d-8/api/share; the only secret sent is the access code typed by the person.
  assert.ok(calls.every(c=>new URL(c.url).pathname==='/api/share'));
  assert.ok(calls.every(c=>c.headers['x-rubik-render-token']==='fixture-code'&&!JSON.stringify(c.headers).includes('vercel_blob_rw')));
  // Success (mocked storage): html published and the link opens through /api/view.
  mode='ok';calls.length=0;assert.match(await go(),/Enlace publicado/);
  const link=await page.locator('#publishUrl').inputValue();
  assert.ok(link.startsWith(base+'api/view?f='),link);assert.equal(calls.length,1);assert.equal(calls[0].headers['x-rubik-share-kind'],'html');
  const page0=decodeURIComponent(new URL(link).searchParams.get('f'));const published=stored.get(page0).toString('utf8');
  assert.ok(published.toLowerCase().startsWith('<!doctype html>'));
  await elShot(page.locator('#step5'),'09-publicacion-ok-simulada.png');
  // Open the published document as /api/view would serve it (its CSP header), in a fresh context.
  const cctx=await browser.newContext({viewport:{width:1280,height:900}});t.after(()=>cctx.close());const client=await cctx.newPage(),cerr=[];
  client.on('console',m=>{if(m.type()==='error')cerr.push(m.text());});client.on('pageerror',e=>cerr.push(e.message));
  await client.route('**/api/view**',r=>r.fulfill({status:200,contentType:'text/html; charset=utf-8',headers:{'content-security-policy':View.csp(BLOB_HOST),'x-content-type-options':'nosniff'},body:published}));
  await client.goto(link);assert.match(await client.locator('h1').innerText(),/FIXTURE La obra de tu casa/);
  assert.match(await client.locator('body').innerText(),/Importante[\s\S]*Simulacion planificada/);
  assert.deepEqual(cerr,[],'no CSP violations');await shot(client,'10-documento-cliente-publicado.png',{fullPage:true});
  assert.deepEqual(errors,[]);
});

test('second project with a different geometry (B): video without costs, plays back',{timeout:700000},async t=>{
  const ctx=await browser.newContext({viewport:{width:1440,height:900},acceptDownloads:true});t.after(()=>ctx.close());
  const page=await ctx.newPage(),{errors,external}=watch(page);await open(page,'B');
  assert.equal(await page.locator('#costMode').inputValue(),'none','a building has no C1-C4 building budget');
  assert.match(await page.locator('#stepPlan').innerText(),/presupuesto|RUBIK guarda/i);
  const v=await recordVideo(page);assert.ok(v,'video B');assert.equal(v.width,1280);
  const dl=page.waitForEvent('download');await page.locator('#videoDownload').click();const file=path.join(tmp,'B-'+v.filename);await (await dl).saveAs(file);
  if(shots)await fs.copyFile(file,path.join(shots,'B-'+v.filename));
  await verifyVideoFile(file,v.type,{caseId:'B',declaredMs:v.durationMs,prefix:'B'});
  assert.match(v.filename,/fixture-b-vivienda-en-l-de-dos-plantas/);
  const m=await page.evaluate(()=>window.__ft3dDelivery.state.manifest);
  assert.equal(m.project.id,'bld_fx-house-b');assert.equal(m.costs.allowed,false);assert.equal(m.brand.present,false);assert.equal(m.brand.credit,'Generado con RUBIK SOTA');
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
});

test('mobile 390x844 · delivery steps usable without horizontal scroll',{timeout:180000},async t=>{
  const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});t.after(()=>ctx.close());
  const page=await ctx.newPage(),{errors,external}=watch(page);await open(page,'C');
  await page.locator('#deliverPanel').scrollIntoViewIfNeeded();await labBrand(page,'FIXTURE Estudio Móvil');
  await page.locator('#docPrepare').click();await page.waitForFunction(()=>window.__ft3dDelivery.state.doc);
  assert.match(await page.locator('#docMeta').innerText(),/sin vídeo dentro del archivo/);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'no horizontal scroll');
  await elShot(page.locator('#step3'),'11-movil-marca.png');await elShot(page.locator('#step5'),'12-movil-entrega.png');
  assert.match(await page.locator('#stepPlan').innerText(),/no equivale a la obra presupuestada/);
  await elShot(page.locator('#step2'),'13-advertencias-economicas.png');
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
});

test('fallback without WebCodecs H.264 is announced honestly (real-time MediaRecorder, may not be seekable)',{timeout:120000},async t=>{
  const ctx=await browser.newContext({viewport:{width:1440,height:900}});t.after(()=>ctx.close());
  const page=await ctx.newPage();await page.addInitScript(()=>{delete window.VideoEncoder;});
  await open(page,'A');await page.waitForFunction(()=>window.__ft3dDelivery.state.encoder===null);
  const text=await page.locator('#videoFormat').innerText(),type=await page.evaluate(()=>FloorPlanTourRecorder.pickType());
  if(type.startsWith('video/mp4'))assert.match(text,/tiempo real \(MediaRecorder\): algunos reproductores no permiten saltar/);
  else assert.match(text,/WebM .*No se renombra a \.mp4/);
  assert.equal(await page.locator('#videoFormat').evaluate(e=>e.classList.contains('warn')),true);
});
