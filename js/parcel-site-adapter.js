/* Pure durable boundary for one territorial parcel in site.parcel. */
(function(root){
 'use strict';
 const Geo=typeof module==='object'&&module.exports?require('./geo-provider.js'):root.FloorPlanGeoProvider;
 const Parcel=typeof module==='object'&&module.exports?require('./parcel-core.js'):root.FloorPlanParcelCore;
 const fail=message=>{throw new TypeError(`FloorPlanParcelSiteAdapter: ${message}`);};
 function toSiteParcel(result){
  if(!result||result.status!=='available'||typeof result.providerId!=='string')fail('available parcel result required');
  const parcel=Parcel.normalizeParcel(result.parcel),source=Geo.normalizeParcelSource(result.provenance,result.providerId);
  return {...parcel,source};
 }
 function fromSiteParcel(value){
  if(!value||typeof value!=='object')fail('site.parcel required');
  const parcel=Parcel.normalizeParcel(value),source=Geo.normalizeParcelSource(value.source);
  return {status:'available',providerId:source.providerId,parcel,provenance:source};
 }
 const api={toSiteParcel,fromSiteParcel};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanParcelSiteAdapter=api;
})(globalThis);
