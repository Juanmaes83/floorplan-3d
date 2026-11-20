/* SCULPT OP-04 · OpenPlan3D @771c9e1 (MIT), scanAlignment.ts,
   roomNesting.ts and roomplanMerge.ts. RUBIK uses canonical integer mm. */
(function(root){
 'use strict';
 const C=typeof module==='object'?require('./project-core.js'):root.FloorPlanCore;
 const listKeys={walls:'wal',openings:'opn',rooms:'rom',materials:'mat',objects:'obj',measurements:'msr'};
 const distance=(a,b)=>Math.hypot(b.x-a.x,b.y-a.y);
 const delta=(a,b)=>({x:b.x-a.x,y:b.y-a.y});
 const dot=(a,b)=>a.x*b.x+a.y*b.y;
 const cross=(a,b)=>a.x*b.y-a.y*b.x;
 const edges=ring=>ring.map((p,i)=>[p,ring[(i+1)%ring.length]]);
 function segmentDistance(p,a,b){
  const v=delta(a,b),t=Math.max(0,Math.min(1,dot(delta(a,p),v)/(dot(v,v)||1)));
  return Math.hypot(p.x-a.x-t*v.x,p.y-a.y-t*v.y);
 }
 function clearance(p,ring){
  let inside=false,nearest=Infinity;
  for(const [a,b] of edges(ring)){
   nearest=Math.min(nearest,segmentDistance(p,a,b));
   if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
  }
  return inside?nearest:-nearest;
 }
 // Donor roomNesting: use the centroid when it lies inside, else the scanline point with most clearance.
 function interiorPoint(ring){
  const center={x:ring.reduce((s,p)=>s+p.x,0)/ring.length,y:ring.reduce((s,p)=>s+p.y,0)/ring.length};
  if(clearance(center,ring)>1e-7)return center;
  let best=center,bestDistance=-Infinity;
  for(const swap of [false,true]){
   const mapped=swap?ring.map(p=>({x:p.y,y:p.x})):ring;
   const levels=[...new Set(mapped.map(p=>p.y))].sort((a,b)=>a-b);
   for(let i=1;i<levels.length;i++){
    const y=(levels[i-1]+levels[i])/2;
    const xs=edges(mapped).filter(([a,b])=>(a.y>y)!==(b.y>y)).map(([a,b])=>a.x+(b.x-a.x)*(y-a.y)/(b.y-a.y)).sort((a,b)=>a-b);
    for(let j=0;j+1<xs.length;j+=2){
     const x=(xs[j]+xs[j+1])/2,p=swap?{x:y,y:x}:{x,y},d=clearance(p,ring);
     if(d>bestDistance){best=p;bestDistance=d;}
    }
   }
  }
  return best;
 }
 function doors(project){
  const walls=new Map(project.walls.filter(w=>w.status!=='demolished'&&!w.curve).map(w=>[w.id,w]));
  return project.openings.filter(o=>['door','sliding-door'].includes(o.kind)&&walls.has(o.wallId));
 }
 function anchor(project,id){
  const door=doors(project).find(o=>o.id===id);
  if(!door)throw Error('Selecciona una puerta con un muro recto.');
  const wall=project.walls.find(w=>w.id===door.wallId),length=distance(wall.start,wall.end),v=delta(wall.start,wall.end);
  const direction={x:v.x/length,y:v.y/length};
  const at=door.offsetMm+door.widthMm/2;
  const center={x:wall.start.x+direction.x*at,y:wall.start.y+direction.y*at};
  const rooms=project.rooms.filter(r=>Math.abs(clearance(center,r.polygon))<=wall.thicknessMm/2+50);
  if(rooms.length!==1)throw Error('La puerta debe pertenecer a una sola estancia cerrada para identificar el lado libre.');
  return {door,wall,center,direction,inside:interiorPoint(rooms[0].polygon)};
 }
 function wallPolygon(w){return C.wallRect(w).poly.map(([x,y])=>({x,y}));}
 function bounds(ring){
  return {left:Math.min(...ring.map(p=>p.x)),right:Math.max(...ring.map(p=>p.x)),top:Math.min(...ring.map(p=>p.y)),bottom:Math.max(...ring.map(p=>p.y))};
 }
 function boundsOverlap(a,b){return a.right>b.left&&b.right>a.left&&a.bottom>b.top&&b.bottom>a.top;}
 function wallOverlap(a,b){
  return [...edges(a),...edges(b)].every(([p,q])=>{
   const v=delta(p,q),axis={x:-v.y,y:v.x},aa=a.map(r=>dot(r,axis)),bb=b.map(r=>dot(r,axis));
   return Math.min(Math.max(...aa),Math.max(...bb))-Math.max(Math.min(...aa),Math.min(...bb))>Math.hypot(v.x,v.y);
  });
 }
 function roomOverlap(a,b){
  if(a.some(p=>clearance(p,b)>1)||b.some(p=>clearance(p,a)>1)||clearance(interiorPoint(a),b)>1||clearance(interiorPoint(b),a)>1)return true;
  return edges(a).some(([p,q])=>edges(b).some(([r,s])=>{
   const orient=(x,y,z)=>cross(delta(x,y),delta(x,z));
   return orient(p,q,r)*orient(p,q,s)<0&&orient(r,s,p)*orient(r,s,q)<0;
  }));
 }
 function checkOverlap(target,incoming){
  for(const [key,shape,overlap] of [['walls',wallPolygon,wallOverlap],['rooms',r=>r.polygon,roomOverlap]]){
   const fixed=target[key].filter(e=>e.status!=='demolished').map(e=>{const ring=shape(e);return {ring,box:bounds(ring)};});
   for(const entity of incoming[key]){
    const ring=shape(entity),box=bounds(ring);
    if(fixed.some(f=>boundsOverlap(box,f.box)&&overlap(ring,f.ring)))throw Error('La alineación solapa geometría de la planta. Elige otras puertas.');
   }
  }
 }
 function propose(target,scan,{movingId,targetId}){
  C.validate(target);C.validate(scan);
  if(scan.scale.confidence!=='estimated'||scan.sourceImages?.length||Object.keys(scan.extensions||{}).length)throw Error('Selecciona un escaneo RoomPlan de una sola planta.');
  const moving=anchor(scan,movingId),fixed=anchor(target,targetId);
  // Donor doorJoin: mean wall thickness, opposite tangent, then half-turn if the room is on the occupied side.
  const normal={x:-fixed.direction.y,y:fixed.direction.x};
  const sign=dot(delta(fixed.center,fixed.inside),normal)>0?-1:1;
  const outward={x:normal.x*sign,y:normal.y*sign};
  const gap=(moving.wall.thicknessMm+fixed.wall.thicknessMm)/2;
  const landing={x:fixed.center.x+outward.x*gap,y:fixed.center.y+outward.y*gap};
  let angle=Math.atan2(-fixed.direction.y,-fixed.direction.x)-Math.atan2(moving.direction.y,moving.direction.x);
  const move=p=>{const {x,y}=delta(moving.center,p),c=Math.cos(angle),s=Math.sin(angle);return {x:landing.x+x*c-y*s,y:landing.y+x*s+y*c};};
  if(dot(delta(fixed.center,move(moving.inside)),outward)<0)angle+=Math.PI;
  const point=p=>C.point(move(p));
  const incoming=structuredClone(scan),next=structuredClone(target);
  incoming.measurements??=[];next.measurements??=[];
  const ids=new Map(),taken=new Set(Object.keys(listKeys).flatMap(key=>[...next[key],...incoming[key]].map(e=>e.id)));
  for(const [key,prefix] of Object.entries(listKeys)){
   const used=new Set(next[key].map(e=>e.id));
   for(const entity of incoming[key])if(used.has(entity.id)){
    let id=C.id(prefix);while(taken.has(id))id=C.id(prefix);
    taken.add(id);ids.set(entity.id,id);entity.id=id;
   }
  }
  const ref=id=>ids.get(id)||id;
  for(const w of incoming.walls){w.start=point(w.start);w.end=point(w.end);if(w.surfaceMaterialId)w.surfaceMaterialId=ref(w.surfaceMaterialId);}
  for(const o of incoming.openings)o.wallId=ref(o.wallId);
  for(const r of incoming.rooms){r.polygon=r.polygon.map(point);if(r.labelAt)r.labelAt=point(r.labelAt);r.floorMaterialId=ref(r.floorMaterialId);}
  for(const o of incoming.objects){o.position=point(o.position);o.rotationDeg=((o.rotationDeg+Math.round(angle*180/Math.PI))%360+360)%360;if(o.roomId)o.roomId=ref(o.roomId);}
  for(const m of incoming.measurements){m.a=point(m.a);m.b=point(m.b);}
  checkOverlap(target,incoming);
  for(const key of Object.keys(listKeys))next[key].push(...incoming[key]);
  C.raiseVersion(next,scan.schemaVersion);
  const canApply=target.scale.confidence==='estimated'&&!target.scale.calibration&&!target.scale.verification;
  if(canApply)next.scale={...target.scale,note:'Incluye escaneo RoomPlan alineado por puertas. Medidas estimadas; verifica las cotas con referencias independientes.'};
  const widthDifferenceMm=Math.abs(moving.door.widthMm-fixed.door.widthMm);
  const history=next.extensions?.['x-op04-roomplan']?.joins??[];
  if(!Array.isArray(history))throw Error('La planta contiene un historial de uniones incompatible.');
  next.extensions={...next.extensions,'x-op04-roomplan':{joins:[...history,{
   source:'RoomPlan',movingDoorId:ref(movingId),targetDoorId:targetId,wallIds:incoming.walls.map(w=>w.id),gapMm:gap,widthDifferenceMm
  }]}};
  C.validate(next,{strict:true});
  return {project:next,canApply,addedWalls:incoming.walls,reference:point(moving.center),targetReference:fixed.center,gapMm:gap,widthDifferenceMm};
 }
 const api={doors,propose};
 if(typeof module==='object')module.exports=api;else root.FloorPlanScanAlignment=api;
})(typeof globalThis==='object'?globalThis:this);
