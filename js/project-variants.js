/* Phase C comparison metrics. Read-only: reuses FloorPlanCore geometry and the Phase A layout review; it never
   mutates, stores or validates beyond what those modules already do. */
(function(root){
 const C=typeof module==='object'?require('./project-core.js'):root.FloorPlanCore;
 const R=typeof module==='object'?require('./layout-review.js'):root.FloorPlanLayoutReview;
 const S=typeof module==='object'?require('./surface-core.js'):root.FloorPlanSurfaces;
 // Net floor area from the surface core (room → level → home): rooms counted toward area; 0 when none computes.
 function netAreaM2(project){return S.home(project).areaM2??0;}
 function metrics(project,options={}){
  const review=R.review(project,options),counts={solape:0,holgura:0,puerta:0};for(const f of review.findings)counts[f.code]++;
  return {netAreaM2:netAreaM2(project),objects:(project.objects||[]).length,review:{status:review.status,checks:review.checks,counts,skipped:review.skipped.length,excluded:review.excluded.length,scaleConfidence:review.scaleConfidence}};
 }
 // A single viewBox for the whole family keeps scale and orientation identical across cards.
 function comparisonFrame(projects){
  const scenes=projects.map(project=>{
   const g=C.geometry(project);
   const objects=(project.objects||[]).map(o=>{
    const a=(o.rotationDeg||0)*Math.PI/180,c=Math.cos(a),s=Math.sin(a),w=o.size.widthMm/2,d=o.size.depthMm/2;
    return {id:o.id,roomId:o.roomId||null,poly:[[-w,-d],[w,-d],[w,d],[-w,d]].map(([x,y])=>[o.position.x+x*c-y*s,o.position.y+x*s+y*c])};
   });
   return {rooms:g.rooms.map(r=>({id:r.id,poly:r.poly})),walls:g.walls.map(w=>({id:w.wallId||w.id,poly:w.poly})),doors:g.doors.map(d=>({id:d.id,poly:d.rect.poly})),objects,envelope:g.envelope};
  });
  const positions=scenes.flatMap(s=>[[s.envelope.x,s.envelope.y],[s.envelope.x+s.envelope.w,s.envelope.y+s.envelope.h],...s.objects.flatMap(o=>o.poly)]);
  const left=Math.min(...positions.map(p=>p[0])),top=Math.min(...positions.map(p=>p[1]));
  const right=Math.max(...positions.map(p=>p[0])),bottom=Math.max(...positions.map(p=>p[1]));
  let width=Math.max(1000,right-left)+1200,height=Math.max(1000,bottom-top)+1200;
  const centerX=(left+right)/2,centerY=(top+bottom)/2;
  if(width/height<1.6)width=height*1.6;else height=width/1.6;
  return {viewBox:[centerX-width/2,centerY-height/2,width,height],scenes};
 }
 const api={netAreaM2,metrics,comparisonFrame};if(typeof module==='object')module.exports=api;else root.FloorPlanVariants=api;
})(globalThis);
