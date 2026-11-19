'use strict';
/* F0.2c · Etapa 2 · Copia de emergencia completa, verificada y restaurable (js/store-v2-backup.js) sobre el núcleo v2.
   AISLADO y con datos SINTÉTICOS, en Chromium real (IndexedDB, SHA-256, descargas). */
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');let server,browser,url,origin;
const PAGE=`<!doctype html><meta charset="utf-8"><title>copia v2</title><link rel="stylesheet" href="/css/design-system.css">
<script src="/js/schema-epoch.js"></script><script src="/js/local-images.js"></script><script src="/js/store-v2.js"></script><script src="/js/store-v2-backup.js"></script>
<script>
const S=FloorPlanStoreV2,B=FloorPlanStoreV2Backup,hex=n=>n.toString(16).padStart(64,'0'),mue=n=>'mue01/'+hex(n);
window.blob=s=>new Blob([s],{type:'image/jpeg'});
window.projectWith=(...keys)=>JSON.stringify({id:'prj_sint',name:'Sintético',sourceImages:[{id:'img_plano',storage:{kind:'local-browser',ref:'img_plano'}}],objects:keys.map((k,i)=>({id:'obj_'+i})),
  extensions:{'x-mue01-furniture-photo':{version:1,items:keys.map((k,i)=>({objectId:'obj_'+i,photo:{imageKey:k}}))}}});
// Estado sintético completo: documentos, plano, dos fotos MUE-01, referencias, diario, conflicto y una referencia ausente.
window.seed=async()=>{await new Promise(r=>{const q=indexedDB.deleteDatabase(S.DB);q.onsuccess=q.onerror=q.onblocked=()=>r();});const db=await S.open();
  await S.stage(db,'op',[{key:mue(1),bytes:blob('foto privada 1'),kind:'mue01'},{key:mue(2),bytes:blob('foto privada 2'),kind:'mue01'},{key:'img_plano',bytes:blob('plano'),kind:'plan'}]);
  await S.commit(db,{baseRevision:0,changes:{'rubik-sota-project-library-v1':projectWith(mue(1),mue(2)),'rubik-budget-v1':JSON.stringify({prj_sint:{lines:[1,2]}}),'rubik-review-v1':projectWith(mue(9))},ops:['op']});
  await S.journalPut(db,'restore_1',{images:[mue(1)],state:'pending'});await S.conflictAdd(db,{reason:'revision',docs:{lib:projectWith(mue(2))}});
  return db;};
window.fingerprint=async db=>{const s=await B.snapshot(db);const parts=[];for(let i=0;i<s.resKeys.length;i++)parts.push(s.resKeys[i]+':'+s.resources[i].sha256);
  return JSON.stringify([s.docKeys,s.docs,parts,s.refs.map(r=>r.resourceKey+'|'+r.holder),s.journalKeys,s.conflictKeys,s.revision?.n]);};
window.mue=mue;
</script>`;
before(async()=>{
  server=createServer(async(req,res)=>{try{const p=new URL(req.url,'http://l').pathname;if(p==='/t.html'){res.setHeader('content-type','text/html');return res.end(PAGE);}
    const f=path.resolve(root,'.'+p);if(!f.startsWith(root+path.sep))throw 0;res.setHeader('content-type',f.endsWith('.css')?'text/css':'text/javascript');res.end(await fs.readFile(f));}catch{res.statusCode=404;res.end();}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));origin=`http://127.0.0.1:${server.address().port}`;url=origin+'/t.html';
  browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox']});
});
after(async()=>{await browser?.close();await new Promise(r=>server.close(r));});
async function page(){const ctx=await browser.newContext({acceptDownloads:true}),p=await ctx.newPage(),errors=[],external=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(!r.url().startsWith(origin)&&!/^(data|blob):/.test(r.url()))external.push(r.url());});await p.goto(url);return {ctx,p,errors,external};}

test('aislamiento: ninguna página del producto carga la copia v2',async()=>{
  for(const f of (await fs.readdir(root)).filter(f=>f.endsWith('.html')))assert.doesNotMatch(await fs.readFile(path.join(root,f),'utf8'),/store-v2-backup/,f);
});

