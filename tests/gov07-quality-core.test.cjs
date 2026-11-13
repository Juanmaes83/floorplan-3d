'use strict';
/* GOV-07 · núcleo puro de calidad y continuidad 3D, con tiempos sintéticos. */
const test=require('node:test'),assert=require('node:assert/strict');
const Q=require('../js/gl-quality-core.js');
const feed=(g,ms,n)=>{const ev=[];for(let i=0;i<n;i++){const e=g.sample(typeof ms==='function'?ms(i):ms);if(e)ev.push(e);}return ev;};
const fast={warmupFrames:0,cooldownFrames:0,windowFrames:10};

test('niveles: tope 2, escalones de 0,5, mínimo 1; con DPR 1 no hay nada que adaptar',()=>{
  assert.deepEqual(Q.levelsFor(3),[2,1.5,1]);assert.deepEqual(Q.levelsFor(2),[2,1.5,1]);
  assert.deepEqual(Q.levelsFor(1.25),[1.25,1]);assert.deepEqual(Q.levelsFor(1),[1]);assert.deepEqual(Q.levelsFor(0.75),[1]);
  assert.deepEqual(Q.levelsFor(undefined),[1]);assert.deepEqual(Q.levelsFor(NaN),[1]);
  const g=Q.createGovernor({deviceRatio:1,...fast});assert.equal(g.adaptive,false);assert.deepEqual(feed(g,500,100),[]);assert.equal(g.ratio,1);
});
test('baja por escalones si no llega al presupuesto y nunca baja de 1',()=>{
  const g=Q.createGovernor({deviceRatio:3,...fast});assert.equal(g.ratio,2);
  const ev=feed(g,80,100);assert.deepEqual(ev.map(e=>[e.from,e.to,e.reason]),[[2,1.5,'slow'],[1.5,1,'slow']]);assert.equal(g.ratio,1);
});
test('sube solo si el escalón superior cabe con margen (coste ∝ ratio²) y tras ventanas buenas seguidas',()=>{
  const g=Q.createGovernor({deviceRatio:2,...fast});feed(g,80,20);assert.equal(g.ratio,1);
  // 18 ms a 1 → 1,5 costaría ~40 ms: no cabe en 34×0,75. No sube.
  assert.deepEqual(feed(g,18,100),[]);assert.equal(g.ratio,1);
  // 10 ms a 1 → ~22,5 ms a 1,5: cabe. Sube tras 2 ventanas buenas; de 1,5 a 2 costaría ~17,8×… según lo medido.
  const up=feed(g,10,20);assert.deepEqual(up.map(e=>[e.from,e.to,e.reason]),[[1,1.5,'fast']]);
});
test('sin oscilación: una ventana mala entre buenas reinicia la cuenta para subir',()=>{
  const g=Q.createGovernor({deviceRatio:2,...fast});feed(g,80,10);assert.equal(g.ratio,1.5);
  const ev=feed(g,i=>(i>=10&&i<20?30:8),40);// buena, normal (30 ms a 1,5 cabe en 34 pero no permite subir), buena, buena
  assert.deepEqual(ev.map(e=>e.to),[2]);assert.equal(g.ratio,2);
});
test('ignora cuadros fuera de rango (pestaña oculta, depurador) y respeta calentamiento y enfriamiento',()=>{
  const g=Q.createGovernor({deviceRatio:2,windowFrames:10,warmupFrames:5,cooldownFrames:20});
  assert.deepEqual(feed(g,2000,100),[]);assert.deepEqual(feed(g,0,10),[]);assert.deepEqual(feed(g,-3,10),[]);
  assert.deepEqual(feed(g,80,14),[]);const e1=feed(g,80,1);assert.equal(e1[0].to,1.5);
  assert.deepEqual(feed(g,80,29),[]);assert.equal(feed(g,80,1)[0].to,1);
});
test('forceMin: degradación controlada y fija (no vuelve a subir)',()=>{
  const g=Q.createGovernor({deviceRatio:2,...fast});const ev=g.forceMin('repeated-context-loss');
  assert.deepEqual([ev.from,ev.to,ev.reason],[2,1,'repeated-context-loss']);assert.equal(g.adaptive,false);
  assert.deepEqual(feed(g,5,200),[]);assert.equal(g.ratio,1);assert.equal(g.forceMin(),null);
  assert.equal(g.state().history.length,1);
});
test('opciones inválidas se rechazan',()=>{
  for(const o of [{minRatio:0},{cap:.5},{step:0},{budgetMs:0}])assert.throws(()=>Q.createGovernor({deviceRatio:2,...o}),TypeError);
});
test('monitor: ok → lost → restored; pérdidas duplicadas no cuentan dos veces',()=>{
  const m=Q.createContextMonitor();assert.equal(m.state,'ok');
  assert.equal(m.restored(5).changed,false);
  assert.equal(m.lost(10).changed,true);assert.equal(m.lost(11).changed,false);assert.equal(m.snapshot().losses,1);
  assert.equal(m.tick(5000).changed,false);const r=m.restored(2000);assert.equal(r.changed,true);assert.equal(r.degrade,false);assert.equal(m.state,'ok');
});
test('monitor: sin respuesta del navegador a tiempo → failed; si vuelve después, se recupera',()=>{
  const m=Q.createContextMonitor({restoreTimeoutMs:6000});m.lost(0);assert.equal(m.tick(5999).changed,false);
  const f=m.tick(6000);assert.equal(f.changed,true);assert.equal(f.state,'failed');assert.equal(m.tick(9000).changed,false);
  const r=m.restored(20000);assert.equal(r.changed,true);assert.equal(m.state,'ok');assert.deepEqual(m.snapshot().log.map(e=>e.event),['lost','failed','restored']);
});
test('monitor: pérdidas repetidas en la ventana piden degradar una sola vez; separadas no',()=>{
  const m=Q.createContextMonitor({repeatWindowMs:120000,repeatLimit:2});
  m.lost(0);assert.equal(m.restored(1000).degrade,false);
  m.lost(200000);assert.equal(m.restored(201000).degrade,false,'la primera pérdida ya está fuera de la ventana');
  m.lost(250000);const r=m.restored(251000);assert.equal(r.degrade,true);assert.equal(m.degraded,true);
  m.lost(260000);assert.equal(m.restored(261000).degrade,false,'ya degradado: no se repite');
});
