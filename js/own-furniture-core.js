/* MUE-01 «Traer mi mueble» · núcleo PURO (sin DOM, sin red). Un mueble propio es un objeto canónico normal
   (type, name, position, rotationDeg, size.widthMm/depthMm/heightMm): su volumen y sus medidas viajan con el proyecto
   como cualquier otro mueble. La fotografía NO es parte del objeto canónico (el esquema no la admite: sourceImages es
   de planos y assetRef solo de catálogos). Su asociación vive en una extensión estricta y experimental:
     project.extensions['x-mue01-furniture-photo'] = { version: 1, items: [ { objectId, photo } ] }
   donde photo = null (mueble propio sin foto conservada) o
     { imageKey:'mue01/<sha256>', sha256, mediaType:'image/jpeg', widthPx, heightPx, bytes, addedAt }
   Los bytes viven SOLO en este navegador (IndexedDB de imágenes de RUBIK), ya recomprimidos y sin metadatos (EXIF/GPS).
   La extensión es una REFERENCIA: al exportar/importar viaja la referencia, no la foto. Nunca se guarda el nombre del
   archivo original. Ninguna función de aquí escribe fuera del proyecto que recibe. */
(function(root){
 'use strict';
 const EXT='x-mue01-furniture-photo',VERSION=1;
 // Categorías compatibles: tipos genéricos que RUBIK dibuja en 2D y 3D y escala a la altura declarada.
 // (Armario queda fuera: su modelo paramétrico es de R03.)
 const CATEGORIES=Object.freeze([
  ['sofa','Sofá'],['armchair','Butaca'],['bed','Cama'],['table','Mesa'],['chair','Silla'],['desk','Escritorio'],
  ['bookshelf','Estantería'],['cabinet','Aparador o mueble alto'],['dresser','Cómoda'],['tvstand','Mueble de TV'],
  ['coffeetable','Mesa de centro'],['sidetable','Mesa auxiliar'],['nightstand','Mesilla']].map(([type,label])=>Object.freeze({type,label})));
 const LIMITS=Object.freeze({widthMm:[100,6000],depthMm:[100,6000],heightMm:[50,3000],nameMax:100,
  photoMaxBytes:12*1024*1024,photoMaxSide:1600,storedMaxBytes:5*1024*1024,storedMaxSide:4096});
 const KEY_RE=/^mue01\/[0-9a-f]{64}$/,SHA_RE=/^[0-9a-f]{64}$/,ID_RE=/^obj_[A-Za-z0-9][A-Za-z0-9_-]{2,63}$/;

 const intIn=(v,[lo,hi])=>{const n=typeof v==='string'&&v.trim()!==''?Number(v):v;return Number.isInteger(n)&&n>=lo&&n<=hi?n:null;};
 // Datos del formulario → especificación del mueble, con un error por campo (en mm enteros, como el contrato).
 function validateSpec(input={}){
  const errors={};const name=String(input.name??'').trim();
  if(!name)errors.name='Escribe un nombre.';else if(name.length>LIMITS.nameMax)errors.name=`Máximo ${LIMITS.nameMax} caracteres.`;
  const cat=CATEGORIES.find(c=>c.type===input.type);if(!cat)errors.type='Elige una categoría de la lista.';
  const dims={};
  for(const [k,label] of [['widthMm','Anchura'],['depthMm','Fondo'],['heightMm','Altura']]){
   const raw=input[k];const [lo,hi]=LIMITS[k];
   if(raw===undefined||raw===null||String(raw).trim()===''){errors[k]=`${label}: obligatoria.`;continue;}
   const n=Number(raw);
   if(!Number.isFinite(n))errors[k]=`${label}: escribe un número en milímetros.`;
   else if(!Number.isInteger(n))errors[k]=`${label}: en milímetros enteros (sin decimales).`;
   else if(n<lo||n>hi)errors[k]=`${label}: entre ${lo} y ${hi} mm.`;else dims[k]=n;
  }
  const rot=intIn(input.rotationDeg??0,[0,359]);if(rot===null)errors.rotationDeg='Rotación: un número entero de 0 a 359 grados.';
  if(Object.keys(errors).length)return {ok:false,errors};
  return {ok:true,spec:{type:cat.type,name,w:dims.widthMm,d:dims.depthMm,h:dims.heightMm,rot}};
 }

 // Formato REAL por los primeros bytes (no por el nombre ni el tipo declarado).
 function sniff(bytes){
  const b=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes||[]);
  if(b.length>=3&&b[0]===0xff&&b[1]===0xd8&&b[2]===0xff)return 'image/jpeg';
  if(b.length>=8&&[0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a].every((v,i)=>b[i]===v))return 'image/png';
  if(b.length>=12&&String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...b.slice(8,12))==='WEBP')return 'image/webp';
  return null;
 }
 // Antes de decodificar: tamaño y formato. (La decodificación real, que detecta archivos corruptos, la hace el navegador.)
 function checkPhoto({size,head}){
  if(!Number.isFinite(size)||size<=0)return {ok:false,reason:'empty',message:'El archivo está vacío.'};
  if(size>LIMITS.photoMaxBytes)return {ok:false,reason:'too-large',message:`La foto pesa demasiado (máximo ${LIMITS.photoMaxBytes/1024/1024} MB).`};
  const type=sniff(head);
  if(!type)return {ok:false,reason:'format',message:'Formato no admitido: usa una foto JPEG, PNG o WebP.'};
  return {ok:true,mediaType:type};
 }
 // Tamaño de la copia que se conserva: el lado mayor como máximo photoMaxSide, sin ampliar.
 function fitSize(w,h,max=LIMITS.photoMaxSide){if(!(w>0&&h>0))return null;const k=Math.min(1,max/Math.max(w,h));return {w:Math.max(1,Math.round(w*k)),h:Math.max(1,Math.round(h*k))};}

 function validatePhoto(photo){
  if(photo===null)return true;
  if(!photo||typeof photo!=='object'||Array.isArray(photo))return false;
  const keys=Object.keys(photo).sort().join(',');
  if(keys!=='addedAt,bytes,heightPx,imageKey,mediaType,sha256,widthPx')return false;
  return KEY_RE.test(photo.imageKey)&&SHA_RE.test(photo.sha256)&&photo.imageKey==='mue01/'+photo.sha256&&photo.mediaType==='image/jpeg'
   &&Number.isInteger(photo.widthPx)&&photo.widthPx>=1&&photo.widthPx<=LIMITS.storedMaxSide&&Number.isInteger(photo.heightPx)&&photo.heightPx>=1&&photo.heightPx<=LIMITS.storedMaxSide
   &&Number.isInteger(photo.bytes)&&photo.bytes>0&&photo.bytes<=LIMITS.storedMaxBytes&&typeof photo.addedAt==='string'&&!Number.isNaN(Date.parse(photo.addedAt));
 }
 // Lectura tolerante: nunca rompe el proyecto. 'future' y 'invalid' se tratan como solo lectura (no se reescriben).
 function read(project){
  const raw=project?.extensions?.[EXT];
  if(raw===undefined)return {status:'absent',items:new Map()};
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||!Number.isInteger(raw.version))return {status:'invalid',items:new Map()};
  if(raw.version>VERSION)return {status:'future',items:new Map()};
  if(raw.version!==VERSION||!Array.isArray(raw.items)||Object.keys(raw).sort().join(',')!=='items,version')return {status:'invalid',items:new Map()};
  const items=new Map();
  for(const it of raw.items){
   if(!it||typeof it!=='object'||Object.keys(it).sort().join(',')!=='objectId,photo'||!ID_RE.test(it.objectId)||!validatePhoto(it.photo)||items.has(it.objectId))return {status:'invalid',items:new Map()};
   items.set(it.objectId,it.photo);
  }
  return {status:'ok',items};
 }
 const writable=s=>s==='ok'||s==='absent';
 function write(project,items){
  const live=new Set((project.objects||[]).map(o=>o.id));
  const list=[...items].filter(([id])=>live.has(id)).map(([objectId,photo])=>({objectId,photo:photo?{...photo}:null}));
  project.extensions=project.extensions||{};
  if(list.length)project.extensions[EXT]={version:VERSION,items:list};else delete project.extensions[EXT];
  if(project.extensions&&!Object.keys(project.extensions).length)delete project.extensions;
  return project;
 }
 // Escrituras (mutan el proyecto que reciben, para usarse dentro de un único paso del deshacer). Retiran de paso las
 // entradas cuyo objeto ya no existe.
 function attach(project,objectId,photo){
  const r=read(project);if(!writable(r.status))throw Error('La referencia fotográfica de este proyecto es de otra versión o está dañada: no se modifica.');
  if(!ID_RE.test(objectId)||!(project.objects||[]).some(o=>o.id===objectId))throw Error('Ese mueble no existe en el proyecto.');
  if(!validatePhoto(photo))throw Error('Datos de la foto no válidos.');
  r.items.set(objectId,photo);return write(project,r.items);
 }
 function detach(project,objectId){const r=read(project);if(!writable(r.status))throw Error('La referencia fotográfica de este proyecto es de otra versión o está dañada: no se modifica.');r.items.delete(objectId);return write(project,r.items);}
 // «Duplicar» un mueble propio: la copia es otro «mi mueble» con la MISMA referencia fotográfica (la clave es el hash
 // del contenido, así que ambos apuntan a los mismos bytes locales; ninguna acción de RUBIK borra esos bytes). Se
 // llama dentro del mismo paso del deshacer que crea la copia. Datos de otra versión o dañados: no se tocan.
 function duplicate(project,fromId,toId){
  const r=read(project);if(!writable(r.status)||!r.items.has(fromId))return {changed:false};
  if(!ID_RE.test(toId)||!(project.objects||[]).some(o=>o.id===toId))throw Error('La copia no existe en el proyecto.');
  r.items.set(toId,r.items.get(fromId));write(project,r.items);return {changed:true};
 }
 function prune(project){const r=read(project);return writable(r.status)?write(project,r.items):project;}

 // Qué ve el profesional en el panel del mueble.
 function photoStatus(project,objectId,available){
  const r=read(project);
  if(r.status==='future')return {state:'unsupported',own:false,message:'La referencia fotográfica es de una versión más nueva de RUBIK: se conserva sin cambios.'};
  if(r.status==='invalid')return {state:'unsupported',own:false,message:'La referencia fotográfica está dañada: se ignora y el mueble funciona igual.'};
  if(!r.items.has(objectId))return {state:'none',own:false};
  const photo=r.items.get(objectId);
  if(!photo)return {state:'not-stored',own:true,message:'Este mueble no tiene foto conservada: el volumen y sus medidas funcionan igual.'};
  if(!available)return {state:'missing',own:true,photo,message:'Falta la foto en este navegador (no viaja al exportar ni a otros equipos). El volumen y sus medidas siguen intactos.'};
  return {state:'ok',own:true,photo};
 }

 const api={EXT,VERSION,CATEGORIES,LIMITS,validateSpec,sniff,checkPhoto,fitSize,validatePhoto,read,attach,detach,duplicate,prune,photoStatus};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.RubikOwnFurnitureCore=api;
})(globalThis);
