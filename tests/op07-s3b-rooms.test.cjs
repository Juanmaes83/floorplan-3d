'use strict';
// OP-07 · S3b Estancias por el anillo canónico: el polígono guardado, siguiendo la cara facetada de cada muro curvo
// contra el que se dibujó. Plano, suelo, perímetro, caras, huecos y presupuesto salen del mismo anillo; nada por la cuerda.
const test=require('node:test'),assert=require('node:assert/strict');
const Core=require('../js/project-core.js'),Q=require('../js/quantity-core.js'),S=require('../js/surface-core.js'),D=require('../js/budget-draft-core.js'),Walls=require('../js/wall-geometry-core.js'),F=require('./op07/fixtures.cjs');
const near=(a,b,e)=>Math.abs(a-b)<=e,labels=new Proxy({},{get:(t,k)=>String(k)});
const shoelace=pts=>Math.abs(pts.reduce((s,p,i)=>{const q=pts[(i+1)%pts.length];return s+p.x*q.y-q.x*p.y;},0))/2;
// Caja de dos estancias separadas por un muro central (t = 200), 6 × 4 m interiores cada una, con muros a ejes.
function box({control,heightEndMm}={}){const p=F.base(),t=200,W=(id,s,e,extra={})=>({id,start:s,end:e,thicknessMm:t,heightMm:2700,structure:'partition',status:'existing',...extra});
 p.walls=[W('wal_nor',{x:0,y:0},{x:12300,y:0}),W('wal_est',{x:12300,y:0},{x:12300,y:4200}),W('wal_sur',{x:12300,y:4200},{x:0,y:4200}),W('wal_oes',{x:0,y:4200},{x:0,y:0}),
  W('wal_mid',{x:6150,y:0},{x:6150,y:4200},{...(control?{curve:{control}}:{}),...(heightEndMm?{heightEndMm}:{})})];
 const mat=p.materials.find(m=>m.category==='floor').id,R=(id,x0,x1)=>({id,name:id,floorMaterialId:mat,countsTowardArea:true,polygon:[{x:x0,y:100},{x:x1,y:100},{x:x1,y:4100},{x:x0,y:4100}]});
 p.rooms=[R('rom_aaa',100,6050),R('rom_bbb',6250,12200)];p.openings=[];p.objects=[];p.measurements=[];return p;}
const area=(p,id)=>Q.room(p,id).floor.areaM2;

test('S3b · sin muros curvos el anillo ES el polígono (mismo objeto): v1 sin ningún cambio',()=>{
 const p=Core.initial();for(const r of p.rooms)assert.equal(Core.roomRing(p,r).points,r.polygon);
});

test('S3b · convexo y cóncavo: cada estancia gana o pierde exactamente lo que la cara curva encierra',()=>{
 const flat=box(),A0=area(flat,'rom_aaa'),B0=area(flat,'rom_bbb');
 for(const [name,cx] of [['hacia B',6150+2400],['hacia A',6150-2400]]){
  const p=box({control:{x:cx,y:2100}});Core.validate(p);const A=area(p,'rom_aaa'),B=area(p,'rom_bbb');
  assert.ok(name==='hacia B'?A>A0&&B<B0:A<A0&&B>B0,name);
  // Conservación: lo que gana una estancia y pierde la otra difiere solo en la huella extra del muro (más largo).
  const w=p.walls.find(x=>x.id==='wal_mid'),extra=w.thicknessMm*(Core.wallLength(w)-4200)/1e6;
  assert.ok(near((A0+B0)-(A+B),extra,0.03),`${name}: A+B pierde la huella extra del muro (${extra.toFixed(3)} m²)`);
 }
});

test('S3b · el anillo coincide con interiorArea/roomRing del núcleo (área interior por barrido descontando huellas)',()=>{
 for(const cx of [6150+2400,6150-2400]){const p=box({control:{x:cx,y:2100}}),byId=id=>p.walls.find(w=>w.id===id);
  const ringA=Walls.roomRing([byId('wal_nor'),byId('wal_mid'),byId('wal_sur'),byId('wal_oes')].map(w=>w.id==='wal_nor'?{...w,end:{x:6150,y:0}}:w.id==='wal_sur'?{...w,start:{x:6150,y:4200}}:w));
  const core=Walls.interiorArea(ringA,[],p.walls.filter(w=>w.id!=='wal_est'));
  assert.ok(near(area(p,'rom_aaa'),core,0.05),`S3b ${area(p,'rom_aaa').toFixed(3)} ≈ núcleo ${core.toFixed(3)} m²`);}
});

