'use strict';
// OP-07 · S3b tras dividir un muro curvo (defecto reproducido el 20/11/2026): la estancia dibujada contra la cuerda
// ORIGINAL sigue la cara de la cadena de piezas. Antes de la corrección, suelo y presupuesto volvían a la cuerda
// (27,07 → 23,80 m²) sin que la geometría cambiara. Ni segunda geometría ni anillo distinto: el mismo roomRing.
const test=require('node:test'),assert=require('node:assert/strict');
const Core=require('../js/project-core.js'),Q=require('../js/quantity-core.js'),S=require('../js/surface-core.js'),D=require('../js/budget-draft-core.js'),F=require('./op07/fixtures.cjs');
const near=(a,b,e)=>Math.abs(a-b)<=e,labels=new Proxy({},{get:(t,k)=>String(k)});
function box({control,heightEndMm,t=200}={}){const p=F.base(),W=(id,s,e,extra={})=>({id,start:s,end:e,thicknessMm:t,heightMm:2700,structure:'partition',status:'existing',...extra});
 p.walls=[W('wal_nor',{x:0,y:0},{x:12300,y:0}),W('wal_est',{x:12300,y:0},{x:12300,y:4200}),W('wal_sur',{x:12300,y:4200},{x:0,y:4200}),W('wal_oes',{x:0,y:4200},{x:0,y:0}),
  W('wal_mid',{x:6150,y:0},{x:6150,y:4200},{...(control?{curve:{control}}:{}),...(heightEndMm?{heightEndMm}:{})})];
 const mat=p.materials.find(m=>m.category==='floor').id,R=(id,x0,x1)=>({id,name:id,floorMaterialId:mat,countsTowardArea:true,polygon:[{x:x0,y:100},{x:x1,y:100},{x:x1,y:4100},{x:x0,y:4100}]});
 p.rooms=[R('rom_aaa',100,6050),R('rom_bbb',6250,12200)];p.openings=[];p.objects=[];p.measurements=[];return p;}
const mid=p=>p.walls.find(w=>w.id==='wal_mid');
const split=(p,id,at,newId)=>{const r=Core.splitWall(p,id,at,{newId});assert.ok(r.ok,r.explanation);return r.project;};
const ringLen=pts=>pts.reduce((s,a,i)=>{const b=pts[(i+1)%pts.length];return s+Math.hypot(b.x-a.x,b.y-a.y);},0);
const faces=(p,id)=>{const f=Q.room(p,id).wallFaces,c=f.segments.filter(s=>s.curved);
 return {complete:c.every(s=>s.complete),pending:f.pendingCurvedWalls,walls:c.map(s=>s.wallId).sort(),
  len:c.reduce((a,s)=>a+s.lengthM,0),gross:c.reduce((a,s)=>a+s.grossAreaM2,0),open:c.reduce((a,s)=>a+s.openingAreaM2,0),net:c.reduce((a,s)=>a+s.netAreaM2,0)};};
// Lo que una persona ve y presupuesta de cada estancia: suelo, perímetro y caras del muro curvo.
const look=p=>Object.fromEntries(p.rooms.map(r=>[r.id,{area:Q.room(p,r.id).floor.areaM2,perim:ringLen(Core.roomRing(p,r).points),...faces(p,r.id)}]));
// Cuña de cada junta: cada pieza mide su cara con el extremo perpendicular a su última faceta (D-OP07-2, cara izquierda +
// derecha = 2 × eje), así que una cara gana y la otra pierde a lo sumo t/2·θ por junta (θ = giro entre las facetas que se
// encuentran). Suelo y perímetro salen del anillo y no tienen esa cuña.
function wedgeM(p){const W=require('../js/wall-geometry-core.js'),cs=p.walls.filter(w=>W.isCurved(w)),dir=(a,b)=>Math.atan2(b.y-a.y,b.x-a.x);let m=0;
 for(const a of cs)for(const b of cs){if(a===b||Math.hypot(a.end.x-b.start.x,a.end.y-b.start.y)>=1)continue;const ca=W.centreline(a,Core.WALL_PATH),cb=W.centreline(b,Core.WALL_PATH);
  let th=Math.abs(dir(ca[ca.length-2],ca[ca.length-1])-dir(cb[0],cb[1]));if(th>Math.PI)th=2*Math.PI-th;m+=a.thicknessMm/2*Math.tan(th/2)*2/1000;}
 return m;}
