/* IndexedDB stores original bytes only. No uploads, remote refs or data URLs in project JSON. */
(function(root){
 let db;
 function open(){if(!db)db=new Promise((resolve,reject)=>{const r=indexedDB.open('rubik-sota-images-v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('images');r.onsuccess=()=>resolve(r.result);r.onerror=()=>{db=null;reject(Error('No se pudo abrir el almacenamiento de imágenes.'));};});return db;}
 async function transact(mode,fn){const database=await open();return new Promise((resolve,reject)=>{const tx=database.transaction('images',mode),store=tx.objectStore('images');let result;try{result=fn(store);}catch(e){tx.abort();reject(e);return;}tx.oncomplete=()=>resolve(result?.result);tx.onerror=()=>reject(Error('No se pudo guardar o leer la imagen: revisa el espacio disponible.'));tx.onabort=()=>reject(Error('Operación de imágenes cancelada; no se ha guardado.'));});}
 /* F0.2 · Safe image collection. Deleting «every key this tab cannot see» deleted legitimate images: a tab only knows the
    library it loaded, an image is written BEFORE the project that refers to it is committed (imports, expediente restore,
    another tab) and localStorage reaches other tabs late. Three independent protections:
    1. it runs under the restore's Web Lock (`rubik-sota-expediente`), so it never interleaves with a restore in progress;
    2. `live()` is asked AFTER the lock is held and must read the stored state fresh (persistence authority or storage),
       and every image listed in a recovery-journal record counts as live;
    3. When exactly this tab holds its presence lock, unreferenced keys can be removed. Otherwise a pass
       only marks them. A commit that lands in between un-marks a key by referring to it.
    4. the grace period is NOT the guarantee for work held elsewhere: images referenced by the persistence authority or
       by any of its conflict records count as live, and nothing is swept while another RUBIK tab is open (each tab
       holds a `rubik-sota-tab:` Web Lock; another tab may hold unsaved work this one cannot see). Without Web Locks
       nothing is ever swept, only marked. */
 const GC_KEY='rubik-sota-images-gc-v1',GC_LOCK='rubik-sota-expediente',GRACE_MS=10*60*1000,JOURNAL='rubik-expediente-journal-v1:';
 function plan({keys,live,marks,now,graceMs=GRACE_MS}){
  const remove=[],next={};
  for(const key of keys){if(live.has(key))continue;const seen=Number.isFinite(marks[key])?marks[key]:null;if(seen!==null&&now-seen>=graceMs)remove.push(key);else next[key]=seen??now;}
  return {remove,marks:next};
 }
 const TAB_LOCK='rubik-sota-tab:';let ownTab=null;
 // SCULPT · openPlan3D (MIT, datastore.ts mutateLibrary): Firefox can report a rejecting lock callback as uncaught.
 async function lockSafely(locks,name,fn){const o=await locks.request(name,async()=>{try{return {ok:true,value:await fn()};}catch(error){return {ok:false,error};}});if(!o.ok)throw o.error;return o.value;}
 // Held for the life of the page: tells other tabs' collection that this tab may hold unsaved work.
 function holdTab(locks=globalThis.navigator?.locks){if(ownTab||!locks?.request)return ownTab;ownTab=Math.random().toString(36).slice(2);locks.request(TAB_LOCK+ownTab,()=>new Promise(()=>{})).catch(()=>{});return ownTab;}
 // References held by the persistence authority (docs and conflict records), when this page has it and it exists.
 async function authorityRefs(){const P=globalThis.FloorPlanPersistence;if(!P||root.FloorPlanPersistenceEditor&&!root.FloorPlanPersistenceEditor.session)return [];
  if(typeof indexedDB.databases==='function'&&!(await indexedDB.databases()).some(d=>d.name===P.DB))return [];
  const db=await P.open();try{return [...await P.imageRefs(db)];}finally{db.close();}}
 function readMarks(storage){try{const v=JSON.parse(storage.getItem(GC_KEY));return v&&typeof v==='object'&&!Array.isArray(v)?v:{};}catch{return {};}}
 function journalImages(storage){const out=[];for(let i=0;i<storage.length;i++){const k=storage.key(i);if(typeof k==='string'&&k.startsWith(JOURNAL))try{const r=JSON.parse(storage.getItem(k));if(Array.isArray(r?.images))out.push(...r.images);}catch{}}return out;}
 async function collect({live,storage,locks=globalThis.navigator?.locks,now=()=>Date.now()}){
  const canLock=typeof locks?.request==='function';
  const run=async()=>{
   const keys=await api.keys(),refs=new Set([...await live(),...journalImages(storage),...await authorityRefs()]);
   let sweep=false;
   if(canLock&&ownTab&&typeof locks.query==='function'){
    const tabs=(await locks.query()).held.filter(l=>l.name?.startsWith(TAB_LOCK));
    sweep=tabs.length===1&&tabs[0].name===TAB_LOCK+ownTab;
   }
   const result=sweep
    ?{remove:keys.filter(key=>!refs.has(key)),marks:{}}
    :plan({keys,live:refs,marks:readMarks(storage),now:now(),graceMs:Infinity});
   if(result.remove.length)await api.remove(result.remove);
   if(Object.keys(result.marks).length)storage.setItem(GC_KEY,JSON.stringify(result.marks));else storage.removeItem(GC_KEY);
   return {removed:result.remove,marked:Object.keys(result.marks),sweep};
  };
  return canLock?lockSafely(locks,GC_LOCK,run):run();
 }
 const api={get:key=>transact('readonly',s=>s.get(key)),put:entries=>transact('readwrite',s=>{for(const [key,blob]of entries)s.put(blob,key);}),remove:keys=>transact('readwrite',s=>{for(const key of keys)s.delete(key);}),keys:()=>transact('readonly',s=>s.getAllKeys()),collect,plan,holdTab,lockSafely,GC_KEY,GC_LOCK,GRACE_MS,TAB_LOCK};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanImages=api;
})(globalThis);
