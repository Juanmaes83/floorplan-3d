// GOV-08 S3 / ENT-02 · Expiry of client links in the real app. The real api/share.js, api/view.js, api/delivery.js,
// api/unshare.js and api/publications.js run over a fake in-memory Blob store; the server clock is simulated and the
// browser clock is moved with Playwright's clock, so «before», «at» and «after» the expiry are checked for real.
// Synthetic project (RUBIK's example) and fictitious codes only: no network, nothing real is published or deleted.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{Readable}=require('node:stream'),{chromium}=require('playwright');
const Share=require('../api/share.js'),View=require('../api/view.js'),Delivery=require('../api/delivery.js'),Unshare=require('../api/unshare.js'),Pubs=require('../api/publications.js');
const EX=require('../docs/contracts/examples/floorplan-project-v1.example.json');
const root=path.resolve(__dirname,'..'),SHOTS=process.env.GOV08_S3_SHOTS||null;let server,browser,url;
const SHARE='share-fixture-code-0123456789abcdef',RENDER='render-fixture-code-0123456789abcdef';
const env={BLOB_READ_WRITE_TOKEN:'vercel_blob_rw_S3ui_secret',RUBIK_SHARE_TOKEN:SHARE,RUBIK_RENDER_TOKEN:RENDER},HOST='s3ui.public.blob.vercel-storage.com';
const T0=Date.UTC(2026,10,17,9,0),DAY=86400000;
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.glb':'model/gltf-binary','.hdr':'application/octet-stream','.wasm':'application/wasm'};
before(async()=>{server=createServer(async(req,res)=>{try{const p=new URL(req.url,'http://l').pathname,f=path.resolve(root,'.'+(p==='/'?'/index.html':p));if(!f.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(await fs.readFile(f));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||undefined,args:['--no-sandbox','--enable-unsafe-swiftshader']});});
after(async()=>{await browser?.close();await new Promise(r=>server.close(r));});
const shot=async(page,name)=>{if(SHOTS){await fs.mkdir(SHOTS,{recursive:true});await page.screenshot({path:path.join(SHOTS,name+'.png')});}};
function fakeRes(){return {statusCode:0,headers:{},body:'',setHeader(k,v){this.headers[k.toLowerCase()]=v;},end(b){this.body=b;}};}
// One fake store + simulated server clock + the real functions behind the app's routes.
async function rig(viewport){
 const context=await browser.newContext({viewport,isMobile:viewport.width<1000,hasTouch:viewport.width<1000,timezoneId:'Europe/Madrid',locale:'es-ES'});
 const store=new Map(),calls=[],external=[],errors=[],clock={now:T0};let n=0;
 const blobFetch=async(u,init={})=>{
  if(init.method==='PUT'){let p=new URL(u).pathname;if(init.headers['x-add-random-suffix']==='1')p=p.replace(/\.(html|mp4|webm)$/,`-R${++n}x.$1`);store.set(p,Buffer.from(init.body));return {ok:true,status:200,json:async()=>({url:`https://${HOST}${p}`})};}
  if(u.startsWith('https://blob.vercel-storage.com/?')){const pre='/'+new URL(u).searchParams.get('prefix');return {ok:true,status:200,json:async()=>({blobs:[...store.keys()].filter(p=>p.startsWith(pre)).map(p=>({url:`https://${HOST}${p}`,pathname:p.slice(1),size:store.get(p).length,uploadedAt:new Date(T0).toISOString()})),hasMore:false})};}
  if(u==='https://blob.vercel-storage.com/delete'){for(const x of JSON.parse(init.body).urls)store.delete(new URL(x).pathname);return {ok:true,status:200,json:async()=>({})};}
  const hit=store.get(new URL(u).pathname);return hit?{ok:true,status:200,text:async()=>hit.toString(),headers:{get:()=>String(hit.length)},body:null}:{ok:false,status:404};};
 const opts=()=>({env,fetchImpl:blobFetch,now:()=>clock.now});
 const routes={'api/share':Share.handler,'api/unshare':Unshare.handler,'api/publications':Pubs.handler};
 await context.route('**/*',async r=>{const req=r.request(),u=req.url();
  for(const [route,handler] of Object.entries(routes))if(u.startsWith(url+route)){
   const body=req.postDataBuffer()||Buffer.alloc(0),stream=Readable.from([body]);stream.method=req.method();stream.headers=await req.allHeaders();stream.headers.host??=new URL(url).host;
   calls.push({route,headers:stream.headers});const out=fakeRes();await handler(stream,out,opts());return r.fulfill({status:out.statusCode,headers:out.headers,body:out.body});}
  for(const [route,handler] of [['api/view',View.handler],['api/delivery',Delivery.handler]])if(u.startsWith(url+route)){const out=fakeRes();await handler({method:'GET',url:u.slice(url.length-1)},out,opts());return r.fulfill({status:out.statusCode,headers:out.headers,body:out.body});}
  if(u.startsWith(url)||u.startsWith('blob:')||u.startsWith('data:'))return r.continue();external.push(u);return r.abort();});
 // The browser clock follows the server clock: «Mis publicaciones» judges expiry with Date.now().
 await context.clock.install({time:T0});
 const page=await context.newPage();page.setDefaultTimeout(60000);page.on('pageerror',e=>errors.push(e.message));
 const advance=async ms=>{clock.now+=ms;await context.clock.setSystemTime(clock.now);};
 return {context,page,store,calls,external,errors,clock,advance,blobFetch,opts};
}
async function openDialog(page){
 if(await page.locator('#shareLinkDialog[open]').count())await page.locator('#shareLinkClose').click();
 await page.locator('#workArea-deliver').click();await page.locator('#professionalWorkspace').getByRole('button',{name:'Publicar enlace para el cliente'}).click();
 const d=page.locator('#shareLinkDialog');await d.waitFor();return d;
}

test('S3: every link expires (7/30/90, 30 by default); expired links close, legacy ones are only identified, expired files are purged',{timeout:600000},async t=>{
 const r=await rig({width:1440,height:900});t.after(()=>r.context.close());const {page,store}=r;
 await page.goto(url);await page.locator('#welcomeExample').click();await page.waitForFunction(()=>window.FloorPlanShareLink&&window.FloorPlanShareExpiry);
 const project=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));
 // A link published BEFORE S3 from this browser: no date in its name nor in the register.
 const legacyPath='/rubik-share/casa-antigua-Ab12.html';store.set(legacyPath,Buffer.from('<!doctype html><html lang="es"><body>Documento anterior</body></html>'));
 const legacyUrl=`https://${HOST}${legacyPath}`;
 await page.evaluate(([p,link])=>localStorage.setItem('rubik-share-publications-v1',JSON.stringify([{page:p,link,files:[p],project:'Casa antigua',publishedAt:'2026-11-01T10:00:00.000Z',state:'active'}])),[legacyUrl,url+'api/view?f='+encodeURIComponent(legacyUrl)]);
 let dialog=await openDialog(page);const pubs=dialog.locator('#sharePublications');
 // The choice: 7, 30 (default, recommended) or 90 days — no «no expiry» option.
 const ttl=dialog.locator('#shareLinkTtl');assert.deepEqual(await ttl.locator('input').evaluateAll(xs=>xs.map(x=>[x.value,x.checked])),[['7',false],['30',true],['90',false]]);
 assert.match(await ttl.innerText(),/Caducidad del enlace[\s\S]*30 días \(recomendado\)[\s\S]*deja de abrirse/);assert.doesNotMatch(await ttl.innerText(),/sin caducidad|ilimitad|nunca/i);
 assert.match(await dialog.locator('#shareLinkNote').innerText(),/Cada enlace caduca en la fecha que elijas \(7, 30 o 90 días\)/);
 assert.match(await pubs.locator('.share-publication').first().innerText(),/sin fecha de caducidad \(publicado antes de la caducidad de enlaces\)/);
 assert.equal(await pubs.locator('.share-publication').first().getAttribute('data-expiry'),'legacy');
 await shot(page,'01-dialog-ttl');
 const publish=async days=>{if(days)await dialog.locator('#shareLinkTtl'+days).check();await dialog.locator('#shareLinkAgree').check();if(!(await dialog.locator('#shareLinkToken').inputValue()))await dialog.locator('#shareLinkToken').fill(SHARE);
  const done=page.waitForResponse(x=>x.url().startsWith(url+'api/share'));await dialog.locator('#shareLinkGo').click();await done;await dialog.locator('#shareLinkUrl').waitFor();return dialog.locator('#shareLinkUrl').inputValue();};
 const link7=await publish(7);assert.equal(r.calls.at(-1).headers['x-rubik-share-ttl'],'7');
 assert.match(await dialog.locator('#shareLinkMeta').innerText(),/caduca el 24\/11\/26/);
 const link30=await publish(30);assert.equal(r.calls.at(-1).headers['x-rubik-share-ttl'],'30');
 const pageOf=l=>decodeURIComponent(new URL(l).searchParams.get('f'));
 const item=l=>pubs.locator(`.share-publication[data-pub="${pageOf(l)}"]`);
 assert.match(await item(link7).innerText(),/Publicado · caduca el 24\/11\/26/);assert.match(await item(link30).innerText(),/Publicado · caduca el 17\/12\/26/);
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('rubik-share-publications-v1')));
 assert.deepEqual(saved.filter(e=>e.expiresAt).map(e=>[e.ttlDays,e.expiresAt]).sort(),[[7,new Date(T0+7*DAY).toISOString()],[30,new Date(T0+30*DAY).toISOString()]].sort());
 for(const leak of [SHARE,RENDER,'vercel_blob_rw','"walls"'])assert.ok(!JSON.stringify(saved).includes(leak),leak);
 const client=await r.context.newPage();assert.equal((await client.goto(link7)).status(),200,'before the date it opens');
 await shot(page,'02-published');
 // One minute before the date: still open. At the date: closed with a clear message, and the store is NOT read.
 await r.advance(7*DAY-60000);assert.equal((await client.goto(link7)).status(),200);
 await r.advance(60000);const expired=await client.goto(link7);assert.equal(expired.status(),410);assert.match(await client.locator('body').innerText(),/Este enlace ha caducado\. Pide al profesional un enlace nuevo\./);
 await shot(client,'03-link-expired');
 assert.equal((await client.goto(link30)).status(),200,'the 30-day link keeps opening');
 assert.equal((await client.goto(url+'api/view?f='+encodeURIComponent(legacyUrl))).status(),200,'the legacy link keeps opening: no retroactive expiry');
 // «Mis publicaciones» after the date: expired, active and legacy, each with its own words.
 dialog=await openDialog(page);
 assert.equal(await item(link7).getAttribute('data-expiry'),'expired');assert.match(await item(link7).innerText(),/Caducado el 24\/11\/26[\s\S]*ya no se abre[\s\S]*siguen en el almacén/);
 assert.equal(await item(link30).getAttribute('data-expiry'),'active');
 // The store: review (any browser), then purge the expired files after a dry run and a confirmation.
 await dialog.locator('#shareStoreReview').click();await dialog.locator('#shareStoreSummary').waitFor();
 assert.match(await dialog.locator('#shareStoreSummary').innerText(),/1 activa\(s\) · 1 caducada\(s\) · 1 archivo\(s\) sin fecha de caducidad/);
 assert.match(await dialog.locator('#shareStoreLegacy').innerText(),/siguen abriéndose[\s\S]*decisión expresa/);
 const files=store.size;await dialog.locator('#shareStorePurge').click();await dialog.locator('#shareStorePurgeConfirm').waitFor();
 assert.equal(store.size,files,'the dry run deletes nothing');assert.match(await dialog.locator('#shareStorePurgeWarning').innerText(),/Se borrarán 1 archivo\(s\)[\s\S]*sin fecha de caducidad y los que siguen activos no se tocan/);
 await shot(page,'04-purge-confirm');
 await dialog.locator('#shareStorePurgeCancel').click();assert.equal(store.size,files);
 await dialog.locator('#shareStorePurge').click();await dialog.locator('#shareStorePurgeConfirm').click();
 await page.waitForFunction(()=>/Caducados borrados: 1 archivo/.test(document.querySelector('#shareLinkStatus').textContent));
 assert.equal(store.has(new URL(pageOf(link7)).pathname),false,'the expired file is deleted');assert.equal(store.has(legacyPath),true,'the legacy file is untouched');assert.ok(store.has(new URL(pageOf(link30)).pathname),'the active file is untouched');
 assert.equal(await item(link7).getAttribute('data-state'),'withdrawn','this browser records the purge');
 assert.match(await dialog.locator('#shareStoreSummary').innerText(),/1 activa\(s\) · 0 caducada\(s\) · 1 archivo/);
 await shot(page,'05-after-purge');
 // Early withdrawal (S2) before its date still works for the 30-day link.
 await item(link30).getByRole('button',{name:'Retirar'}).click();const w=page.waitForResponse(x=>x.url().startsWith(url+'api/unshare'));await item(link30).getByRole('button',{name:'Sí, retirar enlace'}).click();
 assert.equal((await w).status(),200);assert.equal((await client.goto(link30)).status(),404);
 // Only the publishing code is ever sent; nothing external; the project did not change.
 for(const c of r.calls){assert.equal(c.headers['x-rubik-share-token'],SHARE);assert.equal(c.headers['x-rubik-render-token'],undefined);}
 assert.deepEqual(r.external,[]);assert.deepEqual(r.errors,[]);assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),project);
});

