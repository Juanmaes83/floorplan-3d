/* Offline geographic boundary. No renderer, network, or storage. */
(function(root){
 'use strict';
 const zoneValid=value=>{try{if(typeof value!=='string'||!value||value.length>100||/^[+-]|^UTC[+-]/i.test(value))return false;new Intl.DateTimeFormat('en',{timeZone:value}).format(0);return true;}catch{return false;}};
 function validateLocation(value){
  if(!value||typeof value!=='object'||!Number.isFinite(value.latitude)||Math.abs(value.latitude)>90||!Number.isFinite(value.longitude)||Math.abs(value.longitude)>180)throw Error('coordinates');
  if(!zoneValid(value.timeZone))throw Error('timeZone');
  return value;
 }
 function validateSite(value){
  if(value.northOffsetDeg!==undefined&&(!Number.isFinite(value.northOffsetDeg)||value.northOffsetDeg<0||value.northOffsetDeg>=360))throw Error('northOffsetDeg');
  if(value.location!==undefined)validateLocation(value.location);
  return value;
 }
 const Manual=Object.freeze({id:'manual',capabilities:Object.freeze({search:false,parcel:false,geometry:false,coordinates:true,sourceMetadata:true,orthophoto:false,elevation:false,terrain:false}),
  getCoordinates(input){
   try{validateLocation(input);return {status:'available',location:{latitude:input.latitude,longitude:input.longitude,timeZone:input.timeZone,source:{providerId:'manual',type:'user-entered'}}};}
   catch(error){return {status:'unavailable',reason:error.message};}
  },
  getSourceMetadata(){return {providerId:'manual',type:'user-entered'};}
 });
 const api={Manual,zoneValid,validateLocation,validateSite};
 if(typeof module==='object')module.exports=api;else root.FloorPlanGeoProvider=api;
})(globalThis);
