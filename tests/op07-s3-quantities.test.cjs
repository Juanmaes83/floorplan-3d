'use strict';
// OP-07 · S3 Mediciones y presupuestos: superficies independientes de ambas caras (D-OP07-2), trapecios en pendiente,
// mochetas aparte; proyectos existentes byte a byte idénticos; nada se estima ni se recorta en silencio.
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const Core=require('../js/project-core.js'),Q=require('../js/quantity-core.js'),D=require('../js/budget-draft-core.js'),Walls=require('../js/wall-geometry-core.js'),F=require('./op07/fixtures.cjs');
const h=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex'),labels=new Proxy({},{get:(t,k)=>String(k)});
const near=(a,b,e=1e-9)=>Math.abs(a-b)<=e*Math.max(1,Math.abs(a),Math.abs(b));

test('S3 · proyectos existentes: cantidades y líneas de presupuesto byte a byte idénticas a master (02712b51)',()=>{
 const p=Core.initial(),[level,home,lines]='cb40c93bc1e9454ac764120aecc4b519f82718e3297f56ec07d1614d51c0764f 23fa529b8c32581973c75824a222353a54518597ad31c222b6a1a6523849986f cafc0bd1d74fda2a317598c65995de4e63129b620aaf85acd717123da3e8e0fe'.split(' ');
 assert.equal(h(Q.level(p)),level);assert.equal(h(Q.home(p)),home);assert.equal(h(D.lines(p,{labels})),lines);
});

test('S3 · muro curvo: longitud de trayectoria, cara izquierda y derecha distintas que suman 2 × eje, mochetas aparte',()=>{
 const {project,wall}=F.curved(F.base(),{heightEndMm:2400});const q=Q.wall(project,wall.id),k=q.quantities,f=q.faces;
 assert.equal(q.complete,true);assert.ok(near(k.lengthM*1000,Core.wallLength(wall)));
 assert.ok(Math.abs(f.left.lengthM-f.right.lengthM)>0.1,'en curva, una cara es más larga que la otra');
 for(const key of ['grossAreaM2','openingAreaM2','netAreaM2'])assert.ok(near(f.left[key]+f.right[key],2*({grossAreaM2:k.faceGrossAreaM2,openingAreaM2:k.faceOpeningAreaM2,netAreaM2:k.faceNetAreaM2})[key],1e-9),key+': izquierda + derecha = 2 × eje');
 assert.ok(near(k.wallSurfaceNetAreaM2,f.left.netAreaM2+f.right.netAreaM2));
 for(const side of [f.left,f.right])assert.ok(near(side.netAreaM2,side.grossAreaM2-side.openingAreaM2));
 const outer=f.left.lengthM>f.right.lengthM?f.left:f.right,inner=outer===f.left?f.right:f.left;assert.ok(outer.openingAreaM2>inner.openingAreaM2,'el hueco es mayor en la cara exterior');
 assert.ok(k.revealsAreaM2>0);assert.equal(k.heightEndM,2.4);
});

test('S3 · muro inclinado recto: trapecio, en el muro y en la cara de cada estancia',()=>{
 const {project,wall}=F.sloped(F.base(),{heightEndMm:2000}),L=F.len(wall);const k=Q.wall(project,wall.id).quantities;
 assert.ok(near(k.faceGrossAreaM2*1e6,L*(wall.heightMm+2000)/2,1e-9));
 const segs=project.rooms.flatMap(r=>Q.room(project,r.id).wallFaces.segments.filter(s=>s.wallId===wall.id));assert.ok(segs.length>=1,'alguna estancia da a ese muro');
 for(const s of segs)assert.ok(s.grossAreaM2<s.lengthM*wall.heightMm/1000+1e-9,'la cara de la estancia ya no usa la altura de inicio como si fuera a nivel');
});

test('S3 · sin recorte silencioso: abertura que no cabe → huecos y neta null, complete:false',()=>{
 const p=F.lone({control:{x:2000,y:1500}}),w=p.walls[0];p.openings=[{id:'opn_x',wallId:w.id,kind:'window',offsetMm:Math.ceil(Core.wallLength(w)),widthMm:600,heightMm:1000,sillHeightMm:900}];
 const q=Q.wall(p,w.id);assert.equal(q.complete,false);assert.equal(q.reason,'invalid-opening-geometry');
 assert.equal(q.quantities.faceNetAreaM2,null);assert.equal(q.quantities.wallSurfaceNetAreaM2,null);assert.ok(q.quantities.faceGrossAreaM2>0);
});

test('S3 · presupuesto: la partida de pintura suma ambas caras reales de los muros curvos, sin cambiar el resto',()=>{
 const {project,wall}=F.curved(F.base());const plain=F.base();
 const paint=p=>D.lines(p,{labels}).find(l=>l.key==='paint').quantity.value;
 const delta=paint(project)-paint(plain),w=Q.wall(project,wall.id).quantities,before=Q.wall(plain,wall.id).quantities;
 assert.ok(near(delta,w.wallSurfaceNetAreaM2-before.wallSurfaceNetAreaM2,1e-9),'solo cambia lo que aporta el muro curvo');
});

test('S3 · estancia cerca de un muro curvo pero NO dibujada contra él (convivencia con UX-03): incompleta y nombrada, nunca por la cuerda',()=>{
 const {project,wall}=F.curved(F.base(),{withOpening:false});
 // El salón se separa 40 mm de la cara del muro: ya no se puede demostrar que lo sigue.
 for(const v of project.rooms.find(r=>r.id==='rom_living').polygon)if(v.y===10560)v.y=10520;
 const f=Q.room(project,'rom_living').wallFaces;
 assert.equal(f.complete,false);assert.equal(f.associationComplete,false);assert.ok(f.missingBoundaryM>0);assert.deepEqual(f.pendingCurvedWalls,[wall.id]);
 assert.ok(f.segments.every(s=>s.wallId!==wall.id),'el muro curvo no se mide por su cuerda');
});
