// First paint is never in the wrong language: the editor markup carries Chinese labels translated by script, so while
// the scripts load (delayed here on purpose) nothing may be visible; after loading, the page is visible and in Spanish.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');let server,url,browser;
before(async()=>{server=createServer(async(req,res)=>{try{const f=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://l').pathname));if(!f.startsWith(root+path.sep))throw Error('path');
 if(f.endsWith('project-schema.js'))await new Promise(r=>setTimeout(r,2000));
 res.setHeader('Content-Type',/\.m?js$/.test(f)?'text/javascript':f.endsWith('.css')?'text/css':f.endsWith('.webp')?'image/webp':'text/html');res.end(await fs.readFile(f));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox']});});
after(async()=>{await browser?.close();await new Promise(r=>server.close(r));});
const visibleCjk=page=>page.evaluate(()=>[...document.querySelectorAll('button,span,label,h1,h2,p,a')].filter(e=>/[一-鿿]/.test(e.textContent)&&e.getClientRects().length&&getComputedStyle(e).visibility==='visible').map(e=>e.textContent.trim()).slice(0,5));
test('while scripts load, no untranslated label is painted; then the page is visible in Spanish',{timeout:60000},async t=>{
 const page=await browser.newPage({viewport:{width:1440,height:900}});t.after(()=>page.close());
 await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
 await page.goto(url,{waitUntil:'commit'});await page.waitForSelector('[data-view="2d"]',{state:'attached'});
 assert.deepEqual(await visibleCjk(page),[],'nothing in Chinese is visible during load');
 await page.waitForFunction(()=>document.documentElement.classList.contains('lang-ready'),null,{timeout:30000});
 assert.equal(await page.evaluate(()=>getComputedStyle(document.body).visibility),'visible');
 assert.deepEqual(await visibleCjk(page),[],'nothing in Chinese once loaded');
});
