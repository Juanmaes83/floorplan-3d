/* F0.2c · Etapa 1 · Núcleo de la autoridad única transaccional (contrato docs/contracts/persistencia-f0-2c-r1.md §4).
   AISLADO: ninguna página del producto carga este archivo ni abre `rubik-sota-store-v2`. Solo lo usan las pruebas con datos
   sintéticos. No migra, no conmuta y no toca ningún almacén existente (persistence-v1, images-v1, localStorage).

   Una sola base y una sola transacción para todo lo que debe ser coherente entre sí:
     docs       clave gestionada → cadena JSON (byte a byte, como hoy)
     resources  resourceKey → {bytes:Blob, sha256, size, mediaType, kind, createdAt}   (R1-D8: SHA-256 obligatorio)
     refs       [resourceKey, holder] → {resourceKey, holder, at}; holder = doc:<k> | conflict:<id> | journal:<id> |
                pending:<op> | session:<tab> | legacy:unclaimed
     journal    id → registro del diario del expediente
     conflicts  id (autoincremental) → {reason, docs, at, …}
     meta       revision, schemaEpoch, …
   Reglas (R1 §4):
     1. confirmación atómica: documentos, recursos nuevos y filas de referencia en la MISMA transacción readwrite;
     2. operaciones en vuelo: los bytes se guardan con un titular pending:<op> en la misma transacción; la confirmación lo
        sustituye por doc:<k>; una cancelación comprobada lo retira;
     3. recogida: UNA transacción readwrite; solo borra recursos sin ninguna fila de referencia y que, además, no aparezcan
        como texto en ningún documento, conflicto o diario (red de seguridad de P0, R1-D4); un registro ilegible aborta;
     4. historial de todas las sesiones activas (R1-D9): filas session:<tab>; solo se retiran las de pestañas cuyo
        lock `rubik-sota-tab:<tab>` ya no existe;
     5. cada escritura lee la época (A0) dentro de su transacción. */
