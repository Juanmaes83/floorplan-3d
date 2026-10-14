/* PresentationPlanV1 is derived from FloorPlanProjectV1 and never edits it. */
(function(root){
 'use strict';
 const bounds=poly=>{
  const xs=poly.map(p=>p[0]),ys=poly.map(p=>p[1]);
  return {x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};
 };
 const area=poly=>Math.abs(poly.reduce((sum,p,i)=>{const q=poly[(i+1)%poly.length];return sum+p[0]*q[1]-q[0]*p[1];},0))/2/1e6;
 function create(project,geometry,entryId,revision,roomId){
  if(!project?.id||!geometry?.center||!entryId||!revision)throw Error('Presentation source is incomplete');
  const rooms=geometry.rooms.filter(r=>r.poly.length>=3&&area(r.poly)>0);
  if(!rooms.length||!project.walls.some(w=>w.status!=='demolished'))return null;
  const room=rooms.find(r=>r.id===roomId)||rooms[0];
  const center={x:geometry.center.x,y:geometry.center.y};
  const stop=(kind,r)=>({id:kind==='overview'?'overview':`room:${r.id}`,kind,roomId:r?.id||null,
   label:r?.name||'Vista general',areaM2:r?area(r.poly):rooms.filter(x=>x.counted).reduce((n,x)=>n+area(x.poly),0),
   bounds:r?bounds(r.poly):{...geometry.envelope}});
  return {version:1,projectId:project.id,entryId,revision,center,stops:[stop('overview'),stop('room',room)]};
 }
 const current=(plan,projectId,entryId,revision)=>!!plan&&plan.projectId===projectId&&plan.entryId===entryId&&plan.revision===revision;
 const api={create,current,area,bounds};
 if(typeof module==='object')module.exports=api;else root.FloorPlanPresentationCore=api;
})(globalThis);
