'use strict';
// Offline presentation pilot: short in-room camera moves derived from FloorPlanProjectV1 geometry.
// Pure Node. Never touches the project, the editor, storage or the interactive 3D presentation.
const Core=require('../../js/project-core.js'),Generic=require('../../js/generic-catalog.js');
const VERSION='0.1.0',DEG=Math.PI/180;

const insidePoly=(x,y,poly)=>{let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [ax,ay]=poly[i],[bx,by]=poly[j];if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)c=!c;}return c;};
const area=poly=>Math.abs(poly.reduce((s,[x,y],i)=>{const [u,v]=poly[(i+1)%poly.length];return s+x*v-u*y;},0))/2;
function segDist(px,py,[ax,ay],[bx,by]){const dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy,t=l?Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/l)):0;return Math.hypot(px-ax-t*dx,py-ay-t*dy);}
const edgeDist=(x,y,poly)=>poly.reduce((m,a,i)=>Math.min(m,segDist(x,y,a,poly[(i+1)%poly.length])),Infinity);
function centroid(poly){let a=0,cx=0,cy=0;poly.forEach(([x,y],i)=>{const [u,v]=poly[(i+1)%poly.length],k=x*v-u*y;a+=k;cx+=(x+u)*k;cy+=(y+v)*k;});return a?[cx/(3*a),cy/(3*a)]:poly[0];}

// Plan scene (mm). Boxes are oriented rectangles extruded between z0 and z1, tagged with the room they belong to.
function scene(project){
 const g=Core.geometry(project),rooms=g.rooms.map(r=>({id:r.id,name:r.name,poly:r.poly,area:area(r.poly)/1e6}));
 const roomAt=(x,y)=>rooms.find(r=>insidePoly(x,y,r.poly))?.id||null,boxes=[];
 const rect=(poly,z0,z1,kind,id,room)=>{const xs=poly.map(p=>p[0]),ys=poly.map(p=>p[1]);boxes.push({poly,z0,z1,kind,id,room,minX:Math.min(...xs),maxX:Math.max(...xs),minY:Math.min(...ys),maxY:Math.max(...ys)});};
 for(const w of g.walls)if(w.status!=='demolished')rect(w.poly,0,w.height*1000,'wall',w.id,null);
 // Window/door rectangles keep their solid parts below the sill and above the head.
 for(const o of [...g.windows,...g.doors.map(d=>d.rect),...g.slides.map(s=>s.rect),...g.voids]){if(o.sill>0)rect(o.poly,0,o.sill*1000,'wall',o.id,null);if(o.head<o.height)rect(o.poly,o.head*1000,o.height*1000,'wall',o.id,null);}
 const objects=project.objects.map(o=>{const h=o.size.heightMm??Generic.heights[o.type]??800,a=(o.rotationDeg||0)*DEG,c=Math.cos(a),s=Math.sin(a),w=o.size.widthMm/2,d=o.size.depthMm/2,poly=[[-w,-d],[w,-d],[w,d],[-w,d]].map(([x,y])=>[o.position.x+x*c-y*s,o.position.y+x*s+y*c]),z0=o.elevationMm||0;return {id:o.id,type:o.type,room:roomAt(o.position.x,o.position.y),poly,z0,z1:z0+h};});
 for(const o of objects)rect(o.poly,o.z0,o.z1,'object',o.id,o.room);
 return {geometry:g,center:g.center,rooms,objects,boxes,roomAt};
}

// Ray against an extruded convex quad: 2D slab clip on its edges, then the vertical interval.
function hitBox(b,o,d,tmax){
 let t0=0,t1=tmax;const p=b.poly;
 for(let i=0;i<4;i++){const [ax,ay]=p[i],[bx,by]=p[(i+1)%4],nx=by-ay,ny=-(bx-ax),cx=(p[(i+2)%4][0]+p[(i+3)%4][0])/2-ax,cy=(p[(i+2)%4][1]+p[(i+3)%4][1])/2-ay,sg=nx*cx+ny*cy>0?-1:1,num=sg*(nx*(o[0]-ax)+ny*(o[1]-ay)),den=sg*(nx*d[0]+ny*d[1]);
  if(Math.abs(den)<1e-12){if(num>0)return null;continue;}const t=-num/den;if(den<0)t0=Math.max(t0,t);else t1=Math.min(t1,t);if(t0>t1)return null;}
 const z=t=>o[2]+d[2]*t;if(d[2]!==0){const ta=(b.z0-o[2])/d[2],tb=(b.z1-o[2])/d[2];t0=Math.max(t0,Math.min(ta,tb));t1=Math.min(t1,Math.max(ta,tb));}else if(z(0)<b.z0||z(0)>b.z1)return null;
 return t0<=t1?t0:null;
}

