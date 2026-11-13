'use strict';
/* UX-07 / ENT-04 · auditoría de integración de #220 sobre master con #219 (13/11/2026). Complementa
   ux07-activation.browser (que ya comprueba localStorage byte a byte, mismo origen y direcciones maliciosas) con lo que
   NO cubría:
   1. Solo lectura en TODO el almacenamiento del navegador: localStorage, sessionStorage, cookies, IndexedDB, Cache Storage
      y service workers quedan iguales durante el flujo completo (cortina, lado a lado, preparar el borrador interno,
      descargar HTML y manifiesto, verificar).
   2. No publica: todas las peticiones son GET al mismo origen; ninguna POST/PUT/PATCH/DELETE ni beacon; las descargas
      son locales (blob:).
   3. Datos maliciosos DENTRO de la biblioteca (no en la dirección): nombres con HTML no se ejecutan ni en la página ni en
      la vista previa del borrador (iframe con sandbox); un color de material no hexadecimal (inyección CSS con url()) se
      rechaza al leer la biblioteca, sin pedir nada fuera y sin escribir.
   Datos SINTÉTICOS (labs/ux07-ent04/fixtures.js) y precios ficticios. */
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const L=require('../js/project-library.js'),F=require('../labs/ux07-ent04/fixtures.js');
const root=path.resolve(__dirname,'..');
const TYPES={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
let server,browser,base;
test.before(async()=>{
  server=createServer(async(req,res)=>{try{let p=new URL(req.url,'http://local').pathname;if(p.endsWith('/'))p+='index.html';
    const file=path.resolve(root,'.'+decodeURIComponent(p));if(!file.startsWith(root+path.sep))throw Error('path');
    res.setHeader('Content-Type',TYPES[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${server.address().port}/`;
  browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox']});
});
test.after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});

const LIB='rubik-sota-project-library-v1',BUDGETS='rubik-budget-v1';
const memory=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),get:k=>m.get(k)};};
// Biblioteca real (FloorPlanLibrary): original + variante creada con su API y reformada, como en el editor.
function library({names=null,edit=null}={}){
  const st=memory(),lib=L.load(st,F.before());lib.variant(F.before(),'Reforma A');
  const v=lib.group(lib.activeId()).find(g=>g.id===lib.activeId()),after=F.after();after.id=v.project.id;after.name=v.project.name;lib.save(after);
  const data=JSON.parse(st.get(LIB));if(names)for(const e of data.entries)e.name=names(e);if(edit)edit(data);
  const [o,va]=[data.entries.find(e=>!e.variantOf),data.entries.find(e=>e.variantOf)];
  const budgets={[o.project.id]:F.budget('complete',o.project),[va.project.id]:F.budget('complete',va.project)};
  return {storage:{[LIB]:JSON.stringify(data),[BUDGETS]:JSON.stringify(budgets)},before:o.id,after:va.id};
}
// Todo lo que un comparador de solo lectura no debe tocar.
const everything=page=>page.evaluate(async()=>{const dump=s=>JSON.stringify(Object.keys(s).sort().map(k=>[k,s.getItem(k)]));
  return {local:dump(localStorage),session:dump(sessionStorage),cookies:document.cookie,
    idb:indexedDB.databases?(await indexedDB.databases()).map(d=>d.name).sort():null,caches:'caches' in window?(await caches.keys()).sort():null,
    sw:navigator.serviceWorker?(await navigator.serviceWorker.getRegistrations()).length:0};});
function watch(page){const w={errors:[],requests:[]};page.on('pageerror',e=>w.errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))w.errors.push(m.text());});
  page.on('request',r=>w.requests.push({url:r.url(),method:r.method(),type:r.resourceType()}));return w;}
async function open(context,lib,extra=''){
  const page=await context.newPage(),w=watch(page);
  await page.goto(base+'comparar/');await page.evaluate(s=>{localStorage.clear();for(const [k,v] of Object.entries(s))localStorage.setItem(k,v);},lib.storage);
  w.requests.length=0;const before=await everything(page);
  await page.goto(`${base}comparar/?src=library&before=${lib.before}&after=${lib.after}&anchor=${lib.after}${extra}`);
  return {page,w,before};
}
const offOrigin=w=>w.requests.filter(r=>!r.url.startsWith(base)&&!/^(data|blob|about):/.test(r.url));
const writes=w=>w.requests.filter(r=>r.method!=='GET'||r.type==='ping'||r.type==='beacon');

for(const viewport of [{width:1440,height:900},{width:390,height:844}])
test(`solo lectura en todo el almacenamiento y sin publicar: flujo completo del comparador ${viewport.width}x${viewport.height}`,{timeout:180000},async t=>{
  const mobile=viewport.width<1000,context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,acceptDownloads:true});t.after(()=>context.close());
  const lib=library(),{page,w,before}=await open(context,lib);
  await page.waitForSelector('#cmpCard:not([hidden])');assert.equal(await page.locator('#bcOut').getAttribute('data-status'),'complete');
  await page.locator('[data-mode="side"]').click();await page.locator('[data-mode="curtain"]').click();await page.locator('#slider').fill('20');
  await page.locator('#buildBtn').click();await page.waitForSelector('#dosOut:not([hidden])');
  const downloads=[];for(const id of ['#dlHtml','#dlManifest']){const [d]=await Promise.all([page.waitForEvent('download'),page.locator(id).click()]);downloads.push({name:d.suggestedFilename(),url:d.url()});}
  await page.locator('#verifyBtn').click();await page.waitForFunction(()=>/Borrador verificado/.test(document.getElementById('verifyOut').textContent));
  assert.deepEqual(await everything(page),before,'nada del almacenamiento del navegador cambia');
  assert.ok(downloads.every(d=>d.url.startsWith('blob:')),'las descargas se generan en el navegador (blob:), no en un servidor');
  assert.match(downloads[0].name,/\.borrador-interno\.html$/);assert.match(downloads[1].name,/\.manifest\.json$/);
  assert.deepEqual(offOrigin(w),[],'ninguna petición fuera del mismo origen');assert.deepEqual(writes(w),[],'ninguna petición que envíe datos');
  assert.equal(new URL(page.url()).origin,new URL(base).origin);assert.deepEqual(w.errors,[]);
});

test('datos maliciosos DENTRO de la biblioteca: nombres con HTML no se ejecutan (página ni borrador con sandbox)',{timeout:180000},async t=>{
  const context=await browser.newContext({acceptDownloads:true});t.after(()=>context.close());
  const evil='<img src=x onerror="window.__pwned=1">',lib=library({names:e=>e.variantOf?'Reforma '+evil:'Original '+evil,
    edit:d=>{for(const e of d.entries)for(const r of e.project.rooms)r.name=r.name+' '+evil;}});
  const {page,w,before}=await open(context,lib);
  await page.waitForSelector('#cmpCard:not([hidden])');assert.match(await page.locator('#relation').textContent(),/<img src=x/,'el nombre se muestra como texto');
  await page.locator('#buildBtn').click();await page.waitForSelector('#dosOut:not([hidden])');await page.waitForTimeout(500);
  const frame=page.frames().find(f=>f!==page.mainFrame());
  assert.equal(await page.locator('#preview').getAttribute('sandbox'),'','vista previa con sandbox y sin permisos');
  assert.equal(await page.evaluate(()=>window.__pwned),undefined,'nada se ejecuta en la página');
  assert.equal(await frame.evaluate(()=>window.__pwned).catch(()=>undefined),undefined,'nada se ejecuta en el borrador');
  assert.equal(await page.locator('#cmpCard img').count(),0,'ningún <img> insertado desde los datos');
  assert.deepEqual(await everything(page),before);assert.deepEqual(offOrigin(w),[]);assert.deepEqual(writes(w),[]);assert.deepEqual(w.errors,[]);
});

test('color de material no hexadecimal (inyección CSS con url()) en la biblioteca: se rechaza al leer, sin peticiones ni escrituras',{timeout:120000},async t=>{
  const context=await browser.newContext();t.after(()=>context.close());
  const lib=library({edit:d=>{const m=d.entries.find(e=>e.variantOf).project.materials.find(x=>x.appearance);m.appearance.color='red;background-image:url(https://evil.invalid/x)';}});
  const {page,w,before}=await open(context,lib);
  await page.waitForSelector('#fatalCard:not([hidden])');assert.match(await page.locator('#fatal').textContent(),/no se puede leer.*No se ha modificado nada/);
  assert.equal(await page.locator('#cmpCard').isHidden(),true);
  assert.deepEqual(await everything(page),before);assert.deepEqual(offOrigin(w),[],'ninguna petición a evil.invalid');assert.deepEqual(writes(w),[]);
});
