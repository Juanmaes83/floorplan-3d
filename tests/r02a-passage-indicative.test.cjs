// R02-A · paso libre ORIENTATIVO (prototipo autorizado el 20/11/2026): indica posibles interferencias con el criterio inicial
// de 2100 mm sobre los recorridos de FloorPlanPresentationRoute.plan. Nunca bloquea, nunca cambia un estado, no es normativo.
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const I=require('../js/r02a-passage-indicative.js'),E=require('../js/r02a-ceiling-core.js'),R=require('../js/presentation-route.js'),C=require('../js/project-core.js');
const REF=require('../js/reference-project.js');
const CEIL={clearHeightMm:2600,reference:'finished-floor',source:'prueba sintética'};
const setup=(project=REF)=>{const g=C.geometry(project);return {g,rooms:g.rooms.filter(r=>r.poly.length>=3).map(r=>({id:r.id,poly:r.poly})),routes:g.rooms.map(r=>({roomId:r.id,result:R.plan(project,g,r.id)}))};};
const S=setup();
const hall=S.routes.find(r=>r.roomId==='rom_hall').result,on=hall.points[2];
const propose=(reqs,project=REF)=>{const r=E.propose({project,ceiling:CEIL,requests:reqs});assert.ok(r.ok,JSON.stringify(r).slice(0,300));return r.evidence.proposals;};
const req=(id,type,pos,extra={})=>({id,type,position:{x:Math.round(pos.x),y:Math.round(pos.y)},...extra});
const run=(proposals,s=S)=>I.indicate({proposals,routes:s.routes,rooms:s.rooms});
const item=(res,id)=>res.items.find(x=>x.id===id);

