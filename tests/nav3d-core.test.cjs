'use strict';
/* NAV3D V1 · núcleo puro del panel de navegación 3D (js/nav3d-core.js): estancias por planta sin mezclar ids, marcador
   del minimapa con estado seguro, resumen y acción global de puertas y controles derivados del estado real. */
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../js/nav3d-core.js');
const sq=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];

test('estancias: nombres del proyecto, orden por uso (salón, cocina, dormitorios, baños, otras), polígonos inválidos fuera', () => {
  const g=C.roomGroups({levels:[{levelId:null,name:'',order:0,rooms:[
    {id:'r1',name:'Baño',family:'bathroom',poly:sq(0,0,2000,2000)},{id:'r2',name:'Dormitorio 2',family:'bedroom',poly:sq(0,0,3000,3000)},
    {id:'r3',name:'Salón',family:'living',poly:sq(0,0,5000,4000)},{id:'r4',name:'Cocina',family:'kitchen',poly:sq(0,0,3000,2000)},
    {id:'r5',name:'Dormitorio 10',family:'bedroom',poly:sq(0,0,3000,3000)},{id:'r6',name:'Roto',family:'other',poly:[[0,0],[1,1]]},
    {id:'r7',name:'Plano',family:'other',poly:[[0,0],[1000,0],[2000,0]]},{id:'r8',name:'Trastero',family:'storage',poly:sq(0,0,1000,1000)}]}]});
  assert.equal(g.length,1);
  assert.deepEqual(g[0].rooms.map(r=>r.label),['Salón','Cocina','Dormitorio 2','Dormitorio 10','Baño','Trastero']);
  assert.ok(g[0].rooms.every(r=>C.parseKey(r.key).roomId===r.roomId));
});

test('estancias sin uso declarado (proyectos antiguos): el uso se deduce del nombre SOLO para ordenar', () => {
  const g=C.roomGroups({levels:[{levelId:null,order:0,rooms:[['a','Pasillo'],['b','Baño en suite'],['c','Dormitorio principal'],['d','Cocina'],['e','Salón'],['f','Mirador']].map(([id,name])=>({id,name,poly:sq(0,0,2000,2000)}))}]});
  assert.deepEqual(g[0].rooms.map(r=>r.label),['Salón','Cocina','Dormitorio principal','Baño en suite','Pasillo','Mirador']);
  assert.ok(g[0].rooms.every(r=>r.family==='unspecified'),'el uso deducido no se escribe en la estancia');
  assert.equal(C.familyHint('bedroom','Cocina'),'bedroom','un uso declarado manda sobre el nombre');
});

test('multiplanta: grupos por orden de planta y claves planta+estancia; el mismo id en dos plantas no se mezcla', () => {
  const g=C.roomGroups({activeLevelId:'lvl_up',levels:[
    {levelId:'lvl_up',name:'Planta primera',order:1,rooms:[{id:'rom_1',name:'Dormitorio',family:'bedroom',poly:sq(0,0,3000,3000)}]},
    {levelId:'lvl_0',name:'Planta baja',order:0,rooms:[{id:'rom_1',name:'Cocina',family:'kitchen',poly:sq(0,0,3000,3000)}]}]});
  assert.deepEqual(g.map(x=>[x.name,x.active]),[['Planta baja',false],['Planta primera',true]]);
  const keys=g.flatMap(x=>x.rooms.map(r=>r.key));assert.equal(new Set(keys).size,2,'claves distintas');
  assert.deepEqual(C.parseKey(keys[0]),{levelId:'lvl_0',roomId:'rom_1'});assert.deepEqual(C.parseKey(keys[1]),{levelId:'lvl_up',roomId:'rom_1'});
  assert.deepEqual(C.parseKey(C.key(null,'rom_9')),{levelId:null,roomId:'rom_9'});
  for(const bad of [undefined,'',42,'sin-separador','lvl::'])assert.equal(C.parseKey(bad),null);
});

test('nombres repetidos en una planta se distinguen; los de plantas distintas no', () => {
  const g=C.roomGroups({levels:[{levelId:'a',order:0,rooms:[{id:'x',name:'Baño',poly:sq(0,0,2000,2000)},{id:'y',name:'Baño',poly:sq(0,0,1000,2000)}]},
    {levelId:'b',order:1,rooms:[{id:'z',name:'Baño',poly:sq(0,0,2000,2000)}]}]});
  assert.deepEqual(g.map(x=>x.rooms.map(r=>r.label)),[['Baño','Baño (2)'],['Baño']]);
});

