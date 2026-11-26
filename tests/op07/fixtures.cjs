'use strict';
/* OP-07 · proyectos de prueba con muros curvos e inclinados, construidos sobre el proyecto de ejemplo real
   (Core.initial). Ninguno es un proyecto de cliente. */
// OP-07 S8: the OP-07 tests exercise the ACTIVE state explicitly (Node is a test origin); the product default is 'integrated'.
globalThis.RUBIK_OP07_STATE='active';
const Core=require('../../js/project-core.js');
const clone=x=>JSON.parse(JSON.stringify(x));
// El ejemplo pone cada abertura en su propio tramo de muro; las pruebas curvan el muro MACIZO más largo y, si se pide,
// le añaden una ventana y una puerta reales sobre la trayectoria (offset físico, como el contrato).
function base(){const p=Core.clone(Core.initial());p.schemaVersion='2.0.0';return p;}
const len=w=>Math.hypot(w.end.x-w.start.x,w.end.y-w.start.y);
function longest(p){const used=new Set(p.openings.map(o=>o.wallId));return p.walls.filter(w=>w.status!=='demolished'&&!used.has(w.id)).sort((a,b)=>len(b)-len(a))[0];}
function curved(p=base(),{bulgeMm=600,heightEndMm,withOpening=true}={}){const w=longest(p);
 const mx=(w.start.x+w.end.x)/2,my=(w.start.y+w.end.y)/2,L=len(w),nx=-(w.end.y-w.start.y)/L,ny=(w.end.x-w.start.x)/L;
 w.curve={control:{x:Math.round(mx+nx*bulgeMm*2),y:Math.round(my+ny*bulgeMm*2)}};if(heightEndMm!==undefined)w.heightEndMm=heightEndMm;
 if(withOpening){const path=Core.wallLength(w);
  p.openings.push({id:'opn_op07-win',wallId:w.id,kind:'window',offsetMm:Math.round(path*.18),widthMm:1200,heightMm:1100,sillHeightMm:900},
   {id:'opn_op07-door',wallId:w.id,kind:'door',offsetMm:Math.round(path*.6),widthMm:900,heightMm:2100,sillHeightMm:0,swing:{hinge:'start',side:'left'}});}
 return {project:p,wall:w};}
function sloped(p=base(),{heightEndMm=2400}={}){const w=longest(p);w.heightEndMm=heightEndMm;return {project:p,wall:w};}
// Un muro aislado (sin estancias que dependan de él) para pruebas de fórmula.
function lone({start={x:0,y:0},end={x:4000,y:0},control,heightMm=2800,heightEndMm,thicknessMm=240}={}){
 const p=base();p.walls=[{id:'wal_op07',start,end,thicknessMm,heightMm,structure:'partition',status:'new',...(control?{curve:{control}}:{}),...(heightEndMm!==undefined?{heightEndMm}:{})}];
 p.openings=[];p.rooms=[];p.objects=[];p.measurements=[];return p;}
module.exports={clone,base,longest,curved,sloped,lone,len};
