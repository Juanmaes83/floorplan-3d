/* A0 · Puerta de escritores (contrato F0.2c R1, docs/contracts/persistencia-f0-2c-r1.md §3).
   Ninguna migración de esquema es segura mientras una pestaña pueda seguir escribiendo en el formato anterior sin que se
   note. A0 no migra nada ni cambia ninguna versión de IndexedDB: solo hace que esta versión de RUBIK
     1. sepa en qué época de esquema escribe (CURRENT) y la compare, antes de escribir, con la vigente:
        · el marcador de `localStorage` (KEY), que cualquier versión con A0 lee de forma síncrona antes de cada escritura;
        · `meta.schemaEpoch` de la autoridad de persistencia, leído DENTRO de la transacción de confirmación
          (js/persistence-store.js, commit), de modo que una conmutación concurrente nunca deja escrituras mezcladas;
     2. deje de escribir —sin perder nada— si la época vigente es mayor (pestaña desactualizada) o no se puede leer
        (estado indeterminado: se falla cerrado). Los cambios quedan en esta pestaña y se pueden exportar;
     3. cierre sus conexiones IndexedDB cuando otra pestaña necesite subir la versión de una base (onversionchange), en
        lugar de bloquearla, y pase a «desactualizada»;
     4. se entere de los cambios de otras pestañas (evento `storage` y BroadcastChannel) y lo explique (UX-FIRST, Perla);
     5. registre qué épocas de escritor se han visto (`writersSeen`), la evidencia que exige la convivencia de R1-D1.
   Sin A0 (versiones ya publicadas) nada de esto se cumple: F0.2c lo cubre con un almacén de otro nombre, la detección de
   divergencias del legado y no borrar nunca el legado (R1 §5 y §6 bis). */