// Fraction of the frame each room occupies from pose (eye mm, yaw rad in plan, pitch down rad), by ray grid.
// Hits on walls are credited to the room on the camera side of the surface; rays that escape count as void.
function measure(sc,eye,yaw,pitch,hfov,aspect,{cols=40,rows=0,nearMm=1200}={}){
 rows=rows||Math.max(9,Math.round(cols/aspect));const tx=Math.tan(hfov/2),ty=tx/aspect,f=[Math.cos(yaw)*Math.cos(pitch),Math.sin(yaw)*Math.cos(pitch),-Math.sin(pitch)],r=[-Math.sin(yaw),Math.cos(yaw),0],u=[f[1]*r[2]-f[2]*r[1],f[2]*r[0]-f[0]*r[2],f[0]*r[1]-f[1]*r[0]];
 const counts={},floor={},seen=new Set(),reach=30000;let n=0,near=0;
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const sx=((i+.5)/cols*2-1)*tx,sy=(1-(j+.5)/rows*2)*ty,d=[0,1,2].map(k=>f[k]+r[k]*sx+u[k]*sy),l=Math.hypot(...d);for(let k=0;k<3;k++)d[k]/=l;
  let best=d[2]<0?(0-eye[2])/d[2]:reach,hit=null;if(best>reach)best=reach;
  const ex=eye[0]+d[0]*best,ey=eye[1]+d[1]*best,minX=Math.min(eye[0],ex),maxX=Math.max(eye[0],ex),minY=Math.min(eye[1],ey),maxY=Math.max(eye[1],ey);
  for(const b of sc.boxes){if(b.maxX<minX||b.minX>maxX||b.maxY<minY||b.minY>maxY)continue;const t=hitBox(b,eye,d,best);if(t!=null&&t<best){best=t;hit=b;}}
  let key;if(hit?.kind==='object'){key=hit.room;seen.add(hit.id);}else{const back=Math.max(0,best-60),x=eye[0]+d[0]*back,y=eye[1]+d[1]*back;key=best>=reach-1?'void':sc.roomAt(x,y)||'outside';}
  if(!hit&&key!=='void')floor[key]=(floor[key]||0)+1;if(best<nearMm)near++;
  counts[key]=(counts[key]||0)+1;n++;}
 const share={},floorShare={};for(const k in counts)share[k]=counts[k]/n;for(const k in floor)floorShare[k]=floor[k]/n;return {share,floor:floorShare,near:near/n,seen:[...seen]};
}

// Standing positions: inside the room, clear of its boundary and of furniture footprints taller than a rug.
function freeTest(sc,room,{clearance=280,objectMargin=150}={}){
 const solid=sc.objects.filter(o=>o.z1-o.z0>60);
 return (x,y)=>{if(!insidePoly(x,y,room.poly)||edgeDist(x,y,room.poly)<clearance)return false;
  for(const b of sc.boxes)if(b.kind==='wall'&&x>b.minX-clearance&&x<b.maxX+clearance&&y>b.minY-clearance&&y<b.maxY+clearance&&(insidePoly(x,y,b.poly)||edgeDist(x,y,b.poly)<clearance))return false;
  for(const o of solid)if(insidePoly(x,y,o.poly)||edgeDist(x,y,o.poly)<objectMargin)return false;return true;};
}

const smooth=t=>t<=0?0:t>=1?1:(1-Math.cos(Math.PI*t))/2;
// Distance fraction for a move with raised-cosine acceleration over `ramp` seconds and constant middle speed.
function profile(T,ramp){const r=Math.min(ramp,T/2),vmax=1/(T-r);return t=>{if(t<=r)return vmax*(t-r/Math.PI*Math.sin(Math.PI*t/r))/2;if(t>=T-r){const q=T-t;return 1-vmax*(q-r/Math.PI*Math.sin(Math.PI*q/r))/2;}return vmax*(r/2+(t-r));};}

