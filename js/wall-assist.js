/* Experimental local axis-aligned raster line proposals. No DOM, IO or persistent model. */
(function(root){
 'use strict';
 const C=typeof module==='object'?require('./project-core.js'):root.FloorPlanCore;
 const T=typeof module==='object'?require('./tracing-core.js'):root.FloorPlanTracing;
 const MAX_SIDE=512,MAX_CANDIDATES=40;
 function detect({width,height,data}){
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||Math.max(width,height)>MAX_SIDE||!(data instanceof Uint8ClampedArray)||data.length!==width*height*4)throw Error('Raster de análisis no válido (máximo 512 px por lado).');
  const gray=new Uint8Array(width*height);let low=255,high=0;
  for(let i=0;i<gray.length;i++){const a=data[i*4+3]/255,v=Math.round((.299*data[i*4]+.587*data[i*4+1]+.114*data[i*4+2])*a+255*(1-a));gray[i]=v;low=Math.min(low,v);high=Math.max(high,v);}
  // Algorithm constants on sampled pixels, not accuracy/performance acceptance thresholds.
  if(high-low<60)return [];
  const threshold=Math.min(200,(low+high)/2),runs=[];
  for(const vertical of [false,true]){
   const major=vertical?height:width,minor=vertical?width:height,minLength=Math.max(20,Math.ceil(major*.12));
   for(let row=0;row<minor;row++){
    let start=-1,last=-1,hits=0;
    const finish=()=>{if(start>=0&&last-start+1>=minLength&&hits/(last-start+1)>=.8)runs.push({vertical,row,start,end:last});start=last=-1;hits=0;};
    for(let col=0;col<major;col++){
     const dark=gray[vertical?col*width+row:row*width+col]<=threshold;
     if(dark){if(start<0)start=col;last=col;hits++;}else if(start>=0&&col-last>4)finish();
    }finish();
   }
  }
  // Merge the adjacent parallel runs of a stroke; propose its center, not both edges.
  const bands=[];
  for(const run of runs){const band=bands.find(b=>b.vertical===run.vertical&&run.row-b.lastRow<=1&&Math.abs(run.start-b.start)<=4&&Math.abs(run.end-b.end)<=4);
   if(band){band.lastRow=run.row;band.rows++;band.sumRow+=run.row;band.start=Math.min(band.start,run.start);band.end=Math.max(band.end,run.end);}else bands.push({...run,lastRow:run.row,rows:1,sumRow:run.row});}
  return bands.filter(b=>b.rows<=12).sort((a,b)=>(b.end-b.start)-(a.end-a.start)).slice(0,MAX_CANDIDATES).map((b,n)=>{const row=b.sumRow/b.rows;return {id:`candidate_${n+1}`,start:b.vertical?{x:row,y:b.start}:{x:b.start,y:row},end:b.vertical?{x:row,y:b.end}:{x:b.end,y:row}};});
 }
 function toWorld(candidate,image,width,height){
  if(!image.placement)throw Error('Coloca la imagen antes de solicitar sugerencias.');
  const point=p=>C.point(T.imageToWorld(image,{x:p.x*image.widthPx/width,y:p.y*image.heightPx/height}));
  return {id:candidate.id,start:point(candidate.start),end:point(candidate.end)};
 }
 function accept(project,candidate,start=candidate.start,end=candidate.end){
  // Reuse F1b creation/validation. Callers commit the cloned project via existing history.
  const wall=T.wall(project,start,end);wall.source={method:'suggested',review:'confirmed'};C.validate(project);return wall;
 }
 const api={MAX_SIDE,MAX_CANDIDATES,detect,toWorld,accept};if(typeof module==='object')module.exports=api;else root.FloorPlanWallAssist=api;
})(globalThis);