test('consentimiento explícito obligatorio; la copia es completa: documentos, recursos (fotos MUE-01 y plano), referencias, diario, conflictos y manifiesto SHA-256',{timeout:60000},async()=>{
  const {ctx,p,errors,external}=await page();
  try{
    const r=await p.evaluate(async()=>{const db=await seed();
      const codes=[];for(const c of [undefined,{confirmed:false,scope:'private-complete'},{confirmed:true}])codes.push(await B.create(db,{consent:c}).then(()=>'creada',e=>e.code));
      const out=await B.create(db,{consent:{confirmed:true,scope:'private-complete'}});const a=JSON.parse(await out.blob.text());db.close();
      return {codes,counts:out.counts,paths:a.manifest.entries.map(e=>e.path).sort(),private:a.private,algo:a.manifest.algorithm,sha:out.manifestSha256};});
    assert.deepEqual(r.codes,['consent-required','consent-required','consent-required']);
    assert.deepEqual(r.counts,{docs:3,resources:3,photos:2,refs:8,journal:1,conflicts:1}); // 8: el diario cita su foto en images[] (fila journal:<id>)
    assert.ok(r.paths.includes('resources/mue01/'+'1'.padStart(64,'0'))&&r.paths.includes('resources/mue01/'+'2'.padStart(64,'0'))&&r.paths.includes('resources/img_plano'),'incluye las fotos privadas y el plano');
    for(const p2 of ['index/refs.json','index/resources.json','journal.json','conflicts.json','docs/rubik-budget-v1'])assert.ok(r.paths.includes(p2),p2);
    assert.equal(r.private,true);assert.equal(r.algo,'SHA-256');assert.match(r.sha,/^[0-9a-f]{64}$/);
    assert.deepEqual(errors,[]);assert.deepEqual(external,[],'no sale nada del navegador');
  }finally{await ctx.close();}
});

test('verificación: detecta archivo incompleto, alterado, ausente, sobrante, manifiesto manipulado y formato ajeno',{timeout:60000},async()=>{
  const {ctx,p,errors}=await page();
  try{
    const r=await p.evaluate(async()=>{const db=await seed();const out=await B.create(db,{consent:{confirmed:true,scope:'private-complete'}});db.close();
      const text=await out.blob.text(),a=()=>JSON.parse(text),codes=async b=>(await B.verify(b)).problems.map(x=>x.code);
      const res=[];
      res.push(['íntegra',(await B.verify(out.blob)).ok]);
      res.push(['incompleta',await codes(new Blob([text.slice(0,Math.floor(text.length*0.6))]))]);
      {const x=a(),k='resources/'+mue(1);const bytes=Uint8Array.from(atob(x.files[k].data),c=>c.charCodeAt(0));bytes[0]^=1;let s='';for(const c of bytes)s+=String.fromCharCode(c);x.files[k].data=btoa(s);res.push(['alterada',await codes(new Blob([JSON.stringify(x)]))]);}
      {const x=a();delete x.files['journal.json'];res.push(['ausente',await codes(new Blob([JSON.stringify(x)]))]);}
      {const x=a();x.files['extra.bin']={encoding:'base64',data:btoa('x')};res.push(['sobrante',await codes(new Blob([JSON.stringify(x)]))]);}
      {const x=a();x.manifest.entries[0].sha256='0'.repeat(64);res.push(['manifiesto',await codes(new Blob([JSON.stringify(x)]))]);}
      {const x=a();x.format='otra-cosa';res.push(['formato',await codes(new Blob([JSON.stringify(x)]))]);}
      return Object.fromEntries(res);});
    assert.equal(r['íntegra'],true);
    assert.deepEqual(r.incompleta,['incomplete']);
    assert.deepEqual(r.alterada,['sha256-mismatch']);
    assert.deepEqual(r.ausente,['missing-entry']);
    assert.deepEqual(r.sobrante,['unlisted-entry']);
    assert.ok(r.manifiesto.includes('manifest-mismatch')&&r.manifiesto.includes('sha256-mismatch'));
    assert.deepEqual(r.formato,['format']);
    assert.deepEqual(errors,[]);
  }finally{await ctx.close();}
});

test('restauración de prueba en seco: valida y reconstruye sin escribir nada; informa las imágenes que ya faltaban',{timeout:60000},async()=>{
  const {ctx,p,errors}=await page();
  try{
    const r=await p.evaluate(async()=>{const db=await seed();const before=await fingerprint(db),dbs=(await indexedDB.databases()).map(d=>d.name).sort();
      const out=await B.create(db,{consent:{confirmed:true,scope:'private-complete'}});const d=await B.dryRun(out.blob);
      const after=await fingerprint(db),dbs2=(await indexedDB.databases()).map(d=>d.name).sort();db.close();
      return {ok:d.ok,problems:d.problems,counts:d.counts,absent:d.absentResources,same:before===after,sameDbs:JSON.stringify(dbs)===JSON.stringify(dbs2)};});
    assert.equal(r.ok,true,JSON.stringify(r.problems));assert.equal(r.counts.photos,2);
    assert.deepEqual(r.absent,['mue01/'+'9'.padStart(64,'0')],'la referencia ausente se informa, no se inventa');
    assert.equal(r.same,true,'los datos originales no cambian');assert.equal(r.sameDbs,true,'no crea bases');
    assert.deepEqual(errors,[]);
  }finally{await ctx.close();}
});