(function(root){
 'use strict';
 const CURRENT=1,KEY='rubik-sota-schema-epoch-v1',SEEN='rubik-sota-writers-seen-v1',CHANNEL='rubik-sota-schema',SEEN_EVERY_MS=60000;
 const listeners=new Set();let forced=null,lastSeen=0,last=null;

 // ── Estado ─────────────────────────────────────────────────────────────────────────────────────────────────────────
 // Marcador ausente: nadie ha anunciado otra época, la vigente es esta. Ilegible o inválido: indeterminado (fallo cerrado).
 function parse(raw){
  if(raw===null||raw===undefined)return {state:'ok',epoch:CURRENT};
  let v;try{v=typeof raw==='string'?JSON.parse(raw):raw;}catch{return {state:'indeterminate',reason:'marker-unreadable'};}
  if(!v||typeof v!=='object'||!Number.isInteger(v.epoch)||v.epoch<1)return {state:'indeterminate',reason:'marker-invalid'};
  return v.epoch>CURRENT?{state:'outdated',epoch:v.epoch,reason:'epoch'}:{state:'ok',epoch:v.epoch};
 }
 function read(storage=root.localStorage){
  if(forced)return forced;
  let raw;try{raw=storage?.getItem(KEY);}catch{return {state:'indeterminate',reason:'storage-unreadable'};}
  return parse(raw??null);
 }
 // `meta.schemaEpoch` de la autoridad, ya leído dentro de una transacción.
 const fromMeta=value=>forced||parse(value===undefined?null:value);
 const MESSAGES={
  outdated:'Esta pestaña usa una versión anterior de RUBIK y ya no puede guardar. Tus cambios siguen en esta pestaña.',
  indeterminate:'RUBIK no puede comprobar con qué versión se guardan tus datos y no guarda nada para no dañarlos. Tus cambios siguen en esta pestaña.'};
 function error(s){const e=new Error(MESSAGES[s.state]);e.name='SchemaEpochError';e.code='schema-'+s.state;e.reason=s.reason;e.epoch=s.epoch;return e;}
 // Lanza (y avisa) si esta pestaña no debe escribir. Lo llaman todos los escritores antes de escribir.
 function check(storage){const s=read(storage);if(s.state!=='ok'){emit(s);throw error(s);}return s;}
 const writable=storage=>read(storage).state==='ok';
 // Una conexión IndexedDB se cerró porque otra pestaña sube la versión de la base: esta pestaña queda desactualizada.
 function markOutdated(reason='versionchange'){if(forced?.state==='outdated')return;forced={state:'outdated',reason};emit(forced);}
 // La autoridad respondió dentro de su transacción con una época mayor o ilegible: esta pestaña queda así hasta recargar.
 function force(s){if(s.state==='ok'||forced?.state==='outdated')return;forced={state:s.state,reason:s.reason,epoch:s.epoch};emit(forced);}

 // ── Evidencia de convivencia (R1-D1): qué épocas han escrito y cuándo ───────────────────────────────────────────────
 function recordWriter(storage=root.localStorage,now=Date.now()){
  if(now-lastSeen<SEEN_EVERY_MS)return;lastSeen=now;
  try{let all={};try{const v=JSON.parse(storage.getItem(SEEN));if(v&&typeof v==='object'&&!Array.isArray(v))all=v;}catch{}
   all[CURRENT]=new Date(now).toISOString();storage.setItem(SEEN,JSON.stringify(all));}catch{}
 }

 // ── Puerta sobre un Storage (origen normal: localStorage es la autoridad de las cinco claves) ─────────────────────────
 // Si esta pestaña no puede escribir, lo que se iba a guardar queda en memoria (y se lee de ahí), nunca en el almacén.
 // No lanza: como la sesión de F0.2b, retiene el cambio y avisa (aviso persistente), sin romper a quien llama.
 function guardStorage(storage){
  const overlay=new Map(),DELETED=Symbol('deleted');
  const facade={
   getItem(k){if(overlay.has(k)){const v=overlay.get(k);return v===DELETED?null:v;}return storage.getItem(k);},
   setItem(k,v){v=String(v);if(writable(storage)&&!overlay.size){storage.setItem(k,v);recordWriter(storage);return;}overlay.set(k,v);emit(read(storage));},
   removeItem(k){if(writable(storage)&&!overlay.size){storage.removeItem(k);recordWriter(storage);return;}overlay.set(k,DELETED);emit(read(storage));},
   key:i=>storage.key(i),get length(){return storage.length;},
   // Cambios retenidos en esta pestaña (para la exportación de emergencia).
   pending:()=>Object.fromEntries([...overlay].map(([k,v])=>[k,v===DELETED?null:v])),
   guarded:true};
  return facade;
 }

 // ── Coordinación entre pestañas ─────────────────────────────────────────────────────────────────────────────────────
 function emit(s){const key=JSON.stringify(s);if(key===last)return;last=key;for(const f of [...listeners])try{f(s);}catch{}}
 function subscribe(f){listeners.add(f);return ()=>listeners.delete(f);}
 function reevaluate(){emit(read());}
 const channel=typeof BroadcastChannel==='function'?new BroadcastChannel(CHANNEL):null;
 if(channel){channel.onmessage=()=>reevaluate();channel.unref?.();} // unref: no mantiene vivo un proceso de Node (pruebas)
 root.addEventListener?.('storage',e=>{if(e.key===KEY||e.key===null)reevaluate();});
 // Solo para F0.2c (conmutación) y pruebas: anuncia una época nueva a todas las pestañas. A0 no la llama.
 function announce(epoch,storage=root.localStorage){storage.setItem(KEY,JSON.stringify({epoch,at:new Date().toISOString()}));channel?.postMessage({epoch});reevaluate();}

 // ── Interfaz (UX-FIRST: qué ocurrió, por qué, dónde, cómo resolverlo, alternativa segura y estado de los datos; Perla) ──
 function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
 async function emergencyBlob(){
  const R=root.FloorPlanPersistenceEditor;
  if(R?.session)return R.session.emergencyExport();
  const st=R?.storage,keys=root.FloorPlanPersistence?.KEYS||[],docs={};
  for(const k of keys){try{const v=st?st.getItem(k):root.localStorage.getItem(k);if(v!==null)docs[k]=v;}catch{}}
  return new Blob([JSON.stringify({format:'rubik-sota.emergency',version:1,exportedAt:new Date().toISOString(),reason:'schema-'+(read().state),docs,unsaved:st?.pending?.()||{},
   note:'Copia de emergencia de los datos de proyecto de esta pestaña. Las imágenes y fotos siguen en este navegador; esta copia no las incluye.'})],{type:'application/json'});
 }
 // Huella de todo lo que la pestaña tiene sin guardar: proyecto en pantalla y cambios retenidos (puerta o sesión).
 function changeStamp(){const R=root.FloorPlanPersistenceEditor;let s='';
  try{s+=JSON.stringify(root.FloorPlanApp?.project??null);}catch{}
  try{s+=JSON.stringify(R?.storage?.pending?.()??null);}catch{}
  try{const st=R?.session?.state?.();s+=JSON.stringify([st?.pending,st?.revision]);for(const k of root.FloorPlanPersistence?.KEYS||[])s+=String(R.session.storage.getItem(k));}catch{}
  return s;}
 let banner=null;
 function style(){if(document.getElementById('a0Style'))return;const s=document.createElement('style');s.id='a0Style';
  s.textContent=`.a0-banner{position:fixed;inset:12px 12px auto 12px;z-index:2147483000;max-width:760px;margin:0 auto;padding:16px 18px;border-radius:10px;
   background:var(--warn-soft,#fff4dc);color:var(--ink,#1d2124);border:1px solid var(--warn,#7a5200);box-shadow:0 8px 28px rgba(0,0,0,.18);font:inherit}
   .a0-banner[data-state=indeterminate]{background:var(--danger-soft,#fbe9e7);border-color:var(--danger,#a3261b)}
   .a0-banner h2{margin:0 0 6px;font-size:1.05rem;display:flex;gap:8px;align-items:center}
   .a0-banner p{margin:4px 0}.a0-banner .a0-data{font-weight:600}.a0-banner .a0-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
   .a0-banner .a0-msg:empty{display:none}
   .a0-banner .a0-primary{background:var(--action,#1f5a66);border-color:var(--action-pressed,#174650);color:var(--action-ink,#fff);font-weight:600}
   .a0-banner .btn:focus-visible{outline:3px solid var(--focus,#1f5a66);outline-offset:2px}`;document.head.append(s);}
 function render(s){
  if(typeof document==='undefined'||!document.body)return;
  if(s.state==='ok'){banner?.remove();banner=null;return;}
  style();
  if(!banner){banner=document.createElement('section');banner.className='a0-banner';banner.id='a0Banner';banner.setAttribute('role','alert');banner.setAttribute('aria-labelledby','a0Title');document.body.append(banner);}
  banner.dataset.state=s.state;banner.replaceChildren();
  const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;banner.append(n);return n;};
  const outdated=s.state==='outdated';
  const h=el('h2');h.id='a0Title';const icon=document.createElement('span');icon.setAttribute('aria-hidden','true');icon.textContent=outdated?'⟳':'⚠';
  h.append(icon,document.createTextNode(outdated?'Esta pestaña ya no puede guardar':'RUBIK ha dejado de guardar para proteger tus datos'));
  el('p',null,outdated
   ?(s.reason==='versionchange'?'Otra pestaña de RUBIK está actualizando el almacenamiento de este navegador.':'Otra pestaña ha abierto una versión más nueva de RUBIK, que guarda los datos de otra forma.')
   :'No se puede leer qué versión de RUBIK guarda los datos en este navegador.');
  el('p',null,outdated?'Si esta pestaña siguiera guardando, mezclaría tu trabajo con el formato nuevo.':'Guardar sin saberlo podría dañar tu trabajo.');
  el('p','a0-data','Estado de tus datos: lo ya guardado está intacto. Los cambios que hagas ahora se quedan en esta pestaña hasta que la recargues.');
  el('p',null,outdated?'Qué hacer: exporta una copia de emergencia y recarga RUBIK; la versión nueva abrirá tu trabajo guardado.'
   :'Qué hacer: exporta una copia de emergencia y recarga RUBIK. Si el aviso vuelve, cierra las demás pestañas de RUBIK y vuelve a abrirlo.');
  const msg=el('p','a0-msg','');msg.setAttribute('role','status');
  const actions=el('div','a0-actions');
  const btn=(label,cls,fn)=>{const b=document.createElement('button');b.type='button';b.className=cls;b.textContent=label;
   b.onclick=async()=>{b.disabled=true;msg.textContent='';try{await fn();}catch(e){msg.textContent=e.message;}finally{b.disabled=false;}};actions.append(b);return b;};
  // La copia exportada solo autoriza recargar mientras nada haya cambiado después: se guarda la huella de lo exportado.
  let exported=null;
  btn('Exportar copia de emergencia','btn a0-primary',async()=>{const at=changeStamp();download(await emergencyBlob(),'rubik-copia-emergencia.json');exported=at;msg.textContent='Copia descargada. Ya puedes recargar RUBIK.';});
  btn('Recargar RUBIK','btn',()=>{
   const pending=Object.keys(root.FloorPlanPersistenceEditor?.storage?.pending?.()||{}).length||root.FloorPlanPersistenceEditor?.session?.state?.().pending;
   const covered=exported!==null&&exported===changeStamp();
   if(pending&&!covered&&!confirm(exported!==null?'Has hecho cambios después de exportar la copia de emergencia y no están en ella. Si recargas, se perderán. ¿Recargar de todos modos?':'Hay cambios que solo están en esta pestaña. Si recargas sin exportar la copia de emergencia, se perderán. ¿Recargar de todos modos?'))return;
   location.reload();});
 }
 subscribe(render);

 const api={CURRENT,KEY,SEEN,CHANNEL,parse,read,fromMeta,check,writable,error,markOutdated,force,recordWriter,guardStorage,subscribe,announce,
  _reset(){forced=null;last=null;lastSeen=0;}};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanSchemaEpoch=api;
})(typeof globalThis!=='undefined'?globalThis:this);