test('S3 · ENT-01: an expired 3D visit says so and offers no retry; before its date it opens; legacy visits keep opening',{timeout:300000},async t=>{
 const r=await rig({width:1440,height:900});t.after(()=>r.context.close());
 const p=JSON.parse(JSON.stringify(EX));p.schemaVersion='1.12.0';
 const snap=Delivery.Core.buildSnapshot({project:p,now:new Date('2026-11-10T10:00:00Z'),rand:()=>0.42,title:'Casa sintética'}),body=Buffer.from(JSON.stringify(snap));
 const req=Readable.from([body]);req.method='POST';req.headers={host:'rubik.example','x-rubik-share-token':SHARE,'x-rubik-share-kind':'delivery','x-rubik-share-ttl':'7'};
 const out=fakeRes();await Share.handler(req,out,r.opts());const visitUrl=JSON.parse(out.body).url;assert.match(visitUrl,/--x\d{12}\.delivery\.json$/);
 const legacyVisit=`https://${HOST}/rubik-share/casa-1a2b3c.delivery.json`;r.store.set(new URL(legacyVisit).pathname,body);
 const open=async u=>{await r.page.goto(url+'?entrega='+encodeURIComponent(u));await r.page.locator('#deliveryGate:not([data-state="loading"])').waitFor({timeout:60000});return r.page.locator('#deliveryGate').getAttribute('data-state');};
 assert.match(await open(visitUrl),/^(ready|no-3d)$/,'before the date the visit opens');
 await r.advance(7*DAY);assert.equal(await open(visitUrl),'error');
 assert.match(await r.page.locator('#deliveryGate').innerText(),/Esta visita ha caducado[\s\S]*Pide al profesional un enlace nuevo/);assert.equal(await r.page.locator('#deliveryRetry').count(),0,'no retry for an expired visit');
 await shot(r.page,'06-visit-expired');
 assert.match(await open(legacyVisit),/^(ready|no-3d)$/,'a visit published before S3 keeps opening');
 assert.deepEqual(r.external,[]);assert.deepEqual(r.errors,[]);
});

