'use strict';
// Genera el DXF del ejemplo con el muro más largo curvo e inclinado (con ventana y puerta) y lo que debe leer un lector
// independiente. Uso: node g02-dxf-curved.cjs <serie> <salida.dxf> <esperado.json>
const [serie,out,expOut]=process.argv.slice(2),fs=require('node:fs'),path=require('node:path');
const Core=require(path.join(serie,'js/project-core.js')),DXF=require(path.join(serie,'js/dxf-export.js')),F=require(path.join(serie,'tests/op07/fixtures.cjs'));
const {project,wall}=F.curved(F.base(),{heightEndMm:2300});Core.validate(project);
const feet=project.walls.filter(w=>w.status!=='demolished').flatMap(w=>Core.wallFootprints(w).map(poly=>({w,poly})));
DXF.exportLevel(project).then(dxf=>{fs.writeFileSync(out,dxf);
 const facets=Core.wallFootprints(wall).length,openings=project.openings.filter(o=>project.walls.some(w=>w.id===o.wallId));
 // Área de cada huella (lazo de Gauss): sin ambigüedad aunque una faceta sea más corta que el grueso del muro.
 const area=p=>Math.abs(p.reduce((t,q,i)=>{const r=p[(i+1)%p.length];return t+q[0]*r[1]-r[0]*q[1];},0))/2;
 const curvedArea=Core.wallFootprints(wall).reduce((t,p)=>t+area(p),0),expected=wall.thicknessMm*Core.wallLength(wall);
 if(Math.abs(curvedArea-expected)/expected>1e-6)throw Error(`las facetas (${curvedArea}) no cubren grueso × trayectoria (${expected})`);
 fs.writeFileSync(expOut,JSON.stringify({footprints:feet.length,footprintAreaMm2:feet.reduce((t,f)=>t+area(f.poly),0),facets,pathMm:Core.wallLength(wall),curvedAreaMm2:curvedArea,
  doors:openings.filter(o=>o.kind==='door').length,windows:openings.filter(o=>o.kind==='window').length}));});
