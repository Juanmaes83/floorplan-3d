/* 8C-C: pure parcel-aligned orthophoto request and durable metadata. */
(function(root){
 'use strict';
 const Parcel=typeof module==='object'&&module.exports?require('./parcel-core.js'):root.FloorPlanParcelCore;
 const LIMITS=Object.freeze({maxSidePx:2048,maxPixels:4_000_000,maxResponseBytes:8_000_000,targetResolutionM:0.25});
 const fail=reason=>{const error=new Error(reason);error.reason=reason;throw error;};
 const sameExtent=(a,b)=>['minX','minY','maxX','maxY'].every(key=>a?.[key]===b?.[key]);
 function extentFromParcel(parcel){
  const p=Parcel.normalizeParcel(parcel),points=p.sourceGeometry.polygons.flatMap(polygon=>polygon.rings.flat());
  const xs=points.map(point=>point[0]),ys=points.map(point=>point[1]);
  return {minX:Math.min(...xs),minY:Math.min(...ys),maxX:Math.max(...xs),maxY:Math.max(...ys)};
 }
 function normalizeRequest(input){
  if(!input||typeof input!=='object')fail('orthophoto-extent-invalid');
  let sourceCrs;try{sourceCrs=Parcel.normalizeCrs(input.sourceCrs);}catch{fail('orthophoto-source-crs-unsupported');}
  const e=input.extent;
  if(!e||typeof e!=='object'||!['minX','minY','maxX','maxY'].every(k=>Number.isFinite(e[k]))||e.minX>=e.maxX||e.minY>=e.maxY)fail('orthophoto-extent-invalid');
  const targetResolutionM=input.targetResolutionM??LIMITS.targetResolutionM;
  if(!Number.isFinite(targetResolutionM)||targetResolutionM<0.05||targetResolutionM>1)fail('orthophoto-extent-invalid');
  const widthPx=Math.ceil((e.maxX-e.minX)/targetResolutionM),heightPx=Math.ceil((e.maxY-e.minY)/targetResolutionM);
  if(widthPx<1||heightPx<1||widthPx>LIMITS.maxSidePx||heightPx>LIMITS.maxSidePx||widthPx*heightPx>LIMITS.maxPixels)fail('orthophoto-extent-too-large');
  return {sourceCrs,extent:{minX:e.minX,minY:e.minY,maxX:e.maxX,maxY:e.maxY},targetResolutionM,widthPx,heightPx,resolutionXMPerPx:(e.maxX-e.minX)/widthPx,resolutionYMPerPx:(e.maxY-e.minY)/heightPx};
 }
 function requestFromParcel(parcel,targetResolutionM=LIMITS.targetResolutionM){
  const p=Parcel.normalizeParcel(parcel);return normalizeRequest({sourceCrs:p.sourceCrs,extent:extentFromParcel(p),targetResolutionM});
 }
 function sourceToPixel(point,orthophoto){
  const e=orthophoto?.extent,w=orthophoto?.widthPx,h=orthophoto?.heightPx;
  if(!Array.isArray(point)||point.length!==2||!point.every(Number.isFinite)||!e||!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||!['minX','minY','maxX','maxY'].every(k=>Number.isFinite(e[k]))||e.minX>=e.maxX||e.minY>=e.maxY)fail('orthophoto-extent-invalid');
  return [(point[0]-e.minX)/(e.maxX-e.minX)*w,(e.maxY-point[1])/(e.maxY-e.minY)*h];
 }
 function normalizeMetadata(value,parcel){
  if(!parcel)fail('orthophoto-requires-parcel');
  const p=Parcel.normalizeParcel(parcel);
  if(!value||typeof value!=='object'||value.sourceCrs!==p.sourceCrs||!sameExtent(value.extent,extentFromParcel(p)))fail('orthophoto-extent-invalid');
  const expected=normalizeRequest({sourceCrs:value.sourceCrs,extent:value.extent,targetResolutionM:value.requestedResolutionM});
  if(value.widthPx!==expected.widthPx||value.heightPx!==expected.heightPx||value.resolutionXMPerPx!==expected.resolutionXMPerPx||value.resolutionYMPerPx!==expected.resolutionYMPerPx||value.sourcePolicy!=='latest-available'||value.mediaType!=='image/jpeg')fail('orthophoto-extent-invalid');
  return {sourceCrs:expected.sourceCrs,extent:expected.extent,widthPx:expected.widthPx,heightPx:expected.heightPx,requestedResolutionM:expected.targetResolutionM,resolutionXMPerPx:expected.resolutionXMPerPx,resolutionYMPerPx:expected.resolutionYMPerPx,mediaType:'image/jpeg',sourcePolicy:'latest-available'};
 }
 const api={LIMITS,extentFromParcel,normalizeRequest,requestFromParcel,sourceToPixel,normalizeMetadata};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanOrthophotoCore=api;
})(globalThis);
