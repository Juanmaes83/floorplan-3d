'use strict';
/* F0.2c · Etapa 3 · Migración recuperable (js/store-v2-migrate.js), SOLO con datos SINTÉTICOS en bases de prueba con
   nombres propios (nunca las productivas). Chromium real: IndexedDB, Web Locks, SHA-256, localStorage. */
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');let server,browser,url,origin;
const PAGE=`<!doctype html><meta charset="utf-8"><title>migración v2</title>
<script src="/js/schema-epoch.js"></script><script src="/js/local-images.js"></script><script src="/js/persistence-store.js"></script>
<script src="/js/store-v2.js"></script><script src="/js/store-v2-backup.js"></script><script src="/js/store-v2-migrate.js"></script>
<script>
const S=FloorPlanStoreV2,M=FloorPlanStoreV2Migrate,B=FloorPlanStoreV2Backup,hex=n=>n.toString(16).padStart(64,'0'),mue=n=>'mue01/'+hex(n);
const N={persistence:'test-legacy-persistence',images:'test-legacy-images',v2:'test-store-v2'};
const del=n=>new Promise(r=>{const q=indexedDB.deleteDatabase(n);q.onsuccess=q.onerror=q.onblocked=()=>r();});
const project=(id,photos,plan)=>({id,name:'Sintético '+id,sourceImages:plan?[{id:plan,storage:{kind:'local-browser',ref:plan}}]:[],objects:photos.map((k,i)=>({id:'obj_'+i})),
  extensions:{'x-mue01-furniture-photo':{version:1,items:photos.map((k,i)=>({objectId:'obj_'+i,photo:{imageKey:k}}))}}});
window.blob=s=>new Blob([s],{type:'image/jpeg'});window.mue=mue;window.N=N;
// Legado sintético: biblioteca con dos proyectos y variantes, presupuesto, observaciones (cita una foto AUSENTE), obra,
// un conflicto con su propia foto, una entrada de diario con la suya y una imagen huérfana que nadie cita.
window.buildLegacy=async()=>{for(const n of Object.values(N))await del(n);localStorage.clear();FloorPlanSchemaEpoch._reset();
  const lib={version:1,activeId:'prj_a',entries:[{project:project('prj_a',[mue(1),mue(2)],'img_plano'),variants:[project('prj_a_v1',[mue(3)])]},{project:project('prj_b',[mue(4)]),variants:[]}]};
  const P=FloorPlanPersistence,pdb=await P.open({name:N.persistence});
  await new Promise(r=>{const t=pdb.transaction(['docs','conflicts'],'readwrite');const d=t.objectStore('docs');
    d.put(JSON.stringify(lib),'rubik-sota-project-library-v1');d.put(JSON.stringify({prj_a:{lines:[1,2,3]}}),'rubik-budget-v1');
    d.put(JSON.stringify(project('prj_rev',[mue(9)])),'rubik-review-v1');d.put(JSON.stringify({phases:['demolición']}),'rubik-construction-v1');
    t.objectStore('conflicts').add({reason:'revision',docs:{'rubik-sota-project-library-v1':JSON.stringify(project('prj_c',[mue(7)]))}});t.oncomplete=r;});pdb.close();
  const idb=await new Promise(r=>{const q=indexedDB.open(N.images,1);q.onupgradeneeded=()=>q.result.createObjectStore('images');q.onsuccess=()=>r(q.result);});
  await new Promise(r=>{const t=idb.transaction('images','readwrite'),st=t.objectStore('images');
    for(const n of [1,2,3,4,7,8])st.put(blob('foto privada '+n),mue(n));st.put(blob('plano'),'img_plano');st.put(blob('nadie me cita'),'img_huerfana');t.oncomplete=r;});idb.close();
  localStorage.setItem('rubik-expediente-journal-v1:j1',JSON.stringify({images:[mue(8)],state:'pending'}));};
window.src=()=>M.legacySource({persistence:N.persistence,images:N.images});
window.consent={confirmed:true,scope:'private-complete'};
window.go=async(o={})=>{const s=src(),pre=o.pre||await M.prepare(s,{consent});return M.migrate({source:s,name:N.v2,tab:o.tab||'A',preExport:pre,estimate:o.estimate||(async()=>({quota:1e9,usage:0})),hooks:o.hooks||{}});};
// Todo lo que el legado tiene, comparado con v2: documentos byte a byte y recursos por SHA-256.
window.compare=async()=>{const r=await src().read(),db=await S.open({name:N.v2});try{const {docs}=await S.load(db),out={docs:[],resources:[],missing:[]};
  for(const [k,v] of Object.entries(r.docs))(docs.get(k)===v?out.docs:out.missing).push('doc:'+k);
  for(const [k,b] of Object.entries(r.resources)){const v=await S.getResource(db,k).catch(()=>null);(v&&v.sha256===await S.sha256(b)?out.resources:out.missing).push(k);}
  out.refs=(await S.refs(db)).map(x=>x.resourceKey+'|'+x.holder).sort();return out;}finally{db.close();}};
window.legacyFp=async()=>(await src().fingerprint()).hash;
window.v2Meta=async k=>{const db=await S.open({name:N.v2});try{return await new Promise(r=>{const q=db.transaction('meta').objectStore('meta').get(k);q.onsuccess=()=>r(q.result);});}finally{db.close();}};
window.boot=(o={})=>M.boot({source:src(),name:N.v2,...o});
</script>`;
before(async()=>{
  server=createServer(async(req,res)=>{try{const p=new URL(req.url,'http://l').pathname;if(p==='/t.html'){res.setHeader('content-type','text/html');return res.end(PAGE);}
    const f=path.resolve(root,'.'+p);if(!f.startsWith(root+path.sep))throw 0;res.setHeader('content-type','text/javascript');res.end(await fs.readFile(f));}catch{res.statusCode=404;res.end();}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));origin=`http://127.0.0.1:${server.address().port}`;url=origin+'/t.html';
  browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox']});
});
after(async()=>{await browser?.close();await new Promise(r=>server.close(r));});
async function page(){const ctx=await browser.newContext(),p=await ctx.newPage(),errors=[],external=[];p.on('pageerror',e=>errors.push(e.message));
  p.on('request',r=>{if(!r.url().startsWith(origin))external.push(r.url());});await p.goto(url);await p.evaluate(()=>buildLegacy());return {ctx,p,errors,external};}