test('banco: el ejemplo tiene recorridos interiores y estancias sin recorrido verificable (aerial)',()=>{
  const kinds=Object.fromEntries(S.routes.map(r=>[r.roomId,r.result.kind]));
  assert.equal(kinds.rom_hall,'interior');assert.equal(kinds.rom_kitchen,'aerial');assert.equal(hall.clearanceMm,220,'margen por defecto del planificador de presentación');
});
test('geometría: colgante sobre el recorrido del pasillo → posible interferencia, con la cota de lowestPointMm del núcleo (no recalculada)',()=>{
  const [p]=propose([req('l1','pendant',on,{dropMm:300})]);
  assert.equal(p.mount.lowestPointMm,1700,'cota del núcleo R02-A');
  const x=item(run([p]),'l1');
  assert.equal(x.status,'possible-interference');assert.equal(x.lowestPointMm,1700);assert.equal(x.shortfallMm,400);assert.ok(x.routes.includes('rom_hall'));
});
test('casos límite: 2100 exactos no interfiere; 2099 sí (1 mm); el estado nunca es «bloqueado»',()=>{
  const base=propose([req('l1','pendant',on,{dropMm:300})])[0];
  const at=v=>({...base,mount:{...base.mount,lowestPointMm:v}});
  assert.equal(item(run([at(2100)]),'l1').status,'no-interference-detected');
  const m=item(run([at(2099)]),'l1');assert.equal(m.status,'possible-interference');assert.equal(m.shortfallMm,1);
  for(const v of [0,1700,2099,2100,2600])assert.ok(I.STATUS.includes(item(run([at(v)]),'l1').status));
  assert.ok(!I.STATUS.some(s=>/block/.test(s)),'no existe un estado de bloqueo');
});
test('fuera del recorrido (zona libre de muebles que no es recorrido) → «outside-route», nunca interferencia',()=>{
  const room=S.rooms.find(r=>r.id==='rom_living'),xs=room.poly.map(p=>p[0]),ys=room.poly.map(p=>p[1]);
  const living=S.routes.find(r=>r.roomId==='rom_living').result;
  // Busca un punto libre de la estancia lejos de todos los recorridos (> 800 mm).
  let pick=null;for(let x=Math.min(...xs)+300;x<Math.max(...xs)-300&&!pick;x+=100)for(let y=Math.min(...ys)+300;y<Math.max(...ys)-300&&!pick;y+=100){
    const P=I.footprint({position:{x,y},size:{widthMm:500,depthMm:500}}),far=S.routes.filter(r=>r.result.kind==='interior').every(r=>I.distance(P,r.result.points)>800);
    if(far&&REF.objects.every(o=>Math.hypot(o.position.x-x,o.position.y-y)>Math.max(o.size.widthMm,o.size.depthMm)))pick={x,y};}
  assert.ok(pick&&living.kind==='interior','punto libre lejos del recorrido en el salón');
  const [p]=propose([req('l2','pendant',pick,{dropMm:300})]);
  const x=item(run([p]),'l2');assert.equal(x.status,'outside-route');assert.ok(x.distanceToRouteMm>800);
});
test('sin recorrido verificable en la estancia (aerial) → «no evaluado», aunque la cota sea baja',()=>{
  const k=S.rooms.find(r=>r.id==='rom_kitchen'),c={x:k.poly.reduce((a,p)=>a+p[0],0)/k.poly.length,y:k.poly.reduce((a,p)=>a+p[1],0)/k.poly.length};
  const [p]=propose([req('l3','pendant',c,{dropMm:900})]);
  const x=item(run([p]),'l3');assert.equal(x.status,'not-evaluated');assert.equal(x.reason,'no-verifiable-route');
});
test('sin referencia vertical → «no evaluado»; fuera de estancias → «no evaluado»',()=>{
  const [p]=propose([req('l4','pendant',on,{dropMm:300})]);
  assert.equal(item(run([{...p,mount:{...p.mount,status:'unknown',lowestPointMm:null}}]),'l4').reason,'no-vertical-reference');
  assert.equal(item(run([{...p,position:{x:-99999,y:-99999}}]),'l4').reason,'outside-rooms');
});
test('giro de objetos: una pieza larga junto al recorrido interfiere girada 90° y no paralela (huella girada real)',()=>{
  // Recorrido sintético aislado (sin otras rutas cerca), para medir solo el efecto del giro.
  const routes=[{roomId:'r',result:{kind:'interior',points:[{x:0,y:0},{x:4000,y:0}],clearanceMm:220,doorIds:[]}}],rooms=[{id:'r',poly:[[-1000,-2000],[5000,-2000],[5000,2000],[-1000,2000]]}];
  const long=rot=>({id:'t',position:{x:2000,y:600},rotationDeg:rot,size:{widthMm:1400,depthMm:100,heightMm:100},mount:{status:'computed',lowestPointMm:1900}});
  const at=rot=>I.indicate({proposals:[long(rot)],routes,rooms}).items[0];
  assert.equal(at(0).status,'outside-route');assert.equal(at(0).distanceToRouteMm,550,'paralela: 600 − 50 mm de medio fondo');
  assert.equal(at(90).status,'possible-interference','girada 90°: cruza el recorrido');assert.equal(at(180).status,'outside-route');
  assert.equal(at(45).status,'possible-interference','45°: su esquina entra en la banda');
});
test('puertas: el hueco de la puerta no es una estancia («no evaluado»); justo dentro, sobre el tramo que cruza la puerta, sí se indica',()=>{
  assert.ok(hall.doorIds.length>=1,'el recorrido declara las puertas que cruza');
  const atDoor=item(run([{id:'d0',position:hall.points[0],rotationDeg:0,size:{widthMm:300,depthMm:300,heightMm:100},mount:{status:'computed',lowestPointMm:2000}}]),'d0');
  assert.equal(atDoor.status,'not-evaluated');assert.equal(atDoor.reason,'outside-rooms');
  const a=hall.points[0],b=hall.points[1];let inRoom=null;
  const isIn=(P,q)=>{let h=false;for(let i=0,j=P.length-1;i<P.length;j=i++)if((P[i][1]>q.y)!==(P[j][1]>q.y)&&q.x<(P[j][0]-P[i][0])*(q.y-P[i][1])/(P[j][1]-P[i][1])+P[i][0])h=!h;return h;};
  for(let t=0.05;t<=1&&!inRoom;t+=0.05){const q={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};if(S.rooms.some(r=>isIn(r.poly,q)))inRoom=q;}
  assert.ok(inRoom,'hay un punto del primer tramo dentro de una estancia');
  const x=item(run([{id:'d1',position:inRoom,rotationDeg:0,size:{widthMm:300,depthMm:300,heightMm:100},mount:{status:'computed',lowestPointMm:2000}}]),'d1');
  assert.equal(x.status,'possible-interference',JSON.stringify(x));assert.equal(x.shortfallMm,100);
});
test('rutas alternativas: los recorridos de varias estancias se solapan; el elemento lista todas las que lo atraviesan',()=>{
  const [p]=propose([req('l6','pendant',on,{dropMm:300})]),x=item(run([p]),'l6');
  const throughHall=S.routes.filter(r=>r.result.kind==='interior'&&I.distance(I.footprint(p),r.result.points)<=r.result.clearanceMm).map(r=>r.roomId).sort();
  assert.deepEqual(x.routes,throughHall);assert.ok(x.routes.length>=2,'el pasillo es tramo común de varios recorridos: '+x.routes.join(','));
});
test('determinismo y solo lectura: mismo resultado con el orden de muebles invertido; entradas intactas; nada aplicado ni bloqueante',()=>{
  const ps=propose([req('l1','pendant',on,{dropMm:300}),req('l2','ceilinglight',hall.points[3],{dropMm:0})]),before=structuredClone(ps);
  const reordered={...REF,objects:[...REF.objects].reverse()},S2=setup(reordered);
  const a=run(ps),b=run(ps,S2);
  assert.deepEqual(a.items,b.items,'el orden de los muebles no cambia la indicación');
  assert.deepEqual(ps,before,'las propuestas no se modifican');
  assert.equal(a.applied,false);assert.equal(a.blocking,false);assert.equal(a.normative,false);assert.equal(a.criterion.normative,false);
  assert.match(a.criterion.note,/no es una comprobación normativa/i);assert.equal(JSON.stringify(a).includes('blocked'),false);
});
test('costes de cálculo: planificar todas las estancias del ejemplo y evaluar 50 elementos cabe en presupuesto',()=>{
  const g=C.geometry(REF),t0=Date.now(),routes=g.rooms.map(r=>({roomId:r.id,result:R.plan(REF,g,r.id)})),tPlan=Date.now()-t0;
  const many=Array.from({length:50},(_,i)=>({id:'m'+i,position:{x:on.x+(i%10)*40-200,y:on.y+Math.floor(i/10)*40-100},rotationDeg:i*7,size:{widthMm:400,depthMm:400,heightMm:300},mount:{status:'computed',lowestPointMm:1800+i*10}}));
  const res=I.indicate({proposals:many,routes,rooms:S.rooms});
  console.log(`# coste · planificar ${g.rooms.length} estancias: ${tPlan} ms · indicar 50 elementos: ${res.costMs} ms`);
  assert.ok(tPlan<2000,`planificación ${tPlan} ms`);assert.ok(res.costMs<200,`indicación ${res.costMs} ms`);assert.equal(res.items.length,50);
});

