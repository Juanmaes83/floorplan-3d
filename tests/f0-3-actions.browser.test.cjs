'use strict';
/* F0.3 · Acciones de persistencia (js/persistence-actions.js), AISLADAS. Chromium real con el CSS Perla del producto y los
   núcleos F0.2c reales (A0, v2, copia, migración) sobre datos SINTÉTICOS en bases con nombres propios (nunca las
   productivas). Se pulsa la interfaz como lo haría una persona: ratón y teclado, no llamadas directas. */
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');let server,browser,url,origin;
const PAGE=`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>acciones F0.3</title>
<link rel="stylesheet" href="/css/design-system.css">
<!-- Esta página es una pestaña legada (A0 con época 1) que ve la época 2 tras migrar: el aviso propio de A0 aparece como capa
     fija por encima de todo y TAPA los botones de F0.3 (hallazgo de integración: F0.3 sustituye a ese aviso, no se apila con
     él). Aquí se oculta solo para probar las acciones; la sustitución se hace en el corte de integración. -->
<style>#a0Banner{display:none}</style>
<script src="/js/schema-epoch.js"></script><script src="/js/local-images.js"></script><script src="/js/persistence-store.js"></script>
<script src="/js/store-v2.js"></script><script src="/js/store-v2-backup.js"></script><script src="/js/store-v2-migrate.js"></script>
<script src="/js/persistence-status-ui.js"></script><script src="/js/persistence-actions.js"></script>
<body><div id="slot"></div>
<script>
const S=FloorPlanStoreV2,M=FloorPlanStoreV2Migrate,B=FloorPlanStoreV2Backup,A=FloorPlanPersistenceActions,hex=n=>n.toString(16).padStart(64,'0'),mue=n=>'mue01/'+hex(n);
const N={persistence:'act-legacy-persistence',images:'act-legacy-images',v2:'act-store-v2'};
const del=n=>new Promise(r=>{const q=indexedDB.deleteDatabase(n);q.onsuccess=q.onerror=q.onblocked=()=>r();});
const project=(id,photos)=>({id,name:'Sintético '+id,sourceImages:[],objects:photos.map((k,i)=>({id:'obj_'+i})),
  extensions:{'x-mue01-furniture-photo':{version:1,items:photos.map((k,i)=>({objectId:'obj_'+i,photo:{imageKey:k}}))}}});
const blob=s=>new Blob([s],{type:'image/jpeg'});
window.consent={confirmed:true,scope:'private-complete'};window.N=N;window.mue=mue;
window.buildLegacy=async()=>{for(const n of [...Object.values(N),'act-restored','act-restored-2'])await del(n);localStorage.clear();FloorPlanSchemaEpoch._reset();
  const lib={version:1,activeId:'prj_a',entries:[{project:project('prj_a',[mue(1),mue(2)]),variants:[project('prj_a_v1',[mue(3)])]}]};
  const pdb=await FloorPlanPersistence.open({name:N.persistence});
  await new Promise(r=>{const t=pdb.transaction('docs','readwrite');t.objectStore('docs').put(JSON.stringify(lib),'rubik-sota-project-library-v1');t.oncomplete=r;});pdb.close();
  const idb=await new Promise(r=>{const q=indexedDB.open(N.images,1);q.onupgradeneeded=()=>q.result.createObjectStore('images');q.onsuccess=()=>r(q.result);});
  await new Promise(r=>{const t=idb.transaction('images','readwrite'),st=t.objectStore('images');for(const n of [1,2,3])st.put(blob('foto privada '+n),mue(n));t.oncomplete=r;});idb.close();};
window.src=()=>M.legacySource({persistence:N.persistence,images:N.images});
window.toV2=async()=>{const s=src(),pre=await M.prepare(s,{consent});return M.migrate({source:s,name:N.v2,tab:'A',preExport:pre,estimate:async()=>({quota:1e9,usage:0})});};
// Puertos de prueba: registran cada llamada; el comportamiento de cada uno se puede sustituir.
window.calls=[];window.downloads=[];window.pick=null;window.restoreName='act-restored';window.behaviour={};
const port=name=>async state=>{calls.push([name,state?.kind]);return behaviour[name]?.(state);};
window.ports=()=>({db:async()=>(window.v2db||=await S.open({name:N.v2})),source:src(),download:(b,n)=>downloads.push({blob:b,name:n}),
  pickFile:async()=>pick,restoreName:()=>restoreName,prepared:async pre=>{calls.push(['prepared',pre.fingerprint]);return behaviour.prepared?.(pre);},
  restored:async r=>{calls.push(['restored',r.name]);},
  saveNow:port('saveNow'),retry:port('retry'),reload:port('reload'),manageSpace:port('manageSpace'),postpone:port('postpone'),retryMigration:port('retryMigration'),reviewConflict:port('reviewConflict')});
window.start=kind=>{window.ctl=A.create({container:document.getElementById('slot'),ports:ports()});ctl.show({kind,vars:{reason:'motivo',why:''}});return ctl.state.kind;};
window.idle=async()=>{for(let i=0;i<400&&ctl.busy;i++)await new Promise(r=>setTimeout(r,25));return ctl.state;};
window.dbNames=async()=>(await indexedDB.databases()).map(d=>d.name);
</script></body>`;
before(async()=>{
  server=createServer(async(req,res)=>{try{const p=new URL(req.url,'http://l').pathname;if(p==='/t.html'){res.setHeader('content-type','text/html');return res.end(PAGE);}
    const f=path.resolve(root,'.'+p);if(!f.startsWith(root+path.sep))throw 0;res.setHeader('content-type',f.endsWith('.css')?'text/css':'text/javascript');res.end(await fs.readFile(f));}catch{res.statusCode=404;res.end();}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));origin=`http://127.0.0.1:${server.address().port}`;url=origin+'/t.html';
  browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox']});
});
after(async()=>{await browser?.close();await new Promise(r=>server.close(r));});
async function page({v2=true}={}){const ctx=await browser.newContext(),p=await ctx.newPage(),errors=[],external=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(!r.url().startsWith(origin))external.push(r.url());});
  await p.goto(url);await p.evaluate(async v2=>{await buildLegacy();if(v2)await toV2();},v2);return {ctx,p,errors,external};}
