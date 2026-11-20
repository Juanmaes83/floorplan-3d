/* RUBIK SOTA · Studio E4 / K11 / IMG-12 / ENT-05 · núcleo de laboratorio (puro: sin DOM, red ni almacenamiento propio).
 *
 * Contrato «rubik-lab-visual-result/1»: un resultado visual identificable, verificable y recuperable con su origen y revisión.
 * Reutiliza autoridades existentes; NO crea otro motor de imagen, gestor documental ni autoridad de persistencia:
 *  - toma de vistas: FloorPlanProjectViews (takeId + takenAt, candidata Codex 64f8837) → vistas reales del editor;
 *  - Render IA: js/ai-render-ui.js (estilo, acabados, proveedor, modelo, consumo y coste SOLO si el proveedor los informa);
 *  - identidad portable y revisión: contratos E3 (FloorPlanExpediente.contentId + readConfirmed().revision);
 *  - bytes: FloorPlanImages (js/local-images.js), direccionados por contenido («k11:<sha256>»);
 *  - metadatos: extensión del proyecto, como CAT-04 (js/visual-reference-core.js, «x-cat04-visual-refs»).
 * Hallazgos que resuelve: K11-A (imagen original ≠ bytes enviados), K11-B (recaptura y caché por takeId),
 * K11-C (autoridad de persistencia: contrato + adaptador AISLADO; ningún escritor productivo nuevo).
 * Separa: vista real observada · revisión confirmada · resultado simulado · imagen generada por IA · selección profesional.
 * Integridad ≠ autenticidad jurídica ≠ aceptación del cliente. Un favorito no es una aceptación.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.RubikK11=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const SCHEMA='rubik-lab-visual-result/1',EXT='x-k11-visual-results',EXT_VERSION=1,REF='k11:';
 const LANGS=['es','en','zh'];
 const enc=new TextEncoder();
 const plano=v=>{const p=Object.getPrototypeOf(v);return p===Object.prototype||p===null;};
 const canon=x=>JSON.stringify(function s(v){if(Array.isArray(v))return v.map(s);
  if(v&&typeof v==='object'){if(!plano(v))throw Object.assign(new TypeError('canon: valor no plano'),{code:'no-normalizado'});return Object.fromEntries(Object.keys(v).sort().map(k=>[k,s(v[k])]));}
  if(typeof v==='number'&&!Number.isFinite(v))throw Object.assign(new TypeError('canon: número no finito'),{code:'no-normalizado'});return v;}(x));
 const H64=/^[0-9a-f]{64}$/,ISO=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;
 const fallo=(code,detalle)=>Object.assign(new Error(code+(detalle?': '+detalle:'')),{code,detalle:detalle||null});
 // Clases de resultado (nunca se confunden): la vista real observada del editor, una imagen generada por IA y un resultado
 // simulado en el laboratorio (sin proveedor real). La «selección profesional» es una marca aparte (favorito), no una clase.
 const CLASES=Object.freeze({'vista-real':{rotulo:'vista-real'},'render-ia':{rotulo:'ia'},'simulado-laboratorio':{rotulo:'simulado'}});
 // Destinos de uso cerrados. Un destino desconocido se rechaza; uno no autorizado por los derechos del resultado, también.
 const DESTINOS=Object.freeze(['estudio','comparacion','presentacion-orientativa','entrega-orientativa']);
 const DESTINOS_POR_CLASE=Object.freeze({'vista-real':['estudio','comparacion','presentacion-orientativa','entrega-orientativa'],'render-ia':['estudio','comparacion','presentacion-orientativa'],'simulado-laboratorio':['estudio','comparacion']});

 // ---------------------------------------------------------------- bytes y data: URL (sin DOM)
 function dataUrlABytes(u){const m=/^data:([a-z]+\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/i.exec(String(u||''));if(!m)throw fallo('recurso-invalido','no es data:…;base64');
  const b64=m[2];let bytes;if(typeof Buffer!=='undefined')bytes=new Uint8Array(Buffer.from(b64,'base64'));else{const s=atob(b64);bytes=new Uint8Array(s.length);for(let i=0;i<s.length;i++)bytes[i]=s.charCodeAt(i);}
  return {mediaType:m[1].toLowerCase(),bytes};}
 function bytesADataUrl(mediaType,bytes){let b64;if(typeof Buffer!=='undefined')b64=Buffer.from(bytes).toString('base64');else{let s='';for(let i=0;i<bytes.length;i+=0x8000)s+=String.fromCharCode.apply(null,bytes.subarray(i,i+0x8000));b64=btoa(s);}return `data:${mediaType};base64,${b64}`;}
 const MEDIA=/^image\/(png|jpeg|webp)$/;

 // ---------------------------------------------------------------- K11-B · clave de caché con la toma
 /** Clave de reutilización de un resultado. Igual que la de ai-render-ui.js (entrada|proyecto|revisión|vista|estilo|suelo|
  *  paredes) MÁS el takeId de la toma: una recaptura con el mismo id de vista y la misma revisión geométrica NO reutiliza
  *  el resultado anterior. Sin takeId no hay clave (no se reutiliza nada). */
 function claveCache({entryId,projectId,revision,takeId,viewId,style,floor='',walls=''}={}){
  if(typeof takeId!=='string'||!takeId)return null;
  return [entryId??'',projectId??'',revision??'',takeId,viewId??'',style??'',floor||'',walls||''].join('|');}

 // ---------------------------------------------------------------- contrato del resultado
 async function recurso(entrada,digest,{derivadaDe=null,transformacion=null}={}){
  if(!entrada)return null;const {mediaType,bytes}=entrada.bytes?entrada:dataUrlABytes(entrada.dataUrl);
  if(!MEDIA.test(mediaType))throw fallo('recurso-invalido','tipo '+mediaType);if(!bytes||!bytes.length)throw fallo('recurso-invalido','sin bytes');
  const sha256=await digest(bytes);
  return {sha256,mediaType,bytes:bytes.length,storage:{kind:'local-browser',ref:REF+sha256},...(derivadaDe?{derivadaDe}:{}),...(transformacion?{transformacion}:{})};}
 /**
  * Crea la ficha trazable. entrada:
  *  clase · sujeto{projectId,entryId,levelId,contentId,revision} · toma{takeId,takenAt,viewId,viewLabel,source} ·
  *  original{dataUrl|bytes} (vista real) · enviada{dataUrl|bytes,transformacion} (bytes exactos al proveedor) ·
  *  resultado{dataUrl|bytes} · estilo{style,floor,walls} · procedencia{proveedor,modelo,generatedAt,consumo,coste} ·
  *  camara · iluminacion · derechos{titular,destinos}
  * Lo que no consta queda null y se enumera en «noAcreditado»: nunca se inventa.
  */
 async function crearResultado(e,{digest,nuevoId}){
  if(!CLASES[e?.clase])throw fallo('clase-desconocida',String(e?.clase));
  const s=e.sujeto||{},t=e.toma||{};
  if(typeof s.projectId!=='string'||!s.projectId)throw fallo('sujeto-incompleto','projectId');
  if(!H64.test(s.contentId||''))throw fallo('sujeto-incompleto','contentId');
  if(!Number.isInteger(s.revision)||s.revision<1)throw fallo('sujeto-incompleto','revision');
  if(typeof t.takeId!=='string'||!t.takeId)throw fallo('sin-toma','takeId');
  if(typeof t.takenAt!=='string'||!ISO.test(t.takenAt))throw fallo('sin-toma','takenAt');
  if(typeof t.viewId!=='string'||!t.viewId)throw fallo('sin-toma','viewId');
  const original=await recurso(e.original,digest);if(!original)throw fallo('recurso-invalido','original');
  let enviada=null,resultado;
  if(e.clase==='vista-real'){if(e.enviada||e.resultado)throw fallo('clase-incoherente','una vista real no tiene envío ni resultado distinto');resultado={...original};}
  else{
   // K11-A: la imagen enviada al proveedor es un recurso PROPIO, derivado del original y verificable por sus bytes.
   if(!e.enviada)throw fallo('sin-envio','falta la imagen exacta enviada');
   enviada=await recurso(e.enviada,digest,{derivadaDe:original.sha256,transformacion:e.enviada.transformacion||null});
   if(!enviada.transformacion)throw fallo('sin-envio','transformación no declarada');
   resultado=await recurso(e.resultado,digest);if(!resultado)throw fallo('recurso-invalido','resultado');}
  const pr=e.procedencia||{};
  if(e.clase==='render-ia'&&(typeof pr.proveedor!=='string'||!pr.proveedor))throw fallo('procedencia-incompleta','proveedor');
  if(e.clase==='simulado-laboratorio'&&pr.proveedor!=='simulador-laboratorio')throw fallo('clase-incoherente','un simulado solo tiene proveedor «simulador-laboratorio»');
  const finito=v=>v!=null&&typeof v==='object'&&Number.isFinite(v.amount)?{amount:v.amount,currency:typeof v.currency==='string'?v.currency:'USD',fuente:typeof v.fuente==='string'?v.fuente:'tarifa-configurada'}:null;
  const procedencia={proveedor:e.clase==='vista-real'?'rubik-vista-3d':pr.proveedor,modelo:typeof pr.modelo==='string'&&pr.modelo?pr.modelo:null,
   generatedAt:typeof pr.generatedAt==='string'&&ISO.test(pr.generatedAt)?pr.generatedAt:null,
   consumo:pr.consumo&&typeof pr.consumo==='object'?Object.fromEntries(Object.entries(pr.consumo).filter(([,v])=>Number.isInteger(v)&&v>=0)):null,coste:finito(pr.coste)};
  if(procedencia.consumo&&!Object.keys(procedencia.consumo).length)procedencia.consumo=null;
  const destinosPedidos=Array.isArray(e.derechos?.destinos)?e.derechos.destinos:DESTINOS_POR_CLASE[e.clase];
  for(const d of destinosPedidos){if(!DESTINOS.includes(d))throw fallo('destino-desconocido',String(d));if(!DESTINOS_POR_CLASE[e.clase].includes(d))throw fallo('permiso-insuficiente',`${e.clase} no admite «${d}»`);}
  const estilo={style:typeof e.estilo?.style==='string'?e.estilo.style:null,floor:e.estilo?.floor||null,walls:e.estilo?.walls||null};
  const camara=e.camara&&typeof e.camara==='object'?JSON.parse(canon(e.camara)):null,iluminacion=e.iluminacion&&typeof e.iluminacion==='object'?JSON.parse(canon(e.iluminacion)):null;
  const noAcreditado=[...(camara?[]:['camara']),...(iluminacion?[]:['iluminacion']),...(e.clase==='vista-real'?[]:[...(procedencia.modelo?[]:['modelo']),...(procedencia.consumo?[]:['consumo']),...(procedencia.coste?[]:['coste']),...(procedencia.generatedAt?[]:['fecha-generacion'])])];
  const cuerpo={schema:SCHEMA,id:nuevoId(),clase:e.clase,
   sujeto:{projectId:s.projectId,entryId:s.entryId??null,levelId:s.levelId??null,contentId:s.contentId,revision:s.revision},
   toma:{takeId:t.takeId,takenAt:t.takenAt,viewId:t.viewId,viewLabel:typeof t.viewLabel==='string'?t.viewLabel:'',source:t.source??null},
   camara,iluminacion,recursos:{original,enviada,resultado},estilo,procedencia,
   derechos:{titular:'propietario-del-proyecto',destinos:[...destinosPedidos],rotulo:CLASES[e.clase].rotulo},
   noAcreditado,creadoEn:typeof e.ahora==='string'&&ISO.test(e.ahora)?e.ahora:null};
  cuerpo.claveContenido=await digest(enc.encode(canon({c:cuerpo.clase,s:cuerpo.sujeto.contentId,t:cuerpo.toma.takeId,v:cuerpo.toma.viewId,e:estilo,r:resultado.sha256})));
  return {...cuerpo,huella:await digest(enc.encode(canon(cuerpo)))};
 }
 const cuerpoDe=r=>{const {huella,...c}=r;return c;};

 // ---------------------------------------------------------------- verificación: integridad (bytes) y vigencia (separadas)
 /** integridad: integro · incompleto (faltan bytes) · invalido (ficha o bytes alterados) · no-comprobable
  *  vigencia : vigente · vigente-restaurado · toma-anterior · desactualizado · otro-proyecto · sin-comprobar
  *  Nunca modifica la ficha: reabrirla no la reasigna a una revisión posterior. */
 async function verificar(r,{digest,leerBytes,actual=null}={}){
  const motivos=[];
  try{if(!r||r.schema!==SCHEMA||!H64.test(r.huella||'')||await digest(enc.encode(canon(cuerpoDe(r))))!==r.huella)return {integridad:'invalido',vigencia:'sin-comprobar',motivos:['ficha-alterada']};}
  catch{return {integridad:'invalido',vigencia:'sin-comprobar',motivos:['ficha-alterada']};}
  if(r.recursos?.enviada&&r.recursos.enviada.derivadaDe!==r.recursos.original?.sha256)return {integridad:'invalido',vigencia:'sin-comprobar',motivos:['envio-no-derivado']};
  const recursos={};
  for(const [k,x] of Object.entries(r.recursos)){if(!x)continue;
   if(typeof leerBytes!=='function'){recursos[k]='no-comprobable';continue;}
   let b;try{b=await leerBytes(x.storage.ref);}catch{recursos[k]='no-comprobable';continue;}
   if(!b){recursos[k]='ausente';continue;}
   recursos[k]=b.length===x.bytes&&await digest(b)===x.sha256?'ok':'alterado';}
  const est=Object.values(recursos);
  const integridad=est.includes('alterado')?'invalido':est.includes('ausente')?'incompleto':est.includes('no-comprobable')?'no-comprobable':'integro';
  for(const [k,v] of Object.entries(recursos))if(v!=='ok')motivos.push(`${k}:${v}`);
  let vigencia='sin-comprobar';
  if(actual&&H64.test(actual.contentId||'')){
   if(actual.contentId!==r.sujeto.contentId)vigencia=actual.projectId&&actual.projectId!==r.sujeto.projectId?'otro-proyecto':'desactualizado';
   else if(r.clase!=='vista-real'&&actual.takeId!==r.toma.takeId)vigencia='toma-anterior';
   else vigencia=actual.revision!==undefined&&actual.revision!==r.sujeto.revision?'vigente-restaurado':'vigente';}
  return {integridad,vigencia,motivos,recursos};
 }
 /** Uso permitido. Destino desconocido o no autorizado por los derechos, o ficha no íntegra → rechazado con motivo. */
 function permitir(r,destino,verif){
  if(!DESTINOS.includes(destino))return {ok:false,motivo:'destino-desconocido'};
  if(!r?.derechos?.destinos?.includes(destino))return {ok:false,motivo:'permiso-insuficiente'};
  if(!verif||verif.integridad!=='integro')return {ok:false,motivo:'no-integro'};
  if(destino!=='estudio'&&destino!=='comparacion'&&!['vigente','vigente-restaurado'].includes(verif.vigencia))return {ok:false,motivo:'no-vigente'};
  return {ok:true,rotulo:r.derechos.rotulo};}

 // ---------------------------------------------------------------- K11-C · conservación (contrato + adaptador AISLADO)
 /** Contrato propuesto (para Codex; no se activa aquí):
  *  - metadatos en project.extensions["x-k11-visual-results"] = {version:1, results:{[id]:ficha}, favoritos:{[id]:{at}}}:
  *    viajan con el proyecto bajo la autoridad F0 (biblioteca confirmada) y con el deshacer, como CAT-04;
  *  - bytes en FloorPlanImages con clave «k11:<sha256>» (direccionados por contenido: sin duplicados);
  *  - cada recurso lleva {storage:{kind,ref}}: el recolector de imágenes (local-images.collect) y persistence-store
  *    (imageRefs) ya tratan como vivas las referencias storage.ref de la autoridad, sin cambiar sus reglas;
  *  - escritura: bytes primero, metadatos después en UN commit del editor; si el commit falla se retiran SOLO los bytes
  *    nuevos de esa operación. El expediente v1 no incluye estos bytes (petición a Codex).
  *  El adaptador de laboratorio recibe un almacén de bytes y un «proyecto» con commit inyectados: no escribe en RUBIK. */
 const extDe=p=>{const e=p?.extensions?.[EXT];if(e===undefined)return {version:EXT_VERSION,results:{},favoritos:{}};
  if(!e||typeof e!=='object'||e.version!==EXT_VERSION||typeof e.results!=='object'||!e.results)return null;return {version:e.version,results:{...e.results},favoritos:{...(e.favoritos||{})}};};
 const err=(e)=>e?.name==='QuotaExceededError'||e?.code===22||e?.code==='quota'?'cuota':e?.name==='SecurityError'||e?.code==='permiso'?'permiso-almacen':'fallo-escritura';
 function adaptadorLaboratorio({bytes,proyecto}){
  // bytes: {get(ref)→Uint8Array|null, put(ref,Uint8Array), remove(ref)} · proyecto: {leer()→project, commit(next)→void|throws}
  async function conservar(r,datos,{signal}={}){
   const p=proyecto.leer();if(!p)return {ok:false,motivo:'sin-proyecto'};
   if(r.sujeto.projectId!==p.id)return {ok:false,motivo:'otro-proyecto'};
   const ext=extDe(p);if(!ext)return {ok:false,motivo:'documento-corrupto'};
   const dup=Object.values(ext.results).find(x=>x.claveContenido===r.claveContenido);if(dup)return {ok:true,duplicado:true,id:dup.id};
   const nuevos=[];
   try{
    for(const [k,x] of Object.entries(r.recursos)){if(!x)continue;
     if(signal?.aborted)throw Object.assign(new Error('cancelada'),{code:'cancelada'});
     const b=datos[k];if(!b||b.length!==x.bytes)throw Object.assign(new Error('bytes no corresponden a la ficha: '+k),{code:'recurso-invalido'});
     if(await bytes.get(x.storage.ref))continue;// ya existe (direccionado por contenido)
     await bytes.put(x.storage.ref,b);nuevos.push(x.storage.ref);}
    if(signal?.aborted)throw Object.assign(new Error('cancelada'),{code:'cancelada'});
    const next=JSON.parse(JSON.stringify(p));next.extensions=next.extensions&&typeof next.extensions==='object'?next.extensions:{};
    next.extensions[EXT]={version:EXT_VERSION,results:{...ext.results,[r.id]:r},favoritos:ext.favoritos};
    await proyecto.commit(next);
    return {ok:true,id:r.id,escritos:nuevos.length};
   }catch(e){
    for(const ref of nuevos){try{await bytes.remove(ref);}catch{}}// fallo parcial: no quedan bytes huérfanos de esta operación
    return {ok:false,motivo:e?.code==='cancelada'?'cancelada':e?.code==='recurso-invalido'?'recurso-invalido':err(e),retirados:nuevos.length};}
  }
  async function favorito(id,on=true,{ahora=null}={}){const p=proyecto.leer();const ext=extDe(p);if(!ext)return {ok:false,motivo:'documento-corrupto'};if(!ext.results[id])return {ok:false,motivo:'no-existe'};
   const fav={...ext.favoritos};if(on)fav[id]={at:ahora,nota:'favorito del profesional; no es una aceptación del cliente'};else delete fav[id];
   const next=JSON.parse(JSON.stringify(p));next.extensions[EXT]={...ext,favoritos:fav};try{await proyecto.commit(next);}catch(e){return {ok:false,motivo:err(e)};}return {ok:true};}
  /** Recupera fichas con su verificación. Una ficha de otro proyecto (extensión copiada) se marca, no se adopta. */
  async function recuperar({digest,actual=null}={}){const p=proyecto.leer();const get=ref=>bytes.get(ref);const ext=extDe(p);if(!ext)return {ok:false,motivo:'documento-corrupto',fichas:[]};
   const fichas=[];for(const r of Object.values(ext.results)){const v=await verificar(r,{digest,leerBytes:get,actual});
    // Un id local distinto con el MISMO trabajo (restauración) no es «otro proyecto»: lo decide verificar() por contentId.
    fichas.push({ficha:r,verificacion:v,favorito:!!ext.favoritos[r.id],idLocalDistinto:!!p&&r.sujeto?.projectId!==p.id});}
   return {ok:true,fichas:fichas.sort((a,b)=>String(a.ficha.creadoEn).localeCompare(String(b.ficha.creadoEn)))};}
  return {conservar,favorito,recuperar};
 }
 /** Comparación de dos fichas (variantes): misma toma o no, qué cambia y qué no. No decide nada. */
 function comparar(a,b){return {mismaToma:a.toma.takeId===b.toma.takeId,mismaVista:a.toma.viewId===b.toma.viewId,mismoTrabajo:a.sujeto.contentId===b.sujeto.contentId,
  mismoOriginal:a.recursos.original.sha256===b.recursos.original.sha256,mismoResultado:a.recursos.resultado.sha256===b.recursos.resultado.sha256,
  cambia:['style','floor','walls'].filter(k=>a.estilo[k]!==b.estilo[k]),clases:[a.clase,b.clase]};}

 // ---------------------------------------------------------------- generación cancelable (proveedor inyectado; sin red aquí)
 function generador(){let gen=0,ctrl=null;
  return {iniciar(){gen++;ctrl?.abort?.();ctrl=new AbortController();return {gen,signal:ctrl.signal};},cancelar(){gen++;ctrl?.abort?.();},vigente:t=>t&&t.gen===gen&&!t.signal.aborted};}
 /**
  * Vista → (envío) → resultado → ficha. deps: {digest, nuevoId, ahora(), contexto()→{projectId,entryId,levelId,contentId,revision,takeId},
  * convertir(dataUrl)→dataUrl (la transformación exacta del envío), proveedor({style,floor,walls,image},signal)→{image,model,usage,cost,generatedAt}|{error},
  * transformacion:string, clase:'render-ia'|'simulado-laboratorio', cache:Map}
  * Resultados tardíos de otra generación, cancelados o de otro proyecto/toma se descartan.
  */
 async function generar({vista,estilo},deps,token,gen){
  const vivo=()=>!gen||gen.vigente(token);
  const c0=deps.contexto();if(!c0||!c0.takeId)return {ok:false,motivo:'sin-toma'};
  if(vista.takeId!==c0.takeId)return {ok:false,motivo:'toma-cambiada'};
  const k=claveCache({entryId:c0.entryId,projectId:c0.projectId,revision:c0.revision,takeId:c0.takeId,viewId:vista.id,...estilo});
  if(k&&deps.cache?.has(k))return {ok:true,ficha:deps.cache.get(k),cache:true};
  let enviada;try{enviada=await deps.convertir(vista.dataUrl);}catch{return {ok:false,motivo:'conversion-fallida'};}
  if(!vivo())return {ok:false,motivo:'obsoleta'};
  let out;try{out=await deps.proveedor({style:estilo.style,floor:estilo.floor||'',walls:estilo.walls||'',image:enviada},token?.signal);}
  catch(e){return {ok:false,motivo:e?.name==='AbortError'||token?.signal?.aborted?'cancelada':'proveedor-inalcanzable'};}
  if(!vivo())return {ok:false,motivo:token?.signal?.aborted?'cancelada':'obsoleta'};
  if(out?.error)return {ok:false,motivo:out.error==='quota'||out.error==='insufficient_quota'?'cuota-proveedor':'proveedor-error'};
  const c1=deps.contexto();
  if(!c1||c1.projectId!==c0.projectId||c1.contentId!==c0.contentId)return {ok:false,motivo:'proyecto-cambiado'};
  if(c1.takeId!==c0.takeId)return {ok:false,motivo:'toma-cambiada'};
  let ficha;
  try{ficha=await crearResultado({clase:deps.clase,sujeto:c0,toma:{takeId:vista.takeId,takenAt:vista.takenAt,viewId:vista.id,viewLabel:vista.label,source:vista.source??null},
   original:{dataUrl:vista.dataUrl},enviada:{dataUrl:enviada,transformacion:deps.transformacion},resultado:{dataUrl:out.image},estilo,
   procedencia:{proveedor:deps.clase==='simulado-laboratorio'?'simulador-laboratorio':(out.provider||deps.proveedorNombre),modelo:out.model,generatedAt:out.generatedAt,consumo:out.usage,coste:out.cost},
   ahora:deps.ahora?.()},{digest:deps.digest,nuevoId:deps.nuevoId});}
  catch(e){return {ok:false,motivo:e.code||'recurso-invalido',detalle:e.message};}
  if(!vivo())return {ok:false,motivo:'obsoleta'};
  if(k)deps.cache?.set(k,ficha);
  return {ok:true,ficha,datos:{original:dataUrlABytes(vista.dataUrl).bytes,enviada:dataUrlABytes(enviada).bytes,resultado:dataUrlABytes(out.image).bytes}};
 }

 // ---------------------------------------------------------------- textos (ES/EN/ZH; causa · siguiente · alternativa · datos)
 const T={
  'cuota':{es:['No queda espacio de almacenamiento para conservar este resultado.','Libera espacio (borra resultados que no necesites) y vuelve a conservarlo.','Descarga la imagen con su rótulo para guardarla fuera de RUBIK.','No se ha guardado nada a medias.'],en:['There is no storage space left to keep this result.','Free up space (delete results you do not need) and keep it again.','Download the labelled image to keep it outside RUBIK.','Nothing was half-saved.'],zh:['存储空间不足，无法保存此结果。','释放空间（删除不需要的结果）后重新保存。','下载带标注的图片以在 RUBIK 之外保存。','没有保存不完整的内容。']},
  'permiso-almacen':{es:['El navegador no permite guardar datos de este sitio.','Revisa la configuración de privacidad del navegador.','Descarga la imagen con su rótulo.','No se ha guardado nada.'],en:['The browser does not allow this site to store data.','Check the browser privacy settings.','Download the labelled image.','Nothing was saved.'],zh:['浏览器不允许此网站保存数据。','请检查浏览器隐私设置。','下载带标注的图片。','未保存任何内容。']},
  'fallo-escritura':{es:['No se pudo completar la conservación.','Vuelve a intentarlo.','Descarga la imagen con su rótulo.','Se han retirado los datos parciales de esta operación.'],en:['Keeping the result could not be completed.','Try again.','Download the labelled image.','The partial data of this operation was removed.'],zh:['无法完成保存。','请重试。','下载带标注的图片。','已移除本次操作的部分数据。']},
  'cancelada':{es:['Operación cancelada.','Vuelve a generarlo o conservarlo cuando quieras.','—','No se ha guardado nada.'],en:['Operation cancelled.','Generate or keep it again whenever you want.','—','Nothing was saved.'],zh:['操作已取消。','可随时重新生成或保存。','—','未保存任何内容。']},
  'obsoleta':{es:['Ha llegado un resultado de una operación anterior y se ha descartado.','Usa la operación en curso.','—','No se ha aplicado ningún resultado antiguo.'],en:['A result from an earlier operation arrived and was discarded.','Use the current operation.','—','No stale result was applied.'],zh:['收到之前操作的结果，已丢弃。','请使用当前操作。','—','未应用任何过期结果。']},
  'proyecto-cambiado':{es:['El proyecto cambió mientras se generaba la imagen.','Vuelve a generarla sobre el proyecto actual.','—','El resultado no se ha asignado a ningún proyecto.'],en:['The project changed while the image was being generated.','Generate it again on the current project.','—','The result was not assigned to any project.'],zh:['生成图片期间项目已更改。','请基于当前项目重新生成。','—','结果未分配给任何项目。']},
  'toma-cambiada':{es:['Las vistas se volvieron a capturar durante la operación.','Genera de nuevo desde la toma actual.','—','No se ha mezclado la toma anterior con la nueva.'],en:['The views were captured again during the operation.','Generate again from the current take.','—','The previous and new takes were not mixed.'],zh:['操作期间视图已重新拍摄。','请基于当前拍摄重新生成。','—','未混用前后两次拍摄。']},
  'sin-toma':{es:['La vista no tiene una toma identificada.','Prepara las vistas en «Imágenes».','—','No se ha generado nada.'],en:['The view has no identified take.','Prepare the views in «Images».','—','Nothing was generated.'],zh:['该视图没有可识别的拍摄。','请在“图片”中准备视图。','—','未生成任何内容。']},
  'duplicado':{es:['Este resultado ya está conservado.','Ábrelo desde la lista de resultados.','—','No se ha duplicado nada.'],en:['This result is already kept.','Open it from the results list.','—','Nothing was duplicated.'],zh:['此结果已保存。','请从结果列表中打开。','—','没有重复保存。']},
  'otro-proyecto':{es:['El resultado pertenece a otro proyecto.','Ábrelo desde su proyecto.','—','No se ha reasignado.'],en:['The result belongs to another project.','Open it from its project.','—','It was not reassigned.'],zh:['该结果属于另一个项目。','请从其所属项目中打开。','—','未被重新分配。']},
  'destino-desconocido':{es:['Ese destino de uso no existe.','Elige estudio, comparación o presentación orientativa.','—','No se ha exportado nada.'],en:['That destination does not exist.','Choose studio, comparison or orientative presentation.','—','Nothing was exported.'],zh:['该用途目标不存在。','请选择工作室、比较或参考展示。','—','未导出任何内容。']},
  'permiso-insuficiente':{es:['Los derechos de este resultado no permiten ese uso.','Usa un destino permitido (se indican en la ficha).','—','No se ha exportado nada.'],en:['The rights of this result do not allow that use.','Use an allowed destination (listed on the sheet).','—','Nothing was exported.'],zh:['此结果的权利不允许该用途。','请使用允许的目标（见卡片）。','—','未导出任何内容。']},
  'cuota-proveedor':{es:['El proveedor de imágenes no tiene cuota disponible.','Inténtalo más tarde o pide al propietario que revise el límite.','Usa la vista real del proyecto.','No se ha cobrado ni guardado nada en RUBIK.'],en:['The image provider has no quota available.','Try later or ask the owner to review the limit.','Use the real project view.','Nothing was charged or saved in RUBIK.'],zh:['图片提供方无可用额度。','请稍后重试或请所有者检查限额。','使用项目真实视图。','RUBIK 中未扣费也未保存。']},
  'documento-corrupto':{es:['El registro de resultados del proyecto no se puede leer.','Exporta el expediente y avisa a soporte.','—','No se ha reparado ni reescrito nada.'],en:['The project results record cannot be read.','Export the project file and contact support.','—','Nothing was repaired or rewritten.'],zh:['无法读取项目结果记录。','请导出项目档案并联系支持。','—','未修复或改写任何内容。']}
 };
 const ESTADOS={integro:['íntegro','intact','完整'],incompleto:['incompleto (faltan bytes)','incomplete (bytes missing)','不完整（缺少字节）'],invalido:['inválido (alterado)','invalid (altered)','无效（已篡改）'],'no-comprobable':['no comprobable','not verifiable','无法核验'],
  vigente:['vigente','current','有效'],'vigente-restaurado':['vigente · restaurado','current · restored','有效 · 已恢复'],'toma-anterior':['de una toma anterior','from an earlier take','来自之前的拍摄'],desactualizado:['desactualizado','out of date','已过期'],'otro-proyecto':['de otro proyecto','from another project','来自其他项目'],'sin-comprobar':['sin comprobar','not checked','未检查']};
 function texto(code,lang){const e=T[code];if(!e)throw new Error('Texto K11 desconocido: '+code);if(!e[lang])throw new Error(`Texto K11 «${code}» sin «${lang}» (sin respaldo silencioso).`);const [causa,siguiente,alternativa,datos]=e[lang];return {code,causa,siguiente,alternativa,datos};}
 function estado(code,lang){const e=ESTADOS[code];const i=LANGS.indexOf(lang);if(!e||i<0)throw new Error('Estado K11 sin texto: '+code+'/'+lang);return e[i];}

 return Object.freeze({SCHEMA,EXT,EXT_VERSION,REF,LANGS,CLASES,DESTINOS,DESTINOS_POR_CLASE,T,ESTADOS,canon,dataUrlABytes,bytesADataUrl,claveCache,crearResultado,verificar,permitir,
  adaptadorLaboratorio,comparar,generador,generar,texto,estado});
});
