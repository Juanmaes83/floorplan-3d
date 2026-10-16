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
  // The search grid follows the dominant wall direction (length-weighted, modulo 90°), so rotated plans keep
  // door openings aligned with cells. An axis-aligned plan gets angle 0 and the original grid.
  const bins=new Float64Array(90);for(const w of geometry.walls){if(w.status==='demolished'||!w.spanMm)continue;const deg=((Math.round((w.angle||0)*180/Math.PI)%90)+90)%90;bins[deg]+=w.spanMm;}
  const theta=bins.indexOf(Math.max(...bins))*Math.PI/180,gc=Math.cos(theta),gs=Math.sin(theta),env0=geometry.envelope,ox=env0.x+env0.w/2,oy=env0.y+env0.h/2;
  const corners=[[env0.x,env0.y],[env0.x+env0.w,env0.y],[env0.x,env0.y+env0.h],[env0.x+env0.w,env0.y+env0.h]].map(([x,y])=>[(x-ox)*gc+(y-oy)*gs,-(x-ox)*gs+(y-oy)*gc]);
  const lx0=Math.min(...corners.map(c=>c[0])),ly0=Math.min(...corners.map(c=>c[1]));
  const env={x:lx0,y:ly0,w:Math.max(...corners.map(c=>c[0]))-lx0,h:Math.max(...corners.map(c=>c[1]))-ly0},cols=Math.ceil(env.w/cell)+1,rows=Math.ceil(env.h/cell)+1,total=cols*rows,maxCells=options.maxCells||12000;
  const aerial=(code,reason)=>({kind:'aerial',code,reason,points:[{x:origin[0],y:origin[1]},{x:target[0],y:target[1]}],clearanceMm:clearance,visited:0,doorIds:[]});
  if(total>maxCells)return aerial('budget','La búsqueda interior supera el presupuesto; recorrido aéreo.');
  const walls=[...geometry.walls.filter(w=>w.status!=='demolished'),...geometry.windows,...geometry.slides.map(d=>d.rect),...geometry.doors.filter(d=>d.height!==undefined&&d.height<1.85).map(d=>d.rect)];
  const rooms=geometry.rooms.filter(r=>r.counted!==false&&r.poly.length>=3),objects=project.objects||[];
  const x0=env.x,y0=env.y,xy=id=>{const u=x0+(id%cols)*cell,v=y0+Math.floor(id/cols)*cell;return {x:ox+u*gc-v*gs,y:oy+u*gs+v*gc};},memo=new Int8Array(total);
  const walkArea=(x,y)=>rooms.some(r=>inside(r.poly,x,y))||geometry.doors.some(d=>(d.height===undefined||d.height>=1.85)&&inRect(d.rect,x,y,80));
  const openAt=(x,y,c)=>walkArea(x,y)&&!walls.some(w=>inRect(w,x,y,c))&&!objects.some(o=>furnitureBlocks(o,x,y,c));
  const openPoint=(x,y)=>openAt(x,y,clearance);
  const free=id=>{if(memo[id])return memo[id]===1;const p=xy(id),safe=openPoint(p.x,p.y);memo[id]=safe?1:-1;return safe;};
  const nearest=(at,limit,withinRoom)=>{let best=-1,dist=Infinity;for(let id=0;id<total;id++){const p=xy(id),d=Math.hypot(p.x-at[0],p.y-at[1]);if(d>limit||d>=dist||withinRoom&&!inside(withinRoom.poly,p.x,p.y)||!free(id))continue;best=id;dist=d;}return best;};
  const start=nearest(origin,1200,null),goal=nearest(target,Math.max(1800,Math.hypot(env.w,env.h)),room);
  if(start<0||goal<0)return aerial('no_free','No hay espacio libre junto a la entrada o dentro de la estancia; recorrido aéreo.');
  // Dijkstra on an 8-connected grid; steps near obstacles cost more, so the walk keeps to the middle of rooms
  // and corridors like a person would. The hard margin is still `clearance` on every cell.
  const wide=options.comfortMm||450,mid=(clearance+wide)/2,comfort=new Int8Array(total).fill(-1);
  const stepCost=id=>{if(comfort[id]<0){const p=xy(id);comfort[id]=openAt(p.x,p.y,wide)?2:openAt(p.x,p.y,mid)?1:0;}return [3,1.6,1][comfort[id]];};
  const previous=new Int32Array(total).fill(-1),dist=new Float64Array(total).fill(Infinity),done=new Uint8Array(total),heap=[];let visited=0;
  const push=(id,d)=>{heap.push([d,id]);let i=heap.length-1;while(i>0){const j=(i-1)>>1;if(heap[j][0]<=heap[i][0])break;[heap[i],heap[j]]=[heap[j],heap[i]];i=j;}};
  const pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let i=0;for(;;){const l=2*i+1,r=l+1;let m=i;if(l<heap.length&&heap[l][0]<heap[m][0])m=l;if(r<heap.length&&heap[r][0]<heap[m][0])m=r;if(m===i)break;[heap[i],heap[m]]=[heap[m],heap[i]];i=m;}}return top;};
  dist[start]=0;push(start,0);
  while(heap.length&&visited<maxCells){const [d,id]=pop();if(done[id])continue;done[id]=1;visited++;if(id===goal)break;const col=id%cols,row=Math.floor(id/cols);
   for(const [dc,dr] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const c=col+dc,r=row+dr;if(c<0||c>=cols||r<0||r>=rows)continue;const next=r*cols+c;
    if(done[next]||!free(next))continue;if(dc&&dr&&(!free(row*cols+c)||!free(r*cols+col)))continue;
    const nd=d+(dc&&dr?Math.SQRT2:1)*(stepCost(id)+stepCost(next))/2;if(nd<dist[next]){dist[next]=nd;previous[next]=id;push(next,nd);}}
  }
  const seen=done;
  const ids=[];for(let id=goal;id>=0;id=previous[id]){ids.push(id);if(id===start)break;}ids.reverse();
  if(ids[0]!==start||ids.length<2){const result=aerial('obstructed','Los muros, puertas o muebles impiden una ruta interior segura; recorrido aéreo.');result.visited=visited;return result;}
  // 40 mm sampling bounds any undetected intrusion into the clearance margin at 20 mm.
  const safeSegment=(a,b)=>{const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/40));for(let i=0;i<=n;i++){const t=i/n;if(!openPoint(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t))return false;}return true;};
  // Shortcuts keep the comfortable margin where the raw path had it; narrow passages fall back to `clearance`.
  const wideSegment=(a,b)=>{const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/40));for(let i=0;i<=n;i++){const t=i/n;if(!openAt(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,wide))return false;}return true;};
  const raw=ids.map(xy),points=[raw[0]];
  for(let at=0;at<raw.length-1;){let next=at+1;const roomy=comfort[ids[at]]===2;
   for(let i=raw.length-1;i>next;i--){if(roomy&&comfort[ids[i]]===2?wideSegment(raw[at],raw[i]):(!roomy||comfort[ids[i]]!==2)&&safeSegment(raw[at],raw[i])&&i-at<=Math.ceil(1200/cell)){next=i;break;}}
   points.push(raw[next]);at=next;}
  if(points.some((p,i)=>i&& !safeSegment(points[i-1],p)))return aerial('interpolation','La interpolación no conserva el margen de paso; recorrido aéreo.');
  const doorIds=geometry.doors.filter(d=>points.some((p,i)=>i&&Array.from({length:Math.ceil(Math.hypot(p.x-points[i-1].x,p.y-points[i-1].y)/80)+1},(_,k)=>{const n=Math.max(1,Math.ceil(Math.hypot(p.x-points[i-1].x,p.y-points[i-1].y)/80)),t=k/n;return inRect(d.rect,points[i-1].x+(p.x-points[i-1].x)*t,points[i-1].y+(p.y-points[i-1].y)*t,20);}).some(Boolean))).map(d=>d.id);
  // Corner cutting keeps every new chord inside the same clearance test; untouched corners stay as planned.
  let curve=points.map(p=>({x:p.x,y:p.y}));
  for(let pass=0;pass<5;pass++){const next=[curve[0]];
   for(let i=1;i<curve.length-1;i++){const a=curve[i-1],b=curve[i],c=curve[i+1],ab=Math.hypot(a.x-b.x,a.y-b.y),bc=Math.hypot(c.x-b.x,c.y-b.y);
    const k1=Math.min(.25,600/Math.max(1,ab)),k2=Math.min(.25,600/Math.max(1,bc)),q={x:b.x+(a.x-b.x)*k1,y:b.y+(a.y-b.y)*k1},r={x:b.x+(c.x-b.x)*k2,y:b.y+(c.y-b.y)*k2};
    if(ab>40&&bc>40&&safeSegment(q,r))next.push(q,r);else next.push(b);}
   next.push(curve.at(-1));curve=next;}
  // Sub-segments are resampled at other positions than their parent: validate the final curve with the same
  // sampler as the dense path, and fall back to the validated polyline if any piece fails.
  if(curve.some((p,i)=>i&&!safeSegment(curve[i-1],p)))curve=points.map(p=>({x:p.x,y:p.y}));
  const path=[curve[0]];for(let i=1;i<curve.length;i++){const a=curve[i-1],b=curve[i],n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/40));for(let k=1;k<=n;k++)path.push({x:a.x+(b.x-a.x)*k/n,y:a.y+(b.y-a.y)*k/n});}
  if(!path.every(p=>openPoint(p.x,p.y)))return aerial('interpolation','La interpolación no conserva el margen de paso; recorrido aéreo.');
  return{kind:'interior',code:'clear',reason:'Ruta interior libre de obstáculos.',points,path,clearanceMm:clearance,visited,doorIds,lengthMm:points.reduce((sum,p,i)=>i?sum+Math.hypot(p.x-points[i-1].x,p.y-points[i-1].y):0,0)};
 }
 // Camera choreography for a planned route, inspired by eye-level real-estate walkthroughs: steady eye height,
 // a gentle downward look, yaw that follows the visible path ahead, speed limited by turning and ramped in/out,
 // and an arrival that faces the room. Returns arc samples with time; the renderer interpolates them.
 function choreography(project,geometry,roomId,route,options={}){
  const room=geometry?.rooms?.find(r=>r.id===roomId);
  if(!room||!route||route.kind==='unavailable')return null;
  const aerial=route.kind==='aerial',eye=options.eyeHeight||1.5,walkPitch=options.walkPitchDeg??8,arrivePitch=options.arrivePitchDeg??11;
  const vmaxBase=options.speed||.85,turn=(options.maxTurnDegPerS||35)*Math.PI/180,accel=options.accel||.8,step=40;
  const src=route.path&&route.path.length>1?route.path:(()=>{const out=[route.points[0]];for(let i=1;i<route.points.length;i++){const a=route.points[i-1],b=route.points[i],n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/step));for(let k=1;k<=n;k++)out.push({x:a.x+(b.x-a.x)*k/n,y:a.y+(b.y-a.y)*k/n});}return out;})();
  const s=[0];for(let i=1;i<src.length;i++)s.push(s[i-1]+Math.hypot(src[i].x-src[i-1].x,src[i].y-src[i-1].y));
  const total=s.at(-1);
  const walls=[...geometry.walls.filter(w=>w.status!=='demolished'),...geometry.windows],tall=(project.objects||[]).filter(o=>o.type!=='rug'&&(o.size?.heightMm||0)>eye*1000);
  const blocked=(x,y)=>walls.some(w=>inRect(w,x,y,0))||tall.some(o=>furnitureBlocks(o,x,y,0));
  const sight=(a,b)=>{const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/60));for(let k=1;k<n;k++){const t=k/n;if(blocked(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t))return false;}return true;};
  const xs=room.poly.map(p=>p[0]),ys=room.poly.map(p=>p[1]),centroid=center(room);
  // Arrival: the path sample, from just before the room entry to a short way inside, whose view toward the
  // farthest room point shows the most floor with a clear line of sight (a doorway view for small rooms).
  let enter=src.findIndex(p=>inside(room.poly,p.x,p.y));if(enter<0)enter=src.length-1;
  const depth=Math.min(1600,Math.max(500,.3*Math.sqrt((Math.max(...xs)-Math.min(...xs))*(Math.max(...ys)-Math.min(...ys)))));
  const halfFov=(options.hfovDeg||70)*Math.PI/360,floorPts=[];
  {const st=Math.max(120,Math.sqrt((Math.max(...xs)-Math.min(...xs))*(Math.max(...ys)-Math.min(...ys))/120));for(let x=Math.min(...xs)+st/2;x<Math.max(...xs);x+=st)for(let y=Math.min(...ys)+st/2;y<Math.max(...ys);y+=st)if(inside(room.poly,x,y))floorPts.push({x,y});}
  // Room content (its furniture) weighs more than bare floor: an arrival should show what the room contains.
  const content=(project.objects||[]).filter(o=>o.position&&o.type!=='rug'&&inside(room.poly,o.position.x,o.position.y)).map(o=>({x:o.position.x,y:o.position.y}));
  const contentCenter=content.length?{x:content.reduce((n,q)=>n+q.x,0)/content.length,y:content.reduce((n,q)=>n+q.y,0)/content.length}:null;
  const seenShare=(p,yaw,pts,minD)=>{let n=0;for(const q of pts){const d=Math.hypot(q.x-p.x,q.y-p.y);if(d<minD)continue;let da=Math.atan2(q.y-p.y,q.x-p.x)-yaw;while(da>Math.PI)da-=2*Math.PI;while(da<-Math.PI)da+=2*Math.PI;if(Math.abs(da)<=halfFov&&sight(p,q))n++;}return pts.length?n/pts.length:0;};
  const viewFrom=p=>{const far=[...room.poly.map(q=>({x:q[0],y:q[1]})),{x:centroid[0],y:centroid[1]}].reduce((a,b)=>Math.hypot(b.x-p.x,b.y-p.y)>Math.hypot(a.x-p.x,a.y-p.y)?b:a);
   let best=null;for(const aim of [far,{x:centroid[0],y:centroid[1]},contentCenter].filter(Boolean)){if(Math.hypot(aim.x-p.x,aim.y-p.y)<300)continue;const yaw=Math.atan2(aim.y-p.y,aim.x-p.x),floor=seenShare(p,yaw,floorPts,600),things=seenShare(p,yaw,content,500);
    const score=content.length?.4*floor+.6*things:floor;if(!best||score>best.score)best={yaw,score,floor,things};}
   return best||{yaw:0,score:0,floor:0,things:0};};
  let end=src.length-1,best=null;
  if(!aerial){let last=src.length-1;for(let i=enter;i<src.length;i++)if(s[i]-s[enter]>=depth){last=i;break;}end=last;
   for(let i=0;i<=last;i++){if(s[i]<s[enter]-600)continue;const v=viewFrom(src[i]);if(!best||v.score>best.score+.02){best={...v,i};}}
   if(best)end=Math.max(best.i,Math.min(src.length-1,2));}
  const arrival=src[end],toCenter=Math.hypot(centroid[0]-arrival.x,centroid[1]-arrival.y);
  const look=options.lookAheadMm||1200,raw=[];
  for(let i=0;i<=end;i++){let j=i;while(j<end&&s[j]-s[i]<look)j++;while(j>i+1&&!aerial&&!sight(src[i],src[j]))j--;
   const a=src[i],b=j>i?src[j]:(i>0?{x:2*a.x-src[i-1].x,y:2*a.y-src[i-1].y}:src[Math.min(end,i+1)]);raw.push(Math.atan2(b.y-a.y,b.x-a.x));}
  for(let i=1;i<raw.length;i++){while(raw[i]-raw[i-1]>Math.PI)raw[i]-=2*Math.PI;while(raw[i]-raw[i-1]<-Math.PI)raw[i]+=2*Math.PI;}
  const sigma=Math.round(450/step),yaw=raw.map((_,i)=>{let sum=0,w=0;for(let k=-3*sigma;k<=3*sigma;k++){const j=Math.min(raw.length-1,Math.max(0,i+k)),g=Math.exp(-k*k/(2*sigma*sigma));sum+=raw[j]*g;w+=g;}return sum/w;});
  let finalYaw=best&&best.i===end?best.yaw:toCenter>700?Math.atan2(centroid[1]-arrival.y,centroid[0]-arrival.x):yaw[end];
  while(finalYaw-yaw[end]>Math.PI)finalYaw-=2*Math.PI;while(finalYaw-yaw[end]<-Math.PI)finalYaw+=2*Math.PI;
  // Look a little lower on arrival in small rooms so fixtures near the floor stay in frame.
  const arrivePitchDeg=options.arrivePitchDeg??Math.min(20,Math.max(arrivePitch,Math.atan2(eye-.55,Math.max(.6,toCenter/1000))*180/Math.PI));
  // Turn toward the arrival view only where that direction is open for at least 1 m; any remaining turn
  // happens in place on arrival, so the camera never swings into the wall beside a door while walking.
  const openToward=p=>{const dx=Math.cos(finalYaw),dy=Math.sin(finalYaw);for(let d=60;d<=1000;d+=60)if(blocked(p.x+dx*d,p.y+dy*d))return false;return true;};
  let clearFrom=end;while(clearFrom>0&&s[end]-s[clearFrom-1]<=1500&&(aerial||openToward(src[clearFrom-1])))clearFrom--;
  const blend=s[end]-s[clearFrom],smooth=t=>t<=0?0:t>=1?1:t*t*(3-2*t);
  const pitch=[];for(let i=0;i<=end;i++){const k=blend>1?smooth((s[i]-s[clearFrom])/blend):0;yaw[i]+= (finalYaw-yaw[i])*k;pitch.push(aerial?45:walkPitch+(arrivePitchDeg-walkPitch)*k);}
  const length=s[end],vmax=Math.min(1.1,Math.max(vmaxBase,length/1000/16));
  const v=yaw.map((y,i)=>{const j=Math.min(end,i+1),k=Math.max(0,i-1),rate=Math.abs(yaw[j]-yaw[k])/Math.max(1e-6,(s[j]-s[k])/1000);return Math.min(vmax,turn/Math.max(1e-6,rate));});
  v[0]=0;v[end]=0;
  for(let i=1;i<=end;i++)v[i]=Math.min(v[i],Math.sqrt(v[i-1]**2+2*accel*(s[i]-s[i-1])/1000));
  for(let i=end-1;i>=0;i--)v[i]=Math.min(v[i],Math.sqrt(v[i+1]**2+2*accel*(s[i+1]-s[i])/1000));
  const r=Math.round(250/step),vs=v.map((_,i)=>{let a=0,n=0;for(let k=-r;k<=r;k++){const j=i+k;if(j>=0&&j<=end){a+=v[j];n++;}}return i===0||i===end?0:Math.min(v[i]*1.15+.02,a/n);});
  const samples=[];let t=0;
  for(let i=0;i<=end;i++){if(i){const avg=Math.max(.06,(vs[i]+vs[i-1])/2);t+=(s[i]-s[i-1])/1000/avg;}
   samples.push({t,s:s[i],x:src[i].x,y:src[i].y,h:eye,yaw:yaw[i],pitchDeg:pitch[i]});}
  // Readability: share of walking time whose forward view meets a wall within 0.9 m at eye height.
  let close=0;for(let i=1;i<samples.length;i++){const p=samples[i],dx=Math.cos(p.yaw),dy=Math.sin(p.yaw);let hit=false;for(let d=60;d<=900;d+=60)if(walls.some(w=>inRect(w,p.x+dx*d,p.y+dy*d,0))){hit=true;break;}if(hit)close+=samples[i].t-samples[i-1].t;}
  const duration=samples.at(-1).t,closeShare=duration?close/duration:0;
  return{samples,duration,lengthMm:length,arrival:{x:arrival.x,y:arrival.y,yaw:finalYaw,pitchDeg:aerial?45:arrivePitchDeg,viewScore:best?+best.score.toFixed(3):null,floorSeen:best?+best.floor.toFixed(3):null,contentSeen:best?+best.things.toFixed(3):null,insideRoom:inside(room.poly,arrival.x,arrival.y)},enterIndex:enter,readable:aerial||closeShare<=(options.maxCloseShare??.12),closeShare,eyeHeight:eye,vmax};
 }
 const api={plan,choreography};if(typeof module!=='undefined')module.exports=api;else root.FloorPlanPresentationRoute=api;
})(globalThis);
