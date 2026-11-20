/* F0.2 · Persistence authority (ADR de continuidad, contrato docs/contracts/expediente-v1.md §8 y docs/contracts/persistencia-v1.md).

   IndexedDB (`rubik-sota-persistence-v1`) becomes the ONE authority for the project library and the per-project documents
   (budgets, reviews, construction record). It does not introduce another engine: it stores, byte for byte, the same JSON
   strings that js/project-library.js, js/budget-core.js and the other modules already read and write under their
   localStorage keys, and offers them back through a Storage-shaped facade (getItem/setItem/removeItem). index.html already
   hands a storage object to FloorPlanLibrary.load, so wiring the editor is replacing that object (cut F0.2b).

   Guarantees and how they are met:
   - «Saved» only when the IndexedDB transaction completed (`oncomplete`, durability 'strict' where offered). Until then the
     session state is 'pending'/'saving'; a failure is 'error' and the unsaved changes stay in memory, never dropped.
   - Library + documents change in ONE transaction: coherent with each other by construction.
   - Concurrency: every commit carries the revision it was based on; inside the transaction (and under a Web Lock) a
     different stored revision means another tab committed first. Nothing is overwritten: the local changes are stored as a
     CONFLICT record (own object store, survives reloads, exportable) and the tab is told to reload.
   - Migration from localStorage: two phases, verified by SHA-256, repeatable after any interruption, and localStorage is
     never modified or deleted by it. The original values are also kept in the `legacy` store.
   - Downgrade: after every confirmed commit the authority is copied to localStorage behind a barrier (see writeMirror),
     so an older RUBIK sees either the latest confirmed state, complete and of one revision, or a library it rejects
     visibly; never a mixture. What an older version wrote is stored as a conflict record before being overwritten.
   - Emergency export of everything in memory, saved or not, as one JSON file.
   - Flushing does not depend on closing events: a short debounce after every change, plus `visibilitychange` (hidden)
     and `pagehide` as extra opportunities. */
