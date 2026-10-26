// Close the sheet and reopen it before the dialog's queued «close» event runs, then download. argv: repoDir viewportW H
const path=require('node:path'),fs=require('node:fs/promises'),{createServer}=require('node:http'),{chromium}=require('playwright');
const [repo,W,H]=process.argv.slice(2),viewport={width:+W||390,height:+H||844};
(async()=>{
 const server=createServer(async(req,res)=>{try{const p=new URL(req.url,'http://x').pathname,file=path.resolve(repo,'.'+(p==='/'?'/index.html':p));res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':file.endsWith('.html')?'text/html':'application/octet-stream');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox']});
 const ctx=await browser.newContext({viewport,isMobile:viewport.width<1000,hasTouch:viewport.width<1000,acceptDownloads:true}),page=await ctx.newPage();
 await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
 await page.goto(`http://127.0.0.1:${server.address().port}/`);await require(path.join(repo,'tests/editor-fixture.cjs'))(page);
 const open=()=>page.evaluate(()=>{const d=document.getElementById('openSheet').closest('details');if(d)d.open=true;document.getElementById('openSheet').click();});
 const out={};
 for(const mode of ['separate-tasks','same-task']){
  await open();await page.locator('#sheetDialog[open]').waitFor();
  if(mode==='same-task')await page.evaluate(()=>{document.querySelector('#sheetClose').click();const d=document.getElementById('openSheet').closest('details');if(d)d.open=true;document.getElementById('openSheet').click();});
  else{await page.locator('#sheetClose').click();await page.waitForFunction(()=>!document.querySelector('#sheetDialog').open);await page.evaluate(()=>new Promise(r=>setTimeout(r,50)));await open();}
  await page.evaluate(()=>new Promise(r=>setTimeout(r,50)));
  const before=await page.evaluate(()=>({open:document.querySelector('#sheetDialog').open,src:!!document.querySelector('#sheetPreview').getAttribute('src')}));
  const dl=page.waitForEvent('download',{timeout:5000}).then(d=>d.suggestedFilename(),()=>null);
  await page.locator('#sheetDownload').click({timeout:5000}).catch(e=>null);
  const file=await dl;const after=await page.evaluate(()=>({open:document.querySelector('#sheetDialog').open,toast:document.querySelector('#toast').textContent}));
  out[mode]={before,download:file,after};
  if(after.open)await page.locator('#sheetClose').click();await page.evaluate(()=>new Promise(r=>setTimeout(r,100)));
 }
 console.log(JSON.stringify(out));await browser.close();server.close();
})();
