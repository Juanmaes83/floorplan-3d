/* F0.3 · Almacenamiento persistente del navegador (SCULPT de openPlan3D@771c9e1, src/lib/services/storagePersistence.ts,
   MIT © 2026 theLodgeStudio; copia fiel en labs/sculpt/openplan3d-771c9e1/ de la rama sculpt/openplan3d-fuente).
   KEEP: el algoritmo del donante, probado (132/132 en su baseline):
     · se pide UNA vez por navegador y solo después de una acción de la persona que haya CONFIRMADO trabajo (Firefox
       muestra un aviso; Chromium y Safari deciden sin preguntar);
     · se recuerda antes de preguntar (recargar con el aviso de Firefox abierto no vuelve a preguntar);
     · nunca rechaza y ningún guardado lo espera;
     · una concesión no se deshace con la respuesta tardía de una comprobación anterior;
     · se recomienda una copia mientras el navegador no promete conservar los datos.
   GENERALISE: sin Svelte (estado con oyentes) y con el entorno inyectable (navegador, almacenamiento) para probarlo.
   REPLACE: claves de RUBIK. Añadido: estimate() (uso y cuota), que pide el ADR de persistencia.
   «persist()» y «durability» son peticiones al navegador, no garantías (contrato persistencia-v1 §11).
   El editor NO lo usa todavía: F0.2b lo llamará tras un commit() confirmado de persistence-store.
   UMD: window.FloorPlanStoragePersistence / module.exports.create(env). */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanStoragePersistence=api.create();})(typeof self!=='undefined'?self:this,function(){
 'use strict';
 const PERSIST_REQUESTED_KEY='rubik-sota-persist-requested',STORAGE_NOTE_DISMISSED_KEY='rubik-sota-storage-note-dismissed';
 function create(env={}){
  const nav=()=>{try{return env.navigator!==undefined?env.navigator:(typeof navigator==='undefined'?undefined:navigator);}catch{return undefined;}};
  const store=()=>{try{return env.localStorage!==undefined?env.localStorage:(typeof localStorage==='undefined'?undefined:localStorage);}catch{return undefined;}};
  const manager=()=>{try{return nav()?.storage??undefined;}catch{return undefined;}};
  // Activación de la persona: un guardado hecho mientras carga la página, antes de cualquier clic o tecla, no pregunta.
  const interacted=()=>{try{return nav()?.userActivation?.hasBeenActive??true;}catch{return true;}};
  const remembered=k=>{try{return store()?.getItem(k)!=null;}catch{return false;}};
  const remember=k=>{try{store()?.setItem(k,'true');}catch{/* el estado en memoria sigue valiendo en esta página */}};
  // Estado: true (el navegador conserva), false (puede borrarlo para liberar espacio), null (no se sabe), undefined (sin comprobar).
  let state,asked=false,dismissedHere=false;const listeners=new Set();
  const set=v=>{state=v;for(const f of listeners)try{f(v);}catch{}};
  async function requestPersistentStorage(){
   if(asked)return undefined;
   try{const s=manager();
    if(typeof s?.persist!=='function'){asked=true;return null;}
    if(!interacted())return undefined;
    asked=true;
    if(remembered(PERSIST_REQUESTED_KEY))return undefined;
    if(typeof s.persisted==='function'&&(await s.persisted())===true){set(true);return true;}
    remember(PERSIST_REQUESTED_KEY); // antes de preguntar
    const granted=(await s.persist())===true;set(granted);return granted;
   }catch{asked=true;return null;}}
  async function checkStoragePersistence(){
   let result=null;try{const s=manager();if(typeof s?.persisted==='function')result=(await s.persisted())===true;}catch{result=null;}
   set(state===true?true:result); // una concesión hecha mientras esta comprobación estaba pendiente no se deshace
   return result;}
  async function estimate(){try{const s=manager();if(typeof s?.estimate!=='function')return null;const e=await s.estimate();
   return Number.isFinite(e?.usage)&&Number.isFinite(e?.quota)?{usage:e.usage,quota:e.quota}:null;}catch{return null;}}
  const storageNoteDismissed=()=>dismissedHere||remembered(STORAGE_NOTE_DISMISSED_KEY);
  function dismissStorageNote(){dismissedHere=true;remember(STORAGE_NOTE_DISMISSED_KEY);}
  // Recomendar una copia mientras hay proyectos guardados a la vista y el navegador no ha prometido conservarlos.
  const showStorageNote=(persistence,dismissed,active)=>active&&!dismissed&&(persistence===false||persistence===null);
  return {PERSIST_REQUESTED_KEY,STORAGE_NOTE_DISMISSED_KEY,requestPersistentStorage,checkStoragePersistence,estimate,storageNoteDismissed,dismissStorageNote,showStorageNote,
   get state(){return state;},subscribe(f){listeners.add(f);return ()=>listeners.delete(f);}};}
 return {create,PERSIST_REQUESTED_KEY,STORAGE_NOTE_DISMISSED_KEY};
});
