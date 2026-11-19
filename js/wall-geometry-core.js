/* OP-07 · Curved and sloped walls: the single geometric core for walls with `curve` or `heightEndMm` (FloorPlanProject 2.0).
   Promoted unchanged from the SCULPT OP-07 laboratory (labs/sculpt/op-07/wall-geometry-core.js @ f48614f2, 34 tests);
   only this header and the global name differ. project-core, quantity-core, the renderer and the DXF exporter call it;
   a wall without the two fields never reaches it.

   Sculpted from openPlan3D (MIT, © theLodgeStudio; fork Juanmaes83/openPlan3D@771c9e1ad30bd1c3cc7584d6eca74deb2e14943d):
   src/lib/utils/wallProfiles.ts, wallPlanGeometry.ts, splitWallGeometry.ts, slopedWallGeometry.ts, interiorArea.ts and
   roomDetection.ts (ring/area). Exact hashes in MANIFEST.sha256; the licence travels in source/LICENSE.

   What changes from the donor (and why):
   - Units: RUBIK's canonical millimetres (donor: centimetres). Every donor constant is converted (×10).
   - Wall shape: RUBIK's canonical wall plus two OPTIONAL fields proposed in CONTRATO-PROPUESTA.md:
       curve: {control:{x,y}}   quadratic Bézier control point, mm   (donor: curvePoint)
       heightEndMm              height at the end, mm; `heightMm` stays the start height (donor: startHeight/endHeight)
     A wall without them is exactly today's straight, level wall.
   - Openings: RUBIK places them by `offsetMm` (left edge, physical distance along the wall). The donor stores a 0–1
     quadratic PARAMETER and must convert it to a distance; with offsetMm that conversion and its drift disappear.
   - Validation instead of silent clipping: the donor clips an opening that does not fit under a sloped top when it renders.
     RUBIK's canonical validator rejects an opening that exceeds its wall (project-core: 'opening exceeds wall height'), so
     `validateOpening` reports it; the clipping (`pathOpening`) is kept only for drawing.
   - No Three.js: `slopedPiece` returns plain arrays, so any renderer (or a test) can use it.
   It has no dependency: project-core, quantity-core, the renderer and the DXF exporter depend on it, not the reverse. */
