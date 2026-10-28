/* Durable orthophoto metadata; raster bytes remain runtime-only. */
(function(root){
 'use strict';
 const Core=typeof module==='object'&&module.exports?require('./orthophoto-core.js'):root.FloorPlanOrthophotoCore;
 const Geo=typeof module==='object'&&module.exports?require('./geo-provider.js'):root.FloorPlanGeoProvider;
 const fail=()=>{throw new TypeError('FloorPlanOrthophotoSiteAdapter: available orthophoto required');};
 function toSiteOrthophoto(result,parcel){
  if(result?.status!=='available'||typeof result.providerId!=='string')fail();
  const value=result.orthophoto,source=Geo.normalizeParcelSource(result.provenance,result.providerId);
  if(!source.retrievedAt||!source.attribution||!source.license)fail();
  return {...Core.normalizeMetadata({...value,requestedResolutionM:value.requestedResolutionM},parcel),source};
 }
 function fromSiteOrthophoto(value,parcel){
  const metadata=Core.normalizeMetadata(value,parcel),source=Geo.normalizeParcelSource(value.source);
  if(!source.retrievedAt||!source.attribution||!source.license)fail();
  return {...metadata,source};
 }
 const api={toSiteOrthophoto,fromSiteOrthophoto};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanOrthophotoSiteAdapter=api;
})(globalThis);
