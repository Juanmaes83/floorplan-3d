/* Conservative snapshot policy, independent of provider identity and renderer. */
(function(root){
 'use strict';
 function layer(source,available){if(!available)return {canDisplay:false,canExport:false,requiredAttribution:[],reason:'not-loaded'};const status=source?.license?.status,credit=source?.attribution?.trim();return {canDisplay:true,canExport:status==='not-applicable'||status==='verified'&&!!credit,requiredAttribution:status==='verified'&&credit?[credit]:[],reason:status==='not-applicable'?'not-applicable':status==='verified'?(credit?'verified-with-attribution':'missing-attribution'):status==='restricted'?'restricted':'unknown'};}
 const attributions=items=>[...new Set(items.flatMap(i=>i?.requiredAttribution||[]))].sort((a,b)=>a<b?-1:a>b?1:0);
 const api={layer,attributions};if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanTerritoryExportPolicy=api;
})(globalThis);
