/* FT3D-3 — dynamic section: pure derivation of a visual section plane from the geometry Rubik already has.
   No DOM, no Three.js, no project edits, nothing persisted: the descriptor is runtime data computed when a scene is
   entered (or a level changes), never per frame.
   Plan coordinates are millimetres (x right, y down = world +z), as the project and FloorPlanGeometry use them.

   Axis: the plan envelope of the level. spanX ≥ spanY → the section runs along X and its normal is the plan Y axis
   (world Z); spanY > spanX → it runs along Y and its normal is X. A building passes the axis derived from the
   envelope of all its levels in the building frame, so every level is cut in the same direction.
   Visible side: the normal points to the deterministic overview camera of Presentation (its direction is given), never
   to the user's last orbit. The half between the plane and the camera is removed.
   Position: candidates at 50 %, 40 % and 60 % of the envelope along the normal (measured from the camera side);
   the one crossing most rooms wins, then most active walls, then that stable order. Demolished walls never count.
   None crossing a room or two walls → supported:false with a reason; no section is invented.
   Sweep: the plane enters from startOffset, just in front of the envelope on the camera side, to targetOffset.
   Intersections: for every active wall the plane crosses, where (along the section line), how wide the cut face is
   (its thickness seen across the line) and its height, with the openings it passes through as vertical gaps; for
   every room, the stretches of the line inside it. Those are the only data the cut faces are drawn from: no slab,
   wall or roof thickness the model does not know is added. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanPresentationSection=api;})(typeof self!=='undefined'?self:this,function(){
 'use strict';
 const CANDIDATES=[.5,.4,.6];
 const SECTION={minSpanMm:500,startMarginMm:150,startMarginShare:.02,minWalls:2};
 const REASONS={
  'no-bounds':'La geometría no tiene un contorno válido para cortar.',
  'no-crossing':'Ningún plano candidato (50 %, 40 %, 60 %) atraviesa estancias o muros activos.'
 };
 const finite=v=>typeof v==='number'&&Number.isFinite(v);
 const active=w=>w&&w.status!=='demolished'&&finite(w.start?.x)&&finite(w.start?.y)&&finite(w.end?.x)&&finite(w.end?.y);
 const pt=p=>Array.isArray(p)?[p[0],p[1]]:[p.x,p.y];
 // The plan facts the section needs: active walls, room polygons (geometry rooms if given, else project rooms) and
 // openings. A plan offset (building frame) is added when the envelope of several levels is measured.
 function facts(source,offset){
  const ox=offset?.x||0,oy=offset?.y||0,project=source.project||source;
  const walls=(project.walls||[]).filter(active).map(w=>({id:w.id,a:[w.start.x+ox,w.start.y+oy],b:[w.end.x+ox,w.end.y+oy],thickness:Math.max(1,w.thicknessMm||0),height:w.heightMm||project.defaults?.wallHeightMm||2800}));
  const polys=(source.geometry?.rooms||project.rooms||[]).map(r=>({id:r.id,poly:(r.poly||r.polygon||[]).map(pt).filter(p=>finite(p[0])&&finite(p[1])).map(p=>[p[0]+ox,p[1]+oy])})).filter(r=>r.poly.length>=3);
  const openings=(project.openings||[]).filter(o=>finite(o.offsetMm)&&finite(o.widthMm));
  return {walls,rooms:polys,openings,defaultHeight:project.defaults?.wallHeightMm||2800};
 }
 // Envelope: wall bodies (end points ± half thickness) and room polygons.
 function envelope(f){
  const xs=[],ys=[];
  for(const w of f.walls){const h=w.thickness/2;for(const p of [w.a,w.b]){xs.push(p[0]-h,p[0]+h);ys.push(p[1]-h,p[1]+h);}}
  for(const r of f.rooms)for(const p of r.poly){xs.push(p[0]);ys.push(p[1]);}
  if(!xs.length)return null;
  const b={minX:Math.min(...xs),maxX:Math.max(...xs),minY:Math.min(...ys),maxY:Math.max(...ys)};b.spanX=b.maxX-b.minX;b.spanY=b.maxY-b.minY;
  return b;
 }
 // Axis of a set of envelopes (one level, or every level of a building in its frame): 'x' = runs along X.
 function axisOf(b){return b.spanX>=b.spanY?'x':'y';}
 function buildingAxis(levels){
  const all=(levels||[]).map(l=>envelope(facts(l,l.offsetMm))).filter(Boolean);if(!all.length)return null;
  const b={minX:Math.min(...all.map(e=>e.minX)),maxX:Math.max(...all.map(e=>e.maxX)),minY:Math.min(...all.map(e=>e.minY)),maxY:Math.max(...all.map(e=>e.maxY))};
  b.spanX=b.maxX-b.minX;b.spanY=b.maxY-b.minY;return {axis:axisOf(b),bounds:b};
 }
 // n: index of the normal coordinate (1 = plan y when the section runs along x), u: the coordinate along the line.
 function crossings(f,n,u,c){
  const walls=[];
  for(const w of f.walls){
   const ca=w.a[n]-c,cb=w.b[n]-c;if(!(ca*cb<0))continue;
   const t=ca/(ca-cb),L=Math.hypot(w.b[0]-w.a[0],w.b[1]-w.a[1]),along=w.a[u]+t*(w.b[u]-w.a[u]);
   // Thickness seen across the line: the wall's own thickness over the cosine between the wall and the normal.
   const cos=Math.abs(w.b[n]-w.a[n])/Math.max(1e-9,L),width=Math.min(w.thickness/Math.max(.2,cos),w.thickness*5);
   const at=t*L,gaps=[];
   for(const o of f.openings)if(o.wallId===w.id&&at>=o.offsetMm&&at<=o.offsetMm+o.widthMm){const bottom=Math.max(0,o.kind==='window'?o.sillHeightMm||0:0),top=Math.min(w.height,bottom+(o.heightMm||0));if(top>bottom)gaps.push({id:o.id,kind:o.kind,bottom,top});}
   gaps.sort((a,b)=>a.bottom-b.bottom);
   walls.push({id:w.id,at:along,width,height:w.height,gaps});
  }
  walls.sort((a,b)=>a.at-b.at||String(a.id).localeCompare(String(b.id)));
  const rooms=[];
  for(const r of f.rooms){
   const hits=[];r.poly.forEach((a,i)=>{const b=r.poly[(i+1)%r.poly.length],ca=a[n]-c,cb=b[n]-c;if((ca<0&&cb>=0)||(cb<0&&ca>=0)){const t=ca/(ca-cb);hits.push(a[u]+t*(b[u]-a[u]));}});
   hits.sort((x,y)=>x-y);const segments=[];for(let i=0;i+1<hits.length;i+=2)if(hits[i+1]-hits[i]>1)segments.push([hits[i],hits[i+1]]);
   if(segments.length)rooms.push({id:r.id,segments});
  }
  return {walls,rooms};
 }
 /* source: a project ({walls, rooms, openings, defaults}) or {project, geometry} (geometry.rooms preferred).
    options: overviewDirection [x,y,z] (world, from target to the overview camera) — required for the visible side;
             axis 'x'|'y' to force the building's axis; levelId to tag the descriptor. */
 function derive(source,options={}){
  const f=facts(source||{}),b=envelope(f),levelId=options.levelId??null;
  const no=reason=>({supported:false,reason,message:REASONS[reason],levelId,bounds:b,axis:null,normal:null,frontSign:null,targetOffset:null,startOffset:null,candidates:[],intersections:{walls:[],rooms:[]}});
  if(!b||Math.max(b.spanX,b.spanY)<SECTION.minSpanMm)return no('no-bounds');
  const axis=options.axis==='x'||options.axis==='y'?options.axis:axisOf(b);
  // The section runs along `axis`; its normal is the other plan axis (y ↔ world z, x ↔ world x).
  const n=axis==='x'?1:0,u=1-n,dir=options.overviewDirection||[0,0,1],component=n===1?dir[2]:dir[0];
  const frontSign=component<0?-1:1,min=n===1?b.minY:b.minX,max=n===1?b.maxY:b.maxX,span=max-min;
  if(span<1)return no('no-bounds');
  const front=frontSign>0?max:min;
  const candidates=CANDIDATES.map((fraction,order)=>{const offset=front-frontSign*fraction*span,x=crossings(f,n,u,offset);return {fraction,order,offset,rooms:x.rooms.length,walls:x.walls.length,x};});
  const useful=candidates.filter(c=>c.rooms>0||c.walls>=SECTION.minWalls);
  const best=[...useful].sort((a,c)=>c.rooms-a.rooms||c.walls-a.walls||a.order-c.order)[0];
  const list=candidates.map(({fraction,offset,rooms,walls})=>({fraction,offset,rooms,walls}));
  if(!best)return {...no('no-crossing'),axis,frontSign,candidates:list};
  const lineMin=n===1?b.minX:b.minY,lineMax=n===1?b.maxX:b.maxY;
  const margin=Math.max(SECTION.startMarginMm,span*SECTION.startMarginShare);
  const point=(along,c)=>n===1?[along,c]:[c,along];
  return {supported:true,reason:null,message:null,levelId,axis,
   // Plan unit normal, pointing to the camera side (the removed half).
   normal:n===1?[0,frontSign]:[frontSign,0],normalAxis:n===1?'y':'x',frontSign,
   targetOffset:best.offset,startOffset:front+frontSign*margin,fraction:best.fraction,
   bounds:{...b},span,lineMin,lineMax,
   // The section line on the plan (for the minimap) and the way the frontal camera looks (towards −normal).
   line:[point(lineMin,best.offset),point(lineMax,best.offset)],look:n===1?[0,-frontSign]:[-frontSign,0],
   candidates:list,intersections:{walls:best.x.walls,rooms:best.x.rooms}};
 }
 // Offset of the plane at sweep progress s ∈ [0,1]: a pure function, never an accumulated delta.
 function offsetAt(d,s){const t=Math.min(1,Math.max(0,Number(s)||0));return d.startOffset+(d.targetOffset-d.startOffset)*t;}
 return {derive,buildingAxis,envelope:s=>envelope(facts(s||{})),offsetAt,CANDIDATES,SECTION,REASONS};
});
