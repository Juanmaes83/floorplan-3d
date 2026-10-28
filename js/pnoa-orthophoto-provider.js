/* IGN/CNIG PNOA MA WMS 1.3.0. Browser fetch only; no proxy or persisted raster. */
(function(root){
 'use strict';
 const Geo=typeof module==='object'&&module.exports?require('./geo-provider.js'):root.FloorPlanGeoProvider;
 const Ortho=typeof module==='object'&&module.exports?require('./orthophoto-core.js'):root.FloorPlanOrthophotoCore;
 const ID='ign-pnoa-ma-wms',ENDPOINT='https://www.ign.es/wms-inspire/pnoa-ma',LAYER='OI.OrthoimageCoverage';
 const CAPS=Object.freeze({search:false,parcel:false,geometry:false,coordinates:false,sourceMetadata:true,orthophoto:true,elevation:false,terrain:false});
 const LICENSE={status:'verified',name:'Licencia de uso de productos y servicios geográficos IGN/CNIG, compatible con CC-BY 4.0',url:'https://www.scne.es/productos.php',note:'Reconocer la fuente; el mosaico y sus productores pueden variar por zona y fecha.'};
 const ATTRIBUTION='Sistema Cartográfico Nacional';
 const fail=reason=>{const error=new Error(reason);error.reason=reason;throw error;};
 function buildGetMapUrl(input){
  const q=Ortho.normalizeRequest(input),url=new URL(ENDPOINT);
  for(const [key,value] of Object.entries({SERVICE:'WMS',VERSION:'1.3.0',REQUEST:'GetMap',LAYERS:LAYER,STYLES:'',CRS:q.sourceCrs,BBOX:[q.extent.minX,q.extent.minY,q.extent.maxX,q.extent.maxY].join(','),WIDTH:String(q.widthPx),HEIGHT:String(q.heightPx),FORMAT:'image/jpeg',TRANSPARENT:'FALSE'}))url.searchParams.set(key,value);
  return url.toString();
 }
 async function boundedBlob(response,signal){
  const length=Number(response.headers.get('content-length'));
  if(Number.isFinite(length)&&length>Ortho.LIMITS.maxResponseBytes)fail('response-too-large');
  if(!response.body){const blob=await response.blob();if(blob.size>Ortho.LIMITS.maxResponseBytes)fail('response-too-large');return blob;}
  const reader=response.body.getReader(),chunks=[];let size=0;
  try{for(;;){if(signal?.aborted)fail('cancelled');const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>Ortho.LIMITS.maxResponseBytes)fail('response-too-large');chunks.push(value);}}
  catch(error){await reader.cancel().catch(()=>{});throw error;}
  return new Blob(chunks,{type:'image/jpeg'});
 }
 const provider=Object.freeze({
  id:ID,contractVersion:Geo.CONTRACT_VERSION,capabilities:CAPS,
  getCapabilities(){return CAPS;},
  getProviderMetadata(){return {providerId:ID,label:'PNOA Máxima Actualidad · servicio de visualización',kind:'official',network:'required',sourceName:'IGN/CNIG · PNOA Máxima Actualidad — servicio de visualización',sourceUrl:ENDPOINT,version:'WMS 1.3.0',region:'España',coverage:'Mosaico nacional dinámico; Sentinel-2 a escalas pequeñas y Ortoimágenes Verdaderas en ciertas zonas urbanas',attribution:ATTRIBUTION,license:{...LICENSE}};},
  getSourceMetadata(){return {providerId:ID,type:'official-source',sourceName:'IGN/CNIG · PNOA Máxima Actualidad — servicio de visualización',sourceUrl:ENDPOINT};},
  async getOrthophoto(input,context={}){
   if(context.signal?.aborted)return {status:'cancelled',reason:'cancelled'};
   try{
    const q=Ortho.normalizeRequest(input),timeout=AbortSignal.timeout(20_000),signal=context.signal?AbortSignal.any([context.signal,timeout]):timeout;
    const response=await fetch(buildGetMapUrl(q),{method:'GET',mode:'cors',credentials:'omit',redirect:'error',signal});
    if(!response.ok)fail('service-error');
    if(response.redirected)fail('service-error');
    if(response.headers.get('content-type')?.split(';')[0].trim().toLowerCase()!=='image/jpeg')fail('invalid-raster-response');
    const blob=await boundedBlob(response,signal);
    if(!blob.size)fail('invalid-raster-response');
    const signature=new Uint8Array(await blob.slice(0,3).arrayBuffer());
    if(signature[0]!==0xff||signature[1]!==0xd8||signature[2]!==0xff)fail('invalid-raster-response');
    let bitmap;try{bitmap=await createImageBitmap(blob);}catch{fail('invalid-raster-response');}
    const dimensionsCorrect=bitmap.width===q.widthPx&&bitmap.height===q.heightPx;bitmap.close?.();
    if(!dimensionsCorrect)fail('invalid-raster-response');
    if(signal.aborted)return {status:'cancelled',reason:'cancelled'};
    return {status:'available',providerId:ID,orthophoto:{sourceCrs:q.sourceCrs,extent:q.extent,widthPx:q.widthPx,heightPx:q.heightPx,requestedResolutionM:q.targetResolutionM,resolutionXMPerPx:q.resolutionXMPerPx,resolutionYMPerPx:q.resolutionYMPerPx,mediaType:'image/jpeg',sourcePolicy:'latest-available',imageBlob:blob},provenance:{...this.getSourceMetadata(),sourceId:LAYER,version:'WMS 1.3.0',retrievedAt:new Date().toISOString(),attribution:ATTRIBUTION,license:{...LICENSE}}};
   }catch(error){
    if(context.signal?.aborted||error?.reason==='cancelled')return {status:'cancelled',reason:'cancelled'};
    if(error?.reason==='orthophoto-source-crs-unsupported'||error?.reason==='orthophoto-extent-too-large')return {status:'unsupported',reason:error.reason};
    if(error?.reason==='orthophoto-extent-invalid')return {status:'invalid',reason:error.reason};
    if(error?.reason==='response-too-large'||error?.reason==='invalid-raster-response'||error?.reason==='service-error')return {status:'unavailable',reason:error.reason};
    return {status:'unavailable',reason:'network-unavailable'};
   }
  }
 });
 const api={provider,buildGetMapUrl,ENDPOINT,LAYER};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanPnoaOrthophoto=api;
})(globalThis);