// ---- conexión visual: caché invalidable y textos ----
test('caché de rutas: bajo demanda, reutilizada mientras no cambie la firma; se invalida por proyecto, planta y geometría, no por los techos',()=>{
  I.resetCache();let calls=0;const plan=(p,g,id)=>{calls++;return R.plan(p,g,id);};
  const g=C.geometry(REF),n=g.rooms.filter(r=>r.poly.length>=3).length;
  assert.equal(I.routesFor(REF,g,plan,null).cached,false);assert.equal(calls,n,'primera consulta: una ruta por estancia');
  for(let i=0;i<5;i++)assert.equal(I.routesFor(REF,g,plan,null).cached,true);assert.equal(calls,n,'renders sucesivos: ningún recálculo');
  const withCeiling={...REF,extensions:{...REF.extensions,'x-r02a-ceiling':{version:1,items:[{id:'z'}]}}};
  assert.equal(I.routesFor(withCeiling,C.geometry(withCeiling),plan,null).cached,true,'los elementos de techo no cambian las rutas');
  const moved=structuredClone(REF);moved.objects[0].position.x+=300;
  assert.equal(I.routesFor(moved,C.geometry(moved),plan,null).cached,false,'mover un mueble invalida');
  assert.equal(I.routesFor(REF,g,plan,'bld|lvl_2').cached,false,'otra planta invalida');
  const other={...structuredClone(REF),id:'prj_otro'};assert.equal(I.routesFor(other,C.geometry(other),plan,null).cached,false,'otro proyecto invalida');
  assert.equal(I.stats.plans,calls);
});
test('textos: nunca «ruta libre» ni seguridad; los tres estados pedidos y el criterio declarado en ES/EN/ZH',()=>{
  const x={lowestPointMm:1700,shortfallMm:400};
  assert.equal(I.describe({...x,status:'possible-interference'},'es'),'Posible interferencia: el punto más bajo queda a 1700 mm, 400 mm por debajo del criterio inicial.');
  assert.equal(I.describe({status:'no-interference-detected'},'es'),'Sin interferencia detectada en el recorrido orientativo.');
  assert.equal(I.describe({status:'outside-route'},'es'),'Fuera del recorrido orientativo.');
  assert.match(I.describe({status:'not-evaluated',reason:'no-verifiable-route'},'es'),/^No evaluado: no hay un recorrido orientativo verificable/);
  for(const l of ['es','en','zh']){const t=I.text(l);assert.match(t.note,/2100/);assert.ok(Object.values(t).every(v=>typeof v!=='string'||!/ruta libre|segur|safe|guarantee|cumple|complies/i.test(v)),l);}
  assert.match(I.text('es').note,/pendiente de validación profesional\. No es normativo/);assert.match(I.text('en').note,/pending professional validation\. Not regulatory/);
});
