#!/usr/bin/env node
/* SCULPT-R03 · browser QA of the lab page (RUBIK-authored). Serves the repository read-only on 127.0.0.1, opens
 * labs/sculpt/r03-cabinets/ in Chromium at 1440×900, 1280×800, 390×844 and 844×390, and fails on: console errors,
 * page errors, any request leaving 127.0.0.1, horizontal page scroll, evidence differing from Node, broken parity,
 * a blank 3D canvas, door states that do not change the 3D pixels, an edit that changes state when it is refused, a
 * refused edit without a readable reason, a reset that does not restore the scenario, missing focus outline, or a
 * comparator whose columns are not reachable by internal scroll.
 *   node lab-browser-qa.cjs [--shots DIR] [--report FILE]
 * Requires the preinstalled `playwright` package; installs nothing. */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const LAB = path.join(ROOT, 'labs', 'sculpt', 'r03-cabinets');
const X = require(path.join(LAB, 'cabinet-compare-core.js'));
const { SCENARIOS } = require(path.join(LAB, 'fixtures', 'cabinet-scenarios.js'));
const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? path.resolve(process.argv[i + 1]) : null; };
const SHOTS = arg('--shots'), REPORT = arg('--report');
const VIEWPORTS = [[1440, 900], [1280, 800], [390, 844], [844, 390]];
const PRIORITY = ['bedroom-default', 'nightstand-in-swing', 'narrow-corridor', 'low-ceiling', 'invalid-shelves', 'rotated-east-wall'];
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.cjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png' };
const results = [], report = [], fail = m => results.push('FAIL ' + m), pass = m => results.push('ok   ' + m);

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
const nodeEvidence = id => X.compare(SCENARIOS[id]).evidenceObject;
// 3D canvas fingerprint: 96×64 downsample, used to prove that door states change the picture.
const fingerprint = page => page.evaluate(() => { const c = document.querySelector('#view3d'), t = document.createElement('canvas'); t.width = 96; t.height = 64; const g = t.getContext('2d'); g.drawImage(c, 0, 0, 96, 64); return Array.from(g.getImageData(0, 0, 96, 64).data); });
const diff = (a, b) => { let n = 0; for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 30) n++; return n / (a.length / 4); };
const colours = fp => { const s = new Set(); for (let i = 0; i < fp.length; i += 4) s.add(fp[i] >> 3 << 10 | fp[i + 1] >> 3 << 5 | fp[i + 2] >> 3); return s.size; };
const state = page => page.evaluate(() => ({ spec: JSON.stringify(window.__r03.evidence.cabinet.spec), edits: window.__r03.edits, err: document.querySelector('#err').textContent, project: JSON.stringify(window.RubikR03Scenarios.SCENARIOS[window.__r03.id].project) }));
const open = async (page, base, id) => { await page.goto(base + '?s=' + id, { waitUntil: 'load' }); await page.waitForFunction(i => window.__r03 && window.__r03.ready && window.__r03.id === i, id); };