test('S3 consistency from the UI: page, tour video and 3D visit share one publication id and date, and close and purge together',{timeout:600000},async t=>{
 const r=await rig({width:1440,height:900});t.after(()=>r.context.close());const {page,store}=r;
 await page.goto(url);await page.locator('#welcomeExample').click();await page.waitForFunction(()=>window.FloorPlanShareLink&&window.FloorPlanDeliveryPreview?.eligible());
 // A synthetic tour video (a few WebM header bytes) stands in for a recorded one: only its upload path is under test.
 await page.evaluate(()=>{const blob=new Blob([new Uint8Array([0x1a,0x45,0xdf,0xa3,1,2,3,4])],{type:'video/webm'});window.FloorPlanTourVideo={...window.FloorPlanTourVideo,result:{blob,extension:'webm'}};});
 const dialog=await openDialog(page);
 await dialog.locator('#shareLinkTtl90').check();await dialog.locator('#shareLinkVideo').check();await dialog.locator('#shareLink3d').check();await dialog.locator('#shareLinkAgree').check();await dialog.locator('#shareLinkToken').fill(SHARE);
 await dialog.locator('#shareLinkGo').click();await dialog.locator('#shareLinkUrl').waitFor({timeout:120000});
 const shares=r.calls.filter(c=>c.route==='api/share');assert.deepEqual(shares.map(c=>[c.headers['x-rubik-share-kind'],!!c.headers['x-rubik-share-ttl'],!!c.headers['x-rubik-share-publication']]),
  [['webm',true,false],['delivery',false,true],['html',false,true]],'the first upload asks for the TTL; the next two join its publication');
 const names=[...store.keys()].filter(p=>p.startsWith('/rubik-share/')),ids=new Set(),dates=new Set();
 for(const p of names){const m=/--([0-9a-f]{24})--x(\d{12})/.exec(p);ids.add(m[1]);dates.add(m[2]);}
 assert.equal(names.length,3);assert.equal(ids.size,1,'one publication id');assert.deepEqual([...dates],[new Date(T0+90*DAY).toISOString().replace(/[-:T]/g,'').slice(0,12)],'one date: 90 days (UTC YYYYMMDDHHMM)');
 const entry=(await page.evaluate(()=>JSON.parse(localStorage.getItem('rubik-share-publications-v1'))))[0];
 assert.equal(entry.files.length,3);assert.equal(entry.ttlDays,90);assert.equal(entry.expiresAt,new Date(T0+90*DAY).toISOString());
 const link=await dialog.locator('#shareLinkUrl').inputValue(),client=await r.context.newPage();assert.equal((await client.goto(link)).status(),200);
 await r.advance(90*DAY);assert.equal((await client.goto(link)).status(),410,'the page closes at the date');
 const visit=`https://${HOST}${names.find(p=>p.endsWith('.delivery.json'))}`;const out=fakeRes();await Delivery.handler({method:'GET',url:'/api/delivery?f='+encodeURIComponent(visit)},out,r.opts());assert.equal(out.statusCode,410,'the 3D visit closes at the same date');
 const d2=await openDialog(page);await d2.locator('#shareStoreReview').click();await d2.locator('#shareStorePurge').click();await d2.locator('#shareStorePurgeConfirm').click();
 await page.waitForFunction(()=>/Caducados borrados: 3 archivo/.test(document.querySelector('#shareLinkStatus').textContent));assert.equal([...store.keys()].filter(p=>p.startsWith('/rubik-share/')).length,0,'page, visit and video purged together');
 // The client page plays its video straight from the (fake, aborted) Blob host — that is the direct access S5 is about.
 assert.deepEqual(r.external.filter(u=>!u.startsWith(`https://${HOST}/rubik-share/`)),[]);assert.deepEqual(r.errors,[]);
});