function composeRoom(sc,roomId,o={}){
 const room=sc.rooms.find(r=>r.id===roomId);if(!room)throw Error('Unknown room '+roomId);
 const fps=o.fps||30,seconds=o.seconds||3.6,aspect=o.aspect||16/9,eyeH=o.eyeHeightMm||1350,sensor=36,lenses=o.lenses||[24,20,18,16],free=freeTest(sc,room,o),step=o.gridMm||120;
 const contents=sc.objects.filter(b=>b.room===roomId&&b.z1-b.z0>60),[cx,cy]=centroid(room.poly),xs=room.poly.map(p=>p[0]),ys=room.poly.map(p=>p[1]);
 const cand=[];for(let x=Math.min(...xs)+step/2;x<Math.max(...xs);x+=step)for(let y=Math.min(...ys)+step/2;y<Math.max(...ys);y+=step)if(free(x,y))cand.push([x,y]);
 // Doorway vantage points: standing in an adjacent room, at most 1.6 m from a door of this room, looking in.
 // Doorway vantage points: in an adjacent room up to 1.6 m from a door of this room, or on the threshold itself
 // (the package models doors as voids, without leaf). Moves may pass the threshold, never a wall.
 const doorTests=[],threshold=(dr,inset)=>{const [mx,my]=dr.center,u=[Math.cos(dr.angle),Math.sin(dr.angle)],n=[-u[1],u[0]],half=dr.spanMm/2-inset,deep=dr.thickness/2+330;return (x,y)=>{const dx=x-mx,dy=y-my;return half>0&&Math.abs(dx*u[0]+dy*u[1])<=half&&Math.abs(dx*n[0]+dy*n[1])<=deep;};};
 for(const dr of [...sc.geometry.doors.map(d=>d.rect),...sc.geometry.slides.map(s=>s.rect),...sc.geometry.voids]){const [mx,my]=dr.center,n=[-Math.sin(dr.angle),Math.cos(dr.angle)],off=dr.thickness/2+80,sides=[[mx+n[0]*off,my+n[1]*off],[mx-n[0]*off,my-n[1]*off]].map(([x,y])=>sc.roomAt(x,y));
  if(!sides.includes(roomId))continue;const other=sides.find(s=>s&&s!==roomId),strip=threshold(dr,200);doorTests.push(strip);
  for(let k=-(dr.thickness/2+300);k<=dr.thickness/2+300;k+=step/2)if(strip(mx+n[0]*k,my+n[1]*k))cand.push([mx+n[0]*k,my+n[1]*k,'threshold']);
  if(!other)continue;const nb=sc.rooms.find(r=>r.id===other),nf=freeTest(sc,nb,o);doorTests.push(nf);
  for(let x=mx-1600;x<=mx+1600;x+=step)for(let y=my-1600;y<=my+1600;y+=step)if(Math.hypot(x-mx,y-my)<=1600&&nf(x,y))cand.push([x,y,other]);}
 const standAny=(x,y)=>free(x,y)||doorTests.some(f=>f(x,y));
 const walls=sc.boxes.filter(b=>b.kind==='wall'&&b.z0<eyeH&&b.z1>200),wallClear=(x,y)=>walls.reduce((m,b)=>Math.min(m,insidePoly(x,y,b.poly)?0:edgeDist(x,y,b.poly)),Infinity);
 const diag=Math.hypot(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys)),nearMm=Math.max(600,Math.min(1200,diag*.35));
 const inner=cand.filter(c=>!c[2]).sort((a,b)=>edgeDist(a[0],a[1],room.poly)-edgeDist(b[0],b[1],room.poly)),near=[...inner.slice(0,Math.max(24,Math.ceil(inner.length*.5))),...cand.filter(c=>c[2])],every=Math.max(1,Math.ceil(near.length/128)),pos=near.filter((_,i)=>i%every===0);
 const pitchAt=(x,y)=>Math.min(18,Math.max(5,Math.atan2(eyeH-900,Math.hypot(cx-x,cy-y))/DEG));
 const evaluate=(x,y,yaw,lens,cols)=>{const hfov=2*Math.atan(sensor/2/lens),pitch=pitchAt(x,y)*DEG,m=measure(sc,[x,y,eyeH],yaw,pitch,hfov,aspect,{cols,nearMm});
  const t=m.share[roomId]||0,other=Math.max(0,...Object.entries(m.share).filter(([k])=>k!==roomId&&k!=='void'&&k!=='outside').map(([,v])=>v)),content=contents.length?m.seen.filter(id=>contents.some(c=>c.id===id)).length/contents.length:1;
  // Legibility: reward the target's visible floor, penalise surfaces closer than 1.2 m filling the frame.
  const fl=m.floor[roomId]||0;
  return {score:t+.35*content+Math.min(fl,.3)-2*Math.max(0,m.near-.1)-1.5*Math.max(0,other-.15)-.6*(m.share.void||0)-(24-lens)*.004,x,y,yaw,pitch,lens,hfov,share:t,other,content,floor:fl,near:m.near};};
 // Coarse pass (20 mm, 20 columns, 10° yaw steps toward the room), then lenses and ±5° on the ten best.
 const coarse=[];for(const [x,y] of pos){const toC=Math.atan2(cy-y,cx-x);for(let k=-6;k<=6;k++)coarse.push(evaluate(x,y,toC+k*10*DEG,20,20));}
 coarse.sort((a,b)=>b.score-a.score);let best=null;
 for(const c of coarse.slice(0,10))for(const lens of lenses)for(const dy of [-5,0,5]){const e=evaluate(c.x,c.y,c.yaw+dy*DEG,lens,32);if(!best||e.score>best.score)best=e;}
 // Short move around the best pose: lateral truck first (parallax), then push-in, then a slow pan in place.
 const f=[Math.cos(best.yaw),Math.sin(best.yaw)],side=[-f[1],f[0]],moves=[];
 // Every move ends on the best composition, so the shot settles on it (the anchor frame), as in Candidate 04.
 for(const dist of [700,500,350,220])for(const [v,kind] of [[side,'truck'],[side.map(c=>-c),'truck'],[f,'push-in'],[f.map(c=>-c),'pull-back']])moves.push({kind,from:[best.x-v[0]*dist,best.y-v[1]*dist],to:[best.x,best.y],dist});
 const frames=Math.round(seconds*fps),ease=profile(seconds,o.rampSeconds||.7),sub=o.subsamples||4;
 // Trucks pan slightly toward the room centroid (parallax), and the yaw lands exactly on the composed one.
 const turn=(x,y)=>{const aim=Math.atan2(cy-y,cx-x);return Math.atan2(Math.sin(aim-best.yaw),Math.cos(aim-best.yaw));};
 const pose=(m,s)=>{const x=m.from[0]+(m.to[0]-m.from[0])*s,y=m.from[1]+(m.to[1]-m.from[1])*s,blend=m.kind==='truck'?.35:0;return {x,y,yaw:best.yaw+blend*(turn(x,y)-turn(m.to[0],m.to[1])),pitch:pitchAt(x,y)*DEG};};
 let chosen=null,checked=0;
 // The whole move stays in the free space of the room the camera stands in (the target or the doorway's neighbour).
 const hostId=sc.roomAt(best.x,best.y)||'threshold';
 for(const m of moves){let ok=true,min=Infinity;for(let i=0;i<=frames*sub&&ok;i++){const p=pose(m,ease(i/(frames*sub)*seconds));checked++;if(!standAny(p.x,p.y))ok=false;else min=Math.min(min,wallClear(p.x,p.y));}
  if(!ok)continue;
  // Every part of the move must stay legible: start, middle and end keep the share and avoid near surfaces.
  const legible=[0,.5,1].every(s=>{const q=pose(m,s),mq=measure(sc,[q.x,q.y,eyeH],q.yaw,q.pitch,best.hfov,aspect,{cols:32,nearMm});return (mq.share[roomId]||0)>=best.share*.85&&mq.near<=Math.max(.13,best.near);});
  if(!legible)continue;chosen={...m,minWallClearanceMm:Math.round(min)};break;}
 if(!chosen)chosen={kind:'pan',from:[best.x,best.y],to:[best.x,best.y],dist:0,minWallClearanceMm:Math.round(wallClear(best.x,best.y))};
 // Fallback: a slow pan that lands on the composition, from the side (and width) whose first frame stays legible.
 let pan=0;if(chosen.kind==='pan'){let bestNear=Infinity;for(const deg of [8,-8,5,-5,3,-3]){const m=measure(sc,[best.x,best.y,eyeH],best.yaw+deg*DEG,best.pitch,best.hfov,aspect,{cols:32,nearMm});if(m.near<=Math.max(.13,best.near)&&(m.share[roomId]||0)>=best.share*.85){pan=deg;break;}if(m.near<bestNear){bestNear=m.near;pan=deg/4;}}chosen.panDeg=pan;}
 const panPose=s=>({x:best.x,y:best.y,yaw:best.yaw+(1-s)*pan*DEG,pitch:best.pitch});
 const at=s=>chosen.kind==='pan'?panPose(s):pose(chosen,s);
 const samples=[];for(let i=0;i<frames;i++){const t=i/fps,s=ease(t);samples.push({frame:i,...at(s)});}
 const anchors=[0,Math.floor(frames/2),frames-1].map(i=>{const p=samples[i],m=measure(sc,[p.x,p.y,eyeH],p.yaw,p.pitch,best.hfov,aspect,{cols:64,nearMm});return {frame:i,share:m.share,floor:m.floor,nearSurface:+m.near.toFixed(3),objectsSeen:m.seen.filter(id=>contents.some(c=>c.id===id))};});
 // Speeds in m/s between frames, to report the ramps.
 const speeds=samples.slice(1).map((p,i)=>Math.hypot(p.x-samples[i].x,p.y-samples[i].y)/1000*fps);
 return {roomId,roomName:room.name,status:'ok',lensMm:best.lens,sensorWidthMm:sensor,hfovDeg:+(best.hfov/DEG).toFixed(2),eyeHeightMm:eyeH,move:{kind:chosen.kind,distanceMm:chosen.dist,...(chosen.kind==='pan'?{panDeg:chosen.panDeg}:{}),minWallClearanceMm:chosen.minWallClearanceMm,checkedSubsamples:checked},
  seconds,frames,fps,maxSpeedMs:+Math.max(0,...speeds).toFixed(3),contents:contents.map(c=>c.id),vantage:hostId===roomId?'inside':hostId==='threshold'?'door threshold':'doorway from '+hostId,predicted:{targetFloor:+best.floor.toFixed(3),nearSurface:+best.near.toFixed(3),targetShare:+best.share.toFixed(3),maxNeighbourShare:+best.other.toFixed(3),contentSeen:+best.content.toFixed(3)},anchors,samples};
}

