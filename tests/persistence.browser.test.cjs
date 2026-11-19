// F0.2 · Persistence authority in a REAL browser (Chromium): real IndexedDB, localStorage, Web Locks, BroadcastChannel,
// real quota (CDP Storage.overrideQuotaForOrigin) and real reloads. Nothing here is simulated in memory.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),playwright=require('playwright'),{chromium}=playwright;
const F=require('./fixtures/building-fixture.cjs'),BUDGET='rubik-budget-v1';
const root=path.resolve(__dirname,'..');let server,browser,url,origin;
const ordered=[...require('node:fs').readFileSync(path.join(root,'index.html'),'utf8').matchAll(/<script src="js\/([a-z0-9-]+)\.js"/g)].map(m=>m[1]);
const SCRIPTS=[...ordered.slice(0,ordered.indexOf('project-package')+1),'budget-core','expediente-core','storage-persistence','persistence-store'];
const PAGE=`<!doctype html><meta charset="utf-8"><title>persistencia</title>${SCRIPTS.map(s=>`<script src="/js/${s}.js"></script>`).join('')}
<script>
const P=FloorPlanPersistence,X=FloorPlanExpediente,I=FloorPlanImages,BUDGET='rubik-budget-v1';
I.holdTab(); // tracing-ui does this in every editor tab, even before a persistence session
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
  const f=path.resolve(root,'.'+(p.endsWith('/')?p+'index.html':p));if(!f.startsWith(root+path.sep))throw 0;
  const type={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json'};
  res.setHeader('content-type',type[path.extname(f)]||'application/octet-stream');res.end(await fs.readFile(f));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));origin=`http://f0-2b.localhost:${server.address().port}`;url=origin+'/p.html';
 const engine=process.env.F0_BROWSER||'chromium';
 browser=await playwright[engine].launch(engine==='chromium'?{executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox']}:{});
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

test('storage permission follows a trusted confirmed save; status, autosave, empty save and a conflict never ask',{timeout:120000},async()=>{
 const context=await browser.newContext(),a=await seeded(context),b=await open(context);
 try{
  for(const page of [a,b])await page.evaluate(async()=>{
   window.calls=0;window.permissionGranted=false;
   Object.defineProperty(navigator,'storage',{value:{
    persisted:async()=>window.permissionGranted,estimate:async()=>({usage:10,quota:100}),
    persist:()=>{++window.calls;return new Promise(resolve=>{window.finishPermission=granted=>{window.permissionGranted=granted;resolve(granted);};});}
   }});
   await start();
   const button=document.createElement('button');button.id='save';button.textContent='Guardar';
   button.onclick=userEvent=>{window.saved=s.flush({userEvent});};
   document.body.append(button);
  });
  assert.deepEqual(await a.evaluate(()=>s.storageStatus()),{persisted:false,estimate:{usage:10,quota:100}});
  await a.click('#save');await a.evaluate(()=>saved);
  await a.evaluate(async()=>{s.storage.setItem(BUDGET,'{"automatico":true}');await s.flush();});
  assert.equal(await a.evaluate(()=>window.calls),0);
  await b.evaluate(()=>s.storage.setItem(BUDGET,'{"en-conflicto":true}'));
  await b.click('#save');
  assert.equal((await b.evaluate(()=>saved)).status,'conflict');
  assert.equal(await b.evaluate(()=>window.calls),0);
  await a.evaluate(()=>s.storage.setItem(BUDGET,'{"confirmado":true}'));
  await a.click('#save');
  assert.equal((await a.evaluate(()=>saved)).status,'saved','save resolves while the browser prompt is still pending');
  assert.equal((await a.evaluate(()=>authority())).docs[BUDGET],'{"confirmado":true}');
  await a.waitForFunction(()=>window.calls===1);
  await a.evaluate(()=>window.finishPermission(true));
  await a.waitForFunction(()=>s.state().persisted===true);
  assert.equal((await a.evaluate(()=>s.storageStatus())).persisted,true);
  await a.evaluate(()=>s.storage.setItem(BUDGET,'{"segundo":true}'));
  await a.click('#save');assert.equal((await a.evaluate(()=>saved)).status,'saved');
  assert.equal(await a.evaluate(()=>window.calls),1);
 }finally{await context.close();}
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
 const exported=await page.evaluate(async()=>JSON.parse(await (await s.emergencyExport()).text()));
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
 assert.equal(rb.status,'conflict');assert.match(rb.message,/nada se ha sobrescrito/);assert.equal(rb.pending,0,'kept in IndexedDB, not only in memory');
 const fresh=await open(context),auth=await fresh.evaluate(()=>authority());
 assert.equal(auth.docs[ 'rubik-budget-v1'],'{"de":"A"}');
 const c=auth.conflicts.find(x=>x.id===rb.id);assert.equal(c.reason,'revision');assert.equal(c.docs['rubik-budget-v1'],'{"de":"B"}');
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
 assert.equal(auth.conflicts.find(c=>c.id===st.diverged[0]).docs['rubik-budget-v1'],'{"escrito":"por una versión anterior"}');
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
 const nextDay=await b.evaluate(()=>I.collect({live:async()=>new Set(),storage:localStorage,locks:null,now:()=>Date.now()+86_400_000}));
 assert.equal(nextDay.sweep,false);assert.deepEqual(nextDay.removed,[]);
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

// ── F0.2a closing review ─────────────────────────────────────────────────────────────────────────────────────────
// Simulated write failures, inside a real browser: a Storage wrapper over the real localStorage that throws for one key.
const failing=()=>{window.failing=pred=>({getItem:k=>localStorage.getItem(k),setItem:(k,v)=>{if(pred(k,v))throw Object.assign(new Error('fallo de escritura'),{name:'QuotaExceededError'});localStorage.setItem(k,v);},removeItem:k=>localStorage.removeItem(k),key:i=>localStorage.key(i),get length(){return localStorage.length;}});};

test('a snapshot and its revision always belong to the same confirmed state, even while another tab commits',{timeout:120000},async()=>{
 const context=await browser.newContext(),a=await seeded(context);await a.evaluate(()=>start());const b=await open(context);await b.evaluate(()=>start());
 // Each commit writes the revision it produces into the document; a reader must never see one labelled with another.
 const writer=a.evaluate(async()=>{for(let i=0;i<40;i++){const n=s.state().revision+1;s.storage.setItem(BUDGET,JSON.stringify({rev:n}));await s.flush();}});
 const bad=await b.evaluate(async()=>{const db=await P.open();let bad=0,seen=new Set();for(let i=0;i<300;i++){const {revision,docs}=await P.load(db);const v=JSON.parse(docs.get(BUDGET));if(v.rev!==undefined){seen.add(revision);if(v.rev!==revision)bad++;}}db.close();return {bad,seen:seen.size};});
 await writer;assert.equal(bad.bad,0);assert.ok(bad.seen>1,'the reader did observe several revisions');await context.close();
});

test('a conflict keeps the COMPLETE work, including changes made during the transaction and after it, and can be rebuilt',{timeout:180000},async()=>{
 const fx=F.build(),project=JSON.parse(JSON.stringify(fx.building.levels[0].project)),image=fx.bytesFor(project.sourceImages[0].id).toString('base64');
 const context=await browser.newContext(),a=await open(context);await a.evaluate(([p,i])=>setup(p,i),[project,image]);await a.evaluate(()=>start());
 const b=await open(context);await b.evaluate(()=>start());
 await a.evaluate(async()=>{s.storage.setItem('rubik-review-v1','{"de":"A"}');await s.flush();});
 const r=await b.evaluate(async()=>{const lib=FloorPlanLibrary.load(s.storage,FloorPlanCore.initial()),p=lib.project();p.name='Trabajo de B';lib.save(p);
  const all=JSON.parse(s.storage.getItem(BUDGET));all[p.id].taxRatePercent=10;s.storage.setItem(BUDGET,JSON.stringify(all));
  // A change that arrives once the batch has been taken, while the transaction is in flight.
  const off=s.subscribe(st=>{if(st.status==='saving'){off();s.storage.setItem('rubik-construction-v1','{"durante":"la transacción"}');}});
  await s.flush();await new Promise(res=>setTimeout(res,400));await s.flush();
  // And one after the conflict.
  s.storage.setItem('rubik-review-v1','{"despues":"del conflicto"}');await s.flush();
  const st=s.state();return {status:st.status,id:st.conflictId,pending:st.pending,image:p.sourceImages[0].storage.ref,pid:p.id};});
 assert.equal(r.status,'conflict');assert.equal(r.pending,0,'nothing stays only in memory');
 // B's memory is gone: reopen and rebuild its work from the conflict record alone.
 await b.close();const c=await open(context);await c.evaluate(()=>start());
 const rebuilt=await c.evaluate(async([id,pid,ref])=>{const ex=JSON.parse(await (await s.conflictExport(id)).text());
  const out=await s.adoptConflict(id),lib=FloorPlanLibrary.load(s.storage,FloorPlanCore.initial()),p=lib.projects().find(x=>x.id===pid),auth=await authority();
  return {name:p.name,tax:JSON.parse(auth.docs[BUDGET])[pid].taxRatePercent,review:auth.docs['rubik-review-v1'],construction:auth.docs['rubik-construction-v1'],
   imageInExport:!!ex.images[ref],image:!!(await I.get(ref)),superseded:auth.conflicts.find(x=>x.id===out.superseded).docs['rubik-review-v1']};},[r.id,r.pid,r.image]);
 assert.deepEqual(rebuilt,{name:'Trabajo de B',tax:10,review:'{"despues":"del conflicto"}',construction:'{"durante":"la transacción"}',imageInExport:true,image:true,superseded:'{"de":"A"}'});
 await context.close();
});

test('images of conflicts and of other open tabs are never collected; the grace period is not the only guarantee',{timeout:120000},async()=>{
 const context=await browser.newContext(),a=await seeded(context);await a.evaluate(()=>start());
 await a.evaluate(async()=>{await I.put([['img_conflicto',new Blob(['c'])],['img_suelta',new Blob(['s'])]]);
  const db=await P.open();await new Promise((res,rej)=>{const t=db.transaction('conflicts','readwrite');t.objectStore('conflicts').add({reason:'revision',docs:{'rubik-sota-project-library-v1':JSON.stringify({x:{storage:{kind:'local-browser',ref:'img_conflicto'}}})}});t.oncomplete=res;t.onerror=rej;});db.close();});
 const other=await open(context);await other.evaluate(()=>I.holdTab());
 const gc=()=>a.evaluate(()=>I.collect({live:async()=>new Set(),storage:localStorage,graceMs:0}));
 await gc();const withOther=await gc();assert.equal(withOther.sweep,false);assert.deepEqual(withOther.removed,[]);
 await other.close();
 // Closing a tab releases its lock asynchronously.
 await a.waitForFunction(async()=>(await navigator.locks.query()).held.filter(l=>l.name.startsWith(I.TAB_LOCK)).length===1);// The image was already marked by the earlier passes: the first pass alone sweeps it.
 const alone=await gc();
 assert.equal(alone.sweep,true);assert.deepEqual(alone.removed,['img_suelta'],'it does sweep once alone, and keeps the conflict image');
 assert.deepEqual(await a.evaluate(()=>I.keys()),['img_conflicto']);
 await context.close();
});

test('compatibility copy: an interruption between keys leaves the library blocked, never a mixture, and the next start repairs it',{timeout:120000},async()=>{
 const context=await browser.newContext(),page=await seeded(context);await page.evaluate(()=>start());await page.evaluate(()=>s.close());
 await page.evaluate(()=>{window.halted=false;P.session({hooks:{afterBarrier:async()=>{window.halted=true;await new Promise(()=>{});}}}).then(x=>{x.storage.setItem(BUDGET,'{"rev":"nueva"}');x.flush();});});
 await page.waitForFunction(()=>window.halted);await page.reload();await ready(page);
 const mid=await page.evaluate(()=>{let old;try{FloorPlanLibrary.load(localStorage,FloorPlanCore.initial());old='abrió';}catch(e){old='rechazada';}return {library:localStorage.getItem('rubik-sota-project-library-v1')===P.TOMBSTONE,old};});
 assert.deepEqual(mid,{library:true,old:'rechazada'});
 const st=await page.evaluate(()=>start());assert.equal(st.mirror.ok,true);
 assert.equal(await page.evaluate(async()=>{const a=await authority();return P.KEYS.every(k=>(a.docs[k]??null)===localStorage.getItem(k))&&a.docs[BUDGET]==='{"rev":"nueva"}';}),true);
 await context.close();
});

test('compatibility copy: a partial failure stays blocked and is repaired; a failed barrier writes nothing; an older tab writing meanwhile is kept as a conflict',{timeout:120000},async()=>{
 const context=await browser.newContext(),page=await seeded(context);await page.evaluate(failing);await page.evaluate(()=>start());
 const partial=await page.evaluate(async()=>{s.close();await start({storage:failing(k=>k==='rubik-review-v1')});s.storage.setItem('rubik-review-v1','{"r":2}');await s.flush();return {mirror:s.state().mirror,blocked:localStorage.getItem('rubik-sota-project-library-v1')===P.TOMBSTONE};});
 assert.equal(partial.mirror.ok,false);assert.equal(partial.mirror.blocked,true);assert.equal(partial.blocked,true);
 assert.equal((await page.evaluate(async()=>{s.close();return start();})).mirror.ok,true,'repaired at the next start');
 const before=await page.evaluate(()=>lsSnapshot());
 const barrier=await page.evaluate(async()=>{s.close();await start({storage:failing((k,v)=>v===P.TOMBSTONE)});s.storage.setItem(BUDGET,'{"b":3}');await s.flush();const st=s.state();return {status:st.status,mirror:st.mirror};});
 assert.equal(barrier.status,'saved');assert.equal(barrier.mirror.ok,false);assert.equal(barrier.mirror.blocked,false);assert.match(barrier.mirror.message,/no abras una versión anterior/);
 assert.deepEqual(await page.evaluate(()=>lsSnapshot()),before,'nothing written: localStorage stays one single revision');
 const old=await page.evaluate(async()=>{s.close();await start();localStorage.setItem(BUDGET,'{"de":"versión anterior"}');s.storage.setItem('rubik-review-v1','{"r":4}');await s.flush();
  const st=s.state(),a=await authority();return {kept:a.conflicts.find(c=>c.id===st.mirror.conflictId)?.docs[BUDGET],ls:localStorage.getItem(BUDGET),auth:a.docs[BUDGET]};});
 assert.equal(old.kept,'{"de":"versión anterior"}');assert.equal(old.ls,old.auth);
 await context.close();
});

async function openEditor(context){
 const page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/');
 await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
 page.errors=errors;
 return page;
}
const downloadJson=async(page,selector)=>{
 const [,download]=await Promise.all([page.locator(selector).click(),page.waitForEvent('download')]);
 return JSON.parse(await fs.readFile(await download.path(),'utf8'));
};

test('editor F0.2b: five migrated keys, pending vs confirmed, JSON copy, inter-tab conflict and recovery',{timeout:120000},async t=>{
 const start=Date.now(),phase=label=>t.diagnostic((Date.now()-start)+' ms · '+label);
 // This persistence test does not exercise motion. Firefox retains the hidden menu's CSS animation as running.
 const ctx=await browser.newContext({acceptDownloads:true,reducedMotion:'reduce',viewport:{width:1440,height:900}});try{
  phase('migrate five seeded keys and open both editors');
  const seed=await open(ctx);
  const originals=await seed.evaluate(()=>{
   const project=FloorPlanCore.initial(),lib=FloorPlanLibrary.load(localStorage,project);
   lib.save(project);
   localStorage.setItem(P.KEYS[0],JSON.stringify(project));
   localStorage.setItem(P.KEYS[2],JSON.stringify({[project.id]:FloorPlanBudget.createBudget({id:'bud_'+project.id,subject:{type:'project',id:project.id},title:'Presupuesto local'})}));
   localStorage.setItem(P.KEYS[3],JSON.stringify({[project.id]:{draft:null,received:[],answers:[]}}));
   localStorage.setItem(P.KEYS[4],JSON.stringify({schema:'rubik-sota.construction-record',schemaVersion:'0.1.0',records:{}}));
   localStorage.setItem('rubik-sota-assistant-test','solo preferencia');
   return Object.fromEntries(P.KEYS.map(k=>[k,localStorage.getItem(k)]));
  });
  const a=await openEditor(ctx),b=await openEditor(ctx);
  assert.deepEqual(await seed.evaluate(async()=> (await authority()).docs),originals);
  assert.equal(await a.evaluate(()=>FloorPlanApp.storage.getItem('rubik-sota-assistant-test')),'solo preferencia');
  for(const page of [a,b])await require('./editor-fixture.cjs')(page);
  phase('acquire the Web Lock and stage revision A');
  await a.evaluate(async()=>{
   await new Promise(resolve=>navigator.locks.request(FloorPlanPersistence.LOCK,()=>new Promise(release=>{window.releaseSave=release;resolve();})));
   FloorPlanApp.applyExtension(project=>{project.name='Revisión A';return {ok:true,project};});
  });
  assert.equal(await a.locator('#persistenceStatus').getAttribute('data-state'),'pending');
  phase('download project JSON with the transaction blocked');
  const json=await downloadJson(a,'#exportJsonQuick');
  assert.equal(json.name,'Revisión A');
  assert.equal((await seed.evaluate(()=>authority())).revision,1,'the download does not confirm the blocked transaction');
  phase('release the Web Lock and confirm revision 2');
  await a.evaluate(()=>releaseSave());
  await a.waitForFunction(()=>FloorPlanApp.persistence.session.state().status==='saved');
  assert.equal((await seed.evaluate(()=>authority())).revision,2);
  phase('detect the newer revision and record the conflict');
  await b.waitForFunction(()=>FloorPlanApp.persistence.session.state().outdated);
  await b.evaluate(async()=>{
   FloorPlanApp.applyExtension(project=>{project.name='Revisión B';return {ok:true,project};});
   await FloorPlanApp.persistence.session.flush();
  });
  assert.equal(await b.locator('#persistenceStatus').getAttribute('data-state'),'conflict');
  const kept=await seed.evaluate(()=>authority());assert.equal(kept.revision,2);
  assert.equal(kept.conflicts.length,1);assert.equal(Object.keys(kept.conflicts[0].docs).length,5);
  phase('download the emergency copy');
  await b.locator('#persistenceOpen').click();
  const copy=await downloadJson(b,'#persistenceDialog button:text-is("Exportar copia de emergencia")');
  assert.equal(copy.format,'rubik-sota.emergency');
  assert.equal(JSON.parse(copy.docs['rubik-sota-project-library-v1']).entries[0].project.name,'Revisión B');
  phase('accept recovery and wait for the reloaded editor');
  b.once('dialog',d=>d.accept());
  await Promise.all([
   b.waitForEvent('framenavigated',frame=>frame===b.mainFrame()),
   b.locator('#persistenceDialog button:text-is("Recuperar versión")').click(),
  ]);
  // The outgoing editor already has project B and revision 3. Check the newly bootstrapped document.
  await b.waitForFunction(()=>document.documentElement.dataset.editorReady==='true'
   &&window.FloorPlanApp?.project.name==='Revisión B'&&FloorPlanApp.persistence.session.state().revision===3);
  phase('verify the recovered and superseded revisions in IndexedDB');
  const recovered=await seed.evaluate(()=>authority());
  assert.equal(recovered.conflicts.length,1);
  assert.equal(recovered.conflicts[0].reason,'superseded');
  assert.equal(JSON.parse(recovered.conflicts[0].docs['rubik-sota-project-library-v1']).entries[0].project.name,'Revisión A');
  assert.deepEqual([...a.errors,...b.errors],[]);
 }finally{
  phase('close browser context');
  await ctx.close();
  phase('browser context closed');
 }
});

test('editor F0.2b: a confirmed read/write handoff to Evolución survives stale localStorage',{timeout:120000},async()=>{
 const ctx=await browser.newContext({viewport:{width:1440,height:900}});try{
  const page=await openEditor(ctx);
  if(await page.locator('#welcomeDialog').evaluate(d=>d.open))await page.locator('#welcomeExample').click();
  await page.evaluate(()=>FloorPlanConstructionUI.openEvolution());
  const frame=page.frameLocator('#evolutionFrame');
  await frame.locator('body.ready').waitFor();
  const source=await frame.locator('body').evaluate(()=>({name:__ft3dSource.input.project.name,subject:__ft3dSource.subject,entry:__ft3dSource.entry.id}));
  assert.equal(source.subject.id,await page.evaluate(()=>FloorPlanApp.project.id));
  assert.equal(source.entry,await page.evaluate(()=>FloorPlanApp.entryId));
  assert.equal(await frame.locator('body').evaluate(async()=>{
   const s=__ft3dSource;
   const out={id:'dlv_f0_2b_browser',project:{name:s.input.project.name}};
   await s.recordDelivery('presentación',out);
   await s.recordDelivery('presentación',out);
   return true;
  }),true);
  const stored=await page.evaluate(async()=>{
   const p=FloorPlanApp.persistence.session,{docs}=await FloorPlanPersistence.load(p.db),key='rubik-construction-v1';
   return {saved:p.state().status,actual:JSON.parse(docs.get(key)),same:docs.get(key)===FloorPlanApp.storage.getItem(key)};
  });
  assert.equal(stored.saved,'saved');assert.equal(stored.same,true);
  assert.equal(Object.values(stored.actual.records)[0].deliveries[0].id,'dlv_f0_2b_browser');
  const standalone=await ctx.newPage();
  const href=await frame.locator('body').evaluate(()=>location.href);
  // A partial compatibility copy cannot become the source for an already-open parent session.
  await page.evaluate(()=>localStorage.setItem(FloorPlanLibrary.KEY,FloorPlanPersistence.TOMBSTONE));
  await standalone.goto(href);await standalone.locator('body.ready').waitFor();
  assert.equal(await standalone.evaluate(()=>__ft3dSource.entry?.id),source.entry);
  await standalone.evaluate(async()=>{
   const src=__ft3dSource;
   const message={id:'dlv_f0_2b_independent',project:{name:src.input.project.name}};
   await src.recordDelivery('presentación',message);
   const {revision}=await FloorPlanPersistence.readConfirmed();
   await src.recordDelivery('presentación',message);
   if((await FloorPlanPersistence.readConfirmed()).revision!==revision)throw Error('un reintento no crea una revisión');
  });
  assert.deepEqual(await standalone.evaluate(async()=>{
   const saved=JSON.parse((await FloorPlanPersistence.readConfirmed()).docs.get('rubik-construction-v1'));
   return Object.values(saved.records)[0].deliveries.map(d=>d.id);
  }),['dlv_f0_2b_browser','dlv_f0_2b_independent']);
  assert.deepEqual(page.errors,[]);
 }finally{await ctx.close();}
});

test('F0.2b an explicit save can request persistence after this tab autosaved a confirmed revision',{timeout:120000},async()=>{
 const ctx=await browser.newContext();try{
  const page=await seeded(ctx);
  await page.evaluate(async()=>{
   window.permissionRequests=0;
   Object.defineProperty(navigator,'storage',{value:{persisted:async()=>false,persist:async()=>{permissionRequests++;return true;}}});
   await start();
   const button=document.createElement('button');button.id='saveConfirmed';button.textContent='Guardar';
   button.onclick=userEvent=>{window.confirmed=s.flush({userEvent,confirmExisting:true});};
   document.body.append(button);
  });
  await page.locator('#saveConfirmed').click();await page.evaluate(()=>confirmed);
  assert.equal(await page.evaluate(()=>permissionRequests),0,'migration alone does not grant a request');
  await page.evaluate(async()=>{s.storage.setItem(BUDGET,'{"autosave":true}');await s.flush();});
  assert.equal(await page.evaluate(()=>permissionRequests),0,'autosave alone never asks');
  await page.locator('#saveConfirmed').click();
  await page.waitForFunction(()=>permissionRequests===1);
  assert.equal((await page.evaluate(()=>authority())).revision,2,'confirmation does not write a second revision');
 }finally{await ctx.close();}
});

test('F0.2b concurrent migration without Web Locks cannot reset a committed revision',{timeout:120000},async()=>{
 const ctx=await browser.newContext();try{
  const a=await seeded(ctx),b=await open(ctx);
  await a.evaluate(()=>{window.migrationA=start({locks:null,hooks:{afterCopy:()=>new Promise(resolve=>{window.finishMigration=resolve;})}});});
  await a.waitForFunction(()=>window.finishMigration);
  await b.evaluate(async()=>{
   await start({locks:null});
   s.storage.setItem(BUDGET,'{"confirmed":2}');
   const state=await s.flush();
   if(state.status!=='saved'||state.revision!==2||!state.mirror.blocked)throw Error(JSON.stringify(state));
  });
  await a.evaluate(()=>finishMigration());
  assert.equal((await a.evaluate(()=>migrationA)).revision,2);
  assert.equal((await a.evaluate(()=>authority())).docs[BUDGET],'{"confirmed":2}');
  assert.equal(await a.evaluate(()=>localStorage.getItem(FloorPlanLibrary.KEY)),await a.evaluate(()=>P.TOMBSTONE));
 }finally{await ctx.close();}
});

test('F0.2b confirmed reader is read-only before migration and the editor fails closed if IndexedDB is unavailable',{timeout:120000},async()=>{
 const ctx=await browser.newContext();try{
  const legacy=await seeded(ctx);
  const before=await legacy.evaluate(()=>lsSnapshot());
  await legacy.evaluate(async()=>{
   try{await P.readConfirmed();throw Error('unexpected authority');}
   catch(e){if(e.code!=='authority-missing')throw e;}
  });
  assert.deepEqual(await legacy.evaluate(()=>lsSnapshot()),before);
  assert.equal(await legacy.evaluate(async()=>typeof indexedDB.databases==='function'&&(await indexedDB.databases()).some(x=>x.name===P.DB)),false);
  const page=await ctx.newPage();await page.addInitScript(()=>{indexedDB.open=()=>{throw new DOMException('blocked','SecurityError');};});
  await page.goto(origin+'/');
  await page.locator('#persistenceDialog[open]').waitFor();
  assert.match(await page.locator('#persistenceDialog').innerText(),/No se ha abierto el editor/);
  assert.equal(await page.evaluate(()=>!!window.FloorPlanApp),false);
  assert.deepEqual(await legacy.evaluate(()=>lsSnapshot()),before);
 }finally{await ctx.close();}
});

test('F0.2b default, client preview and synthetic demos leave the professional database closed',{timeout:120000},async()=>{
 const ctx=await browser.newContext();try{
  const legacy=await ctx.newPage();
  await legacy.goto(origin.replace('f0-2b.localhost','127.0.0.1')+'/?f0=1');
  await legacy.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
  assert.equal(await legacy.evaluate(()=>FloorPlanApp.persistence.session),null);
  for(const suffix of ['/?entrega=vista-previa','/?demo=dibujo-vivo','/evolucion/?demo=obra']){
   const p=await ctx.newPage();const attempts=[];
   await p.exposeFunction('recordProfessionalOpen',name=>attempts.push(name));
   await p.addInitScript(()=>{const open=indexedDB.open.bind(indexedDB);indexedDB.open=(name,...rest)=>{
    if(name==='rubik-sota-persistence-v1')void recordProfessionalOpen(name);
    return open(name,...rest);
   };});
   await p.goto(origin+suffix);
   await p.waitForFunction(()=>document.documentElement.dataset.editorReady==='true'||document.body.classList.contains('ready'));
   assert.deepEqual(attempts,[]);
   assert.equal(await p.evaluate(async()=>typeof indexedDB.databases==='function'&&(await indexedDB.databases()).some(x=>x.name==='rubik-sota-persistence-v1')),false);
   await p.close();
  }
 }finally{await ctx.close();}
});

test('F0.2b portable building includes exact per-level images, budget and review; interruption after staging retains the journal',{timeout:120000},async()=>{
 // WebKit's temporary contexts on Windows reject Blob writes. Exercise the normal disk-backed store.
 const profiles=[];
 async function context(){
  if(process.env.F0_BROWSER!=='webkit')return browser.newContext();
  const dir=await fs.mkdtemp(path.join(require('node:os').tmpdir(),'rubik-f0-webkit-'));
  profiles.push(dir);return playwright.webkit.launchPersistentContext(dir);
 }
 const create=await context(),restore=await context();try{
  const source=await open(create),dest=await open(restore),{building,bytesFor}=F.build();
  const images=building.levels.map(l=>bytesFor(l.project.sourceImages[0].id).toString('base64'));
  // IDs with one contained in the other expose substring matching, even though each ID is valid and distinct.
  building.levels[1].project.sourceImages[0].id=building.levels[0].project.sourceImages[0].id.slice(0,-2);
  const archive=await source.evaluate(async({building,images})=>{
   await start();
   const lib=FloorPlanLibrary.load(s.storage,FloorPlanCore.initial());
   for(const [i,l] of building.levels.entries()){
    const im=l.project.sourceImages[0],ref='img_exact_level_'+i;
    im.storage={kind:'local-browser',ref};
    await I.put([[ref,new Blob([unb64(images[i])],{type:im.mediaType})]]);
   }
   lib.addBuilding(building);
   const p=building.levels[0].project,id=p.id;
   s.storage.setItem(BUDGET,JSON.stringify({[id]:FloorPlanBudget.createBudget({id:'bud_'+id,subject:{type:'project',id},title:'Presupuesto portable'})}));
   s.storage.setItem('rubik-review-v1',JSON.stringify({[id]:{draft:null,received:[],answers:[{note:'Revisión portátil'}]}}));
   await s.flush();
   const {archive}=await X.pack(X.collect({library:lib,storage:s.storage}),{getImage:I.get});
   const parsed=await X.read(await archive.arrayBuffer());
   return {encoded:b64(await archive.arrayBuffer()),identity:await X.contentIdOf(parsed),digests:parsed.images.map(x=>[x.levelId,x.image.sha256])};
  },{building,images});
  assert.equal(archive.digests.length,2);
  assert.notEqual(archive.digests[0][1],archive.digests[1][1]);
  const report=await dest.evaluate(async({building,encoded})=>{
   await start();
   const lib=FloorPlanLibrary.load(s.storage,FloorPlanCore.initial());lib.addBuilding(building);await s.flush();
   const parsed=await X.read(unb64(encoded));
   const result=await X.restore(parsed,{library:lib,storage:s.storage,persistence:s,getImage:I.get,putImages:I.put,removeImages:I.remove,visible:lib.project(),copy:true});
   const repacked=await X.pack(X.collect({library:lib,storage:s.storage}),{getImage:I.get});
   const again=await X.read(await repacked.archive.arrayBuffer());
   const before=await authority();
   const competitor=await P.session();
   const putImages=async entries=>{await I.put(entries);competitor.storage.setItem('rubik-construction-v1','{"competitor":true}');await competitor.flush();};
   let error;
   try{await X.restore(parsed,{library:lib,storage:s.storage,persistence:s,getImage:I.get,putImages,removeImages:I.remove,visible:lib.project(),copy:true});}
   catch(e){error=e.code;}
   const after=await authority();
   const journal=Object.keys(localStorage).filter(k=>k.startsWith(X.JOURNAL+':'));
   const retained=(await Promise.all(journal.flatMap(k=>JSON.parse(localStorage.getItem(k)).images).map(I.get))).every(Boolean);
   competitor.close();
   return {result,error,identity:await X.contentIdOf(again),digests:again.images.map(x=>[x.levelId,x.image.sha256]),
    beforeCount:JSON.parse(before.docs[FloorPlanLibrary.KEY]).entries.length,afterCount:JSON.parse(after.docs[FloorPlanLibrary.KEY]).entries.length,
    journal:journal.length,retained};
  },{building,encoded:archive.encoded});
  assert.equal(report.result.status,'restored');assert.equal(report.result.budgets,1);assert.equal(report.result.reviews,1);
  assert.equal(report.result.reidentified.length,2);
  assert.equal(report.identity,archive.identity);assert.deepEqual(report.digests,archive.digests);
  assert.equal(report.error,'restore-unconfirmed');assert.equal(report.beforeCount,report.afterCount);
  assert.equal(report.journal,1);assert.equal(report.retained,true);
 }finally{
  await create.close();await restore.close();
  for(const dir of profiles)await fs.rm(dir,{recursive:true,force:true});
 }
});
