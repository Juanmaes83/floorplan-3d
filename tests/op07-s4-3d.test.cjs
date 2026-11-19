'use strict';
// OP-07 · S4 3D (pura): cada pieza de un muro curvo o inclinado es una caja con pendiente del núcleo único, con las
// alturas del muro en sus dos extremos y UV continuas a lo largo de todo el muro; las piezas rectas siguen siendo cajas.
const test=require('node:test'),assert=require('node:assert/strict');
const Core=require('../js/project-core.js'),Walls=require('../js/wall-geometry-core.js'),F=require('./op07/fixtures.cjs');
const near=(a,b,e=1e-6)=>Math.abs(a-b)<=e;
// u en los extremos ±x de la cara +z (vértices 16–19 de slopedPiece: −hw,yb | hw,yb | hw,ytr | −hw,ytl).
const uEnds=m=>[m.uvs[16*2],m.uvs[17*2]];

test('S4 · muros rectos y a nivel: cajas como siempre (pieceMesh null)',()=>{
 const g=Core.geometry(Core.initial());assert.ok([...g.walls,...g.windows,...g.voids,...g.doors.map(d=>d.rect)].every(r=>Core.pieceMesh(r,0,2.8)===null));
});

test('S4 · muro curvo e inclinado: alturas en los extremos, recorte por sección y UV continuas en todo el muro',()=>{
 const {project,wall}=F.curved(F.base(),{heightEndMm:2400,withOpening:false});const pieces=Core.geometry(project).walls.filter(r=>r.id===wall.id);
 const meshes=pieces.map(r=>Core.pieceMesh(r,0,10));
 for(const [i,m] of meshes.entries()){const r=pieces[i],ys=[];for(let k=0;k<m.positions.length;k+=3)ys.push(m.positions[k+1]);
  assert.ok(near(Math.max(...ys),Math.max(r.heightStart,r.heightEnd)*1000,1e-6),'cima de la pieza = altura del muro');}
 for(let i=1;i<meshes.length;i++)assert.ok(near(uEnds(meshes[i])[0],uEnds(meshes[i-1])[1],1e-9),`UV continua entre las piezas ${i-1} y ${i}`);
 const total=Core.wallLength(wall)/Walls.TEXTURE_TILE_MM;assert.ok(near(uEnds(meshes.at(-1))[1],total,1e-9)&&near(uEnds(meshes[0])[0],0,1e-12),'de 0 a longitud/tesela');
 // Sección (corte a 1,2 m): ninguna cima supera el corte.
 for(const m of pieces.map(r=>Core.pieceMesh(r,0,1.2))){for(let k=1;k<m.positions.length;k+=3)assert.ok(m.positions[k]<=1200+1e-9);}
});

test('S4 · dintel en muro inclinado: el relleno sobre la abertura sigue la pendiente en sus dos bordes',()=>{
 const {project,wall}=F.curved(F.base(),{heightEndMm:2400});const g=Core.geometry(project),path=Walls.pathProfile(wall,Core.WALL_PATH);
 const r=g.windows.find(x=>x.openingId==='opn_op07-win'),o=project.openings.find(x=>x.id==='opn_op07-win');
 assert.ok(near(r.heightStart*1000,path.sample(o.offsetMm).height)&&near(r.heightEnd*1000,path.sample(o.offsetMm+o.widthMm).height));
 const m=Core.pieceMesh(r,r.head,10),ys=[];for(let k=1;k<m.positions.length;k+=3)ys.push(m.positions[k]);
 assert.ok(near(Math.min(...ys),r.head*1000)&&near(Math.max(...ys),Math.max(r.heightStart,r.heightEnd)*1000));
});
