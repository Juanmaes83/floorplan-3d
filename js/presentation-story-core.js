/* Presentation Story (FT3D-1a): pure narratives over the one real model. No DOM, no Three.js, no project edits.
   A narrative is built from facts of the open project (plan corners, wall top) and the end pose that the existing
   presentation computes for its overview stop; it returns stateAt(p), a deterministic function of progress p ∈ [0,1].
   The same p always gives the same state, so playing, scrubbing, reversing (1 → 0) or replaying are the same thing.

   «Del plano a la vivienda» (planReveal):
   - p = 0: the plan as the editor shows it — north up, and when the 2D view is given (start), its very centre and
     framing — seen with a narrow lens (near-orthographic), walls and furniture flattened;
   - walls and furniture rise while the lens opens (dolly zoom): the field of view widens and the camera approaches so
     that the framed size at the target stays continuous; the camera tilts and turns from north-up to the overview;
   - p = 1: exactly the end pose (the presentation overview), field of view and walls at full height.
   Lens and timings are derived for Rubik: the narrow lens is the widest one at which the tallest wall stays within
   1 % of perspective difference between its foot and its top (distance ≥ 100 × wall top), never copied values.
   «Entrar en la estancia» (roomDescent, FT3D-1b): from the overview down to the presentation's own pose of the first
   chosen room. The camera follows the arc of the editor's flights (spherical interpolation around a moving target,
   as View3D's camTween), so it reads as Rubik's usual motion, now driven by p; when that room is framed with a lower
   wall section, the walls go down continuously to that height and, once there (p ≥ wallsEnd), the real section
   takes over (state.section): the swap happens while the camera still moves and p = 1 is exactly the room stop.
   Further narratives (section sweep, open section, exploded axonometric…) are added as new builders in NARRATIVES. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanPresentationStory=api;})(typeof self!=='undefined'?self:this,function(){
 'use strict';
 const clamp01=v=>Math.min(1,Math.max(0,v));
 const smooth=t=>{t=clamp01(t);return t*t*(3-2*t);};
 const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],mul=(a,k)=>[a[0]*k,a[1]*k,a[2]*k];
 const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],len=a=>Math.sqrt(dot(a,a)),norm=a=>{const l=len(a);return l>0?mul(a,1/l):[0,1,0];};
 const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 const lerp=(a,b,t)=>a+(b-a)*t,lerp3=(a,b,t)=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)];
 const rad=d=>d*Math.PI/180,deg=r=>r*180/Math.PI;
 // Phases of «Del plano a la vivienda» on p (hold the plan, raise the walls, open the lens). The lens starts while the
 // walls rise, so the rising walls are seen; the walls are complete before the last quarter of the lens.
 const PLAN_REVEAL={hold:.08,wallsEnd:.6,furnitureStart:.2,furnitureEnd:.7,lensStart:.12,minWallScale:.012,minFurnitureScale:.001,flatness:100,minFovDeg:1.5,maxFovDeg:8,margin:.08,elevationDeg:89.9};
 // Screen axes of a camera looking along f (world up = +y), as in the 3D view.
 function axes(f){const right=norm(cross(f,[0,1,0]));return {right,up:norm(cross(right,f))};}
 function region(r){return r&&r[2]-r[0]>.25&&r[3]-r[1]>.25?r:[0,0,1,1];}
 /* input:
    corners: [[x,z],…] world metres of the plan (at least 3); wallTop: metres;
    end: {position:[x,y,z], target:[x,y,z], fov} — the overview pose of the presentation (fov in degrees);
    aspect: viewport width/height; region: [x0,y0,x1,y1] free area of the screen (0–1) or null, the one the end pose
    was framed for; startRegion: the free area while the narrative's own controls are shown (frames the plan), or region;
    base: {near, far} of the view, restored at p = 1;
    start (optional): {target:[x,y,z], frameHeight} — the 2D editor view the presentation comes from: p = 0 is that very
    view (same centre and framed height, north up), so the plan the person was looking at becomes the home. */
 function planReveal(input){
  const o={...PLAN_REVEAL,...(input.options||{})};
  const corners=(input.corners||[]).filter(c=>Array.isArray(c)&&Number.isFinite(c[0])&&Number.isFinite(c[1]));
  if(corners.length<3)throw Error('El plano no tiene contorno para la narrativa.');
  const end=input.end;if(!end||![...end.position,...end.target,end.fov].every(Number.isFinite))throw Error('Falta la vista general de destino.');
  const aspect=Math.max(.2,Number(input.aspect)||1),wallTop=Math.max(.5,Number(input.wallTop)||2.8),base={near:input.base?.near??.05,far:input.base?.far??300};
  const r0=region(input.startRegion||input.region),m=.06,nx0=2*r0[0]-1+m,nx1=2*r0[2]-1-m,ny0=1-2*r0[3]+m,ny1=1-2*r0[1]-m,cx=(nx0+nx1)/2,cy=(ny0+ny1)/2,hx=(nx1-nx0)/2,hy=(ny1-ny0)/2;
  // End: direction, distance and framed height (at the target) of the overview pose.
  const offset1=sub(end.position,end.target),d1=len(offset1),dir1=norm(offset1),fov1=end.fov,tan1=Math.tan(rad(fov1)/2),frame1=2*d1*tan1;
  // Start: seen from (almost) straight above with north up, as the 2D editor (its camera sits on +z of the target, so
  // the top of the screen is −z, the top of the plan). The azimuth turns to the overview's by the shortest way.
  const azimuth1=Math.atan2(dir1[2],dir1[0]),azimuth0=Math.PI/2,turn=Math.atan2(Math.sin(azimuth1-azimuth0),Math.cos(azimuth1-azimuth0));
  const elev1=Math.asin(Math.max(-1,Math.min(1,dir1[1]))),elev0=rad(o.elevationDeg);
  const dirAt=(e,a)=>[Math.cos(e)*Math.cos(a),Math.sin(e),Math.cos(e)*Math.sin(a)];
  const dir0=dirAt(elev0,azimuth0),f0=mul(dir0,-1),ax0=axes(f0);
  const start=input.start&&Array.isArray(input.start.target)&&input.start.target.every(Number.isFinite)&&Number(input.start.frameHeight)>0?input.start:null;
  const xs=corners.map(c=>c[0]),zs=corners.map(c=>c[1]),center=[(Math.min(...xs)+Math.max(...xs))/2,0,(Math.min(...zs)+Math.max(...zs))/2];
  // Plan framing from above: half-height at the target plane so every corner fits the free region with a margin.
  let half=0;for(const [x,z] of corners){const v=[x-center[0],0,z-center[2]];half=Math.max(half,Math.abs(dot(v,ax0.up))/hy,Math.abs(dot(v,ax0.right))/(hx*aspect));}
  half*=1+o.margin;const frame0=start?Number(start.frameHeight):2*Math.max(.5,half);
  // Narrow lens: widest field of view with distance ≥ flatness × wall top, within [minFov, maxFov] and below the end fov.
  const fov0=Math.min(fov1,Math.max(o.minFovDeg,Math.min(o.maxFovDeg,deg(2*Math.atan(frame0/2/(o.flatness*wallTop))))));
  const tan0=Math.tan(rad(fov0)/2),d0=frame0/2/tan0;
  // The plan centre sits at the centre of the free region (as overviewPose does for the 3D view).
  const target0=start?[start.target[0],0,start.target[2]]:add(add(center,mul(ax0.right,-cx*tan0*aspect*d0)),mul(ax0.up,-cy*tan0*d0));
  const reach=Math.max(...corners.map(([x,z])=>Math.hypot(x-center[0],z-center[2])))+wallTop;
  const lensAt=p=>smooth((p-o.lensStart)/(1-o.lensStart));
  const wallsAt=p=>lerp(o.minWallScale,1,smooth((p-o.hold)/(o.wallsEnd-o.hold)));
  const furnitureAt=p=>lerp(o.minFurnitureScale,1,smooth((p-o.furnitureStart)/(o.furnitureEnd-o.furnitureStart)));
  function stateAt(raw){
   const p=clamp01(Number(raw)||0);
   if(p>=1)return {p:1,phase:'3d',wallScale:1,furnitureScale:1,lens:1,fov:fov1,position:[...end.position],target:[...end.target],near:base.near,far:base.far,distance:d1,frameHeight:frame1};
   const s=lensAt(p);
   // tan(fov/2) and the framed height are interpolated geometrically: the size change per step is even (dolly zoom).
   const tanS=tan0*Math.pow(tan1/tan0,s),frame=frame0*Math.pow(frame1/frame0,s),d=frame/2/tanS,fov=deg(2*Math.atan(tanS));
   const dir=dirAt(lerp(elev0,elev1,s),azimuth0+turn*s),target=lerp3(target0,end.target,s),position=add(target,mul(dir,d));
   const near=Math.max(base.near,(d-reach)*.5),far=Math.max(base.far,d+reach*2);
   return {p,phase:p<o.hold?'plan':s<=0?'walls':'lens',wallScale:wallsAt(p),furnitureScale:furnitureAt(p),lens:s,fov,position,target,near,far,distance:d,frameHeight:frame};
  }
  return {kind:'plan-reveal',stateAt,checkpoints:[0,.25,.5,.75,1],info:{fromEditorView:!!start,turnDeg:deg(turn),fovStart:fov0,fovEnd:fov1,distanceStart:d0,distanceEnd:d1,frameStart:frame0,frameEnd:frame1,wallTop,playMs:6000,options:o}};
 }
 const ROOM_DESCENT={wallsStart:.15,wallsEnd:.75,speed:3,minMs:1800,maxMs:4200};
 // Spherical offset of a camera around its target (radius, polar angle from +y, azimuth), as THREE.Spherical.
 function spherical(v){const r=len(v);return {r,phi:r>0?Math.acos(Math.max(-1,Math.min(1,v[1]/r))):0,theta:Math.atan2(v[0],v[2])};}
 const fromSpherical=({r,phi,theta})=>[r*Math.sin(phi)*Math.sin(theta),r*Math.cos(phi),r*Math.sin(phi)*Math.cos(theta)];
 /* input: start/end: {position, target, fov} (start = the overview pose, end = the room stop pose);
    wallScaleEnd: wall height of the room framing over the height the walls are built at (1 = no section);
    base: {near, far}. */
 function roomDescent(input){
  const o={...ROOM_DESCENT,...(input.options||{})},A=input.start,B=input.end;
  for(const pose of [A,B])if(!pose||![...pose.position,...pose.target,pose.fov].every(Number.isFinite))throw Error('Faltan las vistas de inicio o de la estancia.');
  const wallEnd=Math.min(1,Math.max(.05,Number(input.wallScaleEnd)||1)),base={near:input.base?.near??.05,far:input.base?.far??300};
  const sa=spherical(sub(A.position,A.target)),sb=spherical(sub(B.position,B.target));let dth=sb.theta-sa.theta;dth=Math.atan2(Math.sin(dth),Math.cos(dth));
  const travel=Math.hypot(...sub(B.position,A.position));
  const ms=Math.round(Math.min(o.maxMs,Math.max(o.minMs,travel/o.speed*1000)));
  function stateAt(raw){
   const p=clamp01(Number(raw)||0);
   const section=wallEnd<1&&p>=o.wallsEnd;
   if(p>=1)return {p:1,phase:'room',wallScale:1,section,fov:B.fov,position:[...B.position],target:[...B.target],near:base.near,far:base.far,distance:sb.r};
   if(p<=0)return {p:0,phase:'overview',wallScale:1,section:false,fov:A.fov,position:[...A.position],target:[...A.target],near:base.near,far:base.far,distance:sa.r};
   const e=smooth(p),r=lerp(sa.r,sb.r,e),target=lerp3(A.target,B.target,e),off=fromSpherical({r,phi:lerp(sa.phi,sb.phi,e),theta:sa.theta+dth*e});
   return {p,phase:'descent',wallScale:section?1:lerp(1,wallEnd,smooth((p-o.wallsStart)/(o.wallsEnd-o.wallsStart))),section,fov:lerp(A.fov,B.fov,e),position:add(target,off),target,near:base.near,far:base.far,distance:r};
  }
  return {kind:'room-descent',stateAt,checkpoints:[0,.25,.5,.75,1],info:{travel,wallScaleEnd:wallEnd,playMs:ms,options:o}};
 }
 const NARRATIVES={'plan-reveal':planReveal,'room-descent':roomDescent};
 function create(kind,input){const build=NARRATIVES[kind];if(!build)throw Error(`Narrativa desconocida: ${kind}`);return build(input);}
 // Wall-clock duration of a play from p to q (ms): proportional to the distance travelled, never a fixed copied time.
 function playMs(from,to,{fullMs=6000,reduced=false}={}){return reduced?0:Math.round(Math.abs(clamp01(to)-clamp01(from))*fullMs);}
 return {create,planReveal,roomDescent,playMs,smooth,NARRATIVES:Object.keys(NARRATIVES),PLAN_REVEAL,ROOM_DESCENT};
});
