/* FT3D-4 — façade candidates for the narrative elevation (elevation-open): pure derivation from the model Rubik has.
   No DOM, no Three.js, no network, no storage, no global state; the project is only read. The descriptor is runtime data
   computed when the presentation is configured (or a scene begins), never per frame, and it is never saved.
   Plan coordinates are millimetres (x right, y down = world +z). A building passes its levels with their offsets
   (building frame) and elevations; a single project is one level with a zero offset.

   Authority: FloorPlanExterior.derive(project) decides which walls are façade walls (and which openings are on them).
   Nothing here reclassifies a wall: this module only finds, for each façade wall, the side that faces the outside.
   Outside side: the same evidence Exterior uses — the indoor rooms sampled at 20 %, 50 % and 80 % of the wall, at
   thickness/2 + 50 mm on each side; the outward normal points to the side that is free of rooms at the three samples.
   A façade wall whose free side cannot be shown that way stays a façade wall but is left out of the candidates
   (orientation-unavailable) and the result is partial.
   Grouping: outward normals in 8 sectors of 45° in project coordinates (centres every 45°, ±22.5°), angle measured
   clockwise from plan-up. Candidates are ordered from plan-up clockwise and named facade-A, facade-B… in that order.
   Default: the longest total façade length (all levels), then the most openings, then the order. It is an automatic
   selection, never a «main façade».
   Cardinal names only when site.northOffsetDeg exists: true azimuth = wrap(anglePlanDeg − northOffsetDeg), the
   convention FloorPlanSolar uses (projectAzimuth = azimuth + northOffsetDeg). */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./exterior-core.js'):root.FloorPlanExterior);if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanPresentationElevation=api;})(typeof self!=='undefined'?self:this,function(DefaultExterior){
 'use strict';
 const ELEVATION={sectorDeg:45,sampleAt:[.2,.5,.8],sampleMarginMm:50,minFacadeMm:500,minWallMm:1};
 const CARDINALS=['norte','noreste','este','sureste','sur','suroeste','oeste','noroeste'];
 const LETTERS='ABCDEFGH';
 const REASONS={
  'invalid-geometry':'El modelo no tiene muros válidos para leer una fachada.',
  'no-facade-walls':'Ningún muro está clasificado como fachada: dibuja las estancias interiores para que el exterior se pueda reconocer.',
  'no-oriented-facade-walls':'Los muros de fachada no permiten demostrar hacia qué lado está el exterior.',
  'degenerate-facade':'Las fachadas derivables son demasiado pequeñas para leerse.'
 };
 const finite=v=>typeof v==='number'&&Number.isFinite(v);
 const wrap=v=>(v%360+360)%360;
 const deg=r=>r*180/Math.PI;
 function inside(poly,x,y){let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)hit=!hit;}return hit;}
 // Clockwise angle of a plan direction from plan-up (0,−1): right = 90, down = 180, left = 270.
 const angleOf=v=>wrap(deg(Math.atan2(v[0],-v[1])));
 // Plan direction rotated 90° clockwise on screen (y down): up → right.
 const clockwise=v=>[-v[1],v[0]].map(z);
 // −0 never leaks into the descriptor (plain, JSON-stable data).
 const z=v=>v===0?0:v;
 const validWall=w=>w&&finite(w.start?.x)&&finite(w.start?.y)&&finite(w.end?.x)&&finite(w.end?.y);
 // Outward normal of one façade wall, or null when the free side is not consistent at the three samples.
 function outward(wall,indoor){
  const dx=wall.end.x-wall.start.x,dy=wall.end.y-wall.start.y,L=Math.hypot(dx,dy);if(!(L>0))return null;
  const n=[-dy/L,dx/L],d=(wall.thicknessMm||0)/2+ELEVATION.sampleMarginMm;
  const occupied=(x,y)=>indoor.some(r=>inside(r.polygon,x,y));
  const s=ELEVATION.sampleAt.map(t=>{const x=wall.start.x+dx*t,y=wall.start.y+dy*t;return [occupied(x+n[0]*d,y+n[1]*d),occupied(x-n[0]*d,y-n[1]*d)];});
  if(s.every(v=>!v[0]&&v[1]))return n;
  if(s.every(v=>v[0]&&!v[1]))return [-n[0],-n[1]];
  return null;
 }
 /* input: {levels:[{levelId?, project, geometry?, offsetMm?:{x,y}, elevationMm?}], northOffsetDeg?}
    options: {exterior} — the FloorPlanExterior module (defaults to the one loaded with this file).
    Returns {supported, reason, message, partial, candidates, defaultId, envelope, unoriented, excluded}. */
 function derive(input,options={}){
  const Exterior=options.exterior||DefaultExterior;
  const levels=Array.isArray(input?.levels)?input.levels:[];
  const north=finite(input?.northOffsetDeg)?input.northOffsetDeg:null;
  const no=(reason,extra={})=>({supported:false,reason,message:REASONS[reason],partial:false,candidates:[],defaultId:null,envelope:null,unoriented:[],excluded:[],...extra});
  if(!Exterior||typeof Exterior.derive!=='function'||!levels.length||levels.some(l=>!l?.project||!Array.isArray(l.project.walls)))return no('invalid-geometry');
  const walls=[],unoriented=[],env={minX:Infinity,maxX:-Infinity,minY:Infinity,maxY:-Infinity,bottomMm:Infinity,topMm:-Infinity};
  let facadeCount=0,activeCount=0;
  levels.forEach((level,order)=>{
   const project=level.project,levelId=level.levelId??null,ox=finite(level.offsetMm?.x)?level.offsetMm.x:0,oy=finite(level.offsetMm?.y)?level.offsetMm.y:0;
   const base=finite(level.elevationMm)?level.elevationMm:0,defaultHeight=project.defaults?.wallHeightMm||2800;
   const byId=new Map(project.walls.filter(w=>w&&w.status!=='demolished'&&validWall(w)).map(w=>[w.id,w]));
   for(const w of byId.values()){
    activeCount++;const h=(w.thicknessMm||0)/2,top=base+(w.heightMm||defaultHeight);
    for(const p of [w.start,w.end]){env.minX=Math.min(env.minX,p.x+ox-h);env.maxX=Math.max(env.maxX,p.x+ox+h);env.minY=Math.min(env.minY,p.y+oy-h);env.maxY=Math.max(env.maxY,p.y+oy+h);}
    env.bottomMm=Math.min(env.bottomMm,base);env.topMm=Math.max(env.topMm,top);
   }
   const ext=Exterior.derive(project);
   const indoor=(project.rooms||[]).filter(r=>Array.isArray(r.polygon)&&r.polygon.length>=3&&!['terrace','balcony'].includes(r.family));
   const openingsOf=new Map();for(const o of ext.openings||[]){if(!openingsOf.has(o.wallId))openingsOf.set(o.wallId,[]);openingsOf.get(o.wallId).push(o.openingId);}
   for(const r of ext.walls||[]){
    if(r.status!=='facade')continue;
    const w=byId.get(r.wallId);if(!w)continue; // a demolished or invalid wall never comes back
    facadeCount++;
    const L=Math.hypot(w.end.x-w.start.x,w.end.y-w.start.y),n=L>=ELEVATION.minWallMm?outward(w,indoor):null;
    if(!n){unoriented.push({levelId,wallId:w.id});continue;}
    walls.push({levelId,order,wallId:w.id,length:L,normal:n,a:[w.start.x+ox,w.start.y+oy],b:[w.end.x+ox,w.end.y+oy],bottom:base,top:base+(w.heightMm||defaultHeight),openings:openingsOf.get(w.id)||[]});
   }
  });
  if(!activeCount)return no('invalid-geometry');
  if(!facadeCount)return no('no-facade-walls');
  if(!walls.length)return no('no-oriented-facade-walls',{unoriented});
  const envelope={...env,spanX:env.maxX-env.minX,spanY:env.maxY-env.minY,heightMm:env.topMm-env.bottomMm,centerMm:{x:(env.minX+env.maxX)/2,y:(env.minY+env.maxY)/2}};
  const corners=[[env.minX,env.minY],[env.maxX,env.minY],[env.maxX,env.maxY],[env.minX,env.maxY]];
  // Sectors of 45° from plan-up, clockwise.
  const sectors=new Map();
  for(const w of walls){const k=Math.round(angleOf(w.normal)/ELEVATION.sectorDeg)%8;if(!sectors.has(k))sectors.set(k,[]);sectors.get(k).push(w);}
  const groups=[],excluded=[];
  for(const k of [...sectors.keys()].sort((a,b)=>a-b)){
   const list=sectors.get(k),total=list.reduce((s,w)=>s+w.length,0);
   const sum=list.reduce((v,w)=>[v[0]+w.normal[0]*w.length,v[1]+w.normal[1]*w.length],[0,0]),m=Math.hypot(sum[0],sum[1]);
   const normal=(m>0?[sum[0]/m,sum[1]/m]:[...list[0].normal]).map(z),tangent=clockwise(normal);
   const t=list.flatMap(w=>[w.a,w.b]).map(p=>p[0]*tangent[0]+p[1]*tangent[1]),tMin=Math.min(...t),tMax=Math.max(...t);
   const s=list.reduce((v,w)=>v+((w.a[0]+w.b[0])/2*normal[0]+(w.a[1]+w.b[1])/2*normal[1])*w.length,0)/total;
   const width=tMax-tMin,bottom=Math.min(...list.map(w=>w.bottom)),top=Math.max(...list.map(w=>w.top));
   const refs=list.map(w=>({levelId:w.levelId,wallId:w.wallId}));
   if(total<ELEVATION.minFacadeMm||width<ELEVATION.minFacadeMm){excluded.push({sector:k,reason:'degenerate-facade',wallRefs:refs});continue;}
   // Frontal framing: the building envelope (walls of every level) seen along this normal, never furniture.
   const et=corners.map(p=>p[0]*tangent[0]+p[1]*tangent[1]),en=corners.map(p=>p[0]*normal[0]+p[1]*normal[1]);
   const fc=(Math.min(...et)+Math.max(...et))/2,fn=(Math.min(...en)+Math.max(...en))/2;
   const anglePlanDeg=angleOf(normal);
   groups.push({sector:k,normalPlan:normal,tangentPlan:tangent,anglePlanDeg,
    wallRefs:refs,openingRefs:list.flatMap(w=>w.openings.map(openingId=>({levelId:w.levelId,openingId}))),
    centerMm:{x:z(tangent[0]*(tMin+tMax)/2+normal[0]*s),y:z(tangent[1]*(tMin+tMax)/2+normal[1]*s)},widthMm:width,baseMm:bottom,heightMm:top-bottom,
    totalFacadeLengthMm:total,openingCount:list.reduce((n,w)=>n+w.openings.length,0),
    frame:{centerMm:{x:z(tangent[0]*fc+normal[0]*fn),y:z(tangent[1]*fc+normal[1]*fn)},widthMm:Math.max(...et)-Math.min(...et),depthMm:Math.max(...en)-Math.min(...en),baseMm:envelope.bottomMm,heightMm:envelope.heightMm},
    levels:[...new Set(list.map(w=>w.levelId))]});
  }
  if(!groups.length)return no('degenerate-facade',{unoriented,excluded,envelope});
  const candidates=groups.map((g,i)=>{
   const letter=LETTERS[i],cardinal=north===null?null:CARDINALS[Math.round(wrap(g.anglePlanDeg-north)/45)%8];
   return {id:`facade-${letter}`,letter,...g,trueAzimuthDeg:north===null?null:wrap(g.anglePlanDeg-north),cardinal,label:`Fachada ${letter}${cardinal?` · ${cardinal}`:''}`};
  });
  const best=[...candidates].sort((a,b)=>b.totalFacadeLengthMm-a.totalFacadeLengthMm||b.openingCount-a.openingCount||a.sector-b.sector)[0];
  return {supported:true,reason:null,message:null,partial:unoriented.length>0||excluded.length>0,candidates,defaultId:best.id,envelope,unoriented,excluded,northOffsetDeg:north};
 }
 return {derive,angleOf,ELEVATION,CARDINALS,REASONS};
});