function same(before,after,tag,slackM=0){for(const id of Object.keys(before)){const a=before[id],b=after[id];
 assert.ok(near(a.area,b.area,0.005),`${tag} ${id}: suelo ${a.area.toFixed(4)} → ${b.area.toFixed(4)} m²`);
 assert.ok(near(a.perim,b.perim,5),`${tag} ${id}: perímetro ${a.perim.toFixed(1)} → ${b.perim.toFixed(1)} mm`);
 const e={len:slackM+0.001,gross:slackM*2.8+0.002,open:0.002,net:slackM*2.8+0.002};
 for(const k of ['len','gross','open','net'])assert.ok(near(a[k],b[k],e[k]),`${tag} ${id}: cara ${k} ${a[k]} → ${b[k]} (cuña ${slackM.toFixed(4)} m)`);
 assert.ok(b.complete,`${tag} ${id}: cara completa`);assert.equal(b.pending,undefined,`${tag} ${id}: ningún muro pendiente`);}}

test('S3b split · convexo y cóncavo, estancias a ambos lados: dividir no cambia suelo, perímetro ni caras',()=>{
 for(const cx of [6150+2400,6150-2400]){const p=box({control:{x:cx,y:2100}}),before=look(p);
  const q=split(p,'wal_mid',Core.wallLength(mid(p))/2,'wal_mi2'),after=look(q);same(before,after,`cx=${cx}`,wedgeM(q));assert.ok(wedgeM(q)<0.01,'cuña < 1 cm');
  for(const id of ['rom_aaa','rom_bbb'])assert.deepEqual(after[id].walls,['wal_mi2','wal_mid'],'la cara es de las dos piezas');}
});

test('S3b split · regresión del defecto: sin cadena, el suelo volvía a la cuerda (23,80 m²)',()=>{
 const q=split(box({control:{x:6150+2400,y:2100}}),'wal_mid',3000,'wal_mi2');
 const chord=Q.room(box(),'rom_aaa').floor.areaM2;assert.ok(near(chord,23.8,1e-6));
 assert.ok(Q.room(q,'rom_aaa').floor.areaM2>chord+3,'el salón conserva lo que encierra la curva');
});

test('S3b split · huecos en cada pieza, pendiente y juntas múltiples (tres piezas): mismas cifras',()=>{
 const p=box({control:{x:6150+2400,y:2100},heightEndMm:2300});
 p.openings=[{id:'opn_door1',wallId:'wal_mid',kind:'door',offsetMm:900,widthMm:900,heightMm:2050,sillHeightMm:0},{id:'opn_win01',wallId:'wal_mid',kind:'window',offsetMm:3600,widthMm:1000,heightMm:900,sillHeightMm:900}];
 Core.validate(p);const before=look(p),L=Core.wallLength(mid(p));
 const q=split(p,'wal_mid',L/2,'wal_mi2'),r=split(q,'wal_mi2',600,'wal_mi3');
 assert.ok(q.openings.find(o=>o.id==='opn_door1').wallId==='wal_mid'&&q.openings.find(o=>o.id==='opn_win01').wallId==='wal_mi2','cada hueco en su pieza');
 same(before,look(q),'2 piezas',wedgeM(q));same(before,look(r),'3 piezas',wedgeM(r));
 assert.ok(before.rom_aaa.open>1,'los huecos cuentan en la cara');
});

