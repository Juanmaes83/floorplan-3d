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
test('reutiliza los motores de producto: ningún núcleo duplicado y solo la activación R03 lo carga', () => {
  const src=fs.readFileSync(path.join(__dirname,'../js/r03-cabinet-clearance.js'),'utf8');
  for(const m of ['./r03-cabinet-core.js','./furniture-placement.js','./layout-review.js','./r03-cabinet-contract.js'])assert.ok(src.includes(`require('${m}')`),m);
  assert.doesNotMatch(src,/function (swing|drawerReach|toPlan|penetration|problems)\b/,'sin motores propios');
  assert.doesNotMatch(src,/\.(write|remove|prune)\(/,'no escribe');
  // Conexión autorizada (20/11/2026): solo la activación R03 lo carga, justo antes del diálogo que lo usa, y no hay
  // ninguna referencia nueva en index.html (la sección vive dentro de RubikCabinetRubikUI).
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  assert.equal(html.split('r03-cabinet-clearance').length-1,1,'una sola carga');
  assert.ok(html.indexOf('js/r03-cabinet-clearance.js')<html.indexOf('js/r03-cabinet-rubik-ui.js'));
  assert.ok(!/RubikCabinetClearance/.test(html),'ningún punto de conexión nuevo en index.html');
});

// ---- conexión de solo lectura: analyzeDraft y describe ----
test('el borrador se analiza sin guardarlo: una distribución con cajones bajo la bisagra avisa antes de guardar', () => {
  const s=S['drawers-across-hinge'],base=S['bedroom-default'],o=obj(base),outer={w:o.size.widthMm,d:o.size.depthMm};
  const before=structuredClone(base.project),draft=structuredClone(s.cabinet);
  assert.equal(R.analyze(base.project,'obj_wardrobe').summary,'clear','lo guardado (por defecto) no tiene conflictos');
  const d=R.analyzeDraft(base.project,'obj_wardrobe',outer,draft);
  assert.ok(d.issues.some(i=>i.kind==='hinge-drawer'));assert.equal(d.applied,false);
  assert.deepEqual(base.project,before,'el proyecto no cambia');assert.deepEqual(draft,s.cabinet,'el borrador no cambia');
});
test('describe agrupa por autoridad, con textos legibles y sin mezclar lo experimental con lo de RUBIK', () => {
  const s=S['nightstand-in-swing'],d=R.describe(s.project,R.analyze(s.project,'obj_wardrobe'));
  assert.deepEqual(d.groups.map(g=>[g.kind,g.level]),[['door-swing-square','rubik'],['door-swing-sector','experimental']]);
  assert.deepEqual(d.groups[0].items,['choca con el mueble «Mesilla»']);
  assert.match(d.groups[1].authority,/Experimental/);assert.match(d.text,/no impiden guardar/);assert.match(d.limits,/90°/);
  const c=R.describe(S['narrow-corridor'].project,R.analyze(S['narrow-corridor'].project,'obj_shoecab'));
  assert.deepEqual(c.groups[0].items,['sale de la estancia','choca con un muro']);
  assert.equal(R.describe(S['bedroom-default'].project,R.analyze(S['bedroom-default'].project,'obj_wardrobe')).text,'Puertas y cajones se abren sin chocar con nada.');
});
test('negativos: no armario, armario inválido u objeto inexistente → sin grupos y sin inventar holguras', () => {
  const b=S['not-a-cabinet'],inv=S['invalid-shelves'],o=obj(inv),outer={w:o.size.widthMm,d:o.size.depthMm};
  assert.equal(R.analyzeDraft(b.project,'obj_bed',{w:2000,d:1600},K.defaultCabinet('wardrobe',{w:2000,d:600})).status,'not-cabinet');
  assert.equal(R.analyzeDraft(inv.project,o.id,outer,inv.cabinet).status,'invalid-cabinet');
  for(const r of [R.analyze(b.project,'obj_bed'),R.analyzeDraft(inv.project,o.id,outer,inv.cabinet),R.analyze(b.project,'nada')]){
    const d=R.describe(b.project,r);assert.deepEqual(d.groups,[]);assert.match(d.text,/Sin comprobación/);}
});
test('las autoridades declaradas son exactamente las del análisis recuperado (ningún grupo nuevo ni silencioso)', () => {
  assert.deepEqual(Object.keys(R.GROUPS).sort(),['box-placement','door-swing-sector','door-swing-square','drawer-reach','hinge-drawer']);
  assert.deepEqual(Object.values(R.GROUPS).map(g=>g.level).sort(),['donor','experimental','rubik','rubik','rubik']);
});
