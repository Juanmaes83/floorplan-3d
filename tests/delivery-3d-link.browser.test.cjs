// ENT-01: synthetic publish -> second browser reads the 3D snapshot -> withdraw both files.
// Real API handlers, in-memory Blob fixture; no remote publication or paid service.
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path');
const {createServer}=require('node:http'),{Readable}=require('node:stream'),{chromium}=require('playwright');
const Share=require('../api/share.js'),View=require('../api/view.js'),Delivery=require('../api/delivery.js'),Unshare=require('../api/unshare.js');
const root=path.resolve(__dirname,'..'),CODE='share-fixture-code-0123456789abcdef';
const env={BLOB_READ_WRITE_TOKEN:'vercel_blob_rw_Store42_secret',RUBIK_SHARE_TOKEN:CODE,RUBIK_RENDER_TOKEN:'different-render-code-0123456789'};
const HOST='store42.public.blob.vercel-storage.com';
const res=()=>({statusCode:0,headers:{},body:'',setHeader(k,v){this.headers[k.toLowerCase()]=v;},end(b){this.body=b;}});

test('a separate browser opens the published 3D visit and revocation removes both document and snapshot',{timeout:180000},async t=>{
 const server=createServer(async(req,r)=>{try{const p=new URL(req.url,'http://l').pathname,f=path.resolve(root,'.'+(p==='/'?'/index.html':p));if(!f.startsWith(root+path.sep))throw 0;
  r.setHeader('Content-Type',/\.m?js$/.test(f)?'text/javascript':f.endsWith('.css')?'text/css':f.endsWith('.json')?'application/json':'text/html');r.end(await fs.readFile(f));}
  catch{r.writeHead(404);r.end();}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));
 const url=`http://127.0.0.1:${server.address().port}/`;
 const browser=await chromium.launch({executablePath:process.env.CHROME||undefined,args:['--no-sandbox','--enable-unsafe-swiftshader']});t.after(()=>browser.close());
 const store=new Map(),calls=[];let n=0;
 const blobFetch=async(u,init={})=>{
  if(init.method==='PUT'){
   const raw=new URL(u).pathname,p=init.headers['x-add-random-suffix']==='0'?raw:raw.replace(/\.(\w+)$/,`-r${++n}.$1`);
   store.set(p,Buffer.from(init.body));return {ok:true,status:200,json:async()=>({url:`https://${HOST}${p}`})};
  }
  if(u==='https://blob.vercel-storage.com/delete'){for(const x of JSON.parse(init.body).urls)store.delete(new URL(x).pathname);return {ok:true,status:200,json:async()=>({})};}
  const hit=store.get(new URL(u).pathname);return hit?{ok:true,status:200,text:async()=>hit.toString('utf8')}:{ok:false,status:404};
 };
 const route=async context=>context.route('**/*',async r=>{
  const q=r.request(),u=q.url();
  if(u.startsWith(url+'api/')){
   const key=new URL(u).pathname.slice(1),handler=({'api/share':Share.handler,'api/view':View.handler,'api/delivery':Delivery.handler,'api/unshare':Unshare.handler})[key];
   if(!handler)return r.abort();calls.push({key,headers:await q.allHeaders()});
   let request;if(q.method()==='GET')request={method:'GET',url:u.slice(url.length-1),headers:await q.allHeaders()};
   else{request=Readable.from([q.postDataBuffer()||Buffer.alloc(0)]);request.method=q.method();request.url=u.slice(url.length-1);request.headers=await q.allHeaders();request.headers.host??=new URL(url).host;}
   const out=res();await handler(request,out,{env,fetchImpl:blobFetch});return r.fulfill({status:out.statusCode,headers:out.headers,body:out.body});
  }
  if(u.startsWith(url)||u.startsWith('blob:')||u.startsWith('data:'))return r.continue();return r.abort();
 });
 const professional=await browser.newContext({viewport:{width:1440,height:900}});t.after(()=>professional.close());await route(professional);
 const page=await professional.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);await page.locator('#welcomeExample').click();await page.locator('#workArea-deliver').click();
 await page.locator('#professionalWorkspace').getByRole('button',{name:'Publicar enlace para el cliente'}).click();
 const dialog=page.locator('#shareLinkDialog');await dialog.locator('#shareLink3d').check();await dialog.locator('#shareLinkAgree').check();
 await dialog.locator('#shareLinkToken').fill(CODE);await dialog.locator('#shareLinkGo').click();await dialog.locator('#shareLinkUrl').waitFor();
 const link=await dialog.locator('#shareLinkUrl').inputValue();assert.equal(store.size,2);
 assert.equal(calls.filter(c=>c.key==='api/share').length,2);assert.ok(calls.filter(c=>c.key==='api/share').every(c=>c.headers['x-rubik-share-token']===CODE&&!c.headers['x-rubik-render-token']));
 const saved=await page.evaluate(()=>localStorage.getItem('rubik-share-publications-v1'));assert.ok(!saved.includes(CODE));
 const client=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});t.after(()=>client.close());await route(client);
 const viewer=await client.newPage();assert.equal((await viewer.goto(link)).status(),200);
 const visit=await viewer.locator('#shareVisitLink').getAttribute('href');assert.ok(visit.includes('?entrega='));
 await viewer.goto(visit);await viewer.locator('#deliveryGate[data-state="ready"]').waitFor({timeout:30000});
 assert.equal(await viewer.locator('#deliveryWalk').count(),1);assert.equal(await viewer.evaluate(()=>!!window.RUBIK_DELIVERY&&!window.RUBIK_DELIVERY.preview),true);
 const entry=dialog.locator('.share-publication[data-state="active"]');await entry.getByRole('button',{name:'Retirar'}).click();
 await entry.getByRole('button',{name:'Sí, retirar enlace'}).click();await dialog.locator('.share-publication[data-state="withdrawn"]').waitFor();
 assert.equal(store.size,0);assert.equal((await viewer.goto(link)).status(),404);
 await viewer.goto(visit);await viewer.locator('#deliveryGate[data-state="error"]').waitFor({timeout:30000});
 assert.equal(await viewer.locator('#deliveryWalk').count(),0);assert.deepEqual(errors,[]);
});
