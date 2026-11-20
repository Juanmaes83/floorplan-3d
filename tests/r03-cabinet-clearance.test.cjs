// R03 · Holguras recuperadas del laboratorio (lab/sculpt-r03-cabinets@fc5a4224). Mismos escenarios sintéticos y mismos
// resultados esperados que el laboratorio, ahora sobre los módulos de PRODUCTO (r03-cabinet-core, FloorPlanPlacement,
// FloorPlanLayoutReview, contrato R03). Solo lectura: nada se aplica.
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const R=require('../js/r03-cabinet-clearance.js'),K=require('../js/r03-cabinet-core.js'),X=require('../js/r03-cabinet-contract.js');
const {SCENARIOS:S}=require('./fixtures/r03-cabinet-scenarios.js');
const obj=(s,id=s.objectId)=>s.project.objects.find(o=>o.id===id);
const block=s=>{const o=obj(s),outer={w:o.size.widthMm,d:o.size.depthMm};return R.clearanceBlock(s.project,o,outer,s.cabinet||K.defaultCabinet(o.type,outer));};

test('mesilla en el barrido de la puerta: la ven el cuadrado (autoridad RUBIK) y el sector exacto', () => {
  assert.deepEqual(block(S['nightstand-in-swing']).findings,{doorSquare:['furniture:obj_nightstand'],doorSector:['furniture:obj_nightstand'],drawers:[]});
  const a=R.analyze(S['nightstand-in-swing'].project,'obj_wardrobe');
  assert.equal(a.status,'evaluated');assert.equal(a.summary,'issues');assert.equal(a.applied,false);
  assert.deepEqual(a.issues.map(i=>i.kind),['door-swing-square','door-swing-sector']);
});
test('zapatero en un pasillo de 800 mm: la salida de la estancia solo la ve el cuadrado conservador; el muro, también el sector', () => {
  const f=block(S['narrow-corridor']).findings;
  assert.deepEqual(f.doorSquare,['room:rom_corridor','wall:wal_corridor-e']);
  assert.deepEqual(f.doorSector,['wall:wal_corridor-e']);
  assert.match(block(S['narrow-corridor']).interpretation,/conservador/);
});
test('armario por defecto bien colocado: sin hallazgos', () => {
  const a=R.analyze(S['bedroom-default'].project,'obj_wardrobe');
  assert.deepEqual(a.clearance.findings,{doorSquare:[],doorSector:[],drawers:[]});assert.equal(a.summary,'clear');
});
test('cajones en una partición atravesada por una bisagra: incidencia con la regla del donante como autoridad', () => {
  const s=S['drawers-across-hinge'],o=obj(s),outer={w:o.size.widthMm,d:o.size.depthMm};
  const conflicts=K.drawerDoorConflicts(outer,s.cabinet);assert.ok(conflicts.length>0);
  const issues=R.independentIssues([], {hingeDrawerConflicts:conflicts}, block(s));
  assert.deepEqual(issues.find(i=>i.kind==='hinge-drawer'),{kind:'hinge-drawer',authority:'regla del donante',items:conflicts.map(b=>'bay:'+b)});
});
test('cada incidencia conserva su autoridad; un hallazgo solo del sector es experimental y nunca decide', () => {
  const issues=R.independentIssues([], {hingeDrawerConflicts:[]}, {findings:{doorSquare:[],doorSector:['wall:w1'],drawers:[]}});
  assert.deepEqual(issues,[{kind:'door-swing-sector',authority:'experimental R03',items:['wall:w1']}]);
});
test('solo lectura: el proyecto no cambia y los objetos que no son armarios se declaran, no se evalúan', () => {
  for(const k of Object.keys(S)){const s=S[k],before=structuredClone(s.project);
    for(const o of s.project.objects){const a=R.analyze(s.project,o.id);assert.equal(a.applied,false);
      if(!K.isCabinetType(o.type))assert.equal(a.status,'not-cabinet');}
    assert.deepEqual(s.project,before,k);}
  assert.equal(R.analyze(S['bedroom-default'].project,'obj_inexistente').status,'unknown-object');
});
test('reutiliza los motores de producto: ningún núcleo duplicado y ningún archivo de producto lo carga todavía', () => {
  const src=fs.readFileSync(path.join(__dirname,'../js/r03-cabinet-clearance.js'),'utf8');
  for(const m of ['./r03-cabinet-core.js','./furniture-placement.js','./layout-review.js','./r03-cabinet-contract.js'])assert.ok(src.includes(`require('${m}')`),m);
  assert.doesNotMatch(src,/function (swing|drawerReach|toPlan|penetration|problems)\b/,'sin motores propios');
  assert.doesNotMatch(src,/\.(write|remove|prune)\(/,'no escribe');
  assert.ok(!fs.readFileSync(path.join(__dirname,'../index.html'),'utf8').includes('r03-cabinet-clearance'),'conexión pendiente de autorización');
});
