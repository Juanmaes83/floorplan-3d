/* Free-place search for one piece of furniture in plan (mm). Pure and deterministic: no DOM, storage or time-based
   limits. A pose is valid only when the full oriented footprint (FloorPlanTracing.footprint) lies inside ONE room
   and does not penetrate (> toleranceMm, separating axes of FloorPlanLayoutReview) any stair zone given by the
   caller, active wall, documented door swing (the square swept by the leaf) or other furniture. Floor coverings
   and wall-hung items do not block, as in the layout review. Height, clearance and passage are NOT evaluated. */
(function(root){
 const node=typeof module==='object';
 const C=node?require('./project-core.js'):root.FloorPlanCore,T=node?require('./tracing-core.js'):root.FloorPlanTracing,R=node?require('./layout-review.js'):root.FloorPlanLayoutReview;
 const TOLERANCE_MM=1,STEP_MM=50,MAX_CANDIDATES=4000,NON_BLOCKING=new Set(['rug','acwall']);
 const finite=o=>o&&o.position&&o.size&&[o.position.x,o.position.y,o.size.widthMm,o.size.depthMm,o.rotationDeg].every(Number.isFinite)&&o.size.widthMm>0&&o.size.depthMm>0;
 function inPoly(p,P){let inside=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;}return inside;}
 // Distance from p to segment ab, to accept points lying on a room edge (a footprint flush against a wall face).
 function segDist(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,L=dx*dx+dy*dy,t=L?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/L)):0;return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}
 const onOrIn=(p,P,tol)=>inPoly(p,P)||P.some((v,i)=>segDist(p,v,P[(i+1)%P.length])<=tol);
 function crosses(a,b,c,d){const o=(p,q,r)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x),d1=o(a,b,c),d2=o(a,b,d),d3=o(c,d,a),d4=o(c,d,b);return d1*d2<-1e-6&&d3*d4<-1e-6;}
 // The footprint is inside the room polygon (also concave ones): corners on or inside, no room vertex strictly
 // inside the footprint and no proper edge crossing.
 function within(fp,room,tol,rect){
  if(rect)return fp.every(p=>p.x>=rect[0]-tol&&p.x<=rect[2]+tol&&p.y>=rect[1]-tol&&p.y<=rect[3]+tol);
  if(!fp.every(p=>onOrIn(p,room,tol)))return false;
  if(room.some(v=>inPoly(v,fp)&&!fp.some((a,i)=>segDist(v,a,fp[(i+1)%fp.length])<=tol)))return false;
  for(let i=0;i<fp.length;i++)for(let j=0;j<room.length;j++)if(crosses(fp[i],fp[(i+1)%fp.length],room[j],room[(j+1)%room.length]))return false;
  return true;
 }
 const pts=P=>P.map(([x,y])=>({x,y}));
 const box=P=>{let a=Infinity,b=Infinity,c=-Infinity,d=-Infinity;for(const p of P){if(p.x<a)a=p.x;if(p.y<b)b=p.y;if(p.x>c)c=p.x;if(p.y>d)d=p.y;}return [a,b,c,d];};
 // Separating-axis test only when the bounding boxes overlap by more than the tolerance (cheap rejection first).
 const hit=(fp,fb,item,tol)=>fb[0]<item.box[2]-tol&&item.box[0]<fb[2]-tol&&fb[1]<item.box[3]-tol&&item.box[1]<fb[3]-tol&&R.penetration(fp,item.poly)>tol;
 const axisRect=P=>P.length===4&&P.every((p,i)=>{const q=P[(i+1)%4];return p.x===q.x||p.y===q.y;});
 // Everything a pose is checked against, derived once from the project.
 function scene(project,{zones=[],ignoreIds=[]}={}){
  const g=C.geometry(project),sc={
   rooms:g.rooms.map(r=>{const poly=pts(r.poly);return {id:r.id,name:r.name,poly,rect:axisRect(poly)?box(poly):null};}),
   walls:g.walls.filter(w=>w.status!=='demolished').map(w=>({id:w.id,poly:pts(w.poly)})),
   doors:g.doors.map(d=>{const [hx,hy]=d.h,L=d.len;return {id:d.id,poly:[[0,0],[1,0],[1,1],[0,1]].map(([u,v])=>({x:hx+(d.o[0]*u+d.c[0]*v)*L,y:hy+(d.o[1]*u+d.c[1]*v)*L}))};}),
   zones:zones.map((z,i)=>({id:z.stairId||`zone-${i}`,kind:z.kind,poly:z.polygon||z})),
   furniture:(project.objects||[]).filter(o=>finite(o)&&!ignoreIds.includes(o.id)&&!NON_BLOCKING.has(o.type)).map(o=>({id:o.id,name:o.name||o.type,type:o.type,poly:T.footprint(o)}))
  };
  for(const k of ['walls','doors','zones','furniture'])for(const item of sc[k])item.box=box(item.poly);
  return sc;
 }
 // Rooms that contain a point (the place a person asked for, or the object's own position).
 const roomsAt=(sc,p)=>sc.rooms.filter(r=>inPoly(p,r.poly));
 // Problems of `object` at its pose in a prepared scene, inside `roomId` (when given).
 // With `first`, stops at the first problem (cheapest checks first): used by the search, which needs validity only.
 function problemsIn(sc,object,roomId,tol=TOLERANCE_MM,first=false){
  if(!finite(object))return [{kind:'geometry',detail:'Posición, tamaño o giro no válidos.'}];
  const fp=T.footprint(object),fb=box(fp),out=[],self=object.id,add=p=>{out.push(p);return first;};
  const room=sc.rooms.find(r=>r.id===roomId);if(!room){if(add({kind:'room',detail:'Sin una estancia atribuible.'}))return out;}else if(!within(fp,room.poly,tol,room.rect)&&add({kind:'room',id:room.id,detail:`Sale de «${room.name}».`}))return out;
  for(const z of sc.zones)if(hit(fp,fb,z,tol)&&add({kind:'stair',id:z.id,detail:z.kind==='hueco'?'Pisa el hueco de la escalera.':'Pisa los peldaños.'}))return out;
  for(const w of sc.walls)if(hit(fp,fb,w,tol)&&add({kind:'wall',id:w.id,detail:'Atraviesa un muro.'}))return out;
  if(!NON_BLOCKING.has(object.type)){
   for(const d of sc.doors)if(hit(fp,fb,d,tol)&&add({kind:'door',id:d.id,detail:'Invade el barrido de una puerta.'}))return out;
   // Stacking by design (a hob or sink set into a worktop) is not an overlap, exactly as in the layout review.
   for(const f of sc.furniture)if(f.id!==self&&!R.exclusion(object,f)&&hit(fp,fb,f,tol)&&add({kind:'furniture',id:f.id,detail:`Solapa «${f.name}».`}))return out;
  }
  return out;
 }
 function problems(project,object,options={}){const sc=scene(project,options),rooms=roomsAt(sc,object.position||{x:NaN,y:NaN});
  if(rooms.length!==1)return [{kind:'room',detail:rooms.length?'Más de una estancia contiene su posición: atribución ambigua.':'Sin una estancia atribuible.'}];
  return problemsIn(sc,object,rooms[0].id,options.toleranceMm);}
 // Candidates ordered by ring (Chebyshev distance on a `stepMm` grid around `near`), then by exact distance and
 // angle inside each ring: deterministic, generated lazily so the search stops as soon as its budget is spent.
 function* candidates(near,stepMm,maxRadius){
  for(let k=0;k*stepMm<=maxRadius;k++){const ring=[];
   if(k===0)ring.push({x:near.x,y:near.y});
   else{for(let i=-k;i<=k;i++)ring.push({x:near.x+i*stepMm,y:near.y-k*stepMm},{x:near.x+i*stepMm,y:near.y+k*stepMm});
    for(let j=-k+1;j<k;j++)ring.push({x:near.x-k*stepMm,y:near.y+j*stepMm},{x:near.x+k*stepMm,y:near.y+j*stepMm});}
   ring.sort((a,b)=>Math.hypot(a.x-near.x,a.y-near.y)-Math.hypot(b.x-near.x,b.y-near.y)||Math.atan2(a.y-near.y,a.x-near.x)-Math.atan2(b.y-near.y,b.x-near.x));
   yield* ring;
  }
 }
 const KIND_TEXT={stair:'la escalera o su hueco',wall:'los muros',door:'el barrido de las puertas',furniture:'otros muebles',room:'los límites de la estancia'};
 /* Nearest valid pose for `object` (same size, rotation and id) in the single room containing `near`. Returns
    {ok:true,position,roomId,distanceMm,tried} or {ok:false,reason,message,tried,blockers}; reasons: 'geometry',
    'no-room', 'ambiguous-room', 'no-space'. Positions are integer mm, as the 1.x contract requires. */
 function find(project,object,{near=object.position,zones=[],ignoreIds=[],stepMm=STEP_MM,maxCandidates=MAX_CANDIDATES,toleranceMm=TOLERANCE_MM}={}){
  if(!finite(object))return {ok:false,reason:'geometry',message:'El mueble no tiene posición, tamaño o giro válidos.',tried:0,blockers:{}};
  const sc=scene(project,{zones,ignoreIds:[...ignoreIds,object.id]}),rooms=roomsAt(sc,near);
  if(!rooms.length)return {ok:false,reason:'no-room',message:'El punto elegido no está dentro de ninguna estancia.',tried:0,blockers:{}};
  if(rooms.length>1)return {ok:false,reason:'ambiguous-room',message:'El punto elegido pertenece a más de una estancia: no se puede atribuir el mueble con certeza.',tried:0,blockers:{}};
  const room=rooms[0],xs=room.poly.map(p=>p.x),ys=room.poly.map(p=>p.y),maxRadius=Math.hypot(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys));
  // A centre can only be valid when the footprint's bounding box fits the room's: other candidates are not counted.
  const fp0=T.footprint({...object,position:{x:0,y:0}}),hx=Math.max(...fp0.map(p=>Math.abs(p.x))),hy=Math.max(...fp0.map(p=>Math.abs(p.y)));
  const fits=c=>c.x-hx>=Math.min(...xs)-toleranceMm&&c.x+hx<=Math.max(...xs)+toleranceMm&&c.y-hy>=Math.min(...ys)-toleranceMm&&c.y+hy<=Math.max(...ys)+toleranceMm;
  const blockers={};let tried=0;
  for(const c of candidates({x:Math.round(near.x),y:Math.round(near.y)},stepMm,maxRadius)){
   if(!fits(c))continue;if(tried>=maxCandidates)break;
   tried++;const pose={...object,position:{x:Math.round(c.x),y:Math.round(c.y)}},list=problemsIn(sc,pose,room.id,toleranceMm,true);
   if(!list.length)return {ok:true,position:pose.position,roomId:room.id,roomName:room.name,distanceMm:Math.round(Math.hypot(pose.position.x-object.position.x,pose.position.y-object.position.y)),tried};
   for(const p of list)blockers[p.kind]=(blockers[p.kind]||0)+1;
  }
  const main=Object.entries(blockers).filter(([k])=>k!=='room').sort((a,b)=>b[1]-a[1]).map(([k])=>KIND_TEXT[k]).filter(Boolean);
  return {ok:false,reason:'no-space',roomId:room.id,roomName:room.name,tried,blockers,
   message:`No hay sitio libre para «${object.name||object.type}» en «${room.name}» sin pisar ${main.length?main.slice(0,3).join(', '):'los límites de la estancia'}. Elige otra estancia o haz sitio antes de colocarlo.`};
 }
 /* «Buscar sitio libre» for EXISTING furniture (proposal only, never applied here). Objects are proposed in the order
    given, each one against the layout that already includes the previous proposals, so the set is compatible by
    construction; the whole set is then validated again. Size, rotation and id are kept. Returns {moves:[{id,name,
    from,to,distanceMm,roomId,roomName,tried}],failed:[{id,name,reason,message}],valid,project} where `project` is a
    copy with the moves applied (the caller decides whether to apply it). */
 function proposeSet(project,ids,{zones=[],stepMm=STEP_MM,maxCandidates=MAX_CANDIDATES,toleranceMm=TOLERANCE_MM}={}){
  const work=C.clone(project),moves=[],failed=[];
  for(const id of ids){const o=(work.objects||[]).find(x=>x.id===id);if(!o){failed.push({id,name:id,reason:'missing',message:'El mueble ya no existe.'});continue;}
   const r=find(work,o,{near:o.position,zones,stepMm,maxCandidates,toleranceMm});
   if(!r.ok){failed.push({id,name:o.name||o.type,reason:r.reason,message:r.reason==='no-space'?`No se ha encontrado sitio libre para «${o.name||o.type}» en «${r.roomName}» dentro del límite de búsqueda (${r.tried} posiciones). Corrígelo a mano: muévelo a otra estancia, haz sitio o edita la escalera.`:r.message});continue;}
   const from={...o.position};o.position={...r.position};moves.push({id,name:o.name||o.type,from,to:{...r.position},distanceMm:r.distanceMm,roomId:r.roomId,roomName:r.roomName,tried:r.tried});
  }
  const sc=scene(work,{zones}),valid=moves.every(m=>{const o=work.objects.find(x=>x.id===m.id);return problemsIn(sc,o,m.roomId,toleranceMm).length===0;});
  return {moves,failed,valid,project:work};
 }
 // What the search checks and what it does not, for the proposal panel.
 const CHECKED=['la estancia completa','la escalera y su hueco','los muros','el barrido de las puertas','otros muebles'],NOT_CHECKED=['altura libre','paso o recorrido','normativa','muebles en otras plantas'];
 const api={TOLERANCE_MM,STEP_MM,MAX_CANDIDATES,CHECKED,NOT_CHECKED,scene,roomsAt,problems,problemsIn,find,candidates,proposeSet};
 if(node)module.exports=api;else root.FloorPlanPlacement=api;
})(globalThis);
