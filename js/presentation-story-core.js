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
   «Sección visual» (sectionOpen, FT3D-3): the overview, a vertical cut entering the same model, the frontal section,
   a dolly zoom that opens the perspective and the overview again with the cut still on (see below).
   Further narratives (exploded axonometric…) are added as new builders in NARRATIVES. */
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
 /* «Sección visual» (sectionOpen, FT3D-3): the plan's vertical cut (FloorPlanPresentationSection) on the same model.
    - p = 0: the overview pose of the level, the plane outside the envelope (nothing cut);
    - 0 → sweepEnd: the camera turns to face the cut (horizontal, along the plane normal) while the lens narrows to an
      almost flat reading (same principle as planReveal: distance ≥ flatness × depth behind the cut) and the plane
      enters from just in front of the envelope to its target;
    - sweepEnd → holdEnd: frontal section, plane still, cut faces shown;
    - holdEnd → dollyEnd: dolly zoom — the lens opens to the overview's while the camera approaches, the framed size at
      the cut stays the same (apparent size preserved);
    - dollyEnd → openEnd: the camera turns to the overview direction and distance, revealing the depth behind the cut;
    - openEnd → 1: exactly the overview pose, the section still active. Ending the scene restores the model.
    input: plane {normal:[x,0,z] world unit towards the camera, start, target} (offsets along the normal, metres);
    line {from:[x,z], to:[x,z]} world; wallTop (built top, m); depth (envelope along the normal, m);
    end {position, target, fov} (the overview pose); aspect; region; base {near, far}. */
 const SECTION_OPEN={sweepEnd:.3,holdEnd:.45,dollyEnd:.68,openEnd:.92,reducedHold:.96,flatness:20,minFovDeg:1.5,maxFovDeg:8,margin:.1,playMs:7000};
 function sectionOpen(input){
  const o={...SECTION_OPEN,...(input.options||{})},end=input.end,plane=input.plane,line=input.line;
  if(!end||![...end.position,...end.target,end.fov].every(Number.isFinite))throw Error('Falta la vista general de destino.');
  if(!plane||![...plane.normal,plane.start,plane.target].every(Number.isFinite)||!line||![...line.from,...line.to].every(Number.isFinite))throw Error('La sección no tiene plano.');
  const aspect=Math.max(.2,Number(input.aspect)||1),wallTop=Math.max(.5,Number(input.wallTop)||2.8),depth=Math.max(1,Number(input.depth)||1),base={near:input.base?.near??.05,far:input.base?.far??300};
  const r=region(input.region),m=.06,nx0=2*r[0]-1+m,nx1=2*r[2]-1-m,ny0=1-2*r[3]+m,ny1=1-2*r[1]-m,cx=(nx0+nx1)/2,cy=(ny0+ny1)/2,hx=(nx1-nx0)/2,hy=(ny1-ny0)/2;
  const offset1=sub(end.position,end.target),d1=len(offset1),dir1=norm(offset1),fov1=end.fov,tan1=Math.tan(rad(fov1)/2),frame1=2*d1*tan1;
  const n=norm([plane.normal[0],0,plane.normal[2]]),f0=mul(n,-1),ax=axes(f0);
  const width=Math.hypot(line.to[0]-line.from[0],line.to[1]-line.from[1]);
  const centre=[(line.from[0]+line.to[0])/2,wallTop/2,(line.from[1]+line.to[1])/2];
  // Frontal framing: the cut (width × built height) fits the free region with a margin.
  const half=Math.max(wallTop/2/hy,width/2/(hx*aspect))*(1+o.margin),frame0=2*half;
  const fov0=Math.min(fov1,Math.max(o.minFovDeg,Math.min(o.maxFovDeg,deg(2*Math.atan(frame0/2/(o.flatness*depth))))));
  const tan0=Math.tan(rad(fov0)/2),d0=frame0/2/tan0;
  // The cut centre sits at the centre of the free region; the shift only depends on the framed size, so it holds
  // through the dolly zoom.
  const target0=add(add(centre,mul(ax.right,-cx*frame0/2*aspect)),mul(ax.up,-cy*frame0/2));
  const az=v=>Math.atan2(v[2],v[0]),el=v=>Math.asin(Math.max(-1,Math.min(1,v[1])));
  const az1=az(dir1),el1=el(dir1),az0=az(n),el0=0,turn=Math.atan2(Math.sin(az0-az1),Math.cos(az0-az1));
  const dirAt=(e,a)=>[Math.cos(e)*Math.cos(a),Math.sin(e),Math.cos(e)*Math.sin(a)];
  const reach=width/2+depth+wallTop;
  const nearFar=d=>({near:Math.max(base.near,(d-reach)*.5),far:Math.max(base.far,d+reach*2)});
  const span=(p,a,b)=>smooth((p-a)/(b-a));
  const overview=(p,phase,offset,caps)=>({p,phase,position:[...end.position],target:[...end.target],fov:fov1,near:base.near,far:base.far,distance:d1,frameHeight:frame1,offset,caps,sectionVisible:p>0});
  function pose(dir,tan,frame,target){const d=frame/2/tan;return {position:add(target,mul(dir,d)),target,fov:deg(2*Math.atan(tan)),distance:d,frameHeight:frame,...nearFar(d)};}
  function stateAt(raw){
   const p=clamp01(Number(raw)||0);
   if(p<=0)return overview(0,'overview',plane.start,false);
   if(p>=o.openEnd)return overview(p,'overview-cut',plane.target,true);
   if(p<o.sweepEnd){
    // Overview → frontal: lens and framed size interpolated geometrically (as planReveal, reversed), azimuth by the
    // shortest turn, elevation down to the horizontal; the plane enters at the same pace.
    const s=smooth(p/o.sweepEnd),tan=tan1*Math.pow(tan0/tan1,s),frame=frame1*Math.pow(frame0/frame1,s);
    return {p,phase:'cut',...pose(dirAt(lerp(el1,el0,s),az1+turn*s),tan,frame,lerp3(end.target,target0,s)),offset:plane.start+(plane.target-plane.start)*s,caps:false,sectionVisible:true};
   }
   if(p<o.holdEnd)return {p,phase:'front',...pose(n,tan0,frame0,target0),offset:plane.target,caps:true,sectionVisible:true};
   if(p<o.dollyEnd){
    // Dolly zoom: same framed size at the cut, the lens opens to the overview's.
    const t=span(p,o.holdEnd,o.dollyEnd),tan=tan0*Math.pow(tan1/tan0,t);
    return {p,phase:'open',...pose(n,tan,frame0,target0),offset:plane.target,caps:true,sectionVisible:true};
   }
   // Turn to the overview direction and distance; near/far reach the view's own values at the end.
   const t=span(p,o.dollyEnd,o.openEnd),st=pose(dirAt(lerp(el0,el1,t),az0-turn*t),tan1,frame0*Math.pow(frame1/frame0,t),lerp3(target0,end.target,t));
   return {p,phase:'open',...st,near:lerp(st.near,base.near,t),far:lerp(st.far,base.far,t),offset:plane.target,caps:true,sectionVisible:true};
  }
  return {kind:'section-open',stateAt,checkpoints:[0,.25,.5,.75,1],info:{fovFront:fov0,fovEnd:fov1,distanceFront:d0,distanceEnd:d1,frameFront:frame0,frameEnd:frame1,width,depth,wallTop,turnDeg:deg(turn),playMs:o.playMs,reducedHold:o.reducedHold,options:o}};
 }
 const NARRATIVES={'plan-reveal':planReveal,'room-descent':roomDescent,'section-open':sectionOpen};
 /* FT3D-2 — a story: a sequence of narratives played as one progress P ∈ [0,1]. Each scene takes a share of P
    proportional to its weight (its play time), so locate(P) → {i, p} and at(i, p) → P are pure and inverse of each other:
    the same P is always the same scene at the same local p, forwards or backwards. A boundary belongs to the next scene
    (p = 0), except P = 1, which is the end of the last one. */
 function sequence(weights){
  const w=(weights||[]).map(x=>Math.max(1e-6,Number(x)||0));if(!w.length)throw Error('La historia no tiene escenas.');
  const total=w.reduce((n,x)=>n+x,0),starts=[];let acc=0;for(const x of w){starts.push(acc/total);acc+=x;}
  const share=i=>w[i]/total;
  function locate(raw){const P=clamp01(Number(raw)||0);if(P>=1)return {i:w.length-1,p:1};let i=w.length-1;while(i>0&&P<starts[i]-1e-12)i--;return {i,p:clamp01((P-starts[i])/share(i))};}
  const at=(i,p)=>{const k=Math.min(w.length-1,Math.max(0,i|0));return clamp01(starts[k]+clamp01(p)*share(k));};
  return {count:w.length,starts:[...starts],total,locate,at};
 }
 // Play time of a scene before it is built (the narrative refines it once it knows the project): stable shares of P.
 const SCENE_MS={'plan-reveal':6000,'room-descent':3500,'section-open':7000};
 function create(kind,input){const build=NARRATIVES[kind];if(!build)throw Error(`Narrativa desconocida: ${kind}`);return build(input);}
 // Wall-clock duration of a play from p to q (ms): proportional to the distance travelled, never a fixed copied time.
 function playMs(from,to,{fullMs=6000,reduced=false}={}){return reduced?0:Math.round(Math.abs(clamp01(to)-clamp01(from))*fullMs);}
 return {create,planReveal,roomDescent,sectionOpen,sequence,playMs,smooth,NARRATIVES:Object.keys(NARRATIVES),SCENE_MS,PLAN_REVEAL,ROOM_DESCENT,SECTION_OPEN};
});
