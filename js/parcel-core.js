/* 8C-B: source parcel geometry and its local display frame. No project geometry or network. */
(function(root){
 'use strict';
 const SUPPORTED_CRS=Object.freeze(['EPSG:25829','EPSG:25830','EPSG:25831','EPSG:32628']);
 const LIMITS=Object.freeze({documentBytes:2_000_000,parcels:32,points:4000,polygons:64,rings:128});
 const fail=reason=>{const error=new Error(reason);error.reason=reason;throw error;};
 const clone=value=>JSON.parse(JSON.stringify(value));
 function normalizeReference(value){
  if(typeof value!=='string')fail('invalid-parcel-reference');
  const reference=value.trim().replace(/[ -]/g,'').toUpperCase();
  if(![14,18,20].includes(reference.length)||!/^[A-Z0-9]+$/.test(reference))fail('invalid-parcel-reference');
  return reference.slice(0,14);
 }
 function normalizeCrs(value){
  if(typeof value!=='string')fail('unsupported-source-crs');
  const match=/^(?:EPSG:(?::|\/\/)?|urn:ogc:def:crs:EPSG::|https?:\/\/www\.opengis\.net\/def\/crs\/EPSG\/0\/)(\d{4,5})$/i.exec(value.trim());
  if(!match)fail('unsupported-source-crs');
  const crs='EPSG:'+match[1];
  if(!SUPPORTED_CRS.includes(crs))fail('unsupported-source-crs');
  return crs;
 }
 const orient=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 const same=(a,b)=>a[0]===b[0]&&a[1]===b[1];
 const between=(a,b,p)=>Math.min(a[0],b[0])<=p[0]&&p[0]<=Math.max(a[0],b[0])&&Math.min(a[1],b[1])<=p[1]&&p[1]<=Math.max(a[1],b[1]);
 function segmentHit(a,b,c,d){
  const abC=orient(a,b,c),abD=orient(a,b,d),cdA=orient(c,d,a),cdB=orient(c,d,b);
  return (abC===0&&between(a,b,c))||(abD===0&&between(a,b,d))||(cdA===0&&between(c,d,a))||(cdB===0&&between(c,d,b))||(abC*abD<0&&cdA*cdB<0);
 }
 function signedArea(ring){let area=0;const origin=ring[0];for(let i=0;i<ring.length;i++){const a=ring[i],b=ring[(i+1)%ring.length];area+=(a[0]-origin[0])*(b[1]-origin[1])-(b[0]-origin[0])*(a[1]-origin[1]);}return area/2;}
 function pointInRing(point,ring){
  let inside=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
   const a=ring[i],b=ring[j];
   if(orient(a,b,point)===0&&between(a,b,point))return 0;
   if((a[1]>point[1])!==(b[1]>point[1])&&point[0]<(b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  }
  return inside?1:-1;
 }
 function ringsCross(a,b){for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++)if(segmentHit(a[i],a[(i+1)%a.length],b[j],b[(j+1)%b.length]))return true;return false;}
 const comparePoints=(a,b)=>a[0]-b[0]||a[1]-b[1];
 function canonicalRing(raw,exterior){
  if(!Array.isArray(raw)||raw.length<3||raw.length>LIMITS.points)fail('invalid-source-geometry');
  const points=raw.map(p=>{if(!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite))fail('invalid-source-geometry');return [p[0],p[1]];});
  if(same(points[0],points.at(-1)))points.pop();
  if(points.length<3||new Set(points.map(p=>p.join(','))).size!==points.length)fail('invalid-source-geometry');
  for(let i=0;i<points.length;i++){
   const previous=points[(i+points.length-1)%points.length],current=points[i],next=points[(i+1)%points.length];
   if(same(current,next)||orient(previous,current,next)===0&&((current[0]-previous[0])*(next[0]-current[0])+(current[1]-previous[1])*(next[1]-current[1]))<0)fail('invalid-source-geometry');
  }
  const area=signedArea(points);if(!Number.isFinite(area)||area===0)fail('invalid-source-geometry');
  for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){
   if(j===i+1||(i===0&&j===points.length-1))continue;
   if(segmentHit(points[i],points[(i+1)%points.length],points[j],points[(j+1)%points.length]))fail('invalid-source-geometry');
  }
  if((area>0)!==exterior)points.reverse();
  let start=0;for(let i=1;i<points.length;i++)if(comparePoints(points[i],points[start])<0)start=i;
  return points.slice(start).concat(points.slice(0,start));
 }
 function canonicalGeometry(raw){
  if(!raw||raw.type!=='MultiPolygon'||!Array.isArray(raw.polygons)||!raw.polygons.length||raw.polygons.length>LIMITS.polygons)fail('invalid-source-geometry');
  let count=0,ringCount=0;
  const polygons=raw.polygons.map(p=>{
   if(!p||!Array.isArray(p.rings)||!p.rings.length)fail('invalid-source-geometry');
   ringCount+=p.rings.length;if(ringCount>LIMITS.rings)fail('invalid-source-geometry');
   const rings=p.rings.map((r,i)=>{count+=r.length;if(count>LIMITS.points)fail('invalid-source-geometry');return canonicalRing(r,i===0);});
   const exterior=rings[0],holes=rings.slice(1);
   for(const hole of holes)if(pointInRing(hole[0],exterior)!==1||ringsCross(hole,exterior))fail('invalid-source-geometry');
   for(let i=0;i<holes.length;i++)for(let j=i+1;j<holes.length;j++)if(ringsCross(holes[i],holes[j])||pointInRing(holes[i][0],holes[j])!==-1||pointInRing(holes[j][0],holes[i])!==-1)fail('invalid-source-geometry');
   holes.sort((a,b)=>comparePoints(a[0],b[0]));
   return {rings:[exterior,...holes]};
  });
  const inPolygon=(point,p)=>pointInRing(point,p.rings[0])===1&&p.rings.slice(1).every(hole=>pointInRing(point,hole)===-1);
  for(let i=0;i<polygons.length;i++)for(let j=i+1;j<polygons.length;j++){
   const a=polygons[i],b=polygons[j];
   if(a.rings.some(ar=>b.rings.some(br=>ringsCross(ar,br)))||inPolygon(a.rings[0][0],b)||inPolygon(b.rings[0][0],a))fail('invalid-source-geometry');
  }
  polygons.sort((a,b)=>comparePoints(a.rings[0][0],b.rings[0][0]));
  return {type:'MultiPolygon',polygons};
 }
 function frameFor(geometry,sourceCrs){
  const points=geometry.polygons.flatMap(p=>p.rings.flat());
  const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
  return {sourceCrs,originX:(Math.min(...xs)+Math.max(...xs))/2,originY:(Math.min(...ys)+Math.max(...ys))/2,sourceUnits:'m',xAxis:'east',yAxis:'north'};
 }
 function normalizeParcel(value){
  if(!value||typeof value!=='object')fail('invalid-source-geometry');
  const reference=normalizeReference(value.reference),sourceCrs=normalizeCrs(value.sourceCrs),sourceGeometry=canonicalGeometry(value.sourceGeometry),frame=frameFor(sourceGeometry,sourceCrs);
  if(value.frame!==undefined&&(!value.frame||Object.keys(frame).some(key=>value.frame[key]!==frame[key])||Object.keys(value.frame).length!==Object.keys(frame).length))fail('invalid-source-frame');
  const out={reference,sourceCrs,sourceGeometry,frame};
  if(value.inspireId!==undefined){
   if(!value.inspireId||typeof value.inspireId.localId!=='string'||!value.inspireId.localId||value.inspireId.localId.length>200||typeof value.inspireId.namespace!=='string'||!value.inspireId.namespace||value.inspireId.namespace.length>200)fail('invalid-parcel-input');
   out.inspireId={localId:value.inspireId.localId,namespace:value.inspireId.namespace};
  }
  return out;
 }
 function toLocalGeometry(parcel){
  const normalized=normalizeParcel(parcel),frame=normalized.frame;
  return {type:'MultiPolygon',polygons:normalized.sourceGeometry.polygons.map(p=>({rings:p.rings.map(r=>r.map(([x,y])=>[Math.round((x-frame.originX)*1000),Math.round((frame.originY-y)*1000)]))}))};
 }
 const api={SUPPORTED_CRS,LIMITS,normalizeReference,normalizeCrs,canonicalGeometry,normalizeParcel,toLocalGeometry};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanParcelCore=api;
})(globalThis);