test('minimapa: posición y orientación dentro de una estancia, entre estancias, fuera del plano y sin datos fiables', () => {
  const rooms=[{id:'sal',poly:sq(0,0,4000,3000)},{id:'coc',poly:sq(5000,0,3000,3000)}],vb=[-500,-500,9000,4000];
  const m=C.marker({x:1000,y:1000,dx:0,dy:1},vb,rooms);assert.equal(m.state,'ok');assert.equal(m.roomId,'sal');assert.equal(m.angleDeg,90);
  assert.equal(C.marker({x:6000,y:1000,dx:-1,dy:0},vb,rooms).angleDeg,180);
  assert.equal(C.marker({x:4500,y:1000,dx:1,dy:0},vb,rooms).state,'between');
  assert.equal(C.marker({x:20000,y:1000,dx:1,dy:0},vb,rooms).state,'outside');
  for(const bad of [null,undefined,{x:NaN,y:0,dx:1,dy:0},{x:0,y:0,dx:0,dy:0},{x:0,y:0,dx:3,dy:0},{x:'1',y:0,dx:1,dy:0}])
    assert.deepEqual(C.marker(bad,vb,rooms),{state:'unknown'},'sin posición inventada: '+JSON.stringify(bad));
  assert.deepEqual(C.marker({x:0,y:0,dx:1,dy:0},null,rooms),{state:'unknown'});
  assert.equal(C.roomAt(rooms,7000,500),'coc');assert.equal(C.roomAt(rooms,NaN,0),null);
});

test('puertas: resumen y acción global coherentes con el estado real de cada hoja', () => {
  assert.deepEqual(C.doors({total:0,open:0}),{total:0,open:0,state:'none',action:null});
  assert.deepEqual(C.doors({total:4,open:4}),{total:4,open:4,state:'open',action:'close'});
  assert.deepEqual(C.doors({total:4,open:0}),{total:4,open:0,state:'closed',action:'open'});
  assert.deepEqual(C.doors({total:4,open:1}),{total:4,open:1,state:'mixed',action:'open'},'mixtas tras tocar una puerta: la acción es abrir todas');
  assert.deepEqual(C.doors({total:2,open:7}),{total:2,open:2,state:'open',action:'close'});
  assert.equal(C.doors(null).state,'none');
});

const S=(over={})=>({active:true,available:true,mode:'orbit',roof:false,roofStatus:'available',roofReason:null,furniture:true,white:false,cut:2.8,levelView:'active',doors:{total:3,open:3},busy:false,presentation:false,...over});
const groups=[{rooms:[{key:'::a'}]}];
test('controles: modo activo único, exterior solo con cubierta, explicaciones de lo no disponible', () => {
  let vm=C.viewModel(S(),{groups});
  assert.equal(vm.mode,'interior');assert.deepEqual(['exterior','interior','walk'].filter(m=>vm.controls['mode-'+m].pressed),['interior']);
  assert.equal(C.viewModel(S({roof:true}),{groups}).mode,'exterior');assert.equal(C.viewModel(S({mode:'walk',roof:true}),{groups}).mode,'walk');
  vm=C.viewModel(S({roofStatus:'unavailable',roofReason:'muros abiertos'}),{groups});
  assert.equal(vm.controls['mode-exterior'].disabled,true);assert.match(vm.controls['mode-exterior'].reason,/muros abiertos/);
  vm=C.viewModel(S({doors:{total:0,open:0}}),{groups:[]});
  assert.equal(vm.controls.doors.disabled,true);assert.match(vm.controls.doors.reason,/no tiene puertas/);assert.equal(vm.controls.rooms.disabled,true);
  assert.equal(C.viewModel(S(),{groups,levels:[{},{}]}).controls.levels.hidden,undefined);assert.equal(C.viewModel(S(),{groups,levels:[{}]}).controls.levels.hidden,true);
  vm=C.viewModel(S({white:true,furniture:false}),{groups});assert.equal(vm.controls.white.pressed,true);assert.equal(vm.controls.finishes.pressed,false);assert.equal(vm.controls.furniture.pressed,false);
  assert.match(vm.collisions,/muebles no bloquean/);
});

test('controles: cámara en movimiento, presentación y 3D no disponible bloquean con motivo', () => {
  const vm=C.viewModel(S({busy:true}),{groups});
  assert.ok(Object.values(vm.controls).filter(c=>!c.hidden).every(c=>c.disabled&&c.reason),'nada se pulsa a mitad de un vuelo');
  assert.equal(C.viewModel(S({presentation:true}),{groups}).available,false);
  assert.match(C.viewModel(S({available:false}),{groups}).reason,/no está disponible/);
  assert.match(C.viewModel(null).reason,/Abre la vista 3D/);
  assert.match(C.viewModel(S({available:false}),{groups,lang:'en'}).reason,/not available/);
});