test('restauración solo en una base nueva: idéntica a la copia; nunca sobre la original ni sobre otra existente; la original no cambia',{timeout:60000},async()=>{
  const {ctx,p,errors}=await page();
  try{
    const r=await p.evaluate(async()=>{const db=await seed();const before=await fingerprint(db);
      const out=await B.create(db,{consent:{confirmed:true,scope:'private-complete'}});
      const refused=[];for(const name of [S.DB,undefined])refused.push(await B.restoreInto(out.blob,{name}).then(()=>'restaurada',e=>e.code));
      const name='rubik-sota-store-v2-restauracion-prueba';await new Promise(r=>{const q=indexedDB.deleteDatabase(name);q.onsuccess=q.onerror=()=>r();});
      const done=await B.restoreInto(out.blob,{name});const again=await B.restoreInto(out.blob,{name}).then(()=>'restaurada',e=>e.code);
      const rdb=await S.open({name});const restored=await fingerprint(rdb);const photo=await S.getResource(rdb,mue(1));rdb.close();
      const after=await fingerprint(db);
      // Una copia alterada no se restaura.
      const x=JSON.parse(await out.blob.text());x.manifest.entries[1].size+=1;
      const bad=await B.restoreInto(new Blob([JSON.stringify(x)]),{name:name+'-2'}).then(()=>'restaurada',e=>e.code);
      db.close();return {refused,done:done.status,again,equal:restored===before,photoOk:!!photo&&photo.kind==='mue01',unchanged:after===before,bad};});
    assert.deepEqual(r.refused,['restore-target','restore-target']);assert.equal(r.done,'restored');assert.equal(r.again,'restore-target','no sobrescribe otra base');
    assert.equal(r.equal,true,'la base restaurada es idéntica: documentos, recursos, referencias, diario, conflictos y revisión');
    assert.equal(r.photoOk,true,'la foto privada vuelve con su huella verificada');assert.equal(r.unchanged,true,'la original no cambia');
    assert.equal(r.bad,'restore-invalid');assert.deepEqual(errors,[]);
  }finally{await ctx.close();}
});

test('interfaz UX-FIRST · Perla: explica qué incluye y el riesgo, exige consentimiento, descarga y comprueba la copia, sin red',{timeout:60000},async()=>{
  const {ctx,p,errors,external}=await page();
  try{
    await p.evaluate(async()=>{window.db=await seed();B.openDialog(window.db);});
    const dlg=p.locator('#v2BackupDialog');await dlg.waitFor();
    const text=await dlg.innerText();
    for(const re of [/fotos de tus muebles/,/Contiene fotos privadas/,/RUBIK no lo envía/,/Exportar proyecto/])assert.match(text,re);
    assert.equal(await p.locator('#v2bkCreate').isDisabled(),true,'sin consentimiento no se puede descargar');
    await p.locator('#v2bkConsent').check();assert.equal(await p.locator('#v2bkCreate').isDisabled(),false);
    const [dl]=await Promise.all([p.waitForEvent('download'),p.locator('#v2bkCreate').click()]);
    await p.waitForFunction(()=>document.getElementById('v2bkStatus').dataset.state==='ok');
    const status=await p.locator('#v2bkStatus').innerText();
    assert.match(status,/Copia comprobada: 3 documentos, 3 archivos \(2 fotos de muebles\)/);assert.match(status,/ya faltaban/);assert.match(status,/no han cambiado/);
    const saved=await fs.readFile(await dl.path(),'utf8');
    const ok=await p.evaluate(async t=>(await FloorPlanStoreV2Backup.verify(new Blob([t]))).ok,saved);assert.equal(ok,true,'el archivo descargado se verifica');
    assert.match(dl.suggestedFilename(),/^rubik-copia-completa-\d{4}-\d{2}-\d{2}\.json$/);
    assert.equal(await dlg.getAttribute('aria-labelledby'),'v2bkTitle');
    assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  }finally{await ctx.close();}
});
