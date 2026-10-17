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
 function minimap(geometry,pose,roomId){
  const rooms=geometry.rooms.filter(r=>r.poly.length>=3&&area(r.poly)>0);
  if(!rooms.length)return null;
  const points=rooms.flatMap(r=>r.poly),box=bounds(points),padding=Math.max(300,Math.max(box.w,box.h)*.06);
  const viewBox=[box.x-padding,box.y-padding,Math.max(1,box.w+padding*2),Math.max(1,box.h+padding*2)];
  const camera=pose?.position,target=pose?.target;
  let heading=null;
  if(Array.isArray(camera)&&Array.isArray(target)){
   const dx=target[0]-camera[0],dy=target[2]-camera[2],length=Math.hypot(dx,dy);
   if(length>1e-8)heading={x:target[0]*1000+geometry.center.x,y:target[2]*1000+geometry.center.y,dx:dx/length,dy:dy/length};
  }
  return {viewBox,rooms:rooms.map(r=>({id:r.id,name:r.name,poly:r.poly,active:r.id===roomId})),heading};
 }
 // Room stop framing. Plan coordinates are mm, heights metres. Each candidate direction is fitted in closed form
 // so the room floor, the lower part of its walls and its furniture fill the visible screen region; walls,
 // lintels and furniture of other rooms are 2.5D occluders. A lower wall section is used only when full-height
 // walls cannot show the room, and the caller must declare it. The project is only read.
 const insidePoly=(poly,x,y)=>{let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;};
 function occluders(geometry,objects,top,skipRoom){
  const boxes=[],add=(r,y0,y1,kind)=>{if(r?.center&&y1>y0+1e-3)boxes.push({cx:r.center[0]/1000,cz:r.center[1]/1000,a:r.angle||0,hx:r.spanMm/2000,hz:r.thickness/2000,r:Math.hypot(r.spanMm,r.thickness)/2000+1e-3,y0,y1,kind});};
  geometry.walls.filter(w=>w.status!=='demolished').forEach(w=>add(w,0,Math.min(top,w.height??top),'wall'));
  geometry.windows.forEach(w=>{add(w,0,Math.min(top,w.sill??0),'wall');if(top>(w.head??top))add(w,w.head,Math.min(top,w.height??top),'wall');});
  [...geometry.doors.map(d=>d.rect),...geometry.slides.map(d=>d.rect),...(geometry.voids||[])].forEach(r=>{if(r.sill>0)add(r,0,Math.min(r.sill,top),'wall');if(top>(r.head??top))add(r,r.head,Math.min(top,r.height??top),'wall');});
  for(const o of objects||[]){if(o.type==='rug'||!o.position||!o.size)continue;const own=skipRoom&&insidePoly(skipRoom.poly,o.position.x,o.position.y);
   boxes.push({cx:o.position.x/1000,cz:o.position.y/1000,a:(o.rotationDeg||0)*Math.PI/180,hx:o.size.widthMm/2000,hz:o.size.depthMm/2000,r:Math.hypot(o.size.widthMm,o.size.depthMm)/2000+1e-3,y0:0,y1:(o.size.heightMm||0)/1000,kind:own?'content':'object'});}
  return boxes;
 }
 function hitBox(b,P,d){
  const ex=b.cx-P[0],ez=b.cz-P[2],dl=Math.hypot(d[0],d[2]);
  if(dl>1e-9?Math.abs(ex*d[2]-ez*d[0])/dl>b.r:Math.hypot(ex,ez)>b.r)return null;
  const c=Math.cos(b.a),s=Math.sin(b.a),ox=P[0]-b.cx,oz=P[2]-b.cz,lx=ox*c+oz*s,lz=-ox*s+oz*c,dx=d[0]*c+d[2]*s,dz=-d[0]*s+d[2]*c;
  let t0=-Infinity,t1=Infinity,top=false;
  for(const [o,v,lo,hi,y] of [[lx,dx,-b.hx,b.hx,false],[P[1],d[1],b.y0,b.y1,true],[lz,dz,-b.hz,b.hz,false]]){
   if(Math.abs(v)<1e-12){if(o<lo||o>hi)return null;continue;}
   let a=(lo-o)/v,e=(hi-o)/v;if(a>e)[a,e]=[e,a];if(a>t0){t0=a;top=y&&v<0;}if(e<t1)t1=e;if(t0>t1)return null;}
  return t0>1e-6?{t:t0,top}:null;
 }
 function roomFrame(geometry,objects,roomId,o={}){
  const room=geometry?.rooms?.find(r=>r.id===roomId&&r.poly.length>=3&&area(r.poly)>0);
  if(!room)return null;
  const fov=(o.fovDeg||45)*Math.PI/180,aspect=Math.max(.2,o.aspect||1.6),tV=Math.tan(fov/2),tH=tV*aspect;
  let region=o.region&&o.region[2]-o.region[0]>.25&&o.region[3]-o.region[1]>.25?o.region:[0,0,1,1];
  // The margin only shapes the fit; presence is measured over the whole visible region.
  const visibleRegion=region,m=o.margin??.07,rw=region[2]-region[0],rh=region[3]-region[1];region=[region[0]+rw*m,region[1]+rh*m,region[2]-rw*m,region[3]-rh*m];
  const ax=2*region[0]-1,bx=2*region[2]-1,ay=1-2*region[3],by=1-2*region[1];
  const pe=o.preferElevationDeg??54,ew=o.elevationWeight??.012,full=o.wallTop||2.8,sections=(o.sectionTops||[]).filter(t=>t<full),tops=o.sectionFirst===false?[full,...sections]:[...sections,full];
  const own=(objects||[]).filter(x=>x.type!=='rug'&&x.position&&x.size&&insidePoly(room.poly,x.position.x,x.position.y));
  const tallest=Math.max(0,...(objects||[]).map(x=>(x.size?.heightMm||0)/1000));
  const box=bounds(room.poly),cx=(box.x+box.w/2)/1000,cz=(box.y+box.h/2)/1000;
  const step=Math.max(150,Math.sqrt(box.w*box.h/36));const floor=[];
  for(let x=box.x+step/2;x<box.x+box.w;x+=step)for(let y=box.y+step/2;y<box.y+box.h;y+=step)if(insidePoly(room.poly,x,y))floor.push([x/1000,.02,y/1000]);
  if(!floor.length)floor.push([cx,.02,cz]);
  const content=own.map(x=>[x.position.x/1000,Math.max(.05,(x.size.heightMm||0)/1000),x.position.y/1000]);
  // Azimuths follow the longest polygon edge so rotated or irregular plans are framed along their own axes.
  let base=0,longest=0;room.poly.forEach((p,i)=>{const q=room.poly[(i+1)%room.poly.length],L=Math.hypot(q[0]-p[0],q[1]-p[1]);if(L>longest){longest=L;base=Math.atan2(q[1]-p[1],q[0]-p[0])*180/Math.PI;}});
  base=((base%30)+30)%30;
  const ranked=[],occ=new Map();
  for(const top of tops){
   const fit=[...room.poly.map(p=>[p[0]/1000,0,p[1]/1000]),...room.poly.map(p=>[p[0]/1000,Math.min(top,1),p[1]/1000])];
   for(const x of own){const a=(x.rotationDeg||0)*Math.PI/180,c=Math.cos(a),s=Math.sin(a),w=x.size.widthMm/2,d=x.size.depthMm/2,h=Math.min(top+.4,(x.size.heightMm||0)/1000);
    for(const [u,v] of [[-w,-d],[w,-d],[w,d],[-w,d]])fit.push([(x.position.x+u*c-v*s)/1000,h,(x.position.y+u*s+v*c)/1000]);}
   const boxes=occluders(geometry,objects,top,room),blockers=boxes.filter(b=>b.kind!=='content');occ.set(top,boxes);
   const minY=Math.max(full,tallest)+.35;// above full-height walls too, so a walkthrough can start from a sectioned stop
   for(const elevation of o.elevations||[40,47,54,61,68,74])for(let azimuth=base;azimuth<360;azimuth+=30){
    const el=elevation*Math.PI/180,az=azimuth*Math.PI/180,f=[-Math.cos(el)*Math.cos(az),-Math.sin(el),-Math.cos(el)*Math.sin(az)];
    const rl=Math.hypot(f[2],f[0]),r=[-f[2]/rl,0,f[0]/rl],u=[r[1]*f[2]-r[2]*f[1],r[2]*f[0]-r[0]*f[2],r[0]*f[1]-r[1]*f[0]];
    const dot=(p,q)=>p[0]*q[0]+p[1]*q[1]+p[2]*q[2],X=fit.map(p=>dot(p,r)),Y=fit.map(p=>dot(p,u)),Z=fit.map(p=>dot(p,f));
    let cf=Math.min(...Z)-.3;
    for(let i=0;i<fit.length;i++)for(let j=0;j<fit.length;j++){if(i===j)continue;
     cf=Math.min(cf,(X[j]-X[i]-ax*tH*Z[j]+bx*tH*Z[i])/(tH*(bx-ax)),(Y[j]-Y[i]-ay*tV*Z[j]+by*tV*Z[i])/(tV*(by-ay)));}
    const mid=(V,a,b,t)=>(Math.max(...V.map((v,i)=>v-b*t*(Z[i]-cf)))+Math.min(...V.map((v,i)=>v-a*t*(Z[i]-cf))))/2;
    const cr=mid(X,ax,bx,tH),cu=mid(Y,ay,by,tV);
    let C=[0,1,2].map(k=>cr*r[k]+cu*u[k]+cf*f[k]);
    if(C[1]<minY){const back=(minY-C[1])/-f[1];C=C.map((v,k)=>v-f[k]*back);}
    let visible=0;const samples=[...floor,...content];
    for(const p of samples){const d=[p[0]-C[0],p[1]-C[1],p[2]-C[2]],L=Math.hypot(...d),n=d.map(v=>v/L);if(!blockers.some(b=>{const h=hitBox(b,C,n);return h&&h.t<L-.03;}))visible++;}
    const v=visible/samples.length;ranked.push({top,elevation,azimuth,C,f,r,u,visible:v,pre:Math.min(v,.92)-ew*Math.abs(elevation-pe)});
   }
  }
  ranked.sort((a,b)=>b.pre-a.pre||b.visible-a.visible||a.azimuth-b.azimuth);
  const cols=20,rows=12,rooms=geometry.rooms.filter(r=>r.poly.length>=3),best=[],samples=[...floor,...content],minY=Math.max(full,tallest)+.35;
  const dot=(p,q)=>p[0]*q[0]+p[1]*q[1]+p[2]*q[2];
  // Presence of each room over the whole visible region, by rays from the candidate camera.
  function shareOf(c,boxes){
   const counts=new Map();let total=0;
   for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
    const sx=visibleRegion[0]+(visibleRegion[2]-visibleRegion[0])*(i+.5)/cols,sy=visibleRegion[1]+(visibleRegion[3]-visibleRegion[1])*(j+.5)/rows,px=(sx*2-1)*tH,py=(1-sy*2)*tV;
    const d0=[0,1,2].map(k=>c.f[k]+px*c.r[k]+py*c.u[k]),L=Math.hypot(...d0),d=d0.map(v=>v/L);
    let hit=d[1]<0?{t:-c.C[1]/d[1],top:false}:null;for(const b of boxes){const h=hitBox(b,c.C,d);if(h&&(!hit||h.t<hit.t))hit=h;}
    total++;if(!hit)continue;if(hit.top){counts.set('top',(counts.get('top')||0)+1);continue;}
    const t=Math.max(0,hit.t-.03),x=(c.C[0]+d[0]*t)*1000,y=(c.C[2]+d[2]*t)*1000,owner=rooms.find(q=>q.counted!==false&&insidePoly(q.poly,x,y))||rooms.find(q=>insidePoly(q.poly,x,y));
    if(owner)counts.set(owner.id,(counts.get(owner.id)||0)+1);}
   return {share:(counts.get(room.id)||0)/total,other:Math.max(0,...[...counts].filter(([k])=>k!==room.id&&k!=='top').map(([,v])=>v/total))};
  }
  // Floor and content samples that are inside the visible region AND unoccluded (what the criterion counts).
  function framedVisible(C,c,blockers){
   let n=0;for(const p of samples){const d=[p[0]-C[0],p[1]-C[1],p[2]-C[2]],z=dot(d,c.f);if(z<=0)continue;
    const sx=(dot(d,c.r)/z/tH+1)/2,sy=(1-dot(d,c.u)/z/tV)/2;if(sx<visibleRegion[0]||sx>visibleRegion[2]||sy<visibleRegion[1]||sy>visibleRegion[3])continue;
    const L=Math.hypot(...d),nd=d.map(v=>v/L);if(!blockers.some(b=>{const h=hitBox(b,C,nd);return h&&h.t<L-.03;}))n++;}
   return n/samples.length;
  }
  // Accepted with a margin over the criterion (40 % presence, 75 % floor): this 20x12 ray grid is coarser than
  // an independent measurement and must not accept views that sit on the threshold.
  const accept=(v,s)=>v>=.78&&s.share>=.42&&s.other<.23&&s.other<s.share*.6;
  const scoreOf=(c,v,s)=>Math.min(v,.92)+.9*s.share-2*Math.max(0,s.other-.12)-(c.top===full?0:.08)-ew*Math.abs(c.elevation-pe);
  for(const top of tops){
   const boxes=occ.get(top);
   for(const c of ranked.filter(x=>x.top===top).slice(0,o.shareCandidates||Infinity)){
    const s=shareOf(c,boxes);
    best.push({...c,...s,ok:accept(c.visible,s),score:scoreOf(c,c.visible,s)});
   }
   const pick=best.filter(x=>x.top===top&&x.ok).sort((a,b)=>b.score-a.score)[0];
   if(pick)return result(pick);
   // No view of the whole room meets the criterion (typically a long, narrow room in a near-square free region):
   // move the best views closer, accepting only those that still keep >= 75 % of floor and content in the free
   // region and unoccluded, and the camera above full-height walls.
   const blockers=boxes.filter(b=>b.kind!=='content'),closer=[];
   for(const c of best.filter(x=>x.top===top).sort((a,b)=>b.share-a.share).slice(0,8)){
    const depth=(cx-c.C[0])*c.f[0]+(Math.min(top,1)/2-c.C[1])*c.f[1]+(cz-c.C[2])*c.f[2];
    for(const k of [.1,.2,.3,.4]){const C=c.C.map((v,i)=>v+c.f[i]*depth*k);if(C[1]<minY)continue;
     const z={...c,C},v=framedVisible(C,c,blockers),s=shareOf(z,boxes);if(accept(v,s))closer.push({...z,...s,visible:v,ok:true,closer:k,score:scoreOf(c,v,s)});}
   }
   const near=closer.sort((a,b)=>b.score-a.score)[0];
   if(near)return result(near);
  }
  return result(best.sort((a,b)=>b.score-a.score)[0]);
  function result(c){
   const depth=(cx-c.C[0])*c.f[0]+(Math.min(c.top,1)/2-c.C[1])*c.f[1]+(cz-c.C[2])*c.f[2];
   const look=c.C.map((v,k)=>v+c.f[k]*Math.max(.5,depth));
   return {roomId:room.id,eye:[c.C[0]*1000,c.C[1],c.C[2]*1000],look:[look[0]*1000,look[1],look[2]*1000],wallTop:c.top,section:c.top<full,
    elevationDeg:c.elevation,azimuthDeg:c.azimuth,floorVisible:+c.visible.toFixed(3),share:+c.share.toFixed(3),otherShare:+c.other.toFixed(3),accepted:c.ok};
  }
 }
 const api={create,current,area,bounds,reconcile,sidecar,key,minimap,roomFrame};
 if(typeof module==='object')module.exports=api;else root.FloorPlanPresentationCore=api;
})(globalThis);
