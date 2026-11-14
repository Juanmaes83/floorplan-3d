/* FOT-01 «Reformar desde fotografía» · núcleo PURO (sin DOM, sin red). Contrato de una reforma VISUAL a partir de una
   foto: original, intención de reforma (opciones cerradas), lo que se enviaría a un proveedor, consentimiento, 1–3
   alternativas con estado y cancelación, y la etiqueta de cada resultado.
   Límites de esta versión (GOV-05 pendiente; controles comerciales de IMG-04 sin acreditar):
   · el proveedor REAL está siempre bloqueado: no hay endpoint de producción, credenciales ni gasto;
   · solo existe un adaptador SIMULADO, local, que transforma la propia foto en el navegador y marca cada resultado
     como «SIMULACIÓN»: no acredita generación por IA y nunca se presenta como tal;
   · el coste es desconocido / no aplica: nunca se inventa una cifra;
   · la foto se recomprime sin metadatos (EXIF/GPS) antes de mostrarse; no se guarda ni se envía;
   · el proyecto geométrico es la autoridad: nada de aquí lo modifica. */
(function(root){
 'use strict';
 const VERSION=1;
 const LIMITS=Object.freeze({maxBytes:10*1024*1024,minSide:320,maxSide:8000,workSide:1600,alternatives:[1,3]});
 // Intenciones cerradas (no texto libre): lo que la persona quiere ver, no lo que se va a construir.
 const INTENTS=Object.freeze([
  {id:'floor',label:'Cambiar el suelo',finishes:[['light-oak','Roble claro'],['walnut','Nogal'],['microcement','Microcemento'],['grey-porcelain','Porcelánico gris']]},
  {id:'walls',label:'Pintar las paredes',finishes:[['white','Blanco mate'],['warm-white','Blanco cálido'],['sage','Verde salvia'],['sand','Arena']]},
  {id:'light',label:'Más luz y orden',finishes:[]},
  {id:'warm',label:'Ambiente cálido',finishes:[]}
 ].map(i=>Object.freeze({...i,finishes:Object.freeze(i.finishes.map(f=>Object.freeze({id:f[0],label:f[1]})))})));

 function sniff(bytes){
  const b=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes||[]);
  if(b.length>=3&&b[0]===0xff&&b[1]===0xd8&&b[2]===0xff)return 'image/jpeg';
  if(b.length>=8&&[0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a].every((v,i)=>b[i]===v))return 'image/png';
  if(b.length>=12&&String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...b.slice(8,12))==='WEBP')return 'image/webp';
  return null;
 }
 function checkFile({size,head}){
  if(!Number.isFinite(size)||size<=0)return {ok:false,reason:'empty',message:'El archivo está vacío.'};
  if(size>LIMITS.maxBytes)return {ok:false,reason:'too-large',message:`La foto pesa demasiado (máximo ${LIMITS.maxBytes/1024/1024} MB).`};
  const type=sniff(head);if(!type)return {ok:false,reason:'format',message:'Formato no admitido: usa una foto JPEG, PNG o WebP.'};
  return {ok:true,mediaType:type};
 }
 function checkDimensions(w,h){
  if(!(Number.isFinite(w)&&Number.isFinite(h))||w<=0||h<=0)return {ok:false,reason:'corrupt',message:'No se ha podido leer la imagen: el archivo parece dañado.'};
  if(Math.min(w,h)<LIMITS.minSide)return {ok:false,reason:'too-small',message:`La foto es demasiado pequeña (mínimo ${LIMITS.minSide} px de lado).`};
  if(Math.max(w,h)>LIMITS.maxSide)return {ok:false,reason:'too-big',message:`La foto es demasiado grande (máximo ${LIMITS.maxSide} px de lado).`};
  const k=Math.min(1,LIMITS.workSide/Math.max(w,h));return {ok:true,work:{w:Math.round(w*k),h:Math.round(h*k)}};
 }
 function intentOf(id,finish){const i=INTENTS.find(x=>x.id===id);if(!i)return null;if(i.finishes.length){const f=i.finishes.find(x=>x.id===finish);if(!f)return null;return {intent:i.id,finish:f.id,label:`${i.label}: ${f.label}`};}return finish?null:{intent:i.id,finish:null,label:i.label};}

 // La solicitud que recibiría un proveedor: SOLO la imagen recomprimida y claves cerradas. Nunca el proyecto, el nombre
 // del archivo, sus metadatos, la ubicación ni texto libre.
 function request({image,intent,finish,alternatives}){
  const it=intentOf(intent,finish);if(!it)return {ok:false,message:'Elige una intención de reforma de la lista.'};
  const n=Number(alternatives);if(!Number.isInteger(n)||n<LIMITS.alternatives[0]||n>LIMITS.alternatives[1])return {ok:false,message:'Elige entre 1 y 3 alternativas.'};
  if(!image||image.mediaType!=='image/jpeg'||!(image.width>0&&image.height>0&&image.bytes>0))return {ok:false,message:'Primero elige una foto válida.'};
  return {ok:true,request:{version:VERSION,image:{mediaType:'image/jpeg',width:image.width,height:image.height,bytes:image.bytes,metadata:'eliminados'},intent:it.intent,finish:it.finish,alternatives:n},
   summary:{sends:[`La foto recomprimida (${image.width}×${image.height} px, JPEG, sin metadatos EXIF ni ubicación)`,`La intención: ${it.label}`,`Número de alternativas: ${n}`],
    never:['El proyecto, sus planos, medidas o datos','El nombre del archivo','Los metadatos de la foto (EXIF, GPS, cámara)','Texto libre']}};
 }

 // ¿Se puede generar? El modo real exige proveedor configurado y autorizado, GOV-05 y los controles de IMG-04: hoy,
 // siempre bloqueado. El simulado no envía nada, pero también exige el consentimiento explícito.
 function gate({mode,consent,provider={},governance={}}={}){
  const reasons=[];
  if(mode==='real'){
   if(!provider.configured)reasons.push('No hay un proveedor real configurado en este servidor.');
   if(!provider.authorized)reasons.push('El propietario no ha autorizado un proveedor para fotografías de clientes.');
   if(!governance.gov05)reasons.push('GOV-05 (revisión legal y de privacidad de imágenes y personas) sigue pendiente.');
   if(!governance.img04)reasons.push('Los controles de gasto de IMG-04 (confirmación previa y tope global) no están acreditados.');
  }else if(mode!=='simulated')reasons.push('Modo desconocido.');
  if(!consent)reasons.push('Falta tu consentimiento para procesar esta foto.');
  return {allowed:reasons.length===0,mode,reasons};
 }

 // Estado de una tanda de alternativas (inmutable): idle → running → done | cancelled | error.
 function run(n){return {status:'idle',items:Array.from({length:n},(_,i)=>({index:i,status:'pending'}))};}
 const next=(st,patch)=>({...st,...patch,items:(patch.items||st.items).map(x=>({...x}))});
 function start(st){if(st.status!=='idle')return st;return next(st,{status:'running',items:st.items.map((x,i)=>i===0?{...x,status:'running'}:x)});}
 function itemDone(st,i,result){if(st.status!=='running'||st.items[i]?.status!=='running')return st;
  const items=st.items.map((x,k)=>k===i?{...x,status:'done',result:label(result)}:k===i+1?{...x,status:'running'}:x);
  return next(st,{items,status:items.every(x=>x.status==='done')?'done':'running'});}
 function itemError(st,i,message){if(st.status!=='running')return st;return next(st,{status:'error',error:message||'Error del proveedor.',items:st.items.map((x,k)=>k===i?{...x,status:'error'}:x.status==='pending'?{...x,status:'skipped'}:x)});}
 function cancel(st){if(st.status!=='running')return st;return next(st,{status:'cancelled',items:st.items.map(x=>x.status==='done'?x:{...x,status:'cancelled'})});}

 // Etiqueta obligatoria de cada resultado. Un resultado simulado nunca se presenta como generado; el coste se desconoce.
 function label(result={}){
  const simulated=result.kind!=='generated',name=typeof result.provider?.name==='string'?result.provider.name:null;
  // Coste: número (compatibilidad) o {amount,currency} tal como lo informa el proveedor. Sin cifra, «desconocido».
  const c=Number.isFinite(result.cost)?{amount:result.cost,currency:null}:result.cost&&Number.isFinite(result.cost.amount)?{amount:result.cost.amount,currency:result.cost.currency||null}:null;
  return {kind:simulated?'simulated':'generated',
   badge:simulated?'SIMULACIÓN · no generada por IA':`Imagen generada por IA${name?` (${name})`:''} · ilustrativa, no medible`,
   cost:simulated?null:(c?(c.currency?c:c.amount):null),
   costText:simulated?'Coste: no aplica (no se ha llamado a ningún proveedor).':c?`Coste informado por el proveedor: ${c.amount}${c.currency?' '+c.currency:''}.`:'Coste: desconocido (el proveedor no lo ha informado).',
   downloadable:!simulated,illustrative:true};
 }

 // Trazabilidad de la sesión: qué pasó y cuándo, con campos CERRADOS. Nunca el contenido de la imagen, el nombre del
 // archivo, metadatos ni texto libre. Vive en memoria mientras el diálogo está abierto; no se guarda en el proyecto.
 const TRACE_EVENTS=['photo-accepted','photo-rejected','intent-set','gate-blocked','consent-missing','run-started','item-done','item-error','run-cancelled','run-finished','discarded'];
 const TRACE_FIELDS={mode:v=>v==='simulated'||v==='real',adapter:v=>/^[a-z0-9-]{1,32}$/.test(v),intent:v=>INTENTS.some(i=>i.id===v),finish:v=>v===null||typeof v==='string'&&/^[a-z-]{1,24}$/.test(v),
  alternatives:v=>Number.isInteger(v)&&v>=1&&v<=LIMITS.alternatives[1],index:v=>Number.isInteger(v)&&v>=0&&v<LIMITS.alternatives[1],reason:v=>/^[a-z-]{1,32}$/.test(v),
  widthPx:v=>Number.isInteger(v)&&v>0&&v<=LIMITS.maxSide,heightPx:v=>Number.isInteger(v)&&v>0&&v<=LIMITS.maxSide,costKnown:v=>typeof v==='boolean'};
 const TRACE_MAX=200;
 function trace(list,event,data={},at=new Date()){
  if(!TRACE_EVENTS.includes(event))throw Error('Evento de traza desconocido.');
  const entry={at:at.toISOString(),event};
  for(const [k,v] of Object.entries(data)){if(v===undefined)continue;if(!TRACE_FIELDS[k]||!TRACE_FIELDS[k](v))throw Error(`Campo de traza no admitido: ${k}`);entry[k]=v;}
  return [...(list||[]),entry].slice(-TRACE_MAX);
 }

 const api={VERSION,LIMITS,INTENTS,sniff,checkFile,checkDimensions,intentOf,request,gate,run,start,itemDone,itemError,cancel,label,trace,TRACE_EVENTS};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.RubikPhotoReformCore=api;
})(globalThis);
