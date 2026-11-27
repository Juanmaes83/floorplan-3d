'use strict';
// Gesture Labs §6 · núcleo puro: dos gestos, sin disparos involuntarios, mano perdida sin acción.
const test = require('node:test'), assert = require('node:assert/strict');
const G = require('../labs/gesture-presentacion/gesture-core.js');
const run = (g, seq) => { const ev = []; for (const [lm, t] of seq) ev.push(...g.frame(lm, t).events); return ev; };
const frames = (kind, t0, n, dt = 33, x = 0.5, dx = 0) => Array.from({ length: n }, (_, i) => [G.syntheticHand(kind, x + dx * i, 0.5), t0 + i * dt]);

test('la mano sintética se clasifica como abierta y cerrada', () => {
  assert.equal(G.create().frame(G.syntheticHand('open'), 0).info.gesture, 'OPEN');
  assert.equal(G.create().frame(G.syntheticHand('fist'), 0).info.gesture, 'FIST');
});
test('mano abierta sostenida: un solo «next» y se rearma al cerrar', () => {
  const g = G.create();
  const ev = run(g, [...frames('open', 0, 40), ...frames('fist', 1400, 10), ...frames('open', 1800, 40)]);
  assert.deepEqual(ev.filter(e => e.type === 'next').length, 2);
});
test('mano abierta breve (< 600 ms) no dispara', () => {
  assert.equal(run(G.create(), frames('open', 0, 12)).filter(e => e.type === 'next').length, 0);
});
test('deslizar con la mano cerrada: derecha e izquierda (en espejo), con espera entre disparos', () => {
  const g = G.create(); run(g, frames('fist', 0, 6, 33, 0.7));
  const r = run(g, frames('fist', 200, 8, 40, 0.7, -0.04)); // la cámara ve la mano ir a la izquierda → en pantalla, derecha
  assert.deepEqual(r.filter(e => e.type === 'swipe').map(e => e.dir), ['right']);
  const too = run(g, frames('fist', 560, 8, 40, 0.3, 0.04)); assert.equal(too.filter(e => e.type === 'swipe').length, 0, 'enfriamiento 850 ms');
  const l = run(g, frames('fist', 1600, 8, 40, 0.3, 0.04)); assert.deepEqual(l.filter(e => e.type === 'swipe').map(e => e.dir), ['left']);
});
test('movimiento lento o vertical no es un deslizamiento', () => {
  const g = G.create(); run(g, frames('fist', 0, 6, 33, 0.7));
  assert.equal(run(g, frames('fist', 200, 30, 100, 0.7, -0.01)).filter(e => e.type === 'swipe').length, 0);
});
test('perder la mano 700 ms: evento «lost», sin acción, y la apertura en curso se anula', () => {
  const g = G.create(); const a = run(g, frames('open', 0, 10)); // 300 ms abierta
  const b = run(g, [[null, 400], [null, 1100]]);
  assert.deepEqual(b.map(e => e.type), ['lost']); assert.equal(g.state, 'LOST');
  const c = run(g, frames('open', 1200, 10)); assert.equal([...a, ...c].filter(e => e.type === 'next').length, 0, 'no se suma lo anterior');
});
test('presentación: plano → 3D → comparar; el cambio de revisión solo en comparar', () => {
  const p = G.presentation(); assert.equal(p.toggle('right'), null); assert.equal(p.next(), '3d'); assert.equal(p.next(), 'compare'); assert.equal(p.next(), 'compare');
  assert.equal(p.toggle('right'), 'after'); assert.equal(p.toggle('left'), 'before'); assert.equal(p.prev(), '3d');
});
