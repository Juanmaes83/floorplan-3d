'use strict';
/* SCULPT Simulator · D · Tiempos de muestreo de una secuencia (puro, sin navegador).
 * Origen: simulator@57d562c `sims/capture.mjs#stillTimes` (MIT). KEEP: lista «0,4,9», «every:<paso>», «beats» desde un
 * timeline (+0,3 s para que el movimiento asiente), deduplicado y recorte al intervalo. GENERALISE: sin argv ni rutas,
 * con validación y límite de muestras. REMOVE: la dependencia de `sims/<name>/timeline.json`.
 */
const MAX = 2000;

function stillTimes(spec, { from = 0, to, timeline = null, settle = 0.3 } = {}) {
  if (!Number.isFinite(to) || to <= from) throw Error('stillTimes: `to` must be a number greater than `from`');
  let ts;
  if (spec === 'beats') {
    if (!timeline || typeof timeline !== 'object') throw Error('stillTimes: `beats` needs a timeline object');
    ts = [0];
    const walk = (v, key) => {
      if (key === 'fps' || key === 'duration') return;
      if (typeof v === 'number') ts.push(v + settle);
      else if (Array.isArray(v)) v.forEach(x => walk(x));
      else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => walk(x, k));
    };
    walk(timeline);
  } else if (typeof spec === 'string' && spec.startsWith('every:')) {
    const step = Number(spec.slice(6));
    if (!(step > 0)) throw Error('stillTimes: every:<step> needs a positive step');
    if ((to - from) / step > MAX) throw Error('stillTimes: too many samples');
    ts = []; for (let i = 0; from + i * step <= to + 1e-9; i++) ts.push(from + i * step);
  } else {
    ts = (Array.isArray(spec) ? spec : String(spec).split(',')).map(Number);
    if (ts.some(t => !Number.isFinite(t))) throw Error('stillTimes: list values must be numbers');
  }
  // Mismo criterio que el donante: dentro del intervalo, dos decimales, sin repetir, ordenados.
  const out = [...new Set(ts.map(t => Math.min(Math.max(t, from), to).toFixed(2)))].map(Number).sort((a, b) => a - b);
  if (out.length > MAX) throw Error('stillTimes: too many samples');
  return out;
}

module.exports = { stillTimes, MAX };
