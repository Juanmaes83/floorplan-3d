/* SCULPT-R01 · D2 classic Web Worker: runs RubikRecognitionEvidence.analyse off the main thread so the page stays
 * responsive and a cancellation (worker.terminate()) really stops the computation. Same pure modules as the page;
 * no network, no storage; the only output is postMessage. */
/* global importScripts, RubikRecognitionEvidence */
'use strict';
importScripts('workshop/ocr-postprocess-rules.js', 'workshop/recognition-core.js', 'recognition-evidence-core.js');
self.onmessage = event => {
  const { id, image, options } = event.data || {};
  try {
    const img = { width: image.width, height: image.height, data: new Uint8ClampedArray(image.buffer) };
    const r = RubikRecognitionEvidence.analyse(img, options || {});
    self.postMessage({ id, ok: r.ok, evidence: r.ok ? r.evidence : null, error: r.ok ? null : r.error });
  } catch (e) {
    self.postMessage({ id, ok: false, evidence: null, error: { code: 'worker-exception', detail: String(e && e.message || e).slice(0, 200) } });
  }
};
