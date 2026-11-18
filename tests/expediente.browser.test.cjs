// F0.1 · Expediente in a REAL browser (Chromium): real localStorage, real IndexedDB (rubik-sota-images-v1) and real
// Web Locks. Unlike tests/expediente.test.cjs (an in-memory profile), each case uses separate browser contexts, so a
// «clean browser» is a fresh profile and a «reopen» is a real page reload.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const F=require('./fixtures/building-fixture.cjs');
const root=path.resolve(__dirname,'..');let server,browser,url;
// The same scripts, in the same order, that index.html loads up to project-package.js, plus the budget and the core.
const ordered=[...require('node:fs').readFileSync(path.join(root,'index.html'),'utf8').matchAll(/<script src="js\/([a-z0-9-]+)\.js"/g)].map(m=>m[1]);
const SCRIPTS=[...ordered.slice(0,ordered.indexOf('project-package')+1),'budget-core','expediente-core'];
const PAGE=`<!doctype html><meta charset="utf-8"><title>expediente</title>${SCRIPTS.map(s=>`<script src="/js/${s}.js"></script>`).join('')}
<script>
// What a tab holds: the collection loaded once, as index.html does.
window.lib=FloorPlanLibrary.load(localStorage,FloorPlanCore.initial());
const X=FloorPlanExpediente,I=FloorPlanImages;
const b64=buf=>{let s='';const u=new Uint8Array(buf);for(let i=0;i<u.length;i+=32768)s+=String.fromCharCode(...u.subarray(i,i+32768));return btoa(s);};
const unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0)).buffer;
window.ctx=(extra={})=>({library:lib,storage:localStorage,putImages:I.put,removeImages:I.remove,getImage:I.get,visible:lib.project(),...extra});
window.setup=async(project,image)=>{const key='img_browser1';await I.put([[key,new Blob([unb64(image)],{type:project.sourceImages[0].mediaType})]]);project.sourceImages[0].storage={kind:'local-browser',ref:key};
 lib.importProject(lib.project(),project,'Reforma navegador');const p=lib.project();
 localStorage.setItem('rubik-budget-v1',JSON.stringify({[p.id]:FloorPlanBudget.createBudget({id:'bud_'+p.id,subject:{type:'project',id:p.id},title:'Presupuesto',taxRatePercent:21})}));return p.id;};
window.exportFile=async()=>b64(await (await X.pack(X.collect({library:lib,storage:localStorage}),{getImage:I.get})).archive.arrayBuffer());
window.restoreFile=async(file,extra)=>{try{return await X.restore(await X.read(unb64(file)),ctx(extra));}catch(e){return {error:e.code||e.name,message:e.message,cause:e.cause&&e.cause.name,cleanup:e.cleanupPending};}};
window.state=async()=>({entries:lib.list().length,journal:Object.keys(localStorage).filter(k=>k.startsWith(X.JOURNAL+':')).length,images:(await I.keys()).length,budgets:Object.keys(JSON.parse(localStorage.getItem('rubik-budget-v1')||'{}')).length});
</script>`;
before(async()=>{
 server=createServer(async(req,res)=>{try{const p=new URL(req.url,'http://l').pathname;if(p==='/expediente.html'){res.setHeader('content-type','text/html');return res.end(PAGE);}
  const f=path.resolve(root,'.'+p);if(!f.startsWith(root+path.sep))throw 0;res.setHeader('content-type',f.endsWith('.js')?'text/javascript':'application/octet-stream');res.end(await fs.readFile(f));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/expediente.html`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox']});
});
after(async()=>{await browser?.close();await new Promise(r=>server.close(r));});
async function open(context){const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.stack||e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 await page.goto(url);await page.waitForFunction(()=>window.exportFile,null,{timeout:20000}).catch(()=>{throw Error('La página de prueba no cargó: '+errors.join(' | '));});page.errors=errors;return page;}
async function exported(){const fx=F.build(),project=JSON.parse(JSON.stringify(fx.building.levels[0].project)),image=fx.bytesFor(project.sourceImages[0].id).toString('base64');
 const context=await browser.newContext(),page=await open(context);const id=await page.evaluate(([p,i])=>setup(p,i),[project,image]);const file=await page.evaluate(()=>exportFile());await context.close();return {file,id,image};}

test('real browser: a clean profile restores the expediente, survives a reload and recognises it again',{timeout:120000},async()=>{
 const {file,id,image}=await exported(),context=await browser.newContext();let page=await open(context);
 const r=await page.evaluate(f=>restoreFile(f),file);assert.equal(r.status,'restored',JSON.stringify(r));
 await page.reload();await page.waitForFunction(()=>window.exportFile);
 const reopened=await page.evaluate(async([entry,pid])=>{lib.open(entry);const p=lib.project(),blob=await FloorPlanImages.get(p.sourceImages[0].storage.ref);
  const u=new Uint8Array(await blob.arrayBuffer());let s='';for(const c of u)s+=String.fromCharCode(c);return {id:p.id,budget:JSON.parse(localStorage.getItem('rubik-budget-v1'))[pid]?.taxRatePercent,image:btoa(s)};},[r.entryId,id]);
 assert.deepEqual(reopened,{id,budget:21,image});
 assert.equal((await page.evaluate(f=>restoreFile(f),file)).status,'already-present');assert.deepEqual(page.errors,[]);await context.close();
});

test('real browser: a restore interrupted by a reload leaves no visible trace and recover() removes the leftovers',{timeout:120000},async()=>{
 const {file}=await exported(),context=await browser.newContext(),page=await open(context);
 await page.evaluate(f=>{window.halted=false;restoreFile(f,{putImages:async e=>{await FloorPlanImages.put(e);window.halted=true;await new Promise(()=>{});}});},file);
 await page.waitForFunction(()=>window.halted);await page.reload();await page.waitForFunction(()=>window.exportFile);
 const left=await page.evaluate(()=>state());assert.equal(left.entries,1);assert.equal(left.journal,1);assert.equal(left.images,1);
 assert.deepEqual(await page.evaluate(()=>FloorPlanExpediente.recover({library:lib,storage:localStorage,removeImages:FloorPlanImages.remove,minAgeMs:0})),{committed:0,rolledBack:1,pending:[]});
 assert.deepEqual(await page.evaluate(()=>state()),{entries:1,journal:0,images:0,budgets:0});await context.close();
});

test('real browser: an exhausted localStorage quota fails visibly and leaves everything as it was',{timeout:120000},async()=>{
 const {file}=await exported(),context=await browser.newContext(),page=await open(context);
 const before=await page.evaluate(()=>{let n=1<<22,chunk='x'.repeat(1<<16),junk='';
  // Fill the origin's quota, then free a little: the journal fits, the documents and the library do not.
  for(;;){try{localStorage.setItem('junk',junk+chunk);junk+=chunk;}catch{if(chunk.length<512)break;chunk=chunk.slice(chunk.length/2);}}
  localStorage.setItem('junk',junk.slice(0,-600));return state();});
 const r=await page.evaluate(f=>restoreFile(f),file);
 assert.equal(r.cause,'QuotaExceededError',JSON.stringify(r));assert.match(r.message,/No se ha añadido ni cambiado nada/);
 assert.deepEqual(await page.evaluate(()=>state()),before);await page.evaluate(()=>localStorage.removeItem('junk'));await context.close();
});

test('real browser: a second tab that has not seen the first tab’s restore refuses instead of erasing it',{timeout:120000},async()=>{
 const {file}=await exported(),context=await browser.newContext(),[a,b]=[await open(context),await open(context)];
 assert.equal((await a.evaluate(f=>restoreFile(f),file)).status,'restored');
 // localStorage reaches the other tab with a delay: wait until tab B can see A's write, as a real user would.
 await b.waitForFunction(()=>JSON.parse(localStorage.getItem(FloorPlanLibrary.KEY)||'{"entries":[]}').entries.length===2);
 const r=await b.evaluate(f=>restoreFile(f,{copy:true}),file);assert.equal(r.error,'library-stale',JSON.stringify(r));
 const fresh=await context.newPage();await fresh.goto(url);await fresh.waitForFunction(()=>window.exportFile);
 assert.deepEqual(await fresh.evaluate(()=>state()),{entries:2,journal:0,images:1,budgets:1});await context.close();
});
