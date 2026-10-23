// Same step as tests/brand.browser.test.cjs:64 — Playwright click on #sheetClose, then openMenuItem('openSheet') via
// evaluate — repeated N times; records whether the dialog's «close» event ran before or after the reopen.
const path=require('node:path'),fs=require('node:fs/promises'),{createServer}=require('node:http'),{chromium}=require('playwright');
const [repo,W,H,N]=process.argv.slice(2),viewport={width:+W,height:+H};
(async()=>{const server=createServer(async(req,res)=>{try{const p=new URL(req.url,'http://x').pathname,file=path.resolve(repo,'.'+(p==='/'?'/index.html':p));res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':'text/html');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const b=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox']});
const ctx=await b.newContext({viewport,isMobile:viewport.width<1000,hasTouch:viewport.width<1000,acceptDownloads:true}),page=await ctx.newPage();
await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());await page.goto(`http://127.0.0.1:${server.address().port}/`);await require(path.join(repo,'tests/editor-fixture.cjs'))(page);
await page.evaluate(()=>{window.__ev=[];const d=document.querySelector('#sheetDialog');d.addEventListener('close',()=>window.__ev.push('close'));document.getElementById('openSheet').addEventListener('click',()=>window.__ev.push('reopen'));});
const openMenuItem=async id=>{await page.evaluate(id=>{const d=document.getElementById(id).closest('details');if(d)d.open=true;document.getElementById(id).click();},id);};
const tally={closeFirst:0,reopenFirst:0,downloads:0,missing:0};
await openMenuItem('openSheet');await page.locator('#sheetDialog[open]').waitFor();
for(let i=0;i<+N;i++){await page.evaluate(()=>window.__ev=[]);
 await page.locator('#sheetClose').click();await openMenuItem('openSheet');await page.locator('#sheetDialog[open]').waitFor();await page.evaluate(()=>new Promise(r=>setTimeout(r,30)));
 const ev=await page.evaluate(()=>window.__ev.join(','));if(ev.startsWith('close'))tally.closeFirst++;else tally.reopenFirst++;
 const dl=page.waitForEvent('download',{timeout:4000}).then(()=>1,()=>0);await page.locator('#sheetDownload').click({timeout:4000}).catch(()=>{});const got=await dl;got?tally.downloads++:tally.missing++;
 if(!got){await openMenuItem('openSheet');await page.locator('#sheetDialog[open]').waitFor();}}
console.log(JSON.stringify({repo:path.basename(repo),viewport,N:+N,...tally}));await b.close();server.close();})();
