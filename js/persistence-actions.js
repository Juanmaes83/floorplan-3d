/* F0.3 · Acciones de persistencia: guardar, recuperar y copia de emergencia (contrato F0.2c R1: §6 paso 0, §11, R1-D6;
   protocolo UX-FIRST; sistema Perla). AISLADO: ninguna página del producto lo carga; su conexión al editor es un corte
   posterior autorizado.

   Da función a CADA botón de la interfaz única de estados (js/persistence-status-ui.js):
     · lo que resuelven los núcleos F0.2c lo resuelve aquí: copia de emergencia completa (con consentimiento explícito,
       comprobada en seco ANTES de descargarla), copia previa a la migración (FloorPlanStoreV2Migrate.prepare) y
       restauración desde archivo (solo en una base NUEVA, nunca sobre la original);
     · lo que depende del editor (guardar ahora, reintentar, recargar, espacio, aplazar, reintentar la migración, revisar
       un conflicto) lo aporta quien integra como «puerto». create() se niega a arrancar si falta alguno: ningún botón
       puede quedar sin función.
   Garantías: una sola operación a la vez (una doble pulsación no genera dos copias); ninguna copia privada sin pasar por
   la pantalla de consentimiento; ningún error queda en silencio (siempre se muestra un estado con su explicación y una
   salida); tras un resultado, «Entendido» devuelve el aviso de riesgo que había, que no se pierde.
   Límite honesto: el navegador no permite comprobar dónde se guarda el archivo descargado. */
