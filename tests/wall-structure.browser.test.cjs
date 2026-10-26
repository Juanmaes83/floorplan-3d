// Declared wall type from the normal editor flow, on the example project: with «Seleccionar», tap a wall; its panel
// (on a phone, «Propiedades» in the selection bar) shows «Tipo declarado del muro». The professional declares
// partition, load-bearing, other and back to unspecified; changes only the origin; everything survives a reload.
// «Modificar muros» still removes and restores walls. A declared load-bearing wall has its own colour and can be
// removed with a notice; the template's black walls keep the historical rule. Desktop 1440×900 and phone 390×844.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
let server,browser,url;
before(async()=>{server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))throw Error('path');res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':'text/html');res.end(await fs.readFile(file));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox']});});
after(async()=>{await browser?.close();await new Promise(r=>server.close(r));});

for(const viewport of [{width:1440,height:900},{width:390,height:844}])test(`declared wall type from the normal editor, example project ${viewport.width}x${viewport.height}`,{timeout:180000},async t=>{
 const mobile=viewport.width<1000,context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile});t.after(()=>context.close());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route(/cdn\.jsdelivr\.net|unpkg\.com/,r=>r.abort());
 await page.goto(url);await page.locator('#welcomeExample').click();await page.waitForTimeout(500);
 if(await page.locator('#guideClose').isVisible())await page.locator('#guideClose').click();
 const press=async s=>{const l=page.locator(s).first();if(mobile)await l.tap();else await l.click();};
 const wall=id=>page.evaluate(id=>{const p=FloorPlanApp.project,w=p.walls.find(w=>w.id===id);return {structure:w.structure,source:w.structureSource??null,status:w.status,version:p.schemaVersion,fill:document.querySelector(`[data-wall="${id}"]`)?.getAttribute('fill')};},id);
 // Two existing walls of the example: a grey one without a load-bearing label, and a black template load-bearing one.
 const pick=await page.evaluate(()=>{const p=FloorPlanApp.project,len=w=>Math.hypot(w.end.x-w.start.x,w.end.y-w.start.y),ok=w=>w.status!=='demolished'&&!p.openings.some(o=>o.wallId===w.id);
  const grey=p.walls.filter(w=>ok(w)&&!['load-bearing','exterior'].includes(w.structure)).sort((a,b)=>len(b)-len(a))[0],black=p.walls.filter(w=>ok(w)&&w.structure==='load-bearing'&&!w.structureSource).sort((a,b)=>len(b)-len(a))[0];return {grey:grey.id,black:black.id};});
 const toastText=()=>page.locator('#toast').textContent();
 const tapWall=async id=>{const b=await page.locator(`[data-wall="${id}"]`).boundingBox();if(mobile)await page.touchscreen.tap(b.x+b.width/2,b.y+b.height/2);else await page.mouse.click(b.x+b.width/2,b.y+b.height/2);await page.waitForTimeout(300);};
 const tool=async name=>{await page.evaluate(n=>window.FloorPlanBuildPalette.useTool(n),name);await page.waitForTimeout(200);};
 const openPanel=async id=>{await tool('select');await tapWall(id);if(mobile){await press('#fab [data-a=prop]');await page.waitForTimeout(300);}await page.locator('#wallStructure').waitFor();};
 const before=await wall(pick.grey);
 // 1–3: select the wall from the normal editor and see the block.
 await openPanel(pick.grey);
 const shown=await page.evaluate(()=>({title:document.querySelector('#panel .panel-head h3, #panel h3')?.textContent,options:[...document.querySelector('#wallStructureType').options].map(o=>o.textContent),origin:document.querySelector('#wallStructureSource').selectedOptions[0].textContent,sources:[...document.querySelector('#wallStructureSource').options].map(o=>o.textContent),note:document.querySelector('#wallStructureNote').textContent,visible:!!document.querySelector('#wallStructure').offsetParent}));
 assert.equal(shown.visible,true);assert.deepEqual(shown.options.slice(0,4),['Sin especificar','Tabique','Muro portante','Otro']);
 assert.deepEqual(shown.sources,['No registrada','Declarado por profesional','Importado','Pendiente de revisar']);assert.equal(shown.origin,'No registrada');
 assert.equal(shown.note,'Dato declarado y orientativo para el proyecto. No es una verificación ni un cálculo estructural.');
 // 4–7: partition, load-bearing, other, back to unspecified, each a professional's declaration.
 for(const value of ['partition','load-bearing','other','unknown']){await page.locator('#wallStructureType').selectOption(value);await page.waitForTimeout(250);
  const w=await wall(pick.grey);assert.equal(w.structure,value);assert.equal(w.source,'professional');assert.equal(w.version,'1.5.0');assert.equal(w.status,before.status);}
 // 8: only the origin changes, the type is kept.
 await page.locator('#wallStructureType').selectOption('partition');await page.waitForTimeout(250);await page.locator('#wallStructureSource').selectOption('pending-review');await page.waitForTimeout(250);
 assert.deepEqual(await wall(pick.grey),{...(await wall(pick.grey)),structure:'partition',source:'pending-review'});
 // 9: reload; the example keeps the declaration and the panel shows it.
 await page.reload();await page.waitForTimeout(800);if(await page.locator('#guideClose').isVisible())await page.locator('#guideClose').click();
 const kept=await wall(pick.grey);assert.equal(kept.structure,'partition');assert.equal(kept.source,'pending-review');
 await openPanel(pick.grey);assert.equal(await page.locator('#wallStructureType').inputValue(),'partition');assert.equal(await page.locator('#wallStructureSource').inputValue(),'pending-review');
 if(mobile&&await page.locator('aside.open').count())await page.evaluate(()=>closeDrawers());
 // 11: «Modificar muros» still removes and restores a grey wall.
 await tool('demolish');await tapWall(pick.grey);assert.equal((await wall(pick.grey)).status,'demolished');
 await tapWall(pick.grey);assert.notEqual((await wall(pick.grey)).status,'demolished');
 // 12: the template's black load-bearing wall keeps the historical rule: black, not removable, message says so.
 const black=await wall(pick.black);assert.equal(black.fill,'#26241f');await tapWall(pick.black);const refused=await toastText();
 assert.notEqual((await wall(pick.black)).status,'demolished');assert.match(refused,/no se pueden retirar|cannot be removed|不可拆除/i);
 // A wall declared «Muro portante» by the professional: its own colour (declared information), removable with a notice.
 await openPanel(pick.grey);await page.locator('#wallStructureType').selectOption('load-bearing');await page.waitForTimeout(250);
 if(mobile&&await page.locator('aside.open').count())await page.evaluate(()=>closeDrawers());
 const declared=await wall(pick.grey);assert.equal(declared.structure,'load-bearing');assert.equal(declared.source,'professional');assert.equal(declared.fill,'#5b4a3a');
 await tool('demolish');await tapWall(pick.grey);const notice=await toastText();
 assert.equal((await wall(pick.grey)).status,'demolished','a declaration alone does not block removal');
 assert.match(notice,/declarado como muro portante \(dato orientativo\)/);
 await tapWall(pick.grey);assert.notEqual((await wall(pick.grey)).status,'demolished');
 assert.deepEqual(errors,[]);
});
