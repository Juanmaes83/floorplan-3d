/* Phase C1: quantity schedules (geometry → quantities). Pure presentation of FloorPlanQuantities (Point 7A): it never
   measures geometry itself. Tables a professional reads and exports: rooms, floor finishes, walls by lifecycle,
   openings by type and size, furniture by type. Every figure keeps its status (measured / estimated / unavailable);
   an unavailable figure stays null, never 0. CSV is written for a Spanish spreadsheet: «;» separator, decimal comma,
   UTF-8 with BOM. */
(function(root,factory){const api=factory(typeof module==='object'?require('./quantity-core.js'):root.FloorPlanQuantities);if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanQuantitySchedule=api;})(typeof self!=='undefined'?self:this,function(Q){
 'use strict';
 if(!Q)throw Error('FloorPlanQuantitySchedule requires FloorPlanQuantities.');
 const round=(n,d=2)=>n===null||n===undefined||!Number.isFinite(n)?null:Math.round(n*10**d)/10**d;
 const KIND_ORDER=['door','sliding-door','window','opening'];
 // name: (text) => display text in the caller's language.
 function build(project,{name=v=>v}={}){
  const home=Q.home(project),q=home.quantities,level=home.levels[0];
  const materials=new Map((project.materials||[]).map(m=>[m.id,m])),rooms=new Map((project.rooms||[]).map(r=>[r.id,r]));
  const roomRows=level.rooms.map(r=>({id:r.id,name:name(r.name),counted:r.counted,floorM2:round(r.floor.areaM2),perimeterM:round(r.perimeter.lengthM),wallNetM2:r.wallFaces?.status==='unavailable'?null:round(r.wallFaces?.netAreaM2),wallComplete:r.wallFaces?.complete!==false,floorMaterial:materials.has(r.floorMaterialId)?name(materials.get(r.floorMaterialId).name):null,status:r.status}));
  const floorRows=(q.floorMaterials||[]).map(f=>({materialId:f.materialId,name:materials.has(f.materialId)?name(materials.get(f.materialId).name):f.materialId||null,areaM2:round(f.areaM2),rooms:(f.roomIds||[]).map(id=>rooms.has(id)?name(rooms.get(id).name):id),status:f.status,complete:f.complete}));
  const walls=st=>{const w=st?q.wallsByStatus[st]:q.walls;return {count:w.count,lengthM:round(w.wallLength.value),faceNetM2:round(w.faceNetArea.value),surfaceNetM2:round(w.wallSurfaceNetArea.value),status:w.wallLength.status,complete:w.wallLength.complete};};
  const wallRows=['existing','new','demolished'].map(st=>({lifecycle:st,...walls(st)})).filter(w=>w.count>0);
  // Openings: by kind, then by size (width × height in cm), from the canonical openings.
  const sizes=new Map();for(const o of project.openings||[]){const k=`${o.kind}|${Math.round((o.widthMm||0)/10)}|${Math.round((o.heightMm||0)/10)}`;sizes.set(k,(sizes.get(k)||0)+1);}
  const openingRows=[...sizes.entries()].map(([k,count])=>{const [kind,w,h]=k.split('|');return {kind,widthCm:+w,heightCm:+h,count};}).sort((a,b)=>KIND_ORDER.indexOf(a.kind)-KIND_ORDER.indexOf(b.kind)||b.widthCm-a.widthCm||b.heightCm-a.heightCm);
  const furniture=new Map();for(const o of project.objects||[]){const k=name(o.name||o.type);furniture.set(k,(furniture.get(k)||0)+1);}
  const furnitureRows=[...furniture.entries()].map(([label,count])=>({name:label,count})).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name));
  return {status:home.status,
   totals:{floorM2:round(q.floor.areaM2),floorStatus:q.floor.status,floorComplete:q.floor.complete,excluded:q.floor.excluded.length,perimeterM:round(q.roomPerimeter.lengthM),walls:walls(null),openings:q.openings.total,openingsByKind:q.openings.byKind,furniture:(project.objects||[]).length},
   rooms:roomRows,floors:floorRows,walls:wallRows,openings:openingRows,furniture:furnitureRows};
 }
 // CSV: one file with a section column, readable in Excel/LibreOffice set to Spanish.
 function csv(s,labels){
  const n=v=>v===null||v===undefined?'':typeof v==='number'?String(v).replace('.',','):String(v);
  const cell=v=>{const t=n(v);return /[;"\n]/.test(t)?'"'+t.replace(/"/g,'""')+'"':t;};
  const rows=[[labels.section,labels.item,labels.quantity,labels.unit,labels.detail,labels.status]];
  for(const r of s.rooms)rows.push([labels.rooms,r.name,r.floorM2,'m2',`${labels.perimeter} ${n(r.perimeterM)} m · ${labels.wallNet} ${n(r.wallNetM2)} m2${r.floorMaterial?' · '+r.floorMaterial:''}${r.counted?'':' · '+labels.excluded}`,labels.statusText(r.status)]);
  for(const f of s.floors)rows.push([labels.floors,f.name,f.areaM2,'m2',f.rooms.join(', '),labels.statusText(f.status)]);
  for(const w of s.walls)rows.push([labels.walls,labels.wallStatus(w.lifecycle),w.lengthM,'m',`${w.count} ${labels.segments} · ${labels.faceNet} ${n(w.faceNetM2)} m2`,labels.statusText(w.status)]);
  for(const o of s.openings)rows.push([labels.openings,`${labels.kind(o.kind)} ${o.widthCm}×${o.heightCm} cm`,o.count,'ud','','']);
  for(const f of s.furniture)rows.push([labels.furniture,f.name,f.count,'ud','','']);
  return '﻿'+rows.map(r=>r.map(cell).join(';')).join('\r\n')+'\r\n';
 }
 return {build,csv,round};
});
