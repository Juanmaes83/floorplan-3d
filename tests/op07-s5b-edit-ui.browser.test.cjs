'use strict';
// OP-07 · S5b Edición visual con interacciones REALES (ratón y teclado sobre el plano y el panel): seleccionar un muro,
// arrastrar su punto central para curvarlo, volver a la línea para enderezarlo, altura final, nivelar, dividir, deshacer
// y rehacer. Un arrastre = UNA entrada de historial y UNA escritura; la validación en vivo nunca deja el proyecto inválido.
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs/promises');
const K=require('./photo-project/kit.cjs'),F=require('./op07/fixtures.cjs');
let env;test.before(async()=>{env=await K.start();});test.after(async()=>{await env?.stop();});
// Punto de pantalla de un punto del plano (mm).
const screen=(page,pt)=>page.evaluate(({x,y})=>{const s=document.querySelector('#plan'),m=s.getScreenCTM(),q=s.createSVGPoint();q.x=x;q.y=y;const r=q.matrixTransform(m);return {x:r.x,y:r.y};},pt);
const wallOf=(page,id)=>page.evaluate(id=>structuredClone(FloorPlanApp.project.walls.find(w=>w.id===id)),id);
async function setup(viewport){
 const {context,page,watch}=await K.editor(env,{viewport});
 await context.addInitScript(()=>{});
 // Contador de escrituras de la colección (cada guardado real).
 await page.evaluate(()=>{window.__writes=0;const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(/project/.test(k))window.__writes++;return set.call(this,k,v);};});
 await page.evaluate(()=>{select(null);fitView();});
 return {context,page,watch};
}
async function selectWall(page,w){const mid={x:(w.start.x+w.end.x)/2,y:(w.start.y+w.end.y)/2},p=await screen(page,mid);await page.mouse.click(p.x,p.y);
 await page.waitForFunction(id=>ui.sel?.kind==='wall'&&ui.sel.id===id,w.id);}
const history=page=>page.evaluate(()=>({undo:undoStack.length,writes:window.__writes,version:FloorPlanApp.project.schemaVersion}));

test('S5b · arrastrar el punto: curva con UN paso de historial y UNA escritura; volver a la línea la endereza; deshacer y rehacer con teclado',{timeout:180000},async()=>{
 const {context,page,watch}=await setup({width:1440,height:900});
 try{
  const w=F.longest(await page.evaluate(()=>structuredClone(FloorPlanApp.project)));await selectWall(page,w);
  const dot=page.locator('#gSel circle[data-handle="curve"]').last();await dot.waitFor();const box=await dot.boundingBox(),c={x:box.x+box.width/2,y:box.y+box.height/2};
  const h0=await history(page);
  // Arrastre de 60 px hacia el exterior en 12 pasos.
  const n=await page.evaluate(id=>{const w=FloorPlanApp.project.walls.find(x=>x.id===id),L=Math.hypot(w.end.x-w.start.x,w.end.y-w.start.y);return {x:-(w.end.y-w.start.y)/L,y:(w.end.x-w.start.x)/L};},w.id);
  await page.mouse.move(c.x,c.y);await page.mouse.down();
  for(let i=1;i<=12;i++)await page.mouse.move(c.x+n.x*5*i,c.y+n.y*5*i);
  const during=await history(page);assert.equal(during.undo,h0.undo,'durante el arrastre no hay historial');assert.equal(during.writes,h0.writes,'ni escrituras');
  await page.mouse.up();
  const h1=await history(page),curved=await wallOf(page,w.id);
  assert.ok(curved.curve,'el muro queda curvo');assert.equal(h1.undo,h0.undo+1,'un solo paso de historial');assert.equal(h1.writes-h0.writes,1,'una sola escritura');
  assert.equal(h1.version,'2.0.0','el proyecto pasa a 2.0 al curvar');
  assert.equal(Math.abs(Math.round((await page.evaluate(id=>wallSagitta(FloorPlanApp.project.walls.find(x=>x.id===id)),w.id)))%10),0,'flecha ajustada a 10 mm');
  // Plano: piezas por faceta y el salón sigue la cara (S3b).
  assert.ok(await page.evaluate(id=>document.querySelectorAll(`#gWalls [data-wall="${id}"]`).length>4,w.id));
  // Volver a la línea endereza (un paso más).
  const box2=await page.locator('#gSel circle[data-handle="curve"]').last().boundingBox(),c2={x:box2.x+box2.width/2,y:box2.y+box2.height/2};
  await page.mouse.move(c2.x,c2.y);await page.mouse.down();for(let i=1;i<=10;i++)await page.mouse.move(c2.x+(c.x-c2.x)*i/10,c2.y+(c.y-c2.y)*i/10);await page.mouse.up();
  assert.equal((await wallOf(page,w.id)).curve,undefined,'enderezado');assert.equal((await history(page)).undo,h0.undo+2);
  // Deshacer y rehacer con el teclado.
  await page.locator('#plan').focus().catch(()=>{});await page.keyboard.press('Control+z');assert.ok((await wallOf(page,w.id)).curve,'deshacer: vuelve la curva');
  await page.keyboard.press('Control+Shift+z');assert.equal((await wallOf(page,w.id)).curve,undefined,'rehacer: recto');
  await page.keyboard.press('Control+z');await page.keyboard.press('Control+z');assert.deepEqual(await wallOf(page,w.id),w,'dos pasos atrás: el muro original');
  assert.deepEqual(watch.errors,[]);
 }finally{await context.close();}
});

