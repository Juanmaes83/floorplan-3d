// On a phone the selection bar (#fab) must not cover the plan scale (seen at 390×844 with a room selected).
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');let server,url,browser;
before(async()=>{server=createServer(async(req,res)=>{try{const f=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://l').pathname));if(!f.startsWith(root+path.sep))throw Error('path');
 res.setHeader('Content-Type',/\.m?js$/.test(f)?'text/javascript':f.endsWith('.css')?'text/css':f.endsWith('.webp')?'image/webp':'text/html');res.end(await fs.readFile(f));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox']});});
after(async()=>{await browser?.close();await new Promise(r=>server.close(r));});
for(const viewport of [{width:390,height:844},{width:844,height:390},{width:1440,height:900}])test(`selection bar and plan scale do not overlap ${viewport.width}x${viewport.height}`,{timeout:60000},async t=>{
 const ctx=await browser.newContext({viewport,isMobile:viewport.width<1000,hasTouch:viewport.width<1000});t.after(()=>ctx.close());const page=await ctx.newPage();
 await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());await page.goto(url);await page.waitForFunction(()=>window.FloorPlanApp);await page.locator('#welcomeExample').click();
 await page.evaluate(()=>select({kind:'room',id:FloorPlanApp.geometry.rooms[0].id}));await page.waitForFunction(()=>document.querySelector('#fab').classList.contains('show'));await page.waitForTimeout(400);
 const r=await page.evaluate(()=>{const a=document.querySelector('#fab').getBoundingClientRect(),c=document.querySelector('.scalebar').getBoundingClientRect();return {overlap:a.left<c.right&&c.left<a.right&&a.top<c.bottom&&c.top<a.bottom,scaleVisible:c.top>=0&&c.bottom<=innerHeight};});
 assert.deepEqual(r,{overlap:false,scaleVisible:true});
});