const kind=p=>p.evaluate(()=>idle().then(s=>s.kind));
const primary=p=>p.locator('.psui .btn.primary');

test('aislamiento: ninguna página del producto carga las acciones F0.3',async()=>{
  for(const f of (await fs.readdir(root)).filter(f=>f.endsWith('.html')))assert.doesNotMatch(await fs.readFile(path.join(root,f),'utf8'),/persistence-actions/,f);
});

test('ningún botón sin función: create() se niega a arrancar si falta un puerto y nombra cada acción pendiente',{timeout:60000},async()=>{
  const {ctx,p,errors}=await page({v2:false});
  try{
    const r=await p.evaluate(()=>{const all=new Set(Object.values(FloorPlanPersistenceUI.STATES).flatMap(d=>[d.primary,d.secondary,d.tertiary].filter(Boolean).map(a=>a[0])));
      let e;try{A.create({container:document.getElementById('slot'),ports:{}});}catch(x){e=x;}
      const full=A.create({container:document.getElementById('slot'),ports:ports()});
      const {reload,...partial}=ports();let e2;try{A.create({container:document.getElementById('slot'),ports:partial});}catch(x){e2=x;}
      return {code:e?.code,missing:e?.missing,all:[...all],builtIn:A.BUILT_IN,ports:A.PORTS,full:typeof full.run,e2:e2?.missing};});
    assert.equal(r.code,'ports-missing');assert.equal(r.full,'function');assert.deepEqual(r.e2,['reload (puerto reload)']);
    for(const a of r.all)assert.ok(r.builtIn.includes(a)||r.missing.some(m=>m.startsWith(a+' ')),a+': o la resuelve el módulo o se exige su puerto');
    for(const k of ['db','source','download','pickFile','restoreName'])assert.ok(r.missing.includes('puerto '+k),k);
    assert.deepEqual(errors,[]);
  }finally{await ctx.close();}
});