(function(root){
 'use strict';
 const DB='rubik-sota-persistence-v1',LOCK='rubik-sota-persistence',CHANNEL='rubik-sota-persistence';
 const LIBRARY='rubik-sota-project-library-v1';
 // The keys under authority. Others (assistant log, UI preferences, the expediente journal) stay in localStorage.
 const KEYS=Object.freeze(['rubik-sota-floorplan-project-v1',LIBRARY,'rubik-budget-v1','rubik-review-v1','rubik-construction-v1']);
 const TOMBSTONE=JSON.stringify({version:0,entries:[],movedTo:'indexeddb:'+DB,note:'RUBIK guarda ahora en IndexedDB. Abre la versión actual o exporta el expediente.'});
 class PersistenceError extends Error{constructor(code,message,extra={}){super(message);this.name='PersistenceError';this.code=code;Object.assign(this,extra);}}
 const managed=k=>KEYS.includes(k),canLock=locks=>typeof locks?.request==='function';
 async function sha(text){const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return [...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,'0')).join('');}
 // SCULPT · openPlan3D (MIT, Juanmaes83/openPlan3D@771c9e1, datastore.ts mutateLibrary): the lock callback never
 // rejects (Firefox reports an immediately rejecting lock callback as uncaught); the outcome is rethrown outside.
 // Without Web Locks the compare-and-write inside the IndexedDB transaction is still atomic.
 const withLock=async(locks,fn)=>{if(!canLock(locks))return fn();
  const o=await locks.request(LOCK,async()=>{try{return {ok:true,value:await fn()};}catch(error){return {ok:false,error};}});if(!o.ok)throw o.error;return o.value;};
 // SCULPT · openPlan3D storageErrorMessage: also legacy code 22 and Firefox NS_ERROR_DOM_QUOTA_REACHED (1014).
 const describe=e=>e&&(e.name==='QuotaExceededError'||e.code===22||e.code===1014)?'no queda espacio de almacenamiento en este navegador'
  :e&&e.name==='SecurityError'?'el navegador no permite guardar datos de este sitio (revisa la configuración de privacidad)':(e&&e.message)||String(e);

 // The development candidate can be exercised only on its own loopback origin.
 const isTestOrigin=()=>root.location?.protocol==='http:'&&root.location.hostname==='f0-2b.localhost';
 function open({indexedDB:idb=root.indexedDB,name=DB,create=true}={}){
  return new Promise((resolve,reject)=>{
   // SCULPT · openPlan3D localDatabase.ts openDatabase: once blocked has been reported, a late upgrade is aborted and a
   // late success is closed, so a rejected open never leaves a connection that blocks other tabs.
   const r=idb.open(name,1);let blocked=false,missing=false;
   r.onupgradeneeded=()=>{if(!create){missing=true;r.transaction.abort();return;}if(blocked){r.transaction?.abort();return;}const db=r.result;for(const s of ['docs','meta','legacy'])db.createObjectStore(s);db.createObjectStore('conflicts',{autoIncrement:true});};
   r.onsuccess=()=>{const db=r.result;if(blocked){db.close();return;}db.onversionchange=()=>db.close();resolve(db);};
   r.onerror=()=>reject(missing?new PersistenceError('authority-missing','Abre el editor para preparar su biblioteca local.'):new PersistenceError('open-failed','No se pudo abrir el almacenamiento del navegador: '+describe(r.error),{cause:r.error}));
   r.onblocked=()=>{blocked=true;reject(new PersistenceError('open-blocked','Otra pestaña de RUBIK está bloqueando el almacenamiento. Ciérrala o recárgala; tus datos guardados no se han tocado.'));};
  });
 }
 // One transaction; resolves with fn's outcome ONLY when the transaction completed. fn may call `abort(outcome)`.
 function run(db,stores,mode,fn){
  return new Promise((resolve,reject)=>{
   let t;try{t=db.transaction(stores,mode,mode==='readwrite'?{durability:'strict'}:undefined);}catch(e){reject(new PersistenceError('write-failed','No se pudo iniciar el guardado: '+describe(e),{cause:e}));return;}
   let outcome,aborted=null;const s=Object.fromEntries(stores.map(n=>[n,t.objectStore(n)]));
   try{outcome=fn(s,o=>{aborted={value:o};t.abort();});}catch(e){aborted={error:e};try{t.abort();}catch{}}
   t.oncomplete=()=>resolve(typeof outcome==='function'?outcome():outcome);
   t.onabort=()=>{if(aborted&&'value'in aborted)resolve(aborted.value);else{const e=aborted?.error||t.error;reject(e instanceof PersistenceError?e:new PersistenceError('write-failed','No se ha guardado: '+describe(e),{cause:e}));}};
  });
 }
 const req=r=>new Promise((res,rej)=>{r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});
 async function readAll(db,store){const keys=await run(db,[store],'readonly',s=>{const k=s[store].getAllKeys(),v=s[store].getAll();return ()=>[k.result,v.result];});return new Map(keys[0].map((k,i)=>[k,keys[1][i]]));}
 async function meta(db,key){return run(db,['meta'],'readonly',s=>{const r=s.meta.get(key);return ()=>r.result;});}

 // ── Migration (idempotent, two phases, verified, localStorage untouched) ─────────────────────────────────────────
 async function migrate({db,storage,locks,hooks={}}){
  return withLock(locks,async()=>{
   const done=await meta(db,'migration');if(done?.phase==='done')return {status:'already',migration:done};
   const originals={},hashes={};for(const k of KEYS){const v=storage.getItem(k);if(v!==null)originals[k]=v;}
   for(const [k,v] of Object.entries(originals))hashes[k]=await sha(v);
   const at=new Date().toISOString();
   // Phase A: copy. Safe to repeat: until phase B nobody commits to the authority, so overwriting docs loses nothing.
   const copied=await run(db,['docs','legacy','meta'],'readwrite',s=>{
    let result;
    s.meta.get('migration').onsuccess=e=>{
     const prior=e.target.result;
     if(prior?.phase==='done'){result=prior;return;}
     // A competing opener can finish the same byte copy even without Web Locks.
     if(prior?.phase==='copied'&&KEYS.every(k=>prior.hashes[k]===hashes[k])){result=prior;return;}
     for(const k of KEYS){if(k in originals){s.docs.put(originals[k],k);s.legacy.put({value:originals[k],sha256:hashes[k],copiedAt:at},k);}else{s.docs.delete(k);s.legacy.delete(k);}}
     result={phase:'copied',hashes,at};s.meta.put(result,'migration');
    };
    return ()=>result;
   });
   if(copied.phase==='done')return {status:'already',migration:copied};
   if(hooks.afterCopy)await hooks.afterCopy();
   // Verification: what IndexedDB holds now is byte-identical to localStorage.
   const docs=await readAll(db,'docs'),legacy=await readAll(db,'legacy');
   let verified=true;
   for(const k of KEYS){const want=hashes[k]??null,got=docs.has(k)?await sha(docs.get(k)):null,orig=legacy.has(k)?legacy.get(k).sha256:null;
    if(got!==want||orig!==want)verified=false;}
   // Phase B: compare the copy and mark done in one transaction. Never reset a revision already in use.
   return run(db,['meta'],'readwrite',(s,abort)=>{
    let result;
    s.meta.get('migration').onsuccess=e=>{
     const current=e.target.result;
     if(current?.phase==='done'){result={status:'already',migration:current};return;}
     if(!verified||!KEYS.every(k=>current?.hashes?.[k]===hashes[k])){
      abort({status:'retry'});return;
     }
     const migration={phase:'done',hashes,at,doneAt:new Date().toISOString(),keys:Object.keys(originals)};
     s.meta.put(migration,'migration');s.meta.put({n:1,at:migration.doneAt,by:'migration'},'revision');s.meta.put({revision:1,hashes,ok:true},'mirror');
     result={status:'migrated',migration};
    };
    return ()=>result;
   }).then(result=>{if(result.status==='retry')throw new PersistenceError('migration-verify','La migración cambió durante la verificación. Recarga RUBIK para repetirla.');return result;});
  });
 }

 // The snapshot and its revision come from ONE readonly transaction: IndexedDB gives it a consistent view, so a commit
 // from another tab can never yield docs of one revision labelled with another (which would let a stale tab commit).
 async function load(db){return run(db,['docs','meta'],'readonly',s=>{const k=s.docs.getAllKeys(),v=s.docs.getAll(),r=s.meta.get('revision');
  return ()=>({revision:r.result?.n??0,docs:new Map(k.result.map((key,i)=>[key,v.result[i]]))});});}
 // Read-only consumers get one detached snapshot, without opening a writing session or migrating.
 async function readConfirmed(){
  const db=await open({create:false});
  try{
   const result=await load(db);
   if(!result.revision)throw new PersistenceError('authority-missing','Abre el editor para completar la migración de la biblioteca.');
   return result;
  }finally{db.close();}
 }
 async function saveConflict(db,record,id){return run(db,['conflicts'],'readwrite',s=>{const value={...record,at:new Date().toISOString()};delete value.id;const r=id===undefined?s.conflicts.add(value):s.conflicts.put(value,id);return ()=>r.result;});}
 async function conflicts(db){const all=await readAll(db,'conflicts');return [...all].map(([id,r])=>({id,...r}));}
 async function removeConflict(db,id){return run(db,['conflicts'],'readwrite',s=>{s.conflicts.delete(id);});}
 // Every image reference held by the authority or by any conflict record: those images must never be collected.
 function refsIn(text,out){if(typeof text!=='string')return;let v;try{v=JSON.parse(text);}catch{return;}(function walk(x){if(Array.isArray(x))x.forEach(walk);else if(x&&typeof x==='object'){if(x.storage&&typeof x.storage.ref==='string')out.add(x.storage.ref);for(const y of Object.values(x))walk(y);}})(v);}
 async function imageRefs(db){const out=new Set(),{docs}=await load(db);for(const v of docs.values())refsIn(v,out);for(const c of await conflicts(db))for(const v of Object.values(c.docs||{}))refsIn(v,out);return out;}

 // ── Commit (one transaction, optimistic revision under a Web Lock) ───────────────────────────────────────────────
 // On a revision conflict nothing is written to the authority and the record keeps the tab's COMPLETE state (`snapshot`:
 // every managed key as the tab sees it), not only the batch: library and documents stay coherent with each other.
 async function commit({db,locks,storage,baseRevision,changes,snapshot,tab='',mirror=true,hooks,recovery}){
  for(const k of Object.keys(changes))if(!managed(k))throw new PersistenceError('key-unmanaged',`«${k}» no está bajo la autoridad de persistencia.`);
  return withLock(locks,async()=>{
   const stores=recovery?['docs','meta','conflicts']:['docs','meta'];
   const r=await run(db,stores,'readwrite',(s,abort)=>{let out;
    function write(cur){
     for(const [k,v] of Object.entries(changes)){if(v===null)s.docs.delete(k);else s.docs.put(v,k);}
     const n=cur+1,at=new Date().toISOString();s.meta.put({n,at,by:tab},'revision');out={status:'saved',revision:n};
     if(recovery){
      const keep=s.conflicts.add({reason:'superseded',revision:cur,docs:recovery.docs,at});keep.onsuccess=()=>{out.superseded=keep.result;};
      s.conflicts.delete(recovery.id);
     }
    }
    s.meta.get('revision').onsuccess=e=>{const cur=e.target.result?.n??0;
     if(cur!==baseRevision){abort({status:'conflict',revision:cur});return;}
     if(!recovery){write(cur);return;}
     s.conflicts.get(recovery.id).onsuccess=event=>{
      const record=event.target.result;
      if(!record||record.at!==recovery.at||JSON.stringify(record.docs)!==recovery.source){
       abort({status:'recovery-changed'});return;
      }
      write(cur);
     };
    };
    return ()=>out;});
   if(r.status==='conflict'){
    if(recovery)return r;
    const id=await saveConflict(db,{reason:'revision',baseRevision,revision:r.revision,tab,changed:Object.keys(changes),docs:snapshot||changes});
    return {...r,conflictId:id};
   }
   if(r.status!=='saved')return r;
   // A compatibility-copy failure after oncomplete cannot undo or invalidate the authoritative commit.
   r.mirror=mirror&&storage?await writeMirror({db,storage,hooks,allowCopy:canLock(locks)})
    .catch(e=>({ok:false,message:'Guardado en IndexedDB. No se pudo verificar la copia para versiones anteriores: '+describe(e)})):null;
   return r;
  });
 }

 // ── Downgrade mirror (called with the persistence lock held) ─────────────────────────────────────────────────────
 // Protocol, so an older RUBIK never works silently on keys from different revisions:
 //  0. if localStorage changed since the last mirror (an older version wrote), those values are stored as a conflict
 //     record BEFORE anything is overwritten;
 //  1. barrier: the library key becomes the TOMBSTONE, which the older version refuses visibly;
 //  2. every other managed key is written from the authority (one consistent snapshot);
 //  3. the library key is written last: only then is localStorage a complete, single-revision copy.
 // An interruption or failure after 1 leaves the barrier in place; the next start (or commit) repeats the whole copy.
 async function writeMirror({db,storage,hooks={},allowCopy=true}){
  const m=await meta(db,'mirror')||{hashes:{}},{revision,docs}=await load(db);
  const diverged=await divergence(storage,m);let conflictId=null;
  if(diverged)conflictId=await saveConflict(db,{reason:'legacy-diverged',revision:m.revision,docs:diverged});
  const setMeta=v=>run(db,['meta'],'readwrite',s=>{s.meta.put(v,'mirror');});
  try{storage.setItem(LIBRARY,TOMBSTONE);}
  catch(e){
   // localStorage refuses even a smaller value (in practice: disabled or broken). Nothing else is written, so it keeps
   // the previous single-revision copy; the state says so.
   await setMeta({...m,ok:false,blocked:false,error:describe(e)}).catch(()=>{});
   return {ok:false,blocked:false,conflictId,message:'No se pudo actualizar ni bloquear la copia para versiones anteriores: '+describe(e)+'. Tus datos están guardados en IndexedDB; no abras una versión anterior.'};
  }
  const hashes={...m.hashes,[LIBRARY]:await sha(TOMBSTONE)};
  await setMeta({revision,hashes,ok:false,blocked:true,state:'writing'});
  if(!allowCopy)return {ok:false,blocked:true,conflictId,message:'Guardado en IndexedDB. La copia para versiones anteriores está bloqueada porque el navegador no permite coordinarla.'};
  try{
   if(hooks.afterBarrier)await hooks.afterBarrier();
   for(const k of KEYS){if(k===LIBRARY)continue;if(docs.has(k)){storage.setItem(k,docs.get(k));hashes[k]=await sha(docs.get(k));}else{storage.removeItem(k);delete hashes[k];}}
   if(docs.has(LIBRARY)){storage.setItem(LIBRARY,docs.get(LIBRARY));hashes[LIBRARY]=await sha(docs.get(LIBRARY));}
   else{storage.removeItem(LIBRARY);delete hashes[LIBRARY];}
   await setMeta({revision,hashes,ok:true,state:'done'});return {ok:true,conflictId};
  }catch(e){
   // The barrier stays: an older version refuses the library instead of opening a mixture of revisions.
   await setMeta({revision,hashes,ok:false,blocked:true,state:'writing',error:describe(e)}).catch(()=>{});
   return {ok:false,blocked:true,conflictId,message:'La copia para versiones anteriores no está al día ('+describe(e)+'); está bloqueada para que no se use. Tus datos están guardados en IndexedDB.'};
  }
 }
 async function divergence(storage,m){const changed={};let any=false;
  for(const k of KEYS){const v=storage.getItem(k),h=v===null?undefined:await sha(v);if(h!==m.hashes?.[k]){changed[k]=v;any=true;}}
  if(!any)return null;
  // A complete picture of what the older version left, not only the keys it changed.
  for(const k of KEYS)if(!(k in changed)){const v=storage.getItem(k);if(v!==null)changed[k]=v;}
  return changed;}
 // At start: record what an older version wrote and repair an interrupted or failed copy.
 async function checkLegacy({db,storage,locks,hooks}){
  return withLock(locks,async()=>{
   const m=await meta(db,'mirror');if(!m)return {diverged:[],mirror:null};
   if(m.ok&&!(await divergence(storage,m)))return {diverged:[],mirror:{ok:true}};
   const r=await writeMirror({db,storage,hooks,allowCopy:canLock(locks)});return {diverged:r.conflictId?[r.conflictId]:[],mirror:r};
  });
 }

 // ── Session: the synchronous view an editor tab uses ─────────────────────────────────────────────────────────────
 const TAB_LOCK='rubik-sota-tab:';
 async function session({indexedDB:idb,storage=root.localStorage,locks=root.navigator?.locks,channel=typeof BroadcastChannel==='function'?new BroadcastChannel(CHANNEL):null,debounceMs=250,tab=Math.random().toString(36).slice(2),onState=()=>{},hooks,gate=null,getImage=root.FloorPlanImages?.get,storagePermission=root.FloorPlanStoragePersistence}={}){
  let db;try{db=await open({indexedDB:idb});}catch(e){channel?.close();throw e;}
  let releaseTab=null,closed=false;
  let migration,legacy,revision,docs;
  try{
   migration=await migrate({db,storage,locks,hooks});
   legacy=await checkLegacy({db,storage,locks,hooks});
   ({revision,docs}=await load(db));
  }catch(e){channel?.close();db.close();throw e;}
  // Only a usable session participates in attachment collection.
  const shared=root.FloorPlanImages?.holdTab?.(locks);
  if(shared)tab=shared;
  else if(canLock(locks))locks.request(TAB_LOCK+tab,()=>closed?undefined:new Promise(r=>{releaseTab=r;})).catch(()=>{});
  // OP-07 S7: the last CONFIRMED docs, for the optional save gate ({check({changes,confirmed,restore}),committed(verdict)}).
  let confirmed=new Map(docs);
  const pending=new Map(),listeners=new Set([onState]);let chain=Promise.resolve(),timer=null,adopting=false,inFlight=null;
  const pendingCount=()=>new Set([...(inFlight?.keys()||[]),...pending.keys()]).size;
  const initialRevision=revision;
  const state={status:'saved',revision,pending:0,error:null,conflictId:null,outdated:false,mirror:legacy.mirror,migration:migration.status,diverged:legacy.diverged,persisted:null};
  const emit=patch=>{Object.assign(state,patch,{pending:pendingCount(),revision});for(const f of listeners)try{f({...state});}catch{}};
  const stopPermissionUpdates=storagePermission?.subscribe(persisted=>emit({persisted}));
  async function storageStatus(){
   const [,estimate]=await Promise.all([storagePermission?.checkStoragePersistence(),storagePermission?.estimate()]);
   return {persisted:storagePermission?.state??null,estimate:estimate??null};
  }
  const full=()=>Object.fromEntries(docs);
  const broadcast=()=>{try{channel?.postMessage({revision,tab});}catch{}};
  function schedule(){if(closed)return;if(state.status!=='conflict')emit({status:'pending'});clearTimeout(timer);timer=setTimeout(()=>{flush().catch(()=>{});},debounceMs);}
  function flush({userEvent,confirmExisting=false}={}){
   const userSave=userEvent?.isTrusted===true&&(userEvent.type==='click'||userEvent.type==='keydown');
   const save=async()=>{
    const before=revision,result=await doFlush(userSave);
    if(userSave&&confirmExisting&&result.status==='saved'&&!result.outdated&&revision>initialRevision&&revision===before){
     void meta(db,'revision').then(current=>{
      if(current?.n===before&&!closed) return storagePermission?.requestPersistentStorage({confirmedByUser:true});
     }).catch(()=>{});
    }
    return result;
   };
   chain=chain.then(save,save);return chain;
  }
  async function doFlush(userSave=false){
   clearTimeout(timer);if(closed)return {...state};
   // In conflict, every later change still reaches IndexedDB: the conflict record is rewritten with the full state.
   if(state.status==='conflict'){
    if(!pending.size)return {...state};
    const batch=new Map(pending);pending.clear();inFlight=batch;emit({});
    try{
     const prev=(await conflicts(db)).find(c=>c.id===state.conflictId)||{};
     await saveConflict(db,{...prev,docs:full(),updated:true},state.conflictId);
     inFlight=null;emit({error:new PersistenceError('conflict','Los cambios de esta pestaña están en una versión recuperable.')});
    }catch(e){
     inFlight=null;for(const [k,v] of batch)if(!pending.has(k))pending.set(k,v);
     emit({error:new PersistenceError('conflict-unsaved','Hay un conflicto y no se pudieron guardar los últimos cambios: '+describe(e)+'. Usa la exportación de emergencia.',{cause:e})});
    }
    return {...state};
   }
   if(!pending.size)return {...state};
   const batch=new Map(pending);pending.clear();inFlight=batch;emit({status:'saving'});
   // S7: a refused batch writes nothing; the changes stay in this tab (pending) and the reason is reported.
   const verdict=gate?gate.check({changes:Object.fromEntries(batch),confirmed:Object.fromEntries(confirmed),restore:false}):null;
   if(verdict&&!verdict.ok){inFlight=null;for(const [k,v] of batch)if(!pending.has(k))pending.set(k,v);
    emit({status:'error',error:new PersistenceError('guard-refused',verdict.message||'No se ha guardado: el cambio perdería información del muro.',{issues:verdict.issues})});return {...state};}
   try{
    // `full()` is read when the commit runs, so a conflict record includes changes made while a transaction was in flight.
    const r=await commit({db,locks,storage,baseRevision:revision,changes:Object.fromEntries(batch),snapshot:full(),tab,hooks});
    inFlight=null;
    if(r.status==='conflict'){
     emit({status:'conflict',conflictId:r.conflictId,outdated:true,error:new PersistenceError('conflict','Otra pestaña guardó antes. Tu trabajo completo (biblioteca y documentos) está guardado como conflicto recuperable; nada se ha sobrescrito. Recarga o recupera el conflicto.')});
     return pending.size?doFlush():{...state};
    }
    revision=r.revision;broadcast();
    for(const [k,v] of batch)if(v===null)confirmed.delete(k);else confirmed.set(k,v);gate?.committed?.(verdict);
    emit({status:pending.size?'pending':'saved',error:null,mirror:r.mirror});
    if(userSave)void storagePermission?.requestPersistentStorage({confirmedByUser:true});
    if(pending.size)schedule();
   }catch(e){
    inFlight=null;
    for(const [k,v] of batch)if(!pending.has(k))pending.set(k,v);
    emit({status:'error',error:e instanceof PersistenceError?e:new PersistenceError('write-failed','No se ha guardado: '+describe(e),{cause:e})});
   }
   return {...state};
  }
  if(channel)channel.onmessage=e=>{if(e.data?.tab!==tab&&e.data?.revision>revision)emit({outdated:true});};
  const onHide=()=>{if(root.document?.visibilityState==='hidden')flush();};
  root.document?.addEventListener('visibilitychange',onHide);root.addEventListener?.('pagehide',flush);
  const ensureEditing=()=>{if(adopting)throw new PersistenceError('recovering','Hay una recuperación en curso.');};
  const storageFacade={
   getItem:k=>managed(k)?(docs.has(k)?docs.get(k):null):storage.getItem(k),
   setItem(k,v){if(!managed(k))return storage.setItem(k,v);ensureEditing();v=String(v);if(docs.get(k)===v&&!pending.has(k))return;docs.set(k,v);pending.set(k,v);schedule();},
   removeItem(k){if(!managed(k))return storage.removeItem(k);ensureEditing();if(!docs.has(k))return;docs.delete(k);pending.set(k,null);schedule();},
   key:i=>storage.key(i),get length(){return storage.length;}
  };
  // A JSON file with every managed key as given, plus the bytes of every image it refers to.
  async function exportDocs(source,extra){const refs=new Set();for(const v of Object.values(source))refsIn(v,refs);const images={},missingImages=[];
   for(const ref of refs){try{const b=getImage&&await getImage(ref);if(!b){missingImages.push(ref);continue;}const u=new Uint8Array(await b.arrayBuffer());let s='';for(let i=0;i<u.length;i+=32768)s+=String.fromCharCode(...u.subarray(i,i+32768));images[ref]={type:b.type,base64:btoa(s)};}catch{missingImages.push(ref);}}
   return new Blob([JSON.stringify({format:'rubik-sota.emergency',version:1,exportedAt:new Date().toISOString(),...extra,docs:source,images,missingImages})],{type:'application/json'});}
  const find=async id=>{const c=(await conflicts(db)).find(x=>x.id===id);if(!c)throw new PersistenceError('conflict-missing','Ese conflicto ya no existe.');return c;};
  return {
   storage:storageFacade,flush,state:()=>({...state,pending:pendingCount(),revision}),subscribe:f=>{listeners.add(f);return ()=>listeners.delete(f);},
   conflicts:()=>conflicts(db),removeConflict:id=>removeConflict(db,id),
   emergencyExport:()=>exportDocs(full(),{revision,status:state.status,unsaved:Object.fromEntries([...(inFlight||[]),...pending])}),
   conflictExport:async id=>{const c=await find(id);return exportDocs(c.docs,{conflict:{id,reason:c.reason,baseRevision:c.baseRevision,revision:c.revision,at:c.at}});},
   // Keep the conflict's version: the current confirmed state is first stored as a conflict record ('superseded'), then
   // the conflict's complete state is committed in one transaction. Nothing is discarded either way.
   adoptConflict:async id=>{
    if(adopting)throw new PersistenceError('recovering','Hay una recuperación en curso.');
    adopting=true;
    try{
     const st=await flush();
     if(st.pending||st.status==='error'||st.error?.code==='conflict-unsaved')
      throw st.error||new PersistenceError('pending','Hay cambios pendientes. Exporta una copia de emergencia.');
     const c=await find(id),cur=await load(db);
     for(const k of Object.keys(c.docs))if(!managed(k))throw new PersistenceError('key-unmanaged','La versión contiene una clave fuera de la autoridad.');
     const changes=Object.fromEntries(KEYS.map(k=>[k,typeof c.docs[k]==='string'?c.docs[k]:null]));
     const verdict=gate?gate.check({changes,confirmed:Object.fromEntries(cur.docs),restore:true}):null;
     if(verdict&&!verdict.ok)throw new PersistenceError('guard-refused',verdict.message||'Esa versión no se puede recuperar sin perder información.',{issues:verdict.issues});
     const out=await commit({db,locks,storage,baseRevision:cur.revision,changes,tab,hooks,recovery:{id,at:c.at,source:JSON.stringify(c.docs),docs:Object.fromEntries(cur.docs)}});
     if(out.status!=='saved')throw new PersistenceError('conflict','Otra pestaña guardó mientras se recuperaba el conflicto; vuelve a intentarlo.');
     revision=out.revision;docs=new Map(Object.entries(changes).filter(([,v])=>v!==null));confirmed=new Map(docs);gate?.committed?.(verdict);broadcast();
     emit({status:'saved',conflictId:null,error:null,outdated:false,mirror:out.mirror});return {revision,superseded:out.superseded};
    }finally{adopting=false;}
   },
   storageStatus,
   currentRevision:async()=> (await meta(db,'revision'))?.n??0,
   close(){closed=true;clearTimeout(timer);releaseTab?.();stopPermissionUpdates?.();root.document?.removeEventListener('visibilitychange',onHide);root.removeEventListener?.('pagehide',flush);channel?.close();db.close();},
   db
  };
 }
 const api={DB,LOCK,CHANNEL,KEYS,TOMBSTONE,TAB_LOCK,PersistenceError,isTestOrigin,open,migrate,load,readConfirmed,commit,checkLegacy,conflicts,removeConflict,imageRefs,refsIn,session,sha};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanPersistence=api;
})(globalThis);
