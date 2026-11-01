/* FT3D-5 — axonometría y despiece espacial del edificio (contrato V2,
   docs/product/ft3d-5-axon-exploded-building-contract-2026-11-01.md).
   Pure core: from the levels of the building (or the single project) it derives the descriptor the two narratives use —
   which levels can be read, where they sit in the building (mm, model space) and the visual-only vertical separation of
   the spatial breakdown. It never touches the DOM, Three, storage or the network, never reads the clock or random numbers
   and never mutates its input. The separation is a reading aid, not a measurement: real elevations are kept and the
   extra height is never shown as a dimension.

   Coordinates (model space, mm): offsetMm.x is the building X axis, offsetMm.y the building plan Y axis, elevationMm the
   vertical. Per level boundsMm = {minXmm, maxXmm, minPlanYmm, maxPlanYmm, bottomMm, topMm}; bottom/top are building
   vertical values (they include elevationMm). The 3D view converts this to world metres once (x → X, plan y → Z,
   vertical → Y); this module does not. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanPresentationAxon=api;})(typeof self!=='undefined'?self:this,function(){
 'use strict';
 const AXON={version:2,gapFactor:.45,gapMinMm:800,gapMaxMm:1600,clearanceFactor:.25,clearanceMinMm:200,clearanceMaxMm:400,fallbackStoreyMm:2800};
 const REASONS={
  'no-levels':'El proyecto no tiene niveles que leer.',
  'invalid-level-geometry':'Ningún nivel tiene muros y contorno válidos para una lectura axonométrica.',
  'degenerate-building-envelope':'El volumen del edificio es demasiado pequeño para leerse.',
  'single-level':'El despiece necesita al menos dos niveles.',
  'insufficient-valid-levels':'El despiece necesita al menos dos niveles con muros y contorno válidos.'
 };
 const finite=v=>typeof v==='number'&&Number.isFinite(v);
 const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
 const z=v=>v===0?0:v;
 const activeWall=w=>w&&w.status!=='demolished'&&finite(w.start?.x)&&finite(w.start?.y)&&finite(w.end?.x)&&finite(w.end?.y);
 // Height of a level from its own walls (or the project default): never from furniture.
 function wallTopOf(project){
  const walls=(project?.walls||[]).filter(activeWall);
  const heights=walls.map(w=>w.heightMm).filter(h=>finite(h)&&h>0);
  const def=project?.defaults?.wallHeightMm;
  const all=[...heights,...(finite(def)&&def>0?[def]:[])];
  return all.length?Math.max(...all):null;
 }
 function median(values){const v=[...values].sort((a,b)=>a-b),n=v.length;return n%2?v[(n-1)/2]:(v[n/2-1]+v[n/2])/2;}
 // A level reads in the building when it can show a real spatial envelope: a finite, non-degenerate plan contour,
 // at least one standing wall and a demonstrable height.
 function levelOf(source,sourceIndex){
  const id=source?.levelId??null,order=finite(source?.order)?source.order:sourceIndex;
  const e=source?.geometry?.envelope,project=source?.project;
  const offset={x:finite(source?.offsetMm?.x)?source.offsetMm.x:0,y:finite(source?.offsetMm?.y)?source.offsetMm.y:0};
  const elevation=finite(source?.elevationMm)?source.elevationMm:0;
  const height=wallTopOf(project);
  const valid=!!e&&[e.x,e.y,e.w,e.h].every(finite)&&e.w>0&&e.h>0&&(project?.walls||[]).some(activeWall)&&height!==null;
  if(!valid)return {levelId:id,valid:false,reason:'invalid-level-geometry'};
  return {valid:true,levelId:id,order,sourceIndex,offsetMm:{x:z(offset.x),y:z(offset.y)},elevationMm:z(elevation),
   boundsMm:{minXmm:z(e.x+offset.x),maxXmm:z(e.x+e.w+offset.x),minPlanYmm:z(e.y+offset.y),maxPlanYmm:z(e.y+e.h+offset.y),bottomMm:z(elevation),topMm:z(elevation+height)},wallTopMm:height};
 }
 const byStack=(a,b)=>a.order-b.order||a.sourceIndex-b.sourceIndex||(String(a.levelId)<String(b.levelId)?-1:String(a.levelId)>String(b.levelId)?1:0);
 function envelopeOf(levels,extra){
  if(!levels.length)return null;
  return {minXmm:Math.min(...levels.map(l=>l.boundsMm.minXmm)),maxXmm:Math.max(...levels.map(l=>l.boundsMm.maxXmm)),
   minPlanYmm:Math.min(...levels.map(l=>l.boundsMm.minPlanYmm)),maxPlanYmm:Math.max(...levels.map(l=>l.boundsMm.maxPlanYmm)),
   bottomMm:Math.min(...levels.map((l,i)=>l.boundsMm.bottomMm+(extra?extra[i]:0))),topMm:Math.max(...levels.map((l,i)=>l.boundsMm.topMm+(extra?extra[i]:0)))};
 }
 const degenerate=e=>!e||!(e.maxXmm-e.minXmm>0&&e.maxPlanYmm-e.minPlanYmm>0&&e.topMm-e.bottomMm>0);
 /* Visual separation (§12): nominal storey = median of positive elevation steps between consecutive valid levels, else
    the tallest demonstrable wall, else 2800; base gap = clamp(round(storey × 0.45), 800, 1600); clearance =
    clamp(round(gap × 0.25), 200, 400); each level i > 0 is lifted by the larger of i × gap and what it takes to clear
    the level below (its lifted top + clearance), never less than 0. Absolute values, never accumulated per frame. */
 function separation(levels){
  const steps=[];for(let i=1;i<levels.length;i++){const d=levels[i].elevationMm-levels[i-1].elevationMm;if(d>0)steps.push(d);}
  const tallest=Math.max(...levels.map(l=>l.wallTopMm));
  const nominal=steps.length?median(steps):finite(tallest)&&tallest>0?tallest:AXON.fallbackStoreyMm;
  const gap=clamp(Math.round(nominal*AXON.gapFactor),AXON.gapMinMm,AXON.gapMaxMm);
  const clearance=clamp(Math.round(gap*AXON.clearanceFactor),AXON.clearanceMinMm,AXON.clearanceMaxMm);
  const extra=[0];
  for(let i=1;i<levels.length;i++){const prev=levels[i-1].boundsMm,cur=levels[i].boundsMm;
   extra.push(Math.max(i*gap,prev.topMm+extra[i-1]+clearance-cur.bottomMm,0));}
  return {nominal,gap,clearance,extra};
 }
 function unsupported(reason,excluded){
  return {version:AXON.version,supported:false,reason,partial:false,
   variants:{axon:{supported:false,reason,variant:'compact-building'},exploded:{supported:false,reason,variant:'vertical-levels'}},
   levels:[],nominalStoreyMm:null,baseVisualGapMm:null,visualClearanceMm:null,envelope:null,explodedEnvelope:null,excluded,message:REASONS[reason]};
 }
 /* input: {levels:[{levelId, order, project, geometry, offsetMm:{x,y}, elevationMm}]} — every structural level of the
    building (BuildingUI.presentationSources()), or one entry for a single project (levelId null). */
 function derive(input){
  const sources=Array.isArray(input?.levels)?input.levels:[];
  if(!sources.length)return unsupported('no-levels',[]);
  const read=sources.map(levelOf);
  const excluded=read.filter(l=>!l.valid).map(l=>({levelId:l.levelId,reason:l.reason}));
  const valid=read.filter(l=>l.valid).sort(byStack);
  if(!valid.length)return unsupported('invalid-level-geometry',excluded);
  const envelope=envelopeOf(valid);
  if(degenerate(envelope))return unsupported('degenerate-building-envelope',excluded);
  const explodedReason=valid.length>=2?null:sources.length>=2?'insufficient-valid-levels':'single-level';
  const sep=explodedReason?null:separation(valid);
  const levels=valid.map((l,i)=>({levelId:l.levelId,order:l.order,sourceIndex:l.sourceIndex,offsetMm:{...l.offsetMm},elevationMm:l.elevationMm,boundsMm:{...l.boundsMm},explodedExtraYmm:sep?z(sep.extra[i]):0}));
  return {version:AXON.version,supported:true,reason:null,partial:excluded.length>0,
   variants:{axon:{supported:true,reason:null,variant:'compact-building'},exploded:{supported:!explodedReason,reason:explodedReason,variant:'vertical-levels'}},
   levels,nominalStoreyMm:sep?sep.nominal:null,baseVisualGapMm:sep?sep.gap:null,visualClearanceMm:sep?sep.clearance:null,
   envelope,explodedEnvelope:sep?envelopeOf(valid,sep.extra):null,excluded,message:null};
 }
 // The 8 corners of an envelope in model space (mm): [x, planY, vertical].
 function cornersMm(e){if(!e)return [];const out=[];for(const [x,y] of [[e.minXmm,e.minPlanYmm],[e.maxXmm,e.minPlanYmm],[e.maxXmm,e.maxPlanYmm],[e.minXmm,e.maxPlanYmm]])for(const h of [e.bottomMm,e.topMm])out.push([x,y,h]);return out;}
 return {derive,cornersMm,AXON,REASONS};
});
