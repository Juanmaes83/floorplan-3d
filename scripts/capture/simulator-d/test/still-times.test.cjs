// D · tiempos de muestreo: paridad con simulator@57d562c sims/capture.mjs#stillTimes y validaciones nuevas.
const { test } = require('node:test'), assert = require('node:assert/strict'), { stillTimes } = require('../src/still-times.cjs');
// Referencia literal del donante (sin argv): lista, every:, beats con +0,3 s; recorte a [0, end - 1/120] y 2 decimales.
function donor(arg, end, from = 0, tl = null) {
  let ts;
  if (arg === 'beats') { ts = []; const walk = (v, key) => { if (key === 'fps' || key === 'duration') return; if (typeof v === 'number') ts.push(v + 0.3); else if (Array.isArray(v)) v.forEach(x => walk(x)); else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => walk(x, k)); }; walk(tl); ts = [0, ...ts]; }
  else if (arg.startsWith('every:')) { const step = Number(arg.slice(6)); ts = []; for (let t = from; t <= end + 1e-6; t += step) ts.push(t); }
  else ts = arg.split(',').map(Number);
  return [...new Set(ts.map(t => Math.min(Math.max(t, 0), end - 1 / 120).toFixed(2)))].map(Number).sort((a, b) => a - b);
}
test('paridad con el donante dentro del intervalo (lista, every:, beats)', () => {
  assert.deepEqual(stillTimes('0,4,9,4', { to: 12 }), donor('0,4,9,4', 12));
  assert.deepEqual(stillTimes('every:0.2', { from: 3, to: 5 }).slice(0, -1), donor('every:0.2', 5, 3).slice(0, -1));
  const tl = { fps: 30, duration: 20, stages: [{ at: 0 }, { at: 4.5 }, { at: 9 }], hero: 12 };
  assert.deepEqual(stillTimes('beats', { to: 20, timeline: tl }), donor('beats', 20, 0, tl));
});
test('generalización: el último instante es el final exacto; acumulación de coma flotante sin pérdidas', () => {
  const t = stillTimes('every:0.1', { to: 1 });
  assert.equal(t.length, 11); assert.equal(t.at(-1), 1);
});
test('rechazos explícitos: sin final, paso no positivo, valores no numéricos, beats sin timeline, demasiadas muestras', () => {
  assert.throws(() => stillTimes('1,2', {}), /to/);
  assert.throws(() => stillTimes('every:0', { to: 2 }), /positive/);
  assert.throws(() => stillTimes('1,x', { to: 2 }), /numbers/);
  assert.throws(() => stillTimes('beats', { to: 2 }), /timeline/);
  assert.throws(() => stillTimes('every:0.0001', { to: 10 }), /too many/);
});