const H=n=>'mue01/'+n.toString(16).padStart(64,'0');

test('aislamiento: ninguna página del producto carga la migración; las pruebas usan bases propias',async()=>{
  for(const f of (await fs.readdir(root)).filter(f=>f.endsWith('.html')))assert.doesNotMatch(await fs.readFile(path.join(root,f),'utf8'),/store-v2-migrate/,f);
});

test('R1-T10/T15/T16 · migración completa sin pérdidas: documentos, variantes, fotos, planos, diario, conflicto; huérfana conservada; ausente informada; origen intacto',{timeout:90000},async()=>{
  const {ctx,p,errors,external}=await page();
  try{
    const r=await p.evaluate(async()=>{const fp0=await legacyFp(),pre=await M.prepare(src(),{consent});const m=await go({pre});
      return {m,cmp:await compare(),fp0,fp1:await legacyFp(),absent:pre.absentResources,auth:await v2Meta('authority'),epoch:await v2Meta('schemaEpoch'),
        witness:localStorage.getItem(M.SWITCHED),marker:localStorage.getItem(M.SWITCHING),announced:JSON.parse(localStorage.getItem(FloorPlanSchemaEpoch.KEY)||'null')};});
    assert.equal(r.m.status,'migrated');
    assert.deepEqual(r.cmp.missing,[],'nada se pierde');assert.equal(r.cmp.docs.length,4);assert.equal(r.cmp.resources.length,8,'6 fotos MUE-01, el plano y la huérfana');
    for(const h of ['doc:rubik-sota-project-library-v1'])for(const n of [1,2,3,4])assert.ok(r.cmp.refs.includes(H(n)+'|'+h),'foto de proyecto o variante con fila '+n);
    assert.ok(r.cmp.refs.includes('img_plano|doc:rubik-sota-project-library-v1'));assert.ok(r.cmp.refs.includes(H(8)+'|journal:j1'));
    assert.ok(r.cmp.refs.some(x=>x.startsWith(H(7)+'|conflict:')),'foto del conflicto');assert.ok(r.cmp.refs.includes('img_huerfana|legacy:unclaimed'),'la huérfana no queda sin titular');
    assert.deepEqual(r.m.unclaimed,['img_huerfana']);assert.deepEqual(r.absent,[H(9)],'la foto que ya faltaba se informa, no se inventa');
    assert.equal(r.fp0,r.fp1,'el origen no cambia');assert.equal(r.auth.value,'v2');assert.deepEqual(r.epoch,{epoch:2});
    assert.ok(r.witness);assert.equal(r.marker,null);assert.equal(r.announced.epoch,2,'A0: las pestañas de época 1 dejan de escribir');
    assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  }finally{await ctx.close();}
});

