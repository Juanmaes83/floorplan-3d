/* F0.2c · Etapa 3 · Migración recuperable del almacén legado a la autoridad v2 (contrato R1 §6, §6 bis y requisitos
   obligatorios de implementación). AISLADO: ninguna página del producto lo carga. Se prueba SOLO con datos sintéticos
   en bases de prueba; los nombres de las bases son parámetros. NO-GO para datos reales (convivencia de A0 y
   autorización específica).

   Pasos (R1 §6):
     0. copia de emergencia completa del ORIGEN, verificada y restaurable en seco; su huella debe corresponder al estado
        actual del origen (si el origen cambió después, la copia ya no vale);
     1. reserva transaccional (comparación y asignación en meta.migration con token creciente y arrendamiento);
     2. copia por lotes; cada transacción comprueba el token (vallado) y renueva el arrendamiento;
     3. verificación: el origen no cambió (si cambió: se repite, hasta 3 veces; después se detiene: escritor antiguo
        activo) y cada documento y recurso de v2 es idéntico (SHA-256);
     4. conmutación: MARCADOR PREVIO fuera de v2 → transacción de v2 (autoridad, época 2, huellas del legado) → TESTIGO
        fuera de v2. No se asume atomicidad entre almacenes: boot() resuelve cada combinación.
   Nunca borra ni modifica el origen. Un recurso sin referencias se copia con el titular legacy:unclaimed (no se recoge).
   rollback() solo con confirmación y conservando todos los cambios posteriores; nunca borra v2. */
