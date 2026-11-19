/* F0.2c · Etapa 2 · Copia de emergencia completa, verificada y restaurable (contrato R1: R1-D6, §6 paso 0 y requisito
   obligatorio 3 de §6 bis). AISLADO: ninguna página del producto lo carga; opera sobre el núcleo v2 (js/store-v2.js).

   Contenido: TODO lo que la autoridad v2 guarda —documentos, recursos (incluidas las fotos privadas de MUE-01 y los planos),
   referencias por titular, diario y conflictos— con un manifiesto SHA-256 por archivo y la huella del propio manifiesto.
   Es un producto SEPARADO de la exportación ordinaria y del expediente (que no incluyen fotos privadas): exige
   consentimiento explícito y su interfaz lo explica antes de generarla.

   Garantías:
     · una sola transacción de lectura: la copia es una revisión coherente;
     · verify(): detecta archivos incompletos (no se pueden leer), alterados (huella), ausentes, sobrantes y un manifiesto
       manipulado;
     · dryRun(): restauración de prueba EN SECO (lee, valida y reconstruye en memoria; no escribe nada);
     · restoreInto(): restaura solo en una base NUEVA y distinta de la original; nunca modifica los datos originales.
   Límite honesto (R1 §6 paso 0): el navegador no puede comprobar dónde se guarda el archivo descargado. */