test('copia de emergencia desde «Esta pestaña ya no puede guardar»: consentimiento, una sola copia ante doble pulsación, comprobada, completa y el aviso de riesgo vuelve',{timeout:90000},async()=>{
  const {ctx,p,errors,external}=await page();
  try{
    await p.evaluate(()=>start('outdated'));
    await primary(p).click();assert.equal(await kind(p),'emergency-export');
    assert.equal(await primary(p).isDisabled(),true,'sin consentimiento no se puede descargar');
    assert.equal(await p.evaluate(()=>document.activeElement.className),'psui-consent','el foco va al consentimiento');
    assert.equal(await p.evaluate(()=>downloads.length),0);
    await p.keyboard.press('Space');
    // Doble pulsación: dos clics seguidos en la misma tarea → una sola copia.
    await p.evaluate(()=>{const b=document.querySelector('.psui .btn.primary');b.click();b.click();});
    assert.equal(await kind(p),'copy-ready');
    const r=await p.evaluate(async()=>{const d=downloads[0],v=await B.verify(d.blob),dry=await B.dryRun(d.blob),db=await ports().db();
      const keys=(await S.resourceKeys?.(db))||null;
      return {n:downloads.length,name:d.name,ok:v.ok,dry:dry.ok,counts:dry.counts,text:document.querySelector('.psui').textContent,
        focus:document.activeElement.dataset.action,role:document.querySelector('.psui').getAttribute('role'),keys};});
    assert.equal(r.n,1,'una sola copia');assert.match(r.name,/^rubik-copia-completa-\d{4}-\d{2}-\d{2}\.json$/);
    assert.equal(r.ok,true);assert.equal(r.dry,true);assert.equal(r.counts.photos,3,'las tres fotos privadas sintéticas');
    if(r.keys)assert.equal(r.counts.resources,r.keys.length,'todos los recursos de v2');
    assert.match(r.text,/3 de ellos fotos de muebles/);assert.match(r.text,/Huella [0-9a-f]{12}…/);assert.match(r.text,/carpeta de descargas/);
    assert.equal(r.role,'status');assert.equal(r.focus,'cancel','foco en «Entendido»');
    await p.keyboard.press('Enter');assert.equal(await kind(p),'outdated','«Entendido» devuelve el aviso de riesgo, que no se pierde');
    assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  }finally{await ctx.close();}
});

test('copia previa a la migración: nunca sin consentimiento; sale del almacén ANTERIOR y sirve como copia del paso 0',{timeout:90000},async()=>{
  const {ctx,p,errors}=await page({v2:false});
  try{
    await p.evaluate(()=>{behaviour.prepared=pre=>{window.pre=pre;return {kind:'migrating',vars:{step:1,steps:4}};};return start('pre-migration-copy');});
    await primary(p).click();
    assert.equal(await kind(p),'emergency-export','«Descargar la copia completa» pasa antes por la pantalla de consentimiento');
    assert.equal(await p.evaluate(()=>downloads.length),0,'ninguna copia privada sin consentimiento');
    await p.locator('.psui-consent').check();await primary(p).click();assert.equal(await kind(p),'copy-ready');
    const r=await p.evaluate(async()=>{const fp=(await src().fingerprint()).hash,m=await M.migrate({source:src(),name:N.v2,tab:'A',preExport:pre,estimate:async()=>({quota:1e9,usage:0})});
      return {n:downloads.length,name:downloads[0].name,same:downloads[0].blob===pre.blob,fp,prepared:calls.find(c=>c[0]==='prepared')?.[1],status:m.status,ok:(await B.verify(downloads[0].blob)).ok};});
    assert.equal(r.n,1);assert.match(r.name,/antes-de-actualizar/);assert.equal(r.same,true);assert.equal(r.ok,true);
    assert.equal(r.prepared,r.fp,'la copia corresponde al estado actual del almacén anterior');assert.ok(r.status,'la migración acepta esa copia como paso 0');
    await primary(p).click();assert.equal(await kind(p),'migrating','tras «Entendido» sigue el paso que indica quien integra');
    assert.deepEqual(errors,[]);
  }finally{await ctx.close();}
});

test('una copia que no supera la comprobación nunca se descarga: se explica y se ofrece reintentar o volver',{timeout:90000},async()=>{
  const {ctx,p,errors}=await page();
  try{
    // Un recurso dañado en el navegador (bytes que no coinciden con su huella).
    await p.evaluate(async()=>{const db=await ports().db(),k=mue(2);await new Promise(r=>{const t=db.transaction('resources','readwrite'),st=t.objectStore('resources'),q=st.get(k);
      q.onsuccess=()=>st.put({...q.result,bytes:new Blob(['alterado'],{type:'image/jpeg'})},k);t.oncomplete=r;});return start('v2-unreadable');});
    await p.locator('.psui [data-slot=secondary]').click();assert.equal(await kind(p),'emergency-export');
    await p.locator('.psui-consent').check();await primary(p).click();
    assert.equal(await kind(p),'copy-failed');
    const r=await p.evaluate(()=>({n:downloads.length,text:document.querySelector('.psui').textContent,role:document.querySelector('.psui').getAttribute('role')}));
    assert.equal(r.n,0,'nada descargado');assert.equal(r.role,'alert');assert.match(r.text,/ya está dañado/);assert.match(r.text,/no han cambiado/);
    await primary(p).click();assert.equal(await kind(p),'emergency-export','«Volver a intentarlo» vuelve al consentimiento');
    await p.locator('.psui [data-slot=secondary]').click();assert.equal(await kind(p),'v2-unreadable','«Cancelar» devuelve el aviso de partida');
    assert.deepEqual(errors,[]);
  }finally{await ctx.close();}
});