(function(root){
 'use strict';
 const DB='rubik-sota-store-v2',STORES=['docs','resources','refs','journal','conflicts','meta'];
 class StoreError extends Error{constructor(code,message,extra={}){super(message);this.name='StoreError';this.code=code;Object.assign(this,extra);}}
 const KEY_RE=/^[\w.:\/-]{1,200}$/;

 function open({indexedDB:idb=root.indexedDB,name=DB}={}){
  return new Promise((resolve,reject)=>{
   const r=idb.open(name,1);
   r.onupgradeneeded=()=>{const db=r.result;
    db.createObjectStore('docs');db.createObjectStore('resources');db.createObjectStore('journal');db.createObjectStore('meta');
    db.createObjectStore('conflicts',{autoIncrement:true});
    const refs=db.createObjectStore('refs',{keyPath:['resourceKey','holder']});refs.createIndex('byHolder','holder');refs.createIndex('byResource','resourceKey');};
   r.onsuccess=()=>{const db=r.result;db.onversionchange=()=>{db.close();root.FloorPlanSchemaEpoch?.markOutdated('versionchange');};resolve(db);};
   r.onerror=()=>reject(new StoreError('open-failed','No se pudo abrir el almacén: '+(r.error?.message||r.error)));
   r.onblocked=()=>reject(new StoreError('open-blocked','Otra pestaña mantiene abierta una versión anterior del almacén.'));
  });
 }

 // Una transacción; con readwrite, la época (A0) se comprueba DENTRO, antes de la primera escritura.
 function run(db,stores,mode,fn){
  const E=root.FloorPlanSchemaEpoch,gate=mode==='readwrite';
  if(gate&&!stores.includes('meta'))stores=[...stores,'meta'];
  return new Promise((resolve,reject)=>{
   let t;try{t=db.transaction(stores,mode,gate?{durability:'strict'}:undefined);}catch(e){reject(new StoreError('tx-failed',e.message));return;}
   const s=Object.fromEntries(stores.map(n=>[n,t.objectStore(n)]));let outcome,failure=null;
   const fail=e=>{failure=e;try{t.abort();}catch{}};
   const body=()=>{try{outcome=fn(s,fail);}catch(e){fail(e);}};
   if(!gate)body();
   else s.meta.get('schemaEpoch').onsuccess=e=>{
    let st=E?E.read():{state:'ok'};if(st.state==='ok'&&E)st=E.fromMeta(e.target.result);
    else if(!E){const v=e.target.result;st=v===undefined||v?.epoch===1?{state:'ok'}:{state:Number.isInteger(v?.epoch)&&v.epoch>1?'outdated':'indeterminate'};}
    if(st.state!=='ok'){E?.force(st);fail(new StoreError('schema-'+st.state,E?E.error(st).message:'Esta pestaña no puede escribir.'));return;}
    body();};
   t.oncomplete=()=>resolve(typeof outcome==='function'?outcome():outcome);
   t.onabort=()=>reject(failure instanceof Error?failure:new StoreError(failure?.code||'tx-aborted',failure?.message||t.error?.message||'Transacción cancelada.',failure||{}));
  });
 }
 const req=r=>new Promise((res,rej)=>{r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});
 // Un error dentro de un callback de IndexedDB aborta la transacción por la vía controlada (fail), no como excepción suelta.
 const safe=(fail,fn)=>(...a)=>{try{return fn(...a);}catch(e){fail(e);}};
 async function sha256(blob){const b=await blob.arrayBuffer();return [...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(x=>x.toString(16).padStart(2,'0')).join('');}

 // ── Referencias explícitas de un documento (las que el contrato de cada función declara) ─────────────────────────────
 // Plano: sourceImages[].storage.ref (o id). MUE-01: extensions['x-mue01-furniture-photo'].items[].photo.imageKey.
 // Cualquier otra cita queda cubierta por la red de seguridad textual de la recogida (R1-D4).
 function refsOf(text){
  const out=new Set();let v;try{v=JSON.parse(text);}catch{return null;} // null = ilegible
  (function walk(x){if(Array.isArray(x))return x.forEach(walk);if(!x||typeof x!=='object')return;
   if(x.storage&&typeof x.storage.ref==='string')out.add(x.storage.ref);
   if(typeof x.imageKey==='string')out.add(x.imageKey);
   for(const y of Object.values(x))walk(y);})(v);
  if(v&&Array.isArray(v.sourceImages))for(const im of v.sourceImages)if(im&&!im.storage?.ref&&typeof im.id==='string')out.add(im.id);
  return out;
 }

 // Prepara recursos fuera de la transacción (el hash es asíncrono): SHA-256 obligatorio y comprobado.
 async function prepare(resources=[]){
  const out=[];
  for(const r of resources){
   if(!r||!KEY_RE.test(r.key||''))throw new StoreError('resource-key','Clave de recurso no válida.');
   if(!(r.bytes instanceof Blob))throw new StoreError('resource-bytes','El recurso «'+r.key+'» no tiene bytes.');
   const sha=await sha256(r.bytes);if(r.sha256&&r.sha256!==sha)throw new StoreError('resource-sha256','La huella de «'+r.key+'» no coincide con sus bytes.');
   out.push({key:r.key,value:{bytes:r.bytes,sha256:sha,size:r.bytes.size,mediaType:r.bytes.type||r.mediaType||'application/octet-stream',kind:r.kind||'resource',createdAt:new Date().toISOString()}});
  }
  return out;
 }

 // Reemplaza en la transacción las filas de un titular por las de `keys` (solo las de recursos existentes o nuevos).
 // Las filas se escriben TAMBIÉN para recursos que aún no existen: si sus bytes llegan después (otra pestaña, una
 // restauración), ya están protegidos. La ausencia se informa a quien confirma, nunca se ignora en silencio.
 function setHolder(s,holder,keys){
  const at=new Date().toISOString();
  s.refs.index('byHolder').openCursor(IDBKeyRange.only(holder)).onsuccess=e=>{const c=e.target.result;
   if(c){if(!keys.has(c.value.resourceKey))c.delete();c.continue();return;}
   for(const k of keys)s.refs.put({resourceKey:k,holder,at});};
 }
 // Escribe recursos sin sobrescribir nunca en silencio: misma clave y misma huella → no hace nada (idempotente); misma
 // clave y huella distinta → la transacción entera se aborta (`resource-conflict`). Llama a `then` cuando termina.
 function putResources(s,prepared,fail,then){
  let left=prepared.length;if(!left){then();return;}
  for(const p of prepared){const q=s.resources.get(p.key);q.onsuccess=safe(fail,()=>{const cur=q.result;
   if(cur&&cur.sha256!==p.value.sha256){fail(new StoreError('resource-conflict','Ya existe otro recurso con la clave «'+p.key+'» y una huella distinta: no se sobrescribe.',{key:p.key}));return;}
   if(!cur)s.resources.put(p.value,p.key);if(--left===0)then();});}
 }

 // ── Confirmación atómica (regla 1) ──────────────────────────────────────────────────────────────────────────────────
 // changes: {clave: cadena|null}; resources: [{key, bytes, sha256?, mediaType?, kind?}]; ops: operaciones en vuelo que esta
 // confirmación cierra (sus filas pending:<op> se retiran en la MISMA transacción, una vez escritas las doc:<k>).
 // session: {tab, keys}: filas session:<tab> del historial de la pestaña, en la MISMA transacción que el cambio (R1-D9):
 // quitar una foto del documento y protegerla por el deshacer ocurre a la vez; no hay instante en que quede huérfana.
 async function commit(db,{baseRevision,changes={},resources=[],ops=[],session=null,by=''}){
  const prepared=await prepare(resources),refsByDoc={};
  for(const [k,v] of Object.entries(changes)){if(v===null){refsByDoc[k]=new Set();continue;}
   if(typeof v!=='string')throw new StoreError('doc-type','El documento «'+k+'» debe ser una cadena JSON.');
   const r=refsOf(v);if(!r)throw new StoreError('doc-unreadable','El documento «'+k+'» no es JSON válido.');refsByDoc[k]=r;}
  return run(db,['docs','resources','refs','meta'],'readwrite',(s,fail)=>{
   let out;
   s.meta.get('revision').onsuccess=safe(fail,e=>{const cur=e.target.result?.n??0;
    if(cur!==baseRevision){fail(new StoreError('conflict','Otra pestaña guardó antes.',{revision:cur}));return;}
    putResources(s,prepared,fail,()=>s.resources.getAllKeys().onsuccess=safe(fail,ev=>{
     // Una referencia a un recurso inexistente se registra igualmente (protege bytes que lleguen después) y se informa.
     const known=new Set(ev.target.result),missing=new Set();
     for(const [k,v] of Object.entries(changes)){if(v===null)s.docs.delete(k);else s.docs.put(v,k);
      for(const r of refsByDoc[k])if(!known.has(r))missing.add(r);setHolder(s,'doc:'+k,refsByDoc[k]);}
     if(session)setHolder(s,'session:'+session.tab,new Set(session.keys));
     for(const op of ops)s.refs.index('byHolder').openCursor(IDBKeyRange.only('pending:'+op)).onsuccess=c=>{const cur2=c.target.result;if(cur2){cur2.delete();cur2.continue();}};
     const n=cur+1,at=new Date().toISOString();s.meta.put({n,at,by},'revision');
     out={status:'saved',revision:n,missing:[...missing]};}));
   });
   return ()=>out;
  });
 }

 // ── Operaciones en vuelo (regla 2) ──────────────────────────────────────────────────────────────────────────────────
 async function stage(db,op,resources){
  if(!KEY_RE.test(op))throw new StoreError('op','Identificador de operación no válido.');
  const prepared=await prepare(resources);
  return run(db,['resources','refs'],'readwrite',(s,fail)=>{const at=new Date().toISOString();
   putResources(s,prepared,fail,()=>{for(const p of prepared)s.refs.put({resourceKey:p.key,holder:'pending:'+op,at});});
   return {status:'staged',keys:prepared.map(p=>p.key)};});
 }
 const cancel=(db,op)=>run(db,['refs'],'readwrite',s=>{s.refs.index('byHolder').openCursor(IDBKeyRange.only('pending:'+op)).onsuccess=e=>{const c=e.target.result;if(c){c.delete();c.continue();}};return {status:'cancelled'};});

 // ── Historial de sesiones (regla 4, R1-D9) ──────────────────────────────────────────────────────────────────────────
 // Serializada con la recogida por IndexedDB (ambas readwrite sobre refs): o entra antes y protege, o entra después y
 // informa qué recursos ya no existen (`missing`); nunca afirma proteger algo que no está.
 const holdSession=(db,tab,keys)=>run(db,['refs','resources'],'readwrite',s=>{let missing=[];s.resources.getAllKeys().onsuccess=e=>{const have=new Set(e.target.result);missing=keys.filter(k=>!have.has(k));setHolder(s,'session:'+tab,new Set(keys));};return ()=>({status:'held',missing});});
 async function releaseDeadSessions(db,locks=root.navigator?.locks){
  if(typeof locks?.query!=='function')return {released:[]}; // sin Web Locks nadie retira filas de otra pestaña
  const alive=new Set((await locks.query()).held.map(l=>l.name).filter(n=>n?.startsWith('rubik-sota-tab:')).map(n=>n.slice('rubik-sota-tab:'.length)));
  return run(db,['refs'],'readwrite',s=>{const released=new Set();
   s.refs.openCursor().onsuccess=e=>{const c=e.target.result;if(!c)return;const h=c.value.holder;
    if(h.startsWith('session:')&&!alive.has(h.slice(8))){released.add(h.slice(8));c.delete();}c.continue();};
   return ()=>({released:[...released]});});
 }

 // ── Diario y conflictos (titulares journal:<id> y conflict:<id>) ────────────────────────────────────────────────────
 function journalPut(db,id,record){const text=JSON.stringify(record);const keys=refsOf(text);
  return run(db,['journal','refs','resources'],'readwrite',s=>{s.journal.put(record,id);s.resources.getAllKeys().onsuccess=e=>setHolder(s,'journal:'+id,keys);return {status:'saved'};});}
 const journalDelete=(db,id)=>run(db,['journal','refs'],'readwrite',s=>{s.journal.delete(id);setHolder(s,'journal:'+id,new Set());return {status:'deleted'};});
 function conflictAdd(db,record){const keys=new Set();for(const v of Object.values(record.docs||{})){const r=typeof v==='string'?refsOf(v):null;if(r)for(const k of r)keys.add(k);}
  return run(db,['conflicts','refs','resources'],'readwrite',s=>{let id;const q=s.conflicts.add({...record,at:new Date().toISOString()});
   q.onsuccess=()=>{id=q.result;s.resources.getAllKeys().onsuccess=e=>setHolder(s,'conflict:'+id,keys);};return ()=>({id});});}

 // ── Recogida transaccional (regla 3) ────────────────────────────────────────────────────────────────────────────────
 function collect(db){
  return run(db,['docs','resources','refs','journal','conflicts','meta'],'readwrite',(s,fail)=>{
   let result={removed:[]};
   if(root.FloorPlanSchemaEpoch?.read().state&&root.FloorPlanSchemaEpoch.read().state!=='ok'){fail(new StoreError('schema-blocked','Recogida detenida por A0.'));return;}
   // Todas las lecturas y los borrados ocurren dentro de esta transacción (callbacks de IndexedDB, sin promesas).
   const got={},names=['resources','refs','docs','journal','conflicts'];let pending=names.length;
   for(const n of names){const q=n==='resources'?s.resources.getAllKeys():s[n].getAll();q.onsuccess=safe(fail,()=>{got[n]=q.result;if(--pending===0)decide();});}
   function decide(){
    const held=new Set(got.refs.map(r=>r.resourceKey)),open=got.resources.filter(k=>!held.has(k));if(!open.length)return;
    const texts=[];
    for(const d of got.docs){if(typeof d!=='string'){fail(new StoreError('unreadable','Un documento no es legible: no se borra nada.'));return;}texts.push(d);}
    for(const x of [...got.journal,...got.conflicts]){try{texts.push(JSON.stringify(x));}catch{fail(new StoreError('unreadable','Un registro no es legible: no se borra nada.'));return;}}
    const M=root.FloorPlanImages?.mentioned;const named=M?M(open,texts):new Set(open.filter(k=>texts.some(x=>x.includes(k))));
    for(const k of open)if(!named.has(k)){s.resources.delete(k);result.removed.push(k);}
   }
   return ()=>result;
  });
 }

 // ── Lecturas ────────────────────────────────────────────────────────────────────────────────────────────────────────
 async function load(db){return run(db,['docs','meta'],'readonly',s=>{const k=s.docs.getAllKeys(),v=s.docs.getAll(),r=s.meta.get('revision');
  return ()=>({revision:r.result?.n??0,docs:new Map(k.result.map((key,i)=>[key,v.result[i]]))});});}
 // Lee un recurso y comprueba su huella (R1-D8): unos bytes alterados no se entregan como válidos.
 async function getResource(db,key){const v=await run(db,['resources'],'readonly',s=>{const q=s.resources.get(key);return ()=>q.result;});
  if(!v)return null;const sha=await sha256(v.bytes);if(sha!==v.sha256)throw new StoreError('resource-integrity','Los bytes de «'+key+'» no coinciden con su huella.');return v;}
 const refs=db=>run(db,['refs'],'readonly',s=>{const q=s.refs.getAll();return ()=>q.result;});
 const resourceKeys=db=>run(db,['resources'],'readonly',s=>{const q=s.resources.getAllKeys();return ()=>q.result;});

 const api={DB,STORES,StoreError,open,refsOf,commit,stage,cancel,holdSession,releaseDeadSessions,journalPut,journalDelete,conflictAdd,collect,load,getResource,refs,resourceKeys,sha256};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanStoreV2=api;
})(typeof globalThis!=='undefined'?globalThis:this);
