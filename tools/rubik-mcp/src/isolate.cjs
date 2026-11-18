'use strict';
// Etapa 2 · hardening. Heavy read-only computations (propose_layout, check_route_2d, review_layout) run in a worker
// thread so that: (1) the stdio loop stays free and other requests are answered at once (no head-of-line blocking);
// (2) an MCP `notifications/cancelled` really stops the computation (the worker is terminated, and the SDK then sends
// no response for the cancelled request); (3) a time budget and a concurrency cap bound the resources. The file is
// still read and validated on the main thread by core.createProjectReader (its protections are unchanged): the worker
// only receives a structured clone of the validated project and its snapshot, and calls the SAME pure functions
// (proposal.cjs, route.cjs, layout-review.js). Nothing is written anywhere.

const path = require('node:path');
const { Worker } = require('node:worker_threads');

const LIMITS = Object.freeze({ concurrent: 2, defaultTimeoutMs: 30000, minTimeoutMs: 100, maxTimeoutMs: 120000, workerHeapMb: 512 });
const TASKS = Object.freeze(['proposeLayout', 'checkRoute2d', 'reviewLayout']);

function timeoutFromEnv(env = process.env) {
  const raw = env.RUBIK_MCP_HEAVY_TIMEOUT_MS;
  if (raw === undefined || raw === '') return LIMITS.defaultTimeoutMs;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < LIMITS.minTimeoutMs || n > LIMITS.maxTimeoutMs) throw new Error(`RUBIK_MCP_HEAVY_TIMEOUT_MS debe ser un entero entre ${LIMITS.minTimeoutMs} y ${LIMITS.maxTimeoutMs}.`);
  return n;
}

class CancelledError extends Error { constructor() { super('Consulta cancelada por el cliente.'); this.name = 'CancelledError'; } }

function createIsolate({ timeoutMs = LIMITS.defaultTimeoutMs, concurrent = LIMITS.concurrent } = {}) {
  let active = 0;
  const stats = { started: 0, completed: 0, cancelled: 0, timedOut: 0, rejectedBusy: 0, failed: 0 };
  function run(task, project, snapshot, args, { signal } = {}) {
    if (!TASKS.includes(task)) return Promise.reject(new Error('Cálculo no admitido.'));
    if (signal?.aborted) { stats.cancelled++; return Promise.reject(new CancelledError()); }
    if (active >= concurrent) {
      stats.rejectedBusy++;
      return Promise.reject(new Error(`Ya hay ${concurrent} cálculos pesados en curso. Espera a que terminen o cancela alguno; no se ha calculado nada.`));
    }
    active++; stats.started++;
    return new Promise((resolve, reject) => {
      let settled = false, timer = null;
      const worker = new Worker(path.join(__dirname, 'isolate-worker.cjs'), {
        workerData: { task, project, snapshot, args },
        resourceLimits: { maxOldGenerationSizeMb: LIMITS.workerHeapMb },
        stdout: true, stderr: true // never let a worker write to the stdio channel of the protocol
      });
      worker.stdout.resume(); worker.stderr.resume();
      const finish = (error, result, kind) => {
        if (settled) return; settled = true; active--;
        clearTimeout(timer); signal?.removeEventListener('abort', onAbort);
        worker.terminate().catch(() => {});
        if (kind) stats[kind]++;
        if (error) reject(error); else resolve(result);
      };
      const onAbort = () => finish(new CancelledError(), null, 'cancelled');
      signal?.addEventListener('abort', onAbort, { once: true });
      timer = setTimeout(() => finish(new Error(`El cálculo superó el límite de ${Math.round(timeoutMs / 100) / 10} s y se detuvo. No es una conclusión sobre el proyecto: prueba con un paso mayor o menos candidatos.`), null, 'timedOut'), timeoutMs);
      worker.once('message', m => (m && m.ok ? finish(null, m.result, 'completed') : finish(new Error(m && typeof m.error === 'string' ? m.error : 'Error en el cálculo.'), null, 'failed')));
      worker.once('error', e => finish(new Error(/heap|memory/i.test(String(e && e.message)) ? 'El cálculo superó el límite de memoria y se detuvo.' : 'Error en el cálculo.'), null, 'failed'));
      worker.once('exit', code => finish(new Error(`El cálculo terminó sin resultado (código ${code}).`), null, 'failed'));
    });
  }
  return Object.freeze({ run, get active() { return active; }, stats: () => ({ ...stats, active }), timeoutMs, concurrent });
}

module.exports = { LIMITS, TASKS, CancelledError, createIsolate, timeoutFromEnv };