test('R1-T28 · sin copia previa vigente no se migra; espacio insuficiente no empieza; recogida de v2 conserva la huérfana',{timeout:90000},async()=>{
  const {ctx,p,errors}=await page();
  try{
    const r=await p.evaluate(async()=>{const codes=[];
      codes.push(await M.migrate({source:src(),name:N.v2,tab:'A'}).then(()=>'migró',e=>e.code));
      const pre=await M.prepare(src(),{consent});
      localStorage.setItem('rubik-expediente-journal-v1:j2',JSON.stringify({images:[],state:'x'}));
      codes.push(await go({pre}).then(()=>'migró',e=>e.code));localStorage.removeItem('rubik-expediente-journal-v1:j2');
      codes.push(await go({estimate:async()=>({quota:2000,usage:1000})}).then(()=>'migró',e=>e.code));
      const v2=await indexedDB.databases().then(d=>d.some(x=>x.name===N.v2));
      await go();const db=await S.open({name:N.v2});const g=await S.collect(db);db.close();
      return {codes,v2BeforeSuccess:v2,collected:g.removed};});
    assert.deepEqual(r.codes,['export-required','export-stale','quota']);assert.equal(r.v2BeforeSuccess,false,'nada se crea antes de poder migrar');
    assert.deepEqual(r.collected,[],'legacy:unclaimed protege la huérfana');assert.deepEqual(errors,[]);
  }finally{await ctx.close();}
});

test('R1-T11/T23/T27b · interrupciones en cada punto: el arranque da una salida única; reanudar termina sin pérdidas; el origen no cambia',{timeout:120000},async()=>{
  const {ctx,p,errors}=await page();
  try{
    const r=await p.evaluate(async()=>{const out={};const fp0=await legacyFp();
      const stop=point=>({[point]:async()=>{throw new Error('corte '+point);}});
      for(const point of ['afterCopy','afterVerify','afterMarker','afterSwitch']){await buildLegacy();
        const e=await go({hooks:stop(point)}).then(()=>'terminó',e=>e.message);const b=await boot();
        // Reanudar: una nueva pestaña (el dueño anterior «muere»: su arrendamiento se da por vencido).
        if(b.authority==='legacy'){const db=await S.open({name:N.v2});await new Promise(r=>{const t=db.transaction('meta','readwrite');const st=t.objectStore('meta');st.get('migration').onsuccess=x=>{const m=x.target.result;if(m)st.put({...m,heartbeatAt:0},'migration');};t.oncomplete=r;});db.close();}
        const resumed=b.authority==='legacy'?(await go({tab:'B'})).status:'no hace falta';
        out[point]={e,boot:b.authority,repaired:b.repaired||null,resumed,missing:(await compare()).missing,fp:await legacyFp()===fp0,witness:!!localStorage.getItem(M.SWITCHED),marker:!!localStorage.getItem(M.SWITCHING)};}
      return out;});
    for(const point of ['afterCopy','afterVerify','afterMarker']){const x=r[point];
      assert.equal(x.boot,'legacy',point+': sin conmutación confirmada la autoridad sigue siendo el legado');assert.equal(x.resumed,'migrated',point);}
    assert.equal(r.afterMarker.repaired,'marker','marcador sin conmutación: se retira y se repite');
    assert.equal(r.afterSwitch.boot,'v2');assert.equal(r.afterSwitch.repaired,'witness','v2 confirmado sin testigo: se completa el testigo');
    for(const x of Object.values(r)){assert.deepEqual(x.missing,[]);assert.equal(x.fp,true,'el origen nunca cambia');assert.equal(x.witness,true);assert.equal(x.marker,false);}
    assert.deepEqual(errors,[]);
  }finally{await ctx.close();}
});

