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
   - Downgrade: after every confirmed commit the changed keys are mirrored to localStorage, so an older RUBIK sees the
     latest confirmed state, not a stale copy. If the mirror cannot be written, the library key is replaced by a marker
     the older version rejects visibly («No se pudo abrir la colección local…»), instead of letting it work silently on
     stale data; the data itself is in IndexedDB (docs + legacy). If an older version wrote to localStorage after the
     mirror, the next start stores those values as a conflict record ('legacy-diverged'): nothing is lost or overwritten.
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
 const managed=k=>KEYS.includes(k);
 async function sha(text){const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return [...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,'0')).join('');}
 const withLock=(locks,fn)=>locks&&typeof locks.request==='function'?locks.request(LOCK,fn):fn();
 const describe=e=>e&&e.name==='QuotaExceededError'?'no queda espacio de almacenamiento en este navegador':(e&&e.message)||String(e);

 function open({indexedDB:idb=root.indexedDB,name=DB}={}){
  return new Promise((resolve,reject)=>{
   const r=idb.open(name,1);
   r.onupgradeneeded=()=>{const db=r.result;for(const s of ['docs','meta','legacy'])db.createObjectStore(s);db.createObjectStore('conflicts',{autoIncrement:true});};
   r.onsuccess=()=>{const db=r.result;db.onversionchange=()=>db.close();resolve(db);};
   r.onerror=()=>reject(new PersistenceError('open-failed','No se pudo abrir el almacenamiento del navegador: '+describe(r.error),{cause:r.error}));
   r.onblocked=()=>reject(new PersistenceError('open-blocked','Otra pestaña de RUBIK está bloqueando el almacenamiento. Ciérrala o recárgala.'));
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
   const originals={},hashes={};for(const k of KEYS){const v=storage.getItem(k);if(v!==null){originals[k]=v;hashes[k]=await sha(v);}}
   const at=new Date().toISOString();
   // Phase A: copy. Safe to repeat: until phase B nobody commits to the authority, so overwriting docs loses nothing.
   await run(db,['docs','legacy','meta'],'readwrite',s=>{for(const k of KEYS){if(k in originals){s.docs.put(originals[k],k);s.legacy.put({value:originals[k],sha256:hashes[k],copiedAt:at},k);}else{s.docs.delete(k);s.legacy.delete(k);}}s.meta.put({phase:'copied',hashes,at},'migration');});
   if(hooks.afterCopy)await hooks.afterCopy();
   // Verification: what IndexedDB holds now is byte-identical to localStorage.
   const docs=await readAll(db,'docs'),legacy=await readAll(db,'legacy');
   for(const k of KEYS){const want=hashes[k]??null,got=docs.has(k)?await sha(docs.get(k)):null,orig=legacy.has(k)?legacy.get(k).sha256:null;
    if(got!==want||orig!==want)throw new PersistenceError('migration-verify',`La copia de «${k}» no coincide con el original; no se ha cambiado nada y se repetirá la migración.`);}
   // Phase B: mark done; from here IndexedDB is the authority. The mirror hashes describe localStorage as it is now.
   const migration={phase:'done',hashes,at,doneAt:new Date().toISOString(),keys:Object.keys(originals)};
   await run(db,['meta'],'readwrite',s=>{s.meta.put(migration,'migration');s.meta.put({n:1,at:migration.doneAt,by:'migration'},'revision');s.meta.put({revision:1,hashes,ok:true},'mirror');});
   return {status:'migrated',migration};
  });
 }

 async function load(db){const [docs,rev]=await Promise.all([readAll(db,'docs'),meta(db,'revision')]);return {revision:rev?.n??0,docs};}
 async function saveConflict(db,record){return run(db,['conflicts'],'readwrite',s=>{const r=s.conflicts.add({...record,at:new Date().toISOString()});return ()=>r.result;});}
 async function conflicts(db){const all=await readAll(db,'conflicts');return [...all].map(([id,r])=>({id,...r}));}
 async function removeConflict(db,id){return run(db,['conflicts'],'readwrite',s=>{s.conflicts.delete(id);});}

 // ── Commit (one transaction, optimistic revision under a Web Lock) ───────────────────────────────────────────────
 async function commit({db,locks,storage,baseRevision,changes,tab='',mirror=true}){
  for(const k of Object.keys(changes))if(!managed(k))throw new PersistenceError('key-unmanaged',`«${k}» no está bajo la autoridad de persistencia.`);
  return withLock(locks,async()=>{
   const r=await run(db,['docs','meta'],'readwrite',(s,abort)=>{let out;
    s.meta.get('revision').onsuccess=e=>{const cur=e.target.result?.n??0;
     if(cur!==baseRevision){abort({status:'conflict',revision:cur});return;}
     for(const [k,v] of Object.entries(changes)){if(v===null)s.docs.delete(k);else s.docs.put(v,k);}
     const n=cur+1;s.meta.put({n,at:new Date().toISOString(),by:tab},'revision');out={status:'saved',revision:n};};
    return ()=>out;});
   if(r.status==='conflict'){
    const id=await saveConflict(db,{reason:'revision',baseRevision,revision:r.revision,tab,changes});
    return {...r,conflictId:id};
   }
   r.mirror=mirror&&storage?await writeMirror(db,storage,changes,r.revision):null;
   return r;
  });
 }
 // Downgrade mirror. Best effort, never the authority, never hidden: the result says whether it is current.
 async function writeMirror(db,storage,changes,revision){
  const m=await meta(db,'mirror')||{hashes:{}},hashes={...m.hashes};
  try{for(const [k,v] of Object.entries(changes)){if(v===null){storage.removeItem(k);delete hashes[k];}else{storage.setItem(k,v);hashes[k]=await sha(v);}}
   await run(db,['meta'],'readwrite',s=>{s.meta.put({revision,hashes,ok:true},'mirror');});return {ok:true};}
  catch(e){
   // An older RUBIK must not work silently on a stale copy: make the library key unusable for it (it shows an error).
   let blocked=false;try{storage.setItem(LIBRARY,TOMBSTONE);hashes[LIBRARY]=await sha(TOMBSTONE);blocked=true;}catch{}
   await run(db,['meta'],'readwrite',s=>{s.meta.put({revision,hashes,ok:false,blocked,error:describe(e)},'mirror');}).catch(()=>{});
   return {ok:false,blocked,message:'La copia de compatibilidad para versiones anteriores no está al día: '+describe(e)+'. Tus datos están guardados en IndexedDB.'};
  }
 }
 // Values an older version wrote to localStorage after the last mirror are kept as a conflict record, never overwritten.
 async function checkLegacy({db,storage,locks}){
  return withLock(locks,async()=>{
   const m=await meta(db,'mirror');if(!m)return [];const changed={},hashes={...m.hashes};
   for(const k of KEYS){const v=storage.getItem(k),h=v===null?undefined:await sha(v);if(h!==m.hashes[k]){changed[k]=v;if(h===undefined)delete hashes[k];else hashes[k]=h;}}
   if(!Object.keys(changed).length)return [];
   const id=await saveConflict(db,{reason:'legacy-diverged',revision:m.revision,changes:changed});
   await run(db,['meta'],'readwrite',s=>{s.meta.put({...m,hashes},'mirror');});
   return [id];
  });
 }

 // ── Session: the synchronous view an editor tab uses ─────────────────────────────────────────────────────────────
 async function session({indexedDB:idb,storage=root.localStorage,locks=root.navigator?.locks,channel=typeof BroadcastChannel==='function'?new BroadcastChannel(CHANNEL):null,debounceMs=250,tab=Math.random().toString(36).slice(2),onState=()=>{},hooks}={}){
  const db=await open({indexedDB:idb});
  const migration=await migrate({db,storage,locks,hooks});
  const diverged=await checkLegacy({db,storage,locks});
  let {revision,docs}=await load(db);
  const pending=new Map(),listeners=new Set([onState]);let chain=Promise.resolve(),timer=null,stopped=false;
  const state={status:'saved',revision,pending:0,error:null,conflictId:null,outdated:false,mirror:null,migration:migration.status,diverged,persisted:null};
  const emit=patch=>{Object.assign(state,patch,{pending:pending.size,revision});for(const f of listeners)try{f({...state});}catch{}};
  function schedule(){if(stopped)return;emit({status:state.status==='conflict'?'conflict':'pending'});clearTimeout(timer);timer=setTimeout(()=>{flush().catch(()=>{});},debounceMs);}
  // One writer per tab, in order: a flush waits for the previous one and takes everything pending at that moment.
  function flush(){chain=chain.then(doFlush,doFlush);return chain;}
  async function doFlush(){
   clearTimeout(timer);if(!pending.size||stopped)return {...state};
   if(state.status==='conflict')return {...state};
   const batch=new Map(pending);pending.clear();emit({status:'saving'});
   try{
    const r=await commit({db,locks,storage,baseRevision:revision,changes:Object.fromEntries(batch),tab});
    if(r.status==='conflict'){
     // Nothing was written. The local changes are stored as a conflict record AND kept in memory.
     for(const [k,v] of batch)if(!pending.has(k))pending.set(k,v);stopped=true;
     emit({status:'conflict',conflictId:r.conflictId,outdated:true,error:new PersistenceError('conflict','Otra pestaña guardó antes. Tus cambios no se han perdido: están guardados como conflicto recuperable. Recarga para continuar.')});
     return {...state};
    }
    revision=r.revision;channel?.postMessage({revision,tab});
    emit({status:pending.size?'pending':'saved',error:null,mirror:r.mirror});
    if(pending.size)schedule();
   }catch(e){
    for(const [k,v] of batch)if(!pending.has(k))pending.set(k,v);
    emit({status:'error',error:e instanceof PersistenceError?e:new PersistenceError('write-failed','No se ha guardado: '+describe(e),{cause:e})});
   }
   return {...state};
  }
  if(channel)channel.onmessage=e=>{if(e.data?.tab!==tab&&e.data?.revision>revision)emit({outdated:true});};
  const onHide=()=>{if(root.document?.visibilityState==='hidden')flush();};
  root.document?.addEventListener('visibilitychange',onHide);root.addEventListener?.('pagehide',flush);
  const storageFacade={
   getItem:k=>managed(k)?(docs.has(k)?docs.get(k):null):storage.getItem(k),
   setItem(k,v){if(!managed(k))return storage.setItem(k,v);v=String(v);if(docs.get(k)===v&&!pending.has(k))return;docs.set(k,v);pending.set(k,v);schedule();},
   removeItem(k){if(!managed(k))return storage.removeItem(k);if(!docs.has(k))return;docs.delete(k);pending.set(k,null);schedule();},
   key:i=>storage.key(i),get length(){return storage.length;}
  };
  return {
   storage:storageFacade,flush,state:()=>({...state,pending:pending.size,revision}),subscribe:f=>{listeners.add(f);return ()=>listeners.delete(f);},
   conflicts:()=>conflicts(db),removeConflict:id=>removeConflict(db,id),
   // Everything this tab holds, confirmed or not, as one JSON file. Does not depend on IndexedDB working.
   emergencyExport:()=>new Blob([JSON.stringify({format:'rubik-sota.emergency',version:1,exportedAt:new Date().toISOString(),revision,status:state.status,unsaved:Object.fromEntries(pending),docs:Object.fromEntries(docs)})],{type:'application/json'}),
   requestPersist:async()=>{const s=root.navigator?.storage;const out={persisted:s?.persist?await s.persist().catch(()=>false):false,estimate:s?.estimate?await s.estimate().catch(()=>null):null};emit({persisted:out.persisted});return out;},
   close(){stopped=true;clearTimeout(timer);root.document?.removeEventListener('visibilitychange',onHide);root.removeEventListener?.('pagehide',flush);channel?.close();db.close();},
   db
  };
 }
 const api={DB,LOCK,CHANNEL,KEYS,TOMBSTONE,PersistenceError,open,migrate,load,commit,checkLegacy,conflicts,removeConflict,session,sha};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanPersistence=api;
})(globalThis);
