/* Dirección General del Catastro INSPIRE CP: user-supplied GML only. No WFS lookup. */
(function(root){
 'use strict';
 const Geo=typeof module==='object'&&module.exports?require('./geo-provider.js'):root.FloorPlanGeoProvider;
 const Parcel=typeof module==='object'&&module.exports?require('./parcel-core.js'):root.FloorPlanParcelCore;
 const CP=['http://inspire.ec.europa.eu/schemas/cp/4.0','http://inspire.ec.europa.eu/schemas/cp/3.0'];
 const GML='http://www.opengis.net/gml/3.2',BASE='http://inspire.ec.europa.eu/schemas/base/3.3';
 const LICENSE_URL='https://www.catastro.hacienda.gob.es/webinspire/documentos/Licencia.pdf';
 const SOURCE_URL='https://www.catastro.hacienda.gob.es/webinspire/';
 const id='catastro-inspire-cp';
 const caps=Object.freeze({search:false,parcel:true,geometry:false,coordinates:false,sourceMetadata:true,orthophoto:false,elevation:false,terrain:false});
 const err=reason=>{const e=new Error(reason);e.reason=reason;throw e;};
 const descendants=(node,ns,name)=>[...node.getElementsByTagNameNS(ns,name)];
 const first=(node,ns,name)=>descendants(node,ns,name)[0]||null;
 const direct=(node,ns,name)=>[...node.children].find(c=>c.namespaceURI===ns&&c.localName===name)||null;
 const read=(node,ns,name)=>first(node,ns,name)?.textContent?.trim()||'';
 function parseRing(node){
  const list=first(node,GML,'posList');
  if(!list||list.getAttribute('srsDimension')&&!['2'].includes(list.getAttribute('srsDimension')))err('invalid-source-geometry');
  const values=list.textContent.trim().split(/\s+/).map(Number);
  if(values.length<8||values.length%2||values.length>Parcel.LIMITS.points*2||values.some(v=>!Number.isFinite(v)))err('invalid-source-geometry');
  const points=[];for(let i=0;i<values.length;i+=2)points.push([values[i],values[i+1]]);
  if(points[0][0]!==points.at(-1)[0]||points[0][1]!==points.at(-1)[1])err('invalid-source-geometry');
  return points;
 }
 function parseGeometry(node){
  const geometry=direct(node,node.namespaceURI,'geometry');
  const multi=geometry&&first(geometry,GML,'MultiSurface');
  if(!multi)err('invalid-source-document');
  const crsValues=[...multi.querySelectorAll('[srsName]')].map(n=>n.getAttribute('srsName'));
  if(multi.hasAttribute('srsName'))crsValues.unshift(multi.getAttribute('srsName'));
  if(!crsValues.length)err('unsupported-source-crs');
  const crs=crsValues.map(Parcel.normalizeCrs);
  if(crs.some(x=>x!==crs[0]))err('inconsistent-source-crs');
  const members=descendants(multi,GML,'surfaceMember');
  if(!members.length||members.length>Parcel.LIMITS.polygons)err('invalid-source-geometry');
  const polygons=[];
  for(const member of members){
   const surface=first(member,GML,'Surface')||first(member,GML,'Polygon');
   if(!surface)err('invalid-source-geometry');
   const patches=surface.localName==='Surface'?descendants(surface,GML,'PolygonPatch'):[surface];
   if(!patches.length)err('invalid-source-geometry');
   for(const patch of patches){
    const exterior=direct(patch,GML,'exterior');if(!exterior)err('invalid-source-geometry');
    const exteriorRing=first(exterior,GML,'LinearRing');if(!exteriorRing)err('invalid-source-geometry');
    const rings=[parseRing(exteriorRing)];
    for(const interior of [...patch.children].filter(n=>n.namespaceURI===GML&&n.localName==='interior')){
     const hole=first(interior,GML,'LinearRing');if(!hole)err('invalid-source-geometry');
     rings.push(parseRing(hole));
    }
    polygons.push({rings});
   }
  }
  return {sourceCrs:crs[0],sourceGeometry:{type:'MultiPolygon',polygons}};
 }
 function parseDocument(text,selected){
  if(typeof text!=='string'||!text.trim()||new TextEncoder().encode(text).length>Parcel.LIMITS.documentBytes)err('invalid-parcel-input');
  if(/<!\s*(?:DOCTYPE|ENTITY)\b/i.test(text))err('invalid-source-document');
  if(typeof DOMParser!=='function')err('invalid-source-document');
  const xml=new DOMParser().parseFromString(text,'application/xml');
  if(xml.getElementsByTagName('parsererror').length||xml.doctype)err('invalid-source-document');
  const nodes=CP.flatMap(ns=>descendants(xml,ns,'CadastralParcel'));
  if(!nodes.length||nodes.length>Parcel.LIMITS.parcels)err('invalid-source-document');
  const candidates=nodes.map(node=>{
   const reference=Parcel.normalizeReference(read(node,node.namespaceURI,'nationalCadastralReference'));
   const identifier=first(node,node.namespaceURI,'inspireId');
   const localId=identifier?read(identifier,BASE,'localId'):'';
   const namespace=identifier?read(identifier,BASE,'namespace'):'';
   const inspireId=localId&&namespace?{localId,namespace}:undefined;
   return {node,reference,inspireId};
  });
  let candidatesForSelection=candidates;
  if(selected)candidatesForSelection=candidates.filter(c=>c.reference===selected);
  if(!candidatesForSelection.length)err('parcel-not-found');
  if(candidatesForSelection.length!==1)err('multiple-parcels-require-selection');
  const chosen=candidatesForSelection[0],geometry=parseGeometry(chosen.node);
  return Parcel.normalizeParcel({reference:chosen.reference,inspireId:chosen.inspireId,...geometry});
 }
 const provider=Object.freeze({
  id,contractVersion:Geo.CONTRACT_VERSION,capabilities:caps,
  getCapabilities(){return caps;},
  getProviderMetadata(){return {providerId:id,label:'Catastro · INSPIRE CP',kind:'official',network:'none',parcelInputModes:['document'],sourceName:'Dirección General del Catastro · INSPIRE Cadastral Parcels',sourceUrl:SOURCE_URL,region:'España, ámbito de la DGC; excluye País Vasco y Navarra',coverage:'Ámbito de responsabilidad de la DGC; cobertura no garantizada parcela a parcela',attribution:'Dirección General del Catastro',license:{status:'restricted',name:'Licencia de acceso y uso INSPIRE de la DGC',url:LICENSE_URL,note:'Uso propio permitido; difusión de información original sin transformación no autorizada.'}};},
  getSourceMetadata(){return {providerId:id,type:'official-source',sourceName:'Dirección General del Catastro · INSPIRE CP',sourceUrl:SOURCE_URL};},
  getParcel(input){
   if(input?.mode!=='document')return {status:'unsupported',reason:'invalid-parcel-input'};
   try{
    const parcel=parseDocument(input.text,input.reference);
    return {status:'available',providerId:id,parcel,provenance:{...this.getSourceMetadata(),sourceId:parcel.reference,attribution:'Dirección General del Catastro',license:{status:'restricted',name:'Licencia de acceso y uso INSPIRE de la DGC',url:LICENSE_URL,note:'Uso propio permitido; no difundir información original sin transformación.'}}};
   }catch(error){
    const reason=error?.reason;
    if(reason==='unsupported-source-crs')return {status:'unsupported',reason};
    if(reason==='parcel-not-found')return {status:'not-found',reason};
    if(reason==='multiple-parcels-require-selection'||reason==='invalid-parcel-reference'||reason==='invalid-source-document'||reason==='invalid-parcel-input')return {status:'invalid',reason};
    if(reason==='inconsistent-source-crs'||reason==='invalid-source-geometry')return {status:'unavailable',reason};
    return {status:'unavailable',reason:'provider-error'};
   }
  }
 });
 const api={provider,parseDocument};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanCatastroParcel=api;
})(globalThis);
