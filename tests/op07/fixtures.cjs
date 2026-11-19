'use strict';
/* OP-07 · proyectos de prueba con muros curvos e inclinados, construidos sobre el proyecto de ejemplo real
   (Core.initial). Ninguno es un proyecto de cliente. */
const Core=require('../../js/project-core.js');
const clone=x=>JSON.parse(JSON.stringify(x));
// El muro más largo del ejemplo con un hueco: se curva hacia fuera de la vivienda y se inclina de 2800 a 2400 mm.
function base(){const p=Core.clone(Core.initial());p.schemaVersion='2.0.0';return p;}
function longest(p,{withOpening=true}={}){const has=new Set(p.openings.map(o=>o.wallId));
 return p.walls.filter(w=>w.status!=='demolished'&&(!withOpening||has.has(w.id))).sort((a,b)=>Math.hypot(b.end.x-b.start.x,b.end.y-b.start.y)-Math.hypot(a.end.x-a.start.x,a.end.y-a.start.y))[0];}
function curved(p=base(),{bulgeMm=600,heightEndMm,withOpening=true}={}){const w=longest(p,{withOpening});
 const mx=(w.start.x+w.end.x)/2,my=(w.start.y+w.end.y)/2,L=Math.hypot(w.end.x-w.start.x,w.end.y-w.start.y),nx=-(w.end.y-w.start.y)/L,ny=(w.end.x-w.start.x)/L;
 w.curve={control:{x:Math.round(mx+nx*bulgeMm*2),y:Math.round(my+ny*bulgeMm*2)}};if(heightEndMm!==undefined)w.heightEndMm=heightEndMm;return {project:p,wall:w};}
function sloped(p=base(),{heightEndMm=2400}={}){const w=longest(p,{withOpening:false});w.heightEndMm=heightEndMm;return {project:p,wall:w};}
// Un muro aislado (sin estancias que dependan de él) para pruebas de fórmula.
function lone({start={x:0,y:0},end={x:4000,y:0},control,heightMm=2800,heightEndMm,thicknessMm=240}={}){
 const p=base();p.walls=[{id:'wal_op07',start,end,thicknessMm,heightMm,structure:'partition',status:'new',...(control?{curve:{control}}:{}),...(heightEndMm!==undefined?{heightEndMm}:{})}];
 p.openings=[];p.rooms=[];p.objects=[];p.measurements=[];return p;}
module.exports={clone,base,longest,curved,sloped,lone};