test('S5b · panel: flecha y altura final, rechazo explicado sin tocar nada, nivelar, enderezar y dividir',{timeout:180000},async()=>{
 const {context,page,watch}=await setup({width:1440,height:900});
 try{
  const w=F.longest(await page.evaluate(()=>structuredClone(FloorPlanApp.project)));await selectWall(page,w);
  await page.locator('#wallShape').waitFor();assert.match(await page.locator('#wallShapeFormat').innerText(),/formato 2\.0/);
  await page.fill('#wallSagitta','500');await page.fill('#wallEndHeight','2300');await page.click('#wallApplyShape');
  let x=await wallOf(page,w.id);assert.ok(x.curve);assert.equal(x.heightEndMm,2300);
  assert.equal(Math.round(await page.evaluate(id=>wallSagitta(FloorPlanApp.project.walls.find(x=>x.id===id)),w.id)),500);
  // Rechazo: una curva imposible para el grosor no cambia nada y lo explica.
  const before=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),undo=(await history(page)).undo;
  await page.fill('#wallSagitta','90000');await page.click('#wallApplyShape');
  assert.match(await page.locator('#wallShapeStatus').innerText(),/curve/);assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),before);assert.equal((await history(page)).undo,undo);
  await page.click('#wallLevel');assert.equal((await wallOf(page,w.id)).heightEndMm,undefined,'nivelado');
  await page.click('#wallStraighten');assert.equal((await wallOf(page,w.id)).curve,undefined,'enderezado');
  await page.fill('#wallSplitAt','1200');await page.click('#wallSplit');
  const walls=await page.evaluate(()=>FloorPlanApp.project.walls.length);assert.equal(walls,(await page.evaluate(()=>JSON.parse(undoStack.at(-1)).walls.length))+1,'dividido en dos');
  // Botones de 44 px y sin desplazamiento horizontal.
  await selectWall(page,await wallOf(page,w.id));
  const fit=await page.evaluate(()=>({min:Math.min(...[...document.querySelectorAll('#wallShape .btn')].map(b=>b.getBoundingClientRect().height)),scroll:document.documentElement.scrollWidth>innerWidth+1}));
  assert.ok(fit.min>=44);assert.equal(fit.scroll,false);
  if(process.env.OP07_SHOTS){await fs.mkdir(process.env.OP07_SHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.OP07_SHOTS,'s5b-panel-1440.png')});}
  assert.deepEqual(watch.errors,[]);
 }finally{await context.close();}
});

test('S5b · dividir sobre una abertura se rechaza y la nombra; móvil 390x844 sin desplazamiento',{timeout:180000},async()=>{
 const {context,page,watch}=await setup({width:390,height:844});
 try{
  const {project,wall}=F.curved(F.base());const r=await page.evaluate(p=>FloorPlanApp.applyExtension(()=>({ok:true,project:p})),project);assert.equal(r.ok,true);
  await page.evaluate(id=>{select({kind:'wall',id});drawer('panel',true);},wall.id);await page.locator('#wallShape').waitFor();
  const door=project.openings.find(o=>o.id==='opn_op07-door');await page.fill('#wallSplitAt',String(door.offsetMm+400));
  const before=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));await page.locator('#wallSplit').scrollIntoViewIfNeeded();await page.locator('#wallSplit').click();
  assert.match(await page.locator('#wallShapeStatus').innerText(),/atraviesa una abertura/);assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),before);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  assert.deepEqual(watch.errors,[]);
 }finally{await context.close();}
});
