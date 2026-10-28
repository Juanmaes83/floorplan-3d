/* Pure boundary between a normalized GeoProvider coordinates result and durable site.location. */
(function(root){
 'use strict';
 const Geo=typeof module==='object'&&module.exports?require('./geo-provider.js'):root.FloorPlanGeoProvider;
 const fail=message=>{throw new TypeError(`FloorPlanGeoSiteAdapter: ${message}`);};
 const coordinates=value=>{
  try{Geo.validateLocation(value);}catch{fail('invalid coordinates');}
  return {latitude:value.latitude,longitude:value.longitude,timeZone:value.timeZone};
 };
 function toSiteLocation(result){
  if(!result||result.status!=='available'||typeof result.providerId!=='string')fail('available result with providerId required');
  const location=coordinates(result.location),source=Geo.normalizeSource(result.provenance,result.providerId);
  return {...location,source};
 }
 function fromSiteLocation(siteLocation){
  if(!siteLocation||typeof siteLocation!=='object'||Array.isArray(siteLocation))fail('site.location required');
  const location=coordinates(siteLocation),provenance=Geo.normalizeSource(siteLocation.source);
  return {status:'available',providerId:provenance.providerId,location,provenance};
 }
 const api={toSiteLocation,fromSiteLocation};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanGeoSiteAdapter=api;
})(globalThis);
