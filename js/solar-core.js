/* Time-zone and scene-coordinate adapter around SunCalc 2.1.1. No Three.js, DOM or network. */
(function(root){
 'use strict';
 const Sun=typeof module==='object'?require('../vendor/suncalc/suncalc.js'):root.SunCalc;
 const Geo=typeof module==='object'?require('./geo-provider.js'):root.FloorPlanGeoProvider;
 const wrap=value=>(value%360+360)%360;
 function localInstant(localDate,localTime,timeZone){
  if(!/^\d{4}-\d\d-\d\d$/.test(localDate||'')||!/^\d\d:\d\d$/.test(localTime||'')||!Geo.zoneValid(timeZone))return {status:'unavailable',reason:'date-time-zone'};
  const [y,m,d]=localDate.split('-').map(Number),[hour,minute]=localTime.split(':').map(Number),naive=Date.UTC(y,m-1,d,hour,minute);
  if(y<1900||y>2150||m<1||m>12||d<1||d>new Date(Date.UTC(y,m,0)).getUTCDate()||hour>23||minute>59)return {status:'unavailable',reason:'date-time'};
  const format=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
  const parts=ms=>Object.fromEntries(format.formatToParts(ms).filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));
  const utc=p=>Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second);
  const offsets=new Set();for(let h=-36;h<=36;h+=6){const ms=naive+h*3600000;offsets.add(utc(parts(ms))-ms);}
  const candidates=[...offsets].map(offset=>naive-offset).filter(ms=>utc(parts(ms))===naive).sort((a,b)=>a-b);
  if(candidates.length!==1)return {status:'unavailable',reason:candidates.length?'ambiguous-time':'nonexistent-time'};
  return {status:'available',instant:new Date(candidates[0]).toISOString(),offsetMinutes:(naive-candidates[0])/60000};
 }
 function position(input={}){
  try{Geo.validateLocation(input);Geo.validateSite(input);}catch(error){return {status:'unavailable',reason:error.message};}
  if(input.northOffsetDeg===undefined)return {status:'unavailable',reason:'north'};
  const time=localInstant(input.localDate,input.localTime,input.timeZone);if(time.status!=='available')return time;
  const p=Sun.getPosition(new Date(time.instant),input.latitude,input.longitude);
  if(!Number.isFinite(p.azimuth)||!Number.isFinite(p.altitude))return {status:'unavailable',reason:'position'};
  // SunCalc v2: degrees, clockwise from true north. Plan-up = world -Z; Y is height.
  const azimuthDeg=wrap(p.azimuth),projectAzimuthDeg=wrap(azimuthDeg+input.northOffsetDeg),a=projectAzimuthDeg*Math.PI/180,h=p.altitude*Math.PI/180;
  return {status:'available-orientative',azimuthDeg,altitudeDeg:p.altitude,aboveHorizon:p.altitude>0,projectAzimuthDeg,
   sceneDirection:{x:Math.sin(a)*Math.cos(h),y:Math.sin(h),z:-Math.cos(a)*Math.cos(h)},instant:time.instant,offsetMinutes:time.offsetMinutes,source:'suncalc',version:'2.1.1'};
 }
 const api={position,localInstant,wrap};if(typeof module==='object')module.exports=api;else root.FloorPlanSolar=api;
})(globalThis);