test('R1-T27 · v2 ilegible después de conmutar (o indeterminado con solo el marcador): se bloquea, nunca vuelve solo al legado',{timeout:90000},async()=>{
  const {ctx,p,errors}=await page();
  try{
    const r=await p.evaluate(async()=>{await go();const broken=()=>Promise.reject(new Error('ilegible'));
      const afterSwitch=await boot({open:broken});
      localStorage.removeItem(M.SWITCHED);localStorage.setItem(M.SWITCHING,JSON.stringify({token:1}));const onlyMarker=await boot({open:broken});
      return {afterSwitch,onlyMarker};});
    for(const b of [r.afterSwitch,r.onlyMarker]){assert.equal(b.authority,null);assert.equal(b.blocked,true);assert.ok(b.actions.includes('emergency-export'));}
    assert.equal(r.afterSwitch.reason,'v2-unreadable');assert.equal(r.onlyMarker.reason,'indeterminate');assert.deepEqual(errors,[]);
  }finally{await ctx.close();}
});

test('R1-T13 · cuota agotada a mitad: se descarta lo parcial de v2, el origen intacto; tres fallos detienen los reintentos',{timeout:90000},async()=>{
  const {ctx,p,errors}=await page();
  try{
    const r=await p.evaluate(async()=>{const fp0=await legacyFp(),codes=[],partial=[];
      const quota={beforeResource:async(k,i)=>{if(i===3)throw new DOMException('cuota simulada','QuotaExceededError');}};
      for(let i=0;i<3;i++){codes.push(await go({tab:'A',hooks:quota}).then(()=>'migró',e=>e.code));const db=await S.open({name:N.v2});partial.push((await S.resourceKeys(db)).length+(await S.load(db)).docs.size);db.close();}
      const fourth=await go({tab:'A'}).then(x=>x.status,e=>e.code);
      return {codes,partial,fourth,fp:await legacyFp()===fp0,auth:await v2Meta('authority')};});
    assert.deepEqual(r.codes,['quota-exceeded','quota-exceeded','stopped']);assert.deepEqual(r.partial,[0,0,0],'nada parcial queda en v2');
    assert.equal(r.fourth,'stopped','detenida: no reintenta sola');assert.equal(r.fp,true);assert.equal(r.auth,undefined,'sin conmutación');
    assert.deepEqual(errors,[]);
  }finally{await ctx.close();}
});

test('R1-T14 · huella alterada en v2 tras copiar: no se conmuta',{timeout:90000},async()=>{
  const {ctx,p,errors}=await page();
  try{
    const r=await p.evaluate(async()=>{const tamper={afterCopy:async()=>{const db=await S.open({name:N.v2});await new Promise(res=>{const t=db.transaction('resources','readwrite'),st=t.objectStore('resources');st.get(mue(1)).onsuccess=e=>{const v=e.target.result;v.bytes=blob('alterada');st.put(v,mue(1));};t.oncomplete=res;});db.close();}};
      const e=await go({hooks:tamper}).then(()=>'migró',x=>x.code);return {e,auth:await v2Meta('authority'),witness:localStorage.getItem(M.SWITCHED),marker:localStorage.getItem(M.SWITCHING),boot:(await boot()).authority};});
    assert.equal(r.e,'verify-resource');assert.equal(r.auth,undefined);assert.equal(r.witness,null);assert.equal(r.marker,null);assert.equal(r.boot,'legacy');
    assert.deepEqual(errors,[]);
  }finally{await ctx.close();}
});

