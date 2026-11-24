/* Asesor RUBIK en vivo · LABORATORIO SIMULADO · adaptador de sesión y puente con RUBIK.
   SimAdapter imita el ciclo de una sesión de voz y avatar SIN red: inicio por clic, conexión, conversación (subtítulos),
   llamada de herramienta, error, cambio a texto y cierre. No publica audio, vídeo, capturas ni datos del cliente:
   no hay micrófono, cámara ni fetch. Cada error documentado del proveedor tiene su simulación y su mensaje.
   Puente (rubikBridge): ejecuta las herramientas sobre RUBIK real, cargado en un iframe del MISMO origen.
   La salida a Nuance está APAGADA: este archivo no conoce su URL ni su clave. */
(function(root){'use strict';
 // Errores del proveedor (docs.nuancelabs.ai/errors y /connect) → mensaje para la persona y si se puede reintentar.
 // Ningún reintento es automático: la persona decide, y hay un máximo de reintentos manuales por sesión.
 const ERRORS=Object.freeze({
  mic_denied:{status:null,msg:'No hay permiso para usar el micrófono. Puedes seguir por texto.',retry:false},
  invalid_credential:{status:401,msg:'La credencial del servicio de voz no es válida. Sigue por texto.',retry:false},
  forbidden:{status:403,msg:'Tu cuenta no tiene acceso al modo de voz. Sigue por texto.',retry:false},
  concurrency_limit:{status:409,msg:'Ya hay otra conversación de voz abierta. Ciérrala o sigue por texto.',retry:true},
  credits_spent:{status:429,msg:'Se agotó el saldo del servicio de voz. Sigue por texto.',retry:false},
  start_limit:{status:429,msg:'Se alcanzó el límite de inicios. Espera un momento o sigue por texto.',retry:true,afterS:30},
  capacity_unavailable:{status:429,msg:'El servicio de voz no tiene capacidad ahora. Prueba más tarde o sigue por texto.',retry:true,afterS:20},
  unavailable:{status:503,msg:'El servicio de voz no está disponible. Sigue por texto.',retry:true,afterS:15},
  connection_lost:{status:null,msg:'Se perdió la conexión con el asesor. Sigue por texto o vuelve a intentarlo.',retry:true}});
 const MAX_MANUAL_RETRIES=2;

 // Puente con RUBIK real (iframe del mismo origen). Todas las lecturas pasan por funciones del producto.
 function rubikBridge(win){
  const nm=(n,t)=>typeof win.FloorPlanDisplayName==='function'?win.FloorPlanDisplayName(n,t||'room'):(typeof win.nm==='function'?win.nm(n):n);
  return {
   tools:win.RubikAssistantDomainTools,
   project:()=>win.FloorPlanApp?.project,
   ctx:()=>({project:win.FloorPlanApp.project}),
   displayName:n=>nm(n,'room'),
   // Igual que tocar la estancia en el plano: selección (Inspector) y, en 3D, el encuadre del visor.
   focusRoom:id=>{win.select({kind:'room',id});if(win.FloorPlanApp?.viewMode==='3d')win.View3D?.focusRoom?.(id);},
   openTextAssistant:q=>{win.RubikAssistantUI.open();if(q)win.RubikAssistantUI.ask(q);},
   win};
 }

 // Intenciones del guion simulado: frase → herramienta. Sustituye al modelo del proveedor; no lo imita.
 function intent(text,rubik){const f=String(text||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
  if(/superficie|metros|m2|cuanto mide/.test(f))return {tool:'consultar_superficies',args:{}};
  // La intención (verbo) va antes que la estancia: «cambia el suelo del salón» es un cambio, no «enséñame el salón».
  if(/presupuesto|precio|coste|cuesta/.test(f))return {tool:'resumen_presupuesto',args:{}};
  if(/cambia|pon el suelo|suelo de/.test(f))return {tool:'proponer_cambio_suelo',args:{roomName:'Salón',materialId:'x'}};
  if(/publica|enlace/.test(f))return {tool:'publicar_enlace',args:{}};
  if(/texto|escribir/.test(f))return {tool:'continuar_por_texto',args:{}};
  const p=rubik.project();for(const r of p?.rooms||[]){const n=rubik.displayName(r.name);const nf=n.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');if(nf&&f.includes(nf))return {tool:'enfocar_estancia',args:{roomName:n}};}
  return null;}

 class SimAdapter{
  constructor({rubik,profile,mode,onEvent,failWith=null,latencyMs=250}){
   Object.assign(this,{rubik,profile,mode,onEvent,failWith,latencyMs});this.state='idle';this.timers=new Set();this.retries=0;this.projectId=null;this.resources=0;}
  _emit(type,detail={}){this.onEvent?.({type,...detail});}
  _later(fn,ms){const t=setTimeout(()=>{this.timers.delete(t);fn();},ms);this.timers.add(t);}
  // Inicio: SOLO desde un gesto de la persona (isTrusted). Sin gesto, no hay sesión.
  start(evt){
   if(!evt||evt.isTrusted!==true){this._emit('blocked',{reason:'user_gesture_required'});return false;}
   if(this.state!=='idle'&&this.state!=='ended'&&this.state!=='error')return false;
   this.state='connecting';this.projectId=this.rubik.project()?.id||null;this.resources=1;/* pista de audio/vídeo simulada */
   this._emit('state',{state:'connecting'});
   this._later(()=>{if(this.state!=='connecting')return;
    if(this.failWith){return this._fail(this.failWith);}
    this.state='live';this._emit('state',{state:'live'});
    this._say('Hola, soy el asesor de RUBIK, una IA. Esta sesión es simulada. Puedo decirte las superficies, enseñarte una estancia o pasarte al asistente de texto.');},this.latencyMs);
   return true;}
  _say(text){this._emit('speaking',{on:true});let i=0;const words=text.split(' ');
   const step=()=>{if(this.state!=='live')return;i=Math.min(words.length,i+4);this._emit('subtitle',{text:words.slice(0,i).join(' '),final:i>=words.length});
    if(i<words.length)this._later(step,60);else this._emit('speaking',{on:false});};step();}
  // La persona «habla» (en el laboratorio, escribe la frase que diría).
  hear(text){if(this.state!=='live')return null;
   if(this.rubik.project()?.id!==this.projectId){this.unbind();return {ok:false,error:'project_changed'};}
   this._emit('user',{text});const i=intent(text,this.rubik);
   if(!i){this._say('No tengo una consulta para eso en esta demostración. Puedo continuar por texto.');return null;}
   const session={state:this.state,profile:this.profile,mode:this.mode,projectId:this.projectId,rubik:this.rubik};
   this._emit('tool_call',{name:i.tool,args:i.args});const r=root.AsesorTools.run(session,i.tool,i.args);this._emit('tool_result',{name:i.tool,result:r});
   if(!r.ok){this._say(r.motivo||'No puedo hacer eso.');return r;}
   if(i.tool==='consultar_superficies')this._say(`La vivienda tiene ${r.data.totalM2.toLocaleString('es-ES')} metros cuadrados útiles en ${r.data.estancias.length} estancias. Te las muestro en la lista.`);
   else if(i.tool==='enfocar_estancia')this._say(`Te enseño ${r.data.estancia} en el plano.`);
   else if(i.tool==='continuar_por_texto')this._say('Abro el asistente de texto.');
   else this._say('Hecho.');
   return r;}
  _fail(code){const e=ERRORS[code]||ERRORS.unavailable;this.state='error';this._release();this._emit('error',{code,status:e.status,message:e.msg,retry:e.retry&&this.retries<MAX_MANUAL_RETRIES,afterS:e.afterS||0});}
  simulate(code){if(this.state==='live'||this.state==='connecting')this._fail(code);}
  retry(evt){if(this.state!=='error'||this.retries>=MAX_MANUAL_RETRIES)return false;this.retries++;this.failWith=null;return this.start(evt);}
  // Cambio de proyecto: la conversación queda desvinculada (no responde sobre otro proyecto).
  unbind(){if(this.state==='live'||this.state==='connecting'){this.state='ended';this._release();this._emit('unbound',{message:'El proyecto activo cambió. La conversación se cerró para no mezclar datos.'});}}
  // Cancelar antes de conectar o cerrar en vivo: se liberan pistas y temporizadores aunque «falle» la confirmación remota.
  close(){const was=this.state;this.state='ended';this._release();this._emit('state',{state:'ended',from:was});}
  _release(){for(const t of this.timers)clearTimeout(t);this.timers.clear();this.resources=0;this._emit('speaking',{on:false});}
 }
 root.AsesorSim=Object.freeze({SimAdapter,rubikBridge,ERRORS,MAX_MANUAL_RETRIES,intent});
})(typeof self!=='undefined'?self:globalThis);
