'use strict';
// OP-07 · S4b Pulido 3D: sin costuras entre facetas. Las piezas comparten exactamente sus vértices de unión (ingletes
// por la tangente real), las caras curvas son lisas (normales continuas) y coronación, base, extremos y mochetas
// conservan aristas duras. Nada se esconde con materiales o luz: se mide la geometría.
const test=require('node:test'),assert=require('node:assert/strict');
const Core=require('../js/project-core.js'),Walls=require('../js/wall-geometry-core.js'),F=require('./op07/fixtures.cjs');
// pieceMesh da posiciones en milímetros de planta [x, altura, y] en un marco común (S4b); slopedPiece, en el marco local
// de la pieza (centro y ángulo), que es como se colocaban antes las cajas.
const local=(r,m,i)=>{const u=[Math.cos(r.angle),Math.sin(r.angle)],n=[-u[1],u[0]],x=m.positions[i],y=m.positions[i+1],z=m.positions[i+2];return [r.center[0]+x*u[0]+z*n[0],r.center[1]+x*u[1]+z*n[1],y];};
const world=(r,m,i)=>m.plan?[m.positions[i],m.positions[i+2],m.positions[i+1]]:local(r,m,i);
const wn=(r,m,i)=>[m.normals[i],m.normals[i+2],m.normals[i+1]];
// Extremo de cada vértice (−1 inicio, +1 final) según el orden de slopedPiece: caras +x (0–3) y −x (4–7), y el resto por su x local.
const sideOf=(r,m,i)=>{const raw=Walls.slopedPiece(r.spanMm,r.thickness,0,1,1,0);return Math.sign(raw.positions[i]);};
function joints(pieces,meshes){const out=[];
 for(let k=1;k<pieces.length;k++){const [A,B]=[meshes[k-1],meshes[k]],[ra,rb]=[pieces[k-1],pieces[k]];
  const face=(m,r,i)=>{const raw=Walls.slopedPiece(r.spanMm,r.thickness,0,1,1,0);return Math.abs(raw.normals[i+2])>0.5;};
  const end=[],start=[];for(let i=0;i<A.positions.length;i+=3)if(sideOf(ra,A,i)>0)end.push({p:world(ra,A,i),n:wn(ra,A,i),face:face(A,ra,i)});
  for(let i=0;i<B.positions.length;i+=3)if(sideOf(rb,B,i)<0)start.push({p:world(rb,B,i),n:wn(rb,B,i),face:face(B,rb,i)});
  out.push({end,start,touch:Math.hypot(ra.poly[1][0]-rb.poly[0][0],ra.poly[1][1]-rb.poly[0][1])<50});}
 return out;}
const near=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));

test('S4b · juntas sin hueco ni solape: cada vértice de un extremo coincide con uno del siguiente (muro curvo e inclinado)',()=>{
 for(const opts of [{withOpening:false,heightEndMm:2400},{withOpening:false,bulgeMm:-900}]){
  const {project,wall}=F.curved(F.base(),opts),P=Core.geometry(project).walls.filter(r=>r.id===wall.id),M=P.map(r=>Core.pieceMesh(r,0,10));
  let worst=0;for(const j of joints(P,M).filter(j=>j.touch))for(const a of j.end)worst=Math.max(worst,Math.min(...j.start.map(b=>near(a.p,b.p))));
  assert.equal(worst,0,`esquinas compartidas idénticas (diferencia ${worst} mm)`);}
});

test('S4b · sin el inglete habría costura: la prueba distingue (mismo muro con cajas rectas)',()=>{
 const {project,wall}=F.curved(F.base(),{withOpening:false}),P=Core.geometry(project).walls.filter(r=>r.id===wall.id);
 const box=P.map(r=>Walls.slopedPiece(r.spanMm,r.thickness,0,r.heightStart*1000,r.heightEnd*1000,r.alongMm));
 let worst=0;for(const j of joints(P,box))for(const a of j.end)worst=Math.max(worst,Math.min(...j.start.map(b=>near(a.p,b.p))));
 assert.ok(worst>1,`las cajas rectas dejaban ${worst.toFixed(2)} mm de costura`);
});

