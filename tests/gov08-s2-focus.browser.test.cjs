// GOV-08 / ENT-02 S2 — keyboard focus in «Mis publicaciones» (audit 11/11/2026). Reproduced on fdf7fc4: after
// «Cancelar», a confirmed withdrawal or the history buttons, the dialog was redrawn and focus fell to <body> — outside
// the modal dialog — and the dialog scrolled back to the top, far from the entry acted on (390×844). Real api/share.js
// and api/unshare.js over an in-memory Blob simulator; fictitious codes; no network.
'use strict';
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{Readable}=require('node:stream'),{chromium}=require('playwright');
const Share=require('../api/share.js'),Unshare=require('../api/unshare.js');
const root=path.resolve(__dirname,'..'),SHARE='share-fixture-code-0123456789abcdef',RENDER='render-fixture-code-0123456789abcdef';
const env={BLOB_READ_WRITE_TOKEN:'vercel_blob_rw_Store42_secret',RUBIK_SHARE_TOKEN:SHARE,RUBIK_RENDER_TOKEN:RENDER},HOST='store42.public.blob.vercel-storage.com';
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.glb':'model/gltf-binary'};
let server,browser,url;
before(async()=>{server=createServer(async(req,res)=>{try{const p=new URL(req.url,'http://l').pathname,f=path.resolve(root,'.'+(p==='/'?'/index.html':p));if(!f.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(await fs.readFile(f));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||undefined,args:['--no-sandbox','--enable-unsafe-swiftshader']});});
after(async()=>{await browser?.close();await new Promise(r=>server.close(r));});
function fakeRes(){return {statusCode:0,headers:{},body:'',setHeader(k,v){this.headers[k.toLowerCase()]=v;},end(b){this.body=b;}};}

test('S2 focus: after cancel, withdrawal, a wrong code and the history buttons, focus stays in the dialog next to what was acted on',{timeout:300000},async t=>{
 const context=await browser.newContext({viewport:{width:390,height:844}});t.after(()=>context.close());
 const store=new Map(),failOn=new Set();let n=0;
 const blobFetch=async(u,init={})=>{if(init.method==='PUT'){const p=new URL(u).pathname.replace(/\.(\w+)$/,`-r${++n}.$1`);store.set(p,1);return {ok:true,status:200,json:async()=>({url:`https://${HOST}${p}`})};}
  if(u==='https://blob.vercel-storage.com/delete'){const {urls}=JSON.parse(init.body);if(urls.some(x=>failOn.has(new URL(x).pathname)))return {ok:false,status:500,json:async()=>({})};for(const x of urls)store.delete(new URL(x).pathname);return {ok:true,status:200,json:async()=>({})};}
  return {ok:false,status:404};};
 await context.route('**/*',async r=>{const q=r.request(),u=q.url();
  for(const [route,h] of [['api/share',Share.handler],['api/unshare',Unshare.handler]])if(u.startsWith(url+route)&&!u.startsWith(url+route+'x')){const s=Readable.from([q.postDataBuffer()||Buffer.alloc(0)]);s.method=q.method();s.headers=await q.allHeaders();s.headers.host??=new URL(url).host;const o=fakeRes();await h(s,o,{env,fetchImpl:blobFetch});return r.fulfill({status:o.statusCode,headers:o.headers,body:o.body});}
  if(u.startsWith(url)||u.startsWith('blob:')||u.startsWith('data:'))return r.continue();return r.abort();});
 const page=await context.newPage();page.setDefaultTimeout(30000);
 await page.goto(url);await page.locator('#welcomeExample').click();await page.waitForFunction(()=>window.FloorPlanShareLink);
 await page.locator('#workArea-deliver').click();await page.locator('#professionalWorkspace').getByRole('button',{name:'Publicar enlace para el cliente'}).click();
 const d=page.locator('#shareLinkDialog');
 for(let i=0;i<2;i++){await d.locator('#shareLinkAgree').check();await d.locator('#shareLinkToken').fill(SHARE);const done=page.waitForResponse(r=>r.url().startsWith(url+'api/share'));await d.locator('#shareLinkGo').click();await done;await d.locator('#shareLinkUrl').waitFor();}
 const where=()=>page.evaluate(()=>{const a=document.activeElement,dl=document.querySelector('#shareLinkDialog'),li=a.closest?.('.share-publication');const r=a.getBoundingClientRect();
  return {inDialog:dl.contains(a)&&a!==dl,id:a.id||null,action:a.dataset?.action||null,pub:li?.dataset.pub||null,visible:r.bottom>0&&r.top<innerHeight};});
 const second=await d.locator('.share-publication').nth(1).getAttribute('data-pub'),entry=()=>d.locator(`.share-publication[data-pub="${second}"]`);
 // Cancel → focus back on that entry's «Retirar», visible.
 await entry().getByRole('button',{name:'Retirar'}).focus();await page.keyboard.press('Enter');assert.equal((await where()).action,'confirm');
 await page.keyboard.press('Tab');await page.keyboard.press('Enter');
 let w=await where();assert.ok(w.inDialog,'focus left the dialog after Cancelar');assert.deepEqual([w.pub,w.action,w.visible],[second,'withdraw',true]);
 // Wrong code → focus on the code field (the message asks to type it again).
 await d.locator('#shareLinkToken').fill(RENDER);await entry().getByRole('button',{name:'Retirar'}).focus();await page.keyboard.press('Enter');
 let answered=page.waitForResponse(r=>r.url().startsWith(url+'api/unshare'));await page.keyboard.press('Enter');await answered;
 w=await where();assert.ok(w.inDialog,'focus left the dialog after a refused withdrawal');assert.equal(w.id,'shareLinkToken');
 // Partial → focus on the entry's «Retirar» (to retry), visible.
 await d.locator('#shareLinkToken').fill(SHARE);failOn.add(new URL(second).pathname);
 await entry().getByRole('button',{name:'Retirar'}).focus();await page.keyboard.press('Enter');answered=page.waitForResponse(r=>r.url().startsWith(url+'api/unshare'));await page.keyboard.press('Enter');await answered;
 await page.waitForFunction(id=>document.querySelector(`[data-pub="${id}"]`)?.dataset.state==='partial',second);
 w=await where();assert.ok(w.inDialog,'focus left the dialog after a partial withdrawal');assert.deepEqual([w.pub,w.action,w.visible],[second,'withdraw',true]);
 // Confirmed withdrawal → focus on the (now action-less) entry itself, visible.
 failOn.clear();await page.keyboard.press('Enter');answered=page.waitForResponse(r=>r.url().startsWith(url+'api/unshare'));await page.keyboard.press('Enter');await answered;
 await page.waitForFunction(id=>document.querySelector(`[data-pub="${id}"]`)?.dataset.state==='withdrawn',second);
 w=await where();assert.ok(w.inDialog,'focus left the dialog after the withdrawal');assert.deepEqual([w.pub,w.visible],[second,true]);
 // History: cancel → back on «Borrar historial»; confirm → on the section title.
 await d.locator('#sharePublicationsClear').focus();await page.keyboard.press('Enter');await page.keyboard.press('Tab');await page.keyboard.press('Enter');
 w=await where();assert.ok(w.inDialog,'focus left the dialog after cancelling the history');assert.equal(w.id,'sharePublicationsClear');
 await page.keyboard.press('Enter');await page.keyboard.press('Enter');
 w=await where();assert.ok(w.inDialog,'focus left the dialog after clearing the history');assert.equal(w.id,'sharePublicationsTitle');
});
