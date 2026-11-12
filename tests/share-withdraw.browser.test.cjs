// GOV-08 / ENT-02 S2: «Mis publicaciones» in the publishing dialog. The real api/share.js, api/view.js and
// api/unshare.js run over a fake in-memory Blob store (no network, nothing real is published or deleted). It checks:
// the register lists what this browser published (without any code), withdrawal asks for confirmation, a wrong code
// deletes nothing, a confirmed withdrawal deletes the files and /api/view stops serving them, other links keep working,
// a partial failure is shown and can be retried, and the project never changes.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{Readable}=require('node:stream'),{chromium}=require('playwright');
const Share=require('../api/share.js'),View=require('../api/view.js'),Unshare=require('../api/unshare.js');
const root=path.resolve(__dirname,'..');let server,browser,url;
const SHARE='share-fixture-code-0123456789abcdef',RENDER='render-fixture-code-0123456789abcdef';
const env={BLOB_READ_WRITE_TOKEN:'vercel_blob_rw_Store42_secret',RUBIK_SHARE_TOKEN:SHARE,RUBIK_RENDER_TOKEN:RENDER},HOST='store42.public.blob.vercel-storage.com';
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.glb':'model/gltf-binary'};
before(async()=>{server=createServer(async(req,res)=>{try{const p=new URL(req.url,'http://l').pathname,f=path.resolve(root,'.'+(p==='/'?'/index.html':p));if(!f.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(await fs.readFile(f));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||undefined,args:['--no-sandbox','--enable-unsafe-swiftshader']});});
after(async()=>{await browser?.close();await new Promise(r=>server.close(r));});
function fakeRes(){return {statusCode:0,headers:{},body:'',setHeader(k,v){this.headers[k.toLowerCase()]=v;},end(b){this.body=b;}};}

test('S2: «Mis publicaciones» withdraws a published link after confirmation, and only with the publishing code',{timeout:600000},async t=>{
 const context=await browser.newContext({viewport:{width:1440,height:900}});t.after(()=>context.close());
 const store=new Map(),failOn=new Set(),apiCalls=[],external=[],errors=[];let n=0;
 const blobFetch=async(u,init={})=>{
  if(init.method==='PUT'){const p=new URL(u).pathname.replace(/\.(\w+)$/,`-r${++n}.$1`);store.set(p,Buffer.from(init.body));return {ok:true,status:200,json:async()=>({url:`https://${HOST}${p}`})};}
  if(u==='https://blob.vercel-storage.com/delete'){const {urls}=JSON.parse(init.body);if(urls.some(x=>failOn.has(new URL(x).pathname)))return {ok:false,status:500,json:async()=>({})};for(const x of urls)store.delete(new URL(x).pathname);return {ok:true,status:200,json:async()=>({})};}
  const hit=store.get(new URL(u).pathname);return hit?{ok:true,status:200,text:async()=>hit.toString()}:{ok:false,status:404};};
 // The real functions behind the routes. The browser adds Host on the wire; Playwright does not expose it.
 const call=async(handler,req)=>{const body=req.postDataBuffer()||Buffer.alloc(0),stream=Readable.from([body]);stream.method=req.method();stream.headers=await req.allHeaders();stream.headers.host??=new URL(url).host;
  const out=fakeRes();await handler(stream,out,{env,fetchImpl:blobFetch});return out;};
 await context.route('**/*',async r=>{const req=r.request(),u=req.url();
  for(const [route,handler] of [['api/share',Share.handler],['api/unshare',Unshare.handler]])if(u.startsWith(url+route)&&!u.startsWith(url+route+'x')){
   apiCalls.push({route,headers:await req.allHeaders()});const out=await call(handler,req);return r.fulfill({status:out.statusCode,headers:out.headers,body:out.body});}
  if(u.startsWith(url+'api/view')){const out=fakeRes();await View.handler({method:'GET',url:u.slice(url.length-1)},out,{env,fetchImpl:blobFetch});return r.fulfill({status:out.statusCode,headers:out.headers,body:out.body});}
  if(u.startsWith(url)||u.startsWith('blob:')||u.startsWith('data:'))return r.continue();external.push(u);return r.abort();});
 const page=await context.newPage();page.setDefaultTimeout(30000);page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);await page.locator('#welcomeExample').click();await page.waitForFunction(()=>window.FloorPlanShareLink&&window.FloorPlanShareRegistry);
 const project=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));
 const workspace=page.locator('#professionalWorkspace'),dialog=page.locator('#shareLinkDialog'),pubs=dialog.locator('#sharePublications');
 await page.locator('#workArea-deliver').click();await workspace.getByRole('button',{name:'Publicar enlace para el cliente'}).click();await dialog.waitFor();
 assert.match(await pubs.innerText(),/Mis publicaciones \(este navegador\)[\s\S]*no es un registro completo[\s\S]*panel de Vercel Blob[\s\S]*copias en caché[\s\S]*Todavía no hay publicaciones/);
 // S2: the dialog explains where links are withdrawn, without promising an exact disappearance time.
 const note=await dialog.locator('#shareLinkNote').innerText();
 assert.match(note,/publicados desde este navegador se pueden retirar en «Mis publicaciones»[\s\S]*otro equipo o navegador se retiran desde el panel de Vercel Blob[\s\S]*copias en caché[\s\S]*descargado siguen en su poder/);
 assert.doesNotMatch(await dialog.innerText(),/\b60 s|un minuto|definitivamente/,'no exact-time promise');
 // Publish two links with the publishing code.
 const publishOnce=async()=>{await dialog.locator('#shareLinkAgree').check();if(!(await dialog.locator('#shareLinkToken').inputValue()))await dialog.locator('#shareLinkToken').fill(SHARE);
  const done=page.waitForResponse(r=>r.url().startsWith(url+'api/share'));await dialog.locator('#shareLinkGo').click();await done;await dialog.locator('#shareLinkUrl').waitFor();return dialog.locator('#shareLinkUrl').inputValue();};
 const linkA=await publishOnce(),linkB=await publishOnce();assert.notEqual(linkA,linkB);
 const items=pubs.locator('.share-publication');assert.equal(await items.count(),2);
 assert.match(await items.first().innerText(),/Publicado[\s\S]*Documento para el cliente[\s\S]*Abrir[\s\S]*Retirar/);
 // The register holds no code and no project data.
 const saved=await page.evaluate(()=>localStorage.getItem('rubik-share-publications-v1'));
 for(const leak of [SHARE,RENDER,'vercel_blob_rw','"walls"'])assert.ok(!saved.includes(leak),leak);
 const pageOf=link=>decodeURIComponent(new URL(link).searchParams.get('f'));
 const client=await context.newPage();assert.equal((await client.goto(linkB)).status(),200);
 // Withdraw the newest (B): Retirar asks first; Cancelar deletes nothing.
 const itemB=pubs.locator(`.share-publication[data-pub="${pageOf(linkB)}"]`);
 await itemB.getByRole('button',{name:'Retirar'}).click();assert.match(await itemB.innerText(),/dejará de poder abrir este enlace[\s\S]*No se puede deshacer/);
 await itemB.getByRole('button',{name:'Cancelar'}).click();assert.equal(apiCalls.filter(c=>c.route==='api/unshare').length,0);
 // A wrong code (here the AI render one) is refused and nothing is deleted.
 await dialog.locator('#shareLinkToken').fill(RENDER);await itemB.getByRole('button',{name:'Retirar'}).click();
 let answered=page.waitForResponse(r=>r.url().startsWith(url+'api/unshare'));await itemB.getByRole('button',{name:'Sí, retirar enlace'}).click();
 assert.equal((await answered).status(),401);await page.waitForFunction(()=>/código de publicación no es correcto/.test(document.querySelector('#shareLinkStatus').textContent));
 assert.equal(store.size,2,'nothing deleted with a wrong code');assert.equal(await pubs.locator(`.share-publication[data-pub="${pageOf(linkB)}"]`).getAttribute('data-state'),'active');
 // Confirmed withdrawal with the publishing code.
 await dialog.locator('#shareLinkToken').fill(SHARE);const itemB2=pubs.locator(`.share-publication[data-pub="${pageOf(linkB)}"]`);
 await itemB2.getByRole('button',{name:'Retirar'}).click();answered=page.waitForResponse(r=>r.url().startsWith(url+'api/unshare'));await itemB2.getByRole('button',{name:'Sí, retirar enlace'}).click();
 assert.equal((await answered).status(),200);await page.waitForFunction(()=>/Enlace retirado: los archivos se han borrado del almacén[\s\S]*copias en caché[\s\S]*conserva su copia/.test(document.querySelector('#shareLinkStatus').textContent));
 const last=apiCalls.at(-1);assert.equal(last.headers['x-rubik-share-token'],SHARE);assert.equal(last.headers['x-rubik-render-token'],undefined);
 assert.equal(await pubs.locator(`.share-publication[data-pub="${pageOf(linkB)}"]`).getAttribute('data-state'),'withdrawn');
 assert.match(await pubs.locator(`.share-publication[data-pub="${pageOf(linkB)}"]`).innerText(),/Retirado el/);
 assert.equal(await pubs.locator(`.share-publication[data-pub="${pageOf(linkB)}"] button`).count(),0,'no actions on a withdrawn link');
 assert.equal((await client.goto(linkB)).status(),404,'the withdrawn link no longer opens');
 assert.equal((await client.goto(linkA)).status(),200,'the other link keeps working');
 // Partial failure: the storage refuses the deletion → shown, nothing marked withdrawn, retry works.
 failOn.add(new URL(pageOf(linkA)).pathname);const itemA=pubs.locator(`.share-publication[data-pub="${pageOf(linkA)}"]`);
 await itemA.getByRole('button',{name:'Retirar'}).click();answered=page.waitForResponse(r=>r.url().startsWith(url+'api/unshare'));await itemA.getByRole('button',{name:'Sí, retirar enlace'}).click();
 assert.equal((await answered).status(),502);await page.waitForFunction(()=>/Retirada incompleta: 0 archivo\(s\) borrado\(s\) y 1 sin borrar/.test(document.querySelector('#shareLinkStatus').textContent));
 assert.equal(await pubs.locator(`.share-publication[data-pub="${pageOf(linkA)}"]`).getAttribute('data-state'),'partial');
 failOn.clear();await pubs.locator(`.share-publication[data-pub="${pageOf(linkA)}"]`).getByRole('button',{name:'Retirar'}).click();
 answered=page.waitForResponse(r=>r.url().startsWith(url+'api/unshare'));await pubs.locator(`.share-publication[data-pub="${pageOf(linkA)}"]`).getByRole('button',{name:'Sí, retirar enlace'}).click();
 assert.equal((await answered).status(),200);await page.waitForFunction(a=>document.querySelector(`[data-pub="${a}"]`)?.dataset.state==='withdrawn',pageOf(linkA));
 assert.equal(store.size,0);assert.equal((await client.goto(linkA)).status(),404);await client.close();
 // The register survives a reload (same browser) and still holds no code; the project never changed.
 await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),project,'withdrawing never changes the project');
 assert.equal(await page.evaluate(()=>FloorPlanShareRegistry.load(localStorage).filter(e=>e.state==='withdrawn').length),2);
 assert.equal(await page.evaluate(s=>Object.keys(localStorage).some(k=>localStorage.getItem(k).includes(s)),SHARE),false,'no code stored');
 assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
});

