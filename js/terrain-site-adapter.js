/* Durable metadata for the last retrieved terrain coverage; grid remains runtime-only. */
(function(root){
 'use strict';
 const Terrain=typeof module==='object'&&module.exports?require('./terrain-core.js'):root.FloorPlanTerrainCore;
 const Geo=typeof module==='object'&&module.exports?require('./geo-provider.js'):root.FloorPlanGeoProvider;
 const fail=()=>{throw new TypeError('FloorPlanTerrainSiteAdapter: available terrain required');};
 function toSiteTerrain(result,parcel){if(result?.status!=='available'||typeof result.providerId!=='string')fail();const value=result.terrain,source=Geo.normalizeParcelSource(result.provenance,result.providerId);if(!source.retrievedAt||!source.attribution||!source.license||!source.sourceId||!source.sourceName)fail();return {...Terrain.normalizeMetadata({...value,resolutionM:5,productName:source.sourceName,coverageId:source.sourceId},parcel),source};}
 function fromSiteTerrain(value,parcel){const metadata=Terrain.normalizeMetadata(value,parcel),source=Geo.normalizeParcelSource(value.source);if(!source.retrievedAt||!source.attribution||!source.license||source.sourceId!==metadata.coverageId)fail();return {...metadata,source};}
 const api={toSiteTerrain,fromSiteTerrain};if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanTerrainSiteAdapter=api;
})(globalThis);