(function(root){
 'use strict';
 const S=root.FloorPlanStoreV2,FORMAT='rubik-sota.emergency',VERSION=2;
 class BackupError extends Error{constructor(code,message,extra={}){super(message);this.name='BackupError';this.code=code;Object.assign(this,extra);}}
 const enc=new TextEncoder(),dec=new TextDecoder('utf-8',{fatal:true});
 async function sha(bytes){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');}
 function b64(u8){let s='';for(let i=0;i<u8.length;i+=32768)s+=String.fromCharCode(...u8.subarray(i,i+32768));return btoa(s);}
 function unb64(s){const bin=atob(s),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u;}
 const canonical=entries=>JSON.stringify(entries.map(e=>[e.path,e.sha256,e.size]));

 // Una sola transacción de lectura sobre todos los almacenes del núcleo.
 function snapshot(db){
  return new Promise((resolve,reject)=>{
   const t=db.transaction(['docs','resources','refs','journal','conflicts','meta'],'readonly'),got={};
   const ask=(n,q)=>{q.onsuccess=()=>{got[n]=q.result;};};
   ask('docKeys',t.objectStore('docs').getAllKeys());ask('docs',t.objectStore('docs').getAll());
   ask('resKeys',t.objectStore('resources').getAllKeys());ask('resources',t.objectStore('resources').getAll());
   ask('refs',t.objectStore('refs').getAll());
   ask('journalKeys',t.objectStore('journal').getAllKeys());ask('journal',t.objectStore('journal').getAll());
   ask('conflictKeys',t.objectStore('conflicts').getAllKeys());ask('conflicts',t.objectStore('conflicts').getAll());
   ask('revision',t.objectStore('meta').get('revision'));
   t.oncomplete=()=>resolve(got);t.onabort=t.onerror=()=>reject(new BackupError('read-failed','No se pudo leer el almacén: '+(t.error?.message||'error')));
  });
 }

 // ── Crear ───────────────────────────────────────────────────────────────────────────────────────────────────────────
 const consented=c=>c&&c.confirmed===true&&c.scope==='private-complete';
 async function create(db,{consent}={}){
  if(!consented(consent))throw new BackupError('consent-required','La copia completa incluye fotos privadas: hace falta tu confirmación explícita.');
  return fromSnapshot(await snapshot(db),{consent});
 }
 // La misma copia a partir de cualquier instantánea con la forma de snapshot() (lo usa la migración para copiar el almacén
 // legado ANTES de migrar: R1 §6 paso 0). Un solo formato, un solo verificador.
 async function fromSnapshot(s,{consent}={}){
  if(!consented(consent))throw new BackupError('consent-required','La copia completa incluye fotos privadas: hace falta tu confirmación explícita.');
  const files={},entries=[];
  const add=async(path,bytes,extra={})=>{const h=await sha(bytes);entries.push({path,sha256:h,size:bytes.length});files[path]={...extra,encoding:'base64',data:b64(bytes)};return h;};
  for(let i=0;i<s.docKeys.length;i++){if(typeof s.docs[i]!=='string')throw new BackupError('unreadable','El documento «'+s.docKeys[i]+'» no es legible: no se genera una copia incompleta.');
   await add('docs/'+s.docKeys[i],enc.encode(s.docs[i]));}
  const resources={};
  for(let i=0;i<s.resKeys.length;i++){const r=s.resources[i],bytes=new Uint8Array(await r.bytes.arrayBuffer()),h=await sha(bytes);
   if(h!==r.sha256)throw new BackupError('resource-integrity','El recurso «'+s.resKeys[i]+'» ya está dañado en este navegador (su huella no coincide). No se genera una copia que lo dé por bueno.',{key:s.resKeys[i]});
   await add('resources/'+s.resKeys[i],bytes);resources[s.resKeys[i]]={sha256:r.sha256,size:r.size,mediaType:r.mediaType,kind:r.kind,createdAt:r.createdAt};}
  await add('index/resources.json',enc.encode(JSON.stringify(resources)));
  await add('index/refs.json',enc.encode(JSON.stringify(s.refs)));
  await add('journal.json',enc.encode(JSON.stringify(s.journalKeys.map((k,i)=>[k,s.journal[i]]))));
  await add('conflicts.json',enc.encode(JSON.stringify(s.conflictKeys.map((k,i)=>[k,s.conflicts[i]]))));
  const manifestSha256=await sha(enc.encode(canonical(entries)));
  const counts={docs:s.docKeys.length,resources:s.resKeys.length,photos:s.resKeys.filter(k=>k.startsWith('mue01/')).length,
   refs:s.refs.length,journal:s.journalKeys.length,conflicts:s.conflictKeys.length};
  const archive={format:FORMAT,version:VERSION,createdAt:new Date().toISOString(),revision:s.revision?.n??0,private:true,counts,
   manifest:{algorithm:'SHA-256',entries,manifestSha256},files};
  return {blob:new Blob([JSON.stringify(archive)],{type:'application/json'}),manifestSha256,counts};
 }

 // ── Verificar ───────────────────────────────────────────────────────────────────────────────────────────────────────
 // Devuelve {ok, problems:[{code, path?, detail}], archive?}. Nunca lanza por un archivo malo: lo describe.
 async function verify(blob){
  const problems=[],bad=(code,detail,path)=>problems.push({code,detail,...(path?{path}:{})});
  let archive;
  try{archive=JSON.parse(await blob.text());}catch{bad('incomplete','El archivo está incompleto o no es una copia de RUBIK (no se puede leer).');return {ok:false,problems};}
  if(archive?.format!==FORMAT||archive.version!==VERSION){bad('format','No es una copia de emergencia completa de esta versión de RUBIK.');return {ok:false,problems};}
  const m=archive.manifest,files=archive.files||{};
  if(!m||!Array.isArray(m.entries)){bad('manifest-missing','Falta el manifiesto de huellas.');return {ok:false,problems};}
  if(await sha(enc.encode(canonical(m.entries)))!==m.manifestSha256)bad('manifest-mismatch','El manifiesto fue modificado: su huella no coincide.');
  const listed=new Set();
  for(const e of m.entries){listed.add(e.path);const f=files[e.path];
   if(!f){bad('missing-entry','Falta un archivo del manifiesto.',e.path);continue;}
   let bytes;try{bytes=f.encoding==='base64'?unb64(f.data):enc.encode(f.data);}catch{bad('corrupt','Un archivo está dañado y no se puede decodificar.',e.path);continue;}
   if(bytes.length!==e.size)bad('size-mismatch','Un archivo tiene un tamaño distinto del registrado (incompleto o alterado).',e.path);
   else if(await sha(bytes)!==e.sha256)bad('sha256-mismatch','Un archivo fue alterado: su huella no coincide.',e.path);}
  for(const p of Object.keys(files))if(!listed.has(p))bad('unlisted-entry','Hay un archivo que no figura en el manifiesto.',p);
  return {ok:!problems.length,problems,archive};
 }

 // ── Restauración de prueba EN SECO: valida y reconstruye en memoria; no escribe nada ────────────────────────────────
 async function dryRun(blob){
  const v=await verify(blob);if(!v.ok)return {ok:false,problems:v.problems};
  const a=v.archive,problems=[...v.problems],read=p=>dec.decode(unb64(a.files[p].data));
  const docs={},resources=JSON.parse(read('index/resources.json')),refs=JSON.parse(read('index/refs.json'));
  for(const p of Object.keys(a.files).filter(p=>p.startsWith('docs/'))){const text=read(p),key=p.slice(5);
   if(!S.refsOf(text))problems.push({code:'doc-unreadable',path:p,detail:'Un documento no es JSON válido.'});docs[key]=text;}
  for(const k of Object.keys(resources)){const f=a.files['resources/'+k];
   if(!f){problems.push({code:'resource-missing',path:'resources/'+k,detail:'Falta un recurso del índice.'});continue;}
   if((a.manifest.entries.find(e=>e.path==='resources/'+k)||{}).sha256!==resources[k].sha256)problems.push({code:'resource-index',path:'resources/'+k,detail:'El índice de recursos no coincide con el manifiesto.'});}
  // Toda referencia explícita de un documento tiene su fila; las que apuntan a recursos ausentes se informan (no es un error
  // de la copia: ya faltaban en el origen).
  const absent=new Set();
  for(const [k,text] of Object.entries(docs)){const own=new Set(refs.filter(r=>r.holder==='doc:'+k).map(r=>r.resourceKey));
   for(const r of S.refsOf(text)||[]){if(!own.has(r))problems.push({code:'ref-missing-row',path:'docs/'+k,detail:'Una referencia del documento no tiene fila.'});if(!(r in resources))absent.add(r);}}
  const journal=JSON.parse(read('journal.json')),conflicts=JSON.parse(read('conflicts.json'));
  const counts={docs:Object.keys(docs).length,resources:Object.keys(resources).length,photos:Object.keys(resources).filter(k=>k.startsWith('mue01/')).length,refs:refs.length,journal:journal.length,conflicts:conflicts.length};
  const declared=JSON.stringify(a.counts),rebuilt=JSON.stringify(counts);
  if(declared!==rebuilt)problems.push({code:'counts',detail:'Los totales declarados no coinciden con el contenido.'});
  return {ok:!problems.length,problems,counts,revision:a.revision,absentResources:[...absent],plan:{docs,resources,refs,journal,conflicts}};
 }

 // ── Restaurar en una base NUEVA (nunca sobre la original) ──────────────────────────────────────────────────────────
 async function restoreInto(blob,{name}){
  if(!name||name===S.DB)throw new BackupError('restore-target','La restauración solo se hace en una base nueva y distinta de la original.');
  if(typeof indexedDB.databases==='function'&&(await indexedDB.databases()).some(d=>d.name===name))throw new BackupError('restore-target','Ya existe una base con ese nombre: no se sobrescribe.');
  const d=await dryRun(blob);if(!d.ok)throw new BackupError('restore-invalid','La copia no supera la restauración de prueba.',{problems:d.problems});
  const a=(await verify(blob)).archive,db=await S.open({name});
  try{
   await new Promise((resolve,reject)=>{const t=db.transaction(['docs','resources','refs','journal','conflicts','meta'],'readwrite',{durability:'strict'});
    for(const [k,v] of Object.entries(d.plan.docs))t.objectStore('docs').put(v,k);
    for(const [k,r] of Object.entries(d.plan.resources)){const bytes=unb64(a.files['resources/'+k].data);
     t.objectStore('resources').put({bytes:new Blob([bytes],{type:r.mediaType}),sha256:r.sha256,size:r.size,mediaType:r.mediaType,kind:r.kind,createdAt:r.createdAt},k);}
    for(const r of d.plan.refs)t.objectStore('refs').put(r);
    for(const [k,v] of d.plan.journal)t.objectStore('journal').put(v,k);
    for(const [k,v] of d.plan.conflicts)t.objectStore('conflicts').put(v,k);
    t.objectStore('meta').put({n:a.revision,at:new Date().toISOString(),by:'restore'},'revision');
    t.oncomplete=resolve;t.onabort=t.onerror=()=>reject(new BackupError('restore-failed','No se pudo restaurar: '+(t.error?.message||'error')+'. La base original no se ha tocado.'));});
   // La base restaurada se vuelve a exportar y debe producir las mismas huellas de contenido.
   const again=await create(db,{consent:{confirmed:true,scope:'private-complete'}});
   const same=JSON.stringify(a.manifest.entries.map(e=>[e.path,e.sha256]).sort())===JSON.stringify((await verify(again.blob)).archive.manifest.entries.map(e=>[e.path,e.sha256]).sort());
   if(!same)throw new BackupError('restore-mismatch','La base restaurada no coincide con la copia.');
   return {status:'restored',name,counts:d.counts};
  }finally{db.close();}
 }

 // ── Interfaz (UX-FIRST · Perla): consentimiento explícito antes de generar; verificación inmediata después ───────────
 function openDialog(db,{download=defaultDownload}={}){
  const css=`.v2bk{max-width:560px;border:1px solid var(--line,#c9cfd2);border-radius:12px;padding:20px 22px;color:var(--ink,#1f2326);background:var(--surface-panel,#fff)}
   .v2bk::backdrop{background:rgba(0,0,0,.35)}.v2bk h2{margin:0 0 8px;font-size:1.1rem}.v2bk p{margin:6px 0}
   .v2bk .v2bk-risk{background:var(--warn-soft,#fff4dc);border-left:4px solid var(--warn,#7a5200);padding:8px 10px;border-radius:6px}
   .v2bk label{display:flex;gap:8px;align-items:flex-start;margin:12px 0;font-weight:600}
   .v2bk .v2bk-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
   .v2bk .v2bk-primary{background:var(--action,#1f5a66);border-color:var(--action-pressed,#174650);color:var(--action-ink,#fff);font-weight:600}
   .v2bk .v2bk-primary:disabled{opacity:.55}.v2bk .btn:focus-visible,.v2bk input:focus-visible{outline:3px solid var(--focus,#1f5a66);outline-offset:2px}
   .v2bk [data-state=ok]{color:var(--success,#2f6e4a)}.v2bk [data-state=error]{color:var(--danger,#a3261b)}.v2bk .v2bk-status:empty{display:none}`;
  if(!document.getElementById('v2bkStyle')){const st=document.createElement('style');st.id='v2bkStyle';st.textContent=css;document.head.append(st);}
  const dlg=document.createElement('dialog');dlg.className='v2bk';dlg.id='v2BackupDialog';dlg.setAttribute('aria-labelledby','v2bkTitle');
  dlg.innerHTML=`<h2 id="v2bkTitle">Copia de emergencia completa</h2>
   <p>Guarda en un solo archivo <b>todo</b> lo que RUBIK tiene en este navegador: proyectos, presupuestos, observaciones, obra, imágenes de planos y <b>las fotos de tus muebles</b>.</p>
   <p class="v2bk-risk" role="note">Contiene fotos privadas. Quien tenga el archivo podrá verlas. Se guarda solo donde tú elijas; RUBIK no lo envía a ningún sitio.</p>
   <p>Es distinta de «Exportar proyecto»: aquella no incluye fotos privadas y sirve para compartir; esta sirve para recuperar tu trabajo.</p>
   <label><input type="checkbox" id="v2bkConsent"> Entiendo que la copia incluye fotos privadas y la guardaré en un lugar seguro.</label>
   <div class="v2bk-actions"><button type="button" class="btn v2bk-primary" id="v2bkCreate" disabled>Descargar copia completa</button><button type="button" class="btn" id="v2bkCancel">Cancelar</button></div>
   <p class="v2bk-status" id="v2bkStatus" role="status" aria-live="polite"></p>`;
  document.body.append(dlg);
  const consent=dlg.querySelector('#v2bkConsent'),create_=dlg.querySelector('#v2bkCreate'),status=dlg.querySelector('#v2bkStatus');
  consent.onchange=()=>{create_.disabled=!consent.checked;};
  dlg.querySelector('#v2bkCancel').onclick=()=>dlg.close();
  create_.onclick=async()=>{create_.disabled=true;status.dataset.state='busy';status.textContent='Preparando y comprobando la copia…';
   try{const out=await create(db,{consent:{confirmed:consent.checked,scope:'private-complete'}});
    const v=await dryRun(out.blob);
    if(!v.ok)throw new BackupError('verify-failed','La copia generada no supera la comprobación ('+v.problems[0].detail+')');
    download(out.blob,'rubik-copia-completa-'+new Date().toISOString().slice(0,10)+'.json');
    status.dataset.state='ok';
    status.textContent=`Copia comprobada: ${v.counts.docs} documentos, ${v.counts.resources} archivos (${v.counts.photos} fotos de muebles). Huella: ${out.manifestSha256.slice(0,12)}…`
     +(v.absentResources.length?` Aviso: ${v.absentResources.length} imágenes citadas ya faltaban en este navegador; la copia no puede recuperarlas.`:'')
     +' Tus datos en este navegador no han cambiado.';
   }catch(e){status.dataset.state='error';
    status.textContent='No se ha descargado ninguna copia. '+e.message+' Tus datos en este navegador no han cambiado. Vuelve a intentarlo; si se repite, usa «Exportar proyecto» para guardar al menos los proyectos.';
    create_.disabled=!consent.checked;}};
  dlg.showModal();consent.focus();return dlg;
 }
 function defaultDownload(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}

 const api={FORMAT,VERSION,BackupError,snapshot,create,fromSnapshot,verify,dryRun,restoreInto,openDialog};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanStoreV2Backup=api;
})(typeof globalThis!=='undefined'?globalThis:this);
