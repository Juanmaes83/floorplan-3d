/* Project-First A3: orientation, sun and site read model for Analyze and the site/sun report. Pure: everything is
   derived from data the app already has (FloorPlanExterior facades, site.northOffsetDeg, site.location, FloorPlanSolar,
   site.parcel and the explicit buildingPlacement). It owns no data and never mutates its inputs. Orientative: not a
   thermal, daylight or planning calculation. UMD: window.FloorPlanSiteVisual / module.exports. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanSiteVisual=api;})(typeof self!=='undefined'?self:this,function(){
 'use strict';
 const wrap=v=>(v%360+360)%360;
 const SECTORS=['N','NE','E','SE','S','SO','O','NO'];
 const sectorOf=bearing=>SECTORS[Math.round(wrap(bearing)/45)%8];
 function inside(poly,x,y){let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)hit=!hit;}return hit;}
 // Plan bearing: degrees clockwise from plan-up (plan y grows downwards). True bearing = plan bearing − north offset,
 // the same convention FloorPlanSolar uses (projectAzimuth = azimuth + northOffsetDeg).
 const planBearing=(nx,ny)=>wrap(Math.atan2(nx,-ny)*180/Math.PI);
 // Facades by orientation. Facade walls are the ones 8A (FloorPlanExterior.derive) classified; their outer side is
 // the side without an indoor room at the wall's midpoint (8A proved that one side is free along the wall).
 function facades({project,exterior,northOffsetDeg}={}){
  const ids=new Set((exterior?.walls||[]).filter(w=>w.status==='facade').map(w=>w.wallId));
  const indoor=(project?.rooms||[]).filter(r=>Array.isArray(r.polygon)&&r.polygon.length>=3&&!['terrace','balcony'].includes(r.family));
  const north=Number.isFinite(northOffsetDeg)?northOffsetDeg:null,walls=[];
  for(const w of project?.walls||[]){
   if(!ids.has(w.id))continue;
   const dx=w.end.x-w.start.x,dy=w.end.y-w.start.y,len=Math.hypot(dx,dy);if(!(len>0))continue;
   let nx=-dy/len,ny=dx/len;const d=w.thicknessMm/2+50,mx=w.start.x+dx/2,my=w.start.y+dy/2;
   if(indoor.some(r=>inside(r.polygon,mx+nx*d,my+ny*d))){nx=-nx;ny=-ny;}
   const plan=planBearing(nx,ny),windows=(project.openings||[]).filter(o=>o.wallId===w.id&&o.kind==='window').reduce((s,o)=>s+(o.widthMm||0),0);
   walls.push({wallId:w.id,lengthMm:len,windowMm:windows,planBearingDeg:+plan.toFixed(1),...(north===null?{}:{trueBearingDeg:+wrap(plan-north).toFixed(1),sector:sectorOf(plan-north)})});
  }
  const sectors=north===null?null:SECTORS.map(s=>{const list=walls.filter(w=>w.sector===s);return {sector:s,walls:list.length,lengthMm:list.reduce((a,w)=>a+w.lengthMm,0),windowMm:list.reduce((a,w)=>a+w.windowMm,0)};});
  return {status:walls.length?(north===null?'relative':'oriented'):'unavailable',northOffsetDeg:north,walls,sectors,
   totalWindowMm:walls.reduce((a,w)=>a+w.windowMm,0),classification:exterior?.status||'unavailable'};
 }
 // Sun path for reference days at the project location (FloorPlanSolar → SunCalc). Each point keeps true azimuth
 // and altitude; the plan view rotates it with the north offset. Sampled every `stepMin` minutes, local time.
 const DAYS=[{key:'summer',month:6,day:21},{key:'equinox',month:3,day:20},{key:'winter',month:12,day:21}];
 function sunPath({site,Solar,year=new Date().getFullYear(),stepMin=15}={}){
  const loc=site?.location,north=site?.northOffsetDeg;
  if(!loc)return {status:'unavailable',reason:'location'};
  if(!Number.isFinite(north))return {status:'unavailable',reason:'north'};
  const days=[];
  for(const d of DAYS){
   const date=`${year}-${String(d.month).padStart(2,'0')}-${String(d.day).padStart(2,'0')}`,points=[];
   for(let m=0;m<24*60;m+=stepMin){const time=`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
    const p=Solar.position({latitude:loc.latitude,longitude:loc.longitude,timeZone:loc.timeZone,northOffsetDeg:north,localDate:date,localTime:time});
    if(p.status==='available-orientative')points.push({time,azimuthDeg:+p.azimuthDeg.toFixed(2),altitudeDeg:+p.altitudeDeg.toFixed(2),projectAzimuthDeg:+p.projectAzimuthDeg.toFixed(2)});}
   const up=points.filter(p=>p.altitudeDeg>0),noon=up.reduce((b,p)=>!b||p.altitudeDeg>b.altitudeDeg?p:b,null);
   days.push({key:d.key,date,points,sunrise:up[0]?.time||null,sunset:up.at(-1)?.time||null,daylightMin:up.length*stepMin,maxAltitudeDeg:noon?noon.altitudeDeg:null,maxAt:noon?.time||null,maxAzimuthDeg:noon?.azimuthDeg??null});
  }
  return {status:'available-orientative',source:'suncalc',latitude:loc.latitude,longitude:loc.longitude,timeZone:loc.timeZone,northOffsetDeg:north,stepMin,days};
 }
 // Parcel and building footprint in the parcel's local frame (mm, north up, y towards south), through the explicit
 // placement only. Without placement the parcel is shown alone; nothing is positioned by guess.
 function siteView({site,footprint,Parcel,Territory}={}){
  if(!site?.parcel)return {status:'unavailable',reason:'parcel'};
  let local;try{local=Parcel.toLocalGeometry(site.parcel);}catch{return {status:'unavailable',reason:'parcel-geometry'};}
  const shoelace=r=>Math.abs(r.reduce((s,a,i)=>{const b=r[(i+1)%r.length];return s+a[0]*b[1]-b[0]*a[1];},0))/2;
  const areaM2=local.polygons.reduce((s,p)=>s+shoelace(p.rings[0])-p.rings.slice(1).reduce((h,r)=>h+shoelace(r),0),0)/1e6;
  let building=null,reason=null;
  if(!site.buildingPlacement)reason='placement';
  else if(!footprint?.length)reason='footprint';
  else{try{building=footprint.map(p=>{const q=Territory.modelToParcel(site,p);return [q.x,q.y];});}catch{reason='placement';}}
  const pts=[...local.polygons.flatMap(p=>p.rings.flat()),...(building||[])],xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);
  const x=Math.min(...xs),y=Math.min(...ys),w=Math.max(...xs)-x,h=Math.max(...ys)-y,pad=Math.max(w,h)*.08||1000;
  return {status:building?'placed':'parcel-only',reason,viewBox:[x-pad,y-pad,w+2*pad,h+2*pad],polygons:local.polygons,building,parcelAreaM2:+areaM2.toFixed(2),
   footprintAreaM2:building?+(shoelace(building)/1e6).toFixed(2):null,orthophoto:!!site.orthophoto,terrain:!!site.terrain,vertical:!!site.buildingPlacement?.vertical};
 }
 return {SECTORS,sectorOf,planBearing,facades,sunPath,siteView};
});