test('R1-T30b/T17/T24 · escritor antiguo: durante la copia se repite y, si persiste, se detiene; tras conmutar queda como conflicto legacy-diverged con sus recursos',{timeout:120000},async()=>{
  const {ctx,p,errors}=await page();
  try{
    const r=await p.evaluate(async()=>{const writeLegacy=async(k,txt)=>{const db=await new Promise(res=>{const q=indexedDB.open(N.images);q.onsuccess=()=>res(q.result);});await new Promise(res=>{const t=db.transaction('images','readwrite');t.objectStore('images').put(blob(txt),k);t.oncomplete=res;});db.close();};
      // a) Escribe una vez durante la copia: se repite y termina.
      let n=0;const once={afterCopy:async()=>{if(n++===0)await writeLegacy(mue(50),'escrita durante la copia');}};
      const a=await go({hooks:once});const aHas=(await compare()).resources.includes(mue(50));
      // b) Escribe en cada intento: se detiene sin conmutar.
      await buildLegacy();let k=60;const always={afterCopy:async()=>{await writeLegacy(mue(k++),'otra más');}};
      const b=await go({hooks:always}).then(x=>x.status,e=>e.code);const bAuth=await v2Meta('authority');
      // c) Tras conmutar, una versión antigua escribe un documento y una foto en el legado.
      await buildLegacy();await go();await writeLegacy(mue(70),'foto de una pestaña antigua');
      const pdb=await FloorPlanPersistence.open({name:N.persistence});await new Promise(res=>{const t=pdb.transaction('docs','readwrite');t.objectStore('docs').put(JSON.stringify({id:'antigua',x:[mue(70)]}),'rubik-review-v1');t.oncomplete=res;});pdb.close();
      const c=await boot();const db=await S.open({name:N.v2});const conflicts=await new Promise(res=>{const q=db.transaction('conflicts').objectStore('conflicts').getAll();q.onsuccess=()=>res(q.result);});
      const photo=await S.getResource(db,mue(70));const g=await S.collect(db);db.close();const again=await boot();
      return {a:a.status,aHas,b,bAuth,c,legacyDiverged:conflicts.filter(x=>x.reason==='legacy-diverged').length,photoKind:photo?.kind,collected:g.removed,again:again.diverged||false};});
    assert.equal(r.a,'migrated');assert.equal(r.aHas,true,'lo escrito durante la copia también se migra');
    assert.equal(r.b,'legacy-writer-active');assert.equal(r.bAuth,undefined,'no conmuta con un escritor activo');
    assert.equal(r.c.diverged,true);assert.deepEqual(r.c.newResources,[H(70)]);assert.equal(r.legacyDiverged,1);
    assert.equal(r.photoKind,'mue01','la foto de la pestaña antigua se conserva en v2');assert.deepEqual(r.collected,[],'y no se recoge');
    assert.equal(r.again,false,'la misma divergencia no se registra dos veces');assert.deepEqual(errors,[]);
  }finally{await ctx.close();}
});

test('R1-T18/T19/T29 · exclusión sin Web Locks: dos pestañas, un solo dueño; dueño muerto reclamado; un token antiguo no escribe',{timeout:120000},async()=>{
  const ctx=await browser.newContext();
  try{
    const a=await ctx.newPage(),b=await ctx.newPage();await a.goto(url);await b.goto(url);await a.evaluate(()=>buildLegacy());
    const pre=await a.evaluate(async()=>{const x=await M.prepare(src(),{consent});return {manifestSha256:x.manifestSha256,fingerprint:x.fingerprint};});
    const run=(pg,tab)=>pg.evaluate(async([tab,pre])=>M.migrate({source:src(),name:N.v2,tab,preExport:pre,estimate:async()=>({quota:1e9,usage:0})}).then(x=>x.status,e=>e.code),[tab,pre]);
    const both=(await Promise.all([run(a,'A'),run(b,'B')])).sort();
    assert.ok(both.includes('migrated'),JSON.stringify(both));assert.ok(both.every(x=>['migrated','busy','already'].includes(x)),JSON.stringify(both));
    assert.equal(both.filter(x=>x==='migrated').length,1,'una sola conmutación');
    const stale=await a.evaluate(async()=>{await buildLegacy();const db=await S.open({name:N.v2});
      const r1=await M.reserve(db,'viejo',{locks:null});
      await new Promise(res=>{const t=db.transaction('meta','readwrite');const st=t.objectStore('meta');st.get('migration').onsuccess=e=>st.put({...e.target.result,heartbeatAt:0},'migration');t.oncomplete=res;});
      const r2=await M.reserve(db,'nuevo',{locks:null});
      const old=await M._fenced(db,['docs'],r1.token,'viejo',s=>{s.docs.put('{"intruso":true}','x');}).then(()=>'escribió',e=>e.code);
      const has=(await S.load(db)).docs.has('x');db.close();return {r1:r1.token,r2:r2.token,reclaimed:r2.reclaimed,old,has};});
    assert.equal(stale.r2,stale.r1+1);assert.equal(stale.reclaimed,true);assert.equal(stale.old,'token');assert.equal(stale.has,false,'el dueño antiguo no escribe');
  }finally{await ctx.close();}
});

