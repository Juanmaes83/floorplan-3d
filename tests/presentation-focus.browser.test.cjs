// Keyboard focus stays in the presentation when the control that held it is disabled or rebuilt: «Siguiente» at the
// last view, «Anterior» at the first, and a stop button pressed from the keyboard (the stop row is rebuilt).
// Before the fix the focus fell to <body> and the next Tab started again from the top of the page.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const skip=!process.env.THREE_LOCAL_DIR&&'THREE_LOCAL_DIR not set: the presentation needs 3D';
let server,url;
before(async()=>{const root=path.resolve(__dirname,'..');server=createServer(async(req,res)=>{
 try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))throw Error('path');
  res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':'text/html');res.end(await fs.readFile(file));}
 catch{res.writeHead(404);res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;});
after(async()=>new Promise(r=>server.close(r)));

const focus=page=>page.evaluate(()=>{const a=document.activeElement;return {id:a.id||null,tag:a.tagName,text:(a.textContent||'').trim().slice(0,40),inOverlay:!!a.closest('#presentationOverlay'),status:document.querySelector('#presentationOverlay')?.textContent.match(/Vista \d+ de \d+/)?.[0]};});
const settled=page=>page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false',null,{timeout:60000});

for(const viewport of [{width:1440,height:900},{width:390,height:844}])test(`presentation keeps the keyboard focus at the ends and on the stops ${viewport.width}x${viewport.height}`,{timeout:300000,skip},async t=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox','--enable-unsafe-swiftshader']});t.after(()=>browser.close());
 const mobile=viewport.width<1000,page=await browser.newPage({viewport,isMobile:mobile,hasTouch:mobile}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://cdn.jsdelivr.net/**',async r=>{try{await r.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await require('./helpers/three-module.cjs')(r.request().url(),()=>Promise.reject(Error('no cdn')))});}catch{await r.abort();}});
 await page.goto(url);await page.waitForFunction(()=>window.FloorPlanPresentation&&window.View3D,null,{timeout:120000});await page.locator('#welcomeExample').click();
 await page.locator('#guideClose').click();await page.locator('#presentationBtn').click();
 await page.locator('.presentation-room-row').nth(1).locator('input').check();await page.getByRole('button',{name:'Iniciar presentación'}).click();await settled(page);
 // «Siguiente» from the keyboard, view after view, to the last one.
 const total=await page.evaluate(()=>FloorPlanPresentation.plan.stops.length);assert.ok(total>=2);
 const next=page.locator('#presentationOverlay button',{hasText:'Siguiente'});await next.focus();
 for(let i=1;i<total;i++){await page.keyboard.press('Enter');await settled(page);}
 const atEnd=await focus(page);
 assert.equal(atEnd.status,`Vista ${total} de ${total}`);assert.ok(atEnd.inOverlay,`focus left the presentation at the last view: ${JSON.stringify(atEnd)}`);assert.match(atEnd.text,/Anterior/);
 // «Anterior» from the keyboard back to the first view (the focus is on it after the last view).
 for(let i=1;i<total;i++){await page.keyboard.press('Enter');await settled(page);}const atStart=await focus(page);
 assert.equal(atStart.status,`Vista 1 de ${total}`);assert.ok(atStart.inOverlay,JSON.stringify(atStart));assert.match(atStart.text,/Siguiente/);
 // A stop button pressed from the keyboard: the row is rebuilt and the focus is on the active stop.
 const stop=page.locator('.presentation-stops button').nth(1);await stop.focus();await page.keyboard.press('Enter');await settled(page);const onStop=await focus(page);
 assert.equal(onStop.status,`Vista 2 de ${total}`);assert.ok(onStop.inOverlay,JSON.stringify(onStop));assert.equal(await page.evaluate(()=>document.activeElement.getAttribute('aria-current')),'step');
 const dir=process.env.FOCUS_ARTIFACTS;if(dir){await fs.mkdir(dir,{recursive:true});await page.screenshot({path:path.join(dir,`${viewport.width}x${viewport.height}-stop-focus.png`)});}
 assert.deepEqual(errors,[]);
});