test('S3b split · una pieza dada la vuelta (dibujada al revés) sigue en la cadena',()=>{
 const p=box({control:{x:6150+2400,y:2100}}),before=look(p),q=split(p,'wal_mid',2500,'wal_mi2'),w=q.walls.find(x=>x.id==='wal_mi2');
 const slack=wedgeM(q);[w.start,w.end]=[w.end,w.start];same(before,look(q),'invertida',slack);
});

test('S3b split · presupuesto y superficie: una sola cifra, igual antes y después',()=>{
 const p=box({control:{x:6150-2400,y:2100}}),q=split(p,'wal_mid',2000,'wal_mi2'),mat=p.rooms[0].floorMaterialId;
 const floor=x=>D.lines(x,{labels}).find(l=>l.key==='floor:'+mat).quantity.value;
 assert.ok(near(floor(p),floor(q),0.01));
 for(const x of [p,q])for(const r of x.rooms)assert.equal(S.level(x).rooms.find(s=>s.id===r.id).areaM2,Q.room(x,r.id).floor.areaM2);
});

test('S3b split · atómico y reversible: el original no cambia y volver a él (deshacer) devuelve las mismas cifras',()=>{
 const p=box({control:{x:6150+2400,y:2100}}),snap=JSON.stringify(p),before=look(p),q=split(p,'wal_mid',3000,'wal_mi2');
 assert.equal(JSON.stringify(p),snap,'dividir no toca el documento anterior');
 assert.deepEqual(look(JSON.parse(snap)),before,'deshacer = documento anterior, cifras idénticas');
 assert.deepEqual(look(split(JSON.parse(snap),'wal_mid',3000,'wal_mi2')),look(q),'rehacer = mismas cifras');
});

test('S3b split · negativos: una estancia redibujada contra una pieza sigue SOLO esa pieza; sin cadena no se inventa cara',()=>{
 const q=split(box({control:{x:6150+2400,y:2100}}),'wal_mid',Core.wallLength(mid(box({control:{x:6150+2400,y:2100}})))/2,'wal_mi2'),a=q.walls.find(w=>w.id==='wal_mid');
 // Estancia triangular con una arista paralela a la cuerda de la primera pieza, a medio grueso, del lado de fuera de la curva.
 const L=Math.hypot(a.end.x-a.start.x,a.end.y-a.start.y),n={x:-(a.end.y-a.start.y)/L,y:(a.end.x-a.start.x)/L},c=Core.wallLength(a)>0?{x:(a.start.x+a.end.x)/2,y:(a.start.y+a.end.y)/2}:null;
 const ctrl=a.curve.control,away=((ctrl.x-c.x)*n.x+(ctrl.y-c.y)*n.y)>0?-1:1,o=k=>({x:Math.round(k.x+away*n.x*100),y:Math.round(k.y+away*n.y*100)});
 const tri={...q.rooms[0],id:'rom_tri',polygon:[o(a.start),o(a.end),{x:Math.round(c.x+away*n.x*1500),y:Math.round(c.y+away*n.y*1500)}]};
 const ring=Core.roomRing({...q,rooms:[tri]},tri);assert.deepEqual(ring.faces.map(f=>f.wallId),['wal_mid']);
 // Dos muros curvos de distinto grueso no forman cadena: la cara de la cuerda original queda pendiente y nombrada.
 const t=split(box({control:{x:6150+2400,y:2100}}),'wal_mid',3000,'wal_mi2');t.walls.find(w=>w.id==='wal_mi2').thicknessMm=300;
 const f=Q.room(t,'rom_aaa').wallFaces;assert.equal(f.complete,false);assert.deepEqual([...f.pendingCurvedWalls].sort(),['wal_mi2','wal_mid']);
 // Sin muros curvos el anillo es el polígono (mismo objeto).
 const v1=Core.initial();for(const r of v1.rooms)assert.equal(Core.roomRing(v1,r).points,r.polygon);
});
