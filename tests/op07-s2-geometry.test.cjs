'use strict';
// OP-07 · S2 Geometría y plano: un rectángulo por faceta del núcleo único, macizo donde no hay abertura; muros rectos
// idénticos a master; símbolo de abertura en su sitio real sobre la trayectoria.
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const Core=require('../js/project-core.js'),Walls=require('../js/wall-geometry-core.js'),F=require('./op07/fixtures.cjs');
const hash=g=>{const {source,...rest}=g;return crypto.createHash('sha256').update(JSON.stringify(rest)).digest('hex');};
const near=(a,b,e=1e-6)=>Math.abs(a-b)<=e;

test('S2 · muros rectos: geometría idéntica byte a byte a master (02712b51) en el proyecto de ejemplo',()=>{
 assert.equal(hash(Core.geometry(Core.initial())),'9ed837545457015eb34460ac82ac005b0d3752808651bea4eb16ee15001b94a0');
 for(const w of Core.initial().walls)assert.deepEqual(Core.wallOutline(w),Core.wallRect(w).poly);
});

test('S2 · en un proyecto con un muro curvo, todos los demás muros y aberturas salen igual que sin él',()=>{
 const plain=F.base(),{project,wall}=F.curved(F.base(),{heightEndMm:2400,withOpening:false});
 const strip=g=>({walls:g.walls.filter(r=>r.id!==wall.id).map(r=>JSON.stringify(r)),doors:JSON.stringify(g.doors),windows:JSON.stringify(g.windows),rooms:JSON.stringify(g.rooms)});
 assert.deepEqual(strip(Core.geometry(project)),strip(Core.geometry(plain)));
});

test('S2 · muro curvo: piezas por faceta que cubren la trayectoria menos las aberturas, con alturas continuas',()=>{
 const {project,wall}=F.curved(F.base(),{heightEndMm:2400});Core.validate(project);
 const g=Core.geometry(project),pieces=g.walls.filter(r=>r.id===wall.id),path=Walls.pathProfile(wall,Core.WALL_PATH);
 const holes=project.openings.filter(o=>o.wallId===wall.id).reduce((s,o)=>s+o.widthMm,0);
 assert.ok(near(pieces.reduce((s,r)=>s+r.spanMm,0),path.length-holes,1e-6),'macizo = trayectoria − aberturas');
 assert.ok(pieces.every(r=>r.id===wall.id&&r.shaped),'cada pieza conserva el id del muro (selección)');
 assert.ok(near(pieces[0].heightStart,2.8)&&near(pieces.at(-1).heightEnd,2.4),'pendiente de 2,8 a 2,4 m');
 for(let i=1;i<pieces.length;i++)if(near(pieces[i].poly[0][0],pieces[i-1].poly[1][0],1e-6))assert.ok(near(pieces[i].heightStart,pieces[i-1].heightEnd),'alturas continuas');
 // Resolución: la desviación máxima de cada faceta respecto a la curva no supera la tolerancia única.
 assert.ok(Walls.deviationBound(wall,Walls.facetCount(wall,Core.WALL_PATH))<=Core.WALL_PATH.toleranceMm+1e-12);
 // La envolvente incluye la panza de la curva (no solo la cuerda).
 const xs=pieces.flatMap(r=>r.poly.map(p=>p[0])),ys=pieces.flatMap(r=>r.poly.map(p=>p[1])),e=g.envelope;
 assert.ok(Math.min(...xs)>=e.x-1e-6&&Math.max(...xs)<=e.x+e.w+1e-6&&Math.min(...ys)>=e.y-1e-6&&Math.max(...ys)<=e.y+e.h+1e-6);
});

test('S2 · aberturas en curva: el símbolo se dibuja sobre la cuerda entre sus dos bordes reales',()=>{
 const {project,wall}=F.curved(F.base());const g=Core.geometry(project),path=Walls.pathProfile(wall,Core.WALL_PATH);
 const win=project.openings.find(o=>o.id==='opn_op07-win'),door=project.openings.find(o=>o.id==='opn_op07-door');
 const r=g.windows.find(x=>x.openingId===win.id),a=path.sample(win.offsetMm).point,b=path.sample(win.offsetMm+win.widthMm).point;
 assert.ok(near(r.center[0],(a.x+b.x)/2)&&near(r.center[1],(a.y+b.y)/2),'centro de la ventana en su sitio');
 const d=g.doors.find(x=>x.id===door.id),s=path.sample(door.offsetMm).point;
 assert.ok(Math.hypot(d.h[0]-s.x,d.h[1]-s.y)<=wall.thicknessMm/2+1e-6,'bisagra en el borde real de la puerta');
 assert.ok(near(d.len,Math.hypot(path.sample(door.offsetMm+door.widthMm).point.x-s.x,path.sample(door.offsetMm+door.widthMm).point.y-s.y)),'hoja = cuerda del hueco');
});

test('S2 · contorno de un muro curvo: cerrado, con las dos caras de todas las facetas',()=>{
 const {wall}=F.curved(F.base(),{withOpening:false}),o=Core.wallOutline(wall),n=Walls.facetCount(wall,Core.WALL_PATH);
 assert.equal(o.length,2*(n+1));
 const area=Math.abs(o.reduce((s,p,i)=>s+p[0]*o[(i+1)%o.length][1]-o[(i+1)%o.length][0]*p[1],0))/2;
 assert.ok(Math.abs(area-Core.wallLength(wall)*wall.thicknessMm)/area<0.01,'área del contorno ≈ trayectoria × grosor');
});
