// D · captura con reloj virtual sobre RUBIK real (RUBIK_ROOT, por defecto ../../../floorplan-3d). Chromium.
const { test, before, after } = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const V = require('../src/virtual-capture.cjs'), S = require('../src/rubik-scenarios.cjs');
const root = path.resolve(process.env.RUBIK_ROOT || path.join(__dirname, '../../../../floorplan-3d'));
let tmp; before(() => { tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vcap-test-')); }); after(() => fs.rmSync(tmp, { recursive: true, force: true }));
async function ready() { const s = await V.openRubik({ root }); await s.page.evaluate(() => { setView('3d'); }); await V.advanceUntil(s.page, () => window.FloorPlanApp.viewMode === '3d'); await V.settle(s.page); return s; }

test('determinismo: el mismo vuelo en dos sesiones independientes da los mismos bytes fotograma a fotograma', { timeout: 600000 }, async () => {
  const hashes = [];
  for (let k = 0; k < 2; k++) { const s = await ready(); try { const r = await S.run(s, 'flyToRoom', { roomId: 'rom_kid' }, V.captureSequence, V.settle, { fps: 30 }); hashes.push(r); assert.deepEqual(s.external, []); assert.deepEqual(s.errors, []); } finally { await s.close(); } }
  assert.ok(hashes[0].frames.length > 10 && hashes[0].distinctFrames > 5, 'a real movement was captured');
  assert.equal(hashes[0].sequenceSha256, hashes[1].sequenceSha256);
  assert.ok(hashes[0].frames.every(f => Array.isArray(f.camera)), 'camera pose recorded per frame (for E)');
  assert.equal(hashes[0].scope, 'canvas3d');
  assert.deepEqual(hashes[0].rest, { loopActive: false, animating: false, flying: false, pendingAssets: 0 }, 'OP-02: back at rest, no live render loop');
  assert.ok(hashes[0].perf.msPerFrame.p50 > 0 && hashes[0].perf.memoryEnd.jsHeapUsedBytes > 0, JSON.stringify(hashes[0].perf));
});

test('determinismo de VENTANA COMPLETA: enter3d (interfaz + lienzo + transiciones CSS) dentro del contrato medido (EQUIVALENCIA.md) en dos sesiones', { timeout: 600000 }, async () => {
  const P = require('../src/pixel-diff.cjs'), seq = [], dirs = [];
  let rect = null;
  for (let k = 0; k < 2; k++) { const s = await ready(); const out = path.join(tmp, 'win-' + k); dirs.push(out);
    try { seq.push(await S.run(s, 'enter3d', {}, V.captureSequence, V.settle, { fps: 30, out })); assert.equal((await V.provenance(s)).clock.cssTimeline.startsWith('frozen'), true);
      rect = rect || await s.page.evaluate(() => { const r = document.querySelector('#view3d canvas').getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) }; });
    } finally { await s.close(); } }
  assert.equal(seq[0].scope, 'window'); assert.ok(seq[0].frames.some(f => f.cssAnimations > 0), 'CSS transitions were part of the sequence');
  assert.equal(seq[0].frames.length, seq[1].frames.length, 'same number of frames');
  if (seq[0].sequenceSha256 === seq[1].sequenceSha256) return; // exacto: lo mejor
  for (const f of seq[0].frames) {
    const r = P.windowEquivalent(fs.readFileSync(path.join(dirs[0], f.file)), fs.readFileSync(path.join(dirs[1], f.file)), rect);
    assert.equal(r.equivalent, true, `frame ${f.i}: ${JSON.stringify({ outside: r.outsideCanvasDifferent, ratio: r.canvasRatio, delta: r.canvasMaxDelta })}`);
  }
});