(function(root){
 'use strict';
 const FACETS=16; // donor: same quadratic parameterisation for drawing, picking, areas and openings
 const TEXTURE_TILE_MM=2000; // donor WALL_TEXTURE_TILE_CM = 200
 const finite=(...v)=>v.every(Number.isFinite);
 const startHeight=w=>w.heightMm;
 const endHeight=w=>Number.isFinite(w.heightEndMm)?w.heightEndMm:w.heightMm;
 const isCurved=w=>!!(w.curve&&w.curve.control);
 const at=(length,start,end,x)=>start+(end-start)*Math.max(0,Math.min(1,x/length));

 // ── Resolution and exact references (D-OP07-1 quadratic, D-OP07-3: 16 facets baseline, adaptive by metric tolerance) ──
 const MAX_FACETS=1024;
 /** |P0 − 2·P1 + P2| (mm): B'' = 2D is constant on a quadratic, so it fixes curvature and facet error. */
 function bend(w){if(!isCurved(w))return 0;const c=w.curve.control;return Math.hypot(w.start.x-2*c.x+w.end.x,w.start.y-2*c.y+w.end.y);}
 /** Facets of a wall: 1 if straight; 16 (donor baseline) by default; with {toleranceMm} at least 16 and as many as
    needed so that no facet departs from the true curve by more than the tolerance (capped at MAX_FACETS). */
 function facetCount(w,opts={}){if(!isCurved(w))return 1;const tol=opts&&opts.toleranceMm;if(!(tol>0))return FACETS;
  return Math.min(MAX_FACETS,Math.max(FACETS,Math.ceil(Math.sqrt(bend(w)/(4*tol)))));}
 /** Exact maximum distance between the curve and its n uniform-parameter facets: f(mid) − chord = D·h²/4, h = 1/n. */
 const deviationBound=(w,n=facetCount(w))=>bend(w)/(4*n*n);
 const GL5=[[0,.5688888888888889],[-.5384693101056831,.4786286704993665],[.5384693101056831,.4786286704993665],[-.906179845938664,.2369268850561891],[.906179845938664,.2369268850561891]];
 function integrate(f,a,b,n=64){let s=0;const h=(b-a)/n;for(let i=0;i<n;i++){const m=a+h*(i+.5);for(const [x,k] of GL5)s+=k*f(m+x*h/2);}return s*h/2;}
 function speed(w,t){if(!isCurved(w))return Math.hypot(w.end.x-w.start.x,w.end.y-w.start.y);const c=w.curve.control;
  return Math.hypot(2*(1-t)*(c.x-w.start.x)+2*t*(w.end.x-c.x),2*(1-t)*(c.y-w.start.y)+2*t*(w.end.y-c.y));}
 /** Height model (donor): linear in the curve parameter. */
 const heightAtParam=(w,t)=>startHeight(w)+(endHeight(w)-startHeight(w))*t;
 /** True (non-faceted) references, for precision tests and tolerance reports. */
 const arcLength=(w,t0=0,t1=1)=>integrate(t=>speed(w,t),t0,t1);
 const trueGross=w=>integrate(t=>speed(w,t)*heightAtParam(w,t),0,1);
 /** Smallest radius of curvature (mm). B'(t) = 2a + 2tD and B'×B'' = 4·a×D is constant, so the minimum is at the
    slowest point. 0 = the curve folds back on itself; Infinity = straight. */
 function minRadius(w){if(!isCurved(w))return Infinity;const c=w.curve.control,a={x:c.x-w.start.x,y:c.y-w.start.y},D={x:w.start.x-2*c.x+w.end.x,y:w.start.y-2*c.y+w.end.y},dd=D.x*D.x+D.y*D.y;
  if(dd===0)return Infinity;const t=Math.max(0,Math.min(1,-(a.x*D.x+a.y*D.y)/dd)),sp=Math.hypot(2*a.x+2*t*D.x,2*a.y+2*t*D.y),cross=Math.abs(a.x*D.y-a.y*D.x);
  if(sp<1e-9)return 0;return cross===0?Infinity:sp**3/(4*cross);}
 /** Proposed wall rules (CONTRATO-PROPUESTA §3). */
 function validateWall(w){const issues=[];
  if(isCurved(w)&&!finite(w.curve.control.x,w.curve.control.y))issues.push('invalid curve control');
  else{const r=minRadius(w);if(r===0)issues.push('curve folds back');else if(r<w.thicknessMm/2)issues.push('curve too tight for wall thickness');}
  if('heightEndMm' in w&&!(Number.isFinite(w.heightEndMm)&&w.heightEndMm>0))issues.push('invalid end height');
  return issues;}

 // ── Path ─────────────────────────────────────────────────────────────────────────────────────────────────────────
 function point(w,t){const c=isCurved(w)?w.curve.control:null;
  return c?{x:(1-t)**2*w.start.x+2*(1-t)*t*c.x+t*t*w.end.x,y:(1-t)**2*w.start.y+2*(1-t)*t*c.y+t*t*w.end.y}
   :{x:w.start.x+(w.end.x-w.start.x)*t,y:w.start.y+(w.end.y-w.start.y)*t};}
 /** donor wallPathSpans */
 function pathSpans(w,opts){const count=facetCount(w,opts),h0=startHeight(w),h1=endHeight(w);
  return Array.from({length:count},(_,i)=>({start:point(w,i/count),end:point(w,(i+1)/count),startHeight:h0+(h1-h0)*i/count,endHeight:h0+(h1-h0)*(i+1)/count}));}
 /** donor wallPathProfile; adds paramAt (distance → parameter), the inverse RUBIK needs to split at a distance. */
 function pathProfile(w,opts){
  let length=0;
  const spans=pathSpans(w,opts).map(span=>{const from=length,size=Math.hypot(span.end.x-span.start.x,span.end.y-span.start.y);length+=size;return {...span,from,to:length,length:size};});
  const sample=distance=>{const d=Math.max(0,Math.min(length,distance)),span=spans.find(s=>s.length>0&&d<=s.to)??spans[spans.length-1];
   const t=span.length>0?Math.max(0,Math.min(1,(d-span.from)/span.length)):0;
   return {point:{x:span.start.x+(span.end.x-span.start.x)*t,y:span.start.y+(span.end.y-span.start.y)*t},height:span.startHeight+(span.endHeight-span.startHeight)*t};};
  return {length,spans,sample,
   distanceAt(position){if(!Number.isFinite(position))return NaN;const scaled=Math.max(0,Math.min(1,position))*spans.length,index=Math.min(spans.length-1,Math.floor(scaled));return spans[index].from+(scaled-index)*spans[index].length;},
   paramAt(distance){if(!Number.isFinite(distance))return NaN;const d=Math.max(0,Math.min(length,distance)),i=Math.max(0,spans.findIndex(s=>s.length>0&&d<=s.to));const s=spans[i];return (i+(s.length>0?(d-s.from)/s.length:0))/spans.length;}};
 }
 /** donor wallPlanBounds: exact quadratic extrema, expanded by half the thickness. */
 function bounds(w){const pts=[w.start,w.end];
  if(isCurved(w))for(const axis of ['x','y']){const a=w.start[axis],c=w.curve.control[axis],b=w.end[axis],den=a-2*c+b,t=den?(a-c)/den:-1;if(t>0&&t<1)pts.push(point(w,t));}
  const half=Math.max(0,w.thicknessMm)/2;
  return {minX:Math.min(...pts.map(p=>p.x))-half,maxX:Math.max(...pts.map(p=>p.x))+half,minY:Math.min(...pts.map(p=>p.y))-half,maxY:Math.max(...pts.map(p=>p.y))+half};}
 /** donor wallPlanDimension (label offsets 8 cm / 20 cm → 80 mm / 200 mm). */
 function dimension(w){const path=pathProfile(w),middle=path.length/2,p=path.sample(middle).point;
  if(!isCurved(w))return {length:Math.round(path.length),point:{x:p.x,y:p.y-80}};
  const a=path.sample(Math.max(0,middle-10)).point,b=path.sample(Math.min(path.length,middle+10)).point,dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy)||1,off=Math.max(0,w.thicknessMm)/2+200;
  return {length:Math.round(path.length),point:{x:p.x+dy/l*off,y:p.y-dx/l*off}};}
 /** donor splitWallGeometry: exact de Casteljau subdivision at parameter t. */
 function split(w,t){const lerp=(a,b)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t}),c=isCurved(w)?w.curve.control:null;
  const c1=c?lerp(w.start,c):undefined,c2=c?lerp(c,w.end):undefined,mid=c1&&c2?lerp(c1,c2):lerp(w.start,w.end);
  return {first:{start:w.start,end:mid,...(c1?{curve:{control:c1}}:{})},second:{start:mid,end:w.end,...(c2?{curve:{control:c2}}:{})}};}
 /** RUBIK extension: split at a physical distance (editing works in mm) and carry heights and openings across.
    - Geometry: exact de Casteljau at the parameter of that distance; the two pieces ARE the original curve.
    - Heights: the split height is the original's (param-linear), so the slope continues unchanged.
    - Openings: anchored by the PARAMETER of their centre, not by "offset − first length", so they keep their place in
      plan even though each piece is faceted again (a piece is finer than its parent). An opening that straddles the
      cut is not moved: it is returned in `blocked` and the caller must decide.
    - opts.roundMm: round points and heights to whole mm as project-core stores them; the shared point is rounded once,
      so the pieces stay joined exactly. opts.toleranceMm: facet resolution (D-OP07-3). opts.newId: id of the second piece. */
 function splitAt(w,distanceMm,openings=[],opts={}){
  const path=pathProfile(w,opts),t=path.paramAt(distanceMm),g=split(w,t),r=opts.roundMm?Math.round:(v=>v),R=p=>({x:r(p.x),y:r(p.y)});
  const h=r(heightAtParam(w,t)),sloped=endHeight(w)!==startHeight(w),mid=R(g.first.end);
  const first={...w,start:w.start,end:mid,heightMm:startHeight(w)},second={...w,id:opts.newId||`${w.id}~2`,start:mid,end:w.end,heightMm:h};
  delete first.curve;delete second.curve;delete first.heightEndMm;delete second.heightEndMm;
  if(isCurved(w)){first.curve={control:R(g.first.curve.control)};second.curve={control:R(g.second.curve.control)};}
  if(sloped){first.heightEndMm=h;second.heightEndMm=endHeight(w);}
  const P1=pathProfile(first,opts),P2=pathProfile(second,opts),moved=[],blocked=[];let maxDriftMm=0;
  for(const o of openings){
   const before=o.offsetMm+o.widthMm<=distanceMm+1e-6,after=o.offsetMm>=distanceMm-1e-6;if(!before&&!after){blocked.push(o.id);continue;}
   const centre=o.offsetMm+o.widthMm/2,tc=path.paramAt(centre),piece=before?first:second,P=before?P1:P2,s=before?tc/t:(tc-t)/(1-t);
   let offsetMm=P.distanceAt(s)-o.widthMm/2;if(offsetMm<0&&offsetMm>-1e-6)offsetMm=0;
   if(offsetMm<0||offsetMm+o.widthMm>P.length+1e-6){blocked.push(o.id);continue;}
   const a=path.sample(centre).point,b=P.sample(offsetMm+o.widthMm/2).point,drift=Math.hypot(a.x-b.x,a.y-b.y);maxDriftMm=Math.max(maxDriftMm,drift);
   moved.push({...o,wallId:piece.id,offsetMm,part:before?'first':'second',driftMm:drift});}
  return {first,second,param:t,openings:moved,blocked,maxDriftMm};
 }

 // ── Openings and wall faces ──────────────────────────────────────────────────────────────────────────────────────
 /** donor pathOpening, with RUBIK's offset (left edge) instead of a centre: the clipped hole used for DRAWING. */
 function pathOpening(path,offsetMm,widthMm,sillMm,heightMm){
  if(!finite(path.length,offsetMm,widthMm,sillMm,heightMm)||path.length<=0||widthMm<=0||heightMm<=0)return null;
  const left=Math.max(0,offsetMm),right=Math.min(path.length,offsetMm+widthMm),top=Math.min(sillMm+heightMm,path.sample(left).height,path.sample(right).height),bottom=Math.max(0,sillMm);
  return right>left&&top>bottom?{left,right,bottom,top}:null;}
 /** RUBIK rule (no silent clipping): the opening must fit along the path and under the LOWER of its two edges. */
 function validateOpening(w,o,opts){const path=pathProfile(w,opts),issues=[];
  if(o.offsetMm<0||o.offsetMm+o.widthMm>path.length+1e-7)issues.push('opening extends beyond wall');
  const lowest=Math.min(path.sample(o.offsetMm).height,path.sample(o.offsetMm+o.widthMm).height);
  if(o.sillHeightMm+o.heightMm>lowest+1e-7)issues.push('opening exceeds wall height');
  return issues;}
 function segmentsAroundOpenings(length,start,end,openings){
  const edges=[...new Set([0,length,...openings.flatMap(o=>[o.left,o.right])])].sort((a,b)=>a-b),result=[];
  for(let i=1;i<edges.length;i++){const left=edges[i-1],right=edges[i],hL=at(length,start,end,left),hR=at(length,start,end,right);
   const holes=openings.filter(o=>o.left<right&&o.right>left).sort((a,b)=>a.bottom-b.bottom);let bottom=0;
   const append=(tl,tr)=>{if(Math.max(tl,tr)>bottom)result.push({width:right-left,offsetX:(left+right)/2,bottomY:bottom,topYLeft:tl,topYRight:tr});};
   for(const h of holes){if(h.bottom>bottom)append(h.bottom,h.bottom);bottom=Math.max(bottom,h.top);}append(hL,hR);}
  return result;}
 /** donor wallProfileSpans: cut the union of full openings first, then distribute across facets (level heads on slopes). */
 function profileSpans(w,openings,opts){const path=pathProfile(w,opts);
  const holes=openings.map(o=>pathOpening(path,o.offsetMm,o.widthMm,o.sillHeightMm||0,o.heightMm)).filter(Boolean);
  return path.spans.map((s,index)=>({...s,index})).filter(s=>s.length>0).map(span=>{
   const local=holes.flatMap(h=>{const left=h.left<=span.from?0:h.left-span.from,right=h.right>=span.to?span.length:h.right-span.from;
    const top=Math.min(h.top,at(span.length,span.startHeight,span.endHeight,left),at(span.length,span.startHeight,span.endHeight,right));
    return right>left&&top>h.bottom?[{...h,left,right,top}]:[];});
   return {...span,segments:segmentsAroundOpenings(span.length,span.startHeight,span.endHeight,local)};});}

 // ── Measurements (proposal for quantity-core; units mm and mm²) ──────────────────────────────────────────────────
 /** Real face areas of one wall, per face (D-OP07-2: each face measured on its own).
    - Each face is the MITRED offset of the facets by ±thickness/2: per facet, face length = k · centre length, and
      left + right = 2 · centre exactly (the mitre terms cancel). Left = +normal of start→end (outer face of a curve
      that bulges to the left).
    - Heights are the same on both faces (vertical wall); a facet's face is a trapezoid, area = k · centre trapezoid.
    - Openings: the union of holes cut on the centreline, mapped to each face with the same k (reveals perpendicular to
      the wall, so the hole is wider on the outer face of a curve). Overlaps count once.
    - No silent clipping: an opening that does not fit (validateOpening) or an invalid wall (validateWall, or a facet
      whose inner face vanishes) leaves openings/net/reveals null and complete=false, as quantity-core does.
    - revealsMm2: jambs, head and (if sillHeightMm > 0) sill of each opening, thickness deep; reported apart. */
 function faceAreas(w,openings=[],opts={}){
  const wallIssues=validateWall(w),invalid=openings.filter(o=>validateOpening(w,o,opts).length).map(o=>o.id??null);
  const path=pathProfile(w,opts),pts=[path.spans[0].start,...path.spans.map(s=>s.end)],half=w.thicknessMm/2;
  const L=offsetMiter(pts,half),Rt=offsetMiter(pts,-half),seg=(P,i)=>Math.hypot(P[i+1].x-P[i].x,P[i+1].y-P[i].y);
  const face=()=>({lengthMm:0,grossMm2:0,netMm2:0}),C=face(),Lf=face(),Rf=face();let collapsed=false;
  for(const s of profileSpans(w,invalid.length?[]:openings,opts)){
   const kL=seg(L,s.index)/s.length,kR=seg(Rt,s.index)/s.length;if(!(kL>1e-9&&kR>1e-9))collapsed=true;
   const g=s.length*(s.startHeight+s.endHeight)/2,n=s.segments.reduce((a,x)=>a+x.width*((x.topYLeft+x.topYRight)/2-x.bottomY),0);
   for(const [F,k] of [[C,1],[Lf,kL],[Rf,kR]]){F.lengthMm+=s.length*k;F.grossMm2+=g*k;F.netMm2+=n*k;}}
  if(collapsed&&!wallIssues.length)wallIssues.push('curve too tight for wall thickness');
  const ok=!wallIssues.length&&!invalid.length;
  const out=F=>({lengthMm:F.lengthMm,grossMm2:F.grossMm2,openingsMm2:ok?F.grossMm2-F.netMm2:null,netMm2:ok?F.netMm2:null});
  let reveals=0;for(const o of openings)reveals+=w.thicknessMm*(2*o.heightMm+o.widthMm+(o.sillHeightMm>0?o.widthMm:0));
  return {complete:ok,status:ok?'ok':wallIssues.length?'invalid-wall-geometry':'invalid-opening-geometry',wallIssues,invalid,facets:path.spans.length,
   centre:out(C),left:out(Lf),right:out(Rf),revealsMm2:ok?reveals:null,
   lengthMm:C.lengthMm,grossMm2:C.grossMm2,openingsMm2:ok?C.grossMm2-C.netMm2:null,netMm2:ok?C.netMm2:null,leftFaceMm:Lf.lengthMm,rightFaceMm:Rf.lengthMm};}
 /** Mitred offset of a polyline by d (left = +normal). Ends are cut square. */
 function offsetMiter(pts,d){const n=[];for(let i=0;i+1<pts.length;i++){const dx=pts[i+1].x-pts[i].x,dy=pts[i+1].y-pts[i].y,l=Math.hypot(dx,dy)||1;n.push({x:-dy/l,y:dx/l});}
  return pts.map((p,i)=>{const a=n[Math.max(0,i-1)],b=n[Math.min(n.length-1,i)];let mx=a.x+b.x,my=a.y+b.y;const ml=Math.hypot(mx,my);
   if(ml<1e-12){mx=b.x;my=b.y;}else{mx/=ml;my/=ml;}const cos=mx*b.x+my*b.y;return {x:p.x+mx*d/cos,y:p.y+my*d/cos};});}
 const polyLength=pts=>pts.slice(1).reduce((s,p,i)=>s+Math.hypot(p.x-pts[i].x,p.y-pts[i].y),0);
 function centreline(w,opts){const sp=pathSpans(w,opts);return [sp[0].start,...sp.map(s=>s.end)];}
 /** Length of the left (+normal) and right faces of the wall; equal on a straight wall. */
 function faceLengths(w,opts){const c=centreline(w,opts),h=w.thicknessMm/2;return {leftFaceMm:polyLength(offsetMiter(c,h)),rightFaceMm:polyLength(offsetMiter(c,-h))};}

 // ── Rooms ────────────────────────────────────────────────────────────────────────────────────────────────────────
 /** Room ring from its boundary walls, in order, following each wall's facets (donor getRoomPolygon for a known cycle). */
 function roomRing(walls){const ring=[];let cursor=null;
  for(let i=0;i<walls.length;i++){const w=walls[i],next=walls[(i+1)%walls.length];let pts=centreline(w);
   const touches=(p,q)=>Math.hypot(p.x-q.x,p.y-q.y)<1;
   if(cursor?!touches(pts[0],cursor):!(touches(pts.at(-1),next.start)||touches(pts.at(-1),next.end)))pts=pts.slice().reverse();
   ring.push(...pts.slice(0,-1));cursor=pts.at(-1);}
  return ring;}
 const shoelace=ring=>ring.reduce((s,p,i)=>{const q=ring[(i+1)%ring.length];return s+p.x*q.y-q.x*p.y;},0)/2;
 /** Centreline area in m² rounded to 2 decimals (the donor's native room area). */
 const ringArea=ring=>Math.round(Math.abs(shoelace(ring))/1e4)/100;
 /** donor interiorRoomArea (scanline, exact for faceted polygons): area inside the ring less every wall footprint, m². */
 function interiorArea(ring,holes,walls){
  const room=[ring,...holes];
  if(ring.length<3||room.some(r=>r.length<3||r.some(p=>!finite(p.x,p.y))))return null;
  const fp=footprints(walls);if(!fp)return null;const ys=bandLevels([...room,...fp]);if(!ys)return null;let area=0;
  for(let i=1;i<ys.length;i++){const y=(ys[i-1]+ys[i])/2,union=blockedUnion(fp,y);let width=0;
   for(const [l,r] of intervals(room,y)){width+=r-l;for(const [a,b] of union)width-=Math.max(0,Math.min(r,b)-Math.max(l,a));}
   area+=Math.max(0,width)*(ys[i]-ys[i-1]);}
  return Number.isFinite(area)?area/1e6:null;}
 function footprints(walls){const out=[];
  for(const w of walls){if(!Number.isFinite(w.thicknessMm)||w.thicknessMm<=0)return null;
   for(const s of pathSpans(w)){const dx=s.end.x-s.start.x,dy=s.end.y-s.start.y,l=Math.hypot(dx,dy),h=w.thicknessMm/2;if(!Number.isFinite(l))return null;if(l===0)continue;const ux=dx/l,uy=dy/l;
    out.push([[-h,-h],[l+h,-h],[l+h,h],[-h,h]].map(([al,ac])=>({x:s.start.x+al*ux-ac*uy,y:s.start.y+al*uy+ac*ux})));}}
  return out;}
 function bandLevels(polys){const edges=polys.flatMap(r=>r.map((a,i)=>[a,r[(i+1)%r.length]]));if(edges.length>600)return null;const levels=polys.flat().map(p=>p.y);
  for(let i=0;i<edges.length;i++){const [a,b]=edges[i],dx=b.x-a.x,dy=b.y-a.y;
   for(let j=i+1;j<edges.length;j++){const [c,d]=edges[j],ex=d.x-c.x,ey=d.y-c.y,cross=dx*ey-dy*ex;if(cross===0)continue;
    const t=((c.x-a.x)*ey-(c.y-a.y)*ex)/cross,u=((c.x-a.x)*dy-(c.y-a.y)*dx)/cross;if(t>0&&t<1&&u>0&&u<1)levels.push(a.y+t*dy);}}
  const ys=[...new Set(levels)].sort((a,b)=>a-b);return ys.length*edges.length>2_000_000?null:ys;}
 function intervals(rings,y){const xs=rings.flatMap(r=>r.flatMap((a,i)=>{const b=r[(i+1)%r.length];return (a.y>y)!==(b.y>y)?[a.x+(y-a.y)*(b.x-a.x)/(b.y-a.y)]:[];})).sort((a,b)=>a-b);
  const res=[];for(let i=0;i+1<xs.length;i+=2)res.push([xs[i],xs[i+1]]);return res;}
 function blockedUnion(fp,y){const blocked=fp.flatMap(r=>intervals([r],y)).sort((a,b)=>a[0]-b[0]),u=[];
  for(const it of blocked){const last=u.at(-1);if(last&&it[0]<=last[1])last[1]=Math.max(last[1],it[1]);else u.push([...it]);}return u;}
 /** donor roomCeilingHeight: a single ceiling height only when every boundary wall is level at the same height. */
 function roomCeiling(walls){if(!walls.length)return undefined;const h=startHeight(walls[0]);
  return h>0&&walls.every(w=>Math.abs(startHeight(w)-h)<0.1&&Math.abs(endHeight(w)-h)<0.1)?h:undefined;}

 // ── Renderer-independent 3D piece (donor createSlopedBoxGeometry + mapWallUVs, without Three.js) ────────────────
 function slopedPiece(width,thickness,bottomY,topYLeft,topYRight,along=0,tile=TEXTURE_TILE_MM){
  const hw=width/2,ht=thickness/2,yb=bottomY,ytl=Math.max(yb,topYLeft),ytr=Math.max(yb,topYRight);
  const positions=[hw,yb,ht,hw,yb,-ht,hw,ytr,-ht,hw,ytr,ht, -hw,yb,-ht,-hw,yb,ht,-hw,ytl,ht,-hw,ytl,-ht, -hw,ytl,ht,hw,ytr,ht,hw,ytr,-ht,-hw,ytl,-ht,
   -hw,yb,-ht,hw,yb,-ht,hw,yb,ht,-hw,yb,ht, -hw,yb,ht,hw,yb,ht,hw,ytr,ht,-hw,ytl,ht, hw,yb,-ht,-hw,yb,-ht,-hw,ytl,-ht,hw,ytr,-ht];
  const dy=ytr-ytl,len=Math.hypot(width,dy)||1,nx=-dy/len,ny=width/len;
  const faceN=[[1,0,0],[-1,0,0],[nx,ny,0],[0,-1,0],[0,0,1],[0,0,-1]],normals=faceN.flatMap(n=>[...n,...n,...n,...n]);
  const uvs=[];for(let i=0;i<24;i++){const x=along+positions[i*3],y=positions[i*3+1],z=positions[i*3+2],[a,b,c]=normals.slice(i*3,i*3+3);let u,v;
   if(Math.abs(c)>0.5){u=c>0?x:-x;v=y;}else if(Math.abs(b)>1e-6){u=x;v=b>0?-z:z;}else{u=a>0?-z:z;v=y;}uvs.push(u/tile,v/tile);}
  const indices=[];for(let i=0;i<6;i++){const o=i*4;indices.push(o,o+1,o+2,o,o+2,o+3);}
  return {positions,normals,uvs,indices};}

 // ── Compatibility ────────────────────────────────────────────────────────────────────────────────────────────────
 /** For a consumer that does not know curves or slopes yet: an equivalent straight, level wall, plus what is lost.
    Never used to SAVE: only to degrade a reading visibly (DXF of an old reader, legacy estimates). */
 const DEGRADED=Symbol.for('rubik.op07.degraded');
 function legacyView(w){const loss=[];const out={...w};
  if(isCurved(w)){loss.push({field:'curve',chordMm:Math.hypot(w.end.x-w.start.x,w.end.y-w.start.y),pathMm:pathProfile(w).length});delete out.curve;}
  if(Number.isFinite(w.heightEndMm)&&w.heightEndMm!==w.heightMm){loss.push({field:'heightEndMm',heightMm:w.heightMm,heightEndMm:w.heightEndMm});out.heightMm=Math.max(w.heightMm,w.heightEndMm);}
  delete out.heightEndMm;Object.defineProperty(out,DEGRADED,{value:true});return Object.freeze({wall:Object.freeze(out),loss:Object.freeze(loss)});}
 /** Facets for exporters (DXF LWPOLYLINE): same facets as the viewer, so plan, 3D and CAD agree. */
 const facets=(w,opts)=>centreline(w,opts);

 // ── Protection against degraded saves and information loss (proposal for the persistence write path) ──────────────
 /** Features a project uses beyond today's contract; a writer must know all of them to save it. */
 function featuresOf(project){const f=new Set();for(const w of (project&&project.walls)||[]){if(isCurved(w))f.add('wall.curve');if(Number.isFinite(w.heightEndMm))f.add('wall.heightEnd');}return [...f].sort();}
 /** In-memory guard: a degraded view (legacyView) can never be the thing that gets saved. */
 function assertSavable(project){if(project&&(project[DEGRADED]||(project.walls||[]).some(w=>w&&w[DEGRADED])))throw new Error('OP-07: a degraded legacy view cannot be saved');return true;}
 /** Content guard (survives JSON, where the in-memory mark is lost): what the previous saved state had and the next one
    lacks, unless the user's intent says so. intent = {straightened:[wallId], leveled:[wallId], removed:[wallId],
    removedOpenings:[openingId], split:{oldId:[newIds]}}. */
 function detectLoss(prev,next,intent={}){
  const issues=[],byId=new Map((next.walls||[]).map(w=>[w.id,w])),has=(k,id)=>(intent[k]||[]).includes(id),splits=intent.split||{};
  const sloped=w=>Number.isFinite(w.heightEndMm)&&w.heightEndMm!==w.heightMm;
  for(const w of prev.walls||[]){
   const pieces=(splits[w.id]||[w.id]).map(id=>byId.get(id));
   if(pieces.some(p=>!p)){if(!has('removed',w.id))issues.push({code:'wall-lost',wallId:w.id});continue;}
   if(isCurved(w)&&!has('straightened',w.id)&&pieces.some(p=>!isCurved(p)))issues.push({code:'curve-lost',wallId:w.id});
   if(sloped(w)&&!has('leveled',w.id)&&!pieces.some(sloped))issues.push({code:'slope-lost',wallId:w.id});}
  const kept=new Set((next.openings||[]).map(o=>o.id));
  for(const o of prev.openings||[])if(!kept.has(o.id)&&!has('removedOpenings',o.id)&&!has('removed',o.wallId))issues.push({code:'opening-lost',openingId:o.id,wallId:o.wallId});
  return issues;}
 /** Save gate: refuses a degraded view, a writer that does not know a feature the project uses (it would drop it),
    unintended loss against the previous saved state, and walls or openings that break the proposed rules. */
 function guardSave({previous=null,next,writerFeatures=[],intent={}}){
  const issues=[],known=new Set(writerFeatures);
  try{assertSavable(next);}catch{issues.push({code:'degraded-view'});}
  for(const f of new Set([...featuresOf(previous),...featuresOf(next)]))if(!known.has(f))issues.push({code:'writer-lacks-feature',feature:f});
  if(previous)issues.push(...detectLoss(previous,next,intent));
  const walls=new Map((next.walls||[]).map(w=>[w.id,w]));
  for(const w of walls.values())for(const message of validateWall(w))issues.push({code:'invalid-wall',wallId:w.id,message});
  for(const o of next.openings||[]){const w=walls.get(o.wallId);if(w)for(const message of validateOpening(w,o))issues.push({code:'invalid-opening',openingId:o.id,message});}
  return {ok:!issues.length,issues};}

 const api={FACETS,MAX_FACETS,TEXTURE_TILE_MM,DEGRADED,isCurved,startHeight,endHeight,point,pathSpans,pathProfile,bounds,dimension,split,splitAt,pathOpening,validateOpening,validateWall,profileSpans,faceAreas,faceLengths,centreline,offsetMiter,polyLength,roomRing,ringArea,interiorArea,roomCeiling,slopedPiece,legacyView,facets,
  facetCount,deviationBound,arcLength,trueGross,heightAtParam,minRadius,featuresOf,assertSavable,detectLoss,guardSave};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanWallGeometry=api;
})(globalThis);
