/* PresentationPlanV1 is derived from FloorPlanProjectV1 and never edits it. */
(function(root){
 'use strict';
 const bounds=poly=>{
  const xs=poly.map(p=>p[0]),ys=poly.map(p=>p[1]);
  return {x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};
 };
 const area=poly=>Math.abs(poly.reduce((sum,p,i)=>{const q=poly[(i+1)%poly.length];return sum+p[0]*q[1]-q[0]*p[1];},0))/2/1e6;
 const roomIds=geometry=>geometry.rooms.filter(r=>r.poly.length>=3&&area(r.poly)>0).map(r=>r.id);
 function reconcile(saved,project,geometry,entryId,revision){
  const available=roomIds(geometry),valid=new Set(available);
  if(!saved)return {selected:available.slice(0,1),changed:false,missing:0,invalid:false};
  if(saved.version!==1||saved.projectId!==project.id||saved.entryId!==entryId||!Array.isArray(saved.roomIds)||
   !saved.roomIds.length||saved.roomIds.some(id=>typeof id!=='string')||new Set(saved.roomIds).size!==saved.roomIds.length||typeof saved.revision!=='string')
   return {selected:available.slice(0,1),changed:true,missing:0,invalid:true};
  const selected=[...new Set(saved.roomIds)].filter(id=>valid.has(id));
  const missing=saved.roomIds.length-selected.length;
  return {selected:selected.length?selected:available.slice(0,1),changed:saved.revision!==revision||missing>0,missing,invalid:false};
 }
 function sidecar(projectId,entryId,revision,selected){
  return {version:1,projectId,entryId,revision,roomIds:[...new Set(selected)]};
 }
 const key=(entryId,projectId)=>`rubik-sota-presentation-v1:${encodeURIComponent(entryId)}:${encodeURIComponent(projectId)}`;
 function create(project,geometry,entryId,revision,selection){
  if(!project?.id||!geometry?.center||!entryId||!revision)throw Error('Presentation source is incomplete');
  const rooms=geometry.rooms.filter(r=>r.poly.length>=3&&area(r.poly)>0);
  if(!rooms.length||!project.walls.some(w=>w.status!=='demolished'))return null;
  const ids=selection===undefined?[rooms[0].id]:Array.isArray(selection)?selection:[selection];
  const chosen=[...new Set(ids)].map(id=>rooms.find(r=>r.id===id)).filter(Boolean);
  if(!chosen.length)return null;
  const center={x:geometry.center.x,y:geometry.center.y};
  const stop=(kind,r)=>({id:kind==='overview'?'overview':`room:${r.id}`,kind,roomId:r?.id||null,
   label:r?.name||'Vista general',areaM2:r?area(r.poly):rooms.filter(x=>x.counted).reduce((n,x)=>n+area(x.poly),0),
   bounds:r?bounds(r.poly):{...geometry.envelope}});
  return {version:1,projectId:project.id,entryId,revision,center,stops:[stop('overview'),...chosen.map(r=>stop('room',r))]};
 }
 const current=(plan,projectId,entryId,revision)=>!!plan&&plan.projectId===projectId&&plan.entryId===entryId&&plan.revision===revision;
 const api={create,current,area,bounds,reconcile,sidecar,key};
 if(typeof module==='object')module.exports=api;else root.FloorPlanPresentationCore=api;
})(globalThis);