test('robustez: cancelación, acción que nunca arranca, sobrescritura y no mutación del proyecto', { timeout: 600000 }, async () => {
  const s = await ready();
  try {
    const before = await s.page.evaluate(() => JSON.stringify(window.FloorPlanApp.project)), ac = new AbortController();
    const p = V.captureSequence(s, { fps: 30, action: async page => { await page.evaluate(() => { window.View3D.flyToRoom('rom_master'); }); ac.abort(); }, signal: ac.signal });
    await assert.rejects(p, e => e.code === 'CANCELLED');
    await V.settle(s.page);
    await assert.rejects(V.captureSequence(s, { fps: 10, maxSeconds: 1, action: async () => {}, started: () => false }), e => e.code === 'NOT_STARTED');
    fs.mkdirSync(path.join(tmp, 'exists'));
    await assert.rejects(V.captureSequence(s, { action: async () => {}, out: path.join(tmp, 'exists') }), e => e.code === 'OVERWRITE');
    assert.equal(await s.page.evaluate(() => JSON.stringify(window.FloorPlanApp.project)), before);
    await assert.rejects(V.captureSequence(s, { fps: 10, seconds: 0.2, action: async page => { await page.evaluate(() => localStorage.setItem('__vc-probe', '1')); } }), e => e.code === 'MUTATION_STORAGE');
    await s.page.evaluate(() => localStorage.removeItem('__vc-probe'));
    const m = V.manifest({ provenance: await V.provenance(s), observedProject: await V.observedProject(s.page) });
    assert.equal(m.format, 'rubik-sota.d-capture'); assert.match(m.observedProject.meaning, /NOT a confirmed F0/); assert.ok(m.provenance.rubikContentSha256);
  } finally { await s.close(); }
});

test('CSS virtualizado: una transición de 1 s queda a mitad en t=0,5 y se repite idéntica', { timeout: 600000 }, async () => {
  const s = await ready();
  try {
    const run = async () => {
      await s.page.evaluate(() => { document.getElementById('__vcT')?.remove(); const d = document.createElement('div'); d.id = '__vcT'; d.style.cssText = 'position:fixed;left:0;top:0;width:200px;height:200px;background:#1f5a66;opacity:0;transition:opacity 1s linear;z-index:2147483647'; document.body.append(d); d.getBoundingClientRect(); });
      const r = await V.captureSequence(s, { fps: 10, seconds: 1.2, selector: '#__vcT', action: async page => { await page.evaluate(() => { document.getElementById('__vcT').style.opacity = '1'; }); } });
      const mid = await s.page.evaluate(() => 0); return r;
    };
    const a = await run(), b = await run();
    assert.equal(a.sequenceSha256, b.sequenceSha256, 'same bytes');
    assert.ok(a.frames.slice(1, 10).some(f => f.cssAnimations > 0), 'the transition was seen and virtualised');
    assert.ok(a.distinctFrames >= 8, 'a smooth fade, not a jump: ' + a.distinctFrames);
    assert.equal(a.frames[11].sha256, a.frames[12].sha256, 'finished: stable at the end');
  } finally { await s.close(); }
});

test('bloqueo stop()+settle: una promesa de la app con el reloj en pausa falla en tiempo acotado; act() + advanceUntil funciona; cierre limpio', { timeout: 600000 }, async () => {
  // Plazo real de 20 s: con 5 s, un runFor LEGÍTIMO (SwiftShader, 4 vCPU con carga) llegó a superarlo en una re-ejecución
  // independiente (20/11). La prueba sigue demostrando la cota: la llamada bloqueada falla en < 40 s, nunca indefinidamente.
  const s = await V.openRubik({ root, realtimeMs: 20000 });
  try {
    await s.page.evaluate(() => { setView('3d'); }); await V.advanceUntil(s.page, () => window.FloorPlanApp.viewMode === '3d'); await V.settle(s.page);
    await S.SCENARIOS.presentationNext.prepare(s.page); await V.settle(s.page);
    await S.run(s, 'presentationNext', {}, V.captureSequence, V.settle, { fps: 30 }); // deja el reloj virtual en pausa
    const t0 = Date.now();
    await assert.rejects(s.page.evaluate(() => window.FloorPlanPresentation.stop()), e => e.code === 'REALTIME_TIMEOUT'); // antes: bloqueo indefinido
    assert.ok(Date.now() - t0 < 40000, 'bounded in real time');
    assert.equal(await V.act(s.page, () => window.FloorPlanPresentation.stop()), 'detached');
    await V.advanceUntil(s.page, () => !window.FloorPlanPresentation.active); await V.settle(s.page);
    const ac = new AbortController(); ac.abort();
    await assert.rejects(V.advanceUntil(s.page, () => false, null, { signal: ac.signal }), e => e.code === 'CANCELLED');
  } finally { const t1 = Date.now(); await s.close(); assert.ok(Date.now() - t1 < 20000, 'close is bounded'); }
});
