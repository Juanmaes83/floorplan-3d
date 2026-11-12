/* SCULPT-R01 · D2 real cancellation (the gap the first cut documented: «no existe cancelación interrumpible»).
 * run(image, options) starts ONE dedicated worker for ONE analysis and returns {promise, cancel}:
 *  - cancel(): worker.terminate() — the computation stops; the promise rejects with code 'cancelled'; no evidence.
 *  - timeoutMs: the same, with code 'timeout' (not a conclusion about the plan).
 *  - the caller's pixels are copied before transfer, so the caller's image is never detached or modified.
 *  - recovery: every run uses a fresh worker; a cancelled, failed or timed-out run leaves nothing behind.
 * The evidence is produced by the same RubikRecognitionEvidence.analyse as on the main thread (tests compare them). */
(function (root) {
  'use strict';
  const DEFAULT_TIMEOUT_MS = 60000;
  let seq = 0;
  function run(image, options = {}, { workerUrl = 'recognition-worker.js', timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
    const id = ++seq;
    let worker = null, settled = false, timer = null, rejectFn = null;
    const stop = () => { if (worker) { worker.terminate(); worker = null; } clearTimeout(timer); };
    const promise = new Promise((resolve, reject) => {
      rejectFn = reject;
      const fail = (code, detail) => { if (settled) return; settled = true; stop(); const e = new Error(code); e.code = code; if (detail) e.detail = detail; reject(e); };
      if (!image || !Number.isInteger(image.width) || !Number.isInteger(image.height) || !image.data) return fail('image-invalid');
      try { worker = new Worker(workerUrl); } catch (e) { return fail('worker-unavailable', String(e && e.message || e)); }
      worker.onmessage = ev => {
        if (settled || !ev.data || ev.data.id !== id) return;
        settled = true; stop();
        if (ev.data.ok) resolve(ev.data.evidence); else { const e = new Error(ev.data.error && ev.data.error.code || 'analysis-failed'); e.code = e.message; e.detail = ev.data.error && ev.data.error.detail; reject(e); }
      };
      worker.onerror = ev => { ev.preventDefault && ev.preventDefault(); fail('worker-error', ev.message); };
      timer = setTimeout(() => fail('timeout'), timeoutMs);
      const copy = new Uint8ClampedArray(image.data); // never detach the caller's buffer
      worker.postMessage({ id, image: { width: image.width, height: image.height, buffer: copy.buffer }, options }, [copy.buffer]);
    });
    const cancel = () => { if (settled) return false; settled = true; stop(); const e = new Error('cancelled'); e.code = 'cancelled'; rejectFn(e); return true; };
    return { id, promise, cancel };
  }
  root.RubikRecognitionRunner = { run, DEFAULT_TIMEOUT_MS };
})(typeof globalThis !== 'undefined' ? globalThis : this);
