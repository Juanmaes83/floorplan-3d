/* Project-First A1 visual audit of the real application: Deliver, Analyze, My studio and the real outputs, without and
   with a synthetic local brand profile. Usage: node project-first-a1-visual.cjs <before|after> [outDir]. CHROME=path. */
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'../../..'),phase=process.argv[2]||'after',out=path.resolve(process.argv[3]||path.join(root,'output/playwright/project-first-a1',phase));
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
(async()=>{await fs.mkdir(out,{recursive:true});
 const server=createServer(async(req,res)=>{try{const p=new URL(req.url,'http://l').pathname,f=path.resolve(root,'.'+(p==='/'?'/index.html':p));if(!f.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(await fs.readFile(f));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox','--enable-unsafe-swiftshader']}),report=[];
 try{for(const viewport of [{width:1440,height:900},{width:1280,height:800},{width:390,height:844},{width:844,height:390}]){
  const context=await browser.newContext({viewport,isMobile:viewport.width<1100,hasTouch:viewport.width<1100}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route(/cdn\.jsdelivr\.net|unpkg\.com/,r=>r.abort());
  const name=n=>path.join(out,`${viewport.width}x${viewport.height}-${n}.png`);
  const shot=async(n,full=false)=>{await page.waitForTimeout(250);if(!full)return page.screenshot({path:name(n)});
   // The workspace scrolls inside a fixed layer: capture that layer's whole content.
   const w=page.locator('#professionalWorkspace');await w.evaluate(n=>{n.dataset.capture=n.getAttribute('style')||'';n.style.bottom='auto';n.style.height=n.scrollHeight+'px';n.style.overflow='visible';});await w.screenshot({path:name(n)});await w.evaluate(n=>{n.setAttribute('style',n.dataset.capture);delete n.dataset.capture;});};
  await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.locator('#welcomeExample').click();await page.waitForFunction(()=>window.FloorPlanProfessionalUI);
  for(const brand of [false,true]){
   if(brand)await page.evaluate(()=>{const s=localStorage,p=FloorPlanBrand.saveProfile(s,{name:'Estudio Ejemplo',person:'Profesional de prueba',email:'estudio@example.com',phone:'+34 600 000 000',tagline:'Interiorismo residencial'});FloorPlanBrand.setDelivery(s,FloorPlanApp.entryId,{profileId:(p.profile||p).id});});
   const suffix=brand?'-brand':'';
   for(const area of ['deliver','analyze','studio']){await page.locator('#workArea-'+area).click();await page.locator('#professionalTitle').waitFor();await shot(area+suffix);await shot(area+suffix+'-full',true);}
  }
  await page.locator('#workArea-deliver').click();
  await page.locator('[data-route="surface-sheet"]').first().click();await page.locator('#surfaceSheetDialog[open]').waitFor();await shot('out-surface-sheet');await page.keyboard.press('Escape');
  await page.locator('[data-route="sheet"]').first().click();await page.locator('#sheetDialog[open]').waitFor();await shot('out-sheet');await page.keyboard.press('Escape');
  await page.locator('[data-route="presentation"]').first().click();await page.locator('#presentationConfig[open]').waitFor();await shot('out-presentation');await page.keyboard.press('Escape');
  report.push({viewport,errors,overflowX:await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1)});await context.close();}}
 finally{await browser.close();await new Promise(r=>server.close(r));await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));}
})().catch(e=>{console.error(e);process.exitCode=1;});