// S2: «Borrar historial» forgets the local list only, after confirmation; and a tour video uploaded for a publication
// whose page then fails is cleaned up (its exact URL only) or kept as a recoverable entry when cleanup fails.
test('S2: clear history (no deletion) and no orphan videos when the page upload fails',{timeout:600000},async t=>{
 const context=await browser.newContext({viewport:{width:1440,height:900}});t.after(()=>context.close());
 const store=new Map(),unshareBodies=[],errors=[];let n=0,failHtml=false,failDelete=false;
 const blobFetch=async(u,init={})=>{
  if(init.method==='PUT'){if(failHtml&&/\.html$/.test(new URL(u).pathname))return {ok:false,status:500,json:async()=>({})};const p=new URL(u).pathname.replace(/\.(\w+)$/,`-r${++n}.$1`);store.set(p,Buffer.from(init.body));return {ok:true,status:200,json:async()=>({url:`https://${HOST}${p}`})};}
  if(u==='https://blob.vercel-storage.com/delete'){if(failDelete)return {ok:false,status:500,json:async()=>({})};for(const x of JSON.parse(init.body).urls)store.delete(new URL(x).pathname);return {ok:true,status:200,json:async()=>({})};}
  const hit=store.get(new URL(u).pathname);return hit?{ok:true,status:200,text:async()=>hit.toString()}:{ok:false,status:404};};
 const call=async(handler,req)=>{const body=req.postDataBuffer()||Buffer.alloc(0),stream=Readable.from([body]);stream.method=req.method();stream.headers=await req.allHeaders();stream.headers.host??=new URL(url).host;const out=fakeRes();await handler(stream,out,{env,fetchImpl:blobFetch});return out;};
 await context.route('**/*',async r=>{const req=r.request(),u=req.url();
  if(u.startsWith(url+'api/unshare')){unshareBodies.push(JSON.parse(req.postData()||'{}'));const out=await call(Unshare.handler,req);return r.fulfill({status:out.statusCode,headers:out.headers,body:out.body});}
  if(u.startsWith(url+'api/share')){const out=await call(Share.handler,req);return r.fulfill({status:out.statusCode,headers:out.headers,body:out.body});}
  if(u.startsWith(url)||u.startsWith('blob:')||u.startsWith('data:'))return r.continue();return r.abort();});
 const page=await context.newPage();page.setDefaultTimeout(30000);page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);await page.locator('#welcomeExample').click();await page.waitForFunction(()=>window.FloorPlanShareLink&&window.FloorPlanTourVideo);
 // A small recorded tour video (fixture bytes), so publishing uploads video + page.
 await page.evaluate(()=>{const blob=new Blob([new Uint8Array([0x1a,0x45,0xdf,0xa3,1,2,3,4])],{type:'video/webm'});Object.defineProperty(window.FloorPlanTourVideo,'result',{get:()=>({blob,extension:'webm'}),configurable:true});});
 const dialog=page.locator('#shareLinkDialog'),pubs=dialog.locator('#sharePublications');
 await page.locator('#workArea-deliver').click();await page.locator('#professionalWorkspace').getByRole('button',{name:'Publicar enlace para el cliente'}).click();await dialog.waitFor();
 const publish=async()=>{await dialog.locator('#shareLinkAgree').check();if(!(await dialog.locator('#shareLinkToken').inputValue()))await dialog.locator('#shareLinkToken').fill(SHARE);await dialog.locator('#shareLinkGo').click();};
 // 1) Page upload fails after the video → the video (and only it) is deleted, nothing stays published, nothing registered.
 failHtml=true;await publish();
 await page.waitForFunction(()=>/El vídeo que ya se había subido se ha borrado: no ha quedado nada publicado/.test(document.querySelector('#shareLinkStatus').textContent));
 assert.equal(store.size,0,'no orphan video');assert.equal(unshareBodies.length,1);assert.equal(unshareBodies[0].urls.length,1);assert.match(unshareBodies[0].urls[0],/\.webm$/,'only the uploaded video is named');
 assert.equal(await pubs.locator('.share-publication').count(),0);
 // 2) Page upload fails and the cleanup fails too → the video is kept as a recoverable «Vídeo sin documento».
 failDelete=true;await publish();
 await page.waitForFunction(()=>/no se pudo borrar: aparece en «Mis publicaciones» como «Vídeo sin documento»/.test(document.querySelector('#shareLinkStatus').textContent));
 assert.equal(store.size,1);const orphan=pubs.locator('.share-publication');assert.equal(await orphan.count(),1);
 assert.equal(await orphan.getAttribute('data-state'),'partial');assert.match(await orphan.innerText(),/Vídeo sin documento \(la publicación falló\)/);assert.equal(await orphan.getByRole('link',{name:'Abrir'}).count(),0);
 // …and later withdrawn from the list (only that URL).
 failDelete=false;failHtml=false;await orphan.getByRole('button',{name:'Retirar'}).click();await orphan.getByRole('button',{name:'Sí, retirar enlace'}).click();
 await page.waitForFunction(()=>document.querySelector('#sharePublications .share-publication')?.dataset.state==='withdrawn');assert.equal(store.size,0);assert.equal(unshareBodies.at(-1).urls.length,1);
 // 3) A normal publication, then «Borrar historial»: cancel keeps it; confirm forgets the list but deletes nothing.
 await publish();await dialog.locator('#shareLinkUrl').waitFor();const files=store.size;assert.equal(files,2,'video + page');
 const calls=unshareBodies.length;
 await dialog.locator('#sharePublicationsClear').click();
 assert.match(await dialog.locator('#sharePublicationsClearWarning').innerText(),/no se retira ningún enlace ni se borra ningún archivo[\s\S]*ya no podrás retirarlos desde aquí[\s\S]*panel de Vercel Blob/);
 await dialog.locator('#sharePublicationsClearCancel').click();assert.equal(await pubs.locator('.share-publication').count(),2);
 await dialog.locator('#sharePublicationsClear').click();await dialog.locator('#sharePublicationsClearConfirm').click();
 await page.waitForFunction(()=>/Historial borrado en este navegador\. Los enlaces siguen publicados/.test(document.querySelector('#shareLinkStatus').textContent));
 assert.equal(await pubs.locator('.share-publication').count(),0);assert.match(await pubs.innerText(),/Todavía no hay publicaciones/);
 assert.equal(store.size,files,'clearing the history deletes no file');assert.equal(unshareBodies.length,calls,'and calls no withdrawal');
 assert.equal(await page.evaluate(()=>localStorage.getItem('rubik-share-publications-v1')),null);
 assert.equal(await page.evaluate(s=>Object.keys(localStorage).some(k=>String(localStorage.getItem(k)).includes(s)),SHARE),false,'no code in localStorage');
 // Keyboard: the clear button is reachable and labelled.
 assert.equal(await dialog.locator('#sharePublicationsClear').count(),0,'no history → no clear button');
 // 4) Cleanup fails AND this browser cannot store the register: the message itself carries the exact video URL.
 failHtml=true;failDelete=true;const before=store.size;
 await page.evaluate(()=>{Storage.prototype.setItem=function(){throw Error('blocked');};});
 await publish();
 await page.waitForFunction(()=>/no se pudo borrar ni guardar en este navegador\. Bórralo desde el panel de Vercel Blob: https:\/\/\S+\.webm/.test(document.querySelector('#shareLinkStatus').textContent));
 assert.equal(store.size,before+1,'only that video remains, and its URL was shown');
 assert.deepEqual(errors,[]);
});
