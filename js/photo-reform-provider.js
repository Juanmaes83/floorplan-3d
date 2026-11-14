/* FOT-01 · «Reformar desde fotografía» · contrato de proveedor v1 e integración desacoplada, SIN ACTIVAR.
   Este despliegue no tiene proveedor real: no hay endpoint de servidor para fotografías de reforma, ni clave, ni
   autorización del propietario, y GOV-05 (privacidad de imágenes) e IMG-04/GOV-06a (gasto controlado) siguen
   pendientes. Este módulo deja preparada y probada la pieza del navegador para el día en que se autorice:
     · adaptador = {id, kind, run(request, image, {signal, onItem})}: la interfaz ÚNICA que usa la pantalla. El
       adaptador simulado (local, rotulado) y el futuro adaptador HTTP la cumplen igual, así que activarlo no cambia
       la interfaz ni las garantías (consentimiento, puerta, rótulos, descarte, proyecto intacto).
     · serverAdapter({accessCode, confirm}): habla SOLO con /api/photo-reform de este mismo sitio (photo-reform/1,
       api/photo-reform.js) en dos pasos con confirmación de gasto; envía la solicitud cerrada y la imagen
       recomprimida, nunca el proyecto, el nombre original, EXIF ni texto libre, y NUNCA un secreto del proveedor
       (V2 retiró el antiguo httpAdapter, que mandaba un Bearer desde el navegador). La pantalla no lo crea en este
       despliegue (config().configured === false); las pruebas lo ejercitan contra el servidor real con un proveedor
       falso local.
     · validateResponse: respuesta estricta (claves cerradas, tipos de imagen, tamaños, coste solo si el proveedor lo
       informa). Una respuesta que no cumple el contrato se rechaza: nunca se inventa una imagen ni un coste.
   No reutiliza /api/render: aquel contrato es para vistas 3D de RUBIK, no para fotografías de clientes; su código y su
   clave no activan photo-reform/1. */
