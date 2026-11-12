#!/usr/bin/env node
/* GOV-08 S1+S2 · visual and functional QA of «Enlace para el cliente» / «Mis publicaciones» (11/11/2026).
 * Runs the REAL api/share.js, api/unshare.js and api/view.js over an in-memory Blob simulator inside Playwright
 * routes: fictitious codes, no network, nothing real is published or deleted. For 1440×900, 1280×800, 390×844 and
 * 844×390 it checks and screenshots: the publishing-code field (distinct from the AI render code), API not configured,
 * wrong code, two publications, «Mis publicaciones», confirm / cancel, a keyboard-driven withdrawal, a partial
 * withdrawal and its retry, an unreachable store, and Escape. It fails on page errors, external requests, horizontal
 * document scroll, a dialog wider than the viewport, a focused control without a visible outline, a stored code,
 * or a project change.
 *   CHROME=<chromium> node scripts/qa/gov08-share-visual-qa.cjs [--shots DIR] */
'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{Readable}=require('node:stream'),{chromium}=require('playwright');
const Share=require('../../api/share.js'),View=require('../../api/view.js'),Unshare=require('../../api/unshare.js');
const root=path.resolve(__dirname,'..','..'),shotsAt=process.argv.indexOf('--shots'),SHOTS=shotsAt>0?path.resolve(process.argv[shotsAt+1]):null;
const SHARE='share-fixture-code-0123456789abcdef',RENDER='render-fixture-code-0123456789abcdef';
const FULL={BLOB_READ_WRITE_TOKEN:'vercel_blob_rw_Store42_secret',RUBIK_SHARE_TOKEN:SHARE,RUBIK_RENDER_TOKEN:RENDER},HOST='store42.public.blob.vercel-storage.com';
const VIEWPORTS=[[1440,900],[1280,800],[390,844],[844,390]];
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.glb':'model/gltf-binary'};
const results=[],fail=m=>results.push('FAIL '+m),pass=m=>results.push('ok   '+m);
function fakeRes(){return {statusCode:0,headers:{},body:'',setHeader(k,v){this.headers[k.toLowerCase()]=v;},end(b){this.body=b;}};}

