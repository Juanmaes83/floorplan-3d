// SCULPT-R02-A · baseline harness for the donor's own Playwright specs (tests/ceiling.spec.cjs, tests/furniture-placement.spec.cjs).
// It does NOT change any donor test. Installed as `@playwright/test` on NODE_PATH, it re-exports the real package and
// wraps `page`: three@0.160.0 is served from RUBIK's verified vendor copy (same version; hashes in vendor/three/manifest.json)
// instead of cdn.jsdelivr.net, and every other non-local request is aborted and logged to $BLOCKED_LOG.
const path=require('path'),fs=require('fs');
const real=require(process.env.PW_REAL);
const VENDOR=process.env.THREE_VENDOR;
const test=real.test.extend({page:async({page},use)=>{
  await page.route('**/*',async route=>{
    const u=route.request().url();
    const m=u.match(/^https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\/(build\/three\.module\.js|examples\/jsm\/[\w/.-]+\.js)$/);
    if(m){const f=path.join(VENDOR,m[1]);if(fs.existsSync(f))return route.fulfill({status:200,contentType:'text/javascript',body:fs.readFileSync(f)});}
    if(/^https?:\/\/127\.0\.0\.1(:\d+)?\//.test(u)||u.startsWith('data:')||u.startsWith('blob:'))return route.continue();
    fs.appendFileSync(process.env.BLOCKED_LOG,u+'\n');return route.abort();
  });
  await use(page);
}});
module.exports={...real,test};
