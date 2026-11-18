// F0.2 · Persistence authority in a REAL browser (Chromium): real IndexedDB, localStorage, Web Locks, BroadcastChannel,
// real quota (CDP Storage.overrideQuotaForOrigin) and real reloads. Nothing here is simulated in memory.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const F=require('./fixtures/building-fixture.cjs'),BUDGET='rubik-budget-v1';
const root=path.resolve(__dirname,'..');let server,browser,url,origin;
const ordered=[...require('node:fs').readFileSync(path.join(root,'index.html'),'utf8').matchAll(/<script src="js\/([a-z0-9-]+)\.js"/g)].map(m=>m[1]);
const SCRIPTS=[...ordered.slice(0,ordered.indexOf('project-package')+1),'budget-core','expediente-core','persistence-store'];
const PAGE=`<!doctype html><meta charset="utf-8"><title>persistencia</title>${SCRIPTS.map(s=>`<script src="/js/${s}.js"></script>`).join('')}
<script>
const P=FloorPlanPersistence,X=FloorPlanExpediente,I=FloorPlanImages,BUDGET='rubik-budget-v1';
window.states=[];
window.start=async(opts={})=>{window.s=await P.session({debounceMs:60000,onState:st=>states.push(st.status),...opts});return s.state();};
window.lsSnapshot=()=>Object.fromEntries(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)]));
window.authority=async()=>{const db=await P.open(),{revision,docs}=await P.load(db),c=await P.conflicts(db);db.close();return {revision,docs:Object.fromEntries(docs),conflicts:c};};
const b64=buf=>{let s='';const u=new Uint8Array(buf);for(let i=0;i<u.length;i+=32768)s+=String.fromCharCode(...u.subarray(i,i+32768));return btoa(s);};
const unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0)).buffer;
window.setup=async(project,image)=>{const lib=FloorPlanLibrary.load(localStorage,FloorPlanCore.initial()),key='img_setup1';await I.put([[key,new Blob([unb64(image)],{type:project.sourceImages[0].mediaType})]]);project.sourceImages[0].storage={kind:'local-browser',ref:key};
 lib.importProject(lib.project(),project,'Reforma');const p=lib.project();localStorage.setItem(BUDGET,JSON.stringify({[p.id]:FloorPlanBudget.createBudget({id:'bud_'+p.id,subject:{type:'project',id:p.id},title:'Presupuesto',taxRatePercent:21})}));
 return b64(await (await X.pack(X.collect({library:lib,storage:localStorage}),{getImage:I.get})).archive.arrayBuffer());};
window.unb64=unb64;
</script>`;
before(async()=>{
 server=createServer(async(req,res)=>{try{const p=new URL(req.url,'http://l').pathname;if(p==='/p.html'){res.setHeader('content-type','text/html');return res.end(PAGE);}
  const f=path.resolve(root,'.'+p);if(!f.startsWith(root+path.sep))throw 0;res.setHeader('content-type',f.endsWith('.js')?'text/javascript':'application/octet-stream');res.end(await fs.readFile(f));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));origin=`http://127.0.0.1:${server.address().port}`;url=origin+'/p.html';
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox']});
});
after(async()=>{await browser?.close();await new Promise(r=>server.close(r));});
async function open(context){const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.stack||e.message));
 await page.goto(url);await page.waitForFunction(()=>window.start,null,{timeout:20000}).catch(()=>{throw Error('La página no cargó: '+errors.join(' | '));});page.errors=errors;return page;}
const ready=page=>page.waitForFunction(()=>window.start);
// A profile that already has work in localStorage, as a user of the current RUBIK has.
async function seeded(context){const page=await open(context);await page.evaluate(()=>{const lib=FloorPlanLibrary.load(localStorage,FloorPlanCore.initial());lib.save(lib.project());
 localStorage.setItem(BUDGET,JSON.stringify({x:{note:'presupuesto original'}}));localStorage.setItem('rubik-review-v1','{"r":1}');localStorage.setItem('rubik-assistant-v1','{"privado":true}');});return page;}

test('migration copies byte for byte, never touches localStorage, and is idempotent',{timeout:120000},async()=>{
 const context=await browser.newContext(),page=await seeded(context),before=await page.evaluate(()=>lsSnapshot());
 const st=await page.evaluate(()=>start());assert.equal(st.migration,'migrated');assert.equal(st.status,'saved');
 const a=await page.evaluate(()=>authority());
 for(const k of ['rubik-sota-project-library-v1','rubik-budget-v1','rubik-review-v1'])assert.equal(a.docs[k],before[k],k);
 assert.equal(a.docs['rubik-assistant-v1'],undefined,'the assistant log stays outside the authority');
 assert.deepEqual(await page.evaluate(()=>lsSnapshot()),before,'localStorage is byte-identical after migrating');
 await page.reload();await ready(page);
 assert.equal((await page.evaluate(()=>start())).migration,'already');assert.equal((await page.evaluate(()=>authority())).revision,1);
 await context.close();
});

