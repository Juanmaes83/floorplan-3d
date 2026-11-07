/* Time budgets for the browser suites, scaled for the machine that runs them.
   The CI runners have no GPU: Chromium draws the 3D view with SwiftShader on the CPU, where one 1440x900 frame of the
   presentation takes about 1.3 s and one 390x844 frame about 0.4 s (measured 2026-11-07, 4 CPU cores), so every wait
   that spans frames takes several times longer than on the machines these budgets were written on. Measured without
   limits on that hardware, every 1440x900 case passes all its assertions; only its time budget ran out.
   RENDER_TIME_SCALE (set by the CI workflow; 1 when unset, so local runs are unchanged) multiplies every time budget:
   test timeouts, explicit waits and Playwright's default wait. It never changes an assertion, a viewport, a step or
   the product. */
const scale = Math.max(1, Number(process.env.RENDER_TIME_SCALE) || 1);
const T = ms => Math.round(ms * scale);
T.scale = scale;
// Playwright's own default wait (30 s) for every context and page this browser opens.
T.launched = browser => {
 if (scale === 1) return browser;
 for (const name of ['newContext', 'newPage']) {
  const open = browser[name].bind(browser);
  browser[name] = async (...args) => { const opened = await open(...args); opened.setDefaultTimeout(T(30000)); return opened; };
 }
 return browser;
};
module.exports = T;
