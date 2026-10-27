/* Quantity Engine (Point 7A): derived, non-monetary quantities from persisted FloorPlanProjectV1 data.
   It deliberately does not persist totals and it reuses FloorPlanSurfaceMetrics as the only floor-area authority. */
(function(root){
 'use strict';
 const Surface=typeof module==='object'?require('./surface-core.js'):root.FloorPlanSurfaceMetrics;
 if(!Surface)throw Error('FloorPlanQuantities requires FloorPlanSurfaceMetrics.');
 const STATUS=Object.freeze(['measured','estimated','unavailable']);
 const FACE_TOLERANCE_MM=3,PARALLEL_SIN_TOLERANCE=1e-4,COVERAGE_TOLERANCE_MM=3,EPS=1e-7;
 const KINDS=Object.freeze(['door','sliding-door','window','opening']);
 const finite=n=>Number.isFinite(n),point=p=>p&&finite(p.x)&&finite(p.y);
 const distanceMm=(a,b)=>point(a)&&point(b)?Math.hypot(b.x-a.x,b.y-a.y):null;
 const measurementStatus=project=>Surface.statusOfScale(project);
 function assertProject(project){
  if(!project||typeof project!=='object'||!Array.isArray(project.rooms)||!Array.isArray(project.walls)||!Array.isArray(project.openings))throw new TypeError('FloorPlanQuantities: expected a FloorPlanProjectV1-like project.');
  return project;
 }
 function polygonPerimeterM(polygon){
  if(!Array.isArray(polygon)||polygon.length<3||!polygon.every(point))return null;
  let mm=0;
  for(let i=0;i<polygon.length;i++){const d=distanceMm(polygon[i],polygon[(i+1)%polygon.length]);if(!(d>0))return null;mm+=d;}
  return mm>0?mm/1000:null;
 }
 function mergeIntervals(intervals,tolerance=EPS){
  const sorted=(intervals||[]).filter(x=>finite(x?.[0])&&finite(x?.[1])&&x[1]-x[0]>tolerance).map(x=>[Math.min(x[0],x[1]),Math.max(x[0],x[1])]).sort((a,b)=>a[0]-b[0]);
  const out=[];
  for(const current of sorted){const last=out.at(-1);if(last&&current[0]<=last[1]+tolerance)last[1]=Math.max(last[1],current[1]);else out.push(current.slice());}
  return out;
 }
 function intervalLength(intervals){return mergeIntervals(intervals).reduce((s,[a,b])=>s+b-a,0);}
 function rectangleUnionAreaMm2(rectangles){
  const rs=(rectangles||[]).filter(r=>finite(r?.x0)&&finite(r?.x1)&&finite(r?.y0)&&finite(r?.y1)&&r.x1-r.x0>EPS&&r.y1-r.y0>EPS);
  if(!rs.length)return 0;
  const xs=[...new Set(rs.flatMap(r=>[r.x0,r.x1]))].sort((a,b)=>a-b);let area=0;
  for(let i=0;i<xs.length-1;i++){const x0=xs[i],x1=xs[i+1];if(x1-x0<=EPS)continue;const mid=(x0+x1)/2;
   const ys=rs.filter(r=>r.x0<mid+EPS&&r.x1>mid-EPS).map(r=>[r.y0,r.y1]);
   area+=(x1-x0)*intervalLength(ys);
  }
  return area;
 }
 function openingCounts(openings){
  const byKind=Object.fromEntries(KINDS.map(k=>[k,0]));
  for(const o of openings||[])if(Object.hasOwn(byKind,o?.kind))byKind[o.kind]++;
  return {total:(openings||[]).length,byKind,unit:'unit'};
 }
 function openingRectangles(project,wall,clipIntervals=null){
  const length=distanceMm(wall.start,wall.end),height=wall.heightMm,all=(project.openings||[]).filter(o=>o.wallId===wall.id),invalid=[];
  if(!(length>0)||!(finite(height)&&height>0))return {rectangles:[],invalid:all.map(o=>o.id||null),openings:all};
  const rectangles=[];
  for(const o of all){
   const ok=finite(o.offsetMm)&&o.offsetMm>=0&&finite(o.widthMm)&&o.widthMm>0&&finite(o.heightMm)&&o.heightMm>0&&finite(o.sillHeightMm)&&o.sillHeightMm>=0&&o.offsetMm+o.widthMm<=length+EPS&&o.sillHeightMm+o.heightMm<=height+EPS;
   if(!ok){invalid.push(o.id||null);continue;}
   const base={x0:Math.max(0,o.offsetMm),x1:Math.min(length,o.offsetMm+o.widthMm),y0:o.sillHeightMm,y1:o.sillHeightMm+o.heightMm,id:o.id,kind:o.kind};
   if(!clipIntervals){rectangles.push(base);continue;}
   for(const [a,b] of mergeIntervals(clipIntervals)){const x0=Math.max(base.x0,a),x1=Math.min(base.x1,b);if(x1-x0>EPS)rectangles.push({...base,x0,x1});}
  }
  return {rectangles,invalid,openings:all};
 }
 function wall(project,wallOrId){
  assertProject(project);const w=typeof wallOrId==='string'?project.walls.find(x=>x.id===wallOrId):wallOrId;
  if(!w)throw new RangeError('FloorPlanQuantities: wall not found.');
  const lengthMm=distanceMm(w.start,w.end),heightMm=w.heightMm,scaleStatus=measurementStatus(project),dimsOk=lengthMm>0&&finite(heightMm)&&heightMm>0;
  const linked=(project.openings||[]).filter(o=>o.wallId===w.id),counts=openingCounts(linked);
  if(!dimsOk)return {id:w.id,lifecycleStatus:w.status??null,structure:w.structure??null,surfaceMaterialId:w.surfaceMaterialId??null,status:'unavailable',complete:false,
   quantities:{lengthM:null,heightM:null,faceGrossAreaM2:null,faceOpeningAreaM2:null,faceNetAreaM2:null,wallSurfaceGrossAreaM2:null,wallSurfaceOpeningAreaM2:null,wallSurfaceNetAreaM2:null},openings:{...counts,invalid:linked.map(o=>o.id||null)},reason:'invalid-wall-geometry'};
  const {rectangles,invalid}=openingRectangles(project,w),grossMm2=lengthMm*heightMm,openingMm2=invalid.length?null:rectangleUnionAreaMm2(rectangles),netMm2=openingMm2===null?null:Math.max(0,grossMm2-openingMm2);
  const m2=v=>v===null?null:v/1e6;
  return {id:w.id,lifecycleStatus:w.status??null,structure:w.structure??null,surfaceMaterialId:w.surfaceMaterialId??null,status:scaleStatus,complete:invalid.length===0,
   quantities:{lengthM:lengthMm/1000,heightM:heightMm/1000,faceGrossAreaM2:m2(grossMm2),faceOpeningAreaM2:m2(openingMm2),faceNetAreaM2:m2(netMm2),wallSurfaceGrossAreaM2:m2(grossMm2*2),wallSurfaceOpeningAreaM2:openingMm2===null?null:m2(openingMm2*2),wallSurfaceNetAreaM2:netMm2===null?null:m2(netMm2*2)},
   openings:{...counts,invalid},...(invalid.length?{reason:'invalid-opening-geometry'}:{})};
 }
 function matchEdgeToWall(a,b,w){
  if(!point(a)||!point(b)||!point(w?.start)||!point(w?.end)||!(finite(w.thicknessMm)&&w.thicknessMm>0))return null;
  const wx=w.end.x-w.start.x,wy=w.end.y-w.start.y,wl=Math.hypot(wx,wy),ex=b.x-a.x,ey=b.y-a.y,el=Math.hypot(ex,ey);if(!(wl>0&&el>0))return null;
  const parallel=Math.abs(wx*ey-wy*ex)/(wl*el);if(parallel>PARALLEL_SIN_TOLERANCE)return null;
  const ux=wx/wl,uy=wy/wl,nx=-uy,ny=ux;
  const d1=(a.x-w.start.x)*nx+(a.y-w.start.y)*ny,d2=(b.x-w.start.x)*nx+(b.y-w.start.y)*ny,avg=(d1+d2)/2;
  if(Math.sign(d1||avg)!==Math.sign(d2||avg)||Math.abs(d1-d2)>FACE_TOLERANCE_MM*2||Math.abs(Math.abs(avg)-w.thicknessMm/2)>FACE_TOLERANCE_MM)return null;
  const s1=(a.x-w.start.x)*ux+(a.y-w.start.y)*uy,s2=(b.x-w.start.x)*ux+(b.y-w.start.y)*uy,start=Math.max(0,Math.min(s1,s2)),end=Math.min(wl,Math.max(s1,s2));if(end-start<=EPS)return null;
  const eux=ex/el,euy=ey/el,toEdge=s=>{const x=w.start.x+ux*s,y=w.start.y+uy*s;return (x-a.x)*eux+(y-a.y)*euy;};
  const t1=toEdge(start),t2=toEdge(end);
  return {wallId:w.id,face:avg>=0?1:-1,wallStartMm:start,wallEndMm:end,edgeStartMm:Math.max(0,Math.min(t1,t2)),edgeEndMm:Math.min(el,Math.max(t1,t2)),lengthMm:end-start};
 }
 function roomWallFaces(project,room){
  const polygon=room?.polygon;if(!Array.isArray(polygon)||polygon.length<3||!polygon.every(point))return {status:'unavailable',complete:false,associationComplete:false,openingsComplete:false,grossAreaM2:null,openingAreaM2:null,netAreaM2:null,matchedBoundaryM:null,missingBoundaryM:null,segments:[],reason:'invalid-room-polygon'};
  const scaleStatus=measurementStatus(project),edges=[],matches=[];let perimeterMm=0,ambiguous=false;
  for(let i=0;i<polygon.length;i++){
   const a=polygon[i],b=polygon[(i+1)%polygon.length],len=distanceMm(a,b);if(!(len>0))return {status:'unavailable',complete:false,associationComplete:false,openingsComplete:false,grossAreaM2:null,openingAreaM2:null,netAreaM2:null,matchedBoundaryM:null,missingBoundaryM:null,segments:[],reason:'invalid-room-polygon'};
   perimeterMm+=len;const edgeMatches=[];
   for(const w of project.walls){if(w.status==='demolished')continue;const m=matchEdgeToWall(a,b,w);if(m)edgeMatches.push(m);}
   const sorted=edgeMatches.slice().sort((x,y)=>x.edgeStartMm-y.edgeStartMm);
   for(let j=1;j<sorted.length;j++)if(sorted[j].edgeStartMm<sorted[j-1].edgeEndMm-COVERAGE_TOLERANCE_MM&&sorted[j].wallId!==sorted[j-1].wallId)ambiguous=true;
   const coverage=intervalLength(edgeMatches.map(m=>[m.edgeStartMm,m.edgeEndMm]));edges.push({lengthMm:len,coverageMm:Math.min(len,coverage)});matches.push(...edgeMatches);
  }
  if(ambiguous)return {status:'unavailable',complete:false,associationComplete:false,openingsComplete:false,grossAreaM2:null,openingAreaM2:null,netAreaM2:null,matchedBoundaryM:null,missingBoundaryM:null,segments:[],reason:'ambiguous-wall-face-association'};
  const matchedBoundaryMm=edges.reduce((s,e)=>s+e.coverageMm,0),missingBoundaryMm=Math.max(0,perimeterMm-matchedBoundaryMm);if(!matches.length)return {status:'unavailable',complete:false,associationComplete:false,openingsComplete:false,grossAreaM2:null,openingAreaM2:null,netAreaM2:null,matchedBoundaryM:0,missingBoundaryM:perimeterMm/1000,segments:[],reason:'room-wall-association-not-demonstrable'};
  const groups=new Map();for(const m of matches){const key=`${m.wallId}:${m.face}`,g=groups.get(key)||{wallId:m.wallId,face:m.face,intervals:[]};g.intervals.push([m.wallStartMm,m.wallEndMm]);groups.set(key,g);}
  const segments=[];let grossMm2=0,openingMm2=0,openingsComplete=true,wallGeometryComplete=true;
  for(const g of groups.values()){
   const w=project.walls.find(x=>x.id===g.wallId),intervals=mergeIntervals(g.intervals),lengthMm=intervalLength(intervals),heightOk=finite(w?.heightMm)&&w.heightMm>0;
   if(!heightOk){wallGeometryComplete=false;openingsComplete=false;segments.push({wallId:w.id,face:g.face,lengthM:lengthMm/1000,grossAreaM2:null,openingAreaM2:null,netAreaM2:null,materialId:w.surfaceMaterialId??null,lifecycleStatus:w.status??null,status:'unavailable',complete:false,reason:'invalid-wall-geometry'});continue;}
   const gross=lengthMm*w.heightMm,{rectangles,invalid}=openingRectangles(project,w,intervals),opening=invalid.length?null:rectangleUnionAreaMm2(rectangles),net=opening===null?null:Math.max(0,gross-opening);
   grossMm2+=gross;if(opening===null)openingsComplete=false;else openingMm2+=opening;
   segments.push({wallId:w.id,face:g.face,lengthM:lengthMm/1000,grossAreaM2:gross/1e6,openingAreaM2:opening===null?null:opening/1e6,netAreaM2:net===null?null:net/1e6,materialId:w.surfaceMaterialId??null,lifecycleStatus:w.status??null,status:scaleStatus,complete:opening!==null});
  }
  const associationComplete=missingBoundaryMm<=COVERAGE_TOLERANCE_MM*polygon.length,complete=associationComplete&&wallGeometryComplete&&openingsComplete;
  return {status:scaleStatus,complete,associationComplete,openingsComplete,grossAreaM2:grossMm2/1e6,openingAreaM2:openingsComplete?openingMm2/1e6:null,netAreaM2:openingsComplete?(grossMm2-openingMm2)/1e6:null,matchedBoundaryM:matchedBoundaryMm/1000,missingBoundaryM:missingBoundaryMm/1000,segments,
   ...(!associationComplete?{reason:'partial-room-wall-association'}:!wallGeometryComplete?{reason:'invalid-wall-geometry'}:!openingsComplete?{reason:'invalid-opening-geometry'}:{})};
 }
 function room(project,roomOrId){
  assertProject(project);const r=typeof roomOrId==='string'?project.rooms.find(x=>x.id===roomOrId):roomOrId;if(!r)throw new RangeError('FloorPlanQuantities: room not found.');
  const surface=Surface.level(project).rooms.find(x=>x.id===r.id),perimeterM=polygonPerimeterM(r.polygon),perimeterStatus=perimeterM===null?'unavailable':measurementStatus(project);
  return {id:r.id,name:r.name??'',family:r.family??null,counted:r.countsTowardArea!==false,floorMaterialId:r.floorMaterialId??null,status:surface?.status??'unavailable',
   floor:{areaM2:surface?.areaM2??null,status:surface?.status??'unavailable',source:'FloorPlanSurfaceMetrics'},
   perimeter:{lengthM:perimeterM,status:perimeterStatus,complete:perimeterM!==null,source:'room.polygon',openingDeduction:'none'},
   wallFaces:roomWallFaces(project,r)};
 }
 function aggregateMetric(items,field,unit){
  const known=items.filter(i=>finite(i?.quantities?.[field])),missing=items.filter(i=>!finite(i?.quantities?.[field])).map(i=>i.id),value=known.length?known.reduce((s,i)=>s+i.quantities[field],0):null;
  return {value,unit,status:!known.length?'unavailable':known.some(i=>i.status==='estimated')?'estimated':'measured',complete:known.length===items.length,missing};
 }
 function aggregateRoomPerimeter(rooms){
  const known=rooms.filter(r=>finite(r?.perimeter?.lengthM)),missing=rooms.filter(r=>!finite(r?.perimeter?.lengthM)).map(r=>r.id);
  return {lengthM:known.length?known.reduce((s,r)=>s+r.perimeter.lengthM,0):null,unit:'m',status:!known.length?'unavailable':known.some(r=>r.perimeter.status==='estimated')?'estimated':'measured',complete:known.length===rooms.length,missing,scope:'sum-of-room-interior-perimeters'};
 }
 function aggregateWalls(walls){
  const metric=(field,unit)=>aggregateMetric(walls,field,unit);
  return {count:walls.length,wallLength:metric('lengthM','m'),faceGrossArea:metric('faceGrossAreaM2','m2'),faceOpeningArea:metric('faceOpeningAreaM2','m2'),faceNetArea:metric('faceNetAreaM2','m2'),wallSurfaceGrossArea:metric('wallSurfaceGrossAreaM2','m2'),wallSurfaceOpeningArea:metric('wallSurfaceOpeningAreaM2','m2'),wallSurfaceNetArea:metric('wallSurfaceNetAreaM2','m2')};
 }
 function floorMaterials(rooms){
  const groups=new Map();for(const r of rooms){const id=r.floorMaterialId??null,key=id??'__none__',g=groups.get(key)||{materialId:id,roomIds:[],values:[],statuses:[],missing:[]};g.roomIds.push(r.id);if(finite(r.floor.areaM2)){g.values.push(r.floor.areaM2);g.statuses.push(r.floor.status);}else g.missing.push(r.id);groups.set(key,g);}
  return [...groups.values()].map(g=>({materialId:g.materialId,areaM2:g.values.length?g.values.reduce((a,b)=>a+b,0):null,status:!g.values.length?'unavailable':g.statuses.includes('estimated')?'estimated':'measured',complete:g.missing.length===0,missing:g.missing,roomIds:g.roomIds}));
 }
 function level(project,{levelId=null,name=null}={}){
  assertProject(project);const surface=Surface.level(project,{levelId,name}),rooms=project.rooms.map(r=>room(project,r)),walls=project.walls.map(w=>wall(project,w));
  const byStatus=Object.fromEntries(['existing','new','demolished'].map(s=>[s,aggregateWalls(walls.filter(w=>w.lifecycleStatus===s))]));
  return {levelId,name,status:surface.status,rooms,walls,quantities:{
   floor:{areaM2:surface.areaM2,status:surface.status,complete:surface.complete,missing:surface.missing,excluded:surface.excluded,source:'FloorPlanSurfaceMetrics'},
   roomPerimeter:aggregateRoomPerimeter(rooms),walls:aggregateWalls(walls),wallsByStatus:byStatus,openings:openingCounts(project.openings),floorMaterials:floorMaterials(rooms)
  }};
 }
 function combineLevelWalls(levels){return levels.flatMap(l=>l.walls);}
 function combineLevelRooms(levels){return levels.flatMap(l=>l.rooms);}
 function home(source){
  if(!source||typeof source!=='object')throw new TypeError('FloorPlanQuantities: expected project or building.');
  const isBuilding=Array.isArray(source.levels)&&source.levels.every(l=>l?.project),levels=isBuilding?[...source.levels].sort((a,b)=>(a.order??0)-(b.order??0)).map(l=>level(l.project,{levelId:l.id,name:l.name})):[level(assertProject(source))],surface=Surface.home(source),walls=combineLevelWalls(levels),rooms=combineLevelRooms(levels),byStatus=Object.fromEntries(['existing','new','demolished'].map(s=>[s,aggregateWalls(walls.filter(w=>w.lifecycleStatus===s))]));
  return {levels,status:surface.status,quantities:{floor:{areaM2:surface.areaM2,status:surface.status,complete:surface.complete,missing:surface.missing,excluded:surface.excluded,source:'FloorPlanSurfaceMetrics'},roomPerimeter:aggregateRoomPerimeter(rooms),walls:aggregateWalls(walls),wallsByStatus:byStatus,openings:{total:levels.reduce((s,l)=>s+l.quantities.openings.total,0),byKind:Object.fromEntries(KINDS.map(k=>[k,levels.reduce((s,l)=>s+l.quantities.openings.byKind[k],0)])),unit:'unit'},floorMaterials:floorMaterials(rooms)}};
 }
 const api={STATUS,FACE_TOLERANCE_MM,PARALLEL_SIN_TOLERANCE,COVERAGE_TOLERANCE_MM,distanceMm,polygonPerimeterM,wall,room,level,home};
 if(typeof module==='object')module.exports=api;else root.FloorPlanQuantities=api;
})(globalThis);