test('a migration interrupted between its phases is repeated and completes, with localStorage intact',{timeout:120000},async()=>{
 const context=await browser.newContext(),page=await seeded(context),before=await page.evaluate(()=>lsSnapshot());
 await page.evaluate(()=>{window.halted=false;start({hooks:{afterCopy:async()=>{window.halted=true;await new Promise(()=>{});}}});});
 await page.waitForFunction(()=>window.halted);await page.reload();await ready(page);
 const st=await page.evaluate(()=>start());assert.equal(st.migration,'migrated');
 const a=await page.evaluate(()=>authority());assert.equal(a.docs['rubik-budget-v1'],before['rubik-budget-v1']);
 assert.deepEqual(await page.evaluate(()=>lsSnapshot()),before);await context.close();
});

test('«saved» only after the transaction completes; unconfirmed changes are shown as pending; reopening gives the last confirmed state',{timeout:120000},async()=>{
 const context=await browser.newContext(),page=await seeded(context);await page.evaluate(()=>start());
 // Not flushed: visible as pending, and a reload does not pretend it was saved.
 assert.equal(await page.evaluate(()=>{s.storage.setItem(BUDGET,'{"v":"sin confirmar"}');return s.state().status;}),'pending');
 await page.reload();await ready(page);await page.evaluate(()=>start());
 assert.equal(await page.evaluate(()=>s.storage.getItem(BUDGET)),'{"x":{"note":"presupuesto original"}}');
 const st=await page.evaluate(async()=>{states.length=0;s.storage.setItem(BUDGET,'{"v":"confirmado"}');await s.flush();return {...s.state(),seen:states.join('>')};});
 assert.equal(st.status,'saved');assert.equal(st.revision,2);assert.equal(st.seen,'pending>saving>saved');assert.equal(st.mirror.ok,true);
 await page.reload();await ready(page);await page.evaluate(()=>start());
 assert.equal(await page.evaluate(()=>s.storage.getItem(BUDGET)),'{"v":"confirmado"}');
 // Without waiting for the debounce or any close event: the change reaches IndexedDB on its own.
 await page.evaluate(()=>{s.close();return start({debounceMs:50});});
 await page.evaluate(()=>s.storage.setItem(BUDGET,'{"v":"autoguardado"}'));
 await page.waitForFunction(()=>s.state().status==='saved'&&s.state().revision===3);
 assert.equal((await page.evaluate(()=>authority())).docs[BUDGET],'{"v":"autoguardado"}');assert.deepEqual(page.errors,[]);await context.close();
});

