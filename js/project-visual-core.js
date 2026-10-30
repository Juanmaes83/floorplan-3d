/* Project-First A1: read model → presentation data. Everything here is derived from values the app already computes
   (Core.geometry, FloorPlanSurfaceMetrics, the brand snapshot, the review state). It owns no data, persists nothing
   and never mutates its inputs. Coordinates stay in model millimetres; the UI only scales them.
   UMD: window.FloorPlanProjectVisual in the browser, module.exports in Node tests. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanProjectVisual=api;})(typeof self!=='undefined'?self:this,function(){
 'use strict';
 const finite=p=>Array.isArray(p)&&Number.isFinite(p[0])&&Number.isFinite(p[1]);
 const usable=poly=>Array.isArray(poly)&&poly.length>=3&&poly.every(finite);
 const points=poly=>poly.map(p=>`${+p[0].toFixed(1)},${+p[1].toFixed(1)}`).join(' ');
 function extent(list,pad){
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  for(const poly of list)for(const [x,y]of poly){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
  if(!Number.isFinite(minX)||maxX-minX<=0||maxY-minY<=0)return null;
  const p=Math.max(maxX-minX,maxY-minY)*pad;return [minX-p,minY-p,maxX-minX+2*p,maxY-minY+2*p];
 }
 const activeWalls=geometry=>(geometry?.walls||[]).filter(w=>w.status!=='demolished'&&usable(w.poly));
 // Top view of the active floor: room polygons (counted or excluded from the area) and solid wall portions.
 function plan(geometry){
  // Demolished walls stay in the drawing, flagged, as the 2D plan shows them; the viewBox follows the standing ones.
  const rooms=(geometry?.rooms||[]).filter(r=>usable(r.poly)),walls=(geometry?.walls||[]).filter(w=>usable(w.poly));
  const viewBox=extent([...rooms.map(r=>r.poly),...activeWalls(geometry).map(w=>w.poly)],.03);
  if(!viewBox)return {status:'unavailable',reason:'no-geometry'};
  return {status:'available',viewBox,rooms:rooms.map(r=>({id:r.id,counted:r.counted!==false,points:points(r.poly)})),walls:walls.map(w=>({id:w.id,demolished:w.status==='demolished',points:points(w.poly)}))};
 }
 // Schematic axonometric of the same walls at their own declared height (Core.geometry gives metres). A line
 // diagram of the model, not a render: no lighting, materials, furniture or camera of the 3D view.
 const COS=Math.cos(Math.PI/6),SIN=Math.sin(Math.PI/6);
 const project=(x,y,z)=>[(x-y)*COS,(x+y)*SIN-z];
 function axonometric(geometry){
  const rooms=(geometry?.rooms||[]).filter(r=>usable(r.poly)),walls=activeWalls(geometry).filter(w=>Number.isFinite(w.height)&&w.height>0);
  if(!walls.length)return {status:'unavailable',reason:'no-walls'};
  const faces=[];
  for(const r of rooms)faces.push({kind:'floor',counted:r.counted!==false,depth:-Infinity,poly:r.poly.map(([x,y])=>project(x,y,0))});
  for(const w of walls){
   const h=w.height*1000,base=w.poly,depth=base.reduce((s,[x,y])=>s+x+y,0)/base.length,signed=base.reduce((s,a,i)=>{const b=base[(i+1)%base.length];return s+a[0]*b[1]-b[0]*a[1];},0);
   for(let i=0;i<base.length;i++){
    const a=base[i],b=base[(i+1)%base.length],nx=(b[1]-a[1])*Math.sign(signed),ny=-(b[0]-a[0])*Math.sign(signed);
    // The viewer looks from +x,+y: only side faces whose outward normal points there are drawn.
    if(nx+ny>0)faces.push({kind:'wall-side',depth,poly:[project(a[0],a[1],0),project(b[0],b[1],0),project(b[0],b[1],h),project(a[0],a[1],h)]});
   }
   faces.push({kind:'wall-top',depth,poly:base.map(([x,y])=>project(x,y,h))});
  }
  faces.sort((a,b)=>a.depth-b.depth);
  const viewBox=extent(faces.map(f=>f.poly),.04);
  return {status:'available',viewBox,faces:faces.map(f=>({kind:f.kind,...(f.kind==='floor'?{counted:f.counted}:{}),points:points(f.poly)})),maxHeightMm:Math.max(...walls.map(w=>w.height*1000))};
 }
 // Project identity and the figures every area already shows, from the existing metric (never recomputed).
 function summary({project,geometry,metrics,levelContext=null,brand=null}={}){
  const rooms=(metrics?.levels||[]).flatMap(l=>l.rooms||[]);
  const level=levelContext?.levels?.length?(()=>{const sorted=[...levelContext.levels].sort((a,b)=>a.order-b.order),i=sorted.findIndex(l=>l.id===levelContext.activeLevelId);return i<0?null:{name:sorted[i].name,index:i+1,count:sorted.length};})():null;
  const p=brand?.profile;
  return {
   name:project?.name||'',
   areaM2:metrics?.areaM2??null,status:metrics?.status||'unavailable',complete:metrics?.complete!==false,
   roomsCounted:rooms.filter(r=>r.counted).length,roomsExcluded:rooms.filter(r=>!r.counted).length,
   spacesOnLevel:(geometry?.rooms||[]).length,
   level,
   scale:project?.scale?.confidence||'pending',
   brand:p?{name:p.name,person:p.person||'',tagline:p.tagline||'',email:p.email||'',phone:p.phone||'',web:p.web||'',logo:typeof p.logo==='string'&&p.logo.startsWith('data:image/')?p.logo:null}:null
  };
 }
 // Honest delivery state per output. Only what the inputs prove is «ready»; nothing is generated or invented here.
 // states: ready (preview from the real output) · generate (produced on demand, nothing saved yet) · review (exists,
 // with warnings to check) · missing (needs data from the person) · unavailable (not in this version).
 function deliveryStates({summary:s,sheet={ok:false},building=null,review={pending:0,written:0},images=[]}={}){
  const states={
   'surface-sheet':s?.areaM2!==null&&s?.areaM2!==undefined?'ready':'missing',
   sheet:sheet.ok?'ready':'missing',
   presentation:!s?.spacesOnLevel?'missing':building==='pending'?'review':'ready',
   images:images.length?'ready':'generate',
   budget:'unavailable',
   review:review.pending?'review':'ready',
   identity:s?.brand?'ready':'missing'
  };
  const counts={ready:0,generate:0,review:0,missing:0,unavailable:0};for(const v of Object.values(states))counts[v]++;
  return {states,counts};
 }
 return {plan,axonometric,summary,deliveryStates};
});