(async () => {
  const srv = await serve(), base = `http://127.0.0.1:${srv.address().port}/labs/sculpt/r03-cabinets/`;
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const external = [];
  try {
    for (const [w, h] of VIEWPORTS) {
      const tag = `${w}×${h}`, ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: SHOTS && w === 1440 ? 2 : 1 });
      await ctx.route(u => !local(String(u)), r => { external.push(r.request().url()); return r.abort(); });
      const page = await ctx.newPage(), errors = [];
      page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('pageerror', e => errors.push(e.message));
      page.on('response', r => { if (r.status() >= 400) errors.push(r.status() + ' ' + r.url()); });
      // 1 · every scenario: evidence = Node, parity, invariants, no page scroll
      for (const id of Object.keys(SCENARIOS)) {
        await open(page, base, id);
        const st = await page.evaluate(() => ({ r: window.__r03, scroll: document.scrollingElement.scrollWidth - window.innerWidth, valid: window.__r03.evidence ? window.RubikCabinetEvidence.validate(window.__r03.evidence) : null }));
        if (st.scroll > 0) fail(`${tag} ${id}: horizontal scroll ${st.scroll}px`);
        if (id === 'not-a-cabinet') { if (st.r.error !== 'not-a-cabinet') fail(`${id}: expected refusal`); continue; }
        if (JSON.stringify(st.r.evidence) !== JSON.stringify(nodeEvidence(id))) fail(`${tag} ${id}: evidence differs from Node`);
        if (!Object.values(st.r.compare.parity).every(Boolean)) fail(`${tag} ${id}: parity ${JSON.stringify(st.r.compare.parity)}`);
        if (st.valid.length) fail(`${tag} ${id}: evidence invariants ${st.valid}`);
        const note = await page.$eval('#note3d', el => el.textContent);
        if (st.r.evidence.computed ? !/^Puertas /.test(note) : !/^Sin modelo 3D/.test(note)) fail(`${tag} ${id}: 3D status caption "${note}"`);
      }
      // 2 · door states change the 3D picture; the project never changes
      await open(page, base, 'bedroom-default');
      const before = await state(page), shots = {};
      for (const s of ['closed', 'hidden', 'open']) {
        await page.selectOption('#front', s); await page.waitForFunction(v => window.__r03.evidence.computed.frontState === v, s);
        await page.waitForTimeout(50); shots[s] = await fingerprint(page);
        if (SHOTS && (w === 1440 || w === 390)) await page.locator('#view3d').screenshot({ path: path.join(SHOTS, `r03-doors-${s}-${w}x${h}.png`) });
        if (await page.$eval('#front', el => el.value) !== s) fail(`${tag}: front control does not show ${s}`);
      }
      const dCH = diff(shots.closed, shots.hidden), dCO = diff(shots.closed, shots.open), dHO = diff(shots.hidden, shots.open), cc = colours(shots.closed);
      report.push({ viewport: tag, doorStatePixelChange: { closedVsHidden: +dCH.toFixed(3), closedVsOpen: +dCO.toFixed(3), hiddenVsOpen: +dHO.toFixed(3) }, colours: cc });
      if (cc < 12) fail(`${tag}: 3D canvas looks blank (${cc} colours)`);
      if (Math.min(dCH, dCO, dHO) < 0.01) fail(`${tag}: door states do not change the 3D picture enough (${dCH.toFixed(3)} / ${dCO.toFixed(3)} / ${dHO.toFixed(3)})`);
      if ((await state(page)).project !== before.project) fail(`${tag}: door state changed the project`);
      // 3 · interactions (all viewports): module, shelves, rod, drawers, split, merge, invalid edits, reset, scenario change
      await open(page, base, 'bedroom-default');
      const initial = await state(page);
      await page.selectOption('#bay', '1'); await page.waitForFunction(() => document.querySelector('#bay').value === '1');
      const elevSel = await page.$eval('#elev', el => [...el.querySelectorAll('[data-role="bay"]')].findIndex(r => r.getAttribute('stroke-width') === '8'));
      if (elevSel !== 1) fail(`${tag}: elevation does not highlight the selected module`);
      for (const [label, fill, check] of [['shelves', { shelves: '400, 900, 1500', rod: '0', drawers: '0' }, b => b.shelves.join() === '400,900,1500' && b.rodMm === null && b.drawers === 0],
        ['rod', { shelves: '1702', rod: '1500', drawers: '0' }, b => b.rodMm === 1500], ['drawers', { shelves: '1702', rod: '1500', drawers: '2' }, b => b.drawers === 2]]) {
        await page.fill('#shelves', fill.shelves); await page.fill('#rod', fill.rod); await page.fill('#drawers', fill.drawers); await page.click('#apply');
        const b = await page.evaluate(() => window.__r03.evidence.computed && window.__r03.evidence.computed.bays[1]);
        if (!b || !check(b)) fail(`${tag}: valid ${label} edit not applied: ${JSON.stringify(b)}`);
      }
      const n0 = await page.evaluate(() => window.__r03.evidence.computed.bays.length);
      await page.click('#split'); await page.waitForFunction(n => window.__r03.evidence.computed.bays.length === n + 1, n0);
      await page.click('#merge'); await page.waitForFunction(n => window.__r03.evidence.computed.bays.length === n, n0);
      for (const [label, fill] of [['overlapping shelves', { shelves: '1000, 1010', rod: '0', drawers: '0' }], ['rod as text', { shelves: '1702', rod: 'abc', drawers: '0' }], ['fractional drawers', { shelves: '1702', rod: '0', drawers: '1.5' }], ['empty drawers', { shelves: '1702', rod: '0', drawers: '' }]]) {
        const s0 = await state(page);
        await page.fill('#shelves', fill.shelves); await page.fill('#rod', fill.rod); await page.fill('#drawers', fill.drawers); await page.click('#apply');
        const s1 = await state(page);
        if (s1.spec !== s0.spec || s1.edits !== s0.edits || s1.project !== s0.project) fail(`${tag}: refused edit (${label}) changed the state`);
        if (!/^No se ha aplicado: .+\. El armario no ha cambiado\.$/.test(s1.err) || /[一-鿿]/.test(s1.err)) fail(`${tag}: refused edit (${label}) without a readable Spanish reason: ${s1.err}`);
      }
      await page.click('#reset'); await page.waitForFunction(() => window.__r03.edits === 0);
      const reset = await state(page);
      if (reset.spec !== initial.spec || reset.err !== '') fail(`${tag}: reset does not restore the scenario`);
      await page.selectOption('#sc', 'narrow-corridor'); await page.waitForFunction(() => window.__r03.id === 'narrow-corridor');
      const term = await page.$eval('#summary', el => el.textContent);
      if (!/1 módulo · 0 divisores interiores · 2 puertas/.test(term)) fail(`${tag}: terminology (modules / dividers / doors): ${term.slice(0, 200)}`);
      // 4 · focus outline and comparator reachable through internal scroll
      await page.focus('#sc'); await page.keyboard.press('Tab'); // keyboard focus moves to the next control: it must show an outline
      const fv = await page.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return { tag: a.tagName, outline: cs.outlineStyle, width: cs.outlineWidth }; });
      if (fv.outline === 'none' || fv.width === '0px') fail(`${tag}: no visible focus outline on ${fv.tag}`);
      const cmp = await page.evaluate(() => { const wrap = document.querySelector('.tablewrap'), t = document.querySelector('#cmp'); return { overflow: getComputedStyle(wrap).overflowX, table: t.scrollWidth, wrap: wrap.clientWidth, heads: [...t.querySelectorAll('thead th')].map(x => x.textContent) }; });
      if (cmp.heads.length !== 5 || (cmp.table > cmp.wrap && cmp.overflow !== 'auto')) fail(`${tag}: comparator columns not reachable ${JSON.stringify(cmp)}`);
      report.push({ viewport: tag, comparator: { tableWidth: cmp.table, wrapperWidth: cmp.wrap, internalScroll: cmp.table > cmp.wrap }, focus: fv });
      // 5 · screenshots
      if (SHOTS) for (const id of (w === 1440 ? PRIORITY : ['nightstand-in-swing', 'invalid-shelves'])) {
        await open(page, base, id); await page.screenshot({ path: path.join(SHOTS, `r03-${id}-${w}x${h}.png`), fullPage: true });
      }
      if (errors.length) fail(`${tag}: console/page errors: ${errors.slice(0, 3).join(' | ')}`);
      else pass(`${tag}: ${Object.keys(SCENARIOS).length} scenarios (evidence = Node, parity, invariants), door states change the 3D, interactions, refused edits untouched, reset, focus, comparator, no console errors, no page scroll`);
      await ctx.close();
    }
    if (external.length) fail('external requests: ' + [...new Set(external)].join(', ')); else pass('no request left 127.0.0.1');
  } finally { await browser.close(); srv.close(); }
  console.log(results.join('\n'));
  if (REPORT) fs.writeFileSync(REPORT, JSON.stringify({ results, report }, null, 1));
  process.exit(results.some(r => r.startsWith('FAIL')) ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
