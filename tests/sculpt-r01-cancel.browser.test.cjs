// SCULPT-R01 · D2 real cancellation in the browser: RubikRecognitionRunner + recognition-worker.js on the lab page.
// Observable: the promise rejects 'cancelled' at once and no evidence arrives; the page keeps painting frames while the
// worker computes; a new run after cancel/timeout/failure gives evidence IDENTICAL to the main-thread analyse(); the
// caller's pixels are never detached. Synthetic plans only. Screenshots: R01_ARTIFACTS=<dir>.
'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { createServer } = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
let server, base;
before(async () => {
  const root = path.resolve(__dirname, '..');
  server = createServer(async (req, res) => { try { const f = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://l').pathname)); if (!f.startsWith(root)) throw 0; const b = await fs.readFile(f); res.writeHead(200, { 'content-type': { '.html': 'text/html', '.js': 'text/javascript' }[path.extname(f)] || 'application/octet-stream' }); res.end(b); } catch { res.writeHead(404); res.end(); } });
  await new Promise(r => server.listen(0, '127.0.0.1', r)); base = `http://127.0.0.1:${server.address().port}/labs/sculpt/r01-recognition/index.html`;
});
after(() => new Promise(r => server.close(r)));
async function setup(t, viewport = { width: 1280, height: 800 }) {
  const browser = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/chromium', args: ['--no-sandbox'] });
  t.after(() => browser.close());
  const page = await (await browser.newContext({ viewport })).newPage(); page.setDefaultTimeout(60000);
  const errors = [], external = []; page.on('pageerror', e => errors.push(e.message)); page.on('request', r => { if (!r.url().startsWith('http://127.0.0.1')) external.push(r.url()); });
  await page.goto(base); await page.waitForFunction(() => document.body.dataset.ready === '1');
  return { page, errors, external };
}

test('D2 cancel: rejects at once with code cancelled, no evidence ever arrives, the worker is gone', async t => {
  const { page, errors } = await setup(t);
  const r = await page.evaluate(async () => {
    const job = RubikRecognitionRunner.run(window.R01Big, {}, { workerUrl: 'recognition-worker.js' });
    let resolved = false; job.promise.then(() => { resolved = true; }, () => {});
    await new Promise(res => setTimeout(res, 150));
    const t0 = performance.now(), cancelled = job.cancel();
    const err = await job.promise.then(() => null, e => e.code);
    const ms = performance.now() - t0;
    await new Promise(res => setTimeout(res, 2500)); // longer than a full analysis: a late result would show up here
    return { cancelled, err, ms, resolved, again: job.cancel() };
  });
  assert.equal(r.cancelled, true); assert.equal(r.err, 'cancelled'); assert.ok(r.ms < 50, `${r.ms} ms`);
  assert.equal(r.resolved, false, 'no evidence after cancel'); assert.equal(r.again, false, 'cancel is idempotent');
  assert.deepEqual(errors, []);
});

test('D2 the page stays responsive while the worker computes (main-thread analyse blocks it)', async t => {
  const { page } = await setup(t);
  const r = await page.evaluate(async () => {
    // Longest gap between timer ticks while an analysis runs: worker vs main thread.
    const probe = async work => { let last = performance.now(), worst = 0, on = true; const tick = () => { const n = performance.now(); worst = Math.max(worst, n - last); last = n; if (on) setTimeout(tick, 10); }; setTimeout(tick, 10); await work(); worst = Math.max(worst, performance.now() - last); on = false; return Math.round(worst); };
    const worker = await probe(() => RubikRecognitionRunner.run(window.R01Big, {}, { workerUrl: 'recognition-worker.js' }).promise);
    const main = await probe(() => new Promise(res => setTimeout(() => { RubikRecognitionEvidence.analyse(window.R01Big); res(); }, 20)));
    return { worker, main };
  });
  assert.ok(r.worker < 120, `worker: longest pause ${r.worker} ms`);
  assert.ok(r.main > r.worker * 3, `main-thread run blocks the page (${r.main} ms vs ${r.worker} ms)`);
  console.log('# D2 longest page pause during analysis:', JSON.stringify(r));
});

test('D2 recovery: after cancel, timeout and a refused image, a new run gives evidence identical to the main thread', async t => {
  const { page } = await setup(t);
  const r = await page.evaluate(async () => {
    const R = RubikRecognitionRunner, E = RubikRecognitionEvidence, img = window.R01Big, before = img.data.byteLength;
    const a = R.run(img, {}, { workerUrl: 'recognition-worker.js' }); a.cancel(); const c1 = await a.promise.then(() => null, e => e.code);
    const timeout = await R.run(img, {}, { workerUrl: 'recognition-worker.js', timeoutMs: 30 }).promise.then(() => null, e => e.code);
    const tiny = { width: 8, height: 8, data: new Uint8ClampedArray(256).fill(255) };
    const refused = await R.run(tiny, {}, { workerUrl: 'recognition-worker.js' }).promise.then(() => null, e => e.code);
    const fromWorker = await R.run(img, {}, { workerUrl: 'recognition-worker.js' }).promise;
    const inline = E.analyse(img).evidence;
    return { c1, timeout, refused, same: JSON.stringify(fromWorker) === JSON.stringify(inline), walls: fromWorker.walls.length, detached: img.data.byteLength !== before, valid: E.validate(fromWorker, { image: img }) };
  });
  assert.equal(r.c1, 'cancelled'); assert.equal(r.timeout, 'timeout'); assert.equal(r.refused, 'image-size-out-of-range');
  assert.equal(r.same, true, 'worker evidence = main-thread evidence'); assert.ok(r.walls > 0);
  assert.equal(r.detached, false, "the caller's pixels are copied, never transferred away");
  assert.deepEqual(r.valid, [], 'the worker evidence validates against the same image (pixel hash included)');
});

test('D2 the lab buttons: analyse, cancel, analyse again; no errors, no external requests', async t => {
  const { page, errors, external } = await setup(t);
  await page.click('#runBtn'); await page.waitForTimeout(150); await page.click('#cancelBtn');
  await page.waitForFunction(() => /Cancelado/.test(document.querySelector('#runState').textContent));
  if (process.env.R01_ARTIFACTS) { await fs.mkdir(process.env.R01_ARTIFACTS, { recursive: true }); await page.locator('#cancelable').screenshot({ path: path.join(process.env.R01_ARTIFACTS, 'r01-cancelled.png') }); }
  await page.click('#runBtn');
  await page.waitForFunction(() => /^Hecho en/.test(document.querySelector('#runState').textContent), null, { timeout: 60000 });
  assert.match(await page.locator('#runState').innerText(), /muros, \d+ huecos, \d+ estancias \(sin revisar\)/);
  if (process.env.R01_ARTIFACTS) await page.locator('#cancelable').screenshot({ path: path.join(process.env.R01_ARTIFACTS, 'r01-done.png') });
  assert.deepEqual(errors, []); assert.deepEqual(external, []);
});
