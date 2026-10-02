// Test-only instrumentation. Never loaded by the application.
// Preserve already approved screenshots and collect actual browser diagnostics.
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');
const out = process.env.F3_RECONCILE_QA;
if (!out) throw Error('F3_RECONCILE_QA is required');
fs.mkdirSync(out, {recursive:true});
const root = path.resolve(__dirname, '../..');
const artifactRoot = path.join(root, 'docs/qa/artifacts');
const redirected = name => {
  if (typeof name !== 'string') return name;
  const absolute = path.resolve(name);
  if (!absolute.startsWith(artifactRoot+path.sep) || absolute.startsWith(path.resolve(out)+path.sep)) return name;
  const dest = path.join(out, 'artifacts', path.relative(artifactRoot, absolute));
  fs.mkdirSync(path.dirname(dest), {recursive:true});
  return dest;
};
const write = fs.writeFileSync.bind(fs);
fs.writeFileSync = (name, ...args) => write(redirected(name), ...args);
const writeAsync = fs.promises.writeFile.bind(fs.promises);
fs.promises.writeFile = (name, ...args) => writeAsync(redirected(name), ...args);
const launch = chromium.launch.bind(chromium);
let pageNumber = 0;
chromium.launch = async (...args) => {
  const browser = await launch(...args);
  const contextFactory = browser.newContext.bind(browser);
  browser.newContext = async (...options) => {
    const context = await contextFactory(...options);
    context.on('page', page => {
      const id = ++pageNumber;
      const record = value => fs.appendFileSync(path.join(out, 'browser-events.jsonl'), JSON.stringify({pid:process.pid,page:id,...value})+'\n');
      page.on('console', m => record({event:'console',type:m.type(),text:m.text()}));
      page.on('pageerror', e => record({event:'pageerror',text:e.message}));
      page.on('requestfailed', r => record({event:'requestfailed',url:r.url(),reason:r.failure()?.errorText}));
      page.on('response', r => {if(r.url().endsWith('.glb'))record({event:'glb-response',url:r.url(),status:r.status()});});
      const waitForFunction = page.waitForFunction.bind(page);
      page.waitForFunction = async (...params) => {
        try { return await waitForFunction(...params); }
        catch (error) {
          const diagnostic = await page.evaluate(() => ({toast:document.querySelector('#toast')?.textContent,image:document.querySelector('#traceImageFile')?.files?.[0]?.name,sourceCount:window.FloorPlanApp?.project?.sourceImages?.length,sourceDom:!!document.querySelector('#gSource image')})).catch(() => null);
          record({event:'wait-failure',diagnostic,error:error.message});
          throw error;
        }
      };
      const screenshot = page.screenshot.bind(page);
      page.screenshot = async options => {
        if (!options?.path) return screenshot(options);
        const absolute = path.resolve(options.path);
        const relative = absolute.startsWith(artifactRoot+path.sep) ? path.relative(artifactRoot, absolute) : path.basename(absolute);
        const dest = path.join(out, 'screenshots', relative);
        fs.mkdirSync(path.dirname(dest), {recursive:true});
        return screenshot({...options,path:dest});
      };
    });
    return context;
  };
  return browser;
};