// Plan (mm, y down) to Blender (m, z up), the same mapping as scripts/interop/export.cjs + glTF import.
function toBlender(sc,p,eyeH){const c=sc.center;return {location:[(p.x-c.x)/1000,-(p.y-c.y)/1000,eyeH/1000],direction:[Math.cos(p.yaw)*Math.cos(p.pitch),-Math.sin(p.yaw)*Math.cos(p.pitch),-Math.sin(p.pitch)]};}

function compose(project,{rooms,fps=30,...o}={}){
 const sc=scene(project),ids=rooms||sc.rooms.filter(r=>r.area>=1.5).map(r=>r.id),shots=[];let frame=0;
 for(const id of ids){const s=composeRoom(sc,id,{fps,...o});if(s.status==='ok'){s.startFrame=frame;frame+=s.frames;s.blender=s.samples.map(p=>toBlender(sc,p,s.eyeHeightMm));}shots.push(s);}
 return {format:'floorplan-offline-pilot-shots',version:VERSION,projectId:project.id,projectRevision:project.updatedAt,fps,totalFrames:frame,coordinateMapping:{plan:'mm, x right, y down',blender:'m, x right, y up (=-plan y), z up; origin at Core.geometry center',centerMm:sc.center},transitions:'hard cut between rooms; the camera never moves between rooms',shots};
}
module.exports={compose,composeRoom,scene,measure,freeTest,profile,hitBox,insidePoly,edgeDist,VERSION};
if(require.main===module){const fs=require('node:fs'),[src,out,list]=process.argv.slice(2);if(!src||!out){console.error('Usage: node shots.cjs project.json NEW-shots.json [room,ids]');process.exit(1);}
 if(fs.existsSync(out)){console.error('Refusing overwrite: '+out);process.exit(1);}const t=Date.now(),r=compose(JSON.parse(fs.readFileSync(src,'utf8')),{rooms:list?list.split(','):undefined});r.composeMs=Date.now()-t;fs.writeFileSync(out,JSON.stringify(r)+'\n',{flag:'wx'});
 for(const s of r.shots)console.log(s.roomId,s.status,s.vantage,s.lensMm,s.move?.kind,s.move?.distanceMm,JSON.stringify(s.predicted),s.anchors?.map(a=>(a.share[s.roomId]||0).toFixed(2)).join('/'));console.log('ms',r.composeMs);}
