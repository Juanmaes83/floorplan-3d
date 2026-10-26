/* Surfaces: room → level → home (roadmap point 3). One derivation over the data already persisted; nothing is
   stored and no project is rewritten.
   - Room area: the area the app already shows, the room polygon (net inner faces) in m².
   - Exclusion: the existing rooms[].countsTowardArea. An excluded room keeps its own area but does not add up.
   - Status from the existing scale of each project/level: confidence 'real' (calibrated with a known dimension and
     confirmed) → 'measured'; 'estimated' or 'pending' → 'estimated' (a figure exists but it is not calibrated). A
     room whose polygon gives no usable figure is 'unavailable' and has no area (never 0 m²).
   - Aggregate (level and home), over the rooms that count: none computable → 'unavailable'; any 'estimated' →
     'estimated'; otherwise 'measured'. 'complete' is false when a counted room is unavailable: the subtotal shown is
     only the part that could be computed. */
(function(root){
 'use strict';
 const STATUS=['measured','estimated','unavailable'];
 const statusOfScale=project=>project?.scale?.confidence==='real'?'measured':'estimated';
 // Shoelace area in m² of a polygon of {x,y} in mm; null when it is not a usable surface.
 function polygonAreaM2(polygon){
  if(!Array.isArray(polygon)||polygon.length<3||!polygon.every(p=>Number.isFinite(p?.x)&&Number.isFinite(p?.y)))return null;
  const mm2=Math.abs(polygon.reduce((s,p,i)=>{const q=polygon[(i+1)%polygon.length];return s+p.x*q.y-q.x*p.y;},0))/2;
  return mm2>0?mm2/1e6:null;
 }
 function aggregate(rooms){
  const counted=rooms.filter(r=>r.counted),computable=counted.filter(r=>r.status!=='unavailable');
  return {areaM2:computable.length?computable.reduce((s,r)=>s+r.areaM2,0):null,
   status:!computable.length?'unavailable':computable.some(r=>r.status==='estimated')?'estimated':'measured',
   complete:computable.length===counted.length,
   missing:counted.filter(r=>r.status==='unavailable').map(r=>r.id),
   excluded:rooms.filter(r=>!r.counted).map(r=>r.id)};
 }
 // One level: a FloorPlanProjectV1 and, inside a building, its level identity.
 function level(project,{levelId=null,name=null}={}){
  const scale=statusOfScale(project);
  const rooms=(project.rooms||[]).map(r=>{const areaM2=polygonAreaM2(r.polygon);
   return {id:r.id,name:r.name,counted:r.countsTowardArea!==false,areaM2,status:areaM2===null?'unavailable':scale};});
  return {levelId,name,rooms,...aggregate(rooms)};
 }
 // The whole home: a FloorPlanBuildingV1 (N levels) or a single FloorPlanProjectV1 (one level).
 function home(source){
  const levels=Array.isArray(source?.levels)&&source.levels.every(l=>l?.project)
   ?[...source.levels].sort((a,b)=>(a.order??0)-(b.order??0)).map(l=>level(l.project,{levelId:l.id,name:l.name}))
   :[level(source)];
  const total=aggregate(levels.flatMap(l=>l.rooms));
  return {levels,areaM2:total.areaM2,status:total.status,complete:total.complete,missing:total.missing,excluded:total.excluded};
 }
 const api={STATUS,statusOfScale,polygonAreaM2,level,home};
 if(typeof module==='object')module.exports=api;else root.FloorPlanSurfaceMetrics=api;
})(globalThis);