test('S3 on a phone 390×844: the expiry choice and the store fit, without horizontal overflow',{timeout:300000},async t=>{
 const r=await rig({width:390,height:844});t.after(()=>r.context.close());const {page}=r;
 await page.goto(url);await page.locator('#welcomeExample').tap();await page.waitForFunction(()=>window.FloorPlanShareLink);
 const dialog=await openDialog(page);await dialog.locator('#shareLinkTtl').scrollIntoViewIfNeeded();
 const fit=await page.evaluate(()=>{const d=document.getElementById('shareLinkDialog'),ttl=document.getElementById('shareLinkTtl').getBoundingClientRect(),store=document.getElementById('shareStoreReview').getBoundingClientRect();
  const radios=[...document.querySelectorAll('#shareLinkTtl label')].map(l=>l.getBoundingClientRect().height);
  return {overflow:document.documentElement.scrollWidth>innerWidth+1||d.scrollWidth>d.clientWidth+1,ttl:ttl.left>=0&&ttl.right<=innerWidth,store:store.right<=innerWidth,targets:radios.every(h=>h>=32)&&store.height>=32};});
 assert.deepEqual(fit,{overflow:false,ttl:true,store:true,targets:true});await shot(page,'07-phone-390');
 assert.deepEqual(r.errors,[]);
});
