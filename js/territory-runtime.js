/* Session assets only: no fetch, provider, storage or durable state. */
(function(root){
 'use strict';
 const fingerprint=v=>JSON.stringify(v??null);
 function create({makeURL=blob=>URL.createObjectURL(blob),revokeURL=url=>URL.revokeObjectURL(url)}={}){
  let owner=null,site=null,revision=0;const assets=new Map(),listeners=new Set();
  const emit=()=>{revision++;for(const fn of listeners)fn();};
  function clear(kind){const keys=kind?[kind]:[...assets.keys()];let changed=false;for(const key of keys){const a=assets.get(key);if(!a)continue;if(a.url)revokeURL(a.url);a.dispose?.();assets.delete(key);changed=true;}if(changed)emit();}
  function sync(id,current){if(owner!==id){clear();owner=id;}const parcel=fingerprint(current?.parcel);for(const [kind,a] of assets)if(a.parcel!==parcel||a.snapshot!==fingerprint(current?.[kind]))clear(kind);site=current;}
  function set(kind,snapshot,value){if(!['orthophoto','terrain'].includes(kind)||!site?.parcel||fingerprint(snapshot)!==fingerprint(site[kind]))throw Error('Runtime asset does not match durable snapshot');clear(kind);const asset={...value,snapshot:fingerprint(snapshot),parcel:fingerprint(site.parcel)};if(kind==='orthophoto'){if(!(value.blob instanceof Blob))throw Error('Orthophoto Blob required');asset.url=makeURL(value.blob);}assets.set(kind,asset);emit();return asset;}
  const api={sync,set,get:kind=>assets.get(kind)||null,clear,dispose(){clear();listeners.clear();site=null;owner=null;},subscribe(fn){listeners.add(fn);return ()=>listeners.delete(fn);},get revision(){return revision;}};return Object.freeze(api);
 }
 const api={create};if(typeof module==='object'&&module.exports)module.exports=api;else{root.FloorPlanTerritoryRuntime=api;root.FloorPlanTerritorySession=create();}
})(globalThis);
