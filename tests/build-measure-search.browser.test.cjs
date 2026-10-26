// Cut A of «Construir y medir»: the editor's existing tools (Seleccionar, Medir, Dibujar muro) are found by name in
// «¿Qué quieres hacer?». Choosing one runs the palette's own entry, so the result is the same mode and state as the
// palette button: the toolbar and palette buttons show the active tool, measuring works on the plan, wall drawing shows
// its banner. Desktop and phone. Searches that worked before keep their results.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
let server,browser,url;
before(async()=>{server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))throw Error('path');res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':'text/html');res.end(await fs.readFile(file));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox']});});
after(async()=>{await browser?.close();await new Promise(r=>server.close(r));});

async function open(t,viewport){
 const mobile=viewport.width<1000,context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile});t.after(()=>context.close());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route(/cdn\.jsdelivr\.net|unpkg\.com/,r=>r.abort());
 await page.goto(url);await page.locator('#welcomeBlank').click();await page.locator('#roomDesignName').fill('Salón');await page.locator('#roomDesignReview').click();await page.locator('#roomDesignConfirm').click();await page.waitForTimeout(300);
 // The search, as a person opens it from the header.
 // Escape first clears the typed text, then closes: a new search starts from a closed dialog.
 const ask=async query=>{for(let i=0;i<2&&await page.locator('#actionDialog[open]').count();i++)await page.keyboard.press('Escape');await page.locator('#actionSearchBtn').click();await page.locator('#editorActionInput').fill(query);await page.waitForTimeout(150);
  return page.locator('#editorActionResults [role=option]').evaluateAll(o=>o.map(b=>b.querySelector('strong').textContent));};
 const choose=async title=>{await page.locator('#editorActionResults [role=option]',{hasText:title}).first().click();await page.waitForTimeout(300);};
 const tool=()=>page.evaluate(()=>({tool:ui.tool,toolbar:document.querySelector('#tools .btn.on')?.dataset.tool,svg:document.querySelector('svg#plan,svg')?.getAttribute('class'),wall:!!document.querySelector('#paletteWallBanner:not([hidden])')}));
 return {page,errors,ask,choose,tool,mobile};
}

for(const viewport of [{width:1440,height:900},{width:390,height:844}])test(`search finds and activates the existing build and measure tools ${viewport.width}x${viewport.height}`,{timeout:120000},async t=>{
 const {page,errors,ask,choose,tool}=await open(t,viewport);
 // «Medir» by name and by everyday words; it activates the editor's measure tool, and the tool measures.
 for(const q of ['medir','distancia','cota'])assert.deepEqual(await ask(q),['Medir una distancia'],q);
 await ask('medir');await choose('Medir una distancia');
 assert.deepEqual(await tool(),{...(await tool()),tool:'measure',toolbar:'measure',wall:false});
 const box=await page.locator('#gRooms').boundingBox();const a=[box.x+box.width*.3,box.y+box.height*.5],b=[box.x+box.width*.7,box.y+box.height*.5];
 await page.mouse.click(...a);await page.mouse.click(...b);await page.waitForTimeout(150);
 assert.ok(await page.locator('#gMeasure text').count()>0,'a measurement is drawn on the plan');
 // «Seleccionar» returns to the select tool.
 assert.deepEqual(await ask('seleccionar'),['Seleccionar y mover']);await choose('Seleccionar y mover');
 assert.equal((await tool()).tool,'select');assert.equal((await tool()).toolbar,'select');
 // «Dibujar muro» opens the palette's wall drawing (its banner), and is listed before «Modificar paredes».
 const draw=await ask('dibujar muro');assert.equal(draw[0],'Dibujar un muro nuevo');assert.ok(draw.includes('Modificar paredes o estancias'));
 await choose('Dibujar un muro nuevo');assert.equal((await tool()).wall,true,'wall drawing banner shown');
 await page.locator('#paletteWallBanner button',{hasText:'Terminar'}).click();await page.waitForTimeout(150);assert.equal((await tool()).wall,false);
 // Searches that worked before keep their results.
 assert.deepEqual(await ask('pared'),['Modificar paredes o estancias']);
 assert.deepEqual(await ask('poner una cama'),['Buscar cama']);
 assert.deepEqual(errors,[]);
});

// The palette buttons still activate the same tools (they share one entry with the search).
test('palette tool buttons still activate the tools 1440x900',{timeout:60000},async t=>{
 const {page,errors,tool}=await open(t,{width:1440,height:900});
 if(!(await page.locator('#paletteTool-measure').isVisible()))await page.locator('#tgLib').click();
 await page.locator('#paletteTabBuild').click();await page.locator('#paletteTool-measure').click();await page.waitForTimeout(150);
 assert.equal((await tool()).tool,'measure');assert.equal(await page.locator('#paletteTool-measure').getAttribute('aria-pressed'),'true');
 await page.locator('#paletteTool-select').click();assert.equal((await tool()).tool,'select');assert.deepEqual(errors,[]);
});