(function(root){
 'use strict';
 class ActionsError extends Error{constructor(code,message,extra={}){super(message);this.name='ActionsError';this.code=code;Object.assign(this,extra);}}
 const CONSENT={confirmed:true,scope:'private-complete'};
 const BUILT_IN=new Set(['emergency-export','download-copy','export-both','restore','cancel']);
 const PORTS={'save-now':'saveNow',retry:'retry',reload:'reload','manage-space':'manageSpace',postpone:'postpone','retry-migration':'retryMigration','review-conflict':'reviewConflict'};
 const NEEDED={db:'function',source:'object',download:'function',pickFile:'function',restoreName:'function'};
 const fileName=p=>'rubik-copia-completa-'+(p==='pre-migration'?'antes-de-actualizar-':'')+new Date().toISOString().slice(0,10)+'.json';
 const summary=problems=>problems[0].detail+(problems.length>1?` (y ${problems.length-1} problemas más)`:'');

 function create({container,ports={},ui=root.FloorPlanPersistenceUI,backup=root.FloorPlanStoreV2Backup,migrate=root.FloorPlanStoreV2Migrate}={}){
  const actions=new Set(Object.values(ui.STATES).flatMap(d=>[d.primary,d.secondary,d.tertiary].filter(Boolean).map(a=>a[0])));
  const missing=[...actions].filter(a=>!BUILT_IN.has(a)&&typeof ports[PORTS[a]]!=='function').map(a=>a+(PORTS[a]?' (puerto '+PORTS[a]+')':''))
   .concat(Object.entries(NEEDED).filter(([k,t])=>typeof ports[k]!==t).map(([k])=>'puerto '+k));
  if(missing.length)throw new ActionsError('ports-missing','Faltan acciones por conectar: '+missing.join(', ')+'. Ningún botón puede quedar sin función.',{missing});

  let current=null,back=null,purpose='v2',busy=null;
  function show(state,{focus=false}={}){
   current=state;const box=ui.render(container,state,{onAction:(a,x)=>run(a,x)});
   if(focus)(box.querySelector('.psui-consent')||box.querySelector('.btn.primary:not(:disabled)')||box.querySelector('.btn'))?.focus();
   return box;
  }
  // Una sola operación a la vez: mientras dura, cualquier pulsación devuelve la misma promesa.
  function run(action,{consent=false}={}){
   if(busy)return busy;
   busy=(async()=>{try{await act(action,consent===true);}catch(e){fail(action,e);}finally{busy=null;}})();
   return busy;
  }
  async function act(action,consent){
   switch(action){
    case 'emergency-export':return ask(current?.kind==='copy-failed'?purpose:'v2');
    case 'export-both':return ask('v2');   // la copia completa incluye las dos versiones del conflicto (conflicts.json)
    case 'download-copy':
     // Solo cuenta el consentimiento dado en su pantalla; desde «Antes de actualizar» se pasa primero por ella.
     if(!consent||current?.kind!=='emergency-export')return ask(current?.kind==='pre-migration-copy'?'pre-migration':purpose);
     return copy();
    case 'restore':return restore();
    case 'cancel':return show(back||{kind:'saved',vars:{}},{focus:true});
    default:{const next=await ports[PORTS[action]](current);if(next?.kind)show(next,{focus:true});}
   }
  }
  function ask(p){purpose=p;if(!['emergency-export','copy-failed','copy-ready','restored'].includes(current?.kind))back=current;show({kind:'emergency-export'},{focus:true});}

  async function copy(){
   show({kind:'copy-working'});
   let blob,counts,hash,absent;
   if(purpose==='pre-migration'){
    // Paso 0 de la migración: copia del almacén ANTERIOR, ya comprobada en seco por prepare().
    const pre=await migrate.prepare(ports.source,{consent:CONSENT});({blob,counts,manifestSha256:hash,absentResources:absent}=pre);
    ports.download(blob,fileName(purpose));
    const next=await ports.prepared?.(pre);if(next?.kind)back=next;
   }else{
    const out=await backup.create(await ports.db(),{consent:CONSENT}),dry=await backup.dryRun(out.blob);
    if(!dry.ok)throw new ActionsError('verify-failed','La copia generada no supera la comprobación: '+summary(dry.problems));
    ({blob,manifestSha256:hash}=out);({counts,absentResources:absent}=dry);
    ports.download(blob,fileName(purpose));
   }
   show({kind:'copy-ready',vars:{docs:counts.docs,resources:counts.resources,photos:counts.photos,hash:hash.slice(0,12)+'…',
    absent:absent?.length?` Aviso: ${absent.length} imágenes citadas ya faltaban en este navegador; la copia no puede recuperarlas.`:''}},{focus:true});
  }

  async function restore(){
   const file=await ports.pickFile();if(!file)return;          // sin archivo, el aviso sigue igual
   if(!['restore-failed','restored'].includes(current?.kind))back=current;
   show({kind:'copy-working'});
   const dry=await backup.dryRun(file);
   if(!dry.ok)return show({kind:'restore-failed',vars:{reason:summary(dry.problems)}},{focus:true});
   const r=await backup.restoreInto(file,{name:ports.restoreName()});
   await ports.restored?.(r);
   show({kind:'restored',vars:{docs:r.counts.docs,resources:r.counts.resources,photos:r.counts.photos}},{focus:true});
  }

  // Ningún error en silencio: cada fallo se convierte en un estado que explica y ofrece salida.
  function fail(action,e){
   const reason=(e?.message||String(e)).replace(/\.?$/,'.');
   if(action==='restore')return show({kind:'restore-failed',vars:{reason}},{focus:true});
   if(action==='download-copy')return show({kind:'copy-failed',vars:{reason}},{focus:true});
   if(action==='retry-migration')return show(ui.fromMigrationError(e),{focus:true});
   if(action==='save-now'||action==='retry')return show({kind:'error',vars:{reason,why:''}},{focus:true});
   if(!['copy-failed','restore-failed','action-failed'].includes(current?.kind))back=current;
   show({kind:'action-failed',vars:{reason}},{focus:true});
  }
  return {show,run,get state(){return current;},get busy(){return !!busy;}};
 }
 const api={ActionsError,BUILT_IN:[...BUILT_IN],PORTS,create};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanPersistenceActions=api;
})(typeof globalThis!=='undefined'?globalThis:this);
