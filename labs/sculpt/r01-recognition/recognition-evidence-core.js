/* SCULPT-R01 · RecognitionEvidenceV1 — RUBIK adapter around the R01 donor (workshop copy, MIT).
 *
 * Contract: turns a raster plan into EVIDENCE in image pixels for a human to review.
 * It never writes project geometry, never converts pixels to millimetres, never applies a scale,
 * never names a room unless OCR text says so, never invents rooms and never assigns a confidence.
 * Pure: no DOM, no network, no clock, no randomness. Same input → same output.
 */
(function (root) {
  'use strict';
  const R = typeof module === 'object' && typeof require === 'function'
    ? require('./workshop/recognition-core.js')
    : root.FloorplanRecognition;

  const SCHEMA = 'rubik.recognition-evidence', VERSION = 1;
  const DONOR = Object.freeze({
    repo: 'zhuzhuyumeng/floorplan-3d', branch: 'feat/floorplan-recognition', upstreamPr: 'wy51ai/floorplan-3d#18',
    commit: '1d235fc0a3c45783e1e1fa129944f8f34d97d297',
    license: 'MIT (declared in the donor tree; legal review pending, GOV-05)', workshop: 'labs/sculpt/r01-recognition/workshop/recognition-core.js'
  });
  const LIMITS = Object.freeze({ minSide: 32, maxPixels: 3000000, maxWords: 5000, maxText: 200 });
  // C1/C2: donor-specific behaviour switched off. Explicit, so every evidence states what ran.
  const DETECT_OPTIONS = Object.freeze({ ignoreRects: Object.freeze([]) });
  const ENRICH_OPTIONS = Object.freeze({ synthesizeRooms: false, heuristicNames: false, inferDroppedDecimal: false });
  // What this evidence can never claim. Codes, so a UI can translate them.
  const STANDING_LIMITS = Object.freeze([
    'not-validated-on-real-plans', 'pixels-only-no-scale', 'not-load-bearing-analysis',
    'opening-kind-is-raster-heuristic', 'ocr-text-unverified', 'human-review-required'
  ]);
  const OPENING_KINDS = new Set(['door', 'window']);
  // C4: a wall rectangle "touches" another when they overlap or are at most this far apart. A geometric fact, not a score.
  const TOUCH_GAP_PX = 1;
  const touches = (a, b) => a[0] <= b[2] + TOUCH_GAP_PX && b[0] <= a[2] + TOUCH_GAP_PX && a[1] <= b[3] + TOUCH_GAP_PX && b[1] <= a[3] + TOUCH_GAP_PX;
  const SHA256_RE = /^[0-9a-f]{64}$/;

  const finite = v => typeof v === 'number' && Number.isFinite(v);

  // Pure, synchronous SHA-256 (FIPS 180-4) so the adapter can VERIFY hashes itself, in Node and in the browser alike.
  const K256 = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2]);
  function sha256(parts) {
    const H = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
    const w = new Uint32Array(64), block = new Uint8Array(64);
    let fill = 0, total = 0;
    const compress = () => {
      for (let i = 0; i < 16; i++) w[i] = (block[i * 4] << 24 | block[i * 4 + 1] << 16 | block[i * 4 + 2] << 8 | block[i * 4 + 3]) >>> 0;
      for (let i = 16; i < 64; i++) {
        const a = w[i - 15], b = w[i - 2];
        const s0 = (a >>> 7 | a << 25) ^ (a >>> 18 | a << 14) ^ a >>> 3, s1 = (b >>> 17 | b << 15) ^ (b >>> 19 | b << 13) ^ b >>> 10;
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
      }
      let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (let i = 0; i < 64; i++) {
        const S1 = (e >>> 6 | e << 26) ^ (e >>> 11 | e << 21) ^ (e >>> 25 | e << 7), ch = e & f ^ ~e & g;
        const t1 = (h + S1 + ch + K256[i] + w[i]) >>> 0;
        const S0 = (a >>> 2 | a << 30) ^ (a >>> 13 | a << 19) ^ (a >>> 22 | a << 10), mj = a & b ^ a & c ^ b & c;
        const t2 = (S0 + mj) >>> 0;
        h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      H[0] += a; H[1] += b; H[2] += c; H[3] += d; H[4] += e; H[5] += f; H[6] += g; H[7] += h;
    };
    const push = bytes => {
      total += bytes.length;
      for (let i = 0; i < bytes.length; i++) { block[fill++] = bytes[i]; if (fill === 64) { compress(); fill = 0; } }
    };
    for (const p of parts) push(p);
    const bits = total * 8;
    push(new Uint8Array([0x80]));
    while (fill !== 56) push(new Uint8Array([0]));
    const len = new Uint8Array(8);
    for (let i = 0; i < 8; i++) len[7 - i] = Math.floor(bits / 2 ** (8 * i)) & 0xff;
    push(len);
    return Array.from(H, v => v.toString(16).padStart(8, '0')).join('');
  }
  const asBytes = d => d instanceof Uint8Array || d instanceof Uint8ClampedArray ? new Uint8Array(d.buffer, d.byteOffset, d.byteLength) : null;
  // Hash of the decoded pixels: width and height (uint32, big endian) followed by the RGBA bytes. Computed, so always verified.
  // Mandatory in every valid RecognitionEvidenceV1 (closing audit 10/11): evidence without it cannot be tied to an image.
  const PIXEL_HASH_COVERS = 'uint32be(width)+uint32be(height)+rgba';
  function pixelSha256(image) {
    const head = new Uint8Array(8), v = new DataView(head.buffer);
    v.setUint32(0, image.width); v.setUint32(4, image.height);
    return sha256([head, asBytes(image.data) || Uint8Array.from(image.data)]);
  }
  const rect4 = r => Array.isArray(r) && r.length === 4 && r.every(finite) ? [r[0], r[1], r[2], r[3]] : null;
  const point = p => Array.isArray(p) && p.length === 2 && p.every(finite) ? [p[0], p[1]] : null;
  const bboxOf = b => b && [b.x0, b.y0, b.x1, b.y1].every(finite) ? [b.x0, b.y0, b.x1, b.y1] : null;
  const fail = (code, detail) => ({ ok: false, error: detail ? { code, detail } : { code } });

  function checkImage(image) {
    if (!image || typeof image !== 'object') return 'image-missing';
    const { width, height, data } = image;
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) return 'image-invalid';
    if (!data || typeof data.length !== 'number' || data.length !== width * height * 4) return 'image-invalid';
    if (width < LIMITS.minSide || height < LIMITS.minSide || width * height > LIMITS.maxPixels) return 'image-size-out-of-range';
    return null;
  }

  // Words come from any OCR engine the caller ran. Their score is the engine's own number, passed through untouched.
  // Audit 10/11: every word is checked against the image frame; nothing is truncated or clamped silently.
  function cleanWords(words, W, H) {
    if (words == null) return { words: null };
    if (!Array.isArray(words)) return { error: 'ocr-words-invalid' };
    if (words.length > LIMITS.maxWords) return { error: 'ocr-too-many-words' };
    const out = [];
    for (let i = 0; i < words.length; i++) {
      const w = words[i], at = 'word ' + i;
      const bbox = w && typeof w === 'object' && bboxOf(w.bbox);
      if (!bbox || typeof w.text !== 'string' || bbox[2] < bbox[0] || bbox[3] < bbox[1]) return { error: 'ocr-words-invalid', detail: at };
      if (bbox[0] < 0 || bbox[1] < 0 || bbox[2] > W || bbox[3] > H) return { error: 'ocr-word-out-of-frame', detail: at };
      if (w.text.length > LIMITS.maxText) return { error: 'ocr-word-text-too-long', detail: at };
      if (w.confidence != null && !finite(w.confidence)) return { error: 'ocr-word-score-invalid', detail: at };
      out.push({ text: w.text, bbox: { x0: bbox[0], y0: bbox[1], x1: bbox[2], y1: bbox[3] }, engineScore: finite(w.confidence) ? w.confidence : null });
    }
    return { words: out };
  }

  // A file hash given by the caller is only DECLARED. It becomes VERIFIED when the caller also hands over the file bytes
  // and they hash to the same value; a mismatch is refused. The pixel hash is always computed here.
  function imageRefOf(ref, fileBytes) {
    if (ref != null && (typeof ref !== 'object' || Array.isArray(ref))) return { error: 'image-ref-invalid' };
    const out = { id: null, file: null };
    if (ref?.id != null) { if (typeof ref.id !== 'string' || !ref.id || ref.id.length > 120) return { error: 'image-ref-invalid' }; out.id = ref.id; }
    const declared = ref?.fileSha256 ?? null;
    if (declared != null && (typeof declared !== 'string' || !SHA256_RE.test(declared))) return { error: 'image-ref-invalid' };
    if (ref && 'sha256' in ref) return { error: 'image-ref-ambiguous-hash' }; // say which bytes: fileSha256 (file) — pixels are hashed here
    if (fileBytes != null) {
      const bytes = asBytes(fileBytes);
      if (!bytes || !bytes.length) return { error: 'image-file-bytes-invalid' };
      const actual = sha256([bytes]);
      if (declared && declared !== actual) return { error: 'image-file-hash-mismatch' };
      out.file = { sha256: actual, status: 'verified', bytes: bytes.length };
    } else if (declared) out.file = { sha256: declared, status: 'declared' };
    return { ref: out };
  }

  function analyse(image, { words = null, ocrEngine = null, imageRef = null, fileBytes = null } = {}) {
    const bad = checkImage(image);
    if (bad) return fail(bad);
    const ocr = cleanWords(words, image.width, image.height);
    if (ocr.error) return fail(ocr.error, ocr.detail);
    if (ocrEngine != null && (typeof ocrEngine !== 'string' || !ocrEngine || ocrEngine.length > 80)) return fail('ocr-engine-invalid');
    if (ocrEngine != null && ocr.words == null) return fail('ocr-engine-without-words');
    const refOut = imageRefOf(imageRef, fileBytes);
    if (refOut.error) return fail(refOut.error);
    const ref = { ...refOut.ref, pixels: { sha256: pixelSha256(image), status: 'computed', covers: PIXEL_HASH_COVERS } };
    let result;
    try {
      result = R.detect(image, { ignoreRects: DETECT_OPTIONS.ignoreRects });
      // The donor mutates; give it its own copies of the words (with the engine score as its confidence).
      if (ocr.words) R.enrich(result, ocr.words.map(w => ({ text: w.text, bbox: { ...w.bbox }, confidence: w.engineScore ?? undefined })), ENRICH_OPTIONS);
    } catch (e) {
      return fail('detector-rejected', String(e && e.message || e).slice(0, 200));
    }
    return { ok: true, evidence: fromDetection(result, { words: ocr.words, ocrEngine, imageRef: ref }) };
  }

  function labelOf(ev, basis) {
    if (!ev) return null;
    return { text: String(ev.text), matched: ev.name ?? null, bbox: bboxOf(ev.bbox), merged: !!ev.merged, placement: basis === 'ocr-inside' ? 'inside' : 'nearby' };
  }

  function fromDetection(result, { words = null, ocrEngine = null, imageRef = null } = {}) {
    imageRef = imageRef || { id: null, file: null, pixels: null };
    const W = result.width, H = result.height;
    const walls = (result.walls || []).map((w, i) => {
      const r = rect4(w.rect);
      return { id: 'wall-' + i, rect: r, axis: w.axis === 'v' ? 'v' : 'h', thicknessPx: r ? Math.min(r[2] - r[0], r[3] - r[1]) : null, touchesOtherWall: false, review: 'unreviewed' };
    });
    for (const a of walls) a.touchesOtherWall = !!a.rect && walls.some(b => b !== a && b.rect && touches(a.rect, b.rect));
    const openings = (result.openings || []).map((o, i) => ({
      id: 'opening-' + i, rect: rect4(o.rect), axis: o.axis === 'v' ? 'v' : 'h',
      kind: OPENING_KINDS.has(o.type) ? o.type : 'unknown', kindBasis: 'raster-heuristic', review: 'unreviewed'
    }));
    // Synthetic rooms never reach the evidence (C2 also keeps the donor from creating them).
    const rooms = (result.rooms || []).filter(r => !r.synthetic).map((r, i) => {
      const area = r.areaEvidence ? { valueM2: finite(r.areaLabel) ? r.areaLabel : null, text: String(r.areaEvidence.text), bbox: bboxOf(r.areaEvidence.bbox), merged: !!r.areaEvidence.merged } : null;
      return {
        id: 'room-' + i, poly: (r.poly || []).map(point).filter(Boolean), at: point(r.at), areaPx: finite(r.areaPx) ? r.areaPx : null,
        label: labelOf(r.textEvidence && { ...r.textEvidence, name: r.name }, r.nameBasis), areaLabel: area,
        wordsInside: [], review: 'unreviewed'
      };
    });
    // C5 (GENERALISE): the donor only keeps labels from its Chinese alias table, so «Salón» was lost.
    // Every OCR word whose box centre lies inside a room polygon is listed by index, verbatim, without naming the room.
    if (words) words.forEach((w, i) => {
      const cx = (w.bbox.x0 + w.bbox.x1) / 2, cy = (w.bbox.y0 + w.bbox.y1) / 2;
      const hits = rooms.filter(r => r.poly.length >= 3 && R.contains(cx, cy, r.poly));
      if (hits.length) hits.sort((a, b) => (a.areaPx ?? Infinity) - (b.areaPx ?? Infinity))[0].wordsInside.push(i);
    });
    const unplacedLabels = (result.unplacedLabels || []).map(l => ({ text: String(l.text), matched: l.name ?? null, bbox: bboxOf(l.bbox) }));
    const hints = words ? R.scaleCandidates(result, words.map(w => ({ text: w.text, bbox: w.bbox })))
      .map(c => ({ method: c.method, axis: c.axis, mmPerPxCandidate: c.mmPerPx, valuesRead: c.values.slice(), status: 'unverified', applied: false })) : [];
    const c = result.compass;
    const warnings = [];
    if (!walls.length) warnings.push('no-walls');
    if (!rooms.length) warnings.push('no-closed-rooms');
    if (!result.dimensionFrame) warnings.push('no-dimension-frame');
    if (!c) warnings.push('no-compass');
    if (words && !rooms.some(r => r.label)) warnings.push('no-room-labels-read');
    if (unplacedLabels.length) warnings.push('labels-without-room');
    if (walls.some(w => !w.touchesOtherWall)) warnings.push('isolated-wall-pieces');
    return {
      schema: SCHEMA, version: VERSION, canonical: false,
      frame: { units: 'image-px', origin: 'top-left', yAxis: 'down', width: W, height: H },
      source: {
        engine: 'sculpt-r01', donor: { ...DONOR },
        detectOptions: { ignoreRects: [] },
        touchGapPx: TOUCH_GAP_PX,
        enrichOptions: words ? { ...ENRICH_OPTIONS } : null,
        image: imageRef
      },
      scale: { status: 'unknown', mmPerPx: null, hints },
      walls, openings, rooms,
      annotations: {
        compass: c ? { at: point([c.x, c.y]), angleDeg: finite(c.angleDeg) ? c.angleDeg : null, facing: c.facing ?? null, basis: 'raster-heuristic' } : null,
        dimensionFrame: result.dimensionFrame ? { rect: rect4(result.dimensionFrame.rect) } : null
      },
      ocr: words ? { status: 'provided', engine: ocrEngine, words: words.map(w => ({ text: w.text, bbox: bboxOf(w.bbox), engineScore: w.engineScore })) } : { status: 'not-run', engine: null, words: [] },
      unplacedLabels,
      warnings,
      limits: STANDING_LIMITS.slice()
    };
  }

  // Strict structural check. Returns the list of problems; [] means valid.
  // With {image}, the pixel hash is recomputed: a "computed" hash that does not match the image is reported.
  function validate(ev, { image = null } = {}) {
    const errs = [];
    const add = m => { if (errs.length < 50) errs.push(m); };
    if (!ev || typeof ev !== 'object') return ['not-an-object'];
    if (ev.schema !== SCHEMA || ev.version !== VERSION) add('schema');
    if (ev.canonical !== false) add('canonical-must-be-false');
    const f = ev.frame;
    if (!f || f.units !== 'image-px' || f.origin !== 'top-left' || f.yAxis !== 'down' || !Number.isInteger(f.width) || !Number.isInteger(f.height)) { add('frame'); return errs; }
    const inside = ([x, y]) => x >= 0 && y >= 0 && x <= f.width && y <= f.height;
    const okRect = r => Array.isArray(r) && r.length === 4 && r.every(finite) && r[2] >= r[0] && r[3] >= r[1] && inside([r[0], r[1]]) && inside([r[2], r[3]]);
    if (!ev.scale || ev.scale.status !== 'unknown' || ev.scale.mmPerPx !== null) add('scale-must-stay-unknown');
    for (const h of ev.scale?.hints || []) if (h.applied !== false || h.status !== 'unverified') add('scale-hint-applied');
    for (const k of ['walls', 'openings', 'rooms']) if (!Array.isArray(ev[k])) add(k + '-missing');
    for (const w of ev.walls || []) {
      if (!okRect(w.rect)) add('wall-rect:' + w.id);
      if (w.review !== 'unreviewed') add('wall-review:' + w.id);
      if (typeof w.touchesOtherWall !== 'boolean') add('wall-touch:' + w.id);
    }
    for (const o of ev.openings || []) {
      if (!okRect(o.rect)) add('opening-rect:' + o.id);
      if (!['door', 'window', 'unknown'].includes(o.kind) || o.kindBasis !== 'raster-heuristic') add('opening-kind:' + o.id);
      if (o.review !== 'unreviewed') add('opening-review:' + o.id);
    }
    for (const r of ev.rooms || []) {
      if (!Array.isArray(r.poly) || r.poly.length < 3 || !r.poly.every(p => Array.isArray(p) && p.length === 2 && p.every(finite) && inside(p))) add('room-poly:' + r.id);
      if (r.review !== 'unreviewed') add('room-review:' + r.id);
      if (r.label && (typeof r.label.text !== 'string' || !['inside', 'nearby'].includes(r.label.placement))) add('room-label:' + r.id);
      if ('synthetic' in r || 'name' in r) add('room-invented-field:' + r.id);
      if (!Array.isArray(r.wordsInside) || !r.wordsInside.every(i => Number.isInteger(i) && i >= 0 && i < (ev.ocr?.words?.length ?? 0))) add('room-words:' + r.id);
    }
    // Nothing may carry a confidence: only the OCR engine's own score, under its own name.
    const walk = (v, path) => {
      if (!v || typeof v !== 'object') return;
      for (const [k, x] of Object.entries(v)) {
        if (/^(confidence|score|probability|mm|lengthMm|areaM2Measured)$/i.test(k)) add('forbidden-field:' + path + k);
        walk(x, path + k + '.');
      }
    };
    walk(ev, '');
    if (!ev.ocr || !['not-run', 'provided'].includes(ev.ocr.status)) add('ocr-status');
    const ocrWords = Array.isArray(ev.ocr?.words) ? ev.ocr.words : (add('ocr-words'), []);
    if (ev.ocr?.status === 'not-run' && ocrWords.length) add('ocr-words-without-run');
    ocrWords.forEach((w, i) => {
      if (!w || typeof w.text !== 'string' || w.text.length > LIMITS.maxText) add('ocr-word-text:' + i);
      if (!okRect(w?.bbox)) add('ocr-word-bbox:' + i);
      if (w && w.engineScore !== null && !finite(w.engineScore)) add('ocr-word-score:' + i);
    });
    const seen = new Set();
    for (const r of ev.rooms || []) for (const i of r.wordsInside || []) { if (seen.has(i)) add('word-in-two-rooms:' + i); seen.add(i); }
    for (const r of ev.rooms || []) {
      if (r.label && r.label.bbox !== null && !okRect(r.label.bbox)) add('room-label-bbox:' + r.id);
      if (r.areaLabel && (!(r.areaLabel.valueM2 === null || finite(r.areaLabel.valueM2)) || (r.areaLabel.bbox !== null && !okRect(r.areaLabel.bbox)))) add('room-area-label:' + r.id);
    }
    for (const [i, l] of (ev.unplacedLabels || []).entries()) if (typeof l.text !== 'string' || (l.bbox !== null && !okRect(l.bbox))) add('unplaced-label:' + i);
    const cp = ev.annotations?.compass;
    if (cp && !(Array.isArray(cp.at) && cp.at.length === 2 && cp.at.every(finite) && inside(cp.at))) add('compass-at');
    if (ev.annotations?.dimensionFrame && !okRect(ev.annotations.dimensionFrame.rect)) add('dimension-frame-rect');
    for (const h of ev.scale?.hints || []) if (!finite(h.mmPerPxCandidate) || !Array.isArray(h.valuesRead) || !h.valuesRead.every(finite)) add('scale-hint-values');
    // Provenance of the image: declared vs verified vs computed.
    const im = ev.source?.image;
    if (!im || typeof im !== 'object') add('source-image');
    else {
      if (im.file !== null && !(im.file && SHA256_RE.test(im.file.sha256) && ['declared', 'verified'].includes(im.file.status))) add('source-image-file');
      if (im.file?.status === 'verified' && !Number.isInteger(im.file.bytes)) add('source-image-file-bytes');
      if (im.file?.status === 'declared' && 'bytes' in im.file) add('source-image-file-bytes');
      // The pixel hash is mandatory. Without {image} only its presence and form are checked (no cryptographic claim);
      // with {image} it is recomputed and must match.
      const px = im.pixels, pixelErr = [];
      if (!px || typeof px !== 'object' || Array.isArray(px)) pixelErr.push('missing');
      else {
        if (typeof px.sha256 !== 'string' || !SHA256_RE.test(px.sha256)) pixelErr.push('sha256');
        if (px.status !== 'computed') pixelErr.push('status');
        if (px.covers !== PIXEL_HASH_COVERS) pixelErr.push('covers');
      }
      if (pixelErr.length) { add('source-image-pixels'); for (const e of pixelErr) add('source-image-pixels:' + e); }
      if (image && !pixelErr.length && (checkImage(image) || pixelSha256(image) !== px.sha256)) add('pixels-hash-mismatch');
      if (image && (image.width !== f.width || image.height !== f.height)) add('frame-differs-from-image');
    }
    if (!Array.isArray(ev.limits) || !STANDING_LIMITS.every(l => ev.limits.includes(l))) add('limits');
    return errs;
  }

  const api = { SCHEMA, VERSION, DONOR, LIMITS, TOUCH_GAP_PX, PIXEL_HASH_COVERS, sha256: bytes => sha256([asBytes(bytes) || Uint8Array.from(bytes)]), pixelSha256, DETECT_OPTIONS, ENRICH_OPTIONS, STANDING_LIMITS, analyse, fromDetection, validate };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.RubikRecognitionEvidence = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