(function(root){
 'use strict';
 const CONTRACT_VERSION=1;
 const MEDIA=['image/jpeg','image/png','image/webp'];
 const MAX_IMAGE_BYTES=10*1024*1024;
 const ID_RE=/^[a-z0-9][a-z0-9-]{1,39}$/;
 const STATUS={400:'bad-request',401:'unauthorized',403:'unauthorized',402:'payment',413:'too-large',429:'limit',503:'disabled'};
 const MESSAGES={
  'bad-request':'El proveedor ha rechazado la solicitud.','unauthorized':'El proveedor no reconoce la autorización de RUBIK.',
  'payment':'El proveedor ha rechazado la solicitud por saldo o facturación: no se ha generado nada.','too-large':'La imagen es demasiado grande para el proveedor.',
  'limit':'Se ha alcanzado el límite de uso: no se ha generado nada.','disabled':'El servicio de reforma desde fotografía está desactivado en el servidor.',
  'provider-error':'El proveedor ha devuelto un error: no se ha generado ninguna imagen.','network':'No se ha podido contactar con el proveedor.',
  'invalid-response':'La respuesta del proveedor no cumple el contrato: se descarta y no se muestra nada.'};

 // Configuración de ESTE despliegue: no hay proveedor. Cambiarla exige una decisión humana (ver docs/photo-project).
 function config(){return Object.freeze({configured:false,authorized:false,endpoint:null,providerId:null,governance:Object.freeze({gov05:false,img04:false})});}

 const fail=(reason,extra={})=>({ok:false,reason,message:MESSAGES[reason]||reason,...extra});
 function b64ToBytes(s){
  if(typeof s!=='string'||!s||s.length>Math.ceil(MAX_IMAGE_BYTES*4/3)+4||!/^[A-Za-z0-9+/]+={0,2}$/.test(s))return null;
  if(typeof Buffer!=='undefined')return new Uint8Array(Buffer.from(s,'base64'));
  const bin=atob(s),out=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)out[i]=bin.charCodeAt(i);return out;
 }
 const sniff=b=>b[0]===0xff&&b[1]===0xd8&&b[2]===0xff?'image/jpeg':b[0]===0x89&&b[1]===0x50&&b[2]===0x4e&&b[3]===0x47?'image/png'
  :b[0]===0x52&&b[1]===0x49&&b[2]===0x46&&b[3]===0x46&&b[8]===0x57&&b[9]===0x45&&b[10]===0x42&&b[11]===0x50?'image/webp':null;

 // Respuesta v1: {version:1, provider:{id,name}, alternatives:[{index, mediaType, data(base64)}], cost:null|{amount,currency}}.
 function validateResponse(resp,request){
  if(!resp||typeof resp!=='object'||Array.isArray(resp))return fail('invalid-response');
  if(Object.keys(resp).sort().join(',')!=='alternatives,cost,provider,version'||resp.version!==CONTRACT_VERSION)return fail('invalid-response');
  const p=resp.provider;
  if(!p||typeof p!=='object'||Object.keys(p).sort().join(',')!=='id,name'||!ID_RE.test(p.id)||typeof p.name!=='string'||!p.name.trim()||p.name.length>60)return fail('invalid-response');
  let cost=null;
  if(resp.cost!==null){const c=resp.cost;
   if(!c||typeof c!=='object'||Object.keys(c).sort().join(',')!=='amount,currency'||!Number.isFinite(c.amount)||c.amount<0||!['USD','EUR'].includes(c.currency))return fail('invalid-response');
   cost={amount:c.amount,currency:c.currency};}
  const want=request?.alternatives;
  if(!Array.isArray(resp.alternatives)||!resp.alternatives.length||!(Number.isInteger(want)&&resp.alternatives.length<=want))return fail('invalid-response');
  const seen=new Set(),alternatives=[];
  for(const a of resp.alternatives){
   if(!a||typeof a!=='object'||Object.keys(a).sort().join(',')!=='data,index,mediaType'||!Number.isInteger(a.index)||a.index<0||a.index>=want||seen.has(a.index)||!MEDIA.includes(a.mediaType))return fail('invalid-response');
   const bytes=b64ToBytes(a.data);if(!bytes||bytes.length<16||bytes.length>MAX_IMAGE_BYTES||sniff(bytes)!==a.mediaType)return fail('invalid-response');
   seen.add(a.index);alternatives.push({index:a.index,mediaType:a.mediaType,bytes});
  }
  return {ok:true,provider:{id:p.id,name:p.name.trim()},cost,alternatives:alternatives.sort((x,y)=>x.index-y.index)};
 }

 // Adaptador de SERVIDOR (photo-reform/1, mismo origen). Sustituye al antiguo adaptador HTTP, que enviaba un token
 // Bearer del proveedor desde el navegador (defecto de seguridad señalado en V2): ahora el navegador solo habla con
 // /api/photo-reform de este mismo sitio, sin secretos del proveedor, en dos pasos:
 //   1. «quote»: el servidor devuelve la estimación (precio fechado × salidas) y un id de confirmación de un solo uso;
 //   2. la pantalla muestra la estimación y la persona confirma (confirm(quote) debe resolver true);
 //   3. «generate»: con el id de confirmación y una clave de idempotencia; el servidor reserva el gasto y llama UNA vez.
 // accessCode es el código de acceso del profesional a este servicio (no es la clave del proveedor) y se envía en su
 // propia cabecera; nunca «Authorization» ni el código de /api/render. La pantalla no lo crea mientras config() diga
 // que no hay servicio configurado.
 const ENDPOINT='/api/photo-reform';
 const SERVER_STATUS={400:'bad-request',401:'unauthorized',403:'unauthorized',402:'budget',409:'confirmation',413:'too-large',429:'limit',503:'disabled'};
 Object.assign(MESSAGES,{budget:'El servidor ha rechazado la solicitud por el tope de gasto o de imágenes: no se ha generado nada.',confirmation:'La confirmación de gasto no es válida, ha caducado o ya se usó: no se ha generado nada.',
  'not-confirmed':'No se ha confirmado el gasto estimado: no se ha enviado nada al proveedor.'});
 const hex=buf=>Array.from(new Uint8Array(buf),b=>b.toString(16).padStart(2,'0')).join('');
 function randomKey(){const a=new Uint8Array(18);(root.crypto||globalThis.crypto).getRandomValues(a);let s='';for(const b of a)s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
 async function toDataUrl(bytes,type){let bin='';for(let i=0;i<bytes.length;i+=0x8000)bin+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return `data:${type};base64,${btoa(bin)}`;}
 function serverAdapter({accessCode,confirm,fetch:fetchImpl,origin}={}){
  if(typeof accessCode!=='string'||accessCode.length<32||accessCode.length>200)throw Error('Falta el código de acceso del servicio.');
  if(typeof confirm!=='function')throw Error('Falta la confirmación de gasto.');
  const doFetch=fetchImpl||(typeof fetch==='function'?fetch.bind(root):null);if(!doFetch)throw Error('Sin fetch.');
  const base=origin||root.location?.origin;if(!base)throw Error('Sin origen.');
  const url=new URL(ENDPOINT,base).href; // siempre este mismo sitio: no admite otro destino
  const headers={'content-type':'application/json','x-rubik-contract':`photo-reform/${CONTRACT_VERSION}`,'x-rubik-photo-reform-token':accessCode};
  const post=(body,signal)=>doFetch(url,{method:'POST',headers,body:JSON.stringify(body),signal,credentials:'same-origin',referrerPolicy:'no-referrer',redirect:'error'});
  return Object.freeze({id:'server-v1',kind:'generated',
   async run(request,image,{signal,onItem=()=>{}}={}){
    if(!request||request.version!==1||!image||!MEDIA.includes(image.type))return fail('bad-request');
    const req={version:1,intent:request.intent,finish:request.finish??null,alternatives:request.alternatives};
    const bytes=new Uint8Array(await image.arrayBuffer());if(!bytes.length||bytes.length>4*1024*1024||sniff(bytes)!==image.type)return fail('bad-request');
    const digest=hex(await (root.crypto||globalThis.crypto).subtle.digest('SHA-256',bytes));
    let res,quote;
    try{res=await post({action:'quote',request:req,imageSha256:digest,imageBytes:bytes.length},signal);}catch(e){if(e?.name==='AbortError')throw e;return fail('network');}
    if(!res.ok){const b=await res.json().catch(()=>null);return fail(SERVER_STATUS[res.status]||'provider-error',{status:res.status,code:typeof b?.error==='string'?b.error.slice(0,40):null});}
    try{quote=await res.json();}catch{return fail('invalid-response');}
    if(!quote||quote.contract!=='photo-reform/1'||typeof quote.confirmationId!=='string'||!quote.estimate||!Number.isFinite(quote.estimate.amount))return fail('invalid-response');
    if(!(await confirm(Object.freeze({estimate:{...quote.estimate},budget:{...quote.budget},provider:{...quote.provider},model:quote.model,expiresAt:quote.expiresAt}))))return fail('not-confirmed');
    if(signal?.aborted)throw new DOMException('Cancelado','AbortError');
    try{res=await post({action:'generate',confirmationId:quote.confirmationId,idempotencyKey:randomKey(),request:req,image:await toDataUrl(bytes,image.type)},signal);}
    catch(e){if(e?.name==='AbortError')throw e;return fail('network');}
    if(!res.ok){const b=await res.json().catch(()=>null);return fail(SERVER_STATUS[res.status]||'provider-error',{status:res.status,code:typeof b?.error==='string'?b.error.slice(0,40):null});}
    let body;try{body=await res.json();}catch{return fail('invalid-response');}
    const v=validateResponse(body,request);if(!v.ok)return v;
    const requestId=(res.headers?.get?.('x-rubik-request-id')||'').slice(0,40)||null,billed=Number(res.headers?.get?.('x-rubik-outputs-billed'));
    for(const a of v.alternatives)onItem(a.index,{kind:'generated',provider:v.provider,cost:v.cost,mediaType:a.mediaType,bytes:a.bytes});
    return {ok:true,provider:v.provider,cost:v.cost,count:v.alternatives.length,requestId,outputsBilled:Number.isInteger(billed)?billed:null,estimate:{...quote.estimate}};
   }});
 }

 const api={CONTRACT_VERSION,MEDIA,MAX_IMAGE_BYTES,MESSAGES,ENDPOINT,config,validateResponse,serverAdapter};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.RubikPhotoReformProvider=api;
})(typeof globalThis!=='undefined'?globalThis:this);
