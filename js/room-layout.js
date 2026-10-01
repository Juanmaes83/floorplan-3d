/* Conservative rectangular design. Preview is pure; UI owns atomic persistence/history. */
(function(root){
 'use strict';
 const C=typeof module==='object'?require('./project-core.js'):root.FloorPlanCore;
 const T=typeof module==='object'?require('./tracing-core.js'):root.FloorPlanTracing;
 const EPS=0.5,near=(a,b)=>Math.abs(a-b)<EPS,active=w=>w.status!=='demolished';
 const manual=' Usa Plano propio → Seleccionar/editar para ajustar los vértices y muros manualmente.';
 function fail(s){throw Error(s+manual);}
 function dimension(n){if(!Number.isInteger(n)||n<100||n>50000)throw Error('Introduce dimensiones enteras entre 100 y 50000 mm.');return n;}
 function rectangle(r){
  if(!r||r.polygon.length!==4)fail('Solo se pueden dimensionar estancias rectangulares de cuatro vértices.');
  const xs=r.polygon.map(p=>p.x),ys=r.polygon.map(p=>p.y),b={x:Math.min(...xs),y:Math.min(...ys),right:Math.max(...xs),bottom:Math.max(...ys)};
  if(!r.polygon.every((p,i)=>{const q=r.polygon[(i+1)%4];return (near(p.x,b.x)||near(p.x,b.right))&&(near(p.y,b.y)||near(p.y,b.bottom))&&(near(p.x,q.x)!==near(p.y,q.y));})||new Set(r.polygon.map(p=>`${p.x},${p.y}`)).size!==4)fail('La estancia es irregular o diagonal.');
  return {...b,width:b.right-b.x,depth:b.bottom-b.y};
 }
 const sides=b=>[
  {key:'left',axis:'x',at:b.x,lo:b.y,hi:b.bottom,sign:-1},
  {key:'right',axis:'x',at:b.right,lo:b.y,hi:b.bottom,sign:1},
  {key:'top',axis:'y',at:b.y,lo:b.x,hi:b.right,sign:-1},
  {key:'bottom',axis:'y',at:b.bottom,lo:b.x,hi:b.right,sign:1}];
 function matches(w,s){const other=s.axis==='x'?'y':'x';return active(w)&&near(w.start[s.axis],w.end[s.axis])&&near(w.start[s.axis]-s.sign*w.thicknessMm/2,s.at)&&Math.min(w.start[other],w.end[other])<=s.lo+EPS&&Math.max(w.start[other],w.end[other])>=s.hi-EPS;}
 function mapping(p,r){
  const map=sides(rectangle(r)).map(s=>{const found=p.walls.filter(w=>matches(w,s));if(found.length!==1)fail(`El lado ${s.key} no corresponde a un único muro completo por su cara interior.`);return {...s,wall:found[0]};});
  for(const s of map){const other=s.axis==='x'?'y':'x',perpendicular=map.filter(q=>q.axis===other).map(q=>q.wall.start[other]).sort((a,b)=>a-b),ends=[s.wall.start[other],s.wall.end[other]].sort((a,b)=>a-b);if(!ends.every((v,i)=>near(v,perpendicular[i])))fail(`El muro ${s.wall.id} se prolonga más allá de las esquinas de la estancia o no las alcanza.`);}
  return map;
 }
 function touchesRoom(w,r){const axis=near(w.start.x,w.end.x)?'x':'y',other=axis==='x'?'y':'x';return r.polygon.some((a,i)=>{const b=r.polygon[(i+1)%r.polygon.length];return near(a[axis],b[axis])&&near(Math.abs(a[axis]-w.start[axis]),w.thicknessMm/2)&&Math.min(Math.max(a[other],b[other]),Math.max(w.start[other],w.end[other]))-Math.max(Math.min(a[other],b[other]),Math.min(w.start[other],w.end[other]))>EPS;});}

 function inside(poly,p){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)yes=!yes;}return yes;}
 function corners(o){const a=o.rotationDeg*Math.PI/180,c=Math.cos(a),s=Math.sin(a);return [[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>({x:o.position.x+x*o.size.widthMm/2*c-y*o.size.depthMm/2*s,y:o.position.y+x*o.size.widthMm/2*s+y*o.size.depthMm/2*c}));}
 function wallPoly(w){const dx=w.end.x-w.start.x,dy=w.end.y-w.start.y,L=Math.hypot(dx,dy),x=-dy/L*w.thicknessMm/2,y=dx/L*w.thicknessMm/2;return [{x:w.start.x+x,y:w.start.y+y},{x:w.end.x+x,y:w.end.y+y},{x:w.end.x-x,y:w.end.y-y},{x:w.start.x-x,y:w.start.y-y}];}
 // Separating axes: only positive-area overlap counts as a collision; touching is allowed.
 function overlap(a,b){for(const poly of [a,b])for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length],v={x:q.y-p.y,y:p.x-q.x},L=Math.hypot(v.x,v.y);if(!L)continue;const projection=pts=>pts.map(t=>(t.x*v.x+t.y*v.y)/L),aa=projection(a),bb=projection(b);if(Math.min(Math.max(...aa),Math.max(...bb))-Math.max(Math.min(...aa),Math.min(...bb))<=EPS)return false;}return true;}
 function protect(p,next,changedIds,targetId){
  const changed=next.walls.filter(w=>changedIds.includes(w.id)),before=p.walls.filter(w=>changedIds.includes(w.id));
  for(const r of p.rooms.filter(r=>r.id!==targetId)){
   const old=p.rooms.find(q=>q.id===targetId),now=next.rooms.find(q=>q.id===targetId);
   if(now&&overlap(now.polygon,r.polygon)&&(!old||!overlap(old.polygon,r.polygon)))fail(`La distribución invadiría la estancia «${r.name}».`);
   if(changed.some(w=>overlap(wallPoly(w),r.polygon)&&!before.some(q=>q.id===w.id&&overlap(wallPoly(q),r.polygon))))fail(`Un muro invadiría la estancia «${r.name}».`);
  }
  for(const o of p.objects){const pts=corners(o),oldRoom=p.rooms.find(r=>r.id===o.roomId||r.id===targetId&&pts.every(t=>inside(r.polygon,t))),newRoom=next.rooms.find(r=>r.id===oldRoom?.id);
   if(newRoom&&pts.every(t=>inside(oldRoom.polygon,t))&&!pts.every(t=>inside(newRoom.polygon,t)))fail(`El mueble «${o.name}» quedaría fuera de su estancia. Muévelo primero.`);
   if(changed.some(w=>overlap(wallPoly(w),pts)&&!before.some(q=>q.id===w.id&&overlap(wallPoly(q),pts))))fail(`El muro colisionaría con el mueble «${o.name}». Muévelo primero.`);
  }
  for(const w of changed)for(const other of p.walls.filter(q=>active(q)&&!changedIds.includes(q.id))){if(overlap(wallPoly(w),wallPoly(other))&&!['start','end'].some(a=>['start','end'].some(b=>near(w[a].x,other[b].x)&&near(w[a].y,other[b].y)))&&!before.some(q=>q.id===w.id&&overlap(wallPoly(q),wallPoly(other))))fail(`El cambio cruzaría otro muro (${other.id}).`);}
 }
 function create(p,{name,width,depth,x=0,y=0,neighborId,side='right'}){
  width=dimension(width);depth=dimension(depth);name=String(name||'').trim();if(!name||name.length>120)throw Error('Nombre de estancia: entre 1 y 120 caracteres.');
  const next=C.clone(p),t=p.defaults.wallThicknessMm;if(t%2)fail('El grosor impar del muro no permite situar caras interiores en milímetros enteros.');
  let shared;
  if(neighborId){const r=p.rooms.find(r=>r.id===neighborId),b=rectangle(r),map=mapping(p,r);shared=map.find(s=>s.key===side);if(!shared||!['right','bottom'].includes(side))fail('Selecciona un lado de unión válido.');
   if(shared.wall.thicknessMm!==t)fail('Los grosores de los muros de unión son diferentes.');
   if(side==='right'){if(depth!==b.depth)fail('Para compartir este muro, la profundidad debe coincidir con la de la estancia vecina.');x=b.right+t;y=b.y;}
   else{if(width!==b.width)fail('Para compartir este muro, el ancho debe coincidir con el de la estancia vecina.');x=b.x;y=b.bottom+t;}
  }
  if(!Number.isInteger(x)||!Number.isInteger(y))throw Error('X e Y deben ser milímetros enteros.');
  const ax=x-t/2,ay=y-t/2,bx=x+width+t/2,by=y+depth+t/2;
  const vertices=[{x,y},{x:x+width,y},{x:x+width,y:y+depth},{x,y:y+depth}],axes=[[{x:ax,y:ay},{x:ax,y:by}],[{x:bx,y:ay},{x:bx,y:by}],[{x:ax,y:ay},{x:bx,y:ay}],[{x:ax,y:by},{x:bx,y:by}]];
  const added=[];
  for(const [a,b]of axes){const equal=w=>[w.start,w.end].some(q=>near(q.x,a.x)&&near(q.y,a.y))&&[w.start,w.end].some(q=>near(q.x,b.x)&&near(q.y,b.y));
   if(shared&&equal(shared.wall))continue;
   if(p.walls.some(w=>active(w)&&equal(w)))fail('Hay un muro existente ambiguo en la nueva estancia.');
   const w=T.wall(next,a,b);added.push(w.id);
  }
  const r=T.room(next,vertices,name);if(shared&&added.length!==3)fail('La pared compartida no coincide exactamente con sus extremos.');
  protect(p,next,added,r.id);C.validate(next);
  return {project:next,roomId:r.id,impact:[`Nueva estancia «${name}»: ${width} × ${depth} mm interiores; ${(width*depth/1e6).toFixed(2)} m².`,`${added.length} muros nuevos${shared?'; un muro existente compartido':''}. Las demás entidades se conservan.`],requiresOpenings:false};
 }
 function resize(p,{roomId,axis,value,fixed}){
  const r=p.rooms.find(r=>r.id===roomId),b=rectangle(r);value=dimension(value);
  if(!['width','depth'].includes(axis)||!(['width'].includes(axis)?['left','right']:['top','bottom']).includes(fixed))throw Error('Elige la dimensión y el lado que permanece fijo.');
  const map=mapping(p,r),moving=map.find(s=>s.key===({left:'right',right:'left',top:'bottom',bottom:'top'})[fixed]),delta=(value-b[axis])*moving.sign;
  if(!delta)throw Error('Introduce una medida diferente para previsualizar el cambio.');
  const coord=moving.axis,other=coord==='x'?'y':'x',oldAt=moving.wall.start[coord],newAt=oldAt+delta;
  const next=C.clone(p),nr=next.rooms.find(q=>q.id===roomId),changedIds=[],impact=[];
  for(const pt of nr.polygon)if(near(pt[coord],moving.at))pt[coord]+=delta;
  // Preserve label unless it would leave the room; relocation is explicitly listed in preview.
  if(nr.labelAt&&!inside(nr.polygon,nr.labelAt)){const n=rectangle(nr);nr.labelAt={x:Math.round((n.x+n.right)/2),y:Math.round((n.y+n.bottom)/2)};impact.push('La etiqueta se recentrará dentro de la estancia.');}
  for(const side of map){const w=next.walls.find(q=>q.id===side.wall.id);if(side.key===moving.key){w.start[coord]+=delta;w.end[coord]+=delta;}else if(side.axis!==coord){const ends=['start','end'].filter(key=>near(w[key][coord],oldAt));if(ends.length!==1)fail(`Los extremos del muro ${w.id} no forman una esquina inequívoca.`);w[ends[0]][coord]=newAt;}
   if(JSON.stringify(w)!==JSON.stringify(side.wall)){changedIds.push(w.id);
    for(const neighbor of p.rooms.filter(q=>q.id!==roomId))if(touchesRoom(side.wall,neighbor))fail(`El cambio modificaría un muro de la estancia vecina «${neighbor.name}». Mantén fijo el lado compartido o edita manualmente.`);
    for(const q of p.walls.filter(q=>active(q)&&!map.some(s=>s.wall.id===q.id)))for(const old of [side.wall.start,side.wall.end]){const changedEndpoint=!['start','end'].some(k=>near(w[k].x,old.x)&&near(w[k].y,old.y));if(changedEndpoint&&[q.start,q.end].some(pt=>near(pt.x,old.x)&&near(pt.y,old.y)))fail(`La esquina está conectada a otro muro (${q.id}).`);}
   }
  }
  let requiresOpenings=false;
  for(const o of next.openings.filter(o=>changedIds.includes(o.wallId))){const old=p.walls.find(w=>w.id===o.wallId),w=next.walls.find(w=>w.id===o.wallId),len=Math.hypot(w.end.x-w.start.x,w.end.y-w.start.y),oldLen=Math.hypot(old.end.x-old.start.x,old.end.y-old.start.y);
   if(o.wallId===moving.wall.id){requiresOpenings=true;impact.push(`${o.kind==='door'?'Puerta':'Ventana'} ${o.id}: se moverá ${delta} mm con su muro; conserva medidas y posición relativa.`);}
   else{const world={x:old.start.x+(old.end.x-old.start.x)*o.offsetMm/oldLen,y:old.start.y+(old.end.y-old.start.y)*o.offsetMm/oldLen};const offset=Math.round(((world.x-w.start.x)*(w.end.x-w.start.x)+(world.y-w.start.y)*(w.end.y-w.start.y))/len);
    if(offset<0||offset+o.widthMm>len)fail(`El hueco ${o.id} quedaría fuera del muro. Reubícalo primero.`);if(offset!==o.offsetMm){impact.push(`Hueco ${o.id}: conserva su posición física; offset ${o.offsetMm} → ${offset} mm.`);o.offsetMm=offset;}
   }
  }
  for(const m of p.measurements||[])for(const point of [m.a,m.b]){const n=rectangle(nr),oldInside=point.x>=b.x&&point.x<=b.right&&point.y>=b.y&&point.y<=b.bottom,newInside=point.x>=n.x&&point.x<=n.right&&point.y>=n.y&&point.y<=n.bottom;
   if((near(point[coord],moving.at)||near(point[coord],oldAt))&&point[other]>=Math.min(moving.wall.start[other],moving.wall.end[other])&&point[other]<=Math.max(moving.wall.start[other],moving.wall.end[other])||oldInside!==newInside)fail(`La cota ${m.id} puede quedar desactualizada. Corrígela o elimínala manualmente antes de dimensionar.`);
  }
  protect(p,next,changedIds,r.id);C.validate(next);
  impact.unshift(`«${r.name}»: ${axis==='width'?'ancho':'profundidad'} ${b[axis]} → ${value} mm interiores. Lado fijo: ${{left:'izquierdo',right:'derecho',top:'superior',bottom:'inferior'}[fixed]}. Área: ${(rectangle(nr).width*rectangle(nr).depth/1e6).toFixed(2)} m².`,`${changedIds.length} muros ajustados conservando sus IDs. Muebles, cotas, imagen y escala permanecen en sus coordenadas.`);
  return {project:next,roomId:r.id,impact,requiresOpenings};
 }
 function blank(name){const p=T.blank(name);p.schemaVersion='1.3.0';C.validate(p);return p;}
 const API={blank,rectangle,mapping,create,resize};if(typeof module==='object')module.exports=API;else root.FloorPlanRoomLayout=API;
})(typeof globalThis==='object'?globalThis:this);
