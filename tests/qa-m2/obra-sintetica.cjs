'use strict';
/* FT3D-8 · Examen final M2/S4 — obra sintética. SOLO DATOS INVENTADOS: ningún proyecto ni precio real de cliente.
   Construida con los formatos y APIs reales de RUBIK (FloorPlanCore, FloorPlanBuilding, FloorPlanProjectLibrary).
   No modifica código de producto. */
const path=require('node:path');
const J=p=>require(path.join(__dirname,'..','..','js',p));
for(const m of ['project-schema','guide-core','project-core','exterior-core','roof-core','building-core'])J(m+'.js');
const Core=J('project-core.js'),Bld=J('building-core.js');
const clone=x=>JSON.parse(JSON.stringify(x));

// Vivienda principal: la vivienda de ejemplo de RUBIK convertida en OBRA NUEVA (todos los muros «new»).
function viviendaPrincipal(){let p=clone(J('reference-project.js'));p.id='prj_qa-vivienda-obra';p.name='Vivienda QA obra nueva';
 for(const w of p.walls)w.status='new';p=Core.setSite(p,{northOffsetDeg:12});Core.validate(p);return p;}
// Gemela: MISMO nombre visible, otra identidad y un muro distinto (aislamiento).
function viviendaGemela(){const p=viviendaPrincipal();p.id='prj_qa-vivienda-obra-2';p.walls[0].end={...p.walls[0].end,x:p.walls[0].end.x+300};Core.validate(p);return p;}
// Vivienda con huella demostrable (emplazamiento) y edificio de dos plantas (DEC-06).
function edificio(){return require(path.join(__dirname,'..','fixtures','building-fixture.cjs')).build().building;}
function viviendaEmplazable(){let p=clone(Bld.exportLevel(edificio(),edificio().levels[0].id).project);p.id='prj_qa-emplazable';p.name='Vivienda QA emplazable';p=Core.setSite(p,{northOffsetDeg:20});Core.validate(p);return p;}
function biblioteca(){const b=edificio();return {version:1,activeId:'ent_qa-a',entries:[
 {id:'ent_qa-a',name:'Vivienda QA obra nueva',project:viviendaPrincipal()},
 {id:'ent_qa-b',name:'Vivienda QA obra nueva',project:viviendaGemela()},
 {id:'ent_qa-p',name:'Vivienda QA emplazable',project:viviendaEmplazable()},
 {id:'ent_qa-c',name:'Edificio QA dos plantas',kind:'building',building:b,activeLevelId:b.levels[0].id}]};}

// Generador sintético de carga (QA-22): repite la planta N veces desplazada en X, con identificadores nuevos.
function viviendaGrande(copias){const base=viviendaPrincipal(),p=clone(base);p.id='prj_qa-grande-'+copias;p.name='Vivienda QA carga x'+copias;
 const dx=(()=>{const xs=base.walls.flatMap(w=>[w.start.x,w.end.x]);return Math.max(...xs)-Math.min(...xs)+3000;})();
 for(let k=1;k<copias;k++){const map=new Map(),sfx='-c'+k,mv=pt=>({...pt,x:pt.x+dx*k});
  for(const w of base.walls){const n={...clone(w),id:w.id+sfx,start:mv(w.start),end:mv(w.end)};map.set(w.id,n.id);p.walls.push(n);}
  for(const o of base.openings)p.openings.push({...clone(o),id:o.id+sfx,wallId:map.get(o.wallId)});
  for(const r of base.rooms)p.rooms.push({...clone(r),id:r.id+sfx,polygon:r.polygon.map(mv)});}
 p.objects=[];p.measurements=[];Core.validate(p);return p;}

/* Diez tareas + hito. Fechas elegidas por el auditor; las dependencias se cumplen exactamente (el motor no mueve fechas).
   elementos: selector sobre el inventario real ({structure, tipo, n}); partidas: id de partida C1–C4 y %. */
