/* Phase C comparison metrics. Read-only: reuses FloorPlanCore geometry and the Phase A layout review; it never
   mutates, stores or validates beyond what those modules already do. */
(function(root){
 const C=typeof module==='object'?require('./project-core.js'):root.FloorPlanCore;
 const R=typeof module==='object'?require('./layout-review.js'):root.FloorPlanLayoutReview;
 // Same net floor area as the app header: rooms counted toward area, polygon area in m² (mm² / 1e6).
 function netAreaM2(project){return C.geometry(project).rooms.filter(r=>r.counted!==false).reduce((a,r)=>a+Math.abs(r.poly.reduce((s,p,i)=>{const q=r.poly[(i+1)%r.poly.length];return s+p[0]*q[1]-q[0]*p[1];},0))/2/1e6,0);}
 function metrics(project,options={}){
  const review=R.review(project,options),counts={solape:0,holgura:0,puerta:0};for(const f of review.findings)counts[f.code]++;
  return {netAreaM2:netAreaM2(project),objects:(project.objects||[]).length,review:{status:review.status,checks:review.checks,counts,skipped:review.skipped.length,excluded:review.excluded.length,scaleConfidence:review.scaleConfidence}};
 }
 const api={netAreaM2,metrics};if(typeof module==='object')module.exports=api;else root.FloorPlanVariants=api;
})(globalThis);
