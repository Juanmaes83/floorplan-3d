(function(root){
 'use strict';
 const inside=(poly,x,y)=>{let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;};
 const inRect=(rect,x,y,pad=0)=>{const dx=x-rect.center[0],dy=y-rect.center[1],c=Math.cos(rect.angle),s=Math.sin(rect.angle);return Math.abs(dx*c+dy*s)<rect.spanMm/2+pad&&Math.abs(-dx*s+dy*c)<rect.thickness/2+pad;};
 const furnitureBlocks=(o,x,y,pad)=>{if(o.type==='rug')return false;const dx=x-o.position.x,dy=y-o.position.y,a=(o.rotationDeg||0)*Math.PI/180,c=Math.cos(a),s=Math.sin(a);return Math.abs(dx*c+dy*s)<o.size.widthMm/2+pad&&Math.abs(-dx*s+dy*c)<o.size.depthMm/2+pad;};
 const center=room=>{if(room.at&&inside(room.poly,...room.at))return room.at;const xs=room.poly.map(p=>p[0]),ys=room.poly.map(p=>p[1]),box=[(Math.min(...xs)+Math.max(...xs))/2,(Math.min(...ys)+Math.max(...ys))/2];return inside(room.poly,...box)?box:room.poly[0];};
 function plan(project,geometry,roomId,options={}){
  const room=geometry?.rooms?.find(r=>r.id===roomId&&r.poly.length>=3),door=geometry?.doors?.find(d=>d.entry);
  if(!room)return{kind:'unavailable',code:'no_room',reason:'Estancia sin polígono válido.'};
  if(!door)return{kind:'unavailable',code:'no_entry',reason:'No hay puerta de entrada identificada.'};
  if(door.height!==undefined&&door.height<1.85)return{kind:'unavailable',code:'low_entry',reason:'La entrada es demasiado baja para el recorrido.'};
  const target=center(room),origin=door.rect.center,cell=options.cellMm||200,clearance=options.clearanceMm||220;
  const env=geometry.envelope,cols=Math.ceil(env.w/cell)+1,rows=Math.ceil(env.h/cell)+1,total=cols*rows,maxCells=options.maxCells||12000;
  const aerial=(code,reason)=>({kind:'aerial',code,reason,points:[{x:origin[0],y:origin[1]},{x:target[0],y:target[1]}],clearanceMm:clearance,visited:0,doorIds:[]});
  if(total>maxCells)return aerial('budget','La búsqueda interior supera el presupuesto; recorrido aéreo.');
  const walls=[...geometry.walls.filter(w=>w.status!=='demolished'),...geometry.windows,...geometry.slides.map(d=>d.rect),...geometry.doors.filter(d=>d.height!==undefined&&d.height<1.85).map(d=>d.rect)];
  const rooms=geometry.rooms.filter(r=>r.counted!==false&&r.poly.length>=3),objects=project.objects||[];
  const x0=env.x,y0=env.y,xy=id=>({x:x0+(id%cols)*cell,y:y0+Math.floor(id/cols)*cell}),memo=new Int8Array(total);
  const walkArea=(x,y)=>rooms.some(r=>inside(r.poly,x,y))||geometry.doors.some(d=>(d.height===undefined||d.height>=1.85)&&inRect(d.rect,x,y,80));
  const openPoint=(x,y)=>walkArea(x,y)&&!walls.some(w=>inRect(w,x,y,clearance))&&!objects.some(o=>furnitureBlocks(o,x,y,clearance));
  const free=id=>{if(memo[id])return memo[id]===1;const p=xy(id),safe=openPoint(p.x,p.y);memo[id]=safe?1:-1;return safe;};
  const nearest=(at,limit,withinRoom)=>{let best=-1,dist=Infinity;for(let id=0;id<total;id++){const p=xy(id),d=Math.hypot(p.x-at[0],p.y-at[1]);if(d>limit||d>=dist||withinRoom&&!inside(withinRoom.poly,p.x,p.y)||!free(id))continue;best=id;dist=d;}return best;};
  const start=nearest(origin,1200,null),goal=nearest(target,Math.max(1800,Math.hypot(env.w,env.h)),room);
  if(start<0||goal<0)return aerial('no_free','No hay espacio libre junto a la entrada o dentro de la estancia; recorrido aéreo.');
  const previous=new Int32Array(total).fill(-1),queue=new Int32Array(total),seen=new Uint8Array(total);let head=0,tail=0,visited=0;
  queue[tail++]=start;seen[start]=1;
  while(head<tail&&visited<maxCells){const id=queue[head++];visited++;if(id===goal)break;const col=id%cols,row=Math.floor(id/cols);
   for(const next of [col>0?id-1:-1,col<cols-1?id+1:-1,row>0?id-cols:-1,row<rows-1?id+cols:-1]){if(next<0||seen[next]||!free(next))continue;seen[next]=1;previous[next]=id;queue[tail++]=next;}
  }
  if(!seen[goal]){const result=aerial('obstructed','Los muros, puertas o muebles impiden una ruta interior segura; recorrido aéreo.');result.visited=visited;return result;}
  const ids=[];for(let id=goal;id>=0;id=previous[id]){ids.push(id);if(id===start)break;}ids.reverse();
  const safeSegment=(a,b)=>{const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/80));for(let i=0;i<=n;i++){const t=i/n;if(!openPoint(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t))return false;}return true;};
  const raw=ids.map(xy),points=[raw[0]];for(let at=0;at<raw.length-1;){let next=at+1;for(let i=raw.length-1;i>next;i--){if(safeSegment(raw[at],raw[i])){next=i;break;}}points.push(raw[next]);at=next;}
  if(points.some((p,i)=>i&& !safeSegment(points[i-1],p)))return aerial('interpolation','La interpolación no conserva el margen de paso; recorrido aéreo.');
  const doorIds=geometry.doors.filter(d=>points.some((p,i)=>i&&Array.from({length:Math.ceil(Math.hypot(p.x-points[i-1].x,p.y-points[i-1].y)/80)+1},(_,k)=>{const n=Math.max(1,Math.ceil(Math.hypot(p.x-points[i-1].x,p.y-points[i-1].y)/80)),t=k/n;return inRect(d.rect,points[i-1].x+(p.x-points[i-1].x)*t,points[i-1].y+(p.y-points[i-1].y)*t,20);}).some(Boolean))).map(d=>d.id);
  return{kind:'interior',code:'clear',reason:'Ruta interior libre de obstáculos.',points,clearanceMm:clearance,visited,doorIds,lengthMm:points.reduce((sum,p,i)=>i?sum+Math.hypot(p.x-points[i-1].x,p.y-points[i-1].y):0,0)};
 }
 const api={plan};if(typeof module!=='undefined')module.exports=api;else root.FloorPlanPresentationRoute=api;
})(globalThis);
