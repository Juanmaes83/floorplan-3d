// Independent 2.5D visibility metric for QA (not product code). Runs in the page.
// Rays from the actual camera pose against wall/lintel/sill boxes and the floor; first hit is classified
// by the room that contains the hit point backed off 30 mm toward the camera. Furniture is ignored.
module.exports=function measure({roomId,cols=80,rows=50,pose:given,cut:givenCut,region}={}){
 const app=FloorPlanApp,g=app.geometry,pose=given||View3D.cameraState,insp=View3D.presentationInspect();
 const OX=g.center.x,OY=g.center.y,cut=givenCut??insp?.options?.cut??2.8;
 const R=region||[0,0,1,1];
 const maxH=Math.max(app.project.defaults.wallHeightMm,...app.project.walls.map(w=>w.heightMm||0))/1000,top=cut===2.8?maxH:cut;
 const inside=(poly,x,y)=>{let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;};
 const boxes=[];
 const add=(r,y0,y1)=>{if(y1>y0+1e-6&&r?.center)boxes.push({cx:(r.center[0]-OX)/1000,cz:(r.center[1]-OY)/1000,a:r.angle||0,hx:r.spanMm/2000,hz:r.thickness/2000,y0,y1});};
 g.walls.filter(w=>w.status!=='demolished').forEach(w=>add(w,0,Math.min(top,w.height??maxH)));
 g.windows.forEach(w=>{add(w,0,Math.min(top,w.sill??0));add(w,Math.min(top,w.head??top),top);});
 g.doors.forEach(d=>add(d.rect,Math.min(top,d.height??2.1),top));
 g.slides.forEach(d=>add(d.rect,Math.min(top,d.height??2.1),top));
 const [qx,qy,qz,qw]=pose.quaternion,rot=v=>{const [x,y,z]=v,ix=qw*x+qy*z-qz*y,iy=qw*y+qz*x-qx*z,iz=qw*z+qx*y-qy*x,iw=-qx*x-qy*y-qz*z;return [ix*qw+iw*-qx+iy*-qz-iz*-qy,iy*qw+iw*-qy+iz*-qx-ix*-qz,iz*qw+iw*-qz+ix*-qy-iy*-qx];};
 const P=pose.position,tanV=Math.tan(pose.fov*Math.PI/360),tanH=tanV*pose.aspect;
 const cast=(d,limit=Infinity)=>{let best=limit,kind=null;
  if(d[1]<-1e-9){const t=-P[1]/d[1];if(t<best){best=t;kind='floor';}}
  for(const b of boxes){const c=Math.cos(b.a),s=Math.sin(b.a),ox=P[0]-b.cx,oz=P[2]-b.cz;
   // world (x,z) -> local: rotate by -angle; plan y maps to world z with same orientation
   const lx=ox*c+oz*s,lz=-ox*s+oz*c,dx=d[0]*c+d[2]*s,dz=-d[0]*s+d[2]*c;let t0=-Infinity,t1=Infinity,face=null;
   for(const [o,v,lo,hi,f] of [[lx,dx,-b.hx,b.hx,'side'],[P[1],d[1],b.y0,b.y1,'y'],[lz,dz,-b.hz,b.hz,'side']]){
    if(Math.abs(v)<1e-12){if(o<lo||o>hi){t0=Infinity;break;}continue;}
    let a=(lo-o)/v,bb=(hi-o)/v,ff=f==='y'?(v<0?'top':'bottom'):'side';if(a>bb)[a,bb]=[bb,a];if(a>t0){t0=a;face=ff;}t1=Math.min(t1,bb);}
   if(t0<=t1&&t0>1e-6&&t0<best){best=t0;kind=face==='top'?'wallTop':'wall';}}
  return {t:best,kind};};
 const room=(x,z)=>{const mx=x*1000+OX,my=z*1000+OY;const r=g.rooms.find(r=>r.counted!==false&&inside(r.poly,mx,my))||g.rooms.find(r=>inside(r.poly,mx,my));return r?r.id:'outside';};
 const counts={},near={wall:0,floor:0};let total=0,dist=[];
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
  const fx=R[0]+(R[2]-R[0])*(i+.5)/cols,fy=R[1]+(R[3]-R[1])*(j+.5)/rows,u=(fx*2-1)*tanH,v=(1-fy*2)*tanV,dl=rot([u,v,-1]),n=Math.hypot(...dl),d=dl.map(x=>x/n),h=cast(d);total++;
  let cls='void';if(h.kind){const t=h.kind==='floor'?h.t:h.t-.03,x=P[0]+d[0]*t,z=P[2]+d[2]*t;cls=h.kind==='wallTop'?'wallTop':room(x,z);dist.push(h.t);
   if(h.kind==='wall'&&h.t<1.0)near.wall++;if(h.kind==='floor'&&h.t<1.6)near.floor++;}
  counts[cls]=(counts[cls]||0)+1;}
 const share={};for(const [k,v] of Object.entries(counts))share[k]=+(v/total).toFixed(3);
 const others=Object.entries(share).filter(([k])=>k!==roomId&&!['void','wallTop','outside'].includes(k)).sort((a,b)=>b[1]-a[1]);
 let vis=0,inFrame=0,samples=0;const r=g.rooms.find(r=>r.id===roomId);
 if(r){const xs=r.poly.map(p=>p[0]),ys=r.poly.map(p=>p[1]);const step=Math.max(80,Math.sqrt((Math.max(...xs)-Math.min(...xs))*(Math.max(...ys)-Math.min(...ys))/400));
  const inv=v=>{const [x,y,z]=v,qi=[-qx,-qy,-qz,qw];const [a,b,c,w]=qi;const ix=w*x+b*z-c*y,iy=w*y+c*x-a*z,iz=w*z+a*y-b*x,iw=-a*x-b*y-c*z;return [ix*w+iw*-a+iy*-c-iz*-b,iy*w+iw*-b+iz*-a-ix*-c,iz*w+iw*-c+ix*-b-iy*-a];};
  for(let x=Math.min(...xs)+step/2;x<Math.max(...xs);x+=step)for(let y=Math.min(...ys)+step/2;y<Math.max(...ys);y+=step){if(!inside(r.poly,x,y))continue;samples++;
   const w=[(x-OX)/1000-P[0],.01-P[1],(y-OY)/1000-P[2]],c=inv(w);if(c[2]>=0)continue;const nx=c[0]/-c[2]/tanH,ny=c[1]/-c[2]/tanV;const sx=(nx+1)/2,sy=(1-ny)/2;if(sx<R[0]||sx>R[2]||sy<R[1]||sy>R[3])continue;inFrame++;
   const L=Math.hypot(...w),h=cast(w.map(v=>v/L),L-.02);if(!h.kind||h.kind==='floor')vis++;}}
 dist.sort((a,b)=>a-b);
 const dx=pose.position,tq=insp?.target;let pitch=null,height=dx[1];
 const f=rot([0,0,-1]);pitch=+(Math.asin(-f[1])*180/Math.PI).toFixed(1);
 return {roomId,cut,top,share,target:share[roomId]||0,topOther:others[0]||null,floorSamples:samples,floorInFrame:+(inFrame/Math.max(1,samples)).toFixed(3),floorVisible:+(vis/Math.max(1,samples)).toFixed(3),
  pitchDownDeg:pitch,height:+height.toFixed(3),medianHitM:dist.length?+dist[dist.length>>1].toFixed(2):null,nearWall:+(near.wall/total).toFixed(3),nearFloor:+(near.floor/total).toFixed(3),fov:pose.fov,aspect:+pose.aspect.toFixed(3)};
};
