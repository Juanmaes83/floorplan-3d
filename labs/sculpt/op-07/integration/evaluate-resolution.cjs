'use strict';
/* OP-07 · Evaluación de la resolución de las curvas (D-OP07-3): tolerancia métrica única y techo de 1024 facetas.
   Mide, sin decidir: facetas, desviación máxima exacta, error de longitud frente a la longitud real (Gauss-Legendre),
   deriva de una abertura al dividir y coste de cálculo. Uso: node labs/sculpt/op-07/integration/evaluate-resolution.cjs */
const W=require('../wall-geometry-core.js');
const CASES=[
 ['Típico · 4 m, flecha 1,5 m',{start:{x:0,y:0},end:{x:4000,y:0},curve:{control:{x:2000,y:1500}}}],
 ['Pronunciado · 3 m, control 2,8 m',{start:{x:0,y:0},end:{x:3000,y:0},curve:{control:{x:1500,y:2800}}}],
 ['Largo · 60 m, control 20 m',{start:{x:0,y:0},end:{x:60000,y:0},curve:{control:{x:30000,y:20000}}}],
 ['Fachada · 200 m, control 60 m',{start:{x:0,y:0},end:{x:200000,y:0},curve:{control:{x:100000,y:60000}}}],
 ['Límite de coordenadas · 2 km, control 1 km',{start:{x:-1000000,y:0},end:{x:1000000,y:0},curve:{control:{x:0,y:1000000}}}],
].map(([name,w])=>[name,{id:'w',thicknessMm:240,heightMm:2800,structure:'partition',status:'new',...w}]);
const TOLS=[null,2,1,0.5];
const rows=[];
for(const [name,w] of CASES){const real=W.arcLength(w);
 for(const tol of TOLS){const opts=tol?{toleranceMm:tol}:{},n=W.facetCount(w,opts),dev=W.deviationBound(w,n),len=W.pathProfile(w,opts).length;
  // Deriva de una abertura de 900 mm centrada en el 30 % tras dividir en el 60 %.
  const L=len,o={id:'o',offsetMm:L*.3-450,widthMm:900,heightMm:2100,sillHeightMm:0},s=W.splitAt(w,L*.6,[o],opts);
  const t0=process.hrtime.bigint();for(let i=0;i<200;i++)W.pathProfile(w,opts);const ms=Number(process.hrtime.bigint()-t0)/1e6/200;
  rows.push({caso:name,tolerancia:tol===null?'16 fijas':tol+' mm',facetas:n,techo:n===W.MAX_FACETS?'sí':'no',desviacionMm:+dev.toFixed(3),errorLongitudMm:+(real-len).toFixed(3),derivaAberturaMm:+s.maxDriftMm.toFixed(3),msPorTrayectoria:+ms.toFixed(4)});}}
// ¿Desde qué flecha manda el techo con 1 mm? bend/(4·1024²) > 1 mm ⇔ |P0−2P1+P2| > 4 194 304 mm.
const capBendMm=4*W.MAX_FACETS**2*1;
const md=['| Caso | Resolución | Facetas | Techo 1024 | Desviación máx. (mm) | Error de longitud (mm) | Deriva de abertura al dividir (mm) | ms por trayectoria |','|---|---|---|---|---|---|---|---|',
 ...rows.map(r=>`| ${r.caso} | ${r.tolerancia} | ${r.facetas} | ${r.techo} | ${r.desviacionMm} | ${r.errorLongitudMm} | ${r.derivaAberturaMm} | ${r.msPorTrayectoria} |`)].join('\n');
if(require.main===module){console.log(md);console.log(`\nCon 1 mm, el techo de ${W.MAX_FACETS} facetas solo actúa si |P0 − 2·P1 + P2| > ${capBendMm} mm (${(capBendMm/1000).toFixed(0)} m).`);}
module.exports={rows,md,capBendMm};
