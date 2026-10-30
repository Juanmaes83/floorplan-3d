/* Phase B7: material board / moodboard from what the project ALREADY uses — not an inspiration board. Pure: from the
   canonical project (and the local surface catalog for real samples) it lists the floor finishes with their m² and
   rooms, the wall finishes, and a furniture palette weighted by footprint. Nothing is invented: a project without
   assigned finishes says so. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanMoodboard=api;})(typeof self!=='undefined'?self:this,function(){
 'use strict';
 const area=poly=>{if(!Array.isArray(poly)||poly.length<3)return 0;let s=0;for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length];s+=a.x*b.y-b.x*a.y;}return Math.abs(s)/2e6;};
 const hex=c=>/^#[0-9a-f]{6}$/i.test(c||'')?c.toLowerCase():null;
 const length=w=>Math.hypot(w.end.x-w.start.x,w.end.y-w.start.y)/1000;
 // catalog: optional {get(id)} → entry with sample.path (real texture thumbnail) and name.
 function derive(project,{catalog=null,name=v=>v}={}){
  const materials=new Map((project.materials||[]).map(m=>[m.id,m]));
  const sampleOf=m=>{const preset=m.appearance?.preset;const e=preset?.startsWith('surface-')?catalog?.get?.(preset):null;return e?.sample?.path||null;};
  const swatch=m=>({materialId:m.id,name:name(m.name),color:hex(m.appearance?.color)||'#cccccc',preset:m.appearance?.preset||null,sample:sampleOf(m)});
  const floors=new Map();
  for(const r of project.rooms||[]){const m=materials.get(r.floorMaterialId);if(!m)continue;const a=area(r.polygon);const f=floors.get(m.id)||{...swatch(m),areaM2:0,rooms:[]};f.areaM2+=a;f.rooms.push(name(r.name));floors.set(m.id,f);}
  const walls=new Map();
  for(const w of project.walls||[]){if(w.status==='demolished'||!w.surfaceMaterialId)continue;const m=materials.get(w.surfaceMaterialId);if(!m)continue;const x=walls.get(m.id)||{...swatch(m),lengthM:0,count:0};x.lengthM+=length(w);x.count++;walls.set(m.id,x);}
  const palette=new Map();let furniture=0;
  for(const o of project.objects||[]){const c=hex(o.color);if(!c)continue;furniture++;const a=(o.size?.widthMm||0)*(o.size?.depthMm||0)/1e6;const p=palette.get(c)||{color:c,weightM2:0,count:0,names:new Set()};p.weightM2+=a;p.count++;p.names.add(name(o.name||o.type));palette.set(c,p);}
  const round=n=>Math.round(n*100)/100;
  return {
   floors:[...floors.values()].map(f=>({...f,areaM2:round(f.areaM2)})).sort((a,b)=>b.areaM2-a.areaM2),
   walls:[...walls.values()].map(w=>({...w,lengthM:round(w.lengthM)})).sort((a,b)=>b.lengthM-a.lengthM),
   palette:[...palette.values()].sort((a,b)=>b.weightM2-a.weightM2).slice(0,8).map(p=>({color:p.color,weightM2:round(p.weightM2),count:p.count,names:[...p.names].slice(0,3)})),
   furniture,
   empty:!floors.size&&!walls.size&&!palette.size};
 }
 return {derive,area};
});
