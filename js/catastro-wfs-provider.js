/* FT3D-8 · M1 · S3 — Catastro lookup by cadastral reference through the OFFICIAL INSPIRE WFS of the Dirección General
   del Catastro (CP theme, stored query GetParcel). GeoProvider 1.3.0 contract, input mode «reference».
   - Service and query form from the official description (catastro.hacienda.gob.es/webinspire, inspire-cp-WFS.pdf):
     https://ovc.catastro.meh.es/INSPIRE/wfsCP.aspx?service=wfs&version=2&request=getfeature&STOREDQUERIE_ID=GetParcel
     &refcat=<14>&srsname=EPSG::<code>. Answer: CP:CadastralParcel in GML 3.2, parsed by the EXISTING
     FloorPlanCatastroParcel.parseDocument (no second parser, no second geometry engine).
   - Browser call: the service answers with Access-Control-Allow-Origin: *; no proxy, no credentials, no cookies sent.
   - Every failure is a normal result (cancelled, timeout, network, service rejection, exception, empty answer,
     unsupported CRS): nothing is thrown at the caller and nothing previously saved is touched here.
   - Licence: «Licencia de acceso y uso INSPIRE de la DGC» → status restricted: shown, not exported as geometry.
   VERIFICATION (2026-11-06): from Chromium (the product path) the official service answered HTTP 200 with a valid
   CP:CadastralParcel for the public example reference of its own documentation (3662001TF3136S, EPSG:25830), and an
   ExceptionReport «No se ha encontrado la parcela … para el huso …» for a non-existent one. Command-line clients (curl)
   received HTTP 400 HTML from the same host; that path is not used by RUBIK. */
