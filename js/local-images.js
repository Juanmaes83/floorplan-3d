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
    3. mark and sweep: an unreferenced key is only MARKED; a later pass deletes it if it is still unreferenced `graceMs`
       after the mark. A commit that lands in between un-marks it by referring to it. */
 const GC_KEY='rubik-sota-images-gc-v1',GC_LOCK='rubik-sota-expediente',GRACE_MS=10*60*1000,JOURNAL='rubik-expediente-journal-v1:';
 function plan({keys,live,marks,now,graceMs=GRACE_MS}){
  const remove=[],next={};
  for(const key of keys){if(live.has(key))continue;const seen=Number.isFinite(marks[key])?marks[key]:null;if(seen!==null&&now-seen>=graceMs)remove.push(key);else next[key]=seen??now;}
  return {remove,marks:next};
 }
 function readMarks(storage){try{const v=JSON.parse(storage.getItem(GC_KEY));return v&&typeof v==='object'&&!Array.isArray(v)?v:{};}catch{return {};}}
 function journalImages(storage){const out=[];for(let i=0;i<storage.length;i++){const k=storage.key(i);if(typeof k==='string'&&k.startsWith(JOURNAL))try{const r=JSON.parse(storage.getItem(k));if(Array.isArray(r?.images))out.push(...r.images);}catch{}}return out;}
 async function collect({live,storage,locks=globalThis.navigator?.locks,now=()=>Date.now(),graceMs=GRACE_MS}){
  const run=async()=>{
   const keys=await api.keys(),refs=new Set([...await live(),...journalImages(storage)]),result=plan({keys,live:refs,marks:readMarks(storage),now:now(),graceMs});
   if(result.remove.length)await api.remove(result.remove);
   if(Object.keys(result.marks).length)storage.setItem(GC_KEY,JSON.stringify(result.marks));else storage.removeItem(GC_KEY);
   return {removed:result.remove,marked:Object.keys(result.marks)};
  };
  return locks&&typeof locks.request==='function'?locks.request(GC_LOCK,run):run();
 }
 const api={get:key=>transact('readonly',s=>s.get(key)),put:entries=>transact('readwrite',s=>{for(const [key,blob]of entries)s.put(blob,key);}),remove:keys=>transact('readwrite',s=>{for(const key of keys)s.delete(key);}),keys:()=>transact('readonly',s=>s.getAllKeys()),collect,plan,GC_KEY,GC_LOCK,GRACE_MS};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanImages=api;
})(globalThis);
