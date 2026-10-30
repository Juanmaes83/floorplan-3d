/* Phase B6: what an observation can be anchored to, listed for people (the professional's draft, the client file).
   Pure: from the canonical project and the prepared views it returns groups of {label, anchor}. Elements are named by
   what they are and the room they are in («Cama · Dormitorio principal», «Ventana 2 · Salón»), so a client who does
   not know Rubik can find them. Rooms of an element: the room containing its position (objects) or the room whose
   outline is nearest to the middle of the opening (doors and windows). */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanReviewAnchors=api;})(typeof self!=='undefined'?self:this,function(){
 'use strict';
 const inside=(p,poly)=>{let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)c=!c;}return c;};
 const segDist=(p,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy,t=l?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/l)):0;return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);};
 const edgeDist=(p,poly)=>Math.min(...poly.map((a,i)=>segDist(p,a,poly[(i+1)%poly.length])));
 function roomAt(project,p){const rooms=(project.rooms||[]).filter(r=>r.polygon?.length>=3);return rooms.find(r=>inside(p,r.polygon))||null;}
 function nearestRoom(project,p,maxMm=400){let best=null,d=Infinity;for(const r of project.rooms||[]){if(!(r.polygon?.length>=3))continue;const x=inside(p,r.polygon)?0:edgeDist(p,r.polygon);if(x<d){d=x;best=r;}}return d<=maxMm?best:null;}
 function openingPoint(project,o){const w=(project.walls||[]).find(x=>x.id===o.wallId);if(!w)return null;const len=Math.hypot(w.end.x-w.start.x,w.end.y-w.start.y)||1,t=Math.min(1,Math.max(0,((o.offsetMm||0)+(o.widthMm||0)/2)/len));return {x:w.start.x+(w.end.x-w.start.x)*t,y:w.start.y+(w.end.y-w.start.y)*t};}
 // names: {room(r), object(o), door, window, project, element, image} — the caller's language.
 function groups(project,{names,views=[]}={}){
  const out=[{key:'project',label:names.project,items:[{label:names.project,anchor:{kind:'project'}}]}];
  const roomLabel=r=>names.room(r);
  out.push({key:'rooms',label:names.rooms,items:(project.rooms||[]).map(r=>({label:roomLabel(r),anchor:{kind:'room',roomId:r.id,label:roomLabel(r)}}))});
  const elements=[];
  for(const o of project.objects||[]){const r=o.position?roomAt(project,o.position):null,base=names.object(o),label=r?`${base} · ${roomLabel(r)}`:base;elements.push({label,anchor:{kind:'element',elementId:o.id,elementType:'object',...(r?{roomId:r.id}:{}),label}});}
  const count={door:0,window:0};
  for(const o of project.openings||[]){const type=o.kind==='window'?'window':'door';const p=openingPoint(project,o),r=p?nearestRoom(project,p):null,base=`${type==='window'?names.window:names.door} ${++count[type]}`,label=r?`${base} · ${roomLabel(r)}`:base;elements.push({label,anchor:{kind:'element',elementId:o.id,elementType:type,...(r?{roomId:r.id}:{}),label}});}
  if(elements.length)out.push({key:'elements',label:names.elements,items:elements});
  if(views.length)out.push({key:'views',label:names.images,items:views.map(v=>({label:`${names.image}: ${v.label}`,anchor:{kind:'view',viewId:v.id,label:`${names.image}: ${v.label}`}}))});
  return out;
 }
 // A point on the plan: its room when the point is inside one.
 function point(project,x,y,names){const r=roomAt(project,{x,y});const label=r?`${names.point} · ${names.room(r)}`:names.point;return {kind:'point',x:Math.round(x),y:Math.round(y),...(r?{roomId:r.id}:{}),label};}
 return {groups,point,roomAt};
});