(async()=>{
 const server=createServer(async(req,res)=>{try{const p=new URL(req.url,'http://l').pathname,f=path.resolve(root,'.'+(p==='/'?'/index.html':p));if(!f.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(await fs.readFile(f));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}/`;
 const browser=await chromium.launch({executablePath:process.env.CHROME||undefined,args:['--no-sandbox','--enable-unsafe-swiftshader']});
 if(SHOTS)await fs.mkdir(SHOTS,{recursive:true});
 try{
  for(const [w,h] of VIEWPORTS){
   const tag=`${w}x${h}`,context=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:SHOTS&&w===1440?2:1});
   const store=new Map(),failOn=new Set(),external=[],errors=[];let n=0,env={...FULL},throwDelete=0;
   const blobFetch=async(u,init={})=>{
    if(init.method==='PUT'){const p=new URL(u).pathname.replace(/\.(\w+)$/,`-r${++n}.$1`);store.set(p,Buffer.from(init.body));return {ok:true,status:200,json:async()=>({url:`https://${HOST}${p}`})};}
    if(u==='https://blob.vercel-storage.com/delete'){if(throwDelete){throwDelete--;throw new Error('network');}const {urls}=JSON.parse(init.body);if(urls.some(x=>failOn.has(new URL(x).pathname)))return {ok:false,status:500,json:async()=>({})};for(const x of urls)store.delete(new URL(x).pathname);return {ok:true,status:200,json:async()=>({})};}
    const hit=store.get(new URL(u).pathname);return hit?{ok:true,status:200,text:async()=>hit.toString()}:{ok:false,status:404};};
   const call=async(handler,req)=>{const body=req.postDataBuffer()||Buffer.alloc(0),stream=Readable.from([body]);stream.method=req.method();stream.headers=await req.allHeaders();stream.headers.host??=new URL(url).host;const out=fakeRes();await handler(stream,out,{env,fetchImpl:blobFetch});return out;};
   await context.route('**/*',async r=>{const req=r.request(),u=req.url();
    for(const [route,handler] of [['api/share',Share.handler],['api/unshare',Unshare.handler]])if(u.startsWith(url+route)&&!u.startsWith(url+route+'x')){const out=await call(handler,req);return r.fulfill({status:out.statusCode,headers:out.headers,body:out.body});}
    if(u.startsWith(url+'api/view')){const out=fakeRes();await View.handler({method:'GET',url:u.slice(url.length-1)},out,{env,fetchImpl:blobFetch});return r.fulfill({status:out.statusCode,headers:out.headers,body:out.body});}
    if(u.startsWith(url)||u.startsWith('blob:')||u.startsWith('data:'))return r.continue();external.push(u);return r.abort();});
   const page=await context.newPage();page.setDefaultTimeout(30000);page.on('pageerror',e=>errors.push(e.message));
   await page.goto(url);await page.locator('#welcomeExample').click();await page.waitForFunction(()=>window.FloorPlanShareLink&&window.FloorPlanShareRegistry);
   const project=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));
   const dialog=page.locator('#shareLinkDialog'),pubs=dialog.locator('#sharePublications'),status=()=>dialog.locator('#shareLinkStatus').innerText();
   const shot=async name=>{if(SHOTS)await dialog.screenshot({path:path.join(SHOTS,`gov08-${name}-${tag}.png`)});};
   const layout=async label=>{const m=await page.evaluate(()=>{const d=document.querySelector('#shareLinkDialog').getBoundingClientRect();return {scroll:document.scrollingElement.scrollWidth-innerWidth,left:d.left,right:d.right,vw:innerWidth};});
    if(m.scroll>0)fail(`${tag} ${label}: horizontal document scroll ${m.scroll}px`);if(m.left<0||m.right>m.vw+0.5)fail(`${tag} ${label}: dialog outside the viewport (${m.left.toFixed(0)}–${m.right.toFixed(0)} of ${m.vw})`);};
   const focusVisible=async label=>{const f=await page.evaluate(()=>{const a=document.activeElement,cs=getComputedStyle(a);return {tag:a.tagName,text:(a.textContent||a.id||'').trim().slice(0,30),outline:cs.outlineStyle,width:parseFloat(cs.outlineWidth)||0,shadow:cs.boxShadow};});
    if((f.outline==='none'||f.width===0)&&(!f.shadow||f.shadow==='none'))fail(`${tag} ${label}: focused ${f.tag} «${f.text}» has no visible focus indicator`);return f;};
   const publish=async()=>{await dialog.locator('#shareLinkAgree').check();const done=page.waitForResponse(r=>r.url().startsWith(url+'api/share'));await dialog.locator('#shareLinkGo').click();return (await done).status();};
   const pageOf=link=>decodeURIComponent(new URL(link).searchParams.get('f'));
   // 1 · open «Entregar» → dialog: publishing-code field, hint distinct from the AI render code
   await page.locator('#workArea-deliver').click();await page.locator('#professionalWorkspace').getByRole('button',{name:'Publicar enlace para el cliente'}).click();await dialog.waitFor();
   const field=await dialog.locator('#shareLinkToken').evaluate(i=>({type:i.type,auto:i.autocomplete,label:i.closest('label').innerText}));
   if(field.type!=='password'||!/Código de publicación de enlaces[\s\S]*distinto del código del Render IA[\s\S]*mientras esta página esté abierta/.test(field.label))fail(`${tag}: publishing-code field ${JSON.stringify(field)}`);
   if(/definitivamente|en 60 s|un minuto|para siempre|privad[oa] para siempre/i.test(await dialog.innerText()))fail(`${tag}: absolute privacy / timing promise in the dialog`);
   await layout('initial');await shot('1-dialog');
   await dialog.locator('#shareLinkAgree').focus();await page.keyboard.press('Tab');await focusVisible('initial Tab');
   // 2 · API not configured
   env={RUBIK_SHARE_TOKEN:SHARE};await dialog.locator('#shareLinkToken').fill(SHARE);if(await publish()!==503)fail(`${tag}: not-configured status`);
   if(!/no están configurados en este servidor[\s\S]*descarga el archivo para el cliente/.test(await status()))fail(`${tag}: not-configured message «${await status()}»`);await layout('not-configured');await shot('2-not-configured');
   // 3 · wrong code (the AI render one): refused, the field is cleared, nothing stored
   env={...FULL};await dialog.locator('#shareLinkToken').fill(RENDER);if(await publish()!==401)fail(`${tag}: wrong code status`);
   if(!/código de publicación no es correcto[\s\S]*distinto del código del Render IA/.test(await status()))fail(`${tag}: wrong-code message`);
   if(await dialog.locator('#shareLinkToken').inputValue()!=='')fail(`${tag}: a refused code stays in the field`);if(store.size)fail(`${tag}: something stored with a wrong code`);
   await shot('3-wrong-code');
   // 4 · two publications → result + «Mis publicaciones»
   await dialog.locator('#shareLinkToken').fill(SHARE);if(await publish()!==200)fail(`${tag}: publish A`);await dialog.locator('#shareLinkUrl').waitFor();const linkA=await dialog.locator('#shareLinkUrl').inputValue();
   if(await publish()!==200)fail(`${tag}: publish B`);const linkB=await dialog.locator('#shareLinkUrl').inputValue();
   if(await pubs.locator('.share-publication').count()!==2)fail(`${tag}: register shows ${await pubs.locator('.share-publication').count()} entries`);
   if(!/Mis publicaciones \(este navegador\)[\s\S]*no es un registro completo/.test(await pubs.innerText()))fail(`${tag}: register is presented as complete`);
   await layout('published');await shot('4-published');
   // 5 · withdraw B: Retirar → confirmation (focus on confirm) → cancel → nothing; again by keyboard → withdrawn
   const itemB=()=>pubs.locator(`.share-publication[data-pub="${pageOf(linkB)}"]`);
   // Keyboard path (focus-visible only applies to keyboard interaction; a mouse click legitimately shows no ring).
   await itemB().getByRole('button',{name:'Retirar'}).focus();await page.keyboard.press('Enter');await itemB().getByRole('button',{name:'Sí, retirar enlace'}).waitFor();
   const conf=await focusVisible('confirm button (keyboard)');if(!/Sí, retirar enlace/.test(conf.text))fail(`${tag}: focus not on the confirmation (${conf.text})`);
   if(!/dejará de poder abrir este enlace[\s\S]*No se puede deshacer/.test(await itemB().innerText()))fail(`${tag}: confirmation text`);await layout('confirm');await shot('5-confirm');
   await itemB().getByRole('button',{name:'Cancelar'}).click();if(store.size!==2)fail(`${tag}: cancel deleted something`);
   await itemB().getByRole('button',{name:'Retirar'}).click();const answered=page.waitForResponse(r=>r.url().startsWith(url+'api/unshare'));await page.keyboard.press('Enter');
   if((await answered).status()!==200)fail(`${tag}: keyboard withdrawal`);await page.waitForFunction(id=>document.querySelector(`[data-pub="${id}"]`)?.dataset.state==='withdrawn',pageOf(linkB));
   if(!/Enlace retirado[\s\S]*copias en caché[\s\S]*conserva su copia/.test(await status()))fail(`${tag}: withdrawn message`);
   const client=await context.newPage();if((await client.goto(linkB)).status()!==404)fail(`${tag}: withdrawn link still opens`);if((await client.goto(linkA)).status()!==200)fail(`${tag}: other link broken`);await client.close();
   await layout('withdrawn');await shot('6-withdrawn');
   // 6 · partial (storage refuses) → «Retirada incompleta», state partial; unreachable store → still partial; retry → withdrawn
   failOn.add(new URL(pageOf(linkA)).pathname);const itemA=()=>pubs.locator(`.share-publication[data-pub="${pageOf(linkA)}"]`);
   await itemA().getByRole('button',{name:'Retirar'}).click();await itemA().getByRole('button',{name:'Sí, retirar enlace'}).click();
   await page.waitForFunction(()=>/Retirada incompleta/.test(document.querySelector('#shareLinkStatus').textContent));
   if(await itemA().getAttribute('data-state')!=='partial')fail(`${tag}: partial state`);if(!/Retirada incompleta: faltan 1 archivo/.test(await itemA().innerText()))fail(`${tag}: partial entry text`);
   await layout('partial');await shot('7-partial');
   failOn.clear();throwDelete=1;await itemA().getByRole('button',{name:'Retirar'}).click();await itemA().getByRole('button',{name:'Sí, retirar enlace'}).click();
   await page.waitForFunction(()=>/Retirada incompleta/.test(document.querySelector('#shareLinkStatus').textContent));if(await itemA().getAttribute('data-state')!=='partial')fail(`${tag}: unreachable store not kept as partial`);
   await itemA().getByRole('button',{name:'Retirar'}).click();await itemA().getByRole('button',{name:'Sí, retirar enlace'}).click();
   await page.waitForFunction(id=>document.querySelector(`[data-pub="${id}"]`)?.dataset.state==='withdrawn',pageOf(linkA));if(store.size)fail(`${tag}: files left after retry`);
   // 7 · Escape closes; the project never changed; no code anywhere in storage
   await page.keyboard.press('Escape');if(await dialog.evaluate(d=>d.open))fail(`${tag}: Escape does not close the dialog`);
   if(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project))!==project)fail(`${tag}: the project changed`);
   if(await page.evaluate(c=>[localStorage,sessionStorage].some(s=>Object.keys(s).some(k=>String(s.getItem(k)).includes(c))),SHARE))fail(`${tag}: publishing code stored`);
   if(external.length)fail(`${tag}: external requests ${external.slice(0,3)}`);if(errors.length)fail(`${tag}: page errors ${errors.slice(0,3)}`);
   if(!results.some(r=>r.startsWith('FAIL')&&r.includes(tag)))pass(`${tag}: field, not configured, wrong code, publish ×2, register, confirm/cancel, keyboard withdrawal, partial, unreachable store, retry, Escape; no scroll, dialog in view, focus visible, no code stored, project unchanged`);
   await context.close();
  }
  // Evolución de obra (laboratory mode only, DEC-05): its publishing field is the publishing code, not the render one.
  const evo=await fs.readFile(path.join(root,'evolucion','index.html'),'utf8'),ui=await fs.readFile(path.join(root,'evolucion','delivery-ui.js'),'utf8');
  if(!/Código de publicación de enlaces[\s\S]*Es distinto del código del Render IA[\s\S]*No se guarda en el navegador/.test(evo)||!/'x-rubik-share-token':code/.test(ui)||/x-rubik-render-token/.test(ui))fail('Evolución: publishing field or header');else pass('Evolución: publishing-code field and header (lab mode; remote publication off in the product, DEC-05)');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
 console.log(results.join('\n'));process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