test('a real exhausted quota fails visibly, keeps the change in memory and in the emergency export, and loses nothing confirmed',{timeout:120000},async()=>{
 // An on-disk profile: Chromium enforces a quota override there (incognito contexts keep storage in memory and ignore it).
 const dir=require('node:fs').mkdtempSync(path.join(require('node:os').tmpdir(),'rubik-quota-'));
 const context=await chromium.launchPersistentContext(dir,{executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox']});try{const page=await seeded(context);
 // The quota applies to storage opened after it is set, as for a user whose disk is already nearly full.
 const cdp=await context.newCDPSession(page);await cdp.send('Storage.overrideQuotaForOrigin',{origin,quotaSize:512*1024});await page.evaluate(()=>start());
 const st=await page.evaluate(async()=>{// Random (incompressible) bytes: Chromium compresses large IndexedDB values.
  const u=new Uint8Array(3*1024*1024);for(let i=0;i<u.length;i+=65536)crypto.getRandomValues(u.subarray(i,i+65536));let big='';for(let i=0;i<u.length;i+=32768)big+=String.fromCharCode(...u.subarray(i,i+32768));
  s.storage.setItem(BUDGET,JSON.stringify({big:btoa(big)}));await s.flush();const e=s.state();return {status:e.status,code:e.error?.code,message:e.error?.message,pending:e.pending};});
 assert.equal(st.status,'error');assert.equal(st.code,'write-failed');assert.match(st.message,/No se ha guardado/);assert.equal(st.pending,1);
 const exported=await page.evaluate(async()=>JSON.parse(await s.emergencyExport().text()));
 assert.equal(exported.format,'rubik-sota.emergency');assert.equal(JSON.parse(exported.unsaved[BUDGET]).big.length,4*1024*1024);
 assert.equal((await page.evaluate(()=>authority())).docs['rubik-budget-v1'],'{"x":{"note":"presupuesto original"}}');
 await cdp.send('Storage.overrideQuotaForOrigin',{origin});
 // With space again, the same session saves what it kept.
 assert.equal(await page.evaluate(async()=>{await s.flush();return s.state().status;}),'saved');
 }finally{await context.close();await fs.rm(dir,{recursive:true,force:true});}
});

test('two tabs: the second commit does not overwrite the first; its work is kept as a recoverable conflict',{timeout:120000},async()=>{
 const context=await browser.newContext(),a=await seeded(context);await a.evaluate(()=>start());const b=await open(context);await b.evaluate(()=>start());
 assert.equal((await a.evaluate(async()=>{s.storage.setItem(BUDGET,'{"de":"A"}');await s.flush();return s.state();})).status,'saved');
 await b.waitForFunction(()=>s.state().outdated===true);
 const rb=await b.evaluate(async()=>{s.storage.setItem(BUDGET,'{"de":"B"}');await s.flush();const e=s.state();return {status:e.status,id:e.conflictId,message:e.error.message,pending:e.pending};});
 assert.equal(rb.status,'conflict');assert.match(rb.message,/no se han perdido/);assert.equal(rb.pending,1);
 const fresh=await open(context),auth=await fresh.evaluate(()=>authority());
 assert.equal(auth.docs[ 'rubik-budget-v1'],'{"de":"A"}');
 const c=auth.conflicts.find(x=>x.id===rb.id);assert.equal(c.reason,'revision');assert.equal(c.changes['rubik-budget-v1'],'{"de":"B"}');
 await context.close();
});

test('downgrade: an older RUBIK reads the latest confirmed state; if the mirror fails it refuses visibly; its later writes become a conflict',{timeout:120000},async()=>{
 const context=await browser.newContext(),page=await seeded(context);await page.evaluate(()=>start());
 const renamed=await page.evaluate(async()=>{const lib=FloorPlanLibrary.load(s.storage,FloorPlanCore.initial()),p=lib.project();p.name='Nombre confirmado';lib.save(p);await s.flush();
  // What the pre-F0.2 index.html does: FloorPlanLibrary.load(localStorage).
  return FloorPlanLibrary.load(localStorage,FloorPlanCore.initial()).project().name;});
 assert.equal(renamed,'Nombre confirmado');
 // The mirror cannot be written (localStorage full): the older version must not open a stale library.
 const blocked=await page.evaluate(async()=>{let i=0;for(let n=1<<20;n>=1;n>>=2)for(;;){try{localStorage.setItem('junk'+i,'x'.repeat(n));i++;}catch{break;}}
  const lib=FloorPlanLibrary.load(s.storage,FloorPlanCore.initial()),p=lib.project();p.name='Nombre nuevo tras llenar el almacenamiento local';lib.save(p);await s.flush();const st=s.state();
  let old;try{FloorPlanLibrary.load(localStorage,FloorPlanCore.initial());old='abrió una copia';}catch(e){old='rechazada: '+e.message;}for(const k of Object.keys(localStorage))if(k.startsWith('junk'))localStorage.removeItem(k);return {status:st.status,mirror:st.mirror,old};});
 assert.equal(blocked.status,'saved');assert.equal(blocked.mirror.ok,false);assert.equal(blocked.mirror.blocked,true);assert.match(blocked.old,/^rechazada/);
 assert.match((await page.evaluate(()=>authority())).docs['rubik-sota-project-library-v1'],/Nombre nuevo/);
 // An older version writes to localStorage; the next start keeps that write as a conflict and does not apply it.
 await page.evaluate(()=>{s.close();localStorage.setItem(BUDGET,'{"escrito":"por una versión anterior"}');});
 await page.reload();await ready(page);const st=await page.evaluate(()=>start());assert.equal(st.diverged.length,1);
 const auth=await page.evaluate(()=>authority());assert.notEqual(auth.docs[BUDGET_KEY()],'{"escrito":"por una versión anterior"}');
 assert.equal(auth.conflicts.find(c=>c.id===st.diverged[0]).changes['rubik-budget-v1'],'{"escrito":"por una versión anterior"}');
 assert.equal((await page.evaluate(async()=>{await s.close();return start();})).diverged.length,0,'recorded once, not on every start');
 await context.close();
});
const BUDGET_KEY=()=>'rubik-budget-v1';

test('image collection never deletes an image of a restore in progress or just committed in another tab',{timeout:120000},async()=>{
 const fx=F.build(),project=JSON.parse(JSON.stringify(fx.building.levels[0].project)),image=fx.bytesFor(project.sourceImages[0].id).toString('base64');
 const src=await browser.newContext(),sp=await open(src),file=await sp.evaluate(([p,i])=>setup(p,i),[project,image]);await src.close();
 const context=await browser.newContext(),[a,b]=[await open(context),await open(context)];
 await b.evaluate(()=>{window.staleLib=FloorPlanLibrary.load(localStorage,FloorPlanCore.initial());});
 await a.evaluate(f=>{window.halted=false;window.release=null;const lib=FloorPlanLibrary.load(localStorage,FloorPlanCore.initial());
  window.done=(async()=>X.restore(await X.read(unb64(f)),{library:lib,storage:localStorage,removeImages:I.remove,getImage:I.get,visible:lib.project(),
   putImages:async e=>{await I.put(e);window.halted=true;await new Promise(r=>{window.release=r;});}}))();},file);
 await a.waitForFunction(()=>window.halted);
 const keys=await a.evaluate(()=>I.keys());assert.equal(keys.length,1);
 // Tab B only knows its stale library, and asks for immediate deletion (grace 0): it has to wait for the restore's lock.
 await b.evaluate(()=>{window.gc=I.collect({live:async()=>new Set(FloorPlanLibrary.load(localStorage,FloorPlanCore.initial()).projects().concat(staleLib.projects()).flatMap(p=>(p.sourceImages||[]).map(i=>i.storage?.ref||i.id))),storage:localStorage,graceMs:0});window.gcDone=false;gc.then(()=>{gcDone=true;});});
 await b.waitForTimeout(500);assert.equal(await b.evaluate(()=>gcDone),false,'collection waits for the restore');
 await a.evaluate(()=>{window.release();return window.done;});
 const r=await b.evaluate(()=>gc);assert.deepEqual(r.removed,[]);assert.deepEqual(await b.evaluate(()=>I.keys()),keys);
 // Without Web Locks (older browser): the recovery journal of an unconfirmed restore protects its images too.
 await a.evaluate(()=>localStorage.setItem(X.JOURNAL+':manual',JSON.stringify({startedAt:new Date().toISOString(),projectIds:['prj_nadie'],images:['img_en_curso'],documents:{budgets:[],reviews:[]}})));
 await a.evaluate(()=>I.put([['img_en_curso',new Blob(['x'])]]));
 const r2=await b.evaluate(()=>I.collect({live:async()=>new Set(),storage:localStorage,locks:null,graceMs:0}));
 assert.ok(!r2.removed.includes('img_en_curso'));assert.ok(!r2.removed.includes(keys[0]),'nor the committed one: a first pass only marks');
 await context.close();
});

test('recover() with a tab’s stale copy of the library does not undo a restore another tab committed',{timeout:120000},async()=>{
 const fx=F.build(),project=JSON.parse(JSON.stringify(fx.building.levels[0].project)),image=fx.bytesFor(project.sourceImages[0].id).toString('base64');
 const src=await browser.newContext(),sp=await open(src),file=await sp.evaluate(([p,i])=>setup(p,i),[project,image]);await src.close();
 const context=await browser.newContext(),page=await open(context);
 const out=await page.evaluate(async f=>{const stale=FloorPlanLibrary.load(localStorage,FloorPlanCore.initial()),lib=FloorPlanLibrary.load(localStorage,FloorPlanCore.initial());
  // The journal entry survives the commit (the browser closed right after it): journalPending.
  const storage={getItem:k=>localStorage.getItem(k),setItem:(k,v)=>localStorage.setItem(k,v),removeItem:k=>{if(k.startsWith(X.JOURNAL))throw Error('cierre');localStorage.removeItem(k);},key:i=>localStorage.key(i),get length(){return localStorage.length;}};
  const r=await X.restore(await X.read(unb64(f)),{library:lib,storage,putImages:I.put,removeImages:I.remove,getImage:I.get,visible:lib.project()});
  const report=await X.recover({library:stale,storage:localStorage,removeImages:I.remove,minAgeMs:0});
  const budgets=JSON.parse(localStorage.getItem('rubik-budget-v1')||'{}');return {pending:r.journalPending,report,images:(await I.keys()).length,budgets:Object.keys(budgets).length};},file);
 assert.equal(out.pending,true);assert.deepEqual(out.report,{committed:1,rolledBack:0,pending:[]});assert.equal(out.images,1);assert.equal(out.budgets,1);
 await context.close();
});
