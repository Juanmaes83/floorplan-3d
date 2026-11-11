/* SCULPT-R03 baseline harness (RUBIK-authored, not donor code). Preloaded with `node -r` before the donor's UNCHANGED
 * tests/browser-smoke.cjs. It does not alter any assertion: it only wraps chromium.launch so that every page context
 * aborts requests leaving 127.0.0.1 / localhost / data: / blob: and appends their URL to $BLOCKED_LOG (one per line).
 * An empty log after the run proves the donor page loaded nothing from the network. */
'use strict';
const fs = require('fs');
const pw = require('playwright');
const log = process.env.BLOCKED_LOG || '';
const local = u => /^(data:|blob:|about:)/.test(u) || /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(u);
const launch = pw.chromium.launch.bind(pw.chromium);
pw.chromium.launch = async (...args) => {
  const browser = await launch(...args);
  const guard = async ctx => ctx.route(u => !local(String(u)), r => { if (log) fs.appendFileSync(log, r.request().url() + '\n'); return r.abort(); });
  const newContext = browser.newContext.bind(browser);
  browser.newContext = async (...a) => { const ctx = await newContext(...a); await guard(ctx); return ctx; };
  browser.newPage = async (...a) => { const ctx = await browser.newContext(...a); const page = await ctx.newPage(); page.close = (c => async (...x) => { await c(...x); await ctx.close(); })(page.close.bind(page)); return page; };
  return browser;
};