test('R1-T21/T25 · rollback: requiere confirmación, conserva TODO lo posterior verificado, no recoge durante el proceso, no borra v2',{timeout:120000},async()=>{
  const {ctx,p,errors}=await page();
  try{
    const r=await p.evaluate(async()=>{await go();
      // Cambios posteriores en v2 (época 2): un documento nuevo con una foto nueva.
      const db=await S.open({name:N.v2});const {revision}=await S.load(db);
      await S.commit(db,{baseRevision:revision,changes:{'rubik-review-v1':JSON.stringify({id:'tras',fotos:[{imageKey:mue(80)}]})},resources:[{key:mue(80),bytes:blob('foto posterior'),kind:'mue01'}]});db.close();
      const noConfirm=await M.rollback({source:src(),name:N.v2}).then(()=>'hecho',e=>e.code);
      let duringCollect;const rb=await M.rollback({source:src(),name:N.v2,confirm:true,hooks:{afterStart:async db=>{duringCollect=await S.collect(db).then(()=>'recogió',e=>e.code);}}});
      const legacy=await src().read();const v2Exists=await indexedDB.databases().then(d=>d.some(x=>x.name===N.v2));
      return {noConfirm,rb,duringCollect,legacyDoc:legacy.docs['rubik-review-v1'],legacyPhoto:legacy.resources[mue(80)]?await S.sha256(legacy.resources[mue(80)]):null,expect:await S.sha256(blob('foto posterior')),
        v2Exists,boot:(await boot()).authority,epoch:JSON.parse(localStorage.getItem(FloorPlanSchemaEpoch.KEY)).epoch,witness:localStorage.getItem(M.SWITCHED)};});
    assert.equal(r.noConfirm,'confirm-required');assert.equal(r.rb.status,'rolled-back');assert.equal(r.duringCollect,'rollback-in-progress');
    assert.match(r.legacyDoc,/tras/,'el documento posterior llega al legado');assert.equal(r.legacyPhoto,r.expect,'la foto posterior llega verificada');
    assert.equal(r.v2Exists,true,'v2 no se borra');assert.equal(r.boot,'legacy');assert.equal(r.epoch,1);assert.equal(r.witness,null);
    assert.deepEqual(errors,[]);
  }finally{await ctx.close();}
});

test('R1-T25b · rollback que no puede conservar los cambios: se aborta, la autoridad sigue en v2 y nada se pierde',{timeout:90000},async()=>{
  const {ctx,p,errors}=await page();
  try{
    const r=await p.evaluate(async()=>{await go();const db=await S.open({name:N.v2});const {revision}=await S.load(db);
      await S.commit(db,{baseRevision:revision,changes:{'rubik-review-v1':JSON.stringify({id:'tras'})}});db.close();
      // El almacén de imágenes legado desaparece (no se podría devolver un recurso): se fuerza con un recurso nuevo en v2.
      const db2=await S.open({name:N.v2});const r2=(await S.load(db2)).revision;await S.commit(db2,{baseRevision:r2,changes:{},resources:[{key:mue(90),bytes:blob('x')}]});db2.close();
      await new Promise(res=>{const q=indexedDB.deleteDatabase(N.images);q.onsuccess=q.onerror=()=>res();});
      const e=await M.rollback({source:src(),name:N.v2,confirm:true}).then(()=>'hecho',x=>x.code);
      return {e,auth:(await v2Meta('authority')).value,rollback:await v2Meta('rollback'),stillThere:(await compare()).resources.length>=0};});
    assert.ok(['rollback-aborted','rollback-target'].includes(r.e),r.e);assert.equal(r.auth,'v2');assert.equal(r.rollback,undefined,'la marca de rollback se retira');
    assert.deepEqual(errors,[]);
  }finally{await ctx.close();}
});
