/* FOT-01 · «Reformar desde fotografía» · contrato de proveedor v1 e integración desacoplada, SIN ACTIVAR.
   Este despliegue no tiene proveedor real: no hay endpoint de servidor para fotografías de reforma, ni clave, ni
   autorización del propietario, y GOV-05 (privacidad de imágenes) e IMG-04/GOV-06a (gasto controlado) siguen
   pendientes. Este módulo deja preparada y probada la pieza del navegador para el día en que se autorice:
     · adaptador = {id, kind, run(request, image, {signal, onItem})}: la interfaz ÚNICA que usa la pantalla. El
       adaptador simulado (local, rotulado) y el futuro adaptador HTTP la cumplen igual, así que activarlo no cambia
       la interfaz ni las garantías (consentimiento, puerta, rótulos, descarte, proyecto intacto).
     · httpAdapter({endpoint, token, fetch}): envía SOLO la solicitud cerrada de RubikPhotoReformCore.request y la
       imagen recomprimida, con un nombre de archivo fijo («photo.jpg»): nunca el proyecto, el nombre original, EXIF
       ni texto libre. La pantalla NO lo crea en este despliegue (config().configured === false); las pruebas lo
       ejercitan contra un servidor local simulado.
     · validateResponse: respuesta estricta (claves cerradas, tipos de imagen, tamaños, coste solo si el proveedor lo
       informa). Una respuesta que no cumple el contrato se rechaza: nunca se inventa una imagen ni un coste.
   No reutiliza /api/render: aquel contrato es para vistas 3D de RUBIK, no para fotografías de clientes. */
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

 // Adaptador HTTP (no se crea en este despliegue). request = salida .request de RubikPhotoReformCore.request.
 function httpAdapter({endpoint,token,fetch:fetchImpl}={}){
  if(typeof endpoint!=='string'||!/^https:\/\/|^http:\/\/127\.0\.0\.1[:/]/.test(endpoint))throw Error('Endpoint de proveedor no válido.');
  if(typeof token!=='string'||!token)throw Error('Falta la autorización del proveedor.');
  const doFetch=fetchImpl||(typeof fetch==='function'?fetch.bind(root):null);if(!doFetch)throw Error('Sin fetch.');
  return Object.freeze({id:'http-v1',kind:'generated',
   async run(request,image,{signal,onItem=()=>{}}={}){
    if(!request||request.version!==1||!image||!MEDIA.includes(image.type))return fail('bad-request');
    const form=new FormData();
    form.append('request',JSON.stringify({version:request.version,intent:request.intent,finish:request.finish??null,alternatives:request.alternatives}));
    form.append('image',image,'photo.jpg');
    let res;
    try{res=await doFetch(endpoint,{method:'POST',body:form,signal,headers:{authorization:`Bearer ${token}`,'x-rubik-contract':`photo-reform/${CONTRACT_VERSION}`},credentials:'omit',referrerPolicy:'no-referrer'});}
    catch(e){if(e?.name==='AbortError')throw e;return fail('network');}
    if(!res.ok)return fail(STATUS[res.status]||'provider-error',{status:res.status});
    let body;try{body=await res.json();}catch{return fail('invalid-response');}
    const v=validateResponse(body,request);if(!v.ok)return v;
    for(const a of v.alternatives)onItem(a.index,{kind:'generated',provider:v.provider,cost:v.cost,mediaType:a.mediaType,bytes:a.bytes});
    return {ok:true,provider:v.provider,cost:v.cost,count:v.alternatives.length};
   }});
 }

 const api={CONTRACT_VERSION,MEDIA,MAX_IMAGE_BYTES,MESSAGES,config,validateResponse,httpAdapter};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.RubikPhotoReformProvider=api;
})(typeof globalThis!=='undefined'?globalThis:this);