test('S4b · caras curvas lisas (normales continuas en las juntas) y aristas duras en coronación y base',()=>{
 const {project,wall}=F.curved(F.base(),{withOpening:false,heightEndMm:2400}),P=Core.geometry(project).walls.filter(r=>r.id===wall.id),M=P.map(r=>Core.pieceMesh(r,0,10));
 for(const j of joints(P,M))for(const a of j.end.filter(x=>x.face)){const b=j.start.filter(x=>x.face).sort((x,y)=>near(a.p,x.p)-near(a.p,y.p))[0];
  const dot=a.n.reduce((s,v,i)=>s+v*b.n[i],0);assert.ok(dot>1-1e-12,`normal continua (${dot})`);}
 for(const m of M)for(let i=0;i<m.normals.length;i+=3){const ny=m.normals[i+1];if(Math.abs(ny)>0.5)assert.ok(Math.hypot(m.normals[i],m.normals[i+2])<0.2,'coronación y base no se suavizan con las caras');}
});

test('S4b · huecos en curva: dintel y antepecho por faceta, que comparten la mocheta con las piezas macizas vecinas',()=>{
 const {project,wall}=F.curved(F.base(),{heightEndMm:2400}),g=Core.geometry(project),o=project.openings.find(x=>x.id==='opn_op07-win');
 const pieces=g.walls.filter(r=>r.id===wall.id),fill=g.wallInfills.filter(r=>r.openingId===o.id);
 assert.ok(fill.some(r=>r.band==='head')&&fill.some(r=>r.band==='sill'),'dintel y antepecho');
 const head=fill.filter(r=>r.band==='head'),cover=head.reduce((s,r)=>s+r.spanMm,0);assert.ok(Math.abs(cover-o.widthMm)<1e-6,'el dintel cubre todo el hueco sobre la trayectoria');
 const before=pieces.find(r=>Math.abs((r.alongMm+r.spanMm/2)-o.offsetMm)<1e-6),first=head.find(r=>Math.abs((r.alongMm-r.spanMm/2)-o.offsetMm)<1e-6);
 assert.equal(before.ends.end,first.ends.start,'la misma junta (mismo objeto) a los dos lados de la mocheta');
 assert.ok(g.windows.find(r=>r.openingId===o.id).curvedHost,'el renderer no dibuja la caja recta sobre la cuerda');
});

test('S4b · muros rectos e inclinados rectos: sin cambios (sin inglete ni normales nuevas)',()=>{
 const {project,wall}=F.sloped(F.base(),{heightEndMm:2200}),P=Core.geometry(project).walls.filter(r=>r.id===wall.id);
 for(const r of P){const m=Core.pieceMesh(r,0,10),raw=Walls.slopedPiece(r.spanMm,r.thickness,0,r.heightStart*1000,r.heightEnd*1000,r.alongMm);
  for(let i=0;i<raw.positions.length;i+=3){const a=world(r,m,i),b=local(r,raw,i);assert.ok(near(a,b)<1e-6,'misma caja, ahora en planta');}}
});

test('S4b · las caras internas de una junta no se emiten (solo extremos reales y mochetas)',()=>{
 const {project,wall}=F.curved(F.base(),{heightEndMm:2400}),P=Core.geometry(project).walls.filter(r=>r.id===wall.id);
 for(const r of P){const m=Core.pieceMesh(r,0,10),faces=m.groups.map(g=>g[2]);
  assert.equal(faces.includes(0),!r.seamEnd);assert.equal(faces.includes(1),!r.seamStart);assert.equal(m.indices.length,faces.length*6);}
 assert.ok(P.some(r=>r.seamStart)&&P.some(r=>!r.seamEnd),'hay juntas internas y extremos reales');
});