(function(root){
 'use strict';
 const node=typeof module==='object'&&module.exports;
 const Geo=node?require('./geo-provider.js'):root.FloorPlanGeoProvider;
 const Parcel=node?require('./parcel-core.js'):root.FloorPlanParcelCore;
 const Catastro=node?require('./catastro-parcel-provider.js'):root.FloorPlanCatastroParcel;
 if(!Geo||!Parcel||!Catastro)throw new Error('FloorPlanCatastroWfs requires GeoProvider, ParcelCore and CatastroParcel');
 const ID='catastro-inspire-wfs';
 const ENDPOINT='https://ovc.catastro.meh.es/INSPIRE/wfsCP.aspx';
 const SERVICE_PAGE='https://www.catastro.hacienda.gob.es/webinspire/index.html';
 const LICENSE_URL='https://www.catastro.hacienda.gob.es/webinspire/documentos/Licencia.pdf';
 const SOURCE_NAME='Dirección General del Catastro · WFS INSPIRE de parcela catastral (CP)';
 const CAPS=Object.freeze({search:false,parcel:true,geometry:false,coordinates:false,sourceMetadata:true,orthophoto:false,elevation:false,terrain:false});
 // CRS the parcel core accepts; the professional chooses the UTM zone of the parcel (no reprojection is done here).
 const ZONES=Object.freeze([{crs:'EPSG:25830',label:'Península, huso 30 (ETRS89)'},{crs:'EPSG:25829',label:'Huso 29 (ETRS89): Galicia y oeste'},
  {crs:'EPSG:25831',label:'Huso 31 (ETRS89): Cataluña, Baleares y este'},{crs:'EPSG:32628',label:'Canarias, huso 28 (WGS84)'}]);
 const LICENSE=Object.freeze({status:'restricted',name:'Licencia de acceso y uso INSPIRE de la DGC',url:LICENSE_URL,
  note:'Uso propio permitido; no difundir información original sin transformación.'});
 const result=(status,reason)=>({status,reason});
 function queryUrl(reference,crs='EPSG:25830',endpoint=ENDPOINT){
  const ref=Parcel.normalizeReference(reference),zone=Parcel.normalizeCrs(crs);
  const u=new URL(endpoint);
  for(const [k,v] of [['service','wfs'],['version','2'],['request','getfeature'],['STOREDQUERIE_ID','GetParcel'],['refcat',ref],['srsname','EPSG::'+zone.slice(5)]])u.searchParams.set(k,v);
  return u.toString();
 }
 function create({fetch:fetchImpl=root.fetch?.bind(root),endpoint=ENDPOINT,timeoutMs=20000,crs='EPSG:25830',now=()=>new Date()}={}){
  if(typeof fetchImpl!=='function')throw new TypeError('FloorPlanCatastroWfs: fetch is required');
  Parcel.normalizeCrs(crs);
  let zone=crs,diagnostic=null;
  const diag=(kind,extra={})=>{diagnostic=Object.freeze({kind,at:now().toISOString(),...extra});};
  const provider={
   id:ID,contractVersion:Geo.CONTRACT_VERSION,capabilities:CAPS,
   getCapabilities(){return CAPS;},
   getProviderMetadata(){return {providerId:ID,label:'Catastro · consulta por referencia catastral',kind:'official',network:'required',parcelInputModes:['reference'],
    sourceName:SOURCE_NAME,sourceUrl:SERVICE_PAGE,version:'WFS 2.0 · INSPIRE CP',region:'España',coverage:'Territorio de la DGC (no incluye País Vasco ni Navarra)',
    attribution:'Dirección General del Catastro',license:{...LICENSE}};},
   getSourceMetadata(){return {providerId:ID,type:'official-source',sourceName:SOURCE_NAME,sourceUrl:SERVICE_PAGE};},
   async getParcel(input,context={}){
    if(input?.mode!=='reference')return result('unsupported','invalid-parcel-input');
    let reference,url;
    try{reference=Parcel.normalizeReference(input.reference);url=queryUrl(reference,zone,endpoint);}catch{diag('invalid-reference');return result('invalid','invalid-parcel-reference');}
    const outer=context?.signal,ctrl=new AbortController();let timedOut=false;
    const onAbort=()=>ctrl.abort();if(outer){if(outer.aborted){diag('cancelled');return result('cancelled','cancelled');}outer.addEventListener('abort',onAbort,{once:true});}
    const timer=setTimeout(()=>{timedOut=true;ctrl.abort();},timeoutMs);
    let response,text;
    try{
     response=await fetchImpl(url,{method:'GET',signal:ctrl.signal,credentials:'omit',redirect:'error',referrerPolicy:'no-referrer',mode:'cors',cache:'no-store',
      headers:{Accept:'application/gml+xml, application/xml, text/xml'}});
     const type=(response.headers?.get?.('content-type')||'').toLowerCase(),length=Number(response.headers?.get?.('content-length')||0);
     if(!response.ok||/text\/html/.test(type)){diag('service-rejected',{httpStatus:response.status,contentType:type||null});return result('unavailable','network-unavailable');}
     if(length>Parcel.LIMITS.documentBytes){diag('too-large',{httpStatus:response.status});return result('invalid','invalid-source-document');}
     text=await response.text();
    }catch(error){
     if(outer?.aborted){diag('cancelled');return result('cancelled','cancelled');}
     diag(timedOut?'timeout':'network',{message:String(error?.name||'error')});return result('unavailable','network-unavailable');
    }finally{clearTimeout(timer);outer?.removeEventListener?.('abort',onAbort);}
    if(outer?.aborted){diag('cancelled');return result('cancelled','cancelled');}
    if(new TextEncoder().encode(text).length>Parcel.LIMITS.documentBytes){diag('too-large');return result('invalid','invalid-source-document');}
    if(/<(?:\w+:)?ExceptionReport\b/.test(text)){
     const msg=(/<(?:\w+:)?ExceptionText>([\s\S]*?)<\//.exec(text)?.[1]||'').replace(/^<!\[CDATA\[|\]\]>$/g,'').trim().slice(0,200);
     // Observed live (2026-11-06): «No se ha encontrado la parcela <RC> para el huso <EPSG>» → not found IN THAT ZONE.
     if(/no se ha encontrado la parcela/i.test(msg)){diag('not-found-in-zone',{zone,message:msg});return result('not-found','parcel-not-found');}
     diag('service-exception',{message:msg});
     return /refcat|referencia/i.test(msg)?result('invalid','invalid-parcel-reference'):result('unavailable','network-unavailable');
    }
    if(/numberReturned="0"/.test(text)||!/CadastralParcel\b/.test(text)){diag('empty',{httpStatus:response.status});return result('not-found','parcel-not-found');}
    try{
     const parcel=Catastro.parseDocument(text,reference);
     diag('ok',{httpStatus:response.status});
     return {status:'available',providerId:ID,parcel,provenance:{providerId:ID,type:'official-source',sourceName:SOURCE_NAME,sourceUrl:url.length<=500?url:SERVICE_PAGE,
      sourceId:reference,retrievedAt:now().toISOString(),attribution:'Dirección General del Catastro',license:{...LICENSE}}};
    }catch(error){
     const reason=error?.reason;diag('invalid-document',{reason:reason||'provider-error'});
     if(reason==='unsupported-source-crs')return result('unsupported',reason);
     if(reason==='parcel-not-found')return result('not-found',reason);
     if(['multiple-parcels-require-selection','invalid-parcel-reference','invalid-source-document','invalid-parcel-input'].includes(reason))return result('invalid',reason);
     if(['inconsistent-source-crs','invalid-source-geometry'].includes(reason))return result('unavailable',reason);
     return result('unavailable','invalid-source-geometry');
    }
   },
   // Read-only: why the last lookup ended as it did (for plain-language messages); never contains personal data.
   lastDiagnostic(){return diagnostic;},
   setZone(next){Parcel.normalizeCrs(next);zone=next;},
   get zone(){return zone;}
  };
  Geo.inspectProvider(provider);
  return provider;
 }
 const api=Object.freeze({ID,ENDPOINT,SERVICE_PAGE,LICENSE_URL,ZONES,queryUrl,create});
 if(node)module.exports=api;else root.FloorPlanCatastroWfs=api;
})(globalThis);
