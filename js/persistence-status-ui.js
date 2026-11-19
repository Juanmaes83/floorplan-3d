/* F0.3 · Interfaz única de estados de persistencia (contrato F0.2c R1 §11; protocolo UX-FIRST; sistema Perla).
   AISLADO: ninguna página del producto lo carga todavía; su conexión al editor es un corte posterior autorizado.

   Una sola pieza que convierte CUALQUIER estado de persistencia —sesión F0.2b, puerta A0, arranque/migración v2,
   copia de emergencia— en un aviso que cumple las tres reglas de oro:
     1. el diseño explica: qué ocurrió, por qué y dónde;
     2. se puede usar sin ayuda: una única acción dominante por estado, nombrada con el verbo de lo que hará;
     3. ningún bloqueo sin explicación ni solución: siguiente paso, alternativa segura y estado de los datos.
   Perla: clases .btn y .btn.primary existentes; tokens --info / --success / --warn / --danger (+ -soft), --focus.
   El color nunca va solo (icono + título + texto). Los estados de riesgo son persistentes (role=alert), nunca un aviso
   efímero; los informativos usan role=status. */
(function(root){
 'use strict';
 // tone: info · success · warn · danger. persistent: no desaparece solo. primary/secondary: [acción, etiqueta].
 const STATES={
  pending:{tone:'info',icon:'●',title:'Cambios pendientes de guardar',what:'Hay cambios que aún no se han confirmado en este navegador.',why:'RUBIK guarda en cuanto dejas de editar unos instantes.',data:'Tus cambios están en esta pestaña.',primary:['save-now','Guardar ahora']},
  saving:{tone:'info',icon:'◌',title:'Guardando…',what:'Se están confirmando tus cambios en este navegador.',why:'',data:'No cierres la pestaña hasta que termine.'},
  saved:{tone:'success',icon:'✓',title:'Guardado en este navegador',what:'Todos tus cambios están confirmados.',why:'',data:'Revisión {revision}.'},
  error:{tone:'danger',icon:'✕',persistent:true,title:'No se ha guardado',what:'El último guardado ha fallado: {reason}.',why:'{why}',data:'Tus cambios siguen en esta pestaña; no la cierres.',primary:['retry','Reintentar'],secondary:['emergency-export','Exportar copia de emergencia']},
  outdated:{tone:'warn',icon:'⟳',persistent:true,title:'Esta pestaña ya no puede guardar',what:'Otra pestaña usa una versión más nueva de RUBIK.',why:'Si esta siguiera guardando, mezclaría tu trabajo con el formato nuevo.',data:'Lo ya guardado está intacto. Tus cambios siguen en esta pestaña.',primary:['emergency-export','Exportar copia de emergencia'],secondary:['reload','Recargar RUBIK']},
  indeterminate:{tone:'danger',icon:'⚠',persistent:true,title:'RUBIK ha dejado de guardar para proteger tus datos',what:'No se puede comprobar con qué versión se guardan los datos en este navegador.',why:'Guardar sin saberlo podría dañar tu trabajo.',data:'Lo ya guardado está intacto. Tus cambios siguen en esta pestaña.',primary:['emergency-export','Exportar copia de emergencia'],secondary:['reload','Recargar RUBIK']},
  quota:{tone:'warn',icon:'◔',persistent:true,title:'Espacio insuficiente',what:'Este navegador tiene {available} libres y hacen falta {needed}.',why:'El navegador limita el espacio de cada sitio.',data:'No se ha perdido nada de lo guardado.',primary:['manage-space','Ver qué ocupa más'],secondary:['emergency-export','Exportar copia de emergencia']},
  'pre-migration-copy':{tone:'info',icon:'⇩',persistent:true,title:'Antes de actualizar el almacenamiento',what:'Hay que guardar una copia completa de tu trabajo, con las fotos privadas de tus muebles.',why:'Así podrás recuperarlo todo pase lo que pase durante la actualización.',data:'Nada ha cambiado todavía.',primary:['download-copy','Descargar la copia completa'],secondary:['postpone','Ahora no']},
  migrating:{tone:'info',icon:'◌',persistent:true,title:'Actualizando el almacenamiento ({step} de {steps})',what:'RUBIK está copiando tu trabajo al almacenamiento nuevo y comprobándolo.',why:'',data:'El almacenamiento anterior sigue intacto. No cierres la pestaña.'},
  'migration-stopped':{tone:'warn',icon:'⏸',persistent:true,title:'La actualización se ha detenido',what:'{reason}',why:'{why}',data:'El almacenamiento anterior sigue intacto y es el que se usa.',primary:['retry-migration','Cerrar las otras pestañas y reintentar'],secondary:['postpone','Seguir con el almacenamiento anterior']},
  'v2-unreadable':{tone:'danger',icon:'⚠',persistent:true,title:'No se puede leer el almacenamiento nuevo',what:'El navegador no permite abrir el almacenamiento actualizado.',why:'Puede deberse a un fallo del navegador o a que se borraron datos del sitio.',data:'No se guardará nada hasta resolverlo. Tus cambios siguen en esta pestaña.',primary:['retry','Reintentar'],secondary:['emergency-export','Exportar copia de emergencia'],tertiary:['restore','Restaurar desde la copia previa']},
  conflict:{tone:'warn',icon:'⇄',persistent:true,title:'Hay otra versión guardada',what:'Otra pestaña u otra versión de RUBIK guardó a la vez.',why:'',data:'Las dos versiones se conservan.',primary:['review-conflict','Revisar y elegir'],secondary:['export-both','Exportar las dos']},
  'emergency-export':{tone:'warn',icon:'⚑',persistent:true,title:'Copia de emergencia completa',what:'Incluye las fotos privadas de tus muebles y tus planos.',why:'Quien tenga el archivo podrá verlas.',data:'Solo se guarda donde tú elijas; RUBIK no lo envía a ningún sitio.',primary:['download-copy','Descargar la copia'],secondary:['cancel','Cancelar'],consent:'Entiendo que incluye fotos privadas.'},
  // Resultado de las acciones (js/persistence-actions.js): la copia y la restauración se comprueban SIEMPRE antes de darlas por buenas.
  'copy-working':{tone:'info',icon:'◌',persistent:true,title:'Comprobando la copia…',what:'RUBIK revisa cada archivo con su huella antes de darla por buena.',why:'',data:'Tus datos en este navegador no cambian mientras tanto.'},
  'copy-ready':{tone:'success',icon:'✓',persistent:true,title:'Copia descargada y comprobada',what:'{docs} documentos y {resources} archivos, {photos} de ellos fotos de muebles. Huella {hash}.{absent}',why:'Guárdala en un lugar seguro: contiene fotos privadas. RUBIK no puede ver dónde la guarda el navegador; búscala en tu carpeta de descargas.',data:'Tus datos en este navegador no han cambiado.',primary:['cancel','Entendido']},
  'copy-failed':{tone:'danger',icon:'✕',persistent:true,title:'No se ha descargado ninguna copia',what:'{reason}',why:'Una copia que no supera la comprobación no se entrega: no serviría para recuperar tu trabajo.',data:'Tus datos en este navegador no han cambiado.',primary:['emergency-export','Volver a intentarlo'],secondary:['cancel','Cerrar']},
  'restore-failed':{tone:'warn',icon:'⚠',persistent:true,title:'Esta copia no se puede usar',what:'{reason}',why:'Solo se restaura una copia que supera la comprobación completa de huellas.',data:'No se ha restaurado nada; tus datos no han cambiado.',primary:['restore','Elegir otro archivo'],secondary:['cancel','Volver']},
  'action-failed':{tone:'danger',icon:'✕',persistent:true,title:'No se ha podido completar la acción',what:'{reason}',why:'',data:'RUBIK no la da por hecha; lo que ya estaba guardado no depende de ella.',primary:['cancel','Volver al aviso'],secondary:['emergency-export','Exportar copia de emergencia']},
  restored:{tone:'success',icon:'✓',persistent:true,title:'Copia restaurada y comprobada',what:'{docs} documentos y {resources} archivos, {photos} de ellos fotos de muebles, están en un almacenamiento aparte.',why:'',data:'El almacenamiento que usas ahora no se ha tocado.',primary:['cancel','Entendido']}};
 const fill=(t,v)=>String(t||'').replace(/\{(\w+)\}/g,(_,k)=>v?.[k]??'');

 // ── Adaptadores: un estado de cada fuente → {kind, vars} ─────────────────────────────────────────────────────────────
 function fromSession(st){if(!st)return {kind:'saved',vars:{}};
  if(st.error?.code==='schema-outdated')return {kind:'outdated'};if(st.error?.code==='schema-indeterminate')return {kind:'indeterminate'};
  if(st.status==='conflict')return {kind:'conflict'};
  if(st.status==='error')return {kind:st.error?.code==='quota'?'quota':'error',vars:{reason:st.error?.message||'error desconocido',why:''}};
  if(st.status==='saving')return {kind:'saving'};if(st.status==='pending'||st.pending)return {kind:'pending'};
  return {kind:'saved',vars:{revision:st.revision??''}};}
 const fromEpoch=s=>s?.state==='outdated'?{kind:'outdated'}:s?.state==='indeterminate'?{kind:'indeterminate'}:null;
 function fromBoot(b){if(!b)return null;if(b.blocked)return {kind:b.reason==='v2-unreadable'||b.reason==='indeterminate'?'v2-unreadable':'indeterminate'};
  if(b.diverged)return {kind:'conflict'};return null;}
 const MIGRATION_REASONS={'legacy-writer-active':['Otra pestaña o una versión antigua de RUBIK sigue cambiando los datos.','Cierra las demás pestañas de RUBIK.'],
  stopped:['Se agotó el espacio tres veces seguidas.','Libera espacio en el navegador o exporta una copia.'],'quota-exceeded':['Se agotó el espacio durante la actualización.','Libera espacio y vuelve a intentarlo.'],
  'verify-resource':['Un archivo no se copió íntegro.','Vuelve a intentarlo; si se repite, exporta una copia.'],'verify-doc':['Un documento no se copió idéntico.','Vuelve a intentarlo; si se repite, exporta una copia.']};
 function fromMigrationError(e){if(e?.code==='quota')return {kind:'quota',vars:{available:mb(e.available),needed:mb(e.needed)}};
  if(e?.code==='export-required'||e?.code==='export-stale')return {kind:'pre-migration-copy'};
  const [reason,why]=MIGRATION_REASONS[e?.code]||[e?.message||'Error desconocido.',''];return {kind:'migration-stopped',vars:{reason,why}};}
 const mb=n=>Number.isFinite(n)?Math.max(0,Math.round(n/1048576))+' MB':'—';

 // ── Render ──────────────────────────────────────────────────────────────────────────────────────────────────────────
 const CSS=`.psui{display:block;max-width:640px;margin:8px;padding:14px 16px;border-radius:10px;border:1px solid var(--line,#d5d9db);border-left-width:5px;color:var(--ink,#1f2326);background:var(--surface-panel,#fff);font:inherit}
  .psui[data-tone=info]{border-left-color:var(--info,#2c5d8a)}.psui[data-tone=success]{border-left-color:var(--success,#2f6e4a)}
  .psui[data-tone=warn]{border-left-color:var(--warn,#7a5200);background:var(--warn-soft,#fff4dc)}.psui[data-tone=danger]{border-left-color:var(--danger,#a3261b);background:var(--danger-soft,#fbe9e7)}
  .psui h2{margin:0 0 4px;font-size:1rem;display:flex;gap:8px;align-items:center}.psui p{margin:3px 0}.psui .psui-data{font-weight:600}
  .psui .psui-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.psui .btn{min-height:44px;padding-inline:14px} /* objetivo táctil ≥ 44 px */.psui label{display:flex;gap:8px;margin-top:8px;font-weight:600}
  .psui .btn:focus-visible,.psui input:focus-visible{outline:3px solid var(--focus,#1f6f8b);outline-offset:2px}`;
 function render(container,state,{onAction=()=>{}}={}){
  const doc=container.ownerDocument;if(!doc.getElementById('psuiStyle')){const s=doc.createElement('style');s.id='psuiStyle';s.textContent=CSS;doc.head.append(s);}
  const def=STATES[state?.kind];if(!def)throw new Error('Estado de persistencia desconocido: '+state?.kind);
  const v=state.vars||{},box=doc.createElement('section');box.className='psui';box.dataset.kind=state.kind;box.dataset.tone=def.tone;
  const risk=def.tone==='warn'||def.tone==='danger';box.setAttribute('role',risk?'alert':'status');if(!risk)box.setAttribute('aria-live','polite');
  box.dataset.persistent=String(!!def.persistent);const id='psui-'+state.kind;box.setAttribute('aria-labelledby',id+'-t');
  const el=(tag,cls,text)=>{const n=doc.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  const h=el('h2');h.id=id+'-t';const ic=el('span','psui-icon',def.icon);ic.setAttribute('aria-hidden','true');h.append(ic,doc.createTextNode(fill(def.title,v)));box.append(h);
  box.append(el('p','psui-what',fill(def.what,v)));if(fill(def.why,v))box.append(el('p','psui-why',fill(def.why,v)));
  box.append(el('p','psui-data','Estado de tus datos: '+fill(def.data,v)));
  let consent=null;if(def.consent){const l=el('label');consent=el('input');consent.type='checkbox';consent.className='psui-consent';l.append(consent,doc.createTextNode(def.consent));box.append(l);}
  const acts=el('div','psui-actions');
  for(const [slot,cls] of [['primary','btn primary'],['secondary','btn'],['tertiary','btn']]){const a=def[slot];if(!a)continue;
   const b=el('button',cls,a[1]);b.type='button';b.dataset.action=a[0];b.dataset.slot=slot;
   if(slot==='primary'&&consent){b.disabled=true;consent.onchange=()=>{b.disabled=!consent.checked;};}
   b.onclick=()=>onAction(a[0],{state,consent:consent?.checked===true});acts.append(b);}
  if(acts.childElementCount)box.append(acts);
  container.replaceChildren(box);return box;
 }
 const api={STATES,fromSession,fromEpoch,fromBoot,fromMigrationError,render};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanPersistenceUI=api;
})(typeof globalThis!=='undefined'?globalThis:this);