test('S3b · unión con muros rectos: anillo simple, cerrado y unido en las esquinas; perímetro = longitud del anillo',()=>{
 const p=box({control:{x:6150+2000,y:2100}}),r=p.rooms[0],ring=Core.roomRing(p,r).points;
 const seg=ring.map((a,i)=>[a,ring[(i+1)%ring.length]]),cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
 for(let i=0;i<seg.length;i++)for(let j=i+2;j<seg.length;j++){if(i===0&&j===seg.length-1)continue;const [a,b]=seg[i],[c,d]=seg[j];
  assert.ok(!(cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0),'sin autointersecciones');}
 const per=seg.reduce((s,[a,b])=>s+Math.hypot(b.x-a.x,b.y-a.y),0);assert.ok(near(Q.room(p,'rom_aaa').perimeter.lengthM*1000,per,1e-6));
 assert.ok(ring.length>4&&Core.geometry(p).rooms[0].poly.length===ring.length,'el plano dibuja el anillo');
});

test('S3b · caras de estancia: cubierta entera = cara del muro de ese lado (bruta, huecos y neta), con pendiente',()=>{
 const p=box({control:{x:6150+2400,y:2100},heightEndMm:2300}),w=p.walls.find(x=>x.id==='wal_mid');
 p.openings=[{id:'opn_mid',wallId:'wal_mid',kind:'door',offsetMm:1500,widthMm:900,heightMm:2050,sillHeightMm:0}];
 // Estancia que sobrepasa el muro por los dos extremos: sigue toda su cara.
 p.rooms[1].polygon=[{x:6000,y:-500},{x:13000,y:-500},{x:13000,y:4700},{x:6000,y:4700}];const wf=Q.wall(p,'wal_mid').faces;
 // La cara del lado de A es la del lado izquierdo o derecho según la dirección del muro; se compara con la que coincide.
 const ra=Q.room(p,'rom_aaa').wallFaces.segments.find(s=>s.curved);const side=ra.face>0?wf.left:wf.right;
 assert.ok(ra&&ra.complete);assert.ok(ra.lengthM<side.lengthM,'A cubre su cara salvo las uniones con los muros norte y sur');
 assert.ok(near(ra.openingAreaM2,side.openingAreaM2,1e-9),'la puerta entera cae en la cara de A');
 assert.ok(ra.netAreaM2>0&&near(ra.grossAreaM2-ra.openingAreaM2,ra.netAreaM2,1e-9));
});

test('S3b · cara completa de un muro: exactamente faceAreas() del núcleo en ese lado',()=>{
 const p=F.lone({start:{x:0,y:0},end:{x:6000,y:0},control:{x:3000,y:-2000},heightEndMm:2200}),w=p.walls[0];
 p.openings=[{id:'opn_lon',wallId:w.id,kind:'window',offsetMm:2000,widthMm:1200,heightMm:1000,sillHeightMm:900}];
 const mat=p.materials.find(m=>m.category==='floor').id;p.rooms=[{id:'rom_lon',name:'L',floorMaterialId:mat,polygon:[{x:-1000,y:120},{x:7000,y:120},{x:7000,y:3000},{x:-1000,y:3000}].reverse()}];
 const seg=Q.room(p,'rom_lon').wallFaces.segments.find(s=>s.curved),f=Q.wall(p,w.id).faces,side=seg.face>0?f.left:f.right;
 for(const k of ['lengthM','grossAreaM2','openingAreaM2','netAreaM2'])assert.ok(near(seg[k],side[k],1e-9),k);
});

test('S3b · presupuesto: el suelo del salón crece lo que encierra la curva; la pintura no cambia por el anillo',()=>{
 const plain=F.base(),{project}=F.curved(F.base(),{withOpening:false}),L=p=>D.lines(p,{labels});
 const mat=plain.rooms.find(r=>r.id==='rom_living').floorMaterialId,floor=p=>L(p).find(l=>l.key==='floor:'+mat).quantity.value;
 const d=floor(project)-floor(plain),dA=area(project,'rom_living')-area(plain,'rom_living');assert.ok(dA>1.5&&near(d,dA,1e-9));
 assert.equal(S.level(project).rooms.find(r=>r.id==='rom_living').areaM2,area(project,'rom_living'),'una sola cifra de suelo');
});

test('S3b · UX-03: el salón junto al muro curvo tiene su cara curva medida y ningún muro pendiente',()=>{
 const {project,wall}=F.curved(F.base(),{heightEndMm:2400}),f=Q.room(project,'rom_living').wallFaces;
 assert.ok(f.segments.some(s=>s.wallId===wall.id&&s.curved&&s.complete));assert.equal(f.pendingCurvedWalls,undefined);
 assert.ok(near(f.missingBoundaryM,Q.room(F.base(),'rom_living').wallFaces.missingBoundaryM,1e-9),'solo falta el lado abierto que ya faltaba');
});
