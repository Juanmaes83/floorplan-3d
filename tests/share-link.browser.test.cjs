// Phase B4: «Publicar enlace para el cliente». The dialog says who can see what and asks for consent and the access
// code; it uploads only the finished client file (and the tour video when chosen) to /api/share, and the link opens
// through /api/view with a strict CSP. Both functions run here for real (api/share.js, api/view.js) over a fake Blob
// store in memory: no network. The opened page plays the video from the store and keeps the observations form.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{Readable}=require('node:stream'),{chromium}=require('playwright');
const Share=require('../api/share.js'),View=require('../api/view.js');
const root=path.resolve(__dirname,'..'),SHOTS=process.env.QA_SHOTS||'';let server,browser,url;
const env={BLOB_READ_WRITE_TOKEN:'vercel_blob_rw_Store42_secret',RUBIK_RENDER_TOKEN:'access-123'},HOST='store42.public.blob.vercel-storage.com';
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.glb':'model/gltf-binary'};
before(async()=>{server=createServer(async(req,res)=>{try{const p=new URL(req.url,'http://l').pathname,f=path.resolve(root,'.'+(p==='/'?'/index.html':p));if(!f.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(await fs.readFile(f));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});});
after(async()=>{await browser?.close();await new Promise(r=>server.close(r));});
const shot=async(page,name)=>{if(!SHOTS)return;await fs.mkdir(SHOTS,{recursive:true});await page.screenshot({path:path.join(SHOTS,name+'.png')});};
function fakeRes(){return {statusCode:0,headers:{},body:'',setHeader(k,v){this.headers[k.toLowerCase()]=v;},end(b){this.body=b;}};}

test('Phase B4: publish the client file as a link, with and without the tour video',{timeout:600000},async t=>{
 const context=await browser.newContext({viewport:{width:1440,height:900},acceptDownloads:true});t.after(()=>context.close());
 const store=new Map(),uploads=[],external=[],errors=[];let n=0,shareStatus=null;
 // The fake Blob store behind the real functions.
 const blobFetch=async(u,init)=>{if(init?.method==='PUT'){const p=new URL(u).pathname.replace(/\.(\w+)$/,`-r${++n}.$1`);store.set(p,{type:init.headers['x-content-type'],bytes:Buffer.from(init.body)});return {ok:true,status:200,json:async()=>({url:`https://${HOST}${p}`})};}
  const hit=store.get(new URL(u).pathname);return hit?{ok:true,status:200,text:async()=>hit.bytes.toString()}:{ok:false,status:404};};
 await context.route('**/*',async r=>{const req=r.request(),u=req.url();
  if(u.startsWith(url+'api/share')){const body=req.postDataBuffer()||Buffer.alloc(0),stream=Readable.from([body]);stream.method=req.method();stream.headers=await req.allHeaders();uploads.push({kind:stream.headers['x-rubik-share-kind'],token:stream.headers['x-rubik-render-token'],bytes:body.length,head:body.subarray(0,15).toString()});
   if(shareStatus)return r.fulfill({status:shareStatus.status,contentType:'application/json',body:JSON.stringify(shareStatus.body)});
   const out=fakeRes();await Share.handler(stream,out,{env,fetchImpl:blobFetch});return r.fulfill({status:out.statusCode,headers:out.headers,body:out.body});}
  if(u.startsWith(url+'api/view')){const out=fakeRes();await View.handler({method:'GET',url:u.slice(url.length-1)},out,{env,fetchImpl:blobFetch});return r.fulfill({status:out.statusCode,headers:out.headers,body:out.body});}
  if(u.startsWith(`https://${HOST}/`)){const hit=store.get(new URL(u).pathname);return hit?r.fulfill({status:200,contentType:hit.type,body:hit.bytes}):r.fulfill({status:404,body:''});}
  if(u.startsWith(url)||u.startsWith('blob:')||u.startsWith('data:'))return r.continue();external.push(u);return r.abort();});
 const page=await context.newPage();page.setDefaultTimeout(30000);page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);await page.locator('#welcomeExample').click();await page.waitForFunction(()=>window.FloorPlanShareLink&&window.FloorPlanClientShare);
 const before=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));
 const workspace=page.locator('#professionalWorkspace'),dialog=page.locator('#shareLinkDialog');
 await page.locator('#workArea-deliver').click();await workspace.getByRole('button',{name:'Publicar enlace para el cliente'}).click();await dialog.waitFor();
 assert.match(await dialog.locator('#shareLinkNote').innerText(),/Cualquiera que tenga el enlace podrá verlo[\s\S]*Vercel Blob[\s\S]*El proyecto editable no se envía/);
 assert.equal(await dialog.locator('#shareLinkVideo').isDisabled(),true);assert.match(await dialog.innerText(),/Sin vídeo: grábalo en la presentación/);
 // Consent and access code before anything leaves the browser.
 await dialog.locator('#shareLinkGo').click();assert.match(await dialog.locator('#shareLinkStatus').innerText(),/Confirma que entiendes quién podrá verlo/);
 await dialog.locator('#shareLinkAgree').check();await dialog.locator('#shareLinkGo').click();assert.match(await dialog.locator('#shareLinkStatus').innerText(),/Introduce el código de acceso/);assert.equal(uploads.length,0);
 // A wrong code is said plainly and forgotten.
 await dialog.locator('#shareLinkToken').fill('wrong');await dialog.locator('#shareLinkGo').click();
 await page.waitForFunction(()=>/El código de acceso no es correcto/.test(document.querySelector('#shareLinkStatus').textContent));assert.equal(await page.evaluate(()=>localStorage.getItem('rubik-render-token')),null);assert.equal(store.size,0);
 shareStatus={status:503,body:{error:'not-configured'}};await dialog.locator('#shareLinkAgree').check();await dialog.locator('#shareLinkToken').fill('access-123');await dialog.locator('#shareLinkGo').click();
 await page.waitForFunction(()=>/no están configurados en este servidor[\s\S]*BLOB_READ_WRITE_TOKEN/.test(document.querySelector('#shareLinkStatus').textContent));shareStatus=null;
 uploads.length=0;await dialog.locator('#shareLinkAgree').check();await dialog.locator('#shareLinkGo').click();await dialog.locator('#shareLinkUrl').waitFor({timeout:120000});
 assert.deepEqual(uploads.map(u=>[u.kind,u.token]),[['html','access-123']],'only the finished client file travels');assert.equal(uploads[0].head,'<!doctype html>');
 const link=await dialog.locator('#shareLinkUrl').inputValue();assert.match(link,new RegExp('^'+url.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'api/view\\?f=https%3A%2F%2F'+HOST.replace(/\./g,'\\.')+'%2Frubik-share%2F'));
 assert.match(await dialog.locator('#shareLinkMeta').innerText(),/^Versión \S+\. Si cambias el proyecto, publica un enlace nuevo/);
 await shot(page,'b4-1440-published');
 // The link opens the read-only document as a page, with its observations form and no network.
 const client=await context.newPage(),clientErrors=[];client.on('pageerror',e=>clientErrors.push(e.message));const resp=await client.goto(link);
 assert.equal(resp.status(),200);assert.match(resp.headers()['content-security-policy'],/default-src 'none'/);assert.equal(resp.headers()['x-robots-tag'],'noindex, nofollow');
 await client.locator('#shareReview').waitFor();assert.equal(await client.locator('#shareTour').count(),0);
 assert.doesNotMatch(await client.locator('body').innerText(),/Prepáralas en Entregar/,'no professional instructions in the client page');assert.match(await client.locator('.share-top').innerText(),/No necesita conexión ni instalar nada/);await client.close();assert.deepEqual(clientErrors,[]);
 await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#shareLinkDialog').open);
 assert.equal(await page.evaluate(()=>document.activeElement?.dataset.route),'client-link','focus returns to the action');

 // With a recorded tour video: the video goes first, the page links to it and plays it from the store.
 await workspace.getByRole('button',{name:'Preparar presentación'}).click();
 const rows=page.locator('#presentationConfig .presentation-room-row input');const count=await rows.count();for(let i=2;i<count;i++)await rows.nth(i).uncheck();
 await page.locator('#presentationConfig').getByRole('button',{name:'Iniciar presentación',exact:true}).click();
 await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false',null,{timeout:180000});
 await page.locator('#presentationVideo').click({timeout:60000});await page.locator('#tourVideoGo').click();await page.locator('#tourVideoDownload').waitFor({timeout:300000});
 const ext=await page.evaluate(()=>FloorPlanTourVideo.result.extension);await page.keyboard.press('Escape');
 await page.locator('#presentationClose').click({timeout:30000});await page.waitForFunction(()=>!FloorPlanPresentation.active);
 if(!(await workspace.isVisible()))await page.locator('#workArea-deliver').click();
 await workspace.getByRole('button',{name:'Publicar enlace para el cliente'}).click();await dialog.waitFor();
 assert.equal(await dialog.locator('#shareLinkVideo').isChecked(),true);assert.match(await dialog.innerText(),new RegExp(`Incluir el vídeo del recorrido \\(${ext.toUpperCase()}`));
 assert.equal(await dialog.locator('#shareLinkToken').inputValue(),'access-123','the access code is remembered in this browser');
 uploads.length=0;await dialog.locator('#shareLinkAgree').check();await dialog.locator('#shareLinkGo').click();
 await page.waitForFunction(()=>/con vídeo/.test(document.querySelector('#shareLinkMeta')?.textContent||''),null,{timeout:120000});
 assert.deepEqual(uploads.map(u=>u.kind),[ext,'html']);
 const link2=await dialog.locator('#shareLinkUrl').inputValue();assert.notEqual(link2,link);
 const html=[...store.entries()].filter(([p])=>p.endsWith('.html')).pop()[1].bytes.toString();
 assert.match(html,new RegExp(`media-src https://${HOST.replace(/\./g,'\\.')}`));assert.match(html,new RegExp(`<video[^>]+src="https://${HOST.replace(/\./g,'\\.')}/rubik-share/`));
 const client2=await context.newPage();await client2.goto(link2);await client2.locator('#shareTour video').waitFor();assert.match(await client2.locator('.share-top').innerText(),/el vídeo necesita conexión/);
 const played=await client2.evaluate(async()=>{const v=document.querySelector('#shareTour video');if(v.readyState<1)await new Promise((ok,ko)=>{v.onloadedmetadata=ok;v.onerror=()=>ko(Error('video blocked'));});return [v.videoWidth,v.videoHeight];});
 assert.deepEqual(played,[1280,720],'the published page plays the tour video under its CSP');
 await shot(client2,'b4-1440-client-page');await client2.close();
 assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),before,'publishing never changes the project');
 assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
});