const TAREAS=[
 {id:'T01',wbs:'01',titulo:'Cimentación',material:'Hormigón estructural',inicio:'2027-03-01',fin:'2027-03-10',deps:[],elementos:null,partidas:[],nota:'RUBIK no modela cimentación (NOT_IN_AUTHORITY): tarea sin geometría ni partida C1–C4'},
 {id:'T02',wbs:'02',titulo:'Estructura',material:'Acero estructural',inicio:'2027-03-11',fin:'2027-03-24',deps:[['T01','FS',0]],elementos:{structure:'load-bearing',rol:'structure',n:3},partidas:[],nota:'Muros de carga con papel «estructura»; el acero no es un material del modelo; C1–C4 no genera partida de estructura'},
 {id:'T03',wbs:'03',titulo:'Cerramientos exteriores',material:'Fábrica cerámica',inicio:'2027-03-25',fin:'2027-04-14',deps:[['T02','FS',0]],elementos:{structure:'exterior',rol:'build',n:3},partidas:[['partition-new',50]]},
 {id:'T04',wbs:'04',titulo:'Tabiquería interior',material:'Placas de yeso laminado',inicio:'2027-03-28',fin:'2027-04-20',deps:[['T03','SS',3]],elementos:{structure:'partition',rol:'build',n:3},partidas:[['partition-new',50]]},
 {id:'T05',wbs:'05',titulo:'Impermeabilización',material:'Lámina impermeabilizante',inicio:'2027-04-15',fin:'2027-04-21',deps:[['T03','FS',0]],elementos:{tipo:'roof',rol:'envelope',n:1},partidas:[],nota:'Cubierta derivada; sin partida C1–C4 de impermeabilización'},
 {id:'T06',wbs:'06',titulo:'Aislamiento',material:'Lana mineral',inicio:'2027-04-17',fin:'2027-04-28',deps:[['T05','SS',2]],elementos:{structure:'exterior',rol:'cladding',n:3},partidas:[],nota:'Mismos muros exteriores que T03 con papel distinto (revestimiento); sin partida de aislamiento'},
 {id:'T07',wbs:'07',titulo:'Carpintería exterior',material:'Aluminio',inicio:'2027-04-15',fin:'2027-04-30',deps:[['T06','FF',2]],elementos:{tipo:'window',rol:'build',n:3},partidas:[['opening:window',100],['opening:sliding-door',100]]},
 {id:'T08',wbs:'08',titulo:'Fontanería',material:'Tubería multicapa PEX',inicio:'2027-03-31',fin:'2027-04-23',deps:[['T04','SS',3]],elementos:null,partidas:[],nota:'RUBIK no modela instalaciones: tarea sin geometría ni partida'},
 {id:'T09',wbs:'09',titulo:'Pavimentos',material:'Parqué de roble',inicio:'2027-04-22',fin:'2027-05-07',deps:[['T08','FS',-2]],elementos:{tipo:'floor',rol:'finish',n:3},partidas:[['floor:mat_wood',100],['floor:mat_tile800',100],['floor:mat_tile600',100],['floor:mat_antislip',100],['floor:mat_walnut',100],['floor:mat_marble',100],['skirting',100]]},
 {id:'T10',wbs:'10',titulo:'Pintura y acabados',material:'Pintura plástica interior',inicio:'2027-04-26',fin:'2027-05-12',deps:[['T09','FF',5],['T07','SF',0]],elementos:{structure:'partition',rol:'finish',n:3},partidas:[['paint',100]]}];
const HITO={id:'H01',wbs:'11',titulo:'Fin de obra',inicio:'2027-05-13',fin:'2027-05-13',deps:[['T10','FS',0]],elementos:null,partidas:[]};
// «opening:door» se deja sin tarea a propósito (partida sin tarea).

/* Economía. Revisión A (precios propios), B (3 cambios + referencia BC3 + una sin valorar), C (reparto 60/40 y fechas). */
const PRECIOS_A={'floor:mat_wood':38,'floor:mat_tile800':29.5,'floor:mat_tile600':27,'floor:mat_antislip':31,'floor:mat_walnut':44,'skirting':9.2,'paint':7.4,'partition-new':41.75,'opening:window':420,'opening:sliding-door':690};
// Sin precio en A: floor:mat_marble, opening:door.
const CAMBIOS_B={'floor:mat_tile800':31.25,'partition-new':43.1,'opening:window':455};   // 3 precios cambiados a mano
const B_REFERENCIA={itemId:'paint',codigo:'PINT-LISA',columna:0,precio:7.9};            // tarifa BC3 aportada, confirmada
const B_SIN_VALORAR='floor:mat_walnut';                                                    // se le quita el precio en B
const IVA=10;

// Referencia independiente en céntimos enteros (regla: redondeo por línea; IVA por línea). También IVA sobre total.
function referencia(items){let net=0,tax=0,known=0;const lineas=[];
 for(const it of items){if(it.unitPrice===null||it.quantity.value===null){lineas.push({id:it.id,neto:null});continue;}
  const c=Math.round(it.quantity.value*(1+it.wastePercent/100)*it.unitPrice*100+1e-9),t=Math.round(c*IVA/100+1e-9);net+=c;tax+=t;known++;lineas.push({id:it.id,neto:c/100,iva:t/100});}
 return {lineas,netoConocido:net/100,ivaPorLinea:tax/100,ivaSobreTotal:Math.round(net*IVA/100)/100,conocidas:known,sinPrecio:items.length-known,completo:known===items.length};}
// Reparto de una partida entre tareas (restos mayores en céntimos, como contrato FT3D-8 0.2.0).
function reparto(netoCentimos,porcentajes){const exact=porcentajes.map(p=>netoCentimos*p/100),f=exact.map(Math.floor);let rest=Math.round(netoCentimos*porcentajes.reduce((a,b)=>a+b,0)/100)-f.reduce((a,b)=>a+b,0);
 exact.map((v,i)=>({i,r:v-f[i]})).sort((a,b)=>b.r-a.r||a.i-b.i).forEach(o=>{if(rest>0){f[o.i]++;rest--;}});return f;}

module.exports={biblioteca,viviendaPrincipal,viviendaGemela,viviendaEmplazable,edificio,viviendaGrande,TAREAS,HITO,PRECIOS_A,CAMBIOS_B,B_REFERENCIA,B_SIN_VALORAR,IVA,referencia,reparto};