test('restaurar desde archivo: solo en una base NUEVA; una copia alterada o un destino existente se rechazan; la original no cambia',{timeout:120000},async()=>{
  const {ctx,p,errors}=await page();
  try{
    const before=await p.evaluate(async()=>{const db=await ports().db(),c=await B.create(db,{consent});window.good=c.blob;
      const a=JSON.parse(await c.blob.text()),k=Object.keys(a.files).find(x=>x.startsWith('resources/'));a.files[k].data=btoa('alterado');
      window.bad=new Blob([JSON.stringify(a)],{type:'application/json'});start('v2-unreadable');return c.manifestSha256;});
    // Sin archivo elegido: el aviso sigue igual.
    await p.locator('.psui [data-slot=tertiary]').click();assert.equal(await kind(p),'v2-unreadable');
    await p.evaluate(()=>{pick=bad;});await p.locator('.psui [data-slot=tertiary]').click();
    assert.equal(await kind(p),'restore-failed');
    let r=await p.evaluate(async()=>({text:document.querySelector('.psui').textContent,names:await dbNames()}));
    assert.match(r.text,/alterado|huella/);assert.ok(!r.names.includes('act-restored'),'una copia alterada no crea nada');
    await p.evaluate(()=>{pick=good;});await primary(p).click();assert.equal(await kind(p),'restored');
    r=await p.evaluate(async()=>{const db=await S.open({name:'act-restored'});try{const again=await B.create(db,{consent});
      return {text:document.querySelector('.psui').textContent,sha:(await B.create(await ports().db(),{consent})).manifestSha256,
        restoredEntries:JSON.parse(await again.blob.text()).manifest.entries.length,restoredCall:calls.find(c=>c[0]==='restored')?.[1]};}finally{db.close();}});
    assert.match(r.text,/3 de ellos fotos de muebles/);assert.match(r.text,/no se ha tocado/);assert.equal(r.restoredCall,'act-restored');
    assert.equal(r.sha,before,'la base original no ha cambiado');assert.ok(r.restoredEntries>0);
    // Un destino que ya existe no se sobrescribe.
    await primary(p).click();assert.equal(await kind(p),'v2-unreadable');
    await p.locator('.psui [data-slot=tertiary]').click();assert.equal(await kind(p),'restore-failed');
    assert.match(await p.locator('.psui').textContent(),/no se sobrescribe/);
    assert.deepEqual(errors,[]);
  }finally{await ctx.close();}
});

test('puertos del editor: cada botón llama al suyo; ningún fallo queda en silencio y el aviso de partida se recupera',{timeout:60000},async()=>{
  const {ctx,p,errors}=await page({v2:false});
  try{
    await p.evaluate(()=>{behaviour.saveNow=()=>({kind:'saving'});return start('pending');});
    await primary(p).click();assert.equal(await kind(p),'saving');
    await p.evaluate(()=>{behaviour.saveNow=()=>{throw new Error('disco lleno');};ctl.show({kind:'pending'});});
    await primary(p).click();assert.equal(await kind(p),'error');assert.match(await p.locator('.psui').textContent(),/disco lleno\./);
    await p.evaluate(()=>{behaviour.reload=()=>{throw new Error('el navegador bloqueó la recarga');};ctl.show({kind:'outdated'});});
    await p.locator('.psui [data-slot=secondary]').click();assert.equal(await kind(p),'action-failed');
    await primary(p).click();assert.equal(await kind(p),'outdated','«Volver al aviso» recupera el aviso de riesgo');
    await p.evaluate(()=>{behaviour.retryMigration=()=>{throw new M.MigrationError('legacy-writer-active','x');};ctl.show({kind:'migration-stopped',vars:{reason:'r',why:'w'}});});
    await primary(p).click();assert.equal(await kind(p),'migration-stopped');assert.match(await p.locator('.psui').textContent(),/Cierra las demás pestañas/);
    await p.evaluate(()=>ctl.show({kind:'conflict'}));await primary(p).click();await kind(p);
    await p.evaluate(()=>ctl.show({kind:'quota',vars:{available:'1 MB',needed:'2 MB'}}));await primary(p).click();await kind(p);
    await p.evaluate(()=>ctl.show({kind:'pre-migration-copy'}));await p.locator('.psui [data-slot=secondary]').click();await kind(p);
    const c=await p.evaluate(()=>calls.map(x=>x.join(':')));
    assert.deepEqual(c,['saveNow:pending','saveNow:pending','reload:outdated','retryMigration:migration-stopped','reviewConflict:conflict','manageSpace:quota','postpone:pre-migration-copy']);
    assert.deepEqual(errors,[]);
  }finally{await ctx.close();}
});
