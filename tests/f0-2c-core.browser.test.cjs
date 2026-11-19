'use strict';
/* F0.2c · Etapa 1 · Núcleo de autoridad única transaccional (js/store-v2.js), AISLADO y con datos SINTÉTICOS.
   Chromium real con IndexedDB, Web Locks y SHA-256 reales, en una página de pruebas propia. Ninguna página del producto
   carga el núcleo, ni se abre o modifica ningún almacén existente. Pruebas R1-T30–T33 más integridad, época (A0) y
   concurrencia. */
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');let server,browser,url;
const PAGE=`<!doctype html><meta charset="utf-8"><title>store-v2</title>
<script src="/js/schema-epoch.js"></script><script src="/js/local-images.js"></script><script src="/js/store-v2.js"></script>
<script>
const S=FloorPlanStoreV2,hex=n=>n.toString(16).padStart(64,'0'),mue=n=>'mue01/'+hex(n);
window.fresh=async()=>{await new Promise(r=>{const q=indexedDB.deleteDatabase(S.DB);q.onsuccess=q.onerror=q.onblocked=()=>r();});return S.open();};
window.blob=s=>new Blob([s],{type:'image/jpeg'});
window.projectWith=(...keys)=>JSON.stringify({id:'prj_sint',name:'Sintético',objects:keys.map((k,i)=>({id:'obj_'+i})),
  extensions:{'x-mue01-furniture-photo':{version:1,items:keys.map((k,i)=>({objectId:'obj_'+i,photo:{imageKey:k}}))}}});
window.mue=mue;
</script>`;
before(async()=>{
  server=createServer(async(req,res)=>{try{const p=new URL(req.url,'http://l').pathname;if(p==='/t.html'){res.setHeader('content-type','text/html');return res.end(PAGE);}
    const f=path.resolve(root,'.'+p);if(!f.startsWith(root+path.sep))throw 0;res.setHeader('content-type','text/javascript');res.end(await fs.readFile(f));}catch{res.statusCode=404;res.end();}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/t.html`;
  browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox']});
});
after(async()=>{await browser?.close();await new Promise(r=>server.close(r));});
async function page(){const ctx=await browser.newContext(),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(url);return {ctx,p,errors};}

test('aislamiento: ninguna página del producto carga el núcleo v2',async()=>{
  for(const f of (await fs.readdir(root)).filter(f=>f.endsWith('.html')))assert.doesNotMatch(await fs.readFile(path.join(root,f),'utf8'),/store-v2/,f);
});

test('R1-T30 · confirmación atómica: documento, recurso y referencia juntos; un fallo a mitad no deja nada',{timeout:60000},async()=>{
  const {ctx,p,errors}=await page();
  try{
    const r=await p.evaluate(async()=>{const db=await fresh();const k=mue(1);
      const ok=await S.commit(db,{baseRevision:0,changes:{lib:projectWith(k)},resources:[{key:k,bytes:blob('foto-1'),kind:'mue01'}]});
      const refs1=(await S.refs(db)).map(x=>x.resourceKey+'|'+x.holder);
      // Fallo a mitad: la escritura del documento falla DESPUÉS de escribir el recurso → la transacción entera se deshace.
      const put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...a){if(this.name==='docs')throw new DOMException('fallo simulado','DataError');return put.apply(this,a);};
      const k2=mue(2);let failed;try{await S.commit(db,{baseRevision:1,changes:{lib:projectWith(k,k2)},resources:[{key:k2,bytes:blob('foto-2')}]});}catch(e){failed=e.code||e.name;}
      IDBObjectStore.prototype.put=put;
      const keys=await S.resourceKeys(db),refs2=(await S.refs(db)).map(x=>x.resourceKey+'|'+x.holder),{revision}=await S.load(db);db.close();
      return {ok,refs1,failed,keys,refs2,revision};});
    assert.equal(r.ok.status,'saved');assert.deepEqual(r.refs1,['mue01/'+'1'.padStart(64,'0')+'|doc:lib']);
    assert.ok(r.failed,'el segundo guardado falla');assert.deepEqual(r.keys,['mue01/'+'1'.padStart(64,'0')],'el recurso del guardado fallido no queda');
    assert.deepEqual(r.refs2,r.refs1,'ni sus referencias');assert.equal(r.revision,1,'ni una revisión nueva');
    assert.deepEqual(errors,[]);
  }finally{await ctx.close();}
});

test('R1-T31 · operación en vuelo: pending protege los bytes; la confirmación lo sustituye por doc; cancelar lo libera',{timeout:60000},async()=>{
  const {ctx,p,errors}=await page();
  try{
    const r=await p.evaluate(async()=>{const db=await fresh();const a=mue(3),b=mue(4);
      await S.stage(db,'op_a',[{key:a,bytes:blob('a')}]);await S.stage(db,'op_b',[{key:b,bytes:blob('b')}]);
      const g1=await S.collect(db);
      await S.commit(db,{baseRevision:0,changes:{lib:projectWith(a)},ops:['op_a']});await S.cancel(db,'op_b');
      const holders=(await S.refs(db)).map(x=>x.holder).sort();const g2=await S.collect(db);const keys=await S.resourceKeys(db);db.close();
      return {g1:g1.removed,holders,g2:g2.removed,keys};});
    assert.deepEqual(r.g1,[],'en vuelo no se recoge');assert.deepEqual(r.holders,['doc:lib'],'pending sustituido o retirado');
    assert.deepEqual(r.g2,['mue01/'+'4'.padStart(64,'0')],'la cancelada se recoge');assert.deepEqual(r.keys,['mue01/'+'3'.padStart(64,'0')]);
    assert.deepEqual(errors,[]);
  }finally{await ctx.close();}
});

test('R1-T32 · recogida transaccional: solo el huérfano real; la red de seguridad textual conserva lo citado sin fila; ilegible aborta',{timeout:60000},async()=>{
  const {ctx,p,errors}=await page();
  try{
    const r=await p.evaluate(async()=>{const db=await fresh();const orphan=mue(5),textual=mue(6),future=mue(7);
      await S.stage(db,'op',[{key:orphan,bytes:blob('o')},{key:textual,bytes:blob('t')},{key:future,bytes:blob('f')}]);await S.cancel(db,'op');
      // Citas sin fila de referencia: en el diario (texto libre) y en un documento de una versión futura (formato desconocido).
      await new Promise(res=>{const t=db.transaction(['journal','docs'],'readwrite');t.objectStore('journal').put({note:'restauración de '+textual},'j1');
        t.objectStore('docs').put(JSON.stringify({version:99,mystery:{deep:[future]}}),'futuro');t.oncomplete=res;});
      const g=await S.collect(db);const keys=(await S.resourceKeys(db)).sort();
      // Registro ilegible: un documento que no es cadena → la pasada aborta sin borrar nada.
      await S.stage(db,'op2',[{key:mue(8),bytes:blob('x')}]);await S.cancel(db,'op2');
      await new Promise(res=>{const t=db.transaction('docs','readwrite');t.objectStore('docs').put({no:'cadena'},'roto');t.oncomplete=res;});
      let aborted;try{await S.collect(db);}catch(e){aborted=e.code;}const still=(await S.resourceKeys(db)).includes(mue(8));db.close();
      return {removed:g.removed,keys,aborted,still};});
    assert.deepEqual(r.removed,['mue01/'+'5'.padStart(64,'0')]);
    assert.deepEqual(r.keys,['mue01/'+'6'.padStart(64,'0'),'mue01/'+'7'.padStart(64,'0')]);
    assert.equal(r.aborted,'unreadable');assert.equal(r.still,true,'nada borrado ante un registro ilegible');
    assert.deepEqual(errors,[]);
  }finally{await ctx.close();}
});

test('R1-T33 · H-1 sobre v2: foto citada por documento, conflicto, diario o historial de una sesión viva se conserva; la de una sesión cerrada se libera',{timeout:60000},async()=>{
  const {ctx,p,errors}=await page();
  try{
    const r=await p.evaluate(async()=>{const db=await fresh();const [d,c,j,s,dead]=[9,10,11,12,13].map(mue);
      await S.stage(db,'op',[d,c,j,s,dead].map(k=>({key:k,bytes:blob(k)})));
      await S.commit(db,{baseRevision:0,changes:{lib:projectWith(d)},ops:['op']});
      await S.conflictAdd(db,{reason:'revision',docs:{lib:projectWith(c)}});
      await S.journalPut(db,'restore_1',{images:[j],state:'pending'});
      // Pestaña viva (lock rubik-sota-tab:viva tomado) y pestaña muerta (sin lock).
      navigator.locks.request('rubik-sota-tab:viva',()=>new Promise(()=>{}));await new Promise(r=>setTimeout(r,50));
      await S.holdSession(db,'viva',[s]);await S.holdSession(db,'muerta',[dead]);
      const journalRow=(await S.refs(db)).some(x=>x.resourceKey===j&&x.holder==='journal:restore_1');
      const rel=await S.releaseDeadSessions(db);const g=await S.collect(db);const keys=(await S.resourceKeys(db)).sort();db.close();
      return {released:rel.released,removed:g.removed,keys,expected:[d,c,j,s].sort(),dead,journalRow};});
    assert.equal(r.journalRow,true,'el diario protege su foto con una fila explícita (images[]), no solo por la red textual');
    assert.deepEqual(r.released,['muerta']);assert.deepEqual(r.removed,[r.dead]);assert.deepEqual(r.keys,r.expected);
    assert.deepEqual(errors,[]);
  }finally{await ctx.close();}
});

test('integridad SHA-256 (R1-D8): huella declarada distinta se rechaza; bytes alterados no se entregan',{timeout:60000},async()=>{
  const {ctx,p,errors}=await page();
  try{
    const r=await p.evaluate(async()=>{const db=await fresh();const k=mue(14);
      let wrong;try{await S.stage(db,'op',[{key:k,bytes:blob('a'),sha256:'0'.repeat(64)}]);}catch(e){wrong=e.code;}
      await S.stage(db,'op',[{key:k,bytes:blob('a')}]);const good=(await S.getResource(db,k)).sha256;
      await new Promise(res=>{const t=db.transaction('resources','readwrite');const st=t.objectStore('resources');st.get(k).onsuccess=e=>{const v=e.target.result;v.bytes=blob('alterado');st.put(v,k);};t.oncomplete=res;});
      let tampered;try{await S.getResource(db,k);}catch(e){tampered=e.code;}db.close();
      return {wrong,good,tampered,expect:await S.sha256(blob('a'))};});
    assert.equal(r.wrong,'resource-sha256');assert.equal(r.good,r.expect);assert.equal(r.tampered,'resource-integrity');
    assert.deepEqual(errors,[]);
  }finally{await ctx.close();}
});

test('A0 en v2: con la época 2 ninguna escritura entra (confirmación, en vuelo, recogida)',{timeout:60000},async()=>{
  const {ctx,p,errors}=await page();
  try{
    const r=await p.evaluate(async()=>{const db=await fresh();await S.stage(db,'op',[{key:mue(15),bytes:blob('a')}]);await S.cancel(db,'op');
      await new Promise(res=>{const t=db.transaction('meta','readwrite');t.objectStore('meta').put({epoch:2},'schemaEpoch');t.oncomplete=res;});
      const codes=[];for(const f of [()=>S.commit(db,{baseRevision:0,changes:{lib:projectWith()}}),()=>S.stage(db,'op2',[{key:mue(16),bytes:blob('b')}]),()=>S.collect(db)])
        codes.push(await f().then(()=>'escrito',e=>e.code));
      const keys=await S.resourceKeys(db),{revision}=await S.load(db);db.close();FloorPlanSchemaEpoch._reset();return {codes,keys,revision};});
    assert.deepEqual(r.codes,['schema-outdated','schema-outdated','schema-outdated']);assert.equal(r.keys.length,1,'nada nuevo ni borrado');assert.equal(r.revision,0);
    assert.deepEqual(errors.filter(e=>!/schema/.test(e)),[]);
  }finally{await ctx.close();}
});

test('concurrencia: dos confirmaciones sobre la misma revisión desde dos pestañas: una entra, la otra es conflicto',{timeout:60000},async()=>{
  const ctx=await browser.newContext();
  try{
    const a=await ctx.newPage(),b=await ctx.newPage();await a.goto(url);await b.goto(url);
    await a.evaluate(async()=>{(await fresh()).close();});
    const go=pg=>pg.evaluate(async who=>{const db=await S.open();try{return await S.commit(db,{baseRevision:0,changes:{lib:JSON.stringify({by:who})}}).then(r=>r.status,e=>e.code);}finally{db.close();}},'x');
    const out=(await Promise.all([go(a),go(b)])).sort();
    assert.deepEqual(out,['conflict','saved']);
  }finally{await ctx.close();}
});

// ── Cierre del núcleo (mandato 19/11) ─────────────────────────────────────────────────────────────────────────────────
test('referencia a un recurso inexistente: se informa y protege los bytes que lleguen después',{timeout:60000},async()=>{
  const {ctx,p,errors}=await page();
  try{
    const r=await p.evaluate(async()=>{const db=await fresh();const k=mue(20);
      const c=await S.commit(db,{baseRevision:0,changes:{lib:projectWith(k)}});
      const rows=(await S.refs(db)).map(x=>x.resourceKey+'|'+x.holder);
      // Los bytes llegan después por una operación que se cancela: la fila doc:lib ya los protege.
      await S.stage(db,'tarde',[{key:k,bytes:blob('llega tarde')}]);await S.cancel(db,'tarde');
      const g=await S.collect(db);const kept=(await S.resourceKeys(db)).includes(k);db.close();return {missing:c.missing,rows,removed:g.removed,kept,k};});
    assert.deepEqual(r.missing,[r.k],'la ausencia se informa');assert.deepEqual(r.rows,[r.k+'|doc:lib'],'la fila existe aunque falten los bytes');
    assert.deepEqual(r.removed,[]);assert.equal(r.kept,true);assert.deepEqual(errors,[]);
  }finally{await ctx.close();}
});

test('misma clave con huella distinta: nunca se sobrescribe en silencio; con la misma huella es idempotente',{timeout:60000},async()=>{
  const {ctx,p,errors}=await page();
  try{
    const r=await p.evaluate(async()=>{const db=await fresh();const k=mue(21);
      await S.stage(db,'a',[{key:k,bytes:blob('original')}]);const sha=(await S.getResource(db,k)).sha256;
      const other=await S.stage(db,'b',[{key:k,bytes:blob('distinto')}]).then(()=>'escrito',e=>e.code);
      const viaCommit=await S.commit(db,{baseRevision:0,changes:{lib:projectWith(k)},resources:[{key:k,bytes:blob('distinto')}]}).then(()=>'escrito',e=>e.code);
      const same=await S.stage(db,'c',[{key:k,bytes:blob('original')}]).then(()=>'ok',e=>e.code);
      const after=(await S.getResource(db,k)).sha256,{revision}=await S.load(db),pend=(await S.refs(db)).map(x=>x.holder).sort();db.close();
      return {other,viaCommit,same,unchanged:after===sha,revision,pend};});
    assert.equal(r.other,'resource-conflict');assert.equal(r.viaCommit,'resource-conflict');assert.equal(r.same,'ok');
    assert.equal(r.unchanged,true,'los bytes originales se conservan');assert.equal(r.revision,0,'el guardado rechazado no confirma nada');
    assert.deepEqual(r.pend,['pending:a','pending:c'],'la operación rechazada no deja filas');assert.deepEqual(errors,[]);
  }finally{await ctx.close();}
});

test('sesiones frente a una recogida concurrente: quitar una foto y protegerla por el historial es atómico; una sesión tardía informa',{timeout:120000},async()=>{
  const ctx=await browser.newContext();
  try{
    const a=await ctx.newPage(),b=await ctx.newPage();await a.goto(url);await b.goto(url);
    await a.evaluate(async()=>{(await fresh()).close();navigator.locks.request('rubik-sota-tab:A',()=>new Promise(()=>{}));});
    // B recoge sin parar mientras A, 25 veces, quita la foto del documento (con y sin protección del historial).
    const race=async withSession=>{
      await b.evaluate(()=>{window.stop=false;window.loops=0;(async()=>{const db=await S.open();while(!window.stop){await S.collect(db).catch(()=>{});window.loops++;}db.close();})();});
      const lost=await a.evaluate(async withSession=>{const db=await S.open();let lost=0,rev=(await S.load(db)).revision;
        for(let i=0;i<25;i++){const k=mue(1000+i+(withSession?0:500));
          rev=(await S.commit(db,{baseRevision:rev,changes:{lib:projectWith(k)},resources:[{key:k,bytes:blob('f'+i+withSession)}]})).revision;
          rev=(await S.commit(db,{baseRevision:rev,changes:{lib:projectWith()},session:withSession?{tab:'A',keys:[k]}:null})).revision;
          await new Promise(r=>setTimeout(r,15));if(!(await S.resourceKeys(db)).includes(k))lost++;}
        db.close();return lost;},withSession);
      const loops=await b.evaluate(()=>{window.stop=true;return window.loops;});return {lost,loops};};
    const protectedRun=await race(true),control=await race(false);
    assert.ok(protectedRun.loops>0&&control.loops>0,'la recogida corrió en paralelo');
    assert.equal(protectedRun.lost,0,'con la fila de sesión en la misma transacción no se pierde ninguna');
    assert.ok(control.lost>0,'control: sin historial, la foto quitada sí se recoge (la prueba detecta el riesgo)');
    // Sesión que se incorpora DESPUÉS de una recogida: no afirma proteger lo que ya no existe.
    const late=await a.evaluate(async()=>{const db=await S.open();const k=mue(2000);await S.stage(db,'x',[{key:k,bytes:blob('x')}]);await S.cancel(db,'x');
      await S.collect(db);const h=await S.holdSession(db,'B',[k]);db.close();return {missing:h.missing,k};});
    assert.deepEqual(late.missing,[late.k]);
  }finally{await ctx.close();}
});
