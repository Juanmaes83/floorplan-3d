#!/usr/bin/env node
/* SCULPT-R03 · browser QA of the lab page (RUBIK-authored). Serves the repository read-only on 127.0.0.1, opens
 * labs/sculpt/r03-cabinets/ in Chromium at 1440×900, 1280×800, 390×844 and 844×390, and fails on: console errors,
 * page errors, any request leaving 127.0.0.1, horizontal page scroll, evidence differing from Node, broken parity,
 * a blank 3D canvas, or an edit that mutates state when it is refused.
 *   node lab-browser-qa.cjs [--shots DIR]   (DIR must be outside nothing in particular; PNGs are written there)
 * Requires the preinstalled `playwright` package; installs nothing. */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const LAB = path.join(ROOT, 'labs', 'sculpt', 'r03-cabinets');
const X = require(path.join(LAB, 'cabinet-compare-core.js'));
const { SCENARIOS } = require(path.join(LAB, 'fixtures', 'cabinet-scenarios.js'));
const shotsAt = process.argv.indexOf('--shots'), SHOTS = shotsAt > 0 ? path.resolve(process.argv[shotsAt + 1]) : null;
const VIEWPORTS = [[1440, 900], [1280, 800], [390, 844], [844, 390]];
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.cjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png' };
const results = [], fail = m => { results.push('FAIL ' + m); }, pass = m => results.push('ok   ' + m);

function serve() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname), file = path.join(ROOT, rel.endsWith('/') ? rel + 'index.html' : rel);
      if (!file.startsWith(ROOT + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' }); fs.createReadStream(file).pipe(res);
    }).listen(0, '127.0.0.1', () => resolve(srv));
  });
}
const local = u => /^(data:|blob:|about:)/.test(u) || /^https?:\/\/127\.0\.0\.1(:\d+)?\//.test(u);
// evidence from the page must equal the evidence computed in Node (same modules, same inputs)
const nodeEvidence = id => X.compare(SCENARIOS[id]).evidenceObject;

(async () => {
  const srv = await serve(), base = `http://127.0.0.1:${srv.address().port}/labs/sculpt/r03-cabinets/`;
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const external = [];
  try {
    for (const [w, h] of VIEWPORTS) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: SHOTS ? 2 : 1 });
      await ctx.route(u => !local(String(u)), r => { external.push(r.request().url()); return r.abort(); });
      const page = await ctx.newPage(), errors = [];
      page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('pageerror', e => errors.push(e.message));
      page.on('response', r => { if (r.status() >= 400) errors.push(r.status() + ' ' + r.url()); });
      for (const id of Object.keys(SCENARIOS)) {
        await page.goto(base + '?s=' + id, { waitUntil: 'load' });
        await page.waitForFunction(i => window.__r03 && window.__r03.ready && window.__r03.id === i, id);
        const st = await page.evaluate(() => ({ r: window.__r03, scroll: document.scrollingElement.scrollWidth - window.innerWidth }));
        if (st.scroll > 0) fail(`${w}×${h} ${id}: horizontal scroll ${st.scroll}px`);
        if (id === 'not-a-cabinet') { if (st.r.error !== 'not-a-cabinet') fail(`${id}: expected refusal`); continue; }
        if (JSON.stringify(st.r.evidence) !== JSON.stringify(nodeEvidence(id))) fail(`${w}×${h} ${id}: evidence differs from Node`);
        if (!Object.values(st.r.compare.parity).every(Boolean)) fail(`${w}×${h} ${id}: parity ${JSON.stringify(st.r.compare.parity)}`);
      }
      // 3D canvas is not blank, and interactions on the swing scenario
      await page.goto(base + '?s=nightstand-in-swing', { waitUntil: 'load' }); await page.waitForFunction(() => window.__r03?.ready);
      const colours = await page.evaluate(() => { const c = document.querySelector('#view3d'), t = document.createElement('canvas'); t.width = 64; t.height = 46; const g = t.getContext('2d'); g.drawImage(c, 0, 0, 64, 46); const d = g.getImageData(0, 0, 64, 46).data, s = new Set(); for (let i = 0; i < d.length; i += 4) s.add(d[i] >> 3 << 10 | d[i + 1] >> 3 << 5 | d[i + 2] >> 3); return s.size; });
      if (colours < 12) fail(`${w}×${h}: 3D canvas looks blank (${colours} colours)`);
      if (w === 1440) {
        await page.selectOption('#front', 'open'); await page.waitForFunction(() => window.__r03.evidence.computed.frontState === 'open');
        if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'r03-swing-open-1440.png'), fullPage: true });
        const n0 = await page.evaluate(() => window.__r03.evidence.computed.bays.length);
        await page.click('#split'); await page.waitForFunction(n => window.__r03.evidence.computed.bays.length === n + 1, n0);
        await page.click('#merge'); await page.waitForFunction(n => window.__r03.evidence.computed.bays.length === n, n0);
        const before = await page.evaluate(() => JSON.stringify(window.__r03.evidence.cabinet.spec)), edits = await page.evaluate(() => window.__r03.edits);
        await page.fill('#shelves', '1000, 1010'); await page.click('#apply');
        const after = await page.evaluate(() => ({ spec: JSON.stringify(window.__r03.evidence.cabinet.spec), edits: window.__r03.edits, err: document.querySelector('#err').textContent }));
        if (after.spec !== before || after.edits !== edits || !/60 mm/.test(after.err)) fail('refused edit must leave the cabinet untouched and show the reason'); else pass('refused edit leaves state untouched and explains why');
        await page.fill('#shelves', '400, 900, 1500'); await page.fill('#rod', '0'); await page.fill('#drawers', '0'); await page.click('#apply');
        const ok = await page.evaluate(() => window.__r03.evidence.computed.bays[0].shelves.join(','));
        if (ok !== '400,900,1500') fail('valid edit not applied: ' + ok); else pass('valid edit applied through the pure engine');
      }
      if (SHOTS) for (const id of ['bedroom-default', 'nightstand-in-swing', 'narrow-corridor', 'low-ceiling', 'invalid-shelves', 'rotated-east-wall']) {
        if (w !== 1440 && !['nightstand-in-swing', 'bedroom-default'].includes(id)) continue;
        await page.goto(base + '?s=' + id, { waitUntil: 'load' }); await page.waitForFunction(i => window.__r03?.ready && window.__r03.id === i, id);
        await page.screenshot({ path: path.join(SHOTS, `r03-${id}-${w}x${h}.png`), fullPage: true });
      }
      if (errors.length) fail(`${w}×${h}: console/page errors: ${errors.slice(0, 3).join(' | ')}`); else pass(`${w}×${h}: ${Object.keys(SCENARIOS).length} scenarios, no console errors, no horizontal scroll, evidence = Node, parity, 3D drawn (${colours} colours)`);
      await ctx.close();
    }
    if (external.length) fail('external requests: ' + [...new Set(external)].join(', ')); else pass('no request left 127.0.0.1');
  } finally { await browser.close(); srv.close(); }
  console.log(results.join('\n'));
  process.exit(results.some(r => r.startsWith('FAIL')) ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