(function(root){
 'use strict';
 const S=root.FloorPlanStoreV2,B=root.FloorPlanStoreV2Backup;
 const SWITCHING='rubik-sota-v2-switching',SWITCHED='rubik-sota-v2-switched',LEASE_MS=120000,MAX_ATTEMPTS=3,JOURNAL='rubik-expediente-journal-v1:';
 const KEYS=['rubik-sota-floorplan-project-v1','rubik-sota-project-library-v1','rubik-budget-v1','rubik-review-v1','rubik-construction-v1'];
 class MigrationError extends Error{constructor(code,message,extra={}){super(message);this.name='MigrationError';this.code=code;Object.assign(this,extra);}}
 const enc=new TextEncoder();
 const sha=async b=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(x=>x.toString(16).padStart(2,'0')).join('');
 const shaText=t=>sha(enc.encode(t)),shaBlob=async b=>sha(new Uint8Array(await b.arrayBuffer()));
 const exists=async(idb,name)=>typeof idb.databases!=='function'||(await idb.databases()).some(d=>d.name===name);
 const openRaw=(idb,name)=>new Promise((res,rej)=>{const r=idb.open(name);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);r.onupgradeneeded=()=>{r.transaction.abort();};});
 const getAll=(db,store)=>new Promise((res,rej)=>{if(!db.objectStoreNames.contains(store))return res([]);const t=db.transaction(store),k=t.objectStore(store).getAllKeys(),v=t.objectStore(store).getAll();t.oncomplete=()=>res(k.result.map((key,i)=>[key,v.result[i]]));t.onerror=()=>rej(t.error);});

 // ── Origen legado (solo lectura; escritura únicamente en rollback) ───────────────────────────────────────────────────
 function legacySource({persistence='rubik-sota-persistence-v1',images='rubik-sota-images-v1',storage=root.localStorage,indexedDB:idb=root.indexedDB}={}){
  async function read(){
   const docs={},resources={},journal=[],conflicts=[];
   if(await exists(idb,persistence)){const db=await openRaw(idb,persistence);try{for(const [k,v] of await getAll(db,'docs'))docs[k]=v;for(const [k,v] of await getAll(db,'conflicts'))conflicts.push([k,v]);}finally{db.close();}}
   else for(const k of KEYS){const v=storage.getItem(k);if(v!==null)docs[k]=v;}
   if(await exists(idb,images)){const db=await openRaw(idb,images);try{for(const [k,v] of await getAll(db,'images'))resources[k]=v;}finally{db.close();}}
   for(let i=0;i<storage.length;i++){const k=storage.key(i);if(k?.startsWith(JOURNAL))try{journal.push([k.slice(JOURNAL.length),JSON.parse(storage.getItem(k))]);}catch{journal.push([k.slice(JOURNAL.length),{unreadable:storage.getItem(k)}]);}}
   return {docs,resources,journal,conflicts};
  }
  // Huella del origen: cambia si una versión antigua escribe o borra cualquier documento, recurso, diario o conflicto.
  async function fingerprint(r){r=r||await read();const parts=[];
   for(const k of Object.keys(r.docs).sort())parts.push('d:'+k+':'+await shaText(String(r.docs[k])));
   for(const k of Object.keys(r.resources).sort())parts.push('r:'+k+':'+(r.resources[k] instanceof Blob?await shaBlob(r.resources[k]):'not-a-blob'));
   parts.push('j:'+await shaText(JSON.stringify(r.journal)),'c:'+await shaText(JSON.stringify(r.conflicts)));
   return {hash:await shaText(parts.join('\n')),parts};}
  // Solo para rollback (R1-D11): escribe documentos y recursos en el legado y lo verifica.
  async function writeBack({docs={},resources={}}){
   // Se comprueba ANTES de escribir nada que todos los destinos existen: no se deja el legado a medias.
   if(Object.keys(resources).length&&!await exists(idb,images))throw new MigrationError('rollback-target','Falta el almacén de imágenes legado: no se puede devolver ningún recurso.');
   if(Object.keys(docs).length){
    if(await exists(idb,persistence)){const db=await openRaw(idb,persistence);try{await new Promise((res,rej)=>{const t=db.transaction('docs','readwrite');for(const [k,v] of Object.entries(docs))t.objectStore('docs').put(v,k);t.oncomplete=res;t.onerror=t.onabort=()=>rej(t.error||new Error('escritura'));});}finally{db.close();}}
    else for(const [k,v] of Object.entries(docs))storage.setItem(k,v);}
   if(Object.keys(resources).length){if(!await exists(idb,images))throw new MigrationError('rollback-target','Falta el almacén de imágenes legado.');
    const db=await openRaw(idb,images);try{await new Promise((res,rej)=>{const t=db.transaction('images','readwrite');for(const [k,v] of Object.entries(resources))t.objectStore('images').put(v,k);t.oncomplete=res;t.onerror=t.onabort=()=>rej(t.error||new Error('escritura'));});}finally{db.close();}}
  }
  return {read,fingerprint,writeBack,names:{persistence,images}};
 }

 // Instantánea del legado con la forma de FloorPlanStoreV2Backup.snapshot(): referencias explícitas derivadas de los
 // documentos, del diario y de los conflictos; un recurso que nadie cita queda con el titular legacy:unclaimed.
 async function toSnapshot(r){
  const refs=[],held=new Set(),at=new Date().toISOString(),hold=(k,h)=>{refs.push({resourceKey:k,holder:h,at});held.add(k);};
  for(const [k,v] of Object.entries(r.docs)){const x=S.refsOf(String(v));if(!x)throw new MigrationError('doc-unreadable','El documento «'+k+'» del origen no es legible: no se migra nada.');for(const ref of x)hold(ref,'doc:'+k);}
  for(const [id,rec] of r.journal)for(const ref of S.journalRefs(rec))hold(ref,'journal:'+id);
  for(const [id,rec] of r.conflicts)for(const v of Object.values(rec?.docs||{}))for(const ref of S.refsOf(String(v))||[])hold(ref,'conflict:'+id);
  const resKeys=Object.keys(r.resources).sort(),resources=[];
  for(const k of resKeys){const b=r.resources[k];if(!(b instanceof Blob))throw new MigrationError('resource-unreadable','El recurso «'+k+'» del origen no es legible: no se migra nada.');
   resources.push({bytes:b,sha256:await shaBlob(b),size:b.size,mediaType:b.type||'application/octet-stream',kind:k.startsWith('mue01/')?'mue01':'plan',createdAt:at});
   if(!held.has(k))refs.push({resourceKey:k,holder:'legacy:unclaimed',at});}
  const docKeys=Object.keys(r.docs).sort();
  return {docKeys,docs:docKeys.map(k=>String(r.docs[k])),resKeys,resources,refs,journalKeys:r.journal.map(x=>x[0]),journal:r.journal.map(x=>x[1]),conflictKeys:r.conflicts.map(x=>x[0]),conflicts:r.conflicts.map(x=>x[1]),revision:{n:0}};
 }

 // ── Paso 0: copia de emergencia del origen, verificada y restaurable en seco ─────────────────────────────────────────
 async function prepare(source,{consent}){
  const r=await source.read(),snap=await toSnapshot(r),fp=await source.fingerprint(r);
  const out=await B.fromSnapshot(snap,{consent});const dry=await B.dryRun(out.blob);
  if(!dry.ok)throw new MigrationError('export-invalid','La copia de emergencia del origen no supera la restauración de prueba: no se migra.',{problems:dry.problems});
  return {blob:out.blob,manifestSha256:out.manifestSha256,counts:out.counts,fingerprint:fp.hash,absentResources:dry.absentResources};
 }

 // ── Transacción vallada por token (paso 1-4) ─────────────────────────────────────────────────────────────────────────
 function fenced(db,stores,token,tab,fn){
  if(!stores.includes('meta'))stores=[...stores,'meta'];
  return new Promise((resolve,reject)=>{let t;try{t=db.transaction(stores,'readwrite',{durability:'strict'});}catch(e){reject(e);return;}
   const s=Object.fromEntries(stores.map(n=>[n,t.objectStore(n)]));let out,err=null;
   s.meta.get('migration').onsuccess=e=>{const m=e.target.result;
    if(!m||m.token!==token||m.owner!==tab){err=new MigrationError('token','Otra pestaña ha tomado la migración: esta operación ya no es válida.');t.abort();return;}
    try{out=fn(s,m);s.meta.put({...m,heartbeatAt:Date.now(),...(out?.meta||{})},'migration');}catch(x){err=x;t.abort();}};
   t.oncomplete=()=>resolve(out);t.onabort=t.onerror=()=>reject(err||t.error||new MigrationError('tx','Transacción cancelada.'));});
 }
 const clearAll=s=>{for(const n of ['docs','resources','refs','journal','conflicts'])s[n]?.clear();};

 async function reserve(db,tab,{locks=root.navigator?.locks,now=Date.now()}={}){
  const alive=new Set(typeof locks?.query==='function'?(await locks.query()).held.map(l=>l.name):[]);
  return new Promise((resolve,reject)=>{const t=db.transaction(['meta','docs','resources','refs','journal','conflicts'],'readwrite',{durability:'strict'});let out;
   const s=Object.fromEntries(['meta','docs','resources','refs','journal','conflicts'].map(n=>[n,t.objectStore(n)]));
   s.meta.get('migration').onsuccess=e=>{const m=e.target.result;
    if(m?.phase==='done'){out={status:'already'};return;}
    if(m&&m.phase==='stopped'){out={status:'stopped',attempts:m.attempts};return;}
    const fresh=m&&now-m.heartbeatAt<LEASE_MS&&(!alive.size||alive.has('rubik-sota-tab:'+m.owner));
    if(m&&m.owner!==tab&&fresh){out={status:'busy',owner:m.owner};return;}
    // Nuevo dueño (o recuperación de uno muerto): lo copiado antes se descarta en v2 —nunca en el origen— y se empieza.
    if(m)clearAll(s);
    const token=(m?.token||0)+1;s.meta.put({phase:'copying',owner:tab,token,heartbeatAt:now,attempts:m?.attempts||0,startedAt:new Date(now).toISOString()},'migration');
    out={status:'reserved',token,reclaimed:!!m};};
   t.oncomplete=()=>resolve(out);t.onabort=t.onerror=()=>reject(t.error);});
 }

 // ── Migrar ──────────────────────────────────────────────────────────────────────────────────────────────────────────
 async function migrate({source,name=S.DB,tab,preExport,estimate=()=>root.navigator?.storage?.estimate?.(),hooks={},storage=root.localStorage}){
  if(!tab)throw new MigrationError('tab','Falta el identificador de la pestaña.');
  // Paso 0: copia previa obligatoria y vigente.
  if(!preExport?.manifestSha256||!preExport?.fingerprint)throw new MigrationError('export-required','Antes de migrar hace falta la copia de emergencia completa y comprobada.');
  let r=await source.read();const fp0=await source.fingerprint(r);
  if(fp0.hash!==preExport.fingerprint)throw new MigrationError('export-stale','Tus datos cambiaron después de la copia de emergencia: hace falta una copia nueva antes de migrar.');
  // Espacio: la copia necesita, como mínimo, el tamaño del origen con margen.
  let bytes=0;for(const v of Object.values(r.docs))bytes+=enc.encode(String(v)).length;for(const b of Object.values(r.resources))bytes+=b.size||0;
  const est=await estimate();if(est&&Number.isFinite(est.quota)&&est.quota-(est.usage||0)<bytes*1.5+1048576)
   throw new MigrationError('quota','No hay espacio suficiente para migrar sin riesgo.',{needed:Math.ceil(bytes*1.5+1048576),available:est.quota-(est.usage||0)});
  const db=await S.open({name});
  try{
   const res=await reserve(db,tab);if(res.status!=='reserved')return res;const token=res.token;let fpCopy=fp0.hash;
   for(let attempt=1;;attempt++){
    const snap=await toSnapshot(r);
    // Paso 2: copia por lotes vallados (documentos+diario+conflictos+referencias; después cada recurso).
    try{
     await fenced(db,['docs','resources','refs','journal','conflicts'],token,tab,s=>{clearAll(s);
      snap.docKeys.forEach((k,i)=>s.docs.put(snap.docs[i],k));for(const x of snap.refs)s.refs.put(x);
      snap.journalKeys.forEach((k,i)=>s.journal.put(snap.journal[i],k));snap.conflictKeys.forEach((k,i)=>s.conflicts.put(snap.conflicts[i],k));});
     for(let i=0;i<snap.resKeys.length;i++){if(hooks.beforeResource)await hooks.beforeResource(snap.resKeys[i],i);
      await fenced(db,['resources'],token,tab,s=>{s.resources.put(snap.resources[i],snap.resKeys[i]);});}
    }catch(e){
     if(e?.name==='QuotaExceededError'||e?.code==='quota-exceeded'){
      // R1 §6 (H): sin «done», se borra lo parcial de v2 (nunca el origen); tres fallos seguidos detienen los reintentos.
      const m=await failAttempt(db,token,tab);throw new MigrationError(m.phase==='stopped'?'stopped':'quota-exceeded',m.phase==='stopped'?'La migración se ha detenido tras tres intentos fallidos por falta de espacio. Tus datos siguen intactos en el almacén actual.':'Se agotó el espacio durante la migración. Lo copiado se ha descartado; tus datos siguen intactos en el almacén actual.',{attempts:m.attempts});}
     throw e;}
    if(hooks.afterCopy)await hooks.afterCopy();
    // Paso 3: verificación del origen (escritores antiguos) y del destino (SHA-256).
    const r2=await source.read(),fp=await source.fingerprint(r2);
    if(fp.hash!==fpCopy){
     if(attempt>=MAX_ATTEMPTS){await fenced(db,[],token,tab,()=>({meta:{phase:'stopped',reason:'legacy-writer'}}));
      throw new MigrationError('legacy-writer-active','Otra pestaña o una versión antigua de RUBIK sigue cambiando los datos. Cierra las demás pestañas y vuelve a intentarlo; tus datos siguen intactos.');}
     r=r2;fpCopy=fp.hash;continue;}
    await verifyTarget(db,snap);
    await fenced(db,[],token,tab,()=>({meta:{phase:'verified',fingerprint:fp.hash}}));
    if(hooks.afterVerify)await hooks.afterVerify();
    // Paso 4: marcador previo FUERA de v2, conmutación en v2, testigo FUERA de v2.
    storage.setItem(SWITCHING,JSON.stringify({token,at:new Date().toISOString(),db:name}));
    if(hooks.afterMarker)await hooks.afterMarker();
    await fenced(db,[],token,tab,(s,m)=>{if(m.phase!=='verified'||m.fingerprint!==fp.hash)throw new MigrationError('not-verified','La copia no está verificada.');
     s.meta.put({epoch:2},'schemaEpoch');s.meta.put({value:'v2',token,at:new Date().toISOString()},'authority');s.meta.put({hash:fp.hash},'legacyHashes');
     return {meta:{phase:'done',doneAt:new Date().toISOString()}};});
    if(hooks.afterSwitch)await hooks.afterSwitch();
    finishWitness(storage,token,name);
    return {status:'migrated',token,counts:{docs:snap.docKeys.length,resources:snap.resKeys.length,refs:snap.refs.length,journal:snap.journalKeys.length,conflicts:snap.conflictKeys.length},
     unclaimed:snap.refs.filter(x=>x.holder==='legacy:unclaimed').map(x=>x.resourceKey)};
   }
  }finally{db.close();}
 }
 function finishWitness(storage,token,name){storage.setItem(SWITCHED,JSON.stringify({token,at:new Date().toISOString(),db:name}));storage.removeItem(SWITCHING);root.FloorPlanSchemaEpoch?.announce(2,storage);}
 async function failAttempt(db,token,tab){
  return new Promise((resolve,reject)=>{const t=db.transaction(['meta','docs','resources','refs','journal','conflicts'],'readwrite');const s=Object.fromEntries(['meta','docs','resources','refs','journal','conflicts'].map(n=>[n,t.objectStore(n)]));let m;
   s.meta.get('migration').onsuccess=e=>{m={...e.target.result};m.attempts=(m.attempts||0)+1;if(m.attempts>=MAX_ATTEMPTS)m.phase='stopped';else m.phase='failed';clearAll(s);s.meta.put(m,'migration');};
   t.oncomplete=()=>resolve(m);t.onabort=t.onerror=()=>reject(t.error);});
 }
 async function verifyTarget(db,snap){
  const {docs}=await S.load(db);
  for(let i=0;i<snap.docKeys.length;i++)if(docs.get(snap.docKeys[i])!==snap.docs[i])throw new MigrationError('verify-doc','El documento «'+snap.docKeys[i]+'» no se copió idéntico: no se conmuta.');
  if(docs.size!==snap.docKeys.length)throw new MigrationError('verify-doc','El destino tiene documentos que no están en el origen: no se conmuta.');
  for(let i=0;i<snap.resKeys.length;i++){let v;try{v=await S.getResource(db,snap.resKeys[i]);}catch(e){throw new MigrationError('verify-resource','El recurso «'+snap.resKeys[i]+'» no se copió íntegro: no se conmuta.');}
   if(!v||v.sha256!==snap.resources[i].sha256)throw new MigrationError('verify-resource','El recurso «'+snap.resKeys[i]+'» no se copió íntegro: no se conmuta.');}
 }

 // ── Arranque: una salida única por combinación (requisito obligatorio 2) ──────────────────────────────────────────────
 async function boot({source,name=S.DB,storage=root.localStorage,indexedDB:idb=root.indexedDB,open=()=>S.open({name})}){
  const parse=k=>{try{return JSON.parse(storage.getItem(k));}catch{return null;}};
  const marker=parse(SWITCHING),witness=parse(SWITCHED);
  if(!marker&&!witness)return {authority:'legacy'};
  let db=null,authority=null,meta=null;
  try{if(await exists(idb,name)){db=await open();meta=await new Promise((res,rej)=>{const t=db.transaction('meta'),o={},st=t.objectStore('meta');for(const k of ['authority','migration','legacyHashes','rollback'])st.get(k).onsuccess=e=>{o[k]=e.target.result;};t.oncomplete=()=>res(o);t.onerror=()=>rej(t.error);});authority=meta.authority?.value||'legacy';}}
  catch{db?.close();db=null;}
  try{
   if(!db||!meta){ // v2 ilegible o ausente con rastro de conmutación: estado indeterminado o v2 perdido → nunca volver solo al legado
    return {authority:null,blocked:true,reason:witness?'v2-unreadable':'indeterminate',
     message:'No se puede leer el almacén nuevo. RUBIK no guardará nada hasta resolverlo; tus cambios siguen en esta pestaña.',actions:['retry','emergency-export','pre-migration-copy']};}
   if(meta.rollback?.phase==='done')return {authority:'legacy',rolledBack:true};
   if(!witness){
    if(authority==='v2'&&meta.authority.token===marker.token){finishWitness(storage,marker.token,name);return {authority:'v2',repaired:'witness'};}
    storage.removeItem(SWITCHING);return {authority:'legacy',repaired:'marker',retry:true};}
   if(authority!=='v2')return {authority:null,blocked:true,reason:'indeterminate',message:'El rastro de la conmutación no coincide con el almacén nuevo. RUBIK no guardará nada hasta resolverlo.',actions:['retry','emergency-export']};
   // Escritores antiguos: el legado cambió tras conmutar → conflicto legacy-diverged con sus recursos; no se sobrescribe nada.
   const r=await source.read(),fp=await source.fingerprint(r);
   if(fp.hash!==meta.legacyHashes?.hash){const out=await recordDivergence(db,r,fp.hash);return {authority:'v2',diverged:true,conflictId:out.id,newResources:out.newResources};}
   return {authority:'v2'};
  }finally{db?.close();}
 }
 async function recordDivergence(db,r,hash){
  const have=new Set(await S.resourceKeys(db)),fresh=Object.keys(r.resources).filter(k=>!have.has(k));
  const op='legacy-diverged-'+hash.slice(0,12);
  if(fresh.length)await S.stage(db,op,fresh.map(k=>({key:k,bytes:r.resources[k],kind:k.startsWith('mue01/')?'mue01':'plan'})));
  const c=await S.conflictAdd(db,{reason:'legacy-diverged',docs:Object.fromEntries(Object.entries(r.docs).map(([k,v])=>[k,String(v)])),journal:r.journal,legacyHash:hash});
  if(fresh.length)await S.cancel(db,op); // ahora los protege la fila conflict:<id> (y la red de seguridad textual)
  await new Promise((res,rej)=>{const t=db.transaction('meta','readwrite');t.objectStore('meta').put({hash},'legacyHashes');t.oncomplete=res;t.onerror=()=>rej(t.error);});
  return {id:c.id,newResources:fresh};
 }

 // ── Rollback de datos (R1-D11): solo con confirmación y conservando TODO lo posterior ────────────────────────────────
 async function rollback({source,name=S.DB,confirm,storage=root.localStorage,hooks={}}){
  if(confirm!==true)throw new MigrationError('confirm-required','Volver al almacén anterior requiere tu confirmación explícita.');
  if(!await exists(root.indexedDB,name))throw new MigrationError('rollback-impossible','El almacén nuevo no se puede leer: no se pueden conservar los cambios posteriores. Usa la copia de emergencia.');
  const db=await S.open({name});
  try{
   await new Promise((res,rej)=>{const t=db.transaction('meta','readwrite');t.objectStore('meta').put({phase:'started',at:new Date().toISOString()},'rollback');t.oncomplete=res;t.onerror=()=>rej(t.error);});
   if(hooks.afterStart)await hooks.afterStart(db);
   // Cambios posteriores: documentos de v2 que difieren del legado y recursos de v2 que el legado no tiene.
   const r=await source.read(),{docs}=await S.load(db),keys=await S.resourceKeys(db),changes={docs:{},resources:{}};
   for(const [k,v] of docs)if(String(r.docs[k])!==v)changes.docs[k]=v;
   for(const k of keys)if(!(k in r.resources)){const v=await S.getResource(db,k);changes.resources[k]=v.bytes;}
   try{await source.writeBack(changes);
    const after=await source.read();
    for(const [k,v] of Object.entries(changes.docs))if(String(after.docs[k])!==v)throw new MigrationError('rollback-verify','No se pudo comprobar el documento «'+k+'» en el almacén anterior.');
    for(const [k,b] of Object.entries(changes.resources))if(!(after.resources[k] instanceof Blob)||await shaBlob(after.resources[k])!==await shaBlob(b))throw new MigrationError('rollback-verify','No se pudo comprobar el recurso «'+k+'» en el almacén anterior.');
   }catch(e){
    await new Promise(res=>{const t=db.transaction('meta','readwrite');t.objectStore('meta').delete('rollback');t.oncomplete=res;t.onerror=res;});
    throw e instanceof MigrationError&&e.code==='rollback-verify'?e:new MigrationError('rollback-aborted','No se ha podido volver al almacén anterior sin perder cambios ('+(e.message||e)+'). Todo sigue en el almacén nuevo; exporta una copia de emergencia.');}
   await new Promise((res,rej)=>{const t=db.transaction('meta','readwrite');const st=t.objectStore('meta');st.put({value:'legacy',at:new Date().toISOString()},'authority');st.put({phase:'done',at:new Date().toISOString(),docs:Object.keys(changes.docs),resources:Object.keys(changes.resources)},'rollback');st.put({epoch:1},'schemaEpoch');t.oncomplete=res;t.onerror=()=>rej(t.error);});
   storage.removeItem(SWITCHED);storage.removeItem(SWITCHING);root.FloorPlanSchemaEpoch?.announce(1,storage);
   return {status:'rolled-back',docs:Object.keys(changes.docs),resources:Object.keys(changes.resources),v2Kept:true};
  }finally{db.close();}
 }

 const api={SWITCHING,SWITCHED,LEASE_MS,MAX_ATTEMPTS,MigrationError,legacySource,toSnapshot,prepare,reserve,migrate,boot,rollback,_fenced:fenced};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanStoreV2Migrate=api;
})(typeof globalThis!=='undefined'?globalThis:this);
